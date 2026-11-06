import { useSyncExternalStore } from 'react'
import { addDays, kPersonas, seedDocs, seedEnrolls, stamp, type Enroll, type KDoc, type KPersona } from '../data/erpCkb'
import { makeStore } from './localStore'

export const docs = makeStore<KDoc>('codi.ckb.docs', seedDocs)
export const enrolls = makeStore<Enroll>('codi.ckb.enrolls', seedEnrolls)
export const useDocs = docs.use
export const useEnrolls = enrolls.use

const KEY = 'codi.ckb.me'
let me: KPersona = localStorage.getItem(KEY) === 'admin' ? 'admin' : 'staff'
const ls = new Set<() => void>()
export const setKPersona = (p: KPersona) => { me = p; localStorage.setItem(KEY, p); ls.forEach((l) => l()) }
export const useKPersona = () => useSyncExternalStore((cb) => { ls.add(cb); return () => ls.delete(cb) }, () => me)
export const kWho = () => kPersonas[me].name

/** a new version of a document keeps the old ones in its history (book 1: "แก้ไขข้อมูลพร้อมเก็บบันทึกประวัติ") */
export function newVersion(d: KDoc, patch: Partial<KDoc>, note: string, nextReviewDays = 180) {
  const v = d.version + 1
  docs.save({ ...d, ...patch, version: v, updatedAt: addDays(0), reviewBy: addDays(nextReviewDays), history: [...d.history, { v, at: stamp(), by: kWho(), note }] })
}
let cert = 31
export const nextCert = () => `CERT-${new Date().getFullYear() + 543}-${String(++cert + enrolls.all().filter((e) => e.certNo).length).padStart(4, '0')}`
