# Re-scan checklist (Goodie + Cloudflare)

After deploying changes from `main`, run fresh audits and save exports as [report1](../../report1) and [report2](../../report2) in the repo root (or keep PDFs in Downloads).

## URLs

- Goodie: use their agent readiness scan for `https://trippovention.com`
- Cloudflare: [isitagentready.com](https://isitagentready.com) (or Cloudflare agent-ready tool)

## Pre-scan curl checks

```bash
curl.exe -sI https://trippovention.com/.well-known/api-catalog.json
curl.exe -sI https://trippovention.com/.well-known/agent-skills/index.json
curl.exe -sI https://trippovention.com/.well-known/mcp/server-card.json
curl.exe -sI https://trippovention.com/auth.md
```

Expect **200** on all.

## What should improve vs prior reports

- Homepage **Organization** JSON-LD (Goodie)
- **api-catalog.json** content-type (`application/json`)
- **MCP card** tool `inputSchema` entries (Goodie)
- **auth.md** agent registration section (Cloudflare wording)
- **Sitemap** distinct `<lastmod>` per file (Goodie freshness)
- **No** Twitter meta (by design)

## Still expected to fail (OK)

- OAuth / OIDC / protected resource
- Link HTTP headers (unless Cloudflare Transform Rule applied — see [CLOUDFLARE-OPS.md](./CLOUDFLARE-OPS.md))
- DNS-AID, Markdown negotiation
- Goodie crawl access if Cloudflare challenges scan IPs (manual curl may still show 200)

## Last local crawler verification

All returned **HTTP/1.1 200 OK** for GPTBot, ClaudeBot, PerplexityBot, Google-Extended, Anthropic-AI, Bingbot (see [CLOUDFLARE-OPS.md](./CLOUDFLARE-OPS.md)).
