// E-Meeting model (Figma OSS/E-Meeting: OSS-Meeting 130:11662, Create 131:12824, Detail1 194:10146,
// Detail-2 198:10087, Document-Admin 194:14380, expense claim 517:27056 / Improvement/Record 517:18355)

export type MeetingStatus = 'scheduled' | 'completed' | 'canceled'
/** The signed-in user's answer to the invitation */
export type Rsvp = 'requested' | 'accepted' | 'rejected'
export type AttendeeStatus = 'registered' | 'online' | 'absent' | 'pending'
export type VoteChoice = 'approve' | 'reject' | 'abstain'

export type Agenda = {
  id: string
  title: string
  detail: string
  owners: string[]
  files: string[]
  subItems: string[]
  /** "ลงมติโหวต" toggle */
  vote: boolean
  votes: Record<VoteChoice, number>
  myVote?: VoteChoice
  comments: string[]
}

export type Attendee = { id: string; first: string; last: string; position: string; status: AttendeeStatus }

export type Recurrence = { every: number; unit: 'day' | 'week' | 'month'; days: number[]; until: string }

export type Expense = {
  id: string
  date: string
  kind: string
  item: string
  vehicle: string
  amount: string
  units: string
  files: string[]
}

export type Meeting = {
  id: number
  type: string
  title: string
  org: string
  date: string
  start: string
  end: string
  allDay: boolean
  recurrence?: Recurrence
  online: boolean
  registration: boolean
  hasLocation: boolean
  place: string
  province: string
  district: string
  subdistrict: string
  note: string
  documents: string[]
  agendas: Agenda[]
  witness: string
  payer: string
  attendees: Attendee[]
  status: MeetingStatus
  rsvp: Rsvp
  /** saved with "บันทึกแบบร่าง", not sent yet */
  draft: boolean
  summary: string
  /** transcript lines from the agenda page recorder */
  transcript: string[]
  signedIn: boolean
  /** e-signature drawn in "ลงชื่อเข้าประชุม" (PNG data URL) and when */
  signature?: string
  signedAt?: string
  /** ตั้งเบิกค่าใช้จ่าย (claim) */
  expenses: Expense[]
  /** บันทึกหลักฐานค่าใช้จ่าย (actual spending + receipts) */
  evidence?: Expense[]
  expenseStatus: 'none' | 'draft' | 'submitted' | 'recorded'
  expenseSubmittedAt?: string
  /** survey used as the registration form ("สร้างฟอร์มลงทะเบียน") */
  registrationSurveyId?: number
}

export const meetingTypes = ['ประชุมคณะกรรมการ', 'ประชุมคณะทำงาน', 'ประชุมใหญ่สามัญ', 'สัมมนา', 'อบรม']
export const orgs = ['สำนักทรัพยากรบุคคล', 'สำนักสินเชื่อ', 'สำนักเทคโนโลยีสารสนเทศ', 'สำนักงานภาคใต้', 'สำนักนโยบายและแผน']

/** People that can be invited (search in "กำหนดรายชื่อผู้เข้าร่วมประชุม") */
export const directory = (): Attendee[] => sampleAttendees().map((a) => ({ ...a, status: 'pending' as const }))

/** "เพิ่มรายชื่อแบบกลุ่ม" presets → directory ids */
export const attendeeGroups: { name: string; ids: string[] }[] = [
  { name: 'คณะกรรมการสถาบัน', ids: ['p1', 'p2', 'p8', 'p9'] },
  { name: 'คณะทำงานพัฒนาระบบสารสนเทศ', ids: ['p4', 'p5', 'p6', 'p7'] },
  { name: 'ผู้แทนสำนักงานภาค', ids: ['p3', 'p10', 'p11'] },
]

/** จังหวัด → เขต/อำเภอ → แขวง/ตำบล (demo subset) */
export const locations: Record<string, Record<string, string[]>> = {
  กรุงเทพมหานคร: { บางกะปิ: ['คลองจั่น', 'หัวหมาก'], จตุจักร: ['ลาดยาว', 'จอมพล', 'จันทรเกษม'], ปทุมวัน: ['ลุมพินี', 'วังใหม่'] },
  เชียงใหม่: { เมืองเชียงใหม่: ['ศรีภูมิ', 'ช้างเผือก', 'สุเทพ'], แม่แจ่ม: ['ช่างเคิ่ง', 'ท่าผา'] },
  ขอนแก่น: { เมืองขอนแก่น: ['ในเมือง', 'ศิลา'], ชุมแพ: ['ชุมแพ', 'หนองไผ่'] },
  สงขลา: { หาดใหญ่: ['หาดใหญ่', 'คอหงส์'], เมืองสงขลา: ['บ่อยาง', 'เขารูปช้าง'] },
}

