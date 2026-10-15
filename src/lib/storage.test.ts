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

describe('bank holidays', () => {
  it('seeds the announced bank holidays on first use', async () => {
    const { getHolidays } = await import('./storage')
    const holidays = await getHolidays()
    expect(holidays.find((h) => h.date === '2026-05-01')?.name).toBe(
      'วันแรงงานแห่งชาติ',
    )
    // Government-only days are not bank holidays.
    expect(holidays.find((h) => h.date === '2026-05-13')).toBeUndefined()
  })

  it('adds, replaces and deletes holidays, and restores the defaults', async () => {
    const { getHolidays, saveHoliday, deleteHoliday, restoreDefaultHolidays } =
      await import('./storage')
    await saveHoliday({ date: '2026-11-20', name: 'ลาพักร้อน' })
    await saveHoliday({ date: '2026-11-20', name: 'ลาพักร้อนต่อ' })
    await deleteHoliday('2026-08-12')
    let list = await getHolidays()
    expect(list.filter((h) => h.date === '2026-11-20')).toEqual([
      { date: '2026-11-20', name: 'ลาพักร้อนต่อ' },
    ])
    expect(list.find((h) => h.date === '2026-08-12')).toBeUndefined()

    // A fresh connection must not bring a deleted default back...
    ;(await import('./storage')).resetConnection()
    list = await getHolidays()
    expect(list.find((h) => h.date === '2026-08-12')).toBeUndefined()

    // ...but restoring does, and keeps the user's own.
    await restoreDefaultHolidays()
    list = await getHolidays()
    expect(list.find((h) => h.date === '2026-08-12')).toBeDefined()
    expect(list.find((h) => h.date === '2026-11-20')).toBeDefined()
  })

  it('includes holidays in backups', async () => {
    const { saveHoliday, deleteHoliday, getHolidays } =
      await import('./storage')
    await saveHoliday({ date: '2027-01-01', name: 'วันขึ้นปีใหม่' })
    const backup = JSON.parse(JSON.stringify(await exportBackup()))
    await deleteHoliday('2027-01-01')
    await importBackup(backup)
    expect(
      (await getHolidays()).find((h) => h.date === '2027-01-01')?.name,
    ).toBe('วันขึ้นปีใหม่')
  })
})

describe('yearsToSeed', () => {
  it('returns only years not added before', async () => {
    const { yearsToSeed } = await import('./storage')
    const defaults = [
      { date: '2026-01-01', name: 'a' },
      { date: '2026-05-01', name: 'b' },
      { date: '2027-01-01', name: 'c' },
    ]
    expect(yearsToSeed(defaults, [])).toEqual([2026, 2027])
    expect(yearsToSeed(defaults, [2026])).toEqual([2027])
    expect(yearsToSeed(defaults, [2026, 2027])).toEqual([])
  })
})
