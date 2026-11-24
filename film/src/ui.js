// film/src/ui.js —— 视觉元素库（线条 / 面板 / 按钮 / 仪表 / 光效 / 标尺）
// 目标：给每一帧增加「程序界面」的实体感，同时把散落的标签收成一套字阶。
// 全部用矢量绘制，不依赖任何外部图片；对 t 是纯函数。
(function () {
  const K = window.K;
  if (!K) throw new Error('ui.js 需要先加载 core.js');
  const ctx = K.ctx, W = K.W, H = K.H;
  const clamp = K.clamp, ease = K.ease, hash = K.hash;
  const M = 64;

  // ---------- 统一字阶（把 15/16/17/18/19/20/22/24 收成 4 档）----------
  const T = { micro: 15, meta: 18, body: 26, h3: 36, h2: 58, h1: 96, display: 200 };
  const LS = { micro: 4, meta: 3, body: 1, h3: 2, h2: 2, h1: 1, display: 0 };

  function meta(str, x, y, o) {
    o = o || {};
    K.text(str, x, y, {
      size: o.size || T.meta, fam: o.fam || 'mono', color: o.color || '#fff',
      align: o.align || 'left', alpha: o.alpha == null ? 0.58 : o.alpha,
      letterSpacing: o.ls == null ? LS.meta : o.ls, weight: o.weight || 400,
    });
  }
  function micro(str, x, y, o) {
    o = o || {};
    meta(str, x, y, Object.assign({}, o, { size: T.micro, ls: LS.micro, alpha: o.alpha == null ? 0.42 : o.alpha }));
  }

  // ---------- 光效 ----------
  function glow(x, y, r, color, alpha) {
    const g = ctx.createRadialGradient(x, y, 0, x, y, r);
    g.addColorStop(0, hexA(color, alpha == null ? 0.5 : alpha));
    g.addColorStop(0.55, hexA(color, (alpha == null ? 0.5 : alpha) * 0.28));
    g.addColorStop(1, hexA(color, 0));
    ctx.save();
    ctx.fillStyle = g;
    ctx.fillRect(x - r, y - r, r * 2, r * 2);
    ctx.restore();
  }
  function hexA(hex, a) {
    const r = parseInt(hex.slice(1, 3), 16), g = parseInt(hex.slice(3, 5), 16), b = parseInt(hex.slice(5, 7), 16);
    return `rgba(${r},${g},${b},${clamp(a, 0, 1)})`;
  }

  // 颜色亮度（0 黑 → 1 白），用来判断「底色是纸还是墨」
  function lumOf(hex) {
    if (!hex || hex.charAt(0) !== '#') return 0.5;
    const r = parseInt(hex.slice(1, 3), 16) / 255;
    const g = parseInt(hex.slice(3, 5), 16) / 255;
    const b = parseInt(hex.slice(5, 7), 16) / 255;
    return 0.2126 * r + 0.7152 * g + 0.0722 * b;
  }
  // 强调色：底色亮 → 用该调色板的墨色；底色暗 → 用它的强调色
  function accentFor(pal, light) {
    if (!pal) return '#c8a24a';
    return light ? (lumOf(pal.ink) < 0.35 ? pal.ink : pal.accent) : pal.accent;
  }

  // ---------- 基础线件 ----------
  function line(x1, y1, x2, y2, color, alpha, w) {
    ctx.save();
    ctx.globalAlpha = alpha == null ? 0.3 : alpha;
    ctx.strokeStyle = color || '#fff';
    ctx.lineWidth = w || 1;
    ctx.beginPath(); ctx.moveTo(x1, y1); ctx.lineTo(x2, y2); ctx.stroke();
    ctx.restore();
  }
  function box(x, y, w, h, color, alpha, lw) {
    ctx.save();
    ctx.globalAlpha = alpha == null ? 0.3 : alpha;
    ctx.strokeStyle = color || '#fff';
    ctx.lineWidth = lw || 1;
    ctx.strokeRect(x + 0.5, y + 0.5, w, h);
    ctx.restore();
  }
  // 四角定位标记（印刷/相机取景的角标）
  function cornerMarks(x, y, w, h, s, color, alpha) {
    ctx.save();
    ctx.globalAlpha = alpha == null ? 0.5 : alpha;
    ctx.strokeStyle = color || '#fff';
    ctx.lineWidth = 2;
    const p = [[x, y, 1, 1], [x + w, y, -1, 1], [x, y + h, 1, -1], [x + w, y + h, -1, -1]];
    for (const [cx0, cy0, dx, dy] of p) {
      ctx.beginPath();
      ctx.moveTo(cx0 + dx * s, cy0);
      ctx.lineTo(cx0, cy0);
      ctx.lineTo(cx0, cy0 + dy * s);
      ctx.stroke();
    }
    ctx.restore();
  }
  // 刻度尺：count 个刻度，每 5 个长刻度
  function ruler(x, y, len, count, color, alpha, vertical) {
    ctx.save();
    ctx.globalAlpha = alpha == null ? 0.34 : alpha;
    ctx.fillStyle = color || '#fff';
    for (let i = 0; i <= count; i++) {
      const p = i / count;
      const big = i % 5 === 0;
      const l = big ? 9 : 4;
      if (vertical) ctx.fillRect(x - l, y + p * len, l, 1);
      else ctx.fillRect(x + p * len, y, 1, l);
    }
    ctx.restore();
  }
  // 分段刻度条（底部数据带）
  function segments(x, y, w, n, color, alpha) {
    ctx.save();
    ctx.globalAlpha = alpha == null ? 0.4 : alpha;
    ctx.fillStyle = color || '#fff';
    for (let i = 0; i < n; i++) {
      if (i % 4 === 3) continue;           // 每 4 格留空，读起来像进度条
      ctx.fillRect(x + i * (w / n), y, Math.max(2, w / n - 3), 6);
    }
    ctx.restore();
  }

  // ---------- 组件：面板 ----------
  function panel(x, y, w, h, o) {
    o = o || {};
    const pal = o.pal || K.PAL.system;
    const ink = o.ink || pal.ink;
    box(x, y, w, h, o.color || ink, o.alpha == null ? 0.26 : o.alpha, 1);
    if (o.title) {
      // 标题栏：一条横线 + 三个点 + 标题
      line(x, y + 34, x + w, y + 34, o.color || ink, 0.22, 1);
      ctx.save();
      ctx.globalAlpha = 0.5;
      ctx.fillStyle = o.color || ink;
      for (let i = 0; i < 3; i++) ctx.fillRect(x + 14 + i * 12, y + 14, 5, 5);
      ctx.restore();
      meta(o.title, x + 58, y + 24, { color: o.color || ink, size: T.micro, alpha: 0.62 });
      if (o.right) meta(o.right, x + w - 14, y + 24, { color: o.color || ink, size: T.micro, alpha: 0.42, align: 'right' });
    }
    if (o.footer) {
      line(x, y + h - 30, x + w, y + h - 30, o.color || ink, 0.18, 1);
      micro(o.footer, x + 14, y + h - 11, { color: o.color || ink, alpha: 0.4 });
    }
  }

  // ---------- 组件：按钮 ----------
  // state: 'idle' | 'hover' | 'press' | 'primary'
  function button(x, y, w, h, label, o) {
    o = o || {};
    const pal = o.pal || K.PAL.system;
    const ink = o.color || pal.ink;
    const state = o.state || 'idle';
    const acc = o.accent || pal.accent;
    ctx.save();
    // 底
    if (state === 'primary') {
      ctx.globalAlpha = 0.92;
      ctx.fillStyle = acc;
      ctx.fillRect(x, y, w, h);
    } else {
      ctx.globalAlpha = state === 'hover' ? 0.16 : (state === 'press' ? 0.26 : 0.05);
      ctx.fillStyle = ink;
      ctx.fillRect(x, y, w, h);
    }
    // 边
    ctx.globalAlpha = state === 'idle' ? 0.45 : 0.85;
    ctx.strokeStyle = state === 'primary' ? acc : ink;
    ctx.lineWidth = 2;
    ctx.strokeRect(x + 1, y + 1, w - 2, h - 2);
    // 左右短标（像工业按钮的两端卡扣）
    ctx.globalAlpha = 0.55;
    ctx.fillStyle = state === 'primary' ? pal.bg : ink;
    ctx.fillRect(x + 8, y + h / 2 - 5, 3, 10);
    ctx.fillRect(x + w - 11, y + h / 2 - 5, 3, 10);
    ctx.restore();
    meta(label, x + w / 2, y + h / 2 + 6, {
      align: 'center', size: o.size || T.meta, ls: LS.meta,
      color: state === 'primary' ? pal.bg : ink, alpha: 0.95,
    });
  }

  // ---------- 组件：标签页 ----------
  function tabs(x, y, items, active, o) {
    o = o || {};
    const pal = o.pal || K.PAL.system;
    const ink = o.color || pal.ink;
    let cx = x;
    for (let i = 0; i < items.length; i++) {
      const w = K.measure(items[i], T.micro, 'mono', 400) + 44;
      const on = i === active;
      ctx.save();
      ctx.globalAlpha = on ? 0.14 : 0.04;
      ctx.fillStyle = ink;
      ctx.fillRect(cx, y, w, 40);
      ctx.globalAlpha = on ? 0.6 : 0.22;
      ctx.strokeStyle = on ? (o.accent || pal.accent) : ink;
      ctx.lineWidth = on ? 2 : 1;
      ctx.strokeRect(cx + 0.5, y + 0.5, w - 1, 39);
      if (on) {
        ctx.globalAlpha = 0.9;
        ctx.fillStyle = o.accent || pal.accent;
        ctx.fillRect(cx + 1, y + 37, w - 2, 2);
      }
      ctx.restore();
      micro(items[i], cx + w / 2, y + 26, { align: 'center', color: on ? ink : ink, alpha: on ? 0.9 : 0.42, size: T.micro });
      cx += w + 8;
    }
    return cx - x;
  }

  // ---------- 组件：进度条 ----------
  function progress(x, y, w, pct, o) {
    o = o || {};
    const pal = o.pal || K.PAL.system;
    const ink = o.color || pal.ink;
    ctx.save();
    ctx.globalAlpha = 0.18;
    ctx.fillStyle = ink;
    ctx.fillRect(x, y, w, o.h || 6);
    ctx.globalAlpha = o.alpha == null ? 0.9 : o.alpha;
    ctx.fillStyle = o.accent || pal.accent;
    ctx.fillRect(x, y, w * clamp(pct, 0, 1), o.h || 6);
    ctx.restore();
  }

  // ---------- 组件：环形仪表 ----------
  function gauge(cx, cy, r, pct, o) {
    o = o || {};
    const pal = o.pal || K.PAL.system;
    const ink = o.color || pal.ink;
    const a0 = -Math.PI * 0.75, a1 = Math.PI * 0.75;
    ctx.save();
    ctx.lineWidth = o.lw || 8;
    ctx.globalAlpha = 0.16;
    ctx.strokeStyle = ink;
    ctx.beginPath(); ctx.arc(cx, cy, r, a0, a1); ctx.stroke();
    ctx.globalAlpha = 0.92;
    ctx.strokeStyle = o.accent || pal.accent;
    ctx.beginPath(); ctx.arc(cx, cy, r, a0, a0 + (a1 - a0) * clamp(pct, 0, 1)); ctx.stroke();
    // 刻度
    ctx.globalAlpha = 0.3;
    ctx.strokeStyle = ink;
    ctx.lineWidth = 2;
    for (let i = 0; i <= 10; i++) {
      const a = a0 + (a1 - a0) * i / 10;
      const r1 = r + 10, r2 = r + (i % 5 === 0 ? 20 : 15);
      ctx.beginPath();
      ctx.moveTo(cx + Math.cos(a) * r1, cy + Math.sin(a) * r1);
      ctx.lineTo(cx + Math.cos(a) * r2, cy + Math.sin(a) * r2);
      ctx.stroke();
    }
    ctx.restore();
    if (o.label) meta(o.label, cx, cy + r + 46, { align: 'center', color: ink, alpha: 0.5, size: T.micro });
    if (o.value) meta(o.value, cx, cy + 10, { align: 'center', color: ink, alpha: 0.9, size: T.h3, ls: 1 });
  }

  // ---------- 组件：迷你折线 ----------
  function sparkline(x, y, w, h, pts, o) {
    o = o || {};
    const pal = o.pal || K.PAL.system;
    ctx.save();
    ctx.globalAlpha = o.alpha == null ? 0.85 : o.alpha;
    ctx.strokeStyle = o.color || pal.accent;
    ctx.lineWidth = o.lw || 2;
    ctx.beginPath();
    for (let i = 0; i < pts.length; i++) {
      const px = x + (i / (pts.length - 1)) * w;
      const py = y + h - clamp(pts[i], 0, 1) * h;
      i === 0 ? ctx.moveTo(px, py) : ctx.lineTo(px, py);
    }
    ctx.stroke();
    ctx.restore();
  }

  // ---------- 组件：波形 ----------
  function wave(x, y, w, h, t, o) {
    o = o || {};
    const pal = o.pal || K.PAL.system;
    const n = o.n || 64;
    ctx.save();
    ctx.globalAlpha = o.alpha == null ? 0.5 : o.alpha;
    ctx.fillStyle = o.color || pal.accent;
    const bw = w / n;
    for (let i = 0; i < n; i++) {
      const v = Math.abs(Math.sin(i * 0.7 + t * 3.1) * 0.6 + Math.sin(i * 0.23 - t * 1.7) * 0.4);
      const hh = Math.max(2, v * h);
      ctx.fillRect(x + i * bw, y + (h - hh) / 2, Math.max(1.5, bw - 2), hh);
    }
    ctx.restore();
  }

  // ---------- 组件：十字准星 ----------
  function crosshair(x, y, s, color, alpha) {
    ctx.save();
    ctx.globalAlpha = alpha == null ? 0.5 : alpha;
    ctx.strokeStyle = color || '#fff';
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(x - s, y); ctx.lineTo(x - s * 0.3, y);
    ctx.moveTo(x + s * 0.3, y); ctx.lineTo(x + s, y);
    ctx.moveTo(x, y - s); ctx.lineTo(x, y - s * 0.3);
    ctx.moveTo(x, y + s * 0.3); ctx.lineTo(x, y + s);
    ctx.stroke();
    ctx.restore();
  }

  // ---------- 组件：虚线框 ----------
  function dashedRect(x, y, w, h, color, alpha, dash) {
    ctx.save();
    ctx.globalAlpha = alpha == null ? 0.4 : alpha;
    ctx.strokeStyle = color || '#fff';
    ctx.lineWidth = 1;
    ctx.setLineDash(dash || [6, 6]);
    ctx.strokeRect(x + 0.5, y + 0.5, w, h);
    ctx.restore();
  }

  // ---------- 组件：状态灯 ----------
  function statusLight(x, y, r, on, color, o) {
    o = o || {};
    if (on) glow(x, y, r * 6, color, 0.32);
    ctx.save();
    ctx.globalAlpha = on ? 0.98 : 0.28;
    ctx.fillStyle = on ? color : '#6b6b6b';
    ctx.beginPath(); ctx.arc(x, y, r, 0, Math.PI * 2); ctx.fill();
    ctx.restore();
  }

  // ---------- 全局框架：每一帧都有的一圈仪表 ----------
  // c = { pal, sec, shot, t, local, lightBg }
  // lightBg: 纸面 / 黄底 / 白框版式 —— 仪表改用深墨，否则浅字压浅底看不见
  function chrome(c) {
    const light = !!c.lightBg;
    const pal = c.pal;
    const ink = light ? (c.inkColor || '#17130f') : pal.ink;
    const acc = accentFor(pal, light);   // 纸/黄底上换深墨，暗底上用原强调色
    const aBase = light ? 1 : 1;

    // 1) 内容区四角定位角标
    const X0 = 120, Y0 = 180, X1 = W - 120, Y1 = H - 180;
    cornerMarks(X0, Y0, X1 - X0, Y1 - Y0, 26, ink, light ? 0.42 : 0.34);

    // 2) 顶部两条标尺（左右各一，中间留给标题）
    ruler(X0, Y0 - 30, 560, 28, ink, light ? 0.32 : 0.3);
    ruler(X1 - 560, Y0 - 30, 560, 28, ink, light ? 0.32 : 0.3);

    // 3) 左右竖向细轨 + 刻度
    const top = Y0 + 26, bot = Y1 - 20;
    line(X0 - 40, top, X0 - 40, bot, ink, light ? 0.26 : 0.2, 1);
    line(X1 + 40, top, X1 + 40, bot, ink, light ? 0.26 : 0.2, 1);
    ctx.save();
    ctx.globalAlpha = light ? 0.34 : 0.26;
    ctx.fillStyle = ink;
    for (let y = top; y < bot; y += 22) {
      const big = Math.round((y - top) / 22) % 5 === 0;
      const l = big ? 13 : 6;
      ctx.fillRect(X0 - 40, y, l, 1);
      ctx.fillRect(X1 + 40 - l, y, l, 1);
    }
    ctx.restore();

    // 4) 左竖轨：段落号（旋转 90°）+ 竖向进度
    const sec = c.sec;
    const pSec = clamp((c.t - sec.start) / Math.max(0.001, sec.end - sec.start), 0, 1);
    ctx.save();
    ctx.translate(X0 - 66, top + 6);
    ctx.rotate(-Math.PI / 2);
    meta(String(sec.index + 1).padStart(2, '0') + ' / ' + String(K.SECTIONS.length).padStart(2, '0'),
      0, 0, { color: ink, alpha: light ? 0.55 : 0.45, size: T.micro, ls: 6 });
    ctx.restore();
    ctx.save();
    ctx.globalAlpha = light ? 0.22 : 0.16;
    ctx.fillStyle = ink;
    ctx.fillRect(X0 - 44, top + 40, 3, bot - top - 60);
    ctx.globalAlpha = 0.95;
    ctx.fillStyle = acc;
    ctx.fillRect(X0 - 44, top + 40, 3, (bot - top - 60) * pSec);
    ctx.restore();

    // 5) 右竖轨：镜头号（旋转）+ 段落百分比
    ctx.save();
    ctx.translate(X1 + 66, bot - 52);
    ctx.rotate(-Math.PI / 2);
    meta('SHOT ' + String(c.shot.n).padStart(2, '0') + ' / 87', 0, 0,
      { color: ink, alpha: light ? 0.55 : 0.45, size: T.micro, ls: 6 });
    ctx.restore();
    meta(String(Math.round(pSec * 100)).padStart(3, '0') + '%', X1 + 56, bot,
      { align: 'right', color: ink, alpha: light ? 0.6 : 0.5, size: T.micro });

    // 6) 底部数据带
    const by = H - 112;
    line(X0 - 40, by - 10, X1 + 40, by - 10, ink, light ? 0.26 : 0.16, 1);
    segments(X0 - 40, by, X1 - X0 + 80, 112, ink, light ? 0.3 : 0.2);
    const bi = K.beatInfo(c.t);
    const cells = [
      ['T+', c.t.toFixed(2) + 's'],
      ['BEAT', String(bi.n).padStart(4, '0')],
      ['BAR', String(((bi.n / 4) | 0)).padStart(3, '0')],
      ['REC', '0001'],
    ];
    for (let i = 0; i < cells.length; i++) {
      const x = X0 - 40 + i * 200;
      micro(cells[i][0], x, by + 52, { color: ink, alpha: light ? 0.4 : 0.3 });
      meta(cells[i][1], x + 58, by + 52, { color: ink, alpha: light ? 0.7 : 0.52, size: T.micro, ls: 2 });
    }
    // 右下：状态灯 + 波形
    const on = Math.floor(c.local * 2) % 2 === 0;
    statusLight(X1 - 300, by + 44, 4, on, acc);
    wave(X1 - 270, by + 32, 240, 22, c.t, { pal: pal, color: acc, alpha: light ? 0.4 : 0.3, n: 40 });
    return aBase;
  }

  // ---------- 顶栏 ----------
  // c = { pal, sec, shot, t, local, lightBg }
  function hud(c) {
    const light = !!c.lightBg;
    const pal = c.pal;
    const ink = light ? (c.inkColor || '#17130f') : pal.ink;
    const acc = accentFor(pal, light);

    // 顶部细线
    line(120, 96, W - 120, 96, ink, light ? 0.3 : 0.16, 1);

    // 左：品牌 + 中文名
    const brand = c.brand || 'THE OGS';
    const sub = c.brand ? 'THE OGS · 过来人档案系统' : '过来人档案系统';
    meta(brand, 120, 72, { color: ink, alpha: light ? 0.8 : 0.85, size: T.meta, ls: 4 });
    // measure() 不含字距，直接用固定偏移，避免两个词粘在一起
    micro(sub, 120 + (c.brand ? 232 : 108), 72, { color: ink, alpha: light ? 0.45 : 0.4, size: T.micro });

    // 中：段落进度 + 段名
    const sec = c.sec;
    const pSec = clamp((c.t - sec.start) / Math.max(0.001, sec.end - sec.start), 0, 1);
    progress(W / 2 - 210, 80, 420, pSec, { pal: pal, color: ink, h: 3, alpha: 0.9, accent: acc });
    micro(String(sec.index + 1).padStart(2, '0') + ' / ' + String(K.SECTIONS.length).padStart(2, '0') + '   ' + sec.name.toUpperCase(),
      W / 2, 70, { align: 'center', color: ink, alpha: light ? 0.5 : 0.55, size: T.micro });

    // 右：时间码
    meta(K.fmtTC(c.t), W - 120, 72, { align: 'right', color: ink, alpha: light ? 0.8 : 0.85, size: T.meta, ls: 3 });

    // 底部日志（放在数据带下方，不压刻度）
    const bi = K.beatInfo(c.t);
    const recs = ['已归档', 'LOCK', 'SYNC', 'READ', 'WRITE', 'INDEX', 'SCAN', 'OK'];
    const parts = [];
    for (let i = 0; i < 5; i++) {
      const n = bi.n - i;
      parts.push('#' + String(1000 + n).padStart(5, '0') + ' ' + recs[Math.abs(n * 7) % recs.length]);
    }
    micro(parts.join('     '), 120, H - 34, { color: ink, alpha: light ? 0.34 : 0.3, size: T.micro });
    meta(sec.name.slice(0, 8).toUpperCase(), W - 120, H - 34,
      { align: 'right', color: ink, alpha: light ? 0.42 : 0.36, size: T.micro, ls: 4 });
  }

  window.UI = {
    lumOf, accentFor,
    T, LS, M,
    meta, micro, glow, hexA, line, box, cornerMarks, ruler, segments,
    panel, button, tabs, progress, gauge, sparkline, wave, crosshair, dashedRect, statusLight,
    chrome, hud,
  };
})();
