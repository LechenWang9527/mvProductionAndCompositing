# motion-v2 交接体系审计（文档 / 质量契约 / 交付物）

审计对象：《The OGs》（305.88 s）MV 项目里 `film/motion-v2/` 这套 Remotion 工程及其交接材料。
审计方式：只读通读源码、JSON、脚本与文档；未运行任何渲染、未修改任何既有文件（本文件除外）。
所有数字均抄自被引用文件；文件里没有的项目写「未找到」。

**一句话结论**：这套体系的**契约检查器 + QC 报告**值得直接移植（源码级、可复跑、结论诚实），
**交接文档**里约一半是可复用的制作方法论，另一半是被后续文档覆盖的历史记录；
Remotion 工程本身不建议迁入主引擎。

---

## 1 交接文档清单（`docs/handoff/` 共 31 份 .md，合计 181,414 B）

| 文件 | 大小(B) | 一句话主题 | 关键可复用规则 |
|---|---|---|---|
| AESTHETIC_TOOLS_RESEARCH.md | 19732 | Anthropic/Remotion 官方 skill 与本地工具链缺口评估 | ①先定紧凑视觉规则再动手，反对重复圆角卡、软阴影、无意义标签 ②动画用 useCurrentFrame/interpolate 驱动、按 fps 换算秒，避免 CSS 自走动画 ③外部工具必须实际移植渲染看过才记为已采用 |
| ANCIENT_V2_SHOT_AUDIT.md | 16339 | 逐镜源码清点：shots.js 声明与 shotfilm 实际严重不符 | ①声明表不能当画面说明，必须回读 PLAN ②一镜多句必查承载能力 ③复用定位要精确到 path 与函数 |
| VISUAL_METHOD_RESEARCH.md | 12871 | 三条视觉路线（Canvas 混合/分层视差/纯程序）与合成定调 | ①先做定调帧锁纸色、线刻密度、留白 ②文字/年份/标注留给程序绘制 ③相同 renderAt(t) 重复取帧必须不变 |
| PROCESS_ANIMATION_RESEARCH_V2.md | 11183 | 外部过程动画成熟度三分类 + 三条移植建议 | ①消息 UI 用事件表+状态派生，任意时刻可重建 ②动画只作用于图层与遮罩，不伪造前后景 ③时间轴必须推动真实事件，「只画一条变长的线不算事件动画」 |
| ANCIENT_PROCESS_ANIMATION_METHOD.md | 11052 | 事件五要素、素材分工表、分层 3–5 层、验收 7 步 | ①每句先定义初始态/触发/操作/反馈/接续 ②整幅同速平移不叫分层 ③报告必须分清「已查源码/已实现/已抽帧/已导出/已看连续」 |
| TODAY_ANCIENT_DEMO.md | 10061 | v1 送审被否决后的 11 行返工范围表 | ①前奏要有点亮/展开/建立时间关系三个可辨状态 ②重复副歌不能同一背景推拉 ③群聊要完整 UI 层级与连续状态 |
| ANIMATION_TOOL_EVIDENCE_V2.md | 9455 | 现有 MP4 与各工具链可跑性证据 | ①工具先验「能不能跑」再谈选型 ②入口不同（createEngine vs window.DRAW）不能即插即用 ③采样点对照旧版/新版 |
| WORKBOARD.md | 7341 | 主目标、完成标准 4 条、交付纪律 | ①报告/静帧/素材/局部样片都不算最终交付 ②共享工作目录不同时改同一源文件 ③不覆盖历史成片，先交短段 |
| VOCAL_ALIGNMENT_PLAN.md | 7232 | 逐字时点来源审计与最小成本听校方案 | ①派生时点必须标注「非人耳标注」 ②LRC 与 SRT 同源不算独立校验 ③听校用 ±1 s 循环读播放头，不跑 Vocal-to-MIDI |
| VISUAL_REGRESSION_AUDIT.md | 6730 | 把「PPT 观感」逐条归因到具体源码行 | ①字体回退不一致是观感第一因 ②多层米黄面板+浮起阴影要删 ③证据不足的截图不能定为「某版本较好」 |
| LYRICS_TIMING_AUDIT.md | 5938 | 三行字幕系统、逐字时点与末段 retime 的边界 | ①字幕在镜头完成后统一绘制一次 ②sync_check 只测能量突变，不证明同步 ③末段合并只动画面不动音频/总时长 |
| VISUAL_PRODUCTION_PLAN.md | 5494 | 以乐句为单元指定主体/图文主次/承接对象 | ①运动必须改变内容关系 ②暴露背景必须有素材支持 ③按「可直接实施/需分层素材/需额外制作」三级自评 |
| INTRO_TEMPLATE_EXTRACTION.md | 4479 | 三个 demo 的时序与几何机制提取 | ①单一驱动量同驱多属性（rotateX/缩放/高度） ②曲线字符沿弧长表定位并沿切线旋转 ③强耦合组件摘机制不搬组件 |
| CHORUS_LOCAL_TEMPLATE_USE.md | 4478 | 副歌 14.99–29.993 s 可复用动效源码核查 | ①每条命中要报帧区间与实现方式 ②检索无命中要如实写 0 命中 ③缺删除段就说明需组合两个 demo |
| VERSION_AUDIT.md | 4133 | 旧主引擎入口、导出链与危险脚本审计 | ①不在加载链的 patch 脚本会改写源码，禁止随手运行 ②有 `--from/--to/--no-audio` 安全短段模式 ③node --check 只查语法 |
| ANCIENT_EDITORIAL_DIRECTION.md | 4016 | 画面决策标准：一卷被灯火照亮的水墨长卷 | ①场景=全幅插画，禁外加米色容器与解说标题 ②三种镜头语法分开 ③数字仅为演示不编造真实工资 |
| INTRO_OLD_MOTION_EVIDENCE.md | 3968 | 旧 Canvas 前奏与 Remotion 版逐函数对照 | ①复用导出画面以 TSX 为准 ②旧 JS 与 TSX 时点有差 ③原型画面不能当歌曲时码 |
| IMAGE_FIX.md | 3450 | 插图不显示的根因是加载路径而非图层 | ①路径错误会返回 200 text/html 静默失败 ②逐镜尺寸/位置可配 ③字幕安全区 y≥780 |
| ASSETS_AUDIT.md | 3410 | 素材槽位清点与旧图误用风险 | ①勿用旧图改名顶替新图 ②未登记 manifest 的图不算可用 ③照片到位前保持无真人面孔 |
| LAYERED_ILLUSTRATION_METHOD.md | 3403 | 分层风场：单驱动差速、alpha 清边、旗布形变 | ①一套 drive 驱动 0.25/0.65/1.0 差速 ②alpha 腐蚀 6px+模糊 0.6px 清白边 ③2.5D 不表现肢体/开锁/翻转 |
| INTRO_TIMING_AUDIT.md | 3368 | 前奏 0–21.6 s 状态表与素材 alpha 清单 | ①首条歌词 14.990 s，0–14.990 为无词前奏 ②人物只淡入+12 px 上移 ③裁切过的卷轴不能独立弯纸身 |
| GEMINI_VIDEO_HANDOFF.md | 3331 | 图生视频交接包的用途、纪律与回片验收项 | ①平台可用时长以账户实际为准 ②回片查人物/物体一致性、文字稳定性 ③聊天屏角点漂移必须拒收 |
| SUBTITLE_UNIFORM.md | 3001 | 三行字幕唯一绘制入口与验证脚本 | ①drawSubtitles 只调一次，不受镜头局部影响 ②底板 y=778–974、基线 842/898/946 ③片尾 0.20 s 与收黑同步 |
| SUBTITLE_FIX.md | 2907 | 已作废的首次字幕修复记录（保留作历史） | ①透明度不能逐字累乘 ②长句以 104 px 压测宽度 ③结论已被 SUBTITLE_UNIFORM 取代 |
| LIUBANG_IMPLEMENTATION.md | 2458 | 刘邦段 6 个镜头的布局注册与逐字时点 | ①只添静置物件，不伪造举杯/倒酒 ②程序线条止于 y<780 ③提权验证被拒时如实记录 |
| ANCIENT_EDITORIAL_V3_DELIVERY.md | 2260 | V3 成片交付参数与已知边界 | ①110.208 s 是源码硬切时码，不等于输出帧时码 ②冻结清单只对那次导出有效 ③17 槽 src 仍空 |
| ANCIENT_EDITORIAL_V4_DELIVERY.md | 2090 | V4 相对 V3 的改动与交付哈希 | ①127.6–133.52 s 改三分层+局部形变 ②有真实 src 优先沿用原视频 ③写文档时 QC 尚在验收，不得写整体 PASS |
| SUBJECT_ASSET_QUALITY.md | 2006 | 茅屋底图质量判断与合成验收口径 | ①素材不放进矩形相框 ②验收看全幅图+全屏样段 ③底部约 1/4 留字幕 |
| WIND_MULTIPLANE_ACCEPTANCE.md | 1913 | 分层风动 8 条验收判据 | ①真实 8 s 视频查开头/2/4/6/结束前 ②旗根锚在杆上不滑动 ③不可用整幅画摇动替代分层 |
| EDITORIAL_V3_TIMING_REVIEW.md | 1702 | 场景路由时间表与 13 个歌词锚点 | ①路由边界与歌词锚点同表核对 ②季节轴改「秋冬春夏」与原词一致 ③描述边界选择不算漏词 |
| ANCIENT_ASSETS.md | 1613 | 刘邦像与战场图规格与合成比例 | ①人物约占源高 90%，合成按画幅 83% ②禁文字/HUD/边框 ③留白区可叠 7:6 |

