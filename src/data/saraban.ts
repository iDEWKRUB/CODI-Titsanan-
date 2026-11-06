// e-Saraban (TOR 4.7-3, book 3 §2.1.7, flow from book 1 §2.2.6 "งานสารบรรณอิเล็กทรอนิกส์")

export type PersonId = 'clerk' | 'deputy' | 'director'
export const people: Record<PersonId, { name: string; pos: string; short: string }> = {
  clerk: { name: 'กมลพร ใจดี', pos: 'เจ้าหน้าที่สารบรรณ', short: 'กมลพร (สารบรรณ)' },
  deputy: { name: 'รอง ผอ. วิภา สุขสันต์', pos: 'รองผู้อำนวยการ', short: 'รอง ผอ. วิภา' },
  director: { name: 'ผอ. สมชาย', pos: 'ผู้อำนวยการ', short: 'ผอ. สมชาย' },
}
export const personIds = Object.keys(people) as PersonId[]

export type DocKind = 'internal' | 'received'
/** draft → review (circulating through the chain) → signed | returned (back to the clerk) ; received docs may also be registered (no forward) or circulated (แจ้งเวียน) */
export type DocStatus = 'draft' | 'review' | 'signed' | 'returned' | 'registered' | 'circulated'
export type Step = { who: PersonId; role: 'pass' | 'sign' }
export type HistoryItem = { at: string; who: PersonId | 'system'; action: string; note?: string }

export type SDoc = {
  id: number
  /** shown document number, D-001 */
  no: string
  kind: DocKind
  /** บันทึกข้อความ / หนังสือภายนอก / ... */
  type: string
  /** ชื่อเรื่อง (title in the system list) */
  title: string
  /** เรื่อง (subject line of the letter) */
  subject: string
  createdAt: string
  creator: PersonId
  status: DocStatus
  chain: Step[]
  /** index of the person who must act now */
  step: number
  /** เลขทะเบียนรับ/อ้างอิง, RB-2025-1234 */
  refNo: string
  /** final registry number issued when the last signer signs */
  issuedNo?: string
  dateDoc: string
  to?: string
  body: string
  secret: string
  urgency: string
  // received letters
  channel?: string
  sender?: string
  receiver?: string
  extNo?: string
  detail?: string
  note?: string
  file?: string
  stampAt?: string
  forward?: 'forward' | 'none' | 'circulate'
  action?: string
  /** สั่งการ appended as the last page when the highest authority signs a received letter */
  directive?: string
  returnReason?: string
  history: HistoryItem[]
  /** counts toward "this week" figures on the overview */
  week: boolean
}

export const statusLabel: Record<DocStatus, string> = { draft: 'ร่าง', review: 'รอตรวจ', signed: 'ลงนามแล้ว', returned: 'ตีกลับ', registered: 'รอดำเนินการ', circulated: 'เวียนแจ้งแล้ว' }

/** the label depends on who is looking (book 3 fig 2-46 vs fig 2-49) */
export function labelFor(d: SDoc, me: PersonId) {
  if (d.status === 'review') return isMyTurn(d, me) ? 'รอตรวจ' : 'เสนออนุมัติ'
  return statusLabel[d.status]
}
export const statusTone = (label: string) =>
  ({ ร่าง: 'bg-gray-line text-gray-30', เสนออนุมัติ: 'bg-[#cfe9ff] text-[#0b63c8]', รอตรวจ: 'bg-[#dfe9ff] text-[#2b4fbf]', ลงนามแล้ว: 'bg-[#cdf3e4] text-[#0f8a63]', ได้รับมอบหมาย: 'bg-[#e1f6fb] text-[#0e8aa6]', รอดำเนินการ: 'bg-[#cfe9ff] text-[#0b63c8]', ตีกลับ: 'bg-[#fde2e2] text-[#c0262d]', เวียนแจ้งแล้ว: 'bg-[#efe3ff] text-[#7a3fd1]' })[label] ?? 'bg-gray-line text-gray-30'

export const isMyTurn = (d: SDoc, me: PersonId) => d.status === 'review' && d.chain[d.step]?.who === me
export const involves = (d: SDoc, me: PersonId) => d.creator === me || d.chain.some((s) => s.who === me)

export const tabs = ['ทั้งหมด', 'เอกสารร่าง', 'เสนออนุมัติ', 'ลงนามแล้ว', 'ได้รับมอบหมาย', 'รอดำเนินการ'] as const
export type Tab = (typeof tabs)[number]
export function inTab(d: SDoc, tab: Tab, me: PersonId) {
  switch (tab) {
    case 'ทั้งหมด': return true
    case 'เอกสารร่าง': return d.status === 'draft'
    case 'เสนออนุมัติ': return d.status === 'review' && d.creator === me && !isMyTurn(d, me)
    case 'ลงนามแล้ว': return d.status === 'signed'
    case 'ได้รับมอบหมาย': return isMyTurn(d, me)
    case 'รอดำเนินการ': return d.creator === me && (d.status === 'registered' || d.status === 'returned')
  }
}

