# film/motion-v2 技术考古报告（Remotion 4.0.484 引擎）

> 范围：`film/motion-v2/` 全量静态阅读 + 产物/QC/日志核对；只读调查，未改动该目录任何文件。基准对象：旧引擎 `film/`（Canvas2D + playwright 逐帧截图 + ffmpeg，成片 `out/film_v9.mp4`）。事实均来自实际读到的文件，无法确证处写「未找到」，推算项显式标注。

---

## 0. 一句话结论

`film/motion-v2` 是一套**只覆盖 0–137.3 s 古代段**的 Remotion 工程：7 个 Composition 全部 1920×1080@30fps、4119 帧，三段（AncientDemoV2 / V3 / V4）均已导出并通过自带 QC。它**不具备** 305.88 s 全曲、60 fps、现代段场景这三项能力，且 fps 在 3 处硬编码、QC 基线写死 30fps/4119 帧。要产 1080p60 全片，工作量主体是**补 137.3–305.88 s 的现代段场景**，而非调参数。

---

## 1. 入口、渲染命令、Composition、输出路径

### 1.1 工程元信息

- `film/motion-v2/package.json:2` name `ancient-demo-motion-v2`，`:3` version `0.1.0`，`:4` `"private": true`，`:5` `"type": "module"`，`:7` `engines.node >=20`（本机实测 Node v26.13.0）。
- `film/motion-v2/package.json:9-13` scripts：
  - `studio` → `remotion studio src/index.ts`
  - `render` → `node render.mjs video AncientDemoV2`
  - `render:editorial` → `node render.mjs video AncientEditorialV3`
- `film/motion-v2/package.json:14-21` 依赖：`@remotion/bundler` / `@remotion/cli` / `@remotion/renderer` / `remotion` 全为 `4.0.484`；`react`/`react-dom` 均 `19.2.7`。

### 1.2 入口链

- `film/motion-v2/src/index.ts:4` 唯一一行 `registerRoot(Root)`（共 4 行）。
- `film/motion-v2/src/Root.tsx:59` 行，`Root` 内返回 `<Composition>` 列表（52–58）。

### 1.3 Composition 清单（`film/motion-v2/src/Root.tsx:52-58`）

| id | 组件 | durationInFrames | fps | 分辨率 | 行号 |
|---|---|---|---|---|---|
| `AncientEditorialV3` | `AncientEditorial` | 4119 | 30 | 1920×1080 | :52 |
| `AncientEditorialV4` | `AncientEditorial` + `defaultProps={{enhancedMotion:true}}` | 4119 | 30 | 1920×1080 | :53 |
| `ArtDirectionPreviewV2` | `ArtDirectionPreview` | 4119 | 30 | 1920×1080 | :54 |
| `AncientDemoV2` | `AncientDemo` | 4119 | 30 | 1920×1080 | :55 |
| `IntroProcessV2` | `IntroSample` | 648 | 30 | 1920×1080 | :56 |
| `ClassmateProcessV2` | `ClassmateSample` | 241 | 30 | 1920×1080 | :57 |
| `OrderProcessV2` | `OrderSample` | 245 | 30 | 1920×1080 | :58 |

- 4119 / 30 = **137.3 s**；648/30 = 21.6 s；241/30 ≈ 8.03 s；245/30 ≈ 8.17 s。
- **7 个 Composition 的 fps 全部硬编码 `fps={30}`，无 props/环境变量可覆盖**。`render.mjs` 亦无 fps CLI 参数（见 1.5）。

### 1.4 渲染脚本 `film/motion-v2/render.mjs`（40 行，2743 B）

- `:11` `browserExecutable = 'C:/Program Files/Google/Chrome/Application/chrome.exe'`（不走 Remotion 自带 Chrome）。
- `:12` `outputDir = <project>/out/motion-v2`，`:13` 自动 mkdir。
- `:16-19` 把 `process.env.TEMP`/`TMP` 指向 `<root>/.tmp`，注释说明桌面环境默认 temp 路径含 loader 语法与继承 ACL，会导致子进程失败。
- `:20` `bundle({entryPoint: src/index.ts, publicDir: public, outDir: .bundle})` 每次渲染前重新打包。
- `:22` `selectComposition` 取时长/尺寸/fps。
- 三种模式：
  - `stills`（`:24-30`）：参数是**秒**（逗号分隔），`frame = Math.min(durationInFrames-1, Math.round(t*fps))`，输出 `${id}_${t.toFixed(2).replace('.','_')}.png`。
  - `video`（`:31-39`）：全片，输出 `${id}.mp4`。
  - `range`（`:32-35`）：参数为**含端点的帧区间** `start,end`，越界抛 `Expected an inclusive start,end frame range within the composition.`（`:33`），输出 `${id}_frames_${a}_${b}.mp4`。
- `:37` `renderMedia` 参数：`codec:'h264'`、`pixelFormat:'yuv420p'`、`colorSpace:'bt709'`、`crf:18`、`concurrency:2`，每 10% 打进度。

### 1.5 可直接执行的完整命令

