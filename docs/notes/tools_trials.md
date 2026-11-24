# 工具实测日志（tools_trials.md）

本文件是 `docs/TOOLS.md` 的原始证据层。每条都记录：**命令 → 关键输出（原文）→ 耗时 → 结论**。
未跑完或没跑的项目，文中明确标「未实测」。

- 会话时间：2026-11-10，本机 Windows，cwd `E:/新建文件夹/实习/MV`
- 所有 bash 均在后台跑、输出重定向到 `_trials/logs/*.log`，再由读文件工具取回（前台 bash 会超时）。
- Python 一律用 `C:\Users\WangLC\.dsh\dsh-runtimes\dsh-primary-runtime\dependencies\python\python.exe`；
  裸 `python` 是 WindowsApps 空壳。
- 日志目录：`E:/新建文件夹/实习/MV/_trials/logs/`
- 试装目录：`E:/新建文件夹/实习/MV/_trials/{venv_librosa,venv_torch,remotion_app,motion_canvas_app,wwwtyro_app,repos,models,bin,scripts,tmp}`

---

## 0. 环境基线（实测）

日志：`_trials/logs/env_baseline.log`

```
Python 3.12.14
pip 26.2.1
numpy 2.3.5  pandas 3.0.1  pillow 12.3.0  lxml  openpyxl
python-docx 1.2.0  python-pptx 1.0.2  imageio-ffmpeg 0.8.1  xlsxwriter  tzdata
（无 librosa / playwright / moviepy / torch）

Node v26.13.0   npm 11.20.0
ffmpeg 6.1.1-essentials_build-www.gyan.dev
  enable: libx264 libx265 libass libfreetype libfontconfig libharfbuzz nvenc nvdec amf cuda
GPU: NVIDIA GeForce RTX 3050 6GB Laptop GPU, 6144 MiB, driver 560.78
磁盘: E: 200G 可用 / C: 176G 可用 / D: 126G
Chrome: C:/Program Files/Google/Chrome/Application/chrome.exe (157.0.8103.38)，Edge 也在
```

**关键结论：机器上没有 ffprobe**（见 §1.1）。

---

## 1. 渲染 / 歌词 MV 项目

### 1.1 ffprobe 缺失与补齐（这是全流程的门槛）

日志：`_trials/logs/ff_probe.log`、`_trials/logs/ffprobe_get.log`

`ffmpeg-static` 包里**只有 ffmpeg.exe，没有 ffprobe.exe**：

```
$ ls ref_mv/node_modules/ffmpeg-static/
LICENSE  README.md  example.js  ffmpeg.exe  ffmpeg.exe.LICENSE
ffmpeg.exe.README  index.js  install.js  package.json  types
```

系统 PATH 里也没有 ffmpeg/ffprobe：

```
$ which ffmpeg ffprobe
(空)
$ which winget choco scoop
C:/Users/WangLC/AppData/Local/Microsoft/WindowsApps/winget.exe
```

`imageio-ffmpeg` 提供的是 ffmpeg 9.0.2，也没有 ffprobe：

```
ffmpeg-win-x86_64-v9.0.2.exe
version 9.0.2-essentials_build-www.gyan.dev
```

补齐命令（`added 2 packages in 58s`）：

```bash
npm install --no-audit --no-fund @ffprobe-installer/ffprobe
# → node_modules/@ffprobe-installer/win32-x64/ffprobe.exe  (80,995,328 bytes)
$ ffprobe -version
ffprobe version 2023-02-13-git-2296078397-essentials_build-www.gyan.dev
configuration: --enable-libx264 --enable-libx265 --enable-libass --enable-libfreetype
               --enable-libharfbuzz --enable-nvenc --enable-nvdec --enable-amf ...
```

把两个 exe 拷到统一 PATH 目录 **`_trials/bin/`**：

```
E:/新建文件夹/实习/MV/_trials/bin/ffmpeg.exe
E:/新建文件夹/实习/MV/_trials/bin/ffprobe.exe
```

> 结论：**能用**。代价 = 一次 `npm i @ffprobe-installer/ffprobe` + 一个 bin 目录。
> `export PATH="E:/新建文件夹/实习/MV/_trials/bin:$PATH"` 之后所有依赖 ffmpeg/ffprobe 的工具才能跑。

