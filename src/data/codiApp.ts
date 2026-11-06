// CODI APP — หน้าแรกของพอร์ทัล + จัดการข่าวสาร (TOR 4.7 (1), book 3 §2.1.1.2–2.1.1.4)
import cover1 from '../assets/web/cover-1.jpg'
import cover2 from '../assets/web/cover-2.jpg'
import cover3 from '../assets/web/cover-3.jpg'
import cover4 from '../assets/web/cover-4.jpg'
import cover5 from '../assets/web/cover-5.jpg'
import cover6 from '../assets/web/cover-6.jpg'
import n10 from '../assets/web/news-10.jpg'
import n2 from '../assets/web/news-2.jpg'
import n3 from '../assets/web/news-3.jpg'
import n7 from '../assets/web/news-7.jpg'
import { notifyMenu, agreementMenu, assetMenu, bookingMenu, edocMenu, erpMenu, financeMenu, fundingMenu, otherMenu, ossMenu, projectMenu, strategicMenu } from './navigation'

export const newsCats = ['ข่าวล่าสุด', 'ข่าวทั่วไป', 'ข่าวภายในหน่วยงาน', 'ประกาศสำคัญ']
export type NewsStatus = 'published' | 'draft' | 'unpublished'
export const newsStatus: Record<NewsStatus, { label: string; tone: string }> = {
  published: { label: 'เผยแพร่แล้ว', tone: 'bg-[#dff5e8] text-[#0f8a63]' },
  draft: { label: 'แบบร่าง', tone: 'bg-gray-line text-gray-30' },
  unpublished: { label: 'ยกเลิกเผยแพร่', tone: 'bg-[#ffe9d9] text-[#b2500d]' },
}
export type News = { id: number; title: string; cat: string; body: string; cover: string; date: string; creator: string; status: NewsStatus; views: number }
const body = (a: string) => `${a}\n\nสถาบันพัฒนาองค์กรชุมชน (องค์การมหาชน) ขอเชิญชวนเจ้าหน้าที่และผู้เกี่ยวข้องติดตามรายละเอียดเพิ่มเติมได้ที่หน้าข่าวสารของ CODI APP และศูนย์การแจ้งเตือน`
export const seedNews = (): News[] => [
  { id: 1, title: 'พอช. ลงพื้นที่ติดตามโครงการบ้านมั่นคงชนบท จังหวัดเชียงใหม่', cat: 'ข่าวล่าสุด', body: body('คณะผู้บริหาร พอช. ลงพื้นที่ติดตามความก้าวหน้าโครงการบ้านมั่นคงชนบท พร้อมรับฟังความเห็นจากชุมชนเพื่อนำไปปรับปรุงการสนับสนุนในปีงบประมาณถัดไป'), cover: n2, date: '2025-11-03', creator: 'สมหญิง ศรีสุข', status: 'published', views: 312 },
  { id: 2, title: 'เปิดใช้งานระบบ ERP ใหม่ ระยะที่ 1 สำหรับเจ้าหน้าที่ทุกสำนัก', cat: 'ประกาศสำคัญ', body: body('ระบบ ERP ระยะที่ 1 ประกอบด้วยงานแผนยุทธศาสตร์ รายงานผลการดำเนินงาน งบประมาณและการเงิน บริหารกองทุน และสารบรรณอิเล็กทรอนิกส์ เปิดใช้งานผ่านพอร์ทัลตั้งแต่วันที่ 1 ธันวาคม'), cover: cover1, date: '2025-11-05', creator: 'ปริยดา เจริญวัฒนกุล', status: 'published', views: 548 },
  { id: 3, title: 'ประกาศผลการคัดเลือกหลักสูตรพัฒนาผู้นำชุมชน ประจำปี 2568', cat: 'ข่าวภายในหน่วยงาน', body: body('สำนักพัฒนาผู้นำประกาศรายชื่อผู้ผ่านการคัดเลือกเข้าร่วมหลักสูตรพัฒนาผู้นำชุมชน รุ่นที่ 12 ตรวจสอบรายชื่อและกำหนดการอบรมได้ในระบบ'), cover: n10, date: '2025-11-06', creator: 'ธีรพงษ์ ใจมั่น', status: 'published', views: 190 },
  { id: 4, title: 'แจ้งปิดปรับปรุงระบบ CODI Portal ชั่วคราว คืนวันเสาร์ที่ 15 พฤศจิกายน', cat: 'ประกาศสำคัญ', body: body('ปิดปรับปรุงระบบตั้งแต่เวลา 22.00 น. ถึง 02.00 น. เพื่อปรับปรุงประสิทธิภาพฐานข้อมูล ขออภัยในความไม่สะดวก'), cover: n3, date: '2025-11-07', creator: 'ผู้ดูแลระบบ', status: 'published', views: 421 },
  { id: 5, title: 'อบรมการใช้งานระบบสารบรรณอิเล็กทรอนิกส์ รุ่นที่ 2', cat: 'ข่าวภายในหน่วยงาน', body: body('เปิดรับสมัครเจ้าหน้าที่ธุรการและผู้บริหารเข้าอบรมการลงนามอิเล็กทรอนิกส์และการส่งต่อหนังสือในระบบ'), cover: cover2, date: '2025-11-10', creator: 'วิภา ทองดี', status: 'published', views: 133 },
  { id: 6, title: 'สรุปผลการดำเนินงานไตรมาส 4 ปีงบประมาณ 2568 ของ พอช.', cat: 'ข่าวทั่วไป', body: body('ผลการดำเนินงานตามแผนอยู่ในเกณฑ์ปกติ ใช้งบประมาณร้อยละ 94 ของแผน โครงการที่ล่าช้าอยู่ระหว่างเร่งรัด'), cover: cover3, date: '2025-11-12', creator: 'สมหญิง ศรีสุข', status: 'published', views: 267 },
  { id: 7, title: 'ประชุมคณะกรรมการบริหารกองทุน ประจำไตรมาส 1 ปีงบประมาณ 2569', cat: 'ข่าวภายในหน่วยงาน', body: body('วาระสำคัญ ได้แก่ การพิจารณาผลการลงทุนในกองทุนและหุ้นกู้ และการทบทวนข้อกำหนดการลงทุน'), cover: cover4, date: '2025-11-14', creator: 'ธนากร พิทักษ์ชน', status: 'draft', views: 0 },
  { id: 8, title: 'ข่าวประชาสัมพันธ์กิจกรรมวันขึ้นปีใหม่ พอช.', cat: 'ข่าวทั่วไป', body: body('กิจกรรมสังสรรค์ประจำปีของเจ้าหน้าที่ รายละเอียดจะประกาศเร็ว ๆ นี้'), cover: n7, date: '2025-10-20', creator: 'วิภา ทองดี', status: 'unpublished', views: 58 },
  { id: 9, title: 'เปิดรับข้อเสนอโครงการสนับสนุนองค์กรชุมชน ปีงบประมาณ 2569', cat: 'ข่าวล่าสุด', body: body('องค์กรชุมชนที่สนใจยื่นข้อเสนอโครงการผ่านช่องทางออนไลน์ได้ตั้งแต่วันนี้เป็นต้นไป'), cover: cover5, date: '2025-11-02', creator: 'สมหญิง ศรีสุข', status: 'published', views: 305 },
  { id: 10, title: 'คู่มือการใช้งาน CODI Portal ฉบับปรับปรุงใหม่', cat: 'ข่าวทั่วไป', body: body('ดาวน์โหลดคู่มือการใช้งานฉบับล่าสุดได้จากเมนูส่วนท้ายของพอร์ทัล'), cover: cover6, date: '2025-10-28', creator: 'ผู้ดูแลระบบ', status: 'published', views: 96 },
]
export const blankNews = (): News => ({ id: 0, title: '', cat: '', body: '', cover: '', date: new Date().toISOString().slice(0, 10), creator: 'ผู้ดูแลระบบ', status: 'draft', views: 0 })

