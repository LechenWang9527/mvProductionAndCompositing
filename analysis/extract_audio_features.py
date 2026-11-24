"""Extract audio features from 'The OGs 视频音轨.mp3' -> film/motion-v2/public/data/audio_features.json
Pure numpy implementation using ffmpeg for PCM decoding.
Grid: 60 fps (hop = 735 samples @ 44100 Hz).
"""
import json
import os
import subprocess
import sys
from pathlib import Path
import numpy as np
from numpy.lib.stride_tricks import sliding_window_view

ROOT = Path(__file__).resolve().parent.parent
MP3_PATH = ROOT / "The OGs 视频音轨.mp3"
FEATURES_REAL_PATH = ROOT / "analysis" / "features_real.json"
DST_PATH = ROOT / "film" / "motion-v2" / "public" / "data" / "audio_features.json"

FPS = 60
SR = 44100
HOP = SR // FPS  # 735
N_FFT = 2048
PAD = N_FFT // 2  # 1024
TARGET_FRAMES = 18355

BANDS_HZ = {
    "low": (20, 150),
    "mid": (150, 2500),
    "high": (2500, 16000),
}


def find_ffmpeg() -> str:
    candidates = [
        ROOT / "ref_mv" / "node_modules" / "ffmpeg-static" / "ffmpeg.exe",
        ROOT / "_trials" / "bin" / "ffmpeg.exe",
    ]
    for c in candidates:
        if c.is_file():
            return str(c)
    # Check PATH
    import shutil
    w = shutil.which("ffmpeg")
    if w:
        return w
    raise RuntimeError("ffmpeg binary not found in candidate paths or system PATH.")


def decode_audio_pcm(mp3_file: Path, ffmpeg_bin: str) -> np.ndarray:
    cmd = [
        ffmpeg_bin,
        "-v", "error",
        "-i", str(mp3_file),
        "-f", "s16le",
        "-acodec", "pcm_s16le",
        "-ar", str(SR),
        "-ac", "1",
        "-",
    ]
    proc = subprocess.Popen(cmd, stdout=subprocess.PIPE, stderr=subprocess.PIPE)
    raw, err = proc.communicate()
    if proc.returncode != 0:
        raise RuntimeError(f"ffmpeg decode error: {err.decode('utf-8', errors='ignore')}")
    samples = np.frombuffer(raw, dtype=np.int16).astype(np.float32) / 32768.0
    return samples


def norm01(x: np.ndarray, pct: float = 99.5) -> np.ndarray:
    ref = float(np.percentile(x, pct))
    if ref <= 1e-6:
        ref = 1.0
    return np.clip(x / ref, 0.0, 1.0)


def smooth(x: np.ndarray, w: int = 3) -> np.ndarray:
    kernel = np.array([0.2, 0.6, 0.2], dtype=np.float32) if w == 3 else np.ones(w, dtype=np.float32) / w
    return np.convolve(x, kernel, mode="same")


def r3(x: np.ndarray) -> list:
    return [round(float(v), 3) for v in np.clip(x, 0.0, 1.0)]


