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

export type NavChild = {
  label: string
  to: string
  /** Match this path exactly (a group root such as /leader must not stay active on /leader/history) */
  end?: boolean
}

export type NavItem = {
  label: string
  to: string
  icon: string
  /** Icon to show on the blue active pill (defaults to `icon` inverted to white) */
  activeIcon?: string
  badge?: number
  /** match the path exactly (a home item must not stay active on its sub-pages) */
  end?: boolean
  /** sub-menu: the item becomes an expandable group */
  children?: NavChild[]
}

// Every sidebar menu has its own route. Pages not built yet render <ComingSoonPage />.
export const mainMenu: NavItem[] = [
  { label: 'หน้าแรก', to: '/dashboard', icon: iconHouseGray, activeIcon: iconHouse },
  { label: 'ข่าวและประกาศ', to: '/news', icon: iconNewspaper },
  { label: 'คู่มือการใช้งาน', to: '/manual', icon: iconNote },
  { label: 'ศูนย์แจ้งเตือน', to: '/notifications', icon: iconBell },
  { label: 'แจ้งปัญหาการใช้งาน', to: '/support', icon: iconInfo },
]
export const pinnedMenu: NavItem[] = [
  { label: 'ยื่นคำขอจดทะเบียนสภาองค์กรชุมชน', to: '/council-registration', icon: iconNotePencil },
  { label: 'จัดการสถานการณ์โครงการ', to: '/project-status', icon: iconGear },
  { label: 'จัดการพื้นที่สำรวจ', to: '/survey', icon: iconMapPin },
  { label: 'จัดการการประชุม', to: '/meeting', icon: iconCalendarDots },
  { label: 'แผนพัฒนาผู้นำชุมชน', to: '/leader', icon: iconNote },
  { label: 'ข้อมูลองค์กรชุมชน', to: '/community', icon: iconSquaresFour, children: [
      { label: 'แผนที่เชิงภูมิศาสตร์', to: '/community/map' },
      { label: 'พื้นที่สำรวจ ชุมชน', to: '/community/survey-area' },
    ],
  },
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
  { label: 'ขั้นตอน Deploy', to: '/tor/deploy' },
]
/**
 * CODI OSS menu tree, ordered and named as in TOR book 3 §2.2 (each screen's "เส้นทางการใช้งาน").
 * `ref` is the section number in the book.
 */
export type OssGroup = NavItem & { ref: string; children: NavChild[] }
export const ossMenu: OssGroup[] = [
  {
    ref: '2.2.2',
    label: 'งานจัดการข้อมูลองค์กรชุมชน',
    to: '/community',
    icon: iconSquaresFour,
    children: [
      { label: 'แผนที่เชิงภูมิศาสตร์', to: '/community/map' },
      { label: 'พื้นที่สำรวจ', to: '/community/survey-area' },
      { label: 'บุคคล', to: '/community/person' },
      { label: 'องค์กรชุมชน', to: '/community/org' },
      { label: 'สภาองค์กรชุมชน', to: '/community/council' },
      { label: 'สถานการณ์โครงการ', to: '/project-status' },
    ],
  },
  {
    ref: '2.2.3',
    label: 'งานบริหารโครงการ',
    to: '/projects',
    icon: iconManage,
    children: [
      { label: 'ข้อมูลโครงการ', to: '/projects', end: true },
      { label: 'ยื่นเสนอโครงการ', to: '/projects/propose' },
      { label: 'เบิกจ่ายงบประมาณโครงการ', to: '/disbursement' },
    ],
  },
  {
    ref: '2.2.4',
    label: 'งานพัฒนาผู้นำชุมชน',
    to: '/leader',
    icon: iconNote,
    children: [
      { label: 'แผนพัฒนาชุมชน', to: '/leader', end: true },
      { label: 'ประวัติการฝึกอบรม', to: '/leader/history' },
      { label: 'จัดทำแผนการอบรม', to: '/leader/plan/create' },
      { label: 'บันทึกการอบรมของหลักสูตร', to: '/leader/record' },
      { label: 'ออกใบรับรอง', to: '/leader/certificate' },
    ],
  },
  {
    ref: '2.2.5',
    label: 'งานการสำรวจทางอิเล็กทรอนิกส์ (e-Survey)',
    to: '/survey',
    icon: iconNotePencil,
    children: [
      { label: 'จัดการแบบสอบถาม', to: '/survey', end: true },
      { label: 'สร้างแบบสอบถาม', to: '/survey/create' },
    ],
  },
  {
    ref: '2.2.6',
    label: 'งานการประชุมผ่านสื่ออิเล็กทรอนิกส์ (e-Meeting)',
    to: '/meeting',
    icon: iconCalendarDots,
    children: [
      { label: 'จัดการการประชุม', to: '/meeting', end: true },
      { label: 'สร้างการประชุม', to: '/meeting/create' },
    ],
  },
]
/** ERP Strategic Plan Management (§2.1.2) */
export const strategicMenu: OssGroup[] = [
  {
    ref: '2.1.2',
    label: 'งานจัดการแผนยุทธศาสตร์องค์กร',
    to: '/strategic',
    icon: iconManage,
    children: [
      { label: 'ภาพรวมยุทธศาสตร์', to: '/strategic', end: true },
      { label: 'กำหนดยุทธศาสตร์องค์กร', to: '/strategic/strategy' },
      { label: 'จัดทำแผนประจำปี', to: '/strategic/plan' },
      { label: 'พิจารณาแผนประจำปี', to: '/strategic/review' },
      { label: 'ตั้งค่าความเสี่ยงตั้งต้น', to: '/strategic/risk/setup' },
      { label: 'รายงานความเสี่ยง', to: '/strategic/risk/report' },
    ],
  },
]

