import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useToast } from '../components/leader/Parts'
import { Btn, Crumbs, EmpInfo, FileField, Gate, HPersonaSwitch, Radios, Row, Section, Title, ctl, err, page, ta } from '../components/hr/Parts'
import { leaveQuota, leaveTypes, todayIso, workDays } from '../data/erpHr'
import { leaveUsed, submitReq, useHPersona, useReqs } from '../lib/hrStore'

/** แจ้งลา (book 3 fig 2-33) — 2.1.6.5 */
export default function HrLeavePage() {
  const me = useHPersona()
  useReqs()
  const navigate = useNavigate()
  const [toast, show] = useToast()
  const [type, setType] = useState(leaveTypes[0])
  const [from, setFrom] = useState(todayIso())
  const [to, setTo] = useState(todayIso())
  const [detail, setDetail] = useState('')
  const [note, setNote] = useState('')
  const [evidence, setEvidence] = useState('')
  const [errors, setErrors] = useState<Record<string, string>>({})
  const allowed = me === 'staff'
  const days = workDays(from, to)
  const used = leaveUsed(type, from || todayIso())
  const left = leaveQuota[type] - used
  const submit = () => {
    if (!allowed) return show('ต้องเป็นเจ้าหน้าที่ พอช.')
    const e: Record<string, string> = {}
    if (!from || !to) e.date = 'กรุณาระบุวันที่ขอลา'
    else if (to < from) e.date = 'วันที่สิ้นสุดต้องไม่ก่อนวันที่เริ่มลา'
    else if (!days) e.date = 'ช่วงวันที่เลือกเป็นวันหยุดทั้งหมด'
    else if (days > left) e.date = `${type}คงเหลือ ${left} วัน ไม่พอสำหรับ ${days} วันทำการ`
    if (!detail.trim()) e.detail = 'กรุณาระบุรายละเอียดการลา'
    if (type === 'ลาป่วย' && days >= 3 && !evidence.trim()) e.evidence = 'ลาป่วยตั้งแต่ 3 วันขึ้นไปต้องแนบใบรับรองแพทย์'
    setErrors(e)
    if (Object.keys(e).length) return show('กรุณาตรวจสอบข้อมูล')
    const r = submitReq({ kind: 'leave', leaveType: type, from, to, days, detail: detail.trim(), note, evidence })
    show(`ยื่นขอ${type} ${r.no} ${days} วัน · แจ้งหัวหน้างานแล้ว`)
    setTimeout(() => navigate('/hr'), 1300)
  }
  return (
    <div className={`${page} items-center`}>
      <div className="flex w-full max-w-[860px] flex-col gap-[12px]">
        <Title back="/hr" right={<HPersonaSwitch />}>แจ้งลา</Title>
        <Crumbs items={[{ label: 'หน้าแรก', to: '/hr' }, { label: 'แจ้งลา' }]} />
        <Gate allowed={allowed} need="เจ้าหน้าที่ พอช." />
        <EmpInfo />
        <Section title="รายละเอียดการลา">
          <Row label="ประเภทการลา"><Radios label="ประเภทการลา" value={type} options={leaveTypes.map((k) => ({ key: k, label: k }))} onChange={setType} /></Row>
          <div className="grid grid-cols-4 gap-[8px] max-sm:grid-cols-2">
            {leaveTypes.map((t) => { const l = leaveQuota[t] - leaveUsed(t, from || todayIso()); return <div key={t} className={`rounded-[10px] px-[12px] py-[8px] ${t === type ? 'bg-blue-00 text-white' : 'bg-blue-bg text-blue-dark'}`}><p className="text-[11px]">{t}</p><p className="font-urbanist text-[18px] font-semibold" aria-label={`${t}คงเหลือ`}>{l}<span className="ml-[4px] text-[11px] font-normal">{`/ ${leaveQuota[t]} วัน`}</span></p></div> })}
          </div>
          <Row label="วันที่ขอลา" req error={errors.date}>
            <div className="flex items-center gap-[8px] max-sm:flex-col max-sm:items-stretch">
              <input type="date" aria-label="วันที่เริ่มลา" className={`${ctl} ${errors.date ? err : ''}`} value={from} onChange={(e) => setFrom(e.target.value)} />
              <span className="text-[12px] text-gray-20">ถึง</span>
              <input type="date" aria-label="วันที่สิ้นสุดการลา" className={`${ctl} ${errors.date ? err : ''}`} value={to} onChange={(e) => setTo(e.target.value)} />
            </div>
          </Row>
          <p className="text-[12px] text-gray-30">{'จำนวนวันลา (วันทำการ) '}<b className="font-urbanist" aria-label="จำนวนวันลา">{days}</b>{' วัน'}</p>
          <Row label="รายละเอียดการลา" req error={errors.detail}><textarea aria-label="รายละเอียดการลา" className={`${ta} ${errors.detail ? err : ''}`} value={detail} onChange={(e) => setDetail(e.target.value)} /></Row>
          <Row label="หมายเหตุเพิ่มเติม"><input aria-label="หมายเหตุเพิ่มเติม" className={ctl} value={note} onChange={(e) => setNote(e.target.value)} /></Row>
          <Row label="หลักฐานประกอบการลา"><FileField label="หลักฐานประกอบการลา" value={evidence} onChange={setEvidence} error={errors.evidence} /></Row>
        </Section>
        <div className="flex justify-end gap-[10px]"><Btn kind="ghost" onClick={() => navigate('/hr')}>ยกเลิก</Btn><Btn onClick={submit}>ยื่นขอลา</Btn></div>
      </div>
      {toast}
    </div>
  )
}
