// AI NOTIFICATION CENTER — ศูนย์แจ้งเตือนกลาง (book 3 §2.5.2: รายการทั้งหมด / ของฉัน / ตั้งค่า)
import { addDays } from './erpBooking'
import { thDate } from './erpProject'
import { stamp } from './strategic'

export { addDays, stamp, thDate }

export type NPersona = 'staff' | 'admin'
export const nPersonas: Record<NPersona, { short: string; name: string; office: string }> = {
  staff: { short: 'เจ้าหน้าที่ พอช.', name: 'ปริยดา เจริญวัฒนกุล', office: 'สำนักบริหารงานกลาง' },
  admin: { short: 'เจ้าหน้าที่ผู้ดูแลระบบ', name: 'วิชัย ดูแลระบบ', office: 'สำนักเทคโนโลยีสารสนเทศ' },
}

export type Severity = 'ทั่วไป' | 'ปานกลาง' | 'สูง'
export const sevTone: Record<Severity, { tone: string; dot: string; icon: string }> = {
  ทั่วไป: { tone: 'bg-[#e8f1ff] text-[#2057c9]', dot: 'bg-[#2b6bf0]', icon: 'bg-[#e8f1ff] text-[#2057c9]' },
  ปานกลาง: { tone: 'bg-[#fff1d6] text-[#a8650b]', dot: 'bg-[#e08a00]', icon: 'bg-[#fff1d6] text-[#a8650b]' },
  สูง: { tone: 'bg-[#ffe3e3] text-[#c13232]', dot: 'bg-[#dc3b3b]', icon: 'bg-[#ffe3e3] text-[#c13232]' },
}
export type NStatus = 'ใหม่' | 'รอดำเนินการ' | 'ตอบสนองแล้ว' | 'ตั้งเวลา'
export const nTone: Record<NStatus, { tone: string; dot: string }> = {
  ใหม่: { tone: 'bg-[#e9e7ff] text-[#5b44d6]', dot: 'bg-[#6a55e8]' },
  รอดำเนินการ: { tone: 'bg-[#fff1d6] text-[#a8650b]', dot: 'bg-[#e08a00]' },
  ตอบสนองแล้ว: { tone: 'bg-[#dff5e8] text-[#0f8a63]', dot: 'bg-[#16a571]' },
  ตั้งเวลา: { tone: 'bg-gray-bg text-gray-30', dot: 'bg-gray-20' },
}

/** the topics a notification can be raised for — each knows its source system, default severity and where "ดูข้อมูลเพิ่มเติม" leads */
export const topics: { key: string; label: string; source: string; sev: Severity; to: string }[] = [
  { key: 'contract', label: 'สัญญาใกล้ครบกำหนด', source: 'ERP AGREEMENT', sev: 'ปานกลาง', to: '/agreement/registry' },
  { key: 'budget', label: 'งบประมาณโครงการเหลือน้อย', source: 'ERP FINANCE', sev: 'สูง', to: '/finance' },
  { key: 'stock', label: 'พัสดุใกล้หมดสต็อก', source: 'ERP ASSET', sev: 'ทั่วไป', to: '/asset' },
  { key: 'doc', label: 'เอกสารรอดำเนินการ', source: 'ERP SARABAN', sev: 'ปานกลาง', to: '/saraban' },
  { key: 'booking', label: 'คำขอจอง/ยืมรออนุมัติ', source: 'ERP BOOKING', sev: 'ทั่วไป', to: '/booking' },
  { key: 'loan', label: 'ลูกหนี้ค้างชำระ', source: 'งานสินเชื่อ', sev: 'สูง', to: '/loan/debtors' },
  { key: 'meeting', label: 'ประชุม/นัดหมาย', source: 'e-Meeting', sev: 'ทั่วไป', to: '/meeting' },
  { key: 'other', label: 'อื่น ๆ', source: 'ผู้ดูแลระบบ', sev: 'ทั่วไป', to: '/notifications' },
]
export const topicOf = (k: string) => topics.find((t) => t.key === k) ?? topics[topics.length - 1]

