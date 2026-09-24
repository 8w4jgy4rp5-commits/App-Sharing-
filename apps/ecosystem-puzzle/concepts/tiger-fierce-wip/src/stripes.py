"""Tapered, non-uniform tiger stripes.

Each stripe is a leaf: a curved centre line whose half-width starts fat at the
spine and runs out to a needle point. Pitch and width are deliberately uneven —
a hand-drawn coat has no constant pitch, and a constant one is the single
loudest "vector art" tell.
"""
import math


def leaf(x0, y0, ang, length, halfw, bend, taper=0.75, n=26, blunt=0.0):
    """ang: degrees from straight-down, positive leans the tip toward the tail.
    bend: sideways drift of the tip, in px, applied as a quadratic."""
    a = math.radians(ang)
    L, R = [], []
    for i in range(n + 1):
        t = i / n
        # centre line
        cx = x0 + math.sin(a) * length * t + bend * t * t
        cy = y0 + math.cos(a) * length * t
        # tangent (approx) for the perpendicular
        dx = math.sin(a) * length + 2 * bend * t
        dy = math.cos(a) * length
        m = math.hypot(dx, dy) or 1.0
        px, py = -dy / m, dx / m
        w = halfw * max(0.0, (1 - t) ** taper) + blunt * (1 - t)
        L.append((cx + px * w, cy + py * w))
        R.append((cx - px * w, cy - py * w))
    pts = L + R[::-1]
    d = "M%.1f %.1f " % pts[0] + " ".join("L%.1f %.1f" % p for p in pts[1:]) + " Z"
    return d


def fork(x0, y0, ang, length, halfw, bend, split=0.55, spread=16):
    """A stripe that splits into two points — every real tiger has several."""
    stem = leaf(x0, y0, ang, length * split, halfw, bend * split * split, taper=0.35)
    a = math.radians(ang)
    bx = x0 + math.sin(a) * length * split + bend * split * split
    by = y0 + math.cos(a) * length * split
    hw = halfw * (1 - split) ** 0.35
    p1 = leaf(bx, by, ang - spread, length * (1 - split), hw * 0.85, bend * 0.3)
    p2 = leaf(bx, by, ang + spread, length * (1 - split), hw * 0.75, bend * 0.3)
    return stem + " " + p1 + " " + p2


# spine x, spine y, angle, length, half-width, bend, kind
# angles: haunch/flank lean +, shoulder leans -, mid near vertical
BODY = [
    (250, 206, 34, 150, 15, 26, "leaf"),
    (286, 200, 26, 214, 11, 30, "leaf"),
    (312, 206, 22, 262, 19, 34, "fork"),
    (356, 216, 18, 156, 8, 18, "leaf"),
    (392, 226, 14, 268, 21, 26, "leaf"),
    (438, 238, 10, 170, 12, 14, "leaf"),
    (466, 242, 7, 252, 16, 12, "fork"),
    (516, 246, 4, 138, 9, 6, "leaf"),
    (548, 242, 2, 258, 22, 4, "leaf"),
    (596, 232, -3, 164, 11, -8, "leaf"),
    (628, 224, -6, 248, 17, -14, "fork"),
    (676, 210, -11, 142, 8, -12, "leaf"),
    (704, 202, -14, 236, 20, -26, "leaf"),
    (748, 196, -19, 178, 13, -28, "leaf"),
    (782, 198, -24, 210, 15, -36, "fork"),
    (826, 216, -28, 146, 10, -30, "leaf"),
]

# haunch mass: short marks that wrap the thigh, angled with its curve
HAUNCH = [
    (238, 300, 62, 120, 12, 30, "leaf"),
    (232, 352, 74, 108, 10, 26, "leaf"),
    (240, 404, 80, 96, 9, 20, "leaf"),
]

# shoulder mass
SHOULDER = [
    (806, 300, -44, 118, 11, -24, "leaf"),
    (816, 344, -56, 104, 9, -20, "leaf"),
]


def emit(rows, indent="    "):
    out = []
    for x, y, a, l, w, b, kind in rows:
        d = fork(x, y, a, l, w, b) if kind == "fork" else leaf(x, y, a, l, w, b)
        out.append('%s<path d="%s"/>' % (indent, d))
    return "\n".join(out)


if __name__ == "__main__":
    print("<!--BODY-->")
    print(emit(BODY))
    print("<!--HAUNCH-->")
    print(emit(HAUNCH))
    print("<!--SHOULDER-->")
    print(emit(SHOULDER))
