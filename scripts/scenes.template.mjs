// 播客解读视频的画面层。一句旁白（或一段原声）一场，场景函数返回叠在原视频上的 HTML；画框里的原视频由 compose.py 按 edl.json 垫进去
// 写法见 references/scenes.md，完整例子见 examples/zuck-meta-4points/scenes.mjs
import { A } from "./engine/lib.mjs";
import { readFileSync } from "node:fs";

const B = "#2F54FF";
const CFG = JSON.parse(readFileSync(new URL("./config.json", import.meta.url)));
const Q = JSON.parse(readFileSync(new URL("./quotes.json", import.meta.url)));
// 每场共用：顶部固定大标题、画框、画框下方出处
const frame = (c, inner, first = false) =>
  `<div ${A({ at: first ? c.t(0) : 0, fx: first ? "pop" : "none", d: .5 })} id="hd"><span style="display:inline-block;transform:skewX(-8deg)">${CFG.title.join("<br>")}</span></div>
  <div class="win">${inner}</div>
  <div id="src">${CFG.source}</div>`;
const pos = (x, y, inner, a, st = "") => `<div ${a} style="position:absolute;left:${x}px;top:${y}px;${st}">${inner}</div>`;
const point = (c, n, t) => pos(0, 0, `<div class="pt"><b>${n}</b>${t}</div>`, A({ at: c.t(.05), fx: "pop" }));
const dim = (c, o = .72) => `<div ${A({ at: c.t(0), fx: "fade", d: .35 })} style="position:absolute;inset:0;background:rgba(4,6,14,${o})"></div>`;
const panel = (t, st = "") => `<div class="panel" style="padding:16px 24px;font-size:30px;font-weight:800;${st}">${t}</div>`;

// 原声场：画框左上「原声 · 说话人」，画框内底部一行黄色中文字幕（字号按字数自动缩；译文写到 20 字以内）
const quote = id => c => {
  const who = Q[id][3], zh = c.text.replace(/[。！]$/, "");
  const fs = Math.max(30, Math.min(46, Math.floor(760 / (zh.length + 2))));   // 一行放得下：译文压到 20 字以内
  return frame(c, `<div ${A({ at: c.t(.05), fx: "pop", cls: "orig" })}><i></i>原声 · ${who}</div>
    <div ${A({ at: c.t(0), fx: "fade", d: .2, cls: "qin" })}><span class="who">${who}</span><span class="zh" style="font-size:${fs}px">“${zh}”</span></div>`);
};

export const SCENES = [];
