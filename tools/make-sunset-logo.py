#!/usr/bin/env python3
"""Draws the SUNSET FM logo as a PNG picture and stores it inside widget/style.css.

The logo is a fixed image: no font file is shipped with the widget.
Usage:  python3 tools/make-sunset-logo.py path/to/pricedown.ttf ["SUNSET FM"]
Then:   python3 build-streamelements.py && python3 build-preview.py
"""
import base64, io, pathlib, re, sys
from PIL import Image, ImageDraw, ImageFont

root = pathlib.Path(__file__).resolve().parent.parent
font_path = sys.argv[1]
text = sys.argv[2] if len(sys.argv) > 2 else "SUNSET FM"

H = 136                                   # drawn at 4x the 34 px line, crisp when scaled up
font = ImageFont.truetype(font_path, 116)
stroke = 9                                # black outline
shadow = (7, 9)                           # black drop shadow
box = ImageDraw.Draw(Image.new("L", (1, 1))).textbbox((0, 0), text, font=font, stroke_width=stroke)
w, h = box[2] - box[0] + shadow[0] + 4, box[3] - box[1] + shadow[1] + 4
img = Image.new("RGBA", (w, max(h, H)), (0, 0, 0, 0))
d = ImageDraw.Draw(img)
ox, oy = -box[0] + 2, -box[1] + 2 + max(0, (H - h) // 2)
d.text((ox + shadow[0], oy + shadow[1]), text, font=font, fill=(0, 0, 0, 255), stroke_width=stroke, stroke_fill=(0, 0, 0, 255))
d.text((ox, oy), text, font=font, fill=(255, 255, 255, 255), stroke_width=stroke, stroke_fill=(0, 0, 0, 255))
img = img.crop(img.getbbox())

buf = io.BytesIO()
img.save(buf, "PNG", optimize=True)
(root / "tools" / "sunset-logo.png").write_bytes(buf.getvalue())
uri = "data:image/png;base64," + base64.b64encode(buf.getvalue()).decode()

css_path = root / "widget" / "style.css"
css = css_path.read_text(encoding="utf-8")
block = f":root {{ --sunset-logo: url({uri}); }}\n"
css = re.sub(r"(/\* SUNSET-LOGO:START[^\n]*\*/\n).*?(/\* SUNSET-LOGO:END \*/)", lambda m: m.group(1) + block + m.group(2), css, flags=re.S)
css_path.write_text(css, encoding="utf-8")
print(f"logo {img.size[0]}x{img.size[1]} px, {len(buf.getvalue()) // 1024} KB -> widget/style.css")
