// blueprintHall v4：解决标题压轴号圈 / 引线穿标题 / 水印压平面小样
// 做法：整体下移图面（y0 640→680, hgt 300→290），把标题放进 170..320 的空白带；
//       引注全部重算锚点；水印下移并调淡。
import fs from 'fs';
const p = 'E:/新建文件夹/实习/MV/film/src/layouts.js';
let s = fs.readFileSync(p, 'utf8');
const reps = [
  // 图面几何
  [`    const cols = 6, span = 155, x0 = 250, y0 = 640, hgt = 300;`,
   `    const cols = 6, span = 155, x0 = 250, y0 = 680, hgt = 290;`],
  // 尺寸链下移，避免与新 y0 挤在一起
  [`    const dChains = [
      { y: y0 + 58, from: x0 - 24, to: xR + 24 },
      { y: y0 + 88, from: x0, to: x0 + span },
      { y: y0 + 112, from: x0 - 8, to: x0 + 8 },
    ];`,
   `    const dChains = [
      { y: y0 + 62, from: x0 - 24, to: xR + 24 },
      { y: y0 + 92, from: x0, to: x0 + span },
      { y: y0 + 116, from: x0 - 8, to: x0 + 8 },
    ];`],
  // 总长文字：放到尺寸链上方
  [`    text(\`\${cols} 间 · \${span} 尺/间 · 总长 \${cols * span} 尺\`, x0 - 24, y0 + 50,`,
   `    text(\`\${cols} 间 · \${span} 尺/间 · 总长 \${cols * span} 尺\`, x0 - 24, y0 + 44,`],
  // 引注：锚点随新几何；木构引线从屋脊右侧起，不再横穿标题
  [`    const notes = [
      { ax: x0 + span * 3, ay: peak + 22, tx: x0 + span * 3 + 118, ty: peak - 44, s: '木构 榫卯' },
      { ax: x0 + span * 1.6, ay: y0 - 168, tx: x0 + span * 1.6 + 118, ty: y0 - 236, s: '杉木 立柱' },
      { ax: x0 + span * 4.3, ay: y0 + 18, tx: x0 + span * 4.3 + 104, ty: y0 + 44, s: '夯土 地坪' },
    ];`,
   `    const notes = [
      { ax: x0 + span * 4.6, ay: peak + 30, tx: x0 + span * 4.6 + 96, ty: peak + 74, s: '木构 榫卯' },
      { ax: x0 + span * 1.2, ay: y0 - 150, tx: x0 + span * 1.2 - 128, ty: y0 - 206, s: '杉木 立柱', left: true },
      { ax: x0 + span * 4.9, ay: y0 + 22, tx: x0 + span * 4.9 + 88, ty: y0 + 62, s: '夯土 地坪' },
    ];`],
  // 引注绘制：支持向左引
  [`    notes.forEach((n) => {
      ctx.beginPath();
      ctx.moveTo(n.ax, n.ay);
      ctx.lineTo(n.tx - 12, n.ty + 4);
      ctx.lineTo(n.tx, n.ty + 4);
      ctx.stroke();
      text(n.s, n.tx + 6, n.ty + 9, { size: 14, fam: 'mono', color: dim, letterSpacing: 2 });
    });`,
   `    notes.forEach((n) => {
      const dir = n.left ? 1 : -1;
      ctx.beginPath();
      ctx.moveTo(n.ax, n.ay);
      ctx.lineTo(n.tx + dir * 12, n.ty + 4);
      ctx.lineTo(n.tx, n.ty + 4);
      ctx.stroke();
      text(n.s, n.tx + (n.left ? -6 : 6), n.ty + 9,
        { size: 14, fam: 'mono', color: dim, letterSpacing: 2, align: n.left ? 'right' : 'left' });
    });`],
  // 标题：放进屋脊上方的空白带（y=252），不与轴号圈（152）和屋脊（peak=320）相撞
  [`      text(c.p.title || '安得广厦千万间', (x0 + xR) / 2, 200, {
        size: onPaper ? 58 : 56, fam: 'serif', color: ink2, align: 'center',
      });`,
   `      text(c.p.title || '安得广厦千万间', (x0 + xR) / 2, 252, {
        size: onPaper ? 58 : 56, fam: 'serif', color: ink2, align: 'center',
      });`],
  [`      ctx.beginPath();
      ctx.moveTo((x0 + xR) / 2 - 190, 218);
      ctx.lineTo((x0 + xR) / 2 + 190, 218);
      ctx.stroke();`,
   `      ctx.beginPath();
      ctx.moveTo((x0 + xR) / 2 - 190, 270);
      ctx.lineTo((x0 + xR) / 2 + 190, 270);
      ctx.stroke();`],
  // 水印：下移出平面小样区域，再淡一档
  [`    ctx.globalAlpha = onPaper ? 0.07 : 0.05;
    text('1000Y', W - 250, 560, { size: 280, fam: 'mono', color: ink2, align: 'center', letterSpacing: 6 });`,
   `    ctx.globalAlpha = onPaper ? 0.045 : 0.035;
    text('1000Y', W - 300, 640, { size: 240, fam: 'mono', color: ink2, align: 'center', letterSpacing: 6 });`],
];
let n = 0;
for (const [a, b] of reps) {
  if (!s.includes(a)) { console.log('MISS:', a.slice(0, 60).replace(/\n/g, ' | ')); continue; }
  s = s.replace(a, b); n++;
}
fs.writeFileSync(p, s);
console.log('blueprint v4:', n, '/', reps.length, 'bytes', s.length);
