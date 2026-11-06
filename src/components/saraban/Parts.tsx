import { useState, type ReactNode } from 'react'
import { Link } from 'react-router-dom'
import { isMyTurn, labelFor, people, personIds, statusTone, type PersonId, type SDoc } from '../../data/saraban'
import { setMe, useMe } from '../../lib/sarabanStore'

export const page = 'flex w-full flex-col gap-[12px] px-[24px] pb-[55px] max-sm:px-[12px] max-sm:pb-[25px]'
export const card = 'rounded-[12px] border border-gray-line-2 bg-white'
export const lab = 'text-[12px] font-medium text-gray-30'
export const ctl = 'h-[40px] w-full rounded-[8px] border border-gray-line bg-white px-[12px] text-[13px] font-light text-black outline-none transition-colors placeholder:text-gray-20 hover:border-gray-10 focus:border-blue-00 disabled:bg-gray-bg disabled:text-gray-30'

/** Demo persona switch — the real system reads this from SSO / role-based access (TOR 4.7-1) */
export function PersonaSwitch() {
  const me = useMe()
  return (
    <label className="flex items-center gap-[8px] rounded-[8px] bg-blue-bg px-[10px] py-[4px] text-[11px] text-gray-30">
      <span className="font-light max-sm:hidden">ดูในฐานะ</span>
      <select aria-label="ดูในฐานะผู้ใช้งาน" value={me} onChange={(e) => setMe(e.target.value as PersonId)} className="cursor-pointer bg-transparent py-[4px] text-[12px] font-medium text-blue-00 outline-none">
        {personIds.map((p) => (
          <option key={p} value={p}>
            {people[p].short}
          </option>
        ))}
      </select>
    </label>
  )
}

export function Pill({ label }: { label: string }) {
  return <span className={`inline-flex min-w-[72px] justify-center rounded-[6px] px-[8px] py-[3px] text-[11px] leading-[normal] font-medium whitespace-nowrap ${statusTone(label)}`}>{label}</span>
}
export const DocPill = ({ d, me }: { d: SDoc; me: PersonId }) => <Pill label={labelFor(d, me)} />

export function Title({ children, back, right }: { children: string; back?: string; right?: ReactNode }) {
  return (
    <div className="flex flex-wrap items-center gap-[10px]">
      {back && (
        <Link to={back} aria-label="ย้อนกลับ" className="flex size-[28px] shrink-0 items-center justify-center rounded-[8px] bg-blue-bg text-blue-00 hover:bg-blue-20">
          <svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M10 3 5 8l5 5" /></svg>
        </Link>
      )}
      <h1 className="min-w-0 flex-1 text-[20px] leading-[1.2] font-semibold text-blue-00">{children}</h1>
      {right}
    </div>
  )
}

export function Crumbs({ items }: { items: { label: string; to?: string }[] }) {
  return (
    <nav aria-label="Breadcrumb" className="-mt-[2px] flex flex-wrap gap-[6px] text-[12px]">
      {items.map((c, i) => (
        <span key={i} className="flex gap-[6px]">
          {i > 0 && <span aria-hidden="true" className="text-gray-line">/</span>}
          {c.to ? <Link to={c.to} className="font-light text-gray-10 hover:text-blue-00">{c.label}</Link> : <span aria-current="page" className="font-light text-gray-10">{c.label}</span>}
        </span>
      ))}
    </nav>
  )
}

export function Step({ n, title, children, note }: { n: number; title: string; children: ReactNode; note?: ReactNode }) {
  return (
    <section className={`${card} flex flex-col gap-[14px] p-[22px] max-sm:p-[14px]`} aria-label={`ขั้นตอนที่ ${n}`}>
      <div className="flex items-center gap-[10px]">
        <span className="flex size-[24px] items-center justify-center rounded-full bg-blue-00 font-urbanist text-[12px] font-semibold text-white">{n}</span>
        <h2 className="text-[15px] font-semibold text-black">ขั้นตอนที่ {n}: {title}</h2>
        {note && <span className="ml-auto text-[11px] font-light text-gray-20">{note}</span>}
      </div>
      {children}
    </section>
  )
}

export function Field({ label, children, className = '', error }: { label: string; children: ReactNode; className?: string; error?: string }) {
  return (
    <label className={`flex min-w-0 flex-col gap-[4px] ${className}`}>
      <span className={lab}>{label}</span>
      {children}
      {error && <span role="alert" className="text-[11px] text-red-00">{error}</span>}
    </label>
  )
}

/** The chain of people a document travels through, with who is acting now (ลำดับผู้ลงนาม) */
export function ChainTrack({ d }: { d: SDoc }) {
  if (!d.chain.length) return <p className="text-[12px] font-light text-gray-20">เอกสารนี้ไม่มีลำดับผู้ลงนาม</p>
  return (
    <ol className="flex flex-wrap items-stretch gap-[6px]" aria-label="ลำดับผู้ลงนาม">
      {d.chain.map((s, i) => {
        const done = d.status === 'signed' || (d.status === 'review' && i < d.step)
        const cur = d.status === 'review' && i === d.step
        const bad = d.status === 'returned' && i === d.step
        return (
          <li key={i} className="flex items-center gap-[6px]">
            {i > 0 && <span aria-hidden="true" className="text-gray-line">→</span>}
            <span className={`flex items-center gap-[8px] rounded-[10px] border px-[10px] py-[6px] ${done ? 'border-[#9fdcc3] bg-[#ecfaf3]' : cur ? 'border-blue-00 bg-blue-bg' : bad ? 'border-[#f2b3b3] bg-[#fff1f1]' : 'border-gray-line bg-white'}`}>
              <span className={`flex size-[18px] items-center justify-center rounded-full text-[10px] font-semibold text-white ${done ? 'bg-[#17c3a1]' : cur ? 'bg-blue-00' : bad ? 'bg-[#e5484d]' : 'bg-gray-10'}`}>{done ? '✓' : i + 1}</span>
              <span className="flex flex-col leading-[1.25]">
                <span className="text-[12px] font-medium text-black">{people[s.who].short}</span>
                <span className="text-[10px] font-light text-gray-20">{s.role === 'sign' ? 'ผู้ลงนาม' : 'ผู้ที่ต้องผ่านเรื่อง (เซ็นผ่าน)'}{cur ? ' · ถึงตาคนนี้' : ''}</span>
              </span>
            </span>
          </li>
        )
      })}
    </ol>
  )
}

