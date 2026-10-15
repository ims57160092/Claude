import {
  addMonths,
  fromKey,
  monthGrid,
  startOfWeek,
  toKey,
  weekDays,
} from './date'

describe('date helpers', () => {
  it('round-trips date keys in local time', () => {
    expect(toKey(fromKey('2026-03-09'))).toBe('2026-03-09')
  })

  it('starts weeks on Monday', () => {
    expect(toKey(startOfWeek(fromKey('2026-10-13')))).toBe('2026-10-12') // Tuesday -> Monday
    expect(toKey(startOfWeek(fromKey('2026-10-18')))).toBe('2026-10-12') // Sunday -> Monday
    expect(weekDays(fromKey('2026-10-13')).map(toKey).at(-1)).toBe('2026-10-18')
  })

  it('clamps the day when moving between months', () => {
    expect(toKey(addMonths(fromKey('2026-01-31'), 1))).toBe('2026-02-28')
    expect(toKey(addMonths(fromKey('2028-01-31'), 1))).toBe('2028-02-29')
    expect(toKey(addMonths(fromKey('2026-01-15'), -1))).toBe('2025-12-15')
  })

  it('builds whole weeks that cover the month', () => {
    const grid = monthGrid(fromKey('2026-10-13'))
    expect(grid.length % 7).toBe(0)
    expect(toKey(grid[0])).toBe('2026-09-28')
    expect(grid.map(toKey)).toContain('2026-10-31')
    expect(toKey(grid.at(-1)!)).toBe('2026-11-01')
  })
})
