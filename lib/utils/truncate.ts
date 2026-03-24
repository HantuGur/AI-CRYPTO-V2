/**
 * Truncates a string to approximately maxChars characters,
 * breaking at a word boundary and appending a note.
 *
 * Used before sending extracted web content to Claude to stay
 * within a safe context window budget (~8k tokens ≈ ~32k chars).
 */
export function truncateToLimit(text: string, maxChars = 32_000): string {
  if (text.length <= maxChars) return text

  const cut = text.lastIndexOf(' ', maxChars)
  const boundary = cut > 0 ? cut : maxChars
  return text.slice(0, boundary) + '\n\n[Content truncated to fit analysis limit]'
}