### 1.2 remotion-dev/remotion（Remotion 4.0.542）

日志：`_trials/logs/npm_remotion.log`、`remotion_probe.log`、`remotion_render3.log`、`remotion_run4.log`

安装：

```bash
npm install --no-audit --no-fund @remotion/cli@4 react@19 react-dom@19
# added 242 packages in 1m   node_modules 252M
$ node -e "console.log(require('@remotion/cli/package.json').version)"
4.0.542
```

浏览器：

```bash
$ npx remotion browser ensure
Downloading Chrome Headless Shell https://www.remotion.dev/chrome-headless-shell
Getting Headless Shell - 131.1 Mb/131.1 Mb
Got Headless Shell
Has browser at .../node_modules/.remotion/chrome-headless-shell/win64/chrome-headless-shell-win64/chrome-headless-shell.exe
```

首次渲染失败（入口文件必须自己 `registerRoot`）：

```
Error: You passed ...src_Root.jsx as your entry point, but this file does not contain "registerRoot".
       You should use the file that calls registerRoot() as the entry point.
    at validateEntryPoint (.../@remotion/bundler/dist/bundle.js:170:15)
```

补一个 `src_index.jsx` 调 `registerRoot(Root)` 后仍失败第二次：

```
Error: FFmpeg quit with code 4294967283 while piping frame 152.
  [out#0/mp4 @ ...] Error opening output C:\Users\WangLC\AppData\Local\Temp\react-motion-renderogoC6Z\pre-encode.mp4:
  Permission denied
```

→ 与本机 Temp 目录权限有关（见 §1.5 的根因实测）。把 TMP/TEMP/TMPDIR 指到工作区后成功：

```bash
export TMP="E:/新建文件夹/实习/MV/_trials/tmp"; export TEMP="$TMP"; export TMPDIR="$TMP"
npx remotion render ./src_index.jsx Lyric out.mp4 --concurrency=1
```

成功输出：

```
Rendered 300/300
Encoded 300/300
+ remotion_out.mp4 718.6 kB
# 用时 31s (1794280778 → 1794280809, concurrency=1)
```

产物（ffprobe）：

```
codec_name=h264
width=1280  height=720
r_frame_rate=30/1
nb_frames=300
duration=10.000000
size=718585
bit_rate=574868
```

中文字幕实测：抽帧 `_trials/remotion_frame.png`（102,621 bytes），画面显示「第一行 中文歌词」，
系统 `sans-serif` 直接渲染 CJK 正常，无需额外字体包。

> 结论：**能用**。300 帧 720p 用时 31s（≈9.7 fps，concurrency=1）。
> 三条硬约束：① 入口文件必须 `registerRoot`；② 必须重定向 TMP 到可写目录；③ 需要先 `remotion browser ensure` 下 131MB headless shell。

### 1.3 ialakey/music-video-generator（MIT, 7★）

日志：`ialakey3.log`、`ialakey4.log`、`ialakey5.log`

依赖只有 `numpy>=1.24`、`pillow>=10.0` → 系统 Python 直接能跑（venv_librosa 里没有 PIL，会报
`ModuleNotFoundError: No module named 'PIL'`）。

必须有 ffprobe 在 PATH，否则：

```
Error: ffprobe not found. Install ffmpeg and add it to PATH.
```

补好 PATH 并重定向 TMP 后：

```
$ python -m musicvideo.cli still "The OGs 视频音轨.mp3" -p lofi --at 30 -o still.png
Done: ...ialakey_still.png
# 用时 23s，文件 2,461,512 bytes

$ python -m musicvideo.cli render "...mp3" -p lofi --length 6 --start 30 --size 1280x720 --fps 30 -o 6s.mp4
Processing audio...
Analyzing the spectrum...
Rendering: 180 frames, 1280x720 @ 30 fps, workers: 4
Done: ...ialakey_6s.mp4  (6.7 MB, 0:28)
# 用时 28s
```

产物：

```
codec_name=h264  1280x720  30/1  duration=6.000000  nb_frames=180
codec_name=aac   duration=6.000000  nb_frames=260
size=6992567  bit_rate=9323422
```

