#!/usr/bin/env bash
# 统一后处理：去 AI 水印 -> 480x270 硬像素 -> 1920x1080 / 30fps
# 用法: ./post.sh <raw.mp4> <out.mp4>
set -e
FF="E:/新建文件夹/实习/MV/ref_mv/node_modules/ffmpeg-static/ffmpeg.exe"
"$FF" -nostdin -loglevel error -y -i "$1" \
  -vf "delogo=x=4:y=4:w=126:h=58:show=0,scale=480:270:flags=neighbor,scale=1920:1080:flags=neighbor,setsar=1,fps=30" \
  -c:v libx264 -crf 16 -preset slow -pix_fmt yuv420p -an "$2"
echo "done -> $2"
