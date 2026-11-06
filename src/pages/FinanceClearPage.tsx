import { useEffect, useMemo, useRef, useState } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { useToast } from '../components/leader/Parts'
import Select from '../components/ui/Select'
import { Btn, Crumbs, FPersonaSwitch, FStatus, Gate, Row, Section, Title, ctl, page, ta } from '../components/finance/Parts'
import { blankClear, clearKinds, clearTotal, dueOf, fPersonas, loanTotal, loanTypes, money, refundOf, thDate, type ClearItem } from '../data/erpFinance'
import { checkClear, clearLoan, useFPersona, useLoans } from '../lib/erpFinanceStore'

const ro = `${ctl} bg-gray-bg text-gray-30`

/** เอกสารหักล้างเงินยืมทดรองจ่าย (book 3 fig 2-22) — 2.1.4.5 ; the loan data is pulled in, the borrower lists the real expenses and the system works out the balance */
export default function FinanceClearPage() {
  const me = useFPersona()
  const all = useLoans()
  const [sp] = useSearchParams()
  const navigate = useNavigate()
  const [toast, show] = useToast()
  const file = useRef<HTMLInputElement>(null)
  const pick = useRef(0)
  const open = useMemo(() => all.filter((l) => l.status === 'verified'), [all])
  const [id, setId] = useState(Number(sp.get('id')) || 0)
  const cur = all.find((l) => l.id === id)
  const [rows, setRows] = useState<ClearItem[]>([blankClear()])
  const [errors, setErrors] = useState<Record<string, string>>({})
  const allowed = me === 'staff'
  const done = !!cur && cur.status === 'cleared'

  useEffect(() => {
    if (!id && open[0]) setId(open[0].id)
  }, [id, open])
  useEffect(() => {
    setRows(cur?.clear?.items.map((x) => ({ ...x })) ?? [blankClear()])
    setErrors({})
  }, [id]) // eslint-disable-line react-hooks/exhaustive-deps

  const loan = cur ? loanTotal(cur) : 0
  const spent = clearTotal(rows)
  const res = refundOf(loan, spent)
  const upd = (i: number, k: keyof ClearItem, v: string) => setRows((s) => s.map((r, j) => (j === i ? { ...r, [k]: v } : r)))
  const f = (label: string, v: string) => <Row label={label}><input aria-label={label} readOnly className={ro} value={v} /></Row>

  const save = () => {
    if (!allowed) return show('ต้องเป็นเจ้าหน้าที่ พอช. ผู้ยืมเงิน')
    if (!cur) return show('ไม่มีเงินยืมที่ต้องหักล้าง')
    const e = checkClear(rows)
    setErrors(e)
    if (Object.keys(e).length) return show('กรุณาตรวจสอบข้อมูลที่ไม่ถูกต้อง')
    clearLoan(cur.id, rows, fPersonas.staff.name)
    show(`บันทึกหักล้าง ${cur.no} แล้ว · ${res.label}${res.diff ? ' ' + money(res.diff) + ' บาท' : ''}`)
    setTimeout(() => navigate('/finance'), 1300)
  }

  return (
    <div className={`${page} items-center`}>
      <div className="flex w-full max-w-[860px] flex-col gap-[12px]">
        <Title back="/finance" right={<FPersonaSwitch />}>เอกสารหักล้างเงินยืมทดรองจ่าย</Title>
        <Crumbs items={[{ label: 'หน้าแรก', to: '/finance' }, { label: 'เอกสารหักล้างเงินยืมทดรองจ่าย' }]} />
        <Gate allowed={allowed} need="เจ้าหน้าที่ พอช. ผู้ยืมเงิน" />

        <div className="flex flex-wrap items-center gap-[10px]">
          <span className="text-[12px] font-semibold">เงินยืม</span>
          <div className="w-[420px] max-sm:w-full">
            <Select label="เลือกเงินยืมที่ต้องหักล้าง" value={cur ? String(cur.id) : ''} placeholder={open.length ? 'เลือกเงินยืม' : 'ไม่มีเงินยืมที่รอหักล้าง'} options={(cur && done ? [cur, ...open] : open).map((l) => ({ value: String(l.id), label: `${l.no} · ${l.requester} · ${money(loanTotal(l))} บาท` }))} onChange={(v) => setId(Number(v))} />
          </div>
          {cur && <FStatus s={cur.status} />}
          <span className="text-[12px] font-light text-gray-20">รอหักล้าง {open.length} รายการ</span>
        </div>

        {cur ? (
          <>
            <Section title="ข้อมูลของเงินยืมที่ต้องหักล้าง">
              {f('เลขที่เงินยืม (Loan/ Advance No.)', cur.no)}
              {f('วันที่ยืม', thDate(cur.createdAt || cur.start))}
              {f('ผู้ยืม (ชื่อ–สกุล / หน่วยงาน)', `${cur.requester} / ${cur.office}`)}
              {f('วัตถุประสงค์การยืม', cur.purpose)}
              {f('จำนวนเงินที่ยืม', money(loan))}
              {f('จำนวนเงินคงเหลือที่ต้องหักล้าง', money(done ? 0 : loan - spent))}
              {f('วันที่ครบกำหนดหักล้าง', thDate(dueOf(cur)))}
              {f('สถานะปัจจุบันของเงินยืม', `${loanTypes[cur.type]} · ${done ? 'หักล้างแล้ว' : 'อนุมัติและตรวจสอบแล้ว รอหักล้าง'}`)}
            </Section>

            <Section title="รายการค่าใช้จ่าย">
              <input ref={file} type="file" hidden aria-label="เลือกไฟล์หลักฐาน" onChange={(e) => { const n = e.target.files?.[0]?.name; if (n) upd(pick.current, 'evidence', n); e.target.value = '' }} />
              {rows.map((r, i) => (
                <fieldset key={i} aria-label={`รายการค่าใช้จ่ายที่ ${i + 1}`} disabled={!allowed || done} className="flex flex-col gap-[12px] rounded-[10px] border border-dashed border-gray-line bg-[#fafbfc] p-[14px] max-sm:p-[10px]">
                  <div className="flex items-center justify-between"><b className="text-[12px] font-semibold">รายการที่ {i + 1}</b>{rows.length > 1 && !done && <button type="button" aria-label={`ลบรายการที่ ${i + 1}`} onClick={() => setRows((s) => s.filter((_, j) => j !== i))} className="text-[11px] text-[#c13232] hover:underline">ลบรายการ</button>}</div>
                  <Row label="วันที่รายการค่าใช้จ่าย" req><input type="date" aria-label={`วันที่รายการค่าใช้จ่าย ${i + 1}`} className={ctl} value={r.date} onChange={(e) => upd(i, 'date', e.target.value)} /></Row>
                  <Row label="ประเภทค่าใช้จ่าย" req><Select label={`ประเภทค่าใช้จ่าย ${i + 1}`} value={r.kind} placeholder="ประเภทค่าใช้จ่าย" options={clearKinds.map((k) => ({ value: k, label: k }))} onChange={(v) => upd(i, 'kind', v)} /></Row>
                  <Row label="รายละเอียดรายการ" req><textarea aria-label={`รายละเอียดรายการ ${i + 1}`} placeholder="รายละเอียดรายการ" className={`${ta} min-h-[72px]`} value={r.detail} onChange={(e) => upd(i, 'detail', e.target.value)} /></Row>
                  <Row label="จำนวนเงิน (Amount)" req><input aria-label={`จำนวนเงิน ${i + 1}`} inputMode="decimal" placeholder="จำนวนเงิน (Amount)" className={`${ctl} text-right font-urbanist`} value={r.amount} onChange={(e) => upd(i, 'amount', e.target.value.replace(/[^\d.]/g, ''))} /></Row>
                  <Row label="เลขที่ใบเสร็จ" req><input aria-label={`เลขที่ใบเสร็จ ${i + 1}`} placeholder="เลขที่ใบเสร็จ" className={ctl} value={r.receipt} onChange={(e) => upd(i, 'receipt', e.target.value)} /></Row>
                  <Row label="ผู้ออกใบเสร็จ" req><input aria-label={`ผู้ออกใบเสร็จ ${i + 1}`} placeholder="ผู้ออกใบเสร็จ" className={ctl} value={r.issuer} onChange={(e) => upd(i, 'issuer', e.target.value)} /></Row>
                  <Row label="หลักฐานประกอบ (ไฟล์ / รูปภาพ / ลิงก์)" req>
                    <div className="flex gap-[8px]">
                      <input aria-label={`หลักฐานประกอบ ${i + 1}`} placeholder="ชื่อไฟล์ หรือลิงก์หลักฐาน" className={ctl} value={r.evidence} onChange={(e) => upd(i, 'evidence', e.target.value)} />
                      <button type="button" aria-label={`แนบไฟล์ ${i + 1}`} onClick={() => { pick.current = i; file.current?.click() }} className="flex size-[40px] shrink-0 items-center justify-center rounded-[8px] border border-gray-line text-gray-20 hover:border-blue-00 hover:text-blue-00"><svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="m20 11-8.5 8.5a5 5 0 0 1-7-7L13 4a3.5 3.5 0 0 1 5 5l-8.5 8.5a2 2 0 0 1-3-3L14 7" /></svg></button>
                    </div>
                  </Row>
                  <Row label="หมายเหตุเพิ่มเติม"><input aria-label={`หมายเหตุเพิ่มเติม ${i + 1}`} placeholder="หมายเหตุเพิ่มเติม" className={ctl} value={r.note} onChange={(e) => upd(i, 'note', e.target.value)} /></Row>
                </fieldset>
              ))}
              {errors.items && <span role="alert" className="text-[11px] text-red-00">{errors.items}</span>}
              {!done && <button type="button" disabled={!allowed} onClick={() => setRows((s) => [...s, blankClear()])} className="flex h-[32px] w-fit items-center gap-[6px] rounded-[8px] border border-blue-00 px-[12px] text-[12px] font-medium text-blue-00 hover:bg-blue-bg disabled:opacity-40">+ เพิ่มรายการ</button>}

              <div className="flex flex-col gap-[10px] rounded-[10px] bg-[#e8f5ff] p-[14px]">
                <Row label="ยอดรวมค่าใช้จ่าย" hint="ระบบคำนวณอัตโนมัติ"><input aria-label="ยอดรวมค่าใช้จ่าย" readOnly className={`${ro} text-right font-urbanist`} value={money(spent)} /></Row>
                <Row label="ยอดหักล้างเทียบกับจำนวนเงินยืม" hint="ระบบคำนวณอัตโนมัติ"><input aria-label="ยอดหักล้างเทียบกับจำนวนเงินยืม" readOnly className={`${ro} text-right font-urbanist`} value={`${money(Math.min(spent, loan))} / ${money(loan)}`} /></Row>
                <Row label="ผลต่าง" hint="ระบบคำนวณอัตโนมัติ">
                  <div className="flex items-center gap-[12px] pt-[6px]"><b aria-label="ผลต่าง" className="font-urbanist text-[16px]">{money(res.diff)}</b><span role="status" className={`rounded-[6px] px-[12px] py-[3px] text-[11px] font-medium ${res.tone}`}>{res.label}</span></div>
                </Row>
              </div>
            </Section>
            <div className="flex justify-end gap-[10px]">
              <Btn kind="ghost" onClick={() => navigate('/finance')}>ยกเลิก</Btn>
              <Btn onClick={save} disabled={done}>บันทึก</Btn>
            </div>
          </>
        ) : (
          <p className="rounded-[12px] border border-dashed border-gray-line bg-white py-[48px] text-center text-[13px] font-light text-gray-20">ยังไม่มีเงินยืมที่รอหักล้าง (ต้องผ่านการอนุมัติและตรวจสอบก่อน)</p>
        )}
      </div>
      {toast}
    </div>
  )
}
