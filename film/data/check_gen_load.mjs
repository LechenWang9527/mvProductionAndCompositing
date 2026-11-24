// check_gen_load.mjs —— 端到端验证：PHOTO 能加载 IMG01/IMG02，且 ?t=38 能画出茅屋插图
import { chromium } from 'file:///E:/新建文件夹/实习/MV/ref_mv/node_modules/playwright-core/index.mjs';
import http from 'node:http';
import fs from 'node:fs';
import path from 'node:path';

const ROOT = 'E:/新建文件夹/实习/MV/film';
const MIME = { '.html': 'text/html', '.js': 'text/javascript', '.json': 'application/json', '.png': 'image/png', '.jpg': 'image/jpeg' };
const srv = http.createServer((req, res) => {
  let p = decodeURIComponent(req.url.split('?')[0]);
  if (p === '/') p = '/index.html';
  try {
    const d = fs.readFileSync(path.join(ROOT, p));
    res.writeHead(200, { 'Content-Type': MIME[path.extname(p)] || 'application/octet-stream' });
    res.end(d);
  } catch (e) { res.writeHead(404); res.end('nf'); }
});
srv.listen(0, async () => {
  const port = srv.address().port;
  const browser = await chromium.launch({ executablePath: 'C:/Program Files/Google/Chrome/Application/chrome.exe', args: ['--enable-unsafe-swiftshader'] });
  const page = await browser.newPage({ viewport: { width: 1920, height: 1080 } });
  const errs = [];
  page.on('pageerror', (e) => errs.push(String(e).slice(0, 160)));
  await page.goto('http://127.0.0.1:' + port + '/?export=1&t=38');
  await page.waitForFunction('window.PHOTO && window.PHOTO.loaded', { timeout: 20000 }).catch(() => errs.push('PHOTO not loaded'));
  const info = await page.evaluate(() => ({
    missing: window.PHOTO ? window.PHOTO.missing : null,
    hasImg01: window.PHOTO ? window.PHOTO.has('IMG01_dufu') : false,
    hasImg02: window.PHOTO ? window.PHOTO.has('IMG02_hut') : false,
    title: document.title,
    drawn: !!(window.__FRAME_OK !== false),
  }));
  console.log(JSON.stringify(info));
  console.log('pageerrors:', errs.length ? errs.join(' | ') : 'none');
  await browser.close();
  srv.close();
});
