#!/usr/bin/env python
"""Step 2 - analyse a song: tempo, beat grid, onset envelope, RMS curve, section boundaries.

Pure numpy (no librosa / scipy / soundfile). Reads any format ffmpeg can decode: non-WAV input is
first converted to a mono WAV at the analysis sample rate, then everything else is numpy.

Usage
    <python> mv_engine/analyze.py                                  # out/test.wav -> data/features.json
    <python> mv_engine/analyze.py --audio "The OGs 视频音轨.mp3" --out data/features_real.json --sr 22050
    <python> mv_engine/analyze.py --truth out/test_beats.json      # verify against synthetic ground truth

Output JSON
    meta      duration / sampleRate / fps (grid rate) / source file
    tempo     bpm, period, t0, confidence, beats[], downbeats[], barOffset
    grid      per-video-frame curves (rms / low / mid / high / flux), 0..1
    onsets    [[t, strength], ...]
    sections  [{start, end, label, rms, brightness}]   (energy / spectrum novelty)
    verify    present when a ground-truth beat file was available
"""

import argparse
import json
import subprocess
import sys
import tempfile
import wave
from pathlib import Path

import numpy as np

ENGINE = Path(__file__).resolve().parent          # .../mv_engine
ROOT = ENGINE.parent                              # project root

FFMPEG_CANDIDATES = [
    ROOT / "ref_mv" / "node_modules" / "ffmpeg-static" / "ffmpeg.exe",
    Path(r"C:\Users\WangLC\.dsh\dsh-runtimes\dsh-primary-runtime\dependencies\python"
         r"\Lib\site-packages\imageio_ffmpeg\binaries\ffmpeg-win-x86_64-v9.0.2.exe"),
]

BANDS_HZ = {"low": (0, 150), "mid": (150, 2500), "high": (2500, 16000)}


# --------------------------------------------------------------------------- io
def ffmpeg_bin() -> str:
    for c in FFMPEG_CANDIDATES:
        if c.exists():
            return str(c)
    return "ffmpeg"


def decode_to_wav(src: Path, sr: int, workdir: Path) -> Path:
    """Bounce anything ffmpeg understands to mono 16-bit PCM at `sr`."""
    dst = workdir / "decoded.wav"
    cmd = [ffmpeg_bin(), "-nostdin", "-y", "-hide_banner", "-loglevel", "error",
           "-i", str(src), "-ac", "1", "-ar", str(sr), "-c:a", "pcm_s16le", str(dst)]
    subprocess.run(cmd, check=True, stdin=subprocess.DEVNULL)
    return dst


