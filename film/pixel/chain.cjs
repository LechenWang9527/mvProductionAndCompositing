#!/usr/bin/env node
/**
 * chain.cjs — 把「上一段的最后一帧」当成「下一段的第一帧」，一段接一段地往下生成。
 *
 *   node chain.cjs <上一段mp4> <本段提示词.txt> <标题> [时长秒=10] [--dry]
 *
 * 做的事：
 *   1. ffmpeg 抽上一段最后一个可见帧  -> film/pixel/chain/last_<标题>.png
 *   2. 上传成 resource                -> resourceId
 *   3. node create video --mode first_last_frame --ref res:<id>   （只给首帧，不给尾帧）
 *   4. node quote -> confirm -> run --wait
 *   5. 下载产物                       -> film/pixel/out/<标题>_raw.mp4
 *
 * 为什么只给首帧：给首帧+尾帧会把整段画面钉死，动作被压平；只给首帧，
 * 起手画面与前一段严丝合缝，后面 10 秒留给模型自己长。
 */
const { execFileSync } = require('node:child_process');
const fs = require('node:fs');
const path = require('node:path');

const CLI = 'C:/Users/WangLC/bin/dreamina-canvas.exe';
const FF = 'E:/新建文件夹/实习/MV/ref_mv/node_modules/ffmpeg-static/ffmpeg.exe';
const ROOT = 'E:/新建文件夹/实习/MV/film/pixel';
const PROJECT = 'b3475794-9500-41ca-b5c6-ab08d74bb461';

const [prev, promptFile, title, durArg] = process.argv.slice(2);
const dry = process.argv.includes('--dry');
if (!prev || !promptFile || !title) {
  console.error('usage: node chain.cjs <prev.mp4> <prompt.txt> <title> [seconds=10] [--dry]');
  process.exit(2);
}
const duration = Number(durArg || 10);

function run(args, opts = {}) {
  const out = execFileSync(CLI, args, { encoding: 'utf8', maxBuffer: 64 << 20, ...opts });
  return out;
}
function json(args) {
  const out = run([...args, '--format', 'json']);
  const line = out.slice(out.indexOf('{'));
  return JSON.parse(line);
}

const chainDir = path.join(ROOT, 'chain');
fs.mkdirSync(chainDir, { recursive: true });
fs.mkdirSync(path.join(ROOT, 'out'), { recursive: true });

// 1) 上一段最后一帧
const lastFrame = path.join(chainDir, `last_${title}.png`);
execFileSync(FF, ['-nostdin', '-loglevel', 'error', '-y', '-sseof', '-0.12', '-i', prev, '-frames:v', '1', '-q:v', '1', lastFrame]);
const kb = (fs.statSync(lastFrame).size / 1024).toFixed(0);
console.log(`[1/5] last frame -> ${lastFrame} (${kb} KB)`);

// 2) 上传
const up = json(['resource', 'upload', '--project-id', PROJECT, '--file', lastFrame, '--type', 'image']);
const rid = up.data.resourceId;
console.log(`[2/5] uploaded -> ${rid}`);

// 3) 建节点
const prompt = fs.readFileSync(promptFile, 'utf8');
const created = json([
  'node', 'create', 'video',
  '--project-id', PROJECT, '--mode', 'first_last_frame',
  '--model', 'seedance_2.5_flash', '--ratio', '16:9', '--resolution', '480p',
  '--duration', String(duration), '--ref', `res:${rid}`, '--title', title, '--prompt', prompt,
]);
const nodeId = created.data.node.nodeId;
console.log(`[3/5] node -> ${nodeId}`);

// 4) 报价
const q = json(['node', 'quote', '--node-id', nodeId, '--project-id', PROJECT]);
const credits = q.data.totalMaxCredits ?? q.data.maxCredits;
console.log(`[4/5] quote -> ${credits} credits`);
if (dry) {
  console.log('dry run, stop here');
  process.exit(0);
}

// 5) confirm + run
const cf = json(['node', 'confirm', '--node-id', nodeId, '--project-id', PROJECT, '--credit-ceiling', String(credits)]);
const token = cf.data.creditConfirmationToken;
if (!token) throw new Error('no confirmation token');
console.log('[5/5] running...');
const runOut = json(['node', 'run', '--node-id', nodeId, '--project-id', PROJECT, '--credit-token', token, '--wait', '--interval', '10s', '--timeout', '18m']);
console.log('run ok');

// 下载
const nodes = run(['node', 'show', '--node-id', nodeId, '--project-id', PROJECT, '--format', 'json']);
const sh = JSON.parse(nodes.slice(nodes.indexOf('{')));
const outRes = sh.data?.nodes?.[0]?.node?.resources?.[0]?.resourceId
  || sh.data?.nodes?.[0]?.node?.output?.resourceId
  || (sh.data?.nodes?.[0]?.node?.generation?.resultResourceIds || [])[0];
const mp4 = path.join(ROOT, 'out', `${title}_raw.mp4`);
if (outRes) {
  json(['resource', 'download', outRes, '-o', mp4, '--project-id', PROJECT]);
  console.log(`saved -> ${mp4} (${(fs.statSync(mp4).size / 1048576).toFixed(2)} MB)`);
} else {
  console.log('WARN: could not find output resourceId; inspect node manually:', nodeId);
  console.log(JSON.stringify(sh).slice(0, 1200));
}
console.log(JSON.stringify({ nodeId, resourceId: rid, credits, mp4 }));
