# Agent and crawler discovery (static site)

Trippovention is hosted as **static HTML** on GitHub Pages with custom domain `trippovention.com`. There is **no login** and **no backend API**.

## GitHub Pages requirement

Add an empty [`.nojekyll`](../.nojekyll) at the repository root so Jekyll does **not** strip the [`.well-known/`](../.well-known/) directory on deploy. Without it, agent discovery files exist in git but return **404** in production.

After changing `.well-known` or adding `.nojekyll`, wait for GitHub Pages to finish deploying, then verify:

```bash
curl -I https://trippovention.com/.well-known/api-catalog
curl -I https://trippovention.com/.well-known/agent-skills/index.json
curl -I https://trippovention.com/.well-known/mcp/server-card.json
```

All three should return `HTTP/1.1 200` (or `200 OK`).

## What agents should use

| Resource | Purpose |
|----------|---------|
| [llms.txt](../llms.txt) | Primary curated summary for LLM crawlers |
| [llms-full.txt](../llms-full.txt) | Expanded listings |
| [robots.txt](../robots.txt) | Crawl rules + `Content-Signal` preferences |
| [auth.md](../auth.md) | Policy for automated clients (no OAuth) |
| [sitemap.xml](../sitemap.xml) | All pages |

## Files for discovery standards

- `/.well-known/api-catalog` — RFC 9727 linkset pointing at documentation only (not REST APIs)
- `/.well-known/agent-skills/index.json` — index of real static URLs with SHA-256 digests
- `/.well-known/mcp/server-card.json` — WebMCP on homepage only (no SSE server)
- `index.html` — `<link rel="...">` discovery hints on the homepage
- `_headers` — HTTP `Link` headers only if the host applies this file (GitHub Pages **does not**; see [CLOUDFLARE-OPS.md](./CLOUDFLARE-OPS.md))

## Optional DNS (not in git)

See [DNS-AID-SETUP.md](./DNS-AID-SETUP.md) if you publish DNS-AID records at your DNS provider.

## After deploy

Re-run [isitagentready.com](https://isitagentready.com) and Goodie agent audits. OAuth/API checks may remain “missing” by design (static site). See [AGENT-DISCOVERY-BACKLOG.md](./AGENT-DISCOVERY-BACKLOG.md) for optional improvements.
