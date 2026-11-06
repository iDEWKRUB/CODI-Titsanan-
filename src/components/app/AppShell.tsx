import { useEffect, useRef, useState, type ReactNode } from 'react'
import { Link, NavLink, useNavigate } from 'react-router-dom'
import logo from '../../assets/login/logo-codi.webp'
import { logout } from '../../lib/auth'
import { toneOf, useActingUser } from '../../lib/actingUser'
import { useAppRole } from '../../lib/codiAppStore'
import { useUnreadCount } from '../../lib/notifStore'

const nav = [
  { to: '/app', label: 'หน้าแรก', end: true },
  { to: '/app/news', label: 'ข่าวสาร', end: true },
  { to: '/notifications', label: 'ศูนย์แจ้งเตือน' },
  { to: '/app/contact', label: 'ติดต่อเรา' },
]
const Ic = ({ d, s = 18 }: { d: string; s?: number }) => <svg width={s} height={s} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d={d} /></svg>

function Brand({ light }: { light?: boolean }) {
  return (
    <Link to="/app" className="flex shrink-0 items-center gap-[10px]" aria-label="CODI APP หน้าแรก">
      <img src={logo} alt="" width={46} height={46} className="size-[46px] object-contain" />
      <span className="flex flex-col leading-[1.05] max-sm:hidden">
        <b className={`text-[15px] font-semibold ${light ? 'text-white' : 'text-blue-dark'}`}>CODI APP</b>
        <span className={`font-urbanist text-[7.5px] font-semibold tracking-[0.04em] uppercase ${light ? 'text-white/70' : 'text-blue-dark/70'}`}>Community Organizations<br />Development Institute</span>
      </span>
    </Link>
  )
}

function Header() {
  const unread = useUnreadCount()
  const role = useAppRole()
  const me = useActingUser()
  const [bg, fg] = toneOf(me.name, me.isSelf)
  const navigate = useNavigate()
  const [open, setOpen] = useState(false)
  const box = useRef<HTMLDivElement>(null)
  useEffect(() => {
    if (!open) return
    const h = (e: MouseEvent) => { if (!box.current?.contains(e.target as Node)) setOpen(false) }
    document.addEventListener('mousedown', h)
    return () => document.removeEventListener('mousedown', h)
  }, [open])
  const link = ({ isActive }: { isActive: boolean }) => `relative px-[4px] py-[6px] text-[13px] whitespace-nowrap transition-colors after:absolute after:right-[4px] after:bottom-0 after:left-[4px] after:h-[2px] after:rounded-full ${isActive ? 'font-semibold text-blue-dark after:bg-blue-00' : 'font-normal text-gray-30 after:bg-transparent hover:text-blue-00'}`
  return (
    <header className="relative z-40 mx-auto flex h-[76px] w-full max-w-[1200px] items-center gap-[16px] px-[24px] max-md:px-[12px]">
      <Brand />
      <nav aria-label="เมนูหลัก" className="mx-auto flex min-w-0 items-center gap-[22px] overflow-x-auto max-md:gap-[12px]">
        {nav.map((n) => <NavLink key={n.to} to={n.to} end={n.end} className={link}>{n.label}</NavLink>)}
        {role === 'admin' && <NavLink to="/app/news/manage" className={link}>จัดการข่าวสาร</NavLink>}
      </nav>
      <Link to="/notifications" aria-label={`ศูนย์แจ้งเตือน${unread ? ` (ใหม่ ${unread})` : ''}`} className="relative flex size-[38px] shrink-0 items-center justify-center rounded-full bg-white text-blue-dark shadow-[0_2px_10px_rgba(0,40,120,0.12)] hover:text-blue-00">
        <Ic d="M6 9a6 6 0 0 1 12 0c0 6 2 7 2 7H4s2-1 2-7ZM10 20a2 2 0 0 0 4 0" />
        {unread > 0 && <span className="absolute top-[8px] right-[9px] size-[8px] rounded-full bg-[#ff434e] ring-2 ring-white" aria-hidden="true" />}
      </Link>
      <div ref={box} className="relative shrink-0">
        <button type="button" aria-label="เมนูผู้ใช้งาน" aria-expanded={open} onClick={() => setOpen((v) => !v)} className="flex items-center gap-[8px] rounded-full bg-white py-[4px] pr-[10px] pl-[4px] shadow-[0_2px_10px_rgba(0,40,120,0.12)]">
          <span style={{ background: bg, color: fg }} className="flex size-[30px] items-center justify-center overflow-hidden rounded-full text-[11px] font-semibold">{me.photo ? <img src={me.photo} alt="" className="size-full object-cover" /> : me.initials}</span>
          <span className="flex flex-col text-left leading-[1.2] max-sm:hidden"><b className="text-[11px] font-semibold">{me.name.split(' ')[0]}</b><span className="text-[9px] font-light text-gray-20">{role === 'admin' ? 'ผู้ดูแลระบบ' : me.role}</span></span>
          <Ic d="M6 9l6 6 6-6" s={14} />
        </button>
        {open && (
          <div role="menu" className="absolute top-[46px] right-0 w-[200px] overflow-hidden rounded-[12px] border border-gray-line-2 bg-white p-[6px] shadow-[0_10px_30px_rgba(0,30,80,0.18)]">
            <Link role="menuitem" to="/profile" className="block rounded-[8px] px-[10px] py-[8px] text-[13px] hover:bg-blue-bg">โปรไฟล์และการตั้งค่า</Link>
            <Link role="menuitem" to="/hr" className="block rounded-[8px] px-[10px] py-[8px] text-[13px] hover:bg-blue-bg">ข้อมูลของฉัน (HR)</Link>
            <button role="menuitem" type="button" onClick={() => { logout(); navigate('/login', { replace: true }) }} className="block w-full rounded-[8px] px-[10px] py-[8px] text-left text-[13px] text-[#c13232] hover:bg-[#fff1f1]">ออกจากระบบ</button>
          </div>
        )}
      </div>
    </header>
  )
}

