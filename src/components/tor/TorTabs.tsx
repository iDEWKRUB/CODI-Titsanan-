import { NavLink } from 'react-router-dom'
import { torSubMenu } from '../../data/navigation'

/** Sub-navigation shared by every TOR page (the sidebar group is hidden inside the mobile drawer). */
export default function TorTabs() {
  return (
    <nav aria-label="เมนูย่อย TOR" className="-mx-[2px] flex gap-[8px] overflow-x-auto px-[2px] pb-[2px] scrollbar-none">
      {torSubMenu.map((t) => (
        <NavLink
          key={t.to}
          to={t.to}
          className={({ isActive }) =>
            `flex h-[34px] shrink-0 items-center rounded-[17px] px-[14px] text-[13px] font-medium whitespace-nowrap transition-colors focus-visible:outline-2 focus-visible:outline-blue-10 ${
              isActive ? 'bg-blue-00 text-white' : 'border border-gray-line bg-white text-gray-20 hover:bg-blue-bg hover:text-blue-00'
            }`
          }
        >
          {t.label}
        </NavLink>
      ))}
    </nav>
  )
}
