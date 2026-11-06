import { useEffect, useMemo, useState } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { useToast } from '../components/leader/Parts'
import Select from '../components/ui/Select'
import { CommentBox, Crumbs, Gate, PersonaSwitch, Radios, StatusPill, Title, page } from '../components/project/Parts'
import { decisionLabel, proposalStatus, type Decision, type Proposal } from '../data/erpProject'
import { personas } from '../data/strategic'
import { summarize, useProposals } from '../lib/erpProjectStore'
import { usePersona } from '../lib/strategicStore'

const pageTitles = ['ข้อมูลผู้สร้างและข้อมูลแผนงาน', 'ข้อเสนอโครงการ (วัตถุประสงค์ ที่มาและความสำคัญ)', 'ประเภทโครงการและงบประมาณ']

/** สรุปความเห็นและสรุปผลการตรวจสอบโครงการ (book 3 fig 2-17) — 2.1.3.6 ; result is sent to the proposing office */
export default function ProjectSummaryPage() {
  const me = usePersona()
  const all = useProposals()
  const [sp] = useSearchParams()
  const navigate = useNavigate()
  const [toast, show] = useToast()
  const open = useMemo(() => all.filter((p) => p.status === 'submitted'), [all])
  const [id, setId] = useState<number>(Number(sp.get('id')) || 0)
  const cur: Proposal | undefined = all.find((p) => p.id === id)
  const [pc, setPc] = useState<[string, string, string]>(['', '', ''])
  const [decision, setDecision] = useState<Decision>('approve')
  const [reason, setReason] = useState('')
  const [tried, setTried] = useState(false)
  const allowed = me === 'strat'

  useEffect(() => {
    if (!id && open[0]) setId(open[0].id)
  }, [id, open])
  useEffect(() => {
    const p = all.find((x) => x.id === id)
    if (!p) return
    setPc([p.pageComments[0] || p.comment, p.pageComments[1], p.pageComments[2]])
    setDecision(p.result?.decision ?? 'approve')
    setReason(p.result?.reason ?? '')
    setTried(false)
  }, [id]) // eslint-disable-line react-hooks/exhaustive-deps

  const needReason = decision !== 'approve' && !reason.trim()
  const done = cur && cur.status !== 'submitted'
  const save = () => {
    if (!allowed) return show('ต้องเป็นเจ้าหน้าที่สำนักยุทธศาสตร์ฯ หรือผู้มีอำนาจ')
    if (!cur) return show('ไม่มีโครงการที่รอพิจารณา')
    setTried(true)
    if (needReason) return show('กรุณาระบุเหตุผลประกอบการพิจารณา')
    summarize(cur.id, pc, decision, reason.trim() || 'เห็นสมควรได้รับการอนุมัติ', personas.strat.name)
    show(`${decisionLabel[decision]} · ส่งแจ้งเตือนถึง ${cur.creator} (${cur.office}) แล้ว`)
    setTimeout(() => navigate('/project'), 1200)
  }

  return (
    <div className={`${page} items-center`}>
      <div className="flex w-full max-w-[860px] flex-col gap-[12px]">
        <Title back="/project/review" right={<PersonaSwitch />}>สรุปความเห็นและสรุปผลการตรวจสอบโครงการ</Title>
        <Crumbs items={[{ label: 'หน้าแรก', to: '/project' }, { label: 'พิจารณาโครงการ', to: '/project/review' }, { label: 'สรุปผลการตรวจสอบ' }]} />
        <Gate allowed={allowed} need="เจ้าหน้าที่สำนักยุทธศาสตร์ฯ / ผู้มีอำนาจ" />

        <div className="flex flex-wrap items-center gap-[10px]">
          <span className="text-[12px] font-semibold">โครงการ</span>
          <div className="w-[420px] max-sm:w-full">
            <Select label="เลือกโครงการ" value={cur ? String(cur.id) : ''} placeholder={open.length ? 'เลือกโครงการ' : 'ไม่มีโครงการที่รอพิจารณา'} options={(cur && cur.status !== 'submitted' ? [cur, ...open] : open).map((p) => ({ value: String(p.id), label: `${p.name} · ${p.office}` }))} onChange={(v) => setId(Number(v))} />
          </div>
          {cur && <StatusPill {...proposalStatus[cur.status]} />}
        </div>
        {done && cur?.result && <p role="status" className="rounded-[10px] bg-blue-bg px-[14px] py-[10px] text-[12px] text-gray-30">พิจารณาแล้วโดย {cur.result.by} เมื่อ {cur.result.at} — {decisionLabel[cur.result.decision]}</p>}

        {cur ? (
          <>
            <section className="flex flex-col gap-[10px] rounded-[12px] border border-[#f5c9c9] bg-[#fdf0f0] p-[18px]">
              <h2 className="text-[15px] font-semibold text-black">สรุปความเห็น / Comment</h2>
              {pc.map((v, i) => (
                <CommentBox key={i} label={`รายละเอียด หน้าที่ ${i + 1} · ${pageTitles[i]}`} value={v} disabled={!allowed || !!done} onChange={(x) => setPc((s) => s.map((y, j) => (j === i ? x : y)) as [string, string, string])} />
              ))}
            </section>

            <section className="flex flex-col gap-[10px] rounded-[12px] border border-[#c1e7ff] bg-[#e8f5ff] p-[18px]">
              <h2 className="text-[15px] font-semibold text-black">สรุปผลการตรวจสอบ</h2>
              <Radios label="ผลการตรวจสอบโครงการ" value={decision} options={(Object.keys(decisionLabel) as Decision[]).map((k) => ({ key: k, label: decisionLabel[k] }))} onChange={(v) => setDecision(v as Decision)} disabled={!allowed || !!done} />
              <CommentBox label="เหตุผลประกอบการพิจารณางาน" value={reason} onChange={setReason} disabled={!allowed || !!done} error={tried && needReason ? 'กรุณาระบุเหตุผล (กรณีแก้ไขโครงการหรือไม่อนุมัติ)' : undefined} />
            </section>
            <div className="flex justify-end">
              <button type="button" onClick={save} disabled={!!done} className="flex h-[40px] items-center gap-[8px] rounded-[8px] bg-blue-00 px-[18px] text-[13px] font-medium text-white transition hover:brightness-110 disabled:opacity-40">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><circle cx="12" cy="12" r="9" /><path d="m8 12 3 3 5-6" /></svg>
                บันทึกและส่งแจ้งเตือน
              </button>
            </div>
          </>
        ) : (
          <p className="rounded-[12px] border border-dashed border-gray-line bg-white py-[48px] text-center text-[13px] font-light text-gray-20">ยังไม่มีโครงการที่รอสรุปผลการตรวจสอบ</p>
        )}
      </div>
      {toast}
    </div>
  )
}