/** ERP Project progress report (§2.1.3) */
export const projectMenu: OssGroup[] = [
  {
    ref: '2.1.3',
    label: 'งานรายงานผลการดำเนินงาน',
    to: '/project',
    icon: iconManage,
    children: [
      { label: 'ภาพรวมผลการดำเนินงานตามแผน', to: '/project', end: true },
      { label: 'รายการผลการดำเนินงาน', to: '/project/records' },
      { label: 'รายงานผลการดำเนินงาน', to: '/project/report' },
      { label: 'แบบฟอร์มจัดทำโครงการ', to: '/project/form' },
      { label: 'พิจารณาโครงการ', to: '/project/review' },
      { label: 'สรุปความเห็นและสรุปผลการตรวจสอบโครงการ', to: '/project/summary' },
    ],
  },
]

/** ERP Finance — budget & finance (§2.1.4) */
export const financeMenu: OssGroup[] = [
  {
    ref: '2.1.4',
    label: 'งานงบประมาณและการเงิน',
    to: '/finance',
    icon: iconManage,
    children: [
      { label: 'ภาพรวมงบประมาณและการเงิน', to: '/finance', end: true },
      { label: 'สร้างคำขอยืมเงิน', to: '/finance/loan' },
      { label: 'อนุมัติยืมเงิน', to: '/finance/approve' },
      { label: 'ตรวจสอบเงินยืม', to: '/finance/verify' },
      { label: 'เอกสารหักล้างเงินยืมทดรองจ่าย', to: '/finance/clear' },
    ],
  },
]

/** ERP Funding — investment management (§2.1.5) */
export const fundingMenu: OssGroup[] = [
  {
    ref: '2.1.5',
    label: 'งานบริหารกองทุน',
    to: '/funding',
    icon: iconManage,
    children: [
      { label: 'ค้นหากองทุน/หุ้นกู้', to: '/funding', end: true },
      { label: 'เพิ่มกองทุน/หุ้นกู้', to: '/funding/add' },
      { label: 'สรุปการลงทุน', to: '/funding/summary' },
      { label: 'สรุปรายการลงทุน/หุ้นกู้', to: '/funding/list' },
      { label: 'รายงานการลงทุน', to: '/funding/report' },
    ],
  },
]

