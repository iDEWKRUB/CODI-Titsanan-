import { useState, type ReactNode } from 'react'
import { cTone, dueOf, dueTone, employer, gPersonasA, money, thDate, typeOf, type CStatus, type Contract, type GPersona, type TypeKey } from '../../data/erpAgreement'
import { setGPersona, useGPersona } from '../../lib/agreementStore'

export { Btn, Crumbs, Gate, Radios, Row, Section, Title, ctl, err, page, ta } from '../strategic/Parts'
export { card } from '../saraban/Parts'
export { Ic } from '../asset/Parts'

export function GPersonaSwitch() {
  const me = useGPersona()
  return (
    <label className="flex items-center gap-[8px] rounded-[8px] bg-blue-bg px-[10px] py-[4px] text-[11px] text-gray-30">
      <span className="font-light max-sm:hidden">ดูในฐานะ</span>
      <select aria-label="ดูในฐานะผู้ใช้งาน" value={me} onChange={(e) => setGPersona(e.target.value as GPersona)} className="max-w-[230px] cursor-pointer bg-transparent py-[4px] text-[12px] font-medium text-blue-00 outline-none">
        {(Object.keys(gPersonasA) as GPersona[]).map((p) => <option key={p} value={p}>{gPersonasA[p].short}</option>)}
      </select>
    </label>
  )
}

export const CPill = ({ s }: { s: CStatus }) => (
  <span className={`inline-flex items-center gap-[6px] rounded-full px-[10px] py-[3px] text-[11px] font-medium whitespace-nowrap ${cTone[s].tone}`}>
    <span aria-hidden="true" className={`size-[6px] rounded-full ${cTone[s].dot}`} />
    {s}
  </span>
)
export const DuePill = ({ c }: { c: Contract }) => {
  const d = dueOf(c)
  return d === '-' ? <span className="text-gray-20">—</span> : <span className={`inline-flex rounded-full px-[10px] py-[3px] text-[11px] font-medium whitespace-nowrap ${dueTone[d]}`}>{d}</span>
}

export const GI = {
  doc: 'M7 3h7l4 4v14H7ZM14 3v4h4M10 12h5M10 16h5',
  plus: 'M12 5v14M5 12h14',
  book: 'M4 5a2 2 0 0 1 2-2h13v16H6a2 2 0 0 0-2 2ZM19 19v2H6',
  clip: 'M20 11l-8 8a5 5 0 0 1-7-7l9-9a3.5 3.5 0 0 1 5 5l-9 9a2 2 0 0 1-3-3l8-8',
  eye: 'M2 12s4-7 10-7 10 7 10 7-4 7-10 7S2 12 2 12ZM12 9a3 3 0 1 0 0 6 3 3 0 0 0 0-6Z',
  edit: 'M4 20h4L19 9l-4-4L4 16ZM13 7l4 4',
  copy: 'M9 9h10v11H9ZM5 15V4h10',
  trash: 'M4 7h16M10 11v6M14 11v6M6 7l1 13h10l1-13M9 7V4h6v3',
  check: 'M5 12l5 5 9-10',
  x: 'M6 6l12 12M18 6 6 18',
  search: 'M11 18a7 7 0 1 0 0-14 7 7 0 0 0 0 14ZM20 20l-4-4',
  alert: 'M12 9v4M12 17h.01M10.3 3.9 2.4 18a2 2 0 0 0 1.7 3h15.8a2 2 0 0 0 1.7-3L13.7 3.9a2 2 0 0 0-3.4 0Z',
  clock: 'M12 7v5l3 2M12 21a9 9 0 1 0 0-18 9 9 0 0 0 0 18Z',
  pen: 'M3 21l4-1 12-12-3-3L4 17ZM14 6l3 3',
  shield: 'M12 3l8 3v6c0 5-3.5 8-8 9-4.5-1-8-4-8-9V6Z',
  left: 'M15 6l-6 6 6 6',
  right: 'M9 6l6 6-6 6',
  upload: 'M12 16V4M7 9l5-5 5 5M4 20h16',
}

