// 整理交付文件夹 v2（修正版：13 段，无重复走路素材）
const fs = require('node:fs')
const path = require('node:path')

const ROOT = 'E:/新建文件夹/实习/MV'
const BUILD = `${ROOT}/film/pixel/out/build_v2`
const OUT = `${ROOT}/film/pixel/out`
const DST = `${ROOT}/delivery_古代篇_20261122`

// 清空旧交付内容后重建
fs.rmSync(DST, { recursive: true, force: true })
;['00_完整成片', '01_分段素材', '02_提示词', '03_关键帧', '99_说明'].forEach((d) =>
  fs.mkdirSync(path.join(DST, d), { recursive: true }),
)

const SEGS = [
  ['p00.mp4', '01_00-10s_暗夜点城.mp4', 0, 10, '全黑星空 → 琥珀光逐层点亮整座中式夜城'],
  ['p01.mp4', '02_10-20s_沿路右行.mp4', 10, 20, '镜头右移，旅人沿石板路东行，路边窗与灯笼依次亮'],
  ['p02.mp4', '03_20-28.8s_水镜涟漪.mp4', 20, 28.8, '路面化黑水、金色涟漪、浮灯与黑色剪影人群站起'],
  ['p03.mp4', '04_28.8-30s_定格补位.mp4', 28.8, 30, '1.2 秒定格，用于把后面各段对齐原曲（技术补位）'],
  ['p04.mp4', '05_30-40s_杜甫与两团记忆.mp4', 30, 40, '杜甫现身、现实定格、两团暖金记忆浮起'],
  ['p05.mp4', '06_40-50s_广厦炊烟与一家人.mp4', 40, 50, '千万屋顶炊烟亮起 → 收拢成窗 → 小屋一家人'],
  ['p06.mp4', '07_50-60s_账单与购物车.mp4', 50, 60, '记忆框满屏、手机账单四行、商品坠车、只剩自己的空栏'],
  ['p07.mp4', '08_60-67.2s_路边吃泡面.mp4', 60, 67.2, '雪里两人蹲路边吃泡面、竹篮婴儿'],
  ['p08.mp4', '09_67.2-82.2s_吃面与走马灯.mp4', 67.2, 82.2, '吃面说话 + 记忆书页走马灯 + 起身赶路'],
  ['p09.mp4', '10_82.2-97.2s_灯会与刘邦官府.mp4', 82.2, 97.2, '赶路 → 孔明灯灯会 → 刘邦在破败官府被百姓围着办事 → 找老吏领四枚铜板'],
  ['p10.mp4', '11_97.2-112.2s_酒席与手机.mp4', 97.2, 112.2, '铜板在掌心 → 古宅酒席、老爹拍桌指骂 → 刘邦举杯一饮而尽 → 手机微信群同学晒车 → 点赞 → 手机扣桌'],
  ['p11.mp4', '12_112.2-127.2s_溃败宫殿与骑手.mp4', 112.2, 127.2, '古代军队雪地溃败 → 刘邦殿上拔剑呐喊 → 外卖骑手四季奔波'],
  ['p12.mp4', '13_127.2-137.2s_城墙敬酒与告别.mp4', 127.2, 137.2, '城墙举杯敬将士 → 风把城墙吹散 → 杜甫与刘邦各搭一只手在主角肩上 → 一盏灯涨满全屏'],
]

const log = []
for (const [src, dst, a, b, note] of SEGS) {
  const s = path.join(BUILD, src)
  if (!fs.existsSync(s)) { log.push('MISSING ' + s); continue }
  fs.copyFileSync(s, path.join(DST, '01_分段素材', dst))
  log.push(`${dst}\t${a}s-${b}s\t${(b - a).toFixed(1)}s\t${note}`)
}

fs.copyFileSync(
  path.join(OUT, 'ancient_final_137.mp4'),
  path.join(DST, '00_完整成片', 'TheOGs_古代篇_完整版_2分17秒_1080p.mp4'),
)

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
  '13_127.2-137.2s': 'prompt_127_137_wind_wall_toast_farewell.txt',
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

// 关键帧：优先用 verify2 的联络表与抽样帧
const V2 = path.join(OUT, 'verify2')
if (fs.existsSync(V2)) {
  for (const f of fs.readdirSync(V2).filter((f) => f.endsWith('.jpg'))) {
    fs.copyFileSync(path.join(V2, f), path.join(DST, '03_关键帧', `成片_${f}`))
  }
}
const SC = path.join(OUT, 'scan')
if (fs.existsSync(SC)) {
  for (const f of fs.readdirSync(SC).filter((f) => f.startsWith('SHEET_'))) {
    fs.copyFileSync(path.join(SC, f), path.join(DST, '03_关键帧', `素材_${f}`))
  }
}

fs.writeFileSync(path.join(DST, '99_说明', 'manifest.txt'), log.join('\n'), 'utf8')
console.log(log.join('\n'))
console.log('\nDELIVERY:', DST)
