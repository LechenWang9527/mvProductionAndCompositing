// 工牌内容增密：每张卡现在只有一个编号 + 一根顶条，卡面 90% 是空的。
// 补：证件照窗（斜排线占位）、姓名条（灰条代表未填）、职务行、工号/有效期、底部条码。
// 12 张卡 × 8 个镜头，一次改动覆盖面最大。
import fs from 'fs';
const p = 'E:/新建文件夹/实习/MV/film/src/layouts3.js';
let s = fs.readFileSync(p, 'utf8');

const before = `      text(\`#\${String(i + 1).padStart(4, '0')}\`, x + 16, y + 34, { size: 15, fam: 'mono', color: isLit ? pal.accent : pal.dim, letterSpacing: 2 });
      ctx.restore();`;
const after = `      text(\`#\${String(i + 1).padStart(4, '0')}\`, x + 24, y + 34, { size: 15, fam: 'mono', color: isLit ? pal.accent : pal.dim, letterSpacing: 2 });
      // 右侧：部门代号
      text(\`D\${String((i % 4) + 1).padStart(2, '0')}\`, x + cw - 16, y + 34,
        { size: 13, fam: 'mono', color: isLit ? pal.accent : pal.dim, align: 'right', letterSpacing: 2 });
      ctx.restore();

      // ---- 证件照窗（左上）+ 姓名条 / 职务 / 工号 / 有效期（右侧） ----
      ctx.save();
      const pk = appear * (isLit ? 0.42 + 0.58 * on : 0.34);
      ctx.globalAlpha = pk;
      const px2 = x + 22, py2 = y + 58, pw2 = 62, ph2 = 78;
      ctx.strokeStyle = isLit ? pal.accent : pal.line;
      ctx.lineWidth = 1;
      ctx.strokeRect(px2 + 0.5, py2 + 0.5, pw2, ph2);
      // 照片占位：斜排线 + 一个头肩轮廓
      ctx.globalAlpha = pk * 0.5;
      ctx.beginPath();
      ctx.arc(px2 + pw2 / 2, py2 + ph2 * 0.36, 13, 0, Math.PI * 2);
      ctx.stroke();
      ctx.beginPath();
      ctx.arc(px2 + pw2 / 2, py2 + ph2 * 0.96, 21, Math.PI, 0);
      ctx.stroke();
      // 姓名条（灰框代表未填）
      ctx.globalAlpha = pk * 0.75;
      ctx.fillStyle = isLit ? pal.accent : pal.ink;
      const tx2 = px2 + pw2 + 16, tw2 = cw - (px2 - x) - pw2 - 34;
      ctx.fillRect(tx2, py2 + 10, tw2 * 0.72, 7);
      ctx.globalAlpha = pk * 0.45;
      ctx.fillRect(tx2, py2 + 30, tw2 * 0.5, 5);
      ctx.fillRect(tx2, py2 + 46, tw2 * 0.36, 5);
      ctx.fillRect(tx2, py2 + 62, tw2 * 0.44, 5);
      // 底部条码
      ctx.globalAlpha = pk * 0.5;
      ctx.fillStyle = isLit ? pal.accent : pal.ink;
      let bx2 = x + 24;
      const bw2 = cw - 48;
      for (let k2 = 0; k2 < 26; k2++) {
        const w2 = 1 + ((i * 7 + k2 * 3) % 2);
        if (k2 % 2 === 0) ctx.fillRect(bx2, y + chh - 40, w2, 18);
        bx2 += w2 + 1.6;
        if (bx2 > x + cw - 26) break;
      }
      ctx.globalAlpha = pk * 0.6;
      text(\`\${String(i + 1).padStart(4, '0')} · 2Y\`, x + 24, y + chh - 12,
        { size: 11, fam: 'mono', color: isLit ? pal.accent : pal.dim, letterSpacing: 1.5 });
      ctx.restore();`;
if (!s.includes(before)) throw new Error('badge anchor not found');
s = s.replace(before, after);
fs.writeFileSync(p, s);
console.log('badge enriched, bytes', s.length);
