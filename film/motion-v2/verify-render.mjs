#!/usr/bin/env node
import { spawnSync } from 'node:child_process';
import { existsSync, mkdirSync, readFileSync, readdirSync, statSync, writeFileSync } from 'node:fs';
import { basename, dirname, extname, isAbsolute, join, relative, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import os from 'node:os';

const SCRIPT_DIR = dirname(fileURLToPath(import.meta.url));
const REPO_ROOT = resolve(SCRIPT_DIR, '../..');
const VIDEO_DIR = join(REPO_ROOT, 'out', 'motion-v2');
const PUBLIC_ASSETS = join(SCRIPT_DIR, 'public', 'assets');
const SCENES_DIR = join(SCRIPT_DIR, 'src', 'scenes');
const EDITORIAL_DIR = join(SCRIPT_DIR, 'src', 'editorial');
const FFMPEG = join(REPO_ROOT, 'ref_mv', 'node_modules', 'ffmpeg-static', 'ffmpeg.exe');
const NULL_DEVICE = os.platform() === 'win32' ? 'NUL' : '/dev/null';
const EXPECTED = {
  AncientDemoV2: { width: 1920, height: 1080, frameRate: 30, durationSeconds: 137.3, frames: 4119 },
  AncientEditorialV3: { width: 1920, height: 1080, frameRate: 30, durationSeconds: 137.3, frames: 4119 },
  AncientEditorialV4: { width: 1920, height: 1080, frameRate: 30, durationSeconds: 137.3, frames: 4119 },
  IntroProcessV2: { width: 1920, height: 1080, frameRate: 30, durationSeconds: 21.6, frames: 648 },
};
const EDITORIAL_STILL_SAMPLE_COUNTS = { AncientEditorialV3: 26, AncientEditorialV4: 8 };
const MAX_BUFFER = 96 * 1024 * 1024;

function runFfmpeg(args) {
  if (!existsSync(FFMPEG)) {
    return { status: null, stdout: '', stderr: '', error: `ffmpeg-static not found: ${FFMPEG}` };
  }
  const result = spawnSync(FFMPEG, args, {
    encoding: 'utf8',
    windowsHide: true,
    maxBuffer: MAX_BUFFER,
  });
  return {
    status: result.status,
    stdout: result.stdout ?? '',
    stderr: result.stderr ?? '',
    error: result.error?.message ?? null,
  };
}

function splitTopLevelCommas(value) {
  const parts = [];
  let depth = 0;
  let start = 0;
  for (let i = 0; i < value.length; i++) {
    const ch = value[i];
    if (ch === '(') depth++;
    else if (ch === ')') depth = Math.max(0, depth - 1);
    else if (ch === ',' && depth === 0) {
      parts.push(value.slice(start, i).trim());
      start = i + 1;
    }
  }
  parts.push(value.slice(start).trim());
  return parts.filter(Boolean);
}

function streamFromProbe(text, kind) {
  const marker = new RegExp(`\\b${kind}:\\s*`, 'i');
  const line = text.split(/\r?\n/).find((entry) => marker.test(entry));
  if (!line) return null;
  const match = line.match(marker);
  const payload = line.slice(match.index + match[0].length).trim();
  const fields = splitTopLevelCommas(payload);
  const codecToken = fields[0] ?? '';
  const codec = codecToken.match(/^([\w.-]+)/)?.[1] ?? null;

  if (kind.toLowerCase() === 'video') {
    const sizeField = fields.find((field) => /\b\d{2,6}x\d{2,6}\b/.test(field)) ?? '';
    const size = sizeField.match(/\b(\d{2,6})x(\d{2,6})\b/);
    const fpsField = fields.find((field) => /\b[\d.]+\s*fps\b/i.test(field)) ?? '';
    const fps = fpsField.match(/\b([\d.]+)\s*fps\b/i);
    const sar = sizeField.match(/\bSAR\s+(\d+:\d+)\b/i);
    const pixelToken = fields.find((field) => field !== codecToken && !/\b\d{2,6}x\d{2,6}\b/.test(field)) ?? '';
    return {
      codec,
      pixelFormat: pixelToken.match(/^([^\s(]+)/)?.[1] ?? null,
      width: size ? Number(size[1]) : null,
      height: size ? Number(size[2]) : null,
      sampleAspectRatio: sar?.[1] ?? null,
      frameRate: fps ? Number(fps[1]) : null,
      streamLine: line.trim(),
    };
  }

  const rate = line.match(/\b(\d{4,6})\s*Hz\b/i);
  const channels = line.match(/\b(mono|stereo|\d+\s+channels?)\b/i);
  return {
    codec,
    sampleRateHz: rate ? Number(rate[1]) : null,
    channels: channels?.[1] ?? null,
    streamLine: line.trim(),
  };
}

function parseDuration(text) {
  const match = text.match(/\bDuration:\s*(\d{2}):(\d{2}):(\d{2}(?:\.\d+)?)\b/i);
  if (!match) return null;
  return Number(match[1]) * 3600 + Number(match[2]) * 60 + Number(match[3]);
}

function probeMedia(filePath) {
  const result = runFfmpeg(['-hide_banner', '-i', filePath]);
  const text = `${result.stderr}\n${result.stdout}`;
  const video = streamFromProbe(text, 'Video');
  const audio = streamFromProbe(text, 'Audio');
  const headerReadSucceeded = Boolean(video);
  return {
    exitCode: result.status,
    error: result.error,
    headerOnlyInspection: true,
    headerReadSucceeded,
    exitCodeNote: result.status === 1 && headerReadSucceeded
      ? 'ffmpeg -i was run without an output target; exit 1 is expected after printing the input header.'
      : null,
    durationSeconds: parseDuration(text),
    video,
    audio,
    header: text.split(/\r?\n/).filter((line) => /Input #|Duration:|Stream #/.test(line)).map((line) => line.trim()),
  };
}

function decodeVideo(filePath, frameRate) {
  // showinfo is a no-op video filter; its frame indices let the report prove
  // how many video frames passed through the same full A/V null decode.
  const result = runFfmpeg([
    '-hide_banner', '-nostdin', '-loglevel', 'info', '-i', filePath,
    '-map', '0:v:0', '-map', '0:a?', '-vf', 'showinfo', '-f', 'null', NULL_DEVICE,
  ]);
  const frameRecords = [...result.stderr.matchAll(/showinfo[^\r\n]*\bn:\s*(\d+)(?:\s+pts:\s*-?\d+)?(?:\s+pts_time:([-\d.]+))?/g)]
    .map((match) => ({ index: Number(match[1]), ptsSeconds: match[2] ? Number(match[2]) : null }));
  const lastFrame = frameRecords.reduce((last, record) => !last || record.index > last.index ? record : last, null);
  const videoDurationSeconds = lastFrame?.ptsSeconds !== null && lastFrame?.ptsSeconds !== undefined && frameRate
    ? lastFrame.ptsSeconds + 1 / frameRate
    : null;
  const errors = result.stderr.split(/\r?\n/)
    .filter((line) => /\b(error|invalid|failed|corrupt|could not)\b/i.test(line))
    .slice(-12)
    .map((line) => line.trim());
  return {
    exitCode: result.status,
    processError: result.error,
    decodedVideoFrames: frameRecords.length ? Math.max(...frameRecords.map((record) => record.index)) + 1 : null,
    showinfoEntries: frameRecords.length,
    lastVideoPtsSeconds: lastFrame?.ptsSeconds ?? null,
    videoDurationSeconds,
    errors,
  };
}

function editorialStillSamples(id, limit) {
  const pattern = new RegExp(`^${id}_(\\d+)_(\\d{2})\\.png$`, 'i');
  return readdirSync(VIDEO_DIR, { withFileTypes: true })
    .filter((entry) => entry.isFile() && pattern.test(entry.name))
    .map((entry) => {
      const match = entry.name.match(pattern);
      return {
        name: entry.name,
        seconds: Number(`${match[1]}.${match[2]}`),
        modifiedAt: statSync(join(VIDEO_DIR, entry.name)).mtimeMs,
      };
    })
    .sort((a, b) => b.modifiedAt - a.modifiedAt)
    .slice(0, limit)
    .sort((a, b) => a.seconds - b.seconds);
}

function extractEditorialVideoSamples(filePath, id, requestedSampleCount) {
  const samples = editorialStillSamples(id, requestedSampleCount);
  const outputDirectory = join(VIDEO_DIR, 'video-qc', `${id}-mp4-frames`);
  mkdirSync(outputDirectory, { recursive: true });
  const frames = samples.map((sample) => {
    const output = join(outputDirectory, sample.name);
    const result = runFfmpeg([
      '-hide_banner', '-nostdin', '-loglevel', 'error', '-y',
      '-ss', sample.seconds.toFixed(2), '-i', filePath,
      '-map', '0:v:0', '-frames:v', '1', output,
    ]);
    const passed = result.status === 0 && existsSync(output) && statSync(output).size > 0;
    return {
      sourceStill: relative(REPO_ROOT, join(VIDEO_DIR, sample.name)).replaceAll('\\', '/'),
      seconds: sample.seconds,
      file: relative(REPO_ROOT, output).replaceAll('\\', '/'),
      exitCode: result.status,
      processError: result.error,
      passed,
    };
  });
  return {
    sourceStillCount: samples.length,
    requestedSampleCount,
    outputDirectory: relative(REPO_ROOT, outputDirectory).replaceAll('\\', '/'),
    extractedCount: frames.filter((frame) => frame.passed).length,
    passed: samples.length === requestedSampleCount && frames.every((frame) => frame.passed),
    frames,
  };
}

function tsxFiles(directory) {
  if (!existsSync(directory)) return [];
  return readdirSync(directory, { withFileTypes: true }).flatMap((entry) => {
    const path = join(directory, entry.name);
    if (entry.isDirectory()) return tsxFiles(path);
    return entry.isFile() && /\.tsx?$/i.test(entry.name) ? [path] : [];
  });
}

function sourceFilesForId(id) {
  if (id === 'AncientEditorialV3' || id === 'AncientEditorialV4') {
    const editorialFiles = [
      join(SCRIPT_DIR, 'src', 'AncientEditorial.tsx'),
      join(SCRIPT_DIR, 'src', 'visual', 'EditorialStage.tsx'),
      ...tsxFiles(EDITORIAL_DIR),
    ];
    if (id === 'AncientEditorialV4') {
      editorialFiles.push(
        join(SCRIPT_DIR, 'src', 'Root.tsx'),
        join(SCRIPT_DIR, 'src', 'SubtitlesEditorial.tsx'),
        ...tsxFiles(join(SCRIPT_DIR, 'src', 'visual')),
      );
    }
    return editorialFiles.filter(existsSync).sort();
  }
  return readdirSync(SCENES_DIR, { withFileTypes: true })
    .filter((entry) => entry.isFile() && /\.tsx?$/i.test(entry.name))
    .map((entry) => join(SCENES_DIR, entry.name))
    .sort();
}

function imageReferences(sourceFiles) {
  const byPath = new Map();
  const pathToken = /['"`]([^'"`]*\.(?:png|jpe?g|webp|gif|bmp|tiff?|avif|svg))['"`]/gi;

  for (const sourcePath of sourceFiles) {
    const lines = readFileSync(sourcePath, 'utf8').split(/\r?\n/);
    for (let i = 0; i < lines.length; i++) {
      for (const match of lines[i].matchAll(pathToken)) {
        let token = match[1].split(/[?#]/, 1)[0].replaceAll('\\', '/');
        const assetsIndex = token.lastIndexOf('assets/');
        if (assetsIndex >= 0) token = token.slice(assetsIndex + 'assets/'.length);
        else token = token.replace(/^\.\//, '');
        if (!token || token.includes('${')) continue;
        const fullPath = resolve(PUBLIC_ASSETS, token);
        const key = process.platform === 'win32' ? fullPath.toLowerCase() : fullPath;
        const entry = byPath.get(key) ?? { file: fullPath, references: [] };
        entry.references.push({ source: relative(SCRIPT_DIR, sourcePath).replaceAll('\\', '/'), line: i + 1, token: match[1] });
        byPath.set(key, entry);
      }
    }
  }
  return [...byPath.values()].sort((a, b) => a.file.localeCompare(b.file));
}

function checkImage(entry) {
  if (!existsSync(entry.file)) {
    return { ...entry, exists: false, sizeBytes: null, probe: null, decode: null, passed: false, errors: ['Referenced image file is missing.'] };
  }
  const stat = statSync(entry.file);
  const probe = probeMedia(entry.file);
  const decode = runFfmpeg(['-hide_banner', '-nostdin', '-loglevel', 'error', '-i', entry.file, '-map', '0:v:0', '-f', 'null', NULL_DEVICE]);
  const errors = [];
  if (!probe.video?.width || !probe.video?.height) errors.push('Could not read image dimensions from ffmpeg input header.');
  if (decode.status !== 0) errors.push(decode.error ?? `Image decode exited ${decode.status}.`);
  return {
    ...entry,
    file: relative(REPO_ROOT, entry.file).replaceAll('\\', '/'),
    exists: true,
    sizeBytes: stat.size,
    probe: {
      width: probe.video?.width ?? null,
      height: probe.video?.height ?? null,
      codec: probe.video?.codec ?? null,
      pixelFormat: probe.video?.pixelFormat ?? null,
      sampleAspectRatio: probe.video?.sampleAspectRatio ?? null,
      headerLine: probe.video?.streamLine ?? null,
      exitCode: probe.exitCode,
      headerOnlyInspection: probe.headerOnlyInspection,
      headerReadSucceeded: probe.headerReadSucceeded,
      exitCodeNote: probe.exitCodeNote,
    },
    decode: { exitCode: decode.status, processError: decode.error },
    passed: errors.length === 0,
    errors,
  };
}

function resolveVideo(argument) {
  if (isAbsolute(argument)) return resolve(argument);
  const candidates = [
    resolve(process.cwd(), argument),
    resolve(SCRIPT_DIR, argument),
    resolve(VIDEO_DIR, argument),
  ];
  return candidates.find(existsSync) ?? candidates[candidates.length - 1];
}

function expectedForId(id) {
  return EXPECTED[id] ?? null;
}

function near(actual, expected, tolerance) {
  return typeof actual === 'number' && Math.abs(actual - expected) <= tolerance;
}

const requested = process.argv[2] ?? 'AncientDemoV2.mp4';
const videoPath = resolveVideo(requested);
const id = basename(requested, extname(requested)).replace(/[^a-zA-Z0-9_-]/g, '_') || 'render';
const qcPath = join(VIDEO_DIR, `${id}.qc.json`);
mkdirSync(VIDEO_DIR, { recursive: true });
const expected = expectedForId(id);
const assetSourceFiles = sourceFilesForId(id);
const assets = imageReferences(assetSourceFiles).map(checkImage);
const videoExists = existsSync(videoPath);
const probe = videoExists ? probeMedia(videoPath) : null;
const decode = videoExists ? decodeVideo(videoPath, probe?.video?.frameRate ?? null) : null;
const requestedStillSampleCount = EDITORIAL_STILL_SAMPLE_COUNTS[id] ?? null;
const frameExtraction = videoExists && requestedStillSampleCount
  ? extractEditorialVideoSamples(videoPath, id, requestedStillSampleCount)
  : null;
const actualDuration = probe?.durationSeconds ?? null;
const actualVideoDuration = decode?.videoDurationSeconds ?? null;
const actualFrames = decode?.decodedVideoFrames ?? null;
const actualVideo = probe?.video ?? null;
const checks = {
  videoExists,
  ffmpegAvailable: existsSync(FFMPEG),
  videoStreamFound: Boolean(actualVideo),
  videoDimensions: Boolean(actualVideo && actualVideo.width === (expected?.width ?? 1920) && actualVideo.height === (expected?.height ?? 1080)),
  frameRate: Boolean(actualVideo && near(actualVideo.frameRate, expected?.frameRate ?? 30, 0.001)),
  sampleAspectRatio: Boolean(actualVideo?.sampleAspectRatio === '1:1'),
  audioStreamFound: Boolean(probe?.audio?.codec),
  duration: expected ? near(actualVideoDuration, expected.durationSeconds, 0.01) : typeof actualVideoDuration === 'number',
  containerDurationWithinAudioTail: expected ? near(actualDuration, expected.durationSeconds, 0.08) : typeof actualDuration === 'number',
  decodedFrames: expected ? actualFrames === expected.frames : typeof actualFrames === 'number' && actualFrames > 0,
  durationFrameCountAgreement: typeof actualVideoDuration === 'number' && typeof actualVideo?.frameRate === 'number' && typeof actualFrames === 'number'
    ? Math.round(actualVideoDuration * actualVideo.frameRate) === actualFrames
    : false,
  fullDecodeExitZero: decode?.exitCode === 0,
  sceneImagesExistAndDecode: assets.length > 0 && assets.every((asset) => asset.passed),
  mp4SampleFramesExtracted: !requestedStillSampleCount || Boolean(frameExtraction?.passed),
};
const errors = [];
if (!videoExists) errors.push(`Video file does not exist: ${videoPath}`);
if (!checks.ffmpegAvailable) errors.push(`ffmpeg-static executable does not exist: ${FFMPEG}`);
if (videoExists && !actualVideo) errors.push('Could not parse a video stream from ffmpeg -i output.');
if (videoExists && probe && !probe.audio) errors.push('No audio stream was found.');
if (videoExists && decode && decode.exitCode !== 0) errors.push(`Full A/V null decode exited ${decode.exitCode}.`);
if (expected && probe && !checks.videoDimensions) errors.push(`Expected ${expected.width}x${expected.height}; got ${actualVideo?.width ?? 'unknown'}x${actualVideo?.height ?? 'unknown'}.`);
if (expected && probe && !checks.frameRate) errors.push(`Expected ${expected.frameRate} fps; got ${actualVideo?.frameRate ?? 'unknown'}.`);
if (probe && !checks.sampleAspectRatio) errors.push(`Expected SAR 1:1; got ${actualVideo?.sampleAspectRatio ?? 'unknown'}.`);
if (expected && decode && !checks.duration) errors.push(`Expected decoded video duration ${expected.durationSeconds}s ±0.01s; got ${actualVideoDuration ?? 'unknown'}.`);
if (expected && probe && !checks.containerDurationWithinAudioTail) errors.push(`Container duration ${actualDuration ?? 'unknown'}s is more than 0.08s from expected video duration ${expected.durationSeconds}s.`);
if (expected && decode && !checks.decodedFrames) errors.push(`Expected ${expected.frames} decoded video frames; got ${actualFrames ?? 'unknown'}.`);
if (decode && !checks.durationFrameCountAgreement) errors.push('Decoded frame count does not agree with probed duration × frame rate.');
if (requestedStillSampleCount && videoExists && !frameExtraction?.passed) {
  errors.push(`Expected ${requestedStillSampleCount} MP4 sample frames from the latest ${id} still set; extracted ${frameExtraction?.extractedCount ?? 0}.`);
}
for (const asset of assets) {
  if (!asset.passed) errors.push(`Asset QA failed: ${asset.file} (${asset.errors.join(' ')})`);
}
const passed = Object.values(checks).every(Boolean) && errors.length === 0;
const report = {
  schemaVersion: 1,
  id,
  generatedAt: new Date().toISOString(),
  requested,
  video: {
    file: relative(REPO_ROOT, videoPath).replaceAll('\\', '/'),
    exists: videoExists,
    sizeBytes: videoExists ? statSync(videoPath).size : null,
    expected,
    probe,
    decode,
  },
  assets: {
    sourceFiles: assetSourceFiles.map((source) => relative(REPO_ROOT, source).replaceAll('\\', '/')),
    publicDirectory: relative(REPO_ROOT, PUBLIC_ASSETS).replaceAll('\\', '/'),
    referencedImageCount: assets.length,
    passedCount: assets.filter((asset) => asset.passed).length,
    failedCount: assets.filter((asset) => !asset.passed).length,
    items: assets,
  },
  frameExtraction,
  checks,
  passed,
  errors,
};

writeFileSync(qcPath, `${JSON.stringify(report, null, 2)}\n`, 'utf8');
console.log(JSON.stringify({ report: relative(REPO_ROOT, qcPath).replaceAll('\\', '/'), id, passed, checks, errors }, null, 2));
process.exitCode = passed ? 0 : 1;
