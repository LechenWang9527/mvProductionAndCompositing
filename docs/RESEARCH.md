# 调研：把《The OGs》做成 B 站级 MV 的可行路线

> 调研员：research-a｜任务：task-1（A 线）｜工作目录：`E:\新建文件夹\实习\MV`｜2026-11-10
> 所有外部工具均给出可点开的来源；没能实测或没读到一手页面的，正文与 §8 都明确标注。

---

## 0. 结论先行

**一句话**：本机唯一被实测跑通的产线是「**浏览器 Canvas2D/WebGL 作画 + Playwright 逐帧截图 + ffmpeg 编码**」（Lead 实测 1920×1080@60fps 全片约 10.4 分钟）。三条推荐路线都锚在这条线上，区别只在「素材从哪来」：R1 全部程序生成（不花钱），R2 加 AI 静帧（便宜、稳），R3 加 AI 视频片段（贵、不稳、只用于几个高潮镜）。

**四条硬结论**

1. **歌的硬数据已实测**（`ffmpeg -i` 拿到）：`The OGs 视频音轨.mp3` → **时长 00:05:05.92**、44100 Hz、**单声道**、96 kb/s。按 60fps 算全片 **18,355 帧**；Lead 实测吞吐约 29 帧/秒 → **一首歌全片渲染约 10.4 分钟**，不是几小时。这意味着**可以一天内反复出全片**，迭代成本极低。
2. **这首歌不适合「AI 出画面为主」的路线**。歌是马牌轮胎工艺部的致敬歌，主题「我是过来人」，意象全在**工艺/胶料/胎面胎侧/硫化/PPT/VBB/QM 报告/Failure code/Work with fun**，还有 12 位真实同事。真实同事的脸和名字用 AI 生成就是灾难（不像、且不尊重人）。**该用「工程文档/终端/版画/排版」的语言画它**——这恰好是纯代码最擅长的东西。
3. **参考片 `BV1RzHG6SEHy` 已查清身份**：B 站官方 API 实测标题「【GPT6-Astra】平稳，高效，与GPT的爱 | world.execute(me);」、217 秒、1920×1080、UP 主「星降ネプナシ」、标注「含AI生成内容」；简介借物表指向 `https://github.com/Nyankomintsu/world-execute-me-lyric-mv`——**就是本机 `ref_mv/`**。所以「精致」有可对标物：87 个镜头、每帧由时间唯一决定的纯函数渲染。
4. **本地 AI 出图只值得当"点缀"**：RTX 3050 6GB 上 SDXL 1024×1024 约 **50 秒/张**（第三方基准，非本机实测），出 100 张要 1.4 小时且几乎占满显存。**够用来做十几张"钉子镜"（静帧嵌进代码画面），不够用来铺满全片。** Ollama/本地 LLM **不必要**（见 §4.2）。

---

## 1. 这首歌本身：22 段、5:05.92

| 项 | 值 | 来源 |
|---|---|---|
| 文件 | `The OGs 视频音轨.mp3`（3,679,286 B） | 本机 |
| 时长 | **00:05:05.92（305.92 s）** | `ffmpeg -i` 实测 |
| 音频 | 44100 Hz、mono、96 kb/s、MP3(LAME) | 同上 |
| 段落 | 22 段（Lead 提供） | 团队 |
| 60fps 总帧数 | 18,355（305.92 × 60） | 计算 |
| 主题 | 「我是过来人」：杜甫（搬家租房）→ 刘邦（47 岁亭长）→ 12 位真实同事 | 团队 |
| 核心意象 | 工艺、胶料、胎面/胎侧、硫化、PPT、VBB、QM 报告、Failure code、Work with fun | 团队 |

**对视觉设计的直接推论**

- **单声道 96 kb/s** 是低码率，做音频反应式画面时**不要用高频细节驱动**（镲片、齿音都在码率里被压掉了），改用**低频包络 + onset 能量**，否则画面会"抖得莫名其妙"。
- **22 段 / 306 秒 ≈ 每段 13.9 秒**。这比参考片（87 镜、平均 2.49 s/镜）的节奏慢得多 → **本片镜头数应该在 60–110 之间**（平均 3–5 s/镜），不要照抄 87 镜的密度。
- 「12 位真实同事」是**肖像素材**，AI 生成不像人 → 应该用**姓名条 / 工牌 / 编号 / 剪影 / 排版**处理，这反而是本片最强的记忆点（见 §3 的 L33 / L29 / L16）。

