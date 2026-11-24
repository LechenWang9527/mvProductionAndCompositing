// Extract the "风格提示词" section (Chinese part only) + pitfalls for a chosen set of ids.
const fs = require('fs');
const path = require('path');
const ROOT = 'E:/新建文件夹/实习/MV/ref_prompts/skills/code-animation-prompts';
const cat = JSON.parse(fs.readFileSync(path.join(ROOT, 'references/catalog.json'), 'utf8'));
const byId = Object.fromEntries(cat.entries.map(e => [e.id, e]));

const ids = process.argv.slice(2);
const out = [];
for (const id of ids) {
  const e = byId[id];
  if (!e) { out.push(`### ${id} NOT FOUND`); continue; }
  const txt = fs.readFileSync(path.join(ROOT, e.file), 'utf8');
  const lines = txt.split(/\r?\n/);
  // grab from "## 风格提示词" to next "## " heading that isn't it
  let start = lines.findIndex(l => /^##\s*风格提示词/.test(l));
  let end = lines.length;
  if (start >= 0) {
    for (let i = start + 1; i < lines.length; i++) {
      if (/^##\s/.test(lines[i]) || /^---\s*$/.test(lines[i])) { end = i; break; }
    }
  }
  const body = start >= 0 ? lines.slice(start + 1, end).join('\n') : '(no 风格提示词 section)';
  // cut at "English:" to save tokens
  const zh = body.split(/\n\s*English\s*:/)[0].trim();
  out.push(`===== ${id} | ${e.name} | ${e.series} | still=${fs.existsSync(path.join(ROOT, e.image || 'x')) ? 1 : 0} =====\n${zh}\n`);
}
console.log(out.join('\n'));
