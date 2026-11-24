// 插图窗按底色自适应：浅纸底用深墨框与标签（金色 #c8a24a 在纸上看不清）
import fs from 'fs';
const p = 'E:/新建文件夹/实习/MV/film/src/shotfilm.js';
let s = fs.readFileSync(p, 'utf8');
const before = `    ctx.save();
    ctx.globalAlpha = 0.75 * k;
    ctx.strokeStyle = '#c8a24a';
    ctx.lineWidth = 1;
    ctx.strokeRect(x + 0.5, y + 0.5, w, h);
    ctx.globalAlpha = 0.55 * k;
    ctx.fillStyle = '#c8a24a';
    ctx.fillRect(x, y - 18, w, 1);
    const lab = q.insetLabel || 'REF';
    text(lab, x, y - 26, { size: 15, fam: 'mono', color: '#c8a24a', letterSpacing: 4 });
    ctx.restore();`;
const after = `    // 浅纸底上金色框会消失，改深墨；深底仍用金
    const lightNow = !!window.__LIGHT;
    const frameCol = lightNow ? '#3a2f22' : '#c8a24a';
    ctx.save();
    ctx.globalAlpha = (lightNow ? 0.6 : 0.75) * k;
    ctx.strokeStyle = frameCol;
    ctx.lineWidth = 1;
    ctx.strokeRect(x + 0.5, y + 0.5, w, h);
    ctx.globalAlpha = (lightNow ? 0.42 : 0.55) * k;
    ctx.fillStyle = frameCol;
    ctx.fillRect(x, y - 18, w, 1);
    const lab = q.insetLabel || 'REF';
    text(lab, x, y - 26, { size: 15, fam: 'mono', color: frameCol, letterSpacing: 4 });
    ctx.restore();
    // 浅底上给照片加一层纸色压印，避免「贴了一张对比过强的照片」
    if (lightNow) {
      ctx.save();
      ctx.globalAlpha = 0.16 * k;
      ctx.fillStyle = '#e6dcc8';
      ctx.fillRect(x, y, w, h);
      ctx.restore();
    }`;
if (!s.includes(before)) throw new Error('inset colors anchor not found');
s = s.replace(before, after);
fs.writeFileSync(p, s);
console.log('inset adaptive ok', s.length);
