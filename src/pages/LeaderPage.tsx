import { useEffect, useMemo, useState, type ReactNode } from 'react'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import iconSearch from '../assets/dashboard/icon-search.svg'
import iconSort from '../assets/dashboard/icon-sort.svg'
import icAddUser from '../assets/leader/ic-adduser.png'
import icBook from '../assets/leader/ic-book.png'
import icCert from '../assets/leader/ic-cert.png'
import icHistory from '../assets/leader/ic-history.png'
import icPlan from '../assets/leader/ic-plan.png'
import icRecord from '../assets/leader/ic-record.png'
import watermark from '../assets/leader/watermark.png'
import iconCaretDown from '../assets/survey/icon-caret-down.svg'
import iconEye from '../assets/survey/icon-eye.svg'
import iconPen from '../assets/survey/icon-pen.svg'
import { useToast } from '../components/leader/Parts'
import ThaiMap from '../components/leader/ThaiMap'
import Pagination from '../components/ui/Pagination'
import Select from '../components/ui/Select'
import {
  baselineTotals,
  countPassers,
  courseStatusLabel,
  fmt,
  provinceStats,
  regions,
  seedCourseCount,
  seedCourses,
  sumStats,
  type Course,
  type CourseStatus,
} from '../data/leader'
import { mapProvinces } from '../data/thaiMap'
import { useCourses } from '../lib/leaderStore'

const PAGE_SIZE = 5
const seedPassers = countPassers(seedCourses())

function RocketIcon() {
  return (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#0085f9" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M14.5 4.5c2.9-1.9 5-1.8 5-1.8s.1 2.1-1.8 5l-5.4 5.4-3.2-3.2 5.4-5.4Z" />
      <path d="m9.2 8.7-3.6.7-2.1 3.3 3.8.4M15.3 14.8l-.7 3.6-3.3 2.1-.4-3.8" />
      <path d="M7.3 16.7c-1.6.1-2.8 1.3-3 3.3 2-.2 3.2-1.4 3.3-3" />
      <circle cx="15.2" cy="8.8" r="1.2" />
    </svg>
  )
}

function StatCard({ tone, icon, label, value, unit }: { tone: string; icon: string; label: string; value: number; unit: string }) {
  return (
    <div className={`relative flex h-[83px] flex-1 items-center overflow-hidden rounded-[12px] px-[12px] ${tone}`}>
      <img src={watermark} alt="" className="pointer-events-none absolute top-0 right-0 h-full opacity-40 brightness-0 invert" />
      <img src={icon} alt="" width={48} height={48} className="relative size-[48px] shrink-0 object-contain" />
      <p className="relative ml-[8px] text-[12px] leading-[normal] font-medium text-white">{label}</p>
      <div className="relative ml-auto flex flex-col items-end gap-[8px]">
        <p className="font-urbanist text-[20px] leading-[1.2] font-bold text-white">{fmt(value)}</p>
        <p className="text-[10px] leading-[normal] font-medium text-white">{unit}</p>
      </div>
    </div>
  )
}

function MenuCard({ to, icon, title, sub }: { to: string; icon: string; title: string; sub: string }) {
  return (
    <Link
      to={to}
      className="flex min-w-0 items-center justify-center gap-[24px] rounded-[12px] border border-gray-line bg-white p-[24px] transition hover:border-blue-10 hover:shadow-[0_2px_10px_rgba(0,133,249,0.12)] focus-visible:outline-2 focus-visible:outline-blue-00 max-sm:gap-[16px] max-sm:p-[16px]"
    >
      <img src={icon} alt="" width={64} height={64} className="size-[64px] shrink-0 object-contain max-sm:size-[48px]" />
      <span className="flex min-w-0 flex-1 flex-col gap-[4px] leading-[normal]">
        <span className="text-[14px] font-semibold text-gray-30">{title}</span>
        <span className="text-[10px] font-light text-gray-20">{sub}</span>
      </span>
    </Link>
  )
}

function Row({ k, v, strong }: { k: string; v: number; strong?: boolean }) {
  return (
    <div className={`flex items-center gap-[10px] px-[4px] ${strong ? 'bg-gray-bg p-[4px]' : ''}`}>
      <span className="text-[12px] leading-[normal] font-light text-black/90">{k}</span>
      <span className="ml-auto flex items-center gap-[12px] text-right">
        <span className="font-urbanist text-[16px] font-medium text-blue-00">{fmt(v)}</span>
        <span className="text-[14px] font-light text-black/90">คน</span>
      </span>
    </div>
  )
}

