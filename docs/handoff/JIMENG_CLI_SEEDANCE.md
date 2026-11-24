# 用即梦 CLI 做《The OGs》古代段

已读[即梦画布 CLI 使用说明](https://bytedance.larkoffice.com/wiki/QO66wGahSiakEHkJbxIcNBtDnAc)，并用本机 `dreamina-canvas` 1.4.0 核对视频模型、参数和本地预检。原曲时间、镜头表和提示词详见 [Seedance 古代段制作单](SEEDANCE_ANCIENT_PRODUCTION.md)。

第一条选普通 **Seedance 2.5**，多模态参考，16:9、720p、9 秒、1 条。小巷图本身已经亮灯，所以让它参考布局与最后的光色，用提示词安排从暗到亮。若灯一开场就亮，或墙、路、灯的位置漂移，下一轮再准备同机位的暗／亮两张定稿帧，用 `first_last_frame`，引用依次给首帧、尾帧。

| 本机模型标识 | 本机查到的规格 | 项目用法 |
|---|---|---|
| `seedance_2.5` | 4–30 秒，480p／720p／1080p／4K | 先核对两镜能否接顺，正式生成再提高分辨率和重做宽构图。 |
| `seedance_2.5_draft` | 4–30 秒，480p | 快速看动作；样片最长保留 7 天，有效期内确认转正，转正另行报价。 |
| `seedance_2.5_flash` | 4–30 秒，480p／720p | 可试备用镜头；实际消耗和账户准入以服务端为准。 |

以下 PowerShell 示例从仓库根目录运行。使用明确选定的画布，每条命令都传同一 `projectId`。运行 `canvas ls --limit 20` 可查看已有画布，如需新建则运行 `dreamina-canvas canvas create 'The OGs 古代 MV'`，保存返回的 `projectId` 和 `webUrl`。建画布与上传都是线上写入，研究阶段未执行。

## 上传参考图并保存草稿

```powershell
$cli = 'C:/Users/WangLC/bin/dreamina-canvas.exe'
$canvasId = '<画布 projectId>'
$alleyImage = Resolve-Path -LiteralPath './film/motion-v2/public/assets/chorus-v3/alley-lamp.png'
& $cli resource upload --project-id $canvasId --file $alleyImage.Path --name '空巷暖灯参考'

# 填入上传返回的 resourceId，把素材显式放进画布。
$imageId = '<上传的 resourceId>'
& $cli node create image --project-id $canvasId --title '空巷暖灯参考' --resource-id $imageId --import-kind local_upload

# 填入这个图片节点的 nodeId，以便在画布中保留从参考图到成片的连线。
$sourceNodeId = '<图片节点 nodeId>'
$ref = "node:$sourceNodeId"
$prompt = '{{' + $ref + '}}' + '是巷子构图和亮灯后光色的参考。水墨设色空巷，中央石板路近宽远窄，延向薄雾。单镜缓慢推进，墙门、路缘和灯杆稳定。先看清石板路的纵深，后让灯罩从微亮缓慢照到右侧砖墙与石板，最终暖光稳住约一秒。无人物、脚印、字幕与突然切镜。'
$videoArgs = @('node','create','video','--project-id',$canvasId,'--title','04 空巷石板路与暖灯','--model','seedance_2.5','--mode','m2v','--ratio','16:9','--resolution','720p','--duration','9','--count','1','--ref',$ref,'--prompt',$prompt)
& $cli @videoArgs --dry-run
& $cli @videoArgs
```

`--dry-run` 只校验本地写法，这版参数和节点引用格式已实测通过。第二条命令才保存草稿，两条都没有 `--run`。本地预检通过不代表远端价格、权限或参考素材已验过。

## 报价、生成和取片

1. 取草稿返回的 **视频** `nodeId`，执行 `dreamina-canvas node quote --project-id $canvasId --node-id $videoNodeId`。以返回的实时积分为准。只有在方案和积分上限已获批准后，才继续需要确认的运行。
2. 需要确认时，执行 `dreamina-canvas node confirm --project-id $canvasId --node-id $videoNodeId --credit-ceiling $approvedCredits`。将返回的短期凭证仅传给对应的 `node run --credit-token`。提交前生成一次 `submitId`（`[guid]::NewGuid().ToString()`），传 `node run --project-id $canvasId --node-id $videoNodeId --submit-id $submitId`，按服务端要求附凭证。不要把凭证写入项目文件。
3. 执行 `dreamina-canvas operation wait $submitId --project-id $canvasId --timeout 10m`。超时后用同一个 `submitId` 继续查；记录画布、视频节点、提交和最终素材 ID。成功后可用 `resource get` 查产物。当前 `resource download` 的命令说明只承诺图片，本轮未验证 MP4 的 CLI 下载。首轮从返回的画布链接打开成片并下载 MP4。
4. 回填原曲 **00:23.357–00:30.400**，用本地原曲与三行字幕，去掉生成片段的伴随音。再把这条接杜甫中景，检查灯光亮区能否把视线自然带过去。选片确认后再扩展到其他镜头。

文档入口：[准备画布和素材](https://bytedance.larkoffice.com/wiki/QO66wGahSiakEHkJbxIcNBtDnAc#TeNwdRApso4YoSxPcvoctffFn3e) · [视频生成](https://bytedance.larkoffice.com/wiki/QO66wGahSiakEHkJbxIcNBtDnAc#BUQ6dfpfLoHIB0xbEtcceihenbe) · [积分与任务状态](https://bytedance.larkoffice.com/wiki/QO66wGahSiakEHkJbxIcNBtDnAc#GtIGdSdpNoLJJ1xXXEqcRPhDnae)。
