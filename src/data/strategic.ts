// ERP STRATEGIC — งานจัดการแผนยุทธศาสตร์องค์กร (TOR 4.7 (4), book 3 §2.1.2, flow from book 1 §2.2.1)

export type Persona = 'strat' | 'office'
export const personas: Record<Persona, { name: string; office: string; short: string }> = {
  strat: { name: 'สมหญิง ศรีสุข', office: 'สำนักยุทธศาสตร์ นโยบายและแผน', short: 'เจ้าหน้าที่สำนักยุทธศาสตร์ฯ' },
  office: { name: 'ปริยดา เจริญวัฒนกุล', office: 'สำนักเทคโนโลยีสารสนเทศ', short: 'เจ้าหน้าที่สำนัก (สนง.เทคโนโลยีฯ)' },
}
export const offices = ['สำนักผู้อำนวยการ', 'สำนักยุทธศาสตร์ นโยบายและแผน', 'สำนักเทคโนโลยีสารสนเทศ', 'สำนักทรัพยากรบุคคล', 'สำนักการเงินและบัญชี', 'สำนักบริหารงานกลาง', 'สำนักพัฒนาองค์ความรู้และสื่อสารองค์กร']
/** budget ceiling allocated to each office — the plan check (book 1: "ไม่เกินวงเงินที่ได้รับจัดสรร") */
export const allocation: Record<string, number> = { 'สำนักเทคโนโลยีสารสนเทศ': 5_000_000, 'สำนักทรัพยากรบุคคล': 2_000_000, 'สำนักการเงินและบัญชี': 1_500_000, 'สำนักบริหารงานกลาง': 3_500_000, 'สำนักผู้อำนวยการ': 4_000_000, 'สำนักยุทธศาสตร์ นโยบายและแผน': 1_000_000, 'สำนักพัฒนาองค์ความรู้และสื่อสารองค์กร': 1_200_000 }

export const planTypes = [
  { key: 'corp', label: 'แผนยุทธศาสตร์องค์กร' },
  { key: 'dept', label: 'แผนระดับกอง/ฝ่าย' },
  { key: 'support', label: 'แผนสนับสนุน' },
] as const
export const alignments = [
  { key: 'related', label: 'ความเสี่ยงที่เกี่ยวข้อง' },
  { key: 'level', label: 'ระดับความเสี่ยง' },
  { key: 'control', label: 'แนวทางควบคุม' },
] as const
export type Align = (typeof alignments)[number]['key']
export const riskTypes = ['กลยุทธ์', 'การปฏิบัติงาน', 'การเงิน', 'เทคโนโลยีสารสนเทศ', 'กฎหมาย/ข้อบังคับ']
export const quarters = ['ไตรมาส 1', 'ไตรมาส 2', 'ไตรมาส 3', 'ไตรมาส 4']
export const riskStatuses = ['ยังควบคุมไม่ได้', 'อยู่ระหว่างควบคุม', 'ควบคุมได้ตามแผน', 'ปิดความเสี่ยงแล้ว']

export type Strategy = {
  id: number
  code: string
  fiscalYear: string
  name: string
  planType: (typeof planTypes)[number]['key']
  vision: string
  mission: string
  goal: string
  description: string
  links: { nat: string; gov: string; parent: string; sdg: string; kpi: string }
  align: Align
  createdAt: string
  by: string
}

export type BudgetItem = { code: string; name: string; init: number; approved: number; committed: number; annual: number }
export type PlanStatus = 'draft' | 'submitted' | 'approved' | 'rejected' | 'returned'
export const planStatusLabel: Record<PlanStatus, string> = { draft: 'ร่าง', submitted: 'รอพิจารณา', approved: 'อนุมัติแล้ว', rejected: 'ไม่อนุมัติ', returned: 'ส่งกลับแก้ไข' }
export type PlanEvent = { at: string; by: string; action: string; note?: string }
export type Plan = {
  id: number
  no: string
  office: string
  fiscalYear: string
  creator: string
  shared: boolean
  carry: boolean
  detail: string
  note: string
  items: BudgetItem[]
  status: PlanStatus
  review?: { decision: 'approve' | 'reject' | 'return'; reason: string; by: string; at: string }
  history: PlanEvent[]
  createdAt: string
}

