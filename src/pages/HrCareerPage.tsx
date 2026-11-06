import { useMemo, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useToast } from '../components/leader/Parts'
import Pagination from '../components/ui/Pagination'
import Select from '../components/ui/Select'
import { Crumbs, Gate, HPersonaSwitch, Pill, Title, card, ctl, downloadCsv, page } from '../components/hr/Parts'
import type { Career } from '../data/erpHr'
import { useCareers, useHPersona } from '../lib/hrStore'

const PAGE = 6
const ALL = 'ทั้งหมด'
const Ic = ({ d }: { d: string }) => <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d={d} /></svg>

/** จัดทำสายงานอาชีพ (book 3 fig 2-44) — 2.1.6.15 */
export default function HrCareerPage() {
  const all = useCareers()
  const me = useHPersona()
  const navigate = useNavigate()
  const [toast, show] = useToast()
  const [f, setF] = useState({ q: '', fy: ALL, type: ALL })
  const [q, setQ] = useState(f)
  const [tab, setTab] = useState(ALL)
  const [pg, setPg] = useState(1)
  const rows = useMemo(() => all.filter((c) => (!q.q.trim() || `${c.name} ${c.desc}`.includes(q.q.trim())) && (q.fy === ALL || c.fy === q.fy) && (q.type === ALL || c.type === q.type) && (tab === ALL || c.type === tab)).sort((a, b) => b.id - a.id), [all, q, tab])
  const pages = Math.max(1, Math.ceil(rows.length / PAGE))
  const cur = Math.min(pg, pages)
  const allowed = me === 'hr'
  const dl = (c: Career) => { downloadCsv(`สายอาชีพ-${c.id}.csv`, [['สายอาชีพ', c.name], ['ปีงบประมาณ', c.fy], ['ประเภท', c.type], ['ตำแหน่งก่อนหน้า', c.prevLevel], ['คุณสมบัติ', c.qualification], ...c.trainings.map((t, i) => [`เงื่อนไขการอบรม ${i + 1}`, `${t.contentType} ${t.count} หลักสูตร ${t.detail}`])]); show('ดาวน์โหลดรายละเอียดสายอาชีพแล้ว') }
  return (
    <div className={`${page} items-center`}>
      <div className="flex w-full max-w-[960px] flex-col gap-[12px]">
        <Title back="/hr" right={<div className="flex items-center gap-[8px]"><HPersonaSwitch /><button type="button" disabled={!allowed} onClick={() => navigate('/hr/career/new')} className="h-[36px] rounded-[8px] bg-blue-00 px-[14px] text-[12px] font-medium text-white disabled:opacity-40">+ สร้างสายงานอาชีพ</button></div>}>จัดทำสายงานอาชีพ</Title>
        <Crumbs items={[{ label: 'หน้าแรก', to: '/hr' }, { label: 'จัดทำสายงานอาชีพ' }]} />
        <Gate allowed={allowed} need="เจ้าหน้าที่สำนักทรัพยากรบุคคล" />
        <section className={`${card} flex flex-col gap-[12px] p-[18px]`}>
          <div className="grid grid-cols-[2fr_1fr_1fr] gap-[10px] max-md:grid-cols-1">
            <input aria-label="ค้นหาสายงาน" placeholder="Search" className={ctl} value={f.q} onChange={(e) => setF({ ...f, q: e.target.value })} />
            <Select label="ปีงบประมาณ" value={f.fy} options={[ALL, '2569', '2568'].map((v) => ({ value: v, label: v === ALL ? 'ทุกปีงบประมาณ' : v }))} onChange={(v) => setF({ ...f, fy: v })} />
            <Select label="ประเภทสายงาน" value={f.type} options={[ALL, 'บริหาร', 'วิชาการ'].map((v) => ({ value: v, label: v === ALL ? 'ทุกประเภท' : `สายงาน${v}` }))} onChange={(v) => setF({ ...f, type: v })} />
          </div>
          <div className="flex justify-end gap-[8px]">
            <button type="button" onClick={() => { const b = { q: '', fy: ALL, type: ALL }; setF(b); setQ(b); setPg(1) }} className="h-[36px] rounded-[8px] bg-gray-line px-[16px] text-[12px] font-medium text-gray-30">ล้างค่า</button>
            <button type="button" onClick={() => { setQ(f); setPg(1) }} className="h-[36px] rounded-[8px] bg-blue-00 px-[18px] text-[12px] font-medium text-white">ค้นหา</button>
          </div>
        </section>
        <section aria-label="รายการสายงาน" className={`${card} flex flex-col gap-[12px] p-[18px]`}>
          <div role="tablist" aria-label="ประเภท" className="grid grid-cols-3 gap-[6px] rounded-[8px] bg-blue-bg p-[3px]">
            {[ALL, 'บริหาร', 'วิชาการ'].map((t) => <button key={t} type="button" role="tab" aria-selected={tab === t} onClick={() => { setTab(t); setPg(1) }} className={`h-[32px] rounded-[6px] text-[12px] font-medium ${tab === t ? 'bg-blue-00 text-white' : 'text-blue-00 hover:bg-white/60'}`}>{t === ALL ? 'ทั้งหมด' : `สายงาน${t}`}</button>)}
          </div>
          <div className="overflow-x-auto"><table className="w-full min-w-[680px] text-left text-[12px]">
            <thead className="text-[10px] font-light text-gray-20"><tr>{['ลำดับ', 'สายอาชีพ', 'ปีงบประมาณ', 'ประเภท', 'สถานะ', ''].map((h, i) => <th key={i} className="py-[6px] pr-[8px] font-light">{h}</th>)}</tr></thead>
            <tbody>{rows.slice((cur - 1) * PAGE, cur * PAGE).map((c, i) => <tr key={c.id} className="border-t border-gray-line-2"><td className="py-[10px] font-urbanist">{(cur - 1) * PAGE + i + 1}</td><td className="pr-[8px] font-medium">{c.name}</td><td className="font-urbanist">{c.fy}</td><td>{`สายงาน${c.type}`}</td><td><Pill tone={c.status === 'active' ? 'bg-[#dff5e8] text-[#0f8a63]' : 'bg-gray-line text-gray-30'}>{c.status === 'active' ? 'ใช้งาน' : 'ร่าง'}</Pill></td><td className="text-right whitespace-nowrap"><Link to={`/hr/career/new?id=${c.id}`} aria-label={`ดูรายละเอียด ${c.name}`} className="mr-[4px] inline-flex size-[28px] items-center justify-center rounded-[6px] text-gray-20 hover:bg-blue-bg hover:text-blue-00"><Ic d="M2 12s4-7 10-7 10 7 10 7-4 7-10 7S2 12 2 12ZM12 9a3 3 0 1 0 0 6 3 3 0 0 0 0-6Z" /></Link><button type="button" aria-label={`ดาวน์โหลด ${c.name}`} onClick={() => dl(c)} className="inline-flex size-[28px] items-center justify-center rounded-[6px] text-gray-20 hover:bg-blue-bg hover:text-blue-00"><Ic d="M12 4v10m-4-4 4 4 4-4M5 19h14" /></button></td></tr>)}
              {!rows.length && <tr><td colSpan={6} className="py-[30px] text-center text-[12px] font-light text-gray-20">ไม่พบสายงาน</td></tr>}</tbody>
          </table></div>
        </section>
        <div className="flex justify-end"><Pagination page={cur} pageCount={pages} onChange={setPg} /></div>
      </div>
      {toast}
    </div>
  )
}
