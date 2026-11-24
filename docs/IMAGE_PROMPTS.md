# IMAGE_PROMPTS — 交给 image2 出图的提示词包（8 槽位）

> 用法（3 行）：先读 §2 全局风格块，一字不改地贴在每条 prompt 前面；再按 §3 取某个槽位的 `prompt_en`，一次批量出 8 张（或先只出 §1 表里的第一批 4 张）；出图后改名 `P01.jpg…P08.jpg` 塞进 `film/media/photos/`，程序自动取用，缺哪张就退回纯图形版，不会黑屏。
>
> 机读版：[prompts_image2.json](notes/prompts_image2.json)　|　参考帧：[refs/](refs/)（`contact_sheet_style.jpg`、`contact_sheet_slots.jpg`、`style_ref/`、`slot_frames/`）
>
> **关键前提（务必先看 §6）**：参考帧只用来定色调、光向、留白位置；你要生成的，是**那一帧里空着、等着被插进去的那张照片**，不是把这一帧复刻出来。帧里的横线、红条、页脚编号、大字、蓝图网格，全由程序自己画。

---

## 1. 为什么是这 8 张

全片 87 个镜头，绝大多数是**程序画的图形**（灯格、工牌、折线、木刻字、账本、印章、终端）——这是片子的骨相，不能拿照片替掉。缺的只是「材质和空间」：桌面、胶料、产线、路面、纸、工牌塑料壳、金属招牌。

8 个槽位分两批：

| 批次 | 槽位 | 理由 |
|---|---|---|
| **第一批 4 张** | P01 桌面、P04 产线、P05 黄昏路、P08 马牌招牌 | 现在这几处一眼能看出「没东西」，补上立竿见影 |
| **第二批 4 张** | P02 胎断面、P03 混炼、P06 纸纹、P07 工牌 | 换质感用的，第一批效果对了再开 |

先出第一批，插进片子看一版；色温和颗粒对上了，再出第二批。**不要 8 张一起盲出**——色温不统一的话，8 张要一起重来。

---

## 2. 全局风格块（STYLE ANCHOR，一字不改）

### 2.1 英文块（贴在每条 prompt 前面）

```
documentary photograph, 50mm lens at f/4, available light only, low key,
muted warm grey palette, desaturated warm paper tone, faint film grain,
side-backlight from upper left, hard directional shadow, crushed but open
shadows, matte printed-paper texture with visible paper grain,
slight dust and micro-scratch, neutral color cast, no color grading,
flat contrast curve, eye-level, full-frame sharpness,
restrained industrial archive mood
```

### 2.2 中文对照

纪实摄影照片，50mm / f4，只用现场光，低调；低饱和暖灰 + 旧纸暖调；轻胶片颗粒；左上侧逆光、硬阴影，暗部压得住但不过死；哑光纸张质感、看得见纸纹；少量浮尘与细划痕；中性色偏、不调色、不高反差；平视、全画面清晰；克制，像工业档案。

**它是照片，不是插画、不是 3D 渲染、不是 CG、不是概念图。**

### 2.3 为了 8 张像一套，四个固定项

| 项 | 固定值 | 说明 |
|---|---|---|
| 风格块 | §2.1 原文照抄 | 不要给某一槽加 `cinematic` / `dramatic` / `epic`，一加就散 |
| seed | `20261110` | 8 张全用同一个；换 seed 只发生在换备选方案时 |
| 参考图 | P01 定稿 | P01 先出，挑一张最像的，其余 7 张都拿它当 image reference，强度 0.35–0.5 |
| 镜头语言 | 50mm / f4 / 平视 / 左上侧逆光 | 不混广角、不混顶光、不混俯拍（P01 是唯一的俯拍，它自己就是俯拍槽位） |

### 2.4 出图顺序

P01（定调）→ P04 → P05 → P08（第一批收）→ 插片看效果 → P02 → P03 → P06 → P07。

---

## 3. 八个槽位

> 每槽结构：id / 画面内容 / 用在哪个镜头 / 构图 / `prompt_en`（可直接粘贴）/ 中文一句话 / 后期提醒。
> 提醒统一一句话：**这张图之后会被程序做「灰度 → 双色调 → 半调网点 → 纸纹」，所以原图请不要自带色调滤镜、暗角、边框、文字。**

