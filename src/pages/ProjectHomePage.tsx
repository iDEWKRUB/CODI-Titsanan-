import { useMemo } from 'react'
import { Link } from 'react-router-dom'
import { Crumbs, PersonaSwitch, Title, card, page } from '../components/project/Parts'
import { baht0, burn, curveActual, curvePlan, monthsTh, planBudget, ragOf, ragTone, spentOf, type Perf } from '../data/erpProject'
import { sumBy } from '../data/strategic'
import { useProposals, usePerfs } from '../lib/erpProjectStore'
import { usePlans } from '../lib/strategicStore'

const tone = ['bg-[#0885ff]', 'bg-[#30b3a1]', 'bg-[#ffa32b]']
const icons = ['M6 4h9l3 3v13H6ZM14 4v4h4M9 13h6M9 16h6', 'M4 7h16v12H4ZM4 11h16M9 15h2', 'M5 19V9M12 19V5M19 19v-7']

function Stat({ i, label, children, unit }: { i: number; label: string; children: string; unit: string }) {
  return (
    <article className={`flex items-center gap-[10px] rounded-[12px] px-[14px] py-[14px] text-white ${tone[i]}`}>
      <span className="flex size-[40px] shrink-0 items-center justify-center rounded-[10px] bg-white/25" aria-hidden="true">
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d={icons[i]} /></svg>
      </span>
      <p className="flex-1 text-[12px] leading-[1.3] font-medium whitespace-pre-line">{label}</p>
      <p className="flex flex-col items-end leading-none"><b className="font-urbanist text-[22px] font-bold whitespace-nowrap">{children}</b>{unit && <span className="mt-[4px] text-[10px]">{unit}</span>}</p>
    </article>
  )
}