export type Risk = {
  id: number
  code: string
  fiscalYear: string
  name: string
  type: string
  description: string
  owner: string
  causes: { internal: string; external: string; gap: string; resource: string }
  impacts: { mission: string; clients: string; money: string; image: string; legal: string }
  align: Align
  impact: number
  likelihood: number
  residual: number
  status: 'draft' | 'open' | 'closed'
  updatedAt: string
}
export type RiskReport = {
  id: number
  riskId: number
  quarter: string
  progress: string
  detail: string
  problems: string
  support: string
  evidence: string
  state: string
  residual: string
  submitted: boolean
  by: string
  at: string
}

export const levelOf = (r: { impact: number; likelihood: number }) => r.impact * r.likelihood
export const levelLabel = (n: number) => (n >= 15 ? 'สูง' : n >= 8 ? 'กลาง' : 'ต่ำ')
export const levelTone = (n: number) => (n >= 15 ? 'bg-[#fde2e2] text-[#c0262d]' : n >= 8 ? 'bg-[#fff1d6] text-[#a8650b]' : 'bg-[#dff5e8] text-[#0f8a63]')
export const baht = (n: number) => n.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })
export const sumBy = (items: BudgetItem[], k: 'init' | 'approved' | 'committed' | 'annual') => items.reduce((a, b) => a + (b[k] || 0), 0)

export const pad = (n: number) => String(n).padStart(2, '0')
export const stamp = (d = new Date()) => `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())} ${pad(d.getHours())}:${pad(d.getMinutes())}`

const link = (s: string) => s
export const seedStrategies = (): Strategy[] => [
  { id: 1, code: 'ST-2568-01', fiscalYear: '2568', name: 'ยกระดับองค์กรสู่องค์กรดิจิทัล', planType: 'corp', vision: 'องค์กรชุมชนเข้มแข็ง ชุมชนมีที่อยู่อาศัยมั่นคง', mission: 'สนับสนุนองค์กรชุมชนและเครือข่ายให้พึ่งตนเองได้ผ่านระบบข้อมูลและบริการดิจิทัล', goal: 'ทุกกระบวนงานหลักใช้งานผ่านแพลตฟอร์มดิจิทัลภายในปี 2570', description: 'พัฒนาแพลตฟอร์มบริหารจัดการทรัพยากรองค์กร (ERP) และ One Stop Service เพื่อลดงานเอกสารและเพิ่มความโปร่งใส', links: { nat: link('ยุทธศาสตร์ชาติ ด้านการปรับสมดุลและพัฒนาระบบการบริหารจัดการภาครัฐ'), gov: link('นโยบายรัฐบาลดิจิทัล / นโยบาย พม.'), parent: link('แผนปฏิบัติการ พอช. ระยะ 5 ปี'), sdg: 'SDG 11, SDG 16', kpi: 'KPI ผอ.: ร้อยละของกระบวนงานที่เป็นดิจิทัล' }, align: 'related', createdAt: '2025-10-02 10:00', by: 'สมหญิง ศรีสุข' },
]

