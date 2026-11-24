"""把正确的歌词文本对齐到 ASR LRC 的时间轴。

思路：ASR 会漏字错字，但时间是对的。所以做**字符级序列对齐**：
1) 解析 LRC，把每一行内每个字的时间按「行首 -> 下一行行首」线性插值
2) 把 ASR 全部字连成一串（记每个字的绝对时间），同样把正确歌词连成一串（记每个字属于哪一行）
3) difflib.SequenceMatcher 找公共块，正确歌词的每个字从匹配上的 ASR 字取时间
4) 没匹配上的字（通常是 ASR 漏掉的）在前后已知时间之间线性插值
5) 按行聚合 -> 每行的 start/end，以及每个字的 offset（做卡拉OK逐字高亮）

输出 lyrics/og_timing.json：
{
  "duration": ..., "line_count": n,
  "lines": [{"i":0, "section":"00 hook", "text":"...", "start":14.99, "end":16.4,
             "chars":[{"c":"我","t":14.99}, ...]}]
}
"""
import sys
import json
import re
import difflib
import unicodedata

LRC = re.compile(r"^\[(\d+):(\d+(?:\.\d+)?)\](.*)$")


def parse_lrc(path):
    rows = []
    with open(path, encoding="utf-8", errors="replace") as f:
        for raw in f:
            m = LRC.match(raw.strip())
            if not m:
                continue
            t = int(m.group(1)) * 60 + float(m.group(2))
            rows.append([t, m.group(3).strip()])
    rows.sort(key=lambda r: r[0])
    return rows


def norm_char(ch):
    """判断这个字是否参与对齐（去掉标点、空格、符号）"""
    if ch.isspace():
        return False
    cat = unicodedata.category(ch)
    if cat.startswith("P") or cat.startswith("S"):
        return False
    return True


def build_asr_stream(rows, total_dur):
    """把 ASR 每行的字展开成 (char, time) 流"""
    stream = []
    for i, (t, text) in enumerate(rows):
        nxt = rows[i + 1][0] if i + 1 < len(rows) else total_dur
        nxt = max(nxt, t + 0.4)
        chars = [c for c in text if norm_char(c)]
        if not chars:
            continue
        step = (nxt - t) / max(len(chars), 1)
        for k, c in enumerate(chars):
            stream.append((c, t + step * k))
    return stream


def build_lyric_stream(lyric_path):
    """解析定版歌词：跳过以 # 开头的注释和 [section] 标记，返回 (chars, line_index_map)"""
    lines = []
    with open(lyric_path, encoding="utf-8") as f:
        for raw in f:
            s = raw.rstrip("\n")
            if s.startswith("#") or s.startswith("《"):
                continue
            m = re.match(r"^\[(.+)\]$", s.strip())
            if m:
                lines.append({"section": m.group(1), "text": "", "is_marker": True})
                continue
            lines.append({"section": None, "text": s.strip(), "is_marker": False})

    chars, owner = [], []
    real_lines = []
    for li, line in enumerate(lines):
        if line["is_marker"] or not line["text"]:
            real_lines.append(None)
            continue
        real_lines.append(len(real_lines))
        for c in line["text"]:
            if norm_char(c):
                chars.append(c)
                owner.append(len(real_lines) - 1)
    return lines, real_lines, chars, owner


