# 动画方法与工具环境证据 V2

核查日期：2026-11-11。范围仅为已有 MP4 对照帧、模板/依赖路径与现有 Canvas 接口；未改 film 源码、未安装依赖、未启动服务器、未进行全片渲染。

## 视频与取帧

`out/` 中可见的 MP4：`_trial_engine.mp4`、`ancient_demo_v1.mp4`、`bench_cpu.mp4`、`bench_gpu.mp4`、`demo.mp4`、`dufu_sequence_v1.mp4`、`film_v1.mp4` 至 `film_v9.mp4`、`film_v9_smoke.mp4`。

| 文件 | ffmpeg 探测到的时长 | 画面规格 | 大小 | 用途 |
|---|---:|---|---:|---|
| `out/film_v8.mp4` | 305.88 s | 1920×1080，60 fps | 45,033,823 B | 旧版完整片，对照基线 |
| `out/ancient_demo_v1.mp4` | 136.90 s | 1920×1080，30 fps | 40,880,104 B | 新版古代段样片；覆盖全部指定采样点 |

旧版和新样片均覆盖 6、18.5、34.4、42、105.8、123.5 秒。抽帧使用现有 `ref_mv/node_modules/ffmpeg-static/ffmpeg.exe`，输出为各视频指定时点的一张 PNG；旧帧与样片帧均保留在 [out/animation_method_audit/](../../out/animation_method_audit/)，没有覆盖既有目录。

| 秒数 | `film_v8.mp4` 可见内容 | `ancient_demo_v1.mp4` 可见内容 |
|---:|---|---|
| 6.0 | 暗底中央大号“0750”索引数字，边缘有档案 HUD。 [帧](../../out/animation_method_audit/film_v8_t006p0.png) | 暖纸底案头线描：油灯、卷轴和行囊占主要画幅，沿用顶部/底部 HUD。 [帧](../../out/animation_method_audit/ancient_demo_v1_t006p0.png) |
| 18.5 | 暗底中央“我是过来人”大字，底部歌词行。 [帧](../../out/animation_method_audit/film_v8_t018p5.png) | 长安城线描铺满主体，朱砂路径从城门沿中轴伸入；底部纸面歌词板。 [帧](../../out/animation_method_audit/ancient_demo_v1_t018p5.png) |
| 34.4 | 浅纸上的长安坊格图，少量红点标记，歌词叠在图下缘。 [帧](../../out/animation_method_audit/film_v8_t034p4.png) | 左侧杜甫人物、右侧城市图与连接路径同时出现，底部歌词板。 [帧](../../out/animation_method_audit/ancient_demo_v1_t034p4.png) |
| 42.0 | 暗色建筑蓝图、立柱剖面与标注，歌词叠在蓝图上。 [帧](../../out/animation_method_audit/film_v8_t042p0.png) | 暖纸上的完整宅院线描作为主要画面，底部歌词板。 [帧](../../out/animation_method_audit/ancient_demo_v1_t042p0.png) |
| 105.8 | 暗色终端查询文字与光标，歌词在画面下方。 [帧](../../out/animation_method_audit/film_v8_t105p8.png) | 纸底中央手机轮廓与一条消息，底部歌词板。 [帧](../../out/animation_method_audit/ancient_demo_v1_t105p8.png) |
| 123.5 | 暗色账表，显示日期、项目、成本和状态列。 [帧](../../out/animation_method_audit/film_v8_t123p5.png) | 暖纸上的沿线便笺与右上清单面板，底部歌词板。 [帧](../../out/animation_method_audit/ancient_demo_v1_t123p5.png) |

**可见差异：**旧版在这些样本中以索引、格图/蓝图、终端和账表等信息图形承载主题；新样片改为满幅纸本插画或手绘 UI 为主体，歌词与系统信息集中在底部/边缘。新样片的主体插画因此更显著，细部信息动作相对少。不能仅凭这些离散静帧说新片“只有整图推拉”：当前样片源代码还包含局部路径显影、人物分时进入、标记脉冲、灯光响应与径向遮罩（见下文）。本次采样没有比较连续相邻帧，不能据静帧衡量这些动作的速度与完整度。

`out/ancient_demo_sources.json` 中记录的 SHA-256 与当前 `chorus_sequence.js`、`prelude_sequence.js`、`dufu_sequence.js`、`layouts2.js`、`shotfilm.js` 一致，所以下述源代码结构与该样片的渲染来源相符。

## 工具与模板当前状态