---

## 2. 路线对比表

三条路线共用同一条**已验证**的产线：

```
index.html (Canvas2D/WebGL, 暴露 window.renderAt(t))
   → playwright 无头 Chrome 逐帧 page.screenshot
   → ffmpeg (libx264 / h264_nvenc) 编码
   → 成片
```

| 维度 | **R1 纯程序化** | **R2 程序化 + AI 静帧** | **R3 程序化 + AI 视频片段** |
|---|---|---|---|
| 素材来源 | 全部由代码画（几何/排版/字符/版画纹理） | 少量 AI 静帧当"钉子镜"，其余代码画 | 3–5 个 5–8 秒 AI 视频段落，其余代码画 |
| 精致度上限 | 高（参考片同档） | **高＋**（多一层真实质感） | 最高，但**一致性风险最大** |
| 学习成本 | 中：会 JS + Canvas 就够 | 中＋：多学 ComfyUI/API 与图生图 | 高：还要懂视频模型、参考图一致性 |
| 一首 306 s 歌的时间成本 | **3–7 天**（含分镜与调镜头） | 5–10 天（含出图挑图） | 10–20 天（AI 段返工最多） |
| 花钱范围 | **¥0** | ¥0（本地出图）～ 几百元（云端出图） | 几百～几千元（视频按条计费） |
| 纯 DeepSeek 可完成 | **是（100%）** | **是（DeepSeek 写代码与提示词，人只点出图）** | **否**（必须有人操作视频服务） |
| 渲染时间（1080p60 全片） | 约 10.4 分钟（实测档） | 同左 | 同左（AI 片段另行生成） |
| 最易翻车处 | 程序图形太"干"，像 PPT | 静帧与代码画面调色不统一 | 每个 AI 段落风格不一致 |

> **推荐顺序：R1 → R2（有余力再加）。** R3 只在这首歌真的需要一个"震撼镜头"时才考虑，且只做 3 个以内。

---

## 3. 十五条风格编号（来自 `ref_prompts/docs/STYLES.md`，按本曲适配度排序）

选型原则（技能 SKILL.md）：**主画风选 1 个 + 运动方式选 1 个 + 版式选 1 个**，不要机械叠加。本曲是工业/工程/文档气质，因此全部偏离"诗歌手写、水彩、童话"那一类。

| # | 编号 | 名称 | 一句话视觉特征 | 为什么适合本曲哪一段 |
|---|---|---|---|---|
| 1 | **L39** | ASCII · CRT 终端 | 单色磷光屏，画面全部是字符栅格上的真字符，只靠字号推拉镜头 | **QM 报告 / Failure code 段**：把不良率、缺陷代码用终端日志"打"出来，是全片最贴题的界面语言 |
| 2 | **L36** | 蓝图 / 工程制图 | 普鲁士蓝纸上的白线工程图，图例气泡、尺寸线、标题栏会自己画出来 | **胎面/胎侧结构、胶料配方原理段**：讲结构不讲光影，正好是"工艺部"的专业语言 |
| 3 | **L29** | 复古半调案卷 | 奶油档案纸 + 网点套印 + 大标题错版阴影 + 橡皮图章"啪"地砸下 | **QM 报告/不合格判定段**：一桩一桩"立案"的仪式感，比纯图表有戏 |
| 4 | **L10** | 工程方案比较墙 | 一面被拍摄的白板墙，剪贴照片、磁钉、三色马克笔各有固定含义 | **PPT / VBB 讲方案段**：把"我在会议室讲 PPT"这件事直接变成画面 |
| 5 | **L16** | 档案灯箱 | 冷光背光台上真实档案物，放大镜落下去物件就"活"了 | **12 位同事 / 老照片段**：姓名条+工牌+编号，克制且尊重，不需要生成人脸 |
| 6 | **L33** | 瑞士动态排版 | 模块网格、单一字体、单一信号色，动作像印刷机一样精确 | **名单/署名/金句段**：12 个人名一个个落进网格，是本片最省成本也最有力的一段 |
| 7 | **L30** | 木刻版画 | 每帧都是黑木版，光只存在于被刀刻掉的地方 | **杜甫（搬家租房）/ 刘邦（47 岁亭长）段**：要"历史的重量"，木刻最有分量 |
| 8 | **L40** | 数据叙事 | 图表本身就是叙事，一笔一笔画在米色纸上，手写注钉在数字上 | **工龄/产量/良率段**：用真实数字讲"过来人"，比空镜有说服力 |
| 9 | **F1** | 图表生长 | Canvas 2D 柱子一根根长出、数字跳动、再连成线 | **短促数字卡点段**：有现成代码样片，直接抄实现，最省时 |
| 10 | **L13** | 数据实体化 | 真实统计变成真实物件，一单位一实物，按比例堆叠，像产品一样打光 | **"多少人/多少年"具象化**：把工龄堆成实物墙，比柱状图好看 |
| 11 | **M25** | 歌词卡点 | 歌词跟着人声和节拍一个字一个字跳出来 | **全片主结构**：本片是歌词 MV，这是骨架 |
| 12 | **M7** | 极简卡点 | 一镜一事、大量留白、单一强调色、每刀切在重拍 | **排比句段**（"你每天要整理的表格、你每周要写的周报…"）：越克制越有力 |
| 13 | **E3** | 字符画 | 画面全由字符拼成，靠字形密度成像，像老电脑屏幕 | **冷、记忆碎片段**：比 L39 更轻，纯 Canvas 2D 代码样片可直接用 |
| 14 | **A2** | 光标打字 | 黑底一个光标，一字一字打，打了又删 | **开场自述/独白段**（"我是过来人"）：成本最低、情绪最准的开场 |
| 15 | **L28** | Risograph 丝网印刷 | 两三色半透明专色套印、网点、油墨颗粒、版永远差一点没对准 | **Work with fun / 轻松段落**：给全片一个"笑一下"的出口，否则太压 |

