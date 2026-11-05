import { useEffect, useMemo, useState } from 'react'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import iconSearch from '../assets/dashboard/icon-search.svg'
import iconSort from '../assets/dashboard/icon-sort.svg'
import iconCaretDown from '../assets/survey/icon-caret-down.svg'
import iconCopy from '../assets/survey/icon-copy.svg'
import iconDownloadDisabled from '../assets/survey/icon-download-disabled.svg'
import iconDownload from '../assets/survey/icon-download.svg'
import iconEye from '../assets/survey/icon-eye.svg'
import iconPen from '../assets/survey/icon-pen.svg'
import iconPlus from '../assets/survey/icon-plus.svg'
import iconSurvey from '../assets/survey/icon-survey.svg'
import iconTrash from '../assets/survey/icon-trash.svg'
import Checkbox from '../components/ui/Checkbox'
import PageTitle from '../components/ui/PageTitle'
import Pagination from '../components/ui/Pagination'
import { surveyStatusLabel, type Survey, type SurveyStatus } from '../data/surveys'
import { deleteSurvey, nextSurveyId, setSurveys, useSurveys } from '../lib/surveyStore'

const PAGE_SIZE = 6

type SortKey = 'name' | 'type' | 'createdDate' | 'startDate' | 'endDate' | 'responses' | 'status'
const columns: { key: SortKey; label: string }[] = [
  { key: 'name', label: 'ชื่อแบบสอบถาม' },
  { key: 'type', label: 'ประเภทแบบสอบถาม' },
  { key: 'createdDate', label: 'วันที่สร้าง' },
  { key: 'startDate', label: 'วันเริ่มต้น' },
  { key: 'endDate', label: 'วันสิ้นสุด' },
  { key: 'responses', label: 'ตอบแล้ว' },
  { key: 'status', label: 'สถานะ' },
]

// Figma Badge/Tooltip variants used on this page
const statusBadge: Record<SurveyStatus, string> = {
  published: 'bg-[#44b4ff] font-medium text-white',
  draft: 'bg-blue-20 font-light text-blue-00',
  closed: 'bg-gray-10 font-light text-gray-bg',
}

const grid = 'grid grid-cols-[32px_minmax(0,1fr)_minmax(0,1fr)_repeat(3,124px)_75px_233px] items-center px-[10px]'

function ActionButton({ icon, label, onClick, disabled }: { icon: string; label: string; onClick?: () => void; disabled?: boolean }) {
  return (
    <button
      type="button"
      aria-label={label}
      title={label}
      disabled={disabled}
      onClick={onClick}
      className="flex size-[24px] items-center justify-center rounded-[6px] transition-colors enabled:hover:bg-blue-bg disabled:cursor-not-allowed focus-visible:outline-2 focus-visible:outline-blue-00"
    >
      <img src={icon} alt="" width={16} height={16} />
    </button>
  )
}

function Actions({ s, onCopy, onDelete }: { s: Survey; onCopy: () => void; onDelete: () => void }) {
  const navigate = useNavigate()
  const canDownload = s.status === 'closed'
  return (
    <div className="flex items-center justify-end gap-[4px]">
      <ActionButton icon={iconEye} label={`ดู ${s.name}`} onClick={() => navigate(`/survey/${s.id}/preview`)} />
      <ActionButton icon={iconPen} label={`แก้ไข ${s.name}`} onClick={() => navigate(`/survey/${s.id}/edit`)} />
      <ActionButton icon={iconCopy} label={`ทำสำเนา ${s.name}`} onClick={onCopy} />
      <ActionButton icon={iconTrash} label={`ลบ ${s.name}`} onClick={onDelete} />
      <ActionButton
        icon={canDownload ? iconDownload : iconDownloadDisabled}
        label={canDownload ? `ดาวน์โหลดผล ${s.name}` : 'ดาวน์โหลดได้เมื่อปิดรับคำตอบ'}
        disabled={!canDownload}
      />
    </div>
  )
}

function Badge({ status }: { status: SurveyStatus }) {
  return (
    <span className={`inline-flex min-w-[58px] justify-center rounded-[6px] px-[8px] py-[4px] text-[12px] leading-[normal] whitespace-nowrap ${statusBadge[status]}`}>
      {surveyStatusLabel[status]}
    </span>
  )
}

