// 1) 把 layouts.js / layouts2.js 里仍在 M+8（=72px，撞顶部 HUD 行）的角标统一挪到 y=148
// 2) #9 挂 P06 纸纹插图窗
import fs from 'fs';
const root = 'E:/新建文件夹/实习/MV/';

function sub(path, pairs) {
  let s = fs.readFileSync(path, 'utf8');
  let n = 0;
  for (const [a, b] of pairs) {
    if (!s.includes(a)) { console.log('MISS in', path, ':', a.slice(0, 48)); continue; }
    s = s.replace(a, b); n++;
  }
  fs.writeFileSync(path, s);
  console.log(path.split('/').pop(), 'replaced', n);
}

sub(root + 'film/src/layouts.js', [
  [`    text(\`SHOT \${String(c.shot.n).padStart(2, '0')} / 87\`, W - M, M + 6,`,
   `    text(\`SHOT \${String(c.shot.n).padStart(2, '0')} / 87\`, W - M, 148,`],
  [`    text('ARCHIVE / KERNEL 1000Y', M, M + 8, { size: 20, fam: 'mono', color: c.pal.dim, letterSpacing: 4 });`,
   `    text('ARCHIVE / KERNEL 1000Y', M, 148, { size: 20, fam: 'mono', color: c.pal.dim, letterSpacing: 4 });`],
]);

sub(root + 'film/src/layouts2.js', [
  [`    text(c.p.tag || 'LYRIC', M, M + 8, { size: 19, fam: 'mono', color: pal.dim, letterSpacing: 5 });`,
   `    text(c.p.tag || 'LYRIC', M, 148, { size: 19, fam: 'mono', color: pal.dim, letterSpacing: 5 });`],
  [`    text(\`\${String(bi.n + 1).padStart(2, '0')}\`, W - M, M + 8, { size: 19, fam: 'mono', color: pal.dim, align: 'right', letterSpacing: 4 });`,
   `    text(\`\${String(bi.n + 1).padStart(2, '0')}\`, W - M, 148, { size: 19, fam: 'mono', color: pal.dim, align: 'right', letterSpacing: 4 });`],
  [`    text(c.p.title || 'E3 · CHAR ART', M, M + 8, { size: 19, fam: 'mono', color: pal.dim, letterSpacing: 5 });`,
   `    text(c.p.title || 'E3 · CHAR ART', M, 148, { size: 19, fam: 'mono', color: pal.dim, letterSpacing: 5 });`],
]);

sub(root + 'film/src/shotfilm.js', [
  [`    9: { k: 'blueprintHall', p: { title: '安得广厦千万间' } },`,
   `    9: { k: 'blueprintHall', p: { title: '安得广厦千万间', inset: 'P06', insetLabel: 'PAPER · 帘纹' } },`],
]);
