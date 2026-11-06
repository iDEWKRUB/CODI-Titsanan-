// ERP FUNDING — งานบริหารกองทุน (TOR 4.7 (6), book 3 §2.1.5, flow from book 1 §2.2.4 บริหารกองทุน/หุ้นกู้)
import { stamp } from './strategic'
import { thDate } from './erpProject'

export { stamp, thDate }
export const money = (n: number) => n.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })
export const money0 = (n: number) => n.toLocaleString('en-US', { maximumFractionDigits: 0 })

// ---- demo persona -------------------------------------------------------------------------------
export type GPersona = 'staff' | 'director'
export const gPersonas: Record<GPersona, { short: string; name: string }> = {
  staff: { short: 'เจ้าหน้าที่ผู้รับผิดชอบ', name: 'ปริยดา เจริญวัฒนกุล' },
  director: { short: 'ผู้อำนวยการ', name: 'ธนากร พิทักษ์ชน' },
}

// ---- policy of the investment (set by the chairman — book 1 §2.2.4 "ข้อกำหนดการลงทุน") ----------
export const POLICY = { maxIssuerShare: 30 } // % of the portfolio in one issuer (example in book 1)

// ---- products you can search (กองทุน / หุ้นกู้) ---------------------------------------------------
export type Kind = 'fund' | 'bond'
export const kindLabel: Record<Kind, string> = { fund: 'กองทุน', bond: 'หุ้นกู้' }
export const riskOf = (lv: number) => (lv <= 2 ? 'ต่ำ' : lv === 3 ? 'ปานกลาง' : 'สูง')
export const riskTone = (lv: number) => (lv <= 2 ? 'bg-[#d8eefc] text-[#0b63c8]' : lv === 3 ? 'bg-[#e0f0ff] text-[#2b4fbf]' : 'bg-[#ffe3e3] text-[#c13232]')
export const fundTypes = ['กองทุนรวมตลาดเงิน', 'กองทุนรวมตราสารหนี้', 'กองทุนรวมผสม', 'กองทุนรวมหุ้น']
export const budgetTypes = ['เงินสำรองจ่าย', 'เงินทุนหมุนเวียน', 'เงินกองทุนพัฒนา']
export const years = ['2569', '2568']
export type Product = { id: number; name: string; kind: Kind; type: string; issuer: string; dividend: 'มี' | 'ไม่มี'; ret: number; lv: number; stars: 3 | 4 | 5; price: number; budgets: string[] }
const P = (id: number, name: string, kind: Kind, type: string, issuer: string, dividend: 'มี' | 'ไม่มี', ret: number, lv: number, stars: 3 | 4 | 5, price: number, budgets = budgetTypes): Product => ({ id, name, kind, type, issuer, dividend, ret, lv, stars, price, budgets })
export const products: Product[] = [
  P(1, 'KT-PRECIOUS', 'fund', 'กองทุนรวมตลาดเงิน', 'บลจ. กรุงไทย', 'มี', 2.5, 3, 5, 15.5),
  P(2, 'KT-MONEY-PLUS', 'fund', 'กองทุนรวมตลาดเงิน', 'บลจ. กรุงไทย', 'มี', 2.5, 3, 5, 12.3),
  P(3, 'SCBMMF-A', 'fund', 'กองทุนรวมตลาดเงิน', 'บลจ. ไทยพาณิชย์', 'ไม่มี', 1.05, 1, 4, 10.82),
  P(4, 'KBANK-MONEY', 'fund', 'กองทุนรวมตลาดเงิน', 'บลจ. กสิกรไทย', 'ไม่มี', 1.05, 2, 4, 10.4),
  P(5, 'BBL-FIXED-D', 'fund', 'กองทุนรวมตราสารหนี้', 'บลจ. กรุงเทพ', 'มี', 3.24, 4, 4, 11.2),
  P(6, 'KFSDIV-A', 'fund', 'กองทุนรวมตราสารหนี้', 'บลจ. กรุงศรี', 'มี', 3.24, 4, 3, 9.75),
  P(7, 'TMB-BALANCE', 'fund', 'กองทุนรวมผสม', 'บลจ. ทหารไทยธนชาต', 'มี', 4.1, 4, 4, 14.6),
  P(8, 'SCB-GROWTH', 'fund', 'กองทุนรวมผสม', 'บลจ. ไทยพาณิชย์', 'ไม่มี', 4.8, 5, 3, 18.3),
  P(9, 'KT-EQUITY', 'fund', 'กองทุนรวมหุ้น', 'บลจ. กรุงไทย', 'มี', 6.2, 5, 3, 21.1),
  P(10, 'BAY-INCOME', 'fund', 'กองทุนรวมตราสารหนี้', 'บลจ. กรุงศรี', 'มี', 2.9, 2, 5, 12.9),
  P(11, 'หุ้นกู้ ปตท. 2571', 'bond', 'หุ้นกู้ภาคเอกชน', 'บมจ. ปตท.', 'มี', 3.2, 2, 5, 1000),
  P(12, 'หุ้นกู้ ซีพี ออลล์ 2572', 'bond', 'หุ้นกู้ภาคเอกชน', 'บมจ. ซีพี ออลล์', 'มี', 3.6, 3, 4, 1000),
  P(13, 'หุ้นกู้ ทีโอที 2570', 'bond', 'หุ้นกู้รัฐวิสาหกิจ', 'บมจ. ทีโอที', 'มี', 2.8, 2, 4, 1000),
  P(14, 'หุ้นกู้ การไฟฟ้าฝ่ายผลิต 2573', 'bond', 'หุ้นกู้รัฐวิสาหกิจ', 'กฟผ.', 'มี', 3.0, 1, 5, 1000),
  P(15, 'หุ้นกู้ ไทยออยล์ 2571', 'bond', 'หุ้นกู้ภาคเอกชน', 'บมจ. ไทยออยล์', 'มี', 3.9, 3, 4, 1000),
  P(16, 'หุ้นกู้ อสังหาริมทรัพย์ 2570', 'bond', 'หุ้นกู้ภาคเอกชน', 'บจ. พัฒนาที่ดิน', 'มี', 5.4, 5, 3, 1000),
]

