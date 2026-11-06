import { useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import iconFunnel from '../assets/dashboard/icon-funnel.svg'
import iconSearch from '../assets/dashboard/icon-search.svg'
import banner11 from '../assets/web/banner-11.jpg'
import banner12 from '../assets/web/banner-12.jpg'
import banner6 from '../assets/web/banner-6.jpg'
import n10 from '../assets/web/news-10.jpg'
import n2 from '../assets/web/news-2.jpg'
import n3 from '../assets/web/news-3.jpg'
import n7 from '../assets/web/news-7.jpg'
import n9 from '../assets/web/news-9.jpg'
import hero from '../assets/web/news-hero.jpg'
import PageTitle from '../components/ui/PageTitle'
import Select from '../components/ui/Select'

const megaIcon = `data:image/svg+xml;utf8,${encodeURIComponent('<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#0085f9" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M4 10v4l3 .5L16 19V5L7 9.5Z"/><path d="M19 9.5a3.5 3.5 0 0 1 0 5"/></svg>')}`

export type NewsItem = { id: number; cat: string; date: string; title: string; photo: string }
export const newsCats = ['ข่าวล่าสุด', 'ข่าวทั่วไป', 'ข่าวภายในหน่วยงาน', 'ประกาศสำคัญ']
const items: NewsItem[] = [
  { id: 1, cat: 'ข่าวล่าสุด', date: '25 ก.ย. 2568', title: 'ดร.ทองกฤติ์ ธก “ปทุมธานีโมเดล” ลงนาม MOU พัฒนาอาชีพเด็กขับรถ', photo: n2 },
  { id: 2, cat: 'ข่าวทั่วไป', date: '25 ก.ย. 2568', title: 'ดร.ทองกฤติ์ ธก “พื้นที่กลางภาคประชาชน” ลงนาม MOU พัฒนาอาชีพเด็กขับรถ', photo: n3 },
  { id: 3, cat: 'ข่าวภายในหน่วยงาน', date: '25 ก.ย. 2568', title: 'ซื้อสิทธิ์ถือเป็นภัยพิบัติที่เกิดจากน้ำมือของคน', photo: n10 },
  { id: 4, cat: 'ประกาศสำคัญ', date: '25 ก.ย. 2568', title: 'An in-depth look at the emerging trends and potential pitfalls in the cryptocurrency market.', photo: n7 },
  { id: 5, cat: 'ข่าวล่าสุด', date: '25 ก.ย. 2568', title: 'The 7th World Humanities Forum: The Humanities of Relationships', photo: n9 },
  { id: 6, cat: 'ข่าวทั่วไป', date: '24 ก.ย. 2568', title: 'พอช. ลงพื้นที่ติดตามโครงการบ้านมั่นคงชนบท จังหวัดเชียงใหม่', photo: n2 },
  { id: 7, cat: 'ข่าวภายในหน่วยงาน', date: '23 ก.ย. 2568', title: 'ประกาศผลการคัดเลือกหลักสูตรพัฒนาผู้นำชุมชน ประจำปี 2568', photo: n10 },
  { id: 8, cat: 'ประกาศสำคัญ', date: '22 ก.ย. 2568', title: 'แจ้งปิดปรับปรุงระบบ CODI Portal ชั่วคราว คืนวันเสาร์ที่ 27 กันยายน', photo: n3 },
]
const services = [
  { label: 'E-Service', photo: banner6, tone: 'text-white' },
  { label: 'ตลาดนัดองค์กรชุมชน', photo: banner11, tone: 'text-[#12326b]' },
  { label: 'ช่องทางแจ้งเรื่องร้องเรียน', photo: banner12, tone: 'text-white' },
]

export function Card({ n }: { n: NewsItem }) {
  return (
    <article className="group flex flex-col gap-[8px]">
      <a href="#news" onClick={(e) => e.preventDefault()} className="flex flex-col gap-[8px] focus-visible:outline-2 focus-visible:outline-blue-00">
        <span className="block aspect-[4/3] overflow-hidden rounded-[10px] bg-gray-bg">
          <img src={n.photo} alt="" loading="lazy" className="size-full object-cover transition-transform duration-300 group-hover:scale-[1.04]" />
        </span>
        <span className="flex items-center gap-[8px] text-[10px]"><b className="font-medium text-blue-00">ข่าวประชาสัมพันธ์</b><span className="font-light text-gray-20">· {n.date}</span></span>
        <h3 className="line-clamp-2 text-[13px] leading-[1.5] font-semibold text-black group-hover:text-blue-00">{n.title}</h3>
      </a>
    </article>
  )
}

export function FilterBar({ cat, setCat, q, setQ, catLabel = 'เลือกประเภท', cats = newsCats }: { cat: string; setCat: (v: string) => void; q: string; setQ: (v: string) => void; catLabel?: string; cats?: string[] }) {
  return (
    <div className="flex items-center gap-[10px] rounded-[10px] bg-blue-00 p-[10px] max-sm:flex-wrap">
      <div className="w-[240px] max-sm:w-full">
        <Select label={catLabel} value={cat} placeholder={catLabel} options={[{ value: '', label: 'ทั้งหมด' }, ...cats.map((c) => ({ value: c, label: c }))]} onChange={setCat} />
      </div>
      <div className="relative ml-auto w-[240px] max-sm:ml-0 max-sm:flex-1">
        <input aria-label="ค้นหา" placeholder="ค้นหา" value={q} onChange={(e) => setQ(e.target.value)} className="h-[40px] w-full rounded-[8px] border-0 bg-gray-bg px-[14px] pr-[40px] text-[13px] font-light outline-none placeholder:text-gray-20" />
        <img src={iconSearch} alt="" width={18} height={18} className="pointer-events-none absolute top-1/2 right-[12px] -translate-y-1/2" />
      </div>
      <button type="button" aria-label="ตัวกรองขั้นสูง" className="flex size-[40px] shrink-0 items-center justify-center rounded-[8px] bg-white/15 hover:bg-white/25 focus-visible:outline-2 focus-visible:outline-white"><img src={iconFunnel} alt="" width={20} height={20} className="brightness-0 invert" /></button>
    </div>
  )
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="flex flex-col gap-[14px]">
      <h2 className="flex items-baseline gap-[10px] text-[16px] font-semibold text-black">{title}<a href="#all" onClick={(e) => e.preventDefault()} className="text-[10px] font-normal text-blue-00 hover:underline">ดูทั้งหมด</a></h2>
      {children}
    </section>
  )
}

