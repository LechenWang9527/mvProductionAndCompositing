// 拼装古代篇：像素段(1920x1080@30) + Flow 手绘段(1280x720@24) 统一到 1920x1080@30
// 时间轴（原曲秒）：
//   0.00-10.00  px_00_10            暗夜点城
//  10.00-20.00  px_10_20            沿路右行
//  20.00-28.80  px_20_30            水镜涟漪(8.80s，原段只到8.8)
//  28.80-30.00  hold(1.2s 定格)      补足到30，让后续全部踩准原曲
//  30.00-40.00  px_30_40_v6         杜甫+两团记忆
//  40.00-50.00  px_40_50_v3         广厦炊烟+小屋一家人
//  50.00-60.00  px_50_60_v3         全屏账单+购物车
//  60.00-67.20  px_60_67_v1         路边吃泡面
//  67.20-82.20  Flow seg1           吃面说话+走马灯+横版行走
//  82.20-97.20  Flow seg2
//  97.20-112.20 Flow seg3
// 112.20-127.20 Flow seg4           刘邦领铜板
// 127.20-142.20 Flow seg5           溃败+宫殿+骑手
// 142.20-152.20 Flow seg6           城墙敬酒+三人告别
import { execFileSync } from 'node:child_process'
import fs from 'node:fs'
import path from 'node:path'

const ROOT = 'E:/新建文件夹/实习/MV'
const FF = `${ROOT}/ref_mv/node_modules/ffmpeg-static/ffmpeg.exe`
const OUT = `${ROOT}/film/pixel/out`
const DL = 'C:/Users/WangLC/Downloads'
const BUILD = `${OUT}/build_ancient`
fs.mkdirSync(BUILD, { recursive: true })

function run(args) {
  console.log('$ ' + path.basename(args.find((a) => a.endsWith('.mp4')) || ''))
  execFileSync(FF, ['-nostdin', '-loglevel', 'error', '-y', ...args], { stdio: 'inherit' })
}

// 统一成 1920x1080@30 无音轨；不足时长用末帧克隆补齐，超出截断
function cutTo(src, dst, targetDur, { crop = null } = {}) {
  const vfCrop = crop ? `crop=${crop},` : ''
  run([
    '-i', src,
    '-vf', `${vfCrop}scale=1920:1080:flags=neighbor:force_original_aspect_ratio=decrease,` +
      `pad=1920:1080:(ow-iw)/2:(oh-ih)/2:color=black,setsar=1,fps=30,` +
      `tpad=stop_mode=clone:stop_duration=1`,
    '-t', String(targetDur),
    '-an', '-c:v', 'libx264', '-crf', '16', '-preset', 'slow', '-pix_fmt', 'yuv420p',
    dst,
  ])
}

const SEGS = [
  [`${OUT}/px_00_10.mp4`, 10.0],
  [`${OUT}/px_10_20.mp4`, 10.0],
  [`${OUT}/px_20_30.mp4`, 8.8],
  [`${OUT}/hold_1_2.mp4`, 1.2],
  [`${OUT}/px_30_40_v6.mp4`, 10.0],
  [`${OUT}/px_40_50_v3.mp4`, 10.0],
  [`${OUT}/px_50_60_v3.mp4`, 10.0],
  [`${OUT}/px_60_67_v1.mp4`, 7.2],
  [`${DL}/Two_figures_eating_and_walking_6eaff9d0.mp4`, 15.0],
  [`${DL}/Two_figures_walking_and_man_dc53edc3.mp4`, 15.0],
  [`${DL}/Two_figures_walking_through_coun…_e861acad.mp4`, 15.0],
  [`${DL}/Man_holding_coins_in_doorway_bd9faf94.mp4`, 15.0],
  [`${DL}/Retro_game_army_rout_and_28a5dc2a.mp4`, 15.0],
  [`${DL}/Man_pouring_wine_on_wall_4d4dd233.mp4`, 10.0],
]

const parts = []
let acc = 0
SEGS.forEach(([src, dur], i) => {
  if (!fs.existsSync(src)) throw new Error('MISSING ' + src)
  const dst = `${BUILD}/p${String(i).padStart(2, '0')}.mp4`
  acc += dur
  console.log(`[${i + 1}/${SEGS.length}] ${path.basename(src)} -> ${dur}s  (ends at ${acc.toFixed(2)}s)`)
  cutTo(src, dst, dur)
  parts.push(dst)
})

const listFile = `${BUILD}/list.txt`
fs.writeFileSync(listFile, parts.map((p) => `file '${p.replace(/\\/g, '/')}'`).join('\n'), 'utf8')

const silent = `${BUILD}/ancient_silent.mp4`
run(['-f', 'concat', '-safe', '0', '-i', listFile, '-c', 'copy', silent])

const AUDIO = `${ROOT}/The OGs 视频音轨.mp3`
const finalOut = `${OUT}/ancient_full_152.mp4`
run([
  '-i', silent, '-i', AUDIO,
  '-map', '0:v:0', '-map', '1:a:0',
  '-c:v', 'copy', '-c:a', 'aac', '-b:a', '192k', '-ar', '48000',
  '-t', String(acc), '-shortest', '-movflags', '+faststart',
  finalOut,
])
console.log(`\nDONE -> ${finalOut}  total ${acc.toFixed(2)}s`)
