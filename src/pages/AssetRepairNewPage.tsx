import { useMemo, useRef, useState } from 'react'
import { Link, useNavigate, useSearchParams } from 'react-router-dom'
import { AI, APersonaSwitch, Btn, Crumbs, Ic, Radios, Row, Section, Title, ctl, err, page, ta } from '../components/asset/Parts'
import Modal from '../components/ui/Modal'
import Select from '../components/ui/Select'
import { assetKinds, nextRepairNo, stamp, type AssetKind } from '../data/erpAsset'
import { assets, repairs, useAssets, whoAmI } from '../lib/assetStore'

const today = () => new Date().toISOString().slice(0, 10)

/** shrink a picked photo to a small JPEG so it fits in localStorage */
const thumb = (file: File): Promise<string> =>
  new Promise((res) => {
    const r = new FileReader()
    r.onload = () => {
      const img = new Image()
      img.onload = () => { const k = Math.min(1, 240 / Math.max(img.width, img.height)); const c = document.createElement('canvas'); c.width = Math.round(img.width * k); c.height = Math.round(img.height * k); c.getContext('2d')!.drawImage(img, 0, 0, c.width, c.height); res(c.toDataURL('image/jpeg', 0.8)) }
      img.onerror = () => res('')
      img.src = String(r.result)
    }
    r.onerror = () => res('')
    r.readAsDataURL(file)
  })

