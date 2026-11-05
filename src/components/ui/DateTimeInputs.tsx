import { useCallback, useRef, useState } from 'react'
import calLeft from '../../assets/builder/icon-cal-left.svg'
import calRight from '../../assets/builder/icon-cal-right.svg'
import iconCalendar from '../../assets/builder/icon-calendar.svg'
import iconClock from '../../assets/builder/icon-clock.svg'
import useDismiss from './useDismiss'

const months = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December']
const days = ['SUN', 'MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT']
const pad = (n: number) => String(n).padStart(2, '0')
const toIso = (d: Date) => `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`

const field =
  'flex h-[45px] w-full items-center gap-[6px] rounded-[8px] border border-gray-line bg-white px-[14px] text-left text-[14px] leading-[normal] font-light text-black transition-colors hover:border-gray-10 focus-visible:border-blue-00 focus-visible:outline-none aria-expanded:border-blue-00 disabled:cursor-not-allowed disabled:bg-gray-subtle disabled:text-gray-10 disabled:hover:border-gray-line'
const pop = 'absolute top-[calc(100%+6px)] left-0 z-40 animate-[menu-in_120ms_ease-out] rounded-[12px] border border-gray-line bg-white drop-shadow-[0px_4px_10px_rgba(0,0,0,0.25)]'

/** Figma Elements › Calendar (120:7346) month grid. Value is YYYY-MM-DD. */
export function CalendarPanel({ value, onPick }: { value: string; onPick: (iso: string) => void }) {
  const selected = value ? new Date(`${value}T00:00:00`) : null
  const [view, setView] = useState(() => selected ?? new Date())
  const first = new Date(view.getFullYear(), view.getMonth(), 1)
  const start = new Date(first)
  start.setDate(1 - first.getDay())
  const cells = Array.from({ length: 42 }, (_, i) => new Date(start.getFullYear(), start.getMonth(), start.getDate() + i))
  const todayIso = toIso(new Date())
  return (
    <div className="flex flex-col gap-[10px]">
      <div className="flex items-center gap-[12px]">
        <p className="flex-1 text-[16px] font-medium text-blue-00">
          {months[view.getMonth()]} {view.getFullYear()}
        </p>
        <div className="flex gap-[24px]">
          {[
            [-1, calLeft, 'เดือนก่อน'],
            [1, calRight, 'เดือนถัดไป'],
          ].map(([d, icon, l]) => (
            <button
              key={l as string}
              type="button"
              aria-label={l as string}
              onClick={() => setView(new Date(view.getFullYear(), view.getMonth() + (d as number), 1))}
              className="rounded-[6px] hover:bg-gray-subtle"
            >
              <img src={icon as string} alt="" width={24} height={24} />
            </button>
          ))}
        </div>
      </div>
      <div className="h-px bg-gray-line" />
      <div className="grid grid-cols-7 gap-y-[10px]">
        {days.map((d) => (
          <span key={d} className="py-[6px] text-center text-[10px] font-medium text-gray-20">
            {d}
          </span>
        ))}
        {cells.map((c) => {
          const iso = toIso(c)
          const off = c.getMonth() !== view.getMonth()
          const isSel = iso === value
          return (
            <button
              key={iso}
              type="button"
              onClick={() => onPick(iso)}
              aria-pressed={isSel}
              className="flex h-[32px] items-center justify-center rounded-[10px] text-[12px] font-light transition-colors hover:bg-blue-bg"
            >
              <span
                className={`flex size-[24px] items-center justify-center rounded-full ${
                  isSel ? 'bg-blue-00 text-white' : iso === todayIso ? 'text-blue-00 ring-1 ring-blue-20' : off ? 'text-[#b8b1a9]' : 'text-black'
                }`}
              >
                {c.getDate()}
              </span>
            </button>
          )
        })}
      </div>
    </div>
  )
}

/** Figma Elements › Calendar (120:7346) as a popover date field. Value is YYYY-MM-DD. */
export function DateInput({ value, onChange, label, placeholder = 'ว/ด/ป', icon = iconCalendar, disabled }: { value: string; onChange: (v: string) => void; label: string; placeholder?: string; icon?: string; disabled?: boolean }) {
  const [open, setOpen] = useState(false)
  const root = useRef<HTMLDivElement>(null)
  const close = useCallback(() => setOpen(false), [])
  useDismiss(open, root, close)

  return (
    <div ref={root} className="relative w-full">
      <button type="button" aria-label={label} aria-expanded={open} disabled={disabled} onClick={() => setOpen((v) => !v)} className={field}>
        <img src={icon} alt="" width={18} height={18} className="my-[2px]" />
        <span className={`flex-1 p-[2px] ${value ? '' : 'text-gray-20'}`}>{value || placeholder}</span>
      </button>
      {open && (
        <div role="dialog" aria-label={`เลือก${label}`} className={`${pop} w-[310px] p-[24px]`}>
          <CalendarPanel
            value={value}
            onPick={(iso) => {
              onChange(iso)
              setOpen(false)
            }}
          />
        </div>
      )}
    </div>
  )
}

/** Figma Elements › Clock (123:7049): hour / minute columns. Value is HH:mm. */
export function TimeInput({ value, onChange, label, icon = iconClock, disabled }: { value: string; onChange: (v: string) => void; label: string; icon?: string; disabled?: boolean }) {
  const [open, setOpen] = useState(false)
  const root = useRef<HTMLDivElement>(null)
  const close = useCallback(() => setOpen(false), [])
  useDismiss(open, root, close)
  const [h, m] = (value || '00:00').split(':').map(Number)
  const col = (n: number, max: number, set: (v: number) => void, l: string) => (
    <div role="listbox" aria-label={l} className="flex h-[160px] w-[48px] snap-y flex-col overflow-y-auto scrollbar-none">
      {Array.from({ length: max }, (_, i) => (
        <button
          key={i}
          type="button"
          role="option"
          aria-selected={i === n}
          ref={(el) => {
            if (el && i === n && open) el.scrollIntoView({ block: 'center' })
          }}
          onClick={() => set(i)}
          className={`h-[32px] shrink-0 snap-center rounded-[8px] text-[12px] font-light transition-colors ${i === n ? 'bg-blue-bg font-medium text-blue-00' : 'text-gray-10 hover:text-black'}`}
        >
          {pad(i)}
        </button>
      ))}
    </div>
  )
  return (
    <div ref={root} className="relative w-full">
      <button type="button" aria-label={label} aria-expanded={open} disabled={disabled} onClick={() => setOpen((v) => !v)} className={field}>
        <img src={icon} alt="" width={18} height={18} className="my-[2px]" />
        <span className="flex-1 p-[2px]">{value || '--:--'}</span>
      </button>
      {open && (
        <div role="dialog" aria-label={`เลือก${label}`} className={`${pop} flex items-center gap-[4px] p-[12px]`}>
          {col(h, 24, (v) => onChange(`${pad(v)}:${pad(m)}`), 'ชั่วโมง')}
          <span className="text-[12px] text-gray-20">:</span>
          {col(m, 60, (v) => onChange(`${pad(h)}:${pad(v)}`), 'นาที')}
        </div>
      )}
    </div>
  )
}