export function History({ d }: { d: SDoc }) {
  return (
    <ol className="flex flex-col" aria-label="ประวัติการส่ง">
      {[...d.history].reverse().map((h, i) => (
        <li key={i} className="relative flex gap-[12px] pb-[14px] last:pb-0">
          <span aria-hidden="true" className="relative mt-[5px] flex flex-col items-center">
            <span className={`size-[9px] rounded-full ${h.who === 'system' ? 'bg-gray-10' : 'bg-blue-00'}`} />
            <span className="mt-[3px] w-px flex-1 bg-gray-line" />
          </span>
          <div className="flex min-w-0 flex-col">
            <p className="text-[13px] font-medium text-black">{h.action}</p>
            <p className="text-[11px] font-light text-gray-20">{h.who === 'system' ? 'ระบบ' : people[h.who].short} · {h.at}</p>
            {h.note && <p className="mt-[2px] text-[12px] leading-[1.5] font-light text-gray-30">{h.note}</p>}
          </div>
        </li>
      ))}
    </ol>
  )
}

/** The document shown like a printed copy (book 3 fig 2-50) */
export function Paper({ d }: { d: SDoc }) {
  const signer = d.chain.find((s) => s.role === 'sign')?.who ?? d.chain[d.chain.length - 1]?.who
  return (
    <article className="rounded-[10px] border border-gray-line-2 bg-white p-[28px] shadow-[0_1px_6px_rgba(0,0,0,0.05)] max-sm:p-[16px]" aria-label="ตัวเอกสาร">
      <header className="flex items-start gap-[12px] border-b border-gray-line pb-[12px]">
        <span className="flex size-[40px] shrink-0 items-center justify-center rounded-[8px] bg-blue-bg text-[11px] font-semibold text-blue-00">โลโก้</span>
        <p className="min-w-0 flex-1 text-[14px] font-semibold">สำนักสารบรรณ <span className="font-light text-gray-20">(ตัวอย่างองค์กร)</span></p>
        <p className="text-right text-[10px] leading-[1.6] font-light text-gray-20">
          เลขที่อ้างอิง: {d.refNo}
          <br />
          วันที่เอกสาร: {d.dateDoc}
          {d.issuedNo && (
            <>
              <br />
              <b className="font-semibold text-[#0f8a63]">{d.issuedNo}</b>
            </>
          )}
        </p>
      </header>
      <h3 className="mt-[18px] text-center text-[16px] font-bold">{d.subject}</h3>
      {d.to && <p className="mt-[12px] text-[13px]">เรียน/ถึง: {d.to}</p>}
      <p className="mt-[10px] text-[13px] leading-[1.9] font-light whitespace-pre-line indent-[2.5em]">{d.body.split(/(\*\*[^*]+\*\*)/g).map((t, i) => (t.startsWith('**') && t.endsWith('**') ? <b key={i} className="font-semibold">{t.slice(2, -2)}</b> : t))}</p>
      {d.status === 'signed' && signer && (
        <p className="mt-[28px] ml-auto w-fit text-center text-[13px] leading-[1.5]">
          <span className="mb-[4px] block font-[cursive] text-[18px] text-blue-dark">{people[signer].name}</span>
          ({people[signer].name})
          <br />
          <span className="text-[11px] font-light text-gray-20">{people[signer].pos}</span>
        </p>
      )}
      {d.status !== 'signed' && signer && (
        <p className="mt-[28px] ml-auto w-fit text-right text-[13px] leading-[1.6] font-semibold">
          {people[signer].name}
          <br />
          <span className="text-[11px] font-light text-gray-20">{people[signer].pos}</span>
        </p>
      )}
      <footer className="mt-[20px] flex flex-wrap justify-between gap-[8px] border-t border-gray-line pt-[8px] text-[10px] font-light text-gray-20">
        <span>จัดทำโดย: {people[d.creator].pos}</span>
        <span>รหัสเอกสาร: {d.no}</span>
      </footer>
      {d.directive && (
        <section className="mt-[20px] rounded-[8px] border border-dashed border-[#e3b341] bg-[#fffbea] p-[14px]" aria-label="ข้อสั่งการ (แผ่นสุดท้าย)">
          <p className="text-[11px] font-semibold text-[#8a6100]">แผ่นสุดท้าย · ข้อสั่งการ</p>
          <p className="mt-[4px] text-[13px] leading-[1.7] font-light">{d.directive}</p>
        </section>
      )}
    </article>
  )
}

export function Empty({ children }: { children: ReactNode }) {
  return <p className="py-[40px] text-center text-[13px] font-light text-gray-20">{children}</p>
}

export function useTabState<T>(initial: T) {
  return useState<T>(initial)
}
export { isMyTurn }
