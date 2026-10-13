import { useDayEntry } from '../lib/hooks'
import type { DateKey } from '../lib/date'
import { HandwritingToText } from './HandwritingToText'
import { InkCanvas } from './InkCanvas'
import { TaskList } from './TaskList'

export function DayView({ date }: { date: DateKey }) {
  const [entry, update] = useDayEntry(date)

  if (!entry) {
    return <p className="py-12 text-center text-slate-500">กำลังเปิด…</p>
  }

  return (
    <div className="grid gap-6 lg:grid-cols-[minmax(0,2fr)_minmax(0,3fr)]">
      <div className="flex min-w-0 flex-col gap-6">
        <section
          aria-labelledby="tasks-heading"
          className="flex flex-col gap-2"
        >
          <h2
            id="tasks-heading"
            className="text-sm font-semibold tracking-wide text-slate-500 uppercase dark:text-slate-400"
          >
            งานที่ต้องทำ
          </h2>
          <TaskList
            tasks={entry.tasks}
            onChange={(tasks) => update((e) => ({ ...e, tasks }))}
          />
        </section>
        <section aria-labelledby="note-heading" className="flex flex-col gap-2">
          <h2
            id="note-heading"
            className="text-sm font-semibold tracking-wide text-slate-500 uppercase dark:text-slate-400"
          >
            โน้ต
          </h2>
          <textarea
            id="day-note"
            aria-labelledby="note-heading"
            value={entry.text}
            onChange={(ev) => {
              const text = ev.target.value
              update((e) => ({ ...e, text }))
            }}
            placeholder="พิมพ์โน้ต หรือเขียนด้วย Apple Pencil (Scribble) ในช่องนี้ก็ได้"
            className="min-h-48 w-full resize-y rounded-lg border border-slate-300 bg-white p-3 text-base leading-relaxed dark:border-slate-600 dark:bg-slate-900"
          />
        </section>
      </div>
      <section
        aria-labelledby="ink-heading"
        className="flex min-w-0 flex-col gap-2"
      >
        <h2
          id="ink-heading"
          className="text-sm font-semibold tracking-wide text-slate-500 uppercase dark:text-slate-400"
        >
          เขียนด้วยลายมือ
        </h2>
        <HandwritingToText
          strokes={entry.strokes}
          onInsert={(text) =>
            update((e) => ({
              ...e,
              text: e.text.trim() ? `${e.text.trimEnd()}\n${text}` : text,
            }))
          }
        />
        <InkCanvas
          key={date}
          strokes={entry.strokes}
          onChange={(strokes) => update((e) => ({ ...e, strokes }))}
        />
      </section>
    </div>
  )
}
