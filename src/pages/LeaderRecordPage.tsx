import { useMemo, useRef, useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import iconSearch from '../assets/dashboard/icon-search.svg'
import iconSort from '../assets/dashboard/icon-sort.svg'
import iconDoc from '../assets/meeting/c-file-text.svg'
import iconImage from '../assets/meeting/e-image.svg'
import iconX from '../assets/meeting/e-x.svg'
import iconPlus from '../assets/survey/icon-plus.svg'
import iconQr from '../assets/builder/icon-qr.svg'
import iconTrash from '../assets/survey/icon-trash.svg'
import iconUpload from '../assets/meeting/c-upload.svg'
import iconSearchBlue from '../assets/dashboard/icon-search.svg'
import { BackTitle, Board, ConfirmDialog, CourseBanner, Field, lbl, page, primaryBtn, ScoreSelect, SegTabs, softBtn, useToast } from '../components/leader/Parts'
import { field, QrModal } from '../components/meeting/FormParts'
import Modal from '../components/ui/Modal'
import Pagination from '../components/ui/Pagination'
import Select from '../components/ui/Select'
import { courseStatusLabel, fmt, thaiLong, type Attendee, type Course, type Score } from '../data/leader'
import { uid } from '../data/surveyBuilder'
import { mapProvinces } from '../data/thaiMap'
import { getCourse, updateCourse, useCourses } from '../lib/leaderStore'

type Tab = 'register' | 'data' | 'expense'
const PAGE_SIZE = 5
const num = (s: string) => Number(s.replace(/,/g, '')) || 0

function Medal({ on }: { on: boolean }) {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke={on ? '#0085f9' : '#b3b7ba'} strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" role="img" aria-label={on ? 'มีสิทธิ์รับใบรับรอง' : 'ยังไม่มีสิทธิ์รับใบรับรอง'}>
      <circle cx="12" cy="9" r="5.5" fill={on ? '#e8f5ff' : 'none'} />
      <path d="m8.8 13.6-1.8 7 5-2.6 5 2.6-1.8-7" />
      <path d="m10 9 1.6 1.6L14.4 7.6" />
    </svg>
  )
}

/** /leader/record — choose which course to record */
function Picker() {
  const courses = useCourses().filter((c) => c.status !== 'draft')
  return (
    <div className={page}>
      <BackTitle title="บันทึกการอบรม" to="/leader" />
      <p className="text-[13px] font-light text-gray-20">เลือกหลักสูตรที่ต้องการลงทะเบียนผู้เข้าอบรม บันทึกผลการประเมิน และแนบเอกสาร (แผนที่ยังเป็นแบบร่างจะแสดงเมื่อส่งขออนุมัติแล้ว)</p>
      <ul className="flex flex-col gap-[8px]">
        {courses.map((c) => (
          <li key={c.id}>
            <Link to={`/leader/record/${c.id}`} className="flex flex-wrap items-center gap-[12px] rounded-[12px] border border-gray-line bg-white p-[16px] transition hover:border-blue-10 hover:shadow-[0_2px_10px_rgba(0,133,249,0.12)]">
              <span className="min-w-0 flex-1">
                <span className="block text-[14px] font-medium text-black">{c.name}</span>
                <span className="text-[12px] font-light text-gray-20">
                  {c.place || '–'} · {thaiLong(c.startDate)} · ผู้เข้าอบรม {c.attendees.length} คน
                </span>
              </span>
              <span className={`rounded-[6px] px-[8px] py-[4px] text-[12px] font-light text-gray-bg ${c.status === 'open' ? 'bg-yellow' : 'bg-green'}`}>{courseStatusLabel[c.status]}</span>
            </Link>
          </li>
        ))}
        {courses.length === 0 && <li className="rounded-[12px] bg-gray-subtle p-[32px] text-center text-[13px] text-gray-20">ยังไม่มีหลักสูตรที่เปิดดำเนินการ — ส่งแผนขออนุมัติที่เมนู “จัดทำแผนการอบรม” ก่อน</li>}
      </ul>
    </div>
  )
}