export const offices = ['ทุกคน', 'สำนักบริหารงานกลาง', 'สำนักแผนงาน', 'สำนักพัฒนาผู้นำ', 'สำนักสื่อสารองค์กร', 'สำนักเทคโนโลยีสารสนเทศ', 'ฝ่ายการเงินและบัญชี']
export const people = ['ปริยดา เจริญวัฒนกุล', 'อนุชา พรหมมา', 'ภัทรา วิเศษสิทธิ์', 'วรรณา ศรีสุข', 'ธนพล กิตติพันธ์']
export const repeats = ['ครั้งเดียว', 'ทุกวัน', 'ทุกสัปดาห์', 'ทุกเดือน']
export const channels = ['ในระบบ (Notification Center)', 'อีเมล']

export type Notice = {
  id: number
  topic: string
  title: string
  detail: string
  severity: Severity
  source: string
  to: string
  recipients: string[]
  date: string // ISO date to deliver
  time: string // HH:mm
  repeat: string
  channels: string[]
  status: NStatus
  by: string
  createdAt: string
  handledAt?: string
}
export const isDue = (n: Pick<Notice, 'date' | 'time'>, now = new Date()) => `${n.date} ${n.time}` <= `${addDays(0, now)} ${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`
/** is this notice addressed to the persona (directly, by office, or to everyone)? */
export const forMe = (n: Notice, p: NPersona) => n.recipients.some((r) => r === 'ทุกคน' || r === nPersonas[p].name || r === nPersonas[p].office)
/** short Thai text for "วันนี้ 09:30" / "5 พ.ย. 69" style cells */
export const when = (n: Notice) => `${thDate(n.date)} ${n.time} น.`

