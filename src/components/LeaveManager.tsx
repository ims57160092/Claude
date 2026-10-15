import { useState, type FormEvent } from 'react'
import { formatDayShort, fromKey, todayKey, type DateKey } from '../lib/date'
import { useHolidays, useLeaves } from '../lib/hooks'
import {
  LEAVE_TYPES,
  countLeave,
  leaveLabel,
  workingDays,
  type Leave,
  type LeaveType,
} from '../lib/leave'
import { deleteLeave, saveLeaves } from '../lib/storage'
import { SheetDialog } from './SheetDialog'
import { FIELD, LABEL_WORD, PRIMARY_BUTTON } from './styles'

interface Props {
  /** The year to show first. */
  year: number
  /** Pre-fill the form with this day, e.g. from a daily page. */
  initialDate?: DateKey
  onClose: () => void
}

/** Book leave over a range of working days, see what is used, and delete days. */
export function LeaveManager({
  year: initialYear,
  initialDate,
  onClose,
}: Props) {
  const [year, setYear] = useState(initialYear)
  const leaves = useLeaves()
  const holidays = useHolidays()
  const start =
    initialDate ??
    (fromKey(todayKey()).getFullYear() === initialYear
      ? todayKey()
      : `${initialYear}-01-01`)
  const [type, setType] = useState<LeaveType>('vacation')
  const [from, setFrom] = useState<DateKey>(start)
  const [to, setTo] = useState<DateKey>(start)
  const [note, setNote] = useState('')
  const [deleted, setDeleted] = useState<Leave | null>(null)

  const days = from && to ? workingDays(from, to, new Set(holidays.keys())) : []
  const overlapping = days.filter((d) => leaves.has(d)).length
  const counts = countLeave(leaves.values(), year)
  const list = [...leaves.values()]
    .filter((l) => l.date.startsWith(`${year}-`))
    .sort((a, b) => a.date.localeCompare(b.date))

  const add = async (e: FormEvent) => {
    e.preventDefault()
    if (!days.length) return
    const trimmed = note.trim()
    await saveLeaves(
      days.map((date) => ({
        date,
        type,
        ...(trimmed ? { note: trimmed } : {}),
      })),
    )
    setYear(fromKey(days[0]).getFullYear())
    setNote('')
  }

  const remove = async (l: Leave) => {
    await deleteLeave(l.date)
    setDeleted(l)
  }

  return (
    <SheetDialog
      title="Leave"
      heading="วันลา"
      year={year}
      onYearChange={setYear}
      onClose={onClose}
    >
      <dl className="grid grid-cols-2 gap-2 px-6 pt-4 sm:grid-cols-4">
        {LEAVE_TYPES.map((t) => (
          <div key={t.type} className="rounded-sm bg-emerald-50 px-3 py-2">
            <dt className="text-xs text-emerald-800">{t.label}</dt>
            <dd className="text-xl font-semibold text-emerald-900 tabular-nums">
              {counts[t.type]}{' '}
              <span className="text-xs font-normal text-emerald-700">วัน</span>
            </dd>
          </div>
        ))}
      </dl>

      <form
        onSubmit={(e) => void add(e)}
        className="flex flex-col gap-3 border-b border-coral-100 px-6 py-4"
      >
        <h3 className="flex items-baseline gap-2 text-coral-800">
          <span className={LABEL_WORD}>Book</span>
          <span className="text-sm">ลงวันลา</span>
        </h3>
        <div
          role="group"
          aria-label="ประเภทการลา"
          className="flex flex-wrap gap-1.5"
        >
          {LEAVE_TYPES.map((t) => (
            <button
              key={t.type}
              type="button"
              aria-pressed={type === t.type}
              onClick={() => setType(t.type)}
              className={`rounded-full px-3.5 py-1.5 text-sm font-medium transition focus-visible:outline-2 focus-visible:outline-coral-500 ${
                type === t.type
                  ? 'bg-emerald-600 text-white'
                  : 'bg-stone-100 text-stone-700 hover:bg-emerald-50'
              }`}
            >
              {t.label}
            </button>
          ))}
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <input
            id="leave-from"
            type="date"
            aria-label="ลาตั้งแต่"
            required
            value={from}
            onChange={(e) => {
              setFrom(e.target.value)
              if (!to || e.target.value > to) setTo(e.target.value)
            }}
            className={`${FIELD} px-2`}
          />
          <span className="text-sm text-stone-500">ถึง</span>
          <input
            id="leave-to"
            type="date"
            aria-label="ลาถึง"
            required
            value={to}
            min={from}
            onChange={(e) => setTo(e.target.value)}
            className={`${FIELD} px-2`}
          />
        </div>
        <div className="flex flex-wrap gap-2">
          <input
            id="leave-note"
            type="text"
            aria-label="หมายเหตุ"
            placeholder="หมายเหตุ (ไม่บังคับ)"
            value={note}
            onChange={(e) => setNote(e.target.value)}
            className={`${FIELD} min-w-0 flex-1`}
          />
          <button
            type="submit"
            className={PRIMARY_BUTTON}
            disabled={!days.length}
          >
            ลง {days.length} วัน
          </button>
        </div>
        <p className="text-xs text-stone-500">
          {days.length
            ? `นับ ${days.length} วันทำงาน ไม่รวมเสาร์-อาทิตย์และวันหยุดธนาคาร`
            : 'ช่วงนี้ไม่มีวันทำงาน (เป็นเสาร์-อาทิตย์หรือวันหยุดทั้งหมด)'}
          {overlapping > 0 && ` · ${overlapping} วันลงไว้แล้ว จะถูกแทนที่`}
        </p>
      </form>

      <ul className="px-6">
        {list.map((l) => (
          <li
            key={l.date}
            className="flex min-h-12 items-center gap-3 border-b border-stone-200 py-2"
          >
            <span className="w-24 shrink-0 text-sm font-medium text-emerald-800 tabular-nums">
              {formatDayShort(fromKey(l.date))}
            </span>
            <span className="min-w-0 flex-1">
              <span className="rounded-full bg-emerald-50 px-2.5 py-0.5 text-sm text-emerald-800">
                {leaveLabel(l.type)}
              </span>
              {l.note && (
                <span className="ml-2 text-sm break-words text-stone-600">
                  {l.note}
                </span>
              )}
            </span>
            <button
              type="button"
              aria-label={`ลบ${leaveLabel(l.type)} ${formatDayShort(fromKey(l.date))}`}
              onClick={() => void remove(l)}
              className="shrink-0 rounded-full px-3 py-1 text-sm text-stone-400 transition hover:bg-coral-50 hover:text-coral-700 focus-visible:outline-2 focus-visible:outline-coral-500"
            >
              ลบ
            </button>
          </li>
        ))}
        {list.length === 0 && (
          <li className="py-6 text-sm text-stone-500">ยังไม่มีวันลาในปีนี้</li>
        )}
      </ul>

      {deleted && (
        <p
          role="status"
          className="mx-6 mt-3 flex items-center justify-between gap-3 rounded-sm bg-stone-100 px-3 py-2 text-sm text-stone-700"
        >
          <span>
            ลบ{leaveLabel(deleted.type)} {formatDayShort(fromKey(deleted.date))}{' '}
            แล้ว
          </span>
          <button
            type="button"
            className="font-medium text-coral-700 underline-offset-2 hover:underline focus-visible:outline-2 focus-visible:outline-coral-500"
            onClick={() => {
              void saveLeaves([deleted])
              setDeleted(null)
            }}
          >
            เลิกทำ
          </button>
        </p>
      )}
      <p className="px-6 py-4 text-xs text-stone-500">
        วันลาเก็บในเครื่องนี้ และรวมอยู่ในไฟล์สำรองข้อมูล
      </p>
    </SheetDialog>
  )
}
