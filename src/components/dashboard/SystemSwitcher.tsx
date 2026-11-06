import { useCallback, useEffect, useRef, useState } from 'react'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import arrowDropDown from '../../assets/dashboard/arrow-drop-down.svg'
import logoColor from '../../assets/login/logo-codi.webp'
import logoOss from '../../assets/dashboard/logo-oss.svg'
import { systems } from '../../data/navigation'
import { setSystem, useSystem } from '../../lib/systemStore'
import useDismiss from '../ui/useDismiss'

/**
 * Logo + system name with a drop-down (book 3: "ERP SARABAN ▾"). Choosing a system swaps the whole shell:
 * brand name, sidebar menu and home page. Used in the sidebar (dark) and in the header (light, collapsed rail).
 */
export default function SystemSwitcher({ tone, onNavigate }: { tone: 'dark' | 'light'; onNavigate?: () => void }) {
  const system = useSystem()
  const navigate = useNavigate()
  const { pathname } = useLocation()
  const [open, setOpen] = useState(false)
  const [pos, setPos] = useState({ top: 0, left: 0 })
  const root = useRef<HTMLDivElement>(null)
  const btn = useRef<HTMLButtonElement>(null)
  const close = useCallback(() => setOpen(false), [])
  useDismiss(open, root, close)

  // opening a /saraban page directly (link, bookmark) puts the shell in the SARABAN system
  useEffect(() => {
    if (pathname.startsWith('/saraban')) setSystem('saraban')
    else if (pathname.startsWith('/strategic')) setSystem('strategic')
    else if (pathname === '/project' || pathname.startsWith('/project/')) setSystem('project')
    else if (pathname === '/finance' || pathname.startsWith('/finance/')) setSystem('finance')
    else if (pathname === '/funding' || pathname.startsWith('/funding/')) setSystem('funding')
    else if (pathname === '/hr' || pathname.startsWith('/hr/')) setSystem('hr')
    else if (pathname === '/agreement' || pathname.startsWith('/agreement/')) setSystem('agreement')
    else if (pathname === '/booking' || pathname.startsWith('/booking/')) setSystem('booking')
    else if (pathname === '/asset' || pathname.startsWith('/asset/')) setSystem('asset')
    else if (pathname === '/edoc' || pathname.startsWith('/edoc/')) setSystem('edoc')
    else if (pathname === '/dashboard') setSystem('oss')
  }, [pathname])

  const cur = systems.find((s) => s.key === system) ?? systems[0]
  const dark = tone === 'dark'
  const toggle = () => {
    const r = btn.current?.getBoundingClientRect()
    if (r) setPos({ top: r.bottom + 8, left: Math.max(8, Math.min(r.left - 190, window.innerWidth - 268)) })
    setOpen((v) => !v)
  }

  return (
    <div ref={root} className="relative flex min-w-0 items-center gap-[10px]">
      <Link to="/app" onClick={() => onNavigate?.()} aria-label="ไปหน้าแรก CODI APP" title="ไปหน้าแรก CODI APP" className={`shrink-0 rounded-[10px] transition-transform hover:scale-[1.04] focus-visible:outline-2 focus-visible:outline-offset-2 ${dark ? 'focus-visible:outline-white' : 'focus-visible:outline-blue-00'}`}>
        <img src={dark ? logoOss : logoColor} alt="" width={56} height={56} className="size-[56px] object-contain" />
      </Link>
      <span className={`text-[16px] leading-[normal] font-semibold whitespace-nowrap ${dark ? 'text-white' : 'text-black'}`}>{cur.name}</span>
      <button
        ref={btn}
        type="button"
        aria-label="เลือกระบบ"
        aria-haspopup="listbox"
        aria-expanded={open}
        onClick={toggle}
        className={`flex shrink-0 rounded-[4px] p-[3px] transition-colors focus-visible:outline-2 focus-visible:outline-blue-10 ${dark ? 'hover:bg-white/10' : 'hover:bg-gray-subtle'}`}
      >
        <img src={arrowDropDown} alt="" width={14} height={14} className={`transition-transform ${open ? 'rotate-180' : ''}`} />
      </button>
      {open && (
        <ul role="listbox" aria-label="เลือกระบบ" style={{ top: pos.top, left: pos.left }} className="fixed z-[70] w-[260px] animate-[menu-in_120ms_ease-out] overflow-hidden rounded-[12px] border border-gray-line-2 bg-white p-[6px] text-black shadow-[0_8px_28px_rgba(0,0,0,0.22)]">
          {systems.map((s) => (
            <li key={s.key}>
              <button
                type="button"
                role="option"
                aria-selected={s.key === system}
                onClick={() => {
                  setSystem(s.key)
                  setOpen(false)
                  navigate(s.home)
                  onNavigate?.()
                }}
                className={`flex w-full items-center gap-[10px] rounded-[8px] px-[10px] py-[9px] text-left transition-colors focus-visible:outline-2 focus-visible:outline-blue-00 ${s.key === system ? 'bg-blue-bg' : 'hover:bg-gray-bg'}`}
              >
                <span className="flex min-w-0 flex-1 flex-col">
                  <span className="text-[14px] font-semibold">{s.name}</span>
                  <span className="text-[11px] font-light text-gray-20">{s.desc}</span>
                </span>
                {s.key === system && <span className="text-[14px] font-semibold text-blue-00" aria-hidden="true">✓</span>}
              </button>
            </li>
          ))}
          <li className="mt-[4px] border-t border-gray-line-2 pt-[4px]">
            <button type="button" onClick={() => { setOpen(false); navigate('/app'); onNavigate?.() }} className="flex w-full items-center gap-[10px] rounded-[8px] px-[10px] py-[9px] text-left transition-colors hover:bg-gray-bg focus-visible:outline-2 focus-visible:outline-blue-00">
              <span className="flex min-w-0 flex-1 flex-col"><span className="text-[14px] font-semibold">CODI APP</span><span className="text-[11px] font-light text-gray-20">หน้าแรกพอร์ทัลและข่าวสาร</span></span>
            </button>
          </li>
        </ul>
      )}
    </div>
  )
}
