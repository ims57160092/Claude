import { useEffect, useId, useRef, type ReactNode } from 'react'
import { createPortal } from 'react-dom'
import { formatYear } from '../lib/date'
import { useDismiss } from '../lib/useDismiss'

const ARROW =
  'flex size-9 items-center justify-center rounded-full text-xl text-stone-600 transition hover:bg-coral-50 hover:text-coral-700 focus-visible:outline-2 focus-visible:outline-coral-500'

interface Props {
  /** Script title, e.g. "Bank holidays". */
  title: string
  /** The dialog's accessible heading, in Thai; the year is appended if given. */
  heading: string
  /** With a year, a bar under the header steps between years. */
  year?: number
  onYearChange?: (year: number) => void
  onClose: () => void
  children: ReactNode
}

/**
 * A planner sheet over the page, optionally stepping through years. Closes
 * on Escape, a tap outside or the × button, and starts with focus on ×.
 */
export function SheetDialog({
  title,
  heading,
  year,
  onYearChange,
  onClose,
  children,
}: Props) {
  const panel = useDismiss(true, onClose)
  const closeButton = useRef<HTMLButtonElement>(null)
  const headingId = useId()
  const yearLabel = year === undefined ? '' : formatYear(new Date(year, 0, 1))

  useEffect(() => closeButton.current?.focus(), [])

  // Portal to <body>: an ancestor with backdrop-filter (the sticky header)
  // would otherwise become the containing block and clip this overlay.
  return createPortal(
    <div className="fixed inset-0 z-30 flex items-start justify-center overflow-y-auto bg-stone-900/30 px-4 py-[max(2rem,env(safe-area-inset-top))]">
      <div
        ref={panel}
        role="dialog"
        aria-modal="true"
        aria-labelledby={headingId}
        className="w-full max-w-lg rounded-[3px] bg-paper shadow-[0_24px_60px_-20px_rgb(109_51_44/0.5)]"
      >
        <header className="flex items-start justify-between gap-4 px-6 pt-6">
          <div>
            <p
              aria-hidden
              className="font-script text-3xl leading-none text-stone-900"
            >
              {title}
            </p>
            <h2 id={headingId} className="mt-1 text-sm text-stone-500">
              {yearLabel ? `${heading} ${yearLabel}` : heading}
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
        {year !== undefined && (
          <div className="mt-4 flex items-center justify-between bg-coral-100 px-6 py-1.5 text-coral-800">
            <button
              type="button"
              aria-label="ปีก่อน"
              className={ARROW}
              onClick={() => onYearChange?.(year - 1)}
            >
              ‹
            </button>
            <span className="font-semibold">{yearLabel}</span>
            <button
              type="button"
              aria-label="ปีถัดไป"
              className={ARROW}
              onClick={() => onYearChange?.(year + 1)}
            >
              ›
            </button>
          </div>
        )}
        {children}
      </div>
    </div>,
    document.body,
  )
}
