/** A calendar day in local time, formatted as YYYY-MM-DD. */
export type DateKey = string

export function toKey(d: Date): DateKey {
  const m = String(d.getMonth() + 1).padStart(2, '0')
  const day = String(d.getDate()).padStart(2, '0')
  return `${d.getFullYear()}-${m}-${day}`
}

export function fromKey(key: DateKey): Date {
  const [y, m, d] = key.split('-').map(Number)
  return new Date(y, m - 1, d)
}

export function todayKey(): DateKey {
  return toKey(new Date())
}

export function addDays(d: Date, n: number): Date {
  return new Date(d.getFullYear(), d.getMonth(), d.getDate() + n)
}

/** Moves by whole months, clamping the day (Jan 31 + 1 month = Feb 28/29). */
export function addMonths(d: Date, n: number): Date {
  const first = new Date(d.getFullYear(), d.getMonth() + n, 1)
  const lastDay = new Date(
    first.getFullYear(),
    first.getMonth() + 1,
    0,
  ).getDate()
  return new Date(
    first.getFullYear(),
    first.getMonth(),
    Math.min(d.getDate(), lastDay),
  )
}

/** Weeks start on Monday. */
export function startOfWeek(d: Date): Date {
  return addDays(d, -((d.getDay() + 6) % 7))
}

export function weekDays(d: Date): Date[] {
  const start = startOfWeek(d)
  return Array.from({ length: 7 }, (_, i) => addDays(start, i))
}

/** Whole weeks (Monday to Sunday) covering the month that contains `d`. */
export function monthGrid(d: Date): Date[] {
  const first = new Date(d.getFullYear(), d.getMonth(), 1)
  const last = new Date(d.getFullYear(), d.getMonth() + 1, 0)
  const start = startOfWeek(first)
  const days: Date[] = []
  for (
    let day = start;
    days.length % 7 !== 0 || day <= last;
    day = addDays(day, 1)
  ) {
    days.push(day)
  }
  return days
}

export const WEEKDAY_SHORT = ['จ.', 'อ.', 'พ.', 'พฤ.', 'ศ.', 'ส.', 'อา.']

const monthFmt = new Intl.DateTimeFormat('th-TH', {
  month: 'long',
  year: 'numeric',
})
const shortFmt = new Intl.DateTimeFormat('th-TH', {
  day: 'numeric',
  month: 'short',
})
const monthShortFmt = new Intl.DateTimeFormat('th-TH', { month: 'short' })
const yearFmt = new Intl.DateTimeFormat('th-TH', { year: 'numeric' })
const dayShortFmt = new Intl.DateTimeFormat('th-TH', {
  weekday: 'short',
  day: 'numeric',
  month: 'short',
})
const longFmt = new Intl.DateTimeFormat('th-TH', { dateStyle: 'full' })

export const formatMonth = (d: Date) => monthFmt.format(d)
export const formatShort = (d: Date) => shortFmt.format(d)
export const formatLong = (d: Date) => longFmt.format(d)
export const formatMonthShort = (d: Date) => monthShortFmt.format(d)
export const formatYear = (d: Date) => yearFmt.format(d)
export const formatDayShort = (d: Date) => dayShortFmt.format(d)

export function formatWeek(d: Date): string {
  const days = weekDays(d)
  return `${formatShort(days[0])} – ${formatShort(days[6])}`
}
