import { useMemo, useState } from 'react'
import { Btn, Crumbs, Row, Title, ctl, err, page, ta } from '../components/strategic/Parts'
import { Ic } from '../components/asset/Parts'
import { useToast } from '../components/leader/Parts'
import Modal from '../components/ui/Modal'
import { ME, SLA_DAYS, addDays, agencies, caseTypes, channels, ctypes, daysBetween, daysLeft, nextCaseNo, nextNo, stageTone, stages, stamp, thDate, urgencyTone, type CType, type Complaint, type Urgency } from '../data/erpComplaint'
import { assign, close, complaints, registerCase, review, slaPct, useComplaints } from '../lib/complaintStore'

const I = {
  inbox: 'M4 13l2-8h12l2 8M4 13v6h16v-6M4 13h5l1 2h4l1-2h5',
  tag: 'M3 12V4h8l10 10-8 8ZM7.5 8h.01',
  scale: 'M12 3v18M5 21h14M4 8h16M4 8l-2 6a3 3 0 0 0 6 0Zm16 0-2 6a3 3 0 0 0 6 0Z',
  cal: 'M5 5h14a1 1 0 0 1 1 1v13a1 1 0 0 1-1 1H5a1 1 0 0 1-1-1V6a1 1 0 0 1 1-1ZM4 10h16M8 3v4M16 3v4',
  eye: 'M2 12s4-7 10-7 10 7 10 7-4 7-10 7S2 12 2 12ZM12 9a3 3 0 1 0 0 6 3 3 0 0 0 0-6Z',
  edit: 'M4 20h4L19 9l-4-4L4 16ZM13 7l4 4',
  copy: 'M9 9h10v11H9ZM5 15V4h10',
  trash: 'M4 7h16M10 11v6M14 11v6M6 7l1 13h10l1-13M9 7V4h6v3',
  arrow: 'M5 12h14M13 6l6 6-6 6',
  bell: 'M6 9a6 6 0 0 1 12 0c0 6 2 7 2 7H4s2-1 2-7ZM10 20a2 2 0 0 0 4 0',
  check: 'M5 12l5 5 9-10',
  alert: 'M12 9v4M12 17h.01M10.3 3.9 2.4 18a2 2 0 0 0 1.7 3h15.8a2 2 0 0 0 1.7-3L13.7 3.9a2 2 0 0 0-3.4 0Z',
}
const ib = 'flex size-[30px] items-center justify-center rounded-[8px] border border-gray-line-2 text-gray-30 transition hover:border-blue-20 hover:bg-blue-bg hover:text-blue-00 focus-visible:outline-2 focus-visible:outline-blue-00'
const red = (t: CType) => t === 'ทุจริต' || t === 'ความไม่โปร่งใส'
const SHOW = 6

type Form = { type: CType; channel: (typeof channels)[number]; subject: string; detail: string; complainant: string; urgency: Urgency; anon: boolean }
const blank: Form = { type: 'อื่น ๆ', channel: 'เว็บไซต์', subject: '', detail: '', complainant: '', urgency: 'ปกติ', anon: false }

