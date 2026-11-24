// 给版式挂照片底：swissBlocks 重写（按镜头文案 + 可选照片底/黄底/地平线/角标）、phoneDown / processFlow / chartGrow 加照片分支
// 用法：node film/data/patch_layouts_photo.mjs
import fs from 'fs';
const root = 'E:/新建文件夹/实习/MV/';
const rd = (p) => fs.readFileSync(root + p, 'utf8');
const wr = (p, s) => { fs.writeFileSync(root + p, s); console.log('wrote', p, s.length); };

// ---------------- 1) swissBlocks 整体重写 ----------------
let lay = rd('film/src/layouts.js');
const A = '  // L33 瑞士排版：大字拆块拼合\n  LAYOUTS.swissBlocks = function (c) {';
const start = lay.indexOf(A);
if (start < 0) throw new Error('swissBlocks header not found');
const endMark = '\n  };\n';
const end = lay.indexOf(endMark, start);
if (end < 0) throw new Error('swissBlocks end not found');
const oldLen = end + endMark.length - start;
console.log('old swissBlocks bytes:', oldLen);

const NEW = `  // L33 瑞士排版：大字拆块拼合（文案由镜头 p.text 给，不再写死；可挂照片底 / 黄底 / 地平线 / 角标）
  LAYOUTS.swissBlocks = function (c) {
    const p = c.p || {};
    const pal = c.pal;
    const str = p.text || '我是过来人';

    // 底色三选一：照片 > 马牌黄满幅 > 调色板底色
    let bgDone = false;
    if (p.photo && window.PHOTO) {
      bgDone = window.PHOTO.bg(p.photo, 'dark', {
        alpha: p.photoAlpha == null ? 1 : p.photoAlpha,
        scrim: p.photoScrim == null ? 0.36 : p.photoScrim,
        scrimColor: '#0b0b0c',
      });
    }
    if (!bgDone && p.bgMode === 'yellow') {
      ctx.fillStyle = pal.accent;
      ctx.fillRect(0, 0, W, H);
    } else if (!bgDone) {
      ctx.fillStyle = pal.bg;
      ctx.fillRect(0, 0, W, H);
      grid(pal, { grid: 120, alpha: 0.05 });
    }

    // 字色：ink = 本色；bg = 取底色（黄底黑字）；accent = 马牌黄（炭黑底用）
    const inkCol = p.inkMode === 'bg' ? pal.bg : (p.inkMode === 'accent' ? pal.accent : pal.ink);

    // 字号：默认 210，太长或指定时自适应，避免出屏
    let size = p.size || 210;
    const fam = p.en ? 'mono' : 'sans';
    setFont(size, fam, 900);
    let total = 0;
    const cw = [];
    for (const ch of str) { const w = ctx.measureText(ch).width; cw.push(w); total += w; }
    const gap = 10;
    total += gap * Math.max(0, str.length - 1);
    const maxW = W - 300;
    if (total > maxW) {
      size = Math.max(70, Math.floor(size * maxW / total));
      setFont(size, fam, 900);
      total = 0;
      for (let i = 0; i < str.length; i++) { cw[i] = ctx.measureText(str[i]).width; total += cw[i]; }
      total += gap * Math.max(0, str.length - 1);
    }

    let x0 = W / 2 - total / 2;
    const yBase = H / 2 + size * 0.34;
    const corners = [[-1, -1], [1, -1], [-1, 1], [1, 1], [-1, -0.3], [1, 0.3]];
    for (let i = 0; i < str.length; i++) {
      const e = ease.expo(clamp((c.local - i * 0.16) / 0.9, 0, 1));
      const cn = corners[i % corners.length];
      const dx = (1 - e) * cn[0] * 620;
      const dy = (1 - e) * cn[1] * 420;
      ctx.save();
      ctx.globalAlpha = e;
      setFont(size, fam, 900);
      ctx.fillStyle = inkCol;
      ctx.fillText(str[i], x0 + dx, yBase + dy);
      ctx.restore();
      x0 += cw[i] + gap;
    }

    // 地平线（#83「站在卓越路上」：自中间向两侧延展，线上浮出 12 个竖标）
    if (p.horizon) {
      const hk = ease.out(clamp((c.local - 1.2) / 0.6, 0, 1));
      const hy = H * 0.60;
      ctx.save();
      ctx.globalAlpha = 0.55 * hk;
      ctx.fillStyle = pal.accent;
      ctx.fillRect(W / 2 - (W / 2) * hk, hy, W * hk, 2);
      for (let i = 0; i < 12; i++) {
        const x = W / 2 + (i - 5.5) * (W / 13);
        ctx.globalAlpha = 0.5 * hk * (1 - Math.abs(i - 5.5) / 7);
        ctx.fillRect(x, hy - 10, 1, 20);
      }
      ctx.restore();
    }

    // 副题
    if (p.sub) {
      const sk = ease.out(clamp((c.local - 1.0) / 0.7, 0, 1));
      ctx.save();
      ctx.globalAlpha = 0.7 * sk;
      text(p.sub, W / 2, H * 0.70, { size: 34, fam: 'serif', color: inkCol, align: 'center', letterSpacing: 6 });
      ctx.restore();
    }

    // 角标照片（马牌标识）
    if (p.logo && window.PHOTO && window.PHOTO.has(p.logo)) {
      const lk = ease.out(clamp((c.local - 0.6) / 0.5, 0, 1));
      ctx.save();
      ctx.globalAlpha = 0.9 * lk;
      window.PHOTO.plate(p.logo, 64, 176, 300, 168, { tone: 'dark', label: false });
      ctx.restore();
    }

    // 右侧计数
    ctx.save();
    ctx.globalAlpha = 0.6;
    text('0001', W - 64, H / 2 - 140, { size: 40, fam: 'mono', color: p.bgMode === 'yellow' ? pal.bg : pal.accent, align: 'right', letterSpacing: 6 });
    text('SUBJECT INDEX', W - 64, H / 2 - 100, { size: 17, fam: 'mono', color: p.bgMode === 'yellow' ? pal.bg : pal.dim, align: 'right', letterSpacing: 3 });
    ctx.restore();

    lyric(lineAt(c.t), c.t, pal, {
      y: H - 210, size: 62,
      color: p.bgMode === 'yellow' ? pal.bg : pal.dim,
      active: p.bgMode === 'yellow' ? pal.bg : pal.ink,
    });
    shotTag(c);
    fadeEdges(c);
  };`;

