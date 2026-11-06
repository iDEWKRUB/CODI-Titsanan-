import type { ChartKind, Dataset } from '../../data/erpReport'
import { palette } from '../../data/erpReport'

const fmt = (n: number) => n.toLocaleString('th-TH', { maximumFractionDigits: 1 })
const short = (s: string, n = 12) => (s.length > n ? `${s.slice(0, n - 1)}…` : s)
const INK = '#1f2a44'
const MUTED = '#6b7690'
const GRID = '#e5ebf5'

function describe(d: Dataset) {
  return `${d.title}: ${d.items.map((i) => `${i.label} ${fmt(i.value)}`).join(', ')} (${d.unit})`
}

function Bars({ d }: { d: Dataset }) {
  const W = 480, H = 230, L = 36, B = 38, T = 22
  const max = Math.max(1, ...d.items.map((i) => i.value))
  const step = (W - L - 8) / Math.max(1, d.items.length)
  const bw = Math.min(46, step * 0.56)
  const ticks = [0, 0.5, 1]
  return (
    <svg viewBox={`0 0 ${W} ${H}`} className="h-auto w-full" aria-hidden="true">
      {ticks.map((t) => <g key={t}><line x1={L} x2={W - 8} y1={T + (H - T - B) * (1 - t)} y2={T + (H - T - B) * (1 - t)} stroke={GRID} strokeWidth="1" /><text x={L - 6} y={T + (H - T - B) * (1 - t) + 4} textAnchor="end" fontSize="10" fill={MUTED}>{fmt(max * t)}</text></g>)}
      {d.items.map((i, k) => {
        const h = ((H - T - B) * i.value) / max
        const x = L + step * k + (step - bw) / 2
        const y = H - B - h
        return (
          <g key={i.label}>
            <path d={`M${x} ${H - B} V${y + 4} Q${x} ${y} ${x + 4} ${y} H${x + bw - 4} Q${x + bw} ${y} ${x + bw} ${y + 4} V${H - B} Z`} fill={palette[0]} />
            <text x={x + bw / 2} y={y - 6} textAnchor="middle" fontSize="11" fontWeight="600" fill={INK}>{fmt(i.value)}</text>
            <text x={x + bw / 2} y={H - B + 16} textAnchor="middle" fontSize="10.5" fill={MUTED}>{short(i.label, step < 70 ? 8 : 13)}</text>
          </g>
        )
      })}
    </svg>
  )
}

function HBars({ d }: { d: Dataset }) {
  const row = 34, W = 480, L = 128, R = 54
  const H = row * d.items.length + 8
  const max = Math.max(1, ...d.items.map((i) => i.value))
  return (
    <svg viewBox={`0 0 ${W} ${H}`} className="h-auto w-full" aria-hidden="true">
      {d.items.map((i, k) => {
        const w = ((W - L - R) * i.value) / max
        const y = 6 + row * k
        return (
          <g key={i.label}>
            <text x={L - 8} y={y + 17} textAnchor="end" fontSize="11" fill={INK}>{short(i.label, 18)}</text>
            <rect x={L} y={y + 6} width={W - L - R} height="14" rx="7" fill="#eef3fb" />
            <rect x={L} y={y + 6} width={Math.max(8, w)} height="14" rx="7" fill={palette[k % 2 === 0 ? 0 : 5]} />
            <text x={L + Math.max(8, w) + 8} y={y + 17} fontSize="11" fontWeight="600" fill={INK}>{fmt(i.value)}</text>
          </g>
        )
      })}
    </svg>
  )
}

function Line({ d }: { d: Dataset }) {
  const W = 480, H = 230, L = 36, B = 38, T = 22
  const max = Math.max(1, ...d.items.map((i) => i.value)) * 1.1
  const n = Math.max(2, d.items.length)
  const px = (k: number) => L + 12 + ((W - L - 32) * k) / (n - 1)
  const py = (v: number) => T + (H - T - B) * (1 - v / max)
  const pts = d.items.map((i, k) => `${px(k)},${py(i.value)}`).join(' ')
  const area = `${px(0)},${H - B} ${pts} ${px(d.items.length - 1)},${H - B}`
  return (
    <svg viewBox={`0 0 ${W} ${H}`} className="h-auto w-full" aria-hidden="true">
      {[0, 0.5, 1].map((t) => <g key={t}><line x1={L} x2={W - 8} y1={T + (H - T - B) * (1 - t)} y2={T + (H - T - B) * (1 - t)} stroke={GRID} /><text x={L - 6} y={T + (H - T - B) * (1 - t) + 4} textAnchor="end" fontSize="10" fill={MUTED}>{fmt(max * t)}</text></g>)}
      <polygon points={area} fill={palette[0]} opacity="0.08" />
      <polyline points={pts} fill="none" stroke={palette[0]} strokeWidth="2.5" strokeLinejoin="round" strokeLinecap="round" />
      {d.items.map((i, k) => (
        <g key={i.label}>
          <circle cx={px(k)} cy={py(i.value)} r="4.5" fill="#fff" stroke={palette[0]} strokeWidth="2.5" />
          <text x={px(k)} y={py(i.value) - 10} textAnchor="middle" fontSize="11" fontWeight="600" fill={INK}>{fmt(i.value)}</text>
          <text x={px(k)} y={H - B + 16} textAnchor="middle" fontSize="10.5" fill={MUTED}>{i.label}</text>
        </g>
      ))}
    </svg>
  )
}

