# 快剪：旁白场按字幕换行切镜头（每个 1.7–3.5 秒），镜头从分好类的素材池里依次取，不重复用同一段；原声场保留 cut_quotes.py 写的 [片段, 起秒]（口型对上，不切）
# 素材池 <项目>/shots.txt，一行一个镜头：片段名 起秒 止秒 类别（J=嘉宾近景 W=全景 B/C=主持人 其他自定）
#   切点用 ffmpeg 找：ffmpeg -i clip.mp4 -an -vf "select='gt(scene,0.3)',showinfo" -f null - 2>&1 | grep -o "pts_time:[0-9.]*"
# config.json 可选：shotCycle 镜头类别轮换顺序；shotFirst {"s02": ["LOGO","J"]} 指定某场开头几个镜头；shotKin 画框右半边有动态字时只用这些类别（默认 ["J"]）
# 用法：python3 shots.py <项目>     在 build.mjs + dropcaps.py 之后、render 之前跑；会改写 edl.json
import json, re, sys, os
os.chdir(sys.argv[1])
CFG = json.load(open("config.json")); tl = json.load(open("timeline.json"))
H = open("index.html").read()
caps = json.loads(re.search(r"PV_CAPS=(\[.*?\]);", H).group(1))
segs = [l.split() for l in open("shots.txt") if l.strip() and not l.startswith("#")]
CAT = {}
for i, s in enumerate(segs): CAT.setdefault(s[3], []).append(i)
Q = json.load(open("quotes.json")); old = json.load(open("edl.json")) if os.path.exists("edl.json") else {}
QR = [(v[0], v[1] - 1, v[2] + 1) for v in Q.values()]   # 原声段用过的画面，空镜别再用
cur = {k: [0, float(segs[v[0]][1])] for k, v in CAT.items()}
def take(k, d):
    for _ in range(200):
        i, pos = cur[k]; c, a, b = segs[CAT[k][i]][:3]; a, b = float(a), float(b)
        hit = [q for q in QR if q[0] == c and q[1] < pos + d and q[2] > pos]
        if hit and pos + d <= b: cur[k][1] = hit[0][2]; continue
        if pos + d <= b: cur[k][1] = pos + d + .4; return [c, round(pos, 2), round(d, 3)]
        i = (i + 1) % len(CAT[k]); cur[k] = [i, float(segs[CAT[k][i]][1])]
    raise SystemExit(f"类别 {k} 的素材不够，多下几段或加镜头")
CYCLE = CFG.get("shotCycle", ["J", "W", "J", "J", "W", "J"])
FIRST = CFG.get("shotFirst", {}); KINOK = CFG.get("shotKin", ["J"])
# 画框右半边有动态字（.kin，不含 .mid）的时间段
KIN = [(float(a), float(o)) for a, o in re.findall(r'class="a kin" data-at="([\d.]+)" data-fx="\w+" data-d="[\d.]+" data-out="([\d.]+)"', H)]
busy = lambda x, y: any(a < y and o > x for a, o in KIN)
edl, n = {}, 0
for s in tl["scenes"]:
    if s["id"] in Q: edl[s["id"]] = old[s["id"]]; continue
    a0, a1 = s["start"], s["start"] + s["dur"]
    cuts = [c["a"] for c in caps if a0 + .2 < c["a"] < a1 - .2]
    pts = [a0]
    for t in cuts:
        if t - pts[-1] >= 1.7: pts.append(t)
    if a1 - pts[-1] < 1.2 and len(pts) > 1: pts.pop()
    pts.append(a1)
    shots, plan = [], FIRST.get(s["id"], [])
    def pick(i):
        global n
        if i < len(plan): return plan[i]
        k = CYCLE[n % len(CYCLE)]; n += 1; return k
    for i, (x, y) in enumerate(zip(pts, pts[1:])):
        while y - x > 3.5:
            k = pick(i); shots.append(take(k if not busy(x, x + 2.4) or k in KINOK else KINOK[0], 2.4)); x += 2.4
        k = pick(i)
        if busy(x, y) and k not in KINOK and k not in plan: k = KINOK[0]
        shots.append(take(k, round(y - x, 3)))
    edl[s["id"]] = shots
json.dump(edl, open("edl.json", "w"), indent=1)
D = [x[2] for k, v in edl.items() if k not in Q for x in v]
print(f"{len(D)} 个镜头，平均 {sum(D)/len(D):.2f}s，最短 {min(D):.2f}s，最长 {max(D):.2f}s")
