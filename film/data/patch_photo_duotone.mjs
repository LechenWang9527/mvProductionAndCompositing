// 修 photo.js 的双色调：multiply+screen 把所有像素压进 0.52–0.54 的窄带（实测 std 25→9.5），
// 任何照片进去都变成一块发灰的板 —— 这才是「质感不行」的主因。
// 改成逐像素三档 lerp + 阶调量化（印刷感），保留完整明暗层次。
import fs from 'fs';
const p = 'E:/新建文件夹/实习/MV/film/src/photo.js';
let s = fs.readFileSync(p, 'utf8');

const A = s.indexOf('    // 2) 灰度 + 提高对比');
const B = s.indexOf('    // 5) 纸纹 / 颗粒');
if (A < 0 || B < 0) throw new Error('photo duotone block anchors not found');

const NEW = `    // 2) 灰度（对比别拉太狠，留给后面的阶调量化）
    g.filter = 'grayscale(1) contrast(1.10) brightness(1.0)';
    g.drawImage(img, sx, sy, sw, sh, 0, 0, cw, ch);
    g.filter = 'none';

    // 3) 三档双色调（真·明暗映射）：暗 → ink / 中 → mid / 亮 → paper
    //    旧做法 multiply + screen 会把所有像素压进 0.52–0.54 的窄带（std 25→9.5），
    //    结果就是一块发灰的板。这里逐像素 lerp，并做阶调量化 —— 量化才是「印刷感」的来源。
    const _rgb = (hx) => [parseInt(hx.slice(1, 3), 16), parseInt(hx.slice(3, 5), 16), parseInt(hx.slice(5, 7), 16)];
    const C_INK = _rgb(T.ink), C_MID = _rgb(T.mid || T.ink), C_PAPER = _rgb(T.paper);
    const cid = g.getImageData(0, 0, cw, ch);
    const cd = cid.data;
    const LEVELS = 7;                       // 7 档：接近丝网印，再少就丢细节，再多就「太真实」
    const DEN = LEVELS - 1;
    for (let i = 0; i < cd.length; i += 4) {
      let v = cd[i] / 255;
      v = clamp((v - 0.5) * 1.10 + 0.5, 0, 1);
      v = Math.round(v * DEN) / DEN;
      let r, gg, b;
      if (v < 0.5) {
        const t = v / 0.5;
        r = C_INK[0] + (C_MID[0] - C_INK[0]) * t;
        gg = C_INK[1] + (C_MID[1] - C_INK[1]) * t;
        b = C_INK[2] + (C_MID[2] - C_INK[2]) * t;
      } else {
        const t = (v - 0.5) / 0.5;
        r = C_MID[0] + (C_PAPER[0] - C_MID[0]) * t;
        gg = C_MID[1] + (C_PAPER[1] - C_MID[1]) * t;
        b = C_MID[2] + (C_PAPER[2] - C_MID[2]) * t;
      }
      cd[i] = r; cd[i + 1] = gg; cd[i + 2] = b; cd[i + 3] = 255;
    }
    g.putImageData(cid, 0, 0);

    // 4) 半调网点：只作纹理，别再把调子压死（alpha 比旧版轻）
    const small = makeCanvas(Math.round(cw / 6), Math.round(ch / 6));
    const sg = small.getContext('2d');
    sg.drawImage(c, 0, 0, small.width, small.height);
    const sd = sg.getImageData(0, 0, small.width, small.height).data;
    g.save();
    g.fillStyle = T.ink;
    const step = 5;
    for (let y = 0; y < ch; y += step) {
      for (let x = 0; x < cw; x += step) {
        const px = Math.min(small.width - 1, (x / cw * small.width) | 0);
        const py = Math.min(small.height - 1, (y / ch * small.height) | 0);
        const v = sd[(py * small.width + px) * 4] / 255;
        const k = clamp(1 - v, 0, 1);
        if (k < 0.16) continue;
        g.globalAlpha = 0.05 + k * 0.16;
        g.beginPath();
        g.arc(x, y, 2.0 * (0.45 + k), 0, Math.PI * 2);
        g.fill();
      }
    }
    g.restore();

`;
s = s.slice(0, A) + NEW + s.slice(B);
fs.writeFileSync(p, s);
console.log('photo.js duotone rewritten', s.length);
