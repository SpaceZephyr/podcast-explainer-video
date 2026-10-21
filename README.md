# podcast-explainer-video

两个 Claude Code skill，放在同一个仓库里，共用 `scripts/` 的下载、剪原声、渲染、合成脚本：

| skill | 位置 | 做什么 |
|---|---|---|
| `podcast-explainer-video` | 仓库根目录 | 2–5 分钟解读视频：旁白串场 + 多段原声，支持快剪原声版（2:3，跟着字幕切镜头，原声配中英字幕） |
| `podcast-clip-video` | `clip/` | 1 分钟单观点原声切片：没有旁白，顶部「人物：观点」大标题，下方中英字幕，底部大字结论 |

装第二个 skill：`ln -s ~/.claude/skills/podcast-explainer-video/clip ~/.claude/skills/podcast-clip-video`

下面先介绍解读视频。

## 做出来是什么样

- **结构**：谁上了这期播客 → 挑 3–4 个有启发的点 → 每点先用大白话讲清楚，再插一句嘉宾原声 → 最后串成一句话
- **画面**：9:16 黑底，顶部两行大标题，中间 16:9 画框垫原节目片段，叠人名条、观点角标、数字卡片、图解动画
- **字幕**：旁白字幕白色，在画框下方；原声字幕黄色、单行，在画框内底部，左上角标「原声 · 说话人」
- **配音**：用户自己选——微软官方音色（云扬、云希、云健、晓晓等），或 IndexTTS2 克隆一段参考声音；无声段不超过 0.5 秒
- **配乐**：程序合成的轻快配乐，比人声低约 15 dB，说话时自动压低

## 内容从哪来

- 给 [onepod.site](https://onepod.site) 的单期页面：直接读页面上的摘要、核心观点、嘉宾介绍和原视频链接
- 给 YouTube / 小宇宙链接：配合 [onepod-Skill](https://github.com/SpaceZephyr/onepod-Skill) 的 `youtube-transcript-cn`、`content-digest`、`xiaoyuzhou-to-article` 提炼
- 原声定位：拉原视频的自动字幕按关键词找时间点，再用 Whisper 逐词时间精确剪 3–8 秒

## 安装

```bash
git clone https://github.com/SpaceZephyr/podcast-explainer-video ~/.claude/skills/podcast-explainer-video
cd ~/.claude/skills/podcast-explainer-video/scripts && npm i
pip install edge-tts numpy
```

依赖：Node 22+、ffmpeg、Chrome、[uv](https://docs.astral.sh/uv/)（用 `uvx yt-dlp` 下片段）。可选：IndexTTS2（克隆配音）、mlx-audio + whisper-turbo + pypinyin（逐字对齐、对稿、定原声起止，Apple 芯片）。

## 用法

在 Claude Code 里说：

> 把这期播客做成两分钟的解读视频：https://onepod.site/p/xxxx/

skill 会先问时长、讲几个点、用什么声音（可以先出试听），再依次提炼内容 → 找原声 → 写稿给你过目 → 配音 → 画面 → 合成。每一步的命令见 [SKILL.md](SKILL.md)。

## 目录

```text
SKILL.md                    流程
scripts/init.sh             建项目
scripts/source/             subs.sh 拉字幕找原话 · fetch_clips.sh 下片段 · words.py 逐词时间
scripts/voice/              cut_quotes.py 剪原声 · speak.sh 配音（edge / IndexTTS2）· prepare.sh 收紧停顿和对稿 · gaps.py 查空白 · mixaudio.sh 混音 · bgm.py 合成配乐
scripts/engine/             时间轴和动画引擎、样式
scripts/compose/            dropcaps.py · render_alpha.mjs 透明动画层 · compose.py 垫原视频合成
scripts/scenes.template.mjs 画面模板（标题、画框、原声字幕）
references/                 音色、口播稿、画面、踩过的坑
examples/zuck-meta-4points/ 例子：扎克伯格 × 亚历山大·王（Cheeky Pint #35），四个观点 + 四段原声
```

例子只含稿子、原声时间点和画面代码，不含原节目的视频和音频；按 config.json 里的视频链接用 `fetch_clips.sh` 重新下载。

## 注意

画面和原声来自原节目。原声每段只剪最关键的一句，作为讲解的引用；发布前请自行确认平台规则。

MIT License
