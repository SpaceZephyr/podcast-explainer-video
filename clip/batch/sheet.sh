#!/bin/bash
# 抽 6 帧 + 封面拼成一张长条图，检查字幕、大字、人名条：bash sheet.sh <项目> → <工作目录>/fr/sheet_<id>.jpg
P="$(cd "$1" && pwd)"; f=$(ls "$P"/out/*.mp4 | grep -v -e footage -e tmp -e seg_ | head -1)
D=$(ffprobe -v error -show_entries format=duration -of csv=p=0 "$f"); T=$(mktemp -d); i=0
for r in .03 .2 .38 .56 .74 .95; do t=$(python3 -c "print($D*$r)"); ffmpeg -loglevel error -y -ss $t -i "$f" -frames:v 1 -vf scale=300:-1 $T/$i.jpg; i=$((i+1)); done
ffmpeg -loglevel error -y -i "$P/cover/cover.png" -vf scale=300:-1 $T/6.jpg
mkdir -p "$(dirname "$P")/fr"; O="$(dirname "$P")/fr/sheet_$(basename "$P").jpg"
ffmpeg -loglevel error -y -i $T/0.jpg -i $T/1.jpg -i $T/2.jpg -i $T/3.jpg -i $T/4.jpg -i $T/5.jpg -i $T/6.jpg -filter_complex hstack=7 "$O" && echo "$O"
