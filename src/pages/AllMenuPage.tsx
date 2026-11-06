import { Link } from 'react-router-dom'
import iconSquares from '../assets/dashboard/icon-squares-four-blue.svg'
import PageTitle from '../components/ui/PageTitle'
import { erpMenu, financeMain, financeMenu, fundingMain, fundingMenu, hrMain, hrMenu, assetMain, assetMenu, edocMain, edocMenu, bookingMain, bookingMenu, mainMenu, ossMenu, otherMenu, pinCatalogFor, projectMain, projectMenu, sarabanMain, strategicMain, strategicMenu } from '../data/navigation'
import { useSystem } from '../lib/systemStore'
import { MAX_PINS, addPin, removePin, usePins } from '../lib/pinStore'

/** All Menu — the CODI OSS menu tree exactly as TOR book 3 §2.2 names and orders it. */
/** Small pin toggle next to a menu entry — edits the same list as the profile page */
function PinToggle({ to, label }: { to: string; label: string }) {
  const pins = usePins()
  const system = useSystem()
  const on = pins.includes(to)
  const full = !on && pins.length >= MAX_PINS
  if (!pinCatalogFor(system).some((p) => p.to === to)) return null
  return (
    <button
      type="button"
      aria-pressed={on}
      aria-label={on ? `เลิกปักหมุด ${label}` : `ปักหมุด ${label}`}
      title={full ? `ปักหมุดครบ ${MAX_PINS} รายการแล้ว` : on ? 'เลิกปักหมุด' : 'ปักหมุดไว้ที่เมนูซ้าย'}
      disabled={full}
      onClick={() => (on ? removePin(to) : addPin(to))}
      className={`flex size-[28px] shrink-0 items-center justify-center rounded-[6px] transition-colors focus-visible:outline-2 focus-visible:outline-blue-00 disabled:opacity-30 ${on ? 'bg-blue-bg text-blue-00' : 'text-gray-20 hover:bg-gray-bg hover:text-blue-00'}`}
    >
      <svg width="15" height="15" viewBox="0 0 24 24" fill={on ? 'currentColor' : 'none'} stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
        <path d="M9 4h6l-1 6 3 3v1.5H7V13l3-3Z" />
        <path d="M12 14.5V20" />
      </svg>
    </button>
  )
}

