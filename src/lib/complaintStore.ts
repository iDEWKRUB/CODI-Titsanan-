import { ME, SLA_DAYS, addDays, daysBetween, seedComplaints, stamp, type Complaint } from '../data/erpComplaint'
import { makeStore } from './localStore'

export const complaints = makeStore<Complaint>('codi.complaint.items', seedComplaints)
export const useComplaints = complaints.use

const log = (c: Complaint, action: string, note?: string) => [...c.history, { at: stamp(), by: ME, action, note: note?.trim() || undefined }]

/** move a complaint along the funnel: classify → assign an agency → close with a result */
export function review(id: number, patch: Pick<Complaint, 'type' | 'urgency'>, note?: string) {
  const c = complaints.get(id)
  if (c) complaints.save({ ...c, ...patch, stage: Math.max(c.stage, 1) as Complaint['stage'], history: log(c, 'ตรวจสอบเบื้องต้น', `จำแนกเป็น “${patch.type}” ความเร่งด่วน ${patch.urgency}${note ? ` — ${note}` : ''}`) })
}
export function assign(id: number, agency: string) {
  const c = complaints.get(id)
  if (c) complaints.save({ ...c, agency, stage: Math.max(c.stage, 2) as Complaint['stage'], history: log(c, 'มอบหมายหน่วยงาน', agency) })
}
export function close(id: number, result: string) {
  const c = complaints.get(id)
  if (c) complaints.save({ ...c, stage: 3, closedAt: addDays(0), result: result.trim(), history: log(c, 'ปิดเรื่องแล้ว', result) })
}
export function registerCase(id: number, caseNo: string, caseTitle: string, hearing: string, hearingNote: string) {
  const c = complaints.get(id)
  if (c) complaints.save({ ...c, caseNo, caseTitle, hearing, hearingNote, history: log(c, 'ลงทะเบียนคดีใหม่', `${caseNo} นัดพิจารณา ${hearing}`) })
}
export const slaPct = (list: Complaint[]) => {
  const closed = list.filter((c) => c.stage === 3 && c.closedAt)
  return closed.length ? Math.round((closed.filter((c) => daysBetween(c.receivedAt, c.closedAt!) <= SLA_DAYS).length / closed.length) * 100) : 0
}
