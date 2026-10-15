import { render, screen, within } from '@testing-library/react'
import { MonthView } from './MonthView'
import { emptyEntry, saveEntry } from '../lib/storage'

const task = (done: boolean) => ({
  id: String(Math.random()),
  text: 'งาน',
  done,
  time: '',
})

describe('MonthView summary card', () => {
  it("counts only the month's own days", async () => {
    await saveEntry({
      ...emptyEntry('2026-10-03'),
      tasks: [task(true), task(false)],
    })
    await saveEntry({
      ...emptyEntry('2026-10-20'),
      tasks: [task(false)],
      text: 'โน้ต',
    })
    // 28 Sep is shown in October's grid but belongs to September.
    await saveEntry({
      ...emptyEntry('2026-09-28'),
      tasks: [task(true)],
      text: 'ก.ย.',
    })

    render(<MonthView date="2026-10-15" onOpenDay={() => {}} />)
    const card = await screen.findByRole('complementary', {
      name: 'สรุปเดือนนี้',
    })
    const bar = await within(card).findByRole('progressbar')
    expect(bar).toHaveAttribute('aria-valuenow', '1')
    expect(bar).toHaveAttribute('aria-valuemax', '3')
    expect(within(card).getByText('งานค้าง').nextSibling).toHaveTextContent('2')
    expect(
      within(card).getByText('วันที่มีโน้ต').nextSibling,
    ).toHaveTextContent('1')
  })

  it('invites adding tasks when the month is empty', async () => {
    render(<MonthView date="2026-10-15" onOpenDay={() => {}} />)
    const card = await screen.findByRole('complementary', {
      name: 'สรุปเดือนนี้',
    })
    expect(card).toHaveTextContent('ยังไม่มีงานในเดือนนี้')
  })
})