**候补（二选一替换）**：`L31 铜版画`（比木刻更细、更冷）、`K36 丝网印刷`（卡通向，适合做彩蛋段）、`Z10 木版画`（中国风木版，如果杜甫那段要走国风）。

> 注意：`STYLES.md` 共 341 条，其中 145 条只有文字提示词、没有静帧，**不要凭空描述它们的画面**。上表里 L39/L36/L10/L16/L29/L40/L33/L28/L30/L13/L9/F1/E3/A2 都有 `.md`，L 系与 A–G 系多数配 `.jpg` 静帧，选之前先看一眼静帧。

---

## 4. 工具与本地可行性

### 4.1 代码渲染（共用产线的核心）

| 工具 | 事实（一手页面） | 对本项目的用法 |
|---|---|---|
| **Canvas 2D + `renderAt(t)`** | 浏览器原生；只要画面是 `t` 的纯函数就能逐帧导出 | **R1/R2/R3 的地基**，无需安装 |
| **WebGL2** | 同源，用于后期（bloom/色差/颗粒） | 参考片就这么做的；可选，R1 不加也能出片 |
| **`ref_mv`（本机）** | Canvas2D+WebGL2、无头 Chrome→ffmpeg、87 镜、MIT（角色剪影 CC BY-NC-SA 4.0） | **只读参考**：抄它的镜头调度与工具链，不要抄剪影 |
| **`vocaloid-style-mv-pipeline`** | MIT；Canvas2D+WebGL2+Playwright+ffmpeg；24 个参数化场景、13 种转场；1080p30 全片在 RTX 3080 约 4 分钟 | **最接近的同类模板**，可直接对照其工程结构 |
| **Playwright** | `python -m pip install playwright` + `python -m playwright install chromium` | 逐帧截图驱动 |
| **Remotion** | 个人与 ≤3 人公司 **Free License**（全功能、无限商用）；`npx create-video@latest --yes --blank my-video`；`npx remotion render` | 若想用 React 写 MV，这是最省心的；但**与已验证的 Canvas 管线不同源**，换栈有风险 |
| **Motion Canvas** | 免费开源；**只导图片序列**，要自己 ffmpeg 合成；官方自述"not meant to be a replacement for traditional video editing software" | 信息型矢量动画可以，MV 排版受限 |
| **p5.js / three.js / GSAP / anime.js** | p5.js 功能已冻结（只加无障碍）；three.js r187；GSAP 官方「now free for everyone」；anime.js v4「100% free」 | 全部可当库用，但**不必引入**——本片用原生 Canvas 就够 |

**确定性时间接口**（导出稳定的前提）：任意 t 的画面只由 t 决定。可用原语：`window.renderAt(t)`（自定义）、`svg.setCurrentTime(t)`（SVG SMIL，MDN 标注 Baseline，2015-07 起跨浏览器可用）、`animation.currentTime = ms`（WAAPI，Baseline 2020-03 起）。三者都能在截图脚本里同步生效。

