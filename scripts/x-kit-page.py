#!/usr/bin/env python3
"""Builds docs/x-kit/kit.html from docs/x-kit/README.md (FL3X).

One card per tweet (text, image, Copy button), the article with a rich-text
Copy button, and the profile images. Open kit.html in a browser.
Usage: python3 scripts/x-kit-page.py
"""
import html
import re
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
KIT = ROOT / 'docs' / 'x-kit'
readme = (KIT / 'README.md').read_text()


def section(title_start: str) -> str:
    m = re.search(rf'^## {re.escape(title_start)}.*?$(.*?)(?=^## |\Z)', readme, re.M | re.S)
    return m.group(1) if m else ''


def tweets(body: str):
    """Yields (label, image, text) for each fenced block, with the line above it."""
    out = []
    for m in re.finditer(r'((?:^[^\n]*\n){0,2})```\n(.*?)\n```', body, re.M | re.S):
        head = m.group(1)
        num = re.search(r'\*\*([GF]?\d+)\.\*\*', head)
        img = re.search(r'`([\w-]+\.png)`', head)
        note = re.search(r'\(([^)]*)\)\s*$', head.strip())
        label = f'#{num.group(1)}' if num else ('Variant' if 'Variante' in head else 'Main')
        out.append((label, img.group(1) if img else None, m.group(2), note.group(1) if note else None))
    return out


def md_inline(s: str) -> str:
    s = html.escape(s)
    s = re.sub(r'\*\*(.+?)\*\*', r'<strong>\1</strong>', s)
    return s


def plain(s: str) -> str:
    return re.sub(r'\*\*(.+?)\*\*', r'\1', s)


def step(n: int, tag: str, content: str, copy: str | None = None, note: str | None = None) -> str:
    btn = f'<button class="copy" data-text="{html.escape(copy, quote=True)}">Copy</button>' if copy else ''
    hint = f'<span class="step-note">{note}</span>' if note else ''
    return f'''<div class="step">
  <span class="step-n">{n}</span>
  <span class="tag tag-{tag.split()[0].lower()}">{tag}</span>
  <div class="step-body"><div>{content}</div>{hint}</div>
  {btn}
</div>'''


def article_steps(body: str) -> str:
    """The article as a list of blocks, each with the X editor style to use."""
    body = body.split('### ', 1)[1]
    lines = [l.rstrip() for l in ('### ' + body).splitlines() if l.strip()]
    out, n, headings = [], 0, 0

    def add(*a, **k):
        nonlocal n
        n += 1
        out.append(step(n, *a, **k))

    add('COVER', '<a href="images/article-cover.png" download><img class="step-img" src="images/article-cover.png" alt=""></a>', note='article-cover.png, 5:2 (1500×600). Click to download, then upload it as the article cover.')
    for line in lines:
        img = re.match(r'\*\[image : ([\w-]+\.png)\]\*', line)
        if line.startswith('### '):
            t = line[4:]
            add('TITLE', f'<strong class="big">{html.escape(t)}</strong>', copy=t, note='Goes in the Title field at the top, not in the body.')
        elif line.startswith('#### '):
            if headings:
                add('DIVIDER', '<hr>', note='Insert → Divider.')
            headings += 1
            t = line[5:]
            add('HEADING', f'<strong>{html.escape(t)}</strong>', copy=t)
        elif img:
            f = img.group(1)
            add('MEDIA', f'<a href="images/{f}" download><img class="step-img" src="images/{f}" alt=""></a>', note=f'Insert → Media → {f}. Click the image to download it.')
        elif line.startswith('- '):
            t = line[2:]
            lead = re.match(r'\*\*(.+?)\*\*', t)
            add('BODY', md_inline(t), copy=plain(t), note=f'One paragraph per item. Select “{html.escape(lead.group(1))}” and make it Bold.' if lead else None)
        elif re.fullmatch(r'[\w.-]+\.lol', line):
            add('LINK', html.escape(line), copy=f'https://{line}', note='Paste the link on its own line, or Insert → Link preview.')
        else:
            add('BODY', md_inline(line), copy=plain(line))
    return '\n'.join(out)


def card(label: str, image: str | None, text: str, note: str | None) -> str:
    img = (
        f'<a class="thumb" href="images/{image}" download><img src="images/{image}" alt=""><span>{image} · Download</span></a>'
        if image
        else '<div class="thumb none">No image</div>'
    )
    tag = f'<span class="note">{html.escape(note)}</span>' if note else ''
    return f'''<article class="tweet">
  {img}
  <div class="body">
    <div class="row"><span class="label">{label}</span>{tag}<span class="count">{len(text)} chars</span></div>
    <pre>{html.escape(text)}</pre>
    <button class="copy" data-text="{html.escape(text, quote=True)}">Copy</button>
  </div>
</article>'''


