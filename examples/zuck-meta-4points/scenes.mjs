// 播客解读视频的画面层。一句旁白（或一段原声）一场，场景函数返回叠在原视频上的 HTML；画框里的原视频由 compose.py 按 edl.json 垫进去
// 例子：扎克伯格 × 亚历山大·王，Cheeky Pint #35，四个启发 + 四段原声
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

// 1 谁上了这期播客
function s1(c) {
  const z = c.at("扎克伯格"), w = c.at("亚历山大·王"), h = c.at("科里森"), pod = c.at("Cheeky Pint");
  return frame(c, `
    <div ${A({ at: z - .1, fx: "up", cls: "name" })} style="left:380px;top:410px"><div class="n">扎克伯格</div><div class="r">Meta 创始人兼 CEO</div></div>
    <div ${A({ at: w - .1, fx: "up", cls: "name" })} style="left:690px;top:410px"><div class="n">亚历山大·王</div><div class="r">Meta 首席 AI 官</div></div>
    <div ${A({ at: h - .1, fx: "up", cls: "name" })} style="left:24px;top:410px"><div class="n">约翰·科里森</div><div class="r">主持人 · Stripe 联合创始人</div></div>
    ${pos(24, 22, `<span class="chip"><b>播客</b> Cheeky Pint · 第 35 期</span>`, A({ at: pod - .2, fx: "up" }))}`, true);
}

// 2 四个启发（目录）
function s2(c) {
  const long = c.at("两个多小时"), four = c.at("四个");
  const items = ["做前沿 AI，是反着来的创业", "敢下重注，因为留了退路", "好不好用，写在模型里", "人不用多，密度最重要"];
  return frame(c, `${dim(c, .78)}
    ${pos(30, 26, `<span class="chip">时长 <b>2 小时 14 分</b> · 聊 Meta 怎么做前沿 AI</span>`, A({ at: long - .1, fx: "up" }))}
    ${items.map((t, i) => pos(120, 120 + i * 100, `<div style="display:flex;align-items:center;gap:20px;font-size:40px;font-weight:800;white-space:nowrap"><b style="display:grid;place-items:center;width:58px;height:58px;border-radius:50%;background:${B};font-size:32px">${i + 1}</b>${t}</div>`, A({ at: four + .1 + i * .35, fx: "up" }))).join("")}`);
}

