import { useCallback, useRef, useState, type ReactNode } from 'react'
import caretDown from '../../assets/builder/icon-caret-down.svg'
import check from '../../assets/builder/icon-check.svg'
import useDismiss from './useDismiss'

export type SelectOption<T extends string> = { value: T; label: string; icon?: string; divider?: boolean; disabled?: boolean }

type Props<T extends string> = {
  value: T | ''
  options: SelectOption<T>[]
  onChange: (v: T) => void
  label: string
  placeholder?: string
  /** Leading icon shown in the trigger (e.g. the question-type icon) */
  icon?: ReactNode
  tone?: 'white' | 'subtle'
  className?: string
  /** Show a check mark next to the selected item (Conditon/Dropdown/Active) */
  showCheck?: boolean
}

/**
 * Figma Item List Providers / Dropdown trigger + Question/Type/Dropdown popover (114:13181).
 * Keyboard: Enter/Space opens, arrows move, Escape closes.
 */
export default function Select<T extends string>({
  value,
  options,
  onChange,
  label,
  placeholder = 'เลือก',
  icon,
  tone = 'white',
  className = '',
  showCheck,
}: Props<T>) {
  const [open, setOpen] = useState(false)
  const root = useRef<HTMLDivElement>(null)
  const close = useCallback(() => setOpen(false), [])
  useDismiss(open, root, close)
  const current = options.find((o) => o.value === value)

  return (
    <div ref={root} className={`relative ${className}`}>
      <button
        type="button"
        aria-haspopup="listbox"
        aria-expanded={open}
        aria-label={label}
        onClick={() => setOpen((v) => !v)}
        onKeyDown={(e) => e.key === 'ArrowDown' && (e.preventDefault(), setOpen(true))}
        className={`flex h-[46px] w-full items-center gap-[14px] rounded-[8px] border border-gray-line-2 px-[14px] py-[12px] text-left transition-colors hover:border-gray-line focus-visible:border-blue-00 focus-visible:outline-none ${
          tone === 'subtle' ? 'bg-gray-subtle' : 'bg-white'
        }`}
      >
        {icon ?? (current?.icon && <img src={current.icon} alt="" width={18} height={18} className="shrink-0" />)}
        <span className={`min-w-0 flex-1 truncate text-[14px] leading-[normal] font-light ${current ? 'text-black' : 'text-black'}`}>
          {current?.label ?? placeholder}
        </span>
        <img src={caretDown} alt="" width={18} height={18} className={`shrink-0 transition-transform ${open ? 'rotate-180' : ''}`} />
      </button>

      {open && (
        <ul
          role="listbox"
          aria-label={label}
          className="absolute top-[calc(100%+6px)] left-0 z-40 flex max-h-[360px] w-full min-w-[220px] animate-[menu-in_120ms_ease-out] flex-col overflow-y-auto rounded-[12px] bg-white px-[4px] py-[12px] drop-shadow-[0px_4px_10px_rgba(0,0,0,0.15)]"
        >
          {options.map((o) => (
            <li key={o.value} role="none">
              {o.divider && <div aria-hidden="true" className="my-[7.5px] h-px bg-gray-line" />}
              <button
                type="button"
                role="option"
                aria-selected={o.value === value}
                disabled={o.disabled}
                aria-disabled={o.disabled || undefined}
                autoFocus={o.value === value}
                onClick={() => {
                  onChange(o.value)
                  setOpen(false)
                }}
                onKeyDown={(e) => {
                  const items = Array.from(e.currentTarget.closest('ul')?.querySelectorAll<HTMLButtonElement>('[role=option]') ?? [])
                  const i = items.indexOf(e.currentTarget)
                  if (e.key === 'ArrowDown') (e.preventDefault(), items[i + 1]?.focus())
                  if (e.key === 'ArrowUp') (e.preventDefault(), items[i - 1]?.focus())
                }}
                className={`flex h-[46px] w-full items-center gap-[14px] rounded-[6px] px-[14px] pt-[8px] pb-[2px] text-left text-[14px] leading-[normal] font-light whitespace-nowrap text-black transition-colors hover:bg-blue-bg focus-visible:bg-blue-bg focus-visible:outline-none disabled:cursor-not-allowed disabled:text-gray-10 disabled:hover:bg-transparent ${
                  o.value === value && !showCheck ? 'bg-blue-bg' : ''
                }`}
              >
                {o.icon && <img src={o.icon} alt="" width={18} height={18} className="shrink-0" />}
                <span className="flex-1">{o.label}</span>
                {showCheck && o.value === value && <img src={check} alt="" width={18} height={18} />}
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}
