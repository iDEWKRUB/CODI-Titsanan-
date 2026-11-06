import { daysBetween, kindMeta, resOf, thDate, type Booking } from '../../data/erpBooking'
import { BI, Ic, StatusPill, kindIcon, kindTone } from './Parts'

export const when = (b: Booking) => {
  if (b.kind === 'borrow') return `${thDate(b.date)} – ${thDate(b.endDate)} (${daysBetween(b.date, b.endDate)} วัน)`
  const t = b.allDay ? 'ทั้งวัน' : `${b.start}–${b.end} น.`
  return b.date === b.endDate ? `${thDate(b.date)} · ${t}` : `${thDate(b.date)} ${b.allDay ? '' : b.start} – ${thDate(b.endDate)} ${b.allDay ? '' : b.end}`.replace(/\s+/g, ' ').trim()
}

export function KindBadge({ k, size = 36 }: { k: Booking['kind']; size?: number }) {
  return <span style={{ width: size, height: size }} className={`flex shrink-0 items-center justify-center rounded-[10px] ${kindTone[k]}`}><Ic d={kindIcon[k]} s={Math.round(size * 0.5)} /></span>
}

/** request details — used by the "ดูรายละเอียด" popup and by the approval page (2.1.10.7–10) */
export function BookingDetail({ b }: { b: Booking }) {
  const r = resOf(b.resId)
  const rows: [string, string][] = [
    ['เลขที่คำขอ', b.no],
    ['ประเภท', kindMeta[b.kind].short],
    [b.kind === 'borrow' ? 'พัสดุ/ครุภัณฑ์' : b.kind === 'zoom' ? 'บัญชี Zoom' : b.kind === 'vehicle' ? 'ยานพาหนะ' : 'ห้องประชุม', r ? `${r.name}` : b.resId],
    [b.kind === 'borrow' ? 'วันที่ยืม – วันที่คืน' : 'วันและเวลา', when(b)],
    ...(b.kind === 'borrow' ? ([['จำนวน', `${b.pax} ${r?.sub.includes('ชุด') ? 'ชุด' : r?.sub.includes('หลัง') ? 'หลัง' : 'ชิ้น'}`], ['ประเภทการยืม', b.borrowType]] as [string, string][]) : [[b.kind === 'vehicle' ? 'จำนวนผู้โดยสาร' : 'จำนวนผู้เข้าร่วม', `${b.pax} คน`] as [string, string]]),
    ...(b.kind === 'vehicle' ? ([['ต้นทาง', b.from || '—'], ['ปลายทาง', b.to || '—']] as [string, string][]) : []),
    ['ผู้ขอ', b.by],
    ['ส่งคำขอเมื่อ', b.createdAt.replace(/^(\d+)-(\d+)-(\d+)/, (_, y, m, d) => `${d}/${m}/${Number(y) + 543}`) + ' น.'],
  ]
  return (
    <div className="flex flex-col gap-[14px]">
      <div className="flex items-start gap-[12px]">
        <KindBadge k={b.kind} size={44} />
        <div className="min-w-0 flex-1"><p className="text-[15px] leading-[1.35] font-semibold">{b.title}</p>{b.detail && <p className="text-[12px] font-light text-gray-30">{b.detail}</p>}</div>
        <StatusPill s={b.status} />
      </div>
      <dl className="grid grid-cols-2 gap-x-[16px] gap-y-[8px] rounded-[12px] bg-gray-subtle p-[14px] text-[12px] max-sm:grid-cols-1">
        {rows.map(([k, v]) => <div key={k} className="flex flex-col"><dt className="text-[11px] font-light text-gray-20">{k}</dt><dd className="font-medium break-words">{v}</dd></div>)}
      </dl>
      {b.extras.length > 0 && <div className="flex flex-wrap gap-[6px]">{b.extras.map((e) => <span key={e} className="flex items-center gap-[6px] rounded-full bg-blue-bg px-[10px] py-[4px] text-[11px] text-blue-dark"><Ic d={BI.check} s={12} />{e}</span>)}</div>}
      <div>
        <p className="mb-[8px] text-[13px] font-semibold">ประวัติการดำเนินการ</p>
        <ol className="relative flex flex-col gap-[10px] border-l-2 border-blue-20 pl-[16px]">
          {b.history.map((h, i) => (
            <li key={i} className="relative">
              <span className={`absolute top-[4px] -left-[22px] size-[10px] rounded-full ring-4 ring-white ${i === b.history.length - 1 ? 'bg-blue-00' : 'bg-blue-20'}`} />
              <p className="text-[12px] font-medium">{h.action} <span className="font-light text-gray-30">· {h.by}</span></p>
              <p className="text-[11px] font-light text-gray-20">{h.at}</p>
              {h.note && <p className="mt-[2px] rounded-[8px] bg-gray-subtle px-[10px] py-[6px] text-[12px] font-light text-gray-30">{h.note}</p>}
            </li>
          ))}
        </ol>
      </div>
    </div>
  )
}
