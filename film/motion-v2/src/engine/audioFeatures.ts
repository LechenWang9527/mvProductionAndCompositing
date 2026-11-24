import audioFeaturesData from '../../public/data/audio_features.json';

export type AudioSample = {
  t: number;
  bass: number;
  mid: number;
  high: number;
  rms: number;
  beatPhase: number;
  beatPulse: number;
  onsetPulse: number;
};

const fps: number = audioFeaturesData.meta?.fps ?? 60;
const framesCount: number = audioFeaturesData.meta?.frames ?? audioFeaturesData.rms.length;
const t0: number = audioFeaturesData.grid?.t0 ?? 0.348;
const period: number = audioFeaturesData.grid?.period ?? (60.0 / 129.2);
const onsetsT: number[] = audioFeaturesData.onsets?.t ?? [];
const onsetsS: number[] = audioFeaturesData.onsets?.s ?? [];

function interpSeries(arr: number[], t: number): number {
  if (t <= 0) return arr[0] ?? 0;
  const x = t * fps;
  const i = Math.floor(x);
  if (i >= framesCount - 1) return arr[framesCount - 1] ?? 0;
  const k = x - i;
  return arr[i] * (1 - k) + arr[i + 1] * k;
}

export function sampleAudio(t: number): AudioSample {
  const bass = interpSeries(audioFeaturesData.low, t);
  const mid = interpSeries(audioFeaturesData.mid, t);
  const high = interpSeries(audioFeaturesData.high, t);
  const rms = interpSeries(audioFeaturesData.rms, t);

  // Beat phase and pulse
  let beatPhase = 0;
  let beatPulse = 0;

  if (t >= t0) {
    const beatIndex = Math.floor((t - t0) / period);
    const lastBeat = t0 + beatIndex * period;
    const dtBeat = t - lastBeat;
    beatPhase = (dtBeat / period) % 1.0;
    beatPulse = Math.exp(-12 * Math.max(0, dtBeat));
  }

  // Strongest onset within 0.08s window
  let onsetPulse = 0;
  if (onsetsT.length > 0) {
    let left = 0;
    let right = onsetsT.length - 1;
    let startIdx = 0;

    // Binary search to find candidate start
    while (left <= right) {
      const m = (left + right) >> 1;
      if (onsetsT[m] >= t - 0.08) {
        startIdx = m;
        right = m - 1;
      } else {
        left = m + 1;
      }
    }

    for (let i = startIdx; i < onsetsT.length; i++) {
      const ot = onsetsT[i];
      if (ot > t + 0.08) break;
      const dist = Math.abs(t - ot);
      if (dist <= 0.08) {
        const p = onsetsS[i] * (1 - dist / 0.08);
        if (p > onsetPulse) {
          onsetPulse = p;
        }
      }
    }
  }

  return {
    t,
    bass,
    mid,
    high,
    rms,
    beatPhase,
    beatPulse,
    onsetPulse,
  };
}

export function hash01(n: number): number {
  const s = Math.sin(n * 127.1 + 311.7) * 43758.5453123;
  return s - Math.floor(s);
}

export function shake2D(t: number, amp: number, seed = 0): [number, number] {
  if (amp <= 0) return [0, 0];
  const s = seed * 17.31;
  const dx = (Math.sin(t * 23.1 + s) * 0.65 + Math.sin(t * 47.7 + s * 1.3) * 0.35) * amp;
  const dy = (Math.cos(t * 19.7 + s + 1.7) * 0.65 + Math.cos(t * 43.3 + s * 1.7) * 0.35) * amp;
  return [dx, dy];
}
