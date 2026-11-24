// Smarter extractor: per-series strategy, token-bounded.
const fs = require('fs');
const path = require('path');
const ROOT = 'E:/新建文件夹/实习/MV/ref_prompts/skills/code-animation-prompts';
const cat = JSON.parse(fs.readFileSync(path.join(ROOT, 'references/catalog.json'), 'utf8'));
const byId = Object.fromEntries(cat.entries.map(e => [e.id, e]));

const CH = +process.argv[2] || 1400;
const ids = process.argv.slice(3);

function sections(lines) {
  // split into {head, body[]} where head = "## ..." else '(intro)'
  const out = []; let cur = { head: '(intro)', body: [] };
  for (const l of lines) {
    const m = l.match(/^##\s+(.*)$/);
    if (m) { out.push(cur); cur = { head: m[1].trim(), body: [] }; }
    else cur.body.push(l);
  }
  out.push(cur);
  return out;
}

const res = [];
for (const id of ids) {
  const e = byId[id]; if (!e) { res.push(`### ${id} NOT FOUND`); continue; }
  const txt = fs.readFileSync(path.join(ROOT, e.file), 'utf8');
  const secs = sections(txt.split(/\r?\n/));
  const still = e.image && fs.existsSync(path.join(ROOT, e.image)) ? 1 : 0;
  let buf = `===== ${id} | ${e.name} | series=${e.series} | still=${still} | "${(e.description||'').slice(0,80)}" =====\n`;

  if (e.series === 'O' || e.series === 'Z' || e.series === 'K' || e.series === 'H' || e.series === 'R' || e.series === 'X' || e.series === 'M') {
    // short-form: 风格提示词 body (zh before 'English:') + 分镜 count/pace
    const sp = secs.find(s => /风格提示词/.test(s.head));
    let body = sp ? sp.body.join('\n') : '';
    body = body.split(/\n\s*English\s*:/)[0];
    buf += body.replace(/^#.*$/gm, '').trim().slice(0, CH) + '\n';
    const sb = secs.find(s => /分镜/.test(s.head));
    if (sb) {
      const shots = sb.body.filter(l => /^\s*\d+\./.test(l));
      const durs = [...sb.body.join(' ').matchAll(/(\d+(?:\.\d+)?)\s*s/g)].map(m => m[1]);
      buf += `[分镜 ${shots.length} 镜; 时长 ${durs.join('/')}]\n`;
    }
    const js = secs.find(s => /导演说明|技法/.test(s.head));
    if (js) buf += '[note] ' + js.body.join(' ').replace(/\s+/g, ' ').trim().slice(0, 260) + '\n';
  } else {
    // long-form L/V: quote block + colour + type + pitfalls
    const sp = secs.find(s => /风格提示词/.test(s.head));
    if (sp) {
      const q = sp.body.filter(l => /^>/.test(l)).map(l => l.replace(/^>\s?/, ''));
      buf += (q.length ? q.join(' ') : sp.body.join(' ')).replace(/^#.*$/gm, '').replace(/\s+/g, ' ').trim().slice(0, 420) + '\n';
    }
    for (const s of secs) {
      if (/colour|color|颜色|彩/i.test(s.head)) buf += `[colour] ` + s.body.join(' ').replace(/\s+/g,' ').replace(/^#.*$/gm,'').trim().slice(0, 300) + '\n';
      if (/type|subtitle|字体|字幕/i.test(s.head)) buf += `[type] ` + s.body.join(' ').replace(/\s+/g,' ').replace(/^#.*$/gm,'').trim().slice(0, 320) + '\n';
      if (/pitfall|坑|avoid|避免/i.test(s.head)) buf += `[pitfall] ` + s.body.filter(l => /^\s*[-*]/.test(l)).map(l=>l.replace(/^\s*[-*]\s*/,'• ')).join(' ').replace(/\s+/g,' ').trim().slice(0, 700) + '\n';
    }
  }
  res.push(buf);
}
console.log(res.join('\n'));
