#!/usr/bin/env python3
"""Copy the widget into the streamelements/ folder (one file per StreamElements editor tab).
Run after editing anything in widget/:  python3 build-streamelements.py"""
import re, shutil, pathlib
root = pathlib.Path(__file__).parent
w, se = root / "widget", root / "streamelements"
html = (w / "index.html").read_text(encoding="utf-8")
body = re.search(r"<!-- WIDGET:START -->\n(.*?)<!-- WIDGET:END -->", html, re.S).group(1)
out = {"se-html": body, "se-css": (w / "style.css").read_text(encoding="utf-8"),
       "se-js": (w / "script.js").read_text(encoding="utf-8"), "se-fields": (w / "fields.json").read_text(encoding="utf-8")}
ext = {"se-html": "html", "se-css": "css", "se-js": "js", "se-fields": "json"}
for name, text in out.items():
    (se / f"{name}.{ext[name]}").write_text(text, encoding="utf-8")
    (se / f"{name}.txt").write_text(text, encoding="utf-8")
print("streamelements/ updated")
