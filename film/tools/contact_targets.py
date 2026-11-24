# 拼一张「这次要出图的 11 个位置」的对照表：左边是现在的画面，右边标出图要放哪
import os, json
from PIL import Image, ImageDraw, ImageFont

ROOT = r"E:/新建文件夹/实习/MV"
FRAMES = os.path.join(ROOT, "docs/refs/film_frames")
OUT = os.path.join(ROOT, "docs/refs/contact_targets.jpg")

# (img id, 秒, 镜号, 放哪, 歌词)
T = [
    ("IMG01 杜甫像",      31, 6,  "档案卡人像窗", "我是杜甫"),
    ("IMG03 长安坊格",    35, 7,  "满幅背景",     "四十岁还在长安租房"),
    ("IMG02 快塌的茅屋",  39, 8,  "满幅背景",     "后来总算有了茅屋"),
    ("IMG04 广厦千万间",  43, 9,  "右侧竖幅",     "安得广厦千万间"),
    ("IMG11 凌晨的泡面",  65, 13, "方形插图窗",   "你凌晨两点那碗泡面"),
    ("IMG05 刘邦像",      92, 20, "档案卡人像窗", "我是刘邦"),
    ("IMG06 酒爵长案",    97, 21, "满幅背景",     "我爹当着亲戚的面说"),
    ("IMG07 举爵的手",   102, 22, "画面中心主体", "爹 牌还没发完"),
    ("IMG08 古战场",     113, 26, "满幅背景",     "我打了七年仗"),
    ("IMG09 大风与破旗", 129, 32, "满幅背景",     "大风起兮云飞扬"),
    ("IMG10 卓越路夜路", 289, 83, "满幅背景",     "站在卓越路上"),
]

COLS = 4
TW, TH = 480, 270          # 缩略图
PAD = 18
LABEL_H = 64
ROWS = (len(T) + COLS - 1) // COLS
W = COLS * (TW + PAD) + PAD
H = ROWS * (TH + LABEL_H + PAD) + PAD + 70

sheet = Image.new("RGB", (W, H), (12, 12, 13))
d = ImageDraw.Draw(sheet)

def font(sz, bold=False):
    for p in [r"C:/Windows/Fonts/msyhbd.ttc" if bold else r"C:/Windows/Fonts/msyh.ttc",
              r"C:/Windows/Fonts/simhei.ttf"]:
        if os.path.exists(p):
            try: return ImageFont.truetype(p, sz)
            except Exception: pass
    return ImageFont.load_default()

f_title = font(30, True)
f_name  = font(21, True)
f_meta  = font(17)

d.text((PAD, PAD), "这次要出的 11 张图 —— 每张对应哪一秒、放在画面哪个位置",
       font=f_title, fill=(232, 226, 208))

y0 = PAD + 56
for i, (name, sec, shot, where, lyric) in enumerate(T):
    r, c = divmod(i, COLS)
    x = PAD + c * (TW + PAD)
    y = y0 + r * (TH + LABEL_H + PAD)
    src = os.path.join(FRAMES, "t%04d.jpg" % sec)
    if os.path.exists(src):
        im = Image.open(src).convert("RGB").resize((TW, TH), Image.LANCZOS)
        sheet.paste(im, (x, y))
    else:
        d.rectangle([x, y, x + TW, y + TH], outline=(90, 80, 60))
        d.text((x + 20, y + TH // 2), "missing t%04d" % sec, font=f_meta, fill=(200, 120, 100))
    d.rectangle([x, y, x + TW, y + TH], outline=(150, 130, 90))
    d.text((x, y + TH + 6), name, font=f_name, fill=(240, 200, 90))
    d.text((x, y + TH + 32), "%d:%02d · 第 %d 镜 · %s" % (sec // 60, sec % 60, shot, where),
           font=f_meta, fill=(170, 165, 150))
    d.text((x, y + TH + 50), "歌词：" + lyric, font=f_meta, fill=(120, 160, 130))

sheet.save(OUT, quality=88)
print("ok", OUT, sheet.size, os.path.getsize(OUT))
