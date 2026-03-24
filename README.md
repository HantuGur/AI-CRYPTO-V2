# DD Copilot — Crypto Due Diligence Assistant

> A first-pass due diligence assistant for crypto projects. Not financial advice.

![Status](https://img.shields.io/badge/status-MVP%20in%20progress-blue)
![Stack](https://img.shields.io/badge/stack-Next.js%2014%20%2B%20TypeScript%20%2B%20Prisma-black)
![License](https://img.shields.io/badge/license-MIT-green)

---

## What is this?

DD Copilot helps you evaluate a crypto project in **5–10 minutes** instead of 1–2 hours.

You paste a project URL, token symbol, or contract address. The app fetches public content, runs it through a structured AI analysis, and produces a report that tells you:

- What the project claims to do
- Risk indicators across 6 categories
- What is **Verified**, **Inferred**, or **Unknown**
- Exactly what still needs manual verification

**What it is NOT:** an investment advisor, trading signal bot, or price prediction engine. Nothing in this app is financial advice.

---

## Screenshots

> UI in progress — see the [interactive demo](./public/demo.html) for the full report design.

---

## Tech Stack

| Layer | Choice |
|---|---|
| Framework | Next.js 14 (App Router) |
| Language | TypeScript |
| Styling | Tailwind CSS |
| Database | PostgreSQL via Supabase |
| ORM | Prisma |
| AI | LiteLLM (OpenAI-compatible endpoint) |
| Validation | Zod |
| Deploy | Vercel |

---

## Project Structure

```
dd-copilot/
├── app/
│   ├── api/
│   │   ├── analyze/route.ts          # POST — start an analysis
│   │   ├── analysis/[id]/route.ts    # GET  — poll analysis status
│   │   └── report/[id]/route.ts      # GET  — fetch completed report
│   ├── analyze/page.tsx              # Input form page
│   ├── report/[id]/page.tsx          # Report display page
│   ├── layout.tsx
│   └── globals.css
├── components/
│   ├── ui/                           # RiskBadge, VerificationLabel, etc.
│   └── report/                       # Report section components
├── lib/
│   ├── llm/client.ts                 # LiteLLM fetch wrapper
│   ├── pipeline/
│   │   ├── index.ts                  # Orchestrator
│   │   └── webFetcher.ts             # URL → plain text
│   ├── prompts/index.ts              # All LLM prompts
│   ├── db/
│   │   ├── client.ts                 # Prisma singleton
│   │   └── mockData.ts               # Dev fixture data
│   ├── validators/reportSchema.ts    # Zod schemas
│   └── utils/
│       ├── hash.ts                   # Input dedup key
│       └── truncate.ts               # Context window limiter
├── types/index.ts                    # All shared TypeScript types
└── prisma/schema.prisma              # DB schema
```

---

## Analysis Pipeline

```
User Input (URL / Symbol / Contract)
        │
        ▼
POST /api/analyze
  → validate input (Zod)
  → check dedup cache (24h)
  → create Analysis record (status: pending)
  → fire pipeline async
  → return { analysisId }
        │
        ▼
runPipeline()
  → fetch website content
  → LLM call 1: project summary + claims
  → LLM call 2: risk sections + outcome + manual checks
  → Zod validate merged output
  → write Report to DB (transaction)
  → mark Analysis: complete
        │
        ▼
Client polls GET /api/analysis/[id]
  → status: pending | processing | complete | failed
        │
        ▼ (complete)
GET /api/report/[id]
  → full Report with all sections
```

---

## Risk Framework

Each report evaluates 6 categories:

| Category | What's assessed |
|---|---|
| **Project Clarity** | Whitepaper quality, technical specificity, roadmap |
| **Team & Credibility** | Identity verifiability, track record, advisors |
| **Tokenomics Health** | Distribution, vesting schedules, emission model |
| **Contract & Onchain Risk** | Audit status, contract verification, proxy patterns |
| **Market / Behavior** | Liquidity, holder concentration, volume patterns |
| **Social / Docs Consistency** | Community activity, messaging consistency |

Every finding is labeled:
- `Verified` — confirmed from a direct, checkable source
- `Inferred` — reasoned from available evidence
- `Unknown` — insufficient data (treated as a risk, not as safe)

---

## Getting Started

### Prerequisites

- Node.js 18+
- A PostgreSQL database (free tier on [Supabase](https://supabase.com) works)
- A LiteLLM-compatible endpoint (or any OpenAI-compatible API)

### 1. Clone

```bash
git clone https://github.com/your-username/dd-copilot.git
cd dd-copilot
npm install
```

### 2. Configure environment

```bash
cp .env.example .env.local
```

Edit `.env.local`:

```env
LITELLM_BASE_URL=https://your-litellm-endpoint/v1
LITELLM_API_KEY=your-key-here
LITELLM_MODEL=claude-sonnet-4-6

DATABASE_URL=postgresql://user:password@host:5432/dbname

# Set to "true" to skip real AI calls and use mock data
USE_MOCK_PIPELINE=true
```

### 3. Set up the database

```bash
npx prisma db push
```

### 4. Run locally

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

---

## Environment Variables

| Variable | Required | Description |
|---|---|---|
| `LITELLM_BASE_URL` | Yes (real mode) | Your LiteLLM base URL, e.g. `https://litellm.example.com/v1` |
| `LITELLM_API_KEY` | Yes (real mode) | API key for your LiteLLM deployment |
| `LITELLM_MODEL` | No | Model name (default: `claude-sonnet-4-6`) |
| `DATABASE_URL` | Yes | PostgreSQL connection string |
| `USE_MOCK_PIPELINE` | No | Set `true` to use mock data without calling LLM |

---

## Deploy to Vercel

```bash
npm i -g vercel
vercel
```

Set the environment variables in the Vercel dashboard under **Settings → Environment Variables**.

> **Important:** Do not commit `.env.local`. It is already in `.gitignore`.

---

## Database Schema (summary)

```
Analysis          — top-level record, tracks status
  └── Report      — created on completion
        ├── RiskSection[]   — 6 per report, one per category
        │     └── Finding[] — 3–6 per section
        ├── Claim[]         — key project claims + evidence
        ├── Source[]        — all sources used
        └── ManualCheck[]   — actions the user must do themselves
```

Full schema: [`prisma/schema.prisma`](./prisma/schema.prisma)

---

## Development Notes

### Mock mode

Set `USE_MOCK_PIPELINE=true` in `.env.local`. The pipeline will skip LLM calls and return the `MOCK_REPORT` fixture from `lib/db/mockData.ts`. The full DB read/write path is still exercised so the UI works identically.

### Adding real onchain data

`lib/pipeline/index.ts` has a placeholder for an Etherscan integration. When ready, add `ETHERSCAN_API_KEY` to env and implement `lib/pipeline/onchainFetcher.ts`. The pipeline will pick it up without changing the report schema.

### Prompt tuning

All prompts live in `lib/prompts/index.ts`. The system prompt, summarizer prompt, and risk engine prompt are kept separate from pipeline logic so they can be edited and tested independently.

---

## Limitations

This is an MVP. Be aware:

- AI can hallucinate — every finding should be treated as a starting point, not a conclusion
- Websites can be misleading — content is fetched as-is
- JS-rendered sites may not extract correctly
- Full smart contract auditing is far deeper than what this tool does
- Some scams cannot be detected automatically
- Missing data is labeled Unknown, not safe

---

## Roadmap

- [x] Core types and DB schema
- [x] Analysis pipeline (mock + real)
- [x] LiteLLM integration
- [x] Web content fetcher
- [ ] Landing page
- [ ] Analyze input page
- [ ] Report page + all UI components
- [ ] PDF export
- [ ] Shareable report links
- [ ] Etherscan onchain integration
- [ ] Rate limiting
- [ ] Saved analysis history

---

## License

MIT — see [LICENSE](./LICENSE)

---

## Disclaimer

Nothing produced by this application constitutes financial advice. This tool is for research assistance only. Always conduct your own independent research before making any financial decision.
