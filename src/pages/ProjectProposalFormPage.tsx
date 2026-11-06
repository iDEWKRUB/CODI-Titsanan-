import { useMemo, useState } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { useToast } from '../components/leader/Parts'
import Select from '../components/ui/Select'
import { Btn, Crumbs, Gate, PersonaSwitch, PlanInfo, ProposalForm, Title, page, type Draft } from '../components/project/Parts'
import { stamp, proposalStatus, type Proposal } from '../data/erpProject'
import { personas } from '../data/strategic'
import { proposals, saveProposalDraft, submitProposal, useProposals } from '../lib/erpProjectStore'
import { usePersona, usePlans } from '../lib/strategicStore'

/** แบบฟอร์มจัดทำโครงการ (book 3 fig 2-15) — 2.1.3.4 ; flow: the office writes a proposal under its approved annual plan, then sends it to the strategy office */
export default function ProjectProposalFormPage() {
  const me = usePersona()
  const plans = usePlans()
  const all = useProposals()
  const [sp] = useSearchParams()
  const navigate = useNavigate()
  const [toast, show] = useToast()
  const editing = all.find((x) => x.id === Number(sp.get('edit')))
  const office = personas.office.office
  const mine = useMemo(() => plans.filter((p) => p.status === 'approved' && p.office === (editing?.office ?? office)).sort((a, b) => b.fiscalYear.localeCompare(a.fiscalYear) || b.id - a.id), [plans, office, editing])
  const [planId, setPlanId] = useState<number>(editing?.planId ?? 0)
  const [v, setV] = useState<Draft>(() => (editing ? { name: editing.name, objective: editing.objective, background: editing.background, kind: editing.kind } : { name: '', objective: '', background: '', kind: 'โครงการจัดจ้าง' }))
  const [tried, setTried] = useState(false)
  const plan = plans.find((p) => p.id === planId)
  const allowed = me === 'office'
  const locked = !!editing && (editing.status === 'submitted' || editing.status === 'approved')

  const errors: Record<string, string> = {}
  if (!plan) errors.plan = 'กรุณาเลือกแผนงานที่ได้รับอนุมัติแล้ว'
  if (!v.name.trim()) errors.name = 'กรุณาระบุชื่อโครงการ'
  if (!v.objective.trim()) errors.objective = 'กรุณาระบุวัตถุประสงค์โครงการ'
  if (!v.background.trim()) errors.background = 'กรุณาระบุที่มาและความสำคัญของโครงการ'
  if (!errors.name && all.some((x) => x.id !== editing?.id && x.planId === planId && x.name.trim() === v.name.trim())) errors.name = 'มีโครงการชื่อนี้ในแผนงานนี้แล้ว'
  const e = tried ? errors : {}

  const build = (): Proposal => ({
    id: editing?.id ?? proposals.next(), planId, creator: editing?.creator ?? personas.office.name, office: plan?.office ?? office, ...v,
    status: editing?.status ?? 'draft', comment: editing?.comment ?? '', pageComments: editing?.pageComments ?? ['', '', ''], result: editing?.result, history: editing?.history ?? [], createdAt: editing?.createdAt ?? stamp(),
  })
  const draft = () => {
    if (!allowed) return show('ต้องเป็นเจ้าหน้าที่สำนัก (ผู้เสนอโครงการ)')
    if (!plan) return setTried(true), show('กรุณาเลือกแผนงานก่อนบันทึกร่าง')
    saveProposalDraft(build())
    show('บันทึกร่างแล้ว · กลับมาแก้ไขได้จากหน้าแรก')
  }
  const next = () => {
    if (!allowed) return show('ต้องเป็นเจ้าหน้าที่สำนัก (ผู้เสนอโครงการ)')
    setTried(true)
    if (Object.keys(errors).length) return show('กรุณากรอกข้อมูลที่จำเป็นให้ครบ')
    submitProposal(build())
    show(`ส่งโครงการ “${v.name.trim()}” แล้ว · แจ้งเตือนสำนักยุทธศาสตร์ฯ`)
    setTimeout(() => navigate('/project'), 1100)
  }

  return (
    <div className={`${page} items-center`}>
      <div className="flex w-full max-w-[860px] flex-col gap-[12px]">
        <Title back="/project" right={<PersonaSwitch />}>แบบฟอร์มจัดทำโครงการ</Title>
        <Crumbs items={[{ label: 'หน้าแรก', to: '/project' }, { label: 'แบบฟอร์มจัดทำโครงการ' }]} />
        <Gate allowed={allowed} need="เจ้าหน้าที่สำนัก (ผู้เสนอโครงการ)" />
        {editing?.result && (editing.status === 'revise' || editing.status === 'rejected') && (
          <p role="status" className="rounded-[10px] border border-[#f2b3b3] bg-[#fff1f1] px-[14px] py-[10px] text-[13px] text-[#c0262d]"><b className="font-semibold">{proposalStatus[editing.status].label}</b> · {editing.result.by}: {editing.result.reason}</p>
        )}
        {locked && editing && <p role="status" className="rounded-[10px] bg-blue-bg px-[14px] py-[10px] text-[12px] text-gray-30">โครงการนี้{editing.status === 'approved' ? 'ได้รับอนุมัติแล้ว' : 'อยู่ระหว่างการพิจารณา'} แก้ไขไม่ได้</p>}

        <div className="flex flex-wrap items-center gap-[10px] pt-[4px]">
          <span className="text-[12px] font-semibold">แผนงานที่อนุมัติแล้ว <span className="text-red-00">*</span></span>
          <div className="w-[420px] max-sm:w-full">
            <Select label="เลือกแผนงานที่อนุมัติแล้ว" value={plan ? String(plan.id) : ''} placeholder="เลือกแผนงานจาก ERP STRATEGIC" options={mine.map((p) => ({ value: String(p.id), label: `${p.no} · ${p.detail.slice(0, 40)}` }))} onChange={(x) => setPlanId(Number(x))} className={!allowed || locked ? 'pointer-events-none opacity-70' : ''} />
          </div>
          {e.plan && <span role="alert" className="text-[11px] text-red-00">{e.plan}</span>}
        </div>
        <p className="-mt-[4px] text-[11px] font-light text-gray-20">ข้อมูลผู้สร้างแผนงานและข้อมูลแผนงานดึงจากแผนประจำปีที่สำนักยุทธศาสตร์ฯ อนุมัติแล้ว (ERP STRATEGIC 2.1.2.4) แก้ไขไม่ได้</p>

        <PlanInfo plan={plan} />
        <ProposalForm v={v} set={allowed && !locked ? (x) => setV((s) => ({ ...s, ...x })) : undefined} errors={e} />
        <div className="flex justify-end gap-[8px]">
          <Btn kind="ghost" onClick={() => navigate('/project')}>ยกเลิก</Btn>
          <Btn kind="outline" onClick={draft} disabled={locked}>บันทึกร่าง</Btn>
          <Btn onClick={next} disabled={locked}>ถัดไป</Btn>
        </div>
      </div>
      {toast}
    </div>
  )
}

