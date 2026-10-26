# 把每个项目的成片和封面挂到 http://127.0.0.1:8765/<id>.mp4 / <id>.png（带 CORS），给 publish.py 上传用
# 用法：python3 serve.py <工作目录>      Ctrl-C 结束
import http.server, os, sys, tempfile
W = os.path.abspath(sys.argv[1]); sys.path.insert(0, W); from spec import P
S = tempfile.mkdtemp(prefix="clip-serve-")
for pid, p in P.items():
    v = f"{W}/{pid}/out/{p['name']}.mp4"
    if os.path.exists(v):
        os.symlink(v, f"{S}/{pid}.mp4"); os.symlink(f"{W}/{pid}/cover/cover.png", f"{S}/{pid}.png")
os.chdir(S)
class H(http.server.SimpleHTTPRequestHandler):
    def end_headers(self):
        self.send_header("Access-Control-Allow-Origin", "*"); self.send_header("Access-Control-Allow-Private-Network", "true")
        super().end_headers()
print("serving", sorted(os.listdir(S)))
http.server.ThreadingHTTPServer(("127.0.0.1", 8765), H).serve_forever()
