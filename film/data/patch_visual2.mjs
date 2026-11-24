// 重写 ui.js 的 chrome / hud：几何收进安全区、支持纸面（浅底墨色）镜头的深色仪表
import fs from 'fs';
const root = 'E:/新建文件夹/实习/MV/';
const p = root + 'film/src/ui.js';
let s = fs.readFileSync(p, 'utf8');

const A = s.indexOf('  // ---------- 全局框架：每一帧都有的一圈仪表 ----------');
const B = s.indexOf('  window.UI = {');
if (A < 0 || B < 0) throw new Error('chrome block anchors not found');

const NEW = `  // ---------- 全局框架：每一帧都有的一圈仪表 ----------
  // c = { pal, sec, shot, t, local, lightBg }
  // lightBg: 纸面 / 黄底 / 白框版式 —— 仪表改用深墨，否则浅字压浅底看不见
  function chrome(c) {
    const light = !!c.lightBg;
    const pal = c.pal;
    const ink = light ? (c.inkColor || '#17130f') : pal.ink;
    const acc = light ? pal.bg : pal.accent;    // 纸/黄底上，强调色用深色更清楚
    const aBase = light ? 1 : 1;

    // 1) 内容区四角定位角标
    const X0 = 120, Y0 = 180, X1 = W - 120, Y1 = H - 180;
    cornerMarks(X0, Y0, X1 - X0, Y1 - Y0, 26, ink, light ? 0.42 : 0.34);

    // 2) 顶部两条标尺（左右各一，中间留给标题）
    ruler(X0, Y0 - 30, 560, 28, ink, light ? 0.32 : 0.3);
    ruler(X1 - 560, Y0 - 30, 560, 28, ink, light ? 0.32 : 0.3);

    // 3) 左右竖向细轨 + 刻度
    const top = Y0 + 26, bot = Y1 - 20;
    line(X0 - 40, top, X0 - 40, bot, ink, light ? 0.26 : 0.2, 1);
    line(X1 + 40, top, X1 + 40, bot, ink, light ? 0.26 : 0.2, 1);
    ctx.save();
    ctx.globalAlpha = light ? 0.34 : 0.26;
    ctx.fillStyle = ink;
    for (let y = top; y < bot; y += 22) {
      const big = Math.round((y - top) / 22) % 5 === 0;
      const l = big ? 13 : 6;
      ctx.fillRect(X0 - 40, y, l, 1);
      ctx.fillRect(X1 + 40 - l, y, l, 1);
    }
    ctx.restore();

    // 4) 左竖轨：段落号（旋转 90°）+ 竖向进度
    const sec = c.sec;
    const pSec = clamp((c.t - sec.start) / Math.max(0.001, sec.end - sec.start), 0, 1);
    ctx.save();
    ctx.translate(X0 - 66, top + 6);
    ctx.rotate(-Math.PI / 2);
    meta(String(sec.index + 1).padStart(2, '0') + ' / ' + String(K.SECTIONS.length).padStart(2, '0'),
      0, 0, { color: ink, alpha: light ? 0.55 : 0.45, size: T.micro, ls: 6 });
    ctx.restore();
    ctx.save();
    ctx.globalAlpha = light ? 0.22 : 0.16;
    ctx.fillStyle = ink;
    ctx.fillRect(X0 - 44, top + 40, 3, bot - top - 60);
    ctx.globalAlpha = 0.95;
    ctx.fillStyle = acc;
    ctx.fillRect(X0 - 44, top + 40, 3, (bot - top - 60) * pSec);
    ctx.restore();

    // 5) 右竖轨：镜头号（旋转）+ 段落百分比
    ctx.save();
    ctx.translate(X1 + 66, bot - 6);
    ctx.rotate(-Math.PI / 2);
    meta('SHOT ' + String(c.shot.n).padStart(2, '0') + ' / 87', 0, 0,
      { color: ink, alpha: light ? 0.55 : 0.45, size: T.micro, ls: 6 });
    ctx.restore();
    meta(String(Math.round(pSec * 100)).padStart(3, '0') + '%', X1 + 56, bot,
      { align: 'right', color: ink, alpha: light ? 0.6 : 0.5, size: T.micro });

    // 6) 底部数据带
    const by = H - 104;
    line(X0 - 40, by - 14, X1 + 40, by - 14, ink, light ? 0.26 : 0.16, 1);
    segments(X0 - 40, by, X1 - X0 + 80, 104, ink, light ? 0.3 : 0.2);
    const bi = K.beatInfo(c.t);
    const cells = [
      ['T+', c.t.toFixed(2) + 's'],
      ['BEAT', String(bi.n).padStart(4, '0')],
      ['BAR', String(((bi.n / 4) | 0)).padStart(3, '0')],
      ['REC', '0001'],
    ];
    for (let i = 0; i < cells.length; i++) {
      const x = X0 - 40 + i * 200;
      micro(cells[i][0], x, by + 40, { color: ink, alpha: light ? 0.4 : 0.3 });
      meta(cells[i][1], x + 58, by + 40, { color: ink, alpha: light ? 0.7 : 0.52, size: T.micro, ls: 2 });
    }
    // 右下：状态灯 + 波形
    const on = Math.floor(c.local * 2) % 2 === 0;
    statusLight(X1 - 300, by + 32, 4, on, acc);
    wave(X1 - 270, by + 20, 240, 22, c.t, { pal: pal, color: acc, alpha: light ? 0.4 : 0.3, n: 40 });
    return aBase;
  }

  // ---------- 顶栏 ----------
  // c = { pal, sec, shot, t, local, lightBg }
  function hud(c) {
    const light = !!c.lightBg;
    const pal = c.pal;
    const ink = light ? (c.inkColor || '#17130f') : pal.ink;
    const acc = light ? pal.bg : pal.accent;

    // 顶部细线
    line(120, 96, W - 120, 96, ink, light ? 0.3 : 0.16, 1);

    // 左：品牌 + 中文名
    meta('THE OGS', 120, 72, { color: ink, alpha: light ? 0.8 : 0.85, size: T.meta, ls: 4 });
    micro('过来人档案系统', 120 + 122, 72, { color: ink, alpha: light ? 0.45 : 0.4, size: T.micro });

    // 中：段落进度 + 段名
    const sec = c.sec;
    const pSec = clamp((c.t - sec.start) / Math.max(0.001, sec.end - sec.start), 0, 1);
    progress(W / 2 - 210, 80, 420, pSec, { pal: pal, color: ink, h: 3, alpha: 0.9, accent: acc });
    micro(String(sec.index + 1).padStart(2, '0') + ' / ' + String(K.SECTIONS.length).padStart(2, '0') + '   ' + sec.name.toUpperCase(),
      W / 2, 70, { align: 'center', color: ink, alpha: light ? 0.5 : 0.55, size: T.micro });

    // 右：时间码
    meta(K.fmtTC(c.t), W - 120, 72, { align: 'right', color: ink, alpha: light ? 0.8 : 0.85, size: T.meta, ls: 3 });

    // 底部日志（放在数据带下方，不压刻度）
    const bi = K.beatInfo(c.t);
    const recs = ['已归档', 'LOCK', 'SYNC', 'READ', 'WRITE', 'INDEX', 'SCAN', 'OK'];
    const parts = [];
    for (let i = 0; i < 5; i++) {
      const n = bi.n - i;
      parts.push('#' + String(1000 + n).padStart(5, '0') + ' ' + recs[Math.abs(n * 7) % recs.length]);
    }
    micro(parts.join('     '), 120, H - 40, { color: ink, alpha: light ? 0.34 : 0.3, size: T.micro });
    meta(sec.name.slice(0, 8).toUpperCase(), W - 120, H - 40,
      { align: 'right', color: ink, alpha: light ? 0.42 : 0.36, size: T.micro, ls: 4 });
  }

`;
s = s.slice(0, A) + NEW + s.slice(B);
fs.writeFileSync(p, s);
console.log('ui.js chrome/hud rewritten', s.length);
