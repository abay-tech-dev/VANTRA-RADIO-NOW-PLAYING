#!/usr/bin/env python3
"""Builds preview-standalone.html: the configurator with the radio embedded (one single file).
Run after editing anything:  python3 build-preview.py"""
import html, pathlib, re

root = pathlib.Path(__file__).parent
w = root / "widget"
page = (root / "index.html").read_text(encoding="utf-8")
widget = (w / "index.html").read_text(encoding="utf-8")

# Inline the widget's CSS and JS so the radio needs no other file
widget = widget.replace('<link rel="stylesheet" href="style.css">', "<style>\n" + (w / "style.css").read_text(encoding="utf-8") + "\n</style>")
widget = widget.replace('<script src="script.js"></script>', "<script>\n" + (w / "script.js").read_text(encoding="utf-8") + "\n</script>")

# Put the radio inside the preview frame
page = page.replace('<iframe id="frame" src="widget/index.html"', '<iframe id="frame" srcdoc="' + html.escape(widget, quote=True) + '"', 1)

# Preview defaults: manual text (no account needed) + a new track every 6 seconds
page = page.replace('<option value="lastfm" selected>', '<option value="lastfm">', 1)
page = page.replace('<option value="manual">Manual text</option>', '<option value="manual" selected>Manual text</option>', 1)
page = page.replace("<title>VANTRA STUDIO · Radio Now Playing</title>", "<title>Radio Now Playing · Preview</title>", 1)
page = page.replace("push();\n</script>", """push();
// Standalone preview: change track automatically every 6 s (stops as soon as you click a test button)
let auto = setInterval(() => document.getElementById('t-next').click(), 6000);
document.querySelectorAll('.tests .btn').forEach(b => b.addEventListener('click', e => { if (e.isTrusted) clearInterval(auto); }));
</script>""", 1)

(root / "preview-standalone.html").write_text(page, encoding="utf-8")
print("preview-standalone.html updated")
