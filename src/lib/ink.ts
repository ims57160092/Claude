import { INK_HEIGHT, INK_WIDTH, type Stroke } from './storage'

export function drawStroke(ctx: CanvasRenderingContext2D, s: Stroke) {
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

const PADDING = 24
/** Claude downsizes images to about this many pixels, so render up to it. */
const TARGET_PIXELS = 1_200_000
const MAX_SCALE = 4

/**
 * Draws the strokes as a PNG on white, cropped to the writing with a small
 * margin and scaled up so small marks (such as Thai tone marks) stay
 * legible. Resolves null when there is nothing to draw or the browser cannot
 * render it.
 */
export function renderStrokesToPng(strokes: Stroke[]): Promise<Blob | null> {
  const points = strokes.flatMap((s) => s.points)
  if (points.length === 0) return Promise.resolve(null)
  const xs = points.map((p) => p[0])
  const ys = points.map((p) => p[1])
  const left = Math.max(0, Math.min(...xs) - PADDING)
  const top = Math.max(0, Math.min(...ys) - PADDING)
  const width = Math.max(
    1,
    Math.min(INK_WIDTH, Math.max(...xs) + PADDING) - left,
  )
  const height = Math.max(
    1,
    Math.min(INK_HEIGHT, Math.max(...ys) + PADDING) - top,
  )
  const scale = Math.min(MAX_SCALE, Math.sqrt(TARGET_PIXELS / (width * height)))

  const canvas = document.createElement('canvas')
  canvas.width = Math.ceil(width * scale)
  canvas.height = Math.ceil(height * scale)
  const ctx = canvas.getContext('2d')
  if (!ctx) return Promise.resolve(null)
  ctx.fillStyle = '#ffffff'
  ctx.fillRect(0, 0, canvas.width, canvas.height)
  ctx.scale(scale, scale)
  ctx.translate(-left, -top)
  for (const s of strokes) drawStroke(ctx, s)
  return new Promise((resolve) => canvas.toBlob(resolve, 'image/png'))
}
