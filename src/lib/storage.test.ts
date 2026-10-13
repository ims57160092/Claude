import {
  emptyEntry,
  exportBackup,
  getEntries,
  getEntry,
  importBackup,
  saveEntry,
  subscribe,
} from './storage'

const task = { id: 't1', text: 'ส่งรายงาน', done: false, time: '09:30' }

describe('storage', () => {
  it('saves and reads a day', async () => {
    await saveEntry({ ...emptyEntry('2026-10-13'), tasks: [task] })
    const e = await getEntry('2026-10-13')
    expect(e?.tasks).toEqual([task])
    expect(e?.updatedAt).toBeGreaterThan(0)
  })

  it('deletes a day once it is empty', async () => {
    await saveEntry({ ...emptyEntry('2026-10-13'), text: 'note' })
    await saveEntry(emptyEntry('2026-10-13'))
    expect(await getEntry('2026-10-13')).toBeUndefined()
  })

  it('reads a date range inclusively', async () => {
    for (const d of ['2026-10-11', '2026-10-12', '2026-10-18', '2026-10-19']) {
      await saveEntry({ ...emptyEntry(d), text: d })
    }
    const list = await getEntries('2026-10-12', '2026-10-18')
    expect(list.map((e) => e.date)).toEqual(['2026-10-12', '2026-10-18'])
  })

  it('notifies subscribers after a save', async () => {
    const fn = vi.fn()
    const unsubscribe = subscribe(fn)
    await saveEntry({ ...emptyEntry('2026-10-13'), text: 'x' })
    unsubscribe()
    expect(fn).toHaveBeenCalledTimes(1)
  })

  it('round-trips a backup and rejects other files', async () => {
    await saveEntry({
      ...emptyEntry('2026-10-13'),
      tasks: [task],
      strokes: [
        { tool: 'pen', color: '#000', width: 4, points: [[1, 2, 0.5]] },
      ],
    })
    const backup = JSON.parse(JSON.stringify(await exportBackup()))
    globalThis.indexedDB = new (await import('fake-indexeddb')).IDBFactory()
    ;(await import('./storage')).resetConnection()

    expect(await importBackup(backup)).toBe(1)
    expect((await getEntry('2026-10-13'))?.strokes[0].points).toEqual([
      [1, 2, 0.5],
    ])
    await expect(importBackup({ hello: 'world' })).rejects.toThrow(
      'ไม่ใช่ไฟล์สำรอง',
    )
  })
})
