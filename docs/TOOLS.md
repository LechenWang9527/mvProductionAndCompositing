# 工具盘点：中文歌词 MV 项目（实测版）

> 面向本仓库：纯程序化 Canvas 渲染 + 逐帧导出；Windows / Node 26 / Python 3.12 / RTX 3050 6GB；
> 无系统 ffmpeg，只有 `ref_mv/node_modules/ffmpeg-static` 与 `imageio-ffmpeg`。
>
> **证据层在 [`docs/notes/tools_trials.md`](notes/tools_trials.md)**：每条结论都能在那里找到命令、原始输出与耗时。
> 本文件只给结论、推荐、失败记录、接线建议和坑。
>
> 判决口径：
> - **能用** = 本机跑过并产出正确文件
> - **能用但要改造** = 装得上/跑得动，但要补胶水或它的定位与本项目不同
> - **不能用** = 实测失败、或依赖付费服务、或形态不匹配（如必须人点 UI）
> - **未实测** = 没跑完，本文不编造数据

---

## ① 四类结论表

### A. 歌词 MV / 卡点 / 可视化项目

| 名称 | 链接 | 能干什么 | 实测结果 | 判决 |
|---|---|---|---|---|
| **本仓库 `mv_engine`**（对照组） | 本地 `mv_engine/render.mjs` | Chrome 逐帧取 canvas → NVENC 编码 | `300 frames @ 30fps`，`render 17.97s = 16.69 fps · 59.9 ms/frame`，输出 5.24MB 720p30；`canvas draw cost: 1.5 ms/frame` | **能用**（本项目基线，最快） |
| **Remotion 4.0.542** | https://github.com/remotion-dev/remotion | React 组件即帧，CLI 批量渲染；中文字幕、spring 动画 | 装 `@remotion/cli@4 react@19 react-dom@19` = 242 包/252M；`remotion browser ensure` 下 131.1MB headless shell；渲 300 帧 = **31s（9.7fps）**，718,585 bytes h264 1280x720；抽帧确认「第一行 中文歌词」正常 | **能用但要改造**①入口必须 `registerRoot`；②必须重定向 TMP；③速度不如现有引擎 |
| **ialakey/music-video-generator**（7★ MIT） | https://github.com/ialakey/music-video-generator | 音频编辑片模板：封面+模糊背景+频谱+进度条，6 种 visualizer 6 种 preset，RGB 帧走 stdin 喂 ffmpeg | 系统 Python 直接跑（仅需 numpy+pillow）；`render` 6s 720p30 = **28s，180 帧，6.7MB**，h264+aac 校验通过；`still` 单帧 23s / 2.46MB | **能用但要改造**：无 .lrc 解析、无逐句歌词、无中文断句；6.4fps 偏慢 |
| **motion-canvas 3.17.2**（20k★ MIT） | https://github.com/motion-canvas/motion-canvas | 代码驱动动画（信号/时间轴），`@motion-canvas/ffmpeg` 导出 | `npm i @motion-canvas/{core,2d,ffmpeg,vite-plugin}` = 74 包/37s，`247M` node_modules，版本 3.17.2 | **能用但要改造**：**端到端出片未实测**；本质仍是 vite 页面 + headless 截图 |
| **dotslashgabut/immersive-audio-player**（19★） | https://github.com/dotslashgabut/immersive-audio-player-lyric-video-maker | 浏览器端歌词 MV App：`.lrc`(含 Enhanced/Karaoke)/`.srt`/`.vtt` 导入导出，ffmpeg.wasm 或 WebCodecs 逐帧，H.264/VP9/AV1，歌单批渲 | 读源码：`utils/ffmpegRenderer.ts`（`@ffmpeg/ffmpeg` wasm 逐帧）、`utils/canvasRenderer.ts`（`drawCanvasFrame(ctx,w,h,time,lyrics,...)`）、`utils/lyricVisibility.ts`、`utils/parsers.ts` | **不能用（作为引擎）**：纯交互式 App，要人点 UI 导出，无 CLI |
| **chrimage/ai-lyric-video-generator**（14★） | https://github.com/chrimage/ai-lyric-video-generator | 用 AI 生成概念图 + 歌词视频 | `pyproject` 依赖 `google-genai>=1.7.0`、moviepy、yt-dlp | **不能用**：付费 Gemini API |
| **wwwtyro/canvas-video-generator**（Unlicense） | https://github.com/wwwtyro/canvas-video-generator | canvas 逐帧 → POST `/addFrame` → 服务端 ffmpeg 拼接 | `npm i` = 422 包/40s；`node index.js --help` 正常，Node 26 无报错；端口默认 3172 | **能用但要改造**：**完整出片未实测**；2016 年依赖、无歌词逻辑，只值得抄架构 |