| 能力 | 工作区证据 | 当前可用性 |
|---|---|---|
| `ref_mv` 渲染/取帧工具 | `ref_mv/node_modules` 内可解析 `playwright-core` 与 `ffmpeg-static`；Windows 常见安装路径下 Chrome、Edge 均存在。六对帧已用 bundled FFmpeg 实际抽出。 | **现成可用。** 本次只用了 FFmpeg；没有启动浏览器或渲染服务。 |
| `ref_mv` Canvas/WebGL2 引擎 | `src/engine/engine.js` 创建 A/B 两个内容画布和透明 overlay 画布，`renderFrame(t)` 统一调度并交给 WebGL2 post；`draw.js` 提供 clip、clipPath、masked、相机/透明度等操作；`art.js` 提供 `inkClip` / `partClip` 等轮廓遮罩。 | **源码可复用，但不是 film 的即插即用 API。** 引擎接收 `createEngine({canvas,width,height,cfg,...})`，film 使用 `window.DRAW`、`window.K` 和 `window.LAYOUTS`；要直接迁入需做接口适配。 |
| 当前 `film` Canvas 工程 | `film/index.html` 有 1920×1080 单一可见 canvas；`main.js` 暴露 `window.renderAt(t)`；`shotfilm.js` 每帧将 `local`、镜头进度和参数传给对应 layout。 `core.js` 有离屏 `makeCanvas`、绘字、纹理与遮罩效果。 | **现成可用。** 单 canvas 绘制本身能做按时间变化的图层顺序、clip、合成与 UI 状态；若要独立管理多轨画布，`ref_mv` 的 A/B/overlay 结构更完整。 |
| Shotcraft / Remotion 模板 | `ref_drawai/src/motion/shotcraft/upstream/template/` 有 `src/index.ts`、`Root.tsx`、场景 TSX、Remotion `package.json` 和运行说明；镜头库 `.tsx` 是可复制注册的 `React.FC` 源码。`TEMPLATE.md` 给出 `npm install` 后运行命令。 | **有实际可运行代码，当前环境不能直接跑。** `ref_drawai/node_modules`、模板 `node_modules`、runtime `node_modules` 均不存在；本机从模板解析不到 `remotion`、`react`、`three`、`@remotion/bundler` 或 `@remotion/renderer`。 |
| DrawAI 隔离视频 runtime | `ref_drawai/lib/motion/video-runtime.js` 把依赖放在独立 runtime 缓存中，并以包版本、原生模块与 esbuild TS 转换检查 readiness。本次只调用只读状态检查：`ready=false`、缓存目录不存在，Remotion/React/Three/bundler/renderer 均未安装，esbuild TS 转换未通过。 | **当前不可用；未触发初始化或联网安装。** `ref_drawai/package.json` 的 DSH 插件元数据只证明仓库声明了 DSH 扩展入口，不能证明插件已连接或 DeepSeek 会话已初始化；本次没有连接状态证据。 |
| MGStyles 模板与渲染器 | `ref_drawai/src/motion/mgstyles/upstream/` 同时有 prompts、说明、真实 `demos/*/index.html` / JS 源码及 `harness/render.mjs`。README 明确电影逐帧由 `window.renderAt(t)` 绘制；例如 `02-line-art/film.js` 声明 Canvas2D 纯时间函数。harness 直接 `import puppeteer from 'puppeteer-core'`。 | **不只是提示词，但本机不能直接跑它的渲染 harness。** 该副本没有 `package.json`、lockfile 或 `node_modules`，且无法从该目录解析 `puppeteer-core`。`ref_mv` 已有的是 `playwright-core`，不是 Puppeteer；不能把它误报成现成依赖。 |
| MGStyles 3D 示例 | 该副本 README 明确说明 `04-3d-render` 未收录；对应本地目录不存在。 | **此示例当前不可用。** 其余本地 demo 页面与源码存在，不代表所需 fonts、Python 音频依赖或 Puppeteer 已安装。 |

本机 `node --version` 为 v26.13.0，`npm --version` 为 11.20.0。MGStyles README 要求 Node 22.12+ 并建议安装其 npm 依赖；Shotcraft 模板也要求 npm 安装。版本号足够新不等于依赖已安装或运行通过。本次没有执行安装、启动、编译或导出。

## Canvas 分层、遮罩与 UI 状态接口

- **film 当前接口：** `main.js` 的 `renderAt(t)` 每次重绘由时间决定；`shotfilm.js` 计算当前 shot 与 `c.local` / `c.u`，调用 `LAYOUTS[kind](c)`。这是可表达逐段 UI 状态的时间入口。`core.js` 提供 scratch canvas；各 layout 可通过 Canvas 2D 的 `save/restore`、`clip`、`globalAlpha`、`globalCompositeOperation` 叠加主体、路径、文字与 HUD。
- **已实现的局部动作证据：** `prelude_sequence.js` 使用渐变遮罩与 `destination-in` 做案头显影，并用缩放/平移取景；`chorus_sequence.js` 对城市路径按时间增长、让人物错时进入，并在茅屋段保持人物后再点亮沿途灯；`dufu_sequence.js` 使用矩形 clip 显示城市图、递增长安路线并脉冲标记。它们说明当前 Canvas 代码已能承载图像主体之外的路径、遮罩、局部状态序列。
- **`ref_mv` 更完整的分层接口：** `engine.js` 的 A/B/overlay 三画布适合场景交叠和独立 HUD，`draw.js` 的 `masked(content, mask)` 与 `art.js` 的 ink/part clip 适合局部擦显或贴合主体轮廓。代码可以作为实现参考；因与 film 的入口及上下文对象不同，不能仅靠复制一个模板即运行。

## 证据文件

- 视频清单：`out/`（只读查看）；视频元数据由 bundled FFmpeg 输出。
- 抽帧：[`out/animation_method_audit/`](../../out/animation_method_audit/)
- 新样片素材源清单：`out/ancient_demo_sources.json`
- 模板说明：`ref_drawai/src/motion/shotcraft/upstream/demos/README.md`、`ref_drawai/src/motion/shotcraft/upstream/template/TEMPLATE.md`、`ref_drawai/src/motion/mgstyles/upstream/README.md`
- `ref_mv` 分层与遮罩：`ref_mv/src/engine/engine.js`、`ref_mv/src/engine/draw.js`、`ref_mv/src/engine/art.js`
- 当前 Canvas：`film/index.html`、`film/src/main.js`、`film/src/shotfilm.js`、`film/src/core.js`、`film/src/prelude_sequence.js`、`film/src/chorus_sequence.js`、`film/src/dufu_sequence.js`