> 结论：**能用但要改造**。它是「音频编辑片」模板（封面 + 模糊背景 + 频谱 + 进度条），
> 不是逐句卡拉 OK 歌词 MV；没有 .lrc 解析、没有中文断句。渲染 6.4 fps 偏慢。

### 1.4 wwwtyro/canvas-video-generator（Unlicense）

日志：`wwwtyro.log`

```bash
npm install --no-audit --no-fund     # added 422 packages in 40s
node index.js --help
usage: cvg [options]
options:
  -h --help:     This help
  -p --port:     Port to use [3172]
  -o --odir:     Directory to store final video in [current working directory]
  -n --noclean:  Do not clean up temporary files [false]
CVG_RC=0
node --version → v26.13.0
```

架构（读源码确认）：express 起服务，浏览器 `POST /addFrame` 上传帧，服务端 `child_process` 调 ffmpeg 拼接
（`index.js` 用 browserify/body-parser/minimist/sprintf/tmp）。

> 结论：**能用但要改造**（只跑了 `--help`，**完整出片未实测**）。它没有歌词逻辑，
> 价值是把「canvas 逐帧 → HTTP 上传 → ffmpeg 拼接」这条链子写成了 30 行可抄的参考。
> 依赖是 2016 年的（express 4 / browserify 13），在 Node 26 上装得上但没必要用。

### 1.5 本机 Temp 权限实测（坑，影响所有 ffmpeg 子进程工具）

日志：`_trials/logs/temp_probe.log`

```
$ echo hi > "C:/Users/WangLC/AppData/Local/Temp/dsh_probe.txt"
BASH_WRITE_OK

$ python -c "open(r'C:\Users\WangLC\AppData\Local\Temp\dsh_probe2.txt','w').write('ok')"
PY_WRITE_OK

$ ffmpeg -f lavfi -i sine=... -y "C:/Users/WangLC/AppData/Local/Temp/dsh_probe.wav"
[out#0/wav @ ...] Error opening output C:/Users/WangLC/AppData/Local/Temp/dsh_probe.wav: Permission denied
FF_TEMP_RC=-13

$ ffmpeg ... -y "E:/新建文件夹/实习/MV/_trials/tmp/dsh_probe.wav"
FF_WS_RC=0   17718 bytes
```

> 结论：**bash 和 python 能写 Temp，ffmpeg 子进程不能写**。所有用 ffmpeg 落临时文件的工具
> （Remotion、ialakey）都必须 `export TMP/TEMP/TMPDIR` 到工作区，否则必挂。

### 1.6 其它候选（只读源码/README，未跑）

| 项目 | 读到的关键事实 | 判决 |
|---|---|---|
| dotslashgabut/immersive-audio-player-lyric-video-maker（19★，无 license 标注） | react19+vite8+three0.184；`utils/ffmpegRenderer.ts` 用 `@ffmpeg/ffmpeg`（wasm）逐帧编码，另一条 WebCodecs 硬编路径；`utils/canvasRenderer.ts` 的 `drawCanvasFrame(ctx,width,height,time,lyrics,visualSlides,...)`；README 明说支持导出 `.lrc`(含 Enhanced/Karaoke)/`.srt`/`.vtt`/`.json`，H.264/VP9/AV1 | **不能用（作为本项目引擎）**：纯浏览器交互式 App，要人点 UI 导出，没有 CLI 批批处理接口 |
| chrimage/ai-lyric-video-generator（14★，无 license 标注） | `pyproject` 依赖 `google-genai>=1.7.0`、moviepy、yt-dlp、ytmusicapi | **不能用**：依赖付费 Gemini API |
| motion-canvas/motion-canvas（20k★, MIT） | `npm i @motion-canvas/{core,2d,ffmpeg,vite-plugin}` → `added 74 packages in 37s`，`@motion-canvas/core 3.17.2`，node_modules 247M | **能用但要改造**：渲染到底还是「vite 页面 + headless 浏览器截图」（`@motion-canvas/ffmpeg`），**端到端出片未实测**，只验证了装得上 |

---

