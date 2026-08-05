# Trippovention AI Agent Authentication & Registration Policy

Welcome to **Trippovention** AI Agent Integration portal. This document specifies authentication mechanisms, registration protocols, rate limits, and supported interaction interfaces for autonomous AI agents and language models.

---

## 1. Overview & Capability Model

Trippovention offers public read-access and interactive browser APIs (WebMCP) for travel itinerary exploration, destination package search, visa requirement lookup, and custom holiday inquiry submission.

### Supported Operations
- **Public Read Access**: All travel package listings, itineraries, destination summaries, and visa application specifications are freely queryable without authentication.
- **WebMCP Browser Execution**: AI agents operating in browser environments can use `window.webMCP` / `navigator.modelContext` tools registered on-page.
- **Inquiry & Quote Submission**: AI agents may submit callback requests and customized holiday requirements on behalf of human users.

---

## 2. Authentication & Authorization Discovery

Trippovention implements standard RFC discovery metadata endpoints:

- **OAuth 2.0 Authorization Server**: [/.well-known/oauth-authorization-server](https://trippovention.com/.well-known/oauth-authorization-server)
- **OpenID Connect Discovery**: [/.well-known/openid-configuration](https://trippovention.com/.well-known/openid-configuration)
- **OAuth Protected Resource Metadata**: [/.well-known/oauth-protected-resource](https://trippovention.com/.well-known/oauth-protected-resource)
- **API Catalog (RFC 9727)**: [/.well-known/api-catalog](https://trippovention.com/.well-known/api-catalog)
- **MCP Server Card (SEP-1649)**: [/.well-known/mcp/server-card.json](https://trippovention.com/.well-known/mcp/server-card.json)
- **Agent Skills Discovery Index**: [/.well-known/agent-skills/index.json](https://trippovention.com/.well-known/agent-skills/index.json)

---

## 3. Agent Identity & User-Agent Guidelines

Autonomous agents accessing Trippovention endpoints are expected to:
1. Identify themselves via descriptive `User-Agent` headers (e.g., `User-Agent: MyAgentName/1.0 (+https://example.com/bot)`).
2. Respect `robots.txt` directives and Content Signals (`Content-Signal: ai-train=no, search=yes, ai-input=yes`).
3. Limit request frequency to a reasonable rate (< 60 requests per minute per IP).

---

## 4. Agent Registration & API Token Issuance

For high-volume agents or integration partners requiring dedicated API rate limits or direct Webhook/CRM integration:
- Submit registration inquiries to: `query@trippovention.com`
- Include: Agent Name, Developer/Organization Name, Intended Scope, and Endpoint URLs.

---

## 5. Contact & Support

- **Email**: `query@trippovention.com`
- **Phone**: `+91-87508-88875`
- **Address**: 337 A, 3rd Floor, Spaze IT Park, Tower A, Sector 49, Gurgaon, Haryana 122018, India
