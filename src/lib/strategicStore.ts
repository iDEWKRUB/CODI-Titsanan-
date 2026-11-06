import { useSyncExternalStore } from 'react'
import { allocation, personas, seedPlans, seedReports, seedRisks, seedStrategies, stamp, sumBy, type Persona, type Plan, type Risk, type RiskReport, type Strategy } from '../data/strategic'
import { makeStore } from './localStore'

export const strategies = makeStore<Strategy>('codi.strategic.strategies', seedStrategies)
export const plans = makeStore<Plan>('codi.strategic.plans', seedPlans)
export const risks = makeStore<Risk>('codi.strategic.risks', seedRisks)
export const reports = makeStore<RiskReport>('codi.strategic.reports', seedReports)
export const useStrategies = strategies.use
export const usePlans = plans.use
export const useRisks = risks.use
export const useReports = reports.use

// ---- who is looking (demo persona switch — SSO/RBAC in the real system) ----
const KEY = 'codi.strategic.me'
let me: Persona = localStorage.getItem(KEY) === 'office' ? 'office' : 'strat'
const ls = new Set<() => void>()
export const setPersona = (p: Persona) => {
  me = p
  localStorage.setItem(KEY, p)
  ls.forEach((l) => l())
}
export const usePersona = () =>
  useSyncExternalStore(
    (cb) => (ls.add(cb), () => ls.delete(cb)),
    () => me,
  )

// ---- strategy (2.1.2.2) ----
export const nextStrategyCode = (year: string) => `ST-${year}-${String(strategies.all().filter((s) => s.fiscalYear === year).length + 1).padStart(2, '0')}`
export const nextRiskCode = () => `R-${32400 + risks.next()}`
export const nextPlanNo = (office: string, year: string) => {
  const abbr: Record<string, string> = { 'สำนักเทคโนโลยีสารสนเทศ': 'IT', 'สำนักทรัพยากรบุคคล': 'HR', 'สำนักการเงินและบัญชี': 'FN', 'สำนักบริหารงานกลาง': 'AD', 'สำนักผู้อำนวยการ': 'DR', 'สำนักยุทธศาสตร์ นโยบายและแผน': 'ST', 'สำนักพัฒนาองค์ความรู้และสื่อสารองค์กร': 'KM' }
  return `${year}/${abbr[office] ?? 'XX'}-${String(plans.all().filter((p) => p.office === office && p.fiscalYear === year).length + 1).padStart(3, '0')}`
}

/** What the system checks before an office may submit a plan (book 1 §2.2.1.2 "ระบบช่วยตรวจสอบ") */
export function checkPlan(p: Pick<Plan, 'office' | 'items' | 'detail'>): string[] {
  const out: string[] = []
  if (!p.detail.trim()) out.push('กรุณาระบุรายละเอียดแผนงาน')
  if (!p.items.length) out.push('ต้องมีรายการคำของบประมาณอย่างน้อย 1 รายการ')
  const codes = p.items.map((i) => i.code.trim())
  if (codes.some((c) => !/^\d{6}$/.test(c))) out.push('รหัสงบประมาณต้องเป็นตัวเลข 6 หลัก')
  if (new Set(codes).size !== codes.length) out.push('มีรายการงบประมาณซ้ำซ้อน (รหัสซ้ำ)')
  if (p.items.some((i) => !i.name.trim())) out.push('กรุณาระบุชื่อรายการงบประมาณให้ครบ')
  const limit = allocation[p.office]
  if (limit && sumBy(p.items, 'init') > limit) out.push(`งบประมาณตั้งต้นรวมเกินวงเงินที่ได้รับจัดสรร (${limit.toLocaleString('en-US')} บาท)`)
  return out
}

export function submitPlan(p: Plan, by: string) {
  const prev = plans.get(p.id)
  const event = { at: stamp(), by, action: prev?.status === 'returned' ? 'แก้ไขและยื่นแผนใหม่' : 'ยื่นแผน' }
  plans.save({ ...p, status: 'submitted', review: undefined, history: [...p.history, event] })
}
export function reviewPlan(id: number, decision: 'approve' | 'reject' | 'return', reason: string, by: string) {
  const p = plans.get(id)
  if (!p) return
  const at = stamp()
  const label = { approve: 'อนุมัติ', reject: 'ไม่อนุมัติ', return: 'ส่งกลับแก้ไข' }[decision]
  const status = ({ approve: 'approved', reject: 'rejected', return: 'returned' } as const)[decision]
  const approvedItems = decision === 'approve' ? p.items.map((i) => ({ ...i, approved: i.init, annual: i.init })) : p.items
  plans.save({ ...p, status, items: approvedItems, review: { decision, reason, by, at }, history: [...p.history, { at, by, action: label, note: reason }, { at, by: 'ระบบ', action: 'แจ้งเตือนผลการพิจารณา', note: `ถึง ${p.creator} (${p.office})` }] })
}

/** A report updates the risk: residual level and status; a closed risk leaves the open list (ปิดความเสี่ยง) and "ยังควบคุมไม่ได้" rolls over to the next period (ทบความเสี่ยง) */
export function submitReport(r: Omit<RiskReport, 'id' | 'at'>) {
  const rep: RiskReport = { ...r, id: reports.next(), at: stamp() }
  reports.save(rep)
  if (r.submitted) {
    const k = risks.get(r.riskId)
    if (k) {
      const resid = Math.max(1, Math.min(25, Number(r.residual) || k.residual))
      risks.save({ ...k, residual: resid, status: r.state === 'ปิดความเสี่ยงแล้ว' ? 'closed' : 'open', updatedAt: stamp() })
    }
  }
  return rep
}
export const personaName = (p: Persona) => personas[p].name
