import { useMemo } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useToast } from '../components/leader/Parts'
import { Crumbs, FPersonaSwitch, FStatus, Title, card, page } from '../components/finance/Parts'
import { baht0, clearSeries, fMonths, importantNotices, loanTotal, loanTypes, money, payableSeries, taxPending, taxSeries, thDate, withdrawSeries, type Loan } from '../data/erpFinance'
import { copyLoan, loans, useFPersona, useLoans } from '../lib/erpFinanceStore'

const tone = ['bg-[#0885ff]', 'bg-[#30b3a1]', 'bg-[#6c63d9]', 'bg-[#ffa32b]']
const icons = ['M4 7h16v12H4ZM4 11h16M8 15h3', 'M12 4v16M16 8H10a2.5 2.5 0 0 0 0 5h4a2.5 2.5 0 0 1 0 5H8', 'M5 12l4 4 10-10', 'M6 4h9l3 3v13H6ZM14 4v4h4M9 14h6M9 17h4']

function Stat({ i, label, n, sub }: { i: number; label: string; n: string; sub: string }) {
  return (
    <article className={`flex items-center gap-[10px] rounded-[12px] px-[14px] py-[14px] text-white ${tone[i]}`}>
      <span className="flex size-[40px] shrink-0 items-center justify-center rounded-[10px] bg-white/25" aria-hidden="true">
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d={icons[i]} /></svg>
      </span>
      <p className="flex-1 text-[12px] leading-[1.3] font-medium">{label}</p>
      <p className="flex flex-col items-end leading-none"><b className="font-urbanist text-[22px] font-bold whitespace-nowrap">{n}</b><span className="mt-[4px] text-[10px] whitespace-nowrap">{sub}</span></p>
    </article>
  )
}

const quick = [
  { label: 'ยื่นคำขอยืมเงิน', to: '/finance/loan', d: 'M12 5v14M5 12h14' },
  { label: 'ยื่นขอทดรองจ่าย', to: '/finance/loan?type=n', d: 'M4 8h16v10H4ZM4 12h16M16 5l3 3' },
  { label: 'ตั้งเบิกให้ผู้รับจ้าง/ผู้ขาย', to: '', d: 'M6 4h9l3 3v13H6ZM14 4v4h4M9 13h6M9 16h4' },
  { label: 'ส่งเอกสารหักล้าง', to: '/finance/clear', d: 'M5 12l4 4 10-10' },
]

