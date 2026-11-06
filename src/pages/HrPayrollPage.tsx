import { useMemo, useState } from 'react'
import { Link, useNavigate, useSearchParams } from 'react-router-dom'
import { useToast } from '../components/leader/Parts'
import Select from '../components/ui/Select'
import { Btn, Crumbs, Gate, HPersonaSwitch, Pill, Title, card, ctl, page } from '../components/hr/Parts'
import { fullName, grossOf, money, payCols, thDate, type PayRow, type PayRun } from '../data/erpHr'
import { emps, reqs, runs, useEmps, useHPersona, useRuns } from '../lib/hrStore'

const pad = (n: number) => String(n).padStart(2, '0')
const monthRange = (d = new Date()) => { const y = d.getFullYear(), m = d.getMonth(); return { from: `${y}-${pad(m + 1)}-01`, to: `${y}-${pad(m + 1)}-${pad(new Date(y, m + 1, 0).getDate())}` } }
const blankRun = (): PayRun => { const r = monthRange(); return { id: 0, no: `PAY-${r.from.slice(0, 4)}${r.from.slice(5, 7)}01`, date: new Date().toISOString().slice(0, 10), due: r.to, from: r.from, to: r.to, rows: [], status: 'draft' } }

/** income of an employee in the period from the approved self-service requests (สวัสดิการ / ค่าอาหารนอกเวลา) */
function fromRequests(empId: number, from: string, to: string) {
  const ok = reqs.all().filter((r) => r.empId === empId && r.status === 'approved' && r.createdAt.slice(0, 10) >= from && r.createdAt.slice(0, 10) <= to)
  const sum = (k: string) => ok.filter((r) => r.kind === 'welfare' && r.welfareType === k).reduce((a, r) => a + (r.welfareItems ?? []).reduce((b, i) => b + (Number(i.amount) || 0), 0), 0)
  const ot = ok.filter((r) => r.kind === 'ot').reduce((a, r) => a + (r.otDays ?? []).reduce((b, d) => b + (d.slots.length >= 4 ? 100 : d.slots.length >= 2 ? 50 : 0), 0), 0)
  return { medical: sum('ค่ารักษาพยาบาล'), welfare: sum('ค่าเล่าเรียนบุตร') + sum('สวัสดิการเงินช่วยเหลือ'), ot }
}

