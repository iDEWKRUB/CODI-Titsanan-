import iconBell from '../../assets/dashboard/icon-bell.svg'
import iconSearch from '../../assets/dashboard/icon-search.svg'
import iconSidebar from '../../assets/dashboard/icon-sidebar.svg'
import iconSignOut from '../../assets/dashboard/icon-sign-out.svg'
import type { User } from '../../lib/auth'
import { useUnreadCount } from '../../lib/notifStore'
import { Link } from 'react-router-dom'
import SystemSwitcher from './SystemSwitcher'
import UserMenu from './UserMenu'

type Props = {
  user: User
  /** Desktop with the sidebar collapsed: the brand moves into the header and the toggle lives in the rail. */
  railMode: boolean
  sidebarExpanded: boolean
  onToggleSidebar: () => void
  onLogout: () => void
}

const iconButton =
  'flex shrink-0 items-center justify-center transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-00'

export default function Header({ user, railMode, sidebarExpanded, onToggleSidebar, onLogout }: Props) {
  const unread = useUnreadCount()
  return (
    <header className="relative z-20 flex h-[57px] items-center gap-[8px] px-[16px] sm:px-[24px]">
      <div className="flex min-w-0 flex-1 items-center gap-[8px]">
        {railMode ? (
          <div className="mr-[16px] shrink-0">
            <SystemSwitcher tone="light" />
          </div>
        ) : (
          <button
            type="button"
            onClick={onToggleSidebar}
            aria-label={sidebarExpanded ? 'ย่อเมนู' : 'ขยายเมนู'}
            aria-expanded={sidebarExpanded}
            className={`${iconButton} -mx-[6px] size-[36px] rounded-[8px] hover:bg-gray-subtle`}
          >
            <img src={iconSidebar} alt="" width={24} height={24} />
          </button>
        )}

        <label className="flex w-full max-w-[327px] min-w-0 items-center gap-[6px] rounded-[8px] border border-gray-line bg-gray-subtle px-[16px] py-[10px] transition-colors focus-within:border-blue-00 focus-within:bg-white max-sm:py-[8px]">
          <span className="sr-only">ค้นหา</span>
          <input
            type="search"
            placeholder="Search"
            className="min-w-0 flex-1 bg-transparent text-[12px] leading-[normal] font-light text-gray-30 outline-none placeholder:text-gray-20 [&::-webkit-search-cancel-button]:hidden"
          />
          <img src={iconSearch} alt="" width={18} height={18} className="shrink-0" />
        </label>
      </div>

      <div className="flex shrink-0 items-center gap-[12px]">
        <Link to="/notifications" aria-label={unread ? `การแจ้งเตือนใหม่ ${unread} รายการ` : 'การแจ้งเตือน ไม่มีรายการใหม่'} className={`${iconButton} relative rounded-[8px] bg-blue-tint p-[10px] hover:brightness-95`}>
          <img src={iconBell} alt="" width={18} height={18} />
          {unread > 0 && (
            <span className="absolute top-[6px] right-[6px] flex size-[14px] items-center justify-center p-[2px]">
              <span className="flex items-center justify-center rounded-[10px] bg-red px-[2px] font-urbanist text-[8px] leading-[1.3] text-[#fbfbfc]">{unread > 99 ? '99+' : unread}</span>
            </span>
          )}
        </Link>
        <UserMenu user={user} onLogout={onLogout} />
        <span aria-hidden="true" className="h-[20px] w-px bg-gray-line max-sm:hidden" />
        <button
          type="button"
          onClick={onLogout}
          aria-label="ออกจากระบบ"
          title="ออกจากระบบ"
          className={`${iconButton} rounded-[20px] p-[10px] hover:bg-gray-subtle`}
        >
          <img src={iconSignOut} alt="" width={18} height={18} />
        </button>
      </div>
    </header>
  )
}
