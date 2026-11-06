import { useMemo, useRef, useState } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { useToast } from '../components/leader/Parts'
import Select from '../components/ui/Select'
import { Crumbs, Field, Paper, PersonaSwitch, Step, Title, ctl, page } from '../components/saraban/Parts'
import { internalTypes, people, personIds, secrets, stamp, urgencies, type PersonId, type SDoc, type Step as ChainStep } from '../data/saraban'
import { docs, nextDocNo, nextRegNo, submitDoc, useMe } from '../lib/sarabanStore'

const opt = (xs: string[]) => xs.map((x) => ({ value: x, label: x }))
const err = 'border-red-00'
const templates: Record<string, { subject: string; body: string }> = {
  'บันทึกข้อความ (เสนอ ผอ.)': { subject: 'เสนอขออนุมัติขึ้นทะเบียนหนังสือรับ', body: 'ด้วยสำนักสารบรรณได้ตรวจสอบข้อมูลหนังสือรับตามเลขทะเบียนอ้างอิงดังกล่าวแล้ว เห็นควรนำเสนอเพื่ออนุมัติบันทึกในทะเบียนหนังสือรับเป็นทางการต่อไป\n\nจึงเรียนมาเพื่อโปรดพิจารณา' },
  'บันทึกข้อความ (ขออนุมัติ)': { subject: 'ขออนุมัติ…', body: 'ด้วย…\n\nจึงเรียนมาเพื่อโปรดพิจารณาอนุมัติ' },
  'หนังสือภายใน': { subject: 'แจ้ง…', body: 'ตามที่…\n\nจึงเรียนมาเพื่อโปรดทราบ' },
  'หนังสือเวียนภายใน': { subject: 'แจ้งเวียน…', body: 'เรียน ทุกส่วนงาน\n\nขอแจ้งเวียนเพื่อโปรดทราบและถือปฏิบัติ' },
  'หนังสือภายนอก (ส่งออก)': { subject: 'ขอความอนุเคราะห์…', body: 'ด้วยสถาบันพัฒนาองค์กรชุมชน (องค์การมหาชน) …\n\nจึงเรียนมาเพื่อโปรดพิจารณาและขอขอบคุณอย่างยิ่ง' },
}

