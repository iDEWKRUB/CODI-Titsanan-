// ERP BOOKING — งานจองออนไลน์ (book 3 §2.1.10, process from book 1 §2.2.8)
import { thDate } from './erpProject'
import { stamp } from './strategic'

export { stamp, thDate }

// ---- who is looking (demo persona; the real system reads this from SSO) -------------------------
export type BPersona = 'staff' | 'approver' | 'central'
export const bPersonas: Record<BPersona, { short: string; name: string }> = {
  staff: { short: 'เจ้าหน้าที่ พอช.', name: 'ปริยดา เจริญวัฒนกุล' },
  approver: { short: 'ผู้มีอำนาจอนุมัติการจอง (หัวหน้างานอาคารและสถานที่)', name: 'สมศักดิ์ ธนาวุฒิ' },
  central: { short: 'เจ้าหน้าที่สำนักบริหารงานกลาง', name: 'อนุชา พรหมมา' },
}
export const canApprove = (p: BPersona) => p !== 'staff'

// ---- resources ----------------------------------------------------------------------------------
export type BKind = 'room' | 'zoom' | 'vehicle' | 'borrow'
export const kindMeta: Record<BKind, { label: string; short: string; ref: string; path: string; unit: string }> = {
  room: { label: 'จองห้องประชุม', short: 'ห้องประชุม', ref: '2.1.10.2', path: '/booking/room', unit: 'ห้อง' },
  zoom: { label: 'จอง Zoom Meeting', short: 'Zoom', ref: '2.1.10.3', path: '/booking/zoom', unit: 'บัญชี' },
  vehicle: { label: 'จองยานพาหนะ', short: 'ยานพาหนะ', ref: '2.1.10.4', path: '/booking/vehicle', unit: 'คัน' },
  borrow: { label: 'ยืมพัสดุ/ครุภัณฑ์', short: 'ยืมพัสดุ-ครุภัณฑ์', ref: '2.1.10.5', path: '/booking/borrow', unit: 'รายการ' },
}
export const kinds: BKind[] = ['room', 'vehicle', 'zoom', 'borrow']

export type Resource = { id: string; kind: BKind; name: string; sub: string; cap?: number; stock?: number }
export const resources: Resource[] = [
  { id: 'R1', kind: 'room', name: 'ห้องประชุมใหญ่ ชั้น 5', sub: 'อาคาร A · 80 ที่นั่ง', cap: 80 },
  { id: 'R2', kind: 'room', name: 'ห้องประชุม 1', sub: 'อาคาร A ชั้น 3 · 20 ที่นั่ง', cap: 20 },
  { id: 'R3', kind: 'room', name: 'ห้องประชุม 2', sub: 'อาคาร A ชั้น 3 · 12 ที่นั่ง', cap: 12 },
  { id: 'R4', kind: 'room', name: 'ห้องประชุมกลุ่มย่อย', sub: 'อาคาร B ชั้น 2 · 8 ที่นั่ง', cap: 8 },
  { id: 'Z1', kind: 'zoom', name: 'Zoom บัญชี 1', sub: 'zoom01@codi.or.th · 300 ผู้เข้าร่วม', cap: 300 },
  { id: 'Z2', kind: 'zoom', name: 'Zoom บัญชี 2', sub: 'zoom02@codi.or.th · 100 ผู้เข้าร่วม', cap: 100 },
  { id: 'Z3', kind: 'zoom', name: 'Zoom บัญชี 3', sub: 'zoom03@codi.or.th · 100 ผู้เข้าร่วม', cap: 100 },
  { id: 'V1', kind: 'vehicle', name: 'รถตู้ กข 1234 กทม.', sub: 'รถตู้ 12 ที่นั่ง', cap: 12 },
  { id: 'V2', kind: 'vehicle', name: 'รถเก๋ง 3กพ 5678 กทม.', sub: 'รถเก๋ง 4 ที่นั่ง', cap: 4 },
  { id: 'V3', kind: 'vehicle', name: 'รถกระบะ ฮธ 9012 กทม.', sub: 'รถกระบะ 4 ประตู', cap: 5 },
  { id: 'B1', kind: 'borrow', name: 'โปรเจกเตอร์พกพา', sub: 'ครุภัณฑ์ · คงเหลือ 4 เครื่อง', stock: 4 },
  { id: 'B2', kind: 'borrow', name: 'ลำโพงประชุมพร้อมไมค์', sub: 'ครุภัณฑ์ · คงเหลือ 3 ชุด', stock: 3 },
  { id: 'B3', kind: 'borrow', name: 'โน้ตบุ๊กสำหรับยืม', sub: 'ครุภัณฑ์ · คงเหลือ 6 เครื่อง', stock: 6 },
  { id: 'B4', kind: 'borrow', name: 'กล้องถ่ายภาพ DSLR', sub: 'ครุภัณฑ์ · คงเหลือ 2 ตัว', stock: 2 },
  { id: 'B5', kind: 'borrow', name: 'เต็นท์พับ 3x3 เมตร', sub: 'ครุภัณฑ์ · คงเหลือ 10 หลัง', stock: 10 },
]
export const resOf = (id: string) => resources.find((r) => r.id === id)

