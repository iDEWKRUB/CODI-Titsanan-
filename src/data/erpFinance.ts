// ERP FINANCE — งานงบประมาณและการเงิน (TOR 4.7 (5), book 3 §2.1.4, flow from book 1 §2.2.3 เงินยืมทดรองจ่าย / หักล้าง)
import { stamp } from './strategic'
import { baht0, thDate } from './erpProject'

export { stamp, baht0, thDate }
export const money = (n: number) => n.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })

// ---- who is looking (demo persona; the real system reads this from SSO) -------------------------
export type FPersona = 'staff' | 'approver' | 'finance'
export const fPersonas: Record<FPersona, { short: string; name: string; role: string; office: string }> = {
  staff: { short: 'เจ้าหน้าที่ พอช.', name: 'ปริยดา เจริญวัฒนกุล', role: 'เจ้าหน้าที่', office: 'สำนักเทคโนโลยีสารสนเทศ' },
  approver: { short: 'ผู้มีอำนาจอนุมัติ', name: 'สุรพล ศิริรัตน์', role: 'ผู้อำนวยการสำนัก', office: 'สำนักเทคโนโลยีสารสนเทศ' },
  finance: { short: 'เจ้าหน้าที่การเงิน', name: 'กัญญา ใจดี', role: 'เจ้าหน้าที่สำนักการเงินและบัญชี', office: 'สำนักการเงินและบัญชี' },
}
export const approvers = ['สุรพล ศิริรัตน์ · ผู้อำนวยการสำนัก', 'อรอนงค์ วงศ์สกุล · รองผู้อำนวยการสถาบัน', 'ธนากร พิทักษ์ชน · ผู้อำนวยการสถาบัน']

// ---- loans (เงินยืมทดรองจ่าย) -------------------------------------------------------------------
export type LoanType = 'k' | 'n' | 'bi'
export const loanTypes: Record<LoanType, string> = { k: 'เงินยืมทดรองจ่าย ก.', n: 'เงินยืมทดรองจ่าย น.', bi: 'เงินทดรองจ่าย BI / 08' }
export type LoanStatus = 'submitted' | 'approved' | 'returned' | 'rejected' | 'verified' | 'cleared'
export const loanStatus: Record<LoanStatus, { label: string; tone: string }> = {
  submitted: { label: 'รออนุมัติ', tone: 'bg-[#fff1d6] text-[#a8650b]' },
  approved: { label: 'รอตรวจสอบ', tone: 'bg-[#e1f0ff] text-[#0b63c8]' },
  verified: { label: 'ผ่านการตรวจสอบ', tone: 'bg-[#dff5e8] text-[#0f8a63]' },
  returned: { label: 'ส่งกลับแก้ไข', tone: 'bg-[#ffe9d9] text-[#b2500d]' },
  rejected: { label: 'ไม่อนุมัติ', tone: 'bg-[#ffe3e3] text-[#c13232]' },
  cleared: { label: 'หักล้างแล้ว', tone: 'bg-[#e8e4fb] text-[#5a40c9]' },
}
export type LoanItem = { code: string; name: string; amount: string }
export type ClearItem = { date: string; kind: string; detail: string; amount: string; receipt: string; issuer: string; evidence: string; note: string }
export const clearKinds = ['ค่าเดินทาง', 'ค่าที่พัก', 'ค่าอาหารและเครื่องดื่ม', 'ค่าวัสดุอุปกรณ์', 'ค่าเช่า', 'ค่าตอบแทนวิทยากร', 'ค่าใช้จ่ายอื่น ๆ']
export type FEvent = { at: string; by: string; action: string; note?: string }
export type Loan = {
  id: number
  no: string // R-32432
  type: LoanType
  recorder: string
  source: string // ที่มาขอใบเบิก
  office: string
  planNo: string
  requester: string
  position: string
  staffCode: string
  projectRef: string
  start: string
  end: string
  purpose: string
  activity: string
  extra: string
  items: LoanItem[]
  approver: string
  status: LoanStatus
  docNo: string // เลขสารบรรณ of the approval memo, issued on submit
  createdAt: string
  decision?: { decision: 'approve' | 'reject' | 'return'; reason: string; by: string; at: string }
  verify?: { note: string; by: string; at: string }
  clear?: { items: ClearItem[]; at: string }
  events: FEvent[]
}
export const blankItem = (): LoanItem => ({ code: '', name: '', amount: '' })
export const blankClear = (): ClearItem => ({ date: new Date().toISOString().slice(0, 10), kind: '', detail: '', amount: '', receipt: '', issuer: '', evidence: '', note: '' })
export const loanTotal = (l: Pick<Loan, 'items'>) => l.items.reduce((a, i) => a + (Number(i.amount) || 0), 0)
export const clearTotal = (xs: ClearItem[]) => xs.reduce((a, i) => a + (Number(i.amount) || 0), 0)
/** ผลต่าง = เงินยืม − ค่าใช้จ่ายจริง : บวก = ต้องคืนเงิน, ลบ = เบิกเพิ่ม */
export const refundOf = (loan: number, spent: number) => {
  const d = loan - spent
  return d > 0 ? { label: 'คืนเงิน', diff: d, tone: 'bg-[#17c3a1] text-white' } : d < 0 ? { label: 'เบิกเพิ่ม', diff: -d, tone: 'bg-[#ffa32b] text-white' } : { label: 'พอดี', diff: 0, tone: 'bg-[#0885ff] text-white' }
}
/** วันที่ครบกำหนดหักล้าง : 30 วันหลังวันสิ้นสุดการปฏิบัติงาน (assumption — confirm with the finance regulation) */
export const dueOf = (l: Pick<Loan, 'end'>) => {
  const d = new Date(l.end + 'T00:00:00')
  d.setDate(d.getDate() + 30)
  return d.toISOString().slice(0, 10)
}
export const docNoOf = (n: number) => `ที่ พอช. ${String(100 + n).padStart(4, '0')}/${2568}`

