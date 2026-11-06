import type { ReactNode } from 'react'
import { nPersonas, nTone, sevTone, when, type NPersona, type NStatus, type Notice, type Severity } from '../../data/erpNotify'
import { setNPersona, useNPersona } from '../../lib/notifyStore'

export { Btn, Crumbs, Gate, Radios, Row, Section, Title, ctl, err, page, ta } from '../strategic/Parts'
export { Ic } from '../asset/Parts'
import { Ic } from '../asset/Parts'

export function NPersonaSwitch() {
  const me = useNPersona()
  return (
    <label className="flex items-center gap-[8px] rounded-[8px] bg-blue-bg px-[10px] py-[4px] text-[11px] text-gray-30">
      <span className="font-light max-sm:hidden">ดูในฐานะ</span>
      <select aria-label="ดูในฐานะผู้ใช้งาน" value={me} onChange={(e) => setNPersona(e.target.value as NPersona)} className="max-w-[230px] cursor-pointer bg-transparent py-[4px] text-[12px] font-medium text-blue-00 outline-none">
        {(Object.keys(nPersonas) as NPersona[]).map((p) => <option key={p} value={p}>{nPersonas[p].short}</option>)}
      </select>
    </label>
  )
}
export const SevPill = ({ s }: { s: Severity }) => <span className={`inline-flex items-center gap-[6px] rounded-full px-[10px] py-[3px] text-[11px] font-medium whitespace-nowrap ${sevTone[s].tone}`}><span aria-hidden="true" className={`size-[6px] rounded-full ${sevTone[s].dot}`} />{s === 'สูง' ? 'ความเสี่ยงสูง' : s === 'ปานกลาง' ? 'ความเสี่ยงปานกลาง' : 'ทั่วไป'}</span>
export const StPill = ({ s }: { s: NStatus }) => <span className={`inline-flex items-center gap-[6px] rounded-full px-[10px] py-[3px] text-[11px] font-medium whitespace-nowrap ${nTone[s].tone}`}><span aria-hidden="true" className={`size-[6px] rounded-full ${nTone[s].dot}`} />{s}</span>

export const NI = {
  bell: 'M6 9a6 6 0 0 1 12 0c0 6 2 7 2 7H4s2-1 2-7ZM10 20a2 2 0 0 0 4 0',
  alert: 'M12 9v4M12 17h.01M10.3 3.9 2.4 18a2 2 0 0 0 1.7 3h15.8a2 2 0 0 0 1.7-3L13.7 3.9a2 2 0 0 0-3.4 0Z',
  info: 'M12 21a9 9 0 1 0 0-18 9 9 0 0 0 0 18ZM12 11v5M12 8h.01',
  flame: 'M12 3c1 3-3 4-3 8a3 3 0 0 0 6 0c0-1-.5-2-1-3 3 1 5 4 5 7a7 7 0 0 1-14 0c0-5 4-7 7-12Z',
  plus: 'M12 5v14M5 12h14',
  eye: 'M2 12s4-7 10-7 10 7 10 7-4 7-10 7S2 12 2 12ZM12 9a3 3 0 1 0 0 6 3 3 0 0 0 0-6Z',
  edit: 'M4 20h4L19 9l-4-4L4 16ZM13 7l4 4',
  copy: 'M9 9h10v11H9ZM5 15V4h10',
  trash: 'M4 7h16M10 11v6M14 11v6M6 7l1 13h10l1-13M9 7V4h6v3',
  check: 'M5 12l5 5 9-10',
  search: 'M11 18a7 7 0 1 0 0-14 7 7 0 0 0 0 14ZM20 20l-4-4',
  sparkle: 'M12 3l1.8 4.7L18.5 9.5l-4.7 1.8L12 16l-1.8-4.7L5.5 9.5l4.7-1.8Z',
  clock: 'M12 7v5l3 2M12 21a9 9 0 1 0 0-18 9 9 0 0 0 0 18Z',
  gear: 'M12 15a3 3 0 1 0 0-6 3 3 0 0 0 0 6ZM19.4 15a1.7 1.7 0 0 0 .3 1.8l.1.1a2 2 0 1 1-2.8 2.8l-.1-.1a1.7 1.7 0 0 0-1.8-.3 1.7 1.7 0 0 0-1 1.5V21a2 2 0 1 1-4 0v-.1a1.7 1.7 0 0 0-1.1-1.5 1.7 1.7 0 0 0-1.8.3l-.1.1a2 2 0 1 1-2.8-2.8l.1-.1a1.7 1.7 0 0 0 .3-1.8 1.7 1.7 0 0 0-1.5-1H3a2 2 0 1 1 0-4h.1a1.7 1.7 0 0 0 1.5-1.1 1.7 1.7 0 0 0-.3-1.8l-.1-.1a2 2 0 1 1 2.8-2.8l.1.1a1.7 1.7 0 0 0 1.8.3H9a1.7 1.7 0 0 0 1-1.5V3a2 2 0 1 1 4 0v.1a1.7 1.7 0 0 0 1 1.5 1.7 1.7 0 0 0 1.8-.3l.1-.1a2 2 0 1 1 2.8 2.8l-.1.1a1.7 1.7 0 0 0-.3 1.8V9a1.7 1.7 0 0 0 1.5 1H21a2 2 0 1 1 0 4h-.1a1.7 1.7 0 0 0-1.5 1Z',
}
const sevIcon: Record<Severity, string> = { สูง: NI.flame, ปานกลาง: NI.alert, ทั่วไป: NI.info }
const ib = 'flex size-[30px] items-center justify-center rounded-[8px] border border-gray-line-2 text-gray-30 transition hover:border-blue-20 hover:bg-blue-bg hover:text-blue-00 focus-visible:outline-2 focus-visible:outline-blue-00'