export function checkNews(n: News, forPublish: boolean): Record<string, string> {
  const e: Record<string, string> = {}
  if (!n.title.trim()) e.title = 'กรุณาระบุหัวข้อข่าว'
  else if (n.title.trim().length > 150) e.title = 'หัวข้อข่าวยาวเกิน 150 ตัวอักษร'
  if (!n.cat) e.cat = 'กรุณาเลือกประเภทข่าวสาร'
  if (forPublish) {
    if (!n.body.trim()) e.body = 'กรุณาระบุเนื้อหาข่าวสารก่อนเผยแพร่'
    if (!n.cover) e.cover = 'กรุณาเพิ่มรูปภาพหน้าปกก่อนเผยแพร่'
    if (!n.date) e.date = 'กรุณาระบุวันที่เผยแพร่'
  }
  return e
}

// ---- systems shown on the home page (ระบบสารสนเทศ) ---------------------------------------------
export type Sys = { group: 'ERP' | 'OSS' | 'อื่น ๆ'; ref: string; name: string; desc: string; to?: string }
export const appSystems: Sys[] = [
  { group: 'ERP', ref: '2.1.2', name: 'ERP STRATEGIC', desc: 'งานจัดการแผนยุทธศาสตร์องค์กร', to: '/strategic' },
  { group: 'ERP', ref: '2.1.3', name: 'ERP PROJECT', desc: 'งานรายงานผลการดำเนินงาน', to: '/project' },
  { group: 'ERP', ref: '2.1.4', name: 'ERP FINANCE', desc: 'งานงบประมาณและการเงิน', to: '/finance' },
  { group: 'ERP', ref: '2.1.5', name: 'ERP FUNDING', desc: 'งานบริหารกองทุน', to: '/funding' },
  { group: 'ERP', ref: '2.1.6', name: 'ERP HR', desc: 'งานบริหารทรัพยากรบุคคล', to: '/hr' },
  { group: 'ERP', ref: '2.1.7', name: 'ERP SARABAN', desc: 'งานสารบรรณอิเล็กทรอนิกส์', to: '/saraban' },
  { group: 'ERP', ref: '2.1.8', name: 'ERP ASSET', desc: 'งานบริหารจัดการพัสดุ', to: '/asset' },
  { group: 'ERP', ref: '2.1.9', name: 'ERP Complaint', desc: 'งานรับเรื่องร้องเรียน' },
  { group: 'ERP', ref: '2.1.10', name: 'ERP BOOKING', desc: 'งานจองออนไลน์', to: '/booking' },
  { group: 'ERP', ref: '2.1.11', name: 'ERP DOCUMENT', desc: 'งานนำเข้าเอกสาร', to: '/edoc' },
  { group: 'OSS', ref: '2.2', name: 'CODI OSS', desc: 'ระบบให้บริการแบบครบวงจร', to: '/dashboard' },
  { group: 'OSS', ref: '2.2.4', name: 'พัฒนาผู้นำชุมชน', desc: 'แผนพัฒนาและบันทึกผลหลักสูตร', to: '/leader' },
  { group: 'OSS', ref: '2.2.5', name: 'e-Survey', desc: 'แบบสอบถามและผลลัพธ์', to: '/survey' },
  { group: 'OSS', ref: '2.2.6', name: 'e-Meeting', desc: 'จัดการการประชุม', to: '/meeting' },
  { group: 'อื่น ๆ', ref: '2.5.2', name: 'AI NOTIFICATION', desc: 'ศูนย์แจ้งเตือนอัจฉริยะ', to: '/notify' },
  { group: 'อื่น ๆ', ref: '2.3.1', name: 'ERP AGREEMENT', desc: 'งานบริหารจัดการสัญญา', to: '/agreement' },
  { group: 'อื่น ๆ', ref: '2.3.2', name: 'บริหารจัดการสินเชื่อ', desc: 'เบิกจ่ายสินเชื่อและประวัติลูกหนี้', to: '/loan/disbursement' },
  { group: 'อื่น ๆ', ref: '2.3.3', name: 'ตรวจนับพัสดุ AMS', desc: 'สแกนตรวจนับด้วย RFID', to: '/ams' },
  { group: 'อื่น ๆ', ref: '2.4.2', name: 'เว็บประชาสัมพันธ์และห้องสมุด', desc: 'ข่าว คลังความรู้', to: '/library' },
]

