import { useRef, useState, type ReactNode } from 'react'
import DigitBoxes from '../community/DigitBoxes'
import Modal from '../ui/Modal'
import { fullName, hPersonas, otpCode, reqStatus, type HPersona, type ReqStatus } from '../../data/erpHr'
import { setHPersona, useHPersona, useMe } from '../../lib/hrStore'
import { Btn, Row, Section, ctl } from '../strategic/Parts'

export { Btn, Crumbs, Gate, Radios, Row, Section, Title, ctl, err, page, ta } from '../strategic/Parts'
export { card } from '../saraban/Parts'
export const ro = `${ctl} bg-gray-bg text-gray-30`

export function HPersonaSwitch() {
  const me = useHPersona()
  return (
    <label className="flex items-center gap-[8px] rounded-[8px] bg-blue-bg px-[10px] py-[4px] text-[11px] text-gray-30">
      <span className="font-light max-sm:hidden">ดูในฐานะ</span>
      <select aria-label="ดูในฐานะผู้ใช้งาน" value={me} onChange={(e) => setHPersona(e.target.value as HPersona)} className="max-w-[210px] cursor-pointer bg-transparent py-[4px] text-[12px] font-medium text-blue-00 outline-none">
        {(Object.keys(hPersonas) as HPersona[]).map((p) => <option key={p} value={p}>{hPersonas[p].short}</option>)}
      </select>
    </label>
  )
}

export const RStatus = ({ s }: { s: ReqStatus }) => <span className={`inline-flex rounded-[6px] px-[10px] py-[3px] text-[11px] leading-[normal] font-medium whitespace-nowrap ${reqStatus[s].tone}`}>{reqStatus[s].label}</span>
export const Pill = ({ children, tone }: { children: ReactNode; tone: string }) => <span className={`inline-flex rounded-[6px] px-[10px] py-[3px] text-[11px] leading-[normal] font-medium whitespace-nowrap ${tone}`}>{children}</span>

/** "ข้อมูลพนักงาน" — pulled from the HR master, not editable (book 3 §2.1.6.1–2.1.6.5) */
export function EmpInfo({ title = 'ข้อมูลพนักงาน', children, action }: { title?: string; children?: ReactNode; action?: ReactNode }) {
  const me = useMe()
  return (
    <Section title={title} action={action}>
      <Row label="ชื่อ-นามสกุล"><input aria-label="ชื่อ-นามสกุล" readOnly className={ro} value={fullName(me)} /></Row>
      <Row label="ตำแหน่ง"><input aria-label="ตำแหน่ง" readOnly className={ro} value={me.position} /></Row>
      <Row label="สำนัก"><input aria-label="สำนัก" readOnly className={ro} value={me.dept} /></Row>
      {children}
    </Section>
  )
}

/** file / image / link evidence: type a link or pick a file (only the name is kept in this mockup) */
export function FileField({ label, value, onChange, error, disabled }: { label: string; value: string; onChange: (v: string) => void; error?: string; disabled?: boolean }) {
  const f = useRef<HTMLInputElement>(null)
  return (
    <div className="flex flex-col gap-[3px]">
      <div className="flex gap-[8px]">
        <input aria-label={label} placeholder="แนบไฟล์ รูปภาพ หรือวางลิงก์" disabled={disabled} className={`${ctl} ${error ? 'border-red-00' : ''}`} value={value} onChange={(e) => onChange(e.target.value)} />
        <input ref={f} type="file" hidden aria-label={`เลือกไฟล์ ${label}`} onChange={(e) => { const n = e.target.files?.[0]?.name; if (n) onChange(n); e.target.value = '' }} />
        <button type="button" aria-label={`แนบไฟล์ ${label}`} disabled={disabled} onClick={() => f.current?.click()} className="flex size-[40px] shrink-0 items-center justify-center rounded-[8px] border border-gray-line text-gray-20 hover:border-blue-00 hover:text-blue-00 disabled:opacity-40">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="m20 11-8.5 8.5a5 5 0 0 1-7-7L13 4a3.5 3.5 0 0 1 5 5l-8.5 8.5a2 2 0 0 1-3-3L14 7" /></svg>
        </button>
      </div>
      {error && <span role="alert" className="text-[11px] text-red-00">{error}</span>}
    </div>
  )
}