const badge: Record<CourseStatus, string> = {
  draft: 'bg-blue-20 font-light text-blue-00',
  open: 'bg-yellow font-light text-gray-bg',
  complete: 'bg-green font-light text-gray-bg',
}
function Badge({ s }: { s: CourseStatus }) {
  return <span className={`inline-flex w-full justify-center rounded-[6px] px-[8px] py-[4px] text-[12px] leading-[normal] ${badge[s]}`}>{courseStatusLabel[s]}</span>
}

type SortKey = 'name' | 'org' | 'place' | 'startDate' | 'status'
const columns: { key: SortKey; label: string }[] = [
  { key: 'name', label: 'ชื่อหลักสูตร' },
  { key: 'org', label: 'ส่วนงานที่จัด' },
  { key: 'place', label: 'สถานที่' },
  { key: 'startDate', label: 'วันที่อบรม' },
  { key: 'status', label: 'สถานะ' },
]
const grid = 'grid grid-cols-[minmax(0,1.3fr)_minmax(0,1.3fr)_minmax(0,1fr)_minmax(0,0.7fr)_233px] items-center gap-[20px] px-[10px]'

function RowActions({ c }: { c: Course }) {
  const navigate = useNavigate()
  const cls = 'flex size-[24px] items-center justify-center rounded-[6px] transition-colors hover:bg-blue-bg focus-visible:outline-2 focus-visible:outline-blue-00'
  return (
    <div className="flex items-center justify-end gap-[8px]">
      <button type="button" className={cls} aria-label={`แก้ไข ${c.name}`} title="แก้ไขแผน" onClick={() => navigate(`/leader/plan/${c.id}/edit`)}>
        <img src={iconPen} alt="" width={16} height={16} />
      </button>
      <button type="button" className={cls} aria-label={`ดู ${c.name}`} title="ดูบันทึกการอบรม" onClick={() => navigate(`/leader/record/${c.id}`)}>
        <img src={iconEye} alt="" width={16} height={16} />
      </button>
    </div>
  )
}

function Panel({ children }: { children: ReactNode }) {
  return <section className="flex flex-col gap-[12px] rounded-[12px] bg-blue-bg p-[12px]">{children}</section>
}

