import { useSyncExternalStore } from 'react'
import { nPersonas, seedNotices, stamp, type NPersona, type Notice } from '../data/erpNotify'
import { makeStore } from './localStore'

export const notices = makeStore<Notice>('codi.notify.items', seedNotices)
export const useNotices = notices.use

const KEY = 'codi.notify.me'
let me: NPersona = localStorage.getItem(KEY) === 'admin' ? 'admin' : 'staff'
const ls = new Set<() => void>()
export const setNPersona = (p: NPersona) => {
  me = p
  localStorage.setItem(KEY, p)
  ls.forEach((l) => l())
}
export const useNPersona = () =>
  useSyncExternalStore(
    (cb) => {
      ls.add(cb)
      return () => ls.delete(cb)
    },
    () => me,
  )
export const nWho = () => nPersonas[me].name

/** reading an unread notice moves it to "รอดำเนินการ"; the recipient closes it with "ดำเนินการแล้ว" (= ตอบสนองแล้ว) */
export const markRead = (id: number) => { const n = notices.get(id); if (n && n.status === 'ใหม่') notices.save({ ...n, status: 'รอดำเนินการ' }) }
export const markDone = (id: number) => { const n = notices.get(id); if (n && n.status !== 'ตั้งเวลา') notices.save({ ...n, status: 'ตอบสนองแล้ว', handledAt: stamp() }) }
