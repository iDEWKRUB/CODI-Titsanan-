import { mapProvinces } from './thaiMap'

export type CourseStatus = 'draft' | 'open' | 'complete'
export const courseStatusLabel: Record<CourseStatus, string> = { draft: 'ร่าง', open: 'Open', complete: 'Complete' }

/** Pre/Post-test result of one attendee */
export type Score = 'pass' | 'fail' | 'wait'
export const scoreLabel: Record<Score, string> = { pass: 'ผ่าน', fail: 'ไม่ผ่าน', wait: 'รอการประเมิน' }

export type Attendee = {
  id: number
  firstName: string
  lastName: string
  province: string
  community: string
  /** identity confirmed on sign-in */
  verified: boolean
  pre: Score
  post: Score
  /** certificate issued */
  certified: boolean
  signedOut?: boolean
}

export type Course = {
  id: number
  status: CourseStatus
  /** ประเภทหลักสูตร */
  courseType: string
  name: string
  detail: string
  fiscalYear: string
  quarter: string
  budget: string
  startDate: string
  endDate: string
  target: string
  /** ส่วนงานที่จัด */
  org: string
  place: string
  instructor: string
  attendees: Attendee[]
  /** plan tab 2: chosen schedule template + editable rows */
  scheduleTemplate: number
  schedule: ScheduleRow[]
  /** plan tab 3 */
  budgetLines: BudgetLine[]
  budgetCode: string
  accountNo: string
  /** plan tab 4: ≥ 2 approval levels (TOR 4.7 group 2) */
  approval: { state: 'none' | 'pending' | 'approved'; steps: ApprovalStep[] }
  /** record: attachments + expenses */
  files: FileItem[]
  expenses: ExpenseLine[]
}

export type ScheduleRow = { id: string; time: string; activity: string }
export type BudgetLine = { id: string; item: string; amount: string }
export type ApprovalStep = { role: string; name: string; doneAt?: string }
export type FileItem = { id: string; name: string; kind: 'doc' | 'image' }
export type ExpenseLine = { id: string; item: string; amount: string; files: string[] }

export const scheduleTemplates: { name: string; hint: string; rows: [string, string][] }[] = [
  { name: 'อบรม 1 วัน', hint: 'ลงทะเบียน · บรรยาย · Workshop · สรุปผล', rows: [['08:30–09:00', 'ลงทะเบียน'], ['09:00–10:30', 'บรรยายหลักการและแนวคิด'], ['10:45–12:00', 'อภิปรายกลุ่ม'], ['13:00–15:30', 'Workshop ปฏิบัติการ'], ['15:30–16:00', 'สรุปและประเมินผล (Post-test)']] },
  { name: 'อบรม 2 วัน', hint: 'วันที่ 1 ทฤษฎี · วันที่ 2 ฝึกปฏิบัติ', rows: [['วันที่ 1 08:30–09:00', 'ลงทะเบียน + Pre-test'], ['วันที่ 1 09:00–16:00', 'บรรยายและกรณีศึกษา'], ['วันที่ 2 09:00–15:00', 'ฝึกปฏิบัติในพื้นที่'], ['วันที่ 2 15:00–16:00', 'สรุปและประเมินผล (Post-test)']] },
  { name: 'เชิงปฏิบัติการ', hint: 'เน้นกลุ่มย่อยและลงมือทำ', rows: [['09:00–09:30', 'เปิดงานและแนะนำ'], ['09:30–12:00', 'กลุ่มย่อย: ทำแผนชุมชน'], ['13:00–15:00', 'นำเสนอและให้ข้อเสนอแนะ'], ['15:00–16:00', 'สรุปบทเรียน']] },
  { name: 'ออนไลน์', hint: 'อบรมผ่านระบบประชุมทางไกล', rows: [['09:00–09:15', 'เข้าห้องอบรมและตรวจสอบระบบ'], ['09:15–11:30', 'บรรยายออนไลน์'], ['13:00–14:30', 'ถาม-ตอบ และกิจกรรมกลุ่มย่อย'], ['14:30–15:00', 'ทำแบบประเมินออนไลน์']] },
]
export const defaultApproval = (): Course['approval'] => ({ state: 'none', steps: [{ role: 'หัวหน้าสำนัก', name: 'ผู้อำนวยการสำนักพัฒนาผู้นำและนวัตกรรมการพัฒนาชุมชน' }, { role: 'ผู้อำนวยการ พอช.', name: 'ผู้อำนวยการสถาบันพัฒนาองค์กรชุมชน' }] })

