import { useState } from 'react'
import { APersonaSwitch, Btn, Crumbs, Gate, Radios, Row, Section, Title, card, ctl, err, page, ta } from '../components/asset/Parts'
import { useToast } from '../components/leader/Parts'
import Modal from '../components/ui/Modal'
import Select from '../components/ui/Select'
import { budgetGroups, methodRule, methods, money, thDate, type Announce, type Method } from '../data/erpAsset'
import { announces, useAPersona, useAnnounces, whoAmI } from '../lib/assetStore'
import codiLogo from '../assets/login/logo-codi.webp'

const today = () => new Date().toISOString().slice(0, 10)
const plus = (iso: string, d: number) => { const x = new Date(iso); x.setDate(x.getDate() + d); return x.toISOString().slice(0, 10) }
const blank = (): Omit<Announce, 'id' | 'no' | 'status' | 'by'> => ({ method: 'ประกวดราคา', date: today(), project: '', budgetGroup: '', budget: 0, objective: '', qualification: '', condition: '', closeAt: plus(today(), 14) })
const tone: Record<Announce['status'], string> = { ร่าง: 'bg-gray-line text-gray-30', เผยแพร่แล้ว: 'bg-[#dff5e8] text-[#0f8a63]', ปิดรับซอง: 'bg-[#e8e4fb] text-[#5a40c9]' }
const nextNo = (all: Announce[]) => `ปจ. ${all.filter((a) => a.no.startsWith('ปจ.')).reduce((m, a) => Math.max(m, Number(a.no.slice(4).split('/')[0]) || 0), 0) + 1}/${new Date().getFullYear() + 543}`

/** check the method against the budget (ระเบียบกระทรวงการคลังว่าด้วยการจัดซื้อจัดจ้างฯ 2560, simplified) */
function ruleError(m: Method, budget: number) {
  if (m === 'เฉพาะเจาะจง' && budget > 500_000) return 'วิธีเฉพาะเจาะจงใช้ได้กับวงเงินไม่เกิน 500,000 บาท (ยกเว้นกรณีจำเป็นตามระเบียบ)'
  if (m === 'ประกวดราคา' && budget <= 500_000) return 'วงเงินไม่เกิน 500,000 บาท ควรใช้วิธีเฉพาะเจาะจง'
  return ''
}

function AnnounceDoc({ a }: { a: Omit<Announce, 'id'> }) {
  return (
    <article className="mx-auto flex w-full max-w-[560px] flex-col gap-[10px] bg-white px-[34px] py-[30px] text-[12.5px] leading-[1.8] text-black shadow-[0_2px_12px_rgba(0,0,0,0.12)]">
      <img src={codiLogo} alt="" className="mx-auto size-[56px] object-contain" />
      <p className="text-center text-[14px] font-semibold">ประกาศสถาบันพัฒนาองค์กรชุมชน (องค์การมหาชน)</p>
      <p className="text-center font-medium">{`เรื่อง ${a.method}${a.project ? a.project.replace(/^(จัดซื้อ|จ้าง)/, (m) => m) : '…'}`}</p>
      <p className="text-center text-[11px]">{`เลขที่ ${a.no}`}</p>
      <hr className="mx-auto w-[120px] border-black/40" />
      <p className="indent-[2.5em]">{`สถาบันพัฒนาองค์กรชุมชน (องค์การมหาชน) มีความประสงค์จะ${a.project || '…'} ด้วยวิธี${a.method} ภายใต้${a.budgetGroup || '…'} วงเงินงบประมาณ ${money(a.budget)} บาท`}</p>
      {a.objective && <p className="indent-[2.5em]">{`วัตถุประสงค์ ${a.objective}`}</p>}
      {a.qualification && <p><b className="font-semibold">คุณสมบัติผู้เสนอราคา</b> {a.qualification}</p>}
      {a.condition && <p><b className="font-semibold">เงื่อนไข</b> {a.condition}</p>}
      <p className="indent-[2.5em]">{`ผู้สนใจยื่นข้อเสนอได้ตั้งแต่วันที่ ${thDate(a.date)} ถึงวันที่ ${thDate(a.closeAt)}`}</p>
      <p className="mt-[8px] text-right">{`ประกาศ ณ วันที่ ${thDate(a.date)}`}</p>
      <p className="mt-[24px] text-right">(ผู้อำนวยการสถาบันพัฒนาองค์กรชุมชน)</p>
    </article>
  )
}

