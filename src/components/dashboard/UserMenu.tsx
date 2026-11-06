import { useEffect, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { toneOf, useActingUser } from '../../lib/actingUser'
import type { User } from '../../lib/auth'

type Props = { user: User; onLogout: () => void }

/** Name + avatar trigger with the "User/Dropdown/Default" popover (Figma 126:9470). */
export default function UserMenu({ onLogout }: Props) {
  const me = useActingUser()
  const [bg, fg] = toneOf(me.name, me.isSelf)
  const [open, setOpen] = useState(false)
  const root = useRef<HTMLDivElement>(null)
  const navigate = useNavigate()

  useEffect(() => {
    if (!open) return
    const onDown = (e: PointerEvent) => !root.current?.contains(e.target as Node) && setOpen(false)
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && setOpen(false)
    document.addEventListener('pointerdown', onDown)
    document.addEventListener('keydown', onKey)
    return () => {
      document.removeEventListener('pointerdown', onDown)
      document.removeEventListener('keydown', onKey)
    }
  }, [open])

  const item =
    'flex h-[46px] w-full items-center rounded-[8px] px-[14px] pt-[8px] pb-[2px] text-left text-[14px] leading-[normal] font-light whitespace-nowrap text-black transition-colors hover:bg-blue-bg focus-visible:bg-blue-bg focus-visible:outline-none'

  return (
    <div ref={root} className="relative">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-haspopup="menu"
        aria-expanded={open}
        aria-label={`เมนูผู้ใช้งาน: ${me.name} (${me.role})`}
        className="flex items-center gap-[12px] rounded-[32px] transition-opacity hover:opacity-85 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-00"
      >
        <span className="hidden max-w-[150px] flex-col text-right leading-[1.25] md:flex"><span className="truncate text-[12px] text-heading">{me.name}</span><span className="truncate text-[10px] font-light text-gray-20">{me.role}</span></span>
        <span title={me.name} style={{ background: bg, color: fg }} className={`flex size-[40px] shrink-0 items-center justify-center overflow-hidden rounded-[32px] p-[2px] leading-[1.2] ${me.isSelf ? 'font-poppins text-[16px] tracking-[0.64px]' : 'text-[15px] font-medium'}`}>
          {me.photo ? <img src={me.photo} alt="" className="size-full rounded-full object-cover" /> : me.initials}
        </span>
      </button>

      {open && (
        <div
          role="menu"
          className="absolute top-[calc(100%+8px)] right-0 z-50 flex w-[139px] origin-top-right animate-[menu-in_120ms_ease-out] flex-col rounded-[12px] bg-white px-[4px] py-[8px] drop-shadow-[0px_4px_10px_rgba(0,0,0,0.15)]"
        >
          <button
            type="button"
            role="menuitem"
            autoFocus
            className={item}
            onClick={() => {
              setOpen(false)
              navigate('/profile')
            }}
          >
            ตั้งค่าผู้ใช้งาน
          </button>
          <button type="button" role="menuitem" className={item} onClick={onLogout}>
            ออกจากระบบ
          </button>
        </div>
      )}
    </div>
  )
}
