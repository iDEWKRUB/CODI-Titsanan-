import { bPersonas, kindMeta, statusTone, type BKind, type BPersona, type BStatus } from '../../data/erpBooking'
import { setBPersona, useBPersona } from '../../lib/bookingStore'

export { Btn, Crumbs, Gate, Radios, Row, Section, Title, ctl, err, page, ta } from '../strategic/Parts'
export { card } from '../saraban/Parts'
export { Ic } from '../asset/Parts'

export function BPersonaSwitch() {
  const me = useBPersona()
  return (
    <label className="flex items-center gap-[8px] rounded-[8px] bg-blue-bg px-[10px] py-[4px] text-[11px] text-gray-30">
      <span className="font-light max-sm:hidden">ดูในฐานะ</span>
      <select aria-label="ดูในฐานะผู้ใช้งาน" value={me} onChange={(e) => setBPersona(e.target.value as BPersona)} className="max-w-[260px] cursor-pointer bg-transparent py-[4px] text-[12px] font-medium text-blue-00 outline-none">
        {(Object.keys(bPersonas) as BPersona[]).map((p) => <option key={p} value={p}>{bPersonas[p].short}</option>)}
      </select>
    </label>
  )
}

export const StatusPill = ({ s }: { s: BStatus }) => (
  <span className={`inline-flex items-center gap-[6px] rounded-full px-[10px] py-[3px] text-[11px] font-medium whitespace-nowrap ${statusTone[s].tone}`}>
    <span aria-hidden="true" className={`size-[6px] rounded-full ${statusTone[s].dot}`} />
    {s}
  </span>
)

/** line icons for the four resource kinds */
export const BI = {
  room: 'M4 21V5a1 1 0 0 1 1-1h9a1 1 0 0 1 1 1v16M15 9h4a1 1 0 0 1 1 1v11M3 21h18M8 8h3M8 12h3M8 16h3',
  zoom: 'M3 7a2 2 0 0 1 2-2h8a2 2 0 0 1 2 2v10a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2ZM15 10l6-3v10l-6-3',
  vehicle: 'M5 17h14M5 17a2 2 0 1 0 4 0M15 17a2 2 0 1 0 4 0M3 17v-5l2-5h12l3 5v5M3 12h17',
  borrow: 'M3 7l9-4 9 4-9 4ZM3 7v10l9 4 9-4V7M12 11v10',
  clock: 'M12 7v5l3 2M12 21a9 9 0 1 0 0-18 9 9 0 0 0 0 18Z',
  list: 'M8 6h12M8 12h12M8 18h12M4 6h.01M4 12h.01M4 18h.01',
  cal: 'M5 5h14a1 1 0 0 1 1 1v13a1 1 0 0 1-1 1H5a1 1 0 0 1-1-1V6a1 1 0 0 1 1-1ZM4 10h16M8 3v4M16 3v4',
  eye: 'M2 12s4-7 10-7 10 7 10 7-4 7-10 7S2 12 2 12ZM12 9a3 3 0 1 0 0 6 3 3 0 0 0 0-6Z',
  edit: 'M4 20h4L19 9l-4-4L4 16ZM13 7l4 4',
  copy: 'M9 9h10v11H9ZM5 15V4h10',
  trash: 'M4 7h16M10 11v6M14 11v6M6 7l1 13h10l1-13M9 7V4h6v3',
  check: 'M5 12l5 5 9-10',
  x: 'M6 6l12 12M18 6 6 18',
  plus: 'M12 5v14M5 12h14',
  alert: 'M12 9v4M12 17h.01M10.3 3.9 2.4 18a2 2 0 0 0 1.7 3h15.8a2 2 0 0 0 1.7-3L13.7 3.9a2 2 0 0 0-3.4 0Z',
  bell: 'M6 9a6 6 0 0 1 12 0c0 6 2 7 2 7H4s2-1 2-7ZM10 20a2 2 0 0 0 4 0',
}
export const kindIcon: Record<BKind, string> = { room: BI.room, zoom: BI.zoom, vehicle: BI.vehicle, borrow: BI.borrow }
export const kindTone: Record<BKind, string> = { room: 'bg-[#e8f1ff] text-[#2057c9]', zoom: 'bg-[#e9e7ff] text-[#5b44d6]', vehicle: 'bg-[#fff1d6] text-[#a8650b]', borrow: 'bg-[#dff5e8] text-[#0f8a63]' }
export const kindLabel = (k: BKind) => kindMeta[k].short
