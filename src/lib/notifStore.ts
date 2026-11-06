import { useSyncExternalStore } from 'react'

export type Level = 'urgent2' | 'urgent' | 'normal'
export type Kind = 'forward' | 'sign' | 'view'
export type NotifRow = { id: number; title: string; type: string; at: string; level: Level; kind: Kind }

const templates: Omit<NotifRow, 'id' | 'at'>[] = [
  { title: 'ตรวจสอบข้อมูลองค์กรชุมชน', type: 'เอกสาร', level: 'urgent2', kind: 'forward' },
  { title: 'ลงนามเอกสารรับรอง', type: 'เอกสาร', level: 'urgent', kind: 'sign' },
  { title: 'การเบิกค่ารักษาพยาบาลได้รับการอนุมัติ', type: 'เอกสาร', level: 'normal', kind: 'view' },
  { title: 'คำขอจองห้องประชุมได้รับการอนุมัติ', type: 'เอกสาร', level: 'normal', kind: 'view' },
  { title: 'งบประมาณโครงการได้รับการอนุมัติ', type: 'เอกสาร', level: 'normal', kind: 'view' },
  { title: 'อนุมัติคำขอจองใช้งานระบบ', type: 'เอกสาร', level: 'urgent', kind: 'view' },
]
const dates = ['2025-09-24 เวลา 14:30 น.', '2025-09-21 เวลา 11:30 น.', '2025-09-21 เวลา 11:30 น.', '2025-09-20 เวลา 16:05 น.', '2025-09-19 เวลา 09:45 น.', '2025-09-18 เวลา 13:10 น.']
export const notifRows: NotifRow[] = Array.from({ length: 18 }, (_, i) => ({ id: i + 1, ...templates[i % 6], at: dates[i % 6] }))

// Figma OSS-Area แจ้งเตือนเอกสารเข้าใหม่: the first 3 rows carry the NEW tag, everything else is read.
const NEW_IDS = [1, 2, 3]
const KEY = 'codi.notifState'
export type NotifState = { read: number[]; done: Record<number, string> }

const seed = (): NotifState => ({ read: notifRows.filter((r) => !NEW_IDS.includes(r.id)).map((r) => r.id), done: {} })
const load = (): NotifState => {
  try {
    const s = JSON.parse(localStorage.getItem(KEY) ?? '') as NotifState
    return Array.isArray(s.read) && s.done ? s : seed()
  } catch {
    return seed()
  }
}

let state = load()
const listeners = new Set<() => void>()
const commit = (next: NotifState) => {
  state = next
  localStorage.setItem(KEY, JSON.stringify(state))
  listeners.forEach((l) => l())
}
const subscribe = (cb: () => void) => {
  listeners.add(cb)
  return () => listeners.delete(cb)
}

export const useNotifState = () => useSyncExternalStore(subscribe, () => state)
export const unreadOf = (s: NotifState) => notifRows.filter((r) => !s.read.includes(r.id)).length
/** Number shown on the bell, the sidebar and the page — always the count of rows still tagged NEW */
export const useUnreadCount = () => unreadOf(useNotifState())
export const markRead = (id: number) => {
  if (!state.read.includes(id)) commit({ ...state, read: [...state.read, id] })
}
export const setDone = (id: number, label: string) => commit({ ...state, done: { ...state.done, [id]: label } })
