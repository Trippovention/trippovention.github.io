# Cloudflare operations for AI crawlers and Link headers

Trippovention uses **Cloudflare DNS/proxy** in front of **GitHub Pages**. Some audit failures are fixed in git; others require Cloudflare dashboard changes.

## Allow AI crawlers (Goodie “Homepage returns 200 to crawler UAs”)

Goodie reported non-200 responses for **GPTBot**, **ClaudeBot**, **PerplexityBot**, **Google-Extended**, and challenge pages for **Bingbot**.

### Recommended checks

1. **Security → Settings → Bot Fight Mode** — if enabled, it can block or challenge legitimate crawlers. Consider **Off** or use **Super Bot Fight Mode** with verified bot allowances only if you understand the tradeoff.
2. **Security → WAF → Custom rules** — add rules that **Skip** or **Allow** requests when `User-Agent` contains known AI crawlers you want (match your [robots.txt](../robots.txt) policy).
3. **Security → WAF → Managed rules** — review rules that block “bad bots”; ensure you are not blocking allowed AI agents.
4. **Firewall rules** — ensure no blanket block on unknown user-agents that includes AI crawlers.

### Verify from your machine

```bash
curl.exe -sI -A "GPTBot/1.0" https://trippovention.com/
curl.exe -sI -A "ClaudeBot/1.0" https://trippovention.com/
curl.exe -sI -A "PerplexityBot/1.0" https://trippovention.com/
curl.exe -sI -A "Google-Extended" https://trippovention.com/
curl.exe -sI -A "Mozilla/5.0 (compatible; bingbot/2.0)" https://trippovention.com/
```

Each should return **200** with `text/html`, not **403**, **503**, or a Cloudflare challenge HTML body.

Document any rule IDs you add here for future maintainers.

## HTTP Link headers (RFC 8288)

The repo [`_headers`](../_headers) file sets `Link:` discovery headers, but **GitHub Pages does not apply `_headers`**.

To satisfy scanners that require response `Link` headers on `/`:

1. **Rules → Transform Rules → Modify Response Header**
2. For URI Path equals `/` (and optionally `/index.html`), set header:

   `Link: </.well-known/api-catalog>; rel="api-catalog", </.well-known/agent-skills/index.json>; rel="agent-skills", </.well-known/mcp/server-card.json>; rel="mcp-server-card", </auth.md>; rel="help", </llms.txt>; rel="service-doc"`

3. Verify: `curl.exe -sI https://trippovention.com/` includes a `Link:` line.

## Markdown for Agents (optional)

Cloudflare **Markdown for Agents** can return `text/markdown` when `Accept: text/markdown`. Enable in the Cloudflare dashboard for `trippovention.com` if you want that audit check; not required for llms.txt-based discovery.

## DNS-AID (optional)

See [DNS-AID-SETUP.md](./DNS-AID-SETUP.md) for SVCB/HTTPS/TXT records at Cloudflare DNS.
