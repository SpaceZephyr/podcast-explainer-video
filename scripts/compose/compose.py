# 合成：黑底 + 画框里的原视频片段（按 edl.json 每场取一段，圆角遮罩）+ 透明动画层 + 人声/原声/配乐
# 用法：python3 compose.py <项目> "<成片名>"     先跑 build.mjs、dropcaps.py、render_alpha.mjs、mixaudio.sh
import json, subprocess, sys, os
P = os.path.abspath(sys.argv[1]); os.chdir(P)
name = sys.argv[2] if len(sys.argv) > 2 else "成片"
tl = json.load(open("timeline.json")); edl = json.load(open("edl.json"))
WX, WY, WW, WH = 40, 560, 1000, 564
segs = []
for i, s in enumerate(tl["scenes"]):
    out = f"out/seg_{i:02d}.mp4"; d = s["dur"]; e = edl.get(s["id"])
    if e:
        subprocess.run(["ffmpeg", "-y", "-loglevel", "error", "-ss", str(e[1]), "-t", f"{d:.3f}", "-i", f"assets/src/{e[0]}", "-an",
                        "-vf", f"scale={WW}:{WH}:force_original_aspect_ratio=increase,crop={WW}:{WH},fps=30,setsar=1,tpad=stop_mode=clone:stop_duration=2,trim=duration={d:.3f}",
                        "-c:v", "libx264", "-crf", "16", "-pix_fmt", "yuv420p", out], check=True)
    else:
        subprocess.run(["ffmpeg", "-y", "-loglevel", "error", "-f", "lavfi", "-i", f"color=c=0x06070d:s={WW}x{WH}:r=30:d={d:.3f}", "-c:v", "libx264", "-pix_fmt", "yuv420p", out], check=True)
    segs.append(out)
open("out/segs.txt", "w").write("".join(f"file '{os.path.basename(x)}'\n" for x in segs))
subprocess.run(["ffmpeg", "-y", "-loglevel", "error", "-f", "concat", "-safe", "0", "-i", "out/segs.txt", "-c", "copy", "out/footage.mp4"], check=True)
# 圆角遮罩
subprocess.run(["ffmpeg", "-y", "-loglevel", "error", "-f", "lavfi", "-i", f"color=black:s={WW}x{WH}", "-vf",
                f"format=gray,geq=lum='if(gt(pow(max(0,max(26-X,X-({WW}-27)))/26,2)+pow(max(0,max(26-Y,Y-({WH}-27)))/26,2),1),0,255)'", "-frames:v", "1", "out/mask.png"], check=True)
D = tl["duration"]
fc = (f"color=c=black:s=1080x1920:r=30:d={D:.3f}[bg];"
      f"[1:v]format=yuva420p[ft0];[2:v]format=gray,loop=-1:1[m];[ft0][m]alphamerge[ft];"
      f"[bg][ft]overlay={WX}:{WY}:shortest=1[b1];[b1][0:v]overlay=0:0:format=auto,format=yuv420p[v]")
subprocess.run(["ffmpeg", "-y", "-loglevel", "error", "-i", "out/overlay.mov", "-i", "out/footage.mp4", "-loop", "1", "-i", "out/mask.png", "-i", "out/mix_bgm.wav",
                "-filter_complex", fc, "-map", "[v]", "-map", "3:a", "-c:v", "libx264", "-crf", "18", "-preset", "medium", "-c:a", "aac", "-b:a", "192k", "-t", f"{D:.3f}", "-movflags", "+faststart", f"out/{name}.mp4"], check=True)
print("成片 →", f"{P}/out/{name}.mp4")
