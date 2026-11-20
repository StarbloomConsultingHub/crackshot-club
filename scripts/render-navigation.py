"""Regenerate the shared navigation as static HTML in each full site header."""

from html import escape
from pathlib import Path
import re

site = Path(__file__).resolve().parents[1] / "site"
primary = [("/hall", "Smoothbore Hall"), ("/gallery-atlas", "Gallery Map"), ("/games", "Arcade")]
more = [
    ("/", "Home"), ("/about", "History"), ("/gallery-hall", "Gallery Games Hall"),
    ("/cracker-count", "Cracker Count"), ("/rules", "Rules"), ("/safety", "Safety"),
    ("/designs", "Designs & Targets"), ("/gear", "Gear"),
]

def link(path, title, current):
    mark = ' aria-current="page"' if path == current else ""
    return f'<li><a href="{path}"{mark}>{escape(title)}</a></li>'

for page in sorted(site.rglob("*.html")):
    if "node_modules" in page.parts:
        continue
    source = page.read_text()
    pattern = r'<nav class="main" id="nav" aria-label="Main">.*?</nav>'
    if not re.search(pattern, source, re.S):
        continue
    route = page.parent if page.name == "index.html" else page.with_suffix("")
    current = "/" + route.relative_to(site).as_posix().removeprefix(".")
    links = [link(path, title, current) for path, title in primary]
    others = "".join(link(path, title, current) for path, title in more)
    group = ' class="current-group"' if current in dict(more) else ""
    links += [f'<li><details{group}><summary>More</summary><ul>{others}</ul></details></li>',
              link("/join", "Join the club", current)]
    nav = '<nav class="main" id="nav" aria-label="Main"><ul>\n' + "\n".join(links) + '\n</ul></nav>'
    rendered = re.sub(pattern, lambda _: nav, source, count=1, flags=re.S)
    if rendered != source:
        page.write_text(rendered)
