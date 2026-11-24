# 古代段视觉回退事实审计

日期：2026-11-11。只读检查了旧工程文件、handoff、现有截图与 motion-v2 源码；未改源码、未渲染。

## 历史版本能证明什么

| 证据 | 可确认 | 不能确认 |
| --- | --- | --- |
| `out/stills/t045.00.png`（2026-11-10 10:52）、`t123.00.png`（11:45）、`t132.00.png`（10:52）；旧入口 `film/src/` 有 11 月 10 日修改记录 | 昨天确有旧 Canvas 主工程静帧。t045 是整幅纸纹、竖排大歌词和单个迁徙字段；t123 是近黑账页表格与底部歌词。两帧不是今天重复缩略卡时间轴的排法。 | 文件不标 DeepSeek 作者，也没有用户认可记录。不能把它们定为“昨天 DeepSeek 较好版”。 |
| `out/film_v8.mp4`，mtime 11 月 10 日 21:23；[`VERSION_AUDIT.md`](VERSION_AUDIT.md) 说明它属于约 306 秒旧主片 | 昨天存在完整旧主片。 | 它不是古代 DeepSeek demo 的证据。 |
| `out/ancient_demo_v1.mp4` 于 11 月 11 日 12:46 导出；[`TODAY_ANCIENT_DEMO.md`](TODAY_ANCIENT_DEMO.md#L18) 明记用户否决 v1 视觉质量。`ancient_bridge` README 的验证记录只有 Node stub，自述浏览器抽帧未做。 | 今天的 v1 不能冒充昨天较好版本；bridge 是一个未做真实浏览器画面验收的实现候选。 | 不能从源码存在推断用户看过或认可了 bridge。 |
| `code_ai_prototype` 文件于 11 月 11 日创建；其 [`README.md`](../external_deepseek/code_ai_prototype/README.md) 定义为代码/AI 工作场景、独立无声原型 | 它的近黑、暖黄、编辑器面板是现代工业场景方案。 | 不是古代段已认可的 DeepSeek 模板。 |

在 `docs/external_deepseek/` 与 `out/motion-v2/` 未找到 mtime 为 11 月 10 日的古代 DeepSeek 文件或帧。**昨天确切文件/截图及用户认可状态未知；本审计不代其归属或认可。**今天可对照帧是 `out/motion-v2/video-qc/t123_5s.png`（16:24:49）和 `t137_27s.png`（16:25:06）；当前视频输出 mtime 为 16:42:03。

## 今天 slide / dashboard 观感的源码证据

以下是代码事实；“因此看起来像 PPT”属于对用户反馈与现有帧的因果解释。

| 因素 | 源码证据 | 可验证的影响 |
| --- | --- | --- |
| 字体 fallback 不一致 | [LifeProcess.tsx](../../film/motion-v2/src/scenes/LifeProcess.tsx#L403) 的订单段要求 `Source Han Serif SC → Songti SC → SimSun`，motion-v2 没有打包字体文件。本机字体注册表有 `Noto Serif SC`、`SimSun`，没有前两种名称，因此该段回退到 SimSun。[LiuProcess.tsx](../../film/motion-v2/src/scenes/LiuProcess.tsx#L26) 则把可用的 Noto Serif SC 放在回退链中；同一文件另有只列 `Songti SC,SimSun` 的轴标签。 | 同片不同场景会落到不同宋体；最终观感依赖输出机器。状态字另用 8–16px `ui-monospace`（LiuProcess.tsx:482, 529, 672），与大号歌词/宋体人物标题明显断层。 |
| 多层米黄面板、浮起阴影 | `LOOKS.paper` 已是暖白纸色（[Look.tsx](../../film/motion-v2/src/vendor/shotcraft/Look.tsx#L64)）；WindRecap 还在其上把回顾内容铺进 #f8f1df→#e4d7bc 渐变面板并用 `softShadow(12, strength .88)`（[LiuProcess.tsx](../../film/motion-v2/src/scenes/LiuProcess.tsx#L584)）。RecapCard 又各自加渐变、边框和 `softShadow(5)`（LiuProcess.tsx:512–519）。订单段另有全屏 Stage、季节渐变和带阴影的大纸板（[LifeProcess.tsx](../../film/motion-v2/src/scenes/LifeProcess.tsx#L376)、403–413）。 | 背景原有水墨/纸纹被多块不透明暖色表面盖住，强阴影把纸片变成悬浮 UI 面板。问题来自叠加层级，不是缺少背景图。 |
| 等尺寸卡片重复 | WindRecap 的每个节点生成 252×188 卡；卡内固定 104px 缩略窗、标题和状态徽标（[LiuProcess.tsx](../../film/motion-v2/src/scenes/LiuProcess.tsx#L490)、506–531）。末端又以 744×331 矩形承载灯、两个人物栏和空标题线（LiuProcess.tsx:578–626）。 | 经历被分成一列同规格“缩略图＋标题＋徽标”，末端又出现一张汇报页；这是最直接的 PPT 卡片来源。 |
| 标题、正文、元信息比例失衡 | Shotcraft 的 [Look.tsx](../../film/motion-v2/src/vendor/shotcraft/Look.tsx#L93) 把 1080p `body/small/label` 定为 40/32/22px；WindRecap 却让主时间轴卡的缩略字段/徽标落在 8–12px、年龄名牌落在 13px（LiuProcess.tsx:482, 529, 672），人物标签 20px（625）。 | 重要内容和“档案系统”式小字挤在同一视觉层级；小号字更像 UI 注释，未形成画面主体、叙事信息、辅助标记三级。 |
| 时间轴横移与主体取景脱节 | WindRecap 的 `cameraX` 驱动时间轴；远近云只按 0.075/0.18 倍视差移动（LiuProcess.tsx:641–646）。刘邦人物固定 `left:44, top:94`（659–665），年龄纸片也固定在 536,58（667–675）；末端档案作为世界坐标的一张卡进入（578–590）。 | 镜头运动集中在横移时间轴/云层，人物与主体空间没有同一镜头里的取景变化；最终自然形成“人物＋右上展示板＋下方卡带”的版面构图。 |

## 可复核的恢复路径

1. 若要恢复“昨天 DeepSeek 版”，先取得能标明来源的源文件或截图；目前只可把 `out/stills/` 与 `film/src/` 当旧主工程候选，不能据此声称恢复了 DeepSeek 或用户认可版本。
2. 古代内容可按实际动作核对 [ancient_bridge.js](../external_deepseek/ancient_bridge/ancient_bridge.js) 与其 README：单镜暖纸画心、深墨/朱砂、小标签、对象连续变化；但 README 明确没有浏览器实帧验收。旧工程构图候选在 [layouts3.js](../../film/src/layouts3.js)，如 `workOrderLamp`（332–385）和 `chessLine`（929–990）。复用前需对照用户真实参考帧。
3. 对 motion-v2，先删去 `RecapCard` 的统一缩略卡骨架和 `EndArchive` 的大矩形容器，让时间轴触发已有图像/物件层进入同一画心；保留 Remotion 的时码与状态逻辑。字体统一到打包/确认可用的字族，主信息至少回到该仓库自己的 22/32/40px label/small/body 阶梯，微型 mono 仅用于非叙事纹理。
4. 需要 Shotcraft 运动参考时：[PaperTitleCard.tsx](../../ref_drawai/lib/motion/shotcraft/upstream/demos/typography/paper-title-card/PaperTitleCard.tsx) 给出无内容容器的全幅纸底与单句衬线压字；[TimelineTravel.tsx](../../ref_drawai/lib/motion/shotcraft/upstream/demos/data/timeline-travel/TimelineTravel.tsx#L37) 可只借相机/节点经过触发逻辑，不沿用其中白色里程碑卡皮肤。现代 `code_ai_prototype` 只可借动作编排，不作为古代风格来源。

