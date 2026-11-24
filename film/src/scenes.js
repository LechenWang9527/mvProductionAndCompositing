// film/src/scenes.js —— 23 个段落的画面
// 每段一个纯函数：draw(t, sec, pal) → 画面。所有动画量都由 t 直接算出。
// 世界观：一台跑了一千年的工单档案系统。人 = 记录。

(function () {
  const K = window.K;
  const { W, H, ctx, PAL, clamp, lerp, inv, ease, rnd, hash, text, setFont, measure,
    karaoke, lineIn, woodcutText, hatchTile, grainTile, halftone, scanlines,
    beatInfo, halfPulse, sectionAt, lineAt, ALL_LINES, SECTIONS, BEAT } = K;

  // ---------------- 共享图形部件 ----------------

  // 档案卡：一张带横线、编号、字段的记录卡
  function recordCard(x, y, w, h, pal, opts) {
    const o = opts || {};
    const rows = o.rows || 6;
    ctx.save();
    ctx.globalAlpha = o.alpha == null ? 1 : o.alpha;
    // 卡面
    ctx.fillStyle = o.fill || 'rgba(255,255,255,0.03)';
    ctx.fillRect(x, y, w, h);
    ctx.strokeStyle = o.stroke || pal.line;
    ctx.lineWidth = 1.5;
    ctx.strokeRect(x + 0.5, y + 0.5, w, h);
    // 顶部编号条
    if (o.id) {
      ctx.fillStyle = o.idColor || pal.accent;
      ctx.fillRect(x, y, w, 34);
      text(o.id, x + 14, y + 24, { size: 19, fam: 'mono', color: pal.bg, letterSpacing: 2 });
    }
    // 内容横线
    const top = y + (o.id ? 34 : 0) + 26;
    const step = (h - (top - y) - 26) / rows;
    ctx.globalAlpha = (o.alpha == null ? 1 : o.alpha) * 0.5;
    ctx.fillStyle = pal.line;
    for (let i = 0; i < rows; i++) {
      const yy = top + i * step;
      if (yy > y + h - 16) break;
      ctx.fillRect(x + 18, yy, w - 36, 1);
    }
    ctx.restore();
  }

  // 字段行：KEY ......... VALUE
  function fieldRow(k, v, x, y, w, pal, size, alpha) {
    const s = size || 21;
    text(k, x, y, { size: s, fam: 'mono', color: pal.dim, alpha: alpha == null ? 1 : alpha });
    const kw = measure(k, s, 'mono');
    text(v, x + w, y, { size: s, fam: 'mono', color: pal.ink, align: 'right', alpha: alpha == null ? 1 : alpha });
    // 点点点
    const vx = x + w - measure(v, s, 'mono');
    ctx.save();
    ctx.globalAlpha = (alpha == null ? 1 : alpha) * 0.35;
    ctx.fillStyle = pal.dim;
    const gapStart = x + kw + 12, gapEnd = vx - 12;
    if (gapEnd > gapStart) {
      for (let i = gapStart; i < gapEnd; i += 7) ctx.fillRect(i, y - s * 0.28, 2, 2);
    }
    ctx.restore();
  }

  // ASCII 字符场：起伏的字符丘陵
  function asciiField(t, pal, opts) {
    const o = opts || {};
    const cw = o.cw || 18, ch = o.ch || 26;
    const cols = Math.ceil(W / cw), rows = Math.ceil(H / ch);
    const glyphs = o.glyphs || '·-=/\\|+*';
    ctx.save();
    ctx.globalAlpha = o.alpha == null ? 0.5 : o.alpha;
    setFont(ch * 0.86, 'mono');
    ctx.fillStyle = o.color || pal.dim;
    const amp = o.amp == null ? 60 : o.amp;
    for (let r = 0; r < rows; r++) {
      for (let c = 0; c < cols; c++) {
        const ph = c * 0.16 + r * 0.05;
        const v = Math.sin(ph + t * 1.4) * Math.cos(ph * 0.6 - t * 0.9);
        const lvl = Math.abs(v);
        if (lvl < (o.cut == null ? 0.35 : o.cut)) continue;
        const g = glyphs[Math.floor(lvl * glyphs.length) % glyphs.length];
        ctx.fillText(g, c * cw, r * ch + amp * v * 0.15);
      }
    }
    ctx.restore();
  }

  // 蓝图线稿：网格 + 标注 + 虚线
  function blueprintGrid(t, pal, opts) {
    const o = opts || {};
    const gs = o.grid || 40;
    ctx.save();
    ctx.globalAlpha = o.alpha == null ? 0.18 : o.alpha;
    ctx.strokeStyle = o.color || pal.line;
    ctx.lineWidth = 1;
    const ox = ((t * (o.drift || 6)) % gs);
    for (let x = -ox; x < W; x += gs) { ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x, H); ctx.stroke(); }
    for (let y = 0; y < H; y += gs) { ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(W, y); ctx.stroke(); }
    ctx.restore();
  }

  // 印章 / 图章（方框 + 文字，朱砂或黄）
  function stamp(str, x, y, size, color, rot, alpha) {
    ctx.save();
    ctx.translate(x, y);
    ctx.rotate(rot || 0);
    ctx.globalAlpha = alpha == null ? 0.9 : alpha;
    ctx.strokeStyle = color;
    ctx.lineWidth = Math.max(2, size * 0.09);
    const w = measure(str, size, 'sans', 900) + size * 0.7;
    const h = size * 1.5;
    ctx.strokeRect(-w / 2, -h / 2, w, h);
    setFont(size, 'sans', 900);
    ctx.fillStyle = color;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(str, 0, size * 0.04);
    ctx.restore();
    ctx.textBaseline = 'alphabetic';
  }

  // 打字的文本：前 n 个字符可见 + 光标
  function typed(str, x, y, count, pal, o) {
    const s = str.slice(0, Math.max(0, Math.floor(count)));
    text(s, x, y, Object.assign({ fam: 'mono', size: 22, color: pal.ink }, o));
    const w = measure(s, (o && o.size) || 22, 'mono');
    const on = Math.floor(count * 2) % 2 === 0 || count % 1 > 0.05;
    if (on) {
      ctx.fillStyle = (o && o.cursorColor) || pal.accent;
      ctx.fillRect(x + w + 3, y - ((o && o.size) || 22) * 0.78, ((o && o.size) || 22) * 0.5, ((o && o.size) || 22) * 0.95);
    }
  }

  // 纸条 / 工单：一条细长横条，带编号
  function slip(x, y, w, h, label, pal, alpha, accentRight) {
    ctx.save();
    ctx.globalAlpha = alpha == null ? 1 : alpha;
    ctx.fillStyle = 'rgba(255,255,255,0.045)';
    ctx.fillRect(x, y, w, h);
    ctx.strokeStyle = pal.line;
    ctx.strokeRect(x + 0.5, y + 0.5, w, h);
    ctx.fillStyle = accentRight || pal.accent;
    ctx.fillRect(x, y, 4, h);
    text(label, x + 18, y + h * 0.68, { size: h * 0.42, fam: 'mono', color: pal.ink, alpha: 0.9 });
    ctx.restore();
  }

  // 波形条：用 RMS 数据画能量柱
  function waveBars(t, pal, opts) {
    const o = opts || {};
    const rms = K.TL.rms || [];
    const win = K.TL.rmsWin || 0.5;
    const n = o.n || 96;
    const bw = W * (o.widthRatio || 0.72) / n;
    const bx = (W - bw * n) / 2;
    const baseY = o.y || H * 0.72;
    const tWin = clamp(Math.floor(t / win), 1, rms.length - 1);
    ctx.save();
    for (let i = 0; i < n; i++) {
      const k = tWin - n + i;
      const v = rms[k] != null ? rms[k] : 0;
      const hh = clamp(v, 0, 1) * (o.amp || 220);
      const x = bx + i * bw;
      const grad = o.color || pal.accent;
      ctx.globalAlpha = (o.alpha == null ? 0.8 : o.alpha) * (0.35 + 0.65 * (i / n));
      ctx.fillStyle = grad;
      ctx.fillRect(x + bw * 0.18, baseY - hh / 2, bw * 0.64, Math.max(2, hh));
    }
    ctx.restore();
  }

  // 大字：台账式编号水印
  function ghostNumber(str, x, y, size, pal, alpha) {
    ctx.save();
    ctx.globalAlpha = alpha == null ? 0.06 : alpha;
    setFont(size, 'sans', 900);
    ctx.fillStyle = pal.ink;
    ctx.fillText(str, x, y);
    ctx.restore();
  }

  // 扫描光带：一条竖线从画面扫过（每拍一次）
  function scanSweep(t, pal, color, speed) {
    const bi = beatInfo(t);
    const x = ((t * (speed || 380)) % (W + 400)) - 200;
    ctx.save();
    const g = ctx.createLinearGradient(x - 90, 0, x + 90, 0);
    g.addColorStop(0, 'rgba(0,0,0,0)');
    g.addColorStop(0.5, color || 'rgba(255,255,255,0.10)');
    g.addColorStop(1, 'rgba(0,0,0,0)');
    ctx.fillStyle = g;
    ctx.globalAlpha = 0.8;
    ctx.fillRect(x - 90, 0, 180, H);
    ctx.restore();
  }

  // ---------------- 歌词版式（按段落轮换） ----------------

  // A. 大居中衬线 + 逐字高亮（最常用的抒情版式）
  function lyricCenter(line, t, pal, y, size, opts) {
    const o = opts || {};
    if (!line) return;
    const k = ease.out(inv(line.start - 0.3, line.start + 0.12, t));
    ctx.save();
    ctx.globalAlpha = k;
    karaoke(line, t, {
      x: W / 2, y: y + (1 - k) * 24, align: 'center',
      size: size || 96, fam: o.fam || 'serif', weight: o.weight || 700,
      color: pal.ink, activeColor: o.activeColor || pal.hot,
      accent: o.accent || pal.accent, gap: o.gap == null ? 10 : o.gap,
    });
    ctx.restore();
  }

  // B. 左下角 mono 台账体：像字幕枪，信息密度高
  function lyricLedger(line, t, pal, x, y, size) {
    if (!line) return;
    const k = ease.out(inv(line.start - 0.2, line.start + 0.1, t));
    ctx.save();
    ctx.globalAlpha = k;
    // 左侧竖线
    ctx.fillStyle = pal.accent;
    ctx.fillRect(x - 26, y - (size || 40) * 0.95, 3, (size || 40) * 1.25);
    karaoke(line, t, {
      x, y, size: size || 40, fam: 'mono', weight: 500,
      color: pal.ink, activeColor: pal.hot, accent: pal.accent, gap: 4,
    });
    ctx.restore();
  }

  // C. 竖排（古代段）：从右向左、从上到下
  function lyricVertical(line, t, pal, x, top, size, step) {
    if (!line) return;
    const chars = line.chars;
    const s = size || 92, gap = step || (s * 1.12);
    // 多列：每列 8 字
    const perCol = 7;
    const cols = Math.ceil(chars.length / perCol);
    for (let i = 0; i < chars.length; i++) {
      const col = cols - 1 - Math.floor(i / perCol);
      const row = i % perCol;
      const cx = x - col * (s * 1.3);
      const cy = top + row * gap;
      const k = ease.out(inv(chars[i].t - 0.12, chars[i].t + 0.1, t));
      if (k <= 0) continue;
      const active = t >= chars[i].t && (i === chars.length - 1 || t < chars[i + 1].t);
      ctx.save();
      ctx.globalAlpha = k;
      setFont(s, 'serif', 700);
      ctx.fillStyle = active ? pal.accent : pal.ink;
      ctx.fillText(chars[i].c, cx, cy);
      // 竖排下的走墨：字下方一点朱砂
      if (active) {
        ctx.globalAlpha = k * 0.8;
        ctx.fillStyle = pal.accent;
        ctx.fillRect(cx + s * 0.12, cy + s * 0.22, s * 0.62, 3);
      }
      ctx.restore();
    }
  }

  // D. 顶部横条（终端段）：一条黑带，白字逐字跳
  function lyricBanner(line, t, pal, y, h) {
    if (!line) return;
    const hh = h || 96, yy = y == null ? H - 210 : y;
    const k = ease.out(inv(line.start - 0.2, line.start + 0.15, t));
    ctx.save();
    ctx.globalAlpha = 0.82 * k;
    ctx.fillStyle = 'rgba(0,0,0,0.55)';
    ctx.fillRect(0, yy - hh * 0.72, W, hh);
    ctx.globalAlpha = 0.5 * k;
    ctx.fillStyle = pal.accent;
    ctx.fillRect(0, yy - hh * 0.72, W, 2);
    ctx.restore();
    ctx.save();
    ctx.globalAlpha = k;
    karaoke(line, t, {
      x: W / 2, y: yy, align: 'center', size: 54, fam: 'sans', weight: 700,
      color: pal.ink, activeColor: pal.hot, accent: pal.accent, gap: 6,
    });
    ctx.restore();
  }

  // ---------------- 段落渲染器 ----------------

  const SCENES = {};

  // 00 hook：系统开机，档案首次被检索
  SCENES[0] = function (t, sec, pal) {
    const local = t - sec.start;
    // 背景：细网格 + 缓慢扫描
    blueprintGrid(t, pal, { grid: 60, alpha: 0.10 });
    ghostNumber('0001', W - 620, H - 90, 420, pal, 0.05);
    scanSweep(t, pal, 'rgba(200,162,74,0.06)', 260);

    // 开机日志（0–9s）
    const log = [
      'ARCHIVE KERNEL  v1.0.0  (build 1000Y)',
      'mounting  /records/people ......... OK',
      'mounting  /records/ledger ......... OK',
      'scanning  1,000 years of tickets ...',
      'index     THE OGS ................ 1 hit',
      'locating  subject ................. RUNNING',
    ];
    if (local < 10) {
      const n = Math.min(log.length, Math.floor(local / 1.15) + 1);
      for (let i = 0; i < n; i++) {
        const k = clamp((local - i * 1.15) / 0.5, 0, 1);
        text(log[i], 120, 300 + i * 46, { size: 24, fam: 'mono', color: i === n - 1 ? pal.accent : pal.dim, alpha: k * 0.9 });
      }
    }

    // 第一句：检索命中的档案卡
    const l0 = sec.lines[0];
    if (t >= l0.start - 2.2) {
      const k = ease.out(inv(l0.start - 2.2, l0.start - 0.6, t));
      const cw = 760, chh = 380;
      const cx = W / 2 - cw / 2, cy = H / 2 - chh / 2 + 30;
      ctx.save();
      ctx.globalAlpha = k;
      recordCard(cx, cy, cw, chh, pal, { id: 'REC · 0001 · THE OGS', rows: 5, alpha: k });
      fieldRow('SUBJECT', 'THE OGS / 过来人', cx + 26, cy + 110, cw - 52, pal, 22, k);
      fieldRow('SPAN', '1000 Y', cx + 26, cy + 152, cw - 52, pal, 22, k);
      fieldRow('STATUS', 'ACTIVE', cx + 26, cy + 194, cw - 52, pal, 22, k);
      fieldRow('TICKETS', '0002 OPEN', cx + 26, cy + 236, cw - 52, pal, 22, k);
      ctx.restore();
      // 卡下方一句：我就是那个被检索的人
      lyricCenter(l0, t, pal, cy + chh + 130, 84);
    }
    // 第二句：横贯整幅的一行小字
    const l1 = sec.lines[1];
    if (l1 && t >= l1.start - 0.4) {
      const k = ease.out(inv(l1.start - 0.4, l1.start + 0.3, t));
      ctx.save();
      ctx.globalAlpha = k * 0.95;
      karaoke(l1, t, {
        x: 120, y: H - 190, size: 46, fam: 'serif', weight: 500,
        color: pal.dim, activeColor: pal.ink, accent: pal.accent, gap: 5,
      });
      ctx.restore();
    }
  };

  // 01 dufu：杜甫 —— 从一张驿站登记簿开始
  SCENES[1] = function (t, sec, pal) {
    const local = t - sec.start;
    // 宣纸底 + 木刻山影
    ctx.save();
    const g = ctx.createLinearGradient(0, 0, 0, H);
    g.addColorStop(0, '#e3d9c2');
    g.addColorStop(0.55, '#d9cfb8');
    g.addColorStop(1, '#c9bda2');
    ctx.fillStyle = g;
    ctx.fillRect(0, 0, W, H);
    ctx.restore();

    // 墨色山峦：三层剪影，用排线上墨
    const layers = [
      { y: H * 0.52, amp: 70, col: '#8f8570', al: 0.55, sp: 12, ang: 28 },
      { y: H * 0.60, amp: 54, col: '#6d6350', al: 0.7, sp: 9, ang: 34 },
      { y: H * 0.70, amp: 40, col: '#4a4235', al: 0.85, sp: 7, ang: 40 },
    ];
    layers.forEach((L, li) => {
      ctx.save();
      ctx.beginPath();
      ctx.moveTo(0, H);
      for (let x = 0; x <= W; x += 12) {
        const yy = L.y + Math.sin(x * 0.0032 + li * 2.1) * L.amp + Math.sin(x * 0.011 + li) * L.amp * 0.35;
        ctx.lineTo(x, yy);
      }
      ctx.lineTo(W, H);
      ctx.closePath();
      ctx.save();
      ctx.clip();
      ctx.fillStyle = L.col;
      ctx.globalAlpha = L.al * 0.30;
      ctx.fillRect(0, 0, W, H);
      ctx.globalAlpha = L.al * 0.55;
      ctx.drawImage(hatchTile(L.ang, L.sp, W, H, L.col, 0.55, 3), 0, 0, W, H);
      ctx.restore();
      ctx.restore();
    });

    // 右上：木刻大字「杜甫」（右对齐到版心边，垂直居中偏上）
    const nameIn = ease.out(inv(sec.start + 0.3, sec.start + 2.0, t));
    ctx.save();
    ctx.globalAlpha = nameIn;
    woodcutText('杜甫', W - 140, 470, 200, [
      { angle: 15, spacing: 5, color: 'rgba(217,207,184,0.55)', alpha: 1 },
      { angle: 105, spacing: 9, color: 'rgba(217,207,184,0.30)', alpha: 1 },
    ], { alpha: nameIn, fam: 'serif', align: 'right', baseColor: '#17130f' });
    ctx.restore();
    // 编号说明：右对齐同一版心边
    text('TANG · 工部员外郎 · REC 0007', W - 140, 530, { size: 20, fam: 'mono', color: '#6b5f4c', alpha: nameIn, align: 'right', letterSpacing: 2 });
    // 一枚朱砂小印压在名字下方
    if (nameIn > 0.6) stamp('少陵野老', W - 210, 610, 30, '#a8402c', 0.06, (nameIn - 0.6) * 2.5 * 0.85);

    // 左侧登记簿：逐行写下
    const book = local > 2.4;
    if (book) {
      const rows = [
        ['迁移次数', '11'],
        ['租赁', '0 套自有'],
        ['抵押', 'NONE'],
        ['备注', '屋漏，连夜修'],
      ];
      const k0 = ease.out(inv(sec.start + 2.4, sec.start + 3.6, t));
      ctx.save();
      ctx.globalAlpha = k0;
      ctx.fillStyle = 'rgba(255,252,240,0.55)';
      ctx.fillRect(140, 300, 520, 300);
      ctx.strokeStyle = '#a99a80';
      ctx.strokeRect(140.5, 300.5, 520, 300);
      text('迁 徙 登 记 簿', 168, 348, { size: 26, fam: 'serif', color: '#17130f', letterSpacing: 6 });
      rows.forEach((r, i) => {
        const k = clamp((t - (sec.start + 2.8 + i * 0.75)) / 0.5, 0, 1);
        if (k <= 0) return;
        fieldRow(r[0], r[1], 168, 408 + i * 46, 464, PAL.ancient, 22, k);
      });
      ctx.restore();
    }

    // 歌词：竖排，落在版面中右（避开木刻名字与左侧登记簿）
    const l = lineAt(t);
    if (l && l.section === sec.name) {
      lyricVertical(l, t, PAL.ancient, 1180, 200, 74, 84);
    }
  };

  // 02 dufu-son：孩子出生 —— 一条新增的户籍记录，茅屋被画成蓝图
  SCENES[2] = function (t, sec, pal) {
    const local = t - sec.start;
    ctx.save();
    ctx.fillStyle = '#e6dcc6';
    ctx.fillRect(0, 0, W, H);
    ctx.restore();
    blueprintGrid(t, { line: '#a99a80' }, { grid: 44, alpha: 0.22, drift: 3 });

    // 茅屋图示：线稿慢慢被"画"出来
    const k = ease.out(inv(sec.start + 0.4, sec.start + 3.4, t));
    ctx.save();
    ctx.globalAlpha = 0.9;
    ctx.strokeStyle = '#3a3226';
    ctx.lineWidth = 2.5;
    const bx = 1180, by = 660, bw = 480, bh = 250;
    // 屋身
    ctx.beginPath();
    ctx.moveTo(bx, by + bh);
    ctx.lineTo(bx, by + bh - bh * k);
    ctx.moveTo(bx + bw, by + bh);
    ctx.lineTo(bx + bw, by + bh - bh * k);
    ctx.stroke();
    // 屋顶（三角，随 k 展开）
    if (k > 0.3) {
      const kk = ease.out(inv(sec.start + 1.6, sec.start + 3.8, t));
      ctx.beginPath();
      ctx.moveTo(bx - 40, by + 10);
      ctx.lineTo(bx + bw / 2, by + 10 - 130 * kk);
      ctx.lineTo(bx + bw + 40, by + 10);
      ctx.stroke();
      // 茅草：屋顶上的短斜线
      ctx.lineWidth = 1.4;
      ctx.globalAlpha = 0.55 * kk;
      for (let i = 0; i < 26; i++) {
        const p = i / 26;
        const rx = bx - 30 + p * (bw + 60);
        const ry = by + 10 - (1 - Math.abs(p - 0.5) * 2) * 130 * kk;
        ctx.beginPath();
        ctx.moveTo(rx, ry);
        ctx.lineTo(rx + 10, ry + 22);
        ctx.stroke();
      }
    }
    ctx.restore();
    // 标注
    text('FIG.2 — 茅屋 · 剖面', bx - 40, by + 60, { size: 20, fam: 'mono', color: '#6b5f4c', alpha: k });
    text('AREA 9.8 m²  ·  LEAKS 3 ', bx - 40, by + bh + 52, { size: 18, fam: 'mono', color: '#6b5f4c', alpha: k });

    // 新增记录：一张很小的卡浮在左下
    const l0 = sec.lines[0];
    if (t >= l0.start - 1.6) {
      const kk = ease.out(inv(l0.start - 1.6, l0.start + 0.4, t));
      ctx.save();
      ctx.globalAlpha = kk;
      ctx.translate(300, 470 + (1 - kk) * -18);
      ctx.rotate(-0.02);
      recordCard(-150, -110, 320, 220, PAL.ancient, { id: 'NEW · REC', rows: 4, fill: 'rgba(255,252,240,0.72)', alpha: kk });
      fieldRow('DATE', '760 AD', -124, -30, 268, PAL.ancient, 20, kk);
      fieldRow('EVENT', 'BORN', -124, 10, 268, PAL.ancient, 20, kk);
      fieldRow('PARENT', 'DU FU', -124, 50, 268, PAL.ancient, 20, kk);
      ctx.restore();
    }

    // 歌词：横排衬线压在下方
    const l = lineAt(t);
    if (l && l.section === sec.name) lyricCenter(l, t, PAL.ancient, 880, 70, { activeColor: '#a8402c', accent: '#a8402c' });
  };

  // 03 hook：系统重新索引 —— 副歌回来
  SCENES[3] = function (t, sec, pal) {
    ctx.save();
    ctx.fillStyle = '#07080a';
    ctx.fillRect(0, 0, W, H);
    ctx.restore();
    // 大量横向滚动条：索引重建
    const n = 26;
    for (let i = 0; i < n; i++) {
      const y = 140 + i * 34;
      const sp = 60 + (i % 5) * 40;
      const x = ((t * sp + i * 137) % (W + 700)) - 350;
      const w = 180 + (i % 4) * 210;
      const a = 0.05 + ((i * 7) % 10) / 120;
      ctx.save();
      ctx.globalAlpha = a;
      ctx.fillStyle = i % 3 === 0 ? pal.accent : pal.ink;
      ctx.fillRect(x, y, w, 3);
      ctx.restore();
    }
    // 中心：一行巨大的编号在跳动
    const bi = beatInfo(t);
    const k = ease.out(inv(sec.start, sec.start + 1.2, t));
    ctx.save();
    ctx.globalAlpha = k * (0.10 + bi.pulse * 0.10);
    setFont(300, 'mono', 700);
    ctx.fillStyle = pal.accent;
    ctx.textAlign = 'center';
    ctx.fillText(String(1000 + bi.n), W / 2, H / 2 + 60);
    ctx.restore();
    // 歌词：两句交错
    const l = lineAt(t);
    if (l && l.section === sec.name) {
      const idx = sec.lines.indexOf(l);
      if (idx % 2 === 0) lyricCenter(l, t, pal, 560, 96);
      else lyricLedger(l, t, pal, 280, 820, 46);
    }
  };

  // 04 liubang：刘邦 —— 47 岁的亭长，牌还没发完
  SCENES[4] = function (t, sec, pal) {
    // 半调 + 大印 + 工牌
    ctx.save();
    ctx.fillStyle = '#d9cfb8';
    ctx.fillRect(0, 0, W, H);
    ctx.restore();

    // 半调网点太阳（红）
    const cx = W * 0.72, cy = H * 0.34, R = 250;
    ctx.save();
    ctx.globalAlpha = 0.85;
    ctx.beginPath(); ctx.arc(cx, cy, R, 0, Math.PI * 2); ctx.clip();
    ctx.fillStyle = '#c9432c';
    ctx.fillRect(cx - R, cy - R, R * 2, R * 2);
    ctx.globalCompositeOperation = 'destination-out';
    ctx.globalAlpha = 1;
    for (let yy = cy - R; yy < cy + R; yy += 13) {
      for (let xx = cx - R; xx < cx + R; xx += 13) {
        const d = Math.hypot(xx - cx, yy - cy) / R;
        const r = 5.2 * d;
        ctx.beginPath(); ctx.arc(xx, yy, r, 0, Math.PI * 2); ctx.fill();
      }
    }
    ctx.restore();

    // 工牌：47 岁 · 亭长 · 编号
    const k = ease.out(inv(sec.start + 0.2, sec.start + 1.8, t));
    ctx.save();
    ctx.globalAlpha = k;
    ctx.translate(420, 470);
    ctx.rotate(-0.035);
    // 挂绳
    ctx.strokeStyle = '#17130f'; ctx.lineWidth = 3;
    ctx.beginPath(); ctx.moveTo(-40, -300); ctx.lineTo(0, -170); ctx.lineTo(40, -300); ctx.stroke();
    ctx.fillStyle = '#f3ecdb';
    ctx.fillRect(-260, -170, 520, 340);
    ctx.strokeStyle = '#17130f'; ctx.lineWidth = 2.5;
    ctx.strokeRect(-260, -170, 520, 340);
    text('亭 长', -230, -96, { size: 62, fam: 'serif', color: '#17130f', letterSpacing: 14 });
    text('LIU BANG', -230, -40, { size: 30, fam: 'mono', color: '#a8402c', letterSpacing: 5 });
    ctx.fillStyle = '#17130f';
    ctx.fillRect(-230, -20, 460, 2);
    fieldRow('AGE', '47', -230, 40, 460, PAL.ancient, 26, 1);
    fieldRow('POST', '亭长', -230, 90, 460, PAL.ancient, 26, 1);
    fieldRow('BADGE', '未发放', -230, 140, 460, PAL.ancient, 26, 1);
    ctx.restore();

    // 印章：慢慢压下
    const sk = ease.back(inv(sec.start + 3.0, sec.start + 3.6, t));
    if (sk > 0) stamp('尚未受命', W - 330, 760, 46, '#a8402c', -0.16, sk * 0.9);

    const l = lineAt(t);
    if (l && l.section === sec.name) lyricCenter(l, t, PAL.ancient, 900, 78, { activeColor: '#a8402c', accent: '#a8402c' });
  };

  // 05 you-too：你也一样 —— 两张卡对照
  SCENES[5] = function (t, sec, pal) {
    ctx.save(); ctx.fillStyle = pal.bg; ctx.fillRect(0, 0, W, H); ctx.restore();
    blueprintGrid(t, pal, { grid: 80, alpha: 0.06 });
    const k = ease.out(inv(sec.start + 0.1, sec.start + 1.4, t));
    const cw = 620, chh = 420, cy = H / 2 - chh / 2;
    // 左：古人
    ctx.save(); ctx.globalAlpha = k;
    recordCard(180, cy, cw, chh, PAL.ancient, { id: 'REC 0007 · 唐', rows: 5, fill: 'rgba(217,207,184,0.9)', stroke: '#a99a80', alpha: k, idColor: '#a8402c' });
    fieldRow('WHO', '杜甫', 206, cy + 120, cw - 52, PAL.ancient, 26, k);
    fieldRow('AGE', '47', 206, cy + 166, cw - 52, PAL.ancient, 26, k);
    fieldRow('MONEY', '租屋', 206, cy + 212, cw - 52, PAL.ancient, 26, k);
    fieldRow('MOOD', '想哭', 206, cy + 258, cw - 52, PAL.ancient, 26, k);
    ctx.restore();
    // 右：你
    ctx.save(); ctx.globalAlpha = k;
    recordCard(1120, cy, cw, chh, pal, { id: 'REC 0001 · 今', rows: 5, alpha: k });
    fieldRow('WHO', '你', 1146, cy + 120, cw - 52, pal, 26, k);
    fieldRow('AGE', '??', 1146, cy + 166, cw - 52, pal, 26, k);
    fieldRow('MONEY', '房贷', 1146, cy + 212, cw - 52, pal, 26, k);
    fieldRow('MOOD', '同款', 1146, cy + 258, cw - 52, pal, 26, k);
    ctx.restore();
    // 中间等号
    ctx.save();
    ctx.globalAlpha = k * (0.5 + beatInfo(t).pulse * 0.5);
    setFont(150, 'mono', 700);
    ctx.fillStyle = pal.accent;
    ctx.textAlign = 'center';
    ctx.fillText('=', W / 2, cy + chh / 2 + 30);
    ctx.restore();
    // 一条连线
    ctx.save();
    ctx.globalAlpha = k * 0.5;
    ctx.strokeStyle = pal.accent;
    ctx.setLineDash([8, 10]);
    ctx.beginPath(); ctx.moveTo(180 + cw, cy + chh / 2); ctx.lineTo(1120, cy + chh / 2); ctx.stroke();
    ctx.restore();

    const l = lineAt(t);
    if (l && l.section === sec.name) lyricBanner(l, t, pal, H - 170, 120);
  };

  // 06 war：打了千年仗 —— 战报流水
  SCENES[6] = function (t, sec, pal) {
    ctx.save(); ctx.fillStyle = '#05080a'; ctx.fillRect(0, 0, W, H); ctx.restore();
    asciiField(t, pal, { alpha: 0.16, amp: 40, cut: 0.55, color: '#1f4a3a' });
    // 战报：每 0.35s 刷一条
    const rows = [
      'BATTLE 0001  胜  伤亡 0',
      'BATTLE 0002  胜  伤亡 0',
      'BATTLE 0003  败  重来',
      'BATTLE 0004  胜  伤亡 0',
      'BATTLE 0005  平  待续',
      'BATTLE 0006  胜  伤亡 0',
      'BATTLE 0007  胜  伤亡 1',
    ];
    const local = t - sec.start;
    const cur = Math.floor(local / 0.42);
    for (let i = 0; i < 7; i++) {
      const idx = cur - 6 + i;
      if (idx < 0) continue;
      const r = rows[((idx % rows.length) + rows.length) % rows.length];
      const y = 360 + i * 62;
      const a = 0.25 + 0.75 * (i / 7);
      text(r, 200, y, { size: 26, fam: 'mono', color: i === 6 ? pal.hot : pal.ink, alpha: a });
    }
    text('累计参战 1000 年', 200, 300, { size: 20, fam: 'mono', color: pal.dim, letterSpacing: 4 });
    // 右侧：一条竖着的年限尺
    const x = W - 240;
    ctx.save();
    ctx.globalAlpha = 0.5; ctx.strokeStyle = pal.line;
    ctx.beginPath(); ctx.moveTo(x, 200); ctx.lineTo(x, H - 200); ctx.stroke();
    for (let i = 0; i <= 40; i++) {
      const yy = 200 + i * (H - 400) / 40;
      ctx.fillStyle = i % 10 === 0 ? pal.accent : pal.dim;
      ctx.fillRect(x, yy, i % 10 === 0 ? 26 : 12, 1.6);
    }
    ctx.restore();
    const l = lineAt(t);
    if (l && l.section === sec.name) lyricLedger(l, t, pal, 200, H - 200, 44);
  };

  // 07 ledger：账本 —— 表格生长
  SCENES[7] = function (t, sec, pal) {
    ctx.save(); ctx.fillStyle = '#05080a'; ctx.fillRect(0, 0, W, H); ctx.restore();
    // 表格
    const x0 = 170, y0 = 250, cw = 1580, rh = 54, rows = 11;
    const cols = [0, 0.10, 0.55, 0.78, 1.0];
    const heads = ['#', 'DATE', 'ITEM', 'COST', 'OK?'];
    ctx.save();
    ctx.globalAlpha = 0.9;
    ctx.fillStyle = pal.accent;
    ctx.fillRect(x0, y0, cw, 3);
    heads.forEach((h, i) => text(h, x0 + cols[i] * cw + 8, y0 - 16, { size: 20, fam: 'mono', color: pal.dim, letterSpacing: 2 }));
    const items = [
      ['出租屋', '3 两', 'OK'], ['旧书', '1 两', 'OK'], ['酒', '0.5 两', 'OK'],
      ['药', '2 两', 'NO'], ['灯油', '0.2 两', 'OK'], ['房租', '5 两', 'NO'],
      ['车马', '1 两', 'OK'], ['纸墨', '0.8 两', 'OK'], ['冬衣', '4 两', 'NO'],
      ['米', '2 两', 'OK'], ['修补屋顶', '3 两', 'NO'],
    ];
    for (let i = 0; i < rows; i++) {
      const k = ease.out(inv(sec.start + 0.15 + i * 0.34, sec.start + 0.55 + i * 0.34, t));
      if (k <= 0) continue;
      const y = y0 + 34 + i * rh;
      ctx.globalAlpha = k * 0.9;
      ctx.fillStyle = pal.line;
      ctx.fillRect(x0, y + 16, cw, 1);
      const it = items[i % items.length];
      const vals = [String(i + 1).padStart(3, '0'), `76${(i % 9) + 1}`, it[0], it[1], it[2]];
      vals.forEach((v, ci) => {
        text(v, x0 + cols[ci] * cw + 8, y, {
          size: 23, fam: 'mono',
          color: ci === 4 ? (v === 'OK' ? pal.accent : pal.err) : pal.ink,
          alpha: k,
        });
      });
    }
    ctx.restore();
    const l = lineAt(t);
    if (l && l.section === sec.name) lyricBanner(l, t, pal, H - 150, 116);
  };

  // 08 wind：大风起兮云飞扬 —— 木刻大旗
  SCENES[8] = function (t, sec, pal) {
    ctx.save(); ctx.fillStyle = '#d9cfb8'; ctx.fillRect(0, 0, W, H); ctx.restore();
    // 风：横向排线随 t 位移
    for (let i = 0; i < 3; i++) {
      const a = ctx.globalAlpha;
      ctx.save();
      ctx.globalAlpha = 0.20 - i * 0.05;
      ctx.drawImage(hatchTile(2 + i * 3, 6 + i * 3, W, H, '#17130f', 0.5, 2), -((t * (300 + i * 160)) % W), 0, W, H);
      ctx.drawImage(hatchTile(2 + i * 3, 6 + i * 3, W, H, '#17130f', 0.5, 2), -((t * (300 + i * 160)) % W) + W, 0, W, H);
      ctx.restore();
    }
    // 大旗：一块被风吹鼓的布，上面是大字
    const k = ease.out(inv(sec.start + 0.2, sec.start + 2.0, t));
    const flagX = 260, flagY = 220, flagW = 1400, flagH = 620;
    ctx.save();
    ctx.globalAlpha = k;
    ctx.beginPath();
    ctx.moveTo(flagX, flagY);
    for (let x = 0; x <= flagW; x += 14) {
      const wav = Math.sin(x * 0.006 + t * 5.2) * 22 + Math.sin(x * 0.013 - t * 3.1) * 9;
      ctx.lineTo(flagX + x, flagY + wav);
    }
    for (let x = flagW; x >= 0; x -= 14) {
      const wav = Math.sin(x * 0.006 + t * 5.2 - 1.2) * 22;
      ctx.lineTo(flagX + x, flagY + flagH + wav);
    }
    ctx.closePath();
    ctx.fillStyle = '#a8402c';
    ctx.fill();
    ctx.globalAlpha = k * 0.35;
    ctx.save(); ctx.clip();
    ctx.drawImage(hatchTile(20, 10, W, H, '#17130f', 0.6, 4), 0, 0, W, H);
    ctx.restore();
    ctx.restore();
    // 旗上字：两行，上四下三
    ctx.save();
    ctx.globalAlpha = k;
    setFont(120, 'serif', 700);
    ctx.fillStyle = '#f3ecdb';
    ['大', '风', '起', '兮'].forEach((c, i) => {
      const cx = 430 + i * 200;
      const wav = Math.sin((cx - flagX) * 0.006 + t * 5.2) * 22;
      ctx.fillText(c, cx, flagY + 240 + wav);
    });
    ['云', '飞', '扬'].forEach((c, i) => {
      const cx = 630 + i * 200;
      const wav = Math.sin((cx - flagX) * 0.006 + t * 5.2) * 22;
      ctx.fillText(c, cx, flagY + 420 + wav);
    });
    ctx.restore();
    const l = lineAt(t);
    if (l && l.section === sec.name) lyricCenter(l, t, PAL.ancient, H - 130, 74, { activeColor: '#a8402c', accent: '#a8402c' });
  };

  // 09/13/21 hook-marpol：马牌副歌 —— 工单冲锋
  function hookMarpol(t, sec, pal) {
    ctx.save(); ctx.fillStyle = '#0b0b0c'; ctx.fillRect(0, 0, W, H); ctx.restore();
    const bi = beatInfo(t);
    // 背景：巨大的缓慢旋转的工单编号
    ctx.save();
    ctx.globalAlpha = 0.05;
    setFont(420, 'sans', 900);
    ctx.fillStyle = pal.accent;
    ctx.textAlign = 'center';
    ctx.save();
    ctx.translate(W / 2, H / 2 + 120);
    ctx.rotate(-0.06);
    ctx.fillText('MARPOL', 0, 0);
    ctx.restore();
    ctx.restore();

    // 四条能量条（压在上半区，避免和歌词撞）
    const bars = 4;
    for (let i = 0; i < bars; i++) {
      const y = 250 + i * 104;
      const w = W * (0.3 + 0.55 * Math.abs(Math.sin(t * 1.1 + i * 1.7)));
      ctx.save();
      ctx.globalAlpha = 0.14 + bi.pulse * 0.12;
      ctx.fillStyle = i === 1 ? pal.accent : pal.ink;
      ctx.fillRect(140, y, w, 34);
      ctx.restore();
      text(['PROCESS', 'QUALITY', 'COST', 'PEOPLE'][i], 140, y - 14, { size: 20, fam: 'mono', color: pal.dim, letterSpacing: 4, alpha: 0.75 });
    }
    // 中心：大字歌词
    const l = lineAt(t);
    if (l && l.section === sec.name) lyricCenter(l, t, pal, 830, 104, { color: pal.ink, activeColor: pal.accent, accent: pal.accent });
    // 底部：一排跳动的方块
    const n = 40;
    for (let i = 0; i < n; i++) {
      const on = ((i + bi.n) % 4 === 0);
      ctx.save();
      ctx.globalAlpha = on ? 0.9 : 0.15;
      ctx.fillStyle = on ? pal.accent : pal.ink;
      ctx.fillRect(140 + i * ((W - 280) / n), H - 170, (W - 280) / n - 8, 10);
      ctx.restore();
    }
  }
  SCENES[9] = hookMarpol;
  SCENES[13] = hookMarpol;
  SCENES[21] = hookMarpol;

  // 10 biwu：比武 —— 工序对比墙
  SCENES[10] = function (t, sec, pal) {
    ctx.save(); ctx.fillStyle = '#0b0b0c'; ctx.fillRect(0, 0, W, H); ctx.restore();
    blueprintGrid(t, pal, { grid: 36, alpha: 0.07 });
    const left = 200, right = 1080, top = 260, boxW = 640, boxH = 260;
    const k = ease.out(inv(sec.start + 0.2, sec.start + 1.8, t));
    ctx.save(); ctx.globalAlpha = k;
    text('BEFORE  vs  AFTER', W / 2, 200, { size: 26, fam: 'mono', color: pal.dim, align: 'center', letterSpacing: 8 });
    // 两个框
    [[left, 'BEFORE', pal.line], [right, 'AFTER', pal.accent]].forEach(([x, label, col], i) => {
      ctx.strokeStyle = col; ctx.lineWidth = 2;
      ctx.strokeRect(x, top, boxW, boxH);
      text(label, x + 20, top + 38, { size: 22, fam: 'mono', color: col, letterSpacing: 4 });
      // 内部：进度条阵列
      for (let r = 0; r < 4; r++) {
        const bw = boxW * (0.25 + 0.5 * hash(i * 13 + r + Math.floor(t * 2) * 0.001));
        ctx.globalAlpha = k * (0.2 + 0.5 * hash(r + i));
        ctx.fillStyle = col;
        ctx.fillRect(x + 24, top + 76 + r * 44, bw * (i === 1 ? 1 : 0.7), 14);
      }
      ctx.globalAlpha = k;
    });
    ctx.restore();
    const l = lineAt(t);
    if (l && l.section === sec.name) lyricLedger(l, t, pal, 200, H - 180, 46);
  };

  // 11 ppt：三十五页 PPT —— 幻灯片堆叠翻页
  SCENES[11] = function (t, sec, pal) {
    ctx.save(); ctx.fillStyle = '#0b0b0c'; ctx.fillRect(0, 0, W, H); ctx.restore();
    const local = t - sec.start;
    const pages = 35;
    const cur = Math.floor(local * 2.2) % pages;
    // 后面几张：透视堆叠
    for (let i = 5; i >= 1; i--) {
      const p = cur - i;
      const s = 1 - i * 0.035;
      ctx.save();
      ctx.globalAlpha = 0.10 * (6 - i) / 5;
      ctx.translate(W / 2, H / 2 + 40);
      ctx.scale(s, s);
      ctx.fillStyle = pal.ink;
      ctx.fillRect(-620, -360, 1240, 720);
      ctx.restore();
    }
    // 当前页
    ctx.save();
    ctx.translate(W / 2, H / 2 + 40);
    ctx.fillStyle = '#141416';
    ctx.fillRect(-620, -360, 1240, 720);
    ctx.strokeStyle = pal.line; ctx.lineWidth = 2;
    ctx.strokeRect(-620, -360, 1240, 720);
    // 页眉
    text(`SLIDE ${String(cur + 1).padStart(2, '0')} / 35`, -580, -300, { size: 22, fam: 'mono', color: pal.dim, letterSpacing: 3 });
    ctx.fillStyle = pal.accent;
    ctx.fillRect(-580, -288, 1160, 2);
    // 标题：用序号造不同的假标题
    const titles = ['WHY WE ARE SLOW', 'PROCESS MAP', 'ROOT CAUSE', 'ACTION PLAN', 'COST DOWN', 'QUALITY UP', 'NEXT STEP'];
    const tt = titles[cur % titles.length];
    setFont(76, 'sans', 900);
    ctx.fillStyle = pal.ink;
    ctx.fillText(tt, -580, -170);
    // 图表：柱状 / 折线 / 饼，随页码换
    const mode = cur % 3;
    if (mode === 0) {
      for (let i = 0; i < 7; i++) {
        const hh = 60 + Math.abs(Math.sin(i * 1.7 + cur)) * 260;
        ctx.fillStyle = i === cur % 7 ? pal.accent : 'rgba(242,239,230,0.35)';
        ctx.fillRect(-560 + i * 140, 250, 90, -hh);
      }
    } else if (mode === 1) {
      ctx.strokeStyle = pal.accent; ctx.lineWidth = 4;
      ctx.beginPath();
      for (let i = 0; i <= 40; i++) {
        const xx = -560 + i * 26;
        const yy = 200 - Math.sin(i * 0.35 + cur) * 120 - i * 3;
        i === 0 ? ctx.moveTo(xx, yy) : ctx.lineTo(xx, yy);
      }
      ctx.stroke();
    } else {
      ctx.beginPath();
      ctx.arc(120, 60, 150, -Math.PI / 2, -Math.PI / 2 + Math.PI * 2 * (0.3 + 0.4 * hash(cur)));
      ctx.strokeStyle = pal.accent; ctx.lineWidth = 40; ctx.stroke();
      ctx.beginPath();
      ctx.arc(120, 60, 150, 0, Math.PI * 2);
      ctx.strokeStyle = pal.line; ctx.lineWidth = 2; ctx.stroke();
    }
    // 页码小字
    text('CONFIDENTIAL · MARPOL', 580, 330, { size: 18, fam: 'mono', color: pal.dim, align: 'right', letterSpacing: 3 });
    ctx.restore();
    const l = lineAt(t);
    if (l && l.section === sec.name) lyricBanner(l, t, pal, H - 120, 110);
  };

  // 12 no-complaint：我没怼过谁 —— 安静的台账（闪动安全区）
  SCENES[12] = function (t, sec, pal) {
    ctx.save(); ctx.fillStyle = '#0b0b0c'; ctx.fillRect(0, 0, W, H); ctx.restore();
    // 极简：一大片留白 + 一个人的名字被划掉又写回
    const k = ease.out(inv(sec.start + 0.3, sec.start + 2.2, t));
    const list = ['张三', '李四', '王五', '老曹', '小马', '你自己'];
    ctx.save();
    ctx.globalAlpha = 0.9;
    list.forEach((n, i) => {
      const yy = 260 + i * 86;
      const kk = clamp((t - sec.start - 0.5 - i * 0.5) / 0.7, 0, 1);
      if (kk <= 0) return;
      text(n, 320, yy, { size: 44, fam: 'sans', color: i === list.length - 1 ? pal.accent : pal.dim, alpha: kk * (i === list.length - 1 ? 1 : 0.55) });
      // 已"核对"的勾
      if (i < list.length - 1) {
        ctx.globalAlpha = kk * 0.7;
        ctx.strokeStyle = pal.accent; ctx.lineWidth = 2.5;
        ctx.beginPath(); ctx.moveTo(200, yy - 12); ctx.lineTo(212, yy); ctx.lineTo(236, yy - 26); ctx.stroke();
      }
    });
    ctx.restore();
    // 右侧：一句声明
    ctx.save();
    ctx.globalAlpha = k * 0.8;
    text('NO COMPLAINTS', W - 200, 480, { size: 26, fam: 'mono', color: pal.dim, align: 'right', letterSpacing: 10 });
    text('SINCE 1000Y', W - 200, 520, { size: 26, fam: 'mono', color: pal.dim, align: 'right', letterSpacing: 10 });
    ctx.restore();
    const l = lineAt(t);
    if (l && l.section === sec.name) lyricCenter(l, t, pal, 860, 82, { color: pal.ink, activeColor: pal.accent, accent: pal.accent });
  };

  // 14–20：七位同事 —— 同一套工牌系统，版式各异
  function colleague(t, sec, pal, cfg) {
    ctx.save(); ctx.fillStyle = '#0b0b0c'; ctx.fillRect(0, 0, W, H); ctx.restore();
    blueprintGrid(t, pal, { grid: 64, alpha: 0.05 });
    const k = ease.out(inv(sec.start + 0.1, sec.start + 1.2, t));
    // 左侧：竖排大名字（姓名条）
    ctx.save();
    ctx.globalAlpha = k;
    // 姓名条底板
    ctx.fillStyle = pal.accent;
    ctx.fillRect(180, 220, 96, 640);
    // 竖排姓名
    setFont(92, 'sans', 900);
    ctx.fillStyle = '#0b0b0c';
    const chars = cfg.name.split('');
    chars.forEach((c, i) => {
      const kk = clamp((t - sec.start - 0.35 - i * 0.16) / 0.4, 0, 1);
      ctx.globalAlpha = k * kk;
      ctx.fillText(c, 204, 320 + i * 108);
    });
    ctx.restore();

    // 右侧：记录卡
    ctx.save();
    ctx.globalAlpha = k;
    const cx = 460, cy = 240, cw = 1180, chh = 560;
    recordCard(cx, cy, cw, chh, pal, { id: `${cfg.id} · ${cfg.role}`, rows: 6, alpha: k, idColor: pal.accent });
    fieldRow('NAME', cfg.name, cx + 30, cy + 126, cw - 60, pal, 30, k);
    fieldRow('ROLE', cfg.role, cx + 30, cy + 186, cw - 60, pal, 26, k);
    fieldRow('YEARS', cfg.years, cx + 30, cy + 240, cw - 60, pal, 26, k);
    fieldRow('TICKETS', cfg.tickets, cx + 30, cy + 294, cw - 60, pal, 26, k);
    fieldRow('STATUS', cfg.status, cx + 30, cy + 348, cw - 60, pal, 26, k);
    // 一条剪影：不画脸，只画肩线
    ctx.globalAlpha = k * 0.5;
    ctx.fillStyle = pal.dim;
    ctx.beginPath();
    ctx.arc(cx + cw - 170, cy + 180, 62, Math.PI, 0);
    ctx.lineTo(cx + cw - 60, cy + 330);
    ctx.lineTo(cx + cw - 280, cy + 330);
    ctx.closePath();
    ctx.fill();
    ctx.restore();

    // 印章（右下）
    const sk = ease.back(inv(sec.start + 1.6, sec.start + 2.1, t));
    if (sk > 0) stamp(cfg.stamp, W - 300, 900, 40, pal.accent, -0.12, sk * 0.85);

    const l = lineAt(t);
    if (l && l.section === sec.name) lyricLedger(l, t, pal, 460, 900, 40);
  }

  SCENES[14] = (t, s, p) => colleague(t, s, p, { name: '老曹', role: '前辈', id: 'REC 0021', years: '20+', tickets: '1,204', status: '在岗', stamp: '靠得住' });
  SCENES[15] = (t, s, p) => colleague(t, s, p, { name: '吴晗', role: '同行', id: 'REC 0022', years: '12', tickets: '806', status: '在岗', stamp: '一起扛' });
  SCENES[16] = (t, s, p) => colleague(t, s, p, { name: '高小凡', role: '搭档', id: 'REC 0023', years: '9', tickets: '512', status: '在岗', stamp: '稳' });
  SCENES[17] = (t, s, p) => colleague(t, s, p, { name: 'Gary', role: '系统', id: 'REC 0024', years: '15', tickets: '990', status: '在岗', stamp: 'SOLID' });
  SCENES[18] = (t, s, p) => colleague(t, s, p, { name: '传勇', role: '老兵', id: 'REC 0025', years: '18', tickets: '1,088', status: '在岗', stamp: '耐磨' });
  SCENES[19] = (t, s, p) => colleague(t, s, p, { name: 'Allen Ma', role: '质量', id: 'REC 0026', years: '11', tickets: '730', status: '在岗', stamp: '零缺陷' });
  SCENES[20] = (t, s, p) => colleague(t, s, p, { name: '小马', role: '新人', id: 'REC 0027', years: '1', tickets: '42', status: '在岗', stamp: '接着跑' });

  // 22 finale：卓越路 —— 所有记录汇成一束灯
  SCENES[22] = function (t, sec, pal) {
    ctx.save();
    const g = ctx.createRadialGradient(W / 2, H * 0.55, 60, W / 2, H * 0.55, H * 1.1);
    g.addColorStop(0, '#1a1710');
    g.addColorStop(0.5, '#0c0b09');
    g.addColorStop(1, '#050504');
    ctx.fillStyle = g;
    ctx.fillRect(0, 0, W, H);
    ctx.restore();

    const local = t - sec.start;
    // 一束光：从下方升起，收束成尖
    const k = ease.out(inv(sec.start, sec.start + 4.0, t));
    ctx.save();
    ctx.globalAlpha = k * 0.45;
    const lg = ctx.createLinearGradient(0, H, 0, 60);
    lg.addColorStop(0, 'rgba(255,204,0,0.42)');
    lg.addColorStop(0.55, 'rgba(255,204,0,0.14)');
    lg.addColorStop(1, 'rgba(255,204,0,0)');
    ctx.fillStyle = lg;
    ctx.beginPath();
    ctx.moveTo(W / 2 - 340, H);
    ctx.quadraticCurveTo(W / 2 - 90, H * 0.42, W / 2 - 26, H * 0.10);
    ctx.lineTo(W / 2 + 26, H * 0.10);
    ctx.quadraticCurveTo(W / 2 + 90, H * 0.42, W / 2 + 340, H);
    ctx.closePath();
    ctx.fill();
    ctx.restore();

    // 所有记录编号，向光心汇聚（压低并变淡，不挡字）
    const N = 44;
    for (let i = 0; i < N; i++) {
      const a = (i / N) * Math.PI * 2;
      const rad = 560 + Math.sin(i * 3.3) * 250;
      const spin = local * 0.12 + i * 0.14;
      const px = W / 2 + Math.cos(a + spin) * rad;
      const py = H * 0.60 + Math.sin(a + spin) * rad * 0.42;
      const al = (0.08 + 0.34 * Math.abs(Math.sin(i * 7.1 + local * 0.7))) * k;
      text(`#${String(1000 + i).padStart(5, '0')}`, px, py, { size: 14, fam: 'mono', color: pal.accent, alpha: al, align: 'center' });
    }

    // 大字：卓越路
    const kk = ease.out(inv(sec.start + 2.0, sec.start + 4.2, t));
    ctx.save();
    ctx.globalAlpha = kk;
    setFont(200, 'sans', 900);
    ctx.fillStyle = '#f7f2e2';
    ctx.textAlign = 'center';
    ctx.fillText('卓越路', W / 2, H * 0.50);
    ctx.restore();

    const l = lineAt(t);
    if (l && l.section === sec.name) lyricCenter(l, t, pal, H * 0.76, 62, { color: pal.accent, activeColor: '#fff', accent: pal.accent });
  };

  // ---------------- 主入口 ----------------

  // 调色板按段落显式指定（不要用区间判断：0/3 是 hook 在暗底上，用 ancient 的墨色字会消失）
  const PAL_MAP = {
    0: 'system', 1: 'ancient', 2: 'ancient', 3: 'system', 4: 'ancient',
    5: 'system', 6: 'terminal', 7: 'terminal', 8: 'ancient',
    9: 'marpol', 10: 'marpol', 11: 'marpol', 12: 'system',
    13: 'marpol', 14: 'marpol', 15: 'marpol', 16: 'marpol', 17: 'marpol',
    18: 'marpol', 19: 'marpol', 20: 'marpol', 21: 'marpol', 22: 'marpol',
  };
  const ANCIENT_SECS = new Set([1, 2, 4, 8]);

  function paletteOf(sec) {
    return PAL[PAL_MAP[sec.index] || 'system'];
  }

  function draw(t) {
    const sec = sectionAt(t);
    const pal = paletteOf(sec);
    const sc = SCENES[sec.index] || SCENES[0];
    K.clear('#000');
    sc(t, sec, pal);

    // HUD 只在非古代段出现，古代段换成纸上的小字批注
    if (ANCIENT_SECS.has(sec.index)) {
      ctx.save();
      ctx.globalAlpha = 0.5;
      text('ARCHIVE  ·  1000Y', 64, H - 64, { size: 18, fam: 'mono', color: '#6b5f4c', letterSpacing: 3 });
      text(`${String(sec.index + 1).padStart(2, '0')} / 23  ${sec.name.toUpperCase()}`, W - 64, H - 64,
        { size: 18, fam: 'mono', color: '#6b5f4c', letterSpacing: 3, align: 'right' });
      ctx.restore();
    } else {
      K.hud(t, pal, {});
    }

    // 段落切换的黑场：每段首尾各 0.25s 渐入渐出
    const inFade = 1 - clamp((t - sec.start) / 0.28, 0, 1);
    const outFade = clamp((t - (sec.end - 0.22)) / 0.22, 0, 1);
    const fade = Math.max(inFade, outFade) * 0.9;
    K.finish(t, pal, {
      fade: fade,
      grainAlpha: ANCIENT_SECS.has(sec.index) ? 0.14 : 0.09,
      grain: true,
      vignette: ANCIENT_SECS.has(sec.index) ? 'rgba(40,28,14,0.5)' : 'rgba(0,0,0,0.6)',
      scan: sec.index === 6 || sec.index === 7,
      scanAlpha: 0.18,
    });
  }

  window.DRAW = draw;
  // renderAt 由 main.js 装配
})();