**同目录非 .md 文件**
- `docs/handoff/GEMINI_VIDEO_PLAN.json`（13,563 B）：15 条镜头的图生视频计划，`generationRequestSeconds` = 8，`common` 226 字符，entry 键为 id/title/source/priority/ranges/seconds/action/overlay。
- `docs/handoff/DEEPSEEK_TASK.txt`（2,801 B）与 `_02`–`_05`（4,751 / 4,674 / 4,154 / 3,119 B）：外包给外部 DeepSeek 的五份任务书，依次对应现代工艺参考包、视觉脚本与工序事实修正、两个可定帧原型、`ancient_bridge/` 现实对照镜头、`ancient_demo_qc` 导出验收。

**相关目录（各一句话）**
- `docs/external_deepseek/`：外部模型交付物归档，含两份研究文档（`INDUSTRIAL_REFERENCE.md` 11,610 B、`MODERN_VISUAL_SEQUENCE.md` 11,271 B）、`ancient_bridge/` 桥接原型（35,463 B JS + 预览页 + 自测脚本）、`ancient_demo_qc/` 导出验收工具与 20 余张审查帧、`code_ai_prototype/` 两个可定帧 HTML 原型。
- `docs/tool_research/`：两个外部 skill 的收录副本，`anthropic-frontend-design/`（SKILL.md 9,369 B）与 `remotion-markup/`（SKILL.md 13,793 B），各带 SOURCE.md 标明出处。
- `.scout/`：2026-11-10 的仓库根目录 `ls` 快照（`root.txt` 2,677 B）与对 `ref_prompts` 提示词库的检索/校验产物（`refp/stats.json` 193,850 B、`validate.js` 及其输出）。

