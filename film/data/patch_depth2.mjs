// 修正：layouts3.js 里的版式注册名是 L.xxx，不是 LAYOUTS.xxx
import fs from 'fs';
const p = 'E:/新建文件夹/实习/MV/film/src/layouts3.js';
let s = fs.readFileSync(p, 'utf8');

const SPARSE = [
  'singleLamp', 'descentDot', 'slowLine', 'chessLine', 'lampTrack',
  'dotField128', 'lampGrid9', 'badgeGrid12', 'badgeGridHalo',
  'badgeGrid12b', 'badgeGridHalo2', 'bracketTangle',
];
let wired = 0;
for (const name of SPARSE) {
  const fi = s.indexOf(`L.${name} = function (c) {`);
  if (fi < 0) { console.log('MISS layout', name); continue; }
  const head = s.slice(fi, fi + 1200);
  if (head.includes('roomDepth(')) { console.log('already', name); continue; }
  // 找该函数体内的第一个背景填充
  const m = head.match(/ctx\.fillRect\(0, 0, W, H\);|darkBase\([^)]*\);|ctx\.fillRect\(0, 0, W, H, [^)]*\);/);
  if (!m) { console.log('MISS bg', name); continue; }
  const at = fi + m.index + m[0].length;
  s = s.slice(0, at) + ' roomDepth(c.pal);' + s.slice(at);
  wired++;
}
fs.writeFileSync(p, s);
console.log('roomDepth wired into', wired, 'layouts; bytes', s.length);
