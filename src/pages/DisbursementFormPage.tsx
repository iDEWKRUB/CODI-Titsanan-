import { useRef, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import iconEye from '../assets/survey/icon-eye.svg'
import iconPlus from '../assets/survey/icon-plus.svg'
import iconTrash from '../assets/survey/icon-trash.svg'
import iconSend from '../assets/meeting/c-send.svg'
import iconPen from '../assets/survey/icon-pen.svg'
import { BackTitle, ConfirmDialog, Field, lbl, primaryBtn, softBtn, useToast } from '../components/leader/Parts'
import { field } from '../components/meeting/FormParts'
import SignatureModal from '../components/meeting/SignatureModal'
import { downloadDoc, esc, fmtBaht, PmSection, pmPage, RoleSwitch, roField, toNum } from '../components/pm/Parts'
import { DateInput } from '../components/ui/DateTimeInputs'
import Modal from '../components/ui/Modal'
import Select from '../components/ui/Select'
import { disbSectors, disbStatusLabel, disbTypes, type Disbursement } from '../data/projects'
import { thaiLong } from '../data/leader'
import { deleteDisbursement, getDisbursement, getProject, saveDisbursement, updateProject, useDisbursements, usePmRole, useProjects } from '../lib/projectStore'

const letter = (d: Disbursement, orgName: string, projectName: string) =>
  `ตามที่ คณะอนุกรรมการส่งเสริมสร้างๆ มีมติอนุมัติ งบ ${d.budgetFor} ของ ${orgName} จำนวน ${fmtBaht(d.amount)} บาท โดยแบ่งการจ่ายเป็น ${d.installments} งวด และขอเบิกจ่ายในงวดที่ ${d.period} จำนวนเงิน ${fmtBaht(d.amount)} บาท โดยขอรับเงินทางบัญชีธนาคาร ${d.bank || '………'} เลขบัญชี ${d.accountNo || '………'} สำหรับ${projectName}\n\nจึงเรียนมาเพื่อโปรดพิจารณา`

export default function DisbursementFormPage() {
  const { id } = useParams()
  const navigate = useNavigate()
  const role = usePmRole()
  const projects = useProjects()
  const all = useDisbursements()
  const stored = getDisbursement(Number(id))
  const [d, setD] = useState<Disbursement | undefined>(stored)
  const [tried, setTried] = useState(false)
  const [preview, setPreview] = useState(false)
  const [sign, setSign] = useState(false)
  const [askDelete, setAskDelete] = useState(false)
  const [toast, showToast] = useToast()
  const file = useRef<HTMLInputElement>(null)

  const p = d ? projects.find((x) => x.id === d.projectId) ?? getProject(d.projectId) : undefined
  if (!d || !p)
    return (
      <div className={pmPage}>
        <BackTitle title="เบิกจ่ายงบประมาณโครงการ" to="/disbursement" />
        <p className="rounded-[12px] bg-gray-subtle p-[24px] text-center text-[14px] text-gray-20">ไม่พบใบเบิกนี้</p>
      </div>
    )
  const set = <K extends keyof Disbursement>(k: K, v: Disbursement[K]) => setD({ ...d, [k]: v })
  const rv = (k: keyof Disbursement['review'], v: string) => setD({ ...d, review: { ...d.review, [k]: v } })
  const locked = role === 'community' && d.status !== 'draft'
  const others = all.filter((x) => x.projectId === p.id && x.id !== d.id && x.status === 'reviewed')
  const paidBefore = others.reduce((n, x) => n + toNum(x.amount), 0)
  const remain = toNum(p.budget) - paidBefore - toNum(d.amount)

  const errors: Record<string, string> = {}
  if (!d.contactFirst.trim() || !d.contactLast.trim()) errors.contact = 'กรุณาระบุชื่อและนามสกุลผู้ติดต่อ'
  if (toNum(d.amount) <= 0) errors.amount = 'กรุณาระบุจำนวนเงิน'
  else if (toNum(d.amount) > toNum(p.budget) - paidBefore) errors.amount = 'จำนวนเงินเกินงบประมาณคงเหลือ'
  if (!d.bank.trim() || !d.accountNo.trim()) errors.bank = 'กรุณาระบุธนาคารและเลขบัญชี'
  if (!d.docs.length) errors.docs = 'ต้องแนบเอกสารอย่างน้อย 1 รายการ'
  if (!d.signature) errors.signature = 'ต้องลงลายมือชื่อก่อนส่งเอกสาร'
  const e = tried ? errors : {}

  const saveDraft = () => (saveDisbursement(d), showToast('บันทึกแบบร่างแล้ว'))
  const submit = () => {
    setTried(true)
    if (Object.keys(errors).length) return showToast('กรุณากรอกข้อมูลให้ครบก่อนส่งเอกสาร')
    saveDisbursement({ ...d, status: 'submitted' })
    updateProject(p.id, (x) => ({ ...x, timeline: [...x.timeline, { at: new Date().toISOString().slice(0, 10), text: `ขอเบิกจ่ายงวดที่ ${d.period} จำนวน ${fmtBaht(d.amount)} บาท` }] }))
    navigate('/disbursement')
  }
  const review = () => {
    const r = d.review
    if (!r.type || !r.recordNo.trim() || !r.decision) return showToast('กรุณาระบุประเภทการเบิกจ่าย เลขที่บันทึก และสรุปความคิดเห็นของคณะกรรมการ')
    saveDisbursement({ ...d, status: 'reviewed', review: { ...r, payDate: r.decision === 'next' ? r.payDate || new Date().toISOString().slice(0, 10) : '' } })
    updateProject(p.id, (x) => ({ ...x, timeline: [...x.timeline, { at: new Date().toISOString().slice(0, 10), text: `ตรวจสอบใบเบิกงวดที่ ${d.period}: ${r.decision === 'next' ? 'เห็นควรเบิกจ่าย' : r.decision === 'fix' ? 'ให้ปรับปรุงก่อน' : 'อื่น ๆ'}` }] }))
    navigate('/disbursement')
  }
  const exportLetter = () =>
    downloadDoc(`หนังสือขอเบิกจ่าย-งวด${d.period}`, 'หนังสือขอเบิกจ่าย', `<p>เขียนที่ ${esc(d.writtenAt)}</p><p>เรื่อง ${esc(d.subject)}</p><p>เรียน ${esc(d.to)}</p><p>${esc(letter(d, p.org.org, p.name))}</p><p>เอกสารแนบ</p>${d.docs.map((x, i) => `<p>${i + 1}. ${esc(x)}</p>`).join('')}<p style="text-align:right">ลงชื่อ ${esc(`${d.contactFirst} ${d.contactLast}`)}</p>`)

  const ro = (v: string, label: string) => <input aria-label={label} readOnly className={roField} value={v} />
  const inp = (k: 'writtenAt' | 'houseNo' | 'moo' | 'province' | 'district' | 'subdistrict' | 'zip' | 'contactFirst' | 'contactLast' | 'contactPhone' | 'subject' | 'to' | 'bank' | 'accountNo' | 'installments', label: string, err?: boolean) => (
    <input aria-label={label} placeholder={label} disabled={locked} className={`${locked ? roField : field} ${err ? 'border-red-00' : ''}`} value={d[k] as string} onChange={(ev) => set(k, ev.target.value)} />
  )

  return (
    <div className={pmPage}>
      <BackTitle
        title="เบิกจ่ายงบประมาณโครงการ"
        to="/disbursement"
        actions={
          <>
            <RoleSwitch />
            {role === 'community' && d.status === 'draft' && (
              <button type="button" aria-label="ลบใบเบิก" onClick={() => setAskDelete(true)} className="flex rounded-[8px] border border-gray-line bg-white p-[10px] hover:bg-blue-bg">
                <img src={iconTrash} alt="" width={18} height={18} />
              </button>
            )}
          </>
        }
      />
      <p className="-mt-[4px] text-[12px] font-light text-gray-20">
        DB-{String(d.id).padStart(4, '0')} · {p.name} · สถานะ: {disbStatusLabel[d.status]}
      </p>

      {role === 'community' ? (
        <>
          {locked && <p className="rounded-[10px] bg-blue-bg px-[16px] py-[10px] text-[13px] font-light text-blue-00">ส่งใบเบิกแล้ว แก้ไขไม่ได้ — {d.status === 'reviewed' ? 'เจ้าหน้าที่ตรวจสอบแล้ว' : 'รอเจ้าหน้าที่ตรวจสอบ'}</p>}
          <PmSection title="รายละเอียดการเบิกจ่าย">
            <div className="flex flex-col gap-[16px]">
              <div className="grid grid-cols-[minmax(0,1.4fr)_minmax(0,1fr)_minmax(0,1fr)] gap-[16px] max-sm:grid-cols-1">
                <Field label="เขียนที่">{inp('writtenAt', 'เขียนที่')}</Field>
                <Field label="เลขที่">{ro(d.houseNo, 'เลขที่')}</Field>
                <Field label="หมู่">{ro(d.moo, 'หมู่')}</Field>
              </div>
              <div className="grid grid-cols-4 gap-[12px] max-lg:grid-cols-2 max-sm:grid-cols-1">
                {inp('province', 'จังหวัด')}
                {inp('district', 'อำเภอ')}
                {inp('subdistrict', 'ตำบล')}
                {inp('zip', 'รหัสไปรษณีย์')}
              </div>
              <div className="flex flex-col gap-[6px]">
                <span className={lbl}>ผู้ติดต่อ</span>
                <div className="grid grid-cols-3 gap-[12px] max-sm:grid-cols-1">
                  {inp('contactFirst', 'ชื่อ', !!e.contact)}
                  {inp('contactLast', 'นามสกุล', !!e.contact)}
                  {inp('contactPhone', 'เบอร์โทร')}
                </div>
                {e.contact && <span role="alert" className="text-[12px] text-red-00">{e.contact}</span>}
              </div>
              <hr className="border-gray-line" />
              <Field label="เรื่อง">{inp('subject', 'เรื่อง')}</Field>
              <Field label="เรียน">{inp('to', 'เรียน')}</Field>
            </div>
          </PmSection>

          <PmSection
            title="เอกสารแนบ"
            action={
              !locked && (
                <button type="button" className={primaryBtn} onClick={() => file.current?.click()}>
                  <img src={iconPlus} alt="" width={14} height={14} className="brightness-0 invert" />
                  นำเข้าเอกสารแบบ
                </button>
              )
            }
          >
            <input ref={file} type="file" multiple hidden onChange={(ev) => ev.target.files && (set('docs', [...d.docs, ...Array.from(ev.target.files).map((f) => f.name)]), (ev.target.value = ''))} />
            <ol className="flex flex-col gap-[10px] text-[13px] font-light">
              {d.docs.map((x, i) => (
                <li key={x + i} className="flex items-center gap-[10px]">
                  <span className="min-w-0 flex-1">
                    {i + 1}. {x}
                  </span>
                  {!locked && (
                    <button type="button" aria-label={`ลบเอกสาร ${x}`} onClick={() => set('docs', d.docs.filter((_, k) => k !== i))} className="flex size-[28px] items-center justify-center rounded-[6px] hover:bg-red-20">
                      <img src={iconTrash} alt="" width={16} height={16} />
                    </button>
                  )}
                </li>
              ))}
              {d.docs.length === 0 && <li className="text-gray-20">ยังไม่มีเอกสารแนบ</li>}
            </ol>
            {e.docs && <p role="alert" className="pt-[8px] text-[12px] text-red-00">{e.docs}</p>}
          </PmSection>

          <section className="flex flex-col gap-[14px] rounded-[12px] border border-gray-line bg-white p-[20px] max-sm:p-[12px]">
            <h2 className="text-[14px] font-semibold text-black">ข้อความ</h2>
            <p className="whitespace-pre-line text-[13px] leading-[1.9] font-light text-black">{letter(d, p.org.org, p.name)}</p>
            <div className="grid grid-cols-2 gap-[12px] max-sm:grid-cols-1">
              <Field label="งบ">{ro(d.budgetFor, 'งบ')}</Field>
              <Field label="ของ">{ro(p.org.org, 'ขององค์กร')}</Field>
              <Field label="จำนวนเงินที่ขอเบิก (บาท)" error={e.amount}>
                <input aria-label="จำนวนเงินที่ขอเบิก" inputMode="decimal" disabled={locked} className={`${locked ? roField : field} ${e.amount ? 'border-red-00' : ''}`} value={d.amount} onChange={(ev) => set('amount', ev.target.value.replace(/[^\d.]/g, ''))} />
              </Field>
              <div className="grid grid-cols-2 gap-[12px]">
                <Field label="แบ่งเป็น (งวด)">{inp('installments', 'จำนวนงวด')}</Field>
                <div className="flex flex-col gap-[6px]">
                  <span className={lbl}>งวดที่</span>
                  <div className={locked ? 'pointer-events-none opacity-60' : ''}>
                    <Select label="งวดที่" value={d.period} options={['1', '2', '3', '4'].map((x) => ({ value: x, label: x }))} onChange={(v) => set('period', v)} />
                  </div>
                </div>
              </div>
              <Field label="ธนาคาร" error={e.bank}>{inp('bank', 'ธนาคาร/สาขา', !!e.bank)}</Field>
              <Field label="เลขบัญชี">{inp('accountNo', 'เลขบัญชี', !!e.bank)}</Field>
            </div>
          </section>

          <PmSection title="ลงลายมือชื่อ">
            <div className="flex flex-col items-center gap-[10px]">
              {d.signature ? <img src={d.signature} alt="ลายมือชื่อ" className="h-[80px] rounded-[8px] border border-gray-line bg-white px-[12px]" /> : null}
              {!locked && (
                <button type="button" className={primaryBtn} onClick={() => setSign(true)}>
                  <img src={iconPen} alt="" width={14} height={14} className="brightness-0 invert" />
                  {d.signature ? 'ลงลายมือชื่อใหม่' : 'ลงลายมือชื่อ'}
                </button>
              )}
              {e.signature && <span role="alert" className="text-[12px] text-red-00">{e.signature}</span>}
            </div>
          </PmSection>

          <div className="flex justify-end gap-[8px]">
            <button type="button" className={softBtn} onClick={() => setPreview(true)}>
              <img src={iconEye} alt="" width={16} height={16} />
              ตัวอย่าง
            </button>
            {!locked && (
              <>
                <button type="button" className={softBtn} onClick={saveDraft}>
                  บันทึกแบบร่าง
                </button>
                <button type="button" className={primaryBtn} onClick={submit}>
                  <img src={iconSend} alt="" width={16} height={16} className="brightness-0 invert" />
                  ส่งเอกสาร
                </button>
              </>
            )}
          </div>
        </>
      ) : (
        <>
          <section className="rounded-[12px] bg-blue-bg p-[8px]">
            <div className="grid grid-cols-[minmax(0,1fr)_auto] items-end gap-[16px] rounded-[12px] bg-white p-[20px] max-sm:grid-cols-1 max-sm:p-[12px]">
              <div className="flex flex-col gap-[8px]">
                <span className={`${lbl} text-[16px]`}>ประเภทการเบิกจ่าย</span>
                <Select label="ประเภทการเบิกจ่าย" tone="subtle" value={d.review.type} placeholder="เลือกประเภทการเบิกจ่าย" options={disbTypes.map((t) => ({ value: t, label: t }))} onChange={(v) => rv('type', v)} />
              </div>
              <button type="button" className={`${primaryBtn} h-[46px] min-w-[160px]`} onClick={() => (saveDisbursement(d), showToast('บันทึกแล้ว'))}>
                บันทึก
              </button>
            </div>
          </section>

          <PmSection title="ข้อมูลใบเบิก">
            <div className="grid grid-cols-3 gap-[16px] max-md:grid-cols-1">
              <Field label="เลขที่ใบเบิก">{ro(`DB-${String(d.id).padStart(4, '0')}`, 'เลขที่ใบเบิก')}</Field>
              <Field label="สถานะ">{ro(disbStatusLabel[d.status], 'สถานะ')}</Field>
              <Field label="ที่มาใบเบิก">{ro('ผู้ขอเบิก (ชุมชน)', 'ที่มาใบเบิก')}</Field>
              <Field label="ผู้สร้าง">{ro(d.createdBy, 'ผู้สร้าง')}</Field>
              <Field label="วันที่สร้าง">{ro(thaiLong(d.createdAt), 'วันที่สร้าง')}</Field>
            </div>
            <div className="mt-[16px] rounded-[10px] bg-gray-subtle p-[12px] text-[12px] leading-[1.7] font-light">
              <b className="font-medium">เอกสารจากผู้ขอ:</b> {d.docs.length} รายการ · ลายมือชื่อ {d.signature ? 'ครบ' : 'ยังไม่มี'} · ธนาคาร {d.bank || '–'} {d.accountNo}
            </div>
          </PmSection>

          <section className="flex flex-col gap-[16px] rounded-[12px] border border-gray-line bg-white p-[20px] max-sm:p-[12px]">
            <div className="grid grid-cols-3 gap-[16px] max-md:grid-cols-1">
              <Field label="ครั้งที่เบิก">{ro(String(others.length + 1), 'ครั้งที่เบิก')}</Field>
              <Field label="งวดที่เบิก">{ro(d.period, 'งวดที่เบิก')}</Field>
              <Field label="เลขที่บันทึก">
                <input aria-label="เลขที่บันทึก" className={field} value={d.review.recordNo} onChange={(ev) => rv('recordNo', ev.target.value)} />
              </Field>
              <div className="flex flex-col gap-[6px]">
                <span className={lbl}>วันที่บันทึก</span>
                <DateInput label="วันที่บันทึก" value={d.review.recordDate} onChange={(v) => rv('recordDate', v)} />
              </div>
              <div className="col-span-2 flex flex-col gap-[6px] max-md:col-span-1">
                <span className={lbl}>ส่วนงาน</span>
                <Select label="ส่วนงาน" value={d.review.sector} placeholder="ส่วนงาน" options={disbSectors.map((x) => ({ value: x, label: x }))} onChange={(v) => rv('sector', v)} />
              </div>
            </div>
            <div className="grid grid-cols-[minmax(0,1fr)_minmax(0,2fr)] gap-[16px] max-md:grid-cols-1">
              <Field label="รหัสโครงการ">{ro(p.code, 'รหัสโครงการ')}</Field>
              <Field label="ชื่อโครงการ">{ro(p.name, 'ชื่อโครงการ')}</Field>
            </div>
            <Field label="รายละเอียดเบิกจ่าย">
              <input aria-label="รายละเอียดเบิกจ่าย" className={field} value={d.review.detail} placeholder={d.subject} onChange={(ev) => rv('detail', ev.target.value)} />
            </Field>
            <div className="grid grid-cols-3 gap-[16px] max-md:grid-cols-1">
              <Field label="จำนวนเงินเบิกรวมงวดนี้">{ro(fmtBaht(d.amount), 'จำนวนเงินเบิก')}</Field>
              <Field label="งบประมาณที่อนุมัติ">{ro(fmtBaht(p.budget), 'งบอนุมัติ')}</Field>
              <Field label="งบประมาณคงเหลือ">{ro(fmtBaht(remain), 'งบคงเหลือ')}</Field>
            </div>
            <Field label="ความคิดเห็น">
              <textarea aria-label="ความคิดเห็น" className={`${field} h-[96px] py-[10px]`} placeholder="ข้อความ..." value={d.review.opinion} onChange={(ev) => rv('opinion', ev.target.value)} />
            </Field>
            <div className="grid grid-cols-2 gap-[16px] max-md:grid-cols-1">
              <div className="flex flex-col gap-[6px]">
                <span className={lbl}>วันที่สรุปความคิดเห็น</span>
                <DateInput label="วันที่สรุปความคิดเห็น" value={d.review.summaryDate} onChange={(v) => rv('summaryDate', v)} />
              </div>
              <Field label="วันที่จ่ายเงิน">{ro(d.review.payDate ? thaiLong(d.review.payDate) : '', 'วันที่จ่ายเงิน')}</Field>
            </div>
          </section>

          <PmSection title="สรุปความคิดเห็นคณะกรรมการตรวจรับ">
            <fieldset className="flex flex-col gap-[14px]">
              <legend className="sr-only">ความเห็นคณะกรรมการ</legend>
              {(
                [
                  ['next', 'เห็นควรเบิกจ่ายงวดต่อไป'],
                  ['fix', 'เห็นควรเรียกปรับปรุงงานเดิม ให้เรียบร้อยก่อนเบิกจ่ายงวดต่อไป โดยมีเงื่อนไข'],
                  ['other', 'อื่น ๆ'],
                ] as const
              ).map(([v, t]) => (
                <label key={v} className="flex cursor-pointer items-center gap-[10px] text-[13px] font-light">
                  <input type="radio" name="decision" checked={d.review.decision === v} onChange={() => setD({ ...d, review: { ...d.review, decision: v } })} className="size-[16px] accent-blue-00" />
                  {t}
                </label>
              ))}
              <textarea aria-label="รายละเอียดความเห็น" className={`${field} h-[96px] py-[10px]`} placeholder="ข้อความ..." value={d.review.decisionText} onChange={(ev) => rv('decisionText', ev.target.value)} />
            </fieldset>
          </PmSection>

          <div className="flex justify-end gap-[8px]">
            <button type="button" className={softBtn} onClick={() => setPreview(true)}>
              <img src={iconEye} alt="" width={16} height={16} />
              แสดงตัวอย่าง
            </button>
            {d.status !== 'reviewed' && (
              <button type="button" className={primaryBtn} onClick={review} disabled={d.status === 'draft'}>
                <img src={iconSend} alt="" width={16} height={16} className="brightness-0 invert" />
                ส่งเอกสาร
              </button>
            )}
          </div>
          {d.status === 'draft' && <p className="text-right text-[12px] font-light text-gray-20">ผู้ขอเบิกยังไม่ส่งใบเบิก จึงยังตรวจสอบไม่ได้</p>}
        </>
      )}

      <Modal open={preview} title="ตัวอย่างหนังสือขอเบิกจ่าย" onClose={() => setPreview(false)} width="max-w-[640px]">
        <div className="flex flex-col gap-[8px] rounded-[10px] border border-gray-line p-[20px] text-[13px] leading-[1.8] font-light">
          <p className="text-right">เขียนที่ {d.writtenAt || '–'}</p>
          <p>
            <b className="font-medium">เรื่อง</b> {d.subject}
          </p>
          <p>
            <b className="font-medium">เรียน</b> {d.to}
          </p>
          <p className="whitespace-pre-line indent-8">{letter(d, p.org.org, p.name)}</p>
          <p className="font-medium">เอกสารแนบ</p>
          {d.docs.map((x, i) => (
            <p key={x + i}>
              {i + 1}. {x}
            </p>
          ))}
          <div className="self-end text-center">
            {d.signature && <img src={d.signature} alt="" className="mx-auto h-[56px]" />}
            <p>({d.contactFirst} {d.contactLast})</p>
          </div>
        </div>
        <div className="flex justify-end gap-[8px]">
          <button type="button" className={softBtn} onClick={() => setPreview(false)}>
            ปิด
          </button>
          <button type="button" className={primaryBtn} onClick={exportLetter}>
            ดาวน์โหลด Word
          </button>
        </div>
      </Modal>
      <SignatureModal open={sign} name={`${d.contactFirst} ${d.contactLast}`.trim() || p.org.coordinator} onClose={() => setSign(false)} onSign={(png) => (set('signature', png), setSign(false))} />
      <ConfirmDialog open={askDelete} danger title="ลบใบเบิก?" confirm="ลบ" text="ใบเบิกแบบร่างนี้จะถูกลบ" onClose={() => setAskDelete(false)} onConfirm={() => (deleteDisbursement(d.id), navigate('/disbursement'))} />
      {toast}
    </div>
  )
}
