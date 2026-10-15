import { addDays, fromKey, toKey, type DateKey } from './date'

export type LeaveType = 'vacation' | 'sick' | 'personal' | 'other'

export interface Leave {
  date: DateKey
  type: LeaveType
  note?: string
}

export const LEAVE_TYPES: readonly { type: LeaveType; label: string }[] = [
  { type: 'vacation', label: 'ลาพักร้อน' },
  { type: 'sick', label: 'ลาป่วย' },
  { type: 'personal', label: 'ลากิจ' },
  { type: 'other', label: 'ลาอื่น ๆ' },
]

export function leaveLabel(type: LeaveType): string {
  return LEAVE_TYPES.find((t) => t.type === type)?.label ?? 'ลา'
}

/**
 * Working days from `from` to `to` (inclusive, either order): Monday to
 * Friday, skipping the given holidays. These are the days a leave uses.
 */
export function workingDays(
  from: DateKey,
  to: DateKey,
  holidays: ReadonlySet<DateKey>,
): DateKey[] {
  let start = fromKey(from)
  let end = fromKey(to)
  if (start > end) [start, end] = [end, start]
  const days: DateKey[] = []
  for (let d = start; d <= end; d = addDays(d, 1)) {
    const key = toKey(d)
    const weekday = d.getDay()
    if (weekday !== 0 && weekday !== 6 && !holidays.has(key)) days.push(key)
  }
  return days
}

/** Leave days per type in a year. */
export function countLeave(
  leaves: Iterable<Leave>,
  year: number,
): Record<LeaveType, number> {
  const counts: Record<LeaveType, number> = {
    vacation: 0,
    sick: 0,
    personal: 0,
    other: 0,
  }
  for (const l of leaves) {
    if (l.date.startsWith(`${year}-`)) counts[l.type]++
  }
  return counts
}

export function parseLeave(x: unknown): Leave | null {
  if (typeof x !== 'object' || x === null) return null
  const l = x as Record<string, unknown>
  if (typeof l.date !== 'string' || !/^\d{4}-\d{2}-\d{2}$/.test(l.date))
    return null
  const type = LEAVE_TYPES.some((t) => t.type === l.type)
    ? (l.type as LeaveType)
    : 'other'
  return {
    date: l.date,
    type,
    ...(typeof l.note === 'string' && l.note.trim()
      ? { note: l.note.trim() }
      : {}),
  }
}
