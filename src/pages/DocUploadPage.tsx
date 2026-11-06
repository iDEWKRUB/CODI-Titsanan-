import { useEffect, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Btn, Crumbs, Ic, Title, page } from '../components/asset/Parts'
import { drawDoc, readDocument, samples } from '../data/erpDoc'
import { stamp } from '../data/strategic'
import { edocs, livePreview } from '../lib/docStore'
import { aPersonas } from '../data/erpAsset'

type Pick = { name: string; mime: string; size: number; src: string; sample?: string; file?: File }
const ACCEPT = ['image/jpeg', 'image/png', 'image/webp', 'application/pdf']
const MAX = 10 * 1024 * 1024
const kb = (n: number) => (n > 1024 * 1024 ? `${(n / 1024 / 1024).toFixed(1)} MB` : `${Math.max(1, Math.round(n / 1024))} KB`)

/** shrink a photo to a JPEG that fits localStorage */
const shrink = (file: File): Promise<string> =>
  new Promise((res) => {
    const r = new FileReader()
    r.onload = () => { const img = new Image(); img.onload = () => { const k = Math.min(1, 900 / Math.max(img.width, img.height)); const c = document.createElement('canvas'); c.width = Math.round(img.width * k); c.height = Math.round(img.height * k); c.getContext('2d')!.drawImage(img, 0, 0, c.width, c.height); res(c.toDataURL('image/jpeg', 0.78)) }; img.onerror = () => res(''); img.src = String(r.result) }
    r.readAsDataURL(file)
  })

const STEPS = ['อัปโหลดไฟล์เข้าสู่ระบบ', 'อ่านข้อความด้วย OCR', 'AI จำแนกประเภทเอกสาร', 'สร้างแบบฟอร์มและกรอกข้อมูลอัตโนมัติ']

