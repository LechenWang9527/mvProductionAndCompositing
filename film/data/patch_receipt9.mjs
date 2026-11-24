import fs from 'fs';
const p = 'E:/新建文件夹/实习/MV/film/src/layouts.js';
let s = fs.readFileSync(p, 'utf8');
// 印章再上移，让出 BALANCE / 本人 0.00 那两块（左栏 370..510 归 BALANCE）
const b = `        const sx2 = 300, sy2 = 322;   // 左栏顶部，BALANCE 块上方`;
const a = `        const sx2 = 296, sy2 = 262;   // 左栏顶部，BALANCE 块上方`;
if (!s.includes(b)) throw new Error('stamp anchor not found');
s = s.replace(b, a);
fs.writeFileSync(p, s);
console.log('receipt v8 ok');
