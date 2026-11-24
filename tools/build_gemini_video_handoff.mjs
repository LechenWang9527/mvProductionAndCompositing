import { access, copyFile, mkdir, readFile, rm, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

// Rebuilds the Gemini handoff from the approved plan and original candidate images.
// Intentionally does not fall back to motion-v2 preview assets or rendered frames.
const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const PLAN_PATH = path.join(ROOT, 'docs', 'handoff', 'GEMINI_VIDEO_PLAN.json');
const LYRICS_PATH = path.join(ROOT, 'lyrics', 'og_timing.json');
const CANDIDATES_DIR = path.join(ROOT, 'film', 'media', 'candidates');
const OUTPUT_DIR = path.join(ROOT, 'out', 'Gemini_古代MV_图生视频交接包');

const readJson = async (file) => JSON.parse(await readFile(file, 'utf8'));
const exists = async (file) => {
  try { await access(file); return true; } catch { return false; }
};
const safeTitle = (title) => title
  .replace(/[\\/:*?"<>|]/g, '')
  .replace(/[\s·]+/g, '_')
  .replace(/_+/g, '_')
  .replace(/^_|_$/g, '');
const shotFolderName = (entry) => `${entry.id}_${safeTitle(entry.title)}`;
const sec = (value) => Number(value).toFixed(3);
const clock = (value) => {
  const minutes = Math.floor(value / 60);
  const seconds = (value - minutes * 60).toFixed(3).padStart(6, '0');
  return `${String(minutes).padStart(2, '0')}:${seconds}`;
};
const rangeText = ([start, end]) => `${clock(start)}–${clock(end)}`;
const csvCell = (value) => `"${String(value ?? '').replaceAll('"', '""')}"`;

const [plan, lyricData] = await Promise.all([readJson(PLAN_PATH), readJson(LYRICS_PATH)]);
if (!Array.isArray(plan.entries) || !Array.isArray(lyricData.lines)) {
  throw new Error('GEMINI_VIDEO_PLAN.json 或 og_timing.json 结构不符合预期。');
}

await mkdir(OUTPUT_DIR, { recursive: true });

function lyricsForRange([start, end]) {
  return lyricData.lines
    .filter((line) => line.start < end && line.end > start)
    .map((line) => line);
}

function entryLyrics(entry) {
  return entry.ranges.map((range) => ({ range, lines: lyricsForRange(range) }));
}

const statuses = new Map();
for (const entry of plan.entries) {
  const folder = path.join(OUTPUT_DIR, shotFolderName(entry));
  const videoDir = path.join(folder, '待回传视频');
  const sourcePath = path.join(CANDIDATES_DIR, entry.source);
  const referencePath = path.join(folder, 'reference.png');
  const pendingPath = path.join(folder, 'reference待补.txt');
  await mkdir(videoDir, { recursive: true });

  const sourceExists = await exists(sourcePath);
  if (sourceExists) {
    await copyFile(sourcePath, referencePath);
    if (await exists(pendingPath)) await rm(pendingPath);
    statuses.set(entry.id, '已复制原图');
  } else {
    // Prevent a stale reference from an earlier run from silently substituting for this source.
    if (await exists(referencePath)) await rm(referencePath);
    await writeFile(pendingPath,
      `原图待补：${entry.source}\n` +
      `期望收到同名原始素材：${entry.source}。\n` +
      '本次未使用旧图、预览截图或其他素材替代。素材到位后重跑仓库中的打包脚本。\n',
      'utf8');
    statuses.set(entry.id, '待补原图');
  }

  const prompt = [
    'Gemini 视频生成提示词（整段可直接粘贴）',
    '',
    '【共用要求】',
    plan.common.trim(),
    '',
    '【本镜动作要求】',
    entry.action.trim(),
    '',
    '【叠字与后期合成要求】',
    entry.overlay.trim(),
  ].join('\n');
  await writeFile(path.join(folder, '视频生成提示词.txt'), `${prompt}\n`, 'utf8');

  const groupedLyrics = entryLyrics(entry);
  const actualSeconds = entry.ranges.reduce((sum, [start, end]) => sum + end - start, 0);
  const note = [
    `# ${entry.title}`,
    '',
    `- 镜头 ID：${entry.id}`,
    `- 优先级：${entry.priority}`,
    `- 参考原图：${entry.source}`,
    `- 原图状态：${statuses.get(entry.id)}`,
    `- Gemini 生成请求时长：${entry.seconds ?? plan.generationRequestSeconds} 秒`,
    `- 成片实际剪辑区间总长：${sec(actualSeconds)} 秒（按下列区间时长相加；与生成请求时长分开记录）`,
    '',
    '## 实际剪辑时码与原歌词',
    '',
    '以下歌词按歌曲原始时间轴逐字摘录，不改写、不补词。区间按原计划保留。',
    ...groupedLyrics.flatMap(({ range, lines }) => [
      `### ${rangeText(range)}（${sec(range[1] - range[0])} 秒）`,
      ...(lines.length
        ? lines.map((line) => `- [${clock(line.start)}–${clock(line.end)}] ${line.text}`)
        : ['- 该区间没有与歌曲时间轴相交的歌词行。']),
      '',
    ]),
    '## 生成与合成要求',
    '',
    `- 请求生成：${entry.seconds ?? plan.generationRequestSeconds} 秒连续镜头。`,
    `- 实际剪辑：${entry.ranges.map((range) => `${rangeText(range)}（${sec(range[1] - range[0])} 秒）`).join('；')}。`,
    '- 生成时长和实际剪辑时长是两个不同值；由剪辑选择合适片段，不将生成时长当作最终镜头长度。',
    '- 字幕、标题和标签由后期单独合成；禁止把歌词或叠字要求烘焙进生成视频。',
    '- 视频回传位置：本目录下 `待回传视频/`；文件名使用镜头 ID，例如 `<镜头ID>.mp4`。',
    '',
    '## 本镜动作与合成边界',
    '',
    entry.action.trim(),
    '',
    `叠字与合成：${entry.overlay.trim()}`,
    '',
  ].join('\n');
  await writeFile(path.join(folder, '镜头说明.md'), note, 'utf8');
}

const rows = plan.entries.map((entry) => {
  const actualSeconds = entry.ranges.reduce((sum, [start, end]) => sum + end - start, 0);
  const lyrics = entryLyrics(entry).flatMap(({ lines }) => lines)
    .map((line) => `[${clock(line.start)}–${clock(line.end)}] ${line.text}`)
    .join('\n');
  return {
    id: entry.id,
    title: entry.title,
    priority: entry.priority,
    source: entry.source,
    sourceStatus: statuses.get(entry.id),
    ranges: entry.ranges.map(rangeText).join('；'),
    actualSeconds: sec(actualSeconds),
    requestedSeconds: entry.seconds ?? plan.generationRequestSeconds,
    lyrics,
  };
});

const headers = ['镜头ID', '标题', '优先级', '源图文件', '原图状态', '实际剪辑时码', '实际剪辑总长(秒)', '生成请求时长(秒)', '时码对应原歌词'];
const csv = [headers, ...rows.map((row) => [row.id, row.title, row.priority, row.source, row.sourceStatus, row.ranges, row.actualSeconds, row.requestedSeconds, row.lyrics])]
  .map((row) => row.map(csvCell).join(',')).join('\r\n');
await writeFile(path.join(OUTPUT_DIR, '00_镜头总表.csv'), `\uFEFF${csv}\r\n`, 'utf8');

const table = [
  '# 古代 MV 图生视频镜头总表',
  '',
  '| ID | 优先级 | 镜头 | 原图状态 | 实际剪辑区间 | 实际剪辑总长 | 生成请求 | 镜头目录 |',
  '|---|---|---|---|---|---:|---:|---|',
  ...rows.map((row) => `| ${row.id} | ${row.priority} | ${row.title} | ${row.sourceStatus} | ${row.ranges} | ${row.actualSeconds}s | ${row.requestedSeconds}s | [文件夹](./${shotFolderName(plan.entries.find((entry) => entry.id === row.id))}/) |`),
  '',
  '原歌词和逐镜动作见各镜头目录内的 `镜头说明.md`；可直接粘贴的完整生成请求见 `视频生成提示词.txt`。',
  '表内歌词按原始歌曲时码摘录，保持原文。',
  '',
].join('\n');
await writeFile(path.join(OUTPUT_DIR, '00_镜头总表.md'), table, 'utf8');

const missing = plan.entries.filter((entry) => statuses.get(entry.id) === '待补原图');
const p0 = plan.entries.filter((entry) => entry.priority === 'P0');
const schedule = [
  'Gemini 生成调度指令',
  '',
  '1. 开始前先读本包 `00_镜头总表.md` 与 `00_镜头总表.csv`，再逐镜阅读目录内的提示词和镜头说明。',
  '2. 优先处理 P0 三镜，按表中 ID 顺序：',
  ...p0.map((entry) => `   - ${entry.id} ${entry.title}：${statuses.get(entry.id)}${statuses.get(entry.id) === '待补原图' ? '；等reference.png到位后再生成，不得用旧图或截图顶替。' : '。'}`),
  '3. 每镜只使用本镜目录内的 `reference.png` 和 `视频生成提示词.txt`；不要从预览视频或前端截图提取参考画面。缺 `reference.png` 时先跳过该镜。',
  '4. 生成请求时长按各镜提示词（当前均为 8 秒）；这与总表记录的实际剪辑时码/时长分开，实际剪辑由后期决定。',
  '5. 完成后将视频放回对应镜头目录的 `待回传视频/`，文件名严格为 `<镜头ID>.mp4`，例如 `02_hut.mp4`。不要覆盖 `reference.png`，不要把视频放进其他镜头目录。',
  '6. 这里只是素材交接包。除非确有 MP4 已回传且检查过，否则不要标记或宣称该镜头已经生成。',
  '',
  `当前待补原图：${missing.length ? missing.map((entry) => `${entry.id}（${entry.source}）`).join('、') : '无'}。`,
  '',
].join('\n');
await writeFile(path.join(OUTPUT_DIR, '00_给Gemini的调度指令.txt'), schedule, 'utf8');

const summary = [
  '# 给 Gemini 的总说明',
  '',
  `本包按批准的 ` + '`docs/handoff/GEMINI_VIDEO_PLAN.json`' + ` 建立，共 ${plan.entries.length} 个图生视频镜头。表格、提示词、逐镜说明中的剪辑时码以项目原计划为准。`,
  '',
  '## 工作顺序',
  '',
  '- 先读同目录 `00_镜头总表.md` 或 `00_镜头总表.csv`，按 P0、P1、P2 处理。',
  '- 每个镜头文件夹包含 `视频生成提示词.txt`（common + action + overlay，可整段粘贴）、`镜头说明.md`、原始 `reference.png`（若素材已到位）和空的 `待回传视频/` 文件夹。',
  '- 原图只从项目 `film/media/candidates/` 同名素材复制，不使用成片截图、预览帧、旧版本图片或其他镜头素材代替。缺图时用 `reference待补.txt` 标记；原图到位后重跑项目打包脚本。',
  '- 各镜头实际剪辑区间和生成请求秒数分开记录；视频生成请求当前为 8 秒，后期会从中选择实际所需片段。',
  '- 生成画面不得包含歌词、字幕、标题、标签或额外 UI；这些内容按逐镜 overlay 说明在后期另行合成。不要生成配乐或人声。',
  '- 将回传 MP4 放入对应镜头的 `待回传视频/`，文件名为 `<镜头ID>.mp4`。本包不包含也不声称包含任何已生成视频。',
  '',
  '## 通用生成要求（逐镜提示词已包含）',
  '',
  plan.common.trim(),
  '',
  '## 本机相对路径说明',
  '',
  '所有路径均相对于本交接包根目录；可整体复制或上传到 Drive，不依赖本机盘符。缺失原图只在对应镜头目录注明文件名。',
  '',
  `本次构建的状态：${plan.entries.length - missing.length} 张参考原图已复制，${missing.length} 张待补（${missing.map((entry) => entry.source).join('、') || '无'}）。`,
  '',
];
await writeFile(path.join(OUTPUT_DIR, '00_给Gemini的总说明.md'), summary.join('\n'), 'utf8');

console.log(`Built ${OUTPUT_DIR}`);
console.log(`Shots: ${plan.entries.length}; references ready: ${plan.entries.length - missing.length}; pending: ${missing.map((entry) => entry.id).join(', ') || 'none'}`);
