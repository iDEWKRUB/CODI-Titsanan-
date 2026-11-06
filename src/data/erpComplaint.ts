// ERP COMPLAINT — งานรับเรื่องร้องเรียน (Feedback and Complaint Management) — book 3 §2.1.9, process from book 1 §2.2.7.5
import { addDays } from './erpBooking'
import { thDate } from './erpProject'
import { stamp } from './strategic'

export { addDays, stamp, thDate }

export const ctypes = ['ทุจริต', 'การบริการ', 'ความไม่โปร่งใส', 'ข้อเสนอแนะ', 'อื่น ๆ'] as const
export type CType = (typeof ctypes)[number]
/** types that can end up as a case (คดี) */
export const caseTypes: CType[] = ['ทุจริต', 'ความไม่โปร่งใส']
export const channels = ['เว็บไซต์', 'โทรศัพท์', 'จดหมาย/หนังสือ', 'อีเมล', 'ตู้รับเรื่องร้องเรียน', 'เจ้าหน้าที่บันทึกให้'] as const
export const agencies = ['สำนักตรวจสอบภายใน', 'สำนักบริหารงานกลาง', 'สำนักบริหารทรัพยากรบุคคล', 'สำนักกฎหมาย', 'สำนักพัฒนาองค์กรชุมชน', 'สำนักเทคโนโลยีสารสนเทศ']
export type Urgency = 'สูง' | 'ปานกลาง' | 'ปกติ'
export const urgencyTone: Record<Urgency, string> = { สูง: 'bg-[#ffe3e3] text-[#c13232]', ปานกลาง: 'bg-[#fff1d6] text-[#a8650b]', ปกติ: 'bg-[#e8f1ff] text-[#2057c9]' }
export const stages = ['รับเรื่องแล้ว', 'ตรวจสอบเบื้องต้น', 'มอบหมายหน่วยงาน', 'ปิดเรื่องแล้ว'] as const
export const stageTone = ['bg-[#e9e7ff] text-[#5b44d6]', 'bg-[#fff1d6] text-[#a8650b]', 'bg-[#e0efff] text-[#2057c9]', 'bg-[#dff5e8] text-[#0f8a63]']
export const SLA_DAYS = 15

export type CEvent = { at: string; by: string; action: string; note?: string }
export type Complaint = {
  id: number
  no: string
  type: CType
  channel: (typeof channels)[number]
  subject: string
  detail: string
  complainant: string
  agency: string
  urgency: Urgency
  stage: 0 | 1 | 2 | 3
  receivedAt: string // ISO date
  closedAt?: string
  result?: string
  caseNo?: string
  caseTitle?: string
  hearing?: string // ISO date of the hearing
  hearingNote?: string
  history: CEvent[]
}
export const ME = 'ธนากร สำนักผู้อำนวยการ'
export const daysBetween = (a: string, b: string) => Math.round((+new Date(b) - +new Date(a)) / 86400000)
export const daysLeft = (c: Complaint, today = addDays(0)) => SLA_DAYS - daysBetween(c.receivedAt, today)
export const closedInSla = (c: Complaint) => !!c.closedAt && daysBetween(c.receivedAt, c.closedAt) <= SLA_DAYS
export const nextNo = (list: Complaint[], d = new Date()) => {
  const p = `CMP-${String((d.getFullYear() + 543) % 100)}${String(d.getMonth() + 1).padStart(2, '0')}-`
  return p + String(list.filter((c) => c.no.startsWith(p)).length + 1).padStart(3, '0')
}
export const nextCaseNo = (list: Complaint[]) => `CASE-${new Date().getFullYear() + 543}-${String(list.filter((c) => c.caseNo).length + 1).padStart(3, '0')}`

