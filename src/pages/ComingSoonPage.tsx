import { Link, useLocation } from 'react-router-dom'
import iconSquares from '../assets/dashboard/icon-squares-four-blue.svg'
import PageTitle from '../components/ui/PageTitle'
import { allNavItems } from '../data/navigation'

const extraTitles: [RegExp, string][] = [
  [/^\/survey\/\d+\/preview$/, 'ตัวอย่างแบบสอบถาม'],
  [/^\/survey\/\d+\/report$/, 'รายงานสรุปผล'],
]

/** Placeholder for sidebar routes whose Figma page has not been built yet. */
export default function ComingSoonPage() {
  const { pathname } = useLocation()
  const title = allNavItems.find((n) => n.to === pathname)?.label ?? extraTitles.find(([re]) => re.test(pathname))?.[1] ?? 'กำลังพัฒนา'

  return (
    <div className="flex flex-col gap-[24px] px-[24px] pb-[55px] max-sm:px-[12px]">
      <PageTitle icon={iconSquares}>{title}</PageTitle>
      <nav aria-label="Breadcrumb" className="-mt-[12px] flex gap-[6px] text-[12px] whitespace-nowrap">
        <Link to="/dashboard" className="leading-[normal] font-light text-gray-10 transition-colors hover:text-blue-00">
          หน้าแรก
        </Link>
        <span aria-hidden="true" className="leading-[1.3] text-gray-line">
          /
        </span>
        <span aria-current="page" className="leading-[normal] font-light text-gray-10">
          {title}
        </span>
      </nav>
      <section className="flex flex-col items-center gap-[12px] rounded-[12px] border border-gray-line-2 bg-white px-[24px] py-[64px] text-center">
        <span className="flex size-[56px] items-center justify-center rounded-[16px] bg-blue-bg">
          <img src={iconSquares} alt="" width={28} height={28} />
        </span>
        <h2 className="text-[16px] font-medium text-black">หน้านี้กำลังพัฒนา</h2>
        <p className="max-w-[360px] text-[12px] leading-[1.6] font-light text-gray-20">
          เมนู “{title}” จะพร้อมใช้งานเร็วๆ นี้ ระหว่างนี้กลับไปที่หน้าแรกได้
        </p>
        <Link
          to="/dashboard"
          className="mt-[4px] rounded-[8px] bg-blue-bg px-[14px] py-[8px] text-[12px] font-medium text-blue-00 transition-colors hover:bg-blue-20"
        >
          กลับหน้าแรก
        </Link>
      </section>
    </div>
  )
}
