import { useState, type FormEvent } from 'react'
import { newId, type Task } from '../lib/storage'
import { sortTasks } from '../lib/tasks'

interface Props {
  tasks: Task[]
  onChange: (tasks: Task[]) => void
}

export function TaskList({ tasks, onChange }: Props) {
  const [text, setText] = useState('')
  const [time, setTime] = useState('')

  const add = (e: FormEvent) => {
    e.preventDefault()
    const trimmed = text.trim()
    if (!trimmed) return
    onChange([...tasks, { id: newId(), text: trimmed, done: false, time }])
    setText('')
    setTime('')
  }

  const patch = (id: string, change: Partial<Task>) =>
    onChange(tasks.map((t) => (t.id === id ? { ...t, ...change } : t)))

  return (
    <div className="flex flex-col gap-2">
      <ul className="flex flex-col">
        {sortTasks(tasks).map((t) => (
          <li
            key={t.id}
            className="group flex items-center gap-3 border-b border-slate-200 py-2 last:border-0 dark:border-slate-700"
          >
            <input
              id={`task-${t.id}`}
              type="checkbox"
              className="size-5 shrink-0 accent-indigo-600"
              checked={t.done}
              onChange={(e) => patch(t.id, { done: e.target.checked })}
            />
            {t.time && (
              <span className="shrink-0 font-mono text-sm text-indigo-700 tabular-nums dark:text-indigo-300">
                {t.time}
              </span>
            )}
            <label
              htmlFor={`task-${t.id}`}
              className={`min-w-0 flex-1 break-words ${t.done ? 'text-slate-400 line-through' : ''}`}
            >
              {t.text}
            </label>
            <button
              type="button"
              aria-label={`ลบ ${t.text}`}
              className="shrink-0 rounded px-2 py-1 text-sm text-slate-400 hover:bg-red-50 hover:text-red-600 focus-visible:outline-2 focus-visible:outline-indigo-500 dark:hover:bg-red-950"
              onClick={() => onChange(tasks.filter((x) => x.id !== t.id))}
            >
              ลบ
            </button>
          </li>
        ))}
        {tasks.length === 0 && (
          <li className="py-2 text-sm text-slate-500 dark:text-slate-400">
            ยังไม่มีงานในวันนี้
          </li>
        )}
      </ul>
      <form onSubmit={add} className="flex flex-wrap gap-2">
        <input
          id="new-task-time"
          type="time"
          aria-label="เวลา (ไม่บังคับ)"
          value={time}
          onChange={(e) => setTime(e.target.value)}
          className="rounded-md border border-slate-300 bg-white px-2 py-2 text-base dark:border-slate-600 dark:bg-slate-900"
        />
        <input
          id="new-task-text"
          type="text"
          placeholder="เพิ่มงาน…"
          aria-label="งานใหม่"
          value={text}
          onChange={(e) => setText(e.target.value)}
          className="min-w-0 flex-1 rounded-md border border-slate-300 bg-white px-3 py-2 text-base dark:border-slate-600 dark:bg-slate-900"
        />
        <button
          type="submit"
          className="rounded-md bg-indigo-600 px-4 py-2 font-medium text-white hover:bg-indigo-700 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-500"
        >
          เพิ่ม
        </button>
      </form>
    </div>
  )
}
