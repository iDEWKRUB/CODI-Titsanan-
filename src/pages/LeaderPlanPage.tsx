import { useMemo, useState } from 'react'
import { useNavigate, useParams, useSearchParams } from 'react-router-dom'
import iconCopy from '../assets/survey/icon-copy.svg'
import iconEye from '../assets/survey/icon-eye.svg'
import iconPlus from '../assets/survey/icon-plus.svg'
import iconTrash from '../assets/survey/icon-trash.svg'
import iconSave from '../assets/meeting/d-check-sm.svg'
import { field, IconBtn, outlineBtn } from '../components/meeting/FormParts'
import { BackTitle, Board, ConfirmDialog, EditableText, Field, lbl, page, primaryBtn, SegTabs, softBtn, useToast } from '../components/leader/Parts'
import { DateInput } from '../components/ui/DateTimeInputs'
import Modal from '../components/ui/Modal'
import Select from '../components/ui/Select'
import { uid } from '../data/surveyBuilder'
import { blankCourse, courseTypes, fiscalYears, fmt, orgs, quarters, scheduleTemplates, targets, thaiLong, type Course } from '../data/leader'
import { deleteCourse, getCourse, nextCourseId, saveCourse } from '../lib/leaderStore'

type Tab = 'course' | 'schedule' | 'budget' | 'approve'
const NAME_PLACEHOLDER = 'ชื่อหลักสูตร...'
const num = (s: string) => Number(s.replace(/,/g, '')) || 0

function validate(c: Course) {
  const e: Record<string, string> = {}
  if (!c.name.trim() || c.name === NAME_PLACEHOLDER) e.name = 'กรุณาตั้งชื่อหลักสูตร'
  if (!c.courseType) e.courseType = 'กรุณาเลือกประเภทหลักสูตร'
  if (num(c.budget) <= 0) e.budget = 'กรุณาระบุงบประมาณ'
  if (!c.startDate) e.startDate = 'กรุณาเลือกวันเริ่มต้น'
  if (!c.endDate) e.endDate = 'กรุณาเลือกวันสิ้นสุด'
  else if (c.startDate && c.endDate < c.startDate) e.endDate = 'วันสิ้นสุดต้องไม่ก่อนวันเริ่มต้น'
  if (!c.target) e.target = 'กรุณาเลือกกลุ่มเป้าหมาย'
  if (!c.place.trim()) e.place = 'กรุณาระบุสถานที่จัด'
  if (!c.schedule.some((r) => r.activity.trim())) e.schedule = 'กรุณาเลือกแม่แบบหรือเพิ่มอย่างน้อย 1 รายการในกำหนดการ'
  if (!c.budgetCode.trim()) e.budgetCode = 'กรุณาระบุรหัสงบประมาณ'
  if (!c.budgetLines.some((l) => num(l.amount) > 0)) e.budgetLines = 'กรุณาเพิ่มรายการงบประมาณอย่างน้อย 1 รายการ'
  return e
}
const tabOf: Record<string, Tab> = { name: 'course', courseType: 'course', budget: 'course', startDate: 'course', endDate: 'course', target: 'course', place: 'course', schedule: 'schedule', budgetCode: 'budget', budgetLines: 'budget' }

