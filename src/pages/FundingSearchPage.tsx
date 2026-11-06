import { useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useToast } from '../components/leader/Parts'
import Modal from '../components/ui/Modal'
import Pagination from '../components/ui/Pagination'
import Select from '../components/ui/Select'
import { Crumbs, GPersonaSwitch, GRadios, GRow, GSection, RiskPill, Title, card, ctl, page } from '../components/funding/Parts'
import { budgetTypes, fundTypes, kindLabel, money, products, riskLevels, years, type Kind, type Product } from '../data/erpFunding'

const PAGE = 6
const bondTypes = ['หุ้นกู้ภาคเอกชน', 'หุ้นกู้รัฐวิสาหกิจ']
const ALL = 'ทั้งหมด'
type Q = { kind: Kind; ptype: string; risk: string; dividend: string; op: string; ret: string }
const blank: Q = { kind: 'fund', ptype: ALL, risk: ALL, dividend: ALL, op: 'มากกว่า', ret: '' }
const dl = 'M12 4v10m-4-4 4 4 4-4M5 19h14'
const eye = 'M2 12s4-7 10-7 10 7 10 7-4 7-10 7S2 12 2 12ZM12 9a3 3 0 1 0 0 6 3 3 0 0 0 0-6Z'
const Ic = ({ d }: { d: string }) => <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d={d} /></svg>

