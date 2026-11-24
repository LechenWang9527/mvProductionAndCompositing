# 当前状态（给用户看的一页摘要）

## 参考仓库
`Nyankomintsu/world-execute-me-lyric-mv` 已 clone 在 `ref_mv/`，方法论（renderFrame(t) 纯函数 /
playwright 逐帧 / ffmpeg 管道 / 四色状态调色板 / 字体三分工 / 闪动安全检查）已全部拆解进
`docs/METHODOLOGY.md`。它的 13 个场景是为《world.execute(me);》写死的，换歌必须重写，
所以本片另建 `film/` 引擎，只沿用它的契约。

## 现在跑到哪
- 分镜：`film/docs/STORYBOARD.md` 87 刀 / 305.9 s，切点落在歌词行首与拍点上。
- 引擎：`film/data/timeline.js`（真实音频分析）+ `film/data/shots.js`（87 镜）
  + `film/src/core.js`（调色板/纹理/歌词逐字/后期）+ `film/src/layouts.js`(28 种版式)
  + `film/src/layouts2.js`(6 种补充) + `film/src/shotfilm.js`(87 镜调度)。
- 渲染：`node film/render.mjs --out out/film_v2.mp4 --audio "The OGs 视频音轨.mp3"`

## 关键工程结论（实测）
| 项 | 数据 |
|---|---|
| PNG 截图（纸纹段） | 635 ms/帧 |
| JPEG q95 截图（同帧） | 44 ms/帧 |
| 全片渲染（PNG，旧） | 预计 116 分钟（跑到 t=46 时实测降速到 469 ms/帧） |
| 全片渲染（JPEG，新） | 52 ms/帧 → 约 16 分钟 |
| 输出 | 1080p60 / H.264 crf20 / AAC 192k |

## 工具盘点结论（docs/TOOLS.md，均有命令与原始输出）
- **没有**现成开源项目能直接产出中文逐句歌词 MV；immersive-audio-player 最像但只有 UI、没 CLI。
- Remotion 4 能用（300 帧 31 s）但比自建引擎慢，且要改入口。
- librosa 1.0 可用，实测 `tempo=129.199 / 647 beats / 1214 onsets`——反证本机 numpy 分析给的
  64.6 是半速；两者对 onset 的拟合分几乎相同（1.9786 vs 1.9508），库不会替你判定正拍。
- aubio（无 py3.12 wheel）、madmom（sdist 构建断）装不上。
- SDXL 在 6 GB 上必须 sequential offload，速度掉到分钟级，不值得；本片走纯程序化。

## 未完成 / 待定
- 87 镜里有 18 镜共用 `chartGrow`，需要再换掉一批重复版式。
- `giveMeFive` 的掌形刚改成连通轮廓，还没复查最终帧。
- 148.04–192.34 s 的抗闪白区间需要跑一次亮度检查确认。
