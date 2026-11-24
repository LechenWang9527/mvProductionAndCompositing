// film/src/layouts.js —— 镜头级版式库
// 分镜表 87 刀，落到 ~28 种可复用版式上；每种都是 t 的纯函数。
// 约定：LAYOUTS[kind](c)，c = { t, sec, pal, shot, u, local, dur }

(function () {
  const K = window.K;
  const { W, H, ctx, PAL, clamp, lerp, inv, ease, rnd, hash, text, setFont, measure,
    karaoke, woodcutText, hatchTile, grainTile, halftone, scanlines, beatInfo, halfPulse,
    lineAt, sectionAt, BEAT } = K;

  const M = 64;              // 版心边距
  const INK = '#111';        // 墨
  const PAPER = '#e3d9c2';   // 宣纸

  // ---------------- 基础部件 ----------------

  function paperBg(col) {
    window.__LIGHT = true;
    const g = ctx.createLinearGradient(0, 0, 0, H);
    g.addColorStop(0, '#e6dcc8');
    g.addColorStop(0.55, col || PAPER);
    g.addColorStop(1, '#c6ba9f');
    ctx.fillStyle = g;
    ctx.fillRect(0, 0, W, H);
  }

  // 木刻山影：三层，排线上墨
  function woodcutHills(t, layers) {
    const arr = layers || [
      { y: 0.52, amp: 70, col: '#8f8570', al: 0.5, sp: 13, ang: 28 },
      { y: 0.60, amp: 54, col: '#6d6350', al: 0.66, sp: 10, ang: 34 },
      { y: 0.70, amp: 40, col: '#4a4235', al: 0.82, sp: 7, ang: 40 },
    ];
    arr.forEach((L, li) => {
      ctx.save();
      ctx.beginPath();
      ctx.moveTo(0, H);
      for (let x = 0; x <= W; x += 12) {
        const yy = L.y * H + Math.sin(x * 0.0032 + li * 2.1) * L.amp + Math.sin(x * 0.011 + li) * L.amp * 0.35;
        ctx.lineTo(x, yy);
      }
      ctx.lineTo(W, H);
      ctx.closePath();
      ctx.save();
      ctx.clip();
      ctx.fillStyle = L.col;
      ctx.globalAlpha = L.al * 0.28;
      ctx.fillRect(0, 0, W, H);
      ctx.globalAlpha = L.al * 0.6;
      ctx.drawImage(hatchTile(L.ang, L.sp, W, H, L.col, 0.55, 3), 0, 0, W, H);
      ctx.restore();
      ctx.restore();
    });
  }

  // 档案卡
  function card(x, y, w, h, pal, o) {
    o = o || {};
    ctx.save();
    ctx.globalAlpha = o.alpha == null ? 1 : o.alpha;
    ctx.fillStyle = o.fill || 'rgba(255,255,255,0.035)';
    ctx.fillRect(x, y, w, h);
    ctx.strokeStyle = o.stroke || pal.line;
    ctx.lineWidth = 1.5;
    ctx.strokeRect(x + 0.5, y + 0.5, w, h);
    if (o.id) {
      ctx.fillStyle = o.idColor || pal.accent;
      ctx.fillRect(x, y, w, 32);
      text(o.id, x + 14, y + 23, { size: 18, fam: 'mono', color: o.idText || pal.bg, letterSpacing: 2 });
    }
    const rows = o.rows || 6;
    const top = y + (o.id ? 32 : 0) + 26;
    const step = (h - (top - y) - 26) / rows;
    ctx.globalAlpha = (o.alpha == null ? 1 : o.alpha) * 0.42;
    ctx.fillStyle = o.line || pal.line;
    for (let i = 0; i < rows; i++) {
      const yy = top + i * step;
      if (yy > y + h - 14) break;
      ctx.fillRect(x + 18, yy, w - 36, 1);
    }
    ctx.restore();
  }

  function field(k, v, x, y, w, pal, size, alpha, o) {
    o = o || {};
    const s = size || 22;
    text(k, x, y, { size: s, fam: 'mono', color: pal.dim, alpha: alpha == null ? 1 : alpha });
    text(v, x + w, y, { size: s, fam: 'mono', color: o.color || pal.ink, align: 'right', alpha: alpha == null ? 1 : alpha });
    const vx = x + w - measure(v, s, 'mono');
    ctx.save();
    ctx.globalAlpha = (alpha == null ? 1 : alpha) * 0.3;
    ctx.fillStyle = pal.dim;
    const a = x + measure(k, s, 'mono') + 12, b = vx - 12;
    for (let i = a; i < b; i += 7) ctx.fillRect(i, y - s * 0.28, 2, 2);
    ctx.restore();
  }

  // 方章
  function seal(str, x, y, size, color, rot, alpha, filled) {
    ctx.save();
    ctx.translate(x, y);
    ctx.rotate(rot || 0);
    ctx.globalAlpha = alpha == null ? 0.9 : alpha;
    const w = measure(str, size, 'sans', 900) + size * 0.6;
    const h = size * 1.45;
    if (filled) {
      ctx.fillStyle = color;
      ctx.fillRect(-w / 2, -h / 2, w, h);
      setFont(size, 'sans', 900);
      ctx.fillStyle = PAPER;
    } else {
      ctx.strokeStyle = color;
      ctx.lineWidth = Math.max(2, size * 0.09);
      ctx.strokeRect(-w / 2, -h / 2, w, h);
      setFont(size, 'sans', 900);
      ctx.fillStyle = color;
    }
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(str, 0, size * 0.04);
    ctx.restore();
    ctx.textBaseline = 'alphabetic';
  }

  // 打字机（光标跟随）
  function typed(str, x, y, n, pal, o) {
    o = o || {};
    const s = o.size || 24;
    const vis = str.slice(0, Math.max(0, Math.floor(n)));
    text(vis, x, y, { size: s, fam: 'mono', color: o.color || pal.ink, alpha: o.alpha == null ? 1 : o.alpha });
    const w = measure(vis, s, 'mono');
    if (n > 0 && (Math.floor(n * 2) % 2 === 0 || n % 1 > 0.1)) {
      ctx.fillStyle = o.cursor || pal.accent;
      ctx.fillRect(x + w + 4, y - s * 0.8, s * 0.46, s * 0.98);
    }
  }

  // ASCII 字符场
  function asciiField(t, pal, o) {
    o = o || {};
    const cw = o.cw || 18, ch = o.ch || 26;
    const cols = Math.ceil(W / cw), rows = Math.ceil(H / ch);
    const glyphs = o.glyphs || '·-=/\\|+*';
    ctx.save();
    ctx.globalAlpha = o.alpha == null ? 0.5 : o.alpha;
    setFont(ch * 0.86, 'mono');
    ctx.fillStyle = o.color || pal.dim;
    for (let r = 0; r < rows; r++) {
      for (let c = 0; c < cols; c++) {
        const ph = c * 0.16 + r * 0.05;
        const v = Math.sin(ph + t * 1.4) * Math.cos(ph * 0.6 - t * 0.9);
        const lvl = Math.abs(v);
        if (lvl < (o.cut == null ? 0.35 : o.cut)) continue;
        ctx.fillText(glyphs[Math.floor(lvl * glyphs.length) % glyphs.length], c * cw, r * ch + (o.amp || 60) * v * 0.15);
      }
    }
    ctx.restore();
  }

  function grid(pal, o) {
    o = o || {};
    const gs = o.grid || 40;
    ctx.save();
    ctx.globalAlpha = o.alpha == null ? 0.16 : o.alpha;
    ctx.strokeStyle = o.color || pal.line;
    ctx.lineWidth = 1;
    for (let x = 0; x < W; x += gs) { ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x, H); ctx.stroke(); }
    for (let y = 0; y < H; y += gs) { ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(W, y); ctx.stroke(); }
    ctx.restore();
  }

  // 所有布局仍可调用此共享入口，但字幕轨由 subtitles.js 在整帧后期完成后统一绘制。
  // 保留函数签名，避免布局调用方和美术参数发生无关改动。
  function lyric() {}

  // 右下角镜头号（只在 ?tags=1 时画：成片里不留剪辑信息，验片时用）
  function shotTag(c) {
    if (!window.__SHOW_SHOT_TAGS) return;
    ctx.save();
    ctx.globalAlpha = 0.35;
    text(`SHOT ${String(c.shot.n).padStart(2, '0')} / 87`, W - M, 148,
      { size: 17, fam: 'mono', color: c.pal.dim, align: 'right', letterSpacing: 2 });
    ctx.restore();
  }

  // 段落共通：黑场进出
  function fadeEdges(c) {
    if (c.fade === false) return;   // 镜头级硬切：黑场由段/镜调度统一加，不在每个 layout 里各来一遍
    const inF = 1 - clamp(c.local / 0.22, 0, 1);
    const outF = clamp((c.local - (c.dur - 0.18)) / 0.18, 0, 1);
    const f = Math.max(inF, outF);
    if (f > 0.01) {
      ctx.save();
      ctx.globalAlpha = f * 0.92;
      ctx.fillStyle = '#000';
      ctx.fillRect(0, 0, W, H);
      ctx.restore();
    }
  }

  // ---------------- 版式实现 ----------------

  const LAYOUTS = {};

  // A2 光标开场：全黑 + 工单头 + 明灭光标
  LAYOUTS.cursorIntro = function (c) {
    ctx.fillStyle = '#07080a';
    ctx.fillRect(0, 0, W, H);
    const bi = beatInfo(c.t);
    ctx.save();
    ctx.globalAlpha = 0.55;
    text('ARCHIVE / KERNEL 1000Y', M, 148, { size: 20, fam: 'mono', color: c.pal.dim, letterSpacing: 4 });
    text(`UPTIME ${Math.floor(c.t).toString().padStart(5, '0')} s`, M, M + 40, { size: 18, fam: 'mono', color: c.pal.dim, letterSpacing: 3 });
    ctx.restore();
    // 中央：滚动的工单号
    const n = Math.floor(c.t / BEAT);
    ctx.save();
    ctx.textAlign = 'center';
    ctx.globalAlpha = 0.9;
    setFont(150, 'mono', 700);
    ctx.fillStyle = c.pal.ink;
    ctx.fillText(String(n * 125).padStart(4, '0'), W / 2, H / 2 + 40);
    // 光标
    ctx.globalAlpha = 1;
    ctx.fillStyle = c.pal.accent;
    const blink = (Math.floor(c.t * 4) % 2 === 0) ? 1 : 0.18;
    ctx.globalAlpha = blink;
    ctx.fillRect(W / 2 + 190, H / 2 - 80, 62, 132);
    ctx.restore();
    // 底部滚动日志
    ctx.save();
    ctx.globalAlpha = 0.42;
    const logs = ['mount /records/people ... OK', 'mount /records/ledger ... OK', 'index THE OGS ... 1 hit', 'locating subject ... RUNNING'];
    for (let i = 0; i < 4; i++) {
      const k = clamp((c.t - i * 0.9) / 0.4, 0, 1);
      if (k <= 0) continue;
      text(logs[i], M, H - 200 + i * 30, { size: 18, fam: 'mono', color: c.pal.dim, alpha: k * 0.9 });
    }
    ctx.restore();
    shotTag(c);
    fadeEdges(c);
  };

  // L39 终端：ASCII 抽屉阵列逐行弹开
  LAYOUTS.asciiDrawers = function (c) {
    ctx.fillStyle = '#05080a';
    ctx.fillRect(0, 0, W, H);
    asciiField(c.t, c.pal, { alpha: 0.10, amp: 30, cut: 0.5, color: '#1f4a3a' });
    // 抽屉：12 行 × 6 列
    const rows = 12, cols = 6;
    const bw = 210, bh = 62, gx = (W - cols * (bw + 24)) / 2, gy = 190;
    const opened = Math.floor((c.local) / BEAT);
    for (let r = 0; r < rows; r++) {
      for (let col = 0; col < cols; col++) {
        const x = gx + col * (bw + 24);
        const y = gy + r * (bh + 14);
        const on = r < opened;
        ctx.save();
        ctx.globalAlpha = 0.9;
        ctx.strokeStyle = on ? c.pal.accent : c.pal.line;
        ctx.lineWidth = 1.6;
        ctx.strokeRect(x, y, bw, bh);
        // 把手
        ctx.fillStyle = on ? c.pal.accent : c.pal.dim;
        ctx.globalAlpha = on ? 0.85 : 0.35;
        ctx.fillRect(x + bw / 2 - 26, y + bh / 2 - 2.5, 52, 5);
        if (on) {
          const idx = r * cols + col;
          ctx.globalAlpha = 0.55;
          text(`#${String(1000 + idx).padStart(4, '0')}`, x + 12, y + bh - 14, { size: 14, fam: 'mono', color: c.pal.accent });
        }
        ctx.restore();
      }
    }
    text('OPENING ARCHIVE DRAWERS', W / 2, 152, { size: 20, fam: 'mono', color: c.pal.dim, align: 'center', letterSpacing: 8 });
    shotTag(c);
    fadeEdges(c);
  };

  // L33 瑞士排版（按分镜逐镜还原动作）：
  //   p.chars   : 'fall'(逐字落下) | 'stamp'(压印) | 'sync'(齐压) | 'type'(逐字显影)
  //   p.stagger : 每字间隔秒（默认 0.232）
  //   p.bg      : 'dark' | 'yellowUp'(自下而上填黄) | 'yellowRamp'(整幅渐入黄) | 照片(P.photo)
  //   p.rampAt / p.rampDur : 背景换色起点/时长
  //   p.ink     : 'auto' | 'accent' | 'bg' | 'ink'
  //   p.vline   : 右侧黄竖线 0→全高
  //   p.horizon : 地平线自中间向两侧 + 12 竖标
  //   p.rise    : 末段整块上移 px
  //   p.photo / p.photoAlpha / p.photoScrim / p.logo / p.sub / p.size / p.en
  let _swLine = null;
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
      } else if (P.chars === 'lyric') {
        // 逐字时间直接取歌词表的 chars[i].t（锚定镜头起始那一句），分镜 #78 用
        if (!_swLine || _swLine.t0 !== c.shot.t) {
          _swLine = { t0: c.shot.t, line: lineAt(c.shot.t + 0.02) };
        }
        const ch = _swLine.line && _swLine.line.chars && _swLine.line.chars[i];
        const at = ch ? ch.t : c.shot.t + i * stagger;
        a = ease.out(clamp((c.t - at) / 0.2, 0, 1));
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

    // 角标照片（马牌）：不要一张硬边亮矩形贴在画面上 —— 做成「档案插图窗」
    if (P.logo && window.PHOTO && window.PHOTO.has(P.logo)) {
      const lk = ease.out(clamp((c.local - 0.6) / 0.5, 0, 1));
      const bx = 100, by2 = 196, bw = 306, bh = 172;
      ctx.save();
      // 半透：让它沉进背景的网纹里
      ctx.globalAlpha = 0.52 * lk;
      window.PHOTO.plate(P.logo, bx, by2, bw, bh, { tone: 'dark', label: false });
      ctx.restore();
      ctx.save();
      ctx.globalAlpha = 0.85 * lk;
      // 细黄框 + 上下小标题，像档案系统里的插图窗口
      ctx.strokeStyle = pal.accent;
      ctx.lineWidth = 1.5;
      ctx.strokeRect(bx + 0.5, by2 + 0.5, bw, bh);
      ctx.globalAlpha = 0.7 * lk;
      ctx.fillStyle = pal.accent;
      ctx.fillRect(bx, by2 - 22, bw, 1);
      text('GLOBAL SIGN', bx, by2 - 30, { size: 15, fam: 'mono', color: pal.accent, letterSpacing: 4 });
      text('DWG 04', bx + bw, by2 - 30, { size: 15, fam: 'mono', color: pal.dim, align: 'right', letterSpacing: 3 });
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

    // 底部歌词：大字已经把这句唱出来时不重复；黄底上未唱字要更实
    const _ln = lineAt(c.t);
    const _dupe = _ln && (_ln.text.indexOf(str) >= 0 || str.indexOf(_ln.text) >= 0);
    if (!_dupe) {
      lyric(_ln, c.t, pal, {
        y: H - 210, size: 58,
        color: bgIsYellow ? pal.bg : pal.dim,
        active: bgIsYellow ? pal.bg : pal.ink,
        unsung: bgIsYellow ? 0.5 : 0.34,
      });
    }
    shotTag(c);
    fadeEdges(c);
  };
  // L29 半调案卷：三张卡叠放 + 方章砸下
  LAYOUTS.halftoneFiles = function (c) {
    ctx.fillStyle = '#0a0a0b';
    ctx.fillRect(0, 0, W, H);
    ctx.save();
    ctx.globalAlpha = 0.28;
    ctx.drawImage(halftone(W, H, 9, 2.6, '#1e1c17', 7), 0, 0, W, H);
    ctx.restore();
    const cards = [
      { x: 200, y: 320, w: 620, h: 400, id: 'FILE 0001', who: '杜甫', age: '47', mood: '想哭', seal: '无房' },
      { x: 680, y: 250, w: 620, h: 400, id: 'FILE 0002', who: '刘邦', age: '47', mood: '在等', seal: '未发' },
      { x: 1160, y: 330, w: 620, h: 400, id: 'FILE 0003', who: '你', age: '??', mood: '同款', seal: '在跑' },
    ];
    cards.forEach((cd, i) => {
      const t0 = i * 1.75;
      const e = ease.out(clamp((c.local - t0) / 0.55, 0, 1));
      if (e <= 0) return;
      const dy = (1 - e) * 90;
      ctx.save();
      ctx.globalAlpha = e * 0.96;
      card(cd.x, cd.y + dy, cd.w, cd.h, c.pal, { id: cd.id, rows: 5, fill: 'rgba(24,22,18,0.92)', stroke: '#4a453a', idColor: '#c8a24a' });
      field('WHO', cd.who, cd.x + 26, cd.y + dy + 110, cd.w - 52, c.pal, 30, e);
      field('AGE', cd.age, cd.x + 26, cd.y + dy + 164, cd.w - 52, c.pal, 26, e);
      field('MOOD', cd.mood, cd.x + 26, cd.y + dy + 212, cd.w - 52, c.pal, 26, e);
      field('HOUSE', '0', cd.x + 26, cd.y + dy + 260, cd.w - 52, c.pal, 26, e);
      ctx.restore();
      // 章：延后 0.93 s
      const se = clamp((c.local - t0 - 0.93) / 0.14, 0, 1);
      if (se > 0) {
        const sc = 1.15 - 0.15 * se;
        ctx.save();
        ctx.translate(cd.x + cd.w - 130, cd.y + dy + cd.h - 110);
        ctx.scale(sc, sc);
        seal(cd.seal, 0, 0, 44, '#a8402c', -0.14, se * 0.95);
        ctx.restore();
      }
    });
    shotTag(c);
    fadeEdges(c);
  };

  // M7 极简：一格灯在 64 格里移动
  LAYOUTS.gridLamp = function (c) {
    ctx.fillStyle = '#050506';
    ctx.fillRect(0, 0, W, H);
    const cols = 8, rows = 8;
    const gw = W / cols, gh = H / rows;
    const step = Math.floor(c.local / BEAT);
    const cx = 1 + (step % 6), cy = 4;
    ctx.save();
    for (let r = 0; r < rows; r++) {
      for (let col = 0; col < cols; col++) {
        const on = r === cy && col === cx;
        ctx.globalAlpha = on ? 1 : 0.055;
        ctx.fillStyle = on ? '#f7f0dc' : c.pal.dim;
        ctx.fillRect(col * gw + 6, r * gh + 6, gw - 12, gh - 12);
      }
    }
    ctx.restore();
    // 拖尾细线
    ctx.save();
    ctx.globalAlpha = 0.5;
    ctx.fillStyle = '#f7f0dc';
    for (let i = 1; i <= 3; i++) {
      const px = (cx - i) * gw + gw / 2;
      if (px < 0) continue;
      ctx.globalAlpha = 0.5 / i;
      ctx.beginPath();
      ctx.arc(px, cy * gh + gh / 2, 2.2, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.restore();
    lyric(lineAt(c.t), c.t, c.pal, { y: H - 120, size: 54, color: c.pal.dim, active: '#f7f0dc' });
    shotTag(c);
    fadeEdges(c);
  };

  // L30 木刻：搬迁单 / 纸箱
  // 旧版用 '#f2ead6'（近白）3 px 细线在纸底上描箱 —— 白线画在白纸上，等于没画：
  // 30.00–33.10 s 的「古代纸面」段中央只剩一道看不见的细框，像漏渲染。
  // 木刻的真实逻辑相反：深墨块是「留墨」，纸白是「刻掉」的部分。所以重写为：
  //   1) 三面不同灰度的实心墨块（正面压死墨 / 顶面受光 / 右侧窄条居中）立起体积；
  //   2) 纸色在墨块上刻线：箱盖缝、胶带撕边、侧面木纹、底部加固条、运输标记；
  //   3) 胶带十字改为纸色半透明压在墨块上（不再画在纸底上，否则同样看不见）；
  //   4) 出图节奏由「轮廓逐段生长」改为「填充遮罩自上而下刷出」：刀走一遍，箱体显一块。
  LAYOUTS.woodcutCrate = function (c) {
    paperBg();
    woodcutHills(c.t);

    // ---- 几何：正面矩形 + 顶面向后偏 (dx,dy) 的梯形 + 右侧窄条 ----
    const bx = 720, by = 470, bw = 520, bh = 300;
    const dx = 44, dy = 40;                 // 透视进深：向后 44 px、向上 40 px
    const br = bx + bw, bb = by + bh;       // 正面右下 1240 / 770
    const tt = by - dy;                     // 顶面后沿 430

    const INK_F = '#17130f';                // 正面：最重的墨
    const INK_T = '#3a3226';                // 顶面：受光，浅一档
    const INK_S = '#241d16';                // 右侧面：介于两者之间
    const CUT = '#e6dcc8';                  // 「刻掉」后露出的纸白

    // 刷出进度：分镜节奏是 0.929 s 刻完一张面。旧写法 ease.out(local/2.2) 在 local=1.5
    // 已到 97%，31.5 s 那帧会直接读成「全出」，与「31.5 帧只刷出一半」的验收冲突，
    // 因此刀路改成匀速：2.5 s 走完整个箱体（31.5 s 约 60%，32.5 s 已满）。
    const k = clamp(c.local / 2.5, 0, 1);
    // 细部（胶带 / 运输标记 / 木纹）晚一拍上版，用缓出收尾，正好和刀路同时齐平
    const kd = ease.out(clamp((c.local - 1.1) / 1.35, 0, 1));

    const front = new Path2D();
    front.rect(bx, by, bw, bh);
    const top = new Path2D();
    top.moveTo(bx, by); top.lineTo(bx + dx, tt); top.lineTo(br + dx, tt); top.lineTo(br, by); top.closePath();
    const side = new Path2D();
    side.moveTo(br, by); side.lineTo(br + dx, tt); side.lineTo(br + dx, tt + bh); side.lineTo(br, bb); side.closePath();
    const box = new Path2D();
    box.addPath(front); box.addPath(top); box.addPath(side);

    ctx.save();
    // ---- 填充遮罩：自上而下刷出，未刻到的部分一律不落墨 ----
    ctx.beginPath();
    ctx.rect(0, tt - 24, W, (bb - tt + 48) * k);
    ctx.clip();

    // 刀口留白：墨块外一圈纸色，让箱体从山影排线里跳出来（否则箱底和第三层山一样黑）
    ctx.save();
    ctx.lineJoin = 'round';
    ctx.strokeStyle = CUT;
    ctx.lineWidth = 16;
    ctx.globalAlpha = 0.92;
    ctx.stroke(box);
    ctx.restore();

    // ---- 三面实块：灰度差做体积 ----
    ctx.save();
    ctx.fillStyle = INK_F; ctx.fill(front);
    ctx.fillStyle = INK_T; ctx.fill(top);
    ctx.fillStyle = INK_S; ctx.fill(side);
    ctx.restore();

    // 版面木纹：纸色极淡排线压在三面上，读作刀走出来的平行痕
    ctx.save();
    ctx.clip(box);
    ctx.globalAlpha = 0.10;
    ctx.drawImage(hatchTile(84, 7, W, H, CUT, 1, 2), 0, 0, W, H);
    ctx.restore();

    // ---- 纸色刻线 ----
    ctx.save();
    ctx.strokeStyle = CUT;
    ctx.lineCap = 'butt';

    // 1) 箱盖缝：正面顶边下 36 px 一道横缝；顶面沿中线一道折缝
    ctx.globalAlpha = 0.92;
    ctx.lineWidth = 5;
    ctx.beginPath(); ctx.moveTo(bx + 8, by + 36); ctx.lineTo(br - 8, by + 36); ctx.stroke();
    ctx.globalAlpha = 0.66;
    ctx.lineWidth = 4;
    ctx.beginPath(); ctx.moveTo(bx + dx / 2, by - dy / 2); ctx.lineTo(br + dx / 2, by - dy / 2); ctx.stroke();

    // 2) 右侧面木纹：贴透视方向立三刀
    ctx.globalAlpha = 0.5;
    ctx.lineWidth = 3;
    [0.3, 0.55, 0.8].forEach((t) => {
      const gx = br + dx * t;
      ctx.beginPath(); ctx.moveTo(gx, by - dy * t); ctx.lineTo(gx, bb - dy * t); ctx.stroke();
    });

    // 3) 底部加固条：两道横线 + 一条淡带
    ctx.globalAlpha = 0.85;
    ctx.lineWidth = 4;
    ctx.beginPath();
    ctx.moveTo(bx + 10, bb - 62); ctx.lineTo(br - 10, bb - 62);
    ctx.moveTo(bx + 10, bb - 50); ctx.lineTo(br - 10, bb - 50);
    ctx.stroke();
    ctx.globalAlpha = 0.14;
    ctx.fillStyle = CUT;
    ctx.fillRect(bx + 10, bb - 62, bw - 20, 12);

    // 4) 运输标记：外框 + 向上箭头三角 + 一条横线（箱面朝向标记）
    ctx.globalAlpha = 0.9 * kd;
    ctx.lineWidth = 3;
    ctx.strokeRect(1074.5, 596.5, 107, 99);
    ctx.fillStyle = CUT;
    ctx.beginPath();
    ctx.moveTo(1128, 614); ctx.lineTo(1152, 654); ctx.lineTo(1104, 654); ctx.closePath();
    ctx.fill();
    ctx.fillRect(1104, 662, 48, 8);

    // 5) 封箱胶带：纸色半透明十字压在墨块上，两侧刻出撕边线
    ctx.globalAlpha = 0.20 * kd;
    ctx.fillStyle = CUT;
    ctx.fillRect(944, by, 72, bh);
    ctx.fillRect(bx, 542, bw, 36);
    ctx.globalAlpha = 0.8 * kd;
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.moveTo(944, by + 2); ctx.lineTo(944, bb - 2);
    ctx.moveTo(1016, by + 2); ctx.lineTo(1016, bb - 2);
    ctx.moveTo(bx + 2, 542); ctx.lineTo(br - 2, 542);
    ctx.moveTo(bx + 2, 578); ctx.lineTo(br - 2, 578);
    ctx.stroke();

    // 收边：轮廓一圈纸色，让刻痕与山影分开
    ctx.globalAlpha = 0.4;
    ctx.lineWidth = 2;
    ctx.stroke(box);
    ctx.restore();

    ctx.restore();   // 结束刷出遮罩

    // 左侧竖排编号（保持不动）
    ctx.save();
    ctx.globalAlpha = 0.85;
    const label = '搬迁单 No.0001';
    setFont(34, 'mono', 500);
    ctx.fillStyle = '#2b2419';
    for (let i = 0; i < label.length; i++) ctx.fillText(label[i], 190, 300 + i * 40);
    ctx.restore();
    // 木刻大字：搬家（保持不动）
    ctx.save();
    woodcutText('搬家', W - 150, 300, 150, [
      { angle: 12, spacing: 5, color: 'rgba(227,217,194,0.5)', alpha: 1 },
      { angle: 100, spacing: 9, color: 'rgba(227,217,194,0.28)', alpha: 1 },
    ], { fam: 'serif', align: 'right', baseColor: '#17130f', alpha: 0.92 });
    ctx.restore();
    lyric(lineAt(c.t), c.t, PAL.ancient, { y: H - 150, size: 62, active: '#a8402c', accent: '#a8402c' });
    shotTag(c);
    fadeEdges(c);
  };

  // L30 木刻：长安坊格 + 朱点跳格
  LAYOUTS.changanGrid = function (c) {
    paperBg('#dcd2ba');
    const n = 12, gs = 54, ox = W / 2 - n * gs / 2, oy = 260;
    ctx.save();
    ctx.strokeStyle = 'rgba(43,36,25,0.55)';
    ctx.lineWidth = 1.4;
    for (let i = 0; i <= n; i++) {
      const d = clamp((c.local * 12) - i, 0, 1);
      if (d <= 0) continue;
      ctx.globalAlpha = d;
      ctx.beginPath(); ctx.moveTo(ox + i * gs, oy); ctx.lineTo(ox + i * gs, oy + n * gs); ctx.stroke();
      ctx.beginPath(); ctx.moveTo(ox, oy + i * gs); ctx.lineTo(ox + n * gs, oy + i * gs); ctx.stroke();
    }
    ctx.restore();
    // 住处：朱点跳格
    const frames = [[3, 4], [6, 7], [8, 3], [5, 9]];
    const fi = Math.min(frames.length - 1, Math.floor(c.local / 1.05));
    frames.forEach((f, i) => {
      const isOld = i < fi;
      const x = ox + f[0] * gs + gs / 2, y = oy + f[1] * gs + gs / 2;
      ctx.save();
      if (isOld) {
        ctx.globalAlpha = 0.35;
        ctx.strokeStyle = '#a8402c';
        ctx.lineWidth = 2;
        ctx.strokeRect(ox + f[0] * gs + 4, oy + f[1] * gs + 4, gs - 8, gs - 8);
      } else {
        const e = clamp((c.local - fi * 1.05) / 0.2, 0, 1);
        ctx.globalAlpha = e;
        ctx.fillStyle = '#a8402c';
        ctx.beginPath();
        ctx.arc(x, y, gs * 0.24 * (0.6 + 0.4 * e), 0, Math.PI * 2);
        ctx.fill();
      }
      ctx.restore();
    });
    // 租金上涨：刻字
    const rk = clamp((c.local - 3.0) / 0.8, 0, 1);
    if (rk > 0) {
      ctx.save();
      ctx.globalAlpha = rk;
      woodcutText('涨价', 300, 250, 120, [
        { angle: 20, spacing: 6, color: 'rgba(227,217,194,0.5)', alpha: 1 },
      ], { fam: 'serif', baseColor: '#a8402c' });
      ctx.restore();
    }
    text('长安 · 坊格图', ox, oy - 26, { size: 22, fam: 'serif', color: '#4a4235', letterSpacing: 6 });
    lyric(lineAt(c.t), c.t, PAL.ancient, { y: H - 140, size: 60, active: '#a8402c', accent: '#a8402c' });
    shotTag(c);
    fadeEdges(c);
  };

  // L30 木刻：茅屋剖面 + 裂缝
  LAYOUTS.thatchProfile = function (c) {
    paperBg();
    grid({ line: '#a99a80' }, { grid: 44, alpha: 0.2 });
    const bx = 560, by = 660, bw = 620, bh = 260;
    const k = ease.out(clamp(c.local / 1.4, 0, 1));
    ctx.save();
    ctx.strokeStyle = '#2b2419';
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.moveTo(bx, by);
    ctx.lineTo(bx, by - bh * k);
    ctx.moveTo(bx + bw, by);
    ctx.lineTo(bx + bw, by - bh * k);
    ctx.stroke();
    if (k > 0.5) {
      const kk = ease.out(clamp((c.local - 0.7) / 1.2, 0, 1));
      ctx.beginPath();
      ctx.moveTo(bx - 70, by - bh + 20);
      ctx.lineTo(bx + bw / 2, by - bh - 150 * kk);
      ctx.lineTo(bx + bw + 70, by - bh + 20);
      ctx.stroke();
      // 茅草
      ctx.lineWidth = 1.5;
      ctx.globalAlpha = 0.6 * kk;
      for (let i = 0; i < 34; i++) {
        const p = i / 34;
        const rx = bx - 60 + p * (bw + 120);
        const ry = by - bh + 20 - (1 - Math.abs(p - 0.5) * 2) * 150 * kk;
        ctx.beginPath(); ctx.moveTo(rx, ry); ctx.lineTo(rx + 12, ry + 26); ctx.stroke();
      }
    }
    ctx.restore();
    // 裂缝
    const ck = clamp((c.local - 3.2) / 0.9, 0, 1);
    if (ck > 0) {
      ctx.save();
      ctx.strokeStyle = '#a8402c';
      ctx.lineWidth = 4 * ck;
      ctx.beginPath();
      ctx.moveTo(bx + bw * 0.55, by - bh - 120);
      ctx.lineTo(bx + bw * 0.55 - 10, by - bh - 60);
      ctx.lineTo(bx + bw * 0.55 + 14, by - bh - 10);
      ctx.lineTo(bx + bw * 0.55 - 6, by - bh + 60);
      ctx.stroke();
      ctx.restore();
    }
    text('FIG.2 — 茅屋 · 剖面', bx - 70, by + 58, { size: 20, fam: 'mono', color: '#6b5f4c', letterSpacing: 2 });
    text('AREA 9.8 m²   LEAKS 3   OWNER: DU FU', bx - 70, by + 90, { size: 18, fam: 'mono', color: '#6b5f4c' });
    lyric(lineAt(c.t), c.t, PAL.ancient, { y: H - 120, size: 58, active: '#a8402c', accent: '#a8402c' });
    shotTag(c);
    fadeEdges(c);
  };

  // L36 蓝图：广厦剖面（paper=true 时改宣纸底墨线，用于老曹/高小凡段）
  LAYOUTS.blueprintHall = function (c) {
    const onPaper = !!c.p.paper;
    if (onPaper) {
      paperBg('#ded4bc');
      ctx.save();
      ctx.globalAlpha = 0.22;
      ctx.drawImage(hatchTile(0, 46, W, H, '#2b2419', 0.5, 2), 0, 0, W, H);
      ctx.restore();
    } else {
      const g = ctx.createLinearGradient(0, 0, 0, H);
      g.addColorStop(0, '#101a24');
      g.addColorStop(1, '#0a1016');
      ctx.fillStyle = g;
      ctx.fillRect(0, 0, W, H);
    }
    const line = onPaper ? 'rgba(43,36,25,0.88)' : '#9fc4dd';
    const faint = onPaper ? 'rgba(43,36,25,0.24)' : 'rgba(159,196,221,0.24)';
    const acc = onPaper ? '#a8402c' : '#ffcc00';
    const dim = onPaper ? 'rgba(107,95,76,0.88)' : 'rgba(159,196,221,0.80)';
    const ink2 = onPaper ? '#17130f' : '#e8f2fa';
    const k = ease.out(clamp(c.local / 1.0, 0, 1));

    grid({ line: faint }, { grid: onPaper ? 46 : 32, alpha: 0.5 });

    // ---------- 版面常量（唯一真源） ----------
    const FX = 150, FY = 130, FW = W - 300, FH = H - 340;
    const FBot = FY + FH, FRight = FX + FW;
    const cols = 6, span = 155, x0 = 250, y0 = 680, hgt = 290;
    const beamY = y0 - hgt, peak = beamY - 70;
    const xR = x0 + cols * span;                       // 1180
    const tbW = 460, tbH = 170, tbx = FRight - tbW, tby = FBot - tbH;

    // ---------- 图框 + 边刻度 ----------
    ctx.save();
    ctx.strokeStyle = line;
    ctx.globalAlpha = 0.62 * k;
    ctx.lineWidth = 2;
    ctx.strokeRect(FX, FY, FW, FH);
    ctx.lineWidth = 1;
    ctx.globalAlpha = 0.40 * k;
    for (let x = FX, i = 0; x <= FRight; x += 46, i++) {
      const long = i % 5 === 0;
      ctx.beginPath();
      ctx.moveTo(x, FY); ctx.lineTo(x, FY + (long ? 13 : 6));
      ctx.moveTo(x, FBot); ctx.lineTo(x, FBot - (long ? 13 : 6));
      ctx.stroke();
    }
    for (let y = FY, i = 0; y <= FBot; y += 46, i++) {
      const long = i % 5 === 0;
      ctx.beginPath();
      ctx.moveTo(FX, y); ctx.lineTo(FX + (long ? 13 : 6), y);
      ctx.moveTo(FRight, y); ctx.lineTo(FRight - (long ? 13 : 6), y);
      ctx.stroke();
    }
    ctx.restore();

    // ---------- 地坪剖面 + 楼板 ----------
    ctx.save();
    ctx.globalAlpha = 0.45 * k;
    ctx.fillStyle = ctx.createPattern(hatchTile(45, 9, 160, 40, onPaper ? '#2b2419' : '#9fc4dd', 0.55, 2), 'repeat');
    ctx.fillRect(130, y0 + 12, xR + 60 - 130, 30);
    ctx.globalAlpha = 0.30 * k;
    ctx.fillRect(130, y0 - 13, xR + 60 - 130, 13);
    ctx.restore();

    // ---------- 柱阵 ----------
    ctx.save();
    ctx.strokeStyle = line;
    for (let i = 0; i <= cols; i++) {
      const ck = clamp(c.local * 1.9 - i * 0.30, 0, 1);
      if (ck <= 0) continue;
      const px = x0 + i * span;
      const py = y0 - hgt * ck;

      // 轴线
      ctx.save();
      ctx.globalAlpha = 0.26 * k;
      ctx.setLineDash([4, 6]); ctx.lineWidth = 1;
      ctx.beginPath(); ctx.moveTo(px, FY + 34); ctx.lineTo(px, y0 + 46); ctx.stroke();
      ctx.setLineDash([]);
      ctx.restore();

      // 柱身双线 + 斜剖面
      ctx.globalAlpha = ck;
      ctx.lineWidth = onPaper ? 2.2 : 1.9;
      ctx.beginPath();
      ctx.moveTo(px - 8, y0); ctx.lineTo(px - 8, py);
      ctx.moveTo(px + 8, y0); ctx.lineTo(px + 8, py);
      ctx.stroke();
      ctx.globalAlpha = ck * 0.42;
      ctx.lineWidth = 1;
      for (let d = 0; d < (y0 - py); d += 12) {
        ctx.beginPath();
        ctx.moveTo(px - 8, y0 - d);
        ctx.lineTo(px + 8, y0 - d - 11);
        ctx.stroke();
      }
      // 柱础
      ctx.globalAlpha = ck;
      ctx.lineWidth = onPaper ? 2.2 : 1.9;
      ctx.beginPath();
      ctx.moveTo(px - 24, y0); ctx.lineTo(px + 24, y0);
      ctx.moveTo(px - 24, y0); ctx.lineTo(px - 24, y0 + 9);
      ctx.moveTo(px + 24, y0); ctx.lineTo(px + 24, y0 + 9);
      ctx.stroke();
      // 轴号圈
      ctx.globalAlpha = ck * 0.85;
      ctx.lineWidth = 1.5;
      ctx.beginPath(); ctx.arc(px, FY + 22, 14, 0, Math.PI * 2); ctx.stroke();
      text(String.fromCharCode(65 + i), px, FY + 27.5, { size: 14, fam: 'mono', color: dim, align: 'center' });
    }
    ctx.restore();

    // ---------- 屋架：双坡上弦 + 下弦 + 腹杆 ----------
    if (c.local > 1.5) {
      const lk = ease.out(clamp((c.local - 1.5) / 0.8, 0, 1));
      const midx = x0 + cols * span / 2;
      const apexAt = (i) => beamY - 70 * (1 - Math.abs(i - cols / 2) / (cols / 2));
      ctx.save();
      ctx.strokeStyle = line;
      ctx.globalAlpha = lk;
      ctx.lineWidth = onPaper ? 2.4 : 2.0;
      ctx.beginPath();
      ctx.moveTo(x0 - 60, beamY);
      ctx.lineTo(midx, peak);
      ctx.lineTo(xR + 60, beamY);
      ctx.stroke();
      ctx.lineWidth = 1.7;
      ctx.beginPath();
      ctx.moveTo(x0 - 60, beamY + 16); ctx.lineTo(xR + 60, beamY + 16);
      ctx.stroke();
      ctx.globalAlpha = lk * 0.75;
      ctx.lineWidth = 1;
      for (let i = 0; i <= cols; i++) {
        const px = x0 + i * span;
        ctx.beginPath(); ctx.moveTo(px, beamY + 16); ctx.lineTo(px, apexAt(i)); ctx.stroke();
        if (i < cols) {
          ctx.beginPath();
          ctx.moveTo(px, beamY + 16);
          ctx.lineTo(x0 + (i + 1) * span, apexAt(i + 1));
          ctx.stroke();
        }
      }
      ctx.globalAlpha = lk * 0.6;
      ctx.beginPath(); ctx.moveTo(midx, peak); ctx.lineTo(midx, peak - 24); ctx.stroke();
      ctx.restore();
    }

    // ---------- 尺寸链（开间 / 柱径，横向；都在图框内） ----------
    ctx.save();
    ctx.strokeStyle = line;
    ctx.globalAlpha = 0.62 * k;
    ctx.lineWidth = 1;
    const dChains = [
      { y: y0 + 62, from: x0 - 24, to: xR + 24 },
      { y: y0 + 92, from: x0, to: x0 + span },
      { y: y0 + 116, from: x0 - 8, to: x0 + 8 },
    ];
    dChains.forEach((r) => {
      ctx.beginPath();
      ctx.moveTo(r.from, r.y); ctx.lineTo(r.to, r.y);
      ctx.moveTo(r.from, r.y - 5); ctx.lineTo(r.from, r.y + 5);
      ctx.moveTo(r.to, r.y - 5); ctx.lineTo(r.to, r.y + 5);
      ctx.stroke();
    });
    // 右侧总高尺寸
    ctx.setLineDash([6, 6]);
    ctx.beginPath(); ctx.moveTo(1235, y0); ctx.lineTo(1235, peak); ctx.stroke();
    ctx.setLineDash([]);
    ctx.beginPath();
    ctx.moveTo(1225, y0); ctx.lineTo(1245, y0);
    ctx.moveTo(1225, peak); ctx.lineTo(1245, peak);
    ctx.stroke();
    ctx.restore();

    text(`${cols} 间 · ${span} 尺/间 · 总长 ${cols * span} 尺`, x0 - 24, y0 + 44,
      { size: 16, fam: 'mono', color: dim, letterSpacing: 2 });
    ctx.save();
    ctx.translate(1222, (y0 + peak) / 2);
    ctx.rotate(-Math.PI / 2);
    text(`${hgt + 70} 尺`, 0, 0, { size: 15, fam: 'mono', color: dim, align: 'center', letterSpacing: 2 });
    ctx.restore();

    // ---------- 引注 ----------
    const notes = [
      { ax: x0 + span * 4.6, ay: peak + 30, tx: x0 + span * 4.6 + 96, ty: peak + 74, s: '木构 榫卯' },
      { ax: x0 + span * 1.2, ay: y0 - 150, tx: x0 + span * 1.2 - 128, ty: y0 - 206, s: '杉木 立柱', left: true },
      { ax: x0 + span * 4.9, ay: y0 + 22, tx: x0 + span * 4.9 + 88, ty: y0 + 62, s: '夯土 地坪' },
    ];
    ctx.save();
    ctx.globalAlpha = 0.5 * k;
    ctx.strokeStyle = line;
    ctx.lineWidth = 1;
    notes.forEach((n) => {
      const dir = n.left ? 1 : -1;
      ctx.beginPath();
      ctx.moveTo(n.ax, n.ay);
      ctx.lineTo(n.tx + dir * 12, n.ty + 4);
      ctx.lineTo(n.tx, n.ty + 4);
      ctx.stroke();
      text(n.s, n.tx + (n.left ? -6 : 6), n.ty + 9,
        { size: 14, fam: 'mono', color: dim, letterSpacing: 2, align: n.left ? 'right' : 'left' });
    });
    ctx.restore();

    // ---------- 右上：平面小样（放在照片窗下方，与轴号圈无交集） ----------
    ctx.save();
    const plx = tbx, ply = 396, plw = 240, plh = 116;
    ctx.strokeStyle = line;
    ctx.globalAlpha = 0.42 * k;
    ctx.lineWidth = 1.1;
    ctx.strokeRect(plx, ply, plw, plh);
    ctx.globalAlpha = 0.28 * k;
    for (let i = 1; i < 6; i++) {
      const gx2 = plx + (plw / 6) * i;
      ctx.beginPath(); ctx.moveTo(gx2, ply); ctx.lineTo(gx2, ply + plh); ctx.stroke();
    }
    for (let i = 1; i < 3; i++) {
      const gy2 = ply + (plh / 3) * i;
      ctx.beginPath(); ctx.moveTo(plx, gy2); ctx.lineTo(plx + plw, gy2); ctx.stroke();
    }
    // 平面里的柱点
    ctx.globalAlpha = 0.6 * k;
    for (let i = 0; i <= 6; i++) {
      for (let j = 0; j <= 3; j += 3) {
        ctx.beginPath();
        ctx.arc(plx + (plw / 6) * i, ply + (plh / 3) * j, 2.4, 0, Math.PI * 2);
        ctx.fillStyle = line;
        ctx.fill();
      }
    }
    ctx.restore();
    text('PLAN · 平面 1:400', plx, ply - 10, { size: 14, fam: 'mono', color: dim, letterSpacing: 3 });

    // ---------- 左下：比例尺 ----------
    const sx = 190, sy = 826;
    ctx.save();
    ctx.globalAlpha = 0.5 * k;
    ctx.strokeStyle = line;
    ctx.lineWidth = 1;
    for (let i = 0; i < 5; i++) {
      if (i % 2 === 0) {
        ctx.fillStyle = onPaper ? '#2b2419' : '#9fc4dd';
        ctx.fillRect(sx + i * 36, sy, 36, 9);
      }
      ctx.strokeRect(sx + i * 36, sy, 36, 9);
    }
    ctx.restore();
    text('0', sx, sy + 24, { size: 12, fam: 'mono', color: dim, align: 'center' });
    text('200 尺', sx + 180, sy + 24, { size: 12, fam: 'mono', color: dim, align: 'center' });
    text('SCALE 1:200', sx + 90, sy - 12, { size: 13, fam: 'mono', color: dim, align: 'center', letterSpacing: 3 });

    // ---------- 指北针 ----------
    const nx = 1250, ny = 800;
    ctx.save();
    ctx.globalAlpha = 0.5 * k;
    ctx.strokeStyle = line;
    ctx.lineWidth = 1.3;
    ctx.beginPath();
    ctx.moveTo(nx, ny - 24); ctx.lineTo(nx + 12, ny + 16);
    ctx.lineTo(nx, ny + 7); ctx.lineTo(nx - 12, ny + 16);
    ctx.closePath();
    ctx.stroke();
    ctx.restore();
    text('N', nx, ny - 32, { size: 14, fam: 'mono', color: dim, align: 'center' });

    // ---------- 标题栏 ----------
    ctx.save();
    ctx.strokeStyle = line;
    ctx.globalAlpha = 0.8 * k;
    ctx.lineWidth = 1.6;
    ctx.strokeRect(tbx, tby, tbW, tbH);
    ctx.globalAlpha = 0.55 * k;
    ctx.lineWidth = 1;
    [44, 86, 128].forEach((dy) => {
      ctx.beginPath(); ctx.moveTo(tbx, tby + dy); ctx.lineTo(tbx + tbW, tby + dy); ctx.stroke();
    });
    ctx.beginPath(); ctx.moveTo(tbx + 150, tby + 86); ctx.lineTo(tbx + 150, tby + tbH); ctx.stroke();
    ctx.restore();

    text(c.p.sheet || 'DRAWING 0009', tbx + 14, tby + 29, { size: 16, fam: 'mono', color: ink2, letterSpacing: 2 });
    text('SECTION A-A', tbx + tbW - 14, tby + 29, { size: 14, fam: 'mono', color: dim, align: 'right', letterSpacing: 3 });
    text('DUFU · 唐', tbx + 14, tby + 71, { size: 15, fam: 'mono', color: dim, letterSpacing: 2 });
    text('1:200', tbx + tbW - 14, tby + 71, { size: 15, fam: 'mono', color: dim, align: 'right', letterSpacing: 2 });
    text('图号', tbx + 14, tby + 112, { size: 12, fam: 'mono', color: dim, letterSpacing: 3 });
    text('REV 03', tbx + 20, tby + 154, { size: 14, fam: 'mono', color: acc, letterSpacing: 2 });
    text('2026-11', tbx + 174, tby + 154, { size: 14, fam: 'mono', color: dim, letterSpacing: 2 });
    text('陈 工', tbx + tbW - 14, tby + 154, { size: 14, fam: 'mono', color: dim, align: 'right', letterSpacing: 2 });

    // ---------- 主标题 ----------
    const tk = ease.out(clamp((c.local - 1.1) / 0.9, 0, 1));
    if (tk > 0) {
      ctx.save();
      ctx.globalAlpha = tk;
      text(c.p.title || '安得广厦千万间', (x0 + xR) / 2, 252, {
        size: onPaper ? 58 : 56, fam: 'serif', color: ink2, align: 'center',
      });
      ctx.strokeStyle = line;
      ctx.globalAlpha = tk * 0.35;
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.moveTo((x0 + xR) / 2 - 190, 270);
      ctx.lineTo((x0 + xR) / 2 + 190, 270);
      ctx.stroke();
      ctx.restore();
    }

    // ---------- 图纸编号水印 ----------
    ctx.save();
    ctx.globalAlpha = onPaper ? 0.045 : 0.035;
    text('1000Y', W - 300, 640, { size: 240, fam: 'mono', color: ink2, align: 'center', letterSpacing: 6 });
    ctx.restore();

    lyric(lineAt(c.t), c.t, onPaper ? PAL.ancient : { ink: '#dfe9f2', hot: '#ffcc00', accent: '#9fc4dd', dim: '#7f9cb2' },
      { y: H - 168, size: onPaper ? 54 : 56, active: acc, accent: acc, color: onPaper ? '#2b2419' : '#dfe9f2' });
    shotTag(c);
    fadeEdges(c);
  };

  // L13 数据实体化：钥匙串 + 垂落工牌
  LAYOUTS.keyRing = function (c) {
    ctx.fillStyle = '#08090b';
    ctx.fillRect(0, 0, W, H);
    grid({ line: '#2a2b2e' }, { grid: 60, alpha: 0.12 });
    const cx = 620, cy = 400, R = 150;
    const n = 6;
    // 环
    ctx.save();
    ctx.strokeStyle = '#8b8577';
    ctx.lineWidth = 5;
    ctx.beginPath();
    ctx.arc(cx, cy, R, 0, Math.PI * 2);
    ctx.stroke();
    ctx.restore();
    for (let i = 0; i < n; i++) {
      const at = i * 0.95;
      const e = ease.back(clamp((c.local - at) / 0.5, 0, 1));
      if (e <= 0) continue;
      const a = -Math.PI / 2 + i * 0.62;
      const kx = cx + Math.cos(a) * R, ky = cy + Math.sin(a) * R;
      ctx.save();
      ctx.globalAlpha = e;
      ctx.translate(kx, ky + (1 - e) * -60);
      ctx.rotate(a + Math.PI / 2);
      // 钥匙：环 + 柄 + 齿
      ctx.strokeStyle = '#c8a24a';
      ctx.lineWidth = 4;
      ctx.beginPath(); ctx.arc(0, 0, 22, 0, Math.PI * 2); ctx.stroke();
      ctx.beginPath(); ctx.moveTo(0, 22); ctx.lineTo(0, 130); ctx.stroke();
      ctx.lineWidth = 5;
      ctx.beginPath(); ctx.moveTo(0, 108); ctx.lineTo(26, 108); ctx.moveTo(0, 122); ctx.lineTo(18, 122); ctx.stroke();
      // 柄上房号
      ctx.rotate(-(a + Math.PI / 2));
      text(`#${String(1201 + i)}`, 0, 78, { size: 15, fam: 'mono', color: '#f2efe6', align: 'center', alpha: 0.85 });
      ctx.restore();
    }
    // 垂落工牌
    const bk = ease.out(clamp((c.local - 2.6) / 1.1, 0, 1));
    if (bk > 0) {
      const sw = Math.sin(c.local * 1.6) * 14 * (1 - bk * 0.6);
      ctx.save();
      ctx.translate(1420 + sw, 200);
      ctx.globalAlpha = bk;
      ctx.strokeStyle = '#8b8577';
      ctx.lineWidth = 3;
      ctx.beginPath(); ctx.moveTo(-40, -80); ctx.lineTo(0, 60); ctx.lineTo(40, -80); ctx.stroke();
      card(-230, 60, 460, 300, c.pal, { id: 'BADGE · 10000', rows: 4, fill: 'rgba(255,255,255,0.06)' });
      field('NAME', 'THE OGS', -204, 170, 408, c.pal, 24, bk);
      field('SINCE', '1000 Y', -204, 218, 408, c.pal, 24, bk);
      field('OFF?', 'NEVER', -204, 266, 408, c.pal, 24, bk);
      ctx.restore();
    }
    lyric(lineAt(c.t), c.t, c.pal, { y: H - 140, size: 58 });
    shotTag(c);
    fadeEdges(c);
  };

  // L40 数据叙事：购物车结算单
  LAYOUTS.receipt = function (c) {
    ctx.fillStyle = '#0a0a0b';
    ctx.fillRect(0, 0, W, H);
    // 左栏：深底 + 极淡网纹，避免大片死黑
    ctx.save();
    ctx.globalAlpha = 0.5;
    ctx.drawImage(hatchTile(90, 14, 560, H, '#1a1a1c', 0.5, 2), 0, 0, 560, H);
    ctx.restore();

    const rx = 620, rw = 760, ry = 118, rh = H - 190;
    // 纸：微微倾斜的票据 + 撕口
    ctx.save();
    ctx.translate(rx + rw / 2, ry + rh / 2);
    ctx.rotate(-0.004);
    ctx.translate(-(rx + rw / 2), -(ry + rh / 2));
    ctx.fillStyle = '#efeade';
    ctx.fillRect(rx, ry, rw, rh);
    // 纸纹
    ctx.globalAlpha = 0.16;
    ctx.drawImage(grainTile(rw, rh, 0.5, 7), rx, ry, rw, rh);
    ctx.globalAlpha = 1;
    // 上下撕口
    const ink = '#2b2419';
    ctx.fillStyle = ink;
    for (let x = rx; x < rx + rw; x += 22) {
      ctx.beginPath();
      ctx.moveTo(x, ry); ctx.lineTo(x + 11, ry + 7); ctx.lineTo(x + 22, ry);
      ctx.closePath(); ctx.fill();
      ctx.beginPath();
      ctx.moveTo(x, ry + rh); ctx.lineTo(x + 11, ry + rh - 7); ctx.lineTo(x + 22, ry + rh);
      ctx.closePath(); ctx.fill();
    }
    ctx.restore();

    const inkC = '#2b2419';
    const accC = '#a8402c';
    const dimC = 'rgba(43,36,25,0.55)';
    const L = 40;                        // 纸内左边距
    const R = rx + rw - 40;
    const mono = (t2, x, y, o) => text(t2, x, y, Object.assign({ fam: 'mono', color: inkC }, o));

    // ---- 票头：门店 / 单据号 / 时间 ----
    mono('购物车 / CART', rx + L, ry + 62, { size: 30, letterSpacing: 4 });
    mono('No.2026-1110-0001', R, ry + 62, { size: 16, align: 'right', color: dimC, letterSpacing: 2 });
    mono('THE OGS  ·  过来人消耗清单', rx + L, ry + 96, { size: 16, color: dimC, letterSpacing: 2 });
    mono('2026-11-10  20:41', R, ry + 96, { size: 16, align: 'right', color: dimC, letterSpacing: 2 });

    // 双线
    ctx.save();
    ctx.fillStyle = inkC;
    ctx.fillRect(rx + L, ry + 112, rw - L * 2, 2);
    ctx.fillRect(rx + L, ry + 117, rw - L * 2, 1);
    ctx.restore();

    // ---- 列头（常驻）----
    const ITEM_COUNT = 7;                 // 与下方 items 数组同步；此处不能读 items（尚未声明）
    mono('项', rx + L, ry + 158, { size: 14, color: dimC, letterSpacing: 2 });
    mono('品名', rx + L + 42, ry + 158, { size: 14, color: dimC, letterSpacing: 6 });
    mono('金额 / CNY', R, ry + 158, { size: 14, align: 'right', color: dimC, letterSpacing: 4 });
    ctx.save();
    ctx.globalAlpha = 0.3;
    ctx.fillStyle = inkC;
    ctx.fillRect(rx + L, ry + 168, rw - L * 2, 1);
    ctx.restore();

    // ---- 明细行（第一帧就开始打印，避免空纸）----
    const items = [
      ['房贷', 6800], ['学费', 2400], ['爸妈体检', 1200], ['水电', 320],
      ['通勤', 260], ['话费', 99], ['自己的', 0],
    ];
    let sum = 0;
    let lastY = ry + 160;
    for (let i = 0; i < items.length; i++) {
      const at = -0.55 + i * 0.10;
      const e = clamp((c.local - at) / 0.12, 0, 1);
      if (e <= 0) continue;
      const y = ry + 188 + i * 54;
      lastY = y;
      const it = items[i];
      const mine = i === items.length - 1;
      if (!mine) sum += it[1];
      ctx.save();
      ctx.globalAlpha = e;
      // 行号
      mono(String(i + 1).padStart(2, '0'), rx + L, y, { size: 16, color: dimC });
      text(it[0], rx + L + 42, y, { size: 30, fam: 'serif', color: inkC });
      if (!mine) {
        // 点线填充（票据的经典做法）
        const nameW = measure(it[0], 30, 'serif');
        const valW = measure(it[1].toFixed(2), 24, 'mono');
        const x1 = rx + L + 42 + nameW + 12;
        const x2 = R - valW - 12;
        ctx.save();
        ctx.globalAlpha = e * 0.45;
        ctx.fillStyle = inkC;
        for (let dx = x1; dx < x2; dx += 9) ctx.fillRect(dx, y - 5, 3, 1.4);
        ctx.restore();
      }
      mono(mine ? '0.00' : it[1].toFixed(2), R, y,
        { size: mine ? 30 : 24, align: 'right', color: mine ? accC : inkC });
      ctx.restore();
    }

    // ---- 合计 ----
    const tk = clamp((c.local - 1.9) / 0.4, 0, 1);
    if (tk > 0) {
      const ty = ry + 188 + items.length * 54 + 40;
      {
        const done = Math.max(0, Math.min(ITEM_COUNT, Math.floor((c.local + 0.55) / 0.10) + 1));
        mono(`共 ${ITEM_COUNT} 项  ·  已打印 ${done}`, R, ty - 52,
          { size: 14, align: 'right', color: dimC, letterSpacing: 2 });
      }
      ctx.save();
      ctx.globalAlpha = tk;
      ctx.fillStyle = inkC;
      ctx.fillRect(rx + L, ty - 40, rw - L * 2, 1.6);
      mono('TOTAL', rx + L, ty, { size: 34, letterSpacing: 4 });
      mono(sum.toFixed(2), R, ty, { size: 40, align: 'right', color: accC });
      ctx.restore();
    }

    // ---- 条形码 + 票尾 ----
    const bk = clamp((c.local - 2.3) / 0.4, 0, 1);
    if (bk > 0) {
      ctx.save();
      ctx.globalAlpha = bk * 0.9;
      ctx.fillStyle = inkC;
      const by = 862;
      let bx = 150;
      const seed = 20261110;
      for (let i = 0; i < 76; i++) {
        const wbar = 1 + ((seed >> (i % 12)) & 1) + ((i % 5 === 0) ? 1 : 0);
        if (i % 2 === 0) ctx.fillRect(bx, by, wbar, 34);
        bx += wbar + 2;
      }
      mono('NO REFUND  ·  不予退还', 150, by + 56, { size: 14, color: dimC, letterSpacing: 3 });
      ctx.restore();
    }

    // ---- 静态票尾（从第 0 帧就在纸上，填满下半张纸）----
    {
      const fy = (ry + 188 + ITEM_COUNT * 54 + 40) + 96;   // 跟在 TOTAL 之后顺排
      ctx.save();
      ctx.fillStyle = inkC;
      // 虚线
      ctx.globalAlpha = 0.35;
      for (let dx = rx + L; dx < R; dx += 12) ctx.fillRect(dx, fy - 8, 6, 1.2);
      ctx.globalAlpha = 1;

      const rows = [
        ['支付方式', '微信支付'],
        ['收银员', '0001 · 陈工'],
        ['门店', '卓越路店 / ZHUOYUE RD.'],
        ['服务热线', '400-1000-1001'],
      ];
      rows.forEach((r, i) => {
        const y = fy + 28 + i * 34;
        mono(r[0], rx + L, y, { size: 16, color: dimC, letterSpacing: 2 });
        mono(r[1], R, y, { size: 17, align: 'right' });
      });
      ctx.restore();
    }
    // ---- 已支付朱印（0.9 s 就盖，填补 TOTAL 出现前的下半版面）----
    {
      const sk = clamp((c.local - 0.15) / 0.30, 0, 1);
      if (sk > 0) {
        const sx2 = 296, sy2 = 262;   // 左栏顶部，BALANCE 块上方
        ctx.save();
        ctx.translate(sx2, sy2);
        ctx.rotate(-0.10);
        ctx.globalAlpha = 0.72 * sk;
        const ss = 1.18 - 0.18 * sk;          // 盖下去时略大，落定后收紧
        ctx.scale(ss, ss);
        ctx.strokeStyle = accC;
        ctx.lineWidth = 6;
        ctx.strokeRect(-150, -62, 300, 124);
        ctx.lineWidth = 2;
        ctx.strokeRect(-140, -52, 280, 104);
        ctx.fillStyle = accC;
        ctx.textAlign = 'center';
        ctx.font = '700 54px "Cascadia Mono", monospace';
        ctx.fillText('已 支 付', 0, -4);
        ctx.font = '400 22px "Cascadia Mono", monospace';
        ctx.letterSpacing = '8px';
        ctx.fillText('PAID · 11079.00', 0, 36);
        ctx.restore();
      }
    }
    // 票据右边竖排小字（贴着纸边，让纸不空）
    {
      const vk = clamp((c.local - 0.5) / 0.5, 0, 1);
      if (vk > 0) {
        ctx.save();
        ctx.globalAlpha = 0.34 * vk;
        ctx.translate(rx + rw - 10, ry + rh * 0.52);
        ctx.rotate(Math.PI / 2);
        text('ONE WAY · NO REFUND · KEEP THIS TICKET', 0, 0,
          { size: 13, fam: 'mono', color: inkC, align: 'center', letterSpacing: 6 });
        ctx.restore();
      }
    }

    // ---- 左栏：本人 0.00 + 逐行歌词（宽度受限，自动换行）----
    ctx.save();
    const ak = clamp((c.local - 2.6) / 0.5, 0, 1);
    if (ak > 0) {
      ctx.globalAlpha = ak;
      // 竖向细线 + 标签
      ctx.fillStyle = '#c8a24a';
      ctx.fillRect(150, 384, 2, 140);
      text('BALANCE', 176, 390, { size: 15, fam: 'mono', color: '#8b8577', letterSpacing: 4 });
      text('本人 0.00', 176, 534, { size: 44, fam: 'mono', color: accC, letterSpacing: 2 });
      text('其余 11079.00', 176, 588, { size: 20, fam: 'mono', color: '#8b8577', letterSpacing: 2 });
    }
    ctx.restore();

    // 歌词：限制在 150..600 之间，超过就换行（原来从 x=200 直接冲进纸面）
    const ln = lineAt(c.t);
    if (ln) {
      const maxW = 430;
      const size = 42;
      const rows = [];
      // 中文没有空格，必须能「逐字」断行；先按空格切词，词再超宽就逐字切
      const words = ln.text.split(/(\s+)/).filter((w2) => w2.length);
      for (const wd of words) {
        if (/^\s+$/.test(wd)) { if (rows.length) rows[rows.length - 1] += ' '; continue; }
        if (measure(wd, size, 'serif') <= maxW) {
          if (!rows.length) rows.push('');
          if (measure(rows[rows.length - 1] + wd, size, 'serif') <= maxW) rows[rows.length - 1] += wd;
          else rows.push(wd);
        } else {
          // 单段超宽：逐字
          let cur = rows.length ? rows.pop() : '';
          for (const ch of wd) {
            if (cur && measure(cur + ch, size, 'serif') > maxW) { rows.push(cur); cur = ch; }
            else cur += ch;
          }
          if (cur) rows.push(cur);
        }
      }
      const startY = Math.max(660, 760 - (rows.length - 1) * 50);
      rows.forEach((row, i) => {
        // 逐字高亮：用 chars 的时间
        ctx.save();
        ctx.globalAlpha = 0.92;
        let x = 150;
        const rowChars = row.split('');
        for (const ch of rowChars) {
          const info = (ln.chars || []).find((q) => q.c === ch);
          const sung = info ? c.t >= info.t : false;
          text(ch, x, startY + i * 50, {
            size, fam: 'serif', color: sung ? '#efeade' : 'rgba(239,234,222,0.34)',
          });
          x += measure(ch, size, 'serif');
        }
        ctx.restore();
      });
    }

    shotTag(c);
    fadeEdges(c);
  };

  // L16 灯箱：出生登记卡
  LAYOUTS.lightbox = function (c) {
    ctx.fillStyle = '#0b0a09';
    ctx.fillRect(0, 0, W, H);
    const k = ease.out(clamp(c.local / 0.6, 0, 1));
    const lx = 420, ly = 250, lw = 1080, lh = 620;
    ctx.save();
    ctx.globalAlpha = k;
    const g = ctx.createRadialGradient(lx + lw / 2, ly + lh / 2, 60, lx + lw / 2, ly + lh / 2, lw);
    g.addColorStop(0, 'rgba(255,246,224,0.20)');
    g.addColorStop(1, 'rgba(255,246,224,0)');
    ctx.fillStyle = g;
    ctx.fillRect(lx - 300, ly - 300, lw + 600, lh + 600);
    ctx.fillStyle = 'rgba(240,232,214,0.94)';
    ctx.fillRect(lx, ly, lw, lh);
    ctx.restore();
    // 内容
    ctx.save();
    ctx.globalAlpha = k;
    text('出 生 登 记', lx + 60, ly + 110, { size: 58, fam: 'serif', color: '#17130f', letterSpacing: 16 });
    ctx.fillStyle = '#17130f';
    ctx.fillRect(lx + 60, ly + 140, lw - 120, 2);
    field('DATE', '760 AD', lx + 60, ly + 226, lw - 120, PAL.ancient, 30, k);
    field('NAME', '长子', lx + 60, ly + 290, lw - 120, PAL.ancient, 30, k);
    field('FATHER', '杜甫', lx + 60, ly + 354, lw - 120, PAL.ancient, 30, k);
    field('NOTE', '父在长安求人', lx + 60, ly + 418, lw - 120, PAL.ancient, 30, k);
    ctx.restore();
    const sk = ease.back(clamp((c.local - 0.4) / 0.35, 0, 1));
    if (sk > 0) seal('长子', lx + lw - 150, ly + 90, 40, '#a8402c', -0.1, sk * 0.9);
    // 便条
    const nk = clamp((c.local - 2.2) / 0.5, 0, 1);
    if (nk > 0) {
      ctx.save();
      ctx.globalAlpha = nk * 0.85;
      ctx.translate(lx + lw - 60, ly + lh - 40);
      ctx.rotate(0.06);
      ctx.fillStyle = '#efe7d2';
      ctx.fillRect(-260, -160, 300, 190);
      text('求人办事 · 便条', -240, -120, { size: 20, fam: 'serif', color: '#4a4235' });
      text('明日再候', -240, -80, { size: 18, fam: 'serif', color: '#6b5f4c' });
      ctx.restore();
    }
    lyric(lineAt(c.t), c.t, PAL.ancient, { y: H - 90, size: 54, active: '#a8402c', accent: '#a8402c' });
    shotTag(c);
    fadeEdges(c);
  };

  // L30 木刻：泡面碗俯视
  LAYOUTS.noodleBowl = function (c) {
    paperBg();
    const cx = W / 2, cy = 520, R = 260;
    const k = ease.out(clamp(c.local / 1.0, 0, 1));
    // 碗沿：三段圆弧
    ctx.save();
    ctx.strokeStyle = '#2b2419';
    ctx.lineWidth = 6;
    for (let s = 0; s < 3; s++) {
      const kk = clamp(c.local * 2 - s * 0.5, 0, 1);
      if (kk <= 0) continue;
      const a0 = -Math.PI / 2 + s * (Math.PI * 2 / 3);
      ctx.globalAlpha = kk;
      ctx.beginPath();
      ctx.arc(cx, cy, R, a0, a0 + (Math.PI * 2 / 3) * kk);
      ctx.stroke();
    }
    // 面饼同心圆
    ctx.globalAlpha = 0.5 * k;
    ctx.lineWidth = 2;
    for (let i = 1; i <= 5; i++) {
      ctx.beginPath();
      ctx.arc(cx, cy, R * (i / 6), 0, Math.PI * 2);
      ctx.stroke();
    }
    ctx.restore();
    // 蒸汽
    const sk = clamp((c.local - 1.6) / 0.4, 0, 1);
    if (sk > 0) {
      ctx.save();
      ctx.strokeStyle = 'rgba(43,36,25,0.35)';
      ctx.lineWidth = 2;
      for (let i = 0; i < 5; i++) {
        const ph = (c.t * 0.5 + i * 0.3) % 1;
        ctx.globalAlpha = sk * (1 - ph) * 0.7;
        ctx.beginPath();
        for (let y = 0; y < 160; y += 8) {
          const x = cx - 140 + i * 70 + Math.sin((y * 0.04) + ph * 6) * 12;
          y === 0 ? ctx.moveTo(x, cy - R - 20 - y - ph * 90) : ctx.lineTo(x, cy - R - 20 - y - ph * 90);
        }
        ctx.stroke();
      }
      ctx.restore();
    }
    text('凌晨 02:00 · 泡面', cx, cy - R - 90, { size: 24, fam: 'mono', color: '#4a4235', align: 'center', letterSpacing: 4 });
    lyric(lineAt(c.t), c.t, PAL.ancient, { y: H - 130, size: 58, active: '#a8402c', accent: '#a8402c' });
    shotTag(c);
    fadeEdges(c);
  };

  // L16 双卡 + 千年刻度
  LAYOUTS.twinCards = function (c) {
    ctx.fillStyle = '#0a0a0b';
    ctx.fillRect(0, 0, W, H);
    grid({ line: '#2a2b2e' }, { grid: 70, alpha: 0.1 });
    const k = ease.out(clamp(c.local / 1.0, 0, 1));
    card(240, 300, 560, 380, PAL.ancient, { id: 'REC 0007 · 唐', rows: 4, fill: 'rgba(217,207,184,0.9)', stroke: '#a99a80', idColor: '#a8402c', alpha: k });
    field('WHO', '杜甫', 266, 420, 508, PAL.ancient, 28, k);
    field('AGE', '47', 266, 478, 508, PAL.ancient, 28, k);
    field('HOUSE', '租', 266, 536, 508, PAL.ancient, 28, k);
    field('MOOD', '想哭', 266, 594, 508, PAL.ancient, 28, k);
    card(1120, 300, 560, 380, c.pal, { id: 'REC 0001 · 今', rows: 4, alpha: k });
    field('WHO', '你', 1146, 420, 508, c.pal, 28, k);
    field('AGE', '??', 1146, 478, 508, c.pal, 28, k);
    field('HOUSE', '贷', 1146, 536, 508, c.pal, 28, k);
    field('MOOD', '同款', 1146, 594, 508, c.pal, 28, k);
    // 中间千年刻度：10 格走完压成 1 条线
    const ticks = 10;
    const tk = clamp(c.local / 3.2, 0, 1);
    const n = Math.floor(ticks * tk);
    const tight = clamp((c.local - 3.3) / 0.5, 0, 1);
    ctx.save();
    ctx.globalAlpha = 0.9;
    ctx.strokeStyle = c.pal.accent;
    ctx.lineWidth = 2;
    const span = lerp(320, 2, tight);
    ctx.beginPath();
    ctx.moveTo(W / 2 - span / 2, 490);
    ctx.lineTo(W / 2 + span / 2, 490);
    ctx.stroke();
    if (tight < 1) {
      for (let i = 0; i <= n; i++) {
        const x = W / 2 - 160 + (i * 320 / ticks);
        ctx.beginPath();
        ctx.moveTo(x, 478);
        ctx.lineTo(x, 502);
        ctx.stroke();
      }
    }
    ctx.restore();
    text('1000 Y', W / 2, 452, { size: 22, fam: 'mono', color: c.pal.dim, align: 'center', letterSpacing: 6 });
    lyric(lineAt(c.t), c.t, c.pal, { y: H - 120, size: 56 });
    shotTag(c);
    fadeEdges(c);
  };

  // L40 时间轴 + 红点
  LAYOUTS.timelineDots = function (c) {
    ctx.fillStyle = '#07080a';
    ctx.fillRect(0, 0, W, H);
    const y = H / 2 + 40, x0 = 200, x1 = W - 200;
    const k = ease.out(clamp(c.local / 0.6, 0, 1));
    ctx.save();
    ctx.strokeStyle = c.pal.dim;
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(x0, y);
    ctx.lineTo(x0 + (x1 - x0) * k, y);
    ctx.stroke();
    for (let i = 0; i <= 10; i++) {
      const x = lerp(x0, x1, i / 10);
      ctx.beginPath();
      ctx.moveTo(x, y - 12);
      ctx.lineTo(x, y + 12);
      ctx.stroke();
      if (i % 2 === 0) text(`${i * 100}`, x, y + 44, { size: 16, fam: 'mono', color: c.pal.dim, align: 'center' });
    }
    ctx.restore();
    // 两个红点 + 虚线
    const dots = [[0, 0.2], [10, 1.5]];
    dots.forEach(([idx, at], i) => {
      const e = clamp((c.local - at) / 0.3, 0, 1);
      if (e <= 0) return;
      const x = lerp(x0, x1, idx / 10);
      ctx.save();
      ctx.globalAlpha = e;
      ctx.fillStyle = c.pal.err;
      ctx.beginPath(); ctx.arc(x, y, 11, 0, Math.PI * 2); ctx.fill();
      ctx.restore();
    });
    if (c.local > 1.9) {
      const dk = clamp((c.local - 1.9) / 0.9, 0, 1);
      ctx.save();
      ctx.globalAlpha = 0.8;
      ctx.strokeStyle = c.pal.err;
      ctx.lineWidth = 2;
      ctx.setLineDash([7, 9]);
      ctx.beginPath();
      ctx.moveTo(x0, y);
      ctx.lineTo(x0 + (x1 - x0) * dk, y);
      ctx.stroke();
      ctx.restore();
    }
    lyric(lineAt(c.t), c.t, c.pal, { y: H - 200, size: 58 });
    shotTag(c);
    fadeEdges(c);
  };

  // 终端打字（刘邦 / 系统独白）
  LAYOUTS.terminalType = function (c) {
    ctx.fillStyle = '#05080a';
    ctx.fillRect(0, 0, W, H);
    asciiField(c.t, c.pal, { alpha: 0.06, amp: 22, cut: 0.62, color: '#1f4a3a' });
    const lines = (c.p || []).length ? c.p : ['> query subject', '> found 1000 records'];
    const cps = 26;
    let total = 0;
    ctx.save();
    const t0 = 0.2;
    for (let i = 0; i < lines.length; i++) {
      const start = t0 + i * (lines[i].length / cps + 0.25);
      const n = clamp((c.local - start) * cps, 0, lines[i].length);
      if (n <= 0) continue;
      const isLast = i === lines.length - 1;
      typed(lines[i], 220, 320 + i * 62, n, c.pal, { size: 30, color: isLast && n >= lines[i].length ? c.pal.accent : c.pal.ink });
      total++;
    }
    ctx.restore();
    lyric(lineAt(c.t), c.t, c.pal, { y: H - 180, size: 56 });
    shotTag(c);
    fadeEdges(c);
  };

  // 酒爵阵列（刘邦）
  LAYOUTS.wineCups = function (c) {
    ctx.fillStyle = '#0a0a0b';
    ctx.fillRect(0, 0, W, H);
    grid({ line: '#2a2b2e' }, { grid: 90, alpha: 0.1 });
    const n = 10, bw = 96, gap = 40;
    const totalW = n * bw + (n - 1) * gap;
    const x0 = (W - totalW) / 2, y = 640;
    for (let i = 0; i < n; i++) {
      const e = ease.out(clamp((c.local - i * 0.12) / 0.4, 0, 1));
      if (e <= 0) continue;
      const x = x0 + i * (bw + gap);
      ctx.save();
      ctx.globalAlpha = e;
      ctx.strokeStyle = i === n - 1 ? c.pal.accent : '#8b8577';
      ctx.lineWidth = 2.5;
      // 爵：三足 + 杯身 + 双柱
      ctx.beginPath();
      ctx.moveTo(x + 10, y + 120); ctx.lineTo(x + 22, y + 40); ctx.lineTo(x + bw - 22, y + 40); ctx.lineTo(x + bw - 10, y + 120);
      ctx.stroke();
      ctx.beginPath(); ctx.moveTo(x + 12, y + 40); ctx.lineTo(x + bw - 12, y + 40); ctx.stroke();
      ctx.beginPath(); ctx.moveTo(x + bw / 2, y + 120); ctx.lineTo(x + bw / 2, y + 160); ctx.stroke();
      ctx.restore();
    }
    text('酒 爵 · 十 只', W / 2, 520, { size: 22, fam: 'serif', color: c.pal.dim, align: 'center', letterSpacing: 8 });
    lyric(lineAt(c.t), c.t, c.pal, { y: 320, size: 64 });
    shotTag(c);
    fadeEdges(c);
  };

  // 手机聊天（you-too）
  LAYOUTS.phoneChat = function (c) {
    ctx.fillStyle = '#07080a';
    ctx.fillRect(0, 0, W, H);
    const px = W / 2 - 260, pw = 520;
    ctx.save();
    ctx.strokeStyle = c.pal.line;
    ctx.lineWidth = 3;
    ctx.strokeRect(px, 120, pw, H - 240);
    ctx.restore();
    text('同事群 (12)', px + 30, 180, { size: 24, fam: 'sans', color: c.pal.dim });
    const msgs = [
      ['他', '听说你又加班了'],
      ['你', '习惯了'],
      ['他', '你图啥'],
      ['你', '图个明白'],
    ];
    let y = 250;
    for (let i = 0; i < msgs.length; i++) {
      const at = i * 0.7;
      const e = ease.out(clamp((c.local - at) / 0.3, 0, 1));
      if (e <= 0) continue;
      const mine = msgs[i][0] === '你';
      const bw = measure(msgs[i][1], 28, 'sans') + 48;
      const bx = mine ? px + pw - 30 - bw : px + 30;
      ctx.save();
      ctx.globalAlpha = e;
      ctx.fillStyle = mine ? 'rgba(200,162,74,0.85)' : 'rgba(255,255,255,0.10)';
      ctx.fillRect(bx, y, bw, 62);
      text(msgs[i][1], bx + 24, y + 40, { size: 28, fam: 'sans', color: mine ? '#12100b' : c.pal.ink });
      ctx.restore();
      y += 86;
    }
    lyric(lineAt(c.t), c.t, c.pal, { y: H - 120, size: 56 });
    shotTag(c);
    fadeEdges(c);
  };

  // 战报流水（war）
  LAYOUTS.warLog = function (c) {
    ctx.fillStyle = '#05080a';
    ctx.fillRect(0, 0, W, H);
    asciiField(c.t, c.pal, { alpha: 0.10, amp: 34, cut: 0.55, color: '#1f4a3a' });
    const rows = ['BATTLE 0001  胜  伤亡 0', 'BATTLE 0002  胜  伤亡 0', 'BATTLE 0003  败  重来',
      'BATTLE 0004  胜  伤亡 0', 'BATTLE 0005  平  待续', 'BATTLE 0006  胜  伤亡 0', 'BATTLE 0007  胜  伤亡 1'];
    const cur = Math.floor(c.local / 0.38);
    for (let i = 0; i < 7; i++) {
      const idx = cur - 6 + i;
      if (idx < 0) continue;
      const r = rows[((idx % rows.length) + rows.length) % rows.length];
      ctx.save();
      ctx.globalAlpha = 0.25 + 0.75 * (i / 7);
      text(r, 200, 330 + i * 58, { size: 26, fam: 'mono', color: i === 6 ? c.pal.hot : c.pal.ink });
      ctx.restore();
    }
    text('累计参战 1000 年', 200, 280, { size: 20, fam: 'mono', color: c.pal.dim, letterSpacing: 4 });
    lyric(lineAt(c.t), c.t, c.pal, { x: 200, y: H - 190, size: 50, align: 'left' });
    shotTag(c);
    fadeEdges(c);
  };

  // 账本表格（ledger）
  LAYOUTS.ledgerTable = function (c) {
    ctx.fillStyle = '#05080a';
    ctx.fillRect(0, 0, W, H);
    const x0 = 170, y0 = 250, cw = 1580, rh = 54, rows = 11;
    const cols = [0, 0.10, 0.55, 0.78, 1.0];
    ['#', 'DATE', 'ITEM', 'COST', 'OK?'].forEach((h, i) =>
      text(h, x0 + cols[i] * cw + 8, y0 - 16, { size: 20, fam: 'mono', color: c.pal.dim, letterSpacing: 2 }));
    const items = [['出租屋', '3 两', 'OK'], ['旧书', '1 两', 'OK'], ['酒', '0.5 两', 'OK'],
      ['药', '2 两', 'NO'], ['灯油', '0.2 两', 'OK'], ['房租', '5 两', 'NO'], ['车马', '1 两', 'OK'],
      ['纸墨', '0.8 两', 'OK'], ['冬衣', '4 两', 'NO'], ['米', '2 两', 'OK'], ['修补屋顶', '3 两', 'NO']];
    for (let i = 0; i < rows; i++) {
      const k = ease.out(inv(c.local + 0.1 + i * 0.3, c.local + 0.45 + i * 0.3, 2.4));
      if (k <= 0) continue;
      const y = y0 + 34 + i * rh;
      ctx.save();
      ctx.globalAlpha = k * 0.9;
      ctx.fillStyle = c.pal.line;
      ctx.fillRect(x0, y + 16, cw, 1);
      const it = items[i % items.length];
      const vals = [String(i + 1).padStart(3, '0'), `76${(i % 9) + 1}`, it[0], it[1], it[2]];
      vals.forEach((v, ci) => text(v, x0 + cols[ci] * cw + 8, y,
        { size: 23, fam: 'mono', color: ci === 4 ? (v === 'OK' ? c.pal.accent : c.pal.err) : c.pal.ink, alpha: k }));
      ctx.restore();
    }
    lyric(lineAt(c.t), c.t, c.pal, { y: H - 110, size: 50 });
    shotTag(c);
    fadeEdges(c);
  };

  // 千张档案卡（wind 末镜 / finale）
  LAYOUTS.cardRain = function (c) {
    ctx.fillStyle = '#0a0a0b';
    ctx.fillRect(0, 0, W, H);
    const N = 96;
    for (let i = 0; i < N; i++) {
      const r = rnd(i * 31 + 7);
      const x = r() * W;
      const y0 = ((r() * H * 1.4) + c.t * (18 + r() * 26)) % (H + 300) - 150;
      const w = 90 + r() * 70, h = w * 0.62;
      ctx.save();
      ctx.globalAlpha = 0.10 + r() * 0.30;
      ctx.fillStyle = i % 7 === 0 ? 'rgba(200,162,74,0.5)' : 'rgba(255,255,255,0.14)';
      ctx.fillRect(x, y0, w, h);
      ctx.restore();
    }
    const l = lineAt(c.t);
    lyric(l, c.t, c.pal, { free: true, y: H - 200, size: 62 });
    shotTag(c);
    fadeEdges(c);
  };

  // 马牌副歌（hook-marpol）
  LAYOUTS.marpolHook = function (c) {
    ctx.fillStyle = '#0b0b0c';
    ctx.fillRect(0, 0, W, H);
    const bi = beatInfo(c.t);
    ctx.save();
    ctx.globalAlpha = 0.055;
    setFont(420, 'sans', 900);
    ctx.fillStyle = c.pal.accent;
    ctx.textAlign = 'center';
    ctx.translate(W / 2, H / 2 + 100);
    ctx.rotate(-0.06);
    ctx.fillText('MARPOL', 0, 0);
    ctx.restore();
    for (let i = 0; i < 4; i++) {
      const y = 230 + i * 96;
      const w = W * (0.28 + 0.55 * Math.abs(Math.sin(c.t * 1.1 + i * 1.7)));
      ctx.save();
      ctx.globalAlpha = 0.12 + bi.pulse * 0.1;
      ctx.fillStyle = i === 1 ? c.pal.accent : c.pal.ink;
      ctx.fillRect(140, y, w, 30);
      ctx.restore();
      text(['PROCESS', 'QUALITY', 'COST', 'PEOPLE'][i], 140, y - 12, { size: 19, fam: 'mono', color: c.pal.dim, letterSpacing: 4, alpha: 0.75 });
    }
    lyric(lineAt(c.t), c.t, c.pal, { y: 860, size: 104, active: c.pal.accent, accent: c.pal.accent });
    for (let i = 0; i < 40; i++) {
      const on = ((i + bi.n) % 4 === 0);
      ctx.save();
      ctx.globalAlpha = on ? 0.9 : 0.14;
      ctx.fillStyle = on ? c.pal.accent : c.pal.ink;
      ctx.fillRect(140 + i * ((W - 280) / 40), H - 160, (W - 280) / 40 - 8, 9);
      ctx.restore();
    }
    shotTag(c);
    fadeEdges(c);
  };

  // 对比墙（biwu）
  LAYOUTS.beforeAfter = function (c) {
    ctx.fillStyle = '#0b0b0c';
    ctx.fillRect(0, 0, W, H);
    grid(c.pal, { grid: 36, alpha: 0.07 });
    const k = ease.out(clamp(c.local / 1.2, 0, 1));
    const top = 280, boxW = 620, boxH = 300;
    text('BEFORE  vs  AFTER', W / 2, 220, { size: 26, fam: 'mono', color: c.pal.dim, align: 'center', letterSpacing: 8, alpha: k });
    [[200, 'BEFORE', c.pal.line], [1100, 'AFTER', c.pal.accent]].forEach(([x, label, col], i) => {
      ctx.save();
      ctx.globalAlpha = k;
      ctx.strokeStyle = col;
      ctx.lineWidth = 2;
      ctx.strokeRect(x, top, boxW, boxH);
      text(label, x + 20, top + 36, { size: 22, fam: 'mono', color: col, letterSpacing: 4 });
      for (let r = 0; r < 4; r++) {
        const bw = boxW * (0.22 + 0.55 * hash(i * 13 + r + Math.floor(c.t * 0.5)));
        ctx.globalAlpha = k * (0.18 + 0.5 * hash(r + i));
        ctx.fillStyle = col;
        ctx.fillRect(x + 24, top + 76 + r * 48, bw * (i === 1 ? 1 : 0.68), 14);
      }
      ctx.restore();
    });
    lyric(lineAt(c.t), c.t, c.pal, { x: 200, y: H - 180, size: 50, align: 'left' });
    shotTag(c);
    fadeEdges(c);
  };

  // 套印：Give me five（手掌）
  // 手指用「胶囊」画：指根压在掌上、指尖圆头，五指分开、长度与张开角度不同。
  // 先前用直矩形 + 圆头，指缝直接切到掌心，读起来像连指手套。
  function capsule(p, x1, y1, x2, y2, r) {
    const a = Math.atan2(y2 - y1, x2 - x1);
    const nx = Math.sin(a) * r, ny = -Math.cos(a) * r;
    p.moveTo(x1 + nx, y1 + ny);
    p.lineTo(x2 + nx, y2 + ny);
    p.arc(x2, y2, r, a - Math.PI / 2, a + Math.PI / 2, false);
    p.lineTo(x1 - nx, y1 - ny);
    p.arc(x1, y1, r, a + Math.PI / 2, a - Math.PI / 2, false);
    p.closePath();
  }

  LAYOUTS.giveMeFive = function (c) {
    paperBg('#ded4bc');
    const cx = W / 2 - 40, cy = 560;
    const S = 0.9;   // 整体缩小，手掌下沿~790，给歌词留出 y=900 的位置
    const k = ease.out(clamp(c.local / 0.9, 0, 1));

    // 一整套「手掌」：掌 + 五指各是一块实心，叠在一起自然并成一只手的剪影
    function handParts(dx, dy) {
      const parts = [];
      const palm = new Path2D();
      palm.moveTo(cx - 120 + dx, cy - 10 + dy);
      palm.quadraticCurveTo(cx - 150 + dx, cy + 90 + dy, cx - 136 + dx, cy + 186 + dy);
      palm.quadraticCurveTo(cx - 126 + dx, cy + 244 + dy, cx - 40 + dx, cy + 248 + dy);
      palm.lineTo(cx + 46 + dx, cy + 248 + dy);
      palm.quadraticCurveTo(cx + 130 + dx, cy + 244 + dy, cx + 138 + dx, cy + 180 + dy);
      palm.quadraticCurveTo(cx + 152 + dx, cy + 84 + dy, cx + 122 + dx, cy - 10 + dy);
      palm.closePath();
      parts.push(palm);
      // 食指 / 中指 / 无名指 / 小指：指根从掌顶内 20 px 起，各自向外张开
      parts.push(new Path2D()); capsule(parts[parts.length - 1], cx - 92 + dx, cy + 20 + dy, cx - 122 + dx, cy - 232 + dy, 30);
      parts.push(new Path2D()); capsule(parts[parts.length - 1], cx - 28 + dx, cy + 20 + dy, cx - 30 + dx, cy - 292 + dy, 32);
      parts.push(new Path2D()); capsule(parts[parts.length - 1], cx + 38 + dx, cy + 20 + dy, cx + 58 + dx, cy - 262 + dy, 30);
      parts.push(new Path2D()); capsule(parts[parts.length - 1], cx + 100 + dx, cy + 30 + dy, cx + 150 + dx, cy - 168 + dy, 25);
      // 拇指：从掌左侧斜伸出去
      parts.push(new Path2D()); capsule(parts[parts.length - 1], cx - 104 + dx, cy + 168 + dy, cx - 262 + dx, cy + 58 + dy, 39);
      return parts;
    }

    ctx.save();
    ctx.globalAlpha = k;
    ctx.fillStyle = '#a8402c';
    ctx.translate(cx, cy + 70); ctx.scale(S, S); ctx.translate(-cx, -(cy + 70));
    handParts(0, 0).forEach((p) => ctx.fill(p));
    ctx.restore();

    // 掌纹三条：用纸色刻掉（印完再把线刮出来）
    ctx.save();
    ctx.globalAlpha = k * 0.9;
    ctx.strokeStyle = '#e6dcc8';
    ctx.lineWidth = 6;
    ctx.lineCap = 'round';
    ctx.beginPath();
    ctx.moveTo(cx - 110, cy + 96);
    ctx.bezierCurveTo(cx - 60, cy + 58, cx + 10, cy + 52, cx + 96, cy + 96);
    ctx.moveTo(cx - 104, cy + 148);
    ctx.bezierCurveTo(cx - 50, cy + 118, cx + 16, cy + 112, cx + 100, cy + 148);
    ctx.moveTo(cx - 78, cy + 196);
    ctx.bezierCurveTo(cx - 30, cy + 170, cx + 18, cy + 166, cx + 82, cy + 192);
    ctx.stroke();
    ctx.restore();

    // 套印不准的第二版：整体错位、换金色
    const ok = clamp((c.local - 0.9) / 0.3, 0, 1);
    if (ok > 0) {
      ctx.save();
      ctx.globalAlpha = ok * 0.42;
      ctx.translate(14, -9);
      ctx.translate(cx, cy + 70); ctx.scale(S, S); ctx.translate(-cx, -(cy + 70));
      ctx.fillStyle = '#c8a24a';
      handParts(0, 0).forEach((p) => ctx.fill(p));
      ctx.restore();
    }
    const sk = ease.back(clamp((c.local - 1.3) / 0.3, 0, 1));
    if (sk > 0) seal('WORK WITH FUN', W / 2, 900, 38, '#a8402c', -0.06, sk * 0.9);
    text('套 印 · 一 版', 200, 260, { size: 22, fam: 'serif', color: '#4a4235', letterSpacing: 6 });
    text('GIVE ME FIVE', W - 200, 260, { size: 22, fam: 'mono', color: '#4a4235', align: 'right', letterSpacing: 5 });
    lyric(lineAt(c.t), c.t, PAL.ancient, { y: 900, size: 52, active: '#a8402c', accent: '#a8402c' });
    shotTag(c);
    fadeEdges(c);
  };

  // PPT 幻灯片堆叠
  LAYOUTS.slideDeck = function (c) {
    ctx.fillStyle = '#0b0b0c';
    ctx.fillRect(0, 0, W, H);
    const cur = Math.floor(c.local * 2.0) % 35;
    for (let i = 4; i >= 1; i--) {
      const s = 1 - i * 0.035;
      ctx.save();
      ctx.globalAlpha = 0.1 * (5 - i) / 4;
      ctx.translate(W / 2, H / 2 + 30); ctx.scale(s, s);
      ctx.fillStyle = c.pal.ink;
      ctx.fillRect(-600, -350, 1200, 700);
      ctx.restore();
    }
    ctx.save();
    ctx.translate(W / 2, H / 2 + 30);
    ctx.fillStyle = '#141416';
    ctx.fillRect(-600, -350, 1200, 700);
    ctx.strokeStyle = c.pal.line; ctx.lineWidth = 2;
    ctx.strokeRect(-600, -350, 1200, 700);
    text(`SLIDE ${String(cur + 1).padStart(2, '0')} / 35`, -560, -294, { size: 21, fam: 'mono', color: c.pal.dim, letterSpacing: 3 });
    ctx.fillStyle = c.pal.accent;
    ctx.fillRect(-560, -282, 1120, 2);
    const titles = ['WHY WE ARE SLOW', 'PROCESS MAP', 'ROOT CAUSE', 'ACTION PLAN', 'COST DOWN', 'QUALITY UP', 'NEXT STEP'];
    setFont(72, 'sans', 900);
    ctx.fillStyle = c.pal.ink;
    ctx.fillText(titles[cur % titles.length], -560, -166);
    const mode = cur % 3;
    if (mode === 0) {
      for (let i = 0; i < 7; i++) {
        const hh = 60 + Math.abs(Math.sin(i * 1.7 + cur)) * 240;
        ctx.fillStyle = i === cur % 7 ? c.pal.accent : 'rgba(242,239,230,0.32)';
        ctx.fillRect(-540 + i * 140, 250, 88, -hh);
      }
    } else if (mode === 1) {
      ctx.strokeStyle = c.pal.accent; ctx.lineWidth = 4;
      ctx.beginPath();
      for (let i = 0; i <= 40; i++) {
        const xx = -540 + i * 26;
        const yy = 190 - Math.sin(i * 0.35 + cur) * 110 - i * 3;
        i === 0 ? ctx.moveTo(xx, yy) : ctx.lineTo(xx, yy);
      }
      ctx.stroke();
    } else {
      ctx.beginPath();
      ctx.arc(120, 60, 140, -Math.PI / 2, -Math.PI / 2 + Math.PI * 2 * (0.3 + 0.4 * hash(cur)));
      ctx.strokeStyle = c.pal.accent; ctx.lineWidth = 38; ctx.stroke();
      ctx.beginPath();
      ctx.arc(120, 60, 140, 0, Math.PI * 2);
      ctx.strokeStyle = c.pal.line; ctx.lineWidth = 2; ctx.stroke();
    }
    text('CONFIDENTIAL · MARPOL', 560, 318, { size: 17, fam: 'mono', color: c.pal.dim, align: 'right', letterSpacing: 3 });
    ctx.restore();
    lyric(lineAt(c.t), c.t, c.pal, { y: H - 90, size: 46 });
    shotTag(c);
    fadeEdges(c);
  };

  // 名单核对（no-complaint）
  LAYOUTS.nameChecklist = function (c) {
    ctx.fillStyle = '#0b0b0c';
    ctx.fillRect(0, 0, W, H);
    const list = ['张三', '李四', '王五', '老曹', '小马', '你自己'];
    list.forEach((n, i) => {
      const kk = clamp((c.local - 0.3 - i * 0.42) / 0.5, 0, 1);
      if (kk <= 0) return;
      const y = 240 + i * 96;
      const last = i === list.length - 1;
      ctx.save();
      ctx.globalAlpha = kk * (last ? 1 : 0.55);
      text(n, 360, y, { size: 46, fam: 'sans', color: last ? c.pal.accent : c.pal.dim });
      ctx.restore();
      if (!last) {
        ctx.save();
        ctx.globalAlpha = kk * 0.8;
        ctx.strokeStyle = c.pal.accent;
        ctx.lineWidth = 2.5;
        ctx.beginPath();
        ctx.moveTo(240, y - 14); ctx.lineTo(254, y); ctx.lineTo(282, y - 30);
        ctx.stroke();
        ctx.restore();
      }
    });
    ctx.save();
    ctx.globalAlpha = 0.7;
    text('NO COMPLAINTS', W - 200, 470, { size: 24, fam: 'mono', color: c.pal.dim, align: 'right', letterSpacing: 10 });
    text('SINCE 1000 Y', W - 200, 508, { size: 24, fam: 'mono', color: c.pal.dim, align: 'right', letterSpacing: 10 });
    ctx.restore();
    lyric(lineAt(c.t), c.t, c.pal, { y: 880, size: 62, active: c.pal.accent, accent: c.pal.accent });
    shotTag(c);
    fadeEdges(c);
  };

  // 姓名条 / 工牌（14–20 段）
  LAYOUTS.badgePerson = function (c) {
    ctx.fillStyle = '#0b0b0c';
    ctx.fillRect(0, 0, W, H);
    grid(c.pal, { grid: 64, alpha: 0.05 });
    const p = c.p || { name: '老曹', role: '前辈', id: 'REC 0021', years: '20+', tickets: '1,204', stamp: '靠得住' };
    const k = ease.out(clamp(c.local / 0.9, 0, 1));
    // 左侧姓名条
    ctx.save();
    ctx.globalAlpha = k;
    ctx.fillStyle = c.pal.accent;
    ctx.fillRect(180, 220, 96, 640);
    ctx.fillStyle = '#0b0b0c';
    setFont(92, 'sans', 900);
    for (let i = 0; i < p.name.length; i++) {
      const kk = clamp((c.local - 0.3 - i * 0.14) / 0.35, 0, 1);
      if (kk <= 0) continue;
      ctx.globalAlpha = k * kk;
      ctx.fillText(p.name[i], 204, 320 + i * 108);
    }
    ctx.restore();
    // 记录卡
    ctx.save();
    ctx.globalAlpha = k;
    const cx = 460, cy = 240, cw = 1180, chh = 560;
    card(cx, cy, cw, chh, c.pal, { id: `${p.id} · ${p.role}`, rows: 6, alpha: k });
    field('NAME', p.name, cx + 30, cy + 126, cw - 60, c.pal, 30, k);
    field('ROLE', p.role, cx + 30, cy + 186, cw - 60, c.pal, 26, k);
    field('YEARS', p.years, cx + 30, cy + 240, cw - 60, c.pal, 26, k);
    field('TICKETS', p.tickets, cx + 30, cy + 294, cw - 60, c.pal, 26, k);
    field('STATUS', '在岗', cx + 30, cy + 348, cw - 60, c.pal, 26, k);
    ctx.restore();
    // 人像位：有照片压照片，没有就是「空框 + 两个字」
    if (window.PHOTO && window.PHOTO.portrait) {
      window.PHOTO.portrait(cx + cw - 320, cy + 96, 250, 310, {
        tone: 'dark',
        alpha: k,
        label: p.photoLabel || '待补',
        tag: p.badgeTag || 'ID PHOTO',
      });
    } else {
      ctx.save();
      ctx.globalAlpha = k * 0.45;
      ctx.fillStyle = c.pal.dim;
      ctx.beginPath();
      ctx.arc(cx + cw - 170, cy + 180, 62, Math.PI, 0);
      ctx.lineTo(cx + cw - 60, cy + 330);
      ctx.lineTo(cx + cw - 280, cy + 330);
      ctx.closePath();
      ctx.fill();
      ctx.restore();
    }
    const sk = ease.back(clamp((c.local - 1.1) / 0.3, 0, 1));
    if (sk > 0) seal(p.stamp, W - 300, 900, 40, c.pal.accent, -0.12, sk * 0.9);
    lyric(lineAt(c.t), c.t, c.pal, { x: 460, y: 900, size: 40, align: 'left' });
    shotTag(c);
    fadeEdges(c);
  };

  // finale：卓越路 + 一盏灯
  LAYOUTS.finaleRoad = function (c) {
    ctx.save();
    const g = ctx.createRadialGradient(W / 2, H * 0.62, 50, W / 2, H * 0.62, H * 1.1);
    g.addColorStop(0, '#1d1a12');
    g.addColorStop(0.5, '#0c0b09');
    g.addColorStop(1, '#040404');
    ctx.fillStyle = g;
    ctx.fillRect(0, 0, W, H);
    ctx.restore();
    // 路：透视线
    const k = ease.out(clamp(c.local / 2.5, 0, 1));
    ctx.save();
    ctx.globalAlpha = k * 0.5;
    ctx.strokeStyle = 'rgba(255,204,0,0.35)';
    ctx.lineWidth = 2;
    for (let i = -6; i <= 6; i++) {
      ctx.beginPath();
      ctx.moveTo(W / 2 + i * 44, H + 40);
      ctx.lineTo(W / 2 + i * 6, H * 0.52);
      ctx.stroke();
    }
    // 横向路砖
    for (let i = 1; i <= 14; i++) {
      const p = i / 14;
      const y = H - p * (H * 0.48);
      ctx.globalAlpha = k * 0.16 * (1 - p * 0.6);
      ctx.beginPath();
      ctx.moveTo(0, y);
      ctx.lineTo(W, y);
      ctx.stroke();
    }
    ctx.restore();
    // 尽头一盏灯
    const lk = ease.out(clamp((c.local - 0.6) / 2.2, 0, 1));
    if (lk > 0) {
      ctx.save();
      const lg = ctx.createRadialGradient(W / 2, H * 0.50, 4, W / 2, H * 0.50, 420 * lk);
      lg.addColorStop(0, 'rgba(255,240,200,0.95)');
      lg.addColorStop(0.12, 'rgba(255,214,90,0.5)');
      lg.addColorStop(1, 'rgba(255,200,60,0)');
      ctx.fillStyle = lg;
      ctx.fillRect(W / 2 - 460, H * 0.50 - 460, 920, 920);
      ctx.restore();
    }
    // 大字
    const tk = ease.out(clamp((c.local - 1.4) / 1.6, 0, 1));
    if (tk > 0) {
      ctx.save();
      ctx.globalAlpha = tk;
      setFont(150, 'sans', 900);
      ctx.fillStyle = '#f7f2e2';
      ctx.textAlign = 'center';
      ctx.fillText('卓越路', W / 2, H * 0.66);
      ctx.restore();
    }
    const l = lineAt(c.t);
    lyric(l, c.t, { ink: '#ffcc00', hot: '#ffffff', accent: '#ffcc00', dim: '#8b8577' }, { free: true, y: H * 0.80, size: 58, active: '#fff' });
    shotTag(c);
    fadeEdges(c);
  };

  window.LAYOUTS = LAYOUTS;
  window.LAYOUT_KITS = { card, field, seal, typed, asciiField, grid, lyric, shotTag, fadeEdges, paperBg, woodcutHills, M };
})();
