// 解决「画面单调 / 大片死黑」：给稀疏的深底版式加一层「房间空间结构」底图
// —— 消失点 + 地面透视网格 + 远墙轮廓 + 天花两线 + 尺度刻度
// 全部走 pal.line 低透明度，只提供纵深参照，不抢主体
import fs from 'fs';
const p = 'E:/新建文件夹/实习/MV/film/src/layouts3.js';
let s = fs.readFileSync(p, 'utf8');

// 1) 注入 room() 依赖（放在文件顶部第一个 IIFE 内，紧跟 prog 一类辅助之后）
if (!s.includes('function roomDepth(')) {
  const anchor = s.indexOf('(function () {');
  if (anchor < 0) throw new Error('IIFE start not found');
  const insertAt = anchor + '(function () {'.length;
  const helper = `

  // ---------- 空间底图：让「一个点在黑暗里」读成「大房间里的一盏灯」 ----------
  function roomDepth(pal, o) {
    const q = o || {};
    const vpx = q.vx == null ? W * 0.5 : q.vx;
    const vpy = q.vy == null ? H * 0.52 : q.vy;
    const a = q.alpha == null ? 0.55 : q.alpha;
    const col = q.color || pal.line;
    ctx.save();
    ctx.strokeStyle = col;
    ctx.lineWidth = 1;

    // 地平线
    ctx.globalAlpha = a;
    ctx.beginPath(); ctx.moveTo(0, vpy); ctx.lineTo(W, vpy); ctx.stroke();

    // 地面放射线（到画幅底边）
    ctx.globalAlpha = a * 0.7;
    for (let i = -8; i <= 8; i++) {
      ctx.beginPath();
      ctx.moveTo(vpx, vpy);
      ctx.lineTo(vpx + i * (W * 0.16), H);
      ctx.stroke();
    }
    // 地面横线（近密远疏）
    ctx.globalAlpha = a * 0.6;
    for (let i = 1; i <= 7; i++) {
      const kk = Math.pow(i / 7, 1.8);
      const y = vpy + (H - vpy) * kk;
      ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(W, y); ctx.stroke();
    }
    // 天花两线
    ctx.globalAlpha = a * 0.42;
    [0.16, 0.30].forEach((f) => {
      ctx.beginPath(); ctx.moveTo(0, vpy * f); ctx.lineTo(W, vpy * f); ctx.stroke();
    });
    // 竖直墙角线（左/右各两根，营造进深）
    ctx.globalAlpha = a * 0.5;
    [0.14, 0.30, 0.70, 0.86].forEach((f) => {
      ctx.beginPath(); ctx.moveTo(W * f, 0); ctx.lineTo(W * f, H); ctx.stroke();
    });

    // 尺度刻度：左边缘每 60 px 一格
    ctx.globalAlpha = a * 0.55;
    for (let y = Math.round(vpy / 60) * 60; y < H; y += 60) {
      ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(16, y); ctx.stroke();
    }
    ctx.restore();
  }
`;
  s = s.slice(0, insertAt) + helper + s.slice(insertAt);
}

// 2) 在稀疏版式的底色填充之后插入 roomDepth（只针对这些版式）
const SPARSE = [
  'singleLamp', 'descentDot', 'slowLine', 'chessLine', 'lampTrack',
  'dotField128', 'lampGrid9', 'badgeGrid12', 'badgeGridHalo',
  'badgeGrid12b', 'badgeGridHalo2', 'bracketTangle',
];
let wired = 0;
for (const name of SPARSE) {
  const fi = s.indexOf(`LAYOUTS.${name} = function (c) {`);
  if (fi < 0) { console.log('MISS layout', name); continue; }
  if (s.slice(fi, fi + 900).includes('roomDepth(')) continue;   // 已插过
  const body = s.slice(fi);
  const m = body.match(/ctx\.fillRect\(0, 0, W, H\);|darkBase\(c\.pal[^)]*\);/);
  if (!m) { console.log('MISS bg', name); continue; }
  const at = fi + m.index + m[0].length;
  s = s.slice(0, at) + '\n    roomDepth(c.pal);' + s.slice(at);
  wired++;
}
fs.writeFileSync(p, s);
console.log('roomDepth wired into', wired, 'layouts; bytes', s.length);
