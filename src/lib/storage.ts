import type { DateKey } from './date'
import { DEFAULT_BANK_HOLIDAYS, parseHoliday, type Holiday } from './holidays'

export interface Task {
  id: string
  text: string
  done: boolean
  /** HH:MM, or '' when the task has no time. */
  time: string
}

/** x and y in page units (see INK_WIDTH / INK_HEIGHT), pressure 0–1. */
export type Point = [x: number, y: number, pressure: number]

export type InkTool = 'pen' | 'highlighter'

export interface Stroke {
  tool: InkTool
  color: string
  width: number
  points: Point[]
}

export interface DayEntry {
  date: DateKey
  tasks: Task[]
  text: string
  strokes: Stroke[]
  updatedAt: number
}

export const INK_WIDTH = 1000
export const INK_HEIGHT = 1250

export function emptyEntry(date: DateKey): DayEntry {
  return { date, tasks: [], text: '', strokes: [], updatedAt: 0 }
}

export function isEmptyEntry(e: DayEntry): boolean {
  return e.tasks.length === 0 && e.text.trim() === '' && e.strokes.length === 0
}

export function newId(): string {
  return globalThis.crypto?.randomUUID?.() ?? `${Date.now()}-${Math.random()}`
}

const DB_NAME = 'planner'
const STORE = 'days'
const HOLIDAY_STORE = 'holidays'
const META_STORE = 'meta'
const SEEDED_YEARS = 'seededHolidayYears'
let dbPromise: Promise<IDBDatabase> | null = null
const listeners = new Set<() => void>()

function openDb(): Promise<IDBDatabase> {
  dbPromise ??= new Promise((resolve, reject) => {
    const req = indexedDB.open(DB_NAME, 2)
    req.onupgradeneeded = () => {
      const db = req.result
      if (!db.objectStoreNames.contains(STORE)) {
        db.createObjectStore(STORE, { keyPath: 'date' })
      }
      if (!db.objectStoreNames.contains(HOLIDAY_STORE)) {
        db.createObjectStore(HOLIDAY_STORE, { keyPath: 'date' })
      }
      if (!db.objectStoreNames.contains(META_STORE)) {
        db.createObjectStore(META_STORE, { keyPath: 'key' })
      }
    }
    req.onsuccess = () =>
      seedHolidays(req.result).then(() => resolve(req.result), reject)
    req.onerror = () => {
      dbPromise = null
      reject(req.error)
    }
  })
  return dbPromise
}

/** Years in `defaults` that have not been added to the holiday list yet. */
export function yearsToSeed(
  defaults: readonly Holiday[],
  seeded: readonly number[],
): number[] {
  const years = new Set(defaults.map((h) => Number(h.date.slice(0, 4))))
  return [...years].filter((y) => !seeded.includes(y)).sort()
}

/**
 * Adds each year of announced bank holidays the first time the app sees it,
 * e.g. after an update that ships a new year. A year is added only once, so
 * days the user deleted do not come back.
 */
function seedHolidays(db: IDBDatabase): Promise<void> {
  return new Promise((resolve, reject) => {
    const tx = db.transaction([HOLIDAY_STORE, META_STORE], 'readwrite')
    const meta = tx.objectStore(META_STORE)
    const req = meta.get(SEEDED_YEARS)
    req.onsuccess = () => {
      const seeded: number[] = req.result?.years ?? []
      const years = yearsToSeed(DEFAULT_BANK_HOLIDAYS, seeded)
      if (!years.length) return
      const holidays = tx.objectStore(HOLIDAY_STORE)
      for (const h of DEFAULT_BANK_HOLIDAYS) {
        if (years.includes(Number(h.date.slice(0, 4)))) holidays.put(h)
      }
      meta.put({ key: SEEDED_YEARS, years: [...seeded, ...years] })
    }
    tx.oncomplete = () => resolve()
    tx.onerror = () => reject(tx.error)
    tx.onabort = () => reject(tx.error)
  })
}

/** Drops the cached connection; tests call this after swapping indexedDB. */
export function resetConnection(): void {
  dbPromise = null
}

async function transact<T>(
  mode: IDBTransactionMode,
  fn: (store: IDBObjectStore) => IDBRequest<T> | void,
  storeName: string = STORE,
): Promise<T> {
  const db = await openDb()
  return new Promise((resolve, reject) => {
    const tx = db.transaction(storeName, mode)
    const req = fn(tx.objectStore(storeName))
    tx.oncomplete = () => resolve(req ? req.result : (undefined as T))
    tx.onerror = () => reject(tx.error)
    tx.onabort = () => reject(tx.error)
  })
}

function notify(): void {
  for (const fn of listeners) fn()
}

