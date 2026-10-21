// 把 lines.json + scenes.mjs + 配音时长拼成 index.html（动画时间轴 + 字幕）
// 用法：node engine/build.mjs [项目目录]
import { readFileSync, writeFileSync, existsSync } from "node:fs";
import { execFileSync } from "node:child_process";
import path from "node:path";
import { pathToFileURL } from "node:url";

const P = path.resolve(process.argv[2] || ".");
const cfg = { W: 1080, H: 1440, speed: 1.2, lead: .4, tail: .45, outro: 2.4, voiceDir: "voice_fast", ...(existsSync(`${P}/config.json`) ? JSON.parse(readFileSync(`${P}/config.json`)) : {}) };
const { SCENES } = await import(pathToFileURL(`${P}/scenes.mjs`));
const lines = JSON.parse(readFileSync(`${P}/lines.json`));
if (SCENES.length !== lines.length) throw new Error(`scenes.mjs 有 ${SCENES.length} 场，lines.json 有 ${lines.length} 句，要一一对应`);
const id = i => `s${String(i + 1).padStart(2, "0")}`;
const dur = lines.map((_, i) => +execFileSync("ffprobe", ["-v", "error", "-show_entries", "format=duration", "-of", "csv=p=0", `${P}/${cfg.voiceDir}/${id(i)}.wav`]).toString());
const ALIGN = existsSync(`${P}/align.json`) ? JSON.parse(readFileSync(`${P}/align.json`)) : {};

// 有 align.json（repause.py 产出的逐字真实时间）就用它；没有就按字数估
const wt = ch => /[，、]/.test(ch) ? 2 : /[。？！：；]/.test(ch) ? 3 : /\s/.test(ch) ? 0 : /[A-Za-z0-9]/.test(ch) ? .45 : 1;
function charTimes(text, d, key) {
  if (ALIGN[key] && ALIGN[key].length === text.length) return ALIGN[key].map(t => Math.min(t / cfg.speed, d));
  const w = [...text].map(wt), tot = w.reduce((a, b) => a + b, 0); let acc = 0;
  return w.map(x => { const t = acc / tot * d; acc += x; return t; });
}

// 字幕：config.capMax（每行最多几个字宽，英文算半个）、config.capMap（只改字幕显示，如「百分之九十九点九九」→「99.99%」）
const CAPMAX = cfg.capMax || 15, CAPMAP = cfg.capMap || {};
const cw = s => [...s].reduce((n, ch) => n + (/[\x00-\x7f]/.test(ch) ? .55 : 1), 0);
const capMap = s => Object.entries(CAPMAP).reduce((x, [k, v]) => x.split(k).join(v), s);
function splitCap(raw, off, text) {
  const k = off + text.slice(off).indexOf(raw), w = cw(capMap(raw)), n = Math.ceil(w / CAPMAX);
  if (n <= 1) return [[k, k + raw.length, raw]];
  const out = []; let s0 = 0;
  for (let i = 1; i <= n; i++) {
    let s1 = i === n ? raw.length : Math.round(raw.length * i / n);
    while (s1 < raw.length && /[A-Za-z0-9.]/.test(raw[s1]) && /[A-Za-z0-9.]/.test(raw[s1 - 1])) s1++;   // 不切开英文词和数字
    if (s1 > s0) out.push([k + s0, k + s1, raw.slice(s0, s1).trim()]); s0 = s1;
  }
  return out;
}
let t = 0; const scenes = [], caps = [], html = [];
lines.forEach((text, i) => {
  const start = t, vs = start + cfg.lead, ve = vs + dur[i], end = ve + cfg.tail + (i === lines.length - 1 ? cfg.outro : 0);
  const ct = charTimes(text, dur[i], id(i));
  const c = {
    t: x => start + x, vs, ve, end, text,
    // c.at("关键词", 偏移秒)：旁白念到这个词的绝对时间
    at(sub, off = 0) { const k = text.indexOf(sub); if (k < 0) throw new Error(`${id(i)} 稿子里找不到「${sub}」`); return vs + ct[k] + off; },
  };
  html.push(`<section class="scene" data-start="${start.toFixed(3)}" data-end="${end.toFixed(3)}">${SCENES[i](c)}</section>`);
  const BR = cfg.capBreak || "，。？！：；、";   // 在哪些标点处断字幕（不想把「制造、医疗」拆开就去掉「、」）
  const re = new RegExp(`[^${BR}]+[${BR}]?`, "g"); let m;
  while ((m = re.exec(text))) {
    const a = vs + ct[m.index], j = m.index + m[0].length, b = j < text.length ? vs + ct[j] : ve + .3;
    const raw = m[0].replace(/[，。、；：]$/, "").trim(), parts = splitCap(raw, m.index, text);
    // 太长的短句按字数切成几行，时间按字的位置分
    parts.forEach(([s0, s1, tx]) => caps.push({ a: +(vs + ct[s0]).toFixed(3), b: +(s1 < text.length && s1 < j ? vs + ct[s1] : b).toFixed(3), text: capMap(tx) }));
  }
  scenes.push({ id: id(i), start, end, voiceAt: vs, dur: end - start });
  t = end;
});
// 相邻短句并成一行字幕（≤capMax 字；config.capMerge=false 时一句一行，快节奏用）
const merged = [];
for (const c of caps) {
  const p = merged[merged.length - 1];
  if (cfg.capMerge !== false && p && cw(p.text) + cw(c.text) <= CAPMAX && Math.abs(p.b - c.a) < .01 && !/[？！]$/.test(p.text)) { p.text += "，" + c.text; p.b = c.b; }
  else merged.push({ ...c });
}
// config.capHold：字幕留到下一句出来再换（句间小停顿不闪空），快剪版用
if (cfg.capHold) for (let k = 0; k + 1 < merged.length; k++) if (merged[k + 1].a - merged[k].b < .8) merged[k].b = merged[k + 1].a;
const timeline = { duration: +t.toFixed(3), scenes };
writeFileSync(`${P}/timeline.json`, JSON.stringify(timeline, null, 1));
writeFileSync(`${P}/index.html`, `<!doctype html><html><head><meta charset="utf-8"><link rel="stylesheet" href="engine/style.css"><style>html,body{width:${cfg.W}px;height:${cfg.H}px}</style></head><body>
${html.join("\n")}
<div id="capline"></div><div id="cap"></div>
<script>window.PV={W:${cfg.W},H:${cfg.H},capPop:${cfg.capPop || 0},hardCut:${!!cfg.hardCut}};window.PV_TIMELINE=${JSON.stringify(timeline)};window.PV_CAPS=${JSON.stringify(merged)};</script>
<script src="engine/runtime.js"></script></body></html>`);
console.log(`总长 ${t.toFixed(1)}s（${Math.floor(t / 60)}分${Math.round(t % 60)}秒），${lines.length} 场`);
if (t < 120 || t > 300) console.warn(`注意：时长不在 2–5 分钟范围内`);
