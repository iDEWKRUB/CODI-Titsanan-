import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import iconCalendarBlank from '../assets/meeting/icon-calendar-blank.svg'
import iconCalendarDots from '../assets/meeting/icon-calendar-dots.svg'
import iconCaretDown from '../assets/meeting/icon-caret-down.svg'
import iconCaretLeft from '../assets/meeting/icon-caret-left.svg'
import iconCaretRight from '../assets/meeting/icon-caret-right.svg'
import iconPlus from '../assets/meeting/icon-plus.svg'
import AppointmentCard from '../components/meeting/AppointmentCard'
import { CalendarPanel } from '../components/ui/DateTimeInputs'
import PageTitle from '../components/ui/PageTitle'
import useDismiss from '../components/ui/useDismiss'
import { addDays, mondayOf, occursOn, toIso, type Meeting } from '../data/meetings'
import { useMeetings } from '../lib/meetingStore'

type View = 'day' | 'week' | 'month'
const views: [View, string][] = [
  ['day', 'วัน'],
  ['week', 'สัปดาห์'],
  ['month', 'เดือน'],
]
const thMonths = ['มกราคม', 'กุมภาพันธ์', 'มีนาคม', 'เมษายน', 'พฤษภาคม', 'มิถุนายน', 'กรกฎาคม', 'สิงหาคม', 'กันยายน', 'ตุลาคม', 'พฤศจิกายน', 'ธันวาคม']
const thShort = ['ม.ค.', 'ก.พ.', 'มี.ค.', 'เม.ย.', 'พ.ค.', 'มิ.ย.', 'ก.ค.', 'ส.ค.', 'ก.ย.', 'ต.ค.', 'พ.ย.', 'ธ.ค.']
const enDays = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday']
const be = (d: Date) => d.getFullYear() + 543

// Time grid (Figma: 150px per hour, "9:00 AM" labels)
const FIRST_HOUR = 7
const LAST_HOUR = 19
const HOUR_PX = 150
const minutes = (t: string) => {
  const [h, m] = t.split(':').map(Number)
  return h * 60 + m
}
const hourLabel = (h: number) => `${h % 12 === 0 ? 12 : h % 12}:00 ${h < 12 ? 'AM' : 'PM'}`

function rangeTitle(view: View, anchor: Date, days: Date[]) {
  if (view === 'day') return `${anchor.getDate()} ${thMonths[anchor.getMonth()]} ${be(anchor)}`
  if (view === 'month') return `${thMonths[anchor.getMonth()]} ${be(anchor)}`
  const a = days[0]
  const b = days[days.length - 1]
  if (a.getMonth() === b.getMonth()) return `${a.getDate()}-${b.getDate()} ${thMonths[a.getMonth()]} ${be(a)}`
  if (a.getFullYear() === b.getFullYear()) return `${a.getDate()} ${thShort[a.getMonth()]} - ${b.getDate()} ${thShort[b.getMonth()]} ${be(a)}`
  return `${a.getDate()} ${thShort[a.getMonth()]} ${be(a)} - ${b.getDate()} ${thShort[b.getMonth()]} ${be(b)}`
}

/** Side-by-side lanes for meetings that overlap in one day column */
function layoutDay(ms: Meeting[]) {
  const sorted = [...ms].sort((a, b) => minutes(a.start) - minutes(b.start))
  const lanes: number[] = []
  const placed = sorted.map((m) => {
    const s = m.allDay ? FIRST_HOUR * 60 : minutes(m.start)
    const e = m.allDay ? s + 60 : Math.max(minutes(m.end), s + 30)
    let lane = lanes.findIndex((end) => end <= s)
    if (lane === -1) lane = lanes.push(e) - 1
    else lanes[lane] = e
    return { m, s, e, lane }
  })
  return placed.map((p) => ({ ...p, lanes: Math.max(1, ...placed.filter((q) => q.s < p.e && q.e > p.s).map((q) => q.lane + 1)) }))
}