## 2. 音频分析

### 2.1 librosa 1.0.0：装得上，跑得通（关键结论）

日志：`_trials/logs/librosa.log`、`librosa2.log`、`librosa_step.log`

**失败的三个坑（都试过）**：

| 做法 | 结果 |
|---|---|
| `pip install --only-binary=:all: librosa`（默认源） | 卡住无输出，venv 一直只有 13M |
| `-i https://pypi.tuna.tsinghua.edu.cn/simple` | 停在 `Collecting numba>=0.61.0 ... numba-0.68.1-...whl (2.8 MB)`，8s 目录零增长 |
| 一次装整包 | 同样卡住 |

**成功配方**：逐包、阿里云源、只装 wheel（`_trials/venv_librosa`）：

```bash
python -m venv _trials/venv_librosa
scipy numpy soundfile soxr audioread pooch joblib decorator lazy_loader msgpack numba
  # 每个都用: pip install -i https://mirrors.aliyun.com/pypi/simple --only-binary=:all: <pkg>
pip install ... librosa --no-deps
```

耗时：numpy 2.2.6 36s、scipy 1.18.1 83s、soundfile 0.14.0 6s、soxr 1.1.0 5s、audioread 3.1.0 9s、
pooch 1.9.0 43s、joblib 1.6.0 9s、decorator 5.3.1 2s、lazy_loader 0.6 35s、msgpack 1.2.4 2s、
**numba 0.68.1 + llvmlite 0.50.0 115s**（llvmlite wheel 41.9MB）、librosa 1.0.0 294KB。

最终：`OK numpy 2.2.6 scipy 1.18.1 numba 0.68.1 librosa 1.0.0`，venv 367M。

**跑通证据**（`_trials/logs/librosa_bench.log`，输入 `analysis/og_22050.wav` 305.88s）：

```
librosa 1.0.0 numpy 2.2.6 import 4.54s
load: 0.05s dur=305.88s sr=22050 samples=6744576
onset_strength: 3.60s frames=13174 fps=43.066
beat_track: 5.40s tempo=[129.19921875] beats=647
BPM_LIBROSA = 129.20
median_IBI=0.4644s -> bpm_from_ibi=129.20
first 10 beats(s): [5.805, 6.269, 6.734, 7.198, 7.639, 8.104, 8.568, 9.033, 9.497, 9.961]
onset_detect: 3.32s onsets=1214
tempo(framewise): 0.24s top=[(12513,129.2),(299,136.0),(165,86.1),(122,103.4),(75,123.0)]
```

**API 变更坑**：`librosa.beat.tempo` 在 1.0.0 里已删除：

```
AttributeError: module 'librosa.beat' has no attribute 'tempo'. Did you mean: '_tempo'?
```

现在要用 `librosa.feature.tempo`（帧级）或 `beat_track(..., bpm=...)`。

**半速/全速歧义实测**（`librosa_bench2.log`）：

```
tempo candidates with different start_bpm prior
  start_bpm=60   -> 64.60
  start_bpm=64.6 -> 64.60
  start_bpm=80   -> 64.60
  start_bpm=100  -> 129.20
  start_bpm=120  -> 129.20
  start_bpm=140  -> 129.20
beat_track at fixed tempo:
  bpm=64.6  -> beats=333  median IBI 0.9288  first [0.255,1.161,2.09,3.019,...]
  bpm=129.2 -> beats=665  median IBI 0.4644  first [0.209,0.697,1.161,1.625,...]
beat fit score (mean onset env at beats):
  bpm=32.30 fit=1.9909 | 43.07 fit=2.0313 | 64.60 fit=1.9786
  86.13 fit=1.9191 | 129.20 fit=1.9508 | 172.27 fit=1.8345
piptrack 10s: 3.68s shape=(1025,431)
hpss full: 16.73s
chroma: 0.61s shape=(12,13174)
rms: 0.06s frames=13174 mean=0.1224
TOTAL 29.59s
```

> 结论：**librosa 能用**（venv 367M，全流程 29.59s/306s 音频）。
> **但它不会自己解决半速问题**：`start_bpm` 先验决定给 64.6 还是 129.2，
> 两种网格在 onset 包络上的拟合分几乎一样（1.9786 vs 1.9508）——所以"哪个是正确 BPM"必须由人/规则定。

