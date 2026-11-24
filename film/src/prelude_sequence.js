// 前奏与回灯镜头：使用同一张暖纸线描案头图，不画日志、光标或字幕。
(function () {
  const K = window.K;
  const { W, H, ctx, clamp, lerp, inv, ease } = K;
  const L = window.LAYOUTS;
  const DESK = 'LAMP_DESK_LINE_V1';
  const PAPER = '#d9cfb8';
  const SCROLLS_FOCUS = { x: 0.63, y: 0.58 };
  const LAMP_FOCUS = { x: 0.29, y: 0.50 };
  const FLAME = { x: 687 / 1672 * W, y: 270 / 941 * H };

  function paper() {
    window.__LIGHT = true;
    ctx.save();
    ctx.fillStyle = PAPER;
    ctx.fillRect(0, 0, W, H);
    ctx.restore();
  }

  // 对原始 16:9 线描图只做等比缩放与平移；focus 为原画归一化取景点。
  function deskFrame(alpha, scale, focusX, focusY, travel, inkOnly) {
    if (!window.PHOTO || !window.PHOTO.has(DESK) || alpha <= 0.001) return;
    const p = clamp(travel == null ? 1 : travel, 0, 1);
    const panX = -(focusX - 0.5) * W * scale * p;
    const panY = -(focusY - 0.5) * H * scale * p;
    ctx.save();
    ctx.translate(W / 2 + panX, H / 2 + panY);
    ctx.scale(scale, scale);
    ctx.translate(-W / 2, -H / 2);
    window.PHOTO.plate(DESK, 0, 0, W, H, {
      raw: !inkOnly, inkOnly: !!inkOnly, alpha, label: false,
    });
    ctx.restore();
    return { scale, panX, panY };
  }

  function lampGlow(camera, strength) {
    if (!camera || strength <= 0.001) return;
    const x = W / 2 + camera.panX + camera.scale * (FLAME.x - W / 2);
    const y = H / 2 + camera.panY + camera.scale * (FLAME.y - H / 2);
    const radius = 176;
    const glow = ctx.createRadialGradient(x, y, 8, x, y, radius);
    glow.addColorStop(0, `rgba(213,151,58,${strength})`);
    glow.addColorStop(0.42, `rgba(213,151,58,${strength * 0.42})`);
    glow.addColorStop(1, 'rgba(213,151,58,0)');
    ctx.save();
    ctx.beginPath();
    ctx.rect(0, 0, W, 778);
    ctx.clip();
    ctx.fillStyle = glow;
    ctx.fillRect(x - radius, y - radius, radius * 2, radius * 2);
    ctx.restore();
  }

  function revealDesk(t) {
    if (!window.PHOTO || !window.PHOTO.has(DESK)) { paper(); return; }
    window.__LIGHT = true;
    const progress = ease.out(inv(0.25, 3.4, t));
    const radius = lerp(72, Math.hypot(W, H) * 0.78, progress);
    const feather = lerp(54, 250, progress);
    const mask = ctx.createRadialGradient(
      FLAME.x, FLAME.y, Math.max(0, radius - feather),
      FLAME.x, FLAME.y, radius,
    );
    mask.addColorStop(0, 'rgba(255,255,255,1)');
    mask.addColorStop(0.62, 'rgba(255,255,255,0.80)');
    mask.addColorStop(1, 'rgba(255,255,255,0)');

    // 在透明画布上单独给原图做柔边显影，再把纸底垫回去。
    ctx.save();
    ctx.clearRect(0, 0, W, H);
    window.PHOTO.plate(DESK, 0, 0, W, H, { raw: true, label: false });
    ctx.globalCompositeOperation = 'destination-in';
    ctx.fillStyle = mask;
    ctx.fillRect(0, 0, W, H);
    ctx.globalCompositeOperation = 'destination-over';
    ctx.fillStyle = PAPER;
    ctx.fillRect(0, 0, W, H);
    ctx.restore();
  }

  function preludeLamp(c) {
    const t = c.t;
    if (t < 0.25) {
      paper();
      return;
    }
    if (t < 3.4) {
      // 从原画火焰位置向桌面扩展柔边显影，不重画火焰。
      revealDesk(t);
      return;
    }

    paper();
    if (t < 7.4) {
      const hold = ease.io(inv(3.4, 7.4, t));
      const scale = lerp(1.005, 1.010, hold);
      const camera = deskFrame(1, scale, 0.5, 0.5, 0);
      const breath = 0.018 + 0.006 * (0.5 + 0.5 * Math.sin((t - 3.4) * Math.PI * 2 / 2.0));
      lampGlow(camera, breath);
      return;
    }

    // 7.4 秒后延续前一镜的轻推，转向卷轴、行囊与桌边路线。
    const progress = ease.io(inv(7.4, 15.0, t));
    const scale = lerp(1.010, 1.06, progress);
    deskFrame(1, scale, SCROLLS_FOCUS.x, SCROLLS_FOCUS.y, progress);
  }

  function lampCallback(c) {
    paper();
    const start = c.shot.t;
    const progress = ease.io(inv(start, start + c.dur, c.t));
    const alpha = c.alpha == null ? 1 : clamp(c.alpha, 0, 1);
    // 油灯本体与火焰同框，慢推近并沿用原画里的暖光，不叠光点。
    const scale = lerp(1.32, 1.39, progress);
    const camera = deskFrame(alpha * ease.out(inv(start, start + 0.24, c.t)), scale, LAMP_FOCUS.x, LAMP_FOCUS.y, 1, true);
    const breath = 0.014 + 0.005 * (0.5 + 0.5 * Math.sin((c.t - start) * Math.PI * 2 / 1.86));
    lampGlow(camera, breath * alpha);
  }

  L.preludeLamp = preludeLamp;
  L.lampCallback = lampCallback;
})();
