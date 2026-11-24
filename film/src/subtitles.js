// film/src/subtitles.js — 每帧末尾统一绘制的三行字幕轨
(function () {
  const K = window.K;
  const { W, H, ctx, TL, ALL_LINES, lineAt, karaoke, text, measure, clamp } = K;

  const CURRENT_Y = H - 238;
  const NEXT_Y = H - 182;
  const NEXT2_Y = H - 134;
  const CURRENT_SIZE = 60;
  const NEXT_SIZE = 36;
  const NEXT2_SIZE = 32;
  const SAFE_WIDTH = W * 0.84;
  const PANEL_X = W * 0.05;
  const PANEL_W = W * 0.90;
  const PANEL_Y = H - 302;
  const PANEL_H = H - 106 - PANEL_Y;

  function followingLines(line) {
    const i = ALL_LINES.indexOf(line);
    return i < 0 ? [] : ALL_LINES.slice(i + 1, i + 3);
  }

  function fitLineSize(line, baseSize) {
    const chars = Array.from(line.text || '').length;
    const spacing = 1.2;
    const baseWidth = measure(line.text, baseSize, 'serif', 400) + Math.max(0, chars - 1) * spacing;
    return { size: baseSize * Math.min(1, SAFE_WIDTH / Math.max(1, baseWidth)), spacing };
  }

  K.drawSubtitles = function drawSubtitles(t) {
    const line = lineAt(t);
    if (!line) return;

    // Match the runtime's final section fade so the subtitle track reaches natural black with the image.
    const endFade = clamp((TL.duration - t) / 0.20, 0, 1);
    if (endFade <= 0) return;

    const following = followingLines(line);
    const paper = !!window.__LIGHT;
    const colors = paper
      ? { panel: 'rgba(241,233,215,0.97)', border: 'rgba(48,39,28,0.72)', text: '#201b15', active: '#a8402c' }
      : { panel: 'rgba(7,8,10,0.94)', border: 'rgba(200,162,74,0.70)', text: '#f2eddd', active: '#ffd34f' };

    ctx.save();
    ctx.globalAlpha *= endFade;
    ctx.fillStyle = colors.panel;
    ctx.fillRect(PANEL_X, PANEL_Y, PANEL_W, PANEL_H);
    ctx.strokeStyle = colors.border;
    ctx.lineWidth = 1.5;
    ctx.strokeRect(PANEL_X + 0.75, PANEL_Y + 0.75, PANEL_W - 1.5, PANEL_H - 1.5);
    ctx.fillStyle = colors.active;
    ctx.fillRect(PANEL_X + 15, PANEL_Y + 14, 4, PANEL_H - 28);

    karaoke(line, t, {
      x: W / 2, y: CURRENT_Y, align: 'center',
      size: CURRENT_SIZE, fam: 'serif', weight: 700,
      color: colors.text, activeColor: colors.active, accent: colors.active,
      gap: 5, maxWidth: SAFE_WIDTH, unsung: 0.78,
    });

    if (following[0] && following[0].text) {
      const fit = fitLineSize(following[0], NEXT_SIZE);
      text(following[0].text, W / 2, NEXT_Y, {
        size: fit.size, fam: 'serif', weight: 400, align: 'center',
        color: colors.text, letterSpacing: fit.spacing,
      });
    }
    if (following[1] && following[1].text) {
      const fit = fitLineSize(following[1], NEXT2_SIZE);
      text(following[1].text, W / 2, NEXT2_Y, {
        size: fit.size, fam: 'serif', weight: 400, align: 'center',
        color: colors.text, letterSpacing: fit.spacing,
      });
    }
    ctx.restore();
  };
})();
