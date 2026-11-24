# 全片统一字幕轨

## 实现

- `film/src/subtitles.js` 暴露 `K.drawSubtitles(t)`。运行时在 `shotfilm.draw()` 完成 `K.finish()` 后调用一次；字幕不受镜头局部位置、字号或 `o.free` 参数影响。
- 所有布局仍可调用 `film/src/layouts.js` 的 `lyric()`，共享入口只保留兼容签名，不画字。三行固定基线为 y=842/898/946，基准字号为60/36/32px；对比底板覆盖 y=778–974，文字在84%画面安全宽度内自适应。
- 当前句逐字显示进度；下一句与下下句从 `ALL_LINES` 连续读取，不在结尾循环。暗底和黄底使用深色底板、暖白字与金色强调；纸底使用浅纸色底板、深色字与朱砂强调。未唱字保持可读；逐字 alpha 独立继承入口透明度。
- 片尾最后0.20秒，字幕 alpha 与最终自然收黑同步降低。段落 fade 已在字幕前绘制，字幕随后保持可读。

## 浏览器核验

运行 `node out/subtitle_uniform_review/verify_uniform.cjs`，返回 `failures: []`。脚本使用现有 `playwright-core` 和本机 Chrome/Edge，没有安装依赖或全片渲染。

| 画面 | 时间 | 核验 |
|---|---:|---|
| `lyricStage` 暗底（#17） | 84.20s | 当前/下一句/下下句各一套，基线842/898/946，60/36/32px |
| 宣纸底（#6） | 31.50s | 三行同一固定位置，浅底深字可读 |
| 黄色底 `swissBlocks`（#51） | 201.90s | 三行字幕与黄色主体背景分离 |
| `swissBlocks` 重复句（#78） | 274.10s | 固定三行无局部位置漂移；当前行实际宽约810px |
| 片尾 `chartGrow`（#84） | 293.00s | 当前/下一句/下下句仍维持固定三行 |
| `lastLamp` 收黑（#86） | 305.78s | 当前字 alpha=0.50，与0.20秒末尾淡出相符；该时点没有后续歌词行 |
| 历史 `free:true` 调用：`cardRain`、`beforeAfter` | 201.90s | 在浏览器中直接绘制布局后各调用一次全局字幕；每行仅一套 |

静帧和机器报告位于 `out/subtitle_uniform_review/`：`lyric-stage-dark.png`、`paper-layout.png`、`swiss-yellow.png`、`swiss-repeat.png`、`finale.png`、`final-black-follow.png`、`free-cardRain.png`、`free-beforeAfter.png`、`report.json`。长句核验覆盖当前句810px及两条后续提示；各自适配后保持在安全宽度内。

## 后续事项与边界

- 中央大号“我是过来人”是独立镜头画面元素，并非底部字幕副本。它出现在 `shotfilm.PLAN` 的 `swissBlocks` 镜头 #3、#15、#51、#78；#78 通过 `chars: 'lyric'` 从 `lineAt(c.shot.t + 0.02)` 取文本。主体素材工程师已收到此路径，负责用主体画面/动作替换演唱段中央整句；身份/人物标签可保留。
- `lyricStage` 镜头 #17、#28、#36、#53、#64、#80 只绘制节拍结构和标签，没有中央整句歌词。
- 逐字强调仍读取既有字符时间戳。此实现只统一字幕位置、重复绘制和显示可读性，不构成人声或逐字对齐验证；没有改歌词文字、时间戳或音频。
