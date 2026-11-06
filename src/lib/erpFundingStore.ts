import { useSyncExternalStore } from 'react'
import { gPersonas, seedInvs, stamp, type GPersona, type Inv } from '../data/erpFunding'
import { makeStore } from './localStore'

export const invs = makeStore<Inv>('codi.funding.invs', seedInvs)
export const useInvs = invs.use

const KEY = 'codi.funding.me'
const saved = localStorage.getItem(KEY)
let me: GPersona = saved === 'director' ? 'director' : 'staff'
const listeners = new Set<() => void>()
export const setGPersona = (p: GPersona) => {
  me = p
  localStorage.setItem(KEY, p)
  listeners.forEach((l) => l())
}
export const useGPersona = () =>
  useSyncExternalStore(
    (cb) => {
      listeners.add(cb)
      return () => listeners.delete(cb)
    },
    () => me,
  )

/** "เพิ่มรายการลงทุน": saved as a draft proposal waiting for the director's report approval (2.1.5.5) */
export function addInv(i: Inv) {
  const at = stamp()
  const id = i.id || invs.next()
  invs.save({ ...i, id, status: 'draft', rejected: undefined, events: [...i.events, { at, by: gPersonas.staff.name, action: i.events.length ? 'แก้ไขและเสนอรายการลงทุนใหม่' : 'เสนอรายการลงทุน' }, { at, by: 'ระบบ', action: 'ตรวจสอบรายการกับข้อกำหนดการลงทุน', note: 'ผ่าน' }, { at, by: 'ระบบ', action: 'แจ้งเตือนผู้อำนวยการให้พิจารณา' }] })
  return id
}

/** 2.1.5.5 บันทึกผลเพื่อแจ้งเตือน (after the OTP): approve → อยู่ระหว่างลงทุน, reject → back to แบบร่าง with the reason */
export function decideInv(id: number, approve: boolean, reason: string) {
  const i = invs.get(id)
  if (!i) return
  const at = stamp()
  const by = gPersonas.director.name
  invs.save({
    ...i,
    status: approve ? 'ongoing' : 'draft',
    rejected: approve ? undefined : reason,
    decision: { approve, reason, by, at },
    events: [...i.events, { at, by, action: approve ? 'อนุมัติการลงทุน (ยืนยัน OTP)' : 'ไม่อนุมัติการลงทุน (ยืนยัน OTP)', note: reason }, { at, by: 'ระบบ', action: 'แจ้งเตือนเจ้าหน้าที่ผู้รับผิดชอบ', note: approve ? 'ดำเนินการลงทุนตามเกณฑ์ที่ได้รับอนุมัติ' : 'เสนอรายการลงทุนใหม่' }],
  })
}

export const closeInv = (id: number) => {
  const at = stamp()
  invs.update(id, (i) => ({ ...i, status: 'done', events: [...i.events, { at, by: gPersonas.staff.name, action: 'บันทึกครบกำหนดการลงทุน' }] }))
}
