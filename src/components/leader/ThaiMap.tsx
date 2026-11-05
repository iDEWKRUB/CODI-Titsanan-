import { useEffect, useMemo, useRef, useState } from 'react'
import { fmt, type Stats } from '../../data/leader'
import { mapProvinces } from '../../data/thaiMap'

type Box = { x0: number; y0: number; x1: number; y1: number }

// bounding box of each province, read once from its path data
const boxes = new Map<string, Box>(
  mapProvinces.map((p) => {
    const n = (p.d.match(/-?\d+(?:\.\d+)?/g) ?? []).map(Number)
    let x0 = 1e9, y0 = 1e9, x1 = -1e9, y1 = -1e9
    for (let i = 0; i + 1 < n.length; i += 2) {
      x0 = Math.min(x0, n[i]); x1 = Math.max(x1, n[i])
      y0 = Math.min(y0, n[i + 1]); y1 = Math.max(y1, n[i + 1])
    }
    return [p.name, { x0, y0, x1, y1 }]
  }),
)
const union = (names: string[]): Box => {
  const b = { x0: 1e9, y0: 1e9, x1: -1e9, y1: -1e9 }
  for (const n of names) {
    const q = boxes.get(n)
    if (!q) continue
    b.x0 = Math.min(b.x0, q.x0); b.y0 = Math.min(b.y0, q.y0); b.x1 = Math.max(b.x1, q.x1); b.y1 = Math.max(b.y1, q.y1)
  }
  return b
}

// Figma map palette: cream → amber → teal (fewer → more trained leaders)
const LOW = '#fbf8d6'
const MID = '#f1b90c'
const HIGH = '#14c6a4'

type Props = {
  stats: Map<string, Stats>
  region: string
  province: string
  onSelect: (province: string) => void
}

