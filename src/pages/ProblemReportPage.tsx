import { useRef, useState } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import iconSave from '../assets/meeting/d-check-sm.svg'
import iconUpload from '../assets/meeting/c-upload.svg'
import PinMap from '../components/community/PinMap'
import { reverseGeocode } from '../components/community/geo'
import { BackTitle, Field, lbl, primaryBtn, useToast } from '../components/leader/Parts'
import { field } from '../components/meeting/FormParts'
import Select from '../components/ui/Select'
import { regions } from '../data/leader'
import { allPoints, problemKinds, problemLabel, type ProblemKind, type ProblemReport } from '../data/orgMap'
import { provinceCenters } from '../data/provinceCenters'
import { mapProvinces } from '../data/thaiMap'
import { nextProblemId, saveProblem } from '../lib/areaStore'

const districts = [...new Set(allPoints.map((p) => p.district))].sort((a, b) => a.localeCompare(b, 'th'))
const subdistricts = [...new Set(allPoints.map((p) => p.subdistrict))].sort((a, b) => a.localeCompare(b, 'th'))
const impactFields: [keyof ProblemReport['impact'], string, string][] = [
  ['provinces', 'จำนวนจังหวัด', 'จังหวัด'],
  ['subdistricts', 'จำนวนตำบล', 'ตำบล'],
  ['orgs', 'จำนวนองค์กร', 'องค์กร'],
  ['communities', 'จำนวนชุมชน', 'ชุมชน'],
  ['cities', 'จำนวนเมือง', 'เมือง'],
  ['households', 'จำนวนครัวเรือน', 'ครัวเรือน'],
]

