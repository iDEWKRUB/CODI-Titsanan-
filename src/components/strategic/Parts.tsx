import type { ReactNode } from 'react'
import { personas, type Persona } from '../../data/strategic'
import { setPersona, usePersona } from '../../lib/strategicStore'
import { card, ctl } from '../saraban/Parts'

export { Crumbs, Title, ctl, lab, page } from '../saraban/Parts'
export const err = 'border-red-00'
export const ta = `${ctl} h-auto min-h-[96px] resize-y py-[10px] leading-[1.6]`

export function PersonaSwitch() {
  const me = usePersona()
  return (
    <label className="flex items-center gap-[8px] rounded-[8px] bg-blue-bg px-[10px] py-[4px] text-[11px] text-gray-30">
      <span className="font-light max-sm:hidden">ดูในฐานะ</span>
      <select aria-label="ดูในฐานะผู้ใช้งาน" value={me} onChange={(e) => setPersona(e.target.value as Persona)} className="cursor-pointer bg-transparent py-[4px] text-[12px] font-medium text-blue-00 outline-none">
        {(Object.keys(personas) as Persona[]).map((p) => (
          <option key={p} value={p}>
            {personas[p].short}
          </option>
        ))}
      </select>
    </label>
  )
}

/** Card with a heading, like the grey-outlined sections of the book's forms */
export function Section({ title, children, tone, action }: { title: string; children: ReactNode; tone?: 'blue'; action?: ReactNode }) {
  return (
    <section className={`flex flex-col gap-[14px] rounded-[12px] border p-[22px] max-sm:p-[14px] ${tone === 'blue' ? 'border-blue-20 bg-blue-bg/70' : 'border-gray-line-2 bg-white'}`}>
      <div className="flex items-center gap-[10px]">
        <h2 className="min-w-0 flex-1 text-[15px] font-semibold text-black">{title}</h2>
        {action}
      </div>
      {children}
    </section>
  )
}

/** Label on the left, control on the right (Figma ERP Strategic forms) */
export function Row({ label, req, children, error, hint }: { label: string; req?: boolean; children: ReactNode; error?: string; hint?: string }) {
  return (
    <div className="grid grid-cols-[150px_minmax(0,1fr)] items-start gap-x-[12px] max-md:grid-cols-1">
      <span className="pt-[10px] text-[12px] leading-[1.35] font-semibold text-black max-md:pt-0">
        {label}
        {req && <span className="text-red-00"> *</span>}
      </span>
      <div className="flex min-w-0 flex-col gap-[3px]">
        {children}
        {hint && !error && <span className="text-[11px] font-light text-gray-20">{hint}</span>}
        {error && <span role="alert" className="text-[11px] text-red-00">{error}</span>}
      </div>
    </div>
  )
}

export function Radios<T extends string>({ label, value, options, onChange, disabled }: { label: string; value: T; options: { key: T; label: string }[]; onChange: (v: T) => void; disabled?: boolean }) {
  return (
    <div role="radiogroup" aria-label={label} className="flex flex-wrap gap-x-[18px] gap-y-[6px] pt-[8px]">
      {options.map((o) => (
        <button key={o.key} type="button" role="radio" aria-checked={value === o.key} disabled={disabled} onClick={() => onChange(o.key)} className="flex items-center gap-[8px] text-[12px] font-light text-black focus-visible:outline-2 focus-visible:outline-blue-00 disabled:opacity-60">
          <span className={`flex size-[16px] items-center justify-center rounded-full border ${value === o.key ? 'border-blue-00' : 'border-gray-10'}`}>{value === o.key && <span className="size-[8px] rounded-full bg-blue-00" />}</span>
          {o.label}
        </button>
      ))}
    </div>
  )
}

/** Shown when the current persona may look at a page but not act on it (TOR 4.7-1 role-based access) */
export function Gate({ allowed, need, children }: { allowed: boolean; need: string; children?: ReactNode }) {
  if (allowed) return null
  return (
    <p role="status" className="flex flex-wrap items-center gap-[8px] rounded-[10px] border border-[#e3b341] bg-[#fffbea] px-[14px] py-[10px] text-[12px] text-[#8a6100]">
      หน้านี้ใช้ได้เฉพาะ <b className="font-semibold">{need}</b> — เปลี่ยน “ดูในฐานะ” ด้านบนเพื่อทดลอง (ระบบจริงใช้สิทธิ์จาก SSO)
      {children}
    </p>
  )
}

export function Btn({ children, onClick, kind = 'primary', disabled, type = 'button' }: { children: ReactNode; onClick?: () => void; kind?: 'primary' | 'ghost' | 'outline'; disabled?: boolean; type?: 'button' | 'submit' }) {
  const k = { primary: 'bg-blue-00 text-white hover:brightness-110', ghost: 'border border-gray-line bg-white hover:border-gray-10', outline: 'border border-blue-00 bg-white text-blue-00 hover:bg-blue-bg' }[kind]
  return (
    <button type={type} disabled={disabled} onClick={onClick} className={`h-[40px] rounded-[8px] px-[22px] text-[13px] font-medium transition disabled:opacity-40 ${k}`}>
      {children}
    </button>
  )
}
export { card }
