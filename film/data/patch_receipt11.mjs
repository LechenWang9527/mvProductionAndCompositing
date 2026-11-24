import fs from 'fs';
const p = 'E:/新建文件夹/实习/MV/film/src/layouts.js';
let s = fs.readFileSync(p, 'utf8');
// 金线 384..594 压到歌词首行 760 —— 缩短到 384..524，其余行相应上移
s = s.replace(`      ctx.fillRect(150, 384, 2, 210);`, `      ctx.fillRect(150, 384, 2, 140);`);
s = s.replace(`      text('其余 11079.00', 176, 578,`, `      text('其余 11079.00', 176, 542,`);
// 歌词行距 56→50，且多行时整体下移有下限（避免三行顶到金线）
s = s.replace(`      const startY = 760 - (rows.length - 1) * 56;`,
              `      const startY = Math.max(660, 760 - (rows.length - 1) * 50);`);
s = s.replace(`          text(ch, x, startY + i * 56, {`, `          text(ch, x, startY + i * 50, {`);
fs.writeFileSync(p, s);
console.log('receipt v10 ok');
