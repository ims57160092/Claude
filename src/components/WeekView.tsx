import {
  formatShort,
  formatWeek,
  fromKey,
  toKey,
  todayKey,
  weekDays,
  type DateKey,
} from '../lib/date'
import { useEntries } from '../lib/hooks'
import { saveEntry } from '../lib/storage'
import { summarize } from '../lib/summary'
import { sortTasks } from '../lib/tasks'
import { MiniInk } from './MiniInk'
import { Page } from './Page'
import { CHECKBOX, LABEL_WORD } from './styles'
import { SummaryCard } from './SummaryCard'

const DAY_NAMES = [
  'Monday',
  'Tuesday',
  'Wednesday',
  'Thursday',
  'Friday',
  'Saturday',
  'Sunday',
]

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
    <Page title="Weekly plan" heading={formatWeek(fromKey(date))}>
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        {days.map((d, i) => {
          const key = keys[i]
          const entry = entries.get(key)
          const isToday = key === today
          return (
            <article key={key} className="flex min-w-0 flex-col">
              <button
                type="button"
                onClick={() => onOpenDay(key)}
                aria-label={`เปิด ${DAY_NAMES[i]} ${formatShort(d)}`}
                className={`flex items-baseline justify-between gap-2 rounded-t-sm px-3 py-1.5 text-left transition focus-visible:outline-2 focus-visible:outline-coral-500 ${
                  isToday
                    ? 'bg-coral-400 text-white'
                    : 'bg-coral-100 text-coral-800 hover:bg-coral-200'
                }`}
              >
                <span className={LABEL_WORD}>{DAY_NAMES[i]}</span>
                <span className="text-sm font-medium">{formatShort(d)}</span>
              </button>
              <div className="flex min-h-44 flex-1 flex-col gap-2 rounded-b-sm bg-stone-100 p-3">
                <ul className="flex flex-col gap-1.5 text-sm">
                  {entry &&
                    sortTasks(entry.tasks).map((t) => (
                      <li key={t.id} className="flex items-start gap-2">
                        <input
                          id={`week-task-${t.id}`}
                          type="checkbox"
                          className={`${CHECKBOX} mt-px size-4`}
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
                          className={`min-w-0 break-words ${t.done ? 'text-stone-400 line-through' : 'text-stone-800'}`}
                        >
                          {t.time && (
                            <span className="mr-1 font-medium text-coral-700 tabular-nums">
                              {t.time}
                            </span>
                          )}
                          {t.text}
                        </label>
                      </li>
                    ))}
                </ul>
                {entry?.text && (
                  <p className="line-clamp-3 text-sm whitespace-pre-line text-stone-600">
                    {entry.text}
                  </p>
                )}
                {entry && entry.strokes.length > 0 && (
                  <button
                    type="button"
                    onClick={() => onOpenDay(key)}
                    aria-label={`เปิดลายมือของ ${formatShort(d)}`}
                  >
                    <MiniInk strokes={entry.strokes} className="h-24 w-full" />
                  </button>
                )}
                {!entry && (
                  <button
                    type="button"
                    onClick={() => onOpenDay(key)}
                    className="mt-auto rounded-sm border border-dashed border-stone-300 py-2 text-sm text-stone-400 transition hover:border-coral-300 hover:text-coral-700"
                  >
                    + เพิ่มงานหรือโน้ต
                  </button>
                )}
              </div>
            </article>
          )
        })}
        <SummaryCard
          label="This week"
          name="สรุปสัปดาห์"
          summary={summarize(entries.values())}
          empty="ยังไม่มีงานในสัปดาห์นี้ แตะชื่อวันเพื่อเพิ่มงาน"
          className="min-h-44"
        />
      </div>
    </Page>
  )
}
