// ERP ASSET — งานบริหารจัดการพัสดุ (book 3 §2.1.8, process from book 1 §2.2.7)
import { thDate } from './erpProject'
import { stamp } from './strategic'

export { stamp, thDate }

// ---- who is looking (demo persona; the real system reads this from SSO) -------------------------
export type APersona = 'staff' | 'central'
export const aPersonas: Record<APersona, { short: string; name: string }> = {
  staff: { short: 'เจ้าหน้าที่ พอช.', name: 'ปริยดา เจริญวัฒนกุล' },
  central: { short: 'เจ้าหน้าที่สำนักบริหารงานกลาง', name: 'อนุชา พรหมมา' },
}

export type AssetKind = 'พัสดุ' | 'ครุภัณฑ์' | 'อื่น ๆ'
export const assetKinds: AssetKind[] = ['พัสดุ', 'ครุภัณฑ์', 'อื่น ๆ']

// ---- vendors (DBD lookup demo — the real system calls the DBD open data API) --------------------
export type Vendor = { taxId: string; name: string; address: string; type: string; capital: string; status: string; regFile: string }
export const dbd: Vendor[] = [
  { taxId: '0105556012345', name: 'บริษัท ไอที ซัพพลาย จำกัด', address: '88 ถนนรามคำแหง แขวงหัวหมาก เขตบางกะปิ กรุงเทพฯ 10240', type: 'บริษัทจำกัด', capital: '5,000,000', status: 'ยังดำเนินกิจการอยู่', regFile: 'หนังสือรับรอง-ไอทีซัพพลาย.pdf' },
  { taxId: '0105548098765', name: 'บริษัท ออฟฟิศเมท พลัส จำกัด', address: '1/9 ถนนนวมินทร์ แขวงคลองกุ่ม เขตบึงกุ่ม กรุงเทพฯ 10240', type: 'บริษัทจำกัด', capital: '10,000,000', status: 'ยังดำเนินกิจการอยู่', regFile: 'หนังสือรับรอง-ออฟฟิศเมท.pdf' },
  { taxId: '0103562004321', name: 'ห้างหุ้นส่วนจำกัด เฟอร์นิเจอร์ดีไซน์', address: '45/2 ถนนประเสริฐมนูกิจ แขวงจรเข้บัว เขตลาดพร้าว กรุงเทพฯ 10230', type: 'ห้างหุ้นส่วนจำกัด', capital: '2,000,000', status: 'ยังดำเนินกิจการอยู่', regFile: 'หนังสือรับรอง-เฟอร์นิเจอร์ดีไซน์.pdf' },
  { taxId: '0105560111222', name: 'บริษัท แอร์ เซอร์วิส เอ็นจิเนียริ่ง จำกัด', address: '300 ถนนเสรีไทย แขวงคันนายาว เขตคันนายาว กรุงเทพฯ 10230', type: 'บริษัทจำกัด', capital: '3,000,000', status: 'ยังดำเนินกิจการอยู่', regFile: 'หนังสือรับรอง-แอร์เซอร์วิส.pdf' },
]
export const lookupDbd = (taxId: string) => dbd.find((v) => v.taxId === taxId.replace(/\D/g, ''))

