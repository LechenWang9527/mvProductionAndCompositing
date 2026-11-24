# Ancient Motion V2

这是古代段的 Remotion/React 复审版。主合成 `AncientDemoV2` 使用逐帧确定的过程动画与共享三行字幕轨；复审画布为 **1920×1080、30 fps、4119 帧（137.3 秒）**。

## Editorial V3 独立入口

`AncientEditorialV3` 是 `src/AncientEditorial.tsx` 中的独立新合成；原 `AncientDemoV2` 保留。进入本目录后可用 `npm run render:editorial` 渲染 V3，输出 `../../out/motion-v2/AncientEditorialV3.mp4`。V3 目前仍是 **1920×1080 审看版**，不能据此推断已完成 LED 屏幕映射。`public/data/editorial_clips.json` 中 17 个视频槽当前均为空，等待 Gemini 视频回填；未回填的镜头继续使用静态素材。

## 运行

需要 Node.js 20 或更新版本，并使用本目录的依赖。先进入 `film/motion-v2`：

```powershell
npm install
npm run studio
```

Remotion Studio 会打印预览地址。主入口在 `src/Root.tsx`，组合开篇、杜甫过程、副歌、群聊、订单与结尾等逐帧场景。字幕由 `src/Subtitles.tsx` 独立绘制：当前句、下一句、下下句固定在画面底部；主体场景保留在字幕安全区上方。

## 定帧复审

`render.mjs` 的时间参数按秒输入，输出到仓库根目录 `out/motion-v2/`。例如复核群聊消息与手机扣桌过渡：

```powershell
node render.mjs stills AncientDemoV2 "103.94,105.19,106.717,108.681,109.553,111.8"
```

完整定帧列表可传入同一参数，例如：

```powershell
node render.mjs stills AncientDemoV2 "6,18.5,34.4,42,105.8,123.5"
```

## 完整渲染

```powershell
npm run render
```

等价于 `node render.mjs video AncientDemoV2`，输出 `../../out/motion-v2/AncientDemoV2.mp4`。渲染脚本使用本机 Chrome：`C:/Program Files/Google/Chrome/Application/chrome.exe`。

2026-11-11 已完整导出：137.3秒、4119帧、H.264/yuv420p、AAC原曲音轨，35,757,330字节。`node verify-render.mjs` 的全片解码、帧数/尺寸/帧率/音轨及18张引用图片检查全部通过，结果在 `../../out/motion-v2/AncientDemoV2.qc.json`。这属于文件与抽帧复审，逐字人声同步仍待试听。

## 素材与验收边界

过程场景使用 Remotion 帧驱动的状态变化、叠层、遮罩、局部揭示与表格推进。`public/assets/` 包含新增水墨资产（如 `changan_ink_v2.png`、`hut_ink_v2.png`、`shelter_ink_v2.png`、`cradle_ink_v2.png`、`noodle_ink_v2.png`、`wind_ink_v2.png`、`battle_ink_v2.png`），也包含真实手机近景 `chat_phone_v2.png` 与扣桌衔接图 `phone_down_ink_v2.png`。手机内聊天是独立屏幕 UI 层，消息按测量行高进入并滚动。

当前 1920×1080 画布仅用于复审；最终 LED 屏幕选择、映射与构图适配仍待确认。歌词源时码保持原样，逐字强调使用现有时码驱动，尚未完成逐字人声试听对齐验收，因此不代表真实逐字人声同步。

源音频位于 `public/audio/ogs.mp3`，歌词时码位于 `public/data/og_timing.json`。