function Register({ c, onToast }: { c: Course; onToast: (m: string) => void }) {
  const [query, setQuery] = useState('')
  const [pg, setPg] = useState(1)
  const [adding, setAdding] = useState(false)
  const [draft, setDraft] = useState({ firstName: '', lastName: '', province: 'เชียงใหม่', community: '' })
  const [qr, setQr] = useState<null | 'in' | 'out' | 'pre' | 'post'>(null)
  const [removing, setRemoving] = useState<Attendee | null>(null)

  const origin = window.location.origin
  const edit = (id: number, p: Partial<Attendee>) => updateCourse(c.id, (x) => ({ ...x, attendees: x.attendees.map((a) => (a.id === id ? { ...a, ...p } : a)) }))
  const list = useMemo(() => {
    const q = query.trim().toLowerCase()
    return c.attendees.filter((a) => !q || `${a.firstName} ${a.lastName}`.toLowerCase().includes(q))
  }, [c.attendees, query])
  const pageCount = Math.max(1, Math.ceil(list.length / PAGE_SIZE))
  const current = Math.min(pg, pageCount)
  const rows = list.slice((current - 1) * PAGE_SIZE, current * PAGE_SIZE)

  const add = () => {
    if (!draft.firstName.trim() || !draft.lastName.trim()) return
    const id = c.attendees.reduce((n, a) => Math.max(n, a.id), 0) + 1
    updateCourse(c.id, (x) => ({ ...x, attendees: [...x.attendees, { id, firstName: draft.firstName.trim(), lastName: draft.lastName.trim(), province: draft.province, community: draft.community.trim(), verified: false, pre: 'wait', post: 'wait', certified: false }] }))
    setAdding(false)
    setDraft({ firstName: '', lastName: '', province: draft.province, community: '' })
    onToast('เพิ่มรายชื่อแล้ว')
  }

  const testCard = (kind: 'pre' | 'post') => (
    <button
      type="button"
      onClick={() => setQr(kind)}
      className={`flex items-center gap-[12px] rounded-[10px] px-[16px] py-[18px] text-left text-white-soft transition hover:brightness-105 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-00 ${kind === 'pre' ? 'bg-yellow' : 'bg-green'}`}
    >
      <img src={iconQr} alt="" width={24} height={24} className="brightness-0 invert" />
      <span className="flex flex-col leading-[1.3]">
        <b className="text-[14px] font-semibold">{kind === 'pre' ? 'ก่อนการอบรม' : 'หลังการอบรม'}</b>
        <span className="text-[10px] font-light">{kind === 'pre' ? 'Pre-Test' : 'Post-Test'}</span>
      </span>
    </button>
  )

  const manual = (mode: 'in' | 'out') => (
    <div className="flex max-h-[220px] w-full flex-col gap-[4px] overflow-y-auto">
      <p className="text-[12px] font-medium text-gray-20">หรือลงชื่อแทนผู้เข้าอบรม</p>
      {c.attendees.length === 0 && <p className="text-[12px] font-light text-gray-20">ยังไม่มีรายชื่อ</p>}
      {c.attendees.map((a) => {
        const on = mode === 'in' ? a.verified : !!a.signedOut
        return (
          <div key={a.id} className="flex items-center gap-[8px] rounded-[8px] px-[8px] py-[4px] text-[13px] hover:bg-gray-subtle">
            <span className="min-w-0 flex-1 truncate">
              {a.firstName} {a.lastName}
            </span>
            <button type="button" aria-pressed={on} onClick={() => edit(a.id, mode === 'in' ? { verified: !a.verified } : { signedOut: !a.signedOut })} className={`rounded-[6px] px-[10px] py-[4px] text-[12px] font-medium ${on ? 'bg-green-bg text-green-text' : 'bg-blue-bg text-blue-00'}`}>
              {on ? (mode === 'in' ? 'ลงชื่อเข้าแล้ว' : 'ลงชื่อออกแล้ว') : mode === 'in' ? 'ลงชื่อเข้า' : 'ลงชื่อออก'}
            </button>
          </div>
        )
      })}
    </div>
  )

  return (
    <>
      <CourseBanner name={c.name} />
      <section className="flex flex-col gap-[8px] rounded-[12px] bg-blue-bg p-[8px]">
        <h2 className="px-[8px] pt-[4px] text-[14px] font-semibold text-black">แบบประเมินการอบรม</h2>
        <div className="grid grid-cols-2 gap-[8px] max-sm:grid-cols-1">
          {testCard('pre')}
          {testCard('post')}
        </div>
      </section>

      <div className="flex flex-wrap items-center gap-[8px]">
        <label className="flex w-[283px] min-w-0 items-center gap-[6px] rounded-[8px] border border-gray-line bg-gray-subtle px-[16px] py-[10px] transition-colors focus-within:border-blue-00 focus-within:bg-white max-sm:w-full">
          <span className="sr-only">ค้นหารายชื่อ</span>
          <input type="search" value={query} onChange={(e) => (setQuery(e.target.value), setPg(1))} placeholder="ค้นหารายชื่อ" className="min-w-0 flex-1 bg-transparent text-[12px] font-light text-gray-30 outline-none placeholder:text-gray-20 [&::-webkit-search-cancel-button]:hidden" />
          <img src={iconSearchBlue} alt="" width={18} height={18} />
        </label>
        <button type="button" className={softBtn} onClick={() => setAdding(true)}>
          <img src={iconPlus} alt="" width={14} height={14} className="[filter:invert(36%)_sepia(98%)_saturate(2879%)_hue-rotate(200deg)]" />
          เพิ่มรายชื่อ
        </button>
        <div className="ml-auto flex gap-[8px] max-sm:ml-0 max-sm:w-full">
          <button type="button" className={`${primaryBtn} max-sm:flex-1`} onClick={() => setQr('in')}>
            <img src={iconQr} alt="" width={16} height={16} className="brightness-0 invert" />
            ลงชื่อเข้าอบรม
          </button>
          <button type="button" className={`${primaryBtn} max-sm:flex-1`} onClick={() => setQr('out')}>
            <img src={iconQr} alt="" width={16} height={16} className="brightness-0 invert" />
            ลงชื่อออก
          </button>
        </div>
      </div>

      <Board title="รายชื่อผู้เข้าร่วมอบรม" bare>
        <div className="rounded-[12px] bg-white p-[12px]">
          <div className="overflow-x-auto max-md:hidden">
            <table className="w-full min-w-[760px] border-collapse text-left text-[12px] font-light text-black">
              <thead>
                <tr className="text-[10px] text-gray-20">
                  {['ลำดับ', 'ชื่อ', 'นามสกุล', 'พื้นที่', 'ยืนยันตัวตน', 'คะแนนการประเมิน Pre-test', 'คะแนนการประเมิน Post-test'].map((h) => (
                    <th key={h} className="px-[8px] py-[10px] font-light">
                      <span className="flex items-end">
                        {h}
                        <img src={iconSort} alt="" width={12} height={12} />
                      </span>
                    </th>
                  ))}
                  <th className="w-[64px]" />
                </tr>
              </thead>
              <tbody>
                {rows.map((a) => (
                  <tr key={a.id} className="border-t border-gray-line">
                    <td className="px-[8px] py-[12px]">{c.attendees.indexOf(a) + 1}</td>
                    <td className="px-[8px]">{a.firstName}</td>
                    <td className="px-[8px]">
                      {a.lastName}
                      {a.signedOut && <span className="ml-[6px] text-[10px] text-gray-20">(ลงชื่อออกแล้ว)</span>}
                    </td>
                    <td className="px-[8px]">
                      จ.{a.province}
                      {a.community && `, ${a.community}`}
                    </td>
                    <td className="px-[8px]">
                      <button type="button" aria-pressed={a.verified} aria-label={`ยืนยันตัวตน ${a.firstName}`} onClick={() => updateCourse(c.id, (x) => ({ ...x, attendees: x.attendees.map((y) => (y.id === a.id ? { ...y, verified: !y.verified } : y)) }))} className="flex size-[24px] items-center justify-center rounded-full hover:bg-green-bg">
                        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke={a.verified ? '#14c6a4' : '#d4d7d9'} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                          <circle cx="12" cy="12" r="9" />
                          {a.verified && <path d="m8 12.3 2.7 2.7L16 9.5" />}
                        </svg>
                      </button>
                    </td>
                    <td className="px-[8px]">
                      <ScoreSelect label={`Pre-test ${a.firstName}`} value={a.pre} onChange={(s: Score) => edit(a.id, { pre: s })} />
                    </td>
                    <td className="px-[8px]">
                      <ScoreSelect label={`Post-test ${a.firstName}`} value={a.post} onChange={(s: Score) => edit(a.id, { post: s })} />
                    </td>
                    <td className="px-[8px]">
                      <span className="flex items-center justify-end gap-[8px]">
                        <Medal on={a.post === 'pass'} />
                        <button type="button" aria-label={`ลบ ${a.firstName} ${a.lastName}`} onClick={() => setRemoving(a)} className="flex size-[24px] items-center justify-center rounded-[6px] hover:bg-red-20">
                          <img src={iconTrash} alt="" width={14} height={14} />
                        </button>
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <ul className="md:hidden">
            {rows.map((a, i) => (
              <li key={a.id} className={`flex flex-col gap-[8px] py-[12px] ${i > 0 ? 'border-t border-gray-line' : ''}`}>
                <div className="flex items-center gap-[8px]">
                  <p className="min-w-0 flex-1 text-[14px] font-medium">
                    {c.attendees.indexOf(a) + 1}. {a.firstName} {a.lastName}
                  </p>
                  <Medal on={a.post === 'pass'} />
                  <button type="button" aria-label={`ลบ ${a.firstName}`} onClick={() => setRemoving(a)} className="flex size-[28px] items-center justify-center rounded-[6px] hover:bg-red-20">
                    <img src={iconTrash} alt="" width={14} height={14} />
                  </button>
                </div>
                <p className="text-[11px] text-gray-20">จ.{a.province}{a.community && `, ${a.community}`}</p>
                <div className="flex flex-wrap items-center gap-[8px]">
                  <button type="button" aria-pressed={a.verified} onClick={() => edit(a.id, { verified: !a.verified })} className={`rounded-[6px] px-[8px] py-[3px] text-[11px] ${a.verified ? 'bg-green-bg text-green-text' : 'bg-gray-bg text-gray-20'}`}>
                    {a.verified ? 'ยืนยันตัวตนแล้ว' : 'ยังไม่ยืนยันตัวตน'}
                  </button>
                  <ScoreSelect label={`Pre-test ${a.firstName}`} value={a.pre} onChange={(s) => edit(a.id, { pre: s })} />
                  <ScoreSelect label={`Post-test ${a.firstName}`} value={a.post} onChange={(s) => edit(a.id, { post: s })} />
                </div>
              </li>
            ))}
          </ul>
          {rows.length === 0 && <p className="py-[32px] text-center text-[13px] text-gray-20">{c.attendees.length ? 'ไม่พบรายชื่อที่ค้นหา' : 'ยังไม่มีผู้เข้าอบรม กด “เพิ่มรายชื่อ” หรือให้ผู้เข้าอบรมสแกน QR เพื่อลงชื่อเข้า'}</p>}
        </div>
      </Board>
      <Pagination page={current} pageCount={pageCount} onChange={setPg} />

      <Modal open={adding} title="เพิ่มรายชื่อผู้เข้าอบรม" onClose={() => setAdding(false)}>
        <div className="grid grid-cols-2 gap-[12px] max-sm:grid-cols-1">
          <Field label="ชื่อ">
            <input className={field} value={draft.firstName} onChange={(e) => setDraft({ ...draft, firstName: e.target.value })} />
          </Field>
          <Field label="นามสกุล">
            <input className={field} value={draft.lastName} onChange={(e) => setDraft({ ...draft, lastName: e.target.value })} />
          </Field>
          <div className="flex flex-col gap-[6px]">
            <span className={lbl}>จังหวัด</span>
            <Select label="จังหวัด" value={draft.province} options={mapProvinces.map((p) => ({ value: p.name, label: p.name }))} onChange={(v) => setDraft({ ...draft, province: v })} />
          </div>
          <Field label="ชุมชน / ตำบล">
            <input className={field} value={draft.community} placeholder="เช่น ต.สุเทพ" onChange={(e) => setDraft({ ...draft, community: e.target.value })} />
          </Field>
        </div>
        <div className="flex justify-end gap-[8px]">
          <button type="button" className={softBtn} onClick={() => setAdding(false)}>
            ยกเลิก
          </button>
          <button type="button" className={primaryBtn} onClick={add} disabled={!draft.firstName.trim() || !draft.lastName.trim()}>
            เพิ่ม
          </button>
        </div>
      </Modal>

      <QrModal open={qr === 'in'} title="ลงชื่อเข้าอบรม" url={`${origin}/c/${c.id}`} onClose={() => setQr(null)}>
        <p className="text-center text-[12px] font-light text-gray-20">ให้ผู้เข้าอบรมสแกน QR เพื่อกรอกชื่อและลงชื่อเข้าอบรมด้วยตนเอง</p>
        {manual('in')}
      </QrModal>
      <QrModal open={qr === 'out'} title="ลงชื่อออก" url={`${origin}/c/${c.id}?out=1`} onClose={() => setQr(null)}>
        <p className="text-center text-[12px] font-light text-gray-20">ให้ผู้เข้าอบรมสแกน QR เมื่อเสร็จสิ้นการอบรมเพื่อลงชื่อออก</p>
        {manual('out')}
      </QrModal>
      <QrModal open={qr === 'pre' || qr === 'post'} title={qr === 'pre' ? 'แบบประเมินก่อนการอบรม (Pre-Test)' : 'แบบประเมินหลังการอบรม (Post-Test)'} url={`${origin}/c/${c.id}?test=${qr === 'post' ? 'post' : 'pre'}`} onClose={() => setQr(null)}>
        <p className="text-center text-[12px] leading-[1.6] font-light text-gray-20">แบบทดสอบสร้างและทำผ่านระบบแบบสำรวจ (OSS-Survey) ผลคะแนนบันทึกในตารางรายชื่อด้านล่าง — กดป้ายผลเพื่อเปลี่ยนเป็น ผ่าน / ไม่ผ่าน / รอการประเมิน</p>
      </QrModal>
      <ConfirmDialog open={!!removing} danger title="ลบผู้เข้าอบรม?" confirm="ลบ" text={removing && <>“{removing.firstName} {removing.lastName}” จะถูกลบออกจากหลักสูตรนี้</>} onClose={() => setRemoving(null)} onConfirm={() => (updateCourse(c.id, (x) => ({ ...x, attendees: x.attendees.filter((a) => a.id !== removing!.id) })), setRemoving(null))} />
    </>
  )
}

function CourseData({ c, onDone }: { c: Course; onDone: () => void }) {
  const file = useRef<HTMLInputElement>(null)
  const [check, setCheck] = useState(false)
  const [warn, setWarn] = useState(false)
  const count = (k: 'pre' | 'post', s: Score) => c.attendees.filter((a) => a[k] === s).length
  const rate = c.attendees.length ? Math.round((count('post', 'pass') / c.attendees.length) * 100) : 0
  const pending = c.attendees.filter((a) => a.post === 'wait').length

  const addFiles = (fl: FileList | null) => {
    if (!fl) return
    updateCourse(c.id, (x) => ({ ...x, files: [...x.files, ...Array.from(fl).map((f) => ({ id: uid('f'), name: f.name, kind: (f.type.startsWith('image/') ? 'image' : 'doc') as 'image' | 'doc' }))] }))
    if (file.current) file.current.value = ''
  }
  const k = 'text-[14px] leading-[1.5] font-light text-black'
  return (
    <>
      <CourseBanner name={c.name} />
      <Board bare>
        <div className="flex flex-col gap-[16px] rounded-[12px] bg-white p-[24px] max-sm:p-[16px]">
          {[
            ['หลักสูตร', c.name],
            ['วิทยากร', c.instructor],
            ['วันที่', c.endDate && c.endDate !== c.startDate ? `${thaiLong(c.startDate)} – ${thaiLong(c.endDate)}` : thaiLong(c.startDate)],
            ['สถานที่', c.place],
          ].map(([a, b]) => (
            <p key={a} className={k}>
              <b className="font-semibold">{a} : </b>
              {b || <Link to={`/leader/plan/${c.id}/edit`} className="text-blue-00 hover:underline">ยังไม่ระบุ — ไปที่แผนการอบรม</Link>}
            </p>
          ))}
          <hr className="border-gray-line" />
          <h3 className="text-[14px] font-semibold text-black">ผลการประเมินก่อนการอบรม/หลังการอบรม</h3>
          <div>
            <button type="button" className={primaryBtn} onClick={() => setCheck(true)}>
              <img src={iconSearch} alt="" width={16} height={16} className="brightness-0 invert" />
              ตรวจสอบ
            </button>
          </div>
          <hr className="border-gray-line" />
          <h3 className="text-[14px] font-semibold text-black">แนบเอกสาร/ภาพถ่ายกิจกรรม</h3>
          <div>
            <button type="button" className={primaryBtn} onClick={() => file.current?.click()}>
              <img src={iconUpload} alt="" width={16} height={16} className="brightness-0 invert" />
              นำเข้าเอกสาร/ภาพ
            </button>
            <input ref={file} type="file" multiple hidden onChange={(e) => addFiles(e.target.files)} />
          </div>
          <ul className="flex flex-col gap-[12px]">
            {c.files.map((f) => (
              <li key={f.id} className="flex items-center gap-[12px] text-[12px] font-light">
                <img src={f.kind === 'image' ? iconImage : iconDoc} alt="" width={18} height={18} />
                <span className="min-w-0 flex-1 truncate sm:max-w-[320px]">{f.name}</span>
                <button type="button" aria-label={`ลบไฟล์ ${f.name}`} onClick={() => updateCourse(c.id, (x) => ({ ...x, files: x.files.filter((y) => y.id !== f.id) }))} className="flex size-[24px] items-center justify-center rounded-[6px] hover:bg-gray-bg">
                  <img src={iconX} alt="" width={14} height={14} />
                </button>
              </li>
            ))}
            {c.files.length === 0 && <li className="text-[12px] font-light text-gray-20">ยังไม่มีไฟล์แนบ</li>}
          </ul>
        </div>
      </Board>
      <div className="flex justify-end">
        <button type="button" className={primaryBtn} onClick={() => (pending ? setWarn(true) : onDone())}>
          ยืนยัน
        </button>
      </div>

      <Modal open={check} title="ผลการประเมินก่อน/หลังการอบรม" onClose={() => setCheck(false)}>
        <table className="w-full text-[13px]">
          <thead>
            <tr className="text-left text-[12px] text-gray-20">
              <th className="py-[6px] font-medium" />
              <th className="font-medium">ผ่าน</th>
              <th className="font-medium">ไม่ผ่าน</th>
              <th className="font-medium">รอการประเมิน</th>
            </tr>
          </thead>
          <tbody>
            {(['pre', 'post'] as const).map((s) => (
              <tr key={s} className="border-t border-gray-line">
                <td className="py-[10px] font-medium">{s === 'pre' ? 'Pre-test' : 'Post-test'}</td>
                <td>{count(s, 'pass')}</td>
                <td>{count(s, 'fail')}</td>
                <td>{count(s, 'wait')}</td>
              </tr>
            ))}
          </tbody>
        </table>
        <p className="rounded-[10px] bg-blue-bg px-[14px] py-[10px] text-[13px] font-light text-gray-30">
          ผู้เข้าอบรม {c.attendees.length} คน · ผ่านหลังอบรม <b className="font-semibold text-blue-00">{rate}%</b>
        </p>
      </Modal>
      <ConfirmDialog open={warn} title="ยังมีผู้ที่ไม่ได้ประเมินหลังอบรม" confirm="ยืนยันต่อ" text={`ยังมีผู้เข้าอบรม ${pending} คนที่ผล Post-test เป็น “รอการประเมิน” ต้องการยืนยันการบันทึกและปิดหลักสูตรเลยหรือไม่`} onClose={() => setWarn(false)} onConfirm={() => (setWarn(false), onDone())} />
    </>
  )
}

function Expenses({ c }: { c: Course }) {
  const total = c.expenses.reduce((n, e) => n + num(e.amount), 0)
  const plan = c.budgetLines.reduce((n, l) => n + num(l.amount), 0) || num(c.budget)
  const set = (id: string, p: Partial<Course['expenses'][number]>) => updateCourse(c.id, (x) => ({ ...x, expenses: x.expenses.map((e) => (e.id === id ? { ...e, ...p } : e)) }))
  return (
    <>
      <CourseBanner name={c.name} />
      <Board title="ตั้งรายการค่าใช้จ่าย">
        <div className="flex flex-col gap-[12px]">
          {c.expenses.map((e, i) => (
            <div key={e.id} className="grid grid-cols-[minmax(0,1fr)_150px_32px] items-start gap-[8px] max-sm:grid-cols-[minmax(0,1fr)_100px_32px]">
              <div className="flex min-w-0 flex-col gap-[6px]">
                <input aria-label={`รายการค่าใช้จ่าย ${i + 1}`} className={`${field} h-[40px] text-[13px]`} value={e.item} placeholder="รายการ เช่น ค่าอาหารกลางวัน" onChange={(ev) => set(e.id, { item: ev.target.value })} />
                <label className="flex w-fit cursor-pointer items-center gap-[6px] text-[12px] font-medium text-blue-00">
                  <img src={iconUpload} alt="" width={14} height={14} className="[filter:invert(36%)_sepia(98%)_saturate(2879%)_hue-rotate(200deg)]" />
                  แนบใบเสร็จ
                  <input type="file" multiple hidden onChange={(ev) => ev.target.files && set(e.id, { files: [...e.files, ...Array.from(ev.target.files).map((f) => f.name)] })} />
                </label>
                {e.files.map((f, k) => (
                  <span key={f + k} className="flex items-center gap-[6px] text-[11px] font-light text-gray-30">
                    <img src={iconDoc} alt="" width={14} height={14} />
                    <span className="truncate">{f}</span>
                    <button type="button" aria-label={`ลบไฟล์ ${f}`} onClick={() => set(e.id, { files: e.files.filter((_, j) => j !== k) })}>
                      <img src={iconX} alt="" width={12} height={12} />
                    </button>
                  </span>
                ))}
              </div>
              <input aria-label={`ยอดใช้จ่าย ${i + 1}`} inputMode="decimal" className={`${field} h-[40px] text-right text-[13px]`} value={e.amount} placeholder="0.00" onChange={(ev) => set(e.id, { amount: ev.target.value.replace(/[^\d.]/g, '') })} />
              <button type="button" aria-label={`ลบรายการ ${i + 1}`} onClick={() => updateCourse(c.id, (x) => ({ ...x, expenses: x.expenses.filter((y) => y.id !== e.id) }))} className="flex size-[40px] items-center justify-center rounded-[8px] hover:bg-red-20">
                <img src={iconTrash} alt="" width={16} height={16} />
              </button>
            </div>
          ))}
          <div>
            <button type="button" className={softBtn} onClick={() => updateCourse(c.id, (x) => ({ ...x, expenses: [...x.expenses, { id: uid('e'), item: '', amount: '', files: [] }] }))}>
              <img src={iconPlus} alt="" width={14} height={14} className="[filter:invert(36%)_sepia(98%)_saturate(2879%)_hue-rotate(200deg)]" />
              เพิ่มรายการค่าใช้จ่าย
            </button>
          </div>
          <dl className="grid grid-cols-3 gap-[8px] rounded-[10px] bg-gray-subtle p-[12px] text-[12px] max-sm:grid-cols-1">
            <div>
              <dt className="text-gray-20">งบตามแผน</dt>
              <dd className="font-urbanist text-[16px] font-medium">{fmt(plan)} บาท</dd>
            </div>
            <div>
              <dt className="text-gray-20">ใช้จ่ายจริง</dt>
              <dd className="font-urbanist text-[16px] font-medium">{fmt(total)} บาท</dd>
            </div>
            <div>
              <dt className="text-gray-20">คงเหลือ</dt>
              <dd className={`font-urbanist text-[16px] font-medium ${plan - total < 0 ? 'text-red-00' : 'text-green-text'}`}>{fmt(plan - total)} บาท</dd>
            </div>
          </dl>
          <p className="text-[11px] font-light text-gray-20">รายการนี้บันทึกอัตโนมัติ ใช้อ้างอิงต่อกับการเบิกจ่ายงบประมาณโครงการ</p>
        </div>
      </Board>
    </>
  )
}

export default function LeaderRecordPage() {
  const { id } = useParams()
  const navigate = useNavigate()
  const live = useCourses()
  const [tab, setTab] = useState<Tab>('register')
  const [toast, showToast] = useToast()
  if (!id) return <Picker />
  const c = live.find((x) => x.id === Number(id)) ?? getCourse(Number(id))
  if (!c)
    return (
      <div className={page}>
        <BackTitle title="บันทึกการอบรม" to="/leader/record" />
        <p className="rounded-[12px] bg-gray-subtle p-[24px] text-center text-[14px] text-gray-20">ไม่พบหลักสูตรนี้</p>
      </div>
    )
  return (
    <div className={page}>
      <BackTitle title="บันทึกการอบรม" to="/leader" />
      <SegTabs<Tab>
        value={tab}
        onChange={setTab}
        tabs={[
          { key: 'register', label: 'ลงทะเบียน' },
          { key: 'data', label: 'บันทึกข้อมูลหลักสูตร' },
          { key: 'expense', label: 'ตั้งรายการค่าใช้จ่าย' },
        ]}
      />
      {tab === 'register' && <Register c={c} onToast={showToast} />}
      {tab === 'data' && (
        <CourseData
          c={c}
          onDone={() => {
            updateCourse(c.id, (x) => ({ ...x, status: 'complete' }))
            navigate('/leader', { state: { toast: 'บันทึกการอบรมแล้ว หลักสูตรเป็นสถานะ Complete' } })
          }}
        />
      )}
      {tab === 'expense' && <Expenses c={c} />}
      {toast}
    </div>
  )
}
