// film/src/shotfilm.js —— 87 刀调度：按分镜表把 t 落到具体版式上
// 取代 scenes.js 的「一段一张版式」。window.DRAW(t) 由这里定义（后加载，覆盖 scenes.js）。
(function () {
  const K = window.K;
  const { W, H, ctx, PAL, clamp, lerp, inv, ease, text, sectionAt, lineAt, BEAT } = K;
  const SHOTS = window.SHOTS;
  const LAYOUTS = window.LAYOUTS;

  // ---------------- 每镜的参数（kind + 这个镜头专属的文案/数值） ----------------
  // 键 = 镜头号；值 = { k: layout 名, p: 参数 }
  const PLAN = {
    1: { k: 'preludeLamp', p: {} },
    2: { k: 'preludeLamp', p: {} },
    3: { k: 'chorusExperience', p: {} },
    4: { k: 'chorusExperience', p: {} },
    5: { k: 'lampCallback', p: {} },
    6: { k: 'dufuSequence', p: {} },
    7: { k: 'dufuSequence', p: {} },
    8: { k: 'dufuSequence', p: {} },
    9: { k: 'dufuSequence', p: {} },
    10: { k: 'bridgeKeys', p: {} },
    11: { k: 'bridgeReceipt', p: {} },
    12: { k: 'cradleBirth', p: {} },
    13: { k: 'noodleLine', p: {} },
    14: { k: 'dufuEcho', p: {} },
    15: { k: 'chorusExperience', p: {} },
    16: { k: 'chorusExperience', p: {} },
    17: { k: 'chorusExperience', p: {} },
    18: { k: 'chorusExperience', p: {} },
    19: { k: 'lampCallback', p: {} },
    20: { k: 'liubangPortrait', p: {} },
    21: { k: 'liubangPortrait', p: {} },
    22: { k: 'liubangPortrait', p: {} },
    23: { k: 'bridgePhone', p: {} },
    24: { k: 'bridgePhone', p: {} },
    25: { k: 'bridgePhone', p: {} },
    26: { k: 'warExperience', p: {} },
    27: { k: 'warExperience', p: {} },
    28: { k: 'warExperience', p: {} },
    29: { k: 'bridgeLedger', p: {} },
    30: { k: 'bridgeLedger', p: {} },
    31: { k: 'bridgeLedger', p: {} },
    32: { k: 'windExperience', p: {} },
    33: { k: 'windExperience', p: {} },
    34: { k: 'windExperience', p: {} },
    35: { k: 'swissBlocks', p: { text: '我是工艺人', chars: 'fall', stagger: 0.232, ink: 'accent', vline: true, logo: 'P08', en: false } },
    36: { k: 'lyricStage', p: { size: 112, tag: 'HOOK / 09' } },
    37: { k: 'halftoneFiles', p: { variant: 'marpol' } },
    38: { k: 'lampGrid9', p: {} },
    39: { k: 'workOrderLamp', p: {} },
    40: { k: 'lightbox', p: { head: '转 岗 记 录', rows: [['NAME', '必武'], ['POST', '工艺'], ['TIMES', '3'], ['FIRST', '40 岁']] } },
    41: { k: 'terminalType', p: { lines: ['> 靠 Failure code 立住脚', '> 一心一意 到这里', '> 假期没了', '> 头发没了'] } },
    42: { k: 'chartGrow', p: { bars: 11, line: false, title: 'WEEKEND · 1 天 比 1 天 短', note: '头发\n同比 -40%', seed: 7 } },
    43: { k: 'giveMeFive', p: {} },
    44: { k: 'slideDeck', p: { count: 35, title: 'WHAT I WANTED TO SAY' } },
    45: { k: 'swissBlocks', p: { text: '优化', marpol: true, sub: '老板提出的时候 · 都不说怎么弄', size: 300 } },
    46: { k: 'terminalType', p: { lines: ['> 我也有句话', '> 十年没说出口', '> 写成了 VBB', '> 他也听不到'] } },
    47: { k: 'terminalType', p: { lines: ['> 什么是 Work with fun', '> 什么是 Work as one', '> 我都写进去了', '> 没人问'] } },
    48: { k: 'halftoneFiles', p: { variant: 'no-complaint' } },
    49: { k: 'chartGrow', p: { bars: 12, line: true, title: '白天 / 夜晚 · 各 12 h', note: '不是勤奋\n是执着', seed: 11 } },
    50: { k: 'slowLine', p: {} },
    51: { k: 'swissBlocks', p: { text: '我是过来人', chars: 'stamp', stagger: 0.232, bg: 'yellowUp', ink: 'bg' } },
    52: { k: 'halftoneFiles', p: { variant: 'marpol' } },
    53: { k: 'lyricStage', p: { size: 112, tag: 'HOOK / 13' } },
    54: { k: 'badgeGrid12', p: {} },
    55: { k: 'badgeGridHalo', p: {} },
    56: { k: 'badgePerson', p: { name: '老曹', role: '曹教授', id: 'REC 0021', years: '20+', tickets: '1,204', stamp: '靠得住' } },
    57: { k: 'blueprintHall', p: { paper: true, title: '努力 没有白费', inset: 'P03', insetLabel: 'MIXING · 车间' } },
    58: { k: 'giveMeFive', p: { text: '教授打的胶 必属精品' } },
    59: { k: 'badgePerson', p: { name: '吴晗', role: '大陆班', id: 'REC 0022', years: '3', tickets: '硫化的苦', stamp: '学好了' } },
    60: { k: 'chartGrow', p: { bars: 9, line: false, title: '3 年 · 埋头学', note: '硫化的苦\n我吃过', seed: 13 } },
    61: { k: 'stairs4', p: { stepW: 220 } },
    62: { k: 'blueprintHall', p: { paper: true, title: '胎面 胎侧 常破边', inset: 'P02', insetLabel: 'TREAD · 断面' } },
    63: { k: 'blueprintHall', p: { paper: true, title: '前方还有缺胶 等我填' } },
    64: { k: 'lyricStage', p: { size: 112, tag: 'GAOXIAOFAN' } },
    65: { k: 'swissBlocks', p: { text: '我是 Gary', marpol: true, en: true } },
    66: { k: 'processFlow', p: { photo: 'P04' } },
    67: { k: 'radar6', p: {} },
    68: { k: 'badgePerson', p: { name: '传勇', role: '闯过几个岗', id: 'REC 0023', years: '4', tickets: '系统难题', stamp: '肩上扛' } },
    69: { k: 'terminalType', p: { lines: ['> 系统难题 肩上扛', '> 再用数据 来护航', '> 才明白 生产制造 大有文章'] } },
    70: { k: 'chartGrow', p: { bars: 9, line: true, title: '生产制造 · 大有文章', note: '数据护航', seed: 29, photo: 'P04' } },
    71: { k: 'swissBlocks', p: { text: '数据小王子', marpol: true, size: 200, sub: '未来的路上 我还在' } },
    72: { k: 'badgePerson', p: { name: 'Allen Ma', role: '年纪轻轻', id: 'REC 0024', years: '1', tickets: '数据', stamp: '别慌', inset: 'P07', insetLabel: 'BADGE · 空位' } },
    73: { k: 'scatterArc', p: {} },
    74: { k: 'bracketTangle', p: {} },
    75: { k: 'charArt', p: { title: 'E3 · 小马', glyphs: '▖▗▘▝█' } },
    76: { k: 'descentDot', p: {} },
    77: { k: 'punchline', p: { word: 'Punchline', size: 156 } },
    78: { k: 'swissBlocks', p: { text: '我是过来人', chars: 'lyric', bg: 'yellowRamp', rampAt: 1.75, rampDur: 1.2, ink: 'bg', rise: 6 } },
    79: { k: 'halftoneFiles', p: { variant: 'marpol' } },
    80: { k: 'lyricStage', p: { size: 112, tag: 'HOOK / 21' } },
    81: { k: 'badgeGridHalo2', p: { lySize: 54 } },
    83: { k: 'swissBlocks', p: { text: '我是工艺人', chars: 'sync', sub: '站在卓越路上 追着共同的梦', ink: 'accent', photo: 'P05', photoAlpha: 0.72, photoScrim: 0.46, horizon: true, logo: 'P08' } },
    84: { k: 'chartGrow', p: { bars: 12, line: true, title: '新标准 · 新优化 · 新成果', note: '我们都有份', seed: 37 } },
    85: { k: 'terminalType', p: { lines: ['> 我不是来等待', '> 我是与你一起创造可能', '> > _'] } },
    86: { k: 'lastLamp', p: { sweep: 1.05, typeAt: 3.35, dimAt: 6.4 } },  // TAIL_RETIME: 扫光→收拢→打字→压暗
  };

  // ---------------- RETIME 覆盖层：片尾切镜放慢 ----------------
  // film/data/shots.js 由 film/data/build_shots.mjs 从 STORYBOARD.md 重新生成，
  // 不能直接改那个文件；这里在拿到 window.SHOTS 之后按镜头号重排一次：
  //   #81 + #82 → 1 镜（284.80 → 287.90，3.10 s，正好接上 #83 的 287.90）
  //   #86 + #87 → 终镜（299.00 → 305.88，6.88 s，扫光 1.05 s 后收拢再打字）
  // 不碰音频、不碰总时长、不碰任何歌词时间。
  (function retimeFinale() {
    function mustFind(n) {
      const i = SHOTS.findIndex((s) => s.n === n);
      if (i < 0) throw new Error('RETIME: 找不到镜头 #' + n);
      return SHOTS[i];
    }
    const s81 = mustFind(81), s82 = mustFind(82), s86 = mustFind(86), s87 = mustFind(87);
    const same = (a, b) => Math.abs(a - b) < 1e-6;
    // 源表若变了就宁可炸掉，也不要悄悄把片子改坏
    if (!same(s81.t, 284.8) || !same(s81.dur, 1.5)) throw new Error('RETIME: #81 与预期 284.8/1.5 不符');
    if (!same(s82.t, 286.3) || !same(s82.dur, 1.6)) throw new Error('RETIME: #82 与预期 286.3/1.6 不符');
    if (!same(s86.t, 299.0) || !same(s86.dur, 1.5)) throw new Error('RETIME: #86 与预期 299.0/1.5 不符');
    if (!same(s87.t, 300.4) || !same(s87.dur, 5.5)) throw new Error('RETIME: #87 与预期 300.4/5.5 不符');

    s81.dur = 3.1;                       // 284.80 → 287.90
    SHOTS.splice(SHOTS.indexOf(s82), 1); // 后半段并入 #81
    delete PLAN[82];

    s86.dur = 6.88;                      // 299.00 → 305.88（= TL.duration）
    SHOTS.splice(SHOTS.indexOf(s87), 1); // 后半段并入 #86
    delete PLAN[87];

    // shotAt() 的二分查找依赖 t 升序：splice 之后必须仍然成立
    for (let i = 1; i < SHOTS.length; i++) {
      if (!(SHOTS[i].t > SHOTS[i - 1].t)) throw new Error('RETIME: SHOTS 未按 t 升序（第 ' + i + ' 项）');
    }
  })();

  // 段落黑场：只在段界做，镜头之间硬切
  function sectionFade(sec, t) {
    const a = 1 - clamp((t - sec.start) / 0.26, 0, 1);
    const b = clamp((t - (sec.end - 0.2)) / 0.2, 0, 1);
    return Math.max(a, b);
  }

  function shotAt(t) {
    let lo = 0, hi = SHOTS.length - 1;
    if (t < SHOTS[0].t) return SHOTS[0];
    if (t >= SHOTS[hi].t + SHOTS[hi].dur) return SHOTS[hi];
    while (lo <= hi) {
      const mid = (lo + hi) >> 1;
      const s = SHOTS[mid];
      if (t < s.t) hi = mid - 1;
      else if (t >= s.t + s.dur) lo = mid + 1;
      else return s;
    }
    return SHOTS[Math.max(0, lo - 1)];
  }

  const ANCIENT_SECS = new Set([1, 2, 4, 8]);

  // TAIL_RETIME —— 结尾切镜放慢（只动画面调度，不动音频/歌词/总时长）
  // 81+82 合并成一镜 3.10 s（badgeGridHalo2 本身先点亮再光晕，覆盖两段语义）
  // 86+87 合并成一镜 6.88 s（lastLamp：扫光 → 收拢 → 打字 → 压暗）
  {
    const i81 = SHOTS.findIndex((s) => s.n === 81);
    const i82 = SHOTS.findIndex((s) => s.n === 82);
    if (i81 >= 0 && i82 >= 0) {
      SHOTS[i81].dur = SHOTS[i82].t + SHOTS[i82].dur - SHOTS[i81].t;
      SHOTS.splice(i82, 1);
    }
    const i86 = SHOTS.findIndex((s) => s.n === 86);
    const i87 = SHOTS.findIndex((s) => s.n === 87);
    if (i86 >= 0 && i87 >= 0) {
      SHOTS[i86].dur = SHOTS[i87].t + SHOTS[i87].dur - SHOTS[i86].t;
      SHOTS.splice(i87, 1);
    }
    for (let i = 1; i < SHOTS.length; i++) {
      if (SHOTS[i].t < SHOTS[i - 1].t) throw new Error('TAIL_RETIME: shots out of order at ' + i);
    }
  }

  // 颜色线性混合：用黄度 k 把 HUD 从「暗底上的亮灰」过渡到「黄底上的深褐」
  function mixHex(a, b, k) {
    const pa = [parseInt(a.slice(1, 3), 16), parseInt(a.slice(3, 5), 16), parseInt(a.slice(5, 7), 16)];
    const pb = [parseInt(b.slice(1, 3), 16), parseInt(b.slice(3, 5), 16), parseInt(b.slice(5, 7), 16)];
    const out = pa.map((v, i) => Math.round(v + (pb[i] - v) * clamp(k, 0, 1)));
    return '#' + out.map((v) => v.toString(16).padStart(2, '0')).join('');
  }

  // 该镜头此刻的「黄底程度」0→1（只有整幅黄底的版式才有）
  function yellowKAt(plan, local) {
    const p = plan && plan.p;
    if (!p) return 0;
    if (p.bg === 'yellowUp') return clamp(local / 0.6, 0, 1);
    if (p.bg === 'yellowRamp') {
      const at = p.rampAt == null ? 1.75 : p.rampAt;
      const dur = p.rampDur == null ? 1.2 : p.rampDur;
      const u = clamp((local - at) / dur, 0, 1);
      return u * u * (3 - 2 * u);            // smoothstep，与 layout 内 ease.io 近似
    }
    return 0;
  }

  // 通用插图窗：版式画完后，在右上安静地贴一张实物照片（带细框和标签）
  function insetWindow(plan, local, duration) {
    const q = plan && plan.p;
    if (!q || !q.inset || !window.PHOTO || !window.PHOTO.has(q.inset)) return;
    let k = clamp((local - 0.35) / 0.5, 0, 1);
    if (q.insetFadeIn != null) {
      const start = q.insetFadeDelay == null ? 0 : q.insetFadeDelay;
      k = q.insetFadeIn <= 0 ? (local >= start ? 1 : 0) : clamp((local - start) / q.insetFadeIn, 0, 1);
    }
    if (q.insetFadeOut != null && duration != null) {
      const out = q.insetFadeOut <= 0 ? 1 : clamp((duration - local) / q.insetFadeOut, 0, 1);
      k = Math.min(k, out);
    }
    if (k <= 0) return;
    const w = q.insetW || 292, h = q.insetH || 168;
    const x = q.insetX == null ? W - 120 - w : q.insetX;
    const y = q.insetY == null ? 176 : q.insetY;
    const ia = q.insetAlpha == null ? 0.5 : q.insetAlpha;
    const itone = q.insetTone || 'dark';
    window.PHOTO.plate(q.inset, x, y, w, h, {
      tone: itone, label: false, alpha: ia * k,
      contrast: q.insetContrast, halftone: q.insetHalftone, grainAlpha: q.insetGrainAlpha,
    });
    // 浅纸底上金色框会消失，改深墨；深底仍用金
    const lightNow = !!window.__LIGHT;
    const frameCol = lightNow ? '#3a2f22' : '#c8a24a';
    ctx.save();
    ctx.globalAlpha = (lightNow ? 0.6 : 0.75) * k;
    ctx.strokeStyle = frameCol;
    ctx.lineWidth = 1;
    ctx.strokeRect(x + 0.5, y + 0.5, w, h);
    ctx.globalAlpha = (lightNow ? 0.42 : 0.55) * k;
    ctx.fillStyle = frameCol;
    ctx.fillRect(x, y - 18, w, 1);
    const lab = q.insetLabel === false ? '' : (q.insetLabel || 'REF');
    if (lab) text(lab, x, y - 26, { size: 15, fam: 'mono', color: frameCol, letterSpacing: 4 });
    ctx.restore();
    // 浅底上给照片加一层纸色压印，避免「贴了一张对比过强的照片」
    if (lightNow && itone !== 'paper') {
      ctx.save();
      ctx.globalAlpha = 0.16 * k;
      ctx.fillStyle = '#e6dcc8';
      ctx.fillRect(x, y, w, h);
      ctx.restore();
    }
  }

  function draw(t) {
    const sec = sectionAt(t);
    const shot = shotAt(t);
    const plan = PLAN[shot.n] || PLAN[1];
    const kind = plan.k;
    const fn = LAYOUTS[kind];
    const pal = PAL[shot.pal] || PAL[sec.pal] || PAL.system;
    K.clear('#000');

    const c = {
      t, sec, pal, shot,
      u: clamp((t - shot.t) / (shot.dur || 1), 0, 1),   // 镜头内进度 0→1
      local: t - shot.t,                                 // 镜头内秒数（layout 内部动画用它）
      dur: shot.dur,
      p: plan.p || {},
      fade: false,                                       // 黑场由这里统一加
    };

    window.__LIGHT = false;              // 版式铺浅底时会置位
    ctx.save();
    if (fn) {
      fn(c);
    } else {
      // 未实现的版式：留一个能看出来的占位（而不是静默黑屏）
      ctx.fillStyle = '#101014';
      ctx.fillRect(0, 0, W, H);
      text(`MISSING LAYOUT: ${kind}`, W / 2, H / 2, { size: 40, fam: 'mono', color: '#d4553d', align: 'center' });
      text(`SHOT ${shot.n} · ${shot.style}`, W / 2, H / 2 + 56, { size: 24, fam: 'mono', color: '#8b8577', align: 'center' });
    }
    ctx.restore();
    insetWindow(plan, t - shot.t, shot.dur);

    // 系统 HUD：仪表框全片统一，但浅底（纸面 / 黄底）要换深墨
    {
      const ank = ANCIENT_SECS.has(sec.index);
      const yk = yellowKAt(plan, t - shot.t);
      const paperPlan = !!(plan.p && (plan.p.paper || plan.p.onPaper));
      // 浅底判定：古代段纸面 / 版式显式声明纸面 / 黄底已铺满过半
      const lightBg = ank || paperPlan || yk > 0.45 || !!window.__LIGHT;
      // 浅底时调色板换成「纸上的墨」：古代调色板天然就是墨+纸
      let hudPal = pal;
      if (lightBg && !ank) {
        hudPal = {
          bg: pal.bg,
          ink: '#17130f',
          dim: '#4a4034',
          line: '#8a7a60',
          accent: pal.accent,
        };
      } else if (!lightBg && yk <= 0.001) {
        hudPal = pal;
      } else if (!lightBg) {
        hudPal = {
          bg: pal.bg,
          ink: mixHex(pal.ink, pal.bg, yk),
          dim: mixHex(pal.dim, '#111008', yk),
          line: mixHex(pal.line, '#6b5a0d', yk),
          accent: mixHex(pal.accent, pal.bg, yk),
        };
      }
      if (window.UI) {
        UI.chrome({ pal: hudPal, sec, shot, t, local: t - shot.t, lightBg, inkColor: '#17130f' });
        UI.hud({ pal: hudPal, sec, shot, t, local: t - shot.t, yellowK: yk, lightBg, inkColor: '#17130f',
          brand: ank ? 'ARCHIVE 1000Y' : null });
      } else {
        K.hud(t, hudPal, {});
      }
    }

    // 后期：暗角 / 颗粒 / 扫描线 + 段界黑场
    const sf = sectionFade(sec, t) * 0.92;
    const ancientReview = t < 136.9;
    K.finish(t, pal, {
      fade: sf,
      grainAlpha: ancientReview ? 0.025 : (ANCIENT_SECS.has(sec.index) ? 0.13 : 0.08),
      grain: true,
      vignette: ancientReview ? 'rgba(40,28,14,0.10)' : (ANCIENT_SECS.has(sec.index) ? 'rgba(40,28,14,0.5)' : 'rgba(0,0,0,0.55)'),
      scan: !ancientReview && (sec.index === 6 || sec.index === 7),
      scanAlpha: 0.16,
    });
    if (typeof K.drawSubtitles === 'function') K.drawSubtitles(t);
  }

  window.DRAW = draw;
  // 调试用
  window.__shotAt = shotAt;
  window.__PLAN = PLAN;
})();
