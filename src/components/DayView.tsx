import { useDayEntry, useHolidays } from '../lib/hooks'
import { formatLong, fromKey, type DateKey } from '../lib/date'
import { HandwritingToText } from './HandwritingToText'
import { InkCanvas } from './InkCanvas'
import { Page } from './Page'
import { LABEL_STRIP, LABEL_WORD } from './styles'
import { TaskList } from './TaskList'

function Label({ id, word, thai }: { id: string; word: string; thai: string }) {
  return (
    <h2 id={id} className={LABEL_STRIP}>
      <span className={LABEL_WORD}>{word}</span>
      <span className="text-sm">{thai}</span>
    </h2>
  )
}

export function DayView({
  date,
  onPickDate,
}: {
  date: DateKey
  onPickDate: (d: DateKey) => void
}) {
  const [entry, update] = useDayEntry(date)
  const holiday = useHolidays().get(date)

  return (
    <Page
      title="Daily plan"
      heading={formatLong(fromKey(date))}
      date={date}
      pickMode="day"
      onPickDate={onPickDate}
    >
      {holiday && (
        <p className="mb-5 flex flex-wrap items-baseline gap-x-2 rounded-sm bg-coral-50 px-3 py-2 text-coral-800">
          <span className={LABEL_WORD}>Bank holiday</span>
          <span className="font-medium">{holiday.name}</span>
          {holiday.note && (
            <span className="text-sm text-stone-500">{holiday.note}</span>
          )}
        </p>
      )}
      {!entry ? (
        <p className="py-12 text-center text-stone-500">กำลังเปิด…</p>
      ) : (
        <div className="grid gap-8 lg:grid-cols-[minmax(0,2fr)_minmax(0,3fr)]">
          <div className="flex min-w-0 flex-col gap-8">
            <section
              aria-labelledby="tasks-heading"
              className="flex flex-col gap-1"
            >
              <Label id="tasks-heading" word="To do" thai="งานที่ต้องทำ" />
              <TaskList
                tasks={entry.tasks}
                onChange={(tasks) => update((e) => ({ ...e, tasks }))}
              />
            </section>
            <section
              aria-labelledby="note-heading"
              className="flex flex-col gap-1"
            >
              <Label id="note-heading" word="Notes" thai="โน้ต" />
              <textarea
                id="day-note"
                aria-label="โน้ต"
                value={entry.text}
                onChange={(ev) => {
                  const text = ev.target.value
                  update((e) => ({ ...e, text }))
                }}
                placeholder="พิมพ์โน้ต หรือเขียนด้วย Apple Pencil (Scribble) ในช่องนี้ก็ได้"
                className="ruled min-h-64 w-full resize-y bg-transparent px-1 text-base text-stone-800 placeholder:text-stone-400 focus:outline-none focus-visible:ring-2 focus-visible:ring-coral-200"
              />
            </section>
          </div>
          <section
            aria-labelledby="ink-heading"
            className="flex min-w-0 flex-col gap-2"
          >
            <Label id="ink-heading" word="Sketch" thai="เขียนด้วยลายมือ" />
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
      )}
    </Page>
  )
}