/** ERP HR — human resource management & development (§2.1.6) */
/** ERP ASSET — งานบริหารจัดการพัสดุ (§2.1.8) */
export const assetMenu: OssGroup[] = [
  {
    ref: '2.1.8',
    label: 'งานบริหารจัดการพัสดุ',
    to: '/asset',
    icon: iconManage,
    children: [
      { label: 'ทะเบียนพัสดุ-ครุภัณฑ์', to: '/asset', end: true },
      { label: 'นำเข้าพัสดุ ครุภัณฑ์', to: '/asset/import' },
      { label: 'ประกาศจัดซื้อจัดจ้าง', to: '/asset/procurement' },
      { label: 'รายการแจ้งซ่อม', to: '/asset/repair' },
      { label: 'แจ้งซ่อมครุภัณฑ์', to: '/asset/repair/new' },
    ],
  },
]
/** ERP DOCUMENT — งานนำเข้าเอกสาร e-Document Intelligence (§2.1.11) */
export const edocMenu: OssGroup[] = [
  {
    ref: '2.1.11',
    label: 'งานนำเข้าเอกสาร',
    to: '/edoc',
    icon: iconManage,
    children: [
      { label: 'คลังเอกสาร', to: '/edoc', end: true },
      { label: 'นำเข้าเอกสาร', to: '/edoc/upload' },
    ],
  },
]

/** ERP BOOKING — งานจองออนไลน์ (§2.1.10) */
export const bookingMenu: OssGroup[] = [
  {
    ref: '2.1.10',
    label: 'งานจองออนไลน์',
    to: '/booking',
    icon: iconManage,
    children: [
      { label: 'การจองของฉัน', to: '/booking', end: true },
      { label: 'จองห้องประชุม', to: '/booking/room' },
      { label: 'จอง Zoom Meeting', to: '/booking/zoom' },
      { label: 'จองยานพาหนะ', to: '/booking/vehicle' },
      { label: 'ยืมพัสดุ/ครุภัณฑ์', to: '/booking/borrow' },
    ],
  },
]

export const hrMenu: OssGroup[] = [
  {
    ref: '2.1.6',
    label: 'บริการตนเอง (เจ้าหน้าที่)',
    to: '/hr',
    icon: iconManage,
    children: [
      { label: 'ข้อมูลของฉัน', to: '/hr', end: true },
      { label: 'ขอหนังสือรับรองและหนังสือส่งตัว', to: '/hr/certificate' },
      { label: 'เบิกค่าอาหารทำการนอกเวลา', to: '/hr/overtime' },
      { label: 'เบิกสวัสดิการ', to: '/hr/welfare' },
      { label: 'แจ้งลา', to: '/hr/leave' },
      { label: 'เพิ่มรายการอบรม', to: '/hr/training/new' },
    ],
  },
  {
    ref: '2.1.6',
    label: 'งานสำนักทรัพยากรบุคคล',
    to: '/hr/evaluations',
    icon: iconManage,
    children: [
      { label: 'ลงนามหนังสือรับรอง', to: '/hr/certificate/sign' },
      { label: 'รายการแบบประเมิน', to: '/hr/evaluations' },
      { label: 'สร้างแบบประเมิน', to: '/hr/evaluations/new' },
      { label: 'เพิ่มพนักงานใหม่', to: '/hr/employees/new' },
      { label: 'จัดทำสายงานอาชีพ', to: '/hr/career' },
      { label: 'สร้างสายอาชีพ', to: '/hr/career/new' },
    ],
  },
  {
    ref: '2.1.6',
    label: 'เงินเดือน (สำนักการเงินและบัญชี)',
    to: '/hr/payroll',
    icon: iconManage,
    children: [
      { label: 'ทำจ่ายเงินเดือน', to: '/hr/payroll' },
      { label: 'สรุปการจ่ายเงินเดือน', to: '/hr/payroll/summary' },
    ],
  },
]

/** ERP e-Saraban (§2.1.7): the pages follow the sitemap order of book 3 */
export const erpMenu: OssGroup[] = [
  {
    ref: '2.1.7',
    label: 'งานสารบรรณอิเล็กทรอนิกส์ (e-Saraban)',
    to: '/saraban',
    icon: iconNote,
    children: [
      { label: 'ภาพรวมสารบรรณ', to: '/saraban', end: true },
      { label: 'ลงทะเบียนหนังสือรับใหม่และส่งต่อ', to: '/saraban/receive/new' },
      { label: 'ออกเอกสารหนังสือภายใน', to: '/saraban/internal/new' },
      { label: 'ออกเอกสารหนังสือภายนอก', to: '/saraban/internal/new?kind=external' },
      { label: 'เอกสารของฉัน', to: '/saraban/docs' },
    ],
  },
]

