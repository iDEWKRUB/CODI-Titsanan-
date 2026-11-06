import { useSyncExternalStore } from 'react'
import { defaultPins, defaultSarabanPins, defaultFinancePins, defaultFundingPins, defaultHrPins, defaultAssetPins, defaultEdocPins, defaultBookingPins, defaultAgreementPins, defaultNotifyPins, defaultReportPins, defaultComplaintPins, defaultCkbPins, defaultProjectPins, defaultStrategicPins, pinCatalogFor } from '../data/navigation'
import { getSystem, useSystem, type SystemKey } from './systemStore'

export const MAX_PINS = 8
// OSS keeps its original key so existing pins survive; every other system gets its own list
const keyOf = (s: SystemKey) => (s === 'oss' ? 'codi.pinnedMenus' : 'codi.pinnedMenus.' + s)
const defaultsOf = (s: SystemKey) => (s === 'saraban' ? defaultSarabanPins : s === 'strategic' ? defaultStrategicPins : s === 'project' ? defaultProjectPins : s === 'finance' ? defaultFinancePins : s === 'funding' ? defaultFundingPins : s === 'hr' ? defaultHrPins : s === 'asset' ? defaultAssetPins : s === 'booking' ? defaultBookingPins : s === 'agreement' ? defaultAgreementPins : s === 'notify' ? defaultNotifyPins : s === 'report' ? defaultReportPins : s === 'complaint' ? defaultComplaintPins : s === 'ckb' ? defaultCkbPins : s === 'edoc' ? defaultEdocPins : defaultPins)
const clean = (s: SystemKey, xs: unknown): string[] => (Array.isArray(xs) ? xs.filter((x): x is string => typeof x === 'string' && pinCatalogFor(s).some((p) => p.to === x)) : defaultsOf(s))
const load = (s: SystemKey): string[] => {
  try {
    const raw = localStorage.getItem(keyOf(s))
    return raw ? clean(s, JSON.parse(raw)) : defaultsOf(s)
  } catch {
    return defaultsOf(s)
  }
}

const state: Record<SystemKey, string[]> = { oss: load('oss'), saraban: load('saraban'), strategic: load('strategic'), project: load('project'), finance: load('finance'), funding: load('funding'), hr: load('hr'), ckb: load('ckb'), complaint: load('complaint'), report: load('report'), notify: load('notify'), agreement: load('agreement'), booking: load('booking'), asset: load('asset'), edoc: load('edoc') }
const listeners = new Set<() => void>()
const commit = (s: SystemKey, next: string[]) => {
  state[s] = next
  localStorage.setItem(keyOf(s), JSON.stringify(next))
  listeners.forEach((l) => l())
}
const subscribe = (cb: () => void) => {
  listeners.add(cb)
  return () => listeners.delete(cb)
}

/** Pins of the system the user is in (OSS and SARABAN are set up separately) */
export const usePins = () => {
  const s = useSystem()
  return useSyncExternalStore(subscribe, () => state[s])
}
const cur = () => getSystem()
export const addPin = (to: string) => {
  const s = cur()
  if (!state[s].includes(to) && state[s].length < MAX_PINS) commit(s, [...state[s], to])
}
export const removePin = (to: string) => commit(cur(), state[cur()].filter((x) => x !== to))
export const movePin = (to: string, dir: -1 | 1) => {
  const s = cur()
  const i = state[s].indexOf(to)
  const j = i + dir
  if (i < 0 || j < 0 || j >= state[s].length) return
  const next = state[s].slice()
  ;[next[i], next[j]] = [next[j], next[i]]
  commit(s, next)
}
export const resetPins = () => commit(cur(), defaultsOf(cur()))