### 2.2 拍点质量对比（librosa vs 项目自带 numpy 实现）

日志：`_trials/logs/beat_quality.log`（脚本 `_trials/scripts/beat_quality.py`）

评分方式：每个 beat 找最近 onset，统计 60ms 内的命中率与距离。

```
numpy impl: bpm 64.6 n_beats 329 n_onsets 914 dur 305.876
numpy beats: hit_rate@60ms=35.56% median_dist=0.093s mean=0.154s
librosa bpm=64.60  beats=324 hit_rate@60ms=1.23% median=0.093s mean=0.146s
librosa bpm=129.20 beats=647 hit_rate@60ms=1.85% median=0.093s mean=0.148s
librosa bpm=43.07  beats=216 hit_rate@60ms=1.39% median=0.093s mean=0.141s
```

观察：**所有方案的中位距离都是 0.093s**，说明差异不在网格本身，而在相位/容差。
numpy 实现在 60ms 容差下命中率高得多（35.56% vs 1.23–1.85%），
但中位数 0.093s > 60ms 意味着**即便最好的方案，拍点也普遍比最近 onset 晚约 93ms**。

> 结论：这两个实现给出的**网格密度不同（329/324/647/216）但相位相差 ~0.09s**，
> 现有 `mv_engine` 的 `bpm 96.01` 与 `analysis/features_real.json` 的 `bpm 64.6` 也不是同一个数。
> **接线时必须选定一个数据源，并给歌词/特效留 ±90ms 的容差**（见 TOOLS.md 坑 #4）。

### 2.3 aubio / madmom：装不上

日志：`_trials/logs/audio_libs.log`

```bash
pip install --only-binary=:all: aubio   -i 清华源
ERROR: Could not find a version that satisfies the requirement aubio (from versions: none)
ERROR: No matching distribution found for aubio
$ python -c "import aubio"
ModuleNotFoundError: No module named 'aubio'
```

```bash
pip install --only-binary=:all: madmom
ERROR: Could not find a version that satisfies the requirement madmom (from versions: none)
# 退回 sdist 构建：
ModuleNotFoundError: No module named 'Cython'
error: subprocess-exited-with-error
```

> 结论：**都不能用**。aubio 没有 py3.12 win wheel；madmom 没有 wheel 且 sdist 构建链断（缺 Cython）。
> 要用必须自己装 MSVC 构建工具链，不值得。

### 2.4 demucs / audio-separator：未跑完（明确「未实测」）

日志：`_trials/logs/demucs_probe.log`

torch 已就位并 GPU 可用：

```
torch 2.5.1+cu121 cuda True 5.2s
vram total 6.00 GB
demucs   MISSING: No module named 'demucs'
torchaudio MISSING: No module named 'torchaudio'
onnxruntime MISSING
```

试装 `torchaudio==2.5.1` + `demucs` 的任务被人工 kill（与 diffusers 抢同一个 venv 的 pip 锁），
`demucs_install.log` 只停在 `=== torchaudio ===`。

> 结论：**未实测**。已知前置：torch 2.5.1+cu121 可用、6.44GB VRAM、HF 下载走 hf-mirror 约 3–4MB/s，
> 模型 `htdemucs` 权重约 80MB，理论上能跑；但**没有 hover 到出 stem 的证据**，本文不给"能用"的判决。
> `audio-separator`（1.5k★ MIT，ONNX Runtime）**完全未测**。

---

## 3. 本地 AI 出图（6GB 显存）

### 3.1 硬件与网络前置实测

日志：`_trials/logs/torch.log`、`_trials/logs/hf_speed.log`

```
torch 2.5.1+cu121  cuda_avail True  cuda 12.1
gpu NVIDIA GeForce RTX 3050 6GB Laptop GPU vram_GB 6.44  sm 20
alloc_ok_MB 512 / 1024 / 2048 / 3072 / 4096 / 5120
fp16_matmul_2048 x50: 0.26s -> 3.3 TFLOPS
```

下载速度：

