# DNS for AI Discovery (DNS-AID) Setup Guide for Trippovention

This document details the configuration required to publish **DNS for AI Discovery (DNS-AID)** records for `trippovention.com` per the draft-mozleywilliams-dnsop-dnsaid specification and RFC 9460 (ServiceMode SVCB/HTTPS records).

---

## 1. Required DNS Records

To enable AI agents to perform DNS-based agent discovery for Trippovention, publish the following DNS records in your domain DNS manager (e.g., Cloudflare DNS, AWS Route 53, or GoDaddy):

### A. SVCB/HTTPS Records for Agent Discovery Entrypoints

```dns
; DNS-AID Well-Known Index Record
_index._agents.trippovention.com. 300 IN HTTPS 0 trippovention.com. alpn="h2,h3" port=443

; DNS-AID Agent-to-Agent (A2A) Discovery Record
_a2a._agents.trippovention.com.   300 IN HTTPS 0 trippovention.com. alpn="h2,h3" port=443
```

### B. TXT Metadata Discovery Records

```dns
; DNS-AID Metadata Directives pointing to RFC endpoints
_agents.trippovention.com. 300 IN TXT "v=dnsaid1; catalog=https://trippovention.com/.well-known/api-catalog; skills=https://trippovention.com/.well-known/agent-skills/index.json; mcp=https://trippovention.com/.well-known/mcp/server-card.json"
```

---

## 2. DNSSEC Signing Requirement

DNS-AID standard requires public discovery zone data to be signed with **DNSSEC** so validating resolvers return authenticated `AD` (Authenticated Data) status.

### Steps to enable DNSSEC:
1. In Cloudflare DNS Dashboard (or your DNS provider), enable **DNSSEC**.
2. Copy the generated `DS` (Delegation Signer) record details (Key Tag, Algorithm, Digest Type, Digest).
3. Paste the `DS` record into your domain registrar settings (where `trippovention.com` is registered).
4. Verify DNSSEC validation status using `dig +dnssec _agents.trippovention.com TXT` or DNSSEC validation tools.

---

## 3. Verification Commands

Run the following commands to verify record resolution:

```bash
# Verify HTTPS / SVCB record lookup
dig _index._agents.trippovention.com TYPE65 +short

# Verify TXT metadata record lookup
dig _agents.trippovention.com TXT +short

# Verify DNSSEC authentication
dig +dnssec _agents.trippovention.com TXT
```
