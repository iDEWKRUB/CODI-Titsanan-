import { useRef, useState } from 'react'
import { Link, useNavigate, useSearchParams } from 'react-router-dom'
import { Btn, Crumbs, GI, GPersonaSwitch, Gate, Ic, Row, Section, Title, ctl, err, page, ta } from '../components/agreement/Parts'
import Modal from '../components/ui/Modal'
import { communityOrgs, dbdParty, nextContractNo, stamp, types, type Contract, type Party, type TypeKey } from '../data/erpAgreement'
import { contracts, gWho, useContracts, useGPersona } from '../lib/agreementStore'

const blankParty: Party = { name: '', address: '', taxId: '', signer: '', position: '', src: 'manual' }

/** สร้างทะเบียนสัญญา — บันทึกสัญญาที่ลงนามแล้วเข้าทะเบียน พร้อมแนบไฟล์ (book 3 §2.3.1.5, figs 2-121 – 2-122) */
export default function AgreementRegistryNewPage() {
  const all = useContracts()
  const me = useGPersona()
  const navigate = useNavigate()
  const [sp] = useSearchParams()
  const edit = all.find((c) => c.id === Number(sp.get('id')))
  const init = {
    code: edit?.no ?? '', title: edit?.title ?? '', type: (edit?.type ?? '') as '' | TypeKey, purpose: edit?.purpose ?? '', owner: edit?.owner ?? 'สำนักบริหารงานกลาง', resp: edit?.resp ?? '', value: edit?.value ? String(edit.value) : '', start: edit?.start ?? '', end: edit?.end ?? '', sign: edit?.signDate ?? '',
  }
  const [f, setF] = useState(init)
  const [p, setP] = useState<Party>(edit?.party ?? blankParty)
  const [file, setFile] = useState(edit?.file ?? '')
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [upload, setUpload] = useState(false)
  const [orgs, setOrgs] = useState(false)
  const [done, setDone] = useState<string>()
  const [drop, setDrop] = useState(false)
  const [note, setNote] = useState('')
  const pick = useRef<HTMLInputElement>(null)
  const set = (k: keyof Party, v: string) => setP({ ...p, [k]: v, src: 'manual' })

  const dbd = () => {
    const r = dbdParty(p.taxId)
    if (!r) { setErrors({ ...errors, taxId: 'ไม่พบเลขผู้เสียภาษีนี้ใน DBD (ลอง 0105556012345)' }); return }
    setP({ ...r, signer: p.signer, position: p.position || r.position }); setErrors({ ...errors, taxId: '' }); setNote('ดึงข้อมูลจาก DBD แล้ว')
  }
  const onFile = (list: FileList | null) => {
    const x = list?.[0]
    if (!x) return
    if (!/\.(pdf|png|jpe?g|docx?)$/i.test(x.name)) { setErrors({ ...errors, file: 'รองรับเฉพาะไฟล์ PDF, รูปภาพ หรือ Word' }); return }
    if (x.size > 20 * 1024 * 1024) { setErrors({ ...errors, file: 'ไฟล์ต้องมีขนาดไม่เกิน 20 MB' }); return }
    setErrors({ ...errors, file: '' }); setFile(x.name); setUpload(false)
  }
  const clear = () => { setF({ ...init, code: '', title: '', type: '', purpose: '', resp: '', value: '', start: '', end: '', sign: '' }); setP(blankParty); setFile(''); setErrors({}); setNote('') }

  const save = () => {
    const e: Record<string, string> = {}
    if (!f.title.trim()) e.title = 'กรุณาระบุชื่อสัญญา'
    if (!f.type) e.type = 'กรุณาเลือกประเภทสัญญา'
    if (!f.start) e.start = 'กรุณาเลือกวันเริ่มต้น'
    if (!f.end) e.end = 'กรุณาเลือกวันสิ้นสุด'
    else if (f.start && f.end < f.start) e.end = 'วันสิ้นสุดต้องไม่ก่อนวันเริ่มต้น'
    if (!f.sign) e.sign = 'กรุณาระบุวันที่ลงนาม'
    if (!f.owner.trim()) e.owner = 'กรุณาระบุหน่วยงานเจ้าของสัญญา'
    if (!f.resp.trim()) e.resp = 'กรุณาระบุผู้รับผิดชอบสัญญา'
    if (!p.name.trim()) e.name = 'กรุณาระบุคู่สัญญา'
    if (!/^\d{13}$/.test(p.taxId.replace(/\D/g, ''))) e.taxId = 'เลขผู้เสียภาษีต้องมี 13 หลัก'
    if (!p.signer.trim()) e.signer = 'กรุณาระบุผู้มีอำนาจลงนาม'
    if (!file) e.file = 'กรุณานำเข้าไฟล์สัญญาที่ลงนามแล้ว'
    const no = f.code.trim() || edit?.no || nextContractNo(all)
    if (all.some((c) => c.no === no && c.id !== edit?.id)) e.code = 'รหัสสัญญานี้มีอยู่ในทะเบียนแล้ว'
    setErrors(e)
    if (Object.keys(e).length) return
    const at = stamp()
    const base = { no, title: f.title.trim(), type: f.type as TypeKey, party: { ...p, taxId: p.taxId.replace(/\D/g, '') }, purpose: f.purpose.trim(), value: Number(f.value) || 0, start: f.start, end: f.end, signDate: f.sign, owner: f.owner.trim(), resp: f.resp.trim(), file, status: 'ลงนามแล้ว' as const, fromRegistry: true, updatedAt: at }
    if (edit) contracts.save({ ...edit, ...base, history: [...edit.history, { at, by: gWho(), action: 'แก้ไขข้อมูลทะเบียนสัญญา' }] })
    else { const c: Contract = { id: contracts.next(), ...base, notes: [], createdAt: at, history: [{ at, by: gWho(), action: 'บันทึกเข้าทะเบียนสัญญา', note: `แนบไฟล์ ${file}` }] }; contracts.save(c) }
    setDone(no)
  }

  return (
    <div className={`${page} items-center`}>
      <div className="flex w-full max-w-[900px] flex-col gap-[12px]">
        <Title back="/agreement/registry" right={<GPersonaSwitch />}>{edit ? 'แก้ไขทะเบียนสัญญา' : 'สร้างทะเบียนสัญญา'}</Title>
        <Crumbs items={[{ label: 'หน้าแรก', to: '/agreement' }, { label: 'ทะเบียนสัญญา', to: '/agreement/registry' }, { label: edit ? 'แก้ไขทะเบียนสัญญา' : 'สร้างทะเบียนสัญญา' }]} />
        <Gate allowed={me === 'staff'} need="เจ้าหน้าที่ผู้รับผิดชอบ" />

        <Section title="ไฟล์สัญญาที่ลงนามแล้ว" action={<button type="button" onClick={() => setUpload(true)} className="flex h-[34px] items-center gap-[6px] rounded-[8px] border border-blue-00 px-[12px] text-[12px] font-medium text-blue-00 hover:bg-blue-bg"><Ic d={GI.upload} s={14} />นำเข้าเอกสาร</button>}>
          {file ? <p className="flex w-fit items-center gap-[8px] rounded-[10px] bg-blue-bg px-[12px] py-[8px] text-[12px] text-blue-dark"><Ic d={GI.clip} s={15} />{file}<button type="button" aria-label="ลบไฟล์แนบ" onClick={() => setFile('')} className="ml-[4px] text-gray-30 hover:text-[#c13232]"><Ic d={GI.x} s={13} /></button></p> : <p className="text-[12px] font-light text-gray-30">ยังไม่ได้แนบไฟล์ — กดปุ่ม “นำเข้าเอกสาร” เพื่อแนบไฟล์สัญญาที่ลงนามแล้วให้ประกบกับข้อมูลสัญญา</p>}
          {errors.file && <p role="alert" className="text-[11px] text-red-00">{errors.file}</p>}
        </Section>

        <Section title="ข้อมูลสัญญา">
          <Row label="รหัสสัญญา" error={errors.code} hint="เว้นว่างเพื่อให้ระบบออกเลขให้อัตโนมัติ"><input aria-label="รหัสสัญญา" value={f.code} onChange={(e) => setF({ ...f, code: e.target.value })} className={`${ctl} max-w-[260px] font-urbanist ${errors.code ? err : ''}`} /></Row>
          <Row label="ชื่อสัญญา" req error={errors.title}><input aria-label="ชื่อสัญญา" value={f.title} onChange={(e) => setF({ ...f, title: e.target.value })} className={`${ctl} ${errors.title ? err : ''}`} /></Row>
          <Row label="ประเภทสัญญา" req error={errors.type}><select aria-label="เลือกประเภทสัญญา" value={f.type} onChange={(e) => setF({ ...f, type: e.target.value as '' | TypeKey })} className={`${ctl} ${errors.type ? err : ''}`}><option value="">เลือกประเภทสัญญา</option>{types.map((t) => <option key={t.key} value={t.key}>{t.label}</option>)}</select></Row>
          <Row label="วัตถุประสงค์ของสัญญา"><textarea aria-label="วัตถุประสงค์ของสัญญา" value={f.purpose} onChange={(e) => setF({ ...f, purpose: e.target.value })} className={`${ta} !min-h-[72px]`} /></Row>
          <Row label="หน่วยงานเจ้าของสัญญา" req error={errors.owner}><input aria-label="หน่วยงานเจ้าของสัญญา" value={f.owner} onChange={(e) => setF({ ...f, owner: e.target.value })} className={`${ctl} ${errors.owner ? err : ''}`} /></Row>
          <Row label="ผู้รับผิดชอบสัญญา" req error={errors.resp}><input aria-label="ผู้รับผิดชอบสัญญา" value={f.resp} onChange={(e) => setF({ ...f, resp: e.target.value })} className={`${ctl} ${errors.resp ? err : ''}`} /></Row>
          <Row label="มูลค่าสัญญา (บาท)"><input aria-label="มูลค่าสัญญา" inputMode="decimal" value={f.value} onChange={(e) => setF({ ...f, value: e.target.value.replace(/[^\d.]/g, '') })} className={`${ctl} max-w-[220px] text-right font-urbanist`} /></Row>
          <Row label="วันที่ลงนาม" req error={errors.sign}><input type="date" aria-label="วันที่ลงนาม" value={f.sign} onChange={(e) => setF({ ...f, sign: e.target.value })} className={`${ctl} max-w-[220px] ${errors.sign ? err : ''}`} /></Row>
          <Row label="วันเริ่มต้น" req error={errors.start}><input type="date" aria-label="วันเริ่มต้นสัญญา" value={f.start} onChange={(e) => setF({ ...f, start: e.target.value })} className={`${ctl} max-w-[220px] ${errors.start ? err : ''}`} /></Row>
          <Row label="วันสิ้นสุด" req error={errors.end}><input type="date" aria-label="วันสิ้นสุดสัญญา" min={f.start} value={f.end} onChange={(e) => setF({ ...f, end: e.target.value })} className={`${ctl} max-w-[220px] ${errors.end ? err : ''}`} /></Row>
        </Section>

        <Section title="ข้อมูลคู่สัญญา">
          <div className="flex flex-wrap gap-[8px]">
            <button type="button" onClick={dbd} className="flex h-[36px] items-center gap-[6px] rounded-[8px] border border-blue-00 px-[12px] text-[12px] font-medium text-blue-00 hover:bg-blue-bg"><Ic d={GI.search} s={14} />ค้นหาข้อมูลจาก DBD</button>
            <button type="button" onClick={() => setOrgs(true)} className="flex h-[36px] items-center gap-[6px] rounded-[8px] border border-blue-00 px-[12px] text-[12px] font-medium text-blue-00 hover:bg-blue-bg"><Ic d={GI.search} s={14} />ค้นหาข้อมูลจากองค์กรชุมชน</button>
          </div>
          {note && <p role="status" className="rounded-[8px] bg-[#e7f7ef] px-[10px] py-[6px] text-[12px] text-[#0f8a63]">{note}</p>}
          <Row label="เลขผู้เสียภาษี" req error={errors.taxId}><input aria-label="เลขผู้เสียภาษี" inputMode="numeric" maxLength={13} value={p.taxId} onChange={(e) => set('taxId', e.target.value.replace(/\D/g, ''))} className={`${ctl} max-w-[260px] font-urbanist ${errors.taxId ? err : ''}`} /></Row>
          <Row label="ชื่อนิติบุคคล / คู่สัญญา" req error={errors.name}><input aria-label="ชื่อคู่สัญญา" value={p.name} onChange={(e) => set('name', e.target.value)} className={`${ctl} ${errors.name ? err : ''}`} /></Row>
          <Row label="ที่อยู่"><textarea aria-label="ที่อยู่คู่สัญญา" value={p.address} onChange={(e) => set('address', e.target.value)} className={`${ta} !min-h-[72px]`} /></Row>
          <Row label="ผู้มีอำนาจลงนาม" req error={errors.signer}><input aria-label="ผู้มีอำนาจลงนามคู่สัญญา" value={p.signer} onChange={(e) => set('signer', e.target.value)} className={`${ctl} ${errors.signer ? err : ''}`} /></Row>
          <Row label="ตำแหน่ง"><input aria-label="ตำแหน่งผู้ลงนามคู่สัญญา" value={p.position} onChange={(e) => set('position', e.target.value)} className={ctl} /></Row>
        </Section>

        <div className="flex flex-wrap justify-end gap-[8px]">
          <Btn kind="ghost" onClick={clear}>ล้างค่า</Btn>
          <Btn kind="ghost" onClick={() => navigate('/agreement/registry')}>ยกเลิก</Btn>
          <Btn onClick={save} disabled={me !== 'staff'}>บันทึก</Btn>
        </div>
      </div>

      <Modal open={upload} onClose={() => setUpload(false)} title="นำเข้าเอกสารสัญญา" width="max-w-[480px]">
        <button type="button" aria-label="อัปโหลดไฟล์สัญญา" onClick={() => pick.current?.click()} onDragOver={(e) => { e.preventDefault(); setDrop(true) }} onDragLeave={() => setDrop(false)} onDrop={(e) => { e.preventDefault(); setDrop(false); onFile(e.dataTransfer.files) }} className={`flex w-full flex-col items-center gap-[6px] rounded-[14px] border-2 border-dashed p-[32px] text-[12px] font-light text-gray-30 transition ${drop ? 'border-blue-00 bg-blue-bg' : 'border-blue-20 hover:bg-blue-bg/50'}`}>
          <span className="text-blue-00"><Ic d={GI.upload} s={28} /></span>
          <span className="text-[13px] font-medium text-blue-00">ลากไฟล์มาวาง หรือคลิกเพื่อเลือก</span>
          <span>PDF, รูปภาพ หรือ Word ขนาดไม่เกิน 20 MB</span>
        </button>
        <input ref={pick} type="file" hidden accept=".pdf,.png,.jpg,.jpeg,.doc,.docx" aria-label="เลือกไฟล์สัญญา" onChange={(e) => { onFile(e.target.files); e.target.value = '' }} />
        {errors.file && <p role="alert" className="mt-[8px] text-[12px] text-red-00">{errors.file}</p>}
      </Modal>
      <Modal open={orgs} onClose={() => setOrgs(false)} title="ค้นหาจากองค์กรชุมชน" width="max-w-[560px]">
        <ul className="flex max-h-[50vh] flex-col gap-[8px] overflow-y-auto">
          {communityOrgs.map((o) => <li key={o.taxId}><button type="button" onClick={() => { setP(o); setOrgs(false); setNote('ดึงข้อมูลจากฐานข้อมูลองค์กรชุมชนแล้ว') }} className="flex w-full flex-col rounded-[10px] border border-gray-line-2 p-[12px] text-left hover:border-blue-20 hover:bg-blue-bg/50"><span className="text-[13px] font-semibold">{o.name}</span><span className="text-[11px] font-light text-gray-30">{o.address}</span></button></li>)}
        </ul>
      </Modal>
      <Modal open={!!done} onClose={() => navigate('/agreement/registry')} title="บันทึกทะเบียนสัญญาแล้ว" width="max-w-[440px]">
        <div className="flex flex-col items-center gap-[10px] text-center">
          <span className="flex size-[56px] items-center justify-center rounded-full bg-[#dff5e8] text-[#0f8a63]"><Ic d={GI.check} s={28} w={2.4} /></span>
          <p className="font-urbanist text-[18px] font-semibold text-blue-dark">{done}</p>
          <p className="text-[13px] font-light text-gray-30">เพิ่มสัญญาเข้าทะเบียนพร้อมไฟล์แนบเรียบร้อย ระบบจะแจ้งเตือนเมื่อสัญญาใกล้ครบกำหนด</p>
          <Link to="/agreement/registry" className="flex h-[38px] items-center rounded-[8px] bg-blue-00 px-[16px] text-[13px] font-medium text-white">ไปที่ทะเบียนสัญญา</Link>
        </div>
      </Modal>
    </div>
  )
}
