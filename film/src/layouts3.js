// film/src/layouts3.js —— 分镜精确版式（把 gridLamp / chartGrow 的通用形状换成镜头级的画面）
// 约定与 layouts.js / layouts2.js 相同：LAYOUTS[kind](c) 是 t 的纯函数，c.p 是本镜参数。
// 这一批全部按 film/docs/STORYBOARD.md 里「画面 / 动作」两列逐条实现，不再复用同一张网格。
(function () {

  // ---------- 空间底图：让「一个点在黑暗里」读成「大房间里的一盏灯」 ----------
  // ---------- 背景大字：巨型描边字，极低 alpha，提供前后层次 ----------
  function bgMega(c, o) {
    const q = o || {};
    const pal = c.pal;
    const str = q.text || String(c.shot.n).padStart(2, '0');
    const size = q.size || 420;
    const x = q.x == null ? W * 0.86 : q.x;
    const y = q.y == null ? H * 0.26 : q.y;
    ctx.save();
    ctx.globalAlpha = q.alpha == null ? 0.032 : q.alpha;
    ctx.strokeStyle = pal.ink;
    ctx.lineWidth = q.lw || 3;
    ctx.font = `700 ${size}px "Cascadia Mono", monospace`;
    ctx.textAlign = q.align || 'center';
    ctx.textBaseline = 'middle';
    if (q.letterSpacing) ctx.letterSpacing = q.letterSpacing + 'px';
    ctx.strokeText(str, x, y);
    ctx.restore();
  }

  function roomDepth(pal, o) {
    const q = o || {};
    const vpx = q.vx == null ? W * 0.5 : q.vx;
    const vpy = q.vy == null ? H * 0.52 : q.vy;
    const a = q.alpha == null ? 0.42 : q.alpha;
    const col = q.color || pal.dim;
    ctx.save();
    ctx.strokeStyle = col;
    ctx.lineWidth = 1;
    // 只画到歌词带上方，避免网格穿字
    if (q.clipBottom !== false) {
      ctx.beginPath();
      ctx.rect(0, 0, W, H - 210);
      ctx.clip();
    }

    // 地平线
    ctx.globalAlpha = a;
    ctx.beginPath(); ctx.moveTo(0, vpy); ctx.lineTo(W, vpy); ctx.stroke();

    // 地面放射线（到画幅底边）
    ctx.globalAlpha = a * 0.9;
    for (let i = -8; i <= 8; i++) {
      ctx.beginPath();
      ctx.moveTo(vpx, vpy);
      ctx.lineTo(vpx + i * (W * 0.16), H);
      ctx.stroke();
    }
    // 地面横线（近密远疏）
    ctx.globalAlpha = a * 0.8;
    for (let i = 1; i <= 7; i++) {
      const kk = Math.pow(i / 7, 1.8);
      const y = vpy + (H - vpy) * kk;
      ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(W, y); ctx.stroke();
    }
    // 天花两线
    ctx.globalAlpha = a * 0.62;
    [0.16, 0.30].forEach((f) => {
      ctx.beginPath(); ctx.moveTo(0, vpy * f); ctx.lineTo(W, vpy * f); ctx.stroke();
    });
    // 竖直墙角线（左/右各两根，营造进深）
    ctx.globalAlpha = a * 0.7;
    [0.14, 0.30, 0.70, 0.86].forEach((f) => {
      ctx.beginPath(); ctx.moveTo(W * f, 0); ctx.lineTo(W * f, H); ctx.stroke();
    });

    // 尺度刻度：左边缘每 60 px 一格
    ctx.globalAlpha = a * 0.55;
    for (let y = Math.round(vpy / 60) * 60; y < H; y += 60) {
      ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(16, y); ctx.stroke();
    }

    // ---- 天花吊灯排：沿中线向灭点收，近大远小 ----
    const lamps = 5;
    for (let i = 0; i < lamps; i++) {
      const f = 1 - i / (lamps + 0.6);                 // 1 → 小
      const y = vpy * 0.30 + (vpy - vpy * 0.30) * (1 - f) * 0.9;
      const sz = 26 * Math.pow(f, 1.5);
      // 吊杆
      ctx.globalAlpha = a * 0.55 * f;
      ctx.beginPath();
      ctx.moveTo(vpx + (i - (lamps - 1) / 2) * W * 0.10 * f, 0);
      ctx.lineTo(vpx + (i - (lamps - 1) / 2) * W * 0.10 * f, y - sz);
      ctx.stroke();
      // 灯罩（梯形）
      ctx.globalAlpha = a * 0.85 * f;
      ctx.beginPath();
      const lx = vpx + (i - (lamps - 1) / 2) * W * 0.10 * f;
      ctx.moveTo(lx - sz * 0.55, y);
      ctx.lineTo(lx + sz * 0.55, y);
      ctx.lineTo(lx + sz * 0.30, y - sz * 0.45);
      ctx.lineTo(lx - sz * 0.30, y - sz * 0.45);
      ctx.closePath();
      ctx.stroke();
    }

    // ---- 车道虚线：从灭点向画面底部两侧展开 ----
    ctx.globalAlpha = a * 0.75;
    [-1, 1].forEach((sgn) => {
      for (let i = 1; i <= 8; i++) {
        const k0 = Math.pow(i / 9, 2.1), k1 = Math.pow((i + 0.45) / 9, 2.1);
        const y0 = vpy + (H - vpy) * k0, y1 = vpy + (H - vpy) * k1;
        const xa = vpx + sgn * W * 0.10 * k0, xb = vpx + sgn * W * 0.10 * k1;
        ctx.beginPath(); ctx.moveTo(xa, y0); ctx.lineTo(xb, y1); ctx.stroke();
      }
    });

    // ---- 踢脚线：地平线下方 12 px 一条更亮的横线 ----
    ctx.globalAlpha = a * 0.75;
    ctx.beginPath(); ctx.moveTo(0, vpy + 12); ctx.lineTo(W, vpy + 12); ctx.stroke();

    // ---- 四角位置编号 ----
    ctx.globalAlpha = a * 0.7;
    ctx.fillStyle = col;
    const tags = [['A', 26, 22], ['B', W - 26, 22], ['C', 26, H - 26], ['D', W - 26, H - 26]];
    tags.forEach(([ch, tx, ty]) => {
      ctx.font = '400 13px "Cascadia Mono", monospace';
      ctx.textAlign = tx < W / 2 ? 'left' : 'right';
      ctx.fillText(ch, tx, ty);
    });
    ctx.restore();
  }

  const K = window.K;
  const { W, H, ctx, clamp, lerp, inv, ease, rnd, hash, text, setFont, measure,
    karaoke, woodcutText, hatchTile, grainTile, halftone, scanlines, beatInfo, halfPulse,
    lineAt, BEAT } = K;
  const L = window.LAYOUTS;
  const { card, field, seal, typed, paperBg, woodcutHills, shotTag, fadeEdges, lyric, grid, M } = window.LAYOUT_KITS;

  // 本文件通用的：「本镜进度」0→1 与「拍数」
  const prog = (c) => clamp(c.local / Math.max(0.2, c.dur), 0, 1);
  const beats = (c) => Math.floor(c.local / BEAT + 0.15);
  // 暗底 + 极淡网格
  function darkBase(pal, alpha) {
    ctx.fillStyle = pal.bg;
    ctx.fillRect(0, 0, W, H);
    grid(pal, { grid: 80, alpha: alpha == null ? 0.05 : alpha });
  }
  // 方形光晕（灯）
  function glowAt(x, y, r, color, a) {
    const g = ctx.createRadialGradient(x, y, 1, x, y, r);
    g.addColorStop(0, hexA(color, a));
    g.addColorStop(1, hexA(color, 0));
    ctx.save();
    ctx.fillStyle = g;
    ctx.fillRect(x - r, y - r, r * 2, r * 2);
    ctx.restore();
  }
  function hexA(hex, a) {
    const h = hex.replace('#', '');
    const n = parseInt(h.length === 3 ? h.split('').map((x) => x + x).join('') : h, 16);
    return `rgba(${(n >> 16) & 255},${(n >> 8) & 255},${n & 255},${a})`;
  }

  // ---------------- 05 hook：64 格黑场里的一格暖白灯（右移 3 格，拖细线，最后收成 1 点） ----------------
  L.lampTrack = function (c) {
    const pal = c.pal;
    ctx.fillStyle = '#050506';
    ctx.fillRect(0, 0, W, H); roomDepth(c.pal); bgMega(c);
    const cols = 8, rows = 8, gw = W / cols, gh = H / rows;
    const step = clamp(beats(c), 0, 3);          // 每拍右移一格，共 3 格
    const cx = 1 + step, cy = 4;
    const bx = cx * gw + gw / 2, by = cy * gh + gh / 2;
    // 底格：全部压到 6%
    for (let r = 0; r < rows; r++) {
      for (let col = 0; col < cols; col++) {
        ctx.save();
        ctx.globalAlpha = 0.06;
        ctx.fillStyle = pal.dim;
        ctx.fillRect(col * gw + 5, r * gh + 5, gw - 10, gh - 10);
        ctx.restore();
      }
    }
    // 拖出的 0.5 px 暖白细线（已走过的格连起来）
    const trail = clamp(beats(c) / 3, 0, 1);
    if (trail > 0) {
      ctx.save();
      ctx.globalAlpha = 0.55 * trail;
      ctx.fillStyle = '#f7f0dc';
      ctx.fillRect(1 * gw + gw / 2, by - 0.75, (cx - 1) * gw, 1.5);
      ctx.restore();
    }
    // 灯本体：0.3 s 亮到 100%，之后呼吸 ±6%（不越 3 次/秒的闪动限制）
    const on = ease.out(clamp(c.local / 0.3, 0, 1));
    const br = 0.94 + 0.06 * Math.sin((c.local / BEAT) * Math.PI * 2);
    ctx.save();
    ctx.globalAlpha = on * br;
    ctx.fillStyle = '#f7f0dc';
    ctx.fillRect(cx * gw + 5, cy * gh + 5, gw - 10, gh - 10);
    ctx.restore();
    glowAt(bx, by, 190, '#f7f0dc', 0.16 * on * br);
    // 最后 1 秒：细线收成 1 点（线缩短，点保留）
    const shrink = inv(c.dur - 1.1, c.dur - 0.1, c.local);
    if (shrink > 0) {
      ctx.save();
      ctx.globalAlpha = 0.9;
      ctx.fillStyle = '#f7f0dc';
      const sx = lerp(1 * gw + gw / 2, bx, shrink);
      ctx.fillRect(sx - 1.5, by - 1.5, 3, 3);
      ctx.restore();
    }
    lyric(lineAt(c.t), c.t, pal, { y: H - 130, size: 56 });
    shotTag(c);
    fadeEdges(c);
  };

  // ---------------- 18 hook：满屏 128 个灰点，其中 1 个变暖白 ----------------
  L.dotField128 = function (c) {
    const pal = c.pal;
    darkBase(pal, 0.04); roomDepth(c.pal); bgMega(c);
    const COLS = 16, ROWS = 8, N = COLS * ROWS;      // 128 点
    const x0 = 96, x1 = W - 96, y0 = 150, y1 = H - 230;
    const cx = COLS / 2 | 0, cy = ROWS / 2 | 0;
    const ci = cy * COLS + cx;
    for (let i = 0; i < N; i++) {
      const col = i % COLS, r = (i / COLS) | 0;
      const x = x0 + (x1 - x0) * (col / (COLS - 1));
      const y = y0 + (y1 - y0) * (r / (ROWS - 1));
      const isC = i === ci;
      let a = 0.30, rad = 3.4, col2 = pal.dim;
      if (isC) {
        a = lerp(0.20, 1.0, ease.out(inv(0, 1.6, c.local)));
        rad = lerp(3.4, 6.2, ease.out(inv(0, 1.6, c.local)));
        col2 = '#f7f0dc';
      } else {
        a = lerp(0.30, 0.08, ease.out(inv(0, 1.2, c.local)));
      }
      // 极轻的呼吸，避免死板；不同相位
      a *= 0.92 + 0.08 * Math.sin(c.t * 1.6 + i * 0.7);
      ctx.save();
      ctx.globalAlpha = a;
      ctx.fillStyle = col2;
      ctx.beginPath(); ctx.arc(x, y, rad, 0, Math.PI * 2); ctx.fill();
      ctx.restore();
      if (isC) glowAt(x, y, 220, '#f7f0dc', 0.12);
    }
    ctx.save();
    ctx.globalAlpha = 0.5;
    text(`DOTS ${N}  ·  LIT 1`, M, 148, { size: 19, fam: 'mono', color: pal.dim, letterSpacing: 5 });
    ctx.restore();
    lyric(lineAt(c.t), c.t, pal, { y: H - 130, size: 62 });
    shotTag(c);
    fadeEdges(c);
  };

  // ---------------- 19 hook：黑场中央一盏灯（8×8 px 方块 + 12% 光晕呼吸） ----------------
  L.singleLamp = function (c) {
    const pal = c.pal;
    ctx.fillStyle = '#050506';
    ctx.fillRect(0, 0, W, H); roomDepth(c.pal); bgMega(c);
    const on = ease.out(clamp(c.local / 0.3, 0, 1));
    const br = 1 + 0.06 * Math.sin((c.local / BEAT) * Math.PI * 2);   // 光晕呼吸 ±6 px 的等效
    const s = 8;
    ctx.save();
    ctx.globalAlpha = on;
    ctx.fillStyle = '#f7f0dc';
    ctx.fillRect(W / 2 - s / 2, H / 2 - s / 2 - 40, s, s);
    ctx.restore();
    glowAt(W / 2, H / 2 - 40, 168 * br, '#f7f0dc', 0.12 * on);
    // 十字准线（档案系统的"定位"）
    ctx.save();
    ctx.globalAlpha = 0.18 * on;
    ctx.fillStyle = pal.line;
    ctx.fillRect(W / 2 - 320, H / 2 - 41, 300, 1);
    ctx.fillRect(W / 2 + 20, H / 2 - 41, 300, 1);
    ctx.fillRect(W / 2 - 0.5, H / 2 - 41 - 210, 1, 190);
    ctx.fillRect(W / 2 - 0.5, H / 2 - 41 + 20, 1, 190);
    ctx.restore();
    ctx.save();
    ctx.globalAlpha = 0.42;
    text('LAMP 0001', W / 2, H / 2 + 220, { size: 18, fam: 'mono', color: pal.dim, align: 'center', letterSpacing: 6 });
    ctx.restore();
    lyric(lineAt(c.t), c.t, pal, { y: H - 150, size: 58 });
    shotTag(c);
    fadeEdges(c);
  };

  // ---------------- 38 hook-marpol：3×3 灯格，8 暗 1 黄 ----------------
  L.lampGrid9 = function (c) {
    const pal = c.pal;
    ctx.fillStyle = '#050506';
    ctx.fillRect(0, 0, W, H); roomDepth(c.pal); bgMega(c);
    const N = 3, cell = 128, gap = 26;
    const tot = N * cell + (N - 1) * gap;
    const x0 = (W - tot) / 2, y0 = (H - tot) / 2 - 30;
    const lit = 4;                                   // 中间一格
    const on = ease.out(clamp((c.local - 0.1) / 0.4, 0, 1));
    for (let i = 0; i < 9; i++) {
      const col = i % N, r = (i / N) | 0;
      const x = x0 + col * (cell + gap), y = y0 + r * (cell + gap);
      const isLit = i === lit;
      ctx.save();
      if (isLit) {
        ctx.globalAlpha = on * 0.98;
        ctx.fillStyle = pal.accent;
      } else {
        ctx.globalAlpha = 0.04;
        ctx.fillStyle = pal.ink;
      }
      ctx.fillRect(x, y, cell, cell);
      ctx.restore();
      // 1 px 外扩（灯格的边）
      if (isLit && on > 0.5) {
        ctx.save();
        ctx.globalAlpha = 0.5;
        ctx.strokeStyle = pal.accent;
        ctx.lineWidth = 1;
        ctx.strokeRect(x - 1.5, y - 1.5, cell + 3, cell + 3);
        ctx.restore();
      }
    }
    const lx = x0 + (lit % N) * (cell + gap) + cell / 2;
    const ly = y0 + ((lit / N) | 0) * (cell + gap) + cell / 2;
    glowAt(lx, ly, 230, pal.accent, 0.14 * on);
    ctx.save();
    ctx.globalAlpha = 0.45;
    text('LAMPS 3×3  ·  1 ON', M, 148, { size: 19, fam: 'mono', color: pal.dim, letterSpacing: 5 });
    ctx.restore();
    lyric(lineAt(c.t), c.t, pal, { y: H - 130, size: 60 });
    shotTag(c);
    fadeEdges(c);
  };

  // ---------------- 39 hook-marpol：同一格灯，底换工单纸纹，下方「灯位 0001 / 常亮」每拍多一个点 ----------------
  L.workOrderLamp = function (c) {
    const pal = c.pal;
    paperBg('#ded4bc');
    // 工单纸纹：淡横线 + 左侧装订孔
    ctx.save();
    ctx.globalAlpha = 0.18;
    ctx.fillStyle = '#8a7c62';
    for (let y = 210; y < H - 210; y += 46) ctx.fillRect(150, y, W - 300, 1);
    ctx.restore();
    ctx.save();
    ctx.globalAlpha = 0.5;
    ctx.fillStyle = '#b3a68b';
    for (let i = 0; i < 5; i++) {
      ctx.beginPath(); ctx.arc(118, 250 + i * 130, 7, 0, Math.PI * 2); ctx.fill();
    }
    ctx.restore();
    // 黄格
    const cell = 132;
    const x = W / 2 - cell / 2, y = 300;
    ctx.save();
    ctx.fillStyle = pal.accent;
    ctx.globalAlpha = 0.97;
    ctx.fillRect(x, y, cell, cell);
    ctx.restore();
    ctx.save();
    ctx.globalAlpha = 0.85;
    ctx.strokeStyle = '#2b2419';
    ctx.lineWidth = 2;
    ctx.strokeRect(x - 6, y - 6, cell + 12, cell + 12);
    ctx.restore();
    glowAt(x + cell / 2, y + cell / 2, 300, '#ffcc00', 0.16);
    // 下方「灯位 0001 / 常亮」+ 每拍多一个点
    const n = clamp(beats(c) + 1, 1, 8);
    ctx.save();
    text('灯位 0001', W / 2, y + cell + 92, { size: 34, fam: 'serif', color: '#2b2419', align: 'center', weight: 700 });
    text('常 亮', W / 2, y + cell + 142, { size: 26, fam: 'serif', color: '#6b5f4c', align: 'center', letterSpacing: 8 });
    ctx.restore();
    for (let i = 0; i < n; i++) {
      ctx.save();
      ctx.globalAlpha = 0.85;
      ctx.fillStyle = '#a8402c';
      ctx.beginPath(); ctx.arc(W / 2 - (n - 1) * 16 + i * 32, y + cell + 190, 5, 0, Math.PI * 2); ctx.fill();
      ctx.restore();
    }
    ctx.save();
    ctx.globalAlpha = 0.55;
    text('WORK ORDER · LAMP', 150, 176, { size: 18, fam: 'mono', color: '#6b5f4c', letterSpacing: 5 });
    text('No.0001', W - 150, 176, { size: 18, fam: 'mono', color: '#6b5f4c', align: 'right', letterSpacing: 3 });
    ctx.restore();
    lyric(lineAt(c.t), c.t, { ink: '#2b2419', hot: '#a8402c', accent: '#a8402c', dim: '#6b5f4c' },
      { y: H - 150, size: 52, active: '#a8402c', accent: '#a8402c' });
    shotTag(c);
    fadeEdges(c);
  };

  // ---------------- 50 no-complaint：一条水平细线，线上 1 个点极慢右移 ----------------
  L.slowLine = function (c) {
    const pal = c.pal;
    ctx.fillStyle = pal.bg;
    ctx.fillRect(0, 0, W, H); roomDepth(c.pal); bgMega(c);
    // 细线横穿
    const y = H * 0.52;
    ctx.save();
    ctx.globalAlpha = 0.55;
    ctx.fillStyle = pal.line;
    ctx.fillRect(0, y, W, 1.5);
    ctx.restore();
    // 点：0.004 屏/秒，全镜只走 2.7% 屏宽
    const travel = 0.027 * (W / 1);            // 2.7% 屏宽 = 51.8 px
    const px = W * 0.30 + travel * prog(c);
    const tail = clamp((c.local - (c.dur * 0.45)) / 0.4, 0, 1);
    if (tail > 0) {
      ctx.save();
      ctx.globalAlpha = 0.35 * tail;
      ctx.fillStyle = pal.accent;
      ctx.fillRect(px - 26, y - 0.5, 26, 1.5);
      ctx.restore();
    }
    ctx.save();
    ctx.globalAlpha = 0.95;
    ctx.fillStyle = pal.accent;
    ctx.beginPath(); ctx.arc(px, y, 4.4, 0, Math.PI * 2); ctx.fill();
    ctx.restore();
    glowAt(px, y, 90, pal.accent, 0.10);
    // 右下角持续中
    const blink = 0.55 + 0.45 * Math.sin(c.t * 3.1);
    ctx.save();
    ctx.globalAlpha = 0.42;
    text('CONTINUING', W - M, H - 118, { size: 17, fam: 'mono', color: pal.dim, align: 'right', letterSpacing: 5 });
    ctx.globalAlpha = 0.55 * blink;
    ctx.fillStyle = pal.accent;
    ctx.fillRect(W - M - 1 - 9, H - 148, 9, 9);
    ctx.restore();
    lyric(lineAt(c.t), c.t, pal, { y: H - 190, size: 50 });
    shotTag(c);
    fadeEdges(c);
  };

  // ---------------- 54 / 81 / 55 / 82 hook-marpol：12 格工牌网格，1 格亮起 ----------------
  function badgeGrid(c, o) {
    const pal = c.pal;
    darkBase(pal, 0.035);
    const N = 4, cell = 208, gap = 22;
    const totW = N * cell + (N - 1) * gap;
    const x0 = (W - totW) / 2, y0 = 200;
    const lit = o.lit;
    const appear = o.appear === false ? 1 : ease.out(clamp(c.local / 0.25, 0, 1));
    const on = ease.out(clamp((c.local - (o.delay || 0.15)) / 0.5, 0, 1));
    const halo = (o.halo || 0) * ease.out(clamp((c.local - 0.3) / 0.6, 0, 1));
    for (let i = 0; i < 12; i++) {
      const col = i % N, r = (i / N) | 0;
      const x = x0 + col * (cell + gap), y = y0 + r * (cell + gap) * 0.86;
      const isLit = i === lit;
      const cw = cell, chh = cell * 0.86;
      // 工牌卡
      ctx.save();
      ctx.globalAlpha = appear * (isLit ? 1 : 0.9);
      ctx.fillStyle = isLit ? 'rgba(255,204,0,0.10)' : 'rgba(255,255,255,0.028)';
      ctx.fillRect(x, y, cw, chh);
      ctx.strokeStyle = isLit ? pal.accent : pal.line;
      ctx.lineWidth = isLit ? 2 : 1;
      ctx.globalAlpha = appear * (isLit ? 0.25 + 0.75 * on : 0.55);
      ctx.strokeRect(x + 0.5, y + 0.5, cw, chh);
      ctx.restore();
      // 工牌上部条 + 编号
      ctx.save();
      ctx.globalAlpha = appear * (isLit ? 0.25 + 0.75 * on : 0.5);
      ctx.fillStyle = isLit ? pal.accent : pal.line;
      ctx.fillRect(x, y, cw, 4);
      text(`#${String(i + 1).padStart(4, '0')}`, x + 24, y + 34, { size: 15, fam: 'mono', color: isLit ? pal.accent : pal.dim, letterSpacing: 2 });
      // 右侧：部门代号
      text(`D${String((i % 4) + 1).padStart(2, '0')}`, x + cw - 16, y + 34,
        { size: 13, fam: 'mono', color: isLit ? pal.accent : pal.dim, align: 'right', letterSpacing: 2 });
      ctx.restore();

      // ---- 证件照窗（左上）+ 姓名条 / 职务 / 工号 / 有效期（右侧） ----
      ctx.save();
      const pk = appear * (isLit ? 0.42 + 0.58 * on : 0.34);
      ctx.globalAlpha = pk;
      const px2 = x + 22, py2 = y + 58, pw2 = 62, ph2 = 78;
      ctx.strokeStyle = isLit ? pal.accent : pal.line;
      ctx.lineWidth = 1;
      ctx.strokeRect(px2 + 0.5, py2 + 0.5, pw2, ph2);
      // 照片占位：斜排线 + 一个头肩轮廓
      ctx.globalAlpha = pk * 0.5;
      ctx.beginPath();
      ctx.arc(px2 + pw2 / 2, py2 + ph2 * 0.36, 13, 0, Math.PI * 2);
      ctx.stroke();
      ctx.beginPath();
      ctx.arc(px2 + pw2 / 2, py2 + ph2 * 0.96, 21, Math.PI, 0);
      ctx.stroke();
      // 姓名条（灰框代表未填）
      ctx.globalAlpha = pk * 0.75;
      ctx.fillStyle = isLit ? pal.accent : pal.ink;
      const tx2 = px2 + pw2 + 16, tw2 = cw - (px2 - x) - pw2 - 34;
      ctx.fillRect(tx2, py2 + 10, tw2 * 0.72, 7);
      ctx.globalAlpha = pk * 0.45;
      ctx.fillRect(tx2, py2 + 30, tw2 * 0.5, 5);
      ctx.fillRect(tx2, py2 + 46, tw2 * 0.36, 5);
      ctx.fillRect(tx2, py2 + 62, tw2 * 0.44, 5);
      // 底部条码
      ctx.globalAlpha = pk * 0.5;
      ctx.fillStyle = isLit ? pal.accent : pal.ink;
      let bx2 = x + 24;
      const bw2 = cw - 48;
      for (let k2 = 0; k2 < 26; k2++) {
        const w2 = 1 + ((i * 7 + k2 * 3) % 2);
        if (k2 % 2 === 0) ctx.fillRect(bx2, y + chh - 40, w2, 18);
        bx2 += w2 + 1.6;
        if (bx2 > x + cw - 26) break;
      }
      ctx.globalAlpha = pk * 0.6;
      text(`${String(i + 1).padStart(4, '0')} · 2Y`, x + 24, y + chh - 12,
        { size: 11, fam: 'mono', color: isLit ? pal.accent : pal.dim, letterSpacing: 1.5 });
      ctx.restore();
      if (isLit) {
        // 亮的格：中间一盏灯 + 光晕
        const lx = x + cw / 2, ly = y + chh / 2 - 8;
        ctx.save();
        ctx.globalAlpha = on * 0.98;
        ctx.fillStyle = pal.accent;
        ctx.fillRect(lx - 5, ly - 5, 10, 10);
        ctx.restore();
        if (halo > 0) glowAt(lx, ly, halo, pal.accent, 0.20 * on);
        // 光晕内格线变暗（压在光晕下的效果）
        if (halo > 0) {
          ctx.save();
          ctx.globalAlpha = 0.5 * on;
          text('ON', x + cw - 16, y + chh - 18, { size: 16, fam: 'mono', color: pal.accent, align: 'right', letterSpacing: 3 });
          ctx.restore();
        }
      }
    }
    // 受光邻格提亮（55/82 用）
    if (o.spill) {
      const nb = [{ i: lit - 1 }, { i: lit + 1 }, { i: lit - 4 }, { i: lit + 4 }];
      nb.forEach((b) => {
        if (b.i < 0 || b.i > 11) return;
        const col = b.i % N, r = (b.i / N) | 0;
        const x = x0 + col * (cell + gap), y = y0 + r * (cell + gap) * 0.86;
        ctx.save();
        ctx.globalAlpha = 0.12 * on;
        ctx.fillStyle = pal.accent;
        ctx.fillRect(x, y, cell, cell * 0.86);
        ctx.restore();
      });
    }
    ctx.save();
    ctx.globalAlpha = 0.45;
    text(`BADGES 12  ·  1 ON`, M, 148, { size: 19, fam: 'mono', color: pal.dim, letterSpacing: 5 });
    ctx.restore();
    lyric(lineAt(c.t), c.t, pal, { y: H - 130, size: o.lySize || 58 });
    shotTag(c);
    fadeEdges(c);
  }
  // 54：12 格，左起第 4 格亮
  L.badgeGrid12 = function (c) { badgeGrid(c, { lit: 3 }); };
  // 55：同一网格，亮格变灯 + 光晕 0→18 px
  L.badgeGridHalo = function (c) { badgeGrid(c, { lit: 3, halo: 18, appear: false, spill: false, lySize: 54 }); };
  // 81：左起第 7 格
  L.badgeGrid12b = function (c) { badgeGrid(c, { lit: 6 }); };
  // 82：光晕 0→22 px，相邻 4 格 4%→12%（受光）
  L.badgeGridHalo2 = function (c) { badgeGrid(c, { lit: 6, halo: 22, appear: false, spill: true, lySize: 54 }); };

  // ---------------- 74 allen：一个方括弧把一团乱线框住 ----------------
  L.bracketTangle = function (c) {
    const pal = c.pal;
    darkBase(pal, 0.04); roomDepth(c.pal); bgMega(c);
    const cx = W / 2, cy = H / 2 - 30;
    // 乱线团：确定性的折线团
    ctx.save();
    ctx.strokeStyle = pal.ink;
    ctx.lineWidth = 1.6;
    const n = 26;
    const jitter = 1 - 0.7 * ease.out(clamp((c.local - 1.0) / 0.5, 0, 1));  // 括弧合拢后乱线降到 30%
    ctx.globalAlpha = 0.62 * jitter + 0.18;
    for (let i = 0; i < n; i++) {
      const a0 = hash(i * 3.1) * Math.PI * 2;
      const r0 = 40 + hash(i * 7.7) * 190;
      const x0 = cx + Math.cos(a0) * r0, y0 = cy + Math.sin(a0) * r0 * 0.72;
      ctx.beginPath();
      ctx.moveTo(x0, y0);
      let x = x0, y = y0;
      for (let k = 0; k < 4; k++) {
        x += (hash(i * 13 + k * 5) - 0.5) * 180;
        y += (hash(i * 17 + k * 9) - 0.5) * 120;
        ctx.lineTo(clamp(x, cx - 300, cx + 300), clamp(y, cy - 210, cy + 210));
      }
      ctx.stroke();
    }
    ctx.restore();
    // 方括弧：0.3 s 自两侧合拢
    const k = ease.out(clamp(c.local / 0.3, 0, 1));
    const halfW = lerp(470, 320, k), halfH = 210;
    ctx.save();
    ctx.strokeStyle = pal.accent;
    ctx.lineWidth = 5;
    ctx.globalAlpha = 0.95;
    // 左 [
    ctx.beginPath();
    ctx.moveTo(cx - halfW + 34, cy - halfH);
    ctx.lineTo(cx - halfW, cy - halfH);
    ctx.lineTo(cx - halfW, cy + halfH);
    ctx.lineTo(cx - halfW + 34, cy + halfH);
    ctx.stroke();
    // 右 ]
    ctx.beginPath();
    ctx.moveTo(cx + halfW - 34, cy - halfH);
    ctx.lineTo(cx + halfW, cy - halfH);
    ctx.lineTo(cx + halfW, cy + halfH);
    ctx.lineTo(cx + halfW - 34, cy + halfH);
    ctx.stroke();
    ctx.restore();
    ctx.save();
    ctx.globalAlpha = 0.5;
    text('ALLEN MA', cx, cy - halfH - 30, { size: 20, fam: 'mono', color: pal.dim, align: 'center', letterSpacing: 6 });
    text('SCOPE', cx, cy + halfH + 42, { size: 18, fam: 'mono', color: pal.accent, align: 'center', letterSpacing: 5 });
    ctx.restore();
    lyric(lineAt(c.t), c.t, pal, { y: H - 140, size: 54 });
    shotTag(c);
    fadeEdges(c);
  };

  // ---------------- 61 wuhan：4 级台阶，0.232 s 各长高 1 级，末帧最高级站人形剪影 ----------------
  L.stairs4 = function (c) {
    const pal = c.pal;
    darkBase(pal, 0.04);
    const x0 = 380, base = 800, stepW = 220, stepH = 132;
    for (let i = 0; i < 4; i++) {
      const k = clamp((c.local - i * 0.232) / 0.232, 0, 1);
      const h = (stepH * (i + 1)) * ease.out(k);
      if (h <= 0.5) continue;
      const x = x0 + i * stepW;
      ctx.save();
      ctx.globalAlpha = 0.92;
      ctx.fillStyle = i === 3 ? hexA(pal.accent, 0.85) : pal.line;
      ctx.fillRect(x, base - h, stepW - 8, h);
      ctx.restore();
      // 台阶编号
      ctx.save();
      ctx.globalAlpha = 0.55;
      text(`L${i + 1}`, x + 14, base - 16, { size: 18, fam: 'mono', color: i === 3 ? pal.bg : pal.dim, letterSpacing: 2 });
      ctx.restore();
      // 基线
      ctx.save();
      ctx.globalAlpha = 0.5;
      ctx.fillStyle = pal.dim;
      ctx.fillRect(x, base, stepW - 8, 1.5);
      ctx.restore();
    }
    // 末帧：第 4 级站一个 12 px 人形剪影（无面部）
    const man = clamp((c.local - 3 * 0.232 - 0.35) / 0.3, 0, 1);
    if (man > 0) {
      const x = x0 + 3 * stepW + (stepW - 8) / 2, y = base - stepH * 4;
      ctx.save();
      ctx.globalAlpha = man;
      ctx.fillStyle = pal.ink;
      ctx.beginPath(); ctx.arc(x, y - 62, 9, 0, Math.PI * 2); ctx.fill();
      ctx.fillRect(x - 11, y - 52, 22, 44);
      ctx.fillRect(x - 9, y - 10, 7, 10);
      ctx.fillRect(x + 2, y - 10, 7, 10);
      ctx.restore();
    }
    ctx.save();
    ctx.globalAlpha = 0.42;
    text('FOUR PHASES · RAMP', M, 148, { size: 19, fam: 'mono', color: pal.dim, letterSpacing: 5 });
    ctx.restore();
    lyric(lineAt(c.t), c.t, pal, { y: H - 140, size: 54 });
    shotTag(c);
    fadeEdges(c);
  };

  // ---------------- 66 gary：8 个节点串成折线，0.116 s 依次点亮 ----------------
  L.processFlow = function (c) {
    const pal = c.pal;
    let pfBg = false;
    if (c.p && c.p.photo && window.PHOTO) {
      pfBg = window.PHOTO.bg(c.p.photo, 'dark', {
        alpha: c.p.photoAlpha == null ? 0.85 : c.p.photoAlpha,
        scrim: c.p.photoScrim == null ? 0.48 : c.p.photoScrim,
        scrimColor: '#0b0b0c',
      });
    }
    if (!pfBg) darkBase(pal, 0.04);
    const N = 8;
    const x0 = 200, x1 = W - 200, yBase = 620;
    const pt = [];
    for (let i = 0; i < N; i++) {
      const p = i / (N - 1);
      pt.push({
        x: lerp(x0, x1, p),
        y: yBase + Math.sin(p * 3.4 + 0.6) * 120 + (hash(i * 5.3) - 0.5) * 40,
      });
    }
    // 连线（节点后 0.05 s 补上）
    for (let i = 0; i < N - 1; i++) {
      const k = clamp((c.local - i * 0.116 - 0.05) / 0.116, 0, 1);
      if (k <= 0) continue;
      ctx.save();
      ctx.globalAlpha = 0.55;
      ctx.strokeStyle = pal.line;
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(pt[i].x, pt[i].y);
      ctx.lineTo(lerp(pt[i].x, pt[i + 1].x, k), lerp(pt[i].y, pt[i + 1].y, k));
      ctx.stroke();
      ctx.restore();
    }
    const allDone = clamp((c.local - 7 * 0.116 - 0.1) / 0.5, 0, 1);  // 第 8 节点后整线提亮 40%→80%
    for (let i = 0; i < N; i++) {
      const k = clamp((c.local - i * 0.116) / 0.2, 0, 1);
      if (k <= 0) continue;
      const last = i === N - 1;
      ctx.save();
      ctx.globalAlpha = k * (last ? 0.98 : 0.55 + 0.25 * allDone);
      ctx.fillStyle = last ? pal.accent : pal.ink;
      ctx.beginPath(); ctx.arc(pt[i].x, pt[i].y, last ? 8 : 5.5, 0, Math.PI * 2); ctx.fill();
      ctx.restore();
      ctx.save();
      ctx.globalAlpha = k * 0.6;
      text(`P${i + 1}`, pt[i].x, pt[i].y - 26, { size: 15, fam: 'mono', color: last ? pal.accent : pal.dim, align: 'center', letterSpacing: 2 });
      ctx.restore();
      if (last && allDone > 0) glowAt(pt[i].x, pt[i].y, 150, pal.accent, 0.14 * allDone);
    }
    ctx.save();
    ctx.globalAlpha = 0.42;
    text('ALL PROCESSES · 8 NODES', M, 148, { size: 19, fam: 'mono', color: pal.dim, letterSpacing: 5 });
    ctx.restore();
    lyric(lineAt(c.t), c.t, pal, { y: H - 150, size: 52 });
    shotTag(c);
    fadeEdges(c);
  };

  // ---------------- 67 gary：6 轴雷达，从 3 边有值长到近 6 边（不求闭合） ----------------
  L.radar6 = function (c) {
    const pal = c.pal;
    darkBase(pal, 0.05);
    const cx = W / 2, cy = H * 0.44, R = 250, AX = 6;
    // 网格：同心六边形 + 轴线
    ctx.save();
    ctx.strokeStyle = pal.line;
    ctx.lineWidth = 1;
    ctx.globalAlpha = 0.55;
    for (let ring = 1; ring <= 3; ring++) {
      const r = (R * ring) / 3;
      ctx.beginPath();
      for (let a = 0; a <= AX; a++) {
        const ang = (a / AX) * Math.PI * 2 - Math.PI / 2;
        const x = cx + Math.cos(ang) * r, y = cy + Math.sin(ang) * r;
        a === 0 ? ctx.moveTo(x, y) : ctx.lineTo(x, y);
      }
      ctx.stroke();
    }
    for (let a = 0; a < AX; a++) {
      const ang = (a / AX) * Math.PI * 2 - Math.PI / 2;
      ctx.beginPath();
      ctx.moveTo(cx, cy);
      ctx.lineTo(cx + Math.cos(ang) * R, cy + Math.sin(ang) * R);
      ctx.stroke();
    }
    ctx.restore();
    // 轴标签
    const labels = ['工艺', '数据', '产线', '质量', '改善', '带人'];
    labels.forEach((s, a) => {
      const ang = (a / AX) * Math.PI * 2 - Math.PI / 2;
      const x = cx + Math.cos(ang) * (R + 40), y = cy + Math.sin(ang) * (R + 40) + 7;
      ctx.save();
      ctx.globalAlpha = 0.62;
      text(s, x, y, { size: 22, fam: 'serif', color: pal.dim, align: 'center', weight: 500 });
      ctx.restore();
    });
    // 值：起始 3 轴有值，243.8 处其余 3 轴补到 70%
    const grow = ease.out(clamp(c.local / 0.8, 0, 1));
    const fill = ease.out(clamp((c.local - 2.2) / 0.3, 0, 1));
    const vals = [0.72, 0.86, 0.6, 0.3 + 0.4 * fill, 0.3 + 0.4 * fill, 0.3 + 0.4 * fill];
    const pts = vals.map((v, a) => {
      const ang = (a / AX) * Math.PI * 2 - Math.PI / 2;
      const r = R * v * grow;
      return { x: cx + Math.cos(ang) * r, y: cy + Math.sin(ang) * r };
    });
    ctx.save();
    ctx.globalAlpha = 0.16;
    ctx.fillStyle = pal.accent;
    ctx.beginPath();
    pts.forEach((p, i) => (i === 0 ? ctx.moveTo(p.x, p.y) : ctx.lineTo(p.x, p.y)));
    ctx.closePath();
    ctx.fill();
    ctx.restore();
    ctx.save();
    ctx.globalAlpha = 0.9;
    ctx.strokeStyle = pal.accent;
    ctx.lineWidth = 2.5;
    ctx.beginPath();
    pts.forEach((p, i) => (i === 0 ? ctx.moveTo(p.x, p.y) : ctx.lineTo(p.x, p.y)));
    if (fill > 0.9) ctx.closePath();
    ctx.stroke();
    ctx.restore();
    // 顶点
    pts.forEach((p) => {
      ctx.save();
      ctx.globalAlpha = 0.85;
      ctx.fillStyle = pal.accent;
      ctx.beginPath(); ctx.arc(p.x, p.y, 3.4, 0, Math.PI * 2); ctx.fill();
      ctx.restore();
    });
    ctx.save();
    ctx.globalAlpha = 0.42;
    text(`AREA ×${(1 + 0.9 * fill).toFixed(1)}`, W - M, 148, { size: 18, fam: 'mono', color: pal.dim, align: 'right', letterSpacing: 3 });
    ctx.restore();
    lyric(lineAt(c.t), c.t, pal, { y: H - 140, size: 50 });
    shotTag(c);
    fadeEdges(c);
  };

  // ---------------- 73 allen：200 点散点，其中 1 点被一条弧线接住 ----------------
  L.scatterArc = function (c) {
    const pal = c.pal;
    darkBase(pal, 0.035);
    const N = 200;
    // 散点
    for (let i = 0; i < N; i++) {
      const x = 90 + hash(i * 3.7) * (W - 180);
      const y = 150 + hash(i * 9.1 + 4) * (H - 420);
      ctx.save();
      ctx.globalAlpha = 0.07 + 0.10 * hash(i * 5.5);
      ctx.fillStyle = pal.dim;
      ctx.beginPath(); ctx.arc(x, y, 1.7, 0, Math.PI * 2); ctx.fill();
      ctx.restore();
    }
    // 被接住的那一点：261.78 起下坠 0.4 s 落到弧线上
    const cx = W * 0.52;
    const arcY = H * 0.62;
    const drop = ease.in(clamp((c.local - 1.5) / 0.4, 0, 1));
    const startY = H * 0.26;
    const py = lerp(startY, arcY - 6, drop);
    const sag = ease.io(clamp((c.local - 2.2) / 0.5, 0, 1));   // 弧线承重下弯 6 px
    // 弧线
    ctx.save();
    ctx.globalAlpha = 0.9;
    ctx.strokeStyle = pal.accent;
    ctx.lineWidth = 2.4;
    ctx.beginPath();
    ctx.moveTo(cx - 380, arcY);
    ctx.quadraticCurveTo(cx, arcY + 120 + 6 * sag, cx + 380, arcY);
    ctx.stroke();
    ctx.restore();
    // 弧线上的支撑刻度
    ctx.save();
    ctx.globalAlpha = 0.35;
    ctx.fillStyle = pal.accent;
    for (let i = -5; i <= 5; i++) {
      const x = cx + i * 68;
      const y = arcY + 120 * (1 - Math.pow((i * 68) / 380, 2)) + 6 * sag * (1 - Math.pow((i * 68) / 380, 2));
      ctx.fillRect(x - 0.5, y, 1.5, 9);
    }
    ctx.restore();
    // 那个点
    ctx.save();
    ctx.globalAlpha = 0.98;
    ctx.fillStyle = pal.ink;
    ctx.beginPath(); ctx.arc(cx, py, 4.6, 0, Math.PI * 2); ctx.fill();
    ctx.restore();
    glowAt(cx, py, 130, pal.accent, 0.16);
    // 数据网格底标
    ctx.save();
    ctx.globalAlpha = 0.42;
    text('DATA POINTS 200', M, 148, { size: 19, fam: 'mono', color: pal.dim, letterSpacing: 5 });
    text('CAUGHT 1', W - M, 148, { size: 19, fam: 'mono', color: pal.accent, align: 'right', letterSpacing: 4 });
    ctx.restore();
    lyric(lineAt(c.t), c.t, pal, { y: H - 150, size: 48 });
    shotTag(c);
    fadeEdges(c);
  };

  // ---------------- 25 you-too：手机扣在木纹桌面上，边缘 1 px 呼吸光，右上角计时 ----------------
  L.phoneDown = function (c) {
    const pal = c.pal;
    // 桌面：有真照片就用照片（P01），没有才用程序木纹
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
    }
    // 手机：0.25 s 翻面扣下（用高度压缩模拟翻面）
    const flip = ease.out(clamp(c.local / 0.25, 0, 1));
    const pw = 336, ph = 556;
    const x = W / 2 - pw / 2, y = 178 + (1 - flip) * 40;
    const h = ph * lerp(0.55, 1, flip);
    ctx.save();
    ctx.translate(0, y + h / 2);
    ctx.scale(1, lerp(1.25, 1, flip));
    ctx.translate(0, -(y + h / 2));
    ctx.fillStyle = '#15161a';
    ctx.fillRect(x, y, pw, h);
    // 背面一块磨砂玻璃
    ctx.fillStyle = 'rgba(255,255,255,0.045)';
    ctx.fillRect(x + 14, y + 14, pw - 28, h - 28);
    // 摄像头两颗
    ctx.fillStyle = 'rgba(255,255,255,0.09)';
    ctx.beginPath(); ctx.arc(x + 62, y + 74, 21, 0, Math.PI * 2); ctx.fill();
    ctx.beginPath(); ctx.arc(x + 112, y + 106, 16, 0, Math.PI * 2); ctx.fill();
    ctx.restore();
    // 边缘 1 px 呼吸光（0.929 s 周期 30%→45%）
    const br = 0.30 + 0.15 * (0.5 + 0.5 * Math.sin((c.local / BEAT) * Math.PI * 2));
    ctx.save();
    ctx.globalAlpha = br;
    ctx.strokeStyle = '#f7f0dc';
    ctx.lineWidth = 1;
    ctx.strokeRect(x + 0.5, y + 0.5, pw, h * lerp(0.55, 1, flip));
    ctx.restore();
    // 右上角计时 00:00 → 00:12
    const secs = clamp(Math.floor((c.local - 1.5) / (BEAT * 1.5)), 0, 12);
    ctx.save();
    ctx.globalAlpha = 0.7;
    text(`00:${String(Math.max(0, secs)).padStart(2, '0')}`, W - M, 148, { size: 40, fam: 'mono', color: '#2b2419', align: 'right', letterSpacing: 3 });
    text('SCREEN DOWN', M, 148, { size: 19, fam: 'mono', color: '#4a4235', letterSpacing: 5 });
    ctx.restore();
    lyric(lineAt(c.t), c.t, { ink: '#2b2419', hot: '#a8402c', accent: '#a8402c', dim: '#6b5f4c' },
      { y: H - 140, size: 54, active: '#a8402c', accent: '#a8402c' });
    shotTag(c);
    fadeEdges(c);
  };

  // ---------------- 31 ledger：一条水平线，线端一枚停住的棋子，线下「别下场」 ----------------
  L.chessLine = function (c) {
    const pal = c.pal;
    darkBase(pal, 0.045); roomDepth(c.pal); bgMega(c);
    const y = 560, x0 = 260, x1 = W - 260;
    // 线
    ctx.save();
    ctx.globalAlpha = 0.6;
    ctx.fillStyle = pal.line;
    ctx.fillRect(x0, y, x1 - x0, 2);
    ctx.restore();
    // 刻度
    ctx.save();
    ctx.globalAlpha = 0.3;
    for (let i = 0; i <= 24; i++) {
      const x = x0 + (x1 - x0) * (i / 24);
      ctx.fillRect(x - 0.5, y - 6, 1, 12);
    }
    ctx.restore();
    // 棋子：0.8 s 推到线端后静止
    const k = ease.out(clamp(c.local / 0.8, 0, 1));
    const px = lerp(x0 + (x1 - x0) * 0.18, x1 - 26, k);
    const py = y - 26;
    ctx.save();
    ctx.fillStyle = pal.ink;
    ctx.globalAlpha = 0.95;
    // 棋子：底座 + 圆头
    ctx.beginPath();
    ctx.ellipse(px, py + 20, 26, 7, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.beginPath();
    ctx.moveTo(px - 17, py + 18);
    ctx.quadraticCurveTo(px - 20, py - 10, px, py - 16);
    ctx.quadraticCurveTo(px + 20, py - 10, px + 17, py + 18);
    ctx.closePath();
    ctx.fill();
    ctx.restore();
    glowAt(px, py, 120, pal.ink, 0.08);
    // 线下「别下场」mono
    const tk = clamp((c.local - 1.9) / 0.5, 0, 1);
    ctx.save();
    ctx.globalAlpha = tk * 0.8;
    text('别 下 场', x1, y + 76, { size: 30, fam: 'mono', color: pal.accent, align: 'right', letterSpacing: 12 });
    ctx.restore();
    // 末 0.4 s 只留那条线：其他元素淡出
    const fadeOut = clamp((c.dur - 0.4 - c.local) / 0.4, 0, 1);
    if (fadeOut < 1) {
      ctx.save();
      ctx.globalAlpha = (1 - fadeOut) * 0.92;
      ctx.fillStyle = pal.bg;
      ctx.fillRect(0, 0, W, H);
      ctx.restore();
      ctx.save();
      ctx.globalAlpha = 0.6;
      ctx.fillStyle = pal.line;
      ctx.fillRect(x0, y, x1 - x0, 2);
      ctx.restore();
    } else {
      lyric(lineAt(c.t), c.t, pal, { y: H - 150, size: 52 });
    }
    shotTag(c);
    fadeEdges(c);
  };

  // ---------------- 76 xiaoma：一条垂直线，线上 1 个光点缓缓下落 ----------------
  L.descentDot = function (c) {
    const pal = c.pal;
    darkBase(pal, 0.035); roomDepth(c.pal); bgMega(c);
    const x = W * 0.5;
    const y0 = 180, y1 = H * 0.6;
    ctx.save();
    ctx.globalAlpha = 0.45;
    ctx.fillStyle = pal.line;
    ctx.fillRect(x - 0.75, y0, 1.5, H * 0.62);
    ctx.restore();
    // 刻度
    ctx.save();
    ctx.globalAlpha = 0.28;
    for (let i = 0; i <= 10; i++) {
      const y = y0 + (H * 0.62) * (i / 10);
      ctx.fillRect(x - 8, y, 16, 1);
    }
    ctx.restore();
    const k = ease.io(clamp(c.local / Math.max(0.4, c.dur * 0.86), 0, 1));
    const y = lerp(y0, y1, k);
    ctx.save();
    ctx.globalAlpha = 0.98;
    ctx.fillStyle = '#f7f0dc';
    ctx.beginPath(); ctx.arc(x, y, 5, 0, Math.PI * 2); ctx.fill();
    ctx.restore();
    glowAt(x, y, 140, '#f7f0dc', 0.14);
    ctx.save();
    ctx.globalAlpha = 0.45;
    text(`${Math.round(k * 60)}%`, x + 26, y + 6, { size: 17, fam: 'mono', color: pal.dim, letterSpacing: 2 });
    ctx.restore();
    lyric(lineAt(c.t), c.t, pal, { y: H - 150, size: 54 });
    shotTag(c);
    fadeEdges(c);
  };

  window.LAYOUTS3_READY = true;
})();
