import { useEffect, useRef, useState } from 'react'
import { Link, useNavigate, useParams, useSearchParams } from 'react-router-dom'
import iconArrowLeft from '../assets/builder/icon-arrow-left.svg'
import iconCopy from '../assets/builder/icon-copy.svg'
import iconEye from '../assets/builder/icon-eye.svg'
import iconSaveBlue from '../assets/builder/icon-save-blue.svg'
import iconTrash from '../assets/builder/icon-trash.svg'
import toggleOff from '../assets/builder/toggle-off.svg'
import toggleOn from '../assets/builder/toggle-on.svg'
import iconFile from '../assets/meeting/a-file.svg'
import iconReset from '../assets/meeting/c-arrow-clockwise.svg'
import iconCalendar from '../assets/meeting/c-calendar.svg'
import iconSend from '../assets/meeting/c-send.svg'
import iconCheck from '../assets/meeting/e-check.svg'
import iconImage from '../assets/meeting/e-image.svg'
import iconPlus from '../assets/meeting/e-plus.svg'
import iconUpload from '../assets/meeting/e-upload.svg'
import iconX from '../assets/meeting/e-x.svg'
import { field, IconBtn } from '../components/meeting/FormParts'
import { DateInput } from '../components/ui/DateTimeInputs'
import Modal from '../components/ui/Modal'
import Select from '../components/ui/Select'
import { expenseKinds, toIso, vehicles, type Expense, type Meeting } from '../data/meetings'
import { uid } from '../data/surveyBuilder'
import { updateMeeting, useMeetings } from '../lib/meetingStore'
import { thaiDate } from './MeetingDetailPage'

type Tab = 'claim' | 'review' | 'record'
const tabs: [Tab, string][] = [
  ['claim', 'ตั้งเบิกค่าใช้จ่ายโครงการ'],
  ['review', 'ตรวจสอบรายการ'],
  ['record', 'บันทึกหลักฐานค่าใช้จ่าย'],
]

const num = (s: string) => Number(String(s).replace(/,/g, '')) || 0
const money = (n: number) => n.toLocaleString('th-TH', { minimumFractionDigits: 2, maximumFractionDigits: 2 })
const total = (list: Expense[] = []) => list.reduce((s, e) => s + num(e.amount), 0)
const isVehicle = (e: Expense) => e.kind === 'เบิกค่าพาหนะ' || e.kind === 'เบิกค่าเดินทาง'
const isFuel = (e: Expense) => isVehicle(e) && (e.vehicle === 'รถยนต์' || e.vehicle === 'รถจักรยานยนต์')
const unitWord = (e: Expense) => (isFuel(e) ? 'ลิตร' : isVehicle(e) ? 'เที่ยว' : e.kind === 'เบิกค่าที่พัก' ? 'คืน' : e.kind === 'เบิกค่าอาหาร' ? 'มื้อ' : 'วัน')
const isImage = (f: string) => /\.(png|jpe?g|gif|webp|heic)$/i.test(f)

const blankItem = (m: Meeting): Expense => ({ id: uid('e'), date: m.date || toIso(new Date()), kind: expenseKinds[0], item: '', vehicle: vehicles[0], amount: '', units: '', files: [] })

const label = 'text-[14px] leading-[normal] font-medium text-ink'

