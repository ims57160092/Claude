import { useState, type FormEvent } from 'react'
import { newId, type Task } from '../lib/storage'
import { sortTasks } from '../lib/tasks'
import { CHECKBOX, FIELD, PRIMARY_BUTTON } from './styles'

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
    <div className="flex flex-col">
      <ul className="flex flex-col">
        {sortTasks(tasks).map((t) => (
          <li
            key={t.id}
            className="group flex min-h-11 items-center gap-3 border-b border-stone-200 py-1.5"
          >
            <input
              id={`task-${t.id}`}
              type="checkbox"
              className={CHECKBOX}
              checked={t.done}
              onChange={(e) => patch(t.id, { done: e.target.checked })}
            />
            {t.time && (
              <span className="shrink-0 text-sm font-medium text-coral-700 tabular-nums">
                {t.time}
              </span>
            )}
            <label
              htmlFor={`task-${t.id}`}
              className={`min-w-0 flex-1 break-words ${t.done ? 'text-stone-400 line-through' : ''}`}
            >
              {t.text}
            </label>
            <button
              type="button"
              aria-label={`ลบ ${t.text}`}
              className="shrink-0 rounded-full px-2 py-1 text-sm text-stone-400 opacity-60 transition group-hover:opacity-100 hover:bg-coral-50 hover:text-coral-700 focus-visible:opacity-100 focus-visible:outline-2 focus-visible:outline-coral-500"
              onClick={() => onChange(tasks.filter((x) => x.id !== t.id))}
            >
              ลบ
            </button>
          </li>
        ))}
        {tasks.length === 0 && (
          <li className="flex min-h-11 items-center border-b border-stone-200 text-sm text-stone-400">
            ยังไม่มีงานในวันนี้
          </li>
        )}
      </ul>
      <form onSubmit={add} className="mt-2 flex flex-wrap gap-2">
        <div className="relative flex">
          <input
            id="new-task-time"
            type="time"
            aria-label="เวลา (ไม่บังคับ)"
            value={time}
            onChange={(e) => setTime(e.target.value)}
            className={`${FIELD} px-2 ${time ? 'pr-9' : ''}`}
          />
          {/* iPad Safari's own Reset puts the time back to the field's default
              value, which React keeps equal to the current time, so it looks
              like it does nothing. This clears the time for real. */}
          {time && (
            <button
              type="button"
              aria-label="ล้างเวลา"
              onClick={() => setTime('')}
              className="absolute inset-y-0 right-1 my-auto flex size-7 items-center justify-center rounded-full text-lg leading-none text-stone-400 transition hover:bg-coral-50 hover:text-coral-700 focus-visible:outline-2 focus-visible:outline-coral-500"
            >
              ×
            </button>
          )}
        </div>
        <input
          id="new-task-text"
          type="text"
          placeholder="เพิ่มงาน…"
          aria-label="งานใหม่"
          value={text}
          onChange={(e) => setText(e.target.value)}
          className={`${FIELD} min-w-0 flex-1`}
        />
        <button type="submit" className={PRIMARY_BUTTON}>
          เพิ่ม
        </button>
      </form>
    </div>
  )
}
