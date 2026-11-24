// Boot: load features + lyrics, build the renderer, expose the export API, then (preview only) start rAF.
//
// URL:  index.html                    -> preview (rAF + audio)
//       index.html?export=1           -> no rAF, no audio; window.renderAt(t) is driven from outside
//       &w=960&h=540&fps=30           -> canvas size / frame rate used for the frame->time mapping
//       &features=data/features.json&lrc=media/demo.lrc   -> override the inputs

import { createRenderer } from './render.js';
import { parseLRC } from './lrc.js';

const q = new URLSearchParams(location.search);
const EXPORT = q.get('export') === '1';
const W = +(q.get('w') || 960);
const H = +(q.get('h') || 540);
const FPS = +(q.get('fps') || 30);
const FEATURES_URL = q.get('features') || 'data/features.json';
const LRC_URL = q.get('lrc') || 'media/demo.lrc';
const AUDIO_URL = q.get('audio') || '../out/test.wav';

const canvas = document.getElementById('view');
const statusEl = document.getElementById('status');
const playBtn = document.getElementById('play');
const seekEl = document.getElementById('seek');
const clockEl = document.getElementById('clock');
const audioEl = document.getElementById('audio');

if (EXPORT) document.body.classList.add('export');
canvas.width = Math.max(2, Math.round(W / 2) * 2);
canvas.height = Math.max(2, Math.round(H / 2) * 2);
canvas.style.width = canvas.width + 'px';
canvas.style.height = canvas.height + 'px';

const say = (msg, err) => {
  if (statusEl) {
    statusEl.textContent = msg;
    statusEl.className = err ? 'err' : '';
  }
  if (err) console.error(msg);
};

async function loadJSON(url) {
  const r = await fetch(url, { cache: 'no-store' });
  if (!r.ok) throw new Error(`${url} -> HTTP ${r.status}`);
  return r.json();
}

async function boot() {
  say(`loading ${FEATURES_URL} …`);
  const features = await loadJSON(FEATURES_URL);

  // config.json is a sibling of index.html, so we can read the cosmetic settings for the HUD
  let cfg = { song: { title: 'mv_engine', artist: '' }, look: {} };
  try {
    cfg = await loadJSON('config.json');
  } catch (e) {
    console.warn('[main] config.json not readable, using defaults:', e.message);
  }

  let lyrics = [];
  try {
    const r = await fetch(LRC_URL, { cache: 'no-store' });
    if (r.ok) {
      lyrics = parseLRC(await r.text());
      say(`lrc ${LRC_URL}: ${lyrics.length} lines`);
    } else {
      say(`no lyrics (${LRC_URL} -> HTTP ${r.status}); rendering instrumental`);
    }
  } catch (e) {
    say(`no lyrics (${e.message}); rendering instrumental`);
  }

  const renderer = createRenderer({
    canvas,
    features,
    lyrics,
    look: cfg.look || {},
    song: cfg.song || {},
    fps: FPS,
  });

  const duration = renderer.duration;
  const frameCount = Math.max(1, Math.ceil(duration * FPS));

  // ---- the public contract used by render.mjs --------------------------------
  const renderAt = (t) => renderer.renderAt(t);
  window.renderAt = renderAt;
  window.MV = {
    ready: true,
    export: EXPORT,
    renderAt,
    canvas,
    features,
    lyrics,
    duration,
    fps: FPS,
    frameCount,
    width: canvas.width,
    height: canvas.height,
    meta: {
      bpm: features.tempo ? features.tempo.bpm : null,
      t0: features.tempo ? features.tempo.t0 : null,
      sections: features.sections || [],
    },
    /** ms it took to draw one frame, for the export report */
    bench(n = 30) {
      const t0 = performance.now();
      for (let i = 0; i < n; i++) renderAt((i / n) * duration);
      return (performance.now() - t0) / n;
    },
  };

  renderAt(0);                       // make sure the very first frame is painted

  if (EXPORT) {
    say('export mode: rAF off, waiting for the renderer');
    return;
  }

  // ---- preview --------------------------------------------------------------
  say(`${lyrics.length} lyric lines · ${duration.toFixed(2)} s · ${renderer.bpm.toFixed(1)} BPM`);

  audioEl.src = AUDIO_URL;
  playBtn.disabled = false;
  seekEl.disabled = false;
  seekEl.max = String(duration);

  let playing = false;
  let clock = 0;
  let last = performance.now();

  const tick = (now) => {
    const dt = (now - last) / 1000;
    last = now;
    if (playing) {
      clock = audioEl.readyState >= 2 ? audioEl.currentTime : clock + dt;
      if (clock > duration) { clock = duration; playing = false; audioEl.pause(); playBtn.textContent = 'play'; }
    }
    renderAt(clock);
    seekEl.value = String(clock);
    clockEl.textContent = `${clock.toFixed(3)} / ${duration.toFixed(2)}`;
    requestAnimationFrame(tick);
  };
  requestAnimationFrame(tick);

  playBtn.onclick = () => {
    playing = !playing;
    playBtn.textContent = playing ? 'pause' : 'play';
    if (playing) {
      if (audioEl.readyState >= 2) { audioEl.currentTime = clock; audioEl.play().catch(() => {}); }
    } else {
      audioEl.pause();
    }
  };
  seekEl.oninput = () => {
    clock = +seekEl.value;
    if (audioEl.readyState >= 2) audioEl.currentTime = clock;
    renderAt(clock);
  };
}

boot().catch((e) => {
  say(`boot failed: ${e.message}`, true);
  window.MV = { ready: false, error: String(e && e.message || e) };
});