### 4.2 本地 AI 可行性（RTX 3050 6GB Laptop）

| 问题 | 结论 | 依据 |
|---|---|---|
| SDXL 1024×1024 能跑吗 | **能，但慢**：0.6 it/s、约 **50 秒/张**（30 步）；权重 5.5 GB + 采样缓冲 1.1 GB，**余量仅约 0.5 GB**；batch 不可行；超过 1024 会崩或触发降质地平铺 | gigagpu 基准（**云端 RTX 3050 6GB，非本机实测**；笔记本 TGP 更低，实际会更慢） |
| SD1.5 呢 | 能，显存宽裕（约 3–4 GB），512–768 可正常出图，单张秒级 | 常识性判断，**本机未实测** |
| 值得为 MV 出 100+ 张图吗 | **不值得**。100 张 × 50 s ≈ **1.4 小时**纯生成（不含挑图重跑），且几乎全程占满显存 | 由上一行推得 |
| 那怎么用才划算 | **只出 10–20 张"钉子镜"**：一张背景板/一个纹理/一个关键意象，在代码里当贴图用，其他段落全部程序生成 | 本报告推荐 |
| Ollama / 本地 LLM 要装吗 | **不要**。①渲染、分镜、提示词全由在线 DeepSeek 完成，本地模型没有增益；②6 GB 显存里 LLM 会和 SDXL 抢；③本地小模型的代码能力显著弱于 DeepSeek，写 Canvas 分镜会退步 | 判断 |
| ComfyUI 怎么装 | Windows 有桌面版/便携包（需 20 系以上 N 卡）；或 `pip install comfy-cli && comfy install` → `python main.py` | ComfyUI README |

**量化口径**：单帧 50 s 意味着**任何需要"逐帧 AI 生成"的路线在本机都不可行**（306 s × 60 fps 全片要 25 天）。AI 只能出**静帧**，不能出序列。

### 4.3 中文可用的 AI 图/视频服务

| 服务 | 官网可达 | 能力 | 价格 | 核实程度 |
|---|---|---|---|---|
| **即梦 Jimeng** | ✅ 中文站 | 文生图、视频（Seedance 2.0 VIP 通道）、智能画布（局部重绘/扩图/消除/抠图） | **实测四档**：基础 ¥33/月（725 积分，原价 ¥69）、标准 ¥96（2210 积分，原 ¥199）、高级 ¥519（12320 积分，原 ¥998）、超级 ¥2235（54600 积分，原 ¥4299） | 价格已核实 |
| **可灵 Kling** | ✅ 中文站 | Kling 4.0 / Image 3.0；「画布」Agent 做剧本→出图→出视频→分镜→后处理；MCP/CLI 批量出片 | 有定价页 `klingai.com/dev/pricing`，**单价未核实** | 存在性已核实，价格未核实 |
| **Vidu** | ✅ 中文站（生数科技） | Vidu Q4/Q3/S；参考生视频、图生视频、文生视频、参考生图 | 有 `/pricing` 与 API 平台，**单价未核实** | 存在性已核实，价格未核实 |
| **海螺 Hailuo** | ✅（MiniMax） | 视频生成（首页标注 MiniMax H3） | **未核实** | 存在性已核实 |
| **Runway / Pika / Midjourney** | ⚠️ **本会话未实测中文可用性**，不给结论 | — | — | **未核实** |

> 对 R2 的建议：**优先用本地 SD1.5/SDXL 出 10–20 张静帧**（¥0、可无限重跑），云端服务只在"本地出不来的质感"时买最便宜的一档试。视频服务（R3）按条计费，务必先小样再批量。

### 4.4 能直接吃 LRC + 音频出歌词 MV 的开源项目

