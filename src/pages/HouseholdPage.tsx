import { useMemo, useState, type ReactNode } from 'react'
import { useNavigate } from 'react-router-dom'
import iconPlus from '../assets/survey/icon-plus.svg'
import iconSave from '../assets/meeting/d-check-sm.svg'
import iconTrash from '../assets/survey/icon-trash.svg'
import DigitBoxes from '../components/community/DigitBoxes'
import PinMap from '../components/community/PinMap'
import { BackTitle, lbl, primaryBtn, softBtn, useToast } from '../components/leader/Parts'
import { field } from '../components/meeting/FormParts'
import { DateInput } from '../components/ui/DateTimeInputs'
import Select from '../components/ui/Select'
import { allPoints } from '../data/orgMap'
import { provinceCenters } from '../data/provinceCenters'
import { mapProvinces } from '../data/thaiMap'
import { uid } from '../data/surveyBuilder'

type Member = { id: string; name: string; relation: string; age: string; job: string; income: string }
type Household = {
  prefix: string; firstName: string; lastName: string; nationalId: string; phone: string; birthDate: string
  houseNo: string; moo: string; soi: string; road: string; subdistrict: string; district: string; province: string; sameAsRegistered: boolean; lat: number; lng: number
  income: string; expense: string; savings: string; savingsGroup: '' | 'yes' | 'no'; debt: string; debtSource: string; debtMonthly: string
  houseType: string; material: string; condition: string; bedrooms: string; utilities: string[]; tenure: string
  hasLand: '' | 'yes' | 'no'; rai: string; ngan: string; wa: string; landDoc: string; landUse: string; landProblem: string
  needs: string[]; opinion: string
  members: Member[]
}
const KEY = 'codi.household'
const blank = (): Household => ({
  prefix: '', firstName: '', lastName: '', nationalId: '', phone: '', birthDate: '',
  houseNo: '', moo: '', soi: '', road: '', subdistrict: 'แม่นาจร', district: 'แม่แจ่ม', province: 'เชียงใหม่', sameAsRegistered: false, lat: 18.45, lng: 98.37,
  income: '', expense: '', savings: '', savingsGroup: '', debt: '', debtSource: '', debtMonthly: '',
  houseType: '', material: '', condition: '', bedrooms: '', utilities: [], tenure: '',
  hasLand: '', rai: '', ngan: '', wa: '', landDoc: '', landUse: '', landProblem: '',
  needs: [], opinion: '',
  members: [],
})
const load = (): Household => {
  try {
    const raw = localStorage.getItem(KEY)
    return raw ? { ...blank(), ...(JSON.parse(raw) as Household) } : blank()
  } catch {
    return blank()
  }
}

const prefixes = ['นาย', 'นาง', 'นางสาว', 'อื่น ๆ']
const houseTypes = ['บ้านเดี่ยว', 'ห้องแถว/ตึกแถว', 'บ้านแฝด/ทาวน์เฮาส์', 'บ้านพักชั่วคราว', 'อื่น ๆ']
const materials = ['ไม้', 'ปูน', 'ไม้ผสมปูน', 'สังกะสี/วัสดุเหลือใช้', 'อื่น ๆ']
const conditions = ['สภาพดี', 'พอใช้', 'ทรุดโทรม', 'เสี่ยงภัย/ไม่ปลอดภัย']
const tenures = ['เจ้าของบ้าน', 'เช่า', 'อาศัยผู้อื่น', 'อาศัยในที่ดินสาธารณะ/ไม่มีสิทธิ']
const utilities = ['ไฟฟ้า', 'น้ำประปา', 'ห้องน้ำในบ้าน']
const debtSources = ['ธนาคาร', 'สหกรณ์', 'กองทุนหมู่บ้าน', 'ญาติ/เพื่อนบ้าน', 'นอกระบบ']
const landDocs = ['โฉนด', 'น.ส.3', 'ส.ป.ก.', 'ใบอนุญาต/สัญญาเช่า', 'ไม่มีเอกสารสิทธิ']
const landUses = ['ทำนา', 'ทำสวน/ไร่', 'เลี้ยงสัตว์', 'ปลูกบ้าน', 'ปล่อยว่าง']
const needList = ['ซ่อมแซมบ้าน', 'สร้างบ้านใหม่', 'ที่ดินทำกิน/สิทธิที่ดิน', 'น้ำและไฟฟ้า', 'อาชีพและรายได้', 'แก้ปัญหาหนี้สิน', 'ป้องกันภัยพิบัติ', 'อบรมพัฒนาศักยภาพ']
const districts = [...new Set(allPoints.map((p) => p.district))].sort((a, b) => a.localeCompare(b, 'th'))
const subdistricts = [...new Set(allPoints.map((p) => p.subdistrict))].sort((a, b) => a.localeCompare(b, 'th'))

