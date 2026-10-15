import { emptyEntry } from './storage'
import { summarize } from './summary'

const task = (done: boolean) => ({
  id: String(Math.random()),
  text: 'x',
  done,
  time: '',
})

describe('summarize', () => {
  it('counts tasks and days with notes', () => {
    const s = summarize([
      { ...emptyEntry('2026-10-01'), tasks: [task(true), task(false)] },
      { ...emptyEntry('2026-10-02'), text: 'note' },
      {
        ...emptyEntry('2026-10-03'),
        tasks: [task(true)],
        strokes: [
          { tool: 'pen', color: '#000', width: 4, points: [[1, 1, 0.5]] },
        ],
      },
      { ...emptyEntry('2026-10-04'), text: '   ' },
    ])
    expect(s).toEqual({ total: 3, done: 2, open: 1, daysWithNotes: 2 })
  })

  it('is all zero for no entries', () => {
    expect(summarize([])).toEqual({
      total: 0,
      done: 0,
      open: 0,
      daysWithNotes: 0,
    })
  })
})