function TimeGrid({ days, meetings, today }: { days: Date[]; meetings: Meeting[]; today: string }) {
  const scroller = useRef<HTMLDivElement>(null)
  // open on 9:00 like the Figma frame
  useEffect(() => {
    scroller.current?.scrollTo({ top: (9 - FIRST_HOUR) * HOUR_PX - 8 })
  }, [])
  const hours = Array.from({ length: LAST_HOUR - FIRST_HOUR + 1 }, (_, i) => FIRST_HOUR + i)
  const height = (LAST_HOUR - FIRST_HOUR) * HOUR_PX + 40
  const col = days.length === 1 ? 'minmax(0,1fr)' : `repeat(${days.length}, minmax(180px, 1fr))`

  return (
    <div ref={scroller} className="h-[613px] overflow-auto rounded-[12px] border border-gray-line-2 bg-white px-[12px] max-sm:h-[70vh]">
      <div className="grid min-w-fit" style={{ gridTemplateColumns: `81px ${col}` }}>
        {/* Cell-Calendar-Head row (sticky) */}
        <div className="sticky top-0 z-20 flex h-[92px] items-center justify-center bg-white pt-[12px] pb-[8px]">
          <span className="text-[12px] font-light text-gray-30">UTC +7</span>
        </div>
        {days.map((d) => {
          const iso = toIso(d)
          const isToday = iso === today
          return (
            <div key={iso} className="sticky top-0 z-20 flex h-[92px] flex-col items-center justify-center gap-[4px] bg-white px-[6px] pt-[12px] pb-[8px] text-center">
              <span className={`text-[12px] font-light ${isToday ? 'text-blue-00' : 'text-gray-20'}`}>{enDays[d.getDay()]}</span>
              <span className={`flex size-[36px] items-center justify-center rounded-full text-[24px] leading-[1.1] font-medium ${isToday ? 'bg-blue-00 text-white' : 'text-ink'}`}>{d.getDate()}</span>
            </div>
          )
        })}

        {/* Y labels */}
        <div className="relative" style={{ height }}>
          {hours.map((h) => (
            <span key={h} className="absolute left-0 w-full -translate-y-1/2 px-[14px] text-[12px] font-light whitespace-nowrap text-gray-20" style={{ top: (h - FIRST_HOUR) * HOUR_PX + 20 }}>
              {hourLabel(h)}
            </span>
          ))}
        </div>
        {days.map((d) => {
          const iso = toIso(d)
          const placed = layoutDay(meetings.filter((m) => occursOn(m, iso)))
          return (
            <div key={iso} className="relative" style={{ height }}>
              {hours.map((h) => (
                <span key={h} aria-hidden="true" className="absolute inset-x-0 h-px bg-gray-line-2" style={{ top: (h - FIRST_HOUR) * HOUR_PX + 20 }} />
              ))}
              {placed.map(({ m, s, e, lane, lanes }) => {
                const top = ((s - FIRST_HOUR * 60) / 60) * HOUR_PX + 20 + 6
                const h = Math.max(((e - s) / 60) * HOUR_PX - 12, 136)
                return (
                  <AppointmentCard
                    key={m.id}
                    m={m}
                    style={
                      days.length === 1
                        ? // day view: fixed-width cards side by side instead of stretching across the page
                          { top, height: h, left: `calc(${lane} * min(${100 / lanes}%, 340px) + 8px)`, width: `calc(min(${100 / lanes}%, 340px) - 16px)`, zIndex: 10 + lane }
                        : { top, height: h, left: `calc(${(lane / lanes) * 100}% + 8px)`, width: `calc(${100 / lanes}% - 16px)`, zIndex: 10 + lane }
                    }
                  />
                )
              })}
            </div>
          )
        })}
      </div>
    </div>
  )
}

const dot = { completed: 'bg-[#059573]', canceled: 'bg-red-00', scheduled: 'bg-blue-10' }