```bash
# 全片（默认 AncientDemoV2，137.3 s / 4119 帧 / 1080p30）→ out/motion-v2/AncientDemoV2.mp4
cd "E:/新建文件夹/实习/MV/film/motion-v2" && npm run render

# 全片（AncientEditorialV3 版式）
cd "E:/新建文件夹/实习/MV/film/motion-v2" && npm run render:editorial

# 定帧（按秒）
node render.mjs stills AncientDemoV2 "6,18.5,34.4,42"

# 区间（按含端点帧号，1107–1229 帧 ≈ 36.9–40.97 s）
node render.mjs range AncientDemoV2 "1107,1229"

# 交互预览
npm run studio
```

### 1.6 输出路径与实测产物

- 目录 `out/motion-v2/`（`render.mjs:12`），另见 `README.md:7` 说明 V3 输出到 `../../out/motion-v2/AncientEditorialV3.mp4`。
- 实测三份成品（`ffmpeg -i` + 对应 `.qc.json`）：
  - `AncientDemoV2.mp4`：31,556,854 B，137.34 s 容器，H.264 High yuv420p(tv, bt709) 1920×1080 SAR 1:1 30 fps，AAC 48 kHz stereo 317 kb/s。
  - `AncientEditorialV3.mp4`：74,166,224 B。
  - `AncientEditorialV4.mp4`：69,266,233 B。
  - 注：`README.md:42` 记「2026-11-11 已完整导出 137.3 秒 / 4119 帧 / H.264 yuv420p / AAC 原曲 / **35,757,330 字节**」，该数字实为同目录 `古代_demo_two_送审版.mp4`（16:23:03，35,757,330 B）；现 `AncientDemoV2.mp4` 为 31,556,854 B，与 `AncientDemoV2.fixed.mp4` 字节数/时间戳完全一致（16:42:03），即已被 `assemble-roof.log` 的 concat 版覆盖。
- `film/motion-v2/README.md`（50 行，3003 B）：`:3` 明示 1920×1080/30fps/4119 帧/137.3 s；`:7` V3 独立入口与输出路径；`:40` 记录 Chrome 路径；`:46` 列资产；`:48` 声明「画布仅用于复审、LED 映射待定、逐字人声同步未验收」；`:50` 指明源音频 `public/audio/ogs.mp3` 与歌词时码 `public/data/og_timing.json`。

---

## 2. 四个核心组件

### 2.1 `src/AncientEditorial.tsx`（31 行）—— 编辑版总装

- `:13` `AncientEditorial: React.FC<{enhancedMotion?: boolean}>`，默认 `false`。
- 时间驱动而非 Sequence：`time = frame / fps`，用 if/else 路由（`:17-24`）：`<30` Opening → `<74.3` Dufu → `<90` Opening(reprise, 带 `enhancedMotion`) → `<103.94` Liu → `<111.95` Phone → `<119.45` War → `<127.6` Orders(`alignMarkers={enhancedMotion}`) → else Ending。
- `:25` 外层 `AbsoluteFill background:'#f8f6f0' overflow:'hidden'`；`:26` `<MVFonts />`；`:27` `<Audio src={staticFile('audio/ogs.mp3')} />`；`:29` `<SubtitleTrackEditorial ancientOnly />`。
- 与 `Root.tsx:13-32` 的 `AncientDemo` 是两条并行路由（同为 137.3 s，但场景组件来自 `src/scenes/`，非 `src/editorial/`，底色 `#e7ddc8` vs `#f8f6f0`）。

### 2.2 `src/ArtDirectionPreview.tsx`（22 行）—— 美术方向静态证明

- 仅三张静态图按时码切换：`t>=127.6` → `wind_landscape_v3.png`；`t>=40.993` → `many_homes_v2.png`；else `changan_ink_v2.png @33.065`。
- 淡入用 `reveal = clamp((t-at)/0.8)`。
- `CinematicPlate` 承载画面 + `SubtitleTrackEditorial ancientOnly`。
- 文件注释明写：不对静态图冒称「生成动态」，生产镜头路径保持独立。**它是版式/调色 proof，不是成片引擎。**

### 2.3 `src/Subtitles.tsx`（42 行）—— 旧字型字幕轨

- `:3` `import timing from '../public/data/og_timing.json'` —— **确实读 `og_timing.json`**（与 `lyrics/og_timing.json` 同尺寸 53,867 B、同 mtime）。
- `:13` `ancientOnly` 时 `lines.filter(line => line.start < 136.9)`（注释：现代段首行与古代末行重叠，故取 136.9 而非 137.3）。
- 三行展示：当前句 + 后两句。当前句字号 `:18` `Math.min(60, 1530 / chars.length)`；下两行 `:38` `Math.min(36|32, 1530/len)`。
- 逐字朱砂擦除：`:27` `clipPath: inset(0 ${100*(1-progress)}% 0 0)`，progress 用 `(t - c.t) / max(0.05, next.t - c.t)`。
- 容器：`left:96 top:778 width:1728 height:196`，纸底 `rgba(241,233,215,.97)`，`1.5px` 边框，左侧 4px 朱砂条，`zIndex:100`。

