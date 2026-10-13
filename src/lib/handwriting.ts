import { renderStrokesToPng } from './ink'
import type { Stroke } from './storage'

// The slice of the claude.ai artifact runtime this app uses. It exists only
// when the planner is opened as a claude.ai Artifact; elsewhere (GitHub
// Pages, local dev) `window.claude` is undefined and recognition is hidden.
interface SampleError {
  code: string
  message: string
}
interface Sample {
  (
    input: string,
    options: { images: Blob[]; signal?: AbortSignal },
  ): Promise<{ text: string }>
  limits(): Promise<{ images?: unknown }>
}
interface ClaudeRuntime {
  use(name: 'sample'): Promise<Sample | null>
}

export type Recognize = (
  strokes: Stroke[],
  signal: AbortSignal,
) => Promise<string>

export const EMPTY_MARKER = '<EMPTY>'

const PROMPT = `This image is a handwritten page from a personal planner, written with a stylus. The writing may be Thai, English, or both.

Transcribe the handwriting into plain text exactly as written. Keep the original language and spelling, keep line breaks, and write list items one per line. Skip drawings, arrows and doodles, and do not describe them. Do not translate, summarise, or add anything.

Reply with only the transcribed text. If nothing on the page is readable text, reply with exactly: ${EMPTY_MARKER}`

/** Error codes after which recognition stays hidden for this page load. */
export const PERMANENT_ERRORS = new Set([
  'not_granted',
  'sampling_disabled',
  'not_declared',
  'capability_disabled',
  'capability_removed',
  'images_unavailable',
])

export function isSampleError(e: unknown): e is SampleError {
  return (
    typeof e === 'object' &&
    e !== null &&
    typeof (e as SampleError).code === 'string'
  )
}

/**
 * Resolves a function that reads handwriting with Claude, or null when this
 * page cannot (not a claude.ai Artifact, or images are not allowed there).
 */
export async function loadRecognizer(): Promise<Recognize | null> {
  const runtime = (window as unknown as { claude?: ClaudeRuntime }).claude
  if (!runtime?.use) return null
  const sample = await runtime.use('sample').catch(() => null)
  if (!sample) return null
  const limits = await sample.limits().catch(() => null)
  if (!limits?.images) return null

  return async (strokes, signal) => {
    const png = await renderStrokesToPng(strokes)
    if (!png) return ''
    const { text } = await sample(PROMPT, { images: [png], signal })
    const trimmed = text.trim()
    return trimmed === EMPTY_MARKER ? '' : trimmed
  }
}
