# 过程动画复用研究 V2

范围：只读检查既有动画代码、渲染入口和已有输出；未改 `film/`，未运行旧 patch、渲染或新浏览器服务。

## 结论

现成材料里分两类成熟度：

1. **过程编排最完整：**`docs/external_deepseek/code_ai_prototype/ai_tools.html`。它有明确事件表：任务文字输入、三张工具面板依次入场、数据线逐段传递、接收状态点亮、三项结果出现、再收束到 Punchline。`code_report.html` 则是单窗口内最完整的操作链：代码打字、光标移到 RUN、运行反馈、表格逐行落位、字段连线、导出状态。
2. **主片集成最完整：**`docs/external_deepseek/ancient_bridge/ancient_bridge.js` 的四个 `draw*` layout 已接进 `film/src/shotfilm.js`，并且当前 `out/ancient_demo_v1.mp4` 存在。它更适合参考镜间接力、物件状态变化和绝对时码；群聊本身只有两条气泡，不是完整消息流。
3. **图像分层最好用来参考：**`ref_drawai/src/motion/shotcraft/upstream/template/src/aifl/live/ScenePapers.tsx`、`SceneWbr.tsx` 和 `demos/camera/depth-layer-moves/MultiplaneReal.tsx`。真实页面/卡片图片是主体，再做分层移动、遮罩揭示、堆叠受力和状态反馈。它们是 Remotion/React 场景，不可原样塞进当前 Canvas 工程；模板引用的 `public/textures/live/*.png` 在本仓库对应模板目录中缺失，能复用的是动作逻辑与分层方式。

项目自己的 `LAYOUTS.phoneChat` 只是四条气泡按 0.7 秒淡入；`timelineDots` 是一条轴和两个点。它们没有打字、滚动、读写状态或事件承接，不足以作为满意的过程动画底稿。

## 源码证据与可用状态

