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

export const SCENES = [
  quote("s01", (c, t) => [who(c.t(.1), c.end - .2, "主持人", "All-In"),
    take(c.t(.1), c.end - .05, "Claude Design 一上线", "市场就喊：Figma 要完了")]),
  quote("s02", (c, t) => [who(c.t(.1), t(58), "Dylan Field", "Figma 联合创始人兼 CEO"),
    take(c.t(.1), t(77.2), "Figma CEO 怎么看？") +
    take(t(77.3), c.end + 1, "<y>模型进步</y> ≠ <y>产品进步</y>") +
    `<div ${A({ at: t(98.4), fx: "up", d: .35, cls: "take" })} style="top:1412px"><div class="s">专业工具，得一点点磨</div></div>`]),
];