```
hf-mirror.com dreamshaper-8 vae fp16 (167MB):
  http=200  size=136170398  time=60.0s  speed=2.27 MB/s
hf-mirror.com SD1.5 unet fp16:
  http=200  size=67945445   time=20.0s  speed=3.40 MB/s
huggingface.co 直连同一文件, 20s:
  http=000  size=0  time=20.0s  speed=0        ← 直连拿不到
```

> 结论：**HF 直连不可用，hf-mirror 可用，速度 2.3–3.4MB/s**。

### 3.2 SD1.5 fp16 权重下载：成功

日志：`_trials/logs/dl_sd15.log`

```bash
curl -sSL -o <file> https://hf-mirror.com/stable-diffusion-v1-5/stable-diffusion-v1-5/resolve/main/<file>
```

```
GET model_index.json                        size=541        dur=22s
GET tokenizer/vocab.json                    size=1059962    dur=11s
GET tokenizer/merges.txt                    size=524619     dur=1s
GET text_encoder/model.fp16.safetensors     size=246144864  dur=61s
GET unet/diffusion_pytorch_model.fp16.safetensors  size=1719125304  dur=418s
GET vae/diffusion_pytorch_model.fp16.safetensors   size=167335342   dur=41s
GET safety_checker/model.fp16.safetensors   失败(未列出)
total: models/sd15 = 2.6G
```

> 结论：**权重可下**（2.6GB / 约 10 分钟）。说明"模型获取"这一环在 6GB 机器上不是瓶颈，**推理才是**。

### 3.3 SD1.5 推理：跑通了（6GB 显存）

日志：`_trials/logs/sd15_infer2.log`（失败）、`_trials/logs/sd15_infer3.log`（成功）

**版本坑**：先装了最新版，import 直接崩：

```
diffusers 0.42.1  transformers 5.22.2  accelerate 1.15.0
$ python -c "import diffusers"
  File ".../diffusers/utils/torch_utils.py", line 245, in _detect_device_type
    if torch.accelerator.is_available():
       ^^^^^^^^^^^^^^^^^
AttributeError: module 'torch' has no attribute 'accelerator'
```

原因：diffusers 0.42 要求 torch≥2.6，本机是 torch 2.5.1+cu121。降级后：

```bash
pip install -i https://mirrors.aliyun.com/pypi/simple --only-binary=:all: \
  "diffusers==0.31.0" "transformers==4.46.3" "huggingface_hub<0.26"
# → diffusers-0.31.0.dist-info, transformers-4.46.3.dist-info
```

**第二个坑**：本地 fp16 目录里文件名是 `model.fp16.safetensors`，diffusers 默认找不到：

```
OSError: Error no file named pytorch_model.bin, model.safetensors, tf_model.h5,
model.ckpt.index or flax_model.msgpack found in directory
E:/新建文件夹/实习/MV/_trials/models/sd15\text_encoder.
```

修法：`from_pretrained(..., variant="fp16")`。

**成功运行**（`_trials/scripts/sd15_infer.py`，`HF_HOME` 指到工作区）：

```
torch 2.5.1+cu121
loaded in 1.00s
vram after .to(cuda): 2.02 GB
OK 512x512 steps=12  14.31s  0.84 it/s  peak_vram=2.62GB  file=465198 bytes
OK 768x768 steps=12   9.03s  1.33 it/s  peak_vram=3.37GB  file=1024292 bytes
OK 512x512 steps=20   4.50s  4.45 it/s  peak_vram=2.62GB  file=468290 bytes
OK 768x768 steps=20  13.55s  1.48 it/s  peak_vram=3.37GB  file=1038915 bytes
TOTAL 61.2s
```

产物 `_trials/sd15_768_20.png`（1,038,915 bytes，768×768）：雨夜街景 + 青橙色调 + 胶片颗粒，
与 prompt 一致。`_trials/sd15_512_20.png` 468,290 bytes。

> 结论：**能用**。6GB 显存跑 SD1.5 fp16 峰值 **3.37GB（占 6.44GB 的 52%）**，
> 768×768/20 步 **13.55s/张**（首轮 512/12 的 14.31s 是 CUDA warmup，后续正常）。
> **SDXL 未实测**：SD1.5 unet fp16 1.7GB → 峰值 3.37GB；SDXL unet fp16 ≈5.2GB + 双 text encoder
> ≈1.4GB，6.44GB 必 OOM 除非 sequential offload。Flux（unet 级 11–23GB）直接排除。

