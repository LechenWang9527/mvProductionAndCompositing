import fs from 'fs';
const p = 'E:/新建文件夹/实习/MV/film/tools/contact_targets.py';
let s = fs.readFileSync(p, 'utf8');
const rep = [
  ['("IMG01 杜甫像",      30, 6,', '("IMG01 杜甫像",      31, 6,'],
  ['("IMG03 长安坊格",    33, 7,', '("IMG03 长安坊格",    35, 7,'],
  ['("IMG02 快塌的茅屋",  37, 8,', '("IMG02 快塌的茅屋",  39, 8,'],
  ['("IMG04 广厦千万间",  41, 9,', '("IMG04 广厦千万间",  43, 9,'],
  ['("IMG11 凌晨的泡面",  63, 13,', '("IMG11 凌晨的泡面",  65, 13,'],
  ['("IMG05 刘邦像",      90, 20,', '("IMG05 刘邦像",      92, 20,'],
  ['("IMG06 酒爵长案",    95, 21,', '("IMG06 酒爵长案",    97, 21,'],
  ['("IMG07 举爵的手",   100, 22,', '("IMG07 举爵的手",   102, 22,'],
  ['("IMG08 古战场",     112, 26,', '("IMG08 古战场",     113, 26,'],
  ['("IMG09 大风与破旗", 128, 32,', '("IMG09 大风与破旗", 129, 32,'],
  ['("IMG10 卓越路夜路", 287, 83,', '("IMG10 卓越路夜路", 289, 83,'],
];
let n = 0;
for (const [a, b] of rep) { if (s.includes(a)) { s = s.replace(a, b); n++; } else console.log('MISS', a); }
fs.writeFileSync(p, s);
console.log('patched', n);
