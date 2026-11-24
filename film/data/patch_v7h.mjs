// 关键 bug：photo.plate() 内部会 ctx.save() 并自己设 globalAlpha（o.alpha 默认 1），
// 所以外层设的 globalAlpha 被覆盖 —— 所有「半透插图窗」其实一直是不透明的。
// 改为把 alpha 通过 o.alpha 传进去。
import fs from 'fs';
const p = 'E:/新建文件夹/实习/MV/film/src/shotfilm.js';
let s = fs.readFileSync(p, 'utf8');
const before = `    ctx.save();
    ctx.globalAlpha = ia * k;
    window.PHOTO.plate(q.inset, x, y, w, h, { tone: itone, label: false });
    ctx.restore();`;
const after = `    window.PHOTO.plate(q.inset, x, y, w, h, { tone: itone, label: false, alpha: ia * k });`;
if (!s.includes(before)) throw new Error('plate alpha anchor not found');
s = s.replace(before, after);
fs.writeFileSync(p, s);
console.log('plate alpha passthrough ok', s.length);
