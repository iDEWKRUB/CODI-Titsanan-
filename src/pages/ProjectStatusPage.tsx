import { useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import iconSearch from '../assets/dashboard/icon-search.svg'
import iconGear from '../assets/dashboard/nav-gear.svg'
import Chip from '../components/community/Chip'
import LeafletMap from '../components/community/LeafletMap'
import PageTitle from '../components/ui/PageTitle'
import { regions } from '../data/leader'
import { localTypes, withReports, type MapPoint } from '../data/orgMap'
import { mapProvinces } from '../data/thaiMap'
import { useAreas, useProblems } from '../lib/areaStore'

const typeColor: Record<string, string> = { บ้านพอเพียง: '#e5484d', บ้านมั่นคง: '#f59a3c', ชุมชนผู้มีรายได้น้อย: '#f6c94b' }
const typeLabel: Record<string, string> = { บ้านพอเพียง: 'โครงการบ้านพอเพียง', บ้านมั่นคง: 'โครงการบ้านมั่นคง', ชุมชนผู้มีรายได้น้อย: 'โครงการพัฒนาคุณภาพชีวิตของผู้มีรายได้น้อย' }
const layerList: { key: string; label: string }[] = [
  { key: 'council', label: 'สภาองค์กรชุมชน' },
  { key: 'org', label: 'องค์กรชุมชน' },
  { key: 'leader', label: 'ผู้นำชุมชน' },
  { key: 'project', label: 'โครงการ' },
  { key: 'problem', label: 'ปัญหาในพื้นที่' },
]
const coordinators = [
  { name: 'นางสาวสุพัตรา ใจมั่น', phone: '085-433-9889', email: 'karn.v@gmail.com' },
  { name: 'นายอนุชา แก้วกล้า', phone: '081-224-7781', email: 'anucha.k@example.com' },
  { name: 'นางวารี ศรีทอง', phone: '089-556-1234', email: 'waree.s@example.com' },
]
const statuses = [
  { label: 'อนุมัติ', cls: 'bg-[#17c3a1] text-white' },
  { label: 'อยู่ระหว่างดำเนินการ', cls: 'bg-[#ffc43d] text-black' },
  { label: 'รอปิดโครงการ', cls: 'bg-[#8b5cf6] text-white' },
]
const hash = (s: string) => [...s].reduce((a, c) => (a * 31 + c.charCodeAt(0)) >>> 0, 7)

/** Sample figures per project, stable for the same marker (real data comes from the project API later) */
function figures(p: MapPoint) {
  const h = hash(p.id)
  const approved = Math.round((0.6 + (h % 280) / 100) * 100) / 100
  const progress = 8 + (h % 62)
  const disbursed = Math.round(approved * (progress / 100) * 0.85 * 100) / 100
  const remain = Math.round((approved - disbursed) * 100) / 100
  return { approved, disbursed, remain, progress, status: statuses[h % 3], coord: coordinators[h % 3] }
}

function Bars({ approved, disbursed, remain }: { approved: number; disbursed: number; remain: number }) {
  const max = Math.ceil(approved * 1.2 * 10) / 10
  const rows = [
    { label: 'อนุมัติ', v: approved, c: '#17c3a1' },
    { label: 'เบิกจ่าย', v: disbursed, c: '#f6a94b' },
    { label: 'คงเหลือ', v: remain, c: '#2f6df0' },
  ]
  return (
    <div className="flex flex-col gap-[6px]" role="img" aria-label={`งบประมาณ อนุมัติ ${approved} เบิกจ่าย ${disbursed} คงเหลือ ${remain} ล้านบาท`}>
      {rows.map((r) => (
        <div key={r.label} className="grid grid-cols-[44px_minmax(0,1fr)] items-center gap-[8px] text-[10px] text-gray-30">
          <span>{r.label}</span>
          <div className="relative h-[16px] rounded-[2px] bg-gray-bg">
            <div className="flex h-full items-center justify-end rounded-[2px] pr-[4px] font-urbanist text-[10px] text-white" style={{ width: `${Math.max(4, (r.v / max) * 100)}%`, background: r.c }}>{r.v.toFixed(2)}</div>
          </div>
        </div>
      ))}
    </div>
  )
}

/** OSS-Area › แผนที่เชิงภูมิศาสตร์ สถานการณ์โครงการ (Figma 334:25821) — 2.2.2.12 */
export default function ProjectStatusPage() {
  const problems = useProblems()
  const areas = useAreas()
  const navigate = useNavigate()
  const [local, setLocal] = useState('all')
  const [region, setRegion] = useState('ภาคเหนือ')
  const [province, setProvince] = useState('เชียงใหม่')
  const [district, setDistrict] = useState('แม่แจ่ม')
  const [sub, setSub] = useState('all')
  const [query, setQuery] = useState('')
  const [focus, setFocus] = useState<string>()
  const [selectedId, setSelectedId] = useState<string | null>(null)
  const [on, setOn] = useState<Set<string>>(new Set(['project']))
  const [legend, setLegend] = useState(true)

  const points = useMemo<MapPoint[]>(() => withReports(problems, areas), [problems, areas])
  const inArea = useMemo(
    () => points.filter((p) => (local === 'all' || p.localType === local) && (!region || p.region === region) && (!province || p.province === province) && (!district || p.district === district) && (sub === 'all' || p.subdistrict === sub)),
    [points, local, region, province, district, sub],
  )
  const visible = useMemo(() => inArea.filter((p) => on.has(p.kind)), [inArea, on])
  const projects = useMemo(() => visible.filter((p) => p.kind === 'project'), [visible])
  const selected = useMemo(() => visible.find((p) => p.id === selectedId) ?? projects[0], [visible, projects, selectedId])
  const outline = useMemo(() => ({ names: province ? [province] : region ? mapProvinces.filter((x) => x.region === region).map((x) => x.name) : [], strong: !!province }), [province, region])
  const matches = useMemo(() => {
    const q = query.trim().toLowerCase()
    return q ? visible.filter((p) => `${p.name} ${p.subdistrict}`.toLowerCase().includes(q)).slice(0, 8) : []
  }, [visible, query])
  const provinceOptions = [{ value: '', label: 'จังหวัดทั้งหมด' }, ...mapProvinces.filter((p) => !region || p.region === region).map((p) => ({ value: p.name, label: p.name }))]
  const districts = [...new Set(points.filter((p) => !province || p.province === province).map((p) => p.district))].sort((a, b) => a.localeCompare(b, 'th'))
  const subs = [...new Set(points.filter((p) => (!province || p.province === province) && (!district || p.district === district)).map((p) => p.subdistrict))].sort((a, b) => a.localeCompare(b, 'th'))
  const toggle = (k: string) => setOn((s) => { const n = new Set(s); if (n.has(k)) n.delete(k); else n.add(k); return n })
  const f = selected && selected.kind === 'project' ? figures(selected) : null

  return (
    <div className="flex w-full flex-col gap-[16px] px-[24px] pb-[55px] max-sm:px-[12px] max-sm:pb-[25px]">
      <PageTitle icon={iconGear}>สถานการณ์โครงการ</PageTitle>

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
                  <button type="button" onClick={() => (setFocus(m.id), setSelectedId(m.id), setQuery(''))} className="flex w-full items-center gap-[8px] px-[12px] py-[6px] text-left text-[12px] hover:bg-blue-bg">
                    <span className="min-w-0 flex-1 truncate">{m.name}</span>
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>

      <div className="relative h-[640px] max-lg:h-[560px] max-sm:h-[500px]">
        <LeafletMap points={visible} fitKey={`${region}|${province}|${district}|${sub}|${local}`} focusId={focus} onHover={(id) => id && setSelectedId(id)} outline={outline} colorOf={(p) => (p.kind === 'project' ? typeColor[p.detail ?? ''] : undefined)} />

        <aside aria-label="รายละเอียดโครงการ" className="absolute top-[12px] left-[12px] z-[500] flex max-h-[calc(100%-24px)] w-[340px] max-w-[calc(100%-24px)] flex-col gap-[10px] overflow-y-auto rounded-[12px] border border-gray-line-2 bg-white p-[16px] shadow-[0_2px_10px_rgba(0,0,0,0.2)] max-sm:w-[calc(100%-24px)]">
          {selected && f ? (
            <>
              <h2 className="text-[18px] leading-[1.25] font-semibold text-blue-dark">{selected.name}</h2>
              <dl className="grid grid-cols-[auto_minmax(0,1fr)] items-center gap-x-[8px] gap-y-[4px] text-[12px]">
                <dt className="font-semibold text-blue-dark">สถานะ :</dt>
                <dd><span className={`rounded-full px-[10px] py-[2px] text-[11px] font-medium ${f.status.cls}`}>{f.status.label}</span></dd>
                <dt className="font-semibold text-blue-dark">ตำแหน่ง :</dt>
                <dd className="font-light">{selected.subdistrict} {selected.district} {selected.province}</dd>
                <dt className="font-semibold text-blue-dark">ประเภท :</dt>
                <dd className="font-light">{typeLabel[selected.detail ?? ''] ?? selected.detail}</dd>
              </dl>
              <div>
                <h3 className="text-[14px] font-semibold text-blue-00">ผู้ประสาน</h3>
                <ul className="mt-[4px] flex flex-col gap-[3px] text-[12px] font-light">
                  <li><b className="font-semibold">{f.coord.name}</b></li>
                  <li><b className="font-semibold">โทร :</b> {f.coord.phone}</li>
                  <li><b className="font-semibold">อีเมล :</b> {f.coord.email}</li>
                  <li><b className="font-semibold">ที่อยู่ :</b> {selected.address ?? `ต.${selected.subdistrict} อ.${selected.district} จ.${selected.province}`}</li>
                </ul>
              </div>
              <div>
                <h3 className="text-[14px] font-semibold text-blue-00">ครัวเรือนผู้เดือดร้อน</h3>
                <p className="mt-[2px] flex items-baseline gap-[6px]"><b className="font-urbanist text-[24px] font-semibold">{(selected.households || 120 + (hash(selected.id) % 280)).toLocaleString('en-US')}</b><span className="text-[10px] text-gray-20">ครัวเรือน</span></p>
              </div>
              <div>
                <h3 className="text-[14px] font-semibold text-blue-00">งบประมาณ</h3>
                <p className="mb-[6px] text-[10px] text-gray-20">หน่วย: ล้านบาท</p>
                <Bars approved={f.approved} disbursed={f.disbursed} remain={f.remain} />
              </div>
              <div>
                <h3 className="text-[14px] font-semibold text-blue-00">ความคืบหน้า</h3>
                <div className="mt-[6px] flex items-center gap-[8px]">
                  <div className="h-[14px] flex-1 overflow-hidden rounded-full bg-gray-bg" role="progressbar" aria-valuenow={f.progress} aria-valuemin={0} aria-valuemax={100}>
                    <div className="h-full rounded-full bg-[#17c3a1]" style={{ width: f.progress + '%' }} />
                  </div>
                  <span className="font-urbanist text-[12px] text-gray-30">{f.progress}%</span>
                </div>
              </div>
              <div className="flex items-end gap-[8px]">
                <p className="flex-1 text-[8px] font-light text-gray-10">อัปเดตล่าสุด 5 พฤศจิกายน พ.ศ. 2568 · ข้อมูลตัวอย่าง</p>
                <button type="button" onClick={() => navigate('/projects')} className="rounded-[8px] bg-gray-bg px-[14px] py-[9px] text-[12px] font-medium whitespace-nowrap text-gray-20 transition-colors hover:bg-gray-line">ดูข้อมูลเพิ่มเติม</button>
              </div>
            </>
          ) : (
            <p className="py-[12px] text-center text-[12px] font-light text-gray-20">ไม่พบโครงการในพื้นที่ที่เลือก ลองเปลี่ยนตัวกรอง หรือเปิดชั้นข้อมูลโครงการ</p>
          )}
        </aside>

        <fieldset className="absolute top-[12px] right-[56px] z-[500] w-[184px] rounded-[8px] border-2 border-[#e6e6e6] bg-white px-[12px] py-[8px] max-sm:top-auto max-sm:right-auto max-sm:bottom-[12px] max-sm:left-[12px]">
          <legend className="sr-only">กรองข้อมูล</legend>
          <p className="mb-[6px] flex items-center justify-between text-[12px] leading-[1.1] font-medium text-blue-dark">กรองข้อมูล (Filter)</p>
          {layerList.map((k) => (
            <label key={k.key} className="flex cursor-pointer items-center gap-[8px] py-[3px] text-[10px] font-medium text-gray-20">
              <input type="checkbox" checked={on.has(k.key)} onChange={() => toggle(k.key)} className="size-[14px] accent-blue-00" />
              {k.label}
            </label>
          ))}
        </fieldset>

        {legend && (
          <div className="absolute right-[56px] bottom-[12px] z-[500] w-[250px] rounded-[8px] border-2 border-gray-line bg-white p-[12px] max-sm:hidden">
            <p className="mb-[8px] text-[12px] leading-[1.1] font-medium text-blue-dark">คำอธิบายสัญลักษณ์</p>
            <ul className="grid gap-[8px] text-[10px] font-medium text-gray-20">
              {Object.keys(typeColor).map((k) => (
                <li key={k} className="flex items-center gap-[8px]">
                  <span className="size-[16px] shrink-0 rounded-full" style={{ background: typeColor[k] }} />
                  {typeLabel[k]}
                </li>
              ))}
            </ul>
          </div>
        )}
        <button type="button" aria-pressed={legend} aria-label="แสดง/ซ่อนคำอธิบายสัญลักษณ์" onClick={() => setLegend((v) => !v)} className="absolute right-[12px] bottom-[12px] z-[500] flex size-[35px] items-center justify-center rounded-[8px] bg-white shadow-[0_1px_4px_rgba(0,0,0,0.25)] hover:text-blue-00 max-sm:hidden">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" aria-hidden="true"><path d="M5 7h14M5 12h14M5 17h14" /></svg>
        </button>
      </div>
    </div>
  )
}
