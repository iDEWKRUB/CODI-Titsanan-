import { useMemo, useState } from 'react'
import { Crumbs, Ic, NI, NPersonaSwitch, NoticeList, Title, ctl, page } from '../components/notify/Parts'
import { useNoticeActions } from '../components/notify/useActions'
import Pagination from '../components/ui/Pagination'
import { forMe, isDue, type NStatus, type Severity } from '../data/erpNotify'
import { markDone } from '../lib/notifyStore'

const PAGE = 6

/** รายการแจ้งเตือนของฉัน — what I received: new / pending / responded (book 3 §2.5.2.2, fig 2-146) */
export default function NotifyMinePage() {
  const a = useNoticeActions()
  const [q, setQ] = useState('')
  const [sev, setSev] = useState<'' | Severity>('')
  const [st, setSt] = useState<'' | NStatus>('')
  const [pg, setPg] = useState(1)
  // a scheduled notice only reaches the inbox once its time has come
  const mine = useMemo(() => a.all.filter((n) => forMe(n, a.me) && (n.status !== 'ตั้งเวลา' || isDue(n))).sort((x, y) => `${y.date} ${y.time}`.localeCompare(`${x.date} ${x.time}`)), [a.all, a.me])
  const rows = useMemo(() => {
    const k = q.trim().toLowerCase()
    return mine.filter((n) => (!sev || n.severity === sev) && (!st || n.status === st) && (!k || `${n.title} ${n.detail} ${n.source}`.toLowerCase().includes(k)))
  }, [mine, q, sev, st])
  const pages = Math.max(1, Math.ceil(rows.length / PAGE))
  const cur = Math.min(pg, pages)
  const c = (s: NStatus) => mine.filter((n) => n.status === s).length
  const stats: [NStatus | '', string, number][] = [['', 'ทั้งหมด', mine.length], ['ใหม่', 'รายการใหม่', c('ใหม่')], ['รอดำเนินการ', 'ยังไม่ดำเนินการ', c('รอดำเนินการ')], ['ตอบสนองแล้ว', 'ตอบสนองแล้ว', c('ตอบสนองแล้ว')]]

  return (
    <div className={`${page} items-center`}>
      <div className="flex w-full max-w-[1100px] flex-col gap-[14px]">
        <Title right={<NPersonaSwitch />}>รายการแจ้งเตือนของฉัน</Title>
        <Crumbs items={[{ label: 'หน้าแรก', to: '/notify' }, { label: 'Notification Center', to: '/notify' }, { label: 'รายการแจ้งเตือนของฉัน' }]} />

        <div role="tablist" aria-label="สถานะการแจ้งเตือน" className="grid grid-cols-4 gap-[6px] rounded-[12px] bg-blue-bg p-[5px] max-sm:grid-cols-2">
          {stats.map(([k, l, n]) => (
            <button key={l} type="button" role="tab" aria-selected={st === k} onClick={() => { setSt(k); setPg(1) }} className={`flex h-[46px] flex-col items-center justify-center rounded-[9px] text-[12px] transition ${st === k ? 'bg-white font-semibold text-blue-00 shadow-sm' : 'text-gray-30 hover:text-blue-00'}`}>
              <span className="font-urbanist text-[16px] leading-[1.1] font-semibold">{n}</span><span className="text-[11px] font-light">{l}</span>
            </button>
          ))}
        </div>

        <section aria-label="รายการแจ้งเตือนของฉัน" className="flex flex-col gap-[10px] rounded-[14px] border border-gray-line-2 bg-white p-[16px]">
          <div className="grid grid-cols-[minmax(0,2fr)_minmax(0,1fr)] gap-[10px] max-sm:grid-cols-1">
            <label className="flex h-[40px] items-center gap-[8px] rounded-[8px] border border-gray-line px-[10px] text-gray-20 focus-within:border-blue-00"><Ic d={NI.search} /><input aria-label="ค้นหาการแจ้งเตือน" placeholder="ค้นหาหัวข้อ รายละเอียด หรือแหล่งที่มา" value={q} onChange={(e) => { setQ(e.target.value); setPg(1) }} className="min-w-0 flex-1 text-[13px] text-black outline-none" /></label>
            <select aria-label="ประเภทการแจ้งเตือน" value={sev} onChange={(e) => { setSev(e.target.value as '' | Severity); setPg(1) }} className={ctl}><option value="">ทุกประเภท</option><option value="ทั่วไป">ทั่วไป</option><option value="ปานกลาง">ความเสี่ยงปานกลาง</option><option value="สูง">ความเสี่ยงสูง</option></select>
          </div>
          <NoticeList rows={rows.slice((cur - 1) * PAGE, cur * PAGE)} can={a.can} onView={a.onView} onEdit={a.onEdit} onCopy={a.onCopy} onDelete={a.onDelete}
            extra={(n) => n.status !== 'ตอบสนองแล้ว' ? <button type="button" aria-label={`ดำเนินการแล้ว ${n.title}`} onClick={() => { markDone(n.id); a.show('บันทึกว่าดำเนินการแล้ว') }} className="flex h-[30px] items-center gap-[4px] rounded-[8px] bg-[#17a673] px-[10px] text-[12px] font-medium whitespace-nowrap text-white hover:brightness-110"><Ic d={NI.check} s={13} w={2.4} />ดำเนินการแล้ว</button> : null}
            empty="ไม่พบรายการแจ้งเตือนตามเงื่อนไข" />
          <div className="flex items-center justify-between"><span className="text-[12px] font-light text-gray-30">{`ทั้งหมด ${rows.length} รายการ`}</span><Pagination page={cur} pageCount={pages} onChange={setPg} /></div>
        </section>
      </div>
      {a.modals}
    </div>
  )
}
