// receipt（#11 购物车结算单）重写：
//   问题1：lyric 从 x=200 起、字号 44、12 字 ≈ 530px 宽，越过纸面左边界 rx=620 → 末字被纸吃掉
//   问题2：明细行从 local=0 才开始，镜头第一帧是整张空白纸
//   做法：左栏加宽度约束与自动换行；小票立刻开始打印（i*0.26）；
//         补齐票头（门店/日期/单号）、点线分隔、条形码、朱印，纸面不再空。
import fs from 'fs';
const p = 'E:/新建文件夹/实习/MV/film/src/layouts.js';
let s = fs.readFileSync(p, 'utf8');

const start = s.indexOf('  LAYOUTS.receipt = function (c) {');
if (start < 0) throw new Error('receipt start not found');
const nextMark = s.indexOf('  // L16 灯箱：出生登记卡', start);
if (nextMark < 0) throw new Error('next marker not found');

const fresh = `  LAYOUTS.receipt = function (c) {
    ctx.fillStyle = '#0a0a0b';
    ctx.fillRect(0, 0, W, H);
    // 左栏：深底 + 极淡网纹，避免大片死黑
    ctx.save();
    ctx.globalAlpha = 0.5;
    ctx.drawImage(hatchTile(90, 14, 560, H, '#1a1a1c', 0.5, 2), 0, 0, 560, H);
    ctx.restore();

    const rx = 620, rw = 760, ry = 118, rh = H - 190;
    // 纸：微微倾斜的票据 + 撕口
    ctx.save();
    ctx.translate(rx + rw / 2, ry + rh / 2);
    ctx.rotate(-0.004);
    ctx.translate(-(rx + rw / 2), -(ry + rh / 2));
    ctx.fillStyle = '#efeade';
    ctx.fillRect(rx, ry, rw, rh);
    // 纸纹
    ctx.globalAlpha = 0.16;
    ctx.drawImage(grainTile(rw, rh, 0.5, 7), rx, ry, rw, rh);
    ctx.globalAlpha = 1;
    // 上下撕口
    const ink = '#2b2419';
    ctx.fillStyle = ink;
    for (let x = rx; x < rx + rw; x += 22) {
      ctx.beginPath();
      ctx.moveTo(x, ry); ctx.lineTo(x + 11, ry + 7); ctx.lineTo(x + 22, ry);
      ctx.closePath(); ctx.fill();
      ctx.beginPath();
      ctx.moveTo(x, ry + rh); ctx.lineTo(x + 11, ry + rh - 7); ctx.lineTo(x + 22, ry + rh);
      ctx.closePath(); ctx.fill();
    }
    ctx.restore();

    const inkC = '#2b2419';
    const accC = '#a8402c';
    const dimC = 'rgba(43,36,25,0.55)';
    const L = 40;                        // 纸内左边距
    const R = rx + rw - 40;
    const mono = (t2, x, y, o) => text(t2, x, y, Object.assign({ fam: 'mono', color: inkC }, o));

    // ---- 票头：门店 / 单据号 / 时间 ----
    mono('购物车 / CART', rx + L, ry + 62, { size: 30, letterSpacing: 4 });
    mono('No.2026-1110-0001', R, ry + 62, { size: 16, align: 'right', color: dimC, letterSpacing: 2 });
    mono('THE OGS  ·  过来人消耗清单', rx + L, ry + 96, { size: 16, color: dimC, letterSpacing: 2 });
    mono('2026-11-10  20:41', R, ry + 96, { size: 16, align: 'right', color: dimC, letterSpacing: 2 });

    // 双线
    ctx.save();
    ctx.fillStyle = inkC;
    ctx.fillRect(rx + L, ry + 112, rw - L * 2, 2);
    ctx.fillRect(rx + L, ry + 117, rw - L * 2, 1);
    ctx.restore();

    // ---- 明细行（第一帧就开始打印，避免空纸）----
    const items = [
      ['房贷', 6800], ['学费', 2400], ['爸妈体检', 1200], ['水电', 320],
      ['通勤', 260], ['话费', 99], ['自己的', 0],
    ];
    let sum = 0;
    let lastY = ry + 160;
    for (let i = 0; i < items.length; i++) {
      const at = i * 0.26;
      const e = clamp((c.local - at) / 0.14, 0, 1);
      if (e <= 0) continue;
      const y = ry + 160 + i * 62;
      lastY = y;
      const it = items[i];
      const mine = i === items.length - 1;
      if (!mine) sum += it[1];
      ctx.save();
      ctx.globalAlpha = e;
      // 行号
      mono(String(i + 1).padStart(2, '0'), rx + L, y, { size: 16, color: dimC });
      text(it[0], rx + L + 42, y, { size: 30, fam: 'serif', color: inkC });
      if (!mine) {
        // 点线填充（票据的经典做法）
        const nameW = measure(it[0], 30, 'serif');
        const valW = measure(it[1].toFixed(2), 24, 'mono');
        const x1 = rx + L + 42 + nameW + 12;
        const x2 = R - valW - 12;
        ctx.save();
        ctx.globalAlpha = e * 0.45;
        ctx.fillStyle = inkC;
        for (let dx = x1; dx < x2; dx += 9) ctx.fillRect(dx, y - 5, 3, 1.4);
        ctx.restore();
      }
      mono(mine ? '0.00' : it[1].toFixed(2), R, y,
        { size: mine ? 30 : 24, align: 'right', color: mine ? accC : inkC });
      ctx.restore();
    }

    // ---- 合计 ----
    const tk = clamp((c.local - 1.9) / 0.4, 0, 1);
    if (tk > 0) {
      const ty = ry + 160 + items.length * 62 + 30;
      ctx.save();
      ctx.globalAlpha = tk;
      ctx.fillStyle = inkC;
      ctx.fillRect(rx + L, ty - 46, rw - L * 2, 1.6);
      mono('TOTAL', rx + L, ty, { size: 34, letterSpacing: 4 });
      mono(sum.toFixed(2), R, ty, { size: 40, align: 'right', color: accC });
      ctx.restore();
    }

    // ---- 条形码 + 票尾 ----
    const bk = clamp((c.local - 2.3) / 0.4, 0, 1);
    if (bk > 0) {
      ctx.save();
      ctx.globalAlpha = bk * 0.9;
      ctx.fillStyle = inkC;
      const by = ry + rh - 110;
      let bx = rx + L;
      const seed = 20261110;
      for (let i = 0; i < 76; i++) {
        const wbar = 1 + ((seed >> (i % 12)) & 1) + ((i % 5 === 0) ? 1 : 0);
        if (i % 2 === 0) ctx.fillRect(bx, by, wbar, 46);
        bx += wbar + 2;
      }
      mono('NO REFUND  ·  不予退还', rx + L, by + 74, { size: 15, color: dimC, letterSpacing: 3 });
      mono('THANK YOU', R, by + 74, { size: 15, align: 'right', color: dimC, letterSpacing: 3 });
      ctx.restore();
    }

    // ---- 左栏：本人 0.00 + 逐行歌词（宽度受限，自动换行）----
    ctx.save();
    const ak = clamp((c.local - 2.6) / 0.5, 0, 1);
    if (ak > 0) {
      ctx.globalAlpha = ak;
      // 竖向细线 + 标签
      ctx.fillStyle = '#c8a24a';
      ctx.fillRect(150, 300, 2, 210);
      text('BALANCE', 176, 306, { size: 15, fam: 'mono', color: '#8b8577', letterSpacing: 4 });
      text('本人 0.00', 176, 452, { size: 44, fam: 'mono', color: accC, letterSpacing: 2 });
      text('其余 11079.00', 176, 496, { size: 20, fam: 'mono', color: '#8b8577', letterSpacing: 2 });
    }
    ctx.restore();

    // 歌词：限制在 150..600 之间，超过就换行（原来从 x=200 直接冲进纸面）
    const ln = lineAt(c.t);
    if (ln) {
      const maxW = 430;
      const size = 46;
      const chars = ln.text.split('');
      const rows = [];
      let cur = '';
      for (const ch of chars) {
        const test = cur + ch;
        if (measure(test, size, 'serif') > maxW && cur) { rows.push(cur); cur = ch; }
        else cur = test;
      }
      if (cur) rows.push(cur);
      const startY = 760 - (rows.length - 1) * 56;
      rows.forEach((row, i) => {
        // 逐字高亮：用 chars 的时间
        ctx.save();
        ctx.globalAlpha = 0.92;
        let x = 150;
        const rowChars = row.split('');
        for (const ch of rowChars) {
          const info = (ln.chars || []).find((q) => q.c === ch);
          const sung = info ? c.t >= info.t : false;
          text(ch, x, startY + i * 56, {
            size, fam: 'serif', color: sung ? '#efeade' : 'rgba(239,234,222,0.34)',
          });
          x += measure(ch, size, 'serif');
        }
        ctx.restore();
      });
    }

    shotTag(c);
    fadeEdges(c);
  };

`;
s = s.slice(0, start) + fresh + s.slice(nextMark);
fs.writeFileSync(p, s);
console.log('receipt rewritten, bytes', s.length);
