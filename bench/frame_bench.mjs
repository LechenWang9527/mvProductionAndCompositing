// Frame-throughput benchmark for the "code-rendered MV" pipeline on this machine.
// Measures: how many 1920x1080 frames/second headless Chrome can produce when each frame
// is driven by renderAt(t) and grabbed as a screenshot (the exact cost model of export.mjs).
import { chromium } from 'file:///E:/新建文件夹/实习/MV/ref_mv/node_modules/playwright-core/index.mjs';
import { spawn } from 'node:child_process';
import http from 'node:http';
import fs from 'node:fs';
import path from 'node:path';

const ROOT = 'E:/新建文件夹/实习/MV/ref_prompts/skills/code-animation-prompts/assets/starter';
const CHROME = 'C:/Program Files/Google/Chrome/Application/chrome.exe';
const FFMPEG = 'E:/新建文件夹/实习/MV/ref_mv/node_modules/ffmpeg-static/ffmpeg.exe';
const W = 1920, H = 1080, FPS = 60, SECONDS = 5;

// tiny static server (file:// can taint canvas ops we may need later)
const server = http.createServer((req, res) => {
  const p = path.join(ROOT, decodeURIComponent(req.url.split('?')[0]));
  const f = fs.existsSync(p) && fs.statSync(p).isFile() ? p : path.join(ROOT, 'index.html');
  res.writeHead(200, { 'content-type': 'text/html; charset=utf-8' });
  fs.createReadStream(f).pipe(res);
});
await new Promise((r) => server.listen(0, '127.0.0.1', r));
const url = `http://127.0.0.1:${server.address().port}/index.html?export=1`;

async function run(label, gpu) {
  const args = gpu ? ['--use-angle=d3d11', '--enable-gpu', '--ignore-gpu-blocklist'] : ['--disable-gpu'];
  const browser = await chromium.launch({ executablePath: CHROME, headless: true, args });
  const page = await browser.newPage({ viewport: { width: W, height: H }, deviceScaleFactor: 1 });
  await page.goto(url, { waitUntil: 'load' });
  await page.evaluate(() => document.fonts.ready);

  // warm-up
  for (let i = 0; i < 5; i++) await page.evaluate((t) => window.renderAt(t), i / FPS);

  const fps = 60, n = fps * SECONDS;
  const ff = spawn(FFMPEG, ['-hide_banner', '-loglevel', 'error', '-y',
    '-f', 'image2pipe', '-framerate', String(fps), '-i', '-',
    '-c:v', 'libx264', '-preset', 'veryfast', '-crf', '23', '-pix_fmt', 'yuv420p',
    path.join('E:/新建文件夹/实习/MV/out', `bench_${label}.mp4`)], { stdio: ['pipe', 'inherit', 'inherit'] });

  const t0 = performance.now();
  let bytes = 0;
  for (let i = 0; i < n; i++) {
    const t = i / fps;
    await page.evaluate((tt) => window.renderAt(tt), t);
    const buf = await page.screenshot({ type: 'png', clip: { x: 0, y: 0, width: W, height: H } });
    bytes += buf.length;
    if (!ff.stdin.write(buf)) await new Promise((r) => ff.stdin.once('drain', r));
  }
  ff.stdin.end();
  const ms = performance.now() - t0;
  await new Promise((r) => ff.on('close', r));
  await browser.close();
  const perFrame = ms / n;
  console.log(JSON.stringify({ label, gpu, frames: n, total_ms: Math.round(ms), per_frame_ms: +perFrame.toFixed(1),
    render_fps: +(1000 / perFrame).toFixed(1), png_MB: +(bytes / 1048576).toFixed(1),
    est_minutes_for_3_5min_song: +((217 * 60 * perFrame) / 60000).toFixed(1) }));
}

fs.mkdirSync('E:/新建文件夹/实习/MV/out', { recursive: true });
await run('gpu', true);
await run('cpu', false);
server.close();
