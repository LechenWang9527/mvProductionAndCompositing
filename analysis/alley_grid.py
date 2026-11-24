from PIL import Image, ImageDraw, ImageFont

src = r"E:\新建文件夹\实习\MV\film\motion-v2\public\assets\chorus-v3\alley-lamp.png"
im = Image.open(src).convert("RGB")
# 与渲染一致：objectFit cover 到 1920x1080
W, H = 1920, 1080
sw, sh = im.size
k = max(W / sw, H / sh)
nw, nh = int(sw * k + 0.5), int(sh * k + 0.5)
im2 = im.resize((nw, nh), Image.LANCZOS)
left = (nw - W) // 2
top = (nh - H) // 2
im2 = im2.crop((left, top, left + W, top + H))

d = ImageDraw.Draw(im2)
try:
    font = ImageFont.truetype(r"C:\Windows\Fonts\consola.ttf", 20)
except Exception:
    font = ImageFont.load_default()

for x in range(0, W, 100):
    c = (255, 60, 60) if x % 500 == 0 else (90, 190, 255)
    d.line([(x, 0), (x, H)], fill=c, width=2 if x % 500 == 0 else 1)
    d.text((x + 3, 4), str(x), fill=(255, 255, 255), font=font)
    d.text((x + 3, H - 26), str(x), fill=(255, 255, 255), font=font)
for y in range(0, H, 100):
    c = (255, 60, 60) if y % 500 == 0 else (90, 190, 255)
    d.line([(0, y), (W, y)], fill=c, width=2 if y % 500 == 0 else 1)
    d.text((4, y + 2), str(y), fill=(255, 255, 255), font=font)

im2.save(r"E:\新建文件夹\实习\MV\out\v4scroll_check\_alley_grid.png")
print("saved", im2.size)
