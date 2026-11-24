// 一次性接线脚本：把 photo.js 接进引擎，并在 5 个镜头预留照片槽位
// 用法：node film/data/wire_photos.mjs
import fs from 'fs';

const root = 'E:/新建文件夹/实习/MV/';
const rd = (p) => fs.readFileSync(root + p, 'utf8');
const wr = (p, s) => { fs.writeFileSync(root + p, s); console.log('wrote', p, s.length); };

// ---------- 1) index.html：core.js 之后加载 photo.js ----------
let html = rd('film/index.html');
if (!html.includes('src/photo.js')) {
  html = html.replace('<script src="src/core.js"></script>',
    '<script src="src/core.js"></script>\n<script src="src/photo.js"></script>');
  wr('film/index.html', html);
}

// ---------- 2) main.js：启动时先加载照片清单 ----------
let main = rd('film/src/main.js');
if (!main.includes('PHOTO.load')) {
  main = main.replace(
    `  (async function boot() {
    try {
      await loadFonts();
    } catch (e) {
      console.error(e);
    }`,
    `  (async function boot() {
    try {
      await loadFonts();
    } catch (e) {
      console.error(e);
    }
    // 照片槽位：没有 manifest 或没有图都不报错，只是退回纯图形版
    if (window.PHOTO) {
      try { await window.PHOTO.load(); } catch (e) { console.warn('[photo]', e); }
    }`);
  wr('film/src/main.js', main);
}

// ---------- 3) photo.js：新增 bg()，把照片铺满整幅 ----------
let photo = rd('film/src/photo.js');
if (!photo.includes('function bg(')) {
  photo = photo.replace(
    `  // 只问有没有图（版式可以据此决定要不要画照片层）`,
    `  // 整幅底图：有图就铺满 + 压一层 scrim（保证上面压的字读得出来），返回 true
  // 没图返回 false —— 调用方走原来的纯图形背景，不会留下占位框
  function bg(id, tone, o) {
    o = o || {};
    if (!has(id)) return false;
    const T = TONES[tone] || TONES.dark;
    plate(id, 0, 0, W, H, { tone, alpha: o.alpha == null ? 1 : o.alpha, label: false });
    const scrim = o.scrim == null ? 0 : o.scrim;
    if (scrim > 0) {
      ctx.save();
      ctx.globalAlpha = scrim;
      ctx.fillStyle = o.scrimColor || T.paper;
      ctx.fillRect(0, 0, W, H);
      ctx.restore();
    }
    return true;
  }

  // 只问有没有图（版式可以据此决定要不要画照片层）`);
  photo = photo.replace('  window.PHOTO = {\n    load, plate, has, gray,',
    '  window.PHOTO = {\n    load, plate, has, gray, bg,');
  wr('film/src/photo.js', photo);
}

// ---------- 4) shotfilm.js：给 5 个镜头挂上槽位 ----------
let sf = rd('film/src/shotfilm.js');
const swaps = [
  [`    25: { k: 'phoneDown', p: {} },`,
   `    25: { k: 'phoneDown', p: { photo: 'P01' } },`],
  [`    35: { k: 'swissBlocks', p: { text: '我是工艺人', marpol: true } },`,
   `    35: { k: 'swissBlocks', p: { text: '我是工艺人', marpol: true, inkMode: 'accent', logo: 'P04' } },`],
  [`    51: { k: 'swissBlocks', p: { text: '我是过来人', marpol: true } },`,
   `    51: { k: 'swissBlocks', p: { text: '我是过来人', marpol: true, bgMode: 'yellow', inkMode: 'bg' } },`],
  [`    66: { k: 'processFlow', p: {} },`,
   `    66: { k: 'processFlow', p: { photo: 'P02' } },`],
  [`    70: { k: 'chartGrow', p: { bars: 9, line: true, title: '生产制造 · 大有文章', note: '数据护航', seed: 29 } },`,
   `    70: { k: 'chartGrow', p: { bars: 9, line: true, title: '生产制造 · 大有文章', note: '数据护航', seed: 29, photo: 'P02' } },`],
  [`    78: { k: 'swissBlocks', p: { text: '我是过来人', marpol: true } },`,
   `    78: { k: 'swissBlocks', p: { text: '我是过来人', marpol: true, bgMode: 'yellow', inkMode: 'bg' } },`],
  [`    83: { k: 'swissBlocks', p: { text: '我是工艺人', marpol: true, sub: '站在卓越路上 追着共同的梦' } },`,
   `    83: { k: 'swissBlocks', p: { text: '我是工艺人', marpol: true, sub: '站在卓越路上 追着共同的梦', inkMode: 'accent', photo: 'P03', photoAlpha: 0.72, photoScrim: 0.38, horizon: true, logo: 'P04' } },`],
];
for (const [a, b] of swaps) {
  if (!sf.includes(a)) { console.error('MISS PLAN:', a); process.exitCode = 1; continue; }
  sf = sf.replace(a, b);
}
wr('film/src/shotfilm.js', sf);

console.log('done');
