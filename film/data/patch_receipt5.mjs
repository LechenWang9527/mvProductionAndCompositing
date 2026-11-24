// 修上一个补丁引入的 ReferenceError: Cannot access 'items' before initialization
// —— 「列头」块被插到了 const items 声明之前，却在里面引用了 items.length。
// 改成在块前声明一个常量项数。
import fs from 'fs';
const p = 'E:/新建文件夹/实习/MV/film/src/layouts.js';
let s = fs.readFileSync(p, 'utf8');

const before = `    // ---- 列头（常驻）----
    mono('项', rx + L, ry + 158, { size: 14, color: dimC, letterSpacing: 2 });`;
const after = `    // ---- 列头（常驻）----
    const ITEM_COUNT = 7;                 // 与下方 items 数组同步；此处不能读 items（尚未声明）
    mono('项', rx + L, ry + 158, { size: 14, color: dimC, letterSpacing: 2 });`;
if (!s.includes(before)) throw new Error('head anchor not found');
s = s.replace(before, after);

const b2 = `      const done = Math.max(0, Math.min(items.length, Math.floor((c.local + 0.30) / 0.26) + 1));
      mono(\`共 \${items.length} 项  ·  已打印 \${done}\`, R, ry + 132,`;
const a2 = `      const done = Math.max(0, Math.min(ITEM_COUNT, Math.floor((c.local + 0.30) / 0.26) + 1));
      mono(\`共 \${ITEM_COUNT} 项  ·  已打印 \${done}\`, R, ry + 132,`;
if (!s.includes(b2)) throw new Error('done anchor not found');
s = s.replace(b2, a2);

fs.writeFileSync(p, s);
console.log('TDZ fixed, bytes', s.length);
