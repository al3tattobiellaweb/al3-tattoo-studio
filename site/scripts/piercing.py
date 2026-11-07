"""The Piercing section's photos (round 26, owner: "dobbiamo aggiungere una sessione per i piercing, go fetch the content
from his IG profile and integrate it to the website with a piercing section").

Nine photos from his six piercing posts on @sgt.zippo (June 2024 to June 2025, read logged out; the originals as posted,
1440 px wide, no metadata) are kept in assets/piercing/. Which post each comes from is in src/data.js (PIERCING.photos).

    python -I scripts/piercing.py

Writes public/piercing/<name>.webp (720 px wide, the grid), _s.webp (360, phones) and _l.webp (1440, opened large).
"""
import os
from PIL import Image

HERE = os.path.dirname(os.path.abspath(__file__)); SITE = os.path.dirname(HERE); ROOT = os.path.dirname(SITE)
SRC = os.path.join(ROOT, "assets", "piercing")
OUT = os.path.join(SITE, "public", "piercing")
os.makedirs(OUT, exist_ok=True)

for f in sorted(os.listdir(SRC)):
    if not f.lower().endswith(".jpg"):
        continue
    name = f[:-4]
    im = Image.open(os.path.join(SRC, f)).convert("RGB")
    for w, suffix, q in ((720, "", 82), (360, "_s", 78), (1440, "_l", 82)):
        w = min(w, im.width)
        h = round(im.height * w / im.width)
        im.resize((w, h), Image.LANCZOS).save(os.path.join(OUT, f"{name}{suffix}.webp"), quality=q, method=6)
    print(name, im.size)