### P01｜木纹旧桌面，俯拍

- **画面内容**：一张空的老木工桌面，深胡桃木纹、划痕、少量木屑、一个浅浅的杯渍圈；桌上**没有**手机、没有手。
- **用在**：#25（1:49.6）「把手机扣在桌上」那一镜的整幅底图。
- **构图**：16:9 横构图，桌面占满画幅，四周不留白边（程序整幅裁切铺满）。
- **prompt_en**：

```
documentary photograph, overhead flat top-down view of an empty old workbench
surface, worn dark walnut planks with deep grain lines, one faint coffee ring
stain, fine scratches and a little sawdust, no objects, no phone, no hands,
thin warm raking side light from the left edge, hard shadow in one corner,
muted warm grey, matte, paper grain, slight dust, neutral color, no grading
```

- **中文一句话**：空桌面、纹理越烂越好；手机是程序自己画上去的，你画了就会变两部。
- **后期提醒**：程序会做双色调 + 半调 + 纸纹，原图别自带滤镜/边框/文字；木纹别太亮，暗部要压得下去。

### P02｜轮胎断面 / 胎面特写

- **画面内容**：一条被切开的重载轮胎断面立在车间地上，能看见胶层、钢丝带束、胎圈钢丝；胎面花纹近景，沟里积灰，**胎面缺一块胶**（对应歌词「缺胶」）。
- **用在**：#62（3:48.9）轮胎断面蓝图、#63（3:52.4）缺胶缺口。
- **构图**：16:9 横构图，断面切面朝镜头，主体占画面 2/3，右侧留暗部给程序压字。
- **prompt_en**：

```
documentary photograph, macro side view of a cut truck tire section standing
on a workshop floor, layered rubber, steel belt edges and bead wire visible in
cross section, tread blocks in sharp relief with one chipped missing rubber
notch, dust in the grooves, hard side light from upper left raking across the
cut face, deep shadow behind, muted warm grey and dull black rubber, matte,
paper grain, no text, no logo
```

- **中文一句话**：要「能看见里面一层层」的剖面，不是滚圆的成品轮胎照。
- **后期提醒**：程序会做双色调 + 半调 + 纸纹；断面别拍得太干净，干净了像渲染图。

### P03｜胶料 / 密炼机 / 混炼车间

- **画面内容**：老混炼车间内景，巨大的密炼机，机门上糊着碳黑；前景敞开的胶料袋、码放的黑色胶块；空气里有尘，地面有污渍。
- **用在**：#57（3:36.7）「胶料 + 配方 + 三个料仓」工程图那一镜的底。
- **构图**：16:9 横构图，机器占左 2/3，右侧留出灰墙与地面纵深。
- **prompt_en**：

```
documentary photograph, interior of an old rubber mixing workshop, a massive
internal mixer with caked carbon black on its door, open sacks of compound and
stacked black rubber bales in the foreground, dust hanging in the air, hard
side-backlight from upper left through a dusty high window, long shadows across
a stained concrete floor, muted warm grey with dull black rubber, matte, paper
grain, no people, no text, no logo
```

- **中文一句话**：黑、脏、有粉尘，但要看得清机器结构——它压在一张配方工程图底下。
- **后期提醒**：程序会压料仓图与文字，画面中上部的底要够暗、够平。

### P04｜轮胎产线 / 车间纵深

- **画面内容**：硫化产线一点透视向远处收，成排模具与胎坯，上方管线与轨道，空气里有雾与尘，地上一道长硬影，机器几乎是黑的剪影。
- **用在**：#66（3:59.9）八节点工序流程、#70（4:11.0）产量良率折线——两条曲线都浮在这张暗底上。
- **构图**：16:9 横构图，一条透视线从画面底部中间收进画面 40% 高度处；下半部要够暗。
- **prompt_en**：

```
documentary photograph, one-point perspective down a tire curing production
line, rows of tire molds and green tires receding into the far end, overhead
ducts and rail structure, haze and dust in the air, long hard shadows across
the concrete floor, side-backlight from upper left cutting through the haze,
machine silhouettes nearly black, muted warm grey, matte, paper grain, neutral
color, no people, no text, no logo
```

- **中文一句话**：越整齐越像渲染图；允许歪托盘、散落胎坯、地上掉漆的黄线。
- **后期提醒**：下半部要够暗，折线压上去才读得清；不要出现品牌字。