def align(rows, total_dur, lyric_path):
    asr = build_asr_stream(rows, total_dur)
    lines, real_lines, lyr_chars, owner = build_lyric_stream(lyric_path)
    asr_chars = [c for c, _ in asr]
    asr_times = [t for _, t in asr]

    print(f"[align] ASR 有效字 {len(asr_chars)} / 歌词有效字 {len(lyr_chars)}", flush=True)
    sm = difflib.SequenceMatcher(None, asr_chars, lyr_chars, autojunk=False)
    blocks = sm.get_matching_blocks()
    matched = sum(b.size for b in blocks)
    print(f"[align] 匹配字 {matched} ({matched/max(len(lyr_chars),1)*100:.1f}%)", flush=True)

    # 先填已匹配的字
    times = [None] * len(lyr_chars)
    for b in blocks:
        for k in range(b.size):
            times[b.b + k] = asr_times[b.a + k]

    # 未匹配的字在前后已知时间之间插值
    known = [i for i, t in enumerate(times) if t is not None]
    if not known:
        raise SystemExit("对齐失败：没有任何字匹配上")
    for i, t in enumerate(times):
        if t is not None:
            continue
        prev_i = max([k for k in known if k < i], default=None)
        next_i = min([k for k in known if k > i], default=None)
        if prev_i is None and next_i is None:
            times[i] = 0.0
        elif prev_i is None:
            times[i] = times[next_i] - 0.12 * (next_i - i)
        elif next_i is None:
            times[i] = times[prev_i] + 0.12 * (i - prev_i)
        else:
            span = times[next_i] - times[prev_i]
            times[i] = times[prev_i] + span * (i - prev_i) / (next_i - prev_i)

    # 单调化，避免对齐抖动导致时间倒流
    for i in range(1, len(times)):
        if times[i] <= times[i - 1]:
            times[i] = times[i - 1] + 0.01

    # 按行聚合
    out_lines = []
    buf = [None] * len(lines)
    for li, line in enumerate(lines):
        if line["is_marker"]:
            continue
        if not line["text"]:
            buf[li] = {"section": None, "text": "", "start": None, "end": None, "chars": [], "skip": True}
            continue
        idxs = [i for i in range(len(lyr_chars)) if owner[i] == (li if li < len(real_lines) and real_lines[li] is not None else -1)]
        buf[li] = None  # 占位，稍后统一按 owner 填

    # 更稳的聚合：按 owner 分组
    by_line = {}
    for i, t in enumerate(times):
        li = owner[i]
        by_line.setdefault(li, []).append((lyr_chars[i], t))

    # 重建：把 real_lines 索引导回 lines 下标
    real_to_line = {}
    for li, line in enumerate(lines):
        if not line["is_marker"] and line["text"]:
            real_to_line.setdefault(len([x for x in lines[:li] if (not x["is_marker"] and x["text"])]), li)
    # 简化：顺序扫描
    real_to_line = {}
    ridx = 0
    for li, line in enumerate(lines):
        if not line["is_marker"] and line["text"]:
            real_to_line[ridx] = li
            ridx += 1

    section = None
    result = []
    for li, line in enumerate(lines):
        if line["is_marker"]:
            section = line["section"]
            continue
        if not line["text"]:
            continue
        ridx_found = None
        for r, l2 in real_to_line.items():
            if l2 == li:
                ridx_found = r
                break
        pairs = by_line.get(ridx_found, [])
        if not pairs:
            continue
        start = pairs[0][1]
        end = pairs[-1][1] + 0.5
        result.append({
            "section": section,
            "text": line["text"],
            "start": round(start, 3),
            "end": round(end, 3),
            "chars": [{"c": c, "t": round(t, 3)} for c, t in pairs],
        })

    return result


def main():
    if len(sys.argv) < 5:
        raise SystemExit("用法: python align_lyrics.py <asr.lrc> <lyrics.txt> <duration> <out.json>")
    lrc_path, lyric_path, dur, out_path = sys.argv[1], sys.argv[2], float(sys.argv[3]), sys.argv[4]
    rows = parse_lrc(lrc_path)
    print(f"[1/2] LRC {len(rows)} 行，首行 {rows[0][0]:.2f}s 末行 {rows[-1][0]:.2f}s", flush=True)
    lines = align(rows, dur, lyric_path)
    print(f"[2/2] 对齐 {len(lines)} 行，{lines[0]['start']:.2f}s -> {lines[-1]['end']:.2f}s", flush=True)
    data = {
        "duration": dur,
        "line_count": len(lines),
        "lines": lines,
    }
    with open(out_path, "w", encoding="utf-8") as f:
        json.dump(data, f, ensure_ascii=False)
    print(f"[ok] -> {out_path}", flush=True)


if __name__ == "__main__":
    main()
