import { useSyncExternalStore } from 'react'
import { blankClosure, blankDisb, seedProjects, type Disbursement, type Project } from '../data/projects'
import { makeStore } from './localStore'

const projects = makeStore<Project>('codi.projects', seedProjects, (p) => ({ ...p, closure: { ...blankClosure(), ...p.closure }, reports: p.reports ?? [], timeline: p.timeline ?? [] }))
export const useProjects = projects.use
export const getProject = projects.get
export const nextProjectId = projects.next
export const saveProject = projects.save
export const updateProject = projects.update
export const deleteProject = projects.remove

const disb = makeStore<Disbursement>('codi.disbursements', () => [])
export const useDisbursements = disb.use
export const getDisbursement = disb.get
export const nextDisbId = disb.next
export const saveDisbursement = disb.save
export const updateDisbursement = disb.update
export const deleteDisbursement = disb.remove

// ---- demo role switch (community applicant ↔ OSS staff) -------------------------------------
export type PmRole = 'community' | 'staff'
const ROLE_KEY = 'codi.pmRole'
let role: PmRole = (localStorage.getItem(ROLE_KEY) as PmRole) === 'staff' ? 'staff' : 'community'
const roleListeners = new Set<() => void>()
export const setPmRole = (r: PmRole) => {
  role = r
  localStorage.setItem(ROLE_KEY, r)
  roleListeners.forEach((l) => l())
}
export const usePmRole = () =>
  useSyncExternalStore(
    (cb) => {
      roleListeners.add(cb)
      return () => roleListeners.delete(cb)
    },
    () => role,
  )

/** New draft disbursement request for a project; returns its id */
export function createDisbursement(p: Project) {
  const id = disb.next()
  disb.save(blankDisb(id, p))
  return id
}