export const thaiLong = (iso: string) => (iso ? new Date(iso + 'T00:00:00').toLocaleDateString('th-TH', { day: 'numeric', month: 'long', year: 'numeric' }) : '–')

// ---- Certificates ---------------------------------------------------------------------------
export type Certificate = {
  id: number
  courseId?: number
  name: string
  template: number
  year: string
  days: string
  issueDate: string
  signerFirst: string
  signerLast: string
  status: 'published' | 'draft'
  createdAt: string
}
export type CertLog = { id: number; date: string; action: string; by: string }
export const certTemplates = ['Template_A1', 'Template_B1', 'Template_C1', 'Template_D1', 'Template_E1', 'Template_H1']
export const seedCerts = (): Certificate[] =>
  [
    ['ขับเคลื่อนนวัตกรรมชุมชน', 0, '2025-09-18'],
    ['พัฒนาศักยภาพเครือข่าย', 4, '2025-08-11'],
    ['บริหารองค์กรชุมชน', 3, '2025-08-06'],
    ['ทักษะดิจิทัลผู้นำ', 5, '2025-07-25'],
    ['สร้างสื่อออนไลน์ชุมชน', 4, '2025-07-24'],
  ].map(([name, template, createdAt], i) => ({ id: i + 1, name: name as string, template: template as number, year: '2568', days: '1', issueDate: createdAt as string, signerFirst: 'ดวงกมล', signerLast: 'พรหมรักษา', status: 'published' as const, createdAt: createdAt as string }))
export const seedCertLog = (): CertLog[] => [
  { id: 1, date: '25-11-25', action: 'สร้างใบรับรอง', by: 'อริสรา คงวัฒนะ' },
  { id: 2, date: '25-11-25', action: 'ออกใบรับรอง หลักสูตรขับเคลื่อนนวัตกรรมชุมชน', by: 'ดวงกมล พรหมรักษา' },
  { id: 3, date: '25-11-25', action: 'ออกใบรับรอง หลักสูตรขับเคลื่อนนวัตกรรมชุมชน', by: 'ดวงกมล พรหมรักษา' },
]

export const courseTypes = ['การใช้เทคโนโลยีดิจิทัล', 'การพัฒนาชุมชน', 'การบริหารองค์กรชุมชน', 'การพัฒนาที่ดินและที่อยู่อาศัย']
export const quarters = ['ไตรมาสที่ 1', 'ไตรมาสที่ 2', 'ไตรมาสที่ 3', 'ไตรมาสที่ 4']
export const fiscalYears = ['2567', '2568', '2569']
export const targets = ['ผู้นำองค์กรชุมชน', 'คณะกรรมการสภาองค์กรชุมชน', 'เจ้าหน้าที่ พอช.', 'เยาวชนและแกนนำรุ่นใหม่']
export const orgs = ['สำนักพัฒนาผู้นำและนวัตกรรมการพัฒนาชุมชน', 'สำนักพัฒนาศักยภาพองค์กรชุมชน', 'สำนักงานภาค']

export const blankCourse = (id: number): Course => ({
  id,
  status: 'draft',
  courseType: '',
  name: 'ชื่อหลักสูตร...',
  detail: '',
  fiscalYear: '2568',
  quarter: quarters[0],
  budget: '',
  startDate: '',
  endDate: '',
  target: '',
  org: orgs[0],
  place: '',
  instructor: '',
  attendees: [],
  scheduleTemplate: 0,
  schedule: [],
  budgetLines: [],
  budgetCode: '',
  accountNo: '',
  approval: defaultApproval(),
  files: [],
  expenses: [],
})

