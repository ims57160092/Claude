import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { DayView } from './DayView'
import { emptyEntry, getEntry, saveEntry } from '../lib/storage'

vi.mock('../lib/ink', async (importOriginal) => ({
  ...(await importOriginal<typeof import('../lib/ink')>()),
  renderStrokesToPng: async () => new Blob(['png'], { type: 'image/png' }),
}))

const DATE = '2026-10-13'
const stroke = {
  tool: 'pen' as const,
  color: '#000',
  width: 4,
  points: [[10, 10, 0.5] as [number, number, number]],
}

function installSample(json: ReturnType<typeof vi.fn>, images = true) {
  const sample = {
    json,
    limits: async () => (images ? { images: { maxCount: 4 } } : {}),
  }
  ;(window as unknown as { claude?: unknown }).claude = {
    use: async () => sample,
  }
}

afterEach(() => {
  delete (window as unknown as { claude?: unknown }).claude
})

describe('HandwritingToText', () => {
  it('is hidden outside a claude.ai Artifact', async () => {
    await saveEntry({ ...emptyEntry(DATE), strokes: [stroke] })
    render(<DayView date={DATE} onPickDate={() => {}} />)
    await screen.findByLabelText('หน้าเขียนด้วยลายมือ')
    expect(
      screen.queryByRole('button', { name: 'แปลงลายมือเป็นข้อความ' }),
    ).not.toBeInTheDocument()
  })

  it('is hidden when the Artifact cannot send images', async () => {
    installSample(vi.fn(), false)
    await saveEntry({ ...emptyEntry(DATE), strokes: [stroke] })
    render(<DayView date={DATE} onPickDate={() => {}} />)
    await screen.findByLabelText('หน้าเขียนด้วยลายมือ')
    await new Promise((r) => setTimeout(r, 0))
    expect(
      screen.queryByRole('button', { name: 'แปลงลายมือเป็นข้อความ' }),
    ).not.toBeInTheDocument()
  })

  it('reads the handwriting and appends the edited text to the note', async () => {
    const json = vi.fn(async () => ({ lines: ['ซื้อนม', 'โทรหาแม่'] }))
    installSample(json)
    await saveEntry({
      ...emptyEntry(DATE),
      text: 'โน้ตเดิม',
      strokes: [stroke],
    })
    const user = userEvent.setup()
    render(<DayView date={DATE} onPickDate={() => {}} />)

    await user.click(
      await screen.findByRole('button', { name: 'แปลงลายมือเป็นข้อความ' }),
    )
    const result = await screen.findByLabelText(
      'ข้อความที่อ่านได้ (แก้ไขก่อนเพิ่มได้)',
    )
    expect(result).toHaveValue('ซื้อนม\nโทรหาแม่')
    const [, options] = json.mock.calls[0] as unknown as [
      string,
      { images: Blob[] },
    ]
    expect(options.images).toHaveLength(1)

    await user.type(result, ' ด่วน')
    await user.click(screen.getByRole('button', { name: 'เพิ่มลงโน้ต' }))
    expect(screen.getByRole('textbox', { name: 'โน้ต' })).toHaveValue(
      'โน้ตเดิม\nซื้อนม\nโทรหาแม่ ด่วน',
    )
  })

  it('shows a message when nothing readable was found', async () => {
    installSample(vi.fn(async () => ({ lines: [] })))
    await saveEntry({ ...emptyEntry(DATE), strokes: [stroke] })
    const user = userEvent.setup()
    render(<DayView date={DATE} onPickDate={() => {}} />)
    await user.click(
      await screen.findByRole('button', { name: 'แปลงลายมือเป็นข้อความ' }),
    )
    expect(await screen.findByRole('alert')).toHaveTextContent(
      'ไม่พบตัวหนังสือ',
    )
  })

  it('hides itself when the viewer declines', async () => {
    installSample(
      vi.fn(async () => Promise.reject({ code: 'not_granted', message: 'no' })),
    )
    await saveEntry({ ...emptyEntry(DATE), strokes: [stroke] })
    const user = userEvent.setup()
    render(<DayView date={DATE} onPickDate={() => {}} />)
    await user.click(
      await screen.findByRole('button', { name: 'แปลงลายมือเป็นข้อความ' }),
    )
    await screen.findByLabelText('หน้าเขียนด้วยลายมือ')
    await new Promise((r) => setTimeout(r, 0))
    expect(
      screen.queryByRole('button', { name: 'แปลงลายมือเป็นข้อความ' }),
    ).not.toBeInTheDocument()
    expect(await getEntry(DATE)).toBeDefined()
  })
})
