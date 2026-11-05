import { useCallback, useMemo, useRef, useState } from 'react'
import { Link, useNavigate, useParams, useSearchParams } from 'react-router-dom'
import iconArrowLeft from '../assets/builder/icon-arrow-left.svg'
import iconPen from '../assets/builder/icon-pen.svg'
import iconQr from '../assets/builder/icon-qr.svg'
import toggleOff from '../assets/builder/toggle-off.svg'
import toggleOn from '../assets/builder/toggle-on.svg'
import iconSort from '../assets/dashboard/icon-sort.svg'
import iconFile from '../assets/meeting/c-file-text.svg'
import iconAi from '../assets/meeting/d-ai.svg'
import iconCheckSm from '../assets/meeting/d-check-sm.svg'
import iconCheck from '../assets/meeting/d-check.svg'
import iconCoins from '../assets/meeting/d-coins.svg'
import iconDownload from '../assets/meeting/d-download.svg'
import iconNotePencil from '../assets/meeting/d-note-pencil.svg'
import iconVideo from '../assets/meeting/d-video.svg'
import iconX from '../assets/meeting/d-x.svg'
import ResultChart from '../components/builder/ResultChart'
import { IconBtn, QrModal, recurrenceText } from '../components/meeting/FormParts'
import SignatureModal from '../components/meeting/SignatureModal'
import Pagination from '../components/ui/Pagination'
import useDismiss from '../components/ui/useDismiss'
import { voteLabel, type Attendee, type AttendeeStatus, type Meeting, type Rsvp } from '../data/meetings'
import type { ResultSeries } from '../data/surveyResults'
import { currentUser } from '../lib/auth'
import { updateMeeting, useMeetings } from '../lib/meetingStore'

const thMonths = ['มกราคม', 'กุมภาพันธ์', 'มีนาคม', 'เมษายน', 'พฤษภาคม', 'มิถุนายน', 'กรกฎาคม', 'สิงหาคม', 'กันยายน', 'ตุลาคม', 'พฤศจิกายน', 'ธันวาคม']
export const thaiDate = (iso: string) => {
  const d = new Date(`${iso}T00:00:00`)
  return `${d.getDate()} ${thMonths[d.getMonth()]} ${d.getFullYear() + 543}`
}
export const whenText = (m: Meeting) => `${thaiDate(m.date)}${m.allDay ? ' (ทั้งวัน)' : ` เวลา ${m.start.replace(':', '.')} น. - ${m.end.replace(':', '.')} น.`}`
export const placeText = (m: Meeting) =>
  m.hasLocation
    ? [m.place, m.subdistrict && `${m.province === 'กรุงเทพมหานคร' ? 'แขวง' : 'ตำบล'}${m.subdistrict}`, m.district && `${m.province === 'กรุงเทพมหานคร' ? 'เขต' : 'อำเภอ'}${m.district}`, m.province !== 'กรุงเทพมหานคร' && m.province && `จังหวัด${m.province}`]
        // the place name may already spell out the area
        .filter((part, i) => part && (i === 0 || !m.place.includes(part as string)))
        .join(' ')
    : 'ประชุมออนไลน์'

/** Info card shared by both tabs (Figma: type, title, วันที่, สถานที่ประชุม, หมายเหตุ) */
function InfoCard({ m }: { m: Meeting }) {
  return (
    <div className="flex flex-col gap-[24px] rounded-[12px] bg-white p-[24px] max-sm:p-[16px]">
      <div className="flex flex-col gap-[12px] text-ink opacity-90">
        <p className="text-[14px] font-medium">{m.type}</p>
        <h2 className="text-[20px] leading-[1.2] font-semibold">{m.title}</h2>
      </div>
      <div className="flex flex-col gap-[2px] px-[24px] text-[14px] text-ink opacity-90 max-sm:px-0">
        <p>
          <span className="font-medium">วันที่ : </span>
          <span className="font-light">{whenText(m)}</span>
        </p>
        {m.recurrence && <p className="text-[12px] font-light text-gray-20">{recurrenceText(m.recurrence)}</p>}
        <p>
          <span className="font-medium">สถานที่ประชุม : </span>
          <span className="font-light">{placeText(m) || '-'}</span>
        </p>
      </div>
      {m.note && (
        <p className="text-[14px] text-ink opacity-90">
          <span className="font-medium">หมายเหตุ : </span>
          <span className="font-light whitespace-pre-line">{m.note}</span>
        </p>
      )}
    </div>
  )
}

