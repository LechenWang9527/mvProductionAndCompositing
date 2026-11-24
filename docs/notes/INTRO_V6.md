# 前奏 → 杜甫前 34 s 重做（IntroV6）交付说明

> 参考基准：`out/前奏到杜甫前_小巷路灯_v3.mp4`（GPT 的 chorus-process V3，33.05 s，1920×1080 30fps）
> 本轮产物：`out/前奏到杜甫前_v6_重做.mp4`（34.05 s，1920×1080 30fps，h264 High yuv420p bt709 + AAC 48k stereo）
> 工程：`film/motion-v2/studies/intro-v6/`（独立 study，不覆盖 chorus-process）

## 1. 为什么「乱」—— 根因

V5 是**绝对定位图层堆叠 + 透明度交叉淡化**，不是镜头切换：

```tsx
<LampIgnitionDemo style={{opacity: 1 - alleyIn}} />
<JourneyProcess     style={{opacity: time < 23.357 ? 1 : 0}} />
<NightClock /> <UnsentThought /> <AlleyLampSlow /> <RoadToDistance />
// 30.4 s 再叠 <Dufu /> + <SubtitleTrackEditorial />
```

任何一帧都在叠三到五个全屏层，观众看到的「转场」其实是两个画面同时在淡入淡出。运镜也只有
`src/editorial/Shot.tsx` 里那档：`scale 1.025→1.06`、`x ±25–50px`，等于画面基本静止。

**改法**：按镜头（shot）组织。每镜只有一个主动体 + 一套真 2.5D 相机关键帧 + 一个带方向延续的转场。
13 个镜头，同一时刻最多两个层，且是同一件事的进出。

## 2. 用了仓库里的什么

按用户要求（m07689）动画必须来自 `ref_drawai` 的 shotcraft，不许手写 CSS 变换冒充。

| 来源 | 用到的地方 |
|---|---|
| `demos/_fixtures/Polish.tsx` + `Look.tsx` | vendor 到 `src/vendor/shotcraft/`，用 `Grain / Vignette / SpeedBlur / velocity / LOOKS / Dust` |
| `strike`… `camera/depth-layer-moves/MultiplaneReal.tsx` 的多层差速思路 | `DepthPlate`（后层模糊放大 1.04 + 前层清晰，双 Camera 共用一套 keys） |
| `Polish.tsx` 的 `velocity()` | `Camera` 的中心差分求速 → `SpeedBlur`，S6 横移 / S8 甩镜的真运动模糊 |
| `transition/print-texture-transitions/InkBleedReveal.tsx` | 参数化为 `src/repo/InkBleed.tsx`，S13 进杜甫段 |
| `LOOKS.ember` / `Dust` / `Grain` | 全片色调与颗粒 |

## 3. 13 个镜头（时间轴沿用 V3）

| # | 时间 | 画面 | 运动 / 转场 |
|---|---|---|---|
| S1 | 0–2.21 | 暗桌面 + 未点的灯 + 长卷 | 缓推 s 1.12→1.24 |
| S2 | 2.21–4.99 | 灯亮 | 曝光 0.4→1，灯芯光晕随 `FLAME` 归一化坐标 |
| S3 | 4.99–9.64 | 桌面手卷展开，画心洇出长安 | 卷轴按真实比例 1780×593，`clipPath` 自右向左揭开 + 26px 前沿窄影 |
| S4 | 9.64–12.42 | 墨扩散吃满全屏 | radial ink bloom r 8%→118%，s 1.78→1.12 |
| S5 | 12.42–16.62 | 长安城 | 推近 + 四盏城灯按拍依次点亮 |
| S6 | 16.62–19.95 | 横移到茅屋 | 世界层横移 + `SpeedBlur`（速度由位移差一帧求出） |
| S7 | 19.95–21.61 | 泡面 | 相机推近 + motionBlur |
| S8 | 21.61–23.36 | 战场 | 甩镜 whip 240→0，blur 7→0，`SpeedBlur amount 0.42` |
| S9 | 23.36–24.66 | 战阵沉底 → 白纸盖上 | 白纸 gradient translateY 100%→0 |
| S10 | 24.66–26.62 | 夜巷两人同行 | 8 帧步态精灵相位错 4 帧，size 330→268 |
| S11 | 26.62–27.93 | 巷中路灯 | 灯点亮，`ALLEY_LAMP` 归一化坐标 |
| S12 | 27.93–29.99 | 灯碗/灯芯特写 | s 1.06→1.60 |
| S13 | 29.99–34.01 | 墨渗揭示杜甫 | `InkBleed` p=E.io(lt/1.25)，圆心 (1190,454) |

## 4. 音画同步（有实测证据）

`audit_sync.cjs` 把 13 个切点分别对拍点表（`analysis/features_real.json`，329 拍）与歌词行起点表
（`lyrics/og_timing.json`，167 行）求最近距离：

- 13 个切点里 **12 个**在 60 ms 内咬住拍点或歌词行起点；
- 有声前的 5 刀（0/2.21/4.99/9.64/12.42）全部落在拍点上，误差 2–4 ms；
- 有声后的 8 刀（16.62…29.99）全部落在歌词行起点，误差 0–5 ms。

唯一例外是 S13→片尾 34.01 s（超出本段范围，属于下一段衔接）。

## 5. 本轮修掉的问题

1. **S2 灯被推出画面**：`lamp_desk_ink_v3.png` 灯焰在 nx≈0.24 极靠左，推近即出画 → 相机改为 x 430→580、s 1.22→1.38。
2. **S3 卷轴段曾整段废掉**：把 2172×724 素材硬拉到 2200×733 铺满，只剩一条空白纸带 → 改为真实比例放在桌面底上，画心 `multiply` + 径向羽化贴纸面。
3. **墨渗的墨压在新景上面**（读作「墨盖住纸」）→ 恢复上游绘制顺序：湿晕 → 墨边/墨芯 → 新景透 mask 显影；墨芯半径回到 `r+lead*0.45`。
4. **未揭示区是近黑**，纸边锯齿读作「纸被烧穿的破洞」→ under 改为暖褐灯下桌面 + 0.42 screen 暖光，墨环不透明度 0.34/0.62 → 0.16/0.28。
5. **字幕压图读不出来**：`SubtitleTrackEditorial` 的 tone 原按整段给（29.99 前一律 night 浅字），但 16.62–21.61 三镜是纸白/中间调 → 改为**逐镜 tone**（`TONE_AT`），亮纸镜用 paper 的深墨 + 纸色渐变，暗镜仍 night 并加暗衬底。
6. **S13 墨渗那 1 秒深墨字压在暗底** → paper tone 迟滞到 31.1 s（此时纸已铺到字幕带）。
7. `staticFile()` 双重前缀崩溃 / 灯焰画在屏幕坐标不跟镜头 / `SpeedBlur` 速度算式错（`(1-settle)*常数` 在 settle=0.99 时仍大模糊）—— 均已修。

## 6. 复现

```bash
cd film/motion-v2/studies/intro-v6
node render.mjs stills "0.9,4.2,11.9,18.6,25.4,30.7"   # 抽静帧
node render.mjs video                                  # 出片 → out/motion-v2/studies/intro-v6/IntroV6.mp4
node audit_sync.cjs                                    # 音画同步审计
```

## 7. 尚未做

- 30.4 s 往后（杜甫段之后到全片）仍走 GPT 的 motion-v2 原路径，本轮未动。
- LED 8192×1152 的最终重排没做（当前 1920×1080 是审看版；禁止非等比拉伸）。
