// 按 STORYBOARD #87 重写 lastLamp：
//   5:00.4 起 5.5 s，12 张牌向中心收成 1 方块（1.2 s），
//   303.0 起方块内 mono 打「灯位 0001 / 常亮 / UPTIME 1001 Y」每 0.929 s 多 1 字，
//   305.0 后其余降到 30% 只留方块 100%，黑场收（6 帧）。
import fs from 'fs';
const p = 'E:/新建文件夹/实习/MV/film/src/layouts2.js';
let s = fs.readFileSync(p, 'utf8');

const start = s.indexOf('  L.lastLamp = function (c) {');
if (start < 0) throw new Error('lastLamp start not found');
const endMark = '  window.LAYOUTS2_READY = true;';
const end = s.indexOf(endMark);
if (end < 0) throw new Error('end marker not found');

const fresh = `  L.lastLamp = function (c) {
    const pal = { bg: '#060607', ink: '#f2efe6', dim: '#7d7a72', line: '#26262a', accent: '#ffcc00' };
    ctx.fillStyle = pal.bg;
    ctx.fillRect(0, 0, W, H);
    // 极淡底纹，避免纯黑死板
    ctx.save();
    ctx.globalAlpha = 0.10;
    ctx.drawImage(K.halftone(W, H, 9, 2.0, '#22221f', 5), 0, 0, W, H);
    ctx.restore();

    const cx = W / 2, cy = H * 0.47;
    const cols = 4, rows = 3, N = 12;
    const pad = 20;
    const cw = 210, ch = 132;
    const gx = cx - (cw * 4 + pad * 3) / 2;
    const gy = cy - (ch * 3 + pad * 2) / 2;

    // ---- 0 → 1.2 s：12 张牌向中心收成 1 方块 ----
    const k = ease.io(clamp(c.local / 1.2, 0, 1));
    for (let i = 0; i < N; i++) {
      const r = Math.floor(i / cols), col = i % cols;
      const x0 = gx + col * (cw + pad), y0 = gy + r * (ch + pad);
      // 每张牌向中心插值
      const x = x0 + (cx - cw / 2 - x0) * k;
      const y = y0 + (cy - ch / 2 - y0) * k;
      const w = cw + (260 - cw) * k;
      const h = ch + (160 - ch) * k;
      // 收拢阶段越来越实，收完只留中心一块
      const a = (1 - k) * (0.55 + 0.30 * Math.sin(i)) + k * (i === 0 ? 0.0 : 0.0);
      if (k > 0.985 && i > 0) continue;
      ctx.save();
      ctx.globalAlpha = k > 0.985 ? 0.0 : Math.max(0.06, a);
      ctx.strokeStyle = i === 0 ? pal.accent : pal.line;
      ctx.lineWidth = 1;
      ctx.strokeRect(x + 0.5, y + 0.5, w, h);
      ctx.globalAlpha *= 0.5;
      ctx.fillStyle = i === 0 ? 'rgba(255,204,0,0.10)' : 'rgba(255,255,255,0.03)';
      ctx.fillRect(x, y, w, h);
      ctx.restore();
    }

    // ---- 收成后的方块 ----
    if (k > 0.985) {
      const bx = cx - 130, by = cy - 80, bw = 260, bh = 160;
      ctx.save();
      ctx.fillStyle = 'rgba(255,204,0,0.10)';
      ctx.fillRect(bx, by, bw, bh);
      ctx.strokeStyle = pal.accent;
      ctx.lineWidth = 1.5;
      ctx.strokeRect(bx + 0.5, by + 0.5, bw, bh);
      // 四角刻线
      const t2 = 14;
      ctx.beginPath();
      ctx.moveTo(bx, by + t2); ctx.lineTo(bx, by); ctx.lineTo(bx + t2, by);
      ctx.moveTo(bx + bw - t2, by); ctx.lineTo(bx + bw, by); ctx.lineTo(bx + bw, by + t2);
      ctx.moveTo(bx + bw, by + bh - t2); ctx.lineTo(bx + bw, by + bh); ctx.lineTo(bx + bw - t2, by + bh);
      ctx.moveTo(bx + t2, by + bh); ctx.lineTo(bx, by + bh); ctx.lineTo(bx, by + bh - t2);
      ctx.stroke();
      ctx.restore();

      // ---- 方块内逐字打出 ----
      const lines = ['灯位 0001', '常亮', 'UPTIME 1001 Y'];
      const t0 = c.shot.t + 1.2 + 1.4;   // 303.0 附近开始
      let elapsed = Math.max(0, c.t - t0);
      const per = 0.929;                  // 每 0.929 s 多 1 字（= 1 拍）
      let budget = Math.floor(elapsed / per) + 1;
      ctx.save();
      ctx.textAlign = 'center';
      let yy = cy - 44;
      for (let li = 0; li < lines.length; li++) {
        const str = lines[li];
        const take = Math.max(0, Math.min(str.length, budget));
        budget -= take;
        if (take > 0) {
          const show = str.slice(0, take);
          text(show, cx, yy, {
            size: li === 0 ? 34 : 29, fam: 'mono',
            color: li === 0 ? pal.accent : pal.ink, align: 'center', letterSpacing: 4,
          });
          // 打字光标
          if (take < str.length) {
            const tw = measure(show, li === 0 ? 34 : 29, 'mono');
            ctx.fillStyle = pal.accent;
            ctx.globalAlpha = 0.8;
            ctx.fillRect(cx + tw / 2 + 6, yy - (li === 0 ? 26 : 22), 12, li === 0 ? 30 : 26);
          }
        }
        yy += li === 0 ? 52 : 46;
        if (budget <= 0) break;
      }
      ctx.restore();

      // 中心灯的暖光
      ctx.save();
      const lg = ctx.createRadialGradient(cx, cy, 8, cx, cy, 520);
      lg.addColorStop(0, 'rgba(255,204,0,0.16)');
      lg.addColorStop(1, 'rgba(255,204,0,0)');
      ctx.fillStyle = lg;
      ctx.fillRect(0, 0, W, H);
      ctx.restore();
    }

    // ---- 305.0 后其余元素降到 30%：整体压暗一层 ----
    const dimK = clamp((c.t - (c.shot.t + 5.0)) / 0.4, 0, 1);
    if (dimK > 0) {
      ctx.save();
      ctx.globalAlpha = 0.55 * dimK;
      ctx.fillStyle = '#000';
      ctx.fillRect(0, 0, W, H);
      ctx.restore();
    }

    // ---- 底部歌词（靠后时同样被压暗）----
    ctx.save();
    ctx.globalAlpha = 1 - 0.5 * dimK;
    lyric(lineAt(c.t), c.t, pal, { y: H - 150, size: 48, active: pal.accent, accent: pal.accent });
    ctx.restore();
    shotTag(c);
    fadeEdges(c);
  };

`;
s = s.slice(0, start) + fresh + s.slice(end);
fs.writeFileSync(p, s);
console.log('lastLamp rewritten, bytes', s.length);
