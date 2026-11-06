import L from 'leaflet'
import 'leaflet/dist/leaflet.css'
import { useEffect, useRef, useState } from 'react'
import iconSearch from '../../assets/dashboard/icon-search.svg'

const pin = L.divIcon({
  className: 'codi-pin',
  html: '<svg viewBox="0 0 24 34" width="30" height="42"><path d="M12 1C6.5 1 2 5.4 2 10.9 2 18.6 12 33 12 33s10-14.4 10-22.1C22 5.4 17.5 1 12 1Z" fill="#e5484d" stroke="#fff" stroke-width="2"/><circle cx="12" cy="11" r="4" fill="#fff"/></svg>',
  iconSize: [30, 42],
  iconAnchor: [15, 41],
})

type Props = {
  lat: number
  lng: number
  onChange: (lat: number, lng: number) => void
  height?: number
  /** label for assistive tech */
  label?: string
}

/** Map with one draggable red pin (Figma "ปักหมุดตำแหน่ง"). Search uses OpenStreetMap Nominatim. */
export default function PinMap({ lat, lng, onChange, height = 260, label = 'แผนที่ปักหมุดตำแหน่ง' }: Props) {
  const el = useRef<HTMLDivElement>(null)
  const map = useRef<L.Map | null>(null)
  const marker = useRef<L.Marker | null>(null)
  const cb = useRef(onChange)
  cb.current = onChange
  const [q, setQ] = useState('')
  const [msg, setMsg] = useState('')

  useEffect(() => {
    if (!el.current) return
    const m = L.map(el.current, { zoomControl: false, attributionControl: true }).setView([lat, lng], 14)
    L.tileLayer('https://tile.openstreetmap.org/{z}/{x}/{y}.png', { attribution: '© OpenStreetMap', maxZoom: 19 }).addTo(m)
    const mk = L.marker([lat, lng], { icon: pin, draggable: true, title: 'ลากเพื่อย้ายตำแหน่ง' }).addTo(m)
    mk.on('dragend', () => {
      const p = mk.getLatLng()
      cb.current(+p.lat.toFixed(6), +p.lng.toFixed(6))
    })
    m.on('click', (e) => {
      mk.setLatLng(e.latlng)
      cb.current(+e.latlng.lat.toFixed(6), +e.latlng.lng.toFixed(6))
    })
    const ro = new ResizeObserver(() => m.invalidateSize())
    ro.observe(el.current)
    map.current = m
    marker.current = mk
    return () => {
      ro.disconnect()
      m.remove()
      map.current = null
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  // keep the pin in step when the position is changed from outside (search, address pick)
  useEffect(() => {
    const mk = marker.current
    if (!mk) return
    const cur = mk.getLatLng()
    if (Math.abs(cur.lat - lat) > 1e-6 || Math.abs(cur.lng - lng) > 1e-6) {
      mk.setLatLng([lat, lng])
      map.current?.setView([lat, lng], Math.max(map.current.getZoom(), 14))
    }
  }, [lat, lng])

  const search = async () => {
    const t = q.trim()
    if (!t) return
    setMsg('กำลังค้นหา…')
    try {
      const r = await fetch(`https://nominatim.openstreetmap.org/search?format=json&limit=1&countrycodes=th&q=${encodeURIComponent(t)}`)
      const j = (await r.json()) as { lat: string; lon: string }[]
      if (!j[0]) return setMsg('ไม่พบตำแหน่งที่ค้นหา')
      cb.current(+(+j[0].lat).toFixed(6), +(+j[0].lon).toFixed(6))
      setMsg('')
    } catch {
      setMsg('ค้นหาไม่สำเร็จ ตรวจสอบการเชื่อมต่ออินเทอร์เน็ต')
    }
  }
  const locate = () => {
    if (!navigator.geolocation) return setMsg('เบราว์เซอร์ไม่รองรับการระบุตำแหน่ง')
    navigator.geolocation.getCurrentPosition(
      (p) => (cb.current(+p.coords.latitude.toFixed(6), +p.coords.longitude.toFixed(6)), setMsg('')),
      () => setMsg('ไม่สามารถระบุตำแหน่งปัจจุบันได้'),
    )
  }
  const btn = 'flex size-[28px] items-center justify-center bg-white text-[16px] leading-none text-gray-30 hover:text-blue-00 focus-visible:outline-2 focus-visible:outline-blue-00'

  return (
    <div className="flex flex-col gap-[6px] rounded-[8px] border border-gray-line bg-white p-[8px]">
      <div className="flex items-center gap-[6px] rounded-[8px] border border-gray-line px-[12px] py-[7px] focus-within:border-blue-00">
        <input
          aria-label="ค้นหาตำแหน่ง"
          value={q}
          onChange={(e) => setQ(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), search())}
          placeholder="ค้นหาตำแหน่ง"
          className="min-w-0 flex-1 bg-transparent text-[12px] font-light outline-none placeholder:text-gray-20"
        />
        <button type="button" aria-label="ค้นหา" onClick={search}>
          <img src={iconSearch} alt="" width={18} height={18} />
        </button>
      </div>
      <div className="relative overflow-hidden rounded-[6px]" style={{ height }}>
        <div ref={el} role="application" aria-label={label} className="absolute inset-0 z-0" />
        <div className="absolute top-[8px] right-[8px] z-[500] flex flex-col overflow-hidden rounded-[6px] border-2 border-[#e6e6e6]">
          <button type="button" aria-label="ขยาย" className={btn} onClick={() => map.current?.zoomIn()}>
            +
          </button>
          <button type="button" aria-label="ย่อ" className={btn} onClick={() => map.current?.zoomOut()}>
            −
          </button>
          <button type="button" aria-label="ใช้ตำแหน่งปัจจุบัน" className={btn} onClick={locate}>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" aria-hidden="true">
              <circle cx="12" cy="12" r="4" />
              <path d="M12 2v4M12 18v4M2 12h4M18 12h4" />
            </svg>
          </button>
        </div>
        <p className="pointer-events-none absolute bottom-[8px] left-1/2 z-[500] -translate-x-1/2 rounded-[6px] border border-gray-line bg-white px-[10px] py-[4px] text-[10px] font-medium whitespace-nowrap text-gray-30 shadow">ลากเพื่อย้ายตำแหน่งที่ปักหมุด</p>
      </div>
      {msg && <p role="status" className="text-[11px] font-light text-gray-20">{msg}</p>}
      <p className="text-[10px] font-light text-gray-20">พิกัด {lat.toFixed(5)}, {lng.toFixed(5)}</p>
    </div>
  )
}