/** quick links (เมนูระบบที่ใช้บ่อย) — the home page re-orders them by how often you open them */
export type Quick = { id: string; label: string; sys: string; to: string }
export const quickLinks: Quick[] = [
  { id: 'loan', label: 'ยื่นคำขอยืมเงิน', sys: 'ERP FINANCE', to: '/finance/loan' },
  { id: 'doc', label: 'ออกหนังสือภายใน', sys: 'ERP SARABAN', to: '/saraban/internal/new' },
  { id: 'plan', label: 'จัดทำแผนประจำปี', sys: 'ERP STRATEGIC', to: '/strategic/plan' },
  { id: 'perf', label: 'รายงานผลการดำเนินงาน', sys: 'ERP PROJECT', to: '/project/report' },
  { id: 'fund', label: 'ค้นหากองทุน/หุ้นกู้', sys: 'ERP FUNDING', to: '/funding' },
  { id: 'leave', label: 'ยื่นใบลา', sys: 'ERP HR', to: '/hr/leave' },
  { id: 'meet', label: 'จัดการการประชุม', sys: 'e-Meeting', to: '/meeting' },
  { id: 'survey', label: 'จัดการแบบสอบถาม', sys: 'e-Survey', to: '/survey' },
]

// ---- "ผู้ช่วย พอช. อัจฉริยะ" : searches every menu of the portal --------------------------------
export type Hit = { label: string; group: string; to: string; score: number }
const keywords: Record<string, string> = {
  '/funding': 'กองทุน หุ้นกู้ ลงทุน', '/finance/loan': 'ยืมเงิน ทดรองจ่าย เงินยืม', '/finance/clear': 'หักล้าง เงินยืม คืนเงิน', '/hr': 'บุคลากร ลา เงินเดือน พนักงาน เจ้าหน้าที่', '/hr/leave': 'ลา ลาป่วย ลากิจ พักร้อน',
  '/notify': 'แจ้งเตือน ศูนย์แจ้งเตือน ความเสี่ยง', '/notify/settings': 'ตั้งค่าแจ้งเตือน', '/agreement': 'สัญญา ทะเบียนสัญญา MOU ลงนาม ตรวจสอบสัญญา', '/agreement/new': 'สร้างสัญญา สัญญาใหม่', '/saraban': 'สารบรรณ หนังสือ ลงนาม', '/project': 'โครงการ ผลการดำเนินงาน', '/strategic': 'แผน ยุทธศาสตร์ ความเสี่ยง', '/meeting': 'ประชุม นัดหมาย', '/survey': 'แบบสอบถาม สำรวจ', '/notifications': 'แจ้งเตือน', '/booking': 'จอง การจองของฉัน ห้องประชุม รถ ยานพาหนะ Zoom ยืม', '/booking/room': 'จองห้องประชุม ห้อง', '/booking/vehicle': 'จองรถ ยานพาหนะ', '/booking/zoom': 'จอง Zoom ประชุมออนไลน์', '/booking/borrow': 'ยืมพัสดุ ครุภัณฑ์', '/asset': 'พัสดุ ครุภัณฑ์ ทะเบียน', '/asset/repair/new': 'ซ่อม แจ้งซ่อม ชำรุด เสีย', '/asset/procurement': 'จัดซื้อ จัดจ้าง ประกวดราคา', '/edoc/upload': 'เอกสาร ใบเสร็จ สแกน OCR อัปโหลด', '/edoc': 'เอกสาร คลัง ใบเสร็จ',
}
const menuIndex = (): { label: string; group: string; to: string }[] => {
  const out: { label: string; group: string; to: string }[] = []
  const groups = [...ossMenu, ...otherMenu, ...erpMenu, ...strategicMenu, ...projectMenu, ...financeMenu, ...fundingMenu, ...assetMenu, ...edocMenu, ...bookingMenu, ...agreementMenu, ...notifyMenu]
  for (const g of groups) for (const c of g.children) out.push({ label: c.label, group: g.label, to: c.to })
  out.push({ label: 'ศูนย์แจ้งเตือน', group: 'ทั่วไป', to: '/notifications' }, { label: 'ตั้งค่าผู้ใช้งาน', group: 'ทั่วไป', to: '/profile' }, { label: 'ข่าวสาร', group: 'CODI APP', to: '/app/news' }, { label: 'ช่องทางการติดต่อ', group: 'CODI APP', to: '/app/contact' })
  return out.filter((x, i, a) => a.findIndex((y) => y.to === x.to && y.label === x.label) === i)
}
export function aiSearch(q: string, hr = true): Hit[] {
  const tokens = q.trim().toLowerCase().split(/\s+/).filter(Boolean)
  if (!tokens.length) return []
  const res: Hit[] = []
  for (const m of menuIndex()) {
    if (!hr && m.to.startsWith('/hr')) continue
    const hay = `${m.label} ${m.group} ${keywords[m.to] ?? ''}`.toLowerCase()
    let score = 0
    for (const t of tokens) {
      if (m.label.toLowerCase().includes(t)) score += 3
      else if (hay.includes(t)) score += 1
    }
    if (score) res.push({ ...m, score })
  }
  return res.sort((a, b) => b.score - a.score).slice(0, 6)
}

