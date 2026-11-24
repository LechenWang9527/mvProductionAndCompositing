// 核心 bug 修复：text()/karaoke()/woodcutText() 内部用 `ctx.globalAlpha = X` 直接覆盖外层 alpha，
// 导致所有「先 ctx.globalAlpha=0.06 再 text(...)」的淡化层全部按 1.0 画出来。
// 改成与外层相乘（ctx.save() 之后 globalAlpha 继承自外层，所以 *= 即复合）。
import fs from 'fs';
const p = 'E:/新建文件夹/实习/MV/film/src/core.js';
let s = fs.readFileSync(p, 'utf8');
const reps = [
  // text()
  [`    ctx.save();
    ctx.globalAlpha = o.alpha == null ? 1 : o.alpha;
    ctx.fillStyle = o.color || '#fff';
    ctx.textAlign = o.align || 'left';`,
   `    ctx.save();
    ctx.globalAlpha *= o.alpha == null ? 1 : o.alpha;   // 与外层复合，不再硬覆盖
    ctx.fillStyle = o.color || '#fff';
    ctx.textAlign = o.align || 'left';`],
  // karaoke：已唱/未唱
  [`      ctx.globalAlpha = sung ? 1 : (o.unsung == null ? 0.28 : o.unsung);`,
   `      ctx.globalAlpha *= sung ? 1 : (o.unsung == null ? 0.28 : o.unsung);`],
  [`        ctx.globalAlpha = o.underlineAlpha == null ? 0.9 : o.underlineAlpha;`,
   `        ctx.globalAlpha *= o.underlineAlpha == null ? 0.9 : o.underlineAlpha;`],
  // woodcutText 的最终合成
  [`    ctx.save();
    ctx.globalAlpha = o.alpha == null ? 1 : o.alpha;
    ctx.drawImage(c, drawX, y - size * 1.12);`,
   `    ctx.save();
    ctx.globalAlpha *= o.alpha == null ? 1 : o.alpha;
    ctx.drawImage(c, drawX, y - size * 1.12);`],
];
let n = 0;
for (const [a, b] of reps) {
  if (!s.includes(a)) { console.log('MISS:', a.slice(0, 56).replace(/\n/g, ' | ')); continue; }
  s = s.replace(a, b); n++;
}
fs.writeFileSync(p, s);
console.log('core.js alpha composed:', n, '/', reps.length, 'bytes', s.length);
