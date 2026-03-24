import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db/client'

export async function GET(
  _req: NextRequest,
  { params }: { params: { id: string } }
) {
  const analysis = await prisma.analysis.findUnique({
    where: { id: params.id },
    select: {
      id:           true,
      status:       true,
      errorMessage: true,
    },
  })

  if (!analysis) {
    return NextResponse.json({ error: 'Analysis not found' }, { status: 404 })
  }

  return NextResponse.json(analysis)
}
