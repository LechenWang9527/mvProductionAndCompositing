"""锚点分段的歌词对齐（v2）。

为什么要有 v2：v1 用全局 difflib 对齐，遇到「我是过来人」这类反复出现的副歌，
SequenceMatcher 会把 200 行的后半段全塞进同一秒里（实测 210.38~210.89s 挤了 7 个段落）。

v2 思路：先按**唯一内容句**把歌词切成若干段，每段都用一个 ASR 里也存在的显著短语定位，
在限定区间内再做字符级对齐 —— 反复段落被切到不同区间里，就不会跨段误匹配。

输出：lyrics/og_timing.json
"""
import sys
import json
import re
import difflib
import unicodedata

LRC = re.compile(r"^\[(\d+):(\d+(?:\.\d+)?)\](.*)$")

# 唯一锚点：(段名, 歌词里用来定位的句子, 估计在 ASR 里长什么样的关键词)
# 顺序必须与歌词出现顺序一致
ANCHORS = [
    ("00 hook",        "我是过来人",             "我是过来人"),
    ("01 dufu",        "我是杜甫",               "是杜甫"),
    ("02 dufu-son",    "我儿子出生那天",         "儿子出生"),
    ("04 liubang",     "我是刘邦",               "是刘邦"),
    ("05 you-too",     "同学群里有人上市",       "同学群里有人"),
    ("06 war",         "我打了七年仗",           "我打了年仗"),
    ("07 ledger",      "你现在跑的每一单",       "你现在跑的每单"),
    ("08 wind",        "大风起兮云飞扬",         "大风兮云飞扬"),
    ("10 biwu",        "进单位转岗过三次",       "进单位够了三次"),
    ("11 ppt",         "三十五页的PPT",          "三十页的PPT"),
    ("12 no-complaint","我没怼过谁",             "没怼过谁"),
    ("14 laocao",      "我是老曹",               "我是老曹"),
    ("15 wuhan",       "硫化的苦我吃过",         "路滑的苦我吃过"),
    ("16 gaoxiaofan",  "我是高小凡",             "是高小凡"),
    ("17 gary",        "我是Gary",               "是Gary"),
    ("18 chuanyong",   "系统难题肩上扛",         "系统难题肩上扛"),
    ("19 allen",       "你的困惑我来扛",         "的困惑我来扛"),
    ("20 xiaoma",      "我也叫小马",             "我叫小马"),
    ("22 finale",      "站在卓越路上追着共同的梦", "在卓越路上"),
]


def norm_char(ch):
    if ch.isspace():
        return False
    cat = unicodedata.category(ch)
    return not (cat.startswith("P") or cat.startswith("S"))


def norm_text(s):
    return "".join(c for c in s if norm_char(c))


def parse_lrc(path):
    rows = []
    with open(path, encoding="utf-8", errors="replace") as f:
        for raw in f:
            m = LRC.match(raw.strip())
            if not m:
                continue
            rows.append([int(m.group(1)) * 60 + float(m.group(2)), m.group(3).strip()])
    rows.sort(key=lambda r: r[0])
    return rows


def asr_stream(rows, total_dur):
    """返回 (chars, times, line_of)"""
    chars, times, line_of = [], [], []
    for i, (t, text) in enumerate(rows):
        nxt = rows[i + 1][0] if i + 1 < len(rows) else total_dur
        nxt = max(nxt, t + 0.4)
        cs = [c for c in text if norm_char(c)]
        if not cs:
            continue
        step = (nxt - t) / len(cs)
        for k, c in enumerate(cs):
            chars.append(c)
            times.append(t + step * k)
            line_of.append(i)
    return chars, times, line_of


def load_lyrics(path):
    """返回 sections: [{name, lines:[str]}]，保留顺序"""
    sections = []
    with open(path, encoding="utf-8") as f:
        cur = None
        for raw in f:
            s = raw.rstrip("\n")
            if s.startswith("#") or s.startswith("《"):
                continue
            m = re.match(r"^\[(.+)\]$", s.strip())
            if m:
                cur = {"name": m.group(1), "lines": []}
                sections.append(cur)
                continue
            if cur is not None and s.strip():
                cur["lines"].append(s.strip())
    return sections


def locate(anchor_norm, asr_chars, lo, hi):
    """在 asr_chars[lo:hi] 里找 anchor 的最佳位置，返回 (起始索引, 相似度)"""
    best_i, best_r = None, 0.0
    n = len(anchor_norm)
    if n == 0:
        return None, 0.0
    for i in range(lo, max(lo, hi - n * 2)):
        win = asr_chars[i:i + n]
        if not win:
            break
        r = difflib.SequenceMatcher(None, anchor_norm, win).ratio()
        # 也允许 ASR 多出几个字
        if r > best_r:
            best_r, best_i = r, i
        win2 = asr_chars[i:i + n + 3]
        r2 = difflib.SequenceMatcher(None, anchor_norm, win2).ratio()
        if r2 > best_r:
            best_r, best_i = r2, i
    return best_i, best_r


