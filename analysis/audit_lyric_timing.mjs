import { readFile, mkdir, writeFile } from 'node:fs/promises';
import { dirname, resolve, basename } from 'node:path';
import { fileURLToPath } from 'node:url';

const here = dirname(fileURLToPath(import.meta.url));
const root = resolve(here, '..');
const read = (path) => readFile(resolve(root, path), 'utf8');
const round = (value, places = 3) => Number(value.toFixed(places));
const visibleChars = (value) => [...value].filter((ch) =>
  !/\s/u.test(ch) && !/[\p{P}\p{S}]/u.test(ch));
const normalized = (value) => visibleChars(value).join('');
const csvCell = (value) => `"${String(value ?? '').replaceAll('"', '""')}"`;

function parseSourceLyrics(text) {
  const rows = [];
  let section = null;
  for (const raw of text.replace(/^\uFEFF/u, '').split(/\r?\n/u)) {
    const line = raw.trim();
    if (!line || line.startsWith('#') || line.startsWith('《')) continue;
    const match = line.match(/^\[(.+)\]$/u);
    if (match) {
      section = match[1];
      continue;
    }
    if (section) rows.push({ section, text: line });
  }
  return rows;
}

function parseLrc(text) {
  const rows = [];
  for (const raw of text.split(/\r?\n/u)) {
    const match = raw.trim().match(/^\[(\d+):(\d+(?:\.\d+)?)\](.*)$/u);
    if (!match) continue;
    rows.push({
      start: Number(match[1]) * 60 + Number(match[2]),
      text: match[3].trim(),
    });
  }
  return rows;
}

function parseSrt(text) {
  const cues = [];
  const blocks = text.trim().split(/\r?\n\s*\r?\n/u);
  const timeRe = /(\d{2}):(\d{2}):(\d{2}),(\d{3})\s*-->\s*(\d{2}):(\d{2}):(\d{2}),(\d{3})/u;
  const sec = (h, m, s, ms) => Number(h) * 3600 + Number(m) * 60 + Number(s) + Number(ms) / 1000;
  for (const block of blocks) {
    const lines = block.split(/\r?\n/u);
    const match = block.match(timeRe);
    if (!match) continue;
    cues.push({
      start: sec(match[1], match[2], match[3], match[4]),
      end: sec(match[5], match[6], match[7], match[8]),
      text: lines.slice(lines.findIndex((line) => timeRe.test(line)) + 1).join(' ').trim(),
    });
  }
  return cues;
}

