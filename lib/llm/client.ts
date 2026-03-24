// Thin fetch wrapper around your LiteLLM endpoint.
// All pipeline modules call this instead of using a vendor SDK directly.

const BASE_URL = process.env.LITELLM_BASE_URL ?? 'https://litellm.koboi2026.biz.id/v1'
const API_KEY  = process.env.LITELLM_API_KEY  ?? ''
const MODEL    = process.env.LITELLM_MODEL    ?? 'claude-sonnet-4-6'

export interface ChatMessage {
  role: 'system' | 'user' | 'assistant'
  content: string
}

export interface ChatOptions {
  messages:    ChatMessage[]
  temperature?: number
  max_tokens?:  number
}

export interface ChatResponse {
  content: string
}

/**
 * Calls the LiteLLM /chat/completions endpoint and returns
 * the first choice's message content as a string.
 *
 * Throws on non-2xx responses so callers can catch and handle.
 */
export async function chat(options: ChatOptions): Promise<ChatResponse> {
  const res = await fetch(`${BASE_URL}/chat/completions`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      ...(API_KEY ? { Authorization: `Bearer ${API_KEY}` } : {}),
    },
    body: JSON.stringify({
      model:       MODEL,
      max_tokens:  options.max_tokens  ?? 4096,
      temperature: options.temperature ?? 0.2, // low temp = more consistent structure
      messages:    options.messages,
    }),
  })

  if (!res.ok) {
    const text = await res.text().catch(() => res.statusText)
    throw new Error(`LiteLLM error ${res.status}: ${text}`)
  }

  const data = await res.json()
  const content: string = data.choices?.[0]?.message?.content ?? ''

  if (!content) throw new Error('LiteLLM returned an empty response')

  return { content }
}

/**
 * Calls chat() and attempts to parse the response as JSON.
 * Strips markdown code fences if the model wraps output in them.
 * Throws if parsing fails.
 */
export async function chatJson<T = unknown>(options: ChatOptions): Promise<T> {
  const { content } = await chat(options)

  // Strip ```json ... ``` or ``` ... ``` wrappers
  const cleaned = content
    .trim()
    .replace(/^```(?:json)?\s*/i, '')
    .replace(/\s*```$/, '')
    .trim()

  try {
    return JSON.parse(cleaned) as T
  } catch {
    throw new Error(`LiteLLM response was not valid JSON:\n${cleaned.slice(0, 300)}`)
  }
}
