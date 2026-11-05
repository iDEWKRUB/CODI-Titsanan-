import { useMemo, useState } from 'react'
import { useParams, useSearchParams } from 'react-router-dom'
import iconSearch from '../assets/dashboard/icon-search.svg'
import iconSort from '../assets/dashboard/icon-sort.svg'
import logo from '../assets/dashboard/logo-oss.svg'
import { Field, lbl, primaryBtn, useToast } from '../components/leader/Parts'
import { field } from '../components/meeting/FormParts'
import Pagination from '../components/ui/Pagination'
import Select from '../components/ui/Select'
import { thaiLong } from '../data/leader'
import { mapProvinces } from '../data/thaiMap'
import { updateCourse, useCourses } from '../lib/leaderStore'

const PAGE_SIZE = 4

/** Full-page view opened from the QR code (Figma OSS-Improvement/Record 236:18048): course info, attendee list, sign in / out */
export default function LeaderCoursePublicPage() {
  const { id } = useParams()
  const [search] = useSearchParams()
  const courses = useCourses()
  const c = courses.find((x) => x.id === Number(id))
  const [query, setQuery] = useState('')
  const [province, setProvince] = useState('all')
  const [community, setCommunity] = useState('all')
  const [pg, setPg] = useState(1)
  const [form, setForm] = useState({ firstName: '', lastName: '', province: 'เชียงใหม่', community: '' })
  const [pick, setPick] = useState('')
  const [done, setDone] = useState('')
  const [toast] = useToast()
  const mode = search.get('out') ? 'out' : search.get('test') ? 'test' : 'in'

  const rows = useMemo(() => {
    const q = query.trim().toLowerCase()
    return (c?.attendees ?? []).filter((a) => (province === 'all' || a.province === province) && (community === 'all' || a.community === community) && (!q || `${a.firstName} ${a.lastName}`.toLowerCase().includes(q)))
  }, [c, query, province, community])

  const shell = (inner: React.ReactNode) => (
    <div className="flex min-h-screen flex-col bg-white">
      <main className="mx-auto flex w-full max-w-[1100px] flex-1 flex-col gap-[16px] px-[24px] py-[24px] max-sm:px-[16px]">
        <header className="flex flex-col items-center gap-[8px] pb-[8px] text-center">
          <img src={logo} alt="CODI" width={56} height={56} className="size-[56px]" />
          <p className="text-[16px] font-semibold text-black">สถาบันพัฒนาองค์กรชุมชน (องค์การมหาชน)</p>
        </header>
        {inner}
      </main>
      <footer className="px-[24px] py-[16px] text-[11px] font-light text-gray-20">Copyright © 2568 สถาบันพัฒนาองค์กรชุมชน (องค์การมหาชน)</footer>
      {toast}
    </div>
  )

  if (!c || c.status === 'draft') return shell(<p className="rounded-[12px] bg-gray-subtle p-[24px] text-center text-[14px] text-gray-20">ไม่พบหลักสูตรนี้ หรือยังไม่เปิดให้ลงทะเบียน</p>)

  const signIn = () => {
    const first = form.firstName.trim(), last = form.lastName.trim()
    if (!first || !last) return
    const found = c.attendees.find((a) => a.firstName === first && a.lastName === last)
    updateCourse(c.id, (x) => ({
      ...x,
      attendees: found
        ? x.attendees.map((a) => (a.id === found.id ? { ...a, verified: true } : a))
        : [...x.attendees, { id: x.attendees.reduce((n, a) => Math.max(n, a.id), 0) + 1, firstName: first, lastName: last, province: form.province, community: form.community.trim(), verified: true, pre: 'wait', post: 'wait', certified: false }],
    }))
    setDone(`ลงชื่อเข้าอบรมแล้ว: ${first} ${last}`)
    setForm({ ...form, firstName: '', lastName: '', community: '' })
  }
  const signOut = () => {
    const a = c.attendees.find((x) => String(x.id) === pick)
    if (!a) return
    updateCourse(c.id, (x) => ({ ...x, attendees: x.attendees.map((y) => (y.id === a.id ? { ...y, signedOut: true } : y)) }))
    setDone(`ลงชื่อออกแล้ว: ${a.firstName} ${a.lastName}`)
    setPick('')
  }

  const pageCount = Math.max(1, Math.ceil(rows.length / PAGE_SIZE))
  const current = Math.min(pg, pageCount)
  const visible = rows.slice((current - 1) * PAGE_SIZE, current * PAGE_SIZE)
  const communities = [...new Set(c.attendees.map((a) => a.community).filter(Boolean))]

  return shell(
    <>
      <div className="flex items-center gap-[10px]">
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#0085f9" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
          <circle cx="12" cy="9" r="5.5" />
          <path d="m8.8 13.6-1.8 7 5-2.6 5 2.6-1.8-7" />
        </svg>
        <h1 className="text-[20px] leading-[1.2] font-semibold text-blue-00">หลักสูตรอบรม</h1>
      </div>

      <div className="rounded-[14px] bg-[#7cc9f5] p-[8px]">
        <dl className="flex flex-col gap-[14px] rounded-[10px] bg-white p-[24px] text-[14px] leading-[1.5] font-light text-black max-sm:p-[16px]">
          {[
            ['หลักสูตร', c.name],
            ['วิทยากร', c.instructor || '–'],
            ['วันที่', thaiLong(c.startDate)],
            ['สถานที่', c.place || '–'],
          ].map(([k, v]) => (
            <p key={k}>
              <b className="font-semibold">{k} : </b>
              {v}
            </p>
          ))}
        </dl>
      </div>

      {mode !== 'test' ? (
        <section className="flex flex-col gap-[12px] rounded-[12px] border border-gray-line p-[16px]" aria-label={mode === 'out' ? 'ลงชื่อออก' : 'ลงชื่อเข้าอบรม'}>
          <h2 className="text-[16px] font-semibold text-black">{mode === 'out' ? 'ลงชื่อออก' : 'ลงชื่อเข้าอบรม'}</h2>
          {done && <p role="status" className="rounded-[8px] bg-green-bg px-[14px] py-[10px] text-[13px] text-green-text">{done}</p>}
          {mode === 'in' ? (
            <>
              <div className="grid grid-cols-2 gap-[12px] max-sm:grid-cols-1">
                <Field label="ชื่อ">
                  <input className={field} value={form.firstName} onChange={(e) => setForm({ ...form, firstName: e.target.value })} />
                </Field>
                <Field label="นามสกุล">
                  <input className={field} value={form.lastName} onChange={(e) => setForm({ ...form, lastName: e.target.value })} />
                </Field>
                <div className="flex flex-col gap-[6px]">
                  <span className={lbl}>จังหวัด</span>
                  <Select label="จังหวัด" value={form.province} options={mapProvinces.map((p) => ({ value: p.name, label: p.name }))} onChange={(v) => setForm({ ...form, province: v })} />
                </div>
                <Field label="ชุมชน / ตำบล">
                  <input className={field} value={form.community} onChange={(e) => setForm({ ...form, community: e.target.value })} />
                </Field>
              </div>
              <div>
                <button type="button" className={primaryBtn} onClick={signIn} disabled={!form.firstName.trim() || !form.lastName.trim()}>
                  ลงชื่อเข้าอบรม
                </button>
              </div>
            </>
          ) : (
            <>
              <div className="flex flex-col gap-[6px]">
                <span className={lbl}>เลือกชื่อของคุณ</span>
                <Select label="เลือกชื่อ" value={pick} placeholder="เลือกชื่อ" options={c.attendees.filter((a) => !a.signedOut).map((a) => ({ value: String(a.id), label: `${a.firstName} ${a.lastName}` }))} onChange={setPick} />
              </div>
              <div>
                <button type="button" className={primaryBtn} onClick={signOut} disabled={!pick}>
                  ยืนยันลงชื่อออก
                </button>
              </div>
            </>
          )}
        </section>
      ) : (
        <p className="rounded-[12px] bg-blue-bg p-[16px] text-[13px] leading-[1.7] font-light text-gray-30">
          แบบประเมิน {search.get('test') === 'post' ? 'หลังการอบรม (Post-Test)' : 'ก่อนการอบรม (Pre-Test)'} จะเชื่อมกับระบบแบบสำรวจของ พอช. เจ้าหน้าที่จะบันทึกผลลงในรายชื่อผู้เข้าอบรมของหลักสูตรนี้
        </p>
      )}

      <div className="flex flex-wrap items-center gap-[8px]">
        <label className="flex w-[283px] min-w-0 items-center gap-[6px] rounded-[8px] border border-gray-line bg-gray-subtle px-[16px] py-[10px] focus-within:border-blue-00 focus-within:bg-white max-sm:w-full">
          <span className="sr-only">ค้นหารายชื่อ</span>
          <input type="search" value={query} onChange={(e) => (setQuery(e.target.value), setPg(1))} placeholder="ค้นหารายชื่อ" className="min-w-0 flex-1 bg-transparent text-[12px] font-light outline-none placeholder:text-gray-20 [&::-webkit-search-cancel-button]:hidden" />
          <img src={iconSearch} alt="" width={18} height={18} />
        </label>
        <Select label="จังหวัด" tone="subtle" className="w-[150px] max-sm:flex-1" value={province} options={[{ value: 'all', label: 'ทุกจังหวัด' }, ...[...new Set(c.attendees.map((a) => a.province))].map((p) => ({ value: p, label: p }))]} onChange={(v) => (setProvince(v), setPg(1))} />
        <Select label="ชุมชน" tone="subtle" className="w-[150px] max-sm:flex-1" value={community} options={[{ value: 'all', label: 'ทุกชุมชน' }, ...communities.map((p) => ({ value: p, label: p }))]} onChange={(v) => (setCommunity(v), setPg(1))} />
      </div>

      <section className="rounded-[12px] bg-blue-gray p-[8px]" aria-label="รายชื่อผู้เข้าร่วมอบรม">
        <h2 className="px-[8px] pt-[4px] pb-[8px] text-[14px] font-semibold text-black">รายชื่อผู้เข้าร่วมอบรม</h2>
        <div className="overflow-x-auto rounded-[12px] bg-white p-[12px]">
          <table className="w-full min-w-[460px] text-left text-[12px] font-light">
            <thead>
              <tr className="text-[10px] text-gray-20">
                {['ลำดับ', 'ชื่อ', 'นามสกุล', 'จังหวัด', 'ชุมชน'].map((h) => (
                  <th key={h} className="py-[10px] font-light">
                    <span className="flex items-end">
                      {h}
                      <img src={iconSort} alt="" width={12} height={12} />
                    </span>
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {visible.map((a) => (
                <tr key={a.id} className="border-t border-gray-line">
                  <td className="py-[12px]">{c.attendees.indexOf(a) + 1}</td>
                  <td>{a.firstName}</td>
                  <td>{a.lastName}</td>
                  <td>{a.province}</td>
                  <td>{a.community || '–'}</td>
                </tr>
              ))}
            </tbody>
          </table>
          {visible.length === 0 && <p className="py-[24px] text-center text-[13px] text-gray-20">ไม่พบรายชื่อ</p>}
        </div>
      </section>
      <Pagination page={current} pageCount={pageCount} onChange={setPg} />
    </>,
  )
}