### 2.4 `src/SubtitlesEditorial.tsx`（82 行）—— 编辑版字幕轨

- `:3` 同样读 `og_timing.json`；`:12` props `{offset=0, ancientOnly=false, tone='paper'}`。
- 两套色（`:16-20`）：paper = `#3b3025/#594d40/#6b6054` + 朱砂 `#a8402c`；night = `#f4eadb/#eee1cf/#d9c9b4` + 朱砂 `#df6849`。
- `:21-23` 顶部 `subtitleFade` 渐变（`linear-gradient(180deg, …)`），night/paper 两版。
- 布局 `:60` `left:96 top:778 width:1728 height:186`；行高 `82px / 52px / 52px`（`:65`、`:73`），当前句 `:31` `Math.min(58, 1530/len)`，下两行 `:70` `31/27`。
- 字体取自 `MV_FONT_FAMILIES.serif/sans`（`:65`、`:73`），由 `src/visual/Fonts.tsx` 注入。

---

## 3. 目录逐文件职责

### 3.1 `src/scenes/`（6 文件，约 2979 行）—— 「过程/动画版」场景（AncientDemoV2 用）

| 文件 | 行数 | 职责 |
|---|---|---|
| `IntroProcess.tsx` | 400 | 开场卷轴展开/点灯/时间旅行动画；`:29-41` `INTRO_V2_CUES`（duration 21.6、lampIgnition [0.28,0.82]、scrollUnfurl [3.5,7.4]、timeTravel [16.62,20.4]）；`:341` `INTRO_PROCESS_V2_DURATION_IN_FRAMES = 648`；`:343` 组件 |
| `ChorusProcess.tsx` | 428 | 副歌段落双次复用（intro 21.6→30、reprise 74.3→90）；`:7-25` `CHORUS_PROCESS_CUES`；`:225` `repriseEventFrame(index, fps)`；`:403` 组件 `({globalTime, reprise=false})` |
| `DufuProcess.tsx` | 588 | 杜甫段落十一镜头（moving→recap）；`:9-27` `DUFU_V2_CUES`；`:557` 组件 |
| `LifeProcess.tsx` | 516 | 同学段 + 订单段；`:9-13` `LIFE_V2_CUES`（classmate 103.94–111.95 / order 119.45–127.60）；`:137` `ClassmateProcess`；`:361` `OrderProcess` |
| `LiuProcess.tsx` | 726 | 刘邦段 + 战争段 + 风之回顾段；`:48/61/69` 三组 CUES；`:119` `LiuProcess`；`:317` `WarProcess`；`:632` `WindRecapProcess`；`:395-403` `RECAP_NODES`（租房/茅屋/钥匙/账单/群聊/战争/订单） |
| `PhoneChatProcess.tsx` | 321 | 手机聊天逐条气泡动画；START 103.94 / END 111.95；`SCREEN {x:446,y:0,width:1030,height:760}`、`THREAD {top:88,height:552}`；`:81` `layoutPhoneChatRows`；`:113` `measureChatBubble`；`:230` 组件 |

### 3.2 `src/editorial/`（8 文件，约 1182 行）—— 「编辑/静止版」场景（V3/V4 用）

| 文件 | 行数 | 职责 |
|---|---|---|
| `Opening.tsx` | 450 | 开场与副歌 reprise 两版；`:431` `Opening({time, enhancedMotion})`，断言取值只在 0–30 或 74.3–90；含 `SCROLL_SRC_W = 2172` 卷轴 |
| `Dufu.tsx` | 90 | 杜甫段按 11 个时间点切镜（33.065/36.904/40.993/43.015/45.636/48.25/51.93/60.053/61.617/63.72/67.41）；`:72` 组件；末段 `MemoryTravel` 四卡（辗转/安身/奔波/深夜） |
| `Liu.tsx` | 28 | 刘邦段薄壳；`:6` `Liu({time})` |
| `Phone.tsx` | 267 | 手机段编辑版；`:13` `HANDOFF_AT = 110.208`（源码硬切时码）；`:185` 组件；useEffect → `loadMVFontsOnce()` → `measureRows()`，复用 `layoutPhoneChatRows` |
| `War.tsx` | 80 | 战争段；`:13` `War`，`START 111.95 / END 119.45`，`MARKS [112.08,112.63,113.18,113.73,114.28,114.83]`，7 个 `NODE_X` 节点，朱砂 `BrushRule` |
| `Orders.tsx` | 151 | 订单段季节轴；`:128` `Orders({time, alignMarkers})`；季节 `['秋','冬','春','夏']`，`SEASON_X [1080,1260,1440,1620]`，`SEASON_START 120.85`，`FINAL_ROW_STOP 126.857`；用 `interpolateColors` 控温；`Painting courier_shift_ink_v3.png` |
| `Ending.tsx` | 37 | 结尾两版；`:9` `Ending({time, enhancedMotion})`：`<133.52` 且 enhancedMotion 且 clip 槽有 src → `WindScene`，否则 `Painting wind_landscape_v3.png`；否则 `MemoryTravel` 四卡（安身/沉默/走过/继续）+ 油灯 `lamp_cutout_v2.png` + `BrushRule` |
| `Shot.tsx` | 79 | 共用原语与调色板：INK `#29251f` / RED `#a23e2c` / PAPER `#f8f6f0`；`ease/at/clamp/asset`；`:19` `Painting`（`:32-34` clip 有 src 时 `<Sequence from={round(start*fps)} layout="none"><OffthreadVideo muted startFrom={clip.sourceStartFrame}/>`，否则 `<Img>`）；`:41` `Portrait`；`:47` `Note`；`:54` `MemoryTravel` |

