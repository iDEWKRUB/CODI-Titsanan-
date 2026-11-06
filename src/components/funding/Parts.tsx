import { useState } from 'react'
import { gPersonas, invStatus, kindLabel, money, riskOf, riskTone, thDate, type GPersona, type Inv, type InvStatus } from '../../data/erpFunding'
import { setGPersona, useGPersona } from '../../lib/erpFundingStore'
import { Radios, Row, Section, ctl, err } from '../strategic/Parts'

export { Btn, Crumbs, Gate, Radios, Row, Section, Title, ctl, err, page, ta } from '../strategic/Parts'
export { card } from '../saraban/Parts'

export function GPersonaSwitch() {
  const me = useGPersona()
  return (
    <label className="flex items-center gap-[8px] rounded-[8px] bg-blue-bg px-[10px] py-[4px] text-[11px] text-gray-30">
      <span className="font-light max-sm:hidden">ดูในฐานะ</span>
      <select aria-label="ดูในฐานะผู้ใช้งาน" value={me} onChange={(e) => setGPersona(e.target.value as GPersona)} className="cursor-pointer bg-transparent py-[4px] text-[12px] font-medium text-blue-00 outline-none">
        {(Object.keys(gPersonas) as GPersona[]).map((p) => (
          <option key={p} value={p}>
            {gPersonas[p].short}
          </option>
        ))}
      </select>
    </label>
  )
}

export const GStatus = ({ s }: { s: InvStatus }) => <span className={`inline-flex rounded-[6px] px-[10px] py-[3px] text-[11px] leading-[normal] font-medium whitespace-nowrap ${invStatus[s].tone}`}>{invStatus[s].label}</span>
export const RiskPill = ({ lv }: { lv: number }) => <span className={`inline-flex rounded-[5px] px-[8px] py-[2px] text-[10px] font-medium whitespace-nowrap ${riskTone(lv)}`}>{riskOf(lv)}</span>

/** Number box with − / + buttons (book 3 fig 2-24 "ช่องเพิ่มลดค่า") */
export function Stepper({ label, value, onChange, step, disabled, error }: { label: string; value: number; onChange: (v: number) => void; step: number; disabled?: boolean; error?: string }) {
  const [raw, setRaw] = useState<string | null>(null)
  const shown = raw ?? (value ? value.toLocaleString('en-US', { maximumFractionDigits: 2 }) : '')
  const bump = (d: number) => { setRaw(null); onChange(Math.max(0, Math.round((value + d) * 100) / 100)) }
  return (
    <div className="flex flex-col gap-[3px]">
      <div className={`flex h-[40px] items-center rounded-[8px] border bg-white ${error ? err : 'border-gray-line'} focus-within:border-blue-00`}>
        <button type="button" aria-label={`ลด ${label}`} disabled={disabled} onClick={() => bump(-step)} className="flex h-full w-[36px] items-center justify-center text-gray-30 hover:text-blue-00 disabled:opacity-40">−</button>
        <input aria-label={label} inputMode="decimal" disabled={disabled} value={shown} onFocus={() => setRaw(value ? String(value) : '')} onBlur={() => setRaw(null)} onChange={(e) => { const t = e.target.value.replace(/[^\d.]/g, ''); setRaw(t); onChange(Number(t) || 0) }} className="h-full min-w-0 flex-1 bg-transparent text-right font-urbanist text-[13px] font-light outline-none" />
        <button type="button" aria-label={`เพิ่ม ${label}`} disabled={disabled} onClick={() => bump(step)} className="flex h-full w-[36px] items-center justify-center text-gray-30 hover:text-blue-00 disabled:opacity-40">+</button>
      </div>
      {error && <span role="alert" className="text-[11px] text-red-00">{error}</span>}
    </div>
  )
}

