import { useRef, useState, type ChangeEvent } from 'react'
import { exportBackup, importBackup } from '../lib/storage'
import { todayKey, type DateKey } from '../lib/date'
import { SaveFileError, saveFile } from '../lib/saveFile'
import { CalendarExport } from './CalendarExport'
import { QUIET_BUTTON } from './styles'

interface Props {
  /** The date on screen, for "this month" in the calendar export. */
  date: DateKey
  onMessage: (message: string) => void
}

/** Save all notes to a file, or restore them from one. */
export function BackupMenu({ date, onMessage }: Props) {
  const fileRef = useRef<HTMLInputElement>(null)
  const [exporting, setExporting] = useState(false)

  const download = async () => {
    const backup = await exportBackup()
    try {
      await saveFile(
        `planner-${todayKey()}.json`,
        JSON.stringify(backup),
        'application/json',
      )
      onMessage(`บันทึกไฟล์สำรอง ${backup.entries.length} วันแล้ว`)
    } catch (e) {
      if (e instanceof SaveFileError && e.code === 'declined') return
      onMessage('บันทึกไฟล์สำรองไม่สำเร็จ')
    }
  }

  const restore = async (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    e.target.value = ''
    if (!file) return
    try {
      const count = await importBackup(JSON.parse(await file.text()))
      onMessage(`นำเข้า ${count} วันแล้ว`)
    } catch (err) {
      onMessage(
        err instanceof SyntaxError
          ? 'อ่านไฟล์ไม่ได้ ไฟล์ต้องเป็น .json ที่ส่งออกจาก Planner'
          : String((err as Error).message),
      )
    }
  }

  const btn = `${QUIET_BUTTON} bg-white/50 hover:bg-white`

  return (
    <div className="flex items-center gap-1">
      <button type="button" className={btn} onClick={() => setExporting(true)}>
        ปฏิทิน Apple
      </button>
      <button type="button" className={btn} onClick={() => void download()}>
        สำรองข้อมูล
      </button>
      <button
        type="button"
        className={btn}
        onClick={() => fileRef.current?.click()}
      >
        นำเข้า
      </button>
      <input
        id="import-file"
        ref={fileRef}
        type="file"
        accept="application/json,.json"
        hidden
        onChange={(e) => void restore(e)}
      />
      {exporting && (
        <CalendarExport
          date={date}
          onMessage={onMessage}
          onClose={() => setExporting(false)}
        />
      )}
    </div>
  )
}