/** เพิ่มรายการแจ้งซ่อมครุภัณฑ์ (book 3 fig 2-55) — 2.1.8.4 */
export default function AssetRepairNewPage() {
  const reg = useAssets()
  const navigate = useNavigate()
  const [sp] = useSearchParams()
  const pre = reg.find((a) => a.code === sp.get('code'))
  const [kind, setKind] = useState<AssetKind>(pre?.kind ?? 'ครุภัณฑ์')
  const [code, setCode] = useState(pre?.code ?? '')
  const [f, setF] = useState({ title: '', date: today(), detail: '', qty: '1', place: pre?.location ?? '', note: '' })
  const [files, setFiles] = useState<{ name: string; src: string }[]>([])
  const [over, setOver] = useState(false)
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [done, setDone] = useState<string>()
  const pick = useRef<HTMLInputElement>(null)
  const options = useMemo(() => reg.filter((a) => a.kind === kind && a.state !== 'จำหน่ายแล้ว'), [reg, kind])
  const chosen = reg.find((a) => a.code === code)

  const add = async (list: FileList | null) => {
    if (!list) return
    const next = await Promise.all(Array.from(list).slice(0, 6).map(async (x) => ({ name: x.name, src: x.type.startsWith('image/') ? await thumb(x) : '' })))
    setFiles((p) => [...p, ...next].slice(0, 6))
  }

  const submit = () => {
    const e: Record<string, string> = {}
    if (kind !== 'อื่น ๆ' && !code) e.code = 'กรุณาเลือกรายการจากทะเบียน'
    if (!f.title.trim()) e.title = 'กรุณาระบุอาการชำรุดโดยย่อ'
    if (!f.date) e.date = 'กรุณาเลือกวันที่แจ้งซ่อม'
    if (f.date > today()) e.date = 'วันที่แจ้งซ่อมต้องไม่เกินวันนี้'
    if (!f.detail.trim()) e.detail = 'กรุณากรอกรายละเอียดอาการชำรุด'
    if ((Number(f.qty) || 0) <= 0) e.qty = 'จำนวนต้องมากกว่า 0'
    if (!f.place.trim()) e.place = 'กรุณาระบุสถานที่'
    setErrors(e)
    if (Object.keys(e).length) return
    const no = nextRepairNo(repairs.all())
    repairs.save({ id: repairs.next(), no, kind, assetCode: code, title: f.title.trim(), date: f.date, detail: f.detail.trim(), qty: Number(f.qty), place: f.place.trim(), evidence: files.map((x) => x.name), photo: files.find((x) => x.src)?.src, note: f.note.trim(), reporter: whoAmI(), status: 'รอตรวจสอบ', history: [{ at: stamp(), by: whoAmI(), action: 'แจ้งซ่อม' }] })
    if (chosen && chosen.kind === 'ครุภัณฑ์') assets.save({ ...chosen, state: 'ชำรุด' })
    setDone(no)
  }

  return (
    <div className={`${page} items-center`}>
      <div className="flex w-full max-w-[860px] flex-col gap-[12px]">
        <Title back="/asset/repair" right={<APersonaSwitch />}>แจ้งซ่อมครุภัณฑ์</Title>
        <Crumbs items={[{ label: 'หน้าแรก', to: '/asset' }, { label: 'รายการแจ้งซ่อม', to: '/asset/repair' }, { label: 'แจ้งซ่อมครุภัณฑ์' }]} />

        <Section title="ข้อมูลการแจ้งซ่อม">
          <Row label="ประเภทอุปกรณ์" req><Radios label="ประเภทอุปกรณ์" value={kind} options={assetKinds.map((k) => ({ key: k, label: k }))} onChange={(k) => { setKind(k); setCode('') }} /></Row>
          {kind !== 'อื่น ๆ' && (
            <Row label={kind === 'ครุภัณฑ์' ? 'เลขครุภัณฑ์' : 'รหัสพัสดุ'} req error={errors.code}>
              <Select label="รายการจากทะเบียน" value={code} placeholder="เลือกจากทะเบียนพัสดุ-ครุภัณฑ์" options={options.map((a) => ({ value: a.code, label: `${a.code} · ${a.name}` }))} onChange={(v) => { setCode(v); const a = reg.find((x) => x.code === v); if (a && !f.place) setF({ ...f, place: a.location }) }} />
              {chosen && <p className="mt-[4px] flex flex-wrap items-center gap-[8px] rounded-[8px] bg-gray-subtle px-[10px] py-[6px] text-[11px] text-gray-30"><Ic d={AI.box} s={13} />{`${chosen.name} · ${chosen.location} · สภาพปัจจุบัน: ${chosen.state}`}</p>}
            </Row>
          )}
          <Row label="อาการโดยย่อ" req error={errors.title}><input aria-label="อาการโดยย่อ" placeholder="เช่น เครื่องเปิดไม่ติด แอร์ไม่เย็น" className={`${ctl} ${errors.title ? err : ''}`} value={f.title} onChange={(e) => setF({ ...f, title: e.target.value })} /></Row>
          <Row label="วันที่แจ้งซ่อม" req error={errors.date}><input type="date" aria-label="วันที่แจ้งซ่อม" max={today()} className={`${ctl} max-w-[240px] ${errors.date ? err : ''}`} value={f.date} onChange={(e) => setF({ ...f, date: e.target.value })} /></Row>
          <Row label="รายละเอียดรายการ" req error={errors.detail}><textarea aria-label="รายละเอียดรายการ" placeholder="อธิบายอาการชำรุด เกิดขึ้นเมื่อไร ใช้งานต่อได้หรือไม่" className={`${ta} ${errors.detail ? err : ''}`} value={f.detail} onChange={(e) => setF({ ...f, detail: e.target.value })} /></Row>
          <Row label="จำนวน" req error={errors.qty}><input inputMode="numeric" aria-label="จำนวน" className={`${ctl} max-w-[140px] ${errors.qty ? err : ''}`} value={f.qty} onChange={(e) => setF({ ...f, qty: e.target.value.replace(/\D/g, '') })} /></Row>
          <Row label="สถานที่" req error={errors.place}><input aria-label="สถานที่" placeholder="อาคาร ชั้น ห้อง" className={`${ctl} ${errors.place ? err : ''}`} value={f.place} onChange={(e) => setF({ ...f, place: e.target.value })} /></Row>
          <Row label="หลักฐานประกอบ" hint="ภาพถ่ายความเสียหาย ใบเสร็จ หรือไฟล์อื่น ๆ สูงสุด 6 ไฟล์">
            <button type="button" aria-label="อัปโหลดหลักฐานประกอบ" onClick={() => pick.current?.click()} onDragOver={(e) => { e.preventDefault(); setOver(true) }} onDragLeave={() => setOver(false)} onDrop={(e) => { e.preventDefault(); setOver(false); add(e.dataTransfer.files) }} className={`flex min-h-[96px] flex-col items-center justify-center gap-[4px] rounded-[12px] border-2 border-dashed text-[12px] transition ${over ? 'border-blue-00 bg-blue-bg' : 'border-gray-line bg-[#fafbfc] text-gray-20 hover:border-blue-00'}`}>
              <span className="text-blue-00"><Ic d="M12 16V4M7 9l5-5 5 5M4 20h16" s={24} /></span>
              <span className="font-medium text-blue-00">อัปโหลดไฟล์หลักฐาน</span>
              <span>ลากไฟล์มาวาง หรือคลิกเพื่อเลือก (รูป PDF)</span>
            </button>
            <input ref={pick} type="file" multiple accept="image/*,.pdf" hidden aria-label="เลือกไฟล์หลักฐาน" onChange={(e) => { add(e.target.files); e.target.value = '' }} />
            {files.length > 0 && (
              <ul className="mt-[8px] flex flex-wrap gap-[10px]">
                {files.map((x, i) => (
                  <li key={i} className="group relative flex w-[96px] flex-col items-center gap-[4px]">
                    {x.src ? <img src={x.src} alt="" className="size-[96px] rounded-[10px] object-cover ring-1 ring-black/5" /> : <span className="flex size-[96px] items-center justify-center rounded-[10px] bg-gray-bg text-gray-20"><Ic d="M7 3h7l4 4v14H7ZM14 3v4h4" s={26} /></span>}
                    <span className="w-full truncate text-center text-[10px] text-gray-30">{x.name}</span>
                    <button type="button" aria-label={`ลบไฟล์ ${x.name}`} onClick={() => setFiles(files.filter((_, j) => j !== i))} className="absolute -top-[6px] -right-[6px] flex size-[22px] items-center justify-center rounded-full bg-white text-[13px] text-[#c13232] shadow ring-1 ring-gray-line">×</button>
                  </li>
                ))}
              </ul>
            )}
          </Row>
          <Row label="หมายเหตุเพิ่มเติม"><input aria-label="หมายเหตุเพิ่มเติม" placeholder="เช่น อยู่ในระยะประกัน ติดต่อกลับเบอร์ภายใน" className={ctl} value={f.note} onChange={(e) => setF({ ...f, note: e.target.value })} /></Row>
        </Section>
        <div className="flex justify-end gap-[8px]">
          <Btn kind="ghost" onClick={() => navigate('/asset/repair')}>ยกเลิก</Btn>
          <Btn onClick={submit}>แจ้งซ่อม</Btn>
        </div>
      </div>

      <Modal open={!!done} onClose={() => navigate('/asset/repair')} title="แจ้งซ่อมเรียบร้อย" width="max-w-[440px]">
        <div className="flex flex-col items-center gap-[10px] text-center">
          <span className="flex size-[56px] items-center justify-center rounded-full bg-[#dff5e8] text-[#0f8a63]"><Ic d={AI.check} s={28} w={2.4} /></span>
          <p className="font-urbanist text-[18px] font-semibold text-blue-dark">{done}</p>
          <p className="text-[13px] font-light text-gray-30">ระบบส่งแจ้งเตือนไปยังเจ้าหน้าที่สำนักบริหารงานกลางแล้ว ติดตามสถานะได้ที่รายการแจ้งซ่อม</p>
          <div className="flex gap-[8px]"><Link to="/asset/repair" className="flex h-[38px] items-center rounded-[8px] bg-blue-00 px-[16px] text-[13px] font-medium text-white">ไปที่รายการแจ้งซ่อม</Link></div>
        </div>
      </Modal>
    </div>
  )
}