/** Other systems in the book (§2.3.2 loan, §2.3.3 AMS, §2.4.2 public web + library) */
export const otherMenu: OssGroup[] = [
  {
    ref: '2.3.2',
    label: 'งานสินเชื่อ',
    to: '/loan',
    icon: iconInvoice,
    children: [
      { label: 'เบิกจ่ายสินเชื่อ', to: '/loan/disbursement' },
      { label: 'ประวัติลูกหนี้', to: '/loan/debtors' },
    ],
  },
  {
    ref: '2.3.3',
    label: 'งานตรวจนับพัสดุ AMS',
    to: '/ams',
    icon: iconSquaresFour,
    children: [{ label: 'ภาพรวมพัสดุ-ครุภัณฑ์', to: '/ams', end: true }],
  },
  {
    ref: '2.4.2',
    label: 'เว็บประชาสัมพันธ์และห้องสมุด',
    to: '/library',
    icon: iconNewspaper,
    children: [
      { label: 'ข่าวประชาสัมพันธ์', to: '/news' },
      { label: 'ห้องสมุด', to: '/library' },
    ],
  },
]

/** Systems the logo drop-down switches between; every system has its own sidebar menu */
export const systems = [
  { key: 'oss' as const, name: 'CODI OSS', desc: 'ระบบให้บริการแบบครบวงจร', home: '/dashboard' },
  { key: 'saraban' as const, name: 'ERP SARABAN', desc: 'งานสารบรรณอิเล็กทรอนิกส์', home: '/saraban' },
  { key: 'strategic' as const, name: 'ERP STRATEGIC', desc: 'งานจัดการแผนยุทธศาสตร์องค์กร', home: '/strategic' },
  { key: 'project' as const, name: 'ERP PROJECT', desc: 'งานรายงานผลการดำเนินงาน', home: '/project' },
  { key: 'finance' as const, name: 'ERP FINANCE', desc: 'งานงบประมาณและการเงิน', home: '/finance' },
  { key: 'funding' as const, name: 'ERP FUNDING', desc: 'งานบริหารกองทุน', home: '/funding' },
  { key: 'hr' as const, name: 'ERP HR', desc: 'งานบริหารจัดการทรัพยากรบุคคล', home: '/hr' },
  { key: 'booking' as const, name: 'ERP BOOKING', desc: 'งานจองออนไลน์', home: '/booking' },
  { key: 'asset' as const, name: 'ERP ASSET', desc: 'งานบริหารจัดการพัสดุ', home: '/asset' },
  { key: 'edoc' as const, name: 'ERP DOCUMENT', desc: 'งานนำเข้าเอกสาร (e-Document)', home: '/edoc' },
]

