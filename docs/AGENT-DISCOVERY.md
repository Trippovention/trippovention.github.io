# Agent and crawler discovery (static site)

Trippovention is hosted as **static HTML** on GitHub Pages with custom domain `trippovention.com`. There is **no login** and **no backend API**.

## What agents should use

| Resource | Purpose |
|----------|---------|
| [llms.txt](../llms.txt) | Primary curated summary for LLM crawlers |
| [llms-full.txt](../llms-full.txt) | Expanded listings |
| [robots.txt](../robots.txt) | Crawl rules + `Content-Signal` preferences |
| [auth.md](../auth.md) | Policy for automated clients (no OAuth) |
| [sitemap.xml](../sitemap.xml) | All pages |

## Files added for discovery standards

- `/.well-known/api-catalog` — RFC 9727 linkset pointing at documentation only (not REST APIs)
- `/.well-known/agent-skills/index.json` — index of real static URLs with SHA-256 digests
- `/.well-known/mcp/server-card.json` — WebMCP on homepage only (no SSE server)
- `index.html` — `<link rel="...">` discovery hints on the homepage
- `_headers` — optional HTTP `Link` headers if the host applies this file (plain GitHub Pages does not)

## Optional DNS (not in git)

See [DNS-AID-SETUP.md](./DNS-AID-SETUP.md) if you publish DNS-AID records at your DNS provider.

## After deploy

Re-run [isitagentready.com](https://isitagentready.com) scans. Some checks (markdown negotiation, DNS-AID, Link headers on GitHub Pages-only hosting) may remain unsupported without Cloudflare or similar.
