import fs from 'fs';
const p = 'E:/新建文件夹/实习/MV/docs/CHATGPT_IMAGE_KIT.md';
let s = fs.readFileSync(p, 'utf8');
const rep = [
  ['`t0043.jpg` 和 `t0043.jpg`', '`t0041.jpg` 和 `t0045.jpg`'],
  ['`t0113.jpg` 和 `t0113.jpg`', '`t0112.jpg` 和 `t0114.jpg`'],
  ['`t0129.jpg` 和 `t0129.jpg`', '`t0128.jpg` 和 `t0130.jpg`'],
  ['`t0289.jpg` 和 `t0289.jpg`', '`t0288.jpg` 和 `t0291.jpg`'],
  ['`t0065.jpg` 和 `t0065.jpg`', '`t0064.jpg` 和 `t0067.jpg`'],
  ['（`t0031.jpg` = 第 30 秒）', '（`t0031.jpg` = 第 31 秒）'],
];
let n = 0;
for (const [a, b] of rep) { if (s.includes(a)) { s = s.replace(a, b); n++; } else console.log('MISS', a); }
fs.writeFileSync(p, s);
console.log('fixed', n);
