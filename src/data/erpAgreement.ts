// ERP AGREEMENT — งานบริหารจัดการสัญญา (book 3 §2.3.1, Contract and MOU Management)
import { lookupDbd } from './erpAsset'
import { addDays } from './erpBooking'
import { thDate } from './erpProject'
import { stamp } from './strategic'

export { addDays, lookupDbd, stamp, thDate }

// ---- who is looking (demo persona; the real system reads this from SSO) -------------------------
export type GPersona = 'staff' | 'legal' | 'signer'
export const gPersonasA: Record<GPersona, { short: string; name: string }> = {
  staff: { short: 'เจ้าหน้าที่ผู้รับผิดชอบ', name: 'ปริยดา เจริญวัฒนกุล' },
  legal: { short: 'เจ้าหน้าที่นิติกร', name: 'ภัทรา วิเศษสิทธิ์' },
  signer: { short: 'ผู้มีอำนาจในการลงนาม', name: 'ดร.สมชาย มั่นคงสุข' },
}

// ---- contract types (templates) -----------------------------------------------------------------
export type TypeKey = 'hire' | 'sale' | 'rent' | 'consult' | 'mou' | 'other'
export const types: { key: TypeKey; label: string; desc: string; pages: string[]; tag: string }[] = [
  { key: 'hire', label: 'สัญญาจ้างเหมา', desc: 'จ้างเหมาบริการหรือจ้างทำของ ระบุขอบเขตงาน ค่าจ้าง และงวดการจ่ายเงิน', tag: 'จ้าง', pages: ['ขอบเขตงานและค่าจ้าง', 'ระยะเวลา การส่งมอบ และค่าปรับ'] },
  { key: 'sale', label: 'สัญญาซื้อขาย', desc: 'ซื้อขายพัสดุ ครุภัณฑ์ ระบุรายการ ราคา การส่งมอบ และการรับประกัน', tag: 'ซื้อขาย', pages: ['รายการและราคา', 'การส่งมอบ การรับประกัน และค่าปรับ'] },
  { key: 'rent', label: 'สัญญาเช่า', desc: 'เช่าอาคาร สถานที่ หรือทรัพย์สิน กำหนดค่าเช่าและเงื่อนไขการต่อสัญญา', tag: 'เช่า', pages: ['ทรัพย์สินที่เช่าและค่าเช่า', 'หน้าที่ของผู้เช่า การบอกเลิก และการต่อสัญญา'] },
  { key: 'consult', label: 'สัญญาจ้างที่ปรึกษา', desc: 'จ้างที่ปรึกษาศึกษา วิเคราะห์ ออกแบบ พร้อมงวดงานและผลงานที่ต้องส่งมอบ', tag: 'ที่ปรึกษา', pages: ['ขอบเขตงานและผลงานที่ต้องส่งมอบ', 'งวดงาน ค่าจ้าง และลิขสิทธิ์ผลงาน'] },
  { key: 'mou', label: 'บันทึกข้อตกลงความร่วมมือ (MOU)', desc: 'ความร่วมมือระหว่าง พอช. กับหน่วยงานหรือองค์กรชุมชน ไม่มีวงเงินผูกพัน', tag: 'MOU', pages: ['วัตถุประสงค์และขอบเขตความร่วมมือ', 'บทบาทของแต่ละฝ่ายและระยะเวลา'] },
  { key: 'other', label: 'สัญญาอื่น ๆ', desc: 'สัญญาที่ไม่อยู่ในประเภทข้างต้น ใช้แบบฟอร์มทั่วไปให้ระบุสาระสำคัญเอง', tag: 'อื่น ๆ', pages: ['สาระสำคัญของสัญญา', 'เงื่อนไขทั่วไป'] },
]
export const typeOf = (k: TypeKey) => types.find((t) => t.key === k)!

