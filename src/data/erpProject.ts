// ERP PROJECT — งานรายงานผลการดำเนินงาน (TOR 4.7 (4), book 3 §2.1.3, flow from book 1 §2.2.2)
import { baht, stamp } from './strategic'

export { baht, stamp }

export const baht0 = (n: number) => n.toLocaleString('en-US', { maximumFractionDigits: 0 })
export const thDate = (iso: string) => (iso ? iso.slice(0, 10).split('-').reverse().join('/').replace(/^(\d+)\/(\d+)\/(\d{4})$/, (_, d, m, y) => `${d}/${m}/${Number(y) + 543}`) : '-')

// ---------------------------------------------------------------------------------------------
// 2.1.3.2 / 2.1.3.3 — performance records (ผลการดำเนินงาน) : plan details + budget + real spending
// ---------------------------------------------------------------------------------------------
export type PStatus = 'draft' | 'submitted' | 'approved'
export const pStatus: Record<PStatus, { label: string; tone: string }> = {
  draft: { label: 'ร่าง', tone: 'bg-[#e1ebff] text-[#2b4fbf]' },
  submitted: { label: 'ส่งอนุมัติ', tone: 'bg-[#fff1d6] text-[#a8650b]' },
  approved: { label: 'อนุมัติแล้ว', tone: 'bg-[#dff5e8] text-[#0f8a63]' },
}
export const planStates = ['ระหว่างดำเนินการ', 'เสร็จสิ้น', 'ล่าช้า', 'ยกเลิก']
export const planKinds = ['แผนงานประจำปี', 'แผนงานโครงการพิเศษ', 'แผนงานต่อเนื่อง']
export const budgetGroups = ['งบดำเนินบริหารจัดการ', 'งบดำเนินงานตามภารกิจ', 'งบลงทุน', 'งบอุดหนุน']
export const budgetCategories = ['หมวดค่าวัสดุ', 'หมวดค่าใช้สอย', 'หมวดค่าครุภัณฑ์', 'หมวดค่าตอบแทน']
export const years = ['2568', '2567', '2566']

export type Expense = { invoice: string; date: string; detail: string; amount: string }
export type Perf = {
  id: number
  no: string
  name: string
  strategy: string
  year: string
  state: string
  kind: string
  office: string
  creator: string
  date: string // yyyy-mm-dd
  code: string
  category: string
  group: string
  item: string
  init: number
  approved: number
  annual: number
  target: number // % planned progress
  progress: number // % actual progress
  note: string
  expenses: Expense[]
  status: PStatus
}
export const blankExpense = (): Expense => ({ invoice: '', date: new Date().toISOString().slice(0, 10), detail: '', amount: '' })
export const spentOf = (p: { expenses: Expense[] }) => p.expenses.reduce((a, e) => a + (Number(e.amount) || 0), 0)
export const planBudget = (p: Pick<Perf, 'approved' | 'init'>) => p.approved || p.init

/** RAG used on the overview table (book 3 fig 2-12): behind plan ≥ 5 points = ล่าช้า, spent over budget = เกินงบ */
export const ragOf = (p: Perf): 'ปกติ' | 'ล่าช้า' | 'เกินงบ' => {
  if (spentOf(p) > planBudget(p)) return 'เกินงบ'
  if (p.progress - p.target <= -5) return 'ล่าช้า'
  return 'ปกติ'
}
export const ragTone: Record<string, string> = { ปกติ: 'bg-[#dff5e8] text-[#0f8a63]', ล่าช้า: 'bg-[#fff1d6] text-[#a8650b]', เกินงบ: 'bg-[#fde2e2] text-[#c0262d]' }

