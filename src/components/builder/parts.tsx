import { useCallback, useRef, useState, type ReactNode } from 'react'
import check from '../../assets/builder/icon-check.svg'
import iconCopy from '../../assets/builder/icon-copy-card.svg'
import iconDots from '../../assets/builder/icon-dots.svg'
import iconImage from '../../assets/builder/icon-image.svg'
import iconPen from '../../assets/builder/icon-pen.svg'
import iconTrash from '../../assets/builder/icon-trash-card.svg'
import iconCaretUp from '../../assets/builder/icon-caret-up.svg'
import Toggle from '../ui/Toggle'
import useDismiss from '../ui/useDismiss'

export const cardBase = 'flex flex-col rounded-[12px] bg-white transition-shadow'
/** Active question card: blue right edge + shadow (Figma Question Card/* in Elements) */
export const cardActive = 'border-r-[7px] border-blue-10 drop-shadow-[0px_4px_10px_rgba(0,0,0,0.15)]'
export const inputBase =
  'h-[45px] rounded-[8px] border border-gray-line bg-white px-[16px] text-[14px] leading-[normal] font-light text-black outline-none transition-colors placeholder:text-gray-20 hover:border-gray-10 focus:border-blue-00'

/** Text that looks like a heading but is editable in place, with the Figma pen affordance. */
export function InlineText({
  value,
  onChange,
  placeholder,
  label,
  variant = 'title',
}: {
  value: string
  onChange: (v: string) => void
  placeholder: string
  label: string
  variant?: 'title' | 'detail'
}) {
  const ref = useRef<HTMLTextAreaElement>(null)
  const cls =
    variant === 'title'
      ? 'text-[20px] leading-[1.2] font-semibold text-gray-30 placeholder:text-gray-30 min-h-[24px]'
      : 'text-[12px] leading-[normal] font-light text-gray-20 placeholder:text-gray-20 min-h-[18px]'
  return (
    <div className={`flex items-center ${variant === 'title' ? 'min-h-[28px] gap-[4px]' : 'min-h-[28px] gap-[12px]'}`}>
      {/* Grows with its content (field-sizing) so long Thai titles wrap instead of being cut */}
      <textarea
        ref={ref}
        rows={1}
        value={value}
        onChange={(e) => onChange(e.target.value.replace(/\n/g, ' '))}
        onKeyDown={(e) => e.key === 'Enter' && e.preventDefault()}
        placeholder={placeholder}
        aria-label={label}
        className={`max-w-full min-w-[4ch] resize-none overflow-hidden rounded-[4px] bg-transparent outline-none field-sizing-content focus:bg-gray-subtle ${cls}`}
      />
      <button type="button" aria-label={`แก้ไข${label}`} onClick={() => ref.current?.focus()} className="flex size-[28px] shrink-0 items-center justify-center rounded-[5px] p-[4px] hover:bg-gray-subtle">
        <img src={iconPen} alt="" width={20} height={20} />
      </button>
    </div>
  )
}

/** Dotted answer line used as the respondent preview ("พิมพ์คำตอบ...") */
export function AnswerLine({ placeholder = 'พิมพ์คำตอบ...', className = '' }: { placeholder?: string; className?: string }) {
  return (
    <div aria-hidden="true" className={`flex h-[48px] items-center border-b border-dashed border-gray-20 text-[14px] font-light text-gray-20 ${className}`}>
      {placeholder}
    </div>
  )
}

export type MenuItem = { label: string; onSelect: () => void; checked?: boolean; danger?: boolean }