// ---- register (ทะเบียนพัสดุ-ครุภัณฑ์) ---------------------------------------------------------------
export type Asset = {
  id: number
  code: string // เลขครุภัณฑ์ / รหัสพัสดุ
  kind: AssetKind
  name: string
  unit: string
  qty: number // คงเหลือ (พัสดุ) or 1 (ครุภัณฑ์ = 1 ชิ้นต่อเลข)
  min: number // จุดสั่งซื้อ (พัสดุ)
  unitPrice: number
  serial: string
  location: string
  receivedAt: string
  importNo: string
  vendor: string
  state: 'ใช้งานได้' | 'ชำรุด' | 'ส่งซ่อม' | 'จำหน่ายแล้ว'
}
const A = (id: number, code: string, kind: AssetKind, name: string, unit: string, qty: number, min: number, unitPrice: number, serial: string, location: string, receivedAt: string, importNo: string, vendor: string, state: Asset['state'] = 'ใช้งานได้'): Asset => ({ id, code, kind, name, unit, qty, min, unitPrice, serial, location, receivedAt, importNo, vendor, state })
export const seedAssets = (): Asset[] => [
  A(1, '7440-001-0001/68', 'ครุภัณฑ์', 'เครื่องคอมพิวเตอร์โน้ตบุ๊ก Dell Latitude 5440', 'เครื่อง', 1, 0, 32500, 'DL5440-8H2K9', 'สำนักเทคโนโลยีสารสนเทศ ชั้น 3', '2025-01-15', 'IMP-6801-001', 'บริษัท ไอที ซัพพลาย จำกัด'),
  A(2, '7440-001-0002/68', 'ครุภัณฑ์', 'เครื่องคอมพิวเตอร์โน้ตบุ๊ก Dell Latitude 5440', 'เครื่อง', 1, 0, 32500, 'DL5440-8H2L1', 'สำนักการเงินและบัญชี ชั้น 2', '2025-01-15', 'IMP-6801-001', 'บริษัท ไอที ซัพพลาย จำกัด', 'ส่งซ่อม'),
  A(3, '7430-002-0001/67', 'ครุภัณฑ์', 'เครื่องพิมพ์เลเซอร์ HP LaserJet Pro M404dn', 'เครื่อง', 1, 0, 12900, 'VNB3K12345', 'สำนักบริหารงานกลาง ชั้น 1', '2024-03-02', 'IMP-6703-002', 'บริษัท ไอที ซัพพลาย จำกัด', 'ชำรุด'),
  A(4, '4120-001-0004/66', 'ครุภัณฑ์', 'เครื่องปรับอากาศ Daikin 24,000 BTU', 'เครื่อง', 1, 0, 38900, 'DK24-77120', 'ห้องประชุม 1 ชั้น 4', '2023-04-20', 'IMP-6604-001', 'บริษัท แอร์ เซอร์วิส เอ็นจิเนียริ่ง จำกัด'),
  A(5, '7110-006-0010/68', 'ครุภัณฑ์', 'โต๊ะประชุมไม้ 8 ที่นั่ง', 'ตัว', 1, 0, 18500, '-', 'ห้องประชุม 2 ชั้น 4', '2025-02-10', 'IMP-6802-001', 'ห้างหุ้นส่วนจำกัด เฟอร์นิเจอร์ดีไซน์'),
  A(6, 'SP-0001', 'พัสดุ', 'กระดาษถ่ายเอกสาร A4 80 แกรม', 'รีม', 46, 30, 125, '-', 'คลังพัสดุ ชั้น 1', '2025-10-01', 'IMP-6810-001', 'บริษัท ออฟฟิศเมท พลัส จำกัด'),
  A(7, 'SP-0002', 'พัสดุ', 'หมึกพิมพ์ HP 26A (CF226A)', 'กล่อง', 3, 5, 2890, '-', 'คลังพัสดุ ชั้น 1', '2025-08-12', 'IMP-6808-002', 'บริษัท ไอที ซัพพลาย จำกัด'),
  A(8, 'SP-0003', 'พัสดุ', 'แฟ้มเอกสารสันกว้าง 3 นิ้ว', 'อัน', 120, 40, 65, '-', 'คลังพัสดุ ชั้น 1', '2025-09-05', 'IMP-6809-001', 'บริษัท ออฟฟิศเมท พลัส จำกัด'),
  A(9, 'SP-0004', 'พัสดุ', 'ถ่านอัลคาไลน์ AA', 'แพ็ก', 8, 10, 89, '-', 'คลังพัสดุ ชั้น 1', '2025-07-20', 'IMP-6807-001', 'บริษัท ออฟฟิศเมท พลัส จำกัด'),
  A(10, '7440-005-0003/67', 'ครุภัณฑ์', 'โปรเจกเตอร์ Epson EB-X51', 'เครื่อง', 1, 0, 17900, 'X51-990213', 'ห้องประชุม 1 ชั้น 4', '2024-06-18', 'IMP-6706-001', 'บริษัท ไอที ซัพพลาย จำกัด'),
]
export const lowStock = (a: Asset) => a.kind === 'พัสดุ' && a.qty <= a.min
export const assetValue = (a: Asset) => a.qty * a.unitPrice

