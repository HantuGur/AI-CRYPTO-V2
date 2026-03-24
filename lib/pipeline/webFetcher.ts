import { truncateToLimit } from '@/lib/utils/truncate'

export interface FetchedContent {
  url: string
  title: string
  // Cleaned plain-text body, ready to send to the LLM
  text: string
  // True if we successfully fetched and extracted content
  ok: boolean
  errorNote?: string
}

/**
 * Fetches a URL and extracts readable text from the HTML.
 * No external dependencies — uses the built-in fetch + basic regex stripping.
 *
 * Limitations (acceptable for MVP):
 * - JS-rendered content won't be captured
 * - Some sites block headless fetches (Cloudflare, etc.)
 * - PDFs are not parsed here (whitepaper support is a v2 feature)
 *
 * When a fetch fails, returns ok:false with an errorNote so the
 * pipeline can label affected findings as Unknown rather than crashing.
 */
export async function fetchWebContent(url: string): Promise<FetchedContent> {
  try {
    const res = await fetch(url, {
      headers: {
        // Appear as a regular browser to reduce bot blocks
        'User-Agent':
          'Mozilla/5.0 (compatible; DD-Copilot/1.0; +https://ddcopilot.app)',
        Accept: 'text/html,application/xhtml+xml',
      },
      signal: AbortSignal.timeout(15_000), // 15s hard timeout
    })

    if (!res.ok) {
      return {
        url,
        title: '',
        text: '',
        ok: false,
        errorNote: `HTTP ${res.status} from ${url}`,
      }
    }

    const contentType = res.headers.get('content-type') ?? ''
    if (!contentType.includes('html')) {
      return {
        url,
        title: '',
        text: '',
        ok: false,
        errorNote: `Non-HTML content type: ${contentType}`,
      }
    }

    const html = await res.text()
    const title = extractTitle(html)
    const text  = extractText(html)

    return {
      url,
      title,
      text: truncateToLimit(text),
      ok: true,
    }
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err)
    return {
      url,
      title: '',
      text: '',
      ok: false,
      errorNote: `Fetch failed: ${msg}`,
    }
  }
}

// ─── Helpers ─────────────────────────────────────────────────────────────────

function extractTitle(html: string): string {
  const match = html.match(/<title[^>]*>([^<]+)<\/title>/i)
  return match ? match[1].trim() : ''
}

function extractText(html: string): string {
  return html
    // Remove script and style blocks entirely
    .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, ' ')
    .replace(/<style\b[^<]*(?:(?!<\/style>)<[^<]*)*<\/style>/gi, ' ')
    // Replace block elements with newlines to preserve paragraph breaks
    .replace(/<\/?(p|div|h[1-6]|li|tr|br|section|article|header|footer)[^>]*>/gi, '\n')
    // Strip remaining tags
    .replace(/<[^>]+>/g, ' ')
    // Decode common HTML entities
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&nbsp;/g, ' ')
    // Collapse whitespace
    .replace(/[ \t]+/g, ' ')
    .replace(/\n{3,}/g, '\n\n')
    .trim()
}
