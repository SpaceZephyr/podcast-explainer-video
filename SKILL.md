---
name: podcast-explainer-video
description: 把一期播客做成 2–5 分钟的竖版解读短视频：用户给播客地址（onepod.site 页面、YouTube、小宇宙等），先提炼内容（onepod 页面的摘要和核心观点，或 onepod-Skill 的转录/提炼），写成「谁上了这期播客 → 几个有启发的点 → 每点讲清楚并插一句原声」的口播稿，配音由用户选（微软官方音色或 IndexTTS2 克隆），画面是 9:16 黑底 + 顶部大标题 + 中间 16:9 画框垫原视频片段 + 动画卡片，原声字幕在画框内单行显示，旁白字幕在画框下方，配轻快配乐。当用户说「把这期播客做成视频」「播客解读视频」「播客做成短视频」「用 onepod 这期做个视频」「给这期播客做个介绍视频」时触发。
---

# podcast-explainer-video · 播客解读短视频

```text
<项目>/
  facts.md        ① 提炼：嘉宾、核心观点、可引用的原话（带时间点）、来源
  lines.json      ② 口播稿：一句一场（旁白句 + 原声句）
  quotes.json     ② 原声句：用哪个片段、起止秒、说话人
  edl.json        ③ 每场画框里垫哪段原视频、从第几秒开始
  scenes.mjs      ③ 每场叠在画面上的动画
  voice_raw/ voice/ voice_fast/ align.json   ④ 配音
  out/<标题>.mp4  ⑤ 成片
```

`$K` 指本 skill 目录。完整例子：`examples/zuck-meta-4points/`（扎克伯格 × 亚历山大·王，Cheeky Pint #35，13 场、四个观点、四段原声）。

## ⓪ 立项：先问清楚（缺了才问）

| 项 | 默认 | 说明 |
|---|---|---|
| 播客地址 | 必填 | onepod.site 页面最省事；YouTube / 小宇宙 / 其他链接也行 |
| 时长 | 2 分钟左右 | 2–5 分钟；用户想先看效果就先做 40–60 秒样片（只讲一个观点） |
| 讲几个点 | 3–4 个 | 每点 20–30 秒 |
| 配音 | 先给试听再定 | 见 `references/voices.md`：微软官方音色（快）或 IndexTTS2 克隆（像真人，慢）。用户要克隆自己的声音就让他给 8–12 秒录音 |
| 标题 | 起一个两行的大字标题 | 第一行谁 + 动作，第二行带数字或结论，如「扎克伯格亲口复盘 / Meta做AI的4个打法！」 |
| 配乐 | 合成的轻快配乐，-32 LUFS | 用户给了曲子就放 `out/bgm.wav` |

```bash
bash $K/scripts/init.sh <项目目录>     # 建目录、拷引擎、写默认 config.json
```

## ① 提炼内容 → facts.md

**有 onepod 页面时**：WebFetch 页面，拿到节目名、期数、主持人、嘉宾背景、时长、摘要、要点、章节，以及页面上的原视频链接和官方逐字稿链接。

**只有原链接时**：用 onepod-Skill（github.com/SpaceZephyr/onepod-Skill）里的 skill 提炼：
- YouTube → `youtube-transcript-cn` 转录 + `content-digest` 提炼观点
- 小宇宙 → `xiaoyuzhou-to-article`

facts.md 写这些（只写来源里有的，**不编数字**）：
1. 这期播客：节目名、期数、主持人是谁、时长、在聊什么
2. 嘉宾：一两句话背景
3. 候选观点 5–8 个：每个写清「是什么 + 具体例子或数字 + 谁说的」
4. 每个观点能配的原话：英文原句 + 大概时间点（下一步用字幕定位）

挑 3–4 个最有启发、最好懂的观点，先给用户过目。

## ② 找原声 → quotes.json

```bash
bash $K/scripts/source/subs.sh <项目> <视频网址> "hard mode" "billion" "talent density"   # 自动字幕 + 按关键词找时间点
bash $K/scripts/source/fetch_clips.sh <项目> <视频网址> 52:40-53:32 2:40-3:02 ...          # 只下要用的几段（带声音）
PY=~/.cache/promo-tts/.venv/bin/python; $PY $K/scripts/source/words.py <项目>/assets/src/clip_3160.mp4 5 20   # 逐词时间，定起止
```

除了原声，也顺手下几段「讲解时当画面用」的片段：嘉宾说话的双人镜头、三人全景、主持人单人镜头。