GROUPS = [
    ('3. Tweet épinglé', 'Pinned tweet', 'Pin it on the profile.'),
    ('4. Bio du compte', 'Account bio', 'Name FL3X, link fl3x.lol. Pick one.'),
    ('5. Giveaways', 'Giveaways and invite codes', 'Winners: paste their addresses in /admin → Wallet grants, and send an invite code while invite-only.'),
    ('6. Avant le lancement', 'Invite-only pre-launch', '3 a day, a few hours apart.'),
    ('7. Ouverture', 'Opening (after the pinned tweet)', ''),
    ('8. Après', 'After opening', 'Never post the same text twice.'),
    ('9. Compte perso', "Founder's personal account", 'First person. Replace [brackets] with real numbers or drop them: never invent one.'),
]

sections = []
for key, title, hint in GROUPS:
    cards = '\n'.join(card(*t) for t in tweets(section(key)))
    sections.append(f'<section><h2 class="group">{title}</h2><p class="hint">{hint}</p>{cards}</section>')

article = article_steps(section('10. Article X'))

PROFILE = [('avatar.png', 'Profile picture (black)'), ('avatar-pink.png', 'Profile picture (pink)'), ('banner.png', 'Banner 1500×500')]
profile = '\n'.join(
    f'<a class="asset {"wide" if "banner" in f else ""}" href="images/{f}" download><img src="images/{f}" alt=""><span>{t} · Download</span></a>' for f, t in PROFILE
)

