import fs from 'fs';
const p = 'E:/新建文件夹/实习/MV/docs/CHATGPT_IMAGE_KIT.md';
let s = fs.readFileSync(p, 'utf8');

// 1) 帧号对齐到「镜头中点」的真实采样帧
const frames = [
  ['t0030.jpg', 't0031.jpg'], ['t0037.jpg', 't0039.jpg'], ['t0041.jpg', 't0043.jpg'],
  ['t0033.jpg', 't0035.jpg'], ['t0046.jpg', 't0043.jpg'], ['t0090.jpg', 't0092.jpg'],
  ['t0095.jpg', 't0097.jpg'], ['t0101.jpg', 't0102.jpg'], ['t0112.jpg', 't0113.jpg'],
  ['t0117.jpg', 't0113.jpg'], ['t0128.jpg', 't0129.jpg'], ['t0130.jpg', 't0129.jpg'],
  ['t0063.jpg', 't0065.jpg'], ['t0067.jpg', 't0065.jpg'], ['t0287.jpg', 't0289.jpg'],
  ['t0291.jpg', 't0289.jpg'], ['t0100.jpg', 't0102.jpg'], ['t0101.jpg', 't0102.jpg'],
];
for (const [a, b] of frames) {
  if (a === b) continue;
  s = s.split(a).join(b);
}

// 2) 开头加一张对照图
const head = `# 给 ChatGPT 的配图生成指令包（image 2.5 参考图模式）`;
const head2 = `# 给 ChatGPT 的配图生成指令包（image 2.5 参考图模式）

> ## 📌 先看这张图
>
> ![这次要出的 11 张图](refs/contact_targets.jpg)
>
> 这张对照表把 **11 张要出的图** 一一标了出来：每张对应**第几秒、第几镜、放在画面哪个位置、配哪句歌词**。
> 现在每个位置都是「空格子」，出完图我就把它们填进去。
`;
s = s.replace(head, head2);

fs.writeFileSync(p, s);
console.log('kit doc updated', s.length);