function MonthGrid({ anchor, meetings, today, onPickDay }: { anchor: Date; meetings: Meeting[]; today: string; onPickDay: (d: Date) => void }) {
  const navigate = useNavigate()
  const start = mondayOf(new Date(anchor.getFullYear(), anchor.getMonth(), 1))
  const cells = Array.from({ length: 42 }, (_, i) => addDays(start, i))
  return (
    <div className="overflow-x-auto rounded-[12px] border border-gray-line-2 bg-white p-[12px]">
      <div className="grid min-w-[720px] grid-cols-7">
        {[1, 2, 3, 4, 5, 6, 0].map((d) => (
          <span key={d} className="pb-[8px] text-center text-[12px] font-light text-gray-20">
            {enDays[d]}
          </span>
        ))}
        {cells.map((c) => {
          const iso = toIso(c)
          const items = meetings.filter((m) => occursOn(m, iso)).sort((a, b) => a.start.localeCompare(b.start))
          const off = c.getMonth() !== anchor.getMonth()
          return (
            <div key={iso} className="flex min-h-[108px] flex-col gap-[4px] border-t border-gray-line-2 p-[6px]">
              <button
                type="button"
                onClick={() => onPickDay(c)}
                aria-label={`ดูวันที่ ${c.getDate()} ${thMonths[c.getMonth()]}`}
                className={`flex size-[26px] items-center justify-center self-end rounded-full text-[12px] font-medium transition-colors hover:bg-blue-bg ${iso === today ? 'bg-blue-00 text-white hover:bg-blue-00' : off ? 'text-gray-10' : 'text-ink'}`}
              >
                {c.getDate()}
              </button>
              {items.slice(0, 3).map((m) => (
                <button
                  key={m.id}
                  type="button"
                  onClick={() => navigate(m.draft ? `/meeting/${m.id}/edit` : `/meeting/${m.id}`)}
                  className="flex min-w-0 items-center gap-[6px] rounded-[6px] bg-[#f8f8f8] px-[6px] py-[4px] text-left transition-colors hover:bg-blue-bg"
                >
                  <span className={`size-[6px] shrink-0 rounded-full ${dot[m.status]}`} />
                  <span className="shrink-0 text-[10px] font-light text-gray-20">{m.allDay ? 'ทั้งวัน' : m.start}</span>
                  <span className={`truncate text-[10px] font-medium text-[#181b20] ${m.status === 'canceled' ? 'line-through opacity-60' : ''}`}>{m.title || 'ยังไม่ตั้งหัวข้อเรื่อง'}</span>
                </button>
              ))}
              {items.length > 3 && (
                <button type="button" onClick={() => onPickDay(c)} className="self-start px-[6px] text-[10px] font-medium text-blue-00 hover:underline">
                  อีก {items.length - 3} รายการ
                </button>
              )}
            </div>
          )
        })}
      </div>
    </div>
  )
}

