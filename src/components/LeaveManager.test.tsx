import {
  fireEvent,
  render,
  screen,
  waitFor,
  within,
} from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { DayView } from './DayView'
import { MonthView } from './MonthView'

describe('leave', () => {
  it('books a range of working days and shows it on the month', async () => {
    const user = userEvent.setup()
    render(
      <MonthView
        date="2026-10-15"
        onOpenDay={() => {}}
        onPickDate={() => {}}
      />,
    )
    // Wait for the seeded bank holidays, since leave skips them.
    await screen.findByRole('button', { name: /^16 วันหยุดพิเศษ/ })

    await user.click(screen.getByRole('button', { name: 'วันลา' }))
    const dialog = screen.getByRole('dialog', { name: /วันลา/ })
    await user.click(within(dialog).getByRole('button', { name: 'ลาป่วย' }))
    fireEvent.change(within(dialog).getByLabelText('ลาตั้งแต่'), {
      target: { value: '2026-10-12' },
    })
    fireEvent.change(within(dialog).getByLabelText('ลาถึง'), {
      target: { value: '2026-10-19' },
    })

    // Mon 12 – Mon 19 Oct: 6 weekdays, minus the 13 and 16 Oct bank holidays.
    await user.click(within(dialog).getByRole('button', { name: 'ลง 4 วัน' }))
    await waitFor(() =>
      expect(
        within(dialog).getByText('ลาป่วย', { selector: 'dt' }).nextSibling,
      ).toHaveTextContent('4'),
    )

    expect(
      await screen.findByRole('button', { name: /^12 ลาป่วย/ }),
    ).toBeInTheDocument()
    expect(
      screen.getByRole('button', { name: /^16 วันหยุดพิเศษ$/ }),
    ).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /^17$/ })).toBeInTheDocument()
    const card = screen.getByRole('complementary', { name: 'สรุปเดือนนี้' })
    expect(within(card).getByText('วันลา').nextSibling).toHaveTextContent('4')

    await user.click(
      within(dialog).getAllByRole('button', { name: /^ลบลาป่วย/ })[0],
    )
    await user.click(within(dialog).getByRole('button', { name: 'เลิกทำ' }))
    await waitFor(() =>
      expect(
        within(dialog).getByText('ลาป่วย', { selector: 'dt' }).nextSibling,
      ).toHaveTextContent('4'),
    )
  })

  it('says when a range has no working days', async () => {
    const user = userEvent.setup()
    render(
      <MonthView
        date="2026-10-15"
        onOpenDay={() => {}}
        onPickDate={() => {}}
      />,
    )
    await user.click(screen.getByRole('button', { name: 'วันลา' }))
    const dialog = screen.getByRole('dialog', { name: /วันลา/ })
    fireEvent.change(within(dialog).getByLabelText('ลาตั้งแต่'), {
      target: { value: '2026-10-17' },
    })
    fireEvent.change(within(dialog).getByLabelText('ลาถึง'), {
      target: { value: '2026-10-18' },
    })
    expect(
      within(dialog).getByRole('button', { name: 'ลง 0 วัน' }),
    ).toBeDisabled()
    expect(dialog).toHaveTextContent('ช่วงนี้ไม่มีวันทำงาน')
  })

  it('books and cancels leave from a daily page', async () => {
    const user = userEvent.setup()
    render(<DayView date="2026-11-02" onPickDate={() => {}} />)
    await user.click(await screen.findByRole('button', { name: 'ลงวันลา' }))
    const dialog = screen.getByRole('dialog', { name: /วันลา/ })
    expect(within(dialog).getByLabelText('ลาตั้งแต่')).toHaveValue('2026-11-02')
    await user.click(within(dialog).getByRole('button', { name: 'ลง 1 วัน' }))
    await user.keyboard('{Escape}')

    expect(await screen.findByText('ลาพักร้อน')).toBeInTheDocument()
    await user.click(screen.getByRole('button', { name: 'ยกเลิกวันลา' }))
    expect(
      await screen.findByRole('button', { name: 'ลงวันลา' }),
    ).toBeInTheDocument()
  })
})