const it = 'สำนักเทคโนโลยีสารสนเทศ'
const bi = (code: string, name: string, init: number, approved = 0, committed = 0, annual = 0): BudgetItem => ({ code, name, init, approved, committed, annual })
const ev = (at: string, by: string, action: string, note?: string): PlanEvent => ({ at, by, action, note })
export const seedPlans = (): Plan[] => [
  { id: 1, no: '2567/IT-001', office: it, fiscalYear: '2567', creator: 'ปริยดา เจริญวัฒนกุล', shared: false, carry: false, detail: 'แผนงบประมาณประจำปี 2567 สำนักเทคโนโลยีสารสนเทศ', note: '', items: [bi('329207', 'ค่าเช่าระบบเครือข่าย', 480000, 480000, 0, 480000), bi('329301', 'ค่าบำรุงรักษาซอฟต์แวร์', 620000, 600000, 0, 600000), bi('329412', 'ค่าจัดซื้อคอมพิวเตอร์', 900000, 850000, 0, 850000)], status: 'approved', history: [ev('2024-09-20 10:00', 'ปริยดา เจริญวัฒนกุล', 'ยื่นแผน'), ev('2024-09-28 14:00', 'สมหญิง ศรีสุข', 'อนุมัติ')], createdAt: '2024-09-18 09:00' },
  { id: 2, no: '2568/IT-001', office: it, fiscalYear: '2568', creator: 'ปริยดา เจริญวัฒนกุล', shared: false, carry: false, detail: 'พัฒนาระบบ ERP ระยะที่ 1 และบำรุงรักษาโครงสร้างพื้นฐาน', note: 'ปรับเพิ่มจากปีก่อนตามโครงการ Data Platform', items: [bi('329207', 'ค่าเช่าระบบเครือข่าย', 500000, 480000, 0, 480000), bi('329301', 'ค่าบำรุงรักษาซอฟต์แวร์', 1_300_000, 1_250_000, 200000, 1_250_000), bi('329500', 'ค่าพัฒนาระบบ ERP', 3_000_000, 3_000_000, 1_200_000, 3_000_000)], status: 'approved', review: { decision: 'approve', reason: 'เห็นสมควรได้รับการอนุมัติ สอดคล้องกับยุทธศาสตร์องค์กรดิจิทัล', by: 'สมหญิง ศรีสุข', at: '2025-10-20 15:30' }, history: [ev('2025-10-10 09:20', 'ปริยดา เจริญวัฒนกุล', 'ยื่นแผน'), ev('2025-10-20 15:30', 'สมหญิง ศรีสุข', 'อนุมัติ', 'เห็นสมควรได้รับการอนุมัติ')], createdAt: '2025-10-08 09:00' },
  { id: 3, no: '2568/DR-001', office: 'สำนักผู้อำนวยการ', fiscalYear: '2568', creator: 'ธนพล แสงทอง', shared: false, carry: false, detail: 'งานบริหารองค์กรและประชุมคณะกรรมการ', note: '', items: [bi('311001', 'ค่าประชุมคณะกรรมการ', 1_800_000, 1_700_000, 0, 1_700_000), bi('311090', 'ค่าใช้จ่ายเดินทาง', 2_300_000, 2_300_000, 0, 2_300_000)], status: 'approved', review: { decision: 'approve', reason: 'อนุมัติ', by: 'สมหญิง ศรีสุข', at: '2025-10-18 11:00' }, history: [ev('2025-10-09 13:00', 'ธนพล แสงทอง', 'ยื่นแผน'), ev('2025-10-18 11:00', 'สมหญิง ศรีสุข', 'อนุมัติ')], createdAt: '2025-10-07 09:00' },
  { id: 4, no: '2568/AD-001', office: 'สำนักบริหารงานกลาง', fiscalYear: '2568', creator: 'วรรณา ใจสว่าง', shared: true, carry: false, detail: 'งานพัสดุ อาคารสถานที่ และยานพาหนะ', note: '', items: [bi('322001', 'ค่าซ่อมบำรุงอาคาร', 1_400_000, 1_400_000, 0, 1_400_000), bi('322150', 'ค่าน้ำมันเชื้อเพลิง', 600000, 600000, 0, 600000), bi('322210', 'ค่าวัสดุสำนักงาน', 1_000_000, 1_000_000, 0, 1_000_000)], status: 'approved', review: { decision: 'approve', reason: 'อนุมัติ', by: 'สมหญิง ศรีสุข', at: '2025-10-19 10:00' }, history: [ev('2025-10-09 15:00', 'วรรณา ใจสว่าง', 'ยื่นแผน'), ev('2025-10-19 10:00', 'สมหญิง ศรีสุข', 'อนุมัติ')], createdAt: '2025-10-07 10:00' },
  { id: 5, no: '2568/HR-001', office: 'สำนักทรัพยากรบุคคล', fiscalYear: '2568', creator: 'กัญญา พงษ์ไพร', shared: false, carry: false, detail: 'แผนพัฒนาบุคลากรและสวัสดิการ ประจำปี 2568', note: 'รวมงบอบรมผู้นำชุมชน', items: [bi('331001', 'ค่าอบรมพัฒนาบุคลากร', 900000, 0, 0, 0), bi('331200', 'ค่าสวัสดิการเจ้าหน้าที่', 750000, 0, 0, 0)], status: 'submitted', history: [ev('2025-11-10 14:10', 'กัญญา พงษ์ไพร', 'ยื่นแผน')], createdAt: '2025-11-09 09:00' },
  { id: 6, no: '2568/FN-001', office: 'สำนักการเงินและบัญชี', fiscalYear: '2568', creator: 'ศิริพร ทองดี', shared: false, carry: true, detail: 'แผนงบประมาณสำนักการเงินและบัญชี รวมค่าใช้จ่ายค้างจ่ายยกมา', note: '', items: [bi('341001', 'ค่าตรวจสอบบัญชี', 600000, 0, 0, 0), bi('341020', 'ค่าธรรมเนียมธนาคาร', 280000, 0, 0, 0)], status: 'submitted', history: [ev('2025-11-11 10:30', 'ศิริพร ทองดี', 'ยื่นแผน')], createdAt: '2025-11-10 09:00' },
  { id: 7, no: '2568/KM-001', office: 'สำนักพัฒนาองค์ความรู้และสื่อสารองค์กร', fiscalYear: '2568', creator: 'อรทัย บุญมา', shared: false, carry: false, detail: 'แผนผลิตสื่อและจัดการความรู้', note: '', items: [bi('351001', 'ค่าผลิตสื่อประชาสัมพันธ์', 1_500_000, 0, 0, 0)], status: 'returned', review: { decision: 'return', reason: 'วงเงินเกินที่ได้รับจัดสรร กรุณาปรับลดรายการค่าผลิตสื่อ', by: 'สมหญิง ศรีสุข', at: '2025-11-11 16:00' }, history: [ev('2025-11-09 11:00', 'อรทัย บุญมา', 'ยื่นแผน'), ev('2025-11-11 16:00', 'สมหญิง ศรีสุข', 'ส่งกลับแก้ไข', 'วงเงินเกินที่ได้รับจัดสรร กรุณาปรับลดรายการค่าผลิตสื่อ')], createdAt: '2025-11-08 09:00' },
]

