// film/probe/shot.mjs —— 给任意本地 html 拍照（探针用）
// 用法: node film/probe/shot.mjs probe/woodcut.html out/probe_woodcut.png [宽 高]
import { chromium } from 'file:///E:/新建文件夹/实习/MV/ref_mv/node_modules/playwright-core/index.mjs';
import http from 'node:http';
import fs from 'node:fs';
import path from 'node:path';

const ROOT = 'E:/新建文件夹/实习/MV/film';
const rel = process.argv[2];
const out = process.argv[3] || 'E:/新建文件夹/实习/MV/out/probe.png';
const W = parseInt(process.argv[4] || '1200', 10);
const H = parseInt(process.argv[5] || '700', 10);

const MIME = { '.html': 'text/html; charset=utf-8', '.js': 'text/javascript; charset=utf-8', '.json': 'application/json' };
const server = http.createServer((req, res) => {
  const p = path.join(ROOT, decodeURIComponent(req.url.split('?')[0]));
  if (!fs.existsSync(p)) { res.writeHead(404); res.end('nf ' + p); return; }
  res.writeHead(200, { 'content-type': MIME[path.extname(p)] || 'application/octet-stream' });
  fs.createReadStream(p).pipe(res);
});
await new Promise((r) => server.listen(0, '127.0.0.1', r));
const url = `http://127.0.0.1:${server.address().port}/${rel}`;

const browser = await chromium.launch({ executablePath: 'C:/Program Files/Google/Chrome/Application/chrome.exe', headless: true, args: ['--force-color-profile=srgb'] });
const page = await browser.newPage({ viewport: { width: W, height: H }, deviceScaleFactor: 1 });
const errs = [];
page.on('pageerror', (e) => errs.push('THROW ' + e.message));
page.on('console', (m) => { if (m.type() === 'error') errs.push('ERR ' + m.text()); });
await page.goto(url, { waitUntil: 'load' });
await page.evaluate(() => document.fonts && document.fonts.ready);
await page.waitForFunction(() => window.__READY__ === true, { timeout: 20000 });
const title = await page.evaluate(() => document.title);
fs.mkdirSync(path.dirname(out), { recursive: true });
await page.screenshot({ path: out, clip: { x: 0, y: 0, width: W, height: H } });
console.log('title:', title);
console.log('shot:', out, fs.statSync(out).size, 'bytes');
if (errs.length) console.log('ERRORS:\n' + errs.join('\n'));
else console.log('no page errors');
await browser.close();
server.close();