---

## 2 工具与契约（每个工具：用途 / 命令 / 判据阈值）

### 2.1 `tools/check_editorial_contract.mjs`（446 行，21,474 B）
**用途**：纯源码级契约检查，不渲染、不解码音视频；输出可复跑的 JSON 证据。
**命令**：`node tools/check_editorial_contract.mjs --version AncientEditorialV4`（默认 `AncientEditorialV3`；其它值直接 throw）。
**输出**：`out/motion-v2/AncientEditorialV4.contract.json`；V4 另写 `AncientEditorialV4.sources.json`。有错误时 `process.exitCode = 1`。
**判据**：①资产正则扫描 17 个 tsx 的字符串图片引用（`IMAGE_RE`），`${...}` 动态 token 跳过；②win32 下解析到 `public/assets` 之外即 `escapedAssetRoot` 失败；③PNG 头校验 8 字节签名、`IHDR` 标记与 BE 尺寸；④风层固定 `sky.png/land.png/flag.png`；⑤`clips` 的 `src === null` 记 pending-upload，**不算错**，只有 missing/invalid 才 fail；⑥两份 Noto 字体必须 `size > 0`；⑦`og_timing.json` 源与副本 SHA-256 必须相同且可解析；⑧歌词逐行严格相等，`mismatchCount` 必须为 0；⑨字幕逻辑 6 条正则（含 `<SubtitleTrackEditorial ancientOnly />`、`source[i].start <= t`、`[1,2].map(...)`）；⑩构图正则硬编码 `width={1920}`、`height={1080}`、`fps={30}`、`durationInFrames={4119}`。
**局限**：全部是文本/文件头层断言，`video` 字段固定输出 `status: "present-not-verified"`，**它不证明画面**。

