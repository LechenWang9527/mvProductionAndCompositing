# IMG01 / IMG02 接入修复记录

## 根因证据

两张源图是有效 PNG：`IMG01_dufu.png` 为 1254×1254，`IMG02_hut.png` 为 1536×1024，文件头均为 PNG 签名 `89504e470d0a1a0a`。直接查看也确认它们分别是杜甫木刻像和无人物茅屋，不是文本占位或 LFS 指针。

失效发生在加载路径。`film/media/gen/gen_manifest2.json` 的条目只有 `id` 和 `file`，没有 `dir`。加载器把这些条目合并进照片清单后，因为 ID 已存在，不会走“缺条目时注册 `media/gen/`”的后备分支；随后无目录条目按 `media/photos/` 拼路径。修复前的 Chrome 记录显示：

| 请求 | 响应 | 运行态 |
|---|---|---|
| `media/photos/IMG01_dufu.png` | 200，`text/html`（静态服务的 index fallback） | `PHOTO.has('IMG01_dufu') === false` |
| `media/photos/IMG02_hut.png` | 200，`text/html`（静态服务的 index fallback） | `PHOTO.has('IMG02_hut') === false` |

因此 `PHOTO.missing` 包含两张图，而 `shotfilm.js` 的 `insetWindow()` 在绘制前就因 `PHOTO.has()` 为假返回。图层顺序不是这次“完全看不到图”的根因。

另有两个显示问题：杜甫原先被挂在 #3（15–21.6 秒），而歌词对应镜头是 #6（30–33.1 秒）；通用窗固定为 292×168，原计划透明度分别为 0.42 和 0.5，作为主视觉偏小偏淡。

## 修改

- `film/src/photo.js`：manifest 条目没有显式 `dir` 时，按已知 IMG 槽位补 `media/gen/`，普通照片仍使用 `media/photos/`。新增可选的印刷处理参数；两张已带木刻排线的素材使用更清晰的墨纸对比，不再叠第二层网点，只加少量纸纹。
- `film/src/shotfilm.js`：移除 #3 的 IMG01；将杜甫接到 #6、茅屋保留在 #8。两张图都以 1.0 alpha 出现，使用 0.28 秒淡入、镜头结束前 0.22 秒淡出；杜甫延后 0.63 秒开始显影，避开旧歌词残留。插图窗现在支持逐镜设置尺寸与位置。

当前是接线与风格处理的试制版：#6 仍保留原搬迁箱构图，#8 的大茅屋图会覆盖一部分原屋架线稿。两者已证明资源能进入实际画面，但这些旧版式叠放不是最终构图；连续样段应按图文关系重新整合。

## 验证

修复后浏览器运行态：IMG01/IMG02 均不在 `PHOTO.missing`，`PHOTO.has()` 均为 `true`；请求路径为 `/media/gen/IMG01_dufu.png` 和 `/media/gen/IMG02_hut.png`，两图实际解码并出现在抽帧中。

使用现有脚本抽取相关帧：

```text
node film/stills.mjs 17 30.15 30.75 31.5 33 36.9 37.18 39
no page errors
```

| 帧 | 核对内容 |
|---|---|
| [t017.00.png](../../out/stills/t017.00.png) | #3 不再提前出现杜甫 |
| [t030.15.png](../../out/stills/t030.15.png) | 杜甫尚未显影；镜头转入时不硬贴大图 |
| [t030.75.png](../../out/stills/t030.75.png) | 杜甫正在短淡入 |
| [t031.50.png](../../out/stills/t031.50.png) | 杜甫插画清楚可见；画面主体底部止于 y=780 |
| [t033.00.png](../../out/stills/t033.00.png) | 杜甫插画在镜头切换前淡出 |
| [t036.90.png](../../out/stills/t036.90.png) | 茅屋在 #8 起点开始显影 |
| [t037.18.png](../../out/stills/t037.18.png) | 茅屋插画完成淡入；图框底部 y=753 |
| [t039.00.png](../../out/stills/t039.00.png) | 茅屋作为清晰主体可见，字幕区保持留空 |

字幕安全区在 y≥780；本试制插图均止于该线或更高。未运行全片渲染。
