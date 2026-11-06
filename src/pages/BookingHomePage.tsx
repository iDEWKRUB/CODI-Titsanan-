import { useMemo, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { BI, BPersonaSwitch, Crumbs, Ic, StatusPill, Title, kindIcon, kindTone, page } from '../components/booking/Parts'
import { BookingDetail, KindBadge, when } from '../components/booking/Detail'
import { useToast } from '../components/leader/Parts'
import Modal from '../components/ui/Modal'
import { bPersonas, canApprove, kindMeta, kinds, resOf, type BKind, type BStatus, type Booking } from '../data/erpBooking'
import { bookings, useBPersona, useBookings } from '../lib/bookingStore'

const SHOW = 5
const btn = 'flex size-[30px] items-center justify-center rounded-[8px] border border-gray-line-2 text-gray-30 transition hover:border-blue-20 hover:bg-blue-bg hover:text-blue-00 focus-visible:outline-2 focus-visible:outline-blue-00'

/** การจองของฉัน — home of ERP BOOKING (book 3 §2.1.10.1 / .6 / .11, fig 2-57 – 2-58, 2-63 – 2-64, 2-69) */
export default function BookingHomePage() {
  const all = useBookings()
  const me = useBPersona()
  const navigate = useNavigate()
  const [toast, show] = useToast()
  const approver = canApprove(me)
  const myName = bPersonas[me].name
  const [tab, setTab] = useState<'mine' | 'approve'>('mine')
  const [open, setOpen] = useState<Booking>()
  const [list, setList] = useState(false)
  const [del, setDel] = useState<Booking>()
  const [q, setQ] = useState('')
  const [st, setSt] = useState<'all' | BStatus>('all')

  // who counts as "me" on the seeded data: the staff persona owns the staff bookings
  const owner = (b: Booking) => (me === 'staff' ? b.by === bPersonas.staff.name : b.by === myName)
  const mine = useMemo(() => all.filter(owner).sort((a, b) => b.createdAt.localeCompare(a.createdAt)), [all, me]) // eslint-disable-line react-hooks/exhaustive-deps
  const toApprove = useMemo(() => all.filter((b) => b.status === 'รออนุมัติ').sort((a, b) => a.createdAt.localeCompare(b.createdAt)), [all])
  const view = approver && tab === 'approve' ? toApprove : mine
  const pending = view.filter((b) => b.status === 'รออนุมัติ')
  const count = (k: BKind) => mine.filter((b) => b.kind === k && (b.status === 'รออนุมัติ' || b.status === 'อนุมัติ')).length
  const feed = useMemo(
    () => (approver && tab === 'approve' ? all : mine).flatMap((b) => b.history.map((h) => ({ ...h, b }))).sort((a, b) => b.at.localeCompare(a.at)).slice(0, 6),
    [all, mine, approver, tab],
  )
  const rows = useMemo(() => {
    const k = q.trim().toLowerCase()
    return view.filter((b) => (st === 'all' || b.status === st) && (!k || `${b.no} ${b.title} ${resOf(b.resId)?.name} ${b.by}`.toLowerCase().includes(k)))
  }, [view, q, st])
  const ownsPending = (b: Booking) => b.status === 'รออนุมัติ' && owner(b)

  const Actions = ({ b }: { b: Booking }) => (
    <div className="flex items-center justify-end gap-[6px]">
      <button type="button" aria-label={`ดูรายละเอียด ${b.no}`} title="ดูรายละเอียด" onClick={() => setOpen(b)} className={btn}><Ic d={BI.eye} s={15} /></button>
      {ownsPending(b) && <button type="button" aria-label={`แก้ไขคำขอ ${b.no}`} title="แก้ไขคำขอ" onClick={() => navigate(`${kindMeta[b.kind].path}?edit=${b.id}`)} className={btn}><Ic d={BI.edit} s={15} /></button>}
      <button type="button" aria-label={`คัดลอกคำขอ ${b.no}`} title="คัดลอกคำขอ" onClick={() => navigate(`${kindMeta[b.kind].path}?copy=${b.id}`)} className={btn}><Ic d={BI.copy} s={15} /></button>
      {ownsPending(b) && <button type="button" aria-label={`ลบคำขอ ${b.no}`} title="ลบคำขอ" onClick={() => setDel(b)} className={`${btn} hover:!border-[#f0b4b4] hover:!bg-[#fff1f1] hover:!text-[#c13232]`}><Ic d={BI.trash} s={15} /></button>}
      {approver && b.status === 'รออนุมัติ' && (
        <>
          <Link to={`/booking/approve?id=${b.id}`} aria-label={`อนุมัติ ${b.no}`} className="flex h-[30px] items-center gap-[4px] rounded-[8px] bg-[#17a673] px-[10px] text-[12px] font-medium text-white hover:brightness-110"><Ic d={BI.check} s={13} w={2.4} />อนุมัติ</Link>
          <Link to={`/booking/approve?id=${b.id}&no=1`} aria-label={`ไม่อนุมัติ ${b.no}`} className="flex h-[30px] items-center gap-[4px] rounded-[8px] border border-[#e5484d] bg-white px-[10px] text-[12px] font-medium text-[#c13232] hover:bg-[#fff1f1]"><Ic d={BI.x} s={13} w={2.4} />ไม่อนุมัติ</Link>
        </>
      )}
    </div>
  )

  const Table = ({ data }: { data: Booking[] }) => (
    <>
      <div className="overflow-x-auto max-md:hidden">
        <table className="w-full min-w-[760px] text-left text-[12px]">
          <thead className="text-[11px] text-gray-20"><tr>{['วันและเวลาที่จอง', 'รายการ', 'วันที่ใช้งาน', 'สถานะ', ''].map((h, i) => <th key={i} className="border-b border-gray-line-2 pb-[8px] pr-[10px] font-medium">{h}</th>)}</tr></thead>
          <tbody>
            {data.map((b) => (
              <tr key={b.id} className="border-b border-gray-line-2 last:border-0 hover:bg-[#f7faff]">
                <td className="py-[10px] pr-[10px] whitespace-nowrap text-gray-30"><span className="font-urbanist">{b.createdAt.replace(/^(\d+)-(\d+)-(\d+)/, (_, y, m, d) => `${d}/${m}/${Number(y) + 543}`)}</span></td>
                <td className="py-[10px] pr-[10px]">
                  <div className="flex items-center gap-[10px]"><KindBadge k={b.kind} size={32} /><div className="min-w-0"><p className="text-[13px] font-medium">{b.title}</p><p className="text-[11px] font-light text-gray-20">{`${kindMeta[b.kind].short} · ${resOf(b.resId)?.name}${approver && !owner(b) ? ` · ผู้ขอ ${b.by}` : ''}`}</p></div></div>
                </td>
                <td className="py-[10px] pr-[10px] whitespace-nowrap text-gray-30">{when(b)}</td>
                <td className="py-[10px] pr-[10px]"><StatusPill s={b.status} /></td>
                <td className="py-[10px]"><Actions b={b} /></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <ul className="flex flex-col gap-[10px] md:hidden">
        {data.map((b) => (
          <li key={b.id} className="flex flex-col gap-[10px] rounded-[12px] border border-gray-line-2 p-[12px]">
            <div className="flex items-start gap-[10px]"><KindBadge k={b.kind} size={36} /><div className="min-w-0 flex-1"><p className="text-[13px] leading-[1.35] font-semibold">{b.title}</p><p className="text-[11px] font-light text-gray-20">{`${b.no} · ${resOf(b.resId)?.name}`}</p></div><StatusPill s={b.status} /></div>
            <p className="flex items-center gap-[6px] text-[12px] text-gray-30"><Ic d={BI.cal} s={14} />{when(b)}</p>
            <Actions b={b} />
          </li>
        ))}
      </ul>
      {!data.length && <p className="py-[28px] text-center text-[13px] font-light text-gray-20">ไม่มีคำขอที่รอดำเนินการ</p>}
    </>
  )

  return (
    <div className={`${page} items-center`}>
      <div className="flex w-full max-w-[1100px] flex-col gap-[14px]">
        <Title right={<BPersonaSwitch />}>งานจองออนไลน์</Title>
        <Crumbs items={[{ label: 'หน้าแรก', to: '/booking' }, { label: 'การจองของฉัน' }]} />

        <p role="note" className="flex items-start gap-[10px] rounded-[12px] border border-[#f1d28b] bg-[#fffbea] px-[14px] py-[10px] text-[12px] leading-[1.6] text-[#7a5600]">
          <span className="mt-[2px] shrink-0"><Ic d={BI.alert} s={16} /></span>
          <span>ต้องจองล่วงหน้าอย่างน้อย <b className="font-semibold">1 วันทำการ</b> และจองห้องประชุมได้ไม่เกินครั้งละ 1 วัน คำขอที่ผู้มีอำนาจยังไม่พิจารณาสามารถแก้ไขหรือยกเลิกได้</span>
        </p>

        <div className="grid grid-cols-4 gap-[12px] max-lg:grid-cols-2 max-sm:grid-cols-1" aria-label="สรุปรายการจองตามประเภท">
          {kinds.map((k) => (
            <div key={k} className="flex items-center gap-[14px] rounded-[14px] border border-gray-line-2 bg-white p-[16px]">
              <span className={`flex size-[44px] shrink-0 items-center justify-center rounded-[12px] ${kindTone[k]}`}><Ic d={kindIcon[k]} s={20} /></span>
              <span className="flex flex-col"><span className="text-[12px] font-light text-gray-30">{kindMeta[k].short}</span><span className="font-urbanist text-[22px] leading-[1.2] font-semibold text-blue-dark">{count(k)}<span className="ml-[4px] text-[12px] font-light text-gray-20">รายการ</span></span></span>
            </div>
          ))}
        </div>

        <section className="flex flex-col gap-[10px] rounded-[14px] border border-gray-line-2 bg-white p-[16px]">
          <h2 className="text-[14px] font-semibold">จองด่วน</h2>
          <nav aria-label="จองด่วน" className="grid grid-cols-4 gap-[10px] max-lg:grid-cols-2 max-sm:grid-cols-1">
            {kinds.map((k) => (
              <Link key={k} to={kindMeta[k].path} className="group flex items-center gap-[12px] rounded-[12px] border border-gray-line-2 p-[12px] transition hover:border-blue-20 hover:shadow-[0_6px_18px_rgba(31,90,200,0.1)]">
                <span className={`flex size-[38px] shrink-0 items-center justify-center rounded-[10px] ${kindTone[k]}`}><Ic d={kindIcon[k]} s={18} /></span>
                <span className="min-w-0 flex-1"><span className="block text-[13px] font-semibold">{kindMeta[k].label}</span><span className="block text-[11px] font-light text-gray-20">{kindMeta[k].ref}</span></span>
                <span className="text-blue-00 transition group-hover:translate-x-[2px]"><Ic d={BI.plus} s={16} /></span>
              </Link>
            ))}
          </nav>
        </section>

        <div className="grid grid-cols-[minmax(0,1fr)_320px] items-start gap-[14px] max-lg:grid-cols-1">
          <section className="flex flex-col gap-[12px] rounded-[14px] border border-gray-line-2 bg-white p-[16px]">
            <div className="flex flex-wrap items-center gap-[10px]">
              {approver ? (
                <div role="tablist" aria-label="มุมมองคำขอ" className="grid grid-cols-2 gap-[4px] rounded-[10px] bg-blue-bg p-[4px]">
                  {([['mine', 'คำขอของฉัน'], ['approve', `คำขอที่ต้องอนุมัติ (${toApprove.length})`]] as const).map(([k, l]) => (
                    <button key={k} type="button" role="tab" aria-selected={tab === k} onClick={() => setTab(k)} className={`h-[32px] rounded-[8px] px-[14px] text-[12px] font-medium whitespace-nowrap transition ${tab === k ? 'bg-white text-blue-00 shadow-sm' : 'text-gray-30 hover:text-blue-00'}`}>{l}</button>
                  ))}
                </div>
              ) : <h2 className="text-[15px] font-semibold">คำขอรอดำเนินการ</h2>}
              <span className="flex-1" />
              <button type="button" onClick={() => { setList(true); setQ(''); setSt('all') }} className="h-[32px] rounded-[8px] border border-blue-00 px-[14px] text-[12px] font-medium text-blue-00 hover:bg-blue-bg">ทั้งหมด ({view.length})</button>
            </div>
            <Table data={pending.slice(0, SHOW)} />
          </section>

          <aside className="flex flex-col gap-[10px] rounded-[14px] border border-gray-line-2 bg-white p-[16px]" aria-label="การแจ้งเตือนและกิจกรรมล่าสุด">
            <h2 className="flex items-center gap-[8px] text-[14px] font-semibold"><span className="text-blue-00"><Ic d={BI.bell} s={16} /></span>การแจ้งเตือนและกิจกรรมล่าสุด</h2>
            <ol className="flex flex-col gap-[12px]">
              {feed.map((f, i) => (
                <li key={i} className="flex items-start gap-[10px]">
                  <span className={`mt-[2px] flex size-[28px] shrink-0 items-center justify-center rounded-full ${f.action.startsWith('อนุมัติ') || f.action.includes('เสร็จ') || f.action.includes('คืน') ? 'bg-[#dff5e8] text-[#0f8a63]' : f.action.startsWith('ไม่') ? 'bg-[#ffe3e3] text-[#c13232]' : 'bg-blue-bg text-blue-00'}`}><Ic d={kindIcon[f.b.kind]} s={14} /></span>
                  <span className="min-w-0 flex-1"><span className="block text-[12px] leading-[1.4] font-medium">{f.action}</span><span className="block truncate text-[11px] font-light text-gray-30">{f.b.title}</span><span className="block text-[10px] font-light text-gray-20">{f.by} · {f.at}</span></span>
                </li>
              ))}
              {!feed.length && <li className="text-[12px] font-light text-gray-20">ยังไม่มีกิจกรรม</li>}
            </ol>
          </aside>
        </div>
      </div>

      <Modal open={list} onClose={() => setList(false)} title="รายการคำขอทั้งหมด" width="max-w-[900px]">
        <div className="flex max-h-[68vh] flex-col gap-[12px] overflow-y-auto pr-[4px]">
          <div className="flex flex-wrap gap-[8px]">
            <label className="flex h-[38px] min-w-[200px] flex-1 items-center gap-[8px] rounded-[8px] border border-gray-line px-[10px] text-gray-20 focus-within:border-blue-00"><Ic d="M11 18a7 7 0 1 0 0-14 7 7 0 0 0 0 14ZM20 20l-4-4" /><input aria-label="ค้นหาคำขอ" placeholder="ค้นหาเลขที่คำขอ ชื่อรายการ หรือผู้ขอ" value={q} onChange={(e) => setQ(e.target.value)} className="min-w-0 flex-1 text-[13px] text-black outline-none" /></label>
            <select aria-label="สถานะคำขอ" value={st} onChange={(e) => setSt(e.target.value as 'all' | BStatus)} className="h-[38px] rounded-[8px] border border-gray-line bg-white px-[10px] text-[13px]">
              <option value="all">ทุกสถานะ</option>{(['รออนุมัติ', 'อนุมัติ', 'ไม่อนุมัติ', 'เสร็จสมบูรณ์', 'ยกเลิก'] as BStatus[]).map((s) => <option key={s} value={s}>{s}</option>)}
            </select>
          </div>
          <Table data={rows} />
        </div>
      </Modal>

      <Modal open={!!open} onClose={() => setOpen(undefined)} title={open ? `คำขอ ${open.no}` : ''} width="max-w-[640px]">
        {open && <div className="max-h-[68vh] overflow-y-auto pr-[4px]"><BookingDetail b={all.find((x) => x.id === open.id) ?? open} /></div>}
      </Modal>

      <Modal open={!!del} onClose={() => setDel(undefined)} title="ลบคำขอจอง" width="max-w-[420px]">
        {del && (
          <div className="flex flex-col gap-[16px]">
            <p className="text-[13px] leading-[1.6] font-light text-gray-30">ต้องการลบคำขอ <b className="font-semibold text-black">{del.no}</b> “{del.title}” ใช่หรือไม่ การลบจะคืนช่วงเวลาให้ผู้อื่นจองได้และไม่สามารถกู้คืนได้</p>
            <div className="flex justify-end gap-[8px]">
              <button type="button" onClick={() => setDel(undefined)} className="h-[38px] rounded-[8px] border border-gray-line px-[16px] text-[13px] hover:border-gray-10">ยกเลิก</button>
              <button type="button" onClick={() => { bookings.remove(del.id); setDel(undefined); show('ลบคำขอแล้ว') }} className="h-[38px] rounded-[8px] bg-[#e5484d] px-[16px] text-[13px] font-medium text-white hover:brightness-110">ลบคำขอ</button>
            </div>
          </div>
        )}
      </Modal>
      {toast}
    </div>
  )
}