// ---- investments (รายการลงทุน) -------------------------------------------------------------------
export type InvStatus = 'draft' | 'ongoing' | 'done'
export const invStatus: Record<InvStatus, { label: string; tone: string }> = {
  draft: { label: 'แบบร่าง', tone: 'bg-gray-line text-gray-30' },
  ongoing: { label: 'อยู่ระหว่างลงทุน', tone: 'bg-[#e1f0ff] text-[#0b63c8]' },
  done: { label: 'เสร็จสิ้น', tone: 'bg-[#dff5e8] text-[#0f8a63]' },
}
export const channels = ['ธนาคารกรุงไทย', 'ธนาคารกรุงเทพ', 'ธนาคารออมสิน', 'บริษัทหลักทรัพย์จัดการกองทุน']
export const payments = ['โอนเงิน', 'เช็ค', 'หักบัญชีเงินฝาก']
export const targets = [2, 3, 3.75, 5]
export const riskLevels = [1, 2, 3, 4, 5]
export type IEvent = { at: string; by: string; action: string; note?: string }
export type Inv = {
  id: number
  productId: number
  name: string
  kind: Kind
  type: string
  issuer: string
  dividend: 'มี' | 'ไม่มี'
  ret: number
  lv: number
  price: number
  amount: number
  start: string
  end: string
  channel: string
  payment: string
  objective: string
  target: number // % acceptable return
  accept: number // acceptable risk level 1-5
  fy: string
  status: InvStatus
  rejected?: string // last rejection reason (back to draft)
  decision?: { approve: boolean; reason: string; by: string; at: string }
  createdBy: string
  events: IEvent[]
}
export const unitsOf = (amount: number, price: number) => (price > 0 ? amount / price : 0)
/** Fiscal year (starts 1 Oct) and quarter of a yyyy-mm-dd date, Buddhist year */
export const fyOf = (d: string) => { const [y, m] = d.split('-').map(Number); return { fy: String(y + 543 + (m >= 10 ? 1 : 0)), q: Math.floor(((m + 2) % 12) / 3) + 1 } }
const yearsBetween = (a: string, b: string) => Math.max(0, (new Date(b).getTime() - new Date(a).getTime()) / (365 * 864e5))
/** Expected profit for the whole term (report 2.1.5.5 "ข้อมูลคาดการณ์") */
export const expectedProfit = (i: Pick<Inv, 'amount' | 'ret' | 'start' | 'end'>) => (i.amount * i.ret * yearsBetween(i.start, i.end)) / 100
/** Profit accrued up to today (summary 2.1.5.3) */
export const accruedProfit = (i: Pick<Inv, 'amount' | 'ret' | 'start' | 'end'>, now = new Date().toISOString().slice(0, 10)) => (i.amount * i.ret * yearsBetween(i.start, now < i.end ? now : i.end)) / 100

