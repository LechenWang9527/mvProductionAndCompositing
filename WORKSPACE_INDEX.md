# MV 工作区文件地图

## 一线高频资产

| 要找什么 | 打开这里 |
| --- | --- |
| 新版标准歌词 | [new_lyrics.txt](lyrics/new_lyrics.txt) |
| 新版时间轴 | [new_timing.json](lyrics/new_timing.json) |
| 新版官方音轨 | [PE_Annual_Party_新音轨.m4a](lyrics/PE_Annual_Party_新音轨.m4a) |
| 甲方新发参考包 | [source_updates_20261124/](source_updates_20261124/) · 带字幕参考视频、LRC、两张预览图 |
| 古代篇完整成片 | [03_完整成品/](delivery_古代篇_20261122/03_完整成品/) · [直接播放无损对齐版](delivery_古代篇_20261122/03_完整成品/The_OGs_古代篇_完整MV_无损对齐版.mp4) |

找分段视频、关键帧或提示词，先看[古代篇交付说明](delivery_古代篇_20261122/99_说明/README.md)。找工程入口，先看 [AGENTS.md](AGENTS.md) 和[参考渲染工程 README](ref_mv/README.md)。查风格用[风格索引](ref_prompts/docs/STYLES.md)。

## 目录树

树中列齐根目录，并展开日常会用到的项目层级。安装依赖、仓库元数据、模型和帧序列按所在目录聚合，逐级下钻可在根目录运行 `tree /A`。

```text
MV/
├─ delivery_古代篇_20261122/      古代篇交付包
│  ├─ 00_完整成片/              2 分 17 秒 1080p 完整版
│  ├─ 01_分段素材/              分段视频，含 _废弃旧版归档/
│  ├─ 02_提示词/                采用版/ 与 全部历史版本/
│  ├─ 03_关键帧/                各分段的关键帧
│  ├─ 03_完整成品/              无损对齐版整片与抽检帧
│  └─ 99_说明/                  交付说明与文件清单
├─ lyrics/                      当前用词、时间轴、音轨及 _archive_old/
├─ source_updates_20261124/       甲方原始参考资料
├─ film/                        MV 制作与渲染
│  ├─ data/                     歌词、节拍与场景数据
│  ├─ docs/                     渲染工程分镜说明
│  ├─ media/                    candidates/ 候选图、gen/ 生成图、photos/ 照片、references/ 参考素材
│  ├─ motion-v2/                Remotion 工程
│  │  ├─ src/                   构图、字幕、场景与渲染入口
│  │  ├─ public/                assets/、audio/、data/、fonts/
│  │  ├─ studies/               工程试验
│  │  ├─ out/                   工程内渲染输出
│  │  └─ .bundle/、.tmp/、node_modules/    打包、临时文件、依赖
│  ├─ pixel/                    像素风制作脚本、参考图、帧与导出
│  ├─ probe/                    工程内探测脚本
│  └─ src/、tools/               浏览器渲染源码与制作工具
├─ mv_engine/                   本地歌曲分析与 MV 渲染引擎
│  └─ data/、media/、src/、tools/   引擎数据、素材、源码、工具
├─ tools/                       素材盘点、歌词提取、拼接与交付工具
├─ docs/                        项目规划、研究、交接与整理报告
│  ├─ handoff/                   制作交接、资产核对和分段说明
│  ├─ external_deepseek/         外部研究记录
│  ├─ notes/、pixel/             迭代笔记、像素风制作资料
│  └─ refs/、tool_research/        参考图、联系表与工具调研
├─ analysis/                    音频特征、歌词对齐、画面检查与日志
├─ out/                         历史导出、版本验收图、交接包和渲染备份
│  ├─ Gemini_古代MV_图生视频交接包/  按镜头整理的图生视频素材
│  ├─ alignment_review/、subtitle_review/、subtitle_uniform_review/    对齐与字幕审看
│  ├─ ancient_demo_review/、animation_method_audit/、chorus_review/、
│  │  global_review/、liubang_review/    古代篇迭代审看
│  ├─ motion-v2/、seedance-ancient/     项目输出与生成记录
│  ├─ stills/、v2frames/、v3probe/、v4scroll_check/、v6final/、
│  │  v6frames/、v7frames/、v8frames/、v9check/    各轮静帧、导出与验收图
│  └─ retime_backup/              改节奏前的备份
├─ ref_mv/                      参考歌词 MV 的渲染工程
│  ├─ docs/、src/、tools/、assets/、data/、export/、音頻&歌詞/    说明、源码、工具与素材
│  └─ .claude/、.git/、node_modules/    本地设置、版本库与依赖
├─ ref_prompts/                 动画风格提示词与静帧参考
│  ├─ docs/、prompts/、scripts/、skills/    风格索引、导入、脚本和提示词库
│  └─ .git/、.github/            版本库与仓库配置
├─ ref_drawai/                  dsh-drawai 参考仓库
│  └─ docs/、lib/、skills/、src/、tools/、.git/    说明、库、技能、源码、工具与版本库
├─ bench/                       帧渲染基准脚本
├─ .scout/                      早期目录和风格库调研摘要
│  └─ refp/                     风格库摘录与检索脚本
├─ _trials/                     实验环境、试验脚本和试验媒体
│  ├─ bin/、ffprobe_app/、gh/     实验用本地工具
│  ├─ venv_audio2/、venv_librosa/、venv_torch/    Python 虚拟环境
│  ├─ hf_home/、models/         模型缓存与权重
│  ├─ logs/、tmp/、pip-*/        实验日志、临时区和安装缓存
│  ├─ repos/、scripts/           参考仓库与实验脚本
│  └─ motion_canvas_app/、remotion_app/、wwwtyro_app/    试验工程
├─ _archive_workspace_legacy/    本次归档的原根目录散落文件
│  ├─ probe_scripts/            一次性片尾补丁脚本
│  ├─ test_media/               根目录试片归档预留
│  └─ old_root_assets/          旧音轨、自动识别字幕与旧计划
├─ AGENTS.md                    项目工作约定
└─ WORKSPACE_INDEX.md           本文件
```

## 归档去向

| 原根目录文件 | 当前位置 |
| --- | --- |
| `_patch_finale.mjs` | [probe_scripts/](_archive_workspace_legacy/probe_scripts/) |
| `The OGs 自动识别.lrc`、`The OGs 自动识别.srt`、`The OGs 视频音轨.mp3`、`_plan.txt` | [old_root_assets/](_archive_workspace_legacy/old_root_assets/) |
| `sd15_*`、`ialakey_*`、`remotion_frame.png` | 原位置 [_trials/](_trials/) |

重跑旧版 `film/render.mjs` 时，可用 `--audio "_archive_workspace_legacy/old_root_assets/The OGs 视频音轨.mp3"` 指定旧音轨。固定读取旧根路径的历史脚本见[整理报告](docs/codex_cleanup_report.md)。