export const expenseKinds = ['เบิกค่าพาหนะ', 'เบิกค่าเดินทาง', 'เบิกค่าอาหาร', 'เบิกค่าที่พัก', 'เบิกค่าเบี้ยเลี้ยง']
export const vehicles = ['รถยนต์', 'รถจักรยานยนต์', 'รถโดยสารสาธารณะ', 'เครื่องบิน']

export const statusLabel: Record<MeetingStatus, string> = { scheduled: 'Scheduled', completed: 'Completed', canceled: 'Canceled' }
export const rsvpLabel: Record<Rsvp, string> = { requested: 'Requested', accepted: 'Accepted', rejected: 'Rejected' }
export const voteLabel: Record<VoteChoice, string> = { approve: 'เห็นชอบ', reject: 'ไม่เห็นชอบ', abstain: 'งดออกเสียง' }

const owners = ['ญาณิศา คำเอี่ยม', 'ชมพู ช้างทอง', 'ญาดา อุดมเลภ', 'นาวณี พินิจนันท์']

export const sampleAgendas = (): Agenda[] => [
  {
    id: 'a1',
    title: 'เรื่องที่แจ้งให้ที่ประชุมทราบ',
    detail:
      'ประธานแจ้งให้ที่ประชุมทราบเกี่ยวกับนโยบายการดำเนินงานของหน่วยงานในไตรมาสถัดไป ความคืบหน้าการปรับปรุงอาคารและระบบสารสนเทศ การเตรียมจัดอบรมพัฒนาบุคลากร รวมถึงกำหนดการกิจกรรมสำคัญและวันหยุดราชการเพิ่มเติม ทั้งนี้ ที่ประชุมรับทราบตามที่แจ้ง',
    owners,
    files: ['ไฟล์เอกสารประกอบวาระที่ 1'],
    subItems: ['เรื่องนโยบายการดำเนินงาน', 'เรื่องกำหนดการปี 2569'],
    vote: true,
    votes: { approve: 7, reject: 3, abstain: 1 },
    comments: ['เห็นด้วยกับนโยบาย ขอให้แจ้งกำหนดการอบรมล่วงหน้า 2 สัปดาห์', 'ขอให้เพิ่มรายละเอียดงบประมาณการปรับปรุงอาคาร', 'ควรจัดอบรมแบบออนไลน์ควบคู่ด้วย'],
  },
  {
    id: 'a2',
    title: 'เรื่องรับรองรายงานการประชุมครั้งที่ผ่านมา',
    detail:
      'ประธานแจ้งให้ที่ประชุมทราบว่า ได้จัดส่งรายงานการประชุมครั้งที่ผ่านมาให้สมาชิกทุกท่านพิจารณาก่อนการประชุมในครั้งนี้แล้ว เพื่อความถูกต้องและเป็นทางการ จึงขอให้ที่ประชุมพิจารณารับรองรายงานการประชุมดังกล่าว หากไม่มีข้อแก้ไขเพิ่มเติม ถือว่าที่ประชุมมีมติรับรองรายงานการประชุมครั้งที่ผ่านมาเป็นเอกฉันท์',
    owners,
    files: ['ไฟล์เอกสารประกอบวาระที่ 2'],
    subItems: ['เรื่องพิจารณารับรองรายงาน'],
    vote: false,
    votes: { approve: 0, reject: 0, abstain: 0 },
    comments: ['รับรองรายงานโดยไม่มีแก้ไข'],
  },
]

const people: [string, string, string, AttendeeStatus][] = [
  ['ธนวรรณ', 'เลิศพานิชกุล', 'ประธาน', 'registered'],
  ['มงคล', 'รัตนคำ', 'ผู้นำขบวนองค์กรชุมชน', 'registered'],
  ['พร้อมพงศ์', 'อาชาไขย', 'ผู้เข้าร่วม', 'absent'],
  ['ญาณิศา', 'คำเอี่ยม', 'ผู้เข้าร่วม', 'online'],
  ['ชมพู', 'ช้างทอง', 'เลขานุการ', 'registered'],
  ['ญาดา', 'อุดมเลภ', 'ผู้เข้าร่วม', 'online'],
  ['นาวณี', 'พินิจนันท์', 'ผู้เข้าร่วม', 'registered'],
  ['สมศักดิ์', 'ใจดี', 'กรรมการ', 'pending'],
  ['วิภาวรรณ', 'ศรีสุข', 'กรรมการ', 'registered'],
  ['ปิยะพงษ์', 'บุญมา', 'ผู้เข้าร่วม', 'absent'],
  ['กมลชนก', 'แก้วประเสริฐ', 'ผู้เข้าร่วม', 'registered'],
]
export const sampleAttendees = (): Attendee[] => people.map(([first, last, position, status], i) => ({ id: `p${i + 1}`, first, last, position, status }))

