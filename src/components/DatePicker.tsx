import { useState } from 'react'
import {
  formatLong,
  formatMonth,
  formatMonthShort,
  formatYear,
  fromKey,
  monthGrid,
  startOfWeek,
  toKey,
  todayKey,
  type DateKey,
} from '../lib/date'
import { useEntries, useHolidays } from '../lib/hooks'
import { LABEL_WORD } from './styles'

export type PickMode = 'day' | 'week' | 'month'

const WEEKDAYS = ['Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa', 'Su']

const ARROW =
  'flex size-9 items-center justify-center rounded-full text-xl text-stone-600 transition hover:bg-coral-50 hover:text-coral-700 focus-visible:outline-2 focus-visible:outline-coral-500'

interface Props {
  value: DateKey
  /** What a pick selects: a day, the week containing it, or a month. */
  mode: PickMode
  onPick: (date: DateKey) => void
}

/** A small planner-style calendar for jumping to a day, week or month. */
export function DatePicker({ value, mode, onPick }: Props) {
  const selected = fromKey(value)
  const [cursor, setCursor] = useState(
    () => new Date(selected.getFullYear(), selected.getMonth(), 1),
  )
  const [level, setLevel] = useState<'days' | 'months'>(
    mode === 'month' ? 'months' : 'days',
  )
  const today = todayKey()

  return (
    <div className="w-[20rem] max-w-[calc(100vw-2rem)] overflow-hidden rounded-md bg-paper shadow-[0_2px_6px_rgb(109_51_44/0.12),0_24px_48px_-16px_rgb(109_51_44/0.4)] ring-1 ring-coral-100">
      {level === 'days' ? (
        <DaysLevel
          cursor={cursor}
          setCursor={setCursor}
          selected={selected}
          mode={mode}
          today={today}
          onPick={onPick}
          onShowMonths={() => setLevel('months')}
        />
      ) : (
        <MonthsLevel
          cursor={cursor}
          setCursor={setCursor}
          selected={selected}
          onPick={(month) => {
            if (mode === 'month') onPick(toKey(month))
            else {
              setCursor(month)
              setLevel('days')
            }
          }}
        />
      )}
      <div className="flex justify-end border-t border-coral-100 bg-coral-50 px-3 py-2">
        <button
          type="button"
          onClick={() => onPick(today)}
          className="rounded-full bg-white px-4 py-1.5 text-sm font-medium text-coral-700 shadow-sm transition hover:bg-coral-100 focus-visible:outline-2 focus-visible:outline-coral-500"
        >
          วันนี้
        </button>
      </div>
    </div>
  )
}

interface DaysProps {
  cursor: Date
  setCursor: (d: Date) => void
  selected: Date
  mode: PickMode
  today: DateKey
  onPick: (date: DateKey) => void
  onShowMonths: () => void
}

