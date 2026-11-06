import { useMemo, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import iconSearch from '../assets/dashboard/icon-search.svg'
import { useToast } from '../components/leader/Parts'
import Modal from '../components/ui/Modal'
import Pagination from '../components/ui/Pagination'
import Select from '../components/ui/Select'
import { Crumbs, DocPill, PersonaSwitch, Title, card, ctl, page } from '../components/saraban/Parts'
import { involves, isMyTurn, labelFor, people, type SDoc } from '../data/saraban'
import { approveDoc, returnDoc, useDocs, useMe } from '../lib/sarabanStore'

const PAGE = 8
const statusOptions = ['ร่าง', 'รอตรวจ', 'เสนออนุมัติ', 'ลงนามแล้ว', 'ตีกลับ', 'รอดำเนินการ', 'เวียนแจ้งแล้ว']
const eye = 'M2 12s4-7 10-7 10 7 10 7-4 7-10 7S2 12 2 12Zm10 3a3 3 0 1 0 0-6 3 3 0 0 0 0 6Z'
const chat = 'M5 5h14v11H9l-4 4Z'
const pen = 'M4 20h4l11-11-4-4L4 16Z'
const Ic = ({ d }: { d: string }) => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <path d={d} />
  </svg>
)

/** เอกสารของฉัน (book 3 fig 2-49) — 2.1.7.4 */
export default function SarabanDocsPage() {
  const all = useDocs()
  const me = useMe()
  const navigate = useNavigate()
  const [q, setQ] = useState('')
  const [type, setType] = useState('')
  const [status, setStatus] = useState('')
  const [pg, setPg] = useState(1)
  const [reject, setReject] = useState<SDoc | null>(null)
  const [reason, setReason] = useState('')
  const [reasonErr, setReasonErr] = useState(false)
  const [toast, show] = useToast()

  const mine = useMemo(() => all.filter((d) => involves(d, me)), [all, me])
  const types = useMemo(() => [...new Set(mine.map((d) => d.type))], [mine])
  const filtered = useMemo(() => {
    const k = q.trim().toLowerCase()
    return mine.filter((d) => (!type || d.type === type) && (!status || labelFor(d, me) === status) && (!k || `${d.title} ${d.type} ${people[d.creator].name} ${d.no} ${d.issuedNo ?? ''}`.toLowerCase().includes(k)))
  }, [mine, q, type, status, me])
  const pages = Math.max(1, Math.ceil(filtered.length / PAGE))
  const cur = Math.min(pg, pages)
  const view = filtered.slice((cur - 1) * PAGE, cur * PAGE)

  const signerOf = (d: SDoc) => people[d.chain.find((c) => c.role === 'sign')?.who ?? d.chain[d.chain.length - 1]?.who ?? 'director'].short
  const doReturn = () => {
    if (!reason.trim()) return setReasonErr(true)
    if (reject) returnDoc(reject.id, me, reason.trim())
    show('ตีกลับเอกสารให้เจ้าหน้าที่สารบรรณแล้ว')
    setReject(null)
    setReason('')
    setReasonErr(false)
  }
  const ic = 'flex size-[26px] items-center justify-center rounded-[6px] text-blue-00 hover:bg-blue-bg focus-visible:outline-2 focus-visible:outline-blue-00'

  return (
    <div className={page}>
      <Title back="/saraban" right={<PersonaSwitch />}>เอกสารของฉัน</Title>
      <Crumbs items={[{ label: 'หน้าแรก', to: '/saraban' }, { label: 'เอกสารของฉัน' }]} />

      <div className="flex flex-wrap items-center gap-[10px]">
        <div className="relative w-[260px] max-sm:w-full">
          <input aria-label="ค้นหาเอกสาร" placeholder="ค้นหา ชื่อเรื่อง ประเภท หรือผู้จัดทำ" value={q} onChange={(e) => (setQ(e.target.value), setPg(1))} className={`${ctl} pr-[38px]`} />
          <img src={iconSearch} alt="" width={16} height={16} className="pointer-events-none absolute top-1/2 right-[12px] -translate-y-1/2" />
        </div>
        <span className="ml-auto text-[12px] font-medium text-black/90 max-md:ml-0">คัดกรองข้อมูล</span>
        <div className="w-[160px]"><Select label="ประเภทเอกสาร" value={type} placeholder="ประเภทเอกสาร" options={[{ value: '', label: 'ทุกประเภท' }, ...types.map((t) => ({ value: t, label: t }))]} onChange={(v) => (setType(v), setPg(1))} /></div>
        <div className="w-[160px]"><Select label="สถานะ" value={status} placeholder="เลือกสถานะ" options={[{ value: '', label: 'ทุกสถานะ' }, ...statusOptions.map((t) => ({ value: t, label: t }))]} onChange={(v) => (setStatus(v), setPg(1))} /></div>
      </div>

      <section className={`${card} overflow-hidden`} aria-label="รายการเอกสาร">
        <h2 className="px-[18px] pt-[16px] text-[15px] font-semibold text-blue-dark">เอกสารของฉัน</h2>
        <p className="px-[18px] pt-[6px] text-[12px] font-semibold">รายการเอกสาร <span className="font-light text-gray-20">({filtered.length})</span></p>
        <div className="overflow-x-auto">
          <table className="mt-[6px] w-full min-w-[820px] text-left">
            <thead>
              <tr className="text-[10px] font-light text-gray-20">{['วันที่สร้าง', 'ประเภทเอกสาร', 'เรื่อง', 'ผู้ลงนาม', 'สถานะ', 'การดำเนินการ'].map((h) => <th key={h} className="px-[14px] py-[8px] font-light">{h}</th>)}</tr>
            </thead>
            <tbody>
              {view.map((d) => {
                const turn = isMyTurn(d, me)
                const step = d.chain[d.step]
                return (
                  <tr key={d.id} className="cursor-pointer border-t border-gray-line-2 align-middle text-[12px] font-light transition-colors hover:bg-blue-bg/40" onClick={() => navigate(`/saraban/docs/${d.id}`)}>
                    <td className="px-[14px] py-[12px] whitespace-nowrap">{d.createdAt.slice(0, 10)}<br /><span className="text-[10px] text-gray-20">{d.createdAt.slice(11)}</span></td>
                    <td className="px-[14px] font-normal whitespace-nowrap">{d.type}</td>
                    <td className="max-w-[300px] px-[14px] font-normal"><span className="line-clamp-2">{d.title}</span><span className="text-[10px] text-gray-20">{d.no} · โดย {people[d.creator].short}</span></td>
                    <td className="px-[14px] font-normal whitespace-nowrap">{signerOf(d)}</td>
                    <td className="px-[14px]"><DocPill d={d} me={me} /></td>
                    <td className="px-[10px]" onClick={(e) => e.stopPropagation()}>
                      <div className="flex flex-col gap-[4px]">
                        <span className="flex gap-[2px]">
                          <Link to={`/saraban/docs/${d.id}`} aria-label={`ดู ${d.title}`} className={ic}><Ic d={eye} /></Link>
                          <Link to={`/saraban/docs/${d.id}#history`} aria-label={`ประวัติ ${d.title}`} className={ic}><Ic d={chat} /></Link>
                          {d.creator === me && (d.status === 'draft' || d.status === 'returned') && d.kind === 'internal' && <Link to={`/saraban/internal/new?edit=${d.id}`} aria-label={`แก้ไข ${d.title}`} className={ic}><Ic d={pen} /></Link>}
                        </span>
                        {turn && (
                          <span className="flex gap-[4px]">
                            <button type="button" onClick={() => { approveDoc(d.id, me); show(step.role === 'sign' ? `ลงนาม ${d.no} แล้ว` : `เซ็นผ่าน ${d.no} แล้ว`) }} className="rounded-[5px] bg-[#52b96b] px-[10px] py-[2px] text-[11px] font-semibold text-white hover:brightness-105">{step.role === 'sign' ? 'ลงนาม' : 'เซ็นผ่าน'}</button>
                            <button type="button" onClick={() => setReject(d)} className="rounded-[5px] bg-[#e5484d] px-[10px] py-[2px] text-[11px] font-semibold text-white hover:brightness-105">ตีกลับ</button>
                          </span>
                        )}
                      </div>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
        {view.length === 0 && <p className="py-[40px] text-center text-[13px] font-light text-gray-20">ไม่พบเอกสารที่ตรงกับเงื่อนไข</p>}
      </section>
      {pages > 1 && <div><Pagination page={cur} pageCount={pages} onChange={setPg} /></div>}

      <Modal open={!!reject} onClose={() => (setReject(null), setReason(''), setReasonErr(false))} title="ตีกลับเอกสาร" width="max-w-[520px]">
        <p className="text-[13px] font-light text-gray-30">{reject?.title}</p>
        <label className="flex flex-col gap-[4px]">
          <span className="text-[12px] font-medium text-gray-30">เหตุผลการตีกลับ / สิ่งที่ต้องแก้ไข *</span>
          <textarea autoFocus value={reason} onChange={(e) => (setReason(e.target.value), setReasonErr(false))} className={`${ctl} h-auto min-h-[100px] py-[10px] leading-[1.6] ${reasonErr ? 'border-red-00' : ''}`} />
          {reasonErr && <span role="alert" className="text-[11px] text-red-00">กรุณาระบุเหตุผล</span>}
        </label>
        <div className="flex justify-end gap-[8px]">
          <button type="button" onClick={() => (setReject(null), setReason(''))} className="h-[38px] rounded-[8px] border border-gray-line px-[18px] text-[13px]">ยกเลิก</button>
          <button type="button" onClick={doReturn} className="h-[38px] rounded-[8px] bg-[#e5484d] px-[20px] text-[13px] font-medium text-white hover:brightness-110">ตีกลับ</button>
        </div>
      </Modal>
      {toast}
    </div>
  )
}