quotes.json：`{"s04": ["clip_3160.mp4", 10.10, 13.00, "亚历山大·王", "英文原句（可选）"]}`，键是这句在 lines.json 里的序号。

**原声规矩**：每段 3–8 秒，只剪最关键的一句；一条视频 2–4 段；必须是讲解的一部分（先讲清楚，再用原声印证），不整段搬运；画框下方写出处。

## ③ 口播稿 → lines.json

结构（`references/script-style.md`）：

1. **开场**：「最近听了一期……：A 和 B 一起上了 C 的节目 XX。」一句说清谁、在哪
2. **目录**：「聊了 X 小时，讲……。我挑了 N 个觉得最有启发的点，分享给大家。」
3. **每个点**：「第 N 点，<一句话结论>。」→ 用大白话讲为什么、举例子或数字 → 引出原声（「他是这么说的」）→ **原声句**
4. **收尾**：把 N 点串成一句话 + 对谁有用

原声句在 lines.json 里写中文译文，**20 字以内**（画框里只显示一行），意思忠实于原话。旁白一句 30–60 字。2 分钟 ≈ 旁白 550 字 + 原声 15–25 秒。

## ④ 配音

```bash
python3 $K/scripts/voice/cut_quotes.py <项目>   # 剪原声：自动去头尾静音，同步改 edl.json 的画面起点（口型对齐）
bash $K/scripts/voice/speak.sh <项目>           # 只配旁白句；config.tts = edge（微软音色）或 index（IndexTTS2 克隆 ref.wav）
bash $K/scripts/voice/prepare.sh <项目>         # 收紧停顿 → 补标点停顿、逐字对齐、逐句对稿
```

对稿只管漏字、多字；英文名被听错（Skill→Scale、Cheeky Pint→Chicky Punt）、同音字不用管。IndexTTS2 很慢，放后台跑；等待时用 `pgrep -f "[c]lone_index.py"`，不要写成会匹配到自己的形式。

## ⑤ 画面 → edl.json + scenes.mjs

**版式**（`scripts/engine/style.css`，1080×1920）：顶部两行大标题（白字蓝影斜体，全片固定）→ 中间 1000×564 圆角画框（垫原视频）→ 画框下方白色旁白字幕 → 最下面灰色出处。

**原声场**：画框左上红色「原声 · 说话人」，画框内底部一行黄色字幕（说话人小标签 + 中文译文），画框下方不显示旁白字幕。用模板里的 `quote("s04")` 直接生成。

**edl.json**：每场画框里垫哪段片段、从第几秒开始；纯图解的场写 `null`（深色底）。讲到谁就用谁说话的镜头。

**scenes.mjs**：照 `references/scenes.md` 和例子写。常用：人名条 `cls: "name"`、观点角标 `point(c, 1, "反着来的创业")`、数字面板 `panel`、支票/卡片、对比图解、目录卡。**叠加的卡片放在画面空的一侧，别挡说话人的脸**。

```bash
node $K/scripts/engine/build.mjs <项目>          # 时间轴 + index.html
python3 $K/scripts/compose/dropcaps.py <项目>    # 原声场去掉旁白字幕（每次 build 后都要跑）
python3 $K/scripts/voice/gaps.py <项目>          # 无声段 ≤ 0.5 秒
node $K/scripts/engine/render.mjs <项目> --stills mid   # 静帧拼图（背景透明，截图是白底，只看叠加层）
```

## ⑥ 渲染合成

```bash
node $K/scripts/compose/render_alpha.mjs <项目>          # 透明动画层 → out/overlay.mov
bash $K/scripts/voice/mixaudio.sh <项目>                 # 旁白 + 原声 -16 LUFS，配乐 -32 LUFS + 说话时压低
python3 $K/scripts/compose/compose.py <项目> "<标题>"    # 黑底 + 原视频片段（圆角）+ 动画层 + 音频 → out/<标题>.mp4
```

抽 6–8 帧看：说话人和镜头对得上；卡片没挡脸；原声字幕一行放得下；旁白字幕没和原声字幕叠在一起。

## ⑦ 交付

成片路径、时长、讲了哪几个点、用了哪几段原声（时间点）、配音方式、最长停顿、需要用户亲耳确认的地方。提醒用户：画面和原声来自原节目，发布前自行确认平台规则。

## 参考

- `references/voices.md`：可选音色、试听做法、克隆用户声音
- `references/script-style.md`：口播稿结构和好坏对照
- `references/scenes.md`：版式坐标、组件、动画参数、常用场景写法
- `references/pitfalls.md`：踩过的坑
