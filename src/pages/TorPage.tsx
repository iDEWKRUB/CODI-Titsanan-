import { useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import iconTor from '../assets/tor/icon-clipboard-check.svg'
import TorTabs from '../components/tor/TorTabs'
import PageTitle from '../components/ui/PageTitle'
import { outsideScope, torAsOf, torGroups, torStatusLabel, type TorItem, type TorStatus } from '../data/torCompliance'

const order: TorStatus[] = ['done', 'partial', 'todo', 'backend']

// Status = reserved colors, always shown with an icon + label (never color alone)
const tone: Record<TorStatus, { chip: string; bar: string; dot: string }> = {
  done: { chip: 'bg-green-bg text-green-text', bar: 'bg-green', dot: 'bg-green' },
  partial: { chip: 'bg-[#fff6d6] text-[#8a6a00]', bar: 'bg-yellow', dot: 'bg-yellow' },
  todo: { chip: 'bg-red-20 text-red-00', bar: 'bg-red-00', dot: 'bg-red-00' },
  backend: { chip: 'bg-gray-bg text-gray-20', bar: 'bg-gray-10', dot: 'bg-gray-10' },
}

function StatusIcon({ s }: { s: TorStatus }) {
  const common = { width: 14, height: 14, viewBox: '0 0 16 16', fill: 'none', stroke: 'currentColor', strokeWidth: 1.6, strokeLinecap: 'round' as const, strokeLinejoin: 'round' as const, 'aria-hidden': true }
  if (s === 'done') return <svg {...common}><path d="m3.5 8.5 3 3 6-7" /></svg>
  if (s === 'partial')
    return (
      <svg {...common}>
        <circle cx="8" cy="8" r="5.5" />
        <path d="M8 2.5a5.5 5.5 0 0 1 0 11Z" fill="currentColor" stroke="none" />
      </svg>
    )
  if (s === 'todo')
    return (
      <svg {...common}>
        <circle cx="8" cy="8" r="5.5" />
        <path d="M8 5v3.5M8 10.8v.2" />
      </svg>
    )
  return (
    <svg {...common}>
      <rect x="2.5" y="3" width="11" height="4" rx="1" />
      <rect x="2.5" y="9" width="11" height="4" rx="1" />
    </svg>
  )
}

function StatusChip({ s }: { s: TorStatus }) {
  return (
    <span className={`inline-flex items-center gap-[4px] rounded-[6px] px-[8px] py-[4px] text-[12px] leading-[normal] font-medium whitespace-nowrap ${tone[s].chip}`}>
      <StatusIcon s={s} />
      {torStatusLabel[s]}
    </span>
  )
}

function Row({ it }: { it: TorItem }) {
  return (
    <li className="grid grid-cols-[96px_minmax(0,1.3fr)_128px_minmax(0,1fr)] items-start gap-[16px] border-t border-gray-line-2 px-[24px] py-[14px] first:border-t-0 max-lg:grid-cols-[80px_minmax(0,1fr)_auto] max-sm:grid-cols-1 max-sm:gap-[8px] max-sm:px-[16px]">
      <span className="pt-[3px] font-urbanist text-[12px] font-bold text-blue-00">{it.ref}</span>
      <p className="text-[13px] leading-[1.6] font-light text-gray-30">{it.text}</p>
      <div className="pt-[1px] max-lg:justify-self-end max-sm:justify-self-start">
        <StatusChip s={it.status} />
      </div>
      <div className="flex flex-col gap-[6px] max-lg:col-span-3 max-lg:col-start-2 max-sm:col-span-1 max-sm:col-start-1">
        <p className="text-[12px] leading-[1.6] font-light text-gray-20">{it.note}</p>
        {it.risk && (
          <p className="flex gap-[6px] rounded-[8px] bg-red-subtle px-[10px] py-[8px] text-[12px] leading-[1.6] font-light text-red-00">
            <svg width="14" height="14" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" className="mt-[3px] shrink-0" aria-hidden="true">
              <path d="M8 2 1.8 13h12.4Z" strokeLinejoin="round" />
              <path d="M8 6.5V9M8 11v.2" />
            </svg>
            <span>
              <b className="font-medium">ข้อควรระวัง:</b> {it.risk}
            </span>
          </p>
        )}
        {it.to && (
          <Link to={it.to} className="self-start text-[12px] font-medium text-blue-00 hover:underline">
            เปิดหน้าที่เกี่ยวข้อง →
          </Link>
        )}
      </div>
    </li>
  )
}

/** Internal page: TOR_CODI_ERP_Phase_1_v.4 compliance of the current portal (last item in the sidebar) */
export default function TorPage() {
  const [filter, setFilter] = useState<TorStatus | 'all' | 'risk'>('all')
  const [query, setQuery] = useState('')
  const all = useMemo(() => torGroups.flatMap((g) => g.items), [])
  const count = (s: TorStatus) => all.filter((i) => i.status === s).length
  const risks = all.filter((i) => i.risk).length

  const groups = torGroups
    .map((g) => ({
      ...g,
      items: g.items.filter(
        (i) => (filter === 'all' || (filter === 'risk' ? !!i.risk : i.status === filter)) && (!query.trim() || `${i.ref} ${i.text} ${i.note}`.toLowerCase().includes(query.trim().toLowerCase())),
      ),
    }))
    .filter((g) => g.items.length)

  const exportCsv = () => {
    const cell = (c: string) => `"${c.replace(/"/g, '""')}"`
    const lines = [['หมวด', 'ข้อ', 'ข้อกำหนด', 'สถานะ', 'สิ่งที่มี / ช่องว่าง', 'ข้อควรระวัง'], ...torGroups.flatMap((g) => g.items.map((i) => [g.title, i.ref, i.text, torStatusLabel[i.status], i.note, i.risk ?? '']))]
    const a = document.createElement('a')
    a.href = URL.createObjectURL(new Blob(['﻿' + lines.map((l) => l.map(cell).join(',')).join('\r\n')], { type: 'text/csv;charset=utf-8' }))
    a.download = 'TOR-compliance.csv'
    a.click()
    URL.revokeObjectURL(a.href)
  }

  const chip = 'flex h-[32px] items-center gap-[6px] rounded-[8px] px-[12px] text-[12px] font-medium whitespace-nowrap transition-colors'

  return (
    <div className="flex flex-col gap-[16px] px-[24px] pb-[55px] max-sm:px-[12px] max-sm:pb-[25px]">
      <TorTabs />
      <div className="flex flex-wrap items-center gap-[12px] pb-[4px]">
        <div className="min-w-0 flex-1">
          <PageTitle icon={iconTor}>TOR Compliance</PageTitle>
          <p className="mt-[8px] text-[12px] font-light text-gray-20">
            TOR โครงการ ERP ระยะที่ 1 (v.4 ฉบับปรับ) เทียบกับหน้าจอที่มีใน Portal ตอนนี้ · ข้อมูล ณ {torAsOf} · หน้านี้ใช้ภายในทีม
          </p>
        </div>
        <button type="button" onClick={exportCsv} className="flex items-center gap-[6px] rounded-[8px] border border-gray-line bg-white px-[12px] py-[8px] text-[12px] font-medium text-blue-00 transition-colors hover:bg-blue-bg">
          ส่งออก CSV
        </button>
      </div>

      {/* Key finding */}
      <section className="flex gap-[12px] rounded-[12px] bg-blue-bg p-[16px] text-[13px] leading-[1.7] font-light text-gray-30 max-sm:flex-col">
        <svg width="20" height="20" viewBox="0 0 16 16" fill="none" stroke="#0085f9" strokeWidth="1.4" strokeLinecap="round" className="mt-[2px] shrink-0" aria-hidden="true">
          <circle cx="8" cy="8" r="6.2" />
          <path d="M8 7.3V11M8 5v.2" />
        </svg>
        <p>
          <b className="font-medium text-blue-dark">ข้อสังเกตหลัก:</b> Figma ชุดนี้คือ <b className="font-medium">CODI OSS</b> (One Stop Service) ซึ่ง TOR ข้อ 4.3 (7) ระบุว่าเป็น “ระบบภายในที่ ERP ต้องเชื่อมต่อ” ไม่ใช่ตัว ERP เอง
          ระบบหลัก 6 ระบบในข้อ 4.7 (สิทธิ์ผู้ใช้, e-Signature, e-Saraban, ยุทธศาสตร์, งบประมาณและการเงิน, รายงานผล) จึงยังไม่มีหน้าจอเกือบทั้งหมด ส่วนที่ทับกันคือปฏิทินประชุม (ตารางผู้บริหาร), แบบฟอร์มเบิกค่าใช้จ่าย และแดชบอร์ด
        </p>
      </section>

      {/* Summary: stat tiles + one stacked bar */}
      <section className="flex flex-col gap-[16px] rounded-[12px] border border-gray-line-2 bg-white p-[24px] max-sm:p-[16px]">
        <div className="grid grid-cols-5 gap-[12px] max-lg:grid-cols-3 max-sm:grid-cols-2">
          {order.map((s) => (
            <div key={s} className="flex flex-col gap-[6px] rounded-[10px] bg-white-soft p-[14px] ring-1 ring-gray-line-2">
              <span className="flex items-center gap-[6px] text-[12px] font-light text-gray-20">
                <span className={`size-[8px] rounded-full ${tone[s].dot}`} />
                {torStatusLabel[s]}
              </span>
              <span className="font-urbanist text-[28px] leading-none font-extrabold text-ink">{count(s)}</span>
            </div>
          ))}
          <div className="flex flex-col gap-[6px] rounded-[10px] bg-red-subtle p-[14px] ring-1 ring-red-20">
            <span className="text-[12px] font-light text-red-00">ข้อควรระวัง</span>
            <span className="font-urbanist text-[28px] leading-none font-extrabold text-red-00">{risks}</span>
          </div>
        </div>
        <div>
          <div className="flex h-[10px] gap-[2px] overflow-hidden rounded-full" role="img" aria-label={order.map((s) => `${torStatusLabel[s]} ${count(s)} ข้อ`).join(', ')}>
            {order.map((s) => (
              <span key={s} className={`h-full first:rounded-l-full last:rounded-r-full ${tone[s].bar}`} style={{ flexGrow: count(s) }} title={`${torStatusLabel[s]} ${count(s)} ข้อ`} />
            ))}
          </div>
          <p className="mt-[8px] text-[12px] font-light text-gray-20">
            ทั้งหมด {all.length} ข้อ · ครบแล้ว {Math.round((count('done') / all.length) * 100)}% · มีบางส่วน {Math.round((count('partial') / all.length) * 100)}%
          </p>
        </div>
      </section>

      <div className="flex flex-wrap items-center gap-[10px] rounded-[10px] bg-blue-dark px-[16px] py-[10px] text-white-soft">
        <span className="rounded-[6px] bg-white/15 px-[8px] py-[2px] text-[11px] font-semibold">PHASE 1 · ตาม TOR</span>
        <span className="min-w-0 flex-1 text-[12px] font-light">6 ระบบในข้อ 4.7 + ข้อกำหนดข้อ 4–17 · ตัวเลขด้านบนนับเฉพาะส่วนนี้</span>
      </div>

      {/* Filters (one row) */}
      <div className="flex flex-wrap items-center gap-[8px]">
        {(['all', ...order, 'risk'] as const).map((f) => (
          <button
            key={f}
            type="button"
            aria-pressed={filter === f}
            onClick={() => setFilter(f)}
            className={`${chip} ${filter === f ? 'bg-blue-00 text-white-soft' : 'bg-blue-bg text-blue-00 hover:bg-blue-20'}`}
          >
            {f !== 'all' && f !== 'risk' && <span className={`size-[6px] rounded-full ${tone[f].dot}`} />}
            {f === 'all' ? 'ทั้งหมด' : f === 'risk' ? 'ข้อควรระวัง' : torStatusLabel[f]}
          </button>
        ))}
        <input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="ค้นหาข้อหรือคำ เช่น 5.9, e-Signature"
          aria-label="ค้นหาข้อ TOR"
          className="ml-auto h-[36px] w-[280px] rounded-[8px] border border-gray-line bg-gray-subtle px-[14px] text-[12px] font-light text-black outline-none placeholder:text-gray-20 focus:border-blue-00 max-sm:ml-0 max-sm:w-full"
        />
      </div>

      {groups.length === 0 && <p className="rounded-[12px] bg-gray-bg px-[24px] py-[36px] text-center text-[13px] font-light text-gray-20">ไม่พบข้อที่ตรงกับตัวกรอง</p>}

      {groups.map((g) => {
        const done = g.items.filter((i) => i.status === 'done' || i.status === 'partial').length
        return (
          <section key={g.id} className="overflow-hidden rounded-[12px] border border-gray-line-2 bg-white">
            <header className="flex flex-wrap items-center gap-[12px] bg-gray-bg px-[24px] py-[14px] max-sm:px-[16px]">
              <div className="min-w-0 flex-1">
                <h2 className="text-[15px] font-semibold text-blue-title">{g.title}</h2>
                {g.subtitle && <p className="text-[12px] font-light text-gray-20">{g.subtitle}</p>}
              </div>
              <span className="text-[12px] font-light text-gray-20">
                มีหน้าจอแล้ว {done}/{g.items.length} ข้อ
              </span>
            </header>
            <ul>
              {g.items.map((it) => (
                <Row key={it.ref} it={it} />
              ))}
            </ul>
          </section>
        )
      })}
      <div className="mt-[8px] flex flex-wrap items-center gap-[10px] rounded-[10px] bg-gray-30 px-[16px] py-[10px] text-white-soft">
        <span className="rounded-[6px] bg-white/15 px-[8px] py-[2px] text-[11px] font-semibold">นอกขอบเขต TOR</span>
        <span className="min-w-0 flex-1 text-[12px] font-light">หน้า OSS ที่ทีมทำเพิ่มจาก Figma — TOR ข้อ 4.3 (7) ถือว่า OSS เป็นระบบเดิมที่ ERP ต้องเชื่อมต่อ จึงไม่อยู่ในสัญญา Phase 1 (ควรยืนยันกับ พอช.) · ไม่นับในตัวเลขด้านบน</span>
      </div>
      <section className="overflow-hidden rounded-[12px] border border-gray-line-2 bg-white">
        <ul>
          {outsideScope.map((o) => (
            <li key={o.to} className="flex flex-wrap items-center gap-[8px] border-b border-gray-line-2 px-[24px] py-[12px] last:border-b-0 max-sm:px-[16px]">
              <div className="min-w-0 flex-1">
                <p className="text-[13px] font-medium text-black">{o.name}</p>
                <p className="text-[12px] font-light text-gray-20">{o.note}</p>
              </div>
              <Link to={o.to} className="rounded-[8px] bg-blue-bg px-[12px] py-[6px] text-[12px] font-medium text-blue-00 transition-colors hover:bg-blue-20">
                เปิดหน้า
              </Link>
            </li>
          ))}
        </ul>
      </section>
    </div>
  )
}
