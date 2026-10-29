"""Generic artwork for demo profiles, the landing preview and the X kit.

Abstract gradients only: no real people, no third-party art.
Run: python3 scripts/demo-art.py  → apps/web/public/images/demo/*.svg
"""
import os

OUT = os.path.join(os.path.dirname(__file__), "..", "apps", "web", "public", "images", "demo")
os.makedirs(OUT, exist_ok=True)

GRAIN = '<filter id="g"><feTurbulence type="fractalNoise" baseFrequency=".9" numOctaves="2" stitchTiles="stitch"/><feColorMatrix values="0 0 0 0 1  0 0 0 0 1  0 0 0 0 1  0 0 0 .08 0"/></filter>'
BLUR = '<filter id="b" x="-50%" y="-50%" width="200%" height="200%"><feGaussianBlur stdDeviation="{d}"/></filter>'


def orbs(w, h, bg, blobs, blur=60, extra=""):
    """Soft colored blobs on a base color, with film grain."""
    circles = "".join(f'<circle cx="{x}" cy="{y}" r="{r}" fill="{c}"/>' for x, y, r, c in blobs)
    return (
        f'<svg xmlns="http://www.w3.org/2000/svg" width="{w}" height="{h}" viewBox="0 0 {w} {h}">'
        f'<defs>{BLUR.format(d=blur)}{GRAIN}</defs>'
        f'<rect width="{w}" height="{h}" fill="{bg}"/><g filter="url(#b)">{circles}</g>{extra}'
        f'<rect width="{w}" height="{h}" filter="url(#g)"/></svg>\n'
    )


ART = {
    # Avatars, 400x400.
    "avatar-1.svg": orbs(400, 400, "#2a0f24", [(120, 110, 150, "#ff97cb"), (300, 280, 170, "#7b3cff"), (330, 90, 90, "#ffd1e8")]),
    "avatar-2.svg": orbs(400, 400, "#04161c", [(110, 290, 170, "#00c2ff"), (300, 120, 150, "#2fe3ac"), (220, 220, 80, "#e6fff7")]),
    "avatar-3.svg": orbs(400, 400, "#1d0b04", [(140, 140, 160, "#ff6a2b"), (300, 300, 150, "#ffcc33"), (80, 330, 90, "#ff2e63")]),
    "avatar-4.svg": orbs(400, 400, "#0c0c1d", [(130, 280, 160, "#5b5bff"), (290, 130, 150, "#c86bff"), (300, 320, 80, "#6ef2ff")]),
    "avatar-5.svg": orbs(400, 400, "#0e1405", [(120, 120, 150, "#b6ff3b"), (300, 300, 160, "#1fbf75"), (320, 90, 70, "#fbffd1")]),
    # Covers and thumbnails, 800x450.
    "cover-1.svg": orbs(800, 450, "#08060f", [(180, 120, 220, "#7b3cff"), (620, 330, 240, "#ff97cb"), (430, 60, 120, "#00c2ff")], 90),
    "cover-2.svg": orbs(800, 450, "#05100d", [(200, 340, 240, "#2fe3ac"), (600, 120, 220, "#00c2ff"), (420, 260, 110, "#f4fffb")], 90),
    "cover-3.svg": orbs(800, 450, "#140606", [(220, 160, 230, "#ff2e63"), (600, 320, 230, "#ff9a1f"), (690, 80, 100, "#ffd166")], 90),
    "cover-4.svg": orbs(800, 450, "#0b0b16", [(160, 300, 220, "#5b5bff"), (560, 120, 240, "#ff6ad5"), (700, 380, 120, "#6ef2ff")], 90,
                        '<g opacity=".18" stroke="#fff" stroke-width="1">' + "".join(f'<path d="M0 {y}H800"/>' for y in range(0, 450, 18)) + "</g>"),
}

for name, svg in ART.items():
    with open(os.path.join(OUT, name), "w") as f:
        f.write(svg)
    print(name)
