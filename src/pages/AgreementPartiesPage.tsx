import { useState } from 'react'
import { Link, useNavigate, useSearchParams } from 'react-router-dom'
import { Btn, Crumbs, GI, GPersonaSwitch, Gate, Ic, Row, Section, Steps, Title, ctl, err, page, ta } from '../components/agreement/Parts'
import { useToast } from '../components/leader/Parts'
import Modal from '../components/ui/Modal'
import { communityOrgs, dbdParty, employer, nextContractNo, stamp, typeOf, type Contract, type Party, type TypeKey } from '../data/erpAgreement'
import { contracts, gWho, useContracts, useGPersona } from '../lib/agreementStore'

const empty: Party = { name: '', address: '', taxId: '', signer: '', position: '', src: 'manual' }

/** สร้างสัญญาฉบับใหม่ — step 2: ข้อมูลผู้ว่าจ้างและผู้รับจ้าง (book 3 §2.3.1.3, fig 2-119) */
export default function AgreementPartiesPage() {
  const all = useContracts()
  const me = useGPersona()
  const navigate = useNavigate()
  const [sp] = useSearchParams()
  const edit = all.find((c) => c.id === Number(sp.get('id')))
  const type = (edit?.type ?? sp.get('type') ?? 'hire') as TypeKey
  const [p, setP] = useState<Party>(edit?.party ?? empty)
  const [f, setF] = useState({ title: edit?.title ?? '', purpose: edit?.purpose ?? '', value: edit?.value ? String(edit.value) : '', start: edit?.start ?? '', end: edit?.end ?? '', owner: edit?.owner ?? 'สำนักบริหารงานกลาง' })
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [orgs, setOrgs] = useState(false)
  const [oq, setOq] = useState('')
  const [done, setDone] = useState<{ no: string; sent: boolean }>()
  const [note, setNote] = useState('')
  const [toast, show] = useToast()
  const set = (k: keyof Party, v: string) => setP({ ...p, [k]: v, src: 'manual' })

  const dbd = () => {
    const r = dbdParty(p.taxId)
    if (!r) { setNote(''); setErrors({ ...errors, taxId: 'ไม่พบเลขผู้เสียภาษีนี้ในฐานข้อมูล DBD (ลอง 0105556012345 หรือ 0105548098765)' }); return }
    setP({ ...r, signer: p.signer || r.signer, position: p.position || r.position })
    setErrors({ ...errors, taxId: '' })
    setNote('ดึงข้อมูลจากกรมพัฒนาธุรกิจการค้า (DBD) แล้ว กรุณาระบุผู้มีอำนาจลงนาม')
  }
  const pickOrg = (o: Party) => { setP(o); setOrgs(false); setNote('ดึงข้อมูลจากฐานข้อมูลองค์กรชุมชนแล้ว'); setErrors({}) }

  const save = (send: boolean) => {
    const e: Record<string, string> = {}
    if (!f.title.trim()) e.title = 'กรุณาระบุชื่อเรื่องสัญญา'
    if (send) {
      if (!p.name.trim()) e.name = 'กรุณาระบุชื่อหน่วยงาน/คู่สัญญา'
      if (!p.address.trim()) e.address = 'กรุณาระบุที่อยู่'
      if (!/^\d{13}$/.test(p.taxId.replace(/\D/g, ''))) e.taxId = 'เลขผู้เสียภาษีต้องมี 13 หลัก'
      if (!p.signer.trim()) e.signer = 'กรุณาระบุผู้มีอำนาจลงนาม'
      if (!p.position.trim()) e.position = 'กรุณาระบุตำแหน่ง'
      if (!f.start) e.start = 'กรุณาเลือกวันเริ่มต้นสัญญา'
      if (!f.end) e.end = 'กรุณาเลือกวันสิ้นสุดสัญญา'
      else if (f.start && f.end < f.start) e.end = 'วันสิ้นสุดต้องไม่ก่อนวันเริ่มต้น'
      if (type !== 'mou' && !(Number(f.value) > 0)) e.value = 'กรุณาระบุมูลค่าสัญญา (MOU ไม่ต้องระบุ)'
    }
    setErrors(e)
    if (Object.keys(e).length) return
    const at = stamp()
    const base = { title: f.title.trim(), type, party: { ...p, taxId: p.taxId.replace(/\D/g, '') }, purpose: f.purpose.trim(), value: Number(f.value) || 0, start: f.start, end: f.end, owner: f.owner, updatedAt: at }
    const action = send ? 'ส่งตรวจสอบ' : 'บันทึกร่าง'
    const status = send ? ('รอตรวจสอบ' as const) : ('ร่าง' as const)
    if (edit) {
      contracts.save({ ...edit, ...base, status, history: [...edit.history, { at, by: gWho(), action }] })
      setDone({ no: edit.no, sent: send })
    } else {
      const c: Contract = { id: contracts.next(), no: nextContractNo(all), ...base, status, signDate: '', resp: gWho(), file: '', createdAt: at, notes: [], fromRegistry: false, history: [{ at, by: gWho(), action: 'สร้างสัญญาใหม่' }, { at, by: gWho(), action }] }
      contracts.save(c)
      setDone({ no: c.no, sent: send })
    }
    if (!send) show('บันทึกร่างแล้ว')
  }

  const orgList = communityOrgs.filter((o) => !oq.trim() || `${o.name} ${o.taxId}`.includes(oq.trim()))

  return (
    <div className={`${page} items-center`}>
      <div className="flex w-full max-w-[900px] flex-col gap-[12px]">
        <Title back="/agreement/new" right={<GPersonaSwitch />}>{edit ? 'แก้ไขสัญญา' : 'สร้างสัญญาฉบับใหม่'}</Title>
        <Crumbs items={[{ label: 'หน้าแรก', to: '/agreement' }, { label: 'งานบริหารจัดการสัญญา', to: '/agreement' }, { label: 'สร้างสัญญาฉบับใหม่' }]} />
        <Gate allowed={me === 'staff'} need="เจ้าหน้าที่ผู้รับผิดชอบ" />
        <Steps step={2} />
        <p className="rounded-[10px] bg-blue-bg px-[12px] py-[8px] text-[12px] text-blue-dark">ประเภทสัญญา: <b className="font-semibold">{typeOf(type).label}</b> <Link to="/agreement/new" className="ml-[6px] underline">เปลี่ยนประเภท</Link></p>

        <Section title="ข้อมูลผู้ว่าจ้าง (พอช.)">
          <p className="-mt-[6px] text-[11px] font-light text-gray-20">ข้อมูลพื้นฐานของ พอช. ไม่สามารถแก้ไขได้</p>
          <Row label="ชื่อหน่วยงาน"><input aria-label="ชื่อผู้ว่าจ้าง" readOnly value={employer.name} className={`${ctl} bg-gray-subtle text-gray-30`} /></Row>
          <Row label="ที่อยู่"><input aria-label="ที่อยู่ผู้ว่าจ้าง" readOnly value={employer.address} className={`${ctl} bg-gray-subtle text-gray-30`} /></Row>
          <Row label="เลขผู้เสียภาษี"><input aria-label="เลขผู้เสียภาษีผู้ว่าจ้าง" readOnly value={employer.taxId} className={`${ctl} max-w-[240px] bg-gray-subtle font-urbanist text-gray-30`} /></Row>
          <Row label="ผู้มีอำนาจลงนาม"><input aria-label="ผู้มีอำนาจลงนามผู้ว่าจ้าง" readOnly value={`${employer.signer} (${employer.position})`} className={`${ctl} bg-gray-subtle text-gray-30`} /></Row>
        </Section>

        <Section title="ข้อมูลผู้รับจ้าง / คู่สัญญา">
          <div className="flex flex-wrap gap-[8px]">
            <button type="button" onClick={dbd} className="flex h-[36px] items-center gap-[6px] rounded-[8px] border border-blue-00 px-[12px] text-[12px] font-medium text-blue-00 hover:bg-blue-bg"><Ic d={GI.search} s={14} />ค้นหาข้อมูลจาก DBD</button>
            <button type="button" onClick={() => { setOrgs(true); setOq('') }} className="flex h-[36px] items-center gap-[6px] rounded-[8px] border border-blue-00 px-[12px] text-[12px] font-medium text-blue-00 hover:bg-blue-bg"><Ic d={GI.search} s={14} />ค้นหาข้อมูลจากองค์กรชุมชน</button>
          </div>
          {note && <p role="status" className="flex items-center gap-[6px] rounded-[8px] bg-[#e7f7ef] px-[10px] py-[6px] text-[12px] text-[#0f8a63]"><Ic d={GI.check} s={14} w={2.4} />{note}</p>}
          <Row label="เลขผู้เสียภาษี" req error={errors.taxId} hint="กรอกแล้วกด “ค้นหาข้อมูลจาก DBD” เพื่อดึงชื่อและที่อยู่อัตโนมัติ"><input aria-label="เลขผู้เสียภาษี" inputMode="numeric" maxLength={13} value={p.taxId} onChange={(e) => set('taxId', e.target.value.replace(/\D/g, ''))} className={`${ctl} max-w-[260px] font-urbanist ${errors.taxId ? err : ''}`} /></Row>
          <Row label="ชื่อหน่วยงาน / คู่สัญญา" req error={errors.name}><input aria-label="ชื่อคู่สัญญา" value={p.name} onChange={(e) => set('name', e.target.value)} className={`${ctl} ${errors.name ? err : ''}`} /></Row>
          <Row label="ที่อยู่" req error={errors.address}><textarea aria-label="ที่อยู่คู่สัญญา" value={p.address} onChange={(e) => set('address', e.target.value)} className={`${ta} !min-h-[72px] ${errors.address ? err : ''}`} /></Row>
          <Row label="ผู้มีอำนาจลงนาม" req error={errors.signer}><input aria-label="ผู้มีอำนาจลงนามคู่สัญญา" value={p.signer} onChange={(e) => set('signer', e.target.value)} className={`${ctl} ${errors.signer ? err : ''}`} /></Row>
          <Row label="ตำแหน่ง" req error={errors.position}><input aria-label="ตำแหน่งผู้ลงนามคู่สัญญา" value={p.position} onChange={(e) => set('position', e.target.value)} className={`${ctl} ${errors.position ? err : ''}`} /></Row>
        </Section>

        <Section title="สาระสำคัญของสัญญา" action={<span className="text-[11px] font-light text-gray-20">ข้อมูลเพิ่มเติมจากผู้ออกแบบ</span>}>
          <Row label="เรื่อง" req error={errors.title}><input aria-label="เรื่อง" placeholder="เช่น สัญญาจ้างเหมาปรับปรุงห้องประชุม" value={f.title} onChange={(e) => setF({ ...f, title: e.target.value })} className={`${ctl} ${errors.title ? err : ''}`} /></Row>
          <Row label="วัตถุประสงค์"><textarea aria-label="วัตถุประสงค์ของสัญญา" value={f.purpose} onChange={(e) => setF({ ...f, purpose: e.target.value })} className={`${ta} !min-h-[72px]`} /></Row>
          <Row label="มูลค่าสัญญา (บาท)" req={type !== 'mou'} error={errors.value}><input aria-label="มูลค่าสัญญา" inputMode="decimal" value={f.value} onChange={(e) => setF({ ...f, value: e.target.value.replace(/[^\d.]/g, '') })} className={`${ctl} max-w-[220px] text-right font-urbanist ${errors.value ? err : ''}`} /></Row>
          <Row label="วันเริ่มต้น" req error={errors.start}><input type="date" aria-label="วันเริ่มต้นสัญญา" value={f.start} onChange={(e) => setF({ ...f, start: e.target.value })} className={`${ctl} max-w-[220px] ${errors.start ? err : ''}`} /></Row>
          <Row label="วันสิ้นสุด" req error={errors.end}><input type="date" aria-label="วันสิ้นสุดสัญญา" min={f.start} value={f.end} onChange={(e) => setF({ ...f, end: e.target.value })} className={`${ctl} max-w-[220px] ${errors.end ? err : ''}`} /></Row>
          <Row label="หน่วยงานเจ้าของสัญญา"><input aria-label="หน่วยงานเจ้าของสัญญา" value={f.owner} onChange={(e) => setF({ ...f, owner: e.target.value })} className={ctl} /></Row>
        </Section>

        <div className="flex flex-wrap justify-end gap-[8px]">
          <Btn kind="ghost" onClick={() => navigate('/agreement')}>ยกเลิก</Btn>
          <Btn kind="outline" onClick={() => save(false)} disabled={me !== 'staff'}>บันทึกร่าง</Btn>
          <Btn onClick={() => save(true)} disabled={me !== 'staff'}>ถัดไป (ส่งตรวจสอบ)</Btn>
        </div>
      </div>

      <Modal open={orgs} onClose={() => setOrgs(false)} title="ค้นหาจากองค์กรชุมชน" width="max-w-[560px]">
        <div className="flex flex-col gap-[10px]">
          <label className="flex h-[40px] items-center gap-[8px] rounded-[8px] border border-gray-line px-[10px] text-gray-20 focus-within:border-blue-00"><Ic d={GI.search} /><input aria-label="ค้นหาองค์กรชุมชน" placeholder="ชื่อองค์กรหรือเลขผู้เสียภาษี" value={oq} onChange={(e) => setOq(e.target.value)} className="min-w-0 flex-1 text-[13px] text-black outline-none" /></label>
          <ul className="flex max-h-[50vh] flex-col gap-[8px] overflow-y-auto">
            {orgList.map((o) => (
              <li key={o.taxId}><button type="button" onClick={() => pickOrg(o)} className="flex w-full flex-col rounded-[10px] border border-gray-line-2 p-[12px] text-left hover:border-blue-20 hover:bg-blue-bg/50"><span className="text-[13px] font-semibold">{o.name}</span><span className="text-[11px] font-light text-gray-30">{o.address}</span><span className="text-[11px] font-light text-gray-20">เลขผู้เสียภาษี {o.taxId} · {o.signer} ({o.position})</span></button></li>
            ))}
            {!orgList.length && <li className="py-[20px] text-center text-[13px] font-light text-gray-20">ไม่พบองค์กรชุมชน</li>}
          </ul>
        </div>
      </Modal>

      <Modal open={!!done} onClose={() => navigate('/agreement')} title={done?.sent ? 'ส่งตรวจสอบแล้ว' : 'บันทึกร่างแล้ว'} width="max-w-[440px]">
        <div className="flex flex-col items-center gap-[10px] text-center">
          <span className="flex size-[56px] items-center justify-center rounded-full bg-[#dff5e8] text-[#0f8a63]"><Ic d={GI.check} s={28} w={2.4} /></span>
          <p className="font-urbanist text-[18px] font-semibold text-blue-dark">{done?.no}</p>
          <p className="text-[13px] leading-[1.6] font-light text-gray-30">{done?.sent ? 'ระบบแจ้งเตือนเจ้าหน้าที่นิติกรให้ตรวจสอบสัญญาแล้ว ติดตามสถานะได้ที่หน้าภาพรวมสัญญา' : 'แก้ไขต่อภายหลังได้จากหน้าภาพรวมสัญญา'}</p>
          <Link to="/agreement" className="flex h-[38px] items-center rounded-[8px] bg-blue-00 px-[16px] text-[13px] font-medium text-white">ไปที่ภาพรวมสัญญา</Link>
        </div>
      </Modal>
      {toast}
    </div>
  )
}
