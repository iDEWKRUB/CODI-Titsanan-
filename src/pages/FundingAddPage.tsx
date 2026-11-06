import { useMemo, useState } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { useToast } from '../components/leader/Parts'
import Select from '../components/ui/Select'
import { Btn, Crumbs, Gate, GPersonaSwitch, GRow, GSection, RiskPill, Stepper, Title, ctl, err, page, ro } from '../components/funding/Parts'
import { POLICY, channels, fyOf, gPersonas, kindLabel, money, payments, products, riskLevels, targets, unitsOf, type Inv, type Product } from '../data/erpFunding'
import { addInv, invs, useGPersona, useInvs } from '../lib/erpFundingStore'
import { checkInv } from '../data/erpFunding'

const fromProduct = (p: Product, fy: string): Inv => ({ id: 0, productId: p.id, name: p.name, kind: p.kind, type: p.type, issuer: p.issuer, dividend: p.dividend, ret: p.ret, lv: p.lv, price: p.price, amount: 0, start: '', end: '', channel: '', payment: '', objective: '', target: 3, accept: 3, fy, status: 'draft', createdBy: gPersonas.staff.name, events: [] })

/** เพิ่มกองทุน/หุ้นกู้ (book 3 fig 2-24) — 2.1.5.2 ; the system checks the proposal against the investment policy before saving it */
export default function FundingAddPage() {
  const me = useGPersona()
  const all = useInvs()
  const navigate = useNavigate()
  const [sp] = useSearchParams()
  const [toast, show] = useToast()
  const editId = Number(sp.get('edit')) || 0
  const init = useMemo<Inv>(() => {
    const e = editId ? invs.get(editId) : undefined
    if (e) return structuredClone(e)
    const p = products.find((x) => x.id === Number(sp.get('product'))) ?? products[0]
    return fromProduct(p, sp.get('fy') || '2569')
  }, []) // eslint-disable-line react-hooks/exhaustive-deps
  const [v, setV] = useState<Inv>(init)
  const [errors, setErrors] = useState<Record<string, string>>({})
  const set = (x: Partial<Inv>) => setV((s) => ({ ...s, ...x }))
  const allowed = me === 'staff'
  const units = unitsOf(v.amount, v.price)
  const pickProduct = (id: string) => { const p = products.find((x) => x.id === Number(id))!; setV((s) => ({ ...fromProduct(p, s.fy), amount: s.amount, start: s.start, end: s.end, channel: s.channel, payment: s.payment, objective: s.objective, target: s.target, accept: s.accept, id: s.id, events: s.events })) }
  const cls = (k: string) => `${ctl} ${errors[k] ? err : ''}`

  const submit = () => {
    if (!allowed) return show('ต้องเป็นเจ้าหน้าที่ผู้รับผิดชอบ')
    const e = checkInv({ ...v, fy: v.start ? fyOf(v.start).fy : v.fy }, all)
    setErrors(e)
    if (Object.keys(e).length) return show('กรุณาตรวจสอบข้อมูลและข้อกำหนดการลงทุน')
    addInv({ ...v, fy: fyOf(v.start).fy })
    show('เพิ่มรายการลงทุนแล้ว · แจ้งผู้อำนวยการให้พิจารณาที่หน้ารายงานการลงทุน')
    setTimeout(() => navigate('/funding/list'), 1300)
  }

  return (
    <div className={`${page} items-center`}>
      <div className="flex w-full max-w-[860px] flex-col gap-[12px]">
        <Title back="/funding" right={<GPersonaSwitch />}>เพิ่มกองทุน / หุ้นกู้</Title>
        <Crumbs items={[{ label: 'หน้าแรก', to: '/funding' }, { label: 'ค้นหากองทุน / หุ้นกู้', to: '/funding' }, { label: 'เพิ่มกองทุน / หุ้นกู้' }]} />
        <Gate allowed={allowed} need="เจ้าหน้าที่ผู้รับผิดชอบ" />
        {v.rejected && <p role="status" className="rounded-[10px] bg-[#fff1f1] px-[14px] py-[10px] text-[12px] text-[#c13232]">{`ผู้อำนวยการไม่อนุมัติ: ${v.rejected} — แก้ไขแล้วเสนอใหม่ได้`}</p>}

        <GSection title="ข้อมูลทั่วไป">
          <GRow label="ชื่อกองทุน / หุ้นกู้" req>
            <Select label="ชื่อกองทุน" value={String(v.productId)} options={products.map((p) => ({ value: String(p.id), label: p.name }))} onChange={pickProduct} />
          </GRow>
          <div className="grid grid-cols-2 gap-x-[14px] gap-y-[12px] max-sm:grid-cols-1">
            <GRow label="ประเภทการลงทุน"><input aria-label="ประเภทการลงทุน" readOnly className={ro} value={`${kindLabel[v.kind]} · ${v.type}`} /></GRow>
            <GRow label="บริษัทจัดการ / ผู้ออก"><input aria-label="บริษัทจัดการ / ผู้ออก" readOnly className={ro} value={v.issuer} /></GRow>
            <GRow label="นโยบายปันผล"><input aria-label="นโยบายปันผล" readOnly className={ro} value={v.dividend} /></GRow>
            <GRow label="ระดับความเสี่ยง"><div className="flex h-[40px] items-center gap-[8px] rounded-[8px] bg-gray-bg px-[12px] text-[13px] text-gray-30"><RiskPill lv={v.lv} />{`ระดับ ${v.lv} · ผลตอบแทนเฉลี่ย ${v.ret}%`}</div></GRow>
          </div>
        </GSection>

        <GSection title="รายละเอียดการลงทุน">
          <GRow label="จำนวนเงินลงทุน (บาท)" req><Stepper label="จำนวนเงินลงทุน" value={v.amount} step={100000} disabled={!allowed} onChange={(n) => set({ amount: n })} error={errors.amount} /></GRow>
          <GRow label="ราคาต่อหน่วยที่ได้รับ (บาท)" req><Stepper label="ราคาต่อหน่วย" value={v.price} step={0.1} disabled={!allowed} onChange={(n) => set({ price: n })} error={errors.price} /></GRow>
          <GRow label="จำนวนหน่วยลงทุน" hint="ระบบคำนวณจาก จำนวนเงินลงทุน ÷ ราคาต่อหน่วย"><input aria-label="จำนวนหน่วยลงทุน" readOnly className={`${ro} text-right font-urbanist`} value={money(units)} /></GRow>
          <GRow label="วันที่เริ่มลงทุน" req error={errors.start || errors.end}>
            <div className="flex items-center gap-[8px] max-sm:flex-col max-sm:items-stretch">
              <input type="date" aria-label="วันที่เริ่มลงทุน" disabled={!allowed} className={cls('start')} value={v.start} onChange={(e) => set({ start: e.target.value })} />
              <span className="text-[12px] font-light text-gray-20">ถึง</span>
              <input type="date" aria-label="วันที่สิ้นสุดการลงทุน" disabled={!allowed} className={cls('end')} value={v.end} onChange={(e) => set({ end: e.target.value })} />
            </div>
          </GRow>
          <div className="grid grid-cols-2 gap-x-[14px] gap-y-[12px] max-sm:grid-cols-1">
            <GRow label="ช่องทางการลงทุน" req error={errors.channel}><Select label="ช่องทางการลงทุน" value={v.channel} placeholder="ช่องทางการลงทุน" options={channels.map((c) => ({ value: c, label: c }))} onChange={(c) => set({ channel: c })} /></GRow>
            <GRow label="ประเภทการชำระเงิน" req error={errors.payment}><Select label="ประเภทการชำระเงิน" value={v.payment} placeholder="ประเภทการชำระเงิน" options={payments.map((c) => ({ value: c, label: c }))} onChange={(c) => set({ payment: c })} /></GRow>
          </div>
        </GSection>

        <GSection title="กำหนดเป้าหมายการลงทุน">
          <GRow label="วัตถุประสงค์การลงทุน" req error={errors.objective}><input aria-label="วัตถุประสงค์การลงทุน" placeholder="วัตถุประสงค์" disabled={!allowed} className={cls('objective')} value={v.objective} onChange={(e) => set({ objective: e.target.value })} /></GRow>
          <div className="grid grid-cols-2 gap-x-[14px] gap-y-[12px] max-sm:grid-cols-1">
            <GRow label="เป้าหมายผลตอบแทนที่ยอมรับได้" error={errors.target}><Select label="เป้าหมายผลตอบแทนที่ยอมรับได้" value={String(v.target)} options={targets.map((t) => ({ value: String(t), label: `มากกว่า ${t.toFixed(2)} %` }))} onChange={(t) => set({ target: Number(t) })} /></GRow>
            <GRow label="ระดับความเสี่ยงที่ยอมรับได้" error={errors.accept}><Select label="ระดับความเสี่ยงที่ยอมรับได้" value={String(v.accept)} options={riskLevels.map((t) => ({ value: String(t), label: `ระดับ ${t}` }))} onChange={(t) => set({ accept: Number(t) })} /></GRow>
          </div>
          <p className="rounded-[10px] bg-blue-bg px-[14px] py-[10px] text-[11px] leading-[1.7] font-light text-gray-30">{`ข้อกำหนดการลงทุน: ลงทุนในผู้ออก/บริษัทจัดการรายเดียวไม่เกินร้อยละ ${POLICY.maxIssuerShare} ของพอร์ตที่อยู่ระหว่างลงทุน · ความเสี่ยงของผลิตภัณฑ์ต้องไม่เกินระดับที่ยอมรับได้ · ผลตอบแทนเฉลี่ยต้องไม่ต่ำกว่าเป้าหมาย`}</p>
        </GSection>

        <div className="flex justify-end gap-[10px]">
          <Btn kind="ghost" onClick={() => navigate('/funding')}>ยกเลิก</Btn>
          <Btn onClick={submit}>+ เพิ่มรายการลงทุน</Btn>
        </div>
      </div>
      {toast}
    </div>
  )
}
