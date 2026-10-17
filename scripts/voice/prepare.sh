#!/bin/bash
# 旁白后处理：收紧停顿 →（有 Whisper 时）标点补停顿、逐字对齐、逐句对稿。原声句不处理
# 用法：bash prepare.sh <项目> [句号...]     PY 指向装了 mlx-audio、pypinyin、numpy 的 Python
set -e
V="$(cd "$(dirname "$0")" && pwd)"; P="$(cd "$1" && pwd)"; shift
IDS="$*"
if [ -z "$IDS" ]; then IDS=$(python3 -c "
import json; L=json.load(open('$P/lines.json')); Q=json.load(open('$P/quotes.json'))
print(' '.join(str(i+1) for i in range(len(L)) if f's{i+1:02d}' not in Q))"); fi
PY="${PY:-$HOME/.cache/promo-tts/.venv/bin/python}"; [ -x "$PY" ] || PY=python3
"$PY" "$V/tighten.py" "$P" $IDS
if "$PY" -c "import mlx_audio, pypinyin" 2>/dev/null; then
  export HF_HUB_OFFLINE=1
  (cd "$V" && "$PY" repause.py "$P" $IDS && "$PY" finalize.py "$P" $IDS)
else
  echo "没有 Whisper（mlx-audio），跳过对齐和对稿"
  for n in $IDS; do k=$(printf s%02d "$n"); cp "$P/voice_raw/$k.wav" "$P/voice/"; cp "$P/voice_raw/$k.wav" "$P/voice_fast/"; done
fi