const rk = (id: number, name: string, type: string, owner: string, impact: number, likelihood: number, status: Risk['status'] = 'open', at = '2025-09-24 14:30'): Risk => ({
  id, code: `R-${String(32400 + id)}`, fiscalYear: '2568', name, type, description: `${name} อาจส่งผลต่อการดำเนินงานตามแผนประจำปี`, owner, causes: { internal: 'ขั้นตอนการทำงานยังไม่เป็นมาตรฐาน', external: 'การเปลี่ยนแปลงนโยบายภาครัฐ', gap: 'ขาดการควบคุมระหว่างขั้นตอน', resource: 'บุคลากรและงบประมาณจำกัด' }, impacts: { mission: 'กระทบต่อการบรรลุพันธกิจ', clients: 'ผู้รับบริการได้รับความล่าช้า', money: 'ค่าใช้จ่ายเพิ่มขึ้น', image: 'ภาพลักษณ์องค์กร', legal: 'ความเสี่ยงด้านกฎหมาย' }, align: 'related', impact, likelihood, residual: Math.max(1, impact * likelihood - 3), status, updatedAt: at,
})
export const seedRisks = (): Risk[] => [
  rk(1, 'ระบบเครือข่ายล่ม', 'เทคโนโลยีสารสนเทศ', 'กอง IT', 5, 3), rk(2, 'ขาดผู้เชี่ยวชาญเฉพาะทาง', 'การปฏิบัติงาน', 'ทรัพยากรบุคคล', 3, 3),
  rk(3, 'ข้อมูลสำคัญสูญหาย', 'เทคโนโลยีสารสนเทศ', 'ศูนย์ข้อมูล', 5, 4), rk(4, 'อัพเดทเวอร์ชันล่าช้า', 'การปฏิบัติงาน', 'พัสดุ', 2, 3),
  rk(5, 'ข้อมูลสำคัญรั่วไหล', 'เทคโนโลยีสารสนเทศ', 'ศูนย์ข้อมูล', 5, 4), rk(6, 'งบประมาณถูกตัดทอน', 'การเงิน', 'สำนักการเงินและบัญชี', 4, 4),
  rk(7, 'ผู้รับจ้างส่งมอบล่าช้า', 'กลยุทธ์', 'สำนักบริหารงานกลาง', 3, 3), rk(8, 'กฎระเบียบเปลี่ยนแปลง', 'กฎหมาย/ข้อบังคับ', 'สำนักผู้อำนวยการ', 2, 2),
  rk(9, 'การเบิกจ่ายล่าช้า', 'การเงิน', 'สำนักการเงินและบัญชี', 3, 2), rk(10, 'บุคลากรลาออกสูงกว่าเป้า', 'การปฏิบัติงาน', 'ทรัพยากรบุคคล', 4, 3),
  rk(11, 'ระบบสำรองข้อมูลไม่ครบ', 'เทคโนโลยีสารสนเทศ', 'กอง IT', 4, 4), rk(12, 'โครงการไม่ทันตามแผน', 'กลยุทธ์', 'สำนักยุทธศาสตร์ นโยบายและแผน', 3, 4),
  rk(13, 'ข้อร้องเรียนจากชุมชน', 'การปฏิบัติงาน', 'สำนักผู้อำนวยการ', 2, 4), rk(14, 'ผลการตรวจสอบภายใน', 'กฎหมาย/ข้อบังคับ', 'สำนักการเงินและบัญชี', 3, 2),
  rk(15, 'ภัยพิบัติกระทบพื้นที่โครงการ', 'กลยุทธ์', 'สำนักผู้อำนวยการ', 4, 2), rk(16, 'ค่าใช้จ่ายค้างจ่ายสะสม', 'การเงิน', 'สำนักการเงินและบัญชี', 2, 3),
  rk(17, 'สัญญาจ้างหมดอายุ', 'กฎหมาย/ข้อบังคับ', 'พัสดุ', 3, 3), rk(18, 'ข้อมูลองค์กรชุมชนไม่เป็นปัจจุบัน', 'การปฏิบัติงาน', 'ศูนย์ข้อมูล', 2, 4),
  rk(19, 'ช่องโหว่ความปลอดภัยของระบบ', 'เทคโนโลยีสารสนเทศ', 'กอง IT', 5, 3, 'open', '2025-10-02 09:10'), rk(20, 'การสื่อสารนโยบายไม่ทั่วถึง', 'กลยุทธ์', 'สำนักพัฒนาองค์ความรู้ฯ', 2, 3),
  rk(21, 'เจ้าหน้าที่ขาดทักษะดิจิทัล', 'การปฏิบัติงาน', 'ทรัพยากรบุคคล', 3, 4), rk(22, 'ต้นทุนบำรุงรักษาระบบสูง', 'การเงิน', 'กอง IT', 3, 3),
  rk(23, 'อุปกรณ์เสื่อมสภาพ', 'การปฏิบัติงาน', 'พัสดุ', 2, 2, 'closed', '2025-08-15 10:00'), rk(24, 'แผนปฏิบัติการไม่สอดคล้องตัวชี้วัด', 'กลยุทธ์', 'สำนักยุทธศาสตร์ นโยบายและแผน', 3, 3),
]
export const seedReports = (): RiskReport[] => []

