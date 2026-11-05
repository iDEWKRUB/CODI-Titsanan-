import { useMemo, useRef, useState } from 'react'
import { useParams } from 'react-router-dom'
import iconEye from '../assets/survey/icon-eye.svg'
import iconPlus from '../assets/survey/icon-plus.svg'
import iconSend from '../assets/meeting/c-send.svg'
import iconTrash from '../assets/survey/icon-trash.svg'
import iconUpload from '../assets/meeting/c-upload.svg'
import { BackTitle, Field, lbl, primaryBtn, softBtn, useToast } from '../components/leader/Parts'
import { field } from '../components/meeting/FormParts'
import { PmSection, pmPage, RoleSwitch, roField } from '../components/pm/Parts'
import { DateInput } from '../components/ui/DateTimeInputs'
import Modal from '../components/ui/Modal'
import Select from '../components/ui/Select'
import { thaiLong } from '../data/leader'
import type { ProgressReport } from '../data/projects'
import { getProject, updateProject, useDisbursements, usePmRole, useProjects } from '../lib/projectStore'

const blank = (period: string): ProgressReport => ({ id: 'r' + period, period, disbursementNo: '', informant: '', informDate: '', position: '', phone: '', committee: [], meetings: [], finance: [], collaboration: [], plan: [], followups: [], file: '' })
type ListKey = 'committee' | 'meetings' | 'finance' | 'collaboration' | 'plan'
const listTitles: Record<ListKey, string> = { committee: 'ข้อมูลคณะกรรมการ', meetings: 'ข้อมูลการประชุม', finance: '3. ข้อมูลการเงินของกลุ่ม/สหกรณ์', collaboration: '4. การทำงานร่วมกัน', plan: '5. แผนการดำเนินงาน' }
const hints: Record<ListKey, string> = { committee: 'เช่น ชื่อ-ตำแหน่งกรรมการ', meetings: 'เช่น วันที่ประชุม วาระ จำนวนผู้เข้าร่วม', finance: 'เช่น รายรับ-รายจ่าย เงินคงเหลือ', collaboration: 'เช่น หน่วยงานที่ร่วมทำงาน กิจกรรม', plan: 'เช่น กิจกรรมที่จะดำเนินการงวดถัดไป' }

