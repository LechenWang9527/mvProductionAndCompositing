// 87 镜逐镜审计：每镜取中点出图 → 拼两张 contact sheet（带镜号/时间标注）
import { execFileSync } from 'child_process';
import fs from 'fs';
import path from 'path';

const root = 'E:/新建文件夹/实习/MV';
const py = 'C:/Users/WangLC/.dsh/dsh-runtimes/dsh-primary-runtime/dependencies/python/python.exe';

// --- 读 shots.js（浏览器脚本，赋给 window.SHOTS）---
const src = fs.readFileSync(path.join(root, 'film/data/shots.js'), 'utf8');
const win = {};
new Function('window', src)(win);
const SHOTS = win.SHOTS;
if (!SHOTS || SHOTS.length !== 87) throw new Error('shots.js load failed: ' + (SHOTS && SHOTS.length));

const items = SHOTS.map((s) => ({
  n: s.n,
  t: Math.round((s.t + s.dur * 0.5) * 100) / 100,
  sec: s.sec,
  style: s.style,
}));

const out = execFileSync('node', [path.join(root, 'film/stills.mjs'), ...items.map((i) => String(i.t))], {
  cwd: root, encoding: 'utf8', maxBuffer: 1 << 26,
});
const bad = out.split('\n').filter((l) => l.includes('error'));
console.log('rendered', items.length, 'bad:', bad.length ? bad.join('\n') : 'none');

const script = `
import os, json
from PIL import Image, ImageDraw
root = r"${root}"
items = json.loads(r'''${JSON.stringify(items)}''')
W, H, COLS = 320, 180, 6
per = 44
for page in range(2):
    chunk = items[page*per:(page+1)*per]
    rows = (len(chunk)+COLS-1)//COLS
    sheet = Image.new("RGB", (W*COLS, H*rows), (12,12,14))
    d = ImageDraw.Draw(sheet)
    for i, it in enumerate(chunk):
        f = os.path.join(root, "out/stills", ("t%06.2f.png" % it["t"]))
        x, y = (i % COLS)*W, (i // COLS)*H
        if not os.path.exists(f):
            print("MISSING", f)
        if os.path.exists(f):
            im = Image.open(f).convert("RGB").resize((W, H), Image.LANCZOS)
            sheet.paste(im, (x, y))
        d.text((x+5, y+4), "#%d %s" % (it["n"], it["sec"][:8]), fill=(255,210,60))
        d.text((x+5, y+H-14), "%.1fs %s" % (it["t"], it["style"][:14]), fill=(120,220,255))
    p = os.path.join(root, "out/audit_%d.jpg" % (page+1))
    sheet.save(p, quality=85)
    print("sheet", p, sheet.size)
`;
fs.writeFileSync(path.join(root, 'out/_audit.py'), script, 'utf8');
console.log(execFileSync(py, [path.join(root, 'out/_audit.py')], { encoding: 'utf8' }).trim());
