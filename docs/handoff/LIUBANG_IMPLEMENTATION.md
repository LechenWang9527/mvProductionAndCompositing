# 刘邦与战争段首版接入说明

## 接入映射

新增模块 `film/src/liubang_sequence.js`，仅注册 `LAYOUTS.liubangPortrait` 与 `LAYOUTS.warExperience`，依赖现有 `K`、`LAYOUTS`、`PHOTO`。在共享入口中放到 `layouts*.js` 之后、`shotfilm.js` 之前；分镜映射：#20–22 → `liubangPortrait`，#26–28 → `warExperience`。时间来自 `film/data/shots.js`：#20 90.1–94.9、#21 94.9–100.6、#22 100.6–104.0、#26 112.0–113.5、#27 113.5–116.9、#28 116.9–119.4 秒。

PHOTO 清单需显式登记：

```json
{ "id": "LIUBANG_PORTRAIT_V1", "file": "liubang_portrait_v1.png", "dir": "media/candidates/" }
{ "id": "BATTLE_SCENE_V1", "file": "battle_scene_v1.png", "dir": "media/candidates/" }
```

人像沿用同一素材和构图；#21–22 只添静置酒爵与桌案，不伪造举杯/倒酒。#26–27 战场原图满幅作主体、alpha 0.92 轻压暗部；7 在112.0秒出现，冒号跟112.935秒“输”，6 跟113.153秒“六”。#28仅在118.607秒刘字头显出68px刘邦标签与人像，不再标年龄、亭长身份或下场状态。新增 `windExperience` 接#32–34（127.6–136.9秒）：战场原图低密退远景，旗杆/整面旗布与左向右风轨接力；129.9秒后旗线贯穿画面，杜甫与刘邦墨线小像分列，136.9秒前收至一盏暖灯。无歌词、柱图、粒子或人物姿态变形；程序线条/静物止于y<780。

## 检查与限制

`node --check film/src/liubang_sequence.js` 通过。独立抽帧脚本未能运行；共享接线后由主线程按既有 `node film/stills.mjs` 入口验收。

提权验证被 auto-review 拒绝，未再尝试提权。调用参数：`exec_command(cmd="node out/liubang_review/test_render.mjs", workdir="E:\\新建文件夹\\实习\\MV", yield_time_ms=30000, sandbox_permissions="require_escalated", prefix_rule=["node","out/liubang_review/test_render.mjs"])`；理由参数为“验证独立页面确实内存注入新脚本和候选资源，并检查渲染前的布局注册行为。”原拒绝信息：`This action was rejected due to unacceptable risk. Reason: 验证脚本会启动本地服务器并写入独立 out/liubang_review 帧文件；但当前只读权限及禁止审批提权与该写入/提权执行不符。 Do not bypass this rejection through a workaround or indirect execution.` 未尝试替代途径；按主负责人的安排，由整合组接线后通过共享渲染入口统一验收。