/** FSN-like group prefix by keyword (book 1: "ระบบทำการออกเลขครุภัณฑ์") */
export function groupOf(name: string) {
  const n = name.toLowerCase()
  if (/คอม|โน้ตบุ๊ก|notebook|laptop|computer/.test(n)) return '7440-001'
  if (/พิมพ์|printer/.test(n)) return '7430-002'
  if (/โปรเจก|projector/.test(n)) return '7440-005'
  if (/แอร์|ปรับอากาศ/.test(n)) return '4120-001'
  if (/โต๊ะ|เก้าอี้|ตู้|ชั้นวาง/.test(n)) return '7110-006'
  return '7490-001'
}
const beYY = () => String(new Date().getFullYear() + 543).slice(2)
export function nextAssetCodes(all: Asset[], name: string, count: number) {
  const g = groupOf(name)
  const used = all.filter((a) => a.code.startsWith(g)).map((a) => Number(a.code.slice(g.length + 1, g.length + 5)) || 0)
  let n = used.length ? Math.max(...used) : 0
  return Array.from({ length: count }, () => `${g}-${String(++n).padStart(4, '0')}/${beYY()}`)
}
export function nextSupplyCode(all: Asset[]) {
  const n = all.filter((a) => a.code.startsWith('SP-')).reduce((m, a) => Math.max(m, Number(a.code.slice(3)) || 0), 0)
  return `SP-${String(n + 1).padStart(4, '0')}`
}

// ---- import batches (นำเข้าพัสดุ ครุภัณฑ์ — 2.1.8.1) ----------------------------------------------
export type ImportLine = { detail: string; qty: number; unit: string; serial: string; evidence: string; note: string; unitPrice: number; total: number; codes: string[] }
export type ImportDoc = { id: number; no: string; kind: AssetKind; date: string; lines: ImportLine[]; vendor: { taxId: string; name: string; address: string; regFile: string }; by: string; at: string }
export const seedImports = (): ImportDoc[] => [
  { id: 1, no: 'IMP-6810-001', kind: 'พัสดุ', date: '2025-10-01', lines: [{ detail: 'กระดาษถ่ายเอกสาร A4 80 แกรม', qty: 50, unit: 'รีม', serial: '', evidence: 'ใบส่งของ-OM-2510-118.pdf', note: '', unitPrice: 125, total: 6250, codes: ['SP-0001'] }], vendor: { taxId: '0105548098765', name: 'บริษัท ออฟฟิศเมท พลัส จำกัด', address: dbd[1].address, regFile: dbd[1].regFile }, by: 'อนุชา พรหมมา', at: '2025-10-01 10:20' },
]

