// layouts4.js：补两个分镜里已有、但之前没实现对的版式
//   punchline   —— #77 L28 一词两版套印（黄/黑各偏 3 px → 对齐 → 下划线收掉）
//   badgeSweep  —— #86 L16 十二张工牌同亮 + 灯光自左向右 0.09 s/张扫过
(function () {
  'use strict';
  const K = window.K;
  const ctx = K.ctx, W = K.W, H = K.H;
  const PAL = K.PAL || window.PAL;
  const clamp = K.clamp, ease = K.ease;
  const M = 64, BEAT = K.BEAT;
  const L = window.LAYOUTS;
  const KIT = window.LAYOUT_KITS;
  const text = K.text, setFont = K.setFont, measure = K.measure;
  const lyric = KIT.lyric, shotTag = KIT.shotTag, fadeEdges = KIT.fadeEdges, seal = KIT.seal;

  // ---- #77 Punchline：两版套印 ----
  L.punchline = function (c) {
    const pal = c.pal;
    ctx.fillStyle = pal.bg;
    ctx.fillRect(0, 0, W, H);
    // 底色上落一层极淡的网点，避免死平
    ctx.save();
    ctx.globalAlpha = 0.22;
    ctx.drawImage(K.halftone(W, H, 10, 2.2, '#1a1a1c', 9), 0, 0, W, H);
    ctx.restore();

    const word = c.p && c.p.word ? c.p.word : 'Punchline';
    const size = c.p && c.p.size ? c.p.size : 156;
    setFont(size, 'sans', 900);
    const tw = measure(word, size, 'sans', 900);
    const cx = W / 2, base = H * 0.46;

    // 0 → 1：两版从左右各入 3 px
    const k = ease.io(clamp(c.local / 0.9, 0, 1));
    const off = 3 * (1 - k);              // 初始错位 3 px，0.9 s 内对齐

    // 上层小字：工艺的未来都是
    ctx.save();
    ctx.globalAlpha = 0.75;
    text('工艺的未来都是', cx, base - size * 0.92, {
      size: 44, fam: 'serif', color: pal.dim, align: 'center', letterSpacing: 8,
    });
    ctx.restore();

    // 黄版（偏左）
    ctx.save();
    ctx.globalAlpha = 0.92;
    ctx.fillStyle = pal.accent;
    ctx.fillText(word, cx - tw / 2 - off, base);
    ctx.restore();
    // 黑版（偏右），套印错位就靠这两个
    ctx.save();
    ctx.globalAlpha = 0.9;
    ctx.fillStyle = pal.ink;
    ctx.fillText(word, cx - tw / 2 + off, base);
    ctx.restore();

    // 下划线：1.4 s 起 2 px 高，长度 100% → 0 收掉
    const uk = clamp((c.local - 1.4) / 0.5, 0, 1);
    if (uk > 0) {
      const w0 = tw * (1 - uk);
      ctx.save();
      ctx.globalAlpha = 0.85;
      ctx.fillStyle = pal.accent;
      ctx.fillRect(cx - w0 / 2, base + 26, w0, 2);
      ctx.restore();
    }
    // 角标：套印标记
    ctx.save();
    ctx.globalAlpha = 0.5;
    text('REG · 2', M, 148, { size: 15, fam: 'mono', color: pal.dim, letterSpacing: 4 });
    text('OVERPRINT', W - M, 148, { size: 15, fam: 'mono', color: pal.dim, align: 'right', letterSpacing: 4 });
    ctx.restore();

    lyric(K.lineAt(c.t), c.t, pal, { y: H - 210, size: 52, unsung: 0.34 });
    shotTag(c);
    fadeEdges(c);
  };

  // ---- #86 十二张工牌：同亮 + 自左向右扫光 ----
  L.badgeSweep = function (c) {
    const pal = c.pal;
    ctx.fillStyle = '#0a0a0b';
    ctx.fillRect(0, 0, W, H);

    const cols = 4, rows = 3;
    const pad = 36;
    const gw = W - 2 * M - 60;
    const bw = (gw - pad * (cols - 1)) / cols;
    const bh = 176;
    const gapY = 34;
    const x0 = M + 30;
    const y0 = (H - (bh * rows + gapY * (rows - 1))) / 2 - 44;

    // 0.0 s 全暗 → 0.35 s 起全部亮起（不是逐张，分镜要求 298.96 同亮）
    const allOn = ease.out(clamp(c.local / 0.35, 0, 1));
    // 扫光：0.34 s 起，每张 0.09 s
    const sweepAt = (i) => 0.34 + i * 0.09;

    let idx = 0;
    for (let r = 0; r < rows; r++) {
      for (let col = 0; col < cols; col++, idx++) {
        const x = x0 + col * (bw + pad);
        const y = y0 + r * (bh + gapY);
        const sk = ease.out(clamp((c.local - sweepAt(idx)) / 0.22, 0, 1));
        const lit = Math.max(allOn * 0.42, sk);      // 未扫到 42%，扫过即全亮并保持

        // 卡面
        ctx.save();
        ctx.fillStyle = `rgba(18,18,20,${0.55 + lit * 0.35})`;
        ctx.fillRect(x, y, bw, bh);
        ctx.strokeStyle = lit > 0.9 ? pal.accent : pal.line;
        ctx.lineWidth = 1;
        ctx.strokeRect(x + 0.5, y + 0.5, bw, bh);
        ctx.restore();

        // 照片窗（空白，12 张都没有脸）—— 空但不平：填网点 + 内框 + 左下缺角
        const pw = bw - 24, ph = 84;
        const px = x + 12, py = y + 12;
        ctx.save();
        ctx.globalAlpha = 0.10 + lit * 0.10;
        ctx.drawImage(K.halftone(pw, ph, 4, 1.6, pal.ink, 3 + idx), px, py, pw, ph);
        ctx.restore();
        ctx.save();
        ctx.globalAlpha = 0.5 + lit * 0.45;
        ctx.strokeStyle = `rgba(180,175,160,${0.30 + lit * 0.40})`;
        ctx.lineWidth = 1;
        ctx.strokeRect(px + 0.5, py + 0.5, pw, ph);
        // 左下缺角：提示「照片位待补」
        ctx.globalAlpha = 0.30 + lit * 0.35;
        ctx.beginPath();
        ctx.moveTo(px, py + ph - 14);
        ctx.lineTo(px + 14, py + ph);
        ctx.stroke();
        ctx.restore();

        // 工号 + 名牌线
        ctx.save();
        ctx.globalAlpha = 0.35 + lit * 0.55;
        text('#' + String(100 + idx + 1).padStart(4, '0'), x + 12, y + ph + 44,
          { size: 15, fam: 'mono', color: lit > 0.9 ? pal.accent : pal.dim, letterSpacing: 3 });
        ctx.globalAlpha = 0.25 + lit * 0.4;
        ctx.fillStyle = pal.dim;
        ctx.fillRect(x + 12, y + ph + 58, pw * 0.62, 2);
        ctx.fillRect(x + 12, y + ph + 70, pw * 0.42, 2);
        ctx.restore();

        // 扫过时的短暂提亮（很轻，避免变成闪白）
        if (sk > 0.02 && sk < 0.98) {
          ctx.save();
          ctx.globalAlpha = 0.10 * Math.sin(sk * Math.PI);
          ctx.fillStyle = pal.accent;
          ctx.fillRect(x, y, bw, bh);
          ctx.restore();
        }
      }
    }

    // 标题：一 盏 灯（放在 y=150 安全带，不与顶部 HUD 相撞）
    ctx.save();
    ctx.globalAlpha = 0.78;
    text('一 盏 灯', W / 2, 150, { size: 26, fam: 'serif', color: pal.ink, align: 'center', letterSpacing: 10 });
    ctx.restore();
    ctx.save();
    ctx.globalAlpha = 0.45;
    text('12 / 12 常亮', M, 148, { size: 15, fam: 'mono', color: pal.dim, letterSpacing: 4 });
    text('SWEEP 0.09 s/ea', W - M, 148, { size: 15, fam: 'mono', color: pal.dim, align: 'right', letterSpacing: 4 });
    ctx.restore();

    lyric(K.lineAt(c.t), c.t, pal, { y: H - 150, size: 46, unsung: 0.42 });
    shotTag(c);
    fadeEdges(c);
  };
})();
