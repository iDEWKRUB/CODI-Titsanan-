// ERP HR — งานบริหารจัดการทรัพยากรบุคคล (TOR 4.7 (7), book 3 §2.1.6 — 16 screens)
import { stamp } from './strategic'
import { thDate } from './erpProject'

export { stamp, thDate }
export const money = (n: number) => n.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })
export const todayIso = () => new Date().toISOString().slice(0, 10)

// ---- demo personas --------------------------------------------------------------------------------
export type HPersona = 'staff' | 'head' | 'hr' | 'finance'
export const hPersonas: Record<HPersona, { short: string; name: string }> = {
  staff: { short: 'เจ้าหน้าที่ พอช.', name: 'ปริยดา เจริญวัฒนกุล' },
  head: { short: 'หัวหน้างาน', name: 'วรรณกร สิงหณี' },
  hr: { short: 'เจ้าหน้าที่สำนักทรัพยากรบุคคล', name: 'สุวรรณา ทองดี' },
  finance: { short: 'เจ้าหน้าที่สำนักการเงินและบัญชี', name: 'กัญญา ใจดี' },
}

// ---- people ---------------------------------------------------------------------------------------
export const prefixes = ['นาย', 'นาง', 'นางสาว']
export const depts = ['บริหาร', 'สำนักเทคโนโลยีสารสนเทศ', 'สำนักทรัพยากรบุคคล', 'สำนักการเงินและบัญชี', 'สำนักนโยบายและแผน', 'สำนักงานภาคเหนือ']
export const empTypes = ['รายเดือน', 'สัญญาจ้าง', 'ลูกจ้างชั่วคราว']
export const positions = ['ผู้ปฏิบัติการ', 'เจ้าหน้าที่', 'นักวิชาการ', 'หัวหน้างาน', 'ผู้อำนวยการสำนัก']
export type Employee = {
  id: number; code: string; prefix: string; firstTh: string; lastTh: string; firstEn: string; lastEn: string
  idType: 'id' | 'passport'; idNo: string; idFile: string; dept: string; empType: string; position: string
  phone: string; email: string; address: string; homeAddress: string; start: string; salary: number; account: string; photo?: string
}
const E = (id: number, code: string, prefix: string, th: string, en: string, dept: string, position: string, salary: number, start: string): Employee => {
  const [firstTh, lastTh] = th.split(' '), [firstEn, lastEn] = en.split(' ')
  return { id, code, prefix, firstTh, lastTh, firstEn, lastEn, idType: 'id', idNo: '', idFile: '', dept, empType: 'รายเดือน', position, phone: '08' + String(10000000 + id * 7919).slice(0, 8), email: `${firstEn.toLowerCase()}.${lastEn[0].toLowerCase()}@codi.or.th`, address: 'กรุงเทพมหานคร', homeAddress: 'กรุงเทพมหานคร', start, salary, account: `123-4-${String(56000 + id * 37).padStart(5, '0')}-${id}` }
}
export const seedEmployees = (): Employee[] => [
  { ...E(1, 'E-0412', 'นางสาว', 'ปริยดา เจริญวัฒนกุล', 'Priyada Charoenwattanakul', 'สำนักเทคโนโลยีสารสนเทศ', 'เจ้าหน้าที่', 32000, '2019-06-01'), idNo: '1103700012345' },
  E(2, 'E-0377', 'นาย', 'ธีรพงษ์ ใจมั่น', 'Teerapong Jaiman', 'สำนักเทคโนโลยีสารสนเทศ', 'นักวิชาการ', 38500, '2017-03-01'),
  E(3, 'E-0288', 'นาง', 'วิภา ทองดี', 'Wipa Thongdee', 'บริหาร', 'ผู้ปฏิบัติการ', 24500, '2015-10-01'),
  E(4, 'E-0105', 'นาย', 'วรรณกร สิงหณี', 'Wannakorn Singhanee', 'สำนักเทคโนโลยีสารสนเทศ', 'หัวหน้างาน', 56000, '2010-01-04'),
  E(5, 'E-0451', 'นางสาว', 'สุวรรณา ทองดี', 'Suwanna Thongdee', 'สำนักทรัพยากรบุคคล', 'เจ้าหน้าที่', 29800, '2020-02-03'),
  E(6, 'E-0233', 'นาง', 'กัญญา ใจดี', 'Kanya Jaidee', 'สำนักการเงินและบัญชี', 'นักวิชาการ', 41000, '2014-07-01'),
  E(7, 'E-0502', 'นาย', 'อนุชา พรหมมา', 'Anucha Promma', 'สำนักงานภาคเหนือ', 'ผู้ปฏิบัติการ', 21000, '2022-05-02'),
  E(8, 'E-0019', 'นาย', 'สุรพล ศิริรัตน์', 'Surapol Sirirat', 'สำนักเทคโนโลยีสารสนเทศ', 'ผู้อำนวยการสำนัก', 78000, '2006-11-01'),
]
export const fullName = (e: Pick<Employee, 'prefix' | 'firstTh' | 'lastTh'>) => `${e.prefix}${e.firstTh} ${e.lastTh}`
/** Thai national ID checksum (13 digits) */
export const validThaiId = (s: string) => {
  if (!/^\d{13}$/.test(s)) return false
  const sum = s.slice(0, 12).split('').reduce((a, d, i) => a + Number(d) * (13 - i), 0)
  return (11 - (sum % 11)) % 10 === Number(s[12])
}

