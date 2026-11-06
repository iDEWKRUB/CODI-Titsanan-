import { useState, type ReactNode } from 'react'
import { Link, useNavigate, useSearchParams } from 'react-router-dom'
import { Btn, Crumbs, Ic, Title, ctl, err, page } from '../components/asset/Parts'
import { useToast } from '../components/leader/Parts'
import Modal from '../components/ui/Modal'
import Select from '../components/ui/Select'
import { docTags, docTypes, money, priceTypes, routesFor, totals, type DocType, type Fields, type Route } from '../data/erpDoc'
import { edocs, livePreview, useEDocs } from '../lib/docStore'
import { previewOf } from './DocLibraryPage'

const SPARK = 'M12 3l1.8 4.7L18.5 9.5l-4.7 1.8L12 16l-1.8-4.7L5.5 9.5l4.7-1.8Z'

/** label + control; fields the AI filled get a soft blue ring and a spark until the user edits them */
function F({ label, req, ai, error, children, wide }: { label: string; req?: boolean; ai?: boolean; error?: string; children: ReactNode; wide?: boolean }) {
  return (
    <label className={`flex min-w-0 flex-col gap-[5px] ${wide ? 'col-span-2 max-sm:col-span-1' : ''}`}>
      <span className="flex items-center gap-[6px] text-[12px] font-semibold text-black">{label}{req && <span className="text-red-00">*</span>}{ai && <span title="กรอกโดย AI จากเอกสาร" className="flex items-center gap-[3px] rounded-full bg-[#eaf2ff] px-[6px] py-[1px] text-[10px] font-medium text-[#1650c8]"><Ic d={SPARK} s={10} w={2} />AI</span>}</span>
      <span className={ai ? 'rounded-[9px] ring-2 ring-[#cfe0ff]' : ''}>{children}</span>
      {error && <span role="alert" className="text-[11px] text-red-00">{error}</span>}
    </label>
  )
}

