// patch_lyric_fixed2.mjs —— lyricStage 也走全片固定歌词带（不再自绘居中大字）
import fs from 'fs';

const P = 'E:/新建文件夹/实习/MV/film/src/layouts2.js';
let s = fs.readFileSync(P, 'utf8');

const OLD = `    const l = lineAt(c.t);
    if (l) {
      karaoke(l, c.t, {
        x: W / 2, y: H / 2 + 44, align: 'center', size: c.p.size || 132,
        fam: c.p.fam || 'serif', weight: 700,
        color: pal.ink, activeColor: pal.accent, accent: pal.accent, gap: 14,
      });
    }`;

const NEW = `    // 歌词位置全片固定：这里只画节拍结构，句子统一由 K.lyric 画在固定带
    const bi2 = beatInfo(c.t);
    ctx.save();
    ctx.globalAlpha = 0.10;
    for (let i = 0; i < 12; i++) {
      const h = 60 + 150 * Math.abs(Math.sin((i + 1) * 1.7 + bi2.n * 0.6));
      ctx.fillStyle = pal.accent;
      ctx.fillRect(W * 0.12 + i * (W * 0.76 / 11), H * 0.70 - h, 2, h);
    }
    ctx.restore();`;

if (!s.includes(OLD)) throw new Error('lyricStage karaoke block not found');
s = s.replace(OLD, NEW);
fs.writeFileSync(P, s, 'utf8');

// shotfilm：所有版式之后统一画一次固定歌词带
const Q = 'E:/新建文件夹/实习/MV/film/src/shotfilm.js';
let q = fs.readFileSync(Q, 'utf8');
if (q.includes('LYRIC_BAND_DONE')) {
  console.log('already wired');
} else {
  const anchor = `    window.__LIGHT = false;              // 版式铺浅底时会置位`;
  if (!q.includes(anchor)) throw new Error('draw() anchor not found');
  const add = `${anchor}
    window.__LYRIC_OWNS = false;         // 版式自己画了歌词就置 true，避免重复 */
`;
  // 先不改这里；统一带由 layout 内部调 K.lyric 时自己画，见下
  console.log('marker only');
}

// 让 K.lyric 成为固定带唯一出口：layout 内部调用时不再需要额外挂载
let core = fs.readFileSync('E:/新建文件夹/实习/MV/film/src/core.js', 'utf8');
if (!core.includes('ALL_LINES,')) throw new Error('core export ALL_LINES missing');
console.log('core already exports ALL_LINES');
