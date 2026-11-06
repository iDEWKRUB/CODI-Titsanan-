import { useEffect, useMemo, useState } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import DigitBoxes from '../components/community/DigitBoxes'
import { useToast } from '../components/leader/Parts'
import Modal from '../components/ui/Modal'
import Select from '../components/ui/Select'
import PlanView from '../components/strategic/PlanView'
import { Btn, Crumbs, Gate, PersonaSwitch, Radios, Title, card, ctl, err, page } from '../components/strategic/Parts'
import { personas, planStatusLabel, type Plan } from '../data/strategic'
import { reviewPlan, usePersona, usePlans } from '../lib/strategicStore'

const OTP = '123456'
type Decision = 'approve' | 'reject' | 'return'
const hints: Record<Decision, string[]> = {
  approve: ['เห็นสมควรได้รับการอนุมัติ', 'สอดคล้องกับยุทธศาสตร์องค์กร'],
  reject: ['ไม่เหมาะสมกับการใช้งาน', 'ไม่สอดคล้องกับยุทธศาสตร์องค์กร'],
  return: ['วงเงินเกินที่ได้รับจัดสรร กรุณาปรับลด', 'กรุณาตรวจสอบรหัสงบประมาณและรายการซ้ำซ้อน'],
}
const planTone = (s: Plan['status']) => ({ draft: 'bg-gray-line text-gray-30', submitted: 'bg-[#dfe9ff] text-[#2b4fbf]', approved: 'bg-[#cdf3e4] text-[#0f8a63]', rejected: 'bg-[#fde2e2] text-[#c0262d]', returned: 'bg-[#fff1d6] text-[#a8650b]' })[s]

