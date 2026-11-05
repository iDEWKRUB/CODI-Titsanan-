// OSS-Project Management: project proposal → approval → disbursement → progress reports → closing.
export type ProjectStatus = 'draft' | 'submitted' | 'approved' | 'open' | 'closing' | 'closed'
export const projectStatusLabel: Record<ProjectStatus, string> = {
  draft: 'ร่าง',
  submitted: 'รอพิจารณา',
  approved: 'อนุมัติโครงการ',
  open: 'เปิดโครงการ',
  closing: 'ขอปิดโครงการ',
  closed: 'ปิดโครงการ',
}
export const projectTypes = ['โครงการบ้านพอเพียง', 'โครงการบ้านมั่นคง', 'โครงการแก้ไขปัญหาที่อยู่อาศัย', 'โครงการคนรุ่นใหม่คืนถิ่น']
export const budgetYears = ['2567', '2568', '2569']

export type OrgForm = { org: string; houseNo: string; moo: string; road: string; soi: string; district: string; subdistrict: string; province: string; coordinator: string; phone: string; fax: string }
export type SurveyArea = { year: string; province: string; district: string; subdistrict: string }
export type ProgressReport = {
  id: string
  period: string
  disbursementNo: string
  informant: string
  informDate: string
  position: string
  phone: string
  committee: string[]
  meetings: string[]
  finance: string[]
  collaboration: string[]
  plan: string[]
  followups: string[]
  file: string
  submittedAt?: string
}
export type EvalRow = { id: string; topic: string; result: string }
export type Closure = { letter: string; report: string; signature?: string; evalDetail: string; criteria: string; evals: EvalRow[]; submittedAt?: string; closedAt?: string }

export type Project = {
  id: number
  code: string
  name: string
  type: string
  fiscalYear: string
  createdAt: string
  status: ProjectStatus
  budget: string
  org: OrgForm
  area: SurveyArea
  reports: ProgressReport[]
  closure: Closure
  timeline: { at: string; text: string }[]
}

export const blankOrg = (): OrgForm => ({ org: '', houseNo: '', moo: '', road: '', soi: '', district: '', subdistrict: '', province: '', coordinator: '', phone: '', fax: '' })
export const blankArea = (year = '2568'): SurveyArea => ({ year, province: '', district: '', subdistrict: '' })
export const blankClosure = (): Closure => ({ letter: '', report: '', evalDetail: '', criteria: 'ผลการประเมินพิจารณาจาก 1) ความครบถ้วนของเอกสาร 2) ผลสำเร็จตามแผน 3) การใช้จ่ายงบประมาณ — แต่ละหัวข้อ ผ่าน/ไม่ผ่าน', evals: [] })
export const blankProject = (id: number, year: string, type: string): Project => ({
  id,
  code: `PT${year.slice(2)}${String(id).padStart(3, '0')}-${String(id).padStart(5, '0')}`,
  name: '',
  type,
  fiscalYear: year,
  createdAt: new Date().toISOString().slice(0, 10),
  status: 'draft',
  budget: '',
  org: blankOrg(),
  area: blankArea(year),
  reports: [],
  closure: blankClosure(),
  timeline: [],
})

/** Sample organisation register for "นำเข้าข้อมูล" */
export const orgRegister: OrgForm[] = [
  { org: 'สภาองค์กรชุมชนตำบลสะเบาห้วง', houseNo: '125', moo: '4', road: '', soi: '', district: 'เมืองสระแก้ว', subdistrict: 'สะเบาห้วง', province: 'สระแก้ว', coordinator: 'นางสมศรี ใจดี', phone: '0812345678', fax: '' },
  { org: 'สภาองค์กรชุมชนตำบลบางริ้ม', houseNo: '77', moo: '2', road: 'สุขุมวิท', soi: '5', district: 'เมืองระนอง', subdistrict: 'บางริ้ม', province: 'ระนอง', coordinator: 'นายสุพรรณแก้ว ภัคดี', phone: '0816099557', fax: '077811222' },
  { org: 'สภาองค์กรชุมชนตำบลหนองป่าครั่ง', houseNo: '9', moo: '1', road: '', soi: '', district: 'เมืองเชียงใหม่', subdistrict: 'หนองป่าครั่ง', province: 'เชียงใหม่', coordinator: 'นางพิมพ์ใจ ศรีทอง', phone: '0891112233', fax: '' },
]

