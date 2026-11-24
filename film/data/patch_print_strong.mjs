// 用户反馈「照片太真实、和动画风格不符」→ 加强印刷处理：
// 阶调从 7 档降到 5 档（丝网印/凸版的味道），网点更明显一点。
import fs from 'fs';
const p = 'E:/新建文件夹/实习/MV/film/src/photo.js';
let s = fs.readFileSync(p, 'utf8');
let n = 0;
if (s.includes('const LEVELS = 7;')) { s = s.replace('const LEVELS = 7;', 'const LEVELS = 5;'); n++; }
else if (s.includes('const LEVELS = 5;')) { n++; }
else throw new Error('LEVELS not found');
let m = 0;
const oldH = `        if (k < 0.16) continue;
        g.globalAlpha = 0.05 + k * 0.16;
        g.beginPath();
        g.arc(x, y, 2.0 * (0.45 + k), 0, Math.PI * 2);`;
if (s.includes(oldH)) {
  s = s.replace(oldH, `        if (k < 0.12) continue;
        g.globalAlpha = 0.09 + k * 0.22;
        g.beginPath();
        g.arc(x, y, 2.4 * (0.45 + k), 0, Math.PI * 2);`);
  m++;
} else if (s.includes('g.globalAlpha = 0.09 + k * 0.22;')) { m++; }
else throw new Error('halftone block not found');
fs.writeFileSync(p, s);
console.log('photo.js print-strong ok levels=' + n + ' halftone=' + m);
