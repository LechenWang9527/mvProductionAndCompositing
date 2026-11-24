// receipt 第二轮：
//  1) 歌词换行原来逐字切，把「爸妈的体检单」切成「爸妈的体 / 检单」→ 改为优先在空格处断行，只在单段超宽时才逐字切
//  2) 票面下半部（TOTAL 出现前）大片空白 → 提前盖「已支付 / PAID」朱印 + 竖排小字，让版面从第 1 秒就成立
import fs from 'fs';
const p = 'E:/新建文件夹/实习/MV/film/src/layouts.js';
let s = fs.readFileSync(p, 'utf8');

// ---- 1) 歌词断行：空格优先 ----
const beforeLyric = `      const maxW = 430;
      const size = 46;
      const chars = ln.text.split('');
      const rows = [];
      let cur = '';
      for (const ch of chars) {
        const test = cur + ch;
        if (measure(test, size, 'serif') > maxW && cur) { rows.push(cur); cur = ch; }
        else cur = test;
      }
      if (cur) rows.push(cur);`;
const afterLyric = `      const maxW = 440;
      const size = 44;
      // 先按空格切成词，再按词累积；单个词超宽才逐字切
      const words = ln.text.split(/(\\s+)/).filter((w2) => w2.length);
      const rows = [];
      let cur = '';
      for (const w2 of words) {
        const test = cur + w2;
        if (measure(test, size, 'serif') > maxW && cur.trim()) { rows.push(cur.trimEnd()); cur = w2.trimStart(); }
        else cur = test;
      }
      if (cur.trim()) rows.push(cur.trimEnd());`;
if (!s.includes(beforeLyric)) throw new Error('lyric wrap anchor not found');
s = s.replace(beforeLyric, afterLyric);

// ---- 2) 票面下半部：早出现的「已支付」朱印 + 侧栏小字 ----
const beforeSeal = `    // ---- 左栏：本人 0.00 + 逐行歌词（宽度受限，自动换行）----`;
const afterSeal = `    // ---- 已支付朱印（0.9 s 就盖，填补 TOTAL 出现前的下半版面）----
    {
      const sk = clamp((c.local - 0.9) / 0.35, 0, 1);
      if (sk > 0) {
        const sx2 = rx + rw * 0.5, sy2 = ry + rh - 300;
        ctx.save();
        ctx.translate(sx2, sy2);
        ctx.rotate(-0.10);
        ctx.globalAlpha = 0.72 * sk;
        const ss = 1.18 - 0.18 * sk;          // 盖下去时略大，落定后收紧
        ctx.scale(ss, ss);
        ctx.strokeStyle = accC;
        ctx.lineWidth = 6;
        ctx.strokeRect(-150, -62, 300, 124);
        ctx.lineWidth = 2;
        ctx.strokeRect(-140, -52, 280, 104);
        ctx.fillStyle = accC;
        ctx.textAlign = 'center';
        ctx.font = '700 54px "Cascadia Mono", monospace';
        ctx.fillText('已 支 付', 0, -4);
        ctx.font = '400 22px "Cascadia Mono", monospace';
        ctx.letterSpacing = '8px';
        ctx.fillText('PAID · 11079.00', 0, 36);
        ctx.restore();
      }
    }
    // 票据右边竖排小字（贴着纸边，让纸不空）
    {
      const vk = clamp((c.local - 0.5) / 0.5, 0, 1);
      if (vk > 0) {
        ctx.save();
        ctx.globalAlpha = 0.34 * vk;
        ctx.translate(rx + rw - 16, ry + rh * 0.52);
        ctx.rotate(Math.PI / 2);
        text('ONE WAY · NO REFUND · KEEP THIS TICKET', 0, 0,
          { size: 13, fam: 'mono', color: inkC, align: 'center', letterSpacing: 6 });
        ctx.restore();
      }
    }

    // ---- 左栏：本人 0.00 + 逐行歌词（宽度受限，自动换行）----`;
if (!s.includes(beforeSeal)) throw new Error('seal anchor not found');
s = s.replace(beforeSeal, afterSeal);

fs.writeFileSync(p, s);
console.log('receipt v2, bytes', s.length);
