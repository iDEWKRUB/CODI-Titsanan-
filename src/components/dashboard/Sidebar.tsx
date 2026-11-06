import { Link, NavLink, useLocation } from 'react-router-dom'
import iconSidebar from '../../assets/dashboard/icon-sidebar.svg'
import iconCaretDown from '../../assets/dashboard/nav-caret-down.svg'
import navLine from '../../assets/dashboard/nav-line.svg'
import navLine2 from '../../assets/dashboard/nav-line-2.svg'
import { useUnreadCount } from '../../lib/notifStore'
import { usePins } from '../../lib/pinStore'
import { useSystem } from '../../lib/systemStore'
import SystemSwitcher from './SystemSwitcher'
import { allMenuItem, financeMain, fundingMain, hrMain, assetMain, edocMain, bookingMain, agreementMain, mainMenu, pinCatalogFor, projectMain, sarabanMain, strategicMain, type NavItem as Item } from '../../data/navigation'

type Props = {
  /** Icon-only rail (desktop). Ignored inside the mobile drawer. */
  collapsed: boolean
  onExpand?: () => void
  onNavigate?: () => void
}

function Divider({ src }: { src: string }) {
  return <img src={src} alt="" className="block h-px w-full shrink-0" />
}

function NavItem({ item, collapsed, onNavigate }: { item: Item; collapsed: boolean; onNavigate?: () => void }) {
  const base =
    'group/nav relative flex min-h-[47px] w-full items-center gap-[12px] rounded-[24px] py-[8px] text-[14px] leading-[normal] font-medium transition-colors focus-visible:outline-2 focus-visible:outline-offset-[-2px] focus-visible:outline-blue-10'
  const layout = collapsed ? 'justify-center px-0' : 'pr-[12px] pl-[16px]'
  const unread = useUnreadCount()
  const { search } = useLocation()
  const q = item.to.split('?')[1]
  const sameQuery = (on: boolean) => on && (q ? search.includes(q) : !(item.to === '/saraban/internal/new' && search.includes('kind=external')))
  // the notification centre shows how many documents are still NEW, same number as the bell and the page
  const badge = item.to === '/notifications' ? unread || undefined : item.badge

  const content = (isActive: boolean) => (
    <>
      <img
        src={isActive && item.activeIcon ? item.activeIcon : item.icon}
        alt=""
        width={24}
        height={24}
        className={`size-[24px] shrink-0 ${isActive && !item.activeIcon ? 'brightness-0 invert' : 'brightness-[1.8]'}`}
      />
      <span className={`min-w-0 flex-1 leading-[1.3] ${collapsed ? 'sr-only' : ''}`}>{item.label}</span>
      {badge != null &&
        (collapsed ? (
          <span className="absolute top-[8px] right-[14px] size-[8px] rounded-full bg-red ring-2 ring-shell" />
        ) : (
          <span className="flex size-[18px] shrink-0 items-center justify-center rounded-[10px] bg-red px-[2px] font-urbanist text-[11px] leading-[1.24] text-[#fbfbfc]">
            {badge}
          </span>
        ))}
      {collapsed && (
        <span className="pointer-events-none absolute top-1/2 left-[calc(100%+12px)] z-50 -translate-y-1/2 rounded-[8px] bg-[#111518] px-[10px] py-[6px] text-[12px] font-normal text-white opacity-0 shadow-lg transition-opacity group-hover/nav:opacity-100 group-focus-visible/nav:opacity-100">
          {item.label}
        </span>
      )}
    </>
  )

  return (
    <NavLink
      to={item.to}
      end={item.end}
      onClick={onNavigate}
      title={collapsed ? undefined : item.label}
      className={({ isActive }) =>
        `${base} ${layout} ${sameQuery(isActive) ? 'bg-blue-00 text-white' : 'text-[#d5dade] hover:bg-white/10 hover:text-white'}`
      }
    >
      {({ isActive }) => content(sameQuery(isActive))}
    </NavLink>
  )
}