/** ค้นหากองทุน/หุ้นกู้ (book 3 fig 2-23) — 2.1.5.1 ; search the products, then "เพิ่มรายการลงทุน" opens 2.1.5.2 with the product filled in */
export default function FundingSearchPage() {
  const navigate = useNavigate()
  const [toast, show] = useToast()
  const [fy, setFy] = useState('2569')
  const [budget, setBudget] = useState(ALL)
  const [f, setF] = useState<Q>(blank)
  const [q, setQ] = useState<Q>(blank) // applied when "ค้นหา" is pressed
  const [stars, setStars] = useState(0)
  const [pg, setPg] = useState(1)
  const [detail, setDetail] = useState<Product>()

  const list = useMemo(() => {
    const n = Number(q.ret)
    return products.filter((p) => p.kind === q.kind && (q.ptype === ALL || p.type === q.ptype) && (q.risk === ALL || p.lv <= Number(q.risk)) && (q.dividend === ALL || p.dividend === q.dividend) && (!q.ret || (q.op === 'มากกว่า' ? p.ret > n : p.ret < n)) && (budget === ALL || p.budgets.includes(budget)))
  }, [q, budget])
  const shown = list.filter((p) => !stars || p.stars === stars)
  const pages = Math.max(1, Math.ceil(shown.length / PAGE))
  const cur = Math.min(pg, pages)
  const view = shown.slice((cur - 1) * PAGE, cur * PAGE)
  const search = () => { setQ(f); setPg(1); setStars(0) }
  const clear = () => { setF(blank); setQ(blank); setBudget(ALL); setStars(0); setPg(1) }
  const download = (p: Product) => {
    const csv = '﻿' + [['ชื่อ', 'ประเภท', 'บริษัทจัดการ/ผู้ออก', 'นโยบายปันผล', 'ผลตอบแทนเฉลี่ย(%)', 'ระดับความเสี่ยง'], [p.name, p.type, p.issuer, p.dividend, p.ret, p.lv]].map((r) => r.map((c) => `"${c}"`).join(',')).join('\r\n')
    const a = document.createElement('a')
    a.href = URL.createObjectURL(new Blob([csv], { type: 'text/csv;charset=utf-8' }))
    a.download = `${p.name}.csv`
    a.click()
    URL.revokeObjectURL(a.href)
    show(`ดาวน์โหลดข้อมูล ${p.name} แล้ว`)
  }

  return (
    <div className={`${page} items-center`}>
      <div className="flex w-full max-w-[900px] flex-col gap-[12px]">
        <Title right={<GPersonaSwitch />}>ค้นหากองทุน / หุ้นกู้</Title>
        <Crumbs items={[{ label: 'หน้าแรก', to: '/funding' }, { label: 'ค้นหากองทุน / หุ้นกู้' }]} />

        <GSection title="เงื่อนไขการลงทุน">
          <div className="grid grid-cols-2 gap-x-[14px] gap-y-[12px] max-sm:grid-cols-1">
            <GRow label="ปีงบประมาณ (พ.ศ.)"><Select label="ปีงบประมาณ" value={fy} options={years.map((y) => ({ value: y, label: y }))} onChange={setFy} /></GRow>
            <GRow label="ประเภทงบประมาณ"><Select label="ประเภทงบประมาณ" value={budget} options={[ALL, ...budgetTypes].map((y) => ({ value: y, label: y }))} onChange={setBudget} /></GRow>
          </div>
          <hr className="border-gray-line-2" />
          <GRow label="ประเภทการลงทุน"><GRadios label="ประเภทการลงทุน" value={f.kind} options={(['fund', 'bond'] as Kind[]).map((k) => ({ key: k, label: kindLabel[k] }))} onChange={(k) => setF({ ...f, kind: k, ptype: ALL })} /></GRow>
          <div className="grid grid-cols-2 gap-x-[14px] gap-y-[12px] max-sm:grid-cols-1">
            <GRow label={f.kind === 'fund' ? 'ประเภทกองทุน' : 'ประเภทหุ้นกู้'}><Select label="ประเภทผลิตภัณฑ์" value={f.ptype} options={[ALL, ...(f.kind === 'fund' ? fundTypes : bondTypes)].map((y) => ({ value: y, label: y }))} onChange={(v) => setF({ ...f, ptype: v })} /></GRow>
            <GRow label="ระดับความเสี่ยงที่ยอมรับได้"><Select label="ระดับความเสี่ยงที่ยอมรับได้" value={f.risk} options={[{ value: ALL, label: ALL }, ...riskLevels.map((l) => ({ value: String(l), label: `ไม่เกินระดับ ${l}` }))]} onChange={(v) => setF({ ...f, risk: v })} /></GRow>
            <GRow label="นโยบายปันผล"><Select label="นโยบายปันผล" value={f.dividend} options={[ALL, 'มี', 'ไม่มี'].map((y) => ({ value: y, label: y }))} onChange={(v) => setF({ ...f, dividend: v })} /></GRow>
            <GRow label="ผลตอบแทนเฉลี่ยต่อปี">
              <div className="flex gap-[8px]">
                <div className="w-[130px] shrink-0"><Select label="เงื่อนไขผลตอบแทน" value={f.op} options={['มากกว่า', 'น้อยกว่า'].map((y) => ({ value: y, label: y }))} onChange={(v) => setF({ ...f, op: v })} /></div>
                <input aria-label="ผลตอบแทนเฉลี่ยต่อปี (%)" inputMode="decimal" placeholder="%" className={`${ctl} text-right font-urbanist`} value={f.ret} onChange={(e) => setF({ ...f, ret: e.target.value.replace(/[^\d.]/g, '') })} />
              </div>
            </GRow>
          </div>
        </GSection>
        <div className="flex justify-end gap-[10px]">
          <button type="button" onClick={clear} className="h-[40px] rounded-[8px] bg-gray-line px-[18px] text-[13px] font-medium text-gray-30 hover:brightness-95">ล้างค่า</button>
          <button type="button" onClick={search} className="flex h-[40px] items-center gap-[8px] rounded-[8px] bg-blue-00 px-[22px] text-[13px] font-medium text-white hover:brightness-110">ค้นหา</button>
        </div>

        <section aria-label="รายการกองทุน" className={`${card} flex flex-col gap-[12px] p-[18px]`}>
          <div className="flex items-center justify-between"><h2 className="text-[14px] font-semibold text-blue-dark">รายการกองทุน</h2><span className="text-[12px] font-light text-gray-20">{`พบ ${shown.length} รายการ`}</span></div>
          <div role="tablist" aria-label="ระดับดาว" className="grid grid-cols-4 gap-[6px] rounded-[8px] bg-blue-bg p-[3px] max-sm:grid-cols-2">
            {[[0, 'ทั้งหมด'], [5, 'ระดับ 5 ดาว'], [4, 'ระดับ 4 ดาว'], [3, 'ระดับ 3 ดาว']].map(([s, t]) => (
              <button key={s} type="button" role="tab" aria-selected={stars === s} onClick={() => { setStars(Number(s)); setPg(1) }} className={`h-[32px] rounded-[6px] text-[12px] font-medium ${stars === s ? 'bg-blue-00 text-white' : 'text-blue-00 hover:bg-white/60'}`}>{t}</button>
            ))}
          </div>
          <div className="overflow-x-auto">
            <table className="w-full min-w-[760px] text-left text-[12px]">
              <thead className="text-[10px] font-light text-gray-20"><tr>{['ลำดับ', 'ชื่อ', 'นโยบายปันผล', 'ผลตอบแทนเฉลี่ย', 'ระดับความเสี่ยง', '', ''].map((h, i) => <th key={i} className="py-[6px] pr-[8px] font-light">{h}</th>)}</tr></thead>
              <tbody>
                {view.map((p, i) => (
                  <tr key={p.id} className="border-t border-gray-line-2">
                    <td className="py-[10px] pr-[8px] font-urbanist">{(cur - 1) * PAGE + i + 1}</td>
                    <td className="pr-[8px] font-medium text-blue-dark underline">{p.name}</td>
                    <td className="pr-[8px] font-light">{p.dividend}</td>
                    <td className="pr-[8px] font-urbanist">{p.ret} %</td>
                    <td className="pr-[8px]"><RiskPill lv={p.lv} /></td>
                    <td className="pr-[8px] whitespace-nowrap">
                      <button type="button" aria-label={`ดูรายละเอียด ${p.name}`} onClick={() => setDetail(p)} className="mr-[4px] inline-flex size-[26px] items-center justify-center rounded-[6px] text-gray-20 hover:bg-blue-bg hover:text-blue-00"><Ic d={eye} /></button>
                      <button type="button" aria-label={`ดาวน์โหลด ${p.name}`} onClick={() => download(p)} className="inline-flex size-[26px] items-center justify-center rounded-[6px] text-gray-20 hover:bg-blue-bg hover:text-blue-00"><Ic d={dl} /></button>
                    </td>
                    <td className="text-right"><button type="button" aria-label={`เพิ่มรายการลงทุน ${p.name}`} onClick={() => navigate(`/funding/add?product=${p.id}&fy=${fy}`)} className="rounded-[6px] bg-[#0f8a63] px-[10px] py-[5px] text-[11px] font-medium whitespace-nowrap text-white hover:brightness-110">+ เพิ่มรายการลงทุน</button></td>
                  </tr>
                ))}
                {!view.length && <tr><td colSpan={7} className="py-[32px] text-center text-[13px] font-light text-gray-20">ไม่พบรายการตามเงื่อนไข</td></tr>}
              </tbody>
            </table>
          </div>
        </section>
        <div className="flex justify-end"><Pagination page={cur} pageCount={pages} onChange={setPg} /></div>
      </div>

      <Modal open={!!detail} onClose={() => setDetail(undefined)} title={detail?.name ?? ''} width="max-w-[460px]">
        {detail && (
          <dl className="grid grid-cols-[130px_1fr] gap-y-[8px] text-[13px]">
            {[['ประเภท', `${kindLabel[detail.kind]} · ${detail.type}`], ['บริษัทจัดการ / ผู้ออก', detail.issuer], ['นโยบายปันผล', detail.dividend], ['ผลตอบแทนเฉลี่ยต่อปี', `${detail.ret} %`], ['ระดับความเสี่ยง', `ระดับ ${detail.lv} (${detail.lv <= 2 ? 'ต่ำ' : detail.lv === 3 ? 'ปานกลาง' : 'สูง'})`], ['ราคาต่อหน่วยล่าสุด', money(detail.price) + ' บาท'], ['อันดับ', `${detail.stars} ดาว`]].map(([k, v]) => (
              <div key={k} className="contents"><dt className="font-semibold">{k}</dt><dd className="font-light">{v}</dd></div>
            ))}
          </dl>
        )}
      </Modal>
      {toast}
    </div>
  )
}
