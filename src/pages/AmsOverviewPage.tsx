import { useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import iconSearch from '../assets/dashboard/icon-search.svg'
import Select from '../components/ui/Select'
import { offices, rooms } from '../data/ams'

const total = 20000
const cube = (
  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#0085f9" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <path d="m12 3 8 4.5v9L12 21l-8-4.5v-9Z" /><path d="m4 7.5 8 4.5 8-4.5M12 12v9" />
  </svg>
)

/** ภาพรวมพัสดุ-ครุภัณฑ์ (Figma 340:27290) — 2.3.3.1 */
export default function AmsOverviewPage() {
  const [office, setOffice] = useState('all')
  const [room, setRoom] = useState('all')
  const [q, setQ] = useState('')
  const roomsInOffice = rooms.filter((r) => office === 'all' || r.office === office)
  const list = useMemo(() => {
    const k = q.trim()
    return rooms.filter((r) => (office === 'all' || r.office === office) && (room === 'all' || r.id === room) && (!k || r.name.includes(k) || r.office.includes(k)))
  }, [office, room, q])

  return (
    <div className="flex flex-col gap-[16px] px-[24px] pb-[55px] max-sm:px-[12px]">
      <div className="flex items-center gap-[10px]">
        {cube}
        <h1 className="text-[20px] leading-[1.2] font-semibold text-blue-00">ภาพรวมพัสดุ-ครุภัณฑ์</h1>
      </div>

      <div className="flex flex-wrap items-center gap-[12px]">
        <span className="text-[12px] font-medium text-black/90">คัดกรองข้อมูล</span>
        <div className="w-[190px]"><Select label="สำนัก" value={office} options={[{ value: 'all', label: 'สำนักทั้งหมด' }, ...offices.map((o) => ({ value: o, label: o }))]} onChange={(v) => { setOffice(v); setRoom('all') }} /></div>
        <div className="w-[190px]"><Select label="ห้อง" value={room} options={[{ value: 'all', label: 'ห้องทั้งหมด' }, ...roomsInOffice.map((r) => ({ value: r.id, label: r.name }))]} onChange={setRoom} /></div>
        <div className="relative ml-auto w-[240px] max-md:ml-0 max-md:w-full">
          <input aria-label="ค้นหา" placeholder="ค้นหา" value={q} onChange={(e) => setQ(e.target.value)} className="h-[40px] w-full rounded-[8px] border border-gray-line bg-gray-bg px-[14px] pr-[40px] text-[13px] font-light outline-none placeholder:text-gray-20 focus:border-blue-00" />
          <img src={iconSearch} alt="" width={18} height={18} className="pointer-events-none absolute top-1/2 right-[12px] -translate-y-1/2" />
        </div>
      </div>

      <p className="text-[14px] font-semibold text-black">พัสดุ-ครุภัณฑ์ทั้งหมด {total.toLocaleString('en-US')} ชิ้น</p>

      {list.length === 0 ? (
        <p className="rounded-[12px] border border-gray-line-2 bg-white py-[48px] text-center text-[13px] font-light text-gray-20">ไม่พบห้องที่ตรงกับตัวกรอง</p>
      ) : (
        <ul className="grid grid-cols-5 gap-[14px] max-2xl:grid-cols-4 max-xl:grid-cols-3 max-md:grid-cols-2 max-sm:grid-cols-1">
          {list.map((r) => (
            <li key={r.id}>
              <Link to={`/ams/app/${r.id}`} className="group flex h-full flex-col overflow-hidden rounded-[12px] border border-gray-line-2 bg-white transition-shadow hover:shadow-[0_6px_20px_rgba(0,53,125,0.14)] focus-visible:outline-2 focus-visible:outline-blue-00">
                <span className="block aspect-[16/10] overflow-hidden bg-gray-bg">
                  <img src={r.photo} alt="" loading="lazy" className="size-full object-cover transition-transform duration-300 group-hover:scale-[1.04]" />
                </span>
                <span className="flex flex-1 flex-col gap-[4px] p-[12px]">
                  <span className="flex items-start gap-[6px]">
                    <span className="min-w-0 flex-1 text-[14px] leading-[1.35] font-semibold text-black">{r.name}</span>
                    <span className="shrink-0 pt-[3px] text-[10px] font-light text-gray-20">ชั้น {r.floor}</span>
                  </span>
                  <span className="text-[10px] leading-[1.4] font-light text-gray-20">{r.office}</span>
                  <span className="mt-auto flex items-baseline justify-end gap-[4px] pt-[8px]">
                    <b className="font-urbanist text-[20px] leading-none font-semibold text-black">{r.count.toLocaleString('en-US')}</b>
                    <span className="text-[10px] text-gray-20">ชิ้น</span>
                  </span>
                </span>
              </Link>
            </li>
          ))}
        </ul>
      )}
      <p className="text-[11px] font-light text-gray-20">เลือกห้องเพื่อเปิดแอปสแกนตรวจนับ (CODI RFID) บนมือถือ</p>
    </div>
  )
}
