import { useMemo, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import iconSearch from '../assets/dashboard/icon-search.svg'
import iconSort from '../assets/dashboard/icon-sort.svg'
import iconPlus from '../assets/survey/icon-plus.svg'
import iconTor from '../assets/tor/icon-clipboard-check.svg'
import { RoleSwitch, pmPage, ProjectBadge } from '../components/pm/Parts'
import PageTitle from '../components/ui/PageTitle'
import Pagination from '../components/ui/Pagination'
import Select from '../components/ui/Select'
import { budgetYears, projectStatusLabel, projectTypes, type Project, type ProjectStatus } from '../data/projects'
import { thaiLong } from '../data/leader'
import { usePmRole, useProjects } from '../lib/projectStore'

const PAGE_SIZE = 6
type SortKey = 'name' | 'type' | 'fiscalYear' | 'createdAt' | 'status'
const columns: { key: SortKey; label: string }[] = [
  { key: 'name', label: 'ชื่อโครงการ' },
  { key: 'type', label: 'ประเภทโครงการ' },
  { key: 'fiscalYear', label: 'ปีงบประมาณ' },
  { key: 'createdAt', label: 'วันที่สร้าง' },
  { key: 'status', label: 'สถานะ' },
]
const grid = 'grid grid-cols-[minmax(0,1.6fr)_minmax(0,1.2fr)_110px_120px_130px] items-center gap-[16px] px-[10px]'

export default function ProjectsPage() {
  const projects = useProjects()
  const role = usePmRole()
  const navigate = useNavigate()
  const [query, setQuery] = useState('')
  const [type, setType] = useState('all')
  const [year, setYear] = useState('all')
  const [status, setStatus] = useState<ProjectStatus | 'all'>('all')
  const [sort, setSort] = useState<{ key: SortKey; dir: 1 | -1 } | null>(null)
  const [pg, setPg] = useState(1)

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase()
    // applicants don't see other people's drafts; staff don't see unsent drafts at all
    let out = projects.filter((p) => (role === 'staff' ? p.status !== 'draft' : true) && (type === 'all' || p.type === type) && (year === 'all' || p.fiscalYear === year) && (status === 'all' || p.status === status) && (!q || `${p.name} ${p.code}`.toLowerCase().includes(q)))
    if (sort) {
      const v = (p: Project) => (sort.key === 'status' ? projectStatusLabel[p.status] : p[sort.key])
      out = [...out].sort((a, b) => String(v(a)).localeCompare(String(v(b)), 'th') * sort.dir)
    }
    return out
  }, [projects, role, query, type, year, status, sort])
  const pageCount = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE))
  const current = Math.min(pg, pageCount)
  const rows = filtered.slice((current - 1) * PAGE_SIZE, current * PAGE_SIZE)
  const toggleSort = (key: SortKey) => setSort((s) => (s?.key === key ? (s.dir === 1 ? { key, dir: -1 } : null) : { key, dir: 1 }))
  const pending = projects.filter((p) => p.status === 'submitted').length
  const reset = <T,>(set: (v: T) => void) => (v: T) => (set(v), setPg(1))

  return (
    <div className={pmPage}>
      <div className="flex flex-wrap items-center gap-[12px]">
        <div className="min-w-0 flex-1">
          <PageTitle icon={iconTor}>บริหารโครงการ</PageTitle>
        </div>
        <RoleSwitch />
      </div>

      <div className="flex flex-wrap items-center gap-[12px] pt-[12px]">
        <h2 className="min-w-0 flex-1 text-[20px] leading-[1.2] font-semibold text-blue-00">ข้อมูลโครงการ</h2>
        {role === 'community' ? (
          <Link to="/projects/propose" className="flex items-center gap-[6px] rounded-[8px] bg-blue-bg px-[14px] py-[10px] text-[12px] font-medium text-blue-00 transition-colors hover:bg-blue-20 focus-visible:outline-2 focus-visible:outline-blue-00">
            <img src={iconPlus} alt="" width={14} height={14} className="[filter:invert(36%)_sepia(98%)_saturate(2879%)_hue-rotate(200deg)]" />
            ยื่นเสนอโครงการ
          </Link>
        ) : (
          pending > 0 && <span className="rounded-[8px] bg-yellow/20 px-[12px] py-[8px] text-[12px] font-medium text-[#8a6a00]">มีโครงการรอพิจารณา {pending} โครงการ</span>
        )}
      </div>

      <div className="flex flex-wrap items-center gap-[8px]">
        <label className="flex w-[247px] min-w-0 items-center gap-[6px] rounded-[8px] border border-gray-line bg-gray-subtle px-[16px] py-[10px] transition-colors focus-within:border-blue-00 focus-within:bg-white max-sm:w-full">
          <span className="sr-only">ค้นหาโครงการ</span>
          <input type="search" value={query} onChange={(e) => reset(setQuery)(e.target.value)} placeholder="ค้นหา" className="min-w-0 flex-1 bg-transparent text-[12px] font-light text-gray-30 outline-none placeholder:text-gray-20 [&::-webkit-search-cancel-button]:hidden" />
          <img src={iconSearch} alt="" width={18} height={18} />
        </label>
        <div className="ml-auto flex flex-wrap items-center gap-[8px] max-sm:ml-0 max-sm:w-full">
          <span className="text-[12px] font-medium text-gray-30 max-sm:hidden">คัดกรองข้อมูล</span>
          <Select label="ประเภทโครงการ" tone="subtle" className="w-[210px] max-sm:w-full" value={type} options={[{ value: 'all', label: 'เลือกประเภทโครงการ' }, ...projectTypes.map((t) => ({ value: t, label: t }))]} onChange={reset(setType)} />
          <Select label="ปีงบประมาณ" tone="subtle" className="w-[170px] max-sm:flex-1" value={year} options={[{ value: 'all', label: 'เลือกปีงบประมาณ' }, ...budgetYears.map((y) => ({ value: y, label: y }))]} onChange={reset(setYear)} />
          <Select
            label="สถานะ"
            tone="subtle"
            className="w-[160px] max-sm:flex-1"
            value={status}
            options={[{ value: 'all', label: 'เลือกสถานะ' }, ...(Object.keys(projectStatusLabel) as ProjectStatus[]).map((s) => ({ value: s, label: projectStatusLabel[s] }))]}
            onChange={(v) => reset(setStatus)(v as ProjectStatus | 'all')}
          />
        </div>
      </div>

      <section aria-label="รายการโครงการ" className="rounded-[12px] border border-gray-line-2 bg-white py-[20px] max-md:py-[8px]">
        <div className="overflow-x-auto px-[20px] max-md:hidden">
          <div role="table" className="min-w-[860px]">
            <div role="row" className={`${grid} py-[12px]`}>
              {columns.map((c) => (
                <button key={c.key} type="button" role="columnheader" aria-sort={sort?.key === c.key ? (sort.dir === 1 ? 'ascending' : 'descending') : 'none'} onClick={() => toggleSort(c.key)} className={`flex w-fit items-end text-[10px] leading-[normal] font-light whitespace-nowrap hover:text-gray-30 ${sort?.key === c.key ? 'text-blue-00' : 'text-gray-20'}`}>
                  {c.label}
                  <img src={iconSort} alt="" width={12} height={12} />
                </button>
              ))}
            </div>
            {rows.map((p) => (
              <div key={p.id} role="row" onClick={() => navigate(`/projects/${p.id}`)} className={`${grid} cursor-pointer border-t border-gray-line py-[14px] text-[12px] leading-[normal] font-light text-black transition-colors hover:bg-blue-bg/50`}>
                <Link to={`/projects/${p.id}`} onClick={(e) => e.stopPropagation()} className="truncate font-normal hover:text-blue-00 hover:underline" title={p.name || '(ยังไม่ตั้งชื่อ)'}>
                  {p.name || '(ยังไม่ตั้งชื่อ)'}
                </Link>
                <span className="truncate">{p.type}</span>
                <span>{p.fiscalYear}</span>
                <span>{p.createdAt}</span>
                <span>
                  <ProjectBadge status={p.status} />
                </span>
              </div>
            ))}
          </div>
        </div>
        <ul className="md:hidden">
          {rows.map((p, i) => (
            <li key={p.id} className={i > 0 ? 'border-t border-gray-line' : ''}>
              <Link to={`/projects/${p.id}`} className="flex flex-col gap-[6px] px-[16px] py-[14px]">
                <span className="flex items-start gap-[8px]">
                  <span className="min-w-0 flex-1 text-[13px] leading-[1.4] font-medium text-black">{p.name || '(ยังไม่ตั้งชื่อ)'}</span>
                  <ProjectBadge status={p.status} />
                </span>
                <span className="text-[11px] text-gray-20">
                  {p.type} · ปี {p.fiscalYear} · {thaiLong(p.createdAt)}
                </span>
              </Link>
            </li>
          ))}
        </ul>
        {rows.length === 0 && (
          <div className="flex flex-col items-center gap-[8px] px-[24px] py-[48px] text-center">
            <p className="text-[14px] font-medium text-gray-30">ไม่พบโครงการ</p>
            <p className="text-[12px] font-light text-gray-20">{role === 'community' ? 'ลองเปลี่ยนตัวกรอง หรือกด “ยื่นเสนอโครงการ” เพื่อสร้างโครงการใหม่' : 'ยังไม่มีโครงการที่ยื่นเข้ามา'}</p>
          </div>
        )}
      </section>

      <div className="flex flex-wrap items-center justify-between gap-[12px]">
        <Pagination page={current} pageCount={pageCount} onChange={setPg} />
        <p className="text-[11px] font-light text-gray-20">{filtered.length === 0 ? 'ไม่มีรายการ' : `แสดง ${(current - 1) * PAGE_SIZE + 1}–${Math.min(current * PAGE_SIZE, filtered.length)} จาก ${filtered.length} โครงการ`}</p>
      </div>
    </div>
  )
}
