import { useSyncExternalStore } from 'react'

export type SystemKey = 'oss' | 'saraban' | 'strategic' | 'project' | 'finance' | 'funding' | 'hr' | 'asset' | 'edoc' | 'booking' | 'agreement' | 'notify' | 'report'
const KEY = 'codi.system'
const saved = localStorage.getItem(KEY)
let cur: SystemKey = saved === 'saraban' || saved === 'strategic' || saved === 'project' || saved === 'finance' || saved === 'funding' || saved === 'hr' || saved === 'asset' || saved === 'edoc' || saved === 'booking' || saved === 'agreement' || saved === 'notify' || saved === 'report' ? saved : 'oss'
const ls = new Set<() => void>()
export const getSystem = () => cur
export const setSystem = (s: SystemKey) => {
  if (s === cur) return
  cur = s
  localStorage.setItem(KEY, s)
  ls.forEach((l) => l())
}
export const useSystem = () =>
  useSyncExternalStore(
    (cb) => (ls.add(cb), () => ls.delete(cb)),
    () => cur,
  )
