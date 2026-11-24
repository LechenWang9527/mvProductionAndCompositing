// film/data/build_shots.mjs —— 从分镜表抽出镜头表
// 只读 film/docs/STORYBOARD.md 的表格行，产出 film/data/shots.js（window.SHOTS）
// 供 scenes.js 做「镜头级」的构图/运镜，而不是一段一张固定版式。
import fs from 'node:fs';

const MD = 'E:/新建文件夹/实习/MV/film/docs/STORYBOARD.md';
const OUT = 'E:/新建文件夹/实习/MV/film/data/shots.js';

const text = fs.readFileSync(MD, 'utf8');
const lines = text.split(/\r?\n/);

function parseTime(s) {
  // "00:15.0" / "1:02.5" → 秒
  const m = /^(\d+):(\d{2}(?:\.\d+)?)$/.exec(s.trim());
  if (!m) return null;
  return parseInt(m[1], 10) * 60 + parseFloat(m[2]);
}

const shots = [];
for (const ln of lines) {
  if (!ln.startsWith('|')) continue;
  const cells = ln.split('|').map((c) => c.trim());
  // ['', '#', '时间', '时长', '段落', '调色板', '主风格', '画面主体', '动作', '歌词行', '转场', '']
  if (cells.length < 11) continue;
  const idx = parseInt(cells[1], 10);
  if (!Number.isFinite(idx)) continue;
  const t = parseTime(cells[2]);
  if (t == null) continue;
  const dur = parseFloat(cells[3]) || 0;
  shots.push({
    n: idx,
    t,
    dur,
    sec: cells[4],
    pal: cells[5],
    style: cells[6],
    subject: cells[7].slice(0, 200),
    action: cells[8].slice(0, 400),
    lyric: cells[9].slice(0, 200),
    trans: cells[10],
  });
}

shots.sort((a, b) => a.t - b.t);
// 段名 → index
const SEC_ORDER = ['00 hook', '01 dufu', '02 dufu-son', '03 hook', '04 liubang', '05 you-too', '06 war',
  '07 ledger', '08 wind', '09 hook-marpol', '10 biwu', '11 ppt', '12 no-complaint', '13 hook-marpol',
  '14 laocao', '15 wuhan', '16 gaoxiaofan', '17 gary', '18 chuanyong', '19 allen', '20 xiaoma',
  '21 hook-marpol', '22 finale'];
shots.forEach((s) => {
  const i = SEC_ORDER.indexOf(s.sec);
  s.secIndex = i >= 0 ? i : null;
});

const payload = `// 自动生成，勿手改。源: film/docs/STORYBOARD.md
// 生成器: film/data/build_shots.mjs
window.SHOTS = ${JSON.stringify(shots)};
`;
fs.writeFileSync(OUT, payload, 'utf8');

const bySec = {};
shots.forEach((s) => { bySec[s.sec] = (bySec[s.sec] || 0) + 1; });
console.log(JSON.stringify({
  shots: shots.length,
  first: shots[0] && shots[0].t,
  last: shots[shots.length - 1] && shots[shots.length - 1].t,
  unknownSec: shots.filter((s) => s.secIndex == null).map((s) => s.sec),
  perSection: bySec,
  bytes: fs.statSync(OUT).size,
}, null, 1));
