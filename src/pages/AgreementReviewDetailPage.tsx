import { useState } from 'react'
import { Link, useNavigate, useSearchParams } from 'react-router-dom'
import { Btn, Crumbs, GI, GPersonaSwitch, Gate, Ic, Row, Section, Title, ctl, err, page, ta } from '../components/agreement/Parts'
import { useToast } from '../components/leader/Parts'
import Modal from '../components/ui/Modal'
import { communityOrgs, dbdParty, employer, typeOf, type Party } from '../data/erpAgreement'
import { log, useContracts, useGPersona } from '../lib/agreementStore'

export const reasonTips = ['ข้อมูลคู่สัญญาถูกต้องตรงกับเอกสารจดทะเบียน', 'เลขผู้เสียภาษีไม่ตรงกับฐานข้อมูล DBD', 'ผู้ลงนามไม่มีอำนาจลงนามตามหนังสือรับรอง', 'ที่อยู่ไม่ครบถ้วน ต้องระบุเลขที่ ตำบล อำเภอ จังหวัด']

/** ข้อมูลสัญญารอตรวจสอบ — ตรวจข้อมูลผู้ว่าจ้าง/ผู้รับจ้างและให้เหตุผลประกอบ (book 3 §2.3.1.7, fig 2-124) */
export default function AgreementReviewDetailPage() {
  const all = useContracts()
  const me = useGPersona()
  const navigate = useNavigate()
  const [sp] = useSearchParams()
  const c = all.find((x) => x.id === Number(sp.get('id')))
  const [p, setP] = useState<Party>(c?.party ?? { name: '', address: '', taxId: '', signer: '', position: '', src: 'manual' })
  const [reason, setReason] = useState(c?.notes.find((n) => n.page === 0)?.text ?? '')
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [orgs, setOrgs] = useState(false)
  const [note, setNote] = useState('')
  const [toast, show] = useToast()
  const legal = me === 'legal'
  if (!c) return <div className={`${page} items-center`}><p className="text-[13px] text-gray-30">ไม่พบสัญญา <Link to="/agreement/review" className="text-blue-00 underline">กลับไปรายการ</Link></p></div>
  const set = (k: keyof Party, v: string) => setP({ ...p, [k]: v, src: 'manual' })
  const dbd = () => {
    const r = dbdParty(p.taxId)
    if (!r) { setErrors({ ...errors, taxId: 'ไม่พบเลขผู้เสียภาษีนี้ใน DBD' }); return }
    setP({ ...r, signer: p.signer, position: p.position || r.position }); setErrors({}); setNote('ตรวจสอบกับ DBD แล้ว ข้อมูลตรงกับที่จดทะเบียน')
  }
  const persist = (action: string) => {
    const notes = [...c.notes.filter((n) => n.page !== 0), ...(reason.trim() ? [{ page: 0, text: reason.trim() }] : [])]
    log(c.id, action, { party: { ...p, taxId: p.taxId.replace(/\D/g, '') }, notes })
  }
  const next = () => {
    const e: Record<string, string> = {}
    if (!reason.trim()) e.reason = 'กรุณาระบุเหตุผลหรือข้อสังเกตจากการตรวจสอบข้อมูลคู่สัญญา'
    if (!/^\d{13}$/.test(p.taxId.replace(/\D/g, ''))) e.taxId = 'เลขผู้เสียภาษีต้องมี 13 หลัก'
    if (!p.name.trim()) e.name = 'กรุณาระบุชื่อหน่วยงาน'
    setErrors(e)
    if (Object.keys(e).length) return
    persist('ตรวจสอบข้อมูลคู่สัญญา')
    navigate(`/agreement/review/check?id=${c.id}`)
  }

  return (
    <div className={`${page} items-center`}>
      <div className="flex w-full max-w-[900px] flex-col gap-[12px]">
        <Title back="/agreement/review" right={<GPersonaSwitch />}>ข้อมูลสัญญารอตรวจสอบ</Title>
        <Crumbs items={[{ label: 'หน้าแรก', to: '/agreement' }, { label: 'รายการสัญญารอตรวจสอบ', to: '/agreement/review' }, { label: c.no }]} />
        <Gate allowed={legal} need="เจ้าหน้าที่นิติกร" />
        <p className="flex flex-wrap items-center gap-[8px] rounded-[10px] bg-blue-bg px-[12px] py-[8px] text-[12px] text-blue-dark"><Ic d={GI.doc} s={15} /><b className="font-semibold">{c.no}</b> · {c.title} · {typeOf(c.type).label}</p>

        <Section title="ความเห็นประกอบการตรวจสอบ" tone="blue">
          <Row label="เหตุผลประกอบ" req error={errors.reason} hint="คลิกคำแนะนำเพื่อเติมข้อความอัตโนมัติ">
            <textarea aria-label="เหตุผลประกอบ" disabled={!legal} value={reason} onChange={(e) => setReason(e.target.value)} placeholder="ระบุข้อคิดเห็น ข้อสังเกต หรือเหตุผลในการตรวจสอบสัญญา" className={`${ta} ${errors.reason ? err : ''}`} />
            <div className="flex flex-wrap gap-[6px] pt-[4px]">{reasonTips.map((t) => <button key={t} type="button" disabled={!legal} onClick={() => setReason((r) => (r ? `${r}\n${t}` : t))} className="rounded-full border border-blue-20 bg-white px-[10px] py-[4px] text-[11px] text-blue-dark hover:bg-blue-bg disabled:opacity-40">{t}</button>)}</div>
          </Row>
        </Section>

        <Section title="ข้อมูลผู้ว่าจ้าง (พอช.)">
          <Row label="ชื่อหน่วยงาน"><input aria-label="ชื่อผู้ว่าจ้าง" readOnly value={employer.name} className={`${ctl} bg-gray-subtle text-gray-30`} /></Row>
          <Row label="เลขผู้เสียภาษี"><input aria-label="เลขผู้เสียภาษีผู้ว่าจ้าง" readOnly value={employer.taxId} className={`${ctl} max-w-[240px] bg-gray-subtle font-urbanist text-gray-30`} /></Row>
          <Row label="ผู้มีอำนาจลงนาม"><input aria-label="ผู้มีอำนาจลงนามผู้ว่าจ้าง" readOnly value={`${employer.signer} (${employer.position})`} className={`${ctl} bg-gray-subtle text-gray-30`} /></Row>
        </Section>

        <Section title="ข้อมูลผู้รับจ้าง / คู่สัญญา">
          <div className="flex flex-wrap gap-[8px]">
            <button type="button" disabled={!legal} onClick={dbd} className="flex h-[36px] items-center gap-[6px] rounded-[8px] border border-blue-00 px-[12px] text-[12px] font-medium text-blue-00 hover:bg-blue-bg disabled:opacity-40"><Ic d={GI.search} s={14} />ค้นหาข้อมูลจาก DBD</button>
            <button type="button" disabled={!legal} onClick={() => setOrgs(true)} className="flex h-[36px] items-center gap-[6px] rounded-[8px] border border-blue-00 px-[12px] text-[12px] font-medium text-blue-00 hover:bg-blue-bg disabled:opacity-40"><Ic d={GI.search} s={14} />ค้นหาข้อมูลจากองค์กรชุมชน</button>
          </div>
          {note && <p role="status" className="rounded-[8px] bg-[#e7f7ef] px-[10px] py-[6px] text-[12px] text-[#0f8a63]">{note}</p>}
          <Row label="เลขผู้เสียภาษี" error={errors.taxId}><input aria-label="เลขผู้เสียภาษี" disabled={!legal} inputMode="numeric" maxLength={13} value={p.taxId} onChange={(e) => set('taxId', e.target.value.replace(/\D/g, ''))} className={`${ctl} max-w-[260px] font-urbanist ${errors.taxId ? err : ''}`} /></Row>
          <Row label="ชื่อหน่วยงาน" error={errors.name}><input aria-label="ชื่อคู่สัญญา" disabled={!legal} value={p.name} onChange={(e) => set('name', e.target.value)} className={`${ctl} ${errors.name ? err : ''}`} /></Row>
          <Row label="ที่อยู่"><textarea aria-label="ที่อยู่คู่สัญญา" disabled={!legal} value={p.address} onChange={(e) => set('address', e.target.value)} className={`${ta} !min-h-[72px]`} /></Row>
          <Row label="ผู้มีอำนาจลงนาม"><input aria-label="ผู้มีอำนาจลงนามคู่สัญญา" disabled={!legal} value={p.signer} onChange={(e) => set('signer', e.target.value)} className={ctl} /></Row>
          <Row label="ตำแหน่ง"><input aria-label="ตำแหน่งผู้ลงนามคู่สัญญา" disabled={!legal} value={p.position} onChange={(e) => set('position', e.target.value)} className={ctl} /></Row>
        </Section>

        <div className="flex flex-wrap justify-end gap-[8px]">
          <Btn kind="ghost" onClick={() => navigate('/agreement/review')}>ยกเลิก</Btn>
          <Btn kind="outline" disabled={!legal} onClick={() => { persist('บันทึกร่างผลการตรวจสอบ'); show('บันทึกร่างแล้ว') }}>บันทึกร่าง</Btn>
          <Btn disabled={!legal} onClick={next}>ถัดไป</Btn>
        </div>
      </div>
      <Modal open={orgs} onClose={() => setOrgs(false)} title="ค้นหาจากองค์กรชุมชน" width="max-w-[560px]">
        <ul className="flex max-h-[50vh] flex-col gap-[8px] overflow-y-auto">
          {communityOrgs.map((o) => <li key={o.taxId}><button type="button" onClick={() => { setP(o); setOrgs(false); setNote('ดึงข้อมูลจากฐานข้อมูลองค์กรชุมชนแล้ว') }} className="flex w-full flex-col rounded-[10px] border border-gray-line-2 p-[12px] text-left hover:border-blue-20 hover:bg-blue-bg/50"><span className="text-[13px] font-semibold">{o.name}</span><span className="text-[11px] font-light text-gray-30">{o.address}</span></button></li>)}
        </ul>
      </Modal>
      {toast}
    </div>
  )
}
