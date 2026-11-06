import { useMemo, useState } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { useToast } from '../components/leader/Parts'
import Select from '../components/ui/Select'
import { Btn, Crumbs, FPersonaSwitch, Gate, Row, Section, Title, TypeSection, ctl, err, page, ta } from '../components/finance/Parts'
import { approvers, blankItem, fPersonas, loanTotal, money, type Loan, type LoanType } from '../data/erpFinance'
import { budgetLeft, checkLoan, loans, nextLoanNo, submitLoan, useFPersona } from '../lib/erpFinanceStore'

const blank = (type: LoanType): Loan => ({ id: 0, no: '', type, recorder: fPersonas.staff.name, source: '', office: fPersonas.staff.office, planNo: '', requester: '', position: '', staffCode: '', projectRef: '', start: '', end: '', purpose: '', activity: '', extra: '', items: [blankItem()], approver: '', status: 'submitted', docNo: '', createdAt: '', events: [] })

/** สร้างคำขอยืมเงิน (book 3 fig 2-19) — 2.1.4.2 ; "ยื่นเอกสาร" saves, issues the saraban number and notifies the approver */
export default function FinanceLoanPage() {
  const me = useFPersona()
  const navigate = useNavigate()
  const [sp] = useSearchParams()
  const [toast, show] = useToast()
  const editId = Number(sp.get('edit')) || 0
  const init = useMemo<Loan>(() => {
    if (editId && loans.get(editId)) return structuredClone(loans.get(editId)!)
    if (sp.get('copy')) {
      try {
        const c = JSON.parse(sessionStorage.getItem('codi.finance.copy') || '') as Loan
        return { ...c, recorder: fPersonas.staff.name }
      } catch {
        /* fall through to a blank form */
      }
    }
    const t = sp.get('type')
    return blank(t === 'n' || t === 'bi' ? t : 'k')
  }, []) // eslint-disable-line react-hooks/exhaustive-deps
  const [v, setV] = useState<Loan>(init)
  const [errors, setErrors] = useState<Record<string, string>>({})
  const set = (x: Partial<Loan>) => setV((s) => ({ ...s, ...x }))
  const allowed = me === 'staff'
  const total = loanTotal(v)
  const no = v.no || nextLoanNo()

  const setItem = (i: number, k: 'code' | 'name' | 'amount', val: string) =>
    setV((s) => ({ ...s, items: s.items.map((r, j) => (j === i ? { ...r, [k]: k === 'code' ? val.replace(/\D/g, '').slice(0, 6) : val } : r)) }))
  const cls = (k: string, b = ctl) => `${b} ${errors[k] ? err : ''}`
  const txt = (label: string, k: 'recorder' | 'source' | 'office' | 'planNo' | 'requester' | 'position' | 'staffCode' | 'projectRef', req = true, ph = label) => (
    <Row label={label} req={req} error={errors[k]}>
      <input aria-label={label} placeholder={ph} disabled={!allowed} className={cls(k)} value={v[k]} onChange={(e) => set({ [k]: e.target.value })} />
    </Row>
  )

  const submit = () => {
    if (!allowed) return show('ต้องเป็นเจ้าหน้าที่ พอช. ผู้ยื่นคำขอ')
    const e = checkLoan(v)
    setErrors(e)
    if (Object.keys(e).length) return show('กรุณาตรวจสอบข้อมูลที่ไม่ถูกต้อง')
    const r = submitLoan({ ...v, no })
    show(`ยื่นเอกสาร ${r.no} แล้ว · ออกเลขสารบรรณ ${r.docNo} · แจ้งเตือนผู้อนุมัติแล้ว`)
    setTimeout(() => navigate('/finance'), 1300)
  }

  return (
    <div className={`${page} items-center`}>
      <div className="flex w-full max-w-[860px] flex-col gap-[12px]">
        <Title back="/finance" right={<FPersonaSwitch />}>ยืมเงิน</Title>
        <Crumbs items={[{ label: 'หน้าแรก', to: '/finance' }, { label: 'ยืมเงิน' }]} />
        <Gate allowed={allowed} need="เจ้าหน้าที่ พอช." />
        {v.status === 'returned' && v.decision && <p role="status" className="rounded-[10px] bg-[#fff1f1] px-[14px] py-[10px] text-[12px] text-[#c13232]">เอกสารถูกส่งกลับโดย {v.decision.by}: {v.decision.reason}</p>}

        <TypeSection v={v.type} set={allowed ? (t) => set({ type: t }) : undefined} />

        <Section title="ข้อมูลพื้นฐาน">
          <Row label="เลขที่ใบเบิก"><input aria-label="เลขที่ใบเบิก" readOnly className={`${ctl} bg-gray-bg text-gray-30`} value={no} /></Row>
          {txt('ผู้บันทึก', 'recorder', true)}
          <Row label="ที่มาขอใบเบิก" req error={errors.source} hint="ตัวอย่าง BG1-เบิกค่าใช้จ่าย">
            <input aria-label="ที่มาขอใบเบิก" placeholder="ที่มาขอใบเบิก (ตัวอย่าง BG1-เบิกค่าใช้จ่าย)" disabled={!allowed} className={cls('source')} value={v.source} onChange={(e) => set({ source: e.target.value })} />
          </Row>
          {txt('ส่วนงาน', 'office')}
          {txt('เลขที่แผนงาน', 'planNo')}
        </Section>

        <Section title="ข้อมูลการขอเบิก">
          {txt('ผู้ขอเบิก', 'requester')}
          {txt('ตำแหน่ง', 'position')}
          {txt('รหัสเจ้าหน้าที่', 'staffCode')}
          {txt('อ้างอิงเลขที่โครงการ', 'projectRef', false)}
          <Row label="วันที่ปฏิบัติงานเริ่มต้น" req error={errors.start}><input type="date" aria-label="วันที่ปฏิบัติงานเริ่มต้น" disabled={!allowed} className={cls('start')} value={v.start} onChange={(e) => set({ start: e.target.value })} /></Row>
          <Row label="วันที่ปฏิบัติงานสิ้นสุด" req error={errors.end}><input type="date" aria-label="วันที่ปฏิบัติงานสิ้นสุด" disabled={!allowed} className={cls('end')} value={v.end} onChange={(e) => set({ end: e.target.value })} /></Row>
          <Row label="วัตถุประสงค์" req error={errors.purpose}><textarea aria-label="วัตถุประสงค์" placeholder="วัตถุประสงค์" disabled={!allowed} className={cls('purpose', ta)} value={v.purpose} onChange={(e) => set({ purpose: e.target.value })} /></Row>
          <Row label="รายละเอียดกิจกรรม"><textarea aria-label="รายละเอียดกิจกรรม" placeholder="รายละเอียดกิจกรรม" disabled={!allowed} className={ta} value={v.activity} onChange={(e) => set({ activity: e.target.value })} /></Row>
          <Row label="ขออนุมัติเพิ่มเติม"><input aria-label="ขออนุมัติเพิ่มเติม" placeholder="ขออนุมัติเพิ่มเติม" disabled={!allowed} className={ctl} value={v.extra} onChange={(e) => set({ extra: e.target.value })} /></Row>
        </Section>

        <Section title="ข้อมูลค่าใช้จ่าย" action={<button type="button" disabled={!allowed} onClick={() => setV((s) => ({ ...s, items: [...s.items, blankItem()] }))} className="flex h-[30px] items-center gap-[6px] rounded-[8px] border border-blue-00 px-[12px] text-[12px] font-medium text-blue-00 hover:bg-blue-bg disabled:opacity-40">+ เพิ่มรายการ</button>}>
          <div className="overflow-x-auto">
            <table className="w-full min-w-[620px] text-left text-[12px]">
              <thead className="text-[10px] font-light text-gray-20"><tr><th className="w-[40px] py-[6px]">ลำดับ</th><th className="w-[130px]">รหัสงบประมาณ</th><th>ชื่อรายการ</th><th className="w-[140px] text-right">ยอดเงิน (บาท)</th><th className="w-[34px]" /></tr></thead>
              <tbody>
                {v.items.map((r, i) => {
                  const b = r.code.length >= 5 ? budgetLeft(r.code) : undefined
                  return (
                    <tr key={i} className="border-t border-gray-line-2 align-top">
                      <td className="py-[10px] font-urbanist">{i + 1}</td>
                      <td className="py-[6px] pr-[8px]">
                        <input aria-label={`รหัสงบประมาณ แถว ${i + 1}`} inputMode="numeric" placeholder="329207" disabled={!allowed} className={`${ctl} font-urbanist`} value={r.code} onChange={(e) => setItem(i, 'code', e.target.value)} />
                        {b && <p className="mt-[3px] text-[10px] font-light text-gray-20">งบคงเหลือ {money(b.left)}</p>}
                      </td>
                      <td className="py-[6px] pr-[8px]"><input aria-label={`ชื่อรายการ แถว ${i + 1}`} placeholder="ชื่อรายการ" disabled={!allowed} className={ctl} value={r.name} onChange={(e) => setItem(i, 'name', e.target.value)} /></td>
                      <td className="py-[6px]"><input aria-label={`ยอดเงิน แถว ${i + 1}`} inputMode="decimal" placeholder="0.00" disabled={!allowed} className={`${ctl} text-right font-urbanist`} value={r.amount} onChange={(e) => setItem(i, 'amount', e.target.value.replace(/[^\d.]/g, ''))} /></td>
                      <td className="py-[6px] pl-[4px]">
                        {v.items.length > 1 && <button type="button" aria-label={`ลบรายการ แถว ${i + 1}`} disabled={!allowed} onClick={() => setV((s) => ({ ...s, items: s.items.filter((_, j) => j !== i) }))} className="flex size-[30px] items-center justify-center rounded-[6px] text-gray-20 hover:bg-[#ffe3e3] hover:text-[#c13232]"><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" aria-hidden="true"><path d="M6 6l12 12M18 6 6 18" /></svg></button>}
                      </td>
                    </tr>
                  )
                })}
                <tr className="border-t border-gray-line"><td colSpan={3} className="py-[8px] pr-[8px] text-right font-semibold">รวมยอดยืม</td><td className="py-[8px] text-right font-urbanist font-semibold" aria-label="รวมยอดยืม">{money(total)}</td><td /></tr>
              </tbody>
            </table>
          </div>
          {errors.items && <span role="alert" className="text-[11px] text-red-00">{errors.items}</span>}
        </Section>

        <Section title="เลือกผู้มีสิทธิอนุมัติ">
          <Row label="ชื่อผู้อนุมัติ" req error={errors.approver}>
            <Select label="ชื่อผู้อนุมัติ" value={v.approver} placeholder="ชื่อผู้อนุมัติ" options={approvers.map((a) => ({ value: a, label: a }))} onChange={(a) => set({ approver: a })} />
          </Row>
        </Section>

        <div className="flex justify-end gap-[10px]">
          <Btn kind="ghost" onClick={() => navigate('/finance')}>ยกเลิก</Btn>
          <Btn onClick={submit}>ยื่นเอกสาร</Btn>
        </div>
      </div>
      {toast}
    </div>
  )
}