/** ERP SARABAN sidebar (book 3 fig 2-46: หน้าแรก, เอกสารของฉัน, ศูนย์แจ้งเตือน, คู่มือ, แจ้งปัญหา) */
/** ERP STRATEGIC sidebar (book 3 §2.1.2): หน้าแรก + the shared items; every screen is reached through pins */
export const strategicMain: NavItem[] = [
  { label: 'หน้าแรก', to: '/strategic', icon: iconHouseGray, activeIcon: iconHouse, end: true },
  { label: 'ศูนย์แจ้งเตือน', to: '/notifications', icon: iconBell },
  { label: 'คู่มือการใช้งาน', to: '/manual', icon: iconNote },
  { label: 'แจ้งปัญหาการใช้งาน', to: '/support', icon: iconInfo },
]
/** ERP PROJECT (§2.1.3) — pins decide which screens appear on the left */
export const projectMain: NavItem[] = [
  { label: 'หน้าแรก', to: '/project', icon: iconHouseGray, activeIcon: iconHouse, end: true },
  { label: 'ศูนย์แจ้งเตือน', to: '/notifications', icon: iconBell },
  { label: 'คู่มือการใช้งาน', to: '/manual', icon: iconNote },
  { label: 'แจ้งปัญหาการใช้งาน', to: '/support', icon: iconInfo },
]
/** ERP FINANCE (§2.1.4) — pins decide which screens appear on the left */
export const financeMain: NavItem[] = [
  { label: 'หน้าแรก', to: '/finance', icon: iconHouseGray, activeIcon: iconHouse, end: true },
  { label: 'ศูนย์แจ้งเตือน', to: '/notifications', icon: iconBell },
  { label: 'คู่มือการใช้งาน', to: '/manual', icon: iconNote },
  { label: 'แจ้งปัญหาการใช้งาน', to: '/support', icon: iconInfo },
]
/** ERP FUNDING (§2.1.5) — pins decide which screens appear on the left */
export const fundingMain: NavItem[] = [
  { label: 'หน้าแรก', to: '/funding', icon: iconHouseGray, activeIcon: iconHouse, end: true },
  { label: 'ศูนย์แจ้งเตือน', to: '/notifications', icon: iconBell },
  { label: 'คู่มือการใช้งาน', to: '/manual', icon: iconNote },
  { label: 'แจ้งปัญหาการใช้งาน', to: '/support', icon: iconInfo },
]
/** ERP HR (§2.1.6) — pins decide which screens appear on the left */
export const assetMain: NavItem[] = [
  { label: 'ทะเบียนพัสดุ-ครุภัณฑ์', to: '/asset', icon: iconHouseGray, activeIcon: iconHouse, end: true },
  { label: 'ศูนย์แจ้งเตือน', to: '/notifications', icon: iconBell },
  { label: 'คู่มือการใช้งาน', to: '/manual', icon: iconNote },
  { label: 'แจ้งปัญหาการใช้งาน', to: '/support', icon: iconInfo },
]
export const edocMain: NavItem[] = [
  { label: 'คลังเอกสาร', to: '/edoc', icon: iconHouseGray, activeIcon: iconHouse, end: true },
  { label: 'ศูนย์แจ้งเตือน', to: '/notifications', icon: iconBell },
  { label: 'คู่มือการใช้งาน', to: '/manual', icon: iconNote },
  { label: 'แจ้งปัญหาการใช้งาน', to: '/support', icon: iconInfo },
]
export const bookingMain: NavItem[] = [
  { label: 'การจองของฉัน', to: '/booking', icon: iconHouseGray, activeIcon: iconHouse, end: true },
  { label: 'ศูนย์แจ้งเตือน', to: '/notifications', icon: iconBell },
  { label: 'คู่มือการใช้งาน', to: '/manual', icon: iconNote },
  { label: 'แจ้งปัญหาการใช้งาน', to: '/support', icon: iconInfo },
]
export const hrMain: NavItem[] = [
  { label: 'ข้อมูลของฉัน', to: '/hr', icon: iconHouseGray, activeIcon: iconHouse, end: true },
  { label: 'ศูนย์แจ้งเตือน', to: '/notifications', icon: iconBell },
  { label: 'คู่มือการใช้งาน', to: '/manual', icon: iconNote },
  { label: 'แจ้งปัญหาการใช้งาน', to: '/support', icon: iconInfo },
]
export const sarabanMain: NavItem[] = [
  { label: 'หน้าแรก', to: '/saraban', icon: iconHouseGray, activeIcon: iconHouse, end: true },
  { label: 'เอกสารของฉัน', to: '/saraban/docs', icon: iconNote },
  { label: 'ศูนย์แจ้งเตือน', to: '/notifications', icon: iconBell },
  { label: 'คู่มือการใช้งาน', to: '/manual', icon: iconNote },
  { label: 'แจ้งปัญหาการใช้งาน', to: '/support', icon: iconInfo },
]

/** Line icon (24px, same grey as the other nav icons) built from an SVG path — used for the pinned ERP menus so each one has its own symbol */
const line = (d: string) =>
  'data:image/svg+xml,' +
  encodeURIComponent(`<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#757D83" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><path d="${d}"/></svg>`)