/** ภาพรวมงบประมาณและการเงิน (book 3 fig 2-18) — 2.1.4.1 : cards, quick menu and the latest list are computed from the loans of 2.1.4.2–2.1.4.5 */
export default function FinanceHomePage() {
  const all = useLoans()
  const me = useFPersona()
  const navigate = useNavigate()
  const [toast, show] = useToast()
  const active = all.filter((l) => l.status !== 'cleared' && l.status !== 'rejected')
  const waitClear = all.filter((l) => l.status === 'verified')
  const paid = all.filter((l) => l.status === 'cleared')
  const sum = (xs: Loan[]) => xs.reduce((a, l) => a + loanTotal(l), 0)
  const latest = useMemo(() => [...all].sort((a, b) => b.id - a.id).slice(0, 6), [all])
  const waitApprove = all.filter((l) => l.status === 'submitted').length
  const waitVerify = all.filter((l) => l.status === 'approved').length

  const x = (i: number) => 40 + i * 30
  const maxL = 1000
  const line = (a: number[]) => a.map((v, i) => `${i ? 'L' : 'M'}${x(i)} ${220 - (v / maxL) * 190}`).join(' ')
  const maxB = 3000

  const view = (l: Loan) => {
    const to = { submitted: `/finance/approve?id=${l.id}`, approved: `/finance/verify?id=${l.id}`, verified: `/finance/clear?id=${l.id}`, cleared: `/finance/clear?id=${l.id}`, returned: `/finance/loan?edit=${l.id}`, rejected: `/finance/approve?id=${l.id}` }[l.status]
    navigate(to)
  }
  const copy = (l: Loan) => {
    const c = copyLoan(l)
    sessionStorage.setItem('codi.finance.copy', JSON.stringify(c))
    navigate('/finance/loan?copy=1')
  }
  const remove = (l: Loan) => {
    if (me !== 'staff') return show('ต้องเป็นเจ้าหน้าที่ผู้ยื่นคำขอ')
    if (l.status === 'approved' || l.status === 'verified' || l.status === 'cleared') return show('ลบไม่ได้ — เอกสารผ่านการอนุมัติแล้ว')
    if (window.confirm(`ลบเอกสาร ${l.no}?`)) {
      loans.remove(l.id)
      show(`ลบเอกสาร ${l.no} แล้ว`)
    }
  }

  return (
    <div className={page}>
      <Title right={<FPersonaSwitch />}>ภาพรวมงบประมาณและการเงิน</Title>
      <Crumbs items={[{ label: 'หน้าแรก', to: '/finance' }, { label: 'งานงบประมาณและการเงิน' }]} />

      <section aria-label="ตัวชี้วัด" className="flex flex-col gap-[10px] rounded-[12px] bg-[#dbe9fb] p-[20px] max-sm:p-[12px]">
        <p className="text-[12px] font-light text-gray-30">ข้อมูลล่าสุด : 25 พฤศจิกายน 2568, 2.00 PM · รอตรวจสอบ {waitVerify} · รออนุมัติ {waitApprove}</p>
        <div className="grid grid-cols-4 gap-[12px] max-xl:grid-cols-2 max-sm:grid-cols-1">
          <Stat i={0} label="รายการเงินยืม" n={String(active.length)} sub={`${baht0(sum(active))} บาท`} />
          <Stat i={1} label="รายการรอเคลียร์" n={String(waitClear.length)} sub={`${baht0(sum(waitClear))} บาท`} />
          <Stat i={2} label="รายการที่จ่ายแล้ว" n={String(paid.length)} sub={`${baht0(sum(paid))} บาท`} />
          <Stat i={3} label="ภาษีที่ค้างนำส่ง" n={String(taxPending.count)} sub={`${baht0(taxPending.amount)} บาท`} />
        </div>
      </section>

      <section aria-label="เมนูด่วน" className="grid grid-cols-4 gap-[10px] max-lg:grid-cols-2 max-sm:grid-cols-1">
        {quick.map((q) => {
          const inner = (
            <>
              <span className="flex size-[34px] shrink-0 items-center justify-center rounded-[9px] bg-blue-bg text-blue-00" aria-hidden="true"><svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d={q.d} /></svg></span>
              <span className="flex-1 text-[12px] font-medium">{q.label}</span>
              <span className="rounded-[6px] bg-blue-00 px-[10px] py-[3px] text-[11px] text-white">สร้าง</span>
            </>
          )
          const cls = `${card} flex items-center gap-[10px] px-[12px] py-[10px] text-left transition hover:border-blue-00`
          return q.to ? <Link key={q.label} to={q.to} className={cls}>{inner}</Link> : <button key={q.label} type="button" className={cls} onClick={() => show('หน้าตั้งเบิกให้ผู้รับจ้าง/ผู้ขาย ยังไม่มีหน้าจอสำหรับรายการนี้')}>{inner}</button>
        })}
      </section>

      <div className="grid grid-cols-2 gap-[12px] max-lg:grid-cols-1">
        <section aria-label="เบิกเงิน vs เคลียร์เงิน" className="rounded-[12px] bg-[#e8f5ff] p-[14px]">
          <h2 className="mb-[8px] text-[13px] font-semibold text-blue-dark">เบิกเงิน vs เคลียร์เงิน (พันบาท)</h2>
          <div className="rounded-[8px] bg-white p-[12px]">
            <svg viewBox="0 0 400 260" role="img" aria-label="กราฟเส้นเปรียบเทียบยอดเบิกเงินและเคลียร์เงินรายเดือน" className="w-full">
              {[0, 1, 2, 3].map((i) => <line key={i} x1="30" x2="390" y1={30 + i * 63} y2={30 + i * 63} stroke="#e5e6e6" />)}
              <path d={line(withdrawSeries)} fill="none" stroke="#1565e0" strokeWidth="2" /><path d={line(clearSeries)} fill="none" stroke="#17c3a1" strokeWidth="2" />
              {withdrawSeries.map((v, i) => <circle key={i} cx={x(i)} cy={220 - (v / maxL) * 190} r="3" fill="#1565e0"><title>{`${fMonths[i]} เบิก ${v} / เคลียร์ ${clearSeries[i]}`}</title></circle>)}
              {fMonths.map((m, i) => <text key={m} x={x(i)} y="240" textAnchor="middle" fontSize="8" fill="#757d83">{m}</text>)}
              <rect x="290" y="4" width="9" height="9" fill="#1565e0" /><text x="303" y="12" fontSize="10" fill="#333e47">เบิกเงิน</text>
              <rect x="344" y="4" width="9" height="9" fill="#17c3a1" /><text x="357" y="12" fontSize="10" fill="#333e47">เคลียร์</text>
            </svg>
          </div>
        </section>
        <section aria-label="ยอดตั้งเจ้าหนี้และภาษีหัก ณ ที่จ่าย" className="rounded-[12px] bg-[#e8f5ff] p-[14px]">
          <h2 className="mb-[8px] text-[13px] font-semibold text-blue-dark">ยอดตั้งเจ้าหนี้ และภาษีหัก ณ ที่จ่าย (พันบาท)</h2>
          <div className="rounded-[8px] bg-white p-[12px]">
            <svg viewBox="0 0 400 260" role="img" aria-label="กราฟแท่งยอดตั้งเจ้าหนี้และภาษีหัก ณ ที่จ่ายรายเดือน" className="w-full">
              {[0, 1, 2, 3].map((i) => <line key={i} x1="30" x2="390" y1={30 + i * 63} y2={30 + i * 63} stroke="#e5e6e6" />)}
              {payableSeries.map((b, i) => (
                <g key={i}>
                  <rect x={36 + i * 29} y={220 - (b / maxB) * 190} width="10" height={(b / maxB) * 190} rx="2" fill="#4a8df0"><title>{`${fMonths[i]} ตั้งเจ้าหนี้ ${b}`}</title></rect>
                  <rect x={47 + i * 29} y={220 - (taxSeries[i] / maxB) * 190} width="10" height={Math.max(2, (taxSeries[i] / maxB) * 190)} rx="2" fill="#4cc27a"><title>{`${fMonths[i]} ภาษีหัก ณ ที่จ่าย ${taxSeries[i]}`}</title></rect>
                  <text x={46 + i * 29} y="240" textAnchor="middle" fontSize="8" fill="#757d83">{fMonths[i]}</text>
                </g>
              ))}
              <rect x="270" y="4" width="9" height="9" fill="#4a8df0" /><text x="283" y="12" fontSize="10" fill="#333e47">รายรับ/รายจ่าย</text>
              <rect x="352" y="4" width="9" height="9" fill="#4cc27a" /><text x="365" y="12" fontSize="10" fill="#333e47">ภาษี</text>
            </svg>
          </div>
        </section>
      </div>

      <section aria-label="รายการล่าสุดจากทุกกระบวนการ" className={`${card} overflow-hidden p-[18px]`}>
        <h2 className="mb-[8px] text-[13px] font-semibold text-blue-dark">รายการล่าสุดจากทุกกระบวนการ</h2>
        <div className="overflow-x-auto">
          <table className="w-full min-w-[860px] text-left text-[11px]">
            <thead className="text-[10px] font-light text-gray-20"><tr>{['ประเภท', 'เลขที่เอกสาร', 'หน่วยงาน', 'ผู้เกี่ยวข้อง', 'วันที่', 'ยอดเงิน (บาท)', 'สถานะ', ''].map((h) => <th key={h} className="py-[6px] pr-[8px] font-light">{h}</th>)}</tr></thead>
            <tbody>
              {latest.map((l) => (
                <tr key={l.id} className="border-t border-gray-line-2">
                  <td className="py-[9px] pr-[8px] whitespace-nowrap">{loanTypes[l.type]}</td>
                  <td className="pr-[8px] font-urbanist font-medium">{l.no}</td>
                  <td className="pr-[8px] font-light">{l.office}</td>
                  <td className="pr-[8px] font-light">{l.requester}</td>
                  <td className="pr-[8px] font-light whitespace-nowrap">{thDate(l.start)}</td>
                  <td className="pr-[8px] text-right font-urbanist">{money(loanTotal(l))}</td>
                  <td className="pr-[8px]"><FStatus s={l.status} /></td>
                  <td className="whitespace-nowrap">
                    {([['ดู', 'ดูข้อมูลเพิ่มเติม', () => view(l), 'M2 12s4-7 10-7 10 7 10 7-4 7-10 7S2 12 2 12ZM12 9a3 3 0 1 0 0 6 3 3 0 0 0 0-6Z'], ['แก้ไข', 'แก้ไข', () => (l.status === 'returned' ? navigate(`/finance/loan?edit=${l.id}`) : show('แก้ไขได้เฉพาะเอกสารที่ถูกส่งกลับ')), 'M5 20h4L20 9l-4-4L5 16Z'], ['คัดลอก', 'คัดลอก', () => copy(l), 'M8 8h11v12H8ZM5 16V4h11'], ['ลบ', 'ลบ', () => remove(l), 'M5 7h14M10 7V4h4v3M7 7l1 13h8l1-13']] as const).map(([n, t, f, d]) => (
                      <button key={n} type="button" aria-label={`${t} ${l.no}`} title={t} onClick={f} className="mr-[4px] inline-flex size-[26px] items-center justify-center rounded-[6px] text-gray-20 hover:bg-blue-bg hover:text-blue-00">
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d={d} /></svg>
                      </button>
                    ))}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      <section aria-label="แถบแจ้งเตือนสำคัญ" className={`${card} p-[16px]`}>
        <h2 className="mb-[6px] text-[13px] font-semibold text-blue-dark">แจ้งเตือนสำคัญ</h2>
        <ul className="flex flex-col gap-[6px]">
          {[...all.flatMap((l) => l.events.filter((e) => e.by === 'ระบบ' && e.action.startsWith('แจ้งเตือน')).map((e) => ({ at: e.at, text: `${e.action}${e.note ? ' ' + e.note : ''} (${l.no})` }))), ...importantNotices].sort((a, b) => (a.at < b.at ? 1 : -1)).slice(0, 4).map((n, i) => (
            <li key={i} className="flex items-center justify-between gap-[10px] rounded-[8px] bg-blue-bg px-[12px] py-[8px] text-[11px]"><span className="font-light">{n.text}</span><span className="shrink-0 font-urbanist text-gray-20">{thDate(n.at)} {n.at.slice(11)}</span></li>
          ))}
        </ul>
      </section>
      <p className="text-[10px] font-light text-gray-10">การ์ด เมนูด่วน และรายการล่าสุดคำนวณจากเอกสารเงินยืม · กราฟรายเดือนและภาษีเป็นข้อมูลตัวอย่าง รอเชื่อมระบบบัญชี</p>
      {toast}
    </div>
  )
}
