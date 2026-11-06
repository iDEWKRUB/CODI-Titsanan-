import { useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import c1 from '../assets/web/cover-1.jpg'
import c14 from '../assets/web/cover-14.jpg'
import c2 from '../assets/web/cover-2.jpg'
import c3 from '../assets/web/cover-3.jpg'
import c4 from '../assets/web/cover-4.jpg'
import c5 from '../assets/web/cover-5.jpg'
import c6 from '../assets/web/cover-6.jpg'
import c9 from '../assets/web/cover-9.jpg'
import { BackTitle } from '../components/leader/Parts'
import { FilterBar } from './NewsPage'

const bookIcon = `data:image/svg+xml;utf8,${encodeURIComponent('<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#0085f9" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M12 6.5C10.5 5 8 4.5 4 4.5v13c4 0 6.5.5 8 2 1.5-1.5 4-2 8-2v-13c-4 0-6.5.5-8 2Z"/><path d="M12 6.5v13"/></svg>')}`

type Book = { id: number; cat: string; title: string; date: string; cover: string }
const covers = [c6, c1, c5, c14, c3, c9, c3, c5, c6, c4]
const kinds = ['การจัดการความรู้', 'Category', 'การจัดการความรู้', 'Category', 'การจัดการความรู้']
const titles = ['รายงานประจำปี 2559 สภาพัฒนาการเมือง', 'คู่มือการทำข้อมูลฉบับชาวบ้านใครๆก็ทำได้ง่ายนิดเดียว']
const books: Book[] = Array.from({ length: 30 }, (_, i) => ({ id: i + 1, cat: kinds[i % 5], title: titles[(i % 5 === 1 || i % 5 === 3) ? 1 : 0], date: '23 กันยายน 2568', cover: covers[i % 10] }))
const libCats = ['การจัดการความรู้', 'รายงานประจำปี', 'คู่มือ', 'วารสาร']
const notices = [
  { t: 'ประมวลสรุปสถิติกิจกรรมที่สำคัญและเกี่ยวข้องกับ พอช. และขบวนองค์กรชุมชน วันที่ 3 กันยายน 2562', d: '22-10-68', h: '08:00' },
  { t: 'ประมวลสรุปสถิติกิจกรรมที่สำคัญและเกี่ยวข้องกับ พอช. และขบวนองค์กรชุมชน วันที่ 3 กันยายน 2562', d: '22-10-68', h: '13:30' },
  { t: 'ประมวลสรุปสถิติกิจกรรมที่สำคัญและเกี่ยวข้องกับ พอช. และขบวนองค์กรชุมชน วันที่ 3 กันยายน 2562', d: '23-10-68', h: '14:00' },
]

function BookCard({ b }: { b: Book }) {
  return (
    <a href="#book" onClick={(e) => e.preventDefault()} className="group flex flex-col overflow-hidden rounded-[12px] border border-gray-line-2 bg-white transition-shadow hover:shadow-[0_6px_20px_rgba(0,53,125,0.14)] focus-visible:outline-2 focus-visible:outline-blue-00">
      <span className="block aspect-[4/5] overflow-hidden bg-gray-bg"><img src={b.cover} alt="" loading="lazy" className="size-full object-cover transition-transform duration-300 group-hover:scale-[1.04]" /></span>
      <span className="flex flex-col gap-[4px] p-[12px]">
        <span className="text-[10px] font-medium text-blue-00">{b.cat}</span>
        <span className="line-clamp-2 text-[14px] leading-[1.45] font-semibold text-black">{b.title}</span>
        <span className="text-[10px] font-light text-gray-20">สร้างเมื่อ: <span className="text-gray-30">{b.date}</span></span>
      </span>
    </a>
  )
}

/** ห้องสมุด — OSS-Library (Figma 364:24648), 2.4.2 */
export default function LibraryPage() {
  const [cat, setCat] = useState('')
  const [q, setQ] = useState('')
  const [slide, setSlide] = useState(0)
  const [feat, setFeat] = useState(0)
  const heroSlides = [c2, c4, c1, c9]
  useEffect(() => {
    const t = setInterval(() => setSlide((s) => (s + 1) % heroSlides.length), 5000)
    return () => clearInterval(t)
  }, [heroSlides.length])
  const filtered = useMemo(() => books.filter((b) => (!cat || b.cat.includes(cat)) && (!q.trim() || b.title.includes(q.trim()))), [cat, q])
  const filtering = !!cat || !!q.trim()
  const newest = books.slice(0, 5)

  return (
    <div className="flex flex-col gap-[20px] px-[24px] pb-[55px] max-sm:px-[12px]">
      <div className="flex items-center gap-[10px]"><img src={bookIcon} alt="" width={24} height={24} /><h1 className="text-[20px] leading-[1.2] font-semibold text-blue-00">ห้องสมุด</h1></div>
      <FilterBar cat={cat} setCat={setCat} q={q} setQ={setQ} cats={libCats} />

      {filtering ? (
        <section aria-live="polite" className="flex flex-col gap-[14px]">
          <h2 className="text-[16px] font-semibold">ผลการค้นหา {filtered.length} รายการ</h2>
          {filtered.length === 0 ? <p className="rounded-[12px] border border-gray-line-2 bg-white py-[48px] text-center text-[13px] font-light text-gray-20">ไม่พบหนังสือที่ตรงกับเงื่อนไข</p> : <div className="grid grid-cols-5 gap-[16px] max-xl:grid-cols-4 max-lg:grid-cols-3 max-md:grid-cols-2 max-sm:grid-cols-1">{filtered.slice(0, 20).map((b) => <BookCard key={b.id} b={b} />)}</div>}
        </section>
      ) : (
        <>
          <div className="grid grid-cols-[minmax(0,1.15fr)_minmax(0,1fr)] gap-[16px] max-lg:grid-cols-1">
            <div className="relative overflow-hidden rounded-[12px] bg-[#1f2547]">
              <div className="aspect-[16/9]">
                {heroSlides.map((s, i) => <img key={i} src={s} alt="" className={`absolute inset-0 size-full object-cover transition-opacity duration-500 ${i === slide ? 'opacity-100' : 'opacity-0'}`} />)}
              </div>
              <div className="absolute bottom-[12px] left-1/2 flex -translate-x-1/2 gap-[6px]" role="tablist" aria-label="สไลด์">
                {heroSlides.map((_, i) => <button key={i} type="button" role="tab" aria-selected={i === slide} aria-label={`สไลด์ ${i + 1}`} onClick={() => setSlide(i)} className={`h-[6px] rounded-full transition-all ${i === slide ? 'w-[20px] bg-white' : 'w-[6px] bg-white/60'}`} />)}
              </div>
            </div>
            <section aria-label="ประกาศ ข่าวกิจกรรม ข่าวประชาสัมพันธ์" className="rounded-[12px] border border-gray-line-2 bg-white p-[16px]">
              <h2 className="flex items-center justify-between text-[14px] font-semibold text-blue-dark">ประกาศ / ข่าวกิจกรรม / ข่าวประชาสัมพันธ์<Link to="/news" aria-label="ดูทั้งหมด" className="flex size-[22px] items-center justify-center rounded-full bg-blue-bg text-blue-00">›</Link></h2>
              <ul className="mt-[8px]">
                {notices.map((n, i) => (
                  <li key={i} className="border-b border-gray-line-2 py-[10px] last:border-b-0">
                    <a href="#notice" onClick={(e) => e.preventDefault()} className="block text-[11px] leading-[1.6] font-medium text-black hover:text-blue-00">{n.t}<span className="mt-[2px] flex gap-[8px] text-[9px] font-light"><span className="text-gray-30">{n.d}</span><span className="text-gray-10">{n.h}</span></span></a>
                  </li>
                ))}
              </ul>
            </section>
          </div>

          <section className="flex flex-col gap-[12px]">
            <h2 className="text-[16px] font-semibold text-black">หนังสือใหม่</h2>
            <div className="relative overflow-hidden rounded-[12px] bg-[#0a3a8a] p-[22px] max-sm:p-[12px]">
              <div className="grid grid-cols-[minmax(0,1.5fr)_repeat(3,minmax(0,1fr))] gap-[16px] max-lg:grid-cols-[minmax(0,1.5fr)_minmax(0,1fr)] max-sm:grid-cols-1">
                <div className="flex gap-[18px] rounded-[10px] bg-white p-[16px] max-sm:flex-col">
                  <img src={newest[feat].cover} alt="" className="aspect-[4/5] w-[44%] rounded-[6px] object-cover max-sm:w-full" />
                  <div className="flex min-w-0 flex-1 flex-col justify-between gap-[8px]">
                    <div><span className="text-[10px] font-medium text-blue-00">Category</span><h3 className="mt-[4px] text-[18px] leading-[1.4] font-semibold">{newest[feat].title}</h3></div>
                    <span className="text-[10px] font-light text-gray-20">สร้างเมื่อ: {newest[feat].date}</span>
                  </div>
                </div>
                {newest.filter((_, i) => i !== feat).slice(0, 3).map((b) => (
                  <button key={b.id} type="button" aria-label={`ดู ${b.title}`} onClick={() => setFeat(newest.indexOf(b))} className="hidden overflow-hidden rounded-[10px] lg:block focus-visible:outline-2 focus-visible:outline-white"><img src={b.cover} alt="" loading="lazy" className="size-full object-cover transition-transform hover:scale-[1.03]" /></button>
                ))}
                <div className="col-span-full flex items-center justify-center gap-[8px] lg:hidden">
                  {newest.map((b, i) => <button key={b.id} type="button" aria-label={`เล่ม ${i + 1}`} onClick={() => setFeat(i)} className={`h-[6px] rounded-full ${i === feat ? 'w-[20px] bg-white' : 'w-[6px] bg-white/50'}`} />)}
                </div>
              </div>
              <div className="mt-[12px] hidden justify-center gap-[6px] lg:flex">{newest.map((b, i) => <button key={b.id} type="button" aria-label={`เล่ม ${i + 1}`} onClick={() => setFeat(i)} className={`h-[6px] rounded-full ${i === feat ? 'w-[20px] bg-white' : 'w-[6px] bg-white/50'}`} />)}</div>
            </div>
          </section>

          <section className="flex flex-col gap-[12px]">
            <h2 className="text-[16px] font-semibold text-black">ทรัพยากรแนะนำ</h2>
            <div className="grid grid-cols-5 gap-[16px] max-xl:grid-cols-4 max-lg:grid-cols-3 max-md:grid-cols-2 max-sm:grid-cols-1">{books.slice(0, 5).map((b) => <BookCard key={b.id} b={b} />)}</div>
          </section>
          <section className="flex flex-col gap-[12px]">
            <h2 className="flex items-baseline gap-[10px] text-[16px] font-semibold text-black">การจัดการความรู้<Link to="/library/knowledge" className="text-[10px] font-normal text-blue-00 hover:underline">ดูเพิ่มเติม</Link></h2>
            <div className="grid grid-cols-5 gap-[16px] max-xl:grid-cols-4 max-lg:grid-cols-3 max-md:grid-cols-2 max-sm:grid-cols-1">{books.slice(5, 10).map((b) => <BookCard key={b.id} b={b} />)}</div>
          </section>
        </>
      )}
    </div>
  )
}

/** การจัดการความรู้ — OSS-Library list (Figma 384:27983) */
export function KnowledgePage() {
  const [cat, setCat] = useState('')
  const [q, setQ] = useState('')
  const [n, setN] = useState(10)
  const list = useMemo(() => books.filter((b) => (!cat || b.cat.includes(cat)) && (!q.trim() || b.title.includes(q.trim()))), [cat, q])
  return (
    <div className="flex flex-col gap-[16px] px-[24px] pb-[55px] max-sm:px-[12px]">
      <BackTitle title="การจัดการความรู้" to="/library" />
      <div className="flex items-center gap-[10px] max-sm:flex-wrap">
        <label className="relative w-[320px] max-sm:w-full">
          <span className="sr-only">เลือกประเภทความรู้</span>
          <select value={cat} onChange={(e) => { setCat(e.target.value); setN(10) }} className="h-[42px] w-full appearance-none rounded-[8px] border border-gray-line bg-white px-[14px] text-[13px] font-light outline-none focus:border-blue-00">
            <option value="">เลือกประเภทความรู้</option>
            {libCats.map((c) => <option key={c} value={c}>{c}</option>)}
          </select>
        </label>
        <input aria-label="ค้นหา" placeholder="ค้นหา" value={q} onChange={(e) => { setQ(e.target.value); setN(10) }} className="ml-auto h-[42px] w-[240px] rounded-[8px] border border-gray-line bg-gray-bg px-[14px] text-[13px] font-light outline-none placeholder:text-gray-20 focus:border-blue-00 max-sm:ml-0 max-sm:w-full" />
      </div>
      {list.length === 0 ? <p className="rounded-[12px] border border-gray-line-2 bg-white py-[48px] text-center text-[13px] font-light text-gray-20">ไม่พบรายการ</p> : <div className="grid grid-cols-5 gap-[16px] max-xl:grid-cols-4 max-lg:grid-cols-3 max-md:grid-cols-2 max-sm:grid-cols-1">{list.slice(0, n).map((b) => <BookCard key={b.id} b={b} />)}</div>}
      {n < list.length && <button type="button" onClick={() => setN((x) => x + 10)} className="mx-auto w-[210px] rounded-[8px] bg-blue-bg py-[12px] text-[13px] font-semibold text-blue-00 hover:bg-blue-20">ดูเพิ่ม</button>}
    </div>
  )
}
