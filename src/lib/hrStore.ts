import { useSyncExternalStore } from 'react'
import { seedCareers, seedEmployees, seedEvals, seedReqs, seedRuns, seedTrainings, stamp, workDays, type Career, type Employee, type Evaluation, type HPersona, type HrReq, type PayRun, type ReqKind, type Training } from '../data/erpHr'
import { makeStore } from './localStore'

export const emps = makeStore<Employee>('codi.hr.emps', seedEmployees)
export const reqs = makeStore<HrReq>('codi.hr.reqs', seedReqs)
export const evals = makeStore<Evaluation>('codi.hr.evals', seedEvals)
export const runs = makeStore<PayRun>('codi.hr.payroll', seedRuns)
export const trainings = makeStore<Training>('codi.hr.trainings', seedTrainings)
export const careers = makeStore<Career>('codi.hr.careers', seedCareers)
export const useEmps = emps.use
export const useReqs = reqs.use
export const useEvals = evals.use
export const useRuns = runs.use
export const useTrainings = trainings.use
export const useCareers = careers.use
/** the signed-in staff member (demo account) */
export const ME = 1
export const useMe = () => useEmps().find((e) => e.id === ME) ?? emps.all()[0]

// ---- persona --------------------------------------------------------------------------------------
const KEY = 'codi.hr.me'
const saved = localStorage.getItem(KEY) as HPersona | null
let me: HPersona = saved === 'head' || saved === 'hr' || saved === 'finance' ? saved : 'staff'
const ls = new Set<() => void>()
export const setHPersona = (p: HPersona) => {
  me = p
  localStorage.setItem(KEY, p)
  ls.forEach((l) => l())
}
export const useHPersona = () =>
  useSyncExternalStore(
    (cb) => {
      ls.add(cb)
      return () => ls.delete(cb)
    },
    () => me,
  )

const prefix: Record<ReqKind, string> = { cert: 'HR-CERT', ot: 'HR-OT', welfare: 'HR-WEL', leave: 'HR-LEAVE' }
export const nextReqNo = (k: ReqKind) => `${prefix[k]}-${String(reqs.all().filter((r) => r.kind === k).length + 1).padStart(4, '0')}`
export function submitReq(r: Omit<HrReq, 'id' | 'no' | 'status' | 'createdAt' | 'empId'>) {
  const rec: HrReq = { ...r, id: reqs.next(), no: nextReqNo(r.kind), status: 'submitted', createdAt: stamp(), empId: ME } as HrReq
  reqs.save(rec)
  return rec
}
export const decideReq = (id: number, approve: boolean, reason: string, by: string) => reqs.update(id, (r) => ({ ...r, status: approve ? 'approved' : 'rejected', decision: { approve, reason, by, at: stamp() } }))

/** leave already taken (submitted or approved) by type in the fiscal year that contains `on` */
export function leaveUsed(type: string, on = new Date().toISOString().slice(0, 10), empId = ME) {
  const [y, m] = on.split('-').map(Number)
  const fyStart = `${m >= 10 ? y : y - 1}-10-01`, fyEnd = `${m >= 10 ? y + 1 : y}-09-30`
  return reqs.all().filter((r) => r.kind === 'leave' && r.empId === empId && r.leaveType === type && r.status !== 'rejected' && (r.from ?? '') >= fyStart && (r.from ?? '') <= fyEnd).reduce((a, r) => a + (r.days ?? workDays(r.from ?? '', r.to ?? '')), 0)
}
export function welfareUsed(type: string, year = new Date().getFullYear(), empId = ME) {
  return reqs.all().filter((r) => r.kind === 'welfare' && r.empId === empId && r.welfareType === type && r.status !== 'rejected' && r.createdAt.startsWith(String(year))).reduce((a, r) => a + (r.welfareItems ?? []).reduce((b, i) => b + (Number(i.amount) || 0), 0), 0)
}

/** one line for "AI สรุปข่าวสำคัญ" on the CODI APP home page */
export function aiHrLine() {
  const all = reqs.all()
  const certWait = all.filter((r) => r.kind === 'cert' && r.status === 'submitted').length
  const leaveWait = all.filter((r) => r.kind === 'leave' && r.status === 'submitted').length
  const last = [...runs.all()].sort((a, b) => b.id - a.id)[0]
  return `หนังสือรับรองรอลงนาม ${certWait} ฉบับ · ใบลารอพิจารณา ${leaveWait} รายการ${last ? ` · รอบเงินเดือนล่าสุด ${last.no} ${last.status === 'paid' ? 'ชำระแล้ว' : 'รอชำระ'}` : ''}`
}
