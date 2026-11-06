import { useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useToast } from '../components/leader/Parts'
import Pagination from '../components/ui/Pagination'
import { Crumbs, GPersonaSwitch, GStatus, Title, card, ctl, page } from '../components/funding/Parts'
import { fyOf, invStatus, kindLabel, money, thDate, type Inv, type InvStatus } from '../data/erpFunding'
import { closeInv, useGPersona, useInvs } from '../lib/erpFundingStore'

const PAGE = 10
const eye = 'M2 12s4-7 10-7 10 7 10 7-4 7-10 7S2 12 2 12ZM12 9a3 3 0 1 0 0 6 3 3 0 0 0 0-6Z'
const dl = 'M12 4v10m-4-4 4 4 4-4M5 19h14'
const Ic = ({ d }: { d: string }) => <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d={d} /></svg>

/** สรุปรายการลงทุน/หุ้นกู้ (book 3 fig 2-26) — 2.1.5.4 ; every investment of the portfolio with its status */
export default function FundingListPage() {
  const all = useInvs()
  const me = useGPersona()
  const navigate = useNavigate()
  const [toast, show] = useToast()
  const [q, setQ] = useState('')
  const [tab, setTab] = useState<'all' | InvStatus>('all')
  const [pg, setPg] = useState(1)
  const rows = useMemo(() => {
    const k = q.trim().toLowerCase()
    return all.filter((i) => (tab === 'all' || i.status === tab) && (!k || `${i.name} ${kindLabel[i.kind]} ${i.type} ${i.issuer}`.toLowerCase().includes(k))).sort((a, b) => b.id - a.id)
  }, [all, q, tab])
  const pages = Math.max(1, Math.ceil(rows.length / PAGE))
  const cur = Math.min(pg, pages)
  const view = rows.slice((cur - 1) * PAGE, cur * PAGE)
  const count = (s: 'all' | InvStatus) => all.filter((i) => s === 'all' || i.status === s).length

  const download = (i: Inv) => {
    const csv = '﻿' + [['ชื่อ', 'ประเภท', 'ปีงบประมาณ', 'ไตรมาส', 'จำนวนเงินลงทุน(บาท)', 'ผลตอบแทนเฉลี่ย(%)', 'สถานะ'], [i.name, kindLabel[i.kind], fyOf(i.start).fy, fyOf(i.start).q, i.amount, i.ret, invStatus[i.status].label]].map((r) => r.map((c) => `"${c}"`).join(',')).join('\r\n')
    const a = document.createElement('a')
    a.href = URL.createObjectURL(new Blob([csv], { type: 'text/csv;charset=utf-8' }))
    a.download = `${i.name}-${i.id}.csv`
    a.click()
    URL.revokeObjectURL(a.href)
    show(`ดาวน์โหลดรายการ ${i.name} แล้ว`)
  }
  const finish = (i: Inv) => {
    if (me !== 'staff') return show('ต้องเป็นเจ้าหน้าที่ผู้รับผิดชอบ')
    closeInv(i.id)
    show(`บันทึกครบกำหนดการลงทุน ${i.name} แล้ว`)
  }

  return (
    <div className={`${page} items-center`}>
      <div className="flex w-full max-w-[900px] flex-col gap-[12px]">
        <Title back="/funding" right={<GPersonaSwitch />}>สรุปรายการลงทุน / หุ้นกู้</Title>
        <Crumbs items={[{ label: 'หน้าแรก', to: '/funding' }, { label: 'สรุปรายการลงทุน' }]} />

        <section className={`${card} flex flex-col gap-[10px] p-[20px]`}>
          <h2 className="text-[15px] font-semibold">ค้นหา</h2>
          <div className="relative">
            <input aria-label="ค้นหา" placeholder="ค้นหาชื่อกองทุน ประเภท หรือผู้ออก" className={ctl} value={q} onChange={(e) => { setQ(e.target.value); setPg(1) }} />
          </div>
        </section>

        <section aria-label="รายการลงทุน" className={`${card} flex flex-col gap-[12px] p-[18px]`}>
          <div className="flex items-center justify-between"><h2 className="text-[14px] font-semibold text-blue-dark">รายการกองทุน</h2><span className="text-[12px] font-light text-gray-20">{`ทั้งหมด ${count('all')} รายการ`}</span></div>
          <div role="tablist" aria-label="สถานะ" className="grid grid-cols-4 gap-[6px] rounded-[8px] bg-blue-bg p-[3px] max-sm:grid-cols-2">
            {([['all', 'ทั้งหมด'], ['draft', 'แบบร่าง'], ['ongoing', 'อยู่ระหว่างลงทุน'], ['done', 'เสร็จสิ้น']] as const).map(([k, t]) => (
              <button key={k} type="button" role="tab" aria-selected={tab === k} onClick={() => { setTab(k); setPg(1) }} className={`h-[32px] rounded-[6px] text-[12px] font-medium ${tab === k ? 'bg-blue-00 text-white' : 'text-blue-00 hover:bg-white/60'}`}>{`${t} (${count(k)})`}</button>
            ))}
          </div>
          <div className="overflow-x-auto">
            <table className="w-full min-w-[780px] text-left text-[12px]">
              <thead className="text-[10px] font-light text-gray-20"><tr>{['ลำดับ', 'ชื่อ', 'ปีงบประมาณ', 'ไตรมาส', 'ประเภทการลงทุน', 'จำนวนเงิน (บาท)', 'สถานะ', ''].map((h, i) => <th key={i} className="py-[6px] pr-[8px] font-light">{h}</th>)}</tr></thead>
              <tbody>
                {view.map((i, n) => (
                  <tr key={i.id} className="border-t border-gray-line-2">
                    <td className="py-[10px] pr-[8px] font-urbanist">{(cur - 1) * PAGE + n + 1}</td>
                    <td className="pr-[8px] font-medium">{i.name}</td>
                    <td className="pr-[8px] font-urbanist underline">{fyOf(i.start).fy}</td>
                    <td className="pr-[8px] font-light">{`ไตรมาส ${fyOf(i.start).q}`}</td>
                    <td className="pr-[8px] font-light">{kindLabel[i.kind]}</td>
                    <td className="pr-[8px] text-right font-urbanist">{money(i.amount)}</td>
                    <td className="pr-[8px]"><GStatus s={i.status} /></td>
                    <td className="whitespace-nowrap">
                      <button type="button" aria-label={`ดูรายละเอียด ${i.name} ${i.id}`} title={`ปิดรายการ ${thDate(i.end)}`} onClick={() => navigate(`/funding/report?id=${i.id}`)} className="mr-[4px] inline-flex size-[26px] items-center justify-center rounded-[6px] text-gray-20 hover:bg-blue-bg hover:text-blue-00"><Ic d={eye} /></button>
                      <button type="button" aria-label={`ดาวน์โหลด ${i.name} ${i.id}`} onClick={() => download(i)} className="mr-[4px] inline-flex size-[26px] items-center justify-center rounded-[6px] text-gray-20 hover:bg-blue-bg hover:text-blue-00"><Ic d={dl} /></button>
                      {i.status === 'ongoing' && <button type="button" aria-label={`บันทึกครบกำหนด ${i.name} ${i.id}`} onClick={() => finish(i)} className="rounded-[6px] border border-gray-line px-[8px] py-[3px] text-[10px] text-gray-30 hover:border-blue-00 hover:text-blue-00">ครบกำหนด</button>}
                      {i.status === 'draft' && i.rejected && <button type="button" aria-label={`แก้ไข ${i.name} ${i.id}`} onClick={() => navigate(`/funding/add?edit=${i.id}`)} className="rounded-[6px] border border-[#e5484d] px-[8px] py-[3px] text-[10px] text-[#c13232] hover:bg-[#fff1f1]">แก้ไขและเสนอใหม่</button>}
                    </td>
                  </tr>
                ))}
                {!view.length && <tr><td colSpan={8} className="py-[32px] text-center text-[13px] font-light text-gray-20">ไม่พบรายการ</td></tr>}
              </tbody>
            </table>
          </div>
        </section>
        <div className="flex justify-end"><Pagination page={cur} pageCount={pages} onChange={setPg} /></div>
      </div>
      {toast}
    </div>
  )
}
