import { renderStrokesToPng } from './ink'
import type { Stroke } from './storage'

// The slice of the claude.ai artifact runtime this app uses. It exists only
// when the planner is opened as a claude.ai Artifact; elsewhere (GitHub
// Pages, local dev) `window.claude` is undefined and recognition is hidden.
interface SampleError {
  code: string
  message: string
}
interface SampleOptions {
  images: Blob[]
  signal?: AbortSignal
}
interface Sample {
  json(input: string, options: SampleOptions): Promise<unknown>
  limits(): Promise<{ images?: unknown }>
}
interface ClaudeRuntime {
  use(name: 'sample'): Promise<Sample | null>
}

export type Recognize = (
  strokes: Stroke[],
  signal: AbortSignal,
) => Promise<string>

const PROMPT = `The image is a handwritten page from a personal planner, written with a stylus. The writing may be Thai, English, or both.

Your job is OCR: copy the handwriting character by character, exactly as written.
- Keep every word, in the order written, in the original language. Do not translate.
- Do not summarise, shorten, reword, merge or reorder anything, and do not add words.
- Keep the writer's spelling, abbreviations, numbers and punctuation, even if they look wrong. Do not correct them.
- Thai: keep every vowel, tone mark and other mark above or below the letters exactly as drawn.
- One entry per handwritten line, top to bottom. Keep bullets, dashes and list numbers that are written.
- If a word cannot be read, write [?] in its place rather than guessing.
- Skip drawings, arrows, boxes and doodles, and do not describe them.

Reply with only JSON in this shape: {"lines": ["first handwritten line", "second handwritten line"]}
If there is no readable writing, reply {"lines": []}.`

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
    const reply = await sample.json(PROMPT, { images: [png], signal })
    const lines = (reply as { lines?: unknown } | null)?.lines
    if (!Array.isArray(lines)) return ''
    return lines
      .map((line) => String(line).trimEnd())
      .join('\n')
      .trim()
  }
}
