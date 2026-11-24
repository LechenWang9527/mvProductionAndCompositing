const fs = require('fs');
const { execSync } = require('child_process');

// 1. 归档旧版歌词到 lyrics/_archive_old
const archiveDir = 'lyrics/_archive_old';
if (!fs.existsSync(archiveDir)) fs.mkdirSync(archiveDir, { recursive: true });
['og_lyrics.txt', 'og_timing.json'].forEach(f => {
  if (fs.existsSync('lyrics/' + f)) {
    fs.renameSync('lyrics/' + f, archiveDir + '/' + f);
  }
});

// 2. 解析新版 LRC
const lrcRaw = fs.readFileSync('lyrics/PE_Annual_Party_音频.lrc', 'utf8');
const lines = lrcRaw.split(/\r?\n/).filter(Boolean).map((line, idx) => {
  const m = line.match(/\[(\d+):(\d+\.\d+)\](.*)/);
  if (!m) return null;
  const sec = +(parseInt(m[1]) * 60 + parseFloat(m[2])).toFixed(2);
  return { idx: idx + 1, timeStr: m[1] + ':' + m[2], start: sec, text: m[3].trim() };
}).filter(Boolean);

for (let i = 0; i < lines.length; i++) {
  lines[i].end = (i < lines.length - 1) ? lines[i + 1].start : 274.21;
}

function getSection(idx) {
  if (idx <= 8) return '00_hook1_过来人(古代引子)';
  if (idx <= 31) return '01_dufu_杜甫(古代)';
  if (idx <= 39) return '02_hook2_过来人(承前)';
  if (idx <= 69) return '03_biwu_必武(现代)';
  if (idx <= 77) return '04_hook3_过来人(一进马牌)';
  if (idx <= 107) return '05_liubang_刘邦(古代)';
  if (idx <= 112) return '06_laocao_老曹(现代)';
  if (idx <= 117) return '07_wuhan_吴晗(现代)';
  if (idx <= 122) return '08_gaoxiaofan_高小凡(现代)';
  if (idx <= 127) return '09_gary_Gary(现代)';
  if (idx <= 134) return '10_chuanyong_传勇(现代)';
  if (idx <= 139) return '11_allen_Allen_Ma(现代)';
  if (idx <= 143) return '12_xiaoma_小马(现代)';
  if (idx <= 151) return '13_hook4_过来人(收尾前奏)';
  return '14_finale_工艺人大合唱(收尾)';
}

lines.forEach(l => l.section = getSection(l.idx));

// 生成新版 JSON
const newTiming = {
  version: 'PE_Annual_Party_20261124_Official',
  source_lrc: 'lyrics/PE_Annual_Party_音频.lrc',
  source_video: 'source_updates_20261124/PE_过来人MP4_字幕.mp4',
  duration: 274.21,
  line_count: lines.length,
  lines
};
fs.writeFileSync('lyrics/new_timing.json', JSON.stringify(newTiming, null, 2), 'utf8');

// 生成易读文本版 new_lyrics.txt (含中英文词条与精准分段)
let txt = '# 《过来人 / The OGs》新版官方标准歌词与时间轴 (总长 04:34.21 / 274.21s)\n';
txt += '# 来源：PE_Annual_Party_音频.lrc & PE_过来人MP4_字幕.mp4\n';
txt += '# 以后所有分镜、提示词、剪辑对齐统一以本文件及 new_timing.json 为唯一基准！\n\n';
let curSec = '';
lines.forEach(l => {
  if (l.section !== curSec) {
    curSec = l.section;
    txt += `\n## [${curSec}] (${l.timeStr} ~)\n`;
  }
  txt += `[${l.timeStr} | ${l.start.toFixed(2)}s - ${l.end.toFixed(2)}s] ${l.text}\n`;
});
fs.writeFileSync('lyrics/new_lyrics.txt', txt, 'utf8');

// 3. 提取新版音频轨
const ffmpeg = 'E:/新建文件夹/实习/MV/ref_mv/node_modules/ffmpeg-static/ffmpeg.exe';
execSync(`"${ffmpeg}" -y -i "source_updates_20261124/PE_过来人MP4_字幕.mp4" -vn -c:a copy "lyrics/PE_Annual_Party_新音轨.m4a"`, { stdio: 'ignore' });
console.log('提取完成！共', lines.length, '句歌词，音频已无损提取至 lyrics/PE_Annual_Party_新音轨.m4a');
