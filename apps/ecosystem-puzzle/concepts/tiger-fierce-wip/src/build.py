import stripes

BODY = """M900 290
  C872 268,830 232,790 212 C740 190,676 206,620 224
  C566 240,520 254,470 250 C412 246,340 224,296 212
  C256 202,214 222,198 258
  C160 242,108 244,74 268 C36 294,18 342,26 384
  C32 414,52 428,68 420 C80 412,78 396,64 396
  C50 368,66 330,102 306 C138 284,182 284,214 294
  C236 316,246 352,248 392
  C242 440,248 510,268 552 C282 582,290 640,292 682
  C292 700,302 710,320 712 C348 715,382 712,394 704
  C404 698,402 686,390 682 C366 672,350 650,346 622
  C340 580,352 528,366 498 C372 486,380 490,390 494
  C430 508,480 514,530 512 C590 510,646 512,696 520
  C706 552,712 600,720 648 C724 676,730 700,744 708
  C762 716,790 714,800 706 C810 698,806 686,794 682
  C778 674,770 652,768 626 C766 580,772 540,776 512
  C790 486,812 460,838 442 C862 426,884 416,898 404
  C906 372,906 320,900 290 Z"""

FORE_FAR = """M686 500 C676 548,678 606,686 650 C690 676,696 698,710 706
  C726 713,750 711,760 704 C768 698,765 687,754 683
  C740 676,733 656,731 630 C728 584,728 538,730 502 Z"""

HIND_FAR = """M350 420 C336 480,342 536,358 570 C370 598,372 646,372 682
  C372 700,380 710,396 712 C420 715,444 712,452 704
  C460 698,457 686,446 682 C430 675,422 654,422 628
  C422 582,414 500,408 462 Z"""

TAIL_RINGS = """
  <path d="M186 268 C200 292,199 318,186 338 C176 320,178 292,170 272 Z"/>
  <path d="M140 272 C154 298,152 328,138 348 C128 328,132 296,124 276 Z"/>
  <path d="M98 290 C112 314,110 344,96 364 C86 344,90 314,82 294 Z"/>
  <path d="M62 320 C76 342,74 372,60 390 C52 370,56 342,48 324 Z"/>
  <path d="M34 364 C48 380,50 404,42 424 C32 408,28 384,24 368 Z"/>
  <path d="M25 392 C40 404,54 412,66 410 C72 424,48 432,34 422 C26 416,22 404,25 392 Z"/>
"""

# ---- head, authored large then placed ----
HEAD_UP = """M10 190
  C8 110,60 44,150 26 C230 10,296 40,320 92
  C330 114,338 128,352 136
  C362 152,376 164,394 174 C420 186,444 196,452 214
  C456 232,452 248,440 254 C424 260,408 256,398 250
  C376 258,340 272,306 282 C292 286,284 288,280 288
  C250 300,210 318,168 326
  L150 352 L126 322 L100 344 L82 312 L54 330 L40 296
  L18 300 L28 262 L10 246 Z"""

HEAD_JAW = """M276 296
  C298 344,350 378,404 382 C434 384,452 374,460 360
  C472 382,460 410,430 424 C376 448,306 428,276 380
  C258 350,262 316,276 296 Z"""

HEAD_CAV = """M274 286 C316 264,372 252,420 250 C452 250,470 280,464 312
  C456 352,420 382,372 386 C316 390,274 342,274 286 Z"""