| 来源 | 已有动作 | 依赖 / 当前状态 | 适合复用什么 |
|---|---|---|---|
| `docs/external_deepseek/code_ai_prototype/ai_tools.html`：`drawTaskPanel`、`drawTool`、`drawFlows`、`drawResults`、`pullFade`、`drawPunchline`、`draw(t)` | 0–12 秒的任务输入 → 工具 01/02/03 → 虚线数据流 → 到达点变色 → 结果逐项点亮 → 收束。时间点都在 `TL` 常量表内。 | 单页 Canvas 2D，依赖同目录 `assets/common.js` 的 `W/H/PAL`、`seg/easeOut`、`drawFlow`、占位人物框和示意字幕。自身导出接口为 `window.renderAt(t)`，`?export=1` 只画指定时刻。README 记录 Node VM + Canvas stub 自检通过；浏览器截图和 MP4 未做。 | 事件表、多个 UI 面板错峰建立、传递状态和结果反馈。保留真实对象/插画作主画面；替换占位框、虚构文案和 `drawSubtitleMock`。 |
| `docs/external_deepseek/code_ai_prototype/code_report.html`：`charsTyped`、`drawEditor`、`drawTerminal`、`drawTable`、`drawFieldLinks`、`drawExported` | 代码字符和光标、RUN 按钮状态、终端行、表格行逐次出现、代码字段到表头连线、已导出 chip，动作有因果顺序。 | 与上页共用 `assets/common.js`；独立 HTML，无动画库。只有 VM stub 自检，没有浏览器帧或 MP4。代码内容与数据明确为示意。 | 打字游标、逐行写入、局部字段被连线解释、状态从“处理中”变“完成”。A2 的退字动作也能作为同一类按事件求值的参考。 |
| `docs/external_deepseek/ancient_bridge/ancient_bridge.js` → `film/src/ancient_bridge.js`：`drawKeys`、`drawReceipt`、`drawPhone`、`drawLedger` | 钥匙/工牌入场；收据按歌词顺序写入、依次勾选、留出“自己”；手机里两条消息、赞、手机扣下；订单沿路径累积、账页逐行记录、棋子继续向未完成方向走。对象从上一状态接到下一状态。 | 外部原型只依赖 `window.K`；自检 `review/_selftest.mjs` 为 `SELFTEST PASS`。主片版再依赖已加载的 `window.PHOTO`，#10/#25 使用 `KEYS_BADGE_LINE_V1` / `PHONE_DOWN_LINE_V1`。`PLAN` 已映射 #10/#11/#23–25/#29–31。它是已集成主片源码，不等于每个 UI 都很丰富。 | 绝对时间表、路径上的共享锚点、列表/账页状态变化、图像素材与程序动作共存、跨镜物件接力。不要单独复用原版 mini-icon 线画当主视觉。 |
| `film/src/shotfilm.js:246–277, 315–329`、`film/src/main.js:73–77, 111–130` | `renderAt(t)` 把秒数交给 `DRAW(t)`；`shotfilm.draw` 求当前 shot，构造 `c={t, local, dur, u, ...}`，调用 `LAYOUTS[PLAN[shot.n].k](c)`，再做后期和字幕。 | 各 layout 用 `c.t` 读绝对时码，用 `c.local` 读镜内时码；`main.js` 先等字体和 `PHOTO.load()`，`?export=1` 不启动 rAF。新过程应是 `LAYOUTS` 函数的纯时间求值，不能靠上一帧状态累积。 | 将原型 TL 的相对秒表改为 `c.local`，把音频/歌词锚点转换成镜头内常量；每一帧从事件表重新推导消息与图层状态。 |
| `film/src/photo.js:55–69, 267–305`；`film/src/dufu_sequence.js:44–77, 168–220` | `PHOTO.plate` 支持 `raw`、`fit:'contain'`、`sourceRect`、`alpha`；`inkOnly` 通过像素亮度转 alpha 去掉暖纸底。杜甫镜使用 `ctx.clip` 限定人物轮廓；茅屋整图淡入后只有短促风线响应；广厦整图匀比轻推并亮一扇窗。 | `PHOTO` 在 `photo.js` 异步加载并向 `window.PHOTO` 提供 `has/plate`。`raw:true` 可保留生成图细节；不需要把整张图再画成几条程序线。 | 插画做主体，动画放在局部揭示、移动标记、光/状态、前中后景。人物剪裁、图像比例和字幕区须单独保持。 |
| DrawAI 真场景：`template/src/aifl/live/ScenePapers.tsx` (`CUES`, `stackPress`)；`SceneWbr.tsx` (`cueFor`, block wipe, past-week stack)；`demos/camera/depth-layer-moves/MultiplaneReal.tsx` (`driveAt`)；`demos/data/timeline-travel/TimelineTravel.tsx` (`camXAt`, `TickStop`) | 卡片逐张落入并压动已落定卡片；正文用纸面遮罩块揭示，侧栏历史条目逐个堆入；多平面以约 0.35×/0.7×/1.4×速度横移，时间节点经过时卡片弹起、节点点亮。 | 依据 Remotion `useCurrentFrame/interpolate/spring` 和模板 helper（`PageCam`、`Polish`、`Look`、`Brand`）。可将 frame 换为 `c.local*fps`，将插值/ease 换成项目 `K.ease`；场景源码可读，但模板引用的实际页面纹理素材未随当前目录提供，所以此处只验证源代码存在，未重跑模板。 | 真实图像分层、遮罩揭示、多个速度层、图层之间的状态因果。它们是效果方法，不是可直接 import 的 Canvas 组件。 |

### 旧布局 / patch 的边界

- `film/src/layouts.js:1610` 的 `timelineDots` 只画轴和两个红点；`phoneChat`（1716）只逐条显出四条气泡，不打字、不滚动，也没有已读/回复状态。
- `film/data/patch_layouts_photo.mjs` 是旧式源码重写脚本，会直接写 `layouts.js/layouts2.js/layouts3.js`；`patch_blueprint*.mjs` 等也是针对旧布局的文本替换。它们没有独立事件/图层运行时，且部分路径硬编码到本机。这里只读取，不建议运行或拿它们当模块依赖。

## 已有输出与验证边界

