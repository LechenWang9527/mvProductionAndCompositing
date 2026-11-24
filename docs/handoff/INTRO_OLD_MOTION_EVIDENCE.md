# 前奏独立 demo：旧动态实现证据

只读核查：按项目约定先读了 AGENTS.md、ref_mv/README.md 与 ref_prompts 的 README/时间接口说明；未改生产代码、未渲染。

## 可复用的真实动态代码

1. 旧 Canvas 前奏：E:/新建文件夹/实习/MV/film/src/prelude_sequence.js，revealDesk()（55）从灯芯向外做柔边显影；preludeLamp()（82）随后保留案头轻呼吸，7.4 秒后推向卷轴/行囊。E:/新建文件夹/实习/MV/film/src/intro_process_v2.js 的 CUES（34）与 draw()（534）串起卷轴展开、人物进入、时间轴行进、人物连线和档案接力；可看 drawScroll（301）、drawTimeline（404）、drawConnection（481）、drawArchiveHandoff（509）。

2. 已导出的独立前奏：E:/新建文件夹/实习/MV/film/motion-v2/src/scenes/IntroProcess.tsx 的 INTRO_V2_CUES（29）和 IntroProcess（343）是 Remotion 版；ScrollUnfurl（96）、Person（146）、RecordLink（179）、TimeTravel（260）、ArchiveHandoff（307）均按帧推进。E:/新建文件夹/实习/MV/film/motion-v2/src/Root.tsx（18、56）将它注册为 648 帧、30fps 的 IntroProcessV2，并在片段中使用原曲。

   可播放文件已存在：E:/新建文件夹/实习/MV/out/motion-v2/IntroProcessV2.mp4（1920×1080、30fps、21.6s，H.264 + AAC）；E:/新建文件夹/实习/MV/out/motion-v2/IntroProcessV2.qc.json 记录解码成功、648 帧。该 QC 证明文件可解码，不代表用户认可。旧 Canvas JS 与已导出的 TSX 的 eventNodes 有小幅时点差异；复用导出画面时以 TSX 为准。

3. DeepSeek 原型 B 的动作链是真的写在 HTML 里：E:/新建文件夹/实习/MV/docs/external_deepseek/code_ai_prototype/ai_tools.html 的 TL（29）给出素材框入场/缩角、任务打字、3 张工具卡依次出现、三段数据流、结果点亮、淡出、Punchline 入场。drawTool（63）在数据流抵达后切换状态点颜色，drawFlows（116）、drawResults（100）、pullFade（97）、drawPunchline（126）分别实现这些动作；window.renderAt（172）可按局部秒数定帧。E:/新建文件夹/实习/MV/docs/external_deepseek/code_ai_prototype/code_report.html 的 TL（41）、drawEditor（63）、drawTerminal（112）、drawTable（130）实现代码逐字输入、RUN、终端和表格逐行落位。二者是可打开播放的无声局部原型；E:/新建文件夹/实习/MV/docs/external_deepseek/code_ai_prototype/README.md（3、56、65）明确浏览器截图与 MP4 未完成，不能当作已导出成片。

## 原歌词时码（绝对歌曲时间）

来源是 E:/新建文件夹/实习/MV/lyrics/og_timing.json（1）；film/data/timeline.js（1）注明由它生成。

- 前奏 demo 时间窗（0–21.6 秒）与歌词重叠：14.990–16.894「我是过来人」；16.620–20.401「一千年前揣着跟你一样的心」；19.945–21.997「你熬的夜 你咽的话」（尾部越过 demo 结束）。下一句「你没赢的仗 我都有份」从 21.614 开始，略晚于 demo 结束点 21.6。
- DeepSeek A 对应词「没有报表 我就自己导」实际为 185.126–187.567；README 的「约 m1xx」不是精确时码。B 段为「我也叫小马」266.061–267.425、「做了好几个AI」266.953–268.776、「该来的会来」268.450–270.162、「工艺的未来都是 Punchline」269.867–274.655；与下一句 272.555 起有歌词重叠。

## 证据边界

- 源码和 MP4/QC 分别证明实现存在、文件导出且可解码；不据此推断任何版本得到用户喜欢或认可。
- E:/新建文件夹/实习/MV/docs/external_deepseek/MODERN_VISUAL_SEQUENCE.md（19）的 U9 是旧分镜方案（字符块、光点、Punchline 套印）；它不等于 ai_tools.html 的实际画面，也不是用户验收记录。
- DeepSeek 原型 README 明确未接原曲；若复用其动作链，需要按上面的原歌词时码重新定时，不能把原型 0–12 秒当歌曲时码。
