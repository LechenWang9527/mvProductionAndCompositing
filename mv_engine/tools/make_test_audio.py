#!/usr/bin/env python
"""Step 1 - synthesise a short test song with a KNOWN tempo.

Everything downstream is verified against this ground truth, so the test material has to be
something we can reason about exactly: a fixed 96 BPM grid, a click on every beat, a brighter
click on every downbeat, hi-hats on the off-beats and a slow four-chord pad underneath.

Usage (from the project root, with the DSH python):
    <python> mv_engine/tools/make_test_audio.py
    <python> mv_engine/tools/make_test_audio.py --bpm 96 --duration 10 --out out

Writes
    out/test.wav         16-bit mono PCM, 44.1 kHz
    out/test_beats.json  the ground-truth beat grid (bpm / period / t0 / beats[] / downbeats[])

Only numpy + the stdlib wave module - no librosa, no scipy, no soundfile.
"""

import argparse
import json
import sys
import wave
from pathlib import Path

import numpy as np

ENGINE = Path(__file__).resolve().parent.parent        # .../mv_engine
ROOT = ENGINE.parent                                   # project root
SR = 44100

# A minor / F major / C major / G major, root position triads in a comfortable mid register.
CHORDS = [
    [220.00, 261.63, 329.63],
    [174.61, 220.00, 261.63],
    [130.81, 164.81, 196.00],
    [196.00, 246.94, 293.66],
]


def env(n: int, attack: float, release: float) -> np.ndarray:
    """Simple attack/release envelope (linear, which is plenty for a pad)."""
    e = np.ones(n, dtype=np.float64)
    a = min(int(attack * SR), n)
    r = min(int(release * SR), n)
    if a > 1:
        e[:a] = np.linspace(0.0, 1.0, a)
    if r > 1:
        e[n - r:] *= np.linspace(1.0, 0.0, r)
    return e


def pad_note(freq: float, dur: float, amp: float, detune: float = 0.004) -> np.ndarray:
    """A slightly detuned sine pair so the pad has a little movement."""
    n = int(dur * SR)
    t = np.arange(n) / SR
    w = 0.62 * np.sin(2 * np.pi * freq * t) + 0.38 * np.sin(2 * np.pi * freq * (1 + detune) * t)
    return amp * w * env(n, 0.03, min(0.35, dur * 0.4))


def click(freq: float, amp: float, dur: float = 0.055, decay: float = 95.0) -> np.ndarray:
    """A pitched click with a little noise transient: sharp enough to produce a clean onset."""
    n = int(dur * SR)
    t = np.arange(n) / SR
    body = np.sin(2 * np.pi * freq * t) * np.exp(-t * decay)
    rng = np.random.default_rng(int(freq))
    nz = rng.standard_normal(n) * np.exp(-t * decay * 1.7)
    return amp * (0.78 * body + 0.22 * nz)


def hat(amp: float, dur: float = 0.035) -> np.ndarray:
    """Noise burst, differentiated to push the energy up high (stand-in for a hi-hat)."""
    n = int(dur * SR)
    t = np.arange(n) / SR
    rng = np.random.default_rng(4242)
    nz = rng.standard_normal(n) * np.exp(-t * 175.0)
    return amp * np.diff(nz, prepend=0.0)


def add_at(buf: np.ndarray, start_s: float, seg: np.ndarray) -> None:
    """Mix `seg` into `buf` at `start_s`, clipping silently at the end of the buffer."""
    i = int(round(start_s * SR))
    if i >= len(buf):
        return
    j = min(len(buf), i + len(seg))
    buf[i:j] += seg[: j - i]


def main() -> int:
    ap = argparse.ArgumentParser(description="Synthesise a known-tempo test song.")
    ap.add_argument("--bpm", type=float, default=96.0)
    ap.add_argument("--duration", type=float, default=10.0)
    ap.add_argument("--out", default=None, help="output directory (default: <root>/out)")
    ap.add_argument("--name", default="test", help="base name of the wav (default: test)")
    args = ap.parse_args()

    try:
        sys.stdout.reconfigure(encoding="utf-8", errors="replace")
    except Exception:
        pass

    out_dir = Path(args.out) if args.out else (ROOT / "out")
    if not out_dir.is_absolute():
        out_dir = (ROOT / out_dir).resolve()
    out_dir.mkdir(parents=True, exist_ok=True)

    bpm = float(args.bpm)
    duration = float(args.duration)
    beat = 60.0 / bpm
    bar = 4.0 * beat

    total = int(round(duration * SR))
    buf = np.zeros(total, dtype=np.float64)

    # --- sustained four-chord pad ------------------------------------------------
    n_bars = max(1, int(round(duration / bar)))
    for b in range(n_bars):
        start = b * bar
        for i, f in enumerate(CHORDS[b % len(CHORDS)]):
            add_at(buf, start, pad_note(f * (1.0 if i else 0.5), bar * 0.98, 0.085))
        add_at(buf, start, pad_note(CHORDS[b % len(CHORDS)][0] / 2.0, beat * 1.7, 0.20))

    # --- beat clicks: downbeat = 1200 Hz, other beats = 2000 Hz -------------------
    n_beats = int(round(duration / beat))
    for k in range(n_beats):
        down = (k % 4 == 0)
        add_at(buf, k * beat, click(1200.0 if down else 2000.0, 0.52 if down else 0.30))

    # --- hi-hats on the off-beat eighths -----------------------------------------
    for k in range(2 * n_beats):
        add_at(buf, k * beat / 2.0, hat(0.075 if k % 2 else 0.045))

    # --- normalise to -1 dBFS-ish ------------------------------------------------
    peak = float(np.max(np.abs(buf))) or 1.0
    buf *= 0.89 / peak
    pcm = np.clip(buf * 32767.0, -32768, 32767).astype("<i2")

    wav_path = out_dir / f"{args.name}.wav"
    with wave.open(str(wav_path), "wb") as w:
        w.setnchannels(1)
        w.setsampwidth(2)
        w.setframerate(SR)
        w.writeframes(pcm.tobytes())

    beats = [round(k * beat, 6) for k in range(n_beats)]
    truth = {
        "source": "mv_engine/tools/make_test_audio.py",
        "bpm": bpm,
        "period": round(beat, 6),
        "t0": 0.0,
        "duration": round(duration, 6),
        "sampleRate": SR,
        "beats": beats,
        "downbeats": [round(k * bar, 6) for k in range(n_bars)],
        "chordsHz": CHORDS,
    }
    truth_path = out_dir / f"{args.name}_beats.json"
    truth_path.write_text(json.dumps(truth, indent=2), encoding="utf-8")

    size_kb = wav_path.stat().st_size / 1024.0
    print(f"[make_test_audio] wrote {wav_path}")
    print(f"                  16-bit mono {SR} Hz, {duration:.2f} s, {size_kb:.1f} KB")
    print(f"                  {bpm:.2f} BPM, beat {beat:.4f} s, {n_beats} beats, {n_bars} bars")
    print(f"[make_test_audio] wrote {truth_path}")
    return 0


if __name__ == "__main__":
    sys.exit(main())
