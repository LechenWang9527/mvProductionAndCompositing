// The whole picture as a pure function of t.
//
// Everything a frame needs is either precomputed at boot (particles, star field, palette) or
// derived from t and the beat grid inside renderAt(). There is no accumulation between frames,
// so renderAt(3.2) draws exactly the same pixels whether it is the first call or the 900th.

import { TAU, clamp, lerp, smoothstep, hashNoise, hexToRgba, mixHex } from './util.js';
import { lyricState } from './lrc.js';

const DW = 1920, DH = 1080;          // design space; the canvas is scaled to fit W x H

export function createRenderer({ canvas, features, lyrics, look, song, fps }) {
  const W = canvas.width, H = canvas.height;
  const sx = W / DW, sy = H / DH;
  const scale = (sx + sy) / 2;

  const main = canvas.getContext('2d', { alpha: false });

  // bloom layer: the bright things are drawn a second time here, then blurred and added back
  const bloomCanvas = document.createElement('canvas');
  bloomCanvas.width = W; bloomCanvas.height = H;
  const bloom = bloomCanvas.getContext('2d', { alpha: true });
  const canFilter = typeof main.filter === 'string';

  const tempo = features.tempo || {};
  const period = tempo.period || 0.5;
  const t0 = tempo.t0 || 0;
  const bpm = tempo.bpm || 120;
  const duration = (features.meta && features.meta.duration) || 10;
  const grid = features.grid || { fps: 60, count: 0, rms: [], low: [], mid: [], high: [], flux: [] };
  const gCount = grid.count || 0;
  const gRate = grid.fps || 60;
  const sections = features.sections || [];

  const seed = (look && look.seed) || 1;
  const accent = (look && look.accent) || '#5eead4';
  const accent2 = (look && look.accent2) || '#a78bfa';
  const textCol = (look && look.text) || '#eaf2ff';
  const dimCol = (look && look.dim) || '#7c8aa5';
  const bgCol = (look && look.bg) || '#05070d';
  const glowAmt = look && typeof look.glow === 'number' ? look.glow : 0.85;

  // ---- precomputed, seeded decoration (stable across frames) ------------------
  const stars = [];
  for (let i = 0; i < 220; i++) {
    stars.push({
      x: hashNoise(i * 3 + 1, seed) * DW,
      y: hashNoise(i * 3 + 2, seed) * DH,
      r: 0.6 + hashNoise(i * 3 + 3, seed) * 1.9,
      ph: hashNoise(i * 3 + 4, seed) * TAU,
      sp: 0.25 + hashNoise(i * 3 + 5, seed) * 0.9,
    });
  }
  const bars = 44;

  const sample = (arr, t) => {
    if (!arr || !gCount) return 0;
    const f = clamp(t * gRate, 0, gCount - 1.001);
    const i = Math.floor(f), fr = f - i;
    return lerp(arr[i] || 0, arr[i + 1] || 0, fr);
  };

  const barIndex = (t) => {
    const bar = 4;
    const beats = tempo.beats || [];
    let n = 0;
    for (let i = 0; i < beats.length; i++) if (beats[i] <= t + 1e-6) n = i;
    return Math.floor(n / bar);
  };

  function beatState(t) {
    const pos = (t - t0) / period;
    const idx = Math.floor(pos);
    const frac = pos - idx;                        // 0 = on the beat
    const pulse = Math.exp(-frac * 5.5);            // sharp attack, quick decay
    return { idx, frac, pulse, sinceDown: pos - (Math.floor(pos / 4) * 4) };
  }

  // ---------------------------------------------------------------- draw helpers
  function drawBackground(t) {
    const g = main.createRadialGradient(DW * 0.5, DH * 0.42, 40, DW * 0.5, DH * 0.5, DH * 1.05);
    g.addColorStop(0, mixHex(bgCol, '#101a2c', 0.55));
    g.addColorStop(0.55, bgCol);
    g.addColorStop(1, '#020307');
    main.fillStyle = g;
    main.fillRect(0, 0, DW, DH);

    // slowly drifting nebula blobs -> gives the dark field some life without looking busy
    const blob = (cx, cy, r, col, a) => {
      const rg = main.createRadialGradient(cx, cy, 0, cx, cy, r);
      rg.addColorStop(0, hexToRgba(col, a));
      rg.addColorStop(1, hexToRgba(col, 0));
      main.fillStyle = rg;
      main.beginPath();
      main.arc(cx, cy, r, 0, TAU);
      main.fill();
    };
    blob(DW * (0.30 + 0.04 * Math.sin(t * 0.13)), DH * (0.36 + 0.03 * Math.cos(t * 0.17)),
         DH * 0.62, accent2, 0.10);
    blob(DW * (0.72 + 0.04 * Math.cos(t * 0.11)), DH * (0.58 + 0.03 * Math.sin(t * 0.19)),
         DH * 0.55, accent, 0.085);
  }

  function drawStars(t, pulse) {
    main.save();
    for (const s of stars) {
      const tw = 0.35 + 0.65 * (0.5 + 0.5 * Math.sin(t * s.sp * 2.2 + s.ph));
      const a = tw * (0.30 + 0.42 * pulse);
      main.fillStyle = hexToRgba(textCol, a * 0.8);
      const r = s.r * (1 + 0.35 * pulse);
      main.beginPath();
      main.arc(s.x, s.y + Math.sin(t * 0.25 + s.ph) * 6, r, 0, TAU);
      main.fill();
    }
    main.restore();
  }

  function drawSpectrumRing(cx, cy, t, pulse) {
    const low = sample(grid.low, t), mid = sample(grid.mid, t), high = sample(grid.high, t);
    const rms = sample(grid.rms, t);
    const baseR = 232 + 22 * pulse;
    main.save();
    main.translate(cx, cy);
    for (let i = 0; i < bars; i++) {
      const a = (i / bars) * TAU - Math.PI / 2 + t * 0.05;
      // deterministic per-bar wobble: a hash on the bar index and the quantised time
      const q = Math.floor(t * 12);
      const nz = hashNoise(i * 7 + q * 13, seed);
      const band = i % 3 === 0 ? low : i % 3 === 1 ? mid : high;
      const h = 14 + band * 104 * (0.55 + 0.45 * nz) + rms * 26;
      const r0 = baseR, r1 = baseR + h;
      const col = i % 3 === 0 ? accent : i % 3 === 1 ? mixHex(accent, accent2, 0.5) : accent2;
      main.strokeStyle = hexToRgba(col, 0.30 + 0.45 * band);
      main.lineWidth = 5;
      main.lineCap = 'round';
      main.beginPath();
      main.moveTo(Math.cos(a) * r0, Math.sin(a) * r0);
      main.lineTo(Math.cos(a) * r1, Math.sin(a) * r1);
      main.stroke();
    }
    main.restore();
  }

  function drawRings(cx, cy, t, bs, target) {
    // one ring per recent beat, expanding and fading - reads as the song breathing
    for (let k = 0; k < 4; k++) {
      const ageBeats = bs.frac + k;
      const age = ageBeats * period;
      if (age > 2.0) continue;
      const r = 190 + age * 300;
      const a = Math.pow(1 - age / 2.0, 2) * 0.55;
      target.strokeStyle = hexToRgba(k % 2 ? accent2 : accent, a);
      target.lineWidth = 6 * (1 - age / 2.0) + 1;
      target.beginPath();
      target.arc(cx, cy, r, 0, TAU);
      target.stroke();
    }
  }

  function polygon(ctx, cx, cy, r, sides, rot) {
    ctx.beginPath();
    for (let i = 0; i < sides; i++) {
      const a = rot + (i / sides) * TAU;
      const x = cx + Math.cos(a) * r, y = cy + Math.sin(a) * r;
      i ? ctx.lineTo(x, y) : ctx.moveTo(x, y);
    }
    ctx.closePath();
  }

  function drawCore(cx, cy, t, bs, target, core) {
    const rms = sample(grid.rms, t);
    const pulse = bs.pulse;
    const r = (118 + 30 * pulse + 34 * rms) * core;
    const rot = t * 0.35 + (bs.idx | 0) * 0.07;

    // outer hexagon, thin
    target.strokeStyle = hexToRgba(accent, 0.55 + 0.35 * pulse);
    target.lineWidth = 3;
    polygon(target, cx, cy, r * 1.42, 6, -rot * 0.6);
    target.stroke();

    // middle polygon, rotating the other way
    target.strokeStyle = hexToRgba(accent2, 0.45 + 0.3 * pulse);
    target.lineWidth = 2;
    polygon(target, cx, cy, r * 1.16, 6, rot * 0.9 + Math.PI / 6);
    target.stroke();

    // solid core with a vertical gradient
    const g = target.createLinearGradient(cx, cy - r, cx, cy + r);
    g.addColorStop(0, 'rgba(255,255,255,0.94)');
    g.addColorStop(0.45, hexToRgba(accent, 0.96));
    g.addColorStop(1, hexToRgba(accent2, 0.72));
    target.fillStyle = g;
    polygon(target, cx, cy, r, 6, rot);
    target.fill();

    // inner dark notch so the shape does not read as a flat blob
    target.fillStyle = hexToRgba(bgCol, 0.55);
    polygon(target, cx, cy, r * 0.52, 6, -rot * 1.4);
    target.fill();
  }

  function drawLyrics(t, bs, target, core) {
    const st = lyricState(lyrics, t);
    if (st.index < 0) return;
    const cur = lyrics[st.index];
    const prev = lyrics[st.index - 1];
    const next = lyrics[st.index + 1];
    const p = st.progress;

    // The line is legible the moment it starts: only a short in-slide, and no fade-out at the end
    // (the next line simply takes over). Dimming the freshly-shown line was a bug.
    const inA = smoothstep(0, 0.10, p);
    const alpha = clamp(0.45 + 0.55 * inA, 0, 1) * (1 - 0.25 * smoothstep(0.9, 1, p));
    const rise = (1 - inA) * 22;

    const baseY = 862;
    const size = 74;

    target.save();
    target.textAlign = 'center';
    target.textBaseline = 'middle';

    const put = (line, y, px, a, weight, col) => {
      if (!line) return;
      target.font = `${weight} ${px}px ui-sans-serif, system-ui, "Segoe UI", "Microsoft YaHei", sans-serif`;
      let w = target.measureText(line.text).width;
      const maxW = DW * 0.78;
      const fit = w > maxW ? maxW / w : 1;
      target.save();
      target.translate(DW / 2, y);
      target.scale(fit, fit);
      target.globalAlpha = a;
      target.fillStyle = col;
      target.fillText(line.text, 0, 0);
      target.restore();
    };

    // neighbours, small and dim, sliding with the line
    put(prev, baseY - 84 - p * 12, 34, alpha * 0.34, 500, dimCol);
    put(next, baseY + 86 + p * 12, 34, alpha * 0.26, 500, dimCol);

    // current line: punches slightly on the beat
    const punch = 1 + 0.03 * bs.pulse;
    target.save();
    target.translate(DW / 2, baseY + rise);
    target.scale(punch, punch);
    target.translate(-DW / 2, -(baseY + rise));
    put(cur, baseY + rise, size, clamp(alpha + 0.2, 0, 1), 700, '#ffffff');
    target.restore();

    // glow copy of the same line into the bloom buffer (thin -> a halo, not a smear)
    if (core) put(cur, baseY + rise, size, alpha * 0.45, 700, accent);
    target.restore();
  }

  function drawHUD(t, bs) {
    main.save();
    main.font = '500 24px ui-monospace, "Cascadia Mono", Consolas, monospace';
    main.textBaseline = 'middle';

    const title = (song && song.title) || 'untitled';
    main.fillStyle = hexToRgba(textCol, 0.82);
    main.textAlign = 'left';
    main.fillText(title, 84, 74);

    main.fillStyle = hexToRgba(dimCol, 0.9);
    main.font = '400 20px ui-monospace, "Cascadia Mono", Consolas, monospace';
    main.fillText((song && song.artist) || '', 84, 106);

    main.textAlign = 'right';
    main.font = '500 22px ui-monospace, "Cascadia Mono", Consolas, monospace';
    main.fillStyle = hexToRgba(accent, 0.95);
    main.fillText(`${bpm.toFixed(1)} BPM`, DW - 84, 74);
    main.fillStyle = hexToRgba(dimCol, 0.9);
    main.fillText(`BAR ${String(barIndex(t) + 1).padStart(2, '0')}`, DW - 84, 106);

    // progress bar along the bottom
    const p = clamp(t / duration, 0, 1);
    const x0 = 84, x1 = DW - 84, y = DH - 56;
    main.strokeStyle = hexToRgba(textCol, 0.14);
    main.lineWidth = 3;
    main.beginPath();
    main.moveTo(x0, y);
    main.lineTo(x1, y);
    main.stroke();
    main.strokeStyle = hexToRgba(accent, 0.9);
    main.beginPath();
    main.moveTo(x0, y);
    main.lineTo(lerp(x0, x1, p), y);
    main.stroke();
    main.fillStyle = hexToRgba(accent, 1);
    main.beginPath();
    main.arc(lerp(x0, x1, p), y, 6, 0, TAU);
    main.fill();

    const fmt = (s) => `${String(Math.floor(s / 60)).padStart(2, '0')}:${(s % 60).toFixed(2).padStart(5, '0')}`;
    main.fillStyle = hexToRgba(dimCol, 0.85);
    main.font = '400 19px ui-monospace, "Cascadia Mono", Consolas, monospace';
    main.textAlign = 'left';
    main.fillText(fmt(t), x0, y + 34);
    main.textAlign = 'right';
    main.fillText(fmt(duration), x1, y + 34);
    main.restore();
  }

  function drawPost(t, bs) {
    // vignette
    const v = main.createRadialGradient(DW / 2, DH / 2, DH * 0.42, DW / 2, DH / 2, DH * 0.95);
    v.addColorStop(0, 'rgba(0,0,0,0)');
    v.addColorStop(1, 'rgba(0,0,0,0.62)');
    main.fillStyle = v;
    main.fillRect(0, 0, DW, DH);

    // scanlines, very light - keeps the "screen" feeling without hurting legibility
    main.save();
    main.globalAlpha = 0.06;
    main.fillStyle = '#000000';
    for (let y = 0; y < DH; y += 4) main.fillRect(0, y, DW, 1.4);
    main.restore();

    // a full-frame flash on the downbeat, once per bar
    const flash = Math.pow(1 - Math.min(1, bs.sinceDown / 1.2), 6) * 0.10;
    if (flash > 0.002) {
      main.fillStyle = hexToRgba(accent, flash);
      main.fillRect(0, 0, DW, DH);
    }
  }

  // -------------------------------------------------------------------- renderAt
  function renderAt(t) {
    const tt = clamp(t, 0, duration);
    const bs = beatState(tt);

    main.setTransform(sx, 0, 0, sy, 0, 0);
    main.globalCompositeOperation = 'source-over';
    main.globalAlpha = 1;
    main.filter = 'none';

    drawBackground(tt);
    drawStars(tt, bs.pulse);

    const cx = DW * 0.5, cy = DH * 0.385;

    // soft scrim behind the lyric band so the rings/spectrum never fight the text
    const scrim = main.createLinearGradient(0, DH * 0.60, 0, DH * 0.92);
    scrim.addColorStop(0, hexToRgba(bgCol, 0));
    scrim.addColorStop(0.35, hexToRgba(bgCol, 0.55));
    scrim.addColorStop(1, hexToRgba(bgCol, 0.80));
    main.fillStyle = scrim;
    main.fillRect(0, DH * 0.60, DW, DH * 0.32);

    drawSpectrumRing(cx, cy, tt, bs.pulse);
    drawRings(cx, cy, tt, bs, main);
    drawCore(cx, cy, tt, bs, main, 1);

    // ---- bloom pass: rings + core + lyric glow are redrawn small, blurred, added back
    if (canFilter) {
      bloom.setTransform(1, 0, 0, 1, 0, 0);
      bloom.clearRect(0, 0, W, H);
      bloom.setTransform(sx, 0, 0, sy, 0, 0);
      bloom.globalCompositeOperation = 'source-over';
      drawRings(cx, cy, tt, bs, bloom);
      drawCore(cx, cy, tt, bs, bloom, 1);
      drawLyrics(tt, bs, bloom, true);
      main.save();
      main.globalCompositeOperation = 'lighter';
      main.globalAlpha = clamp(glowAmt, 0, 1);
      main.filter = `blur(${(14 * scale).toFixed(2)}px)`;
      main.setTransform(1, 0, 0, 1, 0, 0);
      main.drawImage(bloomCanvas, 0, 0);
      main.filter = 'none';
      main.globalAlpha = 1;
      main.globalCompositeOperation = 'source-over';
      main.restore();
      main.setTransform(sx, 0, 0, sy, 0, 0);
    }

    drawLyrics(tt, bs, main, false);
    drawHUD(tt, bs);
    drawPost(tt, bs);

    main.setTransform(1, 0, 0, 1, 0, 0);
    return { t: tt, beat: bs.idx, pulse: +bs.pulse.toFixed(3) };
  }

  return { renderAt, width: W, height: H, duration, bpm, sections };
}