export default function LeaderPage() {
  const courses = useCourses()
  const location = useLocation()
  const navigate = useNavigate()
  const [toast, showToast] = useToast()
  // e.g. "บันทึกการอบรมแล้ว" when coming back from the record page
  useEffect(() => {
    const t = (location.state as { toast?: string } | null)?.toast
    if (!t) return
    showToast(t)
    navigate(location.pathname, { replace: true, state: null })
  }, [location.state])
  const [region, setRegion] = useState('')
  const [province, setProvince] = useState('')
  const [query, setQuery] = useState('')
  const [statusFilter, setStatusFilter] = useState<CourseStatus | 'all'>('all')
  const [sort, setSort] = useState<{ key: SortKey; dir: 1 | -1 } | null>(null)
  const [page, setPage] = useState(1)

  const stats = useMemo(() => provinceStats(courses), [courses])
  const shown = useMemo(() => {
    const names = province ? [province] : region ? mapProvinces.filter((p) => p.region === region).map((p) => p.name) : mapProvinces.map((p) => p.name)
    return sumStats(names.map((n) => stats.get(n)!))
  }, [stats, region, province])

  const provinceOptions = useMemo(
    () => [{ value: 'all', label: 'ทุกจังหวัด' }, ...mapProvinces.filter((p) => !region || p.region === region).map((p) => ({ value: p.name, label: p.name }))],
    [region],
  )

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase()
    let out = courses.filter((c) => (statusFilter === 'all' || c.status === statusFilter) && (!q || `${c.name} ${c.org} ${c.place}`.toLowerCase().includes(q)))
    if (sort) {
      out = [...out].sort((a, b) => {
        const av = sort.key === 'status' ? courseStatusLabel[a.status] : a[sort.key]
        const bv = sort.key === 'status' ? courseStatusLabel[b.status] : b[sort.key]
        return String(av).localeCompare(String(bv), 'th') * sort.dir
      })
    }
    return out
  }, [courses, query, statusFilter, sort])
  const pageCount = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE))
  const current = Math.min(page, pageCount)
  const visible = filtered.slice((current - 1) * PAGE_SIZE, current * PAGE_SIZE)
  const toggleSort = (key: SortKey) => setSort((s) => (s?.key === key ? (s.dir === 1 ? { key, dir: -1 } : null) : { key, dir: 1 }))

  const courseCount = baselineTotals.courses - seedCourseCount + courses.length
  const passers = baselineTotals.passedLeaders - seedPassers + countPassers(courses)

  return (
    <div className="flex flex-col gap-[24px] px-[24px] pb-[55px] max-sm:px-[12px] max-sm:pb-[25px]">
      <div className="flex flex-col gap-[12px]">
        <div className="flex items-center gap-[10px]">
          <RocketIcon />
          <h1 className="truncate text-[20px] leading-[1.2] font-semibold text-blue-00">แผนพัฒนาผู้นำชุมชน</h1>
        </div>
        <p className="text-[12px] leading-[normal] font-light text-gray-20">จัดการข้อมูลที่เกี่ยวข้องกับหลักสูตรการฝึกอบรม</p>

        <Panel>
          <div className="flex gap-[12px] max-md:flex-col">
            <StatCard tone="bg-[#0885ff]" icon={icBook} label="หลักสูตรการฝึกอบรม" value={courseCount} unit="หลักสูตร" />
            <StatCard tone="bg-[#ffa32b]" icon={icAddUser} label="ผู้นำที่ผ่านการฝึกอบรม" value={passers} unit="คน" />
          </div>
          <div className="grid grid-cols-4 gap-[12px] max-lg:grid-cols-2 max-sm:grid-cols-1">
            <MenuCard to="/leader/history" icon={icHistory} title="ประวัติการฝึกอบรม" sub="Training History" />
            <MenuCard to="/leader/plan/create" icon={icPlan} title="จัดทำแผนการอบรม" sub="Training Plan" />
            <MenuCard to="/leader/record" icon={icRecord} title="บันทึกการอบรม" sub="Training Record" />
            <MenuCard to="/leader/certificate" icon={icCert} title="การออกใบรับรอง" sub="Certificate Issuance" />
          </div>
        </Panel>
      </div>

      <Panel>
        <div className="flex flex-col gap-[24px] rounded-[12px] bg-white p-[24px] max-sm:p-[12px]">
          <h2 className="text-[16px] leading-[1.5] font-semibold text-blue-title">ข้อมูลการฝึกอบรมผู้นำชุมชน</h2>
          <div className="grid grid-cols-[333px_minmax(0,1fr)] gap-[24px] max-lg:grid-cols-1">
            <div className="flex flex-col gap-[10px] rounded-[12px] bg-blue-gray p-[12px]">
              <Select
                label="เลือกภาค"
                value={region || 'all'}
                options={[{ value: 'all', label: 'ทุกภาค' }, ...regions.map((r) => ({ value: r, label: r }))]}
                onChange={(v) => {
                  setRegion(v === 'all' ? '' : v)
                  setProvince('')
                }}
              />
              <Select
                label="เลือกจังหวัด"
                value={province || 'all'}
                options={provinceOptions}
                onChange={(v) => {
                  if (v === 'all') return setProvince('')
                  setProvince(v)
                  setRegion(mapProvinces.find((p) => p.name === v)?.region ?? '')
                }}
              />
              <div className="flex flex-col gap-[12px] rounded-[12px] bg-white px-[8px] py-[12px]" aria-live="polite">
                <Row k="อบรมแล้ว" v={shown.trained} />
                <Row k="ยังไม่เข้าอบรม" v={shown.notAttended} />
                <Row k="เข้าอบรมปีนี้" v={shown.thisYear} />
                <Row k="ยังไม่ผ่านการอบรม" v={shown.notPassed} />
                <Row k="ผู้นำทั้งหมด" v={shown.trained + shown.notAttended} strong />
              </div>
            </div>
            <div className="h-[381px] max-sm:h-[320px]">
              <ThaiMap
                stats={stats}
                region={region}
                province={province}
                onSelect={(p) => {
                  setProvince(p)
                  if (p) setRegion(mapProvinces.find((x) => x.name === p)?.region ?? '')
                }}
              />
            </div>
          </div>
        </div>
      </Panel>

      <section className="flex flex-col gap-[12px]">
        <div className="flex flex-wrap items-center gap-[12px]">
          <h2 className="min-w-0 flex-1 text-[20px] leading-[1.2] font-semibold text-blue-00">แผนฝึกอบรม</h2>
          <label className="relative flex shrink-0 items-center gap-[4px] rounded-[8px] border border-gray-line bg-white py-[8px] pr-[8px] pl-[12px] transition-colors focus-within:border-blue-00 hover:border-blue-10">
            <span className="py-[2px] text-[12px] leading-[normal] font-medium whitespace-nowrap text-blue-00">{statusFilter === 'all' ? 'ค้นหาทั้งหมด' : courseStatusLabel[statusFilter]}</span>
            <img src={iconCaretDown} alt="" width={14} height={14} className="m-px" />
            <select
              aria-label="กรองตามสถานะ"
              value={statusFilter}
              onChange={(e) => {
                setStatusFilter(e.target.value as CourseStatus | 'all')
                setPage(1)
              }}
              className="absolute inset-0 cursor-pointer opacity-0"
            >
              <option value="all">ค้นหาทั้งหมด</option>
              {(Object.keys(courseStatusLabel) as CourseStatus[]).map((s) => (
                <option key={s} value={s}>
                  {courseStatusLabel[s]}
                </option>
              ))}
            </select>
          </label>
          <label className="flex w-[237px] min-w-0 items-center gap-[6px] rounded-[8px] border border-gray-line bg-gray-subtle px-[16px] py-[10px] transition-colors focus-within:border-blue-00 focus-within:bg-white max-sm:w-full max-sm:flex-none">
            <span className="sr-only">ค้นหาแผนฝึกอบรม</span>
            <input
              type="search"
              value={query}
              onChange={(e) => {
                setQuery(e.target.value)
                setPage(1)
              }}
              placeholder="ค้นหา"
              className="min-w-0 flex-1 bg-transparent text-[12px] leading-[normal] font-light text-gray-30 outline-none placeholder:text-gray-20 [&::-webkit-search-cancel-button]:hidden"
            />
            <img src={iconSearch} alt="" width={18} height={18} />
          </label>
        </div>

        <div className="rounded-[12px] border border-gray-line-2 bg-white py-[24px] max-md:py-[8px]">
          <div className="overflow-x-auto px-[24px] max-md:hidden">
            <div role="table" aria-label="แผนฝึกอบรม" className="min-w-[960px]">
              <div role="row" className={`${grid} py-[12px]`}>
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
              {visible.map((c) => (
                <div key={c.id} role="row" className={`${grid} border-t border-gray-line py-[16px] text-[12px] leading-[normal] font-light text-black`}>
                  <span role="cell" className="truncate" title={c.name}>
                    {c.name}
                  </span>
                  <span role="cell" className="truncate" title={c.org}>
                    {c.org}
                  </span>
                  <span role="cell" className="truncate" title={c.place}>
                    {c.place || '–'}
                  </span>
                  <span role="cell">{c.startDate || '–'}</span>
                  <span role="cell" className="flex items-center gap-[24px]">
                    <span className="min-w-0 flex-1">
                      <Badge s={c.status} />
                    </span>
                    <RowActions c={c} />
                  </span>
                </div>
              ))}
            </div>
          </div>

          <ul className="md:hidden">
            {visible.map((c, i) => (
              <li key={c.id} className={`flex flex-col gap-[8px] px-[16px] py-[16px] ${i > 0 ? 'border-t border-gray-line' : ''}`}>
                <div className="flex items-start gap-[12px]">
                  <p className="min-w-0 flex-1 text-[13px] leading-[1.4] font-medium text-black">{c.name}</p>
                  <span className="w-[76px] shrink-0">
                    <Badge s={c.status} />
                  </span>
                </div>
                <p className="text-[11px] text-gray-20">
                  {c.org} · {c.place || '–'} · {c.startDate || '–'}
                </p>
                <RowActions c={c} />
              </li>
            ))}
          </ul>

          {visible.length === 0 && (
            <div className="flex flex-col items-center gap-[8px] px-[24px] py-[48px] text-center">
              <p className="text-[14px] font-medium text-gray-30">ไม่พบแผนฝึกอบรม</p>
              <p className="text-[12px] font-light text-gray-20">ลองเปลี่ยนคำค้นหาหรือสถานะที่เลือก หรือสร้างแผนใหม่จากเมนู “จัดทำแผนการอบรม”</p>
            </div>
          )}
        </div>

        <div className="flex flex-wrap items-center justify-between gap-[12px]">
          <Pagination page={current} pageCount={pageCount} onChange={setPage} />
          <p className="text-[11px] font-light text-gray-20">{filtered.length === 0 ? 'ไม่มีรายการ' : `แสดง ${(current - 1) * PAGE_SIZE + 1}–${Math.min(current * PAGE_SIZE, filtered.length)} จาก ${filtered.length} รายการ`}</p>
        </div>
      </section>
      {toast}
    </div>
  )
}
