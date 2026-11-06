import { useMemo, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { AI, Crumbs, Ic, Title, card, page } from '../components/asset/Parts'
import { useToast } from '../components/leader/Parts'
import Modal from '../components/ui/Modal'
import Pagination from '../components/ui/Pagination'
import Select from '../components/ui/Select'
import { docTypes, money, totals, type EDoc } from '../data/erpDoc'
import { thDate } from '../data/erpProject'
import { edocs, livePreview, useEDocs } from '../lib/docStore'

const PAGE = 6
const ALL = 'ทั้งหมด'
const typeTone: Record<string, string> = { ใบเสร็จรับเงิน: 'bg-[#e8f1ff] text-[#1f5fbf]', ใบกำกับภาษี: 'bg-[#efeafe] text-[#5a40c9]', ใบแจ้งหนี้: 'bg-[#fff1d6] text-[#a8650b]', ใบรับรองแพทย์: 'bg-[#dff5e8] text-[#0f8a63]', หนังสือภายนอก: 'bg-gray-line text-gray-30' }
export const previewOf = (d: EDoc) => livePreview.get(d.id) ?? d.preview

export function DocThumb({ d, cls = 'h-[64px] w-[48px]' }: { d: EDoc; cls?: string }) {
  const src = previewOf(d)
  if (src && !d.mime.includes('pdf')) return <img src={src} alt="" className={`${cls} rounded-[6px] bg-white object-cover object-top shadow-[0_1px_4px_rgba(0,0,0,0.12)] ring-1 ring-black/5`} />
  return <span className={`${cls} flex flex-col items-center justify-center rounded-[6px] bg-[#fdecec] font-urbanist text-[10px] font-bold text-[#c13232] ring-1 ring-black/5`}><Ic d="M7 3h7l4 4v14H7ZM14 3v4h4" s={18} />PDF</span>
}

/** คลังเอกสาร (book 3 fig 2-70) — 2.1.11.1 ; home of ERP DOCUMENT */
export default function DocLibraryPage() {
  const all = useEDocs()
  const navigate = useNavigate()
  const [toast, show] = useToast()
  const [q, setQ] = useState('')
  const [type, setType] = useState(ALL)
  const [tab, setTab] = useState<'all' | 'ร่าง' | 'เสร็จสิ้น'>('all')
  const [pg, setPg] = useState(1)
  const [view, setView] = useState<EDoc>()
  const [del, setDel] = useState<EDoc>()
  const rows = useMemo(() => {
    const k = q.trim().toLowerCase()
    return all.filter((d) => (tab === 'all' || d.status === tab) && (type === ALL || d.type === type) && (!k || `${d.name} ${d.type} ${d.f.docNo} ${d.f.contact} ${d.uploadedAt} ${thDate(d.uploadedAt)} ${d.f.tags.join(' ')}`.toLowerCase().includes(k))).sort((a, b) => b.uploadedAt.localeCompare(a.uploadedAt) || b.id - a.id)
  }, [all, q, tab, type])
  const pages = Math.max(1, Math.ceil(rows.length / PAGE))
  const cur = Math.min(pg, pages)
  const drafts = all.filter((d) => d.status === 'ร่าง').length

  return (
    <div className={`${page} items-center`}>
      <div className="flex w-full max-w-[1000px] flex-col gap-[12px]">
        <Title right={<button type="button" onClick={() => navigate('/edoc/upload')} className="flex h-[40px] items-center gap-[6px] rounded-[10px] bg-blue-00 pr-[16px] pl-[12px] text-[13px] font-medium text-white shadow-[0_6px_16px_rgba(0,133,249,0.25)] hover:brightness-110"><Ic d="M12 16V4M7 9l5-5 5 5M4 20h16" s={16} />นำเข้าเอกสารใหม่</button>}>คลังเอกสาร</Title>
        <Crumbs items={[{ label: 'หน้าแรก', to: '/edoc' }, { label: 'คลังเอกสาร' }]} />

        <section aria-label="ความสามารถ AI" className="flex flex-wrap items-center gap-[14px] rounded-[16px] bg-[linear-gradient(120deg,#0b2a5c,#1650c8_60%,#3a9bff)] px-[20px] py-[16px] text-white">
          <span className="flex size-[42px] items-center justify-center rounded-[12px] bg-white/15"><Ic d="M12 3l1.8 4.7L18.5 9.5l-4.7 1.8L12 16l-1.8-4.7L5.5 9.5l4.7-1.8Z" s={22} /></span>
          <div className="min-w-0 flex-1"><p className="text-[14px] font-semibold">e-Document Intelligence</p><p className="text-[12px] font-light text-white/80">อัปโหลดใบเสร็จ ใบกำกับภาษี ใบรับรองแพทย์ หรือหนังสือ ระบบอ่านข้อความ (OCR) จำแนกประเภท และสร้างแบบฟอร์มให้อัตโนมัติ</p></div>
          {drafts > 0 && <button type="button" onClick={() => { setTab('ร่าง'); setPg(1) }} className="rounded-full bg-white px-[14px] py-[7px] text-[12px] font-medium text-blue-dark hover:bg-blue-bg">{`แบบร่างรอบันทึก ${drafts} รายการ`}</button>}
        </section>

        <section aria-label="รายการเอกสาร" className={`${card} flex flex-col gap-[12px] p-[18px]`}>
          <div className="flex flex-wrap gap-[10px]">
            <label className="flex h-[44px] min-w-[240px] flex-1 items-center gap-[10px] rounded-[12px] border border-gray-line bg-gray-subtle px-[14px] text-gray-20 focus-within:border-blue-00 focus-within:bg-white">
              <Ic d={AI.search} />
              <input aria-label="ค้นหาเอกสาร" placeholder="ค้นหาชื่อเอกสาร ประเภท เลขที่ ผู้ออกเอกสาร หรือวันที่" value={q} onChange={(e) => { setQ(e.target.value); setPg(1) }} className="min-w-0 flex-1 bg-transparent text-[13px] text-black outline-none" />
            </label>
            <div className="w-[200px] max-sm:w-full"><Select label="ประเภทเอกสาร" value={type} options={[ALL, ...docTypes].map((v) => ({ value: v, label: v === ALL ? 'ทุกประเภท' : v }))} onChange={(v) => { setType(v); setPg(1) }} /></div>
          </div>
          <div role="tablist" aria-label="สถานะเอกสาร" className="grid grid-cols-3 gap-[4px] rounded-[10px] bg-blue-bg p-[4px]">
            {([['all', 'เอกสารทั้งหมด'], ['ร่าง', 'แบบร่าง'], ['เสร็จสิ้น', 'เสร็จสิ้น']] as const).map(([k, l]) => <button key={k} type="button" role="tab" aria-selected={tab === k} onClick={() => { setTab(k); setPg(1) }} className={`h-[34px] rounded-[8px] text-[12.5px] font-medium transition ${tab === k ? 'bg-blue-00 text-white shadow-[0_2px_8px_rgba(0,133,249,0.3)]' : 'text-blue-00 hover:bg-white/70'}`}>{l}<span className="ml-[6px] font-urbanist opacity-75">{k === 'all' ? all.length : all.filter((d) => d.status === k).length}</span></button>)}
          </div>
          <div className="overflow-x-auto">
            <table className="w-full min-w-[840px] text-left text-[12px]">
              <thead className="text-[11px] text-gray-20"><tr>{['ลำดับ', 'ตัวอย่าง', 'ชื่อเอกสาร', 'ประเภท', 'วันที่อัปโหลด', 'สถานะ', ''].map((h, i) => <th key={i} className="border-b border-gray-line-2 py-[8px] pr-[10px] font-normal">{h}</th>)}</tr></thead>
              <tbody>
                {rows.slice((cur - 1) * PAGE, cur * PAGE).map((d, i) => (
                  <tr key={d.id} className="border-b border-gray-line-2 last:border-0 hover:bg-[#f7faff]">
                    <td className="py-[10px] pr-[10px] font-urbanist text-gray-30">{(cur - 1) * PAGE + i + 1}</td>
                    <td className="py-[10px] pr-[10px]"><button type="button" aria-label={`ดูตัวอย่าง ${d.name}`} onClick={() => setView(d)} className="block transition hover:scale-[1.04]"><DocThumb d={d} /></button></td>
                    <td className="py-[10px] pr-[10px]"><p className="max-w-[300px] truncate text-[13px] font-medium">{d.name}</p><p className="text-[11px] font-light text-gray-20">{[d.f.docNo, d.f.contact, d.type !== 'หนังสือภายนอก' && d.type !== 'ใบรับรองแพทย์' && totals(d.f).net ? `${money(totals(d.f).net)} บาท` : ''].filter(Boolean).join(' · ') || 'ยังไม่ได้บันทึกรายละเอียด'}</p>{d.routedTo && <p className="mt-[2px] text-[11px] text-[#0f8a63]">{`ส่งต่อ ${d.routedTo.sys} · ${d.routedTo.fn}`}</p>}</td>
                    <td className="py-[10px] pr-[10px]"><span className={`rounded-full px-[10px] py-[3px] text-[11px] font-medium whitespace-nowrap ${typeTone[d.type]}`}>{d.type}</span></td>
                    <td className="py-[10px] pr-[10px] whitespace-nowrap text-gray-30">{`${thDate(d.uploadedAt)} ${d.uploadedAt.slice(11)}`}</td>
                    <td className="py-[10px] pr-[10px]"><span className={`inline-flex items-center gap-[6px] rounded-full px-[10px] py-[3px] text-[11px] font-medium ${d.status === 'ร่าง' ? 'bg-gray-line text-gray-30' : 'bg-[#dff5e8] text-[#0f8a63]'}`}><span className={`size-[6px] rounded-full ${d.status === 'ร่าง' ? 'bg-gray-20' : 'bg-[#17a673]'}`} />{d.status === 'ร่าง' ? 'แบบร่าง' : 'เสร็จสิ้น'}</span></td>
                    <td className="py-[10px] text-right whitespace-nowrap">
                      {d.status === 'ร่าง'
                        ? <Link to={`/edoc/record?id=${d.id}`} className="inline-flex h-[32px] items-center rounded-[8px] bg-blue-00 px-[12px] text-[12px] font-medium text-white hover:brightness-110">สร้างเอกสาร</Link>
                        : <Link to={d.routedTo?.to ?? '/edoc'} className="inline-flex h-[32px] items-center rounded-[8px] bg-blue-bg px-[12px] text-[12px] font-medium text-blue-00 hover:bg-blue-20">แนบเอกสาร</Link>}
                      <button type="button" title="ลบ" aria-label={`ลบ ${d.name}`} onClick={() => setDel(d)} className="ml-[4px] inline-flex size-[32px] items-center justify-center rounded-[8px] text-gray-20 hover:bg-[#ffe3e3] hover:text-[#c13232]"><Ic d="M5 7h14M10 7V4h4v3M7 7l1 13h8l1-13" /></button>
                    </td>
                  </tr>
                ))}
                {!rows.length && <tr><td colSpan={7} className="py-[40px] text-center"><p className="text-[13px] font-light text-gray-20">ไม่พบเอกสาร</p><Link to="/edoc/upload" className="mt-[6px] inline-block text-[12px] font-medium text-blue-00 hover:underline">นำเข้าเอกสารใหม่</Link></td></tr>}
              </tbody>
            </table>
          </div>
          <div className="flex items-center justify-between"><span className="text-[12px] font-light text-gray-30">{`ทั้งหมด ${rows.length} รายการ`}</span><Pagination page={cur} pageCount={pages} onChange={setPg} /></div>
        </section>
      </div>

      <Modal open={!!view} onClose={() => setView(undefined)} title={view?.name ?? ''} width="max-w-[640px]">
        {view && (
          <div className="flex flex-col gap-[10px]">
            <div className="max-h-[62vh] overflow-auto rounded-[10px] bg-gray-bg p-[12px]">{view.mime.includes('pdf') && livePreview.get(view.id) ? <embed src={livePreview.get(view.id)} type="application/pdf" className="h-[60vh] w-full" /> : <img src={previewOf(view)} alt={view.name} className="mx-auto w-full max-w-[520px] bg-white shadow" />}</div>
            <div className="flex justify-end gap-[8px]">
              <a href={previewOf(view)} download={view.name.replace(/\.\w+$/, '') + (view.mime.includes('svg') ? '.svg' : view.mime.includes('pdf') ? '.pdf' : '.jpg')} className="flex h-[38px] items-center rounded-[8px] border border-gray-line px-[16px] text-[13px] hover:border-gray-10">ดาวน์โหลด</a>
              <Link to={`/edoc/record?id=${view.id}`} className="flex h-[38px] items-center rounded-[8px] bg-blue-00 px-[16px] text-[13px] font-medium text-white">{view.status === 'ร่าง' ? 'บันทึกรายการเอกสาร' : 'ดูรายละเอียด'}</Link>
            </div>
          </div>
        )}
      </Modal>
      <Modal open={!!del} onClose={() => setDel(undefined)} title="ลบเอกสาร" width="max-w-[420px]">
        <p className="text-[13px] font-light text-gray-30">{`ต้องการลบ “${del?.name}” ออกจากคลังเอกสารใช่หรือไม่`}</p>
        <div className="flex justify-end gap-[8px]"><button type="button" onClick={() => setDel(undefined)} className="h-[38px] rounded-[8px] border border-gray-line px-[16px] text-[13px]">ยกเลิก</button><button type="button" onClick={() => { if (del) { edocs.remove(del.id); show('ลบเอกสารแล้ว') } setDel(undefined) }} className="h-[38px] rounded-[8px] bg-[#e5484d] px-[16px] text-[13px] font-medium text-white">ลบเอกสาร</button></div>
      </Modal>
      {toast}
    </div>
  )
}
