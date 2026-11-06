import { useEffect, useMemo, useState } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { useToast } from '../components/leader/Parts'
import Select from '../components/ui/Select'
import { Btn, Crumbs, Gate, HPersonaSwitch, OtpModal, RStatus, Radios, Row, Section, Title, ctl, err, page, ro } from '../components/hr/Parts'
import { fullName, hPersonas, thDate, type Employee, type HrReq } from '../data/erpHr'
import { decideReq, useEmps, useHPersona, useReqs } from '../lib/hrStore'

const chips = ['เห็นสมควรลงนาม', 'ข้อมูลไม่ครบถ้วน กรุณาตรวจสอบ']

/** the letter itself — page 1 = letter, page 2 = request details */
export function CertLetter({ r, e, pg }: { r: HrReq; e?: Employee; pg: number }) {
  if (!e) return null
  return pg === 1 ? (
    <article className="flex flex-col gap-[8px] text-[11px] leading-[1.8]">
      <p className="mx-auto w-fit rounded-[2px] border border-black px-[14px] py-[6px] text-[12px] font-semibold">สถาบันพัฒนาองค์กรชุมชน (องค์การมหาชน)</p>
      <p className="text-right font-light">{`ที่ พอช. ${r.no}`}</p>
      <p className="text-center text-[14px] font-semibold">{r.certType}</p>
      <p className="font-light">{`เรียน ${r.certTo}`}</p>
      <p className="indent-[28px] font-light">{r.certType === 'หนังสือรับรอง' ? `หนังสือฉบับนี้ให้ไว้เพื่อรับรองว่า ${fullName(e)} ตำแหน่ง ${e.position} สังกัด ${e.dept} เป็นพนักงาน${e.empType}ของสถาบันพัฒนาองค์กรชุมชน (องค์การมหาชน) ตั้งแต่วันที่ ${thDate(e.start)} จนถึงปัจจุบัน ได้รับเงินเดือนเดือนละ ${e.salary.toLocaleString('en-US')} บาท ทั้งนี้เพื่อ${r.certPurpose}` : `สถาบันพัฒนาองค์กรชุมชน (องค์การมหาชน) ขอส่งตัว ${fullName(e)} ตำแหน่ง ${e.position} สังกัด ${e.dept} เพื่อ${r.certPurpose} จึงเรียนมาเพื่อโปรดดำเนินการต่อไป`}</p>
      <div className="mt-[24px] ml-auto w-[200px] text-center"><p className="font-light">ขอแสดงความนับถือ</p><p className="mt-[18px] font-urbanist text-[15px] italic">{r.status === 'approved' ? (r.signer ?? '').split(' ')[0] : ' '}</p><p className="font-light">{`(${(r.signer ?? '').split(' · ')[0]})`}</p><p className="font-light">{(r.signer ?? '').split(' · ')[1]}</p></div>
    </article>
  ) : (
    <article className="flex flex-col gap-[6px] text-[11px]">
      <p className="text-[13px] font-semibold">รายละเอียดคำขอ</p>
      {[['เลขที่คำขอ', r.no], ['ยื่นเมื่อ', `${thDate(r.createdAt)} ${r.createdAt.slice(11)}`], ['ผู้ขอ', fullName(e)], ['รหัสพนักงาน', e.code], ['ประเภท', r.certType ?? ''], ['วัตถุประสงค์', r.certPurpose ?? ''], ['ผู้รับหนังสือ', r.certTo ?? ''], ['ผู้ลงนาม', r.signer ?? '']].map(([k, v]) => <p key={k} className="flex gap-[8px] border-b border-gray-line-2 py-[4px]"><span className="w-[100px] shrink-0 font-semibold">{k}</span><span className="font-light">{v}</span></p>)}
    </article>
  )
}