- `docs/external_deepseek/ancient_demo_qc/report.json` 对 `out/ancient_demo_v1.mp4` 记录 `pass:true`：1920×1080、30fps、136.9s、有 AAC 音轨，完整解码 exit 0。文件当前存在。`ancient_demo_qc/README.md` 仍写着“视频尚未生成”，与时间较新的 `report.json` / 视频文件冲突；README 状态已过期。
- 已查看存量预览 `out/chorus_review/shot04_start.png`、`shot04_mid.png`、`shot04_end.png`：真实长安图作底、杜甫/刘邦图像与朱砂路径同构；这证明图像层可进入画面，不证明中间运动通过完整视频验收。也查看了 `ancient_demo_qc/review_frames/frame_58_4s.png`、`frame_110_85s.png` 和 `out/stills/t089.10.png`。
- 当前没有可调用的浏览器工具；未打开 DeepSeek 独立 HTML 预览，也未重新播放/渲染旧 MP4。两份 `code_ai_prototype` 的视觉效果因此仅按源码和已记录的 stub 测试评价；不把它们称作浏览器验收通过。

## 三个复用建议

1. **消息 UI 用“事件表 + 状态派生”，不要只排气泡。** 每条消息配置 `start/typeEnd/send/read` 等相对时间；在任意 `c.local` 计算字符数、发送位移、气泡堆叠位置与状态徽记。参考 `code_report.drawEditor` 的字符/光标、`ai_tools.drawTaskPanel/drawResults` 的状态链，以及 `SceneWbr` 的逐块揭示和历史列表堆叠。只绘制已发生事件；多条记录始终可由同一个时刻重建，滚动只发生在屏幕区域，不破坏整体插画构图。
2. **用现成插画承载叙事，动画作用在图层与遮罩上。** 底图保留 `PHOTO.plate(...,{raw:true})` 的细节；可分开的前景对象保持原比例，用 `clip`/alpha mask 做柔边局部揭示，背景/主体/前景分别以小幅不同速度位移；再将路径、灯光或信息条作为独立状态层。参考 `dufu_sequence.drawDufu/drawHut`、DrawAI `MultiplaneReal` 和 `ScenePapers`。若原图并非透明切图，不应靠强裁剪伪造前后景；资产不支持时可用局部遮罩和标注，不把主体改造成儿童线画。
3. **时间轴必须推动具体事件，并把同一个对象接到下一状态。** 参考提示索引 M20 的节点逐项展开，配合 M4 的“一个元素接力”与 M5 的共同形状转场；代码参考 `ancient_bridge.drawLedger/pathPoint` 和 `TimelineTravel.camXAt/TickStop`。时间轴的点应触发实际内容、列表、插画局部或状态变化；只画一条逐渐变长的线不算事件动画。字幕继续由主片三行系统绘制，画面内容保留 y<778。

提示索引选择：A2（打字/退字）、M4（贯穿锚点）、M5（共同形状连续转场）、M8（真实图像与慢漂）、M20（节点事件）、M25（歌词卡点）、E2（纸层前快后慢）、Z5（`destination-out` 镂空/显影）。Z5 把颜色、比例和装饰严格限定在红窗花，建议只借遮罩构造；M12 要求 9:16 皮影，不适合直接覆盖本片 16:9 纸墨风。

## 8–12 秒技术打样清单（不定剧情）

1. 主负责人选择一段 8–12 秒内容和已批准的真实主图；先确认可拆出的图层/透明素材、字幕安全区与 16:9 构图，不新增或简化主体插画。
2. 写一张时序表：起始显影、3–5 个消息/时间轴事件、图像状态变化、末尾停留/接镜。词句与触发时码由主负责人给定；这里只规定实现接口。
3. 新布局以 `LAYOUTS` 注册，所有状态由 `c.local` 和固定事件表计算；图像通过 `PHOTO.has/plate`，不要复制 `renderAt` 或加跨帧变量。消息/UI 区与主体图层分开，保持所有字幕相关内容在 y<778。
4. 静帧抽查 `t0`、每个事件前后、转接点和末帧；对同一时刻重复调用，确认像素逻辑一致。通过后再导 8–12 秒短片，检查消息是否有“出现—写入—发送—堆叠/滚动—状态改变”的清楚过程，且插画始终是主视觉的一部分。
5. 若过程只剩整图推拉或装饰线跑动，打样未达标；需增加与内容相关的状态动作或真实前景切层，再交主负责人评审。
