// 连续叙事样段：杜甫迁居 → 长安坊格 → 茅屋 → 广厦收回一间家。
// 所有动画由绝对时间求值，重复抽帧保持一致；人物和茅屋插画不作非等比变形。
(function () {
  const K = window.K;
  const { W, H, ctx, PAL, clamp, lerp, inv, ease, text } = K;
  const L = window.LAYOUTS;
  const DUFU = 'DUFU_REFERENCE_V2';
  const HUT = 'HUT_SCENE_V1';
  const CHANGAN = 'CHANGAN_LINE_V1';
  const SHELTER = 'SHELTER_LINE_V1';
  const CRADLE = 'CRADLE_LINE_V1';
  const NOODLE = 'NOODLE_CUP_LINE_V2';
  const LAMP = 'LAMP_DESK_LINE_V1';
  const INK = '#211b14';
  const MUTED = '#867964';
  const CINNABAR = '#a8402c';
  const PAPER = '#d9cfb8';

  function paper() {
    window.__LIGHT = true;
    const g = ctx.createLinearGradient(0, 0, 0, H);
    g.addColorStop(0, '#e6dcc8');
    g.addColorStop(0.55, PAPER);
    g.addColorStop(1, '#c6ba9f');
    ctx.fillStyle = g;
    ctx.fillRect(0, 0, W, H);
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

  function drawDufu(t) {
    if (!window.PHOTO || !window.PHOTO.has(DUFU)) return;
    const intro = ease.io(inv(30.04, 30.68, t));
    const shrink = ease.io(inv(31.95, 33.45, t));
    const size = lerp(700, 588, shrink);
    const scale = size / 700;
    const revealRight = lerp(-40, 830, intro);

    ctx.save();
    // 以人物脚下为支点匀速缩小，跨 #6/#7 保持同一位置与比例。
    ctx.translate(460, 750);
    ctx.scale(scale, scale);
    ctx.translate(-460, -750);
    if (t < 30.72) {
      ctx.beginPath();
      ctx.rect(-50, 0, Math.max(0, revealRight + 50), 760);
      ctx.clip();
    }
    window.PHOTO.plate(DUFU, 460 - size / 2, 750 - size, size, size, {
      raw: true, fit: 'contain', label: false,
    });
    ctx.restore();
  }

  function name(t) {
    // 歌词“杜”“甫”词头分别建立姓名；之后缩成地图上的人物识别。
    const du = ease.out(inv(30.56, 30.78, t));
    const fu = ease.out(inv(30.91, 31.13, t));
    const move = ease.io(inv(32.92, 33.42, t));
    const x = lerp(1050, 1690, move);
    const y = lerp(360, 190, move);
    text('杜', x - 48, y, { size: 84, fam: 'serif', weight: 700, color: INK, align: 'center', alpha: du });
    text('甫', x + 48, y, { size: 84, fam: 'serif', weight: 700, color: INK, align: 'center', alpha: fu });
  }

  function parcel(x, y, w, h, alpha) {
    ctx.save();
    ctx.globalAlpha *= alpha;
    ctx.strokeStyle = INK;
    ctx.lineWidth = 2.5;
    ctx.lineJoin = 'round';
    // 小件行李用几笔交代，避免箱子成为主画面。
    ctx.beginPath();
    ctx.moveTo(x, y + 12); ctx.lineTo(x + w * 0.18, y); ctx.lineTo(x + w, y + 8);
    ctx.lineTo(x + w, y + h); ctx.lineTo(x, y + h); ctx.closePath(); ctx.stroke();
    ctx.beginPath();
    ctx.moveTo(x + w * 0.47, y + 4); ctx.lineTo(x + w * 0.47, y + h);
    ctx.moveTo(x + w * 0.12, y + h * 0.56); ctx.lineTo(x + w, y + h * 0.56);
    ctx.moveTo(x + w * 0.36, y + 4); ctx.lineTo(x + w * 0.57, y + 3);
    ctx.stroke();
    ctx.restore();
  }

  function movingParcels(t) {
    const items = [
      { from: 1710, to: 1250, y: 492, w: 144, h: 106, start: 31.34 },
      { from: 1780, to: 1450, y: 626, w: 108, h: 78, start: 31.95 },
    ];
    items.forEach((b) => {
      if (t < b.start) return;
      const travel = ease.out(inv(b.start, b.start + 0.56, t));
      const arrive = inv(b.start, b.start + 0.12, t);
      const leave = 1 - ease.io(inv(32.98, 33.40, t));
      parcel(lerp(b.from, b.to, travel), b.y, b.w, b.h, arrive * leave);
    });

    const tagIn = ease.out(inv(32.30, 32.56, t));
    const tagOut = 1 - ease.io(inv(32.92, 33.32, t));
    if (tagIn * tagOut > 0.01) {
      ctx.save();
      ctx.globalAlpha *= tagIn * tagOut;
      ctx.fillStyle = 'rgba(241,233,215,0.75)';
      ctx.fillRect(1378, 496, 128, 56);
      stroke([[1378, 496], [1506, 496], [1506, 552]], INK, 1.5, 0.7);
      ctx.fillStyle = CINNABAR;
      ctx.fillRect(1378, 496, 8, 8);
      text('长安', 1440, 536, { size: 34, fam: 'serif', color: INK, align: 'center' });
      ctx.restore();
    }
  }

  function mapCity(t, alpha) {
    const cityIn = ease.out(inv(33.06, 34.10, t));
    if (window.PHOTO && window.PHOTO.has(CHANGAN) && cityIn * alpha > 0.001) {
      ctx.save();
      ctx.globalAlpha *= alpha * cityIn;
      // 透明化原图纸底，城市线描落在同一张暖纸上；只在右侧显影，保持杜甫主体完整。
      ctx.beginPath();
      ctx.rect(915, 176, Math.max(0, 930 * ease.out(inv(33.12, 34.02, t))), 540);
      ctx.clip();
      window.PHOTO.plate(CHANGAN, 900, 158, 930, 523, {
        tone: 'ancient', label: false, inkOnly: true, alpha: alpha * cityIn,
      });
      ctx.restore();
    }

    const markerX = 1440, markerY = 534;
    const route = ease.out(inv(32.96, 33.72, t));
    stroke([[760, 552], [lerp(760, markerX, route), lerp(552, markerY, route)]], CINNABAR, 2.4, alpha * 0.82);
    const pulse = 1 + Math.sin(Math.max(0, t - 33.16) * Math.PI * 2) * 0.14;
    ctx.save();
    ctx.globalAlpha *= alpha * cityIn;
    ctx.fillStyle = 'rgba(168,64,44,0.14)';
    ctx.beginPath(); ctx.arc(markerX, markerY, 17 * pulse, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = CINNABAR;
    ctx.beginPath(); ctx.arc(markerX, markerY, 7, 0, Math.PI * 2); ctx.fill();
    const address = ease.out(inv(33.84, 34.15, t));
    text('长安', 1480, 550, { size: 38, fam: 'serif', color: CINNABAR, alpha: address });
    ctx.restore();

    const price = ease.out(inv(36.48, 36.70, t)) * (1 - ease.io(inv(37.10, 37.32, t)));
    if (price > 0.01) {
      ctx.save();
      ctx.globalAlpha *= alpha * price;
      ctx.translate(1612, 388);
      ctx.rotate(-0.055);
      ctx.strokeStyle = CINNABAR;
      ctx.lineWidth = 3;
      ctx.strokeRect(-56, -34, 112, 68);
      text('涨价', 0, 18, { size: 44, fam: 'serif', weight: 700, color: CINNABAR, align: 'center' });
      ctx.restore();
    }
  }

  function drawHut(t) {
    if (!window.PHOTO || !window.PHOTO.has(HUT)) return;
    // 先让长安格淡出，再以原始细刻线显出茅屋；不在画上另叠屋架。
    const mapAlpha = 1 - ease.io(inv(36.80, 37.22, t));
    if (mapAlpha > 0.01) mapCity(t, mapAlpha);
    const appear = ease.io(inv(36.84, 37.34, t));
    const disappear = 1 - ease.io(inv(40.78, 41.10, t));
    const alpha = appear * disappear;
    if (alpha > 0.001) {
      const push = 1 + 0.012 * ease.io(inv(36.90, 40.92, t));
      ctx.save();
      ctx.globalAlpha *= alpha;
      ctx.translate(W / 2, H / 2);
      ctx.scale(push, push);
      ctx.translate(-W / 2, -H / 2);
      window.PHOTO.plate(HUT, 0, 0, W, H, { raw: true, alpha, label: false });
      ctx.restore();
    }
    // “秋风”只在插画上方的空纸面掠过，建筑本体不被线条遮住。
    const wind = ease.out(inv(38.68, 38.95, t));
    if (wind > 0 && t < 40.8) {
      const phase = (t - 38.68) * 118;
      const lanes = [
        { y: 184, w: 220, off: 0 },
        { y: 224, w: 150, off: 310 },
        { y: 266, w: 180, off: 690 },
      ];
      lanes.forEach((lane, i) => {
        const x = ((phase + lane.off) % (W + lane.w + 260)) - lane.w - 130;
        stroke([[x, lane.y], [x + lane.w * 0.45, lane.y - 4], [x + lane.w, lane.y - 1]], INK, 1.5, wind * 0.22 * (1 - i * 0.12));
      });
    }
  }

  function drawShelterFocus(t) {
    if (!window.PHOTO || !window.PHOTO.has(SHELTER)) return;
    // 完整广厦图只做匀比轻推与微移；不裁局部，也不叠画第二座屋。
    const progress = ease.io(inv(41.00, 45.60, t));
    const scale = lerp(1.0, 1.025, progress);
    const x = (W - W * scale) / 2 - 8 * progress;
    const y = (H - H * scale) / 2 - 4 * progress;
    ctx.save();
    window.PHOTO.plate(SHELTER, x, y, W * scale, H * scale, { raw: true, label: false });
    ctx.restore();

    const lit = ease.out(inv(44.43, 44.70, t));
    if (lit > 0.001) {
      ctx.save();
      ctx.globalAlpha *= lit;
      ctx.fillStyle = 'rgba(211,154,62,0.45)';
      ctx.fillRect(978, 484, 42, 74);
      ctx.restore();
    }
  }

  L.dufuSequence = function (c) {
    const t = c.t;
    paper();
    const shot = c.shot.n;
    if (shot === 6) {
      drawDufu(t);
      name(t);
      movingParcels(t);
      // 迁居句后半的路标从标签长成坊格定位点。
      if (t > 32.86) mapCity(t, ease.io(inv(32.86, 33.24, t)) * 0.42);
      return;
    }
    if (shot === 7) {
      drawDufu(t);
      name(t);
      movingParcels(t);
      mapCity(t, 1);
      return;
    }
    if (shot === 8) {
      drawHut(t);
      return;
    }

    // #9：同一张建筑插画连续收进一间，末句暖亮一格窗。
    drawShelterFocus(t);
  };

  function cradleBirth(c) {
    const t = c.t;
    paper();
    if (window.PHOTO && window.PHOTO.has(CRADLE)) {
      const enter = ease.io(inv(60.05, 60.52, t));
      ctx.save();
      ctx.globalAlpha *= enter;
      window.PHOTO.plate(CRADLE, 0, 0, W, H, { raw: true, alpha: enter, label: false });
      ctx.restore();
    }
    // 右侧留白接入小幅杜甫像与远处城市，表达婴儿在家、杜甫仍在长安。
    const away = ease.io(inv(61.18, 61.72, t));
    if (window.PHOTO && window.PHOTO.has(DUFU)) {
      window.PHOTO.plate(DUFU, 940, 310, 310, 310, {
        raw: true, fit: 'contain', label: false, alpha: away,
      });
    }
    if (window.PHOTO && window.PHOTO.has(CHANGAN)) {
      window.PHOTO.plate(CHANGAN, 1230, 236, 650, 365, {
        tone: 'ancient', label: false, inkOnly: true, alpha: away * 0.84,
      });
    }
    const route = ease.out(inv(61.62, 62.28, t));
    stroke([[820, 552], [lerp(820, 1450, route), lerp(552, 508, route)]], CINNABAR, 2.3, away * 0.84);
    if (route > 0.05) text('长安', 1510, 555, { size: 26, fam: 'serif', color: CINNABAR, alpha: away });
  }

  function noodleLine(c) {
    const t = c.t;
    paper();
    const appear = ease.io(inv(63.72, 64.18, t));
    if (window.PHOTO && window.PHOTO.has(NOODLE)) {
      ctx.save();
      ctx.globalAlpha *= appear;
      ctx.translate(W / 2, H / 2);
      const push = 1 + 0.012 * ease.io(inv(64.18, 67.10, t));
      ctx.scale(push, push);
      ctx.translate(-W / 2, -H / 2);
      const sceneScale = 0.78;
      const sceneW = W * sceneScale, sceneH = H * sceneScale;
      window.PHOTO.plate(NOODLE, (W - sceneW) / 2, 12, sceneW, sceneH, { inkOnly: true, alpha: appear, label: false });
      ctx.restore();
    }
    const steam = ease.out(inv(65.33, 65.68, t));
    if (steam > 0.01) {
      const phase = (t - 65.33) * Math.PI * 2 / 0.4645;
      [-42, 0, 42].forEach((dx, i) => {
        const rise = (phase + i * 1.9) % (Math.PI * 2);
        const y = 264 - (rise / (Math.PI * 2)) * 68;
        const x = 952 + dx + Math.sin(phase + i) * 8;
        stroke([[x - 7, y + 30], [x + 4, y + 14], [x - 2, y]], INK, 2, steam * 0.34);
      });
    }
    text('凌晨两点', 1450, 244, { size: 27, fam: 'serif', color: INK, alpha: ease.out(inv(64.05, 64.45, t)) });
  }

  function dufuEcho(c) {
    const t = c.t;
    paper();
    const enter = ease.io(inv(67.40, 68.0, t));
    if (window.PHOTO && window.PHOTO.has(DUFU)) {
      window.PHOTO.plate(DUFU, 292.5, 215, 535, 535, {
        raw: true, fit: 'contain', label: false, alpha: enter,
      });
    }
    if (window.PHOTO && window.PHOTO.has(NOODLE)) {
      const scale = lerp(0.85, 0.93, ease.io(inv(68.1, 74.1, t)));
      const w = 790 * scale, h = 444 * scale;
      window.PHOTO.plate(NOODLE, 1020, 300, w, h, {
        tone: 'ancient', label: false, inkOnly: true, alpha: enter,
      });
    }
    if (window.PHOTO && window.PHOTO.has(LAMP)) {
      const lampIn = ease.io(inv(70.2, 71.0, t));
      window.PHOTO.plate(LAMP, 1290, 155, 500, 282, {
        tone: 'ancient', label: false, inkOnly: true, alpha: lampIn * 0.76,
      });
    }
    const thread = ease.out(inv(68.0, 69.1, t));
    stroke([[770, 615], [920, 570], [1080, 535], [1245, 500]], CINNABAR, 2.2, thread * 0.68);
  }

  L.cradleBirth = cradleBirth;
  L.noodleLine = noodleLine;
  L.dufuEcho = dufuEcho;
})();