> 小结：**没有一个现成项目能直接产出「中文逐句歌词 MV」**。最接近的是 immersive-audio-player，
> 但它是给人点的 App。真正的路线是「现有 `mv_engine` + 借鉴 immersive 的 `drawCanvasFrame` 布局思路」。

### B. 音频分析

| 名称 | 链接 / 版本 | 能干什么 | 实测结果 | 判决 |
|---|---|---|---|---|
| **librosa 1.0.0**（+numpy 2.2.6 / numba 0.68.1 / scipy 1.18.1） | https://github.com/librosa/librosa | BPM、`beat_track`、`onset_detect`、`onset_strength`、chroma、HPSS、piptrack 音高 | venv 367M；`import 4.54s`；306s 音频全流程 **29.59s**：`onset_strength 3.60s`（13174 帧 @43.066fps）、`beat_track 5.40s → tempo=[129.199] beats=647`、`onset_detect 3.32s onsets=1214`、`piptrack 10s: 3.68s`、`hpss 16.73s`、`chroma 0.61s` | **能用**（唯一跑通的完整音频库） |
| **项目自带 numpy 分析器** | 本地 `analysis/analyze_real.py` | 频谱通量 onset + 自相关 BPM + 穷举相位 beat 网格 + RMS 段落 | `features_real.json`：`bpm 64.6`、`329 beats`、`914 onsets`、`dur 305.876`；拍点对 onset 的 60ms 命中率 **35.56%**（librosa 只有 1.23–1.85%） | **能用**（且对齐质量更好，别急着换） |
| **aubio** | https://github.com/aubio/aubio | onset/BPM/音高，轻量 C 库 | `pip install --only-binary=:all: aubio -i 清华源` → `ERROR: Could not find a version that satisfies the requirement aubio (from versions: none)`；`import aubio` → `ModuleNotFoundError` | **不能用**：无 py3.12 win wheel |
| **madmom** | https://github.com/CPJKU/madmom | RNN/DBN 级 beat & downbeat 检测（质量通常最好） | 二进制轮 no versions；退回 sdist → `ModuleNotFoundError: No module named 'Cython'`，`error: subprocess-exited-with-error` | **不能用**：无 wheel + sdist 构建链断 |
| **demucs**（htdemucs） | https://github.com/facebookresearch/demucs（10k★ MIT） | 4-stem 人声/鼓/贝斯/其他分离 | torch 2.5.1+cu121 就位（`cuda True`、`vram 6.00GB`），但 `demucs MISSING`、`torchaudio MISSING`；试装被 kill | **未实测**（前置条件已备：GPU+torch 可用，htdemucs 权重仅 ~80MB） |
| **audio-separator**（python-audio-separator） | https://github.com/nomadkaraoke/python-audio-separator（1.5k★ MIT） | ONNX 版 UVR 人声分离，CPU 也能跑 | 未开始 | **未实测** |

> 关键实测结论（半速问题）：`start_bpm` 先验决定 librosa 给 64.6 还是 129.2——
> `start_bpm=60/64.6/80 → 64.60`、`start_bpm=100/120/140 → 129.20`，而两者在 onset 包络上的
> 拟合分几乎相同（`64.60 fit=1.9786` vs `129.20 fit=1.9508`）。
> **librosa 不会替你判定"哪一半是正拍"。**

### C. 本地 / 云端 AI 出图

