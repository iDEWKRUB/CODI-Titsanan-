import { useCallback, useRef, useState } from 'react'
import caret from '../../assets/results/icon-caret-xs.svg'
import type { ChartKind, ResultSeries } from '../../data/surveyResults'
import useDismiss from '../ui/useDismiss'

const kindLabel: Record<ChartKind, string> = { pie: 'Pie Chart', 'bar-v': 'Bar Chart แนวตั้ง', 'bar-h': 'Bar Chart แนวนอน' }
const pct = (v: number, total: number) => (total ? (v / total) * 100 : 0)

/** Nice axis max: 40 for 38, 50 for 45, 100 for 88 … */
function niceMax(v: number) {
  if (v <= 0) return 4
  // 4 gridlines; pick the smallest 1/2/2.5/5 step that fits, never below 1 (values are counts)
  const p = 10 ** Math.floor(Math.log10(v / 4))
  const step = [1, 2, 2.5, 5, 10].map((s) => s * p).find((s) => s >= 1 && s * 4 >= v) ?? Math.max(1, 10 * p)
  return step * 4
}

function KindSelect({ value, onChange, title }: { value: ChartKind; onChange: (k: ChartKind) => void; title: string }) {
  const [open, setOpen] = useState(false)
  const root = useRef<HTMLDivElement>(null)
  const close = useCallback(() => setOpen(false), [])
  useDismiss(open, root, close)
  return (
    <div ref={root} className="relative print:hidden">
      <button
        type="button"
        aria-haspopup="listbox"
        aria-expanded={open}
        aria-label={`รูปแบบกราฟ${title}`}
        onClick={() => setOpen((v) => !v)}
        className="flex items-center rounded-[7px] px-[2px] py-[6px] hover:bg-blue-bg"
      >
        <span className="pt-[2px] pr-[2px] pb-[3px] text-[10px] leading-[normal] font-light whitespace-nowrap text-blue-00">{kindLabel[value]}</span>
        <img src={caret} alt="" width={12} height={12} className="my-[2px]" />
      </button>
      {open && (
        <ul role="listbox" className="absolute top-[calc(100%+4px)] right-0 z-30 w-[170px] animate-[menu-in_120ms_ease-out] rounded-[12px] bg-white px-[4px] py-[8px] drop-shadow-[0px_4px_10px_rgba(0,0,0,0.15)]">
          {(Object.keys(kindLabel) as ChartKind[]).map((k) => (
            <li key={k}>
              <button
                type="button"
                role="option"
                aria-selected={k === value}
                onClick={() => {
                  onChange(k)
                  setOpen(false)
                }}
                className={`h-[38px] w-full rounded-[6px] px-[12px] text-left text-[12px] font-light text-black hover:bg-blue-bg ${k === value ? 'bg-blue-bg' : ''}`}
              >
                {kindLabel[k]}
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}

function Donut({ s }: { s: ResultSeries }) {
  const total = s.items.reduce((a, b) => a + b.value, 0)
  const R = 70
  const C = 2 * Math.PI * R
  let offset = 0
  const top = [...s.items].sort((a, b) => b.value - a.value)
  const callouts = s.items.length <= 3 ? top.slice(0, 2) : top.slice(0, 1)
  return (
    <div className="flex items-center justify-center gap-[48px] px-[24px] max-sm:flex-col max-sm:gap-[24px]">
      <div className="relative h-[177px] w-[196px] shrink-0">
        <svg viewBox="0 0 177 177" className="absolute top-0 left-[11px] size-[177px] -rotate-90" role="img" aria-label={`${s.title}: ${s.items.map((i) => `${i.label} ${pct(i.value, total).toFixed(2)}%`).join(', ')}`}>
          {s.items.map((it) => {
            const len = (it.value / (total || 1)) * C
            const el = (
              <circle key={it.label} cx="88.5" cy="88.5" r={R} fill="none" stroke={it.color} strokeWidth="37" strokeDasharray={`${len} ${C - len}`} strokeDashoffset={-offset}>
                <title>{`${it.label}: ${it.value.toLocaleString('th-TH')} ${s.unit}`}</title>
              </circle>
            )
            offset += len
            return el
          })}
        </svg>
        {callouts.map((it, i) => (
          <span
            key={it.label}
            className={`absolute flex items-center gap-[12px] rounded-[4px] border border-gray-line bg-white px-[8px] py-[4px] ${i === 0 ? 'top-[9px] left-0' : 'top-[139px] left-[120px]'}`}
          >
            <span className="size-[12px] rounded-full" style={{ background: it.color }} />
            <span className="text-[10px] font-medium text-gray-20">{pct(it.value, total).toFixed(2)}%</span>
          </span>
        ))}
      </div>
      <ul className="flex flex-col gap-[12px]">
        {s.items.map((it) => (
          <li key={it.label} className="flex items-center gap-[12px]" title={`${it.value.toLocaleString('th-TH')} ${s.unit} (${pct(it.value, total).toFixed(2)}%)`}>
            <span className="size-[12px] shrink-0 rounded-full" style={{ background: it.color }} />
            <span className="text-[10px] font-medium whitespace-nowrap text-gray-20">{it.label}</span>
          </li>
        ))}
      </ul>
    </div>
  )
}

function BarsVertical({ s }: { s: ResultSeries }) {
  const max = niceMax(Math.max(...s.items.map((i) => i.value)))
  const ticks = [4, 3, 2, 1, 0].map((k) => (max / 4) * k)
  return (
    <div className="flex px-[24px]">
      <div className="flex h-[186px] flex-col gap-[8px]">
        <div className="flex flex-1 flex-col justify-between">
          {ticks.map((t) => (
            <span key={t} className="flex h-[13px] items-center pr-[8px] text-[10px] font-light text-black">
              {t}
            </span>
          ))}
        </div>
        <div className="h-[13px]" />
      </div>
      <div className="flex min-w-0 flex-1">
        {s.items.map((it) => (
          <div key={it.label} className="flex min-w-0 flex-1 flex-col items-center gap-[8px]">
            <div className="relative flex h-[165px] w-full flex-col justify-between">
              {ticks.map((t) => (
                <div key={t} aria-hidden="true" className="flex h-[13px] items-center">
                  <span className="h-px w-full bg-gray-line-2" />
                </div>
              ))}
              <div className="absolute inset-x-[27%] bottom-[6.5px] flex h-[152px] items-end">
                <div
                  title={`${it.label}: ${it.value.toLocaleString('th-TH')} ${s.unit}`}
                  className="w-full rounded-t-[4px] transition-[height] duration-500"
                  style={{ height: `${(it.value / max) * 100}%`, background: it.color }}
                />
              </div>
            </div>
            <span className="h-[13px] w-full truncate text-center text-[10px] font-light text-black">{it.label}</span>
          </div>
        ))}
      </div>
    </div>
  )
}

function BarsHorizontal({ s }: { s: ResultSeries }) {
  const max = niceMax(Math.max(...s.items.map((i) => i.value)))
  return (
    <div className="flex flex-col pr-[48px] pl-[24px]">
      {s.items.map((it) => (
        <div key={it.label} className="flex h-[53px] items-center gap-[12px]">
          <span className="w-[68px] shrink-0 text-right text-[10px] font-light text-black">{it.label}</span>
          <div className="relative h-full flex-1">
            <div aria-hidden="true" className="absolute inset-0 grid grid-cols-4">
              {[0, 1, 2, 3].map((c) => (
                <span key={c} className="border-l border-gray-line-2 last:border-r" />
              ))}
            </div>
            <div className="absolute inset-y-[12px] left-0 flex w-full items-center">
              <div
                title={`${it.label}: ${it.value.toLocaleString('th-TH')} ${s.unit}`}
                className="h-full rounded-r-[3px] transition-[width] duration-500"
                style={{ width: `${(it.value / max) * 100}%`, background: it.color, minWidth: it.value > 0 ? 2 : 0 }}
              />
            </div>
          </div>
        </div>
      ))}
    </div>
  )
}

/** Figma PieChart / BarChart cards in Result-Responses (123:6436 / 123:6500 / 123:6513) */
/** `plain` = Figma OSS-Meeting/Detail-2 cards: fixed chart type, no border, regular title */
export default function ResultChart({ s, plain = false }: { s: ResultSeries; plain?: boolean }) {
  const [kind, setKind] = useState<ChartKind>(s.defaultKind)
  return (
    <article aria-labelledby={`chart-${s.key}`} className={`flex min-w-0 flex-col gap-[12px] rounded-[12px] bg-white py-[24px] break-inside-avoid ${plain ? '' : 'border border-gray-line'}`}>
      <div className="flex items-center gap-[12px] px-[24px]">
        <h3 id={`chart-${s.key}`} className={`flex-1 text-[14px] leading-[normal] ${plain ? 'font-medium text-ink opacity-90' : 'font-semibold text-blue-title'}`}>
          {s.title}
        </h3>
        {!plain && <KindSelect value={kind} onChange={setKind} title={s.title} />}
      </div>
      {kind !== 'pie' && <p className="px-[24px] text-right text-[11px] text-gray-30">หน่วย : {s.unit}</p>}
      {kind === 'pie' ? <Donut s={s} /> : kind === 'bar-v' ? <BarsVertical s={s} /> : <BarsHorizontal s={s} />}
    </article>
  )
}