const U = nPersonas.staff.name, S = nPersonas.admin.name
const mk = (id: number, topic: string, title: string, detail: string, o: Partial<Notice>): Notice => {
  const t = topicOf(topic)
  return { id, topic, title, detail, severity: t.sev, source: t.source, to: t.to, recipients: [nPersonas.staff.office], date: addDays(0), time: '09:00', repeat: 'ครั้งเดียว', channels: [channels[0]], status: 'ใหม่', by: 'ระบบอัตโนมัติ (AI)', createdAt: '', ...o }
}
export const seedNotices = (): Notice[] => [
  mk(1, 'budget', 'งบโครงการเหลือน้อยกว่าร้อยละ 10', 'งบประมาณโครงการ “พัฒนาผู้นำชุมชนภาคเหนือ” เหลือ 82,400 บาท จากงบทั้งหมด 1,200,000 บาท ควรตรวจสอบรายการเบิกจ่ายที่รอดำเนินการก่อนสิ้นเดือน', { severity: 'สูง', recipients: [U, 'ฝ่ายการเงินและบัญชี'], date: addDays(0), time: '08:30', createdAt: `${addDays(0)} 08:30` }),
  mk(2, 'loan', 'ลูกหนี้เกินกำหนดชำระมากกว่า 90 วัน 3 ราย', 'ระบบพบลูกหนี้สินเชื่อองค์กรชุมชนที่เกินกำหนดชำระเกิน 90 วัน ควรติดตามหรือจัดทำหนังสือทวงถาม', { severity: 'สูง', recipients: ['ทุกคน'], date: addDays(0), time: '08:00', createdAt: `${addDays(0)} 08:00` }),
  mk(3, 'contract', 'สัญญา AG20250812 จะครบกำหนดภายใน 35 วัน', 'สัญญาเช่ารถตู้พร้อมพนักงานขับรถ จะสิ้นสุดตามกำหนด กรุณาพิจารณาต่ออายุสัญญาก่อนครบกำหนดอย่างน้อย 30 วัน', { severity: 'ปานกลาง', recipients: [U], date: addDays(-1), time: '16:00', status: 'รอดำเนินการ', createdAt: `${addDays(-1)} 16:00` }),
  mk(4, 'doc', 'มีหนังสือเข้าใหม่รอลงรับ 4 ฉบับ', 'หนังสือรับจากภายนอกที่ยังไม่ได้ลงทะเบียนรับ ควรดำเนินการภายในวันนี้', { severity: 'ปานกลาง', recipients: [U], date: addDays(-1), time: '10:15', status: 'ตอบสนองแล้ว', handledAt: `${addDays(-1)} 11:40`, createdAt: `${addDays(-1)} 10:15` }),
  mk(5, 'stock', 'พัสดุถึงจุดสั่งซื้อ 2 รายการ', 'กระดาษ A4 และหมึกพิมพ์ คงเหลือต่ำกว่าจุดสั่งซื้อ สามารถจัดทำประกาศจัดซื้อได้จากระบบพัสดุ', { severity: 'ทั่วไป', recipients: ['สำนักบริหารงานกลาง'], date: addDays(-2), time: '09:00', status: 'รอดำเนินการ', createdAt: `${addDays(-2)} 09:00` }),
  mk(6, 'booking', 'มีคำขอจองห้องประชุมรออนุมัติ 3 รายการ', 'คำขอจอง ห้องประชุม 1 วันที่ใกล้ถึง ผู้มีอำนาจควรพิจารณาก่อนวันใช้งาน', { severity: 'ทั่วไป', recipients: [S, 'สำนักบริหารงานกลาง'], date: addDays(-2), time: '13:30', createdAt: `${addDays(-2)} 13:30` }),
  mk(7, 'meeting', 'ประชุมคณะทำงานกองทุน พรุ่งนี้ 14:00 น.', 'ห้องประชุม 1 อาคาร A ชั้น 3 กรุณาเตรียมเอกสารรายงานความคืบหน้า', { severity: 'ทั่วไป', recipients: [U, 'อนุชา พรหมมา'], date: addDays(0), time: '07:30', status: 'ตอบสนองแล้ว', handledAt: `${addDays(0)} 08:05`, by: 'วรรณา ศรีสุข', createdAt: `${addDays(-1)} 17:00` }),
  mk(8, 'contract', 'สัญญาซื้อขายโน้ตบุ๊กต้องแก้ไขตามความเห็นนิติกร', 'AG20250918 ข้อ 7 ค่าปรับต่ำกว่าอัตราตามระเบียบ กรุณาปรับปรุงและส่งตรวจสอบอีกครั้ง', { severity: 'ปานกลาง', recipients: [U], date: addDays(-3), time: '11:30', status: 'รอดำเนินการ', createdAt: `${addDays(-3)} 11:30` }),
  mk(9, 'other', 'ปิดปรับปรุงระบบ Notification Center คืนวันเสาร์', 'ระบบจะไม่สามารถใช้งานได้ชั่วคราวเวลา 22:00–23:00 น. เพื่อปรับปรุงประสิทธิภาพ', { severity: 'ทั่วไป', recipients: ['ทุกคน'], date: addDays(3), time: '09:00', status: 'ตั้งเวลา', by: S, createdAt: `${addDays(-1)} 15:00` }),
  mk(10, 'budget', 'ถึงกำหนดส่งรายงานผลการดำเนินงานไตรมาส 1', 'ส่งรายงานผลโครงการก่อนวันที่ 10 ของเดือนถัดไป', { severity: 'ปานกลาง', recipients: ['สำนักแผนงาน'], repeat: 'ทุกเดือน', date: addDays(-5), time: '09:00', status: 'ตอบสนองแล้ว', handledAt: `${addDays(-4)} 10:00`, by: S, createdAt: `${addDays(-9)} 09:00` }),
  mk(11, 'doc', 'หนังสือด่วนที่สุดรอการลงนาม', 'หนังสือเลขที่ ศธ 0512/ว 211 รอผู้อำนวยการลงนามภายในวันนี้', { severity: 'สูง', recipients: ['ทุกคน'], date: addDays(-1), time: '14:00', status: 'ตอบสนองแล้ว', handledAt: `${addDays(-1)} 15:10`, createdAt: `${addDays(-1)} 14:00` }),
  mk(12, 'loan', 'สินเชื่อองค์กรชุมชนรออนุมัติเบิกจ่ายงวดที่ 2', 'ชุมชนบ้านมั่นคงริมคลองลาดพร้าว ยื่นขอเบิกจ่ายงวดที่ 2 วงเงิน 450,000 บาท', { severity: 'ปานกลาง', recipients: [U], date: addDays(-4), time: '10:00', status: 'รอดำเนินการ', createdAt: `${addDays(-4)} 10:00` }),
]
