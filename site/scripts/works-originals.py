"""Every work on skin as he posted it (owner, round 14: "some of the tattoos … have been cut poorly so it looks like
the subjects are mutilated … bring back the original photos"). Replaces the cut-out post style of round 8
(work-style.py, retired): the photo itself, whole, only resized.

    python -I scripts/works-originals.py <raw_dir> [id,id,…]

raw_dir holds the downloads from his public posts: full/aNNN.jpg (the post's own slide at its original size, slide
from src/ig-posts.js) and mix/mix_NN.jpg (the frame of the "Mix" reel each wNN was taken from, found by matching).
Writes public/works/<id>.webp and <id>_s.webp: aNNN 1080 px long side + 480 w; wNN 720×1280 + 360×640. Colour
profiles are kept. Works with no download are left as they are and listed.
"""
import sys, os, re
from PIL import Image

HERE = os.path.dirname(os.path.abspath(__file__)); SITE = os.path.dirname(HERE)
RAW = sys.argv[1]
ONLY = set(sys.argv[2].split(",")) if len(sys.argv) > 2 else None
OUT = os.path.join(SITE, "public", "works")


def works():
    """every work the site shows: feed ids from src/catalogue.js, reel frames from src/data.js"""
    cat = open(os.path.join(SITE, "src", "catalogue.js"), encoding="utf8").read()
    feed = re.findall(r'id: "(a\d{3})"', cat)
    data = open(os.path.join(SITE, "src", "data.js"), encoding="utf8").read()
    mix = sorted(f"w{m}" for m in re.findall(r'id: "(\d\d)"', data.split("export const WORKS", 1)[1].split("];", 1)[0]))
    return feed, mix


def save(im, wid):
    icc = im.info.get("icc_profile")
    im = im.convert("RGB")
    kw = {"icc_profile": icc} if icc else {}
    if wid.startswith("w"):
        im.resize((720, 1280), Image.LANCZOS).save(os.path.join(OUT, wid + ".webp"), quality=80, method=6, **kw)
        im.resize((360, 640), Image.LANCZOS).save(os.path.join(OUT, wid + "_s.webp"), quality=74, method=6, **kw)
    else:
        big = im.copy(); big.thumbnail((1080, 1080), Image.LANCZOS)
        big.save(os.path.join(OUT, wid + ".webp"), quality=80, method=6, **kw)
        s = 480 / im.width
        im.resize((480, round(im.height * s)), Image.LANCZOS).save(os.path.join(OUT, wid + "_s.webp"), quality=72, method=6, **kw)


if __name__ == "__main__":
    feed, mix = works()
    todo = [w for w in feed + mix if ONLY is None or w in ONLY]
    missing = []
    for wid in todo:
        src = os.path.join(RAW, "mix", f"mix_{wid[1:]}.jpg") if wid.startswith("w") else os.path.join(RAW, "full", f"{wid}.jpg")
        if not os.path.exists(src):
            missing.append(wid); continue
        save(Image.open(src), wid)
    print("restored", len(todo) - len(missing), "of", len(todo), "· left as they are:", missing)
