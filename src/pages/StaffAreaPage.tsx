import { useEffect, useRef, useState, type ReactNode } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import iconSave from '../assets/meeting/d-check-sm.svg'
import PinMap from '../components/community/PinMap'
import { reverseGeocode } from '../components/community/geo'
import { BackTitle, primaryBtn, useToast } from '../components/leader/Parts'
import { field } from '../components/meeting/FormParts'
import Select from '../components/ui/Select'
import { regions } from '../data/leader'
import { allPoints, aptOptions, blankArea, type SurveyAreaRecord } from '../data/orgMap'
import { provinceCenters } from '../data/provinceCenters'
import { mapProvinces } from '../data/thaiMap'
import { getArea, nextAreaId, saveArea } from '../lib/areaStore'

const districts = [...new Set(allPoints.map((p) => p.district))].sort((a, b) => a.localeCompare(b, 'th'))
const subdistricts = [...new Set(allPoints.map((p) => p.subdistrict))].sort((a, b) => a.localeCompare(b, 'th'))

function Card({ title, onSave, children }: { title: string; onSave: () => void; children: ReactNode }) {
  return (
    <section className="rounded-[12px] bg-blue-gray p-[8px]">
      <div className="flex flex-col gap-[16px] rounded-[12px] bg-white p-[24px] max-sm:p-[14px]">
        <h2 className="text-[20px] leading-[1.2] font-semibold text-blue-00">{title}</h2>
        {children}
        <div className="flex justify-end">
          <button type="button" onClick={onSave} className={`${primaryBtn} px-[14px] py-[8px] text-[12px]`}>
            <img src={iconSave} alt="" width={14} height={14} className="brightness-0 invert" />
            บันทึกข้อมูล
          </button>
        </div>
      </div>
    </section>
  )
}

