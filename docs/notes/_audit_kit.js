// 一次性审计：docs/CHATGPT_IMAGE_KIT.md 里的文件名 vs 实际磁盘文件
const fs = require('fs');
const path = require('path');

const ROOT = path.resolve(__dirname, '..', '..');
const DOC = path.join(ROOT, 'docs', 'CHATGPT_IMAGE_KIT.md');
const KIT = path.join(ROOT, 'docs', 'refs', 'chatgpt_kit');
const REFS = path.join(ROOT, 'docs', 'refs');
const DOCS = path.join(ROOT, 'docs');

const out = [];
const log = (s) => out.push(s);

const md = fs.readFileSync(DOC, 'utf8');
const kitFiles = fs.readdirSync(KIT);
const refsFiles = fs.readdirSync(REFS);
const docsFiles = fs.readdirSync(DOCS);

// 1) 抽取文档里出现的所有候选文件名
const re = /[A-Za-z0-9_\-\u4e00-\u9fa5]+\.(?:jpg|jpeg|png|json)\b/g;
const hits = [...md.matchAll(re)].map(m => m[0]);
const uniq = [...new Set(hits)].sort();

log('=== 1. 文档里出现的文件名 (' + uniq.length + ' 个唯一) ===');
const missing = [];
for (const f of uniq) {
  let where = '';
  if (kitFiles.includes(f)) where = 'chatgpt_kit';
  else if (refsFiles.includes(f)) where = 'docs/refs';
  else if (docsFiles.includes(f)) where = 'docs';
  else { where = 'MISSING'; missing.push(f); }
  log('  ' + (where === 'MISSING' ? '[缺失] ' : '[ok]   ') + f + '  -> ' + where);
}
log('缺失合计: ' + missing.length + (missing.length ? ' => ' + missing.join(', ') : ''));

// 2) 每条指令标题
const sec1 = [...md.matchAll(/### 第 (\d+) 条?[^\n]*?`(IMG\d+_[a-z]+)\.png`/g)].map(m => ({ cmd: +m[1], img: m[2] }));
log('\n=== 2. 「### 第 N 条 → IMGxx」标题 (' + sec1.length + ' 条) ===');
log('  ' + sec1.map(x => '第' + x.cmd + '条=' + x.img).join(', '));

const block3 = md.split('## 3.')[1] || '';
const b3 = [...block3.matchAll(/IMG\d+_[a-z]+\.png/g)].map(m => m[0].replace('.png', ''));
log('\n=== 2b. 第 3 节重命名清单 (' + b3.length + ' 个) ===');
log('  ' + b3.join(', '));

const block0 = md.split('## 0.')[1].split('## 1.')[0];
const t0rows = block0.split('\n').filter(l => l.trim().startsWith('|') && !/^\|[\s|:-]+\|?$/.test(l.trim()));
log('\n=== 2c. 第 0 节表格 ===');
log('  行数(含表头)=' + t0rows.length + '  数据行=' + (t0rows.length - 1));

const EXPECT = ['IMG01_dufu','IMG02_hut','IMG03_changan','IMG04_hall','IMG05_liubang','IMG06_wine','IMG07_hand','IMG08_battle','IMG09_banner','IMG10_road','IMG11_noodle'];
log('\n=== 2d. 编号集合对比 ===');
const A = new Set(sec1.map(x => x.img));
const B = new Set(b3);
log('  标题集合=' + A.size + '  第3节集合=' + B.size);
log('  标题缺: ' + (EXPECT.filter(x => !A.has(x)).join(',') || '(无)'));
log('  第3节缺: ' + (EXPECT.filter(x => !B.has(x)).join(',') || '(无)'));
log('  仅在标题: ' + ([...A].filter(x => !B.has(x)).join(',') || '(无)'));
log('  仅在第3节: ' + ([...B].filter(x => !A.has(x)).join(',') || '(无)'));
const dupTitle = sec1.map(x => x.img).filter((v, i, a) => a.indexOf(v) !== i);
log('  标题重号: ' + (dupTitle.join(',') || '(无)'));

// 4) 每条指令提到的邻帧
log('\n=== 4. 每条指令实际写的两张邻帧 ===');
const cmdBlocks = [...md.matchAll(/### 第 (\d+) 条 → 存成 `(IMG\d+_[a-z]+)\.png`([\s\S]*?)(?=\n### |\n## )/g)];
const docPairs = {};
for (const b of cmdBlocks) {
  const files = [...b[3].matchAll(/(N\d\d_[a-z]+_[ab]_t\d+\.jpg)/g)].map(m => m[1]);
  docPairs[b[2]] = files;
  log('  第' + b[1] + '条 ' + b[2] + ' -> ' + (files.length ? files.join(' + ') : '(未找到邻帧!)'));
}

// 5) 孤儿 / 缺
const plan = JSON.parse(fs.readFileSync(path.join(KIT, '_upload_plan.json'), 'utf8')).plan;
log('\n=== 5. kit 孤儿文件 & 缺文件 ===');
const used = new Set();
for (const p of plan) { used.add(p.anchor); p.neighbours.forEach(n => used.add(n)); }
used.add('R1_woodcut_ancient.jpg'); used.add('R2_ancient_paper.jpg'); used.add('R4_marpol_dark.jpg');
const orphan = kitFiles.filter(f => !used.has(f) && !f.startsWith('_'));
log('  kit 里未被任何指令/总纲使用: ' + (orphan.join(', ') || '(无)'));
const planMissing = [];
for (const p of plan) {
  if (!kitFiles.includes(p.anchor)) planMissing.push('anchor:' + p.anchor);
  p.neighbours.forEach(n => { if (!kitFiles.includes(n)) planMissing.push(n); });
}
log('  _upload_plan 指向不存在文件: ' + (planMissing.join(', ') || '(无)'));

// 6) §6 数量
const cnt = (d) => { try { return fs.readdirSync(path.join(REFS, d)).length; } catch (e) { return 'ERR:' + e.code; } };
log('\n=== 6. §6 声称数量 vs 实际 ===');
log('  chatgpt_kit 条目=' + kitFiles.length + ' (图 ' + kitFiles.filter(f => !f.startsWith('_')).length + ' + json ' + kitFiles.filter(f => f.startsWith('_')).length + ')');
log('  film_frames=' + cnt('film_frames') + '  style_ref=' + cnt('style_ref') + '  gen_refs=' + cnt('gen_refs'));

// 7) 路径
log('\n=== 7. 路径检查 ===');
md.split('\n').forEach((l, i) => { if (/M V/.test(l)) log('  第' + (i + 1) + '行 含 "M V": ' + l.trim()); });
log('  "M V" 目录存在? ' + fs.existsSync('E:\\新建文件夹\\实习\\M V'));
log('  kit 目录存在? ' + fs.existsSync(KIT));

// 8) 图片链接
log('\n=== 8. 文档内相对图片链接 ===');
[...md.matchAll(/!\[[^\]]*\]\(([^)]+)\)/g)].map(m => m[1]).forEach(l => {
  log('  ' + l + ' -> ' + (fs.existsSync(path.join(DOCS, l)) ? 'ok' : 'MISSING'));
});

console.log(out.join('\n'));