const ex = (invoice: string, date: string, detail: string, amount: number): Expense => ({ invoice, date, detail, amount: String(amount) })
const P = (id: number, no: string, name: string, strategy: string, office: string, creator: string, date: string, code: string, category: string, init: number, target: number, progress: number, status: PStatus, expenses: Expense[], extra: Partial<Perf> = {}): Perf => ({
  id, no, name, strategy, year: '2568', state: 'ระหว่างดำเนินการ', kind: planKinds[0], office, creator, date, code, category, group: budgetGroups[0], item: budgetCategories[0], init, approved: status === 'draft' ? 0 : init, annual: status === 'approved' ? init : 0, target, progress, note: '', expenses, status, ...extra,
})
export const seedPerfs = (): Perf[] => [
  P(11, 'BP-07-68-0011', 'ระบบสารบรรณอิเล็กทรอนิกส์', 'บริหารดิจิทัล', 'กอง IT', 'วราพร วัฒนา', '2025-07-20', '50207', 'ซอฟต์แวร์คอมพิวเตอร์', 1_200_000, 82, 80, 'approved', [ex('INV-0711', '2025-08-02', 'ค่าพัฒนาระบบงวดที่ 1', 600_000), ex('INV-0744', '2025-09-05', 'ค่าพัฒนาระบบงวดที่ 2', 520_000)]),
  P(10, 'BP-07-68-0010', 'พัฒนาระบบคลัง', 'โครงสร้างพื้นฐาน', 'ศูนย์ข้อมูล', 'ธนกฤต แสงทอง', '2025-07-22', '50311', 'ระบบสารสนเทศ', 900_000, 60, 54, 'approved', [ex('INV-0802', '2025-08-14', 'ค่าจ้างพัฒนาโมดูลบัญชี', 380_000), ex('INV-0830', '2025-09-12', 'ค่า License ฐานข้อมูล', 240_000)]),
  P(9, 'BP-07-68-0009', 'Data Platform', 'โครงสร้างพื้นฐาน', 'กอง IT', 'วราพร วัฒนา', '2025-07-25', '50402', 'ระบบประมวลผลข้อมูล', 1_500_000, 40, 35, 'submitted', [ex('INV-0901', '2025-09-01', 'ค่าที่ปรึกษาออกแบบสถาปัตยกรรม', 420_000)]),
  P(8, 'BP-07-68-0008', 'Mobile App', 'บริหารดิจิทัล', 'ศูนย์ข้อมูล', 'ธนกฤต แสงทอง', '2025-07-22', '50215', 'แอปพลิเคชัน', 800_000, 70, 68, 'approved', [ex('INV-0613', '2025-07-30', 'ค่าออกแบบ UX/UI', 300_000), ex('INV-0655', '2025-08-28', 'ค่าพัฒนา Android/iOS', 400_000), ex('INV-0690', '2025-09-20', 'ค่าทดสอบระบบเพิ่มเติม', 180_000)]),
  P(7, 'BP-07-68-0007', 'อบรมการใช้งานระบบสารบรรณ', 'พัฒนาบุคลากร', 'กอง IT', 'วราพร วัฒนา', '2025-07-20', '50119', 'ค่าอบรมสัมมนา', 35_000, 100, 90, 'submitted', [ex('INV-0501', '2025-08-10', 'ค่าวิทยากรและอาหารว่าง', 31_500)], { item: budgetCategories[1] }),
  P(6, 'BP-07-68-0006', 'จัดซื้อเครื่องคอมพิวเตอร์โน้ตบุ๊ก', 'บริหารดิจิทัล', 'สำนักนโยบายและแผน', 'System Administrator', '2025-07-13', '50207', 'ซอฟต์แวร์คอมพิวเตอร์', 20_000, 30, 30, 'draft', []),
  P(5, 'BP-07-68-0005', 'ปรับปรุงห้องประชุมอิเล็กทรอนิกส์', 'บริหารดิจิทัล', 'สำนักบริหารงานกลาง', 'วรรณา ใจสว่าง', '2025-06-30', '50121', 'ครุภัณฑ์สำนักงาน', 150_000, 50, 52, 'approved', [ex('INV-0402', '2025-07-15', 'ค่าอุปกรณ์ประชุมทางไกล', 60_000)], { item: budgetCategories[2] }),
  P(4, 'BP-07-68-0004', 'จัดทำสื่อประชาสัมพันธ์ ปี 2568', 'สื่อสารองค์กร', 'สำนักสื่อสารองค์กร', 'อรทัย บุญมา', '2025-06-18', '50133', 'วัสดุสิ่งพิมพ์', 90_000, 40, 38, 'approved', [ex('INV-0371', '2025-07-01', 'ค่าออกแบบและพิมพ์สื่อ', 36_000)]),
  P(3, 'BP-07-68-0003', 'ประชุมคณะกรรมการสถาบัน ไตรมาส 3', 'บริหารองค์กร', 'สำนักผู้อำนวยการ', 'ธนพล แสงทอง', '2025-06-12', '50101', 'ค่าตอบแทนกรรมการ', 240_000, 75, 75, 'approved', [ex('INV-0350', '2025-06-20', 'ค่าเบี้ยประชุม', 180_000)], { item: budgetCategories[3] }),
  P(2, 'BP-07-68-0002', 'พัฒนาบุคลากรด้านดิจิทัล', 'พัฒนาบุคลากร', 'สำนักทรัพยากรบุคคล', 'กัญญา พงษ์ไพร', '2025-06-02', '50119', 'ค่าอบรมสัมมนา', 300_000, 45, 40, 'submitted', [ex('INV-0302', '2025-06-25', 'ค่าอบรมรุ่นที่ 1', 110_000)]),
  P(1, 'BP-07-68-0001', 'เช่าพื้นที่คลาวด์ ปี 2568', 'โครงสร้างพื้นฐาน', 'กอง IT', 'วราพร วัฒนา', '2025-05-20', '50240', 'ค่าเช่าและบริการ', 480_000, 60, 60, 'approved', [ex('INV-0210', '2025-06-05', 'ค่าบริการ Cloud ไตรมาส 1', 120_000), ex('INV-0288', '2025-09-05', 'ค่าบริการ Cloud ไตรมาส 2', 120_000)]),
]

