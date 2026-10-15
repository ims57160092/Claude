import { useEffect, useState } from 'react'
import {
  formatMonth,
  formatYear,
  fromKey,
  toKey,
  type DateKey,
} from '../lib/date'
import type { Holiday } from '../lib/holidays'
import { buildIcs } from '../lib/ics'
import type { Leave } from '../lib/leave'
import { SaveFileError, inArtifact, saveFile } from '../lib/saveFile'
import {
  getAllEntries,
  getHolidays,
  getLeaves,
  type DayEntry,
} from '../lib/storage'
import { SheetDialog } from './SheetDialog'
import { CHECKBOX, LABEL_WORD, PRIMARY_BUTTON } from './styles'

type Range = 'month' | 'year' | 'all'

interface Props {
  date: DateKey
  onMessage: (message: string) => void
  onClose: () => void
}

interface Data {
  entries: DayEntry[]
  leaves: Leave[]
  holidays: Holiday[]
}

/** Exports tasks, leave and bank holidays as an .ics file for Apple Calendar. */
export function CalendarExport({ date, onMessage, onClose }: Props) {
  const [data, setData] = useState<Data | null>(null)
  const [range, setRange] = useState<Range>('month')
  const [include, setInclude] = useState({
    tasks: true,
    leave: true,
    holidays: false,
  })
  const blocked = inArtifact()

  useEffect(() => {
    let cancelled = false
    void Promise.all([getAllEntries(), getLeaves(), getHolidays()]).then(
      ([entries, leaves, holidays]) => {
        if (!cancelled) setData({ entries, leaves, holidays })
      },
    )
    return () => {
      cancelled = true
    }
  }, [])

  const d = fromKey(date)
  const bounds =
    range === 'month'
      ? {
          from: toKey(new Date(d.getFullYear(), d.getMonth(), 1)),
          to: toKey(new Date(d.getFullYear(), d.getMonth() + 1, 0)),
        }
      : range === 'year'
        ? { from: `${d.getFullYear()}-01-01`, to: `${d.getFullYear()}-12-31` }
        : {}
  const ics = data ? buildIcs({ ...data, ...bounds, include }) : null
  const fileName = `planner-${range === 'month' ? date.slice(0, 7) : range === 'year' ? date.slice(0, 4) : 'all'}.ics`

  const exportIcs = async () => {
    if (!ics?.count) return
    try {
      await saveFile(fileName, ics.text, 'text/calendar')
      onMessage(`ส่งออก ${ics.count} รายการแล้ว เปิดไฟล์เพื่อเพิ่มลงปฏิทิน`)
      onClose()
    } catch (e) {
      if (e instanceof SaveFileError && e.code === 'declined') return
      onMessage('ส่งออกไฟล์ปฏิทินไม่สำเร็จ')
    }
  }

  const ranges: [Range, string][] = [
    ['month', formatMonth(d)],
    ['year', `ทั้งปี ${formatYear(d)}`],
    ['all', 'ทั้งหมด'],
  ]
  const kinds: [keyof typeof include, string][] = [
    ['tasks', 'งาน (มีเวลา = นัด 1 ชม., ไม่มีเวลา = ทั้งวัน)'],
    ['leave', 'วันลา'],
    ['holidays', 'วันหยุดธนาคาร'],
  ]

  return (
    <SheetDialog
      title="Apple Calendar"
      heading="ส่งออกไปปฏิทิน Apple"
      onClose={onClose}
    >
      <div className="flex flex-col gap-5 px-6 py-5">
        <fieldset className="flex flex-col gap-2">
          <legend className="mb-2 flex items-baseline gap-2 text-coral-800">
            <span className={LABEL_WORD}>Range</span>
            <span className="text-sm">ช่วงเวลา</span>
          </legend>
          <div className="flex flex-wrap gap-1.5">
            {ranges.map(([r, label]) => (
              <button
                key={r}
                type="button"
                aria-pressed={range === r}
                onClick={() => setRange(r)}
                className={`rounded-full px-3.5 py-1.5 text-sm font-medium transition focus-visible:outline-2 focus-visible:outline-coral-500 ${
                  range === r
                    ? 'bg-coral-600 text-white'
                    : 'bg-stone-100 text-stone-700 hover:bg-coral-50'
                }`}
              >
                {label}
              </button>
            ))}
          </div>
        </fieldset>

        <fieldset className="flex flex-col gap-2">
          <legend className="mb-2 flex items-baseline gap-2 text-coral-800">
            <span className={LABEL_WORD}>Include</span>
            <span className="text-sm">รวมอะไรบ้าง</span>
          </legend>
          {kinds.map(([k, label]) => (
            <label key={k} className="flex items-center gap-3 text-stone-800">
              <input
                id={`ics-${k}`}
                type="checkbox"
                className={`${CHECKBOX} rounded-md before:rounded-sm`}
                checked={include[k]}
                onChange={(e) =>
                  setInclude({ ...include, [k]: e.target.checked })
                }
              />
              {label}
            </label>
          ))}
        </fieldset>

        {blocked ? (
          <p
            role="note"
            className="rounded-sm bg-stone-100 px-3 py-2 text-sm text-stone-700"
          >
            หน้านี้เปิดอยู่ใน claude.ai ซึ่งไม่อนุญาตให้บันทึกไฟล์ .ics ได้
            ส่งออกไปปฏิทินได้จากเว็บ Planner บน GitHub Pages
          </p>
        ) : (
          <p className="text-sm text-stone-500">
            บน iPad: เปิดไฟล์ที่ได้ (จาก Safari หรือแอปไฟล์) แล้วแตะ
            "เพิ่มทั้งหมด" ระบบจะถามว่าจะเพิ่มลงปฏิทินไหน ส่งออกซ้ำได้
            แต่ปฏิทินอาจเพิ่มรายการซ้ำ
          </p>
        )}

        <div className="flex items-center justify-between gap-3">
          <p className="text-sm text-stone-600" aria-live="polite">
            {ics ? `${ics.count} รายการ` : 'กำลังนับ…'}
          </p>
          <button
            type="button"
            className={PRIMARY_BUTTON}
            disabled={blocked || !ics?.count}
            onClick={() => void exportIcs()}
          >
            ส่งออก .ics
          </button>
        </div>
      </div>
    </SheetDialog>
  )
}
