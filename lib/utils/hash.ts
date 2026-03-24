import type { AnalysisInput } from '@/types'

/**
 * Returns a stable string key for a given AnalysisInput.
 * Used for deduplication: if the same input is submitted within
 * the cache window, we return the existing analysis instead of
 * re-running the pipeline.
 */
export function hashInput(input: AnalysisInput): string {
  const parts = [
    input.url?.trim().toLowerCase() ?? '',
    input.symbol?.trim().toLowerCase() ?? '',
    input.contractAddress?.trim().toLowerCase() ?? '',
  ]
  return parts.join('|')
}
