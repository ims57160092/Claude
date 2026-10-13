import { useRef, type ChangeEvent } from 'react'
import { exportBackup, importBackup } from '../lib/storage'
import { todayKey } from '../lib/date'

interface Props {
  onMessage: (message: string) => void
}

/** Save all notes to a file, or restore them from one. */
export function BackupMenu({ onMessage }: Props) {
  const fileRef = useRef<HTMLInputElement>(null)

  const download = async () => {
    const backup = await exportBackup()
    const blob = new Blob([JSON.stringify(backup)], {
      type: 'application/json',
    })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `planner-${todayKey()}.json`
    a.click()
    setTimeout(() => URL.revokeObjectURL(url), 1000)
    onMessage(`บันทึกไฟล์สำรอง ${backup.entries.length} วันแล้ว`)
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

  const btn =
    'rounded-md px-3 py-1.5 text-sm font-medium text-slate-700 hover:bg-slate-200 focus-visible:outline-2 focus-visible:outline-indigo-500 dark:text-slate-200 dark:hover:bg-slate-700'

  return (
    <div className="flex items-center gap-1">
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
    </div>
  )
}
