import { useEffect, useState } from 'react'
import { Link, useLocation, useNavigate, useParams } from 'react-router-dom'
import { BackTitle, Field, primaryBtn, softBtn, useToast } from '../components/leader/Parts'
import { field } from '../components/meeting/FormParts'
import { fmtBaht, PmSection, pmPage, ProjectBadge, RoleSwitch, toNum } from '../components/pm/Parts'
import Modal from '../components/ui/Modal'
import { disbStatusLabel, type Project } from '../data/projects'
import { thaiLong } from '../data/leader'
import { createDisbursement, getProject, updateProject, useDisbursements, useProjects, usePmRole } from '../lib/projectStore'

const today = () => new Date().toISOString().slice(0, 10)

export default function ProjectDetailPage() {
  const { id } = useParams()
  const navigate = useNavigate()
  const location = useLocation()
  const role = usePmRole()
  const all = useProjects()
  const disbs = useDisbursements()
  const p = all.find((x) => x.id === Number(id)) ?? getProject(Number(id))
  const [toast, showToast] = useToast()
  const [approve, setApprove] = useState(false)
  const [reject, setReject] = useState(false)
  const [amount, setAmount] = useState('')
  const [note, setNote] = useState('')

  useEffect(() => {
    const t = (location.state as { toast?: string } | null)?.toast
    if (!t) return
    showToast(t)
    navigate(location.pathname, { replace: true, state: null })
  }, [location.state])

  if (!p)
    return (
      <div className={pmPage}>
        <BackTitle title="รายละเอียดโครงการ" to="/projects" />
        <p className="rounded-[12px] bg-gray-subtle p-[24px] text-center text-[14px] text-gray-20">ไม่พบโครงการนี้</p>
      </div>
    )

  const mine = disbs.filter((d) => d.projectId === p.id)
  const paid = mine.filter((d) => d.status === 'reviewed').reduce((n, d) => n + toNum(d.amount), 0)
  const stamp = (text: string, patch: Partial<Project> = {}) => updateProject(p.id, (x) => ({ ...x, ...patch, timeline: [...x.timeline, { at: today(), text }] }))

  const card = 'flex flex-col gap-[4px] rounded-[10px] border border-gray-line p-[14px] transition hover:border-blue-10 hover:shadow-[0_2px_10px_rgba(0,133,249,0.12)] focus-visible:outline-2 focus-visible:outline-blue-00'
  const isOpen = p.status === 'open' || p.status === 'closing'
  const canSend = p.status === 'approved' || isOpen

  return (
    <div className={pmPage}>
      <BackTitle title={p.name || 'รายละเอียดโครงการ'} to="/projects" actions={<><ProjectBadge status={p.status} /><RoleSwitch /></>} />

      <PmSection title="ข้อมูลโครงการ">
        <dl className="grid grid-cols-[130px_minmax(0,1fr)_130px_minmax(0,1fr)] gap-x-[12px] gap-y-[10px] text-[13px] leading-[1.5] max-md:grid-cols-[110px_minmax(0,1fr)]">
          {[
            ['รหัสโครงการ', p.code],
            ['ประเภท', p.type],
            ['ปีงบประมาณ', p.fiscalYear],
            ['งบประมาณที่อนุมัติ', p.budget ? `${fmtBaht(p.budget)} บาท` : 'ยังไม่อนุมัติ'],
            ['องค์กรผู้เสนอ', p.org.org || '–'],
            ['ผู้ประสานงาน', `${p.org.coordinator || '–'} ${p.org.phone}`],
            ['พื้นที่', `ต.${p.area.subdistrict || '–'} อ.${p.area.district || '–'} จ.${p.area.province || '–'}`],
            ['เบิกจ่ายแล้ว', `${fmtBaht(paid)} บาท`],
          ].map(([k, v]) => (
            <div key={k} className="contents">
              <dt className="font-medium text-gray-20">{k}</dt>
              <dd className="font-light text-black">{v}</dd>
            </div>
          ))}
        </dl>
      </PmSection>

      <PmSection title="ดำเนินการ">
        {role === 'community' ? (
          <div className="grid grid-cols-4 gap-[12px] max-lg:grid-cols-2 max-sm:grid-cols-1">
            {p.status === 'draft' && (
              <Link to={`/projects/${p.id}/form`} className={card}>
                <b className="text-[14px] font-semibold text-gray-30">กรอกแบบฟอร์มยื่นเสนอ</b>
                <span className="text-[12px] font-light text-gray-20">ยังเป็นแบบร่าง ส่งให้เจ้าหน้าที่พิจารณา</span>
              </Link>
            )}
            {p.status === 'submitted' && <p className="col-span-4 text-[13px] font-light text-gray-20 max-lg:col-span-2 max-sm:col-span-1">ส่งข้อมูลแล้ว รอเจ้าหน้าที่พิจารณา — ยังเบิกจ่ายหรือรายงานผลไม่ได้</p>}
            {canSend && (
              <>
                <button type="button" onClick={() => navigate(`/disbursement/${createDisbursement(p)}`)} className={`${card} text-left`}>
                  <b className="text-[14px] font-semibold text-gray-30">ขอเบิกจ่ายงบประมาณ</b>
                  <span className="text-[12px] font-light text-gray-20">ทำหนังสือขอเบิกจ่ายตามงวด + ลงลายมือชื่อ</span>
                </button>
                <Link to={`/projects/${p.id}/report`} className={card}>
                  <b className="text-[14px] font-semibold text-gray-30">รายงานและติดตามผล</b>
                  <span className="text-[12px] font-light text-gray-20">รายงานความก้าวหน้ารายงวด ({p.reports.length} ฉบับ)</span>
                </Link>
              </>
            )}
            {isOpen && (
              <Link to={`/projects/${p.id}/close`} className={card}>
                <b className="text-[14px] font-semibold text-gray-30">ขอปิดโครงการ</b>
                <span className="text-[12px] font-light text-gray-20">{p.status === 'closing' ? 'ส่งแล้ว — ดูเอกสาร' : 'จดหมายและรายงานสรุปผลการดำเนินงาน'}</span>
              </Link>
            )}
            {p.status === 'closed' && <p className="col-span-4 text-[13px] font-light text-green-text max-lg:col-span-2 max-sm:col-span-1">โครงการปิดแล้ว {p.closure.closedAt && `เมื่อ ${thaiLong(p.closure.closedAt)}`}</p>}
          </div>
        ) : (
          <div className="flex flex-wrap items-center gap-[10px]">
            {p.status === 'submitted' && (
              <>
                <button type="button" className={primaryBtn} onClick={() => (setAmount(p.budget || ''), setApprove(true))}>
                  อนุมัติโครงการ
                </button>
                <button type="button" className={softBtn} onClick={() => setReject(true)}>
                  ส่งกลับแก้ไข
                </button>
              </>
            )}
            {p.status === 'approved' && (
              <button type="button" className={primaryBtn} onClick={() => (stamp('เปิดโครงการ', { status: 'open' }), showToast('เปิดโครงการแล้ว'))}>
                เปิดโครงการ
              </button>
            )}
            {p.status === 'closing' && (
              <Link to={`/projects/${p.id}/close`} className={primaryBtn}>
                ประเมินและปิดโครงการ
              </Link>
            )}
            {canSend && (
              <Link to={`/projects/${p.id}/report`} className={softBtn}>
                ดูรายงานความก้าวหน้า ({p.reports.length})
              </Link>
            )}
            {['draft', 'closed'].includes(p.status) && <span className="text-[13px] font-light text-gray-20">{p.status === 'draft' ? 'ผู้เสนอยังไม่ส่งข้อมูล' : 'โครงการนี้ปิดแล้ว'}</span>}
          </div>
        )}
      </PmSection>

      <PmSection title={`การเบิกจ่าย (${mine.length})`} defaultOpen={mine.length > 0}>
        {mine.length === 0 ? (
          <p className="text-[13px] font-light text-gray-20">ยังไม่มีใบเบิก</p>
        ) : (
          <ul className="flex flex-col gap-[6px]">
            {mine.map((d) => (
              <li key={d.id}>
                <Link to={`/disbursement/${d.id}`} className="flex flex-wrap items-center gap-[12px] rounded-[8px] px-[10px] py-[8px] text-[13px] hover:bg-blue-bg">
                  <span className="font-medium">งวดที่ {d.period}</span>
                  <span className="font-light text-gray-20">{d.createdAt}</span>
                  <span className="ml-auto font-urbanist font-medium">{fmtBaht(d.amount)} บาท</span>
                  <span className="rounded-[6px] bg-blue-20 px-[8px] py-[2px] text-[12px] text-blue-00">{disbStatusLabel[d.status]}</span>
                </Link>
              </li>
            ))}
          </ul>
        )}
      </PmSection>

      <PmSection title="ประวัติการดำเนินงาน" defaultOpen={false}>
        <ol className="flex flex-col gap-[8px] border-l-2 border-blue-20 pl-[16px]">
          {[...p.timeline].reverse().map((t, i) => (
            <li key={i} className="text-[13px]">
              <span className="font-medium text-black">{t.text}</span> <span className="font-light text-gray-20">· {thaiLong(t.at)}</span>
            </li>
          ))}
        </ol>
      </PmSection>

      <Modal open={approve} title="อนุมัติโครงการ" onClose={() => setApprove(false)}>
        <Field label="งบประมาณที่อนุมัติ (บาท)">
          <input inputMode="decimal" className={field} value={amount} onChange={(e) => setAmount(e.target.value.replace(/[^\d.]/g, ''))} />
        </Field>
        <div className="flex justify-end gap-[8px]">
          <button type="button" className={softBtn} onClick={() => setApprove(false)}>
            ยกเลิก
          </button>
          <button
            type="button"
            className={primaryBtn}
            disabled={toNum(amount) <= 0}
            onClick={() => {
              stamp(`อนุมัติโครงการ งบ ${fmtBaht(amount)} บาท`, { status: 'approved', budget: amount })
              setApprove(false)
              showToast('อนุมัติโครงการแล้ว')
            }}
          >
            อนุมัติ
          </button>
        </div>
      </Modal>
      <Modal open={reject} title="ส่งกลับแก้ไข" onClose={() => setReject(false)}>
        <Field label="เหตุผล / ข้อแนะนำ">
          <textarea className={`${field} h-[100px] py-[10px]`} value={note} onChange={(e) => setNote(e.target.value)} />
        </Field>
        <div className="flex justify-end gap-[8px]">
          <button type="button" className={softBtn} onClick={() => setReject(false)}>
            ยกเลิก
          </button>
          <button
            type="button"
            className={primaryBtn}
            onClick={() => {
              stamp(`ส่งกลับแก้ไข${note ? `: ${note}` : ''}`, { status: 'draft' })
              setReject(false)
              setNote('')
              showToast('ส่งกลับให้ผู้เสนอแก้ไขแล้ว')
            }}
          >
            ส่งกลับ
          </button>
        </div>
      </Modal>
      {toast}
    </div>
  )
}