export const seedProjects = (): Project[] => {
  const mk = (id: number, name: string, type: string, status: ProjectStatus, org: OrgForm): Project => ({
    ...blankProject(id, '2568', type),
    name,
    status,
    createdAt: '2024-09-24',
    budget: '200000',
    org,
    area: { year: '2568', province: org.province, district: org.district, subdistrict: org.subdistrict },
    timeline: [{ at: '2024-09-24', text: 'ยื่นเสนอโครงการ' }],
  })
  const [a, b, c] = orgRegister
  return [
    mk(1, 'โครงการบ้านพอเพียง เครือข่ายบ้านไร้เสียง', 'โครงการบ้านพอเพียง', 'approved', a),
    mk(2, 'โครงการบ้านพอเพียง เครือข่ายไทบ้านผู้ไร้สิทธิ', 'โครงการบ้านพอเพียง', 'open', b),
    mk(3, 'โครงการบ้านพอเพียงตำบลจอมปลวก', 'โครงการบ้านพอเพียง', 'open', c),
    mk(4, 'โครงการแก้ไขปัญหาที่อยู่อาศัยบ้านมั่นคง', 'โครงการบ้านมั่นคง', 'open', b),
    mk(5, 'โครงการคนรุ่นใหม่คืนถิ่น 3', 'โครงการบ้านมั่นคง', 'open', a),
  ]
}

// ---- Disbursement ----------------------------------------------------------------------------
export type DisbStatus = 'draft' | 'submitted' | 'reviewed'
export const disbStatusLabel: Record<DisbStatus, string> = { draft: 'ร่าง', submitted: 'ส่งตรวจสอบ', reviewed: 'ตรวจสอบแล้ว' }
export type Disbursement = {
  id: number
  projectId: number
  period: string
  status: DisbStatus
  createdAt: string
  createdBy: string
  // community request (Request-Commu)
  writtenAt: string
  houseNo: string
  moo: string
  province: string
  district: string
  subdistrict: string
  zip: string
  contactFirst: string
  contactLast: string
  contactPhone: string
  subject: string
  to: string
  docs: string[]
  budgetFor: string
  amount: string
  installments: string
  bank: string
  accountNo: string
  signature?: string
  // staff review (Request-Staff)
  review: { type: string; recordNo: string; recordDate: string; sector: string; detail: string; opinion: string; payDate: string; summaryDate: string; decision: '' | 'next' | 'fix' | 'other'; decisionText: string }
}
export const disbTypes = ['เบิกจ่ายตามงวดงาน', 'เบิกจ่ายล่วงหน้า', 'เบิกจ่ายค่าบริหารจัดการ']
export const disbSectors = ['สำนักพัฒนาโครงการและนวัตกรรม', 'สำนักงานภาค', 'สำนักบริหารงบประมาณ']
export const blankDisb = (id: number, p: Project): Disbursement => ({
  id,
  projectId: p.id,
  period: '1',
  status: 'draft',
  createdAt: new Date().toISOString().slice(0, 10),
  createdBy: 'ปรียาดา เจริญ…',
  writtenAt: p.org.org,
  houseNo: p.org.houseNo,
  moo: p.org.moo,
  province: p.org.province,
  district: p.org.district,
  subdistrict: p.org.subdistrict,
  zip: '',
  contactFirst: '',
  contactLast: '',
  contactPhone: p.org.phone,
  subject: `ขอเบิกจ่ายเงินงบประมาณสนับสนุน${p.name || 'โครงการ'}`,
  to: 'ผู้อำนวยการสถาบันพัฒนาองค์กรชุมชน',
  docs: [...docNames],
  budgetFor: p.type,
  amount: '',
  installments: '2',
  bank: '',
  accountNo: '',
  review: { type: '', recordNo: '', recordDate: '', sector: '', detail: '', opinion: '', payDate: '', summaryDate: '', decision: '', decisionText: '' },
})
export const docNames = ['สำเนาบัญชีธนาคารพร้อมเซ็นรับรองสำเนา', 'รายละเอียดแผนการดำเนินงานและแผนการใช้งบประมาณ', 'รายงานผลการดำเนินงานงวดที่ผ่านมา พร้อมการตรวจรับ (กรณีขอรับเงินงวดที่ 2)']
