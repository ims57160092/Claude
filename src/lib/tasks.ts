import type { Task } from './storage'

export function sortTasks(tasks: Task[]): Task[] {
  // Timed tasks first in time order; untimed ones keep the order they were added.
  return [...tasks].sort((a, b) => {
    if (a.time && b.time) return a.time.localeCompare(b.time)
    return a.time ? -1 : b.time ? 1 : 0
  })
}
