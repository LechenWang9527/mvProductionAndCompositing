import fs from 'fs';
const p = 'E:/新建文件夹/实习/MV/film/src/shotfilm.js';
let s = fs.readFileSync(p, 'utf8');
const before = `    9: { k: 'blueprintHall', p: { title: '安得广厦千万间', inset: 'P06', insetLabel: 'PAPER · 帘纹' } },`;
const after = `    9: { k: 'blueprintHall', p: { title: '安得广厦千万间', inset: 'P06', insetLabel: 'PAPER · 帘纹', insetAlpha: 0.26 } },`;
if (!s.includes(before)) throw new Error('shot9 anchor not found');
s = s.replace(before, after);
fs.writeFileSync(p, s);
console.log('P06 alpha ok');
