import { useState } from 'react'
import { fPersonas, loanStatus, loanTotal, loanTypes, money, thDate, type FPersona, type Loan, type LoanStatus } from '../../data/erpFinance'
import { setFPersona, useFPersona } from '../../lib/erpFinanceStore'
import { Radios, Row, Section, ctl, err } from '../strategic/Parts'

export { Btn, Crumbs, Gate, Radios, Row, Section, Title, ctl, err, page, ta } from '../strategic/Parts'
export { card } from '../saraban/Parts'

const ro = `${ctl} bg-gray-bg text-gray-30`

export function FPersonaSwitch() {
  const me = useFPersona()
  return (
    <label className="flex items-center gap-[8px] rounded-[8px] bg-blue-bg px-[10px] py-[4px] text-[11px] text-gray-30">
      <span className="font-light max-sm:hidden">ดูในฐานะ</span>
      <select aria-label="ดูในฐานะผู้ใช้งาน" value={me} onChange={(e) => setFPersona(e.target.value as FPersona)} className="cursor-pointer bg-transparent py-[4px] text-[12px] font-medium text-blue-00 outline-none">
        {(Object.keys(fPersonas) as FPersona[]).map((p) => (
          <option key={p} value={p}>
            {fPersonas[p].short}
          </option>
        ))}
      </select>
    </label>
  )
}

export function FStatus({ s }: { s: LoanStatus }) {
  const v = loanStatus[s]
  return <span className={`inline-flex rounded-[6px] px-[10px] py-[3px] text-[11px] leading-[normal] font-medium whitespace-nowrap ${v.tone}`}>{v.label}</span>
}

/** The loan type radios (book 3 fig 2-19 "ประเภทการยืมเงิน") */
export function TypeSection({ v, set }: { v: Loan['type']; set?: (t: Loan['type']) => void }) {
  return (
    <Section title="ยืมเงิน">
      <Row label="ประเภทการยืมเงิน">
        <Radios label="ประเภทการยืมเงิน" value={v} options={(Object.keys(loanTypes) as Loan['type'][]).map((k) => ({ key: k, label: loanTypes[k] }))} onChange={(k) => set?.(k)} disabled={!set} />
      </Row>
    </Section>
  )
}

/** "ข้อมูลพื้นฐาน" — read-only copy of what the borrower typed (approve / verify pages) */
export function BasicInfo({ l }: { l: Loan }) {
  const f = (label: string, v: string) => (
    <Row label={label}><input aria-label={label} readOnly className={ro} value={v} /></Row>
  )
  return (
    <Section title="ข้อมูลพื้นฐาน">
      {f('เลขที่ใบเบิก', l.no)}
      {f('ผู้บันทึก', l.recorder)}
      {f('ที่มาขอใบเบิก', l.source)}
      {f('ส่วนงาน', l.office)}
      {f('เลขที่แผนงาน', l.planNo)}
    </Section>
  )
}

