// docs/external_deepseek/ancient_bridge/ancient_bridge.js
// 古代叙事「你也一样吧」现实对照桥接 —— 暖纸线描四段
// 依赖：window.K（只需 K.W / K.H / K.ctx / K.FONT）。向 window.LAYOUTS 注册：
//   bridgeKeys    #10 45.64–51.93   钥匙串 + 工牌
//   bridgeReceipt #11 51.93–60.05   结算清单三行 + 空白「自己」
//   bridgePhone   #23–#25 103.94–111.95  群聊 / 赞 / 扣手机
//   bridgeLedger  #29–#31 119.45–127.60  订单叠 + 账页记号 + 棋子
// 约定：画面是 t 的纯函数（绝对秒）；不覆盖 renderAt；不自绘字幕；
//       不写虚构房号/日期/金额/人名；y>=780 留给主工程固定双行字幕。

(function () {
  if (!window.K) throw new Error('ancient_bridge: window.K 未加载（先于 core.js 或适配层之后引入）');
  const K = window.K;
  const ctx = K.ctx, W = K.W, H = K.H;
  window.LAYOUTS = window.LAYOUTS || {};

  // ---------- 调色：暖纸 + 深棕线 + 少量朱砂 ----------
  const PAPER = '#e6dcc8', PAPER_HI = '#efe6d4', PAPER_DK = '#d2c5aa';
  const INK = '#211b14';            // 深棕主线条
  const DIM = '#6b5b45';            // 次级棕
  const FAINT = 'rgba(107,91,69,0.45)';
  const CINNA = '#a8402c';          // 朱砂（勾选/点睛，少量）
  const SUB_Y = 780;                // 主片字幕从 780 起

  // ---------- 工具 ----------
  function hash(n) {
    const x = Math.sin(n * 127.1 + 311.7) * 43758.5453;
    return x - Math.floor(x);
  }
  function seg(t, a, b) { return Math.min(1, Math.max(0, (t - a) / (b - a || 1e-9))); }
  function easeOut(x) { return 1 - Math.pow(1 - x, 3); }
  function easeIO(x) { return x < 0.5 ? 4 * x * x * x : 1 - Math.pow(-2 * x + 2, 3) / 2; }
  function j(seed, amp) { return (hash(seed) - 0.5) * 2 * (amp == null ? 1.3 : amp); }

  // 手绘感路径：给定折点，分段二次曲线 + 每点微抖（seed 固定 → 同 t 同抖动）
  function hand(pts, seed, amp) {
    ctx.beginPath();
    const p0 = pts[0];
    ctx.moveTo(p0[0] + j(seed * 3 + 1, amp), p0[1] + j(seed * 3 + 2, amp));
    for (let i = 1; i < pts.length; i++) {
      const px = pts[i - 1], p = pts[i];
      const cx = (px[0] + p[0]) / 2 + j(seed * 7 + i * 3, amp);
      const cy = (px[1] + p[1]) / 2 + j(seed * 7 + i * 3 + 1, amp);
      ctx.quadraticCurveTo(cx, cy, p[0] + j(seed * 5 + i * 3, amp), p[1] + j(seed * 5 + i * 3 + 1, amp));
    }
  }
  function stroke(pts, w, col, alpha, seed, amp) {
    ctx.save();
    ctx.globalAlpha *= (alpha == null ? 1 : alpha);
    ctx.strokeStyle = col || INK;
    ctx.lineWidth = w || 2.2;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
    hand(pts, seed || 1, amp);
    ctx.stroke();
    ctx.restore();
  }
  // 少量排线：给物件建立「墨面」，不用海量随机线
  function hatch(x, y, w, h, n, seed, col, alpha, slant) {
    ctx.save();
    ctx.globalAlpha *= (alpha == null ? 0.28 : alpha);
    ctx.strokeStyle = col || DIM;
    ctx.lineWidth = 1;
    for (let i = 0; i < n; i++) {
      const yy = y + (i + 0.5) * (h / n) + j(seed + i, 1);
      ctx.beginPath();
      ctx.moveTo(x + j(seed + i + 9, 0.8), yy);
      ctx.lineTo(x + w + (slant || 0) * (i % 2 ? 1 : -1) + j(seed + i + 5, 0.8), yy);
      ctx.stroke();
    }
    ctx.restore();
  }
  function fillSoft(x, y, w, h, col, alpha) {
    ctx.save(); ctx.globalAlpha *= (alpha == null ? 1 : alpha);
    ctx.fillStyle = col || PAPER_HI; ctx.fillRect(x, y, w, h); ctx.restore();
  }
  // 小字标签：字阶按主工程三档（15/18/26），不重复整句歌词
  function label(txt, x, y, o) {
    o = o || {};
    let sz = o.size || 18;
    sz = sz <= 16 ? 15 : (sz <= 22 ? 18 : 26);
    ctx.save();
    ctx.globalAlpha *= (o.alpha == null ? 1 : o.alpha);
    ctx.fillStyle = o.color || DIM;
    ctx.font = (o.weight || 400) + ' ' + sz + 'px ' + (K.FONT ? K.FONT.serif : 'serif');
    ctx.textAlign = o.align || 'left';
    if (o.ls) ctx.letterSpacing = o.ls + 'px';
    ctx.fillText(txt, x, y);
    ctx.restore();
  }
  // 暖纸底：与主工程 paperBg 同构；浅底判定由 window.__LIGHT 告知主工程
  function paper() {
    window.__LIGHT = true;
    const g = ctx.createLinearGradient(0, 0, 0, H);
    g.addColorStop(0, PAPER_HI);
    g.addColorStop(0.55, PAPER);
    g.addColorStop(1, PAPER_DK);
    ctx.fillStyle = g;
    ctx.fillRect(0, 0, W, H);
  }
  // 独立预览标签不进入主片；调用保留以便和源文件小幅同步。
  function swatch() {}
  // 桌面：一条深棕水平线 + 淡排线，线在 y>=720 之下、字幕之上
  function desk(y, alpha) {
    stroke([[140, y], [W - 140, y]], 2.4, INK, alpha, 91, 1.1);
    hatch(150, y + 6, W - 320, 26, 4, 92, DIM, alpha * 0.5, 3);
  }

  // ============================================================
  // A. bridgeKeys —— #10 45.64–51.93
  function drawKeys(t) {
    paper();
    const A = 45.64, T1 = 51.93;
    const out = 1 - seg(t, T1 - 0.12, T1);
    const PHOTO = window.PHOTO;
    if (!PHOTO || !PHOTO.has('KEYS_BADGE_LINE_V1')) return;

    // 同一张原图轻推并由左向右取景，保留钥匙、挂锁和工牌的完整比例。
    const zoom = 1.08;
    const pan = 76 - 152 * easeIO(seg(t, A, 48.25));
    ctx.save();
    ctx.translate(W / 2 + pan, H / 2);
    ctx.scale(zoom, zoom);
    ctx.translate(-W / 2, -H / 2);
    PHOTO.plate('KEYS_BADGE_LINE_V1', 0, 0, W, H, {
      raw: true, label: false, alpha: out
    });
    ctx.restore();
  }
  function roundRect(x, y, w, h, r) {
    ctx.beginPath();
    ctx.moveTo(x + r, y);
    ctx.arcTo(x + w, y, x + w, y + h, r);
    ctx.arcTo(x + w, y + h, x, y + h, r);
    ctx.arcTo(x, y + h, x, y, r);
    ctx.arcTo(x, y, x + w, y, r);
    ctx.closePath();
  }

  // ============================================================
  // B. bridgeReceipt —— #11 51.93–60.05
  function drawReceipt(t) {
    paper();
    const B = 51.93, T1 = 60.05;
    const out = 1 - seg(t, T1 - 0.12, T1);
    const ink = seg(t, B, B + 0.42);
    const RXc = 960, RYc = 462, RW = 760, RH = 530;
    const RX = RXc - RW / 2, RY = RYc - RH / 2;
    if (ink > 0) {
      ctx.save();
      ctx.globalAlpha *= out * easeOut(ink);
      fillSoft(RX + 7, RY + 9, RW, RH, 'rgba(33,27,20,0.10)');
      fillSoft(RX, RY, RW, RH, PAPER_HI);
      ctx.strokeStyle = INK; ctx.lineWidth = 2.4;
      ctx.strokeRect(RX + 0.5, RY + 0.5, RW, RH);
      ctx.strokeStyle = DIM; ctx.lineWidth = 1.1; ctx.globalAlpha *= 0.62;
      ctx.strokeRect(RX + 6.5, RY + 6.5, RW - 12, RH - 12);
      ctx.globalAlpha /= 0.62;

      label('金额示意', RX + RW - 40, RY + 46, {
        size: 15, color: FAINT, align: 'right'
      });

      const rows = [
        { label: '房贷', amount: '6,800', at: 51.93, seed: 81 },
        { label: '学费', amount: '2,400', at: 52.436, seed: 82 },
        { label: '爸妈体检', amount: '1,200', at: 52.815, seed: 83 },
      ];
      const rowX = RX + 82, rowY0 = RY + 78, rowDY = 86;
      const amountX = RX + RW - 54;
      rows.forEach(function (r, i) {
        const k = seg(t, r.at, r.at + 0.34);
        if (k <= 0) return;
        const y = rowY0 + i * rowDY;
        ctx.save();
        ctx.globalAlpha *= easeOut(k);
        label(r.label, rowX, y + 31, { size: 26, color: INK });
        label(r.amount, amountX, y + 31, {
          size: 26, color: INK, align: 'right'
        });
        stroke([[RX + 58, y + 52], [RX + RW - 58, y + 52]], 1.3, DIM, 0.55, r.seed, 0.6);

        const ckAt = [55.976, 56.229, 56.481][i];
        const ck = seg(t, ckAt, ckAt + 0.18);
        if (ck > 0) {
          ctx.save();
          ctx.globalAlpha *= ck;
          ctx.strokeStyle = CINNA; ctx.lineWidth = 3.2; ctx.lineCap = 'round';
          const cx = RX + 38, cy = y + 17, s = easeOut(ck);
          ctx.beginPath(); ctx.moveTo(cx - 8, cy + 3); ctx.lineTo(cx - 1, cy + 10 * s); ctx.stroke();
          if (ck > 0.5) {
            ctx.beginPath(); ctx.moveTo(cx - 1, cy + 10); ctx.lineTo(cx + 11 * s, cy - 9); ctx.stroke();
          }
          ctx.restore();
        }
        ctx.restore();
      });

      const selfAt = 57.24;
      const selfK = seg(t, selfAt, selfAt + 0.34);
      if (selfK > 0) {
        const y = rowY0 + 3 * rowDY;
        ctx.save();
        ctx.globalAlpha *= easeOut(selfK);
        ctx.setLineDash([7, 7]);
        ctx.strokeStyle = DIM; ctx.lineWidth = 1.5;
        ctx.strokeRect(RX + 58, y + 3, RW - 116, 48);
        ctx.setLineDash([]);
        label('自己', rowX, y + 34, { size: 26, color: INK });
        label('0', amountX, y + 34, { size: 26, color: INK, align: 'right' });
        ctx.restore();
      }

      const totalK = seg(t, 56.987, 57.22);
      if (totalK > 0) {
        ctx.save();
        ctx.globalAlpha *= easeOut(totalK);
        stroke([[RX + 58, RY + RH - 112], [RX + RW - 58, RY + RH - 112]], 1.8, INK, 0.72, 84, 0.6);
        label('合计', rowX, RY + RH - 70, { size: 26, color: INK, weight: 600 });
        label('10,400', amountX, RY + RH - 70, {
          size: 26, color: INK, weight: 600, align: 'right'
        });
        ctx.restore();
      }
      ctx.restore();
    }
  }
  // C. bridgePhone —— #23 103.94 → #25 111.95
  //    桌上手机：群聊 + 赞 → 侧缘轮廓翻转 → 扣下静止
  // ============================================================
  function drawPhone(t) {
    paper();
    const C = 103.94, T1 = 111.95, DOWN_AT = 109.553;
    const out = 1 - seg(t, T1 - 0.1, T1);
    const downK = easeIO(seg(t, DOWN_AT, DOWN_AT + 0.34));
    const PHOTO = window.PHOTO;
    ctx.save(); ctx.globalAlpha = out;

    desk(SUB_Y - 30, seg(t, C + 0.1, C + 0.5) * 0.9 * (1 - downK));

    const PW = 300, PH = 560, PX = 960 - PW / 2, PY = 470 - PH / 2;
    const frontA = 1 - downK;
    if (frontA > 0) {
      ctx.save();
      ctx.globalAlpha *= frontA;
      fillSoft(PX + 6, PY + 8, PW, PH, 'rgba(33,27,20,0.10)');
      fillSoft(PX, PY, PW, PH, PAPER_HI);
      ctx.strokeStyle = INK; ctx.lineWidth = 3;
      roundRect(PX, PY, PW, PH, 26); ctx.stroke();
      ctx.strokeStyle = DIM; ctx.lineWidth = 1.2; ctx.globalAlpha *= 0.75;
      roundRect(PX + 7, PY + 7, PW - 14, PH - 14, 20); ctx.stroke();
      ctx.globalAlpha /= 0.75;
      stroke([[PX + PW, PY + 120], [PX + PW + 7, PY + 122], [PX + PW + 7, PY + 152], [PX + PW, PY + 154]], 2.2, INK, 1, 61, 0.6);
      stroke([[PX + PW, PY + 180], [PX + PW + 7, PY + 182], [PX + PW + 7, PY + 204], [PX + PW, PY + 206]], 2.2, INK, 1, 62, 0.6);

      const bubbles = [
        { at: 105.19, txt: '上市', gold: true, x: PX + 40 },
        { at: 106.0, txt: '群消息 +1', x: PX + 40 },
      ];
      bubbles.forEach(function (b, i) {
        const k = seg(t, b.at, b.at + 0.4);
        if (k <= 0) return;
        ctx.save();
        ctx.globalAlpha *= easeOut(k);
        const by = PY + 90 + i * 86, bw = i === 0 ? 150 : 210, bh = 56;
        fillSoft(b.x, by, bw, bh, 'rgba(33,27,20,0.06)');
        ctx.strokeStyle = b.gold ? CINNA : DIM; ctx.lineWidth = 2;
        roundRect(b.x, by, bw, bh, 14); ctx.stroke();
        label(b.txt, b.x + bw / 2, by + 37, {
          size: 18, align: 'center', color: b.gold ? CINNA : DIM
        });
        stroke([[b.x, by + bh / 2], [b.x - 12, by + bh / 2 + 4], [b.x, by + bh / 2 + 10]],
          1.6, b.gold ? CINNA : DIM, 1, 63 + i, 0.6);
        ctx.restore();
      });

      const ik = seg(t, 106.72, 107.15);
      if (ik > 0) {
        ctx.save();
        ctx.globalAlpha *= easeOut(ik);
        const kx = PX + 56, ky = PY + PH - 130;
        ctx.beginPath(); ctx.arc(kx + 4, ky + 30, 9, 0, Math.PI * 2);
        ctx.strokeStyle = INK; ctx.lineWidth = 2.4; ctx.stroke();
        stroke([[kx + 4, ky + 21], [kx + 4, ky - 6], [kx + 30, ky - 6], [kx + 30, ky + 2]], 2.4, INK, 1, 64, 0.8);
        stroke([[kx + 30, ky + 4], [kx + 42, ky + 4]], 2, INK, 1, 65, 0.5);
        stroke([[kx + 30, ky + 10], [kx + 38, ky + 10]], 2, INK, 1, 66, 0.5);
        const plx = PX + 120, ply = ky - 18;
        ctx.strokeStyle = INK; ctx.lineWidth = 2.4;
        roundRect(plx, ply, 118, 40, 5); ctx.stroke();
        stroke([[plx + 14, ply + 30], [plx + 30, ply + 12]], 2.2, INK, 1, 67, 0.5);
        stroke([[plx + 30, ply + 12], [plx + 46, ply + 30]], 2.2, INK, 1, 68, 0.5);
        ctx.strokeRect(plx + 62, ply + 12, 20, 16);
        label('新车 · 新牌', plx + 40, ply + 66, {
          size: 15, color: FAINT, align: 'center'
        });
        ctx.restore();
      }

      const hk = seg(t, 108.68, 108.98);
      if (hk > 0) {
        const rise = easeOut(hk) * 24;
        ctx.save();
        ctx.globalAlpha *= hk;
        drawHeart(PX + PW - 64, PY + 66 - rise, 15, CINNA);
        ctx.restore();
      }
      label('同学群', PX + 30, PY + 52, { size: 15, color: FAINT });
      ctx.restore();
    }

    if (downK > 0 && PHOTO && PHOTO.has('PHONE_DOWN_LINE_V1')) {
      const zoom = 1 + 0.025 * seg(t, DOWN_AT + 0.34, T1);
      ctx.save();
      ctx.translate(W / 2, H / 2);
      ctx.scale(zoom, zoom);
      ctx.translate(-W / 2, -H / 2);
      PHOTO.plate('PHONE_DOWN_LINE_V1', 0, 0, W, H, {
        raw: true, label: false, alpha: out * downK
      });
      ctx.restore();
    }
    ctx.restore();
  }  function drawHeart(x, y, s, col) {
    ctx.save();
    ctx.strokeStyle = col; ctx.lineWidth = 2.6; ctx.fillStyle = 'rgba(168,64,44,0.14)';
    ctx.beginPath();
    ctx.moveTo(x, y + s * 0.9);
    ctx.bezierCurveTo(x - s * 1.3, y - s * 0.2, x - s * 0.5, y - s * 1.2, x, y - s * 0.35);
    ctx.bezierCurveTo(x + s * 0.5, y - s * 1.2, x + s * 1.3, y - s * 0.2, x, y + s * 0.9);
    ctx.closePath(); ctx.fill(); ctx.stroke();
    ctx.restore();
  }

  // ============================================================
  // D. bridgeLedger —— #29 119.45 → #31 127.60
  //    订单叠沿路径落下 → 四季标记 → 账页逐行记号 → 棋子行至未完处
  // ============================================================
  // 共享路径（棋子沿它前行，末段伸向画外右上）
  function pathPoint(s) { // s ∈ [0,1.25] >1 表示已出画心
    const x0 = 300, y0 = 620, x1 = 980, y1 = 470, x2 = 1560, y2 = 320;
    const outX = 1980, outY = 180;
    let x, y;
    if (s <= 1) {
      const u = s;
      x = (1 - u) * (1 - u) * x0 + 2 * (1 - u) * u * x1 + u * u * x2;
      y = (1 - u) * (1 - u) * y0 + 2 * (1 - u) * u * y1 + u * u * y2;
    } else {
      const u = s - 1;
      x = x2 + (outX - x2) * u; y = y2 + (outY - y2) * u;
    }
    return [x, y];
  }
  function drawLedger(t) {
    paper();
    const D = 119.45, T1 = 127.6;
    const out = 1 - seg(t, T1 - 0.1, T1);
    ctx.save(); ctx.globalAlpha = out;

    // —— 路径（淡）：纸叠与棋子共用 ——
    const pathK = seg(t, D, D + 0.6) * 0.5;
    const pp = [];
    for (let s = 0; s <= 1.001; s += 0.0833) pp.push(pathPoint(s));
    if (pathK > 0) stroke(pp, 2, DIM, pathK, 91, 1.4);

    // —— 订单叠：纸片沿路径依次落下 ——
    const sheets = 7;
    for (let i = 0; i < sheets; i++) {
      const at = D + 0.35 + i * 0.34;
      const k = seg(t, at, at + 0.45);
      if (k <= 0) continue;
      const s = 0.06 + i * 0.145;
      const pt = pathPoint(Math.min(s, 0.94));
      ctx.save();
      ctx.globalAlpha *= easeOut(k) * (i === sheets - 1 ? 1 : 0.92);
      const rot = (i % 3 - 1) * 0.06 + j(i * 13, 0.03);
      ctx.translate(pt[0], pt[1]);
      ctx.rotate(rot);
      const w = 150, h = 204;
      fillSoft(5, 6, w, h, 'rgba(33,27,20,0.09)');
      fillSoft(0, 0, w, h, PAPER_HI);
      ctx.strokeStyle = INK; ctx.lineWidth = 2;
      ctx.strokeRect(0.5, 0.5, w, h);
      // 折角 + 两行横线（无数字）
      ctx.beginPath();
      ctx.moveTo(w - 30, 0); ctx.lineTo(w - 8, 22); ctx.lineTo(w, 22);
      ctx.strokeStyle = INK; ctx.lineWidth = 1.8; ctx.stroke();
      stroke([[14, 48], [w - 34, 48]], 1.4, DIM, 0.8, 92 + i, 0.6);
      stroke([[14, 68], [w - 58, 68]], 1.4, DIM, 0.8, 93 + i, 0.6);
      ctx.restore();
    }

    // —— 四季标记：稀疏、先后，各在一处 ——
    const seasons = [
      { at: 120.85, kind: 'leaf', x: 430, y: 690 },
      { at: 121.35, kind: 'rain', x: 1120, y: 700 },
      { at: 121.85, kind: 'leafFall', x: 1420, y: 640 },
      { at: 122.35, kind: 'snow', x: 1660, y: 560 },
    ];
    seasons.forEach(function (sm, i) {
      const k = seg(t, sm.at, sm.at + 0.4);
      if (k <= 0) return;
      ctx.save();
      ctx.globalAlpha *= easeOut(k) * 0.95;
      if (sm.kind === 'leaf') {
        // 一片叶：中脉 + 两弧
        ctx.translate(sm.x, sm.y);
        stroke([[0, 22], [0, -20]], 2, INK, 1, 95, 0.7);
        stroke([[0, -20], [16, -6], [14, 12], [0, 22]], 2, INK, 1, 96, 0.8);
        stroke([[0, -20], [-16, -6], [-14, 12], [0, 22]], 2, INK, 1, 97, 0.8);
      } else if (sm.kind === 'rain') {
        // 雨痕：三条短斜线
        for (let r = 0; r < 3; r++) stroke([[sm.x + r * 14, sm.y], [sm.x + r * 14 - 8, sm.y + 26]], 1.8, DIM, 1, 98 + r, 0.6);
      } else if (sm.kind === 'leafFall') {
        // 落叶：叶形旋 30°，下方一点地面短线
        ctx.translate(sm.x, sm.y); ctx.rotate(0.5);
        stroke([[0, 18], [0, -16]], 1.8, DIM, 1, 101, 0.6);
        stroke([[0, -16], [13, -4], [11, 10], [0, 18]], 1.8, DIM, 1, 102, 0.7);
        stroke([[0, -16], [-13, -4], [-11, 10], [0, 18]], 1.8, DIM, 1, 103, 0.7);
        stroke([[-14, 30], [14, 30]], 1.4, FAINT, 1, 104, 0.5);
      } else if (sm.kind === 'snow') {
        // 雪点：四个小圆
        for (let r = 0; r < 4; r++) {
          const dx = j(105 + r, 16), dy = j(115 + r, 12);
          ctx.beginPath(); ctx.arc(sm.x + dx, sm.y + dy, 3, 0, Math.PI * 2);
          ctx.strokeStyle = DIM; ctx.lineWidth = 1.6; ctx.stroke();
        }
      }
      ctx.restore();
    });

    // —— 账页：逐行无数字记号（122.15 起，右侧淡入）——
    const ledAt = 122.15;
    const ledK = seg(t, ledAt, ledAt + 0.5);
    // 棋子行进时账页压暗
    const pawnK = seg(t, 124.88, 125.4);
    const ledAlpha = ledK * (1 - pawnK * 0.62);
    if (ledAlpha > 0) {
      ctx.save();
      ctx.globalAlpha *= ledAlpha;
      const LX = 1010, LY = 210, LW = 640, LH = 430;
      fillSoft(LX + 6, LY + 8, LW, LH, 'rgba(33,27,20,0.10)');
      fillSoft(LX, LY, LW, LH, PAPER_HI);
      ctx.strokeStyle = INK; ctx.lineWidth = 2.6;
      ctx.strokeRect(LX + 0.5, LY + 0.5, LW, LH);
      // 翻角
      ctx.beginPath();
      ctx.moveTo(LX + LW - 44, LY); ctx.lineTo(LX + LW - 20, LY + 26); ctx.lineTo(LX + LW, LY + 26);
      ctx.strokeStyle = INK; ctx.lineWidth = 1.8; ctx.stroke();
      // 中缝
      stroke([[LX + 26, LY + 30], [LX + 26, LY + LH - 24]], 1.6, DIM, 0.7, 111, 0.8);
      // 逐行记号（勾 / 短杠 / 圈 交替；行右侧留空）
      const marks = ['check', 'dash', 'ring', 'dash', 'check', 'dash', 'ring'];
      marks.forEach(function (mk, i) {
        const at = ledAt + 0.55 + i * 0.25;
        const mk2 = seg(t, at, at + 0.3);
        if (mk2 <= 0) return;
        const y = LY + 74 + i * 46, x = LX + 58;
        ctx.save();
        ctx.globalAlpha *= easeOut(mk2);
        if (mk === 'check') {
          ctx.strokeStyle = CINNA; ctx.lineWidth = 2.6; ctx.lineCap = 'round';
          ctx.beginPath(); ctx.moveTo(x, y - 3); ctx.lineTo(x + 7, y + 5); ctx.stroke();
          ctx.beginPath(); ctx.moveTo(x + 7, y + 5); ctx.lineTo(x + 19, y - 8); ctx.stroke();
        } else if (mk === 'dash') {
          stroke([[x, y], [x + 22, y]], 2.4, INK, 1, 112 + i, 0.5);
        } else {
          ctx.beginPath(); ctx.arc(x + 10, y - 3, 7, 0, Math.PI * 2);
          ctx.strokeStyle = INK; ctx.lineWidth = 2.2; ctx.stroke();
        }
        // 行右侧：留空（只一条淡线示意「行还在继续」）
        stroke([[x + 40, y], [LX + LW - 40, y]], 1, FAINT, 0.55, 118 + i, 0.4);
        ctx.restore();
      });
      ctx.restore();
    }

    // —— 棋子：沿路径前行，停在路径伸向画外处 ——
    const pawnAt = 124.88, pawnDur = 0.82;
    const pk = seg(t, pawnAt, pawnAt + pawnDur);
    if (pk > 0) {
      const s = easeIO(pk) * 0.78;               // 停在 s=0.78（画心内），路径继续伸向画外
      const pt = pathPoint(s);
      // 未完的路径：棋子前方一段朱砂虚线
      const rest = [];
      for (let ss = s + 0.04; ss <= 1.22; ss += 0.06) rest.push(pathPoint(ss));
      ctx.save();
      ctx.setLineDash([10, 9]);
      ctx.globalAlpha *= 0.75 * out;
      stroke(rest, 2.2, CINNA, 0.8, 121, 1.2);
      ctx.restore();
      // 棋子本体：底座椭圆 + 身 + 圆头（围棋子感，非火柴人）
      ctx.save();
      ctx.globalAlpha *= out;
      ctx.translate(pt[0], pt[1] - 10);
      // 影
      ctx.beginPath(); ctx.ellipse(4, 30, 34, 9, 0, 0, Math.PI * 2);
      ctx.fillStyle = 'rgba(33,27,20,0.14)'; ctx.fill();
      // 身（梯形）
      stroke([[-20, 26], [-12, -14], [12, -14], [20, 26]], 3, INK, 1, 122, 0.8);
      // 底座椭圆
      ctx.beginPath(); ctx.ellipse(0, 26, 22, 8, 0, 0, Math.PI * 2);
      ctx.strokeStyle = INK; ctx.lineWidth = 2.6; ctx.stroke();
      // 圆头
      ctx.beginPath(); ctx.arc(0, -24, 14, 0, Math.PI * 2);
      ctx.strokeStyle = INK; ctx.lineWidth = 3; ctx.stroke();
      hatch(-10, -26, 20, 12, 3, 123, DIM, 0.3);
      // 头上一颗朱砂点（点睛）
      ctx.beginPath(); ctx.arc(0, -24, 3.4, 0, Math.PI * 2);
      ctx.fillStyle = CINNA; ctx.globalAlpha *= 0.9; ctx.fill();
      ctx.restore();
      // 「未完」小标签（非歌词大字）
      const lb = seg(t, 126.3, 126.8);
      if (lb > 0) {
        const lp = pathPoint(1.02);
        label('未完', lp[0] - 40, lp[1] + 30, { size: 15, color: CINNA, alpha: lb * 0.85 });
      }
    }

    // —— 末 0.4s：从左向右的风线起笔（接 #32 大风段）——
    const windK = seg(t, 127.2, 127.6);
    if (windK > 0) {
      ctx.save();
      ctx.globalAlpha *= windK;
      for (let i = 0; i < 3; i++) {
        const y = 200 + i * 60;
        stroke([[80 + i * 30, y], [520, y - 26 - i * 8], [1040, y - 12]], 2, DIM, 0.7 * windK, 125 + i, 1.2);
      }
      ctx.restore();
    }

    swatch('bridgeLedger · 119.45–127.60');
    ctx.restore();
  }

  // ============================================================
  // 注册：LAYOUTS 契约 c = { t, shot, local, dur, u, p, pal, ... }，t = 绝对秒
  // ============================================================
  window.LAYOUTS.bridgeKeys = function (c) { drawKeys(c.t); };
  window.LAYOUTS.bridgeReceipt = function (c) { drawReceipt(c.t); };
  window.LAYOUTS.bridgePhone = function (c) { drawPhone(c.t); };
  window.LAYOUTS.bridgeLedger = function (c) { drawLedger(c.t); };

  // （可选）主工程接入：导出 PLAN 覆盖建议，由主负责人显式调用，不自动生效
  window.BRIDGE_PATCH_PLAN = {
    10: { k: 'bridgeKeys' },
    11: { k: 'bridgeReceipt' },
    23: { k: 'bridgePhone' },
    24: { k: 'bridgePhone' },
    25: { k: 'bridgePhone' },
    29: { k: 'bridgeLedger' },
    30: { k: 'bridgeLedger' },
    31: { k: 'bridgeLedger' },
  };
})();
