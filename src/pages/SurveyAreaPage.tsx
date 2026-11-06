import { useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import iconSearch from '../assets/dashboard/icon-search.svg'
import iconSquares from '../assets/dashboard/icon-squares-four-blue.svg'
import Chip from '../components/community/Chip'
import LeafletMap from '../components/community/LeafletMap'
import { useToast } from '../components/leader/Parts'
import { regions } from '../data/leader'
import { kindColor, kindLabel, localTypes, problemColor, problemKinds, problemLabel, problemTitle, withReports, type MapPoint, type PointKind } from '../data/orgMap'
import { mapProvinces } from '../data/thaiMap'
import { RoleSwitch } from '../components/pm/Parts'
import Modal from '../components/ui/Modal'
import { useAreas, useProblems } from '../lib/areaStore'
import { usePmRole } from '../lib/projectStore'
import { useLocation } from 'react-router-dom'
import { useEffect } from 'react'

const layers: PointKind[] = ['council', 'org', 'leader', 'project', 'problem']

/** OSS-Area › พื้นที่สำรวจ ชุมชน (Figma 206:14123): problem points on the map, report counter in the card */
export default function SurveyAreaPage() {
  const navigate = useNavigate()
  const location = useLocation()
  const problems = useProblems()
  const [toast, showToast] = useToast()
  const [on, setOn] = useState<Set<PointKind>>(new Set(['problem']))
  const [local, setLocal] = useState('all')
  const [region, setRegion] = useState('ภาคเหนือ')
  const [province, setProvince] = useState('เชียงใหม่')
  const [district, setDistrict] = useState('แม่แจ่ม')
  const [sub, setSub] = useState('all')
  const [query, setQuery] = useState('')
  const [focus, setFocus] = useState<string>()
  const [selectedId, setSelectedId] = useState<string | null>(null)
  const [legend, setLegend] = useState(true)

  useEffect(() => {
    const t = (location.state as { toast?: string; focus?: string; province?: string } | null)
    if (!t) return
    if (t.toast) showToast(t.toast)
    if (t.province) {
      setProvince(t.province)
      setRegion(mapProvinces.find((x) => x.name === t.province)?.region ?? '')
      setDistrict('')
      setSub('all')
    }
    if (t.focus) {
      setFocus(t.focus)
      setSelectedId(t.focus)
    }
    navigate(location.pathname, { replace: true, state: null })
  }, [location.state])

  const areas = useAreas()
  const role = usePmRole()
  const [pickArea, setPickArea] = useState(false)
  const points = useMemo(() => withReports(problems, areas), [problems, areas])
  const inArea = useMemo(
    () => points.filter((p) => (local === 'all' || p.localType === local) && (!region || p.region === region) && (!province || p.province === province) && (!district || p.district === district) && (sub === 'all' || p.subdistrict === sub)),
    [points, local, region, province, district, sub],
  )
  const visible = useMemo(() => inArea.filter((p) => on.has(p.kind)), [inArea, on])
  const selected: MapPoint | undefined = useMemo(() => visible.find((p) => p.id === selectedId), [visible, selectedId])
  const outline = useMemo(() => ({ names: province ? [province] : region ? mapProvinces.filter((x) => x.region === region).map((x) => x.name) : [], strong: !!province }), [province, region])
  const matches = useMemo(() => {
    const q = query.trim().toLowerCase()
    return q ? visible.filter((p) => `${p.name} ${p.subdistrict}`.toLowerCase().includes(q)).slice(0, 8) : []
  }, [visible, query])

  const provinceOptions = [{ value: '', label: 'จังหวัดทั้งหมด' }, ...mapProvinces.filter((p) => !region || p.region === region).map((p) => ({ value: p.name, label: p.name }))]
  const districts = [...new Set(points.filter((p) => !province || p.province === province).map((p) => p.district))].sort((a, b) => a.localeCompare(b, 'th'))
  const subs = [...new Set(points.filter((p) => (!province || p.province === province) && (!district || p.district === district)).map((p) => p.subdistrict))].sort((a, b) => a.localeCompare(b, 'th'))
  const toggle = (k: PointKind) => setOn((s) => { const n = new Set(s); if (n.has(k)) n.delete(k); else n.add(k); return n })
  const counts = problemKinds.map((k) => inArea.filter((p) => p.kind === 'problem' && p.problemType === k).length)

  return (
    <div className="flex w-full flex-col gap-[16px] px-[24px] pb-[55px] max-sm:px-[12px] max-sm:pb-[25px]">
      <div className="flex flex-wrap items-center gap-[10px]">
        <img src={iconSquares} alt="" width={24} height={24} />
        <h1 className="min-w-0 flex-1 text-[20px] leading-[1.2] font-semibold text-blue-00">แผนที่พื้นที่สำรวจ</h1>
        <RoleSwitch />
      </div>

      <div className="flex flex-wrap items-center gap-[12px]">
        <span className="text-[12px] font-medium text-black/90">คัดกรองข้อมูล</span>
        <Chip label="ท้องที่" value={local} options={[{ value: 'all', label: 'ท้องที่' }, ...localTypes.map((t) => ({ value: t, label: t }))]} onChange={setLocal} />
        <Chip label="ภาค" value={region} options={[{ value: '', label: 'ทุกภาค' }, ...regions.map((r) => ({ value: r, label: r }))]} onChange={(v) => (setRegion(v), setProvince(''), setDistrict(''), setSub('all'))} />
        <Chip label="จังหวัด" value={province} options={provinceOptions} onChange={(v) => (setProvince(v), setDistrict(''), setSub('all'), v && setRegion(mapProvinces.find((x) => x.name === v)?.region ?? ''))} />
        <Chip label="อำเภอ" value={district} options={[{ value: '', label: 'อำเภอทั้งหมด' }, ...districts.map((d) => ({ value: d, label: d }))]} onChange={(v) => (setDistrict(v), setSub('all'))} />
        <Chip label="ตำบล" value={sub} options={[{ value: 'all', label: 'ตำบล/แขวงทั้งหมด' }, ...subs.map((d) => ({ value: d, label: d }))]} onChange={setSub} />
        <div className="relative ml-auto flex w-[237px] min-w-0 items-center gap-[6px] rounded-[8px] border border-gray-line bg-gray-subtle px-[16px] py-[10px] transition-colors focus-within:border-blue-00 focus-within:bg-white max-lg:ml-0 max-lg:w-full">
          <input aria-label="ค้นหาตำแหน่ง" type="search" value={query} onChange={(e) => setQuery(e.target.value)} placeholder="ค้นหาตำแหน่ง" className="min-w-0 flex-1 bg-transparent text-[12px] font-light outline-none placeholder:text-gray-20 [&::-webkit-search-cancel-button]:hidden" />
          <img src={iconSearch} alt="" width={18} height={18} />
          {matches.length > 0 && (
            <ul className="absolute top-[calc(100%+6px)] left-0 z-[600] w-full overflow-hidden rounded-[10px] bg-white py-[6px] drop-shadow-[0px_4px_10px_rgba(0,0,0,0.15)]">
              {matches.map((m) => (
                <li key={m.id}>
                  <button type="button" onClick={() => (setFocus(m.id), setSelectedId(m.id), setQuery(''))} className="flex w-full items-center gap-[8px] px-[12px] py-[6px] text-left text-[12px] hover:bg-blue-bg">
                    <span className="size-[8px] shrink-0 rounded-full" style={{ background: m.problemType ? problemColor[m.problemType] : kindColor[m.kind] }} />
                    <span className="min-w-0 flex-1 truncate">{m.name} · ต.{m.subdistrict}</span>
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>
        <div className="flex gap-[8px] max-lg:w-full">
          <button type="button" onClick={() => (role === 'staff' ? setPickArea(true) : navigate('/community/household'))} className="flex items-center gap-[4px] rounded-[8px] bg-blue-00 px-[10px] py-[8px] text-[12px] leading-[normal] font-medium whitespace-nowrap text-white-soft transition hover:brightness-110 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-00 max-lg:flex-1 max-lg:justify-center">
            {role === 'staff' ? '+ เพิ่ม/แก้ไขพื้นที่สำรวจ' : '+ เพิ่ม/แก้ไขข้อมูล'}
          </button>
          <button type="button" onClick={() => navigate('/community/problem/new')} className="flex items-center gap-[4px] rounded-[8px] bg-blue-00 px-[10px] py-[8px] text-[12px] leading-[normal] font-medium whitespace-nowrap text-white-soft transition hover:brightness-110 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-00 max-lg:flex-1 max-lg:justify-center">
            + แจ้งปัญหาเชิงพื้นที่
          </button>
        </div>
      </div>

      <div className="relative h-[600px] max-sm:h-[480px]">
        <LeafletMap points={visible} fitKey={`${region}|${province}|${district}|${sub}|${local}`} focusId={focus} onHover={setSelectedId} outline={outline} />
        {selected && (
          <div className="absolute top-[12px] left-[12px] z-[500] w-[250px] max-w-[calc(100%-24px)] rounded-[10px] border border-gray-line-2 bg-white p-[14px] shadow-[0_2px_10px_rgba(0,0,0,0.2)]">
            <button type="button" aria-label="ปิดรายละเอียด" onClick={() => setSelectedId(null)} className="absolute top-[8px] right-[8px] flex size-[24px] items-center justify-center rounded-[6px] text-gray-20 hover:bg-gray-bg">
              ✕
            </button>
            <h2 className="pr-[24px] text-[16px] leading-[1.3] font-semibold text-blue-dark">{selected.problemType ? problemTitle[selected.problemType] : selected.name}</h2>
            <div className="mt-[8px] flex items-end gap-[12px]">
              <div className="min-w-0 flex-1">
                <p className="text-[11px] font-semibold text-black">ตำแหน่ง</p>
                <p className="text-[11px] leading-[1.5] font-light text-gray-30">
                  ต.{selected.subdistrict} อ.{selected.district} จ.{selected.province}
                </p>
              </div>
              {selected.kind === 'problem' ? (
                <div className="text-center">
                  <p className="text-[11px] font-semibold text-black">ถูกรายงาน</p>
                  <p className="font-urbanist text-[22px] leading-[1.1] font-semibold text-black">{(selected.reports ?? 1).toLocaleString('en-US')}</p>
                  <p className="text-[10px] text-gray-20">ครั้ง</p>
                </div>
              ) : (
                <p className="text-[11px] font-medium" style={{ color: kindColor[selected.kind] }}>{kindLabel[selected.kind]}</p>
              )}
            </div>
            {selected.detail && <p className="mt-[6px] text-[11px] font-light text-gray-30">{selected.detail}</p>}
            {selected.kind === 'problem' && (
              <button type="button" onClick={() => navigate(`/community/problem/new?point=${encodeURIComponent(selected.id)}`)} className="mt-[10px] w-full rounded-[8px] bg-blue-00 px-[12px] py-[9px] text-[12px] font-medium text-white-soft transition hover:brightness-110">
                แจ้งปัญหาเชิงพื้นที่
              </button>
            )}
          </div>
        )}

        <fieldset className="absolute top-[130px] right-[12px] z-[500] w-[184px] rounded-[8px] border-2 border-[#e6e6e6] bg-white px-[12px] py-[8px] max-sm:top-[auto] max-sm:right-auto max-sm:bottom-[12px] max-sm:left-[12px]">
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
          <div className="absolute right-[56px] bottom-[12px] z-[500] w-[250px] rounded-[8px] border-2 border-gray-line bg-white p-[12px] max-sm:hidden">
            <p className="mb-[8px] text-center text-[12px] leading-[1.1] font-medium text-blue-dark">คำอธิบายสัญลักษณ์</p>
            <ul className="grid grid-cols-2 gap-x-[8px] gap-y-[8px] text-[10px] font-medium text-gray-20">
              {problemKinds.map((k, i) => (
                <li key={k} className="flex items-center gap-[6px]">
                  <span className="size-[14px] shrink-0 rounded-full" style={{ background: problemColor[k] }} />
                  <span className="min-w-0 flex-1">{problemLabel[k]}</span>
                  <b className="font-light text-gray-10">{counts[i]}</b>
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
      <Modal open={pickArea} title="เพิ่ม/แก้ไขพื้นที่สำรวจ" onClose={() => setPickArea(false)}>
        <button type="button" onClick={() => navigate('/community/area/new')} className="rounded-[10px] bg-blue-00 px-[14px] py-[10px] text-[13px] font-medium text-white-soft transition hover:brightness-110">
          + เพิ่มพื้นที่สำรวจใหม่
        </button>
        <p className="text-[12px] font-medium text-gray-20">หรือเลือกพื้นที่ที่ต้องการแก้ไข ({areas.length})</p>
        <ul className="flex max-h-[320px] flex-col gap-[6px] overflow-y-auto">
          {areas.map((a) => (
            <li key={a.id}>
              <button type="button" onClick={() => navigate('/community/area/' + a.id)} className="flex w-full flex-col gap-[2px] rounded-[10px] border border-gray-line px-[14px] py-[10px] text-left transition-colors hover:border-blue-10 hover:bg-blue-bg">
                <span className="text-[14px] font-medium text-black">{a.code}</span>
                <span className="text-[12px] font-light text-gray-20">
                  ต.{a.subdistrict} อ.{a.district} จ.{a.province} · {a.households || 0} ครัวเรือน
                </span>
              </button>
            </li>
          ))}
        </ul>
      </Modal>
      {toast}
    </div>
  )
}
