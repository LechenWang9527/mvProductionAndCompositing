// blueprintHall 第三次：全部坐标按图框重算，消除三处重叠
//   图框 150,130,1620,740（内底 870 / 内右 1770）
//   标题栏 1310,700,460,170（右上插图窗占 1508..1800 × 176..344，故平面样移到 1300..1540 × 400..520）
//   柱 250 起、6 间 × 155、地坪 640、梁 340、屋脊 270
//   尺寸链 700 / 730 / 760（在 870 之内）；总高尺寸走右侧 1235 竖线；比例尺 190,826
import fs from 'fs';
const p = 'E:/新建文件夹/实习/MV/film/src/layouts.js';
let s = fs.readFileSync(p, 'utf8');

const start = s.indexOf('  LAYOUTS.blueprintHall = function (c) {');
const nextMark = s.indexOf('  // L13 数据实体化', start);
if (start < 0 || nextMark < 0) throw new Error('anchors not found');

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
    const faint = onPaper ? 'rgba(43,36,25,0.24)' : 'rgba(159,196,221,0.24)';
    const acc = onPaper ? '#a8402c' : '#ffcc00';
    const dim = onPaper ? 'rgba(107,95,76,0.88)' : 'rgba(159,196,221,0.80)';
    const ink2 = onPaper ? '#17130f' : '#e8f2fa';
    const k = ease.out(clamp(c.local / 1.0, 0, 1));

    grid({ line: faint }, { grid: onPaper ? 46 : 32, alpha: 0.5 });

    // ---------- 版面常量（唯一真源） ----------
    const FX = 150, FY = 130, FW = W - 300, FH = H - 340;
    const FBot = FY + FH, FRight = FX + FW;
    const cols = 6, span = 155, x0 = 250, y0 = 640, hgt = 300;
    const beamY = y0 - hgt, peak = beamY - 70;
    const xR = x0 + cols * span;                       // 1180
    const tbW = 460, tbH = 170, tbx = FRight - tbW, tby = FBot - tbH;

    // ---------- 图框 + 边刻度 ----------
    ctx.save();
    ctx.strokeStyle = line;
    ctx.globalAlpha = 0.62 * k;
    ctx.lineWidth = 2;
    ctx.strokeRect(FX, FY, FW, FH);
    ctx.lineWidth = 1;
    ctx.globalAlpha = 0.40 * k;
    for (let x = FX, i = 0; x <= FRight; x += 46, i++) {
      const long = i % 5 === 0;
      ctx.beginPath();
      ctx.moveTo(x, FY); ctx.lineTo(x, FY + (long ? 13 : 6));
      ctx.moveTo(x, FBot); ctx.lineTo(x, FBot - (long ? 13 : 6));
      ctx.stroke();
    }
    for (let y = FY, i = 0; y <= FBot; y += 46, i++) {
      const long = i % 5 === 0;
      ctx.beginPath();
      ctx.moveTo(FX, y); ctx.lineTo(FX + (long ? 13 : 6), y);
      ctx.moveTo(FRight, y); ctx.lineTo(FRight - (long ? 13 : 6), y);
      ctx.stroke();
    }
    ctx.restore();

    // ---------- 地坪剖面 + 楼板 ----------
    ctx.save();
    ctx.globalAlpha = 0.45 * k;
    ctx.fillStyle = ctx.createPattern(hatchTile(45, 9, 160, 40, onPaper ? '#2b2419' : '#9fc4dd', 0.55, 2), 'repeat');
    ctx.fillRect(130, y0 + 12, xR + 60 - 130, 30);
    ctx.globalAlpha = 0.30 * k;
    ctx.fillRect(130, y0 - 13, xR + 60 - 130, 13);
    ctx.restore();

    // ---------- 柱阵 ----------
    ctx.save();
    ctx.strokeStyle = line;
    for (let i = 0; i <= cols; i++) {
      const ck = clamp(c.local * 1.9 - i * 0.30, 0, 1);
      if (ck <= 0) continue;
      const px = x0 + i * span;
      const py = y0 - hgt * ck;

      // 轴线
      ctx.save();
      ctx.globalAlpha = 0.26 * k;
      ctx.setLineDash([4, 6]); ctx.lineWidth = 1;
      ctx.beginPath(); ctx.moveTo(px, FY + 34); ctx.lineTo(px, y0 + 46); ctx.stroke();
      ctx.setLineDash([]);
      ctx.restore();

      // 柱身双线 + 斜剖面
      ctx.globalAlpha = ck;
      ctx.lineWidth = onPaper ? 2.2 : 1.9;
      ctx.beginPath();
      ctx.moveTo(px - 8, y0); ctx.lineTo(px - 8, py);
      ctx.moveTo(px + 8, y0); ctx.lineTo(px + 8, py);
      ctx.stroke();
      ctx.globalAlpha = ck * 0.42;
      ctx.lineWidth = 1;
      for (let d = 0; d < (y0 - py); d += 12) {
        ctx.beginPath();
        ctx.moveTo(px - 8, y0 - d);
        ctx.lineTo(px + 8, y0 - d - 11);
        ctx.stroke();
      }
      // 柱础
      ctx.globalAlpha = ck;
      ctx.lineWidth = onPaper ? 2.2 : 1.9;
      ctx.beginPath();
      ctx.moveTo(px - 24, y0); ctx.lineTo(px + 24, y0);
      ctx.moveTo(px - 24, y0); ctx.lineTo(px - 24, y0 + 9);
      ctx.moveTo(px + 24, y0); ctx.lineTo(px + 24, y0 + 9);
      ctx.stroke();
      // 轴号圈
      ctx.globalAlpha = ck * 0.85;
      ctx.lineWidth = 1.5;
      ctx.beginPath(); ctx.arc(px, FY + 22, 14, 0, Math.PI * 2); ctx.stroke();
      text(String.fromCharCode(65 + i), px, FY + 27.5, { size: 14, fam: 'mono', color: dim, align: 'center' });
    }
    ctx.restore();

    // ---------- 屋架：双坡上弦 + 下弦 + 腹杆 ----------
    if (c.local > 1.5) {
      const lk = ease.out(clamp((c.local - 1.5) / 0.8, 0, 1));
      const midx = x0 + cols * span / 2;
      const apexAt = (i) => beamY - 70 * (1 - Math.abs(i - cols / 2) / (cols / 2));
      ctx.save();
      ctx.strokeStyle = line;
      ctx.globalAlpha = lk;
      ctx.lineWidth = onPaper ? 2.4 : 2.0;
      ctx.beginPath();
      ctx.moveTo(x0 - 60, beamY);
      ctx.lineTo(midx, peak);
      ctx.lineTo(xR + 60, beamY);
      ctx.stroke();
      ctx.lineWidth = 1.7;
      ctx.beginPath();
      ctx.moveTo(x0 - 60, beamY + 16); ctx.lineTo(xR + 60, beamY + 16);
      ctx.stroke();
      ctx.globalAlpha = lk * 0.75;
      ctx.lineWidth = 1;
      for (let i = 0; i <= cols; i++) {
        const px = x0 + i * span;
        ctx.beginPath(); ctx.moveTo(px, beamY + 16); ctx.lineTo(px, apexAt(i)); ctx.stroke();
        if (i < cols) {
          ctx.beginPath();
          ctx.moveTo(px, beamY + 16);
          ctx.lineTo(x0 + (i + 1) * span, apexAt(i + 1));
          ctx.stroke();
        }
      }
      ctx.globalAlpha = lk * 0.6;
      ctx.beginPath(); ctx.moveTo(midx, peak); ctx.lineTo(midx, peak - 24); ctx.stroke();
      ctx.restore();
    }

    // ---------- 尺寸链（开间 / 柱径，横向；都在图框内） ----------
    ctx.save();
    ctx.strokeStyle = line;
    ctx.globalAlpha = 0.62 * k;
    ctx.lineWidth = 1;
    const dChains = [
      { y: y0 + 58, from: x0 - 24, to: xR + 24 },
      { y: y0 + 88, from: x0, to: x0 + span },
      { y: y0 + 112, from: x0 - 8, to: x0 + 8 },
    ];
    dChains.forEach((r) => {
      ctx.beginPath();
      ctx.moveTo(r.from, r.y); ctx.lineTo(r.to, r.y);
      ctx.moveTo(r.from, r.y - 5); ctx.lineTo(r.from, r.y + 5);
      ctx.moveTo(r.to, r.y - 5); ctx.lineTo(r.to, r.y + 5);
      ctx.stroke();
    });
    // 右侧总高尺寸
    ctx.setLineDash([6, 6]);
    ctx.beginPath(); ctx.moveTo(1235, y0); ctx.lineTo(1235, peak); ctx.stroke();
    ctx.setLineDash([]);
    ctx.beginPath();
    ctx.moveTo(1225, y0); ctx.lineTo(1245, y0);
    ctx.moveTo(1225, peak); ctx.lineTo(1245, peak);
    ctx.stroke();
    ctx.restore();

    text(\`\${cols} 间 · \${span} 尺/间 · 总长 \${cols * span} 尺\`, x0 - 24, y0 + 50,
      { size: 16, fam: 'mono', color: dim, letterSpacing: 2 });
    ctx.save();
    ctx.translate(1222, (y0 + peak) / 2);
    ctx.rotate(-Math.PI / 2);
    text(\`\${hgt + 70} 尺\`, 0, 0, { size: 15, fam: 'mono', color: dim, align: 'center', letterSpacing: 2 });
    ctx.restore();

    // ---------- 引注 ----------
    const notes = [
      { ax: x0 + span * 3, ay: peak + 22, tx: x0 + span * 3 + 118, ty: peak - 44, s: '木构 榫卯' },
      { ax: x0 + span * 1.6, ay: y0 - 168, tx: x0 + span * 1.6 + 118, ty: y0 - 236, s: '杉木 立柱' },
      { ax: x0 + span * 4.3, ay: y0 + 18, tx: x0 + span * 4.3 + 104, ty: y0 + 44, s: '夯土 地坪' },
    ];
    ctx.save();
    ctx.globalAlpha = 0.5 * k;
    ctx.strokeStyle = line;
    ctx.lineWidth = 1;
    notes.forEach((n) => {
      ctx.beginPath();
      ctx.moveTo(n.ax, n.ay);
      ctx.lineTo(n.tx - 12, n.ty + 4);
      ctx.lineTo(n.tx, n.ty + 4);
      ctx.stroke();
      text(n.s, n.tx + 6, n.ty + 9, { size: 14, fam: 'mono', color: dim, letterSpacing: 2 });
    });
    ctx.restore();

    // ---------- 右上：平面小样（放在照片窗下方，与轴号圈无交集） ----------
    ctx.save();
    const plx = tbx, ply = 396, plw = 240, plh = 116;
    ctx.strokeStyle = line;
    ctx.globalAlpha = 0.42 * k;
    ctx.lineWidth = 1.1;
    ctx.strokeRect(plx, ply, plw, plh);
    ctx.globalAlpha = 0.28 * k;
    for (let i = 1; i < 6; i++) {
      const gx2 = plx + (plw / 6) * i;
      ctx.beginPath(); ctx.moveTo(gx2, ply); ctx.lineTo(gx2, ply + plh); ctx.stroke();
    }
    for (let i = 1; i < 3; i++) {
      const gy2 = ply + (plh / 3) * i;
      ctx.beginPath(); ctx.moveTo(plx, gy2); ctx.lineTo(plx + plw, gy2); ctx.stroke();
    }
    // 平面里的柱点
    ctx.globalAlpha = 0.6 * k;
    for (let i = 0; i <= 6; i++) {
      for (let j = 0; j <= 3; j += 3) {
        ctx.beginPath();
        ctx.arc(plx + (plw / 6) * i, ply + (plh / 3) * j, 2.4, 0, Math.PI * 2);
        ctx.fillStyle = line;
        ctx.fill();
      }
    }
    ctx.restore();
    text('PLAN · 平面 1:400', plx, ply - 10, { size: 14, fam: 'mono', color: dim, letterSpacing: 3 });

    // ---------- 左下：比例尺 ----------
    const sx = 190, sy = 826;
    ctx.save();
    ctx.globalAlpha = 0.5 * k;
    ctx.strokeStyle = line;
    ctx.lineWidth = 1;
    for (let i = 0; i < 5; i++) {
      if (i % 2 === 0) {
        ctx.fillStyle = onPaper ? '#2b2419' : '#9fc4dd';
        ctx.fillRect(sx + i * 36, sy, 36, 9);
      }
      ctx.strokeRect(sx + i * 36, sy, 36, 9);
    }
    ctx.restore();
    text('0', sx, sy + 24, { size: 12, fam: 'mono', color: dim, align: 'center' });
    text('200 尺', sx + 180, sy + 24, { size: 12, fam: 'mono', color: dim, align: 'center' });
    text('SCALE 1:200', sx + 90, sy - 12, { size: 13, fam: 'mono', color: dim, align: 'center', letterSpacing: 3 });

    // ---------- 指北针 ----------
    const nx = 1250, ny = 800;
    ctx.save();
    ctx.globalAlpha = 0.5 * k;
    ctx.strokeStyle = line;
    ctx.lineWidth = 1.3;
    ctx.beginPath();
    ctx.moveTo(nx, ny - 24); ctx.lineTo(nx + 12, ny + 16);
    ctx.lineTo(nx, ny + 7); ctx.lineTo(nx - 12, ny + 16);
    ctx.closePath();
    ctx.stroke();
    ctx.restore();
    text('N', nx, ny - 32, { size: 14, fam: 'mono', color: dim, align: 'center' });

    // ---------- 标题栏 ----------
    ctx.save();
    ctx.strokeStyle = line;
    ctx.globalAlpha = 0.8 * k;
    ctx.lineWidth = 1.6;
    ctx.strokeRect(tbx, tby, tbW, tbH);
    ctx.globalAlpha = 0.55 * k;
    ctx.lineWidth = 1;
    [44, 86, 128].forEach((dy) => {
      ctx.beginPath(); ctx.moveTo(tbx, tby + dy); ctx.lineTo(tbx + tbW, tby + dy); ctx.stroke();
    });
    ctx.beginPath(); ctx.moveTo(tbx + 150, tby + 86); ctx.lineTo(tbx + 150, tby + tbH); ctx.stroke();
    ctx.restore();

    text(c.p.sheet || 'DRAWING 0009', tbx + 14, tby + 29, { size: 16, fam: 'mono', color: ink2, letterSpacing: 2 });
    text('SECTION A-A', tbx + tbW - 14, tby + 29, { size: 14, fam: 'mono', color: dim, align: 'right', letterSpacing: 3 });
    text('DUFU · 唐', tbx + 14, tby + 71, { size: 15, fam: 'mono', color: dim, letterSpacing: 2 });
    text('1:200', tbx + tbW - 14, tby + 71, { size: 15, fam: 'mono', color: dim, align: 'right', letterSpacing: 2 });
    text('图号', tbx + 14, tby + 112, { size: 12, fam: 'mono', color: dim, letterSpacing: 3 });
    text('REV 03', tbx + 20, tby + 154, { size: 14, fam: 'mono', color: acc, letterSpacing: 2 });
    text('2026-11', tbx + 174, tby + 154, { size: 14, fam: 'mono', color: dim, letterSpacing: 2 });
    text('陈 工', tbx + tbW - 14, tby + 154, { size: 14, fam: 'mono', color: dim, align: 'right', letterSpacing: 2 });

    // ---------- 主标题 ----------
    const tk = ease.out(clamp((c.local - 1.1) / 0.9, 0, 1));
    if (tk > 0) {
      ctx.save();
      ctx.globalAlpha = tk;
      text(c.p.title || '安得广厦千万间', (x0 + xR) / 2, 200, {
        size: onPaper ? 58 : 56, fam: 'serif', color: ink2, align: 'center',
      });
      ctx.strokeStyle = line;
      ctx.globalAlpha = tk * 0.35;
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.moveTo((x0 + xR) / 2 - 190, 218);
      ctx.lineTo((x0 + xR) / 2 + 190, 218);
      ctx.stroke();
      ctx.restore();
    }

    // ---------- 图纸编号水印 ----------
    ctx.save();
    ctx.globalAlpha = onPaper ? 0.07 : 0.05;
    text('1000Y', W - 250, 560, { size: 280, fam: 'mono', color: ink2, align: 'center', letterSpacing: 6 });
    ctx.restore();

    lyric(lineAt(c.t), c.t, onPaper ? PAL.ancient : { ink: '#dfe9f2', hot: '#ffcc00', accent: '#9fc4dd', dim: '#7f9cb2' },
      { y: H - 168, size: onPaper ? 54 : 56, active: acc, accent: acc, color: onPaper ? '#2b2419' : '#dfe9f2' });
    shotTag(c);
    fadeEdges(c);
  };

`;
s = s.slice(0, start) + fresh + s.slice(nextMark);
fs.writeFileSync(p, s);
console.log('blueprintHall v3, bytes', s.length);
