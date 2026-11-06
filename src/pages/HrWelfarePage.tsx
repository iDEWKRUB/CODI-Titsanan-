import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useToast } from '../components/leader/Parts'
import { Btn, Crumbs, DropZone, EmpInfo, FileField, Gate, HPersonaSwitch, Radios, Row, Section, Title, ctl, page, ro, ta } from '../components/hr/Parts'
import { money, todayIso, welfareCap, welfareTypes, type WelfareItem } from '../data/erpHr'
import { submitReq, useHPersona, useReqs, welfareUsed } from '../lib/hrStore'

const blank = (): WelfareItem => ({ date: todayIso(), detail: '', amount: '', receipt: '', issuer: '', evidence: '', note: '' })

/** เบิกสวัสดิการ (book 3 fig 2-32) — 2.1.6.4 */
export default function HrWelfarePage() {
  const me = useHPersona()
  useReqs()
  const navigate = useNavigate()
  const [toast, show] = useToast()
  const [type, setType] = useState(welfareTypes[0])
  const [items, setItems] = useState<WelfareItem[]>([blank()])
  const [docs, setDocs] = useState<string[]>([])
  const [err, setErr] = useState('')
  const allowed = me === 'staff'
  const total = items.reduce((a, i) => a + (Number(i.amount) || 0), 0)
  const left = welfareCap[type] - welfareUsed(type)
  const upd = (i: number, k: keyof WelfareItem, v: string) => setItems((s) => s.map((r, j) => (j === i ? { ...r, [k]: v } : r)))
  const submit = () => {
    if (!allowed) return show('ต้องเป็นเจ้าหน้าที่ พอช.')
    if (items.some((x) => !x.date || !x.detail.trim() || !(Number(x.amount) > 0) || !x.receipt.trim() || !x.issuer.trim())) return setErr('แต่ละรายการต้องมี วันที่ รายละเอียด จำนวนเงิน เลขที่ใบเสร็จ และผู้ออกใบเสร็จ')
    if (new Set(items.map((x) => x.receipt.trim())).size !== items.length) return setErr('มีเลขที่ใบเสร็จซ้ำกัน')
    if (items.some((x) => !x.evidence.trim()) && !docs.length) return setErr('กรุณาแนบหลักฐานประกอบ')
    if (total > left) return setErr(`ยอดเบิกเกินสิทธิ${type}คงเหลือ ${money(left)} บาท`)
    setErr('')
    const r = submitReq({ kind: 'welfare', welfareType: type, welfareItems: items.map((x) => ({ ...x, evidence: x.evidence || docs.join(', ') })) })
    show(`ยื่นเบิก${type} ${r.no} ${money(total)} บาท · แจ้งเจ้าหน้าที่สำนักทรัพยากรบุคคลแล้ว`)
    setTimeout(() => navigate('/hr'), 1300)
  }
  return (
    <div className={`${page} items-center`}>
      <div className="flex w-full max-w-[860px] flex-col gap-[12px]">
        <Title back="/hr" right={<HPersonaSwitch />}>เบิกสวัสดิการ</Title>
        <Crumbs items={[{ label: 'หน้าแรก', to: '/hr' }, { label: 'เบิกสวัสดิการ' }]} />
        <Gate allowed={allowed} need="เจ้าหน้าที่ พอช." />
        <EmpInfo />
        <Section title="นำเอกสารเข้าจากการอัปโหลด"><DropZone files={docs} onChange={setDocs} label="อัปโหลดเอกสารการเบิกสวัสดิการ" /></Section>
        <Section title="รายการเบิก" action={<button type="button" disabled={!allowed} onClick={() => setItems((s) => [...s, blank()])} className="h-[30px] rounded-[8px] border border-blue-00 px-[12px] text-[12px] font-medium text-blue-00 hover:bg-blue-bg disabled:opacity-40">+ เพิ่มรายการ</button>}>
          <Row label="ประเภทการเบิก"><Radios label="ประเภทการเบิก" value={type} options={welfareTypes.map((k) => ({ key: k, label: k }))} onChange={setType} /></Row>
          <p className="rounded-[8px] bg-blue-bg px-[12px] py-[8px] text-[12px] text-blue-dark">{`สิทธิ${type}ต่อปี ${money(welfareCap[type])} บาท · ใช้ไปแล้ว ${money(welfareCap[type] - left)} บาท · คงเหลือ `}<b className="font-urbanist" aria-label="สิทธิคงเหลือ">{money(left)}</b>{' บาท'}</p>
          {items.map((r, i) => (
            <fieldset key={i} aria-label={`รายการเบิกที่ ${i + 1}`} disabled={!allowed} className="flex flex-col gap-[10px] rounded-[10px] border border-dashed border-gray-line bg-[#fafbfc] p-[14px]">
              <div className="flex justify-between"><b className="text-[12px]">{`รายการที่ ${i + 1}`}</b>{items.length > 1 && <button type="button" onClick={() => setItems((s) => s.filter((_, j) => j !== i))} className="text-[11px] text-[#c13232] hover:underline">ลบรายการ</button>}</div>
              <Row label="วันที่รายการค่าใช้จ่าย" req><input type="date" aria-label={`วันที่ ${i + 1}`} className={ctl} value={r.date} onChange={(e) => upd(i, 'date', e.target.value)} /></Row>
              <Row label="รายละเอียดรายการ" req><textarea aria-label={`รายละเอียด ${i + 1}`} className={`${ta} min-h-[64px]`} value={r.detail} onChange={(e) => upd(i, 'detail', e.target.value)} /></Row>
              <div className="grid grid-cols-2 gap-[10px] max-sm:grid-cols-1">
                <Row label="จำนวนเงิน (บาท)" req><input aria-label={`จำนวนเงิน ${i + 1}`} inputMode="decimal" className={`${ctl} text-right font-urbanist`} value={r.amount} onChange={(e) => upd(i, 'amount', e.target.value.replace(/[^\d.]/g, ''))} /></Row>
                <Row label="เลขที่ใบเสร็จ" req><input aria-label={`เลขที่ใบเสร็จ ${i + 1}`} className={ctl} value={r.receipt} onChange={(e) => upd(i, 'receipt', e.target.value)} /></Row>
              </div>
              <Row label="ผู้ออกใบเสร็จ" req><input aria-label={`ผู้ออกใบเสร็จ ${i + 1}`} className={ctl} value={r.issuer} onChange={(e) => upd(i, 'issuer', e.target.value)} /></Row>
              <Row label="หลักฐานประกอบ"><FileField label={`หลักฐาน ${i + 1}`} value={r.evidence} onChange={(v) => upd(i, 'evidence', v)} /></Row>
              <Row label="หมายเหตุเพิ่มเติม"><input aria-label={`หมายเหตุ ${i + 1}`} className={ctl} value={r.note} onChange={(e) => upd(i, 'note', e.target.value)} /></Row>
            </fieldset>
          ))}
          <Row label="ยอดรวมค่าใช้จ่าย"><input aria-label="ยอดรวมค่าใช้จ่าย" readOnly className={`${ro} text-right font-urbanist`} value={money(total)} /></Row>
          {err && <span role="alert" className="text-[12px] text-red-00">{err}</span>}
        </Section>
        <div className="flex justify-end gap-[10px]"><Btn kind="ghost" onClick={() => navigate('/hr')}>ยกเลิก</Btn><Btn onClick={submit}>ยืนยัน</Btn></div>
      </div>
      {toast}
    </div>
  )
}