### 2.2 `film/motion-v2/verify-render.mjs`（392 行，17,711 B）—— 产出全部 `*.qc.json`
**用途**：成片 QC。探测→完整解码→逐张资产解码→抽帧复核，14 项布尔全真才算 PASS。
**命令**：`node film/motion-v2/verify-render.mjs AncientEditorialV4.mp4`（相对 `cwd`/脚本目录/`out/motion-v2` 三处解析）。
**阈值**：期望表 `AncientEditorialV4: 1920×1080 / 30 fps / 137.3 s / 4119 帧`（V3、V2 同值；`IntroProcessV2` 为 21.6 s / 648 帧）；帧率容差 ±0.001，解码时长容差 ±0.01 s，容器时长容差 ±0.08 s（音频尾差）；`SAR` 必须严格 `1:1`；帧数必须**精确等于** 4119；`durationFrameCountAgreement` 要求 `round(时长×帧率) === 帧数`；抽帧数量 V3 为 26、V4 为 8；`MAX_BUFFER` 96 MB。
**输出**：`out/motion-v2/<id>.qc.json`，失败 `exitCode = 1`。

### 2.3 `tools/inspect_wind_layers.mjs`（224 行，8,375 B）
**用途**：只读 alpha 分析，把 PNG 解成 RGBA 后统计透明度分布，不做任何编辑。
**命令**：`node tools/inspect_wind_layers.mjs`（默认读 `film/media/candidates/wind_multiplane_study/{sky,land,flag}.png`）；或 `--sky/--land/--flag <path>` + `--out <path>`；默认输出 `out/motion-v2/studies/wind-layer-inspection.json`。
**阈值与校验**：`MAX_PIXELS = 100_000_000`、`MAX_BUFFER = 512 MB`、解码 `timeout 120_000 ms`、RGBA 字节数必须 `= w*h*4`、`maxBuffer = max(32 MB, expected+16 MB)`。
**指标**：alpha 最小/最大、全透明/半透明/全不透明占比（6 位小数）、`alpha>8` 包围盒、10 条横带透明率；`flag` 额外给下半幅逐列候选（阈值 `">8"`）与 top10 列。
**边界**：文件缺失记 `status: "PENDING"` 不抛错；schema `wind-layer-inspection/v1`，scope 明写「candidate-source 不代表已选用或已部署」。

### 2.4 `tools/build_gemini_video_handoff.mjs`（210 行，11,166 B）
**用途**：从计划 JSON + 原图重建图生视频交接包（幂等，可反复跑）。
**命令**：`node tools/build_gemini_video_handoff.mjs`。
**输入**：`docs/handoff/GEMINI_VIDEO_PLAN.json`、`lyrics/og_timing.json`、`film/media/candidates/`。
**输出**：`out/Gemini_古代MV_图生视频交接包/`，每镜目录含 `reference.png`、`视频生成提示词.txt`（common+action+overlay 三段）、`镜头说明.md`、空 `待回传视频/`；根目录 `00_镜头总表.csv`（UTF-8 BOM，9 列）、`00_镜头总表.md`、两份 00_ 说明。
**判据/纪律**：源图缺失时**删除旧 reference.png** 并写 `reference待补.txt`，绝不回退预览帧；生成时长（entry.seconds，当前 8 s）与实际剪辑时长分列；禁止把歌词/叠字烘焙进视频；回传命名 `<镜头ID>.mp4`。

### 2.5 `film/motion-v2/render.mjs`（2,743 B）
**用途**：唯一渲染入口，bundle 后调 Remotion renderer。
**命令**：`node render.mjs video AncientEditorialV3`；`node render.mjs stills IntroProcessV2 0,0.7,3,...`（默认 `stills` + `IntroProcessV2`）。
**实现要点**：`TEMP/TMP` 重定向到工程内 `.tmp` 规避沙箱临时目录问题；Chrome 路径硬编码 `C:/Program Files/Google/Chrome/Application/chrome.exe`；输出目录固定 `out/motion-v2`。

