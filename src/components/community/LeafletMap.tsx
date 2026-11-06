import L from 'leaflet'
import 'leaflet/dist/leaflet.css'
import { useEffect, useRef } from 'react'
import { kindColor, problemColor, type MapPoint, type PointKind } from '../../data/orgMap'

// tiny white glyphs inside the coloured round markers (Figma legend icons)
const glyph: Record<PointKind, string> = {
  org: '<circle cx="12" cy="8" r="3.2"/><path d="M5.5 19c.6-3.6 3.2-5.4 6.5-5.4s5.9 1.8 6.5 5.4"/>',
  council: '<path d="M4 11.5 12 5l8 6.5M6.5 10.5V19h11v-8.5M10 19v-4.5h4V19"/>',
  leader: '<circle cx="12" cy="9" r="4.6"/><path d="m9.2 13 -1.4 6 4.2-2 4.2 2-1.4-6"/>',
  project: '<rect x="5" y="6" width="14" height="13" rx="2"/><path d="M5 10.5h14M9 4v3M15 4v3M9.5 14.5l1.8 1.8 3.4-3.6"/>',
  problem: '<path d="M12 5 20 19H4Z"/><path d="M12 10v4M12 16.4v.2"/>',
}
// spatial-problem glyphs (flood / fire / risk / house)
const problemGlyph = {
  flood: '<path d="M4 10c2-2 4-2 6 0s4 2 6 0 3-1.5 4-1M4 15c2-2 4-2 6 0s4 2 6 0 3-1.5 4-1"/>',
  fire: '<path d="M12 4c1 3 5 5 5 9a5 5 0 0 1-10 0c0-2 1-3 2-4 0 1.5 1 2 1.5 2C10.5 8 11 6 12 4Z"/>',
  risk: '<path d="M12 5 20 19H4Z"/><path d="M12 10v4M12 16.4v.2"/>',
  house: '<path d="M4 11.5 12 5l8 6.5M6.5 10.5V19h11v-8.5"/>',
}
const icon = (p: MapPoint, override?: string) => {
  const k = p.kind
  const bg = override ?? (k === 'problem' && p.problemType ? problemColor[p.problemType] : kindColor[k])
  const g = k === 'problem' && p.problemType ? problemGlyph[p.problemType] : glyph[k]
  return L.divIcon({
    className: 'codi-marker',
    html: `<span style="background:${bg}"><svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="#fff" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round">${g}</svg></span>`,
    iconSize: [28, 28],
    iconAnchor: [14, 14],
    popupAnchor: [0, -14],
  })
}

type Props = {
  points: MapPoint[]
  /** changes whenever the area filter changes → re-frame the map */
  fitKey: string
  focusId?: string
  /** clicked marker id (null when the empty map is clicked) */
  onHover?: (id: string | null) => void
  /** provinces to outline with a dotted red border; strong = a single chosen province */
  outline?: { names: string[]; strong: boolean }
  /** override the marker colour (e.g. project type on the project-status map) */
  colorOf?: (p: MapPoint) => string | undefined
}

