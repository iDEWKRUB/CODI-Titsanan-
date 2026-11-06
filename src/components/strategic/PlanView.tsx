import { allocation, baht, offices, sumBy, type BudgetItem, type Plan } from '../../data/strategic'
import Select from '../ui/Select'
import { Row, Section, ctl, err, ta } from './Parts'

export const blankItem = (): BudgetItem => ({ code: '', name: '', init: 0, approved: 0, committed: 0, annual: 0 })
const num = (s: string) => Number(s.replace(/[^\d.]/g, '')) || 0

/** The annual-plan form shared by 2.1.2.3 (editable, by an office) and 2.1.2.4 (read-only, by the strategy office) */
export default function PlanView({ p, set, readOnly, errors = {}, noPreview }: { p: Plan; set?: (x: Partial<Plan>) => void; readOnly?: boolean; errors?: Record<string, string>; noPreview?: boolean }) {
  void noPreview
  const upd = (i: number, patch: Partial<BudgetItem>) => set?.({ items: p.items.map((x, j) => (j === i ? { ...x, ...patch } : x)) })
  const ro = `${ctl} bg-gray-bg text-gray-30`
  const totals = (['init', 'approved', 'committed', 'annual'] as const).map((k) => sumBy(p.items, k))
  const limit = allocation[p.office]
  return (
    <>
      <Section title="ข้อมูลผู้สร้างแผนงาน">
        <Row label="เลขที่แผนงาน"><input aria-label="เลขที่แผนงาน" readOnly className={ro} value={p.no} placeholder="ระบบออกให้ เช่น 2568/IT-001" /></Row>
        <Row label="สำนักเจ้าของแผน"><Select label="สำนักเจ้าของแผน" value={p.office} options={offices.map((o) => ({ value: o, label: o }))} onChange={(v) => set?.({ office: v })} className={readOnly || !set ? 'pointer-events-none opacity-70' : ''} /></Row>
        <div className="grid grid-cols-2 gap-[14px] max-sm:grid-cols-1">
          <Row label="ปีงบประมาณ"><input aria-label="ปีงบประมาณ" readOnly className={ro} value={p.fiscalYear} /></Row>
          <Row label="ผู้จัดทำ"><input aria-label="ผู้จัดทำ" readOnly className={`${ctl} bg-blue-bg text-blue-dark`} value={p.creator} /></Row>
        </div>
      </Section>

      <Section title="ข้อมูลแผนงาน">
        <div className="flex gap-[20px] pl-[162px] max-md:pl-0">
          {([['shared', 'แผนแชร์'], ['carry', 'แผนค้างจ่าย']] as const).map(([k, l]) => (
            <label key={k} className="flex items-center gap-[8px] text-[12px] font-light">
              <input type="checkbox" checked={p[k]} disabled={readOnly} onChange={(e) => set?.({ [k]: e.target.checked })} className="size-[14px] accent-blue-00" />
              {l}
            </label>
          ))}
        </div>
        <Row label="รายละเอียดแผนงาน" error={errors.detail}><textarea aria-label="รายละเอียดแผนงาน" readOnly={readOnly} placeholder="รายละเอียดแผนงาน" className={`${ta} ${readOnly ? 'bg-gray-bg' : ''} ${errors.detail ? err : ''}`} value={p.detail} onChange={(e) => set?.({ detail: e.target.value })} /></Row>
        <div className="grid grid-cols-2 gap-[14px] max-sm:grid-cols-1">
          {['งบประมาณตั้งต้นรวม (บาท)', 'งบประมาณที่อนุมัติรวม (บาท)', 'งบประมาณผูกพันรวม (บาท)', 'งบประมาณประจำปีรวม (บาท)'].map((l, i) => (
            <Row key={l} label={l}><input aria-label={l} readOnly className={`${ro} text-right font-urbanist`} value={baht(totals[i])} /></Row>
          ))}
        </div>
        {!readOnly && limit && <p className={`pl-[162px] text-[11px] max-md:pl-0 ${totals[0] > limit ? 'text-red-00' : 'font-light text-gray-20'}`}>วงเงินที่ได้รับจัดสรร {baht(limit)} บาท · ตั้งต้นรวม {baht(totals[0])} บาท {totals[0] > limit ? '(เกินวงเงิน)' : ''}</p>}
        <Row label="หมายเหตุ"><textarea aria-label="หมายเหตุ" readOnly={readOnly} placeholder="หมายเหตุ" className={`${ta} ${readOnly ? 'bg-gray-bg' : ''}`} value={p.note} onChange={(e) => set?.({ note: e.target.value })} /></Row>
      </Section>

      <Section
        title="รายการหัสงบประมาณ"
        action={!readOnly && set ? <button type="button" onClick={() => set({ items: [...p.items, blankItem()] })} className="rounded-[8px] border border-blue-00 px-[12px] py-[6px] text-[12px] font-medium text-blue-00 hover:bg-blue-bg">+ เพิ่มรายการ</button> : undefined}
      >
        <div className="overflow-x-auto">
          <table className="w-full min-w-[760px] text-left text-[12px]">
            <thead className="text-[10px] font-light text-gray-20">
              <tr>
                <th className="w-[44px] py-[6px] font-light">ลำดับ</th><th className="w-[110px] font-light">รหัสงบประมาณ</th><th className="font-light">ชื่องบประมาณ</th>
                {['งบประมาณตั้งต้น (บาท)', 'งบประมาณที่อนุมัติ (บาท)', 'งบประมาณผูกพัน (บาท)', 'งบประมาณประจำปี (บาท)'].map((h) => <th key={h} className="w-[120px] text-right font-light">{h}</th>)}
                {!readOnly && <th className="w-[36px]" />}
              </tr>
            </thead>
            <tbody>
              {p.items.map((it, i) => (
                <tr key={i} className="border-t border-gray-line-2 align-middle">
                  <td className="py-[8px]">{i + 1}</td>
                  <td className="pr-[8px]">{readOnly ? <span className="text-[#0b63c8] underline">{it.code}</span> : <input aria-label={`รหัสงบประมาณ แถว ${i + 1}`} inputMode="numeric" maxLength={6} className={`${ctl} h-[34px] px-[8px] text-[12px]`} value={it.code} onChange={(e) => upd(i, { code: e.target.value.replace(/\D/g, '') })} />}</td>
                  <td className="pr-[8px]">{readOnly ? it.name : <input aria-label={`ชื่องบประมาณ แถว ${i + 1}`} className={`${ctl} h-[34px] px-[8px] text-[12px]`} value={it.name} onChange={(e) => upd(i, { name: e.target.value })} />}</td>
                  <td className="pr-[8px] text-right">{readOnly ? baht(it.init) : <input aria-label={`งบตั้งต้น แถว ${i + 1}`} inputMode="decimal" className={`${ctl} h-[34px] px-[8px] text-right font-urbanist text-[12px]`} value={it.init || ''} onChange={(e) => upd(i, { init: num(e.target.value) })} />}</td>
                  {(['approved', 'committed', 'annual'] as const).map((k) => <td key={k} className="pr-[8px] text-right font-urbanist font-light">{baht(it[k])}</td>)}
                  {!readOnly && <td><button type="button" aria-label={`ลบรายการ ${i + 1}`} onClick={() => set?.({ items: p.items.filter((_, j) => j !== i) })} className="flex size-[26px] items-center justify-center rounded-[6px] text-gray-30 hover:bg-gray-bg hover:text-red-00">×</button></td>}
                </tr>
              ))}
            </tbody>
          </table>
          {p.items.length === 0 && <p className="py-[24px] text-center text-[12px] font-light text-gray-20">ยังไม่มีรายการ กด “+ เพิ่มรายการ”</p>}
        </div>
        {errors.items && <p role="alert" className="text-[11px] text-red-00">{errors.items}</p>}
      </Section>
    </>
  )
}