function parseAlignmentLog(text) {
  const anchors = [];
  const sections = [];
  for (const line of text.split(/\r?\n/u)) {
    let match = line.match(/^\s*\[锚\]\s*(.+?)\s+ASR#\s*(\d+)\s+t=\s*([\d.]+)s\s+ratio=([\d.]+)/u);
    if (match) {
      anchors.push({ section: match[1].trim(), asrIndex: Number(match[2]), time: Number(match[3]), anchorSimilarity: Number(match[4]) });
      continue;
    }
    match = line.match(/^\s*\[段\]\s*(.+?)\s+字\s*(\d+)\s+命中\s*(\d+)\s+([\d.]+)->\s*([\d.]+)s/u);
    if (match) {
      const target = Number(match[2]);
      const matched = Number(match[3]);
      sections.push({
        section: match[1].trim(), targetChars: target, matchedChars: matched,
        coverage: target ? round(matched / target, 4) : null,
        loggedStart: Number(match[4]), loggedLastChar: Number(match[5]),
      });
    }
  }
  const input = text.match(/\[in\]\s*ASR\s*(\d+)\s*字\s*\/\s*(\d+)\s*段歌词/u);
  return {
    asrCharacterCount: input ? Number(input[1]) : null,
    lyricSectionCount: input ? Number(input[2]) : null,
    anchors,
    sectionCoverage: sections,
    lowestCoverageSections: [...sections].sort((a, b) => (a.coverage ?? 1) - (b.coverage ?? 1)).slice(0, 6),
  };
}

const timing = JSON.parse(await read('lyrics/og_timing.json'));
const sourceRows = parseSourceLyrics(await read('lyrics/og_lyrics.txt'));
const lrc = parseLrc(await read('The OGs 自动识别.lrc'));
const srt = parseSrt(await read('The OGs 自动识别.srt'));
const alignLogText = new TextDecoder('gb18030').decode(await readFile(resolve(root, 'analysis/align2.log')));
const lines = timing.lines;
const textMismatches = [];
const charArrayMismatches = [];
const invalidTimeRows = [];
const nonPositiveDurations = [];
const negativeStarts = [];
const endsPastDuration = [];
const startOrderBreaks = [];
const charOrderBreaks = [];
const lineEndConvention = [];
const lineIntervalOverlaps = [];
const charOnsetGaps = [];
const withinLineGaps = [];

if (sourceRows.length !== lines.length) {
  textMismatches.push({ type: 'count', sourceCount: sourceRows.length, timingCount: lines.length });
}

for (let i = 0; i < lines.length; i += 1) {
  const row = lines[i];
  const source = sourceRows[i];
  if (!source || source.section !== row.section || source.text !== row.text) {
    textMismatches.push({
      line: i + 1,
      source: source ?? null,
      timing: { section: row.section, text: row.text },
    });
  }
  const expectedChars = visibleChars(row.text);
  const actualChars = (row.chars ?? []).map((entry) => entry.c);
  if (expectedChars.length !== actualChars.length || expectedChars.some((ch, index) => ch !== actualChars[index])) {
    charArrayMismatches.push({ line: i + 1, section: row.section, text: row.text, expectedChars, actualChars });
  }
  if (!Number.isFinite(row.start) || !Number.isFinite(row.end) || !Array.isArray(row.chars) || row.chars.some((ch) => !Number.isFinite(ch.t))) {
    invalidTimeRows.push(i + 1);
    continue;
  }
  if (row.start < 0 || row.chars.some((ch) => ch.t < 0)) negativeStarts.push(i + 1);
  if (row.end <= row.start) nonPositiveDurations.push({ line: i + 1, start: row.start, end: row.end });
  if (row.end > timing.duration) endsPastDuration.push({ line: i + 1, section: row.section, text: row.text, start: row.start, end: row.end, overBy: round(row.end - timing.duration, 3) });
  if (i > 0 && row.start < lines[i - 1].start) startOrderBreaks.push({ previousLine: i, line: i + 1, previousStart: lines[i - 1].start, start: row.start });

  const firstChar = row.chars[0]?.t;
  const lastChar = row.chars.at(-1)?.t;
  lineEndConvention.push(round(row.end - lastChar, 3));
  if (Math.abs(row.start - firstChar) > 0.002) {
    charOrderBreaks.push({ line: i + 1, issue: 'line start differs from first character', start: row.start, firstChar });
  }
  for (let j = 1; j < row.chars.length; j += 1) {
    const delta = row.chars[j].t - row.chars[j - 1].t;
    if (delta < 0) charOrderBreaks.push({ line: i + 1, issue: 'character timestamps decrease', from: row.chars[j - 1], to: row.chars[j] });
    if (delta > 0.8) withinLineGaps.push({
      line: i + 1, section: row.section, text: row.text,
      from: row.chars[j - 1].c, to: row.chars[j].c, gap: round(delta, 3),
      fromTime: row.chars[j - 1].t, toTime: row.chars[j].t,
    });
  }
  if (i > 0) {
    const prev = lines[i - 1];
    const previousLastChar = prev.chars.at(-1)?.t;
    if (row.start < prev.end) lineIntervalOverlaps.push({ previousLine: i, line: i + 1, overlap: round(prev.end - row.start, 3) });
    const onsetGap = row.start - previousLastChar;
    if (onsetGap > 0.8) charOnsetGaps.push({ previousLine: i, line: i + 1, gap: round(onsetGap, 3), previousText: prev.text, text: row.text });
  }
}

const log = parseAlignmentLog(alignLogText);
const longestLine = [...lines].sort((a, b) => visibleChars(b.text).length - visibleChars(a.text).length)[0];
const candidates = [];
function addCandidate(row, reason, id) {
  if (!row) throw new Error(`Priority candidate not found: ${id}`);
  const index = lines.indexOf(row) + 1;
  const coverage = log.sectionCoverage.find((item) => item.section === row.section);
  candidates.push({
    priority: candidates.length + 1,
    id,
    line: index,
    section: row.section,
    text: row.text,
    start: row.start,
    end: row.end,
    firstCharOnset: row.chars[0]?.t ?? null,
    lastCharOnset: row.chars.at(-1)?.t ?? null,
    visibleCharCount: visibleChars(row.text).length,
    sectionMatchedChars: coverage?.matchedChars ?? null,
    sectionTargetChars: coverage?.targetChars ?? null,
    sectionCoverage: coverage?.coverage ?? null,
    reason,
    timingLabel: '候选试听窗口；取自当前 ASR 派生时间轴，不是人声实测',
  });
}

for (const section of ['00 hook', '03 hook', '13 hook-marpol', '21 hook-marpol']) {
  addCandidate(
    lines.find((row) => row.section === section && row.text === '我是过来人'),
    '同一句在四次副歌重复；逐次核对起唱点并比较字符节奏是否漂移。',
    `repeated-hook-${section.replaceAll(' ', '-')}`,
  );
}
addCandidate(
  lines.find((row) => row.section === '09 hook-marpol' && row.text === '我是工艺人'),
  '副歌开句发生文本变体；与其他四次“我是过来人”并列听校，确认变体行的起唱点。',
  'repeated-hook-09-variant',
);
addCandidate(longestLine, `歌词文本中最长行（${visibleChars(longestLine.text).length} 个可见字符），检查整行边界与内部节奏。`, 'longest-line');
addCandidate(
  lines.find((row) => row.section === '15 wuhan' && row.text === '硫化的苦我吃过'),
  'ASR LRC 将“硫化”识为同音近似“路滑”；听原声确认词与该行起点。',
  'asr-homophone-wuhan',
);
addCandidate(
  lines.find((row) => row.section === '19 allen' && row.text === '我是Allen Ma'),
  '所在段仅命中 6/37 个歌词字符；检查段首锚点附近是否由插值补出。',
  'low-coverage-allen-start',
);
addCandidate(
  lines.find((row) => row.section === '19 allen' && row.text === '你的困惑我来扛'),
  '所在段仅命中 6/37 个歌词字符；此处既是歌词段尾，又是 ASR 锚点候选。',
  'low-coverage-allen-end',
);
const finalRow = lines.find((row) => row.section === '22 finale' && row.text === '未来有我留的灯');
const finalLineNo = lines.indexOf(finalRow) + 1;
addCandidate(
  finalRow,
  `片尾最后一句；字符间出现 ${withinLineGaps.filter((gap) => gap.line === finalLineNo).map((gap) => `${gap.gap}s`).join('、') || '无 >0.8s 间隔'}，当前行尾超出歌曲时长 ${endsPastDuration.find((entry) => entry.line === finalLineNo)?.overBy ?? 0}s。`,
  'outro-final-line',
);

const lrcStartVsSrt = lrc.map((row, index) => ({ row, cue: srt[index] })).filter(({ cue }) => cue).map(({ row, cue }) => Math.abs(row.start - cue.start));
const sourceComparison = {
  authority: 'lyrics/og_lyrics.txt',
  timing: 'lyrics/og_timing.json',
  sourceLineCount: sourceRows.length,
  timingLineCount: lines.length,
  exactSectionAndTextMatches: sourceRows.length - textMismatches.length,
  mismatchCount: textMismatches.length,
  textMismatches,
  charArrayMismatchCount: charArrayMismatches.length,
  charArrayMismatches,
};

const result = {
  generatedAt: new Date().toISOString(),
  scope: 'Read-only structural audit of lyric text/timing, ASR subtitle artifacts, and alignment log; no audio audition or timing edits.',
  durationSeconds: timing.duration,
  timingLineCountDeclared: timing.line_count,
  timingLineCountActual: lines.length,
  timingSourceEvidence: {
    currentScript: 'analysis/align_lyrics2.py',
    cliUsage: 'python align_lyrics2.py <asr.lrc> <lyrics.txt> <duration> <out.json>',
    currentAsrArtifacts: ['The OGs 自动识别.lrc', 'The OGs 自动识别.srt'],
    generationLog: 'analysis/align2.log',
    exactInvocationRecordedInLog: false,
    logSummary: log,
    asrLrc: { path: 'The OGs 自动识别.lrc', cueCount: lrc.length, first: lrc[0] ?? null, last: lrc.at(-1) ?? null },
    asrSrt: { path: 'The OGs 自动识别.srt', cueCount: srt.length, first: srt[0] ?? null, last: srt.at(-1) ?? null },
    lrcSrtStartTimestampComparison: {
      comparedCueCount: lrcStartVsSrt.length,
      identicalStartCount: lrcStartVsSrt.filter((delta) => delta < 0.001).length,
      maxStartDifference: lrcStartVsSrt.length ? round(Math.max(...lrcStartVsSrt), 3) : null,
    },
  },
  sourceComparison,
  structure: {
    invalidTimeRows,
    negativeStarts,
    nonPositiveDurations,
    endsPastDuration,
    startOrderBreaks,
    charOrderBreaks,
    positiveInterlineCharOnsetGapsOver0_8Seconds: charOnsetGaps,
    withinLineCharOnsetGapsOver0_8Seconds: withinLineGaps,
    syntheticEndOffsetFromLastCharOnset: {
      min: Math.min(...lineEndConvention),
      max: Math.max(...lineEndConvention),
      distinctOffsets: [...new Set(lineEndConvention)],
      documentedByGenerator: 'analysis/align_lyrics2.py writes end = last matched/interpolated character timestamp + 0.6s; it is not a measured sung-word end.',
    },
    adjacentLineEndStartOverlaps: {
      count: lineIntervalOverlaps.length,
      examples: lineIntervalOverlaps.slice(0, 12),
      interpretation: 'These follow the generated +0.6s line-end convention and do not alone establish an audio overlap.',
    },
    longestLine: {
      section: longestLine.section,
      text: longestLine.text,
      visibleCharCount: visibleChars(longestLine.text).length,
      start: longestLine.start,
      end: longestLine.end,
    },
  },
  priority10: candidates,
};

const outDir = resolve(root, 'out/alignment_review');
await mkdir(outDir, { recursive: true });
await writeFile(resolve(outDir, 'lyric_timing_audit.json'), `${JSON.stringify(result, null, 2)}\n`, 'utf8');
const csvHeader = ['priority', 'id', 'line', 'section', 'text', 'start_s', 'end_s', 'first_char_onset_s', 'last_char_onset_s', 'visible_char_count', 'section_coverage', 'reason'];
const csvRows = candidates.map((candidate) => [
  candidate.priority, candidate.id, candidate.line, candidate.section, candidate.text,
  candidate.start, candidate.end, candidate.firstCharOnset, candidate.lastCharOnset,
  candidate.visibleCharCount, candidate.sectionCoverage ?? '', candidate.reason,
]);
await writeFile(resolve(outDir, 'priority_10.csv'), `${[csvHeader, ...csvRows].map((row) => row.map(csvCell).join(',')).join('\r\n')}\r\n`, 'utf8');

const manualTemplatePath = resolve(outDir, 'manual_onset_template.csv');
try {
  await readFile(manualTemplatePath);
} catch (error) {
  if (error.code !== 'ENOENT') throw error;
  const manualHeader = ['id', 'line', 'section', 'text', 'candidate_start_s', 'candidate_end_s', 'human_vocal_onset_s', 'delta_s', 'reviewer', 'status', 'notes'];
  const manualRows = candidates.map((candidate) => [
    candidate.id, candidate.line, candidate.section, candidate.text,
    candidate.start, candidate.end, '', '', '', '待听校', '',
  ]);
  await writeFile(manualTemplatePath, `${[manualHeader, ...manualRows].map((row) => row.map(csvCell).join(',')).join('\r\n')}\r\n`, 'utf8');
}

console.log(JSON.stringify({
  result: resolve(outDir, 'lyric_timing_audit.json'),
  candidateCsv: resolve(outDir, 'priority_10.csv'),
  manualTemplate: manualTemplatePath,
  duration: timing.duration,
  sourceLines: sourceRows.length,
  timingLines: lines.length,
  textMismatches: textMismatches.length,
  charArrayMismatches: charArrayMismatches.length,
  negativeStarts: negativeStarts.length,
  nonPositiveDurations: nonPositiveDurations.length,
  orderBreaks: startOrderBreaks.length + charOrderBreaks.length,
  endsPastDuration,
  longestLine,
  top10: candidates,
}, null, 2));
