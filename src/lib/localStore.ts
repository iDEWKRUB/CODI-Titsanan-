import { useSyncExternalStore } from 'react'

// UI-only persistence (localStorage) until the training API exists.
export function makeStore<T extends { id: number }>(key: string, seed: () => T[], fix: (x: T) => T = (x) => x) {
  const read = (): T[] => {
    try {
      const raw = localStorage.getItem(key)
      return raw ? (JSON.parse(raw) as T[]).map(fix) : seed()
    } catch {
      return seed()
    }
  }
  let list = read()
  const listeners = new Set<() => void>()
  const commit = (next: T[]) => {
    list = next
    localStorage.setItem(key, JSON.stringify(list))
    listeners.forEach((l) => l())
  }
  return {
    use: () =>
      useSyncExternalStore(
        (cb) => {
          listeners.add(cb)
          return () => listeners.delete(cb)
        },
        () => list,
      ),
    get: (id: number) => list.find((x) => x.id === id),
    next: () => list.reduce((n, x) => Math.max(n, x.id), 0) + 1,
    /** Insert (newest first) or replace by id */
    save: (x: T) => commit(list.some((y) => y.id === x.id) ? list.map((y) => (y.id === x.id ? x : y)) : [x, ...list]),
    update: (id: number, patch: (x: T) => T) => commit(list.map((x) => (x.id === id ? patch(x) : x))),
    remove: (id: number) => commit(list.filter((x) => x.id !== id)),
  }
}

