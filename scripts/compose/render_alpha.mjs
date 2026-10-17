// 透明背景逐帧渲染动画层 → out/overlay.mov（PNG 编码，带 alpha），给 compose.py 叠在原视频上
// 用法：node render_alpha.mjs <项目>
import puppeteer from "puppeteer-core";
import { spawn } from "node:child_process";
import path from "node:path";
import { findChrome } from "../engine/chrome.mjs";
const P = path.resolve(process.argv[2] || "."), fps = 30;
const browser = await puppeteer.launch({ executablePath: findChrome(), headless: true, args: ["--no-sandbox", "--hide-scrollbars", "--allow-file-access-from-files", "--font-render-hinting=none"] });
const page = await browser.newPage();
await page.evaluateOnNewDocument(() => { window.__PV_RENDER__ = true; });
await page.goto("file://" + P + "/index.html", { waitUntil: "load" });
const { W, H } = await page.evaluate(() => window.PV);
await page.setViewport({ width: W, height: H, deviceScaleFactor: 1 });
await page.evaluate(async () => { await document.fonts.ready; });
const tl = await page.evaluate(() => window.PV_TIMELINE);
const cdp = await page.createCDPSession();
await cdp.send("Emulation.setDefaultBackgroundColorOverride", { color: { r: 0, g: 0, b: 0, a: 0 } });
const total = Math.round(tl.duration * fps);
const ff = spawn("ffmpeg", ["-y", "-loglevel", "error", "-f", "image2pipe", "-framerate", String(fps), "-c:v", "png", "-i", "-", "-c:v", "png", "-pix_fmt", "rgba", P + "/out/overlay.mov"], { stdio: ["pipe", "inherit", "inherit"] });
const t0 = Date.now();
for (let i = 0; i < total; i++) {
  await page.evaluate(t => window.seek(t), i / fps);
  const { data } = await cdp.send("Page.captureScreenshot", { format: "png", optimizeForSpeed: true });
  if (!ff.stdin.write(Buffer.from(data, "base64"))) await new Promise(r => ff.stdin.once("drain", r));
  if (i % 150 === 0) process.stdout.write(`  ${i}/${total}  ${((Date.now() - t0) / 1000).toFixed(0)}s\r`);
}
ff.stdin.end(); await new Promise(r => ff.on("close", r)); await browser.close();
console.log(`\n动画层 → out/overlay.mov（${total} 帧）`);
