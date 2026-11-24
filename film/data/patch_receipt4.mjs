// receipt 第四轮：镜头第一帧明细行仍是空的（at = i*0.26，local=0 时 e=0）。
// 让第一行在第 0 帧就已打印，并补「列头 + 品名/金额/本单共 N 项」把上半张纸填住。
import fs from 'fs';
const p = 'E:/新建文件夹/实习/MV/film/src/layouts.js';
let s = fs.readFileSync(p, 'utf8');

// 1) 明细提前：at 从 -0.30 起，镜头第 0 帧就能看到 2 行
const beforeAt = `      const at = i * 0.26;
      const e = clamp((c.local - at) / 0.14, 0, 1);
      if (e <= 0) continue;
      const y = ry + 160 + i * 62;`;
const afterAt = `      const at = -0.30 + i * 0.26;
      const e = clamp((c.local - at) / 0.14, 0, 1);
      if (e <= 0) continue;
      const y = ry + 196 + i * 60;`;
if (!s.includes(beforeAt)) throw new Error('rows anchor not found');
s = s.replace(beforeAt, afterAt);

// 2) 列头 + 计数（任何时刻都在，压住标题与明细之间的空白）
const anchor = `    // ---- 明细行（第一帧就开始打印，避免空纸）----`;
if (!s.includes(anchor)) throw new Error('items comment anchor not found');
const head = `    // ---- 列头（常驻）----
    mono('项', rx + L, ry + 158, { size: 14, color: dimC, letterSpacing: 2 });
    mono('品名', rx + L + 42, ry + 158, { size: 14, color: dimC, letterSpacing: 6 });
    mono('金额 / CNY', R, ry + 158, { size: 14, align: 'right', color: dimC, letterSpacing: 4 });
    ctx.save();
    ctx.globalAlpha = 0.3;
    ctx.fillStyle = inkC;
    ctx.fillRect(rx + L, ry + 168, rw - L * 2, 1);
    ctx.restore();
    // 「打印中 / 已打印 N 项」——随行数走，填住右侧空档
    {
      const done = Math.max(0, Math.min(items.length, Math.floor((c.local + 0.30) / 0.26) + 1));
      mono(\`共 \${items.length} 项  ·  已打印 \${done}\`, R, ry + 132,
        { size: 15, align: 'right', color: dimC, letterSpacing: 2 });
    }

` + anchor;
s = s.replace(anchor, head);

// 3) TOTAL 位置跟着新行距走
s = s.replace(`      const ty = ry + 160 + items.length * 62 + 30;`,
              `      const ty = ry + 196 + items.length * 60 + 34;`);
s = s.replace(`      ctx.fillRect(rx + L, ty - 46, rw - L * 2, 1.6);`,
              `      ctx.fillRect(rx + L, ty - 40, rw - L * 2, 1.6);`);

fs.writeFileSync(p, s);
console.log('receipt v4, bytes', s.length);
