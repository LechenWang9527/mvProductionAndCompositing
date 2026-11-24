// 古代副歌画面：长安路径与人物接力 → 茅屋、人物与沿途灯光。
// 只使用绝对时间驱动画面，不绘歌词或标签；底部统一字幕由 subtitles.js 处理。
(function () {
  const K = window.K;
  const { W, H, ctx, PAL, clamp, inv, ease, lerp } = K;
  const PHOTO = window.PHOTO;
  const L = window.LAYOUTS;

  const P05 = 'P05';
  const P03 = 'P03';
  const HUT = 'HUT_SCENE_V1';
  const DUFU = 'DUFU_REFERENCE_V2';
  const CHANGAN = 'CHANGAN_LINE_V1';
  const LIUBANG = 'LIUBANG_REFERENCE_V2';
  const HUT_SCALE = 0.82;
  const HUT_DOOR = [W / 2 + (W * 0.574 - W / 2) * HUT_SCALE, H / 2 + (H * 0.545 - H / 2) * HUT_SCALE];
  const INK = '#17130f';
  const PAPER = '#e6dcc8';
  const CINNABAR = '#a8402c';
  const AMBER = '#ffcc00';

  function fill(col) {
    ctx.fillStyle = col;
    ctx.fillRect(0, 0, W, H);
  }

  function cityFallback() {
    // Visible fallback with a readable wall, gate and central avenue.
    fill(PAPER);
    line([[145, 590], [145, 430], [240, 395], [335, 430], [335, 590]], INK, 4, 0.75);
    line([[1585, 590], [1585, 430], [1680, 395], [1775, 430], [1775, 590]], INK, 4, 0.75);
    line([[145, 590], [740, 590], [810, 650], [1110, 650], [1180, 590], [1775, 590]], INK, 4, 0.72);
    line([[740, 590], [790, 510], [1130, 510], [1180, 590]], INK, 4, 0.76);
    line([[820, 510], [850, 445], [1070, 445], [1100, 510]], INK, 3, 0.72);
    line([[875, 445], [900, 402], [1020, 402], [1045, 445]], INK, 3, 0.70);
    line([[960, 648], [960, 390]], '#75664c', 2.2, 0.5);
    for (let i = 0; i < 5; i++) {
      const y = 545 - i * 42;
      const w = 170 - i * 18;
      line([[960 - w, y], [960 + w, y]], '#75664c', 1.5, 0.32);
    }
  }

  function drawCityPlate(scale, alpha) {
    window.__LIGHT = true;
    fill(PAPER);
    ctx.save();
    if (scale && scale !== 1) {
      ctx.translate(W / 2, H / 2);
      ctx.scale(scale, scale);
      ctx.translate(-W / 2, -H / 2);
    }
    if (PHOTO && PHOTO.has(CHANGAN)) {
      PHOTO.plate(CHANGAN, 0, 0, W, H, { raw: true, alpha: alpha == null ? 1 : alpha, label: false });
    } else {
      ctx.save();
      ctx.globalAlpha *= alpha == null ? 1 : alpha;
      cityFallback();
      ctx.restore();
    }
    ctx.restore();
  }

  function drawCityRoute(progress, alpha) {
    // Follow the illustration's central avenue from the gate toward the inner city.
    curve([W * 0.500, H * 0.690], [W * 0.500, H * 0.620], [W * 0.500, H * 0.485], [W * 0.500, H * 0.345], CINNABAR, 3, alpha == null ? 0.70 : alpha, progress);
  }

  function drawChangAnApproach(c) {
    const push = 1 + 0.024 * ease.io(inv(0.1, c.dur, c.local));
    drawCityPlate(push, 1);
    drawCityRoute(ease.out(inv(0.25, c.dur - 0.18, c.local)), 0.72);
  }

  function drawPortraitFallback(x, y, size, alpha) {
    ctx.save();
    ctx.globalAlpha *= alpha;
    ctx.translate(x, y);
    ctx.scale(size / 520, size / 520);
    ctx.fillStyle = '#4a3d2c';
    ctx.beginPath(); ctx.arc(260, 105, 44, 0, Math.PI * 2); ctx.fill();
    ctx.beginPath();
    ctx.moveTo(178, 165); ctx.lineTo(342, 165); ctx.lineTo(390, 455);
    ctx.lineTo(315, 495); ctx.lineTo(260, 360); ctx.lineTo(205, 495);
    ctx.lineTo(130, 455); ctx.closePath(); ctx.fill();
    ctx.restore();
  }

  function liubangFigure(x, y, size, alpha) {
    if (alpha <= 0.005) return;
    if (PHOTO && PHOTO.has(LIUBANG)) {
      PHOTO.plate(LIUBANG, x, y, size, size, { raw: true, fit: 'contain', label: false, alpha });
    } else {
      drawPortraitFallback(x, y, size, alpha);
    }
  }

  function drawCityRelay(c) {
    const recede = ease.out(inv(0.12, 2.80, c.local));
    drawCityPlate(lerp(1.045, 0.965, recede), lerp(0.72, 0.24, recede));
    drawCityRoute(1, 0.24);

    const duX = 340, duY = 145, duSize = 480;
    const liX = 1050, liY = 250, liSize = 360;
    const duFoot = [duX + duSize * 0.51, duY + duSize * 0.90];
    const liFoot = [liX + liSize * 0.50, liY + liSize * 0.96];
    const link = ease.out(inv(1.55, 3.15, c.local));
    curve(duFoot, [W * 0.405, H * 0.575], [W * 0.565, H * 0.575], liFoot, CINNABAR, 2.6, 0.58, link);

    const duAlpha = ease.out(inv(0.20, 0.95, c.local));
    const liAlpha = ease.out(inv(1.80, 2.62, c.local));
    dufuFigure(duX, duY, duSize, 0.92 * duAlpha);
    liubangFigure(liX, liY, liSize, 0.92 * liAlpha);
  }

  function rgba(hex, alpha) {
    const n = parseInt(hex.slice(1), 16);
    return `rgba(${(n >> 16) & 255},${(n >> 8) & 255},${n & 255},${alpha})`;
  }

  function line(points, color, width, alpha) {
    if (!points || points.length < 2) return;
    ctx.save();
    ctx.globalAlpha *= alpha == null ? 1 : alpha;
    ctx.strokeStyle = color;
    ctx.lineWidth = width || 2;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
    ctx.beginPath();
    ctx.moveTo(points[0][0], points[0][1]);
    for (let i = 1; i < points.length; i++) ctx.lineTo(points[i][0], points[i][1]);
    ctx.stroke();
    ctx.restore();
  }

  function pointOnCurve(p0, p1, p2, p3, u) {
    const v = 1 - u;
    return [
      v * v * v * p0[0] + 3 * v * v * u * p1[0] + 3 * v * u * u * p2[0] + u * u * u * p3[0],
      v * v * v * p0[1] + 3 * v * v * u * p1[1] + 3 * v * u * u * p2[1] + u * u * u * p3[1],
    ];
  }

  function curve(p0, p1, p2, p3, color, width, alpha, progress) {
    const n = 36;
    const end = Math.max(1, Math.ceil(n * clamp(progress, 0, 1)));
    const pts = [];
    for (let i = 0; i <= end; i++) pts.push(pointOnCurve(p0, p1, p2, p3, Math.min(i / n, progress)));
    line(pts, color, width, alpha);
  }

  function glow(x, y, radius, color, alpha) {
    ctx.save();
    const g = ctx.createRadialGradient(x, y, 1, x, y, radius);
    g.addColorStop(0, rgba(color, 0.50));
    g.addColorStop(0.24, rgba(color, 0.21));
    g.addColorStop(1, rgba(color, 0));
    ctx.globalAlpha *= alpha;
    ctx.fillStyle = g;
    ctx.fillRect(x - radius, y - radius, radius * 2, radius * 2);
    ctx.restore();
  }

  function lampHead(x, y, scale, color, alpha) {
    glow(x, y, 54 * scale, color, alpha * 0.60);
    ctx.save();
    ctx.globalAlpha *= alpha;
    ctx.fillStyle = color;
    ctx.fillRect(x - 8 * scale, y - 3 * scale, 17 * scale, 6 * scale);
    ctx.restore();
  }

  function roadFallback(pal) {
    fill(pal.bg);
    ctx.fillStyle = '#17191a';
    ctx.fillRect(0, 385, W, H - 385);
    ctx.fillStyle = '#242527';
    ctx.beginPath();
    ctx.moveTo(0, 500); ctx.lineTo(720, 420); ctx.lineTo(1200, 420); ctx.lineTo(W, 500);
    ctx.lineTo(W, H); ctx.lineTo(0, H); ctx.closePath(); ctx.fill();
    ctx.fillStyle = '#393638';
    ctx.fillRect(0, 360, 520, 135);
    ctx.fillRect(1360, 385, 560, 110);
    line([[W * 0.50, 494], [W * 0.50, 760]], '#d5ad45', 3, 0.55);
    const poles = [
      [0.15, 0.23, 1.00], [0.28, 0.39, 0.72], [0.36, 0.45, 0.58],
      [0.41, 0.49, 0.45], [0.445, 0.53, 0.34], [0.47, 0.56, 0.26],
    ];
    poles.forEach(([fx, fy, scale]) => {
      const x = W * fx, y = H * fy, s = scale;
      line([[x, y], [x, y + 86 * s], [x - 20 * s, y + 91 * s]], '#262322', 5 * s, 0.95);
      lampHead(x - 17 * s, y, s, AMBER, 0.92);
    });
  }

  const ROAD_LAMPS = [
    [0.157, 0.216, 1.00], [0.282, 0.423, 0.62], [0.351, 0.467, 0.46],
    [0.388, 0.503, 0.36], [0.416, 0.532, 0.29], [0.440, 0.554, 0.23],
    [0.460, 0.570, 0.19],
  ];

  function drawRoad(c, reprise) {
    const pal = c.pal || PAL.system;
    window.__LIGHT = false;
    fill(pal.bg);
    const push = 1 + 0.014 * ease.io(inv(0.15, c.dur, c.local));
    ctx.save();
    ctx.translate(W / 2, H / 2);
    ctx.scale(push, push);
    ctx.translate(-W / 2, -H / 2);
    if (PHOTO && PHOTO.has(P05)) {
      PHOTO.plate(P05, 0, 0, W, H, { raw: true, label: false });
    } else {
      roadFallback(pal);
    }
    ctx.restore();

    // Keep the first hook in the dark system palette; the warm paper and amber lamps remain visible.
    if (!reprise) {
      ctx.save();
      ctx.fillStyle = 'rgba(7,8,10,0.28)';
      ctx.fillRect(0, 0, W, H);
      ctx.restore();
    }

    const lampProgress = reprise
      ? ease.out(inv(0.06, 1.80, c.local))
      : ease.out(inv(0.18, 1.15, c.local));
    ROAD_LAMPS.forEach(([fx, fy, scale], i) => {
      const delay = reprise ? Math.max(0, 1 - i * 0.095) : (i === 0 ? 1 : 0.32);
      const alpha = lampProgress * delay * (reprise ? 0.68 : 0.58);
      if (alpha > 0.002) lampHead(W * fx, H * fy, scale, AMBER, alpha);
    });

    // A narrow trace follows the existing center lane; it stops above the fixed subtitle safe area.
    const routeProgress = reprise
      ? ease.out(inv(0.28, 1.72, c.local))
      : ease.out(inv(0.48, 1.80, c.local));
    curve([W * 0.500, H * 0.565], [W * 0.499, H * 0.620], [W * 0.501, H * 0.680], [W * 0.500, H * 0.716], AMBER, 2.4, reprise ? 0.45 : 0.34, routeProgress);
  }

  function paperBase() {
    window.__LIGHT = true;
    fill(PAPER);
  }

  function paperFallback() {
    paperBase();
    // A clear cottage silhouette and doorway, used only when the supplied illustration is unavailable.
    line([[360, 565], [520, 435], [900, 390], [1210, 510], [1210, 735], [360, 735], [360, 565]], INK, 5, 0.86);
    line([[520, 435], [580, 345], [1040, 350], [1210, 510]], INK, 4, 0.76);
    line([[840, 735], [840, 585], [970, 585], [970, 735]], INK, 3.5, 0.82);
    line([[600, 585], [705, 585], [705, 668], [600, 668], [600, 585]], '#665b49', 2.5, 0.75);
    line([[480, 770], [690, 790], [920, 784], [1140, 770]], '#75664c', 2, 0.55);
  }

  function dufuFallback() {
    const x = 260, y = 95;
    ctx.save();
    ctx.fillStyle = '#453b2e';
    ctx.beginPath();
    ctx.arc(x, y, 34, 0, Math.PI * 2); ctx.fill();
    ctx.beginPath();
    ctx.moveTo(x - 45, y + 38); ctx.lineTo(x + 42, y + 38); ctx.lineTo(x + 68, y + 300);
    ctx.lineTo(x + 24, y + 330); ctx.lineTo(x, y + 175); ctx.lineTo(x - 28, y + 330);
    ctx.lineTo(x - 74, y + 300); ctx.closePath(); ctx.fill();
    ctx.restore();
  }

  function drawPaperPath(t) {
    const progress = ease.out(inv(0.25, 1.75, t));
    curve([W * 0.225, H * 0.672], [W * 0.385, H * 0.735], [W * 0.488, H * 0.650], HUT_DOOR, CINNABAR, 2.2, 0.68, progress);
    const arrival = ease.out(inv(1.02, 1.90, t));
    if (arrival > 0.01) glow(HUT_DOOR[0], HUT_DOOR[1], 78, '#d69b3c', arrival * 0.20);
  }

  function drawHutBackdrop(zoom, anchorX, anchorY) {
    window.__LIGHT = true;
    paperBase();
    ctx.save();
    const scale = HUT_SCALE * (zoom || 1);
    if (scale !== 1) {
      ctx.translate(anchorX == null ? W / 2 : anchorX, anchorY == null ? H / 2 : anchorY);
      ctx.scale(scale, scale);
      ctx.translate(-(anchorX == null ? W / 2 : anchorX), -(anchorY == null ? H / 2 : anchorY));
    }
    if (PHOTO && PHOTO.has(HUT)) PHOTO.plate(HUT, 0, 0, W, H, { raw: true, label: false });
    else paperFallback();
    ctx.restore();
  }

  function dufuFigure(x, y, size, alpha) {
    if (alpha <= 0.005) return;
    if (PHOTO && PHOTO.has(DUFU)) {
      PHOTO.plate(DUFU, x, y, size, size, { raw: true, fit: 'contain', label: false, alpha });
    } else {
      ctx.save();
      ctx.globalAlpha *= alpha;
      ctx.translate(x, y);
      ctx.scale(size / 520, size / 520);
      dufuFallback();
      ctx.restore();
    }
  }

  function drawHutStart(c) {
    drawHutBackdrop();
    drawPaperPath(c.local);
  }

  function drawExtendedPath(progress, color, alpha) {
    curve(HUT_DOOR, [W * 0.665, H * 0.590], [W * 0.775, H * 0.655], [W * 0.900, H * 0.670], color, 2.4, alpha, progress);
  }

  function drawHutRoad(c) {
    drawHutBackdrop();
    drawPaperPath(2.0);
    drawExtendedPath(ease.out(inv(0.20, 2.50, c.local)), '#6b5f4c', 0.66);
  }

  function drawDufuRelay(c) {
    drawHutBackdrop();
    drawPaperPath(2.0);
    drawExtendedPath(1, '#6b5f4c', 0.62);
    const enter = ease.out(inv(0.12, 0.82, c.local));
    const x = lerp(12, 24, enter);
    dufuFigure(x, 230, 520, 0.96 * enter);
  }

  function drawPathLights(c) {
    drawHutBackdrop();
    drawPaperPath(2.0);
    drawExtendedPath(1, '#6b5f4c', 0.62);
    dufuFigure(24, 230, 520, 0.96);
    const p0 = HUT_DOOR, p1 = [W * 0.665, H * 0.590];
    const p2 = [W * 0.775, H * 0.655], p3 = [W * 0.900, H * 0.670];
    [0.22, 0.50, 0.78].forEach((u, i) => {
      const on = ease.out(inv(0.08 + i * 0.38, 0.38 + i * 0.38, c.local));
      const [x, y] = pointOnCurve(p0, p1, p2, p3, u);
      if (on > 0.005) lampHead(x, y - 4, 0.58, '#d69b3c', 0.82 * on);
    });
  }

  function drawHutLight(c) {
    const focus = ease.io(inv(0.05, Math.max(0.9, c.dur - 0.20), c.local));
    const zoom = 1 + 0.16 * focus;
    const [doorX, doorY] = HUT_DOOR;
    drawHutBackdrop(zoom, doorX, doorY);
    glow(doorX, doorY + 8, 150, '#d69b3c', 0.26 + 0.24 * focus);
    // A small warm opening inside the real doorway makes the paper route's destination clear.
    ctx.save();
    ctx.globalAlpha *= 0.22 + 0.24 * ease.out(inv(0.42, 1.10, c.local));
    ctx.fillStyle = '#d69b3c';
    ctx.fillRect(doorX - 18, doorY - 18, 36, 52);
    ctx.restore();
  }

  function drawFactoryFallback(pal) {
    fill(pal.accent || AMBER);
    ctx.fillStyle = '#17130f';
    ctx.fillRect(90, 130, 890, 560);
    ctx.fillRect(110, 108, 600, 30);
    // Mixer drum, feed hopper, and a short conveyor make the plant subject explicit.
    ctx.beginPath(); ctx.moveTo(310, 260); ctx.lineTo(660, 260); ctx.lineTo(735, 510); ctx.lineTo(255, 510); ctx.closePath(); ctx.fill();
    ctx.fillRect(330, 212, 300, 48);
    ctx.beginPath(); ctx.arc(255, 470, 118, 0, Math.PI * 2); ctx.fill();
    ctx.beginPath(); ctx.arc(255, 470, 72, 0, Math.PI * 2); ctx.fillStyle = '#7d7a72'; ctx.fill();
    ctx.fillStyle = '#17130f'; ctx.fillRect(750, 535, 440, 84);
    for (let i = 0; i < 5; i++) {
      ctx.beginPath(); ctx.arc(805 + i * 80, 645, 27, 0, Math.PI * 2); ctx.fill();
    }
  }

  function drawFactoryPath(c) {
    const progress = ease.out(inv(0.22, 1.90, c.local));
    const curvePts = [[0.47 * W, 0.610 * H], [0.58 * W, 0.665 * H], [0.72 * W, 0.515 * H], [0.91 * W, 0.505 * H]];
    curve(curvePts[0], curvePts[1], curvePts[2], curvePts[3], AMBER, 4, 0.82, progress);
    [0.25, 0.48, 0.72, 0.94].forEach((u, i) => {
      const on = ease.out(inv(0.48 + i * 0.28, 0.88 + i * 0.28, c.local));
      if (on < 0.01 || progress < u) return;
      const [x, y] = pointOnCurve(...curvePts, u);
      glow(x, y, 34, AMBER, on * 0.35);
      ctx.save();
      ctx.globalAlpha *= on;
      ctx.fillStyle = AMBER;
      ctx.beginPath(); ctx.arc(x, y, 5, 0, Math.PI * 2); ctx.fill();
      ctx.restore();
    });
  }

  function drawFactory(c) {
    window.__LIGHT = false;
    fill((c.pal && c.pal.accent) || AMBER);
    if (PHOTO && PHOTO.has(P03)) {
      PHOTO.plate(P03, 0, 0, W, H, { raw: true, label: false });
    } else {
      drawFactoryFallback(c.pal || PAL.marpol);
    }
    drawFactoryPath(c);
  }

  L.chorusExperience = function chorusExperience(c) {
    const shot = c.shot && c.shot.n;
    if (shot === 3) drawChangAnApproach(c);
    else if (shot === 4) drawCityRelay(c);
    else if (shot === 15) drawHutStart(c);
    else if (shot === 16) drawHutRoad(c);
    else if (shot === 17) drawDufuRelay(c);
    else if (shot === 18) drawPathLights(c);
    else if (shot === 51) drawFactory(c);
    else if (shot === 78) drawRoad(c, true);
  };
})();
