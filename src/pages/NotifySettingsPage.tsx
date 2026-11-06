import { useState } from 'react'
import { Link, useNavigate, useSearchParams } from 'react-router-dom'
import { Btn, Crumbs, Gate, Ic, NI, NPersonaSwitch, Radios, Row, Section, Title, ctl, err, page, ta } from '../components/notify/Parts'
import Modal from '../components/ui/Modal'
import { addDays, channels, isDue, offices, people, repeats, stamp, topicOf, topics, type Severity } from '../data/erpNotify'
import { notices, nWho, useNPersona, useNotices } from '../lib/notifyStore'

const times = Array.from({ length: 24 }, (_, i) => `${String(i).padStart(2, '0')}:00`)

/** ตั้งค่าการแจ้งเตือน — admin defines topic, time, recipients (book 3 §2.5.2.3, fig 2-147) */
export default function NotifySettingsPage() {
  const all = useNotices()
  const me = useNPersona()
  const navigate = useNavigate()
  const [sp] = useSearchParams()
  const edit = all.find((n) => n.id === Number(sp.get('id')))
  const t0 = topicOf(edit?.topic ?? sp.get('topic') ?? 'other')
  const [topic, setTopic] = useState(edit?.topic ?? sp.get('topic') ?? '')
  const [title, setTitle] = useState(edit?.title ?? '')
  const [detail, setDetail] = useState(edit?.detail ?? '')
  const [sev, setSev] = useState<Severity>(edit?.severity ?? t0.sev)
  const [rec, setRec] = useState<string[]>(edit?.recipients ?? [])
  const [date, setDate] = useState(edit?.date ?? addDays(0))
  const [time, setTime] = useState(edit?.time ?? '09:00')
  const [repeat, setRepeat] = useState(edit?.repeat ?? repeats[0])
  const [chs, setChs] = useState<string[]>(edit?.channels ?? [channels[0]])
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [done, setDone] = useState<{ sent: boolean }>()
  const admin = me === 'admin'
  const tog = (list: string[], set: (v: string[]) => void, v: string) => set(list.includes(v) ? list.filter((x) => x !== v) : [...list, v])
  const pickTopic = (k: string) => { setTopic(k); if (k) { const t = topicOf(k); setSev(t.sev); if (!title.trim()) setTitle(t.label) } }

  const save = () => {
    const e: Record<string, string> = {}
    if (!topic) e.topic = 'กรุณาเลือกหัวข้อการแจ้งเตือน'
    if (!title.trim()) e.title = 'กรุณากรอกชื่อการแจ้งเตือน'
    if (!detail.trim()) e.detail = 'กรุณากรอกรายละเอียดการแจ้งเตือน'
    if (!rec.length) e.rec = 'กรุณาเลือกผู้รับหรือสำนักอย่างน้อย 1 รายการ'
    if (!date) e.date = 'กรุณาเลือกวันที่แจ้งเตือน'
    else if (!edit && date < addDays(0)) e.date = 'วันที่แจ้งเตือนต้องไม่เป็นวันที่ผ่านมาแล้ว'
    if (!chs.length) e.chs = 'กรุณาเลือกช่องทางอย่างน้อย 1 ช่องทาง'
    setErrors(e)
    if (Object.keys(e).length) return
    const t = topicOf(topic)
    const sent = isDue({ date, time })
    const base = { topic, title: title.trim(), detail: detail.trim(), severity: sev, source: t.source, to: t.to, recipients: rec, date, time, repeat, channels: chs, status: sent ? ('ใหม่' as const) : ('ตั้งเวลา' as const) }
    if (edit) notices.save({ ...edit, ...base, status: edit.status === 'ตอบสนองแล้ว' || edit.status === 'รอดำเนินการ' ? edit.status : base.status })
    else notices.save({ id: notices.next(), ...base, by: nWho(), createdAt: stamp() })
    setDone({ sent })
  }

  return (
    <div className={`${page} items-center`}>
      <div className="flex w-full max-w-[860px] flex-col gap-[12px]">
        <Title back="/notify" right={<NPersonaSwitch />}>{edit ? 'แก้ไขการแจ้งเตือน' : 'ตั้งค่าการแจ้งเตือน'}</Title>
        <Crumbs items={[{ label: 'หน้าแรก', to: '/notify' }, { label: 'Notification Center', to: '/notify' }, { label: 'ตั้งค่าการแจ้งเตือน' }]} />
        <Gate allowed={admin} need="เจ้าหน้าที่ผู้ดูแลระบบ" />

        <Section title="รายละเอียดการแจ้งเตือน">
          <Row label="หัวข้อการแจ้งเตือน" req error={errors.topic}>
            <select aria-label="หัวข้อการแจ้งเตือน" disabled={!admin} value={topic} onChange={(e) => pickTopic(e.target.value)} className={`${ctl} ${errors.topic ? err : ''}`}><option value="">เลือกหัวข้อการแจ้งเตือน</option>{topics.map((t) => <option key={t.key} value={t.key}>{`${t.label} — ${t.source}`}</option>)}</select>
          </Row>
          <Row label="ชื่อการแจ้งเตือน" req error={errors.title}><input aria-label="ชื่อการแจ้งเตือน" disabled={!admin} value={title} onChange={(e) => setTitle(e.target.value)} placeholder="เช่น สัญญาใกล้ครบกำหนดภายใน 30 วัน" className={`${ctl} ${errors.title ? err : ''}`} /></Row>
          <Row label="รายละเอียดการแจ้งเตือน" req error={errors.detail}><textarea aria-label="รายละเอียดการแจ้งเตือน" disabled={!admin} value={detail} onChange={(e) => setDetail(e.target.value)} placeholder="ข้อความที่ผู้รับจะเห็น และสิ่งที่ต้องดำเนินการ" className={`${ta} ${errors.detail ? err : ''}`} /></Row>
          <Row label="ระดับความสำคัญ" req><Radios label="ระดับความสำคัญ" value={sev} disabled={!admin} options={[{ key: 'ทั่วไป', label: 'ทั่วไป' }, { key: 'ปานกลาง', label: 'ความเสี่ยงปานกลาง' }, { key: 'สูง', label: 'ความเสี่ยงสูง' }]} onChange={(v) => setSev(v as Severity)} /></Row>
        </Section>

        <Section title="ผู้รับและเวลาแจ้งเตือน">
          <Row label="ผู้รับ / สำนัก" req error={errors.rec} hint="เลือกได้หลายรายการ — เลือก “ทุกคน” เพื่อส่งถึงผู้ใช้ทั้งหมด">
            <div className="flex flex-col gap-[10px] pt-[4px]">
              <div className="flex flex-wrap gap-[6px]" role="group" aria-label="สำนัก">{offices.map((o) => <button key={o} type="button" disabled={!admin} aria-pressed={rec.includes(o)} onClick={() => tog(rec, setRec, o)} className={`rounded-full border px-[12px] py-[5px] text-[12px] transition ${rec.includes(o) ? 'border-blue-00 bg-blue-00 text-white' : 'border-gray-line bg-white text-gray-30 hover:border-blue-20'} disabled:opacity-50`}>{o}</button>)}</div>
              <div className="flex flex-wrap gap-[6px]" role="group" aria-label="บุคคล">{people.map((o) => <button key={o} type="button" disabled={!admin} aria-pressed={rec.includes(o)} onClick={() => tog(rec, setRec, o)} className={`rounded-full border px-[12px] py-[5px] text-[12px] transition ${rec.includes(o) ? 'border-[#6a55e8] bg-[#6a55e8] text-white' : 'border-gray-line bg-white text-gray-30 hover:border-blue-20'} disabled:opacity-50`}>{o}</button>)}</div>
            </div>
          </Row>
          <Row label="วันที่แจ้งเตือน" req error={errors.date}><input type="date" aria-label="วันที่แจ้งเตือน" disabled={!admin} value={date} onChange={(e) => setDate(e.target.value)} className={`${ctl} max-w-[220px] ${errors.date ? err : ''}`} /></Row>
          <Row label="เวลาที่แจ้งเตือน" req><select aria-label="เวลาที่แจ้งเตือน" disabled={!admin} value={time} onChange={(e) => setTime(e.target.value)} className={`${ctl} max-w-[160px]`}>{times.map((x) => <option key={x}>{x}</option>)}</select></Row>
          <Row label="ช่วงเวลา (รอบการแจ้ง)"><Radios label="รอบการแจ้ง" value={repeat} disabled={!admin} options={repeats.map((r) => ({ key: r, label: r }))} onChange={setRepeat} /></Row>
          <Row label="ช่องทางการแจ้ง" req error={errors.chs}>
            <div className="flex flex-wrap gap-[18px] pt-[8px]">{channels.map((c) => <label key={c} className="flex cursor-pointer items-center gap-[8px] text-[13px]"><input type="checkbox" disabled={!admin} checked={chs.includes(c)} onChange={() => tog(chs, setChs, c)} className="size-[16px] accent-[#1f5ac8]" />{c}</label>)}</div>
          </Row>
        </Section>

        <div className="flex justify-end gap-[8px]">
          <Btn kind="ghost" onClick={() => navigate('/notify')}>ยกเลิก</Btn>
          <Btn onClick={save} disabled={!admin}>บันทึก</Btn>
        </div>
      </div>

      <Modal open={!!done} onClose={() => navigate('/notify')} title="บันทึกการแจ้งเตือนแล้ว" width="max-w-[440px]">
        <div className="flex flex-col items-center gap-[10px] text-center">
          <span className="flex size-[56px] items-center justify-center rounded-full bg-[#dff5e8] text-[#0f8a63]"><Ic d={NI.check} s={28} w={2.4} /></span>
          <p className="text-[13px] leading-[1.6] font-light text-gray-30">{done?.sent ? 'ส่งการแจ้งเตือนถึงผู้รับแล้ว' : 'ตั้งเวลาไว้แล้ว ระบบจะส่งตามวันและเวลาที่กำหนด'} ผู้รับเห็นได้ที่ “รายการแจ้งเตือนของฉัน”</p>
          <Link to="/notify" className="flex h-[38px] items-center rounded-[8px] bg-blue-00 px-[16px] text-[13px] font-medium text-white">ไปที่รายการแจ้งเตือน</Link>
        </div>
      </Modal>
    </div>
  )
}
