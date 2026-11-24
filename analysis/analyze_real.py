"""真实歌曲卡点分析 —— 纯 numpy 实现，不依赖 librosa。

输入：任意音频（先由 ffmpeg 转成 22050Hz 单声道 wav）
输出：analysis/features_real.json

做四件事：
1) STFT 频谱通量 -> onset 包络
2) 自相关估 BPM（60~200 区间，带八度纠错）
3) 相位对齐的 beat 网格（穷举相位取最大包络累加）
4) RMS 能量曲线 + 段落边界（能量突变检测）

用法：
  python analyze_real.py <wav路径> <输出json路径>
"""
import sys
import json
import wave
import numpy as np

SR = 22050
N_FFT = 2048
HOP = 512
FPS = SR / HOP  # 43.066 帧/秒


def read_wav(path):
    with wave.open(path, "rb") as w:
        ch = w.getnchannels()
        sw = w.getsampwidth()
        sr = w.getframerate()
        n = w.getnframes()
        raw = w.readframes(n)
    if sw != 2:
        raise SystemExit(f"只支持 16bit wav，当前 {sw*8}bit")
    x = np.frombuffer(raw, dtype="<i2").astype(np.float32) / 32768.0
    if ch > 1:
        x = x.reshape(-1, ch).mean(axis=1)
    if sr != SR:
        # 线性插值重采样（够用，不追求抗混叠）
        t_old = np.arange(len(x)) / sr
        t_new = np.arange(int(len(x) * SR / sr)) / SR
        x = np.interp(t_new, t_old, x).astype(np.float32)
    return x


def onset_envelope(x):
    """频谱通量 onset 包络（半波整流 + 局部归一）"""
    win = np.hanning(N_FFT).astype(np.float32)
    n_frames = 1 + (len(x) - N_FFT) // HOP
    prev = None
    flux = np.zeros(n_frames, dtype=np.float32)
    for i in range(n_frames):
        seg = x[i * HOP: i * HOP + N_FFT] * win
        mag = np.abs(np.fft.rfft(seg))
        # 对数压缩，压低大能量段的支配
        mag = np.log1p(mag * 10.0)
        if prev is not None:
            d = mag - prev
            flux[i] = float(np.sum(d[d > 0]))
        prev = mag
    # 去均值 + 除以滑动标准差
    if len(flux) > 8:
        k = np.ones(9) / 9
        mean = np.convolve(flux, k, mode="same")
        flux = np.maximum(flux - mean, 0)
    m = flux.max()
    if m > 0:
        flux = flux / m
    return flux


def estimate_bpm(env):
    """自相关估 BPM，返回 (bpm, 周期帧数, 置信度)"""
    e = env - env.mean()
    ac = np.correlate(e, e, mode="full")[len(e) - 1:]
    ac = ac / (ac[0] + 1e-9)
    # 60~200 BPM -> 周期帧数
    lo = int(FPS * 60 / 200)   # 最慢
    hi = int(FPS * 60 / 60)    # 最快
    lo = max(lo, 2)
    hi = min(hi, len(ac) - 2)
    seg = ac[lo:hi]
    if len(seg) == 0:
        return 0.0, 0, 0.0
    lag = int(np.argmax(seg)) + lo
    score = float(ac[lag])
    # 八度纠错：检查 lag/2、lag*2 的得分
    for cand in (lag // 2, lag * 2):
        if 2 <= cand < len(ac) - 2:
            s = float(ac[cand])
            if s > score * 1.02:
                lag, score = cand, s
    bpm = 60.0 * FPS / lag
    return bpm, lag, score


def beat_grid(env, lag, n_bars_hint=4):
    """穷举相位，取包络累加最强的相位，返回 beat 时间列表"""
    if lag <= 0:
        return []
    best_phase, best_score = 0, -1.0
    for ph in range(lag):
        idx = np.arange(ph, len(env), lag)
        s = float(env[idx].sum() / max(len(idx), 1))
        if s > best_score:
            best_score, best_phase = s, ph
    idx = np.arange(best_phase, len(env), lag)
    times = [round(i / FPS, 3) for i in idx]
    return times


def rms_curve(x, win_sec=0.5):
    w = int(SR * win_sec)
    n = len(x) // w
    if n == 0:
        return [], win_sec
    out = []
    for i in range(n):
        seg = x[i * w:(i + 1) * w]
        out.append(round(float(np.sqrt(np.mean(seg ** 2))), 5))
    return out, win_sec


def section_boundaries(rms, win_sec, threshold=0.45):
    """在某尺度上找能量突变点，作为段落边界候选"""
    if len(rms) < 8:
        return []
    r = np.array(rms)
    # 平滑
    k = max(1, int(2.0 / win_sec))
    sm = np.convolve(r, np.ones(k) / k, mode="same")
    d = np.abs(np.diff(sm))
    if d.max() <= 0:
        return []
    d = d / d.max()
    # 局部极大且超过阈值
    cand = []
    for i in range(1, len(d) - 1):
        if d[i] >= threshold and d[i] >= d[i - 1] and d[i] >= d[i + 1]:
            cand.append(round((i + 1) * win_sec, 2))
    # 合并 4 秒内的相邻候选
    merged = []
    for t in cand:
        if merged and t - merged[-1] < 4.0:
            continue
        merged.append(t)
    return merged


def main():
    if len(sys.argv) < 3:
        raise SystemExit("用法: python analyze_real.py <wav> <out.json>")
    wav_path, out_path = sys.argv[1], sys.argv[2]
    x = read_wav(wav_path)
    dur = len(x) / SR
    print(f"[in] {wav_path}  {dur:.2f}s  {len(x)} samples", flush=True)

    env = onset_envelope(x)
    print(f"[1/4] onset 包络 {len(env)} 帧 @ {FPS:.2f} fps", flush=True)

    bpm, lag, conf = estimate_bpm(env)
    print(f"[2/4] BPM={bpm:.2f} lag={lag} conf={conf:.3f}", flush=True)

    beats = beat_grid(env, lag)
    print(f"[3/4] beat 数={len(beats)} 首拍={beats[0] if beats else None}", flush=True)

    rms, win_sec = rms_curve(x)
    bounds = section_boundaries(rms, win_sec)
    print(f"[4/4] RMS {len(rms)} 点 / 段落候选 {len(bounds)} 个", flush=True)

    # onset 峰值（用于 mask 类过场）
    peaks = []
    thr = float(env.mean() + env.std() * 1.2)
    for i in range(1, len(env) - 1):
        if env[i] >= thr and env[i] > env[i - 1] and env[i] >= env[i + 1]:
            peaks.append(round(i / FPS, 3))

    data = {
        "source": wav_path,
        "duration": round(dur, 3),
        "sample_rate": SR,
        "bpm": round(bpm, 2),
        "bpm_confidence": round(conf, 3),
        "beat_frames": lag,
        "fps": round(FPS, 4),
        "beats": beats,
        "beat_count": len(beats),
        "first_beat": beats[0] if beats else None,
        "onsets": peaks[:4000],
        "onset_count": len(peaks),
        "rms": rms,
        "rms_win": win_sec,
        "section_candidates": bounds,
    }
    with open(out_path, "w", encoding="utf-8") as f:
        json.dump(data, f, ensure_ascii=False)
    print(f"[ok] -> {out_path}", flush=True)


if __name__ == "__main__":
    main()
