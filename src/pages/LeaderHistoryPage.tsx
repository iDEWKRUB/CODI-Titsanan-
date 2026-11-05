import { useMemo, useRef, useState } from 'react'
import iconSearch from '../assets/dashboard/icon-search.svg'
import iconSort from '../assets/dashboard/icon-sort.svg'
import iconCaretDown from '../assets/survey/icon-caret-down.svg'
import iconPen from '../assets/survey/icon-pen.svg'
import { BackTitle, Field, primaryBtn, softBtn, useToast } from '../components/leader/Parts'
import Modal from '../components/ui/Modal'
import Pagination from '../components/ui/Pagination'
import Select from '../components/ui/Select'
import useDismiss from '../components/ui/useDismiss'
import { orgs, type Course } from '../data/leader'
import { mapProvinces } from '../data/thaiMap'
import { updateCourse, useCourses } from '../lib/leaderStore'
import { field } from '../components/meeting/FormParts'

const PAGE_SIZE = 8

type Person = { key: string; firstName: string; lastName: string; province: string; community: string; courses: Course[] }
type SortKey = 'firstName' | 'lastName' | 'course' | 'type' | 'org' | 'place'
const columns: { key: SortKey; label: string }[] = [
  { key: 'firstName', label: 'ชื่อ' },
  { key: 'lastName', label: 'นามสกุล' },
  { key: 'course', label: 'หลักสูตร/ที่ฝึกอบรม' },
  { key: 'type', label: 'ประเภทหลักสูตร' },
  { key: 'org', label: 'หน่วยงานที่จัด' },
  { key: 'place', label: 'สถานที่จัด' },
]
const grid = 'grid grid-cols-[110px_130px_minmax(0,1.4fr)_minmax(0,1fr)_minmax(0,1.2fr)_minmax(0,1fr)_40px] items-center gap-[16px] px-[12px]'
const keyOf = (a: { firstName: string; lastName: string; province: string }) => `${a.firstName}|${a.lastName}|${a.province}`

