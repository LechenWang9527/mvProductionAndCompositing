// film/src/photo.js —— 照片槽位（用户用 image2 生成的图，按 manifest 贴进镜头）
// 设计原则：
//   1) 图不直接原样贴上去（会破坏调色板一致性），一律先做「双色调 + 半调网点 + 纸纹」的印刷化处理；
//   2) 没图的时候不是黑屏，而是画一张档案风格的占位牌（带槽位号），方便对位、也能当风格锚点；
//   3) 处理结果按 (id, tone) 缓存，避免每帧重算；
//   4) 所有槽位可缺省 —— 缺图时 film 照常渲染，只是少一张照片。
(function () {
  const K = window.K;
  const { W, H, ctx, clamp, lerp, inv, ease, hash, text, setFont, measure, hatchTile, grainTile, rnd } = K;

  const PHOTOS = {};
  const PEOPLE = {};        // id -> { img, ready, file }
  const PROC = {};          // `${id}|${tone}|${w}x${h}` -> canvas
  let MANIFEST = [];
  let LOADED = false;
  let MISSING = [];

  // 每张照片的处理目标尺寸（贴到画面上是按需缩放的，这里只要够大）
  const MAXW = 1400;

  function makeCanvas(w, h) {
    const c = document.createElement('canvas');
    c.width = Math.max(1, Math.round(w));
    c.height = Math.max(1, Math.round(h));
    return c;
  }

  // 墨水色调：ancient = 暖纸 + 墨 + 朱砂；dark = 冷黑 + 米白 + 黄（马牌/终端通用）
  const TONES = {
    ancient: { paper: '#e6dcc8', ink: '#17130f', mid: '#6b5f4c', accent: '#a8402c' },
    dark: { paper: '#0b0b0c', ink: '#f2efe6', mid: '#7d7a72', accent: '#ffcc00' },
    terminal: { paper: '#05080a', ink: '#cdf3dd', mid: '#4e6b60', accent: '#5ef2a0' },
  };

  // 把一张照片做成「印刷件」：灰度 → 双色调 → 半调网点 → 纸纹
  function process(img, tone, ow, oh, opts) {
    opts = opts || {};
    const sourceKey = opts.sourceRect ? `${opts.sourceRect.x},${opts.sourceRect.y},${opts.sourceRect.w},${opts.sourceRect.h}` : 'full';
    const key = `${img.__id}|${tone}|${ow}x${oh}|${opts.contrast ?? 'default'}|${opts.halftone ?? 'default'}|${opts.grainAlpha ?? 'default'}|ink:${opts.inkOnly ? 1 : 0}|src:${sourceKey}`;
    if (PROC[key]) return PROC[key];
    const T = TONES[tone] || TONES.dark;

    // 1) 先等比裁切到目标比例（cover），避免变形
    const source = opts.sourceRect || { x: 0, y: 0, w: img.width, h: img.height };
    const ir = source.w / source.h, or = ow / oh;
    let sw = source.w, sh = source.h, sx = source.x, sy = source.y;
    if (ir > or) { sw = source.h * or; sx = source.x + (source.w - sw) / 2; }
    else { sh = source.w / or; sy = source.y + (source.h - sh) / 2; }

    const cw = Math.min(MAXW, Math.round(ow));
    const ch = Math.round(cw / or);
    const c = makeCanvas(cw, ch);
    const g = c.getContext('2d');

    // Preserve fine line art while letting the source paper disappear into the scene.
    // This is for monochrome illustrations such as IMG01, not photographic material.
    if (opts.inkOnly) {
      g.drawImage(img, sx, sy, sw, sh, 0, 0, cw, ch);
      const imageData = g.getImageData(0, 0, cw, ch);
      const pixels = imageData.data;
      for (let i = 0; i < pixels.length; i += 4) {
        const luminance = (0.2126 * pixels[i] + 0.7152 * pixels[i + 1] + 0.0722 * pixels[i + 2]) / 255;
        const ink = clamp((0.72 - luminance) / 0.44, 0, 1);
        pixels[i + 3] = Math.round(pixels[i + 3] * Math.pow(ink, 0.82));
      }
      g.putImageData(imageData, 0, 0);
      PROC[key] = c;
      return c;
    }

    // 2) 灰度（对比别拉太狠，留给后面的阶调量化）
    g.filter = 'grayscale(1) contrast(1.10) brightness(1.0)';
    g.drawImage(img, sx, sy, sw, sh, 0, 0, cw, ch);
    g.filter = 'none';

    // 3) 三档双色调（真·明暗映射）：暗 → ink / 中 → mid / 亮 → paper
    //    旧做法 multiply + screen 会把所有像素压进 0.52–0.54 的窄带（std 25→9.5），
    //    结果就是一块发灰的板。这里逐像素 lerp，并做阶调量化 —— 量化才是「印刷感」的来源。
    const _rgb = (hx) => [parseInt(hx.slice(1, 3), 16), parseInt(hx.slice(3, 5), 16), parseInt(hx.slice(5, 7), 16)];
    const _lum = (c) => (0.2126 * c[0] + 0.7152 * c[1] + 0.0722 * c[2]) / 255;
    const _cPaper = _rgb(T.paper), _cInk = _rgb(T.ink), _cMid = _rgb(T.mid || T.paper);
    // 按亮度排序：dark → mid → light（dark 段 paper 近黑、ancient 段 paper 是纸色，方向相反）
    const _ramp = [_cPaper, _cInk, _cMid].sort((a, b) => _lum(a) - _lum(b));
    const C_DARK = _ramp[0], C_MID = _ramp[1], C_LIGHT = _ramp[2];
    const cid = g.getImageData(0, 0, cw, ch);
    const cd = cid.data;
    const LEVELS = 5;                       // 5 档：丝网印/凸版的阶调，再少丢细节、再多就「太真实」
    const DEN = LEVELS - 1;
    for (let i = 0; i < cd.length; i += 4) {
      let v = cd[i] / 255;
      v = clamp((v - 0.5) * (opts.contrast == null ? 1.10 : opts.contrast) + 0.5, 0, 1);
      v = Math.round(v * DEN) / DEN;
      let r, gg, b;
      if (v < 0.5) {
        const t = v / 0.5;
        r = C_DARK[0] + (C_MID[0] - C_DARK[0]) * t;
        gg = C_DARK[1] + (C_MID[1] - C_DARK[1]) * t;
        b = C_DARK[2] + (C_MID[2] - C_DARK[2]) * t;
      } else {
        const t = (v - 0.5) / 0.5;
        r = C_MID[0] + (C_LIGHT[0] - C_MID[0]) * t;
        gg = C_MID[1] + (C_LIGHT[1] - C_MID[1]) * t;
        b = C_MID[2] + (C_LIGHT[2] - C_MID[2]) * t;
      }
      cd[i] = r; cd[i + 1] = gg; cd[i + 2] = b; cd[i + 3] = 255;
    }
    g.putImageData(cid, 0, 0);

    // 4) 半调网点：扫描线稿已经带木刻排线时，不要再叠一层点阵。
    if (opts.halftone !== false) {
      const small = makeCanvas(Math.round(cw / 6), Math.round(ch / 6));
      const sg = small.getContext('2d');
      sg.drawImage(c, 0, 0, small.width, small.height);
      const sd = sg.getImageData(0, 0, small.width, small.height).data;
      g.save();
      g.fillStyle = T.ink;
      const step = 5;
      for (let y = 0; y < ch; y += step) {
        for (let x = 0; x < cw; x += step) {
          const px = Math.min(small.width - 1, (x / cw * small.width) | 0);
          const py = Math.min(small.height - 1, (y / ch * small.height) | 0);
          const v = sd[(py * small.width + px) * 4] / 255;
          const k = clamp(1 - v, 0, 1);
          if (k < 0.12) continue;
          g.globalAlpha = 0.09 + k * 0.22;
          g.beginPath();
          g.arc(x, y, 2.4 * (0.45 + k), 0, Math.PI * 2);
          g.fill();
        }
      }
      g.restore();
    }

    // 5) 纸纹 / 颗粒：让照片和画面纹理一致
    const grainAlpha = opts.grainAlpha == null ? 0.20 : opts.grainAlpha;
    g.globalAlpha = grainAlpha;
    if (grainAlpha > 0) g.drawImage(grainTile(Math.min(512, cw), Math.min(512, ch), 0.5, 7), 0, 0, cw, ch);
    g.globalAlpha = 1;

    PROC[key] = c;
    return c;
  }

  // 提供一个原始（已灰度化但未双色调）的版本，供需要自定义着色的版式用
  function gray(img, ow, oh) {
    const key = `${img.__id}|gray|${ow}x${oh}`;
    if (PROC[key]) return PROC[key];
    const ir = img.width / img.height, or = ow / oh;
    let sw = img.width, sh = img.height, sx = 0, sy = 0;
    if (ir > or) { sw = img.height * or; sx = (img.width - sw) / 2; }
    else { sh = img.width / or; sy = (img.height - sh) / 2; }
    const cw = Math.min(MAXW, Math.round(ow)), ch = Math.round(cw / or);
    const c = makeCanvas(cw, ch);
    const g = c.getContext('2d');
    g.filter = 'grayscale(1) contrast(1.16)';
    g.drawImage(img, sx, sy, sw, sh, 0, 0, cw, ch);
    g.filter = 'none';
    PROC[key] = c;
    return c;
  }

  // 角标：像档案缩微胶片的边注（不是水印，只有 12% 透明度）
  function plateLabel(slot, x, y, w, h, tone) {
    const T = TONES[tone] || TONES.dark;
    ctx.save();
    ctx.globalAlpha = 0.34;
    ctx.fillStyle = T.ink;
    // 四角裁切标记
    const L = Math.min(28, w * 0.06);
    const th = 1.5;
    [[x, y, 1, 1], [x + w, y, -1, 1], [x, y + h, 1, -1], [x + w, y + h, -1, -1]].forEach(([px, py, dx, dy]) => {
      ctx.fillRect(px, py, L * dx, th * dy || th);
      ctx.fillRect(px - (dx < 0 ? th : 0), py, th, L * dy);
    });
    ctx.restore();
    ctx.save();
    ctx.globalAlpha = 0.32;
    text(slot.id, x, y + h + 22, { size: 15, fam: 'mono', color: T.mid, letterSpacing: 3 });
    ctx.restore();
  }

  // 缺图占位：一块「待装照片」的档案牌，绝不黑屏
  function placeholder(slot, x, y, w, h, tone) {
    if (!window.__SHOW_SLOTS) return;   // 生产版不画空槽；调试加 ?slots=1
    const T = TONES[tone] || TONES.dark;
    ctx.save();
    ctx.globalAlpha = 0.5;
    ctx.strokeStyle = T.mid;
    ctx.lineWidth = 1.5;
    ctx.setLineDash([9, 7]);
    ctx.strokeRect(x + 0.5, y + 0.5, w, h);
    ctx.setLineDash([]);
    ctx.restore();
    // 斜向排线底
    ctx.save();
    ctx.globalAlpha = 0.10;
    ctx.drawImage(hatchTile(38, 12, Math.max(8, w), Math.max(8, h), T.mid, 0.5, 2), x, y, w, h);
    ctx.restore();
    // 十字
    ctx.save();
    ctx.globalAlpha = 0.28;
    ctx.fillStyle = T.mid;
    ctx.fillRect(x + w / 2 - 1, y + h * 0.34, 2, h * 0.32);
    ctx.fillRect(x + w * 0.34, y + h / 2 - 1, w * 0.32, 2);
    ctx.restore();
    ctx.save();
    ctx.globalAlpha = 0.55;
    text(slot.id, x + w / 2, y + h / 2 - 16, { size: Math.max(18, Math.min(44, w * 0.10)), fam: 'mono', color: T.ink, align: 'center', letterSpacing: 6 });
    text('AWAITING IMAGE', x + w / 2, y + h / 2 + 34, { size: 15, fam: 'mono', color: T.mid, align: 'center', letterSpacing: 4 });
    ctx.restore();
  }

  // 主接口：把一个槽位贴进画面。opts = {tone, alpha, fit, label, uniq}
  /**
   * 人像位：有照片就压成印品，没有就画一个「空照片框 + 两个字」。
   * 空框在生产版也要画 —— 这是用户要的「先留空、框里写两个字」。
   */
  function portrait(x, y, w, h, o) {
    const q = o || {};
    const T = TONES[q.tone || 'dark'];
    const raw = q.person != null ? PEOPLE[q.person] : null;
    const pic = raw && raw.ready ? raw : null;

    if (pic) {
      plate('@person:' + q.person, x, y, w, h, { tone: q.tone || 'dark', alpha: q.alpha == null ? 1 : q.alpha, label: false });
      return true;
    }

    // ---- 空框 ----
    ctx.save();
    ctx.globalAlpha = (q.alpha == null ? 1 : q.alpha) * (q.dim == null ? 1 : q.dim);
    // 底：比四周略亮一点的纸/板
    ctx.fillStyle = q.tone === 'ancient' ? 'rgba(23,19,15,0.07)' : 'rgba(242,239,230,0.05)';
    ctx.fillRect(x, y, w, h);
    // 双框
    ctx.strokeStyle = T.mid;
    ctx.lineWidth = 1.5;
    ctx.strokeRect(x + 0.75, y + 0.75, w - 1.5, h - 1.5);
    ctx.globalAlpha *= 0.45;
    ctx.strokeRect(x + 6, y + 6, w - 12, h - 12);
    ctx.globalAlpha = (q.alpha == null ? 1 : q.alpha) * (q.dim == null ? 1 : q.dim);
    // 框内两个大字（占位）
    const label = q.label != null ? q.label : '待补';
    if (label) {
      ctx.fillStyle = T.ink;
      ctx.globalAlpha *= 0.30;
      const fs2 = Math.min(w * 0.40, h * 0.40);
      ctx.font = '400 ' + fs2.toFixed(0) + 'px "Noto Serif SC", serif';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      const chars = Array.from(label);
      const step = fs2 * 1.12;
      const x0 = x + w / 2 - (chars.length - 1) * step / 2;
      chars.forEach((ch, i) => ctx.fillText(ch, x0 + i * step, y + h / 2));
    }
    // 角标
    ctx.globalAlpha *= 0.9;
    ctx.fillStyle = T.mid;
    ctx.font = '400 12px "Cascadia Mono", monospace';
    ctx.textAlign = 'left';
    ctx.textBaseline = 'alphabetic';
    ctx.fillText(q.tag || 'PORTRAIT', x + 2, y - 8);
    ctx.restore();
    return false;
  }

  function plate(id, x, y, w, h, opts) {
    const o = opts || {};
    const tone = o.tone || 'dark';
    const p = PHOTOS[id];
    ctx.save();
    ctx.globalAlpha = o.alpha == null ? 1 : o.alpha;
    if (p && p.ready) {
      if (o.raw) {
        if (o.sourceRect) {
          const r = o.sourceRect;
          ctx.drawImage(p.img, r.x, r.y, r.w, r.h, x, y, w, h);
        } else if (o.fit === 'contain') {
          const r = Math.min(w / p.img.width, h / p.img.height);
          const dw = p.img.width * r, dh = p.img.height * r;
          ctx.drawImage(p.img, x + (w - dw) / 2, y + (h - dh) / 2, dw, dh);
        } else {
          const ir = p.img.width / p.img.height, or = w / h;
          let sx = 0, sy = 0, sw = p.img.width, sh = p.img.height;
          if (ir > or) { sw = p.img.height * or; sx = (p.img.width - sw) / 2; }
          else { sh = p.img.width / or; sy = (p.img.height - sh) / 2; }
          ctx.drawImage(p.img, sx, sy, sw, sh, x, y, w, h);
        }
      } else {
        const c = process(p.img, tone, w, h, o);
        if (o.fit === 'contain') {
        // 保比例留白（用于工牌照片位这种不能裁的）
          const r = Math.min(w / c.width, h / c.height);
          const dw = c.width * r, dh = c.height * r;
          ctx.drawImage(c, x + (w - dw) / 2, y + (h - dh) / 2, dw, dh);
        } else {
          ctx.drawImage(c, x, y, w, h);
        }
      }
      if (o.label !== false) plateLabel({ id }, x, y, w, h, tone);
    } else {
      placeholder({ id }, x, y, w, h, tone);
    }
    ctx.restore();
  }

  // 整幅底图：有图就铺满 + 压一层 scrim（保证上面压的字读得出来），返回 true
  // 没图返回 false —— 调用方走原来的纯图形背景，不会留下占位框
  function bg(id, tone, o) {
    o = o || {};
    if (!has(id)) return false;
    if (tone === 'ancient') window.__LIGHT = true;
    const T = TONES[tone] || TONES.dark;
    plate(id, 0, 0, W, H, { tone, alpha: o.alpha == null ? 1 : o.alpha, label: false });
    const scrim = o.scrim == null ? 0 : o.scrim;
    if (scrim > 0) {
      ctx.save();
      ctx.globalAlpha = scrim;
      ctx.fillStyle = o.scrimColor || T.paper;
      ctx.fillRect(0, 0, W, H);
      ctx.restore();
    }
    return true;
  }

  // 只问有没有图（版式可以据此决定要不要画照片层）
  function has(id) {
    const p = PHOTOS[id];
    return !!(p && p.ready);
  }

  // 读 manifest 并加载所有图；缺文件不报错，只记进 MISSING
  async function load() {
    let list = [];
    try {
      const res = await fetch('media/photos/manifest.json', { cache: 'no-store' });
      if (res.ok) list = await res.json();
    } catch (e) {
      list = [];
    }
    if (!Array.isArray(list)) list = [];
    // 插画槽位（IMG01–IMG11，用户用 ChatGPT 生成的图）：
    // 有 gen_manifest2.json 就按它来；没有就按约定文件名自动注册，缺哪张少哪张。
    try {
      const res2 = await fetch('media/gen/gen_manifest2.json', { cache: 'no-store' });
      if (res2.ok) {
        const gen = await res2.json();
        if (Array.isArray(gen)) list = list.concat(gen);
      }
    } catch (e2) { /* gen 清单缺失不致命 */ }
    const GEN_IDS = ['IMG01_dufu','IMG02_hut','IMG03_changan','IMG04_hall','IMG05_liubang',
      'IMG06_wine','IMG07_hand','IMG08_battle','IMG09_banner','IMG10_road','IMG11_noodle'];
    for (const gid of GEN_IDS) {
      if (!list.some((it) => it.id === gid)) {
        list.push({ id: gid, file: gid + '.png', dir: 'media/gen/' });
      }
    }
    const CANDIDATES = [
      { id: 'HUT_SCENE_V1', file: 'hut_scene_v1.png' },
      { id: 'DUFU_REFERENCE_V2', file: 'dufu_reference_v2.png' },
      { id: 'LIUBANG_REFERENCE_V2', file: 'liubang_reference_v2.png' },
      { id: 'CHANGAN_LINE_V1', file: 'changan_line_city_v1.png' },
      { id: 'SHELTER_LINE_V1', file: 'shelter_line_v1.png' },
      { id: 'CRADLE_LINE_V1', file: 'cradle_line_v1.png' },
      { id: 'NOODLE_CUP_LINE_V2', file: 'noodle_cup_line_v2.png' },
      { id: 'LIUBANG_PORTRAIT_V1', file: 'liubang_portrait_v1.png' },
      { id: 'BATTLE_SCENE_V1', file: 'battle_scene_v1.png' },
      { id: 'LAMP_DESK_LINE_V1', file: 'lamp_desk_line_v1.png' },
      { id: 'WIND_BANNER_LINE_V1', file: 'wind_banner_line_v1.png' },
      { id: 'KEYS_BADGE_LINE_V1', file: 'keys_badge_line_v1.png' },
      { id: 'PHONE_DOWN_LINE_V1', file: 'phone_down_line_v1.png' },
    ];
    for (const candidate of CANDIDATES) {
      if (!list.some((it) => it.id === candidate.id)) {
        list.push({ ...candidate, dir: 'media/candidates/' });
      }
    }
    MANIFEST = list;
    await Promise.all(list.map((it) => new Promise((resolve) => {
      const img = new Image();
      img.__id = it.id;
      img.onload = () => {
        PHOTOS[it.id] = { img, ready: true, file: it.file };
        resolve();
      };
      img.onerror = () => {
        PHOTOS[it.id] = { img: null, ready: false, file: it.file };
        MISSING.push(it.id);
        resolve();
      };
      const dir = it.dir || (GEN_IDS.includes(it.id) ? 'media/gen/' : 'media/photos/');
      img.src = dir + it.file;
    })));
    LOADED = true;
    if (MISSING.length) {
      console.warn('[photo] missing slot files:', MISSING.join(', '));
      document.title = document.title + ' · PHOTO-MISSING:' + MISSING.join(',');
    }
    return { total: list.length, missing: MISSING.slice() };
  }

  window.PHOTO = {
    load, plate, has, gray, bg, portrait,
    get manifest() { return MANIFEST; },
    get loaded() { return LOADED; },
    get missing() { return MISSING.slice(); },
    TONES,
  };
})();
