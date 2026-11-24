// film/render.mjs —— 逐帧导出 MP4
// 用法:
//   node film/render.mjs --out out/film.mp4 --audio "The OGs 视频音轨.mp3"
//   node film/render.mjs --from 14 --to 34 --out out/seg_hook.mp4   (只导一段，出预览)
//   node film/render.mjs --fps 30 --crf 20 --width 1920 --height 1080
// 说明: 起一个本地静态服务器 → playwright-core 连本机 Chrome → 逐帧 renderAt(t)
//       → screenshot(PNG) → 管道送 ffmpeg → 最后把音频混进来。
//       不带音轨段时输出纯视频（--no-audio）。

import { chromium } from 'file:///E:/新建文件夹/实习/MV/ref_mv/node_modules/playwright-core/index.mjs';
import { spawn } from 'node:child_process';
import http from 'node:http';
import fs from 'node:fs';
import path from 'node:path';

const ROOT = 'E:/新建文件夹/实习/MV/film';
const CHROME = 'C:/Program Files/Google/Chrome/Application/chrome.exe';
const FFMPEG = 'E:/新建文件夹/实习/MV/ref_mv/node_modules/ffmpeg-static/ffmpeg.exe';

// ---------- 参数 ----------
function arg(name, def) {
  const i = process.argv.indexOf('--' + name);
  return i > -1 && process.argv[i + 1] && !process.argv[i + 1].startsWith('--') ? process.argv[i + 1] : def;
}
function flag(name) { return process.argv.includes('--' + name); }

const OUT = arg('out', 'E:/新建文件夹/实习/MV/out/film.mp4');
const FPS = parseInt(arg('fps', '60'), 10);
const CRF = arg('crf', '20');
const PRESET = arg('preset', 'veryfast');
const WIDTH = parseInt(arg('width', '1920'), 10);
const HEIGHT = parseInt(arg('height', '1080'), 10);
const AUDIO = arg('audio', 'E:/新建文件夹/实习/MV/The OGs 视频音轨.mp3');
const NO_AUDIO = flag('no-audio');
const FROM = parseFloat(arg('from', '0'));
const TO = parseFloat(arg('to', '0'));           // 0 = 到片尾
const LOG = arg('log', '');
// 帧编码：jpeg 比 png 快 10 倍以上（纸纹段 png 635ms/f vs jpeg 44ms/f），q95 肉眼无差
const JPEG_Q = parseInt(arg('quality', '95'), 10);

fs.mkdirSync(path.dirname(OUT), { recursive: true });
const logLines = [];
function log(msg) {
  const line = `[${new Date().toISOString().slice(11, 19)}] ${msg}`;
  console.log(line);
  logLines.push(line);
  if (LOG) fs.writeFileSync(LOG, logLines.join('\n'), 'utf8');
}

// ---------- 静态服务器 ----------
const MIME = { '.html': 'text/html; charset=utf-8', '.js': 'text/javascript; charset=utf-8', '.json': 'application/json', '.mp3': 'audio/mpeg', '.wav': 'audio/wav', '.png': 'image/png' };
const server = http.createServer((req, res) => {
  const rel = decodeURIComponent(req.url.split('?')[0]);
  let p = path.join(ROOT, rel);
  if (!fs.existsSync(p) || fs.statSync(p).isDirectory()) p = path.join(ROOT, 'index.html');
  res.writeHead(200, { 'content-type': MIME[path.extname(p)] || 'application/octet-stream' });
  fs.createReadStream(p).pipe(res);
});
await new Promise((r) => server.listen(0, '127.0.0.1', r));
const URL_BASE = `http://127.0.0.1:${server.address().port}/index.html?export=1`;
log(`serve ${URL_BASE} → ${OUT}  ${WIDTH}x${HEIGHT}@${FPS} crf${CRF}`);

// ---------- 浏览器 ----------
const browser = await chromium.launch({
  executablePath: CHROME, headless: true,
  args: ['--use-angle=d3d11', '--enable-gpu', '--ignore-gpu-blocklist', '--force-color-profile=srgb',
    '--disable-lcd-text', '--hide-scrollbars', '--mute-audio'],
});
const page = await browser.newPage({ viewport: { width: WIDTH, height: HEIGHT }, deviceScaleFactor: 1 });
page.on('console', (m) => { if (m.type() === 'error') log('PAGE-ERR ' + m.text()); });
page.on('pageerror', (e) => log('PAGE-THROW ' + e.message));
await page.goto(URL_BASE, { waitUntil: 'load', timeout: 60000 });
await page.evaluate(() => document.fonts && document.fonts.ready);
await page.waitForFunction(() => window.__READY__ === true, { timeout: 30000 });

