// patch_gen_hang.mjs —— 把已到的 2 张 ChatGPT 插画接进对应镜头
// IMG01_dufu → #3（杜甫木刻大字镜，右侧人像窗）  IMG02_hut → #8（茅屋剖面，背景插图窗）
// 其余 9 张未到，走自动占位逻辑（不画框），图到了放 film/media/gen/ 就自动生效。
import fs from 'fs';

const SF = 'E:/新建文件夹/实习/MV/film/src/shotfilm.js';
let sf = fs.readFileSync(SF, 'utf8');

// 通用插图窗已存在（insetWindow / q.inset / q.insetLabel / q.insetAlpha / q.insetTone）
// 只是给它加 GEN 目录感知：inset id 以 IMG 开头时 tone 用 ancient（木刻件本来就接近双色）。

// 1) PLAN #3 加插图窗（杜甫像放右上，半透压印）
const p3 = `    3: { k: 'swissBlocks', p: { text: '我是过来人' } },`;
if (sf.includes(p3)) {
  sf = sf.replace(p3, `    3: { k: 'swissBlocks', p: { text: '我是过来人', inset: 'IMG01_dufu', insetLabel: 'DU FU · 木刻像', insetAlpha: 0.42, insetTone: 'ancient' } },`);
} else {
  console.log('PLAN 3 already wired or not found');
}

// 2) PLAN #8 加茅草屋（thatchProfile 背景）
const p8 = `    8: { k: 'thatchProfile', p: {} },`;
if (sf.includes(p8)) {
  sf = sf.replace(p8, `    8: { k: 'thatchProfile', p: { inset: 'IMG02_hut', insetLabel: 'HUT · 茅屋', insetAlpha: 0.5, insetTone: 'ancient' } },`);
} else {
  console.log('PLAN 8 already wired or not found');
}
fs.writeFileSync(SF, sf, 'utf8');
console.log('shotfilm: IMG01→#3, IMG02→#8 wired');

// 3) insetWindow 已支持任意 id —— 但浅纸底上 ancient 色调照片已由 plate() 内部处理，
//    无需改 layouts。这里只验证 photo.js 有 GEN 槽位（patch_gen_load.mjs 已完成）。
const PH = 'E:/新建文件夹/实习/MV/film/src/photo.js';
let ph = fs.readFileSync(PH, 'utf8');
console.log('photo.js GEN ids present:', ph.includes('IMG01_dufu'));
