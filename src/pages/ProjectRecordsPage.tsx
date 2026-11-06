import { useMemo, useRef, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import iconSearch from '../assets/dashboard/icon-search.svg'
import { useToast } from '../components/leader/Parts'
import Pagination from '../components/ui/Pagination'
import Select from '../components/ui/Select'
import { Crumbs, PersonaSwitch, Title, card, ctl, page } from '../components/project/Parts'
import { baht0, pStatus, planBudget, spentOf, thDate, years, type PStatus, type Perf } from '../data/erpProject'
import { nextPerfNo, perfs, usePerfs } from '../lib/erpProjectStore'

const PAGE = 8
const dl = 'M12 4v10m-4-4 4 4 4-4M5 19h14'
const up = 'M12 15V5m-4 4 4-4 4 4M5 19h14'
const Ic = ({ d }: { d: string }) => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d={d} /></svg>
)

/** รายการผลการดำเนินงาน (book 3 fig 2-13) — 2.1.3.2 */
export default function ProjectRecordsPage() {
  const all = usePerfs()
  const navigate = useNavigate()
  const [toast, show] = useToast()
  const file = useRef<HTMLInputElement>(null)
  const [q, setQ] = useState('')
  const [year, setYear] = useState('2568')
  const [office, setOffice] = useState('')
  const [status, setStatus] = useState('')
  const [pg, setPg] = useState(1)

  const offices = useMemo(() => [...new Set(all.map((p) => p.office))], [all])
  const filtered = useMemo(() => {
    const k = q.trim().toLowerCase()
    return all.filter((p) => (!year || p.year === year) && (!office || p.office === office) && (!status || p.status === status) && (!k || `${p.no} ${p.name} ${p.creator} ${p.office}`.toLowerCase().includes(k))).sort((a, b) => b.id - a.id)
  }, [all, q, year, office, status])
  const pages = Math.max(1, Math.ceil(filtered.length / PAGE))
  const cur = Math.min(pg, pages)
  const view = filtered.slice((cur - 1) * PAGE, cur * PAGE)

  const exportCsv = () => {
    const head = ['เลขที่แผนงาน', 'ชื่อแผนงาน', 'ปีงบประมาณ', 'หน่วยงาน', 'ผู้จัดทำ', 'วันที่จัดทำ', 'งบประมาณ (บาท)', 'เบิกจ่ายแล้ว (บาท)', 'สถานะเอกสาร']
    const rows = filtered.map((p) => [p.no, p.name, p.year, p.office, p.creator, thDate(p.date), planBudget(p), spentOf(p), pStatus[p.status].label])
    const csv = '﻿' + [head, ...rows].map((r) => r.map((c) => `"${String(c).replace(/"/g, '""')}"`).join(',')).join('\r\n')
    const a = document.createElement('a')
    a.href = URL.createObjectURL(new Blob([csv], { type: 'text/csv;charset=utf-8' }))
    a.download = `ผลการดำเนินงาน-${year || 'ทุกปี'}.csv`
    a.click()
    URL.revokeObjectURL(a.href)
    show(`ส่งออก ${filtered.length} รายการแล้ว`)
  }
  const importCsv = async (f?: File) => {
    if (!f) return
    const text = (await f.text()).replace(/^\uFEFF/, '')
    const rows = text.split(/\r?\n/).map((l) => l.split(',').map((c) => c.replace(/^"|"$/g, '').trim())).filter((r) => r.length >= 2 && r[0])
    const body = /ชื่อ|name/i.test(rows[0]?.[0] ?? '') ? rows.slice(1) : rows
    let n = 0
    for (const r of body) {
      const amount = Number((r[2] ?? '').replace(/[^\d.]/g, '')) || 0
      const p: Perf = { id: perfs.next(), no: nextPerfNo(year || '2568'), name: r[0], strategy: '', year: year || '2568', state: 'ระหว่างดำเนินการ', kind: 'แผนงานประจำปี', office: 'สำนักเทคโนโลยีสารสนเทศ', creator: 'นำเข้าจากไฟล์', date: new Date().toISOString().slice(0, 10), code: (r[1] ?? '').replace(/\D/g, '').slice(0, 6), category: '', group: 'งบดำเนินบริหารจัดการ', item: 'หมวดค่าวัสดุ', init: amount, approved: 0, annual: 0, target: 0, progress: 0, note: 'นำเข้าจากไฟล์ CSV', expenses: [], status: 'draft' }
      perfs.save(p)
      n++
    }
    show(n ? `นำเข้า ${n} รายการ (สถานะร่าง)` : 'ไม่พบข้อมูลในไฟล์ (ต้องมีคอลัมน์ ชื่อแผนงาน, รหัสงบประมาณ, งบประมาณ)')
    if (file.current) file.current.value = ''
  }
  const tb = 'flex h-[32px] items-center gap-[6px] rounded-[8px] bg-blue-bg px-[12px] text-[12px] font-medium text-blue-00 hover:bg-blue-20 focus-visible:outline-2 focus-visible:outline-blue-00'
  const act = 'rounded-[8px] border border-gray-line bg-white px-[14px] py-[4px] text-[11px] font-medium text-black/90 hover:border-blue-00 hover:text-blue-00'

  return (
    <div className={page}>
      <Title back="/project" right={
        <>
          <PersonaSwitch />
          <button type="button" className={tb} onClick={() => file.current?.click()}><Ic d={dl} />Import</button>
          <input ref={file} type="file" accept=".csv,text/csv" aria-label="นำเข้าไฟล์ CSV" className="sr-only" onChange={(e) => importCsv(e.target.files?.[0])} />
          <button type="button" className={tb} onClick={exportCsv}><Ic d={up} />Export</button>
          <button type="button" onClick={() => navigate('/project/report')} className="h-[32px] rounded-[8px] bg-blue-00 px-[14px] text-[12px] font-medium text-white hover:brightness-110">เพิ่มผลการดำเนินงาน</button>
        </>
      }>รายการผลการดำเนินงาน</Title>
      <Crumbs items={[{ label: 'หน้าแรก', to: '/project' }, { label: 'รายการผลการดำเนินงาน' }]} />

      <div className="flex flex-wrap items-center gap-[10px]">
        <div className="relative w-[260px] max-sm:w-full">
          <input aria-label="ค้นหา" placeholder="ค้นหาชื่อ เลขที่ หรือผู้จัดทำ" value={q} onChange={(e) => (setQ(e.target.value), setPg(1))} className={`${ctl} pr-[38px]`} />
          <img src={iconSearch} alt="" width={16} height={16} className="pointer-events-none absolute top-1/2 right-[12px] -translate-y-1/2" />
        </div>
        <span className="ml-auto text-[12px] font-medium text-black/90 max-md:ml-0">คัดกรองข้อมูล</span>
        <div className="w-[130px]"><Select label="ปีงบประมาณ" value={year} placeholder="ปีงบประมาณ" options={[{ value: '', label: 'ทุกปี' }, ...years.map((y) => ({ value: y, label: `ปีงบ ${y}` }))]} onChange={(v) => (setYear(v), setPg(1))} /></div>
        <div className="w-[170px]"><Select label="หน่วยงาน" value={office} placeholder="หน่วยงานทั้งหมด" options={[{ value: '', label: 'หน่วยงานทั้งหมด' }, ...offices.map((o) => ({ value: o, label: o }))]} onChange={(v) => (setOffice(v), setPg(1))} /></div>
        <div className="w-[150px]"><Select label="สถานะ" value={status} placeholder="เลือกสถานะ" options={[{ value: '', label: 'ทุกสถานะ' }, ...(Object.keys(pStatus) as PStatus[]).map((k) => ({ value: k, label: pStatus[k].label }))]} onChange={(v) => (setStatus(v), setPg(1))} /></div>
      </div>

      <section className={`${card} overflow-hidden`} aria-label="รายการผลการดำเนินงาน">
        <h2 className="px-[18px] pt-[16px] text-[15px] font-semibold text-blue-dark">รายการผลการดำเนินงาน <span className="text-[12px] font-light text-gray-20">({filtered.length})</span></h2>
        <div className="overflow-x-auto">
          <table className="mt-[8px] w-full min-w-[860px] text-left">
            <thead>
              <tr className="text-[10px] font-light text-gray-20">{['เลขที่แผนงาน', 'ปีงบประมาณ', 'หน่วยงาน', 'ผู้จัดทำ', 'วันที่จัดทำ', 'งบประมาณ (บาท)', 'สถานะเอกสาร', 'การดำเนินการ'].map((h) => <th key={h} className="px-[14px] py-[8px] font-light">{h}</th>)}</tr>
            </thead>
            <tbody>
              {view.map((p) => (
                <tr key={p.id} className="border-t border-gray-line-2 align-middle text-[12px] font-light">
                  <td className="px-[14px] py-[12px] font-urbanist font-medium whitespace-nowrap">{p.no}<br /><span className="font-prompt text-[10px] font-light text-gray-20">{p.name}</span></td>
                  <td className="px-[14px] font-urbanist">{p.year}</td>
                  <td className="px-[14px] font-medium">{p.office}</td>
                  <td className="px-[14px]">{p.creator}</td>
                  <td className="px-[14px] font-urbanist whitespace-nowrap">{thDate(p.date)}</td>
                  <td className="px-[14px] font-urbanist">{baht0(planBudget(p))}</td>
                  <td className="px-[14px]"><span className={`rounded-[6px] px-[10px] py-[3px] text-[11px] font-medium whitespace-nowrap ${pStatus[p.status].tone}`}>{pStatus[p.status].label}</span></td>
                  <td className="px-[10px]">
                    <div className="flex flex-col items-start gap-[4px]">
                      <Link to={`/project/report?id=${p.id}&view=1`} aria-label={`ดูรายละเอียด ${p.no}`} className={act}>ดูรายละเอียด</Link>
                      {p.status === 'draft' ? <Link to={`/project/report?id=${p.id}`} aria-label={`แก้ไข ${p.no}`} className={act}>แก้ไข</Link> : <span aria-hidden="true" className="px-[14px] py-[4px] text-[11px] text-gray-line">แก้ไข</span>}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        {view.length === 0 && <p className="py-[40px] text-center text-[13px] font-light text-gray-20">ไม่พบรายการที่ตรงกับเงื่อนไข</p>}
      </section>
      {pages > 1 && <div><Pagination page={cur} pageCount={pages} onChange={setPg} /></div>}
      {toast}
    </div>
  )
}
