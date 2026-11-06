import { useEffect, useMemo, useState } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import DigitBoxes from '../components/community/DigitBoxes'
import { useToast } from '../components/leader/Parts'
import Modal from '../components/ui/Modal'
import Select from '../components/ui/Select'
import { Btn, Crumbs, Gate, GPersonaSwitch, GRadios, GSection, GStatus, ReportDoc, Title, ctl, err, page, ro } from '../components/funding/Parts'
import { OTP, expectedProfit, money, reasonChips } from '../data/erpFunding'
import { decideInv, useGPersona, useInvs } from '../lib/erpFundingStore'

/** รายงานการลงทุน (book 3 fig 2-27, OTP fig 2-28) — 2.1.5.5 ; the director reads the report, approves / rejects and confirms with a 6-digit OTP */
export default function FundingReportPage() {
  const me = useGPersona()
  const all = useInvs()
  const [sp] = useSearchParams()
  const navigate = useNavigate()
  const [toast, show] = useToast()
  const open = useMemo(() => all.filter((i) => i.status === 'draft' && !i.rejected), [all])
  const [id, setId] = useState(Number(sp.get('id')) || 0)
  const cur = all.find((i) => i.id === id)
  const [approve, setApprove] = useState<'yes' | 'no'>('yes')
  const [reason, setReason] = useState('')
  const [tried, setTried] = useState(false)
  const [otp, setOtp] = useState(false)
  const [code, setCode] = useState('')
  const [otpErr, setOtpErr] = useState('')
  const [ref] = useState(() => Math.random().toString(36).slice(2, 8).toUpperCase())
  const allowed = me === 'director'
  const done = !!cur && cur.status !== 'draft'

  useEffect(() => {
    if (!id && open[0]) setId(open[0].id)
  }, [id, open])
  useEffect(() => {
    setApprove(cur?.decision ? (cur.decision.approve ? 'yes' : 'no') : 'yes')
    setReason(cur?.decision?.reason ?? '')
    setTried(false)
    setCode('')
  }, [id]) // eslint-disable-line react-hooks/exhaustive-deps

  const profit = cur ? expectedProfit(cur) : 0
  const need = approve === 'no' && !reason.trim()
  const save = () => {
    if (!allowed) return show('ต้องเป็นผู้อำนวยการ')
    if (!cur) return show('ไม่มีรายการที่รอพิจารณา')
    setTried(true)
    if (need) return show('กรุณาระบุเหตุผลที่ไม่อนุมัติ')
    setCode(''); setOtpErr(''); setOtp(true)
  }
  const confirm = () => {
    if (!cur) return
    if (code !== OTP) return setOtpErr('รหัส OTP ไม่ถูกต้อง')
    setOtp(false)
    decideInv(cur.id, approve === 'yes', reason.trim() || 'เห็นสมควรได้รับการอนุมัติ')
    show(`${approve === 'yes' ? 'อนุมัติ' : 'ไม่อนุมัติ'}การลงทุน ${cur.name} · แจ้งเตือนเจ้าหน้าที่แล้ว`)
    setTimeout(() => navigate('/funding/list'), 1300)
  }

  return (
    <div className={`${page} items-center`}>
      <div className="flex w-full max-w-[860px] flex-col gap-[12px]">
        <Title back="/funding" right={<GPersonaSwitch />}>รายงานการลงทุน / หุ้นกู้</Title>
        <Crumbs items={[{ label: 'หน้าแรก', to: '/funding' }, { label: 'รายงานการลงทุน' }]} />
        <Gate allowed={allowed} need="ผู้อำนวยการ" />

        <div className="flex flex-wrap items-center gap-[10px]">
          <span className="text-[12px] font-semibold">รายการลงทุน</span>
          <div className="w-[420px] max-sm:w-full">
            <Select label="เลือกรายการลงทุน" value={cur ? String(cur.id) : ''} placeholder={open.length ? 'เลือกรายการ' : 'ไม่มีรายการที่รอพิจารณา'} options={(cur && done ? [cur, ...open] : open).map((i) => ({ value: String(i.id), label: `${i.name} · ${money(i.amount)} บาท` }))} onChange={(v) => setId(Number(v))} />
          </div>
          {cur && <GStatus s={cur.status} />}
          <span className="text-[12px] font-light text-gray-20">{`รอพิจารณา ${open.length} รายการ`}</span>
        </div>

        {cur ? (
          <>
            <GSection title="รายงานการลงทุน">
              <ReportDoc i={cur} profit={profit} />
              <div className="grid grid-cols-[1fr_190px_40px] items-center gap-[10px] max-sm:grid-cols-[1fr_auto]"><span className="text-[12px] font-semibold">จำนวนเงินลงทุน</span><input aria-label="จำนวนเงินลงทุน" readOnly className={`${ro} text-right font-urbanist`} value={money(cur.amount)} /><span className="text-[12px] font-light text-gray-20 max-sm:hidden">บาท</span></div>
              <h3 className="text-[14px] font-semibold">ข้อมูลคาดการณ์</h3>
              <div className="flex flex-col gap-[10px] rounded-[10px] bg-[#e8f5ff] p-[14px]">
                {([['กำไร / ขาดทุน', money(profit), 'บาท', 'text-[#0f8a63]'], ['รวมมูลค่า', money(cur.amount + profit), 'บาท', ''], ['ผลตอบแทนเฉลี่ย', String(cur.ret), '%', '']] as const).map(([k, v, u, t]) => (
                  <div key={k} className="grid grid-cols-[1fr_190px_40px] items-center gap-[10px] max-sm:grid-cols-[1fr_auto]"><span className="text-[12px] font-semibold">{k}</span><input aria-label={k} readOnly className={`${ro} text-right font-urbanist ${t}`} value={v} /><span className="text-[12px] font-light text-gray-20 max-sm:hidden">{u}</span></div>
                ))}
              </div>
            </GSection>

            <GSection title="พิจารณาอนุมัติ/ไม่อนุมัติ" tone="blue">
              {cur.rejected && !done && <p className="text-[12px] font-light text-[#c13232]">{`ครั้งก่อนไม่อนุมัติ: ${cur.rejected}`}</p>}
              {done && cur.decision && <p role="status" className="text-[12px] font-light text-gray-30">{`พิจารณาแล้วโดย ${cur.decision.by} เมื่อ ${cur.decision.at}`}</p>}
              <GRadios label="ผลการพิจารณา" value={approve} options={[{ key: 'yes', label: 'อนุมัติ' }, { key: 'no', label: 'ไม่อนุมัติ' }]} onChange={(k) => setApprove(k)} disabled={!allowed || done} />
              <div className="flex flex-col gap-[8px] rounded-[10px] bg-white p-[14px]">
                <p className="text-[12px] font-semibold">เหตุผลประกอบการอนุมัติ / ไม่อนุมัติ</p>
                <input aria-label="เหตุผลประกอบการอนุมัติ / ไม่อนุมัติ" placeholder="ชื่อกิจกรรม / เหตุผล" disabled={!allowed || done} className={`${ctl} ${tried && need ? err : ''}`} value={reason} onChange={(e) => setReason(e.target.value)} />
                {tried && need && <span role="alert" className="-mt-[4px] text-[11px] text-red-00">กรุณาระบุเหตุผลที่ไม่อนุมัติ</span>}
                <div className="flex flex-wrap gap-[6px]">
                  {reasonChips.map((s) => <button key={s} type="button" disabled={!allowed || done} onClick={() => setReason(s)} className="rounded-full bg-[#e8f5ff] px-[10px] py-[3px] text-[10px] text-blue-dark hover:bg-blue-20 disabled:opacity-50">{s}</button>)}
                </div>
              </div>
            </GSection>
            <div className="flex justify-end"><Btn onClick={save} disabled={done}>บันทึกและส่งแจ้งเตือน</Btn></div>
          </>
        ) : (
          <p className="rounded-[12px] border border-dashed border-gray-line bg-white py-[48px] text-center text-[13px] font-light text-gray-20">ยังไม่มีรายการลงทุนที่รอพิจารณา</p>
        )}
      </div>

      <Modal open={otp} onClose={() => setOtp(false)} title="กรุณายืนยันรหัส OTP 6 หลัก" width="max-w-[440px]">
        <p className="text-center text-[12px] font-light text-gray-30">{`รหัสอ้างอิง ${ref} · ระบบส่งรหัส OTP ไปยังเบอร์โทรศัพท์ที่ลงทะเบียนไว้`}</p>
        <div className="flex flex-col items-center gap-[8px]">
          <DigitBoxes value={code} groups={[6]} onChange={(v) => { setCode(v); setOtpErr('') }} label="รหัส OTP" invalid={!!otpErr} />
          {otpErr && <p role="alert" className="text-[12px] text-red-00">{otpErr}</p>}
          <p className="text-[11px] font-light text-gray-20">{'รหัสตัวอย่างสำหรับทดลอง: '}<b className="font-urbanist font-semibold">{OTP}</b></p>
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
