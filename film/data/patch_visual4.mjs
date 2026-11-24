// 视觉补丁 4：
//  a) 顶栏品牌与副题之间没有间距（measure 不吃 letterSpacing）→ 固定偏移
//  b) 右竖轨的 SHOT 标签与底部百分比撞在一起 → 上移
//  c) 底部数据带与日志行只差 24 px → 分开
//  d) 角标照片（马牌）是硬边亮矩形，像贴上去的 → 半透 + 细黄框 + 小标题，读作「档案插图窗」
import fs from 'fs';
const root = 'E:/新建文件夹/实习/MV/';

// ---------- a~c) ui.js ----------
{
  const p = root + 'film/src/ui.js';
  let s = fs.readFileSync(p, 'utf8');

  const oldBrand = `    const brand = c.brand || 'THE OGS';
    const sub = c.brand ? 'THE OGS · 过来人档案系统' : '过来人档案系统';
    meta(brand, 120, 72, { color: ink, alpha: light ? 0.8 : 0.85, size: T.meta, ls: 4 });
    micro(sub, 120 + K.measure(brand, T.meta, 'mono') + 18, 72, { color: ink, alpha: light ? 0.45 : 0.4, size: T.micro });`;
  if (!s.includes(oldBrand)) throw new Error('brand block not found');
  s = s.replace(oldBrand, `    const brand = c.brand || 'THE OGS';
    const sub = c.brand ? 'THE OGS · 过来人档案系统' : '过来人档案系统';
    meta(brand, 120, 72, { color: ink, alpha: light ? 0.8 : 0.85, size: T.meta, ls: 4 });
    // measure() 不含字距，直接用固定偏移，避免两个词粘在一起
    micro(sub, 120 + (c.brand ? 232 : 108), 72, { color: ink, alpha: light ? 0.45 : 0.4, size: T.micro });`);

  const oldShot = `    ctx.translate(X1 + 66, bot - 6);`;
  if (!s.includes(oldShot)) throw new Error('shot rail anchor not found');
  s = s.replace(oldShot, `    ctx.translate(X1 + 66, bot - 52);`);

  const oldBand = `    const by = H - 104;
    line(X0 - 40, by - 14, X1 + 40, by - 14, ink, light ? 0.26 : 0.16, 1);
    segments(X0 - 40, by, X1 - X0 + 80, 104, ink, light ? 0.3 : 0.2);`;
  if (!s.includes(oldBand)) throw new Error('band block not found');
  s = s.replace(oldBand, `    const by = H - 112;
    line(X0 - 40, by - 10, X1 + 40, by - 10, ink, light ? 0.26 : 0.16, 1);
    segments(X0 - 40, by, X1 - X0 + 80, 112, ink, light ? 0.3 : 0.2);`);

  const oldCells = `      micro(cells[i][0], x, by + 40, { color: ink, alpha: light ? 0.4 : 0.3 });
      meta(cells[i][1], x + 58, by + 40, { color: ink, alpha: light ? 0.7 : 0.52, size: T.micro, ls: 2 });`;
  if (!s.includes(oldCells)) throw new Error('cells block not found');
  s = s.replace(oldCells, `      micro(cells[i][0], x, by + 52, { color: ink, alpha: light ? 0.4 : 0.3 });
      meta(cells[i][1], x + 58, by + 52, { color: ink, alpha: light ? 0.7 : 0.52, size: T.micro, ls: 2 });`);

  const oldWave = `    statusLight(X1 - 300, by + 32, 4, on, acc);
    wave(X1 - 270, by + 20, 240, 22, c.t, { pal: pal, color: acc, alpha: light ? 0.4 : 0.3, n: 40 });`;
  if (!s.includes(oldWave)) throw new Error('wave block not found');
  s = s.replace(oldWave, `    statusLight(X1 - 300, by + 44, 4, on, acc);
    wave(X1 - 270, by + 32, 240, 22, c.t, { pal: pal, color: acc, alpha: light ? 0.4 : 0.3, n: 40 });`);

  const oldLog = `    micro(parts.join('     '), 120, H - 40, { color: ink, alpha: light ? 0.34 : 0.3, size: T.micro });
    meta(sec.name.slice(0, 8).toUpperCase(), W - 120, H - 40,
      { align: 'right', color: ink, alpha: light ? 0.42 : 0.36, size: T.micro, ls: 4 });`;
  if (!s.includes(oldLog)) throw new Error('log block not found');
  s = s.replace(oldLog, `    micro(parts.join('     '), 120, H - 34, { color: ink, alpha: light ? 0.34 : 0.3, size: T.micro });
    meta(sec.name.slice(0, 8).toUpperCase(), W - 120, H - 34,
      { align: 'right', color: ink, alpha: light ? 0.42 : 0.36, size: T.micro, ls: 4 });`);

  fs.writeFileSync(p, s);
  console.log('ui.js ok');
}

// ---------- d) layouts.js 角标照片 ----------
{
  const p = root + 'film/src/layouts.js';
  let s = fs.readFileSync(p, 'utf8');
  const old = `    // 角标照片（马牌）
    if (P.logo && window.PHOTO && window.PHOTO.has(P.logo)) {
      const lk = ease.out(clamp((c.local - 0.6) / 0.5, 0, 1));
      ctx.save();
      ctx.globalAlpha = 0.9 * lk;
      window.PHOTO.plate(P.logo, 64, 176, 300, 168, { tone: 'dark', label: false });
      ctx.restore();
    }`;
  if (!s.includes(old)) throw new Error('logo block not found');
  s = s.replace(old, `    // 角标照片（马牌）：不要一张硬边亮矩形贴在画面上 —— 做成「档案插图窗」
    if (P.logo && window.PHOTO && window.PHOTO.has(P.logo)) {
      const lk = ease.out(clamp((c.local - 0.6) / 0.5, 0, 1));
      const bx = 100, by2 = 196, bw = 306, bh = 172;
      ctx.save();
      // 半透：让它沉进背景的网纹里
      ctx.globalAlpha = 0.52 * lk;
      window.PHOTO.plate(P.logo, bx, by2, bw, bh, { tone: 'dark', label: false });
      ctx.restore();
      ctx.save();
      ctx.globalAlpha = 0.85 * lk;
      // 细黄框 + 上下小标题，像档案系统里的插图窗口
      ctx.strokeStyle = pal.accent;
      ctx.lineWidth = 1.5;
      ctx.strokeRect(bx + 0.5, by2 + 0.5, bw, bh);
      ctx.globalAlpha = 0.7 * lk;
      ctx.fillStyle = pal.accent;
      ctx.fillRect(bx, by2 - 22, bw, 1);
      text('GLOBAL SIGN', bx, by2 - 30, { size: 15, fam: 'mono', color: pal.accent, letterSpacing: 4 });
      text('DWG 04', bx + bw, by2 - 30, { size: 15, fam: 'mono', color: pal.dim, align: 'right', letterSpacing: 3 });
      ctx.restore();
    }`);
  fs.writeFileSync(p, s);
  console.log('layouts.js logo ok');
}
