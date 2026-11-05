import { useCallback, useEffect, useRef, useState, type ReactNode } from 'react'
import { useNavigate } from 'react-router-dom'
import iconArrowLeft from '../../assets/builder/icon-arrow-left.svg'
import iconPen from '../../assets/survey/icon-pen.svg'
import { scoreLabel, type Score } from '../../data/leader'
import Modal from '../ui/Modal'

export const page = 'flex w-full flex-col gap-[12px] px-[24px] pb-[55px] max-sm:px-[12px] max-sm:pb-[25px]'
export const primaryBtn =
  'flex items-center justify-center gap-[6px] rounded-[8px] bg-blue-00 px-[12px] py-[10px] text-[14px] leading-[normal] font-medium whitespace-nowrap text-white-soft transition hover:brightness-110 active:brightness-95 disabled:cursor-not-allowed disabled:bg-gray-10 disabled:hover:brightness-100 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-00'
export const softBtn =
  'flex items-center justify-center gap-[6px] rounded-[8px] bg-blue-bg px-[12px] py-[10px] text-[14px] leading-[normal] font-medium whitespace-nowrap text-blue-00 transition-colors hover:bg-blue-20 disabled:cursor-not-allowed disabled:text-gray-10 focus-visible:outline-2 focus-visible:outline-blue-00'

export function BackTitle({ title, to, actions }: { title: string; to: string; actions?: ReactNode }) {
  const navigate = useNavigate()
  return (
    <div className="flex items-center gap-[10px] pb-[12px]">
      <button type="button" aria-label="ย้อนกลับ" onClick={() => navigate(to)} className="flex shrink-0 rounded-[8px] bg-blue-bg p-[8px] transition-colors hover:bg-blue-20">
        <img src={iconArrowLeft} alt="" width={16} height={16} />
      </button>
      <h1 className="min-w-0 flex-1 truncate text-[20px] leading-[1.2] font-semibold text-blue-00">{title}</h1>
      {actions && <div className="flex shrink-0 items-center gap-[8px]">{actions}</div>}
    </div>
  )
}

export function SegTabs<K extends string>({ tabs, value, onChange }: { tabs: { key: K; label: string; mark?: boolean }[]; value: K; onChange: (k: K) => void }) {
  return (
    <div role="tablist" className="flex gap-[4px] overflow-x-auto rounded-[10px] bg-blue-bg p-[4px] scrollbar-none">
      {tabs.map((t) => (
        <button
          key={t.key}
          role="tab"
          type="button"
          aria-selected={t.key === value}
          onClick={() => onChange(t.key)}
          className={`relative flex h-[32px] min-w-[120px] flex-1 items-center justify-center rounded-[7px] px-[12px] text-[12px] leading-[normal] font-medium whitespace-nowrap transition-colors focus-visible:outline-2 focus-visible:outline-blue-00 ${
            t.key === value ? 'bg-blue-00 text-white-soft' : 'text-blue-00 hover:bg-white/60'
          }`}
        >
          {t.label}
          {t.mark && <span aria-label="มีข้อมูลที่ต้องแก้" className="absolute top-[6px] right-[8px] size-[7px] rounded-full bg-red" />}
        </button>
      ))}
    </div>
  )
}

/** blue-gray board with a title and a white card inside (Figma "Section" containers) */
export function Board({ title, children, bare }: { title?: string; children: ReactNode; bare?: boolean }) {
  return (
    <section className="flex flex-col gap-[8px] rounded-[12px] bg-blue-gray p-[8px]">
      {title && <h2 className="px-[8px] pt-[4px] text-[14px] leading-[normal] font-semibold text-black">{title}</h2>}
      {bare ? children : <div className="rounded-[12px] bg-white p-[16px] max-sm:p-[12px]">{children}</div>}
    </section>
  )
}

export function CourseBanner({ name }: { name: string }) {
  return (
    <div className="rounded-[12px] bg-[#7cc9f5] p-[8px]">
      <p className="rounded-[10px] bg-white px-[16px] py-[14px] text-[14px] leading-[1.5] font-light text-black">
        <b className="font-semibold">หลักสูตร : </b>
        {name || '–'}
      </p>
    </div>
  )
}