export const internalTypes = ['บันทึกข้อความ (เสนอ ผอ.)', 'บันทึกข้อความ (ขออนุมัติ)', 'หนังสือภายใน', 'หนังสือเวียนภายใน']
export const receivedTypes = ['หนังสือภายนอก', 'หนังสือภายใน', 'หนังสือเวียน', 'หนังสือสั่งการ']
export const secrets = ['ปกติ', 'ลับ', 'ลับมาก', 'ลับที่สุด']
export const urgencies = ['ปกติ', 'ด่วน', 'ด่วนมาก', 'ด่วนที่สุด']
export const channels = ['ไปรษณีย์', 'อีเมลกลาง (saraban@codi.co.th)', 'LINE', 'โซเชียลมีเดีย', 'นำส่งด้วยตนเอง']
export const forwardActions = ['เสนอ ผอ.', 'เพื่อโปรดทราบ', 'เพื่อพิจารณา', 'เพื่อดำเนินการ']

export const pad = (n: number) => String(n).padStart(2, '0')
export const stamp = (d = new Date()) => `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())} ${pad(d.getHours())}:${pad(d.getMinutes())}`
export const dateOnly = (iso: string) => iso.slice(0, 10)

export type Circular = { id: number; title: string; at: string; read: boolean }
const circularTitle = 'รายงานสถานการณ์สนับสนุนการจัดสวัสดิการ 0 2568-รอบ 9 เดือน'
export const seedCirculars = (): Circular[] =>
  Array.from({ length: 12 }, (_, i) => ({ id: i + 1, title: circularTitle, at: ['23-10-68 14:00', '23-10-68 14:00', '21-10-68 14:00', '23-10-68 14:00', '21-10-68 14:00', '20-10-68 09:30', '17-10-68 16:10', '16-10-68 10:00', '15-10-68 13:20', '14-10-68 08:45', '10-10-68 15:00', '09-10-68 11:30'][i], read: i >= 10 }))

const h = (at: string, who: HistoryItem['who'], action: string, note?: string): HistoryItem => ({ at, who, action, note })
const body1 = 'ด้วยสำนักสารบรรณได้ตรวจสอบข้อมูลหนังสือรับตามเลขทะเบียนอ้างอิงดังกล่าวแล้ว เห็นควรนำเสนอเพื่ออนุมัติบันทึกในทะเบียนหนังสือรับเป็นทางการต่อไป\n\nจึงเรียนมาเพื่อโปรดพิจารณา'

type Seed = Partial<SDoc> & Pick<SDoc, 'id' | 'type' | 'title' | 'createdAt' | 'status'>
const mk = (s: Seed): SDoc => ({
  no: `D-${String(s.id).padStart(3, '0')}`,
  kind: 'internal',
  subject: s.title,
  creator: 'clerk',
  chain: [{ who: 'director', role: 'sign' }],
  step: 0,
  refNo: `RB-2025-${1200 + s.id}`,
  dateDoc: s.createdAt.slice(0, 10),
  body: body1,
  to: 'ผู้อำนวยการ',
  secret: 'ปกติ',
  urgency: 'ปกติ',
  history: [h(s.createdAt, 'clerk', 'สร้างเอกสาร')],
  week: true,
  ...s,
})