lay = lay.slice(0, start) + NEW + lay.slice(end + endMark.length);
wr('film/src/layouts.js', lay);

// ---------------- 2) phoneDown：照片底（有图就不用程序木纹） ----------------
let l3 = rd('film/src/layouts3.js');
const OLD_PHONE_BG = `    // 桌面：暖木纹（竖纹 + 细纹理，别做成方格纸）
    paperBg('#c8b696');
    ctx.save();
    ctx.globalAlpha = 0.55;
    ctx.drawImage(hatchTile(90, 26, W, H, '#8a7350', 0.35, 3), 0, 0, W, H);
    ctx.restore();
    ctx.save();
    ctx.globalAlpha = 0.28;
    ctx.drawImage(hatchTile(86, 7, W, H, '#6b573a', 0.3, 2), 0, 0, W, H);
    ctx.restore();`;
const NEW_PHONE_BG = `    // 桌面：有真照片就用照片（P01），没有才用程序木纹
    let bgDone = false;
    if (c.p && c.p.photo && window.PHOTO) {
      bgDone = window.PHOTO.bg(c.p.photo, 'ancient', {
        alpha: 1,
        scrim: c.p.photoScrim == null ? 0.30 : c.p.photoScrim,
        scrimColor: '#c8b696',
      });
    }
    if (!bgDone) {
      paperBg('#c8b696');
      ctx.save();
      ctx.globalAlpha = 0.55;
      ctx.drawImage(hatchTile(90, 26, W, H, '#8a7350', 0.35, 3), 0, 0, W, H);
      ctx.restore();
      ctx.save();
      ctx.globalAlpha = 0.28;
      ctx.drawImage(hatchTile(86, 7, W, H, '#6b573a', 0.3, 2), 0, 0, W, H);
      ctx.restore();
    }`;
if (!l3.includes(OLD_PHONE_BG)) throw new Error('phoneDown bg block not found');
l3 = l3.replace(OLD_PHONE_BG, NEW_PHONE_BG);

// ---------------- 3) processFlow：照片底 ----------------
const OLD_PF = `  L.processFlow = function (c) {
    const pal = c.pal;
    darkBase(pal, 0.04);`;
const NEW_PF = `  L.processFlow = function (c) {
    const pal = c.pal;
    let pfBg = false;
    if (c.p && c.p.photo && window.PHOTO) {
      pfBg = window.PHOTO.bg(c.p.photo, 'dark', {
        alpha: c.p.photoAlpha == null ? 0.85 : c.p.photoAlpha,
        scrim: c.p.photoScrim == null ? 0.48 : c.p.photoScrim,
        scrimColor: '#0b0b0c',
      });
    }
    if (!pfBg) darkBase(pal, 0.04);`;
if (!l3.includes(OLD_PF)) throw new Error('processFlow head not found');
l3 = l3.replace(OLD_PF, NEW_PF);
wr('film/src/layouts3.js', l3);

// ---------------- 4) chartGrow：照片底 ----------------
let l2 = rd('film/src/layouts2.js');
const OLD_CG = `    if (onPaper) { paperBg('#ded4bc'); } else { ctx.fillStyle = pal.bg; ctx.fillRect(0, 0, W, H); }
    grid(onPaper ? { line: '#a99a80' } : pal, { grid: 40, alpha: onPaper ? 0.2 : 0.05 });`;
const NEW_CG = `    let cgBg = false;
    if (!onPaper && c.p && c.p.photo && window.PHOTO) {
      cgBg = window.PHOTO.bg(c.p.photo, 'dark', {
        alpha: c.p.photoAlpha == null ? 0.8 : c.p.photoAlpha,
        scrim: c.p.photoScrim == null ? 0.52 : c.p.photoScrim,
        scrimColor: '#0b0b0c',
      });
    }
    if (!cgBg) {
      if (onPaper) { paperBg('#ded4bc'); } else { ctx.fillStyle = pal.bg; ctx.fillRect(0, 0, W, H); }
    }
    grid(onPaper ? { line: '#a99a80' } : pal, { grid: 40, alpha: onPaper ? 0.2 : (cgBg ? 0.03 : 0.05) });`;
if (!l2.includes(OLD_CG)) throw new Error('chartGrow bg not found');
l2 = l2.replace(OLD_CG, NEW_CG);
wr('film/src/layouts2.js', l2);

console.log('done');
