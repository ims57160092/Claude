import { INK_HEIGHT, INK_WIDTH, type Stroke } from '../lib/storage'

/** A small read-only preview of a day's handwriting. */
export function MiniInk({
  strokes,
  className = '',
}: {
  strokes: Stroke[]
  className?: string
}) {
  return (
    <svg
      viewBox={`0 0 ${INK_WIDTH} ${INK_HEIGHT}`}
      preserveAspectRatio="xMidYMin meet"
      className={`ink-paper rounded border border-stone-200 ${className}`}
      aria-label="ตัวอย่างลายมือ"
      role="img"
    >
      {strokes.map((s, i) => (
        <polyline
          key={i}
          points={s.points.map(([x, y]) => `${x},${y}`).join(' ')}
          fill="none"
          stroke={s.color}
          strokeWidth={s.tool === 'highlighter' ? s.width : s.width * 1.6}
          strokeOpacity={s.tool === 'highlighter' ? 0.35 : 1}
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      ))}
    </svg>
  )
}
