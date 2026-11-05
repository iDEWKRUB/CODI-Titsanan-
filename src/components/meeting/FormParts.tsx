import QRCode from 'qrcode'
import { useCallback, useEffect, useMemo, useRef, useState, type ReactNode } from 'react'
import iconX from '../../assets/builder/icon-x.svg'
import iconCalendar from '../../assets/meeting/c-calendar.svg'
import iconPlus from '../../assets/meeting/c-plus.svg'
import iconUserPlus from '../../assets/meeting/c-user-plus.svg'
import { uid } from '../../data/surveyBuilder'
import { attendeeGroups, directory, type Agenda, type Attendee, type Recurrence } from '../../data/meetings'
import { DateInput } from '../ui/DateTimeInputs'
import Modal from '../ui/Modal'
import Select from '../ui/Select'
import Toggle from '../ui/Toggle'
import useDismiss from '../ui/useDismiss'

export const label14 = 'text-[14px] leading-[normal] font-medium whitespace-nowrap text-ink opacity-90'
export const field = 'h-[46px] w-full rounded-[8px] border border-gray-line bg-white px-[14px] text-[14px] leading-[normal] font-light text-black outline-none transition-colors placeholder:text-gray-20 hover:border-gray-10 focus:border-blue-00'
export const outlineBtn =
  'flex items-center justify-center gap-[4px] rounded-[8px] border border-gray-line bg-white px-[12px] py-[10px] text-[14px] leading-[normal] font-medium whitespace-nowrap text-blue-00 transition-colors hover:bg-blue-bg disabled:cursor-not-allowed disabled:text-gray-10 disabled:hover:bg-white [&:disabled_img]:opacity-40'

export function IconBtn({ icon, label, onClick, size = 18 }: { icon: string; label: string; onClick: () => void; size?: number }) {
  return (
    <button type="button" aria-label={label} title={label} onClick={onClick} className="flex shrink-0 rounded-[8px] border border-gray-line bg-white p-[10px] transition-colors hover:bg-blue-bg">
      <img src={icon} alt="" width={size} height={size} />
    </button>
  )
}

export function ToggleRow({ checked, onChange, children }: { checked: boolean; onChange: (v: boolean) => void; children: string }) {
  return (
    <label className="flex shrink-0 cursor-pointer items-center gap-[10px]">
      <span className="flex w-[48px] justify-center">
        <Toggle checked={checked} onChange={onChange} label={children} />
      </span>
      <span className={label14}>{children}</span>
    </label>
  )
}

// ---- Frame 16 (180:9896): repeat settings ----
const weekdays = ['M', 'T', 'W', 'T', 'F', 'S', 'S']
const weekdayName = ['จันทร์', 'อังคาร', 'พุธ', 'พฤหัสบดี', 'ศุกร์', 'เสาร์', 'อาทิตย์']
const unitLabel = { day: 'วัน', week: 'สัปดาห์', month: 'เดือน' } as const

export function recurrenceText(r: Recurrence) {
  const base = `ทำซ้ำทุก ${r.every > 1 ? `${r.every} ` : ''}${unitLabel[r.unit]}`
  const days = r.unit === 'week' && r.days.length ? ` (${r.days.map((d) => weekdayName[d]).join(', ')})` : ''
  return `${base}${days} · ${r.until ? `ถึง ${r.until}` : 'ไม่มีวันสิ้นสุด'}`
}

