import { useState } from 'react'
import donutBlue from '../../assets/dashboard/donut-blue.svg'
import donutGray from '../../assets/dashboard/donut-gray.svg'
import donutLight from '../../assets/dashboard/donut-light.svg'
import dotDonutBlue from '../../assets/dashboard/dot-donut-blue.svg'
import dotDonutLight from '../../assets/dashboard/dot-donut-light.svg'
import gridLine from '../../assets/dashboard/vbar-grid.svg'
import { councilsByRegion } from '../../data/dashboard'
import PeriodSelect from './PeriodSelect'

const yTicks = [1000, 750, 500, 250, 0]
const Y_MAX = 1000
/** Plot height between the top (1000) and bottom (0) grid lines */
const PLOT_H = 152

function CardHeader({ title, subtitle, id }: { title: string; subtitle: string; id: string }) {
  const [period, setPeriod] = useState('6 เดือนล่าสุด')
  return (
    <div className="flex items-start gap-[12px] px-[24px] max-sm:px-[16px]">
      <div className="flex min-w-0 flex-1 flex-col gap-[4px] leading-[normal]">
        <h3 id={id} className="text-[14px] font-medium text-blue-title">
          {title}
        </h3>
        <p className="text-[10px] font-light text-gray-30">{subtitle}</p>
      </div>
      <PeriodSelect value={period} onChange={setPeriod} label={`ช่วงเวลา ${subtitle}`} />
    </div>
  )
}

function RegionBarChart() {
  return (
    <article aria-labelledby="council-bar" className="flex h-[270px] min-w-0 flex-col gap-[12px] rounded-[12px] border border-gray-line bg-white py-[24px]">
      <CardHeader id="council-bar" title="สภาองค์กรชุมชน" subtitle="จำนวนตำบลทั้งหมดกับจำนวนสภาองค์กรที่จัดตั้ง" />
      <div className="flex items-start px-[24px] max-sm:px-[16px]">
        {/* y-axis labels */}
        <div className="flex h-[186px] shrink-0 flex-col gap-[8px]">
          <div className="flex flex-1 flex-col justify-between">
            {yTicks.map((t) => (
              <span key={t} className="flex h-[13px] items-center pr-[8px] text-[10px] leading-[normal] font-light text-black">
                {t}
              </span>
            ))}
          </div>
          <div className="h-[13px]" />
        </div>

        {councilsByRegion.map((r) => (
          <div key={r.region} className="flex min-w-0 flex-1 flex-col items-center gap-[8px]">
            <div className="relative flex h-[165px] w-full flex-col justify-between">
              {yTicks.map((t) => (
                <div key={t} aria-hidden="true" className="relative h-[13px] w-full">
                  <div className="absolute inset-[0_-1.11%]">
                    <img src={gridLine} alt="" className="block size-full max-w-none" />
                  </div>
                </div>
              ))}
              <div className="absolute inset-x-[15.56%] bottom-[6.5px] flex items-end" style={{ height: PLOT_H }}>
                {[
                  { v: r.subdistricts, label: 'ตำบลทั้งหมด', cls: 'bg-blue-20' },
                  { v: r.councils, label: 'สภาองค์กรที่จัดตั้ง', cls: 'bg-blue-00' },
                ].map((b) => (
                  <div
                    key={b.label}
                    title={`${r.region} · ${b.label}: ${b.v.toLocaleString('th-TH')}`}
                    className={`min-w-0 flex-1 rounded-t-[4px] ${b.cls} transition-[height] duration-500 hover:brightness-95`}
                    style={{ height: `${(b.v / Y_MAX) * 100}%` }}
                  />
                ))}
              </div>
            </div>
            <span className="flex h-[13px] w-full items-center justify-center truncate text-center text-[10px] leading-[normal] font-light text-black">
              {r.region}
            </span>
          </div>
        ))}
      </div>
    </article>
  )
}

function WelfareDonut() {
  return (
    <article aria-labelledby="council-donut" className="flex min-w-0 flex-col gap-[12px] rounded-[12px] border border-gray-line bg-white py-[24px]">
      <CardHeader id="council-donut" title="สภาองค์กรชุมชน" subtitle="จำนวนสภาองค์กรชุมชนที่ขอรับเงินกองทุนสวัสดิการ" />
      <div className="flex items-center justify-center px-[24px]">
        <div
          role="img"
          aria-label="สัดส่วน 64.54% และ 34.40%"
          className="relative h-[177px] w-[196px] shrink-0"
        >
          <div className="absolute top-0 left-[11.13px] size-[177px]">
            <div className="absolute inset-[44.65%_0_0_1.83%]">
              <img src={donutLight} alt="" className="block size-full max-w-none" />
            </div>
            <div className="absolute inset-[0_0_35.16%_0]">
              <img src={donutBlue} alt="" className="block size-full max-w-none" />
            </div>
            <div className="absolute inset-[44.65%_0_47.12%_79.55%]">
              <img src={donutGray} alt="" className="block size-full max-w-none" />
            </div>
          </div>
          {[
            { value: '64.54%', dot: dotDonutBlue, pos: 'top-[9px] left-0' },
            { value: '34.40%', dot: dotDonutLight, pos: 'top-[139px] left-[120px]' },
          ].map((l) => (
            <span
              key={l.value}
              className={`absolute ${l.pos} flex items-center gap-[12px] rounded-[4px] border border-gray-line bg-white px-[8px] py-[4px]`}
            >
              <img src={l.dot} alt="" width={12} height={12} />
              <span className="text-[10px] leading-[normal] font-medium whitespace-nowrap text-gray-20">{l.value}</span>
            </span>
          ))}
        </div>
      </div>
    </article>
  )
}

export default function CouncilCharts() {
  return (
    <section aria-label="สภาองค์กรชุมชน" className="grid grid-cols-1 items-start gap-[12px] rounded-[12px] bg-blue-20 p-[12px] lg:grid-cols-2">
      <RegionBarChart />
      <WelfareDonut />
    </section>
  )
}