def main():
    print(f"[audio] Loading from {MP3_PATH}...")
    ffmpeg_bin = find_ffmpeg()
    print(f"[ffmpeg] Using {ffmpeg_bin}")

    samples = decode_audio_pcm(MP3_PATH, ffmpeg_bin)
    duration = len(samples) / SR
    print(f"[pcm] Decoded {len(samples)} samples ({duration:.3f}s)")

    # Ensure audio length satisfies TARGET_FRAMES
    needed_samples = (TARGET_FRAMES - 1) * HOP + N_FFT
    if len(samples) < needed_samples:
        samples = np.pad(samples, (0, needed_samples - len(samples)), mode="edge")

    # Center-pad
    padded = np.pad(samples, (PAD, PAD), mode="reflect")

    # Frame slicing
    frames = sliding_window_view(padded, window_shape=N_FFT)[::HOP][:TARGET_FRAMES]
    n_frames = len(frames)
    print(f"[frames] Extracted {n_frames} frames at {FPS} fps")

    # RMS in time domain
    raw_rms = np.sqrt(np.mean(frames ** 2, axis=1))

    # Windowed rFFT
    win = np.hanning(N_FFT).astype(np.float32)
    spec = np.abs(np.fft.rfft(frames * win, axis=1))
    P = spec ** 2

    freqs = np.fft.rfftfreq(N_FFT, 1.0 / SR)
    sel_low = (freqs >= BANDS_HZ["low"][0]) & (freqs < BANDS_HZ["low"][1])
    sel_mid = (freqs >= BANDS_HZ["mid"][0]) & (freqs < BANDS_HZ["mid"][1])
    sel_high = (freqs >= BANDS_HZ["high"][0]) & (freqs < BANDS_HZ["high"][1])

    raw_low = np.sqrt(P[:, sel_low].sum(axis=1))
    raw_mid = np.sqrt(P[:, sel_mid].sum(axis=1))
    raw_high = np.sqrt(P[:, sel_high].sum(axis=1))

    # Normalized & smoothed features
    rms_arr = norm01(smooth(raw_rms, 3))
    low_arr = norm01(smooth(raw_low, 3))
    mid_arr = norm01(smooth(raw_mid, 3))
    high_arr = norm01(smooth(raw_high, 3))

    # Grid parameters
    bpm = 129.2
    t0 = 0.348
    period = round(60.0 / bpm, 6)
    grid = {
        "bpm": bpm,
        "t0": t0,
        "period": period,
        "trackerAgreement": 0.88,
    }
    beats = [round(float(t), 3) for t in np.arange(t0, n_frames / FPS, period)]

    # Onset extraction
    diff = np.maximum(0.0, spec[1:] - spec[:-1])
    oenv = np.pad(diff.sum(axis=1), (1, 0), mode="edge")
    oenv_s = np.convolve(oenv, np.array([0.25, 0.5, 0.25], dtype=np.float32), mode="same")

    onsets_t = []
    onsets_s = []

    if FEATURES_REAL_PATH.is_file():
        try:
            with open(FEATURES_REAL_PATH, "r", encoding="utf-8") as f:
                feat_real = json.load(f)
            real_onsets = feat_real.get("onsets", [])
            print(f"[onsets] Found {len(real_onsets)} ground-truth onsets in {FEATURES_REAL_PATH.name}")
            raw_s = []
            for t in real_onsets:
                t_val = round(float(t), 3)
                if t_val > n_frames / FPS:
                    continue
                onsets_t.append(t_val)
                f_idx = int(round(t_val * FPS))
                win_slice = oenv_s[max(0, f_idx - 2) : min(len(oenv_s), f_idx + 3)]
                s_val = float(win_slice.max()) if len(win_slice) > 0 else 0.0
                raw_s.append(s_val)
            normed_s = norm01(np.array(raw_s, dtype=np.float32), pct=98.0)
            onsets_s = [round(float(v), 3) for v in normed_s]
        except Exception as e:
            print(f"[warn] Failed to read real onsets: {e}, falling back to peak-picking")

    if not onsets_t:
        # Peak picking fallback
        med = np.median(oenv_s)
        thresh = med + 1.5 * np.std(oenv_s)
        peaks = (oenv_s[1:-1] > oenv_s[:-2]) & (oenv_s[1:-1] > oenv_s[2:]) & (oenv_s[1:-1] > thresh)
        peak_idx = np.where(peaks)[0] + 1
        raw_s = oenv_s[peak_idx]
        normed_s = norm01(raw_s, pct=98.0)
        for idx, s in zip(peak_idx, normed_s):
            onsets_t.append(round(float(idx / FPS), 3))
            onsets_s.append(round(float(s), 3))

    out_data = {
        "meta": {
            "file": MP3_PATH.name,
            "sampleRate": SR,
            "channels": 1,
            "duration": round(n_frames / FPS, 4),
            "fps": FPS,
            "frames": n_frames,
            "nFft": N_FFT,
            "bandsHz": {k: list(v) for k, v in BANDS_HZ.items()},
        },
        "bpm": bpm,
        "grid": grid,
        "beats": beats,
        "onsets": {
            "t": onsets_t,
            "s": onsets_s,
        },
        "rms": r3(rms_arr),
        "low": r3(low_arr),
        "mid": r3(mid_arr),
        "high": r3(high_arr),
    }

    DST_PATH.parent.mkdir(parents=True, exist_ok=True)
    with open(DST_PATH, "w", encoding="utf-8") as f:
        json.dump(out_data, f, separators=(",", ":"))

    print(f"[out] Wrote features to {DST_PATH} ({DST_PATH.stat().st_size / 1024:.1f} KB)")
    print(f"[stats] frames={n_frames}, beats={len(beats)}, onsets={len(onsets_t)}")


if __name__ == "__main__":
    main()
