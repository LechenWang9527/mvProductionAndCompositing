const fs = require('fs');
const { execSync } = require('child_process');

const dir = 'delivery_古代篇_20261122/01_分段素材';
const files = fs.readdirSync(dir).filter(f => f.endsWith('.mp4')).sort();
const ffmpeg = 'E:/新建文件夹/实习/MV/ref_mv/node_modules/ffmpeg-static/ffmpeg.exe';

console.log('=== 《The OGs 古代篇》全部分段素材资产清单 ===');
console.log('共计分段文件数: ' + files.length);
console.log('-----------------------------------------------------------------------------------------');

let totalDurationSec = 0;
let totalSizeMB = 0;

files.forEach((f, idx) => {
  const full = dir + '/' + f;
  const sizeMB = (fs.statSync(full).size / (1024 * 1024)).toFixed(2);
  totalSizeMB += parseFloat(sizeMB);
  
  let dur = '00:00:00';
  let durSec = 0;
  try {
    const out = execSync(`"${ffmpeg}" -i "${full}" 2>&1`).toString();
    const m = out.match(/Duration: ([0-9:.]+)/);
    if (m) {
      dur = m[1];
      const p = dur.split(':');
      durSec = parseFloat(p[0]) * 3600 + parseFloat(p[1]) * 60 + parseFloat(p[2]);
    }
  } catch (e) {
    const out = (e.stdout || e.message || '').toString();
    const m = out.match(/Duration: ([0-9:.]+)/);
    if (m) {
      dur = m[1];
      const p = dur.split(':');
      durSec = parseFloat(p[0]) * 3600 + parseFloat(p[1]) * 60 + parseFloat(p[2]);
    }
  }
  totalDurationSec += durSec;
  console.log(`${(idx + 1).toString().padStart(2, '0')}. ${f.padEnd(48)} | ${sizeMB.padStart(6)} MB | ${dur}`);
});

console.log('-----------------------------------------------------------------------------------------');
console.log(`汇总统计: ${files.length} 个视频片段 | 总物理时长: ${totalDurationSec.toFixed(2)} 秒 | 总文件大小: ${totalSizeMB.toFixed(2)} MB`);
