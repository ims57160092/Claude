import { useCallback, useRef, useState, type ReactNode } from 'react'
import type { DateKey } from '../lib/date'
import { useDismiss } from '../lib/useDismiss'
import { DatePicker, type PickMode } from './DatePicker'

interface Props {
  /** The script title across the top, as on a printed planner page. */
  title: string
  /** What the page covers (a date, a week, a month); the page's real heading. */
  heading: string
  /** The date the page shows, and what tapping the DATE line lets you pick. */
  date: DateKey
  pickMode: PickMode
  onPickDate: (date: DateKey) => void
  children: ReactNode
}

/** A sheet of planner paper. */
export function Page({
  title,
  heading,
  date,
  pickMode,
  onPickDate,
  children,
}: Props) {
  const [open, setOpen] = useState(false)
  const trigger = useRef<HTMLButtonElement>(null)
  const close = useCallback(() => {
    setOpen(false)
    trigger.current?.focus()
  }, [])
  const popover = useDismiss(open, close)

  return (
    <section className="rounded-[3px] bg-paper px-4 pt-5 pb-6 shadow-[0_1px_2px_rgb(109_51_44/0.08),0_18px_40px_-24px_rgb(109_51_44/0.45)] sm:px-8 sm:pt-7 sm:pb-8">
      <header className="mb-5 flex flex-wrap items-end justify-between gap-x-6 gap-y-1">
        <p
          aria-hidden
          className="font-script text-3xl leading-none text-stone-900 sm:text-4xl"
        >
          {title}
        </p>
        <div ref={popover} className="relative min-w-0">
          <h1>
            <button
              ref={trigger}
              type="button"
              aria-haspopup="dialog"
              aria-expanded={open}
              onClick={() => setOpen((o) => !o)}
              className="group flex min-w-0 items-baseline gap-3 border-b border-stone-300 pb-1 text-left text-stone-700 transition hover:border-coral-400 focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-coral-500"
            >
              <span className="text-[0.65rem] font-semibold tracking-[0.2em] text-stone-400">
                DATE
              </span>
              <span className="text-sm font-medium text-balance">
                {heading}
              </span>
              <span
                aria-hidden
                className="text-xs text-coral-400 transition group-hover:text-coral-600"
              >
                ▾
              </span>
            </button>
          </h1>
          {open && (
            <div
              role="dialog"
              aria-label="เลือกวันที่"
              className="absolute top-full left-0 z-20 mt-2 sm:right-0 sm:left-auto"
            >
              <DatePicker
                value={date}
                mode={pickMode}
                onPick={(d) => {
                  onPickDate(d)
                  close()
                }}
              />
            </div>
          )}
        </div>
      </header>
      {children}
    </section>
  )
}
