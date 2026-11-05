// Mock data for the OSS dashboard (UI-only for now)

export const overviewUpdatedAt = '25 พฤศจิกายน 2568, 2:00 PM'

export type StatKey = 'councils' | 'organizations' | 'members' | 'funds'
export const stats: { key: StatKey; label: string[]; value: number; unit: string }[] = [
  { key: 'councils', label: ['จำนวนสภาองค์กรฯ', 'ที่จัดตั้งแล้ว'], value: 7749, unit: 'สภาฯ' },
  { key: 'organizations', label: ['จำนวนองค์กร', 'ชุมชนที่จดแจ้งฯ'], value: 156040, unit: 'องค์กร' },
  { key: 'members', label: ['จำนวนสมาชิก', 'สภาฯ'], value: 252681, unit: 'คน' },
  { key: 'funds', label: ['จำนวนกองทุน', 'สวัสดิการชุมชน'], value: 6080, unit: 'กองทุน' },
]

export const alerts = [
  { id: 1, unit: 'งานบริการ OSS', subject: 'คำขอจัดสรรงบประมาณ', date: '2025-10-09', status: 'รอดำเนินการ' },
  { id: 2, unit: 'งานบริหารจัดการสัญญา', subject: 'สัญญาเช่าที่ดิน รฟม.', date: '2025-11-26', status: 'รอดำเนินการ' },
]

/** Budget axis ticks (THB). The axis is piecewise-linear between ticks, as in the design. */
export const budgetTicks = [0, 250_000, 500_000, 1_000_000, 2_500_000]

const placeholder = { code: 'รหัสโครงการ', name: 'ชื่อโครงการ', year: 'ปีงบประมาณ' }
export const projects: { code: string; name: string; year?: string; budget: number; used: number; remaining: number }[] = [
  { code: 'PT041469-00003', name: 'โครงการแก้ไขปัญหาที่อยู่อาศัยบ้านมั่นคง', budget: 1_000_000, used: 481_200, remaining: 286_600 },
  { code: 'PT013368-00026', name: 'โครงการสนับสนุนการจัดประชุมในระดับชาติ', budget: 1_566_400, used: 721_800, remaining: 221_800 },
  { ...placeholder, budget: 2_500_000, used: 351_500, remaining: 877_400 },
  { ...placeholder, budget: 1_566_400, used: 2_110_600, remaining: 1_262_800 },
  { ...placeholder, budget: 2_500_000, used: 351_500, remaining: 877_400 },
  { ...placeholder, budget: 592_000, used: 27_200, remaining: 540_200 },
  { ...placeholder, budget: 2_500_000, used: 351_500, remaining: 877_400 },
  { ...placeholder, budget: 2_500_000, used: 351_500, remaining: 877_400 },
]

export const councilsByRegion = [
  { region: 'กทม.&ตอ.', subdistricts: 918, councils: 457 },
  { region: 'กลาง&ตต.', subdistricts: 720, councils: 589 },
  { region: 'ตอ.เฉียงเหนือ', subdistricts: 918, councils: 457 },
  { region: 'ใต้', subdistricts: 918, councils: 457 },
  { region: 'เหนือ', subdistricts: 918, councils: 457 },
]

export type DocStatus = 'Pending' | 'Draft' | 'Approved'
export const documents: { id: number; title: string; date: string; time: string; status: DocStatus }[] = [
  { id: 1, title: 'เอกสารยื่นคำขอจดทะเบียนสภาองค์กร......', date: '23-10-68', time: '14:00', status: 'Pending' },
  { id: 2, title: 'เอกสารยื่นคำขอจดทะเบียนสภาองค์กร......', date: '23-10-68', time: '14:00', status: 'Draft' },
  { id: 3, title: 'เอกสารยื่นคำขอตรวจสอบข้อมูลสมาชิกองค์กรชุมชน', date: '23-10-68', time: '14:00', status: 'Approved' },
]

export const news = [
  { id: 1, title: 'กิจกรรมฉลองครบรอบ 25 ปี พอช.', date: '22-10-68', time: '06:00' },
  { id: 2, title: 'วันหยุดพิเศษ เนื่องในวันปิยมหาราช', date: '23-10-68', time: '14:00' },
]
