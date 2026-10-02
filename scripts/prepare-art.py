#!/usr/bin/env python3
"""Convert the downloaded PNG layers to lossless WebP (best for pixel art),
rename them farthest->nearest, and extract the palette used by css/style.css.
Usage: python3 scripts/prepare-art.py <folder-with-PNGs>
"""
import sys, json, colorsys, os
from PIL import Image
src = sys.argv[1] if len(sys.argv) > 1 else "source"
# pack name -> (our file name)
ORDER = [("Background","01-sky"),("3","02-sky-streaks"),("1","03-mountains-far"),("2","04-mountains-near"),
         ("4","05-forest-haze"),("5","06-forest-mid"),("6","07-pines-big"),("7","08-meadow-edge"),
         ("8","09-ground"),("Foreground","10-foreground-trees")]
os.makedirs("assets/art", exist_ok=True)
total = 0
fills = {}
for old, new in ORDER:
    im = Image.open(f"{src}/{old}.png").convert("RGBA")
    out = f"assets/art/{new}.webp"
    im.save(out, "WEBP", lossless=True, quality=100, method=6)
    sz = os.path.getsize(out); total += sz
    px = im.getpixel((10, im.height-1))
    fills[new] = "#%02x%02x%02x" % px[:3] if px[3] == 255 else None
    print(f"{new}.webp  {sz/1024:.1f} KB  bottom-fill={fills[new]}")
print(f"TOTAL {total/1024:.1f} KB")
hexs = lambda c: "#%02x%02x%02x" % c
pal = {
 "skyTop": hexs(Image.open(f"{src}/Background.png").convert("RGB").getpixel((5,5))),
 "skyBottom": hexs(Image.open(f"{src}/1.png").convert("RGB").getpixel((5,179))),
 "mountain": hexs(Image.open(f"{src}/2.png").convert("RGB").getpixel((5,179))),
 "hazeForest": hexs(Image.open(f"{src}/4.png").convert("RGB").getpixel((5,179))),
 "forest": hexs(Image.open(f"{src}/5.png").convert("RGB").getpixel((5,179))),
 "shadow": hexs(Image.open(f"{src}/6.png").convert("RGB").getpixel((5,179))),
 "ground": hexs(Image.open(f"{src}/8.png").convert("RGB").getpixel((5,179))),
}
# The pack has no sun layer: derive the sun from the horizon colour (hue kept, saturation boosted)
r,g,b = [int(pal["skyBottom"][i:i+2],16)/255 for i in (1,3,5)]
h,s,v = colorsys.rgb_to_hsv(r,g,b)
sr,sg,sb = colorsys.hsv_to_rgb(h, min(1, s*2.9), 1.0)
pal["sun"] = hexs((round(sr*255), round(sg*255), round(sb*255)))
print(json.dumps(pal, indent=2))
json.dump({"palette": pal, "fills": fills}, open("assets/art/palette.json","w"), indent=2)
