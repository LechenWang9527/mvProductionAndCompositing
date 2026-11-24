# 工作区整理报告

任务 Codex-01 · 2026-11-24

## 整理前后

| 项目 | 整理前 | 整理后 |
| --- | ---: | ---: |
| 根目录目录数 | 75 | 16 |
| 根目录文件数 | 6 | 2 |
| 根目录 pip 缓存目录 | 59 | 0 |
| 根目录空临时目录 `.tmp/` | 1 | 0 |
| 历史散落文件 | 5 个在根目录 | 5 个已归档 |
| 新增文档 | 0 | [文件地图](../WORKSPACE_INDEX.md)和本报告 |

已核实以下目录均已移入 Windows 回收站。

共清理 `pip-build-tracker-*` 5 个、`pip-ephem-wheel-cache-*` 5 个、`pip-install-*` 5 个、`pip-unpack-*` 44 个，其中包含 40 个 pip 下载轮包，共 54,557,207 字节。另移除空 `.tmp/`。

### 原位保留的根目录项目

`.scout/`、`_trials/`、`AGENTS.md`、`analysis/`、`bench/`、`delivery_古代篇_20261122/`、`docs/`、`film/`、`lyrics/`、`mv_engine/`、`out/`、`ref_drawai/`、`ref_mv/`、`ref_prompts/`、`source_updates_20261124/`、`tools/`。

`_trials/` 下的试验媒体、虚拟环境、模型、日志和 pip 临时目录均在原位。根目录无试验媒体可移，因此 `test_media/` 为空。

## 归档明细

| 原相对路径 | 新相对路径 |
| --- | --- |
| `_patch_finale.mjs` | `_archive_workspace_legacy/probe_scripts/_patch_finale.mjs` |
| `_plan.txt` | `_archive_workspace_legacy/old_root_assets/_plan.txt` |
| `The OGs 视频音轨.mp3` | `_archive_workspace_legacy/old_root_assets/The OGs 视频音轨.mp3` |
| `The OGs 自动识别.lrc` | `_archive_workspace_legacy/old_root_assets/The OGs 自动识别.lrc` |
| `The OGs 自动识别.srt` | `_archive_workspace_legacy/old_root_assets/The OGs 自动识别.srt` |

## 清理明细

