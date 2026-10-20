#!/bin/sh
# FPS (CPU 4x mais lenta, celular, 12 s andando) antes e depois do vestir, nos lugares densos. Um Chrome por vez.
cd "$(dirname "$0")/../.."
for lugar in 210,338 125,290 860,120 540,880 900,380 1000,730; do
  for v in "" "&vestir=0"; do
    for tent in 1 2 3; do
      r=$(PORT=${PORT:-8771} node tools/teste-3d/fps.mjs "visual=3d&ir=$lugar$v" 4 12 1 2>/dev/null | grep '^{')
      [ -n "$r" ] && { echo "$r"; break; }
    done
  done
done
