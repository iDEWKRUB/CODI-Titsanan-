import { useMemo, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useToast } from '../components/leader/Parts'
import Pagination from '../components/ui/Pagination'
import Select from '../components/ui/Select'
import { Crumbs, Gate, HPersonaSwitch, Pill, Title, card, ctl, downloadCsv, page } from '../components/hr/Parts'
import { evalStatus, evalTypes, thDate, type Evaluation } from '../data/erpHr'
import { useEvals, useHPersona } from '../lib/hrStore'

const PAGE = 6
const ALL = 'ทั้งหมด'
const years = ['2569', '2568']
const Ic = ({ d }: { d: string }) => <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d={d} /></svg>

/** รายการแบบประเมิน (book 3 fig 2-36) — 2.1.6.7 */
export default function HrEvaluationsPage() {
  const all = useEvals()
  const me = useHPersona()
  const navigate = useNavigate()
  const [toast, show] = useToast()
  const [f, setF] = useState({ q: '', fy: ALL, type: ALL })
  const [q, setQ] = useState(f)
  const [tab, setTab] = useState(ALL)
  const [pg, setPg] = useState(1)
  const rows = useMemo(() => all.filter((e) => (!q.q.trim() || e.name.includes(q.q.trim())) && (q.fy === ALL || e.fy === q.fy) && (q.type === ALL || e.type === q.type) && (tab === ALL || e.type === tab)).sort((a, b) => b.id - a.id), [all, q, tab])
  const pages = Math.max(1, Math.ceil(rows.length / PAGE))
  const cur = Math.min(pg, pages)
  const allowed = me === 'hr'
  const dl = (e: Evaluation) => {
    const qs = e.sections.flatMap((s) => s.questions.map((x) => x.title))
    downloadCsv(`ผลแบบประเมิน-${e.id}.csv`, [['ผู้ตอบ', ...qs], ...Array.from({ length: Math.min(e.responses, 20) }, (_, i) => [`ผู้ตอบ ${i + 1}`, ...qs.map((_, j) => ['ดีเยี่ยม', 'ดี', 'พอใช้'][(i + j) % 3])])])
    show(`ดาวน์โหลดผลการตอบ ${e.responses} รายการ`)
  }
  return (
    <div className={`${page} items-center`}>
      <div className="flex w-full max-w-[960px] flex-col gap-[12px]">
        <Title back="/hr" right={<div className="flex items-center gap-[8px]"><HPersonaSwitch /><button type="button" disabled={!allowed} onClick={() => navigate('/hr/evaluations/new')} className="h-[36px] rounded-[8px] bg-blue-00 px-[14px] text-[12px] font-medium text-white hover:brightness-110 disabled:opacity-40">+ สร้างรายการประเมิน</button></div>}>รายการแบบประเมิน</Title>
        <Crumbs items={[{ label: 'หน้าแรก', to: '/hr' }, { label: 'รายการแบบประเมิน' }]} />
        <Gate allowed={allowed} need="เจ้าหน้าที่สำนักทรัพยากรบุคคล" />
        <section className={`${card} flex flex-col gap-[12px] p-[18px]`}>
          <h2 className="text-[15px] font-semibold">ค้นหาแบบประเมิน</h2>
          <div className="grid grid-cols-[2fr_1fr_1fr] gap-[10px] max-md:grid-cols-1">
            <input aria-label="ค้นหาแบบประเมิน" placeholder="ค้นหาจากชื่อแบบประเมิน" className={ctl} value={f.q} onChange={(e) => setF({ ...f, q: e.target.value })} />
            <Select label="ปีงบประมาณ" value={f.fy} options={[ALL, ...years].map((v) => ({ value: v, label: v === ALL ? 'ทุกปีงบประมาณ' : v }))} onChange={(v) => setF({ ...f, fy: v })} />
            <Select label="ประเภทแบบประเมิน" value={f.type} options={[ALL, ...evalTypes].map((v) => ({ value: v, label: v === ALL ? 'ทุกประเภท' : v }))} onChange={(v) => setF({ ...f, type: v })} />
          </div>
          <div className="flex justify-end gap-[8px]">
            <button type="button" onClick={() => { const b = { q: '', fy: ALL, type: ALL }; setF(b); setQ(b); setPg(1) }} className="h-[36px] rounded-[8px] bg-gray-line px-[16px] text-[12px] font-medium text-gray-30">ล้างค่า</button>
            <button type="button" onClick={() => { setQ(f); setPg(1) }} className="h-[36px] rounded-[8px] bg-blue-00 px-[18px] text-[12px] font-medium text-white">ค้นหา</button>
          </div>
        </section>
        <section aria-label="รายการแบบประเมิน" className={`${card} flex flex-col gap-[12px] p-[18px]`}>
          <div role="tablist" aria-label="ประเภท" className="grid grid-cols-3 gap-[6px] rounded-[8px] bg-blue-bg p-[3px]">
            {[ALL, 'ประเมินต่อสัญญาจ้าง', 'ประเมินประจำปี'].map((t) => <button key={t} type="button" role="tab" aria-selected={tab === t} onClick={() => { setTab(t); setPg(1) }} className={`h-[32px] rounded-[6px] text-[12px] font-medium ${tab === t ? 'bg-blue-00 text-white' : 'text-blue-00 hover:bg-white/60'}`}>{t === ALL ? 'ทั้งหมด' : t === 'ประเมินต่อสัญญาจ้าง' ? 'แบบประเมินต่อสัญญาจ้าง' : 'แบบประเมินประจำปี'}</button>)}
          </div>
          <div className="overflow-x-auto">
            <table className="w-full min-w-[760px] text-left text-[12px]">
              <thead className="text-[10px] font-light text-gray-20"><tr>{['ลำดับ', 'ชื่อแบบประเมิน', 'ปีงบประมาณ', 'ประเภท', 'ช่วงเวลา', 'สถานะ', ''].map((h, i) => <th key={i} className="py-[6px] pr-[8px] font-light">{h}</th>)}</tr></thead>
              <tbody>
                {rows.slice((cur - 1) * PAGE, cur * PAGE).map((e, i) => (
                  <tr key={e.id} className="border-t border-gray-line-2">
                    <td className="py-[10px] pr-[8px] font-urbanist">{(cur - 1) * PAGE + i + 1}</td>
                    <td className="pr-[8px] font-medium">{e.name}</td>
                    <td className="pr-[8px] font-urbanist">{e.fy}</td>
                    <td className="pr-[8px] font-light whitespace-nowrap">{e.type}</td>
                    <td className="pr-[8px] font-light whitespace-nowrap">{`${thDate(e.publish)} – ${thDate(e.end)}`}</td>
                    <td className="pr-[8px]"><Pill tone={evalStatus[e.status].tone}>{evalStatus[e.status].label}</Pill></td>
                    <td className="whitespace-nowrap">
                      <Link to={`/hr/evaluations/design?id=${e.id}`} aria-label={`ดูรายละเอียด/แก้ไข ${e.name}`} className="mr-[4px] inline-flex size-[28px] items-center justify-center rounded-[6px] text-gray-20 hover:bg-blue-bg hover:text-blue-00"><Ic d="M5 20h4L20 9l-4-4L5 16Z" /></Link>
                      <button type="button" aria-label={`ดาวน์โหลด ${e.name}`} onClick={() => dl(e)} className="inline-flex size-[28px] items-center justify-center rounded-[6px] text-gray-20 hover:bg-blue-bg hover:text-blue-00"><Ic d="M12 4v10m-4-4 4 4 4-4M5 19h14" /></button>
                    </td>
                  </tr>
                ))}
                {!rows.length && <tr><td colSpan={7} className="py-[32px] text-center text-[13px] font-light text-gray-20">ไม่พบแบบประเมิน</td></tr>}
              </tbody>
            </table>
          </div>
        </section>
        <div className="flex justify-end"><Pagination page={cur} pageCount={pages} onChange={setPg} /></div>
      </div>
      {toast}
    </div>
  )
}
