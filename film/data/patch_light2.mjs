// 极简版浅底检测：版式铺浅底时置全局标志，shotfilm 读它决定 HUD 用深墨
import fs from 'fs';
const root = 'E:/新建文件夹/实习/MV/';

// a) layouts.js: paperBg 置位
{
  const p = root + 'film/src/layouts.js';
  let s = fs.readFileSync(p, 'utf8');
  if (!s.includes('window.__LIGHT = true')) {
    const i = s.indexOf('  function paperBg(col) {');
    if (i < 0) throw new Error('paperBg not found');
    const brace = s.indexOf('{', i) + 1;
    s = s.slice(0, brace) + '\n    window.__LIGHT = true;' + s.slice(brace);
    fs.writeFileSync(p, s);
    console.log('layouts.js paperBg flag ok');
  } else console.log('layouts paperBg already');
}

// b) photo.js: ancient 照片也算浅底
{
  const p = root + 'film/src/photo.js';
  let s = fs.readFileSync(p, 'utf8');
  if (!s.includes('__LIGHT = true')) {
    const old = `  function bg(id, tone, o) {
    o = o || {};
    if (!has(id)) return false;`;
    if (!s.includes(old)) throw new Error('photo bg head not found');
    s = s.replace(old, `  function bg(id, tone, o) {
    o = o || {};
    if (!has(id)) return false;
    if (tone === 'ancient') window.__LIGHT = true;`);
    fs.writeFileSync(p, s);
    console.log('photo.js flag ok');
  } else console.log('photo bg already');
}

// c) shotfilm.js: 画版式前清空，画完读取
{
  const p = root + 'film/src/shotfilm.js';
  let s = fs.readFileSync(p, 'utf8');
  const oldDraw = `    ctx.save();
    if (fn) {
      fn(c);`;
  if (s.includes(oldDraw) && !s.includes('window.__LIGHT = false')) {
    s = s.replace(oldDraw, `    window.__LIGHT = false;              // 版式铺浅底时会置位
    ctx.save();
    if (fn) {
      fn(c);`);
  }
  const oldLight = `      const lightBg = ank || paperPlan || yk > 0.45;`;
  if (s.includes(oldLight)) {
    s = s.replace(oldLight, `      const lightBg = ank || paperPlan || yk > 0.45 || !!window.__LIGHT;`);
  } else if (!s.includes('!!window.__LIGHT')) {
    throw new Error('lightBg line not found');
  }
  fs.writeFileSync(p, s);
  console.log('shotfilm.js flag ok');
}
