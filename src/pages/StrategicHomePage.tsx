import { useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { Crumbs, PersonaSwitch, Title, card, page } from '../components/strategic/Parts'
import { baht, disbursements, levelLabel, levelOf, levelTone, monthly, projects, spentRatio, sumBy } from '../data/strategic'
import { usePlans, useRisks } from '../lib/strategicStore'

const tone = ['bg-[#0885ff]', 'bg-[#30b3a1]', 'bg-[#ffa32b]', 'bg-[#ff4783]']
const stateTone: Record<string, string> = { ตรงแผน: 'bg-[#dff5e8] text-[#0f8a63]', ล่าช้า: 'bg-[#fff1d6] text-[#a8650b]', เริ่มต้น: 'bg-[#e1f0ff] text-[#0b63c8]', เกินงบ: 'bg-[#fde2e2] text-[#c0262d]' }
const payTone: Record<string, string> = { อนุมัติแล้ว: 'bg-[#e1f0ff] text-[#0b63c8]', รออนุมัติ: 'bg-[#fff1d6] text-[#a8650b]', จ่ายแล้ว: 'bg-[#dff5e8] text-[#0f8a63]' }

function Stat({ i, label, value, unit }: { i: number; label: string; value: string; unit?: string }) {
  return (
    <article className={`flex items-center gap-[10px] rounded-[12px] px-[14px] py-[14px] text-white ${tone[i]}`}>
      <span className="flex size-[40px] shrink-0 items-center justify-center rounded-[10px] bg-white/25" aria-hidden="true">
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
          <path d={['M12 3 3 19h18Z M12 10v4M12 17v.2', 'M12 3 3 19h18Z M12 10v4M12 17v.2', 'M4 7h16v12H4ZM4 11h16M9 15h2', 'M5 19V9M12 19V5M19 19v-7'][i]} />
        </svg>
      </span>
      <p className="flex-1 text-[12px] leading-[1.3] font-medium">{label}</p>
      <p className="flex flex-col items-end leading-none"><b className="font-urbanist text-[22px] font-bold" aria-live="polite">{value}</b>{unit && <span className="mt-[4px] text-[10px]">{unit}</span>}</p>
    </article>
  )
}

/** ภาพรวมยุทธศาสตร์ (book 3 fig 2-5) — 2.1.2.1 */
export default function StrategicHomePage() {
  const risks = useRisks()
  const plans = usePlans()
  const [pick, setPick] = useState<string | null>(null)
  const open = useMemo(() => risks.filter((r) => r.status !== 'closed'), [risks])
  const high = open.filter((r) => levelOf(r) >= 15)
  const budget = useMemo(() => plans.filter((p) => p.status === 'approved' && p.fiscalYear === '2568').reduce((a, p) => a + sumBy(p.items, 'approved'), 0), [plans])
  const latest = useMemo(() => [...risks].sort((a, b) => b.updatedAt.localeCompare(a.updatedAt)).slice(0, 5), [risks])
  const cells = useMemo(() => {
    const m = new Map<string, typeof open>()
    for (const r of open) m.set(`${r.impact},${r.likelihood}`, [...(m.get(`${r.impact},${r.likelihood}`) ?? []), r])
    return m
  }, [open])
  const maxBar = Math.max(...monthly.flatMap((m) => [m.plan, m.used]))
  const sel = pick ? cells.get(pick) : undefined

  return (
    <div className={page}>
      <Title right={<PersonaSwitch />}>ภาพรวมยุทธศาสตร์</Title>
      <Crumbs items={[{ label: 'หน้าแรก', to: '/strategic' }, { label: 'งานจัดการแผนยุทธศาสตร์องค์กร' }]} />

      <section aria-label="ตัวชี้วัด" className="flex flex-col gap-[10px] rounded-[12px] bg-[#dbe9fb] p-[20px] max-sm:p-[12px]">
        <p className="text-[12px] font-light text-gray-30">ข้อมูลล่าสุด : 25 พฤศจิกายน 2568, 2.00 PM</p>
        <div className="grid grid-cols-4 gap-[12px] max-xl:grid-cols-2 max-sm:grid-cols-1">
          <Stat i={0} label="ความเสี่ยงทั้งหมด" value={String(open.length)} unit="รายการ" />
          <Stat i={1} label="ความเสี่ยงระดับสูง" value={String(high.length)} unit="รายการ" />
          <Stat i={2} label="งบประมาณรวม" value={`${(budget / 1_000_000).toFixed(budget % 1_000_000 ? 1 : 0)}M`} unit="THB" />
          <Stat i={3} label="ใช้จ่ายแล้ว" value={`${Math.round(spentRatio * 100)}%`} />
        </div>
      </section>

      <div className="grid grid-cols-2 gap-[12px] max-lg:grid-cols-1">
        <section aria-label="Risk Matrix" className="rounded-[12px] bg-[#e8f5ff] p-[14px]">
          <h2 className="mb-[8px] text-[13px] font-semibold text-blue-dark">Risk Matrix (Impact × Likelihood)</h2>
          <div className="rounded-[8px] bg-white p-[12px]">
            <svg viewBox="0 0 400 270" role="img" aria-label="กราฟ Risk Matrix 5×5" className="w-full">
              {Array.from({ length: 5 }, (_, i) => (
                <g key={i}>
                  <line x1={50 + i * 72} y1="14" x2={50 + i * 72} y2="226" stroke="#e5e6e6" />
                  <line x1="50" y1={226 - i * 53} x2="374" y2={226 - i * 53} stroke="#e5e6e6" />
                  <text x={50 + i * 72} y="244" textAnchor="middle" fontSize="10" fill="#757d83">{i + 1}</text>
                  <text x="38" y={230 - i * 53} textAnchor="end" fontSize="10" fill="#757d83">{i + 1}</text>
                </g>
              ))}
              <text x="212" y="262" textAnchor="middle" fontSize="10" fill="#757d83">Impact (1→5)</text>
              <text x="12" y="120" fontSize="10" fill="#757d83" transform="rotate(-90 12 120)">Likelihood</text>
              {[...cells.entries()].map(([k, list]) => {
                const [x, y] = k.split(',').map(Number)
                const hi = x * y >= 15
                return (
                  <g key={k} tabIndex={0} role="button" aria-label={`${list.length} ความเสี่ยง ที่ Impact ${x} Likelihood ${y}`} onClick={() => setPick(pick === k ? null : k)} onKeyDown={(e) => e.key === 'Enter' && setPick(pick === k ? null : k)} className="cursor-pointer outline-none">
                    <circle cx={50 + (x - 1) * 72} cy={226 - (y - 1) * 53} r={6 + Math.min(list.length, 4) * 1.5} fill={hi ? '#e5484d' : x * y >= 8 ? '#f59a3c' : '#17c3a1'} opacity={pick === k ? 1 : 0.85} stroke={pick === k ? '#00357d' : 'none'} strokeWidth="2" />
                    {list.length > 1 && <text x={50 + (x - 1) * 72} y={230 - (y - 1) * 53} textAnchor="middle" fontSize="9" fontWeight="700" fill="#fff">{list.length}</text>}
                  </g>
                )
              })}
            </svg>
            {sel && (
              <ul className="mt-[6px] border-t border-gray-line-2 pt-[6px] text-[11px]" aria-live="polite">
                {sel.map((r) => <li key={r.id} className="flex justify-between gap-[8px] py-[2px]"><span>{r.code} · {r.name}</span><span className="text-gray-20">{r.owner}</span></li>)}
              </ul>
            )}
          </div>
        </section>

        <section aria-label="งบประมาณตามเดือน" className="rounded-[12px] bg-[#e8f5ff] p-[14px]">
          <h2 className="mb-[8px] text-[13px] font-semibold text-blue-dark">งบประมาณตามเดือน (แผน vs ใช้จริง)</h2>
          <div className="rounded-[8px] bg-white p-[12px]">
            <svg viewBox="0 0 400 270" role="img" aria-label="กราฟแท่งงบประมาณรายเดือน" className="w-full">
              {[0, 1, 2, 3].map((i) => <line key={i} x1="30" x2="390" y1={30 + i * 60} y2={30 + i * 60} stroke="#e5e6e6" />)}
              {monthly.map((m, i) => (
                <g key={m.m}>
                  <rect x={46 + i * 44} y={210 - (m.plan / maxBar) * 170} width="14" height={(m.plan / maxBar) * 170} rx="2" fill="#4a90f2"><title>{`${m.m} แผน ${m.plan}`}</title></rect>
                  <rect x={62 + i * 44} y={210 - (m.used / maxBar) * 170} width="14" height={(m.used / maxBar) * 170} rx="2" fill="#5ed098"><title>{`${m.m} ใช้จริง ${m.used}`}</title></rect>
                  <text x={61 + i * 44} y="228" textAnchor="middle" fontSize="10" fill="#757d83">{m.m}</text>
                </g>
              ))}
              <rect x="300" y="6" width="9" height="9" fill="#4a90f2" /><text x="313" y="14" fontSize="10" fill="#333e47">แผน</text>
              <rect x="342" y="6" width="9" height="9" fill="#5ed098" /><text x="355" y="14" fontSize="10" fill="#333e47">ใช้จริง</text>
            </svg>
          </div>
        </section>
      </div>

      <section aria-label="ความคืบหน้าโครงการเทียบงบประมาณ" className={`${card} p-[18px]`}>
        <h2 className="mb-[10px] text-[13px] font-semibold text-blue-dark">ความคืบหน้าโครงการเทียบงบประมาณ</h2>
        <div className="grid grid-cols-2 gap-[12px] max-md:grid-cols-1">
          {projects.map((p) => (
            <article key={p.name} className="rounded-[10px] bg-gray-bg/60 p-[14px]">
              <div className="flex items-center justify-between gap-[8px]"><h3 className="text-[13px] font-semibold">{p.name}</h3><span className={`rounded-full px-[10px] py-[2px] text-[10px] font-medium ${stateTone[p.state]}`}>{p.state}</span></div>
              {([['Progress', p.progress, '#00357d'], ['Budget Used', p.used, p.used > p.progress ? '#e5484d' : '#00357d']] as const).map(([l, v, c]) => (
                <div key={l} className="mt-[8px] grid grid-cols-[84px_minmax(0,1fr)_36px] items-center gap-[8px] text-[10px] text-gray-30">
                  <span>{l}</span>
                  <span className="h-[5px] rounded-full bg-gray-line" role="progressbar" aria-valuenow={v} aria-valuemin={0} aria-valuemax={100} aria-label={`${p.name} ${l}`}><span className="block h-full rounded-full" style={{ width: v + '%', background: c }} /></span>
                  <b className="text-right font-urbanist font-semibold">{v}%</b>
                </div>
              ))}
            </article>
          ))}
        </div>
      </section>

      <div className="grid grid-cols-2 gap-[12px] max-lg:grid-cols-1">
        <section aria-label="รายการความเสี่ยงล่าสุด" className={`${card} overflow-hidden p-[18px]`}>
          <div className="mb-[8px] flex items-center justify-between"><h2 className="text-[13px] font-semibold text-blue-dark">รายการความเสี่ยงล่าสุด</h2><Link to="/strategic/risk/report" className="flex items-center gap-[6px] text-[11px] text-gray-20 hover:text-blue-00">ทั้งหมด <span className="flex size-[18px] items-center justify-center rounded-full bg-blue-00 text-white">›</span></Link></div>
          <table className="w-full text-left text-[11px]">
            <thead className="text-[10px] font-light text-gray-20"><tr><th className="py-[6px] font-light">รายการ</th><th className="font-light">ระดับ</th><th className="font-light">หน่วยงาน</th><th className="font-light">วันที่อัปเดต</th></tr></thead>
            <tbody>
              {latest.map((r) => (
                <tr key={r.id} className="border-t border-gray-line-2">
                  <td className="py-[9px] pr-[6px] font-normal">{r.name}</td>
                  <td><span className={`rounded-[5px] px-[8px] py-[2px] text-[10px] ${levelTone(levelOf(r))}`}>{levelLabel(levelOf(r))}</span></td>
                  <td className="pr-[6px] font-light">{r.owner}</td>
                  <td className="font-light whitespace-nowrap">{r.updatedAt.slice(0, 10)}<br /><span className="text-[10px] text-gray-20">{r.updatedAt.slice(11)}</span></td>
                </tr>
              ))}
            </tbody>
          </table>
        </section>
        <section aria-label="รายการเบิกจ่ายล่าสุด" className={`${card} overflow-hidden p-[18px]`}>
          <div className="mb-[8px] flex items-center justify-between"><h2 className="text-[13px] font-semibold text-blue-dark">รายการเบิกจ่ายล่าสุด</h2><span className="flex items-center gap-[6px] text-[11px] text-gray-20">ทั้งหมด <span className="flex size-[18px] items-center justify-center rounded-full bg-blue-00 text-white">›</span></span></div>
          <table className="w-full text-left text-[11px]">
            <thead className="text-[10px] font-light text-gray-20"><tr><th className="py-[6px] font-light">เลขที่เอกสาร</th><th className="font-light">รายการ</th><th className="text-right font-light">จำนวนเงิน</th><th className="pl-[10px] font-light">สถานะ</th></tr></thead>
            <tbody>
              {disbursements.map((d) => (
                <tr key={d.no} className="border-t border-gray-line-2">
                  <td className="py-[9px] pr-[6px] font-urbanist font-light">{d.no}</td>
                  <td className="pr-[6px] font-normal">{d.name}</td>
                  <td className="text-right font-urbanist whitespace-nowrap">{baht(d.amount).replace('.00', '')} THB</td>
                  <td className="pl-[10px]"><span className={`rounded-[5px] px-[8px] py-[2px] text-[10px] whitespace-nowrap ${payTone[d.state]}`}>{d.state}</span></td>
                </tr>
              ))}
            </tbody>
          </table>
          <p className="mt-[8px] text-[10px] font-light text-gray-10">ข้อมูลเบิกจ่ายและความคืบหน้าโครงการเป็นตัวอย่าง รอเชื่อมระบบการเงินและโครงการ</p>
        </section>
      </div>
    </div>
  )
}
