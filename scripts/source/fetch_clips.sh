#!/bin/bash
# 下载原视频的若干片段（带声音，720p）→ <项目>/assets/src/clip_<起始秒>.mp4
# 用法：bash fetch_clips.sh <项目> <视频网址> 52:40-53:32 2:40-3:02 ...
#   只下要用的几段，每段留出前后 5–10 秒余量；原声引用每段控制在 8 秒内
set -e
P="$(cd "$1" && pwd)"; URL="$2"; shift 2
ARGS=(); for r in "$@"; do ARGS+=(--download-sections "*$r"); done
cd "$P/assets/src"
for i in 1 2 3; do   # 偶发 SSL 断开，重试
  uvx yt-dlp ${YTDLP_COOKIES---cookies-from-browser chrome} -f "bv*[height<=720][ext=mp4]+ba[ext=m4a]/b[height<=720]" --merge-output-format mp4 "${ARGS[@]}" -o 'clip_%(section_start)s.%(ext)s' "$URL" > fetch.log 2>&1 && break
  echo "  下载失败，重试 $i"; sleep 5
done
ls -1 clip_*.mp4
