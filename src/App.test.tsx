import { fireEvent, render, screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import App from './App'

beforeEach(() => localStorage.clear())

describe('App', () => {
  it('adds a task in day view and shows it in the week view', async () => {
    const user = userEvent.setup()
    render(<App />)

    await user.click(screen.getByRole('button', { name: 'วัน' }))
    await user.type(
      await screen.findByRole('textbox', { name: 'งานใหม่' }),
      'ซื้อของ',
    )
    await user.click(screen.getByRole('button', { name: 'เพิ่ม' }))
    expect(screen.getByLabelText('ซื้อของ')).not.toBeChecked()

    // Switching views flushes the pending save.
    await user.click(screen.getByRole('button', { name: 'สัปดาห์' }))
    expect(await screen.findByLabelText('ซื้อของ')).toBeInTheDocument()
  })

  it('shows the handwriting page with its tools', async () => {
    const user = userEvent.setup()
    render(<App />)
    await user.click(screen.getByRole('button', { name: 'วัน' }))
    const toolbar = await screen.findByRole('toolbar', {
      name: 'เครื่องมือเขียน',
    })
    expect(
      within(toolbar).getByRole('button', { name: 'ปากกา' }),
    ).toHaveAttribute('aria-pressed', 'true')
    expect(screen.getByLabelText('หน้าเขียนด้วยลายมือ')).toBeInTheDocument()
  })

  it('stops the page from scrolling while writing on the canvas', async () => {
    const user = userEvent.setup()
    render(<App />)
    await user.click(screen.getByRole('button', { name: 'วัน' }))
    const canvas = await screen.findByLabelText('หน้าเขียนด้วยลายมือ')
    // fireEvent returns false when a listener called preventDefault().
    expect(fireEvent.touchStart(canvas)).toBe(false)
    expect(fireEvent.touchMove(canvas)).toBe(false)
  })

  it('clears the time of a new task with its own button', async () => {
    const user = userEvent.setup()
    render(<App />)
    await user.click(screen.getByRole('button', { name: 'วัน' }))
    const time = await screen.findByLabelText('เวลา (ไม่บังคับ)')
    expect(
      screen.queryByRole('button', { name: 'ล้างเวลา' }),
    ).not.toBeInTheDocument()

    fireEvent.change(time, { target: { value: '09:30' } })
    await user.click(screen.getByRole('button', { name: 'ล้างเวลา' }))
    expect(time).toHaveValue('')

    await user.type(
      screen.getByRole('textbox', { name: 'งานใหม่' }),
      'ไม่มีเวลา',
    )
    await user.click(screen.getByRole('button', { name: 'เพิ่ม' }))
    expect(
      screen.getByLabelText('ไม่มีเวลา').closest('li'),
    ).not.toHaveTextContent('09:30')
  })

  it('opens a day from the month view', async () => {
    const user = userEvent.setup()
    render(<App />)
    await user.click(screen.getByRole('button', { name: 'เดือน' }))
    await user.click(screen.getAllByRole('button', { name: /^15/ })[0])
    expect(
      await screen.findByRole('heading', { name: /15/ }),
    ).toBeInTheDocument()
  })
})
