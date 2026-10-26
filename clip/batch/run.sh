#!/bin/bash
# 渲染一条切片：剪原声 → 动画层 → 混音 → 合成 → 封面截图并嵌入
# 用法：bash run.sh <工作目录>/<项目id>      PY 默认 ~/.cache/promo-tts/.venv/bin/python（要有 numpy）
set -e
K="$(cd "$(dirname "$0")/../.." && pwd)"; PY=${PY:-~/.cache/promo-tts/.venv/bin/python}
P="$(cd "$1" && pwd)"; W="$(dirname "$P")"; ID="$(basename "$P")"
N=$(python3 -c "import sys;sys.path.insert(0,'$W');from spec import P;print(P['$ID']['name'])")
$PY $K/scripts/voice/cut_quotes.py "$P"
node $K/scripts/engine/build.mjs "$P"
$PY $K/scripts/compose/dropcaps.py "$P"
node $K/scripts/compose/render_alpha.mjs "$P"
bash $K/scripts/voice/mixaudio.sh "$P"
$PY $K/scripts/compose/compose.py "$P" "$N"
CHROME=${CHROME:-"/Applications/Google Chrome.app/Contents/MacOS/Google Chrome"}
# 每个项目单独的 user-data-dir，否则并行渲染时无头截图会互相冲突
cd "$P/cover" && "$CHROME" --headless=new --user-data-dir="${TMPDIR:-/tmp}/chr_$ID" --hide-scrollbars --window-size=1080,1620 --screenshot="$PWD/cover.png" "file://$PWD/cover.html" 2>/dev/null
cd "$P" && ffmpeg -loglevel error -y -i "out/$N.mp4" -i cover/cover.png -map 0:0 -map 0:1 -map 1 -c copy -c:v:1 png -disposition:v:1 attached_pic out/tmp.mp4 && mv out/tmp.mp4 "out/$N.mp4"
echo "DONE $ID $(ffprobe -v error -show_entries format=duration -of csv=p=0 "out/$N.mp4")"
