import { useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { useToast } from '../components/leader/Parts'
import Select from '../components/ui/Select'
import { Crumbs, GPersonaSwitch, GSection, RiskPill, Title, card, page, ro } from '../components/funding/Parts'
import { accruedProfit, actualSeries, fyOf, gMonths, kindLabel, money, planSeries, years, type Kind } from '../data/erpFunding'
import { useInvs } from '../lib/erpFundingStore'

const ALL = 'ทั้งปี'

/** สรุปการลงทุน (book 3 fig 2-25) — 2.1.5.3 ; every figure is computed from the approved investments (อยู่ระหว่างลงทุน / เสร็จสิ้น) */
export default function FundingSummaryPage() {
  const all = useInvs()
  const [toast, show] = useToast()
  const [fy, setFy] = useState('2569')
  const [qt, setQt] = useState(ALL)
  const [tab, setTab] = useState<'all' | Kind>('all')
  const live = useMemo(() => all.filter((i) => i.status !== 'draft'), [all])
  const rows = useMemo(() => live.filter((i) => { const f = fyOf(i.start); return f.fy === fy && (qt === ALL || String(f.q) === qt) }), [live, fy, qt])
  const shown = rows.filter((i) => tab === 'all' || i.kind === tab)

  const invested = rows.reduce((a, i) => a + i.amount, 0)
  const profit = rows.reduce((a, i) => a + accruedProfit(i), 0)
  const avgRet = invested ? rows.reduce((a, i) => a + i.ret * i.amount, 0) / invested : 0
  const avgLv = invested ? rows.reduce((a, i) => a + i.lv * i.amount, 0) / invested : 0
  const policy = rows.length ? (rows.filter((i) => i.dividend === 'มี').length >= rows.length / 2 ? 'มี' : 'ไม่มี') : '-'

  const x = (i: number) => 30 + i * 30
  const maxY = 10
  const exportCsv = () => {
    const head = ['ลำดับ', 'ชื่อ', 'ประเภท', 'ปีงบประมาณ', 'ไตรมาส', 'จำนวนเงินลงทุน(บาท)', 'นโยบายปันผล', 'ผลตอบแทนเฉลี่ย(%)', 'ระดับความเสี่ยง', 'สถานะ']
    const csv = '﻿' + [head, ...shown.map((i, n) => [n + 1, i.name, kindLabel[i.kind], fyOf(i.start).fy, fyOf(i.start).q, i.amount, i.dividend, i.ret, i.lv, i.status === 'done' ? 'เสร็จสิ้น' : 'อยู่ระหว่างลงทุน'])].map((r) => r.map((c) => `"${c}"`).join(',')).join('\r\n')
    const a = document.createElement('a')
    a.href = URL.createObjectURL(new Blob([csv], { type: 'text/csv;charset=utf-8' }))
    a.download = `สรุปการลงทุน-${fy}.csv`
    a.click()
    URL.revokeObjectURL(a.href)
    show(`ออกรายงาน ${shown.length} รายการแล้ว`)
  }
  const metric = (label: string, v: string, unit: string, tone = '') => (
    <div className="grid grid-cols-[1fr_190px_40px] items-center gap-[10px] max-sm:grid-cols-[1fr_auto]">
      <span className="text-[12px] font-semibold">{label}</span>
      <input aria-label={label} readOnly className={`${ro} text-right font-urbanist ${tone}`} value={v} />
      <span className="text-[12px] font-light text-gray-20 max-sm:hidden">{unit}</span>
    </div>
  )

  return (
    <div className={`${page} items-center`}>
      <div className="flex w-full max-w-[860px] flex-col gap-[12px]">
        <Title back="/funding" right={<GPersonaSwitch />}>สรุปการลงทุน</Title>
        <Crumbs items={[{ label: 'หน้าแรก', to: '/funding' }, { label: 'สรุปการลงทุน' }]} />

        <GSection title="ข้อมูลทั่วไป">
          <div className="grid grid-cols-2 gap-x-[14px] gap-y-[12px] max-sm:grid-cols-1">
            <label className="flex flex-col gap-[4px]"><span className="text-[12px] font-semibold">ปีงบประมาณ</span><Select label="ปีงบประมาณ" value={fy} options={years.map((y) => ({ value: y, label: y }))} onChange={setFy} /></label>
            <label className="flex flex-col gap-[4px]"><span className="text-[12px] font-semibold">ไตรมาส</span><Select label="ไตรมาส" value={qt} options={[ALL, '1', '2', '3', '4'].map((y) => ({ value: y, label: y === ALL ? y : `ไตรมาส ${y}` }))} onChange={setQt} /></label>
            <label className="flex flex-col gap-[4px]"><span className="text-[12px] font-semibold">นโยบายปันผล</span><input aria-label="นโยบายปันผล" readOnly className={ro} value={policy} /></label>
            <div className="flex flex-col gap-[4px]"><span className="text-[12px] font-semibold">ระดับความเสี่ยงรวมของพอร์ต</span><div className="flex h-[40px] items-center gap-[8px] rounded-[8px] bg-gray-bg px-[12px] text-[13px] text-gray-30">{rows.length ? <><RiskPill lv={Math.round(avgLv)} />{`ระดับ ${avgLv.toFixed(1)}`}</> : '-'}</div></div>
          </div>
        </GSection>

        <GSection title="สรุปภาพรวมการลงทุน">
          <div className="rounded-[10px] bg-[#e8f5ff] p-[14px]">
            <h3 className="mb-[8px] text-[13px] font-semibold text-blue-dark">ภาพรวมการลงทุนรายเดือน (ล้านบาท)</h3>
            <div className="rounded-[8px] bg-white p-[10px]">
              <svg viewBox="0 0 400 240" role="img" aria-label="กราฟแท่งแผนการลงทุนเทียบใช้จริงรายเดือน" className="w-full">
                {[0, 1, 2, 3].map((i) => <line key={i} x1="24" x2="392" y1={30 + i * 58} y2={30 + i * 58} stroke="#e5e6e6" />)}
                {planSeries.map((p, i) => (
                  <g key={i}>
                    <rect x={x(i)} y={204 - (p / maxY) * 174} width="10" height={(p / maxY) * 174} rx="2" fill="#a7c8f5"><title>{`${gMonths[i]} แผน ${p}`}</title></rect>
                    <rect x={x(i) + 11} y={204 - (actualSeries[i] / maxY) * 174} width="10" height={(actualSeries[i] / maxY) * 174} rx="2" fill="#9be0c4"><title>{`${gMonths[i]} ใช้จริง ${actualSeries[i]}`}</title></rect>
                    <text x={x(i) + 10} y="222" textAnchor="middle" fontSize="8" fill="#757d83">{gMonths[i]}</text>
                  </g>
                ))}
                <rect x="290" y="4" width="9" height="9" fill="#a7c8f5" /><text x="303" y="12" fontSize="10" fill="#333e47">แผน</text>
                <rect x="332" y="4" width="9" height="9" fill="#9be0c4" /><text x="345" y="12" fontSize="10" fill="#333e47">ใช้จริง</text>
              </svg>
            </div>
          </div>
          <div className="flex flex-col gap-[10px]">
            {metric('จำนวนเงินลงทุน', money(invested), 'บาท')}
            {metric('กำไร / ขาดทุน', money(profit), 'บาท', profit >= 0 ? 'text-[#0f8a63]' : 'text-[#c13232]')}
            {metric('รวมมูลค่า', money(invested + profit), 'บาท')}
            {metric('ผลตอบแทนเฉลี่ย', avgRet.toFixed(2), '%')}
          </div>
        </GSection>

        <section aria-label="รายการกองทุน" className={`${card} flex flex-col gap-[12px] p-[18px]`}>
          <h2 className="text-[14px] font-semibold text-blue-dark">รายการกองทุน</h2>
          <div role="tablist" aria-label="ประเภท" className="grid grid-cols-3 gap-[6px] rounded-[8px] bg-blue-bg p-[3px]">
            {([['all', 'ทั้งหมด'], ['fund', 'กองทุน'], ['bond', 'หุ้นกู้']] as const).map(([k, t]) => (
              <button key={k} type="button" role="tab" aria-selected={tab === k} onClick={() => setTab(k)} className={`h-[32px] rounded-[6px] text-[12px] font-medium ${tab === k ? 'bg-blue-00 text-white' : 'text-blue-00 hover:bg-white/60'}`}>{t}</button>
            ))}
          </div>
          <div className="overflow-x-auto">
            <table className="w-full min-w-[680px] text-left text-[12px]">
              <thead className="text-[10px] font-light text-gray-20"><tr>{['ลำดับ', 'ชื่อ', 'นโยบายปันผล', 'ผลตอบแทนเฉลี่ย', 'ระดับความเสี่ยง', ''].map((h, i) => <th key={i} className="py-[6px] pr-[8px] font-light">{h}</th>)}</tr></thead>
              <tbody>
                {shown.map((i, n) => (
                  <tr key={i.id} className="border-t border-gray-line-2">
                    <td className="py-[10px] pr-[8px] font-urbanist">{n + 1}</td>
                    <td className="pr-[8px] font-medium text-blue-dark underline">{i.name}</td>
                    <td className="pr-[8px] font-light">{i.dividend}</td>
                    <td className="pr-[8px] font-urbanist">{i.ret} %</td>
                    <td className="pr-[8px]"><RiskPill lv={i.lv} /></td>
                    <td className="text-right"><Link to={`/funding/report?id=${i.id}`} className="rounded-[6px] bg-[#0f8a63] px-[10px] py-[5px] text-[11px] font-medium whitespace-nowrap text-white hover:brightness-110">ดูข้อมูลการลงทุน</Link></td>
                  </tr>
                ))}
                {!shown.length && <tr><td colSpan={6} className="py-[28px] text-center text-[13px] font-light text-gray-20">ยังไม่มีรายการลงทุนในช่วงที่เลือก</td></tr>}
              </tbody>
            </table>
          </div>
        </section>
        <div className="flex justify-end"><button type="button" onClick={exportCsv} className="flex h-[40px] items-center gap-[8px] rounded-[8px] bg-blue-00 px-[20px] text-[13px] font-medium text-white hover:brightness-110">ออกรายงาน</button></div>
      </div>
      {toast}
    </div>
  )
}
