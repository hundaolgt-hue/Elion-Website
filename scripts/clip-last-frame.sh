#!/usr/bin/env bash
# Download a rendered clip and extract its exact last frame as the start frame of the next clip.
# Usage: scripts/clip-last-frame.sh <clip-id> <url>
set -euo pipefail
id="$1"; url="$2"
mkdir -p footage
curl -sS -L -o "footage/$id.mp4" "$url"
dur=$(ffprobe -v error -show_entries format=duration -of csv=p=0 "footage/$id.mp4")
frames=$(ffprobe -v error -select_streams v:0 -count_frames -show_entries stream=nb_read_frames -of csv=p=0 "footage/$id.mp4")
# last frame: seek to the final packet and take the last decoded picture
ffmpeg -y -loglevel error -sseof -0.5 -i "footage/$id.mp4" -update 1 -q:v 1 "footage/${id}_last.png"
w=$(ffprobe -v error -select_streams v:0 -show_entries stream=width,height,r_frame_rate -of csv=p=0 "footage/$id.mp4")
echo "$id: ${dur}s ${frames} frames ${w} -> footage/${id}_last.png"