// ---- self-service requests (หนังสือรับรอง / OT / สวัสดิการ / ลา) --------------------------------------
export type ReqKind = 'cert' | 'ot' | 'welfare' | 'leave'
export const reqKindLabel: Record<ReqKind, string> = { cert: 'ขอหนังสือรับรอง/ส่งตัว', ot: 'เบิกค่าอาหารนอกเวลา', welfare: 'เบิกสวัสดิการ', leave: 'แจ้งลา' }
export type ReqStatus = 'submitted' | 'approved' | 'rejected'
export const reqStatus: Record<ReqStatus, { label: string; tone: string }> = {
  submitted: { label: 'รอพิจารณา', tone: 'bg-[#fff1d6] text-[#a8650b]' },
  approved: { label: 'อนุมัติแล้ว', tone: 'bg-[#dff5e8] text-[#0f8a63]' },
  rejected: { label: 'ไม่อนุมัติ', tone: 'bg-[#ffe3e3] text-[#c13232]' },
}
export type OtDay = { date: string; slots: number[] } // slot = start hour 7..18
export type OtReport = { date: string; start: string; end: string; allDay: boolean; detail: string; hasNote: boolean; note: string }
export type WelfareItem = { date: string; detail: string; amount: string; receipt: string; issuer: string; evidence: string; note: string }
export type HrReq = {
  id: number; no: string; kind: ReqKind; empId: number; status: ReqStatus; createdAt: string
  certType?: 'หนังสือรับรอง' | 'หนังสือส่งตัว'; certPurpose?: string; certTo?: string; signer?: string
  otDays?: OtDay[]; otReports?: OtReport[]
  welfareType?: string; welfareItems?: WelfareItem[]
  leaveType?: string; from?: string; to?: string; days?: number; detail?: string; note?: string; evidence?: string
  decision?: { approve: boolean; reason: string; by: string; at: string }
}
export const certPurposes = ['รับรองการทำงาน', 'รับรองเงินเดือน', 'ยื่นขอสินเชื่อ/วีซ่า', 'ส่งตัวเข้ารับการตรวจสุขภาพ', 'ส่งตัวไปปฏิบัติงานต่างหน่วยงาน']
export const signers = ['วรรณกร สิงหณี · หัวหน้างาน', 'สุรพล ศิริรัตน์ · ผู้อำนวยการสำนัก']
export const welfareTypes = ['ค่ารักษาพยาบาล', 'ค่าเล่าเรียนบุตร', 'สวัสดิการเงินช่วยเหลือ']
/** yearly ceiling per welfare type (assumption until the welfare regulation is attached) */
export const welfareCap: Record<string, number> = { ค่ารักษาพยาบาล: 20000, ค่าเล่าเรียนบุตร: 25000, สวัสดิการเงินช่วยเหลือ: 10000 }
export const leaveTypes = ['ลากิจ', 'ลาป่วย', 'ลาพักร้อน', 'ลาบวช']
/** days allowed per fiscal year (assumption — typical public-organisation rules) */
export const leaveQuota: Record<string, number> = { ลากิจ: 6, ลาป่วย: 30, ลาพักร้อน: 10, ลาบวช: 120 }
/** OT meal allowance: 50 บาท when a day has at least 2 hours, 100 บาท from 4 hours (assumption) */
export const OT_HOURS = Array.from({ length: 12 }, (_, i) => 7 + i)
export const mealOf = (hours: number) => (hours >= 4 ? 100 : hours >= 2 ? 50 : 0)
export const workDays = (from: string, to: string) => {
  if (!from || !to || to < from) return 0
  let n = 0
  for (let d = new Date(from + 'T00:00:00'); d <= new Date(to + 'T00:00:00'); d.setDate(d.getDate() + 1)) if (d.getDay() % 6 !== 0) n++
  return n
}
const ev = (y: string) => y
export const seedReqs = (): HrReq[] => [
  { id: 1, no: 'HR-CERT-0001', kind: 'cert', empId: 2, status: 'submitted', createdAt: '2025-11-18 10:12', certType: 'หนังสือรับรอง', certPurpose: 'รับรองเงินเดือน', certTo: 'ธนาคารออมสิน สาขาบางกะปิ', signer: signers[0] },
  { id: 2, no: 'HR-CERT-0002', kind: 'cert', empId: 3, status: 'submitted', createdAt: '2025-11-19 14:30', certType: 'หนังสือส่งตัว', certPurpose: 'ส่งตัวเข้ารับการตรวจสุขภาพ', certTo: 'โรงพยาบาลนวมินทร์', signer: signers[0] },
  { id: 3, no: 'HR-LEAVE-0001', kind: 'leave', empId: 1, status: 'approved', createdAt: '2025-10-20 09:00', leaveType: 'ลาพักร้อน', from: '2025-10-27', to: '2025-10-29', days: 3, detail: 'พักผ่อนประจำปี', note: '', evidence: '', decision: { approve: true, reason: 'อนุมัติ', by: 'วรรณกร สิงหณี', at: '2025-10-21 10:00' } },
  { id: 4, no: 'HR-LEAVE-0002', kind: 'leave', empId: 1, status: 'approved', createdAt: '2025-11-03 08:10', leaveType: 'ลาป่วย', from: '2025-11-03', to: '2025-11-03', days: 1, detail: 'ไข้หวัด', note: '', evidence: 'ใบรับรองแพทย์.pdf' },
  { id: 5, no: 'HR-CERT-0003', kind: 'cert', empId: 1, status: 'approved', createdAt: '2025-10-02 11:00', certType: 'หนังสือรับรอง', certPurpose: 'รับรองการทำงาน', certTo: 'สถานทูตญี่ปุ่น', signer: signers[0], decision: { approve: true, reason: 'เห็นสมควรลงนาม', by: 'วรรณกร สิงหณี', at: '2025-10-03 09:00' } },
].map((r) => ({ ...r, createdAt: ev(r.createdAt) })) as HrReq[]

