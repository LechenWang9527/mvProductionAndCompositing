import fs from 'fs';
const p = 'E:/新建文件夹/实习/MV/film/src/layouts3.js';
let s = fs.readFileSync(p, 'utf8');
// 地面透视网格现在铺到画面底部，穿过了歌词所在的横带 → 把 roomDepth 裁到歌词带上方
const b = `    ctx.save();
    ctx.strokeStyle = col;
    ctx.lineWidth = 1;

    // 地平线`;
const a = `    ctx.save();
    ctx.strokeStyle = col;
    ctx.lineWidth = 1;
    // 只画到歌词带上方，避免网格穿字
    if (q.clipBottom !== false) {
      ctx.beginPath();
      ctx.rect(0, 0, W, H - 210);
      ctx.clip();
    }

    // 地平线`;
if (!s.includes(b)) throw new Error('roomDepth save anchor not found');
s = s.replace(b, a);
fs.writeFileSync(p, s);
console.log('roomDepth clipped above lyric band');
