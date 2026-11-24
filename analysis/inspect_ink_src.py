from PIL import Image
im = Image.open(r"E:\新建文件夹\实习\MV\film\motion-v2\public\assets\changan_ink_v2.png").convert("RGB")
W, H = im.size
print("size", W, H)
# 边缘与四角采样
pts = {
    "TL": (4, 4), "TR": (W-5, 4), "BL": (4, H-5), "BR": (W-5, H-5),
    "top_center": (W//2, 2), "sky_mid": (W//2, int(H*0.12)),
    "row_y5": (W//2, 5), "row_y20": (W//2, 20),
}
for k, (x, y) in pts.items():
    print(k, (x, y), im.getpixel((x, y)))

# 每行平均亮度（看顶部是否有渐变边）
for y in [0, 1, 2, 3, 4, 6, 8, 12, 20, 40, 80]:
    row = [im.getpixel((x, y)) for x in range(0, W, 17)]
    n = len(row)
    m = tuple(round(sum(p[i] for p in row)/n, 1) for i in range(3))
    print("row y=%3d mean=%s" % (y, m))

# 每列平均亮度（左右边缘）
for x in [0, 1, 2, 3, 5, 10, W-11, W-6, W-3, W-1]:
    col = [im.getpixel((x, y)) for y in range(0, H, 13)]
    n = len(col)
    m = tuple(round(sum(p[i] for p in col)/n, 1) for i in range(3))
    print("col x=%4d mean=%s" % (x, m))
