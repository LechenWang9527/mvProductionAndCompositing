// 拼装古代篇 v2（修正版）
// 修正：删掉多余的 Two_figures_walking_and_man（它和 through_country 内容重复，开头都是走路），
//      改用 Two_figures_walking_through_country 作为「刘邦官府+领铜板」那段。
//      这样 6 段 Flow 变成 5 段，67.2 + (15+15+15+15+10) = 137.2 秒，正好收在古代篇结尾（137.1）。
//
// 时间轴（原曲秒）：
//   0.00-10.00  px_00_10            暗夜点城
//  10.00-20.00  px_10_20            沿路右行
//  20.00-28.80  px_20_30            水镜涟漪 (8.8)
//  28.80-30.00  hold_1_2            1.2s 定格补位
//  30.00-40.00  px_30_40_v6         杜甫+两团记忆
//  40.00-50.00  px_40_50_v3         广厦炊烟+小屋一家人
//  50.00-60.00  px_50_60_v3         账单+购物车
//  60.00-67.20  px_60_67_v1         路边吃泡面
//  67.20-82.20  f1 eating_and_walking        吃面+走马灯+行走
//  82.20-97.20  f3 walking_through_country   走路+灯会+刘邦官府处理琐事+领铜板
//  97.20-112.20 f4 holding_coins_in_doorway  酒席+爹指骂+手机微信群
// 112.20-127.20 f5 army_rout                古代军溃败+殿上拔剑+骑手四季
// 127.20-137.20 f6 pouring_wine_on_wall     城墙敬酒+风散城墙+三人搭肩+灯涨满屏
import { execFileSync } from 'node:child_process'
import fs from 'node:fs'
import path from 'node:path'

const ROOT = 'E:/新建文件夹/实习/MV'
const FF = `${ROOT}/ref_mv/node_modules/ffmpeg-static/ffmpeg.exe`
const OUT = `${ROOT}/film/pixel/out`
const DL = 'C:/Users/WangLC/Downloads'
const BUILD = `${OUT}/build_v2`
fs.rmSync(BUILD, { recursive: true, force: true })
fs.mkdirSync(BUILD, { recursive: true })

function run(args) {
  execFileSync(FF, ['-nostdin', '-loglevel', 'error', '-y', ...args], { stdio: 'inherit' })
}

function cutTo(src, dst, targetDur) {
  run([
    '-i', src,
    '-vf', 'scale=1920:1080:flags=neighbor:force_original_aspect_ratio=decrease,' +
      'pad=1920:1080:(ow-iw)/2:(oh-ih)/2:color=black,setsar=1,fps=30,' +
      'tpad=stop_mode=clone:stop_duration=1',
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
  // ↓ 正确的刘邦素材（官府大堂被百姓围 + 领铜板）
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
  console.log(`[${i + 1}/${SEGS.length}] ${path.basename(src)} -> ${dur}s  (ends ${acc.toFixed(2)}s)`)
  cutTo(src, dst, dur)
  parts.push(dst)
})

const listFile = `${BUILD}/list.txt`
fs.writeFileSync(listFile, parts.map((p) => `file '${p.replace(/\\/g, '/')}'`).join('\n'), 'utf8')

const silent = `${BUILD}/silent.mp4`
run(['-f', 'concat', '-safe', '0', '-i', listFile, '-c', 'copy', silent])

const AUDIO = `${ROOT}/The OGs 视频音轨.mp3`
const finalOut = `${OUT}/ancient_final_137.mp4`
run([
  '-i', silent, '-i', AUDIO,
  '-map', '0:v:0', '-map', '1:a:0',
  '-c:v', 'copy', '-c:a', 'aac', '-b:a', '192k', '-ar', '48000',
  '-t', String(acc), '-shortest', '-movflags', '+faststart',
  finalOut,
])
console.log(`\nDONE -> ${finalOut}  total ${acc.toFixed(2)}s`)
