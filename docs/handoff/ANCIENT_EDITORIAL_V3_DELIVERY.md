# AncientEditorialV3 交接

## 入口与运行

- 新合成：`film/motion-v2/src/AncientEditorial.tsx`，在 `film/motion-v2/src/Root.tsx` 注册为 `AncientEditorialV3`。
- 渲染命令：在 `film/motion-v2/` 运行 `npm run render:editorial`；输出目标为 `out/motion-v2/AncientEditorialV3.mp4`。
- 旧版 `AncientDemoV2` 保留，可继续用 `npm run render`。

## 已实现

- 统一的三行字幕与本地 Noto Serif/Sans 字体加载。
- Opening、Dufu、Liu、Phone、War、Orders、Ending 独立场景模块；Phone 聊天内容叠在实体手机屏幕上，订单及战场过程由帧时码驱动。
- Phone 于 110.208 秒（原时码“扣”字）直接剪切到静态扣桌近景，不做伪装的手机翻转或手部运动；真实运动等 Gemini 视频回填后再体现。
- 四季轴顺序为“秋冬春夏”，与原歌词字面顺序一致。
- Reprise 的 scene fade 在 85.1 秒结束，人物和时间轴从 85.1 秒进入。
- 冻结后的 `out/motion-v2/AncientEditorialV3.sources.json` 保存源码、字体、音频、引用素材及视频槽映射的 SHA-256 快照；QC 确认 58 项文件的 SHA-256 和大小全部匹配。

## 最终导出与验收

- 最终文件：[AncientEditorialV3.mp4](../../out/motion-v2/AncientEditorialV3.mp4)，74,166,224 字节；SHA-256：`936A2D48792E06AEC9839D1D77460FE9220EEE1C9482BF7967EB4B9D8DD056C7`。
- [AncientEditorialV3.qc.json](../../out/motion-v2/AncientEditorialV3.qc.json) 为 PASS：H.264 High/yuv420p、1920×1080、30 fps、SAR 1:1、AAC 48 kHz stereo；4119 帧完整音视频解码 exit 0，无错误。视频时长 137.3003 秒，容器时长 137.34 秒。引用图片 21/21、MP4 复核帧 26/26。
- Phone 的 110.208 秒是源码硬切时码；30 fps 输出在 frame 3307（110.2333 秒）首次满足切换条件，不能称成片在 110.208 秒存在一个独立帧。
- 画布为 1920×1080、16:9，仅作审看；LED 屏幕映射与构图适配尚未确认。旧 `AncientDemoV2` 保留。
- `public/data/editorial_clips.json` 的 17 个 Gemini 视频槽目前 `src` 仍为空；云端 17 项提示词已验证同步，但尚无真实视频回片，相关镜头仍为静态素材。
- 歌词原时码未改；尚未完成逐字人声试听对齐验收。
