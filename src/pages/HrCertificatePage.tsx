import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useToast } from '../components/leader/Parts'
import Select from '../components/ui/Select'
import { Btn, Crumbs, EmpInfo, Gate, HPersonaSwitch, Radios, Row, Section, Title, ctl, err, page } from '../components/hr/Parts'
import { certPurposes, signers } from '../data/erpHr'
import { submitReq, useHPersona } from '../lib/hrStore'

type CT = 'หนังสือรับรอง' | 'หนังสือส่งตัว'

/** ขอหนังสือรับรองและหนังสือส่งตัว (book 3 fig 2-29) — 2.1.6.1 ; goes to the signer at 2.1.6.6 */
export default function HrCertificatePage() {
  const me = useHPersona()
  const navigate = useNavigate()
  const [toast, show] = useToast()
  const [type, setType] = useState<CT>('หนังสือรับรอง')
  const [purpose, setPurpose] = useState('')
  const [to, setTo] = useState('')
  const [signer, setSigner] = useState(signers[0])
  const [errors, setErrors] = useState<Record<string, string>>({})
  const allowed = me === 'staff'
  const submit = () => {
    if (!allowed) return show('ต้องเป็นเจ้าหน้าที่ พอช.')
    const e: Record<string, string> = {}
    if (!purpose) e.purpose = 'กรุณาเลือกวัตถุประสงค์'
    if (!to.trim()) e.to = 'กรุณาระบุหน่วยงานผู้รับหนังสือ'
    setErrors(e)
    if (Object.keys(e).length) return show('กรุณากรอกข้อมูลให้ครบ')
    const r = submitReq({ kind: 'cert', certType: type, certPurpose: purpose, certTo: to.trim(), signer })
    show(`ยื่นขอ${type} ${r.no} แล้ว · แจ้งผู้ลงนาม ${signer.split(' · ')[0]}`)
    setTimeout(() => navigate('/hr'), 1300)
  }
  return (
    <div className={`${page} items-center`}>
      <div className="flex w-full max-w-[860px] flex-col gap-[12px]">
        <Title back="/hr" right={<HPersonaSwitch />}>ขอหนังสือรับรองและหนังสือส่งตัว</Title>
        <Crumbs items={[{ label: 'หน้าแรก', to: '/hr' }, { label: 'ขอหนังสือรับรองและหนังสือส่งตัว' }]} />
        <Gate allowed={allowed} need="เจ้าหน้าที่ พอช." />
        <Section title="ประเภทหนังสือ">
          <Row label="ประเภทหนังสือ"><Radios label="ประเภทหนังสือ" value={type} options={(['หนังสือรับรอง', 'หนังสือส่งตัว'] as CT[]).map((k) => ({ key: k, label: k }))} onChange={(k) => setType(k as CT)} /></Row>
        </Section>
        <EmpInfo title="ข้อมูลผู้ขอ" />
        <Section title="รายละเอียดหนังสือ">
          <Row label="วัตถุประสงค์" req error={errors.purpose}><Select label="วัตถุประสงค์" value={purpose} placeholder="เลือกวัตถุประสงค์" options={certPurposes.map((p) => ({ value: p, label: p }))} onChange={setPurpose} /></Row>
          <Row label="หน่วยงานผู้รับหนังสือ" req error={errors.to}><input aria-label="หน่วยงานผู้รับหนังสือ" placeholder="เช่น ธนาคาร / สถานทูต / โรงพยาบาล" className={`${ctl} ${errors.to ? err : ''}`} value={to} onChange={(e) => setTo(e.target.value)} /></Row>
        </Section>
        <Section title="ผู้ลงนามรับรอง">
          <Row label="ผู้ลงนามรับรอง"><Select label="ผู้ลงนามรับรอง" value={signer} options={signers.map((s) => ({ value: s, label: s }))} onChange={setSigner} /></Row>
        </Section>
        <div className="flex justify-end gap-[10px]"><Btn kind="ghost" onClick={() => navigate('/hr')}>ยกเลิก</Btn><Btn onClick={submit}>ยื่นขอรับหนังสือรับรอง</Btn></div>
      </div>
      {toast}
    </div>
  )
}
