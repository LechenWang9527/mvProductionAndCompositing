// Step 4 - headless Chrome renders every frame with window.renderAt(t), the PNGs are piped
// straight into ffmpeg, the song is muxed in. Nothing is written to disk per frame.
//
//   node mv_engine/render.mjs [--start 0] [--end 10] [--w 960] [--h 540] [--fps 30]
//                             [--out out/demo.mp4] [--codec auto|h264_nvenc|libx264] [--crf 20]
//                             [--audio out/test.wav] [--features mv_engine/data/features.json]
//                             [--stills 0,2.5,5,7.5] [--headed]
//
// Times are SONG time (audio starts at 0).

import fs from 'node:fs';
import path from 'node:path';
import { spawn, spawnSync } from 'node:child_process';
import { createRequire } from 'node:module';
import { fileURLToPath } from 'node:url';
import { startServer, ROOT, ENGINE } from './serve.mjs';

const HERE = path.dirname(fileURLToPath(import.meta.url));

// ---- arguments ---------------------------------------------------------------
const argv = process.argv.slice(2);
const arg = (name, def = null) => {
  const i = argv.indexOf('--' + name);
  return i >= 0 && i + 1 < argv.length ? argv[i + 1] : def;
};
const has = (name) => argv.includes('--' + name);

const cfg = JSON.parse(fs.readFileSync(path.join(ENGINE, 'config.json'), 'utf8'));
const vcfg = cfg.video || {};
const ecfg = cfg.export || {};

const W = Math.round(+(arg('w', vcfg.width || 960)) / 2) * 2;
const H = Math.round(+(arg('h', vcfg.height || 540)) / 2) * 2;
const FPS = +arg('fps', vcfg.fps || 30);
const CRF = +arg('crf', ecfg.crf || 20);
const PORT = +arg('port', ecfg.port || 5177);
const HEADED = has('headed');

const AUDIO = path.resolve(ROOT, arg('audio', cfg.paths.audio));
const FEATURES = path.resolve(ROOT, arg('features', cfg.paths.features));
const OUT = path.resolve(ROOT, arg('out', 'out/demo.mp4'));
const STILLS = arg('stills', null);

// ---- ffmpeg ------------------------------------------------------------------
function findFfmpeg() {
  const explicit = arg('ffmpeg', null);
  if (explicit) return explicit;
  const candidates = [
    path.join(ROOT, 'ref_mv', 'node_modules', 'ffmpeg-static', 'ffmpeg.exe'),
    path.join(ROOT, 'node_modules', 'ffmpeg-static', 'ffmpeg.exe'),
  ];
  for (const c of candidates) if (fs.existsSync(c)) return c;
  const r = spawnSync('ffmpeg', ['-version'], { stdio: 'ignore' });
  if (r.status === 0) return 'ffmpeg';
  throw new Error('ffmpeg not found (put it in ref_mv/node_modules/ffmpeg-static or pass --ffmpeg)');
}
const FFMPEG = findFfmpeg();

/** Real probe: encode 5 black frames at the target size. Non-zero exit => the driver can't do it. */
function pickCodec() {
  const want = arg('codec', ecfg.codec || 'auto');
  if (want !== 'auto') return want;
  const r = spawnSync(FFMPEG, [
    '-hide_banner', '-loglevel', 'error', '-nostdin',
    '-f', 'lavfi', '-i', `color=black:s=${W}x${H}:r=${FPS}`,
    '-frames:v', '5', '-c:v', 'h264_nvenc', '-f', 'null', '-',
  ], { stdio: 'ignore' });
  if (r.status === 0) return 'h264_nvenc';
  console.log('[render] h264_nvenc unavailable -> falling back to libx264');
  return 'libx264';
}

function codecArgs(codec) {
  if (codec === 'h264_nvenc') {
    return ['-c:v', 'h264_nvenc', '-preset', 'p5', '-rc', 'vbr', '-cq', String(ecfg.nvencCq || 21),
      '-b:v', '0', '-pix_fmt', 'yuv420p'];
  }
  return ['-c:v', 'libx264', '-preset', arg('preset', ecfg.preset || 'medium'),
    '-crf', String(CRF), '-pix_fmt', 'yuv420p', '-tune', 'animation'];
}

