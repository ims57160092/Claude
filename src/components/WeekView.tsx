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
import { sortTasks } from '../lib/tasks'
import { MiniInk } from './MiniInk'
import { Page } from './Page'
import { CHECKBOX, LABEL_WORD } from './styles'

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

  const allTasks = [...entries.values()].flatMap((e) => e.tasks)
  const done = allTasks.filter((t) => t.done).length

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
                className={`focus-visible:outline-coral-500 flex items-baseline justify-between gap-2 rounded-t-sm px-3 py-1.5 text-left transition focus-visible:outline-2 ${
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
                            <span className="text-coral-700 mr-1 font-medium tabular-nums">
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
                    className="hover:border-coral-300 hover:text-coral-700 mt-auto rounded-sm border border-dashed border-stone-300 py-2 text-sm text-stone-400 transition"
                  >
                    + เพิ่มงานหรือโน้ต
                  </button>
                )}
              </div>
            </article>
          )
        })}
        <aside aria-label="สรุปสัปดาห์" className="flex min-w-0 flex-col">
          <div className="bg-coral-100 text-coral-800 rounded-t-sm px-3 py-1.5">
            <span className={LABEL_WORD}>This week</span>
          </div>
          <div className="bg-coral-50 flex min-h-44 flex-1 flex-col justify-center gap-3 rounded-b-sm p-4">
            {allTasks.length ? (
              <>
                <p className="text-stone-700">
                  <span className="font-script text-coral-600 text-4xl">
                    {done}
                  </span>
                  <span className="text-stone-500">
                    {' '}
                    / {allTasks.length} งานเสร็จแล้ว
                  </span>
                </p>
                <div
                  role="progressbar"
                  aria-label="งานที่เสร็จในสัปดาห์นี้"
                  aria-valuemin={0}
                  aria-valuemax={allTasks.length}
                  aria-valuenow={done}
                  className="h-2 overflow-hidden rounded-full bg-white"
                >
                  <div
                    className="bg-coral-400 h-full rounded-full"
                    style={{ width: `${(done / allTasks.length) * 100}%` }}
                  />
                </div>
              </>
            ) : (
              <p className="text-sm text-stone-500">
                ยังไม่มีงานในสัปดาห์นี้ แตะชื่อวันเพื่อเพิ่มงาน
              </p>
            )}
          </div>
        </aside>
      </div>
    </Page>
  )
}
