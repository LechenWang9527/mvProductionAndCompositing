// receipt 第七轮：左栏元素重新排布
//   印章 (310,520) 压「本人 0.00 / 其余 11079.00」；条码 (150,800) 压歌词。
//   左栏真实竖直占用：BALANCE 竖线 ~ 本人 0.00 (y≈460) / 其余 (y≈500)、歌词 (y≈700)、条码 (y≈800)。
//   解法：印章上移到 (300, 318)（BALANCE 上方）；条码下移到 y=860 并缩短 34 px 高；歌词保持。
import fs from 'fs';
const p = 'E:/新建文件夹/实习/MV/film/src/layouts.js';
let s = fs.readFileSync(p, 'utf8');

s = s.replace(`        const sx2 = 310, sy2 = 520;   // 左栏暗区，不再压 TOTAL`,
              `        const sx2 = 300, sy2 = 322;   // 左栏顶部，BALANCE 块上方`);

s = s.replace(`      const by = 800;
      let bx = 150;`,
              `      const by = 862;
      let bx = 150;`);
s = s.replace(`        if (i % 2 === 0) ctx.fillRect(bx, by, wbar, 46);`,
              `        if (i % 2 === 0) ctx.fillRect(bx, by, wbar, 34);`);
s = s.replace(`      mono('NO REFUND  ·  不予退还', 150, by + 70, { size: 15, color: dimC, letterSpacing: 3 });`,
              `      mono('NO REFUND  ·  不予退还', 150, by + 56, { size: 14, color: dimC, letterSpacing: 3 });`);

fs.writeFileSync(p, s);
console.log('receipt v7, bytes', s.length);