/** OSS-Project Management › รายงานและติดตามผล (Commu: fill in · Staff: read-only) */
export default function ProjectReportPage() {
  const { id } = useParams()
  const role = usePmRole()
  const projects = useProjects()
  const disbs = useDisbursements()
  const p = projects.find((x) => x.id === Number(id)) ?? getProject(Number(id))
  const [period, setPeriod] = useState('1')
  const [edits, setEdits] = useState<Record<string, ProgressReport>>({})
  const [adding, setAdding] = useState<ListKey | null>(null)
  const [text, setText] = useState('')
  const [preview, setPreview] = useState(false)
  const [tried, setTried] = useState(false)
  const [toast, showToast] = useToast()
  const file = useRef<HTMLInputElement>(null)

  const saved = p?.reports.find((r) => r.period === period)
  const r = edits[period] ?? saved ?? blank(period)
  const locked = role === 'staff' || !!saved?.submittedAt
  const set = (patch: Partial<ProgressReport>) => setEdits((x) => ({ ...x, [period]: { ...r, ...patch } }))
  const errors = useMemo(() => {
    const e: Record<string, string> = {}
    if (!r.informant.trim()) e.informant = 'กรุณาระบุผู้ให้ข้อมูล'
    if (!r.informDate) e.informDate = 'กรุณาเลือกวันที่ให้ข้อมูล'
    if (!r.meetings.length && !r.finance.length && !r.plan.length) e.content = 'กรุณาเพิ่มข้อมูลรายงานอย่างน้อย 1 หัวข้อ (ประชุม การเงิน หรือแผนงาน)'
    return e
  }, [r])
  const e = tried ? errors : {}

  if (!p)
    return (
      <div className={pmPage}>
        <BackTitle title="รายงานและติดตามผล" to="/projects" />
        <p className="rounded-[12px] bg-gray-subtle p-[24px] text-center text-[14px] text-gray-20">ไม่พบโครงการนี้</p>
      </div>
    )

  const submit = () => {
    setTried(true)
    if (Object.keys(errors).length) return showToast('กรุณากรอกข้อมูลรายงานให้ครบ')
    const done = { ...r, submittedAt: new Date().toISOString().slice(0, 10) }
    updateProject(p.id, (x) => ({ ...x, reports: [...x.reports.filter((y) => y.period !== period), done], timeline: [...x.timeline, { at: done.submittedAt!, text: `ส่งรายงานความก้าวหน้างวดที่ ${period}` }] }))
    setEdits((x) => {
      const n = { ...x }
      delete n[period]
      return n
    })
    showToast('ส่งรายงานแล้ว')
  }
  const myDisb = disbs.filter((d) => d.projectId === p.id && d.status !== 'draft')
  const empty = <p className="text-[13px] font-light text-gray-20">ไม่พบข้อมูล</p>

  const ListBlock = ({ k, bar }: { k: ListKey; bar?: boolean }) => (
    <div className={bar ? 'flex flex-col gap-[10px]' : 'flex flex-col gap-[8px]'}>
      <div className={`flex items-center gap-[12px] ${bar ? 'rounded-[6px] bg-blue-bg px-[12px] py-[8px]' : ''}`}>
        <span className={`min-w-0 flex-1 ${bar ? 'text-[14px] font-medium' : lbl}`}>{listTitles[k]}</span>
        {!locked && (
          <button type="button" className={primaryBtn} onClick={() => (setAdding(k), setText(''))}>
            <img src={iconPlus} alt="" width={14} height={14} className="brightness-0 invert" />
            เพิ่มข้อมูล
          </button>
        )}
      </div>
      {r[k].length === 0 ? (
        locked && role === 'staff' ? empty : null
      ) : (
        <ul className="flex flex-col gap-[6px] pl-[12px] text-[13px] font-light">
          {r[k].map((t, i) => (
            <li key={t + i} className="flex items-start gap-[8px]">
              <span className="min-w-0 flex-1 whitespace-pre-line">• {t}</span>
              {!locked && (
                <button type="button" aria-label="ลบข้อมูล" onClick={() => set({ [k]: r[k].filter((_, j) => j !== i) } as Partial<ProgressReport>)} className="flex size-[24px] shrink-0 items-center justify-center rounded-[6px] hover:bg-red-20">
                  <img src={iconTrash} alt="" width={14} height={14} />
                </button>
              )}
            </li>
          ))}
        </ul>
      )}
    </div>
  )

  return (
    <div className={pmPage}>
      <BackTitle title="รายงานและติดตามผล" to={`/projects/${p.id}`} actions={<RoleSwitch />} />
      {saved?.submittedAt && <p className="rounded-[10px] bg-green-bg px-[16px] py-[10px] text-[13px] font-light text-green-text">ส่งรายงานงวดที่ {period} แล้วเมื่อ {thaiLong(saved.submittedAt)}</p>}
      {role === 'staff' && !saved && <p className="rounded-[10px] bg-blue-bg px-[16px] py-[10px] text-[13px] font-light text-blue-00">มุมมองเจ้าหน้าที่: งวดที่ {period} ชุมชนยังไม่ส่งรายงาน</p>}

      <PmSection title="รายละเอียดโครงการ">
        <div className="grid grid-cols-[110px_minmax(0,1fr)_110px_minmax(0,1.4fr)] items-center gap-x-[16px] gap-y-[16px] max-md:grid-cols-1">
          <span className={lbl}>รหัสโครงการ</span>
          <input readOnly className={roField} value={p.code} aria-label="รหัสโครงการ" />
          <span className={`${lbl} md:text-right`}>ชื่อโครงการ</span>
          <input readOnly className={roField} value={p.name} aria-label="ชื่อโครงการ" />
          <span className={lbl}>ตำบล</span>
          <input readOnly className={roField} value={p.area.subdistrict} aria-label="ตำบล" />
          <span className={`${lbl} md:text-right`}>อำเภอ / จังหวัด</span>
          <input readOnly className={roField} value={`${p.area.district} / ${p.area.province}`} aria-label="อำเภอและจังหวัด" />
        </div>
      </PmSection>

      <PmSection title="รายงานความก้าวหน้า">
        <div className="flex flex-col gap-[16px]">
          <h3 className="rounded-[6px] bg-blue-bg px-[12px] py-[8px] text-[14px] font-medium">1. ข้อมูลทั่วไป</h3>
          <div className="grid grid-cols-2 gap-[16px] max-sm:grid-cols-1">
            <div className="flex flex-col gap-[6px]">
              <span className={lbl}>งวดที่รายงาน</span>
              <Select label="งวดที่รายงาน" value={period} options={['1', '2', '3', '4'].map((x) => ({ value: x, label: x + (p.reports.some((y) => y.period === x) ? ' (ส่งแล้ว)' : '') }))} onChange={setPeriod} />
            </div>
            <div className="flex flex-col gap-[6px]">
              <span className={lbl}>งวดที่เบิก</span>
              <div className={locked ? 'pointer-events-none opacity-60' : ''}>
                <Select label="งวดที่เบิก" value={r.disbursementNo} placeholder="เลือกใบเบิก" options={myDisb.map((d) => ({ value: `DB-${String(d.id).padStart(4, '0')} งวด ${d.period}`, label: `DB-${String(d.id).padStart(4, '0')} · งวดที่ ${d.period}` }))} onChange={(v) => set({ disbursementNo: v })} />
              </div>
            </div>
            <Field label="ผู้ให้ข้อมูล" error={e.informant}>
              <input aria-label="ผู้ให้ข้อมูล" disabled={locked} className={`${locked ? roField : field} ${e.informant ? 'border-red-00' : ''}`} value={r.informant} onChange={(ev) => set({ informant: ev.target.value })} />
            </Field>
            <div className="flex flex-col gap-[6px]">
              <span className={lbl}>วันที่ให้ข้อมูล</span>
              <div className={locked ? 'pointer-events-none opacity-60' : ''}>
                <DateInput label="วันที่ให้ข้อมูล" value={r.informDate} onChange={(v) => set({ informDate: v })} />
              </div>
              {e.informDate && <span role="alert" className="text-[12px] text-red-00">{e.informDate}</span>}
            </div>
            <Field label="ตำแหน่ง">
              <input aria-label="ตำแหน่ง" disabled={locked} className={locked ? roField : field} value={r.position} onChange={(ev) => set({ position: ev.target.value })} />
            </Field>
            <Field label="เบอร์โทรศัพท์">
              <input aria-label="เบอร์โทรศัพท์" inputMode="numeric" disabled={locked} className={locked ? roField : field} value={r.phone} onChange={(ev) => set({ phone: ev.target.value })} />
            </Field>
          </div>

          <h3 className="rounded-[6px] bg-blue-bg px-[12px] py-[8px] text-[14px] font-medium">2. ข้อมูลการบริหารจัดการของกลุ่ม/สหกรณ์</h3>
          <ListBlock k="committee" />
          <ListBlock k="meetings" />
          <ListBlock k="finance" bar />
          <ListBlock k="collaboration" bar />
          <ListBlock k="plan" bar />
          {e.content && <p role="alert" className="text-[12px] text-red-00">{e.content}</p>}

          <h3 className="rounded-[6px] bg-blue-bg px-[12px] py-[8px] text-[14px] font-medium">6. รายการติดตามความก้าวหน้า</h3>
          <div className="flex flex-wrap items-center gap-[12px]">
            <span className={lbl}>นำเข้ารายชื่อครัวเรือนผู้เดือดร้อน</span>
            {!locked && (
              <>
                <button type="button" className={softBtn} onClick={() => file.current?.click()}>
                  <img src={iconUpload} alt="" width={14} height={14} className="[filter:invert(36%)_sepia(98%)_saturate(2879%)_hue-rotate(200deg)]" />
                  นำเข้าข้อมูล
                </button>
                <span className="text-[11px] font-light text-gray-20">ขนาดไม่เกิน 20 MB</span>
                <input ref={file} type="file" hidden onChange={(ev) => { const f = ev.target.files?.[0]; if (!f) return; if (f.size > 20 * 1024 * 1024) return showToast('ไฟล์ใหญ่เกิน 20 MB'); set({ file: f.name }) }} />
              </>
            )}
            {r.file ? <span className="text-[13px] font-light">{r.file}</span> : locked && role === 'staff' ? empty : null}
          </div>
        </div>
      </PmSection>

      <div className="flex justify-end gap-[8px]">
        <button type="button" className={softBtn} onClick={() => setPreview(true)}>
          <img src={iconEye} alt="" width={16} height={16} />
          ตัวอย่าง
        </button>
        {!locked && (
          <button type="button" className={primaryBtn} onClick={submit}>
            <img src={iconSend} alt="" width={16} height={16} className="brightness-0 invert" />
            ส่งเอกสาร
          </button>
        )}
      </div>

      <Modal open={!!adding} title={adding ? listTitles[adding].replace(/^\d\. /, '') : ''} onClose={() => setAdding(null)}>
        <textarea autoFocus aria-label="รายละเอียด" className={`${field} h-[120px] py-[10px]`} placeholder={adding ? hints[adding] : ''} value={text} onChange={(ev) => setText(ev.target.value)} />
        <div className="flex justify-end gap-[8px]">
          <button type="button" className={softBtn} onClick={() => setAdding(null)}>
            ยกเลิก
          </button>
          <button type="button" className={primaryBtn} disabled={!text.trim()} onClick={() => (set({ [adding!]: [...r[adding!], text.trim()] } as Partial<ProgressReport>), setAdding(null))}>
            เพิ่ม
          </button>
        </div>
      </Modal>
      <Modal open={preview} title={`ตัวอย่างรายงานงวดที่ ${period}`} onClose={() => setPreview(false)} width="max-w-[640px]">
        <dl className="grid grid-cols-[130px_minmax(0,1fr)] gap-x-[12px] gap-y-[8px] text-[13px] leading-[1.5]">
          {[
            ['โครงการ', `${p.code} ${p.name}`],
            ['ผู้ให้ข้อมูล', `${r.informant || '–'} (${r.position || '–'}) โทร ${r.phone || '–'}`],
            ['วันที่', r.informDate ? thaiLong(r.informDate) : '–'],
            ['งวดที่เบิก', r.disbursementNo || '–'],
            ...(Object.keys(listTitles) as ListKey[]).map((k) => [listTitles[k].replace(/^\d\. /, ''), r[k].length ? r[k].join(' / ') : '–']),
            ['ไฟล์แนบ', r.file || '–'],
          ].map(([k, v]) => (
            <div key={k} className="contents">
              <dt className="font-medium text-gray-20">{k}</dt>
              <dd className="font-light whitespace-pre-line text-black">{v}</dd>
            </div>
          ))}
        </dl>
      </Modal>
      {toast}
    </div>
  )
}
