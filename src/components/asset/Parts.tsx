import type { ReactNode } from 'react'
import { aPersonas, repairTone, type APersona, type RepairStatus } from '../../data/erpAsset'
import { setAPersona, useAPersona } from '../../lib/assetStore'

export { Btn, Crumbs, Gate, Radios, Row, Section, Title, ctl, err, page, ta } from '../strategic/Parts'
export { card } from '../saraban/Parts'
export { DropZone, FileField } from '../hr/Parts'

export function APersonaSwitch() {
  const me = useAPersona()
  return (
    <label className="flex items-center gap-[8px] rounded-[8px] bg-blue-bg px-[10px] py-[4px] text-[11px] text-gray-30">
      <span className="font-light max-sm:hidden">ดูในฐานะ</span>
      <select aria-label="ดูในฐานะผู้ใช้งาน" value={me} onChange={(e) => setAPersona(e.target.value as APersona)} className="max-w-[230px] cursor-pointer bg-transparent py-[4px] text-[12px] font-medium text-blue-00 outline-none">
        {(Object.keys(aPersonas) as APersona[]).map((p) => <option key={p} value={p}>{aPersonas[p].short}</option>)}
      </select>
    </label>
  )
}

export const RepairPill = ({ s }: { s: RepairStatus }) => (
  <span className={`inline-flex items-center gap-[6px] rounded-full px-[10px] py-[3px] text-[11px] font-medium whitespace-nowrap ${repairTone[s].tone}`}>
    <span aria-hidden="true" className={`size-[6px] rounded-full ${repairTone[s].dot}`} />
    {s === 'จำหน่าย' ? 'จำหน่ายแล้ว' : s}
  </span>
)

export const Ic = ({ d, s = 16, w = 1.8 }: { d: string; s?: number; w?: number }) => <svg width={s} height={s} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={w} strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d={d} /></svg>
export const AI = {
  box: 'M3 7l9-4 9 4-9 4ZM3 7v10l9 4 9-4V7M12 11v10',
  tool: 'M14.7 6.3a4 4 0 0 0-5.4 5.4L3 18l3 3 6.3-6.3a4 4 0 0 0 5.4-5.4l-2.6 2.6-2.4-.6-.6-2.4Z',
  megaphone: 'M3 11v2a1 1 0 0 0 1 1h3l5 4V6L7 10H4a1 1 0 0 0-1 1ZM16 9a4 4 0 0 1 0 6M19 6a8 8 0 0 1 0 12',
  plus: 'M12 5v14M5 12h14',
  search: 'M11 18a7 7 0 1 0 0-14 7 7 0 0 0 0 14ZM20 20l-4-4',
  alert: 'M12 9v4M12 17h.01M10.3 3.9 2.4 18a2 2 0 0 0 1.7 3h15.8a2 2 0 0 0 1.7-3L13.7 3.9a2 2 0 0 0-3.4 0Z',
  barcode: 'M4 5v14M7 5v14M10 5v14M14 5v14M16 5v14M20 5v14',
  cash: 'M3 6h18v12H3ZM12 15a3 3 0 1 0 0-6 3 3 0 0 0 0 6Z',
  db: 'M12 3c4.4 0 8 1.3 8 3s-3.6 3-8 3-8-1.3-8-3 3.6-3 8-3ZM4 6v6c0 1.7 3.6 3 8 3s8-1.3 8-3V6M4 12v6c0 1.7 3.6 3 8 3s8-1.3 8-3v-6',
  check: 'M5 12l5 5 9-10',
  img: 'M4 5h16v14H4ZM4 15l4-4 4 4 3-3 5 5M15 9h.01',
  eye: 'M2 12s4-7 10-7 10 7 10 7-4 7-10 7S2 12 2 12ZM12 9a3 3 0 1 0 0 6 3 3 0 0 0 0-6Z',
}

/** stat tile used on the register home */
export function Stat({ label, value, sub, icon, tone }: { label: string; value: ReactNode; sub?: ReactNode; icon: string; tone: string }) {
  return (
    <div className="flex items-center gap-[14px] rounded-[14px] border border-gray-line-2 bg-white p-[16px]">
      <span className={`flex size-[44px] shrink-0 items-center justify-center rounded-[12px] ${tone}`}><Ic d={icon} s={20} /></span>
      <span className="flex min-w-0 flex-col">
        <span className="text-[12px] font-light text-gray-30">{label}</span>
        <span className="font-urbanist text-[22px] leading-[1.2] font-semibold text-blue-dark">{value}</span>
        {sub && <span className="text-[11px] font-light text-gray-20">{sub}</span>}
      </span>
    </div>
  )
}

/** Code-128-looking barcode (visual only) for asset stickers — book 1: "ฟีเจอร์พิมพ์บาร์โค้ด" */
export function Barcode({ value, w = 180, h = 46 }: { value: string; w?: number; h?: number }) {
  const bars: number[] = []
  for (const ch of `*${value}*`) { const c = ch.charCodeAt(0); bars.push(1 + (c % 3), 1 + ((c >> 2) % 2), 1 + ((c >> 3) % 3), 1 + ((c >> 1) % 2)) }
  const total = bars.reduce((a, b) => a + b, 0)
  let x = 0
  return (
    <svg viewBox={`0 0 ${total} 30`} width={w} height={h} preserveAspectRatio="none" role="img" aria-label={`บาร์โค้ด ${value}`}>
      {bars.map((b, i) => { const r = i % 2 === 0 ? <rect key={i} x={x} y="0" width={b} height="30" fill="#0b1f45" /> : null; x += b; return r })}
    </svg>
  )
}