// ---- calendar -----------------------------------------------------------------------------------
export type CalEvent = { date: string; title: string; kind: 'ประชุม' | 'อบรม' | 'กิจกรรม' | 'วันสำคัญ'; time?: string }
/** sample org events placed in the shown month (the real feed comes from e-Meeting, merged in by the page) */
export const sampleEvents = (y: number, m: number): CalEvent[] => {
  const d = (n: number) => `${y}-${String(m + 1).padStart(2, '0')}-${String(n).padStart(2, '0')}`
  return [
    { date: d(5), title: 'อบรมการใช้งานระบบ ERP รุ่นที่ 1', kind: 'อบรม', time: '09:00 - 12:00' },
    { date: d(12), title: 'กิจกรรมจิตอาสาพัฒนาชุมชน', kind: 'กิจกรรม', time: '08:30 - 15:00' },
    { date: d(20), title: 'ปิดงบประจำเดือน', kind: 'วันสำคัญ' },
    { date: d(26), title: 'อบรมการลงนามอิเล็กทรอนิกส์', kind: 'อบรม', time: '13:00 - 16:00' },
  ]
}
export const monthsTh = ['มกราคม', 'กุมภาพันธ์', 'มีนาคม', 'เมษายน', 'พฤษภาคม', 'มิถุนายน', 'กรกฎาคม', 'สิงหาคม', 'กันยายน', 'ตุลาคม', 'พฤศจิกายน', 'ธันวาคม']
export const iso = (d: Date) => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`

/** "AI สรุปข่าวสำคัญ" — rule-based summary of the published news (no external AI) */
export function summarizeNews(list: News[]): { title: string; text: string } {
  const live = list.filter((n) => n.status === 'published').sort((a, b) => (a.date < b.date ? 1 : -1))
  if (!live.length) return { title: 'ยังไม่มีข่าวสำคัญ', text: 'ยังไม่มีข่าวที่เผยแพร่ในขณะนี้' }
  const important = live.filter((n) => n.cat === 'ประกาศสำคัญ')
  const lead = important[0] ?? live[0]
  const cats = newsCats.map((c) => `${c} ${live.filter((n) => n.cat === c).length}`).filter((s) => !s.endsWith(' 0')).join(' · ')
  return { title: lead.title, text: `ภาพรวมข่าวที่เผยแพร่ ${live.length} ข่าว (${cats}) · ประกาศสำคัญล่าสุด: ${lead.title}${important.length > 1 ? ` และอีก ${important.length - 1} ประกาศ` : ''}` }
}