/** ภาพรวมระบบรับเรื่องร้องเรียน/คดี — home of ERP COMPLAINT (book 3 §2.1.9.1, fig 2-56) */
export default function ComplaintHomePage() {
  const list = useComplaints()
  const [toast, show] = useToast()
  const [modal, setModal] = useState<'' | 'intake' | 'pick' | 'case' | 'hearing' | 'all'>('')
  const [editing, setEditing] = useState<Complaint>()
  const [f, setF] = useState<Form>(blank)
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [open, setOpen] = useState<number>()
  const [del, setDel] = useState<Complaint>()
  // classify / assign / close inputs inside the detail dialog
  const [cls, setCls] = useState<{ type: CType; urgency: Urgency; note: string; agency: string; result: string }>({ type: 'อื่น ๆ', urgency: 'ปกติ', note: '', agency: agencies[0], result: '' })
  const [cs, setCs] = useState({ id: 0, title: '', date: addDays(7), note: '' })

  const sorted = useMemo(() => [...list].sort((a, b) => b.receivedAt.localeCompare(a.receivedAt) || b.id - a.id), [list])
  const inReview = list.filter((c) => c.stage === 1 || c.stage === 2).length
  const sla = slaPct(list)
  const byType = ctypes.map((t) => ({ t, n: list.filter((c) => c.type === t).length }))
  const maxT = Math.max(1, ...byType.map((x) => x.n))
  const funnel = stages.map((s, i) => ({ s, n: list.filter((c) => c.stage >= i).length }))
  const cur = list.find((c) => c.id === open)
  const cases = list.filter((c) => c.caseNo).sort((a, b) => (a.hearing ?? '').localeCompare(b.hearing ?? ''))
  const today = addDays(0)
  const alerts = [
    ...(list.filter((c) => c.type === 'ทุจริต' && c.stage < 2).length ? [{ at: `${thDate(today)} 08:00`, text: `มีเรื่องร้องเรียนทุจริต ${list.filter((c) => c.type === 'ทุจริต' && c.stage < 2).length} เรื่องที่ยังไม่มอบหมายหน่วยงาน` }] : []),
    ...(list.filter((c) => c.stage < 3 && daysLeft(c) <= 3).length ? [{ at: `${thDate(today)} 08:00`, text: `มี ${list.filter((c) => c.stage < 3 && daysLeft(c) <= 3).length} เรื่องใกล้หรือเกินกำหนด SLA ${SLA_DAYS} วัน` }] : []),
    ...cases.filter((c) => c.hearing && c.hearing >= today && daysBetween(today, c.hearing) <= 7).map((c) => ({ at: `${thDate(c.hearing!)} นัดพิจารณา`, text: `นัดพิจารณาคดี ${c.caseNo} ในอีก ${daysBetween(today, c.hearing!)} วัน` })),
    ...(list.filter((c) => c.stage === 0).length ? [{ at: `${thDate(today)} 09:00`, text: `มีเรื่องใหม่รอตรวจสอบและจำแนกประเภท ${list.filter((c) => c.stage === 0).length} เรื่อง` }] : []),
  ]

  const openIntake = (c?: Complaint) => {
    setEditing(c)
    setF(c ? { type: c.type, channel: c.channel, subject: c.subject, detail: c.detail, complainant: c.complainant === 'ไม่ประสงค์ออกนาม' ? '' : c.complainant, urgency: c.urgency, anon: c.complainant === 'ไม่ประสงค์ออกนาม' } : blank)
    setErrors({}); setModal('intake')
  }
  const saveIntake = () => {
    const e: Record<string, string> = {}
    if (!f.subject.trim()) e.subject = 'กรุณาระบุเรื่องที่ร้องเรียน'
    if (f.detail.trim().length < 10) e.detail = 'กรุณาระบุรายละเอียดอย่างน้อย 10 ตัวอักษร'
    if (!f.anon && !f.complainant.trim()) e.complainant = 'กรุณาระบุชื่อผู้ร้อง หรือเลือก “ไม่ประสงค์ออกนาม”'
    setErrors(e)
    if (Object.keys(e).length) return
    const base = { type: f.type, channel: f.channel, subject: f.subject.trim(), detail: f.detail.trim(), complainant: f.anon ? 'ไม่ประสงค์ออกนาม' : f.complainant.trim(), urgency: f.urgency }
    if (editing) { complaints.save({ ...editing, ...base, history: [...editing.history, { at: stamp(), by: ME, action: 'แก้ไขข้อมูลเรื่องร้องเรียน' }] }); show('บันทึกการแก้ไขแล้ว') }
    else { const no = nextNo(list); complaints.save({ id: complaints.next(), no, ...base, agency: '', stage: 0, receivedAt: today, history: [{ at: stamp(), by: ME, action: 'รับเรื่องแล้ว', note: `ช่องทาง: ${f.channel}` }] }); show(`รับเรื่องแล้ว เลขรับเรื่อง ${no}`) }
    setModal('')
  }
  const copy = (c: Complaint) => { const no = nextNo(list); complaints.save({ ...c, id: complaints.next(), no, subject: `${c.subject} (สำเนา)`, stage: 0, agency: '', closedAt: undefined, result: undefined, caseNo: undefined, caseTitle: undefined, hearing: undefined, hearingNote: undefined, receivedAt: today, history: [{ at: stamp(), by: ME, action: `คัดลอกจาก ${c.no}` }] }); show(`คัดลอกเป็นเรื่องใหม่ ${no} แล้ว`) }
  const view = (c: Complaint) => { setCls({ type: c.type, urgency: c.urgency, note: '', agency: c.agency || agencies[0], result: '' }); setOpen(c.id); setModal('') }
  const caseCandidates = list.filter((c) => caseTypes.includes(c.type) && !c.caseNo && c.stage >= 1)

  const Row6 = ({ c }: { c: Complaint }) => (
    <tr className="border-b border-gray-line-2 last:border-0 hover:bg-[#f7faff]">
      <td className="py-[10px] pr-[10px] font-urbanist text-[12px] whitespace-nowrap text-blue-00">{c.no}</td>
      <td className="py-[10px] pr-[10px] whitespace-nowrap"><span className={`rounded-full px-[8px] py-[2px] text-[11px] ${red(c.type) ? 'bg-[#ffe3e3] text-[#c13232]' : 'bg-blue-bg text-blue-dark'}`}>{c.type}</span></td>
      <td className="max-w-[240px] py-[10px] pr-[10px] text-[12px]"><p className="line-clamp-2 font-medium">{c.subject}</p><p className="text-[11px] font-light text-gray-20">{c.channel}</p></td>
      <td className="py-[10px] pr-[10px] text-[12px] whitespace-nowrap">{c.complainant === 'ไม่ประสงค์ออกนาม' ? <span className="text-gray-20">ไม่ประสงค์ออกนาม</span> : c.complainant}</td>
      <td className="py-[10px] pr-[10px] text-[12px] text-gray-30">{c.agency || '—'}</td>
      <td className="py-[10px] pr-[10px]"><span className={`rounded-full px-[10px] py-[3px] text-[11px] font-medium whitespace-nowrap ${urgencyTone[c.urgency]}`}>{c.urgency}</span></td>
      <td className="py-[10px] pr-[10px]"><span className={`rounded-full px-[10px] py-[3px] text-[11px] font-medium whitespace-nowrap ${stageTone[c.stage]}`}>{stages[c.stage]}</span></td>
      <td className="py-[10px]"><Actions c={c} /></td>
    </tr>
  )
  const Actions = ({ c }: { c: Complaint }) => (
    <div className="flex items-center justify-end gap-[6px]">
      <button type="button" aria-label={`ดูข้อมูลเพิ่มเติม ${c.no}`} title="ดูข้อมูลเพิ่มเติม" onClick={() => view(c)} className={ib}><Ic d={I.eye} s={15} /></button>
      <button type="button" aria-label={`แก้ไข ${c.no}`} title="แก้ไข" disabled={c.stage === 3} onClick={() => openIntake(c)} className={`${ib} disabled:opacity-30`}><Ic d={I.edit} s={15} /></button>
      <button type="button" aria-label={`คัดลอก ${c.no}`} title="คัดลอก" onClick={() => copy(c)} className={ib}><Ic d={I.copy} s={15} /></button>
      <button type="button" aria-label={`ลบ ${c.no}`} title="ลบรายการ" onClick={() => setDel(c)} className={`${ib} hover:!border-[#f0b4b4] hover:!bg-[#fff1f1] hover:!text-[#c13232]`}><Ic d={I.trash} s={15} /></button>
    </div>
  )
  const Table = ({ rows }: { rows: Complaint[] }) => (
    <>
      <div className="overflow-x-auto max-md:hidden">
        <table className="w-full min-w-[900px] text-left text-[12px]">
          <thead className="text-[11px] text-gray-20"><tr>{['เลขรับเรื่อง', 'ประเภท', 'เรื่อง / ช่องทาง', 'ผู้ร้อง', 'หน่วยงานที่รับส่งต่อ', 'ความเร่งด่วน', 'สถานะ', ''].map((h, i) => <th key={i} className="border-b border-gray-line-2 pb-[8px] pr-[10px] font-medium whitespace-nowrap">{h}</th>)}</tr></thead>
          <tbody>{rows.map((c) => <Row6 key={c.id} c={c} />)}</tbody>
        </table>
      </div>
      <ul className="flex flex-col gap-[10px] md:hidden">
        {rows.map((c) => (
          <li key={c.id} className="flex flex-col gap-[8px] rounded-[12px] border border-gray-line-2 p-[12px]">
            <div className="flex items-start gap-[8px]"><div className="min-w-0 flex-1"><p className="font-urbanist text-[11px] text-blue-00">{c.no}</p><p className="text-[13px] leading-[1.4] font-semibold">{c.subject}</p></div><span className={`rounded-full px-[10px] py-[3px] text-[11px] font-medium whitespace-nowrap ${stageTone[c.stage]}`}>{stages[c.stage]}</span></div>
            <div className="flex flex-wrap gap-[6px] text-[11px]"><span className={`rounded-full px-[8px] py-[2px] ${red(c.type) ? 'bg-[#ffe3e3] text-[#c13232]' : 'bg-blue-bg text-blue-dark'}`}>{c.type}</span><span className={`rounded-full px-[8px] py-[2px] ${urgencyTone[c.urgency]}`}>เร่งด่วน: {c.urgency}</span><span className="text-gray-30">{c.channel}</span></div>
            <Actions c={c} />
          </li>
        ))}
      </ul>
      {!rows.length && <p className="py-[24px] text-center text-[13px] font-light text-gray-20">ไม่มีรายการ</p>}
    </>
  )

  const tiles = [
    { label: 'เรื่องร้องเรียนทั้งหมด', v: list.length, unit: 'เรื่อง', bg: 'from-[#0a7cff] to-[#2d8cff]' },
    { label: 'อยู่ระหว่างตรวจสอบ / มอบหมาย', v: inReview, unit: 'เรื่อง', bg: 'from-[#ff9f1c] to-[#ffb347]' },
    { label: 'สัดส่วนปิดเรื่องภายใน SLA', v: `${sla}%`, unit: `ภายใน ${SLA_DAYS} วัน`, bg: 'from-[#12a58c] to-[#2cc3a6]' },
  ]
  const quick = [
    { label: 'รับเรื่องร้องเรียน', icon: I.inbox, on: () => openIntake() },
    { label: 'ตรวจสอบและจำแนกประเภทเรื่อง', icon: I.tag, on: () => setModal('pick') },
    { label: 'ลงทะเบียนคดีใหม่', icon: I.scale, on: () => { setCs({ id: caseCandidates[0]?.id ?? 0, title: '', date: addDays(7), note: '' }); setErrors({}); setModal('case') } },
    { label: 'ตารางนัดพิจารณาคดี', icon: I.cal, on: () => setModal('hearing') },
  ]

  return (
    <div className={`${page} items-center`}>
      <div className="flex w-full max-w-[1100px] flex-col gap-[14px]">
        <Title>งานรับเรื่องร้องเรียน</Title>
        <Crumbs items={[{ label: 'หน้าแรก', to: '/complaint' }, { label: 'ภาพรวมระบบรับเรื่องร้องเรียน/คดี' }]} />

        <section aria-label="ภาพรวมระบบรับเรื่องร้องเรียน/คดี" className="flex flex-col gap-[12px] rounded-[18px] bg-[linear-gradient(120deg,#cfe0fb,#e4dcf6_60%,#f8d8cc)] p-[18px]">
          <div><h2 className="text-[18px] font-semibold text-blue-00">ภาพรวมระบบรับเรื่องร้องเรียน/คดี</h2><p className="text-[11px] font-light text-gray-30">ข้อมูลล่าสุด : {thDate(today)} · คำนวณจากเรื่องร้องเรียนในระบบ</p></div>
          <div className="grid grid-cols-3 gap-[12px] max-md:grid-cols-1">
            {tiles.map((t) => <div key={t.label} className={`flex items-center justify-between rounded-[14px] bg-gradient-to-r ${t.bg} px-[16px] py-[14px] text-white shadow-sm`}><span className="text-[13px] font-medium">{t.label}</span><span className="text-right"><span className="block font-urbanist text-[26px] leading-[1.1] font-bold">{t.v}</span><span className="text-[11px] opacity-90">{t.unit}</span></span></div>)}
          </div>
        </section>

        <section aria-label="เมนูด่วน" className="rounded-[18px] bg-[#e8f1fe] p-[16px]">
          <h2 className="mb-[10px] text-[14px] font-semibold text-blue-dark">เมนูด่วน</h2>
          <div className="grid grid-cols-4 gap-[12px] max-lg:grid-cols-2 max-sm:grid-cols-1">
            {quick.map((q) => (
              <button key={q.label} type="button" onClick={q.on} className="group flex flex-col gap-[10px] rounded-[12px] bg-white p-[14px] text-left shadow-sm transition hover:shadow-[0_6px_18px_rgba(31,90,200,0.15)]">
                <span className="flex size-[34px] items-center justify-center rounded-[9px] bg-blue-bg text-blue-00"><Ic d={q.icon} s={17} /></span>
                <span className="text-[13px] font-semibold">{q.label}</span>
                <span className="flex items-center gap-[4px] text-[12px] text-blue-00">เริ่ม<span className="transition group-hover:translate-x-[3px]"><Ic d={I.arrow} s={14} /></span></span>
              </button>
            ))}
          </div>
        </section>

        <div className="grid grid-cols-2 gap-[14px] max-lg:grid-cols-1">
          <section aria-label="สถิติเรื่องร้องเรียนตามประเภท" className="rounded-[18px] bg-[#e8f1fe] p-[16px]">
            <h2 className="mb-[10px] text-[14px] font-semibold text-blue-dark">สถิติเรื่องร้องเรียนตามประเภท</h2>
            <div className="flex flex-col gap-[12px] rounded-[12px] bg-white p-[16px]">
              {byType.map(({ t, n }) => (
                <div key={t} className="grid grid-cols-[110px_minmax(0,1fr)_56px] items-center gap-[10px] text-[12px]">
                  <span>{t}</span>
                  <span className="h-[14px] rounded-full bg-[#eef3fb]"><span className={`block h-full rounded-full ${red(t) ? 'bg-[#dc4b4b]' : 'bg-[#2b6bf0]'}`} style={{ width: `${(n / maxT) * 100}%`, minWidth: n ? 8 : 0 }} /></span>
                  <span className="font-urbanist font-semibold">{n} เรื่อง</span>
                </div>
              ))}
            </div>
          </section>
          <section aria-label="Complaint Funnel" className="rounded-[18px] bg-[#e8f1fe] p-[16px]">
            <h2 className="mb-[10px] text-[14px] font-semibold text-blue-dark">Complaint Funnel – ขั้นตอนการดำเนินการ</h2>
            <div className="flex flex-col items-center gap-[10px] rounded-[12px] bg-white p-[16px]">
              {funnel.map((x, i) => <div key={x.s} className="flex h-[30px] items-center justify-center rounded-[6px] bg-[#3f7be8] px-[10px] text-[12px] font-medium whitespace-nowrap text-white" style={{ width: `${100 - i * 14}%`, opacity: 1 - i * 0.07 }}>{x.s} ({x.n} เรื่อง)</div>)}
            </div>
          </section>
        </div>

        <div className="grid grid-cols-[minmax(0,1fr)_300px] items-start gap-[14px] max-lg:grid-cols-1">
          <section aria-label="รายการเรื่องร้องเรียนล่าสุด" className="flex flex-col gap-[10px] rounded-[14px] border border-gray-line-2 bg-white p-[16px]">
            <div className="flex items-center gap-[10px]"><h2 className="min-w-0 flex-1 text-[15px] font-semibold">รายการเรื่องร้องเรียนล่าสุด</h2><button type="button" onClick={() => setModal('all')} className="h-[32px] rounded-[8px] border border-blue-00 px-[14px] text-[12px] font-medium text-blue-00 hover:bg-blue-bg">ทั้งหมด ({list.length})</button></div>
            <Table rows={sorted.slice(0, SHOW)} />
          </section>
          <aside aria-label="แจ้งเตือนสำคัญ" className="flex flex-col gap-[10px] rounded-[14px] border border-gray-line-2 bg-white p-[16px]">
            <h2 className="flex items-center gap-[8px] text-[14px] font-semibold"><span className="text-blue-00"><Ic d={I.bell} s={16} /></span>แจ้งเตือนสำคัญ</h2>
            <ol className="flex flex-col gap-[12px]">
              {alerts.map((a, i) => <li key={i} className="flex gap-[10px]"><span className="mt-[2px] flex size-[26px] shrink-0 items-center justify-center rounded-full bg-[#fff1d6] text-[#a8650b]"><Ic d={I.alert} s={13} /></span><span><span className="block text-[12px] leading-[1.5] font-medium">{a.text}</span><span className="block text-[10px] font-light text-gray-20">{a.at}</span></span></li>)}
              {!alerts.length && <li className="text-[12px] font-light text-gray-20">ไม่มีเรื่องที่ต้องติดตามเป็นพิเศษ</li>}
            </ol>
          </aside>
        </div>
      </div>

      <Modal open={modal === 'all'} onClose={() => setModal('')} title="รายการเรื่องร้องเรียนทั้งหมด" width="max-w-[1050px]">
        <div className="max-h-[68vh] overflow-y-auto pr-[4px]"><Table rows={sorted} /></div>
      </Modal>

      <Modal open={modal === 'intake'} onClose={() => setModal('')} title={editing ? `แก้ไขเรื่องร้องเรียน ${editing.no}` : 'รับเรื่องร้องเรียน'} width="max-w-[620px]">
        <div className="flex max-h-[68vh] flex-col gap-[12px] overflow-y-auto pr-[4px]">
          <Row label="ช่องทางรับเรื่อง" req><select aria-label="ช่องทางรับเรื่อง" value={f.channel} onChange={(e) => setF({ ...f, channel: e.target.value as Form['channel'] })} className={ctl}>{channels.map((c) => <option key={c}>{c}</option>)}</select></Row>
          <Row label="ประเภทเรื่อง" req hint="ผู้ตรวจสอบจำแนกประเภทใหม่ได้ภายหลัง"><select aria-label="ประเภทเรื่อง" value={f.type} onChange={(e) => setF({ ...f, type: e.target.value as CType })} className={ctl}>{ctypes.map((c) => <option key={c}>{c}</option>)}</select></Row>
          <Row label="เรื่อง" req error={errors.subject}><input aria-label="เรื่องที่ร้องเรียน" value={f.subject} onChange={(e) => setF({ ...f, subject: e.target.value })} className={`${ctl} ${errors.subject ? err : ''}`} /></Row>
          <Row label="รายละเอียด" req error={errors.detail}><textarea aria-label="รายละเอียดเรื่องร้องเรียน" value={f.detail} onChange={(e) => setF({ ...f, detail: e.target.value })} className={`${ta} !min-h-[90px] ${errors.detail ? err : ''}`} /></Row>
          <Row label="ผู้ร้อง" req error={errors.complainant}>
            <input aria-label="ชื่อผู้ร้อง" disabled={f.anon} value={f.anon ? '' : f.complainant} onChange={(e) => setF({ ...f, complainant: e.target.value })} placeholder={f.anon ? 'ไม่ประสงค์ออกนาม' : 'ชื่อ-นามสกุล หรือชื่อหน่วยงาน'} className={`${ctl} ${errors.complainant ? err : ''}`} />
            <label className="mt-[6px] flex cursor-pointer items-center gap-[8px] text-[12px]"><input type="checkbox" checked={f.anon} onChange={(e) => setF({ ...f, anon: e.target.checked })} className="size-[15px] accent-[#1f5ac8]" />ไม่ประสงค์ออกนาม</label>
          </Row>
          <Row label="ความเร่งด่วน" req><select aria-label="ความเร่งด่วน" value={f.urgency} onChange={(e) => setF({ ...f, urgency: e.target.value as Urgency })} className={`${ctl} max-w-[200px]`}>{(['ปกติ', 'ปานกลาง', 'สูง'] as Urgency[]).map((u) => <option key={u}>{u}</option>)}</select></Row>
          <div className="flex justify-end gap-[8px]"><Btn kind="ghost" onClick={() => setModal('')}>ยกเลิก</Btn><Btn onClick={saveIntake}>{editing ? 'บันทึกการแก้ไข' : 'รับเรื่อง'}</Btn></div>
        </div>
      </Modal>

      <Modal open={modal === 'pick'} onClose={() => setModal('')} title="ตรวจสอบและจำแนกประเภทเรื่อง" width="max-w-[640px]">
        <div className="flex max-h-[60vh] flex-col gap-[8px] overflow-y-auto pr-[4px]">
          <p className="text-[12px] font-light text-gray-30">เลือกเรื่องที่ยังรอตรวจสอบเบื้องต้น</p>
          {list.filter((c) => c.stage === 0).map((c) => <button key={c.id} type="button" onClick={() => view(c)} className="flex flex-col rounded-[10px] border border-gray-line-2 p-[12px] text-left hover:border-blue-20 hover:bg-blue-bg/50"><span className="font-urbanist text-[11px] text-blue-00">{c.no} · {thDate(c.receivedAt)}</span><span className="text-[13px] font-semibold">{c.subject}</span><span className="text-[11px] font-light text-gray-30">{c.channel} · เร่งด่วน {c.urgency}</span></button>)}
          {!list.some((c) => c.stage === 0) && <p className="py-[20px] text-center text-[13px] font-light text-gray-20">ไม่มีเรื่องที่รอตรวจสอบ</p>}
        </div>
      </Modal>

      <Modal open={modal === 'case'} onClose={() => setModal('')} title="ลงทะเบียนคดีใหม่" width="max-w-[560px]">
        <div className="flex flex-col gap-[12px]">
          {!caseCandidates.length ? <p className="py-[16px] text-center text-[13px] font-light text-gray-30">ยังไม่มีเรื่องที่ลงทะเบียนเป็นคดีได้ (ต้องเป็นเรื่องทุจริตหรือความไม่โปร่งใส ที่ผ่านการตรวจสอบเบื้องต้นแล้ว)</p> : (
            <>
              <Row label="เรื่องร้องเรียน" req><select aria-label="เรื่องร้องเรียนที่จะลงทะเบียนคดี" value={cs.id} onChange={(e) => setCs({ ...cs, id: Number(e.target.value) })} className={ctl}>{caseCandidates.map((c) => <option key={c.id} value={c.id}>{`${c.no} — ${c.subject}`}</option>)}</select></Row>
              <Row label="ชื่อคดี" req error={errors.title}><input aria-label="ชื่อคดี" value={cs.title} onChange={(e) => setCs({ ...cs, title: e.target.value })} placeholder="เช่น กรณีร้องเรียน…" className={`${ctl} ${errors.title ? err : ''}`} /></Row>
              <Row label="วันนัดพิจารณา" req error={errors.date}><input type="date" aria-label="วันนัดพิจารณาคดี" min={today} value={cs.date} onChange={(e) => setCs({ ...cs, date: e.target.value })} className={`${ctl} max-w-[220px] ${errors.date ? err : ''}`} /></Row>
              <Row label="สถานที่/เวลา"><input aria-label="สถานที่และเวลานัด" value={cs.note} onChange={(e) => setCs({ ...cs, note: e.target.value })} placeholder="เช่น ห้องประชุมใหญ่ ชั้น 5 เวลา 13:30 น." className={ctl} /></Row>
              <div className="flex justify-end gap-[8px]"><Btn kind="ghost" onClick={() => setModal('')}>ยกเลิก</Btn><Btn onClick={() => {
                const e: Record<string, string> = {}
                if (!cs.title.trim()) e.title = 'กรุณาระบุชื่อคดี'
                if (!cs.date || cs.date < today) e.date = 'กรุณาเลือกวันนัดตั้งแต่วันนี้เป็นต้นไป'
                setErrors(e)
                if (Object.keys(e).length) return
                const no = nextCaseNo(list)
                registerCase(cs.id, no, cs.title.trim(), cs.date, cs.note)
                setModal(''); show(`ลงทะเบียนคดี ${no} แล้ว`)
              }}>ลงทะเบียนคดี</Btn></div>
            </>
          )}
        </div>
      </Modal>

      <Modal open={modal === 'hearing'} onClose={() => setModal('')} title="ตารางนัดพิจารณาคดี" width="max-w-[640px]">
        <div className="flex max-h-[60vh] flex-col gap-[8px] overflow-y-auto pr-[4px]">
          {cases.map((c) => { const d = c.hearing ? daysBetween(today, c.hearing) : 0; return (
            <div key={c.id} className="flex flex-col gap-[4px] rounded-[10px] border border-gray-line-2 p-[12px]">
              <div className="flex items-center gap-[8px]"><span className="font-urbanist text-[12px] font-semibold text-blue-00">{c.caseNo}</span><span className={`ml-auto rounded-full px-[10px] py-[2px] text-[11px] font-medium ${d < 0 ? 'bg-gray-bg text-gray-30' : d <= 7 ? 'bg-[#fff1d6] text-[#a8650b]' : 'bg-[#e8f1ff] text-[#2057c9]'}`}>{d < 0 ? 'นัดผ่านไปแล้ว' : d === 0 ? 'วันนี้' : `อีก ${d} วัน`}</span></div>
              <p className="text-[13px] font-semibold">{c.caseTitle}</p>
              <p className="text-[12px] font-light text-gray-30">นัดพิจารณา {c.hearing ? thDate(c.hearing) : '-'} · {c.hearingNote || 'ยังไม่ระบุสถานที่'} · อ้างอิง {c.no}</p>
            </div>) })}
          {!cases.length && <p className="py-[20px] text-center text-[13px] font-light text-gray-20">ยังไม่มีคดีที่นัดพิจารณา</p>}
        </div>
      </Modal>

      <Modal open={!!cur} onClose={() => setOpen(undefined)} title={cur ? `เรื่องร้องเรียน ${cur.no}` : ''} width="max-w-[640px]">
        {cur && (
          <div className="flex max-h-[70vh] flex-col gap-[14px] overflow-y-auto pr-[4px]">
            <div className="flex flex-wrap items-center gap-[8px]"><p className="min-w-0 flex-1 text-[15px] leading-[1.4] font-semibold">{cur.subject}</p><span className={`rounded-full px-[10px] py-[3px] text-[11px] font-medium ${stageTone[cur.stage]}`}>{stages[cur.stage]}</span></div>
            <p className="text-[13px] leading-[1.7] font-light text-gray-30">{cur.detail}</p>
            <dl className="grid grid-cols-2 gap-x-[16px] gap-y-[8px] rounded-[12px] bg-gray-subtle p-[14px] text-[12px] max-sm:grid-cols-1">
              {[['ประเภท', cur.type], ['ช่องทาง', cur.channel], ['ผู้ร้อง', cur.complainant], ['ความเร่งด่วน', cur.urgency], ['หน่วยงานที่รับส่งต่อ', cur.agency || '—'], ['วันที่รับเรื่อง', thDate(cur.receivedAt)], ['กำหนด SLA', cur.stage === 3 ? (cur.closedAt && daysBetween(cur.receivedAt, cur.closedAt) <= SLA_DAYS ? `ปิดภายใน ${daysBetween(cur.receivedAt, cur.closedAt!)} วัน (ทันกำหนด)` : `ปิดใน ${daysBetween(cur.receivedAt, cur.closedAt!)} วัน (เกินกำหนด)`) : daysLeft(cur) >= 0 ? `เหลือ ${daysLeft(cur)} วัน` : `เกินกำหนด ${-daysLeft(cur)} วัน`], ...(cur.caseNo ? [['คดี', `${cur.caseNo} · นัด ${cur.hearing ? thDate(cur.hearing) : '-'}`]] : [])].map(([k, v]) => <div key={k} className="flex flex-col"><dt className="text-[11px] font-light text-gray-20">{k}</dt><dd className="font-medium break-words">{v}</dd></div>)}
            </dl>
            {cur.result && <p className="rounded-[10px] bg-[#e7f7ef] px-[12px] py-[8px] text-[12px] text-[#0f8a63]">ผลการดำเนินการ: {cur.result}</p>}

            {cur.stage === 0 && (
              <div className="flex flex-col gap-[10px] rounded-[12px] border border-blue-20 bg-blue-bg/50 p-[14px]">
                <p className="text-[13px] font-semibold">ตรวจสอบเบื้องต้นและจำแนกประเภท</p>
                <div className="grid grid-cols-2 gap-[10px] max-sm:grid-cols-1">
                  <label className="flex flex-col gap-[4px] text-[12px] font-medium">ประเภทเรื่อง<select aria-label="จำแนกประเภทเรื่อง" value={cls.type} onChange={(e) => setCls({ ...cls, type: e.target.value as CType })} className={ctl}>{ctypes.map((c) => <option key={c}>{c}</option>)}</select></label>
                  <label className="flex flex-col gap-[4px] text-[12px] font-medium">ความเร่งด่วน<select aria-label="กำหนดความเร่งด่วน" value={cls.urgency} onChange={(e) => setCls({ ...cls, urgency: e.target.value as Urgency })} className={ctl}>{(['ปกติ', 'ปานกลาง', 'สูง'] as Urgency[]).map((u) => <option key={u}>{u}</option>)}</select></label>
                </div>
                <input aria-label="หมายเหตุการตรวจสอบ" value={cls.note} onChange={(e) => setCls({ ...cls, note: e.target.value })} placeholder="หมายเหตุการตรวจสอบ (ไม่บังคับ)" className={ctl} />
                <div className="flex justify-end"><Btn onClick={() => { review(cur.id, { type: cls.type, urgency: cls.urgency }, cls.note); show('บันทึกผลตรวจสอบเบื้องต้นแล้ว') }}>ตรวจสอบเบื้องต้นแล้ว</Btn></div>
              </div>
            )}
            {cur.stage === 1 && (
              <div className="flex flex-col gap-[10px] rounded-[12px] border border-blue-20 bg-blue-bg/50 p-[14px]">
                <p className="text-[13px] font-semibold">มอบหมายหน่วยงานรับเรื่อง</p>
                <select aria-label="หน่วยงานที่รับส่งต่อ" value={cls.agency} onChange={(e) => setCls({ ...cls, agency: e.target.value })} className={ctl}>{agencies.map((a) => <option key={a}>{a}</option>)}</select>
                <div className="flex justify-end"><Btn onClick={() => { assign(cur.id, cls.agency); show(`ส่งต่อให้ ${cls.agency} แล้ว`) }}>มอบหมายหน่วยงาน</Btn></div>
              </div>
            )}
            {cur.stage === 2 && (
              <div className="flex flex-col gap-[10px] rounded-[12px] border border-blue-20 bg-blue-bg/50 p-[14px]">
                <p className="text-[13px] font-semibold">ปิดเรื่อง</p>
                <textarea aria-label="ผลการดำเนินการ" value={cls.result} onChange={(e) => setCls({ ...cls, result: e.target.value })} placeholder="สรุปผลการดำเนินการ / การแจ้งผู้ร้อง" className={`${ta} !min-h-[72px]`} />
                <div className="flex justify-end"><Btn disabled={cls.result.trim().length < 5} onClick={() => { close(cur.id, cls.result); show('ปิดเรื่องแล้ว') }}>ปิดเรื่อง</Btn></div>
              </div>
            )}

            <div>
              <p className="mb-[8px] text-[13px] font-semibold">ประวัติการดำเนินการ</p>
              <ol className="relative flex flex-col gap-[10px] border-l-2 border-blue-20 pl-[16px]">
                {cur.history.map((h, i) => <li key={i} className="relative"><span className={`absolute top-[4px] -left-[22px] size-[10px] rounded-full ring-4 ring-white ${i === cur.history.length - 1 ? 'bg-blue-00' : 'bg-blue-20'}`} /><p className="text-[12px] font-medium">{h.action} <span className="font-light text-gray-30">· {h.by}</span></p><p className="text-[11px] font-light text-gray-20">{h.at}</p>{h.note && <p className="mt-[2px] rounded-[8px] bg-gray-subtle px-[10px] py-[6px] text-[12px] font-light text-gray-30">{h.note}</p>}</li>)}
              </ol>
            </div>
          </div>
        )}
      </Modal>

      <Modal open={!!del} onClose={() => setDel(undefined)} title="ลบเรื่องร้องเรียน" width="max-w-[420px]">
        {del && (
          <div className="flex flex-col gap-[16px]">
            <p className="text-[13px] leading-[1.6] font-light text-gray-30">ต้องการลบ <b className="font-semibold text-black">{del.no}</b> “{del.subject}” ใช่หรือไม่ การลบไม่สามารถกู้คืนได้</p>
            <div className="flex justify-end gap-[8px]"><button type="button" onClick={() => setDel(undefined)} className="h-[38px] rounded-[8px] border border-gray-line px-[16px] text-[13px] hover:border-gray-10">ยกเลิก</button><button type="button" onClick={() => { complaints.remove(del.id); setDel(undefined); show('ลบเรื่องร้องเรียนแล้ว') }} className="h-[38px] rounded-[8px] bg-[#e5484d] px-[16px] text-[13px] font-medium text-white hover:brightness-110">ลบรายการ</button></div>
          </div>
        )}
      </Modal>
      {toast}
    </div>
  )
}
