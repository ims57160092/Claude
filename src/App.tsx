import { useEffect, useState } from 'react'
import { BackupMenu } from './components/BackupMenu'
import { DayView } from './components/DayView'
import { MonthView } from './components/MonthView'
import { WeekView } from './components/WeekView'
import {
  addDays,
  addMonths,
  formatLong,
  formatMonth,
  formatWeek,
  fromKey,
  toKey,
  todayKey,
  type DateKey,
} from './lib/date'

type View = 'month' | 'week' | 'day'

const VIEWS: [View, string][] = [
  ['month', 'เดือน'],
  ['week', 'สัปดาห์'],
  ['day', 'วัน'],
]

function readSavedView(): View {
  try {
    const v = localStorage.getItem('planner:view')
    if (v === 'month' || v === 'week' || v === 'day') return v
  } catch {
    // Storage can be unavailable (private browsing); fall back to the default.
  }
  return 'week'
}

function move(view: View, date: DateKey, step: number): DateKey {
  const d = fromKey(date)
  if (view === 'month') return toKey(addMonths(d, step))
  return toKey(addDays(d, view === 'week' ? step * 7 : step))
}

function App() {
  const [view, setView] = useState<View>(readSavedView)
  const [date, setDate] = useState<DateKey>(todayKey)
  const [message, setMessage] = useState('')

  useEffect(() => {
    try {
      localStorage.setItem('planner:view', view)
    } catch {
      // Not critical; the view just won't be remembered.
    }
  }, [view])

  useEffect(() => {
    // Ask the browser not to evict the notes when space runs low.
    void navigator.storage?.persist?.()
  }, [])

  useEffect(() => {
    if (!message) return
    const t = window.setTimeout(() => setMessage(''), 4000)
    return () => window.clearTimeout(t)
  }, [message])

  const openDay = (d: DateKey) => {
    setDate(d)
    setView('day')
  }

  const d = fromKey(date)
  const title =
    view === 'month'
      ? formatMonth(d)
      : view === 'week'
        ? formatWeek(d)
        : formatLong(d)
  const navBtn =
    'flex size-9 items-center justify-center rounded-md text-lg text-slate-700 hover:bg-slate-200 focus-visible:outline-2 focus-visible:outline-indigo-500 dark:text-slate-200 dark:hover:bg-slate-700'

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 dark:bg-slate-950 dark:text-slate-100">
      <header className="sticky top-[env(safe-area-inset-top,0px)] z-10 border-b border-slate-200 bg-slate-50/90 backdrop-blur dark:border-slate-800 dark:bg-slate-950/90">
        <div className="mx-auto flex max-w-7xl flex-wrap items-center gap-x-4 gap-y-2 px-4 py-3">
          <span className="text-lg font-bold tracking-tight text-indigo-700 dark:text-indigo-300">
            Planner
          </span>
          <div className="flex items-center gap-1">
            <button
              type="button"
              aria-label="ก่อนหน้า"
              className={navBtn}
              onClick={() => setDate(move(view, date, -1))}
            >
              ‹
            </button>
            <button
              type="button"
              className="rounded-md border border-slate-300 px-3 py-1.5 text-sm font-medium hover:bg-slate-200 focus-visible:outline-2 focus-visible:outline-indigo-500 dark:border-slate-600 dark:hover:bg-slate-700"
              onClick={() => setDate(todayKey())}
            >
              วันนี้
            </button>
            <button
              type="button"
              aria-label="ถัดไป"
              className={navBtn}
              onClick={() => setDate(move(view, date, 1))}
            >
              ›
            </button>
          </div>
          <h1 className="min-w-0 text-lg font-semibold text-balance">
            {title}
          </h1>
          <div className="ml-auto flex flex-wrap items-center gap-2">
            <div
              role="group"
              aria-label="มุมมอง"
              className="flex rounded-lg bg-slate-200 p-0.5 dark:bg-slate-800"
            >
              {VIEWS.map(([v, label]) => (
                <button
                  key={v}
                  type="button"
                  aria-pressed={view === v}
                  onClick={() => setView(v)}
                  className={`rounded-md px-3 py-1.5 text-sm font-medium focus-visible:outline-2 focus-visible:outline-indigo-500 ${
                    view === v
                      ? 'bg-white text-indigo-700 shadow-sm dark:bg-slate-600 dark:text-white'
                      : 'text-slate-600 dark:text-slate-300'
                  }`}
                >
                  {label}
                </button>
              ))}
            </div>
            <BackupMenu onMessage={setMessage} />
          </div>
        </div>
      </header>
      <main className="mx-auto max-w-7xl px-4 py-4">
        {view === 'month' && <MonthView date={date} onOpenDay={openDay} />}
        {view === 'week' && <WeekView date={date} onOpenDay={openDay} />}
        {view === 'day' && <DayView key={date} date={date} />}
      </main>
      <div
        role="status"
        aria-live="polite"
        className="pointer-events-none fixed inset-x-0 bottom-[calc(env(safe-area-inset-bottom,0px)+1rem)] flex justify-center px-4"
      >
        {message && (
          <p className="rounded-lg bg-slate-900 px-4 py-2 text-sm text-white shadow-lg dark:bg-slate-100 dark:text-slate-900">
            {message}
          </p>
        )}
      </div>
    </div>
  )
}

export default App
