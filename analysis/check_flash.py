"""check_flash.py —— 抗闪白/爆闪检查（WCAG 2.3.1 思路）

做法：
  1. ffmpeg 把成片缩到 64x36，抽全部帧成 raw gray（-f rawvideo -pix_fmt gray），
     一帧 = 64*36 = 2304 字节，按顺序读，避免逐帧起进程。
  2. 每帧算「最忙 25% 像素」的平均亮度（把 2304 个亮度值降序取前 25%）。
  3. 滑动 1 秒窗（fps 帧），窗内最大亮度 - 最小亮度 = 该窗的闪动幅度。
  4. 报告幅度 > THRESH 的窗口；对 flash_range 区间单独统计并判定是否超限。

用法：
  python analysis/check_flash.py <video> [--fps 60] [--range 148.04 192.34] [--thresh 0.7]
"""
import subprocess
import sys
import os

FFMPEG = r"E:\新建文件夹\实习\MV\ref_mv\node_modules\ffmpeg-static\ffmpeg.exe"
W, H = 64, 36
NPIX = W * H
QUARTER = NPIX // 4


def luma_series(video, fps):
    cmd = [
        FFMPEG, "-v", "error", "-i", video,
        "-vf", f"scale={W}:{H}:flags=area,format=gray",
        "-f", "rawvideo", "-pix_fmt", "gray", "-",
    ]
    p = subprocess.Popen(cmd, stdout=subprocess.PIPE, stderr=subprocess.PIPE)
    vals = []
    i = 0
    while True:
        buf = p.stdout.read(NPIX)
        if len(buf) < NPIX:
            break
        px = sorted(buf, reverse=True)[:QUARTER]
        vals.append(sum(px) / QUARTER / 255.0)
        i += 1
    err = p.stderr.read().decode("utf-8", "replace")
    p.wait()
    if p.returncode != 0:
        raise SystemExit(f"ffmpeg failed: {err}")
    return vals


def main():
    if len(sys.argv) < 2:
        raise SystemExit(__doc__)
    video = sys.argv[1]
    fps = 60
    rng = None
    thresh = 0.7
    args = sys.argv[2:]
    j = 0
    while j < len(args):
        if args[j] == "--fps":
            fps = int(args[j + 1]); j += 2
        elif args[j] == "--range":
            rng = (float(args[j + 1]), float(args[j + 2])); j += 3
        elif args[j] == "--thresh":
            thresh = float(args[j + 1]); j += 2
        else:
            raise SystemExit("unknown arg " + args[j])

    vals = luma_series(video, fps)
    n = len(vals)
    print(f"frames={n}  fps={fps}  duration={n/fps:.2f}s  thresh={thresh}")
    if n == 0:
        raise SystemExit("no frames decoded")

    worst = []
    for s in range(0, max(1, n - fps + 1)):
        win = vals[s:s + fps]
        amp = max(win) - min(win)
        worst.append((amp, s))
    worst.sort(reverse=True)

    print("\n--- 全片最剧烈 10 个 1 秒窗 ---")
    for amp, s in worst[:10]:
        flag = "  <== OVER" if amp > thresh else ""
        print(f"  t={s/fps:7.2f}s  amp={amp:.3f}{flag}")

    if rng:
        a, b = rng
        ia, ib = int(a * fps), min(n, int(b * fps))
        if ib > ia:
            seg = vals[ia:ib]
            segw = []
            for s in range(ia, max(ia + 1, ib - fps + 1)):
                win = vals[s:s + fps]
                segw.append((max(win) - min(win), s))
            segw.sort(reverse=True)
            mx = segw[0][0] if segw else 0.0
            print(f"\n--- 保护区 {a:.2f}–{b:.2f}s（{ib-ia} 帧）---")
            print(f"  最大 1 秒窗闪动 = {mx:.3f}  (限制 {thresh})  => {'FAIL' if mx > thresh else 'PASS'}")
            for amp, s in segw[:5]:
                print(f"    t={s/fps:7.2f}s  amp={amp:.3f}")
            over = [w for w in segw if w[0] > thresh]
            print(f"  超限窗口数 = {len(over)}")
        else:
            print(f"\n保护区 {a:.2f}–{b:.2f}s 超出成片长度，跳过")

    over_all = [w for w in worst if w[0] > thresh]
    print(f"\n全片超限 1 秒窗 = {len(over_all)} 个")


if __name__ == "__main__":
    main()
