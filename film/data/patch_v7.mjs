// 接入 layouts4.js：#77 → punchline，#86 → badgeSweep；另外把闲置的四张照片挂成插图窗
import fs from 'fs';
const root = 'E:/新建文件夹/实习/MV/';

// a) index.html 加载 layouts4.js（在 layouts3 之后、shotfilm 之前）
{
  const p = root + 'film/index.html';
  let s = fs.readFileSync(p, 'utf8');
  if (!s.includes('src/layouts4.js')) {
    const anchor = '<script src="src/shotfilm.js"></script>';
    if (!s.includes(anchor)) throw new Error('shotfilm script tag not found');
    s = s.replace(anchor, '<script src="src/layouts4.js"></script>\n  ' + anchor);
    fs.writeFileSync(p, s);
    console.log('index.html ok');
  } else console.log('index.html already');
}

// b) PLAN：#77 / #86 换版式；#57 #62 #63 #72 挂插图窗
{
  const p = root + 'film/src/shotfilm.js';
  let s = fs.readFileSync(p, 'utf8');
  const reps = [
    [`    77: { k: 'giveMeFive', p: { text: '工艺的未来 都是 Punchline' } },`,
     `    77: { k: 'punchline', p: { word: 'Punchline', size: 156 } },`],
    [`    86: { k: 'lightbox', p: { head: '一 盏 灯', rows: [['WHO', '你'], ['WHEN', '现在'], ['WHERE', '前面'], ['NOTE', '还亮着']] } },`,
     `    86: { k: 'badgeSweep', p: {} },`],
    [`    57: { k: 'blueprintHall', p: { paper: true } },`,
     `    57: { k: 'blueprintHall', p: { paper: true, inset: 'P03', insetLabel: 'MIXING · 车间' } },`],
    [`    62: { k: 'blueprintHall', p: { marpol: true, tire: true } },`,
     `    62: { k: 'blueprintHall', p: { marpol: true, tire: true, inset: 'P02', insetLabel: 'TREAD · 断面' } },`],
    [`    72: { k: 'lightbox', p: { head: 'Allen Ma' } },`,
     `    72: { k: 'lightbox', p: { head: 'Allen Ma', inset: 'P07', insetLabel: 'BADGE · 空位' } },`],
  ];
  let hit = 0;
  for (const [a, b] of reps) {
    if (s.includes(a)) { s = s.replace(a, b); hit++; }
    else console.log('MISS:', a.slice(0, 60));
  }
  fs.writeFileSync(p, s);
  console.log('PLAN replaced', hit, '/', reps.length);
}

// c) shotfilm.draw：通用插图窗（版式画完后叠加，安静地给画面补一张实物）
{
  const p = root + 'film/src/shotfilm.js';
  let s = fs.readFileSync(p, 'utf8');
  if (!s.includes('function insetWindow')) {
    const anchor = '  function draw(t) {';
    if (!s.includes(anchor)) throw new Error('draw anchor not found');
    const fn = `  // 通用插图窗：版式画完后，在右上安静地贴一张实物照片（带细框和标签）
  function insetWindow(plan, local) {
    const q = plan && plan.p;
    if (!q || !q.inset || !window.PHOTO || !window.PHOTO.has(q.inset)) return;
    const k = clamp((local - 0.35) / 0.5, 0, 1);
    if (k <= 0) return;
    const w = 292, h = 168;
    const x = W - 120 - w, y = 176;
    ctx.save();
    ctx.globalAlpha = 0.5 * k;
    window.PHOTO.plate(q.inset, x, y, w, h, { tone: 'dark', label: false });
    ctx.restore();
    ctx.save();
    ctx.globalAlpha = 0.75 * k;
    ctx.strokeStyle = '#c8a24a';
    ctx.lineWidth = 1;
    ctx.strokeRect(x + 0.5, y + 0.5, w, h);
    ctx.globalAlpha = 0.55 * k;
    ctx.fillStyle = '#c8a24a';
    ctx.fillRect(x, y - 18, w, 1);
    const lab = q.insetLabel || 'REF';
    text(lab, x, y - 26, { size: 15, fam: 'mono', color: '#c8a24a', letterSpacing: 4 });
    ctx.restore();
  }

`;
    s = s.replace(anchor, fn + anchor);
    // 在版式绘制之后、HUD 之前调用
    const after = `    window.__LIGHT = false;              // 版式铺浅底时会置位`;
    if (!s.includes(after)) throw new Error('light reset anchor not found');
    s = s.replace(after, after);
    const callAnchor = `    ctx.restore();

    // 系统 HUD`;
    if (!s.includes(callAnchor)) throw new Error('post-layout anchor not found');
    s = s.replace(callAnchor, `    ctx.restore();
    insetWindow(plan, t - shot.t);

    // 系统 HUD`);
    fs.writeFileSync(p, s);
    console.log('shotfilm.js insetWindow ok');
  } else console.log('insetWindow already');
}