/** ลงนามหนังสือรับรอง (book 3 fig 2-34, OTP fig 2-35) — 2.1.6.6 */
export default function HrSignPage() {
  const me = useHPersona()
  const all = useReqs()
  const people = useEmps()
  const [sp] = useSearchParams()
  const navigate = useNavigate()
  const [toast, show] = useToast()
  const open = useMemo(() => all.filter((r) => r.kind === 'cert' && r.status === 'submitted'), [all])
  const [id, setId] = useState(Number(sp.get('id')) || 0)
  const cur = all.find((r) => r.id === id)
  const emp = people.find((e) => e.id === cur?.empId)
  const [approve, setApprove] = useState<'y' | 'n'>('y')
  const [reason, setReason] = useState('')
  const [tried, setTried] = useState(false)
  const [otp, setOtp] = useState(false)
  const [pg, setPg] = useState(1)
  const allowed = me === 'head'
  const done = !!cur && cur.status !== 'submitted'
  useEffect(() => { if (!id && open[0]) setId(open[0].id) }, [id, open])
  useEffect(() => { setApprove('y'); setReason(cur?.decision?.reason ?? ''); setTried(false); setPg(1) }, [id]) // eslint-disable-line react-hooks/exhaustive-deps
  const need = approve === 'n' && !reason.trim()
  const sign = () => {
    if (!allowed) return show('ต้องเป็นหัวหน้างาน/ผู้มีอำนาจลงนาม')
    if (!cur) return show('ไม่มีคำขอที่รอลงนาม')
    setTried(true)
    if (need) return show('กรุณาระบุเหตุผลที่ไม่อนุมัติ')
    setOtp(true)
  }
  const confirm = () => {
    if (!cur) return
    setOtp(false)
    decideReq(cur.id, approve === 'y', reason.trim() || 'เห็นสมควรลงนาม', hPersonas.head.name)
    show(`${approve === 'y' ? 'ลงนามอนุมัติ' : 'ไม่อนุมัติ'} ${cur.no} · แจ้งผู้ขอแล้ว`)
    setTimeout(() => navigate('/hr'), 1300)
  }
  return (
    <div className={`${page} items-center`}>
      <div className="flex w-full max-w-[860px] flex-col gap-[12px]">
        <Title back="/hr" right={<HPersonaSwitch />}>พิจารณาอนุมัติหนังสือรับรอง</Title>
        <Crumbs items={[{ label: 'หน้าแรก', to: '/hr' }, { label: 'ลงนามหนังสือรับรอง' }]} />
        <Gate allowed={allowed} need="หัวหน้างาน" />
        <div className="flex flex-wrap items-center gap-[10px]">
          <span className="text-[12px] font-semibold">คำขอ</span>
          <div className="w-[420px] max-sm:w-full"><Select label="เลือกคำขอที่รอลงนาม" value={cur ? String(cur.id) : ''} placeholder={open.length ? 'เลือกคำขอ' : 'ไม่มีคำขอที่รอลงนาม'} options={(cur && done ? [cur, ...open] : open).map((r) => ({ value: String(r.id), label: `${r.no} · ${r.certType} · ${fullName(people.find((e) => e.id === r.empId) ?? people[0])}` }))} onChange={(v) => setId(Number(v))} /></div>
          {cur && <RStatus s={cur.status} />}
          <span className="text-[12px] font-light text-gray-20">{`รอลงนาม ${open.length} ฉบับ`}</span>
        </div>
        {cur && emp ? (
          <>
            <Section title="ข้อมูลขอหนังสือรับรอง">
              <Row label="ประเภทหนังสือ"><input aria-label="ประเภทหนังสือ" readOnly className={ro} value={cur.certType} /></Row>
              <Row label="ชื่อ-นามสกุล"><input aria-label="ชื่อผู้ขอ" readOnly className={ro} value={fullName(emp)} /></Row>
              <Row label="ตำแหน่ง / สำนัก"><input aria-label="ตำแหน่งผู้ขอ" readOnly className={ro} value={`${emp.position} · ${emp.dept}`} /></Row>
              <Row label="วัตถุประสงค์"><input aria-label="วัตถุประสงค์" readOnly className={ro} value={`${cur.certPurpose} · ${cur.certTo}`} /></Row>
            </Section>
            <Section title="เอกสารหนังสือรับรอง">
              <div className="rounded-[10px] bg-[#e8f5ff] p-[14px]">
                <div className="flex justify-center bg-[#a7b0b6]"><div className="min-h-[380px] w-full max-w-[460px] bg-white px-[24px] py-[22px]"><CertLetter r={cur} e={emp} pg={pg} /></div></div>
                <div className="mt-[8px] flex items-center justify-center gap-[10px] text-[12px] font-semibold">
                  <button type="button" aria-label="หน้าก่อนหน้า" disabled={pg === 1} onClick={() => setPg(1)} className="px-[6px] disabled:opacity-30">‹</button>
                  <button type="button" aria-label="หน้าถัดไป" disabled={pg === 2} onClick={() => setPg(2)} className="px-[6px] disabled:opacity-30">›</button>
                  <span className="font-urbanist">{`${pg} / 2 หน้า`}</span>
                </div>
              </div>
            </Section>
            <Section title="พิจารณาอนุมัติ/ไม่อนุมัติ" tone="blue">
              {done && cur.decision && <p role="status" className="text-[12px] font-light text-gray-30">{`พิจารณาแล้วโดย ${cur.decision.by} เมื่อ ${cur.decision.at}`}</p>}
              <Radios label="ผลการพิจารณา" value={approve} options={[{ key: 'y', label: 'อนุมัติ' }, { key: 'n', label: 'ไม่อนุมัติ' }]} onChange={(k) => setApprove(k as 'y' | 'n')} disabled={!allowed || done} />
              <div className="flex flex-col gap-[8px] rounded-[10px] bg-white p-[14px]">
                <p className="text-[12px] font-semibold">เหตุผลประกอบการอนุมัติ / ไม่อนุมัติ</p>
                <input aria-label="เหตุผลประกอบการอนุมัติ / ไม่อนุมัติ" disabled={!allowed || done} className={`${ctl} ${tried && need ? err : ''}`} value={reason} onChange={(e) => setReason(e.target.value)} />
                {tried && need && <span role="alert" className="text-[11px] text-red-00">กรุณาระบุเหตุผลที่ไม่อนุมัติ</span>}
                <div className="flex flex-wrap gap-[6px]">{chips.map((c) => <button key={c} type="button" disabled={!allowed || done} onClick={() => setReason(c)} className="rounded-full bg-[#e8f5ff] px-[10px] py-[3px] text-[10px] text-blue-dark hover:bg-blue-20 disabled:opacity-50">{c}</button>)}</div>
              </div>
            </Section>
            <div className="flex justify-end gap-[10px]"><Btn kind="ghost" onClick={() => navigate('/hr')}>ยกเลิก</Btn><Btn onClick={sign} disabled={done}>ลงนามอนุมัติ</Btn></div>
          </>
        ) : <p className="rounded-[12px] border border-dashed border-gray-line bg-white py-[48px] text-center text-[13px] font-light text-gray-20">ยังไม่มีคำขอที่รอลงนาม</p>}
      </div>
      <OtpModal open={otp} onClose={() => setOtp(false)} onOk={confirm} what={approve === 'y' ? 'ลงนามอนุมัติหนังสือ' : 'บันทึกผลไม่อนุมัติ'} />
      {toast}
    </div>
  )
}
