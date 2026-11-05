import { useCallback, useRef, useState, type CSSProperties } from 'react'
import { useNavigate } from 'react-router-dom'
import iconEye from '../../assets/meeting/icon-eye.svg'
import { rsvpLabel, statusLabel, type Meeting, type Rsvp } from '../../data/meetings'
import { updateMeeting } from '../../lib/meetingStore'
import useDismiss from '../ui/useDismiss'

// Figma OSS-Meeting › Appointment Card / Appointment Details (163:7470, 163:7495, 163:7510)
const indicator = { completed: 'bg-[#059573]', canceled: 'bg-red-00', scheduled: 'bg-blue-10' }
const badge = {
  completed: 'bg-green font-medium text-green-bg',
  canceled: 'bg-red-20 font-light text-red-00',
  scheduled: 'bg-blue-20 font-medium text-blue-00',
}

/** The user's answer to the invitation; only open (scheduled) meetings can be answered. */
function RsvpButton({ m }: { m: Meeting }) {
  const [open, setOpen] = useState(false)
  const root = useRef<HTMLDivElement>(null)
  const close = useCallback(() => setOpen(false), [])
  useDismiss(open, root, close)
  const base = 'flex h-[28px] w-full items-center justify-center rounded-[7px] px-[10px] text-[10px] leading-[normal] font-light transition-colors'

  if (m.status !== 'scheduled')
    return (
      <span className={`${base} bg-gray-bg text-gray-20`} aria-label={`สถานะการตอบรับ ${rsvpLabel[m.rsvp]}`}>
        {rsvpLabel[m.rsvp]}
      </span>
    )

  const look: Record<Rsvp, string> = {
    requested: 'bg-blue-00 text-white-soft hover:brightness-110',
    accepted: 'border border-gray-line bg-white text-blue-00 hover:bg-blue-bg',
    rejected: 'bg-gray-bg text-gray-20 hover:bg-gray-line-2',
  }
  const pick = (rsvp: Rsvp) => {
    updateMeeting(m.id, (x) => ({ ...x, rsvp }))
    setOpen(false)
  }
  return (
    <div ref={root} className="relative w-full">
      <button type="button" aria-haspopup="menu" aria-expanded={open} aria-label={`ตอบรับคำเชิญ ${m.title} (ตอนนี้: ${rsvpLabel[m.rsvp]})`} onClick={() => setOpen((v) => !v)} className={`${base} ${look[m.rsvp]}`}>
        {rsvpLabel[m.rsvp]}
      </button>
      {open && (
        <div role="menu" className="absolute top-[calc(100%+4px)] left-0 z-30 w-full min-w-[150px] animate-[menu-in_120ms_ease-out] rounded-[10px] bg-white p-[4px] drop-shadow-[0px_4px_10px_rgba(0,0,0,0.15)]">
          {(
            [
              ['accepted', 'ตอบรับเข้าร่วม', 'text-[#059573]'],
              ['rejected', 'ปฏิเสธ', 'text-red-00'],
            ] as const
          ).map(([v, label, tone]) => (
            <button key={v} type="button" role="menuitemradio" aria-checked={m.rsvp === v} onClick={() => pick(v)} className={`flex h-[34px] w-full items-center gap-[8px] rounded-[6px] px-[10px] text-left text-[12px] font-medium hover:bg-blue-bg ${tone}`}>
              <span className={`size-[6px] rounded-full ${m.rsvp === v ? 'bg-current' : 'bg-transparent'}`} />
              {label}
            </button>
          ))}
        </div>
      )}
    </div>
  )
}

export default function AppointmentCard({ m, style, compact = false }: { m: Meeting; style?: CSSProperties; compact?: boolean }) {
  const navigate = useNavigate()
  const open = () => navigate(m.draft ? `/meeting/${m.id}/edit` : `/meeting/${m.id}`)
  const scheduled = m.status === 'scheduled'
  return (
    <article
      style={style}
      className={`flex gap-[12px] overflow-visible rounded-[12px] p-[12px] ${scheduled ? 'bg-[#f8f8f8]' : 'border border-gray-line bg-white'} ${compact ? '' : 'absolute'}`}
    >
      <span aria-hidden="true" className={`w-[4px] shrink-0 self-stretch rounded-[8px] ${indicator[m.status]}`} />
      <div className="flex min-w-0 flex-1 flex-col justify-between gap-[8px]">
        <button type="button" onClick={open} className="flex min-w-0 flex-col gap-[8px] text-left">
          <span className="truncate text-[12px] leading-[normal] font-medium text-[#181b20]">{m.org || 'ไม่ระบุหน่วยงาน'}</span>
          <span className={`truncate leading-[normal] text-[#545a66] ${scheduled ? 'text-[10px] font-medium' : 'text-[12px] font-light'}`}>{m.title || 'ยังไม่ตั้งหัวข้อเรื่อง'}</span>
        </button>
        <div className="flex items-center gap-[8px]">
          {m.draft ? (
            <span className="rounded-[6px] bg-blue-bg px-[8px] py-[4px] text-[12px] leading-[normal] font-light text-blue-00">แบบร่าง</span>
          ) : (
            <span className={`min-w-0 truncate rounded-[6px] px-[8px] py-[4px] text-[12px] leading-[normal] ${badge[m.status]}`}>{statusLabel[m.status]}</span>
          )}
          <button type="button" aria-label={`ดูรายละเอียด ${m.title}`} onClick={open} className="flex shrink-0 rounded-[6px] border border-gray-line p-[6px] transition-colors hover:bg-blue-bg">
            <img src={iconEye} alt="" width={12} height={12} />
          </button>
        </div>
        {!m.draft && <RsvpButton m={m} />}
      </div>
    </article>
  )
}
