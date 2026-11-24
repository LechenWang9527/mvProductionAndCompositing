// swissBlocks 第三次重写：按分镜 #35 / #51 / #78 / #83 的真实动作实现
//   #35 五字 0.232 s 落下 → 1.36 s 背景炭黑→8% 黄 → 右侧黄竖线 0→全高
//   #51 黄底 0.6 s 自下而上填满 → 每字 0.232 s 压印（下压 2 px 回弹）反白
//   #78 六字按逐字时间显影 → 1.75 s 背景 8%→100%（1.2 s）字反白 → 末整块上移 6 px
//   #83 五字同时压印 → 1.25 s 地平线自中间向两侧延展，线上浮出 12 个 1 px 竖标
// 用法：node film/data/patch_swiss3.mjs
import fs from 'fs';
const root = 'E:/新建文件夹/实习/MV/';
const p = root + 'film/src/layouts.js';
let s = fs.readFileSync(p, 'utf8');

const HEAD = '  // L33 瑞士排版：大字拆块拼合（文案由镜头 p.text 给，不再写死；可挂照片底 / 黄底 / 地平线 / 角标）';
const A = s.indexOf(HEAD);
if (A < 0) throw new Error('head not found');
const B = s.indexOf('\n  };\n', A);
if (B < 0) throw new Error('end not found');
console.log('replacing', B + 5 - A, 'bytes');

