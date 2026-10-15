import { emptyEntry } from './storage'
import { buildIcs, escapeText, foldLine } from './ics'

const now = new Date(Date.UTC(2026, 9, 15, 6, 0, 0))
const include = { tasks: true, leave: true, holidays: true }

describe('ics', () => {
  it('escapes text and folds long lines at 75 octets', () => {
    expect(escapeText('a,b;c\\d\ne')).toBe('a\\,b\\;c\\\\d\\ne')
    const long = `SUMMARY:${'ประชุม'.repeat(20)}`
    const folded = foldLine(long)
    const enc = new TextEncoder()
    for (const [i, line] of folded.split('\r\n').entries()) {
      expect(enc.encode(line).length).toBeLessThanOrEqual(75)
      if (i > 0) expect(line.startsWith(' ')).toBe(true)
    }
    expect(folded.replace(/\r\n /g, '')).toBe(long)
  })

  it('exports timed and all-day tasks, leave and holidays in range', () => {
    const { text, count } = buildIcs({
      entries: [
        {
          ...emptyEntry('2026-10-21'),
          tasks: [
            { id: 'a', text: 'ประชุม, ทีม', done: false, time: '10:30' },
            { id: 'b', text: 'ซื้อของ', done: true, time: '' },
          ],
        },
        {
          ...emptyEntry('2026-12-01'),
          tasks: [{ id: 'c', text: 'นอกช่วง', done: false, time: '' }],
        },
      ],
      leaves: [{ date: '2026-10-22', type: 'sick', note: 'ไข้' }],
      holidays: [{ date: '2026-10-23', name: 'วันปิยมหาราช' }],
      from: '2026-10-01',
      to: '2026-10-31',
      include,
      now,
    })
    expect(count).toBe(4)
    const unfolded = text.replace(/\r\n /g, '')
    expect(text.startsWith('BEGIN:VCALENDAR\r\n')).toBe(true)
    expect(text.endsWith('END:VCALENDAR\r\n')).toBe(true)
    expect(unfolded).toContain(
      'UID:task-a@planner\r\nDTSTAMP:20261015T060000Z\r\nDTSTART:20261021T103000\r\nDTEND:20261021T113000\r\nSUMMARY:ประชุม\\, ทีม',
    )
    expect(unfolded).toContain(
      'DTSTART;VALUE=DATE:20261021\r\nDTEND;VALUE=DATE:20261022\r\nSUMMARY:✓ ซื้อของ',
    )
    expect(unfolded).toContain('UID:leave-2026-10-22@planner')
    expect(unfolded).toContain('SUMMARY:ลาป่วย\r\nDESCRIPTION:ไข้')
    expect(unfolded).toContain('SUMMARY:วันหยุดธนาคาร: วันปิยมหาราช')
    expect(unfolded).not.toContain('นอกช่วง')
  })

  it('leaves out kinds that are switched off', () => {
    const { text, count } = buildIcs({
      entries: [],
      leaves: [{ date: '2026-10-22', type: 'vacation' }],
      holidays: [{ date: '2026-10-23', name: 'วันปิยมหาราช' }],
      include: { tasks: true, leave: true, holidays: false },
      now,
    })
    expect(count).toBe(1)
    expect(text).not.toContain('วันปิยมหาราช')
  })
})
