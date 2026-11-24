#!/usr/bin/env bash
# genimg.sh — 用 a6 生图接口出图
# 用法: ./genimg.sh "<prompt>" <out.png> [model] [size]
set -euo pipefail

PROMPT="${1:?prompt required}"
OUT="${2:?output path required}"
MODEL="${3:-gpt-image-2.6-sunburst}"
SIZE="${4:-1024x1024}"
BASE="https://a6api.vip"
KEY_FILE="$HOME/.dsh/.credentials.yaml"

KEY=$(grep -m1 'A6_API_KEY:' "$KEY_FILE" | sed -E 's/.*A6_API_KEY:[[:space:]]*//' | tr -d '\r"'"'"' ')
[ -n "$KEY" ] || { echo "no A6_API_KEY in $KEY_FILE" >&2; exit 1; }

TMP=$(mktemp -d)
trap 'rm -rf "$TMP"' EXIT

node -e '
const [prompt, model, size] = process.argv.slice(1);
process.stdout.write(JSON.stringify({ model, prompt, n: 1, size }));
' "$PROMPT" "$MODEL" "$SIZE" > "$TMP/req.json"

# 注意: 本机 127.0.0.1:7897 代理已失效, 必须 --noproxy
code=$(curl -s --noproxy '*' -o "$TMP/resp.json" -w '%{http_code}' --max-time 600 \
  "$BASE/v1/images/generations" \
  -H "Authorization: Bearer $KEY" \
  -H 'Content-Type: application/json' \
  -d @"$TMP/req.json")

if [ "$code" != "200" ]; then
  echo "HTTP $code" >&2
  head -c 800 "$TMP/resp.json" >&2
  exit 1
fi

node -e '
const fs = require("fs");
const [respPath, out] = process.argv.slice(1);
const r = JSON.parse(fs.readFileSync(respPath, "utf8"));
const item = r.data && r.data[0];
if (!item) { console.error("no data:", JSON.stringify(r).slice(0, 500)); process.exit(1); }
if (item.b64_json) {
  fs.writeFileSync(out, Buffer.from(item.b64_json, "base64"));
  console.log("saved(b64)", out, fs.statSync(out).size, "bytes");
} else if (item.url) {
  console.log("url:", item.url);
  fs.writeFileSync(respPath + ".url", item.url);
}
if (item.revised_prompt) console.log("revised:", item.revised_prompt.slice(0, 300));
' "$TMP/resp.json" "$OUT"

# 接口可能只回 url: 需要再下载一次落盘
if [ -f "$TMP/resp.json.url" ]; then
  curl -s --noproxy '*' --max-time 300 -o "$OUT" "$(cat "$TMP/resp.json.url")"
  echo "saved(url) $OUT $(wc -c < "$OUT") bytes"
fi
