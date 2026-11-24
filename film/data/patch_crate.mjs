// patch_crate.mjs —— 修 woodcutCrate 白线压浅纸底：描边色改深墨、加排线填充
import fs from 'fs';
const p = 'E:/新建文件夹/实习/MV/film/src/layouts.js';
let s = fs.readFileSync(p, 'utf8');
let hit = 0;
const reps = [
  // 纸箱轮廓：近白线 → 深墨线
  [`strokeStyle='#f2ead6'`, `strokeStyle='#17130f'`],
];
for (const [a, b] of reps) {
  let i = s.indexOf(a);
  while (i !== -1) {
    // 只替换 woodcutCrate 函数体（LAYOUTS.woodcutCrate 到下一个 LAYOUTS.）
    const fnStart = s.lastIndexOf('LAYOUTS.woodcutCrate', i);
    const nextFn = s.indexOf('LAYOUTS.', i);
    if (fnStart !== -1 && nextFn > i) {
      s = s.slice(0, i) + b + s.slice(i + a.length);
      hit++;
      i = s.indexOf(a, i + b.length);
      // 限定在函数内
      if (s.indexOf('LAYOUTS.', i) !== s.indexOf('LAYOUTS.', fnStart) + 1 && s.lastIndexOf('LAYOUTS.woodcutCrate', i) !== fnStart) break;
    } else break;
  }
}
console.log('replaced', hit);
fs.writeFileSync(p, s, 'utf8');