/** big drag & drop area ("นำเข้าเอกสาร") — keeps the dropped file names */
export function DropZone({ files, onChange, label = 'นำเข้าเอกสาร' }: { files: string[]; onChange: (f: string[]) => void; label?: string }) {
  const f = useRef<HTMLInputElement>(null)
  const [over, setOver] = useState(false)
  const add = (list: FileList | null) => list && onChange([...files, ...Array.from(list).map((x) => x.name)])
  return (
    <div className="flex flex-col gap-[6px]">
      <button type="button" aria-label={label} onClick={() => f.current?.click()} onDragOver={(e) => { e.preventDefault(); setOver(true) }} onDragLeave={() => setOver(false)} onDrop={(e) => { e.preventDefault(); setOver(false); add(e.dataTransfer.files) }} className={`flex min-h-[110px] flex-col items-center justify-center gap-[6px] rounded-[12px] border-2 border-dashed text-[12px] transition ${over ? 'border-blue-00 bg-blue-bg' : 'border-gray-line bg-[#fafbfc] text-gray-20 hover:border-blue-00'}`}>
        <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="#0085f9" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M12 16V4M7 9l5-5 5 5M4 20h16" /></svg>
        <span className="font-medium text-blue-00">{label}</span>
        <span>ลากไฟล์มาวาง หรือคลิกเพื่อเลือกไฟล์</span>
      </button>
      <input ref={f} type="file" multiple hidden aria-label={`เลือกไฟล์ ${label}`} onChange={(e) => { add(e.target.files); e.target.value = '' }} />
      {files.length > 0 && <ul className="flex flex-wrap gap-[6px]">{files.map((n, i) => <li key={i} className="flex items-center gap-[6px] rounded-full bg-blue-bg px-[10px] py-[3px] text-[11px] text-blue-dark">{n}<button type="button" aria-label={`ลบไฟล์ ${n}`} onClick={() => onChange(files.filter((_, j) => j !== i))} className="text-gray-20 hover:text-[#c13232]">×</button></li>)}</ul>}
    </div>
  )
}

/** 6-digit OTP confirmation (book 3 fig 2-35) */
export function OtpModal({ open, onClose, onOk, what }: { open: boolean; onClose: () => void; onOk: () => void; what: string }) {
  const [code, setCode] = useState('')
  const [err, setErr] = useState('')
  const [ref] = useState(() => Math.random().toString(36).slice(2, 8).toUpperCase())
  const ok = () => {
    if (code !== otpCode) return setErr('รหัส OTP ไม่ถูกต้อง')
    setCode(''); setErr(''); onOk()
  }
  return (
    <Modal open={open} onClose={onClose} title="กรุณายืนยันรหัส OTP 6 หลัก" width="max-w-[440px]">
      <p className="text-center text-[12px] font-light text-gray-30">{`รหัสอ้างอิง ${ref} · ยืนยันเพื่อ${what}`}</p>
      <div className="flex flex-col items-center gap-[8px]">
        <DigitBoxes value={code} groups={[6]} onChange={(v) => { setCode(v); setErr('') }} label="รหัส OTP" invalid={!!err} />
        {err && <p role="alert" className="text-[12px] text-red-00">{err}</p>}
        <p className="text-[11px] font-light text-gray-20">{'รหัสตัวอย่างสำหรับทดลอง: '}<b className="font-urbanist font-semibold">{otpCode}</b></p>
      </div>
      <div className="flex justify-end gap-[8px]">
        <Btn kind="ghost" onClick={onClose}>ยกเลิก</Btn>
        <Btn onClick={ok} disabled={code.length < 6}>ยืนยัน</Btn>
      </div>
    </Modal>
  )
}

/** download a small HTML document as a Word file (หนังสือรับรอง / สลิป) */
export function downloadDoc(name: string, html: string) {
  const blob = new Blob([`<html><head><meta charset="utf-8"></head><body style="font-family:'TH Sarabun New',Tahoma">${html}</body></html>`], { type: 'application/msword' })
  const a = document.createElement('a')
  a.href = URL.createObjectURL(blob)
  a.download = name
  a.click()
  URL.revokeObjectURL(a.href)
}
export function downloadCsv(name: string, rows: (string | number)[][]) {
  const csv = '﻿' + rows.map((r) => r.map((c) => `"${String(c).replace(/"/g, '""')}"`).join(',')).join('\r\n')
  const a = document.createElement('a')
  a.href = URL.createObjectURL(new Blob([csv], { type: 'text/csv;charset=utf-8' }))
  a.download = name
  a.click()
  URL.revokeObjectURL(a.href)
}