export const seedDocs = (): SDoc[] => [
  mk({ id: 1, type: 'บันทึกข้อความ', title: 'เสนออนุมัติขึ้นทะเบียนหนังสือรับ', createdAt: '2025-11-12 09:40', status: 'review', history: [h('2025-11-12 09:40', 'clerk', 'สร้างเอกสาร'), h('2025-11-12 09:41', 'clerk', 'ส่งเอกสารให้ผู้ลงนาม', 'ผอ. สมชาย')] }),
  mk({ id: 2, type: 'หนังสือภายนอก', title: 'แจ้งผลขึ้นทะเบียนให้หน่วยงาน A', createdAt: '2025-11-12 08:10', status: 'review', kind: 'received', sender: 'หน่วยงาน A', extNo: 'ที่ มท 0801/2345', channel: 'ไปรษณีย์', forward: 'forward', action: 'เสนอ ผอ.', history: [h('2025-11-12 08:10', 'clerk', 'ลงทะเบียนหนังสือรับ'), h('2025-11-12 08:12', 'clerk', 'ส่งต่อ', 'เสนอ ผอ.')] }),
  mk({ id: 3, type: 'บันทึกข้อความ', title: 'ขออนุมัติใช้ห้องประชุมไพบูลย์ ประจำเดือนธันวาคม', createdAt: '2025-11-11 15:20', status: 'review', chain: [{ who: 'deputy', role: 'pass' }, { who: 'director', role: 'sign' }], history: [h('2025-11-11 15:20', 'clerk', 'สร้างเอกสาร'), h('2025-11-11 15:21', 'clerk', 'ส่งเอกสารให้ผู้ลงนาม', 'รอง ผอ. วิภา → ผอ. สมชาย')] }),
  mk({ id: 4, type: 'บันทึกข้อความ', title: 'รายงานผลการดำเนินงานไตรมาส 4', createdAt: '2025-11-11 10:05', status: 'review', history: [h('2025-11-11 10:05', 'clerk', 'สร้างเอกสาร'), h('2025-11-11 10:06', 'clerk', 'ส่งเอกสารให้ผู้ลงนาม', 'ผอ. สมชาย')] }),
  mk({ id: 5, type: 'หนังสือภายนอก', title: 'ขอความอนุเคราะห์ข้อมูลโครงการบ้านมั่นคง', createdAt: '2025-11-10 13:45', status: 'review', kind: 'received', sender: 'เทศบาลตำบลแม่แฝก', extNo: 'ที่ ชม 52301/889', channel: 'อีเมลกลาง (saraban@codi.co.th)', forward: 'forward', action: 'เสนอ ผอ.', history: [h('2025-11-10 13:45', 'clerk', 'ลงทะเบียนหนังสือรับ'), h('2025-11-10 13:50', 'clerk', 'ส่งต่อ', 'เสนอ ผอ.')] }),
  mk({ id: 6, type: 'บันทึกข้อความ', title: 'ขออนุมัติจัดอบรมผู้นำชุมชน รุ่นที่ 3', createdAt: '2025-11-10 09:00', status: 'review', history: [h('2025-11-10 09:00', 'clerk', 'สร้างเอกสาร'), h('2025-11-10 09:02', 'clerk', 'ส่งเอกสารให้ผู้ลงนาม', 'ผอ. สมชาย')] }),
  mk({ id: 7, type: 'บันทึกข้อความ', title: 'ขออนุมัติจัดซื้อวัสดุสำนักงาน', createdAt: '2025-11-09 11:30', status: 'signed', issuedNo: 'ที่ พอช. 0412/2568', history: [h('2025-11-09 11:30', 'clerk', 'สร้างเอกสาร'), h('2025-11-09 11:31', 'clerk', 'ส่งเอกสารให้ผู้ลงนาม', 'ผอ. สมชาย'), h('2025-11-09 16:12', 'director', 'ลงนามอนุมัติ'), h('2025-11-09 16:12', 'system', 'ออกเลขทะเบียน', 'ที่ พอช. 0412/2568')] }),
  mk({ id: 8, type: 'หนังสือภายใน', title: 'แจ้งปิดปรับปรุงระบบสารสนเทศ คืนวันเสาร์', createdAt: '2025-11-08 14:00', status: 'signed', issuedNo: 'ที่ พอช. 0409/2568', history: [h('2025-11-08 14:00', 'clerk', 'สร้างเอกสาร'), h('2025-11-08 15:40', 'director', 'ลงนามอนุมัติ'), h('2025-11-08 15:40', 'system', 'ออกเลขทะเบียน', 'ที่ พอช. 0409/2568')], week: false }),
  mk({ id: 9, type: 'บันทึกข้อความ', title: 'ขอเปลี่ยนแปลงกำหนดการประชุมคณะกรรมการ', createdAt: '2025-11-07 16:20', status: 'returned', returnReason: 'กรุณาระบุวันที่ประชุมใหม่ให้ชัดเจน และแนบวาระเพิ่มเติม', history: [h('2025-11-07 16:20', 'clerk', 'สร้างเอกสาร'), h('2025-11-07 16:21', 'clerk', 'ส่งเอกสารให้ผู้ลงนาม', 'ผอ. สมชาย'), h('2025-11-08 09:10', 'director', 'ตีกลับ', 'กรุณาระบุวันที่ประชุมใหม่ให้ชัดเจน และแนบวาระเพิ่มเติม')], week: false }),
  mk({ id: 10, type: 'บันทึกข้อความ', title: 'ขออนุมัติเดินทางไปราชการ จังหวัดเชียงใหม่', createdAt: '2025-11-06 10:40', status: 'draft', history: [h('2025-11-06 10:40', 'clerk', 'บันทึกร่าง')], week: false }),
  mk({ id: 11, type: 'หนังสือภายนอก', title: 'ประชาสัมพันธ์การจัดงานมหกรรมองค์กรชุมชน', createdAt: '2025-11-06 09:15', status: 'circulated', kind: 'received', sender: 'สำนักนายกรัฐมนตรี', extNo: 'ที่ นร 0501/พิเศษ', channel: 'ไปรษณีย์', forward: 'circulate', chain: [], history: [h('2025-11-06 09:15', 'clerk', 'ลงทะเบียนหนังสือรับ'), h('2025-11-06 09:16', 'clerk', 'เวียนแจ้ง', 'ทุกส่วนงาน')] }),
  mk({ id: 12, type: 'หนังสือภายนอก', title: 'ขอเชิญเข้าร่วมประชุมหารือแนวทางการพัฒนาที่อยู่อาศัย', createdAt: '2025-11-05 14:30', status: 'registered', kind: 'received', sender: 'กรมโยธาธิการและผังเมือง', extNo: 'ที่ มท 0710/1203', channel: 'อีเมลกลาง (saraban@codi.co.th)', forward: 'none', chain: [], history: [h('2025-11-05 14:30', 'clerk', 'ลงทะเบียนหนังสือรับ'), h('2025-11-05 14:31', 'clerk', 'ไม่ส่งต่อ', 'เก็บไว้ที่สารบรรณ')], week: false }),
]
