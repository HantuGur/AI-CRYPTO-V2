import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db/client'
import type { Report } from '@/types'

export async function GET(
  _req: NextRequest,
  { params }: { params: { id: string } }
) {
  const report = await prisma.report.findUnique({
    where: { id: params.id },
    include: {
      riskSections: { include: { findings: true } },
      claims:       true,
      sources:      true,
      manualChecks: true,
    },
  })

  if (!report) {
    return NextResponse.json({ error: 'Report not found' }, { status: 404 })
  }

  // Shape the Prisma result into our Report type.
  // projectOverview is stored as Json in Prisma, cast it here.
  const shaped: Report = {
    id:               report.id,
    analysisId:       report.analysisId,
    projectName:      report.projectName,
    projectCategory:  report.projectCategory,
    executiveSummary: report.executiveSummary,
    screeningOutcome: report.screeningOutcome as Report['screeningOutcome'],
    outcomeRationale: report.outcomeRationale,
    projectOverview:  report.projectOverview as Report['projectOverview'],
    createdAt:        report.createdAt.toISOString(),

    riskSections: report.riskSections.map((s) => ({
      category:           s.category           as any,
      riskLevel:          s.riskLevel          as any,
      reasoning:          s.reasoning,
      verificationStatus: s.verificationStatus as any,
      findings: s.findings.map((f) => ({
        text:               f.text,
        verificationStatus: f.verificationStatus as any,
        sourceUrl:          f.sourceUrl,
      })),
    })),

    claims: report.claims.map((c) => ({
      claimText:          c.claimText,
      evidence:           c.evidence,
      verificationStatus: c.verificationStatus as any,
      sourceUrl:          c.sourceUrl,
    })),

    sources: report.sources.map((s) => ({
      url:        s.url,
      sourceType: s.sourceType as any,
      excerpt:    s.excerpt,
      confidence: s.confidence as any,
      accessedAt: s.accessedAt.toISOString(),
    })),

    manualChecks: report.manualChecks.map((m) => ({
      action:       m.action,
      rationale:    m.rationale,
      whereToCheck: m.whereToCheck,
      priority:     m.priority as any,
    })),
  }

  return NextResponse.json(shaped)
}