/** Paper preview of the investment report (2.1.5.5 page 1/2 = announcement, 2/2 = figures) */
export function ReportDoc({ i, profit }: { i: Inv; profit: number }) {
  const [pg, setPg] = useState(1)
  const row = (k: string, v: string) => (
    <p className="flex gap-[6px] text-[11px] leading-[1.8]"><span className="w-[130px] shrink-0 font-semibold">{k}</span><span className="min-w-0 flex-1 break-words font-light">{v}</span></p>
  )
  return (
    <div className="rounded-[10px] bg-[#e8f5ff] p-[14px]">
      <p className="mb-[8px] text-[12px] font-semibold text-blue-dark">รายงาน</p>
      <div className="flex justify-center bg-[#a7b0b6]">
        <article aria-label={`รายงานการลงทุน หน้า ${pg} จาก 2`} className="min-h-[400px] w-full max-w-[460px] bg-white px-[24px] py-[22px] text-black max-sm:px-[14px]">
          {pg === 1 ? (
            <>
              <p className="mx-auto mb-[10px] w-fit rounded-[2px] border border-black px-[14px] py-[6px] text-center text-[12px] font-semibold">สถาบันพัฒนาองค์กรชุมชน (องค์การมหาชน)</p>
              <p className="text-center text-[13px] font-semibold">รายงานผลการลงทุน</p>
              <p className="mb-[10px] text-center text-[11px] font-light">{`เรื่อง การลงทุนใน${kindLabel[i.kind]} ${i.name} ปีงบประมาณ ${i.fy}`}</p>
              <hr className="mb-[8px] border-black" />
              {row('ผลิตภัณฑ์', i.name)}
              {row('ประเภท', i.type)}
              {row('บริษัทจัดการ / ผู้ออก', i.issuer)}
              {row('ช่องทางการลงทุน', `${i.channel} · ${i.payment}`)}
              {row('ระยะเวลาลงทุน', `${thDate(i.start)} ถึง ${thDate(i.end)}`)}
              <p className="mt-[8px] text-[11px] leading-[1.8] font-light">{`วัตถุประสงค์: ${i.objective}`}</p>
              <div className="mt-[34px] ml-auto w-[170px] text-center text-[11px]"><p className="font-urbanist text-[16px] italic">{i.createdBy.split(' ')[0]}</p><p className="font-light">{`(${i.createdBy})`}</p><p className="font-light">เจ้าหน้าที่ผู้รับผิดชอบ</p></div>
            </>
          ) : (
            <>
              <p className="mb-[8px] text-[13px] font-semibold">สรุปตัวเลขทางการเงิน</p>
              <table className="w-full text-[11px]">
                <tbody>
                  {[['จำนวนเงินลงทุน', money(i.amount) + ' บาท'], ['ราคาต่อหน่วย', money(i.price) + ' บาท'], ['จำนวนหน่วยลงทุน', money(i.amount / i.price) + ' หน่วย'], ['ผลตอบแทนเฉลี่ยต่อปี', i.ret + ' %'], ['กำไรคาดการณ์ตลอดอายุ', money(profit) + ' บาท'], ['รวมมูลค่าเมื่อครบกำหนด', money(i.amount + profit) + ' บาท'], ['ระดับความเสี่ยง', riskOf(i.lv) + ` (ระดับ ${i.lv})`]].map(([k, v]) => <tr key={k} className="border-b border-gray-line-2"><td className="py-[6px] font-semibold">{k}</td><td className="py-[6px] text-right font-urbanist font-light">{v}</td></tr>)}
                </tbody>
              </table>
            </>
          )}
        </article>
      </div>
      <div className="mt-[8px] flex items-center justify-center gap-[10px] text-[12px] font-semibold">
        <button type="button" aria-label="หน้าก่อนหน้า" disabled={pg === 1} onClick={() => setPg(1)} className="px-[6px] disabled:opacity-30">‹</button>
        <button type="button" aria-label="หน้าถัดไป" disabled={pg === 2} onClick={() => setPg(2)} className="px-[6px] disabled:opacity-30">›</button>
        <span className="font-urbanist">{`${pg} / 2 หน้า`}</span>
      </div>
    </div>
  )
}

export const ro = `${ctl} bg-gray-bg text-gray-30`
export { Radios as GRadios, Row as GRow, Section as GSection }