page = f'''<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>FL3X X kit</title>
<style>
@font-face {{ font-family: Display; src: url(../../apps/web/public/fonts/primary/moga.otf); }}
@font-face {{ font-family: Body; src: url(../../apps/web/public/fonts/secondary/Outfit-Light.ttf); }}
@font-face {{ font-family: Button; src: url(../../apps/web/public/fonts/secondary/Outfit-Regular.ttf); }}
:root {{ --bg:#000; --surface:#111; --surface2:#1a1a1a; --line:#222; --muted:rgba(255,255,255,.45); --accent:#FF97CB; --win:#2FE3AC; --paper:#FF97CB; }}
* {{ box-sizing: border-box; }}
body {{ margin:0; background:var(--bg); color:#fff; font-family:Body, system-ui, sans-serif; }}
main {{ max-width:1080px; margin:0 auto; padding:40px 16px 80px; display:flex; flex-direction:column; gap:48px; }}
header h1 {{ font-variant-ligatures:none; font-family:Display; text-transform:uppercase; font-size:clamp(44px,8vw,80px); line-height:.82; margin:0 0 12px; }}
header p {{ color:var(--muted); margin:0; }}
nav {{ display:flex; flex-wrap:wrap; gap:8px; margin-top:20px; }}
nav a {{ color:#fff; text-decoration:none; background:var(--surface2); padding:8px 12px; border-radius:8px; font-family:Button; font-size:14px; }}
h2.group {{ font-variant-ligatures:none; font-family:Display; text-transform:uppercase; font-size:40px; line-height:.85; margin:0; }}
.hint {{ color:var(--muted); margin:8px 0 16px; }}
section {{ display:flex; flex-direction:column; gap:12px; }}
.tweet {{ display:grid; grid-template-columns:280px 1fr; gap:16px; background:var(--surface); border-radius:16px; padding:12px; }}
.thumb {{ display:flex; flex-direction:column; gap:6px; color:var(--muted); text-decoration:none; font-size:12px; }}
.thumb img {{ width:100%; border-radius:10px; display:block; }}
.thumb.none {{ align-items:center; justify-content:center; background:var(--surface2); border-radius:10px; min-height:120px; }}
.body {{ display:flex; flex-direction:column; gap:10px; min-width:0; }}
.row {{ display:flex; align-items:center; gap:8px; }}
.label {{ font-family:Button; color:#000; background:var(--accent); padding:4px 8px; border-radius:6px; font-size:13px; }}
.note {{ color:var(--muted); font-size:13px; }}
.count {{ margin-left:auto; color:var(--muted); font-size:12px; }}
pre {{ margin:0; white-space:pre-wrap; font-family:Body, system-ui, sans-serif; font-size:16px; line-height:1.45; background:var(--surface2); padding:14px; border-radius:10px; }}
button.copy {{ align-self:flex-start; font-family:Button; font-size:14px; background:var(--paper); color:var(--bg); border:0; border-radius:8px; padding:10px 16px; cursor:pointer; }}
button.copy.done {{ background:var(--win); }}
.assets {{ display:grid; grid-template-columns:1fr 1fr; gap:12px; }}
.asset {{ display:flex; flex-direction:column; gap:6px; background:var(--surface); padding:12px; border-radius:16px; color:var(--muted); text-decoration:none; font-size:13px; }}
.asset img {{ width:100%; border-radius:10px; }}
.asset.wide {{ grid-column:1 / -1; }}
.article {{ background:#f3eef1; color:#000; border-radius:16px; padding:28px; }}
.article h1 {{ font-family:Display; text-transform:uppercase; font-size:48px; line-height:.85; margin:0 0 16px; }}
.article h2 {{ font-family:Button; font-size:24px; margin:28px 0 8px; }}
.article p, .article li {{ font-size:17px; line-height:1.55; }}
.article figure {{ margin:16px 0; }}
.article figure img {{ width:100%; border-radius:10px; }}
.article figcaption {{ font-size:13px; color:#555; margin-top:6px; }}
.steps {{ display:flex; flex-direction:column; gap:8px; }}
.step {{ display:grid; grid-template-columns:28px 110px 1fr auto; align-items:start; gap:12px; background:var(--surface); border-radius:12px; padding:14px; }}
.step-n {{ color:var(--muted); font-size:13px; padding-top:4px; }}
.tag {{ font-family:Button; font-size:12px; border-radius:6px; padding:5px 8px; text-align:center; letter-spacing:.04em; }}
.tag-title {{ background:var(--accent); color:#000; }} .tag-heading {{ background:var(--paper); color:var(--bg); }} .tag-body {{ background:var(--surface2); color:#ccc; }}
.tag-media, .tag-cover {{ background:rgba(46,224,127,.15); color:var(--win); }} .tag-divider {{ border:1px solid var(--line); color:var(--muted); }} .tag-link {{ background:#1d2a44; color:#8ab4ff; }}
.step-body {{ display:flex; flex-direction:column; gap:8px; font-size:16px; line-height:1.5; min-width:0; }}
.step-body .big {{ font-size:22px; }}
.step-body hr {{ border:0; border-top:2px solid var(--line); width:100%; margin:10px 0; }}
.step-img {{ width:100%; max-width:520px; border-radius:10px; display:block; }}
.step-note {{ color:var(--muted); font-size:13px; }}
@media (max-width:700px) {{ .step {{ grid-template-columns:1fr; }} }}
@media (max-width:700px) {{ .tweet {{ grid-template-columns:1fr; }} .assets {{ grid-template-columns:1fr; }} }}
</style>
</head>
<body>
<main>
<header>
  <h1><img src="../../apps/web/public/brand/fl3x-logo.svg" alt="FL3X" style="height:.8em;vertical-align:baseline;margin-right:.25em">X kit</h1>
  <p>Click Copy, paste into X, attach the image shown next to the text. Images download on click.</p>
  <nav><a href="#profile">Profile</a><a href="#tweets">Tweets</a><a href="#article">Article</a></nav>
</header>

<section id="profile"><h2 class="group">Profile</h2><p class="hint">Banner: the bottom corners stay empty (profile picture on the left, buttons on mobile on the right).</p><div class="assets">{profile}</div></section>

<div id="tweets" style="display:flex;flex-direction:column;gap:48px">{''.join(sections)}</div>

<section id="article">
  <h2 class="group">Article</h2>
  <p class="hint">Build it block by block, top to bottom. Each block says which style to pick in the X editor: Title, Heading, Body, Media, Divider, Link. Copy its text with the button.</p>
  <div class="steps">{article}</div>
</section>
</main>
<script>
function flash(b, label) {{ const t = b.textContent; b.textContent = label; b.classList.add('done'); setTimeout(() => {{ b.textContent = t; b.classList.remove('done') }}, 1400) }}
document.querySelectorAll('button.copy[data-text]').forEach((b) => b.addEventListener('click', async () => {{
  try {{ await navigator.clipboard.writeText(b.dataset.text); flash(b, 'Copied') }} catch {{ flash(b, 'Select the text') }}
}}))
</script>
</body>
</html>
'''

(KIT / 'kit.html').write_text(page)
print(KIT / 'kit.html')
