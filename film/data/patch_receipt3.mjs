// receipt 第三轮：镜头第 1 帧仍是一张空白纸（所有元素都从 local>0 才出现）。
// 真实小票底部本来就有一整块「静态印刷信息」——支付方式 / 收银员 / 门店 / 服务热线 / 发票抬头，
// 这些从第 0 帧就印在纸上。用它把下半张纸填满，并把朱印提前到 0.35 s。
import fs from 'fs';
const p = 'E:/新建文件夹/实习/MV/film/src/layouts.js';
let s = fs.readFileSync(p, 'utf8');

// 1) 朱印提前
s = s.replace(`      const sk = clamp((c.local - 0.9) / 0.35, 0, 1);`,
              `      const sk = clamp((c.local - 0.35) / 0.35, 0, 1);`);

// 2) 静态票尾块：插在「已支付朱印」之前，任何时刻都画
const anchor = `    // ---- 已支付朱印（0.9 s 就盖，填补 TOTAL 出现前的下半版面）----`;
if (!s.includes(anchor)) throw new Error('seal anchor not found');
const block = `    // ---- 静态票尾（从第 0 帧就在纸上，填满下半张纸）----
    {
      const fy = ry + rh - 250;
      ctx.save();
      ctx.fillStyle = inkC;
      // 虚线
      ctx.globalAlpha = 0.35;
      for (let dx = rx + L; dx < R; dx += 12) ctx.fillRect(dx, fy - 8, 6, 1.2);
      ctx.globalAlpha = 1;

      const rows = [
        ['支付方式', '微信支付'],
        ['收银员', '0001 · 陈工'],
        ['门店', '卓越路店 / ZHUOYUE RD.'],
        ['服务热线', '400-1000-1001'],
        ['发票抬头', '本人（未开）'],
      ];
      rows.forEach((r, i) => {
        const y = fy + 34 + i * 40;
        mono(r[0], rx + L, y, { size: 16, color: dimC, letterSpacing: 2 });
        mono(r[1], R, y, { size: 17, align: 'right' });
      });
      ctx.restore();
    }
` + anchor;
s = s.replace(anchor, block);

fs.writeFileSync(p, s);
console.log('receipt v3, bytes', s.length);
