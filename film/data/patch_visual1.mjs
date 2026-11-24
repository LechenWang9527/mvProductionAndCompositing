// 视觉升级补丁 1：
//  a) 照片占位框只在 ?slots=1 时画（生产版不留灰色空框）
//  b) lightBg 判定（纸面 / 黄底 / 白框版式）→ HUD 换深色墨
//  c) 小字号统一到 15/18/26 三档，并统一字距（解决「字体太乱」）
import fs from 'fs';
const root = 'E:/新建文件夹/实习/MV/';

// ---------- a) photo.js ----------
{
  const p = root + 'film/src/photo.js';
  let s = fs.readFileSync(p, 'utf8');
  const old = `  function placeholder(slot, x, y, w, h, tone) {`;
  if (!s.includes(old)) throw new Error('placeholder fn not found');
  s = s.replace(old, `  function placeholder(slot, x, y, w, h, tone) {
    if (!window.__SHOW_SLOTS) return;   // 生产版不画空槽；调试加 ?slots=1`);
  fs.writeFileSync(p, s);
  console.log('photo.js ok');
}

// ---------- a2) main.js 读 ?slots=1 ----------
{
  const p = root + 'film/src/main.js';
  let s = fs.readFileSync(p, 'utf8');
  if (!s.includes('__SHOW_SLOTS')) {
    const anchor = `  const params = new URLSearchParams(location.search);`;
    if (!s.includes(anchor)) throw new Error('params anchor not found');
    s = s.replace(anchor, anchor + `\n  window.__SHOW_SLOTS = params.get('slots') === '1';`);
    fs.writeFileSync(p, s);
    console.log('main.js ok');
  } else console.log('main.js already');
}

// ---------- c) core.js：小字号归一 ----------
{
  const p = root + 'film/src/core.js';
  let s = fs.readFileSync(p, 'utf8');
  const old = `  function text(str, x, y, opts) {
    const o = opts || {};
    setFont(o.size || 32, o.fam || 'mono', o.weight || 400);`;
  if (!s.includes(old)) throw new Error('text fn head not found');
  const neu = `  // 字阶：小字号只有三档（15/18/26），字距跟着档位走 —— 避免 15~26 之间五花八门的设置
  function snapSize(sz) {
    if (sz == null) return 32;
    if (sz <= 16) return 15;
    if (sz <= 22) return 18;
    if (sz <= 30) return 26;
    return sz;
  }
  function snapLS(sz, ls) {
    if (ls == null) return null;
    if (sz <= 16) return 4;
    if (sz <= 22) return 3;
    if (sz <= 30) return 2;
    return ls;
  }

  function text(str, x, y, opts) {
    const o = opts || {};
    const sz = snapSize(o.size);
    setFont(sz, o.fam || 'mono', o.weight || 400);`;
  s = s.replace(old, neu);

  const oldLS = `    if (o.letterSpacing) ctx.letterSpacing = o.letterSpacing + 'px';`;
  if (!s.includes(oldLS)) throw new Error('letterSpacing line not found');
  s = s.replace(oldLS, `    const _ls = snapLS(sz, o.letterSpacing);
    if (_ls) ctx.letterSpacing = _ls + 'px';`);
  fs.writeFileSync(p, s);
  console.log('core.js ok');
}
