import { useState } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { useToast } from '../components/leader/Parts'
import Select from '../components/ui/Select'
import { Btn, Crumbs, Gate, PersonaSwitch, Section, Title, ctl, err, page, ta } from '../components/project/Parts'
import { baht, blankExpense, budgetCategories, budgetGroups, pStatus, planBudget, planKinds, planStates, spentOf, stamp, years, type Perf } from '../data/erpProject'
import { personas } from '../data/strategic'
import { approvePerf, checkPerf, savePerf, usePerfs } from '../lib/erpProjectStore'
import { usePersona } from '../lib/strategicStore'

const num = (s: string) => Number(s.replace(/[^\d.]/g, '')) || 0
const sel = (list: string[]) => list.map((v) => ({ value: v, label: v }))
const blank = (): Perf => ({
  id: 0, no: '', name: '', strategy: '', year: '2568', state: planStates[0], kind: planKinds[0], office: personas.office.office, creator: personas.office.name, date: new Date().toISOString().slice(0, 10),
  code: '', category: '', group: budgetGroups[0], item: budgetCategories[0], init: 0, approved: 0, annual: 0, target: 0, progress: 0, note: '', expenses: [blankExpense(), blankExpense(), blankExpense()], status: 'draft',
})

/** รายงานผลการดำเนินงาน (book 3 fig 2-14) — 2.1.3.3 : plan details, budget details and the real spending (ใบแจ้งหนี้) of one plan */
export default function ProjectPerfReportPage() {
  const me = usePersona()
  const all = usePerfs()
  const [sp] = useSearchParams()
  const navigate = useNavigate()
  const [toast, show] = useToast()
  const editing = all.find((x) => x.id === Number(sp.get('id')))
  const view = sp.get('view') === '1' || (!!editing && editing.status !== 'draft')
  const [p, setP] = useState<Perf>(() => (editing ? { ...editing, expenses: editing.expenses.length ? editing.expenses : [blankExpense()] } : blank()))
  const [tried, setTried] = useState(false)
  const set = (x: Partial<Perf>) => setP((v) => ({ ...v, ...x }))
  const allowed = me === 'office' && !view
  const errors = checkPerf(p, true)
  const e = tried ? errors : {}
  const spent = spentOf(p)
  const budget = planBudget(p)
  const left = budget - spent
  const ro = `${ctl} bg-gray-bg text-gray-30`
  const dis = !allowed
  const upd = (i: number, x: Partial<Perf['expenses'][number]>) => set({ expenses: p.expenses.map((r, j) => (j === i ? { ...r, ...x } : r)) })

  const reset = () => { setP(blank()); setTried(false); show('ล้างแบบฟอร์มแล้ว') }
  const save = (status: 'draft' | 'submitted') => {
    if (me !== 'office') return show('ต้องเป็นเจ้าหน้าที่สำนัก (ผู้จัดทำรายงาน)')
    const list = checkPerf(p, status === 'submitted')
    if (status === 'draft' && Object.keys(list).filter((k) => k !== 'init').length) { setTried(true); return show('กรุณาแก้ไขข้อมูลที่ไม่ถูกต้องก่อนบันทึก') }
    if (status === 'submitted' && Object.keys(list).length) { setTried(true); return show('กรุณากรอกข้อมูลที่จำเป็นให้ครบและถูกต้อง') }
    const rec = savePerf({ ...p, date: p.date || stamp().slice(0, 10) }, status)
    show(status === 'submitted' ? `ส่งอนุมัติ ${rec.no} แล้ว · แจ้งเตือนสำนักยุทธศาสตร์ฯ` : `บันทึกร่าง ${rec.no} แล้ว`)
    setTimeout(() => navigate('/project/records'), 1000)
  }
  const approve = () => {
    approvePerf(p.id)
    show(`อนุมัติผลการดำเนินงาน ${p.no} แล้ว`)
    setTimeout(() => navigate('/project/records'), 900)
  }

  return (
    <div className={`${page} items-center`}>
      <div className="flex w-full max-w-[1000px] flex-col gap-[12px]">
        <Title back="/project/records" right={<PersonaSwitch />}>รายงานผลการดำเนินงาน</Title>
        <Crumbs items={[{ label: 'หน้าแรก', to: '/project' }, { label: 'รายการผลการดำเนินงาน', to: '/project/records' }, { label: view ? 'รายละเอียด' : editing ? 'แก้ไข' : 'เพิ่มผลการดำเนินงาน' }]} />
        {me !== 'office' && !view && <Gate allowed={false} need="เจ้าหน้าที่สำนัก (ผู้จัดทำรายงาน)" />}
        {view && <p role="status" className="rounded-[10px] bg-blue-bg px-[14px] py-[10px] text-[12px] text-gray-30">โหมดดูรายละเอียด{editing && editing.status !== 'draft' ? ' — เอกสารที่ส่งอนุมัติแล้วแก้ไขไม่ได้' : ''}</p>}

        <Section title="รายละเอียดแผนงาน">
          <div className="grid grid-cols-3 gap-x-[14px] gap-y-[10px] max-lg:grid-cols-2 max-sm:grid-cols-1">
            <Fld label="เลขที่แผนงาน"><input aria-label="เลขที่แผนงาน" readOnly className={ro} value={p.no} placeholder="ระบบออกให้ เช่น BP-07-68-0012" /></Fld>
            <Fld label="ปีงบประมาณ"><Select label="ปีงบประมาณ" value={p.year} options={years.map((y) => ({ value: y, label: `ปีงบ ${y}` }))} onChange={(v) => set({ year: v })} className={dis ? 'pointer-events-none opacity-70' : ''} /></Fld>
            <Fld label="สถานะแผนงาน"><Select label="สถานะแผนงาน" value={p.state} options={sel(planStates)} onChange={(v) => set({ state: v })} className={dis ? 'pointer-events-none opacity-70' : ''} /></Fld>
            <Fld label="ชื่อแผนงาน" error={e.name}><input aria-label="ชื่อแผนงาน" readOnly={dis} className={`${ctl} ${dis ? 'bg-gray-bg' : ''} ${e.name ? err : ''}`} placeholder="ชื่อแผนงาน" value={p.name} onChange={(x) => set({ name: x.target.value })} /></Fld>
            <Fld label="ประเภทแผนงาน"><Select label="ประเภทแผนงาน" value={p.kind} options={sel(planKinds)} onChange={(v) => set({ kind: v })} className={dis ? 'pointer-events-none opacity-70' : ''} /></Fld>
            <Fld label="ส่วนงาน"><input aria-label="ส่วนงาน" readOnly className={ro} value={p.office} /></Fld>
            <Fld label="ผู้จัดทำ"><input aria-label="ผู้จัดทำ" readOnly className={ro} value={p.creator} /></Fld>
            <Fld label="วันที่จัดทำ"><input aria-label="วันที่จัดทำ" type="date" readOnly={dis} disabled={dis} className={ctl} value={p.date} onChange={(x) => set({ date: x.target.value })} /></Fld>
            <Fld label="ยุทธศาสตร์"><input aria-label="ยุทธศาสตร์" readOnly={dis} className={`${ctl} ${dis ? 'bg-gray-bg' : ''}`} placeholder="เช่น บริหารดิจิทัล" value={p.strategy} onChange={(x) => set({ strategy: x.target.value })} /></Fld>
            <Fld label="เป้าหมายความคืบหน้า (%)" error={e.progress}><input aria-label="เป้าหมายความคืบหน้า" inputMode="numeric" readOnly={dis} className={`${ctl} text-right font-urbanist ${dis ? 'bg-gray-bg' : ''} ${e.progress ? err : ''}`} value={p.target} onChange={(x) => set({ target: num(x.target.value) })} /></Fld>
            <Fld label="ความคืบหน้าจริง (%)"><input aria-label="ความคืบหน้าจริง" inputMode="numeric" readOnly={dis} className={`${ctl} text-right font-urbanist ${dis ? 'bg-gray-bg' : ''} ${e.progress ? err : ''}`} value={p.progress} onChange={(x) => set({ progress: num(x.target.value) })} /></Fld>
          </div>
        </Section>

        <Section title="รายละเอียดงบประมาณ">
          <div className="grid grid-cols-3 gap-x-[14px] gap-y-[10px] max-lg:grid-cols-2 max-sm:grid-cols-1">
            <Fld label="รหัสงบประมาณ" error={e.code}><input aria-label="รหัสงบประมาณ" inputMode="numeric" maxLength={6} readOnly={dis} className={`${ctl} font-urbanist ${dis ? 'bg-gray-bg' : ''} ${e.code ? err : ''}`} placeholder="เช่น 50207" value={p.code} onChange={(x) => set({ code: x.target.value.replace(/\D/g, '') })} /></Fld>
            <Fld label="รหัสหมวด"><input aria-label="รหัสหมวด" readOnly={dis} className={`${ctl} ${dis ? 'bg-gray-bg' : ''}`} placeholder="เช่น ซอฟต์แวร์คอมพิวเตอร์" value={p.category} onChange={(x) => set({ category: x.target.value })} /></Fld>
            <Fld label="กลุ่มงบประมาณ"><Select label="กลุ่มงบประมาณ" value={p.group} options={sel(budgetGroups)} onChange={(v) => set({ group: v })} className={dis ? 'pointer-events-none opacity-70' : ''} /></Fld>
            <Fld label="หมวดงบประมาณ"><Select label="หมวดงบประมาณ" value={p.item} options={sel(budgetCategories)} onChange={(v) => set({ item: v })} className={dis ? 'pointer-events-none opacity-70' : ''} /></Fld>
            <Fld label="งบประมาณตั้งต้น (บาท)" error={e.init}><input aria-label="งบประมาณตั้งต้น" inputMode="decimal" readOnly={dis} className={`${ctl} text-right font-urbanist ${dis ? 'bg-gray-bg' : ''} ${e.init ? err : ''}`} value={p.init || ''} placeholder="0" onChange={(x) => set({ init: num(x.target.value) })} /></Fld>
            <Fld label="งบประมาณที่อนุมัติ (บาท)"><input aria-label="งบประมาณที่อนุมัติ" inputMode="decimal" readOnly={dis} className={`${ctl} text-right font-urbanist ${dis ? 'bg-gray-bg' : ''}`} value={p.approved || ''} placeholder="0" onChange={(x) => set({ approved: num(x.target.value) })} /></Fld>
            <Fld label="งบประมาณประจำปี (บาท)"><input aria-label="งบประมาณประจำปี" readOnly className={`${ro} text-right font-urbanist`} value={p.annual} /></Fld>
          </div>
          <Fld label="หมายเหตุ"><textarea aria-label="หมายเหตุ" readOnly={dis} placeholder="รายละเอียดเพิ่มเติม" className={`${ta} ${dis ? "bg-gray-bg" : ""}`} value={p.note} onChange={(x) => set({ note: x.target.value })} /></Fld>
        </Section>

        <Section title="รายละเอียดการเบิกจ่าย">
          <div className="overflow-x-auto">
            <table className="w-full min-w-[720px] text-left text-[12px]">
              <thead className="text-[10px] font-light text-gray-20"><tr><th className="w-[150px] py-[6px] font-light">เลขที่ใบแจ้งหนี้</th><th className="w-[150px] font-light">วันที่</th><th className="font-light">รายละเอียด</th><th className="w-[130px] text-right font-light">จำนวนเงิน (บาท)</th><th className="w-[70px] pl-[8px] font-light">การดำเนินการ</th></tr></thead>
              <tbody>
                {p.expenses.map((r, i) => (
                  <tr key={i} className="border-t border-gray-line-2">
                    <td className="py-[8px] pr-[8px]"><input aria-label={`เลขที่ใบแจ้งหนี้ แถว ${i + 1}`} readOnly={dis} className={`${ctl} h-[36px] px-[8px] text-[12px] ${dis ? 'bg-gray-bg' : ''}`} value={r.invoice} onChange={(x) => upd(i, { invoice: x.target.value })} /></td>
                    <td className="pr-[8px]"><input aria-label={`วันที่ แถว ${i + 1}`} type="date" disabled={dis} className={`${ctl} h-[36px] px-[8px] text-[12px]`} value={r.date} onChange={(x) => upd(i, { date: x.target.value })} /></td>
                    <td className="pr-[8px]"><input aria-label={`รายละเอียด แถว ${i + 1}`} readOnly={dis} className={`${ctl} h-[36px] px-[8px] text-[12px] ${dis ? 'bg-gray-bg' : ''}`} value={r.detail} onChange={(x) => upd(i, { detail: x.target.value })} /></td>
                    <td className="pr-[8px]"><input aria-label={`จำนวนเงิน แถว ${i + 1}`} inputMode="decimal" readOnly={dis} className={`${ctl} h-[36px] px-[8px] text-right font-urbanist text-[12px] ${dis ? 'bg-gray-bg' : ''}`} value={r.amount} placeholder="0" onChange={(x) => upd(i, { amount: x.target.value.replace(/[^\d.]/g, '') })} /></td>
                    <td className="pl-[8px]">{!dis && <button type="button" aria-label={`ลบแถว ${i + 1}`} onClick={() => set({ expenses: p.expenses.filter((_, j) => j !== i) })} className="h-[32px] rounded-[8px] border border-gray-line bg-white px-[12px] text-[11px] font-medium hover:border-red-00 hover:text-red-00">ลบ</button>}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          {e.expenses && <p role="alert" className="text-[11px] text-red-00">{e.expenses}</p>}
          {!dis && (
            <div className="flex gap-[8px]">
              <button type="button" onClick={() => set({ expenses: [...p.expenses, blankExpense()] })} className="h-[34px] rounded-[8px] border border-gray-line bg-white px-[14px] text-[12px] font-medium hover:border-blue-00 hover:text-blue-00">+ เพิ่มรายการ</button>
              <button type="button" onClick={() => set({ expenses: [blankExpense()] })} className="h-[34px] rounded-[8px] border border-gray-line bg-white px-[14px] text-[12px] font-medium hover:border-blue-00 hover:text-blue-00">ล้างรายการ</button>
            </div>
          )}
        </Section>

        <Section title="สรุปรวม & workflow">
          <div className="grid grid-cols-3 gap-[14px] max-sm:grid-cols-1">
            <Fld label="รวมจำนวนเงิน (บาท)"><input aria-label="รวมจำนวนเงิน" readOnly className={`${ro} text-right font-urbanist`} value={baht(spent)} /></Fld>
            <Fld label="คงเหลือ (จากงบอนุมัติ)"><input aria-label="คงเหลือ" readOnly className={`${ro} text-right font-urbanist ${left < 0 ? 'text-red-00' : ''}`} value={baht(left)} /></Fld>
            <Fld label="สถานะเอกสาร"><div className="flex h-[40px] items-center"><span className={`rounded-[6px] px-[10px] py-[3px] text-[11px] font-medium ${pStatus[p.status].tone}`}>{pStatus[p.status].label}</span></div></Fld>
          </div>
        </Section>

        <div className="flex flex-wrap justify-end gap-[8px]">
          {view ? (
            <>
              <Btn kind="ghost" onClick={() => navigate('/project/records')}>กลับรายการ</Btn>
              {me === 'strat' && p.status === 'submitted' && <Btn onClick={approve}>อนุมัติผลการดำเนินงาน</Btn>}
            </>
          ) : (
            <>
              <Btn kind="ghost" onClick={reset}>ล้างแบบฟอร์ม</Btn>
              <Btn kind="outline" onClick={() => save('submitted')}>บันทึกและส่งอนุมัติ</Btn>
              <Btn onClick={() => save('draft')}>บันทึก</Btn>
            </>
          )}
        </div>
      </div>
      {toast}
    </div>
  )
}

function Fld({ label, children, error }: { label: string; children: React.ReactNode; error?: string }) {
  return (
    <label className="flex min-w-0 flex-col gap-[4px]">
      <span className="text-[12px] font-medium text-gray-30">{label}</span>
      {children}
      {error && <span role="alert" className="text-[11px] text-red-00">{error}</span>}
    </label>
  )
}
