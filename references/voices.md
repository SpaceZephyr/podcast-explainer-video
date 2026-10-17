# 配音：音色选择

先给用户做试听（同一两句话用几种音色各出一版），让用户选，别替用户定。

## 可选

| 方式 | config | 特点 |
|---|---|---|
| 微软 云扬 | `"tts": "edge", "voice": "zh-CN-YunyangNeural"` | 成熟、专业的男声，播报感偏强 |
| 微软 云希 | `zh-CN-YunxiNeural` | 年轻、阳光的男声 |
| 微软 云健 | `zh-CN-YunjianNeural` | 有激情，适合讲故事 |
| 微软 晓晓 | `zh-CN-XiaoxiaoNeural` | 温暖亲切的女声 |
| 微软 Brian / Andrew（多语种） | `en-US-BrianMultilingualNeural` | 对话型，口气随意，念中文略带口音 |
| IndexTTS2 克隆 | `"tts": "index"` + `<项目>/ref.wav` | 停顿和语气最像真人；慢（实时率 10–30 倍，1 分钟旁白约 10–15 分钟） |

语速：edge 用 `rate`（+10%～+15% 比较顺），IndexTTS2 用 config `speed`（1.05～1.1，finalize 整体变速）。

## 试听

```bash
ET=edge-tts   # pip install edge-tts
for v in zh-CN-YunyangNeural zh-CN-YunjianNeural en-US-BrianMultilingualNeural; do
  $ET --voice $v --rate=+10% --text "<稿子第一句>" --write-media 试听_$v.mp3; done
```

IndexTTS2 试听：建一个只有两句的临时项目，`bash speak.sh <临时项目>`。

## IndexTTS2 的参考声音

- 最好用用户自己的声音：8–12 秒、一个人说、没背景音、**结尾截在一句话说完的地方**，转成 `ref.wav`（`ffmpeg -i 录音.m4a -ss 起 -to 止 -ar 24000 -ac 1 ref.wav`）。
- 没有录音时，可以用一段微软音色念的中性句子当参考，生成出来比直接用微软音色自然。
- 不要克隆播客嘉宾或其他真人的声音。

## 安装

- edge-tts：`pip install edge-tts`（或装进 Whisper 那个 venv）
- IndexTTS2：`git clone https://github.com/index-tts/index-tts ~/.local/opt/index-tts`，按它的 README 用 uv 装环境、下载 checkpoints
- Whisper 对齐/对稿（可选，Apple 芯片）：mlx-audio + whisper-turbo + pypinyin，`PY` 指向这个 Python