const ev = (at: string, by: string, action: string, note?: string): FEvent => ({ at, by, action, note })
const P = 'ปริยดา เจริญวัฒนกุล'
const AP = 'สุรพล ศิริรัตน์'
const FN = 'กัญญา ใจดี'
const base = { office: 'สำนักเทคโนโลยีสารสนเทศ', position: 'เจ้าหน้าที่', staffCode: 'E-0412', extra: '' }
export const seedLoans = (): Loan[] => [
  { ...base, id: 1, no: 'R-32432', type: 'k', recorder: P, source: 'BG1-เบิกค่าใช้จ่าย', planNo: '1234/IT-2568', requester: P, projectRef: 'PRJ-68-014', start: '2025-11-03', end: '2025-11-07', purpose: 'ค่าใช้จ่ายในการอบรมการใช้งานระบบ ERP สำหรับเจ้าหน้าที่ส่วนภูมิภาค', activity: 'จัดอบรมเชิงปฏิบัติการ 5 วัน ณ จังหวัดขอนแก่น', items: [{ code: '329207', name: 'ค่าเช่าระบบเครือข่าย', amount: '12000' }, { code: '329207', name: 'ค่าเช่าห้องประชุม', amount: '12000' }, { code: '329207', name: 'ค่าอาหารและเครื่องดื่ม', amount: '12000' }], approver: approvers[0], status: 'submitted', docNo: docNoOf(1), createdAt: '2025-11-10 09:20', events: [ev('2025-11-10 09:20', P, 'ยื่นคำขอยืมเงิน'), ev('2025-11-10 09:20', 'ระบบ', 'ออกเลขสารบรรณ', docNoOf(1)), ev('2025-11-10 09:20', 'ระบบ', 'แจ้งเตือนผู้มีอำนาจอนุมัติ', AP)] },
  { ...base, id: 2, no: 'R-32431', type: 'n', recorder: P, source: 'BG2-เบิกค่าเดินทาง', planNo: '1190/IT-2568', requester: 'ธีรพงษ์ ใจมั่น', position: 'นักวิชาการ', staffCode: 'E-0377', projectRef: 'PRJ-68-009', start: '2025-11-12', end: '2025-11-14', purpose: 'เดินทางไปราชการติดตามการติดตั้งระบบที่ภาคเหนือ', activity: 'ตรวจเยี่ยมและติดตามงานติดตั้งระบบ', items: [{ code: '329101', name: 'ค่าเดินทาง', amount: '8400' }, { code: '329102', name: 'ค่าที่พัก', amount: '4800' }], approver: approvers[0], status: 'submitted', docNo: docNoOf(2), createdAt: '2025-11-11 14:05', events: [ev('2025-11-11 14:05', P, 'ยื่นคำขอยืมเงิน'), ev('2025-11-11 14:05', 'ระบบ', 'ออกเลขสารบรรณ', docNoOf(2)), ev('2025-11-11 14:05', 'ระบบ', 'แจ้งเตือนผู้มีอำนาจอนุมัติ', AP)] },
  { ...base, id: 3, no: 'R-32420', type: 'k', recorder: P, source: 'BG1-เบิกค่าใช้จ่าย', planNo: '1180/IT-2568', requester: P, projectRef: 'PRJ-68-011', start: '2025-10-20', end: '2025-10-24', purpose: 'จัดซื้อวัสดุอุปกรณ์สำหรับห้องปฏิบัติการระบบ', activity: 'จัดซื้อวัสดุคอมพิวเตอร์', items: [{ code: '329301', name: 'ค่าวัสดุคอมพิวเตอร์', amount: '22500' }], approver: approvers[1], status: 'approved', docNo: docNoOf(20), createdAt: '2025-10-15 10:00', decision: { decision: 'approve', reason: 'เห็นสมควรได้รับการอนุมัติ', by: AP, at: '2025-10-16 11:30' }, events: [ev('2025-10-15 10:00', P, 'ยื่นคำขอยืมเงิน'), ev('2025-10-16 11:30', AP, 'อนุมัติยืมเงิน', 'เห็นสมควรได้รับการอนุมัติ'), ev('2025-10-16 11:30', 'ระบบ', 'ส่งต่อสำนักการเงินและบัญชีตรวจสอบ')] },
  { ...base, id: 4, no: 'R-32405', type: 'bi', recorder: P, source: 'BG3-ค่าใช้จ่ายสำนักงาน', planNo: '1150/IT-2568', requester: 'วิภา ทองดี', position: 'เจ้าหน้าที่ธุรการ', staffCode: 'E-0288', projectRef: 'PRJ-68-006', start: '2025-10-01', end: '2025-10-03', purpose: 'ค่าใช้จ่ายเบ็ดเตล็ดประจำเดือนของสำนัก', activity: 'ค่าใช้จ่ายสำนักงาน', items: [{ code: '329401', name: 'ค่าวัสดุสำนักงาน', amount: '9800' }], approver: approvers[0], status: 'verified', docNo: docNoOf(5), createdAt: '2025-09-28 09:00', decision: { decision: 'approve', reason: 'เห็นสมควรได้รับการอนุมัติ', by: AP, at: '2025-09-29 10:10' }, verify: { note: 'เอกสารครบถ้วน ถูกต้อง', by: FN, at: '2025-09-30 13:40' }, events: [ev('2025-09-28 09:00', P, 'ยื่นคำขอยืมเงิน'), ev('2025-09-29 10:10', AP, 'อนุมัติยืมเงิน'), ev('2025-09-30 13:40', FN, 'ผ่านการตรวจสอบเงินยืม', 'เอกสารครบถ้วน ถูกต้อง'), ev('2025-09-30 13:40', 'ระบบ', 'โอนเงินยืมและแจ้งผู้ยืมหักล้างภายใน 30 วัน')] },
  { ...base, id: 5, no: 'R-32390', type: 'k', recorder: P, source: 'BG1-เบิกค่าใช้จ่าย', planNo: '1120/IT-2568', requester: P, projectRef: 'PRJ-68-003', start: '2025-09-08', end: '2025-09-10', purpose: 'ค่าใช้จ่ายสัมมนาเตรียมความพร้อมระบบ ERP', activity: 'สัมมนาเชิงปฏิบัติการ 3 วัน', items: [{ code: '329207', name: 'ค่าเช่าห้องประชุม', amount: '15000' }, { code: '329207', name: 'ค่าอาหารและเครื่องดื่ม', amount: '9000' }], approver: approvers[0], status: 'cleared', docNo: docNoOf(9), createdAt: '2025-09-01 09:00', decision: { decision: 'approve', reason: 'เห็นสมควรได้รับการอนุมัติ', by: AP, at: '2025-09-02 10:00' }, verify: { note: 'ผ่านการตรวจสอบ', by: FN, at: '2025-09-03 09:30' }, clear: { at: '2025-09-20 15:00', items: [{ date: '2025-09-09', kind: 'ค่าเช่า', detail: 'ค่าเช่าห้องประชุม 3 วัน', amount: '14200', receipt: 'RC-6809-0031', issuer: 'โรงแรมริมน้ำ', evidence: 'receipt-0031.pdf', note: '' }, { date: '2025-09-09', kind: 'ค่าอาหารและเครื่องดื่ม', detail: 'อาหารกลางวันและอาหารว่าง', amount: '9300', receipt: 'RC-6809-0032', issuer: 'โรงแรมริมน้ำ', evidence: 'receipt-0032.pdf', note: '' }] }, events: [ev('2025-09-01 09:00', P, 'ยื่นคำขอยืมเงิน'), ev('2025-09-02 10:00', AP, 'อนุมัติยืมเงิน'), ev('2025-09-03 09:30', FN, 'ผ่านการตรวจสอบเงินยืม'), ev('2025-09-20 15:00', P, 'ส่งเอกสารหักล้างเงินยืม', 'ใช้จริง 23,500.00 บาท เบิกเพิ่ม 500.00 บาท')] },
  { ...base, id: 6, no: 'R-32377', type: 'n', recorder: P, source: 'BG2-เบิกค่าเดินทาง', planNo: '1100/IT-2568', requester: 'ธีรพงษ์ ใจมั่น', position: 'นักวิชาการ', staffCode: 'E-0377', projectRef: 'PRJ-68-002', start: '2025-08-25', end: '2025-08-27', purpose: 'เดินทางไปประชุมหารือแนวทางเชื่อมระบบกับหน่วยงานภายนอก', activity: 'ประชุมหารือร่วม', items: [{ code: '329101', name: 'ค่าเดินทาง', amount: '25000' }], approver: approvers[2], status: 'returned', docNo: docNoOf(12), createdAt: '2025-08-20 10:15', decision: { decision: 'return', reason: 'ไม่แนบรายละเอียดกิจกรรม กรุณาแก้ไขแล้วยื่นใหม่', by: 'ธนากร พิทักษ์ชน', at: '2025-08-21 09:00' }, events: [ev('2025-08-20 10:15', P, 'ยื่นคำขอยืมเงิน'), ev('2025-08-21 09:00', 'ธนากร พิทักษ์ชน', 'ส่งกลับแก้ไข', 'ไม่แนบรายละเอียดกิจกรรม กรุณาแก้ไขแล้วยื่นใหม่')] },
]

