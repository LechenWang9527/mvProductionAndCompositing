// 整理交付文件夹：所有分段（已统一 1920x1080@30）+ 成片 + 提示词 + 关键帧 + 说明
const fs = require('node:fs')
const path = require('node:path')
const { execFileSync } = require('node:child_process')

const ROOT = 'E:/新建文件夹/实习/MV'
const FF = `${ROOT}/ref_mv/node_modules/ffmpeg-static/ffmpeg.exe`
const BUILD = `${ROOT}/film/pixel/out/build_ancient`
const OUT = `${ROOT}/film/pixel/out`
const DST = `${ROOT}/delivery_古代篇_20261122`

const DIRS = ['00_完整成片', '01_分段素材', '02_提示词', '03_关键帧', '99_说明']
DIRS.forEach((d) => fs.mkdirSync(path.join(DST, d), { recursive: true }))

// 时间轴定义：[build 文件名, 交付名, 起始秒, 结束秒, 说明]
const SEGS = [
  ['p00.mp4', '01_00-10s_暗夜点城.mp4', 0, 10, '从全黑星空到整座夜城被琥珀光逐层点亮的开场'],
  ['p01.mp4', '02_10-20s_沿路右行.mp4', 10, 20, '接住城市灯火，镜头右移，旅人沿石板路东行，路边灯与窗依次亮'],
  ['p02.mp4', '03_20-28.8s_水镜涟漪.mp4', 20, 28.8, '路面化成黑水，脚步荡开金色涟漪，浮灯与黑色剪影人群从水中站起'],
  ['p03.mp4', '04_28.8-30s_定格补位.mp4', 28.8, 30, '1.2 秒定格，用来把后面的段落对齐原曲（此段为技术补位）'],
  ['p04.mp4', '05_30-40s_杜甫与两团记忆.mp4', 30, 40, '杜甫现身，现实层定格，两团半透明暖金记忆浮起：长安租房＋茅屋被风吹散'],
  ['p05.mp4', '06_40-50s_广厦炊烟与一家人.mp4', 40, 50, '千万屋顶带炊烟亮起，收拢成一扇窗，一座小屋浮出，窗内一家四口'],
  ['p06.mp4', '07_50-60s_账单与购物车.mp4', 50, 60, '记忆框扩满全屏，手机账单四行（含后期压字实物名）、商品坠入购物车、滚到底只剩自己的空栏'],
  ['p07.mp4', '08_60-67.2s_路边吃泡面.mp4', 60, 67.2, '大雪里两个人蹲在路边吃泡面，竹篮婴儿与掖被角的手'],
  ['p08.mp4', '09_67.2-82.2s_吃面与走马灯.mp4', 67.2, 82.2, 'Google Flow 生成：吃面说话＋顶部四宫格走马灯＋横版行走'],
  ['p09.mp4', '10_82.2-97.2s_灯会行走.mp4', 82.2, 97.2, 'Google Flow 生成：走进灯会，孔明灯升起'],
  ['p10.mp4', '11_97.2-112.2s_赶路.mp4', 97.2, 112.2, 'Google Flow 生成：继续赶路'],
  ['p11.mp4', '12_112.2-127.2s_刘邦领饷.mp4', 112.2, 127.2, 'Google Flow 生成：刘邦在破旧官府处理琐事，月底领四枚铜板'],
  ['p12.mp4', '13_127.2-142.2s_溃败宫殿与骑手.mp4', 127.2, 142.2, 'Google Flow 生成：中国古代军队被打得溃败→刘邦殿上拔剑呐喊→外卖骑手四季奔波'],
  ['p13.mp4', '14_142.2-152.2s_城墙敬酒与告别.mp4', 142.2, 152.2, 'Google Flow 生成：刘邦城墙举杯敬将士→风把城墙吹散→杜甫与刘邦各搭一只手在主角肩上→一盏灯涨满全屏'],
]

const log = []
for (const [src, dst, a, b, note] of SEGS) {
  const s = path.join(BUILD, src)
  const d = path.join(DST, '01_分段素材', dst)
  if (!fs.existsSync(s)) { log.push('MISSING ' + s); continue }
  fs.copyFileSync(s, d)
  log.push(`${dst}  ${(b - a).toFixed(1)}s  ${note}`)
}

// 成片
fs.copyFileSync(path.join(OUT, 'ancient_full_152.mp4'), path.join(DST, '00_完整成片', 'TheOGs_古代篇_完整版_2分32秒_1080p.mp4'))

// 提示词：只保留实际采用的那一版，另附全部历史版本
const USED = {
  '01_00-10s': 'prompt_00_10_v5_darkness_reveal.txt',
  '02_10-20s': 'prompt_10_20_v1_roadwalk.txt',
  '03_20-28.8s': 'prompt_20_30_v4_flf.txt',
  '05_30-40s': 'prompt_30_40_v6_timed.txt',
  '06_40-50s': 'prompt_40_50_v3_home.txt',
  '07_50-60s': 'prompt_50_60_v3_throw.txt',
  '08_60-67.2s': 'prompt_60_67_v1_steam2snow.txt',
  '09_67.2-82.2s': 'prompt_67_82_v2_flipbook_scroller.txt',
  '10_82.2-97.2s': 'prompt_82_97_v4_pixel_hall_oneman.txt',
  '11_97.2-112.2s': 'prompt_97_112_v2_feast_phone_pixel.txt',
  '12_112.2-127.2s': 'prompt_112_127_v3_ancient_rout_slow_rider.txt',
  '13_127.2-142.2s': 'prompt_127_137_wind_wall_toast_farewell.txt',
}
fs.mkdirSync(path.join(DST, '02_提示词', '采用版'), { recursive: true })
for (const [k, v] of Object.entries(USED)) {
  const s = path.join(ROOT, 'film/pixel', v)
  if (fs.existsSync(s)) fs.copyFileSync(s, path.join(DST, '02_提示词', '采用版', `${k}__${v}`))
}
fs.mkdirSync(path.join(DST, '02_提示词', '全部历史版本'), { recursive: true })
for (const f of fs.readdirSync(path.join(ROOT, 'film/pixel')).filter((f) => f.startsWith('prompt_') && f.endsWith('.txt'))) {
  fs.copyFileSync(path.join(ROOT, 'film/pixel', f), path.join(DST, '02_提示词', '全部历史版本', f))
}

// 关键帧
const FR = path.join(OUT, 'verify')
if (fs.existsSync(FR)) {
  for (const f of fs.readdirSync(FR)) fs.copyFileSync(path.join(FR, f), path.join(DST, '03_关键帧', `成片_${f}`))
}

fs.writeFileSync(path.join(DST, '99_说明', 'manifest.txt'), log.join('\n'), 'utf8')
console.log(log.join('\n'))
console.log('\nDELIVERY:', DST)