| 项目 | Stars | 许可证 | 中文/长句支持 | 评价 |
|---|---|---|---|---|
| **`852wa/JIZURA`（字面）** | 小 | **MIT** | ✅ 简体中文界面 + 中文字体表（Noto Sans SC / Noto Serif SC / ZCOOL / LXGW 等） | **最合适**：浏览器内贴歌词→自动分镜→导 MP4/PNG/AE JSON；860 部件 × 27 风格；自动 BPM 检测 + 空格 tap 手动对拍；支持 16:9 等 7 种比例、720p–4K、24/30/60fps |
| **`EGSECDA/vocaloid-style-mv-pipeline`** | ~261 | **MIT** | 未明示中日文竖排，但含 `kanjiSlam`（汉字猛击）场景 | 最接近本项目工程结构：Claude Code skill + 模板，`new_project.py --song x.wav --lyrics x.lrc --setup` |
| **`matthewprince/lyra`** | 小 | **README 未声明许可证（需向作者确认）** | 输入支持 TTML / LRC / enhanced LRC；**未提中文竖排** | 浏览器内卡拉 OK 渲染器（逐字扫色、弹簧滚动、和声/对唱），**rAF 驱动，不适合离线逐帧导出**，但卡拉 OK 的排版与逐字逻辑值得抄 |
| **`dropcreations/Manzana-Apple-Music-Lyrics`** | ~147 | 未核实 | LRC 生成；视频功能为付费 Pro | **不适合**：正文是 Apple Music 歌词抓取（要 cookie），出视频的 `Manzana Pro` 卖 **$29**、`Manzana Premium (Word Sync)` 卖 **$300**，且依赖 Apple Music 订阅 |
| **`danielcimento/MVSlideGenerator`** | ~11 | 未核实 | 明示支持 "English/Japanese lyric videos" | 生成幻灯片素材给剪辑软件用，不是端到端 |

> **结论**：想要"喂 LRC+音频直接出片"，现实里只有 **JIZURA** 一条（浏览器内、MIT、中文 UI）。它能出可发的片，但天花板是"文字 PV"——这正是 R1 与它的区别所在。

### 4.5 后期

| 工具 | 事实 | 成本 |
|---|---|---|
| **DaVinci Resolve 免费版** | 免费版可「edit and finish up to 60 fps in resolutions as high as Ultra HD 3840×2160」，含调色（luma/HSL/3D keyer、color warper、HDR）、Fusion、Fairlight | 免费；Studio $236（120fps/32K、Neural Engine、硬编解码加速等） |
| **ffmpeg** | Windows 构建（gyan.dev）release 9.0.2，**所有变体都含 nvenc/nvdec/cuda/amf/d3d11va/libvpl**，essentials 已含 libx264/libx265 | 免费（GPLv3） |
| **NVENC（RTX 3050）** | 官方矩阵：RTX 3050（Ampere / 第 7 代 NVENC / 1 编码器）→ H.264 ✅、H.265 4K ✅、HEVC 10-bit ✅、**AV1 ❌** | 已含在卡里；**笔记本 SKU 未单独核对** |
| **剪映专业版** | 中文桌面端；AI 抠像/补帧/人声分离/降噪/响度统一；支持 RTX 50 系硬件加速 | 免费 + 会员（**价格未核实**） |
| **AE / Premiere** | 本会话**未核实**其定价与系统要求，不给数字 | **未核实** |

**NVENC 建议**：本片 1080p60 全片用 `h264_nvenc` 可以把编码压到 1 分钟内；但**画面生成（Playwright 截图）才是瓶颈**（约 10.4 分钟），编码优化收益有限。**导出参数照抄已验证档**，别折腾。

---

## 5. 三条推荐路线（命令 / 文件级）

### 共同前置（三条路线都要做）

```powershell
cd "E:\新建文件夹\实习\MV"
# 1) 确认音频
.\ref_mv\node_modules\ffmpeg-static\ffmpeg.exe -hide_banner -i "The OGs 视频音轨.mp3"
#    期望：Duration: 00:05:05.92, 44100 Hz, mono, 96 kb/s
# 2) Python 依赖（对齐与分析）
python -m pip install playwright librosa soundfile
python -m playwright install chromium
```

**目录约定**（R1/R2/R3 通用）

```
mv_build/
  data/
    song.mp3            # 你的歌（软链或复制）
    lyrics.lrc          # 你对好的 LRC
    timing.json         # 每行起止时间（秒）+ 每行的 beat 索引
    sections.json       # 22 段的 {name, start, end, palette}
  src/
    engine.js           # renderAt(t) 主循环 + 时间换算
    scenes/01_intro.js … 22_outro.js
    lib/                # 画字、网点、纸张、终端、版画纹理
  export/
    render.mjs          # playwright 逐帧 → ffmpeg
  out/
```

---

### R1：纯程序化（推荐先做，¥0，纯 DeepSeek 可完成）

**R1-1 音频分析 → 得到时间骨架**