### P05｜厂区道路与路灯，黄昏

- **画面内容**：空无一人的厂区道路，沥青有补丁、褪色的白线，一侧几盏路灯刚亮，低矮的暖灰天空，远处厂区剪影无细节，路面上有长硬影。
- **用在**：#83（4:47.9）「我是工艺人」地平线、#87（尾声 5.5 s）最后一格灯——「卓越路」的实体。
- **构图**：16:9 横构图，地平线落在画面 55–62% 高度，路向画面深处延伸但不必收成一点。
- **prompt_en**：

```
documentary photograph, empty factory access road at late dusk, asphalt with
patched repairs and a worn white lane line, a row of street lamps just switched
on, low warm grey sky with soft haze, distant plant silhouette without detail,
hard side light from upper left casting long shadows across the road,
muted warm grey with one warm lamp glow,
matte, paper grain, neutral color, no cars, no people, no text, no logo
```

- **中文一句话**：路必须是空的，至少要有一盏亮着的灯；路名与字由程序打，画面里不许有招牌字。
- **后期提醒**：程序会在上方压大字与一条地平线，所以天空要平、别抢戏。

### P06｜旧纸 / 档案纸纸纹特写

- **画面内容**：手工旧纸极近特写，边缘毛糙，纤维与帘纹可见，淡淡霉斑与水痕，一道轻折痕；**是空白纸**——没有印刷、没有字、没有印章、没有墨。
- **用在**：古代木刻段落（ancient 调色板）当底纸，含 #6 #7 #8 #13 #20 #21 #22 #29 #30 等以纸为底的镜头。
- **构图**：3:4 竖构图（程序会再裁），纸面占满，不出现桌沿或环境。
- **prompt_en**：

```
documentary photograph, extreme close-up of aged handmade archive paper,
uneven torn edges, visible fibers and chain lines, faint foxing stains and
water marks, one soft crease, muted warm grey beige tone, raking side light from
upper left revealing the tooth of the paper, no printing, no writing, no stamp,
no ink, blank sheet, matte, paper grain, slight dust, neutral color, no grading
```

- **中文一句话**：一张什么字都没有的旧纸，纸纹本身就是画面。
- **后期提醒**：绝对不能带字与印章——木刻字、编号、红章全由程序画；这张只要纸的纤维。

### P07｜空白工牌 / 挂绳工牌

- **画面内容**：三张空白工牌摊在旧金属工作台上，照片窗是空的，塑料壳有划痕与裂边，深色挂绳；**没有姓名、没有编号、没有印刷**。
- **用在**：#37（2:24.8）三张马牌工牌照片位空白、#52（3:23.1）三张工牌翻面、#72（4:16.8）Allen Ma 名牌照片区空白。
- **构图**：16:9 横构图，三张牌横向排开、略错位，留出程序叠字的位置。
- **prompt_en**：

```
documentary photograph, three blank employee badges with dark lanyards laid on
a worn metal workbench, blank white photo windows empty, no printing, no
letters, no numbers, scuffed plastic holders with cracked edges, hard side light
from upper left casting crisp shadows, muted warm grey with dull black lanyards,
matte, paper grain, slight dust, neutral color, no people, no text
```

- **中文一句话**：空牌、空照片窗、真实塑料壳；名字和编号是程序叠上去的。
- **后期提醒**：牌面一定要留干净区域，程序要往上打姓名条与编号。

### P08｜德国马牌 Continental 标识实物 / 招牌

- **画面内容**：一块旧掉的 Continental 轮胎招牌装在粗糙的厂墙上，凸起的字与奔马标，暗黄与黑，边缘掉漆、下方有锈痕；招牌自己的影子打在墙上。
- **用在**：#35（2:16.9）「我是工艺人」、#51（3:19.2）反白「我是过来人」、#78（4:32.6）回到片头版式、#83（4:47.9）片尾压场。
- **构图**：16:9 横构图，招牌略偏画面一侧、占 35–55%，不是整幅背景。
- **prompt_en**：

```
documentary photograph, a weathered Continental tire brand sign mounted on a
rough factory wall, raised lettering and the running horse emblem in dull yellow
and black, paint worn at the edges with rust streaks below, hard side light from
upper left casting the sign's own shadow on the wall, muted warm grey wall,
matte surface, paper grain, neutral color, slightly off-center framing, tribute
purpose, no other text
```