| 名称 | 链接 / 版本 | 能干什么 | 实测结果 | 判决 |
|---|---|---|---|---|
| **torch 2.5.1+cu121**（基建） | https://pytorch.org | GPU 推理底座 | `cuda_avail True`；`vram_GB 6.44`；`alloc_ok` 到 5120MB；`fp16_matmul_2048 x50: 0.26s -> 3.3 TFLOPS` | **能用** |
| **SD1.5 fp16 权重**（获取） | `hf-mirror.com/stable-diffusion-v1-5/...` | 出图底座 | HF 直连 20s **0 字节**；hf-mirror **2.27–3.40 MB/s**；已下 `unet fp16 1,719,125,304 bytes (418s)`、`text_encoder 246MB (61s)`、`vae 167MB (41s)`，合计 2.6G | **能用**（权重可获取，约 10 分钟） |
| **SD1.5 推理（6GB）** ⭐ | diffusers 0.31.0 + torch 2.5.1+cu121 | 512/768 fp16 出图 | **跑通了**：`loaded in 1.00s`、`vram after .to(cuda): 2.02 GB`；512×512/20 步 **4.50s**（峰值 **2.62GB**）、768×768/20 步 **13.55s**（峰值 **3.37GB**，输出 1,038,915 bytes）；四次采样 `TOTAL 61.2s`。768 图内容与 prompt 对得上（雨夜街景/青橙调/胶片颗粒） | **能用**（6GB 完全够，峰值仅占 52% 显存） |
| **SDXL（6GB）** | — | 1024 高分辨率出图 | 未下载实测（unet fp16 ≈5.2GB，按 3MB/s 需 30 分钟+） | **未实测**，但**有依据的不推荐**：SD1.5 unet 1.7GB 时峰值 3.37GB，SDXL unet 5.2GB + 双 text encoder 1.4GB ⇒ 超 6.44GB 必 OOM，除非 sequential offload（速度掉到分钟/张） |
| **Flux.1-dev/schnell（6GB）** | — | 最高画质 | 未下载 | **未实测**；Flux unet 级 11–23GB fp16，6GB 显存属于 `--lowvram` 都难救的量级，直接放弃 |
| **ComfyUI** | https://github.com/comfyanonymous/ComfyUI | 节点式出图工作流 | 全盘 find：**机器上没有任何 ComfyUI / stable-diffusion / sd-webui 目录** | **未实测**（要从零装，成本高） |
| **不用 AI 出图的替代（推荐）** | 本项目已具备 | 纯 Canvas：渐变/噪点/粒子/three.js/裁切已有素材 | `mv_engine` 实测 **16.69 fps** 720p30，canvas 绘制仅 1.5ms/帧 | **能用**（本项目实际路线） |

> 小结：**6GB 跑 SD1.5 完全没问题**（768×768/20 步 13.55s，峰值 3.37GB），
> 但 SDXL/Flux 是另一个量级，不要碰。**对本项目而言 AI 出图不是必需品**——
> 只有做照片级背景板时才值得，程序化 Canvas 已经够用且快 9000 倍（1.5ms vs 13.55s）。

### D. 本机 skill / 插件 / app

| 名称 | 位置 / 版本 | 能干什么 | 在本 MV 项目里值不值得用 | 判决 |
|---|---|---|---|---|
| **`playwright` skill** | `C:/Users/WangLC/.codex/skills/playwright`（wrapper `scripts/playwright_cli.sh` → `npx --package @playwright/cli playwright-cli`） | 真浏览器导航/表单/截图/快照 | **值得**：渲染页 DOM 快照、对不齐时抓帧对比。但项目已有 `playwright-core@1.63.0`，`mv_engine/render.mjs` 已在用（`[render] browser: chrome`） | **能用**（能力重复，价值在调试） |
| **`local-browser` skill** | `C:/Users/WangLC/.codex/skills/local-browser` | 常驻后台浏览器，给动态页/评论/登录态用 | **低**：MV 不需要登录态页面 | 能用但本项目用不上 |
| **`office-*`（7 个）** | `E:/apps/DSH/resources/runtime/office-skills/` | docx/xlsx/pptx 读写、渲染、导 PDF、重算公式 | **中**：交付文档（分镜表、歌词表、`TOOLS.md`→docx）用得上；不是渲染链的一环 | **能用**（交付环节） |
| **`imagegen`（.system）** | `C:/Users/WangLC/.codex/skills/.system/imagegen` | AI 出图 | **不能用**：默认走内置 `image_gen` 工具（本会话没有），兜底 `scripts/image_gen.py` 需 `OPENAI_API_KEY` | **不能用** |
| **`nature-figure` / `academic-figure`** | `C:/Users/WangLC/.codex/skills/` | 出版级图表（matplotlib/SVG） | **低-中**：做"分镜节奏曲线/能量包络图"时可用；出 MV 画面用不上 | 能用但与画面无关 |
| **`broad-web-research` / `paper-lookup`** | 同上 | 带引用的检索 | **中**：查渲染/编码参数、找参考 MV 时省时间 | 能用 |
| **`modlens`（插件 3.27.2）** | `C:/Users/WangLC/.dsh/profiles/desktop/package.json` | 读图（vision bridge） | **值得**：验收渲染帧时直接读图，不用人眼比对 | **能用** |
| **其余插件（223 total）** | `plugin_manager list_plugins` | — | **0 命中** video/render/ffmpeg/canvas 关键词 | **没有视频类插件** |

