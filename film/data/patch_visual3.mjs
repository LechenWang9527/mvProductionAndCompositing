// 视觉补丁 3：把「浅底」识别打通到 chrome/hud
//  a) ui.js：强调色随底色亮度自适应（深底用 pal.accent，浅底用深墨或朱红）
//  b) shotfilm.js：古代段也走 UI.chrome/UI.hud，并传 lightBg
import fs from 'fs';
const root = 'E:/新建文件夹/实习/MV/';

// ---------- a) ui.js：亮度 + 自适应强调色 ----------
{
  const p = root + 'film/src/ui.js';
  let s = fs.readFileSync(p, 'utf8');
  const anchor = `  // ---------- 基础线件 ----------`;
  if (!s.includes(anchor)) throw new Error('ui anchor not found');
  const add = `  // 颜色亮度（0 黑 → 1 白），用来判断「底色是纸还是墨」
  function lumOf(hex) {
    if (!hex || hex.charAt(0) !== '#') return 0.5;
    const r = parseInt(hex.slice(1, 3), 16) / 255;
    const g = parseInt(hex.slice(3, 5), 16) / 255;
    const b = parseInt(hex.slice(5, 7), 16) / 255;
    return 0.2126 * r + 0.7152 * g + 0.0722 * b;
  }
  // 强调色：底色亮 → 用该调色板的墨色；底色暗 → 用它的强调色
  function accentFor(pal, light) {
    if (!pal) return '#c8a24a';
    return light ? (lumOf(pal.ink) < 0.35 ? pal.ink : pal.accent) : pal.accent;
  }

`;
  s = s.replace(anchor, add + anchor);
  // 替换 chrome/hud 里的强调色取值
  s = s.replace(`const acc = light ? pal.bg : pal.accent;    // 纸/黄底上，强调色用深色更清楚`,
    `const acc = accentFor(pal, light);   // 纸/黄底上换深墨，暗底上用原强调色`);
  s = s.replace(`const acc = light ? pal.bg : pal.accent;`, `const acc = accentFor(pal, light);`);
  // 导出
  s = s.replace(`  window.UI = {`, `  window.UI = {\n    lumOf, accentFor,`);
  fs.writeFileSync(p, s);
  console.log('ui.js ok', s.includes('accentFor(pal, light)'), s.includes('lumOf, accentFor,'));
}

// ---------- b) shotfilm.js ----------
{
  const p = root + 'film/src/shotfilm.js';
  let s = fs.readFileSync(p, 'utf8');
  const old = s.slice(s.indexOf('    // 系统 HUD：古代段换成纸上批注'), s.indexOf('    // 后期：暗角 / 颗粒 / 扫描线 + 段界黑场'));
  if (!old) throw new Error('hud block not found');
  const neu = `    // 系统 HUD：仪表框全片统一，但浅底（纸面 / 黄底）要换深墨
    {
      const ank = ANCIENT_SECS.has(sec.index);
      const yk = yellowKAt(plan, t - shot.t);
      const paperPlan = !!(plan.p && (plan.p.paper || plan.p.onPaper));
      // 浅底判定：古代段纸面 / 版式显式声明纸面 / 黄底已铺满过半
      const lightBg = ank || paperPlan || yk > 0.45;
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

`;
  s = s.replace(old, neu);
  fs.writeFileSync(p, s);
  console.log('shotfilm.js ok');
}

// ---------- c) ui.js：hud 支持 brand 覆盖 ----------
{
  const p = root + 'film/src/ui.js';
  let s = fs.readFileSync(p, 'utf8');
  const old = `    meta('THE OGS', 120, 72, { color: ink, alpha: light ? 0.8 : 0.85, size: T.meta, ls: 4 });
    micro('过来人档案系统', 120 + 122, 72, { color: ink, alpha: light ? 0.45 : 0.4, size: T.micro });`;
  if (!s.includes(old)) throw new Error('hud brand block not found');
  const neu = `    const brand = c.brand || 'THE OGS';
    const sub = c.brand ? 'THE OGS · 过来人档案系统' : '过来人档案系统';
    meta(brand, 120, 72, { color: ink, alpha: light ? 0.8 : 0.85, size: T.meta, ls: 4 });
    micro(sub, 120 + K.measure(brand, T.meta, 'mono') + 18, 72, { color: ink, alpha: light ? 0.45 : 0.4, size: T.micro });`;
  s = s.replace(old, neu);
  fs.writeFileSync(p, s);
  console.log('ui.js hud brand ok');
}