```powershell
python -c "import librosa,soundfile,numpy as np,json; \
y,sr=librosa.load('mv_build/data/song.mp3',sr=None,mono=True); \
tempo,beats=librosa.beat.beat_track(y=y,sr=sr); \
print('tempo',tempo,'beats',len(beats))"
```
把 `beats` 换算成秒写进 `data/timing.json`。**每行歌词的起始时间必须落在最近的一拍上**（允许 ±60 ms），否则后面全是"卡不上"。

**R1-2 22 段 → 22 个场景文件**

按 §1 的 22 段，每段一个 `src/scenes/NN_xxx.js`，导出 `export function shots(env)`，返回镜头数组：

```js
// 每个镜头
{ id:'c01', at: 62.31,       // 秒；且必须是某一拍的整数偏移
  lines:[12,14],             // 该镜覆盖的歌词行
  moment:'良率从 99.1 掉到 96.4',   // 一句话，必填
  layout:'TERMINAL:',        // 见 §3 选的风格
  render(ctx,t,f,u){ ... } } // 必须是 t 的纯函数
```

**R1-3 渲染**

```powershell
node mv_build/export/render.mjs --width 1920 --height 1080 --fps 60 --out mv_build/out/r1.mp4
# 先出单帧拼图检查
node mv_build/export/render.mjs --sheet out/qa.png --times 61.98,62.2,62.67 --cols 3
```

**R1 的加素材位置**：无。全部程序生成。可用图形：几何、排版、汉字笔画、网点/半调、纸张纹理（噪声 + 折痕）、字符画、粒子、剪影。

---

### R2：程序化 + AI 静帧（推荐第二步，性价比最高）

**R2-1 只出 10–20 张静帧**（本地 ComfyUI，SD1.5 或 SDXL）

```powershell
# ComfyUI 便携包解压后
python main.py --lowvram --force-fp16
# 建议：SD1.5 @ 768×768（快）或 SDXL @ 1024×1024（约 50 s/张，需容忍）
# 出图目标：纸纹/胶料质感/胎面胎侧剖面/硫化车间氛围/旧照片底纹
```

**R2-2 一致性靠"同一张参考图"**：每类素材先定 1 张基准图，之后全部拿它做 img2img/参考，而不是各张独立文生图。

**R2-3 嵌进代码画面**

```js
// 静帧当贴图，代码负责运动
const bg = await loadImage('assets/ai/curing_floor.png');
render(ctx,t){
  const k = ease(clamp01((t-88)/0.6));      // 0→1 入场
  drawImageCover(ctx, bg, { zoom: 1+0.04*k, pan:[0.02*k,0] });
  halftone(ctx, { size: 4, angle: 15 });     // 统一成印刷质感，掩盖 AI 味
  caption(ctx, '硫化车间 · 2019', …);
}
```

**关键**：**所有 AI 静帧都要过一遍统一后期**（网点/颗粒/统一色板），否则一眼看出"这张是 AI、那张是代码"。

**R2 的加素材位置**：背景板、纹理、单张意象图。**永远不进歌词层**——歌词必须代码画，才能逐字对拍。

---

### R3：程序化 + AI 视频片段（只在必要时用）

**R3-1 只做 3 个 5–8 秒段落**，位置建议：全片最高潮前的一镜、结尾定格前、以及一个"车间穿越"转场。

**R3-2 用图生视频而不是文生视频**：先出静帧定稿，再让视频模型动，否则一致性必崩。

**R3-3 资料准备**（每个 AI 片段）

- 参考图 1 张（R2 定稿的静帧）
- 时长 ≤8 s、1080p、24/30fps（**不要 60fps**，AI 输出的 60fps 多是插帧假动作）
- 存成 `assets/ai/clip_01.mp4`，代码里按时间轴裁切/变速/叠遮罩

**R3-4 代码侧合成**

```js
// 关键：AI 片段只占画面的一层，绝不能整屏无遮罩播放
ctx.save();
ctx.beginPath(); ctx.rect(0,0,W,H*0.62); ctx.clip();
drawVideoAt(ctx, clip01, t - 212.4, {rate:0.9});
ctx.restore();
grade(ctx, { lift:[0.02,0.02,0.03], sat:0.85 });
```

**R3 为什么"加不起"**：按条计费、每条要重跑挑、且 3050 上跑不了本地视频模型（显存不够）。它只适合做"点睛"，不适合承载叙事。

---

## 6. 每条路线最容易翻车的地方

