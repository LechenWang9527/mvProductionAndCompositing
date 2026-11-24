# 风景分层动画打样验收

## 源码边界

- 当前旗景在 [`film/src/liubang_sequence.js`](../../film/src/liubang_sequence.js#L179) 中以 `PHOTO.plate(WIND, 0, 0, W, H, ...)` 绘制整张画面，`progress` 只把整幅画从原尺寸推到 1.024 倍；没有独立旗面/旗杆层，无法据此保证旗根固定、杆体刚直而旗尖摆动。
- 当前茅屋在 [`film/src/dufu_sequence.js`](../../film/src/dufu_sequence.js#L168) 中同样作为全画幅原图绘制，风线只经过插画上方留白。屋脊没有独立透明蒙版或运动层；若再叠一张屋顶层，会形成源码注释明确避免的“第二座屋”。因此边缘白晕、重屋檐和房屋重复必须在真实分层合成中检查。
- 旧版 [`film/src/scenes.js`](../../film/src/scenes.js#L726) 的旗布用两条正弦曲线分别生成上下边缘，但未见旗杆约束；旗上文字另用正弦位移。该实现不能证明布根固定或文字随同一块布自然变形。可复用的运动参考是 [`MultiplaneReal.tsx`](../../ref_drawai/lib/motion/shotcraft/upstream/demos/camera/depth-layer-moves/MultiplaneReal.tsx#L42)：统一 `driveAt` 位移按远/中/近层乘 0.35/0.7/1.4，属于速度梯度方法，不是旗布或山脊蒙版实现。

## 8 秒验收

- 在真实 8 秒、30fps 合成视频中检查开头、2 秒、4 秒、6 秒和结束前一帧；单张 PNG/静帧通过不算动画验收。
- 山脊透明边缘无白边或晕圈；画面无重复屋檐/房屋。天空、远山、近景按层产生可辨的差速，蒙版边缘移动时不撕裂、不露底。
- 旗杆保持直且稳定；旗根锚在杆上不滑动，旗尖有可见布料运动。不可用整幅画摇动替代分层运动。
- 三行字幕由 [`film/src/subtitles.js`](../../film/src/subtitles.js#L6) 固定在 y=842/898/946，panel 为 y=778–974；整段保持位置不动、无场景层覆盖或裁切。