type ListProps = {
  rows: Notice[]
  can: (n: Notice) => { edit: boolean; del: boolean }
  onView: (n: Notice) => void
  onEdit: (n: Notice) => void
  onCopy: (n: Notice) => void
  onDelete: (n: Notice) => void
  extra?: (n: Notice) => ReactNode
  empty?: string
}
/** notification rows (icon by risk level, title, detail, source, time, status, actions) — shared by 2.5.2.1 and 2.5.2.2 */
export function NoticeList({ rows, can, onView, onEdit, onCopy, onDelete, extra, empty = 'ไม่มีรายการแจ้งเตือน' }: ListProps) {
  return (
    <>
      <ul className="flex flex-col">
        {rows.map((n) => {
          const p = can(n)
          const unread = n.status === 'ใหม่'
          return (
            <li key={n.id} className={`flex items-start gap-[12px] border-b border-gray-line-2 py-[12px] last:border-0 max-sm:flex-wrap ${unread ? 'bg-[#f7f5ff]/70' : ''}`}>
              <span className={`mt-[2px] flex size-[38px] shrink-0 items-center justify-center rounded-[11px] ${sevTone[n.severity].icon}`}><Ic d={sevIcon[n.severity]} s={18} /></span>
              <div className="min-w-0 flex-1">
                <div className="flex flex-wrap items-center gap-[6px]">
                  <p className={`text-[13px] leading-[1.4] ${unread ? 'font-semibold' : 'font-medium'}`}>{n.title}</p>
                  {unread && <span className="size-[7px] rounded-full bg-[#6a55e8]" aria-label="ยังไม่ได้อ่าน" />}
                </div>
                <p className="line-clamp-2 text-[12px] leading-[1.5] font-light text-gray-30">{n.detail}</p>
                <div className="mt-[6px] flex flex-wrap items-center gap-[8px]">
                  <SevPill s={n.severity} />
                  <StPill s={n.status} />
                  <span className="flex items-center gap-[4px] text-[11px] font-light text-gray-20"><Ic d={NI.clock} s={12} />{when(n)}</span>
                  <span className="rounded-full bg-gray-bg px-[8px] py-[2px] text-[10px] text-gray-30">{n.source}</span>
                </div>
              </div>
              <div className="flex shrink-0 items-center gap-[6px] max-sm:w-full max-sm:justify-end">
                {extra?.(n)}
                <button type="button" aria-label={`ดูข้อมูลเพิ่มเติม ${n.title}`} title="ดูข้อมูลเพิ่มเติม" onClick={() => onView(n)} className={ib}><Ic d={NI.eye} s={15} /></button>
                {p.edit && <button type="button" aria-label={`แก้ไข ${n.title}`} title="แก้ไข" onClick={() => onEdit(n)} className={ib}><Ic d={NI.edit} s={15} /></button>}
                <button type="button" aria-label={`คัดลอก ${n.title}`} title="คัดลอกข้อมูล" onClick={() => onCopy(n)} className={ib}><Ic d={NI.copy} s={15} /></button>
                {p.del && <button type="button" aria-label={`ลบ ${n.title}`} title="ลบรายการ" onClick={() => onDelete(n)} className={`${ib} hover:!border-[#f0b4b4] hover:!bg-[#fff1f1] hover:!text-[#c13232]`}><Ic d={NI.trash} s={15} /></button>}
              </div>
            </li>
          )
        })}
      </ul>
      {!rows.length && <p className="py-[28px] text-center text-[13px] font-light text-gray-20">{empty}</p>}
    </>
  )
}
