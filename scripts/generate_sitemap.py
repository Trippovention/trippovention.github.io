"""
Generate sitemap.xml and image-sitemap.xml for trippovention.com
"""

import os
import re
from datetime import date, datetime, timezone
from urllib.parse import quote

SITE_ROOT = os.path.abspath(os.path.join(os.path.dirname(__file__), ".."))
DOMAIN = "https://trippovention.com"
TODAY = date.today().isoformat()


def lastmod_for_rel(rel_path):
    full = os.path.join(SITE_ROOT, rel_path.replace("/", os.sep))
    try:
        mtime = os.path.getmtime(full)
        return datetime.fromtimestamp(mtime, tz=timezone.utc).date().isoformat()
    except OSError:
        return TODAY

SKIP_HTML = {"404.html", "offline.html"}
SKIP_PATH_PARTS = {"_validation", "node_modules"}
NOINDEX_RE = re.compile(
    r'<meta[^>]+name=["\']robots["\'][^>]+content=["\'][^"\']*noindex',
    re.I,
)


def is_noindex_page(rel_path):
    full = os.path.join(SITE_ROOT, rel_path.replace("/", os.sep))
    try:
        with open(full, encoding="utf-8") as f:
            return NOINDEX_RE.search(f.read()) is not None
    except OSError:
        return False


def should_skip(rel_path):
    base = os.path.basename(rel_path)
    if base in SKIP_HTML:
        return True
    parts = rel_path.replace("\\", "/").split("/")
    return any(p in SKIP_PATH_PARTS for p in parts)


def get_priority(rel_path):
    rel = rel_path.replace("\\", "/")
    if rel == "index.html":
        return "1.0"
    if rel in (
        "contact.html",
        "destinations.html",
        "destinations-themes.html",
        "destinations-travelers.html",
        "services.html",
    ):
        return "0.9"
    if rel.endswith("/index.html"):
        return "0.85"
    if rel in ("privacy-policy.html", "refund-policy.html", "terms-and-conditions.html"):
        return "0.5"
    if rel == "thank-you.html":
        return "0.3"
    if rel in ("llms.txt", "llms-full.txt"):
        return "0.5"
    return "0.7"


def collect_html_files():
    paths = []
    for dp, _dn, fns in os.walk(SITE_ROOT):
        for f in fns:
            if not f.endswith(".html"):
                continue
            full = os.path.join(dp, f)
            rel = os.path.relpath(full, SITE_ROOT)
            if should_skip(rel):
                continue
            paths.append(rel.replace("\\", "/"))
    return sorted(paths)


def generate_sitemap():
    html_files = collect_html_files()
    indexable_html = [rel for rel in html_files if not is_noindex_page(rel)]
    extra_txt = []
    for name in ("llms.txt", "llms-full.txt"):
        if os.path.isfile(os.path.join(SITE_ROOT, name)):
            extra_txt.append(name)

    urls = []
    for rel in indexable_html + extra_txt:
        urls.append((f"{DOMAIN}/{rel}", get_priority(rel)))

    urls.sort(key=lambda x: (-float(x[1]), x[0]))

    lines = ['<?xml version="1.0" encoding="UTF-8"?>']
    lines.append('<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">')
    for url, priority in urls:
        rel = url.replace(f"{DOMAIN}/", "")
        lines.append("  <url>")
        lines.append(f"    <loc>{url}</loc>")
        lines.append(f"    <lastmod>{lastmod_for_rel(rel)}</lastmod>")
        lines.append("    <changefreq>weekly</changefreq>")
        lines.append(f"    <priority>{priority}</priority>")
        lines.append("  </url>")
    lines.append("</urlset>")
    lines.append("")

    out = os.path.join(SITE_ROOT, "sitemap.xml")
    with open(out, "w", encoding="utf-8", newline="\n") as f:
        f.write("\n".join(lines))
    print(f"Generated sitemap.xml with {len(urls)} URLs")
    return html_files


def page_url_for_rel(rel_path):
    return f"{DOMAIN}/{rel_path.replace(chr(92), '/')}"


def generate_image_sitemap(html_files):
    img_re = re.compile(r'<img[^>]+src=["\']([^"\']+)["\']', re.I)
    og_re = re.compile(r'<meta[^>]+property=["\']og:image["\'][^>]+content=["\']([^"\']+)["\']', re.I)
    page_images = {}

    for rel in html_files:
        full = os.path.join(SITE_ROOT, rel.replace("/", os.sep))
        try:
            with open(full, encoding="utf-8") as f:
                html = f.read()
        except OSError:
            continue
        rel_dir = os.path.dirname(rel).replace("\\", "/")
        found = set()
        for pattern in (img_re, og_re):
            for src in pattern.findall(html):
                if src.startswith("http://") or src.startswith("https://"):
                    if DOMAIN in src:
                        found.add(src.split(DOMAIN, 1)[-1].lstrip("/"))
                    continue
                if src.startswith("data:"):
                    continue
                clean = src.split("?")[0].split("#")[0]
                abs_path = os.path.normpath(os.path.join(SITE_ROOT, rel_dir, clean))
                if not abs_path.startswith(SITE_ROOT):
                    continue
                if os.path.isfile(abs_path):
                    rel_img = os.path.relpath(abs_path, SITE_ROOT).replace("\\", "/")
                    if "/social/" in rel_img or rel_img.endswith(".svg"):
                        continue
                    found.add(rel_img)
        if found:
            page_images[rel] = sorted(found)

    lines = ['<?xml version="1.0" encoding="UTF-8"?>']
    lines.append('<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9"')
    lines.append('        xmlns:image="http://www.google.com/schemas/sitemap-image/1.1">')

    for rel, images in sorted(page_images.items()):
        lines.append("  <url>")
        lines.append(f"    <loc>{page_url_for_rel(rel)}</loc>")
        for img_rel in images:
            img_url = f"{DOMAIN}/{quote(img_rel.replace(chr(92), '/'), safe='/:@%')}"
            title = os.path.splitext(os.path.basename(img_rel))[0].replace("_", " ")
            lines.append("    <image:image>")
            lines.append(f"      <image:loc>{img_url}</image:loc>")
            lines.append(f"      <image:title>{title}</image:title>")
            lines.append("    </image:image>")
        lines.append("  </url>")

    lines.append("</urlset>")
    lines.append("")

    out = os.path.join(SITE_ROOT, "image-sitemap.xml")
    with open(out, "w", encoding="utf-8", newline="\n") as f:
        f.write("\n".join(lines))
    print(f"Generated image-sitemap.xml with {len(page_images)} page entries")


if __name__ == "__main__":
    html_files = generate_sitemap()
    generate_image_sitemap(html_files)
