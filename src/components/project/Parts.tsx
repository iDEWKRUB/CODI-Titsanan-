import { useState } from 'react'
import { baht, suggestions, type Proposal } from '../../data/erpProject'
import { sumBy, type Plan } from '../../data/strategic'
import { Radios, Row, Section, ctl, err, ta } from '../strategic/Parts'

export { Btn, Crumbs, Gate, PersonaSwitch, Radios, Row, Section, Title, ctl, err, page, ta } from '../strategic/Parts'
export { card } from '../saraban/Parts'

const ro = `${ctl} bg-gray-bg text-gray-30`

/** "ข้อมูลผู้สร้างแผนงาน" + "ข้อมูลแผนงาน" — pulled from the approved annual plan of ERP STRATEGIC and not editable (book 3 §2.1.3.4) */
export function PlanInfo({ plan }: { plan?: Plan }) {
  const tot = (k: 'init' | 'approved' | 'committed' | 'annual') => (plan ? baht(sumBy(plan.items, k)) : '')
  return (
    <>
      <Section title="ข้อมูลผู้สร้างแผนงาน">
        <Row label="เลขที่แผนงาน"><input aria-label="เลขที่แผนงาน" readOnly className={ro} value={plan?.no ?? ''} placeholder="1234/ABCDE" /></Row>
        <Row label="สำนักเจ้าของแผน"><input aria-label="สำนักเจ้าของแผน" readOnly className={ro} value={plan?.office ?? ''} placeholder="สำนักเจ้าของแผน" /></Row>
        <div className="grid grid-cols-2 gap-[14px] max-sm:grid-cols-1">
          <Row label="ปีงบประมาณ"><input aria-label="ปีงบประมาณ" readOnly className={ro} value={plan?.fiscalYear ?? ''} placeholder="ปีงบประมาณ" /></Row>
          <Row label="ผู้จัดทำ"><input aria-label="ผู้จัดทำ" readOnly className={ro} value={plan?.creator ?? ''} placeholder="ผู้จัดทำ" /></Row>
        </div>
      </Section>
      <Section title="ข้อมูลแผนงาน">
        <div className="flex gap-[20px] pl-[162px] max-md:pl-0">
          {([['shared', 'แผนแชร์'], ['carry', 'แผนค้างจ่าย']] as const).map(([k, l]) => (
            <label key={k} className="flex items-center gap-[8px] text-[12px] font-light">
              <input type="checkbox" checked={!!plan?.[k]} disabled readOnly className="size-[14px] accent-blue-00" />
              {l}
            </label>
          ))}
        </div>
        <Row label="รายละเอียดแผนงาน"><textarea aria-label="รายละเอียดแผนงาน" readOnly className={`${ta} bg-gray-bg`} value={plan?.detail ?? ''} placeholder="รายละเอียดแผนงาน" /></Row>
        <div className="grid grid-cols-2 gap-[14px] max-sm:grid-cols-1">
          {(['งบประมาณตั้งต้นรวม (บาท)', 'งบประมาณที่อนุมัติรวม (บาท)', 'งบประมาณผูกพันรวม (บาท)', 'งบประมาณประจำปีรวม (บาท)'] as const).map((l, i) => (
            <Row key={l} label={l}><input aria-label={l} readOnly className={`${ro} text-right font-urbanist`} value={tot((['init', 'approved', 'committed', 'annual'] as const)[i])} placeholder={l} /></Row>
          ))}
        </div>
        <Row label="หมายเหตุ"><textarea aria-label="หมายเหตุ" readOnly className={`${ta} bg-gray-bg`} value={plan?.note ?? ''} placeholder="หมายเหตุ" /></Row>
      </Section>
    </>
  )
}

export type Draft = Pick<Proposal, 'name' | 'objective' | 'background' | 'kind'>
const kinds = ['โครงการจัดจ้าง', 'โครงการจัดอบรม', 'โครงการจัดซื้อ'] as const

/** "จัดทำข้อเสนอโครงการ" — editable by the proposing office, read-only for the reviewers */
export function ProposalForm({ v, set, errors = {} }: { v: Draft; set?: (x: Partial<Draft>) => void; errors?: Record<string, string> }) {
  const readOnly = !set
  const cls = (k: string, base: string) => `${base} ${readOnly ? 'bg-gray-bg' : ''} ${errors[k] ? err : ''}`
  return (
    <Section title="จัดทำข้อเสนอโครงการ">
      <Row label="ชื่อโครงการ" req error={errors.name}><input aria-label="ชื่อโครงการ" readOnly={readOnly} placeholder="ชื่อโครงการ" className={cls('name', ctl)} value={v.name} onChange={(e) => set?.({ name: e.target.value })} /></Row>
      <Row label="วัตถุประสงค์โครงการ" req error={errors.objective}><textarea aria-label="วัตถุประสงค์โครงการ" readOnly={readOnly} placeholder="วัตถุประสงค์โครงการ" className={cls('objective', ta)} value={v.objective} onChange={(e) => set?.({ objective: e.target.value })} /></Row>
      <Row label="ที่มาและความสำคัญ" req error={errors.background}><textarea aria-label="ที่มาและความสำคัญ" readOnly={readOnly} placeholder="ที่มาและความสำคัญ" className={cls('background', ta)} value={v.background} onChange={(e) => set?.({ background: e.target.value })} /></Row>
      <Row label="ประเภทโครงการ"><Radios label="ประเภทโครงการ" value={v.kind} options={kinds.map((k) => ({ key: k, label: k }))} onChange={(k) => set?.({ kind: k })} disabled={readOnly} /></Row>
    </Section>
  )
}

/** A comment box with the system's suggested wordings (book 3 §2.1.3.5 / §2.1.3.6) */
export function CommentBox({ label, value, onChange, error, disabled }: { label: string; value: string; onChange: (v: string) => void; error?: string; disabled?: boolean }) {
  return (
    <div className="flex flex-col gap-[8px] rounded-[10px] bg-white p-[14px]">
      <p className="text-[12px] font-semibold text-black">{label}</p>
      <input aria-label={label} placeholder="เหตุผลประกอบ" disabled={disabled} className={`${ctl} ${error ? err : ''}`} value={value} onChange={(e) => onChange(e.target.value)} />
      {error && <span role="alert" className="-mt-[4px] text-[11px] text-red-00">{error}</span>}
      <div className="flex flex-wrap gap-[6px]">
        {suggestions.map((s) => (
          <button key={s} type="button" disabled={disabled} onClick={() => onChange(s)} className="rounded-full bg-[#e8f5ff] px-[10px] py-[3px] text-[10px] font-normal text-blue-dark hover:bg-blue-20 disabled:opacity-50">
            {s}
          </button>
        ))}
      </div>
    </div>
  )
}

export function StatusPill({ label, tone }: { label: string; tone: string }) {
  return <span className={`inline-flex rounded-[6px] px-[10px] py-[3px] text-[11px] leading-[normal] font-medium whitespace-nowrap ${tone}`}>{label}</span>
}

/** Little hook for forms that remember whether the user already tried to submit */
export const useTried = () => useState(false)