| 原根目录路径 | 清理前内容 | 清理后 |
| --- | --- | --- |
| `.tmp/` | 空目录 | 已移入回收站 |
| `pip-build-tracker-_pcq1lgy/` | 空目录 | 已移入回收站 |
| `pip-build-tracker-g4f0cql7/` | 空目录 | 已移入回收站 |
| `pip-build-tracker-h7nph15n/` | 空目录 | 已移入回收站 |
| `pip-build-tracker-sy7es0_j/` | 空目录 | 已移入回收站 |
| `pip-build-tracker-y5tlmft_/` | 空目录 | 已移入回收站 |
| `pip-ephem-wheel-cache-1lxmjwx2/` | 空目录 | 已移入回收站 |
| `pip-ephem-wheel-cache-_vp951z4/` | 空目录 | 已移入回收站 |
| `pip-ephem-wheel-cache-gjr359x3/` | 空目录 | 已移入回收站 |
| `pip-ephem-wheel-cache-lx91ukax/` | 空目录 | 已移入回收站 |
| `pip-ephem-wheel-cache-xaxvt_c1/` | 空目录 | 已移入回收站 |
| `pip-install-71d94291/` | 空目录 | 已移入回收站 |
| `pip-install-alu_duv_/` | 空目录 | 已移入回收站 |
| `pip-install-avw20p_0/` | 空目录 | 已移入回收站 |
| `pip-install-r1ssfcf5/` | 空目录 | 已移入回收站 |
| `pip-install-y_eyvsp8/` | 空目录 | 已移入回收站 |
| `pip-unpack-0v4bckzw/` | `certifi-2026.10.23-py3-none-any.whl` | 已移入回收站 |
| `pip-unpack-2492h5xz/` | `tqdm-4.70.1-py3-none-any.whl` | 已移入回收站 |
| `pip-unpack-4k5aml1z/` | 空目录 | 已移入回收站 |
| `pip-unpack-4mxaeog4/` | `accelerate-1.15.0-py3-none-any.whl` | 已移入回收站 |
| `pip-unpack-608l1loh/` | `rich-15.0.0-py3-none-any.whl` | 已移入回收站 |
| `pip-unpack-6lcvseyn/` | `mdurl-0.1.2-py3-none-any.whl` | 已移入回收站 |
| `pip-unpack-7659t66y/` | `tokenizers-0.20.3-cp312-none-win_amd64.whl` | 已移入回收站 |
| `pip-unpack-7w0e5rg5/` | `markdown_it_py-4.2.0-py3-none-any.whl` | 已移入回收站 |
| `pip-unpack-7zqqqn7d/` | `requests-2.34.2-py3-none-any.whl` | 已移入回收站 |
| `pip-unpack-86uahs2p/` | 空目录 | 已移入回收站 |
| `pip-unpack-8_2k6gv7/` | `numba-0.68.1-cp312-cp312-win_amd64.whl` | 已移入回收站 |
| `pip-unpack-_ldz1wn9/` | `pygments-2.21.0-py3-none-any.whl` | 已移入回收站 |
| `pip-unpack-_qtq8u6r/` | `hf_xet-1.8.0-cp38-abi3-win_amd64.whl` | 已移入回收站 |
| `pip-unpack-b90wz6p1/` | `shellingham-1.5.4-py2.py3-none-any.whl` | 已移入回收站 |
| `pip-unpack-cdx1uxr5/` | `anyio-4.16.0-py3-none-any.whl` | 已移入回收站 |
| `pip-unpack-cxekcxqj/` | `regex-2026.11.9-cp312-cp312-win_amd64.whl` | 已移入回收站 |
| `pip-unpack-dxmjfldc/` | `importlib_metadata-10.1.0-py3-none-any.whl` | 已移入回收站 |
| `pip-unpack-e6kmh4pp/` | `psutil-7.2.2-cp37-abi3-win_amd64.whl` | 已移入回收站 |
| `pip-unpack-etdgmdpb/` | `transformers-4.46.3-py3-none-any.whl` | 已移入回收站 |
| `pip-unpack-frlnef8l/` | `safetensors-0.8.0-cp310-abi3-win_amd64.whl` | 已移入回收站 |
| `pip-unpack-g6jrp__3/` | `charset_normalizer-3.5.2-cp312-cp312-win_amd64.whl` | 已移入回收站 |
| `pip-unpack-gt3f3q1u/` | 空目录 | 已移入回收站 |
| `pip-unpack-iodn70hu/` | `packaging-26.3-py3-none-any.whl` | 已移入回收站 |
| `pip-unpack-j0lk3iwm/` | `urllib3-2.8.0-py3-none-any.whl` | 已移入回收站 |
| `pip-unpack-ltzb3kjm/` | `diffusers-0.31.0-py3-none-any.whl` | 已移入回收站 |
| `pip-unpack-mq0lpgvu/` | `huggingface_hub-0.25.2-py3-none-any.whl` | 已移入回收站 |
| `pip-unpack-nxu2hoq6/` | `idna-3.20-py3-none-any.whl` | 已移入回收站 |
| `pip-unpack-p0i6a2jb/` | `truststore-0.10.5-py3-none-any.whl` | 已移入回收站 |
| `pip-unpack-p6iul5uv/` | `click-8.5.1-py3-none-any.whl` | 已移入回收站 |
| `pip-unpack-p_5yr21p/` | `zipp-4.1.2-py3-none-any.whl` | 已移入回收站 |
| `pip-unpack-pdluoho2/` | `typer-0.28.0-py3-none-any.whl` | 已移入回收站 |
| `pip-unpack-rpn0qklb/` | `torchaudio-2.5.1+cu121-cp312-cp312-win_amd64.whl` | 已移入回收站 |
| `pip-unpack-w1nt30bx/` | `tokenizers-0.23.3-cp310-abi3-win_amd64.whl` | 已移入回收站 |
| `pip-unpack-w53oj106/` | `httpcore2-2.16.0-py3-none-any.whl` | 已移入回收站 |
| `pip-unpack-wfxoxv2j/` | `h11-0.16.0-py3-none-any.whl` | 已移入回收站 |
| `pip-unpack-wj0si0vn/` | `pyyaml-6.0.3-cp312-cp312-win_amd64.whl` | 已移入回收站 |
| `pip-unpack-wqaxv45_/` | `huggingface_hub-2.4.0-py3-none-any.whl` | 已移入回收站 |
| `pip-unpack-wsin2dn5/` | `annotated_doc-0.0.5-py3-none-any.whl` | 已移入回收站 |
| `pip-unpack-wuyn46ki/` | 空目录 | 已移入回收站 |
| `pip-unpack-xbml37yl/` | `transformers-5.22.2-py3-none-any.whl` | 已移入回收站 |
| `pip-unpack-xjwekqu1/` | `colorama-0.4.6-py2.py3-none-any.whl` | 已移入回收站 |
| `pip-unpack-yd90ljee/` | `librosa-1.0.0-py3-none-any.whl` | 已移入回收站 |
| `pip-unpack-yml9qbfz/` | `httpx2-2.16.0-py3-none-any.whl` | 已移入回收站 |
| `pip-unpack-zb0mhab9/` | `diffusers-0.42.1-py3-none-any.whl` | 已移入回收站 |