export const roomExtras = ['บันทึก Zoom conference', 'เครื่องคอมพิวเตอร์สำหรับนำเสนองาน', 'อุปกรณ์สำหรับ Video Conference']
export const vehicleExtras = ['อุปกรณ์ติดต่อสื่อสาร', 'Baby Car seat', 'เครื่องเสียงพกพา']
export const borrowTypes = ['ยืมใช้งานภายใน', 'ยืมเพื่อจัดกิจกรรม', 'ยืมไปใช้ในพื้นที่ชุมชน']

// ---- bookings -----------------------------------------------------------------------------------
export type BStatus = 'รออนุมัติ' | 'อนุมัติ' | 'ไม่อนุมัติ' | 'เสร็จสมบูรณ์' | 'ยกเลิก'
export const statusTone: Record<BStatus, { tone: string; dot: string }> = {
  รออนุมัติ: { tone: 'bg-[#fff1d6] text-[#a8650b]', dot: 'bg-[#e08a00]' },
  อนุมัติ: { tone: 'bg-[#dff5e8] text-[#0f8a63]', dot: 'bg-[#16a571]' },
  ไม่อนุมัติ: { tone: 'bg-[#ffe3e3] text-[#c13232]', dot: 'bg-[#dc3b3b]' },
  เสร็จสมบูรณ์: { tone: 'bg-[#e8f1ff] text-[#2057c9]', dot: 'bg-[#2b6bf0]' },
  ยกเลิก: { tone: 'bg-gray-bg text-gray-30', dot: 'bg-gray-20' },
}
export type BEvent = { at: string; by: string; action: string; note?: string }
export type Booking = {
  id: number
  no: string // BK-YYMM-nnnn
  kind: BKind
  resId: string
  title: string
  detail: string
  date: string // ISO start date
  endDate: string // ISO end date (borrow = return date, vehicle may span days)
  start: string // HH:mm
  end: string
  allDay: boolean
  pax: number // attendees (room/zoom) or passengers (vehicle) or quantity (borrow)
  extras: string[]
  from: string
  to: string
  borrowType: string
  status: BStatus
  by: string
  createdAt: string
  history: BEvent[]
}

export const DAY_START = 8
export const DAY_END = 18
export const hours = Array.from({ length: DAY_END - DAY_START }, (_, i) => DAY_START + i)
export const hh = (h: number) => `${String(h).padStart(2, '0')}:00`
export const hourOf = (t: string) => Number(t.slice(0, 2))
export const isoDay = (d: Date) => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
export const addDays = (n: number, from = new Date()) => { const d = new Date(from); d.setDate(d.getDate() + n); return isoDay(d) }
export const daysBetween = (a: string, b: string) => Math.max(1, Math.round((+new Date(b) - +new Date(a)) / 86400000) + 1)
export const nextBookingNo = (list: Booking[]) => {
  const d = new Date()
  const p = `BK-${String(d.getFullYear() + 543).slice(2)}${String(d.getMonth() + 1).padStart(2, '0')}-`
  const n = list.filter((b) => b.no.startsWith(p)).length + 1
  return p + String(n).padStart(4, '0')
}

