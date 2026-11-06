// CKB — Centralized Knowledge Base (book 3 §2.4.1; process from book 1 §2.5.2: central document library + e-Learning)
import { addDays } from './erpBooking'
import { thDate } from './erpProject'
import { stamp } from './strategic'

export { addDays, stamp, thDate }

export type KPersona = 'staff' | 'admin'
export const kPersonas: Record<KPersona, { short: string; name: string }> = {
  staff: { short: 'เจ้าหน้าที่ พอช.', name: 'ปริยดา เจริญวัฒนกุล' },
  admin: { short: 'เจ้าหน้าที่ดูแลระบบ', name: 'วิชัย ดูแลระบบ' },
}
export const categories = ['นโยบายและระเบียบ', 'คู่มือปฏิบัติงาน', 'แบบฟอร์ม', 'รายงานและสถิติ', 'องค์ความรู้ชุมชน'] as const
export type Category = (typeof categories)[number]
export const accessLevels = ['ทุกคน', 'เจ้าหน้าที่', 'ผู้ดูแลระบบ'] as const
export type Access = (typeof accessLevels)[number]
export type FileType = 'PDF' | 'Word' | 'Excel'
export const fileTone: Record<FileType, string> = { PDF: 'bg-[#ffe3e3] text-[#c13232]', Word: 'bg-[#e0efff] text-[#2057c9]', Excel: 'bg-[#dff5e8] text-[#0f8a63]' }
export const fileTypeOf = (name: string): FileType | undefined => (/\.pdf$/i.test(name) ? 'PDF' : /\.docx?$/i.test(name) ? 'Word' : /\.xlsx?$/i.test(name) || /\.csv$/i.test(name) ? 'Excel' : undefined)

export type DocVersion = { v: number; at: string; by: string; note: string }
export type KDoc = {
  id: number
  title: string
  category: Category
  tags: string[]
  fileType: FileType
  size: string
  version: number
  access: Access
  owner: string
  updatedAt: string
  reviewBy: string // ISO date — the document is due for review
  summary: string
  history: DocVersion[]
}
/** "ระบบทำการจัดหมวดหมู่ ติดแท็กโดยเป็นการแนะนำอัตโนมัติ" — a keyword rule on the file name stands in for the real classifier */
export function suggest(fileName: string): { category: Category; tags: string[] } {
  const n = fileName.replace(/\.[^.]+$/, '')
  const rules: [RegExp, Category, string[]][] = [
    [/ระเบียบ|นโยบาย|ข้อบังคับ|ประกาศ/, 'นโยบายและระเบียบ', ['ระเบียบ']],
    [/คู่มือ|manual|วิธี|ขั้นตอน/i, 'คู่มือปฏิบัติงาน', ['คู่มือ']],
    [/แบบฟอร์ม|form|ใบ/i, 'แบบฟอร์ม', ['แบบฟอร์ม']],
    [/รายงาน|สถิติ|สรุปผล|report/i, 'รายงานและสถิติ', ['รายงาน']],
  ]
  const hit = rules.find(([re]) => re.test(n))
  const words = n.split(/[\s_\-.]+/).filter((w) => w.length >= 3).slice(0, 3)
  return { category: hit ? hit[1] : 'องค์ความรู้ชุมชน', tags: [...new Set([...(hit ? hit[2] : []), ...words])].slice(0, 5) }
}

