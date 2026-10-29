"""Builds the FL3X logo SVGs (apps/web/public/brand) from the pixel bag and the wordmark.

The bag is a 15x16 pixel grid (one pixel = 2 units). The wordmark is the
original FL3X lettering rescaled to the same 32-unit height, coordinates
rounded to 0.01. Run: python3 scripts/brand-logo.py
"""
import os, re

PINK = "#FF97CB"
BAG = [
    ".....#####.....",
    "...#########...",
    "...#########...",
    "....##...##....",
    "...............",
    "...#########...",
    "..#####.#####..",
    "..####...####..",
    ".####.#.#.####.",
    "#####.#.#######",
    "######...######",
    "#######.#.#####",
    "#####.#.#.#####",
    "######...######",
    ".######.######.",
    "..###########..",
]
U = 2  # units per pixel


def bag_path(ox=0.0, oy=0.0):
    out = []
    for y, row in enumerate(BAG):
        for m in re.finditer(r"#+", row):
            x, w = m.start(), m.end() - m.start()
            out.append(f"M{ox + x * U:g} {oy + y * U:g}h{w * U}v{U}h-{w * U}z")
    return "".join(out)


# Original lettering (Figma export), absolute M/L/C/Z commands only.
F_L = "M33.1973 27.534L33.1973 0.388672L44.4548 0.388672L43.6424 4.49925L37.53 4.49925L37.53 12.5265L42.3271 12.5265L41.5147 16.6371L37.53 16.6371L37.53 27.534L33.1973 27.534ZM49.6948 23.4234L55.8071 23.4234L56.6195 27.534L45.362 27.534L45.362 0.388672L49.6948 0.388672L49.6948 23.4234Z"
X = "M83 0.427451L83 10.3161C83 12.2163 82.0716 13.9226 80.6789 15.0084C82.0716 16.0942 83 17.8005 83 19.7006L83 27.534L78.6673 27.534L78.6673 18.6536C78.6673 17.7617 77.9322 17.0637 77.0425 17.0637C76.1914 17.0637 75.4564 17.7617 75.4564 18.6536L75.4564 27.534L71.1236 27.534L71.1236 19.7006C71.1236 17.8005 72.0133 16.0942 73.4447 15.0084C72.0133 13.9226 71.1236 12.2163 71.1236 10.3161L71.1236 0.427451L75.4564 0.427451L75.4564 11.3631C75.4564 12.2551 76.1914 12.9531 77.0425 12.9531C77.9322 12.9531 78.6673 12.2551 78.6673 11.3631L78.6673 0.427451L83 0.427451Z"
THREE = "M62.9872 0.00153766C64.6893 -0.0372414 66.1981 0.660781 67.3199 1.74659C68.4031 2.83241 69.0608 4.30601 69.0608 5.93473L69.0608 9.65752C69.0608 11.4801 68.055 13.1476 66.4302 13.962C68.055 14.9315 69.0608 16.6377 69.0608 18.5379L69.0608 22.028C69.0608 25.3242 66.3915 28 63.1032 28C59.8149 28 57.1843 25.2855 57.1843 22.028L57.1843 15.3193L61.3237 16.1336L61.3237 22.1831C61.3237 23.1526 62.0974 23.967 63.0258 23.967C63.9543 23.8894 64.728 23.269 64.728 22.2607L64.728 17.0643C64.728 16.5214 64.3025 16.0948 63.7609 16.0948L62.2521 16.0948L62.2521 11.9843L63.7609 11.9843C64.3025 11.9843 64.728 11.5577 64.728 11.0536L64.728 5.85717C64.728 4.92648 63.9543 4.11212 62.9872 4.11212C62.0974 4.11212 61.3237 4.92648 61.3237 5.81839L61.3237 11.8291L57.1843 11.0148L57.1843 6.05107C57.1843 2.83241 59.7376 0.0790958 62.9872 0.00153766Z"

TOP, BASE, LEFT = 0.388672, 27.534, 33.1973
K = 32 / (BASE - TOP)  # cap height becomes 32, like the bag


