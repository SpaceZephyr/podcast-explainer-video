# 原声场不显示旁白字幕（原声字幕在画框里单独画）：从 index.html 的 PV_CAPS 里删掉落在原声场里的字幕。build.mjs 之后跑
# 用法：python3 dropcaps.py <项目>
import json, re, sys, os
os.chdir(sys.argv[1])
Q = json.load(open("quotes.json")); tl = json.load(open("timeline.json"))
spans = [(s["start"], s["start"] + s["dur"]) for s in tl["scenes"] if s["id"] in Q]
h = open("index.html").read(); m = re.search(r"window\.PV_CAPS=(\[.*?\]);", h)
caps = [c for c in json.loads(m.group(1)) if not any(a - .01 <= c["a"] < b for a, b in spans)]
open("index.html", "w").write(h[:m.start(1)] + json.dumps(caps, ensure_ascii=False) + h[m.end(1):])
print(f"旁白字幕 {len(caps)} 条（去掉了 {len(spans)} 段原声里的）")
