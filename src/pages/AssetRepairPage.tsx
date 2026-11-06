import { useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { AI, APersonaSwitch, Crumbs, Ic, RepairPill, Title, card, ctl, page } from '../components/asset/Parts'
import { useToast } from '../components/leader/Parts'
import Modal from '../components/ui/Modal'
import Pagination from '../components/ui/Pagination'
import { money, repairTone, thDate, type Repair } from '../data/erpAsset'
import { actRepair, useAPersona, useAssets, useRepairs, type RepairAction } from '../lib/assetStore'

const PAGE = 6
type Tab = 'all' | 'open' | 'closed'

function Thumb({ r }: { r: Repair }) {
  if (r.photo) return <img src={r.photo} alt="" className="size-[52px] rounded-[10px] object-cover ring-1 ring-black/5" />
  const tone = r.kind === 'ครุภัณฑ์' ? 'from-[#e8f1ff] to-[#d4e4ff] text-[#1f5fbf]' : r.kind === 'พัสดุ' ? 'from-[#fff4e0] to-[#ffe6bd] text-[#a8650b]' : 'from-[#eef1f5] to-[#e1e6ee] text-gray-30'
  return <span className={`flex size-[52px] flex-col items-center justify-center gap-[2px] rounded-[10px] bg-gradient-to-br ${tone}`}><Ic d={r.evidence.length ? AI.img : AI.tool} s={18} />{r.evidence.length > 0 && <span className="font-urbanist text-[9px] font-semibold">{r.evidence.length} ไฟล์</span>}</span>
}

/** รายการแจ้งซ่อม (book 3 fig 2-54) — 2.1.8.3 ; + the central office's check / repair / dispose step (book 1 §2.2.7) */
export default function AssetRepairPage() {
  const all = useRepairs()
  const reg = useAssets()
  const me = useAPersona()
  const navigate = useNavigate()
  const [toast, show] = useToast()
  const [q, setQ] = useState('')
  const [tab, setTab] = useState<Tab>('all')
  const [pg, setPg] = useState(1)
  const [openId, setOpenId] = useState<number>()
  const [note, setNote] = useState('')
  const [cost, setCost] = useState('')
  const central = me === 'central'
  const rows = useMemo(() => {
    const k = q.trim().toLowerCase()
    return all.filter((r) => (tab === 'all' || (tab === 'open') === repairTone[r.status].open) && (!k || `${r.no} ${r.title} ${r.reporter} ${r.kind} ${r.assetCode}`.toLowerCase().includes(k))).sort((a, b) => b.date.localeCompare(a.date) || b.id - a.id)
  }, [all, q, tab])
  const pages = Math.max(1, Math.ceil(rows.length / PAGE))
  const cur = Math.min(pg, pages)
  const r = all.find((x) => x.id === openId)
  const asset = r && reg.find((a) => a.code === r.assetCode)
  const count = (t: Tab) => (t === 'all' ? all.length : all.filter((x) => (t === 'open') === repairTone[x.status].open).length)

  const act = (a: RepairAction) => {
    if (!r) return
    if (a === 'จำหน่าย' && !note.trim()) { show('กรุณาระบุเหตุผลการจำหน่าย'); return }
    actRepair(r.id, a, note.trim(), a === 'ซ่อมเสร็จ' && cost ? Number(cost.replace(/\D/g, '')) : undefined)
    show(a === 'ส่งซ่อม' ? `ยืนยันการชำรุดและส่งซ่อม ${r.no} แล้ว` : a === 'ซ่อมเสร็จ' ? `ปิดงานซ่อม ${r.no} แล้ว` : `จำหน่ายและตัดออกจากทะเบียน ${r.assetCode || r.no} แล้ว`)
    setNote(''); setCost('')
  }

  return (
    <div className={`${page} items-center`}>
      <div className="flex w-full max-w-[1000px] flex-col gap-[12px]">
        <Title back="/asset" right={<div className="flex items-center gap-[8px]"><APersonaSwitch /><button type="button" onClick={() => navigate('/asset/repair/new')} className="flex h-[38px] items-center gap-[6px] rounded-[10px] bg-blue-00 pr-[16px] pl-[12px] text-[13px] font-medium text-white shadow-[0_6px_16px_rgba(0,133,249,0.25)] hover:brightness-110"><Ic d={AI.plus} s={16} />เพิ่มรายการแจ้งซ่อม</button></div>}>รายการแจ้งซ่อม</Title>
        <Crumbs items={[{ label: 'หน้าแรก', to: '/asset' }, { label: 'รายการแจ้งซ่อม' }]} />
        {central && all.some((x) => x.status === 'รอตรวจสอบ') && <p role="status" className="flex items-center gap-[8px] rounded-[12px] border border-[#f1d38a] bg-[#fffaeb] px-[14px] py-[10px] text-[12px] text-[#8a6100]"><Ic d={AI.alert} s={16} />{`มีรายการแจ้งซ่อมใหม่รอตรวจสอบ ${all.filter((x) => x.status === 'รอตรวจสอบ').length} รายการ`}</p>}

        <section aria-label="รายการแจ้งซ่อม" className={`${card} flex flex-col gap-[12px] p-[18px]`}>
          <label className="flex h-[44px] items-center gap-[10px] rounded-[12px] border border-gray-line bg-gray-subtle px-[14px] text-gray-20 focus-within:border-blue-00 focus-within:bg-white">
            <Ic d={AI.search} />
            <input aria-label="ค้นหารายการแจ้งซ่อม" placeholder="ค้นหาหมายเลขแจ้งซ่อม ชื่อผู้แจ้ง หรือประเภทปัญหา" value={q} onChange={(e) => { setQ(e.target.value); setPg(1) }} className="min-w-0 flex-1 bg-transparent text-[13px] text-black outline-none" />
          </label>
          <div role="tablist" aria-label="สถานะ" className="grid grid-cols-3 gap-[4px] rounded-[10px] bg-blue-bg p-[4px]">
            {([['all', 'ทั้งหมด'], ['open', 'กำลังดำเนินการ'], ['closed', 'เสร็จสิ้น']] as const).map(([k, l]) => <button key={k} type="button" role="tab" aria-selected={tab === k} onClick={() => { setTab(k); setPg(1) }} className={`h-[34px] rounded-[8px] text-[12.5px] font-medium transition ${tab === k ? 'bg-blue-00 text-white shadow-[0_2px_8px_rgba(0,133,249,0.3)]' : 'text-blue-00 hover:bg-white/70'}`}>{l}<span className="ml-[6px] font-urbanist opacity-75">{count(k)}</span></button>)}
          </div>
          <div className="overflow-x-auto">
            <table className="w-full min-w-[820px] text-left text-[12px]">
              <thead className="text-[11px] text-gray-20"><tr>{['ลำดับ', 'รูปย่อ', 'รายการ', 'ประเภท', 'วันที่แจ้ง', 'สถานะ', ''].map((h, i) => <th key={i} className="border-b border-gray-line-2 py-[8px] pr-[10px] font-normal">{h}</th>)}</tr></thead>
              <tbody>
                {rows.slice((cur - 1) * PAGE, cur * PAGE).map((x, i) => (
                  <tr key={x.id} className="border-b border-gray-line-2 last:border-0 hover:bg-[#f7faff]">
                    <td className="py-[10px] pr-[10px] font-urbanist text-gray-30">{(cur - 1) * PAGE + i + 1}</td>
                    <td className="py-[10px] pr-[10px]"><Thumb r={x} /></td>
                    <td className="py-[10px] pr-[10px]"><p className="text-[13px] font-medium">{x.title}</p><p className="text-[11px] font-light text-gray-20">{`${x.no}${x.assetCode ? ` · ${x.assetCode}` : ''} · ผู้แจ้ง ${x.reporter}`}</p></td>
                    <td className="py-[10px] pr-[10px] whitespace-nowrap">{x.kind}</td>
                    <td className="py-[10px] pr-[10px] whitespace-nowrap text-gray-30">{thDate(x.date)}</td>
                    <td className="py-[10px] pr-[10px]"><RepairPill s={x.status} /></td>
                    <td className="py-[10px] text-right"><button type="button" onClick={() => { setOpenId(x.id); setNote(''); setCost('') }} className={`h-[32px] rounded-[8px] px-[12px] text-[12px] font-medium whitespace-nowrap ${central && repairTone[x.status].open ? 'bg-blue-00 text-white hover:brightness-110' : 'bg-blue-bg text-blue-00 hover:bg-blue-20'}`}>{central && repairTone[x.status].open ? 'ดำเนินการ' : 'ดูรายละเอียด'}</button></td>
                  </tr>
                ))}
                {!rows.length && <tr><td colSpan={7} className="py-[36px] text-center text-[13px] font-light text-gray-20">ไม่พบรายการแจ้งซ่อม</td></tr>}
              </tbody>
            </table>
          </div>
          <div className="flex items-center justify-between"><span className="text-[12px] font-light text-gray-30">{`ทั้งหมด ${rows.length} รายการ`}</span><Pagination page={cur} pageCount={pages} onChange={setPg} /></div>
        </section>
      </div>

      <Modal open={!!r} onClose={() => setOpenId(undefined)} title={r ? `แจ้งซ่อม ${r.no}` : ''} width="max-w-[640px]">
        {r && (
          <div className="flex max-h-[68vh] flex-col gap-[14px] overflow-y-auto pr-[4px]">
            <div className="flex items-start gap-[12px]"><Thumb r={r} /><div className="min-w-0 flex-1"><p className="text-[15px] font-semibold">{r.title}</p><p className="text-[12px] font-light text-gray-30">{r.detail}</p></div><RepairPill s={r.status} /></div>
            <dl className="grid grid-cols-2 gap-x-[16px] gap-y-[8px] rounded-[12px] bg-gray-subtle p-[14px] text-[12px] max-sm:grid-cols-1">
              {[['ประเภท', r.kind], ['เลขครุภัณฑ์ / รหัส', r.assetCode || '—'], ['รายการในทะเบียน', asset ? `${asset.name} (${asset.state})` : '—'], ['จำนวน', String(r.qty)], ['สถานที่', r.place || '—'], ['วันที่แจ้ง', thDate(r.date)], ['ผู้แจ้ง', r.reporter], ['ค่าซ่อม', r.cost ? `${money(r.cost)} บาท` : '—']].map(([k, v]) => <div key={k}><dt className="text-[11px] font-light text-gray-20">{k}</dt><dd className="font-medium">{v}</dd></div>)}
            </dl>
            {r.evidence.length > 0 && <div className="flex flex-wrap gap-[6px]">{r.evidence.map((e) => <span key={e} className="flex items-center gap-[6px] rounded-full bg-blue-bg px-[10px] py-[4px] text-[11px] text-blue-dark"><Ic d={AI.img} s={12} />{e}</span>)}</div>}
            <div>
              <p className="mb-[8px] text-[13px] font-semibold">ประวัติการดำเนินการ</p>
              <ol className="relative flex flex-col gap-[10px] border-l-2 border-blue-20 pl-[16px]">
                {r.history.map((h, i) => <li key={i} className="relative"><span className={`absolute top-[4px] -left-[22px] size-[10px] rounded-full ring-4 ring-white ${i === r.history.length - 1 ? 'bg-blue-00' : 'bg-blue-20'}`} /><p className="text-[12px] font-medium">{h.action}<span className="ml-[8px] text-[11px] font-light text-gray-20">{`${thDate(h.at)} ${h.at.slice(11)} · ${h.by}`}</span></p>{h.note && <p className="text-[11px] font-light text-gray-30">{h.note}</p>}</li>)}
              </ol>
            </div>
            {central && repairTone[r.status].open && (
              <div className="flex flex-col gap-[10px] rounded-[12px] border border-blue-20 bg-blue-bg/60 p-[14px]">
                <p className="text-[13px] font-semibold">{r.status === 'รอตรวจสอบ' ? 'ตรวจสอบและพิจารณาดำเนินการ' : 'บันทึกผลการซ่อม'}</p>
                <textarea aria-label="บันทึกการดำเนินการ" placeholder={r.status === 'รอตรวจสอบ' ? 'ผลการตรวจสอบ เช่น ชำรุดจริง ส่งซ่อมศูนย์บริการ / ไม่คุ้มค่าซ่อม' : 'รายละเอียดการซ่อม'} className={`${ctl} h-auto min-h-[70px] py-[8px]`} value={note} onChange={(e) => setNote(e.target.value)} />
                {r.status === 'กำลังซ่อม' && <input inputMode="numeric" aria-label="ค่าซ่อม" placeholder="ค่าซ่อม (บาท)" className={`${ctl} max-w-[220px] text-right font-urbanist`} value={cost} onChange={(e) => setCost(e.target.value.replace(/\D/g, ''))} />}
                <div className="flex flex-wrap justify-end gap-[8px]">
                  {r.status === 'รอตรวจสอบ' ? (
                    <>
                      <button type="button" onClick={() => act('จำหน่าย')} className="h-[38px] rounded-[8px] border border-[#e5484d] px-[16px] text-[13px] font-medium text-[#c13232] hover:bg-[#fff1f1]">ยืนยันชำรุด · จำหน่าย</button>
                      <button type="button" onClick={() => act('ส่งซ่อม')} className="h-[38px] rounded-[8px] bg-blue-00 px-[16px] text-[13px] font-medium text-white hover:brightness-110">ยืนยันชำรุด · ส่งซ่อม</button>
                    </>
                  ) : (
                    <>
                      <button type="button" onClick={() => act('จำหน่าย')} className="h-[38px] rounded-[8px] border border-gray-line px-[16px] text-[13px] text-gray-30 hover:border-gray-10">ซ่อมไม่ได้ · จำหน่าย</button>
                      <button type="button" onClick={() => act('ซ่อมเสร็จ')} className="h-[38px] rounded-[8px] bg-[#17a673] px-[16px] text-[13px] font-medium text-white hover:brightness-110">ซ่อมเสร็จ · ปิดงาน</button>
                    </>
                  )}
                </div>
              </div>
            )}
            {!central && repairTone[r.status].open && <p className="rounded-[10px] bg-gray-subtle px-[12px] py-[8px] text-[11px] font-light text-gray-30">เจ้าหน้าที่สำนักบริหารงานกลางจะตรวจสอบและอัปเดตสถานะ — สลับ “ดูในฐานะ” เพื่อทดลองขั้นตอนนี้</p>}
          </div>
        )}
      </Modal>
      {toast}
    </div>
  )
}
