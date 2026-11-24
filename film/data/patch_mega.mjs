// 解决「构图单调」：所有稀疏版式现在都是「黑底 + 画面正中一个小物件 + 下方一句歌词」，
// 每帧构图完全相同。加一层背景大字（描边巨型字，极低透明度），让画面有前后层次与方向。
// 文字取本镜段号 / 镜号，永远不和前景抢。
import fs from 'fs';
const p = 'E:/新建文件夹/实习/MV/film/src/layouts3.js';
let s = fs.readFileSync(p, 'utf8');

if (!s.includes('function bgMega(')) {
  const anchor = '  function roomDepth(pal, o) {';
  const idx = s.indexOf(anchor);
  if (idx < 0) throw new Error('roomDepth not found');
  const helper = `  // ---------- 背景大字：巨型描边字，极低 alpha，提供前后层次 ----------
  function bgMega(c, o) {
    const q = o || {};
    const pal = c.pal;
    const str = q.text || String(c.shot.n).padStart(2, '0');
    const size = q.size || 620;
    const x = q.x == null ? W * 0.5 : q.x;
    const y = q.y == null ? H * 0.62 : q.y;
    ctx.save();
    ctx.globalAlpha = q.alpha == null ? 0.055 : q.alpha;
    ctx.strokeStyle = pal.ink;
    ctx.lineWidth = q.lw || 3;
    ctx.font = \`700 \${size}px "Cascadia Mono", monospace\`;
    ctx.textAlign = q.align || 'center';
    ctx.textBaseline = 'middle';
    if (q.letterSpacing) ctx.letterSpacing = q.letterSpacing + 'px';
    ctx.strokeText(str, x, y);
    ctx.restore();
  }

`;
  s = s.slice(0, idx) + helper + s.slice(idx);
}

// 把 bgMega 接到已经接过 roomDepth 的稀疏版式后面（同样的注入点，紧跟 roomDepth）
let n = 0;
s = s.replace(/roomDepth\(c\.pal\);(?!\n    bgMega)/g, (m) => { n++; return m; });
// 真正的插入：在 roomDepth(c.pal); 之后追加 bgMega
const before = /roomDepth\(c\.pal\);/;
let count = 0;
s = s.replace(/roomDepth\(c\.pal\);/g, () => { count++; return 'roomDepth(c.pal); bgMega(c);'; });
fs.writeFileSync(p, s);
console.log('bgMega wired at', count, 'sites; bytes', s.length);