/** What the system checks against the investment policy before the proposal is saved (book 1 feature "ตรวจสอบการลงทุนกับข้อกำหนด") */
export function checkInv(i: Inv, others: Inv[]): Record<string, string> {
  const e: Record<string, string> = {}
  if (!(i.amount > 0)) e.amount = 'กรุณาระบุจำนวนเงินลงทุนมากกว่า 0'
  if (!(i.price > 0)) e.price = 'กรุณาระบุราคาต่อหน่วย'
  if (!i.start) e.start = 'กรุณาระบุวันที่เริ่มลงทุน'
  if (!i.end) e.end = 'กรุณาระบุวันที่สิ้นสุด'
  else if (i.start && i.end <= i.start) e.end = 'วันที่สิ้นสุดต้องหลังวันที่เริ่มลงทุน'
  if (!i.channel) e.channel = 'กรุณาเลือกช่องทางการลงทุน'
  if (!i.payment) e.payment = 'กรุณาเลือกประเภทการชำระเงิน'
  if (!i.objective.trim()) e.objective = 'กรุณาระบุวัตถุประสงค์การลงทุน'
  if (i.lv > i.accept) e.accept = `ผลิตภัณฑ์นี้มีความเสี่ยงระดับ ${i.lv} เกินระดับที่ยอมรับได้ (ระดับ ${i.accept})`
  if (i.ret < i.target) e.target = `ผลตอบแทนเฉลี่ย ${i.ret}% ต่ำกว่าเป้าหมายที่กำหนด (มากกว่า ${i.target}%)`
  if (!e.amount) {
    const live = others.filter((x) => x.id !== i.id && x.status === 'ongoing')
    const total = live.reduce((a, x) => a + x.amount, 0) + i.amount
    const mine = live.filter((x) => x.issuer === i.issuer).reduce((a, x) => a + x.amount, 0) + i.amount
    const share = total ? (mine / total) * 100 : 0
    if (share > POLICY.maxIssuerShare) e.amount = `ลงทุนใน ${i.issuer} คิดเป็น ${share.toFixed(1)}% ของพอร์ต เกินข้อกำหนดสูงสุดร้อยละ ${POLICY.maxIssuerShare}`
  }
  return e
}

const ev = (at: string, by: string, action: string, note?: string): IEvent => ({ at, by, action, note })
const mkInv = (id: number, pid: number, amount: number, start: string, end: string, status: InvStatus, extra: Partial<Inv> = {}): Inv => {
  const p = products.find((x) => x.id === pid)!
  return {
    id, productId: pid, name: p.name, kind: p.kind, type: p.type, issuer: p.issuer, dividend: p.dividend, ret: p.ret, lv: p.lv, price: p.price, amount, start, end,
    channel: 'ธนาคารกรุงไทย', payment: 'โอนเงิน', objective: 'บริหารเงินสำรองส่วนเกินเพื่อสร้างผลตอบแทนที่เหมาะสม', target: 2, accept: 5, fy: fyOf(start).fy, status, createdBy: gPersonas.staff.name,
    events: [ev(start + ' 09:00', gPersonas.staff.name, 'เสนอรายการลงทุน'), ...(status !== 'draft' ? [ev(start + ' 15:00', gPersonas.director.name, 'อนุมัติการลงทุน')] : [])],
    ...extra,
  }
}
export const seedInvs = (): Inv[] => [
  mkInv(1, 1, 20_000_000, '2025-10-15', '2026-10-15', 'ongoing'),
  mkInv(2, 11, 25_000_000, '2025-11-03', '2026-11-03', 'ongoing'),
  mkInv(3, 14, 20_000_000, '2025-12-01', '2027-12-01', 'ongoing'),
  mkInv(4, 5, 15_000_000, '2026-01-12', '2027-01-12', 'ongoing'),
  mkInv(5, 3, 10_000_000, '2024-10-01', '2025-04-01', 'done'),
  mkInv(6, 13, 8_000_000, '2024-11-15', '2025-05-15', 'done'),
  mkInv(7, 2, 12_000_000, '2024-12-10', '2025-06-10', 'done'),
  mkInv(8, 9, 5_000_000, '2026-02-20', '2027-02-20', 'draft', { events: [ev('2026-02-20 09:00', gPersonas.staff.name, 'เสนอรายการลงทุน')] }),
]

// ---- monthly samples for the chart of 2.1.5.3 (แผน vs ใช้จริง, ล้านบาท) -----------------------------
export const gMonths = ['ต.ค.', 'พ.ย.', 'ธ.ค.', 'ม.ค.', 'ก.พ.', 'มี.ค.', 'เม.ย.', 'พ.ค.', 'มิ.ย.', 'ก.ค.', 'ส.ค.', 'ก.ย.']
export const planSeries = [8, 8, 8, 8, 8, 8, 8, 8, 8, 8, 8, 8]
export const actualSeries = [7.2, 5.4, 8.1, 8.6, 5.2, 7.9, 8.3, 4.7, 7.4, 8.8, 6.5, 7.7]
export const reasonChips = ['เห็นสมควรได้รับการอนุมัติ', 'ไม่เหมาะสมกับการใช้งาน']
export const OTP = '123456'