/** Figma OSS-Meeting (130:11662) — meetings calendar, opened from Pinned › จัดการการประชุม */
export default function MeetingPage() {
  const meetings = useMeetings()
  const navigate = useNavigate()
  const location = useLocation()
  const [view, setView] = useState<View>(() => (window.innerWidth < 768 ? 'day' : 'week'))
  const [anchor, setAnchor] = useState(() => new Date())
  const [picking, setPicking] = useState(false)
  const picker = useRef<HTMLDivElement>(null)
  const closePicker = useCallback(() => setPicking(false), [])
  useDismiss(picking, picker, closePicker)
  const today = toIso(new Date())

  // e.g. "ส่งนัดการประชุมแล้ว" when coming back from the create page
  const [toast, setToast] = useState<string | undefined>((location.state as { toast?: string } | null)?.toast)
  useEffect(() => {
    if (!toast) return
    navigate(location.pathname, { replace: true, state: null })
    const t = setTimeout(() => setToast(undefined), 2600)
    return () => clearTimeout(t)
  }, [toast, navigate, location.pathname])

  const days = useMemo(() => {
    if (view === 'day') return [anchor]
    const mon = mondayOf(anchor)
    const week = Array.from({ length: 7 }, (_, i) => addDays(mon, i))
    // Figma shows Mon–Fri; weekend columns appear only when something is booked then
    const weekend = week.slice(5).filter((d) => meetings.some((m) => occursOn(m, toIso(d))))
    return [...week.slice(0, 5), ...weekend]
  }, [view, anchor, meetings])

  const step = (dir: 1 | -1) =>
    setAnchor((a) => (view === 'day' ? addDays(a, dir) : view === 'week' ? addDays(a, dir * 7) : new Date(a.getFullYear(), a.getMonth() + dir, 1)))

  const seg = 'flex h-[28px] items-center justify-center px-[10px] text-[10px] leading-[normal] font-light transition-colors'
  const iconBtn = 'flex rounded-[8px] border border-gray-line bg-white p-[10px] transition-colors hover:bg-blue-bg'

  return (
    <div className="flex flex-col gap-[12px] px-[24px] pb-[55px] max-sm:px-[12px] max-sm:pb-[25px]">
      <div className="flex items-center gap-[12px] pb-[12px]">
        <div className="min-w-0 flex-1">
          <PageTitle icon={iconCalendarDots}>จัดการการประชุม</PageTitle>
        </div>
        <button type="button" onClick={() => navigate('/meeting/create')} className="flex shrink-0 items-center gap-[4px] rounded-[8px] bg-blue-00 px-[10px] py-[8px] transition hover:brightness-110">
          <img src={iconPlus} alt="" width={14} height={14} className="my-px" />
          <span className="py-[2px] text-[12px] leading-[normal] font-medium text-white-soft">สร้างการประชุม</span>
        </button>
      </div>

      <div className="grid grid-cols-[1fr_auto_1fr] items-center gap-[12px] max-md:grid-cols-2">
        <div role="group" aria-label="มุมมองปฏิทิน" className="flex w-fit gap-px overflow-hidden rounded-[8px] bg-white-soft">
          {views.map(([v, label], i) => (
            <button
              key={v}
              type="button"
              aria-pressed={view === v}
              onClick={() => setView(v)}
              className={`${seg} ${i === 0 ? 'rounded-l-[7px]' : ''} ${i === views.length - 1 ? 'rounded-r-[7px]' : ''} ${view === v ? 'bg-blue-00 text-white-soft' : 'bg-blue-bg text-blue-00 hover:bg-blue-20'}`}
            >
              {label}
            </button>
          ))}
        </div>

        <div ref={picker} className="relative flex items-center justify-center gap-[12px] max-md:order-first max-md:col-span-2">
          <h2 className="text-[24px] leading-[1.1] font-semibold whitespace-nowrap text-black max-sm:text-[18px]">{rangeTitle(view, anchor, days)}</h2>
          <button type="button" aria-label="เลือกวันที่" aria-expanded={picking} onClick={() => setPicking((v) => !v)} className="flex rounded-[5px] p-[4px] transition-colors hover:bg-blue-bg">
            <img src={iconCaretDown} alt="" width={20} height={20} className={`transition-transform ${picking ? 'rotate-180' : ''}`} />
          </button>
          {picking && (
            <div role="dialog" aria-label="เลือกวันที่" className="absolute top-[calc(100%+8px)] left-1/2 z-40 w-[310px] -translate-x-1/2 animate-[menu-in_120ms_ease-out] rounded-[12px] border border-gray-line bg-white p-[24px] drop-shadow-[0px_4px_10px_rgba(0,0,0,0.25)]">
              <CalendarPanel
                value={toIso(anchor)}
                onPick={(iso) => {
                  setAnchor(new Date(`${iso}T00:00:00`))
                  setPicking(false)
                }}
              />
            </div>
          )}
        </div>

        <div className="flex items-center justify-end gap-[10px]">
          <button type="button" onClick={() => setAnchor(new Date())} className="flex items-center gap-[4px] rounded-[8px] border border-gray-line bg-white px-[10px] py-[8px] transition-colors hover:bg-blue-bg">
            <img src={iconCalendarBlank} alt="" width={14} height={14} className="my-px" />
            <span className="py-[2px] text-[12px] leading-[normal] font-medium text-blue-00">วันนี้</span>
          </button>
          <button type="button" aria-label={view === 'month' ? 'เดือนก่อน' : view === 'week' ? 'สัปดาห์ก่อน' : 'วันก่อน'} onClick={() => step(-1)} className={iconBtn}>
            <img src={iconCaretLeft} alt="" width={18} height={18} />
          </button>
          <button type="button" aria-label={view === 'month' ? 'เดือนถัดไป' : view === 'week' ? 'สัปดาห์ถัดไป' : 'วันถัดไป'} onClick={() => step(1)} className={iconBtn}>
            <img src={iconCaretRight} alt="" width={18} height={18} />
          </button>
        </div>
      </div>

      {view === 'month' ? (
        <MonthGrid
          anchor={anchor}
          meetings={meetings}
          today={today}
          onPickDay={(d) => {
            setAnchor(d)
            setView('day')
          }}
        />
      ) : (
        <TimeGrid key={`${view}-${toIso(days[0])}`} days={days} meetings={meetings} today={today} />
      )}

      <div aria-live="polite" className="pointer-events-none fixed bottom-[24px] left-1/2 z-50 -translate-x-1/2">
        {toast && <div className="animate-[menu-in_120ms_ease-out] rounded-[10px] bg-gray-30 px-[16px] py-[10px] text-[13px] text-white shadow-lg">{toast}</div>}
      </div>
    </div>
  )
}