const statusCell: Record<AttendeeStatus, { bg: string; icon?: string; label: string }> = {
  registered: { bg: 'bg-green', icon: iconCheckSm, label: 'ลงทะเบียนแล้ว' },
  online: { bg: 'bg-green', icon: iconVideo, label: 'เข้าร่วมออนไลน์' },
  absent: { bg: 'bg-gray-5', icon: iconX, label: 'ไม่เข้าร่วม' },
  pending: { bg: 'bg-gray-bg', label: 'รอลงทะเบียน' },
}

type SortKey = 'order' | 'first' | 'last' | 'position' | 'status'
const PAGE = 4

function AttendeeTable({ list }: { list: Attendee[] }) {
  const [sort, setSort] = useState<{ key: SortKey; dir: 1 | -1 }>({ key: 'order', dir: 1 })
  const [page, setPage] = useState(1)
  const rank: Record<AttendeeStatus, number> = { registered: 0, online: 1, pending: 2, absent: 3 }
  const rows = useMemo(() => {
    const withOrder = list.map((a, i) => ({ ...a, order: i + 1 }))
    if (sort.key === 'order') return sort.dir === 1 ? withOrder : [...withOrder].reverse()
    const key = sort.key
    return [...withOrder].sort((a, b) => (key === 'status' ? rank[a.status] - rank[b.status] : a[key].localeCompare(b[key], 'th')) * sort.dir)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [list, sort])
  const pageCount = Math.max(1, Math.ceil(rows.length / PAGE))
  const visible = rows.slice((page - 1) * PAGE, page * PAGE)
  const head = (key: SortKey, label: string, cls: string) => (
    <button
      type="button"
      onClick={() => setSort((s) => ({ key, dir: s.key === key ? (s.dir === 1 ? -1 : 1) : 1 }))}
      aria-label={`เรียงตาม${label}`}
      className={`flex items-end gap-[2px] text-left text-[10px] leading-[normal] font-light text-gray-20 hover:text-blue-00 ${cls}`}
    >
      {label}
      <img src={iconSort} alt="" width={12} height={12} className={sort.key === key ? (sort.dir === 1 ? '' : 'rotate-180') : 'opacity-60'} />
    </button>
  )
  const grid = 'grid grid-cols-[46px_minmax(0,1fr)_minmax(0,1fr)_minmax(0,372px)_233px] items-center gap-[20px] px-[10px] max-lg:grid-cols-[36px_minmax(0,1fr)_minmax(0,1fr)_minmax(0,1fr)_120px]'

  return (
    <>
      <div className="overflow-x-auto rounded-[12px] bg-white px-[24px] py-[12px] max-sm:px-[12px]">
        <div className="min-w-[620px]">
          <div className={`${grid} py-[12px]`}>
            {head('order', 'ลำดับ', '')}
            {head('first', 'ชื่อ', '')}
            {head('last', 'นามสกุล', '')}
            {head('position', 'ตำแหน่ง', '')}
            {head('status', 'สถานะการลงทะเบียน', '')}
          </div>
          {visible.map((a) => {
            const st = statusCell[a.status]
            return (
              <div key={a.id} className={`${grid} border-t border-gray-line py-[16px] text-[12px] font-light text-ink`}>
                <span>{a.order}</span>
                <span className="truncate">{a.first}</span>
                <span className="truncate">{a.last || '-'}</span>
                <span className="truncate">{a.position}</span>
                <span className="flex items-center gap-[8px] px-[30px] max-lg:px-0" title={st.label}>
                  <span className={`flex size-[32px] items-center justify-center rounded-[8px] ${st.bg}`} aria-label={st.label} role="img">
                    {st.icon ? <img src={st.icon} alt="" width={16} height={16} /> : <span className="size-[6px] rounded-full bg-gray-10" />}
                  </span>
                  <span className="text-[11px] text-gray-20 max-lg:hidden">{st.label}</span>
                </span>
              </div>
            )
          })}
          {list.length === 0 && <p className="border-t border-gray-line py-[24px] text-center text-[12px] font-light text-gray-20">ยังไม่มีรายชื่อผู้เข้าร่วม</p>}
        </div>
      </div>
      {pageCount > 1 && <Pagination page={page} pageCount={pageCount} onChange={setPage} />}
    </>
  )
}

function RsvpControl({ m, disabled }: { m: Meeting; disabled: boolean }) {
  const [open, setOpen] = useState(false)
  const root = useRef<HTMLDivElement>(null)
  const close = useCallback(() => setOpen(false), [])
  useDismiss(open, root, close)
  const pick = (rsvp: Rsvp) => {
    updateMeeting(m.id, (x) => ({ ...x, rsvp }))
    setOpen(false)
  }
  const main: Record<Rsvp, { cls: string; icon?: string; text: string }> = {
    accepted: { cls: 'bg-green text-white-soft', icon: iconCheck, text: 'เข้าร่วม' },
    rejected: { cls: 'bg-gray-5 text-gray-30', text: 'ไม่เข้าร่วม' },
    requested: { cls: 'bg-blue-00 text-white-soft hover:brightness-110', text: 'ตอบรับเข้าร่วม' },
  }
  const look = main[m.rsvp]
  return (
    <div ref={root} className="relative flex items-center gap-[12px]">
      <button
        type="button"
        disabled={disabled}
        onClick={() => (m.rsvp === 'requested' ? pick('accepted') : setOpen((v) => !v))}
        className={`flex w-[128px] items-center justify-center gap-[4px] rounded-[8px] px-[12px] py-[10px] text-[14px] font-medium transition disabled:cursor-not-allowed disabled:opacity-60 ${look.cls}`}
      >
        {look.icon && <img src={look.icon} alt="" width={16} height={16} className="my-px" />}
        <span className="p-[2px]">{look.text}</span>
      </button>
      {!disabled && (
        <button type="button" aria-haspopup="menu" aria-expanded={open} onClick={() => setOpen((v) => !v)} className="rounded-[8px] px-[2px] py-[8px] text-[12px] font-medium text-blue-00 hover:underline">
          {m.rsvp === 'requested' ? 'ปฏิเสธ' : 'แก้ไข'}
        </button>
      )}
      {open && (
        <div role="menu" className="absolute top-[calc(100%+6px)] left-0 z-30 w-[180px] animate-[menu-in_120ms_ease-out] rounded-[10px] bg-white p-[4px] drop-shadow-[0px_4px_10px_rgba(0,0,0,0.15)]">
          {(
            [
              ['accepted', 'ตอบรับเข้าร่วม', 'text-green-text'],
              ['rejected', 'ไม่เข้าร่วม', 'text-red-00'],
            ] as const
          ).map(([v, label, tone]) => (
            <button key={v} type="button" role="menuitemradio" aria-checked={m.rsvp === v} onClick={() => pick(v)} className={`flex h-[36px] w-full items-center gap-[8px] rounded-[6px] px-[10px] text-left text-[13px] font-medium hover:bg-blue-bg ${tone}`}>
              <span className={`size-[6px] rounded-full ${m.rsvp === v ? 'bg-current' : ''}`} />
              {label}
            </button>
          ))}
        </div>
      )}
    </div>
  )
}

/** Word (.doc) file from HTML — opens in Microsoft Word (TOR 5.9 export) */
function downloadDoc(name: string, title: string, body: string) {
  const html = `<html><head><meta charset="utf-8"><title>${title}</title><style>body{font-family:'TH Sarabun New',Tahoma,sans-serif;font-size:16pt}h1{font-size:20pt}h2{font-size:17pt;margin-top:18pt}td,th{border:1px solid #999;padding:4pt 8pt}table{border-collapse:collapse}</style></head><body>${body}</body></html>`
  const a = document.createElement('a')
  a.href = URL.createObjectURL(new Blob(['﻿' + html], { type: 'application/msword' }))
  a.download = `${name}.doc`
  a.click()
  URL.revokeObjectURL(a.href)
}
const esc = (s: string) => s.replace(/[&<>]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;' })[c]!)

function SummaryTab({ m }: { m: Meeting }) {
  const a = m.attendees
  const attendance: ResultSeries = {
    key: 'attendance',
    title: 'ผู้เข้าร่วมประชุม',
    unit: 'คน',
    defaultKind: 'bar-v',
    items: [
      ['ผู้ถูกเชิญ', a.length],
      ['ผู้ตอบรับเข้าร่วมประชุม', a.filter((x) => x.status !== 'absent').length],
      ['ผู้ลงชื่อเข้าร่วมประชุม', a.filter((x) => x.status === 'registered' || x.status === 'online').length],
      ['ผู้ร่วมประชุมออนไลน์', a.filter((x) => x.status === 'online').length],
    ].map(([label, value]) => ({ label: label as string, value: value as number, color: '#c1e7ff' })),
  }
  const comments: ResultSeries = {
    key: 'comments',
    title: 'แสดงความคิดเห็น',
    unit: 'ความคิดเห็น',
    defaultKind: 'bar-v',
    items: m.agendas.map((g, i) => ({ label: `วาระที่ ${i + 1}`, value: g.comments.length, color: '#c1e7ff' })),
  }
  const votes: ResultSeries[] = m.agendas
    .map((g, i) => ({ g, i }))
    .filter(({ g }) => g.vote)
    .map(({ g, i }) => ({
      key: `vote-${g.id}`,
      title: `ผลการออกเสียงวาระที่ ${i + 1}`,
      unit: 'เสียง',
      defaultKind: 'pie',
      items: (['approve', 'reject', 'abstain'] as const).map((k, j) => ({ label: voteLabel[k], value: g.votes[k], color: ['#0079e6', '#a7dcff', '#b3b7ba'][j] })),
    }))
  const ended = m.status === 'completed'

  const exportSummary = () => {
    const voteRows = votes
      .map((v) => `<h2>${esc(v.title)}</h2><table><tr><th>ผล</th><th>จำนวน (เสียง)</th></tr>${v.items.map((i) => `<tr><td>${i.label}</td><td>${i.value}</td></tr>`).join('')}</table>`)
      .join('')
    downloadDoc(
      `สรุปการประชุม-${m.id}`,
      m.title,
      `<h1>สรุปการประชุม: ${esc(m.title)}</h1><p>${esc(m.type)} · ${esc(whenText(m))}<br/>สถานที่: ${esc(placeText(m))}</p><h2>สรุปผล</h2><p>${esc(m.summary || '-')}</p><h2>ผู้เข้าร่วมประชุม</h2><table>${attendance.items.map((i) => `<tr><td>${i.label}</td><td>${i.value} คน</td></tr>`).join('')}</table>${voteRows}`,
    )
  }
  const exportMinutes = () =>
    downloadDoc(
      `บันทึกการประชุม-${m.id}`,
      m.title,
      `<h1>บันทึกการประชุม: ${esc(m.title)}</h1><p>${esc(whenText(m))} · ${esc(placeText(m))}</p><h2>ผู้เข้าร่วมประชุม</h2><table><tr><th>ลำดับ</th><th>ชื่อ-นามสกุล</th><th>ตำแหน่ง</th><th>สถานะ</th></tr>${a
        .map((x, i) => `<tr><td>${i + 1}</td><td>${esc(`${x.first} ${x.last}`)}</td><td>${esc(x.position)}</td><td>${statusCell[x.status].label}</td></tr>`)
        .join('')}</table>${m.agendas
        .map(
          (g, i) =>
            `<h2>ระเบียบวาระที่ ${i + 1} ${esc(g.title)}</h2><p>${esc(g.detail)}</p>${g.vote ? `<p>มติ: เห็นชอบ ${g.votes.approve} · ไม่เห็นชอบ ${g.votes.reject} · งดออกเสียง ${g.votes.abstain}</p>` : ''}${g.comments.length ? `<p>ความคิดเห็น:</p><ul>${g.comments.map((c) => `<li>${esc(c)}</li>`).join('')}</ul>` : ''}`,
        )
        .join('')}${m.transcript.length ? `<h2>คำบรรยาย</h2>${m.transcript.map((t) => `<p>${esc(t)}</p>`).join('')}` : ''}`,
    )

  return (
    <>
      <div className="flex justify-end">
        <button type="button" onClick={exportSummary} className="flex w-[236px] items-center justify-center gap-[4px] rounded-[8px] bg-blue-bg px-[12px] py-[10px] transition-colors hover:bg-blue-20 max-sm:w-full">
          <img src={iconDownload} alt="" width={16} height={16} className="my-px" />
          <span className="p-[2px] text-[14px] font-medium text-blue-00">สรุปการประชุม</span>
        </button>
      </div>
      <section className="flex flex-col gap-[10px] rounded-[12px] bg-blue-gray p-[12px]">
        <InfoCard m={m} />
        <div className="flex flex-col gap-[12px] rounded-[12px] bg-white p-[24px] max-sm:p-[16px]">
          <div className="flex items-center gap-[6px]">
            <img src={iconAi} alt="" width={18} height={18} />
            <h3 className="text-[14px] font-medium text-ink opacity-90">สรุปการประชุม</h3>
            {m.summary && <span className="rounded-[6px] bg-blue-bg px-[6px] py-[2px] text-[10px] font-light text-blue-00">สร้างโดย AI</span>}
          </div>
          <p className="px-[24px] text-[14px] leading-[1.6] font-light text-ink opacity-90 max-sm:px-0">
            {m.summary || (ended ? 'ยังไม่มีสรุป · เริ่มบันทึกเสียงในหน้าวาระการประชุมเพื่อให้ระบบสรุปให้อัตโนมัติ' : 'ระบบจะสรุปการประชุมให้อัตโนมัติจากการบันทึกเสียงในหน้าวาระการประชุม')}
          </p>
          <button type="button" onClick={exportMinutes} className="ml-[24px] flex w-[236px] items-center justify-center gap-[4px] rounded-[8px] bg-blue-bg px-[12px] py-[10px] transition-colors hover:bg-blue-20 max-sm:ml-0 max-sm:w-full">
            <img src={iconDownload} alt="" width={16} height={16} className="my-px" />
            <span className="p-[2px] text-[14px] font-medium text-blue-00">จดบันทึกการประชุม</span>
          </button>
        </div>
        <div className="grid grid-cols-2 gap-[10px] max-md:grid-cols-1">
          <ResultChart s={attendance} plain />
          {comments.items.length ? <ResultChart s={comments} plain /> : <EmptyCard title="แสดงความคิดเห็น" text="ยังไม่มีวาระการประชุม" />}
        </div>
        {votes.length ? votes.map((v) => <ResultChart key={v.key} s={v} plain />) : <EmptyCard title="ผลการออกเสียง" text="ยังไม่มีวาระที่เปิดลงมติ" />}
      </section>
    </>
  )
}

function EmptyCard({ title, text }: { title: string; text: string }) {
  return (
    <div className="flex flex-col gap-[12px] rounded-[12px] bg-white p-[24px]">
      <h3 className="text-[14px] font-medium text-ink opacity-90">{title}</h3>
      <p className="py-[24px] text-center text-[12px] font-light text-gray-20">{text}</p>
    </div>
  )
}

/** Figma OSS-Meeting/Detail1 (194:10146) + Detail-2 (198:10087) at /meeting/:id */
export default function MeetingDetailPage() {
  const { id } = useParams()
  const navigate = useNavigate()
  const meetings = useMeetings()
  const m = meetings.find((x) => x.id === Number(id))
  const [search] = useSearchParams()
  const [tab, setTab] = useState<'detail' | 'summary'>(search.get('tab') === 'summary' ? 'summary' : 'detail')
  const [signing, setSigning] = useState(false)
  const [qr, setQr] = useState(false)
  const user = currentUser()

  if (!m)
    return (
      <div className="flex flex-col items-center gap-[12px] px-[24px] py-[80px] text-center">
        <h1 className="text-[20px] font-semibold text-blue-00">ไม่พบการประชุม</h1>
        <Link to="/meeting" className="text-[14px] font-medium text-blue-00 hover:underline">
          กลับไปปฏิทินการประชุม
        </Link>
      </div>
    )

  const canceled = m.status === 'canceled'
  const signDisabled = canceled || m.rsvp === 'rejected' || m.draft
  const toggle = (on: boolean, label: string) => (
    <span className="flex shrink-0 items-center gap-[10px]">
      <span className="flex w-[48px] justify-center">
        <img src={on ? toggleOn : toggleOff} alt="" width={28} height={16} />
      </span>
      <span className="text-[14px] font-medium whitespace-nowrap text-black opacity-90">{label}</span>
      <span className="sr-only">{on ? 'เปิด' : 'ปิด'}</span>
    </span>
  )

  return (
    <div className="mx-auto flex w-full max-w-[1243px] flex-col gap-[12px] px-[24px] pb-[55px] max-sm:px-[12px]">
      <div className="flex items-center gap-[10px] pb-[12px]">
        <button type="button" aria-label="กลับไปปฏิทินการประชุม" onClick={() => navigate('/meeting')} className="flex shrink-0 rounded-[8px] bg-blue-bg p-[8px] transition-colors hover:bg-blue-20">
          <img src={iconArrowLeft} alt="" width={16} height={16} />
        </button>
        <h1 className="min-w-0 flex-1 truncate text-[20px] leading-[1.2] font-semibold text-blue-00">รายละเอียดการประชุม</h1>
        <IconBtn icon={iconPen} label="แก้ไขการประชุม" onClick={() => navigate(`/meeting/${m.id}/edit`)} />
      </div>

      {(m.draft || canceled) && (
        <p className={`rounded-[10px] px-[16px] py-[10px] text-[13px] font-light ${canceled ? 'bg-red-20 text-red-00' : 'bg-blue-bg text-blue-00'}`}>
          {canceled ? 'การประชุมนี้ถูกยกเลิกแล้ว' : 'การประชุมนี้ยังเป็นแบบร่าง ยังไม่ได้ส่งนัดให้ผู้เข้าร่วม'}
        </p>
      )}

      <div role="tablist" aria-label="ส่วนของรายละเอียด" className="mb-[12px] flex gap-[2px] rounded-[8px] bg-blue-bg">
        {(
          [
            ['detail', 'รายละเอียดการประชุม'],
            ['summary', 'สรุปการประชุม'],
          ] as const
        ).map(([k, label]) => (
          <button
            key={k}
            type="button"
            role="tab"
            aria-selected={tab === k}
            onClick={() => setTab(k)}
            className={`flex-1 rounded-[8px] px-[12px] py-[10px] text-[12px] leading-[normal] font-medium transition-colors ${tab === k ? 'bg-blue-00 text-white-soft' : 'bg-gray-bg text-gray-20 hover:text-blue-00'}`}
          >
            {label}
          </button>
        ))}
      </div>

      {tab === 'detail' ? (
        <>
          <div className="flex items-center gap-[10px] max-md:flex-col max-md:items-stretch">
            <div className="flex flex-1 items-center gap-[12px]">
              <RsvpControl m={m} disabled={canceled || m.draft} />
              {m.signedIn && (
                <span className="flex items-center gap-[6px] text-[12px] font-light text-green-text">
                  {m.signature && <img src={m.signature} alt="ลายมือชื่อของคุณ" className="h-[28px] rounded-[4px] bg-white" />}
                  ลงชื่อแล้ว{m.signedAt ? ` ${new Date(m.signedAt).toLocaleString('th-TH', { dateStyle: 'medium', timeStyle: 'short' })}` : ''}
                </span>
              )}
            </div>
            <div className="flex gap-[10px] max-md:flex-col">
              {!canceled && !m.draft && (
                <button
                  type="button"
                  onClick={() => navigate(`/meeting/${m.id}/expense${m.expenseStatus === 'submitted' || m.expenseStatus === 'recorded' ? '?tab=review' : ''}`)}
                  className="flex items-center justify-center gap-[4px] rounded-[8px] px-[12px] py-[10px] text-[14px] font-medium text-blue-00 transition-colors hover:bg-blue-bg max-md:w-full"
                >
                  <img src={iconCoins} alt="" width={16} height={16} className="my-px" />
                  <span className="p-[2px]">{{ none: 'เบิกค่าใช้จ่าย', draft: 'เบิกค่าใช้จ่าย (ร่าง)', submitted: 'เบิกค่าใช้จ่าย · รอหลักฐาน', recorded: 'เบิกค่าใช้จ่าย · บันทึกแล้ว' }[m.expenseStatus]}</span>
                </button>
              )}
              <button type="button" onClick={() => navigate(`/meeting/${m.id}/agenda`)} className="flex w-[236px] items-center justify-center gap-[4px] rounded-[8px] bg-blue-bg px-[12px] py-[10px] transition-colors hover:bg-blue-20 max-md:w-full">
                <img src={iconFile} alt="" width={16} height={16} className="my-px" />
                <span className="p-[2px] text-[14px] font-medium text-blue-00">วาระการประชุม</span>
              </button>
              <button
                type="button"
                disabled={signDisabled || m.signedIn}
                onClick={() => setSigning(true)}
                className="flex w-[236px] items-center justify-center gap-[4px] rounded-[8px] bg-blue-bg px-[12px] py-[10px] transition-colors hover:bg-blue-20 disabled:cursor-not-allowed disabled:opacity-50 disabled:hover:bg-blue-bg max-md:w-full"
              >
                <img src={iconNotePencil} alt="" width={16} height={16} className="my-px" />
                <span className="p-[2px] text-[14px] font-medium text-blue-00">{m.signedIn ? 'ลงชื่อเข้าประชุมแล้ว' : 'ลงชื่อเข้าประชุม'}</span>
              </button>
            </div>
          </div>

          <section className="flex flex-col gap-[12px] rounded-[12px] bg-blue-10 p-[12px]">
            <InfoCard m={m} />
            <div className="flex items-center gap-[10px] max-lg:flex-col max-lg:items-stretch">
              <div className="flex min-w-0 flex-1 flex-wrap items-center gap-x-[24px] gap-y-[12px] rounded-[12px] bg-gray-bg px-[24px] py-[12px] max-sm:px-[12px]">
                {toggle(m.online, 'เปิดการประชุมออนไลน์')}
                {toggle(m.registration, 'เปิดลงทะเบียนเข้าร่วมประชุม')}
              </div>
              <button
                type="button"
                disabled={!m.online || canceled}
                onClick={() => setQr(true)}
                className="flex w-[234px] shrink-0 items-center justify-center gap-[4px] rounded-[8px] border border-gray-line bg-white px-[12px] py-[10px] text-[14px] font-medium text-blue-00 transition-colors hover:bg-blue-bg disabled:cursor-not-allowed disabled:text-gray-10 disabled:hover:bg-white max-lg:w-full"
              >
                <img src={iconQr} alt="" width={16} height={16} className={`my-px ${!m.online || canceled ? 'opacity-40' : ''}`} />
                <span className="p-[2px]">เข้าประชุมออนไลน์</span>
              </button>
            </div>
          </section>

          <section className="flex flex-col gap-[12px] rounded-[12px] bg-blue-gray p-[12px]">
            <h2 className="text-[16px] font-medium text-black">
              รายชื่อผู้เข้าร่วมประชุม <span className="text-[12px] font-light text-gray-20">({m.attendees.length} คน)</span>
            </h2>
            <AttendeeTable list={m.attendees} />
          </section>
        </>
      ) : (
        <SummaryTab m={m} />
      )}

      <SignatureModal
        open={signing}
        name={user?.name ?? 'ผู้เข้าร่วม'}
        onClose={() => setSigning(false)}
        onSign={(signature) => {
          updateMeeting(m.id, (x) => ({ ...x, signedIn: true, signature, signedAt: new Date().toISOString(), rsvp: 'accepted' }))
          setSigning(false)
        }}
      />
      <QrModal open={qr} title="เข้าประชุมออนไลน์" url={`${window.location.origin}/meeting/${m.id}?join=1`} onClose={() => setQr(false)}>
        <p className="text-center text-[12px] font-light text-gray-20">สแกนด้วยมือถือเพื่อเข้าห้องประชุมออนไลน์</p>
      </QrModal>
    </div>
  )
}
