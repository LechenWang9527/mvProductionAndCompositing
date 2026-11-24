// receipt 第五轮：修纵向结构
// 问题：明细 7 行 × 60 从 ry+196 排到 ry+734，TOTAL 在 ry+650（会压住最后两行），
//       票尾块固定 fy = ry+rh-250 = ry+818（和 TOTAL 挤在一起），「共 N 项」又塞在列头里。
// 改法：行距 60→54、明细起点 ry+188；票尾块从 TOTAL 之后按 ty 顺排（不再用 ry+rh 定位），
//       票尾行数 5→4 行 × 34，「共 N 项 · 已打印」从列头移到 TOTAL 上方右对齐。
import fs from 'fs';
const p = 'E:/新建文件夹/实习/MV/film/src/layouts.js';
let s = fs.readFileSync(p, 'utf8');

// 1) 明细行距与起点
s = s.replace(`      const y = ry + 196 + i * 60;`, `      const y = ry + 188 + i * 54;`);

// 2) 列头不再塞「共 N 项」
const beforeHead = `    // 「打印中 / 已打印 N 项」——随行数走，填住右侧空档
    {
      const done = Math.max(0, Math.min(ITEM_COUNT, Math.floor((c.local + 0.30) / 0.26) + 1));
      mono(\`共 \${ITEM_COUNT} 项  ·  已打印 \${done}\`, R, ry + 132,
        { size: 15, align: 'right', color: dimC, letterSpacing: 2 });
    }
`;
if (!s.includes(beforeHead)) throw new Error('head print anchor not found');
s = s.replace(beforeHead, '');

// 3) TOTAL 位置 + 「共 N 项」挪到 TOTAL 上方
const beforeTotal = `      const ty = ry + 196 + items.length * 60 + 34;`;
const afterTotal = `      const ty = ry + 188 + items.length * 54 + 40;
      {
        const done = Math.max(0, Math.min(ITEM_COUNT, Math.floor((c.local + 0.30) / 0.26) + 1));
        mono(\`共 \${ITEM_COUNT} 项  ·  已打印 \${done}\`, R, ty - 52,
          { size: 14, align: 'right', color: dimC, letterSpacing: 2 });
      }`;
if (!s.includes(beforeTotal)) throw new Error('total anchor not found');
s = s.replace(beforeTotal, afterTotal);

// 4) 票尾块：锚到 TOTAL 之后，不再用 ry+rh 固定
const beforeFoot = `      const fy = ry + rh - 250;`;
const afterFoot = `      const fy = (ry + 188 + ITEM_COUNT * 54 + 40) + 96;   // 跟在 TOTAL 之后顺排`;
if (!s.includes(beforeFoot)) throw new Error('footer anchor not found');
s = s.replace(beforeFoot, afterFoot);
// 票尾行距 40→34，行数 5→4（去掉「发票抬头」）
s = s.replace(`        const y = fy + 34 + i * 40;`, `        const y = fy + 28 + i * 34;`);
s = s.replace(`        ['服务热线', '400-1000-1001'],
        ['发票抬头', '本人（未开）'],`, `        ['服务热线', '400-1000-1001'],`);

fs.writeFileSync(p, s);
console.log('receipt v5, bytes', s.length);
