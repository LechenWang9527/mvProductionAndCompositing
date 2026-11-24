// film/stills.mjs —— 抽静帧，用来快速看画面（不做全片渲染）
// 用法: node film/stills.mjs 14.99 30 60 90 120 150 200 240 290
import { chromium } from 'file:///E:/新建文件夹/实习/MV/ref_mv/node_modules/playwright-core/index.mjs';
import http from 'node:http';
import fs from 'node:fs';
import path from 'node:path';

const ROOT = 'E:/新建文件夹/实习/MV/film';
const OUTDIR = 'E:/新建文件夹/实习/MV/out/stills';
const CHROME = 'C:/Program Files/Google/Chrome/Application/chrome.exe';
const W = 1920, H = 1080;

const times = process.argv.slice(2).map(Number).filter((x) => !Number.isNaN(x));

const MIME = { '.html': 'text/html; charset=utf-8', '.js': 'text/javascript; charset=utf-8', '.json': 'application/json' };
const server = http.createServer((req, res) => {
  const rel = decodeURIComponent(req.url.split('?')[0]);
  let p = path.join(ROOT, rel);
  if (!fs.existsSync(p) || fs.statSync(p).isDirectory()) p = path.join(ROOT, 'index.html');
  res.writeHead(200, { 'content-type': MIME[path.extname(p)] || 'application/octet-stream' });
  fs.createReadStream(p).pipe(res);
});
await new Promise((r) => server.listen(0, '127.0.0.1', r));
const url = `http://127.0.0.1:${server.address().port}/index.html?export=1`;

fs.mkdirSync(OUTDIR, { recursive: true });
const browser = await chromium.launch({ executablePath: CHROME, headless: true, args: ['--use-angle=d3d11', '--enable-gpu', '--ignore-gpu-blocklist', '--force-color-profile=srgb'] });
const page = await browser.newPage({ viewport: { width: W, height: H }, deviceScaleFactor: 1 });
const errs = [];
page.on('pageerror', (e) => errs.push('THROW ' + e.message));
page.on('console', (m) => { if (m.type() === 'error') errs.push('ERR ' + m.text()); });
await page.goto(url, { waitUntil: 'load', timeout: 60000 });
await page.evaluate(() => document.fonts && document.fonts.ready);
await page.waitForFunction(() => window.__READY__ === true, { timeout: 30000 });
const title = await page.evaluate(() => document.title);

for (const t of times) {
  await page.evaluate((tt) => window.renderAt(tt), t);
  const f = path.join(OUTDIR, `t${t.toFixed(2).padStart(6, '0')}.png`);
  await page.screenshot({ path: f, clip: { x: 0, y: 0, width: W, height: H } });
  console.log(`still t=${t} → ${f} (${(fs.statSync(f).size / 1024).toFixed(0)}KB)`);
}
await browser.close();
server.close();
if (errs.length) console.log('--- PAGE ERRORS ---\n' + errs.join('\n'));
else console.log('no page errors');
if (title.startsWith('FONT-MISSING')) console.log('FONT PROBLEM: ' + title);
