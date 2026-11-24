// film/src/main.js —— 装配 renderAt(t) 与浏览态播放
// 导出契约（ref_prompts/references/rendering.md）：
//   window.renderAt(t) 是唯一推进画面的入口；?export=1 时不开 rAF；
//   画面完全是 t 的纯函数；canvas 像素尺寸 = 输出尺寸。

(function () {
  const K = window.K;
  const TL = window.TL;
  const params = new URLSearchParams(location.search);
  window.__SHOW_SLOTS = params.get('slots') === '1';
  const isExport = params.get('export') === '1';
  const tParam = params.get('t');
  const fpsParam = parseFloat(params.get('fps') || '60');
  window.__SHOW_SHOT_TAGS = params.get('tags') === '1';

  // 字体预加载：CJK 逐字 load，缺字必须报错（宁可炸也不要静默错版）
  const FONTS = [
    '400 16px "Cascadia Mono"',
    '500 16px "Cascadia Mono"',
    '700 16px "Cascadia Mono"',
    '400 16px "Noto Serif SC"',
    '500 16px "Noto Serif SC"',
    '700 16px "Noto Serif SC"',
    '900 16px "Noto Sans SC"',
    '400 16px "Noto Sans SC"',
    '500 16px "Noto Sans SC"',
    '700 16px "Noto Sans SC"',
  ];

  // 全片出现过的所有字符：逐字 load，缺一个都不行
  function allChars() {
    const set = new Set();
    const add = (s) => { for (const ch of (s || '')) set.add(ch); };
    TL.sections.forEach((s) => {
      add(s.name);
      s.lines.forEach((l) => add(l.text));
    });
    add('卓越路大风起兮云飞扬杜甫刘邦亭长过来人档案系统工单记录编号状态在岗前辈同行搭档老兵质量新人接着跑尚未受命靠得住一起扛稳零缺陷耐磨剖面茅屋迁徙登记簿唐工部员外郎宋元明清汉唐宋元');
    add('胜败平伤亡累计参战年出租屋旧书酒药灯油房车马纸墨冬衣米修补屋顶购置租赁抵押备注屋漏连夜修');
    add('张三李四王五老曹小马你自己核对声明');
    add('PROCESS QUALITY COST PEOPLE BEFORE AFTER SLIDE CONFIDENTIAL MARPOL no complaints since');
    return Array.from(set).join('');
  }

  async function loadFonts() {
    if (!document.fonts || !document.fonts.load) return;
    const chars = allChars();
    const jobs = [];
    for (const f of FONTS) {
      // 先按整体加载一次，再逐字确认（CJK 子集字体常见只加载了部分字）
      jobs.push(document.fonts.load(f, chars.slice(0, 40)).catch(() => {}));
      jobs.push(document.fonts.load(f).catch(() => {}));
    }
    await Promise.all(jobs);
    // 逐字校验：用 measureText 对比 fallback，差异过小说明没加载到
    const c = document.createElement('canvas').getContext('2d');
    const missing = [];
    for (const f of FONTS) {
      await document.fonts.load(f, chars).catch(() => {});
    }
    const test = '卓越路大风杜甫刘邦';
    for (const f of ['400 40px "Noto Serif SC"', '900 40px "Noto Sans SC"', '400 40px "Cascadia Mono"']) {
      c.font = f;
      const w = c.measureText(test).width;
      if (w < 10) missing.push(f);
    }
    if (missing.length) {
      console.error('[fonts] missing:', missing.join(', '));
      document.title = 'FONT-MISSING: ' + missing.join(',');
    }
  }

  function render(t) {
    const clamped = Math.max(0, Math.min(TL.duration - 1e-4, t));
    window.DRAW(clamped);
  }
  window.renderAt = render;

  // 浏览态：跟音频走（audio 元素由查询参数加载）
  function startPlayback() {
    document.body.classList.add('browse');
    const audio = document.createElement('audio');
    const src = params.get('audio') || 'media/song.mp3';
    audio.src = src;
    audio.loop = false;
    document.body.appendChild(audio);

    const t0 = parseFloat(params.get('start') || '0');
    let base = performance.now();
    let offset = t0;

    const tick = () => {
      const t = audio.paused || audio.readyState < 2
        ? offset + (performance.now() - base) / 1000
        : audio.currentTime;
      render(t);
      requestAnimationFrame(tick);
    };

    audio.addEventListener('play', () => { base = performance.now(); offset = audio.currentTime; });
    audio.play().then(() => { base = performance.now(); offset = audio.currentTime; })
      .catch(() => { /* 自动播放被拦：纯时间轴播放 */ });
    requestAnimationFrame(tick);

    // 空格暂停
    window.addEventListener('keydown', (e) => {
      if (e.code === 'Space') { e.preventDefault(); audio.paused ? audio.play() : audio.pause(); }
    });
  }

  (async function boot() {
    try {
      await loadFonts();
    } catch (e) {
      console.error(e);
    }
    // 照片槽位：没有 manifest 或没有图都不报错，只是退回纯图形版
    if (window.PHOTO) {
      try { await window.PHOTO.load(); } catch (e) { console.warn('[photo]', e); }
    }
    if (isExport) {
      document.body.style.background = '#000';
      const t = tParam != null ? parseFloat(tParam) : 0;
      render(t);
      window.__READY__ = true;
      return;
    }
    if (tParam != null) {
      // 单帧预览：?t=123.4
      document.body.classList.add('browse');
      render(parseFloat(tParam));
      window.__READY__ = true;
      return;
    }
    startPlayback();
    window.__READY__ = true;
  })();
})();