function SectionTitle({
  label,
  collapsed,
  open,
  onToggle,
}: {
  label: string
  collapsed: boolean
  open?: boolean
  onToggle?: () => void
}) {
  if (collapsed) return null
  const inner = (
    <>
      <span className="flex-1 text-left text-[12px] leading-[normal] font-semibold">{label}</span>
      {onToggle && (
        <img
          src={iconCaretDown}
          alt=""
          width={14}
          height={14}
          className={`size-[14px] transition-transform ${open ? 'rotate-180' : ''}`}
        />
      )}
    </>
  )
  return onToggle ? (
    <button
      type="button"
      onClick={onToggle}
      aria-expanded={open}
      className="flex h-[40px] w-full items-center gap-[10px] rounded-[8px] px-[24px] py-[8px] text-[#aeb6c6] hover:text-white focus-visible:outline-2 focus-visible:outline-blue-10"
    >
      {inner}
    </button>
  ) : (
    <div className="flex h-[40px] w-full items-center px-[24px] py-[8px] text-[#aeb6c6]">{inner}</div>
  )
}

export default function Sidebar({ collapsed, onExpand, onNavigate }: Props) {
  const listPad = collapsed ? 'px-0' : 'px-[12px]'
  const system = useSystem()
  const isSaraban = system !== 'oss'
  const mainOf = { saraban: sarabanMain, strategic: strategicMain, project: projectMain, finance: financeMain, funding: fundingMain, hr: hrMain, asset: assetMain, edoc: edocMain, booking: bookingMain, agreement: agreementMain, agreementMain, oss: mainMenu }[system]
  const pins = usePins()
  const pinned = pins.map((to) => pinCatalogFor(system).find((p) => p.to === to)).filter((p): p is NonNullable<typeof p> => !!p)

  return (
    <nav
      aria-label="เมนูหลัก"
      className={`flex h-full flex-col gap-[12px] pt-[22px] pb-[26px] ${collapsed ? 'overflow-visible' : 'overflow-x-hidden overflow-y-auto scrollbar-none'}`}
    >
      {collapsed ? (
        // Rail: the toggle takes the logo's slot; the brand moves into the header (Figma OSS-Profile Setting)
        <div className="flex h-[67px] shrink-0 items-center justify-center border-b border-gray-30">
          <button
            type="button"
            onClick={onExpand}
            aria-label="ขยายเมนู"
            aria-expanded={false}
            className="flex size-[40px] items-center justify-center rounded-[8px] transition-colors hover:bg-white/10 focus-visible:outline-2 focus-visible:outline-blue-10"
          >
            <img src={iconSidebar} alt="" width={24} height={24} />
          </button>
        </div>
      ) : (
        <div className="flex h-[66px] shrink-0 items-center border-b border-gray-30 px-[14px]">
          <SystemSwitcher tone="dark" onNavigate={onNavigate} />
        </div>
      )}

      <div className={`flex shrink-0 flex-col gap-[4px] ${listPad}`}>
        {mainOf.map((item) => (
          <NavItem key={item.label} item={item} collapsed={collapsed} onNavigate={onNavigate} />
        ))}
      </div>

      <Divider src={navLine} />

      <div className="flex shrink-0 flex-col gap-[10px]">
        <SectionTitle label="ปักหมุดระบบที่ใช้งานประจำ" collapsed={collapsed} />
        <div className={`flex flex-col gap-[4px] ${listPad}`}>
          {pinned.map((p) => (
            <NavItem key={p.to} item={{ ...p, end: ['/funding', '/finance', '/project', '/strategic', '/saraban', '/hr', '/hr/payroll', '/hr/career', '/hr/evaluations', '/hr/certificate', '/asset', '/asset/repair', '/edoc', '/booking', '/agreement'].includes(p.to) }} collapsed={collapsed} onNavigate={onNavigate} />
          ))}
          {pinned.length === 0 && !collapsed && (
            <p className="px-[16px] py-[6px] text-[12px] leading-[1.6] font-light text-[#aeb6c6]">
              ยังไม่ได้ปักหมุดระบบ ปักหมุดได้ที่{' '}
              <Link to="/profile" onClick={onNavigate} className="text-white underline underline-offset-2">
                ตั้งค่าผู้ใช้งาน
              </Link>
            </p>
          )}
        </div>
      </div>

      <div className="flex shrink-0 flex-col gap-[10px]">
        <Divider src={navLine2} />
        <div className={listPad}>
          <NavItem item={isSaraban ? { ...allMenuItem, label: 'เลือกระบบทั้งหมด' } : allMenuItem} collapsed={collapsed} onNavigate={onNavigate} />
        </div>
      </div>
    </nav>
  )
}
