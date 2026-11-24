// 修双色调极性：TONES.dark 的 paper 是近黑、ink 是骨白，与 ancient（paper 亮、ink 暗）相反，
// 直接「暗→ink、亮→paper」会把深色段的反相（天空变白、灯变黑）。
// 改成：按三色的实际亮度排序，暗端→最暗色、中间→mid、亮端→最亮色，两套调色板都正确。
import fs from 'fs';
const p = 'E:/新建文件夹/实习/MV/film/src/photo.js';
let s = fs.readFileSync(p, 'utf8');

const A = s.indexOf('    const _rgb = (hx) =>');
const B = s.indexOf('    g.putImageData(cid, 0, 0);');
if (A < 0 || B < 0) throw new Error('duotone ramp anchors not found');

const NEW = `    const _rgb = (hx) => [parseInt(hx.slice(1, 3), 16), parseInt(hx.slice(3, 5), 16), parseInt(hx.slice(5, 7), 16)];
    const _lum = (c) => (0.2126 * c[0] + 0.7152 * c[1] + 0.0722 * c[2]) / 255;
    const _cPaper = _rgb(T.paper), _cInk = _rgb(T.ink), _cMid = _rgb(T.mid || T.paper);
    // 按亮度排序：dark → mid → light（dark 段 paper 近黑、ancient 段 paper 是纸色，方向相反）
    const _ramp = [_cPaper, _cInk, _cMid].sort((a, b) => _lum(a) - _lum(b));
    const C_DARK = _ramp[0], C_MID = _ramp[1], C_LIGHT = _ramp[2];
    const cid = g.getImageData(0, 0, cw, ch);
    const cd = cid.data;
    const LEVELS = 5;                       // 5 档：丝网印/凸版的阶调，再少丢细节、再多就「太真实」
    const DEN = LEVELS - 1;
    for (let i = 0; i < cd.length; i += 4) {
      let v = cd[i] / 255;
      v = clamp((v - 0.5) * 1.10 + 0.5, 0, 1);
      v = Math.round(v * DEN) / DEN;
      let r, gg, b;
      if (v < 0.5) {
        const t = v / 0.5;
        r = C_DARK[0] + (C_MID[0] - C_DARK[0]) * t;
        gg = C_DARK[1] + (C_MID[1] - C_DARK[1]) * t;
        b = C_DARK[2] + (C_MID[2] - C_DARK[2]) * t;
      } else {
        const t = (v - 0.5) / 0.5;
        r = C_MID[0] + (C_LIGHT[0] - C_MID[0]) * t;
        gg = C_MID[1] + (C_LIGHT[1] - C_MID[1]) * t;
        b = C_MID[2] + (C_LIGHT[2] - C_MID[2]) * t;
      }
      cd[i] = r; cd[i + 1] = gg; cd[i + 2] = b; cd[i + 3] = 255;
    }
`;
s = s.slice(0, A) + NEW + s.slice(B);
fs.writeFileSync(p, s);
console.log('photo.js polarity fixed');
