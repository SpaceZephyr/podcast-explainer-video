#!/bin/bash
# 新建一个播客解读视频项目：bash scripts/init.sh <项目目录>
set -e
S="$(cd "$(dirname "$0")" && pwd)"; P="$1"
[ -z "$P" ] && { echo "用法: bash init.sh <项目目录>"; exit 1; }
[ -d "$S/node_modules" ] || (cd "$S" && npm i --silent)
mkdir -p "$P"/{engine,voice_raw,voice,voice_fast,out,assets/src}
cp "$S"/engine/{lib.mjs,runtime.js,style.css} "$P/engine/"
ln -sfn "$S/node_modules" "$P/node_modules"
[ -f "$P/config.json" ] || cat > "$P/config.json" <<'EOT'
{ "W": 1080, "H": 1920, "speed": 1.0, "lead": 0.15, "tail": 0.2, "outro": 1.4, "bgmLUFS": -32,
  "tts": "edge", "voice": "zh-CN-YunyangNeural", "rate": "+15%",
  "title": ["第一行标题", "第二行标题！"], "source": "Podcast · Guest A & Guest B" }
EOT
[ -f "$P/lines.json" ] || echo '[]' > "$P/lines.json"
[ -f "$P/quotes.json" ] || echo '{}' > "$P/quotes.json"
[ -f "$P/edl.json" ] || echo '{}' > "$P/edl.json"
[ -f "$P/scenes.mjs" ] || cp "$S/scenes.template.mjs" "$P/scenes.mjs"
echo "项目已建好：${P}"
