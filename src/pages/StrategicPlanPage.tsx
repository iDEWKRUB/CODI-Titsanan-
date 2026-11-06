import { useMemo, useState } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { useToast } from '../components/leader/Parts'
import Modal from '../components/ui/Modal'
import PlanView, { blankItem } from '../components/strategic/PlanView'
import { Btn, Crumbs, Gate, PersonaSwitch, Title, page } from '../components/strategic/Parts'
import { baht, personas, stamp, type Plan } from '../data/strategic'
import { checkPlan, nextPlanNo, plans, submitPlan, usePersona, usePlans } from '../lib/strategicStore'

/** จัดทำแผนประจำปี (book 3 fig 2-7) — 2.1.2.3 ; flow: book 1 §2.2.1.2 / §2.2.1.2 (วางแผนงบประมาณ) */
export default function StrategicPlanPage() {
  const me = usePersona()
  const all = usePlans()
  const [sp] = useSearchParams()
  const navigate = useNavigate()
  const [toast, show] = useToast()
  const editing = all.find((x) => x.id === Number(sp.get('edit')))
  const office = personas.office.office
  const [p, setP] = useState<Plan>(
    () => editing ?? { id: 0, no: '', office, fiscalYear: '2568', creator: personas.office.name, shared: false, carry: false, detail: '', note: '', items: [blankItem()], status: 'draft', history: [], createdAt: stamp() },
  )
  const [problems, setProblems] = useState<string[]>([])
  const [prevOpen, setPrevOpen] = useState(false)
  const set = (x: Partial<Plan>) => setP((v) => ({ ...v, ...x }))
  const prev = useMemo(() => all.filter((x) => x.office === p.office && x.fiscalYear === String(Number(p.fiscalYear) - 1)).sort((a, b) => b.id - a.id)[0], [all, p.office, p.fiscalYear])
  const allowed = me === 'office'
  const rejected = editing && editing.review && (editing.status === 'returned' || editing.status === 'rejected')

  const save = () => {
    if (!allowed) return show('ต้องเป็นเจ้าหน้าที่สำนัก (ผู้จัดทำแผน)')
    const list = checkPlan(p)
    setProblems(list)
    if (list.length) return show('ตรวจพบรายการที่ต้องแก้ไข ดูรายการด้านบน')
    const id = p.id || plans.next()
    const rec = { ...p, id, no: p.no || nextPlanNo(p.office, p.fiscalYear) }
    submitPlan(rec, p.creator)
    show(`ยื่นแผน ${rec.no} แล้ว · แจ้งเตือนสำนักยุทธศาสตร์ฯ`)
    setTimeout(() => navigate('/strategic'), 1000)
  }

  return (
    <div className={`${page} items-center`}>
      <div className="flex w-full max-w-[1000px] flex-col gap-[12px]">
        <Title back="/strategic" right={<><button type="button" onClick={() => setPrevOpen(true)} className="rounded-[8px] border border-gray-line bg-white px-[12px] py-[6px] text-[12px] hover:border-blue-00 hover:text-blue-00">↻ ดูแผนเวอร์ชันก่อนหน้า</button><PersonaSwitch /></>}>จัดทำแผนประจำปี</Title>
        <Crumbs items={[{ label: 'หน้าแรก', to: '/strategic' }, { label: 'จัดทำแผนประจำปี' }]} />
        <Gate allowed={allowed} need="เจ้าหน้าที่สำนัก (ผู้จัดทำแผน)" />
        {rejected && editing?.review && <p role="status" className="rounded-[10px] border border-[#f2b3b3] bg-[#fff1f1] px-[14px] py-[10px] text-[13px] text-[#c0262d]"><b className="font-semibold">{editing.status === 'returned' ? 'ส่งกลับแก้ไข' : 'ไม่อนุมัติ'}:</b> {editing.review.reason}</p>}
        {problems.length > 0 && (
          <div role="alert" className="rounded-[10px] border border-[#f2b3b3] bg-[#fff1f1] px-[14px] py-[10px] text-[12px] text-[#c0262d]">
            <p className="font-semibold">ระบบตรวจสอบแผนงบประมาณพบรายการที่ต้องแก้ไข</p>
            <ul className="mt-[4px] list-disc pl-[18px]">{problems.map((x) => <li key={x}>{x}</li>)}</ul>
          </div>
        )}
        <PlanView p={p} set={allowed ? set : undefined} readOnly={!allowed} errors={{}} />
        <div className="flex justify-end gap-[8px]">
          <Btn kind="ghost" onClick={() => navigate('/strategic')}>ยกเลิก</Btn>
          <Btn onClick={save}>บันทึก</Btn>
        </div>
      </div>

      <Modal open={prevOpen} onClose={() => setPrevOpen(false)} title="แผนเวอร์ชันก่อนหน้า" width="max-w-[720px]">
        {prev ? (
          <div className="flex max-h-[60vh] flex-col gap-[10px] overflow-y-auto text-[12px]">
            <p className="font-light text-gray-30">{prev.no} · ปีงบประมาณ {prev.fiscalYear} · {prev.office}</p>
            <p>{prev.detail}</p>
            <table className="w-full text-left">
              <thead className="text-[10px] font-light text-gray-20"><tr><th className="py-[4px] font-light">รหัส</th><th className="font-light">ชื่องบประมาณ</th><th className="text-right font-light">อนุมัติ (บาท)</th></tr></thead>
              <tbody>{prev.items.map((i) => <tr key={i.code} className="border-t border-gray-line-2"><td className="py-[6px] font-urbanist">{i.code}</td><td>{i.name}</td><td className="text-right font-urbanist">{baht(i.approved)}</td></tr>)}</tbody>
            </table>
            <div className="flex justify-end"><Btn kind="outline" onClick={() => { set({ detail: p.detail || prev.detail, items: prev.items.map((i) => ({ ...i, approved: 0, committed: 0, annual: 0 })) }); setPrevOpen(false); show('คัดลอกรายการจากปีก่อนแล้ว') }}>คัดลอกรายการมาใช้</Btn></div>
          </div>
        ) : (
          <p className="text-[13px] font-light text-gray-30">ไม่พบแผนของปีงบประมาณ {Number(p.fiscalYear) - 1} สำหรับ {p.office}</p>
        )}
      </Modal>
      {toast}
    </div>
  )
}
