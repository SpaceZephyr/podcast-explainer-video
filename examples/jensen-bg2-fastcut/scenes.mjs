// 快剪版画面层：顶部描边大标题（全片固定）+ 画框里偶尔弹出的英文/数字动态字；画框里的原视频由 compose.py 按 edl.json 逐镜头垫进去
import { A } from "./engine/lib.mjs";
import { readFileSync } from "node:fs";

const CFG = JSON.parse(readFileSync(new URL("./config.json", import.meta.url)));
const [T1, T2] = CFG.title;
const frame = (c, inner = "") =>
  `<div id="tbg"></div><div id="tbg2"></div>
  <div id="hd"><span class="l l1" data-t="${T1}">${T1}</span><span class="l l2" data-t="${T2}">${T2}</span></div>
  <div class="win">${inner}</div>
  <div id="src">${CFG.source}</div>`;
// 动态字：big 大号黄绿色，small 白色小字；at 出现，out 消失（默认到这场结束前）
// 大字按长度缩字号，放得下右半边（mid = 整个画框压暗居中）
const kin = (c, at, big, small = "", { out, mid = false, top = "" } = {}) => {
  const fs = Math.min(150, Math.round((mid ? 960 : 470) / (big.length * .46)));
  return `<div ${A({ at, fx: "up", d: .3, out: out ?? c.end - .3, cls: "kin" + (mid ? " mid" : "") })}>${top ? `<s>${top}</s>` : ""}<b style="font-size:${fs}px">${big}</b>${small ? `<i>${small}</i>` : ""}</div>`;
};
const tag = (c, at, n, r, out) => `<div ${A({ at, fx: "up", d: .3, out: out ?? c.end - .3, cls: "tag" })}><div class="n">${n}</div><div class="r">${r}</div></div>`;
const S = f => c => frame(c, f ? f(c) : "");
// 原声段：不出旁白字幕，按 qsub.json 的时间点逐段出中文（黄）+ 英文（灰）；extra(c, t) 里 t(秒) 把原片段里的秒数换成时间轴时间
const Q = JSON.parse(readFileSync(new URL("./quotes.json", import.meta.url)));
const QS = JSON.parse(readFileSync(new URL("./qsub.json", import.meta.url)));
const quote = (id, extra) => c => {
  const segs = QS[id], q0 = Q[id][1], t = sec => c.vs + (sec - q0);
  const subs = segs.map(([sec, zh, en], i) => {
    const out = i + 1 < segs.length ? Math.max(c.t(0), t(segs[i + 1][0]) - .05) : c.end - .1, fs = zh.length > 15 ? 52 : 58;
    return `<div ${A({ at: Math.max(c.t(0), t(sec) - .05), fx: "fade", d: .1, out, cls: "qs" })} data-od="0.01"><div class="zh" style="font-size:${fs}px">${zh}</div><div class="en">${en}</div></div>`;
  }).join("");
  return frame(c, `<div ${A({ at: c.t(0), fx: "pop", d: .3, cls: "orig" })}><i></i>原声 · ${Q[id][3]}</div>` + (extra ? extra(c, t) : "")) + subs;
};

export const SCENES = [
  S(c => kin(c, c.at("几万亿") - .05, "$ TRILLIONS", "", { mid: true, out: c.at("泡沫") - .1 })
       + kin(c, c.at("泡沫") - .05, "BUBBLE?", "", { mid: true })),
  S(c => tag(c, c.at("黄仁勋") - .05, "黄仁勋", "英伟达创始人兼 CEO", c.at("意外") - .1)
       + kin(c, c.at("需求"), "DEMAND", "NOT THE PROBLEM", { out: c.at("真正愁") - .05 })
       + kin(c, c.at("电和地") - .1, "POWER · LAND", "", { mid: true })),
  S(c => kin(c, c.at("两家"), "2 LABS?", "", { out: c.at("三块") - .05 })
       + kin(c, c.at("传统计算"), "1/3", "CLASSICAL COMPUTING", { out: c.at("前沿") - .05 })
       + kin(c, c.at("前沿"), "< 1/3", "FRONTIER LABS", { out: c.at("剩下") - .05 })
       + kin(c, c.at("成千上万"), "1,000s", "OF NEW AI COMPANIES")),
  S(),
  quote("s05", (c, t) => kin(c, t(17.4), "BIG MISTAKE", "", { out: c.end - .2 })),
  S(),
  quote("s07", (c, t) => kin(c, t(34.9), "80%", "USE OPEN MODELS", { out: t(42.1) })),
  S(c => kin(c, c.at("一两千万"), "$20,000,000", "", { out: c.at("一百美元") - .05 })
       + kin(c, c.at("一百美元"), "$100", "", { top: "$20,000,000 →" })),
  S(),
  quote("s10", (c, t) => kin(c, t(42.1), "×1,000,000", "IN 10 YEARS", { out: t(48.3) })
       + kin(c, t(48.4), "INSATIABLE", "DEMAND", { out: t(53.9) })),
  S(),
  quote("s12", (c, t) => kin(c, t(23.1), "LAND", "POWER · WORKERS", { out: t(34.3) })
       + kin(c, t(34.4), "1,000,000", "NEW JOBS")),
  S(c => tag(c, c.at("主持人") - .05, "克拉克·唐", "Altimeter 合伙人", c.at("他也承认") - .1)
       + kin(c, c.at("明年"), "2027", "THE HARDEST PART")),
  S(),
  quote("s15", (c, t) => kin(c, t(10.1), "FOREVER", "PROBLEM")),
  S(),
  quote("s17", (c, t) => kin(c, t(46.6), "ZERO TRUST", "MINIMUM RIGHTS")),
  S(),
  quote("s19", (c, t) => kin(c, t(23.2), "99.99%", "WE'LL GET THERE")),
  S(c => kin(c, c.at("电、地、人"), "POWER · LAND · PEOPLE", "", { mid: true })),
  S(),
];