### 3.3 `src/visual/`（5 文件，约 655 行）—— 视觉基建

| 文件 | 行数 | 职责 |
|---|---|---|
| `EditorialStage.tsx` | 275 | 版式基座：`EDITORIAL_CANVAS 1920×1080`、`EDITORIAL_SAFE_AREA {top:60,bottom:730,subtitlesTop:778}`、`EDITORIAL_COLORS`、`EDITORIAL_TYPE`、`PAPER_GRAIN`；`:50` `EditorialStage`（默认 `cornerInkSrc:'wind_ink_v2.png', cornerOpacity:.13`）；`:128` `Artwork`；`:167` `progressBetween`；`:175` `useProgress`；`:220` `BrushRule`（SVG 干笔触，`seed` 默认 77） |
| `Fonts.tsx` | 110 | 本地字体：`MV_FONT_FAMILIES = {serif:'MV Serif', sans:'MV Sans'}`；`:29` `loadMVFontsOnce` 用 `FontFace` 加载 `fonts/NotoSerifSC-VF.ttf` / `fonts/NotoSansSC-VF.ttf`；weight 400/600；`:90` `MVFonts` 组件 |
| `InkReveal.tsx` | 86 | 墨边虹吸揭示：`feTurbulence baseFrequency 0.02 numOctaves 3 seed 7` + `feDisplacementMap`，`radius = 2400*value`、`displacement = 12+12*value`；value≤0 返回 null，≥1 移除 SVG |
| `WindLayers.tsx` | 168 | 三层视差风景：`LAYER_SCALE 1.035`、`FALLBACK assets/wind_landscape_v3.png`、`:51` `FlagMotion`、`:120` `MEASURED_FLAG_MOTION`、`:127` `WindScene`；**`:135` `const fps = 30` 硬编码**；`drive = 33.5*ramp(...) + 1.5*ramp(...)`；三层 `wind-study/{sky,land,flag}.png` |
| `CinematicPlate.tsx` | 16 | 全幅图/视频板：`OffthreadVideo` + `videoStartFrame` |

### 3.4 `src/vendor/shotcraft/`（4 文件，约 559 行）—— 第三方组件

- `UPSTREAM.md`（9 行）：源仓库 `https://github.com/VincentWei1021/video-shotcraft`，pin commit `1266a3ec4831289c4d893d42dd5102723658039a`，Apache-2.0；从 `demos/_fixtures/{Polish,Look}.tsx` 原样复制，无 Canvas-v1 适配。
- `LICENSE`：Apache-2.0 原文。
- `Polish.tsx`（243 行）：动效原语 —— `:14` `bezier`、`:44` `EASE`、`:56` `ramp`、`:60` `mix`、`:63` `velocity`、`:67` `FONT`、`:73` `tracking`、`:90` `softShadow`、`:101` `hairline`、`:105` `innerHighlight`、`:108` `surface`、`:148` `Grain`、`:168` `Vignette`、`:188` `SpeedBlur`、`:214` `Backdrop`。
- `Look.tsx`（316 行）：`:33` `LOOKS` 8 套、`:85` `rgbOf`、`:91` `alpha`、`:97` `TYPE`、`:99` `SERIF`、`:117` `stagger`、**`:121` `springAt` 内 `fps: 30` 硬编码**、`:138` `Stage`（key/fill 双光源 + brim + Vignette + Grain）、`:175` `GridFloor`、`:215` `Dust`、`:242` `Sheen`、`:267` `TextReveal`。

### 3.5 素材与数据

- `public/assets/`：30 个 png + 4 个子目录（`chorus-v2/`、`chorus-v3/`、`chorus-v4/`、`wind-study/`）。**`chorus-v2|v3|v4` 在 `src/` 中零引用**（grep 无命中），属 studies 残留。
- `public/data/og_timing.json`：53,867 B，结构 `{duration, line_count, lines}`；167 行歌词，首行 start 14.99（"我是过来人"），末行 `section:"22 finale"` start 300.06 / end 305.899。
- `public/data/editorial_clips.json`：17 个槽位，全部 `{"src": null, "sourceStartFrame": 0}` —— 视频槽空，等外部回填（`README.md:7` 记为「17 个视频槽 src 全空等 Gemini 回填」）。
- `public/audio/ogs.mp3`：3,679,286 B。
- 另有 `studies/`（`chorus-process`、`lamp-ignition`、`wind-multiplane` 三个独立 study 工程），不参与主渲染。

