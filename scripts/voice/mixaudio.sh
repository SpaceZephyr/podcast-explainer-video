#!/bin/bash
# 混音：旁白 + 原声按时间轴放好 → -16 LUFS；配乐（out/bgm.wav，没有就合成）压到 config.bgmLUFS 并在有人声时自动压低 → out/mix_bgm.wav
# 用法：bash mixaudio.sh <项目>
set -e
V="$(cd "$(dirname "$0")" && pwd)"; P="$(cd "$1" && pwd)"; cd "$P"
PY="${PY:-$HOME/.cache/promo-tts/.venv/bin/python}"; [ -x "$PY" ] || PY=python3
python3 - <<'PY'
import json, subprocess
tl = json.load(open("timeline.json")); vd = json.load(open("config.json")).get("voiceDir", "voice_fast"); inp, flt = [], []
for i, s in enumerate(tl["scenes"]):
    inp += ["-i", f"{vd}/{s['id']}.wav"]; ms = int(s["voiceAt"] * 1000); flt.append(f"[{i}:a]adelay={ms}|{ms},apad[v{i}]")
n = len(tl["scenes"]); flt.append("".join(f"[v{i}]" for i in range(n)) + f"amix=inputs={n}:normalize=0,atrim=0:{tl['duration']},loudnorm=I=-16:TP=-1.5:LRA=11[out]")
subprocess.run(["ffmpeg", "-y", "-loglevel", "error", *inp, "-filter_complex", ";".join(flt), "-map", "[out]", "-ar", "48000", "-ac", "2", "out/mix.wav"], check=True)
PY
[ -f out/bgm.wav ] || "$PY" "$V/bgm.py" "$(python3 -c "import json;print(json.load(open('timeline.json'))['duration'])")" out/bgm.wav
LUFS=$(python3 -c "import json;print(json.load(open('config.json')).get('bgmLUFS',-32))")
ffmpeg -y -loglevel error -i out/bgm.wav -af loudnorm=I=$LUFS:TP=-9:LRA=7 -ar 48000 -ac 2 out/bgm_q.wav
ffmpeg -y -loglevel error -i out/mix.wav -i out/bgm_q.wav -filter_complex \
  "[0:a]asplit=2[v][sc];[1:a][sc]sidechaincompress=threshold=0.03:ratio=4:attack=60:release=600[b];[v][b]amix=inputs=2:normalize=0:duration=first,alimiter=limit=0.89[out]" \
  -map "[out]" -ar 48000 -ac 2 out/mix_bgm.wav
echo "音频 → out/mix_bgm.wav"
