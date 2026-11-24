# 副歌段本地动效源码核查

范围：仅为 14.99–29.993s 开唱至杜甫前 demo 核对可复用动画；不定最终创意。

## 技能与检索

- [`ref_prompts/skills/code-animation-prompts/SKILL.md`](../../ref_prompts/skills/code-animation-prompts/SKILL.md)：要求用 `styles.py search` 检索目录，再按需读选中提示词/静帧；提示词不能替代成片源码证据。
- [`ref_drawai/skills/mg-code-video/SKILL.md`](../../ref_drawai/skills/mg-code-video/SKILL.md)：先 `shotcraft_search`，再用 `cardId+styleKey` 读 recipe 与 demo 源码。
- `shotcraft_search` 在此执行环境未作为 MCP 工具暴露；`ref_drawai/src/index.js` 注册它，底层检索是 `src/shotcard-core.js::searchShotCards`。
- 我用该共享检索函数读取目录、筛选卡片，并直接读取 recipe 和 TSX；未安装依赖或改动源码。

实际检索命令（工作目录 `ref_drawai`）：

```sh
node --input-type=module -e 'import{readFileSync}from"node:fs";import{searchShotCards}from"./src/shotcard-core.js";const c=JSON.parse(readFileSync("./src/motion/shotcraft/catalog.json","utf8"));for(const q of["圆环","retype","bezier"]){console.log(q,searchShotCards(c,q).map(x=>`${x.cardId}/${x.styleKey} -> ${x.demo}`).join("\n"))}'
```

卡片二次精确筛选并读取 recipe/demo（同目录）：

```sh
node --input-type=module -e 'import{readFileSync}from"node:fs";import{searchShotCards}from"./src/shotcard-core.js";const c=JSON.parse(readFileSync("./src/motion/shotcraft/catalog.json","utf8"));for(const[id,key]of[["circle-match-iris","circle-match-iris"],["typewriter-moves","error-retype"],["bezier-source-converge-merge","bezier-source-converge-merge"]]){const h=searchShotCards(c,id).find(x=>x.cardId===id&&x.styleKey===key);const card=c.cards.find(x=>x.id===id);for(const p of[card.source,h.demo])console.log(id+"/"+key,"src/motion/shotcraft/upstream/"+p,readFileSync("./src/motion/shotcraft/upstream/"+p,"utf8").length)}'
```

检索命中并实读路径：

- `circle-match-iris/circle-match-iris` → `src/motion/shotcraft/upstream/references/shots/transition/circle-match-iris.md` + `src/motion/shotcraft/upstream/demos/transition/circle-match-iris/CircleMatchIris.tsx`。
- `typewriter-moves/error-retype` → `src/motion/shotcraft/upstream/references/shots/typography/typewriter-moves.md` + `src/motion/shotcraft/upstream/demos/typography/typewriter-moves/TypewriterErrorRetype.tsx`。
- `bezier-source-converge-merge/bezier-source-converge-merge` → `src/motion/shotcraft/upstream/references/shots/ui-entrance/bezier-source-converge-merge.md` + `src/motion/shotcraft/upstream/demos/ui-entrance/bezier-source-converge-merge/BezierSourceConvergeMerge.tsx`。

## 源码状态链

- **计时盘（165f/30fps）**：`CircleMatchIris.tsx`：榜单与头像出现 → 18/30f 两次脉冲 → 47–75f 实心头像扩成圆环（r≈32→300）并撑开 iris → 60–118f 环弧与中央百分比同步升至 87% → 118–165f 慢转/呼吸 hold。它是进度计时盘，不是带时针的钟；检索 `clock`、`timer` 均为 0 命中。
- **输入后删除改写（160f）**：`TypewriterErrorRetype.tsx`：f2 起每字 2f 打出 `just a slideshow` → f32–48 犹豫闪标 → f48 起每 1.5f 退格删去后 11 字，保留 `just ` → f68 起每 1.5f 打出替代句 → f96–110 强调线完成，f115 光标熄灭，之后静止。该 demo 是居中等宽字行，不是聊天 composer。
- **UI 输入补充（73f）**：`src/motion/shotcraft/upstream/demos/interaction/type-and-filter/TypeAndFilter.tsx` 有真实搜索框打字、停顿、筛选、点击；每字 3f，过滤 f42 起，点击 f58；没有删除段。要表现聊天输入再退格，必须把它的输入框与上条退格状态机组合，不能声称库中已有一体化聊天 demo。
- **路径/节点汇流（168f/30fps）**：`BezierSourceConvergeMerge.tsx`：四节点错峰弹入 → 四条 Bezier 路径错峰 draw-on → 数据包沿各自弧线循环 → f≈57–124 节点按曲线汇入同一中心、后 1/4 行程由 15px 缩至 0 → 接收脉冲 → f≈131–151 路径反向擦除并平移收尾。

## 边界

- `styles.py search` 依技能要求尝试运行，但 WindowsApps `python.exe` 不可启动，`py -3` 配置的 `E:\Python 3.10\python.exe` 也无法启动；未安装 Python。以上 Shotcraft 源码检索独立成功。
- 本核查未渲染、未安装，也未改生产/study 源码；只新增本交接文件。