const A = (id: number, firstName: string, lastName: string, province: string, community: string, verified: boolean, pre: Score, post: Score, certified = false): Attendee => ({
  id, firstName, lastName, province, community, verified, pre, post, certified,
})

export function seedCourses(): Course[] {
  const org = orgs[0]
  const list: (Partial<Course> & { id: number })[] = [
    {
      id: 1, status: 'open', courseType: 'การพัฒนาที่ดินและที่อยู่อาศัย', name: 'การพัฒนาภาวะผู้นำชุมชน จ.เชียงใหม่', detail: '', fiscalYear: '2568', quarter: 'ไตรมาสที่ 1',
      budget: '250000', startDate: '2025-11-29', endDate: '2025-11-29', target: targets[0], org, place: 'มหาวิทยาลัยเชียงใหม่', instructor: 'อาจารย์ภคพงศ์ ชัยภูมิ',
      attendees: [
        A(1, 'ธนวรรณ', 'เลิศพาณิชกุล', 'เชียงใหม่', 'ต.ศรีภูมิ', true, 'pass', 'wait'),
        A(2, 'พร้อมพงศ์', 'อาชาไชย', 'เชียงใหม่', 'ต.หนองป่าครั่ง', true, 'wait', 'wait'),
        A(3, 'พิชญากา', 'ศรีคราวงษ์', 'เชียงใหม่', 'ต.สุเทพ', false, 'fail', 'wait'),
        A(4, 'ญาณิศา', 'โชติพงษา', 'เชียงใหม่', 'ต.สุเทพ', true, 'pass', 'pass', true),
        A(5, 'วิราย', 'พัฒนมงคล', 'เชียงใหม่', 'ต.ช้างเผือก', true, 'pass', 'pass', true),
      ],
    },
    {
      id: 2, status: 'complete', courseType: 'การใช้เทคโนโลยีดิจิทัล', name: 'การใช้เทคโนโลยีดิจิทัลเพื่อการสื่อสารในชุมชน', detail: '', fiscalYear: '2568', quarter: 'ไตรมาสที่ 4',
      budget: '180000', startDate: '2025-09-13', endDate: '2025-09-13', target: targets[0], org, place: 'ศูนย์ประชุมมหาวิทยาลัยขอนแก่น', instructor: 'อาจารย์กฤษณะ ประสานชัย',
      attendees: [
        A(1, 'กฤติน', 'วงศ์สุวรรณ', 'ขอนแก่น', 'ต.ในเมือง', true, 'pass', 'pass', true),
        A(2, 'พิมพ์พนก', 'ศรีสวัสดิ์', 'ขอนแก่น', 'ต.ศิลา', true, 'pass', 'pass', true),
        A(3, 'ธนดล', 'เกษมพงศ์', 'ขอนแก่น', 'ต.บ้านทุ่ม', true, 'fail', 'pass', true),
      ],
    },
    {
      id: 3, status: 'complete', courseType: 'การพัฒนาชุมชน', name: 'การบริหารจัดการโครงการพัฒนาชุมชน', detail: '', fiscalYear: '2568', quarter: 'ไตรมาสที่ 4',
      budget: '210000', startDate: '2025-08-24', endDate: '2025-08-24', target: targets[0], org, place: 'มหาวิทยาลัยบูรพา', instructor: 'อาจารย์ชวัลลักษณ์ พิพัฒนกุล',
      attendees: [
        A(1, 'ชวัลลักษณ์', 'พิพัฒนกุล', 'ชลบุรี', 'ต.แสนสุข', true, 'pass', 'pass', true),
        A(2, 'ปณิธาน', 'ไอติพงษา', 'ชลบุรี', 'ต.บางแสน', true, 'pass', 'fail'),
        A(3, 'ณัฐฐานต์', 'รุ่งเรืองกิจ', 'ระยอง', 'ต.ทับมา', true, 'pass', 'pass', true),
      ],
    },
  ]
  return list.map((c) => {
    const full = { ...blankCourse(c.id), ...c }
    // seeds that are already running were approved
    if (full.status !== 'draft') full.approval = { state: 'approved', steps: full.approval.steps.map((s) => ({ ...s, doneAt: c.startDate })) }
    full.schedule = scheduleTemplates[0].rows.map(([time, activity], i) => ({ id: 's' + c.id + i, time, activity }))
    return full
  })
}

