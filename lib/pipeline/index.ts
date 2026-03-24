import type { AnalysisInput } from '@/types'
import { prisma } from '@/lib/db/client'
import { MOCK_REPORT } from '@/lib/db/mockData'
import { fetchWebContent } from './webFetcher'
import { chatJson } from '@/lib/llm/client'
import { SYSTEM_PROMPT, buildSummarizerPrompt, buildRiskPrompt } from '@/lib/prompts'
import { ReportSchema } from '@/lib/validators/reportSchema'

const USE_MOCK = process.env.USE_MOCK_PIPELINE === 'true'

/**
 * Runs the full analysis pipeline for a given analysisId.
 * Updates the Analysis record in-place as it progresses.
 *
 * Steps:
 *   1. Mark analysis as 'processing'
 *   2. Fetch website content (if URL provided)
 *   3. Call LLM for project summary + claims
 *   4. Call LLM for risk sections + outcome + manual checks
 *   5. Validate combined output with Zod
 *   6. Write Report + all relations to DB
 *   7. Mark analysis as 'complete'
 *
 * On any error: marks analysis as 'failed' with errorMessage.
 */
export async function runPipeline(
  analysisId: string,
  input: AnalysisInput
): Promise<void> {
  try {
    // ── Step 1: Mark as processing ──────────────────────────────────────────
    await prisma.analysis.update({
      where: { id: analysisId },
      data:  { status: 'processing' },
    })

    // ── Step 2: Mock shortcut ────────────────────────────────────────────────
    if (USE_MOCK) {
      await saveMockReport(analysisId)
      return
    }

    // ── Step 3: Fetch website content ────────────────────────────────────────
    const content = input.url
      ? await fetchWebContent(input.url)
      : { url: '', title: '', text: '', ok: false, errorNote: 'No URL provided' }

    // ── Step 4: LLM call 1 — project summary + claims ────────────────────────
    const summaryRaw = await chatJson<{
      projectName:     string
      projectCategory: string
      executiveSummary: string
      projectOverview: object
      claims:          object[]
    }>({
      messages: [
        { role: 'system', content: SYSTEM_PROMPT },
        { role: 'user',   content: buildSummarizerPrompt(input, content) },
      ],
    })

    // ── Step 5: LLM call 2 — risk sections + outcome + manual checks ─────────
    const riskRaw = await chatJson<{
      riskSections:    object[]
      screeningOutcome: string
      outcomeRationale: string
      manualChecks:    object[]
    }>({
      messages: [
        { role: 'system', content: SYSTEM_PROMPT },
        {
          role:    'user',
          content: buildRiskPrompt(input, content, summaryRaw.executiveSummary),
        },
      ],
    })

    // ── Step 6: Merge and validate ────────────────────────────────────────────
    const combined = {
      ...summaryRaw,
      ...riskRaw,
      sources: buildSourceList(input, content),
    }

    const validated = ReportSchema.parse(combined)

    // ── Step 7: Persist to DB ─────────────────────────────────────────────────
    await saveReport(analysisId, validated)

  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err)
    console.error(`[pipeline] failed for ${analysisId}:`, msg)

    await prisma.analysis.update({
      where: { id: analysisId },
      data:  { status: 'failed', errorMessage: msg },
    }).catch(() => {}) // don't throw if this update also fails
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// Helpers
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Saves the mock report to DB — mirrors saveReport() so the
 * full read path is exercised even in mock mode.
 */
async function saveMockReport(analysisId: string): Promise<void> {
  // Small artificial delay so the loading UI steps feel real during dev
  await new Promise((r) => setTimeout(r, 2000))
  await saveReport(analysisId, MOCK_REPORT as any)
}

/**
 * Writes a validated report and all child records to the database,
 * then marks the parent analysis as 'complete'.
 */
async function saveReport(analysisId: string, report: any): Promise<void> {
  await prisma.$transaction(async (tx) => {
    // Create report
    const created = await tx.report.create({
      data: {
        analysisId,
        projectName:      report.projectName,
        projectCategory:  report.projectCategory,
        executiveSummary: report.executiveSummary,
        screeningOutcome: report.screeningOutcome,
        outcomeRationale: report.outcomeRationale,
        projectOverview:  report.projectOverview,
      },
    })

    const reportId = created.id

    // Risk sections + nested findings
    for (const section of report.riskSections) {
      const s = await tx.riskSection.create({
        data: {
          reportId,
          category:           section.category,
          riskLevel:          section.riskLevel,
          reasoning:          section.reasoning,
          verificationStatus: section.verificationStatus,
        },
      })

      if (section.findings?.length) {
        await tx.finding.createMany({
          data: section.findings.map((f: any) => ({
            riskSectionId:     s.id,
            text:              f.text,
            verificationStatus: f.verificationStatus,
            sourceUrl:         f.sourceUrl ?? null,
          })),
        })
      }
    }

    // Claims
    if (report.claims?.length) {
      await tx.claim.createMany({
        data: report.claims.map((c: any) => ({
          reportId,
          claimText:          c.claimText,
          evidence:           c.evidence ?? null,
          verificationStatus: c.verificationStatus,
          sourceUrl:          c.sourceUrl ?? null,
        })),
      })
    }

    // Sources
    if (report.sources?.length) {
      await tx.source.createMany({
        data: report.sources.map((s: any) => ({
          reportId,
          url:        s.url ?? null,
          sourceType: s.sourceType,
          excerpt:    s.excerpt ?? null,
          confidence: s.confidence,
          accessedAt: new Date(s.accessedAt),
        })),
      })
    }

    // Manual checks
    if (report.manualChecks?.length) {
      await tx.manualCheck.createMany({
        data: report.manualChecks.map((m: any) => ({
          reportId,
          action:       m.action,
          rationale:    m.rationale,
          whereToCheck: m.whereToCheck ?? null,
          priority:     m.priority,
        })),
      })
    }

    // Mark analysis complete and link report
    await tx.analysis.update({
      where: { id: analysisId },
      data:  { status: 'complete' },
    })
  })
}

/**
 * Builds the sources array from what we actually fetched.
 * The LLM doesn't generate sources — we build them deterministically
 * so they're always accurate.
 */
function buildSourceList(input: AnalysisInput, content: { url: string; ok: boolean; errorNote?: string; excerpt?: string }) {
  const sources = []

  if (input.url) {
    sources.push({
      url:        input.url,
      sourceType: 'website',
      excerpt:    content.ok ? null : content.errorNote ?? null,
      confidence: content.ok ? 'medium' : 'low',
      accessedAt: new Date().toISOString(),
    })
  }

  if (input.contractAddress) {
    sources.push({
      url:        null,
      sourceType: 'onchain',
      excerpt:    `Contract address: ${input.contractAddress}`,
      confidence: 'medium',
      accessedAt: new Date().toISOString(),
    })
  }

  return sources
}