const NEW = `  // L33 瑞士排版（按分镜逐镜还原动作）：
  //   p.chars   : 'fall'(逐字落下) | 'stamp'(压印) | 'sync'(齐压) | 'type'(逐字显影)
  //   p.stagger : 每字间隔秒（默认 0.232）
  //   p.bg      : 'dark' | 'yellowUp'(自下而上填黄) | 'yellowRamp'(整幅渐入黄) | 照片(P.photo)
  //   p.rampAt / p.rampDur : 背景换色起点/时长
  //   p.ink     : 'auto' | 'accent' | 'bg' | 'ink'
  //   p.vline   : 右侧黄竖线 0→全高
  //   p.horizon : 地平线自中间向两侧 + 12 竖标
  //   p.rise    : 末段整块上移 px
  //   p.photo / p.photoAlpha / p.photoScrim / p.logo / p.sub / p.size / p.en
  LAYOUTS.swissBlocks = function (c) {
    const P = c.p || {};
    const pal = c.pal;
    const str = P.text || '我是过来人';
    const fam = P.en ? 'mono' : 'sans';
    const stagger = P.stagger == null ? 0.232 : P.stagger;

    // ---- 底色：照片 > 黄（两种入法） > 炭黑 ----
    let bgIsYellow = false, yellowK = 0;
    if (P.bg === 'yellowUp') {
      yellowK = ease.out(clamp(c.local / 0.6, 0, 1));
      ctx.fillStyle = pal.bg;
      ctx.fillRect(0, 0, W, H);
      ctx.save();
      ctx.fillStyle = pal.accent;
      ctx.fillRect(0, H * (1 - yellowK), W, H * yellowK);   // 自下而上填满
      ctx.restore();
      bgIsYellow = true;
    } else if (P.bg === 'yellowRamp') {
      const rampAt = P.rampAt == null ? 1.75 : P.rampAt;
      const rampDur = P.rampDur == null ? 1.2 : P.rampDur;
      const kOn = ease.io(clamp((c.local - rampAt) / rampDur, 0, 1));
      const kPast = ease.io(clamp((c.local - rampAt + rampDur) / rampDur, 0, 1));
      ctx.fillStyle = pal.bg;
      ctx.fillRect(0, 0, W, H);
      ctx.save();
      ctx.globalAlpha = 0.08 + 0.92 * kOn;
      ctx.fillStyle = pal.accent;
      ctx.fillRect(0, 0, W, H);
      ctx.restore();
      yellowK = kPast;
      bgIsYellow = true;
    } else if (P.photo && window.PHOTO && window.PHOTO.has(P.photo)) {
      window.PHOTO.bg(P.photo, 'dark', {
        alpha: P.photoAlpha == null ? 0.9 : P.photoAlpha,
        scrim: P.photoScrim == null ? 0.4 : P.photoScrim,
        scrimColor: '#0b0b0c',
      });
    } else {
      ctx.fillStyle = pal.bg;
      ctx.fillRect(0, 0, W, H);
      grid(pal, { grid: 120, alpha: 0.05 });
    }

    // ---- 字色：黄底上取底色（黑/炭），其余取马牌黄或本色 ----
    let inkCol;
    if (P.ink === 'bg') inkCol = pal.bg;
    else if (P.ink === 'accent') inkCol = pal.accent;
    else if (P.ink === 'ink') inkCol = pal.ink;
    else inkCol = bgIsYellow ? pal.bg : pal.accent;

    // ---- 排版：先量宽度，超出版心就缩字号 ----
    let size = P.size || 210;
    const maxW = W - 320;
    setFont(size, fam, 900);
    let cw = [], total = 0;
    for (const ch of str) { const w = ctx.measureText(ch).width; cw.push(w); total += w; }
    const gap = size * 0.04;
    total += gap * Math.max(0, str.length - 1);
    if (total > maxW) {
      size = Math.max(64, Math.floor(size * maxW / total));
      setFont(size, fam, 900);
      cw = [];
      total = 0;
      for (let i = 0; i < str.length; i++) { cw[i] = ctx.measureText(str[i]).width; total += cw[i]; }
      total += gap * Math.max(0, str.length - 1);
    }

    // 末段整块上移
    const rise = P.rise ? -P.rise * ease.out(clamp((c.local - (c.dur - 0.9)) / 0.5, 0, 1)) : 0;

    let x0 = W / 2 - total / 2;
    const yBase = H / 2 + size * 0.34 + rise;
    const corners = [[-1, -1], [1, -1], [-1, 1], [1, 1], [-1, -0.3], [1, 0.3]];

    for (let i = 0; i < str.length; i++) {
      let dx = 0, dy = 0, sc = 1, a = 1;
      if (P.chars === 'sync') {
        a = ease.out(clamp(c.local / 0.28, 0, 1));
        sc = lerp(1.14, 1, a);
        dy = (1 - a) * 6;
      } else if (P.chars === 'stamp') {
        a = ease.out(clamp((c.local - i * stagger) / 0.16, 0, 1));
        dy = (1 - a) * 2;                                    // 下压 2 px 回弹
      } else if (P.chars === 'type') {
        a = ease.out(clamp((c.local - i * stagger) / 0.2, 0, 1));
      } else {
        // fall：从四角飞入
        a = ease.expo(clamp((c.local - i * (P.stagger == null ? 0.16 : P.stagger)) / 0.9, 0, 1));
        const cn = corners[i % corners.length];
        dx = (1 - a) * cn[0] * 620;
        dy = (1 - a) * cn[1] * 420;
      }
      if (a <= 0.001) { x0 += cw[i] + gap; continue; }
      ctx.save();
      ctx.globalAlpha = a;
      if (sc !== 1) {
        const cx = x0 + cw[i] / 2, cy = yBase - size * 0.34;
        ctx.translate(cx, cy); ctx.scale(sc, sc); ctx.translate(-cx, -cy);
      }
      setFont(size, fam, 900);
      ctx.fillStyle = inkCol;
      ctx.fillText(str[i], x0 + dx, yBase + dy);
      ctx.restore();
      x0 += cw[i] + gap;
    }

    // 右侧黄竖线（#35）
    if (P.vline) {
      const vk = ease.out(clamp((c.local - 1.36) / 0.7, 0, 1));
      ctx.save();
      ctx.globalAlpha = 0.95;
      ctx.fillStyle = pal.accent;
      ctx.fillRect(W - 120, H * 0.18, 6, H * 0.64 * vk);
      ctx.restore();
    }

    // 地平线（#83）
    if (P.horizon) {
      const hk = ease.out(clamp((c.local - 1.25) / 0.6, 0, 1));
      const hy = H * 0.62;
      ctx.save();
      ctx.globalAlpha = 0.8;
      ctx.fillStyle = bgIsYellow ? pal.bg : pal.accent;
      ctx.fillRect(W / 2 - (W / 2) * hk, hy, W * hk, 2);
      for (let i = 0; i < 12; i++) {
        const x = W / 2 + (i - 5.5) * (W / 13);
        ctx.globalAlpha = 0.55 * hk * (1 - Math.abs(i - 5.5) / 7);
        ctx.fillRect(x, hy - 9, 1, 18);
      }
      ctx.restore();
    }

    // 副题
    if (P.sub) {
      const sk = ease.out(clamp((c.local - 1.15) / 0.7, 0, 1));
      ctx.save();
      ctx.globalAlpha = 0.72 * sk;
      text(P.sub, W / 2, H * 0.72 + rise, { size: 34, fam: 'serif', color: inkCol, align: 'center', letterSpacing: 6 });
      ctx.restore();
    }

    // 角标照片（马牌）
    if (P.logo && window.PHOTO && window.PHOTO.has(P.logo)) {
      const lk = ease.out(clamp((c.local - 0.6) / 0.5, 0, 1));
      ctx.save();
      ctx.globalAlpha = 0.9 * lk;
      window.PHOTO.plate(P.logo, 64, 176, 300, 168, { tone: 'dark', label: false });
      ctx.restore();
    }

    // 右侧计数
    ctx.save();
    ctx.globalAlpha = 0.6;
    const sideCol = bgIsYellow ? pal.bg : pal.accent;
    const sideDim = bgIsYellow ? pal.bg : pal.dim;
    text('0001', W - 64, H / 2 - 140, { size: 40, fam: 'mono', color: sideCol, align: 'right', letterSpacing: 6 });
    text('SUBJECT INDEX', W - 64, H / 2 - 100, { size: 17, fam: 'mono', color: sideDim, align: 'right', letterSpacing: 3 });
    ctx.restore();

    lyric(lineAt(c.t), c.t, pal, {
      y: H - 210, size: 58,
      color: bgIsYellow ? pal.bg : pal.dim,
      active: bgIsYellow ? pal.bg : pal.ink,
    });
    shotTag(c);
    fadeEdges(c);
  };`;

s = s.slice(0, A) + NEW + s.slice(B + 5);
fs.writeFileSync(p, s);
console.log('wrote', s.length);
