# V4 + 卷轴段替换（v4scroll）

2026-11-13 · 范围：`out/前奏到杜甫前_同行慢灯_v4.mp4` 原片一格不改，只把 **14.99–19.945 s** 这一段换成 `ScrollUnfold`（桌上手卷展开 + 墨迹洇出长安）。

## 1. 交付物

| 文件 | 大小 | 说明 |
| --- | --- | --- |
| `out/前奏到杜甫前_卷轴替换_v4scroll.mp4` | 15,176,626 B | 34.05 s / 1920×1080 / 30 fps / AAC 48 kHz stereo 317 kb/s |
| `out/前奏到杜甫前_同行慢灯_v4.mp4` | 12,616,912 B | 原片，md5 `dbc3ebbbe6b2868d283aa0babcebe6f3`，**未改动** |
| `out/v4scroll_check/` | — | 抽帧证据（f15.2 / f17.4 / f18.6 / f19.6 / f20.4 / f27.5 / f31.0，以及 frame540/588/585/596/597/598） |

音轨：`mean_volume: -22.0 dB / max_volume: -6.4 dB`，与原片一致（同一 `<Audio>` 未动）。

## 2. 改动边界（只动了这一处）

`film/motion-v2/studies/chorus-process/src/ChorusProcessDemoV4Scroll.tsx` = V4 的逐字副本，唯一差异：

```tsx
const SCROLL_START = 14.99;
const SCROLL_END   = 19.945;   // = JourneyProcess 的 SONG_A 窗口
const SCROLL_FADE  = 0.22;

const scrollIn  = smooth((time - SCROLL_START) / SCROLL_FADE);
const scrollOut = 1 - smooth((time - (SCROLL_END - SCROLL_FADE)) / SCROLL_FADE);
const scrollMix = Math.min(scrollIn, scrollOut);

// 原 JourneyProcess 在这一窗里按 scrollMix 让位，其余时间完全等于 V4
<div style={{ opacity: (time < PROCESS_CUTOFF ? 1 : 0) * (1 - scrollMix) }}>
  <JourneyProcess />
</div>

{time >= SCROLL_START && time <= SCROLL_END && (
  <div style={{ opacity: scrollMix }}>
    <ScrollUnfold start={SCROLL_START} end={SCROLL_END}
      openSeconds={2.55} inkDelay={0.9} inkSeconds={1.9}
      width={1620} push={0.06} fadeIn={0} fadeOut={0}
      background={null} vignette={false} desk="assets/lamp_desk_ink_v3.png" />
  </div>
)}
```

其余六层（`LampIgnitionDemo` / `NightClock` / `UnsentThought` / `AlleyLampSlow` / `CompanionWalkV4` / `Dufu`）与字幕层一行未改。
GPT 的 `ChorusProcessDemoV4.tsx`、`render.mjs`、`Root.tsx` **均未被改动**；新增的是 `ChorusProcessDemoV4Scroll.tsx` + `RootV4Scroll.tsx` + `index-v4scroll.ts` + `render-v4scroll.mjs`。

## 3. 三处必须修掉的问题（都实测过）

### 3.1 画心露出矩形色带（根因：multiply 被隔离组吃掉）

`ScrollUnfold` 里画心 img 原本自己带 `mixBlendMode:'multiply'`，但它被一个带 `opacity/filter/transform` 的 div 包着 —— 那个 div 自成隔离组，里面的 multiply 只跟透明底混合，于是《长安》原图的米黄底原样盖在卷轴上，纸上出现一块冷白硬矩形（**m07932 用户截图就是这个**）。

修法：`mixBlendMode` 移到包裹层（它与纸张 img 是同一 stacking context 的兄弟）。

### 3.2 改了 multiply 仍留一圈亮边（根因：原图底色不是白）

实测 `changan_ink_v2.png` 边缘像素 `(233,196,161)`，而卷轴纸面 `(199,167,119)` —— 乘算后色差依然显形。

修法：`feColorMatrix` 做白场归一，系数 `255/纸色`：`1.094 / 1.301 / 1.584`，把纸色除成纯白，乘算时等于不着色、只留墨。

### 3.3 上下仍有「无纸纹平带」（根因：原图自带的淡雾地脚）

纸色归一后，原图上下自带的雾状渐层乘算仍不变色，在带纹理的卷轴上读作一块发白的平板。

修法：径向遮罩之外再叠一条竖直渐变（头部 12% / 尾部 16% 淡出），`mask-composite: intersect`。

## 4. 交接点检查（逐帧验证）

| 时刻 | 帧号 | 观察 |
| --- | --- | --- |
| 14.99 | 450 | 与原片几乎重合（都是暗桌面 + 未展开的卷），衔接无跳 |
| 15.2–19.5 | 456–585 | 卷轴自左向右展开（`easeOutQuart`，2.55 s 展完），墨迹 15.9 s 起在纸面洇出长安 |
| 19.6–19.9 | 588–598 | `scrollMix` 收坡，卷轴与 JourneyProcess 交叉 |
| ≥ 19.945 | ≥ 599 | 完全回到 V4 原画面（NightClock 的「深夜」段） |

亮度扫描（中央带均值）确认切点位置正确：**555–592 帧恒定 116.2，593–598 单调下降到 105.2，599 起稳定 104.0** —— 与 `SCROLL_END = 19.945`（第 598.35 帧）吻合，没有整体时间偏移。

## 5. 已知取舍

- 19.945 之后的 JourneyProcess 是该窗口的最后一场（面碗「深夜」），所以收坡时是「卷轴上的长安」→「桌上的面碗」，内容上是换场不是同场延续。若观感突兀，两条路可选：① 把 `SCROLL_END` 提前到 18.0 左右（只覆盖长安一段）；② 反过来把 JourneyProcess 在这一窗里彻底关掉、卷轴一直演到 21.614。
- `ScrollUnfold` 的墨图固定是 `changan_ink_v2`；若想让卷轴依次洇出「长安 → 茅屋 → 面碗」三景，需要给它加 `inks: string[]` + 分段时间轴。