// ---- procurement announcements (ประกาศจัดซื้อจัดจ้าง — 2.1.8.2) -----------------------------------
export type Method = 'สอบราคา' | 'ประกวดราคา' | 'คัดเลือก' | 'เฉพาะเจาะจง' | 'จ้างที่ปรึกษา'
export const methods: Method[] = ['สอบราคา', 'ประกวดราคา', 'คัดเลือก', 'เฉพาะเจาะจง', 'จ้างที่ปรึกษา']
/** ceilings per method (ระเบียบกระทรวงการคลังฯ พ.ศ. 2560 — simplified for the demo) */
export const methodRule: Record<Method, string> = {
  สอบราคา: 'วงเงินเกิน 500,000 บาท แต่ไม่เกิน 5,000,000 บาท (พื้นที่ห่างไกล)',
  ประกวดราคา: 'วงเงินเกิน 500,000 บาท ใช้ระบบ e-bidding',
  คัดเลือก: 'เชิญผู้ประกอบการที่มีคุณสมบัติไม่น้อยกว่า 3 ราย',
  เฉพาะเจาะจง: 'วงเงินไม่เกิน 500,000 บาท หรือกรณีจำเป็นเร่งด่วน',
  จ้างที่ปรึกษา: 'ตามระเบียบว่าด้วยการจ้างที่ปรึกษา (วิธีประกาศเชิญชวน/คัดเลือก/เฉพาะเจาะจง)',
}
export type Announce = { id: number; no: string; method: Method; date: string; project: string; budgetGroup: string; budget: number; objective: string; qualification: string; condition: string; closeAt: string; status: 'ร่าง' | 'เผยแพร่แล้ว' | 'ปิดรับซอง'; by: string }
export const budgetGroups = ['งบลงทุน · ครุภัณฑ์', 'งบดำเนินงาน · ค่าวัสดุ', 'งบดำเนินงาน · ค่าใช้สอย', 'งบดำเนินงาน · ค่าจ้างที่ปรึกษา']
export const seedAnnounces = (): Announce[] => [
  { id: 1, no: 'ปจ. 12/2569', method: 'ประกวดราคา', date: '2025-10-20', project: 'จัดซื้อเครื่องคอมพิวเตอร์โน้ตบุ๊ก จำนวน 40 เครื่อง', budgetGroup: 'งบลงทุน · ครุภัณฑ์', budget: 1_320_000, objective: 'ทดแทนเครื่องเดิมที่หมดอายุการใช้งานของเจ้าหน้าที่ภาคสนาม', qualification: 'เป็นนิติบุคคลผู้มีอาชีพขายพัสดุที่ประกวดราคา ไม่อยู่ในบัญชีรายชื่อผู้ทิ้งงาน', condition: 'ยื่นข้อเสนอผ่านระบบ e-GP · รับประกันไม่น้อยกว่า 3 ปี', closeAt: '2025-11-20', status: 'เผยแพร่แล้ว', by: 'อนุชา พรหมมา' },
  { id: 2, no: 'ปจ. 13/2569', method: 'เฉพาะเจาะจง', date: '2025-11-03', project: 'จ้างล้างและซ่อมบำรุงเครื่องปรับอากาศ อาคารสำนักงาน', budgetGroup: 'งบดำเนินงาน · ค่าใช้สอย', budget: 86_000, objective: 'บำรุงรักษาเครื่องปรับอากาศ 24 เครื่องตามรอบประจำปี', qualification: 'มีประสบการณ์งานบำรุงรักษาระบบปรับอากาศไม่น้อยกว่า 2 ปี', condition: 'ดำเนินการแล้วเสร็จภายใน 30 วัน', closeAt: '2025-11-10', status: 'ปิดรับซอง', by: 'อนุชา พรหมมา' },
]

