import { addDays, fromKey, toKey, type DateKey } from './date'
import type { Holiday } from './holidays'
import { leaveLabel, type Leave } from './leave'
import type { DayEntry } from './storage'

export interface IcsOptions {
  entries: readonly DayEntry[]
  leaves: readonly Leave[]
  holidays: readonly Holiday[]
  /** Inclusive date range; omit both for everything. */
  from?: DateKey
  to?: DateKey
  include: { tasks: boolean; leave: boolean; holidays: boolean }
  /** For DTSTAMP; defaults to now. */
  now?: Date
}

/** How long a task with a time lasts in the calendar. */
const TASK_MINUTES = 60

const compact = (date: DateKey) => date.replaceAll('-', '')

function utcStamp(d: Date): string {
  return d
    .toISOString()
    .replace(/[-:]/g, '')
    .replace(/\.\d{3}/, '')
}

/** Escapes TEXT values (RFC 5545 §3.3.11). */
export function escapeText(s: string): string {
  return s
    .replace(/\\/g, '\\\\')
    .replace(/;/g, '\\;')
    .replace(/,/g, '\\,')
    .replace(/\r?\n/g, '\\n')
}

const encoder = new TextEncoder()

/** Folds a content line to at most 75 octets per line (RFC 5545 §3.1). */
export function foldLine(line: string): string {
  if (encoder.encode(line).length <= 75) return line
  const parts: string[] = []
  let current = ''
  let bytes = 0
  for (const ch of line) {
    const size = encoder.encode(ch).length
    // Continuation lines start with a space, which counts toward the 75.
    const limit = parts.length ? 74 : 75
    if (bytes + size > limit) {
      parts.push(current)
      current = ''
      bytes = 0
    }
    current += ch
    bytes += size
  }
  parts.push(current)
  return parts.join('\r\n ')
}

function allDay(
  uid: string,
  date: DateKey,
  summary: string,
  stamp: string,
  description?: string,
) {
  return [
    'BEGIN:VEVENT',
    `UID:${uid}`,
    `DTSTAMP:${stamp}`,
    `DTSTART;VALUE=DATE:${compact(date)}`,
    `DTEND;VALUE=DATE:${compact(toKey(addDays(fromKey(date), 1)))}`,
    `SUMMARY:${escapeText(summary)}`,
    ...(description ? [`DESCRIPTION:${escapeText(description)}`] : []),
    'TRANSP:TRANSPARENT',
    'END:VEVENT',
  ]
}

function timed(
  uid: string,
  date: DateKey,
  time: string,
  summary: string,
  stamp: string,
) {
  const [h, m] = time.split(':').map(Number)
  const start = fromKey(date)
  start.setHours(h, m)
  const end = new Date(start.getTime() + TASK_MINUTES * 60_000)
  // Floating local times: the calendar shows them at the same clock time.
  const local = (d: Date) =>
    `${compact(toKey(d))}T${String(d.getHours()).padStart(2, '0')}${String(d.getMinutes()).padStart(2, '0')}00`
  return [
    'BEGIN:VEVENT',
    `UID:${uid}`,
    `DTSTAMP:${stamp}`,
    `DTSTART:${local(start)}`,
    `DTEND:${local(end)}`,
    `SUMMARY:${escapeText(summary)}`,
    'END:VEVENT',
  ]
}

/**
 * Builds an iCalendar file of tasks (timed or all-day), leave days and bank
 * holidays. UIDs are stable, so importing again can update events instead of
 * duplicating them where the calendar app supports that.
 */
export function buildIcs(o: IcsOptions): { text: string; count: number } {
  const inRange = (d: DateKey) =>
    (!o.from || d >= o.from) && (!o.to || d <= o.to)
  const stamp = utcStamp(o.now ?? new Date())
  const events: string[][] = []

  if (o.include.tasks) {
    for (const e of o.entries) {
      if (!inRange(e.date)) continue
      for (const t of e.tasks) {
        const summary = t.done ? `✓ ${t.text}` : t.text
        const uid = `task-${t.id}@planner`
        events.push(
          t.time
            ? timed(uid, e.date, t.time, summary, stamp)
            : allDay(uid, e.date, summary, stamp),
        )
      }
    }
  }
  if (o.include.leave) {
    for (const l of o.leaves) {
      if (inRange(l.date))
        events.push(
          allDay(
            `leave-${l.date}@planner`,
            l.date,
            leaveLabel(l.type),
            stamp,
            l.note,
          ),
        )
    }
  }
  if (o.include.holidays) {
    for (const h of o.holidays) {
      if (inRange(h.date))
        events.push(
          allDay(
            `holiday-${h.date}@planner`,
            h.date,
            `วันหยุดธนาคาร: ${h.name}`,
            stamp,
            h.note,
          ),
        )
    }
  }

  const lines = [
    'BEGIN:VCALENDAR',
    'VERSION:2.0',
    'PRODID:-//Planner//Planner TH//TH',
    'CALSCALE:GREGORIAN',
    'METHOD:PUBLISH',
    'X-WR-CALNAME:Planner',
    ...events.flat(),
    'END:VCALENDAR',
  ]
  return {
    text: lines.map(foldLine).join('\r\n') + '\r\n',
    count: events.length,
  }
}
