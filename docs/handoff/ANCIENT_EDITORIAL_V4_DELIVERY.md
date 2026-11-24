# AncientEditorialV4 交接草稿

## 与 V3 的差异

- V3 `AncientEditorialV3` 保持默认 `enhancedMotion=false`；新增 `AncientEditorialV4`，规格为 4119 帧、30 fps、1920×1080，默认开启增强动态。V3 成片与历史 QC 未覆盖。
- 127.6–133.52 秒风景段改用天空、地景、旗帜分层；旗布作局部形变，旗杆位移场固定。若 `editorial_clips.json` 中该段 Gemini 视频槽有实际 `src`，仍优先沿用原 Painting 视频路径。
- Opening 与 Reprise 的油灯火焰和光照增加轻微动态；V3 默认不启用。V4 的订单季节点按四个实际坐标对齐。
- 主实现位于 `film/motion-v2/src/visual/WindLayers.tsx`；study 入口与 V4 Ending 共用该模块。

## 源码保全与规格

- 修改前的原文件快照及路径/SHA-256 清单：`out/motion-v2/source-snapshots/AncientEditorialV3/`。
- V3 冻结清单描述的是 V3 导出时的源码状态；接入 V4 后，它与当前共享源码不再完全相同。V3 当时 58 项 SHA-256/大小匹配结论仅适用于那次导出；可从上述快照恢复，旧 MP4 保持完整。
- V4 时长为 4119/30 = 137.3 秒，画布 1920×1080。此规格仅供 16:9 审看，不是 LED 终稿；最终屏幕映射与版式仍待确认。
- 原曲组件、歌词文本与源时间数据保持原样。

## 尚待完成

- V4 渲染进程已 exit 0。主产物 `out/motion-v2/AncientEditorialV4.mp4`，69,266,233 字节，SHA-256 `92BE4FFD35252524DE73E34561547D6937EA808356C253B78CFCF582D0C4DAB1`；交付副本 `out/古代_demo_two_水墨动态版_20261112.mp4` 已核对同大小、同 SHA-256。全片画面解码与 MP4 关键帧 QC 正在验收，尚无整体 PASS 结论。
- 音轨对比记录在 `out/motion-v2/AncientEditorialV4.audio-comparison.json`：V3/V4 均解码为 48 kHz stereo signed 16-bit PCM，26,370,048 字节，SHA-256 `E6A70878FAFD73072750A024E6CD2937B76E9211F846EBDEED6F7ACB65FBFAD4`，解码 PCM 逐字节一致。
- 真实 I2V 视频回片、最终 LED 制作方式与屏幕适配、逐字歌词/人声试听对齐均待后续完成。