/** step header for the 2-step "สร้างสัญญาฉบับใหม่" flow */
export function Steps({ step }: { step: 1 | 2 }) {
  const items = ['เลือกประเภทสัญญา', 'ข้อมูลผู้ว่าจ้างและผู้รับจ้าง']
  return (
    <ol className="flex items-center gap-[10px]" aria-label="ขั้นตอนการสร้างสัญญา">
      {items.map((l, i) => (
        <li key={l} className="flex items-center gap-[8px]">
          <span className={`flex size-[26px] items-center justify-center rounded-full text-[12px] font-semibold ${i + 1 <= step ? 'bg-blue-00 text-white' : 'bg-gray-bg text-gray-20'}`}>{i + 1}</span>
          <span className={`text-[12px] ${i + 1 === step ? 'font-semibold text-blue-dark' : 'font-light text-gray-30'} max-sm:hidden`}>{l}</span>
          {i === 0 && <span className="h-px w-[28px] bg-gray-line" />}
        </li>
      ))}
    </ol>
  )
}

/** A4-looking contract paper (sample template or the real data) — viewer with ‹ 1 / 2 › controls, as in book figs 2-118 and 2-126 */
export function ContractViewer({ type, c, label, onPage }: { type: TypeKey; c?: Partial<Contract>; label?: string; onPage?: (n: number) => void }) {
  const [p, setP] = useState(1)
  const t = typeOf(type)
  const go = (n: number) => { setP(n); onPage?.(n) }
  const v = (x: string | undefined, ph: string) => (x ? <b className="font-semibold">{x}</b> : <span className="text-gray-20">{ph}</span>)
  return (
    <div className="flex flex-col gap-[10px]">
      <div className="flex items-center justify-between gap-[8px]">
        <span className="min-w-0 truncate text-[12px] font-medium text-gray-30">{label ?? `ตัวอย่าง: ${t.label}`}</span>
        <div className="flex items-center gap-[6px]" role="group" aria-label="เลื่อนหน้าเอกสาร">
          <button type="button" aria-label="หน้าก่อนหน้า" disabled={p === 1} onClick={() => go(1)} className="flex size-[30px] items-center justify-center rounded-[8px] border border-gray-line text-blue-00 hover:bg-blue-bg disabled:opacity-30"><svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d={GI.left} /></svg></button>
          <span className="min-w-[64px] text-center font-urbanist text-[12px] text-gray-30" aria-live="polite">{p} / 2 หน้า</span>
          <button type="button" aria-label="หน้าถัดไป" disabled={p === 2} onClick={() => go(2)} className="flex size-[30px] items-center justify-center rounded-[8px] border border-gray-line text-blue-00 hover:bg-blue-bg disabled:opacity-30"><svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d={GI.right} /></svg></button>
        </div>
      </div>
      <div className="mx-auto w-full max-w-[520px] rounded-[6px] border border-gray-line-2 bg-white p-[28px] text-[11px] leading-[1.9] text-black shadow-[0_6px_24px_rgba(20,40,90,0.10)] max-sm:p-[16px]" aria-label={`หน้า ${p} ของเอกสารสัญญา`}>
        {p === 1 ? (
          <>
            <p className="text-center text-[14px] font-semibold">{t.label}</p>
            <p className="text-center text-[10px] text-gray-30">สัญญาเลขที่ {v(c?.no, '................')}</p>
            <p className="mt-[10px]">สัญญาฉบับนี้ทำขึ้น ณ {employer.name} เมื่อวันที่ {v(c?.start ? thDate(c.start) : '', '.... / .... / ....')} ระหว่าง {employer.name} โดย {employer.signer} ตำแหน่ง{employer.position} ซึ่งต่อไปนี้เรียกว่า “ผู้ว่าจ้าง” ฝ่ายหนึ่ง กับ {v(c?.party?.name, '..............................')} {c?.party?.taxId ? <>เลขผู้เสียภาษี {c.party.taxId} </> : null}โดย {v(c?.party?.signer, '..................')} ตำแหน่ง {v(c?.party?.position, '..........')} ซึ่งต่อไปนี้เรียกว่า “ผู้รับจ้าง” อีกฝ่ายหนึ่ง</p>
            <p className="mt-[8px] font-semibold">ข้อ 1 {t.pages[0]}</p>
            <p>{c?.purpose || 'ผู้ว่าจ้างตกลงว่าจ้างและผู้รับจ้างตกลงรับจ้างตามรายละเอียดที่ระบุไว้ในสัญญานี้ โดยมีวัตถุประสงค์เพื่อ ....................................................'}</p>
            {c?.value ? <p>ค่าตอบแทนรวมทั้งสิ้น <b className="font-semibold">{money(c.value)}</b> บาท (รวมภาษีมูลค่าเพิ่มแล้ว)</p> : <p>ค่าตอบแทนตามที่ตกลงกันในเอกสารแนบท้ายสัญญา</p>}
            <p className="mt-[6px] text-gray-20">........................................................................................................</p>
          </>
        ) : (
          <>
            <p className="font-semibold">ข้อ 2 {t.pages[1]}</p>
            <p>ระยะเวลาตามสัญญา เริ่มตั้งแต่ {v(c?.start ? thDate(c.start) : '', '..........')} ถึง {v(c?.end ? thDate(c.end) : '', '..........')} คู่สัญญาต้องปฏิบัติตามเงื่อนไขและมาตรฐานที่ผู้ว่าจ้างกำหนด หากฝ่ายใดผิดสัญญา ให้ปฏิบัติตามระเบียบพัสดุของสถาบันฯ</p>
            <p className="mt-[6px] font-semibold">ข้อ 3 การเปลี่ยนแปลงและการบอกเลิกสัญญา</p>
            <p>การแก้ไขเพิ่มเติมสัญญานี้ต้องทำเป็นหนังสือและลงนามโดยคู่สัญญาทั้งสองฝ่าย การบอกเลิกสัญญาให้บอกกล่าวล่วงหน้าเป็นลายลักษณ์อักษรไม่น้อยกว่า 30 วัน</p>
            <p className="mt-[8px]">สัญญานี้ทำขึ้นเป็นสองฉบับ มีข้อความถูกต้องตรงกัน คู่สัญญาได้อ่านและเข้าใจข้อความโดยตลอดแล้ว จึงลงลายมือชื่อไว้เป็นสำคัญ</p>
            <div className="mt-[18px] grid grid-cols-2 gap-[16px] text-center">
              {[['ผู้ว่าจ้าง', employer.signer, c?.status === 'ลงนามแล้ว'], ['ผู้รับจ้าง', c?.party?.signer ?? '', c?.status === 'ลงนามแล้ว']].map(([r, n, signed]) => (
                <div key={String(r)}>
                  <p className={`h-[26px] font-urbanist text-[16px] italic ${signed ? 'text-blue-00' : 'text-transparent'}`}>{signed ? String(n).replace(/^(ดร\.|นาย|นางสาว|นาง)/, '') : '.'}</p>
                  <p className="border-t border-dotted border-gray-20 pt-[2px]">({String(n) || '......................'})</p>
                  <p className="text-gray-30">{String(r)}</p>
                </div>
              ))}
            </div>
          </>
        )}
      </div>
    </div>
  )
}

export function Panel({ title, action, children, label }: { title: string; action?: ReactNode; children: ReactNode; label?: string }) {
  return (
    <section aria-label={label ?? title} className="flex flex-col gap-[12px] rounded-[14px] border border-gray-line-2 bg-white p-[16px]">
      <div className="flex flex-wrap items-center gap-[10px]"><h2 className="min-w-0 flex-1 text-[15px] font-semibold">{title}</h2>{action}</div>
      {children}
    </section>
  )
}
