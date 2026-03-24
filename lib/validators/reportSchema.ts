import { z } from 'zod'

// ─────────────────────────────────────────────────────────────────────────────
// Primitives
// ─────────────────────────────────────────────────────────────────────────────

const verificationStatus = z.enum(['verified', 'inferred', 'unknown'])
const riskLevel = z.enum(['low', 'medium', 'high', 'unknown'])
const screeningOutcome = z.enum(['skip', 'watch', 'verify', 'caution'])
const sourceType = z.enum(['website', 'whitepaper', 'onchain', 'social', 'inferred'])
const confidenceLevel = z.enum(['high', 'medium', 'low'])
const riskCategory = z.enum(['clarity', 'team', 'tokenomics', 'contract', 'market', 'social'])
const priority = z.enum(['high', 'medium', 'low'])

// ─────────────────────────────────────────────────────────────────────────────
// Sub-entities
// ─────────────────────────────────────────────────────────────────────────────

export const FindingSchema = z.object({
  text: z.string().min(1),
  verificationStatus,
  sourceUrl: z.string().url().nullable().optional(),
})

export const RiskSectionSchema = z.object({
  category: riskCategory,
  riskLevel,
  reasoning: z.string().min(1),
  verificationStatus,
  findings: z.array(FindingSchema).min(1).max(8),
})

export const ClaimSchema = z.object({
  claimText: z.string().min(1),
  evidence: z.string().nullable(),
  verificationStatus,
  sourceUrl: z.string().url().nullable().optional(),
})

export const SourceSchema = z.object({
  url: z.string().nullable(),
  sourceType,
  excerpt: z.string().nullable(),
  confidence: confidenceLevel,
  accessedAt: z.string().datetime(),
})

export const ManualCheckSchema = z.object({
  action: z.string().min(1),
  rationale: z.string().min(1),
  whereToCheck: z.string().nullable(),
  priority,
})

export const ProjectOverviewSchema = z.object({
  whatItDoes: z.string().min(1),
  whoItsFor: z.string().min(1),
  tokenUtility: z.string().min(1),
  differentiators: z.string().min(1),
  unansweredQuestions: z.array(z.string()).min(1).max(10),
})

// ─────────────────────────────────────────────────────────────────────────────
// Full Report — used to validate LLM output before writing to DB
// ─────────────────────────────────────────────────────────────────────────────

export const ReportSchema = z.object({
  projectName: z.string().min(1),
  projectCategory: z.string().min(1),
  executiveSummary: z.string().min(1),
  screeningOutcome,
  outcomeRationale: z.string().min(1),
  projectOverview: ProjectOverviewSchema,
  riskSections: z.array(RiskSectionSchema).length(6), // always all 6 categories
  claims: z.array(ClaimSchema).min(1).max(12),
  sources: z.array(SourceSchema).min(1),
  manualChecks: z.array(ManualCheckSchema).min(1).max(10),
})

// Infer the validated type (useful when building the pipeline)
export type ValidatedReport = z.infer<typeof ReportSchema>

// ─────────────────────────────────────────────────────────────────────────────
// AnalysisInput — validates the incoming POST /api/analyze body
// ─────────────────────────────────────────────────────────────────────────────

export const AnalysisInputSchema = z.object({
  url: z.string().url('Must be a valid URL').optional(),
  symbol: z.string().min(1).max(20).optional(),
  contractAddress: z
    .string()
    .regex(/^0x[a-fA-F0-9]{40}$/, 'Must be a valid EVM address')
    .optional(),
}).refine(
  (d) => d.url || d.symbol || d.contractAddress,
  { message: 'At least one of url, symbol, or contractAddress is required' }
)