/** ออกเอกสารหนังสือภายใน / ภายนอก (book 3 fig 2-48) — 2.1.7.3; flow: book 1 §2.2.6.1 / §2.2.6.3 */
export default function SarabanInternalPage() {
  const [sp] = useSearchParams()
  const navigate = useNavigate()
  const me = useMe()
  const external = sp.get('kind') === 'external'
  const editId = Number(sp.get('edit')) || 0
  const editing = editId ? docs.get(editId) : undefined
  const types = external ? ['หนังสือภายนอก (ส่งออก)'] : internalTypes
  const [toast, show] = useToast()
  const refNo = useMemo(() => editing?.refNo ?? nextRegNo(), [editing])
  const [f, setF] = useState(() => ({
    type: editing?.type ?? types[0], loaded: !!editing, subject: editing?.title ?? '', date: editing?.dateDoc ?? stamp().slice(0, 10), ref: '', to: editing?.to ?? (external ? '' : 'ผู้อำนวยการ'),
    body: editing?.body ?? '', passer: (editing?.chain.find((c) => c.role === 'pass')?.who ?? '') as PersonId | '', signer: (editing?.chain.find((c) => c.role === 'sign')?.who ?? 'director') as PersonId,
    secret: editing?.secret ?? secrets[0], urgency: editing?.urgency ?? urgencies[0], email: editing?.to ?? '',
  }))
  const [tried, setTried] = useState(false)
  const bodyRef = useRef<HTMLTextAreaElement>(null)
  const set = (p: Partial<typeof f>) => setF((x) => ({ ...x, ...p }))

  const errors: Record<string, string> = {}
  if (!f.loaded) errors.template = 'กรุณากด “โหลด Template” ก่อน'
  if (!f.subject.trim()) errors.subject = 'กรุณาระบุหัวข้อเอกสาร'
  if (!f.to.trim()) errors.to = external ? 'กรุณาระบุผู้รับภายนอก' : 'กรุณาระบุถึง/เรียน'
  if (external && !/^\S+@\S+\.\S+$/.test(f.email)) errors.email = 'กรุณาระบุอีเมลผู้รับให้ถูกต้อง'
  if (!f.body.trim()) errors.body = 'กรุณากรอกเนื้อหา'
  if (f.passer && f.passer === f.signer) errors.signer = 'ผู้ที่ต้องผ่านเรื่องต้องไม่ใช่คนเดียวกับผู้ลงนาม'
  const e = tried ? errors : {}

  const chain: ChainStep[] = [...(f.passer ? [{ who: f.passer, role: 'pass' as const }] : []), { who: f.signer, role: 'sign' as const }]
  const load = () => {
    const t = templates[f.type]
    set({ loaded: true, subject: f.subject || t.subject, body: f.body || t.body })
    show('โหลด Template แล้ว')
  }
  const fmt = (tag: string) => {
    const el = bodyRef.current
    if (!el) return
    const s = el.selectionStart
    const x = el.selectionEnd
    const sel = f.body.slice(s, x)
    const next = tag === 'list' ? f.body.slice(0, s) + '• ' + sel + f.body.slice(x) : f.body.slice(0, s) + '**' + (sel || 'ข้อความตัวหนา') + '**' + f.body.slice(x)
    set({ body: next })
    el.focus()
  }
  const clear = () => setF((x) => ({ ...x, loaded: false, subject: '', body: '', passer: '', ref: '', to: external ? '' : 'ผู้อำนวยการ' }))

  const draftDoc = (): SDoc => ({
    id: editing?.id ?? docs.next(), no: editing?.no ?? nextDocNo(), kind: 'internal', type: f.type, title: f.subject, subject: f.subject, createdAt: editing?.createdAt ?? stamp(), creator: editing?.creator ?? me,
    status: 'draft', chain, step: 0, refNo, dateDoc: f.date, to: external ? f.email : f.to, body: f.body, secret: f.secret, urgency: f.urgency, week: true,
    history: editing?.history ?? [{ at: stamp(), who: me, action: 'สร้างเอกสาร' }],
  })
  const saveDraft = () => {
    if (!f.subject.trim()) return show('กรุณาระบุหัวข้อก่อนบันทึกร่าง')
    docs.save({ ...draftDoc(), history: [...(editing?.history ?? [{ at: stamp(), who: me, action: 'สร้างเอกสาร' }]), { at: stamp(), who: me, action: 'บันทึกร่าง' }] })
    show('บันทึกร่างแล้ว')
    navigate('/saraban/docs')
  }
  const send = () => {
    setTried(true)
    if (Object.keys(errors).length) return show('กรุณากรอกข้อมูลที่จำเป็นให้ครบ')
    const d = draftDoc()
    docs.save(d)
    submitDoc(docs.get(d.id)!)
    navigate(`/saraban/docs/${d.id}`, { state: { created: true } })
  }
  const preview: SDoc = { ...draftDoc(), subject: f.subject || 'ชื่อเรื่อง', refNo: f.ref || refNo }

  return (
    <div className={`${page} items-center`}>
      <div className="flex w-full max-w-[980px] flex-col gap-[12px]">
        <Title back="/saraban" right={<PersonaSwitch />}>{(external ? 'ออกเอกสารหนังสือภายนอก' : 'ออกเอกสารหนังสือภายใน') + (editing ? ' (แก้ไข)' : '')}</Title>
        <Crumbs items={[{ label: 'หน้าแรก', to: '/saraban' }, { label: external ? 'ออกเอกสารหนังสือภายนอก' : 'ออกเอกสารหนังสือภายใน' }]} />
        {editing?.status === 'returned' && editing.returnReason && (
          <p role="status" className="rounded-[10px] border border-[#f2b3b3] bg-[#fff1f1] px-[14px] py-[10px] text-[13px] text-[#c0262d]"><b className="font-semibold">ถูกตีกลับ:</b> {editing.returnReason}</p>
        )}

        <Step n={1} title="เลือก Template เอกสาร">
          <div className="grid grid-cols-2 gap-[14px] max-sm:grid-cols-1">
            <Field label="ประเภทเอกสาร"><Select label="ประเภทเอกสาร" value={f.type} options={opt(types)} onChange={(v) => set({ type: v, loaded: false })} /></Field>
            <Field label="เลขทะเบียนรับ (อ้างอิง)"><input aria-label="เลขทะเบียนรับ (อ้างอิง)" className={ctl} value={f.ref || refNo} onChange={(x) => set({ ref: x.target.value })} /></Field>
          </div>
          <div className="flex items-center gap-[10px]">
            <button type="button" onClick={load} className="h-[38px] w-fit rounded-[8px] bg-blue-00 px-[16px] text-[13px] font-medium text-white hover:brightness-110">โหลด Template</button>
            {e.template && <span role="alert" className="text-[11px] text-red-00">{e.template}</span>}
            {f.loaded && !e.template && <span className="text-[11px] text-[#0f8a63]">✓ โหลดแบบฟอร์มแล้ว — ฟอร์มเดียวปรับรูปแบบตามจำนวนผู้ลงนามอัตโนมัติ</span>}
          </div>
        </Step>

        <Step n={2} title="กรอก/แก้ไขข้อมูล">
          <div className="grid grid-cols-[minmax(0,2fr)_minmax(0,1fr)_minmax(0,1fr)] gap-[14px] max-md:grid-cols-1">
            <Field label="เรื่อง (หัวข้อเอกสาร) *" error={e.subject}><input className={`${ctl} ${e.subject ? err : ''}`} value={f.subject} onChange={(x) => set({ subject: x.target.value })} /></Field>
            <Field label="วันที่เอกสาร"><input type="date" aria-label="วันที่เอกสาร" className={ctl} value={f.date} onChange={(x) => set({ date: x.target.value })} /></Field>
            <Field label="ชั้นความลับ / เร่งด่วน">
              <div className="grid grid-cols-2 gap-[6px]">
                <Select label="ชั้นความลับ" value={f.secret} options={opt(secrets)} onChange={(v) => set({ secret: v })} />
                <Select label="ชั้นความเร่งด่วน" value={f.urgency} options={opt(urgencies)} onChange={(v) => set({ urgency: v })} />
              </div>
            </Field>
          </div>
          <div className="grid grid-cols-2 gap-[14px] max-sm:grid-cols-1">
            <Field label={external ? 'ผู้รับภายนอก (หน่วยงาน) *' : 'ถึง/เรียน *'} error={e.to}><input className={`${ctl} ${e.to ? err : ''}`} value={f.to} onChange={(x) => set({ to: x.target.value })} /></Field>
            {external && <Field label="อีเมลผู้รับ *" error={e.email}><input type="email" className={`${ctl} ${e.email ? err : ''}`} value={f.email} onChange={(x) => set({ email: x.target.value })} placeholder="name@agency.go.th" /></Field>}
          </div>
          <div className="flex flex-col gap-[6px]">
            <div role="toolbar" aria-label="จัดรูปแบบข้อความ" className="flex flex-wrap gap-[4px]">
              {[['B', 'ตัวหนา (ครอบด้วย **)'], ['list', 'จัดลำดับรายการ']].map(([k, l]) => (
                <button key={k} type="button" aria-label={l} title={l} onClick={() => fmt(k)} className="h-[28px] rounded-[6px] border border-gray-line bg-white px-[12px] text-[12px] font-semibold hover:border-blue-00 hover:text-blue-00">{k === 'list' ? '• List' : k}</button>
              ))}
            </div>
            <Field label="เนื้อหา *" error={e.body}><textarea ref={bodyRef} className={`${ctl} h-auto min-h-[150px] resize-y py-[10px] leading-[1.8] ${e.body ? err : ''}`} value={f.body} onChange={(x) => set({ body: x.target.value })} /></Field>
          </div>
        </Step>

        <Step n={3} title="เลือกผู้ลงนาม" note="ลำดับตามสายงาน: ผู้ที่ต้องผ่านเรื่อง → ผู้ลงนาม">
          <div className="grid grid-cols-2 gap-[14px] max-sm:grid-cols-1">
            <Field label="ผู้ที่ต้องผ่านเรื่อง (เซ็นผ่าน, ถ้ามี)">
              <Select label="ผู้ที่ต้องผ่านเรื่อง" value={f.passer} options={[{ value: '', label: 'ไม่มี' }, ...personIds.filter((p) => p !== 'clerk').map((p) => ({ value: p, label: `${people[p].short} · ${people[p].pos}` }))]} onChange={(v) => set({ passer: v as PersonId | '' })} />
            </Field>
            <Field label="ผู้ลงนาม *" error={e.signer}>
              <Select label="ผู้ลงนาม" value={f.signer} options={personIds.filter((p) => p !== 'clerk').map((p) => ({ value: p, label: `${people[p].short} · ${people[p].pos}` }))} onChange={(v) => set({ signer: v })} />
            </Field>
          </div>
          <p className="rounded-[8px] bg-gray-bg px-[12px] py-[8px] text-[12px] font-light text-gray-30">เส้นทาง: {chain.map((c) => people[c.who].short).join(' → ')} · เมื่อลงนามครบ ระบบออกเลขทะเบียนอัตโนมัติ{external ? ' แล้วเจ้าหน้าที่ส่งออกด้วยอีเมลกลาง saraban@codi.co.th' : ''}</p>
        </Step>

        <Step n={4} title="พรีวิวเอกสาร"><Paper d={preview} /></Step>

        <div className="flex justify-end gap-[8px]">
          <button type="button" onClick={clear} className="h-[40px] rounded-[8px] border border-gray-line bg-white px-[18px] text-[13px] hover:border-gray-10">ล้างแบบฟอร์ม</button>
          <button type="button" onClick={saveDraft} className="h-[40px] rounded-[8px] border border-blue-00 bg-white px-[18px] text-[13px] font-medium text-blue-00 hover:bg-blue-bg">บันทึกร่าง</button>
          <button type="button" onClick={send} className="h-[40px] rounded-[8px] bg-blue-00 px-[20px] text-[13px] font-medium text-white hover:brightness-110">บันทึกและรอลงนาม</button>
        </div>
      </div>
      {toast}
    </div>
  )
}