/** hours a booking occupies on a given day (all-day = whole working day; multi-day vehicle/borrow = whole days in between) */
export function busyHours(b: Booking, day: string): number[] {
  if (b.status === 'ไม่อนุมัติ' || b.status === 'ยกเลิก') return []
  if (day < b.date || day > b.endDate) return []
  if (b.allDay || b.date !== b.endDate) {
    const s = day === b.date && !b.allDay ? hourOf(b.start) : DAY_START
    const e = day === b.endDate && !b.allDay ? hourOf(b.end) : DAY_END
    return hours.filter((h) => h >= s && h < e)
  }
  return hours.filter((h) => h >= hourOf(b.start) && h < hourOf(b.end))
}

/** what is already taken for one resource on one day: pending shows as "รออนุมัติ", approved as "ไม่ว่าง" */
export function dayMap(list: Booking[], resId: string, day: string, ignoreId?: number) {
  const m = new Map<number, { st: BStatus; title: string }>()
  for (const b of list) if (b.resId === resId && b.id !== ignoreId) for (const h of busyHours(b, day)) m.set(h, { st: b.status, title: b.title })
  return m
}

/** borrowed quantity of an item over a date range */
export const borrowedQty = (list: Booking[], resId: string, from: string, to: string, ignoreId?: number) =>
  list.filter((b) => b.resId === resId && b.id !== ignoreId && b.status !== 'ไม่อนุมัติ' && b.status !== 'ยกเลิก' && b.date <= to && b.endDate >= from).reduce((s, b) => s + b.pax, 0)