/** ประกาศจัดซื้อจัดจ้าง (book 3 fig 2-53) — 2.1.8.2 */
export default function AssetProcurementPage() {
  const list = useAnnounces()
  const me = useAPersona()
  const [toast, show] = useToast()
  const [f, setF] = useState(blank())
  const [editId, setEditId] = useState<number>()
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [preview, setPreview] = useState<Omit<Announce, 'id'>>()
  const allowed = me === 'central'
  const s = <K extends keyof typeof f>(k: K, v: (typeof f)[K]) => setF({ ...f, [k]: v })
  const rule = ruleError(f.method, f.budget)
  const draftNo = editId ? list.find((a) => a.id === editId)?.no ?? '' : nextNo(list)

  const save = (status: Announce['status']) => {
    const e: Record<string, string> = {}
    if (status !== 'ร่าง') {
      if (!f.project.trim()) e.project = 'กรุณากรอกชื่อโครงการ'
      if (!f.budgetGroup) e.budgetGroup = 'กรุณาเลือกกลุ่มงบประมาณ'
      if (f.budget <= 0) e.budget = 'กรุณากรอกวงเงินงบประมาณ'
      else if (rule) e.budget = rule
      if (!f.objective.trim()) e.objective = 'กรุณากรอกวัตถุประสงค์'
      if (!f.qualification.trim()) e.qualification = 'กรุณากรอกคุณสมบัติผู้เสนอราคา'
      if (!f.closeAt || f.closeAt <= f.date) e.closeAt = 'วันปิดรับข้อเสนอต้องหลังวันที่ประกาศ'
    } else if (!f.project.trim()) e.project = 'กรอกชื่อโครงการก่อนบันทึกร่าง'
    setErrors(e)
    if (Object.keys(e).length) return
    const id = editId ?? announces.next()
    announces.save({ ...f, id, no: draftNo, status, by: whoAmI() })
    show(status === 'ร่าง' ? `บันทึกร่าง ${draftNo} แล้ว` : `เผยแพร่ประกาศ ${draftNo} แล้ว`)
    setF(blank()); setEditId(undefined)
  }

  return (
    <div className={`${page} items-center`}>
      <div className="flex w-full max-w-[880px] flex-col gap-[12px]">
        <Title back="/asset" right={<APersonaSwitch />}>ประกาศจัดซื้อจัดจ้าง</Title>
        <Crumbs items={[{ label: 'หน้าแรก', to: '/asset' }, { label: 'ประกาศจัดซื้อจัดจ้าง' }]} />
        <Gate allowed={allowed} need="เจ้าหน้าที่สำนักบริหารงานกลาง" />

        <Section title={editId ? `แก้ไขประกาศ ${draftNo}` : 'จัดทำประกาศ'} action={<span className="font-urbanist text-[12px] text-gray-20">{draftNo}</span>}>
          <Row label="ประเภทประกาศ" req hint={methodRule[f.method]}><Radios label="ประเภทประกาศ" value={f.method} options={methods.map((m) => ({ key: m, label: m }))} onChange={(m) => s('method', m)} disabled={!allowed} /></Row>
          <Row label="วันที่ประกาศ" req><input type="date" aria-label="วันที่ประกาศ" disabled={!allowed} className={`${ctl} max-w-[240px]`} value={f.date} onChange={(e) => s('date', e.target.value)} /></Row>
          <Row label="ชื่อโครงการ" req error={errors.project}><input aria-label="ชื่อโครงการ" disabled={!allowed} placeholder="เช่น จัดซื้อเครื่องคอมพิวเตอร์โน้ตบุ๊ก จำนวน 20 เครื่อง" className={`${ctl} ${errors.project ? err : ''}`} value={f.project} onChange={(e) => s('project', e.target.value)} /></Row>
          <Row label="กลุ่มงบประมาณ" req error={errors.budgetGroup}><Select label="กลุ่มงบประมาณ" value={f.budgetGroup} placeholder="เลือกกลุ่มงบประมาณ" options={budgetGroups.map((b) => ({ value: b, label: b }))} onChange={(v) => s('budgetGroup', v)} /></Row>
          <Row label="วงเงินงบประมาณ (บาท)" req error={errors.budget} hint={!errors.budget && rule ? `ข้อสังเกต: ${rule}` : undefined}><input inputMode="numeric" aria-label="วงเงินงบประมาณ" disabled={!allowed} className={`${ctl} max-w-[260px] text-right font-urbanist ${errors.budget ? err : ''}`} value={f.budget ? f.budget.toLocaleString('en-US') : ''} onChange={(e) => s('budget', Number(e.target.value.replace(/\D/g, '')) || 0)} /></Row>
          <Row label="วัตถุประสงค์" req error={errors.objective}><textarea aria-label="วัตถุประสงค์" disabled={!allowed} className={`${ta} ${errors.objective ? err : ''}`} value={f.objective} onChange={(e) => s('objective', e.target.value)} /></Row>
          <Row label="คุณสมบัติผู้เสนอราคา" req error={errors.qualification}><input aria-label="คุณสมบัติผู้เสนอราคา" disabled={!allowed} placeholder="เช่น เป็นนิติบุคคล ไม่เป็นผู้ทิ้งงาน" className={`${ctl} ${errors.qualification ? err : ''}`} value={f.qualification} onChange={(e) => s('qualification', e.target.value)} /></Row>
          <Row label="เงื่อนไขการประกวดราคา"><input aria-label="เงื่อนไขการประกวดราคา" disabled={!allowed} placeholder="เช่น ยื่นผ่านระบบ e-GP รับประกัน 3 ปี" className={ctl} value={f.condition} onChange={(e) => s('condition', e.target.value)} /></Row>
          <Row label="วันปิดรับข้อเสนอ" req error={errors.closeAt}><input type="date" aria-label="วันปิดรับข้อเสนอ" disabled={!allowed} className={`${ctl} max-w-[240px] ${errors.closeAt ? err : ''}`} value={f.closeAt} onChange={(e) => s('closeAt', e.target.value)} /></Row>
          <div className="flex flex-wrap justify-end gap-[8px] border-t border-gray-line-2 pt-[14px]">
            {editId && <Btn kind="ghost" onClick={() => { setF(blank()); setEditId(undefined); setErrors({}) }}>ยกเลิกการแก้ไข</Btn>}
            <Btn kind="outline" onClick={() => setPreview({ ...f, no: draftNo, status: 'ร่าง', by: whoAmI() })}>ดูตัวอย่างประกาศ</Btn>
            <Btn kind="ghost" disabled={!allowed} onClick={() => save('ร่าง')}>บันทึกร่าง</Btn>
            <Btn disabled={!allowed} onClick={() => save('เผยแพร่แล้ว')}>บันทึกและเผยแพร่</Btn>
          </div>
        </Section>

        <section aria-label="รายการประกาศ" className={`${card} flex flex-col gap-[10px] p-[18px]`}>
          <h2 className="text-[15px] font-semibold">{`รายการประกาศ (${list.length})`}</h2>
          {list.map((a) => (
            <div key={a.id} className="flex flex-wrap items-center gap-[12px] rounded-[12px] border border-gray-line-2 px-[14px] py-[10px]">
              <span className="rounded-[8px] bg-blue-bg px-[10px] py-[4px] font-urbanist text-[11px] font-semibold whitespace-nowrap text-blue-dark">{a.no}</span>
              <span className="min-w-0 flex-1"><p className="text-[13px] font-medium">{a.project}</p><p className="text-[11px] font-light text-gray-20">{`${a.method} · ${a.budgetGroup} · ${money(a.budget).replace(/\.00$/, '')} บาท · ${thDate(a.date)} – ${thDate(a.closeAt)}`}</p></span>
              <span className={`rounded-full px-[10px] py-[3px] text-[11px] font-medium ${tone[a.status]}`}>{a.status}</span>
              <span className="flex gap-[4px]">
                <button type="button" onClick={() => setPreview(a)} className="h-[30px] rounded-[8px] px-[10px] text-[12px] text-blue-00 hover:bg-blue-bg">ดูประกาศ</button>
                {a.status === 'ร่าง' && <button type="button" disabled={!allowed} onClick={() => { const { id, no: _no, status: _s, by: _b, ...rest } = a; setF(rest); setEditId(id); window.scrollTo({ top: 0, behavior: 'smooth' }) }} className="h-[30px] rounded-[8px] px-[10px] text-[12px] text-gray-30 hover:bg-gray-bg disabled:opacity-40">แก้ไข</button>}
                {a.status === 'เผยแพร่แล้ว' && <button type="button" disabled={!allowed} onClick={() => { announces.save({ ...a, status: 'ปิดรับซอง' }); show(`ปิดรับข้อเสนอ ${a.no} แล้ว`) }} className="h-[30px] rounded-[8px] px-[10px] text-[12px] text-[#5a40c9] hover:bg-[#f1eefe] disabled:opacity-40">ปิดรับข้อเสนอ</button>}
              </span>
            </div>
          ))}
        </section>
      </div>
      <Modal open={!!preview} onClose={() => setPreview(undefined)} title="ตัวอย่างประกาศ" width="max-w-[640px]">
        <div className="max-h-[65vh] overflow-y-auto bg-gray-bg p-[14px]">{preview && <AnnounceDoc a={preview} />}</div>
      </Modal>
      {toast}
    </div>
  )
}
