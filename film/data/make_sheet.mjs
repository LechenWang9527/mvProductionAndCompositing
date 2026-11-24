// 全片抽帧 → 拼 contact sheet，用于整体观感复核
// 用法：node film/data/make_sheet.mjs
import { execFileSync } from 'child_process';
import fs from 'fs';
import path from 'path';

const root = 'E:/新建文件夹/实习/MV';
const py = 'C:/Users/WangLC/.dsh/dsh-runtimes/dsh-primary-runtime/dependencies/python/python.exe';

const TS = [];
for (let t = 6; t < 305; t += 9.6) TS.push(Math.round(t * 10) / 10);

console.log('stills:', TS.join(' '));
const out = execFileSync('node', [path.join(root, 'film/stills.mjs'), ...TS.map(String)], {
  cwd: root, encoding: 'utf8', maxBuffer: 1 << 26,
});
console.log(out.split('\n').filter((l) => l.includes('still t=') || l.includes('error')).join('\n'));

// 用 Python + PIL 拼 4 列网格（每张缩到 480x270）
const script = `
import sys, glob, os
from PIL import Image
root = r"${root}"
ts = ${JSON.stringify(TS)}
files = [os.path.join(root, "out/stills", f"t{t:.2f}.png") for t in ts]
files = [f for f in files if os.path.exists(f)]
sel = files[::2]   # 隔一张取，控制版面
W, H = 480, 270
cols = 4
rows = (len(sel) + cols - 1) // cols
sheet = Image.new("RGB", (W*cols, H*rows), (16,16,18))
for i, f in enumerate(sel):
    im = Image.open(f).convert("RGB").resize((W, H), Image.LANCZOS)
    sheet.paste(im, ((i % cols)*W, (i // cols)*H))
p = os.path.join(root, "out/sheet_v5.jpg")
sheet.save(p, quality=88)
print("sheet:", p, sheet.size, len(sel), "frames")
`;
fs.writeFileSync(path.join(root, 'out/_sheet.py'), script, 'utf8');
const r = execFileSync(py, [path.join(root, 'out/_sheet.py')], { encoding: 'utf8' });
console.log(r.trim());
