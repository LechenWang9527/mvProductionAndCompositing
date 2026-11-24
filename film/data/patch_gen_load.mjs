// patch_gen_load.mjs —— photo.js 支持 film/media/gen/ 的 11 张插画（IMG01–IMG11）
// 做法：load() 在读 P01–P08 之外，再 fetch media/gen/gen_manifest2.json；没有就按约定名自动补。
import fs from 'fs';

const P = 'E:/新建文件夹/实习/MV/film/src/photo.js';
let s = fs.readFileSync(P, 'utf8');

const OLD = `    if (!Array.isArray(list)) list = [];
    MANIFEST = list;`;

const NEW = `    if (!Array.isArray(list)) list = [];
    // 插画槽位（IMG01–IMG11，用户用 ChatGPT 生成的图）：
    // 有 gen_manifest2.json 就按它来；没有就按约定文件名自动注册，缺哪张少哪张。
    try {
      const res2 = await fetch('media/gen/gen_manifest2.json', { cache: 'no-store' });
      if (res2.ok) {
        const gen = await res2.json();
        if (Array.isArray(gen)) list = list.concat(gen);
      }
    } catch (e2) { /* gen 清单缺失不致命 */ }
    const GEN_IDS = ['IMG01_dufu','IMG02_hut','IMG03_changan','IMG04_hall','IMG05_liubang',
      'IMG06_wine','IMG07_hand','IMG08_battle','IMG09_banner','IMG10_road','IMG11_noodle'];
    for (const gid of GEN_IDS) {
      if (!list.some((it) => it.id === gid)) {
        list.push({ id: gid, file: gid + '.png', dir: 'media/gen/' });
      }
    }
    MANIFEST = list;`;

if (!s.includes(OLD)) throw new Error('manifest block not found');
s = s.replace(OLD, NEW);

// img.src 支持 dir 前缀（默认 media/photos/）
const OLDSRC = `      img.src = 'media/photos/' + it.file;`;
if (!s.includes(OLDSRC)) throw new Error('src line not found');
s = s.replace(OLDSRC, `      img.src = (it.dir || 'media/photos/') + it.file;`);

fs.writeFileSync(P, s, 'utf8');
console.log('photo.js: GEN slots wired (11 ids, dir-aware src)');

// ---------- 同步：把已存在的两张 ChatGPT 图登记进 gen_manifest2.json ----------
const GEN = 'E:/新建文件夹/实习/MV/film/media/gen';
const entries = [
  { id: 'IMG01_dufu', file: 'IMG01_dufu.png' },
  { id: 'IMG02_hut', file: 'IMG02_hut.png' },
];
fs.writeFileSync(GEN + '/gen_manifest2.json', JSON.stringify(entries, null, 2), 'utf8');
console.log('gen_manifest2.json written:', entries.map((e) => e.file).join(', '));
