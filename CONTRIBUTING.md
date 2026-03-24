# Contributing to DD Copilot

Thanks for your interest. This is an early-stage MVP — contributions are welcome but please read this first.

## Before opening a PR

- Check existing issues to avoid duplicates
- For significant changes, open an issue first to discuss the approach
- Keep PRs focused — one concern per PR

## Dev setup

```bash
git clone https://github.com/your-username/dd-copilot.git
cd dd-copilot
npm install
cp .env.example .env.local   # fill in your values
npx prisma db push
npm run dev
```

Set `USE_MOCK_PIPELINE=true` in `.env.local` to develop without a live LLM key.

## Code conventions

- TypeScript strict mode — no `any` unless absolutely necessary and commented
- All new shared types go in `types/index.ts`
- All prompts go in `lib/prompts/index.ts`
- Pipeline logic goes in `lib/pipeline/`
- UI components go in `components/ui/` (primitives) or `components/report/` (report sections)
- Keep components small and focused — one responsibility per file

## Trust and compliance rules

These are non-negotiable:

- No investment advice language (`buy`, `sell`, `safe`, `guaranteed`, `bullish`)
- Every finding must carry a `verificationStatus`: `verified | inferred | unknown`
- Unknown is not safe — never hide or minimise missing data
- The disclaimer must appear on every report page

Any PR that weakens these rules will not be merged.

## Commit style

```
type: short description

Examples:
feat: add etherscan contract verification
fix: handle non-html content type in webFetcher
docs: update env variable list in README
refactor: extract source builder from pipeline
```

## What's in scope for MVP contributions

- UI components (report page sections, loading states, error states)
- Pipeline improvements (better HTML extraction, onchain data)
- Prompt tuning (better structured output, more accurate risk reasoning)
- Bug fixes

## What's out of scope right now

- Auth / user accounts
- Billing
- Price feeds or trading signals
- Mobile app
- Browser extensions
