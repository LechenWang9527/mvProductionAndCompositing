// film/src/layouts2.js —— 补充版式（分镜表里剩下没覆盖的几种）
// 与 layouts.js 同一约定：LAYOUTS[kind](c) 是 t 的纯函数；c.p 是这个镜头的参数。
(function () {
  const K = window.K;
  const { W, H, ctx, PAL, clamp, lerp, inv, ease, rnd, hash, text, setFont, measure,
    karaoke, woodcutText, hatchTile, halftone, beatInfo, lineAt, BEAT } = K;
  const L = window.LAYOUTS;
  const { card, field, seal, paperBg, woodcutHills, shotTag, fadeEdges, lyric, asciiField, grid } = window.LAYOUT_KITS;
  const M = 64;

  // M25 歌词卡点：整幅只放一句，逐字砸下，节拍给一条细横线
  L.lyricStage = function (c) {
    const pal = c.pal;
    ctx.fillStyle = pal.bg;
    ctx.fillRect(0, 0, W, H);
    grid(pal, { grid: 80, alpha: 0.04 });
    const bi = beatInfo(c.t);
    // 节拍横线：每拍从中心向两侧生长
    const lw = W * (0.30 + 0.42 * bi.pulse);
    ctx.save();
    ctx.globalAlpha = 0.18;
    ctx.fillStyle = pal.accent;
    ctx.fillRect(W / 2 - lw / 2, H / 2 - 150, lw, 3);
    ctx.fillRect(W / 2 - lw / 2, H / 2 + 150, lw, 3);
    ctx.restore();
    // 歌词位置全片固定：这里只画节拍结构，句子统一由 K.lyric 画在固定带
    const bi2 = beatInfo(c.t);
    ctx.save();
    ctx.globalAlpha = 0.10;
    for (let i = 0; i < 12; i++) {
      const h = 60 + 150 * Math.abs(Math.sin((i + 1) * 1.7 + bi2.n * 0.6));
      ctx.fillStyle = pal.accent;
      ctx.fillRect(W * 0.12 + i * (W * 0.76 / 11), H * 0.70 - h, 2, h);
    }
    ctx.restore();
    // 角标
    ctx.save();
    ctx.globalAlpha = 0.5;
    text(c.p.tag || 'LYRIC', M, 148, { size: 19, fam: 'mono', color: pal.dim, letterSpacing: 5 });
    text(`${String(bi.n + 1).padStart(2, '0')}`, W - M, 148, { size: 19, fam: 'mono', color: pal.dim, align: 'right', letterSpacing: 4 });
    ctx.restore();
    shotTag(c);
    fadeEdges(c);
  };

  // F1 图表生长：柱子/折线按拍生长，右侧结论
  L.chartGrow = function (c) {
    const pal = c.pal;
    const onPaper = c.p.onPaper;
    let cgBg = false;
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
    grid(onPaper ? { line: '#a99a80' } : pal, { grid: 40, alpha: onPaper ? 0.2 : (cgBg ? 0.03 : 0.05) });
    const ink = onPaper ? '#2b2419' : pal.ink;
    const acc = onPaper ? '#a8402c' : pal.accent;
    const dim = onPaper ? '#6b5f4c' : pal.dim;
    const x0 = 260, y0 = 760, w = 1100, h = 400;
    // 轴
    ctx.save();
    ctx.strokeStyle = dim;
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(x0, y0); ctx.lineTo(x0 + w, y0);
    ctx.moveTo(x0, y0); ctx.lineTo(x0, y0 - h);
    ctx.stroke();
    ctx.restore();
    const n = c.p.bars || 9;
    const grow = clamp(c.local / (c.p.grow || 2.2), 0, 1);
    for (let i = 0; i < n; i++) {
      const k = clamp((grow - i / n * 0.55) / 0.45, 0, 1);
      if (k <= 0) continue;
      const bw = w / n * 0.56;
      const bh = h * (0.16 + 0.72 * Math.abs(hash(i * 7 + (c.p.seed || 1))));
      const bx = x0 + (i + 0.22) * (w / n);
      ctx.save();
      ctx.globalAlpha = k;
      ctx.fillStyle = i === n - 1 ? acc : ink;
      ctx.globalAlpha = k * (i === n - 1 ? 0.95 : 0.55);
      ctx.fillRect(bx, y0 - bh * k, bw, bh * k);
      ctx.restore();
      if (i % 2 === 0) {
        text(String(i + 1), bx + bw / 2, y0 + 30, { size: 16, fam: 'mono', color: dim, align: 'center' });
      }
    }
    // 折线叠加
    if (c.p.line) {
      ctx.save();
      ctx.strokeStyle = acc;
      ctx.lineWidth = 3;
      ctx.beginPath();
      for (let i = 0; i <= 40; i++) {
        const p = i / 40;
        if (p > grow) break;
        const xx = x0 + p * w;
        const yy = y0 - h * (0.3 + 0.35 * Math.sin(p * 5 + 1) + 0.18 * p);
        i === 0 ? ctx.moveTo(xx, yy) : ctx.lineTo(xx, yy);
      }
      ctx.stroke();
      ctx.restore();
    }
    text(c.p.title || 'GROWTH', x0, y0 - h - 40, { size: 24, fam: 'mono', color: dim, letterSpacing: 5 });
    if (c.p.note) {
      const nk = clamp((c.local - 1.4) / 0.6, 0, 1);
      ctx.save();
      ctx.globalAlpha = nk;
      text(c.p.note, W - 200, 420, { size: 34, fam: 'serif', color: acc, align: 'right' });
      ctx.restore();
    }
    lyric(lineAt(c.t), c.t, onPaper ? PAL.ancient : pal, {
      y: H - 120, size: c.p.lySize || 48, color: onPaper ? '#2b2419' : pal.ink,
      active: acc, accent: acc,
    });
    shotTag(c);
    fadeEdges(c);
  };

  // 宣纸大旗：两行木刻大字（大风起兮 / 云飞扬）
  L.bannerWoodcut = function (c) {
    paperBg();
    woodcutHills(c.t);
    const lines = c.p.rows || ['大风起兮', '云飞扬'];
    lines.forEach((s, li) => {
      const k = ease.out(clamp((c.local - li * 0.5) / 0.9, 0, 1));
      if (k <= 0) return;
      ctx.save();
      ctx.globalAlpha = k;
      woodcutText(s, W / 2 + (li === 0 ? -120 : 160), 380 + li * 300, li === 0 ? 250 : 210, [
        { angle: 14, spacing: 6, color: 'rgba(227,217,194,0.55)', alpha: 1 },
        { angle: 96, spacing: 10, color: 'rgba(227,217,194,0.3)', alpha: 1 },
      ], { fam: 'serif', baseColor: '#17130f', align: 'center', alpha: 0.94 });
      ctx.restore();
    });
    // 旗杆
    ctx.save();
    ctx.globalAlpha = 0.4;
    ctx.strokeStyle = '#2b2419';
    ctx.lineWidth = 5;
    ctx.beginPath(); ctx.moveTo(200, 220); ctx.lineTo(200, 980); ctx.stroke();
    ctx.restore();
    text('WINDS  ·  60 岁 才 唱', W - 140, 900, { size: 22, fam: 'mono', color: '#4a4235', align: 'right', letterSpacing: 4 });
    lyric(lineAt(c.t), c.t, PAL.ancient, { y: 960, size: 52, active: '#a8402c', accent: '#a8402c' });
    shotTag(c);
    fadeEdges(c);
  };

  // 木刻大名（刘邦 / 老曹 等只靠名字压场的镜头）
  L.nameWoodcut = function (c) {
    paperBg();
    woodcutHills(c.t, [
      { y: 0.68, amp: 40, col: '#7a7058', al: 0.4, sp: 14, ang: 30 },
    ]);
    const p = c.p;
    const nm = p.name || '刘邦';
    woodcutText(nm, W - 200, 420, p.size || 300, [
      { angle: 10, spacing: 6, color: 'rgba(227,217,194,0.55)', alpha: 1 },
      { angle: 92, spacing: 11, color: 'rgba(227,217,194,0.3)', alpha: 1 },
      { angle: 160, spacing: 16, color: 'rgba(227,217,194,0.18)', alpha: 1 },
    ], { fam: 'serif', baseColor: '#17130f', align: 'right', alpha: 0.95 });
    // 左侧小档案
    const k = ease.out(clamp(c.local / 1.2, 0, 1));
    ctx.save();
    ctx.globalAlpha = k * 0.95;
    card(200, 300, 620, 420, PAL.ancient, { id: p.id || 'REC 0008', rows: 5, fill: 'rgba(229,221,203,0.85)', stroke: '#a99a80', idColor: '#a8402c', alpha: k });
    field('NAME', nm, 230, 420, 560, PAL.ancient, 28, k);
    field('TITLE', p.title || '亭长', 230, 478, 560, PAL.ancient, 26, k);
    field('AGE', p.age || '47', 230, 532, 560, PAL.ancient, 26, k);
    field('NOTE', p.note || '牌还没发完', 230, 586, 560, PAL.ancient, 26, k);
    ctx.restore();
    const sk = ease.back(clamp((c.local - 1.0) / 0.3, 0, 1));
    if (sk > 0) seal(p.stamp || '尚未受命', W - 300, 880, 40, '#a8402c', -0.1, sk * 0.9);
    text(p.sub || 'TANG · RECORD', 200, 760, { size: 20, fam: 'mono', color: '#6b5f4c', letterSpacing: 4 });
    lyric(lineAt(c.t), c.t, PAL.ancient, { y: 980, size: 50, active: '#a8402c', accent: '#a8402c' });
    shotTag(c);
    fadeEdges(c);
  };

  // E3 字符画：用块字符拼一个剪影（人形/轮胎），密度按 t 抖动
  L.charArt = function (c) {
    const pal = c.pal;
    ctx.fillStyle = pal.bg;
    ctx.fillRect(0, 0, W, H);
    const cw = 14, ch = 20;
    const cols = Math.floor(W / cw), rows = Math.floor(H / ch);
    const cx = cols / 2, cy = rows * 0.52;
    setFont(ch * 0.92, 'mono');
    const glyphs = c.p.glyphs || '░▒▓█';
    for (let r = 0; r < rows; r++) {
      for (let col = 0; col < cols; col++) {
        const nx = (col - cx) / (cols * 0.17);
        const ny = (r - cy) / (rows * 0.30);
        // 人形：头（圆）+ 肩（梯形）
        const head = Math.hypot(nx, (ny + 0.42) * 1.5) < 1 ? 1 : 0;
        const body = (Math.abs(nx) < (1 - (ny - 0.2) * 0.55)) && ny > 0.02 && ny < 1.35 ? 1 : 0;
        const d = Math.max(head * 0.95, body * 0.8);
        if (d < 0.05) continue;
        const jitter = 0.72 + 0.28 * Math.sin(col * 0.7 + r * 0.5 + c.t * 2.4);
        const lvl = clamp(d * jitter, 0, 1);
        if (lvl < 0.28) continue;
        ctx.globalAlpha = 0.25 + 0.65 * lvl;
        ctx.fillStyle = col % 11 === 0 ? pal.accent : pal.ink;
        ctx.fillText(glyphs[Math.min(glyphs.length - 1, Math.floor(lvl * glyphs.length))], col * cw, r * ch);
      }
    }
    ctx.globalAlpha = 1;
    text(c.p.title || 'E3 · CHAR ART', M, 148, { size: 19, fam: 'mono', color: pal.dim, letterSpacing: 5 });
    lyric(lineAt(c.t), c.t, pal, { y: H - 110, size: 46 });
    shotTag(c);
    fadeEdges(c);
  };

  // 最后一格灯（终镜）：12 张工牌扫光 → 收成 1 方块 + UPTIME 1001
  // 节奏参数（都从 c.p 读，不设就走老节奏）：
  //   sweep      扫光秒数，0 = 不扫光直接收拢
  //   collapseAt 收拢起点（镜头内秒），默认 = sweep
  //   typeAt     开始打字（镜头内秒），默认 = sweep + 收拢 1.2 + 停 0.9
  //   per        每字秒数，默认 0.116
  //   dimAt      压暗起点（镜头内秒），默认 = sweep + 4.4
  // 87：最后一格灯。TAIL_RETIME 版：
  // sweep>0 时：0→sweep 秒 12 张工牌由左到右逐张点亮（扫光），
  // 然后 sweep→sweep+1.2 收拢成 1 方块，typeAt 起逐字打出「灯位 0001 / 常亮 / UPTIME 1001 Y」，
  // dimAt 起其余元素压暗、只留方块，最后黑场收。
  L.lastLamp = function (c) {
    const pal = { bg: '#060607', ink: '#f2efe6', dim: '#7d7a72', line: '#26262a', accent: '#ffcc00' };
    const p = c.p || {};
    const sweep = p.sweep == null ? 0 : p.sweep;
    const collapseDur = 1.2;
    const collapseAt = p.collapseAt == null ? sweep : p.collapseAt;        // 收拢起点（镜头内秒）
    const typeAt = p.typeAt == null ? (sweep > 0 ? sweep + collapseDur + 0.9 : 2.15) : p.typeAt;
    const per = p.per == null ? 0.116 : p.per;
    const dimAt = p.dimAt == null ? (sweep > 0 ? sweep + 4.4 : 4.6) : p.dimAt;

    ctx.fillStyle = pal.bg;
    ctx.fillRect(0, 0, W, H);
    ctx.save();
    ctx.globalAlpha = 0.10;
    ctx.drawImage(K.halftone(W, H, 9, 2.0, '#22221f', 5), 0, 0, W, H);
    ctx.restore();

    const cx = W / 2, cy = H * 0.46;
    const cols = 4, N = 12;
    const pad = 20;
    const cw = 210, ch = 132;
    const gx = cx - (cw * cols + pad * 3) / 2;
    const gy = cy - (ch * 3 + pad * 2) / 2;

    // ---- 阶段 A：扫光（sweep>0 且 local < collapseAt）----
    if (sweep > 0 && c.local < collapseAt) {
      const poll = sweep / 13;
      for (let i = 0; i < N; i++) {
        const r = (i / cols) | 0, col = i % cols;
        const x = gx + col * (cw + pad), y = gy + r * (ch + pad);
        const at = i * poll;
        const sk = ease.out(clamp((c.local - at) / (poll * 0.7), 0, 1));
        if (sk <= 0) continue;
        ctx.save();
        ctx.globalAlpha = 0.28 + 0.55 * sk;
        ctx.strokeStyle = pal.accent;
        ctx.lineWidth = 1 + sk;
        ctx.strokeRect(x + 0.5, y + 0.5, cw, ch);
        ctx.globalAlpha = 0.06 * sk;
        ctx.fillStyle = pal.accent;
        ctx.fillRect(x, y, cw, ch);
        ctx.globalAlpha = 0.6 * sk;
        ctx.fillRect(x + cw / 2 - 4, y + ch / 2 - 4, 8, 8);
        ctx.restore();
      }
      ctx.save();
      ctx.globalAlpha = 0.5;
      text('LIGHT TEST · 逐位点亮', M, 148, { size: 19, fam: 'mono', color: pal.dim, letterSpacing: 5 });
      ctx.restore();
      lyric(lineAt(c.t), c.t, pal, { y: H - 150, size: 48, active: pal.accent, accent: pal.accent });
      shotTag(c);
      fadeEdges(c);
      return;
    }

    // ---- 阶段 B：收拢（12 张 → 1 方块）----
    const cl = c.local - collapseAt;
    const k = ease.io(clamp(cl / collapseDur, 0, 1));
    if (k <= 0.985) {
      for (let i = 0; i < N; i++) {
        const r = (i / cols) | 0, col = i % cols;
        const x0 = gx + col * (cw + pad), y0 = gy + r * (ch + pad);
        const x = x0 + (cx - cw / 2 - x0) * k;
        const y = y0 + (cy - ch / 2 - y0) * k;
        const w = cw + (120 - cw) * k;
        const h = ch + (90 - ch) * k;
        ctx.save();
        ctx.globalAlpha = (0.20 + 0.55 * Math.abs(Math.sin(i * 1.7))) * (1 - k * 0.55);
        ctx.strokeStyle = i === 0 ? pal.accent : pal.line;
        ctx.lineWidth = 1;
        ctx.strokeRect(x + 0.5, y + 0.5, w, h);
        ctx.globalAlpha *= 0.45;
        ctx.fillStyle = i === 0 ? 'rgba(255,204,0,0.10)' : 'rgba(255,255,255,0.03)';
        ctx.fillRect(x, y, w, h);
        ctx.restore();
      }
    }

    // ---- 压暗（在方块之前画，方块保持 100%）----
    const dimK = clamp((c.t - (c.shot.t + dimAt)) / 0.4, 0, 1);
    if (dimK > 0 && k > 0.985) {
      ctx.save();
      ctx.globalAlpha = 0.62 * dimK;
      ctx.fillStyle = '#000';
      ctx.fillRect(0, 0, W, H);
      ctx.restore();
    }

    // ---- 方块 + 逐字打出 ----
    if (k > 0.985) {
      const bw = 420, bh = 210;
      const bx = cx - bw / 2, by = cy - bh / 2;
      const lg = ctx.createRadialGradient(cx, cy, 8, cx, cy, 560);
      lg.addColorStop(0, 'rgba(255,204,0,0.18)');
      lg.addColorStop(1, 'rgba(255,204,0,0)');
      ctx.save();
      ctx.fillStyle = lg;
      ctx.fillRect(0, 0, W, H);
      ctx.restore();
      ctx.save();
      ctx.fillStyle = 'rgba(255,204,0,0.10)';
      ctx.fillRect(bx, by, bw, bh);
      ctx.strokeStyle = pal.accent;
      ctx.lineWidth = 1.5;
      ctx.strokeRect(bx + 0.5, by + 0.5, bw, bh);
      const t2 = 16;
      ctx.beginPath();
      ctx.moveTo(bx, by + t2); ctx.lineTo(bx, by); ctx.lineTo(bx + t2, by);
      ctx.moveTo(bx + bw - t2, by); ctx.lineTo(bx + bw, by); ctx.lineTo(bx + bw, by + t2);
      ctx.moveTo(bx + bw, by + bh - t2); ctx.lineTo(bx + bw, by + bh); ctx.lineTo(bx + bw - t2, by + bh);
      ctx.moveTo(bx + t2, by + bh); ctx.lineTo(bx, by + bh); ctx.lineTo(bx, by + bh - t2);
      ctx.stroke();
      ctx.restore();

      const lines = ['灯位 0001', '常亮', 'UPTIME 1001 Y'];
      const t0 = c.shot.t + typeAt;
      let budget = c.t < t0 ? 0 : Math.floor((c.t - t0) / per);
      ctx.save();
      let yy = cy - 46;
      let curY = yy, curSize = 38, typing = false, typedSoFar = '';
      for (let li = 0; li < lines.length; li++) {
        const str = lines[li];
        const take = Math.max(0, Math.min(str.length, budget));
        budget -= take;
        const size = li === 0 ? 38 : 34;
        if (take > 0) {
          text(str.slice(0, take), cx, yy, {
            size, fam: 'mono',
            color: li === 0 ? pal.accent : pal.ink, align: 'center', letterSpacing: 4,
          });
        }
        if (take < str.length) {
          typing = true; curY = yy; curSize = size; typedSoFar = str.slice(0, take);
          break;
        }
        yy += li === 0 ? 56 : 50;
      }
      if (typing) {
        const tw = typedSoFar ? measure(typedSoFar, curSize, 'mono') : 0;
        ctx.globalAlpha = 0.85;
        ctx.fillStyle = pal.accent;
        ctx.fillRect(cx + tw / 2 + 10, curY - curSize * 0.74, 14, curSize * 0.86);
      }
      ctx.restore();
    }

    // ---- 底部歌词 ----
    ctx.save();
    ctx.globalAlpha = 1 - 0.55 * dimK;
    lyric(lineAt(c.t), c.t, pal, { y: H - 150, size: 48, active: pal.accent, accent: pal.accent });
    ctx.restore();
    shotTag(c);
    fadeEdges(c);
  };

  window.LAYOUTS2_READY = true;
})();
