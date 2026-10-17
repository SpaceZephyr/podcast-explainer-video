# 片段里的逐词时间（Whisper），用来精确定原声的起止点
# 用法：python words.py <片段.mp4> [起秒] [止秒]    需要 mlx-audio + whisper-turbo（PY 环境）
import sys, os, subprocess, tempfile
from mlx_audio.stt.utils import load_model
src = sys.argv[1]; a = float(sys.argv[2]) if len(sys.argv) > 2 else 0; b = float(sys.argv[3]) if len(sys.argv) > 3 else 1e9
w = tempfile.mktemp(suffix=".wav"); subprocess.run(["ffmpeg", "-y", "-loglevel", "error", "-i", src, "-ar", "16000", "-ac", "1", w], check=True)
m = load_model(os.environ.get("WHISPER_MODEL", os.path.expanduser("~/.cache/promo-tts/whisper-turbo")))
r = m.generate(w, language="en", word_timestamps=True)
print(" ".join(f"{x['start']:.2f}{x['word']}" for s in r.segments for x in s.get("words", []) if a <= x["start"] <= b))