export default function AllMenuPage() {
  const system = useSystem()
  const saraban = system !== 'oss'
  const sysName = ({ strategic: 'ERP STRATEGIC', project: 'ERP PROJECT', finance: 'ERP FINANCE', funding: 'ERP FUNDING', hr: 'ERP HR', booking: 'ERP BOOKING', asset: 'ERP ASSET', edoc: 'ERP DOCUMENT', saraban: 'ERP SARABAN', oss: '' } as Record<string, string>)[system]
  const sysTitle = system === 'strategic' ? 'เมนูทั้งหมดของยุทธศาสตร์' : system === 'project' ? 'เมนูทั้งหมดของโครงการ' : system === 'finance' ? 'เมนูทั้งหมดของการเงิน' : system === 'funding' ? 'เมนูทั้งหมดของกองทุน' : system === 'hr' ? 'เมนูทั้งหมดของทรัพยากรบุคคล' : system === 'booking' ? 'เมนูทั้งหมดของงานจองออนไลน์' : system === 'asset' ? 'เมนูทั้งหมดของงานพัสดุ' : system === 'edoc' ? 'เมนูทั้งหมดของงานนำเข้าเอกสาร' : 'เมนูทั้งหมดของสารบรรณ'
  const groups = system === 'strategic' ? strategicMenu : system === 'project' ? projectMenu : system === 'finance' ? financeMenu : system === 'funding' ? fundingMenu : system === 'hr' ? hrMenu : system === 'booking' ? bookingMenu : system === 'asset' ? assetMenu : system === 'edoc' ? edocMenu : system === 'saraban' ? erpMenu : [...ossMenu, ...otherMenu]
  const shortcuts = saraban
    ? [...({ strategic: strategicMain, project: projectMain, finance: financeMain, funding: fundingMain, hr: hrMain, booking: bookingMain, asset: assetMain, edoc: edocMain, saraban: sarabanMain, oss: sarabanMain })[system].filter((m) => !['/saraban', '/saraban/docs', '/strategic', '/project', '/finance', '/funding', '/hr', '/asset', '/edoc', '/booking'].includes(m.to)).map((m) => ({ label: m.label, to: m.to })), { label: 'ตั้งค่าผู้ใช้งาน', to: '/profile' }]
    : [...mainMenu.map((m) => ({ label: m.label, to: m.to })), { label: 'ยื่นคำขอจดทะเบียนสภาองค์กรชุมชน', to: '/council-registration' }, { label: 'ตั้งค่าผู้ใช้งาน', to: '/profile' }]

  return (
    <div className="flex flex-col gap-[24px] px-[24px] pb-[55px] max-sm:px-[12px]">
      <PageTitle icon={iconSquares}>{saraban ? sysTitle : 'All Menu'}</PageTitle>
      <nav aria-label="Breadcrumb" className="-mt-[12px] flex gap-[6px] text-[12px] whitespace-nowrap">
        <Link to="/dashboard" className="leading-[normal] font-light text-gray-10 transition-colors hover:text-blue-00">
          หน้าแรก
        </Link>
        <span aria-hidden="true" className="leading-[1.3] text-gray-line">/</span>
        <span aria-current="page" className="leading-[normal] font-light text-gray-10">{saraban ? sysTitle : 'All Menu'}</span>
      </nav>

      <p className="-mt-[8px] max-w-[720px] text-[13px] leading-[1.7] font-light text-gray-20">
        {saraban ? `ทุกเมนูของระบบ ${sysName} (เล่มที่ 3 ข้อ ${({ strategic: '2.1.2', project: '2.1.3', finance: '2.1.4', funding: '2.1.5', hr: '2.1.6', booking: '2.1.10', asset: '2.1.8', edoc: '2.1.11', saraban: '2.1.7', oss: '' } as Record<string, string>)[system]}) กดไอคอนหมุดเพื่อปักไว้ที่เมนูซ้าย ปักหมุดตั้งแยกตามระบบ` : 'ระบบให้บริการแบบครบวงจร (CODI OSS) จัดเมนูตามรายงานการออกแบบระบบ เล่มที่ 3 ข้อ 2.2 และระบบอื่น ๆ ข้อ 2.3–2.4'}
      </p>

      <div className="grid grid-cols-3 gap-[16px] max-lg:grid-cols-2 max-sm:grid-cols-1">
        {groups.map((g) => (
          <section key={g.ref} className="flex flex-col gap-[12px] rounded-[12px] border border-gray-line-2 bg-white p-[16px]">
            <header className="flex items-start gap-[12px]">
              <span className="flex size-[40px] shrink-0 items-center justify-center rounded-[12px] bg-blue-bg">
                <img src={g.icon} alt="" width={22} height={22} className="size-[22px]" style={{ filter: 'brightness(0) saturate(100%) invert(36%) sepia(99%) saturate(3000%) hue-rotate(196deg)' }} />
              </span>
              <div className="min-w-0">
                <p className="font-urbanist text-[11px] leading-[normal] font-medium text-gray-30">ข้อ {g.ref}</p>
                <h2 className="text-[14px] leading-[1.35] font-semibold text-blue-dark">{g.label}</h2>
              </div>
            </header>
            <ul className="flex flex-col">
              {g.children.map((c) => (
                <li key={c.to} className="flex items-center gap-[4px] border-t border-gray-line-2 first:border-t-0">
                  <Link to={c.to} className="flex min-w-0 flex-1 items-center justify-between gap-[8px] rounded-[8px] px-[8px] py-[9px] text-[13px] font-normal text-black transition-colors hover:bg-blue-bg hover:text-blue-00">
                    <span className="min-w-0 truncate">{c.label}</span>
                    <span aria-hidden="true" className="text-gray-30">›</span>
                  </Link>
                  <PinToggle to={c.to} label={c.label} />
                </li>
              ))}
            </ul>
          </section>
        ))}

        <section className="flex flex-col gap-[12px] rounded-[12px] border border-gray-line-2 bg-white p-[16px]">
          <header className="flex items-start gap-[12px]">
            <span className="flex size-[40px] shrink-0 items-center justify-center rounded-[12px] bg-gray-bg">
              <img src={iconSquares} alt="" width={22} height={22} className="size-[22px] opacity-60" />
            </span>
            <div className="min-w-0">
              <p className="font-urbanist text-[11px] leading-[normal] font-medium text-gray-30">{saraban ? 'ทั่วไป' : 'ข้อ 2.2.1'}</p>
              <h2 className="text-[14px] leading-[1.35] font-semibold text-blue-dark">เมนูทั่วไป</h2>
            </div>
          </header>
          <ul className="flex flex-col">
            {shortcuts.map((c) => (
              <li key={c.to} className="flex items-center gap-[4px] border-t border-gray-line-2 first:border-t-0">
                <Link to={c.to} className="flex min-w-0 flex-1 items-center justify-between gap-[8px] rounded-[8px] px-[8px] py-[9px] text-[13px] font-normal text-black transition-colors hover:bg-blue-bg hover:text-blue-00">
                  <span className="min-w-0 truncate">{c.label}</span>
                  <span aria-hidden="true" className="text-gray-30">›</span>
                </Link>
                <PinToggle to={c.to} label={c.label} />
              </li>
            ))}
          </ul>
        </section>
      </div>
    </div>
  )
}
