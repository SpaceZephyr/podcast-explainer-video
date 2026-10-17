#!/bin/bash
# 旁白配音：只配 lines.json 里不是原声的句子（quotes.json 里的序号跳过），引擎看 config.json 的 tts
#   tts=edge  → 微软官方音色（voice / rate），快，几十秒出完
#   tts=index → IndexTTS2 克隆 <项目>/ref.wav 的声音，更像真人，慢（1 分钟旁白约 10–15 分钟）
# 用法：bash speak.sh <项目> [句号...]
set -e
V="$(cd "$(dirname "$0")" && pwd)"; P="$(cd "$1" && pwd)"; shift
IDS="$*"
if [ -z "$IDS" ]; then IDS=$(python3 -c "
import json; L=json.load(open('$P/lines.json')); Q=json.load(open('$P/quotes.json'))
print(' '.join(str(i+1) for i in range(len(L)) if f's{i+1:02d}' not in Q))"); fi
TTS=$(python3 -c "import json;print(json.load(open('$P/config.json')).get('tts','edge'))")
if [ "$TTS" = "index" ]; then
  [ -f "$P/ref.wav" ] || { echo "tts=index 需要 <项目>/ref.wav（8–12 秒、一句说完的干净人声）"; exit 1; }
  (cd "${INDEXTTS_DIR:-$HOME/.local/opt/index-tts}" && uv run --project . python "$V/clone_index.py" "$P" $IDS)
else
  bash "$V/tts.sh" "$P" $IDS
fi
