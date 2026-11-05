import overviewBg from '../../assets/dashboard/overview-bg.webp'
import iconSquares from '../../assets/dashboard/icon-squares-four-blue.svg'
import decoOutline from '../../assets/dashboard/stat-deco-outline.svg'
import deco1 from '../../assets/dashboard/stat-deco-1.svg'
import deco2 from '../../assets/dashboard/stat-deco-2.svg'
import deco3 from '../../assets/dashboard/stat-deco-3.svg'
import deco4 from '../../assets/dashboard/stat-deco-4.svg'
import { overviewUpdatedAt, stats, type StatKey } from '../../data/dashboard'
import StatIcon from './StatIcon'

const theme: Record<StatKey, { bg: string; deco: string }> = {
  councils: { bg: 'bg-[#0885ff]', deco: deco1 },
  organizations: { bg: 'bg-[#30b3a1]', deco: deco2 },
  members: { bg: 'bg-[#ffa32b]', deco: deco3 },
  funds: { bg: 'bg-[#ff4783]', deco: deco4 },
}

const nf = new Intl.NumberFormat('en-US')

export default function OverviewStats() {
  return (
    <section className="relative isolate flex flex-col gap-[12px] overflow-hidden rounded-[12px] bg-[#dbe9fb] p-[24px] max-sm:p-[16px]">
      <img
        src={overviewBg}
        alt=""
        aria-hidden="true"
        className="pointer-events-none absolute top-[-70px] right-[-200px] -z-10 w-[1500px] max-w-none select-none"
      />

      <div className="flex items-center gap-[10px] pt-[28px] max-sm:pt-0">
        <img src={iconSquares} alt="" width={24} height={24} />
        <h1 className="text-[20px] leading-[1.2] font-semibold text-blue-00">ภาพรวมองค์กร</h1>
      </div>
      <p className="text-[12px] leading-[normal] font-light text-gray-30">ข้อมูลล่าสุด : {overviewUpdatedAt}</p>

      <div className="grid grid-cols-1 gap-[12px] sm:grid-cols-2 xl:grid-cols-4">
        {stats.map((s) => (
          <article key={s.key} className={`relative flex items-center overflow-hidden rounded-[12px] ${theme[s.key].bg}`}>
            {/* Brand shape watermark (Figma 169:9770) */}
            <div aria-hidden="true" className="absolute top-0 right-[0.25px] bottom-0 aspect-[156/128] overflow-hidden opacity-40">
              <div className="absolute top-[-59.38%] right-[18.16px] bottom-[-38.28%] aspect-[259/253] overflow-hidden">
                <img src={theme[s.key].deco} alt="" className="absolute top-[13.83%] right-[-0.05px] bottom-0 block aspect-[245/218] h-[86.17%] max-w-none" />
                <div className="absolute top-[0.4%] right-[4.95px] bottom-[10.67%] aspect-[253/225]">
                  <div className="absolute inset-[-0.69%_-0.61%]">
                    <img src={decoOutline} alt="" className="block size-full max-w-none" />
                  </div>
                </div>
              </div>
            </div>

            <div className="relative flex min-w-0 flex-1 items-center gap-[8px] p-[12px]">
              <StatIcon kind={s.key} />
              <p className="w-[104px] shrink-0 text-[12px] leading-[normal] font-medium text-white">
                {s.label[0]}
                <br />
                {s.label[1]}
              </p>
              <div className="flex h-[59px] min-w-0 flex-1 flex-col items-end justify-center gap-[8px] text-right text-white">
                <p className="text-[20px] leading-[1.2] font-bold">{nf.format(s.value)}</p>
                <p className="text-[10px] leading-[normal] font-medium">{s.unit}</p>
              </div>
            </div>
          </article>
        ))}
      </div>
    </section>
  )
}
