import { useEffect, useMemo, useRef, useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import logo from '../assets/login/logo-codi.webp'
import { foundItems, lostItems, roomById, toCsv } from '../data/ams'

const RED = '#ff5a5a'
const NAVY = '#00357d'
const FOUND = 450

function Shell({ children }: { children: React.ReactNode }) {
  const navigate = useNavigate()
  return (
    <div className="flex min-h-dvh justify-center bg-[#eef3f8] max-sm:bg-white">
      <div className="flex min-h-dvh w-full max-w-[440px] flex-col bg-white shadow-[0_0_40px_rgba(0,53,125,0.12)]">
        <header className="flex items-center justify-between bg-blue-bg px-[22px] py-[14px]">
          <button type="button" aria-label="ออกจากแอป" onClick={() => navigate('/ams')} className="flex size-[36px] items-center justify-center rounded-[8px] text-blue-dark hover:bg-white/60">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M9 4H5v16h4M16 8l4 4-4 4M20 12H9" /></svg>
          </button>
          <span className="flex items-center gap-[8px]">
            <img src={logo} alt="" width={34} height={34} className="h-[34px] w-auto" />
            <b className="text-[15px] font-semibold text-blue-dark">CODI RFID</b>
          </span>
          <button type="button" aria-label="ตั้งค่า" className="flex size-[36px] items-center justify-center rounded-[8px] text-blue-dark hover:bg-white/60">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><circle cx="12" cy="12" r="3" /><path d="M19.4 15a1.7 1.7 0 0 0 .3 1.8l.1.1a2 2 0 1 1-2.8 2.8l-.1-.1a1.7 1.7 0 0 0-1.8-.3 1.7 1.7 0 0 0-1 1.5V21a2 2 0 1 1-4 0v-.1a1.7 1.7 0 0 0-1.1-1.5 1.7 1.7 0 0 0-1.8.3l-.1.1a2 2 0 1 1-2.8-2.8l.1-.1a1.7 1.7 0 0 0 .3-1.8 1.7 1.7 0 0 0-1.5-1H3a2 2 0 1 1 0-4h.1a1.7 1.7 0 0 0 1.5-1.1 1.7 1.7 0 0 0-.3-1.8l-.1-.1a2 2 0 1 1 2.8-2.8l.1.1a1.7 1.7 0 0 0 1.8.3H9a1.7 1.7 0 0 0 1-1.5V3a2 2 0 1 1 4 0v.1a1.7 1.7 0 0 0 1 1.5 1.7 1.7 0 0 0 1.8-.3l.1-.1a2 2 0 1 1 2.8 2.8l-.1.1a1.7 1.7 0 0 0-.3 1.8V9a1.7 1.7 0 0 0 1.5 1H21a2 2 0 1 1 0 4h-.1a1.7 1.7 0 0 0-1.5 1Z" /></svg>
          </button>
        </header>
        {children}
      </div>
    </div>
  )
}

function RoomBar({ name }: { name: string }) {
  return (
    <div className="mx-[22px] flex items-center gap-[10px] rounded-[10px] bg-blue-bg px-[16px] py-[14px] text-[17px] text-blue-dark">
      <svg width="22" height="22" viewBox="0 0 24 24" fill={NAVY} aria-hidden="true"><path d="M12 2a7 7 0 0 0-7 7c0 5.2 7 13 7 13s7-7.8 7-13a7 7 0 0 0-7-7Zm0 9.5A2.5 2.5 0 1 1 12 6.5a2.5 2.5 0 0 1 0 5Z" /></svg>
      {name}
    </div>
  )
}

function Title({ children, back }: { children: string; back: string }) {
  return (
    <div className="flex items-center gap-[12px] px-[22px] pt-[22px] pb-[14px]">
      <Link to={back} aria-label="ย้อนกลับ" className="flex size-[32px] items-center justify-center rounded-[8px] text-blue-dark hover:bg-blue-bg">
        <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="m15 5-7 7 7 7" /></svg>
      </Link>
      <h1 className="text-[20px] leading-[1.25] font-semibold text-blue-dark">{children}</h1>
    </div>
  )
}

function Ring({ found, total, done }: { found: number; total: number; done: boolean }) {
  const R = 158
  const C = 2 * Math.PI * R
  const frac = total ? found / total : 0
  return (
    <div className="relative mx-auto size-[340px] max-[400px]:size-[300px]" role="img" aria-label={`ตรวจพบแล้ว ${found} จาก ${total}`}>
      <svg viewBox="0 0 340 340" className="size-full -rotate-90">
        <circle cx="170" cy="170" r={R} fill="none" stroke="#dedee3" strokeWidth="20" />
        <circle cx="170" cy="170" r={R} fill="none" stroke={RED} strokeWidth="20" strokeLinecap="butt" strokeDasharray={`${C * frac} ${C}`} className={done ? '' : 'transition-[stroke-dasharray] duration-150'} />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center leading-none">
        <span className="text-[19px] font-medium text-gray-20">ตรวจพบแล้ว</span>
        <b className="font-urbanist text-[64px] font-bold" style={{ color: NAVY }}>{found}</b>
        <span className="text-[16px] text-gray-20">จาก</span>
        <b className="mt-[2px] font-urbanist text-[40px] font-bold" style={{ color: NAVY }}>{total}</b>
      </div>
    </div>
  )
}

/** CODI RFID mobile app: scan → done (Figma 350:24398, 360:24702, 360:24835) — 2.3.3.2 */
export function AmsScanPage() {
  const { room: rid } = useParams()
  const room = roomById(rid)
  const navigate = useNavigate()
  const [phase, setPhase] = useState<'idle' | 'scanning' | 'done'>('idle')
  const [found, setFound] = useState(0)
  const timer = useRef<number | undefined>(undefined)
  const target = Math.min(FOUND, room.count - 3)

  useEffect(() => {
    if (phase !== 'scanning') return
    timer.current = window.setInterval(() => {
      setFound((n) => {
        const next = Math.min(target, n + Math.ceil((target - n) / 14) + 2)
        if (next >= target) {
          window.clearInterval(timer.current)
          setPhase('done')
        }
        return next
      })
    }, 120)
    return () => window.clearInterval(timer.current)
  }, [phase, target])

  const heading = phase === 'idle' ? 'พร้อมสแกน' : phase === 'scanning' ? 'กำลังสแกน...' : 'สแกนเสร็จสิ้น'
  return (
    <Shell>
      <Title back="/ams">สแกนตรวจนับพัสดุ-ครุภัณฑ์</Title>
      <RoomBar name={room.name} />
      <div className="flex flex-1 flex-col items-center gap-[24px] px-[22px] pt-[34px] pb-[40px]">
        <p className="text-[24px] font-semibold text-gray-30" aria-live="polite">{heading}</p>
        <Ring found={found} total={room.count} done={phase === 'done'} />
        {phase === 'idle' && <button type="button" onClick={() => setPhase('scanning')} className="rounded-[10px] bg-blue-00 px-[40px] py-[12px] text-[16px] font-semibold text-white shadow-[0_6px_16px_rgba(0,133,249,0.35)] active:scale-[0.98]">เริ่มสแกน</button>}
        {phase === 'scanning' && <button type="button" onClick={() => { window.clearInterval(timer.current); setPhase('done') }} className="rounded-[10px] bg-[#d3d6da] px-[34px] py-[11px] text-[16px] font-semibold text-white hover:bg-[#c3c7cc]">หยุดสแกน</button>}
        {phase === 'done' && (
          <div className="flex flex-col items-center gap-[10px]">
            <button type="button" onClick={() => navigate(`/ams/app/${room.id}/result?found=${found}`)} className="rounded-[10px] bg-blue-00 px-[34px] py-[11px] text-[16px] font-semibold text-white shadow-[0_6px_16px_rgba(0,133,249,0.35)] active:scale-[0.98]">ดูผลลัพธ์</button>
            <button type="button" onClick={() => { setFound(0); setPhase('idle') }} className="text-[13px] text-gray-20 underline-offset-2 hover:underline">สแกนใหม่</button>
          </div>
        )}
      </div>
    </Shell>
  )
}

/** CODI RFID mobile app: result table, found / lost tabs + export (Figma 361:25798) — 2.3.3.3 */
export function AmsResultPage() {
  const { room: rid } = useParams()
  const room = roomById(rid)
  const [tab, setTab] = useState<'found' | 'lost'>('lost')
  const [shown, setShown] = useState(30)
  const all = useMemo(() => foundItems(Math.min(FOUND, room.count - 3)), [room.count])
  const rows = tab === 'lost' ? lostItems : all.slice(0, shown)

  const download = () => {
    const src = tab === 'lost' ? lostItems : all
    const blob = new Blob([toCsv(src)], { type: 'text/csv;charset=utf-8' })
    const a = document.createElement('a')
    a.href = URL.createObjectURL(blob)
    a.download = `${room.id}-${tab === 'lost' ? 'lost' : 'found'}.csv`
    a.click()
    URL.revokeObjectURL(a.href)
  }
  const tabCls = (on: boolean) => `flex-1 rounded-[10px] py-[13px] text-[15px] font-semibold transition-colors ${on ? 'bg-blue-00 text-white' : 'bg-gray-bg text-gray-10'}`
  return (
    <Shell>
      <Title back={`/ams/app/${room.id}`}>ผลลัพธ์การตรวจนับพัสดุ-ครุภัณฑ์</Title>
      <RoomBar name={room.name} />
      <div role="tablist" aria-label="ผลลัพธ์" className="mx-[22px] mt-[16px] flex gap-0 overflow-hidden rounded-[12px]">
        <button role="tab" aria-selected={tab === 'found'} type="button" onClick={() => setTab('found')} className={tabCls(tab === 'found')}>รายการที่ตรวจพบ</button>
        <button role="tab" aria-selected={tab === 'lost'} type="button" onClick={() => setTab('lost')} className={tabCls(tab === 'lost')}>รายการสูญหาย</button>
      </div>
      <div className="mx-[22px] mt-[14px] flex items-center justify-between gap-[8px]">
        <p className="text-[12px] text-gray-20">{tab === 'lost' ? `สูญหาย ${lostItems.length} ชิ้น` : `ตรวจพบ ${all.length} ชิ้น`}</p>
        <button type="button" onClick={download} className="rounded-[10px] bg-blue-00 px-[18px] py-[10px] text-[14px] font-semibold text-white active:scale-[0.98]">ส่งออกข้อมูล</button>
      </div>
      <div className="mx-[22px] mt-[14px] mb-[28px] overflow-x-auto rounded-[4px] border border-gray-line">
        <table className="w-full min-w-[320px] border-collapse text-left text-[11px]">
          <thead>
            <tr className="bg-gray-bg text-center font-bold text-black">
              {['ลำดับ', 'RFID Tag', 'ชื่อรายการพัสดุ', 'ประเภทพัสดุ', 'จำนวน (ชิ้น)'].map((h) => <th key={h} className="border border-gray-line px-[6px] py-[8px]">{h}</th>)}
            </tr>
          </thead>
          <tbody>
            {rows.map((r, i) => (
              <tr key={r.tag} className="align-middle">
                <td className="border border-gray-line px-[6px] py-[12px] text-center">{i + 1}</td>
                <td className="border border-gray-line px-[8px]">{r.tag}</td>
                <td className="border border-gray-line px-[8px]">{r.name}</td>
                <td className="border border-gray-line px-[8px]">{r.kind}</td>
                <td className="border border-gray-line px-[6px] text-center">{r.qty}</td>
              </tr>
            ))}
          </tbody>
        </table>
        {tab === 'found' && shown < all.length && <button type="button" onClick={() => setShown((n) => n + 30)} className="w-full bg-blue-bg py-[10px] text-[13px] font-medium text-blue-00">แสดงเพิ่ม ({all.length - shown} รายการ)</button>}
      </div>
    </Shell>
  )
}