// ---- repair requests (รายการแจ้งซ่อม — 2.1.8.3 / 2.1.8.4) -------------------------------------------
export type RepairStatus = 'รอตรวจสอบ' | 'กำลังซ่อม' | 'ซ่อมเสร็จ' | 'จำหน่าย'
export const repairTone: Record<RepairStatus, { tone: string; dot: string; open: boolean }> = {
  รอตรวจสอบ: { tone: 'bg-[#fff1d6] text-[#a8650b]', dot: 'bg-[#e3a008]', open: true },
  กำลังซ่อม: { tone: 'bg-[#e8f1ff] text-[#1f5fbf]', dot: 'bg-[#3b82f6]', open: true },
  ซ่อมเสร็จ: { tone: 'bg-[#dff5e8] text-[#0f8a63]', dot: 'bg-[#17a673]', open: false },
  จำหน่าย: { tone: 'bg-gray-line text-gray-30', dot: 'bg-gray-20', open: false },
}
export type RepairEvent = { at: string; by: string; action: string; note?: string }
export type Repair = { id: number; no: string; kind: AssetKind; assetCode: string; title: string; date: string; detail: string; qty: number; place: string; evidence: string[]; photo?: string; note: string; reporter: string; status: RepairStatus; cost?: number; history: RepairEvent[] }
const ev = (at: string, by: string, action: string, note?: string): RepairEvent => ({ at, by, action, note })
export const seedRepairs = (): Repair[] => [
  { id: 1, no: 'RP-6811-0004', kind: 'ครุภัณฑ์', assetCode: '7430-002-0001/67', title: 'เครื่องพิมพ์กระดาษติดและมีเส้นดำ', date: '2025-11-04', detail: 'พิมพ์แล้วมีเส้นดำพาดกลางหน้า และกระดาษติดบ่อยที่ถาดล่าง', qty: 1, place: 'สำนักบริหารงานกลาง ชั้น 1', evidence: ['printer-line.jpg'], note: '', reporter: 'ปริยดา เจริญวัฒนกุล', status: 'รอตรวจสอบ', history: [ev('2025-11-04 09:12', 'ปริยดา เจริญวัฒนกุล', 'แจ้งซ่อม')] },
  { id: 2, no: 'RP-6811-0003', kind: 'ครุภัณฑ์', assetCode: '7440-001-0002/68', title: 'โน้ตบุ๊กเปิดไม่ติด แบตเตอรี่บวม', date: '2025-11-01', detail: 'เครื่องไม่ชาร์จไฟ ฝาเครื่องโก่ง สงสัยแบตเตอรี่บวม', qty: 1, place: 'สำนักการเงินและบัญชี ชั้น 2', evidence: ['notebook-battery.jpg'], note: 'อยู่ในประกัน', reporter: 'กัญญา ใจดี', status: 'กำลังซ่อม', history: [ev('2025-11-01 13:40', 'กัญญา ใจดี', 'แจ้งซ่อม'), ev('2025-11-02 10:05', 'อนุชา พรหมมา', 'ยืนยันการชำรุด', 'แบตเตอรี่บวม ส่งศูนย์ตามประกัน'), ev('2025-11-02 10:06', 'อนุชา พรหมมา', 'ส่งซ่อม', 'ส่งศูนย์บริการ Dell')] },
  { id: 3, no: 'RP-6810-0002', kind: 'ครุภัณฑ์', assetCode: '4120-001-0004/66', title: 'เครื่องปรับอากาศห้องประชุม 1 ไม่เย็น', date: '2025-10-18', detail: 'เปิดแล้วมีแต่ลม ไม่เย็น มีน้ำหยด', qty: 1, place: 'ห้องประชุม 1 ชั้น 4', evidence: ['aircon.jpg'], note: '', reporter: 'สมหญิง ศรีสุข', status: 'ซ่อมเสร็จ', cost: 2_400, history: [ev('2025-10-18 08:50', 'สมหญิง ศรีสุข', 'แจ้งซ่อม'), ev('2025-10-18 14:00', 'อนุชา พรหมมา', 'ยืนยันการชำรุด'), ev('2025-10-19 09:00', 'อนุชา พรหมมา', 'ส่งซ่อม', 'เติมน้ำยาและล้างคอยล์'), ev('2025-10-21 16:30', 'อนุชา พรหมมา', 'ซ่อมเสร็จ', 'ค่าซ่อม 2,400 บาท')] },
  { id: 4, no: 'RP-6810-0001', kind: 'อื่น ๆ', assetCode: '', title: 'หลอดไฟทางเดินชั้น 2 ดับ', date: '2025-10-09', detail: 'หลอดไฟ LED ทางเดินหน้าห้องน้ำดับ 3 หลอด', qty: 3, place: 'ทางเดินชั้น 2', evidence: [], note: '', reporter: 'วิภา ทองดี', status: 'ซ่อมเสร็จ', cost: 450, history: [ev('2025-10-09 11:15', 'วิภา ทองดี', 'แจ้งซ่อม'), ev('2025-10-09 15:20', 'อนุชา พรหมมา', 'ซ่อมเสร็จ', 'เปลี่ยนหลอด LED 3 หลอด')] },
  { id: 5, no: 'RP-6809-0003', kind: 'ครุภัณฑ์', assetCode: '7440-005-0003/67', title: 'โปรเจกเตอร์ภาพเหลือง', date: '2025-09-22', detail: 'ภาพมีสีเหลืองและมืด ใช้งานนำเสนอไม่ได้', qty: 1, place: 'ห้องประชุม 1 ชั้น 4', evidence: ['projector.jpg'], note: '', reporter: 'ธีรพงษ์ ใจมั่น', status: 'ซ่อมเสร็จ', cost: 3_200, history: [ev('2025-09-22 10:00', 'ธีรพงษ์ ใจมั่น', 'แจ้งซ่อม'), ev('2025-09-23 09:30', 'อนุชา พรหมมา', 'ยืนยันการชำรุด'), ev('2025-09-23 09:31', 'อนุชา พรหมมา', 'ส่งซ่อม', 'เปลี่ยนหลอดภาพ'), ev('2025-09-26 15:00', 'อนุชา พรหมมา', 'ซ่อมเสร็จ', 'ค่าซ่อม 3,200 บาท')] },
  { id: 6, no: 'RP-6809-0002', kind: 'ครุภัณฑ์', assetCode: '7110-006-0002/60', title: 'เก้าอี้สำนักงานขาหัก', date: '2025-09-10', detail: 'ขาเก้าอี้หัก ไม่คุ้มค่าซ่อม', qty: 1, place: 'สำนักผู้อำนวยการ', evidence: [], note: '', reporter: 'ปริยดา เจริญวัฒนกุล', status: 'จำหน่าย', history: [ev('2025-09-10 09:00', 'ปริยดา เจริญวัฒนกุล', 'แจ้งซ่อม'), ev('2025-09-11 10:00', 'อนุชา พรหมมา', 'ยืนยันการชำรุด'), ev('2025-09-11 10:02', 'อนุชา พรหมมา', 'จำหน่าย', 'อายุใช้งานเกิน 8 ปี ไม่คุ้มค่าซ่อม ตัดออกจากทะเบียน')] },
  { id: 7, no: 'RP-6809-0001', kind: 'พัสดุ', assetCode: 'SP-0002', title: 'หมึกพิมพ์รั่ว', date: '2025-09-02', detail: 'ตลับหมึกใหม่รั่ว 1 กล่อง', qty: 1, place: 'คลังพัสดุ ชั้น 1', evidence: ['toner.jpg'], note: 'เปลี่ยนกับผู้ขาย', reporter: 'กัญญา ใจดี', status: 'ซ่อมเสร็จ', history: [ev('2025-09-02 14:00', 'กัญญา ใจดี', 'แจ้งซ่อม'), ev('2025-09-04 11:00', 'อนุชา พรหมมา', 'ซ่อมเสร็จ', 'ผู้ขายเปลี่ยนสินค้าให้')] },
]
export const nextRepairNo = (all: Repair[]) => {
  const d = new Date()
  const p = `RP-${beYY()}${String(d.getMonth() + 1).padStart(2, '0')}-`
  const n = all.filter((r) => r.no.startsWith(p)).length + 1
  return p + String(n).padStart(4, '0')
}
export const nextImportNo = (all: ImportDoc[]) => {
  const d = new Date()
  const p = `IMP-${beYY()}${String(d.getMonth() + 1).padStart(2, '0')}-`
  return p + String(all.filter((r) => r.no.startsWith(p)).length + 1).padStart(3, '0')
}
export const money = (n: number) => n.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })
