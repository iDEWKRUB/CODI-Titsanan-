import { useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { ContractTable } from '../components/agreement/Table'
import { useContractActions } from '../components/agreement/useActions'
import { Crumbs, GI, GPersonaSwitch, Ic, Panel, Title, ctl, page } from '../components/agreement/Parts'
import Pagination from '../components/ui/Pagination'
import { dueOf, fiscalYear, types, type Due, type TypeKey } from '../data/erpAgreement'

const PAGE = 6
type F = { q: string; fy: string; type: '' | TypeKey; sign: string }
const blank: F = { q: '', fy: '', type: '', sign: '' }

/** ทะเบียนสัญญา — search + due-date tabs (book 3 §2.3.1.4, fig 2-120) */
export default function AgreementRegistryPage() {
  const a = useContractActions()
  const [draft, setDraft] = useState<F>(blank)
  const [f, setF] = useState<F>(blank)
  const [tab, setTab] = useState<'all' | Due>('all')
  const [pg, setPg] = useState(1)
  const reg = useMemo(() => a.all.filter((c) => c.fromRegistry), [a.all])
  const years = useMemo(() => [...new Set(reg.map((c) => fiscalYear(c.signDate || c.start)))].sort((x, y) => y - x), [reg])
  const rows = useMemo(() => {
    const k = f.q.trim().toLowerCase()
    return reg.filter((c) => (!k || `${c.no} ${c.title} ${c.party.name}`.toLowerCase().includes(k)) && (!f.fy || String(fiscalYear(c.signDate || c.start)) === f.fy) && (!f.type || c.type === f.type) && (!f.sign || c.signDate === f.sign)).sort((x, y) => y.updatedAt.localeCompare(x.updatedAt))
  }, [reg, f])
  const tabbed = tab === 'all' ? rows : rows.filter((c) => dueOf(c) === tab)
  const pages = Math.max(1, Math.ceil(tabbed.length / PAGE))
  const cur = Math.min(pg, pages)
  const cnt = (d: Due) => rows.filter((c) => dueOf(c) === d).length
  const tabs: ['all' | Due, string, number][] = [['all', 'รายการทั้งหมด', rows.length], ['เลยกำหนด', 'รายการที่เลยกำหนด', cnt('เลยกำหนด')], ['ใกล้ครบกำหนด', 'รายการที่ใกล้ครบกำหนด', cnt('ใกล้ครบกำหนด')], ['ปกติ', 'รายการปกติ', cnt('ปกติ')]]

  return (
    <div className={`${page} items-center`}>
      <div className="flex w-full max-w-[1100px] flex-col gap-[14px]">
        <Title right={<GPersonaSwitch />}>ทะเบียนสัญญา</Title>
        <Crumbs items={[{ label: 'หน้าแรก', to: '/agreement' }, { label: 'งานบริหารจัดการสัญญา', to: '/agreement' }, { label: 'ทะเบียนสัญญา' }]} />

        <Panel title="ค้นหาทะเบียนสัญญา" label="ค้นหาทะเบียนสัญญา" action={<Link to="/agreement/registry/new" className="flex h-[36px] items-center gap-[6px] rounded-[8px] bg-blue-00 px-[14px] text-[12px] font-medium text-white hover:brightness-110"><Ic d={GI.plus} s={15} w={2.2} />เพิ่มทะเบียนสัญญาใหม่</Link>}>
          <div className="grid grid-cols-[minmax(0,2fr)_repeat(3,minmax(0,1fr))] gap-[10px] max-lg:grid-cols-2 max-sm:grid-cols-1">
            <label className="flex h-[40px] items-center gap-[8px] rounded-[8px] border border-gray-line px-[10px] text-gray-20 focus-within:border-blue-00"><Ic d={GI.search} /><input aria-label="ค้นหาสัญญา" placeholder="ชื่อสัญญา เลขที่สัญญา หรือคู่สัญญา" value={draft.q} onChange={(e) => setDraft({ ...draft, q: e.target.value })} onKeyDown={(e) => { if (e.key === 'Enter') { setF(draft); setPg(1) } }} className="min-w-0 flex-1 text-[13px] text-black outline-none" /></label>
            <select aria-label="ปีงบประมาณ" value={draft.fy} onChange={(e) => setDraft({ ...draft, fy: e.target.value })} className={ctl}><option value="">ปีงบประมาณ: ทั้งหมด</option>{years.map((y) => <option key={y} value={y}>{`ปีงบประมาณ ${y}`}</option>)}</select>
            <select aria-label="ประเภทสัญญา" value={draft.type} onChange={(e) => setDraft({ ...draft, type: e.target.value as F['type'] })} className={ctl}><option value="">ประเภทสัญญา: ทั้งหมด</option>{types.map((t) => <option key={t.key} value={t.key}>{t.label}</option>)}</select>
            <input type="date" aria-label="วันที่ลงนาม" value={draft.sign} onChange={(e) => setDraft({ ...draft, sign: e.target.value })} className={ctl} />
          </div>
          <div className="flex justify-end gap-[8px]">
            <button type="button" onClick={() => { setDraft(blank); setF(blank); setPg(1) }} className="h-[36px] rounded-[8px] border border-gray-line px-[16px] text-[12px] hover:border-gray-10">ล้างค่า</button>
            <button type="button" onClick={() => { setF(draft); setPg(1) }} className="h-[36px] rounded-[8px] bg-blue-00 px-[20px] text-[12px] font-medium text-white hover:brightness-110">ค้นหา</button>
          </div>
        </Panel>

        <Panel title="รายการทะเบียนสัญญา" label="รายการทะเบียนสัญญา">
          <div role="tablist" aria-label="สถานะกำหนดสัญญา" className="flex flex-wrap gap-[4px] rounded-[10px] bg-blue-bg p-[4px]">
            {tabs.map(([k, l, n]) => <button key={k} type="button" role="tab" aria-selected={tab === k} onClick={() => { setTab(k); setPg(1) }} className={`h-[32px] rounded-[8px] px-[14px] text-[12px] font-medium whitespace-nowrap transition ${tab === k ? 'bg-white text-blue-00 shadow-sm' : 'text-gray-30 hover:text-blue-00'}`}>{`${l} (${n})`}</button>)}
          </div>
          <ContractTable showDue rows={tabbed.slice((cur - 1) * PAGE, cur * PAGE)} can={a.can} onView={a.onView} onEdit={a.onEdit} onCopy={a.onCopy} onDelete={a.onDelete} empty="ไม่พบสัญญาในทะเบียนตามเงื่อนไขที่ค้นหา" />
          <div className="flex items-center justify-between"><span className="text-[12px] font-light text-gray-30">{`ทั้งหมด ${tabbed.length} รายการ`}</span><Pagination page={cur} pageCount={pages} onChange={setPg} /></div>
        </Panel>
      </div>
      {a.modals}
    </div>
  )
}
