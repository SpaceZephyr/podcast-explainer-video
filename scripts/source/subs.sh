#!/bin/bash
# 拉原视频的自动英文字幕，去重成「时间 文本」一行一条 → <项目>/assets/src/subs.txt，用来按关键词找原话位置
# 用法：bash subs.sh <项目> <视频网址> [关键词...]
set -e
P="$(cd "$1" && pwd)"; URL="$2"; shift 2
cd "$P/assets/src"
for i in 1 2 3; do uvx yt-dlp --skip-download --write-auto-subs --sub-langs "en.*" --sub-format vtt -o 'subs' "$URL" > subs.log 2>&1 && break; sleep 5; done
python3 - "$@" <<'PY'
import re, glob, sys
f = sorted(glob.glob("subs*.vtt"))[0]; s = open(f).read()
seen, out = set(), []
for t, txt in re.findall(r"(\d\d:\d\d:\d\d)\.\d+ --> .*?\n(.*?)\n\n", s, re.S):
    txt = re.sub(r"<[^>]+>", "", txt).strip().replace("\n", " ")
    if txt and txt not in seen: seen.add(txt); out.append((t, txt))
open("subs.txt", "w").write("\n".join(f"{t} {x}" for t, x in out))
print(f"字幕 {len(out)} 条 → subs.txt")
for k in sys.argv[1:]:
    print("==", k); [print(" ", t, x[:140]) for t, x in out if k.lower() in x.lower()][:6]
PY