> `.dsh/skills` 不存在；技能真身在 `C:/Users/WangLC/.codex/skills/`（28 个条目）。
>
> 小结：**真正能提升本项目效率的只有 `modlens`（读帧验收）和 `playwright`（调试渲染页）**；
> office-* 用在做交付文档；imagegen 因缺内置工具+API key 不可用；223 个插件里没有一个是视频/渲染类。

---

## ② 如果你只想装一个，装这个

### 推荐 1：`@ffprobe-installer/ffprobe`（先装这个，否则什么都跑不了）

```bash
cd ref_mv && npm install --no-audit --no-fund @ffprobe-installer/ffprobe
cp node_modules/@ffprobe-installer/win32-x64/ffprobe.exe ../_trials/bin/
cp node_modules/ffmpeg-static/ffmpeg.exe ../_trials/bin/
export PATH="E:/新建文件夹/实习/MV/_trials/bin:$PATH"
ffprobe -version   # → ffprobe version 2023-02-13-git-2296078397-essentials_build-www.gyan.dev
```

理由：`ffmpeg-static` **只有 ffmpeg.exe，没有 ffprobe.exe**，而 Remotion、ialakey、几乎所有
"导出后自检"脚本第一件事就是查 ffprobe。58 秒解决，收益最大。

### 推荐 2：`librosa`（音频事件的地基，但按本仓库的慢配方装）

```bash
python -m venv _trials/venv_librosa
_trials/venv_librosa/Scripts/python.exe -m pip install \
  -i https://mirrors.aliyun.com/pypi/simple --only-binary=:all: \
  numpy scipy soundfile soxr audioread pooch joblib decorator lazy_loader msgpack numba
_trials/venv_librosa/Scripts/python.exe -m pip install \
  -i https://mirrors.aliyun.com/pypi/simple --only-binary=:all: librosa --no-deps
```

理由：BPM/beat/onset/chroma 一次到位，306s 音频 29.59s 跑完。**注意**：默认源和清华源都会卡死
（numba 那一步），必须逐包 + 阿里云 + 只装 wheel。

### 推荐 3：**不装新东西**——用现有 `mv_engine`

```bash
node mv_engine/render.mjs --fps 30 --from 0 --to 10 --out out/final.mp4
# render 17.97 s for 300 frames = 16.69 fps · 59.9 ms/frame
```

理由：它已经是**本机最快的 720p30 出片路径**（比 Remotion 快 1.7 倍、比 ialakey 快 2.6 倍），
canvas 绘制只占 1.5ms/帧，瓶颈在 NVENC 编码。引入 Remotion 只会多 252MB 依赖和一套 React 心智负担。

---

## ③ 实测失败记录

