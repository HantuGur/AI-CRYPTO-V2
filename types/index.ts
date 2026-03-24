// ─────────────────────────────────────────────────────────────────────────────
// Primitive enums
// ─────────────────────────────────────────────────────────────────────────────

export type VerificationStatus = 'verified' | 'inferred' | 'unknown'
export type RiskLevel = 'low' | 'medium' | 'high' | 'unknown'
export type ScreeningOutcome = 'skip' | 'watch' | 'verify' | 'caution'
export type SourceType = 'website' | 'whitepaper' | 'onchain' | 'social' | 'inferred'
export type ConfidenceLevel = 'high' | 'medium' | 'low'
export type AnalysisStatus = 'pending' | 'processing' | 'complete' | 'failed'
export type ManualCheckPriority = 'high' | 'medium' | 'low'

export type RiskCategory =
  | 'clarity'
  | 'team'
  | 'tokenomics'
  | 'contract'
  | 'market'
  | 'social'

// Human-readable labels for each category, used in the UI
export const RISK_CATEGORY_LABELS: Record<RiskCategory, string> = {
  clarity: 'Project Clarity',
  team: 'Team & Credibility',
  tokenomics: 'Tokenomics Health',
  contract: 'Contract & Onchain Risk',
  market: 'Market / Behavior Notes',
  social: 'Social / Documentation Consistency',
}

export const SCREENING_OUTCOME_LABELS: Record<ScreeningOutcome, string> = {
  skip: 'Skip',
  watch: 'Watch',
  verify: 'Requires Manual Verification',
  caution: 'Proceed with Caution',
}

// ─────────────────────────────────────────────────────────────────────────────
// Input
// ─────────────────────────────────────────────────────────────────────────────

export interface AnalysisInput {
  url?: string
  symbol?: string
  contractAddress?: string
}

// ─────────────────────────────────────────────────────────────────────────────
// Evidence — attached to any claim or finding that asserts something
// ─────────────────────────────────────────────────────────────────────────────

export interface Evidence {
  sourceUrl: string | null
  sourceType: SourceType
  // The exact text excerpt the finding is based on, or null if derived
  excerpt: string | null
  verificationStatus: VerificationStatus
  confidence: ConfidenceLevel
}

// ─────────────────────────────────────────────────────────────────────────────
// Report sub-entities
// ─────────────────────────────────────────────────────────────────────────────

export interface Finding {
  text: string
  verificationStatus: VerificationStatus
  // Optional: which source supports this specific finding
  sourceUrl?: string | null
}

export interface RiskSection {
  category: RiskCategory
  riskLevel: RiskLevel
  // Written explanation — the primary artifact, not the badge
  reasoning: string
  verificationStatus: VerificationStatus
  findings: Finding[]
}

export interface Claim {
  claimText: string
  // What evidence was found for this claim, or null if none
  evidence: string | null
  verificationStatus: VerificationStatus
  sourceUrl?: string | null
}

export interface Source {
  url: string | null
  sourceType: SourceType
  excerpt: string | null
  confidence: ConfidenceLevel
  // ISO string
  accessedAt: string
}

export interface ManualCheck {
  action: string
  rationale: string
  whereToCheck: string | null
  priority: ManualCheckPriority
}

// ─────────────────────────────────────────────────────────────────────────────
// Full Report — what gets stored and rendered
// ─────────────────────────────────────────────────────────────────────────────

export interface ProjectOverview {
  whatItDoes: string
  whoItsFor: string
  tokenUtility: string
  differentiators: string
  unansweredQuestions: string[]
}

export interface Report {
  id: string
  analysisId: string
  projectName: string
  projectCategory: string
  executiveSummary: string
  screeningOutcome: ScreeningOutcome
  outcomeRationale: string
  projectOverview: ProjectOverview
  riskSections: RiskSection[]
  claims: Claim[]
  sources: Source[]
  manualChecks: ManualCheck[]
  createdAt: string
}

// ─────────────────────────────────────────────────────────────────────────────
// Analysis — the top-level record that wraps a report
// ─────────────────────────────────────────────────────────────────────────────

export interface Analysis {
  id: string
  status: AnalysisStatus
  input: AnalysisInput
  // Only present when status === 'complete'
  report?: Report
  // Only present when status === 'failed'
  errorMessage?: string
  createdAt: string
}

// ─────────────────────────────────────────────────────────────────────────────
// API shapes — what the routes return
// ─────────────────────────────────────────────────────────────────────────────

// POST /api/analyze → { analysisId }
export interface StartAnalysisResponse {
  analysisId: string
}

// GET /api/analysis/[id] → AnalysisStatusResponse
export interface AnalysisStatusResponse {
  id: string
  status: AnalysisStatus
  errorMessage?: string
}

// GET /api/report/[id] → Report (or 404)
