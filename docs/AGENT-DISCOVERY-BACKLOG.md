# Agent discovery backlog (optional)

Items that improve audit scores but are **not required** for a static travel marketing site. Prioritize only if you care about scanner percentages.

| Item | Effort | Notes |
|------|--------|--------|
| DNS-AID records | DNS | [DNS-AID-SETUP.md](./DNS-AID-SETUP.md) |
| Cloudflare Link response header | Dashboard | [CLOUDFLARE-OPS.md](./CLOUDFLARE-OPS.md) |
| Markdown content negotiation | Cloudflare product | Same doc |
| Sitemap `lastmod` per file | Script | Update [generate_sitemap.py](../scripts/generate_sitemap.py) to use git/file mtime instead of one bulk date |
| Inner-page JSON-LD / BreadcrumbList | Large | Roll out via `_validation` templates across package pages |
| RSS/Atom feed | Medium | Add feed + `<link rel="alternate" type="application/rss+xml">` on homepage |
| OAuth / OpenAPI / status page | N/A | **Do not add** without a real API and login |
| Commerce protocols (x402, UCP, ACP) | N/A | Not a commerce site |

## OAuth and API audit category

Scanners may report **0** on Authentication & API Quality. That is **expected and honest** for trippovention.com. Do not publish fake `/.well-known/oauth-*` metadata.