### 2.6 `docs/external_deepseek/ancient_demo_qc/verify_demo.mjs`（配套 `report.json` 2,710 B）
**用途**：更早一版成片（`out/ancient_demo_v1.mp4`）的轻量验收。
**判据**：`width1920`、`height1080`、`fps30`、`sar1x1`、`hasAudio`、`durationOk`、`decodeClean` 七项。
**已知现象**：`metadata` 命令 `exit 1` 是预期值（`ffmpeg -i` 未给输出目标），报告里如实记录而非当失败。

---

## 3 QC 报告实测数据表

### 3.1 `out/motion-v2/AncientEditorialV4.qc.json`（33,299 B，2026-11-11T19:10:40.583Z）
| 指标 | 数值 | 判定 |
|---|---|---|
| 文件大小 | 69,266,233 B | — |
| 容器时长 | 137.34 s（`00:02:17.34`） | PASS（容差 ±0.08） |
| 解码视频时长 | 137.30033333333333 s | PASS（容差 ±0.01） |
| 解码帧数 | 4119（`showinfoEntries` 同为 4119） | PASS（须精确 4119） |
| 末帧 PTS | 137.267 s | 与时长自洽 |
| 分辨率 / 帧率 | 1920×1080 / 30 fps / SAR 1:1 | PASS |
| 视频编码 | h264 High，yuv420p，3709 kb/s | PASS |
| 音频 | AAC LC，48000 Hz stereo，317 kb/s | PASS（有音轨） |
| 完整解码 | exit 0，错误列表空 | PASS |
| 引用图片 | 24 / 24 通过 | PASS |
| 抽帧复核 | 8 / 8 抽帧成功（0.5, 6, 28.8, 85.3, 110.2, 123.5, 128.5, 132.8 s） | PASS |
| 布尔检查 | 14 项全 true | **整体 PASS** |

### 3.2 其它成片 QC
| 文件 | 大小(B) | 帧数 / 时长 | 资产 | 判定 |
|---|---|---|---|---|
| `out/motion-v2/AncientEditorialV3.qc.json`（34,633 B） | 74,166,224 | 4119 / 137.3003 s | 21/21 | 14 项 PASS，抽帧 26/26 |
| `out/motion-v2/AncientDemoV2.qc.json`（26,092 B） | 31,556,854 | 4119 / 137.34 s | 18/18 | 13 项 PASS |
| `out/motion-v2/IntroProcessV2.qc.json`（26,128 B） | 6,951,398 | 648 / 21.600033 s（容器 21.65 s） | 18/18 | 13 项 PASS（无抽帧项） |
| `docs/external_deepseek/ancient_demo_qc/report.json` | 40,880,104 | 136.9 s / 2388 kb/s | — | 7 项 PASS；AAC 44100 Hz mono |

### 3.3 `out/motion-v2/AncientEditorialV4.contract.json`（22,095 B）源码级结论
| 指标 | 数值 | 判定 |
|---|---|---|
| 扫描 tsx 文件 | 17 | — |
| 引用图片 | 24，缺失 0，坏头 0 | PASS |
| 打包字体 | 2/2（NotoSerifSC 25,129,160 B、NotoSansSC 17,773,244 B） | PASS |
| editorial clips | 17，`pendingNullSourceCount` 17，missing 0 | 通过但**全为空槽** |
| 风层资产 | 3/3（sky 2,467,464 B 1914×822、land 2,041,339 B 1671×941、flag 1,343,435 B 1024×1536） | PASS |
| 时间轴副本 | SHA-256 `103C23B4…3F47` 与源**逐字节相同**，167 行 | PASS |
| 歌词逐行 | `mismatchCount` 0 | PASS |
| 源快照 | 52 文件，缺失 0（`AncientEditorialV4.sources.json` 24,899 B） | PASS |
| 视频 | `exists: true` / `checked: false` / `passed: null` / `status: "present-not-verified"` | **未验证**（工具自述不碰音视频） |

### 3.4 `out/motion-v2/AncientEditorialV4.audio-comparison.json`（1,501 B）
| 指标 | 数值 | 判定 |
|---|---|---|
| 解码格式 | 48 kHz stereo s16le raw PCM | — |
| V3 输入 / SHA-256 | 74,166,224 B / `936A2D48…56C7`，解码中稳定 | 通过 |
| V4 输入 / SHA-256 | 69,266,233 B / `92BE4FFD…DAB1`，解码中稳定 | 通过 |
| 两片 PCM | 均 26,370,048 B，SHA-256 均 `E6A70878…FAD4` | `pcmByteCountEqual` / `pcmSha256Equal` / `decodedPCMIdentical` 全 true |

