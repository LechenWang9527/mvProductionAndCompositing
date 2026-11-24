# 素材与提示词核查

## 可直接接入

- `film/media/gen/IMG01_dufu.png`（1254×1254）和 `IMG02_hut.png`（1536×1024）均已存在，符合提示词所需的方形杜甫肖像、3:2茅屋比例。两者也列在 `gen_manifest2.json`。`shotfilm.js` 的镜头 3、8 分别引用它们，布局绘制 inset；加载成功时会进入成片。
- 提示词来源：`docs/CHATGPT_ONE_SHOT.txt` 第①②条及 `docs/CHATGPT_IMAGE_KIT.md` 第1、2条。杜甫必须是可辨认古人像；茅屋无人物。当前接线与歌词/主体对应。

## 缺失与旧素材

- 其余九张指定图缺失：`IMG03_changan.png`、`IMG04_hall.png`、`IMG05_liubang.png`、`IMG06_wine.png`、`IMG07_hand.png`、`IMG08_battle.png`、`IMG09_banner.png`、`IMG10_road.png`、`IMG11_noodle.png`。`film/src/photo.js` 会自动尝试加载约定文件名，缺图会进 `MISSING` 并在页面标题标记；但现有 `shotfilm.js` 只把 IMG01/02 接入镜头。其余缺图目前不会因这个镜头表进入成片。
- `film/media/gen/` 另有旧名 `dufu.png`、`hut.png`、`liubang.png`、`hall.png`、`battle.png`、`banner.png`，均为 768×768；没有被 `gen_manifest2.json` 登记，且新加载器只读取新命名 IMG 槽位，因此这些旧图当前不会进入成片。`gen_manifest.json` 留有旧 SD 提示词：杜甫写“elderly”、刘邦写“warlord king”，与新提示中的中年/未发迹小官约束不一致；`liubang.png` 画面有两名全副甲胄人物及图中文字，明显不符合新稿。勿将旧图改名顶替新图。
- 仓库记录确认做过 SD1.5 推理（`docs/notes/tools_trials.md` §3.3），用户已拒绝 SD1.5 方案；这些旧图应视作遗留候选，不作为本轮新图依据。现有证据能确认旧素材/提示词来源，但不能证明每个旧 PNG 都由 SD1.5 生成。

## 同事照片槽位

- `docs/CHATGPT_IMAGE_KIT.md` §4 明确七位同事照片留空，要求文件放 `film/media/people/PE01…PE07`。当前 `film/media/` 没有 `people/` 目录或 `PE*.jpg`。
- `film/media/photos/manifest.json` 登记 P01–P08，且文件均存在；它们是通用照片/背景槽位，不是 PE 命名的人像。抽查 `P01.jpg` 为无人物的旧纸纹理。`photo.js` 会实际加载 P 槽位，`shotfilm.js` 多镜头引用 P01–P08（例如 25、57、62、66、72、83），故这些素材确实可能进成片，但不能据此认为同事照片已提供。
- 图像框中的“待补”只在 `layouts.js` 的 `photo.portrait()` 缺省标签上出现；不能视为所有同事镜头都有该占位。SHOT_PLAN/`shotfilm.js` 中多数同事卡片仅排名字与档案字段，照片空位并非统一实现。当前没有真人同事文件可误接入。

## 主负责人待决

1. 保留“只把当前接入镜头所需的 IMG01/02 做成高品质素材”的范围，还是补齐其余九张提示图？若补，先按歌词确认哪些镜头确实要照片式/木刻插图，并把 IMG05 刘邦像接到对应镜头；现在刘邦镜头 20、22 是 `nameWoodcut` 文字版，没有肖像图引用。
2. 是否将旧名 SD 候选移出 `film/media/gen/` 或仅保留但标记归档？目前它们不会渲染，但目录混放易误用。
3. 同事“空照片框/待补”与实际代码不完全一致；决定是否为需要出现人像窗的同事卡增加统一占位样式。照片到位前继续保持无真人面孔。
