// 插图窗加 insetAlpha / insetTone 支持：纸纹这类浅色图不能按 0.5 半透糊上去，会变成一块刺眼白板
import fs from 'fs';
const p = 'E:/新建文件夹/实习/MV/film/src/shotfilm.js';
let s = fs.readFileSync(p, 'utf8');

const before = `    const w = 292, h = 168;
    const x = W - 120 - w, y = 176;
    ctx.save();
    ctx.globalAlpha = 0.5 * k;
    window.PHOTO.plate(q.inset, x, y, w, h, { tone: 'dark', label: false });
    ctx.restore();`;
const after = `    const w = 292, h = 168;
    const x = W - 120 - w, y = 176;
    const ia = q.insetAlpha == null ? 0.5 : q.insetAlpha;
    const itone = q.insetTone || 'dark';
    ctx.save();
    ctx.globalAlpha = ia * k;
    window.PHOTO.plate(q.inset, x, y, w, h, { tone: itone, label: false });
    ctx.restore();`;
if (!s.includes(before)) throw new Error('inset plate anchor not found');
s = s.replace(before, after);

// 浅底压印那层只在非纸纹时加（纸纹本身就是浅色）
s = s.replace(`    if (lightNow) {`, `    if (lightNow && itone !== 'paper') {`);
fs.writeFileSync(p, s);
console.log('insetAlpha ok', s.length);