/** นำเข้าเอกสาร (book 3 fig 2-71) — 2.1.11.2 */
export default function DocUploadPage() {
  const navigate = useNavigate()
  const input = useRef<HTMLInputElement>(null)
  const [picks, setPicks] = useState<Pick[]>([])
  const [over, setOver] = useState(false)
  const [error, setError] = useState('')
  const [run, setRun] = useState(-1)

  const add = async (list: FileList | null) => {
    if (!list) return
    setError('')
    const bad = Array.from(list).filter((f) => !ACCEPT.includes(f.type) || f.size > MAX)
    if (bad.length) setError(`ไม่รองรับ ${bad.map((b) => b.name).join(', ')} — รองรับ JPG PNG WEBP PDF ขนาดไม่เกิน 10 MB`)
    const ok = await Promise.all(Array.from(list).filter((f) => ACCEPT.includes(f.type) && f.size <= MAX).map(async (f) => ({ name: f.name, mime: f.type, size: f.size, src: f.type === 'application/pdf' ? URL.createObjectURL(f) : await shrink(f), file: f })))
    setPicks((p) => [...p, ...ok].slice(0, 5))
  }
  const addSample = (key: string) => {
    const s = samples.find((x) => x.key === key)!
    const r = readDocument(s.label, key)
    setPicks((p) => [...p, { name: `${s.label}.jpg`, mime: 'image/svg+xml', size: 182_000 + key.length * 9000, src: drawDoc(r.type, r.f), sample: key }].slice(0, 5))
  }

  // the pipeline: each step ~0.8s, then open the record screen of the first document
  useEffect(() => {
    if (run < 0) return
    if (run < STEPS.length) { const t = window.setTimeout(() => setRun(run + 1), run === 1 ? 1200 : 800); return () => clearTimeout(t) }
    const ids = picks.map((p) => {
      const id = edocs.next()
      const r = readDocument(p.name, p.sample)
      edocs.save({ id, name: p.name, type: r.type, status: 'ร่าง', uploadedAt: stamp(), preview: p.mime === 'application/pdf' ? '' : p.src, mime: p.mime, confidence: r.confidence, ocr: r.ocr, f: r.f, aiKeys: r.aiKeys, by: aPersonas.staff.name })
      if (p.mime === 'application/pdf') livePreview.set(id, p.src)
      return id
    })
    navigate(`/edoc/record?id=${ids[0]}${ids.length > 1 ? `&more=${ids.length - 1}` : ''}`)
  }, [run]) // eslint-disable-line react-hooks/exhaustive-deps

  return (
    <div className={`${page} items-center`}>
      <div className="flex w-full max-w-[820px] flex-col gap-[12px]">
        <Title back="/edoc">นำเข้าเอกสาร</Title>
        <Crumbs items={[{ label: 'หน้าแรก', to: '/edoc' }, { label: 'คลังเอกสาร', to: '/edoc' }, { label: 'นำเข้าเอกสาร' }]} />

        <button type="button" aria-label="พื้นที่อัปโหลดเอกสาร" onClick={() => input.current?.click()} onDragOver={(e) => { e.preventDefault(); setOver(true) }} onDragLeave={() => setOver(false)} onDrop={(e) => { e.preventDefault(); setOver(false); add(e.dataTransfer.files) }}
          className={`group flex min-h-[300px] flex-col items-center justify-center gap-[12px] rounded-[22px] border-2 border-dashed p-[24px] text-center transition ${over ? 'scale-[1.01] border-blue-00 bg-blue-bg' : 'border-blue-20 bg-[linear-gradient(180deg,#fbfdff,#f1f6ff)] hover:border-blue-00'}`}>
          <span className="flex size-[76px] items-center justify-center rounded-[22px] bg-white text-blue-00 shadow-[0_10px_30px_rgba(0,90,200,0.15)] transition group-hover:-translate-y-[3px]"><Ic d="M12 16V4M7 9l5-5 5 5M4 20h16" s={34} w={1.6} /></span>
          <span className="text-[17px] font-semibold text-blue-dark">ลากไฟล์มาวางที่นี่ หรือคลิกเพื่อเลือกไฟล์</span>
          <span className="text-[12px] font-light text-gray-30">รองรับ JPG PNG WEBP และ PDF · ไม่เกิน 10 MB ต่อไฟล์ · ครั้งละไม่เกิน 5 ไฟล์</span>
          <span className="flex flex-wrap justify-center gap-[6px]">{['ใบเสร็จรับเงิน', 'ใบกำกับภาษี', 'ใบแจ้งหนี้', 'ใบรับรองแพทย์', 'หนังสือภายนอก'].map((x) => <span key={x} className="rounded-full bg-white px-[10px] py-[3px] text-[11px] text-gray-30 ring-1 ring-gray-line-2">{x}</span>)}</span>
        </button>
        <input ref={input} type="file" multiple accept={ACCEPT.join(',')} hidden aria-label="เลือกไฟล์เอกสาร" onChange={(e) => { add(e.target.files); e.target.value = '' }} />
        {error && <p role="alert" className="rounded-[10px] bg-[#fff1f1] px-[14px] py-[8px] text-[12px] text-[#c13232]">{error}</p>}

        <div className="flex flex-wrap items-center gap-[8px] text-[12px] text-gray-30">
          <span className="font-light">ไม่มีไฟล์ใกล้มือ? ลองด้วยเอกสารตัวอย่าง:</span>
          {samples.map((s) => <button key={s.key} type="button" onClick={() => addSample(s.key)} className="rounded-full border border-blue-20 bg-white px-[12px] py-[5px] text-[12px] font-medium text-blue-00 hover:bg-blue-bg">{`+ ${s.label}`}</button>)}
        </div>

        {picks.length > 0 && (
          <ul aria-label="ไฟล์ที่เลือก" className="grid grid-cols-[repeat(auto-fill,minmax(150px,1fr))] gap-[12px]">
            {picks.map((p, i) => (
              <li key={i} className="relative flex flex-col gap-[6px] rounded-[14px] border border-gray-line-2 bg-white p-[8px]">
                {p.mime === 'application/pdf' ? <span className="flex h-[150px] flex-col items-center justify-center rounded-[8px] bg-[#fdecec] font-urbanist text-[13px] font-bold text-[#c13232]"><Ic d="M7 3h7l4 4v14H7ZM14 3v4h4" s={30} />PDF</span> : <img src={p.src} alt="" className="h-[150px] w-full rounded-[8px] bg-gray-bg object-cover object-top" />}
                <span className="truncate text-[12px] font-medium" title={p.name}>{p.name}</span>
                <span className="text-[11px] font-light text-gray-20">{`${p.mime.includes('pdf') ? 'PDF' : 'รูปภาพ'} · ${kb(p.size)}`}</span>
                <button type="button" aria-label={`นำ ${p.name} ออก`} onClick={() => setPicks(picks.filter((_, j) => j !== i))} className="absolute top-[12px] right-[12px] flex size-[26px] items-center justify-center rounded-full bg-white/95 text-[15px] text-[#c13232] shadow ring-1 ring-gray-line">×</button>
              </li>
            ))}
          </ul>
        )}

        <div className="flex justify-end gap-[8px]">
          <Btn kind="ghost" onClick={() => navigate('/edoc')}>ยกเลิก</Btn>
          <Btn disabled={!picks.length} onClick={() => setRun(0)}>{`นำเข้าเอกสาร${picks.length ? ` (${picks.length})` : ''}`}</Btn>
        </div>
      </div>

      {run >= 0 && (
        <div className="fixed inset-0 z-[70] flex items-center justify-center bg-[#061633]/55 p-[16px] backdrop-blur-[2px]">
          <div role="dialog" aria-modal="true" aria-label="กำลังประมวลผลเอกสาร" className="w-full max-w-[460px] animate-[menu-in_160ms_ease-out] rounded-[22px] bg-white p-[26px] shadow-[0_30px_80px_rgba(0,20,70,0.35)]">
            <div className="relative mx-auto mb-[16px] h-[120px] w-[92px] overflow-hidden rounded-[8px] bg-white shadow-[0_6px_20px_rgba(0,30,90,0.18)] ring-1 ring-gray-line-2">
              {picks[0] && picks[0].mime !== 'application/pdf' ? <img src={picks[0].src} alt="" className="size-full object-cover object-top" /> : <span className="flex size-full items-center justify-center bg-[#fdecec] font-urbanist text-[12px] font-bold text-[#c13232]">PDF</span>}
              <span className="absolute inset-x-0 h-[26px] animate-[scan_1.4s_ease-in-out_infinite] bg-[linear-gradient(180deg,transparent,rgba(0,133,249,0.35),transparent)]" />
            </div>
            <p className="text-center text-[16px] font-semibold text-blue-dark">กำลังประมวลผลเอกสาร</p>
            <p className="mb-[16px] text-center text-[12px] font-light text-gray-30">{`${picks.length} ไฟล์ · ใช้เวลาไม่กี่วินาที`}</p>
            <ol className="flex flex-col gap-[10px]" aria-live="polite">
              {STEPS.map((s, i) => (
                <li key={s} className="flex items-center gap-[10px] text-[13px]">
                  {run > i ? <span className="flex size-[22px] items-center justify-center rounded-full bg-[#17a673] text-white"><Ic d="M5 12l5 5 9-10" s={12} w={3} /></span> : run === i ? <span className="size-[22px] animate-spin rounded-full border-[3px] border-blue-bg border-t-blue-00" /> : <span className="size-[22px] rounded-full border-2 border-gray-line" />}
                  <span className={run > i ? 'text-black' : run === i ? 'font-medium text-blue-00' : 'font-light text-gray-20'}>{s}</span>
                </li>
              ))}
            </ol>
            <div className="mt-[16px] h-[6px] overflow-hidden rounded-full bg-blue-bg"><div className="h-full rounded-full bg-[linear-gradient(90deg,#1650c8,#3dc2fb)] transition-[width] duration-700" style={{ width: `${Math.min(100, (run / STEPS.length) * 100)}%` }} /></div>
          </div>
        </div>
      )}
    </div>
  )
}
