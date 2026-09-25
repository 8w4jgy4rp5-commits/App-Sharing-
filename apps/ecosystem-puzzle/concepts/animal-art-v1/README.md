# Bioconnect animal art concepts v1

Generated on 2026-09-22 for review and future implementation.

## Contents

- `deer.png`
- `zebra.png`
- `buffalo.png`
- `wolf.png`
- `bear.png`
- `lion.png`
- `tiger.png`
- `elephant.png`
- `all-8-review.png`: labeled review sheet
- `all-8-at-44px.png`: recognition check at approximate in-game size

## Art direction

- Match the existing rabbit and fox: thin dark reddish-brown outline, simple flat color, subtle pale shading, soft hand-painted edges, and a friendly understated expression.
- One complete animal in side profile, facing right with the tail on the left.
- Strong species-specific features that remain recognizable around 44 px.
- Transparent PNG with no scene, text, frame, floor, or cast shadow.

## Status

**In the game: wolf.** Exported with `make-game-asset.py` to `img/wolf-whole.png` and
given a rig in `script.js`. The other seven are approved-review candidates only and
still fall back to their inline SVG silhouettes.

### Shipping one of these

Not by splitting it. The rabbit and the fox are cut into limbs because their art was
drawn that way, one closed shape per file; these are finished paintings, and a cut
through a painting leaves an edge with no outline on it. Nothing pays for that cost:
`paintAnimal` draws the rig once and holds it, the walk is a CSS animation on the whole
tile, and the far legs are already painted in. So:

1. `python make-game-asset.py <animal>.png ../../img/<animal>-whole.png`
2. add it to `SPRITE_FILES`, and a one-part rig to `RIG`
3. size it against the rabbit and the fox instead of guessing — measure the painted
   bounding box as a share of the tile, and match their height and their baseline

Split the head off only once a hungry face for that animal actually exists. With both
faces in hand the cut can follow the neck fur and the two silhouettes can be made to
agree; done earlier it is a seam bought for nothing.

The images were produced with the built-in ImageGen workflow. Buffalo and tiger required post-generation background cleanup to obtain transparent review assets.
