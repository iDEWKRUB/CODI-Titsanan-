import { useState } from 'react'
import { Link, useNavigate, useSearchParams } from 'react-router-dom'
import DigitBoxes from '../components/community/DigitBoxes'
import { Btn, ContractViewer, Crumbs, GI, GPersonaSwitch, Gate, Ic, Panel, Radios, Row, Section, Title, err, page, ta } from '../components/agreement/Parts'
import { ContractTable } from '../components/agreement/Table'
import { useContractActions } from '../components/agreement/useActions'
import Modal from '../components/ui/Modal'
import { money, thDate, typeOf } from '../data/erpAgreement'
import { signDecision } from '../lib/agreementStore'

const OTP = '123456'

/** สัญญารอลงนาม — list for the signer + signing screen with OTP (book 3 §2.3.1.8, figs 2-125 – 2-126) */
export default function AgreementSignPage() {
  const a = useContractActions()
  const navigate = useNavigate()
  const [sp] = useSearchParams()
  const c = a.all.find((x) => x.id === Number(sp.get('id')))
  const [pick, setPick] = useState<'ok' | 'no'>('ok')
  const [note, setNote] = useState('')
  const [error, setError] = useState('')
  const [otp, setOtp] = useState(false)
  const [code, setCode] = useState('')
  const [otpErr, setOtpErr] = useState('')
  const [done, setDone] = useState<'ok' | 'no'>()
  const signer = a.me === 'signer'

  if (!c) {
    const rows = a.all.filter((x) => x.status === 'รอลงนาม')
    return (
      <div className={`${page} items-center`}>
        <div className="flex w-full max-w-[1100px] flex-col gap-[14px]">
          <Title right={<GPersonaSwitch />}>สัญญารอลงนาม</Title>
          <Crumbs items={[{ label: 'หน้าแรก', to: '/agreement' }, { label: 'งานบริหารจัดการสัญญา', to: '/agreement' }, { label: 'สัญญารอลงนาม' }]} />
          <Gate allowed={signer} need="ผู้มีอำนาจในการลงนาม" />
          <Panel title={`สัญญาที่ผ่านการตรวจสอบและรอลงนาม (${rows.length})`} label="รายการสัญญารอลงนาม">
            <ContractTable rows={rows} can={() => ({ edit: false, del: false })} onView={a.onView} onEdit={a.onEdit} onCopy={a.onCopy} onDelete={a.onDelete}
              extra={(x) => signer ? <Link to={`/agreement/sign?id=${x.id}`} aria-label={`ลงนาม ${x.no}`} className="flex h-[30px] items-center gap-[4px] rounded-[8px] bg-blue-00 px-[12px] text-[12px] font-medium text-white hover:brightness-110"><Ic d={GI.pen} s={13} />พิจารณาลงนาม</Link> : null}
              empty="ไม่มีสัญญาที่รอลงนาม" />
          </Panel>
        </div>
        {a.modals}
      </div>
    )
  }

  const t = typeOf(c.type)
  const pending = c.status === 'รอลงนาม'
  const submit = () => {
    if (pick === 'no' && note.trim().length < 5) { setError('กรุณาระบุเหตุผลที่ไม่อนุมัติ'); return }
    setError(''); setCode(''); setOtpErr(''); setOtp(true)
  }
  const confirm = () => {
    if (code !== OTP) { setOtpErr('รหัส OTP ไม่ถูกต้อง'); return }
    setOtp(false)
    signDecision(c.id, pick === 'ok', note)
    setDone(pick)
  }

  return (
    <div className={`${page} items-center`}>
      <div className="flex w-full max-w-[1100px] flex-col gap-[12px]">
        <Title back="/agreement/sign" right={<GPersonaSwitch />}>ลงนามสัญญา</Title>
        <Crumbs items={[{ label: 'หน้าแรก', to: '/agreement' }, { label: 'สัญญารอลงนาม', to: '/agreement/sign' }, { label: c.no }]} />
        <Gate allowed={signer} need="ผู้มีอำนาจในการลงนาม" />
        <div className="grid grid-cols-[minmax(0,1fr)_minmax(0,400px)] items-start gap-[16px] max-lg:grid-cols-1">
          <section aria-label="หนังสือสัญญา" className="rounded-[14px] border border-gray-line-2 bg-[#f5f8fd] p-[16px]">
            <ContractViewer key={`${c.id}${c.status}`} type={c.type} c={c} label={`${c.no} · ${t.label}`} />
            <div className="mt-[12px] flex justify-center"><button type="button" onClick={() => window.print()} className="flex h-[36px] items-center gap-[6px] rounded-[8px] border border-gray-line bg-white px-[14px] text-[12px] hover:border-gray-10">พิมพ์สัญญาเพื่อลงนามด้วยปากกา</button></div>
          </section>
          <div className="flex flex-col gap-[12px]">
            <Section title="สรุปสัญญา">
              <dl className="grid grid-cols-1 gap-[6px] text-[12px]">
                {[['เรื่อง', c.title], ['คู่สัญญา', c.party.name], ['ผู้ลงนามฝ่ายคู่สัญญา', c.party.signer], ['ระยะเวลา', `${thDate(c.start)} – ${thDate(c.end)}`], ['มูลค่า', c.value ? `${money(c.value)} บาท` : 'ไม่มีวงเงินผูกพัน']].map(([k, v]) => <div key={k} className="flex flex-col"><dt className="text-[11px] font-light text-gray-20">{k}</dt><dd className="font-medium">{v}</dd></div>)}
              </dl>
              {c.history.filter((h) => h.action.startsWith('ผ่าน')).map((h, i) => <p key={i} className="rounded-[8px] bg-[#e7f7ef] px-[10px] py-[6px] text-[11px] text-[#0f8a63]">ผ่านการตรวจสอบโดย {h.by}{h.note ? ` — ${h.note}` : ''}</p>)}
            </Section>
            {pending ? (
              <Section title="พิจารณาอนุมัติ / ไม่อนุมัติ" tone="blue">
                <Row label="ผลการพิจารณา" req><Radios label="ผลการพิจารณา" value={pick} disabled={!signer} options={[{ key: 'ok', label: 'อนุมัติและลงนาม' }, { key: 'no', label: 'ไม่อนุมัติ' }]} onChange={(k) => { setPick(k); setError('') }} /></Row>
                <Row label="เหตุผล" req={pick === 'no'} error={error} hint={pick === 'no' ? 'คำแนะนำ: ระบุสิ่งที่ต้องแก้ไขเพื่อให้ผู้จัดทำปรับปรุงได้ตรงจุด' : undefined}>
                  <textarea aria-label="เหตุผลประกอบการพิจารณา" disabled={!signer} value={note} onChange={(e) => { setNote(e.target.value); setError('') }} placeholder={pick === 'no' ? 'ระบุเหตุผลที่ไม่อนุมัติ' : 'หมายเหตุ (ไม่บังคับ)'} className={`${ta} !min-h-[80px] ${error ? err : ''}`} />
                </Row>
                <p className="text-[11px] font-light text-gray-20">เมื่อกดบันทึก ระบบจะส่งรหัสยืนยัน OTP 6 หลักเพื่อยืนยันตัวตนก่อนลงนามดิจิทัล</p>
                <div className="flex justify-end gap-[8px]"><Btn kind="ghost" onClick={() => navigate('/agreement/sign')}>ยกเลิก</Btn><Btn onClick={submit} disabled={!signer}>บันทึกผลเพื่อแจ้งเตือน</Btn></div>
              </Section>
            ) : <p className="rounded-[12px] border border-gray-line-2 bg-white p-[14px] text-[13px] font-light text-gray-30">สัญญานี้ดำเนินการแล้ว — สถานะ <b className="font-semibold text-black">{c.status}</b></p>}
          </div>
        </div>
      </div>

      <Modal open={otp} onClose={() => setOtp(false)} title="ยืนยันตัวตนด้วยรหัส OTP" width="max-w-[440px]">
        <p className="text-[13px] leading-[1.7] font-light text-gray-30">ระบบส่งรหัส OTP 6 หลักไปยังเบอร์โทรศัพท์ที่ลงทะเบียนไว้แล้ว กรอกรหัสเพื่อยืนยัน{pick === 'ok' ? 'การลงนามสัญญา' : 'ผลการพิจารณา'}</p>
        <div className="flex flex-col items-center gap-[8px]">
          <DigitBoxes value={code} groups={[6]} onChange={(v) => { setCode(v); setOtpErr('') }} label="รหัส OTP" invalid={!!otpErr} />
          {otpErr && <p role="alert" className="text-[12px] text-red-00">{otpErr}</p>}
          <p className="text-[11px] font-light text-gray-20">รหัสตัวอย่างสำหรับทดลอง: <b className="font-urbanist font-semibold">{OTP}</b></p>
        </div>
        <div className="flex justify-end gap-[8px]"><Btn kind="ghost" onClick={() => setOtp(false)}>ยกเลิก</Btn><Btn onClick={confirm} disabled={code.length < 6}>ยืนยัน</Btn></div>
      </Modal>
      <Modal open={!!done} onClose={() => navigate('/agreement/sign')} title={done === 'ok' ? 'ลงนามสัญญาแล้ว' : 'บันทึกผลไม่อนุมัติแล้ว'} width="max-w-[440px]">
        <div className="flex flex-col items-center gap-[10px] text-center">
          <span className={`flex size-[56px] items-center justify-center rounded-full ${done === 'ok' ? 'bg-[#dff5e8] text-[#0f8a63]' : 'bg-[#ffe3e3] text-[#c13232]'}`}><Ic d={done === 'ok' ? GI.pen : GI.x} s={26} w={2.2} /></span>
          <p className="font-urbanist text-[18px] font-semibold text-blue-dark">{c.no}</p>
          <p className="text-[13px] leading-[1.6] font-light text-gray-30">{done === 'ok' ? 'สัญญามีผลบังคับใช้และถูกบันทึกเข้าทะเบียนสัญญาแล้ว ระบบแจ้งเตือนผู้เกี่ยวข้องโดยอัตโนมัติ' : `ระบบแจ้งผลไปยัง ${c.resp} แล้ว`}</p>
          <div className="flex gap-[8px]"><Link to="/agreement/registry" className="flex h-[38px] items-center rounded-[8px] bg-blue-00 px-[16px] text-[13px] font-medium text-white">ไปที่ทะเบียนสัญญา</Link></div>
        </div>
      </Modal>
      {a.modals}
    </div>
  )
}
