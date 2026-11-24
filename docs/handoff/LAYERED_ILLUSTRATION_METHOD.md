# 分层插画方法交接

- **素材分工：**精细地貌、旗帜和天空由现有插画/图像生成素材提供；程序只负责镜头运动、字幕和局部材质动效。候选 `sky.png`、`land-candidate-2.png`、`flag.png` 在 `film/media/candidates/wind_multiplane_study/`，study运行素材在 `film/motion-v2/public/assets/wind-study/{sky,land,flag}.png`。天空为1914×822不透明图，地景为1671×941透明图，旗为1024×1536竖版透明图。
- **连续镜头：**`film/motion-v2/src/visual/WindLayers.tsx` 用一条缓动 `drive` 驱动天空/地景/旗帜的0.25/0.65/1.0差速位移；缓动复用 `film/motion-v2/src/vendor/shotcraft/Polish.tsx`。做法参考 `ref_drawai/lib/motion/shotcraft/upstream/demos/camera/depth-layer-moves/MultiplaneReal.tsx` 的多层同轨差速，未复制卡片皮肤。
- **真实alpha与清边：**两版原始 land 山脊都有红黄边；原 flag 有低透明暗晕。运行时 `WindLayers.tsx` 以SVG对地景 alpha 腐蚀6px、模糊0.6px后合成原色；旗图alpha用 `feComponentTransfer` 收低透明边。候选图是否可用以实际合成帧为准。
- **旗布约束：**SVG噪声位移场把噪声alpha强制为1，避免alpha干扰杆部约束；`FlagPinDebug` 前后帧ROI实测：布面4,455/62,000像素变化（7.19%），旗杆0/1,746变化，运动仍保留。对应实现与debug帧见 `film/motion-v2/src/visual/WindLayers.tsx`、`film/motion-v2/studies/wind-multiplane/` 和 `out/motion-v2/studies/FlagPinDebug_0_00.png`、`FlagPinDebug_1_00.png`。
- **适用边界：**这套是2.5D景物/风场方法，不表现人物真实肢体、开锁或手机翻转；这类动作等I2V素材，不用对静图做形变冒充。固定字幕在 `film/motion-v2/src/SubtitlesEditorial.tsx` 独立绘制，不随景层移动；主片原曲仍由 `film/motion-v2/src/AncientEditorial.tsx` 的单一 `Audio` 加载 `audio/ogs.mp3`，时码不动。8秒study只验证分层与风动，不代表已接入全片。

## V4/V3音轨PCM核对（V4生成后执行）

从项目根目录用现有 `ref_mv/node_modules/ffmpeg-static/ffmpeg.exe` 将两片的音轨按同一格式解码，再比较字节数和SHA256；相同即解码PCM逐样本一致。

```powershell
$ff = "ref_mv/node_modules/ffmpeg-static/ffmpeg.exe"
$v3 = "out/motion-v2/AncientEditorialV3.mp4"
$v4 = "out/motion-v2/AncientEditorialV4.mp4"
$qc = "out/motion-v2/studies/av-investigation"
& $ff -hide_banner -v error -i $v3 -map 0:a:0 -vn -ar 48000 -ac 2 -c:a pcm_s16le -f s16le "$qc/v3-original-track.pcm"
& $ff -hide_banner -v error -i $v4 -map 0:a:0 -vn -ar 48000 -ac 2 -c:a pcm_s16le -f s16le "$qc/v4-original-track.pcm"
$p3 = "$qc/v3-original-track.pcm"; $p4 = "$qc/v4-original-track.pcm"
$a = Get-Item $p3; $b = Get-Item $p4; $h3 = (Get-FileHash $p3 -Algorithm SHA256).Hash; $h4 = (Get-FileHash $p4 -Algorithm SHA256).Hash
[pscustomobject]@{BytesV3=$a.Length;BytesV4=$b.Length;SHA256V3=$h3;SHA256V4=$h4;Identical=($a.Length -eq $b.Length -and $h3 -eq $h4)}
```

2026-11-12 实测：两次 FFmpeg 解码均 exit 0；PCM 均为26,370,048 bytes，SHA256 均为 `E6A70878FAFD73072750A024E6CD2937B76E9211F846EBDEED6F7ACB65FBFAD4`，逐字节一致。V4 MP4 SHA256 为 `92BE4FFD35252524DE73E34561547D6937EA808356C253B78CFCF582D0C4DAB1`，解码前后稳定。完整输入、退出码和哈希记录见 `out/motion-v2/AncientEditorialV4.audio-comparison.json`。
