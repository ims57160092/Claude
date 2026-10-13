import {
  formatShort,
  fromKey,
  toKey,
  todayKey,
  weekDays,
  WEEKDAY_SHORT,
  type DateKey,
} from '../lib/date'
import { useEntries } from '../lib/hooks'
import { saveEntry } from '../lib/storage'
import { MiniInk } from './MiniInk'
import { sortTasks } from '../lib/tasks'

export function WeekView({
  date,
  onOpenDay,
}: {
  date: DateKey
  onOpenDay: (d: DateKey) => void
}) {
  const days = weekDays(fromKey(date))
  const keys = days.map(toKey)
  const entries = useEntries(keys[0], keys[6])
  const today = todayKey()

  return (
    <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-7">
      {days.map((d, i) => {
        const key = keys[i]
        const entry = entries.get(key)
        const isToday = key === today
        return (
          <article
            key={key}
            className={`flex min-w-0 flex-col gap-2 rounded-lg border bg-white p-3 lg:p-2 dark:bg-slate-900 ${
              isToday
                ? 'border-indigo-500 ring-1 ring-indigo-500'
                : 'border-slate-200 dark:border-slate-700'
            }`}
          >
            <button
              type="button"
              onClick={() => onOpenDay(key)}
              className="flex items-baseline gap-2 rounded text-left focus-visible:outline-2 focus-visible:outline-indigo-500"
            >
              <span
                className={`text-sm font-semibold ${i >= 5 ? 'text-rose-600 dark:text-rose-400' : 'text-slate-500 dark:text-slate-400'}`}
              >
                {WEEKDAY_SHORT[i]}
              </span>
              <span className="text-lg font-semibold">{formatShort(d)}</span>
              <span className="ml-auto text-xs text-indigo-600 dark:text-indigo-300">
                เปิด ›
              </span>
            </button>
            <ul className="flex flex-col gap-1 text-sm">
              {entry &&
                sortTasks(entry.tasks).map((t) => (
                  <li key={t.id} className="flex items-start gap-2">
                    <input
                      id={`week-task-${t.id}`}
                      type="checkbox"
                      className="mt-0.5 size-4 shrink-0 accent-indigo-600"
                      checked={t.done}
                      onChange={(e) =>
                        void saveEntry({
                          ...entry,
                          tasks: entry.tasks.map((x) =>
                            x.id === t.id
                              ? { ...x, done: e.target.checked }
                              : x,
                          ),
                        })
                      }
                    />
                    <label
                      htmlFor={`week-task-${t.id}`}
                      className={`min-w-0 break-words ${t.done ? 'text-slate-400 line-through' : ''}`}
                    >
                      {t.time && (
                        <span className="mr-1 font-mono text-indigo-700 tabular-nums dark:text-indigo-300">
                          {t.time}
                        </span>
                      )}
                      {t.text}
                    </label>
                  </li>
                ))}
            </ul>
            {entry?.text && (
              <p className="line-clamp-4 text-sm whitespace-pre-line text-slate-600 dark:text-slate-300">
                {entry.text}
              </p>
            )}
            {entry && entry.strokes.length > 0 && (
              <button
                type="button"
                onClick={() => onOpenDay(key)}
                aria-label={`เปิดลายมือของ ${formatShort(d)}`}
              >
                <MiniInk strokes={entry.strokes} className="h-28 w-full" />
              </button>
            )}
            {!entry && (
              <button
                type="button"
                onClick={() => onOpenDay(key)}
                className="rounded border border-dashed border-slate-300 py-3 text-sm text-slate-400 hover:border-indigo-400 hover:text-indigo-600 dark:border-slate-600"
              >
                + เพิ่มงานหรือโน้ต
              </button>
            )}
          </article>
        )
      })}
    </div>
  )
}