const routeIcon: Record<string, string> = {
  '/strategic/strategy': line('M6 21V4M6 5h11l-2 4 2 4H6'),
  '/strategic/plan': line('M4 6h16v14H4ZM4 10h16M8 3v4M16 3v4M9 15l2 2 4-4'),
  '/strategic/review': line('M9 4h6v3H9ZM7 5H6a1 1 0 0 0-1 1v14h14V6a1 1 0 0 0-1-1h-1M9 14l2 2 4-4'),
  '/strategic/risk/setup': line('M12 3 5 6v5c0 4.5 3 8 7 10 4-2 7-5.5 7-10V6ZM12 9v4M12 16v.1'),
  '/strategic/risk/report': line('M6 3h9l4 4v14H6ZM14 3v5h5M9 17v-3M12 17v-5M15 17v-2'),
  '/project/records': line('M9 6h11M9 12h11M9 18h11M4 6l1 1 2-2M4 12l1 1 2-2M4 18l1 1 2-2'),
  '/project/report': line('M6 3h9l4 4v14H6ZM14 3v5h5M9 17v-3M12 17v-5M15 17v-2'),
  '/project/form': line('M5 20h4L20 9l-4-4L5 16ZM13 7l4 4'),
  '/project/review': line('M9 4h6v3H9ZM7 5H6a1 1 0 0 0-1 1v14h14V6a1 1 0 0 0-1-1h-1M9 14l2 2 4-4'),
  '/project/summary': line('M4 5h16v11H10l-4 4v-4H4ZM8 9h8M8 12h5'),
  '/finance/loan': line('M4 7h16v12H4ZM4 11h16M12 14v3M10.5 15.5h3'),
  '/finance/approve': line('M12 3 5 6v5c0 4.5 3 8 7 10 4-2 7-5.5 7-10V6ZM9 12l2 2 4-4'),
  '/finance/verify': line('M10 4a6 6 0 1 0 0 12 6 6 0 0 0 0-12ZM15 15l5 5M8 10l1.5 1.5L12.5 8'),
  '/finance/clear': line('M6 3h9l4 4v14H6ZM14 3v5h5M9 13l2 2 4-4M9 18h6'),
  '/funding': line('M10 4a6 6 0 1 0 0 12 6 6 0 0 0 0-12ZM15 15l5 5'),
  '/funding/add': line('M12 5v14M5 12h14M4 4h16v16H4Z'),
  '/funding/summary': line('M4 20V9M10 20V4M16 20v-8M22 20H2'),
  '/funding/list': line('M9 6h11M9 12h11M9 18h11M4 6h.01M4 12h.01M4 18h.01'),
  '/funding/report': line('M6 3h9l4 4v14H6ZM14 3v5h5M9 14l2 2 4-4'),
  '/hr/certificate': line('M7 3h7l4 4v14H7ZM14 3v4h4M10 13l2 2 4-4'),
  '/hr/overtime': line('M12 21a9 9 0 1 0 0-18 9 9 0 0 0 0 18ZM12 7v5l3 2'),
  '/hr/welfare': line('M12 21s-7-4.5-7-10a4 4 0 0 1 7-2.6A4 4 0 0 1 19 11c0 5.5-7 10-7 10Z'),
  '/hr/leave': line('M5 20V6a2 2 0 0 1 2-2h8l4 4v12ZM9 13h6M9 16h4'),
  '/hr/training/new': line('M3 8l9-4 9 4-9 4ZM7 10v5c0 1.5 2.5 3 5 3s5-1.5 5-3v-5'),
  '/hr/certificate/sign': line('M4 20h16M6 16l9-9 3 3-9 9H6ZM13 9l3 3'),
  '/hr/evaluations': line('M9 4h6v3H9ZM7 5H6a1 1 0 0 0-1 1v14h14V6a1 1 0 0 0-1-1h-1M9 14l2 2 4-4'),
  '/hr/evaluations/new': line('M12 5v14M5 12h14'),
  '/hr/employees/new': line('M9 11a3 3 0 1 0 0-6 3 3 0 0 0 0 6ZM3 20c0-3 2.7-5 6-5s6 2 6 5M19 8v6M16 11h6'),
  '/hr/career': line('M4 20V14h4v6M10 20V9h4v11M16 20V4h4v16'),
  '/hr/career/new': line('M5 12l5 5L20 7'),
  '/hr/payroll': line('M3 6h18v12H3ZM12 15a3 3 0 1 0 0-6 3 3 0 0 0 0 6Z'),
  '/booking/room': line('M4 21V5a1 1 0 0 1 1-1h9a1 1 0 0 1 1 1v16M15 9h4a1 1 0 0 1 1 1v11M3 21h18M8 8h3M8 12h3M8 16h3'),
  '/booking/zoom': line('M3 7a2 2 0 0 1 2-2h8a2 2 0 0 1 2 2v10a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2ZM15 10l6-3v10l-6-3'),
  '/booking/vehicle': line('M5 17h14M5 17a2 2 0 1 0 4 0M15 17a2 2 0 1 0 4 0M3 17v-5l2-5h12l3 5v5M3 12h17'),
  '/booking/borrow': line('M3 7l9-4 9 4-9 4ZM3 7v10l9 4 9-4V7M12 11v10'),
  '/asset/import': line('M3 7l9-4 9 4-9 4ZM3 7v10l9 4 9-4V7M12 11v10'),
  '/asset/procurement': line('M3 11v2a1 1 0 0 0 1 1h3l5 4V6L7 10H4a1 1 0 0 0-1 1ZM16 9a4 4 0 0 1 0 6'),
  '/asset/repair': line('M14.7 6.3a4 4 0 0 0-5.4 5.4L3 18l3 3 6.3-6.3a4 4 0 0 0 5.4-5.4l-2.6 2.6-2.4-.6-.6-2.4Z'),
  '/asset/repair/new': line('M12 5v14M5 12h14'),
  '/edoc/upload': line('M12 16V4M7 9l5-5 5 5M4 20h16'),
  '/hr/payroll/summary': line('M6 3h9l4 4v14H6ZM14 3v5h5M9 17v-3M12 17v-5M15 17v-2'),
  '/saraban/receive/new': line('M4 13l2-8h12l2 8M4 13v6h16v-6M4 13h5l1 2h4l1-2h5'),
  '/saraban/internal/new': line('M4 12 20 4l-4 16-4-6ZM12 14l8-10'),
  '/saraban/internal/new?kind=external': line('M3 7h18v10H3ZM3 8l9 6 9-6'),
  '/saraban/docs': line('M7 3h7l4 4v14H7ZM14 3v4h4M10 12h5M10 16h5'),
}
/** A menu the user can pin (profile page › ปักหมุดระบบที่ใช้งานประจำ) */
export type PinItem = { label: string; to: string; icon: string; group: string }
const pinLabel: Record<string, string> = { '/community/survey-area': 'จัดการพื้นที่สำรวจ', '/project-status': 'จัดการสถานการณ์โครงการ' }
const pinIcon: Record<string, string> = { '/community/survey-area': iconMapPin, '/project-status': iconGear }
export const pinCatalog: PinItem[] = [
  { label: 'ยื่นคำขอจดทะเบียนสภาองค์กรชุมชน', to: '/council-registration', icon: iconNotePencil, group: 'ทั่วไป' },
  ...[...ossMenu, ...otherMenu].flatMap((g) => g.children.map((c) => ({ label: pinLabel[c.to] ?? c.label, to: c.to, icon: pinIcon[c.to] ?? g.icon, group: g.label }))),
].filter((p, i, a) => a.findIndex((x) => x.to === p.to) === i)
/** Every ERP SARABAN screen can be pinned too (its own list, separate from OSS) */
export const sarabanPinCatalog: PinItem[] = [
  ...erpMenu.flatMap((g) => g.children.map((c) => ({ label: c.label, to: c.to, icon: routeIcon[c.to] ?? g.icon, group: g.label }))),
  { label: 'ศูนย์แจ้งเตือน', to: '/notifications', icon: iconBell, group: 'ทั่วไป' },
]
export const strategicPinCatalog: PinItem[] = [
  ...strategicMenu.flatMap((g) => g.children.map((c) => ({ label: c.label, to: c.to, icon: routeIcon[c.to] ?? g.icon, group: g.label }))),
  { label: 'ศูนย์แจ้งเตือน', to: '/notifications', icon: iconBell, group: 'ทั่วไป' },
]
export const projectPinCatalog: PinItem[] = [
  ...projectMenu.flatMap((g) => g.children.map((c) => ({ label: c.label, to: c.to, icon: routeIcon[c.to] ?? g.icon, group: g.label }))),
  { label: 'ศูนย์แจ้งเตือน', to: '/notifications', icon: iconBell, group: 'ทั่วไป' },
]
export const financePinCatalog: PinItem[] = [
  ...financeMenu.flatMap((g) => g.children.map((c) => ({ label: c.label, to: c.to, icon: routeIcon[c.to] ?? g.icon, group: g.label }))),
  { label: 'ศูนย์แจ้งเตือน', to: '/notifications', icon: iconBell, group: 'ทั่วไป' },
]
export const fundingPinCatalog: PinItem[] = [
  ...fundingMenu.flatMap((g) => g.children.map((c) => ({ label: c.label, to: c.to, icon: routeIcon[c.to] ?? g.icon, group: g.label }))),
  { label: 'ศูนย์แจ้งเตือน', to: '/notifications', icon: iconBell, group: 'ทั่วไป' },
]
export const hrPinCatalog: PinItem[] = [
  ...hrMenu.flatMap((g) => g.children.map((c) => ({ label: c.label, to: c.to, icon: routeIcon[c.to] ?? g.icon, group: g.label }))),
  { label: 'ศูนย์แจ้งเตือน', to: '/notifications', icon: iconBell, group: 'ทั่วไป' },
].filter((p, i, a) => a.findIndex((x) => x.to === p.to) === i)
export const bookingPinCatalog: PinItem[] = [
  ...bookingMenu.flatMap((g) => g.children.filter((c) => c.to !== '/booking').map((c) => ({ label: c.label, to: c.to, icon: routeIcon[c.to] ?? g.icon, group: g.label }))),
  { label: 'ศูนย์แจ้งเตือน', to: '/notifications', icon: iconBell, group: 'ทั่วไป' },
]
export const assetPinCatalog: PinItem[] = [
  ...assetMenu.flatMap((g) => g.children.filter((c) => c.to !== '/asset').map((c) => ({ label: c.label, to: c.to, icon: routeIcon[c.to] ?? g.icon, group: g.label }))),
  { label: 'ศูนย์แจ้งเตือน', to: '/notifications', icon: iconBell, group: 'ทั่วไป' },
]
export const edocPinCatalog: PinItem[] = [
  { label: 'นำเข้าเอกสาร', to: '/edoc/upload', icon: routeIcon['/edoc/upload'] ?? iconManage, group: 'งานนำเข้าเอกสาร' },
  { label: 'ศูนย์แจ้งเตือน', to: '/notifications', icon: iconBell, group: 'ทั่วไป' },
]
export const pinCatalogFor = (system: 'oss' | 'saraban' | 'strategic' | 'project' | 'finance' | 'funding' | 'hr' | 'asset' | 'edoc' | 'booking') => ({ saraban: sarabanPinCatalog, strategic: strategicPinCatalog, project: projectPinCatalog, finance: financePinCatalog, funding: fundingPinCatalog, hr: hrPinCatalog, booking: bookingPinCatalog, asset: assetPinCatalog, edoc: edocPinCatalog, oss: pinCatalog })[system]
export const defaultBookingPins = ['/booking/room', '/booking/vehicle', '/booking/zoom', '/booking/borrow']
export const defaultAssetPins = ['/asset/repair', '/asset/repair/new', '/asset/import', '/asset/procurement']
export const defaultEdocPins = ['/edoc/upload']
export const defaultHrPins = ['/hr/leave', '/hr/certificate', '/hr/welfare']
export const defaultFundingPins = ['/funding', '/funding/summary', '/funding/report']
export const defaultFinancePins = ['/finance/loan', '/finance/approve', '/finance/clear']
export const defaultProjectPins = ['/project/records', '/project/form', '/project/review']
export const defaultStrategicPins = ['/strategic/plan', '/strategic/review', '/strategic/risk/report']
export const defaultSarabanPins = ['/saraban/receive/new', '/saraban/internal/new']
/** Pinned by default, same three as Figma OSS-Profile Setting */
export const defaultPins = ['/council-registration', '/project-status', '/community/survey-area']

export const allNavItems = [...mainMenu, ...pinnedMenu, ...latestMenu, allMenuItem, torMenuItem]