def align_range(lyr_chars, asr_chars, asr_times, a0, a1):
    """把 lyr_chars 对齐到 asr_chars[a0:a1]，返回每个歌词字的时间（None 表示未匹配）"""
    sub = asr_chars[a0:a1]
    sub_t = asr_times[a0:a1]
    sm = difflib.SequenceMatcher(None, lyr_chars, sub, autojunk=False)
    out = [None] * len(lyr_chars)
    for b in sm.get_matching_blocks():
        for k in range(b.size):
            out[b.a + k] = sub_t[b.b + k]
    return out


def fill_gaps(times, default_step=0.25):
    known = [i for i, t in enumerate(times) if t is not None]
    if not known:
        return [i * default_step for i in range(len(times))]
    for i in range(len(times)):
        if times[i] is not None:
            continue
        prev = max([k for k in known if k < i], default=None)
        nxt = min([k for k in known if k > i], default=None)
        if prev is None and nxt is None:
            times[i] = 0.0
        elif prev is None:
            times[i] = times[nxt] - default_step * (nxt - i)
        elif nxt is None:
            times[i] = times[prev] + default_step * (i - prev)
        else:
            span = times[nxt] - times[prev]
            times[i] = times[prev] + span * (i - prev) / (nxt - prev)
    for i in range(1, len(times)):
        if times[i] <= times[i - 1]:
            times[i] = times[i - 1] + 0.01
    return times


def main():
    if len(sys.argv) < 5:
        raise SystemExit("用法: python align_lyrics2.py <asr.lrc> <lyrics.txt> <duration> <out.json>")
    lrc_path, lyric_path, dur, out_path = sys.argv[1], sys.argv[2], float(sys.argv[3]), sys.argv[4]

    rows = parse_lrc(lrc_path)
    asr_chars, asr_times, asr_line = asr_stream(rows, dur)
    sections = load_lyrics(lyric_path)
    print(f"[in] ASR {len(asr_chars)} 字 / {len(sections)} 段歌词", flush=True)

    # 1) 定位所有锚点在 ASR 里的字符索引（单调递增约束）
    sec_pos = {}
    cursor = 0
    for name, probe_text, asr_hint in ANCHORS:
        probe = norm_text(asr_hint)
        idx, ratio = locate(probe, asr_chars, cursor, len(asr_chars))
        if idx is None or ratio < 0.45:
            print(f"  [skip] 锚点 {name} 命中率 {ratio:.2f} < 0.45", flush=True)
            continue
        sec_pos[name] = idx
        cursor = idx + 1
        print(f"  [锚] {name:16s} ASR#{idx:5d} t={asr_times[idx]:7.2f}s  ratio={ratio:.2f}", flush=True)

    # 2) 每段内部做字符对齐
    all_lines = []
    names = [s["name"] for s in sections]
    last_known_sec = None
    for si, sec in enumerate(sections):
        name = sec["name"]
        text = "".join(sec["lines"])
        chars = [c for c in text if norm_char(c)]
        if not chars:
            continue

        a0 = sec_pos.get(name)
        # 段尾 = 下一个命中锚点的段
        a1 = None
        for nxt in names[si + 1:]:
            if nxt in sec_pos:
                a1 = sec_pos[nxt]
                break
        if a0 is None:
            # 没有锚点：沿用上一段的区间起止做插值
            if last_known_sec is None:
                a0, a1 = 0, len(asr_chars)
            else:
                a0 = sec_pos.get(last_known_sec, 0)
                a1 = a0 + len(chars) * 2
        if a1 is None or a1 <= a0:
            a1 = min(len(asr_chars), a0 + max(len(chars) * 3, 40))

        ts = align_range(chars, asr_chars, asr_times, a0, a1)
        hit = sum(1 for t in ts if t is not None)
        ts = fill_gaps(ts)
        print(f"  [段] {name:16s} 字{len(chars):4d} 命中{hit:4d} {ts[0]:7.2f}->{ts[-1]:7.2f}s", flush=True)
        if name in sec_pos:
            last_known_sec = name

        # 按行切回
        p = 0
        for li, line in enumerate(sec["lines"]):
            n = len([c for c in line if norm_char(c)])
            if n == 0:
                continue
            seg = ts[p:p + n]
            p += n
            all_lines.append({
                "section": name,
                "text": line,
                "start": round(seg[0], 3),
                "end": round(seg[-1] + 0.6, 3),
                "chars": [{"c": c, "t": round(t, 3)}
                          for c, t in zip([c for c in line if norm_char(c)], seg)],
            })

    print(f"[out] {len(all_lines)} 行 {all_lines[0]['start']:.2f}s -> {all_lines[-1]['end']:.2f}s", flush=True)
    with open(out_path, "w", encoding="utf-8") as f:
        json.dump({"duration": dur, "line_count": len(all_lines), "lines": all_lines},
                  f, ensure_ascii=False)
    print(f"[ok] -> {out_path}", flush=True)


if __name__ == "__main__":
    main()
