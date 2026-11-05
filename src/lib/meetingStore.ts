import { useSyncExternalStore } from 'react'
import { seedMeetings, type Meeting } from '../data/meetings'

// UI-only persistence (localStorage) until the meeting API exists.
const KEY = 'codi.meetings'

let list: Meeting[] = load()
const listeners = new Set<() => void>()

function load(): Meeting[] {
  try {
    const raw = localStorage.getItem(KEY)
    return raw ? (JSON.parse(raw) as Meeting[]) : seedMeetings()
  } catch {
    return seedMeetings()
  }
}

function commit(next: Meeting[]) {
  list = next
  localStorage.setItem(KEY, JSON.stringify(list))
  listeners.forEach((l) => l())
}

export function useMeetings() {
  return useSyncExternalStore(
    (cb) => {
      listeners.add(cb)
      return () => listeners.delete(cb)
    },
    () => list,
  )
}

export const getMeeting = (id: number) => list.find((m) => m.id === id)
export const nextMeetingId = () => list.reduce((n, m) => Math.max(n, m.id), 0) + 1

/** Insert or replace by id */
export function saveMeeting(m: Meeting) {
  commit(list.some((x) => x.id === m.id) ? list.map((x) => (x.id === m.id ? m : x)) : [...list, m])
}

export function updateMeeting(id: number, patch: (m: Meeting) => Meeting) {
  commit(list.map((m) => (m.id === id ? patch(m) : m)))
}

export function deleteMeeting(id: number) {
  commit(list.filter((m) => m.id !== id))
}
