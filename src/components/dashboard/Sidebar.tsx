import { useState } from 'react'
import { NavLink } from 'react-router-dom'
import arrowDropDown from '../../assets/dashboard/arrow-drop-down.svg'
import iconSidebar from '../../assets/dashboard/icon-sidebar.svg'
import logoOss from '../../assets/dashboard/logo-oss.svg'
import iconCaretDown from '../../assets/dashboard/nav-caret-down.svg'
import navLine from '../../assets/dashboard/nav-line.svg'
import navLine2 from '../../assets/dashboard/nav-line-2.svg'
import { allMenuItem, latestMenu, mainMenu, pinnedMenu, torMenuItem, type NavItem as Item } from '../../data/navigation'

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
    'group/nav relative flex h-[47px] w-full items-center gap-[12px] rounded-[24px] py-[8px] text-[14px] leading-[normal] font-medium whitespace-nowrap transition-colors focus-visible:outline-2 focus-visible:outline-offset-[-2px] focus-visible:outline-blue-10'
  const layout = collapsed ? 'justify-center px-0' : 'pr-[12px] pl-[16px]'

  const content = (isActive: boolean) => (
    <>
      <img
        src={isActive && item.activeIcon ? item.activeIcon : item.icon}
        alt=""
        width={24}
        height={24}
        className={`size-[24px] shrink-0 ${isActive && !item.activeIcon ? 'brightness-0 invert' : ''}`}
      />
      <span className={`min-w-0 flex-1 truncate ${collapsed ? 'sr-only' : ''}`}>{item.label}</span>
      {item.badge != null &&
        (collapsed ? (
          <span className="absolute top-[8px] right-[14px] size-[8px] rounded-full bg-red ring-2 ring-shell" />
        ) : (
          <span className="flex size-[18px] shrink-0 items-center justify-center rounded-[10px] bg-red px-[2px] font-urbanist text-[11px] leading-[1.24] text-[#fbfbfc]">
            {item.badge}
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
      onClick={onNavigate}
      title={collapsed ? undefined : item.label}
      className={({ isActive }) =>
        `${base} ${layout} ${isActive ? 'bg-blue-00 text-white' : 'text-gray-20 hover:bg-white/5 hover:text-[#c9ced2]'}`
      }
    >
      {({ isActive }) => content(isActive)}
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
      className="flex h-[40px] w-full items-center gap-[10px] rounded-[8px] px-[24px] py-[8px] text-gray-nav hover:text-[#9aa3b5] focus-visible:outline-2 focus-visible:outline-blue-10"
    >
      {inner}
    </button>
  ) : (
    <div className="flex h-[40px] w-full items-center px-[24px] py-[8px] text-gray-20">{inner}</div>
  )
}

export default function Sidebar({ collapsed, onExpand, onNavigate }: Props) {
  const [pinnedOpen, setPinnedOpen] = useState(true)
  const listPad = collapsed ? 'px-0' : 'px-[12px]'

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
        <div className="flex shrink-0 items-center gap-[10px] border-b border-gray-30 px-[12px] py-[4px]">
          <div className="flex h-[58px] min-w-0 flex-1 items-center gap-[10px] pl-[2px]">
            <img src={logoOss} alt="CODI" width={56} height={56} className="size-[56px] shrink-0" />
            <span className="text-[16px] leading-[normal] font-semibold whitespace-nowrap text-white">CODI OSS</span>
          </div>
          <button
            type="button"
            aria-label="เลือกระบบ"
            className="flex shrink-0 rounded-[4px] p-px hover:bg-white/10 focus-visible:outline-2 focus-visible:outline-blue-10"
          >
            <img src={arrowDropDown} alt="" width={14} height={14} />
          </button>
        </div>
      )}

      <div className={`flex shrink-0 flex-col gap-[4px] ${listPad}`}>
        {mainMenu.map((item) => (
          <NavItem key={item.label} item={item} collapsed={collapsed} onNavigate={onNavigate} />
        ))}
      </div>

      <Divider src={navLine} />

      <div className="flex shrink-0 flex-col gap-[10px]">
        <SectionTitle label="Pinned" collapsed={collapsed} open={pinnedOpen} onToggle={() => setPinnedOpen((v) => !v)} />
        {(pinnedOpen || collapsed) && (
          <div className={`flex flex-col gap-[4px] ${listPad}`}>
            {pinnedMenu.map((item) => (
              <NavItem key={item.label} item={item} collapsed={collapsed} onNavigate={onNavigate} />
            ))}
          </div>
        )}
      </div>

      <Divider src={navLine2} />

      <div className="flex shrink-0 flex-col gap-[10px]">
        <SectionTitle label="Latest" collapsed={collapsed} />
        <div className={`flex flex-col gap-[4px] ${listPad}`}>
          {latestMenu.map((item) => (
            <NavItem key={item.label} item={item} collapsed={collapsed} onNavigate={onNavigate} />
          ))}
        </div>
      </div>

      <div className="flex shrink-0 flex-col gap-[10px]">
        <Divider src={navLine2} />
        <div className={listPad}>
          <NavItem item={allMenuItem} collapsed={collapsed} onNavigate={onNavigate} />
          <NavItem item={torMenuItem} collapsed={collapsed} onNavigate={onNavigate} />
        </div>
      </div>
    </nav>
  )
}
