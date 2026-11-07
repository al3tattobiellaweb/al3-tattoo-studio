"""The Studio Space's photos and the studio dog's print.

Round 25 (owner: "fetch the pictures from the folder 'final foto studio' and use them for the Studio fotos instead of
the current one. For the dog use it to replace the dog photo"): six new photos of the studio replace the three from
'al3 studio' (round 8; round 15 dropped the walk video and made them prints that open large), and his photo of the
bulldog on the couch replaces the old bulldog print in the people section.

    python -I scripts/studio-space.py

Reads assets/final foto studio/. Writes public/space/<name>.webp (1080 px tall, the prints on desktop), _s.webp (640,
phones) and _l.webp (1920, opened large), and public/studio/bulldog-divano.webp (the dog as shot: 390 x 640).
New names throughout, so no browser keeps an old photo under an old name.
"""
import os
from PIL import Image, ImageOps

HERE = os.path.dirname(os.path.abspath(__file__)); SITE = os.path.dirname(HERE); ROOT = os.path.dirname(SITE)
SRC = os.path.join(ROOT, "assets", "final foto studio")
OUT = os.path.join(SITE, "public", "space")
os.makedirs(OUT, exist_ok=True)
PHOTOS = {  # a walk through the studio, in the order the prints are shown (data.js SPACE.photos)
    "IMG_7613": "ingresso",    # the hall: painted doors, ivy, violet neon
    "IMG_7616": "corridoio",   # the corridor with the "Chill Vibes" rugs
    "IMG_7626": "sala",        # the long room: leather couch, plants, the painted ceiling
    "IMG_7619": "postazione",  # the tattoo station: black chair, red trolley, lamps
    "IMG_7625": "nicchia",     # the red niche with the painting and the shelves
    "IMG_7634": "scaffale",    # the wall of framed records
}
DOG = "IMG_5830"

for stem, name in PHOTOS.items():
    im = ImageOps.exif_transpose(Image.open(os.path.join(SRC, stem + ".jpg"))).convert("RGB")
    for h, suffix, q in ((1080, "", 84), (640, "_s", 80), (1920, "_l", 82)):
        h = min(h, im.height)
        w = round(im.width * h / im.height)
        im.resize((w, h), Image.LANCZOS).save(os.path.join(OUT, f"{name}{suffix}.webp"), quality=q, method=6)
    print(name, im.size)

dog = ImageOps.exif_transpose(Image.open(os.path.join(SRC, DOG + ".jpg"))).convert("RGB")
dog.save(os.path.join(SITE, "public", "studio", "bulldog-divano.webp"), quality=88, method=6)  # small already: kept as shot
print("bulldog-divano", dog.size)