---

## 4. `verify-render.mjs` 检查项清单（任务重点）

文件 392 行 / 17,711 B。用 `ref_mv/node_modules/ffmpeg-static/ffmpeg.exe`（`:14`，实测存在 82,797,568 B）做两件事：`-i` 读头部元数据（预期 exit 1，`:114-116` 标注 `headerOnlyInspection`），以及全片解码 `-map 0:v:0 -map 0:a? -vf showinfo -f null NUL`。

`EXPECTED` 基线（`:16-21`）：

| id | 尺寸 | fps | durationSeconds | frames |
|---|---|---|---|---|
| AncientDemoV2 / AncientEditorialV3 / AncientEditorialV4 | 1920×1080 | 30 | 137.3 | 4119 |
| IntroProcessV2 | 1920×1080 | 30 | 21.6 | 648 |

`EDITORIAL_STILL_SAMPLE_COUNTS = { AncientEditorialV3: 26, AncientEditorialV4: 8 }`（`:22`）。

### 4.1 14 项 checks 逐条判据（`:325-342`）

| # | check | 判据 | 阈值 | 行号 |
|---|---|---|---|---|
| 1 | `videoExists` | 成品文件存在 | — | :326 |
| 2 | `ffmpegAvailable` | ffmpeg.exe 存在 | — | :327 |
| 3 | `videoStreamFound` | 能从头部解析出 Video 流 | — | :328 |
| 4 | `videoDimensions` | 宽高严格等于 expected | **1920×1080，严格 `===`** | :329 |
| 5 | `frameRate` | `near(actual, 30, 0.001)` | **±0.001** | :330 |
| 6 | `sampleAspectRatio` | 字符串严格等于 `'1:1'` | 严格 | :331 |
| 7 | `audioStreamFound` | 存在 Audio 流 | **仅验存在**，不验响度/声道/采样率/时长 | :332 |
| 8 | `duration` | `near(解码视频时长, 137.3, 0.01)` | **±0.01 s** | :333 |
| 9 | `containerDurationWithinAudioTail` | 容器时长 `near(137.3, 0.08)` | **±0.08 s**（容音频尾巴） | :334 |
| 10 | `decodedFrames` | `actualFrames === expected.frames` | **严格 `=== 4119`** | :335 |
| 11 | `durationFrameCountAgreement` | `Math.round(videoDuration * fps) === decodedFrames` | 自洽 | :336-338 |
| 12 | `fullDecodeExitZero` | 全片 `-f null` 解码 exit 0 | exit 0 | :339 |
| 13 | `sceneImagesExistAndDecode` | 源码引用的每张图：存在 + 尺寸可读 + 能解码 | ≥1 张且全部 passed | :340 |
| 14 | `mp4SampleFramesExtracted` | 仅 V3/V4 触发：从成片按 still 时点重抽图 | 数量相符且每张 exit 0、size>0 | :341 |

校验失败时追加 errors 文案，见 `:351`（SAR）、`:353`（容器时长）、`:354`（帧数）、`:355`（帧数-时长一致性）。最终 `passed = 全部 checks 为 true 且 errors 为空`（`:362`），报告写 `out/motion-v2/<id>.qc.json`（`:309`/`:390`），`process.exitCode = passed ? 0 : 1`（`:392`）。

### 4.2 第 13 项的实现细节（`:231-253`）