def read_wav(path: Path):
    with wave.open(str(path), "rb") as w:
        nch, sw, sr, n = w.getnchannels(), w.getsampwidth(), w.getframerate(), w.getnframes()
        raw = w.readframes(n)
    if sw == 2:
        x = np.frombuffer(raw, dtype="<i2").astype(np.float64) / 32768.0
    elif sw == 4:
        x = np.frombuffer(raw, dtype="<i4").astype(np.float64) / 2147483648.0
    elif sw == 1:
        x = (np.frombuffer(raw, dtype=np.uint8).astype(np.float64) - 128.0) / 128.0
    else:
        raise SystemExit(f"unsupported sample width {sw} in {path}")
    if nch > 1:
        x = x[: (len(x) // nch) * nch].reshape(-1, nch).mean(axis=1)
    return x, sr, nch


def resample_linear(x: np.ndarray, sr_in: int, sr_out: int) -> np.ndarray:
    if sr_in == sr_out:
        return x
    n_out = int(round(len(x) * sr_out / sr_in))
    xi = np.linspace(0.0, len(x) - 1.0, n_out)
    return np.interp(xi, np.arange(len(x)), x)


# ----------------------------------------------------------------- frame features
def frame_features(x: np.ndarray, sr: int, n_fft: int, hop: int):
    """Streaming STFT -> per-frame rms, band energies and spectral flux (never holds the full STFT)."""
    n_frames = max(1, 1 + (len(x) - n_fft) // hop)
    if len(x) < n_fft:
        x = np.pad(x, (0, n_fft - len(x)))
        n_frames = 1
    win = np.hanning(n_fft)
    freqs = np.fft.rfftfreq(n_fft, 1.0 / sr)
    sel = {k: (freqs >= lo) & (freqs < min(hi, sr / 2.0)) for k, (lo, hi) in BANDS_HZ.items()}
    nb = len(freqs)

    rms = np.zeros(n_frames)
    bands = {k: np.zeros(n_frames) for k in BANDS_HZ}
    flux = np.zeros(n_frames)

    prev = np.zeros(nb)
    CH = 256
    base = np.arange(n_fft)[None, :]
    for s in range(0, n_frames, CH):
        e = min(n_frames, s + CH)
        idx = base + hop * np.arange(s, e)[:, None]
        idx = np.clip(idx, 0, len(x) - 1)
        fr = x[idx]
        rms[s:e] = np.sqrt((fr ** 2).mean(axis=1))
        S = np.abs(np.fft.rfft(fr * win, axis=1))
        P = S ** 2
        for k, m in sel.items():
            bands[k][s:e] = np.sqrt(P[:, m].sum(axis=1))
        d = np.diff(S, axis=0, prepend=prev[None, :])
        flux[s:e] = np.maximum(d, 0.0).sum(axis=1)
        prev = S[-1]

    times = (np.arange(n_frames) * hop + n_fft * 0.5) / sr
    return {"times": times, "rate": sr / hop, "rms": rms, "flux": flux, **bands}, n_frames


def norm01(v: np.ndarray, pct: float = 99.0) -> np.ndarray:
    ref = float(np.percentile(v, pct)) if len(v) else 0.0
    if ref <= 1e-12:
        return np.zeros_like(v)
    return np.clip(v / ref, 0.0, 1.0)


# ------------------------------------------------------------------------- tempo
def autocorr(e: np.ndarray) -> np.ndarray:
    n = len(e)
    nfft = 1 << int(np.ceil(np.log2(max(2, 2 * n - 1))))
    X = np.fft.rfft(e, nfft)
    ac = np.fft.irfft(X * np.conj(X), nfft)[:n]
    return ac / (ac[0] + 1e-12)


def estimate_tempo(env: np.ndarray, rate: float):
    """Autocorrelation for a rough tempo, then a peak-phase search (60..180 BPM) for the exact one.

    Returns (bpm, period, t0, confidence). The phase search is what fixes octave errors: a grid whose
    click phases all sit on 0 concentrates, a grid at 3:2 or 2:1 of the truth does not.
    """
    e = env - env.mean()
    ac = autocorr(e)
    lmin = max(2, int(round(rate * 60.0 / 180.0)))
    lmax = min(len(ac) - 2, int(round(rate * 60.0 / 60.0)))
    if lmax <= lmin:
        return 120.0, 0.5, 0.0, 0.0
    seg = ac[lmin:lmax + 1]
    rough_lag = lmin + int(np.argmax(seg))
    rough_bpm = 60.0 * rate / rough_lag
    while rough_bpm >= 180.0:
        rough_bpm /= 2.0
    while rough_bpm < 60.0:
        rough_bpm *= 2.0

    # onset peaks -> the phase search works on the actual attack times, not on frame indices
    envn = env / (env.max() + 1e-12)
    thr = float(np.percentile(envn, 85.0))
    cand = np.where((envn[1:-1] > envn[:-2]) & (envn[1:-1] >= envn[2:]) & (envn[1:-1] > thr))[0] + 1
    times = (cand / rate)

    if len(times) >= 4:
        bpms = np.arange(60.0, 180.0001, 0.02)
        periods = 60.0 / bpms
        ph = (times[None, :] / periods[:, None]) % 1.0
        w = envn[cand][None, :]
        conc = np.abs((np.exp(2j * np.pi * ph) * w).sum(axis=1) / (w.sum() + 1e-12))
        best = int(np.argmax(conc))
        bpm, conf = float(bpms[best]), float(conc[best])
        period = 60.0 / bpm
        phase = ((times / period) % 1.0)
        ang = (np.exp(2j * np.pi * phase) * envn[cand]).sum()
        t0 = float((np.angle(ang) / (2 * np.pi)) % 1.0) * period

        # Least-squares refinement: assign every STRONG onset to its nearest beat index and fit
        # t = t0 + k*period. Weak off-beat material (hats, noise) is dropped both by the energy
        # gate and by the residual window, which is what stops the fit from drifting onto a
        # neighbouring beat. Turns a grid-search answer (96.18) into the material's tempo (96.00).
        strength = envn[cand]
        strong = strength >= np.percentile(strength, 60.0)
        ks = np.round((times - t0) / period)
        resid = times - (t0 + ks * period)
        keep = strong & (np.abs(resid) < 0.14 * period)
        if keep.sum() >= 4:
            A = np.stack([np.ones(int(keep.sum())), ks[keep]], axis=1)
            sol, *_ = np.linalg.lstsq(A, times[keep], rcond=None)
            t0_fit, period_fit = float(sol[0]), float(sol[1])
            if period_fit > 0 and 60.0 / period_fit <= 200.0:
                t0, period = t0_fit, period_fit
                bpm = 60.0 / period_fit
        # allow the phase to sit just before 0 s so the very first frame is already on a beat
        t0 = t0 % period
        if t0 > period * 0.5:
            t0 -= period
        # fold a 180 BPM answer back into the listeners' half-time reading when it is ambiguous
        if bpm > 170.0:
            bpm, period, conf = bpm / 2.0, period * 2.0, conf
        return bpm, period, t0, conf

    bpm = 60.0 / (60.0 / rough_bpm)
    return rough_bpm, 60.0 / rough_bpm, 0.0, 0.0


def beat_grid(bpm: float, t0: float, duration: float):
    period = 60.0 / bpm
    k0 = int(np.floor((0.0 - t0) / period))      # the beat at or just before 0 s
    k1 = int(np.floor((duration - t0) / period))
    return [round(t0 + k * period, 6) for k in range(k0, k1 + 1)], period


def find_downbeats(beats, feats, bar: int = 4):
    """Pick the bar phase whose beats sit on the most low-frequency energy."""
    low = feats["low"]
    times = feats["times"]
    rate = feats["rate"]
    scores = np.zeros(bar)
    for b in range(bar):
        acc = []
        for t in beats[b::bar]:
            i = int(np.clip(t * rate, 0, len(low) - 1))
            acc.append(low[max(0, i - 2): i + 3].mean())
        scores[b] = float(np.mean(acc)) if acc else 0.0
    off = int(np.argmax(scores)) if scores.any() else 0
    return off, [b for i, b in enumerate(beats) if i % bar == off]


# ---------------------------------------------------------------------- sections
def detect_sections(feats: dict, duration: float, hop_s: float = 0.5):
    """Self-similarity novelty (checkerboard kernel) over (rms, low, mid, high) at 2 Hz."""
    rate = feats["rate"]
    n = int(max(8, duration / hop_s))
    tgt = np.arange(n) * hop_s
    cols = []
    for k in ("rms", "low", "mid", "high"):
        v = np.interp(tgt, feats["times"], feats[k])
        cols.append(np.log1p(v * 1000.0))
    F = np.stack(cols, axis=1)
    F = (F - F.mean(axis=0)) / (F.std(axis=0) + 1e-9)

    K = 8                                   # +/- 4 s of each side
    ker = np.outer(np.r_[np.ones(K), -np.ones(K)], np.r_[np.ones(K), -np.ones(K)])
    nov = np.zeros(n)
    for i in range(K, n - K):
        seg = F[i - K:i + K]
        nov[i] = float(np.sum(seg.T @ ker @ seg))
    nov = norm01(np.maximum(nov, 0.0), 99.0)

    # peaks, at least 12 s apart
    order = np.argsort(nov)[::-1]
    picked = []
    for i in order:
        if nov[i] < 0.30:
            break
        if all(abs(i - j) * hop_s >= 12.0 for j in picked):
            picked.append(int(i))
    picked.sort()

    bounds = [0.0] + [round(float(i * hop_s), 3) for i in picked] + [round(duration, 3)]
    bounds = sorted(set(bounds))
    segs = []
    for a, b in zip(bounds[:-1], bounds[1:]):
        if b - a < 6.0 and segs:
            segs[-1]["end"] = b
            continue
        m = (tgt >= a) & (tgt < b)
        if not m.any():
            continue
        rms_m = float(np.interp((a + b) / 2.0, feats["times"], feats["rms"])) if b > a else 0.0
        lowv = float(np.interp((a + b) / 2.0, feats["times"], feats["low"]))
        highv = float(np.interp((a + b) / 2.0, feats["times"], feats["high"]))
        segs.append({
            "start": round(a, 3), "end": round(b, 3),
            "rms": round(float(np.interp(tgt[m], feats["times"], feats["rms"]).mean()), 5),
            "brightness": round(float(highv / (lowv + 1e-6)), 4),
            "_peak": rms_m,
        })

    if not segs:
        return [], None

    loud = np.array([s["rms"] for s in segs])
    bright = np.array([s["brightness"] for s in segs])
    z = lambda v: (v - v.mean()) / (v.std() + 1e-9)
    score = z(loud) + 0.5 * z(bright)

    chorus_i = None
    for i in range(len(segs)):
        if segs[i]["end"] - segs[i]["start"] >= 8.0 and (chorus_i is None or score[i] > score[chorus_i]):
            chorus_i = i
    for i, s in enumerate(segs):
        s.pop("_peak", None)
        if i == 0 and s["start"] <= 0.5 and len(segs) > 2:
            label = "intro"
        elif i == len(segs) - 1 and len(segs) > 2:
            label = "outro"
        elif i == chorus_i:
            label = "chorus"
        else:
            label = "verse"
        s["label"] = label
        s["score"] = round(float(score[i]), 3)
    chorus_t = segs[chorus_i]["start"] if chorus_i is not None else None
    return segs, chorus_t


# --------------------------------------------------------------------------- main
def main() -> int:
    ap = argparse.ArgumentParser(description="Tempo / beats / onsets / RMS / sections, numpy only.")
    ap.add_argument("--audio", default=None, help="song file (default: config.json paths.audio)")
    ap.add_argument("--out", default=None, help="output json (default: config.json paths.features)")
    ap.add_argument("--sr", type=int, default=None, help="analysis sample rate (default 44100, or 22050 via --fast)")
    ap.add_argument("--fps", type=int, default=60, help="rate of the output grid (default 60)")
    ap.add_argument("--truth", default=None, help="ground-truth beats json to verify against")
    ap.add_argument("--fast", action="store_true", help="22050 Hz analysis (1/2 the work; use for long songs)")
    ap.add_argument("--quiet", action="store_true")
    args = ap.parse_args()

    # Chinese Windows redirects stdout to cp936 by default, which mangles any UTF-8 path in logs.
    try:
        sys.stdout.reconfigure(encoding="utf-8", errors="replace")
    except Exception:
        pass

    cfg = json.loads((ENGINE / "config.json").read_text(encoding="utf-8"))
    audio = Path(args.audio) if args.audio else (ROOT / cfg["paths"]["audio"])
    if not audio.is_absolute():
        audio = (ROOT / audio).resolve()
    out = Path(args.out) if args.out else (ROOT / cfg["paths"]["features"])
    if not out.is_absolute():
        out = (ROOT / out).resolve()
    sr_target = args.sr or (22050 if args.fast else 44100)

    if not audio.exists():
        raise SystemExit(f"audio not found: {audio}")

    say = (lambda *a: None) if args.quiet else print
    say(f"[analyze] input  {audio}")

    with tempfile.TemporaryDirectory() as td:
        if audio.suffix.lower() == ".wav":
            x, sr, nch = read_wav(audio)
            say(f"[analyze] wav    {sr} Hz, {nch} ch, {len(x) / sr:.2f} s")
        else:
            tmp = decode_to_wav(audio, sr_target, Path(td))
            x, sr, nch = read_wav(tmp)
            say(f"[analyze] decode -> {sr_target} Hz mono, {len(x) / sr:.2f} s (via ffmpeg)")

    if sr != sr_target:
        x = resample_linear(x, sr, sr_target)
        sr = sr_target
        say(f"[analyze] resample -> {sr} Hz")

    duration = len(x) / sr
    hop = max(64, int(round(sr / 172.0)))
    n_fft = 2048 if sr >= 32000 else 1024
    say(f"[analyze] stft   n_fft={n_fft} hop={hop} ({sr / hop:.1f} frames/s)")

    feats, n_frames = frame_features(x, sr, n_fft, hop)

    # onset envelope: spectral flux with the slow trend removed
    rate = feats["rate"]
    k = max(3, int(0.30 * rate) | 1)
    ma = np.convolve(feats["flux"], np.ones(k) / k, mode="same")
    onset_env = np.maximum(feats["flux"] - ma, 0.0)

    bpm, period, t0, conf = estimate_tempo(onset_env, rate)
    beats, period = beat_grid(bpm, t0, duration)
    bar_off, downbeats = find_downbeats(beats, feats, 4)
    say(f"[analyze] tempo  {bpm:.2f} BPM (conf {conf:.2f}), period {period:.4f} s, first beat {t0:.3f} s")

    # windows / onsets
    onsets = []
    envn = onset_env / (onset_env.max() + 1e-12)
    thr = float(np.percentile(envn, 88.0))
    pk = np.where((envn[1:-1] > envn[:-2]) & (envn[1:-1] >= envn[2:]) & (envn[1:-1] > thr))[0] + 1
    for i in pk:
        onsets.append([round(float(feats["times"][i]), 3), round(float(envn[i]), 3)])

    # 60 fps grid for the renderer
    fps = args.fps
    n40 = int(np.ceil(duration * fps))
    tg = np.arange(n40) / fps
    grid = {"fps": fps, "count": n40}
    for key, pct in (("rms", 99.0), ("low", 99.0), ("mid", 99.0), ("high", 99.0)):
        v = norm01(feats[key], pct)
        grid[key] = [round(float(q), 3) for q in np.interp(tg, feats["times"], v)]
    grid["flux"] = [round(float(q), 3) for q in norm01(np.interp(tg, feats["times"], onset_env), 99.0)]

    sections, chorus_t = detect_sections(feats, duration)
    if sections:
        where = f"chorus guess @ {chorus_t:.2f} s" if chorus_t is not None else "no clear chorus"
        say(f"[analyze] parts  {len(sections)} sections; {where}")
        for s in sections:
            say(f"                 {s['start']:7.2f} - {s['end']:7.2f}  {s['label']:<6} "
                f"rms {s['rms']:.4f}  bright {s['brightness']:.2f}  score {s['score']:+.2f}")

    payload = {
        "meta": {
            "source": str(audio.relative_to(ROOT)).replace("\\", "/") if audio.is_relative_to(ROOT) else str(audio),
            "sampleRate": sr, "duration": round(duration, 4), "analysisFps": round(rate, 3),
            "gridFps": fps, "nFft": n_fft, "hop": hop,
            "tool": "mv_engine/analyze.py",
        },
        "tempo": {
            "bpm": round(bpm, 3), "period": round(period, 6), "t0": round(t0, 4),
            "confidence": round(conf, 4), "barOffset": bar_off,
            "beats": beats, "downbeats": downbeats,
        },
        "grid": grid,
        "onsets": onsets,
        "sections": sections,
        "chorusStart": round(chorus_t, 3) if chorus_t is not None else None,
    }

    # ground-truth check (synthetic material only)
    truth_path = Path(args.truth) if args.truth else (audio.parent / f"{audio.stem}_beats.json")
    if truth_path.exists():
        truth = json.loads(truth_path.read_text(encoding="utf-8"))
        err = abs(bpm - float(truth["bpm"]))
        tb = truth.get("beats") or []
        align = None
        if tb and beats:
            al = [min(abs(b - t) for b in beats) for t in tb]
            align = float(np.median(al))
        ok = err <= 2.0
        payload["verify"] = {
            "truth": truth_path.name, "trueBpm": truth["bpm"],
            "estBpm": round(bpm, 3), "bpmError": round(err, 3),
            "medianBeatAlignError": round(align, 4) if align is not None else None,
            "pass": bool(ok),
        }
        say(f"[analyze] VERIFY vs {truth_path.name}: true {truth['bpm']:.2f} BPM, "
            f"estimate {bpm:.2f} BPM, error {err:.3f} (tol 2.0) -> {'PASS' if ok else 'FAIL'}")
        if align is not None:
            say(f"[analyze]        median |beat - true beat| = {align * 1000:.1f} ms")

    out.parent.mkdir(parents=True, exist_ok=True)
    out.write_text(json.dumps(payload, indent=1), encoding="utf-8")
    say(f"[analyze] wrote  {out}  ({out.stat().st_size / 1024:.0f} KB)")
    say(f"[analyze] summary: {duration:.2f} s, {bpm:.2f} BPM, {len(beats)} beats, "
        f"{len(onsets)} onsets, {len(sections)} sections")
    return 0


if __name__ == "__main__":
    sys.exit(main())
