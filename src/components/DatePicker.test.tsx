import { render, screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import App from '../App'
import {
  addMonths,
  formatLong,
  formatMonth,
  formatWeek,
  fromKey,
  todayKey,
} from '../lib/date'

beforeEach(() => localStorage.clear())

const today = fromKey(todayKey())
const firstOfNextMonth = new Date(today.getFullYear(), today.getMonth() + 1, 1)

async function openPicker(user: ReturnType<typeof userEvent.setup>) {
  await user.click(screen.getByRole('button', { name: /^DATE/ }))
  return screen.getByRole('dialog', { name: 'เลือกวันที่' })
}

describe('DatePicker', () => {
  it('jumps the day view to a day in another month', async () => {
    const user = userEvent.setup()
    render(<App />)
    await user.click(screen.getByRole('button', { name: 'วัน' }))
    const picker = await openPicker(user)

    await user.click(within(picker).getByRole('button', { name: 'เดือนถัดไป' }))
    await user.click(
      within(picker).getByRole('button', {
        name: formatLong(firstOfNextMonth),
      }),
    )

    expect(screen.queryByRole('dialog')).not.toBeInTheDocument()
    expect(await screen.findByRole('heading', { level: 1 })).toHaveTextContent(
      formatLong(firstOfNextMonth),
    )
  })

  it('moves the week view to the week of the picked day', async () => {
    const user = userEvent.setup()
    render(<App />)
    await user.click(screen.getByRole('button', { name: 'สัปดาห์' }))
    const picker = await openPicker(user)
    await user.click(within(picker).getByRole('button', { name: 'เดือนถัดไป' }))
    await user.click(
      within(picker).getByRole('button', {
        name: formatLong(firstOfNextMonth),
      }),
    )
    expect(screen.getByRole('heading', { level: 1 })).toHaveTextContent(
      formatWeek(firstOfNextMonth),
    )
  })

  it('picks a month in the month view, across years', async () => {
    const user = userEvent.setup()
    render(<App />)
    await user.click(screen.getByRole('button', { name: 'เดือน' }))
    const picker = await openPicker(user)

    await user.click(within(picker).getByRole('button', { name: 'ปีถัดไป' }))
    const target = addMonths(new Date(today.getFullYear(), 0, 1), 12 + 2) // March next year
    await user.click(
      within(picker).getByRole('button', { name: formatMonth(target) }),
    )
    expect(screen.getByRole('heading', { level: 1 })).toHaveTextContent(
      formatMonth(target),
    )
  })

  it('closes on Escape and on a tap outside, without changing the date', async () => {
    const user = userEvent.setup()
    render(<App />)
    await user.click(screen.getByRole('button', { name: 'วัน' }))
    const heading = screen.getByRole('heading', { level: 1 }).textContent

    await openPicker(user)
    await user.keyboard('{Escape}')
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument()
    expect(screen.getByRole('button', { name: /^DATE/ })).toHaveFocus()

    await openPicker(user)
    await user.click(document.body)
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument()
    expect(screen.getByRole('heading', { level: 1 }).textContent).toBe(heading)
  })
})