| 装了什么 | 报什么错（原文） | 怎么绕过 |
|---|---|---|
| `pip install librosa`（默认源） | 挂起，无输出；venv 停在 13M（只有 pip） | 换阿里云源 + **逐包**装 + `--only-binary=:all:` |
| 同上（清华源） | 停在 `Collecting numba>=0.61.0 ... numba-0.68.1-cp312-cp312-win_amd64.whl (2.8 MB)`，8s 目录零增长 | 同上；numba 单独装耗时 115s（含 llvmlite 41.9MB） |
| `pip install aubio` | `ERROR: Could not find a version that satisfies the requirement aubio (from versions: none)` / `No matching distribution found for aubio` | **无解**（py3.12 无 wheel）；用 librosa 的 onset/beat 替代 |
| `pip install madmom` | 二进制轮同上；sdist → `ModuleNotFoundError: No module named 'Cython'` + `error: subprocess-exited-with-error` | **无解**（除非装 MSVC + Cython 自行编译，不建议） |
| `npx remotion render src_Root.jsx ...` | `Error: You passed ...src_Root.jsx as your entry point, but this file does not contain "registerRoot"` | 新增 `src_index.jsx`：`import {registerRoot} from 'remotion'; import {Root} from './src_Root.jsx'; registerRoot(Root);` |
| Remotion 渲到第 152 帧 | `Error: FFmpeg quit with code 4294967283 while piping frame 152` / `Error opening output C:\Users\WangLC\AppData\Local\Temp\react-motion-renderogoC6Z\pre-encode.mp4: Permission denied` | `export TMP=...TEMP=...TMPDIR=...` 指向工作区；见坑 #1 |
| ialakey `still` 首次 | `Error: ffmpeg exited with code 4294967283` / `Error opening output ...\Temp\musicvideo-still-xxx\audio.wav: Permission denied` | 同上，重定向 TMP 后 23s 出图 |
| ialakey 无 ffprobe | `Error: ffprobe not found. Install ffmpeg and add it to PATH.` | 装 `@ffprobe-installer/ffprobe` 并加入 PATH |
| `python -m musicvideo.cli render ... --duration 8` | `musicvideo: error: unrecognized arguments: --duration 8` | 参数是 `--length`（不是 `--duration`），见 `render --help` |
| `librosa.beat.tempo(...)` | `AttributeError: module 'librosa.beat' has no attribute 'tempo'. Did you mean: '_tempo'?` | 1.0.0 已移除；改用 `librosa.feature.tempo` 或 `beat_track(..., bpm=...)` |
| `diffusers 0.42.1` + `torch 2.5.1` | `AttributeError: module 'torch' has no attribute 'accelerator'`（`diffusers/utils/torch_utils.py:245`） | 降级 `diffusers==0.31.0`、`transformers==4.46.3`（或升 torch≥2.6） |
| diffusers 加载本地 fp16 目录 | `OSError: Error no file named pytorch_model.bin, model.safetensors, tf_model.h5, model.ckpt.index or flax_model.msgpack found in directory .../sd15\text_encoder` | 加 `variant="fp16"`（镜像上只有 `model.fp16.safetensors`） |
| transformers 首次加载 | `There was a problem when trying to write in your cache folder (C:\Users\WangLC\.cache\huggingface\hub)` | `export HF_HOME=..._trials/hf_home`（迁移一次后消失） |
| HF 直连下模型 | `http=000 size=0 speed=0`（20s 零字节） | 全部走 `hf-mirror.com`（2.3–3.4MB/s） |
| `curl` 下 gated 仓文件 | `401`（hf-mirror 对 gated 模型 resolve 仍 401） | 用非 gated 仓（如 `Lykon/dreamshaper-8`），或自带 token |
| GitHub REST API | `API rate limit exceeded for 212.107.28.52`（第 5 个请求就挂） | 用 `raw.githubusercontent.com/<repo>/HEAD/README.md` 读 README，用 `img.shields.io/github/stars/<repo>.json` 取元数据 |
| pip 装 torchaudio+demucs 与 diffusers **并发** | 两任务抢同一 venv 的 pip 锁（日志停在 `=== torchaudio ===`），只能 kill 一个 | 同一个 venv **一次只跑一个 pip** |
| `| tail -N` 取日志 | 进程结束前日志文件一直为空，误判卡死 | 直接 `> log 2>&1` + `timeout`，不要管道 |
| `wmic` | `timeout: failed to run command 'wmic'` | MSYS 里没有；用 `tasklist` |

---

## ④ 对本项目的具体接线建议

### 4.1 整条链路（推荐）

```
音频 ──[librosa 离线分析]──> features.json（bpm/beats/onsets/rms/chroma）
                                      │
                      ┌───────────────┴────────────────┐
                      ▼                                ▼
            mv_engine（Canvas 逐帧）            QA：抽帧 + modlens 读图
                      │
              Chrome headless 取帧 → NVENC
                      ▼
                 out/final.mp4
```

**不要**引入 Remotion/motion-canvas 做主线：现有 `mv_engine` 已 16.69 fps，换框架只会更慢。

### 4.2 各环节用什么 + 命令

**环节 1：音频分析（离线，一次性）**

下面这段**是本机跑过的原样脚本**（`_trials/scripts/librosa_features.py`，输出 `analysis/features_librosa.json`）：