// ---- community organisations (lookup demo — the real system reads the OSS organisation database) -
export type Party = { name: string; address: string; taxId: string; signer: string; position: string; src: 'dbd' | 'community' | 'manual' }
export const communityOrgs: Party[] = [
  { name: 'สภาองค์กรชุมชนตำบลหนองกรด', address: '12 หมู่ 3 ต.หนองกรด อ.เมือง จ.นครสวรรค์ 60000', taxId: '0993000112345', signer: 'นางบุญเรือน แก้วมณี', position: 'ประธานสภา', src: 'community' },
  { name: 'ชุมชนบ้านมั่นคงริมคลองลาดพร้าว', address: '88 ซอยลาดพร้าว 101 เขตบางกะปิ กรุงเทพมหานคร 10240', taxId: '0993000254321', signer: 'นายสมเกียรติ ใจดี', position: 'ประธานชุมชน', src: 'community' },
  { name: 'เครือข่ายองค์กรชุมชนภาคเหนือตอนบน', address: '45 ถนนห้วยแก้ว ต.สุเทพ อ.เมือง จ.เชียงใหม่ 50200', taxId: '0993000376543', signer: 'นางสาวพรรณี สายสุวรรณ', position: 'ประธานเครือข่าย', src: 'community' },
]
export const findCommunity = (q: string) => communityOrgs.find((o) => o.name.includes(q.trim()) || o.taxId === q.replace(/\D/g, ''))
export const dbdParty = (taxId: string): Party | undefined => {
  const v = lookupDbd(taxId)
  return v ? { name: v.name, address: v.address, taxId: v.taxId, signer: '', position: 'กรรมการผู้มีอำนาจ', src: 'dbd' } : undefined
}

/** ผู้ว่าจ้าง — fixed (book: "แสดงข้อมูลของ พอช. เป็นรูปแบบพื้นฐานที่ไม่สามารถแก้ไขได้") */
export const employer: Party = { name: 'สถาบันพัฒนาองค์กรชุมชน (องค์การมหาชน)', address: '912 ถนนนวมินทร์ แขวงนวลจันทร์ เขตบึงกุ่ม กรุงเทพมหานคร 10230', taxId: '0994000160097', signer: 'ดร.สมชาย มั่นคงสุข', position: 'ผู้อำนวยการ', src: 'manual' }

// ---- contracts -------------------------------------------------------------------------------------
export type CStatus = 'ร่าง' | 'รอตรวจสอบ' | 'ต้องแก้ไข' | 'รอลงนาม' | 'ลงนามแล้ว' | 'ไม่อนุมัติ'
export const cTone: Record<CStatus, { tone: string; dot: string }> = {
  ร่าง: { tone: 'bg-gray-bg text-gray-30', dot: 'bg-gray-20' },
  รอตรวจสอบ: { tone: 'bg-[#fff1d6] text-[#a8650b]', dot: 'bg-[#e08a00]' },
  ต้องแก้ไข: { tone: 'bg-[#ffe3e3] text-[#c13232]', dot: 'bg-[#dc3b3b]' },
  รอลงนาม: { tone: 'bg-[#e9e7ff] text-[#5b44d6]', dot: 'bg-[#6a55e8]' },
  ลงนามแล้ว: { tone: 'bg-[#dff5e8] text-[#0f8a63]', dot: 'bg-[#16a571]' },
  ไม่อนุมัติ: { tone: 'bg-[#ffe3e3] text-[#c13232]', dot: 'bg-[#dc3b3b]' },
}
export type CEvent = { at: string; by: string; action: string; note?: string }
export type PageNote = { page: number; text: string }
export type Contract = {
  id: number
  no: string
  title: string
  type: TypeKey
  status: CStatus
  party: Party
  purpose: string
  value: number
  start: string
  end: string
  signDate: string
  owner: string // หน่วยงานเจ้าของสัญญา
  resp: string // ผู้รับผิดชอบสัญญา
  file: string // attached signed file name
  createdAt: string
  updatedAt: string
  notes: PageNote[]
  history: CEvent[]
  fromRegistry: boolean
}
/** Thai fiscal year (1 Oct – 30 Sep) in พ.ศ. */
export const fiscalYear = (iso: string) => { const [y, m] = iso.split('-').map(Number); return (m >= 10 ? y + 1 : y) + 543 }
export type Due = 'ปกติ' | 'ใกล้ครบกำหนด' | 'เลยกำหนด' | '-'
/** only signed contracts have a due state: expired = เลยกำหนด, ends within 60 days = ใกล้ครบกำหนด */
export function dueOf(c: Contract, today = addDays(0)): Due {
  if (c.status !== 'ลงนามแล้ว' || !c.end) return '-'
  if (c.end < today) return 'เลยกำหนด'
  return c.end <= addDays(60, new Date(today + 'T00:00:00')) ? 'ใกล้ครบกำหนด' : 'ปกติ'
}
export const dueTone: Record<Due, string> = { ปกติ: 'bg-[#dff5e8] text-[#0f8a63]', ใกล้ครบกำหนด: 'bg-[#fff1d6] text-[#a8650b]', เลยกำหนด: 'bg-[#ffe3e3] text-[#c13232]', '-': 'bg-gray-bg text-gray-30' }
export const nextContractNo = (list: Contract[], date = addDays(0)) => {
  const base = `AG${date.replace(/-/g, '')}`
  const n = list.filter((c) => c.no.startsWith(base)).length
  return n ? `${base}-${n + 1}` : base
}
export const money = (n: number) => n.toLocaleString('th-TH', { minimumFractionDigits: 2, maximumFractionDigits: 2 })

