import {
  formatMonth,
  fromKey,
  monthGrid,
  toKey,
  todayKey,
  type DateKey,
} from '../lib/date'
import { useEntries } from '../lib/hooks'
import { summarize } from '../lib/summary'
import { sortTasks } from '../lib/tasks'
import { Page } from './Page'
import { LABEL_WORD } from './styles'
import { SummaryCard } from './SummaryCard'

const WEEKDAYS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun']

export function MonthView({
  date,
  onOpenDay,
  onPickDate,
}: {
  date: DateKey
  onOpenDay: (d: DateKey) => void
  onPickDate: (d: DateKey) => void
}) {
  const focus = fromKey(date)
  const days = monthGrid(focus)
  const entries = useEntries(toKey(days[0]), toKey(days[days.length - 1]))
  const today = todayKey()
  // Only this month's days count, not the neighbouring days the grid shows.
  const monthPrefix = date.slice(0, 7)
  const summary = summarize(
    [...entries.values()].filter((e) => e.date.startsWith(monthPrefix)),
  )

  return (
    <Page
      title="Monthly plan"
      heading={formatMonth(focus)}
      date={date}
      pickMode="month"
      onPickDate={onPickDate}
    >
      <div className="overflow-hidden rounded-sm border border-stone-200">
        <div className="grid grid-cols-7 bg-coral-100">
          {WEEKDAYS.map((w, i) => (
            <div
              key={w}
              className={`py-1.5 text-center text-coral-800 ${LABEL_WORD} ${i >= 5 ? 'text-coral-600' : ''}`}
            >
              {w}
            </div>
          ))}
        </div>
        <div className="grid grid-cols-7">
          {days.map((d) => {
            const key = toKey(d)
            const entry = entries.get(key)
            const inMonth = d.getMonth() === focus.getMonth()
            const tasks = entry ? sortTasks(entry.tasks) : []
            const open = tasks.filter((t) => !t.done).length
            return (
              <button
                key={key}
                type="button"
                onClick={() => onOpenDay(key)}
                aria-label={`${d.getDate()} ${tasks.length ? `งาน ${tasks.length} รายการ` : ''}`}
                className={`flex min-h-20 min-w-0 flex-col gap-1 border-t border-r border-stone-200 p-1.5 text-left transition hover:bg-coral-50 focus-visible:outline-2 focus-visible:-outline-offset-2 focus-visible:outline-coral-500 sm:min-h-28 [&:nth-child(7n)]:border-r-0 ${
                  inMonth ? 'bg-white' : 'bg-stone-50 text-stone-300'
                }`}
              >
                <span className="flex items-center gap-1">
                  <span
                    className={`flex size-7 items-center justify-center rounded-full text-sm tabular-nums ${
                      key === today
                        ? 'bg-coral-500 font-semibold text-white'
                        : ''
                    }`}
                  >
                    {d.getDate()}
                  </span>
                  {entry && entry.strokes.length > 0 && (
                    <span
                      className="text-xs text-coral-400"
                      title="มีลายมือ"
                      aria-hidden
                    >
                      ✎
                    </span>
                  )}
                </span>
                <span className="hidden flex-col gap-0.5 sm:flex">
                  {tasks.slice(0, 3).map((t) => (
                    <span
                      key={t.id}
                      className={`truncate rounded-sm bg-coral-100 px-1.5 text-xs ${t.done ? 'text-stone-400 line-through' : 'text-coral-900'}`}
                    >
                      {t.text}
                    </span>
                  ))}
                  {tasks.length > 3 && (
                    <span className="text-xs text-stone-500">
                      +{tasks.length - 3} รายการ
                    </span>
                  )}
                </span>
                {open > 0 && (
                  <span className="mt-auto text-xs text-coral-700 sm:hidden">
                    {open} งาน
                  </span>
                )}
              </button>
            )
          })}
        </div>
      </div>
      <SummaryCard
        label="This month"
        name="สรุปเดือนนี้"
        summary={summary}
        empty="ยังไม่มีงานในเดือนนี้ แตะวันที่ในปฏิทินเพื่อเพิ่มงาน"
        className="mt-5"
      />
    </Page>
  )
}