function Donut({ d }: { d: Dataset }) {
  const total = d.items.reduce((s, i) => s + i.value, 0) || 1
  const R = 62, r = 40, C = 80
  let a0 = -Math.PI / 2
  const arcs = d.items.map((i, k) => {
    const a1 = a0 + (i.value / total) * Math.PI * 2 - (d.items.length > 1 ? 0.03 : 0)
    const large = a1 - a0 > Math.PI ? 1 : 0
    const p = (a: number, rad: number) => `${C + rad * Math.cos(a)} ${C + rad * Math.sin(a)}`
    const path = i.value === total ? `M${C} ${C - R} A${R} ${R} 0 1 1 ${C - 0.01} ${C - R} L${C - 0.01} ${C - r} A${r} ${r} 0 1 0 ${C} ${C - r} Z` : `M${p(a0, R)} A${R} ${R} 0 ${large} 1 ${p(a1, R)} L${p(a1, r)} A${r} ${r} 0 ${large} 0 ${p(a0, r)} Z`
    a0 += (i.value / total) * Math.PI * 2
    return { path, color: palette[k % palette.length], i }
  })
  return (
    <div className="flex items-center gap-[16px] max-sm:flex-col">
      <svg viewBox="0 0 160 160" className="size-[170px] shrink-0" aria-hidden="true">
        {arcs.map((a) => <path key={a.i.label} d={a.path} fill={a.color} />)}
        <text x={C} y={C - 2} textAnchor="middle" fontSize="20" fontWeight="700" fill={INK}>{fmt(total)}</text>
        <text x={C} y={C + 14} textAnchor="middle" fontSize="10" fill={MUTED}>{d.unit}</text>
      </svg>
      <ul className="flex min-w-0 flex-1 flex-col gap-[6px] text-[12px]">
        {arcs.map((a) => (
          <li key={a.i.label} className="flex items-center gap-[8px]">
            <span className="size-[10px] shrink-0 rounded-[3px]" style={{ background: a.color }} />
            <span className="min-w-0 flex-1 truncate text-gray-30">{a.i.label}</span>
            <span className="font-urbanist font-semibold text-blue-dark">{fmt(a.i.value)}</span>
            <span className="w-[44px] text-right text-[11px] font-light text-gray-20">{fmt((a.i.value / total) * 100)}%</span>
          </li>
        ))}
      </ul>
    </div>
  )
}

/** SVG charts drawn in-house (no chart library): bar, horizontal bar, line, donut */
export function ChartView({ data, kind }: { data: Dataset; kind?: ChartKind }) {
  const k = kind ?? data.kind
  if (!data.items.length || data.items.every((i) => i.value === 0)) return <p className="py-[36px] text-center text-[12px] font-light text-gray-20">ยังไม่มีข้อมูลสำหรับแผนภูมินี้</p>
  return (
    <div role="img" aria-label={describe(data)}>
      {k === 'bar' ? <Bars d={data} /> : k === 'barh' ? <HBars d={data} /> : k === 'line' ? <Line d={data} /> : <Donut d={data} />}
    </div>
  )
}

export function downloadCsv(name: string, sets: Dataset[]) {
  const rows = [['ชุดข้อมูล', 'รายการ', 'ค่า', 'หน่วย'], ...sets.flatMap((d) => d.items.map((i) => [d.title, i.label, String(i.value), d.unit]))]
  const csv = '﻿' + rows.map((r) => r.map((c) => `"${c.replace(/"/g, '""')}"`).join(',')).join('\n')
  const a = document.createElement('a')
  a.href = URL.createObjectURL(new Blob([csv], { type: 'text/csv;charset=utf-8' }))
  a.download = `${name}.csv`
  a.click()
  setTimeout(() => URL.revokeObjectURL(a.href), 500)
}