/** บันทึกรายการเอกสาร (book 3 fig 2-72) — 2.1.11.3 */
export default function DocRecordPage() {
  const [sp] = useSearchParams()
  const id = Number(sp.get('id'))
  const more = Number(sp.get('more')) || 0
  const all = useEDocs()
  const doc = all.find((d) => d.id === id)
  const navigate = useNavigate()
  const [toast, show] = useToast()
  const [type, setType] = useState<DocType>(doc?.type ?? 'ใบเสร็จรับเงิน')
  const [f, setF] = useState<Fields>(doc?.f ?? { docNo: '', issueDate: '', contact: '', taxId: '', priceType: 'รวม VAT 7%', lines: [], tags: [], note: '' })
  const [ai, setAi] = useState<string[]>(doc?.aiKeys ?? [])
  const [route, setRoute] = useState<Route | undefined>(doc?.routedTo ?? routesFor[doc?.type ?? 'ใบเสร็จรับเงิน'][0])
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [zoom, setZoom] = useState(1)
  const [showOcr, setShowOcr] = useState(false)
  const [done, setDone] = useState(false)

  if (!doc) return <div className={`${page} items-center`}><div className="mt-[60px] text-center"><p className="text-[15px] font-medium">ไม่พบเอกสาร</p><Link to="/edoc" className="text-[13px] text-blue-00 hover:underline">กลับคลังเอกสาร</Link></div></div>
  const locked = doc.status === 'เสร็จสิ้น'
  const isAi = (k: string) => ai.includes(k)
  const set = <K extends keyof Fields>(k: K, v: Fields[K]) => { setF({ ...f, [k]: v }); setAi(ai.filter((x) => x !== k)) }
  const setLine = (i: number, p: Partial<Fields['lines'][number]>) => set('lines', f.lines.map((l, j) => (j === i ? { ...l, ...p } : l)))
  const medical = type === 'ใบรับรองแพทย์'
  const letter = type === 'หนังสือภายนอก'
  const tt = totals(f)
  const src = previewOf(doc)
  const pdf = doc.mime.includes('pdf')

  const validate = () => {
    const e: Record<string, string> = {}
    if (!f.docNo.trim()) e.docNo = 'กรุณากรอกเลขที่เอกสาร'
    if (!f.issueDate) e.issueDate = 'กรุณาเลือกวันที่ออกเอกสาร'
    if (!f.contact.trim() && !medical) e.contact = 'กรุณากรอกผู้ติดต่อ / ผู้ออกเอกสาร'
    if (f.taxId && f.taxId.replace(/\D/g, '').length !== 13) e.taxId = 'เลขประจำตัวผู้เสียภาษีต้องมี 13 หลัก'
    if (medical) { if (!f.hospital?.trim()) e.hospital = 'กรุณากรอกสถานพยาบาล'; if (!f.diagnosis?.trim()) e.diagnosis = 'กรุณากรอกการวินิจฉัย' }
    if (!letter) f.lines.forEach((l, i) => { if (!l.desc.trim()) e[`ld${i}`] = 'กรอกคำอธิบายรายการ'; if (l.price <= 0) e[`lp${i}`] = 'กรอกราคา' })
    if (!route) e.route = 'กรุณาเลือกงานที่จะส่งต่อ'
    setErrors(e)
    return !Object.keys(e).length
  }
  const saveDraft = () => { edocs.save({ ...doc, type, f, aiKeys: ai, status: 'ร่าง' }); show('บันทึกร่างแล้ว แก้ไขต่อได้จากคลังเอกสาร') }
  const confirm = () => { if (!validate()) { show('กรุณาตรวจสอบข้อมูลที่ไม่ครบ'); return } edocs.save({ ...doc, type, f, aiKeys: [], status: 'เสร็จสิ้น', routedTo: route }); setDone(true) }

  return (
    <div className={`${page} items-center`}>
      <div className="flex w-full max-w-[1180px] flex-col gap-[12px]">
        <Title back="/edoc">บันทึกรายการเอกสาร</Title>
        <Crumbs items={[{ label: 'หน้าแรก', to: '/edoc' }, { label: 'คลังเอกสาร', to: '/edoc' }, { label: doc.name }]} />
        {more > 0 && <p className="rounded-[10px] bg-blue-bg px-[14px] py-[8px] text-[12px] text-blue-dark">{`นำเข้าอีก ${more} ไฟล์เป็นแบบร่างในคลังเอกสาร บันทึกต่อได้หลังจากเอกสารนี้`}</p>}

        <div className="grid grid-cols-[minmax(0,1fr)_minmax(0,1.1fr)] items-start gap-[16px] max-lg:grid-cols-1">
          {/* preview */}
          <section aria-label="ตัวอย่างเอกสาร" className="sticky top-[12px] flex flex-col overflow-hidden rounded-[16px] border border-gray-line-2 bg-[#eef1f6] max-lg:static">
            <div className="flex items-center gap-[6px] border-b border-gray-line-2 bg-white px-[12px] py-[8px]">
              <span className="min-w-0 flex-1 truncate text-[12px] font-medium" title={doc.name}>{doc.name}</span>
              <button type="button" onClick={() => setShowOcr(!showOcr)} aria-pressed={showOcr} className={`h-[28px] rounded-[7px] px-[10px] text-[11px] font-medium ${showOcr ? 'bg-blue-00 text-white' : 'bg-blue-bg text-blue-00'}`}>ข้อความ OCR</button>
              {!pdf && <><button type="button" aria-label="ย่อ" onClick={() => setZoom(Math.max(0.6, zoom - 0.2))} className="flex size-[28px] items-center justify-center rounded-[7px] text-gray-30 hover:bg-gray-bg">−</button><span className="w-[38px] text-center font-urbanist text-[11px] text-gray-30">{Math.round(zoom * 100)}%</span><button type="button" aria-label="ขยาย" onClick={() => setZoom(Math.min(2, zoom + 0.2))} className="flex size-[28px] items-center justify-center rounded-[7px] text-gray-30 hover:bg-gray-bg">+</button></>}
            </div>
            <div className="h-[640px] overflow-auto p-[16px] max-lg:h-[460px]">
              {showOcr ? <pre className="rounded-[10px] bg-white p-[16px] font-mono text-[12px] leading-[1.8] whitespace-pre-wrap text-[#1d2433]">{doc.ocr}</pre>
                : pdf ? (livePreview.get(doc.id) ? <embed src={livePreview.get(doc.id)} type="application/pdf" className="h-full w-full" /> : <div className="flex h-full flex-col items-center justify-center gap-[8px] text-gray-30"><Ic d="M7 3h7l4 4v14H7ZM14 3v4h4" s={40} /><p className="text-[12px]">ไฟล์ PDF แสดงตัวอย่างได้ในรอบที่อัปโหลด</p></div>)
                : <img src={src} alt={`ตัวอย่าง ${doc.name}`} style={{ width: `${zoom * 100}%` }} className="mx-auto max-w-none bg-white shadow-[0_4px_20px_rgba(0,20,60,0.15)]" />}
            </div>
          </section>

          {/* form */}
          <div className="flex flex-col gap-[14px]">
            <section className="flex flex-wrap items-center gap-[12px] rounded-[16px] border border-[#cfe0ff] bg-[linear-gradient(120deg,#f3f8ff,#eaf2ff)] p-[14px]">
              <span className="flex size-[40px] items-center justify-center rounded-[12px] bg-[#1650c8] text-white"><Ic d={SPARK} s={20} /></span>
              <div className="min-w-0 flex-1">
                <p className="text-[13px] font-semibold text-[#0b2a5c]">{`AI จำแนกเป็น “${doc.type}”`}</p>
                <div className="mt-[4px] flex items-center gap-[8px]"><span className="h-[6px] w-[120px] overflow-hidden rounded-full bg-white"><span className={`block h-full rounded-full ${doc.confidence >= 0.85 ? 'bg-[#17a673]' : 'bg-[#e3a008]'}`} style={{ width: `${doc.confidence * 100}%` }} /></span><span className="text-[11px] text-gray-30">{`ความมั่นใจ ${Math.round(doc.confidence * 100)}%${doc.confidence < 0.85 ? ' · กรุณาตรวจสอบ' : ''}`}</span></div>
              </div>
              <span className="text-[11px] font-light text-gray-30">{`กรอกให้แล้ว ${ai.filter((k) => k !== 'type').length} ช่อง`}</span>
            </section>

            <section className="flex flex-col gap-[14px] rounded-[16px] border border-gray-line-2 bg-white p-[18px]">
              <h2 className="text-[15px] font-semibold">ข้อมูลเอกสาร</h2>
              <div className="grid grid-cols-2 gap-[12px] max-sm:grid-cols-1">
                <F label="ประเภทเอกสาร" req ai={isAi('type')}><Select label="ประเภทเอกสาร" value={type} options={docTypes.map((d) => ({ value: d, label: d }))} onChange={(v) => { setType(v); setAi(ai.filter((x) => x !== 'type')); setRoute(routesFor[v][0]) }} /></F>
                <F label="เลขที่เอกสาร" req ai={isAi('docNo')} error={errors.docNo}><input aria-label="เลขที่เอกสาร" disabled={locked} className={`${ctl} font-urbanist ${errors.docNo ? err : ''}`} value={f.docNo} onChange={(e) => set('docNo', e.target.value)} /></F>
                <F label="วันที่ออกเอกสาร" req ai={isAi('issueDate')} error={errors.issueDate}><input type="date" aria-label="วันที่ออกเอกสาร" disabled={locked} className={`${ctl} ${errors.issueDate ? err : ''}`} value={f.issueDate} onChange={(e) => set('issueDate', e.target.value)} /></F>
                {medical ? (
                  <>
                    <F label="สถานพยาบาล" req ai={isAi('hospital')} error={errors.hospital}><input aria-label="สถานพยาบาล" disabled={locked} className={`${ctl} ${errors.hospital ? err : ''}`} value={f.hospital ?? ''} onChange={(e) => set('hospital', e.target.value)} /></F>
                    <F label="ชื่อผู้ป่วย" ai={isAi('patient')}><input aria-label="ชื่อผู้ป่วย" disabled={locked} className={ctl} value={f.patient ?? ''} onChange={(e) => set('patient', e.target.value)} /></F>
                    <F label="หยุดพักรักษาตัว (วัน)" ai={isAi('restDays')}><input inputMode="numeric" aria-label="หยุดพักรักษาตัว" disabled={locked} className={`${ctl} font-urbanist`} value={f.restDays ?? 0} onChange={(e) => set('restDays', Number(e.target.value.replace(/\D/g, '')) || 0)} /></F>
                    <F label="การวินิจฉัย" req wide ai={isAi('diagnosis')} error={errors.diagnosis}><input aria-label="การวินิจฉัย" disabled={locked} className={`${ctl} ${errors.diagnosis ? err : ''}`} value={f.diagnosis ?? ''} onChange={(e) => set('diagnosis', e.target.value)} /></F>
                  </>
                ) : (
                  <>
                    <F label={letter ? 'หน่วยงานผู้ส่ง' : 'ผู้ติดต่อ / ผู้ออกเอกสาร'} req ai={isAi('contact')} error={errors.contact}><input aria-label="ผู้ติดต่อ" disabled={locked} className={`${ctl} ${errors.contact ? err : ''}`} value={f.contact} onChange={(e) => set('contact', e.target.value)} /></F>
                    {!letter && <F label="เลขประจำตัวผู้เสียภาษี" ai={isAi('taxId')} error={errors.taxId}><input inputMode="numeric" aria-label="เลขประจำตัวผู้เสียภาษี" maxLength={13} disabled={locked} className={`${ctl} font-urbanist ${errors.taxId ? err : ''}`} value={f.taxId} onChange={(e) => set('taxId', e.target.value.replace(/\D/g, ''))} /></F>}
                    {!letter && <F label="ประเภทราคา" req ai={isAi('priceType')}><Select label="ประเภทราคา" value={f.priceType} options={priceTypes.map((p) => ({ value: p, label: p }))} onChange={(v) => set('priceType', v)} /></F>}
                  </>
                )}
              </div>
            </section>

            {!letter && (
              <section className="flex flex-col gap-[10px] rounded-[16px] border border-gray-line-2 bg-white p-[18px]">
                <div className="flex items-center"><h2 className="flex-1 text-[15px] font-semibold">{medical ? 'ค่ารักษาพยาบาล' : 'รายการ'}</h2>{isAi('lines') && <span className="flex items-center gap-[3px] rounded-full bg-[#eaf2ff] px-[8px] py-[2px] text-[10px] font-medium text-[#1650c8]"><Ic d={SPARK} s={10} w={2} />อ่านจากเอกสาร</span>}</div>
                <div className="overflow-x-auto">
                  <table className="w-full min-w-[460px] text-[12px]">
                    <thead className="text-[11px] text-gray-20"><tr><th className="pb-[6px] text-left font-normal">คำอธิบายรายการ</th><th className="w-[70px] pb-[6px] text-right font-normal">จำนวน</th><th className="w-[110px] pb-[6px] text-right font-normal">ราคา/หน่วย</th><th className="w-[110px] pb-[6px] text-right font-normal">จำนวนเงิน</th><th className="w-[30px]" /></tr></thead>
                    <tbody>
                      {f.lines.map((l, i) => (
                        <tr key={i}>
                          <td className="py-[3px] pr-[6px]"><input aria-label={`คำอธิบายรายการ ${i + 1}`} disabled={locked} className={`${ctl} h-[36px] ${errors[`ld${i}`] ? err : ''}`} value={l.desc} onChange={(e) => setLine(i, { desc: e.target.value })} /></td>
                          <td className="py-[3px] pr-[6px]"><input inputMode="numeric" aria-label={`จำนวน ${i + 1}`} disabled={locked} className={`${ctl} h-[36px] text-right font-urbanist`} value={l.qty} onChange={(e) => setLine(i, { qty: Number(e.target.value.replace(/\D/g, '')) || 0 })} /></td>
                          <td className="py-[3px] pr-[6px]"><input inputMode="decimal" aria-label={`ราคาต่อหน่วย ${i + 1}`} disabled={locked} className={`${ctl} h-[36px] text-right font-urbanist ${errors[`lp${i}`] ? err : ''}`} value={l.price || ''} onChange={(e) => setLine(i, { price: Number(e.target.value.replace(/[^\d.]/g, '')) || 0 })} /></td>
                          <td className="py-[3px] text-right font-urbanist font-medium">{money(l.qty * l.price)}</td>
                          <td className="py-[3px] text-right">{!locked && f.lines.length > 1 && <button type="button" aria-label={`ลบรายการ ${i + 1}`} onClick={() => set('lines', f.lines.filter((_, j) => j !== i))} className="text-[15px] text-gray-20 hover:text-[#c13232]">×</button>}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
                {!locked && <button type="button" onClick={() => set('lines', [...f.lines, { desc: '', qty: 1, price: 0 }])} className="self-start text-[12px] font-medium text-blue-00 hover:underline">+ เพิ่มรายการ</button>}
                <dl className="ml-auto grid w-[280px] grid-cols-[1fr_auto] gap-y-[4px] text-[12px] max-sm:w-full">
                  {!medical && <><dt className="text-gray-30">รวมเป็นเงิน</dt><dd className="text-right font-urbanist">{money(tt.sub)}</dd><dt className="text-gray-30">ภาษีมูลค่าเพิ่ม 7%</dt><dd className="text-right font-urbanist">{money(tt.vat)}</dd></>}
                  <dt className="border-t border-gray-line-2 pt-[6px] font-semibold">จำนวนเงินทั้งสิ้น</dt><dd className="border-t border-gray-line-2 pt-[6px] text-right font-urbanist text-[16px] font-semibold text-blue-dark">{money(medical ? tt.sub : tt.net)}</dd>
                </dl>
              </section>
            )}

            <section className="flex flex-col gap-[12px] rounded-[16px] border border-gray-line-2 bg-white p-[18px]">
              <F label="แท็ก" ai={isAi('tags')}>
                <div className="flex flex-wrap gap-[6px] p-[2px]">{docTags.map((t) => { const on = f.tags.includes(t); return <button key={t} type="button" disabled={locked} aria-pressed={on} onClick={() => set('tags', on ? f.tags.filter((x) => x !== t) : [...f.tags, t])} className={`rounded-full px-[12px] py-[5px] text-[12px] transition ${on ? 'bg-blue-00 text-white' : 'bg-gray-bg text-gray-30 hover:bg-blue-bg hover:text-blue-00'}`}>{t}</button> })}</div>
              </F>
              <F label="คำอธิบายเพิ่มเติม"><input aria-label="คำอธิบายเพิ่มเติม" disabled={locked} placeholder="เช่น ใช้ประกอบโครงการ / เหตุผลการเบิก" className={ctl} value={f.note} onChange={(e) => set('note', e.target.value)} /></F>
            </section>

            <section aria-label="ส่งต่อเอกสาร" className="flex flex-col gap-[10px] rounded-[16px] border border-gray-line-2 bg-white p-[18px]">
              <h2 className="flex items-center gap-[8px] text-[15px] font-semibold">ส่งต่อไปยังงานที่เกี่ยวข้อง<span className="flex items-center gap-[3px] rounded-full bg-[#eaf2ff] px-[8px] py-[2px] text-[10px] font-medium text-[#1650c8]"><Ic d={SPARK} s={10} w={2} />AI แนะนำ</span></h2>
              <div role="radiogroup" aria-label="งานที่จะส่งต่อ" className="grid grid-cols-2 gap-[8px] max-sm:grid-cols-1">
                {routesFor[type].map((r, i) => { const on = route?.fn === r.fn; return (
                  <button key={r.fn} type="button" role="radio" aria-checked={on} disabled={locked} onClick={() => setRoute(r)} className={`flex items-start gap-[10px] rounded-[12px] border p-[12px] text-left transition ${on ? 'border-blue-00 bg-blue-bg/60 ring-1 ring-blue-00' : 'border-gray-line-2 hover:border-blue-20'}`}>
                    <span className={`mt-[2px] flex size-[16px] shrink-0 items-center justify-center rounded-full border ${on ? 'border-blue-00' : 'border-gray-10'}`}>{on && <span className="size-[8px] rounded-full bg-blue-00" />}</span>
                    <span><p className="text-[11px] font-semibold text-blue-00">{r.sys}{i === 0 && <span className="ml-[6px] rounded-full bg-[#dff5e8] px-[6px] py-[1px] text-[10px] text-[#0f8a63]">แนะนำ</span>}</p><p className="text-[13px] font-medium">{r.fn}</p></span>
                  </button>
                ) })}
              </div>
              {errors.route && <p role="alert" className="text-[11px] text-red-00">{errors.route}</p>}
            </section>

            <div className="flex flex-wrap justify-end gap-[8px]">
              <Btn kind="ghost" onClick={() => navigate('/edoc')}>{locked ? 'กลับคลังเอกสาร' : 'ยกเลิก'}</Btn>
              {!locked && <Btn kind="outline" onClick={saveDraft}>บันทึกร่าง</Btn>}
              {!locked ? <Btn onClick={confirm}>ยืนยัน</Btn> : doc.routedTo && <Link to={doc.routedTo.to} className="flex h-[40px] items-center rounded-[8px] bg-blue-00 px-[22px] text-[13px] font-medium text-white">{`เปิด ${doc.routedTo.fn}`}</Link>}
            </div>
          </div>
        </div>
      </div>

      <Modal open={done} onClose={() => navigate('/edoc')} title="บันทึกและส่งต่อเอกสารแล้ว" width="max-w-[460px]">
        <div className="flex flex-col items-center gap-[10px] text-center">
          <span className="flex size-[56px] items-center justify-center rounded-full bg-[#dff5e8] text-[#0f8a63]"><Ic d="M5 12l5 5 9-10" s={28} w={2.4} /></span>
          <p className="text-[14px] font-semibold">{`${type} ${f.docNo}`}</p>
          <p className="text-[13px] font-light text-gray-30">{`ระบบส่งแบบฟอร์มเข้าสู่ ${route?.sys} · ${route?.fn} พร้อมแนบเอกสารต้นฉบับแล้ว`}</p>
          <div className="flex gap-[8px]">
            <Link to="/edoc" className="flex h-[38px] items-center rounded-[8px] border border-gray-line px-[16px] text-[13px]">กลับคลังเอกสาร</Link>
            {route && <Link to={route.to} className="flex h-[38px] items-center rounded-[8px] bg-blue-00 px-[16px] text-[13px] font-medium text-white">เปิดแบบฟอร์มปลายทาง</Link>}
          </div>
        </div>
      </Modal>
      {toast}
    </div>
  )
}
