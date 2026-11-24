from PIL import Image
import glob, os

files = sorted(glob.glob(r"E:\新建文件夹\实习\MV\out\motion-v2\studies\chorus-process\v4scroll\..\v4scroll\scan\*.jpg"))
alt = sorted(glob.glob(r"E:\新建文件夹\实习\MV\out\v4scroll_check\scan\*.jpg"))
files = alt
print("frames", len(files))
for i, f in enumerate(files):
    im = Image.open(f).convert("L")
    W, H = im.size
    # 卷轴段的特征：中央带（y 0.3-0.62）平均亮度很高（纸面），而 JourneyProcess 场景整体暗
    band = im.crop((int(W*0.25), int(H*0.28), int(W*0.75), int(H*0.62)))
    px = list(band.getdata())
    m = sum(px) / len(px)
    n = 555 + i
    print("n=%d mean=%.1f" % (n, m))