const A = 'วิชัย ดูแลระบบ'
const d = (id: number, title: string, category: Category, tags: string[], fileType: FileType, size: string, version: number, access: Access, owner: string, updDays: number, reviewDays: number, summary: string): KDoc => ({
  id, title, category, tags, fileType, size, version, access, owner, updatedAt: addDays(-updDays), reviewBy: addDays(reviewDays), summary,
  history: Array.from({ length: version }, (_, i) => ({ v: i + 1, at: addDays(-updDays - (version - 1 - i) * 90), by: i === 0 ? A : owner, note: i === 0 ? 'นำเข้าเอกสารครั้งแรก' : 'ปรับปรุงเนื้อหาตามระเบียบล่าสุด' })),
})
export const seedDocs = (): KDoc[] => [
  d(1, 'ระเบียบสถาบันฯ ว่าด้วยการพัสดุและการบริหารพัสดุ', 'นโยบายและระเบียบ', ['พัสดุ', 'จัดซื้อ', 'ระเบียบ'], 'PDF', '2.4 MB', 3, 'ทุกคน', 'สำนักบริหารงานกลาง', 40, 150, 'ระเบียบว่าด้วยการจัดซื้อจัดจ้างและการบริหารพัสดุภายในสถาบัน'),
  d(2, 'คู่มือการใช้งานระบบ ERP สำหรับเจ้าหน้าที่ ฉบับปรับปรุง', 'คู่มือปฏิบัติงาน', ['ERP', 'คู่มือ', 'การใช้งาน'], 'PDF', '8.1 MB', 2, 'เจ้าหน้าที่', 'สำนักเทคโนโลยีสารสนเทศ', 15, 20, 'ขั้นตอนใช้งานระบบสารบรรณ การเงิน พัสดุ และการจองออนไลน์'),
  d(3, 'แบบฟอร์มขอเบิกค่าใช้จ่ายในการเดินทางไปราชการ', 'แบบฟอร์ม', ['เบิกจ่าย', 'เดินทาง', 'แบบฟอร์ม'], 'Word', '120 KB', 1, 'เจ้าหน้าที่', 'ฝ่ายการเงินและบัญชี', 70, 120, 'แบบฟอร์มมาตรฐานสำหรับขออนุมัติเบิกค่าพาหนะและเบี้ยเลี้ยง'),
  d(4, 'รายงานสถิติองค์กรชุมชนที่จดแจ้งแล้ว ปีงบประมาณ 2569', 'รายงานและสถิติ', ['สถิติ', 'องค์กรชุมชน', 'ปี 2569'], 'Excel', '1.2 MB', 4, 'ทุกคน', 'สำนักแผนงาน', 8, 12, 'จำนวนองค์กรชุมชนแยกตามภาค จังหวัด และประเภทองค์กร'),
  d(5, 'ถอดบทเรียนการจัดการภัยพิบัติโดยชุมชน กรณีน้ำท่วมภาคเหนือ', 'องค์ความรู้ชุมชน', ['ภัยพิบัติ', 'บทเรียน', 'ชุมชน'], 'PDF', '5.6 MB', 1, 'ทุกคน', 'สำนักพัฒนาผู้นำ', 120, 240, 'แนวปฏิบัติที่ดีจาก 6 ชุมชนในการรับมือน้ำท่วมและฟื้นฟู'),
  d(6, 'แนวทางการจัดทำแผนพัฒนาชุมชนแบบมีส่วนร่วม', 'คู่มือปฏิบัติงาน', ['แผนชุมชน', 'การมีส่วนร่วม'], 'Word', '860 KB', 2, 'เจ้าหน้าที่', 'สำนักพัฒนาองค์กรชุมชน', 55, -10, 'ขั้นตอนเวทีประชาคม การจัดลำดับปัญหา และการจัดทำแผน'),
  d(7, 'นโยบายคุ้มครองข้อมูลส่วนบุคคล (PDPA) ของสถาบัน', 'นโยบายและระเบียบ', ['PDPA', 'ข้อมูลส่วนบุคคล', 'นโยบาย'], 'PDF', '1.1 MB', 2, 'ทุกคน', 'สำนักกฎหมาย', 90, 25, 'หลักเกณฑ์การเก็บ ใช้ และเปิดเผยข้อมูลส่วนบุคคลของผู้ใช้บริการ'),
  d(8, 'ตารางเกณฑ์การประเมินโครงการพัฒนาชุมชน (ภายใน)', 'รายงานและสถิติ', ['ประเมินผล', 'เกณฑ์'], 'Excel', '340 KB', 1, 'ผู้ดูแลระบบ', 'สำนักแผนงาน', 20, 90, 'เกณฑ์ให้คะแนนภายใน ใช้เฉพาะผู้ดูแลระบบก่อนประกาศใช้'),
  d(9, 'แบบฟอร์มขอใช้ห้องประชุมและอุปกรณ์เสริม', 'แบบฟอร์ม', ['ห้องประชุม', 'จอง'], 'Word', '95 KB', 1, 'ทุกคน', 'สำนักบริหารงานกลาง', 200, 180, 'ใช้ประกอบการยื่นขอจองห้องกรณีไม่สะดวกใช้ระบบออนไลน์'),
]

