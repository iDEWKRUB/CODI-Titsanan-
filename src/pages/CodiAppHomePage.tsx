import { useEffect, useMemo, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import AppShell from '../components/app/AppShell'
import NewsReader from '../components/app/NewsReader'
import { aiSearch, iso, newsCats, sampleEvents, type CalEvent, type News } from '../data/codiApp'
import { occursOn } from '../data/meetings'
import { thDate } from '../data/erpProject'
import { addView, bumpQuick, isLive, quickCounts, useNews } from '../lib/codiAppStore'
import { useLoans } from '../lib/erpFinanceStore'
import { useInvs } from '../lib/erpFundingStore'
import { useMeetings } from '../lib/meetingStore'
import { aiHrLine } from '../lib/hrStore'

const Ic = ({ d, s = 18 }: { d: string; s?: number }) => <svg width={s} height={s} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d={d} /></svg>
const I = {
  doc: 'M7 3h7l4 4v14H7ZM14 3v4h4M10 12h5M10 16h5',
  people: 'M9 11a3 3 0 1 0 0-6 3 3 0 0 0 0 6ZM3 20c0-3 2.7-5 6-5s6 2 6 5M16 11a3 3 0 1 0-1-5.8M17 15c2.4.4 4 2.2 4 5',
  chart: 'M4 20V10M10 20V4M16 20v-7M22 20H2',
  money: 'M3 6h18v12H3ZM12 15a3 3 0 1 0 0-6 3 3 0 0 0 0 6ZM6 9v.01M18 15v.01',
  upload: 'M12 16V4M7 9l5-5 5 5M4 20h16',
  pie: 'M12 3a9 9 0 1 0 9 9h-9Z M15 3.5A9 9 0 0 1 20.5 9H15Z',
  flag: 'M6 21V4M6 5h11l-2 4 2 4H6',
  meet: 'M4 6h16v13H4ZM4 10h16M9 3v4M15 3v4',
  survey: 'M9 4h6v3H9ZM7 5H6a1 1 0 0 0-1 1v14h14V6a1 1 0 0 0-1-1h-1M9 14l2 2 4-4',
  map: 'M9 4 3 6v14l6-2 6 2 6-2V4l-6 2ZM9 4v14M15 6v14',
  book: 'M4 5a2 2 0 0 1 2-2h13v16H6a2 2 0 0 0-2 2ZM19 19v2H6',
  help: 'M12 21a9 9 0 1 0 0-18 9 9 0 0 0 0 18ZM9.5 9a2.5 2.5 0 1 1 3.5 2.3c-.6.3-1 .9-1 1.7M12 17h.01',
  box: 'M3 7l9-4 9 4-9 4ZM3 7v10l9 4 9-4V7M12 11v10',
  news: 'M4 5h13v14H6a2 2 0 0 1-2-2ZM17 9h3v8a2 2 0 0 1-2 2M8 9h5M8 13h5',
  tool: 'M14 6a4 4 0 0 0 5 5l-9 9a2 2 0 0 1-3-3Z',
  coin: 'M12 3c5 0 8 1.5 8 3.5S17 10 12 10 4 8.5 4 6.5 7 3 12 3ZM4 6.5v5C4 13.5 7 15 12 15s8-1.5 8-3.5v-5M4 11.5v5C4 18.5 7 20 12 20s8-1.5 8-3.5v-5',
}

/** ระบบที่ใช้บ่อย — a system with its most used functions as small tags (book 3 fig 2-2) */
const frequent = [
  { id: 'saraban', label: 'ระบบสารบรรณ', icon: I.doc, to: '/saraban', tags: [['หนังสือรับเข้า', '/saraban/receive/new'], ['หนังสือภายใน', '/saraban/internal/new']] },
  { id: 'hr', label: 'ระบบทรัพยากรบุคคล', icon: I.people, to: '/hr', tags: [['แจ้งลา', '/hr/leave'], ['เบิกสวัสดิการ', '/hr/welfare']] },
  { id: 'fund', label: 'ระบบบริหารกองทุน', icon: I.chart, to: '/funding', tags: [['ค้นหากองทุน', '/funding'], ['สรุปการลงทุน', '/funding/summary']] },
  { id: 'fin', label: 'ระบบการเงิน', icon: I.money, to: '/finance', tags: [['ยืมเงิน', '/finance/loan'], ['หักล้างเงินยืม', '/finance/clear']] },
  { id: 'plan', label: 'ระบบยุทธศาสตร์', icon: I.pie, to: '/strategic', tags: [['แผนประจำปี', '/strategic/plan']] },
]

type Cat = 'oss' | 'erp' | 'support'
const cats: { key: Cat; title: string; desc: string }[] = [
  { key: 'oss', title: 'ONE Stop Service', desc: 'สำรวจข้อมูล ประเมิน บริหารโครงการ' },
  { key: 'erp', title: 'Enterprise Resource Planning', desc: 'สารบรรณ งบประมาณและการเงิน บัญชี บุคคล' },
  { key: 'support', title: 'Support & IT Service', desc: 'จองห้องประชุม ครุภัณฑ์ ลงทะเบียนประชุม' },
]
const catSystems: Record<Cat, { label: string; icon: string; to?: string }[]> = {
  erp: [
    { label: 'ระบบงบประมาณและการเงิน', icon: I.money, to: '/finance' },
    { label: 'ระบบทรัพยากรบุคคล', icon: I.people, to: '/hr' },
    { label: 'ระบบสารบรรณ', icon: I.doc, to: '/saraban' },
    { label: 'ระบบยุทธศาสตร์องค์กร', icon: I.pie, to: '/strategic' },
    { label: 'ระบบบริหารกองทุน', icon: I.chart, to: '/funding' },
    { label: 'ระบบรายงานผลการดำเนินงาน', icon: I.flag, to: '/project' },
    { label: 'ระบบพัสดุ', icon: I.box, to: '/asset' },
    { label: 'ระบบนำเข้าเอกสาร', icon: I.upload, to: '/edoc' },
    { label: 'ระบบจองออนไลน์', icon: I.meet, to: '/booking' },
    { label: 'ระบบบริหารจัดการสัญญา', icon: I.doc, to: '/agreement' },
  ],
  oss: [
    { label: 'CODI OSS ภาพรวม', icon: I.chart, to: '/dashboard' },
    { label: 'ข้อมูลองค์กรชุมชน', icon: I.map, to: '/community/map' },
    { label: 'บริหารจัดการโครงการ', icon: I.flag, to: '/projects' },
    { label: 'พัฒนาผู้นำชุมชน', icon: I.people, to: '/leader' },
    { label: 'แบบสอบถาม e-Survey', icon: I.survey, to: '/survey' },
    { label: 'สินเชื่อ', icon: I.coin, to: '/loan/disbursement' },
  ],
  support: [
    { label: 'จัดการการประชุม e-Meeting', icon: I.meet, to: '/meeting' },
    { label: 'ตรวจนับพัสดุ AMS', icon: I.box, to: '/ams' },
    { label: 'คลังความรู้และห้องสมุด', icon: I.book, to: '/library' },
    { label: 'เว็บประชาสัมพันธ์', icon: I.news, to: '/news' },
    { label: 'แจ้งปัญหาการใช้งาน', icon: I.tool, to: '/support' },
    { label: 'คู่มือการใช้งาน', icon: I.help, to: '/manual' },
  ],
}

/** line-art illustrations of the three category cards (no emoji, no stock images) */
function Art({ k }: { k: Cat }) {
  const c = { s: '#0b2a5c', a: '#0085f9', o: '#ff8a3d', p: '#ffd2c2', f: '#ffffff' }
  return (
    <svg width="96" height="96" viewBox="0 0 96 96" aria-hidden="true" fill="none" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.2">
      <circle cx="48" cy="48" r="46" fill="#eef1f5" stroke="none" />
      {k === 'oss' && (
        <g>
          <rect x="50" y="22" width="24" height="34" rx="3" fill={c.f} stroke={c.s} />
          <path d="M55 30h14M55 37l3 3 5-6M55 46l3 3 5-6" stroke={c.a} />
          <circle cx="34" cy="34" r="8" fill={c.p} stroke={c.s} />
          <path d="M20 66c0-9 6-16 14-16s14 7 14 16Z" fill={c.o} stroke={c.s} />
          <circle cx="44" cy="58" r="9" fill={c.f} stroke={c.s} />
          <path d="M51 65l9 9" stroke={c.s} strokeWidth="4" />
        </g>
      )}
      {k === 'erp' && (
        <g>
          <rect x="20" y="24" width="56" height="38" rx="4" fill={c.f} stroke={c.s} />
          <path d="M40 62v8h16v-8M34 72h28" stroke={c.s} />
          <path d="M28 52l9-9 7 6 10-12 8 7" stroke={c.a} />
          <path d="M60 32h10M60 38h6" stroke={c.o} />
          <circle cx="30" cy="34" r="5" fill={c.p} stroke={c.s} />
        </g>
      )}
      {k === 'support' && (
        <g>
          <rect x="28" y="18" width="40" height="22" rx="2" fill={c.f} stroke={c.s} />
          <path d="M48 40v6M34 26h20M34 32h12" stroke={c.a} />
          <rect x="26" y="52" width="44" height="8" rx="2" fill={c.o} stroke={c.s} />
          <path d="M32 60v14M64 60v14M48 60v14" stroke={c.s} />
          <circle cx="22" cy="58" r="5" fill={c.p} stroke={c.s} />
          <circle cx="74" cy="58" r="5" fill={c.p} stroke={c.s} />
        </g>
      )}
    </svg>
  )
}

const days = ['อาทิตย์', 'จันทร์', 'อังคาร', 'พุธ', 'พฤหัสบดี', 'ศุกร์', 'เสาร์']
const monthsTh = ['มกราคม', 'กุมภาพันธ์', 'มีนาคม', 'เมษายน', 'พฤษภาคม', 'มิถุนายน', 'กรกฎาคม', 'สิงหาคม', 'กันยายน', 'ตุลาคม', 'พฤศจิกายน', 'ธันวาคม']

/** หน้าแรกของระบบ CODI APP (book 3 fig 2-2) — 2.1.1.2 : the hub every other system is reached from */
export default function CodiAppHomePage() {
  const navigate = useNavigate()
  const allNews = useNews()
  const meetings = useMeetings()
  const loans = useLoans()
  const invs = useInvs()
  const [q, setQ] = useState('')
  const [focus, setFocus] = useState(false)
  const [cat, setCat] = useState<Cat>('erp')
  const today = new Date()
  const [month, setMonth] = useState(new Date(today.getFullYear(), today.getMonth(), 1))
  const [sel, setSel] = useState(iso(today))
  const [ncat, setNcat] = useState('')
  const [slide, setSlide] = useState(0)
  const [reading, setReading] = useState<News>()
  const [, force] = useState(0)

  const hits = useMemo(() => aiSearch(q), [q])
  const live = useMemo(() => allNews.filter((n) => isLive(n)).sort((a, b) => (a.date < b.date ? 1 : -1)), [allNews])
  const featured = useMemo(() => [...live.filter((n) => n.cat === 'ประกาศสำคัญ'), ...live.filter((n) => n.cat !== 'ประกาศสำคัญ')].slice(0, 4), [live])
  const pr = live.filter((n) => (!ncat || n.cat === ncat) && !featured.slice(0, 1).some((f) => f.id === n.id)).slice(0, 3)
  const counts = quickCounts()
  const freq = [...frequent].sort((a, b) => (counts[b.id] ?? 0) - (counts[a.id] ?? 0))
  const go = (to: string, id?: string) => { if (id) { bumpQuick(id); force((n) => n + 1) } setFocus(false); navigate(to) }
  useEffect(() => {
    if (featured.length < 2) return
    const t = setInterval(() => setSlide((s) => (s + 1) % featured.length), 6000)
    return () => clearInterval(t)
  }, [featured.length])
  const cur = featured[slide % Math.max(1, featured.length)]

  // AI สรุป: one line per area, computed from the data of the other systems
  const ai = useMemo(() => {
    const waitLoan = loans.filter((l) => l.status === 'submitted').length
    const waitVerify = loans.filter((l) => l.status === 'approved').length
    const draftInv = invs.filter((i) => i.status === 'draft' && !i.rejected).length
    const imp = live.find((n) => n.cat === 'ประกาศสำคัญ')
    return [
      ['HR Summary', aiHrLine()],
      ['Finance', `คำขอยืมเงินรออนุมัติ ${waitLoan} รายการ · รอสำนักการเงินตรวจสอบ ${waitVerify} รายการ`],
      ['Funding', draftInv ? `รายการลงทุนรอผู้อำนวยการพิจารณา ${draftInv} รายการ` : 'ไม่มีรายการลงทุนค้างพิจารณา'],
      ['System', imp ? imp.title : `มีข่าวที่เผยแพร่ ${live.length} ข่าว`],
    ]
  }, [loans, invs, live])

  // calendar: month grid + e-Meeting meetings merged with sample organisation events
  const y = month.getFullYear(), m = month.getMonth()
  const first = new Date(y, m, 1).getDay()
  const dim = new Date(y, m + 1, 0).getDate()
  const cells = Array.from({ length: Math.ceil((first + dim) / 7) * 7 }, (_, i) => i - first + 1)
  const eventsOf = (date: string): CalEvent[] => [
    ...meetings.filter((mt) => !mt.draft && mt.status !== 'canceled' && occursOn(mt, date)).map((mt): CalEvent => ({ date, title: mt.title, kind: 'ประชุม', time: mt.allDay ? 'ทั้งวัน' : mt.start })),
    ...sampleEvents(y, m).filter((e) => e.date === date),
  ]
  const dateOf = (d: number) => iso(new Date(y, m, d))
  const monthEvents = Array.from({ length: dim }, (_, i) => dateOf(i + 1)).flatMap((d) => eventsOf(d))

  const hero = (
    <div className="mx-auto flex max-w-[720px] flex-col items-center text-center">
      <p className="text-[13px] font-semibold text-black">ระบบสารสนเทศเพื่อสนับสนุนการปฏิบัติงาน</p>
      <h1 className="mt-[4px] text-[28px] leading-[1.3] font-semibold text-blue-dark max-sm:text-[21px]">สถาบันพัฒนาองค์กรชุมชน (องค์การมหาชน)</h1>
      <p className="mt-[2px] text-[13px] font-medium text-blue-00">ชุมชนท้องถิ่นมีความเข้มแข็งสู่การจัดการตนเอง</p>
      <div className="relative mt-[22px] w-full">
        <div className="flex h-[54px] items-center gap-[10px] rounded-full border border-white bg-white/95 px-[16px] shadow-[0_8px_30px_rgba(0,50,140,0.15)]">
          <span className="flex size-[32px] shrink-0 items-center justify-center rounded-full bg-blue-bg text-blue-dark" title="ผู้ช่วย พอช. อัจฉริยะ">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><rect x="5" y="8" width="14" height="11" rx="3" /><path d="M12 4v4M9 13h.01M15 13h.01M10 16h4M3 12v3M21 12v3" /></svg>
          </span>
          <input
            aria-label="ผู้ช่วย พอช. อัจฉริยะ"
            role="combobox"
            aria-expanded={focus && !!q.trim()}
            placeholder="ค้นหาอะไรก็ได้ — ผู้ช่วย พอช. อัจฉริยะ เช่น ยืมเงิน กองทุน ลา ประชุม"
            value={q}
            onChange={(e) => setQ(e.target.value)}
            onFocus={() => setFocus(true)}
            onKeyDown={(e) => { if (e.key === 'Enter' && hits[0]) go(hits[0].to); if (e.key === 'Escape') setFocus(false) }}
            className="h-full min-w-0 flex-1 bg-transparent text-[14px] font-light outline-none placeholder:text-gray-20"
          />
          <button type="button" aria-label="ค้นหา" onClick={() => hits[0] && go(hits[0].to)} className="flex size-[34px] shrink-0 items-center justify-center rounded-full bg-[linear-gradient(135deg,#4f46e5,#0085f9)] text-white"><Ic d="M5 12h14M13 6l6 6-6 6" s={16} /></button>
        </div>
        {focus && q.trim() && (
          <div role="listbox" aria-label="ผลการค้นหาของผู้ช่วย" className="absolute top-[60px] right-0 left-0 z-30 overflow-hidden rounded-[16px] bg-white p-[8px] text-left shadow-[0_14px_40px_rgba(0,30,80,0.22)]">
            <p className="flex items-center gap-[6px] px-[10px] py-[6px] text-[12px] font-light text-gray-30"><span className="text-blue-00"><Ic d="M12 3l1.8 4.7L18.5 9.5l-4.7 1.8L12 16l-1.8-4.7L5.5 9.5l4.7-1.8Z" s={14} /></span>{hits.length ? `ผู้ช่วย พอช. พบ ${hits.length} หน้าที่เกี่ยวข้องกับ “${q.trim()}”` : `ไม่พบหน้าที่ตรงกับ “${q.trim()}” ลองคำว่า ยืมเงิน กองทุน สารบรรณ แผน หรือ ประชุม`}</p>
            {hits.map((h) => (
              <button key={h.to + h.label} type="button" role="option" aria-selected="false" onClick={() => go(h.to)} className="flex w-full items-center gap-[10px] rounded-[10px] px-[10px] py-[9px] text-left hover:bg-blue-bg">
                <span className="flex-1 text-[13px] font-medium">{h.label}</span>
                <span className="text-[11px] font-light text-gray-20">{h.group}</span>
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  )

  return (
    <AppShell hero={hero}>
      <div className="flex flex-col gap-[40px]">
        <section aria-label="เมนูระบบที่ใช้บ่อย" className="flex flex-col gap-[14px]">
          <h2 className="text-[17px] font-semibold">ระบบที่ใช้บ่อย</h2>
          <div className="grid grid-cols-5 gap-[14px] max-lg:grid-cols-3 max-sm:grid-cols-2">
            {freq.map((f) => (
              <div key={f.id} className="flex flex-col gap-[8px]">
                <button type="button" onClick={() => go(f.to, f.id)} className="flex h-[48px] items-center gap-[10px] rounded-[10px] border border-gray-line-2 bg-white px-[14px] text-left shadow-[0_2px_8px_rgba(0,40,120,0.06)] transition hover:border-blue-00 hover:shadow-md">
                  <span className="text-blue-dark"><Ic d={f.icon} s={20} /></span>
                  <span className="min-w-0 flex-1 truncate text-[13px] font-medium">{f.label}</span>
                </button>
                <div className="flex flex-wrap gap-[6px]">
                  {f.tags.map(([t, to]) => <button key={t} type="button" onClick={() => go(to, f.id)} className="rounded-full bg-[#e3ebf8] px-[10px] py-[2px] text-[11px] text-blue-dark hover:bg-blue-00 hover:text-white">{t}</button>)}
                </div>
              </div>
            ))}
          </div>
        </section>

        <section aria-label="ระบบสารสนเทศ" className="flex flex-col gap-[14px]">
          <h2 className="text-[17px] font-semibold">ระบบสารสนเทศ</h2>
          <div role="tablist" aria-label="หมวดระบบ" className="grid grid-cols-3 gap-[14px] max-md:grid-cols-1">
            {cats.map((c) => (
              <button key={c.key} type="button" role="tab" aria-selected={cat === c.key} onClick={() => setCat(c.key)} className={`relative flex flex-col items-center gap-[10px] rounded-[18px] border px-[16px] pt-[26px] pb-[22px] text-center transition ${cat === c.key ? 'border-[#9cc7f5] bg-[#f3f8ff] shadow-[0_8px_24px_rgba(0,70,160,0.12)]' : 'border-gray-line-2 bg-white hover:border-[#9cc7f5]'}`}>
                <Art k={c.key} />
                <span className="text-[15px] font-semibold text-black">{c.title}</span>
                <span className="text-[11px] font-light text-gray-20">{c.desc}</span>
                {cat === c.key && <span aria-hidden="true" className="absolute -bottom-[9px] left-1/2 size-[16px] -translate-x-1/2 rotate-45 border-r border-b border-[#9cc7f5] bg-[#f3f8ff]" />}
              </button>
            ))}
          </div>
          <div className="grid grid-cols-3 gap-[12px] rounded-[20px] bg-[linear-gradient(120deg,#dceafc,#f3f0fb_55%,#fde8e0)] p-[20px] max-md:grid-cols-2 max-sm:grid-cols-1">
            {catSystems[cat].map((s) => {
              const inner = <><span className="text-blue-dark"><Ic d={s.icon} s={22} /></span><span className="text-[13px] font-medium">{s.label}</span></>
              return s.to ? <Link key={s.label} to={s.to} className="flex h-[64px] items-center justify-center gap-[10px] rounded-[12px] bg-white/90 px-[12px] shadow-[0_2px_10px_rgba(0,40,120,0.08)] transition hover:bg-white hover:shadow-md">{inner}</Link> : <div key={s.label} aria-disabled="true" className="flex h-[64px] items-center justify-center gap-[10px] rounded-[12px] bg-white/60 px-[12px] text-gray-20 opacity-70">{inner}</div>
            })}
          </div>
        </section>

        <section aria-label="ปฏิทินกิจกรรม" className="flex flex-col gap-[14px]">
          <h2 className="text-[17px] font-semibold">ปฏิทินกิจกรรม</h2>
          <div className="grid grid-cols-[1fr_280px] gap-[16px] max-lg:grid-cols-1">
            <div className="rounded-[16px] bg-[#f6f8fb] p-[16px] max-sm:p-[8px]">
              <div className="mb-[12px] flex items-center justify-center gap-[18px]">
                <button type="button" aria-label="เดือนก่อนหน้า" onClick={() => setMonth(new Date(y, m - 1, 1))} className="flex size-[26px] items-center justify-center rounded-full bg-blue-dark text-white hover:brightness-125"><Ic d="M15 5l-7 7 7 7" s={13} /></button>
                <span className="min-w-[150px] text-center text-[17px] font-semibold" aria-live="polite">{`${monthsTh[m]} ${y + 543}`}</span>
                <button type="button" aria-label="เดือนถัดไป" onClick={() => setMonth(new Date(y, m + 1, 1))} className="flex size-[26px] items-center justify-center rounded-full bg-blue-dark text-white hover:brightness-125"><Ic d="M9 5l7 7-7 7" s={13} /></button>
              </div>
              <div className="grid grid-cols-7">
                {days.map((d) => <span key={d} className="px-[6px] pb-[8px] text-[11px] font-light text-gray-20 max-sm:text-[9px]">{d}</span>)}
                {cells.map((d, i) => {
                  if (d < 1 || d > dim) return <span key={i} className="min-h-[72px] border-t border-gray-line-2 max-sm:min-h-[52px]" />
                  const date = dateOf(d)
                  const ev = eventsOf(date)
                  const isToday = date === iso(today)
                  return (
                    <button key={i} type="button" aria-label={`${d} ${monthsTh[m]}${ev.length ? ` มี ${ev.length} กิจกรรม` : ''}`} aria-pressed={sel === date} onClick={() => setSel(date)} className={`flex min-h-[72px] min-w-0 flex-col items-start gap-[4px] border-t border-gray-line-2 px-[6px] py-[6px] text-left transition max-sm:min-h-[52px] ${sel === date ? 'bg-white shadow-[inset_0_0_0_2px_#0085f9]' : 'hover:bg-white'}`}>
                      <span className={`font-urbanist text-[12px] ${isToday ? 'flex size-[22px] items-center justify-center rounded-full bg-blue-00 font-semibold text-white' : ''}`}>{d}</span>
                      {ev.slice(0, 2).map((e, k) => <span key={k} className="w-full truncate rounded-full bg-blue-dark px-[6px] py-[1px] text-[9px] font-medium text-white max-sm:hidden">{e.title}</span>)}
                      {ev.length > 0 && <span className="hidden size-[5px] rounded-full bg-blue-00 max-sm:block" aria-hidden="true" />}
                    </button>
                  )
                })}
              </div>
            </div>
            <aside aria-label="รายการกิจกรรม" className="flex flex-col overflow-hidden rounded-[16px] bg-[#f6f8fb]">
              <p className="flex items-center justify-center gap-[8px] bg-blue-dark py-[10px] text-[13px] font-medium text-white"><Ic d={I.meet} s={15} />รายการกิจกรรม</p>
              <div className="flex max-h-[420px] flex-col gap-[8px] overflow-y-auto p-[12px]">
                {monthEvents.length ? monthEvents.map((e, i) => {
                  const dt = new Date(e.date + 'T00:00:00')
                  return (
                    <button key={i} type="button" onClick={() => setSel(e.date)} className={`flex flex-col gap-[4px] rounded-[12px] bg-white p-[10px] text-left shadow-[0_1px_4px_rgba(0,0,0,0.05)] ${sel === e.date ? 'ring-2 ring-blue-00' : ''}`}>
                      <span className="flex items-center gap-[8px] text-[12px] font-medium"><span className="flex size-[22px] items-center justify-center rounded-full bg-blue-dark font-urbanist text-[11px] text-white">{dt.getDate()}</span>{`วัน${days[dt.getDay()]}`}</span>
                      <span className="flex gap-[10px] text-[11px]"><span className="w-[52px] shrink-0 font-urbanist text-gray-20">{e.time ? `${e.time.slice(0, 5)} น.` : 'ทั้งวัน'}</span><span className="min-w-0 flex-1 font-medium">{e.title}</span></span>
                    </button>
                  )
                }) : <p className="py-[24px] text-center text-[12px] font-light text-gray-20">ไม่มีกิจกรรมในเดือนนี้</p>}
              </div>
              <Link to="/meeting" className="mt-auto px-[12px] pb-[12px] text-[12px] font-medium text-blue-00 hover:underline">เปิดปฏิทินการประชุม (e-Meeting) ›</Link>
            </aside>
          </div>
        </section>

        <section aria-label="AI สรุปข่าวสำคัญ" className="flex flex-col gap-[12px]">
          <h2 className="flex items-center gap-[8px] text-[17px] font-semibold text-blue-dark"><Ic d="M12 3l1.8 4.7L18.5 9.5l-4.7 1.8L12 16l-1.8-4.7L5.5 9.5l4.7-1.8ZM18 15l.8 2.2L21 18l-2.2.8L18 21l-.8-2.2L15 18l2.2-.8ZM5 3l.6 1.6L7 5l-1.4.5L5 7l-.6-1.5L3 5l1.4-.4Z" s={22} />AI สรุปข่าวสำคัญ</h2>
          <div className="flex flex-col gap-[8px] rounded-[14px] border border-gray-line-2 bg-white px-[18px] py-[14px]">
            {ai.map(([k, v]) => <p key={k} className="text-[12px] leading-[1.6] font-light text-gray-30"><b className="font-medium text-blue-00">{k}</b>{` : ${v}`}</p>)}
          </div>
        </section>

        <section aria-label="ข่าวสาร" className="grid grid-cols-[1fr_1.15fr] gap-[24px] max-lg:grid-cols-1">
          <div className="flex flex-col gap-[12px]">
            <h2 className="text-[17px] font-semibold">ข่าวสารสำคัญ</h2>
            {cur ? (
              <article className="relative h-[380px] overflow-hidden rounded-[18px] shadow-[0_10px_30px_rgba(0,30,80,0.18)]">
                <img src={cur.cover} alt="" className="absolute inset-0 size-full object-cover" />
                <span className="absolute inset-0 bg-[linear-gradient(180deg,rgba(0,0,0,0.05)_35%,rgba(0,0,0,0.78))]" aria-hidden="true" />
                <div className="absolute top-[14px] right-[14px] left-[14px] flex gap-[6px]" role="tablist" aria-label="ข่าวเด่น">
                  {featured.map((f, i) => <button key={f.id} type="button" role="tab" aria-selected={i === slide % featured.length} aria-label={`ข่าวเด่นที่ ${i + 1}`} onClick={() => setSlide(i)} className={`h-[3px] flex-1 rounded-full ${i === slide % featured.length ? 'bg-white' : 'bg-white/45'}`} />)}
                </div>
                <div className="absolute right-[18px] bottom-[18px] left-[18px] flex flex-col gap-[6px] text-white">
                  <span className="text-[11px] opacity-85">{thDate(cur.date)}</span>
                  <h3 className="line-clamp-2 text-[16px] leading-[1.45] font-semibold">{cur.title}</h3>
                  <div className="mt-[4px] flex items-center justify-between">
                    <span className="flex items-center gap-[6px] text-[11px] opacity-85"><Ic d="M2 12s4-7 10-7 10 7 10 7-4 7-10 7S2 12 2 12ZM12 9a3 3 0 1 0 0 6 3 3 0 0 0 0-6Z" s={14} />{`ผู้ชม ${cur.views.toLocaleString('en-US')}`}</span>
                    <button type="button" aria-label={`อ่านต่อ ${cur.title}`} onClick={() => { addView(cur.id); setReading(cur) }} className="rounded-full bg-white px-[18px] py-[6px] text-[12px] font-medium text-blue-dark hover:bg-blue-bg">อ่านต่อ →</button>
                  </div>
                </div>
              </article>
            ) : <p className="rounded-[18px] bg-gray-bg py-[60px] text-center text-[13px] text-gray-20">ยังไม่มีข่าวสำคัญ</p>}
          </div>
          <div className="flex flex-col gap-[12px]">
            <div className="flex flex-wrap items-center gap-[8px]">
              <h2 className="flex-1 text-[17px] font-semibold">ข่าวประชาสัมพันธ์</h2>
              <label className="flex h-[32px] items-center gap-[6px] rounded-full border border-blue-dark/40 px-[12px] text-[11px] text-blue-dark">
                <Ic d="M4 5h16l-6 7v6l-4 2v-8Z" s={13} />
                <select aria-label="ประเภทข่าว" value={ncat} onChange={(e) => setNcat(e.target.value)} className="cursor-pointer bg-transparent outline-none">
                  <option value="">ประเภทข่าว</option>
                  {newsCats.map((c) => <option key={c} value={c}>{c}</option>)}
                </select>
              </label>
              <Link to="/app/news" className="rounded-full bg-gray-bg px-[12px] py-[7px] text-[11px] text-gray-30 hover:bg-blue-bg">ดูทั้งหมด</Link>
            </div>
            <div className="flex flex-col gap-[14px]">
              {pr.map((n) => (
                <article key={n.id} className="flex gap-[14px]">
                  <img src={n.cover} alt="" loading="lazy" className="h-[96px] w-[128px] shrink-0 rounded-[10px] object-cover max-sm:h-[80px] max-sm:w-[100px]" />
                  <div className="flex min-w-0 flex-1 flex-col gap-[4px]">
                    <h3 className="line-clamp-2 text-[13px] leading-[1.45] font-semibold">{n.title}</h3>
                    <p className="line-clamp-1 text-[11px] font-light text-gray-20">{n.body.split('\n')[0].replace(/[#*_]/g, '')}</p>
                    <div className="mt-auto flex flex-wrap items-center gap-[10px]">
                      <span className="rounded-full bg-blue-dark px-[10px] py-[2px] text-[10px] text-white">{n.cat}</span>
                      <span className="flex items-center gap-[4px] text-[10px] text-gray-20"><Ic d="M2 12s4-7 10-7 10 7 10 7-4 7-10 7S2 12 2 12ZM12 9a3 3 0 1 0 0 6 3 3 0 0 0 0-6Z" s={12} />{`ผู้ชม ${n.views.toLocaleString('en-US')}`}</span>
                      <button type="button" aria-label={`อ่านต่อ ${n.title}`} onClick={() => { addView(n.id); setReading(n) }} className="ml-auto text-[11px] font-medium text-blue-dark hover:text-blue-00">อ่านต่อ ›</button>
                    </div>
                  </div>
                </article>
              ))}
              {!pr.length && <p className="py-[28px] text-center text-[13px] font-light text-gray-20">ไม่พบข่าวตามเงื่อนไข</p>}
            </div>
          </div>
        </section>
      </div>
      <NewsReader item={reading} onClose={() => setReading(undefined)} />
    </AppShell>
  )
}