/** "เอกสารประกอบการยืมเงิน" — preview of the approval memo, page 1/2 = memo, page 2/2 = expense list (book 3 fig 2-20) */
export function DocViewer({ l }: { l: Loan }) {
  const [tab, setTab] = useState<'loan' | 'saraban'>('loan')
  const [pg, setPg] = useState(1)
  const total = loanTotal(l)
  const row = (k: string, v: string) => (
    <p className="flex gap-[6px] text-[11px] leading-[1.7]"><span className="w-[120px] shrink-0 font-semibold">{k}</span><span className="min-w-0 flex-1 break-words font-light">{v}</span></p>
  )
  return (
    <Section title="เอกสารประกอบการยืมเงิน">
      <div role="tablist" aria-label="ประเภทเอกสาร" className="grid grid-cols-2 gap-[6px] rounded-[8px] bg-blue-bg p-[3px]">
        {([['loan', 'เอกสารใบยืมเงิน'], ['saraban', 'เอกสารสารบรรณ']] as const).map(([k, t]) => (
          <button key={k} type="button" role="tab" aria-selected={tab === k} onClick={() => setTab(k)} className={`h-[32px] rounded-[6px] text-[12px] font-medium ${tab === k ? 'bg-blue-00 text-white' : 'text-blue-00 hover:bg-white/60'}`}>{t}</button>
        ))}
      </div>
      <div className="rounded-[10px] bg-[#e8f5ff] p-[14px]">
        <p className="mb-[8px] text-[12px] font-semibold text-blue-dark">รายงาน</p>
        <div className="flex justify-center bg-[#a7b0b6] px-[10px] py-[0px]">
          <article aria-label={`เอกสาร หน้า ${pg} จาก 2`} className="min-h-[420px] w-full max-w-[460px] bg-white px-[24px] py-[22px] text-black max-sm:px-[14px]">
            {tab === 'saraban' ? (
              <>
                <p className="text-[13px] font-semibold">ประวัติการเดินเรื่องเอกสาร</p>
                <p className="mb-[10px] text-[11px] font-light text-gray-20">เลขสารบรรณ {l.docNo}</p>
                <ol className="flex flex-col gap-[8px]">
                  {l.events.map((e, i) => (
                    <li key={i} className="border-l-2 border-blue-20 pl-[10px] text-[11px]">
                      <b className="font-semibold">{e.action}</b> <span className="font-light text-gray-20">· {e.by} · {thDate(e.at)} {e.at.slice(11)}</span>
                      {e.note && <p className="font-light text-gray-30">{e.note}</p>}
                    </li>
                  ))}
                </ol>
              </>
            ) : pg === 1 ? (
              <>
                <div className="mb-[10px] flex items-start justify-between gap-[10px]">
                  <p className="rounded-[2px] border border-black px-[12px] py-[6px] text-[12px] font-semibold">สถาบันพัฒนาองค์กรชุมชน</p>
                  <p className="text-[14px] font-semibold">บันทึกข้อความ</p>
                </div>
                {row('ส่วนงาน', l.office)}
                {row('ที่', l.docNo)}
                {row('วันที่', thDate(l.createdAt || l.start))}
                {row('เรื่อง', `ขออนุมัติ${loanTypes[l.type]} ${money(total)} บาท`)}
                <hr className="my-[8px] border-black" />
                {row('เรียน', l.approver.split(' · ')[1] ?? l.approver)}
                <p className="mt-[8px] text-[11px] leading-[1.8] font-light">{`ด้วย ${l.requester} ตำแหน่ง ${l.position} มีความประสงค์ขอยืมเงินทดรองจ่ายเพื่อ${l.purpose} ระหว่างวันที่ ${thDate(l.start)} ถึง ${thDate(l.end)} รวมเป็นเงิน ${money(total)} บาท ตามแผนงานเลขที่ ${l.planNo} จึงเรียนมาเพื่อโปรดพิจารณาอนุมัติ`}</p>
                <div className="mt-[36px] ml-auto w-[170px] text-center text-[11px]"><p className="font-urbanist text-[16px] italic">{l.requester.split(' ')[0]}</p><p className="font-light">({l.requester})</p><p className="font-light">{l.position}</p></div>
              </>
            ) : (
              <>
                <p className="mb-[8px] text-[13px] font-semibold">รายการค่าใช้จ่าย</p>
                <table className="w-full text-[11px]">
                  <thead><tr className="border-b border-black text-left font-semibold"><th className="py-[4px]">#</th><th>รหัส</th><th>รายการ</th><th className="text-right">บาท</th></tr></thead>
                  <tbody>
                    {l.items.map((x, i) => <tr key={i} className="border-b border-gray-line-2 font-light"><td className="py-[5px]">{i + 1}</td><td className="font-urbanist">{x.code}</td><td>{x.name}</td><td className="text-right font-urbanist">{money(Number(x.amount) || 0)}</td></tr>)}
                    <tr className="font-semibold"><td colSpan={3} className="pt-[6px] text-right">รวม</td><td className="pt-[6px] text-right font-urbanist">{money(total)}</td></tr>
                  </tbody>
                </table>
                <p className="mt-[12px] text-[11px] leading-[1.8] font-light">กิจกรรม: {l.activity || '-'}</p>
                {l.extra && <p className="text-[11px] leading-[1.8] font-light">ขออนุมัติเพิ่มเติม: {l.extra}</p>}
              </>
            )}
          </article>
        </div>
        {tab === 'loan' && (
          <div className="mt-[8px] flex items-center justify-center gap-[10px] text-[12px] font-semibold">
            <button type="button" aria-label="หน้าก่อนหน้า" disabled={pg === 1} onClick={() => setPg(1)} className="px-[6px] disabled:opacity-30">‹</button>
            <button type="button" aria-label="หน้าถัดไป" disabled={pg === 2} onClick={() => setPg(2)} className="px-[6px] disabled:opacity-30">›</button>
            <span className="font-urbanist">{`${pg} / 2 หน้า`}</span>
          </div>
        )}
      </div>
    </Section>
  )
}

/** A reason box with ready-made wordings (book 3 §2.1.4.3 / §2.1.4.4) */
export const reasonChips = ['เห็นสมควรได้รับการอนุมัติ', 'ไม่เหมาะสมกับการใช้จ่าย']
export function FComment({ label, value, onChange, error, disabled, chips = reasonChips }: { label: string; value: string; onChange: (v: string) => void; error?: string; disabled?: boolean; chips?: string[] }) {
  return (
    <div className="flex flex-col gap-[8px] rounded-[10px] bg-white p-[14px]">
      <p className="text-[12px] font-semibold text-black">{label}</p>
      <input aria-label={label} placeholder={label} disabled={disabled} className={`${ctl} ${error ? err : ''}`} value={value} onChange={(e) => onChange(e.target.value)} />
      {error && <span role="alert" className="-mt-[4px] text-[11px] text-red-00">{error}</span>}
      <div className="flex flex-wrap gap-[6px]">
        {chips.map((s) => (
          <button key={s} type="button" disabled={disabled} onClick={() => onChange(s)} className="rounded-full bg-[#e8f5ff] px-[10px] py-[3px] text-[10px] font-normal text-blue-dark hover:bg-blue-20 disabled:opacity-50">{s}</button>
        ))}
      </div>
    </div>
  )
}

