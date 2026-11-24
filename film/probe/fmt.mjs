// film/probe/fmt.mjs —— 测 PNG vs JPEG 截图耗时（古代纸面段最重）
import { chromium } from 'file:///E:/新建文件夹/实习/MV/ref_mv/node_modules/playwright-core/index.mjs';
import fs from 'node:fs';
import http from 'node:http';
import path from 'node:path';

const ROOT = 'E:/新建文件夹/实习/MV/film';
const CHROME = 'C:/Program Files/Google/Chrome/Application/chrome.exe';
const MIME = { '.html': 'text/html; charset=utf-8', '.js': 'text/javascript; charset=utf-8', '.mp3': 'audio/mpeg', '.png': 'image/png' };

const server = http.createServer((req, res) => {
  const p = path.join(ROOT, decodeURIComponent(req.url.split('?')[0]));
  if (!fs.existsSync(p) || fs.statSync(p).isDirectory()) { res.writeHead(404); return res.end(); }
  res.writeHead(200, { 'content-type': MIME[path.extname(p)] || 'application/octet-stream' });
  fs.createReadStream(p).pipe(res);
});
await new Promise((r) => server.listen(0, '127.0.0.1', r));
const port = server.address().port;

const browser = await chromium.launch({ executablePath: CHROME, args: ['--disable-gpu-vsync'] });
const page = await browser.newPage({ viewport: { width: 1920, height: 1080 }, deviceScaleFactor: 1 });
await page.goto(`http://127.0.0.1:${port}/index.html?export=1`, { waitUntil: 'load' });
await page.waitForFunction('window.__READY__ === true', { timeout: 60000 });

const out = [];
for (const T of [5, 33, 47, 118, 145, 297]) {
  await page.evaluate((t) => window.renderAt(t), T);
  for (const fmt of ['png', 'jpeg']) {
    const t0 = Date.now();
    const opts = { type: fmt, clip: { x: 0, y: 0, width: 1920, height: 1080 } };
    if (fmt === 'jpeg') opts.quality = 95;
    let buf;
    for (let k = 0; k < 3; k++) buf = await page.screenshot(opts);
    const ms = (Date.now() - t0) / 3;
    out.push(`t=${T} ${fmt} ${ms.toFixed(1)}ms ${(buf.length / 1024).toFixed(0)}KB`);
  }
}
console.log(out.join('\n'));
await browser.close();
server.close();
process.exit(0);
