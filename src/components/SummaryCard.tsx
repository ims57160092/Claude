import type { Summary } from '../lib/summary'
import { LABEL_WORD } from './styles'

interface Props {
  /** Latin word for the label strip, e.g. "This week". */
  label: string
  /** Accessible name, in Thai, e.g. "สรุปสัปดาห์". */
  name: string
  summary: Summary
  /** Shown when there are no tasks yet. */
  empty: string
  /** Leave days in the same period; omitted means don't show the count. */
  leaveDays?: number
  className?: string
}

/** Pink planner card: tasks done out of all, a progress bar and two counts. */
export function SummaryCard({
  label,
  name,
  summary,
  empty,
  leaveDays,
  className = '',
}: Props) {
  const { total, done, open, daysWithNotes } = summary
  return (
    <aside aria-label={name} className={`flex min-w-0 flex-col ${className}`}>
      <div className="rounded-t-sm bg-coral-100 px-3 py-1.5 text-coral-800">
        <span className={LABEL_WORD}>{label}</span>
      </div>
      <div className="flex flex-1 flex-col justify-center gap-3 rounded-b-sm bg-coral-50 p-4">
        {total ? (
          <>
            <p className="text-stone-700">
              <span className="font-script text-4xl text-coral-600">
                {done}
              </span>
              <span className="text-stone-500"> / {total} งานเสร็จแล้ว</span>
            </p>
            <div
              role="progressbar"
              aria-label={`งานที่เสร็จ (${name})`}
              aria-valuemin={0}
              aria-valuemax={total}
              aria-valuenow={done}
              className="h-2 overflow-hidden rounded-full bg-white"
            >
              <div
                className="h-full rounded-full bg-coral-400"
                style={{ width: `${(done / total) * 100}%` }}
              />
            </div>
          </>
        ) : (
          <p className="text-sm text-stone-500">{empty}</p>
        )}
        <dl className="flex flex-wrap gap-x-5 gap-y-1 text-sm">
          <div className="flex items-baseline gap-1.5">
            <dt className="text-stone-500">งานค้าง</dt>
            <dd className="font-semibold text-stone-800 tabular-nums">
              {open}
            </dd>
          </div>
          <div className="flex items-baseline gap-1.5">
            <dt className="text-stone-500">วันที่มีโน้ต</dt>
            <dd className="font-semibold text-stone-800 tabular-nums">
              {daysWithNotes}
            </dd>
          </div>
          {leaveDays !== undefined && (
            <div className="flex items-baseline gap-1.5">
              <dt className="text-stone-500">วันลา</dt>
              <dd className="font-semibold text-emerald-800 tabular-nums">
                {leaveDays}
              </dd>
            </div>
          )}
        </dl>
      </div>
    </aside>
  )
}
