// receipt 第九轮：两个真 bug
//  A) 歌词换行用「按空格切词」处理中文 —— 中文没有空格，整行被当成一个词，永远不换行，
//     于是 11 个字直接冲进纸面（rx=620）被纸吃掉右半边。改为：先按空格切，若某段仍超宽则逐字断。
//  B) BALANCE 块（金线 300..510 / 标签 306 / 本人 452 / 其余 496）与朱印（中心 262，跨 200..324）相撞。
//     整块下移到 380..590。
import fs from 'fs';
const p = 'E:/新建文件夹/实习/MV/film/src/layouts.js';
let s = fs.readFileSync(p, 'utf8');

// A) 歌词换行
const beforeWrap = `      const maxW = 440;
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
const afterWrap = `      const maxW = 430;
      const size = 42;
      const rows = [];
      // 中文没有空格，必须能「逐字」断行；先按空格切词，词再超宽就逐字切
      const words = ln.text.split(/(\\s+)/).filter((w2) => w2.length);
      for (const wd of words) {
        if (/^\\s+$/.test(wd)) { if (rows.length) rows[rows.length - 1] += ' '; continue; }
        if (measure(wd, size, 'serif') <= maxW) {
          if (!rows.length) rows.push('');
          if (measure(rows[rows.length - 1] + wd, size, 'serif') <= maxW) rows[rows.length - 1] += wd;
          else rows.push(wd);
        } else {
          // 单段超宽：逐字
          let cur = rows.length ? rows.pop() : '';
          for (const ch of wd) {
            if (cur && measure(cur + ch, size, 'serif') > maxW) { rows.push(cur); cur = ch; }
            else cur += ch;
          }
          if (cur) rows.push(cur);
        }
      }`;
if (!s.includes(beforeWrap)) throw new Error('wrap anchor not found');
s = s.replace(beforeWrap, afterWrap);

// B) BALANCE 块下移
s = s.replace(`      ctx.fillRect(150, 300, 2, 210);
      text('BALANCE', 176, 306, { size: 15, fam: 'mono', color: '#8b8577', letterSpacing: 4 });
      text('本人 0.00', 176, 452, { size: 44, fam: 'mono', color: accC, letterSpacing: 2 });
      text('其余 11079.00', 176, 496, { size: 20, fam: 'mono', color: '#8b8577', letterSpacing: 2 });`,
              `      ctx.fillRect(150, 384, 2, 210);
      text('BALANCE', 176, 390, { size: 15, fam: 'mono', color: '#8b8577', letterSpacing: 4 });
      text('本人 0.00', 176, 534, { size: 44, fam: 'mono', color: accC, letterSpacing: 2 });
      text('其余 11079.00', 176, 578, { size: 20, fam: 'mono', color: '#8b8577', letterSpacing: 2 });`);

fs.writeFileSync(p, s);
console.log('receipt v9, bytes', s.length);