def rescale(d, ox):
    nums = iter(float(n) for n in re.findall(r"-?\d*\.?\d+(?:e-?\d+)?", d))
    def repl(m):
        x = next(nums); y = next(nums)
        return f"{round(ox + (x - LEFT) * K, 2):g} {round((y - TOP) * K, 2):g}"
    # Every command here takes x,y pairs: rewrite each pair in place.
    return re.sub(r"-?\d*\.?\d+(?:e-?\d+)?[ ,]+-?\d*\.?\d+(?:e-?\d+)?", repl, d)


GAP = 9
WM_X = 30 + GAP  # wordmark starts after the bag and the gap
WM_W = round((83 - LEFT) * K, 2)
W = round(WM_X + WM_W, 2)


def svg(w, h, body, vb=None, title="FL3X"):
    vb = vb or f"0 0 {w:g} {h:g}"
    return f'<svg xmlns="http://www.w3.org/2000/svg" width="{w:g}" height="{h:g}" viewBox="{vb}" fill="none"><title>{title}</title>{body}</svg>\n'


def logo(bag=PINK, letters="#fff", three=PINK):
    return (
        f'<path fill="{bag}" d="{bag_path()}"/>'
        f'<path fill="{letters}" d="{rescale(F_L, WM_X)}{rescale(X, WM_X)}"/>'
        f'<path fill="{three}" d="{rescale(THREE, WM_X)}"/>'
    )


def wordmark(letters="#fff", three=PINK):
    return f'<path fill="{letters}" d="{rescale(F_L, 0)}{rescale(X, 0)}"/><path fill="{three}" d="{rescale(THREE, 0)}"/>'


out = os.path.join(os.path.dirname(__file__), "..", "apps", "web", "public", "brand")
os.makedirs(out, exist_ok=True)
files = {
    "fl3x-logo.svg": svg(W, 32, logo(), f"0 -1 {W:g} 34"),
    "fl3x-logo-black.svg": svg(W, 32, logo(letters="#0B0B0B"), f"0 -1 {W:g} 34"),
    "fl3x-logo-white.svg": svg(W, 32, logo("#fff", "#fff", "#fff"), f"0 -1 {W:g} 34"),
    "fl3x-logo-mono-black.svg": svg(W, 32, logo("#0B0B0B", "#0B0B0B", "#0B0B0B"), f"0 -1 {W:g} 34"),
    "fl3x-icon.svg": svg(30, 32, f'<path fill="{PINK}" d="{bag_path()}"/>'),
    "fl3x-icon-white.svg": svg(30, 32, f'<path fill="#fff" d="{bag_path()}"/>'),
    "fl3x-wordmark.svg": svg(WM_W, 32, wordmark(), f"0 -1 {WM_W:g} 34"),
    # App / avatar tile: bag centered on black with breathing room.
    "fl3x-app-icon.svg": svg(512, 512, f'<rect width="512" height="512" rx="112" fill="#0B0B0B"/><path fill="{PINK}" transform="translate(136 128) scale(8)" d="{bag_path()}"/>'),
    "fl3x-app-icon-pink.svg": svg(512, 512, f'<rect width="512" height="512" rx="112" fill="{PINK}"/><path fill="#0B0B0B" transform="translate(136 128) scale(8)" d="{bag_path()}"/>'),
}
for name, content in files.items():
    with open(os.path.join(out, name), "w") as f:
        f.write(content)
    print(name, len(content))
# The Founder badge is the logo's bag.
with open(os.path.join(out, "..", "images", "badges", "founder.svg"), "w") as f:
    f.write(svg(32, 32, f'<path fill="{PINK}" transform="translate(1 0)" d="{bag_path()}"/>', title="Founder"))
# The site uses these two from /images.
for name in ("fl3x-logo.svg", "fl3x-icon.svg"):
    with open(os.path.join(out, "..", "images", name), "w") as f:
        f.write(files[name])


# ------------------------------------------------------------- brand page
# docs/brand/logo.html: every variant with SVG/PNG download, the grid, colors.
import base64
import json


