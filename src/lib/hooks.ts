import { useCallback, useEffect, useRef, useState } from 'react'
import type { DateKey } from './date'
import type { Holiday } from './holidays'
import type { Leave } from './leave'
import {
  emptyEntry,
  getHolidays,
  getLeaves,
  getEntries,
  getEntry,
  saveEntry,
  subscribe,
  type DayEntry,
} from './storage'

/** Entries between two dates (inclusive), kept up to date with every save. */
export function useEntries(from: DateKey, to: DateKey): Map<DateKey, DayEntry> {
  const [entries, setEntries] = useState(() => new Map<DateKey, DayEntry>())
  useEffect(() => {
    let cancelled = false
    const load = () =>
      getEntries(from, to).then((list) => {
        if (!cancelled) setEntries(new Map(list.map((e) => [e.date, e])))
      })
    void load()
    const unsubscribe = subscribe(load)
    return () => {
      cancelled = true
      unsubscribe()
    }
  }, [from, to])
  return entries
}

/** Every holiday by date, kept up to date with adds and deletes. */
export function useHolidays(): Map<DateKey, Holiday> {
  const [holidays, setHolidays] = useState(() => new Map<DateKey, Holiday>())
  useEffect(() => {
    let cancelled = false
    const load = () =>
      getHolidays().then((list) => {
        if (!cancelled) setHolidays(new Map(list.map((h) => [h.date, h])))
      })
    void load()
    const unsubscribe = subscribe(load)
    return () => {
      cancelled = true
      unsubscribe()
    }
  }, [])
  return holidays
}

/** Every leave day by date, kept up to date with adds and deletes. */
export function useLeaves(): Map<DateKey, Leave> {
  const [leaves, setLeaves] = useState(() => new Map<DateKey, Leave>())
  useEffect(() => {
    let cancelled = false
    const load = () =>
      getLeaves().then((list) => {
        if (!cancelled) setLeaves(new Map(list.map((l) => [l.date, l])))
      })
    void load()
    const unsubscribe = subscribe(load)
    return () => {
      cancelled = true
      unsubscribe()
    }
  }, [])
  return leaves
}

const SAVE_DELAY_MS = 400

/**
 * One day's entry for editing. Changes show immediately and are saved shortly
 * after the last edit, and before the page is hidden or the day changes.
 */
export function useDayEntry(date: DateKey) {
  const [entry, setEntry] = useState<DayEntry | null>(null)
  const latest = useRef<DayEntry | null>(null)
  const pending = useRef<DayEntry | null>(null)
  const timer = useRef<number | undefined>(undefined)

  const flush = useCallback(() => {
    window.clearTimeout(timer.current)
    const e = pending.current
    pending.current = null
    if (e) void saveEntry(e)
  }, [])

  useEffect(() => {
    let cancelled = false
    const load = () =>
      getEntry(date).then((e) => {
        // Never overwrite edits that have not been saved yet.
        if (cancelled || pending.current) return
        latest.current = e ?? emptyEntry(date)
        setEntry(latest.current)
      })
    // Block edits until this day has loaded.
    latest.current = null
    void load()
    const unsubscribe = subscribe(load)
    return () => {
      cancelled = true
      unsubscribe()
      flush()
    }
  }, [date, flush])

  useEffect(() => {
    const onHide = () => {
      if (document.visibilityState === 'hidden') flush()
    }
    window.addEventListener('pagehide', flush)
    document.addEventListener('visibilitychange', onHide)
    return () => {
      window.removeEventListener('pagehide', flush)
      document.removeEventListener('visibilitychange', onHide)
    }
  }, [flush])

  const update = useCallback(
    (change: (e: DayEntry) => DayEntry) => {
      if (!latest.current) return
      const next = change(latest.current)
      latest.current = next
      pending.current = next
      setEntry(next)
      window.clearTimeout(timer.current)
      timer.current = window.setTimeout(flush, SAVE_DELAY_MS)
    },
    [flush],
  )

  return [entry, update] as const
}
