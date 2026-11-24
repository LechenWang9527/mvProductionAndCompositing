// patch_tail_slow.mjs —— 片尾节奏放慢：合并 #81+#82、#86+#87，lastLamp 先扫光再收拢
import fs from 'fs';

// ---------- 1) shotfilm.js：RETIME 覆盖层 ----------
const SF = 'E:/新建文件夹/实习/MV/film/src/shotfilm.js';
let sf = fs.readFileSync(SF, 'utf8');

if (!sf.includes('TAIL_RETIME')) {
  const anchor = `  const ANCIENT_SECS = new Set([1, 2, 4, 8]);`;
  if (!sf.includes(anchor)) throw new Error('ANCIENT_SECS anchor not found');
  const add = `${anchor}

  // TAIL_RETIME —— 用户要求：结尾切镜不要太快。只动画面调度，不动音频/歌词/总时长。
  // 合并 81+82（12 格工牌点亮 + 光晕 → 一口气 3.1 s）；合并 86+87（12 张工牌扫光 + 收拢打字 → 6.88 s 缓收）。
  {
    const i81 = SHOTS.findIndex((s) => s.n === 81);
    const i82 = SHOTS.findIndex((s) => s.n === 82);
    if (i81 >= 0 && i82 >= 0) {
      SHOTS[i81].dur = SHOTS[i82].t + SHOTS[i82].dur - SHOTS[i81].t;   // 1.5+1.6 → 3.10
      SHOTS.splice(i82, 1);
    }
    const i86 = SHOTS.findIndex((s) => s.n === 86);
    const i87 = SHOTS.findIndex((s) => s.n === 87);
    if (i86 >= 0 && i87 >= 0) {
      SHOTS[i86].dur = SHOTS[i87].t + SHOTS[i87].dur - SHOTS[i86].t;   // 1.5+5.5 → 6.88
      SHOTS.splice(i87, 1);
    }
    // 升序断言：shotAt() 二分依赖升序
    for (let i = 1; i < SHOTS.length; i++) {
      if (SHOTS[i].t < SHOTS[i - 1].t) throw new Error('TAIL_RETIME: shots out of order at ' + i);
    }
    console.log('[tail-retime] shots:', SHOTS.length, '#81 dur', SHOTS.find((s) => s.n === 81)?.dur.toFixed(2), '#86 dur', SHOTS.find((s) => s.n === 86)?.dur.toFixed(2));
  }`;
  sf = sf.replace(anchor, add);

  // PLAN：81 用 halo 版（点亮+光晕一镜到底），86 改 lastLamp 带扫光参数
  const p81 = `    81: { k: 'badgeGrid12b', p: {} },`;
  if (!sf.includes(p81)) throw new Error('PLAN 81 not found');
  sf = sf.replace(p81, `    81: { k: 'badgeGridHalo2', p: { lySize: 54 } },`);
  const p86 = `    86: { k: 'badgeSweep', p: {} },`;
  if (!sf.includes(p86)) throw new Error('PLAN 86 not found');
  sf = sf.replace(p86, `    86: { k: 'lastLamp', p: { sweep: 1.05 } },  // TAIL_RETIME: 扫光→收拢→打字`);
  fs.writeFileSync(SF, sf, 'utf8');
  console.log('shotfilm: retime + PLAN done');
} else {
  console.log('shotfilm: already patched');
}

// ---------- 2) layouts2.js：lastLamp 支持 sweep/collapseAt/typeAt/per/dimAt ----------
const L2 = 'E:/新建文件夹/实习/MV/film/src/layouts2.js';
let l2 = fs.readFileSync(L2, 'utf8');

// 2a. 收拢阶段起算点：有 sweep 时 local 要减掉扫光时长
const OLD_K = `    // ---- 0 → 1.2 s：12 张牌向中心收成 1 方块 ----
    const k = ease.io(clamp(c.local / 1.2, 0, 1));`;
const NEW_K = `    // ---- 收拢：12 张牌向中心收成 1 方块 ----
    // TAIL_RETIME：p.sweep>0 时先扫光（sweep 秒），收拢从 sweep 之后才开始
    const SWEEP = c.p && c.p.sweep ? c.p.sweep : 0;
    const collapseLocal = c.local - SWEEP;              // 收拢阶段自己的时钟
    const collapseDur = 1.2;
    const k = SWEEP > 0
      ? (collapseLocal <= 0 ? 0 : ease.io(clamp(collapseLocal / collapseDur, 0, 1)))
      : ease.io(clamp(c.local / 1.2, 0, 1));`;