/** ทำจ่ายเงินเดือน (book 3 fig 2-39) — 2.1.6.10 */
export default function HrPayrollPage() {
  const me = useHPersona()
  const people = useEmps()
  const all = useRuns()
  const navigate = useNavigate()
  const [sp] = useSearchParams()
  const [toast, show] = useToast()
  const editId = Number(sp.get('id')) || 0
  const init = useMemo<PayRun>(() => (editId && runs.get(editId) ? structuredClone(runs.get(editId)!) : blankRun()), []) // eslint-disable-line react-hooks/exhaustive-deps
  const [v, setV] = useState<PayRun>(init)
  const [err, setErr] = useState('')
  const allowed = me === 'finance'
  const locked = v.status === 'paid'
  const set = (p: Partial<PayRun>) => setV((s) => ({ ...s, ...p }))
  const setCell = (i: number, k: keyof PayRow, n: number) => set({ rows: v.rows.map((r, j) => (j === i ? { ...r, [k]: n } : r)) })
  const importData = () => {
    set({ rows: emps.all().map((e) => ({ empId: e.id, salary: e.salary, allowance: e.position === 'ผู้อำนวยการสำนัก' ? 3000 : 1500, share: 0, ...fromRequests(e.id, v.from, v.to) })) })
    show(`นำเข้าข้อมูลเงินเดือน ${emps.all().length} คน (รวมสวัสดิการและค่าอาหารนอกเวลาที่อนุมัติแล้ว)`)
  }
  const next = () => {
    if (!allowed) return show('ต้องเป็นเจ้าหน้าที่สำนักการเงินและบัญชี')
    if (locked) return navigate(`/hr/payroll/summary?id=${v.id}`)
    if (!v.date || !v.due || !v.from || !v.to) return setErr('กรุณาระบุวันที่ให้ครบ')
    if (v.to < v.from) return setErr('ถึงวันที่ต้องไม่ก่อนตั้งแต่วันที่')
    if (!v.rows.length) return setErr('ยังไม่มีพนักงานในรอบนี้ — กดนำเข้าข้อมูลเงินเดือนหรือเพิ่มพนักงาน')
    if (new Set(v.rows.map((r) => r.empId)).size !== v.rows.length) return setErr('มีพนักงานซ้ำในรอบนี้')
    if (v.rows.some((r) => payCols.some((c) => r[c.key] < 0) || r.salary <= 0)) return setErr('เงินเดือนต้องมากกว่า 0 และยอดอื่นห้ามติดลบ')
    if (all.some((r) => r.no === v.no && r.id !== v.id)) return setErr(`เลขที่บันทึก ${v.no} มีอยู่แล้ว`)
    setErr('')
    const id = v.id || runs.next()
    runs.save({ ...v, id })
    navigate(`/hr/payroll/summary?id=${id}`)
  }
  const total = v.rows.reduce((a, r) => a + grossOf(r), 0)
  const date = (label: string, k: 'date' | 'due' | 'from' | 'to') => <label className="flex flex-col gap-[4px] text-[11px] text-gray-20">{label}<input type="date" aria-label={label} disabled={!allowed || locked} className={ctl} value={v[k]} onChange={(e) => set({ [k]: e.target.value })} /></label>
  return (
    <div className={`${page} items-center`}>
      <div className="flex w-full max-w-[1100px] flex-col gap-[12px]">
        <Title back="/hr" right={<HPersonaSwitch />}>ทำจ่ายเงินเดือน</Title>
        <Crumbs items={[{ label: 'หน้าแรก', to: '/hr' }, { label: 'ทำจ่ายเงินเดือน' }]} />
        <Gate allowed={allowed} need="เจ้าหน้าที่สำนักการเงินและบัญชี" />
        <section className={`${card} flex flex-col gap-[14px] p-[20px]`}>
          <div className="flex flex-wrap items-center gap-[10px]">
            <h2 className="text-[15px] font-semibold">ทำจ่ายเงินเดือน</h2>
            <button type="button" disabled={!allowed || locked} onClick={importData} className="rounded-full border border-[#17c3a1] px-[12px] py-[3px] text-[11px] font-medium text-[#0f8a63] hover:bg-[#e3f7ef] disabled:opacity-40">นำเข้าข้อมูลเงินเดือน</button>
            {locked && <Pill tone="bg-[#dff5e8] text-[#0f8a63]">ชำระแล้ว</Pill>}
            <label className="ml-auto flex flex-col gap-[4px] text-[11px] text-gray-20">เลขที่บันทึก<input aria-label="เลขที่บันทึก" disabled={!allowed || locked} className={`${ctl} w-[180px] font-urbanist`} value={v.no} onChange={(e) => set({ no: e.target.value.toUpperCase() })} /></label>
          </div>
          <div className="grid grid-cols-[110px_repeat(4,1fr)] items-end gap-[10px] max-md:grid-cols-2">
            <span className="text-[12px] font-semibold">รอบเงินเดือน</span>
            {date('วันที่ทำรายการ', 'date')}{date('วันที่กำหนดชำระ', 'due')}{date('ตั้งแต่วันที่', 'from')}{date('ถึงวันที่', 'to')}
          </div>
          <p className="text-[12px] font-semibold">พนักงานที่รับเงินเดือนในรอบนี้</p>
          <div className="overflow-x-auto">
            <table className="w-full min-w-[1000px] text-left text-[11px]">
              <thead className="text-gray-20"><tr><th className="w-[34px] py-[6px] font-light">#</th><th className="w-[110px] font-light">รหัสพนักงาน</th><th className="font-light">ชื่อ-นามสกุล</th>{payCols.map((c) => <th key={c.key} className="w-[104px] text-right font-light"><span className="mr-[4px] inline-block size-[6px] rounded-full bg-[#17c3a1]" />{c.label}</th>)}<th className="w-[110px] text-right font-light">รวม</th><th className="w-[30px]" /></tr></thead>
              <tbody>
                {v.rows.map((r, i) => {
                  const e = people.find((x) => x.id === r.empId)
                  return (
                    <tr key={i} className="border-t border-gray-line-2">
                      <td className="py-[6px] font-urbanist">{i + 1}</td>
                      <td className="pr-[6px]"><Select label={`รหัสพนักงาน แถว ${i + 1}`} value={String(r.empId)} options={people.map((p) => ({ value: String(p.id), label: p.code }))} onChange={(id) => { const p = people.find((x) => x.id === Number(id))!; set({ rows: v.rows.map((x, j) => (j === i ? { ...x, empId: p.id, salary: p.salary } : x)) }) }} /></td>
                      <td className="pr-[6px] font-medium">{e ? fullName(e) : '-'}</td>
                      {payCols.map((c) => <td key={c.key} className="px-[2px]"><input aria-label={`${c.label} แถว ${i + 1}`} inputMode="decimal" disabled={!allowed || locked} className="h-[34px] w-full rounded-[6px] bg-gray-bg px-[6px] text-right font-urbanist outline-none focus:bg-white focus:ring-1 focus:ring-blue-00" value={r[c.key] || ''} placeholder="0.00" onChange={(ev) => setCell(i, c.key, Number(ev.target.value.replace(/[^\d.]/g, '')) || 0)} /></td>)}
                      <td className="text-right font-urbanist font-semibold">{money(grossOf(r))}</td>
                      <td>{!locked && <button type="button" aria-label={`ลบแถว ${i + 1}`} onClick={() => set({ rows: v.rows.filter((_, j) => j !== i) })} className="text-gray-20 hover:text-[#c13232]">×</button>}</td>
                    </tr>
                  )
                })}
                {!v.rows.length && <tr><td colSpan={10} className="py-[30px] text-center text-[12px] font-light text-gray-20">กดปุ่ม “นำเข้าข้อมูลเงินเดือน” หรือเพิ่มพนักงานทีละคน</td></tr>}
              </tbody>
            </table>
          </div>
          <div className="flex flex-wrap items-center gap-[10px]">
            {!locked && <button type="button" disabled={!allowed} onClick={() => { const used = new Set(v.rows.map((r) => r.empId)); const p = people.find((x) => !used.has(x.id)); if (p) set({ rows: [...v.rows, { empId: p.id, salary: p.salary, allowance: 0, medical: 0, welfare: 0, share: 0, ot: 0 }] }) }} className="h-[32px] rounded-[8px] border border-blue-00 px-[12px] text-[12px] font-medium text-blue-00 hover:bg-blue-bg disabled:opacity-40">+ เพิ่มพนักงาน</button>}
            <span className="ml-auto text-[12px]">{`${v.rows.length} คน · รวมรายได้ `}<b className="font-urbanist" aria-label="รวมรายได้">{money(total)}</b>{' บาท'}</span>
          </div>
          {err && <p role="alert" className="text-[12px] text-red-00">{err}</p>}
        </section>
        <div className="flex justify-end gap-[10px]"><Btn kind="ghost" onClick={() => navigate('/hr')}>ยกเลิก</Btn><Btn onClick={next}>ถัดไป →</Btn></div>
        <section aria-label="รอบการจ่ายที่ผ่านมา" className={`${card} p-[18px]`}>
          <h2 className="mb-[8px] text-[14px] font-semibold">รอบการจ่ายเงินเดือน</h2>
          <table className="w-full text-left text-[12px]"><tbody>
            {[...all].sort((a, b) => b.id - a.id).map((r) => <tr key={r.id} className="border-t border-gray-line-2"><td className="py-[8px] font-urbanist font-medium">{r.no}</td><td className="font-light">{`${thDate(r.from)} – ${thDate(r.to)}`}</td><td>{r.status === 'paid' ? <Pill tone="bg-[#dff5e8] text-[#0f8a63]">ชำระแล้ว</Pill> : <Pill tone="bg-[#fff1d6] text-[#a8650b]">รอชำระ</Pill>}</td><td className="text-right"><Link to={`/hr/payroll/summary?id=${r.id}`} className="text-[12px] font-medium text-blue-00 hover:underline">สรุปการจ่าย ›</Link></td></tr>)}
          </tbody></table>
        </section>
      </div>
      {toast}
    </div>
  )
}
