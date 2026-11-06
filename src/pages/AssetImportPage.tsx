import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { AI, APersonaSwitch, Barcode, Btn, Crumbs, FileField, Gate, Ic, Radios, Row, Section, Title, ctl, err, page, ta } from '../components/asset/Parts'
import { useToast } from '../components/leader/Parts'
import Modal from '../components/ui/Modal'
import { assetKinds, lookupDbd, money, nextAssetCodes, nextImportNo, nextSupplyCode, stamp, type AssetKind, type ImportLine, type Vendor } from '../data/erpAsset'
import { assets, imports, useAPersona, whoAmI } from '../lib/assetStore'

type Line = { detail: string; qty: string; unit: string; serial: string; evidence: string; note: string; unitPrice: string; total: string; manual: boolean }
const blank = (): Line => ({ detail: '', qty: '1', unit: '', serial: '', evidence: '', note: '', unitPrice: '', total: '', manual: false })
const today = () => new Date().toISOString().slice(0, 10)
const num = (s: string) => Number(String(s).replace(/,/g, '')) || 0

/** นำเข้าพัสดุ ครุภัณฑ์ (book 3 fig 2-52) — 2.1.8.1 ; central office receives goods and registers them */
export default function AssetImportPage() {
  const me = useAPersona()
  const navigate = useNavigate()
  const [toast, show] = useToast()
  const [kind, setKind] = useState<AssetKind>('ครุภัณฑ์')
  const [date, setDate] = useState(today())
  const [lines, setLines] = useState<Line[]>([blank()])
  const [v, setV] = useState({ taxId: '', name: '', address: '', regFile: '' })
  const [found, setFound] = useState<Vendor | null | undefined>()
  const [busy, setBusy] = useState(false)
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [done, setDone] = useState<{ no: string; codes: { code: string; name: string }[]; total: number }>()
  const allowed = me === 'central'

  const totalOf = (l: Line) => (l.manual ? num(l.total) : num(l.qty) * num(l.unitPrice))
  const grand = lines.reduce((s, l) => s + totalOf(l), 0)
  const set = (i: number, p: Partial<Line>) => setLines(lines.map((l, j) => (j === i ? { ...l, ...p } : l)))

  const fetchDbd = () => {
    const id = v.taxId.replace(/\D/g, '')
    if (id.length !== 13) { setErrors({ ...errors, taxId: 'กรุณากรอกเลขประจำตัวผู้เสียภาษี 13 หลัก' }); return }
    setBusy(true); setFound(undefined)
    window.setTimeout(() => {
      const r = lookupDbd(id)
      setBusy(false); setFound(r ?? null)
      if (r) { setV({ taxId: id, name: r.name, address: r.address, regFile: r.regFile }); setErrors({ ...errors, taxId: '', vname: '', vaddr: '' }) }
    }, 900)
  }

  const submit = () => {
    const e: Record<string, string> = {}
    if (!date) e.date = 'กรุณาเลือกวันที่นำเข้า'
    lines.forEach((l, i) => {
      if (!l.detail.trim()) e[`d${i}`] = 'กรุณากรอกรายละเอียดพัสดุ'
      if (num(l.qty) <= 0) e[`q${i}`] = 'จำนวนต้องมากกว่า 0'
      if (!l.unit.trim()) e[`u${i}`] = 'ระบุหน่วยนับ'
      if (!l.evidence.trim()) e[`e${i}`] = 'แนบหลักฐาน เช่น ใบสั่งซื้อ ใบส่งของ'
      if (totalOf(l) <= 0) e[`p${i}`] = 'กรอกราคาต่อชิ้นหรือราคารวม'
      if (kind === 'ครุภัณฑ์' && l.serial.trim() && l.serial.split(',').filter((s) => s.trim()).length !== num(l.qty)) e[`s${i}`] = `จำนวนเลขเครื่องต้องเท่ากับจำนวน (${num(l.qty)}) — คั่นด้วยเครื่องหมายจุลภาค`
    })
    if (!v.name.trim()) e.vname = 'กรุณากรอกชื่อผู้ค้า หรือดึงข้อมูลจาก DBD'
    if (!v.address.trim()) e.vaddr = 'กรุณากรอกที่อยู่ผู้ค้า'
    setErrors(e)
    if (Object.keys(e).length) { show('กรุณาตรวจสอบข้อมูลที่ไม่ครบ'); return }

    const no = nextImportNo(imports.all())
    const codes: { code: string; name: string }[] = []
    const saved: ImportLine[] = lines.map((l) => {
      const qty = num(l.qty), unitPrice = l.manual ? num(l.total) / qty : num(l.unitPrice)
      let lineCodes: string[] = []
      if (kind === 'ครุภัณฑ์') {
        lineCodes = nextAssetCodes(assets.all(), l.detail, qty)
        const serials = l.serial.split(',').map((s) => s.trim())
        lineCodes.forEach((code, k) => assets.save({ id: assets.next(), code, kind, name: l.detail.split('\n')[0].trim(), unit: l.unit, qty: 1, min: 0, unitPrice, serial: serials[k] || '-', location: 'สำนักบริหารงานกลาง (รอแจกจ่าย)', receivedAt: date, importNo: no, vendor: v.name, state: 'ใช้งานได้' }))
      } else {
        const name = l.detail.split('\n')[0].trim()
        const same = assets.all().find((a) => a.kind !== 'ครุภัณฑ์' && a.name === name)
        if (same) { assets.save({ ...same, qty: same.qty + qty, unitPrice, receivedAt: date, importNo: no }); lineCodes = [same.code] }
        else { const code = nextSupplyCode(assets.all()); assets.save({ id: assets.next(), code, kind, name, unit: l.unit, qty, min: Math.max(1, Math.round(qty * 0.2)), unitPrice, serial: '-', location: 'คลังพัสดุ ชั้น 1', receivedAt: date, importNo: no, vendor: v.name, state: 'ใช้งานได้' }); lineCodes = [code] }
      }
      lineCodes.forEach((c) => codes.push({ code: c, name: l.detail.split('\n')[0] }))
      return { detail: l.detail, qty, unit: l.unit, serial: l.serial, evidence: l.evidence, note: l.note, unitPrice, total: totalOf(l), codes: lineCodes }
    })
    imports.save({ id: imports.next(), no, kind, date, lines: saved, vendor: v, by: whoAmI(), at: stamp() })
    setDone({ no, codes, total: grand })
  }

  return (
    <div className={`${page} items-center`}>
      <div className="flex w-full max-w-[880px] flex-col gap-[12px]">
        <Title back="/asset" right={<APersonaSwitch />}>นำเข้าพัสดุ ครุภัณฑ์</Title>
        <Crumbs items={[{ label: 'หน้าแรก', to: '/asset' }, { label: 'นำเข้าพัสดุ ครุภัณฑ์' }]} />
        <Gate allowed={allowed} need="เจ้าหน้าที่สำนักบริหารงานกลาง" />

        <Section title="รายการนำเข้า" action={<span className="text-[11px] font-light text-gray-20">ตรวจรับแล้วจึงบันทึก</span>}>
          <Row label="ประเภทการนำเข้า" req><Radios label="ประเภทการนำเข้า" value={kind} options={assetKinds.map((k) => ({ key: k, label: k }))} onChange={(k) => setKind(k as AssetKind)} disabled={!allowed} /></Row>
          <Row label="วันที่นำเข้า" req error={errors.date}><input type="date" aria-label="วันที่นำเข้า" disabled={!allowed} className={`${ctl} max-w-[240px] ${errors.date ? err : ''}`} value={date} onChange={(e) => setDate(e.target.value)} /></Row>
          {lines.map((l, i) => (
            <fieldset key={i} className="flex flex-col gap-[12px] rounded-[12px] border border-gray-line-2 bg-[#fafbfc] p-[16px]">
              <legend className="sr-only">{`รายการที่ ${i + 1}`}</legend>
              <div className="flex items-center"><b className="flex-1 text-[13px] font-semibold">{`รายการที่ ${i + 1}`}</b>{lines.length > 1 && <button type="button" onClick={() => setLines(lines.filter((_, j) => j !== i))} className="text-[12px] text-[#c13232] hover:underline">ลบรายการ</button>}</div>
              <Row label="รายละเอียดพัสดุ" req error={errors[`d${i}`]}><textarea aria-label={`รายละเอียดพัสดุ ${i + 1}`} disabled={!allowed} placeholder="ชื่อ ลักษณะ คุณสมบัติ เช่น เครื่องคอมพิวเตอร์โน้ตบุ๊ก Core i5 RAM 16GB" className={`${ta} ${errors[`d${i}`] ? err : ''}`} value={l.detail} onChange={(e) => set(i, { detail: e.target.value })} /></Row>
              <Row label="จำนวน" req error={errors[`q${i}`] || errors[`u${i}`]}>
                <div className="flex gap-[8px]"><input inputMode="numeric" aria-label={`จำนวน ${i + 1}`} disabled={!allowed} className={`${ctl} max-w-[140px] ${errors[`q${i}`] ? err : ''}`} value={l.qty} onChange={(e) => set(i, { qty: e.target.value.replace(/\D/g, '') })} /><input aria-label={`หน่วยนับ ${i + 1}`} placeholder="หน่วย เช่น เครื่อง รีม" disabled={!allowed} className={`${ctl} max-w-[180px] ${errors[`u${i}`] ? err : ''}`} value={l.unit} onChange={(e) => set(i, { unit: e.target.value })} /></div>
              </Row>
              <Row label="เลขที่เครื่อง / รหัส" error={errors[`s${i}`]} hint={kind === 'ครุภัณฑ์' ? 'Serial Number ของแต่ละเครื่อง คั่นด้วยจุลภาค · ระบบออกเลขครุภัณฑ์ให้อัตโนมัติ' : 'ถ้ามี'}><input aria-label={`เลขที่เครื่อง ${i + 1}`} disabled={!allowed} placeholder="เช่น DL5440-AA01, DL5440-AA02" className={`${ctl} ${errors[`s${i}`] ? err : ''}`} value={l.serial} onChange={(e) => set(i, { serial: e.target.value })} /></Row>
              <Row label="หลักฐานประกอบ" req><FileField label={`หลักฐานประกอบ ${i + 1}`} value={l.evidence} onChange={(x) => set(i, { evidence: x })} error={errors[`e${i}`]} disabled={!allowed} /></Row>
              <Row label="หมายเหตุ"><input aria-label={`หมายเหตุ ${i + 1}`} disabled={!allowed} placeholder="ข้อมูลเสริม หรือเหตุผลในการรับ" className={ctl} value={l.note} onChange={(e) => set(i, { note: e.target.value })} /></Row>
              <div className="rounded-[10px] bg-white p-[12px] ring-1 ring-gray-line-2">
                <p className="mb-[10px] text-[12px] font-semibold">ราคา</p>
                <div className="grid grid-cols-2 gap-[10px] max-sm:grid-cols-1">
                  <label className="flex flex-col gap-[4px] text-[11px] text-gray-30">ราคาต่อชิ้น (บาท)<input inputMode="decimal" aria-label={`ราคาต่อชิ้น ${i + 1}`} disabled={!allowed || l.manual} className={`${ctl} text-right font-urbanist ${errors[`p${i}`] ? err : ''}`} value={l.unitPrice} onChange={(e) => set(i, { unitPrice: e.target.value.replace(/[^\d.]/g, '') })} /></label>
                  <label className="flex flex-col gap-[4px] text-[11px] text-gray-30">
                    <span className="flex items-center">ราคารวม (บาท)<button type="button" disabled={!allowed} onClick={() => set(i, { manual: !l.manual, total: l.manual ? '' : String(totalOf(l) || '') })} className="ml-auto text-[11px] font-medium text-blue-00 hover:underline">{l.manual ? 'คำนวณอัตโนมัติ' : 'กรอกตามใบเสร็จ'}</button></span>
                    <input inputMode="decimal" aria-label={`ราคารวม ${i + 1}`} disabled={!allowed || !l.manual} className={`${ctl} text-right font-urbanist ${l.manual ? '' : 'bg-gray-bg'}`} value={l.manual ? l.total : totalOf(l) ? money(totalOf(l)) : ''} onChange={(e) => set(i, { total: e.target.value.replace(/[^\d.]/g, '') })} />
                  </label>
                </div>
                {errors[`p${i}`] && <p role="alert" className="mt-[4px] text-[11px] text-red-00">{errors[`p${i}`]}</p>}
              </div>
            </fieldset>
          ))}
          <button type="button" disabled={!allowed} onClick={() => setLines([...lines, blank()])} className="flex h-[40px] items-center justify-center gap-[6px] rounded-[10px] border border-dashed border-blue-20 text-[12px] font-medium text-blue-00 hover:bg-blue-bg disabled:opacity-40"><Ic d={AI.plus} s={15} />เพิ่มรายการ</button>
        </Section>

        <Section title="ข้อมูลผู้ค้า">
          <Row label="เลขประจำตัวผู้เสียภาษี" error={errors.taxId} hint="ทดลอง: 0105556012345 · 0105548098765 · 0103562004321 · 0105560111222">
            <div className="flex gap-[8px]">
              <input inputMode="numeric" aria-label="เลขประจำตัวผู้เสียภาษี" disabled={!allowed} maxLength={13} placeholder="เลข 13 หลัก" className={`${ctl} font-urbanist ${errors.taxId ? err : ''}`} value={v.taxId} onChange={(e) => { setV({ ...v, taxId: e.target.value.replace(/\D/g, '') }); setFound(undefined) }} />
              <button type="button" disabled={!allowed || busy} onClick={fetchDbd} className="flex h-[40px] shrink-0 items-center gap-[6px] rounded-[8px] bg-[#0b2a5c] px-[14px] text-[12px] font-medium text-white hover:brightness-125 disabled:opacity-50">{busy ? <span className="size-[14px] animate-spin rounded-full border-2 border-white/40 border-t-white" /> : <Ic d={AI.db} s={15} />}ดึงข้อมูลจาก DBD</button>
            </div>
            {found && <p className="mt-[4px] flex flex-wrap items-center gap-[6px] rounded-[8px] bg-[#e9f8f0] px-[10px] py-[6px] text-[11px] text-[#0f6b4c]"><Ic d={AI.check} s={13} w={2.4} />{`พบข้อมูลนิติบุคคล · ${found.type} · ${found.status} · ทุนจดทะเบียน ${found.capital} บาท`}</p>}
            {found === null && <p className="mt-[4px] rounded-[8px] bg-[#fff1f1] px-[10px] py-[6px] text-[11px] text-[#c13232]">ไม่พบข้อมูลนิติบุคคลในฐานข้อมูลกรมพัฒนาธุรกิจการค้า — กรอกข้อมูลผู้ค้าเอง</p>}
          </Row>
          <Row label="ชื่อผู้ค้า" req error={errors.vname}><input aria-label="ชื่อผู้ค้า" disabled={!allowed} className={`${ctl} ${errors.vname ? err : ''}`} value={v.name} onChange={(e) => setV({ ...v, name: e.target.value })} /></Row>
          <Row label="ที่อยู่" req error={errors.vaddr}><textarea aria-label="ที่อยู่ผู้ค้า" disabled={!allowed} className={`${ta} min-h-[70px] ${errors.vaddr ? err : ''}`} value={v.address} onChange={(e) => setV({ ...v, address: e.target.value })} /></Row>
          <Row label="หนังสือจดทะเบียน"><FileField label="หนังสือจดทะเบียน" value={v.regFile} onChange={(x) => setV({ ...v, regFile: x })} disabled={!allowed} /></Row>
        </Section>

        <section aria-label="สรุปราคา" className="flex flex-wrap items-center gap-[14px] rounded-[12px] border border-blue-20 bg-blue-bg/70 px-[22px] py-[16px]">
          <span className="text-[13px] font-semibold">ส่วนราคา</span>
          <span className="text-[12px] font-light text-gray-30">{`${lines.length} รายการ · ${lines.reduce((s, l) => s + num(l.qty), 0)} หน่วย`}</span>
          <span className="ml-auto text-[12px] text-gray-30">ราคารวมทั้งสิ้น</span>
          <span className="font-urbanist text-[22px] font-semibold text-blue-dark">{money(grand)}</span><span className="text-[12px] text-gray-30">บาท</span>
        </section>

        <div className="flex justify-end gap-[8px]">
          <Btn kind="ghost" onClick={() => navigate('/asset')}>ยกเลิก</Btn>
          <Btn onClick={submit} disabled={!allowed}>นำเข้าเอกสาร</Btn>
        </div>
      </div>

      <Modal open={!!done} onClose={() => navigate('/asset')} title="นำเข้าและขึ้นทะเบียนแล้ว" width="max-w-[520px]">
        {done && (
          <div className="flex flex-col gap-[12px]">
            <p className="text-[13px] font-light text-gray-30">{`เลขที่นำเข้า ${done.no} · มูลค่า ${money(done.total)} บาท · ระบบออกเลข${kind === 'ครุภัณฑ์' ? 'ครุภัณฑ์' : 'รหัสพัสดุ'}ให้ ${done.codes.length} รายการ`}</p>
            <ul className="flex max-h-[260px] flex-col gap-[8px] overflow-y-auto">
              {done.codes.map((c) => <li key={c.code} className="flex items-center gap-[12px] rounded-[10px] bg-gray-subtle px-[12px] py-[8px]"><Barcode value={c.code} w={110} h={30} /><span className="min-w-0"><p className="font-urbanist text-[13px] font-semibold">{c.code}</p><p className="truncate text-[11px] text-gray-20">{c.name}</p></span></li>)}
            </ul>
            <div className="flex justify-end gap-[8px]">
              <button type="button" onClick={() => { setDone(undefined); setLines([blank()]); setV({ taxId: '', name: '', address: '', regFile: '' }); setFound(undefined) }} className="h-[38px] rounded-[8px] border border-gray-line px-[16px] text-[13px]">นำเข้ารายการใหม่</button>
              <Link to="/asset" className="flex h-[38px] items-center rounded-[8px] bg-blue-00 px-[16px] text-[13px] font-medium text-white hover:brightness-110">ไปที่ทะเบียน</Link>
            </div>
          </div>
        )}
      </Modal>
      {toast}
    </div>
  )
}
