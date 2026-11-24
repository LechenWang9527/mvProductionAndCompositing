import fs from 'fs';
const p = 'E:/新建文件夹/实习/MV/film/src/layouts3.js';
let s = fs.readFileSync(p, 'utf8');
// pal.line (#26262a) 在 #050506 底色上不可见 → 改用 pal.dim (#7d7a72)，并把整体 alpha 提一档
s = s.replace(`    const a = q.alpha == null ? 0.55 : q.alpha;
    const col = q.color || pal.line;`,
              `    const a = q.alpha == null ? 0.42 : q.alpha;
    const col = q.color || pal.dim;`);
// 各分项 alpha 提高（原来乘 0.35~0.7 太淡）
s = s.replace(`      ctx.globalAlpha = a * 0.35 * f;`, `      ctx.globalAlpha = a * 0.55 * f;`);
s = s.replace(`      ctx.globalAlpha = a * 0.5 * f;`, `      ctx.globalAlpha = a * 0.85 * f;`);
s = s.replace(`    ctx.globalAlpha = a * 0.45;
    [-1, 1].forEach((sgn) => {`, `    ctx.globalAlpha = a * 0.75;
    [-1, 1].forEach((sgn) => {`);
s = s.replace(`    ctx.globalAlpha = a * 0.7;
    for (let i = -8; i <= 8; i++) {`, `    ctx.globalAlpha = a * 0.9;
    for (let i = -8; i <= 8; i++) {`);
s = s.replace(`    ctx.globalAlpha = a * 0.6;
    for (let i = 1; i <= 7; i++) {`, `    ctx.globalAlpha = a * 0.8;
    for (let i = 1; i <= 7; i++) {`);
s = s.replace(`    ctx.globalAlpha = a * 0.42;
    [0.16, 0.30].forEach((f) => {`, `    ctx.globalAlpha = a * 0.62;
    [0.16, 0.30].forEach((f) => {`);
s = s.replace(`    ctx.globalAlpha = a * 0.5;
    [0.14, 0.30, 0.70, 0.86].forEach((f) => {`, `    ctx.globalAlpha = a * 0.7;
    [0.14, 0.30, 0.70, 0.86].forEach((f) => {`);
fs.writeFileSync(p, s);
console.log('roomDepth contrast raised');
