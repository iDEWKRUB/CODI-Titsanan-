import { useMemo, useRef, useState } from 'react'
import { Link } from 'react-router-dom'
import { Crumbs, Ic, NI, NPersonaSwitch, NoticeList, Title, page } from '../components/notify/Parts'
import { useNoticeActions } from '../components/notify/useActions'
import Modal from '../components/ui/Modal'
import useDismiss from '../components/ui/useDismiss'
import { addDays, topics } from '../data/erpNotify'

const SHOW = 6

/** รายการแจ้งเตือนทั้งหมด — home of AI NOTIFICATION CENTER (book 3 §2.5.2.1, fig 2-145) */
export default function NotifyHomePage() {
  const a = useNoticeActions()
  const [all, setAll] = useState(false)
  const [menu, setMenu] = useState(false)
  const box = useRef<HTMLDivElement>(null)
  useDismiss(menu, box, () => setMenu(false))
  const sent = useMemo(() => a.all.filter((n) => n.status !== 'ตั้งเวลา').sort((x, y) => `${y.date} ${y.time}`.localeCompare(`${x.date} ${x.time}`)), [a.all])
  const today = addDays(0)
  const todayN = sent.filter((n) => n.date === today).length
  const cnt = (s: string) => sent.filter((n) => n.severity === s).length
  const open = sent.filter((n) => n.severity === 'สูง' && n.status !== 'ตอบสนองแล้ว')
  const sched = a.all.filter((n) => n.status === 'ตั้งเวลา').length

  const tiles = [
    { label: 'แจ้งเตือนวันนี้', v: todayN, sub: `ตั้งเวลาส่ง ${sched} รายการ`, icon: NI.bell, tone: 'bg-[#e8f1ff] text-[#2057c9]' },
    { label: 'แจ้งเตือนทั่วไป', v: cnt('ทั่วไป'), sub: 'ข้อมูลข่าวสารและการนัดหมาย', icon: NI.info, tone: 'bg-[#e9e7ff] text-[#5b44d6]' },
    { label: 'ความเสี่ยงระดับปานกลาง', v: cnt('ปานกลาง'), sub: 'ควรติดตามภายในสัปดาห์นี้', icon: NI.alert, tone: 'bg-[#fff1d6] text-[#a8650b]' },
    { label: 'ความเสี่ยงระดับสูง', v: cnt('สูง'), sub: `ยังไม่ดำเนินการ ${open.length} รายการ`, icon: NI.flame, tone: 'bg-[#ffe3e3] text-[#c13232]' },
  ]

  return (
    <div className={`${page} items-center`}>
      <div className="flex w-full max-w-[1100px] flex-col gap-[14px]">
        <Title right={<NPersonaSwitch />}>ศูนย์แจ้งเตือนอัจฉริยะ</Title>
        <Crumbs items={[{ label: 'หน้าแรก', to: '/notify' }, { label: 'Notification Center' }, { label: 'รายการแจ้งเตือนทั้งหมด' }]} />

        <p role="note" className="flex items-start gap-[10px] rounded-[12px] border border-[#cfd8ff] bg-gradient-to-r from-[#f3f1ff] to-[#eef5ff] px-[14px] py-[12px] text-[12px] leading-[1.6] text-blue-dark">
          <span className="mt-[2px] shrink-0 text-[#6a55e8]"><Ic d={NI.sparkle} s={16} /></span>
          <span><b className="font-semibold">AI สรุป (จำลอง):</b> {open.length ? <>พบเรื่องความเสี่ยงสูงที่ยังไม่ดำเนินการ {open.length} เรื่อง — {open.slice(0, 2).map((n) => n.title).join(' และ ')}</> : 'ไม่มีเรื่องความเสี่ยงสูงค้างดำเนินการ'} การแจ้งเตือนทั้งหมดรวบรวมจากทุกระบบ ERP ไว้ที่ส่วนกลางนี้</span>
        </p>

        <div className="grid grid-cols-4 gap-[12px] max-lg:grid-cols-2 max-sm:grid-cols-1" aria-label="สรุปการแจ้งเตือน">
          {tiles.map((t) => (
            <div key={t.label} className="flex items-center gap-[14px] rounded-[14px] border border-gray-line-2 bg-white p-[16px]">
              <span className={`flex size-[44px] shrink-0 items-center justify-center rounded-[12px] ${t.tone}`}><Ic d={t.icon} s={20} /></span>
              <span className="flex min-w-0 flex-col"><span className="text-[12px] font-light text-gray-30">{t.label}</span><span className="font-urbanist text-[22px] leading-[1.2] font-semibold text-blue-dark">{t.v}</span><span className="text-[11px] font-light text-gray-20">{t.sub}</span></span>
            </div>
          ))}
        </div>

        <section aria-label="รายการแจ้งเตือนล่าสุด" className="flex flex-col gap-[6px] rounded-[14px] border border-gray-line-2 bg-white p-[16px]">
          <div className="flex flex-wrap items-center gap-[10px]">
            <h2 className="min-w-0 flex-1 text-[15px] font-semibold">รายการแจ้งเตือนล่าสุด</h2>
            <div ref={box} className="relative">
              <button type="button" aria-haspopup="menu" aria-expanded={menu} onClick={() => setMenu(!menu)} className="flex h-[34px] items-center gap-[6px] rounded-[8px] bg-blue-00 px-[14px] text-[12px] font-medium text-white hover:brightness-110"><Ic d={NI.plus} s={15} w={2.2} />สร้างการแจ้งเตือน</button>
              {menu && (
                <ul role="menu" aria-label="เลือกประเภทการแจ้งเตือน" className="absolute right-0 z-20 mt-[6px] w-[270px] animate-[menu-in_120ms_ease-out] rounded-[12px] border border-gray-line-2 bg-white p-[6px] shadow-xl">
                  {topics.map((t) => <li key={t.key} role="none"><Link role="menuitem" to={`/notify/settings?topic=${t.key}`} className="flex flex-col rounded-[8px] px-[10px] py-[8px] hover:bg-blue-bg"><span className="text-[13px] font-medium">{t.label}</span><span className="text-[11px] font-light text-gray-20">{t.source}</span></Link></li>)}
                </ul>
              )}
            </div>
            <button type="button" onClick={() => setAll(true)} className="h-[34px] rounded-[8px] border border-blue-00 px-[14px] text-[12px] font-medium text-blue-00 hover:bg-blue-bg">ทั้งหมด ({a.all.length})</button>
          </div>
          <NoticeList rows={sent.slice(0, SHOW)} can={a.can} onView={a.onView} onEdit={a.onEdit} onCopy={a.onCopy} onDelete={a.onDelete} />
        </section>
      </div>

      <Modal open={all} onClose={() => setAll(false)} title="รายการแจ้งเตือนทั้งหมด" width="max-w-[860px]">
        <div className="max-h-[68vh] overflow-y-auto pr-[4px]"><NoticeList rows={[...a.all].sort((x, y) => `${y.date} ${y.time}`.localeCompare(`${x.date} ${x.time}`))} can={a.can} onView={(n) => { setAll(false); a.onView(n) }} onEdit={a.onEdit} onCopy={a.onCopy} onDelete={(n) => { setAll(false); a.onDelete(n) }} /></div>
      </Modal>
      {a.modals}
    </div>
  )
}
