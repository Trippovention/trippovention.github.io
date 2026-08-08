# auth.md — Trippovention AI agents and crawlers

Trippovention ([trippovention.com](https://trippovention.com)) is a **public static website**. There is **no user login**, **no OAuth**, and **no programmatic API** for packages or bookings.

## How to use this site

1. **[llms.txt](https://trippovention.com/llms.txt)** — curated overview, key URLs, and services (start here).
2. **[llms-full.txt](https://trippovention.com/llms-full.txt)** — expanded site map and package listings.
3. **[sitemap.xml](https://trippovention.com/sitemap.xml)** — all indexable HTML pages.
4. **Individual HTML pages** — full itineraries, visa pages, and contact forms.

## Crawling policy

See [robots.txt](https://trippovention.com/robots.txt) for allow/disallow rules and Content Signals (`ai-train`, `search`, `ai-input`).

Please identify automated clients with a descriptive `User-Agent` and avoid aggressive request rates.

## Agent registration

This site does not issue API tokens or OAuth credentials.

- **register_uri:** mailto:query@trippovention.com (describe your agent name, organization, intended use, and expected crawl rate)
- **Supported access:** public read of HTML, llms.txt, and sitemap; optional WebMCP on the homepage only
- **Not supported:** programmatic booking APIs, OAuth, or machine payments

## WebMCP (optional, homepage only)

When supported by the client browser, the homepage may expose limited [WebMCP](https://webmachinelearning.github.io/webmcp/) tools via `assets/webmcp-agent.js` (package search hints, links to llms.txt). This does **not** replace llms.txt or HTML for full catalog coverage.

## Human contact (quotes and bookings)

- **Email:** query@trippovention.com  
- **Phone (India):** +91-87508-88875  
- **Contact form:** [contact.html](https://trippovention.com/contact.html)

For integration or high-volume automated access, email us with your use case before scaling crawls.

## Discovery metadata

- API catalog (documentation only): [/.well-known/api-catalog.json](https://trippovention.com/.well-known/api-catalog.json)
- Agent skills index: [/.well-known/agent-skills/index.json](https://trippovention.com/.well-known/agent-skills/index.json)
- MCP server card (WebMCP on homepage): [/.well-known/mcp/server-card.json](https://trippovention.com/.well-known/mcp/server-card.json)
