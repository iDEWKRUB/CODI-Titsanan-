import iconBell from '../assets/dashboard/nav-bell.svg'
import iconCalendarDots from '../assets/dashboard/nav-calendar-dots.svg'
import iconClipboardCheck from '../assets/dashboard/nav-clipboard-check.svg'
import iconGear from '../assets/dashboard/nav-gear.svg'
import iconHouseGray from '../assets/dashboard/nav-house-gray.svg'
import iconHouse from '../assets/dashboard/nav-house.svg'
import iconInfo from '../assets/dashboard/nav-info.svg'
import iconInvoice from '../assets/dashboard/nav-invoice.svg'
import iconManage from '../assets/dashboard/nav-manage.svg'
import iconMapPin from '../assets/dashboard/nav-map-pin.svg'
import iconNewspaper from '../assets/dashboard/nav-newspaper.svg'
import iconNote from '../assets/dashboard/nav-note.svg'
import iconNotePencil from '../assets/dashboard/nav-note-pencil.svg'
import iconSquaresFour from '../assets/dashboard/nav-squares-four.svg'

export type NavItem = {
  label: string
  to: string
  icon: string
  /** Icon to show on the blue active pill (defaults to `icon` inverted to white) */
  activeIcon?: string
  badge?: number
}

// Every sidebar menu has its own route. Pages not built yet render <ComingSoonPage />.
export const mainMenu: NavItem[] = [
  { label: 'หน้าแรก', to: '/dashboard', icon: iconHouseGray, activeIcon: iconHouse },
  { label: 'ข่าวและประกาศ', to: '/news', icon: iconNewspaper },
  { label: 'คู่มือการใช้งาน', to: '/manual', icon: iconNote },
  { label: 'ศูนย์แจ้งเตือน', to: '/notifications', icon: iconBell, badge: 15 },
  { label: 'แจ้งปัญหาการใช้งาน', to: '/support', icon: iconInfo },
]
export const pinnedMenu: NavItem[] = [
  { label: 'ยื่นคำขอจดทะเบียนสภาองค์กรชุมชน', to: '/council-registration', icon: iconNotePencil },
  { label: 'จัดการสถานการณ์โครงการ', to: '/project-status', icon: iconGear },
  { label: 'จัดการพื้นที่สำรวจ', to: '/survey', icon: iconMapPin },
  { label: 'จัดการการประชุม', to: '/meeting', icon: iconCalendarDots },
]
export const latestMenu: NavItem[] = [
  { label: 'บริหารจัดการโครงการ', to: '/projects', icon: iconManage },
  { label: 'เบิกจ่ายงบประมาณโครงการ', to: '/disbursement', icon: iconInvoice },
]
export const allMenuItem: NavItem = { label: 'All Menu', to: '/menu', icon: iconSquaresFour }

/** Internal TOR compliance page — always the last item in the sidebar */
export const torMenuItem: NavItem = { label: 'CODI TOR', to: '/tor', icon: iconClipboardCheck }
/** Sub-menu under TOR (order = sidebar order) */
export const torSubMenu = [
  { label: 'High Level', to: '/tor/high-level' },
  { label: 'Sitemap', to: '/tor/sitemap' },
  { label: 'แผนผังระบบจาก TOR', to: '/tor/system-map' },
  { label: 'TOR Compliance', to: '/tor/compliance' },
]
export const allNavItems = [...mainMenu, ...pinnedMenu, ...latestMenu, allMenuItem, torMenuItem]