export default function LeaderPlanPage() {
  const params = useParams()
  const navigate = useNavigate()
  const existing = params.id ? getCourse(Number(params.id)) : undefined
  const [course, setCourse] = useState<Course>(() => existing ?? blankCourse(nextCourseId()))
  const [search, setSearch] = useSearchParams()
  const tab = (['course', 'schedule', 'budget', 'approve'].includes(search.get('tab') ?? '') ? search.get('tab') : 'course') as Tab
  const setTab = (t: Tab) => setSearch({ tab: t }, { replace: true })
  const [tried, setTried] = useState(false)
  const [preview, setPreview] = useState(false)
  const [askDelete, setAskDelete] = useState(false)
  const [saved, setSaved] = useState(!!existing)
  const [toast, showToast] = useToast()

  const errors = useMemo(() => validate(course), [course])
  const shown = tried ? errors : {}
  const marks = useMemo(() => new Set(Object.keys(errors).map((k) => tabOf[k])), [errors])
  const set = <K extends keyof Course>(k: K, v: Course[K]) => setCourse((c) => ({ ...c, [k]: v }))

  if (params.id && !existing && !saved) {
    return (
      <div className={page}>
        <BackTitle title="จัดทำแผนการอบรม" to="/leader" />
        <p className="rounded-[12px] bg-gray-subtle p-[24px] text-center text-[14px] text-gray-20">ไม่พบแผนการอบรมนี้ อาจถูกลบไปแล้ว</p>
      </div>
    )
  }

  const persist = (c: Course, msg: string) => {
    saveCourse(c)
    setCourse(c)
    if (!saved) {
      setSaved(true)
      navigate(`/leader/plan/${c.id}/edit?tab=${tab}`, { replace: true })
    }
    showToast(msg)
  }
  const saveDraft = () => persist(course, 'บันทึกแบบร่างแล้ว')

  const duplicate = () => {
    const id = nextCourseId()
    const copy: Course = { ...course, id, name: `${course.name} (สำเนา)`, status: 'draft', attendees: [], files: [], expenses: [], approval: blankCourse(id).approval }
    saveCourse(copy)
    navigate(`/leader/plan/${id}/edit`)
  }

  // ---- approval (≥ 2 levels, signed in order) ----
  const submit = () => {
    setTried(true)
    const first = Object.keys(errors)[0]
    if (first) {
      setTab(tabOf[first])
      showToast('กรุณากรอกข้อมูลให้ครบก่อนส่งขออนุมัติ')
      return
    }
    persist({ ...course, approval: { ...course.approval, state: 'pending' } }, 'ส่งขออนุมัติแล้ว')
  }
  const sign = (i: number) => {
    const steps = course.approval.steps.map((s, k) => (k === i ? { ...s, doneAt: new Date().toISOString().slice(0, 10) } : s))
    const all = steps.every((s) => s.doneAt)
    persist({ ...course, status: all ? 'open' : course.status, approval: { state: all ? 'approved' : 'pending', steps } }, all ? 'อนุมัติครบทุกลำดับ แผนเปิดดำเนินการแล้ว' : 'ลงนามอนุมัติแล้ว')
  }
  const withdraw = () => persist({ ...course, approval: { state: 'none', steps: course.approval.steps.map((s) => ({ ...s, doneAt: undefined })) } }, 'ถอนคำขออนุมัติแล้ว')

  const budgetTotal = course.budgetLines.reduce((n, l) => n + num(l.amount), 0)
  const planBudget = num(course.budget)
  const err = (k: string) => shown[k]
  const errText = (k: string) => (err(k) ? <span role="alert" className="text-[12px] font-light text-red-00">{err(k)}</span> : null)
  const border = (k: string) => (err(k) ? 'border-red-00' : '')

  return (
    <div className={page}>
      <BackTitle
        title="จัดทำแผนการอบรม"
        to="/leader"
        actions={
          <>
            <IconBtn icon={iconEye} label="ดูตัวอย่างแผน" onClick={() => setPreview(true)} />
            <IconBtn icon={iconCopy} label="ทำสำเนาแผน" onClick={duplicate} />
            <IconBtn icon={iconTrash} label="ลบแผน" onClick={() => setAskDelete(true)} />
          </>
        }
      />

      <SegTabs<Tab>
        value={tab}
        onChange={setTab}
        tabs={[
          { key: 'course', label: 'วางแผนหลักสูตร', mark: tried && marks.has('course') },
          { key: 'schedule', label: 'แผนการอบรม', mark: tried && marks.has('schedule') },
          { key: 'budget', label: 'แผนงบประมาณและบัญชี', mark: tried && marks.has('budget') },
          { key: 'approve', label: 'ขออนุมัติ' },
        ]}
      />

      {tab === 'course' && (
        <Board title="สร้างแผนการอบรม">
          <div className="flex flex-col gap-[20px]">
            <div className="flex flex-wrap items-center gap-[16px]">
              <span className={lbl}>ประเภทหลักสูตร</span>
              <div className="w-[226px] max-sm:w-full">
                <Select label="ประเภทหลักสูตร" value={course.courseType} placeholder="เลือกประเภท" options={courseTypes.map((t) => ({ value: t, label: t }))} onChange={(v) => set('courseType', v)} />
              </div>
              {errText('courseType')}
            </div>
            <div className="flex flex-col gap-[4px]">
              <EditableText big label="ชื่อหลักสูตร" value={course.name === NAME_PLACEHOLDER ? '' : course.name} placeholder={NAME_PLACEHOLDER} onChange={(v) => set('name', v)} />
              {errText('name')}
            </div>
            <EditableText label="รายละเอียด" value={course.detail} placeholder="รายละเอียด (ถ้ามี)" onChange={(v) => set('detail', v)} />

            <div className="flex flex-wrap items-center gap-[12px]">
              <div className="w-[190px] max-sm:w-[calc(50%-6px)]">
                <Select label="ประจำปี" value={course.fiscalYear} options={fiscalYears.map((y) => ({ value: y, label: `ประจำปี ${y}` }))} onChange={(v) => set('fiscalYear', v)} />
              </div>
              <div className="w-[190px] max-sm:w-[calc(50%-6px)]">
                <Select label="ไตรมาส" value={course.quarter} options={quarters.map((q) => ({ value: q, label: q }))} onChange={(v) => set('quarter', v)} />
              </div>
            </div>

            <div className="flex flex-col gap-[4px]">
              <div className="flex flex-wrap items-center gap-[12px]">
                <label htmlFor="budget" className={lbl}>
                  งบประมาณ
                </label>
                <input id="budget" inputMode="numeric" value={course.budget} onChange={(e) => set('budget', e.target.value.replace(/[^\d.]/g, ''))} className={`${field} max-w-[170px] ${border("budget")}`} />
                <span className={lbl}>บาท</span>
              </div>
              {errText('budget')}
            </div>

            <div className="grid grid-cols-2 gap-[16px] max-sm:grid-cols-1">
              <div className="flex flex-col gap-[6px]">
                <span className={lbl}>วันเริ่มต้นจัดกิจกรรม</span>
                <DateInput label="วันเริ่มต้นจัดกิจกรรม" value={course.startDate} onChange={(v) => set('startDate', v)} />
                {errText('startDate')}
              </div>
              <div className="flex flex-col gap-[6px]">
                <span className={lbl}>วันสิ้นสุดกิจกรรม</span>
                <DateInput label="วันสิ้นสุดกิจกรรม" value={course.endDate} onChange={(v) => set('endDate', v)} />
                {errText('endDate')}
              </div>
            </div>

            <div className="flex flex-col gap-[6px]">
              <div className="flex flex-wrap items-center gap-[16px]">
                <span className={lbl}>กลุ่มเป้าหมาย</span>
                <div className="w-[226px] max-sm:w-full">
                  <Select label="กลุ่มเป้าหมาย" value={course.target} placeholder="เลือกกลุ่มเป้าหมาย" options={targets.map((t) => ({ value: t, label: t }))} onChange={(v) => set('target', v)} />
                </div>
              </div>
              {errText('target')}
            </div>

            <div className="flex flex-col gap-[16px] border-t border-gray-line pt-[16px]">
              <p className="text-[12px] font-medium text-gray-20">รายละเอียดการจัด (ใช้แสดงในรายการแผนและบันทึกการอบรม)</p>
              <div className="grid grid-cols-2 gap-[16px] max-sm:grid-cols-1">
                <div className="flex flex-col gap-[6px]">
                  <span className={lbl}>ส่วนงานที่จัด</span>
                  <Select label="ส่วนงานที่จัด" value={course.org} options={orgs.map((o) => ({ value: o, label: o }))} onChange={(v) => set('org', v)} />
                </div>
                <Field label="วิทยากร">
                  <input className={field} value={course.instructor} placeholder="ชื่อวิทยากร" onChange={(e) => set('instructor', e.target.value)} />
                </Field>
                <div className="col-span-2 flex flex-col gap-[6px] max-sm:col-span-1">
                  <Field label="สถานที่จัด">
                    <input className={`${field} ${border('place')}`} value={course.place} placeholder="เช่น มหาวิทยาลัยเชียงใหม่" onChange={(e) => set('place', e.target.value)} />
                  </Field>
                  {errText('place')}
                </div>
              </div>
            </div>
          </div>
        </Board>
      )}

      {tab === 'schedule' && (
        <>
          <Board title="เลือกแม่แบบ">
            <ul className="grid grid-cols-4 gap-[12px] max-lg:grid-cols-2 max-sm:grid-cols-1">
              {scheduleTemplates.map((t, i) => (
                <li key={t.name}>
                  <button
                    type="button"
                    aria-pressed={course.scheduleTemplate === i && course.schedule.length > 0}
                    onClick={() => setCourse((c) => ({ ...c, scheduleTemplate: i, schedule: t.rows.map(([time, activity], k) => ({ id: uid('s') + k, time, activity })) }))}
                    className={`flex h-full w-full flex-col gap-[6px] rounded-[10px] border p-[12px] text-left transition-colors hover:border-blue-10 focus-visible:outline-2 focus-visible:outline-blue-00 ${
                      course.scheduleTemplate === i && course.schedule.length > 0 ? 'border-blue-00 bg-blue-bg' : 'border-gray-line bg-gray-subtle'
                    }`}
                  >
                    <span className="text-[14px] font-semibold text-black">{t.name}</span>
                    <span className="text-[12px] leading-[1.5] font-light text-gray-20">{t.hint}</span>
                    <span className="text-[11px] text-blue-00">{t.rows.length} รายการ</span>
                  </button>
                </li>
              ))}
            </ul>
            <p className="px-[4px] pt-[8px] text-[11px] font-light text-gray-20">เลือกแม่แบบใหม่จะแทนที่กำหนดการเดิมทั้งหมด</p>
          </Board>
          <Board title="ปรับแต่งข้อมูล">
            <div className="flex flex-col gap-[10px]">
              {course.schedule.length === 0 && <p className="py-[28px] text-center text-[14px] font-medium text-black">แสดงแม่แบบที่เลือก</p>}
              {course.schedule.map((r, i) => (
                <div key={r.id} className="grid grid-cols-[160px_minmax(0,1fr)_32px] items-center gap-[8px] max-sm:grid-cols-[110px_minmax(0,1fr)_32px]">
                  <input aria-label={`เวลา รายการที่ ${i + 1}`} className={`${field} h-[40px] text-[13px]`} value={r.time} placeholder="เวลา" onChange={(e) => set('schedule', course.schedule.map((x) => (x.id === r.id ? { ...x, time: e.target.value } : x)))} />
                  <input aria-label={`กิจกรรม รายการที่ ${i + 1}`} className={`${field} h-[40px] text-[13px]`} value={r.activity} placeholder="กิจกรรม" onChange={(e) => set('schedule', course.schedule.map((x) => (x.id === r.id ? { ...x, activity: e.target.value } : x)))} />
                  <button type="button" aria-label={`ลบรายการที่ ${i + 1}`} onClick={() => set('schedule', course.schedule.filter((x) => x.id !== r.id))} className="flex size-[32px] items-center justify-center rounded-[8px] hover:bg-red-20">
                    <img src={iconTrash} alt="" width={16} height={16} />
                  </button>
                </div>
              ))}
              <div className="flex items-center gap-[12px]">
                <button type="button" className={outlineBtn} onClick={() => set('schedule', [...course.schedule, { id: uid('s'), time: '', activity: '' }])}>
                  <img src={iconPlus} alt="" width={14} height={14} className="brightness-0 saturate-100 [filter:invert(36%)_sepia(98%)_saturate(2879%)_hue-rotate(200deg)]" />
                  เพิ่มรายการ
                </button>
                {errText('schedule')}
              </div>
            </div>
          </Board>
        </>
      )}

      {tab === 'budget' && (
        <Board title="แผนงบประมาณและบัญชี">
          <div className="flex flex-col gap-[16px]">
            <div className="grid grid-cols-2 gap-[16px] max-sm:grid-cols-1">
              <div className="flex flex-col gap-[6px]">
                <Field label="รหัสงบประมาณ">
                  <input className={`${field} ${border('budgetCode')}`} value={course.budgetCode} placeholder="เช่น 2568-LD-001" onChange={(e) => set('budgetCode', e.target.value)} />
                </Field>
                {errText('budgetCode')}
              </div>
              <Field label="เลขบัญชีที่ผูกกับโครงการ">
                <input className={field} value={course.accountNo} inputMode="numeric" placeholder="เลขบัญชี (ถ้ามี)" onChange={(e) => set('accountNo', e.target.value)} />
              </Field>
            </div>
            <div className="flex flex-col gap-[8px]">
              {course.budgetLines.map((l, i) => (
                <div key={l.id} className="grid grid-cols-[minmax(0,1fr)_150px_32px] items-center gap-[8px] max-sm:grid-cols-[minmax(0,1fr)_100px_32px]">
                  <input aria-label={`รายการงบ ${i + 1}`} className={`${field} h-[40px] text-[13px]`} value={l.item} placeholder="รายการ เช่น ค่าวิทยากร" onChange={(e) => set('budgetLines', course.budgetLines.map((x) => (x.id === l.id ? { ...x, item: e.target.value } : x)))} />
                  <input aria-label={`จำนวนเงิน ${i + 1}`} inputMode="decimal" className={`${field} h-[40px] text-right text-[13px]`} value={l.amount} placeholder="0.00" onChange={(e) => set('budgetLines', course.budgetLines.map((x) => (x.id === l.id ? { ...x, amount: e.target.value.replace(/[^\d.]/g, '') } : x)))} />
                  <button type="button" aria-label={`ลบรายการงบ ${i + 1}`} onClick={() => set('budgetLines', course.budgetLines.filter((x) => x.id !== l.id))} className="flex size-[32px] items-center justify-center rounded-[8px] hover:bg-red-20">
                    <img src={iconTrash} alt="" width={16} height={16} />
                  </button>
                </div>
              ))}
              <div className="flex items-center gap-[12px]">
                <button type="button" className={outlineBtn} onClick={() => set('budgetLines', [...course.budgetLines, { id: uid('b'), item: '', amount: '' }])}>
                  เพิ่มรายการงบ
                </button>
                {errText('budgetLines')}
              </div>
            </div>
            <dl className="grid grid-cols-3 gap-[8px] rounded-[10px] bg-gray-subtle p-[12px] text-[12px] max-sm:grid-cols-1">
              <div>
                <dt className="text-gray-20">งบประมาณตามแผน</dt>
                <dd className="font-urbanist text-[16px] font-medium text-black">{fmt(planBudget)} บาท</dd>
              </div>
              <div>
                <dt className="text-gray-20">รวมตามรายการ</dt>
                <dd className="font-urbanist text-[16px] font-medium text-black">{fmt(budgetTotal)} บาท</dd>
              </div>
              <div>
                <dt className="text-gray-20">คงเหลือ</dt>
                <dd className={`font-urbanist text-[16px] font-medium ${planBudget - budgetTotal < 0 ? 'text-red-00' : 'text-green-text'}`}>{fmt(planBudget - budgetTotal)} บาท</dd>
              </div>
            </dl>
            {planBudget > 0 && budgetTotal > planBudget && <p className="text-[12px] font-light text-red-00">รวมตามรายการเกินงบประมาณที่ตั้งไว้ กรุณาตรวจสอบก่อนส่งขออนุมัติ</p>}
          </div>
        </Board>
      )}

      {tab === 'approve' && (
        <Board title="ขออนุมัติ">
          <div className="flex flex-col gap-[16px]">
            <ul className="grid grid-cols-2 gap-[8px] text-[13px] max-sm:grid-cols-1">
              {[
                ['วางแผนหลักสูตร', !marks.has('course')],
                ['แผนการอบรม', !marks.has('schedule')],
                ['แผนงบประมาณและบัญชี', !marks.has('budget')],
              ].map(([t, ok]) => (
                <li key={t as string} className={`flex items-center gap-[8px] rounded-[8px] px-[12px] py-[10px] ${ok ? 'bg-green-bg text-green-text' : 'bg-red-20 text-red-00'}`}>
                  <span aria-hidden="true">{ok ? '✓' : '!'}</span>
                  {t} · {ok ? 'ครบถ้วน' : 'ยังกรอกไม่ครบ'}
                </li>
              ))}
            </ul>

            <ol className="flex flex-col gap-[8px]">
              {course.approval.steps.map((s, i) => {
                const prevDone = i === 0 || !!course.approval.steps[i - 1].doneAt
                return (
                  <li key={s.role} className="flex flex-wrap items-center gap-[12px] rounded-[10px] border border-gray-line p-[12px]">
                    <span className={`flex size-[28px] shrink-0 items-center justify-center rounded-full text-[12px] font-medium ${s.doneAt ? 'bg-green text-white-soft' : 'bg-gray-bg text-gray-30'}`}>{i + 1}</span>
                    <div className="min-w-0 flex-1">
                      <p className="text-[14px] font-medium text-black">{s.role}</p>
                      <p className="text-[12px] font-light text-gray-20">{s.name}</p>
                    </div>
                    {s.doneAt ? (
                      <span className="text-[12px] font-medium text-green-text">ลงนามแล้ว {thaiLong(s.doneAt)}</span>
                    ) : (
                      <button type="button" className={softBtn} disabled={course.approval.state !== 'pending' || !prevDone} onClick={() => sign(i)}>
                        ลงนามอนุมัติ (e-Signature)
                      </button>
                    )}
                  </li>
                )
              })}
            </ol>

            <div className="flex flex-wrap items-center gap-[12px]">
              {course.approval.state === 'none' && (
                <button type="button" className={primaryBtn} onClick={submit}>
                  ส่งขออนุมัติ
                </button>
              )}
              {course.approval.state === 'pending' && (
                <>
                  <span className="rounded-[6px] bg-blue-20 px-[8px] py-[4px] text-[12px] font-medium text-blue-00">รออนุมัติ</span>
                  {!course.approval.steps.some((s) => s.doneAt) && (
                    <button type="button" className={outlineBtn} onClick={withdraw}>
                      ถอนคำขอ
                    </button>
                  )}
                </>
              )}
              {course.approval.state === 'approved' && <span className="rounded-[6px] bg-green-bg px-[8px] py-[4px] text-[12px] font-medium text-green-text">อนุมัติครบทุกลำดับ · เปิดดำเนินการแล้ว</span>}
            </div>
            <p className="text-[11px] font-light text-gray-20">ต้องอนุมัติตามลำดับชั้นอย่างน้อย 2 ชั้นผ่านระบบลงนามอิเล็กทรอนิกส์ (TOR 4.7) — หน้านี้จำลองการลงนามด้วยการกดปุ่ม</p>
          </div>
        </Board>
      )}

      <div className="flex justify-end pt-[4px]">
        <button type="button" onClick={saveDraft} className={primaryBtn}>
          <img src={iconSave} alt="" width={16} height={16} className="brightness-0 invert" />
          บันทึกแบบร่าง
        </button>
      </div>

      <Modal open={preview} title="ตัวอย่างแผนการอบรม" onClose={() => setPreview(false)}>
        <dl className="grid grid-cols-[120px_minmax(0,1fr)] gap-x-[12px] gap-y-[8px] text-[13px] leading-[1.5]">
          {[
            ['ชื่อหลักสูตร', course.name === NAME_PLACEHOLDER ? '–' : course.name],
            ['ประเภท', course.courseType || '–'],
            ['ปี/ไตรมาส', `${course.fiscalYear} · ${course.quarter}`],
            ['งบประมาณ', `${fmt(planBudget)} บาท`],
            ['วันที่', `${thaiLong(course.startDate)}${course.endDate && course.endDate !== course.startDate ? ` – ${thaiLong(course.endDate)}` : ''}`],
            ['กลุ่มเป้าหมาย', course.target || '–'],
            ['ส่วนงานที่จัด', course.org],
            ['สถานที่', course.place || '–'],
            ['วิทยากร', course.instructor || '–'],
            ['กำหนดการ', course.schedule.length ? course.schedule.map((r) => `${r.time} ${r.activity}`).join(' / ') : '–'],
          ].map(([k, v]) => (
            <div key={k} className="contents">
              <dt className="font-medium text-gray-20">{k}</dt>
              <dd className="font-light text-black">{v}</dd>
            </div>
          ))}
        </dl>
      </Modal>
      <ConfirmDialog
        open={askDelete}
        danger
        title="ลบแผนการอบรม?"
        confirm="ลบ"
        text={<>“{course.name}” จะถูกลบพร้อมรายชื่อผู้เข้าอบรมของหลักสูตรนี้</>}
        onClose={() => setAskDelete(false)}
        onConfirm={() => {
          deleteCourse(course.id)
          navigate('/leader')
        }}
      />
      {toast}
    </div>
  )
}
