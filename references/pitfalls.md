# 踩过的坑

| 问题 | 现象 | 处理 |
|---|---|---|
| 原声开头有空白 | 原声前后出现 0.6 秒无声 | cut_quotes.py 自动去头尾静音，并同步改 edl.json 的画面起点 |
| 旁白字幕和原声字幕叠在一起 | 画框下方两套字幕重叠 | 每次 build.mjs 之后跑 dropcaps.py |
| 原声字幕一行放不下 | 字太小或被截断 | 译文压到 20 字以内 |
| 卡片挡住说话人的脸 | 数字面板压在扎克伯格脸上 | 卡片放画面空的一侧；看抽帧检查 |
| 镜头和旁白对不上 | 说扎克伯格时画面是主持人 | 先拼片段缩略图看谁在镜头里，再写 edl.json |
| 一个元素写了两个 class | 标签挤成竖排、动画不出 | `A({ cls: "orig" })`，不另写 class；绝对定位的文字块加 `white-space:nowrap` |
| 画框高度是奇数 | libx264 报 height not divisible by 2 | 画面片段用 1000×564 |
| 静帧拼图是白底 | 透明背景截图默认填白 | 正常；看成片抽帧才是真效果 |
| yt-dlp 偶发 SSL 断开 | Unable to download API page | fetch_clips.sh / subs.sh 自动重试 |
| zsh 下输出模板里的 % 被当成通配 | no matches found: clip_%(...)s | 模板加单引号 |
| 等后台任务的循环永远不结束 | `pgrep -f clone_index.py` 匹配到了循环自己 | 用 `pgrep -f "[c]lone_index.py"` |
| 微软音色太机械 | 用户觉得像播报 | 试 IndexTTS2 克隆，或对话型 Brian 音色 |
| 看完没收获 | 只讲了故事和数字 | 按「谁 → 几个点 → 每点讲清 + 原声 → 串起来」写，每点开头先给结论 |
