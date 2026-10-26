# 按 spec.py 批量生成切片项目（config / quotes / qsub / lines / scenes.mjs / 封面）
# 用法：python3 gen.py <工作目录> [项目id ...]
#   工作目录里放 spec.py；每期原片段放在 <工作目录>/<ep>/assets/src/（fetch_clips.sh 下载的）
#   生成的项目在 <工作目录>/<项目id>/
import json, os, sys, subprocess, shutil
ROOT = os.path.abspath(sys.argv[1]); sys.path.insert(0, ROOT); from spec import P, EP
C = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))  # clip/
HEAD = open(f"{C}/scenes.clip.template.mjs").read().split("export const SCENES")[0]
COVER = open(f"{C}/cover.template.html").read().split("<body>")[0]
js = lambda s: json.dumps(s, ensure_ascii=False)
for pid in (sys.argv[2:] or P):
    p = P[pid]; d = f"{ROOT}/{pid}"; ep = EP[p["ep"]]
    if not os.path.exists(f"{d}/engine"):
        subprocess.run(["bash", f"{C}/init.sh", d], check=True, capture_output=True)
        if ep.get("whoTop"):  # 节目台标在画框左下时，人名条挪到左上
            open(f"{d}/engine/style.css", "a").write("\n.who { bottom: auto; top: 24px; }\n")
    for sc in p["scenes"]:
        shutil.copy(f"{ROOT}/{p['ep']}/assets/src/{sc['clip']}", f"{d}/assets/src/")
    cfg = json.load(open(f"{d}/config.json"))
    cfg.update(title=p["title"], source=ep["source"], video=ep["video"])
    json.dump(cfg, open(f"{d}/config.json", "w"), ensure_ascii=False, indent=1)
    json.dump({s["id"]: [s["clip"], s["a"], s["b"], (s.get("who") or ("",))[0]] for s in p["scenes"]}, open(f"{d}/quotes.json", "w"), ensure_ascii=False, indent=1)
    json.dump({s["id"]: s["subs"] for s in p["scenes"]}, open(f"{d}/qsub.json", "w"), ensure_ascii=False, indent=1)
    json.dump([s["subs"][0][1] for s in p["scenes"]], open(f"{d}/lines.json", "w"), ensure_ascii=False)
    out = []
    for i, s in enumerate(p["scenes"]):
        last = i == len(p["scenes"]) - 1
        who = "''"
        if s.get("who"):
            wo = f"t({s['whoOut']})" if s.get("whoOut") else "c.end - .2"
            who = f"who(c.t(.1), {wo}, {js(s['who'][0])}, {js(s['who'][1])})"
        tk = s["takes"]; ts = []
        for j, (at, k, sm) in enumerate(tk):
            a = "c.t(.1)" if at is None else f"t({at})"
            o = f"t({tk[j+1][0] - .05:.2f})" if j + 1 < len(tk) else ("c.end + 1" if last else "c.end - .05")
            ts.append(f"take({a}, {o}, {js(k)}, {js(sm)})")
        if s.get("small"):  # 结尾一行小字（和带小字的大字不要同时出现，会叠）
            ts.append(f"`<div ${{A({{ at: t({s['small'][0]}), fx: \"up\", d: .35, cls: \"take\" }})}} style=\"top:1412px\"><div class=\"s\">{s['small'][1]}</div></div>`")
        out.append(f"  quote({js(s['id'])}, (c, t) => [{who},\n    " + " +\n    ".join(ts) + "]),")
    open(f"{d}/scenes.mjs", "w").write(HEAD + "export const SCENES = [\n" + "\n".join(out) + "\n];\n")
    c1, c2, c3, c4 = p["cover"]; clip, sec = p["still"]
    subprocess.run(["ffmpeg", "-loglevel", "error", "-y", "-ss", str(sec), "-i", f"{d}/assets/src/{clip}", "-frames:v", "1", "-q:v", "2", f"{d}/cover/still.jpg"], check=True)
    open(f"{d}/cover/cover.html", "w").write(COVER + f"""<body>
<div class="t" style="top:120px;font-size:64px;font-weight:700">{c1}</div>
<div class="t" style="top:225px;font-size:100px">{c2}</div>
<img src="still.jpg"><div class="fade"></div>
<div class="t" style="top:1215px;font-size:108px">{c3}</div>
<div class="t" style="top:1380px;font-size:46px;font-weight:700;color:#d6d8de">{c4}</div>
</body></html>""")
    print(pid, "ok")
