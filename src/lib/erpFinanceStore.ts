import { useSyncExternalStore } from 'react'
import { blankItem, clearTotal, docNoOf, fPersonas, loanTotal, money, seedLoans, stamp, type ClearItem, type FPersona, type Loan } from '../data/erpFinance'
import { planBudget, spentOf } from '../data/erpProject'
import { makeStore } from './localStore'
import { perfs } from './erpProjectStore'

export const loans = makeStore<Loan>('codi.finance.loans', seedLoans)
export const useLoans = loans.use

// ---- demo persona (staff / approver / finance) --------------------------------------------------
const KEY = 'codi.finance.me'
const saved = localStorage.getItem(KEY)
let me: FPersona = saved === 'approver' || saved === 'finance' ? saved : 'staff'
const listeners = new Set<() => void>()
export const setFPersona = (p: FPersona) => {
  me = p
  localStorage.setItem(KEY, p)
  listeners.forEach((l) => l())
}
export const useFPersona = () =>
  useSyncExternalStore(
    (cb) => {
      listeners.add(cb)
      return () => listeners.delete(cb)
    },
    () => me,
  )

/** R-32433 : the next running number after the highest one in the system (book 3 fig 2-19 shows R-32432) */
export const nextLoanNo = () => 'R-' + (loans.all().reduce((m, l) => Math.max(m, Number(l.no.replace(/\D/g, '')) || 0), 32430) + 1)

/** Budget left under a budget code, read from the performance records of ERP PROJECT (2.1.3) */
export const budgetLeft = (code: string) => {
  const p = perfs.all().find((x) => x.code === code.trim())
  return p ? { name: p.name, left: planBudget(p) - spentOf(p) } : undefined
}

/** What the system checks before a loan request may be submitted (book 3 §2.1.4.2) */
export function checkLoan(l: Loan): Record<string, string> {
  const e: Record<string, string> = {}
  if (!l.source.trim()) e.source = 'กรุณาระบุที่มาขอใบเบิก'
  if (!l.planNo.trim()) e.planNo = 'กรุณาระบุเลขที่แผนงาน'
  if (!l.requester.trim()) e.requester = 'กรุณาระบุผู้ขอเบิก'
  if (!l.position.trim()) e.position = 'กรุณาระบุตำแหน่ง'
  if (!l.staffCode.trim()) e.staffCode = 'กรุณาระบุรหัสเจ้าหน้าที่'
  if (!l.start) e.start = 'กรุณาระบุวันที่เริ่มต้น'
  if (!l.end) e.end = 'กรุณาระบุวันที่สิ้นสุด'
  else if (l.start && l.end < l.start) e.end = 'วันที่สิ้นสุดต้องไม่ก่อนวันที่เริ่มต้น'
  if (!l.purpose.trim()) e.purpose = 'กรุณาระบุวัตถุประสงค์'
  if (!l.approver) e.approver = 'กรุณาเลือกผู้อนุมัติ'
  const rows = l.items.filter((x) => x.code.trim() || x.name.trim() || Number(x.amount))
  if (!rows.length) e.items = 'ต้องมีรายการค่าใช้จ่ายอย่างน้อย 1 รายการ'
  else if (rows.some((x) => !/^\d{5,6}$/.test(x.code.trim()) || !x.name.trim() || !(Number(x.amount) > 0))) e.items = 'แต่ละแถวต้องมีรหัสงบประมาณ 5–6 หลัก ชื่อรายการ และยอดเงินมากกว่า 0'
  else {
    const over = rows.find((x) => {
      const b = budgetLeft(x.code)
      return b && Number(x.amount) > b.left
    })
    if (over) e.items = `รหัสงบประมาณ ${over.code} มีงบคงเหลือไม่พอ (คงเหลือ ${money(budgetLeft(over.code)!.left)} บาท)`
  }
  return e
}

/** ยื่นเอกสาร: save, issue the saraban number and notify the approver */
export function submitLoan(l: Loan) {
  const prev = loans.get(l.id)
  const id = l.id || loans.next()
  const at = stamp()
  const docNo = prev?.docNo && prev.status === 'returned' ? prev.docNo : docNoOf(id)
  const rec: Loan = {
    ...l,
    id,
    no: l.no || nextLoanNo(),
    docNo,
    status: 'submitted',
    createdAt: l.createdAt || at,
    decision: undefined,
    items: l.items.filter((x) => x.code.trim() || x.name.trim() || Number(x.amount)),
    events: [
      ...(prev?.events ?? []),
      { at, by: l.recorder, action: prev?.status === 'returned' ? 'แก้ไขและยื่นคำขอยืมเงินใหม่' : 'ยื่นคำขอยืมเงิน' },
      { at, by: 'ระบบ', action: 'ออกเลขสารบรรณ', note: docNo },
      { at, by: 'ระบบ', action: 'แจ้งเตือนผู้มีอำนาจอนุมัติ', note: l.approver.split(' · ')[0] },
    ],
  }
  loans.save(rec)
  return rec
}

