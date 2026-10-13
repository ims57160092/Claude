import {
  useCallback,
  useEffect,
  useRef,
  useState,
  type PointerEvent,
} from 'react'
import {
  INK_HEIGHT,
  INK_WIDTH,
  type InkTool,
  type Point,
  type Stroke,
} from '../lib/storage'

type Tool = InkTool | 'eraser'

const PEN_COLORS = ['#1f2937', '#1d4ed8', '#dc2626', '#15803d']
const HIGHLIGHTER_COLORS = ['#facc15', '#f472b6', '#38bdf8', '#4ade80']
const SIZES = [2.5, 4.5, 8]
const HIGHLIGHTER_SCALE = 5
const ERASER_RADIUS = 16

function drawStroke(ctx: CanvasRenderingContext2D, s: Stroke) {
  const pts = s.points
  if (pts.length === 0) return
  ctx.strokeStyle = s.color
  ctx.fillStyle = s.color
  ctx.lineCap = 'round'
  ctx.lineJoin = 'round'

  if (s.tool === 'highlighter') {
    // One path, so overlapping segments of the same stroke don't darken.
    ctx.globalAlpha = 0.35
    ctx.lineWidth = s.width
    ctx.beginPath()
    ctx.moveTo(pts[0][0], pts[0][1])
    if (pts.length === 1) ctx.lineTo(pts[0][0] + 0.1, pts[0][1])
    for (let i = 1; i < pts.length - 1; i++) {
      const mx = (pts[i][0] + pts[i + 1][0]) / 2
      const my = (pts[i][1] + pts[i + 1][1]) / 2
      ctx.quadraticCurveTo(pts[i][0], pts[i][1], mx, my)
    }
    if (pts.length > 1)
      ctx.lineTo(pts[pts.length - 1][0], pts[pts.length - 1][1])
    ctx.stroke()
    ctx.globalAlpha = 1
    return
  }

  // Pen: each segment gets its own width from the pencil pressure.
  const widthAt = (p: number) => s.width * (0.45 + p)
  if (pts.length === 1) {
    ctx.beginPath()
    ctx.arc(pts[0][0], pts[0][1], widthAt(pts[0][2]) / 2, 0, Math.PI * 2)
    ctx.fill()
    return
  }
  let fromX = pts[0][0]
  let fromY = pts[0][1]
  for (let i = 1; i < pts.length; i++) {
    const [x, y, p] = pts[i]
    const last = i === pts.length - 1
    const toX = last ? x : (x + pts[i + 1][0]) / 2
    const toY = last ? y : (y + pts[i + 1][1]) / 2
    ctx.lineWidth = widthAt((pts[i - 1][2] + p) / 2)
    ctx.beginPath()
    ctx.moveTo(fromX, fromY)
    ctx.quadraticCurveTo(x, y, toX, toY)
    ctx.stroke()
    fromX = toX
    fromY = toY
  }
}

function distanceToSegment(px: number, py: number, a: Point, b: Point): number {
  const dx = b[0] - a[0]
  const dy = b[1] - a[1]
  const len = dx * dx + dy * dy
  const t =
    len === 0
      ? 0
      : Math.max(0, Math.min(1, ((px - a[0]) * dx + (py - a[1]) * dy) / len))
  return Math.hypot(px - (a[0] + t * dx), py - (a[1] + t * dy))
}

function hits(s: Stroke, x: number, y: number): boolean {
  const reach = ERASER_RADIUS + s.width / 2
  const pts = s.points
  if (pts.length === 1) return Math.hypot(x - pts[0][0], y - pts[0][1]) <= reach
  for (let i = 1; i < pts.length; i++) {
    if (distanceToSegment(x, y, pts[i - 1], pts[i]) <= reach) return true
  }
  return false
}

interface Props {
  strokes: Stroke[]
  onChange: (strokes: Stroke[]) => void
}

/**
 * A page for handwriting with Apple Pencil, a mouse or (optionally) a finger.
 * While finger drawing is off, a finger drag scrolls the page instead, so the
 * palm and fingers never leave marks.
 */
