import {
  fromKey,
  monthGrid,
  toKey,
  todayKey,
  WEEKDAY_SHORT,
  type DateKey,
} from '../lib/date'
import { useEntries } from '../lib/hooks'
import { sortTasks } from '../lib/tasks'

export function MonthView({
  date,
  onOpenDay,
}: {
  date: DateKey
  onOpenDay: (d: DateKey) => void
}) {
  const focus = fromKey(date)
  const days = monthGrid(focus)
  const entries = useEntries(toKey(days[0]), toKey(days[days.length - 1]))
  const today = todayKey()

  return (
    <div className="overflow-hidden rounded-lg border border-slate-200 bg-white dark:border-slate-700 dark:bg-slate-900">
      <div className="grid grid-cols-7 border-b border-slate-200 bg-slate-50 dark:border-slate-700 dark:bg-slate-800">
        {WEEKDAY_SHORT.map((w, i) => (
          <div
            key={w}
            className={`py-2 text-center text-xs font-semibold ${i >= 5 ? 'text-rose-600 dark:text-rose-400' : 'text-slate-500 dark:text-slate-400'}`}
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
              className={`flex min-h-20 min-w-0 flex-col gap-1 border-r border-b border-slate-100 p-1.5 text-left transition hover:bg-indigo-50 focus-visible:outline-2 focus-visible:-outline-offset-2 focus-visible:outline-indigo-500 sm:min-h-28 dark:border-slate-800 dark:hover:bg-slate-800 ${
                inMonth
                  ? ''
                  : 'bg-slate-50/60 text-slate-400 dark:bg-slate-950/40'
              }`}
            >
              <span className="flex items-center gap-1">
                <span
                  className={`flex size-7 items-center justify-center rounded-full text-sm tabular-nums ${
                    key === today
                      ? 'bg-indigo-600 font-semibold text-white'
                      : ''
                  }`}
                >
                  {d.getDate()}
                </span>
                {entry && entry.strokes.length > 0 && (
                  <span
                    className="text-xs text-indigo-500"
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
                    className={`truncate rounded bg-indigo-50 px-1 text-xs dark:bg-indigo-950 ${t.done ? 'text-slate-400 line-through' : 'text-indigo-900 dark:text-indigo-100'}`}
                  >
                    {t.text}
                  </span>
                ))}
                {tasks.length > 3 && (
                  <span className="text-xs text-slate-500">
                    +{tasks.length - 3} รายการ
                  </span>
                )}
              </span>
              {open > 0 && (
                <span className="mt-auto text-xs text-indigo-700 sm:hidden dark:text-indigo-300">
                  {open} งาน
                </span>
              )}
            </button>
          )
        })}
      </div>
    </div>
  )
}
