// patch_tail_slow2.mjs —— 收敛版：重写 lastLamp 支持 sweep/typeAt/dimAt + shotfilm 片尾合并
// 自包含（不依赖上一版 patch 的半成品状态），幂等可重跑。
import fs from 'fs';

// ============ 1) layouts2.js：整体重写 L.lastLamp ============
const L2 = 'E:/新建文件夹/实习/MV/film/src/layouts2.js';
let l2 = fs.readFileSync(L2, 'utf8');

const NEW_LASTLAMP = `  // 87：最后一格灯。TAIL_RETIME 版：
  // sweep>0 时：0→sweep 秒 12 张工牌由左到右逐张点亮（扫光），
  // 然后 sweep→sweep+1.2 收拢成 1 方块，typeAt 起逐字打出「灯位 0001 / 常亮 / UPTIME 1001 Y」，
  // dimAt 起其余元素压暗、只留方块，最后黑场收。
  L.lastLamp = function (c) {
    const pal = { bg: '#060607', ink: '#f2efe6', dim: '#7d7a72', line: '#26262a', accent: '#ffcc00' };
    const p = c.p || {};
    const sweep = p.sweep == null ? 0 : p.sweep;
    const collapseDur = 1.2;
    const collapseAt = p.collapseAt == null ? sweep : p.collapseAt;        // 收拢起点（镜头内秒）
    const typeAt = p.typeAt == null ? (sweep > 0 ? sweep + collapseDur + 0.9 : 2.15) : p.typeAt;
    const per = p.per == null ? 0.116 : p.per;
    const dimAt = p.dimAt == null ? (sweep > 0 ? sweep + 4.4 : 4.6) : p.dimAt;

    ctx.fillStyle = pal.bg;
    ctx.fillRect(0, 0, W, H);
    ctx.save();
    ctx.globalAlpha = 0.10;
    ctx.drawImage(K.halftone(W, H, 9, 2.0, '#22221f', 5), 0, 0, W, H);
    ctx.restore();

    const cx = W / 2, cy = H * 0.46;
    const cols = 4, N = 12;
    const pad = 20;
    const cw = 210, ch = 132;
    const gx = cx - (cw * cols + pad * 3) / 2;
    const gy = cy - (ch * 3 + pad * 2) / 2;

    // ---- 阶段 A：扫光（sweep>0 且 local < collapseAt）----
    if (sweep > 0 && c.local < collapseAt) {
      const poll = sweep / 13;
      for (let i = 0; i < N; i++) {
        const r = (i / cols) | 0, col = i % cols;
        const x = gx + col * (cw + pad), y = gy + r * (ch + pad);
        const at = i * poll;
        const sk = ease.out(clamp((c.local - at) / (poll * 0.7), 0, 1));
        if (sk <= 0) continue;
        ctx.save();
        ctx.globalAlpha = 0.28 + 0.55 * sk;
        ctx.strokeStyle = pal.accent;
        ctx.lineWidth = 1 + sk;
        ctx.strokeRect(x + 0.5, y + 0.5, cw, ch);
        ctx.globalAlpha = 0.06 * sk;
        ctx.fillStyle = pal.accent;
        ctx.fillRect(x, y, cw, ch);
        ctx.globalAlpha = 0.6 * sk;
        ctx.fillRect(x + cw / 2 - 4, y + ch / 2 - 4, 8, 8);
        ctx.restore();
      }
      ctx.save();
      ctx.globalAlpha = 0.5;
      text('LIGHT TEST · 逐位点亮', M, 148, { size: 19, fam: 'mono', color: pal.dim, letterSpacing: 5 });
      ctx.restore();
      lyric(lineAt(c.t), c.t, pal, { y: H - 150, size: 48, active: pal.accent, accent: pal.accent });
      shotTag(c);
      fadeEdges(c);
      return;
    }

    // ---- 阶段 B：收拢（12 张 → 1 方块）----
    const cl = c.local - collapseAt;
    const k = ease.io(clamp(cl / collapseDur, 0, 1));
    if (k <= 0.985) {
      for (let i = 0; i < N; i++) {
        const r = (i / cols) | 0, col = i % cols;
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

    // ---- 压暗（在方块之前画，方块保持 100%）----
    const dimK = clamp((c.t - (c.shot.t + dimAt)) / 0.4, 0, 1);
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

      const lines = ['灯位 0001', '常亮', 'UPTIME 1001 Y'];
      const t0 = c.shot.t + typeAt;
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
      if (typing) {
        const tw = typedSoFar ? measure(typedSoFar, curSize, 'mono') : 0;
        ctx.globalAlpha = 0.85;
        ctx.fillStyle = pal.accent;
        ctx.fillRect(cx + tw / 2 + 10, curY - curSize * 0.74, 14, curSize * 0.86);
      }
      ctx.restore();
    }

    // ---- 底部歌词 ----
    ctx.save();
    ctx.globalAlpha = 1 - 0.55 * dimK;
    lyric(lineAt(c.t), c.t, pal, { y: H - 150, size: 48, active: pal.accent, accent: pal.accent });
    ctx.restore();
    shotTag(c);
    fadeEdges(c);
  };`;

