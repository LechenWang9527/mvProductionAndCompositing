// Read-only statistics over ref_prompts library. Writes only into .scout/refp/.
const fs = require('fs');
const path = require('path');

const ROOT = 'E:/新建文件夹/实习/MV/ref_prompts/skills/code-animation-prompts';
const cat = JSON.parse(fs.readFileSync(path.join(ROOT, 'references/catalog.json'), 'utf8'));
const entries = cat.entries;

const out = { meta: { total: cat.total, with_still: cat.with_still, series: cat.series }, entries: [] };

// classify each entry's markdown
function analyze(fileRel) {
  const p = path.join(ROOT, fileRel);
  let txt = '';
  try { txt = fs.readFileSync(p, 'utf8'); } catch (e) { return { missing: true }; }
  const lines = txt.split(/\r?\n/);
  const fences = (txt.match(/^```/gm) || []).length;
  const codeLangs = [...txt.matchAll(/^```(\w[\w+-]*)/gm)].map(m => m[1].toLowerCase());
  const hasHtml = /<canvas|<svg|<!DOCTYPE|<html/i.test(txt);
  const hasCanvasApi = /getContext|requestAnimationFrame|ctx\./i.test(txt);
  const hasCssAnim = /@keyframes|animation:|transform:/i.test(txt);
  const hasThree = /three\.js|THREE\.|WebGL/i.test(txt);
  const hasPromptBlocks = /\{\{|\*\*提示词|## 提示词|prompt/i.test(txt);
  return {
    bytes: Buffer.byteLength(txt, 'utf8'),
    lines: lines.length,
    fences,
    codeLangs,
    hasCode: fences >= 2,
    hasHtml, hasCanvasApi, hasCssAnim, hasThree,
    mentionsPrompt: hasPromptBlocks,
  };
}

for (const e of entries) {
  const a = analyze(e.file);
  const imgPath = e.image ? path.join(ROOT, e.image) : null;
  const imgExists = imgPath ? fs.existsSync(imgPath) : false;
  out.entries.push({
    id: e.id, name: e.name, series: e.series, category: e.category,
    desc: e.description, fit: e.fit, tags: e.tags,
    hasImageField: !!e.image, imgExists,
    ...a,
  });
}

// aggregate
const bySeries = {};
const byCategory = {};
for (const e of out.entries) {
  const s = bySeries[e.series] ??= { n: 0, code: 0, still: 0 };
  s.n++; if (e.hasCode) s.code++; if (e.imgExists) s.still++;
  const c = byCategory[e.category] ??= { n: 0, code: 0, still: 0, series: e.series };
  c.n++; if (e.hasCode) c.code++; if (e.imgExists) c.still++;
}
// leading letter breakdown (A..Z)
const byLetter = {};
for (const e of out.entries) {
  const L = (e.id.match(/^[A-Z]+/) || ['?'])[0];
  const b = byLetter[L] ??= { n: 0, code: 0, still: 0, ids: [] };
  b.n++; if (e.hasCode) b.code++; if (e.imgExists) b.still++;
  if (b.ids.length < 2) b.ids.push(e.id);
}

out.bySeries = bySeries;
out.byCategory = byCategory;
out.byLetter = byLetter;
out.totals = {
  n: out.entries.length,
  code: out.entries.filter(e => e.hasCode).length,
  still: out.entries.filter(e => e.imgExists).length,
  noStill: out.entries.filter(e => !e.imgExists).length,
  missingMd: out.entries.filter(e => e.missing).length,
  hasHtml: out.entries.filter(e => e.hasHtml).length,
  hasCanvasApi: out.entries.filter(e => e.hasCanvasApi).length,
  hasThree: out.entries.filter(e => e.hasThree).length,
  hasCssAnim: out.entries.filter(e => e.hasCssAnim).length,
};
out.idsWithB6 = out.entries.filter(e => e.id === 'B6').length;

fs.writeFileSync('E:/新建文件夹/实习/MV/.scout/refp/stats.json', JSON.stringify(out, null, 1));

console.log('TOTAL entries:', out.totals.n, '| catalog.total:', cat.total, '| catalog.with_still:', cat.with_still);
console.log('code fences>=2:', out.totals.code, '| img on disk:', out.totals.still, '| no still:', out.totals.noStill, '| B6 in catalog:', out.idsWithB6);
console.log('\n-- by letter (id prefix) --');
for (const k of Object.keys(byLetter).sort()) {
  const b = byLetter[k];
  console.log(`${k.padEnd(3)} n=${String(b.n).padStart(3)} code=${String(b.code).padStart(3)} still=${String(b.still).padStart(3)}  e.g. ${b.ids.join(',')}`);
}
console.log('\n-- by series --');
for (const [k, v] of Object.entries(bySeries)) console.log(`${k.padEnd(4)} n=${String(v.n).padStart(3)} code=${String(v.code).padStart(3)} still=${String(v.still).padStart(3)}`);
console.log('\n-- by category --');
for (const [k, v] of Object.entries(byCategory)) console.log(`${k.padEnd(22)} n=${String(v.n).padStart(3)} code=${String(v.code).padStart(3)} still=${String(v.still).padStart(3)}`);
console.log('\nthree.js:', out.totals.hasThree, '| html:', out.totals.hasHtml, '| canvasApi:', out.totals.hasCanvasApi, '| cssAnim:', out.totals.hasCssAnim);
