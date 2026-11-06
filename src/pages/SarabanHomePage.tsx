import { useMemo, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { ConfirmDialog, useToast } from '../components/leader/Parts'
import { Crumbs, DocPill, PersonaSwitch, Title, card, page } from '../components/saraban/Parts'
import { inTab, involves, isMyTurn, people, tabs, type SDoc, type Tab } from '../data/saraban'
import { copyDoc, deleteDraft, markCircularRead, useCirculars, useDocs, useMe } from '../lib/sarabanStore'

const I = ({ d }: { d: string }) => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <path d={d} />
  </svg>
)
const icons = {
  doc: 'M7 3h7l4 4v14H7ZM14 3v4h4M9.5 12h5M9.5 16h5',
  inbox: 'M4 13l2-8h12l2 8M4 13v6h16v-6M4 13h5l1 2h4l1-2h5',
  send: 'M4 12 20 4l-4 16-4-6Z M12 14l8-10',
  eye: 'M2 12s4-7 10-7 10 7 10 7-4 7-10 7S2 12 2 12Zm10 3a3 3 0 1 0 0-6 3 3 0 0 0 0 6Z',
  pen: 'M4 20h4l11-11-4-4L4 16Z',
  copy: 'M8 8h11v12H8ZM5 16V4h11',
  trash: 'M5 7h14M10 7V4h4v3M7 7l1 13h8l1-13',
  plus: 'M12 5v14M5 12h14',
  arrow: 'M5 12h14M13 6l6 6-6 6',
}

const tone = [
  { bg: 'bg-[#0885ff]', t: 'จำนวนหนังสือรับ สัปดาห์นี้' },
  { bg: 'bg-[#30b3a1]', t: 'จำนวนหนังสือส่ง สัปดาห์นี้' },
  { bg: 'bg-[#ffa32b]', t: 'เอกสารรอตรวจ สัปดาห์นี้' },
  { bg: 'bg-[#ff4783]', t: 'เอกสารเวียนที่ยังไม่ได้อ่าน สัปดาห์นี้' },
]

