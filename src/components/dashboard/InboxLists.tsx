import { Link } from 'react-router-dom'
import iconCaretRight from '../../assets/dashboard/icon-caret-right.svg'
import { documents, news, type DocStatus } from '../../data/dashboard'
import StatusBadge from '../ui/StatusBadge'


function SectionHead({ title, to }: { title: string; to?: string }) {
  return (
    <div className="flex items-start gap-[12px]">
      <h2 className="text-[16px] leading-[normal] font-semibold whitespace-nowrap text-blue-title">{title}</h2>
      <Link
        to={to ?? '#'}
        className="group flex flex-1 items-center justify-end gap-[10px] rounded-[8px] focus-visible:outline-2 focus-visible:outline-blue-00"
      >
        <span className="text-[12px] leading-[normal] whitespace-nowrap text-gray-muted transition-colors group-hover:text-blue-00">ทั้งหมด</span>
        <span className="flex size-[24px] items-center justify-center rounded-[8px] bg-blue-tint transition-colors group-hover:bg-blue-20">
          <img src={iconCaretRight} alt="" width={16} height={16} />
        </span>
      </Link>
    </div>
  )
}

function Item({ title, date, time, status }: { title: string; date: string; time: string; status?: DocStatus }) {
  return (
    <li className="border-b border-gray-line last:border-b-0">
      <a
        href="#"
        onClick={(e) => e.preventDefault()}
        className="flex items-center gap-[12px] rounded-[8px] px-[4px] py-[16px] transition-colors hover:bg-gray-subtle focus-visible:outline-2 focus-visible:outline-blue-00"
      >
        <div className="flex min-w-0 flex-1 flex-col gap-[10px]">
          <p className="truncate text-[12px] leading-[normal] font-medium text-ink">{title}</p>
          <p className="flex gap-[10px] text-[10px] leading-[normal] whitespace-nowrap">
            <span className="text-heading">{date}</span>
            <span className="text-gray-muted">{time}</span>
          </p>
        </div>
        {status && <StatusBadge status={status} />}
      </a>
    </li>
  )
}

export default function InboxLists() {
  return (
    <div className="grid grid-cols-1 items-start gap-[12px] lg:grid-cols-2">
      <section className="flex flex-col gap-[12px] rounded-[12px] border border-gray-line bg-white p-[24px] max-sm:p-[16px]">
        <SectionHead title="ติดตามสถานะเอกสาร" />
        <ul>
          {documents.map((d) => (
            <Item key={d.id} {...d} />
          ))}
        </ul>
      </section>
      <section className="flex flex-col gap-[12px] rounded-[12px] border border-gray-line-2 bg-white p-[24px] max-sm:p-[16px]">
        <SectionHead title="ข่าวและประกาศ" to="/news" />
        <ul>
          {news.map((n) => (
            <Item key={n.id} {...n} />
          ))}
        </ul>
      </section>
    </div>
  )
}
