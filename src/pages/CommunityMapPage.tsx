import { useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import iconSearch from '../assets/dashboard/icon-search.svg'
import iconSquares from '../assets/dashboard/icon-squares-four-blue.svg'
import Chip from '../components/community/Chip'
import LeafletMap from '../components/community/LeafletMap'
import { useToast } from '../components/leader/Parts'
import Modal from '../components/ui/Modal'
import { kindColor, kindLabel, localTypes, orgTypes, problemLabel, statsOf, withReports, type MapPoint, type PointKind } from '../data/orgMap'
import { regions } from '../data/leader'
import { mapProvinces } from '../data/thaiMap'
import { useAreas, useProblems } from '../lib/areaStore'

const fmt = (n: number) => n.toLocaleString('en-US')
const layers: PointKind[] = ['council', 'org', 'leader', 'project', 'problem']
const pieColors = ['#3b82f6', '#93c5fd', '#1d4ed8']

function Stat({ title, unit, value }: { title: string; unit: string; value: number }) {
  return (
    <div className="flex flex-col gap-[2px] leading-[normal]">
      <span className="text-[11px] font-medium text-blue-00">{title}</span>
      <span className="flex items-end justify-between gap-[8px]">
        <b className="font-urbanist text-[20px] leading-[1.2] font-semibold text-black">{fmt(value)}</b>
        <span className="pb-[2px] text-[10px] font-medium text-gray-20">{unit}</span>
      </span>
    </div>
  )
}

function Pie({ values }: { values: number[] }) {
  const total = values.reduce((a, b) => a + b, 0)
  let a0 = -Math.PI / 2
  const R = 70
  return (
    <svg viewBox="-80 -80 160 160" role="img" aria-label="สัดส่วนประเภทชุมชน" className="mx-auto size-[170px]">
      {total === 0 ? (
        <circle r={R} fill="#f2f3f4" />
      ) : (
        values.map((v, i) => {
          if (!v) return null
          const a1 = a0 + (v / total) * Math.PI * 2
          const big = a1 - a0 > Math.PI ? 1 : 0
          const d = values.filter(Boolean).length === 1 ? `M0 -${R}A${R} ${R} 0 1 1 -0.01 -${R}Z` : `M0 0L${R * Math.cos(a0)} ${R * Math.sin(a0)}A${R} ${R} 0 ${big} 1 ${R * Math.cos(a1)} ${R * Math.sin(a1)}Z`
          a0 = a1
          return <path key={i} d={d} fill={pieColors[i]} stroke="#fff" strokeWidth="1.5" />
        })
      )}
    </svg>
  )
}

const courseNames = ['การพัฒนาภาวะผู้นำชุมชน', 'การใช้เทคโนโลยีดิจิทัลเพื่อการสื่อสารในชุมชน', 'การบริหารจัดการโครงการพัฒนาชุมชน', 'การจัดทำข้อมูลชุมชนและใช้ระบบ e-Survey', 'ศักยภาพการพัฒนาที่ดินที่อยู่อาศัยในชุมชน']
const hashOf = (s: string) => [...s].reduce((h, c) => (h * 31 + c.charCodeAt(0)) >>> 0, 7)
/** sample training history for a leader (deterministic from the id) */
function trainingsOf(p: MapPoint) {
  const h = hashOf(p.id)
  return [0, 1, 2, 3].map((i) => ({ date: `${((h + i * 7) % 27) + 1} ${['ม.ค.', 'มี.ค.', 'พ.ค.', 'ก.ค.', 'ก.ย.', 'พ.ย.'][(h + i * 3) % 6]} ${2565 + ((h + i) % 4)}`, course: courseNames[(h + i) % courseNames.length] }))
}

/** Left panel while the pointer is on a marker (Figma แผนที่เชิงภูมิศาสตร์ ผู้นำชุมชน) */
function PointCard({ p, onMore }: { p: MapPoint; onMore: () => void }) {
  const row = (k: string, v: string) => (
    <p className="text-[11px] leading-[1.6] text-gray-30">
      <b className="font-semibold text-black">{k} : </b>
      {v}
    </p>
  )
  return (
    <div className="flex flex-col gap-[8px] pr-[24px]" aria-live="polite">
      <p className="flex items-center gap-[6px] text-[11px] font-medium" style={{ color: kindColor[p.kind] }}>
        <span className="size-[8px] rounded-full" style={{ background: kindColor[p.kind] }} />
        {kindLabel[p.kind]}
      </p>
      <h2 className="text-[16px] leading-[1.3] font-semibold text-blue-dark">{p.name}</h2>
      {p.kind === 'leader' && (
        <>
          <p className="flex items-center gap-[6px] text-[11px] font-semibold text-black">
            สถานะ : <span className="rounded-[4px] bg-green px-[6px] py-[1px] text-[10px] font-medium text-white-soft">ปฏิบัติงาน</span>
          </p>
          {row('ตำแหน่ง', p.position ?? '–')}
          {row('องค์กร', p.orgName ?? '–')}
          <p className="mt-[2px] text-[11px] font-semibold text-black">ช่องทางการติดต่อ</p>
          {row('โทร', p.phone ?? '–')}
          {row('อีเมล', p.email ?? '–')}
          {row('ที่อยู่', p.address ?? '–')}
          <p className="mt-[4px] text-[12px] font-semibold text-blue-00">ประวัติการอบรม</p>
          <table className="w-full border-collapse text-[10px]">
            <thead>
              <tr className="bg-gray-bg text-left">
                <th className="border border-gray-line px-[6px] py-[3px]">วันที่อบรม</th>
                <th className="border border-gray-line px-[6px] py-[3px]">ชื่อหลักสูตร / เรื่องที่อบรม</th>
              </tr>
            </thead>
            <tbody>
              {trainingsOf(p).map((t) => (
                <tr key={t.course}>
                  <td className="border border-gray-line px-[6px] py-[3px] whitespace-nowrap">{t.date}</td>
                  <td className="border border-gray-line px-[6px] py-[3px]">{t.course}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </>
      )}
      {p.kind !== 'leader' && (
        <>
          {row('ตำบล', p.subdistrict)}
          {row('อำเภอ / จังหวัด', `${p.district} / ${p.province}`)}
          {p.kind === 'org' && row('ประเภท', p.orgType ?? '–')}
          {(p.kind === 'org' || p.kind === 'council') && row('สมาชิก', `${fmt(p.members)} คน`)}
          {p.kind === 'org' && row('ครัวเรือนผู้เดือดร้อน', `${fmt(p.households)} ครัวเรือน`)}
          {p.kind === 'project' && row('ประเภทโครงการ', p.detail ?? '–')}
          {p.kind === 'problem' && p.detail && row('รายละเอียด', p.detail)}
          {p.kind === 'problem' && p.problemType && row('ประเภท', problemLabel[p.problemType])}
          {p.kind === 'problem' && row('ถูกรายงาน', String(p.reports ?? 1) + ' ครั้ง')}
        </>
      )}
      <button type="button" onClick={onMore} className="mt-[6px] self-end rounded-[8px] bg-gray-bg px-[14px] py-[8px] text-[12px] leading-[normal] font-medium whitespace-nowrap text-gray-20 transition-colors hover:bg-gray-line">
        ดูข้อมูลเพิ่มเติม
      </button>
    </div>
  )
}

export default function CommunityMapPage() {
  const problems = useProblems()
  const areas = useAreas()
  const [toast] = useToast()
  const [on, setOn] = useState<Set<PointKind>>(new Set(['council', 'org', 'leader', 'project']))
  // Figma opens on Chiang Mai › แม่แจ่ม
  const [local, setLocal] = useState('all')
  const [region, setRegion] = useState('ภาคเหนือ')
  const [province, setProvince] = useState('เชียงใหม่')
  const [district, setDistrict] = useState('แม่แจ่ม')
  const [sub, setSub] = useState('all')
  const [query, setQuery] = useState('')
  const [focus, setFocus] = useState<string>()
  const [selectedId, setSelectedId] = useState<string | null>(null)
  const [summaryOpen, setSummaryOpen] = useState(true)
  const [legend, setLegend] = useState(true)
  const navigate = useNavigate()
  const [list, setList] = useState(false)

  const points = useMemo<MapPoint[]>(() => withReports(problems, areas), [problems, areas])
  const inArea = useMemo(
    () => points.filter((p) => (local === 'all' || p.localType === local) && (!region || p.region === region) && (!province || p.province === province) && (!district || p.district === district) && (sub === 'all' || p.subdistrict === sub)),
    [points, local, region, province, district, sub],
  )
  const visible = useMemo(() => inArea.filter((p) => on.has(p.kind)), [inArea, on])
  const stats = useMemo(() => statsOf(inArea), [inArea])
  const selected = useMemo(() => (selectedId ? visible.find((x) => x.id === selectedId) : undefined), [selectedId, visible])
  // clicking a marker opens its card inside the map and folds the summary to the left
  const pick = (id: string | null) => {
    setSelectedId(id)
    if (id) setSummaryOpen(false)
  }
  const outline = useMemo(() => ({ names: province ? [province] : region ? mapProvinces.filter((x) => x.region === region).map((x) => x.name) : [], strong: !!province }), [province, region])
  const matches = useMemo(() => {
    const q = query.trim().toLowerCase()
    return q ? visible.filter((p) => `${p.name} ${p.subdistrict}`.toLowerCase().includes(q)).slice(0, 8) : []
  }, [visible, query])

  const provinceOptions = [{ value: '', label: 'จังหวัดทั้งหมด' }, ...mapProvinces.filter((p) => !region || p.region === region).map((p) => ({ value: p.name, label: p.name }))]
  const districts = [...new Set(points.filter((p) => !province || p.province === province).map((p) => p.district))].sort((a, b) => a.localeCompare(b, 'th'))
  const subs = [...new Set(points.filter((p) => (!province || p.province === province) && (!district || p.district === district)).map((p) => p.subdistrict))].sort((a, b) => a.localeCompare(b, 'th'))
  const toggle = (k: PointKind) => setOn((s) => { const n = new Set(s); if (n.has(k)) n.delete(k); else n.add(k); return n })

  return (
    <div className="flex w-full flex-col gap-[16px] px-[24px] pb-[55px] max-sm:px-[12px] max-sm:pb-[25px]">
      <div className="flex items-center gap-[10px]">
        <img src={iconSquares} alt="" width={24} height={24} />
        <h1 className="text-[20px] leading-[1.2] font-semibold text-blue-00">แผนที่เชิงภูมิศาสตร์</h1>
      </div>

      <div className="flex flex-wrap items-center gap-[12px]">
        <span className="text-[12px] font-medium text-black/90">คัดกรองข้อมูล</span>
        <Chip label="ท้องที่" value={local} options={[{ value: 'all', label: 'ท้องที่' }, ...localTypes.map((t) => ({ value: t, label: t }))]} onChange={setLocal} />
        <Chip label="ภาค" value={region} options={[{ value: '', label: 'ทุกภาค' }, ...regions.map((r) => ({ value: r, label: r }))]} onChange={(v) => (setRegion(v), setProvince(''), setDistrict(''), setSub('all'))} />
        <Chip label="จังหวัด" value={province} options={provinceOptions} onChange={(v) => (setProvince(v), setDistrict(''), setSub('all'), v && setRegion(mapProvinces.find((x) => x.name === v)?.region ?? ''))} />
        <Chip label="อำเภอ" value={district} options={[{ value: '', label: 'อำเภอทั้งหมด' }, ...districts.map((d) => ({ value: d, label: d }))]} onChange={(v) => (setDistrict(v), setSub('all'))} />
        <Chip label="ตำบล" value={sub} options={[{ value: 'all', label: 'ตำบล/แขวงทั้งหมด' }, ...subs.map((d) => ({ value: d, label: d }))]} onChange={setSub} />
        <div className="relative ml-auto flex w-[237px] min-w-0 items-center gap-[6px] rounded-[8px] border border-gray-line bg-gray-subtle px-[16px] py-[10px] transition-colors focus-within:border-blue-00 focus-within:bg-white max-md:ml-0 max-md:w-full">
          <input aria-label="ค้นหาตำแหน่ง" type="search" value={query} onChange={(e) => setQuery(e.target.value)} placeholder="ค้นหาตำแหน่ง" className="min-w-0 flex-1 bg-transparent text-[12px] font-light outline-none placeholder:text-gray-20 [&::-webkit-search-cancel-button]:hidden" />
          <img src={iconSearch} alt="" width={18} height={18} />
          {matches.length > 0 && (
            <ul className="absolute top-[calc(100%+6px)] left-0 z-[600] w-full overflow-hidden rounded-[10px] bg-white py-[6px] drop-shadow-[0px_4px_10px_rgba(0,0,0,0.15)]">
              {matches.map((m) => (
                <li key={m.id}>
                  <button type="button" onClick={() => (setFocus(m.id), setQuery(''))} className="flex w-full items-center gap-[8px] px-[12px] py-[6px] text-left text-[12px] hover:bg-blue-bg">
                    <span className="size-[8px] shrink-0 rounded-full" style={{ background: kindColor[m.kind] }} />
                    <span className="min-w-0 flex-1 truncate">{m.name}</span>
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>
        <button type="button" onClick={() => navigate('/community/problem/new')} className="flex items-center gap-[4px] rounded-[8px] bg-blue-00 px-[10px] py-[8px] text-[12px] leading-[normal] font-medium whitespace-nowrap text-white-soft transition hover:brightness-110 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-00 max-md:w-full max-md:justify-center">
          + แจ้งปัญหาเชิงพื้นที่
        </button>
      </div>

      <div className={`grid gap-[8px] transition-[grid-template-columns] duration-300 max-lg:grid-cols-1 ${summaryOpen ? 'grid-cols-[352px_minmax(0,1fr)]' : 'grid-cols-[48px_minmax(0,1fr)]'}`}>
        {!summaryOpen && (
          <button
            type="button"
            onClick={() => setSummaryOpen(true)}
            aria-expanded={false}
            aria-label="เปิดสรุปข้อมูลองค์กรชุมชน"
            className="flex items-center justify-center gap-[8px] rounded-[12px] border border-gray-line-2 bg-white py-[12px] text-blue-dark transition-colors hover:bg-blue-bg focus-visible:outline-2 focus-visible:outline-blue-00 lg:h-[600px] lg:flex-col lg:py-[16px]"
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
              <path d="m9 6 6 6-6 6" />
            </svg>
            <span className="text-[12px] font-semibold lg:[writing-mode:vertical-rl]">สรุปข้อมูลองค์กรชุมชน</span>
          </button>
        )}
        <section aria-label="สรุปข้อมูลองค์กรชุมชน" hidden={!summaryOpen} className="flex flex-col gap-[12px] overflow-y-auto rounded-[12px] border border-gray-line-2 bg-white p-[13px] lg:h-[600px]">
          <div className="flex items-start gap-[8px]">
            <div className="min-w-0 flex-1">
              <h2 className="text-[20px] leading-[1.2] font-semibold text-blue-dark">ข้อมูลองค์กรชุมชน</h2>
              <p className="mt-[8px] text-[14px] font-semibold text-blue-dark">จำนวนข้อมูลทั้งหมด</p>
            </div>
            <button type="button" aria-expanded aria-label="ย่อสรุปข้อมูลไปทางซ้าย" onClick={() => setSummaryOpen(false)} className="flex size-[28px] shrink-0 items-center justify-center rounded-[8px] bg-gray-bg text-gray-20 transition-colors hover:bg-blue-bg hover:text-blue-00 focus-visible:outline-2 focus-visible:outline-blue-00">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                <path d="m15 6-6 6 6 6" />
              </svg>
            </button>
          </div>
          <div className="grid grid-cols-2 gap-x-[24px] gap-y-[14px]" aria-live="polite">
            <Stat title="สภาองค์กรชุมชน" unit="สภา" value={stats.council} />
            <Stat title="องค์กรชุมชน" unit="องค์กร" value={stats.org} />
            <Stat title="สมาชิกองค์กรชุมชน" unit="คน" value={stats.members} />
            <Stat title="โครงการ" unit="โครงการ" value={stats.project} />
            <Stat title="ผู้นำชุมชน" unit="คน" value={stats.leader} />
            <Stat title="ครัวเรือนผู้เดือดร้อน" unit="ครัวเรือน" value={stats.households} />
          </div>
          <p className="text-[14px] font-semibold text-blue-dark">ประเภทชุมชน</p>
          <Pie values={orgTypes.map((t) => stats.types[t])} />
          <ul className="grid gap-[4px] text-[11px] font-medium text-gray-20">
            {orgTypes.map((t, i) => (
              <li key={t} className="flex items-center gap-[8px]">
                <span className="size-[10px] rounded-[3px]" style={{ background: pieColors[i] }} />
                <span className="flex-1">{t}</span>
                <b className="font-light text-blue-00">{fmt(stats.types[t])} ชุมชน</b>
              </li>
            ))}
          </ul>
          <div className="mt-auto flex items-end gap-[8px]">
            <p className="flex-1 text-[8px] font-light text-gray-10">อัปเดตล่าสุด 5 พฤศจิกายน พ.ศ. 2568 · ข้อมูลตัวอย่าง</p>
            <button type="button" onClick={() => setList(true)} className="rounded-[8px] bg-gray-bg px-[14px] py-[10px] text-[12px] leading-[normal] font-medium whitespace-nowrap text-gray-20 transition-colors hover:bg-gray-line">
              ดูข้อมูลเพิ่มเติม
            </button>
          </div>
        </section>

        <div className="relative h-[600px] max-lg:h-[520px] max-sm:h-[460px]">
          <LeafletMap points={visible} fitKey={`${region}|${province}|${district}|${sub}|${local}`} focusId={focus} onHover={pick} outline={outline} />
          {selected && (
            <div className="absolute top-[12px] left-[12px] z-[500] max-h-[calc(100%-24px)] w-[300px] max-w-[calc(100%-24px)] overflow-y-auto rounded-[10px] border border-gray-line-2 bg-white p-[14px] shadow-[0_2px_10px_rgba(0,0,0,0.2)]">
              <button type="button" aria-label="ปิดรายละเอียด" onClick={() => setSelectedId(null)} className="absolute top-[8px] right-[8px] flex size-[24px] items-center justify-center rounded-[6px] text-gray-20 hover:bg-gray-bg">
                ✕
              </button>
              <PointCard p={selected} onMore={() => setFocus(selected.id)} />
            </div>
          )}
          <fieldset className="absolute top-[130px] right-[12px] z-[500] w-[184px] rounded-[8px] border-2 border-[#e6e6e6] bg-white px-[12px] py-[8px] max-sm:top-[auto] max-sm:bottom-[12px] max-sm:left-[12px] max-sm:right-auto">
            <legend className="sr-only">กรองข้อมูล</legend>
            <p className="mb-[6px] flex items-center justify-between text-[12px] leading-[1.1] font-medium text-blue-dark">
              กรองข้อมูล (Filter)
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                <path d="M4 5h16l-6 7.5V19l-4-2v-4.5Z" />
              </svg>
            </p>
            {layers.map((k) => (
              <label key={k} className="flex cursor-pointer items-center gap-[8px] py-[3px] text-[10px] font-medium text-gray-20">
                <input type="checkbox" checked={on.has(k)} onChange={() => toggle(k)} className="size-[14px] accent-blue-00" />
                {kindLabel[k]}
              </label>
            ))}
          </fieldset>
          {legend && (
            <div className="absolute right-[56px] bottom-[12px] z-[500] w-[234px] rounded-[8px] border-2 border-gray-line bg-white p-[12px] max-sm:hidden">
              <p className="mb-[8px] flex items-center justify-between text-[12px] leading-[1.1] font-medium text-blue-dark">คำอธิบายสัญลักษณ์</p>
              <ul className="grid grid-cols-2 gap-x-[8px] gap-y-[8px] text-[10px] font-medium text-gray-20">
                {(['org', 'leader', 'council', 'project'] as PointKind[]).map((k) => (
                  <li key={k} className="flex items-center gap-[6px]">
                    <span className="size-[14px] shrink-0 rounded-full" style={{ background: kindColor[k] }} />
                    {kindLabel[k]}
                  </li>
                ))}
              </ul>
            </div>
          )}
          <button type="button" aria-pressed={legend} aria-label="แสดง/ซ่อนคำอธิบายสัญลักษณ์" onClick={() => setLegend((v) => !v)} className="absolute right-[12px] bottom-[12px] z-[500] flex size-[35px] items-center justify-center rounded-[8px] bg-white shadow-[0_1px_4px_rgba(0,0,0,0.25)] hover:text-blue-00 max-sm:hidden">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" aria-hidden="true">
              <path d="M5 7h14M5 12h14M5 17h14" />
            </svg>
          </button>
        </div>
      </div>

      <Modal open={list} title={`รายการในพื้นที่ที่เลือก (${fmt(inArea.length)})`} onClose={() => setList(false)} width="max-w-[720px]">
        <div className="max-h-[420px] overflow-auto">
          <table className="w-full text-left text-[12px] font-light">
            <thead className="sticky top-0 bg-white text-[10px] text-gray-20">
              <tr>
                <th className="py-[8px] font-light">ประเภท</th>
                <th className="font-light">ชื่อ</th>
                <th className="font-light">ตำบล</th>
                <th className="text-right font-light">สมาชิก</th>
              </tr>
            </thead>
            <tbody>
              {inArea.slice(0, 200).map((p) => (
                <tr key={p.id} className="cursor-pointer border-t border-gray-line hover:bg-blue-bg" onClick={() => (setFocus(p.id), setOn((s) => new Set([...s, p.kind])), setList(false))}>
                  <td className="py-[8px]">
                    <span className="mr-[6px] inline-block size-[8px] rounded-full" style={{ background: kindColor[p.kind] }} />
                    {kindLabel[p.kind]}
                  </td>
                  <td>{p.name}</td>
                  <td>{p.subdistrict}</td>
                  <td className="text-right">{p.members ? fmt(p.members) : '–'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Modal>
      {toast}
    </div>
  )
}