if (!l2.includes(OLD_K)) throw new Error('collapse block not found');
l2 = l2.replace(OLD_K, NEW_K);

// 2b. 扫光阶段：SWEEP>0 且 collapseLocal<=0 时画「12 张工牌由左到右逐个点亮」
const OLD_DIM = `    // ---- 305.0 后压暗其它元素（在方块之前画，方块保持 100%）----
    const dimK = clamp((c.t - (c.shot.t + 4.6)) / 0.4, 0, 1);`;
const NEW_DIM = `    // ---- TAIL_RETIME：扫光阶段（sweep 内先逐张点亮 12 张工牌）----
    if (SWEEP > 0 && collapseLocal <= 0) {
      const poll = SWEEP / 13;                          // 12 张 + 1 空拍
      const cols2 = 4, cw2 = 210, ch2 = 132, pad2 = 20;
      const gx2 = cx - (cw2 * cols2 + pad2 * 3) / 2;
      const gy2 = cy - (ch2 * 3 + pad2 * 2) / 2;
      for (let i = 0; i < 12; i++) {
        const r2 = (i / cols2) | 0, col2 = i % cols2;
        const x2 = gx2 + col2 * (cw2 + pad2), y2 = gy2 + r2 * (ch2 + pad2);
        const at = i * poll;
        const sk = ease.out(clamp((c.local - at) / (poll * 0.7), 0, 1));
        if (sk <= 0) continue;
        ctx.save();
        ctx.globalAlpha = 0.28 + 0.55 * sk;
        ctx.strokeStyle = pal.accent;
        ctx.lineWidth = 1 + sk;
        ctx.strokeRect(x2 + 0.5, y2 + 0.5, cw2, ch2);
        ctx.globalAlpha = 0.06 * sk;
        ctx.fillStyle = pal.accent;
        ctx.fillRect(x2, y2, cw2, ch2);
        ctx.globalAlpha = 0.6 * sk;
        ctx.fillStyle = pal.accent;
        ctx.fillRect(x2 + cw2 / 2 - 4, y2 + ch2 / 2 - 4, 8, 8);   // 灯点亮
        ctx.restore();
      }
      ctx.save();
      ctx.globalAlpha = 0.5;
      text('LIGHT TEST · 逐位点亮', M, 148, { size: 19, fam: 'mono', color: pal.dim, letterSpacing: 5 });
      ctx.restore();
      lyric(lineAt(c.t), c.t, pal, { y: H - 150, size: 48, active: pal.accent, accent: pal.accent });
      shotTag(c);
      fadeEdges(c);
      return;                                             // 扫光阶段到此为止，不画收拢
    }

    // ---- 压暗其它元素（在方块之前画，方块保持 100%）----
    const dimAt = (c.p && c.p.dimAt != null) ? c.p.dimAt : 4.6;
    const dimK = clamp((c.local - dimAt) / 0.4, 0, 1);`;
if (!l2.includes(OLD_DIM)) throw new Error('dim block not found');
l2 = l2.replace(OLD_DIM, NEW_DIM);

// 2c. 打字起点/per 走参数：sweep 时 t0 = shot.t + sweep + collapseDur + 0.9
const OLD_T0 = `      const lines = ['灯位 0001', '常亮', 'UPTIME 1001 Y'];
      const t0 = c.shot.t + 2.15;
      const per = 0.116;`;
const NEW_T0 = `      const lines = ['灯位 0001', '常亮', 'UPTIME 1001 Y'];
      const typeAt = (c.p && c.p.typeAt != null) ? c.p.typeAt : 2.15;
      const per = (c.p && c.p.per != null) ? c.p.per : 0.116;
      const t0 = c.shot.t + typeAt;`;
if (!l2.includes(OLD_T0)) throw new Error('typing block not found');
l2 = l2.replace(OLD_T0, NEW_T0);

fs.writeFileSync(L2, l2, 'utf8');
console.log('layouts2: lastLamp sweep/collapse/type params done');

// ---------- 3) 断言：sweep 时的 typeAt 默认应该约等于 sweep+collapse+0.9 ----------
// （由 PLAN 侧显式给 typeAt，避免漂移；这里只提示）
console.log('NOTE: for shot 86 set p:{sweep:1.05, typeAt:3.35, dimAt:6.4} in shotfilm PLAN for full slow pacing');
