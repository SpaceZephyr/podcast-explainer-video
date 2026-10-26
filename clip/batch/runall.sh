#!/bin/bash
# 两路并行渲染：bash runall.sh <工作目录> id1 id2 ...   日志在 <项目>/run.log
B="$(cd "$(dirname "$0")" && pwd)"; W="$(cd "$1" && pwd)"; shift
run() { for p in "$@"; do bash "$B/run.sh" "$W/$p" > "$W/$p/run.log" 2>&1; grep DONE "$W/$p/run.log" || echo "FAIL $p（看 $W/$p/run.log）"; done; }
A=(); Z=(); i=0; for p in "$@"; do if ((i%2)); then Z+=($p); else A+=($p); fi; i=$((i+1)); done
run "${A[@]}" & run "${Z[@]}" & wait
