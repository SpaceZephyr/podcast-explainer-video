---
name: podcast-clip-video
description: 把一期播客剪成 1 分钟左右的单观点原声切片（2:3 竖版，没有旁白）：从播客里挑一个反常识、能一句话说清的观点，剪嘉宾 45–70 秒的原声（可在前面接主持人 3–8 秒的提问当钩子），画面是黑底 + 顶部「人物：观点」白字黄重点大标题 + 中间通栏原片 + 下方按原话分段的中英字幕 + 底部随内容切换的大字结论，配同风格封面。当用户说「剪一分钟播客」「播客切片」「单观点短视频」「只放原声不要旁白」「像硅谷好胖友那样剪」「把这段访谈剪成一分钟」时触发；也支持批量攒十几条（clip/batch）和定时发布到小红书（「多剪几条」「每天发两条」「定时发布」）。要旁白串讲多个观点的解读视频用 podcast-explainer-video。
---

# podcast-clip-video · 一分钟原声切片

和 `podcast-explainer-video` 在同一个仓库（本目录是仓库里的 `clip/`），共用 `../scripts/` 的下载、剪原声、渲染、合成脚本。`$K` 指仓库根目录（`clip/..`）。

完整例子：`$K/examples/figma-dylan-clip/`（All-In × Figma CEO Dylan Field，「别把模型进步当成产品进步」，67 秒：主持人 5 秒钩子 + Dylan 61 秒原声）。

```text
<项目>/
  config.json     标题两行（第二行 <y>…</y> 标黄）、出处
  lines.json      每段原声一句中文概括（只用来定场数）
  quotes.json     {"s01": ["clip_748.mp4", 起秒, 止秒, "说话人"], ...}
  qsub.json       每段原声的分段字幕 [[原片段里的秒, "中文", "English"], ...]
  scenes.mjs      人名条 who()、底部大字 take()
  cover/cover.html → cover.png
  out/<标题>.mp4
```

## ① 选播客、选观点

- 找最近更新：`podcast-workflow` / `youtube-feed`；YouTube 页面抓不到时直接读频道 RSS（`https://www.youtube.com/feeds/videos.xml?channel_id=UC…`）。
- 挑的标准：嘉宾有名（CEO、创始人、投资人、运动员），**一个观点一句话能说清，而且反常识或有冲突**（外界说 A，他说 B）。官方切的 Shorts 标题往往就是最好的那句，可以顺着 Shorts 找到正片里的位置。
- 一条视频只讲一个观点。不要把三个观点拼成一分钟。

## ② 找原话、下片段

```bash
bash $K/scripts/source/subs.sh <项目> <视频网址> "关键词" "另一个关键词"      # 自动字幕 → 找时间点
bash $K/scripts/source/fetch_clips.sh <项目> <视频网址> 12:28-12:50 14:12-16:15  # 只下要用的段，前后留余量
PY=~/.cache/promo-tts/.venv/bin/python; HF_HUB_OFFLINE=1 $PY $K/scripts/source/words.py <项目>/assets/src/clip_852.mp4 44 120   # 逐词时间
```

剪法：
- **主体**：嘉宾一段连续的回答，45–65 秒，从他开始讲理由的那句起（「Look, the hard part is…」），到一个自然的句号收。中间主持人插一句没关系，字幕写「主持人：…」。
- **钩子（可选）**：主持人的提问或外界说法，3–8 秒，放最前面（「市场一看就说：Figma 完了」）。
- 总长 50–75 秒。嘉宾自己的停顿不剪，硬切会跳画面。

## ③ 字幕 qsub.json

按逐词时间把原话切成一句一段，每段 2–5 秒；中文 ≤17 字（超过自动缩字号），意思忠实，口语化，不加「他认为」之类的转述；英文放原话。时间点写原片段里的秒数。

## ④ 标题、大字、文案

规则和例子见 `references/titles.md`。要点：
- 画面顶部两行：第一行「人物身份 + 场合：」小一号白字；第二行观点，大号白字，1–2 个关键词标黄（`<y>…</y>`）。
- 底部大字：开头放背景或问题（「Claude Design 一上线 / 市场就喊：Figma 要完了」→「Figma CEO 怎么看？」），说到核心那句时换成结论（「<y>模型进步</y> ≠ <y>产品进步</y>」），结尾补一行小字收束。
- 发布标题 ≤20 字：「人物：观点」。

## ⑤ 渲染合成

