# 用 IndexTTS2（github.com/index-tts/index-tts）克隆声音配音，模型只加载一次
# 用法（必须用 index-tts 的环境跑）：
#   uv run --project ~/.local/opt/index-tts python clone_index.py <项目> [句号...] [seeds=3,21] [out=voice_raw]
# 参考音频：<项目>/ref.wav（8–12 秒、一句说完的干净人声；见 references/voices.md）
# 出来的语速接近原声，一般不用像 VoiceStudio 那样先放慢；finalize.py 再按需要整体变速
import os, sys, json, time, subprocess, random
from pathlib import Path
os.environ.setdefault("USE_MODELSCOPE", "1")  # 辅助模型走 ModelScope，HF 在国内很慢
INDEX = Path(os.environ.get("INDEXTTS_DIR", Path.home() / ".local/opt/index-tts"))
SKILL = Path(__file__).resolve().parents[2]
P = Path(sys.argv[1]).resolve()  # 先解析项目路径，再切到 index-tts 目录
sys.path.insert(0, str(INDEX)); os.chdir(INDEX)
kv = dict(a.split("=", 1) for a in sys.argv[2:] if "=" in a)
REF = P / "ref.wav"
import torch
from indextts.infer_v2 import IndexTTS2
tts = IndexTTS2(cfg_path=str(INDEX / "checkpoints/config.yaml"), model_dir=str(INDEX / "checkpoints"), use_fp16=False, use_cuda_kernel=False, use_deepspeed=False)
L = json.loads((P / "lines.json").read_text())
out = P / kv.get("out", "voice_raw"); out.mkdir(exist_ok=True)
idx = [int(a) for a in sys.argv[2:] if a.isdigit()] or range(1, len(L) + 1)
seeds = [int(s) for s in kv.get("seeds", kv.get("seed", "42")).split(",")]
af = "silenceremove=start_periods=1:start_threshold=-45dB,areverse,silenceremove=start_periods=1:start_threshold=-45dB,areverse"
for n in idx:
    for sd in seeds:
        random.seed(sd); torch.manual_seed(sd)
        name = f"s{n:02d}.wav" if len(seeds) == 1 else f"s{n:02d}_{sd}.wav"
        raw = out / (name + ".raw.wav"); t = time.time()
        tts.infer(spk_audio_prompt=str(REF), text=L[n - 1], output_path=str(raw), verbose=False)
        subprocess.run(["ffmpeg", "-y", "-loglevel", "error", "-i", str(raw), "-af", af, "-ar", "48000", "-ac", "1", str(out / name)], check=True); raw.unlink()
        d = subprocess.run(["ffprobe", "-v", "error", "-show_entries", "format=duration", "-of", "csv=p=0", str(out / name)], capture_output=True, text=True).stdout.strip()
        print(f"{name} {float(d):.1f}s（{time.time() - t:.0f}s）", flush=True)
