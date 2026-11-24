// 1) karaoke 支持 o.unsung（未唱字 alpha），黄底上默认 0.28 太糊
// 2) lyric() 透传 unsung / underline
// 3) swissBlocks: 大字就是这句歌词时不再重复画底部歌词；黄底未唱字提到 0.5
import fs from 'fs';
const root = 'E:/新建文件夹/实习/MV/';

// ---------- core.js ----------
const p0 = root + 'film/src/core.js';
let c0 = fs.readFileSync(p0, 'utf8');
const oldA = `      ctx.globalAlpha = sung ? 1 : 0.28;`;
if (!c0.includes(oldA)) throw new Error('karaoke alpha line not found');
c0 = c0.replace(oldA, `      ctx.globalAlpha = sung ? 1 : (o.unsung == null ? 0.28 : o.unsung);`);
fs.writeFileSync(p0, c0);
console.log('core.js ok');

// ---------- layouts.js ----------
const p1 = root + 'film/src/layouts.js';
let s = fs.readFileSync(p1, 'utf8');

const oldL = `      accent: o.accent || pal.accent, gap: o.gap == null ? 8 : o.gap,`;
if (!s.includes(oldL)) throw new Error('lyric accent line not found');
s = s.replace(oldL, `      accent: o.accent || pal.accent, gap: o.gap == null ? 8 : o.gap,
      unsung: o.unsung, underline: o.underline, underlineAlpha: o.underlineAlpha,`);

// swissBlocks 底部歌词：与本镜大字重复就不画；黄底提未唱对比
const oldLy = `    lyric(lineAt(c.t), c.t, pal, {
      y: H - 210, size: 58,
      color: bgIsYellow ? pal.bg : pal.dim,
      active: bgIsYellow ? pal.bg : pal.ink,
    });`;
if (!s.includes(oldLy)) throw new Error('swissBlocks lyric block not found');
const newLy = `    // 底部歌词：大字已经把这句唱出来时不重复；黄底上未唱字要更实
    const _ln = lineAt(c.t);
    const _dupe = _ln && (_ln.text.indexOf(str) >= 0 || str.indexOf(_ln.text) >= 0);
    if (!_dupe) {
      lyric(_ln, c.t, pal, {
        y: H - 210, size: 58,
        color: bgIsYellow ? pal.bg : pal.dim,
        active: bgIsYellow ? pal.bg : pal.ink,
        unsung: bgIsYellow ? 0.5 : 0.34,
      });
    }`;
s = s.replace(oldLy, newLy);
fs.writeFileSync(p1, s);
console.log('layouts.js ok', s.length);
