import { useSyncExternalStore } from 'react'
import { gPersonasA, seedContracts, stamp, type Contract, type GPersona, type PageNote } from '../data/erpAgreement'
import { makeStore } from './localStore'

export const contracts = makeStore<Contract>('codi.agreement.items', seedContracts)
export const useContracts = contracts.use

const KEY = 'codi.agreement.me'
const saved = localStorage.getItem(KEY)
let me: GPersona = saved === 'legal' || saved === 'signer' ? saved : 'staff'
const ls = new Set<() => void>()
export const setGPersona = (p: GPersona) => {
  me = p
  localStorage.setItem(KEY, p)
  ls.forEach((l) => l())
}
export const useGPersona = () =>
  useSyncExternalStore(
    (cb) => {
      ls.add(cb)
      return () => ls.delete(cb)
    },
    () => me,
  )
export const gWho = () => gPersonasA[me].name

/** append an event and bump the last-edited stamp */
export function log(id: number, action: string, patch: Partial<Contract> = {}, note?: string) {
  const c = contracts.get(id)
  if (!c) return
  const at = stamp()
  contracts.save({ ...c, ...patch, updatedAt: at, history: [...c.history, { at, by: gWho(), action, note: note?.trim() || undefined }] })
}
/** legal officer's verdict (2.3.1.9): pass → รอลงนาม, otherwise back to the owner with the page notes */
export function reviewVerdict(id: number, pass: boolean, notes: PageNote[], summary: string) {
  log(id, pass ? 'ผ่านการตรวจสอบ' : 'ให้ปรับปรุงสัญญา', { status: pass ? 'รอลงนาม' : 'ต้องแก้ไข', notes }, summary)
}
/** signer's decision after OTP (2.3.1.8) */
export function signDecision(id: number, ok: boolean, note: string) {
  const c = contracts.get(id)
  log(id, ok ? 'ลงนามสัญญา (ยืนยัน OTP)' : 'ไม่อนุมัติ', { status: ok ? 'ลงนามแล้ว' : 'ไม่อนุมัติ', signDate: ok ? stamp().slice(0, 10) : c?.signDate ?? '', fromRegistry: ok ? true : c?.fromRegistry ?? false, file: ok ? `${c?.no}-signed.pdf` : c?.file ?? '' }, note)
}
