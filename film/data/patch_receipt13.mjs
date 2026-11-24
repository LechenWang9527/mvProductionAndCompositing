import fs from 'fs';
const p = 'E:/新建文件夹/实习/MV/film/src/layouts.js';
let s = fs.readFileSync(p, 'utf8');
// 镜头第一帧只有 2 行（at = -0.30 + i*0.26，local≈0 时后 5 行还没开始）
// 改成 at = -0.55 + i*0.10、时长 0.12：第一帧就有 5 行，剩下 2 行在 0.25 s 内打完
s = s.replace(`      const at = -0.30 + i * 0.26;
      const e = clamp((c.local - at) / 0.14, 0, 1);`,
              `      const at = -0.55 + i * 0.10;
      const e = clamp((c.local - at) / 0.12, 0, 1);`);
// 「已打印 N」跟着新节奏走
s = s.replace(`const done = Math.max(0, Math.min(ITEM_COUNT, Math.floor((c.local + 0.30) / 0.26) + 1));`,
              `const done = Math.max(0, Math.min(ITEM_COUNT, Math.floor((c.local + 0.55) / 0.10) + 1));`);
// 朱印提前到 0.15 s
s = s.replace(`      const sk = clamp((c.local - 0.35) / 0.35, 0, 1);`,
              `      const sk = clamp((c.local - 0.15) / 0.30, 0, 1);`);
fs.writeFileSync(p, s);
console.log('receipt v12 ok');
