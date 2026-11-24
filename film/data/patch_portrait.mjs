// 1) photo.js 新增 portrait()：有照片就压风格化照片，没有就画「空框 + 两个字」
// 2) badgePerson 的剪影换成这张空框
import fs from 'fs';
const P = 'E:/新建文件夹/实习/MV/film/src/photo.js';
const L = 'E:/新建文件夹/实习/MV/film/src/layouts.js';

// ---------- photo.js ----------
let s = fs.readFileSync(P, 'utf8');
if (s.includes('function portrait(')) {
  console.log('portrait already present');
} else {
  const anchor = '  function plate(id, x, y, w, h, opts) {';
  if (!s.includes(anchor)) throw new Error('plate anchor not found');

  const fn = `  /**
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

`;
  s = s.replace(anchor, fn + anchor);
  s = s.replace(`  window.PHOTO = {
    load, plate, has, gray, bg,`,
    `  window.PHOTO = {
    load, plate, has, gray, bg, portrait,`);
  s = s.replace(`  const PHOTOS = {};`, `  const PHOTOS = {};\n  const PEOPLE = {};`);
  // load() 里补 people 目录的加载
  const loadAnchor = `      for (const item of list) {`;
  if (s.includes(loadAnchor)) {
    s = s.replace(`    if (!MANIFEST.length) return;`, `    if (!MANIFEST.length) return;`);
  }
  fs.writeFileSync(P, s);
  console.log('photo.js portrait added');
}

// ---------- layouts.js: badgePerson 剪影 → 空框 ----------
let t = fs.readFileSync(L, 'utf8');
const oldBlock = `    // 剪影（无脸）
    ctx.globalAlpha = k * 0.45;
    ctx.fillStyle = c.pal.dim;
    ctx.beginPath();
    ctx.arc(cx + cw - 170, cy + 180, 62, Math.PI, 0);
    ctx.lineTo(cx + cw - 60, cy + 330);
    ctx.lineTo(cx + cw - 280, cy + 330);
    ctx.closePath();
    ctx.fill();
    ctx.restore();`;
const newBlock = `    ctx.restore();
    // 人像位：有照片压照片，没有就是「空框 + 两个字」
    if (window.PHOTO && window.PHOTO.portrait) {
      window.PHOTO.portrait(cx + cw - 320, cy + 96, 250, 310, {
        tone: 'dark',
        alpha: k,
        label: p.photoLabel || '待补',
        tag: p.badgeTag || 'ID PHOTO',
      });
    } else {
      ctx.save();
      ctx.globalAlpha = k * 0.45;
      ctx.fillStyle = c.pal.dim;
      ctx.beginPath();
      ctx.arc(cx + cw - 170, cy + 180, 62, Math.PI, 0);
      ctx.lineTo(cx + cw - 60, cy + 330);
      ctx.lineTo(cx + cw - 280, cy + 330);
      ctx.closePath();
      ctx.fill();
      ctx.restore();
    }`;
if (!t.includes(oldBlock)) throw new Error('badgePerson silhouette block not found');
t = t.replace(oldBlock, newBlock);
fs.writeFileSync(L, t);
console.log('badgePerson portrait slot wired');