export function RecurrencePanel({ value, onChange }: { value: Recurrence; onChange: (r: Recurrence) => void }) {
  return (
    <div className="w-[392px] max-w-full rounded-[12px] bg-blue-bg p-[12px]">
      <div className="flex flex-col gap-[10px] rounded-[8px] bg-white p-[12px]">
        <div className="flex flex-col gap-[12px]">
          <div className="flex items-center gap-[12px]">
            <span className={label14}>ทำซ้ำทุก</span>
            <Select
              className="w-[76px] shrink-0"
              label="จำนวนรอบ"
              value={String(value.every)}
              onChange={(v) => onChange({ ...value, every: Number(v) })}
              options={[1, 2, 3, 4, 5, 6].map((n) => ({ value: String(n), label: String(n) }))}
            />
            <Select
              className="min-w-0 flex-1"
              label="หน่วยการทำซ้ำ"
              value={value.unit}
              onChange={(unit) => onChange({ ...value, unit })}
              options={(Object.keys(unitLabel) as Recurrence['unit'][]).map((u) => ({ value: u, label: unitLabel[u] }))}
            />
          </div>
          {value.unit === 'week' && (
            <div role="group" aria-label="วันที่ทำซ้ำ" className="flex justify-center rounded-[8px] border border-gray-line py-[8px]">
              <div className="flex w-[224px] justify-between">
                {weekdays.map((d, i) => {
                  const on = value.days.includes(i)
                  return (
                    <button
                      key={i}
                      type="button"
                      aria-pressed={on}
                      aria-label={weekdayName[i]}
                      onClick={() => onChange({ ...value, days: on ? value.days.filter((x) => x !== i) : [...value.days, i].sort() })}
                      className="flex h-[32px] w-[32px] items-center justify-center rounded-[10px] transition-transform active:scale-95"
                    >
                      <span className={`flex size-[24px] items-center justify-center rounded-full text-[12px] font-light text-white transition-colors ${on ? 'bg-blue-00' : 'bg-gray-5 hover:bg-gray-10'}`}>{d}</span>
                    </button>
                  )
                })}
              </div>
            </div>
          )}
        </div>
        <div className="flex items-center gap-[24px] max-sm:flex-wrap max-sm:gap-[8px]">
          <div className="flex w-[236px] items-center gap-[12px]">
            <span className={`${label14} w-[48px]`}>สิ้นสุด</span>
            <DateInput value={value.until} onChange={(until) => onChange({ ...value, until })} label="วันสิ้นสุดการทำซ้ำ" placeholder="ไม่มีวันสิ้นสุด" icon={iconCalendar} />
          </div>
          {value.until && (
            <button type="button" onClick={() => onChange({ ...value, until: '' })} className="rounded-[7px] px-[2px] py-[6px] text-[10px] font-light whitespace-nowrap text-blue-00 hover:underline">
              ยกเลิกวันสิ้นสุด
            </button>
          )}
        </div>
      </div>
    </div>
  )
}

// ---- กำหนดรายชื่อผู้เข้าร่วมประชุม ----
const initials = (a: Attendee) => (a.first[0] ?? '') + (a.last[0] ?? '')