const ev = (at: string, by: string, action: string, note?: string): CEvent => ({ at, by, action, note })
const t = (n: number, hm = '10:00') => `${addDays(n)} ${hm}`
const U = gPersonasA.staff.name, L = gPersonasA.legal.name, S = gPersonasA.signer.name
const vend = (id: string): Party => dbdParty(id)!
const base = { notes: [] as PageNote[], file: '', fromRegistry: false, signDate: '' }
export const seedContracts = (): Contract[] => [
  { ...base, id: 1, no: 'AG20251011', title: 'สัญญาเช่าพื้นที่จัดเก็บเอกสาร', type: 'rent', status: 'รอตรวจสอบ', party: { ...vend('0105556012345'), signer: 'นายวิชัย รุ่งเรือง', position: 'กรรมการผู้จัดการ' }, purpose: 'เช่าพื้นที่คลังเอกสารกลาง ชั้น 2 เพื่อจัดเก็บเอกสารโครงการ', value: 360000, start: addDays(10), end: addDays(375), owner: 'สำนักบริหารงานกลาง', resp: U, createdAt: t(-2, '09:20'), updatedAt: t(-1, '15:40'), history: [ev(t(-2, '09:20'), U, 'สร้างสัญญาใหม่'), ev(t(-1, '15:40'), U, 'ส่งตรวจสอบ')] },
  { ...base, id: 2, no: 'AG20251020', title: 'สัญญาจ้างเหมาปรับปรุงระบบเครือข่ายสำนักงาน', type: 'hire', status: 'รอตรวจสอบ', party: { ...vend('0105548098765'), signer: 'นางสาวอรุณี ทรัพย์มาก', position: 'กรรมการผู้มีอำนาจ' }, purpose: 'ปรับปรุงระบบเครือข่ายและเดินสายสัญญาณ อาคาร A ชั้น 3–5', value: 1280000, start: addDays(14), end: addDays(134), owner: 'สำนักบริหารงานกลาง', resp: 'ธนพล กิตติพันธ์', createdAt: t(-3, '11:05'), updatedAt: t(-2, '16:10'), history: [ev(t(-3, '11:05'), 'ธนพล กิตติพันธ์', 'สร้างสัญญาใหม่'), ev(t(-2, '16:10'), 'ธนพล กิตติพันธ์', 'ส่งตรวจสอบ')] },
  { ...base, id: 3, no: 'AG20251105', title: 'บันทึกข้อตกลงความร่วมมือพัฒนาผู้นำชุมชนภาคเหนือ', type: 'mou', status: 'รอลงนาม', party: { ...communityOrgs[2] }, purpose: 'ร่วมพัฒนาศักยภาพผู้นำชุมชนและแลกเปลี่ยนเรียนรู้ระหว่างเครือข่าย', value: 0, start: addDays(7), end: addDays(737), owner: 'สำนักพัฒนาผู้นำ', resp: U, createdAt: t(-6, '10:30'), updatedAt: t(-1, '09:00'), history: [ev(t(-6, '10:30'), U, 'สร้างสัญญาใหม่'), ev(t(-5, '14:00'), U, 'ส่งตรวจสอบ'), ev(t(-1, '09:00'), L, 'ผ่านการตรวจสอบ', 'เนื้อหาครบถ้วน ไม่มีข้อกฎหมายที่ต้องแก้ไข')] },
  { ...base, id: 4, no: 'AG20250918', title: 'สัญญาซื้อขายเครื่องคอมพิวเตอร์โน้ตบุ๊ก 20 เครื่อง', type: 'sale', status: 'ต้องแก้ไข', party: { ...vend('0105556012345'), signer: 'นายวิชัย รุ่งเรือง', position: 'กรรมการผู้จัดการ' }, purpose: 'จัดซื้อโน้ตบุ๊กสำหรับเจ้าหน้าที่ภูมิภาค พร้อมรับประกัน 3 ปี', value: 640000, start: addDays(-4), end: addDays(56), owner: 'สำนักบริหารงานกลาง', resp: U, createdAt: t(-9, '13:15'), updatedAt: t(-3, '11:30'), notes: [{ page: 2, text: 'ข้อ 7 ค่าปรับร้อยละ 0.1 ต่อวัน ควรปรับเป็นร้อยละ 0.2 ตามระเบียบพัสดุ' }], history: [ev(t(-9, '13:15'), U, 'สร้างสัญญาใหม่'), ev(t(-8, '09:30'), U, 'ส่งตรวจสอบ'), ev(t(-3, '11:30'), L, 'ให้ปรับปรุงสัญญา', 'ข้อ 7 ค่าปรับต่ำกว่าอัตราตามระเบียบ')] },
  { ...base, id: 5, no: 'AG20250601', title: 'สัญญาจ้างที่ปรึกษาออกแบบระบบสารสนเทศ', type: 'consult', status: 'ลงนามแล้ว', party: { ...vend('0105560111222'), signer: 'นายประเสริฐ ศรีทอง', position: 'กรรมการ' }, purpose: 'ศึกษา วิเคราะห์ และออกแบบระบบสารสนเทศเพื่อปรับเปลี่ยนสู่องค์กรดิจิทัล', value: 4800000, start: '2025-06-15', end: addDays(-20), signDate: '2025-06-10', owner: 'สำนักแผนงาน', resp: 'วรรณา ศรีสุข', file: 'AG20250601-signed.pdf', fromRegistry: true, createdAt: '2025-06-01 10:00', updatedAt: '2025-06-10 15:30', history: [ev('2025-06-01 10:00', 'วรรณา ศรีสุข', 'สร้างสัญญาใหม่'), ev('2025-06-10 15:30', S, 'ลงนามสัญญา')] },
  { ...base, id: 6, no: 'AG20250812', title: 'สัญญาเช่ารถตู้พร้อมพนักงานขับรถ', type: 'rent', status: 'ลงนามแล้ว', party: { ...vend('0103562004321'), signer: 'นายธีรพงษ์ อินทร์แก้ว', position: 'หุ้นส่วนผู้จัดการ' }, purpose: 'เช่ารถตู้ 12 ที่นั่ง พร้อมพนักงานขับรถ สำหรับลงพื้นที่ภาคตะวันออกเฉียงเหนือ', value: 540000, start: '2025-09-01', end: addDays(35), signDate: '2025-08-25', owner: 'สำนักบริหารงานกลาง', resp: U, file: 'AG20250812-signed.pdf', fromRegistry: true, createdAt: '2025-08-12 09:00', updatedAt: '2025-08-25 16:00', history: [ev('2025-08-12 09:00', U, 'สร้างสัญญาใหม่'), ev('2025-08-25 16:00', S, 'ลงนามสัญญา')] },
  { ...base, id: 7, no: 'AG20250305', title: 'MOU ความร่วมมือสนับสนุนสภาองค์กรชุมชน จ.นครสวรรค์', type: 'mou', status: 'ลงนามแล้ว', party: { ...communityOrgs[0] }, purpose: 'สนับสนุนการจัดตั้งและพัฒนาสภาองค์กรชุมชนระดับตำบล', value: 0, start: '2025-03-20', end: addDays(300), signDate: '2025-03-15', owner: 'สำนักพัฒนาผู้นำ', resp: 'ธนพล กิตติพันธ์', file: 'MOU-nakhonsawan.pdf', fromRegistry: true, createdAt: '2025-03-05 11:00', updatedAt: '2025-03-15 14:00', history: [ev('2025-03-05 11:00', 'ธนพล กิตติพันธ์', 'สร้างสัญญาใหม่'), ev('2025-03-15 14:00', S, 'ลงนามสัญญา')] },
  { ...base, id: 8, no: 'AG20250722', title: 'สัญญาซื้อขายครุภัณฑ์เครื่องปรับอากาศ', type: 'sale', status: 'ลงนามแล้ว', party: { ...vend('0105560111222'), signer: 'นายประเสริฐ ศรีทอง', position: 'กรรมการ' }, purpose: 'ซื้อและติดตั้งเครื่องปรับอากาศ ห้องประชุมใหญ่ ชั้น 5', value: 420000, start: '2025-08-01', end: addDays(190), signDate: '2025-07-28', owner: 'สำนักบริหารงานกลาง', resp: U, file: 'AG20250722-signed.pdf', fromRegistry: true, createdAt: '2025-07-22 10:30', updatedAt: '2025-07-28 15:00', history: [ev('2025-07-22 10:30', U, 'สร้างสัญญาใหม่'), ev('2025-07-28 15:00', S, 'ลงนามสัญญา')] },
  { ...base, id: 9, no: 'AG20251030', title: 'สัญญาจ้างเหมาจัดทำสื่อวิดีโอประชาสัมพันธ์', type: 'hire', status: 'ร่าง', party: { name: '', address: '', taxId: '', signer: '', position: '', src: 'manual' }, purpose: '', value: 0, start: '', end: '', owner: 'สำนักสื่อสารองค์กร', resp: U, createdAt: t(0, '08:45'), updatedAt: t(0, '08:45'), history: [ev(t(0, '08:45'), U, 'บันทึกร่าง')] },
  { ...base, id: 10, no: 'AG20250415', title: 'สัญญาเช่าเครื่องถ่ายเอกสารมัลติฟังก์ชัน', type: 'rent', status: 'ลงนามแล้ว', party: { ...vend('0105548098765'), signer: 'นางสาวอรุณี ทรัพย์มาก', position: 'กรรมการผู้มีอำนาจ' }, purpose: 'เช่าเครื่องถ่ายเอกสาร 3 เครื่อง พร้อมบริการซ่อมบำรุง', value: 216000, start: '2025-05-01', end: addDays(-60), signDate: '2025-04-24', owner: 'สำนักบริหารงานกลาง', resp: U, file: 'AG20250415-signed.pdf', fromRegistry: true, createdAt: '2025-04-15 09:30', updatedAt: '2025-04-24 14:30', history: [ev('2025-04-15 09:30', U, 'สร้างสัญญาใหม่'), ev('2025-04-24 14:30', S, 'ลงนามสัญญา')] },
]
