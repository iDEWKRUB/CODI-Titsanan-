import { useEffect, useRef, useState } from 'react'
import dotBlue from '../../assets/dashboard/dot-blue.svg'
import dotGray from '../../assets/dashboard/dot-gray.svg'
import dotGreen from '../../assets/dashboard/dot-green.svg'
import gridFirst from '../../assets/dashboard/hbar-grid-first.svg'
import gridMid from '../../assets/dashboard/hbar-grid.svg'
import gridLast from '../../assets/dashboard/hbar-grid-last.svg'
import iconFunnel from '../../assets/dashboard/icon-funnel.svg'
import { budgetTicks, projects } from '../../data/dashboard'
import Legend from './Legend'
import PeriodSelect from './PeriodSelect'

const series = [
  { key: 'budget', label: 'ตั้งงบ', color: 'bg-green', dot: dotGreen },
  { key: 'used', label: 'ใช้ดำเนินการ', color: 'bg-blue-00', dot: dotBlue },
  { key: 'remaining', label: 'คงเหลือ', color: 'bg-gray-20', dot: dotGray },
] as const
const gridCols = [gridFirst, gridMid, gridMid, gridLast, gridLast]
const tickLabels = ['0', '250K THB', '500K THB', '1M THB', '2.5M THB']
const thb = new Intl.NumberFormat('th-TH', { style: 'currency', currency: 'THB', maximumFractionDigits: 0 })

/** Position on the piecewise-linear budget axis, 0..1 */
function axisRatio(v: number) {
  const t = budgetTicks
  for (let i = 1; i < t.length; i++) {
    if (v <= t[i]) return (i - 1 + (v - t[i - 1]) / (t[i] - t[i - 1])) / (t.length - 1)
  }
  return 1
}

export default function ProjectBudgetChart() {
  const [period, setPeriod] = useState('6 เดือนล่าสุด')
  const scroller = useRef<HTMLDivElement>(null)
  const [thumb, setThumb] = useState<{ w: number; x: number } | null>(null)

  // Custom scroll indicator (Figma Rectangle 11) synced with the real horizontal scroll
  useEffect(() => {
    const el = scroller.current
    if (!el) return
    const update = () => {
      const { scrollWidth: sw, clientWidth: cw, scrollLeft: sl } = el
      setThumb(sw > cw + 1 ? { w: (cw / sw) * 100, x: (sl / sw) * 100 } : null)
    }
    update()
    el.addEventListener('scroll', update, { passive: true })
    const ro = new ResizeObserver(update)
    ro.observe(el)
    return () => {
      el.removeEventListener('scroll', update)
      ro.disconnect()
    }
  }, [])

  return (
    <section className="flex flex-col gap-[12px] rounded-[12px] border border-gray-line bg-white pt-[24px] pb-[8px]">
      <div className="flex flex-col gap-[12px]">
        <div className="flex h-[28px] items-center gap-[12px] px-[24px] max-sm:px-[16px]">
          <h2 className="min-w-0 flex-1 truncate text-[14px] leading-[normal] font-semibold text-blue-title">รายงานบริหารโครงการ</h2>
          <PeriodSelect value={period} onChange={setPeriod} label="ช่วงเวลารายงานบริหารโครงการ" />
          <button
            type="button"
            aria-label="ตัวกรอง"
            className="flex h-[28px] shrink-0 rounded-[5px] p-[4px] hover:bg-gray-subtle focus-visible:outline-2 focus-visible:outline-blue-00"
          >
            <img src={iconFunnel} alt="" width={20} height={20} />
          </button>
        </div>
        <div className="px-[24px] max-sm:px-[16px]">
          <Legend items={series} />
        </div>

        <div ref={scroller} className="overflow-x-auto scrollbar-none">
          <div className="min-w-[1040px] pr-[24px] max-sm:min-w-[760px]">
            <div className="flex flex-col pl-[128px]">
              {projects.map((p, i) => (
                <div key={i} className="relative flex h-[61.25px] w-full">
                  <div aria-hidden="true" className="flex h-full flex-1">
                    {gridCols.map((src, c) => (
                      <div key={c} className="relative h-full min-w-0 flex-1">
                        <div className="absolute inset-[-0.94%_0]">
                          <img src={src} alt="" className="block size-full max-w-none" />
                        </div>
                      </div>
                    ))}
                  </div>
                  {/* Bars span the first → last grid line */}
                  <div className="absolute inset-y-[3.77%] right-[9.96%] left-[10.17%] flex flex-col justify-end gap-[4px] py-[8px]">
                    {series.map((s) => (
                      <div
                        key={s.key}
                        title={`${s.label}: ${thb.format(p[s.key])}`}
                        className={`min-h-px flex-1 rounded-r-[3px] ${s.color} transition-[width] duration-500`}
                        style={{ width: `${axisRatio(p[s.key]) * 100}%` }}
                      />
                    ))}
                  </div>
                  <div className="absolute top-0 left-[-65.5px] flex h-[53px] w-[108px] flex-col justify-center text-right text-[10px] leading-[normal] font-light text-black">
                    <p className="line-clamp-3">
                      {p.code}
                      {p.year ? <br /> : ' '}
                      {p.name}
                      {p.year && (
                        <>
                          <br />
                          {p.year}
                        </>
                      )}
                    </p>
                  </div>
                </div>
              ))}
            </div>
            <div className="flex gap-[8px] pl-[101px]">
              <div className="h-[13px] w-[19px] shrink-0" />
              <div className="flex flex-1">
                {tickLabels.map((t) => (
                  <span key={t} className="flex h-[13px] min-w-0 flex-1 items-center justify-center text-[10px] leading-[normal] font-light text-black">
                    {t}
                  </span>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="px-[24px] pt-[24px] pb-[4px]">
        <div className="relative h-[6px] w-full">
          {thumb ? (
            <div className="absolute top-0 h-[6px] rounded-[40px] bg-gray-5" style={{ width: `${thumb.w}%`, left: `${thumb.x}%` }} />
          ) : (
            <div className="h-[6px] w-[388px] max-w-full rounded-[40px] bg-gray-5" />
          )}
        </div>
      </div>
    </section>
  )
}