/** sample curves for the overview charts (cumulative % of plan, Oct → Sep) */
export const monthsTh = ['ต.ค.', 'พ.ย.', 'ธ.ค.', 'ม.ค.', 'ก.พ.', 'มี.ค.', 'เม.ย.', 'พ.ค.', 'มิ.ย.', 'ก.ค.', 'ส.ค.', 'ก.ย.']
export const curvePlan = [6, 14, 23, 31, 40, 49, 58, 67, 76, 84, 92, 100]
export const curveActual = [6, 13, 21, 29, 38, 47, 55, 63, 71, 78]
export const burn = [
  { plan: 4, used: 3 }, { plan: 9, used: 7 }, { plan: 15, used: 12 }, { plan: 22, used: 18 }, { plan: 30, used: 26 }, { plan: 38, used: 33 },
  { plan: 47, used: 42 }, { plan: 57, used: 52 }, { plan: 68, used: 62 }, { plan: 79, used: 72 }, { plan: 90, used: 83 }, { plan: 100, used: 92 },
]

// ---------------------------------------------------------------------------------------------
// 2.1.3.4 – 2.1.3.6 — project proposal (ข้อเสนอโครงการ) and its review
// ---------------------------------------------------------------------------------------------
export const projectKinds = ['โครงการจัดจ้าง', 'โครงการจัดอบรม', 'โครงการจัดซื้อ'] as const
export type PKind = (typeof projectKinds)[number]
export type ProposalStatus = 'draft' | 'submitted' | 'approved' | 'revise' | 'rejected'
export const proposalStatus: Record<ProposalStatus, { label: string; tone: string }> = {
  draft: { label: 'ร่าง', tone: 'bg-[#e1ebff] text-[#2b4fbf]' },
  submitted: { label: 'รอพิจารณา', tone: 'bg-[#fff1d6] text-[#a8650b]' },
  approved: { label: 'อนุมัติโครงการ', tone: 'bg-[#dff5e8] text-[#0f8a63]' },
  revise: { label: 'แก้ไขโครงการ', tone: 'bg-[#fde8cf] text-[#b8560b]' },
  rejected: { label: 'ไม่อนุมัติ', tone: 'bg-[#fde2e2] text-[#c0262d]' },
}
export type Decision = 'approve' | 'revise' | 'reject'
export const decisionLabel: Record<Decision, string> = { approve: 'อนุมัติโครงการ', revise: 'แก้ไขโครงการ', reject: 'ไม่อนุมัติ' }
export const suggestions = ['เห็นสมควรได้รับการอนุมัติ', 'ไม่เหมาะสมกับการใช้งาน']
export type PEvent = { at: string; by: string; action: string; note?: string }
export type Proposal = {
  id: number
  planId: number // the approved annual plan from ERP STRATEGIC (2.1.2.4) this project belongs to
  creator: string
  office: string
  name: string
  objective: string
  background: string
  kind: PKind
  status: ProposalStatus
  comment: string // 2.1.3.5 draft comment
  pageComments: [string, string, string] // 2.1.3.6 per-page comments
  result?: { decision: Decision; reason: string; by: string; at: string }
  history: PEvent[]
  createdAt: string
}
const pe = (at: string, by: string, action: string, note?: string): PEvent => ({ at, by, action, note })
export const seedProposals = (): Proposal[] => [
  {
    id: 1, planId: 2, creator: 'ปริยดา เจริญวัฒนกุล', office: 'สำนักเทคโนโลยีสารสนเทศ', name: 'โครงการพัฒนาระบบรายงานผลการดำเนินงานรายไตรมาส',
    objective: 'พัฒนาระบบรายงานผลการดำเนินงานเพื่อให้ทุกสำนักรายงานผลรายไตรมาสผ่านระบบกลางและเปรียบเทียบกับตัวชี้วัดอัตโนมัติ',
    background: 'ปัจจุบันแต่ละสำนักจัดทำรายงานแยกกันด้วยเอกสาร ทำให้รวบรวมข้อมูลล่าช้าและไม่สามารถติดตามความคืบหน้าแบบทันเวลาได้', kind: 'โครงการจัดจ้าง', status: 'approved', comment: 'ข้อเสนอสอดคล้องกับแผนยุทธศาสตร์องค์กร',
    pageComments: ['ข้อมูลแผนงานถูกต้อง', 'วัตถุประสงค์ชัดเจน', 'วงเงินอยู่ในงบที่ได้รับอนุมัติ'], result: { decision: 'approve', reason: 'เห็นสมควรได้รับการอนุมัติ', by: 'สมหญิง ศรีสุข', at: '2025-10-08 10:20' },
    history: [pe('2025-10-02 09:30', 'ปริยดา เจริญวัฒนกุล', 'ส่งโครงการเพื่อพิจารณา'), pe('2025-10-08 10:20', 'สมหญิง ศรีสุข', 'อนุมัติโครงการ', 'เห็นสมควรได้รับการอนุมัติ'), pe('2025-10-08 10:20', 'ระบบ', 'แจ้งเตือนผลการพิจารณา', 'ถึง ปริยดา เจริญวัฒนกุล')], createdAt: '2025-10-02 09:10',
  },
  {
    id: 2, planId: 3, creator: 'ธนพล แสงทอง', office: 'สำนักผู้อำนวยการ', name: 'โครงการประชุมคณะกรรมการสถาบันแบบอิเล็กทรอนิกส์',
    objective: 'จัดหาอุปกรณ์และบริการประชุมออนไลน์เพื่อรองรับการประชุมคณะกรรมการและการประเมินความเสี่ยงรายไตรมาส',
    background: 'การประชุมที่ผ่านมาต้องเดินทางและเตรียมเอกสารจำนวนมาก ต้องการลดต้นทุนและเพิ่มความรวดเร็วในการประชุม', kind: 'โครงการจัดซื้อ', status: 'submitted', comment: '', pageComments: ['', '', ''],
    history: [pe('2025-11-03 14:05', 'ธนพล แสงทอง', 'ส่งโครงการเพื่อพิจารณา')], createdAt: '2025-11-03 13:40',
  },
  {
    id: 3, planId: 4, creator: 'วรรณา ใจสว่าง', office: 'สำนักบริหารงานกลาง', name: 'โครงการจัดอบรมการใช้งานระบบสารบรรณอิเล็กทรอนิกส์',
    objective: 'อบรมเจ้าหน้าที่ทุกสำนักให้ใช้งานระบบสารบรรณอิเล็กทรอนิกส์ได้อย่างถูกต้อง ลดเอกสารกระดาษและเวลาในการส่งต่อเรื่อง',
    background: 'ระบบสารบรรณใหม่จะเริ่มใช้งานในปีงบประมาณ 2568 เจ้าหน้าที่ต้องเข้าใจขั้นตอนเซ็นผ่าน ลงนาม และตีกลับเอกสาร', kind: 'โครงการจัดอบรม', status: 'submitted', comment: '', pageComments: ['', '', ''],
    history: [pe('2025-11-04 11:15', 'วรรณา ใจสว่าง', 'ส่งโครงการเพื่อพิจารณา')], createdAt: '2025-11-04 10:50',
  },
  {
    id: 4, planId: 2, creator: 'ปริยดา เจริญวัฒนกุล', office: 'สำนักเทคโนโลยีสารสนเทศ', name: 'โครงการปรับปรุงเครือข่ายภายในสำนักงาน',
    objective: 'เปลี่ยนอุปกรณ์เครือข่ายที่เสื่อมสภาพเพื่อลดความเสี่ยงระบบเครือข่ายล่มระหว่างให้บริการ',
    background: 'ความเสี่ยงระบบเครือข่ายล่มอยู่ในระดับสูงตามรายงานความเสี่ยงไตรมาสล่าสุด', kind: 'โครงการจัดซื้อ', status: 'revise', comment: 'ควรระบุจำนวนอุปกรณ์',
    pageComments: ['', 'กรุณาระบุจำนวนและสเปกอุปกรณ์ให้ชัดเจน', 'แนบใบเสนอราคาอ้างอิงอย่างน้อย 2 ราย'], result: { decision: 'revise', reason: 'ปรับรายละเอียดวัตถุประสงค์และแนบใบเสนอราคาแล้วส่งใหม่', by: 'สมหญิง ศรีสุข', at: '2025-11-05 16:40' },
    history: [pe('2025-11-01 09:00', 'ปริยดา เจริญวัฒนกุล', 'ส่งโครงการเพื่อพิจารณา'), pe('2025-11-05 16:40', 'สมหญิง ศรีสุข', 'แก้ไขโครงการ', 'ปรับรายละเอียดวัตถุประสงค์และแนบใบเสนอราคาแล้วส่งใหม่'), pe('2025-11-05 16:40', 'ระบบ', 'แจ้งเตือนผลการพิจารณา', 'ถึง ปริยดา เจริญวัฒนกุล')], createdAt: '2025-10-31 15:00',
  },
]