/** ⋮ menu — Figma Conditon/Dropdown/Default|Active (120:3803 / 120:4385) */
export function KebabMenu({ items, label = 'ตัวเลือกเพิ่มเติม', size = 32 }: { items: MenuItem[]; label?: string; size?: number }) {
  const [open, setOpen] = useState(false)
  const root = useRef<HTMLDivElement>(null)
  const close = useCallback(() => setOpen(false), [])
  useDismiss(open, root, close)
  return (
    <div ref={root} className="relative shrink-0">
      <button
        type="button"
        aria-label={label}
        aria-haspopup="menu"
        aria-expanded={open}
        onClick={() => setOpen((v) => !v)}
        className="flex items-center justify-center rounded-[6px] transition-colors hover:bg-gray-subtle focus-visible:outline-2 focus-visible:outline-blue-00"
        style={{ width: size, height: size }}
      >
        <img src={iconDots} alt="" width={size} height={size} />
      </button>
      {open && (
        <ul role="menu" className="absolute top-[calc(100%+4px)] right-0 z-40 w-[260px] animate-[menu-in_120ms_ease-out] rounded-[12px] bg-white px-[4px] py-[12px] drop-shadow-[0px_4px_10px_rgba(0,0,0,0.15)]">
          {items.map((it) => (
            <li key={it.label} role="none">
              <button
                type="button"
                role="menuitem"
                onClick={() => {
                  it.onSelect()
                  setOpen(false)
                }}
                className={`flex h-[46px] w-full items-center gap-[14px] rounded-[6px] px-[14px] pt-[8px] pb-[2px] text-left text-[14px] font-light transition-colors hover:bg-blue-bg ${
                  it.danger ? 'text-red-00' : 'text-black'
                } ${it.checked ? 'bg-blue-bg' : ''}`}
              >
                <span className="flex-1">{it.label}</span>
                {it.checked && <img src={check} alt="" width={18} height={18} />}
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}

/** Card footer: copy · trash | จำเป็นต้องตอบ [toggle] ⋮ */
export function CardFooter({
  required,
  onRequired,
  onCopy,
  onDelete,
  menu,
}: {
  required?: boolean
  onRequired?: (v: boolean) => void
  onCopy?: () => void
  onDelete?: () => void
  menu?: MenuItem[]
}) {
  const btn = 'flex size-[24px] items-center justify-center rounded-[6px] transition-colors hover:bg-gray-subtle disabled:opacity-40 focus-visible:outline-2 focus-visible:outline-blue-00'
  return (
    <div className="flex items-center justify-end gap-[24px] border-t border-gray-line pt-[24px] max-sm:gap-[14px]">
      {onCopy && (
        <button type="button" aria-label="ทำสำเนา" title="ทำสำเนา" onClick={onCopy} className={btn}>
          <img src={iconCopy} alt="" width={24} height={24} />
        </button>
      )}
      {onDelete && (
        <button type="button" aria-label="ลบ" title="ลบ" onClick={onDelete} className={btn}>
          <img src={iconTrash} alt="" width={24} height={24} />
        </button>
      )}
      {onRequired && (
        <>
          <span aria-hidden="true" className="h-[20px] w-px bg-gray-line" />
          <span className="text-[11px] leading-[normal] font-light whitespace-nowrap text-black">จำเป็นต้องตอบ</span>
          <Toggle checked={!!required} onChange={onRequired} label="จำเป็นต้องตอบ" />
        </>
      )}
      {menu && menu.length > 0 ? <KebabMenu items={menu} /> : <span className="w-[32px]" />}
    </div>
  )
}

/** Board = grey-blue container with a collapsible header (ธีมของแบบสอบถาม, ส่วนที่ 1, …) */
export function Board({
  title,
  leading,
  open,
  onToggle,
  children,
  id,
  tone = 'blue-gray',
}: {
  title: ReactNode
  leading?: ReactNode
  open: boolean
  onToggle: () => void
  children: ReactNode
  id?: string
  tone?: 'blue-gray' | 'blue-10'
}) {
  return (
    <section id={id} className={`flex scroll-mt-[16px] flex-col gap-[24px] rounded-[12px] p-[12px] ${tone === 'blue-10' ? 'bg-blue-10' : 'bg-blue-gray'}`}>
      <div className="flex items-center gap-[10px]">
        {leading}
        <div className="min-w-0 flex-1 text-[16px] leading-[normal] font-medium text-[#000]">{title}</div>
        <button type="button" aria-expanded={open} aria-label={open ? 'ย่อส่วนนี้' : 'ขยายส่วนนี้'} onClick={onToggle} className="flex size-[24px] items-center justify-center rounded-[6px] hover:bg-white/60">
          <img src={iconCaretUp} alt="" width={24} height={24} className={`transition-transform ${open ? '' : 'rotate-180'}`} />
        </button>
      </div>
      {open && <div className="flex flex-col gap-[24px]">{children}</div>}
    </section>
  )
}

/** "เพิ่มรูปภาพ" button that reads a local image into a data URL (UI only — no upload yet). */
export function ImagePicker({ value, onChange, label }: { value?: string; onChange: (v?: string) => void; label: string }) {
  const input = useRef<HTMLInputElement>(null)
  return (
    <div className="flex items-center gap-[8px]">
      {value && (
        <span className="relative">
          <img src={value} alt={label} className="size-[45px] rounded-[8px] border border-gray-line object-cover" />
          <button
            type="button"
            aria-label={`ลบ${label}`}
            onClick={() => onChange(undefined)}
            className="absolute -top-[6px] -right-[6px] flex size-[18px] items-center justify-center rounded-full bg-gray-30 text-[11px] leading-none text-white"
          >
            ×
          </button>
        </span>
      )}
      <button
        type="button"
        onClick={() => input.current?.click()}
        className="flex h-[45px] items-center gap-[4px] rounded-[8px] border border-gray-line bg-white px-[12px] transition-colors hover:border-blue-10 focus-visible:outline-2 focus-visible:outline-blue-00"
      >
        <img src={iconImage} alt="" width={16} height={16} className="my-px" />
        <span className="p-[2px] text-[14px] font-medium whitespace-nowrap text-blue-00">{value ? 'เปลี่ยนรูปภาพ' : 'เพิ่มรูปภาพ'}</span>
      </button>
      <input
        ref={input}
        type="file"
        accept="image/*"
        aria-label={label}
        className="hidden"
        onChange={(e) => {
          const file = e.target.files?.[0]
          if (!file) return
          const r = new FileReader()
          r.onload = () => onChange(String(r.result))
          r.readAsDataURL(file)
          e.target.value = ''
        }}
      />
    </div>
  )
}
