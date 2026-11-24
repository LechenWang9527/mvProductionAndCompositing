// Intro process study, absolute song time 0–21.6 s.
// Source methods consulted and adapted:
// - ref_drawai/.../06-collage/index.html: piece transform, rimmed edge, cutQuad,
//   tornStrip and shadow. The original piece() also jitters at 6/12 fps; this
//   module keeps its transform/edge ideas but removes jitter for a calm cadence.
// - ref_drawai/.../_fixtures/Polish.tsx: cubic-bezier() and softShadow()
//   (contact + ambient layers). Canvas versions below use fixed deterministic
//   curves and a restrained paper-colored shadow.
// - ref_drawai/.../TimelineTravel.tsx: camXAt() and threshold-triggered nodes.
//   The travel is much shorter and softer; no space setting, spring overshoot,
//   random flicker or bone/face deformation is used.
// - ref_mv/src/engine/draw.js: masked() uses destination-in on an offscreen
//   canvas. Scroll reveal uses the same content∩mask principle with native
//   Canvas clipping, avoiding a second canvas and any pixel readback.
(function () {
  const K = window.K;
  if (!K) return;
  const { W, H, ctx, clamp, lerp, inv, text } = K;
  const L = (window.LAYOUTS = window.LAYOUTS || {});
  const PHOTO = () => window.PHOTO;

  const IDS = Object.freeze({
    lamp: 'LAMP_CUTOUT_V2',
    scroll: 'SCROLL_CUTOUT_V2',
    dufu: 'DUFU_REFERENCE_V2',
    liubang: 'LIUBANG_REFERENCE_V2',
  });
  const C = Object.freeze({
    paper: '#d9cfb8', paperLite: '#ece1c8', paperDeep: '#b9a784',
    ink: '#30251a', inkSoft: '#61513b', red: '#a8402c', gold: '#bd8941',
  });

  // Absolute seconds make this layout continuous across the host's #1/#2/#3 cuts.
  const CUES = Object.freeze({
    lampIgnition: Object.freeze([0.28, 0.82]),
    lightSpread: Object.freeze([0.28, 3.5]),
    scrollUnfurl: Object.freeze([3.5, 7.4]),
    timelineReveal: Object.freeze([7.4, 8.55]),
    dufuEntry: Object.freeze([8.05, 9.0]),
    liubangEntry: Object.freeze([10.75, 11.7]),
    recordsLink: Object.freeze([14.99, 16.62]),
    timeTravel: Object.freeze([16.62, 20.4]),
    archiveHandoff: Object.freeze([20.4, 21.6]),
    eventNodes: Object.freeze([17.22, 18.62, 20.02]),
  });
  window.INTRO_V2_CUES = CUES;

  const easeOut = bezier(0.22, 1, 0.36, 1);
  const easeIO = bezier(0.65, 0, 0.35, 1);
  const easeSoft = bezier(0.4, 0, 0.2, 1);

  // Port of Polish.tsx cubic-bezier solver, trimmed to the deterministic path
  // used here. Curves remain in [0,1] and intentionally have no overshoot.
  function bezier(x1, y1, x2, y2) {
    const ax = 1 - 3 * x2 + 3 * x1, bx = 3 * x2 - 6 * x1, cx = 3 * x1;
    const ay = 1 - 3 * y2 + 3 * y1, by = 3 * y2 - 6 * y1, cy = 3 * y1;
    const sx = (u) => ((ax * u + bx) * u + cx) * u;
    const sy = (u) => ((ay * u + by) * u + cy) * u;
    const dx = (u) => (3 * ax * u + 2 * bx) * u + cx;
    return (t) => {
      if (t <= 0) return 0;
      if (t >= 1) return 1;
      let u = t;
      for (let i = 0; i < 8; i++) {
        const err = sx(u) - t;
        if (Math.abs(err) < 1e-7) return clamp(sy(u), 0, 1);
        const d = dx(u);
        if (Math.abs(d) < 1e-6) break;
        u -= err / d;
      }
      let lo = 0, hi = 1;
      u = t;
      for (let i = 0; i < 36; i++) {
        const x = sx(u);
        if (Math.abs(x - t) < 1e-7) break;
        if (x < t) lo = u; else hi = u;
        u = (lo + hi) / 2;
      }
      return clamp(sy(u), 0, 1);
    };
  }

  function hash(seed, i) {
    const n = Math.sin(seed * 127.1 + i * 311.7) * 43758.5453;
    return n - Math.floor(n);
  }

  // Port of collage's deterministic cutQuad; small static edge variation only.
  function cutQuadPath(x, y, w, h, seed, jitter) {
    const j = jitter == null ? 3 : jitter;
    const p = [[0, 0], [w, 0], [w, h], [0, h]];
    ctx.beginPath();
    p.forEach(([px, py], i) => {
      const dx = (hash(seed, i) * 2 - 1) * j;
      const dy = (hash(seed + 5, i) * 2 - 1) * j;
      if (i === 0) ctx.moveTo(x + px + dx, y + py + dy);
      else ctx.lineTo(x + px + dx, y + py + dy);
    });
    ctx.closePath();
  }

  // Port of collage's tornStrip contour, used as a moving reveal lip rather
  // than a random tear. The same seed yields the same edge at every renderAt(t).
  function tornRevealPath(x, y, w, h, seed, rough) {
    const r = rough == null ? 4 : rough;
    ctx.beginPath();
    ctx.moveTo(x, y);
    ctx.lineTo(x + w, y);
    for (let i = 1; i <= 18; i++) {
      const yy = y + h * i / 18;
      const dx = (hash(seed, i) - 0.5) * r * 2;
      ctx.lineTo(x + w + dx, yy);
    }
    ctx.lineTo(x, y + h);
    ctx.closePath();
  }

  // Canvas translation/scale equivalent of collage's piece(); sx and sy are
  // always equal so image proportions and faces are never altered.
  function piece(x, y, scale, alpha, draw) {
    ctx.save();
    ctx.translate(x, y);
    ctx.scale(scale, scale);
    ctx.globalAlpha *= alpha;
    draw();
    ctx.restore();
  }

  function photo(id, x, y, w, h, alpha) {
    const p = PHOTO();
    if (!p || !p.has(id) || alpha <= 0.001) return false;
    p.plate(id, x, y, w, h, { raw: true, fit: 'contain', alpha, label: false });
    return true;
  }

  // Polish.tsx softShadow uses contact + ambient shadow. Canvas has a single
  // shadow slot, so the paper object gets a contact ellipse and the source-like
  // ambient shadow from the shape fill itself.
  function contactShadow(cx, cy, rx, ry, alpha) {
    if (alpha <= 0.001) return;
    const g = ctx.createRadialGradient(cx, cy, 1, cx, cy, rx);
    g.addColorStop(0, `rgba(46,31,16,${alpha})`);
    g.addColorStop(0.72, `rgba(46,31,16,${alpha * 0.42})`);
    g.addColorStop(1, 'rgba(46,31,16,0)');
    ctx.save();
    ctx.fillStyle = g;
    ctx.beginPath();
    ctx.ellipse(cx, cy, rx, ry, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
  }

  function paperCard(x, y, w, h, seed, alpha, elevation) {
    if (alpha <= 0.001) return;
    const e = Math.max(0, elevation || 0);
    ctx.save();
    ctx.globalAlpha *= alpha;
    ctx.shadowColor = `rgba(34,20,8,${(0.11 + Math.min(e, 40) / 40 * 0.16).toFixed(3)})`;
    ctx.shadowBlur = 2 + e * 0.18;
    ctx.shadowOffsetX = 1 + e * 0.06;
    ctx.shadowOffsetY = 2 + e * 0.42;
    cutQuadPath(x, y, w, h, seed, 2.2);
    ctx.fillStyle = C.paperLite;
    ctx.fill();
    ctx.shadowColor = 'transparent';
    ctx.lineWidth = 1.4;
    ctx.strokeStyle = 'rgba(75,56,31,0.36)';
    ctx.stroke();
    // Geometric equivalent of collage's rimmed(): a narrow pale edge is laid
    // below the ink seam; no attempt is made to synthesize a person's alpha.
    ctx.globalAlpha *= 0.42;
    ctx.lineWidth = 4;
    ctx.strokeStyle = '#f4ecd9';
    ctx.stroke();
    ctx.restore();
  }

  function line(points, color, width, alpha) {
    if (alpha <= 0.001 || points.length < 2) return;
    ctx.save();
    ctx.globalAlpha *= alpha;
    ctx.strokeStyle = color;
    ctx.lineWidth = width;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
    ctx.beginPath();
    ctx.moveTo(points[0][0], points[0][1]);
    for (let i = 1; i < points.length; i++) ctx.lineTo(points[i][0], points[i][1]);
    ctx.stroke();
    ctx.restore();
  }

  function textAt(str, x, y, size, color, options) {
    const o = options || {};
    text(str, x, y, {
      size, fam: o.fam || 'serif', weight: o.weight || 600,
      color, align: o.align || 'left', alpha: o.alpha == null ? 1 : o.alpha,
      letterSpacing: o.letterSpacing,
    });
  }

  function drawDesk(t) {
    window.__LIGHT = true;
    ctx.save();
    const bg = ctx.createLinearGradient(0, 0, 0, H);
    bg.addColorStop(0, '#d9cfb8');
    bg.addColorStop(0.72, '#d3c7ad');
    bg.addColorStop(1, '#e0d6c3');
    ctx.fillStyle = bg;
    ctx.fillRect(0, 0, W, H);

    const lit = easeOut(inv(CUES.lightSpread[0], CUES.lightSpread[1], t));
    // The desk is paper from frame one; the warm paper surface changes state
    // as the lamp lights it, instead of replacing the scene with a flat graphic.
    const darken = 0.78 * (1 - lit);
    ctx.fillStyle = `rgba(38,27,17,${darken.toFixed(3)})`;
    ctx.fillRect(0, 0, W, 760);

    // A broad paper work surface with a shallow bevel and soft contact shadow.
    const x = 84, y = 62, w = 1752, h = 690;
    ctx.save();
    ctx.shadowColor = 'rgba(34,20,8,0.26)';
    ctx.shadowBlur = 20;
    ctx.shadowOffsetY = 9;
    cutQuadPath(x, y, w, h, 3, 5);
    const surface = ctx.createLinearGradient(0, y, 0, y + h);
    surface.addColorStop(0, blendColor('#55432e', '#ece0c4', lit * 0.94));
    surface.addColorStop(0.62, blendColor('#645039', '#e2d5b7', lit * 0.94));
    surface.addColorStop(1, blendColor('#4e3c2b', '#c9b995', lit * 0.94));
    ctx.fillStyle = surface;
    ctx.fill();
    ctx.restore();
    line([[100, 68], [1820, 68]], 'rgba(250,239,213,0.26)', 2, 1);
    ctx.restore();
  }

  function blendColor(a, b, t) {
    const ca = rgb(a), cb = rgb(b);
    return `rgb(${Math.round(lerp(ca[0], cb[0], t))},${Math.round(lerp(ca[1], cb[1], t))},${Math.round(lerp(ca[2], cb[2], t))})`;
  }
  function rgb(hex) {
    const s = hex.replace('#', '');
    return [parseInt(s.slice(0, 2), 16), parseInt(s.slice(2, 4), 16), parseInt(s.slice(4, 6), 16)];
  }

  const LAMP_BOX = { x: 112, y: 235, w: 430, h: 490 };
  const FLAME = { x: 358, y: 340 };
  function drawGlow(t) {
    const ignite = easeOut(inv(CUES.lampIgnition[0], CUES.lampIgnition[1], t));
    if (ignite <= 0) return;
    const reach = easeIO(inv(CUES.lightSpread[0], CUES.lightSpread[1], t));
    const radius = 90 + 680 * reach;
    const strength = 0.10 + 0.34 * reach;
    const g = ctx.createRadialGradient(FLAME.x, FLAME.y, 3, FLAME.x, FLAME.y, radius);
    g.addColorStop(0, `rgba(246,190,94,${strength.toFixed(3)})`);
    g.addColorStop(0.28, `rgba(219,158,74,${(strength * 0.62).toFixed(3)})`);
    g.addColorStop(0.72, `rgba(189,137,65,${(strength * 0.20).toFixed(3)})`);
    g.addColorStop(1, 'rgba(189,137,65,0)');
    ctx.save();
    ctx.beginPath();
    ctx.rect(80, 62, 1752, 690);
    ctx.clip();
    ctx.fillStyle = g;
    ctx.fillRect(FLAME.x - radius, FLAME.y - radius, radius * 2, radius * 2);
    ctx.restore();
  }

  function drawLamp(t) {
    const p = PHOTO();
    const hasLamp = p && p.has(IDS.lamp);
    if (hasLamp) {
      const lit = easeOut(inv(0.34, 1.25, t));
      photo(IDS.lamp, LAMP_BOX.x, LAMP_BOX.y, LAMP_BOX.w, LAMP_BOX.h, lerp(0.72, 1, lit));
    }
    const flame = easeOut(inv(CUES.lampIgnition[0], CUES.lampIgnition[1], t));
    if (flame > 0.001 && hasLamp) {
      // Dynamic flame only; the lamp body itself is always the approved cutout.
      const low = 0.96 + 0.04 * Math.sin((t - 0.82) * 5.1);
      const pulse = flame * low;
      const h = 24 + 3 * Math.sin((t - 0.82) * 4.0);
      const w = 10 + 1.5 * Math.sin((t - 0.82) * 3.2);
      ctx.save();
      ctx.globalAlpha *= pulse;
      const glow = ctx.createRadialGradient(FLAME.x, FLAME.y - 4, 1, FLAME.x, FLAME.y - 4, 55);
      glow.addColorStop(0, 'rgba(255,220,141,0.72)');
      glow.addColorStop(1, 'rgba(255,160,61,0)');
      ctx.fillStyle = glow;
      ctx.beginPath(); ctx.arc(FLAME.x, FLAME.y - 4, 55, 0, Math.PI * 2); ctx.fill();
      ctx.beginPath();
      ctx.moveTo(FLAME.x, FLAME.y + h * 0.45);
      ctx.bezierCurveTo(FLAME.x - w, FLAME.y + h * 0.08, FLAME.x - w * 0.2, FLAME.y - h * 0.47, FLAME.x + 1, FLAME.y - h * 0.56);
      ctx.bezierCurveTo(FLAME.x + w * 1.2, FLAME.y - h * 0.08, FLAME.x + w * 0.85, FLAME.y + h * 0.30, FLAME.x, FLAME.y + h * 0.45);
      const fg = ctx.createLinearGradient(FLAME.x, FLAME.y - h * 0.5, FLAME.x, FLAME.y + h * 0.5);
      fg.addColorStop(0, '#fff1b4'); fg.addColorStop(0.48, '#e8a442'); fg.addColorStop(1, '#a8402c');
      ctx.fillStyle = fg; ctx.fill();
      ctx.restore();
    }
  }

  const SCROLL = { x: 318, y: 92, w: 1450, h: 650 };
  function drawScroll(t) {
    const p = PHOTO();
    const ready = p && p.has(IDS.scroll);
    if (!ready || t < CUES.scrollUnfurl[0]) return;
    const reveal = easeSoft(inv(CUES.scrollUnfurl[0], CUES.scrollUnfurl[1], t));
    if (reveal <= 0.001) return;
    const visibleW = SCROLL.w * reveal;

    ctx.save();
    // Equivalent to engine/draw.js masked(content,mask): source image is only
    // painted where the growing, torn mask covers it. The moving lip supplies
    // the roll/contact shadow, so this reads as an opening sheet, not a fade.
    tornRevealPath(SCROLL.x, SCROLL.y, visibleW, SCROLL.h, 19, 3.6);
    ctx.clip();
    ctx.shadowColor = 'rgba(39,25,12,0.34)';
    ctx.shadowBlur = 16;
    ctx.shadowOffsetX = 0;
    ctx.shadowOffsetY = 7;
    cutQuadPath(SCROLL.x, SCROLL.y, SCROLL.w, SCROLL.h, 11, 4);
    ctx.fillStyle = '#e8dcc0';
    ctx.fill();
    ctx.shadowColor = 'transparent';
    ctx.globalAlpha *= 0.88;
    photo(IDS.scroll, SCROLL.x, SCROLL.y, SCROLL.w, SCROLL.h, 1);
    ctx.restore();

    if (reveal < 0.995) drawRoll(SCROLL.x + visibleW, SCROLL.y + 18, SCROLL.h - 36, 1 - reveal);
  }

  function drawRoll(x, y, h, remain) {
    const rx = 16 + remain * 8;
    contactShadow(x + 3, y + h * 0.5 + 5, 27, h * 0.48, 0.15 * remain);
    ctx.save();
    ctx.shadowColor = 'rgba(42,26,13,0.32)';
    ctx.shadowBlur = 13;
    ctx.shadowOffsetX = 5;
    ctx.shadowOffsetY = 4;
    const g = ctx.createLinearGradient(x - rx, 0, x + rx, 0);
    g.addColorStop(0, '#8d7752');
    g.addColorStop(0.28, '#e4d2ad');
    g.addColorStop(0.58, '#f1e3c5');
    g.addColorStop(1, '#9c8158');
    ctx.fillStyle = g;
    ctx.beginPath();
    ctx.moveTo(x - rx, y + 8);
    ctx.bezierCurveTo(x - rx * 0.55, y - 2, x + rx, y + 2, x + rx, y + 14);
    ctx.lineTo(x + rx, y + h - 14);
    ctx.bezierCurveTo(x + rx * 0.8, y + h + 2, x - rx * 0.75, y + h + 1, x - rx, y + h - 8);
    ctx.closePath();
    ctx.fill();
    ctx.restore();
    line([[x - rx * 0.4, y + 14], [x - rx * 0.4, y + h - 14]], 'rgba(91,64,34,0.36)', 2, remain);
  }

  const PEOPLE = Object.freeze({
    dufu: Object.freeze({ id: IDS.dufu, cx: 700, baseY: 548, h: 420, name: '杜甫' }),
    liubang: Object.freeze({ id: IDS.liubang, cx: 1230, baseY: 548, h: 420, name: '刘邦' }),
  });

  function drawFootShadow(person, alpha) {
    const w = person.h * 0.34;
    contactShadow(person.cx, person.baseY - 1, w, 19, 0.16 * alpha);
  }

  function drawPerson(person, start, end, t) {
    const p = easeOut(inv(start, end, t));
    if (p <= 0.001) return;
    // The raw, alpha cutout is placed directly on the paper; only its whole
    // figure translates uniformly by a few pixels while settling.
    const lift = 17 * (1 - p);
    drawFootShadow(person, p);
    const scale = person.h / 420;
    const x = person.cx - (420 * 2 / 3) / 2;
    const y = person.baseY - 420 + lift;
    piece(person.cx, person.baseY + lift, scale, p, () => {
      photo(person.id, -140, -420, 280, 420, p);
    });
    // Small paper name tab, kept adjacent to the cutout rather than over the face.
    const side = person.cx < W / 2 ? 1 : -1;
    const tx = person.cx + side * 160;
    paperCard(tx - 58, y + 54, 116, 46, person.cx, p, 2);
    textAt(person.name, tx, y + 85, 32, C.ink, { align: 'center', alpha: p });
  }

  const AXIS = Object.freeze({ x0: 382, x1: 1745, y: 656 });
  const NODES = Object.freeze([
    Object.freeze({ x: 620, title: '过去', index: '01' }),
    Object.freeze({ x: 1030, title: '经历', index: '02' }),
    Object.freeze({ x: 1380, title: '今天', index: '03' }),
  ]);

  // TimelineTravel's camXAt pattern: a smooth camera path, with each node/card
  // event triggered when its world position reaches the fixed entry gate.
  function camXAt(t) {
    const u = easeIO(inv(CUES.timeTravel[0], CUES.timeTravel[1], t));
    const piecewise = u < 0.15
      ? lerp(0, 0.055, easeIO(u / 0.15))
      : (u < 0.88
        ? lerp(0.055, 0.90, easeIO((u - 0.15) / 0.73))
        : lerp(0.90, 1, easeIO((u - 0.88) / 0.12)));
    return 850 * piecewise;
  }

  function drawTimeline(t) {
    if (t < CUES.timelineReveal[0]) return;
    const reveal = easeOut(inv(CUES.timelineReveal[0], CUES.timelineReveal[1], t));
    if (reveal <= 0.001) return;
    const traveling = t >= CUES.timeTravel[0];
    const cameraX = traveling ? camXAt(t) : 0;
    const nodeAlpha = traveling ? 1 : 1;
    const travelProgress = traveling ? easeIO(inv(CUES.timeTravel[0], CUES.timeTravel[1], t)) : 0;

    ctx.save();
    ctx.globalAlpha *= reveal;
    ctx.translate(-cameraX, 0);

    // Two inked rails and fine graduated marks turn the open sheet into a
    // navigable time scale; this is the persistent world layer under portraits.
    line([[AXIS.x0, AXIS.y + 5], [AXIS.x1, AXIS.y + 5]], 'rgba(51,36,21,0.25)', 7, 1);
    line([[AXIS.x0, AXIS.y], [AXIS.x1, AXIS.y]], '#765d3b', 3, 1);
    line([[AXIS.x0, AXIS.y - 3], [AXIS.x1, AXIS.y - 3]], 'rgba(244,229,195,0.8)', 1.5, 1);
    for (let i = 0; i <= 26; i++) {
      const x = AXIS.x0 + (AXIS.x1 - AXIS.x0) * i / 26;
      const major = i % 5 === 0;
      line([[x, AXIS.y - (major ? 15 : 7)], [x, AXIS.y + (major ? 15 : 7)]],
        major ? '#6f5331' : 'rgba(111,83,49,0.58)', major ? 2.3 : 1.2, 1);
    }

    NODES.forEach((node, i) => {
      const triggerOffset = node.x - 520;
      const event = traveling ? easeOut(inv(triggerOffset, triggerOffset + 110, cameraX)) : 0;
      const active = Math.max(0.12, event);
      const px = node.x;
      const radius = 11 + 4 * event;
      ctx.save();
      ctx.globalAlpha *= nodeAlpha;
      ctx.fillStyle = `rgba(168,64,44,${(0.09 + 0.18 * event).toFixed(3)})`;
      ctx.beginPath(); ctx.arc(px, AXIS.y, radius * 2.7, 0, Math.PI * 2); ctx.fill();
      ctx.fillStyle = event > 0.3 ? C.red : C.paperLite;
      ctx.strokeStyle = C.red;
      ctx.lineWidth = 3;
      ctx.beginPath(); ctx.arc(px, AXIS.y, radius, 0, Math.PI * 2); ctx.fill(); ctx.stroke();
      ctx.restore();

      if (traveling && event > 0.001) {
        const cardY = 545 + 22 * (1 - easeOut(inv(triggerOffset, triggerOffset + 90, cameraX)));
        const cardAlpha = Math.min(1, event * 1.5);
        const cardW = 190, cardH = 76;
        paperCard(px - cardW / 2, cardY, cardW, cardH, 41 + i, cardAlpha, 5 + 6 * (1 - event));
        // Drawing time follows the travel threshold; cards settle without a spring snap.
        ctx.save();
        ctx.globalAlpha *= cardAlpha;
        line([[px, cardY + cardH], [px, AXIS.y - 15]], C.red, 1.6, 0.72);
        ctx.restore();
        textAt(node.index, px - 68, cardY + 30, 19, C.red, { fam: 'mono', weight: 700, alpha: cardAlpha });
        textAt(node.title, px + 10, cardY + 49, 27, C.ink, { align: 'center', alpha: cardAlpha });
      }

      if (!traveling) {
        textAt(node.title, px, AXIS.y + 57, 22, C.inkSoft, { align: 'center', alpha: 0.68 });
      }
    });

    if (traveling) {
      // Camera travel has a visible endpoint, while the raw portraits stay fixed
      // as reference records. The moving scale therefore shows time passing
      // beneath the same two people instead of merely pushing a still image.
      const todayX = AXIS.x1 - cameraX;
      const endAlpha = easeOut(inv(0.70, 1, travelProgress));
      if (endAlpha > 0.001) {
        ctx.save(); ctx.globalAlpha *= endAlpha;
        ctx.fillStyle = C.red;
        ctx.beginPath(); ctx.arc(todayX, AXIS.y, 9, 0, Math.PI * 2); ctx.fill();
        textAt('今日', todayX, AXIS.y + 56, 21, C.red, { align: 'center', weight: 700, alpha: endAlpha });
        ctx.restore();
      }
    }
    ctx.restore();
  }

  function drawConnection(t) {
    const p = easeOut(inv(CUES.recordsLink[0], CUES.recordsLink[1], t));
    if (p <= 0.001) return;
    // A single copper path joins the two placed cutouts, revealed by length.
    const x0 = PEOPLE.dufu.cx + 44, x1 = PEOPLE.liubang.cx - 45;
    const y = 522;
    const mid = lerp(x0, x1, p);
    ctx.save();
    ctx.globalAlpha *= 0.86;
    ctx.strokeStyle = 'rgba(168,64,44,0.28)';
    ctx.lineWidth = 8;
    ctx.lineCap = 'round';
    ctx.beginPath();
    ctx.moveTo(x0, y);
    ctx.quadraticCurveTo((x0 + x1) / 2, y - 68, mid, y);
    ctx.stroke();
    ctx.strokeStyle = C.red;
    ctx.lineWidth = 2.6;
    ctx.beginPath();
    ctx.moveTo(x0, y);
    ctx.quadraticCurveTo((x0 + x1) / 2, y - 68, mid, y);
    ctx.stroke();
    ctx.fillStyle = C.red;
    ctx.beginPath(); ctx.arc(x0, y, 5, 0, Math.PI * 2); ctx.fill();
    if (p > 0.96) { ctx.beginPath(); ctx.arc(x1, y, 5, 0, Math.PI * 2); ctx.fill(); }
    ctx.restore();
  }

  function drawArchiveHandoff(t) {
    const p = easeSoft(inv(CUES.archiveHandoff[0], CUES.archiveHandoff[1], t));
    if (p <= 0.001) return;
    const cards = [
      { x: 495, y: 119, w: 407, h: 478, seed: 81, name: '杜甫' },
      { x: 1017, y: 119, w: 407, h: 478, seed: 92, name: '刘邦' },
    ];
    cards.forEach((card, i) => {
      const yy = card.y + 15 * (1 - p);
      paperCard(card.x, yy, card.w, card.h, card.seed, 0.78 * p, 5);
      ctx.save();
      ctx.globalAlpha *= p;
      // Folders and photo cutouts coexist: this is a backing sheet, not a face window.
      paperCard(card.x + 15, yy + 14, 122, 34, card.seed + 1, 1, 1);
      textAt(i === 0 ? '人物档案' : '经历档案', card.x + 77, yy + 38, 19, C.red, { align: 'center' });
      textAt(card.name, card.x + card.w - 23, yy + 43, 24, C.ink, { align: 'right' });
      ctx.restore();
    });
    paperCard(824, 110, 272, 58, 103, p, 3);
    textAt('经历档案', 960, 149, 32, C.red, { align: 'center', alpha: p, weight: 700 });
    // Restrained edge reveal closes the timeline into a stable archive grouping.
    const spread = 270 * (1 - p);
    line([[960 - spread, 626], [960 + spread, 626]], C.red, 2.2, p * 0.78);
  }

  function draw(t) {
    drawDesk(t);
    drawGlow(t);
    drawScroll(t);
    drawLamp(t);
    drawTimeline(t);
    drawConnection(t);
    drawArchiveHandoff(t);
    drawPerson(PEOPLE.dufu, CUES.dufuEntry[0], CUES.dufuEntry[1], t);
    drawPerson(PEOPLE.liubang, CUES.liubangEntry[0], CUES.liubangEntry[1], t);
  }

  L.introProcessV2 = function (c) {
    if (!c || !Number.isFinite(c.t) || c.t < 0 || c.t > 21.6) return;
    draw(c.t);
  };
})();