/** พิจารณาแผนประจำปี (book 3 fig 2-8, OTP fig 2-9) — 2.1.2.4 ; flow: book 1 §2.2.1.2 (ตรวจสอบและอนุมัติแผน → แจ้งเตือนผล) */
export default function StrategicReviewPage() {
  const me = usePersona()
  const all = usePlans()
  const [sp, setSp] = useSearchParams()
  const navigate = useNavigate()
  const [toast, show] = useToast()
  const submitted = useMemo(() => all.filter((x) => x.status === 'submitted'), [all])
  const sorted = useMemo(() => [...all].filter((x) => x.fiscalYear === '2568').sort((a, b) => (a.status === 'submitted' ? -1 : 0) - (b.status === 'submitted' ? -1 : 0) || b.id - a.id), [all])
  const id = Number(sp.get('plan')) || submitted[0]?.id || sorted[0]?.id
  const plan = all.find((x) => x.id === id)
  const [decision, setDecision] = useState<Decision>('approve')
  const [reason, setReason] = useState('')
  const [tried, setTried] = useState(false)
  const [otp, setOtp] = useState(false)
  const [code, setCode] = useState('')
  const [otpErr, setOtpErr] = useState('')
  const allowed = me === 'strat'
  const pending = plan?.status === 'submitted'
  useEffect(() => {
    setReason('')
    setTried(false)
  }, [id])

  const press = () => {
    setTried(true)
    if (!allowed) return show('ต้องเป็นเจ้าหน้าที่สำนักยุทธศาสตร์ฯ')
    if (decision !== 'approve' && !reason.trim()) return
    setCode('')
    setOtpErr('')
    setOtp(true)
  }
  const confirm = () => {
    if (code !== OTP) return setOtpErr('รหัส OTP ไม่ถูกต้อง')
    setOtp(false)
    if (plan) reviewPlan(plan.id, decision, reason.trim() || hints.approve[0], personas.strat.name)
    show(`${{ approve: 'อนุมัติ', reject: 'ไม่อนุมัติ', return: 'ส่งกลับแก้ไข' }[decision]}แผน ${plan?.no} แล้ว · แจ้งเตือนผลไปยัง ${plan?.office}`)
    const nxt = submitted.find((x) => x.id !== plan?.id)
    setTimeout(() => (nxt ? setSp({ plan: String(nxt.id) }) : navigate('/strategic')), 1000)
  }

  return (
    <div className={`${page} items-center`}>
      <div className="flex w-full max-w-[1000px] flex-col gap-[12px]">
        <Title back="/strategic" right={<PersonaSwitch />}>พิจารณาแผนประจำปี</Title>
        <Crumbs items={[{ label: 'หน้าแรก', to: '/strategic' }, { label: 'พิจารณาแผนประจำปี' }]} />
        <Gate allowed={allowed} need="เจ้าหน้าที่สำนักยุทธศาสตร์ นโยบายและแผน" />

        <div className="flex flex-wrap items-center gap-[10px]">
          <span className="text-[12px] font-light text-gray-30">แผนที่สำนักส่งเข้ามา {submitted.length > 0 ? <b className="font-semibold text-[#2b4fbf]">รอพิจารณา {submitted.length} แผน</b> : '(ไม่มีแผนรอพิจารณา)'}</span>
          <div className="w-[420px] max-md:w-full"><Select label="เลือกแผนที่จะพิจารณา" value={plan ? String(plan.id) : ''} options={sorted.map((x) => ({ value: String(x.id), label: `${x.no} · ${x.office} · ${planStatusLabel[x.status]}` }))} onChange={(v) => setSp({ plan: v })} /></div>
          {plan && <span className={`rounded-full px-[10px] py-[3px] text-[11px] font-medium ${planTone(plan.status)}`}>{planStatusLabel[plan.status]}</span>}
        </div>

        {!plan ? (
          <p className="rounded-[12px] border border-gray-line-2 bg-white py-[48px] text-center text-[13px] font-light text-gray-20">ไม่พบแผนประจำปี</p>
        ) : (
          <>
            <PlanView p={plan} readOnly />
            <section className={`${card} flex flex-col gap-[12px] border-blue-20 bg-blue-bg/70 p-[22px] max-sm:p-[14px]`} aria-label="การอนุมัติแผนงาน">
              <h2 className="text-[16px] font-semibold text-black">การอนุมัติแผนงาน</h2>
              {pending ? (
                <>
                  <Radios label="ผลการพิจารณา" value={decision} options={[{ key: 'approve', label: 'อนุมัติ' }, { key: 'reject', label: 'ไม่อนุมัติ' }, { key: 'return', label: 'ส่งกลับแก้ไข' }]} onChange={(v) => { setDecision(v); setReason('') }} disabled={!allowed} />
                  <div className="rounded-[10px] bg-white p-[14px]">
                    <label className="flex flex-col gap-[6px]">
                      <span className="text-[12px] font-semibold">เหตุผลประกอบการอนุมัติ / ไม่อนุมัติ / ส่งกลับแก้ไข{decision !== 'approve' && <span className="text-red-00"> *</span>}</span>
                      <input aria-label="เหตุผล" placeholder="เหตุผลประกอบการอนุมัติ / ไม่อนุมัติ / ส่งกลับแก้ไข" value={reason} onChange={(e) => setReason(e.target.value)} disabled={!allowed} className={`${ctl} ${tried && decision !== 'approve' && !reason.trim() ? err : ''}`} />
                      {tried && decision !== 'approve' && !reason.trim() && <span role="alert" className="text-[11px] text-red-00">กรุณาระบุเหตุผล</span>}
                    </label>
                    <div className="mt-[8px] flex flex-wrap gap-[6px]" aria-label="คำแนะนำเหตุผล">
                      {hints[decision].map((h) => <button key={h} type="button" disabled={!allowed} onClick={() => setReason(h)} className="rounded-full bg-blue-bg px-[10px] py-[3px] text-[10px] text-blue-dark hover:bg-blue-20 disabled:opacity-50">{h}</button>)}
                    </div>
                  </div>
                  <p className="text-[11px] font-light text-gray-20">ข้อมูลแผนแสดงจากสำนักเจ้าของแผนและแก้ไขไม่ได้ · เมื่อกดบันทึกระบบส่งรหัส OTP 6 หลักเพื่อยืนยันตัวตน</p>
                </>
              ) : (
                <p className="text-[13px] font-light text-gray-30">
                  แผนนี้ <b className="font-semibold">{planStatusLabel[plan.status]}</b>แล้ว {plan.review && <>โดย {plan.review.by} เมื่อ {plan.review.at}: “{plan.review.reason}”</>}
                </p>
              )}
            </section>
            <div className="flex justify-end gap-[8px]">
              <Btn kind="ghost" onClick={() => navigate('/strategic')}>ยกเลิก</Btn>
              <Btn onClick={press} disabled={!pending}>บันทึก</Btn>
            </div>
          </>
        )}
      </div>

      <Modal open={otp} onClose={() => setOtp(false)} title="ยืนยันตัวตนด้วยรหัส OTP" width="max-w-[440px]">
        <p className="text-[13px] leading-[1.7] font-light text-gray-30">ระบบส่งรหัส OTP 6 หลักไปยังเบอร์โทรศัพท์ที่ลงทะเบียนไว้แล้ว กรอกรหัสเพื่อยืนยันการ{{ approve: 'อนุมัติ', reject: 'ไม่อนุมัติ', return: 'ส่งกลับแก้ไข' }[decision]}แผน</p>
        <div className="flex flex-col items-center gap-[8px]">
          <DigitBoxes value={code} groups={[6]} onChange={(v) => { setCode(v); setOtpErr('') }} label="รหัส OTP" invalid={!!otpErr} />
          {otpErr && <p role="alert" className="text-[12px] text-red-00">{otpErr}</p>}
          <p className="text-[11px] font-light text-gray-20">รหัสตัวอย่างสำหรับทดลอง: <b className="font-urbanist font-semibold">{OTP}</b></p>
        </div>
        <div className="flex justify-end gap-[8px]">
          <Btn kind="ghost" onClick={() => setOtp(false)}>ยกเลิก</Btn>
          <Btn onClick={confirm} disabled={code.length < 6}>ยืนยัน</Btn>
        </div>
      </Modal>
      {toast}
    </div>
  )
}
