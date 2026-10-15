import type { DayEntry } from './storage'

export interface Summary {
  total: number
  done: number
  open: number
  /** Days with a typed note or handwriting. */
  daysWithNotes: number
}

export function summarize(entries: Iterable<DayEntry>): Summary {
  let total = 0
  let done = 0
  let daysWithNotes = 0
  for (const e of entries) {
    total += e.tasks.length
    done += e.tasks.filter((t) => t.done).length
    if (e.text.trim() || e.strokes.length) daysWithNotes++
  }
  return { total, done, open: total - done, daysWithNotes }
}