- **中文一句话**：一块「厂里真挂了二十年」的招牌，不是印刷好的 logo 贴纸。
- **版权**：**用于致敬 / 内部放映。** 马牌（Continental AG）是现行注册商标，公开放映、商用或上平台前请自行确认授权；不想处理就走替代版——磨损的黄色圆牌 + 马形剪影，不带字母，程序仍会压自己的字幕。
- **后期提醒**：程序会做双色调，招牌的黄会被压成马牌黄，所以原图别加饱和度。

---

## 4. 负面提示词（negative，8 张共用）

```
text, letters, chinese characters, watermark, signature, caption, ui, screen,
interface, chart, graph, face, portrait, person, hand, cartoon, illustration,
anime, 3d render, cgi, octane, unreal engine, plastic look, glossy, neon color,
saturated color, cyan magenta cast, pure white background, seamless studio
backdrop, vignette, border, frame, polaroid, heavy sharpening, hdr,
oversaturated, low resolution, blurry, motion blur, jpeg artifacts,
duplicated objects, extra fingers
```

中文：文字/字母/中文、水印、签名、说明条、UI 与屏幕、图表、人脸人像、人手、卡通插画动漫、3D 与 CGI、塑料感高光、霓虹高饱和、纯白背景、无缝影棚背景、暗角、边框、拍立得、过度锐化、HDR、过饱和、低分辨率、模糊拖影、压缩伪影、重复物体、多余手指。

> 唯一例外：**P08** 允许出现品牌字母与马形标；其余 7 槽一律禁 logo 与文字。

---

## 5. 一致性协议

1. **同风格块**：§2.1 原文照抄，不改一个词。
2. **同 seed**：`20261110`。
3. **同参考图**：P01 定稿当其余 7 张的 image reference（0.35–0.5）。
4. **同镜头语言**：50mm / f4 / 平视 / 左上侧逆光（P01 俯拍除外）。
5. **同后期**：出图阶段不调色、不加暗角、不套 LUT、不加边框——程序侧统一「灰度 → 双色调 → 半调网点 → 纸纹」，你染一遍就叠两层，画面发脏。
6. **同规格**：1920×1080（P06 为 1440×1920 竖构图），sRGB，JPEG q92+。

### 如果出图偏了，改这几个词

| 症状 | 改法 |
|---|---|
| 像插画 / 3D 渲染 | 把 `documentary photograph, available light only` 提到最前，删掉 `cinematic` / `concept art` / `octane` |
| 颜色发艳、像手机直出 | 加 `desaturated, muted, low saturation, no color grading` |
| 太亮太干净、没有旧感 | 加 `worn, scuffed, dusty, patched, faded paint, micro-scratch` |
| 出现人脸 / 手 / 人影 | 正向词末尾加 `empty, no people, no figures` |
| 暗部糊成黑块 | `low key` 换成 `low key with open shadows, detail retained in shadow` |
| 8 张色温不统一 | 全部重跑同一 seed，P01 定稿当参考图，**不要单张补跑** |

---

## 6. 参考帧怎么用（帧 ≠ 生成物，这节最重要）

`docs/refs/` 里是从成片 `out/film_v4.mp4` 直接抽的真帧，给你对「调子」用的，**不是你要画的东西**。

### 6.1 一张图说清关系

```
参考帧（1920×1080，含程序画的版式、横线、大字、页脚）
   ↓ 只取三样东西：色调 / 光的来向 / 那块留白在画面里的位置和比例
你要生成的东西（一张照片，没有字、没有线、没有 UI、没有边框）
   ↓ 程序把它贴进那一帧的空白区，再压上自己的字与版式
成片里那一帧
```

**所以**：参考帧里有红条、有 `THE OGS · 过来人档案系统` 的页头、有 `#01221 READ` 的页脚、有网格、有大字——这些**一个都不要出现在你的图里**。你要出的是「这一帧背后那张照片」，不是这一帧的截图重绘。

### 6.2 怎么喂

