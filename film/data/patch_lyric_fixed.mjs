// patch_lyric_fixed.mjs —— 歌词位置全片固定 + 常显下一句提示
import fs from 'fs';

const P = 'E:/新建文件夹/实习/MV/film/src/layouts.js';
let s = fs.readFileSync(P, 'utf8');

const OLD = `  // 逐字歌词（居中 / 左起 / 指定宽度内自动换行）
  function lyric(line, t, pal, o) {
    o = o || {};
    if (!line) return;
    const size = o.size || 84;
    // 底部 HUD 占 H-98 以下：歌词基线不许低于 H-168，否则会压到日志行
    const yy = Math.min(o.y || 820, H - 168);
    const k = ease.out(inv(line.start - 0.28, line.start + 0.12, t));
    ctx.save();
    ctx.globalAlpha = (o.alpha == null ? 1 : o.alpha) * k;
    karaoke(line, t, {
      x: o.x == null ? W / 2 : o.x, y: yy + (1 - k) * 22,
      align: o.align || 'center', size,
      fam: o.fam || 'serif', weight: o.weight || 700,
      color: o.color || pal.ink, activeColor: o.active || pal.hot,
      accent: o.accent || pal.accent, gap: o.gap == null ? 8 : o.gap,
      unsung: o.unsung, underline: o.underline, underlineAlpha: o.underlineAlpha,
    });
    ctx.restore();
  }`;

const NEW = `  // 逐字歌词：全片位置与字号固定（来自用户要求：歌词不许随版式乱跑，并常显下一句提示）
  // 逃生口 o.free === true：保留调用方给的 x/y/size（票据内栏、竖排等特殊版式用）
  const LY_SONG = H - 222;      // 当前句基线（固定）
  const LY_NEXT = H - 168;      // 下一句提示基线（固定，压在数据带上方）
  function nextLineOf(line) {
    const A = K.ALL_LINES || [];
    const i = A.indexOf(line);
    return i >= 0 && i + 1 < A.length ? A[i + 1] : null;
  }
  function lyric(line, t, pal, o) {
    o = o || {};
    if (!line) return;
    const free = o.free === true;
    const size = free ? (o.size || 60) : 60;
    const yy = free ? Math.min(o.y || 820, H - 168) : LY_SONG;
    const xx = free ? (o.x == null ? W / 2 : o.x) : W / 2;
    const al = free ? (o.align || 'center') : 'center';
    const k = ease.out(inv(line.start - 0.28, line.start + 0.12, t));

    // 下一句提示：小一号、压暗，唱到当前句时同时给出
    if (!free) {
      const nx = nextLineOf(line);
      if (nx && nx.text) {
        const nk = ease.out(inv(line.start - 0.3, line.start + 0.25, t));
        ctx.save();
        ctx.globalAlpha = 0.42 * nk;
        text(nx.text, W / 2, LY_NEXT, {
          size: 30, fam: 'serif', weight: 400, align: 'center',
          color: o.hintColor || pal.dim, letterSpacing: 2,
        });
        // 提示行左侧一道短线，读作「下一句」
        ctx.globalAlpha = 0.22 * nk;
        ctx.fillStyle = pal.accent;
        ctx.fillRect(W / 2 - 2, LY_NEXT + 14, 4, 4);
        ctx.restore();
      }
    }

    ctx.save();
    ctx.globalAlpha = (o.alpha == null ? 1 : o.alpha) * k;
    karaoke(line, t, {
      x: xx, y: yy + (1 - k) * 22,
      align: al, size,
      fam: o.fam || 'serif', weight: o.weight || 700,
      color: o.color || pal.ink, activeColor: o.active || pal.hot,
      accent: o.accent || pal.accent, gap: o.gap == null ? 8 : o.gap,
      unsung: o.unsung, underline: o.underline, underlineAlpha: o.underlineAlpha,
    });
    ctx.restore();
  }`;

if (!s.includes(OLD)) throw new Error('lyric() not found verbatim');
s = s.replace(OLD, NEW);

// 特殊版式保原位：票据左栏 / 竖排 / 结尾大字
const FREES = [
  ['lyric(l, c.t, c.pal, { y: H - 200, size: 62 });', 'lyric(l, c.t, c.pal, { free: true, y: H - 200, size: 62 });'],
  ["lyric(l, c.t, { ink: '#ffcc00', hot: '#ffffff', accent: '#ffcc00', dim: '#8b8577' }, { y: H * 0.80, size: 58, active: '#fff' });",
   "lyric(l, c.t, { ink: '#ffcc00', hot: '#ffffff', accent: '#ffcc00', dim: '#8b8577' }, { free: true, y: H * 0.80, size: 58, active: '#fff' });"],
];
let freeHit = 0;
for (const [a, b] of FREES) if (s.includes(a)) { s = s.replace(a, b); freeHit++; }

fs.writeFileSync(P, s, 'utf8');
console.log('lyric() fixed band applied; free-mode exemptions:', freeHit);