export default function SurveyPage() {
  const rows = useSurveys()
  const [query, setQuery] = useState('')
  const [statusFilter, setStatusFilter] = useState<SurveyStatus | 'all'>('all')
  const [sort, setSort] = useState<{ key: SortKey; dir: 1 | -1 } | null>(null)
  const [page, setPage] = useState(1)
  const [selected, setSelected] = useState<Set<number>>(new Set())
  const [pendingDelete, setPendingDelete] = useState<Survey | null>(null)
  // e.g. "ส่งคำตอบแล้ว" when coming back from the answer page
  const location = useLocation()
  const navigate = useNavigate()
  const [toast, setToast] = useState<string | undefined>((location.state as { toast?: string } | null)?.toast)
  useEffect(() => {
    if (!toast) return
    // drop the state so a refresh doesn't show the toast again
    navigate(location.pathname, { replace: true, state: null })
    const t = setTimeout(() => setToast(undefined), 2600)
    return () => clearTimeout(t)
  }, [toast])

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase()
    let out = rows.filter((r) => (statusFilter === 'all' || r.status === statusFilter) && (!q || `${r.name} ${r.type}`.toLowerCase().includes(q)))
    if (sort) {
      out = [...out].sort((a, b) => {
        const av = sort.key === 'status' ? surveyStatusLabel[a.status] : a[sort.key]
        const bv = sort.key === 'status' ? surveyStatusLabel[b.status] : b[sort.key]
        return (typeof av === 'number' ? av - (bv as number) : String(av).localeCompare(String(bv), 'th')) * sort.dir
      })
    }
    return out
  }, [rows, query, statusFilter, sort])

  const pageCount = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE))
  const current = Math.min(page, pageCount)
  const visible = filtered.slice((current - 1) * PAGE_SIZE, current * PAGE_SIZE)
  const visibleSelected = visible.filter((r) => selected.has(r.id)).length

  const toggleSort = (key: SortKey) => setSort((s) => (s?.key === key ? (s.dir === 1 ? { key, dir: -1 } : null) : { key, dir: 1 }))
  const toggle = (id: number, on: boolean) =>
    setSelected((prev) => {
      const next = new Set(prev)
      if (on) next.add(id)
      else next.delete(id)
      return next
    })
  const toggleAllVisible = (on: boolean) =>
    setSelected((prev) => {
      const next = new Set(prev)
      visible.forEach((r) => (on ? next.add(r.id) : next.delete(r.id)))
      return next
    })
  const copy = (s: Survey) => {
    const id = nextSurveyId()
    const today = new Date().toISOString().slice(0, 10)
    setSurveys((prev) => [{ ...s, id, name: `${s.name} (สำเนา)`, status: 'draft', responses: 0, createdDate: today }, ...prev])
    setPage(1)
  }
  const confirmDelete = () => {
    if (!pendingDelete) return
    deleteSurvey(pendingDelete.id)
    toggle(pendingDelete.id, false)
    setPendingDelete(null)
  }

  return (
    <div className="flex flex-col gap-[12px] px-[24px] pb-[55px] max-sm:px-[12px] max-sm:pb-[25px]">
      <div className="flex flex-col gap-[24px] pb-[12px]">
        <PageTitle icon={iconSurvey}>จัดการแบบสำรวจ</PageTitle>

        <div className="flex flex-wrap items-center gap-[12px]">
          <label className="relative flex shrink-0 items-center gap-[4px] rounded-[8px] border border-gray-line bg-white py-[8px] pr-[8px] pl-[12px] transition-colors focus-within:border-blue-00 hover:border-blue-10">
            <span className="py-[2px] text-[12px] leading-[normal] font-medium whitespace-nowrap text-blue-00">
              {statusFilter === 'all' ? 'ค้นหาทั้งหมด' : surveyStatusLabel[statusFilter]}
            </span>
            <img src={iconCaretDown} alt="" width={14} height={14} className="m-px" />
            <select
              aria-label="กรองตามสถานะ"
              value={statusFilter}
              onChange={(e) => {
                setStatusFilter(e.target.value as SurveyStatus | 'all')
                setPage(1)
              }}
              className="absolute inset-0 cursor-pointer opacity-0"
            >
              <option value="all">ค้นหาทั้งหมด</option>
              {(Object.keys(surveyStatusLabel) as SurveyStatus[]).map((s) => (
                <option key={s} value={s}>
                  {surveyStatusLabel[s]}
                </option>
              ))}
            </select>
          </label>

          <label className="flex w-[237px] min-w-0 items-center gap-[6px] rounded-[8px] border border-gray-line bg-gray-subtle px-[16px] py-[10px] transition-colors focus-within:border-blue-00 focus-within:bg-white max-sm:flex-1">
            <span className="sr-only">ค้นหาแบบสอบถาม</span>
            <input
              type="search"
              value={query}
              onChange={(e) => {
                setQuery(e.target.value)
                setPage(1)
              }}
              placeholder="ค้นหาแบบสอบถาม"
              className="min-w-0 flex-1 bg-transparent text-[12px] leading-[normal] font-light text-gray-30 outline-none placeholder:text-gray-20 [&::-webkit-search-cancel-button]:hidden"
            />
            <img src={iconSearch} alt="" width={18} height={18} />
          </label>

          <Link
            to="/survey/create"
            className="ml-auto flex shrink-0 items-center gap-[4px] rounded-[8px] bg-blue-00 px-[10px] py-[8px] transition hover:brightness-110 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-00 active:brightness-95 max-sm:ml-0 max-sm:w-full max-sm:justify-center"
          >
            <img src={iconPlus} alt="" width={14} height={14} className="my-px" />
            <span className="py-[2px] text-[12px] leading-[normal] font-medium whitespace-nowrap text-white-soft">สร้างแบบสอบถาม</span>
          </Link>
        </div>
      </div>

      <section aria-label="รายการแบบสอบถาม" className="rounded-[12px] border border-gray-line-2 bg-white py-[24px] max-md:py-[8px]">
        {/* Desktop/tablet table */}
        <div className="overflow-x-auto px-[24px] max-md:hidden">
          <div role="table" aria-label="รายการแบบสอบถาม" className="min-w-[1100px]">
            <div role="row" className={`${grid} py-[12px]`}>
              <Checkbox
                label="เลือกทั้งหมดในหน้านี้"
                checked={visible.length > 0 && visibleSelected === visible.length}
                indeterminate={visibleSelected > 0 && visibleSelected < visible.length}
                onChange={toggleAllVisible}
              />
              {columns.map((c) => (
                <button
                  key={c.key}
                  type="button"
                  role="columnheader"
                  aria-sort={sort?.key === c.key ? (sort.dir === 1 ? 'ascending' : 'descending') : 'none'}
                  onClick={() => toggleSort(c.key)}
                  className={`flex w-fit items-end text-[10px] leading-[normal] font-light whitespace-nowrap transition-colors hover:text-gray-30 ${sort?.key === c.key ? 'text-blue-00' : 'text-gray-20'}`}
                >
                  {c.label}
                  <img src={iconSort} alt="" width={12} height={12} />
                </button>
              ))}
            </div>
            {visible.map((s) => (
              <div key={s.id} role="row" className={`${grid} border-t border-gray-line py-[16px] text-[12px] leading-[normal] font-light text-black`}>
                <Checkbox label={`เลือก ${s.name}`} checked={selected.has(s.id)} onChange={(on) => toggle(s.id, on)} />
                <span role="cell" className="truncate pr-[16px]" title={s.name}>
                  {s.name}
                </span>
                <span role="cell" className="truncate pr-[16px]">
                  {s.type}
                </span>
                <span role="cell" className="flex flex-col gap-[6px]">
                  {s.createdDate}
                  <span className="text-[11px] text-gray-20">{s.createdTime}</span>
                </span>
                <span role="cell">{s.startDate}</span>
                <span role="cell">{s.endDate}</span>
                <span role="cell">{s.responses}</span>
                <span role="cell" className="flex items-center gap-[24px]">
                  <Badge status={s.status} />
                  <span className="flex-1">
                    <Actions s={s} onCopy={() => copy(s)} onDelete={() => setPendingDelete(s)} />
                  </span>
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* Phone cards */}
        <ul className="md:hidden">
          {visible.map((s, i) => (
            <li key={s.id} className={`flex flex-col gap-[12px] px-[16px] py-[16px] ${i > 0 ? 'border-t border-gray-line' : ''}`}>
              <div className="flex items-start gap-[12px]">
                <span className="pt-[3px]">
                  <Checkbox label={`เลือก ${s.name}`} checked={selected.has(s.id)} onChange={(on) => toggle(s.id, on)} />
                </span>
                <div className="flex min-w-0 flex-1 flex-col gap-[4px]">
                  <p className="text-[13px] leading-[1.4] font-medium text-black">{s.name}</p>
                  <p className="text-[11px] text-gray-20">{s.type}</p>
                </div>
                <Badge status={s.status} />
              </div>
              <dl className="grid grid-cols-3 gap-[8px] pl-[24px] text-[11px] leading-[normal]">
                {[
                  ['วันเริ่มต้น', s.startDate],
                  ['วันสิ้นสุด', s.endDate],
                  ['ตอบแล้ว', String(s.responses)],
                ].map(([k, v]) => (
                  <div key={k} className="flex flex-col gap-[4px]">
                    <dt className="text-gray-20">{k}</dt>
                    <dd className="font-light text-black">{v}</dd>
                  </div>
                ))}
              </dl>
              <div className="pl-[24px]">
                <Actions s={s} onCopy={() => copy(s)} onDelete={() => setPendingDelete(s)} />
              </div>
            </li>
          ))}
        </ul>

        {visible.length === 0 && (
          <div className="flex flex-col items-center gap-[8px] px-[24px] py-[48px] text-center">
            <img src={iconSurvey} alt="" width={32} height={32} className="opacity-40" />
            <p className="text-[14px] font-medium text-gray-30">ไม่พบแบบสอบถาม</p>
            <p className="text-[12px] font-light text-gray-20">ลองเปลี่ยนคำค้นหาหรือสถานะที่เลือก</p>
          </div>
        )}
      </section>

      <div className="flex flex-wrap items-center justify-between gap-[12px]">
        <Pagination page={current} pageCount={pageCount} onChange={setPage} />
        <p className="text-[11px] font-light text-gray-20">
          {filtered.length === 0
            ? 'ไม่มีรายการ'
            : `แสดง ${(current - 1) * PAGE_SIZE + 1}–${Math.min(current * PAGE_SIZE, filtered.length)} จาก ${filtered.length} รายการ`}
          {selected.size > 0 && ` · เลือกแล้ว ${selected.size}`}
        </p>
      </div>

      {pendingDelete && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-[16px]" onClick={() => setPendingDelete(null)}>
          <div
            role="alertdialog"
            aria-modal="true"
            aria-labelledby="delete-title"
            onClick={(e) => e.stopPropagation()}
            onKeyDown={(e) => e.key === 'Escape' && setPendingDelete(null)}
            className="flex w-full max-w-[400px] animate-[menu-in_120ms_ease-out] flex-col gap-[16px] rounded-[12px] bg-white p-[24px] shadow-2xl"
          >
            <h2 id="delete-title" className="text-[16px] font-medium text-black">
              ลบแบบสอบถาม?
            </h2>
            <p className="text-[14px] leading-[1.5] font-light text-gray-30">
              “{pendingDelete.name}” จะถูกลบออกจากรายการ
            </p>
            <div className="flex justify-end gap-[8px]">
              <button
                type="button"
                autoFocus
                onClick={() => setPendingDelete(null)}
                className="rounded-[8px] bg-gray-bg px-[14px] py-[8px] text-[12px] font-medium text-gray-30 transition-colors hover:bg-gray-line"
              >
                ยกเลิก
              </button>
              <button
                type="button"
                onClick={confirmDelete}
                className="rounded-[8px] bg-red-00 px-[14px] py-[8px] text-[12px] font-medium text-white-soft transition hover:brightness-110"
              >
                ลบ
              </button>
            </div>
          </div>
        </div>
      )}

      <div aria-live="polite" className="pointer-events-none fixed bottom-[24px] left-1/2 z-50 -translate-x-1/2">
        {toast && <div className="animate-[menu-in_120ms_ease-out] rounded-[10px] bg-gray-30 px-[16px] py-[10px] text-[13px] text-white shadow-lg">{toast}</div>}
      </div>
    </div>
  )
}