/** Thai national ID check digit */
const idOk = (id: string) => {
  if (!/^\d{13}$/.test(id)) return false
  let s = 0
  for (let i = 0; i < 12; i++) s += Number(id[i]) * (13 - i)
  return (11 - (s % 11)) % 10 === Number(id[12])
}

type Sec = 's1' | 's2' | 's3' | 's4' | 's5' | 's6'
const secTitles: [Sec, string][] = [
  ['s1', 'ข้อมูลทั่วไป'],
  ['s2', 'ออมทรัพย์และหนี้สิน'],
  ['s3', 'สภาพที่อยู่อาศัย'],
  ['s4', 'สภาพที่ดินทำกิน'],
  ['s5', 'ความคิดเห็นเพื่อการพัฒนาชุมชน'],
  ['s6', 'สมาชิกในครัวเรือน'],
]

function Accordion({ id, n, title, open, onToggle, action, children }: { id: string; n: number; title: string; open: boolean; onToggle: () => void; action?: ReactNode; children: ReactNode }) {
  return (
    <section id={id} className="scroll-mt-[90px] rounded-[12px] bg-gray-bg p-[8px]">
      <div className="flex items-center gap-[8px] rounded-[10px] bg-white px-[16px] py-[10px]">
        <button type="button" aria-expanded={open} onClick={onToggle} className="flex min-w-0 flex-1 items-center gap-[14px] text-left focus-visible:outline-2 focus-visible:outline-blue-00">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" className={`shrink-0 text-gray-30 transition-transform ${open ? '-rotate-90' : ''}`} aria-hidden="true">
            <path d="m15 6-6 6 6 6" />
          </svg>
          <h2 className="truncate text-[20px] leading-[1.2] font-semibold text-blue-00">
            {n}. {title}
          </h2>
        </button>
        {action}
      </div>
      {open && <div className="mt-[8px] rounded-[12px] bg-white p-[20px] max-sm:p-[12px]">{children}</div>}
    </section>
  )
}

