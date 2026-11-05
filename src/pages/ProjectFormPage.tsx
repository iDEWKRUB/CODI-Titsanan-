import { useMemo, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import iconEye from '../assets/survey/icon-eye.svg'
import iconSearch from '../assets/dashboard/icon-search.svg'
import iconSend from '../assets/meeting/c-send.svg'
import iconRefresh from '../assets/meeting/c-arrow-clockwise.svg'
import iconUpload from '../assets/meeting/c-upload.svg'
import { BackTitle, ConfirmDialog, Field, lbl, primaryBtn, softBtn, useToast } from '../components/leader/Parts'
import { field } from '../components/meeting/FormParts'
import { PmSection, pmPage, Req, roField, RoleSwitch } from '../components/pm/Parts'
import Modal from '../components/ui/Modal'
import Select from '../components/ui/Select'
import { blankArea, blankOrg, orgRegister, type OrgForm, type Project } from '../data/projects'
import { mapProvinces } from '../data/thaiMap'
import { getProject, saveProject, usePmRole } from '../lib/projectStore'

const phoneOk = (s: string) => /^\d{9,10}$/.test(s.replace(/[-\s]/g, ''))

export default function ProjectFormPage() {
  const { id } = useParams()
  const navigate = useNavigate()
  const role = usePmRole()
  const existing = getProject(Number(id))
  const [p, setP] = useState<Project | undefined>(existing)
  const [tried, setTried] = useState(false)
  const [preview, setPreview] = useState(false)
  const [importing, setImporting] = useState(false)
  const [askClear, setAskClear] = useState(false)
  const [toast, showToast] = useToast()

  const errors = useMemo(() => {
    const e: Record<string, string> = {}
    if (!p) return e
    if (!p.name.trim()) e.name = 'กรุณาตั้งชื่อโครงการ'
    if (!p.org.org.trim()) e.org = 'กรุณาระบุองค์กรผู้รับผลประโยชน์'
    if (!p.org.coordinator.trim()) e.coordinator = 'กรุณาระบุผู้ประสานงาน'
    if (!p.org.phone.trim()) e.phone = 'กรุณาระบุเบอร์โทรศัพท์'
    else if (!phoneOk(p.org.phone)) e.phone = 'เบอร์โทรศัพท์ต้องเป็นตัวเลข 9–10 หลัก'
    if (!p.area.province) e.province = 'กรุณาเลือกจังหวัด'
    return e
  }, [p])

  if (!p) return (
    <div className={pmPage}>
      <BackTitle title="ยื่นเสนอโครงการ" to="/projects" />
      <p className="rounded-[12px] bg-gray-subtle p-[24px] text-center text-[14px] text-gray-20">ไม่พบโครงการนี้</p>
    </div>
  )
  const locked = role === 'staff' || !['draft'].includes(p.status)
  const e = tried ? errors : {}
  const setOrg = (k: keyof OrgForm, v: string) => setP({ ...p, org: { ...p.org, [k]: v } })
  const prov = mapProvinces.find((x) => x.name === p.area.province)
  const fld = (k: keyof OrgForm, label: string, extra?: { req?: boolean; err?: string; inputMode?: 'numeric' }) => (
    <Field label={label} error={extra?.err}>
      <input aria-label={label} inputMode={extra?.inputMode} disabled={locked} className={`${locked ? roField : field} ${extra?.err ? 'border-red-00' : ''}`} value={p.org[k]} onChange={(ev) => setOrg(k, ev.target.value)} />
    </Field>
  )

  const saveDraft = () => {
    saveProject(p)
    showToast('บันทึกแบบร่างแล้ว')
  }
  const submit = () => {
    setTried(true)
    if (Object.keys(errors).length) return showToast('กรุณากรอกข้อมูลที่จำเป็นให้ครบ')
    const next: Project = { ...p, status: 'submitted', timeline: [...p.timeline, { at: new Date().toISOString().slice(0, 10), text: 'ยื่นเสนอโครงการ' }] }
    saveProject(next)
    navigate(`/projects/${p.id}`, { state: { toast: 'ส่งข้อมูลโครงการแล้ว รอเจ้าหน้าที่พิจารณา' } })
  }
  const pick = (o: OrgForm) => {
    setP({ ...p, org: o, area: { ...p.area, province: o.province, district: o.district, subdistrict: o.subdistrict } })
    setImporting(false)
    showToast('นำเข้าข้อมูลองค์กรแล้ว')
  }

  return (
    <div className={pmPage}>
      <BackTitle title="ยื่นเสนอโครงการ" to={`/projects/${p.id}`} actions={<RoleSwitch />} />
      {locked && <p className="rounded-[10px] bg-blue-bg px-[16px] py-[10px] text-[13px] font-light text-blue-00">{role === 'staff' ? 'มุมมองเจ้าหน้าที่: ดูข้อมูลได้อย่างเดียว' : 'โครงการนี้ส่งข้อมูลแล้ว จึงแก้ไขไม่ได้'}</p>}

      <section className="rounded-[12px] bg-blue-bg p-[8px]">
        <div className="grid grid-cols-[200px_minmax(0,1fr)_minmax(0,1.4fr)] gap-[16px] rounded-[12px] bg-white p-[20px] max-lg:grid-cols-1 max-sm:p-[12px]">
          <Field label="ปีงบประมาณ">
            <input className={roField} value={p.fiscalYear} readOnly aria-label="ปีงบประมาณ" />
          </Field>
          <Field label="ประเภทโครงการ">
            <input className={roField} value={p.type} readOnly aria-label="ประเภทโครงการ" />
          </Field>
          <Field label="ชื่อโครงการ" error={e.name}>
            <input aria-label="ชื่อโครงการ" disabled={locked} className={`${locked ? roField : field} ${e.name ? 'border-red-00' : ''}`} value={p.name} placeholder="เช่น โครงการบ้านพอเพียงตำบล…" onChange={(ev) => setP({ ...p, name: ev.target.value })} />
          </Field>
        </div>
      </section>

      {!locked && (
        <div className="flex justify-end gap-[8px]">
          <button type="button" onClick={() => setAskClear(true)} className="flex items-center gap-[6px] px-[12px] py-[8px] text-[12px] font-medium text-blue-00 hover:underline">
            <img src={iconRefresh} alt="" width={14} height={14} />
            ล้างข้อมูล
          </button>
          <button type="button" onClick={() => setImporting(true)} className={softBtn}>
            <img src={iconUpload} alt="" width={14} height={14} className="[filter:invert(36%)_sepia(98%)_saturate(2879%)_hue-rotate(200deg)]" />
            นำเข้าข้อมูล
          </button>
        </div>
      )}

      <PmSection title="ข้อมูลองค์กรผู้เสนอโครงการ">
        <div className="grid grid-cols-2 gap-[16px] max-sm:grid-cols-1">
          <div className="col-span-2 flex flex-col gap-[6px] max-sm:col-span-1">
            <span className={lbl}>
              องค์กรผู้รับผลประโยชน์
              <Req />
            </span>
            <div className={`flex items-center gap-[6px] rounded-[8px] border px-[14px] ${locked ? 'border-gray-line bg-gray-bg' : e.org ? 'border-red-00 bg-white' : 'border-gray-line bg-white focus-within:border-blue-00'}`}>
              <input aria-label="องค์กรผู้รับผลประโยชน์" list="org-list" disabled={locked} className="h-[44px] min-w-0 flex-1 bg-transparent text-[14px] font-light outline-none" value={p.org.org} onChange={(ev) => setOrg('org', ev.target.value)} />
              <img src={iconSearch} alt="" width={18} height={18} />
              <datalist id="org-list">
                {orgRegister.map((o) => (
                  <option key={o.org} value={o.org} />
                ))}
              </datalist>
            </div>
            {e.org && <span role="alert" className="text-[12px] text-red-00">{e.org}</span>}
          </div>
          {fld('houseNo', 'เลขที่')}
          {fld('moo', 'หมู่')}
          {fld('road', 'ถนน')}
          {fld('soi', 'ตรอก/ซอย')}
          {fld('district', 'อำเภอ/เขต')}
          {fld('subdistrict', 'ตำบล/แขวง')}
          {fld('coordinator', 'ผู้ประสานงาน *', { err: e.coordinator })}
          {fld('phone', 'เบอร์โทรศัพท์ *', { err: e.phone, inputMode: 'numeric' })}
          {fld('fax', 'โทรสาร')}
        </div>
      </PmSection>

      <PmSection title="พื้นที่สำรวจ">
        <div className="grid grid-cols-2 gap-[16px] max-sm:grid-cols-1">
          <Field label="รหัสพื้นที่">
            <input className={roField} readOnly aria-label="รหัสพื้นที่" value={prov ? `${p.fiscalYear}-${prov.code}` : ''} placeholder="เลือกจังหวัดเพื่อสร้างรหัส" />
          </Field>
          <Field label="ภาค">
            <input className={roField} readOnly aria-label="ภาค" value={prov?.region ?? ''} placeholder="ภาค" />
          </Field>
          <div className="flex flex-col gap-[6px]">
            <span className={lbl}>จังหวัด</span>
            <div className={locked ? 'pointer-events-none opacity-60' : ''}>
              <Select label="จังหวัด" value={p.area.province} placeholder="จังหวัด" options={mapProvinces.map((x) => ({ value: x.name, label: x.name }))} onChange={(v) => setP({ ...p, area: { ...(p.area ?? blankArea()), province: v } })} />
            </div>
            {e.province && <span role="alert" className="text-[12px] text-red-00">{e.province}</span>}
          </div>
          <Field label="อำเภอ">
            <input aria-label="อำเภอ" disabled={locked} className={locked ? roField : field} value={p.area.district} placeholder="อำเภอ" onChange={(ev) => setP({ ...p, area: { ...p.area, district: ev.target.value } })} />
          </Field>
          <Field label="ตำบล">
            <input aria-label="ตำบล" disabled={locked} className={locked ? roField : field} value={p.area.subdistrict} placeholder="ตำบล" onChange={(ev) => setP({ ...p, area: { ...p.area, subdistrict: ev.target.value } })} />
          </Field>
        </div>
      </PmSection>

      <div className="flex justify-end gap-[8px]">
        <button type="button" className={softBtn} onClick={() => setPreview(true)}>
          <img src={iconEye} alt="" width={16} height={16} />
          ตัวอย่าง
        </button>
        {!locked && (
          <>
            <button type="button" className={softBtn} onClick={saveDraft}>
              บันทึกแบบร่าง
            </button>
            <button type="button" className={primaryBtn} onClick={submit}>
              <img src={iconSend} alt="" width={16} height={16} className="brightness-0 invert" />
              บันทึกและส่งข้อมูล
            </button>
          </>
        )}
      </div>

      <Modal open={preview} title="ตัวอย่างข้อมูลที่ยื่นเสนอ" onClose={() => setPreview(false)}>
        <dl className="grid grid-cols-[130px_minmax(0,1fr)] gap-x-[12px] gap-y-[8px] text-[13px] leading-[1.5]">
          {[
            ['รหัสโครงการ', p.code],
            ['ชื่อโครงการ', p.name || '–'],
            ['ปีงบประมาณ / ประเภท', `${p.fiscalYear} · ${p.type}`],
            ['องค์กรผู้เสนอ', p.org.org || '–'],
            ['ที่อยู่', `${p.org.houseNo} ม.${p.org.moo} ${p.org.road} ${p.org.soi} ต.${p.org.subdistrict} อ.${p.org.district} จ.${p.org.province || p.area.province}`.replace(/\s+/g, ' ')],
            ['ผู้ประสานงาน', `${p.org.coordinator || '–'} โทร ${p.org.phone || '–'}`],
            ['พื้นที่สำรวจ', `${prov?.region ?? '–'} · จ.${p.area.province || '–'} อ.${p.area.district || '–'} ต.${p.area.subdistrict || '–'}`],
          ].map(([k, v]) => (
            <div key={k} className="contents">
              <dt className="font-medium text-gray-20">{k}</dt>
              <dd className="font-light text-black">{v}</dd>
            </div>
          ))}
        </dl>
      </Modal>
      <Modal open={importing} title="นำเข้าข้อมูลองค์กร" onClose={() => setImporting(false)}>
        <p className="text-[12px] font-light text-gray-20">เลือกองค์กรจากทะเบียนองค์กรชุมชนเพื่อเติมข้อมูลอัตโนมัติ</p>
        <ul className="flex flex-col gap-[6px]">
          {orgRegister.map((o) => (
            <li key={o.org}>
              <button type="button" onClick={() => pick(o)} className="flex w-full flex-col gap-[2px] rounded-[10px] border border-gray-line px-[14px] py-[10px] text-left transition-colors hover:border-blue-10 hover:bg-blue-bg">
                <span className="text-[14px] font-medium text-black">{o.org}</span>
                <span className="text-[12px] font-light text-gray-20">
                  ต.{o.subdistrict} อ.{o.district} จ.{o.province} · {o.coordinator}
                </span>
              </button>
            </li>
          ))}
        </ul>
      </Modal>
      <ConfirmDialog open={askClear} danger title="ล้างข้อมูลที่กรอก?" confirm="ล้างข้อมูล" text="ข้อมูลองค์กรและพื้นที่สำรวจที่กรอกไว้จะถูกล้างทั้งหมด" onClose={() => setAskClear(false)} onConfirm={() => (setP({ ...p, name: '', org: blankOrg(), area: blankArea(p.fiscalYear) }), setAskClear(false))} />
      {toast}
    </div>
  )
}
