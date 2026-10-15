import { useEffect, useRef, useState, type FormEvent } from 'react'
import {
  formatDayShort,
  formatYear,
  fromKey,
  todayKey,
  type DateKey,
} from '../lib/date'
import { useHolidays } from '../lib/hooks'
import { DEFAULT_BANK_HOLIDAYS, type Holiday } from '../lib/holidays'
import {
  deleteHoliday,
  restoreDefaultHolidays,
  saveHoliday,
} from '../lib/storage'
import { useDismiss } from '../lib/useDismiss'
import { FIELD, LABEL_WORD, PRIMARY_BUTTON, QUIET_BUTTON } from './styles'

const ARROW =
  'flex size-9 items-center justify-center rounded-full text-xl text-stone-600 transition hover:bg-coral-50 hover:text-coral-700 focus-visible:outline-2 focus-visible:outline-coral-500'

const DEFAULT_YEARS = new Set(
  DEFAULT_BANK_HOLIDAYS.map((h) => Number(h.date.slice(0, 4))),
)

interface Props {
  /** The year to show first. */
  year: number
  onClose: () => void
}

/** Lists a year's bank holidays and lets the user add, replace and delete them. */
export function HolidayManager({ year: initialYear, onClose }: Props) {
  const [year, setYear] = useState(initialYear)
  const holidays = useHolidays()
  const [date, setDate] = useState<DateKey>(() =>
    fromKey(todayKey()).getFullYear() === initialYear
      ? todayKey()
      : `${initialYear}-01-01`,
  )
  const [name, setName] = useState('')
  const [deleted, setDeleted] = useState<Holiday | null>(null)
  const panel = useDismiss(true, onClose)
  const closeButton = useRef<HTMLButtonElement>(null)

  useEffect(() => closeButton.current?.focus(), [])

  const list = [...holidays.values()]
    .filter((h) => h.date.startsWith(`${year}-`))
    .sort((a, b) => a.date.localeCompare(b.date))
  const replacing = holidays.get(date)
  const yearLabel = formatYear(new Date(year, 0, 1))

  const add = async (e: FormEvent) => {
    e.preventDefault()
    if (!name.trim() || !date) return
    await saveHoliday({ date, name: name.trim() })
    setYear(fromKey(date).getFullYear())
    setName('')
  }

  const remove = async (h: Holiday) => {
    await deleteHoliday(h.date)
    setDeleted(h)
  }

  return (
    <div className="fixed inset-0 z-30 flex items-start justify-center overflow-y-auto bg-stone-900/30 px-4 py-[max(2rem,env(safe-area-inset-top))]">
      <div
        ref={panel}
        role="dialog"
        aria-modal="true"
        aria-labelledby="holiday-title"
        className="w-full max-w-lg rounded-[3px] bg-paper shadow-[0_24px_60px_-20px_rgb(109_51_44/0.5)]"
      >
        <header className="flex items-start justify-between gap-4 px-6 pt-6">
          <div>
            <p
              aria-hidden
              className="font-script text-3xl leading-none text-stone-900"
            >
              Bank holidays
            </p>
            <h2 id="holiday-title" className="mt-1 text-sm text-stone-500">
              วันหยุดธนาคาร {yearLabel}
            </h2>
          </div>
          <button
            ref={closeButton}
            type="button"
            onClick={onClose}
            aria-label="ปิด"
            className="flex size-9 items-center justify-center rounded-full text-xl text-stone-500 transition hover:bg-coral-50 hover:text-coral-700 focus-visible:outline-2 focus-visible:outline-coral-500"
          >
            ×
          </button>
        </header>

        <div className="mt-4 flex items-center justify-between bg-coral-100 px-6 py-1.5 text-coral-800">
          <button
            type="button"
            aria-label="ปีก่อน"
            className={ARROW}
            onClick={() => setYear(year - 1)}
          >
            ‹
          </button>
          <span className="font-semibold">{yearLabel}</span>
          <button
            type="button"
            aria-label="ปีถัดไป"
            className={ARROW}
            onClick={() => setYear(year + 1)}
          >
            ›
          </button>
        </div>

        <form
          onSubmit={(e) => void add(e)}
          className="flex flex-col gap-2 border-b border-coral-100 px-6 py-4"
        >
          <h3 className="flex items-baseline gap-2 text-coral-800">
            <span className={LABEL_WORD}>Add</span>
            <span className="text-sm">เพิ่มวันหยุด</span>
          </h3>
          <div className="flex flex-wrap gap-2">
            <input
              id="holiday-date"
              type="date"
              aria-label="วันที่"
              required
              value={date}
              onChange={(e) => setDate(e.target.value)}
              className={`${FIELD} px-2`}
            />
            <input
              id="holiday-name"
              type="text"
              aria-label="ชื่อวันหยุด"
              placeholder="ชื่อวันหยุด เช่น วันหยุดพิเศษ"
              required
              value={name}
              onChange={(e) => setName(e.target.value)}
              className={`${FIELD} min-w-0 flex-1`}
            />
            <button
              type="submit"
              className={PRIMARY_BUTTON}
              disabled={!name.trim() || !date}
            >
              {replacing ? 'แทนที่' : 'เพิ่ม'}
            </button>
          </div>
          {replacing && (
            <p className="text-xs text-stone-500">
              วันนี้มี "{replacing.name}" อยู่แล้ว จะถูกแทนที่
            </p>
          )}
        </form>
        <ul className="px-6">
          {list.map((h) => (
            <li
              key={h.date}
              className="flex min-h-12 items-center gap-3 border-b border-stone-200 py-2"
            >
              <span className="w-24 shrink-0 text-sm font-medium text-coral-700 tabular-nums">
                {formatDayShort(fromKey(h.date))}
              </span>
              <span className="min-w-0 flex-1">
                <span className="block break-words text-stone-800">
                  {h.name}
                </span>
                {h.note && (
                  <span className="block text-xs text-stone-500">{h.note}</span>
                )}
              </span>
              <button
                type="button"
                aria-label={`ลบ ${h.name} ${formatDayShort(fromKey(h.date))}`}
                onClick={() => void remove(h)}
                className="shrink-0 rounded-full px-3 py-1 text-sm text-stone-400 transition hover:bg-coral-50 hover:text-coral-700 focus-visible:outline-2 focus-visible:outline-coral-500"
              >
                ลบ
              </button>
            </li>
          ))}
          {list.length === 0 && (
            <li className="py-6 text-sm text-stone-500">
              ยังไม่มีวันหยุดธนาคารปี {yearLabel}
              {!DEFAULT_YEARS.has(year) &&
                ' ถ้า ธปท. ประกาศแล้ว เพิ่มเองได้ด้านล่าง หรือรอแอปเวอร์ชันถัดไปที่ใส่ปีนี้ให้'}
            </li>
          )}
        </ul>

        {deleted && (
          <p
            role="status"
            className="mx-6 mt-3 flex items-center justify-between gap-3 rounded-sm bg-stone-100 px-3 py-2 text-sm text-stone-700"
          >
            <span>ลบ {deleted.name} แล้ว</span>
            <button
              type="button"
              className="font-medium text-coral-700 underline-offset-2 hover:underline focus-visible:outline-2 focus-visible:outline-coral-500"
              onClick={() => {
                void saveHoliday(deleted)
                setDeleted(null)
              }}
            >
              เลิกทำ
            </button>
          </p>
        )}

        <footer className="mt-6 flex flex-wrap items-center justify-between gap-2 border-t border-coral-100 bg-coral-50 px-6 py-3">
          <p className="text-xs text-stone-500">
            ตั้งต้นตามประกาศ ธปท. เก็บในเครื่องนี้
          </p>
          {DEFAULT_YEARS.has(year) && (
            <button
              type="button"
              className={`${QUIET_BUTTON} bg-white`}
              onClick={() => {
                void restoreDefaultHolidays()
                setDeleted(null)
              }}
            >
              คืนค่าวันหยุดตามประกาศ
            </button>
          )}
        </footer>
      </div>
    </div>
  )
}
