// blueprintHall 布局收尾：右上平面小样与 P03 照片窗完全重叠（都在 x≈1450..1800, y≈170..344），
// 左下比例尺 / 尺寸文字 / 图框边挤成一团。把平面小样移到右下留白处，比例尺左移下移。
import fs from 'fs';
const p = 'E:/新建文件夹/实习/MV/film/src/layouts.js';
let s = fs.readFileSync(p, 'utf8');

// 1) 平面小样：移到左下、图框内侧（原 W-470 / FY+40，与右上插图窗撞）
const planBefore = `    const plx = W - 470, ply = FY + 40, plw = 300, plh = 150;`;
const planAfter = `    const plx = FX + 40, ply = FY + FH - 300, plw = 260, plh = 128;`;
if (!s.includes(planBefore)) throw new Error('plan anchor not found');
s = s.replace(planBefore, planAfter);

// 2) 比例尺：原来是 (200, FY+FH-60)，与「6 间·1140 尺总长」和尺寸链挤在一起 → 移到平面小样下方右侧
const scaleBefore = `    let sx = 200, sy = FY + FH - 60;`;
const scaleAfter = `    let sx = plx + 300, sy = FY + FH - 250;`;
if (!s.includes(scaleBefore)) throw new Error('scale anchor not found');
s = s.replace(scaleBefore, scaleAfter);

// 3) 尺寸文字：原来 y0+62 压在地坪剖面线上 → 抬高到 y0+50 并右移，避开比例尺
const dimTextBefore = `    text(\`\${cols} 间 · 1140 尺 总长\`, x0 - 25, y0 + 62, { size: 17, fam: 'mono', color: dim, letterSpacing: 2 });`;
const dimTextAfter = `    text(\`\${cols} 间 · 1140 尺 总长\`, x0 + cols * span + 60, y0 + 62, { size: 17, fam: 'mono', color: dim, letterSpacing: 2 });`;
if (!s.includes(dimTextBefore)) throw new Error('dim text anchor not found');
s = s.replace(dimTextBefore, dimTextAfter);

fs.writeFileSync(p, s);
console.log('blueprint layout fixed, bytes', s.length);
