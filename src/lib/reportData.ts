import { repairTone, type RepairStatus } from '../data/erpAsset'
import { statusTone as bookingStatuses, kindMeta, kinds } from '../data/erpBooking'
import { types } from '../data/erpAgreement'
import { cTone } from '../data/erpAgreement'
import { staticSets, type Dash, type Dataset } from '../data/erpReport'
import { assets, repairs, useAssets, useRepairs } from './assetStore'
import { bookings, useBookings } from './bookingStore'
import { contracts, useContracts } from './agreementStore'
import { notices, useNotices } from './notifyStore'
import { makeStore } from './localStore'

export type Msg = { id: number; role: 'user' | 'bot'; text: string; report?: string; at: string }
export const chat = makeStore<Msg>('codi.report.chat', () => [])
export const dashboards = makeStore<Dash>('codi.report.dashboards', () => [])
export const useChat = chat.use
export const useDashboards = dashboards.use

const count = <T,>(list: T[], keys: string[], pick: (x: T) => string) => keys.map((k) => ({ label: k, value: list.filter((x) => pick(x) === k).length }))

/** the catalogue of datasets a chart can draw from — the "live" ones are computed from what is in the portal right now */
export function dataset(key: string): Dataset | undefined {
  const s = staticSets[key]
  if (s) return { key, live: false, ...s }
  switch (key) {
    case 'contract-status': return { key, live: true, title: 'สัญญาแยกตามสถานะ', source: 'ERP AGREEMENT', unit: 'ฉบับ', kind: 'donut', items: count(contracts.all(), Object.keys(cTone), (c) => c.status).filter((i) => i.value > 0) }
    case 'contract-type': return { key, live: true, title: 'สัญญาแยกตามประเภท', source: 'ERP AGREEMENT', unit: 'ฉบับ', kind: 'barh', items: types.map((t) => ({ label: t.tag, value: contracts.all().filter((c) => c.type === t.key).length })).filter((i) => i.value > 0) }
    case 'booking-kind': return { key, live: true, title: 'คำขอจองแยกตามประเภท', source: 'ERP BOOKING', unit: 'คำขอ', kind: 'bar', items: kinds.map((k) => ({ label: kindMeta[k].short, value: bookings.all().filter((b) => b.kind === k).length })) }
    case 'booking-status': return { key, live: true, title: 'คำขอจองแยกตามสถานะ', source: 'ERP BOOKING', unit: 'คำขอ', kind: 'donut', items: count(bookings.all(), Object.keys(bookingStatuses), (b) => b.status).filter((i) => i.value > 0) }
    case 'asset-state': return { key, live: true, title: 'ทะเบียนพัสดุ-ครุภัณฑ์แยกตามสภาพ', source: 'ERP ASSET', unit: 'รายการ', kind: 'bar', items: count(assets.all(), ['ใช้งานได้', 'ชำรุด', 'ส่งซ่อม', 'จำหน่ายแล้ว'], (a) => a.state) }
    case 'repair-status': return { key, live: true, title: 'รายการแจ้งซ่อมแยกตามสถานะ', source: 'ERP ASSET', unit: 'รายการ', kind: 'donut', items: count(repairs.all(), Object.keys(repairTone) as RepairStatus[], (r) => r.status).filter((i) => i.value > 0) }
    case 'notify-sev': return { key, live: true, title: 'การแจ้งเตือนแยกตามระดับ', source: 'AI NOTIFICATION', unit: 'รายการ', kind: 'bar', items: count(notices.all(), ['ทั่วไป', 'ปานกลาง', 'สูง'], (n) => n.severity) }
    case 'notify-status': return { key, live: true, title: 'การแจ้งเตือนแยกตามสถานะ', source: 'AI NOTIFICATION', unit: 'รายการ', kind: 'donut', items: count(notices.all(), ['ใหม่', 'รอดำเนินการ', 'ตอบสนองแล้ว', 'ตั้งเวลา'], (n) => n.status).filter((i) => i.value > 0) }
  }
  return undefined
}
export const datasetKeys = ['org-region', 'org-type', 'kpi', 'budget-month', 'contract-status', 'contract-type', 'booking-kind', 'booking-status', 'asset-state', 'repair-status', 'notify-sev', 'notify-status']

/** call inside a component so it re-renders when any of the underlying stores change */
export function useDatasetVersion() {
  useAssets(); useRepairs(); useBookings(); useContracts(); useNotices()
}
