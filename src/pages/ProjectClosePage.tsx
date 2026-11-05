import { useState } from 'react'
import { useParams } from 'react-router-dom'
import iconEye from '../assets/survey/icon-eye.svg'
import iconPen from '../assets/survey/icon-pen.svg'
import iconPlus from '../assets/survey/icon-plus.svg'
import iconSend from '../assets/meeting/c-send.svg'
import iconTrash from '../assets/survey/icon-trash.svg'
import { BackTitle, lbl, primaryBtn, softBtn, useToast } from '../components/leader/Parts'
import { field } from '../components/meeting/FormParts'
import SignatureModal from '../components/meeting/SignatureModal'
import { downloadDoc, esc, fmtBaht, PmSection, pmPage, RoleSwitch, roField, toNum } from '../components/pm/Parts'
import Modal from '../components/ui/Modal'
import { thaiLong } from '../data/leader'
import { uid } from '../data/surveyBuilder'
import type { Project } from '../data/projects'
import { getProject, updateProject, useDisbursements, usePmRole, useProjects } from '../lib/projectStore'

const today = () => new Date().toISOString().slice(0, 10)
const letterTpl = (p: Project) => `เรื่อง รายงานสรุปผลการดำเนินงานปิดโครงการ${p.name}\nเรียน ผู้อำนวยการสถาบันพัฒนาองค์กรชุมชน\n\nตามที่ ${p.org.org} ได้รับการสนับสนุนงบประมาณจำนวน ${fmtBaht(p.budget)} บาท เพื่อดำเนินโครงการ${p.name} นั้น บัดนี้โครงการได้ดำเนินการแล้วเสร็จตามแผน จึงขอรายงานสรุปผลการดำเนินงานและขอปิดโครงการ รายละเอียดปรากฏตามเอกสารแนบ\n\nจึงเรียนมาเพื่อโปรดพิจารณา`
const reportTpl = (p: Project, paid: number) => `รายงานสรุปผลการดำเนินงานปิดโครงการ\nโครงการ: ${p.name} (${p.code})\nองค์กร: ${p.org.org}\nพื้นที่: ต.${p.area.subdistrict} อ.${p.area.district} จ.${p.area.province}\n\n1. วัตถุประสงค์ของโครงการ\n…\n\n2. ผลการดำเนินงาน (ส่งรายงานความก้าวหน้า ${p.reports.length} งวด)\n…\n\n3. การใช้จ่ายงบประมาณ\nงบประมาณที่ได้รับอนุมัติ ${fmtBaht(p.budget)} บาท เบิกจ่ายแล้ว ${fmtBaht(paid)} บาท\n\n4. ปัญหา อุปสรรค และข้อเสนอแนะ\n…`

