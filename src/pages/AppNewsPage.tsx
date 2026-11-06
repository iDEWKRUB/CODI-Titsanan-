import { useMemo, useState } from 'react'
import AppShell from '../components/app/AppShell'
import NewsReader from '../components/app/NewsReader'
import Pagination from '../components/ui/Pagination'
import { newsCats, type News } from '../data/codiApp'
import { thDate } from '../data/erpProject'
import { addView, isLive, useNews } from '../lib/codiAppStore'

const PAGE = 9

/** ข่าวสาร (nav "ข่าวสาร" of CODI APP) — every published item with type filter, search and full reading */
export default function AppNewsPage() {
  const all = useNews()
  const [cat, setCat] = useState('')
  const [q, setQ] = useState('')
  const [pg, setPg] = useState(1)
  const [reading, setReading] = useState<News>()
  const list = useMemo(() => all.filter((n) => isLive(n) && (!cat || n.cat === cat) && (!q.trim() || `${n.title} ${n.creator}`.includes(q.trim()))).sort((a, b) => (a.date < b.date ? 1 : -1)), [all, cat, q])
  const pages = Math.max(1, Math.ceil(list.length / PAGE))
  const cur = Math.min(pg, pages)
  return (
    <AppShell>
      <div className="flex flex-col gap-[16px]">
        <h1 className="text-[22px] font-semibold text-blue-dark">ข่าวสาร</h1>
        <div className="flex flex-wrap items-center gap-[8px]">
          <div role="tablist" aria-label="ประเภทข่าว" className="flex flex-wrap gap-[6px]">
            {['', ...newsCats].map((c) => <button key={c} type="button" role="tab" aria-selected={cat === c} onClick={() => { setCat(c); setPg(1) }} className={`rounded-full px-[14px] py-[6px] text-[12px] font-medium ${cat === c ? 'bg-blue-00 text-white' : 'bg-white text-gray-30 hover:bg-blue-bg'}`}>{c || 'ทั้งหมด'}</button>)}
          </div>
          <input aria-label="ค้นหาข่าว" placeholder="ค้นหาข่าว" value={q} onChange={(e) => { setQ(e.target.value); setPg(1) }} className="ml-auto h-[40px] w-[260px] rounded-[10px] border border-gray-line bg-white px-[14px] text-[13px] font-light outline-none focus:border-blue-00 max-sm:w-full" />
        </div>
        <div className="grid grid-cols-3 gap-[14px] max-lg:grid-cols-2 max-sm:grid-cols-1">
          {list.slice((cur - 1) * PAGE, cur * PAGE).map((n) => (
            <article key={n.id} className="flex flex-col overflow-hidden rounded-[16px] border border-gray-line-2 bg-white">
              <img src={n.cover} alt="" loading="lazy" className="aspect-[16/9] w-full object-cover" />
              <div className="flex flex-1 flex-col gap-[6px] p-[14px]">
                <span className="flex items-center gap-[8px] text-[10px]"><b className="font-medium text-blue-00">{n.cat}</b><span className="font-light text-gray-20">{`· ${thDate(n.date)} · ${n.views} ครั้ง`}</span></span>
                <h2 className="line-clamp-2 text-[14px] leading-[1.5] font-semibold">{n.title}</h2>
                <button type="button" aria-label={`อ่านต่อ ${n.title}`} onClick={() => { addView(n.id); setReading(n) }} className="mt-auto w-fit text-[12px] font-medium text-blue-00 hover:underline">อ่านต่อ ›</button>
              </div>
            </article>
          ))}
          {!list.length && <p className="col-span-full py-[40px] text-center text-[13px] font-light text-gray-20">ไม่พบข่าวตามเงื่อนไข</p>}
        </div>
        <div className="flex justify-end"><Pagination page={cur} pageCount={pages} onChange={setPg} /></div>
      </div>
      <NewsReader item={reading} onClose={() => setReading(undefined)} />
    </AppShell>
  )
}
