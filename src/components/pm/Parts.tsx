import { useState, type ReactNode } from 'react'
import { projectStatusLabel, type ProjectStatus } from '../../data/projects'
import { setPmRole, usePmRole } from '../../lib/projectStore'

/** Standard page padding (same as the other full-width pages) */
export const pmPage = 'flex w-full flex-col gap-[12px] px-[24px] pb-[55px] max-sm:px-[12px] max-sm:pb-[25px]'
/** Read-only / disabled input look from Figma (gray fill) */
export const roField = 'h-[46px] w-full rounded-[8px] border border-gray-line bg-gray-bg px-[14px] text-[14px] leading-[normal] font-light text-black outline-none'

/** Demo switch between the community applicant view and the OSS staff view (Figma shows both) */
export function RoleSwitch() {
  const role = usePmRole()
  const opt = (r: 'community' | 'staff', label: string) => (
    <button
      type="button"
      role="radio"
      aria-checked={role === r}
      onClick={() => setPmRole(r)}
      className={`rounded-[6px] px-[12px] py-[6px] text-[12px] leading-[normal] font-medium whitespace-nowrap transition-colors focus-visible:outline-2 focus-visible:outline-blue-00 ${role === r ? 'bg-blue-00 text-white-soft' : 'text-blue-00 hover:bg-white/70'}`}
    >
      {label}
    </button>
  )
  return (
    <div role="radiogroup" aria-label="สลับมุมมอง" className="flex items-center gap-[2px] rounded-[8px] bg-blue-bg p-[3px]">
      <span className="px-[8px] text-[11px] font-light text-gray-20 max-sm:hidden">มุมมอง</span>
      {opt('community', 'ชุมชน')}
      {opt('staff', 'เจ้าหน้าที่')}
    </div>
  )
}

const tone: Record<ProjectStatus, string> = {
  draft: 'bg-blue-20 text-blue-00',
  submitted: 'bg-blue-20 text-blue-00',
  approved: 'bg-yellow text-gray-bg',
  open: 'bg-green text-gray-bg',
  closing: 'bg-[#ff9f43] text-gray-bg',
  closed: 'bg-gray-10 text-gray-bg',
}
export function ProjectBadge({ status }: { status: ProjectStatus }) {
  return <span className={`inline-flex min-w-[88px] justify-center rounded-[6px] px-[8px] py-[4px] text-[12px] leading-[normal] font-light whitespace-nowrap ${tone[status]}`}>{projectStatusLabel[status]}</span>
}

/** Blue header bar with a white body that can be folded (Figma section cards) */
export function PmSection({ title, children, action, defaultOpen = true }: { title: string; children: ReactNode; action?: ReactNode; defaultOpen?: boolean }) {
  const [open, setOpen] = useState(defaultOpen)
  return (
    <section className="flex flex-col gap-[8px] rounded-[12px] bg-blue-bg p-[8px]">
      <div className="flex items-center gap-[8px] px-[8px] py-[4px]">
        <h2 className="min-w-0 flex-1 text-[14px] leading-[normal] font-semibold text-black">{title}</h2>
        {action}
        <button type="button" aria-expanded={open} aria-label={open ? `ย่อ ${title}` : `ขยาย ${title}`} onClick={() => setOpen((v) => !v)} className="flex size-[24px] items-center justify-center rounded-[6px] text-blue-00 hover:bg-white/70">
          <svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" className={open ? '' : 'rotate-180'} aria-hidden="true">
            <path d="m4 10 4-4 4 4" />
          </svg>
        </button>
      </div>
      {open && <div className="rounded-[12px] bg-white p-[20px] max-sm:p-[12px]">{children}</div>}
    </section>
  )
}

export function Req() {
  return <span className="text-red-00"> *</span>
}

export const fmtBaht = (s: string | number) => (Number(String(s).replace(/,/g, '')) || 0).toLocaleString('en-US', { minimumFractionDigits: 0, maximumFractionDigits: 2 })
export const toNum = (s: string) => Number(String(s).replace(/,/g, '')) || 0

/** Word (.doc) from HTML — opens in Microsoft Word (TOR 5.9) */
export function downloadDoc(name: string, title: string, body: string) {
  const html = `<html><head><meta charset="utf-8"><title>${title}</title><style>body{font-family:'TH Sarabun New',Tahoma,sans-serif;font-size:16pt;line-height:1.5}h1{font-size:20pt;text-align:center}</style></head><body>${body}</body></html>`
  const a = document.createElement('a')
  a.href = URL.createObjectURL(new Blob(['﻿' + html], { type: 'application/msword' }))
  a.download = `${name}.doc`
  a.click()
  URL.revokeObjectURL(a.href)
}
export const esc = (s: string) => s.replace(/[&<>]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;' })[c]!).replace(/\n/g, '<br>')
