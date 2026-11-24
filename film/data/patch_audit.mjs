// 修 shot_audit.mjs 的文件名格式：stills.mjs 写的是 t%06.2f.png（t<100 会补零），
// 审计脚本却用 t%.2f.png，导致 44 张 t<100 的帧找不到 → 拼成黑块。
import fs from 'fs';
const p = 'E:/新建文件夹/实习/MV/film/data/shot_audit.mjs';
let s = fs.readFileSync(p, 'utf8');
const before = `        f = os.path.join(root, "out/stills", "t%.2f.png" % it["t"])`;
const after = `        f = os.path.join(root, "out/stills", ("t%06.2f.png" % it["t"]))`;
if (!s.includes(before)) throw new Error('naming anchor not found');
s = s.replace(before, after);
// 顺手加一行：缺失文件要报出来，不能再静默画黑块
const before2 = `        if os.path.exists(f):`;
const after2 = `        if not os.path.exists(f):
            print("MISSING", f)
        if os.path.exists(f):`;
s = s.replace(before2, after2);
fs.writeFileSync(p, s);
console.log('naming fixed, bytes', s.length);
