import { render, screen, waitFor, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { BackupMenu } from './BackupMenu'
import { emptyEntry, saveEntry, saveLeaves } from '../lib/storage'

const setClaude = (value: unknown) => {
  ;(window as unknown as { claude?: unknown }).claude = value
}

afterEach(() => {
  setClaude(undefined)
  vi.restoreAllMocks()
})

async function seed() {
  await saveEntry({
    ...emptyEntry('2026-10-21'),
    tasks: [{ id: 't1', text: 'ประชุม', done: false, time: '09:00' }],
  })
  await saveLeaves([{ date: '2026-10-22', type: 'vacation' }])
}

describe('calendar export', () => {
  it('downloads an .ics of the month on a normal website', async () => {
    await seed()
    const blobs: Blob[] = []
    URL.createObjectURL = vi.fn((b: Blob) => {
      blobs.push(b)
      return 'blob:x'
    }) as typeof URL.createObjectURL
    URL.revokeObjectURL = vi.fn()
    const click = vi
      .spyOn(HTMLAnchorElement.prototype, 'click')
      .mockImplementation(() => {})
    const onMessage = vi.fn()
    const user = userEvent.setup()
    render(<BackupMenu date="2026-10-15" onMessage={onMessage} />)

    await user.click(screen.getByRole('button', { name: 'ปฏิทิน Apple' }))
    const dialog = screen.getByRole('dialog', { name: 'ส่งออกไปปฏิทิน Apple' })
    await within(dialog).findByText('2 รายการ')
    await user.click(within(dialog).getByLabelText('วันลา'))
    await within(dialog).findByText('1 รายการ')
    await user.click(
      within(dialog).getByRole('button', { name: 'ส่งออก .ics' }),
    )

    expect(click).toHaveBeenCalled()
    const text = await blobs[0].text()
    expect(text).toContain('BEGIN:VCALENDAR')
    expect(text).toContain('SUMMARY:ประชุม')
    expect(text).not.toContain('ลาพักร้อน')
    expect(onMessage).toHaveBeenCalledWith(
      'ส่งออก 1 รายการแล้ว เปิดไฟล์เพื่อเพิ่มลงปฏิทิน',
    )
  })

  it('explains that .ics cannot be saved inside claude.ai', async () => {
    await seed()
    setClaude({ use: async () => null })
    const user = userEvent.setup()
    render(<BackupMenu date="2026-10-15" onMessage={() => {}} />)
    await user.click(screen.getByRole('button', { name: 'ปฏิทิน Apple' }))
    const dialog = screen.getByRole('dialog', { name: 'ส่งออกไปปฏิทิน Apple' })
    expect(within(dialog).getByRole('note')).toHaveTextContent(
      'ไม่อนุญาตให้บันทึกไฟล์ .ics',
    )
    expect(
      within(dialog).getByRole('button', { name: 'ส่งออก .ics' }),
    ).toBeDisabled()
  })

  it('saves the JSON backup through claude.ai downloads', async () => {
    await seed()
    const save = vi.fn(async () => ({ status: 'saved' }))
    setClaude({ use: async () => ({ save }) })
    const onMessage = vi.fn()
    const user = userEvent.setup()
    render(<BackupMenu date="2026-10-15" onMessage={onMessage} />)
    await user.click(screen.getByRole('button', { name: 'สำรองข้อมูล' }))
    await waitFor(() => expect(save).toHaveBeenCalled())
    const [{ filename, data }] = save.mock.calls[0] as unknown as [
      { filename: string; data: string },
    ]
    expect(filename).toMatch(/^planner-\d{4}-\d{2}-\d{2}\.json$/)
    expect(JSON.parse(data).leaves).toEqual([
      { date: '2026-10-22', type: 'vacation' },
    ])
    expect(onMessage).toHaveBeenCalledWith('บันทึกไฟล์สำรอง 1 วันแล้ว')
  })
})
