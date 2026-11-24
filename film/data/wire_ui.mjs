// 接入 ui.js：index.html 加载 + shotfilm 用 UI.chrome / UI.hud 取代旧 K.hud
import fs from 'fs';
const root = 'E:/新建文件夹/实习/MV/';

// ---------- index.html ----------
const ph = root + 'film/index.html';
let h = fs.readFileSync(ph, 'utf8');
if (h.includes('src/ui.js')) {
  console.log('index.html already has ui.js');
} else {
  const anchor = '<script src="src/photo.js"></script>';
  if (!h.includes(anchor)) throw new Error('photo.js script tag not found');
  h = h.replace(anchor, anchor + '\n<script src="src/ui.js"></script>');
  fs.writeFileSync(ph, h);
  console.log('index.html patched');
}

// ---------- shotfilm.js ----------
const ps = root + 'film/src/shotfilm.js';
let s = fs.readFileSync(ps, 'utf8');

// 1) 传入 yellowK 给 hud，并把 K.hud 换成 UI 的 chrome + hud
const oldBlock = /      const yk = yellowKAt\(plan, t - shot\.t\);[\s\S]*?K\.hud\(t, hudPal, \{\}\);/;
if (!oldBlock.test(s)) throw new Error('hud block not found');
const newBlock = `      const yk = yellowKAt(plan, t - shot.t);
      const hudPal = yk <= 0.001 ? pal : {
        bg: pal.bg,
        ink: mixHex(pal.ink, pal.bg, yk),
        dim: mixHex(pal.dim, '#111008', yk),
        line: mixHex(pal.line, '#6b5a0d', yk),
        accent: mixHex(pal.accent, pal.bg, yk),
      };
      if (window.UI) {
        UI.chrome({ pal: hudPal, sec, shot, t, local: t - shot.t });
        UI.hud({ pal: hudPal, sec, shot, t, local: t - shot.t, yellowK: yk });
      } else {
        K.hud(t, hudPal, {});
      }`;
s = s.replace(oldBlock, newBlock);
fs.writeFileSync(ps, s);
console.log('shotfilm.js patched', s.length);