### 3.5 风层 alpha 实测（`out/motion-v2/studies/wind-layer-inspection.json`，8,682 B）
| 层 | 尺寸 | alpha 域 | 全透明 / 半透明 / 全不透明 | 判定 |
|---|---|---|---|---|
| sky | 1914×822 | 255–255 | 0 / 0 / 1 | 整幅不透明，需靠形状出天空 |
| land | 1671×941 | 0–255 | 0.454566 / 0.545293 / 0.000141 | 半透明为主，边缘可清 |
| flag | 1024×1536 | 0–254 | 0.872089 / 0.127911 / 0 | 仅布料区有内容 |

`flag` 下半幅逐列候选：`xCandidates = [792…807]`（共 16 列），`maxNonTransparentPixels = 693`。
配套实测（`docs/handoff/LAYERED_ILLUSTRATION_METHOD.md`）：旗杆 ROI 变化 `0 / 1,746` 像素，布面 `4,455 / 62,000`（7.19%）——证明形变没带动杆。

### 3.6 未找到 / 未覆盖
- **响度（LUFS）**：全库检索 `LUFS` / `loudnorm` / `volumedetect` / `mean_volume` / `max_volume` 均 0 命中——**未找到**。
  音频侧只有「有音轨」「容器时长在音频尾差内」「PCM 逐字节一致」三类证据，**没有任何响度或峰值指标**。
- **V4 人工视觉验收结论**：未找到（`contract.video.status` 本身即为 `present-not-verified`）。
- **逐字歌词的人耳听校记录**：`VOCAL_ALIGNMENT_PLAN.md` 只给方案，未找到执行结果。
- 其余 `out/motion-v2/` 文件：12 个 JSON（含 `AncientDemoV2.initial.sources.json` 7,787 B、`wind-layer-candidate-inspection.json` 8,718 B、`wind-layer-inspection.smoke.json` 2,587 B），**无 .md**。

### 3.7 `out/Gemini_古代MV_图生视频交接包/` 是什么
给外部图生视频工具（Google Gemini/Flow 等）的**逐镜投喂包**，不是成片交付。
17 个镜头目录（`01_wind`…`17_courier_shift`，其中 16、17 为 2026-11-12 补入），每目录 4 件：`reference.png`、`视频生成提示词.txt`、`镜头说明.md`、空 `待回传视频/`。
根目录总说明写明：17 张参考原图已复制、0 张待补，17 个镜头的视频**均待回传**，本包不含任何已生成视频。
计划文件仍只有 15 条，`00_镜头总表.md` 已扩到 17 行——**计划与产物不同步**。

---

## 4 值得采纳进主引擎的规则（16 条）

1. **把「契约检查」做成独立、可复跑的源码级脚本，与渲染解耦**（`tools/check_editorial_contract.mjs`）。
   理由：一次运行即可覆盖资产、字体、时间轴、歌词、构图参数，成本近零；主引擎目前只有字幕层的 `out/subtitle_uniform_review/verify_uniform.cjs`，缺少资产/素材注册/时间轴的统一自检。
   移植时改为检查 `film/index.html` 的加载链、`film/data/timeline.js` 的 `TL.duration`、`PHOTO` 注册表与 `stills.mjs` 的抽帧参数。

2. **单一真源 + SHA-256 双写比对**（`tools/check_editorial_contract.mjs` 的 `timingAndSubtitles`）。
   理由：主引擎的 `lyrics/og_timing.json` 与运行时副本同样存在漂移风险；契约用「源/副本 SHA 相同」把问题变成一行断言。

3. **PNG 头校验（签名 + IHDR + 尺寸），而不是只判断文件存在**（`tools/check_editorial_contract.mjs`）。
   理由：`docs/handoff/IMAGE_FIX.md` 记录的真实事故就是路径错误返回 `200 text/html`，`PHOTO.has()` 为 false 导致插图静默不显示——
   「文件存在」根本抓不到这类问题。

4. **资产引用溯源到 `path:line` + 原始 token**（`contract.json` 的 `assets.files[].references`）。
   理由：改一张图能立刻知道哪几行在使用；主引擎 `gen_manifest2.json` 只有 `id/file`，正是路径 bug 的温床。

