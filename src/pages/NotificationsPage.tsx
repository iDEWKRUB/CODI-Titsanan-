import { useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import iconBell from '../assets/dashboard/icon-bell.svg'
import iconSearch from '../assets/dashboard/icon-search.svg'
import { useToast } from '../components/leader/Parts'
import Modal from '../components/ui/Modal'
import PageTitle from '../components/ui/PageTitle'
import Pagination from '../components/ui/Pagination'
import Select from '../components/ui/Select'
import { markRead, notifRows as rows, setDone, unreadOf, useNotifState, type Level, type NotifRow as Row } from '../lib/notifStore'

const levelLabel: Record<Level, string> = { urgent2: 'เร่งด่วนมาก', urgent: 'เร่งด่วน', normal: 'ปกติ' }
const levelCls: Record<Level, string> = { urgent2: 'bg-[#ff4d57]', urgent: 'bg-[#ffc43d]', normal: 'bg-[#17c3a1]' }

const PAGE = 6
const contract = [
  'หรือดำเนินกิจกรรมอื่นที่เป็นงานพัฒนาหรือสาธารณประโยชน์อื่น ๆ สอดคล้องกับวัตถุประสงค์และเป้าหมายโครงการตามที่สมาชิกมีมติร่วมกัน โดยมีแผนการดำเนินงานและแผนการใช้จ่ายงบประมาณรองรับ',
  'หากองค์กรที่ได้รับการสนับสนุนไม่ปฏิบัติตามวัตถุประสงค์ของโครงการ ข้อตกลงของบันทึกความร่วมมือ หรือแผนการดำเนินงาน องค์กรที่ได้รับการสนับสนุนตกลงคืนงบประมาณพร้อมดอกเบี้ยที่เกิดขึ้นทั้งหมดที่ได้รับในแต่ละงวดที่ไม่ปฏิบัติตามวัตถุประสงค์ ข้อตกลงของบันทึกความร่วมมือ หรือแผนการดำเนินงาน ให้แก่สถาบันภายในระยะเวลาที่สถาบันกำหนดในหนังสือเรียกคืน',
  'ผลประโยชน์ในรูปแบบของดอกเบี้ยที่เกิดขึ้นจากการให้เงินสนับสนุนโครงการ ให้องค์กรที่ได้รับการสนับสนุนจัดทำแผนการใช้จ่ายเงินที่สอดคล้องหรือเกี่ยวข้องกับวัตถุประสงค์ของโครงการเสนอขอความเห็นชอบจากที่ประชุมขององค์กรที่ได้รับการสนับสนุน ก่อนการดำเนินงานและทำรายงานการใช้จ่ายเงินดังกล่าว พร้อมรายงานปิดโครงการให้สถาบันทราบ',
  'องค์กรที่ได้รับการสนับสนุนต้องจัดให้มีเอกสารหลักฐานการใช้จ่ายงบประมาณและเก็บรักษาเอกสารดังกล่าวเป็นอย่างดี เพื่อให้สถาบันและหน่วยงานของรัฐอื่นตรวจสอบ หากไม่สามารถแสดงหลักฐานการใช้จ่ายงบประมาณได้ ถือว่าองค์กรที่ได้รับการสนับสนุนไม่ปฏิบัติตามวัตถุประสงค์ ข้อตกลงของบันทึกความร่วมมือ หรือแผนการดำเนินงาน',
]

/** OSS-Area › แจ้งเตือนเอกสารเข้าใหม่ + pop-up ลงนาม / ส่งต่อ (Figma 324:23491, 331:21389, 331:21914) — 2.2.2.10 */
export default function NotificationsPage() {
  const st = useNotifState()
  const [q, setQ] = useState('')
  const [level, setLevel] = useState<'all' | Level>('all')
  const [onlyNew, setOnlyNew] = useState(false)
  const [pg, setPg] = useState(1)
  const [open, setOpen] = useState<Row | null>(null)
  const [toast, show] = useToast()

  const unread = unreadOf(st)
  const filtered = useMemo(() => {
    const k = q.trim()
    return rows.filter((r) => (level === 'all' || r.level === level) && (!onlyNew || !st.read.includes(r.id)) && (!k || r.title.includes(k)))
  }, [q, level, onlyNew, st.read])
  const pages = Math.max(1, Math.ceil(filtered.length / PAGE))
  const cur = Math.min(pg, pages)
  const view = filtered.slice((cur - 1) * PAGE, cur * PAGE)

  const openRow = (r: Row) => {
    setOpen(r)
    markRead(r.id)
  }
  const act = (label: string) => {
    if (!open) return
    setDone(open.id, label)
    show(`${label}: ${open.title}`)
    setOpen(null)
  }

  return (
    <div className="flex flex-col gap-[16px] px-[24px] pb-[55px] max-sm:px-[12px]">
      <PageTitle icon={iconBell}>แจ้งเตือนเอกสารเข้าใหม่</PageTitle>
      <nav aria-label="Breadcrumb" className="-mt-[8px] flex gap-[6px] text-[12px]">
        <Link to="/dashboard" className="font-light text-gray-10 hover:text-blue-00">หน้าแรก</Link>
        <span aria-hidden="true" className="text-gray-line">/</span>
        <span aria-current="page" className="font-light text-gray-10">แจ้งเตือนเอกสารเข้าใหม่</span>
      </nav>

      <div className="flex flex-wrap items-center gap-[10px]">
        <div className="w-[150px]">
          <Select label="ระดับความเร่งด่วน" value={level} options={[{ value: 'all', label: 'ค้นหาทั้งหมด' }, { value: 'urgent2', label: 'เร่งด่วนมาก' }, { value: 'urgent', label: 'เร่งด่วน' }, { value: 'normal', label: 'ปกติ' }]} onChange={(v) => { setLevel(v as typeof level); setPg(1) }} />
        </div>
        <div className="relative w-[260px] max-sm:w-full">
          <input aria-label="ค้นหาการแจ้งเตือน" placeholder="ค้นหาการแจ้งเตือน" value={q} onChange={(e) => { setQ(e.target.value); setPg(1) }} className="h-[40px] w-full rounded-[8px] border border-gray-line bg-gray-bg px-[14px] pr-[40px] text-[13px] font-light outline-none placeholder:text-gray-20 focus:border-blue-00" />
          <img src={iconSearch} alt="" width={18} height={18} className="pointer-events-none absolute top-1/2 right-[12px] -translate-y-1/2" />
        </div>
        <button
          type="button"
          aria-pressed={onlyNew}
          onClick={() => { setOnlyNew((v) => !v); setPg(1) }}
          className={`relative ml-auto flex items-center gap-[8px] rounded-[8px] px-[14px] py-[10px] text-[13px] font-medium transition-colors max-sm:ml-0 ${onlyNew ? 'bg-blue-dark text-white' : 'bg-blue-00 text-white-soft hover:brightness-110'}`}
        >
          <img src={iconBell} alt="" width={16} height={16} className="brightness-0 invert" />
          {onlyNew ? 'แสดงทั้งหมด' : unread ? `เอกสารใหม่ ${unread} รายการ` : 'ไม่มีเอกสารใหม่'}
          {unread > 0 && <span aria-hidden="true" className="absolute -top-[4px] -right-[4px] size-[10px] rounded-full bg-[#ff4d57] ring-2 ring-white" />}
        </button>
      </div>

      <section className="overflow-x-auto rounded-[12px] border border-gray-line-2 bg-white px-[16px] py-[8px]">
        <div className="min-w-[760px]">
          <div className="grid grid-cols-[56px_minmax(0,2fr)_110px_minmax(0,1.4fr)_140px_120px] items-center gap-[12px] border-b border-gray-line-2 px-[8px] py-[16px] text-[11px] text-gray-20">
            <span />
            <span className="text-center">ชื่อการแจ้งเตือน</span>
            <span className="text-center">ประเภทการแจ้งเตือน</span>
            <span className="text-center">วันที่แจ้งเตือน</span>
            <span className="text-center">ระดับความเร่งด่วน</span>
            <span className="text-center">คำสั่ง</span>
          </div>
          {view.length === 0 && <p className="py-[40px] text-center text-[13px] font-light text-gray-20">ไม่พบรายการแจ้งเตือน</p>}
          {view.map((r) => {
            const isNew = !st.read.includes(r.id)
            return (
              <div key={r.id} className="grid grid-cols-[56px_minmax(0,2fr)_110px_minmax(0,1.4fr)_140px_120px] items-center gap-[12px] border-b border-gray-line-2 px-[8px] py-[16px] last:border-b-0">
                <span className="flex justify-center">{isNew && <span className="rounded-[4px] bg-[#17c3a1] px-[6px] py-[1px] font-urbanist text-[10px] font-bold text-white">NEW</span>}</span>
                <span className="flex min-w-0 flex-col">
                  <span className={`truncate text-[13px] ${isNew ? 'font-semibold text-black' : 'font-light text-black'}`}>{r.title}</span>
                  {st.done[r.id] && <span className="text-[11px] font-medium text-blue-00">{st.done[r.id]}</span>}
                </span>
                <span className="text-center text-[12px] font-light">{r.type}</span>
                <span className="text-center text-[12px] font-light">{r.at}</span>
                <span className="flex justify-center"><span className={`w-[96px] rounded-[8px] py-[6px] text-center text-[12px] font-medium text-white ${levelCls[r.level]}`}>{levelLabel[r.level]}</span></span>
                <span className="flex justify-center"><button type="button" onClick={() => openRow(r)} aria-label={`ดู ${r.title}`} className="w-[88px] rounded-[8px] bg-blue-00 py-[7px] text-[12px] font-semibold text-white-soft transition hover:brightness-110">View</button></span>
              </div>
            )
          })}
        </div>
      </section>
      {pages > 1 && <div><Pagination page={cur} pageCount={pages} onChange={setPg} /></div>}

      <Modal open={!!open} onClose={() => setOpen(null)} title={open?.kind === 'forward' ? 'เอกสารเพื่อส่งต่อ' : open?.kind === 'sign' ? 'ลงนามเอกสาร' : 'รายละเอียดเอกสาร'} width="max-w-[1052px]" icon={iconBell}>
        <div className="flex flex-col gap-[16px]">
          <p className="text-[13px] font-light text-gray-30">{open?.title} · {open?.at}</p>
          <div className="max-h-[46vh] overflow-y-auto rounded-[10px] border border-gray-line-2 bg-white px-[min(10%,72px)] py-[24px] max-sm:px-[16px]" tabIndex={0} aria-label="เอกสาร">
            {contract.map((t, i) => (
              <p key={i} className={`mb-[14px] text-[14px] leading-[1.9] text-black ${i === 0 ? 'font-semibold' : 'indent-[3em] font-light'}`}>{t}</p>
            ))}
          </div>
          <div className="flex items-center justify-between gap-[8px]">
            {open?.kind === 'view' ? (
              <button type="button" onClick={() => setOpen(null)} className="ml-auto rounded-[8px] bg-blue-00 px-[28px] py-[10px] text-[13px] font-medium text-white-soft hover:brightness-110">ปิด</button>
            ) : (
              <>
                <button type="button" onClick={() => act('ปฏิเสธแล้ว')} className="rounded-[8px] bg-[#ff4d57] px-[28px] py-[10px] text-[13px] font-medium text-white hover:brightness-110">ปฏิเสธ</button>
                <button type="button" onClick={() => act(open?.kind === 'forward' ? 'ส่งต่อแล้ว' : 'ลงนามแล้ว')} className="rounded-[8px] bg-blue-00 px-[28px] py-[10px] text-[13px] font-medium text-white-soft hover:brightness-110">{open?.kind === 'forward' ? 'ส่งต่อ' : 'ลงนาม'}</button>
              </>
            )}
          </div>
        </div>
      </Modal>
      {toast}
    </div>
  )
}
