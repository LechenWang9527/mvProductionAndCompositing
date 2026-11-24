from PIL import Image
import sys

base = r"E:\新建文件夹\实习\MV\out\motion-v2\studies\chorus-process\v4scroll\ChorusProcessDemoV4Scroll_18_00.png"
im = Image.open(base).convert("RGB")

# 观察：画心矩形上边界附近是否露出一条「冷色/更亮」的直边
# 取竖直扫描线，看 y 方向亮度突变
for x in [300, 700, 1100, 1300]:
    col = [im.getpixel((x, y)) for y in range(200, 700)]
    lum = [0.299*r + 0.587*g + 0.114*b for (r, g, b) in col]
    diffs = [(200 + i, lum[i] - lum[i-1]) for i in range(1, len(lum))]
    top = sorted(diffs, key=lambda d: -abs(d[1]))[:6]
    print("x=%d 最大梯度: %s" % (x, [(y, round(d, 1)) for y, d in top]))

# 采样画心内部与画心外纸面的颜色，比较冷暖
def avg(box):
    r = im.crop(box)
    px = list(r.getdata())
    n = len(px)
    return tuple(round(sum(p[i] for p in px)/n, 1) for i in range(3))

print("纸面(画心左侧留白) ", avg((200, 350, 232, 600)))
print("画心天空(顶部中段)  ", avg((700, 270, 1100, 300)))
print("画心城市主体        ", avg((700, 400, 1100, 500)))
print("纸面(画心下方)      ", avg((700, 640, 1100, 670)))

# 放大上边缘一条带，便于目检
crop = im.crop((180, 220, 1420, 400)).resize((1240*1, 180*2), Image.LANCZOS)
crop.save(r"E:\新建文件夹\实习\MV\out\motion-v2\studies\chorus-process\v4scroll\_edge_top.png")
crop2 = im.crop((180, 560, 1420, 700)).resize((1240, 280), Image.LANCZOS)
crop2.save(r"E:\新建文件夹\实习\MV\out\motion-v2\studies\chorus-process\v4scroll\_edge_bottom.png")
print("saved crops")
