// 组装给 ChatGPT 的「风格锚点包」：把已验收的关键帧复制成固定编号，方便用户按编号上传
import fs from 'fs';
import path from 'path';

const ROOT = 'E:/新建文件夹/实习/MV';
const REF = path.join(ROOT, 'docs/refs');
const KIT = path.join(REF, 'chatgpt_kit');
fs.mkdirSync(KIT, { recursive: true });

// 清空旧文件
for (const f of fs.readdirSync(KIT)) fs.unlinkSync(path.join(KIT, f));

const picks = [
  // [目标文件名, 源相对路径, 说明]
  ['R1_woodcut_ancient.jpg', 'style_ref/S2_ancient_L30_woodcut.jpg', '木刻版画（主风格锚点 A）'],
  ['R2_ancient_paper.jpg', 'gen_refs/16_ancient_paper_card.jpg', '宣纸档案卡（纸底/印章参考）'],
  ['R3_ancient_mountain.jpg', 'gen_refs/05_ancient_mountain_plain.jpg', '古代旷野与山影（远景参考）'],
  ['R4_marpol_dark.jpg', 'style_ref/S4_marpol_L29_badge.jpg', '马牌段暗底（主风格锚点 B）'],
  ['R5_marpol_swiss.jpg', 'style_ref/S5_marpol_L33_swiss.jpg', '马牌段大字版式'],
  ['R6_terminal.jpg', 'style_ref/S3_terminal_L39_crt.jpg', '终端绿字段'],
  ['R7_blueprint.jpg', 'style_ref/S6_marpol_L36_blueprint.jpg', '蓝图段'],
  ['R8_system.jpg', 'gen_refs/01_system_title.jpg', '系统段（片头）'],
];

const done = [];
for (const [dst, src, note] of picks) {
  const from = path.join(REF, src);
  if (!fs.existsSync(from)) { console.log('MISSING', src); continue; }
  fs.copyFileSync(from, path.join(KIT, dst));
  done.push({ file: dst, note, src });
}

fs.writeFileSync(
  path.join(KIT, '_index.json'),
  JSON.stringify({ purpose: 'ChatGPT 风格锚点包', anchors: done }, null, 2),
  'utf8',
);
console.log('kit files:', done.length);
for (const d of done) console.log(' ', d.file, '←', d.src);