/** ภาพรวมผลการดำเนินงานตามแผน (book 3 fig 2-12) — 2.1.3.1 : every figure is computed from the records of 2.1.3.2 and the approved proposals of 2.1.3.5 */
export default function ProjectHomePage() {
  const perfs = usePerfs()
  const proposals = useProposals()
  const plans = usePlans()
  const rows = useMemo(() => perfs.filter((p) => p.status !== 'draft' && p.year === '2568'), [perfs])
  const target = rows.reduce((a, p) => a + p.target, 0)
  const actual = rows.reduce((a, p) => a + p.progress, 0)
  const progressPct = target ? Math.round((actual / target) * 100) : 0
  const plan = rows.reduce((a, p) => a + planBudget(p), 0)
  const used = rows.reduce((a, p) => a + spentOf(p), 0)
  const usedPct = plan ? Math.round((used / plan) * 100) : 0
  const rag = rows.map((p) => ragOf(p))
  const on = rag.filter((r) => r === 'ปกติ').length
  const delayed = rag.length - on
  const late = rows.filter((p) => ragOf(p) !== 'ปกติ')
  const newProj = proposals.filter((p) => p.status === 'approved')
  const waiting = proposals.filter((p) => p.status === 'submitted').length
  const x = (i: number) => 40 + i * 30
  const line = (a: number[], max = 100) => a.map((v, i) => `${i ? 'L' : 'M'}${x(i)} ${220 - (v / max) * 190}`).join(' ')
  const delta = (p: Perf) => p.progress - p.target

  return (
    <div className={page}>
      <Title right={<PersonaSwitch />}>ภาพรวมผลการดำเนินงานตามแผน</Title>
      <Crumbs items={[{ label: 'หน้าแรก', to: '/project' }, { label: 'งานรายงานผลการดำเนินงาน' }]} />

      <section aria-label="ตัวชี้วัด" className="flex flex-col gap-[10px] rounded-[12px] bg-[#dbe9fb] p-[20px] max-sm:p-[12px]">
        <p className="text-[12px] font-light text-gray-30">ข้อมูลล่าสุด : 25 พฤศจิกายน 2568, 2.00 PM</p>
        <div className="grid grid-cols-3 gap-[12px] max-lg:grid-cols-1">
          <Stat i={0} label={'ผลการดำเนินงาน\nเทียบแผน (YTD)'} unit="of Plan">{`${progressPct}%`}</Stat>
          <Stat i={1} label={'งบประมาณใช้จริง /\nแผน (YTD)'} unit="of Plan">{`${usedPct}%`}</Stat>
          <Stat i={2} label="สถานะกิจกรรม" unit="">{`${on} On / ${delayed} Delay`}</Stat>
        </div>
      </section>

      <div className="grid grid-cols-2 gap-[12px] max-lg:grid-cols-1">
        <section aria-label="Actual vs Plan" className="rounded-[12px] bg-[#e8f5ff] p-[14px]">
          <h2 className="mb-[8px] text-[13px] font-semibold text-blue-dark">Actual vs Plan – ผลการดำเนินงานรายเดือน</h2>
          <div className="rounded-[8px] bg-white p-[12px]">
            <svg viewBox="0 0 400 260" role="img" aria-label="กราฟเส้นผลการดำเนินงานจริงเทียบแผนรายเดือน" className="w-full">
              {[0, 1, 2, 3].map((i) => <line key={i} x1="30" x2="390" y1={30 + i * 63} y2={30 + i * 63} stroke="#e5e6e6" />)}
              <path d={line(curvePlan)} fill="none" stroke="#9ec7fb" strokeWidth="2" /><path d={line(curveActual)} fill="none" stroke="#1565e0" strokeWidth="2" />
              {curveActual.map((v, i) => <circle key={i} cx={x(i)} cy={220 - (v / 100) * 190} r="3" fill="#1565e0"><title>{`${monthsTh[i]} จริง ${v}% / แผน ${curvePlan[i]}%`}</title></circle>)}
              {monthsTh.map((m, i) => <text key={m} x={x(i)} y="240" textAnchor="middle" fontSize="9" fill="#757d83">{m}</text>)}
              <rect x="300" y="4" width="9" height="9" fill="#9ec7fb" /><text x="313" y="12" fontSize="10" fill="#333e47">แผน</text>
              <rect x="342" y="4" width="9" height="9" fill="#1565e0" /><text x="355" y="12" fontSize="10" fill="#333e47">จริง</text>
            </svg>
          </div>
        </section>
        <section aria-label="Burn chart" className="rounded-[12px] bg-[#e8f5ff] p-[14px]">
          <h2 className="mb-[8px] text-[13px] font-semibold text-blue-dark">งบประมาณเบิกจ่าย – Burn Chart</h2>
          <div className="rounded-[8px] bg-white p-[12px]">
            <svg viewBox="0 0 400 260" role="img" aria-label="กราฟแท่งงบประมาณเบิกจ่ายสะสมรายเดือน" className="w-full">
              {[0, 1, 2, 3].map((i) => <line key={i} x1="30" x2="390" y1={30 + i * 63} y2={30 + i * 63} stroke="#e5e6e6" />)}
              {burn.map((b, i) => (
                <g key={i}>
                  <rect x={36 + i * 29} y={220 - (b.plan / 100) * 190} width="10" height={(b.plan / 100) * 190} rx="2" fill="#a7c8f5"><title>{`${monthsTh[i]} แผนสะสม ${b.plan}%`}</title></rect>
                  <rect x={47 + i * 29} y={220 - (b.used / 100) * 190} width="10" height={(b.used / 100) * 190} rx="2" fill="#4cc27a"><title>{`${monthsTh[i]} ใช้จริงสะสม ${b.used}%`}</title></rect>
                  <text x={46 + i * 29} y="240" textAnchor="middle" fontSize="9" fill="#757d83">{monthsTh[i]}</text>
                </g>
              ))}
              <rect x="300" y="4" width="9" height="9" fill="#a7c8f5" /><text x="313" y="12" fontSize="10" fill="#333e47">แผน</text>
              <rect x="342" y="4" width="9" height="9" fill="#4cc27a" /><text x="355" y="12" fontSize="10" fill="#333e47">ใช้จริง</text>
            </svg>
          </div>
        </section>
      </div>

      <section aria-label="รายงานตามโครงการ" className={`${card} overflow-hidden p-[18px]`}>
        <div className="mb-[8px] flex items-center justify-between"><h2 className="text-[13px] font-semibold text-blue-dark">รายงานตามโครงการ</h2><Link to="/project/records" className="flex items-center gap-[6px] text-[11px] text-gray-20 hover:text-blue-00">ทั้งหมด <span className="flex size-[18px] items-center justify-center rounded-full bg-blue-00 text-white" aria-hidden="true">›</span></Link></div>
        <div className="overflow-x-auto">
          <table className="w-full min-w-[820px] text-left text-[11px]">
            <thead className="text-[10px] font-light text-gray-20"><tr>{['โครงการ', 'ยุทธศาสตร์', 'เจ้าของ', 'เป้าหมาย (%)', 'ทำได้จริง (%)', 'ส่วนต่าง', 'งบแผน', 'ใช้จริง', 'RAG'].map((h) => <th key={h} className="py-[6px] pr-[8px] font-light">{h}</th>)}</tr></thead>
            <tbody>
              {rows.slice(0, 5).map((p) => {
                const r = ragOf(p)
                return (
                  <tr key={p.id} className="border-t border-gray-line-2">
                    <td className="py-[9px] pr-[8px] font-medium">{p.name}</td>
                    <td className="pr-[8px] font-light">{p.strategy || '-'}</td>
                    <td className="pr-[8px] font-light">{p.office}</td>
                    <td className="pr-[8px] font-urbanist">{p.target}%</td>
                    <td className="pr-[8px] font-urbanist">{p.progress}%</td>
                    <td className="pr-[8px]"><span className={`rounded-[5px] px-[6px] py-[2px] font-urbanist text-[10px] ${delta(p) < 0 ? 'bg-[#fff1d6] text-[#a8650b]' : 'bg-[#dff5e8] text-[#0f8a63]'}`}>{delta(p) > 0 ? '+' : ''}{delta(p)}%</span></td>
                    <td className="pr-[8px] font-urbanist whitespace-nowrap">{baht0(planBudget(p))} THB</td>
                    <td className="pr-[8px] font-urbanist whitespace-nowrap">{baht0(spentOf(p))} THB</td>
                    <td><span className={`rounded-[5px] px-[8px] py-[2px] text-[10px] whitespace-nowrap ${ragTone[r]}`}>{r}</span></td>
                  </tr>
                )
              })}
              {newProj.slice(0, 2).map((pr) => {
                const pl = plans.find((x) => x.id === pr.planId)
                const b = pl ? sumBy(pl.items, 'approved') || sumBy(pl.items, 'init') : 0
                return (
                  <tr key={`p${pr.id}`} className="border-t border-gray-line-2">
                    <td className="py-[9px] pr-[8px] font-medium">{pr.name}</td><td className="pr-[8px] font-light">{pr.kind}</td><td className="pr-[8px] font-light">{pr.office}</td>
                    <td className="pr-[8px] font-urbanist">0%</td><td className="pr-[8px] font-urbanist">0%</td><td className="pr-[8px]"><span className="rounded-[5px] bg-[#dff5e8] px-[6px] py-[2px] font-urbanist text-[10px] text-[#0f8a63]">0%</span></td>
                    <td className="pr-[8px] font-urbanist whitespace-nowrap">{baht0(b)} THB</td><td className="pr-[8px] font-urbanist">0 THB</td><td><span className="rounded-[5px] bg-[#e1f0ff] px-[8px] py-[2px] text-[10px] text-[#0b63c8]">เริ่มต้น</span></td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      </section>

      <div className="grid grid-cols-3 gap-[12px] max-lg:grid-cols-1">
        <section className={`${card} p-[16px]`} aria-label="วิเคราะห์เบื้องต้น">
          <h2 className="mb-[6px] text-[13px] font-semibold text-blue-dark">วิเคราะห์เบื้องต้น</h2>
          <ul className="list-disc pl-[16px] text-[11px] leading-[1.7] font-light text-gray-30">
            <li>ความคืบหน้ารวม {progressPct}% ของเป้าหมาย · ใช้งบ {usedPct}% ของแผน</li>
            <li>โครงการที่ตรงแผน {on} จาก {rag.length} โครงการ</li>
            <li>โครงการใหม่ที่อนุมัติแล้ว {newProj.length} · รอพิจารณา {waiting}</li>
          </ul>
        </section>
        <section className={`${card} p-[16px]`} aria-label="สาเหตุล่าช้า">
          <h2 className="mb-[6px] text-[13px] font-semibold text-blue-dark">สาเหตุล่าช้า</h2>
          <ul className="list-disc pl-[16px] text-[11px] leading-[1.7] font-light text-gray-30">
            {late.length ? late.slice(0, 3).map((p) => <li key={p.id}>{p.name}: {ragOf(p) === 'เกินงบ' ? 'ใช้จ่ายเกินงบ ' + baht0(spentOf(p) - planBudget(p)) + ' บาท' : `ล่าช้ากว่าเป้า ${Math.abs(delta(p))} จุด`}</li>) : <li>ไม่มีโครงการล่าช้า</li>}
          </ul>
        </section>
        <section className={`${card} p-[16px]`} aria-label="Action Plan">
          <h2 className="mb-[6px] text-[13px] font-semibold text-blue-dark">Action Plan ที่กำลังดำเนินการ</h2>
          <ul className="list-disc pl-[16px] text-[11px] leading-[1.7] font-light text-gray-30">
            <li>เร่งรัดงวดงานของโครงการที่ล่าช้าและรายงานในรอบไตรมาสหน้า</li>
            <li>ตรวจสอบใบแจ้งหนี้ของโครงการที่ใช้งบเกินแผน</li>
            <li>สำนักยุทธศาสตร์ฯ พิจารณาโครงการที่ส่งเข้ามา {waiting} โครงการ</li>
          </ul>
        </section>
      </div>
      <p className="text-[10px] font-light text-gray-10">ตัวเลขทั้งหมดคำนวณจากรายการผลการดำเนินงาน · กราฟรายเดือนเป็นข้อมูลตัวอย่าง รอเชื่อมระบบการเงิน</p>
    </div>
  )
}
