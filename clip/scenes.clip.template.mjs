// 一分钟原声切片：没有旁白，全程原声；顶部标题固定，画框下按原话分段出中英字幕，底部大字随内容换
import { A } from "./engine/lib.mjs";
import { readFileSync } from "node:fs";

const CFG = JSON.parse(readFileSync(new URL("./config.json", import.meta.url)));
const Q = JSON.parse(readFileSync(new URL("./quotes.json", import.meta.url)));
const QS = JSON.parse(readFileSync(new URL("./qsub.json", import.meta.url)));
const frame = (c, inner = "", under = "") =>
  `<div id="hd"><span class="t1">${CFG.title[0]}</span><span class="t2">${CFG.title[1]}</span></div>
  <div class="win">${inner}</div>${under}
  <div id="src">${CFG.source}</div>`;
// 原声段：字幕跟着原话时间点换句（硬切）；t(秒) 把原片段里的秒数换成时间轴时间
const quote = (id, extra) => c => {
  const segs = QS[id], q0 = Q[id][1], t = sec => c.vs + (sec - q0);
  const subs = segs.map(([sec, zh, en], i) => {
    const out = i + 1 < segs.length ? Math.max(c.t(0), t(segs[i + 1][0]) - .05) : c.end - .05;
    const fs = zh.length <= 13 ? 56 : zh.length <= 17 ? 50 : 44;
    return `<div ${A({ at: Math.max(c.t(0), t(sec) - .05), fx: "none", out, cls: "qs" })} data-od="0.01"><div class="zh" style="font-size:${fs}px">${zh}</div><div class="en">${en}</div></div>`;
  }).join("");
  const [inner, under] = extra ? extra(c, t) : ["", ""];
  return frame(c, inner, under) + subs;
};
const who = (at, out, n, r) => `<div ${A({ at, fx: "up", d: .3, out, cls: "who" })}><b>${n}</b><i>${r}</i></div>`;
const take = (at, out, k, s = "") => `<div ${A({ at, fx: "up", d: .35, out, cls: "take" })}><div class="k">${k}</div>${s ? `<div class="s">${s}</div>` : ""}</div>`;

// 每段原声一场，和 lines.json、quotes.json、qsub.json 的序号一一对应
// who(出现, 消失, 名字, 身份)：画框左下人名条；take(出现, 消失, 大字, 小字)：画框下方的大字结论，<y>…</y> 标黄
// t(秒) 用原片段里的秒数定时间，和 qsub.json 的时间点同一套
export const SCENES = [
  // 可选的开场钩子：主持人的提问 / 外界的说法（3–8 秒）
  quote("s01", (c, t) => [who(c.t(.1), c.end - .2, "主持人", "节目名"),
    take(c.t(.1), c.end - .05, "背景一句话", "外界怎么说")]),
  // 主体：嘉宾一段连续的回答（45–65 秒），说到核心那句时大字换成结论
  quote("s02", (c, t) => [who(c.t(.1), c.t(6), "嘉宾名", "身份"),
    take(c.t(.1), t(77.2), "他怎么看？") +
    take(t(77.3), c.end + 1, "<y>核心词</y> ≠ <y>核心词</y>")]),
];