/** ffprobe is not installed here; `ffmpeg -i` reports the same streams on stderr. */
function probe(file) {
  const r = spawnSync(FFMPEG, ['-hide_banner', '-nostdin', '-i', file], { encoding: 'utf8' });
  const out = `${r.stderr || ''}`;
  const lines = out.split(/\r?\n/).filter((l) => /Duration:|Stream #/.test(l)).map((l) => l.trim());
  const r2 = spawnSync(FFMPEG, ['-hide_banner', '-nostdin', '-i', file, '-map', '0:v:0', '-f', 'null', '-'],
    { encoding: 'utf8' });
  const m = /frame=\s*(\d+)/.exec(r2.stderr || '');
  return { lines, frames: m ? +m[1] : null };
}

// ---- playwright-core: reuse ref_mv/node_modules so nothing has to be installed -------------
function loadPlaywright() {
  const tries = [
    path.join(ROOT, 'ref_mv', 'package.json'),
    path.join(ROOT, 'package.json'),
  ];
  for (const base of tries) {
    try {
      const req = createRequire(base);
      return req('playwright-core');
    } catch { /* next */ }
  }
  try {
    return createRequire(path.join(ROOT, 'ref_mv', 'index.html'))('playwright-core');
  } catch (e) {
    throw new Error(`playwright-core not found (looked in ref_mv/node_modules): ${e.message}`);
  }
}

// ---- frame -> png ------------------------------------------------------------
const PNG_PREFIX = 'data:image/png;base64,';

async function grabFrames(page, first, last, fps) {
  const out = [];
  for (let i = first; i < last; i++) {
    const b64 = await page.evaluate(([t, prefix]) => {
      window.MV.renderAt(t);
      const url = window.MV.canvas.toDataURL('image/png');
      return url.startsWith(prefix) ? url.slice(prefix.length) : url;
    }, [i / fps, PNG_PREFIX]);
    out.push(Buffer.from(b64, 'base64'));
  }
  return out;
}

// ------------------------------------------------------------------------------ main
const codec = STILLS ? 'png' : pickCodec();
const stillTimes = STILLS ? STILLS.split(',').map(Number) : null;
const firstFrame = Math.round((+arg('start', 0)) * FPS);
const totalFramesArg = arg('end', null);
const lastFrame = totalFramesArg != null ? Math.round(+totalFramesArg * FPS) : null;

if (!fs.existsSync(FEATURES)) {
  console.error(`[render] features not found: ${FEATURES}\n         run: <python> mv_engine/analyze.py`);
  process.exit(1);
}
if (!fs.existsSync(AUDIO)) {
  console.error(`[render] audio not found: ${AUDIO}\n         run: <python> mv_engine/tools/make_test_audio.py`);
  process.exit(1);
}

const { url, close } = await startServer({ port: PORT });
const pageUrl = `${url}/mv_engine/index.html?export=1&w=${W}&h=${H}&fps=${FPS}` +
  `&features=${encodeURIComponent(relToEngine(FEATURES))}&lrc=${encodeURIComponent(relToEngine(path.resolve(ROOT, cfg.paths.lrc)))}`;

function relToEngine(p) {
  const engineRel = path.relative(ENGINE, p).replace(/\\/g, '/');
  if (!engineRel.startsWith('..')) return engineRel;                     // inside mv_engine/
  const projectRel = path.relative(ROOT, p).replace(/\\/g, '/');
  return '../' + projectRel;                                             // relative to /mv_engine/
}

const pw = loadPlaywright();
let browser = null;
const launchArgs = [
  '--ignore-gpu-blocklist', '--enable-gpu', '--use-angle=d3d11',
  '--force_high_performance_gpu', '--disable-background-timer-throttling',
  '--disable-renderer-backgrounding', '--disable-backgrounding-occluded-windows',
  '--hide-scrollbars', '--mute-audio',
];
for (const channel of ['chrome', 'msedge', undefined]) {
  try {
    browser = await pw.chromium.launch({ channel, headless: !HEADED, args: launchArgs });
    if (channel) console.log(`[render] browser: ${channel}`);
    break;
  } catch (e) { /* try the next one */ }
}
if (!browser) { close(); throw new Error('no Chrome/Edge found for Playwright'); }

let ff = null;
let ffDone = null;
let ffStats = { frames: 0 };
const started = Date.now();

try {
  const page = await browser.newPage({ viewport: { width: W, height: H }, deviceScaleFactor: 1 });
  const pageErrors = [];
  page.on('pageerror', (e) => pageErrors.push(e.message));
  page.on('console', (m) => { if (m.type() === 'error') console.error('[page]', m.text()); });

  await page.goto(pageUrl, { waitUntil: 'domcontentloaded' });
  await page.waitForFunction(() => window.MV && (window.MV.ready || window.MV.error), null, { timeout: 60000 });
  const err = await page.evaluate(() => (window.MV && window.MV.error) || null);
  if (err) throw new Error(`page boot failed: ${err}`);

  const info = await page.evaluate(() => ({
    duration: window.MV.duration, frames: window.MV.frameCount,
    bpm: window.MV.meta.bpm, t0: window.MV.meta.t0,
    lyrics: (window.MV.lyrics || []).length,
    bench: window.MV.bench(30),
  }));
  console.log(`[render] song ${info.duration.toFixed(2)} s · ${info.bpm?.toFixed(2)} BPM · ` +
    `t0 ${info.t0?.toFixed(3)} s · ${info.lyrics} lyric lines · ${info.frames} frames @ ${FPS} fps`);
  console.log(`[render] canvas draw cost: ${info.bench.toFixed(1)} ms/frame (30-frame bench)`);

  const last = lastFrame != null ? Math.min(lastFrame, info.frames) : info.frames;

  // ---- stills mode: a few PNGs for eyeballing, no video ----
  if (stillTimes) {
    fs.mkdirSync(path.dirname(OUT), { recursive: true });
    for (const t of stillTimes) {
      const [buf] = await grabFrames(page, Math.round(t * FPS), Math.round(t * FPS) + 1, FPS);
      const f = OUT.replace(/\.mp4$/i, '') + `_t${t.toFixed(2)}.png`;
      fs.writeFileSync(f, buf);
      console.log(`[render] still ${f}  (${(buf.length / 1024).toFixed(0)} KB)`);
    }
    close();
    await browser.close();
    process.exit(0);
  }

  const total = last - firstFrame;
  if (total <= 0) throw new Error(`empty range: start ${firstFrame / FPS} s >= end ${last / FPS} s`);

  // ---- ffmpeg ----
  fs.mkdirSync(path.dirname(OUT), { recursive: true });
  const aStart = firstFrame / FPS;
  const dur = total / FPS;
  const ffArgs = [
    '-y', '-hide_banner', '-loglevel', 'error', '-nostdin',
    '-f', 'image2pipe', '-framerate', String(FPS), '-i', 'pipe:0',
    '-ss', aStart.toFixed(6), '-t', dur.toFixed(6), '-i', AUDIO,
    '-map', '0:v:0', '-map', '1:a:0',
    '-vf', 'scale=out_color_matrix=bt709:out_range=limited,format=yuv420p',
    ...codecArgs(codec),
    '-colorspace', 'bt709', '-color_primaries', 'bt709', '-color_trc', 'bt709', '-color_range', 'tv',
    '-c:a', 'aac', '-b:a', ecfg.audioBitrate || '192k', '-ac', '2', '-ar', '44100',
    '-shortest', '-movflags', '+faststart',
    OUT,
  ];

  ff = spawn(FFMPEG, ffArgs, { stdio: ['pipe', 'inherit', 'inherit'] });
  ff.stdin.on('error', (e) => console.error('[ffmpeg stdin]', e.message));
  ffDone = new Promise((res, rej) => ff.on('exit', (c) => (c === 0 ? res() : rej(new Error('ffmpeg exit ' + c)))));

  console.log(`[render] ${W}x${H} @ ${FPS} fps · frames ${firstFrame}..${last - 1} (${total}) · ` +
    `song ${aStart.toFixed(3)}..${(last / FPS).toFixed(3)} s · codec ${codec}`);

  const writeFrame = (buf) => new Promise((res, rej) => {
    ff.stdin.write(buf, (e) => (e ? rej(e) : (ffStats.frames++, res())));
  });

  const CHUNK = Math.max(1, +arg('chunk', ecfg.chunkFrames || 8));
  const tStart = Date.now();
  let nextProgress = tStart + 1000;
  for (let a = firstFrame; a < last; a += CHUNK) {
    const b = Math.min(last, a + CHUNK);
    const bufs = await grabFrames(page, a, b, FPS);
    for (const buf of bufs) await writeFrame(buf);
    if (pageErrors.length) throw new Error(`page error: ${pageErrors[0]}`);
    const now = Date.now();
    if (now >= nextProgress) {
      nextProgress = now + 1000;
      const done = b - firstFrame;
      const rate = done / ((now - tStart) / 1000);
      process.stdout.write(`\r[render] ${done}/${total} frames · ${rate.toFixed(1)} fps · ` +
        `eta ${Math.max(0, Math.ceil((total - done) / rate))}s   `);
    }
  }
  process.stdout.write('\n');

  ff.stdin.end();
  await ffDone;
  const renderMs = Date.now() - tStart;
  const totalMs = Date.now() - started;
  const size = fs.statSync(OUT).size;

  console.log(`[render] wrote ${OUT}`);
  console.log(`[render] render ${(renderMs / 1000).toFixed(2)} s for ${total} frames = ` +
    `${(total / (renderMs / 1000)).toFixed(2)} fps · ${(renderMs / total).toFixed(1)} ms/frame · ` +
    `wall ${(totalMs / 1000).toFixed(2)} s`);
  console.log(`[render] size ${(size / 1048576).toFixed(2)} MB (${size} bytes) · ` +
    `${(size * 8 / (total / FPS) / 1e6).toFixed(0)} Mbps`);

  const pr = probe(OUT);
  for (const l of pr.lines) console.log('[probe] ' + l);
  if (pr.frames != null) console.log(`[probe] decoded video frames: ${pr.frames}`);

  fs.writeFileSync(path.join(ROOT, 'out', 'render_report.json'), JSON.stringify({
    out: OUT, width: W, height: H, fps: FPS, codec,
    frames: total, bytes: size,
    renderSeconds: +(renderMs / 1000).toFixed(3),
    framesPerSecond: +(total / (renderMs / 1000)).toFixed(2),
    msPerFrame: +(renderMs / total).toFixed(2),
    wallSeconds: +(totalMs / 1000).toFixed(3),
    drawMsPerFrame: +info.bench.toFixed(2),
    bpm: info.bpm, t0: info.t0, duration: info.duration,
    audio: AUDIO, features: FEATURES,
    probe: pr.lines,
  }, null, 3));
  console.log(`[render] report -> out/render_report.json`);
} finally {
  try { if (ff && !ff.killed) ff.kill(); } catch { /* ignore */ }
  try { await browser.close(); } catch { /* ignore */ }
  close();
}