/** Province-level Thailand map: click a province, drag to pan, +/− to zoom (Figma vector-maps 210:13533). */
export default function ThaiMap({ stats, region, province, onSelect }: Props) {
  const [zoom, setZoom] = useState(1)
  const [pan, setPan] = useState({ x: 0, y: 0 })
  const [hover, setHover] = useState<string>()
  const svg = useRef<SVGSVGElement>(null)
  const drag = useRef<{ x: number; y: number; px: number; py: number; moved: boolean } | null>(null)

  // frame the selected province / region (or the whole country)
  const base = useMemo(() => {
    const names = province ? [province] : region ? mapProvinces.filter((p) => p.region === region).map((p) => p.name) : mapProvinces.map((p) => p.name)
    const b = union(names)
    const pad = province ? 40 : 20
    return { cx: (b.x0 + b.x1) / 2, cy: (b.y0 + b.y1) / 2, w: b.x1 - b.x0 + pad * 2, h: b.y1 - b.y0 + pad * 2 }
  }, [region, province])
  useEffect(() => {
    setZoom(1)
    setPan({ x: 0, y: 0 })
  }, [region, province])

  const view = { w: base.w / zoom, h: base.h / zoom }
  const vb = `${base.cx + pan.x - view.w / 2} ${base.cy + pan.y - view.h / 2} ${view.w} ${view.h}`

  // 3 levels from the spread of trained leaders
  const levels = useMemo(() => {
    const v = [...stats.values()].map((s) => s.trained).sort((a, b) => a - b)
    return [v[Math.floor(v.length / 3)], v[Math.floor((v.length * 2) / 3)]]
  }, [stats])
  const fillOf = (name: string) => {
    const t = stats.get(name)?.trained ?? 0
    return t < levels[0] ? LOW : t < levels[1] ? MID : HIGH
  }

  const unitsPerPx = () => {
    const r = svg.current?.getBoundingClientRect()
    return r ? Math.max(view.w / r.width, view.h / r.height) : 1
  }
  const zoomBy = (f: number) => setZoom((z) => Math.min(12, Math.max(1, z * f)))

  const btn =
    'flex size-[32px] items-center justify-center rounded-[8px] bg-white text-[18px] leading-none font-medium text-gray-20 shadow-[0_1px_4px_rgba(0,0,0,0.2)] transition-colors hover:text-blue-00 disabled:opacity-40 focus-visible:outline-2 focus-visible:outline-blue-00'
  const hv = hover ? stats.get(hover) : undefined

  return (
    <div className="relative h-full min-h-[300px] overflow-hidden rounded-[12px] border border-gray-line bg-[#e8f5ff]">
      <svg
        ref={svg}
        viewBox={vb}
        role="img"
        aria-label="แผนที่จำนวนผู้นำที่ผ่านการอบรมรายจังหวัด"
        className={`absolute inset-0 size-full touch-none select-none ${drag.current ? 'cursor-grabbing' : 'cursor-grab'}`}
        onPointerDown={(e) => {
          drag.current = { x: e.clientX, y: e.clientY, px: pan.x, py: pan.y, moved: false }
          e.currentTarget.setPointerCapture(e.pointerId)
        }}
        onPointerMove={(e) => {
          const d = drag.current
          if (!d) return
          const dx = e.clientX - d.x, dy = e.clientY - d.y
          if (Math.abs(dx) + Math.abs(dy) > 3) d.moved = true
          const k = unitsPerPx()
          setPan({ x: d.px - dx * k, y: d.py - dy * k })
        }}
        onPointerUp={() => setTimeout(() => (drag.current = null), 0)}
        onPointerCancel={() => (drag.current = null)}
        onDoubleClick={() => {
          setZoom(1)
          setPan({ x: 0, y: 0 })
        }}
      >
        <g strokeLinejoin="round">
          {mapProvinces.map((p) => {
            const dim = region && p.region !== region
            const sel = p.name === province
            return (
              <path
                key={p.code}
                d={p.d}
                fill={fillOf(p.name)}
                fillOpacity={dim ? 0.35 : 1}
                stroke={sel ? '#0085f9' : '#7a8087'}
                strokeWidth={(sel ? 2.4 : 0.7) * (base.w / zoom / 900)}
                vectorEffect="none"
                className="cursor-pointer transition-[fill-opacity] hover:brightness-95"
                onPointerEnter={() => setHover(p.name)}
                onPointerLeave={() => setHover(undefined)}
                onClick={() => !drag.current?.moved && onSelect(p.name === province ? '' : p.name)}
              />
            )
          })}
        </g>
      </svg>

      {hover && hv && (
        <div className="pointer-events-none absolute top-[12px] left-[12px] rounded-[8px] bg-gray-30 px-[10px] py-[6px] text-[12px] leading-[1.5] text-white shadow-lg">
          <b className="font-medium">{hover}</b>
          <br />
          อบรมแล้ว {fmt(hv.trained)} คน
        </div>
      )}

      <ul className="pointer-events-none absolute bottom-[12px] left-[12px] flex gap-[10px] rounded-[8px] bg-white/90 px-[10px] py-[6px] text-[11px] font-light text-gray-30 shadow-[0_1px_4px_rgba(0,0,0,0.15)] max-sm:hidden">
        {[
          [LOW, 'น้อย'],
          [MID, 'ปานกลาง'],
          [HIGH, 'มาก'],
        ].map(([c, t]) => (
          <li key={t} className="flex items-center gap-[4px]">
            <span className="size-[10px] rounded-[3px] border border-gray-line" style={{ background: c }} />
            {t}
          </li>
        ))}
      </ul>

      <div className="absolute right-[12px] bottom-[12px] flex gap-[8px]">
        <button type="button" aria-label="ย่อแผนที่" className={btn} onClick={() => zoomBy(1 / 1.6)} disabled={zoom <= 1}>
          −
        </button>
        <button type="button" aria-label="ขยายแผนที่" className={btn} onClick={() => zoomBy(1.6)} disabled={zoom >= 12}>
          +
        </button>
      </div>
    </div>
  )
}