// ---- overview samples (the monthly charts wait for the accounting system) -----------------------
export const fMonths = ['ต.ค.', 'พ.ย.', 'ธ.ค.', 'ม.ค.', 'ก.พ.', 'มี.ค.', 'เม.ย.', 'พ.ค.', 'มิ.ย.', 'ก.ค.', 'ส.ค.', 'ก.ย.']
export const withdrawSeries = [420, 510, 380, 640, 590, 720, 680, 760, 810, 740, 880, 910] // เบิกเงิน (พันบาท)
export const clearSeries = [380, 470, 400, 560, 600, 650, 690, 700, 760, 770, 810, 860] // เคลียร์เงิน
export const payableSeries = [1200, 1450, 1100, 1800, 1650, 2100, 1900, 2250, 2400, 2150, 2600, 2750] // ยอดตั้งเจ้าหนี้
export const taxSeries = [36, 43, 33, 54, 49, 63, 57, 67, 72, 64, 78, 82] // ภาษีหัก ณ ที่จ่าย
export const taxPending = { count: 7, amount: 82000 } // sample — waiting for the tax system
export const importantNotices = [
  { at: '2025-11-13 09:15', text: 'ใบสำคัญ R-32390 หักล้างครบถ้วนแล้ว' },
  { at: '2025-11-12 16:40', text: 'เงินยืมใกล้ครบกำหนดหักล้างภายใน 7 วัน' },
  { at: '2025-11-12 11:02', text: 'ภาษีหัก ณ ที่จ่ายประจำเดือนต้องนำส่งภายในวันที่ 7' },
]
