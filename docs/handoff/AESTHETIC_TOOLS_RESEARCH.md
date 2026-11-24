# 今晚审美重构：工具与模板核验

核验日期：2026-11-11。范围：只读检查 `film/motion-v2` 与本地参考库，查询官方一手资料及当前插件目录；没有安装依赖、下载技能、改生产源码或渲染。

## 建议先用的四项能力

| 能力 | 对当前问题的帮助 | 今晚能否直接用 | 来源与核验 |
|---|---|---|---|
| Anthropic `frontend-design` skill | 用主题、材料、字体、空间关系定视觉规则；明确提醒重复圆角卡片、软阴影、无意义标签与卡片逐个淡入会显得模板化。适合先给整轮做一个精简视觉方案，再审现有镜头。它是设计判断指南，不是 Remotion 动画库。 | **可以，免安装**：已在线读过原始 `SKILL.md`。如需本地按项目装：`npx skills add anthropics/skills --skill frontend-design`，选择 project scope，不带 `-g`。 | [Anthropic 原始技能文件](https://raw.githubusercontent.com/anthropics/skills/main/skills/frontend-design/SKILL.md)；[GitHub 源仓](https://github.com/anthropics/skills) 当前约 192.8k stars；[skills.sh](https://skills.sh/anthropics/skills) 显示该仓 3.8M 总安装、`frontend-design` 1.1M。计数是动态热度，不代表质量保证。 |
| Remotion 官方 `remotion-markup` / `remotion-best-practices` skills | 把方案落实成当前可逐帧导出的 React/Remotion：所有动作由 `useCurrentFrame()` / `interpolate()` 驱动、依赖 `fps` 换算秒数、用本地静态资源与可复核组件，避免 CSS 自走动画破坏抽帧一致性；也可检查字幕留白、字体与图层拆分。它解决实现可靠性，不替人选审美。 | **可以，免新运行时**：当前项目已有 Remotion 4.0.484、React 19.2.7 与依赖。技能未安装；已读官方源码。若安装，用 `npx skills add remotion-dev/skills` 并选 project scope。当前官方技能版本页面显示 4.0.542，较本地 Remotion 新，需按本地 4.0.484 API 核对。 | [官方 skills 源仓](https://github.com/remotion-dev/skills) 6.8k stars；[技能目录与安装命令](https://skills.sh/remotion-dev/skills) 显示 4.1M 总安装、`remotion-markup` 306.6K；[官方 `remotion-markup` 源码](https://github.com/remotion-dev/remotion/blob/main/packages/skills/skills/remotion-markup/SKILL.md)。 |
| 本仓 Shotcraft Remotion 镜头源码（选择性借结构） | 有真实、完整的遮罩揭示、相机经过节点触发、文本写入和分层视差实现，可把静图变成“被照亮、被写入、被经过、被显影”的过程，而不是只做整图平移缩放。直接使用参考源码不需加动画依赖。 | **可以，最直接**：参考副本已经在仓库；工程也已 vendoring `Polish.tsx` / `Look.tsx`。只摘动作函数、遮罩与时间组织，别整套搬产品宣传片的白卡、品牌标题与模板皮肤。 | 上游 [video-shotcraft](https://github.com/VincentWei1021/video-shotcraft) 约 18.6k stars、Apache-2.0；当前上游说明有 124 张配方卡、150 个动效预览、216 个候选 demo 经审核。项目已固定副本来源与 commit：[UPSTREAM.md](../../film/motion-v2/src/vendor/shotcraft/UPSTREAM.md)。本地可读路径见下表；本仓已有副本，无需下载。若需更新上游源码，可 `git clone https://github.com/VincentWei1021/video-shotcraft.git` 后按本地许可证/实际依赖审阅挑选，不建议直接替换全部 fixtures。 |
| 已连接的 Figma 插件 | 做一张可编辑的字体层级、留白、图像占比与版面参考帧，供负责人选定后再改 Remotion。适合审构图与风格，不负责最终渲染或过程动画。 | **可以，插件已安装**。工具目录搜索到 Figma `installed=true`；不用重连。其它相关搜索结果 Adobe、Runway、Higgsfield、fal、Canva、Descript 均未安装/连接。 | 插件目录实查，关键词为 video / animation / motion graphics / image editing / design prototyping。[Figma MCP 官方文档](https://developers.figma.com/docs/figma-mcp-server/) 说明可向画布写入原生 Figma 内容，并给 agent 设计上下文；连接状态以本次目录返回为准。 |

### 本地可直接打开的动画样例

这些是本地仓库中的 Shotcraft 上游快照；实现均以帧为输入，且从源码可以读到具体变化：

| 本地文件 | 可借用的真实结构 | 注意事项 |
|---|---|---|
| `ref_drawai/lib/motion/shotcraft/upstream/demos/transition/print-texture-transitions/InkBleedReveal.tsx` | SVG mask 揭示新画面；`feTurbulence` 与 displacement 只改变遮罩边缘，不扭曲被揭示的内容。落墨、扩散、全屏显影、静止收尾各有不同状态。 | 使用可确定性的固定 seed；避开源样里的产品 UI 与默认冷色皮肤。 |
| `ref_drawai/lib/motion/shotcraft/upstream/demos/data/timeline-travel/TimelineTravel.tsx` | `camXAt()` 定义连续相机路径，`popFrameOf()` 反算镜头经过节点的时刻；节点点亮、内容卡弹起并留下，具有“经过后改变世界”的结果。 | 源样式是白色信息卡；复用节点触发/相机时间关系，换成当前水墨画面和低信息量标记。 |
| `ref_drawai/lib/motion/shotcraft/upstream/demos/ui-entrance/document-typewriter-reveal/DocumentTypewriterReveal.tsx` | 页面内容按序揭示，一个光标跟随当前写入块，随后栏目和历史条目分批到位；含缓动相机路径。 | 整页文档和双栏 UI 容易产生 PPT/软件演示感；摘“遮罩沿内容写入+有落定结果”的方法，不要复制完整窗体。 |
| `ref_drawai/lib/motion/shotcraft/upstream/demos/camera/depth-layer-moves/MultiplaneReal.tsx` | 前、中、远层采用不同位移速度，配相机推移形成有限视差，主体可保持原图比例。 | 只给确有深度依据的图层做轻微错速，不把平面水墨画伪装成 3D。 |

工程当前共享件：[Polish.tsx](../../film/motion-v2/src/vendor/shotcraft/Polish.tsx) 有 `bezier`、`ramp`、`softShadow`、颗粒与缓动工具；[Look.tsx](../../film/motion-v2/src/vendor/shotcraft/Look.tsx) 有 `LOOKS`、字号阶梯、`Stage` 和文字显现。当前编辑审计指出多个场景重复叠米黄色大面板、卡片阴影、字号层级失衡，见 [VISUAL_REGRESSION_AUDIT.md](VISUAL_REGRESSION_AUDIT.md)。建议先复用现有 [EditorialStage.tsx](../../film/motion-v2/src/visual/EditorialStage.tsx) 与 [Fonts.tsx](../../film/motion-v2/src/visual/Fonts.tsx) 的全片纸底/字体入口；本地已随包带入 Noto Serif SC / Noto Sans SC variable fonts。`Look.tsx` 可只借时序与 type helpers，避免默认 `Stage` / surface 卡皮肤继续累积边框感。

## 其他工具：功能匹配，但不建议今晚换引擎

| 工具 | 官方功能与能解决的问题 | 当前适配状态 / 获取方式 |
|---|---|---|
| GSAP Timeline + DrawSVG | Timeline 适合编排多段重叠动作和标签；`seek(time)` 可把播放头跳到明确秒数；DrawSVG 可逐步显示 SVG path/line/polygon 等描边，适合路径、卷轴边缘、写入轨迹。官方安装是 `npm install gsap`。 | `film/motion-v2` 的 `package.json` / `node_modules` 没有 GSAP。需加依赖和 lockfile，并在 Remotion 里用 paused timeline 由 `frame/fps` seek；虽官方 API 支持 seek，但本项目尚未验证每帧任意顺序 seek 的导出效果。现有 `interpolate` 与 Shotcraft 函数可先完成同类需求，今晚不应为工具而加依赖。 [Timeline](https://gsap.com/docs/v3/GSAP/Timeline/) · [seek](https://gsap.com/docs/v3/GSAP/Timeline/seek%28%29/) · [DrawSVG](https://gsap.com/docs/v3/Plugins/DrawSVGPlugin/) · [GitHub，30.5k stars](https://github.com/greensock/GSAP)。 |
| Motion Canvas | 官方定位是 TypeScript generator 动画加实时预览编辑器，长于解释性向量动画与旁白同步。可用于未来整段以矢量图解释为核心的新项目。 | 是独立的 Vite/editor/render 工作流，当前 Remotion 项目未装 Motion Canvas；改成双引擎会引入新输出链路，不是现有场景的直接插件。官方安装从 `npm init @motion-canvas@latest` 起。 [官方介绍](https://motioncanvas.io/docs/) · [源仓，19.8k stars、MIT](https://github.com/motion-canvas/motion-canvas) · [官方 examples](https://github.com/motion-canvas/examples)。 |
| Rive | 专业编辑器可画图、时间轴、骨骼/网格、约束与状态机；Web runtime 可加载 `.riv`，适合未来需手工绑定的矢量角色或小型交互部件。 | 目前图像主体是完整水墨位图，没有可直接 rig 的分层部件；`@rive-app/webgl2` 未安装。Remotion 导出要正确控制 runtime render loop、状态机时间和资源释放，需另外验证任意帧 seek。官方 Web runtime 安装 `npm install @rive-app/webgl2`。今晚更稳妥的是让原图作为完整主体，靠遮罩、光场、位置、路径状态做克制动画。 [Web runtime](https://rive.app/docs/runtimes/web/web-js) · [Rive](https://rive.app/) · [runtime 仓，1.0k stars、MIT](https://github.com/rive-app/rive-wasm)。 |

Anthropic 的 `canvas-design` 也已核对：skills.sh 显示 130.6K installs；官方技能输出定位为单页 PNG/PDF 与视觉哲学，不是动画代码。可用于一张静态风格参考帧，但不能替代 Figma/Remotion 的逐帧实现。[原始文件](https://raw.githubusercontent.com/anthropics/skills/main/skills/canvas-design/SKILL.md)。

## 今晚可执行顺序

1. 先用 `frontend-design` 指南整理一个紧凑视觉规则清单：本片材料、字体角色、主体占比、可用标记和明确禁用的卡片/装饰套路；由负责人决定方向。
2. 用已连接 Figma 快速排一张静态版面参考，确认字体比例、空白、画面主体和字幕区，不把它当成成片。
3. 按负责人定稿，在 Remotion 当前共享入口落地字体与版面规则；动画直接复用本地的 ink mask、timeline event、逐块写入与轻视差代码，要求每个动作都有可读的内容变化与停留结果。
4. 用 Remotion 官方 skill 核对 frame determinism、字体载入和抽帧路径。当前技能较项目 Remotion 版本新，代码仍以本机 4.0.484 运行结果为准。

## 实际检查记录

- 已阅读项目 `AGENTS.md`、`ref_mv/README.md`、本地 `find-skills` 与 `plugin-management` 指南。
- 已阅读 Anthropic 原始 `frontend-design` / `canvas-design` SKILL.md、Remotion `remotion-markup` 源码、Motion Canvas 官方文档、GSAP 官方 Timeline/DrawSVG/安装文档、Rive 官方 Web runtime 文档，以及 Shotcraft 实际镜头源码。
- 已核对 `film/motion-v2/package.json`：Remotion 4.0.484 / React 19.2.7 已声明；本次检查 `node_modules` 有 Remotion 包，无 GSAP、Motion Canvas、Rive 包。
- 已查询插件目录：Figma 已安装；Adobe、Runway、Higgsfield、fal、Canva、Descript 处于未安装状态。没有建议重连 Figma，也没有触发其它服务连接。
- 首轮工具调查时未安装技能或依赖；技能安装计数、GitHub stars 会变化，文中数字是 2026-11-11 页面快照。

## 实际获取与采用状态

本节记录本轮按负责人要求从官方 raw GitHub 获取的原文副本，以及按这些规则对当前 editorial 文件做的逐项核对。下载只提供可审阅规则，不能单独改善画面；没有改生产源码、安装全局技能、增添依赖或渲染视频。

| 原件 | 工作区副本 | 为什么选这份 | 状态 |
|---|---|---|---|
| Anthropic `frontend-design/SKILL.md` — [raw 原文](https://raw.githubusercontent.com/anthropics/skills/main/skills/frontend-design/SKILL.md)；[官方目录清单](https://api.github.com/repos/anthropics/skills/contents/skills/frontend-design) | `docs/tool_research/anthropic-frontend-design/SKILL.md`；`references/README.md`；`SOURCE.md` | 字体层级、标签是否承载信息、结构是否表达内容、重复淡入/卡片动效是否泛化，正好用于本次审查。官方目录检查到的文件是 `SKILL.md` 与 `LICENSE.txt`，没有额外 references 文件。 | 直接读取官方 raw 正文并保存；没有安装。 |
| Remotion 官方 `remotion-markup/SKILL.md` — [raw 原文](https://raw.githubusercontent.com/remotion-dev/remotion/main/packages/skills/skills/remotion-markup/SKILL.md) | `docs/tool_research/remotion-markup/SKILL.md`；`SOURCE.md` | 校验逐帧驱动、fps 换算、缓动边界及 Studio 可编辑属性。 | 官方当前文件标注 4.0.542；本项目是 4.0.484，因此这里只按通用实现原则审阅，不把版本新特性当成现有项目要求。 |
| Remotion `local-fonts.md` — [raw 原文](https://raw.githubusercontent.com/remotion-dev/remotion/main/packages/skills/skills/remotion-markup/local-fonts.md)；`measuring-text.md` — [raw 原文](https://raw.githubusercontent.com/remotion-dev/remotion/main/packages/skills/skills/remotion-markup/measuring-text.md)；`timing.md` — [raw 原文](https://raw.githubusercontent.com/remotion-dev/remotion/main/packages/skills/skills/remotion-markup/timing.md) | `docs/tool_research/remotion-markup/references/` 对应文件 | 本项目场景本地载入字体、Canvas 测量聊天气泡宽度、使用秒值时序；这些参考能直接约束 Phone 字体测量顺序和确定性动画。 | 原文已保存；没有新增 Remotion 包或全局配置。 |

抓取说明：通过官方 raw URL 直接读取；本机 PowerShell HTTP 请求被代理连接限制（127.0.0.1:7897），故以网页读取结果保存。Remotion 副本去掉了网页展示的行号前缀，内容未做编辑。每个副本目录的 `SOURCE.md` 也记录了原始 URL 与日期。

### 对当前五个文件的机械核对

参照规则：Anthropic 文件第 16–17 行要求有意设置字体及清楚字号层级；第 21–24 行要求标签/编号承载信息，并警惕每个区块重复的淡入上移；第 43 行要求删除不服务内容的装饰。Remotion 文件第 17–32 行要求时间由帧值、fps 与 interpolate/easing 驱动；第 62–89 行说明使用 CSS `transform` 字符串会降低 Studio 里的单属性可编辑性；`references/measuring-text.md` 第 83–109 行要求先加载字体再测量文字。这里按代码行为审查，不把建议等同于渲染验收。

| 文件/行 | 可核对现状 | 对照规则与建议 |
|---|---|---|
| `film/motion-v2/src/editorial/Opening.tsx:208,224` | 时间轴两端“千年前 / 当下”各 26px；同一文件第 266、299 行两个人名 29px。共享字阶 `film/motion-v2/src/visual/EditorialStage.tsx:18-21` 的 support 是 30px。 | 层级略低于共享 support 字阶。若这些标签需要在 1920×1080 成片中稳定读到，统一到共享字号 token；两端文字本身说明时间范围，有语义，不属于无意义标签。 |
| `Opening.tsx:171-229` | Timeline 只有两个边界圆点与一枚行进标记，没有中间事件节点。标记表达过去到当下的进度，但代码中没有把经过具体节点与图像内容变化绑定。 | 不是“空的季节节点”（代码未发现春夏秋冬占位），但它是本次发现的最弱内容绑定：若保留中段节点/标记，应让标记时刻和实际事件揭示一致；否则它只是进度装饰。不要加没有事件内容的节点。 |
| `Opening.tsx:340-367` | 复唱按时码使用长安、茅屋、广厦、摇篮四张不同内容图；每张通过相同的 0.85 秒 InkReveal 进入。 | 有真实场景内容，不是空节点。重复同一种揭示形式四次，符合 Anthropic 对重复区块入场动效的警示；建议只在确有转折的图像处使用完整显影，其余通过连续关系/内容状态交接，避免每次都像模板卡片揭幕。 |
| `film/motion-v2/src/editorial/Dufu.tsx:12` | 杜甫竖排身份名使用 112px。 | 高于共享 display 72px，也高于此前给出的姓名标签 72–88px范围；应降到获批身份标签尺寸。它不是歌词。 |
| `Dufu.tsx:15,26-27,32,40` | 迁居词 27px；“支出”26px；“金额示意 · 元”21px；序号30px，“已付”27px。 | 多个说明性字低于共享 support 30px，其中 21px 是最明显的微小注释。按 Remotion/Anthropic 的可读层级，非必要小字删掉，必要的提升到 support；不要把来源不确定的说明放成论文脚注。金额主体 58–76px不属于过小文本。 |
| `film/motion-v2/src/editorial/Shot.tsx:24-30,53-74` | Painting 由 `time` 参数计算缓动、缩放与位移，InkReveal 显示图像；MemoryTravel 根据 `time` 在四张具体场景图之间改变画面，并推进路径/标签。样式含 `transform` 模板字符串。 | 动画是确定的时间函数，没有 CSS 自运行动画；符合 Remotion 的逐帧导出要求。`transform` 字符串只影响 Studio 单属性编辑体验，不构成帧确定性问题。MemoryTravel 标签28px，略低于共享 support 30px。四个事件各有不同图像和词（辗转/安身/奔波/深夜），不是空节点；若采用内容规则，应保留图像切换与事件结果的关联，不能只剩相同的点和线。 |
| `film/motion-v2/src/editorial/Phone.tsx:160-168` | 群聊发言者姓名 17px，消息主体 30px，头像 48px。 | 17px名字是所查文件里最细小的正文级别；缩进手机屏幕后更不易读。建议提升到实际安全可读尺寸，或删掉重复姓名（如果消息上下文已能识别发言者），避免小字密集的论文感。消息气泡具有真实聊天内容，UI 本身不是空装饰。 |
| `Phone.tsx:88-97,183-200` | `useMemo(measureRows, [])` 在 `Phone` 首次 render 时立即用 Canvas 测气泡，`<MVFonts />` 是随后返回的子节点；`MVFonts` 在 `Fonts.tsx:22-44,75-95` 通过注入 `@font-face` 并在 effect 内等字体加载。 | 按官方 measuring-text 参考“先加载字体再测量”，当前执行顺序存在实质风险：首次测量可能拿系统回退字体，空依赖 memo 会将回退尺寸保留到后续帧。应确认字体已加载后再测，或为加载完成后的测量提供依赖/重算；此处是代码顺序推导，未声称已经观察到气泡裁切。 |
| `film/motion-v2/src/SubtitlesEditorial.tsx:31-76` | 主句上限58px，下一句/下下句按31/27px绘制，固定底部字幕轨；所检查的场景文件没有独立重复唱词字符串。 | 没有发现画面中央重复的大号歌词；当前曲词仍由统一字幕组件输出。底部第三行27px可读性可结合实帧确认，但它属于字幕层，不是嵌入画面当标题的歌词。 |

专项拒绝项扫描：五个目标文件没有“春/夏/秋/冬”季节占位词，也没有搜索到“已展开的经历”等施工语句；Opening 的复唱场景和 Dufu 的四个 MemoryTravel 事件均指向不同具体图像。需单独处理的是 Opening Timeline 的两个边界和无事件绑定的行进标记，而非季节节点。上述结论只代表所检查的 TSX 文本和结构，不替代逐帧视觉验收。

### 本轮结论

- **值得根负责人优先处理**：Dufu 身份标签过大；Phone 发言者姓名与 Dufu 说明文字过小；Phone 气泡宽度在字体载入前缓存的风险；Opening Timeline 标记缺少与事件内容的明确触发关系。
- **已符合/未发现**：仅使用两套字体；所查 Remotion 动作均由显式时间值驱动，没有 CSS `animation`/`transition`；没有中央重复整句歌词；没有四季空节点；实际图像事件不是空占位。
- **范围限制**：本次只读审查，未改任何 TSX。获取技能原文及参考材料是提供可检查的规范来源，不代表已产生视觉改进；是否改画面需按建议由负责人取舍并经过抽帧验收。
