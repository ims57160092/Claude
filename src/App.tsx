import { useEffect, useState } from 'react'
import { BackupMenu } from './components/BackupMenu'
import { DayView } from './components/DayView'
import { MonthView } from './components/MonthView'
import { WeekView } from './components/WeekView'
import {
  addDays,
  addMonths,
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

  const navBtn =
    'flex size-10 items-center justify-center rounded-full bg-white/70 text-xl text-stone-700 transition hover:bg-white focus-visible:outline-2 focus-visible:outline-coral-600'

  return (
    <div className="min-h-screen bg-blush font-sans text-stone-900">
      <header className="sticky top-[env(safe-area-inset-top,0px)] z-10 bg-blush/90 backdrop-blur">
        <div className="mx-auto flex max-w-7xl flex-wrap items-center gap-x-5 gap-y-2 px-4 py-3">
          <span className="font-script text-3xl leading-none text-stone-900">
            Planner
          </span>
          <div className="flex items-center gap-1.5">
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
              className="h-10 rounded-full bg-white/70 px-4 text-sm font-medium text-stone-800 transition hover:bg-white focus-visible:outline-2 focus-visible:outline-coral-600"
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
          <div className="ml-auto flex flex-wrap items-center gap-2">
            <div
              role="group"
              aria-label="มุมมอง"
              className="flex rounded-full bg-white/50 p-1"
            >
              {VIEWS.map(([v, label]) => (
                <button
                  key={v}
                  type="button"
                  aria-pressed={view === v}
                  onClick={() => setView(v)}
                  className={`rounded-full px-4 py-1.5 text-sm font-medium transition focus-visible:outline-2 focus-visible:outline-coral-600 ${
                    view === v
                      ? 'bg-white text-coral-700 shadow-sm'
                      : 'text-stone-700 hover:bg-white/60'
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
      <main className="mx-auto max-w-7xl px-4 pt-2 pb-10">
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
          <p className="rounded-full bg-stone-900 px-5 py-2 text-sm text-white shadow-lg">
            {message}
          </p>
        )}
      </div>
    </div>
  )
}

export default App