const ev = (at: string, by: string, action: string, note?: string): BEvent => ({ at, by, action, note })
const base = { detail: '', extras: [] as string[], from: '', to: '', borrowType: '', allDay: false, pax: 1 }
export const seedBookings = (): Booking[] => {
  const u = bPersonas.staff.name, u2 = 'วรรณา ศรีสุข', u3 = 'ธนพล กิตติพันธ์', ap = bPersonas.approver.name
  const t = (n: number, hm = '09:30') => `${addDays(n)} ${hm}`
  const list: Booking[] = [
    { ...base, id: 1, no: 'BK-6911-0001', kind: 'room', resId: 'R2', title: 'ประชุมทีมแผนงานประจำสัปดาห์', detail: 'ติดตามความคืบหน้าแผนงานปี 2569', date: addDays(2), endDate: addDays(2), start: '09:00', end: '12:00', pax: 14, extras: ['เครื่องคอมพิวเตอร์สำหรับนำเสนองาน'], status: 'รออนุมัติ', by: u, createdAt: t(-1, '14:05'), history: [ev(t(-1, '14:05'), u, 'ส่งคำขอจองห้องประชุม')] },
    { ...base, id: 2, no: 'BK-6911-0002', kind: 'vehicle', resId: 'V1', title: 'ลงพื้นที่สำรวจชุมชน จ.นครสวรรค์', detail: 'เดินทางไปประชุมกลุ่มผู้นำชุมชน', date: addDays(5), endDate: addDays(6), start: '06:00', end: '18:00', pax: 7, from: 'สำนักงาน พอช. ลาดพร้าว', to: 'ศาลากลางหมู่บ้าน ต.หนองกรด จ.นครสวรรค์', extras: ['อุปกรณ์ติดต่อสื่อสาร'], status: 'รออนุมัติ', by: u, createdAt: t(-1, '16:20'), history: [ev(t(-1, '16:20'), u, 'ส่งคำขอจองยานพาหนะ')] },
    { ...base, id: 3, no: 'BK-6911-0003', kind: 'zoom', resId: 'Z1', title: 'อบรมออนไลน์การเขียนข้อเสนอโครงการ', detail: 'ผู้เข้าอบรมจากสำนักงานภาค 4 ภูมิภาค', date: addDays(3), endDate: addDays(3), start: '13:00', end: '16:00', pax: 120, status: 'อนุมัติ', by: u, createdAt: t(-3, '10:12'), history: [ev(t(-3, '10:12'), u, 'ส่งคำขอจอง Zoom Meeting'), ev(t(-2, '09:02'), ap, 'อนุมัติ', 'ใช้บัญชีที่ 1 ตามที่ขอ')] },
    { ...base, id: 4, no: 'BK-6911-0004', kind: 'borrow', resId: 'B1', title: 'ยืมโปรเจกเตอร์จัดเวทีประชาคม', detail: 'จัดเวทีประชาคมหมู่บ้านที่ อ.แม่แตง', date: addDays(4), endDate: addDays(7), start: '08:00', end: '17:00', pax: 1, borrowType: 'ยืมไปใช้ในพื้นที่ชุมชน', status: 'รออนุมัติ', by: u2, createdAt: t(-1, '09:40'), history: [ev(t(-1, '09:40'), u2, 'ส่งคำขอยืมพัสดุ/ครุภัณฑ์')] },
    { ...base, id: 5, no: 'BK-6911-0005', kind: 'room', resId: 'R1', title: 'สัมมนาแลกเปลี่ยนเรียนรู้เครือข่ายสภาองค์กรชุมชน', detail: 'ผู้เข้าร่วมจากทุกภาค', date: addDays(1), endDate: addDays(1), start: '08:00', end: '17:00', allDay: true, pax: 70, extras: ['อุปกรณ์สำหรับ Video Conference', 'บันทึก Zoom conference'], status: 'อนุมัติ', by: u3, createdAt: t(-6, '11:00'), history: [ev(t(-6, '11:00'), u3, 'ส่งคำขอจองห้องประชุม'), ev(t(-5, '08:45'), ap, 'อนุมัติ')] },
    { ...base, id: 6, no: 'BK-6911-0006', kind: 'room', resId: 'R2', title: 'ประชุมคณะทำงานกองทุน', detail: '', date: addDays(2), endDate: addDays(2), start: '14:00', end: '16:00', pax: 10, status: 'อนุมัติ', by: u2, createdAt: t(-4, '15:30'), history: [ev(t(-4, '15:30'), u2, 'ส่งคำขอจองห้องประชุม'), ev(t(-3, '08:20'), ap, 'อนุมัติ')] },
    { ...base, id: 7, no: 'BK-6910-0009', kind: 'vehicle', resId: 'V2', title: 'ไปราชการ กรมการพัฒนาชุมชน', detail: '', date: addDays(-6), endDate: addDays(-6), start: '09:00', end: '15:00', pax: 3, from: 'สำนักงาน พอช.', to: 'กรมการพัฒนาชุมชน', status: 'เสร็จสมบูรณ์', by: u, createdAt: t(-10, '10:00'), history: [ev(t(-10, '10:00'), u, 'ส่งคำขอจองยานพาหนะ'), ev(t(-9, '09:00'), ap, 'อนุมัติ'), ev(t(-6, '15:10'), bPersonas.central.name, 'ใช้งานเสร็จสมบูรณ์')] },
    { ...base, id: 8, no: 'BK-6910-0011', kind: 'room', resId: 'R3', title: 'ประชุมหารือแผนงบประมาณ', detail: '', date: addDays(-4), endDate: addDays(-4), start: '10:00', end: '11:00', pax: 6, status: 'ไม่อนุมัติ', by: u, createdAt: t(-8, '13:00'), history: [ev(t(-8, '13:00'), u, 'ส่งคำขอจองห้องประชุม'), ev(t(-7, '09:10'), ap, 'ไม่อนุมัติ', 'ห้องถูกจัดสรรให้การประชุมคณะกรรมการ กรุณาเลือกห้องหรือช่วงเวลาอื่น')] },
    { ...base, id: 9, no: 'BK-6910-0014', kind: 'borrow', resId: 'B3', title: 'ยืมโน้ตบุ๊กอบรมเชิงปฏิบัติการ', detail: '', date: addDays(-9), endDate: addDays(-7), start: '08:00', end: '17:00', pax: 5, borrowType: 'ยืมเพื่อจัดกิจกรรม', status: 'เสร็จสมบูรณ์', by: u, createdAt: t(-14, '09:00'), history: [ev(t(-14, '09:00'), u, 'ส่งคำขอยืมพัสดุ/ครุภัณฑ์'), ev(t(-13, '10:00'), ap, 'อนุมัติ'), ev(t(-7, '16:00'), bPersonas.central.name, 'รับคืนพัสดุครบถ้วน')] },
  ]
  return list
}
