"""
歌词 -> 配图 批量生成（本地 SD1.5 fp16，无网络依赖）
用法：
  python gen_images.py            # 生成 manifest 里全部
  python gen_images.py dufu liubang   # 只生成指定 id
设计：
  - 统一 STYLE 前缀（木刻/铜版画），保证 12 张风格一致
  - 统一种子基 20261110 + 每张 offset，保证可复现
  - 统一 768x768；交稿后再由 photo.js 做双色调 + 半调，风格由后期收口
"""
import os, sys, json, time
os.environ.setdefault("HF_HOME", r"E:/新建文件夹/实习/MV/_trials/hf_home")
os.environ.setdefault("TRANSFORMERS_OFFLINE", "1")

import torch
from diffusers import StableDiffusionPipeline

ROOT = r"E:/新建文件夹/实习/MV"
MODEL = os.path.join(ROOT, "_trials/models/sd15")
OUT = os.path.join(ROOT, "film/media/gen")
os.makedirs(OUT, exist_ok=True)

STYLE = (
    "antique woodcut print, fine engraving, dense cross-hatching, "
    "high contrast black ink on aged paper, archival document illustration, "
    "monochrome, dramatic side light, centered composition, intricate line detail"
)
NEG = (
    "photo, photograph, 3d render, cgi, color, painting, blurry, low quality, "
    "text, watermark, signature, logo, modern clothing, cartoon, anime, "
    "extra limbs, deformed hands, extra fingers, cropped, frame, border"
)

# id: (subject, seed_offset, extra_neg)
JOBS = {
    # ---- 01 dufu：漂泊 / 茅屋 ----
    "dufu":        ("a gaunt elderly chinese poet in a worn tang dynasty robe, long thin beard, "
                    "weathered sorrowful face, standing in tall wild grass, wind blowing his robe, "
                    "full body, isolated figure", 11, ""),
    "hut":         ("a small collapsed thatched cottage in the wilderness, broken roof beams, "
                    "torn straw, wooden fence fallen over, overgrown weeds, lonely desolate", 12, ""),
    "hall":        ("a vast traditional chinese palace hall with many tiers of curved tiled roofs, "
                    "endless corridors, seen from below, grand and overwhelming, misty", 13, ""),
    # ---- 04 liubang：47 岁 / 大风 ----
    "liubang":     ("a stern middle aged chinese warlord king in han dynasty lamellar armor and flowing cloak, "
                    "short beard, holding a bronze sword point down, war banner behind him, wind, "
                    "full body, isolated figure", 21, ""),
    "banner":      ("a huge torn war banner on a tall pole in a windy plain, fabric whipping, "
                    "dust in the air, distant mountains, empty sky", 22, ""),
    "battle":      ("ancient chinese battlefield, rows of soldier silhouettes with spears and swords, "
                    "dust and smoke, torn banners, harsh backlight, no faces", 23, ""),
    # ---- 05 you-too / 07 ledger：工位 / 账本 ----
    "desk_night":  ("one bowl of instant noodles on a worn wooden office desk at night, steam rising, "
                    "single harsh lamp light from the side, papers and a pen beside it, empty room", 31, ""),
    "ledger":      ("an open old accounting ledger on a dark wooden desk, dense handwritten columns, "
                    "a fountain pen, a yellow sticky note, side light, top down view", 32, ""),
    "moving":      ("stacked cardboard boxes and a battered suitcase in an empty rented room, "
                    "bare concrete floor, single window light, loneliness", 33, ""),
    # ---- 12 finale：卓越路 / 灯 ----
    "road_lamp":   ("an empty factory access road at night, a row of street lamps receding into fog, "
                    "wet asphalt reflections, no people, no cars", 41, ""),
    "crowd_back":  ("a group of workers in identical blue uniforms seen from behind, walking away down a "
                    "long corridor, shoulders and backs only, no faces, industrial interior", 42, ""),
    "press_shop":  ("a row of heavy tire curing presses in a dim factory bay, overhead ducts, "
                    "haze, side light through the haze, no people", 43, ""),
}

def main():
    only = set(sys.argv[1:])
    torch.backends.cuda.matmul.allow_tf32 = True
    pipe = StableDiffusionPipeline.from_pretrained(
        MODEL, torch_dtype=torch.float16, variant="fp16", safety_checker=None,
        requires_safety_checker=False,
    )
    pipe = pipe.to("cuda")
    pipe.set_progress_bar_config(disable=True)
    pipe.enable_attention_slicing()

    todo = {k: v for k, v in JOBS.items() if not only or k in only}
    manifest = []
    for i, (name, (subj, off, extra)) in enumerate(todo.items()):
        t0 = time.time()
        prompt = f"{subj}, {STYLE}"
        g = torch.Generator(device="cuda").manual_seed(20261110 + off)
        img = pipe(
            prompt=prompt,
            negative_prompt=NEG + (", " + extra if extra else ""),
            num_inference_steps=22,
            guidance_scale=7.5,
            width=768, height=768,
            generator=g,
        ).images[0]
        path = os.path.join(OUT, f"{name}.png")
        img.save(path)
        dt = time.time() - t0
        print(f"[{i+1}/{len(todo)}] {name:12s} {dt:5.1f}s -> {path}", flush=True)
        manifest.append({"id": name, "prompt": prompt, "seed": 20261110 + off})

    with open(os.path.join(OUT, "gen_manifest.json"), "w", encoding="utf-8") as f:
        json.dump(manifest, f, ensure_ascii=False, indent=2)
    print("DONE", len(manifest))

if __name__ == "__main__":
    main()
