// 把 analysis/ 下的 JSON 转成浏览器直接可用的 JS 数据（避免 file:// 下 fetch 失败）
// 用法: node film/data/build_data.mjs
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const here = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(here, '../..');
const outDir = path.join(root, 'film', 'data');
fs.mkdirSync(outDir, { recursive: true });

const tl = JSON.parse(fs.readFileSync(path.join(root, 'lyrics', 'og_timing.json'), 'utf8'));
const feat = JSON.parse(fs.readFileSync(path.join(root, 'analysis', 'features_real.json'), 'utf8'));

// ---- 段落：按 section 名分组合并，边界取「上一段结束」与「本段开始」的中点 ----
const secs = [];
for (const line of tl.lines) {
  const last = secs[secs.length - 1];
  if (!last || last.name !== line.section) {
    secs.push({ name: line.section, first: line.start, last: line.end, lines: [] });
  }
  secs[secs.length - 1].last = line.end;
  secs[secs.length - 1].lines.push(line);
}
for (let i = 0; i < secs.length; i++) {
  const prev = secs[i - 1];
  const cur = secs[i];
  cur.start = prev ? (prev.last + cur.first) / 2 : 0;
  const next = secs[i + 1];
  cur.end = next ? (cur.last + next.first) / 2 : tl.duration;
}
secs.forEach((s, i) => { s.index = i; });

// ---- BPM 细节：整体落在 64.6，即半拍 129.2，两种脉冲都给出 ----
const beat = 60 / feat.bpm;

const payload = {
  duration: tl.duration,
  bpm: feat.bpm,
  beat,
  halfBeat: beat / 2,
  firstBeat: feat.first_beat,
  beats: feat.beats,
  onsets: feat.onsets,
  rms: feat.rms,
  rmsWin: feat.rms_win,
  sectionCandidates: feat.section_candidates,
  sections: secs.map((s) => ({
    index: s.index,
    name: s.name,
    start: +s.start.toFixed(3),
    end: +s.end.toFixed(3),
    lines: s.lines.map((l) => ({
      text: l.text,
      start: l.start,
      end: l.end,
      chars: l.chars,
    })),
  })),
};

const js = `// 自动生成，勿手改。源: lyrics/og_timing.json + analysis/features_real.json
// 生成器: film/data/build_data.mjs
window.TL = ${JSON.stringify(payload)};
`;
fs.writeFileSync(path.join(outDir, 'timeline.js'), js, 'utf8');

const kb = (Buffer.byteLength(js) / 1024).toFixed(1);
console.log(`[ok] film/data/timeline.js  ${kb} KB`);
console.log(`     时长 ${payload.duration}s  BPM ${payload.bpm} (beat ${payload.beat.toFixed(3)}s)`);
console.log(`     ${payload.sections.length} 段 / ${payload.sections.reduce((a, s) => a + s.lines.length, 0)} 行 / ${payload.beats.length} 拍 / ${payload.onsets.length} onset`);
for (const s of payload.sections) {
  console.log(`     ${String(s.index).padStart(2)} ${s.name.padEnd(16)} ${s.start.toFixed(2).padStart(7)} -> ${s.end.toFixed(2).padStart(7)}  ${s.lines.length} 行`);
}