/** dashboard figures that need the finance system (spent so far, monthly curve, project progress) stay sample data */
export const monthly = [
  { m: 'ต.ค.', plan: 82, used: 62 }, { m: 'พ.ย.', plan: 70, used: 55 }, { m: 'ธ.ค.', plan: 58, used: 40 }, { m: 'ม.ค.', plan: 64, used: 46 },
  { m: 'ก.พ.', plan: 52, used: 30 }, { m: 'มี.ค.', plan: 74, used: 58 }, { m: 'เม.ย.', plan: 60, used: 44 }, { m: 'พ.ค.', plan: 78, used: 66 },
]
export const projects = [
  { name: 'โครงการระบบสารบรรณ', progress: 82, used: 75, state: 'ตรงแผน' },
  { name: 'โครงการพัฒนาระบบคลัง', progress: 58, used: 66, state: 'ล่าช้า' },
  { name: 'โครงการ Data Platform', progress: 35, used: 28, state: 'เริ่มต้น' },
  { name: 'โครงการ Mobile App', progress: 68, used: 72, state: 'เกินงบ' },
]
export const disbursements = [
  { no: 'PR-2568-0911', name: 'ค่าลิขสิทธิ์ซอฟต์แวร์', amount: 120000, state: 'อนุมัติแล้ว' },
  { no: 'PR-2568-0912', name: 'ค่าบริการที่ปรึกษา', amount: 80000, state: 'รออนุมัติ' },
  { no: 'PR-2568-0913', name: 'ค่า Cloud Infrastructure', amount: 200000, state: 'จ่ายแล้ว' },
  { no: 'PR-2568-0914', name: 'ค่าอบรมบุคลากร', amount: 45000, state: 'รออนุมัติ' },
  { no: 'PR-2568-0915', name: 'ค่าบำรุงรักษาเครือข่าย', amount: 95000, state: 'อนุมัติแล้ว' },
]
export const spentRatio = 0.65