SVG = """<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1180 780" width="1180" height="780">
<style>
  .ln{{stroke:#7E3C28;stroke-width:6.5;stroke-linejoin:round;stroke-linecap:round;fill:none}}
  .fur{{fill:#EC7D3E}}.far{{fill:#CB6931}}.cream{{fill:#FBEEDB}}
  .st{{fill:#4A2418}}.st2{{fill:#9A512F}}
</style>
<defs>
  <path id="body" d="{BODY}"/>
  <clipPath id="bodyC"><use href="#body"/></clipPath>
  <path id="foreF" d="{FORE_FAR}"/>
  <path id="hindF" d="{HIND_FAR}"/>
  <path id="hUp" d="{HEAD_UP}"/>
  <clipPath id="hUpC"><use href="#hUp"/></clipPath>
  <path id="hJaw" d="{HEAD_JAW}"/>
  <clipPath id="hJawC"><use href="#hJaw"/></clipPath>
</defs>

<!-- far legs sit behind the body mass and read cooler -->
<use href="#hindF" class="far"/><use href="#hindF" class="ln" stroke-width="5.5"/>
<use href="#foreF" class="far"/><use href="#foreF" class="ln" stroke-width="5.5"/>

<!-- one unified silhouette: body + near legs + tail, so no seams -->
<use href="#body" class="fur"/>
<g clip-path="url(#bodyC)">
  <!-- underside, feathered into lobes rather than cut straight -->
  <path class="cream" d="M300 470 C346 506,394 500,436 492 C486 482,520 508,566 508
    C616 508,652 494,696 508 C724 517,742 540,750 566 L750 730 L286 730 Z"/>
  <!-- form shadow under the jaw, belly and haunch -->
  <path fill="#D96E34" opacity=".42" d="M690 512 C730 520,760 548,772 584
    C740 580,706 552,684 526 Z"/>
  <path fill="#D96E34" opacity=".34" d="M232 300 C214 352,216 420,236 470
    C260 452,258 366,252 306 Z"/>
  <g class="st">
{BODYSTRIPES}
{HAUNCHSTRIPES}
{SHOULDERSTRIPES}
  </g>
  <g class="st">{TAILRINGS}</g>
  <!-- solid tip -->
  <path class="st" d="M26 386 C40 400,56 410,68 408 C76 422,50 434,34 424 C24 417,21 400,26 386 Z"/>
</g>
<use href="#body" class="ln"/>
<!-- belly line runs heavier, ear and tail tip run lighter: drawn line, not a stroke -->
<path class="ln" stroke-width="8" d="M400 496 C452 512,506 514,560 512 C620 510,660 512,700 522"/>
<!-- toe notches: shape, not stamped boots -->
<g class="ln" stroke-width="5">
  <path d="M330 710 C334 700,336 692,335 684"/>
  <path d="M362 710 C366 700,368 692,367 684"/>
  <path d="M754 708 C758 698,760 690,759 682"/>
  <path d="M782 710 C786 700,788 692,787 684"/>
</g>

<!-- ============ HEAD ============ -->
<g transform="translate(895,253) rotate(8) scale(0.5)">

  <!-- ear: half disc laid flat back along the skull -->
  <path class="fur" d="M150 60 C126 24,80 4,50 16 C26 26,26 56,48 74 C76 96,126 90,150 60 Z"/>
  <path class="st" d="M140 56 C120 28,82 14,58 22 C40 30,40 52,56 66 C78 84,120 80,140 56 Z"/>
  <path class="cream" d="M80 34 C98 30,118 40,124 56 C108 64,84 56,76 46 C72 40,74 35,80 34 Z"/>
  <path class="ln" stroke-width="8" d="M150 60 C126 24,80 4,50 16 C26 26,26 56,48 74 C76 96,126 90,150 60 Z"/>

  <!-- mouth cavity -->
  <path fill="#4E1F1C" d="{HEAD_CAV}"/>
  <path fill="#B4606A" d="M300 350 C344 380,404 386,448 372 C440 396,366 408,314 384
    C298 376,294 360,300 350 Z"/>

  <!-- lower teeth, roots covered by the jaw drawn over them -->
  <g fill="#FFFBF2">
    <path d="M424 384 C430 370,436 342,438 318 C450 330,454 362,448 390 Z"/>
    <path d="M382 382 C386 370,388 358,388 348 C396 358,398 372,396 386 Z"/>
    <path d="M348 372 C352 360,354 350,354 342 C362 350,364 362,362 376 Z"/>
    <path d="M316 356 C320 346,322 338,322 330 C330 338,332 348,330 360 Z"/>
  </g>
  <use href="#hJaw" class="fur"/>
  <g clip-path="url(#hJawC)">
    <path class="cream" d="M352 376 C398 388,440 380,462 360 C476 386,460 414,428 428
      C378 450,326 432,308 406 Z"/>
    <path class="st" d="M280 330 C302 354,328 374,350 386 C322 388,292 372,274 350 Z"/>
  </g>
  <use href="#hJaw" class="ln" stroke-width="8"/>

  <!-- upper teeth -->
  <g fill="#FFFBF2">
    <path d="M382 246 C404 248,416 266,416 294 C416 322,404 344,386 354
      C368 336,366 258,382 246 Z"/>
    <path d="M424 248 C438 250,445 262,445 278 C445 292,438 302,429 306
      C418 294,416 252,424 248 Z"/>
    <path d="M348 258 C360 260,366 270,366 284 C366 296,361 304,355 308
      C345 298,342 260,348 258 Z"/>
    <path d="M316 268 C326 270,331 278,331 290 C331 300,327 307,322 310
      C313 301,311 270,316 268 Z"/>
  </g>
  <g class="ln" stroke-width="7">
    <path d="M382 246 C404 248,416 266,416 294 C416 322,404 344,386 354 C368 336,366 258,382 246 Z"/>
    <path d="M424 248 C438 250,445 262,445 278 C445 292,438 302,429 306 C418 294,416 252,424 248 Z"/>
  </g>

  <!-- upper head -->
  <use href="#hUp" class="fur"/>
  <g clip-path="url(#hUpC)">
    <path class="cream" d="M336 214 C378 192,430 194,458 216 C464 242,448 258,424 258
      C396 264,352 272,318 278 C302 274,298 256,310 240 C320 228,326 220,336 214 Z"/>
    <path class="cream" d="M52 252 C34 292,34 330,50 366 C62 392,92 402,116 396
      C98 366,92 318,98 282 C102 250,76 242,52 252 Z"/>
    <g class="st">
      <path d="M60 40 C88 88,96 152,80 208 C54 156,42 88,40 32 Z"/>
      <path d="M130 26 C160 78,168 144,152 200 C126 148,114 78,112 18 Z"/>
      <path d="M200 18 C226 66,232 124,218 172 C194 128,184 68,182 12 Z"/>
      <path d="M264 30 C284 70,288 114,276 152 C258 118,248 72,246 24 Z"/>
      <path d="M126 300 C168 308,208 318,230 330 C194 334,146 328,120 318 Z"/>
      <path d="M112 344 C150 350,186 358,206 368 C172 374,132 368,106 358 Z"/>
    </g>
    <g class="st2">
      <path d="M96 34 C116 78,120 130,108 176 C90 134,80 82,78 28 Z"/>
      <path d="M232 22 C248 60,252 104,242 142 C226 110,218 64,216 16 Z"/>
    </g>
  </g>
  <use href="#hUp" class="ln" stroke-width="8"/>

  <!-- brow pressing down onto the eye -->
  <path class="st" d="M222 118 C256 108,296 122,320 148 C300 152,268 146,244 142
    C228 138,216 126,222 118 Z"/>
  <!-- narrowed eye, wedge pointing at the nose -->
  <path fill="#F2B93C" d="M236 144 C254 132,288 136,308 156 C288 166,254 160,236 144 Z"/>
  <path class="st" d="M272 138 C280 138,284 144,284 152 C284 160,280 165,274 165 C268 158,266 143,272 138 Z"/>
  <path class="ln" stroke-width="9" d="M232 140 C252 126,292 132,314 154"/>

  <!-- nose: vertical front, flush with the muzzle -->
  <path fill="#8C4433" d="M410 198 C428 190,448 194,456 208 C460 224,456 240,444 246
    C428 252,412 244,408 228 C405 214,406 204,410 198 Z"/>
  <path class="ln" stroke-width="7" d="M410 198 C428 190,448 194,456 208 C460 224,456 240,444 246
    C428 252,412 244,408 228 C405 214,406 204,410 198 Z"/>
  <path class="ln" stroke-width="6" d="M420 226 C430 221,442 223,448 231"/>

  <!-- snarl wrinkles stacked on the bridge -->
  <g class="ln" stroke-width="7">
    <path d="M358 208 C372 194,392 186,408 184"/>
    <path d="M346 228 C362 212,384 202,402 200"/>
    <path d="M336 248 C352 234,374 224,392 222"/>
  </g>

  <g fill="#7E3C28" opacity=".5">
    <circle cx="372" cy="240" r="5"/><circle cx="396" cy="234" r="5"/>
    <circle cx="366" cy="258" r="5"/><circle cx="390" cy="252" r="5"/>
  </g>
</g>
</svg>
"""

out = SVG.format(
    BODY=BODY, FORE_FAR=FORE_FAR, HIND_FAR=HIND_FAR,
    HEAD_UP=HEAD_UP, HEAD_JAW=HEAD_JAW, HEAD_CAV=HEAD_CAV,
    TAILRINGS=TAIL_RINGS,
    BODYSTRIPES=stripes.emit(stripes.BODY),
    HAUNCHSTRIPES=stripes.emit(stripes.HAUNCH),
    SHOULDERSTRIPES=stripes.emit(stripes.SHOULDER),
)
open("tiger-v8.svg", "w", encoding="utf-8").write(out)
print("wrote tiger-v8.svg", len(out))