### 3.4 不用 AI 出图的替代方案（本项目实际走的路）

本项目已有能力覆盖了 AI 出图的需求：纯 Canvas 程序化渲染
（`mv_engine/render.mjs` 实测 16.69 fps / 720p30，见 §5.1）。
所以「6GB 显存跑 SDXL」不是一个必须解决的问题——除非要做照片级背景板。
替代方案见 `docs/TOOLS.md` §4.3（程序化渐变/噪点/three.js 粒子/已有素材裁切）。

---

## 4. 本机 skill / 插件 / app

### 4.1 技能实际位置（跟会话里看到的名字对不上）

日志：`_trials/logs/skills_dump2.log`、`sys_skills.log`、`temp_probe.log`

- `C:/Users/WangLC/.dsh/skills` → **不存在**
- `E:/apps/DSH/resources/runtime/office-skills/` → 7 个 office 技能（office、office-docx、office-export-pdf、
  office-pptx、office-recalculate、office-render、office-xlsx）
- **真正全部技能在 `C:/Users/WangLC/.codex/skills/`**，共 28 个条目：

```
.system, academic-figure, academic-research-agent, brainstorming-research-ideas,
broad-web-research, citation-management, creative-thinking-for-research, experimental-design,
find-skills, humanizer, hypothesis-generation, literature-review, local-browser, nature-figure,
paper-lookup, peer-review, playwright, ppt-master, resume-optimizer,
scientific-critical-thinking, scikit-learn, setting-up-reproducible-analysis, shuorenhua,
statistical-analysis, systematic-debugging, test-driven-development,
verifying-results-before-claiming, writing-dna-skill
```

`.system/` 下有 `imagegen`、`openai-docs`、`review-agent`、`skill-creator`、`skill-installer`（后两个是空目录）。

### 4.2 imagegen 技能不能用在本地出图

读 `C:/Users/WangLC/.codex/skills/.system/imagegen/SKILL.md`：

- 默认模式 = 内置 `image_gen` 工具（**本 DSH 会话没有这个工具**）
- 兜底模式 = `scripts/image_gen.py`，**需要 `OPENAI_API_KEY`**
- 技能正文明确：`Do not switch to CLI fallback for ordinary quality...`
  `If the built-in tool fails or is unavailable, tell the user the CLI fallback exists and that it requires OPENAI_API_KEY.`

> 结论：**不能用**。没有内置 image_gen，也没有 OPENAI_API_KEY → 本地出图只能走 diffusers（§3.3）。

### 4.3 playwright 技能

读 `C:/Users/WangLC/.codex/skills/playwright/scripts/playwright_cli.sh`，wrapper 用：

```bash
npx --package @playwright/cli playwright-cli
```

`command -v npx` 在 PATH 里存在（Node v26.13.0 自带）。
本项目已有 `ref_mv/node_modules/playwright-core@1.63.0` 且 `mv_engine/render.mjs` 已经在用它
（实测 `[render] browser: chrome`）。

> 结论：**能用**，但对 MV 项目是"已有能力的包装"，不是新增能力。价值在
> ① 渲染页面的 DOM 快照/截图调试；② `ref_mv/export.mjs --sheet --times` 那种 QA 联系表的补充验证。

### 4.4 DSH 插件：没有视频/渲染类

日志：`_trials/logs/dsh_inventory.log`、`probe_skills.log`

`plugin_manager list_plugins` → **total 223**，全部是核心模块（skill、web、jobs、sandbox、search 等），
过滤 video / render / ffmpeg / canvas 关键词 **0 命中**。

`C:/Users/WangLC/.dsh/profiles/desktop/package.json` 已装插件：

