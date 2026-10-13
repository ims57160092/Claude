import { useEffect, useRef, useState } from 'react'
import {
  isSampleError,
  loadRecognizer,
  PERMANENT_ERRORS,
  type Recognize,
} from '../lib/handwriting'
import type { Stroke } from '../lib/storage'

type State =
  | { kind: 'idle' }
  | { kind: 'reading' }
  | { kind: 'result'; text: string }
  | { kind: 'error'; message: string }

const ERROR_COPY: Record<string, string> = {
  rate_limited:
    'ใช้งานถี่เกินไป หรือโควตาการใช้งาน Claude เต็มแล้ว ลองใหม่อีกสักพัก',
  session_expired: 'เซสชันหมดอายุ กรุณาเข้าสู่ระบบ claude.ai ใหม่',
  image_rejected: 'ส่งภาพลายมือไม่สำเร็จ ลองเขียนให้น้อยลงแล้วแปลงใหม่',
  refused: 'Claude อ่านหน้านี้ให้ไม่ได้',
  empty_completion: 'ไม่ได้รับข้อความกลับมา ลองใหม่อีกครั้ง',
  invalid_json: 'อ่านผลลัพธ์ไม่สำเร็จ ลองใหม่อีกครั้ง',
}

interface Props {
  strokes: Stroke[]
  onInsert: (text: string) => void
}

/** Reads the day's handwriting with Claude and offers it for the typed note. */
export function HandwritingToText({ strokes, onInsert }: Props) {
  const [recognize, setRecognize] = useState<Recognize | null>(null)
  const [state, setState] = useState<State>({ kind: 'idle' })
  const controller = useRef<AbortController | null>(null)

  useEffect(() => {
    let cancelled = false
    void loadRecognizer().then((r) => {
      if (!cancelled && r) setRecognize(() => r)
    })
    return () => {
      cancelled = true
      controller.current?.abort()
    }
  }, [])

  if (!recognize) return null

  const read = async () => {
    const ctl = new AbortController()
    controller.current = ctl
    setState({ kind: 'reading' })
    try {
      const text = await recognize(strokes, ctl.signal)
      setState(
        text
          ? { kind: 'result', text }
          : { kind: 'error', message: 'ไม่พบตัวหนังสือที่อ่านได้ในหน้านี้' },
      )
    } catch (e) {
      const code = isSampleError(e) ? e.code : 'upstream_error'
      if (code === 'cancelled') setState({ kind: 'idle' })
      else if (PERMANENT_ERRORS.has(code)) setRecognize(null)
      else
        setState({
          kind: 'error',
          message: ERROR_COPY[code] ?? 'เชื่อมต่อไม่สำเร็จ ลองใหม่อีกครั้ง',
        })
    }
  }

  const btn =
    'rounded-md px-3 py-1.5 text-sm font-medium focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-500 disabled:opacity-40'

  return (
    <div className="flex flex-col gap-2">
      {state.kind !== 'result' && (
        <div className="flex flex-wrap items-center gap-2">
          <button
            type="button"
            className={`${btn} bg-indigo-600 text-white hover:bg-indigo-700`}
            onClick={() => void read()}
            disabled={!strokes.length || state.kind === 'reading'}
          >
            {state.kind === 'reading'
              ? 'กำลังอ่านลายมือ…'
              : 'แปลงลายมือเป็นข้อความ'}
          </button>
          {state.kind === 'reading' && (
            <button
              type="button"
              className={`${btn} text-slate-700 hover:bg-slate-200 dark:text-slate-200 dark:hover:bg-slate-700`}
              onClick={() => controller.current?.abort()}
            >
              หยุด
            </button>
          )}
          {state.kind === 'error' && (
            <p role="alert" className="text-sm text-red-700 dark:text-red-400">
              {state.message}
            </p>
          )}
        </div>
      )}
      {state.kind === 'result' && (
        <div className="flex flex-col gap-2 rounded-lg border border-indigo-200 bg-indigo-50 p-3 dark:border-indigo-900 dark:bg-indigo-950">
          <label
            htmlFor="recognized-text"
            className="text-sm font-medium text-indigo-900 dark:text-indigo-100"
          >
            ข้อความที่อ่านได้ (แก้ไขก่อนเพิ่มได้)
          </label>
          <textarea
            id="recognized-text"
            value={state.text}
            onChange={(e) => setState({ kind: 'result', text: e.target.value })}
            rows={Math.min(10, state.text.split('\n').length + 1)}
            className="w-full resize-y rounded-md border border-indigo-200 bg-white p-2 text-base leading-relaxed dark:border-indigo-800 dark:bg-slate-900"
          />
          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              className={`${btn} bg-indigo-600 text-white hover:bg-indigo-700`}
              onClick={() => {
                onInsert(state.text.trim())
                setState({ kind: 'idle' })
              }}
              disabled={!state.text.trim()}
            >
              เพิ่มลงโน้ต
            </button>
            <button
              type="button"
              className={`${btn} text-slate-700 hover:bg-slate-200 dark:text-slate-200 dark:hover:bg-slate-700`}
              onClick={() => setState({ kind: 'idle' })}
            >
              ยกเลิก
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
