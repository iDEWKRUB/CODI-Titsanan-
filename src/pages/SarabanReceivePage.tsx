import { useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useToast } from '../components/leader/Parts'
import { Crumbs, Field, PersonaSwitch, Step, Title, ctl, page } from '../components/saraban/Parts'
import { channels, forwardActions, people, personIds, receivedTypes, secrets, stamp, urgencies, type SDoc, type Step as ChainStep } from '../data/saraban'
import { addCircular, docs, nextDocNo, nextRegNo, useMe } from '../lib/sarabanStore'
import Select from '../components/ui/Select'

const opt = (xs: string[]) => xs.map((x) => ({ value: x, label: x }))
const err = 'border-red-00'

/** ลงทะเบียนหนังสือรับใหม่และส่งต่อ (book 3 fig 2-47) — 2.1.7.2; flow: book 1 §2.2.6.2 */
export default function SarabanReceivePage() {
  const navigate = useNavigate()
  const me = useMe()
  const [toast, show] = useToast()
  const regNo = useMemo(nextRegNo, [])
  const now = stamp()
  const [f, setF] = useState({
    type: receivedTypes[0], file: '', title: '', date: now.slice(0, 10), time: now.slice(11), subject: '', sender: '', receiver: 'สำนักสารบรรณ',
    secret: secrets[0], urgency: urgencies[0], channel: channels[0], to: '', extNo: '', detail: '', note: '',
    mode: 'forward' as 'forward' | 'none' | 'circulate', assignee: 'clerk' as keyof typeof people, action: forwardActions[0],
  })
  const [tried, setTried] = useState(false)
  const [ocr, setOcr] = useState(false)
  const set = (p: Partial<typeof f>) => setF((x) => ({ ...x, ...p }))
  const off = f.time < '08:30' || f.time > '16:30'
  const errors: Record<string, string> = {}
  if (!f.title.trim()) errors.title = 'กรุณาระบุชื่อเรื่อง'
  if (!f.subject.trim()) errors.subject = 'กรุณาระบุเรื่อง'
  if (!f.sender.trim()) errors.sender = 'กรุณาระบุผู้ส่ง'
  if (!f.date) errors.date = 'กรุณาระบุวันที่รับ'
  const e = tried ? errors : {}

  const runOcr = () => {
    setOcr(true)
    set({ title: 'ขอความอนุเคราะห์ข้อมูลสถานะโครงการบ้านมั่นคง', subject: 'ขอความอนุเคราะห์ข้อมูลสถานะโครงการบ้านมั่นคง ประจำปี 2568', sender: 'เทศบาลตำบลแม่แฝก', extNo: 'ที่ ชม 52301/889', detail: 'ขอข้อมูลสถานะการดำเนินงานและงบประมาณคงเหลือ' })
    show('ถอดข้อความจากเอกสารแล้ว ตรวจสอบและแก้ไขได้')
  }

  const submit = () => {
    setTried(true)
    if (Object.keys(errors).length) return show('กรุณากรอกข้อมูลที่จำเป็นให้ครบ')
    // chain: "เสนอ ผอ." always ends at the director; other actions go to the chosen person only
    const chain: ChainStep[] =
      f.mode !== 'forward' ? [] : f.action === 'เสนอ ผอ.' ? [{ who: 'director', role: 'sign' }] : [{ who: f.assignee, role: f.assignee === 'director' ? 'sign' : 'pass' }]
    const at = `${f.date} ${f.time}`
    const id = docs.next()
    const status = f.mode === 'forward' ? 'review' : f.mode === 'circulate' ? 'circulated' : 'registered'
    const doc: SDoc = {
      id, no: nextDocNo(), kind: 'received', type: f.type, title: f.title, subject: f.subject, createdAt: stamp(), creator: me, status, chain, step: 0, refNo: regNo,
      dateDoc: f.date, body: f.detail || f.subject, to: people[f.assignee].pos, secret: f.secret, urgency: f.urgency, channel: f.channel, sender: f.sender, receiver: f.receiver,
      extNo: f.extNo, detail: f.detail, note: f.note, file: f.file, stampAt: at, forward: f.mode, action: f.mode === 'forward' ? f.action : undefined, week: true,
      history: [
        { at: stamp(), who: me, action: 'ลงทะเบียนหนังสือรับ', note: `${regNo} · ตรารับ ${at}${off ? ' (แก้ไขเวลารับนอกเวลาทำการ)' : ''}` },
        { at: stamp(), who: 'system', action: 'ออกเลขทะเบียนรับและประทับตรา', note: regNo },
        ...(f.mode === 'forward' ? [{ at: stamp(), who: me, action: 'ส่งต่อ', note: `${f.action} → ${chain.map((c) => people[c.who].short).join(' → ')}` }, { at: stamp(), who: 'system' as const, action: 'แจ้งเตือนเอกสารเข้าใหม่', note: `ถึง ${people[chain[0].who].short}` }] : []),
        ...(f.mode === 'none' ? [{ at: stamp(), who: me, action: 'ไม่ส่งต่อ', note: 'เก็บไว้ที่สารบรรณ' }] : []),
        ...(f.mode === 'circulate' ? [{ at: stamp(), who: me, action: 'เวียนแจ้ง', note: 'ทุกส่วนงาน' }] : []),
      ],
    }
    docs.save(doc)
    if (f.mode === 'circulate') addCircular(f.title)
    navigate(`/saraban/docs/${id}`, { state: { created: true } })
  }

  const modes = [
    { k: 'forward', l: 'ส่งต่อ', d: 'ส่งเรื่องให้ผู้รับผิดชอบพิจารณา' },
    { k: 'none', l: 'ไม่ส่งต่อ', d: 'เก็บไว้ที่สารบรรณ' },
    { k: 'circulate', l: 'เวียนแจ้ง', d: 'แจ้งเวียนทุกส่วนงาน' },
  ] as const

  return (
    <div className={`${page} items-center`}>
      <div className="flex w-full max-w-[980px] flex-col gap-[12px]">
        <Title back="/saraban" right={<PersonaSwitch />}>ลงทะเบียนหนังสือรับใหม่และส่งต่อ</Title>
        <Crumbs items={[{ label: 'หน้าแรก', to: '/saraban' }, { label: 'ลงทะเบียนหนังสือ' }]} />

        <Step n={1} title="รับเอกสาร">
          <div className="grid grid-cols-[minmax(0,1fr)_minmax(0,2fr)] gap-[14px] max-md:grid-cols-1">
            <Field label="ประเภทไฟล์/หมวด"><Select label="ประเภทหนังสือ" value={f.type} options={opt(receivedTypes)} onChange={(v) => set({ type: v })} /></Field>
            <Field label="นำเข้าไฟล์เอกสาร">
              <div className="flex items-center gap-[8px]">
                <input type="file" aria-label="นำเข้าไฟล์เอกสาร" accept=".pdf,.png,.jpg,.jpeg,.docx" onChange={(x) => set({ file: x.target.files?.[0]?.name ?? '' })} className={`${ctl} flex-1 py-[7px] file:mr-[10px] file:rounded-[6px] file:border-0 file:bg-blue-bg file:px-[10px] file:py-[2px] file:text-[12px] file:text-blue-00`} />
                <button type="button" disabled={!f.file} onClick={runOcr} title={f.file ? 'ถอดข้อความจากเอกสาร (OCR)' : 'เลือกไฟล์ก่อน'} className="h-[40px] shrink-0 rounded-[8px] bg-blue-bg px-[12px] text-[12px] font-medium whitespace-nowrap text-blue-00 hover:bg-blue-20 disabled:opacity-40">ถอดข้อความ (OCR)</button>
              </div>
              {ocr && <span className="text-[11px] text-[#0f8a63]">ถอดข้อความแล้ว: เติมชื่อเรื่อง เรื่อง ผู้ส่ง และเลขที่หนังสือให้ ตรวจสอบก่อนบันทึก</span>}
            </Field>
          </div>
          <div className="grid grid-cols-[minmax(0,2fr)_minmax(0,1fr)_minmax(0,1fr)] gap-[14px] max-md:grid-cols-1">
            <Field label="ชื่อเรื่อง *" error={e.title}><input className={`${ctl} ${e.title ? err : ''}`} value={f.title} onChange={(x) => set({ title: x.target.value })} /></Field>
            <Field label="วันที่รับ *" error={e.date}>
              <input type="date" aria-label="วันที่รับ" className={`${ctl} ${e.date ? err : ''}`} value={f.date} onChange={(x) => set({ date: x.target.value })} />
            </Field>
            <Field label="เลขทะเบียนรับ (ระบบออกให้)"><input readOnly aria-label="เลขทะเบียนรับ" className={ctl} value={regNo} /></Field>
          </div>
          <div className="grid grid-cols-[minmax(0,2fr)_minmax(0,1fr)_minmax(0,1fr)] gap-[14px] max-md:grid-cols-1">
            <Field label="เรื่อง *" error={e.subject}><input className={`${ctl} ${e.subject ? err : ''}`} value={f.subject} onChange={(x) => set({ subject: x.target.value })} /></Field>
            <Field label="ผู้ส่ง *" error={e.sender}><input className={`${ctl} ${e.sender ? err : ''}`} value={f.sender} onChange={(x) => set({ sender: x.target.value })} /></Field>
            <Field label="ผู้รับ"><input className={ctl} value={f.receiver} onChange={(x) => set({ receiver: x.target.value })} /></Field>
          </div>
          <div className="grid grid-cols-4 gap-[14px] max-lg:grid-cols-2 max-sm:grid-cols-1">
            <Field label="ชั้นความลับ"><Select label="ชั้นความลับ" value={f.secret} options={opt(secrets)} onChange={(v) => set({ secret: v })} /></Field>
            <Field label="ชั้นความเร่งด่วน"><Select label="ชั้นความเร่งด่วน" value={f.urgency} options={opt(urgencies)} onChange={(v) => set({ urgency: v })} /></Field>
            <Field label="ช่องทางรับ"><Select label="ช่องทางรับ" value={f.channel} options={opt(channels)} onChange={(v) => set({ channel: v })} /></Field>
            <Field label="ผู้รับหนังสือ"><input className={ctl} value={f.to} onChange={(x) => set({ to: x.target.value })} placeholder={people[me].short} /></Field>
          </div>
          <div className="grid grid-cols-[minmax(0,1fr)_minmax(0,2fr)] gap-[14px] max-md:grid-cols-1">
            <Field label="เลขที่หนังสือ (ภายนอก)"><input className={ctl} value={f.extNo} onChange={(x) => set({ extNo: x.target.value })} /></Field>
            <Field label="รายละเอียด"><input className={ctl} value={f.detail} onChange={(x) => set({ detail: x.target.value })} /></Field>
          </div>
          <Field label="หมายเหตุ"><textarea className={`${ctl} h-auto min-h-[88px] resize-y py-[10px] leading-[1.6]`} value={f.note} onChange={(x) => set({ note: x.target.value })} /></Field>

          <div className="flex flex-wrap items-center gap-[14px] rounded-[10px] border border-dashed border-blue-00/50 bg-blue-bg/60 p-[12px]" aria-label="ตรารับหนังสือ">
            <div className="rounded-[6px] border-2 border-[#c0262d] px-[12px] py-[6px] text-center text-[#c0262d]" aria-hidden="true">
              <p className="text-[10px] font-semibold">ตรารับหนังสือ · พอช.</p>
              <p className="font-urbanist text-[12px] font-semibold">{regNo}</p>
              <p className="font-urbanist text-[10px]">{f.date} {f.time}</p>
            </div>
            <div className="flex min-w-[220px] flex-1 flex-col gap-[4px]">
              <p className="text-[12px] font-medium">ประทับตราและแก้ไขวัน-เวลารับได้</p>
              <label className="flex items-center gap-[8px] text-[12px] font-light">เวลารับ <input type="time" aria-label="เวลารับ" value={f.time} onChange={(x) => set({ time: x.target.value })} className={`${ctl} h-[34px] w-[120px]`} /></label>
              {off && <p role="status" className="text-[11px] text-[#8a6100]">รับนอกเวลาทำการ (08:30–16:30): ระบบจะบันทึกว่ามีการแก้ไขเวลารับ ตามระเบียบงานสารบรรณ</p>}
            </div>
          </div>
        </Step>

        <Step n={2} title="ดำเนินการต่อ">
          <div role="radiogroup" aria-label="ตัวเลือกการส่งต่อ" className="grid grid-cols-3 gap-[8px] max-sm:grid-cols-1">
            {modes.map((m) => (
              <button key={m.k} type="button" role="radio" aria-checked={f.mode === m.k} onClick={() => set({ mode: m.k })} className={`flex items-start gap-[10px] rounded-[10px] border px-[14px] py-[10px] text-left transition-colors ${f.mode === m.k ? 'border-blue-00 bg-blue-bg' : 'border-gray-line hover:border-gray-10'}`}>
                <span className={`mt-[3px] flex size-[14px] shrink-0 items-center justify-center rounded-full border ${f.mode === m.k ? 'border-blue-00' : 'border-gray-10'}`}>{f.mode === m.k && <span className="size-[8px] rounded-full bg-blue-00" />}</span>
                <span className="flex flex-col"><b className="text-[13px] font-semibold">{m.l}</b><span className="text-[11px] font-light text-gray-20">{m.d}</span></span>
              </button>
            ))}
          </div>
          {f.mode === 'forward' && (
            <div className="grid grid-cols-2 gap-[14px] max-sm:grid-cols-1">
              <Field label="มอบหมายให้"><Select label="มอบหมายให้" value={f.assignee} options={personIds.map((p) => ({ value: p, label: people[p].short }))} onChange={(v) => set({ assignee: v })} /></Field>
              <Field label="การดำเนินการ"><Select label="การดำเนินการ" value={f.action} options={opt(forwardActions)} onChange={(v) => set({ action: v })} /></Field>
              <p className="col-span-full rounded-[8px] bg-gray-bg px-[12px] py-[8px] text-[12px] font-light text-gray-30">
                เส้นทางเอกสาร: {f.action === 'เสนอ ผอ.' ? <b className="font-medium">{people.director.short} (ผู้ลงนาม/สั่งการ)</b> : <b className="font-medium">{people[f.assignee].short}</b>} · ระบบแจ้งเตือนเอกสารเข้าใหม่ทันที และผู้ลงนามสุดท้ายเพิ่มข้อสั่งการเป็นแผ่นสุดท้ายได้
              </p>
            </div>
          )}
          {f.mode === 'none' && <p className="text-[12px] font-light text-gray-30">ลงทะเบียนรับและเก็บไว้ที่สารบรรณ — ติดตามได้ที่แท็บ “รอดำเนินการ”</p>}
          {f.mode === 'circulate' && <p className="text-[12px] font-light text-gray-30">เผยแพร่ในกล่อง “หนังสือเวียน / แจ้งเวียน” ของทุกส่วนงานทันที</p>}
        </Step>

        <div className="flex justify-end gap-[8px]">
          <button type="button" onClick={() => navigate('/saraban')} className="h-[40px] rounded-[8px] border border-gray-line bg-white px-[20px] text-[13px] hover:border-gray-10">ยกเลิก</button>
          <button type="button" onClick={submit} className="flex h-[40px] items-center gap-[6px] rounded-[8px] bg-blue-00 px-[22px] text-[13px] font-medium text-white hover:brightness-110">ยืนยัน</button>
        </div>
      </div>
      {toast}
    </div>
  )
}
