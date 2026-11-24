// 修 badgeSweep 的三处几何问题：标题撞 HUD、歌词压到第三行工牌、照片窗太平
import fs from 'fs';
const p = 'E:/新建文件夹/实习/MV/film/src/layouts4.js';
let s = fs.readFileSync(p, 'utf8');

const before = `    const cols = 4, rows = 3, cage = 3;
    const pad = 42;
    const gw = W - 2 * M - 120;
    const bw = (gw - pad * (cols - 1)) / cols;
    const bh = 210;
    const gapY = 40;
    const x0 = M + 60;
    const y0 = (H - (bh * rows + gapY * (rows - 1))) / 2 - 20;`;
const after = `    const cols = 4, rows = 3;
    const pad = 36;
    const gw = W - 2 * M - 60;
    const bw = (gw - pad * (cols - 1)) / cols;
    const bh = 176;
    const gapY = 34;
    const x0 = M + 30;
    const y0 = (H - (bh * rows + gapY * (rows - 1))) / 2 - 44;`;
if (!s.includes(before)) throw new Error('grid anchor not found');
s = s.replace(before, after);

// 照片窗：高度跟着卡片走，并给窗内加一层细网点让它不空
const bwBefore = `        // 照片窗（空白，12 张都没有脸）
        const pw = bw - 28, ph = 96;
        ctx.save();
        ctx.globalAlpha = 0.5 + lit * 0.45;
        ctx.strokeStyle = \`rgba(180,175,160,\${0.35 + lit * 0.4})\`;
        ctx.strokeRect(x + 14.5, y + 14.5, pw, ph);
        ctx.globalAlpha = 0.1 + lit * 0.12;
        ctx.fillStyle = pal.ink;
        ctx.fillRect(x + 14, y + 14, pw, ph);
        ctx.restore();`;
const bwAfter = `        // 照片窗（空白，12 张都没有脸）—— 空但不平：填网点 + 内框 + 左下缺角
        const pw = bw - 24, ph = 84;
        const px = x + 12, py = y + 12;
        ctx.save();
        ctx.globalAlpha = 0.10 + lit * 0.10;
        ctx.drawImage(K.halftone(pw, ph, 4, 1.6, pal.ink, 3 + idx), px, py, pw, ph);
        ctx.restore();
        ctx.save();
        ctx.globalAlpha = 0.5 + lit * 0.45;
        ctx.strokeStyle = \`rgba(180,175,160,\${0.30 + lit * 0.40})\`;
        ctx.lineWidth = 1;
        ctx.strokeRect(px + 0.5, py + 0.5, pw, ph);
        // 左下缺角：提示「照片位待补」
        ctx.globalAlpha = 0.30 + lit * 0.35;
        ctx.beginPath();
        ctx.moveTo(px, py + ph - 14);
        ctx.lineTo(px + 14, py + ph);
        ctx.stroke();
        ctx.restore();`;
if (!s.includes(bwBefore)) throw new Error('photo window anchor not found');
s = s.replace(bwBefore, bwAfter);

// 工号/名牌线跟着新 ph 走
s = s.replace(`        text('#' + String(100 + idx + 1).padStart(4, '0'), x + 14, y + ph + 46,`,
              `        text('#' + String(100 + idx + 1).padStart(4, '0'), x + 12, y + ph + 44,`);
s = s.replace(`        ctx.fillRect(x + 14, y + ph + 62, pw * 0.62, 2);
        ctx.fillRect(x + 14, y + ph + 74, pw * 0.42, 2);`,
              `        ctx.fillRect(x + 12, y + ph + 58, pw * 0.62, 2);
        ctx.fillRect(x + 12, y + ph + 70, pw * 0.42, 2);`);

// 标题：从 y0-74（撞 HUD）挪到 y=150 与其他角标同一安全带
const titleBefore = `    // 标题：一 盏 灯
    ctx.save();
    ctx.globalAlpha = 0.8;
    text('一 盏 灯', W / 2, y0 - 74, { size: 30, fam: 'serif', color: pal.ink, align: 'center', letterSpacing: 10 });
    ctx.restore();`;
const titleAfter = `    // 标题：一 盏 灯（放在 y=150 安全带，不与顶部 HUD 相撞）
    ctx.save();
    ctx.globalAlpha = 0.78;
    text('一 盏 灯', W / 2, 150, { size: 26, fam: 'serif', color: pal.ink, align: 'center', letterSpacing: 10 });
    ctx.restore();`;
if (!s.includes(titleBefore)) throw new Error('title anchor not found');
s = s.replace(titleBefore, titleAfter);

// 歌词：从 H-200 抬到 H-150，避开第三行工牌底边
s = s.replace(`    lyric(K.lineAt(c.t), c.t, pal, { y: H - 200, size: 48, unsung: 0.4 });`,
              `    lyric(K.lineAt(c.t), c.t, pal, { y: H - 150, size: 46, unsung: 0.42 });`);

fs.writeFileSync(p, s);
console.log('badgeSweep geometry fixed, bytes', s.length);