/** First course + "+n" that opens the rest */
function CourseCell({ courses }: { courses: Course[] }) {
  const [open, setOpen] = useState(false)
  const root = useRef<HTMLDivElement>(null)
  useDismiss(open, root, () => setOpen(false))
  const rest = courses.length - 1
  return (
    <div ref={root} className="relative flex min-w-0 items-center gap-[6px]">
      <span className="truncate" title={courses[0].name}>
        {courses[0].name}
      </span>
      {rest > 0 && (
        <button type="button" aria-expanded={open} aria-label={`ดูหลักสูตรอื่นอีก ${rest} หลักสูตร`} onClick={() => setOpen((v) => !v)} className="flex shrink-0 items-center gap-[2px] rounded-[6px] px-[4px] text-[11px] font-medium text-blue-00 hover:bg-blue-bg">
          + {rest}
          <img src={iconCaretDown} alt="" width={12} height={12} className={open ? 'rotate-180' : ''} />
        </button>
      )}
      {open && (
        <ul className="absolute top-[calc(100%+6px)] left-0 z-30 flex w-[320px] max-w-[80vw] animate-[menu-in_120ms_ease-out] flex-col gap-[2px] rounded-[12px] bg-white p-[8px] drop-shadow-[0px_4px_10px_rgba(0,0,0,0.15)]">
          {courses.slice(1).map((c) => (
            <li key={c.id} className="rounded-[6px] px-[8px] py-[6px] text-[12px] leading-[1.4] whitespace-normal hover:bg-blue-bg">
              {c.name}
              <span className="block text-[11px] text-gray-20">{c.startDate}</span>
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}

export default function LeaderHistoryPage() {
  const courses = useCourses()
  const [query, setQuery] = useState('')
  const [year, setYear] = useState('all')
  const [org, setOrg] = useState('all')
  const [sort, setSort] = useState<{ key: SortKey; dir: 1 | -1 } | null>(null)
  const [page, setPage] = useState(1)
  const [editing, setEditing] = useState<Person | null>(null)
  const [draft, setDraft] = useState({ firstName: '', lastName: '', province: '', community: '' })
  const [toast, showToast] = useToast()

  const years = useMemo(() => [...new Set(courses.map((c) => c.startDate.slice(0, 4)).filter(Boolean))].sort().reverse(), [courses])

  // one row per person, with every course they attended (after the year / organizer filters)
  const people = useMemo(() => {
    const m = new Map<string, Person>()
    for (const c of courses) {
      if (c.status === 'draft') continue
      if (year !== 'all' && !c.startDate.startsWith(year)) continue
      if (org !== 'all' && c.org !== org) continue
      for (const a of c.attendees) {
        const k = keyOf(a)
        const p = m.get(k) ?? { key: k, firstName: a.firstName, lastName: a.lastName, province: a.province, community: a.community, courses: [] }
        p.courses.push(c)
        m.set(k, p)
      }
    }
    return [...m.values()]
  }, [courses, year, org])

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase()
    let out = people.filter((p) => !q || `${p.firstName} ${p.lastName}`.toLowerCase().includes(q))
    if (sort) {
      const val = (p: Person) => ({ firstName: p.firstName, lastName: p.lastName, course: p.courses[0].name, type: p.courses[0].courseType, org: p.courses[0].org, place: p.courses[0].place })[sort.key]
      out = [...out].sort((a, b) => val(a).localeCompare(val(b), 'th') * sort.dir)
    }
    return out
  }, [people, query, sort])
  const pageCount = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE))
  const current = Math.min(page, pageCount)
  const visible = filtered.slice((current - 1) * PAGE_SIZE, current * PAGE_SIZE)
  const toggleSort = (key: SortKey) => setSort((s) => (s?.key === key ? (s.dir === 1 ? { key, dir: -1 } : null) : { key, dir: 1 }))

  const open = (p: Person) => {
    setEditing(p)
    setDraft({ firstName: p.firstName, lastName: p.lastName, province: p.province, community: p.community })
  }
  const save = () => {
    if (!editing || !draft.firstName.trim() || !draft.lastName.trim()) return
    // the same person appears in every course they attended
    for (const c of courses) {
      if (c.attendees.some((a) => keyOf(a) === editing.key)) updateCourse(c.id, (x) => ({ ...x, attendees: x.attendees.map((a) => (keyOf(a) === editing.key ? { ...a, ...draft, firstName: draft.firstName.trim(), lastName: draft.lastName.trim() } : a)) }))
    }
    setEditing(null)
    showToast('บันทึกข้อมูลแล้ว')
  }

  const typeOf = (p: Person) => p.courses[0].courseType || '–'
  return (
    <div className="flex w-full flex-col gap-[12px] px-[24px] pb-[55px] max-sm:px-[12px] max-sm:pb-[25px]">
      <BackTitle title="ประวัติการฝึกอบรม" to="/leader" />

      <div className="flex flex-wrap items-center gap-[12px]">
        <label className="flex w-[283px] min-w-0 items-center gap-[6px] rounded-[8px] border border-gray-line bg-gray-subtle px-[16px] py-[10px] transition-colors focus-within:border-blue-00 focus-within:bg-white max-sm:w-full">
          <span className="sr-only">ค้นหารายชื่อ</span>
          <input
            type="search"
            value={query}
            onChange={(e) => {
              setQuery(e.target.value)
              setPage(1)
            }}
            placeholder="ค้นหารายชื่อ"
            className="min-w-0 flex-1 bg-transparent text-[12px] leading-[normal] font-light text-gray-30 outline-none placeholder:text-gray-20 [&::-webkit-search-cancel-button]:hidden"
          />
          <img src={iconSearch} alt="" width={18} height={18} />
        </label>
        <div className="ml-auto flex flex-wrap items-center gap-[8px] max-sm:ml-0 max-sm:w-full">
          <span className="text-[12px] font-medium text-gray-30 max-sm:hidden">คัดกรองข้อมูล</span>
          <Select
            label="เลือกปี"
            tone="subtle"
            className="w-[150px] max-sm:flex-1"
            value={year}
            options={[{ value: 'all', label: 'เลือกปี' }, ...years.map((y) => ({ value: y, label: String(Number(y) + 543) }))]}
            onChange={(v) => {
              setYear(v)
              setPage(1)
            }}
          />
          <Select
            label="เลือกหน่วยงานที่จัด"
            tone="subtle"
            className="w-[230px] max-sm:flex-1"
            value={org}
            options={[{ value: 'all', label: 'เลือกหน่วยงานที่จัด' }, ...orgs.map((o) => ({ value: o, label: o }))]}
            onChange={(v) => {
              setOrg(v)
              setPage(1)
            }}
          />
        </div>
      </div>

      <section className="rounded-[12px] border border-gray-line-2 bg-white py-[16px] max-md:py-[8px]" aria-label="ประวัติการฝึกอบรม">
        <div className="overflow-x-auto px-[12px] max-md:hidden">
          <div role="table" className="min-w-[1000px]">
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
              <span />
            </div>
            {visible.map((p) => (
              <div key={p.key} role="row" className={`${grid} min-h-[48px] border-t border-gray-line py-[10px] text-[12px] leading-[1.4] font-light text-black`}>
                <span className="truncate">{p.firstName}</span>
                <span className="truncate">{p.lastName}</span>
                <CourseCell courses={p.courses} />
                <span className="truncate">{typeOf(p)}</span>
                <span className="line-clamp-2">{p.courses[0].org}</span>
                <span className="line-clamp-2">{p.courses[0].place || '–'}</span>
                <button type="button" aria-label={`แก้ไขข้อมูล ${p.firstName} ${p.lastName}`} onClick={() => open(p)} className="flex size-[28px] items-center justify-center rounded-[8px] bg-blue-bg transition-colors hover:bg-blue-20">
                  <img src={iconPen} alt="" width={14} height={14} />
                </button>
              </div>
            ))}
          </div>
        </div>

        <ul className="md:hidden">
          {visible.map((p, i) => (
            <li key={p.key} className={`flex flex-col gap-[6px] px-[16px] py-[14px] ${i > 0 ? 'border-t border-gray-line' : ''}`}>
              <div className="flex items-center gap-[8px]">
                <p className="min-w-0 flex-1 text-[14px] font-medium text-black">
                  {p.firstName} {p.lastName}
                </p>
                <button type="button" aria-label={`แก้ไขข้อมูล ${p.firstName} ${p.lastName}`} onClick={() => open(p)} className="flex size-[28px] items-center justify-center rounded-[8px] bg-blue-bg">
                  <img src={iconPen} alt="" width={14} height={14} />
                </button>
              </div>
              <div className="text-[12px] font-light text-black">
                <CourseCell courses={p.courses} />
              </div>
              <p className="text-[11px] text-gray-20">
                {typeOf(p)} · {p.courses[0].place || '–'}
              </p>
            </li>
          ))}
        </ul>

        {visible.length === 0 && (
          <div className="flex flex-col items-center gap-[8px] px-[24px] py-[48px] text-center">
            <p className="text-[14px] font-medium text-gray-30">ไม่พบประวัติการฝึกอบรม</p>
            <p className="text-[12px] font-light text-gray-20">ลองเปลี่ยนคำค้นหา ปี หรือหน่วยงานที่จัด</p>
          </div>
        )}
      </section>

      <div className="flex flex-wrap items-center justify-between gap-[12px]">
        <Pagination page={current} pageCount={pageCount} onChange={setPage} />
        <p className="text-[11px] font-light text-gray-20">{filtered.length === 0 ? 'ไม่มีรายการ' : `แสดง ${(current - 1) * PAGE_SIZE + 1}–${Math.min(current * PAGE_SIZE, filtered.length)} จาก ${filtered.length} คน`}</p>
      </div>

      <Modal open={!!editing} title="แก้ไขข้อมูลผู้เข้าอบรม" onClose={() => setEditing(null)}>
        <div className="grid grid-cols-2 gap-[12px] max-sm:grid-cols-1">
          <Field label="ชื่อ">
            <input className={field} value={draft.firstName} onChange={(e) => setDraft({ ...draft, firstName: e.target.value })} />
          </Field>
          <Field label="นามสกุล">
            <input className={field} value={draft.lastName} onChange={(e) => setDraft({ ...draft, lastName: e.target.value })} />
          </Field>
          <div className="flex flex-col gap-[6px]">
            <span className="text-[14px] font-medium text-ink opacity-90">จังหวัด</span>
            <Select label="จังหวัด" value={draft.province} options={mapProvinces.map((p) => ({ value: p.name, label: p.name }))} onChange={(v) => setDraft({ ...draft, province: v })} />
          </div>
          <Field label="ชุมชน / ตำบล">
            <input className={field} value={draft.community} onChange={(e) => setDraft({ ...draft, community: e.target.value })} />
          </Field>
        </div>
        <p className="text-[12px] font-light text-gray-20">การแก้ไขนี้มีผลกับทุกหลักสูตรที่บุคคลนี้เข้าร่วม</p>
        <div className="flex justify-end gap-[8px]">
          <button type="button" className={softBtn} onClick={() => setEditing(null)}>
            ยกเลิก
          </button>
          <button type="button" className={primaryBtn} onClick={save} disabled={!draft.firstName.trim() || !draft.lastName.trim()}>
            บันทึก
          </button>
        </div>
      </Modal>
      {toast}
    </div>
  )
}
