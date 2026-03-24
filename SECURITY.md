# Security Policy

## Reporting a vulnerability

If you find a security issue — especially one involving API key exposure, SSRF via the web fetcher, or prompt injection — please **do not open a public issue**.

Email: security@your-domain.com (replace with your contact)

Include:
- Description of the issue
- Steps to reproduce
- Potential impact

You'll receive a response within 72 hours.

## Known considerations

**Web fetcher (SSRF)**
The pipeline fetches arbitrary user-supplied URLs. In production you should add an allowlist or blocklist for internal IP ranges (localhost, 169.254.x.x, 10.x.x.x, etc.) to prevent SSRF.

**Prompt injection**
User-supplied content (website text) is passed to the LLM. Malicious projects could embed instructions in their website. The system prompt enforces output structure via Zod validation — any response that doesn't match the schema is rejected.

**API key exposure**
`LITELLM_API_KEY` and `DATABASE_URL` must never be committed. Both are in `.gitignore`. Always use `.env.local` locally and environment variable settings on your hosting platform.

**Rate limiting**
The MVP has no rate limiting on `/api/analyze`. Add IP-based limiting (e.g. via Vercel middleware or Upstash) before any public deployment.
