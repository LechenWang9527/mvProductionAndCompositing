const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

const ffmpeg = 'E:/新建文件夹/实习/MV/ref_mv/node_modules/ffmpeg-static/ffmpeg.exe';
const inputDir = 'delivery_古代篇_20261122/01_分段素材';
const outputDir = 'delivery_古代篇_20261122/03_完整成品';

if (!fs.existsSync(outputDir)) {
  fs.mkdirSync(outputDir, { recursive: true });
}

// 找到最佳可用音频文件
let audioTrack = 'film/motion-v2/public/audio/ogs.mp3';
if (!fs.existsSync(audioTrack)) {
  audioTrack = 'The OGs 视频音轨.mp3';
}
console.log('选用原曲音频路径:', path.resolve(audioTrack));

// 16个新版片段的官方精确时间轴配置
const clips = [
  { file: '01_00-10s_暗夜向右点城_新版.mp4', start: 0.00, end: 10.00, desc: '前奏暗夜点城' },
  { file: '02_10-20s_沿路右行_新版.mp4', start: 10.00, end: 20.00, desc: '我是过来人·右行' },
  { file: '03_20-30s_水镜天灯_新版.mp4', start: 20.00, end: 30.00, desc: '陪你走这一程·水镜天灯' },
  { file: '04_30-40s_杜甫回忆与秋风_新版.mp4', start: 30.00, end: 40.00, desc: '杜甫登场·秋风破屋' },
  { file: '05_40-50s_广厦四合院与工牌_新版.mp4', start: 40.00, end: 50.00, desc: '广厦千万间·工牌' },
  { file: '06_50-60s_购物车与全家福_新版.mp4', start: 50.00, end: 60.05, desc: '购物车·全家福晚饭' },
  { file: '07A_60-67.5s_生子求人与泡面分屏_新版.mp4', start: 60.05, end: 67.50, desc: '生子求人·吃面喝粥分屏' },
  { file: '07B_67.5-74.5s_跨门入园庭院漫步_新版.mp4', start: 67.50, end: 74.29, desc: '跨门入园·庭院漫步拍肩' },
  { file: '08A_74.3-82.7s_青石转黄土遇刘邦_新版.mp4', start: 74.29, end: 82.41, desc: '石板转黄土·遇佩剑刘邦' },
  { file: '08B_82.4-90.0s_三人入小城与明灯转场_新版.mp4', start: 82.41, end: 90.05, desc: '三人入小城·金光大灯' },
  { file: '09A_90.0-97.1s_刘邦基层亭长掂铜板_新版.mp4', start: 90.05, end: 96.78, desc: '刘邦亭长日常·掂铜板' },
  { file: '09B_96.8-104.6s_刘邦家宴进门倒酒豪饮_新版.mp4', start: 96.78, end: 104.59, desc: '家宴进门倒酒·牌还没发完' },
  { file: '10_104.6-112.3s_现代手机群聊炫车扣桌_新版.mp4', start: 104.59, end: 111.95, desc: '现代手机POV·点赞扣手机' },
  { file: '11_112.0-119.6s_刘邦败战突围垓下逆袭_新版.mp4', start: 111.95, end: 119.45, desc: '溃败六年·垓下一战定乾坤' },
  { file: '12_119.5-127.6s_外卖四季中国小区楼下_新版.mp4', start: 119.45, end: 127.60, desc: '外卖四季·中国小区抹汗冲锋' },
  { file: '13_127.6-137.3s_大风起城头拍肩山巅朝阳_终章_新版.mp4', start: 127.60, end: 137.26, desc: '大风起兮·城头饮酒·山巅朝阳' }
];

console.log('=== 第一步：将每个分段按MV歌词节拍点高精度裁切 ===');
const tempDir = path.join(outputDir, '_temp_trimmed');
if (!fs.existsSync(tempDir)) fs.mkdirSync(tempDir, { recursive: true });

const trimmedFiles = [];
clips.forEach((c, idx) => {
  const src = path.join(inputDir, c.file);
  const targetDuration = (c.end - c.start).toFixed(2);
  const outName = `trim_${(idx + 1).toString().padStart(2, '0')}.mp4`;
  const outPath = path.join(tempDir, outName);
  
  // 如果已经裁切好，直接复用以节约时间
  if (!fs.existsSync(outPath) || fs.statSync(outPath).size === 0) {
    console.log(`[${idx+1}/${clips.length}] 裁切 ${c.file} -> 时长 ${targetDuration}s (${c.start}s ~ ${c.end}s)`);
    // 精确裁切至目标长度，统一重新编码为标准化 1280x720 @ 24fps yuv420p，彻底杜绝帧率时间戳抖动
    execSync(`"${ffmpeg}" -y -ss 0 -i "${src}" -t ${targetDuration} -c:v libx264 -preset fast -crf 18 -pix_fmt yuv420p -r 24 -an "${outPath}"`, { stdio: 'ignore' });
  } else {
    console.log(`[${idx+1}/${clips.length}] 发现已有裁切产物 ${outName}，直接复用！`);
  }
  trimmedFiles.push(outPath);
});

console.log('\n=== 第二步：无损拼接生成纯视频流 ===');
const concatListPath = path.join(tempDir, 'concat_list.txt');
// 注意：在 concat list 中，使用绝对路径或单纯文件名，避免相对于 list 所在目录造成路径多重叠加
const listContent = trimmedFiles.map(f => `file '${path.resolve(f).replace(/\\/g, '/')}'`).join('\n');
fs.writeFileSync(concatListPath, listContent);

const silentConcatVideo = path.join(tempDir, 'silent_concat.mp4');
execSync(`"${ffmpeg}" -y -f concat -safe 0 -i "${concatListPath}" -c copy "${silentConcatVideo}"`, { stdio: 'ignore' });

console.log('\n=== 第三步：合并原曲无损音轨，导出最终完整MV ===');
const finalOutput = path.join(outputDir, 'The_OGs_古代篇_完整MV_无损对齐版.mp4');

// 从 0.00s 裁取 137.26 秒原曲音频，与视频流完全对齐，并增加 0.5s 的极轻柔音频淡出防爆音
execSync(`"${ffmpeg}" -y -i "${silentConcatVideo}" -ss 0 -t 137.26 -i "${audioTrack}" -map 0:v:0 -map 1:a:0 -c:v copy -c:a aac -b:a 320k -af "afade=t=out:st=136.76:d=0.5" "${finalOutput}"`, { stdio: 'ignore' });

console.log('\n🎉 合成圆满大成功！');
console.log('成片路径:', path.resolve(finalOutput));

// 验证最终成片信息
try {
  const probeOut = execSync(`"${ffmpeg}" -i "${finalOutput}"`, { encoding: 'utf8', stdio: ['pipe', 'pipe', 'pipe'] });
  const durMatch = probeOut.match(/Duration: ([0-9:.]+)/);
  console.log('最终成品MV时长:', durMatch ? durMatch[1] : 'unknown');
} catch (err) {
  const allOut = (err.stdout || '') + (err.stderr || '');
  const durMatch = allOut.match(/Duration: ([0-9:.]+)/);
  console.log('最终成品MV时长:', durMatch ? durMatch[1] : 'unknown');
}
console.log('成片大小:', (fs.statSync(finalOutput).size / (1024 * 1024)).toFixed(2) + ' MB');