### R1

| 翻车点 | 规避 |
|---|---|
| **画面太"干"，像 PPT** | 每镜至少三层（背景/主体/前景），并加**纸张或屏幕的物理感**（网点、扫描线、折痕、噪点）——参考片定的"哑光界面 + 局部辉光"就是这个道理 |
| **22 段各写各的，风格散架** | 先定一张"色板表"：橙=我、米白=你/同事、红=Failure、灰=absence，全程只用这几个角色色 |
| **歌词卡不上** | 每行起始时间吸附到最近一拍（±60 ms）；导完跑一遍同步检查，别靠肉眼看 |
| **60fps 下动作抖** | 所有缓动用 `t` 的解析函数，禁止 `Math.random()` 与跨帧状态 |
| **中文字体缺字变方块** | 只用已加载的字体子集；生僻字（同事姓名里的）要单独加进字体清单并跑一遍成片检查 |
| **人名写错** | 12 位真实同事的姓名/顺序必须由用户确认后写成 `data/people.json`，代码只读这份文件 |

### R2

| 翻车点 | 规避 |
|---|---|
| **AI 图与代码图"两套皮肤"** | 全部 AI 图过统一后期（网点/颗粒/色板）；不过后期就别用 |
| **显存打满导致中途崩** | SDXL 只跑 1024、batch=1、关掉其他吃显存的程序；宁可 SD1.5 快出 |
| **肖像问题** | **不要用 AI 生成真实同事的脸**。用姓名条、工牌、剪影、编号 |
| **图生出"多余的现代感"** | 提示词里显式排除：no modern UI、no glossy 3D render、no stock photo |

### R3

| 翻车点 | 规避 |
|---|---|
| **每个片段风格各异** | 全部用同一张参考图 + 同一套提示词模板；不同服务之间不要混用 |
| **AI 片段动作"太满"** | 只要**一个动作**（推近、转头、落下），其余交给代码做运镜 |
| **付费服务选错档** | 先买最便宜一档出小样；确认画风再批量 |
| **版权与标注** | 参考片自己都标了「含AI生成内容」——本片若用 AI 素材，**发布时也必须标**；且封面/角色不要碰他人 IP |

---

## 7. DeepSeek 在链路里的角色

**定位：导演 + 工程师 + 文案，不是画师。** 它不产图、不产视频，但能把一首歌翻译成一份可执行的渲染工程：

1. **听结构 → 出分镜**：读 `timing.json` 与 `sections.json`，产出 22 段的镜头表（每镜的起止拍号、画面类型、色板状态、进入/退出方式、一句话 moment）。
2. **写渲染代码**：按约定的 KIT 接口写 `src/scenes/NN_xxx.js`（`render` 是 `t` 的纯函数、不碰 DOM、随机用固定种子）。
3. **写提示词**：需要 AI 静帧时，产出一致性提示词模板（基准图 + 风格词 + 负面词），而不是每次随机描述。
4. **写检查脚本**：单帧拼图、闪光统计、音画偏移、批量导出与失败重试。
5. **做取舍**：根据跑出来的拼图与成片决定改哪个镜头。

**不该指望它做的事**：直接出画面、判断"好不好看"。所以流程里必须保留人眼验收：**出单帧拼图 → 人看一眼 → 再继续**。

---

## 8. 未核实清单（不要当结论用）

1. **本机 ComfyUI / SDXL 实测速度**：用的是第三方基准（gigagpu，云端 RTX 3050 6GB），**笔记本 3050 会更慢**；SD1.5 的具体秒数也没实测。
2. **可灵 / Vidu / 海螺 / 剪映的具体价格**：只确认定价页存在，没读数字。
3. **Runway / Pika / Midjourney 的中文可用性**：完全没测，不给结论。
4. **笔记本 RTX 3050 的 NVENC 是否与桌面版同规格**：官方矩阵给的是 "RTX 3050"，笔记本 SKU 未单独核对。
5. **JIZURA 的 BPM 检测准确率**、**lyra 的许可证**（README 未声明）。
6. **AE / Premiere 的定价与要求**：未核实。
7. **`ref_mv` 本机能否跑通**：未跑，只读了文档与源码。
8. **参考片画面观感**：只拿到元数据（标题/时长/分辨率/简介），B 站播放页直接抓取返回反爬「验证码」页，未逐帧比对。
9. **librosa 文档路径**：旧路径 `/doc/latest/feature.html` 已 404，引用以 `https://librosa.org/` 根地址为准。