export function AttendeePicker({ value, onChange }: { value: Attendee[]; onChange: (v: Attendee[]) => void }) {
  const people = useMemo(directory, [])
  const [q, setQ] = useState('')
  const [open, setOpen] = useState(false)
  const [groupsOpen, setGroupsOpen] = useState(false)
  const root = useRef<HTMLDivElement>(null)
  const groupsRoot = useRef<HTMLDivElement>(null)
  const close = useCallback(() => setOpen(false), [])
  const closeGroups = useCallback(() => setGroupsOpen(false), [])
  useDismiss(open, root, close)
  useDismiss(groupsOpen, groupsRoot, closeGroups)

  const has = (id: string) => value.some((a) => a.id === id)
  const term = q.trim().toLowerCase()
  const matches = term ? people.filter((p) => !has(p.id) && `${p.first} ${p.last} ${p.position}`.toLowerCase().includes(term)).slice(0, 6) : []
  const add = (list: Attendee[]) => onChange([...value, ...list.filter((a) => !has(a.id))])
  // free text: e-mail or phone number of someone outside the directory
  const freeOk = /^\S+@\S+\.\S+$/.test(q.trim()) || /^0\d{8,9}$/.test(q.replace(/[-\s]/g, ''))
  const addFree = () => {
    if (!freeOk) return
    add([{ id: uid('x'), first: q.trim(), last: '', position: 'ผู้ได้รับเชิญ (ภายนอก)', status: 'pending' }])
    setQ('')
  }

  return (
    <div className="flex flex-col gap-[16px]">
      <div className="flex items-center gap-[12px] max-sm:flex-wrap">
        <span className="flex size-[38px] shrink-0 items-center justify-center rounded-[5px] p-[4px]">
          <img src={iconUserPlus} alt="" width={28} height={28} />
        </span>
        <div ref={root} className="relative min-w-0 flex-1">
          <input
            value={q}
            onChange={(e) => {
              setQ(e.target.value)
              setOpen(true)
            }}
            onFocus={() => setOpen(true)}
            onKeyDown={(e) => {
              if (e.key !== 'Enter') return
              e.preventDefault()
              if (matches[0]) {
                add([matches[0]])
                setQ('')
              } else addFree()
            }}
            placeholder="ระบุชื่อ, นามสกุล, อีเมล หรือเบอร์โทร"
            aria-label="ค้นหาผู้เข้าร่วมประชุม"
            className={`${field} h-[45px]`}
          />
          {open && term && (
            <div role="listbox" className="absolute top-[calc(100%+6px)] left-0 z-30 w-full animate-[menu-in_120ms_ease-out] rounded-[12px] bg-white p-[4px] drop-shadow-[0px_4px_10px_rgba(0,0,0,0.15)]">
              {matches.map((p) => (
                <button
                  key={p.id}
                  type="button"
                  role="option"
                  aria-selected={false}
                  onClick={() => {
                    add([p])
                    setQ('')
                  }}
                  className="flex w-full items-center gap-[10px] rounded-[8px] px-[10px] py-[8px] text-left hover:bg-blue-bg"
                >
                  <span className="flex size-[28px] shrink-0 items-center justify-center rounded-full bg-blue-20 text-[11px] font-medium text-blue-00">{initials(p)}</span>
                  <span className="min-w-0 flex-1 truncate text-[14px] font-light text-black">
                    {p.first} {p.last}
                  </span>
                  <span className="shrink-0 text-[12px] font-light text-gray-20">{p.position}</span>
                </button>
              ))}
              {matches.length === 0 &&
                (freeOk ? (
                  <button type="button" onClick={addFree} className="flex w-full items-center gap-[8px] rounded-[8px] px-[10px] py-[10px] text-left text-[14px] font-light text-blue-00 hover:bg-blue-bg">
                    <img src={iconPlus} alt="" width={16} height={16} />
                    เชิญ “{q.trim()}”
                  </button>
                ) : (
                  <p className="px-[10px] py-[10px] text-[12px] font-light text-gray-20">ไม่พบรายชื่อ · พิมพ์อีเมลหรือเบอร์โทรเพื่อเชิญบุคคลภายนอก</p>
                ))}
            </div>
          )}
        </div>
        <div ref={groupsRoot} className="relative shrink-0">
          <button type="button" aria-haspopup="menu" aria-expanded={groupsOpen} onClick={() => setGroupsOpen((v) => !v)} className={outlineBtn}>
            <img src={iconPlus} alt="" width={16} height={16} className="my-px" />
            <span className="p-[2px]">เพิ่มรายชื่อแบบกลุ่ม</span>
          </button>
          {groupsOpen && (
            <div role="menu" className="absolute top-[calc(100%+6px)] right-0 z-30 w-[260px] animate-[menu-in_120ms_ease-out] rounded-[12px] bg-white p-[4px] drop-shadow-[0px_4px_10px_rgba(0,0,0,0.15)]">
              {attendeeGroups.map((g) => (
                <button
                  key={g.name}
                  type="button"
                  role="menuitem"
                  onClick={() => {
                    add(people.filter((p) => g.ids.includes(p.id)))
                    setGroupsOpen(false)
                  }}
                  className="flex w-full items-center justify-between gap-[8px] rounded-[8px] px-[12px] py-[10px] text-left hover:bg-blue-bg"
                >
                  <span className="text-[13px] font-light text-black">{g.name}</span>
                  <span className="text-[11px] font-light text-gray-20">{g.ids.length} คน</span>
                </button>
              ))}
            </div>
          )}
        </div>
      </div>

      {value.length > 0 && (
        <div className="flex flex-col gap-[8px]">
          <div className="flex items-center justify-between">
            <span className="text-[12px] font-light text-gray-20">ผู้เข้าร่วม {value.length} คน</span>
            <button type="button" onClick={() => onChange([])} className="text-[12px] font-light text-gray-20 hover:text-red-00">
              ลบทั้งหมด
            </button>
          </div>
          <ul className="flex flex-wrap gap-[8px]">
            {value.map((a) => (
              <li key={a.id} className="flex items-center gap-[8px] rounded-full bg-blue-bg py-[4px] pr-[6px] pl-[4px]">
                <span className="flex size-[26px] items-center justify-center rounded-full bg-white text-[11px] font-medium text-blue-00">{initials(a)}</span>
                <span className="text-[13px] font-light text-black">
                  {a.first} {a.last}
                </span>
                <span className="text-[11px] font-light text-gray-20">{a.position}</span>
                <button type="button" aria-label={`นำ ${a.first} ออก`} onClick={() => onChange(value.filter((x) => x.id !== a.id))} className="flex rounded-full p-[3px] hover:bg-white">
                  <img src={iconX} alt="" width={14} height={14} />
                </button>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  )
}

// ---- สร้างวาระการประชุม ----
const blankAgenda = (): Agenda => ({ id: uid('a'), title: '', detail: '', owners: [], files: [], subItems: [], vote: false, votes: { approve: 0, reject: 0, abstain: 0 }, comments: [] })

export function AgendaModal({ open, value, onClose, onSave }: { open: boolean; value: Agenda[]; onClose: () => void; onSave: (a: Agenda[]) => void }) {
  const [list, setList] = useState<Agenda[]>(value)
  useEffect(() => {
    if (open) setList(value.length ? value : [blankAgenda()])
  }, [open, value])
  const set = (id: string, patch: Partial<Agenda>) => setList((l) => l.map((a) => (a.id === id ? { ...a, ...patch } : a)))
  const valid = list.filter((a) => a.title.trim())
  return (
    <Modal open={open} title="สร้างวาระการประชุม" onClose={onClose} width="max-w-[720px]">
      <div className="-mx-[4px] flex max-h-[60vh] flex-col gap-[12px] overflow-y-auto px-[4px]">
        {list.map((a, i) => (
          <div key={a.id} className="flex flex-col gap-[10px] rounded-[12px] bg-blue-gray p-[12px]">
            <div className="flex items-center gap-[10px]">
              <span className="shrink-0 text-[14px] font-semibold text-blue-00">ระเบียบวาระที่ {i + 1}</span>
              <input value={a.title} onChange={(e) => set(a.id, { title: e.target.value })} placeholder="ชื่อวาระ เช่น เรื่องที่แจ้งให้ที่ประชุมทราบ" aria-label={`ชื่อวาระที่ ${i + 1}`} className={`${field} min-w-0 flex-1`} />
              <button type="button" aria-label={`ลบวาระที่ ${i + 1}`} onClick={() => setList((l) => l.filter((x) => x.id !== a.id))} className="flex shrink-0 rounded-[8px] p-[8px] hover:bg-white">
                <img src={iconX} alt="" width={16} height={16} />
              </button>
            </div>
            <textarea value={a.detail} onChange={(e) => set(a.id, { detail: e.target.value })} placeholder="รายละเอียดวาระ" aria-label={`รายละเอียดวาระที่ ${i + 1}`} rows={2} className={`${field} h-auto resize-y py-[10px]`} />
            <input
              value={a.subItems.join(', ')}
              onChange={(e) => set(a.id, { subItems: e.target.value.split(',').map((s) => s.trimStart()).filter((s, k, arr) => s || k === arr.length - 1) })}
              placeholder="หัวข้อย่อย คั่นด้วยเครื่องหมายจุลภาค (ไม่บังคับ)"
              aria-label={`หัวข้อย่อยวาระที่ ${i + 1}`}
              className={field}
            />
            <ToggleRow checked={a.vote} onChange={(vote) => set(a.id, { vote })}>
              ลงมติโหวตในวาระนี้
            </ToggleRow>
          </div>
        ))}
        <button type="button" onClick={() => setList((l) => [...l, blankAgenda()])} className={`${outlineBtn} self-start`}>
          <img src={iconPlus} alt="" width={16} height={16} />
          เพิ่มวาระ
        </button>
      </div>
      <div className="flex justify-end gap-[12px]">
        <button type="button" onClick={onClose} className="h-[45px] w-[128px] rounded-[8px] border border-gray-line text-[14px] font-medium text-gray-30 outline-none hover:bg-gray-subtle focus-visible:ring-2 focus-visible:ring-blue-20">
          ยกเลิก
        </button>
        <button
          type="button"
          onClick={() => onSave(valid.map((a) => ({ ...a, subItems: a.subItems.map((s) => s.trim()).filter(Boolean) })))}
          className="h-[45px] w-[128px] rounded-[8px] bg-blue-00 text-[14px] font-medium text-white-soft hover:brightness-110"
        >
          บันทึก ({valid.length})
        </button>
      </div>
    </Modal>
  )
}

// ---- QR for เข้าประชุม / ลงทะเบียน ----
export function QrModal({ open, title, url, onClose, children }: { open: boolean; title: string; url: string; onClose: () => void; children?: ReactNode }) {
  const [src, setSrc] = useState('')
  useEffect(() => {
    if (open) QRCode.toDataURL(url, { margin: 1, width: 240, color: { dark: '#00357d' } }).then(setSrc)
  }, [open, url])
  const [copied, setCopied] = useState(false)
  return (
    <Modal open={open} title={title} onClose={onClose}>
      <div className="flex flex-col items-center gap-[16px]">
        {src && <img src={src} alt={`QR ${title}`} width={200} height={200} className="rounded-[12px] border border-gray-line p-[8px]" />}
        <div className="flex w-full items-center gap-[8px] rounded-[8px] bg-gray-subtle px-[12px] py-[10px]">
          <span className="min-w-0 flex-1 truncate text-[12px] font-light text-gray-30">{url}</span>
          <button
            type="button"
            onClick={() => {
              navigator.clipboard?.writeText(url)
              setCopied(true)
              setTimeout(() => setCopied(false), 1500)
            }}
            className="shrink-0 text-[12px] font-medium text-blue-00 hover:underline"
          >
            {copied ? 'คัดลอกแล้ว' : 'คัดลอกลิงก์'}
          </button>
        </div>
        {children}
      </div>
    </Modal>
  )
}