按 `.tsx` **源码正则**抓图片路径：`` /['"`]([^'"`]*\.(png|jpe?g|webp|gif|bmp|tiff?|avif|svg))['"`]/ ``，只取落在 `assets/` 下的，跳过含 `${` 的模板串。即「源码里写到的图必须都能解码」——静态检查，不验证它是否出现在画面里。

### 4.3 第 14 项抽帧机制（`:152-198`）

- 正则 `^${id}_(\d+)_(\d{2})\.png$` 扫 `out/motion-v2/`，**按 mtime 取最新 N 张**再按秒排序，`ffmpeg -ss <seconds> -frames:v 1` 从成片重抽到 `out/motion-v2/video-qc/<id>-mp4-frames/`。
- 实际图数与写死值会漂移：`out/motion-v2` 下匹配 `^AncientEditorialV3_\d+_\d{2}\.png$` 的 still 实有 **50 张**（脚本要求 26），V4 恰好 8 张。→ **该项结果依赖目录里当时最新的一批 still，非确定性输入**。

### 4.4 它**没有**验什么（已 grep 全文确认）

脚本内**完全不存在** `blackframe` / `blackdetect` / `ebur128` / `signalstats` / `ssim` / `psnr` / `freezedetect` / `silencedetect` / `loudnorm` / `volumedetect`。因此：

- ❌ **不验黑帧**（无黑场检测，全黑片只要帧数/时长对也能 PASS）
- ❌ **不验对比度/亮度/色域数值**（只有头部 colorSpace 标签，无逐步信号统计）
- ❌ **不验音频内容**（只验「有音频流」；响度、静音、爆音、是否与画面同步一概不查）
- ❌ **不验画面与 still 的相似度**（抽帧只是「能按该时点解出一张图」，不与原 still 做 SSIM/PSNR 比对）
- ❌ **不验字幕与歌词同步**、不验逐字人声对齐（`README.md:50` 亦自认「逐字人声未验收」）
- ✅ 真正硬的判据只有：分辨率严格 1920×1080、fps 30±0.001、SAR 1:1、视频时长 137.3±0.01 s、容器 137.3±0.08 s、**帧数严格 4119**、全片解码 exit 0、源码引用图全部可解码、V3/V4 抽帧数量相符。

### 4.5 实测 QC 结果（读 `out/motion-v2/*.qc.json`）

| 成品 | passed | sizeBytes | 容器 | decoded | videoDuration | 资产 | 抽帧 |
|---|---|---|---|---|---|---|---|
| AncientDemoV2 | true | 31,556,854 | 137.34 s | 4119 | 137.30033333 | 18/18 | 13 项，无抽帧项 |
| AncientEditorialV3 | true | 74,166,224 | 137.34 s | 4119 | 137.30033333 | 21/21 | 26/26 |
| AncientEditorialV4 | true | 69,266,233 | 137.34 s | 4119 | 137.30033333 | 24/24 | 8/8 |

另有两份配套产物：`out/motion-v2/<id>.sources.json`（源码+素材 SHA-256 清单）与 `AncientEditorialV3.contract.json`（18,803 B，扫 11 个 tsx、`referencedImageCount 21`、missing 0、invalidPng 0，scope 明写「No render or video decode」）。

---

## 5. 实际跑过的渲染与遇到的问题（日志考古）

`film/motion-v2/` 下共 **24 个日志**（2–207 行），**全部无时间戳**，形态为一行 JSON 元信息 + `0%…100%` + 输出路径，或 still 文件名列表。

### 5.1 全片渲染（成功）

| 日志 | 目标 | 内容 |
|---|---|---|
| `render-full-v2.log`（24 行） | AncientDemoV2 4119 帧 | 走到 100%，**中途抛 `ProtocolError: Protocol error (Page.bringToFront): Target closed.`**，但最终仍写出 mp4 |
| `render-editorial-full.log`（14 行） | AncientEditorialV3 4119 帧 | 0%→100% + 输出路径 |
| `render-editorial-final.log`（14 行） | AncientEditorialV3 4119 帧 | 同上（第二次） |
| `v4-full-render.log`（14 行） | AncientEditorialV4 4119 帧 | 0%→100% + 输出路径 |
| `render-video.log`（14 行） | `IntroProcessV2` 648 帧 | 0%→100%，输出 `out/motion-v2/IntroProcessV2.mp4` |
| `render-roof-range.log`（24 行） | range 1107–1229 帧 | 同样抛 `Page.bringToFront … Target closed`，产物 `AncientDemoV2_frames_1107_1229.mp4` |

### 5.2 失败/异常

- `render-editorial-proof.log`（79 行）—— **唯一硬失败**：`ArtDirectionPreviewV2` 渲染时 `wind_landscape_v3.png` 返回 **404**，报 `EncodingError: The source image cannot be decoded.`，随后 `Could not load image with source http://localhost:3000/public/assets/wind_landscape_v3.png, retrying again in 1000ms/2000ms`，最终 `Error: Error loading image with src: …` 崩溃。说明当时 `staticFile()` 拼出的 `/public/assets/...` 路径下该文件不存在。
- `assemble-roof.log`（207 行）—— 修复手段：用 ffmpeg 把 `AncientDemoV2.mp4`（trim 到 1107 帧）+ `AncientDemoV2_frames_1107_1229.mp4`（setpts 续接）concat 成 `AncientDemoV2.fixed.mp4`，音频 `Stream #0:1 -> #0:1 (copy)` 直拷，`libx264 crf=18`，收尾 `frame= 4119 fps= 64 … speed=2.12x`、`video:25348kB audio:5321kB`、`kb/s:1512.35`。产物 31,556,854 B，与 `AncientDemoV2.mp4` 字节数完全一致 —— 即 **`render-full-v2.log` 那次「出错」的整片其实是硬拼出来的**。
- `ProtocolError: Page.bringToFront … Target closed` 在整片与 range 两次出现，属 Chrome 标签页被关闭导致的渲染中断；没有 seeing 到重试逻辑，**说明 render.mjs 对浏览器崩溃无自愈**。

### 5.3 定帧批次（stills 模式）

`render-full-stills.log` 18 张、`render-editorial-qc.log` 26 张、`render-editorial-refine.log` 26 张、`render-final-check.log` 11 张、`v4-key-stills.log` 8 张、`render-phone.log` 5 张、`render-final-layout.log` 4 张、`render-opening-reprise-qc.log` / `render-opening-final-qc.log` 各 4 张、`render-chat.log` 4 张、`render-last.log` 4 张、`render-roof-check.log` 2 张、`render-editorial-proof2.log` 2 张（3 行）；`v4-mp4-extra-frames.log`（3 行）记录了 `time=110.233s frame=3307` / `133.533s frame=4006` / `137.2s frame=4116` 三张从成片抽出的复核帧。`verify-fixed-v2.log` / `verify-full-v2.log`（各 21 行）是 `verify-render.mjs` 的 JSON 输出，两者均 `passed: true`、`errors: []`。

### 5.4 耗时：**日志中未找到显式记录**

只能从文件 mtime 差推出「该次会话的渲染窗口上界」：

| 区间 | 差值 |
|---|---|
| `render-full-v2.log` → `AncientDemoV2.mp4` | 16:23:03 → 16:42:03 = **19.00 min** |
| `render-editorial-full.log` → `AncientEditorialV3.mp4` | 00:32:40 → 01:10:50 = **38.16 min** |
| `render-editorial-final.log` → `AncientEditorialV3.mp4` | 差值 ≈ 0 s（日志在渲染结束后另写） |
| `v4-full-render.log` → `AncientEditorialV4.mp4` | 差值 ≈ 0 s（同上） |

这些差值都**包含改样式、开 Studio 试跑等非渲染时间**，不能当作纯渲染速率；日志里也没有 `DONE … ms/frame` 之类的吞吐行（旧引擎 `film/render.mjs:141` 有该行）。

---

## 6. 与旧引擎 `film/` 的能力差异，以及「1080p60 全片 305.9 s」怎么产

### 6.1 能力矩阵

| 维度 | 旧引擎 `film/` | `film/motion-v2` |
|---|---|---|
| 时间覆盖 | **305.88 s 全曲**（`out/film_v9.mp4` 实测 5:05.88） | **仅 0–137.3 s 古代段**，4119 帧封顶 |
| 帧率 | CLI `--fps`，默认 60，实测 1080p60 全片 | **硬编码 30**（`Root.tsx:52-58`），无 CLI 参数 |
| 分辨率 | CLI `--width/--height`，默认 1920×1080 | 硬编码 1920×1080 |
| 渲染方式 | `window.renderAt(t)` + `page.screenshot({jpeg q95})` 管道进 ffmpeg（`film/render.mjs:119-121`） | Remotion `renderMedia`（Chromium 逐帧 React 渲染，`crf 18` bt709） |
| 字体 | 未在本报告核实 | **本地 Noto Serif/Sans SC VF**（`Fonts.tsx:29`），不依赖网络 |
| 字幕时间源 | `data/timeline.js` + `data/shots.js` | **`og_timing.json`**（167 行含逐字 `t`） |
| 视频槽/接片源 | — | `editorial_clips.json` 17 槽 + `<OffthreadVideo>`（`Shot.tsx:32-34`），**目前全空** |
| 组件复用 | 12 个 JS 脚本全局挂载（`film/index.html:17-34`） | TSX 组件树 + 8 套 vendor `LOOKS`、`BrushRule`/`InkReveal`/`WindScene` 等原语 |
| 断点续渲 | `--from/--to` 秒级 | `range` 帧级（含端点），但**无自动拼接**，本次靠手写 ffmpeg concat 补救 |
| QC | 未在本报告核实 | `verify-render.mjs` 14 项**硬判据**（分辨率/fps/SAR/时长/帧数/解码/资产），但**不验黑帧、对比度、音频内容、字幕同步** |
| 崩溃自愈 | 未核实 | **无**（`Page.bringToFront Target closed` 直接中断） |
| 产物音频 | AAC 44.1 kHz **mono**（`out/film_v9.mp4`） | AAC **48 kHz stereo** 317 kb/s |

### 6.2 它强在哪 / 做不到什么

**强**：

1. **帧级确定性**：所有时间由 `frame/fps` 派生，无 Canvas 随机与截图竞态，`4119` 帧可复现（三次成品 decodedFrames 均严格 4119）。
2. **硬判据 QC**：`verify-render.mjs` 有严格的分辨率/fps/SAR/双时长/帧数/全解码/资产可解码检查，比旧引擎（本报告未找到同等 QC）更可交付。
3. **组件化复用**：`src/editorial/` 8 个场景 + `src/visual/` 5 个基建 + vendor 8 套 LOOKS，新镜头是「加组件」而非「改巨型 JS」。
4. **本地字体 + 纸质版式系统**：`MVFonts`、`EditorialStage` 安全区（`subtitlesTop:778`）、`InkReveal`/`BrushRule` 提供统一视觉语言。
5. **接片源接口已留好**：17 个 `<OffthreadVideo>` 槽只要回填 `src` 就能混入实拍/AI 视频。

**做不到**：

1. **覆盖不到 305.88 s**：`og_timing.json` 167 行中 69 行 `start < 136.9`（被 `Subtitles.tsx:13` 取用），**97 行 start ≥ 137.3**（现代段），当前 Composition 0 覆盖。补 137.3–305.88 s（168.58 s）是**新做约一半内容**，不是调参。
2. **不能直接出 60 fps**：7 个 Composition 写死 `fps={30}`，且 `src/vendor/shotcraft/Look.tsx:121` 的 `springAt` 与 `src/visual/WindLayers.tsx:135` 的 `const fps = 30` 各有一处 30 硬编码 —— 只改 `Root.tsx` 会让弹簧缓动与风层驱动速度错一倍。
3. **不验黑帧/对比度/音频内容**：QC 全绿不代表画面没黑场、音频没静音（见 4.4）。
4. **浏览器崩溃无自愈**：`Page.bringToFront Target closed` 已出现两次，range 与整片拼接需手工 ffmpeg（见 `assemble-roof.log`）；17 个 `editorial_clips.json` 槽 `src: null`，目前全是静态图/矢量动画。
5. **`render.mjs` 无 fps/分辨率/CRF CLI**，`crf:18` 与 `concurrency:2` 也写死（`render.mjs:37`）。

### 6.3 「1080p60 全片 305.9 s」怎么产

**前提（必须承认的现实）**：当前工程**无法直接产出** 305.9 s 成品 —— 缺 168.58 s 现代段场景，且 fps 写死 30。下面给出「改造后」的路径与命令，改造项逐条列出：

1. **补现代段场景**：137.3–305.88 s 需新增 `src/editorial/` 下的现代段组件（`og_timing.json` 已提供 97 行现代段字幕与逐字时码，可直接复用 `SubtitleTrackEditorial`）。
2. **提 fps 到 60**：`src/Root.tsx:52-58` 全部改 `fps={60}`，`durationInFrames` 改 `18353`（305.88 × 60 = 18352.8，向下取整；若以音频元数据 5:05.92 对齐则 `18354`）。
3. **修两处 30 硬编码**：`src/vendor/shotcraft/Look.tsx:121` 的 `springAt`、`src/visual/WindLayers.tsx:135` 的 `const fps = 30`，改为从 `useVideoConfig()` 取，否则动效速度减半。
4. **扩 QC 基线**：`verify-render.mjs:16-21` 的 `EXPECTED` 目前写死 `fps:30 / frames:4119 / durationSeconds:137.3`，60 fps 全片会同时撞 `frameRate(±0.001)`、`duration(±0.01)`、`decodedFrames(===4119)`、`containerDurationWithinAudioTail(±0.08)` 四项 → 必须新增条目（如 `frames: 18353`、`fps: 60`、`durationSeconds: 305.88`）。
5. **补 `render.mjs` 的 fps 覆盖**（可选）：目前只能改 Composition 常量；更稳的做法是给 `render.mjs` 加 `--fps` 并在 `selectComposition` 后用 `calculateMetadata`/props 覆盖。

改造完成后的命令（保持与现脚本一致的三段式）：

```bash
# 全片 1080p60（改造后）
cd "E:/新建文件夹/实习/MV/film/motion-v2"
node render.mjs video AncientEditorialV3          # → out/motion-v2/AncientEditorialV3.mp4
node verify-render.mjs AncientEditorialV3         # 需先按 60fps/18353 帧扩 EXPECTED
```

**预计耗时**：

- 现状实测锚点：V4 的 4119 帧 1080p30，从最后一批 still（`v4-key-stills.log` 02:48:12）到成片 `AncientEditorialV4.mp4` 02:56:24 = **8.22 min**，即整片渲染不慢于该窗口 ⇒ ≥ 8.4 fps；V3 两次会话分别 38.16 min（含返工）。
- 目标 18,353 帧 = 现状 4.46× 帧数，且 1080p60 单帧渲染成本更高。按 8.4–12 fps 线性外推 ≈ **25–36 min**；考虑单帧成本上升与两遍编码，**保守区间 45–90 min**。
- 作为对照：旧引擎 1080p60 全片实测 ≈ **10.4 min**（`docs/RESEARCH.md:10-14`，29 帧/秒，18,355 帧）—— **Remotion 单帧成本明显更高**，这是合并时必须权衡的核心点。
- 该数字为**推算**，非实测：工程尚未产出 305.9 s 60 fps 成品，`render-*.log` 中也没有 60 fps 或全片记录。

---

## 7. 给 Lead 的三条决策要点

1. **不能「切换」到 motion-v2**：它只做了古代段 137.3 s，现代段 168.58 s 尚不存在；旧引擎是唯一覆盖全曲的链路。
2. **可「合并」的是资产与 QC**：motion-v2 的 `og_timing.json` 逐字字幕、本地 Noto 字体、`EditorialStage` 版式安全区、`verify-render.mjs` 的 14 项硬判据都可反向喂给旧引擎；旧引擎的 `--fps/--from/--to/--crf` CLI 与 concat 拼接能力应保留。
3. **若要 Remotion 路线继续**：优先补现代段场景与大改 fps 三处硬编码，并把 `verify-render.mjs` 的 `EXPECTED` 从「单一 30fps/4119」改为「按 Composition 查表」，否则任何 60 fps 或全片产物都会被 QC 误判为失败。