// ---- evaluations (แบบประเมิน) ------------------------------------------------------------------------
export type QKind = 'text' | 'number' | 'single' | 'multi'
export const qKindLabel: Record<QKind, string> = { text: 'ข้อความ', number: 'ตัวเลข', single: 'ตัวเลือกเดียว', multi: 'หลายตัวเลือก' }
export type Question = { title: string; kind: QKind; unit?: string; options: string[] }
export type ESection = { title: string; desc: string; questions: Question[] }
export type EvalStatus = 'draft' | 'published' | 'closed'
export const evalStatus: Record<EvalStatus, { label: string; tone: string }> = {
  draft: { label: 'ร่าง', tone: 'bg-gray-line text-gray-30' },
  published: { label: 'เผยแพร่', tone: 'bg-[#dff5e8] text-[#0f8a63]' },
  closed: { label: 'ปิดรับ', tone: 'bg-[#e8e4fb] text-[#5a40c9]' },
}
export const evalTypes = ['ประเมินประจำปี', 'ประเมินต่อสัญญาจ้าง']
export type Evaluation = { id: number; name: string; fy: string; type: string; status: EvalStatus; publish: string; end: string; responses: number; sections: ESection[] }
export type Template = { id: string; name: string; type: string; recommended?: boolean; sections: ESection[] }
const S = (title: string, desc: string, qs: Question[]): ESection => ({ title, desc, questions: qs })
const Q = (title: string, kind: QKind, options: string[] = [], unit?: string): Question => ({ title, kind, options, unit })
export const templates: Template[] = [
  { id: 'annual', name: 'ประเมินประจำปี', type: 'ประเมินประจำปี', recommended: true, sections: [S('ผลสัมฤทธิ์ของงาน', 'ประเมินผลงานตามตัวชี้วัดที่ตกลงไว้', [Q('ผลงานบรรลุตัวชี้วัดกี่ข้อ', 'number', [], 'ข้อ'), Q('คุณภาพของงาน', 'single', ['ดีเยี่ยม', 'ดี', 'พอใช้', 'ปรับปรุง'])]), S('พฤติกรรมการทำงาน', 'สมรรถนะหลักขององค์กร', [Q('การทำงานเป็นทีม', 'single', ['ดีเยี่ยม', 'ดี', 'พอใช้', 'ปรับปรุง']), Q('ข้อเสนอแนะ', 'text')])] },
  { id: 'contract', name: 'ประเมินต่อสัญญาจ้าง', type: 'ประเมินต่อสัญญาจ้าง', sections: [S('ผลการปฏิบัติงานตามสัญญา', 'ประกอบการพิจารณาต่อสัญญา', [Q('ปฏิบัติงานครบตามขอบเขตงาน', 'single', ['ครบถ้วน', 'บางส่วน', 'ไม่ครบ']), Q('เห็นควรต่อสัญญาหรือไม่', 'single', ['ต่อสัญญา', 'ไม่ต่อสัญญา'])])] },
  { id: 'household', name: 'ประเมินออมทรัพย์และหนี้สิน', type: 'ประเมินประจำปี', sections: [S('ออมทรัพย์และหนี้สิน', 'คำถามในส่วนนี้ 2 คำถาม', [Q('ความสามารถในการออมทรัพย์ของครัวเรือน', 'number', [], 'บาท'), Q('จำนวนหนี้สิน', 'multi', ['ที่อยู่อาศัย', 'อาชีพ', 'อื่น ๆ'])])] },
  { id: 'training', name: 'ประเมินความพึงพอใจการอบรม', type: 'ประเมินประจำปี', sections: [S('ความพึงพอใจ', 'หลังจบหลักสูตร', [Q('ความพึงพอใจโดยรวม', 'single', ['มากที่สุด', 'มาก', 'ปานกลาง', 'น้อย']), Q('สิ่งที่ควรปรับปรุง', 'text')])] },
  { id: '360', name: 'ประเมิน 360 องศา', type: 'ประเมินประจำปี', sections: [S('มุมมองเพื่อนร่วมงาน', 'ประเมินโดยเพื่อนร่วมงาน', [Q('การสื่อสาร', 'single', ['ดีเยี่ยม', 'ดี', 'พอใช้', 'ปรับปรุง'])])] },
  { id: 'probation', name: 'ประเมินผ่านทดลองงาน', type: 'ประเมินต่อสัญญาจ้าง', sections: [S('ผลการทดลองงาน', '120 วันแรก', [Q('ผ่านการทดลองงาน', 'single', ['ผ่าน', 'ขยายเวลา', 'ไม่ผ่าน'])])] },
]
export const seedEvals = (): Evaluation[] => [
  { id: 1, name: 'แบบประเมินผลการปฏิบัติงานประจำปี 2568', fy: '2568', type: 'ประเมินประจำปี', status: 'published', publish: '2025-09-01', end: '2025-09-30', responses: 214, sections: templates[0].sections },
  { id: 2, name: 'แบบประเมินต่อสัญญาจ้าง รอบเมษายน 2568', fy: '2568', type: 'ประเมินต่อสัญญาจ้าง', status: 'closed', publish: '2025-03-01', end: '2025-03-31', responses: 38, sections: templates[1].sections },
  { id: 3, name: 'แบบประเมินต่อสัญญาจ้าง รอบตุลาคม 2569', fy: '2569', type: 'ประเมินต่อสัญญาจ้าง', status: 'draft', publish: '2025-12-01', end: '2025-12-31', responses: 0, sections: templates[1].sections },
  { id: 4, name: 'แบบประเมินผลการปฏิบัติงานประจำปี 2569', fy: '2569', type: 'ประเมินประจำปี', status: 'draft', publish: '2026-09-01', end: '2026-09-30', responses: 0, sections: templates[0].sections },
  { id: 5, name: 'แบบประเมินความพึงพอใจการอบรมผู้บริหาร', fy: '2568', type: 'ประเมินประจำปี', status: 'closed', publish: '2025-06-01', end: '2025-06-15', responses: 46, sections: templates[3].sections },
  { id: 6, name: 'แบบประเมินผ่านทดลองงาน พนักงานใหม่ ไตรมาส 3', fy: '2568', type: 'ประเมินต่อสัญญาจ้าง', status: 'closed', publish: '2025-07-01', end: '2025-07-31', responses: 9, sections: templates[5].sections },
  { id: 7, name: 'แบบประเมิน 360 องศา หัวหน้างาน', fy: '2568', type: 'ประเมินประจำปี', status: 'published', publish: '2025-10-15', end: '2025-12-15', responses: 63, sections: templates[4].sections },
]

