import type { AnalysisInput } from '@/types'
import type { FetchedContent } from '@/lib/pipeline/webFetcher'

// ─────────────────────────────────────────────────────────────────────────────
// SYSTEM PROMPT
// Shared across all calls. Sets the persona and hard rules.
// ─────────────────────────────────────────────────────────────────────────────

export const SYSTEM_PROMPT = `You are a structured due diligence assistant for crypto projects.

Your job is to help users understand what a project claims, identify risk indicators, and determine what requires manual verification.

Hard rules:
- You are NOT a financial advisor. Never say "buy", "sell", "safe investment", "bullish", or make price predictions.
- Always distinguish between what is Verified (direct source), Inferred (reasoned from evidence), or Unknown (insufficient data).
- Missing data is NOT safe. Label it Unknown, do not assume it is acceptable.
- Never invent sources, URLs, or data. If you don't know, say Unknown.
- Keep reasoning grounded in the content provided. Do not hallucinate project details.
- Return only valid JSON. No markdown, no preamble, no explanation outside the JSON.`

// ─────────────────────────────────────────────────────────────────────────────
// SUMMARIZER PROMPT
// Extracts project overview and key claims from raw content.
// ─────────────────────────────────────────────────────────────────────────────

export function buildSummarizerPrompt(
  input: AnalysisInput,
  content: FetchedContent
): string {
  const inputLines = [
    input.url            && `Website URL: ${input.url}`,
    input.symbol         && `Token symbol: ${input.symbol}`,
    input.contractAddress && `Contract address: ${input.contractAddress}`,
  ].filter(Boolean).join('\n')

  const contentBlock = content.ok
    ? `--- WEBSITE CONTENT (${content.url}) ---\nTitle: ${content.title}\n\n${content.text}`
    : `--- WEBSITE FETCH FAILED ---\n${content.errorNote ?? 'Unknown error'}`

  return `Analyze this crypto project and return a JSON object.

INPUT:
${inputLines}

${contentBlock}

Return this exact JSON structure. No extra keys, no markdown.

{
  "projectName": "string — best guess at official project name",
  "projectCategory": "string — e.g. 'Decentralized Exchange · Layer 2'",
  "executiveSummary": "string — 3–4 sentences summarizing what the project claims to do, who it's for, and what stands out",
  "projectOverview": {
    "whatItDoes": "string",
    "whoItsFor": "string",
    "tokenUtility": "string — or 'Not documented' if absent",
    "differentiators": "string — claimed differentiators only, not your assessment",
    "unansweredQuestions": ["string", "..."] // 3–6 specific questions the docs don't answer
  },
  "claims": [
    {
      "claimText": "string — a specific claim the project makes",
      "evidence": "string | null — what was found to support or contradict it",
      "verificationStatus": "verified | inferred | unknown",
      "sourceUrl": "string | null"
    }
  ]
}

Extract 4–8 specific claims. Focus on claims that are checkable, not generic marketing.`
}

// ─────────────────────────────────────────────────────────────────────────────
// RISK ENGINE PROMPT
// Evaluates all 6 risk categories and produces manual checks.
// ─────────────────────────────────────────────────────────────────────────────

export function buildRiskPrompt(
  input: AnalysisInput,
  content: FetchedContent,
  projectSummary: string
): string {
  const inputLines = [
    input.url            && `Website URL: ${input.url}`,
    input.symbol         && `Token symbol: ${input.symbol}`,
    input.contractAddress && `Contract address: ${input.contractAddress}`,
  ].filter(Boolean).join('\n')

  const contentBlock = content.ok
    ? `--- WEBSITE CONTENT ---\n${content.text.slice(0, 12_000)}`
    : `--- WEBSITE FETCH FAILED ---\n${content.errorNote}`

  return `You have already produced this project summary:
${projectSummary}

Now evaluate the following 6 risk categories based on all available content.

INPUT:
${inputLines}

${contentBlock}

Return this exact JSON structure. All 6 categories are required. No markdown.

{
  "riskSections": [
    {
      "category": "clarity | team | tokenomics | contract | market | social",
      "riskLevel": "low | medium | high | unknown",
      "reasoning": "string — 2–4 sentences explaining your assessment. Ground every claim in the content above.",
      "verificationStatus": "verified | inferred | unknown",
      "findings": [
        {
          "text": "string — one specific finding",
          "verificationStatus": "verified | inferred | unknown",
          "sourceUrl": "string | null"
        }
      ]
    }
  ],
  "screeningOutcome": "skip | watch | verify | caution",
  "outcomeRationale": "string — 1–2 sentences explaining the outcome",
  "manualChecks": [
    {
      "action": "string — specific action the user must take",
      "rationale": "string — why this matters",
      "whereToCheck": "string | null — where to look",
      "priority": "high | medium | low"
    }
  ]
}

Risk category definitions:
- clarity: Does the project clearly explain what it does and how? Is technical detail present?
- team: Are founders identifiable and credible? Is there a verifiable track record?
- tokenomics: Is supply distribution documented? Are vesting schedules present? Is allocation reasonable?
- contract: Is the contract verified on-chain? Is there an audit? What permissions does the deployer retain?
- market: Is there liquidity? What is holder concentration? Are volume patterns normal?
- social: Are community channels active and consistent with official docs?

Produce 3–6 findings per category. Produce 4–8 manual checks, prioritised by risk.
If data for a category is unavailable, set riskLevel to "unknown" and explain why.`
}
