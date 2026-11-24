// 1) 黄底镜头的 HUD 换深色（#51 / #78 全屏马牌黄时，亮灰 HUD 对比度不足）
//    HUD 颜色按镜头内「黄度」k 与深色混合，与背景黄同时过渡
// 2) 把 PLAN 里的照片槽位号对齐 docs/IMAGE_PROMPTS.md 的 8 槽位编号
//    P01 桌面 / P02 断面 / P03 混炼 / P04 产线 / P05 黄昏路 / P06 旧纸 / P07 空白工牌 / P08 马牌招牌
import fs from 'fs';
const root = 'E:/新建文件夹/实习/MV/';

// ---------- 1. shotfilm.js ----------
const p1 = root + 'film/src/shotfilm.js';
let s = fs.readFileSync(p1, 'utf8');

// 1a. 注入 mixHex / yellowKAt 助手
const anchorHelper = `  const ANCIENT_SECS = new Set([1, 2, 4, 8]);`;
if (!s.includes(anchorHelper)) throw new Error('ANCIENT_SECS anchor not found');
const helper = `  const ANCIENT_SECS = new Set([1, 2, 4, 8]);

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
  }`;
s = s.replace(anchorHelper, helper);

// 1b. draw() 里用混合后的 HUD 调色板
const oldHud = `      K.hud(t, pal, {});`;
if (!s.includes(oldHud)) throw new Error('hud call not found');
const newHud = `      const yk = yellowKAt(plan, t - shot.t);
      const hudPal = yk <= 0.001 ? pal : {
        bg: pal.bg,
        ink: mixHex(pal.ink, pal.bg, yk),
        dim: mixHex(pal.dim, '#111008', yk),
        line: mixHex(pal.line, '#6b5a0d', yk),
        accent: mixHex(pal.accent, pal.bg, yk),
      };
      K.hud(t, hudPal, {});`;
s = s.replace(oldHud, newHud);
fs.writeFileSync(p1, s);
console.log('shotfilm.js ok', s.length);

// ---------- 2. PLAN 照片槽位号重映射 ----------
let t2 = s;
const remap = [
  [`66: { k: 'processFlow', p: { photo: 'P02' } }`, `66: { k: 'processFlow', p: { photo: 'P04' } }`],
  [`70: { k: 'chartGrow', p: { bars: 9, line: true, title: '生产制造 · 大有文章', note: '数据护航', seed: 29, photo: 'P02' } }`,
   `70: { k: 'chartGrow', p: { bars: 9, line: true, title: '生产制造 · 大有文章', note: '数据护航', seed: 29, photo: 'P04' } }`],
  [`logo: 'P04', en: false }`, `logo: 'P08', en: false }`],
  [`photo: 'P03', photoAlpha: 0.72, photoScrim: 0.46, horizon: true, logo: 'P04' }`,
   `photo: 'P05', photoAlpha: 0.72, photoScrim: 0.46, horizon: true, logo: 'P08' }`],
];
for (const [a, b] of remap) {
  if (!t2.includes(a)) throw new Error('remap target not found: ' + a.slice(0, 60));
  t2 = t2.replace(a, b);
}
fs.writeFileSync(p1, t2);
console.log('PLAN remapped', t2.length);