def font_url(rel):
    """Fonts are embedded so the page works on its own, wherever it is opened."""
    path = os.path.join(os.path.dirname(__file__), "..", "apps", "web", "public", "fonts", rel)
    kind = "opentype" if rel.endswith(".otf") else "truetype"
    return f"url(data:font/{'otf' if kind == 'opentype' else 'ttf'};base64,{base64.b64encode(open(path, 'rb').read()).decode()}) format('{kind}')"

page_dir = os.path.join(os.path.dirname(__file__), "..", "docs", "brand")
os.makedirs(page_dir, exist_ok=True)
old = open(os.path.join(os.path.dirname(__file__), "..", "docs", "brand", "fl3x-logo-before.svg")).read()

CARDS = [
    ("fl3x-logo.svg", "Logo", "#0B0B0B", "Main logo, on dark."),
    ("fl3x-logo-black.svg", "Logo · light", "#F4F2EE", "Black letters for light backgrounds."),
    ("fl3x-logo-mono-black.svg", "Logo · on pink", "#FF97CB", "One color, on the brand pink."),
    ("fl3x-logo-white.svg", "Logo · white", "#1A1A1A", "One color, over photos and videos."),
    ("fl3x-icon.svg", "Icon", "#0B0B0B", "The money bag alone. Favicons, small spaces."),
    ("fl3x-icon-white.svg", "Icon · white", "#FF97CB", "White bag for colored backgrounds."),
    ("fl3x-wordmark.svg", "Wordmark", "#0B0B0B", "Lettering alone, when the bag is already nearby."),
    ("fl3x-app-icon.svg", "App icon", "#141414", "512×512 tile: profile picture, app icon."),
    ("fl3x-app-icon-pink.svg", "App icon · pink", "#141414", "Pink tile version."),
]
COLORS = [("Pink", "#FF97CB", "Brand accent, the 3, the bag"), ("Black", "#000000", "Page background"), ("Ink", "#0B0B0B", "Panels, logo on light"),
          ("Surface", "#191919", "Cards"), ("White", "#FFFFFF", "Letters, text"), ("Verified", "#00F6FF", "Premium checkmark only")]

svgs = {n: files[n] for n, *_ in CARDS}
cards_html = "\n".join(
    f'''<article class="card">
  <div class="stage{' tile' if 'app-icon' in n else ' icon' if 'icon' in n else ''}" style="background:{bg}">{svgs[n]}</div>
  <div class="meta"><div><h3>{t}</h3><p>{d}</p></div>
  <div class="btns"><button data-dl="{n}">SVG</button><button data-png="{n}">PNG</button><button data-copy="{n}">Copy</button></div></div>
</article>''' for n, t, bg, d in CARDS)
colors_html = "\n".join(f'<button class="swatch" data-hex="{h}"><span style="background:{h}"></span><b>{name}</b><code>{h}</code><small>{use}</small></button>' for name, h, use in COLORS)

# Construction: the bag on its grid.
grid_cells = "".join(
    f'<rect x="{x * U}" y="{y * U}" width="{U}" height="{U}" fill="{PINK if c == "#" else "transparent"}"/>' for y, row in enumerate(BAG) for x, c in enumerate(row))
grid_svg = f'''<svg viewBox="-1 -1 32 34" xmlns="http://www.w3.org/2000/svg">{grid_cells}<g stroke="rgba(255,255,255,.14)" stroke-width=".06">{''.join(f'<path d="M{x * U} 0V32"/>' for x in range(16))}{''.join(f'<path d="M0 {y * U}H30"/>' for y in range(17))}</g></svg>'''