// 字体缺失检查（缺字要在渲染前炸掉，而不是出片后发现全变宋体）
const fontCheck = await page.evaluate(() => ({ title: document.title, ready: !document.title.startsWith('FONT-MISSING') }));
if (!fontCheck.ready) log('WARN ' + fontCheck.title);

// 总时长：从页面里读
const DURATION = await page.evaluate(() => window.TL.duration);
const t0 = Math.max(0, FROM);
const t1 = TO > 0 ? Math.min(TO, DURATION) : DURATION;
const nFrames = Math.ceil((t1 - t0) * FPS);
log(`range ${t0.toFixed(2)} → ${t1.toFixed(2)}s  frames=${nFrames}`);

// canvas 尺寸核对
const dims = await page.evaluate(() => {
  const c = document.getElementById('c');
  return { w: c.width, h: c.height, cssW: c.getBoundingClientRect().width, cssH: c.getBoundingClientRect().height };
});
log(`canvas ${dims.w}x${dims.h} css ${Math.round(dims.cssW)}x${Math.round(dims.cssH)}`);
if (dims.w !== WIDTH || dims.h !== HEIGHT) log(`WARN canvas ${dims.w}x${dims.h} != ${WIDTH}x${HEIGHT}`);

// 预热
for (let i = 0; i < 8; i++) await page.evaluate((t) => window.renderAt(t), t0 + i / FPS);

// ---------- ffmpeg ----------
const ffArgs = ['-hide_banner', '-loglevel', 'error', '-y',
  '-f', 'image2pipe', '-vcodec', 'mjpeg', '-framerate', String(FPS), '-i', '-'];
if (!NO_AUDIO && fs.existsSync(AUDIO)) {
  ffArgs.push('-ss', String(t0), '-t', String(Math.max(0.1, t1 - t0)), '-i', AUDIO);
}
ffArgs.push('-c:v', 'libx264', '-preset', PRESET, '-crf', CRF, '-pix_fmt', 'yuv420p',
  '-x264-params', 'keyint=120:min-keyint=60:scenecut=0',
  '-movflags', '+faststart');
if (!NO_AUDIO && fs.existsSync(AUDIO)) ffArgs.push('-c:a', 'aac', '-b:a', '192k', '-shortest');
ffArgs.push(OUT);
log('ffmpeg ' + ffArgs.join(' '));
const ff = spawn(FFMPEG, ffArgs, { stdio: ['pipe', 'inherit', 'pipe'] });
ff.stderr.on('data', (d) => { const s = d.toString().trim(); if (s) log('FF ' + s); });
const ffDone = new Promise((r) => ff.on('close', (c) => r(c)));

// ---------- 逐帧 ----------
const startAll = Date.now();
let bytes = 0;
for (let i = 0; i < nFrames; i++) {
  const t = t0 + i / FPS;
  await page.evaluate((tt) => window.renderAt(tt), t);
  const buf = await page.screenshot({
    type: 'jpeg', quality: JPEG_Q,
    clip: { x: 0, y: 0, width: WIDTH, height: HEIGHT },
  });
  bytes += buf.length;
  if (!ff.stdin.write(buf)) await new Promise((r) => ff.stdin.once('drain', r));
  if (i % 120 === 0 || i === nFrames - 1) {
    const el = (Date.now() - startAll) / 1000;
    const per = el / (i + 1);
    const eta = per * (nFrames - i - 1);
    log(`frame ${i + 1}/${nFrames}  t=${t.toFixed(2)}  ${(per * 1000).toFixed(1)}ms/f  eta ${Math.floor(eta / 60)}m${Math.round(eta % 60)}s  png ${(bytes / 1048576).toFixed(0)}MB`);
  }
}
ff.stdin.end();
const code = await ffDone;
const ms = Date.now() - startAll;
await browser.close();
server.close();

if (code !== 0) { log('FAIL ffmpeg exit ' + code); process.exit(1); }
const size = fs.existsSync(OUT) ? fs.statSync(OUT).size : 0;
log(`DONE ${OUT} ${(size / 1048576).toFixed(1)}MB  ${(ms / 1000).toFixed(1)}s  ${(ms / nFrames).toFixed(1)}ms/frame  png ${(bytes / 1048576).toFixed(1)}MB`);
console.log(JSON.stringify({ out: OUT, frames: nFrames, bytes: size, ms, msPerFrame: +(ms / nFrames).toFixed(1) }));
