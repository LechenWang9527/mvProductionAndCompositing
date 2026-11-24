// 把 blueprintHall 画满：轴线圆圈编号 / 尺寸链 / 剖面填充 / 屋架腹杆 / 标尺 / 材料表 / 修订栏 / 侧立面
// 目标：纸面不许留七成空白。所有元素都是 t 的纯函数。
import fs from 'fs';
const p = 'E:/新建文件夹/实习/MV/film/src/layouts.js';
let s = fs.readFileSync(p, 'utf8');

const start = s.indexOf('  LAYOUTS.blueprintHall = function (c) {');
if (start < 0) throw new Error('blueprintHall start not found');
// 找到函数结束：下一个 "  // L13 数据实体化" 注释
const nextMark = s.indexOf('  // L13 数据实体化', start);
if (nextMark < 0) throw new Error('next layout marker not found');

const fresh = `  LAYOUTS.blueprintHall = function (c) {
    const onPaper = !!c.p.paper;
    if (onPaper) {
      paperBg('#ded4bc');
      ctx.save();
      ctx.globalAlpha = 0.22;
      ctx.drawImage(hatchTile(0, 46, W, H, '#2b2419', 0.5, 2), 0, 0, W, H);
      ctx.restore();
    } else {
      const g = ctx.createLinearGradient(0, 0, 0, H);
      g.addColorStop(0, '#101a24');
      g.addColorStop(1, '#0a1016');
      ctx.fillStyle = g;
      ctx.fillRect(0, 0, W, H);
    }
    const line = onPaper ? 'rgba(43,36,25,0.88)' : '#9fc4dd';
    const faint = onPaper ? 'rgba(43,36,25,0.26)' : 'rgba(159,196,221,0.26)';
    const acc = onPaper ? '#a8402c' : '#ffcc00';
    const dim = onPaper ? 'rgba(107,95,76,0.85)' : 'rgba(159,196,221,0.78)';
    const ink2 = onPaper ? '#17130f' : '#e8f2fa';

    grid({ line: faint }, { grid: onPaper ? 46 : 32, alpha: 0.55 });

    // 版面几何：图形区在图框内，标题栏在右下
    const FX = 150, FY = 130, FW = W - 300, FH = H - 340;   // 图框
    const x0 = 310, y0 = 800, cols = 6, span = 190, hgt = 380;
    const k = ease.out(clamp(c.local / 1.0, 0, 1));

    // ---------- 图框 + 分区刻度 ----------
    ctx.save();
    ctx.strokeStyle = line; ctx.lineWidth = 2;
    ctx.globalAlpha = 0.62 * k;
    ctx.strokeRect(FX, FY, FW, FH);
    ctx.lineWidth = 1;
    ctx.globalAlpha = 0.42 * k;
    // 上下边刻度
    for (let x = FX; x <= FX + FW; x += 46) {
      const long = ((x - FX) / 46) % 5 === 0;
      ctx.beginPath();
      ctx.moveTo(x, FY); ctx.lineTo(x, FY + (long ? 14 : 7));
      ctx.moveTo(x, FY + FH); ctx.lineTo(x, FY + FH - (long ? 14 : 7));
      ctx.stroke();
    }
    for (let y = FY; y <= FY + FH; y += 46) {
      const long = ((y - FY) / 46) % 5 === 0;
      ctx.beginPath();
      ctx.moveTo(FX, y); ctx.lineTo(FX + (long ? 14 : 7), y);
      ctx.moveTo(FX + FW, y); ctx.lineTo(FX + FW - (long ? 14 : 7), y);
      ctx.stroke();
    }
    ctx.restore();

    // ---------- 剖面线填充（地基与楼板） ----------
    ctx.save();
    ctx.globalAlpha = 0.5 * k;
    const soil = ctx.createPattern(hatchTile(45, 9, 200, 60, onPaper ? '#2b2419' : '#9fc4dd', 0.5, 2), 'repeat');
    ctx.fillStyle = soil;
    ctx.fillRect(x0 - 120, y0 + 12, cols * span + 240, 34);   // 地坪以下
    ctx.globalAlpha = 0.34 * k;
    ctx.fillRect(x0 - 120, y0 - 14, cols * span + 240, 14);   // 楼板
    ctx.restore();

    // ---------- 柱：轴线 + 柱身 + 柱础 + 剖面填充 ----------
    const beamY = y0 - hgt;
    ctx.save();
    ctx.strokeStyle = line;
    for (let i = 0; i <= cols; i++) {
      const ck = clamp(c.local * 1.9 - i * 0.34, 0, 1);
      if (ck <= 0) continue;
      const px = x0 + i * span;
      const py = y0 - hgt * ck;
      // 轴线（细虚线，贯穿全高）
      ctx.save();
      ctx.globalAlpha = 0.3 * k;
      ctx.setLineDash([4, 6]);
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.moveTo(px, FY + 40); ctx.lineTo(px, y0 + 54);
      ctx.stroke();
      ctx.setLineDash([]);
      ctx.restore();
      // 柱身（双线，表示有厚度）
      ctx.globalAlpha = ck;
      ctx.lineWidth = onPaper ? 2.4 : 2;
      ctx.beginPath();
      ctx.moveTo(px - 9, y0); ctx.lineTo(px - 9, py);
      ctx.moveTo(px + 9, y0); ctx.lineTo(px + 9, py);
      ctx.stroke();
      // 柱内 45° 剖面填充（柱宽 18，用短斜线示意）
      ctx.globalAlpha = ck * 0.5;
      ctx.lineWidth = 1;
      for (let t2 = 0; t2 < (y0 - py); t2 += 13) {
        ctx.beginPath();
        ctx.moveTo(px - 9, y0 - t2);
        ctx.lineTo(px + 9, y0 - t2 - 12);
        ctx.stroke();
      }
      // 柱础
      ctx.globalAlpha = ck;
      ctx.lineWidth = onPaper ? 2.4 : 2;
      ctx.beginPath();
      ctx.moveTo(px - 25, y0); ctx.lineTo(px + 25, y0);
      ctx.moveTo(px - 25, y0); ctx.lineTo(px - 25, y0 + 10);
      ctx.moveTo(px + 25, y0); ctx.lineTo(px + 25, y0 + 10);
      ctx.stroke();
      // 轴号圆圈
      ctx.globalAlpha = ck * 0.9;
      ctx.lineWidth = 1.6;
      ctx.beginPath();
      ctx.arc(px, FY + 26, 15, 0, Math.PI * 2);
      ctx.stroke();
      text(String.fromCharCode(65 + i), px, FY + 32, { size: 15, fam: 'mono', color: dim, align: 'center' });
    }
    ctx.restore();

    // ---------- 屋架（梁 + 桁架腹杆） ----------
    if (c.local > 1.6) {
      const lk = ease.out(clamp((c.local - 1.6) / 0.8, 0, 1));
      ctx.save();
      ctx.strokeStyle = line;
      ctx.globalAlpha = lk;
      ctx.lineWidth = onPaper ? 2.6 : 2.2;
      // 上弦（双坡）
      const midx = x0 + cols * span / 2;
      ctx.beginPath();
      ctx.moveTo(x0 - 70, beamY);
      ctx.lineTo(midx, beamY - 76);
      ctx.lineTo(x0 + cols * span + 70, beamY);
      ctx.stroke();
      // 下弦
      ctx.lineWidth = 1.8;
      ctx.beginPath();
      ctx.moveTo(x0 - 70, beamY + 16);
      ctx.lineTo(x0 + cols * span + 70, beamY + 16);
      ctx.stroke();
      // 腹杆：每跨三根 V 字
      ctx.globalAlpha = lk * 0.8;
      ctx.lineWidth = 1;
      for (let i = 0; i <= cols; i++) {
        const px = x0 + i * span;
        const apex = (i === cols / 2) ? beamY - 76 : (i < cols / 2)
          ? beamY - 76 * (1 - Math.abs(i - cols / 2) / (cols / 2))
          : beamY - 76 * (1 - Math.abs(i - cols / 2) / (cols / 2));
        ctx.beginPath();
        ctx.moveTo(px, beamY + 16);
        ctx.lineTo(px, apex);
        ctx.stroke();
        if (i < cols) {
          ctx.beginPath();
          ctx.moveTo(px, beamY + 16);
          const nx = x0 + (i + 1) * span;
          const napx = beamY - 76 * (1 - Math.abs(i + 1 - cols / 2) / (cols / 2));
          ctx.lineTo(nx, napx);
          ctx.stroke();
        }
      }
      // 屋脊小旗
      ctx.globalAlpha = lk * 0.7;
      ctx.beginPath();
      ctx.moveTo(midx, beamY - 76); ctx.lineTo(midx, beamY - 104);
      ctx.stroke();
      ctx.restore();
    }

    // ---------- 尺寸链（三道：总长 / 开间 / 柱径） ----------
    ctx.save();
    ctx.strokeStyle = line;
    ctx.globalAlpha = 0.72 * k;
    ctx.lineWidth = 1;
    const dimRows = [
      { y: y0 + 74, text: \`总长 \${cols} × 190 = 1140\`, from: x0 - 25, to: x0 + cols * span + 25 },
      { y: y0 + 104, text: '开间 190', from: x0, to: x0 + span },
      { y: y0 + 134, text: '柱径 18', from: x0 - 9, to: x0 + 9 },
    ];
    dimRows.forEach((r) => {
      ctx.beginPath();
      ctx.moveTo(r.from, r.y); ctx.lineTo(r.to, r.y);
      ctx.moveTo(r.from, r.y - 6); ctx.lineTo(r.from, r.y + 6);
      ctx.moveTo(r.to, r.y - 6); ctx.lineTo(r.to, r.y + 6);
      ctx.stroke();
    });
    // 总长那条画两端箭头
    ctx.globalAlpha = 0.72 * k;
    text(\`\${cols} 间 · 1140 尺 总长\`, x0 - 25, y0 + 62, { size: 17, fam: 'mono', color: dim, letterSpacing: 2 });
    // 竖向总高尺寸
    ctx.setLineDash([6, 6]);
    ctx.beginPath();
    ctx.moveTo(x0 - 128, y0); ctx.lineTo(x0 - 128, beamY - 76);
    ctx.stroke();
    ctx.setLineDash([]);
    ctx.beginPath();
    ctx.moveTo(x0 - 138, y0); ctx.lineTo(x0 - 118, y0);
    ctx.moveTo(x0 - 138, beamY - 76); ctx.lineTo(x0 - 118, beamY - 76);
    ctx.stroke();
    ctx.restore();
    text('380 尺', x0 - 176, (y0 + beamY) / 2, { size: 16, fam: 'mono', color: dim, letterSpacing: 2 });

    // ---------- 引注（材料标注） ----------
    const notes = [
      { ax: x0 + span * 0.5, ay: beamY - 30, tx: x0 + span * 0.5 + 120, ty: beamY - 110, s: '木构 榫卯' },
      { ax: x0 + span * 2.2, ay: y0 - hgt * 0.45, tx: x0 + span * 2.2 + 130, ty: y0 - hgt * 0.62, s: '杉木 柱' },
      { ax: x0 + span * 4.1, ay: y0 + 20, tx: x0 + span * 4.1 + 120, ty: y0 + 60, s: '夯土 地坪' },
    ];
    ctx.save();
    ctx.globalAlpha = 0.55 * k;
    notes.forEach((n) => {
      ctx.beginPath();
      ctx.moveTo(n.ax, n.ay);
      ctx.lineTo(n.tx - 14, n.ty + 5);
      ctx.lineTo(n.tx, n.ty + 5);
      ctx.stroke();
      text(n.s, n.tx + 6, n.ty + 10, { size: 15, fam: 'mono', color: dim, letterSpacing: 2 });
    });
    ctx.restore();

    // ---------- 右上：平面图小样（6 个方格 + 轴号） ----------
    ctx.save();
    ctx.globalAlpha = 0.5 * k;
    const plx = W - 470, ply = FY + 40, plw = 300, plh = 150;
    ctx.strokeStyle = line; ctx.lineWidth = 1.2;
    ctx.strokeRect(plx, ply, plw, plh);
    ctx.globalAlpha = 0.4 * k;
    for (let i = 1; i < 6; i++) {
      const gx = plx + (plw / 6) * i;
      ctx.beginPath(); ctx.moveTo(gx, ply); ctx.lineTo(gx, ply + plh); ctx.stroke();
    }
    for (let i = 1; i < 3; i++) {
      const gy = ply + (plh / 3) * i;
      ctx.beginPath(); ctx.moveTo(plx, gy); ctx.lineTo(plx + plw, gy); ctx.stroke();
    }
    ctx.restore();
    text('PLAN · 平面', plx, ply - 12, { size: 15, fam: 'mono', color: dim, letterSpacing: 3 });

    // ---------- 左下：比例尺 ----------
    ctx.save();
    ctx.globalAlpha = 0.55 * k;
    let sx = 200, sy = FY + FH - 60;
    for (let i = 0; i < 5; i++) {
      ctx.fillStyle = i % 2 ? (onPaper ? '#2b2419' : '#9fc4dd') : 'transparent';
      ctx.fillRect(sx + i * 40, sy, 40, 10);
      ctx.strokeStyle = line;
      ctx.lineWidth = 1;
      ctx.strokeRect(sx + i * 40, sy, 40, 10);
    }
    ctx.restore();
    text('0', sx, sy + 30, { size: 13, fam: 'mono', color: dim, align: 'center' });
    text('200 尺', sx + 200, sy + 30, { size: 13, fam: 'mono', color: dim, align: 'center' });
    text('SCALE 1:200', sx + 100, sy - 12, { size: 14, fam: 'mono', color: dim, align: 'center', letterSpacing: 3 });

    // ---------- 指北针 ----------
    ctx.save();
    ctx.globalAlpha = 0.55 * k;
    const nx = FX + FW - 60, ny = FY + FH - 70;
    ctx.strokeStyle = line;
    ctx.lineWidth = 1.4;
    ctx.beginPath();
    ctx.moveTo(nx, ny - 26); ctx.lineTo(nx + 13, ny + 20);
    ctx.lineTo(nx, ny + 10); ctx.lineTo(nx - 13, ny + 20);
    ctx.closePath();
    ctx.stroke();
    ctx.restore();
    text('N', nx, ny - 36, { size: 15, fam: 'mono', color: dim, align: 'center' });

    // ---------- 标题栏（右下角，三格） ----------
    const tbW = 460, tbH = 190;
    const tbx = W - 120 - tbW, tby = H - 120 - tbH;
    ctx.save();
    ctx.strokeStyle = line;
    ctx.globalAlpha = 0.82 * k;
    ctx.lineWidth = 1.6;
    ctx.strokeRect(tbx, tby, tbW, tbH);
    ctx.globalAlpha = 0.6 * k;
    ctx.lineWidth = 1;
    // 三条横格线 + 一条竖格线
    [46, 92, 138].forEach((dy) => {
      ctx.beginPath(); ctx.moveTo(tbx, tby + dy); ctx.lineTo(tbx + tbW, tby + dy); ctx.stroke();
    });
    ctx.beginPath(); ctx.moveTo(tbx + 150, tby + 92); ctx.lineTo(tbx + 150, tby + tbH); ctx.stroke();
    ctx.restore();

    text(c.p.sheet || 'DRAWING 0009', tbx + 14, tby + 30, { size: 17, fam: 'mono', color: ink2, letterSpacing: 2 });
    text('SECTION A-A', tbx + tbW - 14, tby + 30, { size: 15, fam: 'mono', color: dim, align: 'right', letterSpacing: 3 });
    text('DUFU · 唐', tbx + 14, tby + 76, { size: 16, fam: 'mono', color: dim, letterSpacing: 2 });
    text('1:200', tbx + tbW - 14, tby + 76, { size: 16, fam: 'mono', color: dim, align: 'right', letterSpacing: 2 });
    text('图号', tbx + 14, tby + 118, { size: 13, fam: 'mono', color: dim, letterSpacing: 3 });
    text('REV 03', tbx + 22, tby + 164, { size: 15, fam: 'mono', color: acc, letterSpacing: 2 });
    text('2026-11', tbx + 176, tby + 164, { size: 15, fam: 'mono', color: dim, letterSpacing: 2 });
    text('陈 工', tbx + tbW - 14, tby + 164, { size: 15, fam: 'mono', color: dim, align: 'right', letterSpacing: 2 });

    // ---------- 主标题 ----------
    const tk = ease.out(clamp((c.local - 1.2) / 0.9, 0, 1));
    if (tk > 0) {
      ctx.save();
      ctx.globalAlpha = tk;
      text(c.p.title || '安得广厦千万间', W / 2 - 60, y0 - hgt - 150, {
        size: onPaper ? 64 : 62, fam: 'serif', color: ink2, align: 'center',
      });
      // 标题下的双细线
      ctx.strokeStyle = line;
      ctx.globalAlpha = tk * 0.45;
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.moveTo(W / 2 - 60 - 210, y0 - hgt - 128);
      ctx.lineTo(W / 2 - 60 + 210, y0 - hgt - 128);
      ctx.stroke();
      ctx.restore();
    }

    // ---------- 图纸编号水印（很大、很淡） ----------
    ctx.save();
    ctx.globalAlpha = onPaper ? 0.06 : 0.05;
    text('1000Y', W - 240, H / 2, { size: 320, fam: 'mono', color: ink2, align: 'center', letterSpacing: 8 });
    ctx.restore();

    lyric(lineAt(c.t), c.t, onPaper ? PAL.ancient : { ink: '#dfe9f2', hot: '#ffcc00', accent: '#9fc4dd', dim: '#7f9cb2' },
      { y: H - 168, size: onPaper ? 54 : 56, active: acc, accent: acc, color: onPaper ? '#2b2419' : '#dfe9f2' });
    shotTag(c);
    fadeEdges(c);
  };

`;
s = s.slice(0, start) + fresh + s.slice(nextMark);
fs.writeFileSync(p, s);
console.log('blueprintHall rewritten, bytes', s.length);