5. **交接包「宁缺勿假」：缺图删旧图、写 `reference待补.txt`**（`tools/build_gemini_video_handoff.mjs`）。
   理由：回流到主引擎就是「素材不到位时留空并标记，不用预览帧或旧版本顶替」。

6. **成片 QC 的 14 项固定检查 + 明写容差**（`film/motion-v2/verify-render.mjs`）。
   理由：容差（±0.01 s / ±0.08 s / 精确帧数 / SAR 严格 1:1）是这套体系里最硬的工程资产，
   主引擎 `film/render.mjs` 导出后可直接套用（期望表换成 60 fps、18353 帧、305.88 s）。

7. **「容器时长在音频尾差内」这一项**（同上，`containerDurationWithinAudioTail`，±0.08 s）。
   理由：视频流与容器时长天然不等，主引擎 305.88 s 成片同样会踩这个坑；它把「尾差」变成显式合同而非人工判断。

8. **音频一致性用 PCM 逐字节比对，而不是听**（`out/motion-v2/AncientEditorialV4.audio-comparison.json`）。
   理由：换引擎/重编码后证明「还是同一首音频」只需比 26,370,048 B 与一个 SHA，主引擎输出核对音轨时同样适用。

9. **抽取固定时点复核帧并列进报告**（V4 抽 8 帧：0.5/6/28.8/85.3/110.2/123.5/128.5/132.8 s）。
   理由：与主引擎 `film/stills.mjs` 的抽帧用法同构，但这里把它变成**验收项**（`mp4SampleFramesExtracted`）而不是手工步骤。

10. **确定性验收：相同 `renderAt(t)` 重复取帧必须像素一致**（`docs/handoff/VISUAL_METHOD_RESEARCH.md`、`PROCESS_ANIMATION_RESEARCH_V2.md`「同一时刻重复调用确认像素逻辑一致」）。
    理由：主引擎 `renderAt(t)` 是纯函数式设计，这条可低成本变成断言，防住累加式状态。

11. **「不得靠上一帧累积状态」**（`docs/handoff/ANCIENT_PROCESS_ANIMATION_METHOD.md` 验收第 6 步：任意时刻跳转可重建同一状态）。
    理由：主引擎 `core.js` 里透明度累乘（`SUBTITLE_FIX.md` 记录的历史 bug）就是这类问题的典型；写成规则可防复发。

12. **量化「局部形变没有带动固定部件」**（`docs/handoff/LAYERED_ILLUSTRATION_METHOD.md` 的 FlagPinDebug：布面 7.19%、旗杆 0/1,746）。
    理由：主引擎的旗杆/屋檐一旦被整体位移场带动就会「旗根滑动」，肉眼难查；ROI 像素差分是可直接复用的判据。

13. **分层用单一驱动量做差速（0.25 / 0.65 / 1.0），而不是各层各写一套缓动**（`docs/handoff/LAYERED_ILLUSTRATION_METHOD.md`、`INTRO_TEMPLATE_EXTRACTION.md` 的 `travel(frame)` 同驱 rotateX/缩放/高度）。
    理由：主引擎当前 `film/src/liubang_sequence.js:179` 是「整幅推到 1.024 倍」，属于文档明确否定的做法；
    差速 + 单驱动是把它改成真分层的最小改法。

14. **alpha 清边配方：腐蚀 6 px + 模糊 0.6 px 后合成原色**（`docs/handoff/LAYERED_ILLUSTRATION_METHOD.md`）。
    理由：`WIND_MULTIPLANE_ACCEPTANCE.md` 把「山脊白边晕圈」列为硬失败项，主引擎贴图边缘问题与此同源。

15. **字幕注册成「一帧内只调用一次」的统一系统，并把长句宽度压测写进验收**（`docs/handoff/SUBTITLE_UNIFORM.md`、`SUBTITLE_FIX.md`：最长句 104 px 时宽约 1,394 px < 88% 安全宽 1,689.6 px）。
    理由：主引擎已实现三行统一绘制（`film/src/subtitles.js`），缺少的是**压测数字**；把 1,394/1,689.6 换成主引擎实际字号重算即可。

16. **诚实分级：「已查源码 / 已实现 / 已抽帧 / 已导出 / 已看连续」**（`docs/handoff/ANCIENT_PROCESS_ANIMATION_METHOD.md`、`WORKBOARD.md`）。
    理由：这套文档里最有价值的元规则——它解释了为什么 `contract.video.status` 敢写 `present-not-verified`，
    也解释了为什么 `TODAY_ANCIENT_DEMO.md` 会被用户直接否决：规格 PASS 从来不等于画面通过。