1. 先看 `docs/refs/contact_sheet_style.jpg`（6 张四套调色板的风格帧，一张一张看），定下：暖灰纸感、左上光、硬阴影、颗粒。
2. 再看 `docs/refs/contact_sheet_slots.jpg`（11 张槽位帧），找到你要做的那个槽位编号，记下**那块空白在画面里的位置和形状**。
3. 出图时把对应帧当 image reference，强度 0.2–0.35（只要调子，不要构图细节）；prompt 仍用 §3 里的 `prompt_en`，不要照着帧去描述帧里的字。
4. 出完自查一句：**把这张图和参考帧并排放，颜色对不对得上？图上有没有不该有的字和线？**

### 6.3 每槽对应的帧

| 槽位 | 参考帧文件 | 备注 |
|---|---|---|
| P01 | `refs/slot_frames/P01_shot25_phone_desktop.jpg` | 桌面是程序画的排线，你出的是它背后那张真桌面 |
| P02 | `P02_shot62_tire_section.jpg`、`P02b_shot63_missing_rubber.jpg` | 成片这里是蓝图版式，帧只给色调，断面构图按 §3 自己重搭 |
| P03 | `P03_shot57_compound_flow.jpg` | 画面主体是工程图，帧只给底色与尘感 |
| P04 | `P04_shot66_process_flow.jpg`、`P04b_shot70_output_yield.jpg` | 帧里 70% 是黑底，说明你的产线图下半部要够暗 |
| P05 | `P05_shot83_horizon.jpg`、`P05b_shot87_last_lamp.jpg` | 注意地平线高度与那一盏灯的位置 |
| P06 | `P06_shot6_woodcut_paper.jpg` | 帧里纸上是木刻山景，你只要那张纸 |
| P07 | `P07_shot37_blank_badges.jpg` | 帧里是黑底 FILE 卡，工牌照片窗的位置看这里 |
| P08 | `P08_shot35_marpol_ground.jpg` | 帧里是大字版式，招牌的落位与人眼高度看这里 |

风格帧（`refs/style_ref/`）：`S1_system_L29_halfone.jpg`、`S2_ancient_L30_woodcut.jpg`、`S3_terminal_L39_crt.jpg`、`S4_marpol_L29_badge.jpg`、`S5_marpol_L33_swiss.jpg`、`S6_marpol_L36_blueprint.jpg`。

> 提醒：成片的实际版式和 `film/docs/STORYBOARD.md` 的文字描述有出入（比如 #62 现在是柱状蓝图而不是轮胎断面图，#35 是大字版式而不是马牌标识）。**以帧为准，不要以分镜文字为准**；帧里没给你的信息，就按 §3 的 `prompt_en` 自己搭。

---

## 7. 出图之后怎么放回片子

1. 改名放进 `film/media/photos/`：`P01.jpg` … `P08.jpg`（竖图 P06 也一样，程序按槽位读）。
2. 写 `film/media/photos/manifest.json`：

```json
[
  { "id": "P01", "file": "P01.jpg" },
  { "id": "P02", "file": "P02.jpg" },
  { "id": "P03", "file": "P03.jpg" },
  { "id": "P04", "file": "P04.jpg" },
  { "id": "P05", "file": "P05.jpg" },
  { "id": "P06", "file": "P06.jpg" },
  { "id": "P07", "file": "P07.jpg" },
  { "id": "P08", "file": "P08.jpg" }
]
```

3. 缺哪张都行——程序自动退回纯图形版，不会黑屏、不会报错；放几张就贴几张。
4. 拿到图后重渲一版（v5），逐镜抽帧对一遍再决定要不要第二批。

---

## 8. 验收清单

- [ ] 8 张全是照片质感，没有插画 / 3D / CG 味
- [ ] 8 张都没有文字、没有 UI、没有边框、没有暗角（P08 允许品牌字）
- [ ] P01 没有手机、没有手，桌面占满画幅
- [ ] P02 能看见断面的分层，胎面有一块缺胶
- [ ] P03 机器结构清楚，空气里有尘，画面中上部够暗
- [ ] P04 有纵深，下半部够暗，能压折线
- [ ] P05 路是空的、有一盏亮灯，地平线在 55–62% 高度
- [ ] P06 是空白旧纸，纸纹清楚，一个字都没有
- [ ] P07 三张空白工牌，牌面留干净区域
- [ ] P08 招牌有旧痕与自己的影子；版权已确认或已换无字母版本
- [ ] 8 张放一起看，色温、颗粒、光向一致
