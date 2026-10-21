#!/bin/bash
# 新建一分钟原声切片项目：bash clip/init.sh <项目目录>
# 复用主仓库的引擎（scripts/），样式 = 基础 + 快剪/原声字幕 + 切片版
set -e
C="$(cd "$(dirname "$0")" && pwd)"; S="$C/../scripts"; P="$1"
[ -z "$P" ] && { echo "用法: bash clip/init.sh <项目目录>"; exit 1; }
mkdir -p "$P"
[ -f "$P/config.json" ] || cat > "$P/config.json" <<'EOT'
{ "W": 1080, "H": 1620, "winX": 0, "winTop": 470, "winW": 1080, "winH": 608, "winR": 0,
  "speed": 1.0, "lead": 0.05, "tail": 0.1, "outro": 0.8, "bgmLUFS": -40, "hardCut": true,
  "title": ["人物身份 + 场合：", "一句话<y>观点</y>，重点词用 y 标黄"],
  "source": "Podcast · Episode title", "video": "" }
EOT
bash "$S/init.sh" "$P" >/dev/null
cat "$S/engine/style-fastcut.css" "$S/engine/style-clip.css" >> "$P/engine/style.css"
[ -f "$P/qsub.json" ] || echo '{}' > "$P/qsub.json"
cp "$C/scenes.clip.template.mjs" "$P/scenes.mjs"
mkdir -p "$P/cover"; cp "$C/cover.template.html" "$P/cover/cover.html"
echo "切片项目已建好：${P}（改 config.json 的 title / source，写 quotes.json + qsub.json + lines.json）"