/** ภาพรวมสารบรรณ (book 3 fig 2-46) — 2.1.7.1 */
export default function SarabanHomePage() {
  const all = useDocs()
  const me = useMe()
  const circulars = useCirculars()
  const navigate = useNavigate()
  const [tab, setTab] = useState<Tab>('ทั้งหมด')
  const [del, setDel] = useState<SDoc | null>(null)
  const [toast, show] = useToast()

  const stats = useMemo(
    () => [
      all.filter((d) => d.kind === 'received' && d.week).length,
      all.filter((d) => d.kind === 'internal' && d.status !== 'draft' && d.week).length,
      all.filter((d) => d.status === 'review').length,
      circulars.filter((c) => !c.read).length,
    ],
    [all, circulars],
  )
  const mine = useMemo(() => all.filter((d) => involves(d, me)), [all, me])
  const rows = useMemo(() => mine.filter((d) => inTab(d, tab, me)), [mine, tab, me])
  const count = (t: Tab) => mine.filter((d) => inTab(d, t, me)).length
  const shown = rows.slice(0, 5)
  const act = 'flex size-[28px] items-center justify-center rounded-[6px] text-blue-00 transition-colors hover:bg-blue-bg focus-visible:outline-2 focus-visible:outline-blue-00 disabled:text-gray-10 disabled:hover:bg-transparent'

  return (
    <div className={page}>
      <Title right={<PersonaSwitch />}>ภาพรวมสารบรรณ</Title>
      <Crumbs items={[{ label: 'หน้าแรก', to: '/dashboard' }, { label: 'งานสารบรรณอิเล็กทรอนิกส์' }]} />

      <section aria-label="ภาพรวมสารบรรณ" className="flex flex-col gap-[10px] rounded-[12px] bg-[#dbe9fb] p-[20px] max-sm:p-[12px]">
        <p className="text-[12px] font-light text-gray-30">ข้อมูลล่าสุด : 25 พฤศจิกายน 2568, 2.00 PM</p>
        <div className="grid grid-cols-4 gap-[12px] max-xl:grid-cols-2 max-sm:grid-cols-1">
          {tone.map((s, i) => (
            <article key={s.t} className={`relative flex items-center gap-[12px] overflow-hidden rounded-[12px] p-[14px] text-white ${s.bg}`}>
              <span className="flex size-[44px] shrink-0 items-center justify-center rounded-[12px] bg-white/25"><I d={[icons.inbox, icons.send, icons.doc, icons.copy][i]} /></span>
              <p className="w-[104px] shrink-0 text-[12px] leading-[1.35] font-medium">{s.t}</p>
              <p className="ml-auto flex flex-col items-end leading-none"><b className="font-urbanist text-[24px] font-bold" aria-live="polite">{stats[i]}</b><span className="mt-[6px] text-[10px]">รายการ</span></p>
            </article>
          ))}
        </div>
      </section>

      <section aria-label="เมนูด่วน" className="rounded-[12px] bg-blue-bg p-[14px]">
        <h2 className="mb-[10px] text-[14px] font-semibold text-blue-dark">เมนูด่วน</h2>
        <div className="grid grid-cols-3 gap-[12px] max-md:grid-cols-1">
          {[
            { t: 'ลงทะเบียนหนังสือรับใหม่', to: '/saraban/receive/new' },
            { t: 'ออกเอกสารหนังสือภายใน', to: '/saraban/internal/new' },
            { t: 'ออกเอกสารหนังสือภายนอก', to: '/saraban/internal/new?kind=external' },
          ].map((m) => (
            <Link key={m.t} to={m.to} className="group flex flex-col gap-[10px] rounded-[10px] bg-white p-[14px] transition-shadow hover:shadow-[0_4px_14px_rgba(0,53,125,0.14)] focus-visible:outline-2 focus-visible:outline-blue-00">
              <span className="text-blue-00"><I d={icons.doc} /></span>
              <span className="text-[13px] font-semibold">{m.t}</span>
              <span className="flex items-center gap-[6px] text-[12px] font-medium text-blue-00">สร้าง <span className="transition-transform group-hover:translate-x-[3px]"><I d={icons.arrow} /></span></span>
            </Link>
          ))}
        </div>
      </section>

      <div className="grid grid-cols-[minmax(0,1fr)_300px] items-start gap-[12px] max-lg:grid-cols-1">
        <section aria-label="เอกสารของฉัน" className={`${card} overflow-hidden`}>
          <div className="flex items-center justify-between px-[18px] pt-[16px]">
            <h2 className="text-[15px] font-semibold text-blue-dark">เอกสารของฉัน</h2>
            <Link to="/saraban/docs" className="flex items-center gap-[6px] rounded-full bg-blue-00 py-[3px] pr-[4px] pl-[12px] text-[11px] font-medium text-white hover:brightness-110">ทั้งหมด <span className="flex size-[18px] items-center justify-center rounded-full bg-white/25">›</span></Link>
          </div>
          <div role="tablist" aria-label="กรองตามสถานะ" className="mx-[14px] mt-[10px] flex gap-[2px] overflow-x-auto rounded-[8px] bg-blue-bg p-[3px]">
            {tabs.map((t) => (
              <button key={t} type="button" role="tab" aria-selected={tab === t} onClick={() => setTab(t)} className={`flex shrink-0 items-center gap-[6px] rounded-[6px] px-[12px] py-[6px] text-[12px] whitespace-nowrap transition-colors ${tab === t ? 'bg-blue-00 font-medium text-white' : 'text-blue-00 hover:bg-white/70'}`}>
                {t}
                <span className={`rounded-full px-[6px] font-urbanist text-[10px] ${tab === t ? 'bg-white/25' : 'bg-white'}`}>{count(t)}</span>
              </button>
            ))}
          </div>
          <div className="overflow-x-auto">
            <table className="mt-[8px] w-full min-w-[720px] text-left">
              <thead>
                <tr className="text-[10px] font-light text-gray-20">
                  {['วันที่สร้าง', 'เลขที่เอกสาร', 'ชื่อเรื่อง', 'วันที่ปรากฏในระบบ', 'สถานะ', ''].map((h) => <th key={h} className="px-[14px] py-[8px] font-light">{h}</th>)}
                </tr>
              </thead>
              <tbody>
                {shown.map((d) => (
                  <tr key={d.id} className="cursor-pointer border-t border-gray-line-2 text-[12px] font-light transition-colors hover:bg-blue-bg/50" onClick={() => navigate(`/saraban/docs/${d.id}`)}>
                    <td className="px-[14px] py-[12px] whitespace-nowrap">{d.createdAt.slice(0, 10)}<br /><span className="text-[10px] text-gray-20">{d.createdAt.slice(11)}</span></td>
                    <td className="px-[14px] font-urbanist whitespace-nowrap">{d.issuedNo ?? d.refNo}</td>
                    <td className="max-w-[260px] px-[14px] font-normal"><span className="line-clamp-2">{d.title}</span></td>
                    <td className="px-[14px] whitespace-nowrap">{d.createdAt.slice(0, 10)}<br /><span className="text-[10px] text-gray-20">{d.createdAt.slice(11)}</span></td>
                    <td className="px-[14px]"><DocPill d={d} me={me} /></td>
                    <td className="px-[10px] whitespace-nowrap" onClick={(e) => e.stopPropagation()}>
                      <span className="flex gap-[2px]">
                        <Link to={`/saraban/docs/${d.id}`} aria-label={`ดู ${d.title}`} className={act}><I d={icons.eye} /></Link>
                        <button type="button" aria-label={`แก้ไข ${d.title}`} disabled={!(d.creator === me && (d.status === 'draft' || d.status === 'returned') && d.kind === 'internal')} onClick={() => navigate(`/saraban/internal/new?edit=${d.id}`)} className={act}><I d={icons.pen} /></button>
                        <button type="button" aria-label={`คัดลอก ${d.title}`} onClick={() => { const id = copyDoc(d); show(`คัดลอกเป็นร่าง D-${String(id).padStart(3, '0')} แล้ว`) }} className={act}><I d={icons.copy} /></button>
                        <button type="button" aria-label={`ลบ ${d.title}`} disabled={d.status !== 'draft' || d.creator !== me} onClick={() => setDel(d)} className={act}><I d={icons.trash} /></button>
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            {shown.length === 0 && <p className="py-[36px] text-center text-[13px] font-light text-gray-20">ไม่มีเอกสารในหมวด “{tab}” สำหรับ {people[me].short}</p>}
          </div>
          {rows.length > 5 && <p className="border-t border-gray-line-2 px-[18px] py-[8px] text-[11px] font-light text-gray-20">แสดง 5 จาก {rows.length} รายการ · <Link to="/saraban/docs" className="text-blue-00 hover:underline">ดูทั้งหมด</Link></p>}
        </section>

        <aside aria-label="หนังสือเวียน / แจ้งเวียน" className={`${card} p-[16px]`}>
          <h2 className="text-[15px] font-semibold text-blue-dark">หนังสือเวียน / แจ้งเวียน</h2>
          <ul className="mt-[6px]">
            {circulars.slice(0, 5).map((c) => (
              <li key={c.id} className="border-b border-gray-line-2 last:border-b-0">
                <button type="button" onClick={() => markCircularRead(c.id)} className="flex w-full items-start gap-[8px] py-[10px] text-left focus-visible:outline-2 focus-visible:outline-blue-00">
                  <span aria-hidden="true" className={`mt-[6px] size-[7px] shrink-0 rounded-full ${c.read ? 'bg-transparent' : 'bg-[#ff4783]'}`} />
                  <span className="min-w-0">
                    <span className={`block text-[11px] leading-[1.6] ${c.read ? 'font-light' : 'font-semibold'}`}>{c.title}</span>
                    <span className="text-[10px] font-light text-gray-20">{c.at}</span>
                  </span>
                </button>
              </li>
            ))}
          </ul>
        </aside>
      </div>

      <ConfirmDialog open={!!del} title="ลบเอกสารร่าง" text={<>ลบ “{del?.title}” ออกจากระบบ? เอกสารที่ส่งแล้วลบไม่ได้</>} confirm="ลบ" danger onClose={() => setDel(null)} onConfirm={() => { if (del) { deleteDraft(del.id); show('ลบเอกสารร่างแล้ว') } setDel(null) }} />
      {toast}
    </div>
  )
}
export { isMyTurn }