/** OSS-Area › เจ้าหน้าที่เพิ่ม/แก้ไขพื้นที่สำรวจ (Figma 314:16911) */
export default function StaffAreaPage() {
  const { id } = useParams()
  const navigate = useNavigate()
  const existing = id ? getArea(Number(id)) : undefined
  const [a, setA] = useState<SurveyAreaRecord>(() => existing ?? blankArea(nextAreaId()))
  const [tried, setTried] = useState(false)
  const [note, setNote] = useState('')
  const [toast, showToast] = useToast()
  const saved = useRef(!!existing)
  const set = (p: Partial<SurveyAreaRecord>) => setA((x) => ({ ...x, ...p }))

  // pin moved → fill the address fields from the position (still needs "บันทึกข้อมูล")
  const first = useRef(true)
  useEffect(() => {
    if (first.current) {
      first.current = false
      return
    }
    const t = setTimeout(async () => {
      const p = await reverseGeocode(a.lat, a.lng)
      const patch: Partial<SurveyAreaRecord> = {}
      if (p.province) patch.province = p.province
      if (p.region) patch.region = p.region
      if (p.district) patch.district = p.district
      if (p.subdistrict) patch.subdistrict = p.subdistrict
      if (p.postcode) patch.zip = p.postcode
      if (Object.keys(patch).length) {
        set(patch)
        setNote('เติมจังหวัด อำเภอ ตำบล และรหัสไปรษณีย์จากตำแหน่งหมุดให้แล้ว (แก้ไขได้) — ต้องกด “บันทึกข้อมูล” เพื่อเก็บ')
      } else setNote('')
    }, 600)
    return () => clearTimeout(t)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [a.lat, a.lng])

  const errors: Record<string, string> = {}
  if (!a.moo.trim()) errors.moo = 'กรุณาระบุหมู่'
  if (!a.province) errors.province = 'กรุณาเลือกจังหวัด'
  if (!a.district.trim()) errors.district = 'กรุณาระบุอำเภอ/เขต'
  if (!a.subdistrict.trim()) errors.subdistrict = 'กรุณาระบุตำบล/แขวง'
  if (!a.apt || a.apt === 'ไม่ระบุ') errors.apt = 'กรุณาเลือก อปท.'
  if (!/^\d{5}$/.test(a.zip)) errors.zip = 'รหัสไปรษณีย์ต้องเป็นตัวเลข 5 หลัก'
  if (!a.firstName.trim() || !a.lastName.trim()) errors.name = 'กรุณาระบุชื่อและนามสกุลผู้ติดต่อ'
  if (!/^0\d{9}$/.test(a.phone)) errors.phone = 'เบอร์โทรศัพท์ต้องเป็นตัวเลข 10 หลัก ขึ้นต้นด้วย 0'
  if (a.email && !/^\S+@\S+\.\S+$/.test(a.email)) errors.email = 'รูปแบบอีเมลไม่ถูกต้อง'
  const e = tried ? errors : {}

  const save = () => {
    setTried(true)
    if (Object.keys(errors).length) return showToast('กรุณากรอกข้อมูลที่จำเป็นให้ครบและถูกต้อง')
    saveArea(a)
    showToast(`บันทึกพื้นที่สำรวจ ${a.code} แล้ว`)
    if (!saved.current) {
      saved.current = true
      navigate(`/community/area/${a.id}`, { replace: true })
    }
  }

  const row = (label: string, req: boolean, children: ReactNode, err?: string, unit?: string) => (
    <div className="grid grid-cols-[96px_minmax(0,1fr)_auto] items-start gap-x-[10px] gap-y-[2px] max-sm:grid-cols-[1fr]">
      <span className="pt-[10px] text-[11px] font-semibold text-black max-sm:pt-0">
        {label}
        {req && <span className="text-red-00"> *</span>}
      </span>
      <div className="flex min-w-0 flex-col gap-[2px]">
        {children}
        {err && <span role="alert" className="text-[11px] text-red-00">{err}</span>}
      </div>
      {unit && <span className="pt-[10px] text-[11px] font-light text-gray-20 max-sm:hidden">{unit}</span>}
    </div>
  )
  const txt = (k: 'houseNo' | 'moo' | 'soi' | 'road' | 'email', ph: string, err?: string) => (
    <input aria-label={ph} placeholder={ph} className={`${field} h-[36px] text-[12px] ${err ? 'border-red-00' : ''}`} value={a[k]} onChange={(ev) => set({ [k]: ev.target.value })} />
  )
  const num = (k: 'households' | 'rai' | 'ngan' | 'wa' | 'people' | 'provinces' | 'subdistricts' | 'orgs' | 'communities' | 'cities', label: string) => (
    <input aria-label={label} inputMode="numeric" className={`${field} h-[36px] text-[12px]`} value={a[k]} onChange={(ev) => set({ [k]: ev.target.value.replace(/\D/g, '') })} />
  )

  return (
    <div className="flex w-full flex-col gap-[12px] px-[24px] pb-[55px] max-sm:px-[12px] max-sm:pb-[25px]">
      <BackTitle title="เพิ่ม/แก้ไขพื้นที่สำรวจ" to="/community/survey-area" />

      <Card title="ตำแหน่ง" onSave={save}>
        <div className="grid grid-cols-[minmax(0,1fr)_minmax(0,1.1fr)] gap-[24px] max-lg:grid-cols-1">
          <div className="flex flex-col gap-[10px]">
            {row('รหัสพื้นที่', false, <input aria-label="รหัสพื้นที่" readOnly className="h-[36px] w-full rounded-[8px] border border-gray-line bg-gray-bg px-[14px] text-[12px] text-gray-30 outline-none" value={a.code} />)}
            {row('เลขที่', false, txt('houseNo', 'เลขที่'))}
            {row('หมู่ที่', true, txt('moo', 'หมู่', e.moo), e.moo)}
            {row('ซอย', false, txt('soi', 'ซอย'))}
            {row('ถนน', false, txt('road', 'ถนน'))}
            {row('ภาค', true, <Select label="ภาค" value={a.region} options={regions.map((r) => ({ value: r, label: r }))} onChange={(v) => set({ region: v })} />)}
            {row(
              'จังหวัด',
              true,
              <Select
                label="จังหวัด"
                value={a.province}
                options={mapProvinces.map((p) => ({ value: p.name, label: p.name }))}
                onChange={(v) => {
                  const c = provinceCenters[v]
                  set({ province: v, region: mapProvinces.find((x) => x.name === v)?.region ?? a.region, ...(c ? { lat: c[0], lng: c[1] } : {}) })
                }}
              />,
              e.province,
            )}
            {row(
              'อำเภอ/เขต',
              true,
              <>
                <input aria-label="อำเภอ/เขต" list="sa-dist" className={`${field} h-[36px] text-[12px] ${e.district ? 'border-red-00' : ''}`} value={a.district} onChange={(ev) => set({ district: ev.target.value })} />
                <datalist id="sa-dist">{districts.map((s) => <option key={s} value={s} />)}</datalist>
              </>,
              e.district,
            )}
            {row(
              'ตำบล/แขวง',
              true,
              <>
                <input aria-label="ตำบล/แขวง" list="sa-sub" className={`${field} h-[36px] text-[12px] ${e.subdistrict ? 'border-red-00' : ''}`} value={a.subdistrict} onChange={(ev) => set({ subdistrict: ev.target.value })} />
                <datalist id="sa-sub">{subdistricts.map((s) => <option key={s} value={s} />)}</datalist>
              </>,
              e.subdistrict,
            )}
            {row('อปท.', true, <Select label="อปท." value={a.apt} options={aptOptions.map((o) => ({ value: o, label: o }))} onChange={(v) => set({ apt: v })} />, e.apt)}
            {row('รหัสไปรษณีย์', true, <input aria-label="รหัสไปรษณีย์" inputMode="numeric" maxLength={5} className={`${field} h-[36px] text-[12px] ${e.zip ? 'border-red-00' : ''}`} value={a.zip} onChange={(ev) => set({ zip: ev.target.value.replace(/\D/g, '') })} />, e.zip)}
          </div>
          <div className="flex flex-col gap-[8px]">
            <h3 className="text-[12px] font-semibold text-blue-00">ปักหมุดตำแหน่ง</h3>
            <PinMap lat={a.lat} lng={a.lng} onChange={(lat, lng) => set({ lat, lng })} height={250} />
            {note && <p role="status" className="rounded-[8px] bg-blue-bg px-[10px] py-[6px] text-[11px] leading-[1.5] font-light text-blue-00">{note}</p>}
          </div>
        </div>
      </Card>

      <Card title="ข้อมูลพื้นที่ผู้เดือดร้อน" onSave={save}>
        <div className="grid grid-cols-2 gap-x-[32px] gap-y-[10px] max-lg:grid-cols-1">
          <div className="flex flex-col gap-[10px]">
            {row('จำนวนครัวเรือน', false, num('households', 'จำนวนครัวเรือน'), undefined, 'ครัวเรือน')}
            {row('ขนาดพื้นที่', false, num('rai', 'ขนาดพื้นที่ (ไร่)'), undefined, 'ไร่')}
            {row('', false, num('ngan', 'ขนาดพื้นที่ (งาน)'), undefined, 'งาน')}
            {row('', false, num('wa', 'ขนาดพื้นที่ (ตารางวา)'), undefined, 'ตร.ว.')}
          </div>
          <div className="flex flex-col gap-[10px]">
            {row('จำนวนจังหวัด', false, num('provinces', 'จำนวนจังหวัด'), undefined, 'จังหวัด')}
            {row('จำนวนตำบล', false, num('subdistricts', 'จำนวนตำบล'), undefined, 'ตำบล')}
            {row('จำนวนองค์กร', false, num('orgs', 'จำนวนองค์กร'), undefined, 'องค์กร')}
            {row('จำนวนชุมชน', false, num('communities', 'จำนวนชุมชน'), undefined, 'ชุมชน')}
            {row('จำนวนเมือง', false, num('cities', 'จำนวนเมือง'), undefined, 'เมือง')}
            {row('จำนวนคน', false, num('people', 'จำนวนคน'), undefined, 'คน')}
          </div>
        </div>
      </Card>

      <Card title="ช่องทางการติดต่อ" onSave={save}>
        <div className="flex flex-col gap-[10px]">
          {row(
            'ชื่อ-นามสกุล',
            true,
            <div className="grid grid-cols-[150px_minmax(0,1fr)_minmax(0,1fr)] gap-[8px] max-md:grid-cols-1">
              <Select label="คำนำหน้า" value={a.prefix} options={['นาย', 'นาง', 'นางสาว'].map((p) => ({ value: p, label: p }))} onChange={(v) => set({ prefix: v })} />
              <input aria-label="ชื่อ" placeholder="ชื่อ" className={`${field} ${e.name ? 'border-red-00' : ''}`} value={a.firstName} onChange={(ev) => set({ firstName: ev.target.value })} />
              <input aria-label="นามสกุล" placeholder="นามสกุล" className={`${field} ${e.name ? 'border-red-00' : ''}`} value={a.lastName} onChange={(ev) => set({ lastName: ev.target.value })} />
            </div>,
            e.name,
          )}
          {row('เบอร์โทรศัพท์', true, <input aria-label="เบอร์โทรศัพท์" inputMode="numeric" maxLength={10} className={`${field} h-[36px] max-w-[260px] text-[12px] ${e.phone ? 'border-red-00' : ''}`} value={a.phone} onChange={(ev) => set({ phone: ev.target.value.replace(/\D/g, '') })} />, e.phone)}
          {row('Email', false, <div className="max-w-[260px]">{txt('email', 'Email', e.email)}</div>, e.email)}
        </div>
      </Card>
      {toast}
    </div>
  )
}
