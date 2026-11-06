"""The Studio Space's media: his three photos of the studio (owner, round 8: "use … the pictures in the 'al3 studio'
folder"). Round 15 (owner: "remove the video of the studio and keep the 3 images next to each other, you can click on
one image to make it bigger"): the walk video, its frame pack and its phone loop are gone; the photos gain a large size
for the lightbox.

    python -I scripts/studio-space.py

Reads assets/al3 studio/. Writes public/space/{parete,vinili,serpente}.webp (1080 px tall, the prints on desktop),
_s.webp (640, phones) and _l.webp (1920, opened large; the snake's original is 2048 tall).
"""
import os
from PIL import Image, ImageOps

HERE = os.path.dirname(os.path.abspath(__file__)); SITE = os.path.dirname(HERE); ROOT = os.path.dirname(SITE)
SRC = os.path.join(ROOT, "assets", "al3 studio")
OUT = os.path.join(SITE, "public", "space")
os.makedirs(OUT, exist_ok=True)
PHOTOS = {  # by file time: the red shelf wall, the vinyl wall with the tiger print, the framed gold snake
    "17.05.03": "parete", "17.05.31": "vinili", "17.09.34": "serpente",
}

for f in sorted(os.listdir(SRC)):
    name = next((v for k, v in PHOTOS.items() if k in f), None)
    if not name or not f.lower().endswith((".jpg", ".jpeg")):
        continue
    im = ImageOps.exif_transpose(Image.open(os.path.join(SRC, f))).convert("RGB")
    for h, suffix, q in ((1080, "", 84), (640, "_s", 80), (1920, "_l", 82)):
        h = min(h, im.height)
        w = round(im.width * h / im.height)
        im.resize((w, h), Image.LANCZOS).save(os.path.join(OUT, f"{name}{suffix}.webp"), quality=q, method=6)
    print(name, im.size)
