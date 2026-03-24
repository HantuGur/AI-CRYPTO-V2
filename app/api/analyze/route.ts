import { NextRequest, NextResponse } from 'next/server'
import { AnalysisInputSchema } from '@/lib/validators/reportSchema'
import { prisma } from '@/lib/db/client'
import { hashInput } from '@/lib/utils/hash'
import { runPipeline } from '@/lib/pipeline'

// How long a completed analysis is considered fresh (24 hours).
// Same input within this window returns the existing analysis.
const CACHE_TTL_MS = 24 * 60 * 60 * 1000

export async function POST(req: NextRequest) {
  // 1. Parse and validate input
  let body: unknown
  try {
    body = await req.json()
  } catch {
    return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 })
  }

  const parsed = AnalysisInputSchema.safeParse(body)
  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.issues[0]?.message ?? 'Invalid input' },
      { status: 422 }
    )
  }

  const input = parsed.data

  // 2. Check for a recent analysis with the same input (dedup)
  const cacheKey = hashInput(input)
  const cutoff = new Date(Date.now() - CACHE_TTL_MS)

  const existing = await prisma.analysis.findFirst({
    where: {
      inputUrl:       input.url            ?? null,
      inputSymbol:    input.symbol         ?? null,
      inputContract:  input.contractAddress ?? null,
      status:         'complete',
      createdAt:      { gte: cutoff },
    },
    orderBy: { createdAt: 'desc' },
  })

  if (existing) {
    return NextResponse.json({ analysisId: existing.id })
  }

  // 3. Create a new analysis record in pending state
  const analysis = await prisma.analysis.create({
    data: {
      status:        'pending',
      inputUrl:       input.url            ?? null,
      inputSymbol:    input.symbol         ?? null,
      inputContract:  input.contractAddress ?? null,
    },
  })

  // 4. Run the pipeline — fire and forget so we can return the ID immediately,
  //    then the client polls /api/analysis/[id] for status.
  //
  //    Note: on Vercel, background work after response must complete within the
  //    function timeout. For longer analyses consider moving this to a route
  //    with `export const maxDuration = 60` or a background job in v2.
  runPipeline(analysis.id, input).catch((err) => {
    console.error(`[pipeline] fatal error for ${analysis.id}:`, err)
  })

  return NextResponse.json({ analysisId: analysis.id }, { status: 202 })
}
