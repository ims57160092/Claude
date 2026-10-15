import { fireEvent, render, screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MonthView } from './MonthView'

function renderOctober() {
  return render(
    <MonthView date="2026-10-15" onOpenDay={() => {}} onPickDate={() => {}} />,
  )
}

async function openManager(user: ReturnType<typeof userEvent.setup>) {
  await user.click(screen.getByRole('button', { name: 'วันหยุดธนาคาร' }))
  return screen.getByRole('dialog', { name: /วันหยุดธนาคาร/ })
}

describe('bank holidays', () => {
  it('shows bank holidays on the calendar', async () => {
    renderOctober()
    expect(
      await screen.findByRole('button', { name: /^23 วันปิยมหาราช/ }),
    ).toBeInTheDocument()
  })

  it('deletes a holiday, undoes it, and adds one of your own', async () => {
    const user = userEvent.setup()
    renderOctober()
    await screen.findByRole('button', { name: /^23 วันปิยมหาราช/ })
    const dialog = await openManager(user)

    await user.click(
      within(dialog).getByRole('button', { name: /^ลบ วันปิยมหาราช/ }),
    )
    expect(
      await screen.findByRole('button', { name: /^23$/ }),
    ).toBeInTheDocument()

    await user.click(within(dialog).getByRole('button', { name: 'เลิกทำ' }))
    expect(
      await screen.findByRole('button', { name: /^23 วันปิยมหาราช/ }),
    ).toBeInTheDocument()

    fireEvent.change(within(dialog).getByLabelText('วันที่'), {
      target: { value: '2026-10-30' },
    })
    await user.type(within(dialog).getByLabelText('ชื่อวันหยุด'), 'ลาพักร้อน')
    await user.click(within(dialog).getByRole('button', { name: 'เพิ่ม' }))
    expect(await within(dialog).findByText('ลาพักร้อน')).toBeInTheDocument()
    expect(
      await screen.findByRole('button', { name: /^30 ลาพักร้อน/ }),
    ).toBeInTheDocument()
  })

  it('says when a year has no holidays yet, and closes on Escape', async () => {
    const user = userEvent.setup()
    renderOctober()
    const dialog = await openManager(user)
    await user.click(within(dialog).getByRole('button', { name: 'ปีถัดไป' }))
    expect(dialog).toHaveTextContent('ยังไม่มีวันหยุดธนาคารปี')
    expect(
      within(dialog).queryByRole('button', { name: 'คืนค่าวันหยุดตามประกาศ' }),
    ).not.toBeInTheDocument()

    await user.keyboard('{Escape}')
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument()
  })
})
