import { useSyncExternalStore } from 'react'
import { bPersonas, seedBookings, stamp, type BPersona, type Booking } from '../data/erpBooking'
import { makeStore } from './localStore'

export const bookings = makeStore<Booking>('codi.booking.items', seedBookings)
export const useBookings = bookings.use

// ---- persona --------------------------------------------------------------------------------------
const KEY = 'codi.booking.me'
const saved = localStorage.getItem(KEY)
let me: BPersona = saved === 'approver' || saved === 'central' ? saved : 'staff'
const ls = new Set<() => void>()
export const setBPersona = (p: BPersona) => {
  me = p
  localStorage.setItem(KEY, p)
  ls.forEach((l) => l())
}
export const useBPersona = () =>
  useSyncExternalStore(
    (cb) => {
      ls.add(cb)
      return () => ls.delete(cb)
    },
    () => me,
  )
export const bWho = () => bPersonas[me].name

/** approver decides a pending request; the requester is notified by the system (book 3 "บันทึกผลเพื่อแจ้งเตือน") */
export function decide(id: number, ok: boolean, note: string) {
  const b = bookings.get(id)
  if (!b) return
  bookings.save({ ...b, status: ok ? 'อนุมัติ' : 'ไม่อนุมัติ', history: [...b.history, { at: stamp(), by: bWho(), action: ok ? 'อนุมัติ' : 'ไม่อนุมัติ', note: note.trim() || undefined }] })
}
/** central office closes an approved booking once used / returned */
export function complete(id: number) {
  const b = bookings.get(id)
  if (!b) return
  bookings.save({ ...b, status: 'เสร็จสมบูรณ์', history: [...b.history, { at: stamp(), by: bWho(), action: b.kind === 'borrow' ? 'รับคืนพัสดุครบถ้วน' : 'ใช้งานเสร็จสมบูรณ์' }] })
}