// ---- Province statistics (dashboard map) ----------------------------------------------------
// Figma totals are the baseline from the legacy system; people recorded in this app are added on top.
export const baselineTotals = { trained: 42025, notAttended: 321, thisYear: 822, notPassed: 129, courses: 7749, passedLeaders: 2681 }

export type Stats = { trained: number; notAttended: number; thisYear: number; notPassed: number }
export const regions = ['ภาคเหนือ', 'ภาคตะวันออกเฉียงเหนือ', 'ภาคกลาง', 'ภาคตะวันออก', 'ภาคตะวันตก', 'ภาคใต้']

function hash(s: string) {
  let h = 7
  for (const c of s) h = (h * 31 + c.charCodeAt(0)) % 9973
  return h
}
/** Split `total` over provinces by weight (largest remainder, so the sum is exact) */
function apportion(total: number, weights: number[]) {
  const sum = weights.reduce((a, b) => a + b, 0)
  const raw = weights.map((w) => (w / sum) * total)
  const out = raw.map(Math.floor)
  let left = total - out.reduce((a, b) => a + b, 0)
  raw
    .map((r, i) => [r - Math.floor(r), i] as const)
    .sort((a, b) => b[0] - a[0])
    .forEach(([, i]) => left-- > 0 && out[i]++)
  return out
}
const weights = mapProvinces.map((p) => 40 + (hash(p.name) % 160))
const base = {
  trained: apportion(baselineTotals.trained, weights),
  notAttended: apportion(baselineTotals.notAttended, weights),
  thisYear: apportion(baselineTotals.thisYear, weights),
  notPassed: apportion(baselineTotals.notPassed, weights),
}

const zero = (): Stats => ({ trained: 0, notAttended: 0, thisYear: 0, notPassed: 0 })
function contribution(courses: Course[]): Map<string, Stats> {
  const m = new Map<string, Stats>()
  const year = String(new Date().getFullYear())
  for (const c of courses) {
    if (c.status === 'draft') continue
    for (const a of c.attendees) {
      const s = m.get(a.province) ?? zero()
      m.set(a.province, s)
      if (a.post === 'pass') s.trained++
      if (a.post === 'fail') s.notPassed++
      if (a.post !== 'pass' && a.pre === 'wait') s.notAttended++
      if (c.startDate.startsWith(year)) s.thisYear++
    }
  }
  return m
}
const seedContribution = contribution(seedCourses())

/** Legacy baseline per province + what was recorded here beyond the seed data (so the defaults match the Figma totals) */
export function provinceStats(courses: Course[]): Map<string, Stats> {
  const now = contribution(courses)
  const m = new Map<string, Stats>()
  mapProvinces.forEach((p, i) => {
    const n = now.get(p.name) ?? zero()
    const s0 = seedContribution.get(p.name) ?? zero()
    const up = (b: number, k: keyof Stats) => Math.max(0, b + n[k] - s0[k])
    m.set(p.name, { trained: up(base.trained[i], 'trained'), notAttended: up(base.notAttended[i], 'notAttended'), thisYear: up(base.thisYear[i], 'thisYear'), notPassed: up(base.notPassed[i], 'notPassed') })
  })
  return m
}
export const seedCourseCount = seedCourses().length
export const countPassers = (courses: Course[]) => courses.reduce((n, c) => n + (c.status === 'draft' ? 0 : c.attendees.filter((a) => a.post === 'pass').length), 0)
export const sumStats = (list: Stats[]): Stats =>
  list.reduce((a, s) => ({ trained: a.trained + s.trained, notAttended: a.notAttended + s.notAttended, thisYear: a.thisYear + s.thisYear, notPassed: a.notPassed + s.notPassed }), { trained: 0, notAttended: 0, thisYear: 0, notPassed: 0 })

export const fmt = (n: number) => n.toLocaleString('en-US')
