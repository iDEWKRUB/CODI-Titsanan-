import { useMemo, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { AI, APersonaSwitch, Barcode, Crumbs, Ic, Stat, Title, card, page } from '../components/asset/Parts'
import { useToast } from '../components/leader/Parts'
import Modal from '../components/ui/Modal'
import Pagination from '../components/ui/Pagination'
import { assetValue, lowStock, money, thDate, type Asset } from '../data/erpAsset'
import { useAPersona, useAnnounces, useAssets, useRepairs } from '../lib/assetStore'
import { repairTone } from '../data/erpAsset'

const PAGE = 8
const stateTone: Record<Asset['state'], string> = { ใช้งานได้: 'bg-[#dff5e8] text-[#0f8a63]', ชำรุด: 'bg-[#ffe3e3] text-[#c13232]', ส่งซ่อม: 'bg-[#e8f1ff] text-[#1f5fbf]', จำหน่ายแล้ว: 'bg-gray-line text-gray-30' }

/** ภาพรวมทะเบียนพัสดุ-ครุภัณฑ์ — home of ERP ASSET (book 1 §2.2.7: ทะเบียนครุภัณฑ์, พัสดุคงคลัง, แจ้งเตือนพัสดุใกล้หมด) */
export default function AssetHomePage() {
  const all = useAssets()
  const reps = useRepairs()
  const anns = useAnnounces()
  const me = useAPersona()
  const navigate = useNavigate()
  const [toast, show] = useToast()
  const [tab, setTab] = useState<'all' | 'ครุภัณฑ์' | 'พัสดุ'>('all')
  const [q, setQ] = useState('')
  const [pg, setPg] = useState(1)
  const [sticker, setSticker] = useState<Asset>()
  const rows = useMemo(() => {
    const k = q.trim().toLowerCase()
    return all.filter((a) => (tab === 'all' || a.kind === tab) && (!k || `${a.code} ${a.name} ${a.location} ${a.vendor}`.toLowerCase().includes(k))).sort((a, b) => b.receivedAt.localeCompare(a.receivedAt) || b.id - a.id)
  }, [all, tab, q])
  const pages = Math.max(1, Math.ceil(rows.length / PAGE))
  const cur = Math.min(pg, pages)
  const durable = all.filter((a) => a.kind === 'ครุภัณฑ์' && a.state !== 'จำหน่ายแล้ว')
  const low = all.filter(lowStock)
  const open = reps.filter((r) => repairTone[r.status].open)
  const total = all.filter((a) => a.state !== 'จำหน่ายแล้ว').reduce((s, a) => s + assetValue(a), 0)
  const central = me === 'central'

  const quick = [
    { to: '/asset/import', label: 'นำเข้าพัสดุ ครุภัณฑ์', sub: 'ตรวจรับและขึ้นทะเบียน', icon: AI.box, ref: '2.1.8.1', need: true },
    { to: '/asset/procurement', label: 'ประกาศจัดซื้อจัดจ้าง', sub: 'จัดทำและเผยแพร่ประกาศ', icon: AI.megaphone, ref: '2.1.8.2', need: true },
    { to: '/asset/repair', label: 'รายการแจ้งซ่อม', sub: `${open.length} รายการกำลังดำเนินการ`, icon: AI.tool, ref: '2.1.8.3' },
    { to: '/asset/repair/new', label: 'แจ้งซ่อมครุภัณฑ์', sub: 'แจ้งพัสดุ ครุภัณฑ์ชำรุด', icon: AI.plus, ref: '2.1.8.4' },
  ]

  return (
    <div className={`${page} items-center`}>
      <div className="flex w-full max-w-[1100px] flex-col gap-[14px]">
        <Title right={<APersonaSwitch />}>งานบริหารจัดการพัสดุ</Title>
        <Crumbs items={[{ label: 'หน้าแรก', to: '/asset' }, { label: 'ทะเบียนพัสดุ-ครุภัณฑ์' }]} />

        <div className="grid grid-cols-4 gap-[12px] max-lg:grid-cols-2 max-sm:grid-cols-1">
          <Stat label="ครุภัณฑ์ในทะเบียน" value={durable.length} sub={`ส่งซ่อม ${durable.filter((a) => a.state === 'ส่งซ่อม').length} · ชำรุด ${durable.filter((a) => a.state === 'ชำรุด').length}`} icon={AI.box} tone="bg-blue-bg text-blue-00" />
          <Stat label="มูลค่าตามทะเบียน (บาท)" value={money(total).replace(/\.00$/, '')} sub="ราคาตามหลักฐานการจัดซื้อ" icon={AI.cash} tone="bg-[#dff5e8] text-[#0f8a63]" />
          <Stat label="พัสดุใกล้หมด" value={low.length} sub="ถึงจุดสั่งซื้อแล้ว" icon={AI.alert} tone="bg-[#fff1d6] text-[#a8650b]" />
          <Stat label="แจ้งซ่อมกำลังดำเนินการ" value={open.length} sub={`รอตรวจสอบ ${reps.filter((r) => r.status === 'รอตรวจสอบ').length} รายการ`} icon={AI.tool} tone="bg-[#e8f1ff] text-[#1f5fbf]" />
        </div>

        <nav aria-label="เมนูงานพัสดุ" className="grid grid-cols-4 gap-[12px] max-lg:grid-cols-2 max-sm:grid-cols-1">
          {quick.map((x) => (
            <Link key={x.to} to={x.to} className="group flex items-center gap-[12px] rounded-[14px] border border-gray-line-2 bg-white p-[14px] transition hover:border-blue-20 hover:shadow-[0_6px_18px_rgba(0,40,120,0.07)]">
              <span className="flex size-[40px] shrink-0 items-center justify-center rounded-[11px] bg-blue-bg text-blue-00 transition group-hover:bg-blue-00 group-hover:text-white"><Ic d={x.icon} s={19} /></span>
              <span className="flex min-w-0 flex-1 flex-col">
                <span className="text-[13px] font-semibold text-black">{x.label}</span>
                <span className="truncate text-[11px] font-light text-gray-20">{x.sub}{x.need && !central ? ' · สำนักบริหารงานกลาง' : ''}</span>
              </span>
              <span className="font-urbanist text-[10px] text-gray-20">{x.ref}</span>
            </Link>
          ))}
        </nav>

        {low.length > 0 && (
          <section aria-label="แจ้งเตือนพัสดุใกล้หมด" className="flex flex-wrap items-center gap-[10px] rounded-[14px] border border-[#f1d38a] bg-[#fffaeb] px-[16px] py-[12px] text-[12px] text-[#8a6100]">
            <Ic d={AI.alert} s={18} />
            <b className="font-semibold">พัสดุคงเหลือถึงจุดสั่งซื้อ</b>
            <span className="flex flex-wrap gap-[6px]">{low.map((a) => <span key={a.id} className="rounded-full bg-white px-[10px] py-[3px] text-[11px] ring-1 ring-[#f1d38a]">{`${a.name} · เหลือ ${a.qty} ${a.unit} (จุดสั่งซื้อ ${a.min})`}</span>)}</span>
            {central && <button type="button" onClick={() => navigate('/asset/procurement')} className="ml-auto rounded-[8px] bg-[#8a6100] px-[12px] py-[6px] text-[11px] font-medium text-white hover:brightness-110">จัดทำประกาศจัดซื้อ</button>}
          </section>
        )}

        <section aria-label="ทะเบียนพัสดุ-ครุภัณฑ์" className={`${card} flex flex-col gap-[12px] p-[18px]`}>
          <div className="flex flex-wrap items-center gap-[10px]">
            <h2 className="flex-1 text-[15px] font-semibold">ทะเบียนพัสดุ-ครุภัณฑ์</h2>
            <label className="flex h-[38px] w-[300px] items-center gap-[8px] rounded-[10px] border border-gray-line px-[12px] text-gray-20 focus-within:border-blue-00 max-sm:w-full">
              <Ic d={AI.search} s={15} />
              <input aria-label="ค้นหาทะเบียน" placeholder="ค้นหาเลขครุภัณฑ์ ชื่อ ที่ตั้ง ผู้ขาย" value={q} onChange={(e) => { setQ(e.target.value); setPg(1) }} className="min-w-0 flex-1 bg-transparent text-[12px] text-black outline-none" />
            </label>
          </div>
          <div role="tablist" aria-label="ประเภท" className="flex gap-[6px]">
            {([['all', 'ทั้งหมด'], ['ครุภัณฑ์', 'ครุภัณฑ์'], ['พัสดุ', 'พัสดุคงคลัง']] as const).map(([k, l]) => <button key={k} type="button" role="tab" aria-selected={tab === k} onClick={() => { setTab(k); setPg(1) }} className={`h-[32px] rounded-full px-[14px] text-[12px] font-medium transition ${tab === k ? 'bg-blue-00 text-white' : 'bg-blue-bg text-blue-00 hover:bg-blue-20'}`}>{l}<span className="ml-[6px] font-urbanist opacity-70">{k === 'all' ? all.length : all.filter((a) => a.kind === k).length}</span></button>)}
          </div>
          <div className="overflow-x-auto">
            <table className="w-full min-w-[900px] text-left text-[12px]">
              <thead className="text-[11px] text-gray-20"><tr>{['เลขครุภัณฑ์ / รหัส', 'รายการ', 'คงเหลือ / สภาพ', 'ที่ตั้ง', 'วันที่รับ', 'มูลค่า (บาท)', ''].map((h, i) => <th key={i} className="border-b border-gray-line-2 py-[8px] pr-[10px] font-normal">{h}</th>)}</tr></thead>
              <tbody>
                {rows.slice((cur - 1) * PAGE, cur * PAGE).map((a) => (
                  <tr key={a.id} className="border-b border-gray-line-2 last:border-0 hover:bg-[#f7faff]">
                    <td className="py-[10px] pr-[10px] font-urbanist font-medium whitespace-nowrap text-blue-dark">{a.code}</td>
                    <td className="py-[10px] pr-[10px]"><p className="font-medium">{a.name}</p><p className="text-[11px] font-light text-gray-20">{`${a.kind}${a.serial !== '-' && a.serial ? ` · S/N ${a.serial}` : ''} · ${a.importNo}`}</p></td>
                    <td className="py-[10px] pr-[10px] whitespace-nowrap">{a.kind === 'พัสดุ' ? <span className={`font-urbanist font-medium ${lowStock(a) ? 'text-[#c13232]' : ''}`}>{`${a.qty} ${a.unit}`}{lowStock(a) && <span className="ml-[6px] rounded-full bg-[#ffe3e3] px-[8px] py-[2px] text-[10px] text-[#c13232]">ใกล้หมด</span>}</span> : <span className={`rounded-full px-[10px] py-[3px] text-[11px] font-medium ${stateTone[a.state]}`}>{a.state}</span>}</td>
                    <td className="py-[10px] pr-[10px] font-light text-gray-30">{a.location}</td>
                    <td className="py-[10px] pr-[10px] font-light whitespace-nowrap text-gray-30">{thDate(a.receivedAt)}</td>
                    <td className="py-[10px] pr-[10px] text-right font-urbanist">{money(assetValue(a))}</td>
                    <td className="py-[10px] text-right whitespace-nowrap">
                      <button type="button" title="พิมพ์บาร์โค้ด" aria-label={`พิมพ์บาร์โค้ด ${a.code}`} onClick={() => setSticker(a)} className="inline-flex size-[30px] items-center justify-center rounded-[8px] text-gray-20 hover:bg-blue-bg hover:text-blue-00"><Ic d={AI.barcode} /></button>
                      {a.kind === 'ครุภัณฑ์' && a.state === 'ใช้งานได้' && <Link to={`/asset/repair/new?code=${encodeURIComponent(a.code)}`} title="แจ้งซ่อม" aria-label={`แจ้งซ่อม ${a.code}`} className="inline-flex size-[30px] items-center justify-center rounded-[8px] text-gray-20 hover:bg-[#fff1d6] hover:text-[#a8650b]"><Ic d={AI.tool} /></Link>}
                    </td>
                  </tr>
                ))}
                {!rows.length && <tr><td colSpan={7} className="py-[30px] text-center text-[13px] font-light text-gray-20">ไม่พบรายการในทะเบียน</td></tr>}
              </tbody>
            </table>
          </div>
          <div className="flex items-center justify-between"><span className="text-[12px] font-light text-gray-30">{`ทั้งหมด ${rows.length} รายการ`}</span><Pagination page={cur} pageCount={pages} onChange={setPg} /></div>
        </section>

        <section aria-label="ประกาศจัดซื้อจัดจ้างล่าสุด" className={`${card} flex flex-col gap-[10px] p-[18px]`}>
          <div className="flex items-center"><h2 className="flex-1 text-[15px] font-semibold">ประกาศจัดซื้อจัดจ้างล่าสุด</h2><Link to="/asset/procurement" className="text-[12px] font-medium text-blue-00 hover:underline">ดูทั้งหมด ›</Link></div>
          {anns.slice(0, 3).map((n) => (
            <div key={n.id} className="flex flex-wrap items-center gap-[12px] rounded-[12px] bg-gray-subtle px-[14px] py-[10px]">
              <span className="rounded-[8px] bg-white px-[10px] py-[4px] font-urbanist text-[11px] font-semibold text-blue-dark ring-1 ring-gray-line-2">{n.no}</span>
              <span className="min-w-0 flex-1"><p className="truncate text-[13px] font-medium">{n.project}</p><p className="text-[11px] font-light text-gray-20">{`${n.method} · วงเงิน ${money(n.budget).replace(/\.00$/, '')} บาท · ปิดรับ ${thDate(n.closeAt)}`}</p></span>
              <span className={`rounded-full px-[10px] py-[3px] text-[11px] font-medium ${n.status === 'เผยแพร่แล้ว' ? 'bg-[#dff5e8] text-[#0f8a63]' : n.status === 'ร่าง' ? 'bg-gray-line text-gray-30' : 'bg-[#e8e4fb] text-[#5a40c9]'}`}>{n.status}</span>
            </div>
          ))}
        </section>
      </div>

      <Modal open={!!sticker} onClose={() => setSticker(undefined)} title="พิมพ์ป้ายบาร์โค้ด" width="max-w-[420px]">
        {sticker && (
          <div id="asset-sticker" className="mx-auto flex w-[300px] flex-col items-center gap-[6px] rounded-[10px] border-2 border-dashed border-gray-line p-[14px] text-center">
            <p className="text-[10px] font-semibold text-blue-dark">สถาบันพัฒนาองค์กรชุมชน (องค์การมหาชน)</p>
            <Barcode value={sticker.code} w={240} h={54} />
            <p className="font-urbanist text-[14px] font-semibold tracking-[0.06em]">{sticker.code}</p>
            <p className="line-clamp-1 text-[11px] text-gray-30">{sticker.name}</p>
            <p className="text-[10px] font-light text-gray-20">{`รับเข้า ${thDate(sticker.receivedAt)} · ${sticker.location}`}</p>
          </div>
        )}
        <div className="flex justify-end gap-[8px]">
          <button type="button" onClick={() => setSticker(undefined)} className="h-[38px] rounded-[8px] border border-gray-line px-[16px] text-[13px]">ปิด</button>
          <button type="button" onClick={() => { const el = document.getElementById('asset-sticker'); const w = window.open('', '_blank', 'width=420,height=320'); if (el && w) { w.document.write(`<html><head><title>${sticker?.code}</title><style>body{font-family:sans-serif;display:flex;justify-content:center;padding:16px}</style></head><body>${el.outerHTML}</body></html>`); w.document.close(); w.focus(); w.print() } else show('เบราว์เซอร์บล็อกหน้าต่างพิมพ์') }} className="h-[38px] rounded-[8px] bg-blue-00 px-[16px] text-[13px] font-medium text-white hover:brightness-110">พิมพ์ป้าย</button>
        </div>
      </Modal>
      {toast}
    </div>
  )
}
