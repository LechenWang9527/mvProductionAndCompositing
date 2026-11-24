const fs = require('fs');
const path = require('path');
const ROOT = 'E:/新建文件夹/实习/MV/ref_prompts/skills/code-animation-prompts';
const cat = JSON.parse(fs.readFileSync(path.join(ROOT, 'references/catalog.json'), 'utf8'));
const S = JSON.parse(fs.readFileSync('E:/新建文件夹/实习/MV/.scout/refp/stats.json', 'utf8'));
const byId = Object.fromEntries(S.entries.map(e => [e.id, e]));

// per-series digest
const groups = {};
for (const e of cat.entries) {
  const s = byId[e.id] || {};
  const line = `${e.id}|${e.name}|${(e.description||'').replace(/\|/g,'/')}|${(e.fit||'').replace(/\|/g,'/')}|${(e.tags||[]).join(',')}|still=${s.imgExists?1:0}|code=${s.hasCode?1:0}`;
  (groups[e.series] ??= []).push(line);
}
for (const [k, v] of Object.entries(groups)) {
  fs.writeFileSync(`E:/新建文件夹/实习/MV/.scout/refp/digest_${k}.txt`, v.join('\n') + '\n');
}

// which L/Z entries have code fences
const codeExtras = S.entries.filter(e => e.hasCode && !['AG','V'].includes(e.series));
console.log('== entries with code fences outside AG/V ==');
for (const e of codeExtras) console.log(e.id, e.name, 'fences=', e.fences, 'langs=', (e.codeLangs||[]).join(','), 'three=', e.hasThree, 'canvas=', e.hasCanvasApi);

// empty or suspicious names
console.log('\n== empty names ==');
for (const e of S.entries) if (!e.name || !e.name.trim()) console.log(e.id, '|series', e.series, '|', e.file);

// placeholder usage
const ph = S.entries.filter(e => e.mentionsPrompt).length;
console.log('\nentries mentioning prompt/{{}}:', ph);
console.log('bytes: min', Math.min(...S.entries.map(e=>e.bytes||0)), 'max', Math.max(...S.entries.map(e=>e.bytes||0)), 'mean', Math.round(S.entries.reduce((a,e)=>a+(e.bytes||0),0)/S.entries.length));
console.log('lines: min', Math.min(...S.entries.map(e=>e.lines||0)), 'max', Math.max(...S.entries.map(e=>e.lines||0)));
// per series md byte totals
const bt = {};
for (const e of S.entries) { bt[e.series] ??= {b:0,n:0}; bt[e.series].b += e.bytes||0; bt[e.series].n++; }
console.log('\n== bytes per series ==');
for (const [k,v] of Object.entries(bt)) console.log(k, v.n, 'entries', Math.round(v.b/1024)+'KB', 'avg', Math.round(v.b/v.n));
