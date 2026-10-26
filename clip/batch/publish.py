# 生成一条小红书定时笔记的 browser_batch actions（Claude in Chrome 用）：
# 上传视频 → 换自定义封面 → 标题 → 正文 → 话题 → 定时 → 每步校验 → 提交
# 用法：python3 publish.py <工作目录> <项目id> <tabId> [id2 ...]   多个 id 会拼成一个 batch（建议一次 ≤2 条，太长会超时）
#   工作目录里放 posts.py；先跑 serve.py 把成片和封面挂到 127.0.0.1:8765
# 校验失败（标题不对、话题没变成 [话题]、时间不对）batch 会停下，不会提交错的笔记
import json, os, sys
W = os.path.abspath(sys.argv[1]); sys.path.insert(0, W); from posts import POSTS
T = int(sys.argv[3]); ids = [sys.argv[2]] + sys.argv[4:]
C = lambda **k: {"name": "computer", "input": dict(k, tabId=T)}
J = lambda s: {"name": "javascript_tool", "input": {"action": "javascript_exec", "text": s, "tabId": T}}
def one(pid):
    when, _, title, cap, tags = next(x for x in POSTS if x[1] == pid)
    up = lambda ext, sel, name, typ: (f"const i=[...document.querySelectorAll('input[type=file]')].find(x=>{sel});if(!i) throw new Error('no input');"
        f"const b=await fetch('http://127.0.0.1:8765/{pid}.{ext}').then(r=>r.blob());const dt=new DataTransfer();dt.items.add(new File([b],'{name}',{{type:'{typ}'}}));"
        "i.files=dt.files;i.dispatchEvent(new Event('change',{bubbles:true}));b.size")
    a = [{"name": "navigate", "input": {"url": "https://creator.xiaohongshu.com/publish/publish?source=official&from=tab_switch&target=video", "tabId": T}},
     C(action="wait", duration=3),
     J(up("mp4", "true", f"{pid}.mp4", "video/mp4")),
     C(action="wait", duration=6),
     C(action="left_click", coordinate=[413, 367], action_summary="Hovers the cover thumbnail"),
     C(action="left_click", coordinate=[413, 424], action_summary="Opens the cover editing dialog"),
     C(action="wait", duration=2),
     J(up("png", "/image/.test(x.accept)", "cover.png", "image/png")),
     C(action="wait", duration=3),
     C(action="left_click", coordinate=[1188, 572], action_summary="Confirms the custom cover"),
     C(action="wait", duration=3),
     C(action="left_click", coordinate=[600, 604], action_summary="Focuses the title field"),
     C(action="type", text=title, action_summary="Types the post title"),
     C(action="left_click", coordinate=[600, 660], action_summary="Focuses the description editor"),
     J(f"const v=document.querySelector('input[placeholder*=\"标题\"]')?.value; if(v!=={json.dumps(title, ensure_ascii=False)}) throw new Error('title '+v); if(document.activeElement.className.indexOf('tiptap')<0) throw new Error('focus'); v"),
     C(action="type", text=cap + "\n", action_summary="Types the post description")]
    for g in tags:  # 输入话题后等联想出来，回车选第一个
        a += [C(action="type", text=g, action_summary="Types a hashtag"), C(action="wait", duration=1.5), C(action="key", text="Return", action_summary="Selects the topic suggestion")]
    a += [J("const s=document.querySelector('.tiptap').innerText; if((s.match(/\\[话题\\]/g)||[]).length<%d) throw new Error('tags '+s.slice(-120)); s.slice(-140)" % len(tags)),
     C(action="scroll", coordinate=[660, 500], scroll_direction="down", scroll_amount=15),
     C(action="left_click", coordinate=[625, 713], action_summary="Turns on scheduled publishing"),
     C(action="wait", duration=1),
     C(action="left_click", coordinate=[800, 713], action_summary="Focuses the schedule time field"),
     C(action="key", text="cmd+a", action_summary="Selects the date text"),
     C(action="type", text=when, action_summary="Types the scheduled time"),
     C(action="key", text="Return", action_summary="Confirms the time"),
     C(action="left_click", coordinate=[1080, 560], action_summary="Clicks empty area to close picker"),
     C(action="wait", duration=1),
     J(f"const v=[...document.querySelectorAll('input')].map(i=>i.value).find(x=>/^\\d{{4}}-\\d\\d-\\d\\d \\d\\d:\\d\\d$/.test(x)); if(v!=='{when}') throw new Error('time '+v); v"),
     C(action="left_click", coordinate=[724, 800], action_summary=f"Submits the scheduled post for {when}"),
     C(action="wait", duration=3),
     J("location.pathname.split('/').pop()")]  # 返回 success 才算成功
    return a
print(json.dumps([x for p in ids for x in one(p)], ensure_ascii=True))
