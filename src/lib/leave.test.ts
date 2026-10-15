import { countLeave, parseLeave, workingDays } from './leave'

describe('leave', () => {
  it('counts only working days, skipping weekends and holidays', () => {
    // Mon 12 Oct 2026 to Mon 19 Oct 2026; 16 Oct is a holiday.
    expect(
      workingDays('2026-10-12', '2026-10-19', new Set(['2026-10-16'])),
    ).toEqual([
      '2026-10-12',
      '2026-10-13',
      '2026-10-14',
      '2026-10-15',
      '2026-10-19',
    ])
    expect(workingDays('2026-10-19', '2026-10-19', new Set())).toEqual([
      '2026-10-19',
    ])
    expect(workingDays('2026-10-17', '2026-10-18', new Set())).toEqual([])
    // Either order works.
    expect(workingDays('2026-10-13', '2026-10-12', new Set())).toEqual([
      '2026-10-12',
      '2026-10-13',
    ])
  })

  it('counts leave by type within a year', () => {
    const counts = countLeave(
      [
        { date: '2026-03-02', type: 'vacation' },
        { date: '2026-03-03', type: 'vacation' },
        { date: '2026-05-20', type: 'sick' },
        { date: '2025-12-30', type: 'vacation' },
      ],
      2026,
    )
    expect(counts).toEqual({ vacation: 2, sick: 1, personal: 0, other: 0 })
  })

  it('parses leave from backups', () => {
    expect(
      parseLeave({ date: '2026-01-05', type: 'sick', note: ' ไข้ ' }),
    ).toEqual({
      date: '2026-01-05',
      type: 'sick',
      note: 'ไข้',
    })
    expect(parseLeave({ date: '2026-01-05', type: 'unknown' })?.type).toBe(
      'other',
    )
    expect(parseLeave({ date: 'x', type: 'sick' })).toBeNull()
  })
})