/** OSS-Project Management › ขอปิดโครงการ (Commu: make documents + sign · Staff: evaluate) */
export default function ProjectClosePage() {
  const { id } = useParams()
  const role = usePmRole()
  const projects = useProjects()
  const disbs = useDisbursements()
  const p = projects.find((x) => x.id === Number(id)) ?? getProject(Number(id))
  const [doc, setDoc] = useState<null | 'letter' | 'report'>(null)
  const [draft, setDraft] = useState('')
  const [view, setView] = useState<null | 'letter' | 'report'>(null)
  const [sign, setSign] = useState(false)
  const [tried, setTried] = useState(false)
  const [toast, showToast] = useToast()

  if (!p)
    return (
      <div className={pmPage}>
        <BackTitle title="ขอปิดโครงการ" to="/projects" />
        <p className="rounded-[12px] bg-gray-subtle p-[24px] text-center text-[14px] text-gray-20">ไม่พบโครงการนี้</p>
      </div>
    )
  const c = p.closure
  const patch = (x: Partial<Project['closure']>) => updateProject(p.id, (q) => ({ ...q, closure: { ...q.closure, ...x } }))
  const paid = disbs.filter((d) => d.projectId === p.id && d.status === 'reviewed').reduce((n, d) => n + toNum(d.amount), 0)
  const sent = p.status === 'closing' || p.status === 'closed'
  const communityLocked = sent || role === 'staff'

  const errors: Record<string, string> = {}
  if (!c.letter.trim()) errors.letter = 'ยังไม่ได้สร้างจดหมายรายงาน'
  if (!c.report.trim()) errors.report = 'ยังไม่ได้สร้างรายงานสรุปผล'
  if (!c.signature) errors.signature = 'ต้องลงลายมือชื่อก่อนส่งเอกสาร'
  const e = tried ? errors : {}

  const submit = () => {
    setTried(true)
    if (Object.keys(errors).length) return showToast('กรุณาสร้างเอกสารและลงลายมือชื่อให้ครบ')
    updateProject(p.id, (q) => ({ ...q, status: 'closing', closure: { ...q.closure, submittedAt: today() }, timeline: [...q.timeline, { at: today(), text: 'ขอปิดโครงการ' }] }))
    showToast('ส่งเอกสารขอปิดโครงการแล้ว รอเจ้าหน้าที่ประเมิน')
  }
  const closeProject = () => {
    if (!c.evals.length) return showToast('กรุณาเพิ่มหัวข้อการประเมินอย่างน้อย 1 หัวข้อ')
    if (c.evals.some((x) => !x.topic.trim() || !x.result.trim())) return showToast('กรุณากรอกเรื่องประเมินและผลการประเมินให้ครบ')
    updateProject(p.id, (q) => ({ ...q, status: 'closed', closure: { ...q.closure, closedAt: today() }, timeline: [...q.timeline, { at: today(), text: 'ปิดโครงการ (ประเมินแล้ว)' }] }))
    showToast('บันทึกผลประเมินและปิดโครงการแล้ว')
  }
  const exportDoc = (k: 'letter' | 'report') => downloadDoc(k === 'letter' ? 'จดหมายรายงานสรุปผลปิดโครงการ' : 'รายงานสรุปผลปิดโครงการ', k === 'letter' ? 'จดหมาย' : 'รายงาน', `<p>${esc(c[k])}</p>${k === 'letter' && c.signature ? `<p style="text-align:right">ลงชื่อ (${esc(p.org.coordinator)})</p>` : ''}`)

  const docRow = (k: 'letter' | 'report', label: string) => (
    <div className="flex flex-wrap items-center gap-[12px]">
      <span className={`${lbl} min-w-[320px] max-sm:min-w-0`}>{label}</span>
      {role === 'community' && !communityLocked ? (
        <button type="button" className={primaryBtn} onClick={() => (setDoc(k), setDraft(c[k] || (k === 'letter' ? letterTpl(p) : reportTpl(p, paid))))}>
          <img src={iconPlus} alt="" width={14} height={14} className="brightness-0 invert" />
          {c[k] ? 'แก้ไขเอกสาร' : 'สร้างเอกสาร'}
        </button>
      ) : null}
      {c[k] && (
        <>
          <span className="rounded-[6px] bg-green-bg px-[8px] py-[3px] text-[12px] text-green-text">สร้างแล้ว</span>
          <button type="button" className="text-[12px] font-medium text-blue-00 hover:underline" onClick={() => setView(k)}>
            ดู
          </button>
          <button type="button" className="text-[12px] font-medium text-blue-00 hover:underline" onClick={() => exportDoc(k)}>
            ดาวน์โหลด Word
          </button>
        </>
      )}
      {!c[k] && role === 'staff' && <span className="text-[12px] text-gray-20">ชุมชนยังไม่สร้าง</span>}
      {e[k] && <span role="alert" className="text-[12px] text-red-00">{e[k]}</span>}
    </div>
  )

  const setEval = (rid: string, x: { topic?: string; result?: string }) => patch({ evals: c.evals.map((r) => (r.id === rid ? { ...r, ...x } : r)) })

  return (
    <div className={pmPage}>
      <BackTitle title="ขอปิดโครงการ" to={`/projects/${p.id}`} actions={<RoleSwitch />} />
      {p.status === 'closed' && <p className="rounded-[10px] bg-green-bg px-[16px] py-[10px] text-[13px] font-light text-green-text">โครงการนี้ปิดแล้ว {c.closedAt && thaiLong(c.closedAt)}</p>}
      {p.status === 'closing' && role === 'community' && <p className="rounded-[10px] bg-blue-bg px-[16px] py-[10px] text-[13px] font-light text-blue-00">ส่งเอกสารขอปิดโครงการแล้ว รอเจ้าหน้าที่ประเมิน</p>}
      {role === 'community' && !sent && p.status !== 'open' && <p className="rounded-[10px] bg-yellow/20 px-[16px] py-[10px] text-[13px] font-light text-[#8a6a00]">โครงการต้องอยู่ในสถานะ “เปิดโครงการ” จึงจะขอปิดได้</p>}

      <PmSection title="รายละเอียดโครงการ">
        <div className="grid grid-cols-[110px_minmax(0,1fr)_110px_minmax(0,1.4fr)] items-center gap-x-[16px] gap-y-[16px] max-md:grid-cols-1">
          <span className={lbl}>รหัสโครงการ</span>
          <input readOnly className={roField} value={p.code} aria-label="รหัสโครงการ" />
          <span className={`${lbl} md:text-right`}>ชื่อโครงการ</span>
          <input readOnly className={roField} value={p.name} aria-label="ชื่อโครงการ" />
          <span className={lbl}>ตำบล</span>
          <input readOnly className={roField} value={p.area.subdistrict} aria-label="ตำบล" />
          <span className={`${lbl} md:text-right`}>อำเภอ / จังหวัด</span>
          <input readOnly className={roField} value={`${p.area.district} / ${p.area.province}`} aria-label="อำเภอและจังหวัด" />
        </div>
      </PmSection>

      {role === 'community' ? (
        <>
          <PmSection title="ส่วนที่ต้องบันทึก">
            <div className="flex flex-col gap-[16px]">
              {docRow('letter', 'จดหมายรายงานสรุปผลการดำเนินงานปิดโครงการ')}
              {docRow('report', 'รายงานสรุปผลการดำเนินงานปิดโครงการ')}
            </div>
          </PmSection>
          <PmSection title="ลงลายมือชื่อ">
            <div className="flex flex-col items-center gap-[10px]">
              {c.signature && <img src={c.signature} alt="ลายมือชื่อ" className="h-[80px] rounded-[8px] border border-gray-line px-[12px]" />}
              {!communityLocked && (
                <button type="button" className={primaryBtn} onClick={() => setSign(true)}>
                  <img src={iconPen} alt="" width={14} height={14} className="brightness-0 invert" />
                  {c.signature ? 'ลงลายมือชื่อใหม่' : 'ลงลายมือชื่อ'}
                </button>
              )}
              {e.signature && <span role="alert" className="text-[12px] text-red-00">{e.signature}</span>}
            </div>
          </PmSection>
          <div className="flex justify-end gap-[8px]">
            <button type="button" className={softBtn} onClick={() => setView('letter')} disabled={!c.letter}>
              <img src={iconEye} alt="" width={16} height={16} />
              ตัวอย่าง
            </button>
            {!communityLocked && p.status === 'open' && (
              <button type="button" className={primaryBtn} onClick={submit}>
                <img src={iconSend} alt="" width={16} height={16} className="brightness-0 invert" />
                ส่งเอกสาร
              </button>
            )}
          </div>
        </>
      ) : (
        <>
          <PmSection title="เอกสารจากชุมชน">
            <div className="flex flex-col gap-[16px]">
              {docRow('letter', 'จดหมายรายงานสรุปผลการดำเนินงานปิดโครงการ')}
              {docRow('report', 'รายงานสรุปผลการดำเนินงานปิดโครงการ')}
              <p className="text-[12px] font-light text-gray-20">เบิกจ่ายแล้ว {fmtBaht(paid)} จาก {fmtBaht(p.budget)} บาท · รายงานความก้าวหน้า {p.reports.length} งวด</p>
            </div>
          </PmSection>
          <PmSection title="ส่วนที่ต้องบันทึก">
            <div className="flex flex-col gap-[16px]">
              <div className="flex flex-col gap-[8px]">
                <span className={lbl}>รายละเอียดการประเมิน</span>
                <textarea aria-label="รายละเอียดการประเมิน" disabled={p.status === 'closed'} className={`${field} h-[96px] py-[10px]`} placeholder="ข้อความ..." value={c.evalDetail} onChange={(ev) => patch({ evalDetail: ev.target.value })} />
              </div>
              <textarea aria-label="เกณฑ์การให้คะแนน" readOnly className={`${roField} h-[88px] py-[10px]`} value={c.criteria} />
              <div className="flex flex-col gap-[10px]">
                <div className="grid grid-cols-[minmax(0,1fr)_minmax(0,1fr)_120px] gap-[12px] text-[14px] font-medium max-md:hidden">
                  <span>เรื่องประเมิน</span>
                  <span>ผลการประเมิน</span>
                  <span />
                </div>
                {c.evals.map((r, i) => (
                  <div key={r.id} className="grid grid-cols-[minmax(0,1fr)_minmax(0,1fr)_120px] items-center gap-[12px] max-md:grid-cols-1">
                    <input aria-label={`เรื่องประเมิน ${i + 1}`} disabled={p.status === 'closed'} className={field} value={r.topic} onChange={(ev) => setEval(r.id, { topic: ev.target.value })} />
                    <input aria-label={`ผลการประเมิน ${i + 1}`} disabled={p.status === 'closed'} className={field} value={r.result} onChange={(ev) => setEval(r.id, { result: ev.target.value })} placeholder="เช่น ผ่าน / ไม่ผ่าน / คะแนน" />
                    {p.status !== 'closed' && (
                      <button type="button" aria-label={`ลบหัวข้อ ${i + 1}`} onClick={() => patch({ evals: c.evals.filter((x) => x.id !== r.id) })} className="flex items-center gap-[4px] text-[12px] font-medium text-blue-00 hover:underline">
                        <img src={iconTrash} alt="" width={14} height={14} />
                        ลบข้อมูล
                      </button>
                    )}
                  </div>
                ))}
                {p.status !== 'closed' && (
                  <button type="button" onClick={() => patch({ evals: [...c.evals, { id: uid('ev'), topic: '', result: '' }] })} className="flex h-[46px] w-full items-center justify-center gap-[6px] rounded-[8px] border border-gray-line text-[14px] font-medium text-blue-00 hover:bg-blue-bg">
                    <img src={iconPlus} alt="" width={14} height={14} className="[filter:invert(36%)_sepia(98%)_saturate(2879%)_hue-rotate(200deg)]" />
                    เพิ่มหัวข้อ
                  </button>
                )}
              </div>
            </div>
          </PmSection>
          <div className="flex justify-end gap-[8px]">
            {p.status === 'closing' && (
              <button type="button" className={primaryBtn} onClick={closeProject}>
                <img src={iconSend} alt="" width={16} height={16} className="brightness-0 invert" />
                บันทึกและส่งข้อมูล
              </button>
            )}
            {p.status === 'open' && <span className="text-[12px] font-light text-gray-20">ชุมชนยังไม่ส่งเอกสารขอปิดโครงการ</span>}
          </div>
        </>
      )}

      <Modal open={!!doc} title={doc === 'letter' ? 'สร้างจดหมายรายงานสรุปผล' : 'สร้างรายงานสรุปผล'} onClose={() => setDoc(null)} width="max-w-[640px]">
        <textarea aria-label="เนื้อหาเอกสาร" className={`${field} h-[340px] py-[10px] leading-[1.7]`} value={draft} onChange={(ev) => setDraft(ev.target.value)} />
        <div className="flex justify-end gap-[8px]">
          <button type="button" className={softBtn} onClick={() => setDoc(null)}>
            ยกเลิก
          </button>
          <button type="button" className={primaryBtn} disabled={!draft.trim()} onClick={() => (patch({ [doc!]: draft }), setDoc(null), showToast('บันทึกเอกสารแล้ว'))}>
            บันทึกเอกสาร
          </button>
        </div>
      </Modal>
      <Modal open={!!view} title={view === 'report' ? 'รายงานสรุปผลการดำเนินงาน' : 'จดหมายรายงานสรุปผล'} onClose={() => setView(null)} width="max-w-[640px]">
        {view && <p className="max-h-[420px] overflow-y-auto rounded-[10px] border border-gray-line p-[20px] text-[13px] leading-[1.8] font-light whitespace-pre-line">{c[view] || 'ยังไม่ได้สร้างเอกสาร'}</p>}
        <div className="flex justify-end gap-[8px]">
          <button type="button" className={softBtn} onClick={() => setView(null)}>
            ปิด
          </button>
          {view && c[view] && (
            <button type="button" className={primaryBtn} onClick={() => exportDoc(view)}>
              ดาวน์โหลด Word
            </button>
          )}
        </div>
      </Modal>
      <SignatureModal open={sign} name={p.org.coordinator || p.org.org} onClose={() => setSign(false)} onSign={(png) => (patch({ signature: png }), setSign(false))} />
      {toast}
    </div>
  )
}
