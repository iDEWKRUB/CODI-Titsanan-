import { useEffect, type ReactNode } from 'react'
import iconX from '../../assets/builder/icon-x.svg'
import iconSquares from '../../assets/dashboard/icon-squares-four-blue.svg'

type Props = { open: boolean; title: string; onClose: () => void; children: ReactNode; icon?: string; width?: string }

/** Figma Elements › Popup/Default (123:7531). */
export default function Modal({ open, title, onClose, children, icon = iconSquares, width = 'max-w-[456px]' }: Props) {
  useEffect(() => {
    if (!open) return
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && onClose()
    document.addEventListener('keydown', onKey)
    return () => document.removeEventListener('keydown', onKey)
  }, [open, onClose])
  if (!open) return null
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-[16px]" onClick={onClose}>
      <div
        role="dialog"
        aria-modal="true"
        aria-label={title}
        onClick={(e) => e.stopPropagation()}
        className={`flex w-full ${width} animate-[menu-in_120ms_ease-out] flex-col gap-[24px] rounded-[12px] bg-white p-[24px] shadow-2xl`}
      >
        <div className="flex items-center gap-[12px]">
          <img src={icon} alt="" width={24} height={24} />
          <h2 className="min-w-0 flex-1 text-[20px] leading-[1.2] font-semibold text-blue-00">{title}</h2>
          <button
            type="button"
            autoFocus
            onClick={onClose}
            aria-label="ปิด"
            className="flex size-[28px] items-center justify-center rounded-[5px] p-[2px] transition-colors hover:bg-gray-subtle focus-visible:outline-2 focus-visible:outline-blue-00"
          >
            <img src={iconX} alt="" width={24} height={24} />
          </button>
        </div>
        {children}
      </div>
    </div>
  )
}
