// Saving a generated file. In a claude.ai Artifact the page cannot download
// directly, so it asks the viewer through the `downloads` capability (which
// allows only some file types, e.g. .json but not .ics). Elsewhere a normal
// download link works.

interface Downloads {
  save(request: { filename: string; data: string }): Promise<unknown>
}
interface ClaudeRuntime {
  use(name: 'downloads'): Promise<Downloads | null>
}

const runtime = () => (window as unknown as { claude?: ClaudeRuntime }).claude

/** True when running as a claude.ai Artifact. */
export function inArtifact(): boolean {
  return typeof runtime()?.use === 'function'
}

export class SaveFileError extends Error {
  readonly code: string
  constructor(code: string) {
    super(code)
    this.code = code
  }
}

/** Saves text as a file. Rejects with SaveFileError (code "declined" if the viewer said no). */
export async function saveFile(
  filename: string,
  data: string,
  type: string,
): Promise<void> {
  const claude = runtime()
  if (typeof claude?.use === 'function') {
    const downloads = await claude.use('downloads').catch(() => null)
    if (!downloads) throw new SaveFileError('unavailable')
    try {
      await downloads.save({ filename, data })
    } catch (e) {
      const code =
        typeof e === 'object' && e && 'code' in e
          ? String((e as { code: unknown }).code)
          : 'unavailable'
      throw new SaveFileError(code)
    }
    return
  }
  const url = URL.createObjectURL(new Blob([data], { type }))
  const a = document.createElement('a')
  a.href = url
  a.download = filename
  a.click()
  setTimeout(() => URL.revokeObjectURL(url), 1000)
}