// ---- e-Learning -----------------------------------------------------------------------------------------------------
export type Q = { q: string; options: string[]; answer: number }
export type Course = { id: number; title: string; desc: string; category: string; level: string; lessons: { title: string; minutes: number }[]; quiz: Q[] }
export const PASS = 70
export const courses: Course[] = [
  { id: 1, title: 'พื้นฐานการจัดทำแผนพัฒนาชุมชนแบบมีส่วนร่วม', desc: 'เรียนรู้ขั้นตอนจัดเวทีประชาคมและจัดลำดับปัญหาของชุมชน', category: 'พัฒนาชุมชน', level: 'เบื้องต้น', lessons: [{ title: 'ทำไมต้องมีส่วนร่วม', minutes: 12 }, { title: 'เครื่องมือสำรวจปัญหาชุมชน', minutes: 18 }, { title: 'การจัดลำดับความสำคัญ', minutes: 15 }], quiz: [{ q: 'ขั้นตอนแรกของการทำแผนชุมชนคือข้อใด', options: ['เขียนงบประมาณ', 'สำรวจและรับฟังปัญหาของชุมชน', 'ประกาศผลโครงการ'], answer: 1 }, { q: 'ข้อใดคือประโยชน์ของการมีส่วนร่วม', options: ['แผนตรงกับความต้องการจริง', 'ลดจำนวนผู้ประชุม', 'ไม่ต้องติดตามผล'], answer: 0 }, { q: 'การจัดลำดับความสำคัญช่วยเรื่องใด', options: ['เลือกทำเรื่องเร่งด่วนก่อน', 'เพิ่มค่าใช้จ่าย', 'ลดจำนวนสมาชิก'], answer: 0 }] },
  { id: 2, title: 'การบริหารพัสดุและการจัดซื้อจัดจ้างภาครัฐ', desc: 'หลักการ วิธีการจัดซื้อ และเอกสารที่ต้องจัดทำตามระเบียบ', category: 'บริหารงานกลาง', level: 'ปานกลาง', lessons: [{ title: 'ภาพรวมระเบียบพัสดุ', minutes: 20 }, { title: 'วิธีจัดซื้อจัดจ้าง 5 วิธี', minutes: 25 }, { title: 'การตรวจรับและขึ้นทะเบียน', minutes: 15 }, { title: 'กรณีศึกษา', minutes: 20 }], quiz: [{ q: 'วิธีเฉพาะเจาะจงเหมาะกับวงเงินลักษณะใด', options: ['วงเงินเล็กน้อยตามที่กำหนด', 'งานก่อสร้างขนาดใหญ่', 'ทุกวงเงิน'], answer: 0 }, { q: 'หลังตรวจรับพัสดุต้องทำสิ่งใด', options: ['ทิ้งเอกสาร', 'ขึ้นทะเบียนพัสดุ-ครุภัณฑ์', 'ไม่ต้องทำอะไร'], answer: 1 }, { q: 'ข้อใดเป็นเอกสารประกอบการจัดซื้อ', options: ['ใบเสนอราคา', 'บัตรเชิญงานเลี้ยง', 'โปสเตอร์'], answer: 0 }] },
  { id: 3, title: 'การคุ้มครองข้อมูลส่วนบุคคล (PDPA) สำหรับเจ้าหน้าที่', desc: 'ความเข้าใจพื้นฐานและแนวปฏิบัติเมื่อต้องจัดการข้อมูลส่วนบุคคล', category: 'กฎหมายและธรรมาภิบาล', level: 'เบื้องต้น', lessons: [{ title: 'PDPA คืออะไร', minutes: 10 }, { title: 'สิทธิของเจ้าของข้อมูล', minutes: 15 }], quiz: [{ q: 'ข้อมูลส่วนบุคคลหมายถึงข้อใด', options: ['ข้อมูลที่ระบุตัวบุคคลได้', 'ข้อมูลสภาพอากาศ', 'ข้อมูลราคาตลาด'], answer: 0 }, { q: 'ก่อนเก็บข้อมูลควรทำสิ่งใด', options: ['แจ้งวัตถุประสงค์และขอความยินยอม', 'เก็บไว้ก่อนแล้วค่อยแจ้ง', 'เผยแพร่ทันที'], answer: 0 }] },
  { id: 4, title: 'การวิเคราะห์ข้อมูลเบื้องต้นด้วย Excel และ Dashboard', desc: 'สรุปข้อมูลโครงการและสร้างแผนภูมิเพื่อรายงานผู้บริหาร', category: 'ทักษะดิจิทัล', level: 'ปานกลาง', lessons: [{ title: 'จัดข้อมูลให้พร้อมวิเคราะห์', minutes: 15 }, { title: 'Pivot Table และสูตรพื้นฐาน', minutes: 22 }, { title: 'ออกแบบ Dashboard', minutes: 18 }], quiz: [{ q: 'Pivot Table ใช้ทำอะไร', options: ['สรุปข้อมูลตามมิติที่เลือก', 'พิมพ์เอกสาร', 'ส่งอีเมล'], answer: 0 }, { q: 'แผนภูมิแท่งเหมาะกับข้อมูลแบบใด', options: ['เปรียบเทียบจำนวนตามหมวด', 'แสดงที่อยู่', 'แสดงรูปถ่าย'], answer: 0 }, { q: 'ควรทำอะไรก่อนวิเคราะห์ข้อมูล', options: ['ตรวจความถูกต้องของข้อมูล', 'ลบทุกคอลัมน์', 'เปลี่ยนสีพื้นหลัง'], answer: 0 }] },
  { id: 5, title: 'ทักษะการอำนวยกระบวนการ (Facilitation) สำหรับผู้นำชุมชน', desc: 'เทคนิคนำเวทีให้ทุกคนมีส่วนร่วมและได้ข้อสรุปร่วมกัน', category: 'พัฒนาผู้นำ', level: 'ขั้นสูง', lessons: [{ title: 'บทบาทผู้อำนวยกระบวนการ', minutes: 14 }, { title: 'คำถามกระตุ้นการคิด', minutes: 16 }, { title: 'จัดการความขัดแย้งในเวที', minutes: 20 }, { title: 'สรุปและติดตามผล', minutes: 12 }], quiz: [{ q: 'ผู้อำนวยกระบวนการควรทำสิ่งใดเป็นหลัก', options: ['เปิดพื้นที่ให้ทุกคนพูด', 'พูดคนเดียวตลอด', 'ตัดสินแทนที่ประชุม'], answer: 0 }, { q: 'เมื่อเกิดความเห็นต่าง ควรทำอย่างไร', options: ['รับฟังและหาจุดร่วม', 'ข้ามหัวข้อ', 'ปิดการประชุม'], answer: 0 }] },
]
export type Enroll = { id: number; courseId: number; done: number; pre?: number; post?: number; status: 'กำลังเรียน' | 'เรียนจบ'; at: string; completedAt?: string; certNo?: string }
export const seedEnrolls = (): Enroll[] => [
  { id: 1, courseId: 3, done: 2, pre: 50, post: 100, status: 'เรียนจบ', at: addDays(-20), completedAt: addDays(-18), certNo: 'CERT-2569-0031' },
  { id: 2, courseId: 1, done: 2, pre: 33, status: 'กำลังเรียน', at: addDays(-6) },
]
export const courseMinutes = (c: Course) => c.lessons.reduce((s, l) => s + l.minutes, 0)
export const score = (c: Course, picks: number[]) => Math.round((c.quiz.filter((q, i) => picks[i] === q.answer).length / c.quiz.length) * 100)
