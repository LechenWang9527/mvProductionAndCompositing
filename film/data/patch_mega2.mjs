import fs from 'fs';
const p = 'E:/新建文件夹/实习/MV/film/src/layouts3.js';
let s = fs.readFileSync(p, 'utf8');
// 巨型数字太抢眼、且横跨画面中央压住歌词 —— 收到右上角、缩到 420、再淡一半
s = s.replace(`    const size = q.size || 620;
    const x = q.x == null ? W * 0.5 : q.x;
    const y = q.y == null ? H * 0.62 : q.y;`,
              `    const size = q.size || 420;
    const x = q.x == null ? W * 0.86 : q.x;
    const y = q.y == null ? H * 0.26 : q.y;`);
s = s.replace(`    ctx.globalAlpha = q.alpha == null ? 0.055 : q.alpha;`,
              `    ctx.globalAlpha = q.alpha == null ? 0.032 : q.alpha;`);
fs.writeFileSync(p, s);
console.log('mega tuned');
