# sync_check.py —— 用音频能量核验歌词行起点是否对齐（只报数，不改任何文件）
import json, math, wave
import numpy as np

WAV = r'E:/新建文件夹/实习/MV/analysis/og_22050.wav'
TIM = r'E:/新建文件夹/实习/MV/lyrics/og_timing.json'

with wave.open(WAV, 'rb') as w:
    sr = w.getframerate()
    n = w.getnframes()
    raw = w.readframes(n)
x = np.frombuffer(raw, dtype=np.int16).astype(np.float32) / 32768.0
print(f'audio {sr} Hz, {len(x)/sr:.2f} s')

# 20 ms hop 的能量包络
hop = int(0.02 * sr)
win = int(0.04 * sr)
frames = (len(x) - win) // hop
env = np.empty(frames, dtype=np.float32)
for i in range(frames):
    seg = x[i*hop:i*hop+win]
    env[i] = float(np.sqrt(np.mean(seg*seg) + 1e-12))
db = 20 * np.log10(env + 1e-9)
t_env = np.arange(frames) * hop / sr

# 局部峰值（能量相对邻域上涨）
k = 5
rise = np.zeros_like(db)
for i in range(k, frames - k):
    rise[i] = db[i] - float(np.median(db[i-k:i+k]))
cand = np.where(rise > 3.0)[0]
cand_t = t_env[cand]

lines = json.load(open(TIM, 'r', encoding='utf-8'))
if isinstance(lines, dict):
    lines = lines.get('lines', [])
starts = []
for l in lines:
    if isinstance(l, dict) and 'start' in l:
        starts.append((float(l['start']), (l.get('text') or '')[:16]))
print('lines:', len(starts))

offsets = []
detail = []
for st, txt in starts:
    if len(cand_t) == 0:
        continue
    d = np.abs(cand_t - st)
    j = int(np.argmin(d))
    if d[j] <= 0.60:
        off = float(cand_t[j] - st)
        offsets.append(off)
        detail.append((st, off, txt))

offsets = np.array(offsets)
if len(offsets):
    print(f'matched {len(offsets)} / {len(starts)}')
    print(f'median offset {np.median(offsets):+.3f} s   mean {offsets.mean():+.3f} s')
    print(f'mean |offset| {np.abs(offsets).mean():.3f} s')
    print(f'within 0.10s: {100*np.mean(np.abs(offsets)<=0.10):.0f}%   within 0.20s: {100*np.mean(np.abs(offsets)<=0.20):.0f}%')
    print('--- 最偏的 12 条 ---')
    for st, off, txt in sorted(detail, key=lambda r: -abs(r[1]))[:12]:
        print(f'  {st:7.2f}s  off {off:+.3f}  {txt}')