const ev = (n: number, by: string, action: string, note?: string): CEvent => ({ at: `${addDays(n)} 10:00`, by, action, note })
const mk = (id: number, no: string, type: CType, channel: Complaint['channel'], subject: string, detail: string, complainant: string, urgency: Urgency, stage: 0 | 1 | 2 | 3, recvDaysAgo: number, extra: Partial<Complaint> = {}): Complaint => ({
  id, no, type, channel, subject, detail, complainant, agency: '', urgency, stage, receivedAt: addDays(-recvDaysAgo),
  history: [ev(-recvDaysAgo, ME, 'รับเรื่องแล้ว'), ...(stage >= 1 ? [ev(-recvDaysAgo + 1, ME, 'ตรวจสอบเบื้องต้น')] : []), ...(stage >= 2 ? [ev(-recvDaysAgo + 2, ME, 'มอบหมายหน่วยงาน', extra.agency)] : []), ...(stage >= 3 ? [ev(-recvDaysAgo + (extra.closedAt ? daysBetween(addDays(-recvDaysAgo), extra.closedAt) : 8), ME, 'ปิดเรื่องแล้ว', extra.result)] : [])],
  ...extra,
})
export const seedComplaints = (): Complaint[] => [
  mk(1, 'CMP-6811-004', 'การบริการ', 'เว็บไซต์', 'ระบบยื่นคำขอจดทะเบียนสภาองค์กรชุมชนใช้งานไม่ได้', 'กรอกข้อมูลครบแล้วกดส่งไม่ผ่าน ลองมา 3 วัน', 'นางสมหญิง ใจดี', 'ปานกลาง', 0, 1),
  mk(2, 'CMP-6811-003', 'ทุจริต', 'จดหมาย/หนังสือ', 'สงสัยการเบิกค่าเดินทางซ้ำซ้อนในโครงการพื้นที่ภาคใต้', 'พบรายการเบิกค่าพาหนะเดียวกันสองครั้งในใบสำคัญจ่ายเดือนกันยายน', 'ไม่ประสงค์ออกนาม', 'สูง', 1, 4),
  mk(3, 'CMP-6811-002', 'ความไม่โปร่งใส', 'อีเมล', 'การคัดเลือกผู้รับจ้างจัดอบรมไม่เปิดเผยเกณฑ์', 'ขอให้ชี้แจงเกณฑ์การให้คะแนนผู้เสนอราคาจัดอบรมผู้นำชุมชน', 'นายประเสริฐ สมบูรณ์', 'สูง', 2, 7, { agency: 'สำนักตรวจสอบภายใน' }),
  mk(4, 'CMP-6811-001', 'ข้อเสนอแนะ', 'ตู้รับเรื่องร้องเรียน', 'เสนอให้เพิ่มช่องทางจองห้องประชุมผ่านมือถือ', 'อยากให้จองห้องและดูตารางห้องว่างผ่านโทรศัพท์ได้', 'เจ้าหน้าที่ สำนักพัฒนาองค์กรชุมชน', 'ปกติ', 3, 12, { agency: 'สำนักเทคโนโลยีสารสนเทศ', closedAt: addDays(-3), result: 'รับไว้พิจารณาในโครงการ ERP BOOKING' }),
  mk(5, 'CMP-6810-009', 'การบริการ', 'โทรศัพท์', 'เจ้าหน้าที่ตอบข้อซักถามล่าช้า', 'โทรสอบถามสถานะโครงการ 3 ครั้ง ไม่มีผู้ติดต่อกลับ', 'นางบุญเรือน แก้วมณี', 'ปกติ', 3, 25, { agency: 'สำนักพัฒนาองค์กรชุมชน', closedAt: addDays(-12), result: 'ชี้แจงผู้ร้องแล้ว และปรับเวรรับโทรศัพท์' }),
  mk(6, 'CMP-6810-008', 'ทุจริต', 'จดหมาย/หนังสือ', 'ร้องเรียนการเรียกรับผลประโยชน์ในการอนุมัติโครงการ', 'มีการเรียกรับเงินเพื่อให้โครงการผ่านการพิจารณา', 'ไม่ประสงค์ออกนาม', 'สูง', 2, 20, { agency: 'สำนักกฎหมาย', caseNo: 'CASE-2569-001', caseTitle: 'กรณีร้องเรียนเรียกรับผลประโยชน์ในการอนุมัติโครงการ', hearing: addDays(5), hearingNote: 'คณะกรรมการสอบข้อเท็จจริง ห้องประชุมใหญ่ ชั้น 5 เวลา 13:30 น.' }),
  mk(7, 'CMP-6810-007', 'อื่น ๆ', 'เว็บไซต์', 'ขอทราบขั้นตอนการขอสินเชื่อชุมชน', 'ไม่พบข้อมูลวิธียื่นขอสินเชื่อบนเว็บไซต์', 'ชุมชนบ้านมั่นคงริมคลองลาดพร้าว', 'ปกติ', 3, 30, { agency: 'สำนักพัฒนาองค์กรชุมชน', closedAt: addDays(-22), result: 'ส่งลิงก์คู่มือและนัดอธิบายทางโทรศัพท์' }),
  mk(8, 'CMP-6810-006', 'ความไม่โปร่งใส', 'ตู้รับเรื่องร้องเรียน', 'ประกาศผลจัดซื้อเครื่องปรับอากาศล่าช้า', 'ประกาศผลเกินกำหนด 10 วันโดยไม่มีคำอธิบาย', 'เจ้าหน้าที่ ฝ่ายพัสดุ', 'ปานกลาง', 3, 38, { agency: 'สำนักบริหารงานกลาง', closedAt: addDays(-14), result: 'ชี้แจงเหตุล่าช้าและปรับขั้นตอนประกาศผล' }),
  mk(9, 'CMP-6810-005', 'การบริการ', 'อีเมล', 'เอกสารรับรองสถานะองค์กรชุมชนออกช้า', 'ขอเอกสารไปแล้ว 3 สัปดาห์ยังไม่ได้รับ', 'นางสาวพรรณี สายสุวรรณ', 'ปานกลาง', 1, 6),
  mk(10, 'CMP-6810-004', 'ทุจริต', 'เจ้าหน้าที่บันทึกให้', 'สงสัยการจัดซื้อจัดจ้างแบบเฉพาะเจาะจงซ้ำผู้ขายรายเดียว', 'ผู้ขายรายเดียวได้งานเฉพาะเจาะจง 5 ครั้งในปีงบประมาณ', 'ไม่ประสงค์ออกนาม', 'สูง', 0, 2),
  mk(11, 'CMP-6810-003', 'ข้อเสนอแนะ', 'เว็บไซต์', 'เสนอให้มีคู่มือวิดีโอการใช้ระบบ', 'คู่มือแบบข้อความยาวและอ่านยาก', 'วรรณา ศรีสุข', 'ปกติ', 3, 45, { agency: 'สำนักเทคโนโลยีสารสนเทศ', closedAt: addDays(-31), result: 'รับไว้จัดทำวิดีโอสอนใช้งาน' }),
  mk(12, 'CMP-6810-002', 'ความไม่โปร่งใส', 'จดหมาย/หนังสือ', 'ขอให้เปิดเผยรายชื่อกรรมการพิจารณาโครงการ', 'ต้องการทราบรายชื่อและคุณสมบัติกรรมการพิจารณา', 'นายธนพล กิตติพันธ์', 'ปานกลาง', 2, 14, { agency: 'สำนักกฎหมาย', caseNo: 'CASE-2569-002', caseTitle: 'กรณีขอเปิดเผยข้อมูลตามกฎหมายข้อมูลข่าวสาร', hearing: addDays(12), hearingNote: 'คณะกรรมการข้อมูลข่าวสาร ห้องประชุม 2 เวลา 10:00 น.' }),
]
