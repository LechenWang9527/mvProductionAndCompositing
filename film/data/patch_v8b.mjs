// lastLamp 第二次修：打字速度改成与全片一致的 0.116 s/字（原 0.929 s/字在 5.5 s 内打不完 22 个字），
// 压暗层移到方块之前，保证「只留方块 100%」，并把方块放大到 420×210 容纳三行。
import fs from 'fs';
const p = 'E:/新建文件夹/实习/MV/film/src/layouts2.js';
let s = fs.readFileSync(p, 'utf8');

const start = s.indexOf('  L.lastLamp = function (c) {');
const end = s.indexOf('  window.LAYOUTS2_READY = true;');
if (start < 0 || end < 0) throw new Error('anchors not found');

const fresh = `  L.lastLamp = function (c) {
    const pal = { bg: '#060607', ink: '#f2efe6', dim: '#7d7a72', line: '#26262a', accent: '#ffcc00' };
    ctx.fillStyle = pal.bg;
    ctx.fillRect(0, 0, W, H);
    ctx.save();
    ctx.globalAlpha = 0.10;
    ctx.drawImage(K.halftone(W, H, 9, 2.0, '#22221f', 5), 0, 0, W, H);
    ctx.restore();

    const cx = W / 2, cy = H * 0.46;
    const cols = 4, rows = 3, N = 12;
    const pad = 20;
    const cw = 210, ch = 132;
    const gx = cx - (cw * 4 + pad * 3) / 2;
    const gy = cy - (ch * 3 + pad * 2) / 2;

    // ---- 0 → 1.2 s：12 张牌向中心收成 1 方块 ----
    const k = ease.io(clamp(c.local / 1.2, 0, 1));
    if (k <= 0.985) {
      for (let i = 0; i < N; i++) {
        const r = Math.floor(i / cols), col = i % cols;
        const x0 = gx + col * (cw + pad), y0 = gy + r * (ch + pad);
        const x = x0 + (cx - cw / 2 - x0) * k;
        const y = y0 + (cy - ch / 2 - y0) * k;
        const w = cw + (120 - cw) * k;
        const h = ch + (90 - ch) * k;
        ctx.save();
        ctx.globalAlpha = (0.20 + 0.55 * Math.abs(Math.sin(i * 1.7))) * (1 - k * 0.55);
        ctx.strokeStyle = i === 0 ? pal.accent : pal.line;
        ctx.lineWidth = 1;
        ctx.strokeRect(x + 0.5, y + 0.5, w, h);
        ctx.globalAlpha *= 0.45;
        ctx.fillStyle = i === 0 ? 'rgba(255,204,0,0.10)' : 'rgba(255,255,255,0.03)';
        ctx.fillRect(x, y, w, h);
        ctx.restore();
      }
    }

    // ---- 305.0 后压暗其它元素（在方块之前画，方块保持 100%）----
    const dimK = clamp((c.t - (c.shot.t + 4.6)) / 0.4, 0, 1);
    if (dimK > 0 && k > 0.985) {
      ctx.save();
      ctx.globalAlpha = 0.62 * dimK;
      ctx.fillStyle = '#000';
      ctx.fillRect(0, 0, W, H);
      ctx.restore();
    }

    // ---- 方块 + 逐字打出 ----
    if (k > 0.985) {
      const bw = 420, bh = 210;
      const bx = cx - bw / 2, by = cy - bh / 2;

      const lg = ctx.createRadialGradient(cx, cy, 8, cx, cy, 560);
      lg.addColorStop(0, 'rgba(255,204,0,0.18)');
      lg.addColorStop(1, 'rgba(255,204,0,0)');
      ctx.save();
      ctx.fillStyle = lg;
      ctx.fillRect(0, 0, W, H);
      ctx.restore();

      ctx.save();
      ctx.fillStyle = 'rgba(255,204,0,0.10)';
      ctx.fillRect(bx, by, bw, bh);
      ctx.strokeStyle = pal.accent;
      ctx.lineWidth = 1.5;
      ctx.strokeRect(bx + 0.5, by + 0.5, bw, bh);
      const t2 = 16;
      ctx.beginPath();
      ctx.moveTo(bx, by + t2); ctx.lineTo(bx, by); ctx.lineTo(bx + t2, by);
      ctx.moveTo(bx + bw - t2, by); ctx.lineTo(bx + bw, by); ctx.lineTo(bx + bw, by + t2);
      ctx.moveTo(bx + bw, by + bh - t2); ctx.lineTo(bx + bw, by + bh); ctx.lineTo(bx + bw - t2, by + bh);
      ctx.moveTo(bx + t2, by + bh); ctx.lineTo(bx, by + bh); ctx.lineTo(bx, by + bh - t2);
      ctx.stroke();
      ctx.restore();

      // 三行共 22 字，0.116 s/字 从 302.55 起，约 305.1 打完
      const lines = ['灯位 0001', '常亮', 'UPTIME 1001 Y'];
      const t0 = c.shot.t + 2.15;
      const per = 0.116;
      let budget = c.t < t0 ? 0 : Math.floor((c.t - t0) / per);
      ctx.save();
      let yy = cy - 46;
      let curY = yy, curSize = 38, typing = false, typedSoFar = '';
      for (let li = 0; li < lines.length; li++) {
        const str = lines[li];
        const take = Math.max(0, Math.min(str.length, budget));
        budget -= take;
        const size = li === 0 ? 38 : 34;
        if (take > 0) {
          text(str.slice(0, take), cx, yy, {
            size, fam: 'mono',
            color: li === 0 ? pal.accent : pal.ink, align: 'center', letterSpacing: 4,
          });
        }
        if (take < str.length) {
          typing = true; curY = yy; curSize = size; typedSoFar = str.slice(0, take);
          break;
        }
        yy += li === 0 ? 56 : 50;
      }
      // 打字光标：跟在当前这一行已打出文字的右侧
      if (typing) {
        const tw = typedSoFar ? measure(typedSoFar, curSize, 'mono') : 0;
        ctx.globalAlpha = 0.85;
        ctx.fillStyle = pal.accent;
        ctx.fillRect(cx + tw / 2 + 10, curY - curSize * 0.74, 14, curSize * 0.86);
      }
      ctx.restore();
    }

    // ---- 底部歌词（被压暗层之后重画，但随 dimK 一起降）----
    ctx.save();
    ctx.globalAlpha = 1 - 0.55 * dimK;
    lyric(lineAt(c.t), c.t, pal, { y: H - 150, size: 48, active: pal.accent, accent: pal.accent });
    ctx.restore();
    shotTag(c);
    fadeEdges(c);
  };

`;
s = s.slice(0, start) + fresh + s.slice(end);
fs.writeFileSync(p, s);
console.log('lastLamp v2, bytes', s.length);
