import { useSyncExternalStore } from 'react'
import { isMyTurn, people, seedCirculars, seedDocs, stamp, type Circular, type PersonId, type SDoc, type Step } from '../data/saraban'
import { makeStore } from './localStore'

export const docs = makeStore<SDoc>('codi.saraban.docs', seedDocs)
export const useDocs = docs.use

// ---- who is looking (demo persona switch: the real system takes this from SSO) ----
const ROLE = 'codi.saraban.me'
let me: PersonId = (['clerk', 'deputy', 'director'] as const).find((p) => p === localStorage.getItem(ROLE)) ?? 'clerk'
const ml = new Set<() => void>()
export const setMe = (p: PersonId) => {
  me = p
  localStorage.setItem(ROLE, p)
  ml.forEach((l) => l())
}
export const useMe = () =>
  useSyncExternalStore(
    (cb) => (ml.add(cb), () => ml.delete(cb)),
    () => me,
  )

// ---- circulars (หนังสือเวียน / แจ้งเวียน) ----
const circ = makeStore<Circular>('codi.saraban.circulars', seedCirculars)
export const useCirculars = circ.use
export const markCircularRead = (id: number) => circ.update(id, (c) => ({ ...c, read: true }))
export const markAllCircularsRead = () => circ.all().forEach((c) => !c.read && circ.update(c.id, (x) => ({ ...x, read: true })))
export const addCircular = (title: string) => circ.save({ id: circ.next(), title, at: stamp().slice(8, 10) + '-' + stamp().slice(5, 7) + '-' + String(new Date().getFullYear() + 543).slice(2) + ' ' + stamp().slice(11), read: false })

// ---- numbering ----
export const nextDocNo = () => `D-${String(docs.next()).padStart(3, '0')}`
export const nextRegNo = () => `RB-${new Date().getFullYear()}-${String(8000 + docs.all().length * 7 + 39)}`
const issueNo = () => `ที่ พอช. ${String(412 + docs.all().filter((d) => d.issuedNo).length + 1).padStart(4, '0')}/${new Date().getFullYear() + 543}`

const log = (d: SDoc, who: PersonId | 'system', action: string, note?: string): SDoc => ({ ...d, history: [...d.history, { at: stamp(), who, action, note }] })
export const chainText = (chain: Step[]) => chain.map((s) => people[s.who].short).join(' → ')

/** Clerk sends a finished document to the first person in the chain (ฟีเจอร์ส่งหนังสือ + แจ้งเตือนเอกสารเข้าใหม่) */
export function submitDoc(d: SDoc) {
  docs.save(log({ ...d, status: 'review', step: 0, returnReason: undefined }, d.creator, d.status === 'returned' ? 'แก้ไขและส่งใหม่' : 'ส่งเอกสารให้ผู้ลงนาม', chainText(d.chain)))
}

/** Pass-through or sign: moves the document along the chain (ฟีเจอร์การเวียนหนังสือ + e-Signature); the last signer completes it and the registry number is issued */
export function approveDoc(id: number, who: PersonId, directive?: string) {
  const d = docs.get(id)
  if (!d || !isMyTurn(d, who)) return
  const step = d.chain[d.step]
  let next = log(d, who, step.role === 'sign' ? 'ลงนามอนุมัติ' : 'เซ็นผ่าน', directive ? `สั่งการ: ${directive}` : undefined)
  if (directive) next = { ...next, directive }
  if (d.step + 1 < d.chain.length) {
    next = { ...next, step: d.step + 1 }
    next = log(next, 'system', 'แจ้งเตือนเอกสารเข้าใหม่', `ถึง ${people[d.chain[d.step + 1].who].short}`)
  } else {
    const done = { ...next, status: 'signed' as const, issuedNo: issueNo() }
    next = log(done, 'system', 'ออกเลขทะเบียน', done.issuedNo)
    next = log(next, 'system', 'ส่งหนังสือที่ลงนามครบถ้วนกลับไปยังเจ้าหน้าที่สารบรรณ', people[d.creator].short)
  }
  docs.save(next)
}

/** Not approved: back to the clerk with a reason, earlier signers are told it was changed (ฟีเจอร์แจ้งเตือนการแก้ไข) */
export function returnDoc(id: number, who: PersonId, reason: string) {
  const d = docs.get(id)
  if (!d || !isMyTurn(d, who)) return
  let next = log({ ...d, status: 'returned', returnReason: reason, step: 0 }, who, 'ตีกลับ', reason)
  if (d.step > 0) next = log(next, 'system', 'แจ้งเตือนการแก้ไขถึงผู้ลงนามลำดับก่อนหน้า', d.chain.slice(0, d.step).map((s) => people[s.who].short).join(', '))
  docs.save(next)
}

export function copyDoc(d: SDoc) {
  const id = docs.next()
  docs.save({ ...d, id, no: nextDocNo(), status: 'draft', step: 0, issuedNo: undefined, returnReason: undefined, directive: undefined, createdAt: stamp(), week: true, history: [{ at: stamp(), who: d.creator, action: 'สร้างเอกสาร', note: 'คัดลอกจาก ' + d.no }] })
  return id
}
export const deleteDraft = (id: number) => docs.get(id)?.status === 'draft' && docs.remove(id)
/** Send a signed external letter out from the central saraban mailbox (book 1 §2.2.6.1: saraban@codi.co.th only) */
export function sendExternal(id: number, who: PersonId, cc: string) {
  const d = docs.get(id)
  if (!d || d.status !== 'signed') return
  docs.save(log(d, who, 'ส่งหนังสือภายนอก', 'จาก saraban@codi.co.th ถึง ' + (d.to || '-') + (cc ? ' · CC: ' + cc : '')))
}
export const wasSent = (d: SDoc) => d.history.some((h) => h.action === 'ส่งหนังสือภายนอก')