/** OSS-Area › แจ้งข้อมูลปัญหาเชิงพื้นที่ (Figma 206:15402) */
export default function ProblemReportPage() {
  const navigate = useNavigate()
  const [params] = useSearchParams()
  const [toast, showToast] = useToast()
  const file = useRef<HTMLInputElement>(null)
  const point = allPoints.find((p) => p.id === params.get('point'))

  const [f, setF] = useState(() => {
    const prov = point?.province ?? 'เชียงใหม่'
    const c = point ? ([point.lat, point.lng] as [number, number]) : (provinceCenters[prov] ?? [18.789, 98.726])
    return {
      type: (point?.problemType ?? '') as ProblemKind | '',
      region: point?.region ?? mapProvinces.find((x) => x.name === prov)?.region ?? 'ภาคเหนือ',
      province: prov,
      district: point?.district ?? '',
      subdistrict: point?.subdistrict ?? '',
      moo: '',
      soi: '',
      road: '',
      lat: c[0],
      lng: c[1],
      detail: '',
      file: '',
      impact: { provinces: '', subdistricts: '', orgs: '', communities: '', cities: '', households: '' },
    }
  })
  const [tried, setTried] = useState(false)
  const set = (p: Partial<typeof f>) => setF((x) => ({ ...x, ...p }))

  const errors: Record<string, string> = {}
  if (!f.moo.trim()) errors.moo = 'กรุณาระบุหมู่'
  if (!f.subdistrict.trim()) errors.subdistrict = 'กรุณาระบุตำบล/แขวง'
  if (!f.district.trim()) errors.district = 'กรุณาระบุอำเภอ/เขต'
  if (!f.province) errors.province = 'กรุณาเลือกจังหวัด'
  if (!f.type) errors.type = 'กรุณาเลือกประเภทปัญหา'
  const e = tried ? errors : {}

  const save = () => {
    setTried(true)
    if (Object.keys(errors).length) return showToast('กรุณากรอกข้อมูลที่จำเป็นให้ครบ')
    const id = nextProblemId()
    saveProblem({ id, type: f.type as ProblemKind, detail: f.detail, region: f.region, province: f.province, district: f.district, subdistrict: f.subdistrict, moo: f.moo, soi: f.soi, road: f.road, lat: f.lat, lng: f.lng, reportedAt: new Date().toISOString().slice(0, 10), pointId: point?.id, file: f.file, impact: f.impact })
    navigate('/community/survey-area', { state: { toast: point ? 'เพิ่มรายงานปัญหาในจุดนี้แล้ว' : 'แจ้งปัญหาเชิงพื้นที่แล้ว แสดงบนแผนที่', focus: point ? point.id : `problem-${id}`, province: f.province } })
  }

  const input = (k: 'moo' | 'soi' | 'road', ph: string, req?: boolean) => (
    <input aria-label={ph} placeholder={ph} className={`${field} ${req && e[k] ? 'border-red-00' : ''}`} value={f[k]} onChange={(ev) => set({ [k]: ev.target.value })} />
  )
  const row = (label: string, req: boolean, children: React.ReactNode, err?: string) => (
    <div className="grid grid-cols-[100px_minmax(0,1fr)] items-start gap-x-[12px] gap-y-[2px] max-sm:grid-cols-1">
      <span className="pt-[12px] text-[12px] font-medium text-black/90 max-sm:pt-0">
        {label}
        {req && <span className="text-red-00"> *</span>}
      </span>
      <div className="flex flex-col gap-[4px]">
        {children}
        {err && <span role="alert" className="text-[12px] text-red-00">{err}</span>}
      </div>
    </div>
  )

  return (
    <div className="flex w-full flex-col gap-[12px] px-[24px] pb-[55px] max-sm:px-[12px] max-sm:pb-[25px]">
      <BackTitle title="แจ้งข้อมูลปัญหาเชิงพื้นที่" to="/community/survey-area" />
      {point && <p className="-mt-[4px] rounded-[10px] bg-blue-bg px-[14px] py-[8px] text-[12px] font-light text-blue-00">เพิ่มรายงานในจุด “{point.name}” ต.{point.subdistrict} อ.{point.district} (ถูกรายงานแล้ว {point.reports ?? 1} ครั้ง)</p>}

      <section className="rounded-[12px] bg-blue-gray p-[8px]">
        <div className="grid grid-cols-[minmax(0,1fr)_minmax(0,1.1fr)] gap-[24px] rounded-[12px] bg-white p-[24px] max-lg:grid-cols-1 max-sm:p-[14px]">
          <div className="flex flex-col gap-[12px]">
            <h2 className="text-[20px] leading-[1.2] font-semibold text-blue-00">ตำแหน่ง</h2>
            {row('หมู่ที่', true, input('moo', 'หมู่', true), e.moo)}
            {row('ซอย', false, input('soi', 'ซอย'))}
            {row('ถนน', false, input('road', 'ถนน'))}
            {row(
              'ตำบล/แขวง',
              true,
              <>
                <input aria-label="ตำบล/แขวง" list="sub-list" className={`${field} ${e.subdistrict ? 'border-red-00' : ''}`} value={f.subdistrict} onChange={(ev) => set({ subdistrict: ev.target.value })} />
                <datalist id="sub-list">{subdistricts.map((s) => <option key={s} value={s} />)}</datalist>
              </>,
              e.subdistrict,
            )}
            {row(
              'อำเภอ/เขต',
              true,
              <>
                <input aria-label="อำเภอ/เขต" list="dist-list" className={`${field} ${e.district ? 'border-red-00' : ''}`} value={f.district} onChange={(ev) => set({ district: ev.target.value })} />
                <datalist id="dist-list">{districts.map((s) => <option key={s} value={s} />)}</datalist>
              </>,
              e.district,
            )}
            {row(
              'จังหวัด',
              true,
              <Select
                label="จังหวัด"
                value={f.province}
                options={mapProvinces.map((p) => ({ value: p.name, label: p.name }))}
                onChange={(v) => {
                  const c = provinceCenters[v]
                  set({ province: v, region: mapProvinces.find((x) => x.name === v)?.region ?? f.region, ...(c ? { lat: c[0], lng: c[1] } : {}) })
                }}
              />,
              e.province,
            )}
            {row('ภาค', true, <Select label="ภาค" value={f.region} options={regions.map((r) => ({ value: r, label: r }))} onChange={(v) => set({ region: v })} />)}
          </div>
          <div className="flex flex-col gap-[8px]">
            <h2 className="text-[12px] font-medium text-blue-00">ปักหมุดตำแหน่ง</h2>
            <PinMap
              lat={f.lat}
              lng={f.lng}
              height={250}
              onChange={async (lat, lng) => {
                set({ lat, lng })
                // fill the address fields from the pin (staff can still edit them)
                const g = await reverseGeocode(lat, lng)
                const patch: Partial<typeof f> = {}
                if (g.province) patch.province = g.province
                if (g.region) patch.region = g.region
                if (g.district) patch.district = g.district
                if (g.subdistrict) patch.subdistrict = g.subdistrict
                if (Object.keys(patch).length) set(patch)
              }}
            />
            <p className="text-[10px] font-light text-gray-20">เมื่อเลื่อนหมุด ระบบจะเติมจังหวัด อำเภอ ตำบลให้อัตโนมัติ (แก้ไขได้) และบันทึกเมื่อกด “บันทึกข้อมูล”</p>
          </div>
        </div>
      </section>

      <section className="rounded-[12px] bg-blue-gray p-[8px]">
        <div className="flex flex-col gap-[16px] rounded-[12px] bg-white p-[24px] max-sm:p-[14px]">
          <h2 className="text-[20px] leading-[1.2] font-semibold text-blue-00">ข้อมูลปัญหาเชิงพื้นที่</h2>
          <div className="grid grid-cols-[minmax(0,1fr)_minmax(0,1fr)] items-start gap-[16px] max-md:grid-cols-1">
            <div className="flex flex-col gap-[6px]">
              <span className="text-[12px] font-medium text-black/90">
                ประเภทปัญหา<span className="text-red-00"> *</span>
              </span>
              <Select label="ประเภทปัญหา" value={f.type} placeholder="เลือกประเภทปัญหา" options={problemKinds.map((k) => ({ value: k, label: problemLabel[k] }))} onChange={(v) => set({ type: v as ProblemKind })} />
              {e.type && <span role="alert" className="text-[12px] text-red-00">{e.type}</span>}
            </div>
            <div className="flex flex-col gap-[6px]">
              <span className="text-[12px] font-medium text-black/90">แนบรูปภาพ</span>
              <div className="flex items-center gap-[10px]">
                <button type="button" onClick={() => file.current?.click()} className="flex h-[46px] min-w-0 flex-1 items-center gap-[8px] rounded-[8px] border border-gray-line bg-gray-subtle px-[14px] text-left text-[12px] font-light text-gray-30 hover:border-blue-10">
                  <img src={iconUpload} alt="" width={16} height={16} />
                  <span className="truncate">{f.file || 'อัปโหลดไฟล์'}</span>
                </button>
                <span className="text-[10px] font-light text-gray-20">ขนาดไม่เกิน 20 MB</span>
                <input ref={file} type="file" accept="image/*" hidden onChange={(ev) => { const x = ev.target.files?.[0]; if (!x) return; if (x.size > 20 * 1024 * 1024) return showToast('ไฟล์ใหญ่เกิน 20 MB'); set({ file: x.name }) }} />
              </div>
            </div>
          </div>
          <Field label="รายละเอียดเพิ่มเติม">
            <textarea className={`${field} h-[80px] py-[10px]`} value={f.detail} onChange={(ev) => set({ detail: ev.target.value })} placeholder="อธิบายปัญหาโดยสังเขป (ถ้ามี)" />
          </Field>
          <h3 className="text-[16px] font-semibold text-black">ภาพรวมความเดือดร้อน</h3>
          <div className="flex flex-col gap-[10px]">
            {impactFields.map(([k, l, unit]) => (
              <div key={k} className="grid grid-cols-[140px_200px_minmax(0,1fr)] items-center gap-[12px] max-sm:grid-cols-[110px_minmax(0,1fr)_60px]">
                <label htmlFor={`imp-${k}`} className={lbl}>
                  {l}
                </label>
                <input id={`imp-${k}`} inputMode="numeric" className={field} value={f.impact[k]} onChange={(ev) => set({ impact: { ...f.impact, [k]: ev.target.value.replace(/\D/g, '') } })} />
                <span className="text-[12px] font-light text-gray-20">{unit}</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      <div className="flex justify-end">
        <button type="button" onClick={save} className={primaryBtn}>
          <img src={iconSave} alt="" width={16} height={16} className="brightness-0 invert" />
          บันทึกข้อมูล
        </button>
      </div>
      {toast}
    </div>
  )
}
