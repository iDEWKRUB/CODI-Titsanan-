// Survey builder model (Figma OSS-Survey/Create-Question 114:7383 + Elements 123:7040)

export type QuestionType = 'short' | 'paragraph' | 'single' | 'multi' | 'scale' | 'rating' | 'title' | 'image'

export type SubQuestion = { id: string; title: string; type: 'short' | 'paragraph'; unit: string }
export type Option = { id: string; label: string; subQuestions: SubQuestion[]; goTo?: string }

export type Question = {
  id: string
  type: QuestionType
  title: string
  description: string
  required: boolean
  options: Option[]
  hasOther: boolean
  scaleMin: 0 | 1
  scaleMax: number
  minLabel: string
  maxLabel: string
  ratingMax: number
  ratingIcon: 'star' | 'heart'
  imageUrl?: string
  showNote: boolean
  note: string
  skipLogic: boolean
  shuffle: boolean
}

export type Section = {
  id: string
  title: string
  description: string
  questions: Question[]
  /** 'next' or a section id */
  after: string
}

export type GeneralField = 'name' | 'birthDate' | 'gender' | 'age' | 'phone' | 'citizenId' | 'address'
export const generalFieldLabel: Record<GeneralField, string> = {
  name: 'คำนำหน้า, ชื่อ-นามสกุล',
  birthDate: 'วันเดือนปีเกิด',
  gender: 'เพศ',
  age: 'อายุ',
  phone: 'เบอร์โทรศัพท์',
  citizenId: 'บัตรประชาชน',
  address: 'ที่อยู่ปัจจุบัน',
}

export type Theme = { logo?: string; backgroundImage?: string; background: string; color: string }
export const themeBackgrounds = ['#fff4f4', '#faf9d8', '#d7f4f8', '#e8f5ff', '#f3edf9', '#f2f3f4']
export const themeColors = ['#b35bfa', '#0085f9', '#79c6f3', '#13ad77', '#6fd46d', '#fbe224', '#fa905b', '#f42225', '#f66c9c']

export type Settings = {
  acceptResponses: boolean
  scheduled: boolean
  startDate: string
  startTime: string
  endDate: string
  endTime: string
  target: string
  customTargets: string[]
  channels: { email: boolean; sms: boolean; line: boolean; notification: boolean }
  access: 'public' | 'restricted'
  slug: string
}

export type SurveyDraft = {
  id: number
  type: string
  theme: Theme
  title: string
  description: string
  general: { enabled: boolean; title: string; description: string; fields: GeneralField[]; required: Partial<Record<GeneralField, boolean>> }
  sections: Section[]
  settings: Settings
}

/** Schedule must end after it starts */
export const scheduleInvalid = (s: Settings) => s.scheduled && `${s.endDate}T${s.endTime}` <= `${s.startDate}T${s.startTime}`

export const surveyTypes = ['แบบสำรวจข้อมูลครัวเรือน', 'ประเมินความพึงพอใจ', 'ประเมินความเข้มแข็ง', 'แบบสำรวจความคิดเห็น']
export const targetGroups = ['ทั้งหมด', 'สภาองค์กรชุมชน', 'องค์กรชุมชน', 'เจ้าหน้าที่ พอช.']

let seq = 0
export const uid = (p = 'id') => `${p}-${Date.now().toString(36)}-${(seq++).toString(36)}`

export function newQuestion(type: QuestionType = 'short'): Question {
  return {
    id: uid('q'),
    type,
    title: '',
    description: '',
    required: false,
    options: type === 'single' || type === 'multi' ? [{ id: uid('o'), label: 'คำตอบ', subQuestions: [] }] : [],
    hasOther: false,
    scaleMin: 1,
    scaleMax: 5,
    minLabel: '',
    maxLabel: '',
    ratingMax: 5,
    ratingIcon: 'star',
    showNote: false,
    note: '',
    skipLogic: false,
    shuffle: false,
  }
}

export const newSection = (): Section => ({ id: uid('s'), title: '', description: '', questions: [], after: 'next' })

const defaultDescription = `วิธีการบันทึกข้อมูล
1. เจ้าหน้าที่ระบุรหัสจังหวัด เลขที่ชุมชน ชื่อชุมชน ตำบล อำเภอ จังหวัด และรายละเอียดติดต่อ ก่อนส่งแบบสำรวจให้พื้นที่ดำเนินการสำรวจ
2. บันทึกข้อมูลครัวเรือนในแบบสำรวจฉบับเดียวกันให้ตรงกับปัญหาจริง
3. ผู้สำรวจต้องบันทึกข้อมูลทุกข้อ
นโยบายการใช้ประโยชน์ข้อมูล
การให้ข้อมูลเป็นความจริง ผู้ให้ข้อมูลยินยอมให้สถาบันพัฒนาองค์กรชุมชนฯ ทำการบันทึกและรวบรวมข้อมูลเพื่อนำไปวิเคราะห์ในการวางผังเมืองชุมชน ใช้เพื่อประโยชน์ในการพัฒนาชุมชนหรือเมืองเท่านั้น
หากมีข้อสงสัยหรือปัญหา ติดต่อ ชื่อ ........................................ โทรศัพท์ ........................................ ช่องทางติดต่ออื่น ๆ ........................................`

/** Starting content mirrors the Figma example so a new survey is not empty. */
export function newDraft(id: number): SurveyDraft {
  const debt = newQuestion('multi')
  debt.title = 'จำนวนหนี้สิน'
  debt.options = ['ที่อยู่อาศัย', 'คำตอบ'].map((label) => ({
    id: uid('o'),
    label,
    subQuestions: ['นอกระบบ', 'ในระบบ'].map((t) => ({ id: uid('sq'), title: t, type: 'short' as const, unit: 'บาท' })),
  }))
  const today = new Date()
  const iso = (d: Date) => d.toISOString().slice(0, 10)
  return {
    id,
    type: surveyTypes[0],
    theme: { background: themeBackgrounds[5], color: themeColors[2] },
    title: 'แบบสอบถามข้อมูลครัวเรือน (บ้าน) เพื่อการวางแผนเมืองและชนบท',
    description: defaultDescription,
    general: {
      enabled: true,
      title: '',
      description: '',
      fields: ['name', 'birthDate', 'gender', 'age', 'phone', 'citizenId', 'address'],
      required: { name: true, phone: true, citizenId: true, birthDate: true, address: true },
    },
    sections: [{ ...newSection(), questions: [debt] }],
    settings: {
      acceptResponses: true,
      scheduled: true,
      startDate: iso(today),
      startTime: '18:00',
      endDate: iso(new Date(today.getTime() + 15 * 864e5)),
      endTime: '18:00',
      target: targetGroups[0],
      customTargets: [],
      channels: { email: true, sms: true, line: true, notification: true },
      access: 'public',
      slug: `survey-${String(id).padStart(3, '0')}`,
    },
  }
}