// ---- payroll --------------------------------------------------------------------------------------
export type PayRow = { empId: number; salary: number; allowance: number; medical: number; welfare: number; share: number; ot: number }
export type PayRun = { id: number; no: string; date: string; due: string; from: string; to: string; rows: PayRow[]; status: 'draft' | 'paid'; ssoPaid?: string; paidAt?: string }
export const payCols: { key: keyof Omit<PayRow, 'empId'>; label: string }[] = [
  { key: 'salary', label: 'เงินเดือน' }, { key: 'allowance', label: 'ค่าเบี้ยเลี้ยง' }, { key: 'medical', label: 'สวัสดิการค่ารักษา' }, { key: 'welfare', label: 'สวัสดิการอื่น' }, { key: 'share', label: 'ส่วนแบ่งกองทุน' }, { key: 'ot', label: 'ค่าล่วงเวลา' },
]
export const grossOf = (r: PayRow) => r.salary + r.allowance + r.medical + r.welfare + r.share + r.ot
/** social security 5% of salary capped at 750 (each side) */
export const ssoOf = (r: PayRow) => Math.min(750, Math.round(r.salary * 0.05 * 100) / 100)
/** monthly withholding tax from the annualised Thai progressive rates after expense 100k (cap) + personal allowance 60k */
export function whtOf(r: PayRow) {
  const year = grossOf(r) * 12
  let net = year - Math.min(100000, year * 0.5) - 60000 - ssoOf(r) * 12
  const br: [number, number][] = [[150000, 0], [150000, 0.05], [200000, 0.1], [250000, 0.15], [250000, 0.2], [1000000, 0.25], [3000000, 0.3], [Infinity, 0.35]]
  let tax = 0
  for (const [w, rate] of br) { const x = Math.max(0, Math.min(net, w)); tax += x * rate; net -= x; if (net <= 0) break }
  return Math.round((tax / 12) * 100) / 100
}
export const netOf = (r: PayRow) => grossOf(r) - ssoOf(r) - whtOf(r)
export const seedRuns = (): PayRun[] => [
  { id: 1, no: 'PAY-20251001', date: '2025-10-18', due: '2025-10-30', from: '2025-10-01', to: '2025-10-31', status: 'paid', paidAt: '2025-10-30 15:00', ssoPaid: 'EXP-20251000003', rows: seedEmployees().map((e) => ({ empId: e.id, salary: e.salary, allowance: 1500, medical: 0, welfare: 500, share: 0, ot: 0 })) },
]