```bash
export PYTHONIOENCODING=utf-8
_trials/venv_librosa/Scripts/python.exe - <<'PY'
import librosa, numpy as np, json
y, sr = librosa.load("analysis/og_22050.wav", sr=22050, mono=True)
oe = librosa.onset.onset_strength(y=y, sr=sr, hop_length=512)
tempo = librosa.feature.tempo(onset_envelope=oe, sr=sr, hop_length=512)   # 不是 librosa.beat.tempo
_, beat_t = librosa.beat.beat_track(onset_envelope=oe, sr=sr, hop_length=512, bpm=float(tempo[0]))
on = librosa.onset.onset_detect(onset_envelope=oe, sr=sr, hop_length=512, units="time")
json.dump({"bpm": float(tempo[0]),
           "beats": [float(x) for x in beat_t],
           "onsets": [float(x) for x in on]},
          open("analysis/features_librosa.json", "w"))
print("bpm", float(tempo[0]), "beats", len(beat_t), "onsets", len(on))
PY
```

实测输出（`_trials/logs/librosa_features.log`，306s 音频）：

```
tempo type ndarray shape (1,) value [129.19921875]
wrote features_librosa.json  bpm 129.19921875 beats 647 onsets 1214
bytes 28981
TOTAL 4.89s
```

注意 `librosa.feature.tempo` 返回的是 **ndarray**，要 `float(tempo[0])`。

**环节 2：BPM 拍数裁决（必做，见坑 #4）**

```bash
# 现有 numpy 版：features_real.json → bpm 64.6 / 329 beats
# librosa：features_librosa.json → bpm 129.20 / 647 beats  ← 刚好 2 倍
# 判定依据：用 onset 命中率 + 每小节歌词字数，人工定一次，写进 config
```

**环节 3：渲染**

```bash
export PATH="E:/新建文件夹/实习/MV/_trials/bin:$PATH"
node mv_engine/render.mjs --fps 30 --from 0 --to <end> --out out/final.mp4
# 参考：300 帧 17.97s，h264_nvenc，5.24MB
```

**环节 4：导出后自检**

```bash
ffprobe -v error -show_entries format=duration,size,bit_rate \
  -show_entries stream=codec_name,width,height,r_frame_rate,nb_frames \
  -of default=noprint_wrappers=1 out/final.mp4
ffmpeg -hide_banner -loglevel error -y -ss 5 -i out/final.mp4 -frames:v 1 qa_frame.png
# 然后用 modlens（读图插件）或 read_image 看 qa_frame.png
```

**环节 5（可选）：想抄现成的歌词版式**

```bash
# 拿 immersive-audio-player 的 drawCanvasFrame 思路（不要它的打包产物）
node -e "console.log(require('fs').readFileSync('_trials/repos/dotslashgabut_immersive-audio-player-lyric-video-maker/utils/canvasRenderer.ts','utf8').slice(0,4000))"
```

### 4.3 如果一定要 AI 出图（6GB 的可行做法，已实测）

服务器/本机实测配方（`_trials/venv_torch` + `_trials/models/sd15`）：

```bash
export HF_HOME="E:/新建文件夹/实习/MV/_trials/hf_home"
export PYTHONIOENCODING=utf-8
_trials/venv_torch/Scripts/python.exe _trials/scripts/sd15_infer.py
```

实测输出：

```
torch 2.5.1+cu121
loaded in 1.00s
vram after .to(cuda): 2.02 GB
OK 512x512 steps=12  14.31s  0.84 it/s  peak_vram=2.62GB  file=465198 bytes
OK 768x768 steps=12   9.03s  1.33 it/s  peak_vram=3.37GB  file=1024292 bytes
OK 512x512 steps=20   4.50s  4.45 it/s  peak_vram=2.62GB  file=468290 bytes
OK 768x768 steps=20  13.55s  1.48 it/s  peak_vram=3.37GB  file=1038915 bytes
TOTAL 61.2s
```

要点：
1. **SD1.5 @768/20 步 = 13.55s，峰值 3.37GB** —— 6GB 卡绰绰有余。
2. 必须 `variant="fp16"`，因为镜像上只有 `*.fp16.safetensors`（否则报
   `OSError: Error no file named pytorch_model.bin, model.safetensors ... found in ...text_encoder`）。
