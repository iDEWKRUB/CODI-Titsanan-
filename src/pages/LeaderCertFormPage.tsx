import { useRef, useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import iconEye from '../assets/survey/icon-eye.svg'
import iconSave from '../assets/meeting/d-check-sm.svg'
import CertTemplate from '../components/leader/CertTemplate'
import { BackTitle, Board, EditableText, Field, lbl, page, primaryBtn, softBtn, useToast } from '../components/leader/Parts'
import { field } from '../components/meeting/FormParts'
import { DateInput } from '../components/ui/DateTimeInputs'
import Select from '../components/ui/Select'
import { certTemplates, type Certificate } from '../data/leader'
import { addCertLog, getCert, nextCertId, saveCert, updateCourse, useCourses } from '../lib/leaderStore'
import { CertPreview } from './LeaderCertPage'

const days = (a: string, b: string) => Math.max(1, Math.round((new Date(b).getTime() - new Date(a).getTime()) / 86400000) + 1)

export default function LeaderCertFormPage() {
  const { id } = useParams()
  const navigate = useNavigate()
  const courses = useCourses().filter((c) => c.status !== 'draft')
  const existing = id ? getCert(Number(id)) : undefined
  const [cert, setCert] = useState<Certificate>(
    () => existing ?? { id: nextCertId(), name: '', template: 1, year: '2568', days: '', issueDate: '', signerFirst: '', signerLast: '', status: 'draft', createdAt: new Date().toISOString().slice(0, 10) },
  )
  const [tried, setTried] = useState(false)
  const [preview, setPreview] = useState(false)
  const [toast, showToast] = useToast()
  const rail = useRef<HTMLUListElement>(null)
  const isNew = useRef(!existing)

  const set = <K extends keyof Certificate>(k: K, v: Certificate[K]) => setCert((c) => ({ ...c, [k]: v }))
  const errors: Record<string, string> = {}
  if (!cert.name.trim()) errors.name = 'กรุณาระบุชื่อหลักสูตร'
  if (!(Number(cert.days) > 0)) errors.days = 'กรุณาระบุระยะเวลา'
  if (!cert.issueDate) errors.issueDate = 'กรุณาเลือกวันที่ออกใบรับรอง'
  if (!cert.signerFirst.trim() || !cert.signerLast.trim()) errors.signer = 'กรุณาระบุชื่อและนามสกุลผู้รับรอง'
  const e = tried ? errors : {}

  const link = (cid: string) => {
    if (cid === 'none') return set('courseId', undefined)
    const c = courses.find((x) => x.id === Number(cid))
    if (!c) return
    setCert((p) => ({ ...p, courseId: c.id, name: c.name, days: String(days(c.startDate, c.endDate || c.startDate)), issueDate: c.endDate || c.startDate }))
  }

  const draft = () => {
    saveCert({ ...cert, status: cert.status === 'published' ? 'published' : 'draft' })
    if (isNew.current) {
      addCertLog('สร้างใบรับรอง')
      isNew.current = false
    }
    showToast('บันทึกแบบร่างแล้ว')
  }
  const confirm = () => {
    setTried(true)
    if (Object.keys(errors).length) return showToast('กรุณากรอกข้อมูลให้ครบ')
    saveCert({ ...cert, status: 'published' })
    addCertLog(`ออกใบรับรอง หลักสูตร${cert.name}`)
    // everyone who passed the linked course now holds the certificate
    if (cert.courseId) updateCourse(cert.courseId, (c) => ({ ...c, attendees: c.attendees.map((a) => (a.post === 'pass' ? { ...a, certified: true } : a)) }))
    navigate('/leader/certificate')
  }
  const scroll = (d: number) => rail.current?.scrollBy({ left: d * 260, behavior: 'smooth' })

  return (
    <div className={page}>
      <BackTitle title={existing ? 'แก้ไขใบรับรอง' : 'สร้างใบรับรอง'} to="/leader/certificate" />
      <p className="-mt-[8px] text-[12px] font-light text-gray-20">
        <Link to="/leader/certificate" className="hover:underline">ออกใบรับรอง</Link> / {existing ? 'แก้ไขใบรับรอง' : 'สร้างใบรับรอง'}
      </p>

      <Board title="เลือกรูปแบบใบรับรอง" bare>
        <div className="relative rounded-[12px] bg-white p-[12px]">
          <button type="button" aria-label="เลื่อนไปทางซ้าย" onClick={() => scroll(-1)} className="absolute top-1/2 left-[4px] z-10 flex size-[28px] -translate-y-1/2 items-center justify-center rounded-[8px] bg-blue-bg text-blue-00 shadow hover:bg-blue-20">
            ←
          </button>
          <ul ref={rail} className="flex snap-x gap-[12px] overflow-x-auto px-[28px] py-[4px] scrollbar-none">
            {certTemplates.map((t, i) => (
              <li key={t} className="shrink-0 snap-start">
                <button
                  type="button"
                  aria-pressed={cert.template === i}
                  aria-label={t}
                  onClick={() => set('template', i)}
                  className={`block w-[220px] overflow-hidden rounded-[8px] border-2 transition focus-visible:outline-2 focus-visible:outline-blue-00 ${cert.template === i ? 'border-blue-00 shadow-[0_2px_10px_rgba(0,133,249,0.35)]' : 'border-transparent hover:border-blue-10'}`}
                >
                  <CertTemplate index={i} course={cert.name || 'ชื่อหลักสูตร'} className="block w-full" />
                </button>
              </li>
            ))}
          </ul>
          <button type="button" aria-label="เลื่อนไปทางขวา" onClick={() => scroll(1)} className="absolute top-1/2 right-[4px] z-10 flex size-[28px] -translate-y-1/2 items-center justify-center rounded-[8px] bg-blue-bg text-blue-00 shadow hover:bg-blue-20">
            →
          </button>
        </div>
      </Board>

      <Board bare>
        <div className="flex flex-col gap-[20px] rounded-[12px] bg-white p-[24px] max-sm:p-[16px]">
          <div className="flex flex-col gap-[6px]">
            <span className={lbl}>เชื่อมกับหลักสูตรที่เปิดอบรม (ถ้ามี)</span>
            <Select label="เชื่อมกับหลักสูตร" value={cert.courseId ? String(cert.courseId) : 'none'} options={[{ value: 'none', label: 'ไม่เชื่อม — กรอกเอง' }, ...courses.map((c) => ({ value: String(c.id), label: c.name }))]} onChange={link} />
            <p className="text-[11px] font-light text-gray-20">เมื่อกดยืนยัน ผู้เข้าอบรมที่ผล Post-test ผ่านในหลักสูตรนี้จะมีสิทธิ์รับใบรับรองทุกคน</p>
          </div>
          <div className="flex flex-col gap-[4px]">
            <span className={lbl}>ชื่อหลักสูตร</span>
            <EditableText big label="ชื่อหลักสูตร" value={cert.name} placeholder="ชื่อหลักสูตร..." onChange={(v) => set('name', v)} />
            {e.name && <span role="alert" className="text-[12px] font-light text-red-00">{e.name}</span>}
          </div>
          <div className="grid grid-cols-2 gap-[16px] max-sm:grid-cols-1">
            <div className="flex flex-col gap-[6px]">
              <span className={lbl}>ระยะเวลา</span>
              <div className="flex items-center gap-[10px]">
                <input aria-label="ระยะเวลา (วัน)" inputMode="numeric" className={`${field} ${e.days ? 'border-red-00' : ''}`} value={cert.days} onChange={(ev) => set('days', ev.target.value.replace(/\D/g, ''))} />
                <span className="text-[14px] font-light text-gray-20">วัน</span>
              </div>
              {e.days && <span role="alert" className="text-[12px] font-light text-red-00">{e.days}</span>}
            </div>
            <div className="flex flex-col gap-[6px]">
              <span className={lbl}>ออกใบรับรอง ณ วันที่</span>
              <DateInput label="วันที่ออกใบรับรอง" value={cert.issueDate} onChange={(v) => set('issueDate', v)} />
              {e.issueDate && <span role="alert" className="text-[12px] font-light text-red-00">{e.issueDate}</span>}
            </div>
          </div>
          <div className="flex flex-col gap-[6px]">
            <span className={lbl}>ชื่อผู้รับรองหลักสูตร</span>
            <div className="grid grid-cols-2 gap-[12px] max-sm:grid-cols-1">
              <Field label="">
                <input aria-label="ชื่อผู้รับรอง" className={`${field} ${e.signer ? 'border-red-00' : ''}`} placeholder="ชื่อ" value={cert.signerFirst} onChange={(ev) => set('signerFirst', ev.target.value)} />
              </Field>
              <Field label="">
                <input aria-label="นามสกุลผู้รับรอง" className={`${field} ${e.signer ? 'border-red-00' : ''}`} placeholder="นามสกุล" value={cert.signerLast} onChange={(ev) => set('signerLast', ev.target.value)} />
              </Field>
            </div>
            {e.signer && <span role="alert" className="text-[12px] font-light text-red-00">{e.signer}</span>}
          </div>
          <div className="flex flex-wrap gap-[8px]">
            <button type="button" className={primaryBtn} onClick={draft}>
              <img src={iconSave} alt="" width={16} height={16} className="brightness-0 invert" />
              บันทึกแบบร่าง
            </button>
            <button type="button" className={softBtn} onClick={() => setPreview(true)}>
              <img src={iconEye} alt="" width={16} height={16} />
              ตัวอย่าง
            </button>
          </div>
        </div>
      </Board>

      <div className="flex justify-end">
        <button type="button" className={primaryBtn} onClick={confirm}>
          <img src={iconSave} alt="" width={16} height={16} className="brightness-0 invert" />
          ยืนยัน
        </button>
      </div>
      <CertPreview cert={preview ? cert : null} onClose={() => setPreview(false)} />
      {toast}
    </div>
  )
}
