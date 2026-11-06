import { seedPerfs, seedProposals, spentOf, planBudget, stamp, type Decision, type Perf, type Proposal } from '../data/erpProject'
import { decisionLabel } from '../data/erpProject'
import { makeStore } from './localStore'

export const perfs = makeStore<Perf>('codi.project.perfs', seedPerfs)
export const proposals = makeStore<Proposal>('codi.project.proposals', seedProposals)
export const usePerfs = perfs.use
export const useProposals = proposals.use

const two = (n: number) => String(n).padStart(2, '0')
/** BP-07-68-0012 : BP-<month>-<year yy>-<running no> (the sample numbering of book 3 fig 2-13) */
export const nextPerfNo = (year: string) => {
  const d = new Date()
  const n = perfs.all().reduce((m, p) => Math.max(m, Number(p.no.split('-').pop()) || 0), 0) + 1
  return `BP-${two(d.getMonth() + 1)}-${year.slice(2)}-${String(n).padStart(4, '0')}`
}

/** What the system checks before a performance record may be sent for approval (book 3 §2.1.3.3) */
export function checkPerf(p: Perf, forSubmit: boolean): Record<string, string> {
  const e: Record<string, string> = {}
  if (!p.name.trim()) e.name = 'กรุณาระบุชื่อแผนงาน'
  if (!/^\d{5,6}$/.test(p.code.trim())) e.code = 'รหัสงบประมาณต้องเป็นตัวเลข 5–6 หลัก'
  if (p.progress < 0 || p.progress > 100 || p.target < 0 || p.target > 100) e.progress = 'เปอร์เซ็นต์ต้องอยู่ระหว่าง 0–100'
  const rows = p.expenses.filter((x) => x.invoice.trim() || x.detail.trim() || Number(x.amount))
  if (rows.some((x) => !x.invoice.trim() || !x.detail.trim() || !(Number(x.amount) > 0))) e.expenses = 'รายการเบิกจ่ายต้องมีเลขที่ใบแจ้งหนี้ รายละเอียด และจำนวนเงินมากกว่า 0 ครบทุกแถว'
  else if (new Set(rows.map((x) => x.invoice.trim())).size !== rows.length) e.expenses = 'มีเลขที่ใบแจ้งหนี้ซ้ำกัน'
  if (forSubmit) {
    if (!p.init) e.init = 'ระบุงบประมาณตั้งต้น'
    if (!rows.length) e.expenses = 'ต้องมีรายการเบิกจ่ายอย่างน้อย 1 รายการ'
    if (spentOf(p) > planBudget(p) && !e.expenses) e.expenses = `ยอดเบิกจ่ายรวมเกินงบประมาณ (${planBudget(p).toLocaleString('en-US')} บาท) กรุณาตรวจสอบรายการ`
  }
  return e
}

export function savePerf(p: Perf, status: Perf['status']) {
  const id = p.id || perfs.next()
  const rec: Perf = { ...p, id, no: p.no || nextPerfNo(p.year), status, expenses: p.expenses.filter((x) => x.invoice.trim() || x.detail.trim() || Number(x.amount)) }
  perfs.save(rec)
  return rec
}
export const approvePerf = (id: number) => perfs.update(id, (p) => ({ ...p, status: 'approved', annual: planBudget(p) }))

export function submitProposal(p: Proposal) {
  const prev = proposals.get(p.id)
  const action = prev && (prev.status === 'revise' || prev.status === 'rejected') ? 'แก้ไขและส่งโครงการใหม่' : 'ส่งโครงการเพื่อพิจารณา'
  proposals.save({ ...p, status: 'submitted', result: undefined, history: [...p.history, { at: stamp(), by: p.creator, action }] })
}
export const saveProposalDraft = (p: Proposal) => proposals.save({ ...p, status: p.status === 'submitted' ? 'submitted' : 'draft' })
export const saveComment = (id: number, comment: string) => proposals.update(id, (p) => ({ ...p, comment }))

/** 2.1.3.6 "บันทึกและส่งแจ้งเตือน": store the summary, set the project status and notify the proposer */
export function summarize(id: number, pageComments: Proposal['pageComments'], decision: Decision, reason: string, by: string) {
  const p = proposals.get(id)
  if (!p) return
  const at = stamp()
  const status = ({ approve: 'approved', revise: 'revise', reject: 'rejected' } as const)[decision]
  proposals.save({
    ...p,
    status,
    pageComments,
    result: { decision, reason, by, at },
    history: [...p.history, { at, by, action: decisionLabel[decision], note: reason }, { at, by: 'ระบบ', action: 'แจ้งเตือนผลการพิจารณา', note: `ถึง ${p.creator} (${p.office})` }],
  })
}
