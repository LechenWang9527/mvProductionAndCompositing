// 修「浅底上的仪表看不见」：版式自己铺了浅色底（paperBg / ancient 照片）时，
// 必须把 HUD 切到深墨。做法是让绘制浅底的工具置一个帧内标志，shotfilm 画完版式后读它。
import fs from 'fs';
const root = 'E:/新建文件夹/实习/MV/';

// ---------- a) core.js：paperBg 置标志 ----------
{
  const p = root + 'film/src/core.js';
  let s = fs.readFileSync(p, 'utf8');
  if (!s.includes('__LIGHT_BG')) {
    const fn = s.indexOf('  function paperBg(');
    if (fn < 0) throw new Error('paperBg not found');
    s = s.slice(0, fn) + `  // 帧内标志：某个版式铺了浅色底（纸面 / 亮照片），HUD 要换深墨
  const LIGHT = { v: false };

` + s.slice(fn);
    // 在 paperBg 函数体开头置位
    const head = s.indexOf('  function paperBg(', s.indexOf('const LIGHT'));
    const brace = s.indexOf('{', s.indexOf(')', head)) + 1;
    s = s.slice(0, brace) + '\n    LIGHT.v = true;' + s.slice(brace);
    // 导出
    s = s.replace('  window.K = {', '  window.K = {\n    LIGHT,');
    if (!s.includes('LIGHT,')) throw new Error('K export anchor not found');
    fs.writeFileSync(p, s);
    console.log('core.js light flag ok');
  } else console.log('core.js already');
}

// ---------- b) photo.js：ancient 色调照片也算浅底 ----------
{
  const p = root + 'film/src/photo.js';
  let s = fs.readFileSync(p, 'utf8');
  if (!s.includes('LIGHT.v = true')) {
    const old = `  function bg(id, tone, o) {
    o = o || {};
    if (!has(id)) return false;`;
    if (!s.includes(old)) throw new Error('photo bg head not found');
    s = s.replace(old, `  function bg(id, tone, o) {
    o = o || {};
    if (!has(id)) return false;
    if (tone === 'ancient' && window.K && window.K.LIGHT) window.K.LIGHT.v = true;   // 亮纸照片 = 浅底`);
    fs.writeFileSync(p, s);
    console.log('photo.js light flag ok');
  } else console.log('photo.js already');
}

// ---------- c) shotfilm.js：用标志判定 ----------
{
  const p = root + 'film/src/shotfilm.js';
  let s = fs.readFileSync(p, 'utf8');
  const oldDraw = `    ctx.save();
    if (fn) {
      fn(c);`;
  if (!s.includes(oldDraw)) throw new Error('draw head not found');
  s = s.replace(oldDraw, `    if (K.LIGHT) K.LIGHT.v = false;      // 版式自己会置位（铺了浅色底）
    ctx.save();
    if (fn) {
      fn(c);`);

  const oldLight = `      const lightBg = ank || paperPlan || yk > 0.45;`;
  if (!s.includes(oldLight)) throw new Error('lightBg line not found');
  s = s.replace(oldLight, `      const lightBg = ank || paperPlan || yk > 0.45 || (K.LIGHT && K.LIGHT.v);`);
  fs.writeFileSync(p, s);
  console.log('shotfilm.js light flag ok');
}