const social = [
  'M14 8h3V4h-3a4 4 0 0 0-4 4v2H7v4h3v8h4v-8h3l1-4h-4V8Z',
  'M4 12a8 8 0 1 1 3.3 6.5L4 20l1.5-3.3A8 8 0 0 1 4 12Z M9 10h6M9 14h4',
  'M3 8a3 3 0 0 1 3-3h12a3 3 0 0 1 3 3v8a3 3 0 0 1-3 3H6a3 3 0 0 1-3-3Z M10 9l5 3-5 3Z',
]

/** Frame of CODI APP (book 3 fig 2-2): the home page passes `hero` and gets the gradient head with the big logo; other pages get a slim head */
export default function AppShell({ children, hero }: { children: ReactNode; hero?: ReactNode }) {
  return (
    <div className="flex min-h-screen flex-col bg-white text-black">
      <div className={`relative overflow-hidden ${hero ? 'mx-auto w-full max-w-[1280px] rounded-b-[40px] max-md:rounded-b-[24px]' : ''} bg-[linear-gradient(180deg,#f4f8ff_0%,#dbe7fd_55%,#c3d5f6_100%)]`}>
        <span aria-hidden="true" className="pointer-events-none absolute -top-[120px] -right-[120px] size-[420px] rounded-full bg-[radial-gradient(circle,rgba(255,170,190,0.45),transparent_65%)]" />
        <span aria-hidden="true" className="pointer-events-none absolute -bottom-[160px] -left-[100px] size-[380px] rounded-full bg-[radial-gradient(circle,rgba(150,190,255,0.4),transparent_65%)]" />
        {hero && <img src={logo} alt="" aria-hidden="true" className="pointer-events-none absolute top-[56px] -right-[80px] h-[180px] w-[250px] object-cover object-top opacity-90 max-md:hidden" />}
        <Header />
        {hero && <div className="relative z-10 px-[24px] pt-[16px] pb-[56px] max-md:px-[12px] max-md:pb-[36px]">{hero}</div>}
      </div>
      <main className="mx-auto w-full max-w-[1200px] flex-1 px-[24px] py-[28px] max-md:px-[12px] max-md:py-[18px]">{children}</main>
      <footer className="mx-auto mt-[24px] w-full max-w-[1280px] rounded-t-[40px] bg-[#0b2a5c] text-white max-md:rounded-t-[24px]">
        <div className="mx-auto grid w-full max-w-[1100px] grid-cols-[1.5fr_1fr_1fr] gap-[28px] px-[24px] pt-[40px] pb-[28px] text-[12px] font-light text-white/80 max-md:grid-cols-1">
          <div className="flex flex-col gap-[6px]">
            <Brand light />
            <p className="mt-[10px] font-medium text-white">สถาบันพัฒนาองค์กรชุมชน (องค์การมหาชน)</p>
            <p className="font-medium text-white">Community Organizations Development Institute (CODI)</p>
            <p>912 ถนนนวมินทร์ แขวงนวมินทร์ เขตบึงกุ่ม กรุงเทพฯ 10240</p>
            <p className="flex items-center gap-[6px]"><Ic d="M3 6h18v12H3ZM3 7l9 6 9-6" s={14} />codi@codi.or.th</p>
          </div>
          <div className="flex flex-col gap-[6px]"><p className="mb-[4px] text-[13px] font-semibold text-white">ทางลัด</p>{[['/library', 'เว็บไซต์หลัก พอช.'], ['/manual', 'คู่มือการใช้งานระบบ'], ['/support', 'ศูนย์ช่วยเหลือ (Helpdesk)'], ['/menu', 'เมนูทั้งหมดของระบบงาน']].map(([to, l]) => <Link key={to} to={to} className="hover:text-white">{l}</Link>)}</div>
          <div className="flex flex-col gap-[6px]"><p className="mb-[4px] text-[13px] font-semibold text-white">เมนู</p>{[['/app/news', 'ข่าวสาร'], ['/notifications', 'ศูนย์แจ้งเตือน'], ['/app/contact', 'ติดต่อ IT Support / Admin'], ['/dashboard', 'CODI OSS']].map(([to, l]) => <Link key={to} to={to} className="hover:text-white">{l}</Link>)}</div>
        </div>
        <div className="mx-auto w-full max-w-[1100px] border-t border-white/15 px-[24px] py-[20px] text-center">
          <div className="mb-[10px] flex justify-center gap-[10px]">{social.map((d, i) => <span key={i} className="flex size-[30px] items-center justify-center rounded-full bg-white text-[#0b2a5c]"><Ic d={d} s={16} /></span>)}</div>
          <p className="text-[11px] font-light text-white/70">© 2568 สงวนลิขสิทธิ์ พ.ศ. 2558 ตามพระราชบัญญัติลิขสิทธิ์ 2537 สถาบันพัฒนาองค์กรชุมชน (องค์การมหาชน)</p>
          <p className="mt-[4px] text-[10px] font-light text-white/50">นโยบายเว็บไซต์ | นโยบายคุ้มครองข้อมูลส่วนบุคคล</p>
        </div>
      </footer>
    </div>
  )
}
