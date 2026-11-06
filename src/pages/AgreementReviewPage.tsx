import { useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { ContractTable } from '../components/agreement/Table'
import { useContractActions } from '../components/agreement/useActions'
import { Crumbs, GI, GPersonaSwitch, Gate, Ic, Panel, Title, page } from '../components/agreement/Parts'
import Pagination from '../components/ui/Pagination'

const PAGE = 6

/** รายการสัญญารอตรวจสอบ (นิติกร) — book 3 §2.3.1.6, fig 2-123 */
export default function AgreementReviewPage() {
  const a = useContractActions()
  const [q, setQ] = useState('')
  const [pg, setPg] = useState(1)
  const rows = useMemo(() => {
    const k = q.trim().toLowerCase()
    return a.all.filter((c) => c.status === 'รอตรวจสอบ' && (!k || `${c.no} ${c.title} ${c.createdAt} ${c.party.name}`.toLowerCase().includes(k))).sort((x, y) => x.createdAt.localeCompare(y.createdAt))
  }, [a.all, q])
  const pages = Math.max(1, Math.ceil(rows.length / PAGE))
  const cur = Math.min(pg, pages)
  const legal = a.me === 'legal'

  return (
    <div className={`${page} items-center`}>
      <div className="flex w-full max-w-[1100px] flex-col gap-[14px]">
        <Title right={<GPersonaSwitch />}>รายการสัญญารอตรวจสอบ</Title>
        <Crumbs items={[{ label: 'หน้าแรก', to: '/agreement' }, { label: 'งานบริหารจัดการสัญญา', to: '/agreement' }, { label: 'รายการสัญญารอตรวจสอบ' }]} />
        <Gate allowed={legal} need="เจ้าหน้าที่นิติกร" />
        <Panel title={`สัญญาที่อยู่ระหว่างการตรวจสอบ (${rows.length})`} label="รายการสัญญารอตรวจสอบ">
          <label className="flex h-[40px] items-center gap-[8px] rounded-[8px] border border-gray-line px-[10px] text-gray-20 focus-within:border-blue-00"><Ic d={GI.search} /><input aria-label="ค้นหาข้อมูล" placeholder="ค้นหาชื่อเรื่อง เลขที่สัญญา หรือวันที่บันทึก" value={q} onChange={(e) => { setQ(e.target.value); setPg(1) }} className="min-w-0 flex-1 text-[13px] text-black outline-none" /></label>
          <ContractTable rows={rows.slice((cur - 1) * PAGE, cur * PAGE)} can={a.can} onView={a.onView} onEdit={a.onEdit} onCopy={a.onCopy} onDelete={a.onDelete}
            extra={(c) => legal ? <Link to={`/agreement/review/detail?id=${c.id}`} aria-label={`ตรวจสอบ ${c.no}`} className="flex h-[30px] items-center gap-[4px] rounded-[8px] bg-blue-00 px-[12px] text-[12px] font-medium text-white hover:brightness-110">ตรวจสอบ</Link> : null}
            empty="ไม่มีสัญญาที่รอตรวจสอบ" />
          <div className="flex items-center justify-between"><span className="text-[12px] font-light text-gray-30">{`ทั้งหมด ${rows.length} รายการ`}</span><Pagination page={cur} pageCount={pages} onChange={setPg} /></div>
        </Panel>
      </div>
      {a.modals}
    </div>
  )
}
