// receipt 第六轮：三处遮挡
//  1) 朱印 sy2 = ry+rh-300 = 708，正好压在 TOTAL 与 11079.00 上 → 移到左栏空白区（cx≈310, cy≈520）
//  2) 条码 by = ry+rh-110 = 898，与票尾 4 行（848/882/916/950）重叠 → 条码移到左栏下方（x≈180, y≈800）
//  3) 「NO REFUND · 不予退还 / THANK YOU」跟着条码走，一起搬到左栏
//  4) 右纸边的竖排小字与「已打印 7」右对齐文字贴太近 → 竖排文字内缩 8 px
import fs from 'fs';
const p = 'E:/新建文件夹/实习/MV/film/src/layouts.js';
let s = fs.readFileSync(p, 'utf8');

// 1) 朱印移到左栏
s = s.replace(`        const sx2 = rx + rw * 0.5, sy2 = ry + rh - 300;`,
              `        const sx2 = 310, sy2 = 520;   // 左栏暗区，不再压 TOTAL`);

// 2) 条码搬到左栏
s = s.replace(`      const by = ry + rh - 110;
      let bx = rx + L;`,
              `      const by = 800;
      let bx = 150;`);
s = s.replace(`      mono('NO REFUND  ·  不予退还', rx + L, by + 74, { size: 15, color: dimC, letterSpacing: 3 });
      mono('THANK YOU', R, by + 74, { size: 15, align: 'right', color: dimC, letterSpacing: 3 });`,
              `      mono('NO REFUND  ·  不予退还', 150, by + 70, { size: 15, color: dimC, letterSpacing: 3 });`);

// 3) 右纸边竖排内缩
s = s.replace(`        ctx.translate(rx + rw - 16, ry + rh * 0.52);`,
              `        ctx.translate(rx + rw - 10, ry + rh * 0.52);`);

fs.writeFileSync(p, s);
console.log('receipt v6, bytes', s.length);