```
@liustack/modlens                 3.27.2   ← 读图（vision bridge）
@michengai/dsh-skills-manager     1.2.35
billion-context                   0.1.213
cc-safety-net                     2.7.8
dsh-free-search                   0.9.34
dsh-ops                           0.5.0
dsh-plugin-iot-thinking           (github)
dsh-vision-router                 3.1.4
dshmarket                         (github)
bundles: @deepseek-ai/dsh-base, dsh-web-app, experimental-plugin-market-bundle,
         auto-review, inspector-profile, voice-input
```

> 结论：**没有能用于视频/渲染的插件**。`modlens` 3.27.2 有一点用（验收渲染帧时可直接读图），
> 其余与本项目无关。

---

## 5. 本项目现有能力基线（对照组）

### 5.1 mv_engine 渲染实测

日志：`_trials/logs/engine_test.log`

```bash
node mv_engine/render.mjs --fps 30 --from 0 --to 2 --out out/_trial_engine.mp4
```

```
[render] browser: chrome
[render] song 10.00 s · 96.01 BPM · t0 -0.029 s · 8 lyric lines · 300 frames @ 30 fps
[render] canvas draw cost: 1.5 ms/frame
render 17.97 s for 300 frames = 16.69 fps · 59.9 ms/frame · wall 18.33 s
size 5.24 MB (5491153 bytes) · 4 Mbps
```

ffprobe：`1280x720 h264 Main yuv420p 30fps + aac 44100Hz stereo 192kb/s`，编码器 `h264_nvenc`。

> 结论：**这是本项目最强的现有能力**——比 Remotion（9.7 fps）和 ialakey（6.4 fps）都快，
> 而且 canvas 绘制本身只占 1.5ms/帧，瓶颈在取帧+编码。**没有理由换掉它。**

### 5.2 现有 numpy 分析器

`analysis/features_real.json`：

```
keys: source duration sample_rate bpm bpm_confidence beat_frames fps beats beat_count first_beat onsets onset_count
bpm = 64.6   n_beats = 329   n_onsets = 914   dur = 305.876
first beats: [0.348, 1.277, 2.206, 3.135, 4.063, 4.992]
```

`mv_engine/data/features.json`（另一份）：

```
keys: meta tempo grid onsets sections chorusStart verify
n_onsets = 50   ← 注意：只有 50 个
```

> 结论：**两套 features 不一致**（64.6 vs 96.01 BPM；914 vs 50 onsets）。接线前必须统一数据源。

---

## 6. 文档里的推荐命令逐条验证

### 6.1 `analysis/features_librosa.json` 生成片段（TOOLS.md §4.2 环节 1）

日志：`_trials/logs/librosa_features.log`，脚本 `_trials/scripts/librosa_features.py`

```bash
export PYTHONIOENCODING=utf-8
_trials/venv_librosa/Scripts/python.exe _trials/scripts/librosa_features.py
```

```
tempo type ndarray shape (1,) value [129.19921875]
wrote features_librosa.json  bpm 129.19921875 beats 647 onsets 1214
bytes 28981
TOTAL 4.89s
```

> 结论：**文档里那段代码是照抄可跑的**（不是伪代码）。
> 注意 `librosa.feature.tempo` 返回 ndarray，必须 `float(tempo[0])`；
> 冷启动 import 约 4.5s，热跑整段 306s 音频 4.89s。

---

## 7. 未完成 / 未实测清单（诚实标注）

| 项 | 状态 | 原因 |
|---|---|---|
| SDXL / Flux 在 6GB 上 | 未实测 | 权重 5–23GB，下载时间不够；按 SD1.5 实测（1.7GB unet → 3.37GB 峰值）线性外推必超 6.44GB |
| ComfyUI | 未实测 | 机器上无任何 ComfyUI 目录（已 find 确认） |
| demucs 分离 stem | 未实测 | pip 安装被 kill |
| audio-separator | 未实测 | 未开始 |
| motion-canvas 端到端出片 | 未实测 | 只验证了包能装（3.17.2） |
| wwwtyro cvg 完整出片 | 未实测 | 只验证 `--help` |
| immersive-audio-player 导出 | 未实测 | 需要浏览器点 UI，判为不可集成 |
| aubio / madmom | 已实测，失败 | 无可用 wheel |
| SD1.5 推理（含耗时/显存） | **已实测，成功** | 见 §3.3 |