/** 2.1.4.3 บันทึก: approve / reject / send back, and tell the borrower */
export function decideLoan(id: number, decision: 'approve' | 'reject' | 'return', reason: string, by: string) {
  const l = loans.get(id)
  if (!l) return
  const at = stamp()
  const label = { approve: 'อนุมัติยืมเงิน', reject: 'ไม่อนุมัติยืมเงิน', return: 'ส่งกลับแก้ไข' }[decision]
  loans.save({
    ...l,
    status: ({ approve: 'approved', reject: 'rejected', return: 'returned' } as const)[decision],
    decision: { decision, reason, by, at },
    events: [...l.events, { at, by, action: label, note: reason }, { at, by: 'ระบบ', action: decision === 'approve' ? 'ส่งต่อสำนักการเงินและบัญชีตรวจสอบ' : 'แจ้งเตือนผู้ยืมเงิน', note: decision === 'approve' ? undefined : l.requester }],
  })
}

/** 2.1.4.4: the finance office either passes the loan or sends it back with advice */
export function verifyLoan(id: number, pass: boolean, note: string, by: string) {
  const l = loans.get(id)
  if (!l) return
  const at = stamp()
  loans.save({
    ...l,
    status: pass ? 'verified' : 'returned',
    verify: { note, by, at },
    decision: pass ? l.decision : { decision: 'return', reason: note, by, at },
    events: [...l.events, { at, by, action: pass ? 'ผ่านการตรวจสอบเงินยืม' : 'ส่งกลับแก้ไข (ไม่ผ่านการตรวจสอบ)', note }, { at, by: 'ระบบ', action: pass ? 'โอนเงินยืมและแจ้งผู้ยืมหักล้างภายใน 30 วัน' : 'แจ้งเตือนผู้ยืมเงิน', note: pass ? undefined : l.requester }],
  })
}

export function checkClear(items: ClearItem[]): Record<string, string> {
  const e: Record<string, string> = {}
  const rows = items.filter((x) => x.detail.trim() || x.receipt.trim() || Number(x.amount))
  if (!rows.length) e.items = 'ต้องมีรายการค่าใช้จ่ายอย่างน้อย 1 รายการ'
  else if (rows.some((x) => !x.date || !x.kind || !x.detail.trim() || !x.receipt.trim() || !x.issuer.trim() || !(Number(x.amount) > 0))) e.items = 'แต่ละรายการต้องมี วันที่ ประเภท รายละเอียด จำนวนเงิน เลขที่ใบเสร็จ และผู้ออกใบเสร็จ'
  else if (new Set(rows.map((x) => x.receipt.trim())).size !== rows.length) e.items = 'มีเลขที่ใบเสร็จซ้ำกัน'
  else if (rows.some((x) => !x.evidence.trim())) e.items = 'กรุณาแนบหลักฐานประกอบทุกรายการ'
  return e
}

/** 2.1.4.5 บันทึก: store the clearing document and set the loan to "หักล้างแล้ว" */
export function clearLoan(id: number, items: ClearItem[], by: string) {
  const l = loans.get(id)
  if (!l) return
  const at = stamp()
  const rows = items.filter((x) => x.detail.trim() || x.receipt.trim() || Number(x.amount))
  const diff = loanTotal(l) - clearTotal(rows)
  const note = `ใช้จริง ${money(clearTotal(rows))} บาท ${diff > 0 ? 'คืนเงิน ' + money(diff) : diff < 0 ? 'เบิกเพิ่ม ' + money(-diff) : 'ไม่มีผลต่าง'}${diff ? ' บาท' : ''}`
  loans.save({ ...l, status: 'cleared', clear: { items: rows, at }, events: [...l.events, { at, by, action: 'ส่งเอกสารหักล้างเงินยืม', note }] })
}

export const copyLoan = (l: Loan): Loan => ({ ...l, id: 0, no: '', status: 'submitted', decision: undefined, verify: undefined, clear: undefined, events: [], createdAt: '', items: l.items.length ? l.items.map((x) => ({ ...x })) : [blankItem()] })
export const personaName = (p: FPersona) => fPersonas[p].name
