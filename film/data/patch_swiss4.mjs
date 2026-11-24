// 1) 给 swissBlocks 加 chars:'lyric'（逐字时间直接取歌词表 chars[i].t，锚定镜头起始句）
// 2) 按分镜重写 #35 / #51 / #78 / #83 的 PLAN 参数
import fs from 'fs';
const root = 'E:/新建文件夹/实习/MV/';

// ---------- 1. layouts.js ----------
const p1 = root + 'film/src/layouts.js';
let s = fs.readFileSync(p1, 'utf8');

const anchor = `      } else if (P.chars === 'type') {`;
if (!s.includes(anchor)) throw new Error('type branch not found');
if (s.includes(`P.chars === 'lyric'`)) throw new Error('lyric branch already exists');

const lyricBranch = `      } else if (P.chars === 'lyric') {
        // 逐字时间直接取歌词表的 chars[i].t（锚定镜头起始那一句），分镜 #78 用
        if (!_swLine || _swLine.t0 !== c.shot.t) {
          _swLine = { t0: c.shot.t, line: lineAt(c.shot.t + 0.02) };
        }
        const ch = _swLine.line && _swLine.line.chars && _swLine.line.chars[i];
        const at = ch ? ch.t : c.shot.t + i * stagger;
        a = ease.out(clamp((c.t - at) / 0.2, 0, 1));
      `;
s = s.replace(anchor, lyricBranch + anchor);

// 模块级缓存声明
const fnHead = `  LAYOUTS.swissBlocks = function (c) {`;
if (!s.includes(fnHead)) throw new Error('swissBlocks head not found');
if (!s.includes('let _swLine')) {
  s = s.replace(fnHead, `  let _swLine = null;\n` + fnHead);
}
fs.writeFileSync(p1, s);
console.log('layouts.js ok', s.length);

// ---------- 2. shotfilm.js ----------
const p2 = root + 'film/src/shotfilm.js';
let t = fs.readFileSync(p2, 'utf8');

const repl = [
  [
    /35: \{ k: 'swissBlocks', p: \{[^}]*\} \},/,
    `35: { k: 'swissBlocks', p: { text: '我是工艺人', chars: 'fall', stagger: 0.232, ink: 'accent', vline: true, logo: 'P04', en: false } },`,
  ],
  [
    /51: \{ k: 'swissBlocks', p: \{[^}]*\} \},/,
    `51: { k: 'swissBlocks', p: { text: '我是过来人', chars: 'stamp', stagger: 0.232, bg: 'yellowUp', ink: 'bg' } },`,
  ],
  [
    /78: \{ k: 'swissBlocks', p: \{[^}]*\} \},/,
    `78: { k: 'swissBlocks', p: { text: '我是过来人', chars: 'lyric', bg: 'yellowRamp', rampAt: 1.75, rampDur: 1.2, ink: 'bg', rise: 6 } },`,
  ],
  [
    /83: \{ k: 'swissBlocks', p: \{[^}]*\} \},/,
    `83: { k: 'swissBlocks', p: { text: '我是工艺人', chars: 'sync', sub: '站在卓越路上 追着共同的梦', ink: 'accent', photo: 'P03', photoAlpha: 0.72, photoScrim: 0.46, horizon: true, logo: 'P04' } },`,
  ],
];
for (const [re, str] of repl) {
  if (!re.test(t)) throw new Error('PLAN line not found: ' + re);
  t = t.replace(re, str);
}
fs.writeFileSync(p2, t);
console.log('shotfilm.js ok', t.length);