```bash
bash $K/clip/init.sh <项目>
python3 $K/scripts/voice/cut_quotes.py <项目>        # 剪原声 + 写 edl.json（口型对齐）
node $K/scripts/engine/build.mjs <项目>
python3 $K/scripts/compose/dropcaps.py <项目>
node $K/scripts/compose/render_alpha.mjs <项目>
bash $K/scripts/voice/mixaudio.sh <项目>             # 配乐压到 -40 LUFS，基本只剩原声
python3 $K/scripts/compose/compose.py <项目> "<标题>"
```

build.mjs 提示「时长不在 2–5 分钟范围内」是给解读视频的，切片版忽略。

## ⑥ 封面

`cover/cover.html`：黑底，上面「人物身份：」+ 第一半观点（大字，关键词黄），中间嘉宾截图（从原片里挑一帧表情好、手在动的），下面第二半观点（更大）+ 一行小字。用 Chrome 截图：

```bash
"/Applications/Google Chrome.app/Contents/MacOS/Google Chrome" --headless=new --hide-scrollbars --window-size=1080,1620 --screenshot=$PWD/cover/cover.png file://$PWD/cover/cover.html
ffmpeg -i out/<标题>.mp4 -i cover/cover.png -map 0 -map 1 -c copy -c:v:1 png -disposition:v:1 attached_pic out/tmp.mp4 && mv out/tmp.mp4 out/<标题>.mp4
```

## ⑦ 交付

抽 8–10 帧看：字幕换句是硬切、不叠；大字没盖住字幕；人名条没压到节目台标。交付成片路径、时长、用了原片哪几段（时间点）、标题和文案草稿。画面和原声来自原节目，发布时文案里写清出处，不开原创声明。

## ⑧ 批量：一次攒十几二十条

一期剪 1 条太慢时，用 `batch/`：所有切片的内容写进一个 `spec.py`，脚本建项目、并行渲染、抽帧、发布。

```text
<工作目录>/
  spec.py            每条切片的标题、原声段、字幕、大字、封面（照 batch/spec.example.py 写）
  posts.py           发布时间、标题、正文、话题（照 batch/posts.example.py 写）
  <ep>/assets/src/   每期节目下载的原片段（subs.sh + fetch_clips.sh + words.py）
  <id>/              gen.py 生成的切片项目
  fr/                sheet.sh 抽的检查图
```

```bash
B=$K/clip/batch
python3 $B/gen.py <工作目录> [id ...]       # 按 spec.py 生成项目（scenes.mjs、qsub.json、封面…）
bash $B/runall.sh <工作目录> id1 id2 ...    # 两路并行渲染，日志在 <id>/run.log，失败的会打 FAIL
bash $B/sheet.sh <工作目录>/<id>            # 6 帧 + 封面拼一张，逐条看
```

选题：别一期剪到底，多找不同大佬（黄仁勋、马斯克、Dario、小扎、纳德拉、劈柴、奥特曼…）近一两个月的热门访谈，每人 2–3 条；排期时交错不同人物，同一个人不要连着发。找近期视频：YouTube 搜索加「本月」过滤（`results?search_query=…&sp=EgIIBA%253D%253D`），yt-dlp `--flat-playlist` 列出来看播放量。

踩过的坑：
- zsh 里 URL 要加引号（`?` 会被当通配符）；`set -- $e` 在 zsh 不拆词，循环用 `while read`。
- YouTube 字幕偶尔 429，隔几分钟单独重试；不要并行狂拉。
- 带小字的大字（take 的第二行）和结尾小字（small）同时出现会叠在一起，二选一。
- 底部大字一行 ≤12 个汉字，再长会被裁掉。
- 封面截图要挑嘉宾的近景，别截到主持人或全景。
- 无头 Chrome 并发截图会失败，run.sh 已给每个项目单独的 user-data-dir。

## ⑨ 定时发布到小红书

用 Claude in Chrome 操作创作服务平台（creator.xiaohongshu.com），先登录好账号。

```bash
python3 $B/serve.py <工作目录> &                    # 成片和封面挂到 127.0.0.1:8765
python3 $B/publish.py <工作目录> <id> <tabId> [id2]  # 输出 browser_batch 的 actions，直接传给 browser_batch
```

一条笔记：上传视频 → 编辑封面换成 cover.png → 标题 → 正文 → 话题（输入后等 1.5 秒回车选第一个）→ 打开「定时发布」，时间框 cmd+A 直接输入 `2026-10-24 08:00` → 提交。每步有校验：标题不一致、话题没变成 `[话题]`、时间不对都会让 batch 停下，不会发出错的笔记。一个 batch 放 ≤2 条，多了容易超时；超时后先去「笔记管理」看哪些已经发了，避免重复。

改已排期笔记的时间：笔记管理里每张卡片 `.note-card__action-btn` 第二个是编辑，进去改时间框再点「定时发布」。笔记管理是懒加载，要滚到底才能看全。