/** ข่าวประชาสัมพันธ์ — OSS-News (Figma 384:32525), 2.4.2 เว็บประชาสัมพันธ์ */
export default function NewsPage() {
  const [cat, setCat] = useState('')
  const [q, setQ] = useState('')
  const [slide, setSlide] = useState(0)
  const heroSlides = [hero, banner6, banner12, banner11]
  useEffect(() => {
    const t = setInterval(() => setSlide((s) => (s + 1) % heroSlides.length), 5000)
    return () => clearInterval(t)
  }, [heroSlides.length])

  const list = useMemo(() => items.filter((n) => (!cat || n.cat === cat) && (!q.trim() || n.title.toLowerCase().includes(q.trim().toLowerCase()))), [cat, q])
  const filtering = !!cat || !!q.trim()

  return (
    <div className="flex flex-col gap-[20px] px-[24px] pb-[55px] max-sm:px-[12px]">
      <PageTitle icon={megaIcon}>ข่าวประชาสัมพันธ์</PageTitle>
      <FilterBar cat={cat} setCat={setCat} q={q} setQ={setQ} />

      {filtering ? (
        <section aria-live="polite" className="flex flex-col gap-[14px]">
          <h2 className="text-[16px] font-semibold">ผลการค้นหา {list.length} รายการ</h2>
          {list.length === 0 ? <p className="rounded-[12px] border border-gray-line-2 bg-white py-[48px] text-center text-[13px] font-light text-gray-20">ไม่พบข่าวที่ตรงกับเงื่อนไข</p> : <div className="grid grid-cols-4 gap-[16px] max-xl:grid-cols-3 max-md:grid-cols-2 max-sm:grid-cols-1">{list.map((n) => <Card key={n.id} n={n} />)}</div>}
        </section>
      ) : (
        <>
          <div className="grid grid-cols-[minmax(0,2fr)_minmax(0,1fr)] gap-[16px] max-lg:grid-cols-1">
            <div className="relative overflow-hidden rounded-[12px] bg-gray-bg">
              <div className="aspect-[820/312] max-sm:aspect-[16/9]">
                {heroSlides.map((s, i) => <img key={i} src={s} alt={i === 0 ? 'คิดถึงงานพัฒนา คิดถึง พอช. 25 ปี' : ''} className={`absolute inset-0 size-full object-cover transition-opacity duration-500 ${i === slide ? 'opacity-100' : 'opacity-0'}`} />)}
              </div>
              <div className="absolute bottom-[12px] left-1/2 flex -translate-x-1/2 gap-[6px]" role="tablist" aria-label="สไลด์ข่าว">
                {heroSlides.map((_, i) => <button key={i} type="button" role="tab" aria-selected={i === slide} aria-label={`สไลด์ ${i + 1}`} onClick={() => setSlide(i)} className={`h-[6px] rounded-full transition-all ${i === slide ? 'w-[20px] bg-white' : 'w-[6px] bg-white/60'}`} />)}
              </div>
            </div>
            <ul className="flex flex-col gap-[10px]">
              {items.slice(0, 3).map((n) => (
                <li key={n.id}>
                  <a href="#news" onClick={(e) => e.preventDefault()} className="flex items-center gap-[12px] rounded-[12px] bg-blue-bg p-[10px] transition-colors hover:bg-blue-20">
                    <img src={n.photo} alt="" loading="lazy" className="size-[68px] shrink-0 rounded-[8px] object-cover" />
                    <span className="min-w-0"><span className="text-[10px] font-light text-gray-20"><b className="font-medium text-blue-00">ข่าวประชาสัมพันธ์</b> · {n.date}</span><span className="line-clamp-2 block text-[12px] leading-[1.45] font-semibold text-black">{n.title}</span></span>
                  </a>
                </li>
              ))}
            </ul>
          </div>

          <ul className="grid grid-cols-3 gap-[16px] max-md:grid-cols-1">
            {services.map((s) => (
              <li key={s.label}>
                <a href="#service" onClick={(e) => e.preventDefault()} className="group relative flex h-[92px] items-center justify-center overflow-hidden rounded-[12px] focus-visible:outline-2 focus-visible:outline-blue-00">
                  <img src={s.photo} alt="" loading="lazy" className="absolute inset-0 size-full object-cover transition-transform duration-300 group-hover:scale-105" />
                  <span className={`relative text-[22px] font-bold drop-shadow-sm ${s.tone}`}>{s.label}</span>
                </a>
              </li>
            ))}
          </ul>

          <Section title="ข่าวความเคลื่อนไหวงานพัฒนา">
            <div className="grid grid-cols-4 gap-[16px] max-xl:grid-cols-3 max-md:grid-cols-2 max-sm:grid-cols-1">{items.slice(0, 4).map((n) => <Card key={n.id} n={n} />)}</div>
          </Section>
          <Section title="“ประเทศไทยดีขึ้นทุกวัน”">
            <div className="grid grid-cols-4 gap-[16px] max-xl:grid-cols-3 max-md:grid-cols-2 max-sm:grid-cols-1">{items.slice(2, 6).map((n) => <Card key={n.id} n={n} />)}</div>
          </Section>
        </>
      )}
      <Link to="/library" className="self-start text-[12px] text-blue-00 hover:underline">ไปที่ห้องสมุด →</Link>
    </div>
  )
}
