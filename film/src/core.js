// film/src/core.js —— 《The OGs》MV 渲染核心
// 约定：画面是 window.renderAt(t) 的纯函数；无跨帧状态；随机数由种子决定。
// 设计：全片是「一台跑了一千年的工单档案系统」。人物=记录，段落=视图切换。

(function () {
  const W = 1920, H = 1080;

  // ---------- 调色板：颜色 = 状态 ----------
  const PAL = {
    system: {                 // 系统底色（冷黑 + 暖白字）
      bg: '#07080a', ink: '#e9e4d6', dim: '#8b8577', line: '#2a2b2e',
      accent: '#c8a24a', hot: '#f2c300', err: '#d4553d',
    },
    ancient: {                // 古代段：宣纸 + 墨 + 朱砂（木刻版画）
      bg: '#d9cfb8', ink: '#17130f', dim: '#6b5f4c', line: '#a99a80',
      accent: '#a8402c', hot: '#6d1f14', err: '#a8402c',
    },
    terminal: {               // 终端段：磷光绿 + 琥珀
      bg: '#05080a', ink: '#cdf3dd', dim: '#4e6b60', line: '#16302a',
      accent: '#5ef2a0', hot: '#f5c542', err: '#ff6b4a',
    },
    marpol: {                 // 马牌段：炭黑 + 马牌黄
      bg: '#0b0b0c', ink: '#f2efe6', dim: '#7d7a72', line: '#26262a',
      accent: '#ffcc00', hot: '#ffffff', err: '#ff5a3c',
    },
  };

  // ---------- 字体分工 ----------
  // mono = 系统/代码/编号；serif = 人物说的话（歌词）；sans = 界面/现代名字
  const FONT = {
    mono: '"Cascadia Mono","Consolas","DejaVu Sans Mono",monospace',
    serif: '"Noto Serif SC","Source Han Serif SC","SimSun",serif',
    sans: '"Noto Sans SC","Microsoft YaHei","Segoe UI",sans-serif',
  };

  const cv = document.getElementById('c');
  cv.width = W; cv.height = H;
  const ctx = cv.getContext('2d');
  ctx.textBaseline = 'alphabetic';

  // ---------- 工具 ----------
  const clamp = (x, a, b) => Math.min(b, Math.max(a, x));
  const lerp = (a, b, t) => a + (b - a) * t;
  const inv = (a, b, x) => clamp((x - a) / (b - a || 1e-9), 0, 1);
  const ease = {
    out: (x) => 1 - Math.pow(1 - x, 3),
    in: (x) => x * x * x,
    io: (x) => (x < 0.5 ? 4 * x * x * x : 1 - Math.pow(-2 * x + 2, 3) / 2),
    expo: (x) => (x >= 1 ? 1 : 1 - Math.pow(2, -10 * x)),
    back: (x) => 1 + 2.2 * Math.pow(x - 1, 3) + 1.2 * Math.pow(x - 1, 2),
  };

  // 确定性伪随机（同一 t 永远同一结果）
  function rnd(seed) {
    let s = seed >>> 0;
    return function () {
      s = (s * 1664525 + 1013904223) >>> 0;
      return s / 4294967296;
    };
  }
  function hash(n) {
    const x = Math.sin(n * 127.1 + 311.7) * 43758.5453;
    return x - Math.floor(x);
  }

  // ---------- 纹理：程序化生成一次，之后复用 ----------
  const texCache = {};
  function makeCanvas(w, h) {
    const c = document.createElement('canvas');
    c.width = w; c.height = h;
    return c;
  }

  // 木刻排线：不同角度、不同粗细的刻痕，用来给剪影"上墨"
  function hatchTile(angleDeg, spacing, w, h, color, alpha, jitter) {
    const key = `h${angleDeg}_${spacing}_${w}_${h}_${color}_${alpha}_${jitter}`;
    if (texCache[key]) return texCache[key];
    const c = makeCanvas(w, h);
    const g = c.getContext('2d');
    g.strokeStyle = color;
    g.globalAlpha = alpha;
    const rad = (angleDeg * Math.PI) / 180;
    const dx = Math.cos(rad), dy = Math.sin(rad);
    const len = Math.hypot(w, h) * 1.2;
    const steps = Math.ceil(len / spacing);
    for (let i = -steps; i < steps; i++) {
      const r = rnd(i * 7919 + angleDeg * 13 + spacing * 3);
      const j = (r() - 0.5) * jitter;
      g.lineWidth = 0.6 + r() * 1.6;
      g.beginPath();
      // 关键：相邻刻线要沿"垂直于线条方向"平移 (-dy, dx)；沿 (dx, dy) 平移会画成同一条线的重叠
      const ox = w / 2 + -dy * i * spacing + j;
      const oy = h / 2 + dx * i * spacing + j;
      g.moveTo(ox - dx * len, oy - dy * len);
      g.lineTo(ox + dx * len, oy + dy * len);
      g.stroke();
    }
    texCache[key] = c;
    return c;
  }

  // 纸纹 + 颗粒（整幅叠加，低透明度）
  function grainTile(w, h, alpha, seed) {
    const key = `g_${w}_${h}_${alpha}_${seed}`;
    if (texCache[key]) return texCache[key];
    const c = makeCanvas(w, h);
    const g = c.getContext('2d');
    const img = g.createImageData(w, h);
    const r = rnd(seed);
    for (let i = 0; i < img.data.length; i += 4) {
      const v = 128 + (r() - 0.5) * 255;
      img.data[i] = img.data[i + 1] = img.data[i + 2] = v;
      img.data[i + 3] = alpha * 255;
    }
    g.putImageData(img, 0, 0);
    texCache[key] = c;
    return c;
  }

  // 半调网点：老印刷的调子
  function halftone(w, h, step, r, color, seed) {
    const key = `hd_${w}_${h}_${step}_${r}_${color}_${seed}`;
    if (texCache[key]) return texCache[key];
    const c = makeCanvas(w, h);
    const g = c.getContext('2d');
    g.fillStyle = color;
    const rr = rnd(seed);
    for (let y = 0; y < h; y += step) {
      for (let x = 0; x < w; x += step) {
        const k = rr();
        g.globalAlpha = 0.25 + k * 0.6;
        g.beginPath();
        g.arc(x, y, r * (0.4 + k), 0, Math.PI * 2);
        g.fill();
      }
    }
    texCache[key] = c;
    return c;
  }

  // 扫描线（CRT 感），按需叠
  function scanlines(w, h, gap, alpha) {
    const key = `sc_${w}_${h}_${gap}_${alpha}`;
    if (texCache[key]) return texCache[key];
    const c = makeCanvas(w, h);
    const g = c.getContext('2d');
    g.fillStyle = `rgba(0,0,0,${alpha})`;
    for (let y = 0; y < h; y += gap) g.fillRect(0, y, w, 1);
    texCache[key] = c;
    return c;
  }

  // ---------- 时间：节拍网格 ----------
  const TL = window.TL;
  const BEAT = TL.beat;          // 0.929s
  const HALF = TL.halfBeat;      // 0.4646s

  // 距 t 最近的一拍的信息（用于脉冲）
  function beatInfo(t) {
    const n = Math.round((t - TL.firstBeat) / BEAT);
    const at = TL.firstBeat + n * BEAT;
    const since = t - at;                 // 距上一拍过去了多久
    const phase = ((t - TL.firstBeat) / BEAT) % 1;
    const pulse = Math.exp(-since * 7.5); // 拍点冲击衰减
    return { n, at, since, phase, pulse, barPhase: n % 4 };
  }
  function halfPulse(t) {
    const since = ((t - TL.firstBeat) / HALF) % 1;
    return Math.exp(-(since * HALF) * 9);
  }

  // ---------- 歌词 ----------
  const SECTIONS = TL.sections;
  const ALL_LINES = [];
  SECTIONS.forEach((s) => s.lines.forEach((l) => ALL_LINES.push(Object.assign({ section: s.name, secIndex: s.index }, l))));

  function sectionAt(t) {
    for (const s of SECTIONS) if (t >= s.start && t < s.end) return s;
    return SECTIONS[SECTIONS.length - 1];
  }
  function lineAt(t) {
    for (const l of ALL_LINES) if (t >= l.start - 0.05 && t < l.end) return l;
    return null;
  }
  // 某段内第几条（用于版式轮换）
  function lineIndexOf(line) {
    return ALL_LINES.indexOf(line);
  }

  // ---------- 绘制基元 ----------
  function clear(col) {
    ctx.setTransform(1, 0, 0, 1, 0, 0);
    ctx.globalAlpha = 1;
    ctx.globalCompositeOperation = 'source-over';
    ctx.fillStyle = col;
    ctx.fillRect(0, 0, W, H);
  }

  function setFont(size, fam, weight) {
    ctx.font = `${weight || 400} ${size}px ${FONT[fam]}`;
  }

  // 字阶：小字号只有三档（15/18/26），字距跟着档位走 —— 避免 15~26 之间五花八门的设置
  function snapSize(sz) {
    if (sz == null) return 32;
    if (sz <= 16) return 15;
    if (sz <= 22) return 18;
    if (sz <= 30) return 26;
    return sz;
  }
  function snapLS(sz, ls) {
    if (ls == null) return null;
    if (sz <= 16) return 4;
    if (sz <= 22) return 3;
    if (sz <= 30) return 2;
    return ls;
  }

  function text(str, x, y, opts) {
    const o = opts || {};
    const sz = snapSize(o.size);
    setFont(sz, o.fam || 'mono', o.weight || 400);
    ctx.save();
    ctx.globalAlpha *= o.alpha == null ? 1 : o.alpha;   // 与外层复合，不再硬覆盖
    ctx.fillStyle = o.color || '#fff';
    ctx.textAlign = o.align || 'left';
    const _ls = snapLS(sz, o.letterSpacing);
    if (_ls) ctx.letterSpacing = _ls + 'px';
    ctx.fillText(str, x, y);
    ctx.restore();
  }

  function measure(str, size, fam, weight) {
    setFont(size, fam || 'mono', weight || 400);
    return ctx.measureText(str).width;
  }

  // 逐字卡拉OK：已唱的字高亮，未唱的字暗；光标在正在唱的字上
  function karaoke(line, t, opts) {
    const o = opts || {};
    const size = o.size || 54;
    const fam = o.fam || 'serif';
    const weight = o.weight || 500;
    const gap = o.gap == null ? 6 : o.gap;
    const chars = line.chars || [];
    if (!chars.length) return 0;

    const maxWidth = o.maxWidth == null ? W * 0.88 : o.maxWidth;
    let drawSize = size;
    let drawGap = gap;
    const measureAt = (s) => {
      setFont(s, fam, weight);
      const widths = chars.map((c) => ctx.measureText(c.c).width);
      return { widths, total: widths.reduce((a, b) => a + b, 0) + drawGap * (chars.length - 1) };
    };
    let measured = measureAt(drawSize);
    for (let pass = 0; measured.total > maxWidth && pass < 3; pass++) {
      const scale = maxWidth / measured.total;
      drawSize *= scale * 0.995;
      drawGap = gap * (drawSize / size);
      measured = measureAt(drawSize);
    }
    const widths = measured.widths;
    const totalW = measured.total;
    let x = o.align === 'center' ? o.x - totalW / 2 : (o.align === 'right' ? o.x - totalW : o.x);
    const y = o.y;
    ctx.save();
    ctx.textAlign = 'left';
    const parentAlpha = ctx.globalAlpha;
    const unsungAlpha = clamp(Math.max(o.unsung == null ? 0.28 : o.unsung, 0.78), 0, 1);
    for (let i = 0; i < chars.length; i++) {
      const c = chars[i];
      const sung = t >= c.t;
      const active = sung && (i === chars.length - 1 || t < chars[i + 1].t);
      // 每字都从入口透明度计算，避免上一个字的 alpha 累乘进后续字。
      ctx.globalAlpha = parentAlpha * (sung ? 1 : unsungAlpha);
      ctx.fillStyle = sung && o.activeColor ? o.activeColor : (o.color || '#fff');
      setFont(drawSize, fam, weight);
      ctx.fillText(c.c, x, y);
      if (active && o.underline !== false) {
        const ux = x, uy = y + drawSize * 0.16;
        ctx.globalAlpha = parentAlpha * (o.underlineAlpha == null ? 0.9 : o.underlineAlpha);
        ctx.fillStyle = o.accent || '#c8a24a';
        ctx.fillRect(ux, uy, widths[i], Math.max(2, drawSize * 0.045));
      }
      x += widths[i] + drawGap;
    }
    ctx.restore();
    return totalW;
  }

  // 整行淡入上浮（不逐字时用）
  function lineIn(line, t, o) {
    const k = ease.out(inv(line.start - 0.35, line.start + 0.05, t));
    text(line.text, o.x, o.y + (1 - k) * 26, Object.assign({ alpha: k }, o));
  }

  // 版画字形：先实心压一版墨，再用浅色刻痕"刮"出排线（真正的木刻是刻掉的部分露出纸白）
  function woodcutText(str, x, y, size, hatches, opts) {
    const o = opts || {};
    const tw = measure(str, size, o.fam || 'sans', 900);
    // align: 'left'(默认) | 'center' | 'right' —— 由调用方给锚点，避免算错宽度出屏
    let drawX = x;
    if (o.align === 'center') drawX = x - tw / 2;
    else if (o.align === 'right') drawX = x - tw;
    const cw = Math.max(1, Math.ceil(tw + size * 0.2));
    const chh = Math.ceil(size * 1.5);
    const c = makeCanvas(cw, chh);
    const g = c.getContext('2d');
    g.font = `900 ${size}px ${FONT[o.fam || 'sans']}`;
    g.textBaseline = 'alphabetic';
    // 1) 实心墨
    g.fillStyle = o.baseColor || (hatches[0] && hatches[0].color) || '#17130f';
    g.fillText(str, 0, size * 1.12);
    // 2) 刻痕：只在字形内部，用纸白/浅色刮出排线
    g.globalCompositeOperation = 'source-atop';
    for (const h of hatches) {
      const tile = hatchTile(h.angle, h.spacing, cw, chh, h.color, h.alpha == null ? 1 : h.alpha, h.jitter == null ? 2 : h.jitter);
      g.drawImage(tile, 0, 0);
    }
    ctx.save();
    ctx.globalAlpha *= o.alpha == null ? 1 : o.alpha;
    ctx.drawImage(c, drawX, y - size * 1.12);
    ctx.restore();
    return tw;
  }

  // ---------- 系统外壳：顶栏 + 底栏（贯穿全片的"同一台机器"） ----------
  function hud(t, pal, opts) {
    const o = opts || {};
    const m = 64;
    ctx.save();
    // 顶：左品牌 + 中时间码 + 右状态
    text('THE OGS · 过来人档案系统', m, m + 6, { size: 22, fam: 'mono', color: pal.dim, letterSpacing: 2 });
    const tc = fmtTC(t);
    text(tc, W - m, m + 6, { size: 22, fam: 'mono', color: pal.dim, align: 'right', letterSpacing: 2 });
    // 分段进度
    const sec = sectionAt(t);
    const p = inv(sec.start, sec.end, t);
    const bw = 420;
    ctx.globalAlpha = 0.9;
    ctx.fillStyle = pal.line;
    ctx.fillRect(W / 2 - bw / 2, m - 4, bw, 2);
    ctx.fillStyle = pal.accent;
    ctx.fillRect(W / 2 - bw / 2, m - 4, bw * p, 2);
    text(`${String(sec.index + 1).padStart(2, '0')} / ${String(SECTIONS.length).padStart(2, '0')}  ${sec.name.toUpperCase()}`,
      W / 2, m + 26, { size: 18, fam: 'mono', color: pal.dim, align: 'center', letterSpacing: 3 });

    // 底：滚动日志（每拍换一条假记录，营造"系统在跑"）
    const bi = beatInfo(t);
    const recs = ['\u5df2\u5f52\u6863', 'LOCK', 'SYNC', 'READ', 'WRITE', 'INDEX', 'SCAN', 'OK'];
    const log = [];
    for (let i = 0; i < 6; i++) {
      const n = bi.n - i;
      const r = recs[Math.abs(n * 7) % recs.length];
      log.push(`#${String(1000 + n).padStart(5, '0')} ${r}`);
    }
    ctx.globalAlpha = 0.55;
    text(log.join('    '), m, H - m, { size: 17, fam: 'mono', color: pal.dim, letterSpacing: 1 });
    ctx.restore();
    if (o.rules !== false) {
      ctx.save();
      ctx.globalAlpha = 0.5;
      ctx.fillStyle = pal.line;
      ctx.fillRect(m, m + 40, W - 2 * m, 1);
      ctx.fillRect(m, H - m - 34, W - 2 * m, 1);
      ctx.restore();
    }
  }

  function fmtTC(t) {
    const s = Math.max(0, t);
    const mm = Math.floor(s / 60);
    const ss = Math.floor(s % 60);
    const ff = Math.floor((s % 1) * 60);
    return `${String(mm).padStart(2, '0')}:${String(ss).padStart(2, '0')}:${String(ff).padStart(2, '0')}`;
  }

  // 全片统一颗粒 + 轻微暗角（一层"胶片"把所有段粘在一起）
  function finish(t, pal, opts) {
    const o = opts || {};
    ctx.save();
    // 暗角
    const g = ctx.createRadialGradient(W / 2, H / 2, H * 0.25, W / 2, H / 2, H * 0.95);
    g.addColorStop(0, 'rgba(0,0,0,0)');
    g.addColorStop(1, o.vignette || 'rgba(0,0,0,0.55)');
    ctx.fillStyle = g;
    ctx.fillRect(0, 0, W, H);
    ctx.restore();

    if (o.grain !== false) {
      ctx.save();
      ctx.globalCompositeOperation = 'overlay';
      ctx.globalAlpha = o.grainAlpha == null ? 0.10 : o.grainAlpha;
      ctx.drawImage(grainTile(480, 270, 1, 91), 0, 0, W, H);
      ctx.restore();
    }
    if (o.scan) {
      ctx.save();
      ctx.globalAlpha = o.scanAlpha == null ? 0.35 : o.scanAlpha;
      ctx.drawImage(scanlines(W, H, 3, 0.55), 0, 0);
      ctx.restore();
    }
    // 转场黑场（段落切换）
    if (o.fade != null && o.fade > 0) {
      ctx.save();
      ctx.globalAlpha = clamp(o.fade, 0, 1);
      ctx.fillStyle = '#000';
      ctx.fillRect(0, 0, W, H);
      ctx.restore();
    }
  }

  // ---------- 导出 ----------
  const API = {
    W, H, ctx, PAL, FONT, TL, BEAT, HALF, SECTIONS, ALL_LINES,
    clamp, lerp, inv, ease, rnd, hash,
    makeCanvas, hatchTile, grainTile, halftone, scanlines,
    beatInfo, halfPulse, sectionAt, lineAt, lineIndexOf,
    clear, setFont, text, measure, karaoke, lineIn, woodcutText, hud, finish, fmtTC,
    textCache: {},
  };
  window.K = API;
  window.renderAt = window.renderAt || function () {};
})();