/** Title / description shown as text with a pen to edit in place (Figma Create Plan) */
export function EditableText({ value, onChange, placeholder, big, label }: { value: string; onChange: (v: string) => void; placeholder: string; big?: boolean; label: string }) {
  const [edit, setEdit] = useState(false)
  const ref = useRef<HTMLInputElement>(null)
  useEffect(() => {
    if (edit) ref.current?.select()
  }, [edit])
  const text = big ? 'text-[24px] leading-[1.3] font-semibold text-black' : 'text-[12px] leading-[normal] font-light text-gray-20'
  return (
    <div className="flex items-center gap-[8px]">
      {edit ? (
        <input
          ref={ref}
          aria-label={label}
          value={value}
          placeholder={placeholder}
          onChange={(e) => onChange(e.target.value)}
          onBlur={() => setEdit(false)}
          onKeyDown={(e) => (e.key === 'Enter' || e.key === 'Escape') && setEdit(false)}
          className={`min-w-0 flex-1 rounded-[8px] border border-blue-00 bg-white px-[10px] py-[4px] outline-none ${big ? 'text-[20px] font-semibold' : 'text-[14px]'}`}
        />
      ) : (
        <button type="button" onClick={() => setEdit(true)} aria-label={`แก้ไข${label}`} className={`min-w-0 truncate text-left ${text} ${value ? '' : 'opacity-70'}`}>
          {value || placeholder}
        </button>
      )}
      {!edit && (
        <button type="button" aria-label={`แก้ไข${label}`} onClick={() => setEdit(true)} className="flex shrink-0 rounded-[6px] p-[4px] opacity-60 transition hover:bg-blue-bg hover:opacity-100">
          <img src={iconPen} alt="" width={16} height={16} />
        </button>
      )}
    </div>
  )
}

const scoreTone: Record<Score, string> = { pass: 'bg-green text-white-soft', fail: 'bg-red text-white-soft', wait: 'bg-yellow text-white-soft' }
/** Pre/Post-test badge; a hidden native <select> over it changes the result */
export function ScoreSelect({ value, onChange, label }: { value: Score; onChange: (s: Score) => void; label: string }) {
  return (
    <label className={`relative inline-flex h-[22px] w-[92px] cursor-pointer items-center justify-center rounded-[6px] text-[11px] leading-[normal] font-light whitespace-nowrap transition hover:brightness-105 focus-within:outline-2 focus-within:outline-blue-00 ${scoreTone[value]}`}>
      {scoreLabel[value]}
      <select aria-label={label} value={value} onChange={(e) => onChange(e.target.value as Score)} className="absolute inset-0 cursor-pointer opacity-0">
        {(Object.keys(scoreLabel) as Score[]).map((s) => (
          <option key={s} value={s}>
            {scoreLabel[s]}
          </option>
        ))}
      </select>
    </label>
  )
}

export function ConfirmDialog({ open, title, text, confirm = 'ยืนยัน', danger, onConfirm, onClose }: { open: boolean; title: string; text: ReactNode; confirm?: string; danger?: boolean; onConfirm: () => void; onClose: () => void }) {
  return (
    <Modal open={open} title={title} onClose={onClose}>
      <p className="text-[14px] leading-[1.6] font-light text-gray-30">{text}</p>
      <div className="flex justify-end gap-[8px]">
        <button type="button" onClick={onClose} className="rounded-[8px] bg-gray-bg px-[14px] py-[8px] text-[12px] font-medium text-gray-30 transition-colors hover:bg-gray-line">
          ยกเลิก
        </button>
        <button type="button" onClick={onConfirm} className={`rounded-[8px] px-[14px] py-[8px] text-[12px] font-medium text-white-soft transition hover:brightness-110 ${danger ? 'bg-red-00' : 'bg-blue-00'}`}>
          {confirm}
        </button>
      </div>
    </Modal>
  )
}

export function useToast() {
  const [msg, setMsg] = useState<string>()
  useEffect(() => {
    if (!msg) return
    const t = setTimeout(() => setMsg(undefined), 2600)
    return () => clearTimeout(t)
  }, [msg])
  const show = useCallback((m: string) => setMsg(m), [])
  const node = (
    <div aria-live="polite" className="pointer-events-none fixed bottom-[24px] left-1/2 z-[60] -translate-x-1/2">
      {msg && <div className="animate-[menu-in_120ms_ease-out] rounded-[10px] bg-gray-30 px-[16px] py-[10px] text-[13px] text-white shadow-lg">{msg}</div>}
    </div>
  )
  return [node, show] as const
}

export const lbl = 'text-[14px] leading-[normal] font-medium text-ink opacity-90'
export function Field({ label, children, error }: { label: string; children: ReactNode; error?: string }) {
  return (
    <label className="flex min-w-0 flex-col gap-[6px]">
      <span className={lbl}>{label}</span>
      {children}
      {error && <span role="alert" className="text-[12px] font-light text-red-00">{error}</span>}
    </label>
  )
}
