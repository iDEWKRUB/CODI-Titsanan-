import { useState, type ReactNode } from 'react'
import { useNavigate } from 'react-router-dom'
import DigitBoxes from '../components/community/DigitBoxes'
import { useToast } from '../components/leader/Parts'
import Select from '../components/ui/Select'
import { Btn, Crumbs, DropZone, Gate, HPersonaSwitch, Radios, Title, card, ctl, err, page } from '../components/hr/Parts'
import { depts, empTypes, positions, prefixes, validThaiId, type Employee } from '../data/erpHr'
import { emps, useHPersona } from '../lib/hrStore'

const MAX = 70
function Fold({ title, open, onToggle, children }: { title: string; open: boolean; onToggle: () => void; children: ReactNode }) {
  return (
    <div className="rounded-[12px] border border-gray-line-2">
      <button type="button" aria-expanded={open} onClick={onToggle} className="flex w-full items-center justify-between px-[16px] py-[12px] text-[13px] font-semibold">{title}<span className={`transition ${open ? 'rotate-180' : ''}`}>▾</span></button>
      {open && <div className="flex flex-col gap-[10px] border-t border-gray-line-2 p-[16px]">{children}</div>}
    </div>
  )
}

/** เพิ่มพนักงานใหม่ (book 3 fig 2-41) — 2.1.6.12 */
export default function HrEmployeeNewPage() {
  const me = useHPersona()
  const navigate = useNavigate()
  const [toast, show] = useToast()
  const [v, setV] = useState({ prefix: 'นาย', firstTh: '', lastTh: '', firstEn: '', lastEn: '', idType: 'id' as 'id' | 'passport', idNo: '', dept: '', empType: '', position: '', phone: '', email: '', address: '', homeAddress: '', start: '', salary: '' })
  const [files, setFiles] = useState<string[]>([])
  const [photo, setPhoto] = useState('')
  const [open, setOpen] = useState({ c: true, a: false, s: true })
  const [errors, setErrors] = useState<Record<string, string>>({})
  const set = (p: Partial<typeof v>) => setV((s) => ({ ...s, ...p }))
  const allowed = me === 'hr'
  const cls = (k: string) => `${ctl} ${errors[k] ? err : ''}`
  const name = (k: 'firstTh' | 'lastTh' | 'firstEn' | 'lastEn', label: string) => (
    <label className="flex flex-col gap-[4px]">
      <span className="flex justify-between text-[11px] font-semibold">{label}<span className="font-urbanist font-light text-gray-20">{`${v[k].length}/${MAX}`}</span></span>
      <input aria-label={label} maxLength={MAX} className={cls(k)} value={v[k]} onChange={(e) => set({ [k]: e.target.value })} />
      {errors[k] && <span role="alert" className="text-[11px] text-red-00">{errors[k]}</span>}
    </label>
  )
  const save = () => {
    if (!allowed) return show('ต้องเป็นเจ้าหน้าที่สำนักทรัพยากรบุคคล')
    const e: Record<string, string> = {}
    if (!v.firstTh.trim()) e.firstTh = 'กรุณาระบุชื่อภาษาไทย'
    if (!v.lastTh.trim()) e.lastTh = 'กรุณาระบุนามสกุลภาษาไทย'
    if (v.firstEn && !/^[A-Za-z .'-]+$/.test(v.firstEn)) e.firstEn = 'ใช้ตัวอักษรภาษาอังกฤษเท่านั้น'
    if (v.lastEn && !/^[A-Za-z .'-]+$/.test(v.lastEn)) e.lastEn = 'ใช้ตัวอักษรภาษาอังกฤษเท่านั้น'
    if (v.idType === 'id' ? !validThaiId(v.idNo) : !/^[A-Z0-9]{6,9}$/.test(v.idNo)) e.idNo = v.idType === 'id' ? 'เลขบัตรประชาชนไม่ถูกต้อง (ตรวจหลักตรวจสอบแล้ว)' : 'เลขหนังสือเดินทาง 6–9 ตัวอักษร'
    else if (emps.all().some((x) => x.idNo === v.idNo)) e.idNo = 'มีพนักงานที่ใช้เลขนี้แล้ว'
    if (!v.dept) e.dept = 'กรุณาเลือกแผนก'
    if (!v.empType) e.empType = 'กรุณาเลือกประเภทพนักงาน'
    if (!v.position) e.position = 'กรุณาเลือกตำแหน่ง'
    if (v.email && !/^\S+@\S+\.\S+$/.test(v.email)) e.email = 'อีเมลไม่ถูกต้อง'
    if (v.phone && !/^0\d{8,9}$/.test(v.phone.replace(/\D/g, ''))) e.phone = 'เบอร์โทรศัพท์ไม่ถูกต้อง'
    if (!v.start) e.start = 'กรุณาระบุวันที่เริ่มงาน'
    if (!(Number(v.salary) > 0)) e.salary = 'กรุณาระบุเงินเดือน'
    setErrors(e)
    if (Object.keys(e).length) { if (e.email || e.phone) setOpen((o) => ({ ...o, c: true })); if (e.start || e.salary) setOpen((o) => ({ ...o, s: true })); return show('กรุณาตรวจสอบข้อมูลที่ไม่ถูกต้อง') }
    const id = emps.next()
    const rec: Employee = { id, code: `E-${String(500 + id).padStart(4, '0')}`, prefix: v.prefix, firstTh: v.firstTh.trim(), lastTh: v.lastTh.trim(), firstEn: v.firstEn.trim(), lastEn: v.lastEn.trim(), idType: v.idType, idNo: v.idNo, idFile: files.join(', '), dept: v.dept, empType: v.empType, position: v.position, phone: v.phone, email: v.email, address: v.address, homeAddress: v.homeAddress, start: v.start, salary: Number(v.salary), account: '', photo }
    emps.save(rec)
    show(`เพิ่มพนักงาน ${rec.code} แล้ว · จะถูกนำเข้ารอบเงินเดือนถัดไป`)
    setTimeout(() => navigate('/hr'), 1300)
  }
  const pick = (k: 'dept' | 'empType' | 'position', label: string, opts: string[]) => <div className="flex flex-col gap-[4px]"><span className="text-[11px] font-semibold">{label}</span><Select label={label} value={v[k]} placeholder={label} options={opts.map((o) => ({ value: o, label: o }))} onChange={(x) => set({ [k]: x })} />{errors[k] && <span role="alert" className="text-[11px] text-red-00">{errors[k]}</span>}</div>
  return (
    <div className={`${page} items-center`}>
      <div className="flex w-full max-w-[860px] flex-col gap-[12px]">
        <Title back="/hr" right={<HPersonaSwitch />}>เพิ่มพนักงานใหม่</Title>
        <Crumbs items={[{ label: 'หน้าแรก', to: '/hr' }, { label: 'เพิ่มพนักงานใหม่' }]} />
        <Gate allowed={allowed} need="เจ้าหน้าที่สำนักทรัพยากรบุคคล" />
        <fieldset disabled={!allowed} className={`${card} flex flex-col gap-[14px] p-[22px] max-sm:p-[14px]`}>
          <div className="flex justify-center">
            <label className="relative flex size-[84px] cursor-pointer items-center justify-center overflow-hidden rounded-full bg-gray-bg text-gray-20" aria-label="ภาพโปรไฟล์">
              {photo ? <img src={photo} alt="" className="size-full object-cover" /> : <svg width="34" height="34" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" aria-hidden="true"><circle cx="12" cy="8" r="4" /><path d="M4 21c0-4 4-6 8-6s8 2 8 6" /></svg>}
              <input type="file" accept="image/*" hidden onChange={(e) => { const f = e.target.files?.[0]; if (f) { const r = new FileReader(); r.onload = () => setPhoto(String(r.result)); r.readAsDataURL(f) } }} />
              <span className="absolute right-[6px] bottom-[6px] size-[14px] rounded-full bg-[#17c3a1] ring-2 ring-white" />
            </label>
          </div>
          <div className="w-[150px] flex flex-col gap-[4px]"><span className="text-[11px] font-semibold">คำนำหน้า</span><Select label="คำนำหน้า" value={v.prefix} options={prefixes.map((p) => ({ value: p, label: p }))} onChange={(p) => set({ prefix: p })} /></div>
          <div className="grid grid-cols-2 gap-[12px] max-sm:grid-cols-1">{name('firstTh', 'ชื่อจริงภาษาไทย *')}{name('lastTh', 'นามสกุลภาษาไทย *')}{name('firstEn', 'ชื่อจริงภาษาอังกฤษ')}{name('lastEn', 'นามสกุลภาษาอังกฤษ')}</div>
          <Radios label="ประเภทเอกสารระบุตัวตน" value={v.idType} options={[{ key: 'id', label: 'เลขบัตรประชาชน' }, { key: 'passport', label: 'เลขที่หนังสือเดินทาง' }]} onChange={(k) => set({ idType: k, idNo: '' })} />
          {v.idType === 'id' ? <DigitBoxes value={v.idNo} groups={[1, 4, 5, 2, 1]} onChange={(x) => set({ idNo: x })} label="เลขบัตรประชาชน" invalid={!!errors.idNo} /> : <input aria-label="เลขที่หนังสือเดินทาง" className={`${cls('idNo')} max-w-[260px] font-urbanist uppercase`} value={v.idNo} onChange={(e) => set({ idNo: e.target.value.toUpperCase() })} />}
          {errors.idNo && <span role="alert" className="text-[11px] text-red-00">{errors.idNo}</span>}
          <DropZone files={files} onChange={setFiles} label="อัปโหลดไฟล์บัตรประชาชน" />
          <div className="grid grid-cols-3 gap-[12px] max-md:grid-cols-1">{pick('dept', 'แผนก', depts)}{pick('empType', 'ประเภทพนักงาน', empTypes)}{pick('position', 'ตำแหน่ง', positions)}</div>
          <Fold title="ข้อมูลติดต่อ" open={open.c} onToggle={() => setOpen({ ...open, c: !open.c })}>
            <div className="grid grid-cols-2 gap-[12px] max-sm:grid-cols-1">
              <label className="flex flex-col gap-[4px] text-[11px] font-semibold">โทรศัพท์<input aria-label="โทรศัพท์" inputMode="tel" className={cls('phone')} value={v.phone} onChange={(e) => set({ phone: e.target.value })} />{errors.phone && <span role="alert" className="font-normal text-red-00">{errors.phone}</span>}</label>
              <label className="flex flex-col gap-[4px] text-[11px] font-semibold">อีเมล<input aria-label="อีเมล" inputMode="email" className={cls('email')} value={v.email} onChange={(e) => set({ email: e.target.value })} />{errors.email && <span role="alert" className="font-normal text-red-00">{errors.email}</span>}</label>
            </div>
          </Fold>
          <Fold title="ข้อมูลที่อยู่" open={open.a} onToggle={() => setOpen({ ...open, a: !open.a })}>
            <label className="flex flex-col gap-[4px] text-[11px] font-semibold">ที่อยู่ปัจจุบัน<input aria-label="ที่อยู่ปัจจุบัน" className={ctl} value={v.address} onChange={(e) => set({ address: e.target.value })} /></label>
            <label className="flex flex-col gap-[4px] text-[11px] font-semibold">ที่อยู่ตามทะเบียนบ้าน<input aria-label="ที่อยู่ตามทะเบียนบ้าน" className={ctl} value={v.homeAddress} onChange={(e) => set({ homeAddress: e.target.value })} /></label>
            <button type="button" onClick={() => set({ homeAddress: v.address })} className="w-fit text-[11px] text-blue-00 hover:underline">ใช้ที่อยู่เดียวกับที่อยู่ปัจจุบัน</button>
          </Fold>
          <Fold title="ข้อมูลวันที่เริ่มงาน" open={open.s} onToggle={() => setOpen({ ...open, s: !open.s })}>
            <div className="grid grid-cols-2 gap-[12px] max-sm:grid-cols-1">
              <label className="flex flex-col gap-[4px] text-[11px] font-semibold">วันที่เริ่มงาน *<input type="date" aria-label="วันที่เริ่มงาน" className={cls('start')} value={v.start} onChange={(e) => set({ start: e.target.value })} />{errors.start && <span role="alert" className="font-normal text-red-00">{errors.start}</span>}</label>
              <label className="flex flex-col gap-[4px] text-[11px] font-semibold">เงินเดือนเริ่มต้น (บาท) *<input aria-label="เงินเดือนเริ่มต้น" inputMode="decimal" className={`${cls('salary')} text-right font-urbanist`} value={v.salary} onChange={(e) => set({ salary: e.target.value.replace(/[^\d.]/g, '') })} />{errors.salary && <span role="alert" className="font-normal text-red-00">{errors.salary}</span>}</label>
            </div>
          </Fold>
        </fieldset>
        <div className="flex justify-end gap-[10px]"><Btn kind="ghost" onClick={() => navigate('/hr')}>ยกเลิก</Btn><Btn onClick={save}>ถัดไป →</Btn></div>
      </div>
      {toast}
    </div>
  )
}
