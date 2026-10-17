# 按 quotes.json 剪原声：去掉头尾静音 → voice_raw/voice/voice_fast 的 sNN.wav；同步改 edl.json 里这场的画面起点（保证口型对上）
# quotes.json：{"s04": ["clip_3160.mp4", 起秒, 止秒, "说话人", "英文原话（可选）"], ...}，sNN 是 lines.json 里这句的序号
# 用法：python cut_quotes.py <项目>
import json, wave, subprocess, sys, os
import numpy as np
P = os.path.abspath(sys.argv[1]); os.chdir(P)
lead = json.load(open("config.json")).get("lead", .15)
Q = json.load(open("quotes.json")); E = json.load(open("edl.json")) if os.path.exists("edl.json") else {}
def cut(k, v):
    d = v[2] - v[1]
    subprocess.run(["ffmpeg", "-y", "-loglevel", "error", "-ss", str(v[1]), "-to", str(v[2]), "-i", f"assets/src/{v[0]}", "-vn", "-af",
                    f"afade=t=in:d=0.04,afade=t=out:st={d - .12:.2f}:d=0.12", "-ar", "48000", "-ac", "1", f"voice_raw/{k}.wav"], check=True)
for k, v in Q.items():
    cut(k, v)
    w = wave.open(f"voice_raw/{k}.wav"); sr = w.getframerate(); x = np.frombuffer(w.readframes(w.getnframes()), np.int16).astype(float)
    hop = sr // 100; db = np.array([20 * np.log10(np.sqrt(np.mean(x[i:i + hop] ** 2)) / 32768 + 1e-9) for i in range(0, len(x), hop)])
    loud = np.where(db > -38)[0]; h = max(0, loud[0] / 100 - .03); t = max(0, (len(db) - 1 - loud[-1]) / 100 - .05)
    if h > .02 or t > .02: v[1] = round(v[1] + h, 2); v[2] = round(v[2] - t, 2); cut(k, v)
    for d in ("voice", "voice_fast"): subprocess.run(["cp", f"voice_raw/{k}.wav", f"{d}/{k}.wav"])
    E[k] = [v[0], round(v[1] - lead, 2)]
    print(f"{k} {v[3]} {v[2] - v[1]:.1f}s（去掉头 {h:.2f}s 尾 {t:.2f}s）")
json.dump(Q, open("quotes.json", "w"), ensure_ascii=False, indent=1); json.dump(E, open("edl.json", "w"), indent=1)
