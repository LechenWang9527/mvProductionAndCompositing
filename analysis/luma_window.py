"""luma_window.py —— 打印某时间段的逐帧亮度，定位闪动来源

用法: python analysis/luma_window.py <video> <start> <end> [--fps 60]
"""
import subprocess
import sys

FFMPEG = r"E:\新建文件夹\实习\MV\ref_mv\node_modules\ffmpeg-static\ffmpeg.exe"
W, H = 64, 36
NPIX = W * H


def main():
    video = sys.argv[1]
    a = float(sys.argv[2])
    b = float(sys.argv[3])
    fps = 60
    if "--fps" in sys.argv:
        fps = int(sys.argv[sys.argv.index("--fps") + 1])

    cmd = [FFMPEG, "-v", "error", "-ss", str(a), "-t", str(b - a), "-i", video,
           "-vf", f"scale={W}:{H}:flags=area,format=gray",
           "-f", "rawvideo", "-pix_fmt", "gray", "-"]
    p = subprocess.Popen(cmd, stdout=subprocess.PIPE, stderr=subprocess.PIPE)
    i = 0
    prev = None
    while True:
        buf = p.stdout.read(NPIX)
        if len(buf) < NPIX:
            break
        t = a + i / fps
        mx = max(buf) / 255.0
        mean = sum(buf) / NPIX / 255.0
        q = sorted(buf, reverse=True)[:NPIX // 4]
        top = sum(q) / len(q) / 255.0
        d = "" if prev is None else f"  dtop={top-prev:+.3f}"
        print(f"t={t:8.3f}  top25={top:.3f}  mean={mean:.3f}  max={mx:.3f}{d}")
        prev = top
        i += 1
    p.wait()


if __name__ == "__main__":
    main()
