# The OGs：版本与渲染入口审计

审计日期：2026-11-11。只读检查工程；未运行渲染。

## 结论

- **真实页面入口**：`film/index.html`。按顺序加载 `film/data/timeline.js`、`film/data/shots.js`，再加载 `film/src/{core,photo,ui,scenes,layouts,layouts2,layouts3,layouts4,shotfilm,main}.js`。`main.js` 装配 `window.renderAt(t)`；渲染器以 `?export=1` 禁止浏览动画循环。
- **真实导出入口**：`node film/render.mjs`。它用内置 HTTP 服务提供 `film/` 页面，通过 Playwright 驱动 Chrome 逐帧截图，交给 ffmpeg 编码；片长从 `TL.duration` 读取，当前源时间轴约 305.88 秒（5:05.88）。
- **工具路径已存在**：Node `v26.13.0`；Chrome `C:/Program Files/Google/Chrome/Application/chrome.exe`；Playwright `ref_mv/node_modules/playwright-core/index.mjs`；ffmpeg `ref_mv/node_modules/ffmpeg-static/ffmpeg.exe`。渲染脚本把这些路径硬编码为绝对路径，换工作目录/机器前需改路径。
- **最新完整成片（已导出）**：`out/film_v8.mp4`，45,033,823 bytes，60 fps，日志 `analysis/render8.log` 以 `DONE ... film_v8.mp4` 收尾，记录 18,353 帧、305.87 秒、42.9 MB。其 mtime 为 2026-11-10 21:23:34。
- **当前源码比 v8 新**：v8 之后 `layouts3.js`(21:50)、`layouts.js`(11/11 09:19)、`layouts2.js`(09:25)、`photo.js`(09:32)、`shotfilm.js`(09:34) 有更新；这些已被 `index.html` 加载，故当前预览/新导出会生效。`out/stills/` 的最近截图到 09:34:40，与 `shotfilm.js` 09:34:38 的 mtime 接近，可证明当时做过当前代码的静帧检查，不能证明这些改动完整导出成片。

## v8 之后可能已生效的改动（按 mtime/源码判断，未证实最终画面）

- `film/data/patch_depth*`、`patch_mega*`（约 21:29–21:50）对应 `layouts3.js` 21:50 更新；推测为版式/明暗调整。
- `film/data/patch_tail_slow.mjs`（09:12）及 `patch_tail_slow2.mjs`（09:25）针对片尾镜头重排和 `layouts2.js` 的 `lastLamp`；当前 `shotfilm.js` 末尾有 #81/#82、#86/#87 合并逻辑，且尾镜时长 6.88s。`_patch_finale.mjs`（09:00）也写同类逻辑并保存旧文件到 `out/retime_backup/`；它可能是中间版本，不应再盲目重跑。
- `patch_gen_load.mjs`（09:31）、`patch_gen_hang.mjs`（09:33）与 `photo.js` 09:32 以及 `film/media/gen/IMG01_dufu.png`、`IMG02_hut.png` 相符；当前入口会加载 `photo.js`，可能让插画槽生效。
- 这些补丁脚本是**一次性源码改写器**，不是页面运行依赖；实际效果由当前被 index 加载的源码决定。文件时间只用于推断先后，不足以证明脚本完整执行、导出所用源码快照或视觉正确性。

## 不要误用的旧入口/文件

- `out/film_v1.mp4` 至 `out/film_v7.mp4` 是历史导出；`out/film_v8.mp4` 是最新有完整日志支持的版本。后续静帧不是完整成片。
- `mv_engine/render.mjs`、`ref_mv/` 下的脚本属于旧/参考工程；此项目不要拿它们代替 `film/render.mjs`。
- `film/data/patch_*.mjs`、根目录 `_patch_finale.mjs`、`film/tools/fix_targets.mjs` 等不在 HTML 加载链中。不要在渲染前运行补丁脚本：它们会直接改写源码，可能重复或覆盖当前修改。
- `film/src/layouts4.js` 虽被加载（不能当废弃文件排除），即便功能暂未命中也在加载链上。`film/src/layouts3.js` 同样被加载。除此之外，未加载到 index 的 `film/tools/*` 和 `film/data/*.mjs` 都不是逐帧运行代码。

## 安全的短段预览命令

在项目根目录 PowerShell 执行，显式指定区间和输出，避免意外生成全片：

```powershell
node film/render.mjs --from 30 --to 34 --no-audio --out out/seg_30_34.mp4
```

完整导出命令（会渲染约 5 分钟影片，仅供明确需要时使用）：

```powershell
node film/render.mjs --out out/film_current.mp4 --audio "The OGs 视频音轨.mp3"
```

语法检查：`node --check` 对 HTML 当前加载链的 12 个 JS 文件逐个通过（Node v26.13.0）。这只检查语法，不验证浏览器运行、资源加载或画面。