/** One expense line. `claim` = Meeting/Create (517:27056) fields, `record` = Improvement/Record (517:18355) fields */
function ExpenseCard({ e, mode, index, count, error, onChange, onRemove }: { e: Expense; mode: 'claim' | 'record'; index: number; count: number; error?: string; onChange: (e: Expense) => void; onRemove: () => void }) {
  const fileInput = useRef<HTMLInputElement>(null)
  const set = (p: Partial<Expense>) => onChange({ ...e, ...p })
  const amountLabel = mode === 'record' ? 'ยอดใช้จ่าย' : isFuel(e) ? 'ค่าน้ำมัน' : isVehicle(e) ? 'ค่าโดยสาร' : 'จำนวนเงิน'
  const unitsLabel = mode === 'record' ? 'จำนวนหน่วยที่ใช้' : isFuel(e) ? 'จำนวนลิตร' : `จำนวน${unitWord(e)}`
  const showVehicle = mode === 'claim' && isVehicle(e)
  return (
    <div className={`flex flex-col gap-[24px] rounded-[12px] bg-white p-[24px] max-sm:p-[16px] ${error ? 'ring-1 ring-red-00' : ''}`}>
      <div className="flex items-center gap-[12px]">
        <h3 className="flex-1 text-[16px] leading-[normal] font-medium text-black">
          รายการเบิกค่าใช้จ่าย{count > 1 ? ` ${index + 1}` : ''}
        </h3>
        {count > 1 && (
          <button type="button" aria-label={`ลบรายการที่ ${index + 1}`} onClick={onRemove} className="flex rounded-[8px] p-[6px] hover:bg-gray-subtle">
            <img src={iconTrash} alt="" width={18} height={18} />
          </button>
        )}
      </div>
      <div className="flex flex-col gap-[12px] px-[24px] max-sm:px-0">
        <div className="grid grid-cols-2 gap-[12px] max-md:grid-cols-1">
          <label className="flex flex-col gap-[12px]">
            <span className={label}>วันที่</span>
            <DateInput value={e.date} onChange={(date) => set({ date })} label={`วันที่รายการ ${index + 1}`} icon={iconCalendar} />
          </label>
          <div className="flex flex-col gap-[12px]">
            <span className={label}>ประเภทค่าใช้จ่าย</span>
            <Select label={`ประเภทค่าใช้จ่ายรายการ ${index + 1}`} value={e.kind} onChange={(kind) => set({ kind })} options={expenseKinds.map((k) => ({ value: k, label: k }))} />
          </div>
        </div>
        <div className="grid grid-cols-3 gap-[12px] max-md:grid-cols-1">
          {showVehicle ? (
            <div className="flex flex-col gap-[12px]">
              <span className={label}>ประเภทพาหนะ</span>
              <Select label={`ประเภทพาหนะรายการ ${index + 1}`} value={e.vehicle} onChange={(vehicle) => set({ vehicle })} options={vehicles.map((v) => ({ value: v, label: v }))} />
            </div>
          ) : (
            <label className="flex flex-col gap-[12px]">
              <span className={label}>รายการ</span>
              <input value={e.item} onChange={(ev) => set({ item: ev.target.value })} placeholder={isFuel(e) ? 'ค่าน้ำมันสำหรับเดินทาง' : 'ระบุรายการ'} className={field} />
            </label>
          )}
          <label className="flex flex-col gap-[12px]">
            <span className={label}>{amountLabel}</span>
            <span className="relative">
              <input
                value={e.amount}
                inputMode="decimal"
                onChange={(ev) => set({ amount: ev.target.value.replace(/[^\d.,]/g, '') })}
                onBlur={() => e.amount && set({ amount: money(num(e.amount)) })}
                placeholder="0.00"
                aria-invalid={!!error}
                className={`${field} pr-[44px] text-right font-urbanist`}
              />
              <span className="pointer-events-none absolute top-1/2 right-[14px] -translate-y-1/2 text-[12px] font-light text-gray-20">บาท</span>
            </span>
          </label>
          <label className="flex flex-col gap-[12px]">
            <span className={label}>{unitsLabel}</span>
            <span className="relative">
              <input
                value={e.units}
                inputMode="decimal"
                onChange={(ev) => set({ units: ev.target.value.replace(/[^\d.]/g, '') })}
                placeholder="0"
                className={`${field} pr-[52px] text-right font-urbanist`}
              />
              <span className="pointer-events-none absolute top-1/2 right-[14px] -translate-y-1/2 text-[12px] font-light text-gray-20">{unitWord(e)}</span>
            </span>
          </label>
        </div>
        {error && <p className="text-[12px] font-light text-red-00">{error}</p>}
      </div>
      <hr className="max-w-[815px] border-gray-line" />
      <div className="flex flex-col gap-[12px]">
        <span className="text-[16px] leading-[normal] font-medium text-black">{mode === 'record' ? 'แนบเอกสารหลักฐาน/ใบเสร็จการใช้เงิน' : 'แนบเอกสาร/ภาพถ่ายกิจกรรม'}</span>
        <button type="button" onClick={() => fileInput.current?.click()} className="flex w-fit items-center gap-[4px] rounded-[8px] bg-blue-00 px-[12px] py-[10px] transition hover:brightness-110">
          <img src={iconUpload} alt="" width={16} height={16} className="my-px" />
          <span className="p-[2px] text-[14px] font-medium text-white-soft">นำเข้าเอกสาร/ภาพ</span>
        </button>
        <input
          ref={fileInput}
          type="file"
          multiple
          hidden
          accept=".pdf,.doc,.docx,.xls,.xlsx,image/*"
          onChange={(ev) => {
            const names = Array.from(ev.target.files ?? [], (f) => f.name)
            if (names.length) set({ files: [...e.files, ...names] })
            ev.target.value = ''
          }}
        />
        {e.files.length > 0 && (
          <ul className="flex flex-col">
            {e.files.map((f, i) => (
              <li key={`${f}-${i}`} className="flex h-[48px] w-[388px] max-w-full items-center gap-[10px]">
                <span className="flex rounded-[5px] p-[3px]">
                  <img src={isImage(f) ? iconImage : iconFile} alt="" width={18} height={18} />
                </span>
                <span className="min-w-0 flex-1 truncate text-[12px] font-light text-ink opacity-90">{f}</span>
                <button type="button" aria-label={`ลบ ${f}`} onClick={() => set({ files: e.files.filter((_, k) => k !== i) })} className="flex rounded-[6px] p-[4px] hover:bg-gray-subtle">
                  <img src={iconX} alt="" width={16} height={16} />
                </button>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  )
}

function Steps({ m }: { m: Meeting }) {
  const order = ['draft', 'submitted', 'recorded'] as const
  const at = m.expenseStatus === 'none' ? -1 : order.indexOf(m.expenseStatus as (typeof order)[number])
  const steps = ['ตั้งเบิกค่าใช้จ่าย', 'ยื่นเอกสารเตรียมเคลียร์เงิน', 'บันทึกหลักฐานค่าใช้จ่าย']
  return (
    <ol className="flex items-center gap-[8px] max-sm:flex-col max-sm:items-start">
      {steps.map((s, i) => {
        const done = i <= at && !(i === 0 && m.expenseStatus === 'none')
        return (
          <li key={s} className="flex items-center gap-[8px]">
            <span className={`flex size-[24px] items-center justify-center rounded-full text-[11px] font-medium ${done ? 'bg-green text-white' : 'bg-gray-bg text-gray-20'}`}>{done ? '✓' : i + 1}</span>
            <span className={`text-[13px] ${done ? 'font-medium text-ink' : 'font-light text-gray-20'}`}>{s}</span>
            {i < steps.length - 1 && <span aria-hidden="true" className={`mx-[4px] h-px w-[40px] max-sm:hidden ${i < at ? 'bg-green' : 'bg-gray-line'}`} />}
          </li>
        )
      })}
    </ol>
  )
}

function Review({ m, onGo }: { m: Meeting; onGo: (t: Tab) => void }) {
  const claim = total(m.expenses)
  const spent = total(m.evidence)
  const diff = claim - spent
  const rows = (list: Expense[]) =>
    list.map((e) => (
      <tr key={e.id} className="border-t border-gray-line text-[12px] font-light text-ink">
        <td className="py-[14px] pr-[12px]">{thaiDate(e.date)}</td>
        <td className="pr-[12px]">{e.kind}</td>
        <td className="pr-[12px]">{e.item || (isVehicle(e) ? e.vehicle : '-')}</td>
        <td className="pr-[12px] text-right font-urbanist">
          {e.units || '-'} {e.units ? unitWord(e) : ''}
        </td>
        <td className="pr-[12px] text-right font-urbanist">{money(num(e.amount))}</td>
        <td className="text-right">{e.files.length ? `${e.files.length} ไฟล์` : <span className="text-red-00">ไม่มีหลักฐาน</span>}</td>
      </tr>
    ))
  const table = (title: string, list: Expense[], sum: number) => (
    <div className="flex flex-col gap-[8px] rounded-[12px] bg-white p-[24px] max-sm:p-[16px]">
      <h3 className="text-[16px] font-medium text-black">{title}</h3>
      <div className="overflow-x-auto">
        <table className="w-full min-w-[640px] table-fixed text-left">
          <colgroup>
            <col className="w-[18%]" />
            <col className="w-[18%]" />
            <col />
            <col className="w-[12%]" />
            <col className="w-[14%]" />
            <col className="w-[12%]" />
          </colgroup>
          <thead>
            <tr className="text-[10px] font-light text-gray-20">
              <th className="py-[8px] font-light">วันที่</th>
              <th className="font-light">ประเภท</th>
              <th className="font-light">รายการ</th>
              <th className="text-right font-light">จำนวน</th>
              <th className="text-right font-light">ยอด (บาท)</th>
              <th className="text-right font-light">เอกสาร</th>
            </tr>
          </thead>
          <tbody>{rows(list)}</tbody>
          <tfoot>
            <tr className="border-t-2 border-gray-line text-[13px] font-medium text-ink">
              <td colSpan={4} className="py-[12px]">
                รวม
              </td>
              <td className="text-right font-urbanist">{money(sum)}</td>
              <td />
            </tr>
          </tfoot>
        </table>
      </div>
    </div>
  )

  if (m.expenseStatus === 'none' || !m.expenses.length)
    return (
      <div className="flex flex-col items-center gap-[12px] rounded-[12px] bg-white px-[24px] py-[48px] text-center">
        <p className="text-[14px] font-light text-gray-20">ยังไม่มีรายการเบิกค่าใช้จ่าย</p>
        <button type="button" onClick={() => onGo('claim')} className="rounded-[8px] bg-blue-00 px-[16px] py-[10px] text-[14px] font-medium text-white-soft hover:brightness-110">
          ตั้งเบิกค่าใช้จ่าย
        </button>
      </div>
    )

  return (
    <div className="flex flex-col gap-[12px] rounded-[12px] bg-blue-gray p-[12px]">
      <div className="grid grid-cols-3 gap-[12px] max-md:grid-cols-1">
        {[
          ['ยอดตั้งเบิก', money(claim), 'text-ink'],
          ['ใช้จ่ายจริง', m.evidence?.length ? money(spent) : '-', 'text-ink'],
          [diff >= 0 ? 'คงเหลือคืน' : 'เบิกเพิ่ม', m.evidence?.length ? money(Math.abs(diff)) : '-', diff >= 0 ? 'text-green-text' : 'text-red-00'],
        ].map(([k, v, tone]) => (
          <div key={k} className="flex flex-col gap-[6px] rounded-[12px] bg-white p-[20px]">
            <span className="text-[12px] font-light text-gray-20">{k}</span>
            <span className={`font-urbanist text-[24px] leading-none font-extrabold ${tone}`}>
              {v}
              {v !== '-' && <span className="ml-[4px] font-sans text-[12px] font-light text-gray-20">บาท</span>}
            </span>
          </div>
        ))}
      </div>
      {table('รายการที่ตั้งเบิก', m.expenses, claim)}
      {m.evidence?.length ? table('หลักฐานการใช้จ่าย', m.evidence, spent) : null}
      {m.expenseStatus !== 'recorded' && (
        <button type="button" onClick={() => onGo(m.expenseStatus === 'draft' ? 'claim' : 'record')} className="self-end rounded-[8px] bg-blue-00 px-[16px] py-[10px] text-[14px] font-medium text-white-soft hover:brightness-110">
          {m.expenseStatus === 'draft' ? 'กลับไปยื่นคำขอเบิก' : 'บันทึกหลักฐานค่าใช้จ่าย →'}
        </button>
      )}
    </div>
  )
}

/** Expense claim for a meeting: Figma Meeting/Create set 2 (517:27056) + Improvement/Record (517:18355) at /meeting/:id/expense */
export default function MeetingExpensePage() {
  const { id } = useParams()
  const navigate = useNavigate()
  const [search, setSearch] = useSearchParams()
  const m = useMeetings().find((x) => x.id === Number(id))
  const tab = (search.get('tab') as Tab) || 'claim'
  const go = (t: Tab) => setSearch({ tab: t }, { replace: true })
  const [claim, setClaim] = useState<Expense[]>([])
  const [record, setRecord] = useState<Expense[]>([])
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [toast, setToast] = useState<string>()
  const [confirm, setConfirm] = useState<'clear' | 'delete' | null>(null)
  const loaded = useRef(false)

  useEffect(() => {
    if (!m || loaded.current) return
    loaded.current = true
    setClaim(m.expenses.length ? m.expenses : [blankItem(m)])
    // evidence starts from the claimed lines (receipts still to attach)
    setRecord(m.evidence?.length ? m.evidence : m.expenses.length ? m.expenses.map((e) => ({ ...e, id: uid('r'), files: [] })) : [blankItem(m)])
  }, [m])
  useEffect(() => {
    if (!toast) return
    const t = setTimeout(() => setToast(undefined), 2600)
    return () => clearTimeout(t)
  }, [toast])

  if (!m)
    return (
      <div className="flex flex-col items-center gap-[12px] px-[24px] py-[80px] text-center">
        <h1 className="text-[20px] font-semibold text-blue-00">ไม่พบการประชุม</h1>
        <Link to="/meeting" className="text-[14px] font-medium text-blue-00 hover:underline">
          กลับไปปฏิทินการประชุม
        </Link>
      </div>
    )

  const locked = m.expenseStatus === 'submitted' || m.expenseStatus === 'recorded'
  const check = (list: Expense[], needFiles: boolean) => {
    const e: Record<string, string> = {}
    list.forEach((x) => {
      if (num(x.amount) <= 0) e[x.id] = 'กรุณาระบุจำนวนเงิน'
      else if (needFiles && !x.files.length) e[x.id] = 'กรุณาแนบใบเสร็จหรือเอกสารหลักฐานอย่างน้อย 1 ไฟล์'
    })
    setErrors(e)
    if (Object.keys(e).length) setToast(Object.values(e)[0])
    return !Object.keys(e).length
  }
  const saveDraft = () => {
    updateMeeting(m.id, (x) => ({ ...x, expenses: claim, expenseStatus: 'draft' }))
    setToast('บันทึกแบบร่างแล้ว')
  }
  const submit = () => {
    if (!check(claim, false)) return
    updateMeeting(m.id, (x) => ({ ...x, expenses: claim, expenseStatus: 'submitted', expenseSubmittedAt: new Date().toISOString() }))
    setRecord(claim.map((e) => ({ ...e, id: uid('r'), files: [] })))
    setToast(`ยื่นเอกสารเตรียมเคลียร์เงิน ${money(total(claim))} บาทแล้ว`)
    go('review')
  }
  const saveRecord = () => {
    if (!check(record, true)) return
    updateMeeting(m.id, (x) => ({ ...x, evidence: record, expenseStatus: 'recorded' }))
    setToast('บันทึกหลักฐานค่าใช้จ่ายแล้ว')
    go('review')
  }
  const editList = (list: Expense[], setList: (l: Expense[]) => void, mode: 'claim' | 'record') => (
    <section className="flex flex-col gap-[12px] rounded-[12px] bg-blue-gray p-[12px]">
      {list.map((e, i) => (
        <ExpenseCard
          key={e.id}
          e={e}
          mode={mode}
          index={i}
          count={list.length}
          error={errors[e.id]}
          onChange={(next) => {
            setList(list.map((x) => (x.id === e.id ? next : x)))
            setErrors(({ [e.id]: _, ...rest }) => rest)
          }}
          onRemove={() => setList(list.filter((x) => x.id !== e.id))}
        />
      ))}
      <button type="button" onClick={() => setList([...list, blankItem(m)])} className="flex w-fit items-center gap-[4px] rounded-[8px] bg-blue-00 px-[12px] py-[10px] transition hover:brightness-110">
        <img src={iconPlus} alt="" width={16} height={16} className="my-px" />
        <span className="p-[2px] text-[14px] font-medium text-white-soft">เพิ่มรายการ</span>
      </button>
    </section>
  )
  const toggle = (on: boolean, text: string) => (
    <span className="flex shrink-0 items-center gap-[10px]">
      <span className="flex w-[48px] justify-center">
        <img src={on ? toggleOn : toggleOff} alt="" width={28} height={16} />
      </span>
      <span className="text-[14px] font-medium whitespace-nowrap text-black opacity-90">{text}</span>
    </span>
  )

  return (
    <div className="mx-auto flex w-full max-w-[1243px] flex-col gap-[12px] px-[24px] pb-[24px] max-sm:px-[12px]">
      <div className="flex items-center gap-[12px] pb-[12px]">
        <div className="flex min-w-0 flex-1 items-center gap-[10px]">
          <button type="button" aria-label="กลับไปรายละเอียดการประชุม" onClick={() => navigate(`/meeting/${m.id}`)} className="flex shrink-0 rounded-[8px] bg-blue-gray p-[8px] transition-colors hover:bg-blue-20">
            <img src={iconArrowLeft} alt="" width={16} height={16} />
          </button>
          <h1 className="truncate text-[20px] leading-[1.2] font-semibold text-blue-00">เบิกรายการค่าใช้จ่าย</h1>
        </div>
        <IconBtn icon={iconEye} label="ดูรายละเอียดการประชุม" onClick={() => navigate(`/meeting/${m.id}`)} />
        <IconBtn
          icon={iconCopy}
          label="ทำสำเนารายการล่าสุด"
          onClick={() => {
            if (tab === 'record') setRecord([...record, { ...record[record.length - 1], id: uid('r'), files: [] }])
            else if (!locked) setClaim([...claim, { ...claim[claim.length - 1], id: uid('e'), files: [] }])
          }}
        />
        <IconBtn icon={iconTrash} label="ลบคำขอเบิก" onClick={() => setConfirm('delete')} />
      </div>

      <div role="tablist" aria-label="ขั้นตอนการเบิก" className="mb-[12px] flex gap-[2px] rounded-[8px] bg-blue-bg max-sm:flex-col">
        {tabs.map(([k, l]) => (
          <button
            key={k}
            type="button"
            role="tab"
            aria-selected={tab === k}
            onClick={() => go(k)}
            className={`flex-1 rounded-[8px] px-[12px] py-[10px] text-[12px] leading-[normal] font-medium transition-colors ${tab === k ? 'bg-blue-00 text-white-soft' : 'text-blue-00 opacity-80 hover:opacity-100'}`}
          >
            {l}
          </button>
        ))}
      </div>

      <Steps m={m} />

      {/* Meeting the claim belongs to */}
      <section className="flex flex-col gap-[12px] rounded-[12px] bg-blue-10 p-[12px]">
        <div className="flex flex-col gap-[16px] rounded-[12px] bg-white p-[24px] max-sm:p-[16px]">
          <div className="flex items-center gap-[12px] max-sm:flex-col max-sm:items-start">
            <span className="text-[16px] font-medium text-black">ประเภทการประชุม</span>
            <span className="rounded-[8px] border border-gray-line-2 px-[14px] py-[10px] text-[14px] font-light text-ink">{m.type}</span>
          </div>
          <p className="border-b border-dashed border-gray-20 pb-[12px] text-[24px] leading-[1.1] font-medium text-black max-sm:text-[20px]">{m.title}</p>
          <p className="text-[13px] font-light text-gray-20">ประชุมวันที่ {thaiDate(m.date)}</p>
        </div>
        <div className="flex flex-wrap items-center gap-x-[24px] gap-y-[12px] rounded-[12px] bg-white px-[24px] py-[12px]">
          {toggle(m.online, 'เปิดการประชุมออนไลน์')}
          {toggle(m.registration, 'เปิดลงทะเบียนเข้าร่วมประชุม')}
        </div>
      </section>

      {tab === 'claim' &&
        (locked ? (
          <div className="flex flex-col items-start gap-[12px] rounded-[12px] bg-blue-bg p-[20px]">
            <p className="text-[14px] font-light text-gray-30">
              ยื่นคำขอเบิก {money(total(m.expenses))} บาท แล้วเมื่อ {m.expenseSubmittedAt ? new Date(m.expenseSubmittedAt).toLocaleString('th-TH', { dateStyle: 'medium', timeStyle: 'short' }) : '-'}
            </p>
            <div className="flex gap-[12px]">
              <button type="button" onClick={() => go('review')} className="rounded-[8px] bg-blue-00 px-[16px] py-[10px] text-[14px] font-medium text-white-soft hover:brightness-110">
                ดูรายการ
              </button>
              {m.expenseStatus === 'submitted' && (
                <button type="button" onClick={() => updateMeeting(m.id, (x) => ({ ...x, expenseStatus: 'draft' }))} className="rounded-[8px] px-[12px] py-[10px] text-[14px] font-medium text-blue-00 hover:underline">
                  ถอนคำขอเพื่อแก้ไข
                </button>
              )}
            </div>
          </div>
        ) : (
          <>
            {editList(claim, setClaim, 'claim')}
            <div className="flex items-center gap-[12px] py-[24px] max-sm:flex-col-reverse max-sm:items-stretch">
              <button type="button" onClick={() => setConfirm('clear')} className="flex items-center justify-center gap-[4px] rounded-[8px] px-[2px] py-[10px] transition-opacity hover:opacity-80">
                <img src={iconReset} alt="" width={16} height={16} className="my-px" />
                <span className="p-[2px] text-[14px] font-medium text-blue-00">ล้างข้อมูล</span>
              </button>
              <div className="flex flex-1 items-center justify-end gap-[12px] max-sm:flex-col-reverse max-sm:items-stretch">
                <span className="text-[13px] font-light text-gray-20 max-sm:text-center">
                  รวม <b className="font-urbanist text-[16px] font-bold text-ink">{money(total(claim))}</b> บาท
                </span>
                <button type="button" onClick={saveDraft} className="flex items-center justify-center gap-[4px] rounded-[8px] bg-blue-bg px-[12px] py-[10px] transition-colors hover:bg-blue-20">
                  <img src={iconSaveBlue} alt="" width={16} height={16} className="my-px" />
                  <span className="p-[2px] text-[14px] font-medium text-blue-00">บันทึกแบบร่าง</span>
                </button>
                <button type="button" onClick={submit} className="flex items-center justify-center gap-[4px] rounded-[8px] bg-blue-00 px-[12px] py-[10px] transition hover:brightness-110">
                  <img src={iconSend} alt="" width={16} height={16} className="my-px" />
                  <span className="p-[2px] text-[14px] font-medium text-white-soft">ยื่นเอกสารเตรียมเคลียร์เงิน</span>
                </button>
              </div>
            </div>
          </>
        ))}

      {tab === 'review' && <Review m={m} onGo={go} />}

      {tab === 'record' &&
        (m.expenseStatus === 'none' || m.expenseStatus === 'draft' ? (
          <div className="flex flex-col items-center gap-[12px] rounded-[12px] bg-white px-[24px] py-[48px] text-center">
            <p className="text-[14px] font-light text-gray-20">ยื่นเอกสารเตรียมเคลียร์เงินก่อน แล้วจึงบันทึกหลักฐานค่าใช้จ่าย</p>
            <button type="button" onClick={() => go('claim')} className="rounded-[8px] bg-blue-00 px-[16px] py-[10px] text-[14px] font-medium text-white-soft hover:brightness-110">
              ไปที่ตั้งเบิกค่าใช้จ่าย
            </button>
          </div>
        ) : (
          <>
            {editList(record, setRecord, 'record')}
            <div className="flex items-center justify-end gap-[12px] py-[12px]">
              <span className="text-[13px] font-light text-gray-20">
                ใช้จริง <b className="font-urbanist text-[16px] font-bold text-ink">{money(total(record))}</b> บาท
              </span>
              <button type="button" onClick={saveRecord} className="flex items-center gap-[4px] rounded-[8px] bg-blue-00 px-[12px] py-[10px] transition hover:brightness-110">
                <img src={iconCheck} alt="" width={16} height={16} className="my-px" />
                <span className="p-[2px] text-[14px] font-medium text-white-soft">บันทึก</span>
              </button>
            </div>
          </>
        ))}

      <Modal open={confirm !== null} title={confirm === 'delete' ? 'ลบคำขอเบิก' : 'ล้างข้อมูล'} onClose={() => setConfirm(null)}>
        <p className="text-[14px] font-light text-gray-30">{confirm === 'delete' ? 'ลบรายการเบิกและหลักฐานทั้งหมดของการประชุมนี้ใช่ไหม?' : 'ล้างรายการเบิกทั้งหมดในฟอร์มนี้ใช่ไหม?'}</p>
        <div className="flex justify-end gap-[12px]">
          <button type="button" onClick={() => setConfirm(null)} className="h-[45px] w-[128px] rounded-[8px] border border-gray-line text-[14px] font-medium text-gray-30 outline-none hover:bg-gray-subtle focus-visible:ring-2 focus-visible:ring-blue-20">
            ยกเลิก
          </button>
          <button
            type="button"
            onClick={() => {
              if (confirm === 'delete') {
                updateMeeting(m.id, (x) => ({ ...x, expenses: [], evidence: [], expenseStatus: 'none', expenseSubmittedAt: undefined }))
                setClaim([blankItem(m)])
                setRecord([blankItem(m)])
                go('claim')
              } else setClaim([blankItem(m)])
              setErrors({})
              setConfirm(null)
            }}
            className="h-[45px] w-[128px] rounded-[8px] bg-red-00 text-[14px] font-medium text-white-soft hover:brightness-110"
          >
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