// 定位旧 lastLamp：从 "  L.lastLamp = function (c) {" 到 "  };" 后接 window.LAYOUTS2_READY 的整块替换
const START = '  L.lastLamp = function (c) {';
const END_MARK = 'window.LAYOUTS2_READY = true;';
const si = l2.indexOf(START);
const ei = l2.indexOf(END_MARK);
if (si < 0 || ei < 0 || ei <= si) throw new Error(`lastLamp bounds not found si=${si} ei=${ei}`);
// 旧块结束于 END_MARK 之前最后一个 "};"——直接取 START 到 END_MARK 之间整段替换
l2 = l2.slice(0, si) + NEW_LASTLAMP + '\n\n  ' + l2.slice(ei);
fs.writeFileSync(L2, l2, 'utf8');
console.log('layouts2: lastLamp rewritten (sweep/collapse/type/dim)');

// ============ 2) shotfilm.js：RETIME 覆盖层 + PLAN 86 ============
const SF = 'E:/新建文件夹/实习/MV/film/src/shotfilm.js';
let sf = fs.readFileSync(SF, 'utf8');
if (!sf.includes('TAIL_RETIME')) {
  const anchor = '  const ANCIENT_SECS = new Set([1, 2, 4, 8]);';
  if (!sf.includes(anchor)) throw new Error('ANCIENT_SECS anchor not found');
  const add = `${anchor}

  // TAIL_RETIME —— 结尾切镜放慢（只动画面调度，不动音频/歌词/总时长）
  // 81+82 合并成一镜 3.10 s（badgeGridHalo2 本身先点亮再光晕，覆盖两段语义）
  // 86+87 合并成一镜 6.88 s（lastLamp：扫光 → 收拢 → 打字 → 压暗）
  {
    const i81 = SHOTS.findIndex((s) => s.n === 81);
    const i82 = SHOTS.findIndex((s) => s.n === 82);
    if (i81 >= 0 && i82 >= 0) {
      SHOTS[i81].dur = SHOTS[i82].t + SHOTS[i82].dur - SHOTS[i81].t;
      SHOTS.splice(i82, 1);
    }
    const i86 = SHOTS.findIndex((s) => s.n === 86);
    const i87 = SHOTS.findIndex((s) => s.n === 87);
    if (i86 >= 0 && i87 >= 0) {
      SHOTS[i86].dur = SHOTS[i87].t + SHOTS[i87].dur - SHOTS[i86].t;
      SHOTS.splice(i87, 1);
    }
    for (let i = 1; i < SHOTS.length; i++) {
      if (SHOTS[i].t < SHOTS[i - 1].t) throw new Error('TAIL_RETIME: shots out of order at ' + i);
    }
  }`;
  sf = sf.replace(anchor, add);
}
// PLAN 86 参数（幂等替换）
sf = sf.replace(
  /86: \{ k: 'lastLamp', p: \{[^}]*\} \},/,
  "86: { k: 'lastLamp', p: { sweep: 1.05, typeAt: 3.35, dimAt: 6.4 } },  // TAIL_RETIME: 扫光→收拢→打字→压暗",
);
// PLAN 81 用 halo 版
sf = sf.replace(
  /81: \{ k: '[^']+', p: \{[^}]*\} \},/,
  "81: { k: 'badgeGridHalo2', p: { lySize: 54 } },",
);
fs.writeFileSync(SF, sf, 'utf8');
console.log('shotfilm: retime overlay + PLAN86 params done');
console.log('86 line ->', (sf.match(/86: \{ k: 'lastLamp'.*/) || ['NOT FOUND'])[0]);
