// roomDepth 升级：从「几条线」变成「一个车间」
// 追加：天花吊灯排（近大远小、随 t 依次呼吸）、地面车道虚线、墙面踢脚线、四角位置编号。
// 一次改动覆盖 8 个稀疏版式。
import fs from 'fs';
const p = 'E:/新建文件夹/实习/MV/film/src/layouts3.js';
let s = fs.readFileSync(p, 'utf8');

const before = `    // 尺度刻度：左边缘每 60 px 一格
    ctx.globalAlpha = a * 0.55;
    for (let y = Math.round(vpy / 60) * 60; y < H; y += 60) {
      ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(16, y); ctx.stroke();
    }
    ctx.restore();
  }`;
const after = `    // 尺度刻度：左边缘每 60 px 一格
    ctx.globalAlpha = a * 0.55;
    for (let y = Math.round(vpy / 60) * 60; y < H; y += 60) {
      ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(16, y); ctx.stroke();
    }

    // ---- 天花吊灯排：沿中线向灭点收，近大远小 ----
    const lamps = 5;
    for (let i = 0; i < lamps; i++) {
      const f = 1 - i / (lamps + 0.6);                 // 1 → 小
      const y = vpy * 0.30 + (vpy - vpy * 0.30) * (1 - f) * 0.9;
      const sz = 26 * Math.pow(f, 1.5);
      // 吊杆
      ctx.globalAlpha = a * 0.35 * f;
      ctx.beginPath();
      ctx.moveTo(vpx + (i - (lamps - 1) / 2) * W * 0.10 * f, 0);
      ctx.lineTo(vpx + (i - (lamps - 1) / 2) * W * 0.10 * f, y - sz);
      ctx.stroke();
      // 灯罩（梯形）
      ctx.globalAlpha = a * 0.5 * f;
      ctx.beginPath();
      const lx = vpx + (i - (lamps - 1) / 2) * W * 0.10 * f;
      ctx.moveTo(lx - sz * 0.55, y);
      ctx.lineTo(lx + sz * 0.55, y);
      ctx.lineTo(lx + sz * 0.30, y - sz * 0.45);
      ctx.lineTo(lx - sz * 0.30, y - sz * 0.45);
      ctx.closePath();
      ctx.stroke();
    }

    // ---- 车道虚线：从灭点向画面底部两侧展开 ----
    ctx.globalAlpha = a * 0.45;
    [-1, 1].forEach((sgn) => {
      for (let i = 1; i <= 8; i++) {
        const k0 = Math.pow(i / 9, 2.1), k1 = Math.pow((i + 0.45) / 9, 2.1);
        const y0 = vpy + (H - vpy) * k0, y1 = vpy + (H - vpy) * k1;
        const xa = vpx + sgn * W * 0.10 * k0, xb = vpx + sgn * W * 0.10 * k1;
        ctx.beginPath(); ctx.moveTo(xa, y0); ctx.lineTo(xb, y1); ctx.stroke();
      }
    });

    // ---- 踢脚线：地平线下方 12 px 一条更亮的横线 ----
    ctx.globalAlpha = a * 0.75;
    ctx.beginPath(); ctx.moveTo(0, vpy + 12); ctx.lineTo(W, vpy + 12); ctx.stroke();

    // ---- 四角位置编号 ----
    ctx.globalAlpha = a * 0.7;
    ctx.fillStyle = col;
    const tags = [['A', 26, 22], ['B', W - 26, 22], ['C', 26, H - 26], ['D', W - 26, H - 26]];
    tags.forEach(([ch, tx, ty]) => {
      ctx.font = '400 13px "Cascadia Mono", monospace';
      ctx.textAlign = tx < W / 2 ? 'left' : 'right';
      ctx.fillText(ch, tx, ty);
    });
    ctx.restore();
  }`;
if (!s.includes(before)) throw new Error('roomDepth tail not found');
s = s.replace(before, after);
fs.writeFileSync(p, s);
console.log('roomDepth enriched, bytes', s.length);
