# 前奏可摘取模板：源码调查

调查范围：`ref_drawai/lib/motion/shotcraft/upstream/demos`；Shotcraft demo 是 React/Remotion、30fps、1920×1080 的确定性逐帧组件（目录 README）。当前工程只 vendored `film/motion-v2/src/vendor/shotcraft/{Polish,Look}.tsx`；上游来源和 Apache-2.0 pin 见 `film/motion-v2/src/vendor/shotcraft/UPSTREAM.md`。以下是源码机制摘取点，不是对前奏创意的定案。

## 1. 俯冲镜头：DroneDiveLanding

- 源码：[DroneDiveLanding.tsx](../../ref_drawai/lib/motion/shotcraft/upstream/demos/camera/space-camera-moves/DroneDiveLanding.tsx)，组件 `DroneDiveLanding` / `Scene`，时长 105f。
- 时序：0–24f 上帝视角建立并预提；24–49f cubic 加速俯冲；49–69f quintic 缓降；69–105f 静止 hold。
- 真实联动：一个 `travel(frame)` 进度同时驱动 `rotateX(72°→0°)`、缩放 `0.42→1.35`、平移、页面离地高度与接触影；地面点阵提供速度参照。不是整图单独缩放淡入。
- 依赖：Remotion/React；已 vendored 的 `Polish`（`Backdrop/EASE/Grain/mix/ramp`）；未 vendored 的 `FakeDashboard`；`@remotion/motion-blur`（当前 `motion-v2/package.json` 未列）。
- 可摘机制：保留 `travel()` 的预备—主行程—落地分段，以及同一进度统领相机几何；把 `Scene` 的 dashboard 替换成 demo 的世界层和明确的落点对象。
- 限制：这是 CSS perspective 下的单平面 2.5D 俯冲，并非自由 3D 穿越；`HERO` 对准值与地面、页面尺寸都按 FakeDashboard A 标定。原样拷贝会缺依赖。

## 2. 字符沿路径进入标题：TextOnPath

- 源码：[TextOnPath.tsx](../../ref_drawai/lib/motion/shotcraft/upstream/demos/typography/type-assembly-moves/TextOnPath.tsx)，组件 `TextOnPath`，时长 160f。
- 时序：0–16f 网格/刻度出现；4–64f 字符沿增长曲线逐个推进；64–72f 整句停在线上；72–110f 每字错峰抬升、旋转归正并移入标题位置；92–110f 副文案/数值牌接力；108–160f hold。
- 真实联动：Bezier 曲线先采样 300 段建弧长表，再反查字符弧长位置；字符沿切线旋转，车头与曲线同步增长，抵达后逐字从路径姿态抬起归位。
- 依赖：React DOM 字宽测量（`useLayoutEffect`/refs/state）；Remotion；已 vendored 的 `Polish` 与 `Look`（`Stage/TextReveal/type/springAt` 等）。没有额外图片素材。
- 可摘机制：复用 `bez/tangent/ARC/tAtS` 与逐字 `headS - centers[i]` 定位，再单独用错峰 `ramp` 完成抬起、横移、旋转收敛。
- 限制：文案、曲线和字号按 1920×1080 的英文大写 20 字串设计；换字体或文案须重新测字宽、字间距与落位。DOM 测量要求浏览器挂载后执行。

## 3. 输入框形变并由零件接力成标志：InputMorphsIntoLogo

- 源码：[InputMorphsIntoLogo.tsx](../../ref_drawai/lib/motion/shotcraft/upstream/demos/outro/ui-to-brand-morph/InputMorphsIntoLogo.tsx)，组件 `InputMorphsIntoLogo`，时长 168f。
- 时序：0–20f 光标到发送键；21–32f 文案飞出；28–40f 墨色从按键处灌入；30–60f 输入框五个几何量随同一 spring 收成标志竖笔；58/72/86f 三块依次落下；108–128f 标志移位缩小；114–140f 字标/口号逐字逐词升起；140–168f hold。
- 真实联动：`m` 同时插值输入框的 x/y/w/h/r；目标槽位虚线提前勾出，三块 SVG/几何件错峰落下并按速度压缩回弹；拼齐后替换为完整路径以消除接缝，再接字标层。
- 依赖：Remotion/React；已 vendored 的 `Polish` 与 `Look`；未 vendored 的 `Brand.tsx`（`BRAND/MARK_PATHS/PITCH`）。没有外部图像或额外 npm 依赖。
- 可摘机制：保留单一 spring 控制“输入物→目标笔画”的形变，再用 `DROPS` 驱动目标引导线、零件落体、整标志归并、标题揭示的分层时序。
- 限制：它位于 upstream `outro/`，当前是视频-shotcraft 品牌定制；输入框尺寸、`STEM/PIECES` 与品牌路径强耦合。移植时需替换标志几何/字文案并重算槽位，不宜直接搬整组件。

## 交接结论

三份源码都提供了可直接查阅的真实运动链。当前 Shotcraft vendor 目录没有 `Fixtures.tsx` / `Brand.tsx`，motion-v2 依赖也未列 `@remotion/motion-blur`；应摘取上述时序/几何机制到独立前奏 demo，再接现有 Remotion 工程。本调查未改生产代码，也未安装或渲染。