// 3 第一点：图解
function s3(c) {
  const lean = c.at("先做一点"), dc = c.at("数据中心"), late = c.at("就晚了");
  const box = (t, st = "") => `<div style="padding:16px 26px;border-radius:14px;font-size:34px;font-weight:800;white-space:nowrap;${st}">${t}</div>`;
  return frame(c, `
    <div style="position:absolute;inset:0;background:radial-gradient(circle at 50% 40%,#151a33,#06070d)"></div>
    ${point(c, 1, "反着来的创业")}
    ${pos(50, 110, `<div style="font-size:30px;color:#9aa3b8;font-weight:700">普通创业</div>`, A({ at: lean - .3, fx: "fade" }))}
    ${["做一点", "验证", "再加钱"].map((t, i) => pos(50 + i * 300, 156, box(t, "background:#1d2235;border:2px solid #39405c"), A({ at: lean + i * .3, fx: "up" })) + (i < 2 ? pos(240 + i * 300, 166, `<div style="font-size:44px;color:#6d7488">→</div>`, A({ at: lean + .15 + i * .3, fx: "fade" })) : "")).join("")}
    ${pos(50, 280, `<div style="font-size:30px;color:#8EA2FF;font-weight:700">前沿 AI</div>`, A({ at: dc - .3, fx: "fade" }))}
    ${pos(50, 326, box("先建数据中心", `background:${B};color:#fff`), A({ at: dc, fx: "pop" }))}
    ${pos(330, 360, `<div style="width:330px;height:5px;background:repeating-linear-gradient(90deg,#8EA2FF 0 18px,transparent 18px 30px)"></div>`, A({ at: c.at("好几年") - .1, fx: "wipe", d: 1 }))}
    ${pos(410, 306, `<div style="font-size:28px;color:#b9c1d6">提前好几年</div>`, A({ at: c.at("好几年"), fx: "fade" }))}
    ${pos(680, 326, box("模型才出来", "background:#1d2235;border:2px dashed #6d7488;color:#b9c1d6"), A({ at: c.at("模型做出来"), fx: "up" }))}
    ${pos(0, 450, `<div class="big" style="width:1000px;text-align:center;font-size:60px;color:#FF5A5F">等结果再投 = 晚了</div>`, A({ at: late - .1, fx: "pop" }))}`);
}

// 5 第一点：支票 + 成本
function s5(c) {
  const chk = c.at("一千亿"), gw = c.at("一吉瓦"), run = c.at("一百五十亿");
  return frame(c, `${point(c, 1, "反着来的创业")}
    <div ${A({ at: chk - .5, fx: "up" })} style="position:absolute;left:520px;top:40px"><div class="card" style="position:relative;transform:rotate(-4deg);width:440px;height:210px;padding:18px 24px;background:#F4F1E8">
      <div style="font-size:14px;color:#555;letter-spacing:2px;font-weight:700">META PLATFORMS, INC.</div>
      <div style="margin-top:10px;font-size:14px;color:#777">去年年底 · 模型还没影子</div>
      <div class="big" style="margin-top:16px;font-size:52px">$<span ${A({ at: chk - .2, fx: "count", d: .4 })} data-count="0,1000">1000</span><span ${A({ at: chk + .5, fx: "fade", d: .2 })}>–<span ${A({ at: chk + .5, fx: "count", d: .5 })} data-count="1000,2000">2000</span></span>亿</div>
      <svg ${A({ at: chk + 1.1, fx: "draw", d: .7 })} width="170" height="54" viewBox="0 0 300 90" style="position:absolute;right:22px;bottom:12px;overflow:visible"><path pathLength="1" d="M8 60 C 40 10, 60 80, 90 40 S 140 20, 150 55 S 200 70, 215 30 S 260 50, 292 38" fill="none" stroke="#1d2a8f" stroke-width="5" stroke-linecap="round"/></svg>
    </div></div>
    ${pos(560, 330, `<div class="panel" style="padding:14px 22px;width:400px"><div style="font-size:24px;color:#b9c1d6">一个 1 吉瓦集群</div><div class="big" style="font-size:44px">运行一年 <span class="blue">$150 亿</span></div></div>`, A({ at: gw - .1, fx: "up" }))}`);
}

// 6 第二点：留退路
function s6(c) {
  const hard = c.at("硬通货"), win = c.at("抢着买"), lose = c.at("就算失败");
  return frame(c, `${point(c, 2, "留好退路")}
    ${pos(540, 110, panel(`算力 = <span class="blue">硬通货</span>`), A({ at: hard - .1, fx: "up" }))}
    ${pos(540, 210, panel(`AI 成了 → 别人抢着买算力`), A({ at: win - .4, fx: "up" }))}
    ${pos(540, 310, panel(`AI 败了 → 拿去做推荐`), A({ at: lose, fx: "up" }))}`);
}

// 8 第三点：体验写在模型里
function s8(c) {
  const items = [["什么时候主动帮你", c.at("主动帮你")], ["怎么用工具", c.at("怎么用工具")], ["用什么语气说话", c.at("语气")]];
  const train = c.at("靠的是训练");
  return frame(c, `
    <div style="position:absolute;inset:0;background:radial-gradient(circle at 50% 40%,#151a33,#06070d)"></div>
    ${point(c, 3, "体验写在模型里")}
    ${items.map(([t, at], i) => pos(60 + i * 310, 140, `<div style="width:280px;height:150px;border-radius:18px;background:#1d2235;border:2px solid #39405c;display:grid;place-items:center;font-size:32px;font-weight:800;text-align:center;white-space:normal;padding:0 20px">${t}</div>`, A({ at: at - .1, fx: "up" }))).join("")}
    ${pos(0, 340, `<div style="width:1000px;text-align:center;font-size:56px;font-weight:900">靠<span style="color:#8EA2FF">训练</span>，不是界面</div>`, A({ at: train - .1, fx: "pop" }))}
    ${pos(400, 372, `<div style="width:170px;height:6px;background:#FF5A5F;transform:rotate(-6deg);margin-left:330px"></div>`, A({ at: c.at("不是界面"), fx: "wipe", d: .3 }))}`);
}

// 9 第三点：训练馆
function s9(c) {
  const cam = c.at("摄像头"), min = c.at("一分钟");
  return frame(c, `${point(c, 3, "体验写在模型里")}
    ${pos(560, 120, panel(`格斗训练馆 · 装了摄像头`), A({ at: cam - .2, fx: "up" }))}
    ${pos(560, 220, `<div class="panel" style="padding:14px 24px"><div style="font-size:24px;color:#b9c1d6">每回合休息</div><div class="big" style="font-size:64px"><span ${A({ at: min - .1, fx: "count", d: .6 })} data-count="0,60">60</span> 秒</div></div>`, A({ at: min - .2, fx: "up" }))}
    ${pos(560, 390, panel(`Muse 看录像 · 给建议`), A({ at: c.at("看录像"), fx: "up" }))}`);
}

// 11 第四点：团队
function s11(c) {
  const lt = c.at("不到两百人"), flat = c.at("层级");
  return frame(c, `${point(c, 4, "人少而精")}
    ${pos(560, 120, `<div class="panel" style="padding:16px 24px"><div style="font-size:26px;color:#b9c1d6">研究团队</div><div class="big" style="font-size:76px">&lt; 200 <span style="font-size:40px">人</span></div></div>`, A({ at: lt - .2, fx: "pop" }))}
    ${pos(560, 330, panel(`层级压得很平`), A({ at: flat - .1, fx: "up" }))}`);
}

// 13 收尾
function s13(c) {
  const steps = [["先押注", c.at("先押注")], ["留退路", c.at("留退路")], ["体验做进模型", c.at("做进模型")], ["小而精的团队", c.at("小而精")]];
  return frame(c, `${dim(c, .8)}
    ${pos(0, 50, `<div style="width:1000px;text-align:center;font-size:32px;color:#b9c1d6">四点连起来看</div>`, A({ at: c.t(.1), fx: "fade" }))}
    ${steps.map(([t, at], i) => pos(70 + i * 225, 180, `<div style="width:200px;height:160px;border-radius:18px;background:${i === 3 ? B : "#1d2235"};border:2px solid #39405c;display:grid;place-items:center;text-align:center;font-size:34px;font-weight:900;white-space:normal;padding:0 14px">${t}</div>`, A({ at: at - .1, fx: "pop" }))).join("")}
    ${pos(0, 410, `<div style="width:1000px;text-align:center;font-size:36px;font-weight:800">做 AI 产品的人，都值得琢磨</div>`, A({ at: c.at("做 AI 产品") - .1, fx: "up" }))}`);
}

export const SCENES = [s1, s2, s3, quote("s04"), s5, s6, quote("s07"), s8, s9, quote("s10"), s11, quote("s12"), s13];