function DaysLevel({
  cursor,
  setCursor,
  selected,
  mode,
  today,
  onPick,
  onShowMonths,
}: DaysProps) {
  const days = monthGrid(cursor)
  const entries = useEntries(toKey(days[0]), toKey(days[days.length - 1]))
  const holidays = useHolidays()
  const selectedKey = toKey(selected)
  const selectedWeek = toKey(startOfWeek(selected))
  const shift = (n: number) =>
    setCursor(new Date(cursor.getFullYear(), cursor.getMonth() + n, 1))

  return (
    <div className="p-3">
      <div className="mb-2 flex items-center justify-between">
        <button
          type="button"
          aria-label="เดือนก่อน"
          className={ARROW}
          onClick={() => shift(-1)}
        >
          ‹
        </button>
        <button
          type="button"
          onClick={onShowMonths}
          aria-label={`${formatMonth(cursor)} เลือกเดือนอื่น`}
          className="rounded-full px-3 py-1 font-semibold text-stone-800 transition hover:bg-coral-50 focus-visible:outline-2 focus-visible:outline-coral-500"
        >
          {formatMonth(cursor)}{' '}
          <span aria-hidden className="text-coral-400">
            ▾
          </span>
        </button>
        <button
          type="button"
          aria-label="เดือนถัดไป"
          className={ARROW}
          onClick={() => shift(1)}
        >
          ›
        </button>
      </div>
      <div className="grid grid-cols-7 rounded-sm bg-coral-100 py-1 text-coral-800">
        {WEEKDAYS.map((w, i) => (
          <span
            key={w}
            className={`text-center ${LABEL_WORD} tracking-[0.12em] ${i >= 5 ? 'text-coral-600' : ''}`}
          >
            {w}
          </span>
        ))}
      </div>
      <div role="grid" className="mt-1 grid grid-cols-7 gap-y-1">
        {days.map((d, i) => {
          const key = toKey(d)
          const inMonth = d.getMonth() === cursor.getMonth()
          const entry = entries.get(key)
          const hasContent = !!entry
          const holiday = holidays.get(key)
          const inSelectedWeek =
            mode === 'week' && toKey(startOfWeek(d)) === selectedWeek
          const isSelected = mode === 'day' && key === selectedKey
          const col = i % 7
          return (
            <div
              key={key}
              className={`flex justify-center ${
                inSelectedWeek
                  ? `bg-coral-100 ${col === 0 ? 'rounded-l-full' : ''} ${col === 6 ? 'rounded-r-full' : ''}`
                  : ''
              }`}
            >
              <button
                type="button"
                onClick={() => onPick(key)}
                aria-label={formatLong(d)}
                title={holiday?.name}
                aria-pressed={isSelected || inSelectedWeek}
                className={`relative flex size-10 flex-col items-center justify-center rounded-full text-sm tabular-nums transition focus-visible:outline-2 focus-visible:outline-coral-500 ${
                  isSelected
                    ? 'bg-coral-500 font-semibold text-white'
                    : key === today
                      ? 'font-semibold text-coral-700 ring-2 ring-coral-300 ring-inset hover:bg-coral-50'
                      : inMonth
                        ? holiday
                          ? 'font-semibold text-coral-600 hover:bg-coral-50'
                          : 'text-stone-800 hover:bg-coral-50'
                        : 'text-stone-300 hover:bg-coral-50'
                }`}
              >
                {d.getDate()}
                {hasContent && (
                  <span
                    aria-hidden
                    className={`absolute bottom-1.5 size-1 rounded-full ${isSelected ? 'bg-white' : 'bg-coral-400'}`}
                  />
                )}
              </button>
            </div>
          )
        })}
      </div>
    </div>
  )
}

interface MonthsProps {
  cursor: Date
  setCursor: (d: Date) => void
  selected: Date
  onPick: (month: Date) => void
}

function MonthsLevel({ cursor, setCursor, selected, onPick }: MonthsProps) {
  const year = cursor.getFullYear()
  const thisMonth = fromKey(todayKey())
  return (
    <div className="p-3">
      <div className="mb-3 flex items-center justify-between">
        <button
          type="button"
          aria-label="ปีก่อน"
          className={ARROW}
          onClick={() => setCursor(new Date(year - 1, cursor.getMonth(), 1))}
        >
          ‹
        </button>
        <span className="font-semibold text-stone-800">
          {formatYear(cursor)}
        </span>
        <button
          type="button"
          aria-label="ปีถัดไป"
          className={ARROW}
          onClick={() => setCursor(new Date(year + 1, cursor.getMonth(), 1))}
        >
          ›
        </button>
      </div>
      <div className="grid grid-cols-3 gap-2">
        {Array.from({ length: 12 }, (_, m) => {
          const month = new Date(year, m, 1)
          const isSelected =
            selected.getFullYear() === year && selected.getMonth() === m
          const isNow =
            thisMonth.getFullYear() === year && thisMonth.getMonth() === m
          return (
            <button
              key={m}
              type="button"
              onClick={() => onPick(month)}
              aria-label={formatMonth(month)}
              aria-pressed={isSelected}
              className={`rounded-full py-2.5 text-sm transition focus-visible:outline-2 focus-visible:outline-coral-500 ${
                isSelected
                  ? 'bg-coral-500 font-semibold text-white'
                  : isNow
                    ? 'font-semibold text-coral-700 ring-2 ring-coral-300 ring-inset hover:bg-coral-50'
                    : 'bg-stone-50 text-stone-700 hover:bg-coral-50'
              }`}
            >
              {formatMonthShort(month)}
            </button>
          )
        })}
      </div>
    </div>
  )
}