3. 版本必须锁：`diffusers==0.31.0`、`transformers==4.46.3`（配 torch 2.5.1），
   0.42.1 会因 `torch.accelerator` 缺失直接 import 崩。
4. **SDXL/Flux 不要碰**：SD1.5 的 unet 1.7GB→峰值 3.37GB；SDXL unet 5.2GB + 双 text encoder
   1.4GB 必然超过 6.44GB，除非 sequential offload（分钟级/张）。
5. **但在这个项目里 AI 出图仍是负担**：`mv_engine` 的 canvas 绘制只要 1.5ms/帧，
   一张 13.55s 的 AI 图 vs 一帧 1.5ms 的程序化背景——除非真的需要照片级质感。

### 4.4 失败的路线（别走）

- 装 aubio / madmom 做 beat：无 wheel，浪费时间。
- 用 `imagegen` skill 出图：本会话没有 `image_gen` 工具，也没有 `OPENAI_API_KEY`。
- 接 immersive-audio-player 做引擎：浏览器交互式，无法批处理。
- 接 ai-lyric-video-generator：付费 Gemini API。

---

## ⑤ 5 个坑

### 坑 1：ffmpeg 子进程写不了 `%TEMP%`（最致命）

现象（Bash 和 Python 都能写，只有 ffmpeg 不能）：

```
$ ffmpeg ... -y "%TEMP%/x.wav"
Error opening output C:/Users/WangLC/AppData/Local/Temp/dsh_probe.wav: Permission denied
[out#0/wav] Error opening output file ... Permission denied
FF_RC=-13
```

连带炸掉 Remotion（`pre-encode.mp4`）、ialakey（`audio.wav`）。
**修法**：所有用到 ffmpeg 的命令前，把临时目录指到工作区：

```bash
export TMP="E:/新建文件夹/实习/MV/_trials/tmp"
export TEMP="$TMP"; export TMPDIR="$TMP"
```

### 坑 2：`ffmpeg-static` 没有 ffprobe

`ref_mv/node_modules/ffmpeg-static/` 只有 `ffmpeg.exe`。任何"先探测再编码"的工具会直接死：
`Error: ffprobe not found. Install ffmpeg and add it to PATH.`
**修法**：`npm i @ffprobe-installer/ffprobe`，把它和 ffmpeg.exe 一起软链进 `_trials/bin/` 并 `export PATH`。

### 坑 3：`librosa 1.0.0` 删了 `librosa.beat.tempo`

```
AttributeError: module 'librosa.beat' has no attribute 'tempo'. Did you mean: '_tempo'?
```

网上 90% 的教程代码会当场报废。**修法**：用 `librosa.feature.tempo(onset_envelope=...)`，
或用 `beat_track(..., bpm=129.2)` 强制给速度。**装的时候也一样**：默认源/清华源会卡在 numba，
必须逐包 + 阿里云 + `--only-binary=:all:`。

### 坑 4：BPM 半速/全速是"选择题"，不是"计算结果"

同一份 306s 音频，四个数字都能自圆其说：

```
numpy 实现      → 64.6   BPM, 329 beats
librosa 默认     → 129.20 BPM, 647 beats   (start_bpm≥100)
librosa 保守     → 64.60  BPM, 333 beats   (start_bpm≤80)
mv_engine 自报   → 96.01  BPM
```

而且所有网格的最近 onset 中位距离都是 **0.093s**——即拍点普遍比 onset 晚约 93ms。
**修法**：① 在 config 里锁死一个 BPM 与 `beat_offset`，不要让两个模块各算一次；
② 歌词入场/特效给 **±90ms 容差**；③ 用"每小节字数"人工校一次半速/全速。

### 坑 5：`Temp` 之外，**同一个 venv 不能并行 pip**

实测：torchaudio+demucs 与 diffusers 同时 `pip install` 到 `_trials/venv_torch`，
两个任务都卡住（日志停在 `=== torchaudio ===`），必须 kill 一个。
另外 `pip` 走默认源时会**静默挂死**（无报错、无进度、目录不涨）——不要等，
加 `timeout` 并换阿里云源。同类问题还有：`| tail -N` 会让日志缓冲到进程结束
（日志文件长时间为空 = 看起来像卡死）；
GitHub REST API 未认证时第 5 个请求就 `API rate limit exceeded`（改用 raw README + shields.io）。