/** OSS-Area › เพิ่ม/แก้ไขข้อมูลครัวเรือนตนเอง (Figma 254:16757). Sections 2–6 have no design yet, so their fields are drafted from the household survey topics. */
export default function HouseholdPage() {
  const navigate = useNavigate()
  const [h, setH] = useState<Household>(load)
  const [open, setOpen] = useState<Record<Sec, boolean>>({ s1: true, s2: false, s3: false, s4: false, s5: false, s6: false })
  const [tried, setTried] = useState(false)
  const [toast, showToast] = useToast()
  const set = (p: Partial<Household>) => setH((x) => ({ ...x, ...p }))

  const errors = useMemo(() => {
    const e: Record<string, string> = {}
    if (!h.prefix) e.prefix = 'เลือกคำนำหน้า'
    if (!h.firstName.trim()) e.firstName = 'กรุณาระบุชื่อ'
    if (!h.lastName.trim()) e.lastName = 'กรุณาระบุนามสกุล'
    if (!h.nationalId) e.nationalId = 'กรุณาระบุเลขบัตรประชาชน'
    else if (!idOk(h.nationalId)) e.nationalId = 'เลขบัตรประชาชนไม่ถูกต้อง (ต้องครบ 13 หลักและผ่านการตรวจเลขท้าย)'
    if (!h.phone) e.phone = 'กรุณาระบุเบอร์โทรศัพท์'
    else if (!/^0\d{9}$/.test(h.phone)) e.phone = 'เบอร์โทรศัพท์ต้องเป็นตัวเลข 10 หลัก ขึ้นต้นด้วย 0'
    if (!h.birthDate) e.birthDate = 'กรุณาเลือกวันเกิด'
    if (!h.moo.trim()) e.moo = 'กรุณาระบุหมู่'
    if (!h.subdistrict.trim()) e.subdistrict = 'กรุณาระบุตำบล/แขวง'
    if (!h.district.trim()) e.district = 'กรุณาระบุอำเภอ/เขต'
    if (!h.province) e.province = 'กรุณาเลือกจังหวัด'
    return e
  }, [h])
  const e = tried ? errors : {}

  const save = () => {
    setTried(true)
    if (Object.keys(errors).length) {
      setOpen((o) => ({ ...o, s1: true }))
      document.getElementById('s1')?.scrollIntoView({ behavior: 'smooth' })
      return showToast('กรุณากรอกข้อมูลทั่วไปให้ครบและถูกต้อง')
    }
    localStorage.setItem(KEY, JSON.stringify(h))
    showToast('บันทึกข้อมูลครัวเรือนแล้ว')
  }
  const go = (s: Sec) => {
    setOpen((o) => ({ ...o, [s]: true }))
    setTimeout(() => document.getElementById(s)?.scrollIntoView({ behavior: 'smooth', block: 'start' }), 50)
  }
  const fill = (k: 'income' | 'expense' | 'savings' | 'debt' | 'debtMonthly' | 'bedrooms' | 'rai' | 'ngan' | 'wa') => (
    <input aria-label={k} inputMode="decimal" className={field} value={h[k]} onChange={(ev) => set({ [k]: ev.target.value.replace(/[^\d.]/g, '') })} />
  )
  const text = (k: 'houseNo' | 'moo' | 'soi' | 'road', ph: string, err?: string) => (
    <div className="flex flex-col gap-[2px]">
      <input aria-label={ph} placeholder={ph} className={`${field} h-[36px] text-[12px] ${err ? 'border-red-00' : ''}`} value={h[k]} onChange={(ev) => set({ [k]: ev.target.value })} />
      {err && <span role="alert" className="text-[11px] text-red-00">{err}</span>}
    </div>
  )
  const frow = (label: string, req: boolean, children: ReactNode, err?: string) => (
    <div className="grid grid-cols-[84px_minmax(0,1fr)] items-start gap-[10px] max-sm:grid-cols-1 max-sm:gap-[2px]">
      <span className="pt-[8px] text-[11px] font-semibold text-black max-sm:pt-0">
        {label}
        {req && <span className="text-red-00"> *</span>}
      </span>
      <div className="flex flex-col gap-[2px]">
        {children}
        {err && <span role="alert" className="text-[11px] text-red-00">{err}</span>}
      </div>
    </div>
  )
  const check = (list: string[], v: string, on: boolean) => (on ? [...list, v] : list.filter((x) => x !== v))
  const radio = (name: string, val: string, cur: string, label: string, pick: () => void) => (
    <label key={val} className="flex cursor-pointer items-center gap-[8px] text-[13px] font-light">
      <input type="radio" name={name} checked={cur === val} onChange={pick} className="size-[16px] accent-blue-00" />
      {label}
    </label>
  )
  const opts = (a: string[]) => a.map((v) => ({ value: v, label: v }))

  return (
    <div className="flex w-full flex-col gap-[12px] px-[24px] pb-[55px] max-sm:px-[12px] max-sm:pb-[25px]">
      <BackTitle title="เพิ่ม/แก้ไขข้อมูลครัวเรือน" to="/community/survey-area" />
      <div className="grid grid-cols-[270px_minmax(0,1fr)] items-start gap-[12px] max-lg:grid-cols-1">
        <nav aria-label="สารบัญ" className="sticky top-[12px] rounded-[12px] bg-[#c1e7ff] p-[8px] max-lg:static">
          <h2 className="px-[8px] pt-[4px] pb-[8px] text-[14px] font-semibold text-black">สารบัญ</h2>
          <ol className="flex flex-col gap-[2px] rounded-[10px] bg-white p-[8px] max-lg:flex-row max-lg:flex-wrap">
            {secTitles.map(([s, t], i) => (
              <li key={s}>
                <button type="button" onClick={() => go(s)} className={`flex w-full items-center gap-[6px] rounded-[8px] px-[12px] py-[8px] text-left text-[12px] leading-[normal] transition-colors hover:bg-blue-bg ${open[s] ? 'bg-blue-bg font-medium text-blue-dark' : 'font-light text-black'}`}>
                  {i + 1}. {t}
                  {s === 's1' && tried && Object.keys(errors).length > 0 && <span aria-label="มีข้อมูลที่ต้องแก้" className="ml-auto size-[7px] rounded-full bg-red" />}
                </button>
              </li>
            ))}
          </ol>
        </nav>

        <div className="flex flex-col gap-[12px]">
          <Accordion
            id="s1"
            n={1}
            title="ข้อมูลทั่วไป"
            open={open.s1}
            onToggle={() => setOpen((o) => ({ ...o, s1: !o.s1 }))}
            action={
              <button type="button" onClick={save} className={`${primaryBtn} shrink-0 px-[12px] py-[8px] text-[12px]`}>
                <img src={iconSave} alt="" width={14} height={14} className="brightness-0 invert" />
                บันทึกข้อมูล
              </button>
            }
          >
            <div className="flex flex-col gap-[20px]">
              <div className="flex flex-col gap-[10px]">
                <h3 className="text-[14px] font-semibold text-blue-dark">ผู้ให้ข้อมูล</h3>
                {frow(
                  'ชื่อ-นามสกุล',
                  true,
                  <div className="grid grid-cols-[150px_minmax(0,1fr)_minmax(0,1fr)] gap-[8px] max-md:grid-cols-1">
                    <div className={e.prefix ? 'rounded-[8px] ring-1 ring-red-00' : ''}>
                      <Select label="คำนำหน้า" value={h.prefix} placeholder="เลือกคำนำหน้า" options={opts(prefixes)} onChange={(v) => set({ prefix: v })} />
                    </div>
                    <input aria-label="ชื่อ" placeholder="ชื่อ" className={`${field} ${e.firstName ? 'border-red-00' : ''}`} value={h.firstName} onChange={(ev) => set({ firstName: ev.target.value })} />
                    <input aria-label="นามสกุล" placeholder="นามสกุล" className={`${field} ${e.lastName ? 'border-red-00' : ''}`} value={h.lastName} onChange={(ev) => set({ lastName: ev.target.value })} />
                  </div>,
                  e.prefix || e.firstName || e.lastName,
                )}
                {frow('เลขบัตรประชาชน', true, <DigitBoxes label="เลขบัตรประชาชน" groups={[1, 4, 5, 2, 1]} value={h.nationalId} invalid={!!e.nationalId} onChange={(v) => set({ nationalId: v })} />, e.nationalId)}
                {frow('เบอร์โทรศัพท์', true, <DigitBoxes label="เบอร์โทรศัพท์" groups={[3, 3, 4]} value={h.phone} invalid={!!e.phone} onChange={(v) => set({ phone: v })} />, e.phone)}
                {frow(
                  'วัน เดือน ปีเกิด',
                  true,
                  <div className="w-[220px] max-sm:w-full">
                    <DateInput label="วัน เดือน ปีเกิด" value={h.birthDate} onChange={(v) => set({ birthDate: v })} />
                  </div>,
                  e.birthDate,
                )}
              </div>

              <div className="grid grid-cols-[minmax(0,1fr)_minmax(0,1.1fr)] gap-[24px] max-lg:grid-cols-1">
                <div className="flex flex-col gap-[10px]">
                  <h3 className="text-[14px] font-semibold text-blue-dark">ที่อยู่อาศัยปัจจุบัน</h3>
                  {frow('เลขที่', false, text('houseNo', 'เลขที่'))}
                  {frow('หมู่', true, text('moo', 'หมู่', e.moo))}
                  {frow('ซอย', false, text('soi', 'ซอย'))}
                  {frow('ถนน', false, text('road', 'ถนน'))}
                  {frow(
                    'ตำบล/แขวง',
                    true,
                    <>
                      <input aria-label="ตำบล/แขวง" list="hh-sub" className={`${field} h-[36px] text-[12px] ${e.subdistrict ? 'border-red-00' : ''}`} value={h.subdistrict} onChange={(ev) => set({ subdistrict: ev.target.value })} />
                      <datalist id="hh-sub">{subdistricts.map((s) => <option key={s} value={s} />)}</datalist>
                    </>,
                    e.subdistrict,
                  )}
                  {frow(
                    'อำเภอ/เขต',
                    true,
                    <>
                      <input aria-label="อำเภอ/เขต" list="hh-dist" className={`${field} h-[36px] text-[12px] ${e.district ? 'border-red-00' : ''}`} value={h.district} onChange={(ev) => set({ district: ev.target.value })} />
                      <datalist id="hh-dist">{districts.map((s) => <option key={s} value={s} />)}</datalist>
                    </>,
                    e.district,
                  )}
                  {frow(
                    'จังหวัด',
                    true,
                    <Select
                      label="จังหวัด"
                      value={h.province}
                      options={mapProvinces.map((p) => ({ value: p.name, label: p.name }))}
                      onChange={(v) => {
                        const c = provinceCenters[v]
                        set({ province: v, ...(c ? { lat: c[0], lng: c[1] } : {}) })
                      }}
                    />,
                    e.province,
                  )}
                  <label className="flex cursor-pointer items-center gap-[10px] pt-[4px] text-[12px] font-light">
                    <input type="checkbox" checked={h.sameAsRegistered} onChange={(ev) => set({ sameAsRegistered: ev.target.checked })} className="size-[20px] accent-blue-00" />
                    ที่อยู่ปัจจุบันตรงกับทะเบียนบ้าน
                  </label>
                </div>
                <div className="flex flex-col gap-[8px]">
                  <h3 className="text-[12px] font-semibold text-blue-00">ปักหมุดตำแหน่ง</h3>
                  <PinMap lat={h.lat} lng={h.lng} onChange={(lat, lng) => set({ lat, lng })} height={230} />
                </div>
              </div>
            </div>
          </Accordion>

          <Accordion id="s2" n={2} title="ออมทรัพย์และหนี้สิน" open={open.s2} onToggle={() => setOpen((o) => ({ ...o, s2: !o.s2 }))}>
            <div className="grid grid-cols-2 gap-[16px] max-sm:grid-cols-1">
              {([['income', 'รายได้ครัวเรือนต่อเดือน (บาท)'], ['expense', 'รายจ่ายครัวเรือนต่อเดือน (บาท)'], ['savings', 'เงินออมรวม (บาท)'], ['debt', 'หนี้สินรวม (บาท)'], ['debtMonthly', 'ภาระผ่อนชำระต่อเดือน (บาท)']] as const).map(([k, l]) => (
                <label key={k} className="flex flex-col gap-[6px]">
                  <span className={lbl}>{l}</span>
                  {fill(k)}
                </label>
              ))}
              <div className="flex flex-col gap-[6px]">
                <span className={lbl}>แหล่งเงินกู้หลัก</span>
                <Select label="แหล่งเงินกู้" value={h.debtSource} placeholder="เลือกแหล่งเงินกู้" options={opts(debtSources)} onChange={(v) => set({ debtSource: v })} />
              </div>
              <fieldset className="flex flex-col gap-[8px]">
                <legend className={lbl}>เป็นสมาชิกกลุ่มออมทรัพย์</legend>
                <div className="flex gap-[20px]">
                  {radio('sg', 'yes', h.savingsGroup, 'เป็นสมาชิก', () => set({ savingsGroup: 'yes' }))}
                  {radio('sg', 'no', h.savingsGroup, 'ไม่เป็น', () => set({ savingsGroup: 'no' }))}
                </div>
              </fieldset>
            </div>
          </Accordion>

          <Accordion id="s3" n={3} title="สภาพที่อยู่อาศัย" open={open.s3} onToggle={() => setOpen((o) => ({ ...o, s3: !o.s3 }))}>
            <div className="grid grid-cols-2 gap-[16px] max-sm:grid-cols-1">
              <div className="flex flex-col gap-[6px]"><span className={lbl}>ลักษณะที่อยู่อาศัย</span><Select label="ลักษณะที่อยู่อาศัย" value={h.houseType} placeholder="เลือก" options={opts(houseTypes)} onChange={(v) => set({ houseType: v })} /></div>
              <div className="flex flex-col gap-[6px]"><span className={lbl}>วัสดุหลัก</span><Select label="วัสดุหลัก" value={h.material} placeholder="เลือก" options={opts(materials)} onChange={(v) => set({ material: v })} /></div>
              <div className="flex flex-col gap-[6px]"><span className={lbl}>สภาพบ้าน</span><Select label="สภาพบ้าน" value={h.condition} placeholder="เลือก" options={opts(conditions)} onChange={(v) => set({ condition: v })} /></div>
              <div className="flex flex-col gap-[6px]"><span className={lbl}>สถานะการอยู่อาศัย</span><Select label="สถานะการอยู่อาศัย" value={h.tenure} placeholder="เลือก" options={opts(tenures)} onChange={(v) => set({ tenure: v })} /></div>
              <label className="flex flex-col gap-[6px]"><span className={lbl}>จำนวนห้องนอน</span>{fill('bedrooms')}</label>
              <fieldset className="flex flex-col gap-[8px]">
                <legend className={lbl}>สาธารณูปโภคที่มี</legend>
                <div className="flex flex-wrap gap-[16px]">
                  {utilities.map((u) => (
                    <label key={u} className="flex cursor-pointer items-center gap-[8px] text-[13px] font-light">
                      <input type="checkbox" checked={h.utilities.includes(u)} onChange={(ev) => set({ utilities: check(h.utilities, u, ev.target.checked) })} className="size-[16px] accent-blue-00" />
                      {u}
                    </label>
                  ))}
                </div>
              </fieldset>
            </div>
          </Accordion>

          <Accordion id="s4" n={4} title="สภาพที่ดินทำกิน" open={open.s4} onToggle={() => setOpen((o) => ({ ...o, s4: !o.s4 }))}>
            <div className="flex flex-col gap-[16px]">
              <fieldset className="flex flex-col gap-[8px]">
                <legend className={lbl}>มีที่ดินทำกินหรือไม่</legend>
                <div className="flex gap-[20px]">
                  {radio('land', 'yes', h.hasLand, 'มี', () => set({ hasLand: 'yes' }))}
                  {radio('land', 'no', h.hasLand, 'ไม่มี', () => set({ hasLand: 'no' }))}
                </div>
              </fieldset>
              {h.hasLand === 'yes' && (
                <>
                  <div className="grid grid-cols-3 gap-[12px] max-sm:grid-cols-1">
                    <label className="flex flex-col gap-[6px]"><span className={lbl}>เนื้อที่ (ไร่)</span>{fill('rai')}</label>
                    <label className="flex flex-col gap-[6px]"><span className={lbl}>งาน</span>{fill('ngan')}</label>
                    <label className="flex flex-col gap-[6px]"><span className={lbl}>ตารางวา</span>{fill('wa')}</label>
                  </div>
                  <div className="grid grid-cols-2 gap-[16px] max-sm:grid-cols-1">
                    <div className="flex flex-col gap-[6px]"><span className={lbl}>เอกสารสิทธิ</span><Select label="เอกสารสิทธิ" value={h.landDoc} placeholder="เลือก" options={opts(landDocs)} onChange={(v) => set({ landDoc: v })} /></div>
                    <div className="flex flex-col gap-[6px]"><span className={lbl}>การใช้ประโยชน์</span><Select label="การใช้ประโยชน์" value={h.landUse} placeholder="เลือก" options={opts(landUses)} onChange={(v) => set({ landUse: v })} /></div>
                  </div>
                </>
              )}
              <label className="flex flex-col gap-[6px]">
                <span className={lbl}>ปัญหาเกี่ยวกับที่ดิน (ถ้ามี)</span>
                <textarea className={`${field} h-[80px] py-[10px]`} value={h.landProblem} onChange={(ev) => set({ landProblem: ev.target.value })} />
              </label>
            </div>
          </Accordion>

          <Accordion id="s5" n={5} title="ความคิดเห็นเพื่อการพัฒนาชุมชน" open={open.s5} onToggle={() => setOpen((o) => ({ ...o, s5: !o.s5 }))}>
            <div className="flex flex-col gap-[16px]">
              <fieldset className="flex flex-col gap-[8px]">
                <legend className={lbl}>สิ่งที่ครัวเรือนต้องการให้ช่วยเหลือ</legend>
                <div className="grid grid-cols-2 gap-[8px] max-sm:grid-cols-1">
                  {needList.map((n) => (
                    <label key={n} className="flex cursor-pointer items-center gap-[8px] text-[13px] font-light">
                      <input type="checkbox" checked={h.needs.includes(n)} onChange={(ev) => set({ needs: check(h.needs, n, ev.target.checked) })} className="size-[16px] accent-blue-00" />
                      {n}
                    </label>
                  ))}
                </div>
              </fieldset>
              <label className="flex flex-col gap-[6px]">
                <span className={lbl}>ความคิดเห็นเพิ่มเติม</span>
                <textarea className={`${field} h-[100px] py-[10px]`} value={h.opinion} onChange={(ev) => set({ opinion: ev.target.value })} />
              </label>
            </div>
          </Accordion>

          <Accordion id="s6" n={6} title="สมาชิกในครัวเรือน" open={open.s6} onToggle={() => setOpen((o) => ({ ...o, s6: !o.s6 }))}>
            <div className="flex flex-col gap-[10px]">
              {h.members.map((m, i) => (
                <div key={m.id} className="grid grid-cols-[minmax(0,1.4fr)_minmax(0,1fr)_80px_minmax(0,1fr)_minmax(0,1fr)_32px] items-center gap-[8px] max-lg:grid-cols-2">
                  {([['name', 'ชื่อ-นามสกุล'], ['relation', 'ความสัมพันธ์'], ['age', 'อายุ'], ['job', 'อาชีพ'], ['income', 'รายได้/เดือน']] as const).map(([k, ph]) => (
                    <input key={k} aria-label={`${ph} สมาชิก ${i + 1}`} placeholder={ph} inputMode={k === 'age' || k === 'income' ? 'numeric' : undefined} className={`${field} h-[40px] text-[13px]`} value={m[k]} onChange={(ev) => set({ members: h.members.map((x) => (x.id === m.id ? { ...x, [k]: k === 'age' || k === 'income' ? ev.target.value.replace(/\D/g, '') : ev.target.value } : x)) })} />
                  ))}
                  <button type="button" aria-label={`ลบสมาชิก ${i + 1}`} onClick={() => set({ members: h.members.filter((x) => x.id !== m.id) })} className="flex size-[32px] items-center justify-center rounded-[8px] hover:bg-red-20">
                    <img src={iconTrash} alt="" width={16} height={16} />
                  </button>
                </div>
              ))}
              {h.members.length === 0 && <p className="text-[13px] font-light text-gray-20">ยังไม่มีสมาชิก กด “เพิ่มสมาชิก” เพื่อเพิ่มคนในครัวเรือน</p>}
              <div>
                <button type="button" className={softBtn} onClick={() => set({ members: [...h.members, { id: uid('m'), name: '', relation: '', age: '', job: '', income: '' }] })}>
                  <img src={iconPlus} alt="" width={14} height={14} className="[filter:invert(36%)_sepia(98%)_saturate(2879%)_hue-rotate(200deg)]" />
                  เพิ่มสมาชิก
                </button>
              </div>
            </div>
          </Accordion>

          <div className="flex justify-end gap-[8px]">
            <button type="button" className={softBtn} onClick={() => navigate('/community/survey-area')}>
              ยกเลิก
            </button>
            <button type="button" className={primaryBtn} onClick={save}>
              <img src={iconSave} alt="" width={16} height={16} className="brightness-0 invert" />
              บันทึกข้อมูล
            </button>
          </div>
        </div>
      </div>
      {toast}
    </div>
  )
}
