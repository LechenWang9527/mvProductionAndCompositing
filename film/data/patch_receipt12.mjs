import fs from 'fs';
const p = 'E:/新建文件夹/实习/MV/film/src/layouts.js';
let s = fs.readFileSync(p, 'utf8');
// 上一步把「其余」提到 542，正好压在「本人 0.00」(534) 的下沿 → 放回 586，与歌词首行 760 之间还有 170 余量
s = s.replace(`      text('其余 11079.00', 176, 542,`, `      text('其余 11079.00', 176, 588,`);
fs.writeFileSync(p, s);
console.log('receipt v11 ok');