export function InkCanvas({ strokes, onChange }: Props) {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const cacheRef = useRef<HTMLCanvasElement | null>(null)
  const [tool, setTool] = useState<Tool>('pen')
  const [penColor, setPenColor] = useState(PEN_COLORS[0])
  const [highlightColor, setHighlightColor] = useState(HIGHLIGHTER_COLORS[0])
  const [size, setSize] = useState(1)
  const [fingerDraws, setFingerDraws] = useState(false)
  const [clearArmed, setClearArmed] = useState(false)
  const [history, setHistory] = useState<{
    undo: Stroke[][]
    redo: Stroke[][]
  }>({
    undo: [],
    redo: [],
  })

  // Strokes shown while the eraser is down; committed on pointer up.
  const erasing = useRef<{ before: Stroke[]; working: Stroke[] } | null>(null)
  const current = useRef<Stroke | null>(null)
  const activePointer = useRef<number | null>(null)
  const scrollTouch = useRef<{ id: number; y: number } | null>(null)
  const frame = useRef(0)

  const strokesRef = useRef(strokes)

  const setupContext = (
    ctx: CanvasRenderingContext2D,
    canvas: HTMLCanvasElement,
  ) => {
    ctx.setTransform(
      canvas.width / INK_WIDTH,
      0,
      0,
      canvas.height / INK_HEIGHT,
      0,
      0,
    )
  }

  const rebuildCache = useCallback((list: Stroke[]) => {
    const canvas = canvasRef.current
    if (!canvas) return
    const cache = (cacheRef.current ??= document.createElement('canvas'))
    cache.width = canvas.width
    cache.height = canvas.height
    const ctx = cache.getContext('2d')
    if (!ctx) return
    setupContext(ctx, cache)
    ctx.clearRect(0, 0, INK_WIDTH, INK_HEIGHT)
    for (const s of list) drawStroke(ctx, s)
  }, [])

  const paint = useCallback(() => {
    frame.current = 0
    const canvas = canvasRef.current
    const ctx = canvas?.getContext('2d')
    if (!canvas || !ctx) return
    ctx.setTransform(1, 0, 0, 1, 0, 0)
    ctx.clearRect(0, 0, canvas.width, canvas.height)
    if (cacheRef.current) ctx.drawImage(cacheRef.current, 0, 0)
    if (current.current) {
      setupContext(ctx, canvas)
      drawStroke(ctx, current.current)
    }
  }, [])

  const requestPaint = useCallback(() => {
    if (!frame.current) frame.current = requestAnimationFrame(paint)
  }, [paint])

  // Match the backing store to the displayed size and the screen's pixel density.
  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const resize = () => {
      const rect = canvas.getBoundingClientRect()
      const dpr = window.devicePixelRatio || 1
      const w = Math.round(rect.width * dpr)
      const h = Math.round(rect.height * dpr)
      if (w === 0 || (canvas.width === w && canvas.height === h)) return
      canvas.width = w
      canvas.height = h
      rebuildCache(erasing.current?.working ?? strokesRef.current)
      paint()
    }
    resize()
    const observer = new ResizeObserver(resize)
    observer.observe(canvas)
    return () => observer.disconnect()
  }, [paint, rebuildCache])

  useEffect(() => {
    strokesRef.current = strokes
    if (!erasing.current) {
      rebuildCache(strokes)
      paint()
    }
  }, [strokes, paint, rebuildCache])

  useEffect(() => () => cancelAnimationFrame(frame.current), [])

  // iPad Safari still scrolls the page under Apple Pencil despite
  // `touch-action: none`. Cancelling the touch events (which needs a
  // non-passive listener, so not React's onTouch*) stops it. Pointer events
  // still arrive, and a finger drag scrolls through onPointerMove instead.
  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const block = (e: TouchEvent) => {
      if (e.cancelable) e.preventDefault()
    }
    canvas.addEventListener('touchstart', block, { passive: false })
    canvas.addEventListener('touchmove', block, { passive: false })
    return () => {
      canvas.removeEventListener('touchstart', block)
      canvas.removeEventListener('touchmove', block)
    }
  }, [])

  useEffect(() => {
    if (!clearArmed) return
    const t = window.setTimeout(() => setClearArmed(false), 3000)
    return () => window.clearTimeout(t)
  }, [clearArmed])

  const commit = (next: Stroke[]) => {
    setHistory((h) => ({
      undo: [...h.undo, strokesRef.current].slice(-100),
      redo: [],
    }))
    onChange(next)
  }

  const undo = () => {
    const prev = history.undo.at(-1)
    if (!prev) return
    setHistory((h) => ({
      undo: h.undo.slice(0, -1),
      redo: [...h.redo, strokesRef.current],
    }))
    onChange(prev)
  }

  const redo = () => {
    const next = history.redo.at(-1)
    if (!next) return
    setHistory((h) => ({
      undo: [...h.undo, strokesRef.current],
      redo: h.redo.slice(0, -1),
    }))
    onChange(next)
  }

  const clear = () => {
    if (!clearArmed) {
      setClearArmed(true)
      return
    }
    setClearArmed(false)
    if (strokes.length) commit([])
  }

  const toPoint = (e: {
    clientX: number
    clientY: number
    pressure: number
    pointerType: string
  }): Point => {
    const rect = canvasRef.current!.getBoundingClientRect()
    const x = ((e.clientX - rect.left) / rect.width) * INK_WIDTH
    const y = ((e.clientY - rect.top) / rect.height) * INK_HEIGHT
    const p = e.pointerType === 'pen' ? Math.max(0.05, e.pressure) : 0.5
    return [
      Math.round(x * 10) / 10,
      Math.round(y * 10) / 10,
      Math.round(p * 100) / 100,
    ]
  }

  const eraseAt = ([x, y]: Point) => {
    const state = erasing.current
    if (!state) return
    const kept = state.working.filter((s) => !hits(s, x, y))
    if (kept.length !== state.working.length) {
      state.working = kept
      rebuildCache(kept)
    }
  }

  const onPointerDown = (e: PointerEvent<HTMLCanvasElement>) => {
    if (e.pointerType === 'touch' && !fingerDraws) {
      scrollTouch.current = { id: e.pointerId, y: e.clientY }
      return
    }
    if (activePointer.current !== null || e.button > 0) return
    e.preventDefault()
    try {
      e.currentTarget.setPointerCapture(e.pointerId)
    } catch {
      // Capture only keeps a stroke going past the edge; drawing works without it.
    }
    activePointer.current = e.pointerId
    const pt = toPoint(e)
    if (tool === 'eraser') {
      erasing.current = { before: strokes, working: strokes }
      eraseAt(pt)
    } else {
      current.current = {
        tool,
        color: tool === 'pen' ? penColor : highlightColor,
        width: tool === 'pen' ? SIZES[size] : SIZES[size] * HIGHLIGHTER_SCALE,
        points: [pt],
      }
    }
    requestPaint()
  }

  const onPointerMove = (e: PointerEvent<HTMLCanvasElement>) => {
    const touch = scrollTouch.current
    if (touch && touch.id === e.pointerId) {
      window.scrollBy(0, touch.y - e.clientY)
      touch.y = e.clientY
      return
    }
    if (e.pointerId !== activePointer.current) return
    const native = e.nativeEvent
    const events = native.getCoalescedEvents?.() ?? []
    for (const ev of events.length ? events : [native]) {
      const pt = toPoint(ev)
      if (erasing.current) eraseAt(pt)
      else current.current?.points.push(pt)
    }
    requestPaint()
  }

  const onPointerEnd = (e: PointerEvent<HTMLCanvasElement>) => {
    if (scrollTouch.current?.id === e.pointerId) {
      scrollTouch.current = null
      return
    }
    if (e.pointerId !== activePointer.current) return
    activePointer.current = null
    if (erasing.current) {
      const { before, working } = erasing.current
      erasing.current = null
      if (working !== before) commit(working)
    } else if (current.current) {
      const stroke = current.current
      current.current = null
      commit([...strokes, stroke])
    }
    requestPaint()
  }

  const colors = tool === 'highlighter' ? HIGHLIGHTER_COLORS : PEN_COLORS
  const activeColor = tool === 'highlighter' ? highlightColor : penColor
  const chip =
    'rounded-md px-2.5 py-1.5 text-sm font-medium transition focus-visible:outline-2 focus-visible:outline-indigo-500'
  const chipState = (on: boolean) =>
    on
      ? 'bg-indigo-600 text-white'
      : 'text-slate-700 hover:bg-slate-200 dark:text-slate-200 dark:hover:bg-slate-700'

  return (
    <div className="flex flex-col gap-2">
      <div
        role="toolbar"
        aria-label="เครื่องมือเขียน"
        className="flex flex-wrap items-center gap-1 rounded-lg bg-slate-100 p-1 dark:bg-slate-800"
      >
        {(
          [
            ['pen', 'ปากกา'],
            ['highlighter', 'ไฮไลต์'],
            ['eraser', 'ยางลบ'],
          ] as const
        ).map(([t, label]) => (
          <button
            key={t}
            type="button"
            aria-pressed={tool === t}
            className={`${chip} ${chipState(tool === t)}`}
            onClick={() => setTool(t)}
          >
            {label}
          </button>
        ))}
        <span
          className="mx-1 h-6 w-px bg-slate-300 dark:bg-slate-600"
          aria-hidden
        />
        {tool !== 'eraser' &&
          colors.map((c) => (
            <button
              key={c}
              type="button"
              aria-label={`สี ${c}`}
              aria-pressed={activeColor === c}
              onClick={() =>
                tool === 'pen' ? setPenColor(c) : setHighlightColor(c)
              }
              className={`size-7 rounded-full border-2 transition focus-visible:outline-2 focus-visible:outline-indigo-500 ${
                activeColor === c
                  ? 'border-indigo-600 ring-2 ring-white dark:ring-slate-900'
                  : 'border-transparent'
              }`}
              style={{ backgroundColor: c }}
            />
          ))}
        {tool !== 'eraser' &&
          SIZES.map((s, i) => (
            <button
              key={s}
              type="button"
              aria-label={['เส้นเล็ก', 'เส้นกลาง', 'เส้นใหญ่'][i]}
              aria-pressed={size === i}
              onClick={() => setSize(i)}
              className={`${chip} ${chipState(size === i)} flex size-8 items-center justify-center !p-0`}
            >
              <span
                className="rounded-full bg-current"
                style={{ width: 3 + i * 3, height: 3 + i * 3 }}
              />
            </button>
          ))}
        <span
          className="mx-1 h-6 w-px bg-slate-300 dark:bg-slate-600"
          aria-hidden
        />
        <button
          type="button"
          className={`${chip} ${chipState(false)} disabled:opacity-40`}
          onClick={undo}
          disabled={!history.undo.length}
        >
          เลิกทำ
        </button>
        <button
          type="button"
          className={`${chip} ${chipState(false)} disabled:opacity-40`}
          onClick={redo}
          disabled={!history.redo.length}
        >
          ทำซ้ำ
        </button>
        <button
          type="button"
          className={`${chip} ${clearArmed ? 'bg-red-600 text-white' : chipState(false)} disabled:opacity-40`}
          onClick={clear}
          disabled={!strokes.length}
        >
          {clearArmed ? 'แตะอีกครั้งเพื่อล้าง' : 'ล้างหน้า'}
        </button>
        <label className="ml-auto flex items-center gap-2 px-2 text-sm text-slate-700 dark:text-slate-200">
          <input
            id="finger-draw"
            type="checkbox"
            className="size-4 accent-indigo-600"
            checked={fingerDraws}
            onChange={(e) => setFingerDraws(e.target.checked)}
          />
          เขียนด้วยนิ้ว
        </label>
      </div>
      <canvas
        ref={canvasRef}
        aria-label="หน้าเขียนด้วยลายมือ"
        className="ink-paper ink-dots aspect-[4/5] w-full touch-none rounded-lg border border-slate-300 shadow-sm select-none [-webkit-touch-callout:none] [-webkit-user-select:none] dark:border-slate-600"
        onPointerDown={onPointerDown}
        onPointerMove={onPointerMove}
        onPointerUp={onPointerEnd}
        onPointerCancel={onPointerEnd}
        onContextMenu={(e) => e.preventDefault()}
      />
    </div>
  )
}