page = f'''<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>FL3X Logo</title>
<style>
@font-face {{ font-family: Moga; src: {font_url('primary/moga.otf')}; }}
@font-face {{ font-family: Outfit; font-weight: 300; src: {font_url('secondary/Outfit-Light.ttf')}; }}
@font-face {{ font-family: Outfit; font-weight: 400; src: {font_url('secondary/Outfit-Regular.ttf')}; }}
:root {{ --bg:#000; --surface:#0d0d0d; --surface2:#151515; --line:rgba(255,255,255,.1); --muted:rgba(255,255,255,.55); --pink:#FF97CB; }}
* {{ box-sizing:border-box; }}
body {{ margin:0; background:var(--bg); color:#fff; font:300 15px/1.5 Outfit, system-ui, sans-serif; }}
main {{ max-width:1120px; margin:0 auto; padding:40px 16px 96px; display:flex; flex-direction:column; gap:72px; }}
h1, h2, h3 {{ font-family:Moga, system-ui; font-weight:400; margin:0; line-height:.9; text-transform:uppercase; }}
.swatch b {{ text-transform:uppercase; }}
h2 {{ font-size:40px; }} h3 {{ font-size:22px; }}
.kicker {{ color:var(--pink); font-size:13px; letter-spacing:.08em; text-transform:uppercase; margin:0 0 8px; }}
.lead {{ color:var(--muted); max-width:620px; margin:12px 0 0; }}
.hero {{ position:relative; border-radius:32px; overflow:hidden; border:1px solid var(--line); background:radial-gradient(90% 120% at 50% 0%, #3d1a2d 0%, #0b0709 60%, #000 100%); min-height:420px; display:flex; align-items:center; justify-content:center; padding:48px 16px; }}
.hero svg {{ width:min(640px, 86%); height:auto; filter:drop-shadow(0 20px 60px rgba(255,151,203,.25)); }}
.hero .tag {{ position:absolute; left:20px; bottom:16px; color:var(--muted); font-size:12px; }}
.hero .tag2 {{ position:absolute; right:20px; bottom:16px; font-family:Moga; font-size:18px; text-transform:uppercase; }}
.grid {{ display:grid; grid-template-columns:repeat(auto-fill, minmax(min(320px, 100%), 1fr)); gap:12px; margin-top:24px; }}
.card {{ background:var(--surface); border:1px solid var(--line); border-radius:24px; overflow:hidden; display:flex; flex-direction:column; }}
.stage {{ height:200px; display:flex; align-items:center; justify-content:center; padding:32px; }}
.stage svg {{ max-width:78%; max-height:64px; width:auto; height:auto; }}
.stage.tile svg {{ max-height:140px; }}
.stage.icon svg {{ max-height:96px; }}
.meta {{ display:flex; flex-wrap:wrap; gap:12px; align-items:flex-end; justify-content:space-between; padding:16px; border-top:1px solid var(--line); }}
.meta p {{ margin:4px 0 0; color:var(--muted); font-size:12px; }}
.btns {{ display:flex; gap:6px; flex-shrink:0; }}
button {{ font:400 13px Outfit, system-ui; color:#fff; background:var(--surface2); border:1px solid var(--line); border-radius:10px; padding:7px 10px; cursor:pointer; transition:background .15s, color .15s; }}
button:hover {{ background:#222; }}
button.done {{ background:var(--pink); color:#000; }}
.split {{ display:grid; grid-template-columns:1fr 1fr; gap:12px; margin-top:24px; }}
.panel {{ background:var(--surface); border:1px solid var(--line); border-radius:24px; padding:24px; }}
.panel svg {{ width:100%; height:auto; display:block; }}
.facts {{ display:grid; gap:10px; margin:0; padding:0; list-style:none; }}
.facts li {{ display:flex; justify-content:space-between; gap:16px; border-bottom:1px dashed var(--line); padding-bottom:10px; }}
.facts b {{ font-weight:400; }} .facts span {{ color:var(--muted); text-align:right; }}
.sizes {{ display:flex; align-items:flex-end; gap:28px; flex-wrap:wrap; margin-top:20px; }}
.sizes figure {{ margin:0; display:flex; flex-direction:column; gap:8px; color:var(--muted); font-size:11px; }}
.swatches {{ display:grid; grid-template-columns:repeat(auto-fill, minmax(min(170px, 100%), 1fr)); gap:12px; margin-top:24px; }}
.swatch {{ text-align:left; display:flex; flex-direction:column; gap:4px; padding:12px; border-radius:20px; background:var(--surface); }}
.swatch span {{ height:84px; border-radius:12px; border:1px solid var(--line); margin-bottom:6px; }}
.swatch b {{ font-family:Moga; font-weight:400; font-size:18px; }} .swatch code {{ color:var(--muted); font-size:12px; }} .swatch small {{ color:var(--muted); font-size:11px; }}
.type {{ display:grid; grid-template-columns:1fr 1fr; gap:12px; margin-top:24px; }}
.type .panel p.sample {{ margin:8px 0 0; font-size:56px; line-height:1; }}
.compare {{ display:grid; grid-template-columns:1fr 1fr; gap:12px; margin-top:24px; }}
.compare .panel {{ display:flex; flex-direction:column; gap:16px; }}
.compare .panel .stage {{ height:auto; padding:24px 0; }}
.compare .panel .stage svg {{ max-height:56px; }}
.dont {{ display:grid; grid-template-columns:repeat(auto-fill, minmax(min(200px, 100%), 1fr)); gap:12px; margin-top:24px; }}
.dont .panel {{ padding:16px; }} .dont .panel div {{ height:90px; display:flex; align-items:center; justify-content:center; }}
.dont .panel div svg {{ max-width:80%; height:36px; width:auto; }} .dont p {{ margin:8px 0 0; font-size:12px; color:var(--muted); }} .dont p::before {{ content:"✕ "; color:#ff5d5d; }}
@media (max-width:760px) {{ .split, .type, .compare {{ grid-template-columns:1fr; }} h2 {{ font-size:32px; }} }}
</style>
</head>
<body>
<main>
<header>
  <p class="kicker">Brand kit</p>
  <h1 style="font-size:clamp(48px,9vw,96px)">FL3X logo</h1>
  <p class="lead">The same logo, redrawn as clean SVG: the money bag on an exact pixel grid, the lettering scaled to the same height, no duplicate shapes. Click SVG or PNG to download a file, Copy to paste the SVG code.</p>
</header>

<section class="hero">{files["fl3x-logo.svg"]}<span class="tag">fl3x.lol</span><span class="tag2">Flex on all screens</span></section>

<section>
  <p class="kicker">Files</p><h2>Variants</h2>
  <div class="grid">{cards_html}</div>
</section>

<section>
  <p class="kicker">Construction</p><h2>The grid</h2>
  <p class="lead">One bag pixel is the unit of the whole logo.</p>
  <div class="split">
    <div class="panel">{grid_svg}</div>
    <div class="panel">
      <ul class="facts">
        <li><b>Bag</b><span>15 × 16 pixels, 1 pixel = 2 units</span></li>
        <li><b>Height</b><span>Lettering cap height = bag height = 32 units</span></li>
        <li><b>Gap</b><span>9 units between the bag and the F</span></li>
        <li><b>Full logo</b><span>{W:g} × 32 units</span></li>
        <li><b>Clear space</b><span>At least 2 bag pixels on every side</span></li>
        <li><b>Smallest size</b><span>Logo 20 px tall · icon 16 px</span></li>
        <li><b>Weight</b><span>{len(files["fl3x-logo.svg"]) / 1000:.1f} KB (was {len(old) / 1000:.1f} KB)</span></li>
      </ul>
      <div class="sizes">
        <figure><div style="height:20px">{files["fl3x-logo.svg"].replace('width="'+format(W,'g')+'" height="32"', 'height="20" width="'+format(W*20/32,'g')+'"')}</div>20 px</figure>
        <figure><div style="height:32px">{files["fl3x-logo.svg"]}</div>32 px</figure>
        <figure><div style="height:16px">{files["fl3x-icon.svg"].replace('width="30" height="32"','width="15" height="16"')}</div>16 px</figure>
        <figure><div style="height:32px">{files["fl3x-icon.svg"]}</div>32 px</figure>
      </div>
    </div>
  </div>
</section>

<section>
  <p class="kicker">Before / after</p><h2>Same drawing, cleaner file</h2>
  <div class="compare">
    <div class="panel"><div class="stage">{old}</div><p class="lead" style="margin:0">Before: coordinates like 4.99939 instead of 5, the lettering drawn twice on top of itself.</p></div>
    <div class="panel"><div class="stage">{files["fl3x-logo.svg"]}</div><p class="lead" style="margin:0">After: every bag pixel on the grid, each letter drawn once, one path per color.</p></div>
  </div>
</section>

<section>
  <p class="kicker">Colors</p><h2>Palette</h2>
  <p class="lead">Click a color to copy it.</p>
  <div class="swatches">{colors_html}</div>
</section>

<section>
  <p class="kicker">Type</p><h2>Typefaces</h2>
  <div class="type">
    <div class="panel"><p class="kicker" style="margin:0">Display · Moga</p><p class="sample" style="font-family:Moga">FL3X ON ALL SCREENS</p><p class="lead">Titles, names on profiles, numbers.</p></div>
    <div class="panel"><p class="kicker" style="margin:0">Body · Outfit</p><p class="sample" style="font-family:Outfit;font-size:40px">Your crypto profile, live.</p><p class="lead">Everything else, Light 300 and Regular 400.</p></div>
  </div>
</section>

<section>
  <p class="kicker">Rules</p><h2>Don't</h2>
  <div class="dont">
    <div class="panel"><div style="background:#0B0B0B">{files["fl3x-logo.svg"].replace('fill="#FF97CB"', 'fill="#4FC3F7"')}</div><p>Recolor the bag or the 3. Pink, or one color.</p></div>
    <div class="panel"><div style="background:#0B0B0B"><span style="display:block;transform:scaleX(1.5)">{files["fl3x-logo.svg"]}</span></div><p>Stretch or squash it.</p></div>
    <div class="panel"><div style="background:#FF97CB">{files["fl3x-logo.svg"]}</div><p>Put the pink logo on pink. Use the one-color version.</p></div>
    <div class="panel"><div style="background:#0B0B0B">{files["fl3x-logo.svg"].replace('<path fill="#fff"', '<path stroke="#fff" stroke-width="1" fill="none"')}</div><p>Outline or smooth the letters.</p></div>
  </div>
</section>
</main>
<script>
const SVGS = {json.dumps(svgs)};
const flash = (b, t) => {{ const o = b.textContent; b.textContent = t; b.classList.add("done"); setTimeout(() => {{ b.textContent = o; b.classList.remove("done"); }}, 1200); }};
const save = (blob, name) => {{ const a = document.createElement("a"); a.href = URL.createObjectURL(blob); a.download = name; a.click(); setTimeout(() => URL.revokeObjectURL(a.href), 1000); }};
document.addEventListener("click", async (e) => {{
  const b = e.target.closest("button"); if (!b) return;
  if (b.dataset.dl) {{ save(new Blob([SVGS[b.dataset.dl]], {{ type: "image/svg+xml" }}), b.dataset.dl); flash(b, "Saved"); }}
  if (b.dataset.copy) {{ await navigator.clipboard.writeText(SVGS[b.dataset.copy]); flash(b, "Copied"); }}
  if (b.dataset.hex) {{ await navigator.clipboard.writeText(b.dataset.hex); const c = b.querySelector("code"); const o = c.textContent; c.textContent = "Copied"; setTimeout(() => c.textContent = o, 1000); }}
  if (b.dataset.png) {{
    // Renders the SVG at 8x (or 2x for the 512 app icons) into a transparent PNG.
    const svg = SVGS[b.dataset.png]; const img = new Image();
    img.src = "data:image/svg+xml;charset=utf-8," + encodeURIComponent(svg);
    await img.decode();
    const k = img.width >= 512 ? 2 : 8; const c = document.createElement("canvas");
    c.width = Math.round(img.width * k); c.height = Math.round(img.height * k);
    c.getContext("2d").drawImage(img, 0, 0, c.width, c.height);
    c.toBlob((blob) => save(blob, b.dataset.png.replace(".svg", ".png")), "image/png"); flash(b, "Saved");
  }}
}});
</script>
</body>
</html>
'''
with open(os.path.join(page_dir, "logo.html"), "w") as f:
    f.write(page)
print("docs/brand/logo.html", len(page))
