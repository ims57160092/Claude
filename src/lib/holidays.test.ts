import { DEFAULT_BANK_HOLIDAYS, parseHoliday } from './holidays'

describe('holidays', () => {
  it('has one valid, named default per date', () => {
    const dates = DEFAULT_BANK_HOLIDAYS.map((h) => h.date)
    expect(new Set(dates).size).toBe(dates.length)
    for (const h of DEFAULT_BANK_HOLIDAYS) {
      expect(parseHoliday(h)).toEqual(h)
    }
  })

  it('rejects malformed holidays and trims names', () => {
    expect(parseHoliday({ date: '2026-1-1', name: 'x' })).toBeNull()
    expect(parseHoliday({ date: '2026-01-01', name: '   ' })).toBeNull()
    expect(parseHoliday('nope')).toBeNull()
    expect(
      parseHoliday({ date: '2026-01-01', name: ' ปีใหม่ ', note: ' ' }),
    ).toEqual({
      date: '2026-01-01',
      name: 'ปีใหม่',
    })
  })
})