---

## 9. 来源

**本曲事实**：本机 `The OGs 视频音轨.mp3`（`ffmpeg -i` 输出：`Duration: 00:05:05.92, bitrate: 96 kb/s, 44100 Hz, mono`）

**参考视频与工程**
- B 站 API：`https://api.bilibili.com/x/web-interface/view?bvid=BV1RzHG6SEHy`
- `https://github.com/Nyankomintsu/world-execute-me-lyric-mv`（= 本机 `ref_mv/`；代码 MIT，剪影 CC BY-NC-SA 4.0）
- 本机文档：`ref_mv/README.md`、`ref_mv/docs/v4/PLAN.md`、`ref_mv/docs/v4/KIT.md`、`ref_mv/export/export.mjs`

**代码渲染**
- Remotion 授权：`https://www.remotion.dev/docs/license/pricing`
- Remotion CLI：`https://www.remotion.dev/docs/cli/render`
- Remotion 音频可视化：`https://www.remotion.dev/docs/audio/visualization`
- Motion Canvas：`https://motioncanvas.io/docs/`、渲染 `https://motioncanvas.io/docs/rendering/`
- Manim：`https://github.com/ManimCommunity/manim`
- p5.js：`https://p5js.org/`｜three.js：`https://threejs.org/`
- GSAP：`https://gsap.com/pricing/`｜anime.js：`https://animejs.com/`
- MDN 时间接口：`https://developer.mozilla.org/en-US/docs/Web/API/SVGSVGElement/setCurrentTime`、`https://developer.mozilla.org/en-US/docs/Web/API/Animation/currentTime`

**同类开源工程**
- `https://github.com/852wa/JIZURA`（MIT，浏览器文字 PV）
- `https://github.com/EGSECDA/vocaloid-style-mv-pipeline`（MIT，Canvas+Playwright+ffmpeg）
- `https://github.com/matthewprince/lyra`（浏览器卡拉 OK 渲染器）
- `https://github.com/dropcreations/Manzana-Apple-Music-Lyrics`（Apple Music 歌词抓取）
- `https://github.com/danielcimento/MVSlideGenerator`

**音频/对齐**
- librosa：`https://librosa.org/`｜aubio：`https://pypi.org/project/aubio/`｜madmom：`https://pypi.org/project/madmom/`
- demucs：`https://pypi.org/project/demucs/`｜basic-pitch：`https://pypi.org/project/basic-pitch/`｜aeneas：`https://pypi.org/project/aeneas/`
- openai/whisper：`https://github.com/openai/whisper`｜faster-whisper：`https://github.com/SYSTRAN/faster-whisper`（`word_timestamps=True` 出词级时间戳）

**AI 图像/视频**
- 即梦：`https://jimeng.jianying.com/`｜可灵：`https://klingai.com/`（定价 `https://klingai.com/dev/pricing`）
- Vidu：`https://www.vidu.cn/`｜海螺：`https://hailuoai.video/`｜ComfyUI：`https://github.com/comfyanonymous/ComfyUI`
- SDXL on RTX 3050 基准：`https://gigagpu.com/sdxl-on-rtx-3050-benchmark/`

**后期**
- DaVinci Resolve：`https://www.blackmagicdesign.com/products/davinciresolve/`
- FFmpeg 构建：`https://www.gyan.dev/ffmpeg/builds/`
- NVIDIA 编码矩阵：`https://developer.nvidia.com/video-encode-decode-support-matrix`
- 剪映专业版：`https://www.capcut.cn/`

**风格库**
- `ref_prompts/docs/STYLES.md`、`ref_prompts/skills/code-animation-prompts/SKILL.md`、`references/rendering.md`
- 风格条目原文：`ref_prompts/skills/code-animation-prompts/assets/library/风格提示词/`

---

## 10. 立刻可执行的三步

1. **今天**：跑 §5 的"共同前置"，确认 305.92 s 与 96 kb/s；把 LRC 对到拍上，写 `data/timing.json`。
2. **明天**：用 R1 做 **3 个镜头**（开场 A2 光标打字、一个 L39 终端段、一个 L33 名单段），跑 `--sheet` 出拼图给用户看。**只做 3 个**，确认风格方向再铺 22 段。
3. **之后**：铺满 R1 出全片（约 10.4 分钟一版）；有余力再加 R2 的 10–20 张 AI 静帧。