export default function LeafletMap({ points, fitKey, focusId, onHover, outline, colorOf }: Props) {
  const hoverCb = useRef(onHover)
  hoverCb.current = onHover
  const outlineLayer = useRef<L.LayerGroup | null>(null)
  const el = useRef<HTMLDivElement>(null)
  const map = useRef<L.Map | null>(null)
  const layer = useRef<L.LayerGroup | null>(null)
  const markers = useRef(new Map<string, L.Marker>())
  const latest = useRef(points)
  latest.current = points

  useEffect(() => {
    if (!el.current) return
    const m = L.map(el.current, { zoomControl: false, attributionControl: true, minZoom: 5, maxZoom: 18 })
    m.setView([13.4, 101], 6)
    L.tileLayer('https://tile.openstreetmap.org/{z}/{x}/{y}.png', { attribution: '© OpenStreetMap', maxZoom: 19 }).addTo(m)
    outlineLayer.current = L.layerGroup().addTo(m)
    layer.current = L.layerGroup().addTo(m)
    map.current = m
    // clicking empty map closes the detail card
    m.on('click', () => hoverCb.current?.(null))
    // the summary panel folds/unfolds beside the map, so keep tiles in step with the new width
    const ro = new ResizeObserver(() => m.invalidateSize())
    ro.observe(el.current)
    return () => {
      ro.disconnect()
      m.remove()
      map.current = null
    }
  }, [])

  useEffect(() => {
    const g = layer.current
    if (!g) return
    g.clearLayers()
    markers.current.clear()
    for (const p of points) {
      const mk = L.marker([p.lat, p.lng], { icon: icon(p, colorOf?.(p)), title: p.name })
      mk.on('click', (e) => {
        L.DomEvent.stopPropagation(e)
        hoverCb.current?.(p.id)
      })
      mk.addTo(g)
      markers.current.set(p.id, mk)
    }
  }, [points])

  // dotted red province border(s) for the chosen area; outline data is loaded on demand
  const outlineKey = outline ? outline.names.join(',') + (outline.strong ? '!' : '') : ''
  useEffect(() => {
    let live = true
    const g = outlineLayer.current
    g?.clearLayers()
    if (!outline || !outline.names.length) return
    import('../../data/provinceGeo').then(({ provinceGeo }) => {
      if (!live || !g) return
      for (const name of outline.names) {
        const rings = provinceGeo[name]
        if (!rings) continue
        L.polygon(rings, {
          color: '#e5484d',
          weight: outline.strong ? 3 : 1.5,
          dashArray: outline.strong ? '1 7' : '3 6',
          lineCap: 'round',
          opacity: outline.strong ? 1 : 0.7,
          fillColor: '#2f9e6a',
          fillOpacity: outline.strong ? 0.1 : 0.04,
          interactive: false,
        }).addTo(g)
      }
    })
    return () => {
      live = false
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [outlineKey])

  // re-frame when the area filter changes
  useEffect(() => {
    const m = map.current
    if (!m) return
    const list = latest.current
    if (!list.length) {
      m.setView([13.4, 101], 6)
      return
    }
    m.fitBounds(L.latLngBounds(list.map((p) => [p.lat, p.lng] as [number, number])), { padding: [40, 40], maxZoom: 13 })
  }, [fitKey])

  useEffect(() => {
    const m = map.current
    const mk = focusId ? markers.current.get(focusId) : undefined
    if (!m || !mk) return
    m.flyTo(mk.getLatLng(), Math.max(m.getZoom(), 13), { duration: 0.6 })
  }, [focusId])

  const btn =
    'flex size-[32px] items-center justify-center rounded-[6px] bg-white text-[18px] leading-none font-medium text-gray-30 transition-colors hover:text-blue-00 focus-visible:outline-2 focus-visible:outline-blue-00'
  return (
    <div className="relative h-full overflow-hidden rounded-[12px] border border-gray-line-2">
      <div ref={el} role="application" aria-label="แผนที่เชิงภูมิศาสตร์ข้อมูลองค์กรชุมชน" className="absolute inset-0 z-0" />
      <div className="absolute top-[12px] right-[12px] z-[500] flex flex-col overflow-hidden rounded-[8px] border-2 border-[#e6e6e6] bg-white">
        <button type="button" aria-label="ขยายแผนที่" className={btn} onClick={() => map.current?.zoomIn()}>
          +
        </button>
        <span className="h-px bg-gray-line" />
        <button type="button" aria-label="ย่อแผนที่" className={btn} onClick={() => map.current?.zoomOut()}>
          −
        </button>
        <span className="h-px bg-gray-line" />
        <button
          type="button"
          aria-label="กลับไปยังพื้นที่ที่เลือก"
          className={btn}
          onClick={() => {
            const l = latest.current
            if (l.length) map.current?.fitBounds(L.latLngBounds(l.map((p) => [p.lat, p.lng] as [number, number])), { padding: [40, 40], maxZoom: 13 })
          }}
        >
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" aria-hidden="true">
            <circle cx="12" cy="12" r="4" />
            <path d="M12 2v4M12 18v4M2 12h4M18 12h4" />
          </svg>
        </button>
      </div>
    </div>
  )
}