// ---- my trainings / career paths -------------------------------------------------------------------
export type Track = 'บริหาร' | 'วิชาการ'
export type Training = { id: number; empId: number; course: string; year: string; cert: 'มี' | 'ไม่มี'; status: 'รอตรวจสอบ' | 'ยืนยันแล้ว'; track: Track; condition: string; detail: string; note: string; file: string; star?: boolean }
export const seedTrainings = (): Training[] => [
  { id: 1, empId: 1, course: 'อบรมผู้บริหารระดับต้น', year: '2568', cert: 'มี', status: 'ยืนยันแล้ว', track: 'บริหาร', condition: 'พัฒนาศักยภาพผู้นำ', detail: 'สถาบันพัฒนาผู้นำภาครัฐ', note: '', file: 'cert-01.pdf' },
  { id: 2, empId: 1, course: 'ปรับปรุงผู้นำ Depa', year: '2568', cert: 'ไม่มี', status: 'ยืนยันแล้ว', track: 'บริหาร', condition: 'พัฒนาศักยภาพผู้นำ', detail: 'หลักสูตรภายนอก', note: '', file: '' },
  { id: 3, empId: 1, course: 'การวิเคราะห์ข้อมูลด้วย Power BI', year: '2567', cert: 'มี', status: 'ยืนยันแล้ว', track: 'วิชาการ', condition: 'ทักษะดิจิทัล', detail: 'สำนักงานส่งเสริมเศรษฐกิจดิจิทัล', note: '', file: 'cert-03.pdf' },
  { id: 4, empId: 1, course: 'ความปลอดภัยไซเบอร์สำหรับหน่วยงานรัฐ', year: '2568', cert: 'มี', status: 'รอตรวจสอบ', track: 'วิชาการ', condition: 'ทักษะดิจิทัล', detail: 'สกมช.', note: '', file: 'cert-04.pdf' },
]
export type CareerTraining = { contentType: string; detail: string; count: number; note: string }
export type Career = { id: number; name: string; fy: string; riskCode: string; type: Track; desc: string; prevLevel: string; qualification: string; trainings: CareerTraining[]; status: 'draft' | 'active' }
export const contentTypes = ['พัฒนาศักยภาพผู้นำ', 'ทักษะดิจิทัล', 'การบริหารโครงการ', 'กฎหมายและระเบียบ', 'การพัฒนาชุมชน']
export const levels = ['ปฏิบัติการ', 'ชำนาญการ', 'ชำนาญการพิเศษ', 'เชี่ยวชาญ', 'หัวหน้างาน', 'ผู้อำนวยการสำนัก']
export const seedCareers = (): Career[] => [
  { id: 1, name: 'พัฒนาศักยภาพผู้นำ สายบริหาร', fy: '2568', riskCode: 'HR-R01', type: 'บริหาร', desc: 'เส้นทางสู่ตำแหน่งหัวหน้างาน', prevLevel: 'ชำนาญการ', qualification: 'ประสบการณ์ 5 ปีขึ้นไป', trainings: [{ contentType: 'พัฒนาศักยภาพผู้นำ', detail: 'หลักสูตรผู้นำ', count: 2, note: '' }], status: 'active' },
  { id: 2, name: 'นักวิชาการดิจิทัล', fy: '2568', riskCode: 'HR-R04', type: 'วิชาการ', desc: 'สายวิชาการด้านเทคโนโลยี', prevLevel: 'ปฏิบัติการ', qualification: 'ปริญญาตรีด้าน IT', trainings: [{ contentType: 'ทักษะดิจิทัล', detail: 'หลักสูตรทักษะดิจิทัล', count: 2, note: '' }], status: 'active' },
  { id: 3, name: 'ผู้อำนวยการสำนัก', fy: '2569', riskCode: 'HR-R02', type: 'บริหาร', desc: 'สายบริหารระดับสูง', prevLevel: 'หัวหน้างาน', qualification: 'ประสบการณ์บริหาร 3 ปี', trainings: [{ contentType: 'การบริหารโครงการ', detail: '', count: 3, note: '' }], status: 'draft' },
  { id: 4, name: 'นักพัฒนาชุมชนชำนาญการ', fy: '2569', riskCode: 'HR-R06', type: 'วิชาการ', desc: 'สายวิชาการด้านพัฒนาชุมชน', prevLevel: 'ปฏิบัติการ', qualification: 'ปฏิบัติงานภาคสนาม 3 ปี', trainings: [{ contentType: 'การพัฒนาชุมชน', detail: '', count: 2, note: '' }], status: 'active' },
]
export const otpCode = '123456'
export { thDate as d }
