import { useEffect, useMemo, useState } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { useToast } from '../components/leader/Parts'
import Select from '../components/ui/Select'
import { Btn, CommentBox, Crumbs, Gate, PersonaSwitch, PlanInfo, ProposalForm, StatusPill, Title, page } from '../components/project/Parts'
import { proposalStatus } from '../data/erpProject'
import { saveComment, useProposals } from '../lib/erpProjectStore'
import { usePersona, usePlans } from '../lib/strategicStore'

/** พิจารณาโครงการ (book 3 fig 2-16) — 2.1.3.5 ; the strategy office reads a proposal and writes a comment before the summary step */
export default function ProjectReviewPage() {
  const me = usePersona()
  const all = useProposals()
  const plans = usePlans()
  const [sp] = useSearchParams()
  const navigate = useNavigate()
  const [toast, show] = useToast()
  const pending = useMemo(() => all.filter((p) => p.status === 'submitted'), [all])
  const [id, setId] = useState<number>(Number(sp.get('id')) || 0)
  const cur = all.find((p) => p.id === id)
  const [comment, setComment] = useState(cur?.comment ?? '')
  const allowed = me === 'strat'

  useEffect(() => {
    if (!id && pending[0]) setId(pending[0].id)
  }, [id, pending])
  useEffect(() => setComment(all.find((p) => p.id === id)?.comment ?? ''), [id, all])

  const draft = () => {
    if (!cur) return show('ไม่มีโครงการที่รอพิจารณา')
    saveComment(cur.id, comment.trim())
    show('บันทึกร่างความเห็นแล้ว')
  }
  const next = () => {
    if (!allowed) return show('ต้องเป็นเจ้าหน้าที่สำนักยุทธศาสตร์ฯ')
    if (!cur) return show('ไม่มีโครงการที่รอพิจารณา')
    saveComment(cur.id, comment.trim())
    navigate(`/project/summary?id=${cur.id}`)
  }

  return (
    <div className={`${page} items-center`}>
      <div className="flex w-full max-w-[860px] flex-col gap-[12px]">
        <Title back="/project" right={<PersonaSwitch />}>พิจารณาโครงการ</Title>
        <Crumbs items={[{ label: 'หน้าแรก', to: '/project' }, { label: 'พิจารณาโครงการ' }]} />
        <Gate allowed={allowed} need="เจ้าหน้าที่สำนักยุทธศาสตร์ นโยบายและแผน" />

        <div className="flex flex-wrap items-center gap-[10px]">
          <span className="text-[12px] font-light text-gray-30">โครงการที่สำนักส่งเข้ามา <b className="font-semibold text-[#2b4fbf]">รอพิจารณา {pending.length} โครงการ</b></span>
          <div className="w-[420px] max-sm:w-full">
            <Select label="เลือกโครงการที่รอพิจารณา" value={cur ? String(cur.id) : ''} placeholder={pending.length ? 'เลือกโครงการ' : 'ไม่มีโครงการที่รอพิจารณา'} options={(cur && cur.status !== 'submitted' ? [cur, ...pending] : pending).map((p) => ({ value: String(p.id), label: `${p.name} · ${p.office}` }))} onChange={(v) => setId(Number(v))} />
          </div>
          {cur && <StatusPill {...proposalStatus[cur.status]} />}
        </div>

        {cur ? (
          <>
            <section className="flex flex-col gap-[10px] rounded-[12px] border border-[#f5c9c9] bg-[#fdf0f0] p-[18px]">
              <h2 className="text-[15px] font-semibold text-black">ความเห็น / Comment</h2>
              <CommentBox label="รายละเอียด" value={comment} onChange={setComment} disabled={!allowed} />
            </section>
            <PlanInfo plan={plans.find((p) => p.id === cur.planId)} />
            <ProposalForm v={cur} />
            <p className="text-[11px] font-light text-gray-20">เสนอโดย {cur.creator} · {cur.office} · ส่งเมื่อ {cur.history.at(-1)?.at ?? cur.createdAt}</p>
            <div className="flex justify-end gap-[8px]">
              <Btn kind="ghost" onClick={() => navigate('/project')}>ยกเลิก</Btn>
              <Btn kind="outline" onClick={draft} disabled={!allowed}>บันทึกร่าง</Btn>
              <Btn onClick={next} disabled={!allowed}>ถัดไป</Btn>
            </div>
          </>
        ) : (
          <p className="rounded-[12px] border border-dashed border-gray-line bg-white py-[48px] text-center text-[13px] font-light text-gray-20">ยังไม่มีโครงการที่รอพิจารณา</p>
        )}
      </div>
      {toast}
    </div>
  )
}
