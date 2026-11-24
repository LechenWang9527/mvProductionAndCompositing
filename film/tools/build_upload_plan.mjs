// 把每张图要上传的「风格锚点 + 前后邻帧」都复制进 chatgpt_kit，用户只需打开一个文件夹
import fs from 'fs';
import path from 'path';

const ROOT = 'E:/新建文件夹/实习/MV';
const REF = path.join(ROOT, 'docs/refs');
const KIT = path.join(REF, 'chatgpt_kit');
const FR = path.join(REF, 'film_frames');

// 每张目标图：[编号, 锚点(风格参考), 前帧, 后帧]
const JOBS = [
  ['N01_dufu',     'R1_woodcut_ancient.jpg', 31, 39],
  ['N02_hut',      'R1_woodcut_ancient.jpg', 39, 43],
  ['N03_changan',  'R1_woodcut_ancient.jpg', 35, 39],
  ['N04_hall',     'R1_woodcut_ancient.jpg', 41, 45],
  ['N05_liubang',  'R1_woodcut_ancient.jpg', 92, 97],
  ['N06_wine',     'R1_woodcut_ancient.jpg', 97, 102],
  ['N07_hand',     'R1_woodcut_ancient.jpg', 100, 102],
  ['N08_battle',   'R1_woodcut_ancient.jpg', 112, 114],
  ['N09_banner',   'R1_woodcut_ancient.jpg', 128, 130],
  ['N10_road',     'R4_marpol_dark.jpg',     288, 291],
  ['N11_noodle',   'R4_marpol_dark.jpg',     64, 67],
];

const index = [];
for (const [id, anchor, a, b] of JOBS) {
  const rows = [];
  for (const [suffix, sec] of [['a', a], ['b', b]]) {
    const src = path.join(FR, 't%04d.jpg'.replace('%04d', String(sec).padStart(4, '0')));
    if (!fs.existsSync(src)) { console.log('MISS', id, sec); continue; }
    const dst = `${id}_${suffix}_t${String(sec).padStart(4, '0')}.jpg`;
    fs.copyFileSync(src, path.join(KIT, dst));
    rows.push(dst);
  }
  index.push({ id, anchor, neighbours: rows });
}

fs.writeFileSync(
  path.join(KIT, '_upload_plan.json'),
  JSON.stringify({ note: '每张目标图上传：anchor 1 张 + neighbours 2 张', plan: index }, null, 2),
  'utf8',
);
console.log('ordered upload plan built:', index.length);
for (const r of index) console.log(' ', r.id, '|', r.anchor, '|', r.neighbours.join(' '));
