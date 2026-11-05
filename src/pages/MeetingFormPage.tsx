import { useEffect, useMemo, useRef, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import iconArrowLeft from '../assets/builder/icon-arrow-left.svg'
import iconCopy from '../assets/builder/icon-copy.svg'
import iconEye from '../assets/builder/icon-eye.svg'
import iconQr from '../assets/builder/icon-qr.svg'
import iconSaveBlue from '../assets/builder/icon-save-blue.svg'
import iconTrash from '../assets/builder/icon-trash.svg'
import iconX from '../assets/builder/icon-x.svg'
import iconReset from '../assets/meeting/c-arrow-clockwise.svg'
import iconCalendar from '../assets/meeting/c-calendar.svg'
import iconClock from '../assets/meeting/c-clock.svg'
import iconFile from '../assets/meeting/c-file-text.svg'
import iconRepeat from '../assets/meeting/c-repeat.svg'
import iconSend from '../assets/meeting/c-send.svg'
import iconUpload from '../assets/meeting/c-upload.svg'
import { AgendaModal, AttendeePicker, field, IconBtn, label14, outlineBtn, QrModal, RecurrencePanel, recurrenceText, ToggleRow } from '../components/meeting/FormParts'
import { DateInput, TimeInput } from '../components/ui/DateTimeInputs'
import Modal from '../components/ui/Modal'
import Select from '../components/ui/Select'
import Toggle from '../components/ui/Toggle'
import { blankMeeting, directory, locations, meetingTypes, orgs, type Meeting } from '../data/meetings'
import { newDraft, newQuestion, newSection, uid } from '../data/surveyBuilder'
import { deleteMeeting, getMeeting, nextMeetingId, saveMeeting } from '../lib/meetingStore'
import { nextSurveyId, saveDraft as saveSurveyDraft } from '../lib/surveyStore'

type Errors = Partial<Record<'title' | 'time' | 'place' | 'attendees', string>>

/** Figma OSS-Meeting/Create (131:12824) + repeat settings (Frame 16, 180:9896). Routes /meeting/create and /meeting/:id/edit */
export default function MeetingFormPage() {
  const { id } = useParams()
  const navigate = useNavigate()
  const isNew = !id
  const initial = useMemo(() => (id && getMeeting(Number(id))) || blankMeeting(nextMeetingId()), [id])
  const [m, setM] = useState<Meeting>(initial)
  const [dirty, setDirty] = useState(false)
  const [errors, setErrors] = useState<Errors>({})
  const [toast, setToast] = useState<string>()
  const [repeatOpen, setRepeatOpen] = useState(!!initial.recurrence)
  const [agendaOpen, setAgendaOpen] = useState(false)
  const [qr, setQr] = useState<'join' | 'register' | null>(null)
  const [confirm, setConfirm] = useState<'clear' | 'delete' | null>(null)
  const fileInput = useRef<HTMLInputElement>(null)

  useEffect(() => setM(initial), [initial])
  useEffect(() => {
    if (!toast) return
    const t = setTimeout(() => setToast(undefined), 2600)
    return () => clearTimeout(t)
  }, [toast])
  useEffect(() => {
    if (!dirty) return
    const warn = (e: BeforeUnloadEvent) => e.preventDefault()
    window.addEventListener('beforeunload', warn)
    return () => window.removeEventListener('beforeunload', warn)
  }, [dirty])

  const set = (patch: Partial<Meeting>) => {
    setM((x) => ({ ...x, ...patch }))
    setDirty(true)
    setErrors((e) => {
      const next = { ...e }
      if ('title' in patch) delete next.title
      if ('start' in patch || 'end' in patch || 'allDay' in patch) delete next.time
      if ('place' in patch || 'hasLocation' in patch) delete next.place
      if ('attendees' in patch) delete next.attendees
      return next
    })
  }

  /** Save and keep editing; a new meeting moves to its /edit URL so Back / refresh keep it */
  const persist = (patch: Partial<Meeting> = {}) => {
    const next = { ...m, ...patch }
    saveMeeting(next)
    setM(next)
    setDirty(false)
    if (isNew) navigate(`/meeting/${next.id}/edit`, { replace: true })
    return next
  }

  const validate = () => {
    const e: Errors = {}
    if (!m.title.trim()) e.title = 'กรุณาระบุหัวข้อเรื่อง'
    if (!m.allDay && m.end <= m.start) e.time = 'เวลาสิ้นสุดต้องหลังเวลาเริ่ม'
    if (m.hasLocation && !m.place.trim()) e.place = 'กรุณาระบุสถานที่ หรือปิดสถานที่ประชุมถ้าเป็นการประชุมออนไลน์'
    if (!m.attendees.length) e.attendees = 'กรุณาเพิ่มผู้เข้าร่วมประชุมอย่างน้อย 1 คน'
    setErrors(e)
    const first = Object.keys(e)[0]
    if (first) {
      document.getElementById(`f-${first}`)?.scrollIntoView({ behavior: 'smooth', block: 'center' })
      setToast(Object.values(e)[0])
    }
    return !first
  }

  const saveAsDraft = () => {
    if (!m.title.trim()) {
      setErrors({ title: 'กรุณาระบุหัวข้อเรื่องก่อนบันทึก' })
      return setToast('กรุณาระบุหัวข้อเรื่องก่อนบันทึก')
    }
    persist({ draft: true })
    setToast('บันทึกแบบร่างแล้ว')
  }
  const send = () => {
    if (!validate()) return
    saveMeeting({ ...m, draft: false, status: 'scheduled', rsvp: 'accepted' })
    setDirty(false)
    navigate('/meeting', { state: { toast: `ส่งนัด “${m.title}” ให้ผู้เข้าร่วม ${m.attendees.length} คนแล้ว` } })
  }
  const preview = () => {
    if (!m.title.trim()) return setToast('กรุณาระบุหัวข้อเรื่องก่อนดูตัวอย่าง')
    const saved = persist()
    navigate(`/meeting/${saved.id}`)
  }
  const duplicate = () => {
    const copy: Meeting = { ...m, id: nextMeetingId(), title: m.title ? `${m.title} (สำเนา)` : '', draft: true, status: 'scheduled', registrationSurveyId: undefined }
    saveMeeting(copy)
    setDirty(false)
    navigate(`/meeting/${copy.id}/edit`)
    setToast('ทำสำเนาการประชุมแล้ว')
  }
  const remove = () => {
    deleteMeeting(m.id)
    setDirty(false)
    navigate('/meeting', { state: { toast: 'ลบการประชุมแล้ว' } })
  }
  const clear = () => {
    setM({ ...blankMeeting(m.id), registrationSurveyId: m.registrationSurveyId })
    setRepeatOpen(false)
    setErrors({})
    setDirty(true)
    setConfirm(null)
  }

  /** "สร้างฟอร์มลงทะเบียน": a survey draft prefilled for registration, opened in the survey builder */
  const openRegistrationForm = () => {
    if (!m.title.trim()) return setToast('กรุณาระบุหัวข้อเรื่องก่อนสร้างฟอร์มลงทะเบียน')
    let surveyId = m.registrationSurveyId
    if (!surveyId) {
      surveyId = nextSurveyId()
      const d = newDraft(surveyId)
      const confirmQ = { ...newQuestion('single'), title: 'ยืนยันการเข้าร่วมประชุม', required: true }
      confirmQ.options = ['เข้าร่วมที่สถานที่ประชุม', 'เข้าร่วมแบบออนไลน์', 'ไม่สะดวกเข้าร่วม'].map((label) => ({ id: uid('o'), label, subQuestions: [] }))
      saveSurveyDraft({
        ...d,
        title: `แบบลงทะเบียน: ${m.title}`,
        description: `ลงทะเบียนเข้าร่วม${m.title} วันที่ ${m.date}${m.allDay ? '' : ` เวลา ${m.start}–${m.end} น.`}`,
        general: { ...d.general, fields: ['name', 'phone'], required: { name: true, phone: true } },
        sections: [{ ...newSection(), questions: [confirmQ] }],
        settings: { ...d.settings, scheduled: false },
      })
    }
    persist({ registrationSurveyId: surveyId })
    navigate(`/survey/${surveyId}/edit`)
  }

  const addFiles = (files: FileList | null) => {
    if (!files?.length) return
    set({ documents: [...m.documents, ...Array.from(files, (f) => f.name)] })
  }

  const districts = m.province ? Object.keys(locations[m.province] ?? {}) : []
  const subdistricts = m.province && m.district ? (locations[m.province]?.[m.district] ?? []) : []
  const bkk = !m.province || m.province === 'กรุงเทพมหานคร'
  const people = useMemo(directory, [])
  const origin = window.location.origin
  const errText = (k: keyof Errors) => errors[k] && <p className="text-[12px] font-light text-red-00">{errors[k]}</p>

  return (
    <div className="mx-auto flex w-full max-w-[1243px] flex-col gap-[12px] px-[24px] pb-[24px] max-sm:px-[12px]">
      {/* Header */}
      <div className="flex items-center gap-[12px] pb-[12px]">
        <div className="flex min-w-0 flex-1 items-center gap-[10px]">
          <button type="button" aria-label="กลับไปปฏิทินการประชุม" onClick={() => navigate('/meeting')} className="flex shrink-0 rounded-[8px] bg-blue-gray p-[8px] transition-colors hover:bg-blue-20">
            <img src={iconArrowLeft} alt="" width={16} height={16} />
          </button>
          <h1 className="truncate text-[20px] leading-[1.2] font-semibold text-blue-00">จัดการการประชุม</h1>
          {m.draft && !isNew && <span className="shrink-0 rounded-[6px] bg-blue-bg px-[8px] py-[4px] text-[12px] font-light text-blue-00">แบบร่าง</span>}
        </div>
        <IconBtn icon={iconEye} label="ดูรายละเอียดการประชุม" onClick={preview} />
        <IconBtn icon={iconCopy} label="ทำสำเนา" onClick={duplicate} />
        <IconBtn icon={iconTrash} label="ลบการประชุม" onClick={() => setConfirm('delete')} />
      </div>

      {/* Board: type + title + switches */}
      <section className="flex flex-col gap-[12px] rounded-[12px] bg-blue-10 p-[12px]">
        <div className="flex flex-col gap-[24px] rounded-[12px] bg-white p-[24px] max-sm:p-[16px]">
          <div className="flex items-center gap-[12px] max-sm:flex-col max-sm:items-stretch">
            <span className="text-[16px] leading-[normal] font-medium whitespace-nowrap text-black">ประเภทการประชุม</span>
            <Select className="w-[280px] max-sm:w-full" label="ประเภทการประชุม" value={m.type} onChange={(type) => set({ type })} options={meetingTypes.map((t) => ({ value: t, label: t }))} />
          </div>
          <div id="f-title" className="flex flex-col gap-[6px]">
            <input
              value={m.title}
              onChange={(e) => set({ title: e.target.value })}
              placeholder="หัวข้อเรื่อง"
              aria-label="หัวข้อเรื่อง"
              aria-invalid={!!errors.title}
              className={`h-[48px] w-full border-b border-dashed bg-transparent text-[24px] leading-[1.1] font-medium text-black outline-none placeholder:text-gray-20 focus:border-solid focus:border-blue-00 max-sm:text-[20px] ${errors.title ? 'border-red-00' : 'border-gray-20'}`}
            />
            {errText('title')}
          </div>
        </div>
        <div className="flex items-center gap-[10px] max-lg:flex-col max-lg:items-stretch">
          <div className="flex min-w-0 flex-1 flex-wrap items-center gap-x-[24px] gap-y-[12px] rounded-[12px] bg-white px-[24px] py-[12px] max-sm:px-[12px]">
            <ToggleRow checked={m.online} onChange={(online) => set({ online })}>
              เปิดการประชุมออนไลน์
            </ToggleRow>
            <ToggleRow checked={m.registration} onChange={(registration) => set({ registration })}>
              เปิดลงทะเบียนเข้าร่วมประชุม
            </ToggleRow>
            <button type="button" disabled={!m.registration} onClick={openRegistrationForm} className={outlineBtn}>
              <img src={iconFile} alt="" width={16} height={16} className="my-px" />
              <span className="p-[2px]">{m.registrationSurveyId ? 'แก้ไขฟอร์มลงทะเบียน' : 'สร้างฟอร์มลงทะเบียน'}</span>
            </button>
          </div>
          <div className="flex w-[234px] shrink-0 gap-[12px] max-lg:w-full">
            <button type="button" disabled={!m.online} onClick={() => setQr('join')} className={`${outlineBtn} flex-1`}>
              <img src={iconQr} alt="" width={16} height={16} className="my-px" />
              <span className="p-[2px]">เข้าประชุม</span>
            </button>
            <button type="button" disabled={!m.registration} onClick={() => setQr('register')} className={`${outlineBtn} max-lg:flex-1`}>
              <img src={iconQr} alt="" width={16} height={16} className="my-px" />
              <span className="p-[2px]">ลงทะเบียน</span>
            </button>
          </div>
        </div>
      </section>

      {/* Board: date, location, message, documents */}
      <section className="rounded-[12px] bg-blue-gray p-[12px]">
        <div className="flex flex-col gap-[24px] rounded-[12px] bg-white p-[24px] max-sm:p-[16px]">
          <div id="f-time" className="flex flex-col gap-[12px]">
            <div className="flex items-center gap-[24px] max-xl:flex-wrap max-xl:gap-[16px]">
              <div className="flex min-w-[260px] flex-1 items-center gap-[10px]">
                <span className={label14}>กำหนดวันประชุม</span>
                <DateInput value={m.date} onChange={(date) => set({ date })} label="วันประชุม" icon={iconCalendar} />
              </div>
              <div className="flex min-w-[300px] flex-1 items-center gap-[10px]">
                <span className={label14}>เวลา</span>
                <TimeInput value={m.start} onChange={(start) => set({ start })} label="เวลาเริ่ม" icon={iconClock} disabled={m.allDay} />
                <span className={label14}>ถึง</span>
                <TimeInput value={m.end} onChange={(end) => set({ end })} label="เวลาสิ้นสุด" icon={iconClock} disabled={m.allDay} />
              </div>
              <div className="flex shrink-0 items-center gap-[24px]">
                <label className="flex h-[37px] cursor-pointer items-center gap-[10px] py-[8px]">
                  <span className="flex">
                    <Toggle checked={m.allDay} onChange={(allDay) => set({ allDay })} label="ทั้งวัน" />
                  </span>
                  <span className="text-[14px] font-light text-black opacity-90">ทั้งวัน</span>
                </label>
                <button
                  type="button"
                  aria-expanded={repeatOpen}
                  onClick={() => {
                    if (repeatOpen) {
                      setRepeatOpen(false)
                      set({ recurrence: undefined })
                    } else {
                      setRepeatOpen(true)
                      const day = (new Date(`${m.date}T00:00:00`).getDay() + 6) % 7
                      set({ recurrence: m.recurrence ?? { every: 1, unit: 'week', days: [day], until: '' } })
                    }
                  }}
                  className="flex items-center gap-[2px] rounded-[8px] px-[2px] py-[8px] transition-opacity hover:opacity-80"
                >
                  <img src={iconRepeat} alt="" width={14} height={14} className="my-px" />
                  <span className="py-[2px] text-[12px] leading-[normal] font-medium whitespace-nowrap text-blue-00">{repeatOpen ? 'ไม่ทำซ้ำ' : 'สร้างการประชุมซ้ำ'}</span>
                </button>
              </div>
            </div>
            {errText('time')}
            {repeatOpen && m.recurrence && (
              <div className="flex flex-col gap-[8px]">
                <RecurrencePanel value={m.recurrence} onChange={(recurrence) => set({ recurrence })} />
                <p className="text-[12px] font-light text-gray-20">{recurrenceText(m.recurrence)}</p>
              </div>
            )}
          </div>

          <div id="f-place" className="flex flex-col gap-[12px] rounded-[12px] bg-blue-bg p-[12px]">
            <ToggleRow checked={m.hasLocation} onChange={(hasLocation) => set({ hasLocation })}>
              สถานที่ประชุม
            </ToggleRow>
            {m.hasLocation && (
              <div className="flex flex-col gap-[24px] rounded-[12px] bg-white p-[24px] max-sm:p-[16px]">
                <div className="flex flex-col gap-[6px]">
                  <input value={m.place} onChange={(e) => set({ place: e.target.value })} placeholder="สถานที่" aria-label="สถานที่" aria-invalid={!!errors.place} className={`${field} h-[45px] ${errors.place ? 'border-red-00' : ''}`} />
                  {errText('place')}
                </div>
                <div className="grid grid-cols-3 gap-[12px] max-md:grid-cols-1">
                  <Select label="จังหวัด" placeholder="จังหวัด" value={m.province} onChange={(province) => set({ province, district: '', subdistrict: '' })} options={Object.keys(locations).map((p) => ({ value: p, label: p }))} />
                  <Select
                    label={bkk ? 'เขต' : 'อำเภอ'}
                    placeholder={bkk ? 'เขต' : 'อำเภอ'}
                    value={m.district}
                    onChange={(district) => set({ district, subdistrict: '' })}
                    options={districts.length ? districts.map((d) => ({ value: d, label: d })) : [{ value: '-', label: 'เลือกจังหวัดก่อน', disabled: true }]}
                  />
                  <Select
                    label={bkk ? 'แขวง' : 'ตำบล'}
                    placeholder={bkk ? 'แขวง' : 'ตำบล'}
                    value={m.subdistrict}
                    onChange={(subdistrict) => set({ subdistrict })}
                    options={subdistricts.length ? subdistricts.map((d) => ({ value: d, label: d })) : [{ value: '-', label: bkk ? 'เลือกเขตก่อน' : 'เลือกอำเภอก่อน', disabled: true }]}
                  />
                </div>
              </div>
            )}
          </div>

          <textarea value={m.note} onChange={(e) => set({ note: e.target.value })} placeholder="ข้อความ...." aria-label="ข้อความถึงผู้เข้าร่วม" className="h-[107px] w-full resize-y rounded-[8px] border border-gray-line bg-white px-[24px] pt-[24px] text-[14px] font-light text-black outline-none placeholder:text-gray-20 hover:border-gray-10 focus:border-blue-00" />

          <div className="flex flex-col gap-[12px]">
            <div className="flex items-center gap-[24px] max-md:flex-col max-md:items-stretch max-md:gap-[12px]">
              <span className="text-[14px] font-medium whitespace-nowrap text-black">นำเข้าเอกสารการประชุม</span>
              <div className="flex w-[432px] items-center gap-[24px] max-md:w-full max-md:gap-[12px]">
                <button type="button" onClick={() => fileInput.current?.click()} className={`${outlineBtn} flex-1`}>
                  <img src={iconUpload} alt="" width={16} height={16} className="my-px" />
                  <span className="p-[2px]">นำเข้าเอกสาร</span>
                </button>
                <span className="text-[14px] font-medium text-ink">หรือ</span>
                <button type="button" onClick={() => setAgendaOpen(true)} className={`${outlineBtn} flex-1`}>
                  <img src={iconFile} alt="" width={16} height={16} className="my-px" />
                  <span className="p-[2px]">{m.agendas.length ? `วาระการประชุม (${m.agendas.length})` : 'สร้างวาระการประชุม'}</span>
                </button>
              </div>
              <input ref={fileInput} type="file" multiple hidden accept=".pdf,.doc,.docx,.xls,.xlsx,.ppt,.pptx,image/*" onChange={(e) => (addFiles(e.target.files), (e.target.value = ''))} />
            </div>
            {(m.documents.length > 0 || m.agendas.length > 0) && (
              <ul className="flex flex-col gap-[4px]">
                {m.agendas.map((a, i) => (
                  <li key={a.id} className="flex items-center gap-[10px] rounded-[8px] px-[4px] py-[8px]">
                    <span className="w-[60px] shrink-0 text-[12px] font-medium text-blue-00">วาระที่ {i + 1}</span>
                    <span className="min-w-0 flex-1 truncate text-[12px] font-light text-gray-30">{a.title}</span>
                    {a.vote && <span className="shrink-0 rounded-[6px] bg-blue-bg px-[6px] py-[2px] text-[10px] font-light text-blue-00">ลงมติ</span>}
                  </li>
                ))}
                {m.documents.map((d, i) => (
                  <li key={`${d}-${i}`} className="flex max-w-[560px] items-center gap-[10px] rounded-[8px] px-[4px] py-[8px] hover:bg-gray-subtle">
                    <img src={iconFile} alt="" width={16} height={16} />
                    <span className="min-w-0 flex-1 truncate text-[12px] font-light text-gray-30">{d}</span>
                    <button type="button" aria-label={`ลบ ${d}`} onClick={() => set({ documents: m.documents.filter((_, k) => k !== i) })} className="flex rounded-[6px] p-[4px] hover:bg-white">
                      <img src={iconX} alt="" width={14} height={14} />
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>
      </section>

      {/* Board: people */}
      <section className="flex flex-col gap-[12px] rounded-[12px] bg-blue-gray p-[12px]">
        <h2 className="text-[16px] leading-[normal] font-medium text-black">ผู้เกี่ยวข้อง</h2>
        <div className="flex flex-col gap-[24px] rounded-[12px] bg-white p-[24px] max-sm:p-[16px]">
          <label className="flex flex-col gap-[12px]">
            <span className="text-[14px] font-medium text-ink">หน่วยงานที่จัด</span>
            <input list="meeting-orgs" value={m.org} onChange={(e) => set({ org: e.target.value })} placeholder="หน่วยงาน" className={`${field} bg-white-soft`} />
          </label>
          <div className="grid grid-cols-2 gap-[24px] max-md:grid-cols-1">
            <label className="flex flex-col gap-[12px]">
              <span className="text-[14px] font-medium text-ink">พยาน</span>
              <input list="meeting-people" value={m.witness} onChange={(e) => set({ witness: e.target.value })} placeholder="ชื่อ-นามสกุล" className={`${field} bg-white-soft`} />
            </label>
            <label className="flex flex-col gap-[12px]">
              <span className="text-[14px] font-medium text-ink">ผู้จ่ายเงิน</span>
              <input list="meeting-people" value={m.payer} onChange={(e) => set({ payer: e.target.value })} placeholder="ชื่อ-นามสกุล" className={`${field} bg-white-soft`} />
            </label>
          </div>
          <datalist id="meeting-orgs">
            {orgs.map((o) => (
              <option key={o} value={o} />
            ))}
          </datalist>
          <datalist id="meeting-people">
            {people.map((p) => (
              <option key={p.id} value={`${p.first} ${p.last}`} />
            ))}
          </datalist>
        </div>
        <h2 className="text-[16px] leading-[normal] font-medium text-black">กำหนดรายชื่อผู้เข้าร่วมประชุม</h2>
        <div id="f-attendees" className={`flex flex-col gap-[8px] rounded-[12px] bg-white p-[24px] max-sm:p-[16px] ${errors.attendees ? 'ring-1 ring-red-00' : ''}`}>
          <AttendeePicker value={m.attendees} onChange={(attendees) => set({ attendees })} />
          {errText('attendees')}
        </div>
      </section>

      {/* Footer actions */}
      <div className="flex items-center gap-[12px] py-[24px] max-sm:flex-col-reverse max-sm:items-stretch">
        <button type="button" onClick={() => setConfirm('clear')} className="flex items-center justify-center gap-[4px] rounded-[8px] px-[2px] py-[10px] transition-opacity hover:opacity-80">
          <img src={iconReset} alt="" width={16} height={16} className="my-px" />
          <span className="p-[2px] text-[14px] font-medium text-blue-00">ล้างข้อมูล</span>
        </button>
        <div className="flex flex-1 items-center justify-end gap-[12px] max-sm:flex-col-reverse max-sm:items-stretch">
          <button type="button" onClick={saveAsDraft} className="flex items-center justify-center gap-[4px] rounded-[8px] bg-blue-bg px-[12px] py-[10px] transition-colors hover:bg-blue-20">
            <img src={iconSaveBlue} alt="" width={16} height={16} className="my-px" />
            <span className="p-[2px] text-[14px] font-medium text-blue-00">บันทึกแบบร่าง</span>
          </button>
          <button type="button" onClick={send} className="flex items-center justify-center gap-[4px] rounded-[8px] bg-blue-00 px-[12px] py-[10px] transition hover:brightness-110">
            <img src={iconSend} alt="" width={16} height={16} className="my-px" />
            <span className="p-[2px] text-[14px] font-medium text-white-soft">ส่งนัดการประชุม</span>
          </button>
        </div>
      </div>

      <AgendaModal
        open={agendaOpen}
        value={m.agendas}
        onClose={() => setAgendaOpen(false)}
        onSave={(agendas) => {
          set({ agendas })
          setAgendaOpen(false)
        }}
      />
      <QrModal open={qr === 'join'} title="เข้าประชุมออนไลน์" url={`${origin}/meeting/${m.id}?join=1`} onClose={() => setQr(null)}>
        <p className="text-center text-[12px] font-light text-gray-20">สแกนเพื่อเข้าห้องประชุมออนไลน์ ลิงก์ใช้ได้หลังส่งนัดการประชุม</p>
      </QrModal>
      <QrModal open={qr === 'register'} title="ลงทะเบียนเข้าร่วมประชุม" url={m.registrationSurveyId ? `${origin}/s/survey-${String(m.registrationSurveyId).padStart(3, '0')}` : `${origin}/meeting/${m.id}?register=1`} onClose={() => setQr(null)}>
        <p className="text-center text-[12px] font-light text-gray-20">{m.registrationSurveyId ? 'ลิงก์ฟอร์มลงทะเบียน ใช้ได้เมื่อเผยแพร่ฟอร์มแล้ว' : 'ยังไม่ได้สร้างฟอร์มลงทะเบียน · ผู้เข้าร่วมจะลงชื่อด้วยบัญชีของตนเอง'}</p>
      </QrModal>

      <Modal open={confirm !== null} title={confirm === 'delete' ? 'ลบการประชุม' : 'ล้างข้อมูล'} onClose={() => setConfirm(null)}>
        <p className="text-[14px] font-light text-gray-30">{confirm === 'delete' ? `ต้องการลบ “${m.title || 'การประชุมนี้'}” ใช่ไหม? ลบแล้วกู้คืนไม่ได้` : 'ล้างข้อมูลทั้งหมดในฟอร์มนี้ใช่ไหม?'}</p>
        <div className="flex justify-end gap-[12px]">
          <button type="button" onClick={() => setConfirm(null)} className="h-[45px] w-[128px] rounded-[8px] border border-gray-line text-[14px] font-medium text-gray-30 outline-none hover:bg-gray-subtle focus-visible:ring-2 focus-visible:ring-blue-20">
            ยกเลิก
          </button>
          <button type="button" onClick={confirm === 'delete' ? remove : clear} className="h-[45px] w-[128px] rounded-[8px] bg-red-00 text-[14px] font-medium text-white-soft hover:brightness-110">
            {confirm === 'delete' ? 'ลบ' : 'ล้างข้อมูล'}
          </button>
        </div>
      </Modal>

      <div aria-live="polite" className="pointer-events-none fixed bottom-[24px] left-1/2 z-50 -translate-x-1/2">
        {toast && <div className="animate-[menu-in_120ms_ease-out] rounded-[10px] bg-gray-30 px-[16px] py-[10px] text-[13px] text-white shadow-lg">{toast}</div>}
      </div>
    </div>
  )
}
