import { useSyncExternalStore } from 'react'
import { aPersonas, seedAnnounces, seedAssets, seedImports, seedRepairs, stamp, type APersona, type Announce, type Asset, type ImportDoc, type Repair, type RepairEvent, type RepairStatus } from '../data/erpAsset'
import { makeStore } from './localStore'

export const assets = makeStore<Asset>('codi.asset.items', seedAssets)
export const imports = makeStore<ImportDoc>('codi.asset.imports', seedImports)
export const announces = makeStore<Announce>('codi.asset.announces', seedAnnounces)
export const repairs = makeStore<Repair>('codi.asset.repairs', seedRepairs)
export const useAssets = assets.use
export const useImports = imports.use
export const useAnnounces = announces.use
export const useRepairs = repairs.use

// ---- persona --------------------------------------------------------------------------------------
const KEY = 'codi.asset.me'
let me: APersona = localStorage.getItem(KEY) === 'central' ? 'central' : 'staff'
const ls = new Set<() => void>()
export const setAPersona = (p: APersona) => {
  me = p
  localStorage.setItem(KEY, p)
  ls.forEach((l) => l())
}
export const useAPersona = () =>
  useSyncExternalStore(
    (cb) => {
      ls.add(cb)
      return () => ls.delete(cb)
    },
    () => me,
  )
export const whoAmI = () => aPersonas[me].name

/** central office acts on a repair (book 1 §2.2.7): confirm the damage, then repair or dispose; a repair later closes as done */
export type RepairAction = 'ส่งซ่อม' | 'จำหน่าย' | 'ซ่อมเสร็จ'
export function actRepair(id: number, action: RepairAction, note?: string, cost?: number) {
  const r = repairs.get(id)
  if (!r) return
  const at = stamp(), by = whoAmI()
  const status: RepairStatus = action === 'ส่งซ่อม' ? 'กำลังซ่อม' : action === 'ซ่อมเสร็จ' ? 'ซ่อมเสร็จ' : 'จำหน่าย'
  const events: RepairEvent[] = [
    ...(r.status === 'รอตรวจสอบ' ? [{ at, by, action: 'ยืนยันการชำรุด' }] : []),
    { at, by, action: action === 'จำหน่าย' ? 'จำหน่าย (ตัดออกจากทะเบียน)' : action, note: note || undefined },
  ]
  repairs.save({ ...r, status, cost: cost ?? r.cost, history: [...r.history, ...events] })
  // keep the register in step with the repair
  const a = assets.all().find((x) => x.code === r.assetCode)
  if (a && a.kind === 'ครุภัณฑ์') assets.save({ ...a, state: action === 'ซ่อมเสร็จ' ? 'ใช้งานได้' : action === 'จำหน่าย' ? 'จำหน่ายแล้ว' : 'ส่งซ่อม' })
}
