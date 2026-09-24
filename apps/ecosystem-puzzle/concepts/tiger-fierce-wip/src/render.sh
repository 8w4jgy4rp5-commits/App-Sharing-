#!/bin/sh
# usage: render.sh <svgfile> <outpng> [w] [h]
SVG="$1"; OUT="$2"; W="${3:-1040}"; H="${4:-620}"
"/c/Program Files/Google/Chrome/Application/chrome.exe" \
  --headless=new --disable-gpu --hide-scrollbars \
  --default-background-color=00000000 \
  --force-device-scale-factor=1 \
  --screenshot="$(cygpath -w "$OUT")" \
  --window-size="$W,$H" \
  "file:///$(cygpath -m "$SVG")" >/dev/null 2>&1
ls -la "$OUT"
