import { useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { ContractTable } from '../components/agreement/Table'
import { useContractActions } from '../components/agreement/useActions'
import { Crumbs, GI, GPersonaSwitch, Ic, Panel, Title, page } from '../components/agreement/Parts'
import Modal from '../components/ui/Modal'
import { dueOf } from '../data/erpAgreement'

const SHOW = 5

/** ภาพรวมสัญญา — home of ERP AGREEMENT (book 3 §2.3.1.1, fig 2-117) */
export default function AgreementHomePage() {
  const a = useContractActions()
  const [all, setAll] = useState(false)
  const rows = useMemo(() => [...a.all].sort((x, y) => y.updatedAt.localeCompare(x.updatedAt)), [a.all])
  const active = a.all.filter((c) => c.status === 'ลงนามแล้ว' && dueOf(c) !== 'เลยกำหนด').length
  const soon = a.all.filter((c) => dueOf(c) === 'ใกล้ครบกำหนด').length
  const over = a.all.filter((c) => dueOf(c) === 'เลยกำหนด').length
  const review = a.all.filter((c) => c.status === 'รอตรวจสอบ').length
  const feed = useMemo(() => a.all.flatMap((c) => c.history.map((h) => ({ ...h, c }))).sort((x, y) => y.at.localeCompare(x.at)).slice(0, 7), [a.all])

  const tiles = [
    { label: 'สัญญาทั้งหมด', v: a.all.length, sub: `ร่าง ${a.all.filter((c) => c.status === 'ร่าง').length} · รอตรวจสอบ ${review}`, icon: GI.doc, tone: 'bg-[#e8f1ff] text-[#2057c9]' },
    { label: 'สัญญาที่ใช้งานอยู่', v: active, sub: 'ลงนามแล้วและยังไม่หมดอายุ', icon: GI.shield, tone: 'bg-[#dff5e8] text-[#0f8a63]' },
    { label: 'ใกล้ครบกำหนด', v: soon, sub: 'ภายใน 60 วัน', icon: GI.clock, tone: 'bg-[#fff1d6] text-[#a8650b]' },
    { label: 'เลยกำหนด', v: over, sub: 'ควรต่อสัญญาหรือปิดสัญญา', icon: GI.alert, tone: 'bg-[#ffe3e3] text-[#c13232]' },
  ]
  const quick = [
    { to: '/agreement/new', label: 'สร้างสัญญาฉบับใหม่', sub: 'เลือกประเภทและกรอกข้อมูลคู่สัญญา', icon: GI.plus, ref: '2.3.1.2' },
    { to: '/agreement/registry/new', label: 'เพิ่มทะเบียนสัญญา', sub: 'บันทึกสัญญาที่ลงนามแล้ว พร้อมแนบไฟล์', icon: GI.book, ref: '2.3.1.5' },
    { to: '/agreement/registry', label: 'จัดการสัญญาแนบ', sub: 'ค้นหาและแนบไฟล์ในทะเบียนสัญญา', icon: GI.clip, ref: '2.3.1.4' },
  ]

  return (
    <div className={`${page} items-center`}>
      <div className="flex w-full max-w-[1100px] flex-col gap-[14px]">
        <Title right={<GPersonaSwitch />}>งานบริหารจัดการสัญญา</Title>
        <Crumbs items={[{ label: 'หน้าแรก', to: '/agreement' }, { label: 'ภาพรวมสัญญา' }]} />

        <p role="note" className="flex items-start gap-[10px] rounded-[12px] border border-[#f1d28b] bg-[#fffbea] px-[14px] py-[10px] text-[12px] leading-[1.6] text-[#7a5600]">
          <span className="mt-[2px] shrink-0"><Ic d={GI.alert} s={16} /></span>
          <span>{over + soon > 0 ? <>มีสัญญา <b className="font-semibold">ใกล้ครบกำหนด {soon} ฉบับ</b> และ <b className="font-semibold">เลยกำหนด {over} ฉบับ</b> โปรดตรวจสอบและดำเนินการต่ออายุ ก่อนสัญญาสิ้นสุดอย่างน้อย 30 วัน</> : 'ไม่มีสัญญาที่ใกล้ครบกำหนด'}</span>
        </p>

        <div className="grid grid-cols-4 gap-[12px] max-lg:grid-cols-2 max-sm:grid-cols-1" aria-label="สรุปภาพรวมสัญญา">
          {tiles.map((t) => (
            <div key={t.label} className="flex items-center gap-[14px] rounded-[14px] border border-gray-line-2 bg-white p-[16px]">
              <span className={`flex size-[44px] shrink-0 items-center justify-center rounded-[12px] ${t.tone}`}><Ic d={t.icon} s={20} /></span>
              <span className="flex min-w-0 flex-col"><span className="text-[12px] font-light text-gray-30">{t.label}</span><span className="font-urbanist text-[22px] leading-[1.2] font-semibold text-blue-dark">{t.v}</span><span className="text-[11px] font-light text-gray-20">{t.sub}</span></span>
            </div>
          ))}
        </div>

        <nav aria-label="จัดการสัญญาด่วน" className="grid grid-cols-3 gap-[12px] max-md:grid-cols-1">
          {quick.map((x) => (
            <Link key={x.to} to={x.to} className="group flex items-center gap-[12px] rounded-[14px] border border-gray-line-2 bg-white p-[14px] transition hover:border-blue-20 hover:shadow-[0_6px_18px_rgba(31,90,200,0.1)]">
              <span className="flex size-[40px] shrink-0 items-center justify-center rounded-[11px] bg-blue-bg text-blue-00"><Ic d={x.icon} s={19} /></span>
              <span className="min-w-0 flex-1"><span className="block text-[13px] font-semibold">{x.label}</span><span className="block text-[11px] font-light text-gray-30">{x.sub}</span></span>
              <span className="text-[10px] font-light text-gray-20">{x.ref}</span>
            </Link>
          ))}
        </nav>

        <div className="grid grid-cols-[minmax(0,1fr)_320px] items-start gap-[14px] max-lg:grid-cols-1">
          <Panel title="รายการสัญญาล่าสุด" label="รายการสัญญาล่าสุด" action={<button type="button" onClick={() => setAll(true)} className="h-[32px] rounded-[8px] border border-blue-00 px-[14px] text-[12px] font-medium text-blue-00 hover:bg-blue-bg">ทั้งหมด ({rows.length})</button>}>
            <ContractTable rows={rows.slice(0, SHOW)} can={a.can} onView={a.onView} onEdit={a.onEdit} onCopy={a.onCopy} onDelete={a.onDelete} />
          </Panel>
          <aside aria-label="กิจกรรมล่าสุด" className="flex flex-col gap-[10px] rounded-[14px] border border-gray-line-2 bg-white p-[16px]">
            <h2 className="text-[14px] font-semibold">กิจกรรมล่าสุด</h2>
            <ol className="flex flex-col gap-[12px]">
              {feed.map((f, i) => (
                <li key={i} className="flex items-start gap-[10px]">
                  <span className={`mt-[2px] flex size-[28px] shrink-0 items-center justify-center rounded-full ${f.action.startsWith('ลงนาม') || f.action.startsWith('ผ่าน') ? 'bg-[#dff5e8] text-[#0f8a63]' : f.action.startsWith('ให้ปรับ') || f.action.startsWith('ไม่') ? 'bg-[#ffe3e3] text-[#c13232]' : 'bg-blue-bg text-blue-00'}`}><Ic d={f.action.startsWith('ลงนาม') ? GI.pen : f.action.startsWith('ผ่าน') ? GI.check : GI.doc} s={14} /></span>
                  <span className="min-w-0 flex-1"><span className="block text-[12px] leading-[1.4] font-medium">{f.action}</span><span className="block truncate text-[11px] font-light text-gray-30">{f.c.title}</span><span className="block text-[10px] font-light text-gray-20">{f.by} · {f.at}</span></span>
                </li>
              ))}
            </ol>
          </aside>
        </div>
      </div>

      <Modal open={all} onClose={() => setAll(false)} title="รายการสัญญาทั้งหมด" width="max-w-[1000px]">
        <div className="max-h-[68vh] overflow-y-auto pr-[4px]"><ContractTable rows={rows} can={a.can} onView={(c) => { setAll(false); a.onView(c) }} onEdit={a.onEdit} onCopy={a.onCopy} onDelete={(c) => { setAll(false); a.onDelete(c) }} /></div>
      </Modal>
      {a.modals}
    </div>
  )
}