---

## 5 不建议采纳的（7 条）

1. **把 Remotion 工程整体迁进主引擎 / 双引擎并存**（`film/motion-v2/`）。
   理由：`docs/handoff/ANIMATION_TOOL_EVIDENCE_V2.md` 已确认主引擎单 canvas + `renderAt(t)` + `LAYOUTS` 能承载路径、遮罩与局部状态序列；
   而时间线、字幕、音频、素材加载都在 Canvas 侧，迁过去等于重写一遍，收益只有「组件化」。
   同期的工具评估（`docs/handoff/AESTHETIC_TOOLS_RESEARCH.md:27`「其他工具：功能匹配，但不建议今晚换引擎」）给出的也是同一结论。

2. **把 `check_editorial_contract.mjs` 里硬编码的 `1920/1080/30/4119` 当作时长真源**（`tools/check_editorial_contract.mjs:262-267` 的构图正则：`/width=\{1920\}/`、`/durationInFrames=\{4119\}/` 等）。
   理由：这是**文本正则**断言，不是计算；一旦改片长而不改脚本，契约会「假 PASS」。
   主引擎应改为读 `TL.duration` 计算期望帧数，正则只做「有没有写死」的兜底。

3. **把 `contract.video` 的 `passed: null` / `present-not-verified` 当成交付凭证**（`out/motion-v2/AncientEditorialV4.contract.json`）。
   理由：工具自述「does not inspect or render audio/video」；截图/契约/静帧都不能替代 `*.qc.json` 与人工连续观看。

4. **接受 `editorialClips` 长期 17 个全空槽为常态**（同文件 `pendingNullSourceCount: 17`、`missingSourceCount: 0`、`pendingIsError: false`）。
   理由：把它设成「不算错」会让「素材未回」永远合法；主引擎若接入这条契约，应把空槽数与截止时间一起写进报告。

5. **用 31 份、181,414 B 的交接文档当流程范本**（`docs/handoff/`）。
   理由：其中至少 4 份已被后续文档明确取代或修正（`SUBTITLE_FIX.md` 被 `SUBTITLE_UNIFORM.md` 取代；
   `ANCIENT_EDITORIAL_V4_DELIVERY.md` 声明 V3 冻结清单不适用于 V4；`LYRICS_TIMING_AUDIT.md` 修正了 `SUBTITLE_FIX.md` 的「固定两行」误判；
   `ANCIENT_V2_SHOT_AUDIT.md` 指出 `shots.js` 的 style/subject/action 不可信）。
   采纳规则时要以「最新一份 + 源码」为准，不要把历史记录也当成规范执行。

6. **继承绝对路径硬编码**（`film/motion-v2/render.mjs` 的 `C:/Program Files/Google/Chrome/Application/chrome.exe`、`verify-render.mjs` 的 `ref_mv/node_modules/ffmpeg-static/ffmpeg.exe`、`docs/handoff/VERSION_AUDIT.md` 记录的 Node v26.13.0 与 Playwright 路径）。
   理由：换机器即失效；主引擎 `film/render.mjs` 已有同样毛病，这套体系没有解决它，不该照抄。

7. **用 `inspect_wind_layers.mjs` 的 alpha 报告替代动画验收**（`tools/inspect_wind_layers.mjs`，schema `wind-layer-inspection/v1`）。
   理由：它只测单帧 alpha 分布，scope 自述「candidate-source entries are not asserted to be selected or deployed」；
   `docs/handoff/WIND_MULTIPLANE_ACCEPTANCE.md` 要求的是**真实 8 秒 30 fps 视频**查开头/2s/4s/6s/结束前一帧。
   该工具适合一次性诊断，不适合当 CI 门禁。

---

## 附：本报告的引用边界

- 引用的 JSON 均为文件内实测值，未做换算；字节、帧数、SHA 前缀照抄原文。
- `LUFS`、峰值、人工视觉 PASS、人耳听校结果：**未找到**，因此本报告不对响度与最终观感下任何结论。
- 本文只描述与主引擎的取舍，不改变 `film/motion-v2/` 与 `out/motion-v2/` 的任何既有文件。
