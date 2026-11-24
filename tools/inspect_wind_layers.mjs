import fs from 'node:fs';
import path from 'node:path';
import { spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const FFMPEG = path.join(ROOT, 'ref_mv', 'node_modules', 'ffmpeg-static', 'ffmpeg.exe');
const OUTPUT = path.join(ROOT, 'out', 'motion-v2', 'studies', 'wind-layer-inspection.json');
const STUDY_DIR = path.join(ROOT, 'film', 'media', 'candidates', 'wind_multiplane_study');
const DEFAULT_INPUTS = [
  { name: 'sky', path: path.join(STUDY_DIR, 'sky.png') },
  { name: 'land', path: path.join(STUDY_DIR, 'land.png') },
  { name: 'flag', path: path.join(STUDY_DIR, 'flag.png') },
];
const MAX_PIXELS = 100_000_000;
const MAX_BUFFER = 512 * 1024 * 1024;

function parseArgs(args) {
  const paths = [];
  const rolePaths = {};
  let outputPath = OUTPUT;
  for (let i = 0; i < args.length; i += 1) {
    if (args[i] === '--sky' || args[i] === '--land' || args[i] === '--flag') {
      const role = args[i].slice(2);
      if (!args[i + 1]) throw new Error(`${args[i]} requires a path`);
      rolePaths[role] = path.resolve(args[++i]);
    } else if (args[i] === '--out') {
      if (!args[i + 1]) throw new Error('--out requires a path');
      outputPath = path.resolve(args[++i]);
    } else {
      paths.push(args[i]);
    }
  }
  if (paths.length && Object.keys(rolePaths).length) {
    throw new Error('Use positional image paths or --sky/--land/--flag, not both');
  }
  const inputs = paths.length
    ? paths.map((inputPath) => ({ role: null, name: path.basename(inputPath, path.extname(inputPath)), path: path.resolve(inputPath) }))
    : DEFAULT_INPUTS.map((item) => ({ role: item.name, ...item, path: rolePaths[item.name] || item.path }));
  return { inputs, outputPath };
}

function readPngSize(filePath) {
  const header = Buffer.alloc(24);
  const fd = fs.openSync(filePath, 'r');
  try {
    const bytesRead = fs.readSync(fd, header, 0, header.length, 0);
    if (bytesRead !== 24 || header.subarray(0, 8).toString('hex') !== '89504e470d0a1a0a') {
      throw new Error('Not a valid PNG header');
    }
    if (header.toString('ascii', 12, 16) !== 'IHDR') throw new Error('PNG IHDR chunk is missing');
    const width = header.readUInt32BE(16);
    const height = header.readUInt32BE(20);
    if (!width || !height) throw new Error(`Invalid PNG dimensions ${width}x${height}`);
    if (width * height > MAX_PIXELS) throw new Error(`PNG exceeds pixel safety limit (${width}x${height})`);
    return { width, height };
  } finally {
    fs.closeSync(fd);
  }
}

function ratio(count, total) {
  return Number((count / total).toFixed(6));
}

function analyzeAlpha(rgba, width, height, includeFlagAnchor) {
  const pixels = width * height;
  let alphaMin = 255;
  let alphaMax = 0;
  let transparent = 0;
  let semiTransparent = 0;
  let opaque = 0;
  let minX = width;
  let minY = height;
  let maxX = -1;
  let maxY = -1;
  const lowerCounts = includeFlagAnchor ? new Uint32Array(width) : null;

  for (let y = 0; y < height; y += 1) {
    const lowerHalf = includeFlagAnchor && y >= Math.floor(height / 2);
    for (let x = 0; x < width; x += 1) {
      const alpha = rgba[(y * width + x) * 4 + 3];
      if (alpha < alphaMin) alphaMin = alpha;
      if (alpha > alphaMax) alphaMax = alpha;
      if (alpha === 0) transparent += 1;
      else if (alpha === 255) opaque += 1;
      else semiTransparent += 1;
      if (alpha > 8) {
        if (x < minX) minX = x;
        if (x > maxX) maxX = x;
        if (y < minY) minY = y;
        if (y > maxY) maxY = y;
        if (lowerHalf) lowerCounts[x] += 1;
      }
    }
  }

  const bbox = maxX < 0 ? null : {
    x: minX,
    y: minY,
    width: maxX - minX + 1,
    height: maxY - minY + 1,
    x2: maxX,
    y2: maxY,
  };

  const bands = [];
  for (let i = 0; i < 10; i += 1) {
    const yStart = Math.floor((i * height) / 10);
    const yEnd = Math.floor(((i + 1) * height) / 10);
    let bandTransparent = 0;
    const bandPixels = (yEnd - yStart) * width;
    for (let y = yStart; y < yEnd; y += 1) {
      for (let x = 0; x < width; x += 1) {
        if (rgba[(y * width + x) * 4 + 3] === 0) bandTransparent += 1;
      }
    }
    bands.push({
      band: `${i * 10}-${(i + 1) * 10}%`,
      yStart,
      yEnd,
      transparentRatio: ratio(bandTransparent, bandPixels),
    });
  }

  const result = {
    alphaMin,
    alphaMax,
    pixels,
    fullyTransparent: { count: transparent, ratio: ratio(transparent, pixels) },
    semiTransparent: { count: semiTransparent, ratio: ratio(semiTransparent, pixels) },
    fullyOpaque: { count: opaque, ratio: ratio(opaque, pixels) },
    alphaGreaterThan8Bounds: bbox,
    rowBands: bands,
  };

  if (lowerCounts) {
    let maxCount = 0;
    for (const count of lowerCounts) if (count > maxCount) maxCount = count;
    result.flagLowerHalfColumnCandidates = {
      rowRange: [Math.floor(height / 2), height],
      alphaThreshold: '>8',
      maxNonTransparentPixels: maxCount,
      xCandidates: Array.from(lowerCounts, (count, x) => ({ x, count }))
        .filter(({ count }) => count === maxCount && maxCount > 0)
        .map(({ x }) => x),
      top10Columns: Array.from(lowerCounts, (count, x) => ({ x, count }))
        .filter(({ count }) => count > 0)
        .sort((a, b) => b.count - a.count || a.x - b.x)
        .slice(0, 10),
    };
  }

  return result;
}

function inspect(input, isFlag) {
  const displayPath = path.relative(ROOT, input.path).split(path.sep).join('/');
  const sourceClass = displayPath.startsWith('film/media/candidates/')
    ? 'candidate-source-only'
    : displayPath.startsWith('film/motion-v2/public/assets/wind-study/')
      ? 'study-public-copy'
      : 'ad-hoc-input';
  if (!fs.existsSync(input.path)) {
    return { role: input.role || undefined, name: input.name, path: displayPath, sourceClass, status: 'PENDING' };
  }

  const { width, height } = readPngSize(input.path);
  const expectedBytes = width * height * 4;
  const maxBuffer = Math.min(MAX_BUFFER, Math.max(32 * 1024 * 1024, expectedBytes + 16 * 1024 * 1024));
  const decoded = spawnSync(FFMPEG, [
    '-v', 'error', '-i', input.path,
    '-frames:v', '1', '-f', 'rawvideo', '-pix_fmt', 'rgba', 'pipe:1',
  ], {
    encoding: null,
    maxBuffer,
    timeout: 120_000,
    windowsHide: true,
  });
  if (decoded.error) throw new Error(`FFmpeg decode failed for ${displayPath}: ${decoded.error.message}`);
  if (decoded.status !== 0) {
    const stderr = decoded.stderr?.toString('utf8').trim() || '(no stderr)';
    throw new Error(`FFmpeg exited ${decoded.status} for ${displayPath}: ${stderr}`);
  }
  if (decoded.stdout.length !== expectedBytes) {
    throw new Error(`RGBA byte count mismatch for ${displayPath}: expected ${expectedBytes}, got ${decoded.stdout.length}`);
  }

  return {
    role: input.role || undefined,
    name: input.name,
    path: displayPath,
    sourceClass,
    status: 'INSPECTED',
    dimensions: { width, height },
    rgbaBytes: decoded.stdout.length,
    alpha: analyzeAlpha(decoded.stdout, width, height, isFlag),
  };
}

function main() {
  const { inputs, outputPath } = parseArgs(process.argv.slice(2));
  if (!fs.existsSync(FFMPEG)) throw new Error(`Bundled FFmpeg not found: ${path.relative(ROOT, FFMPEG)}`);
  const results = inputs.map((input) => inspect(input, (input.role || input.name).toLowerCase() === 'flag'));
  const report = {
    schema: 'wind-layer-inspection/v1',
    generatedAt: new Date().toISOString(),
    scope: 'alpha inspection only; candidate-source entries are not asserted to be selected or deployed assets',
    decoder: path.relative(ROOT, FFMPEG).split(path.sep).join('/'),
    method: 'PNG IHDR dimensions plus bundled FFmpeg RGBA decode; alpha metrics only, source images unchanged',
    inputs: results,
  };
  fs.mkdirSync(path.dirname(outputPath), { recursive: true });
  fs.writeFileSync(outputPath, `${JSON.stringify(report, null, 2)}\n`, 'utf8');
  const summary = results.map((item) => `${item.name}: ${item.status}${item.dimensions ? ` ${item.dimensions.width}x${item.dimensions.height}` : ''}`).join(' | ');
  process.stdout.write(`${summary}\nReport: ${path.relative(ROOT, outputPath).split(path.sep).join('/')}\n`);
}

try {
  main();
} catch (error) {
  process.stderr.write(`${error.stack || error.message}\n`);
  process.exitCode = 1;
}