export const sampleSummary =
  'สรุปผลการประชุมในวันนี้ โดยทีมได้หารือความคืบหน้าโครงการพัฒนาระบบสมาชิก ซึ่งปัจจุบันอยู่ระหว่างการออกแบบ UX/UI และเตรียมทดสอบรอบแรกในสัปดาห์หน้า โดยกำหนดเป้าหมายให้เปิดใช้งานภายในสิ้นไตรมาสนี้ ทั้งนี้ ทีมการตลาดจะจัดทำแผนสื่อสารเพื่อประชาสัมพันธ์ฟีเจอร์ใหม่ภายในต้นเดือนหน้า ส่วนทีมเทคนิคจะประเมินทรัพยากรเพิ่มเติมและจัดทำ timeline รายละเอียดส่งภายในวันศุกร์ หากมีการเปลี่ยนแปลงจะอัปเดตให้ทราบอีกครั้ง'

const pad = (n: number) => String(n).padStart(2, '0')
export const toIso = (d: Date) => `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`
/** Monday of the week that contains `d` */
export const mondayOf = (d: Date) => {
  const m = new Date(d.getFullYear(), d.getMonth(), d.getDate())
  m.setDate(m.getDate() - ((m.getDay() + 6) % 7))
  return m
}
export const addDays = (d: Date, n: number) => new Date(d.getFullYear(), d.getMonth(), d.getDate() + n)

export function blankMeeting(id: number): Meeting {
  return {
    id,
    type: meetingTypes[0],
    title: '',
    org: '',
    date: toIso(new Date()),
    start: '09:00',
    end: '10:00',
    allDay: false,
    online: true,
    registration: true,
    hasLocation: true,
    place: '',
    province: '',
    district: '',
    subdistrict: '',
    note: '',
    documents: [],
    agendas: [],
    witness: '',
    payer: '',
    attendees: [],
    status: 'scheduled',
    rsvp: 'accepted',
    draft: true,
    summary: '',
    transcript: [],
    signedIn: false,
    expenses: [],
    expenseStatus: 'none',
  }
}

/** Demo meetings placed in the current week, matching the Figma calendar */
export function seedMeetings(today = new Date()): Meeting[] {
  const mon = mondayOf(today)
  const day = (n: number) => toIso(addDays(mon, n))
  const base = (id: number, o: Partial<Meeting>): Meeting => ({
    ...blankMeeting(id),
    draft: false,
    place: 'สถาบันพัฒนาองค์กรชุมชน (องค์การมหาชน) แขวงคลองจั่น เขตบางกะปิ',
    province: 'กรุงเทพมหานคร',
    district: 'บางกะปิ',
    subdistrict: 'คลองจั่น',
    note: 'ชั้น 3 ห้อง 304',
    agendas: sampleAgendas(),
    attendees: sampleAttendees(),
    witness: 'ชมพู ช้างทอง',
    payer: 'นาวณี พินิจนันท์',
    ...o,
  })
  return [
    base(1, { org: 'สำนักทรัพยากรบุคคล', title: 'ประชุมการดำเนินงานภายใน', date: day(0), start: '09:00', end: '10:00', status: 'completed', rsvp: 'accepted', signedIn: true, summary: sampleSummary }),
    base(2, { org: 'สำนักสินเชื่อ', title: 'ผลสำรวจการประเมินกองทุน', date: day(1), start: '10:00', end: '11:00', status: 'canceled', rsvp: 'rejected' }),
    base(3, { org: 'สำนักเทคโนโลยีสารสนเทศ', title: 'ประชุมตรวจรับงานที่ปรึกษา งวดที่ 3', date: day(2), start: '09:00', end: '10:00', status: 'scheduled', rsvp: 'accepted' }),
    base(4, { org: 'สำนักงานภาคใต้', title: 'สัมมนาโครงสร้างขบวนองค์กรชุมชน', type: 'สัมมนา', date: day(2), start: '10:30', end: '11:30', status: 'scheduled', rsvp: 'requested' }),
  ]
}

/** Does meeting `m` take place on `iso` (its own date, or a repeat of it)? */
export function occursOn(m: Meeting, iso: string) {
  if (m.date === iso) return true
  const r = m.recurrence
  if (!r || iso < m.date || (r.until && iso > r.until)) return false
  const start = new Date(`${m.date}T00:00:00`)
  const day = new Date(`${iso}T00:00:00`)
  const days = Math.round((day.getTime() - start.getTime()) / 864e5)
  if (r.unit === 'day') return days % r.every === 0
  if (r.unit === 'month') {
    const months = (day.getFullYear() - start.getFullYear()) * 12 + day.getMonth() - start.getMonth()
    return day.getDate() === start.getDate() && months % r.every === 0
  }
  const weeks = Math.floor((days + ((start.getDay() + 6) % 7)) / 7)
  return weeks % r.every === 0 && (r.days.length ? r.days : [(start.getDay() + 6) % 7]).includes((day.getDay() + 6) % 7)
}
