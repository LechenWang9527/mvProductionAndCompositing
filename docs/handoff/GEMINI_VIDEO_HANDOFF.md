# Gemini 图生视频交接

用户授权在“我的云端硬盘”建立子目录，已经创建并通过 Drive 远端逐目录核对：

- 云端：[古代MV_Demo2_Gemini图生视频_20261111](https://drive.google.com/drive/folders/1x1viQJ3uMuTlY5VEuHKqzbJDXe5Gou_X)
- 本机挂载：`G:/我的云端硬盘/古代MV_Demo2_Gemini图生视频_20261111`
- 工作区副本：`out/Gemini_古代MV_图生视频交接包/`
- 重建脚本：`tools/build_gemini_video_handoff.mjs`；主负责人运动/剪辑方案：`docs/handoff/GEMINI_VIDEO_PLAN.json`。

原15个镜头目录全部包含 `reference.png`、`视频生成提示词.txt`、`镜头说明.md`、空的`待回传视频/`。这15张图片与候选原图SHA-256全部一致；远端逐目录确认图片、提示词和镜头说明全部存在。CSV为UTF-8 BOM。图片全部约1671–1672×941，横向16:9近似比例。

先读 `00_给Gemini的调度指令.txt`，P0先做01大风、02茅屋、03灯火，每条请求8秒；这是本项目建议生成时长，与实际剪辑用时分别列在表格中。平台界面可用时长/分辨率以用户账户实际为准；如不支持指定8秒，使用可用时长并回报，后期再裁切。Gemini普通聊天不保证自动遍历文件夹或连续批量生成；需要时逐条上传本镜reference.png，选择视频生成，粘贴本镜提示词。原图不含MV歌词、时间轴、聊天文字，这些保持后期独立合成。

新生成的`wind_landscape_v3.png`以辽阔河川原野、远处古镇和流云为主，小旗退居右侧边缘，动作风向已按旗杆与布面关系改成右→左；不再使用旧怪旗。`lamp_desk_ink_v3.png`是有完整桌面和空白卷轴的16:9首帧，不再把透明油灯抠图直接当视频背景。两图由内置imagegen生成，原图与提示词在`film/media/candidates/`，图片已实看。

当前尚未收到任何Gemini生成视频，不能说图生视频已完成。回传MP4按镜头ID命名，如`01_wind.mp4`。回传后检查人物/物体一致性、真实局部运动、文字稳定性、时间和尺寸，再接入主片；音轨静音保留原曲。聊天屏幕若发生角点漂移，必须拒收或重新生成，不能把错位气泡硬叠上去。

Google官方使用说明（本轮核对）：https://support.google.com/gemini/answer/16126339?hl=en

审美问题另见`VISUAL_REGRESSION_AUDIT.md`；交接包完成不代表被用户否决的PPT版式已修好。

## V3追加项及云端核实（2026-11-12）

- 主负责人于2026-11-12通过Google Drive API核实原云端目录仍为17个镜头子目录，且4份概览文件已更新：`00_镜头总表.md`、`00_镜头总表.csv`、`00_给Gemini的总说明.md`、`00_给Gemini的调度指令.txt`。核实的是API目录内容，不代表Gemini生成或上传了视频。
- 新增16目录：`16_liubang_family_家宴中的父亲`，Drive目录ID `1B-xvnlMvGICFMwF2qLfw9j9fBdLMpMxu`；新增17目录：`17_courier_shift_雨夜跑单`，Drive目录ID `16N-Uup0vVjRc4ElqNhsEy-o2-4Roiole`。API列出的每个目录均含 `reference.png`、`视频生成提示词.txt`、`镜头说明.md` 和空的 `待回传视频/`。
- 两张在线参考图大小分别为3,176,096字节和2,992,824字节，与本地新增原图大小一致。16、17均仍待视频回传；当前不记为已生成。