## 旧路径影响

| 入口 | 归档后的用法或影响 |
| --- | --- |
| `film/render.mjs` | 原默认音轨在根目录。复跑旧版时用 `--audio "_archive_workspace_legacy/old_root_assets/The OGs 视频音轨.mp3"`。 |
| `mv_engine/analyze.py` | 旧命令示例写的是根目录音轨。复跑旧版时把 `--audio` 指向归档路径。 |
| `tools/check_and_stitch.cjs` | 首选 `film/motion-v2/public/audio/ogs.mp3` 仍在原位。只有首选文件缺失时才会走原根目录音轨的回退路径。 |
| `film/pixel/assemble_ancient.mjs`、`film/pixel/assemble_v2.mjs`、`analysis/extract_audio_features.py` | 直接引用原根目录音轨。若要复跑原样脚本，可按上表临时还原对应文件的根目录路径。 |
| `analysis/audit_lyric_timing.mjs` | 直接按原根目录路径读取旧 LRC、SRT。若要复跑原样脚本，同样按表还原路径。 |

## 完整性核对

核对了全工作区保留文件的路径、大小和最后修改时间，并比较了五个归档文件、`lyrics/`、`source_updates_20261124/` 和 `03_完整成品/` 内文件的 SHA-256。归档文件按前后路径配对，其余文件按原路径配对。受保护目录及其原有子目录仍在原位。`docs/` 新增本报告。

保护范围包括 `delivery_古代篇_20261122/`、`lyrics/`、`source_updates_20261124/`、`tools/`、`ref_mv/`、`ref_prompts/`、`film/`、`docs/`、`analysis/`、`mv_engine/` 及 `AGENTS.md`。

### 同期变动

`AGENTS.md` 在整理期间从 4,681 字节变为 4,762 字节，最后修改时间为 2026-11-24 11:40:28。该文件始终在根目录，整理命令没有写入或移动它。保留现场版本，变动来源未确认。

| 采样 | SHA-256 |
| --- | --- |
| 整理前 | `04d6a30abda7bb8ccbaaa764a0d72afa8534418e4d11a62fb65493a94ad629b6` |
| 整理后 | `c20c7122f97f284a54fad646b76ae273cb9cd2508b3cf86fc2ba39e7a4327de5` |

除上述同期变动外，其余 109,159 个保留文件的大小和最后修改时间全部一致，其中 5 个已换至归档路径。另有 37 个文件的 SHA-256 全部一致。15,656 个原有保留目录的路径全部一致。
