// 刘邦与战争段连续叙事。画面只由绝对时间 t 决定，人物姿态不作变形或动作伪造。
(function () {
  const K = window.K;
  const { W, H, ctx, clamp, lerp, inv, ease, text } = K;
  const L = window.LAYOUTS;
  const PORTRAIT = 'LIUBANG_REFERENCE_V2';
  const DUFU = 'DUFU_REFERENCE_V2';
  const BATTLE = 'BATTLE_SCENE_V1';
  const WIND = 'WIND_BANNER_LINE_V1';
  const PAPER = '#d9cfb8';
  const INK = '#211b14';
  const MUTED = '#766a56';

  function paper() {
    window.__LIGHT = true;
    ctx.save();
    ctx.fillStyle = PAPER;
    ctx.fillRect(0, 0, W, H);
    ctx.restore();
  }

  function stroke(points, color, width, alpha) {
    if (!points || points.length < 2) return;
    ctx.save();
    ctx.globalAlpha *= alpha == null ? 1 : alpha;
    ctx.strokeStyle = color || INK;
    ctx.lineWidth = width || 2;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
    ctx.beginPath();
    ctx.moveTo(points[0][0], points[0][1]);
    for (let i = 1; i < points.length; i++) ctx.lineTo(points[i][0], points[i][1]);
    ctx.stroke();
    ctx.restore();
  }

  function drawPortraitArt(alpha, progress) {
    const scale = 1 + 0.014 * clamp(progress, 0, 1);
    drawReferenceFigure(PORTRAIT, 213, 55, 690, alpha, scale);
  }

  function drawReferenceFigure(id, x, y, size, alpha, scale) {
    if (!window.PHOTO || !window.PHOTO.has(id) || alpha <= 0.001) return;
    ctx.save();
    ctx.translate(x + size / 2, y + size / 2);
    ctx.scale(scale || 1, scale || 1);
    ctx.translate(-(x + size / 2), -(y + size / 2));
    // 原图 alpha 与明暗直接合成到画面；contain 保留坐姿素材的完整比例。
    window.PHOTO.plate(id, x, y, size, size, {
      raw: true, fit: 'contain', alpha, label: false,
    });
    ctx.restore();
  }

  function identityTag(alpha) {
    if (alpha <= 0.001) return;
    ctx.save();
    ctx.globalAlpha *= alpha;
    text('刘邦', 1120, 278, {
      size: 68, fam: 'serif', weight: 700, color: INK,
    });
    text('亭长 / 47岁', 1122, 328, {
      size: 28, fam: 'sans', color: MUTED,
    });
    ctx.restore();
  }

  function wineTable(alpha) {
    if (alpha <= 0.001) return;
    ctx.save();
    ctx.globalAlpha *= alpha;
    // 桌案与酒爵只作静物；没有新增举杯、倾倒等未经素材支持的手势。
    ctx.fillStyle = 'rgba(33,27,20,0.035)';
    ctx.beginPath();
    ctx.moveTo(1110, 698);
    ctx.lineTo(1710, 698);
    ctx.lineTo(1678, 724);
    ctx.lineTo(1142, 724);
    ctx.closePath();
    ctx.fill();
    stroke([[1110, 698], [1710, 698], [1678, 724], [1142, 724], [1110, 698]], INK, 2.1, 0.66);
    stroke([[1144, 724], [1144, 755], [1675, 755], [1675, 724]], MUTED, 1.7, 0.48);

    const cx = 1455, top = 604;
    ctx.strokeStyle = INK;
    ctx.lineWidth = 3;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
    ctx.beginPath();
    ctx.ellipse(cx, top + 5, 36, 9, 0, 0, Math.PI * 2);
    ctx.moveTo(cx - 32, top + 8);
    ctx.lineTo(cx - 24, top + 54);
    ctx.quadraticCurveTo(cx, top + 68, cx + 24, top + 54);
    ctx.lineTo(cx + 32, top + 8);
    ctx.moveTo(cx, top + 66);
    ctx.lineTo(cx, top + 84);
    ctx.ellipse(cx, top + 88, 25, 5, 0, 0, Math.PI * 2);
    ctx.stroke();
    ctx.restore();
  }

  function portraitSequence(c) {
    const t = c.t;
    paper();
    const enter = ease.io(inv(90.02, 90.44, t));
    const leave = 1 - ease.io(inv(103.58, 103.94, t));
    const alpha = enter * leave;
    const progress = ease.io(inv(90.02, 103.94, t));
    drawPortraitArt(alpha, progress);
    identityTag(alpha * ease.out(inv(90.48, 90.86, t)));
    const objectsIn = ease.out(inv(94.86, 95.30, t));
    wineTable(alpha * objectsIn);
  }

  function battleArt(alpha, progress) {
    if (!window.PHOTO || !window.PHOTO.has(BATTLE) || alpha <= 0.001) return;
    const scale = 1 + 0.012 * clamp(progress, 0, 1);
    ctx.save();
    ctx.translate(W / 2, H / 2);
    ctx.scale(scale, scale);
    ctx.translate(-W / 2, -H / 2);
    // 16:9 原图铺满画幅，保持士兵、旗帜和兵刃的原始比例与刻线。
    window.PHOTO.plate(BATTLE, 0, 0, W, H, { raw: true, alpha: alpha * 0.92, label: false });
    ctx.restore();
  }

  function yearRatio(t, alpha) {
    if (alpha <= 0.001) return;
    ctx.save();
    ctx.globalAlpha *= alpha;
    // 7 在 #26 起点出现；冒号跟“输”，6 精确跟 TL 中“六”(113.153s)，不提前揭示答案。
    text('7', 98, 196, {
      size: 92, fam: 'serif', weight: 700, color: INK,
      alpha: ease.out(inv(111.94, 112.00, t)),
    });
    text(':', 176, 196, {
      size: 86, fam: 'serif', weight: 400, color: INK,
      alpha: ease.out(inv(112.935, 113.04, t)),
    });
    text('6', 244, 196, {
      size: 92, fam: 'serif', weight: 700, color: INK,
      alpha: ease.out(inv(113.153, 113.27, t)),
    });
    ctx.restore();
  }

  function winnerTag(alpha) {
    if (alpha <= 0.001) return;
    ctx.save();
    ctx.globalAlpha *= alpha;
    text('刘邦', 1120, 278, {
      size: 68, fam: 'serif', weight: 700, color: INK,
    });
    ctx.restore();
  }

  function warExperience(c) {
    const t = c.t;
    paper();
    const reveal = c.shot.n === 28;
    const battlefieldIn = ease.out(inv(111.94, 112.10, t));
    const battlefieldOut = reveal ? 1 - ease.io(inv(117.72, 118.34, t)) : 1;
    const battleAlpha = battlefieldIn * battlefieldOut;
    const progress = ease.io(inv(111.94, 117.55, t));
    battleArt(battleAlpha, progress);

    const ratioOut = reveal ? 1 - ease.io(inv(116.72, 117.08, t)) : 1;
    yearRatio(t, ratioOut);

    if (reveal) {
      const portraitIn = ease.io(inv(118.02, 118.56, t));
      const portraitOut = 1 - ease.io(inv(119.22, 119.45, t));
      const portraitAlpha = portraitIn * portraitOut;
      drawPortraitArt(portraitAlpha, 0.45);
      winnerTag(portraitAlpha * ease.io(inv(118.54, 119.02, t)));
    }
  }

  function windBanner(alpha, progress) {
    if (!window.PHOTO || !window.PHOTO.has(WIND) || alpha <= 0.001) return;
    const scale = 1 + 0.024 * clamp(progress, 0, 1);
    ctx.save();
    ctx.translate(W / 2, H / 2);
    ctx.scale(scale, scale);
    ctx.translate(-W / 2, -H / 2);
    // 用新线描旗景作主体，只轻推整幅原图，不摇晃伪造旗布动作。
    window.PHOTO.plate(WIND, 0, 0, W, H, { raw: true, alpha, label: false });
    ctx.restore();
  }

  function windTrails(t, alpha) {
    if (alpha <= 0.001) return;
    const p = ease.out(inv(127.60, 129.92, t));
    const lanes = [
      { y: 164, rise: -24, bend: -12 },
      { y: 258, rise: -17, bend: 10 },
      { y: 354, rise: -10, bend: -7 },
    ];
    const handoff = 1 - ease.io(inv(134.82, 135.62, t));
    ctx.save();
    ctx.beginPath();
    ctx.rect(0, 0, W, 778);
    ctx.clip();
    lanes.forEach((lane, i) => {
      const head = lerp(110, W, p);
      ctx.save();
      ctx.globalAlpha *= alpha * handoff * (0.38 - i * 0.055);
      ctx.strokeStyle = MUTED;
      ctx.lineWidth = i === 0 ? 1.8 : 1.3;
      ctx.lineCap = 'round';
      ctx.beginPath();
      ctx.moveTo(0, lane.y);
      ctx.bezierCurveTo(head * 0.30, lane.y + lane.rise, head * 0.70, lane.y + lane.bend, head, lane.y + lane.rise * 0.25);
      ctx.stroke();
      ctx.restore();
    });
    ctx.restore();
  }

  function throughLine(t, alpha) {
    if (alpha <= 0.001) return;
    const reveal = ease.out(inv(129.78, 129.94, t));
    stroke([[0, 572], [W * reveal, 572]], MUTED, 1.6, alpha);
  }

  function windExperience(c) {
    const t = c.t;
    paper();
    const storyIn = ease.out(inv(127.60, 127.90, t));
    const bannerProgress = ease.io(inv(127.60, 129.90, t));
    const bannerOut = 1 - ease.io(inv(129.90, 131.10, t));
    windBanner(storyIn * bannerOut, bannerProgress);

    // 云线由左向右显出，原图退场后仍留细线接住并列人物。
    windTrails(t, storyIn);

    const lineIn = ease.io(inv(129.72, 129.98, t));
    const lineOut = 1 - ease.io(inv(134.96, 135.62, t));
    throughLine(t, storyIn * lineIn * lineOut);

    const figuresIn = ease.io(inv(130.04, 130.72, t));
    const figuresOut = 1 - ease.io(inv(134.96, 135.62, t));
    const figuresAlpha = storyIn * figuresIn * figuresOut;
    drawReferenceFigure(DUFU, 326, 146, 410, figuresAlpha, 1);
    drawReferenceFigure(PORTRAIT, 1176, 168, 370, figuresAlpha, 1);

    // 前奏与回灯镜头共用同一真实油灯取景，作为现代段入口。
    if (t >= 135.62 && typeof L.lampCallback === 'function') {
      L.lampCallback({ t, shot: { t: 135.62 }, dur: 1.28 });
    }
  }

  L.liubangPortrait = portraitSequence;
  L.warExperience = warExperience;
  L.windExperience = windExperience;
})();