/** Calls `fn` after any write; returns an unsubscribe function. */
export function subscribe(fn: () => void): () => void {
  listeners.add(fn)
  return () => listeners.delete(fn)
}

export function getEntry(date: DateKey): Promise<DayEntry | undefined> {
  return transact<DayEntry | undefined>('readonly', (s) => s.get(date))
}

export function getEntries(from: DateKey, to: DateKey): Promise<DayEntry[]> {
  return transact<DayEntry[]>('readonly', (s) =>
    s.getAll(IDBKeyRange.bound(from, to)),
  )
}

export function getAllEntries(): Promise<DayEntry[]> {
  return transact<DayEntry[]>('readonly', (s) => s.getAll())
}

/** Saves an entry, or deletes it when it has no content left. */
export async function saveEntry(entry: DayEntry): Promise<void> {
  await transact('readwrite', (s) => {
    if (isEmptyEntry(entry)) s.delete(entry.date)
    else s.put({ ...entry, updatedAt: Date.now() })
  })
  notify()
}

const isObject = (x: unknown): x is Record<string, unknown> =>
  typeof x === 'object' && x !== null

function parseEntry(x: unknown): DayEntry | null {
  if (
    !isObject(x) ||
    typeof x.date !== 'string' ||
    !/^\d{4}-\d{2}-\d{2}$/.test(x.date)
  ) {
    return null
  }
  const tasks = Array.isArray(x.tasks) ? x.tasks.filter(isObject) : []
  const strokes = Array.isArray(x.strokes) ? x.strokes.filter(isObject) : []
  return {
    date: x.date,
    text: typeof x.text === 'string' ? x.text : '',
    updatedAt: typeof x.updatedAt === 'number' ? x.updatedAt : 0,
    tasks: tasks.map((t) => ({
      id: typeof t.id === 'string' ? t.id : newId(),
      text: String(t.text ?? ''),
      done: t.done === true,
      time: typeof t.time === 'string' ? t.time : '',
    })),
    strokes: strokes
      .filter((s) => Array.isArray(s.points))
      .map((s) => ({
        tool: s.tool === 'highlighter' ? 'highlighter' : 'pen',
        color: typeof s.color === 'string' ? s.color : '#1f2937',
        width: typeof s.width === 'number' ? s.width : 4,
        points: (s.points as unknown[]).filter(
          (p): p is Point =>
            Array.isArray(p) &&
            p.length === 3 &&
            p.every((n) => typeof n === 'number'),
        ),
      })),
  }
}

export function getHolidays(): Promise<Holiday[]> {
  return transact<Holiday[]>('readonly', (s) => s.getAll(), HOLIDAY_STORE)
}

/** Adds a holiday, replacing any on the same date. */
export async function saveHoliday(holiday: Holiday): Promise<void> {
  await transact('readwrite', (s) => void s.put(holiday), HOLIDAY_STORE)
  notify()
}

export async function deleteHoliday(date: DateKey): Promise<void> {
  await transact('readwrite', (s) => void s.delete(date), HOLIDAY_STORE)
  notify()
}

/** Puts the announced bank holidays back, keeping the user's own. */
export async function restoreDefaultHolidays(): Promise<void> {
  await transact(
    'readwrite',
    (s) => {
      for (const h of DEFAULT_BANK_HOLIDAYS) s.put(h)
    },
    HOLIDAY_STORE,
  )
  notify()
}

export interface Backup {
  app: 'planner'
  version: 1
  exportedAt: string
  entries: DayEntry[]
  /** Added later; older backups have none. */
  holidays?: Holiday[]
}

export async function exportBackup(): Promise<Backup> {
  return {
    app: 'planner',
    version: 1,
    exportedAt: new Date().toISOString(),
    entries: await getAllEntries(),
    holidays: await getHolidays(),
  }
}

/** Imports a backup, replacing days that already exist. Returns the number of days imported. */
export async function importBackup(data: unknown): Promise<number> {
  if (
    !isObject(data) ||
    data.app !== 'planner' ||
    !Array.isArray(data.entries)
  ) {
    throw new Error('ไฟล์นี้ไม่ใช่ไฟล์สำรองของ Planner')
  }
  const entries = data.entries
    .map(parseEntry)
    .filter((e): e is DayEntry => e !== null)
  await transact('readwrite', (s) => {
    for (const e of entries) s.put(e)
  })
  if (Array.isArray(data.holidays)) {
    const holidays = data.holidays
      .map(parseHoliday)
      .filter((h): h is Holiday => h !== null)
    await transact(
      'readwrite',
      (s) => {
        for (const h of holidays) s.put(h)
      },
      HOLIDAY_STORE,
    )
  }
  notify()
  return entries.length
}
