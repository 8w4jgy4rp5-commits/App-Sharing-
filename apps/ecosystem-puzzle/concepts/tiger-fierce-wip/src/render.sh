#!/bin/sh
# usage: render.sh <svgfile> <outpng> [w] [h]
#
# Chrome is run as a child process and is not allowed to write into the project
# directory, so it screenshots into TMPDIR first and we copy the result back.
# The page URL must be ABSOLUTE — a relative file:/// URL gives ERR_FILE_NOT_FOUND.
SVG="$1"; OUT="$2"; W="${3:-1040}"; H="${4:-620}"
TMP="${TMPDIR:-/tmp}/render-$$.png"
SVG_ABS="$(cd "$(dirname "$SVG")" && pwd)/$(basename "$SVG")"
"/c/Program Files/Google/Chrome/Application/chrome.exe" \
  --headless=new --disable-gpu --hide-scrollbars \
  --user-data-dir="$(cygpath -w "${TMPDIR:-/tmp}/chrome-render-profile")" \
  --default-background-color=00000000 \
  --force-device-scale-factor=1 \
  --screenshot="$(cygpath -w "$TMP")" \
  --window-size="$W,$H" \
  "file:///$(cygpath -m "$SVG_ABS")" >/dev/null 2>&1
cp "$TMP" "$OUT" && rm -f "$TMP"
ls -la "$OUT"
