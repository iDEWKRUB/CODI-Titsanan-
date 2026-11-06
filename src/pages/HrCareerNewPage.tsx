import { useMemo, useState } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { useToast } from '../components/leader/Parts'
import Select from '../components/ui/Select'
import { Btn, Crumbs, Gate, HPersonaSwitch, Radios, Row, Section, Title, ctl, err, page, ta } from '../components/hr/Parts'
import { contentTypes, levels, type Career, type CareerTraining } from '../data/erpHr'
import { careers, useHPersona } from '../lib/hrStore'

const blankT = (): CareerTraining => ({ contentType: '', detail: '', count: 1, note: '' })
const blank = (): Career => ({ id: 0, name: '', fy: '2569', riskCode: '', type: 'บริหาร', desc: '', prevLevel: '', qualification: '', trainings: [blankT()], status: 'draft' })

/** สร้างสายอาชีพ (book 3 fig 2-45) — 2.1.6.16 */
export default function HrCareerNewPage() {
  const me = useHPersona()
  const navigate = useNavigate()
  const [sp] = useSearchParams()
  const [toast, show] = useToast()
  const id = Number(sp.get('id')) || 0
  const init = useMemo<Career>(() => (id && careers.get(id) ? structuredClone(careers.get(id)!) : blank()), []) // eslint-disable-line react-hooks/exhaustive-deps
  const [v, setV] = useState<Career>(init)
  const [errors, setErrors] = useState<Record<string, string>>({})
  const allowed = me === 'hr'
  const set = (p: Partial<Career>) => setV((s) => ({ ...s, ...p }))
  const setT = (i: number, p: Partial<CareerTraining>) => set({ trainings: v.trainings.map((t, j) => (j === i ? { ...t, ...p } : t)) })
  const save = () => {
    if (!allowed) return show('ต้องเป็นเจ้าหน้าที่สำนักทรัพยากรบุคคล')
    const e: Record<string, string> = {}
    if (!v.name.trim()) e.name = 'กรุณาระบุชื่อสายอาชีพ'
    else if (careers.all().some((c) => c.id !== v.id && c.name === v.name.trim() && c.fy === v.fy)) e.name = 'มีสายอาชีพชื่อนี้ในปีงบประมาณเดียวกันแล้ว'
    if (!/^[A-Z]{2,4}-[A-Z]?\d{2,3}$/.test(v.riskCode.trim())) e.riskCode = 'รูปแบบรหัส เช่น HR-R01'
    if (!v.prevLevel) e.prevLevel = 'กรุณาเลือกระดับตำแหน่งก่อนหน้า'
    if (!v.qualification.trim()) e.qualification = 'กรุณาระบุคุณสมบัติ'
    if (v.trainings.some((t) => !t.contentType)) e.trainings = 'ทุกเงื่อนไขการอบรมต้องเลือกประเภทเนื้อหา'
    setErrors(e)
    if (Object.keys(e).length) return show('กรุณาตรวจสอบข้อมูล')
    const rec = { ...v, name: v.name.trim(), riskCode: v.riskCode.trim(), id: v.id || careers.next(), status: 'active' as const }
    careers.save(rec)
    show(`บันทึกสายอาชีพ “${rec.name}” แล้ว · แสดงในเงื่อนไขสายงานของพนักงาน`)
    setTimeout(() => navigate('/hr/career'), 1100)
  }
  const cls = (k: string) => `${ctl} ${errors[k] ? err : ''}`
  return (
    <div className={`${page} items-center`}>
      <div className="flex w-full max-w-[860px] flex-col gap-[12px]">
        <Title back="/hr/career" right={<HPersonaSwitch />}>{id ? 'รายละเอียดสายอาชีพ' : 'สร้างสายอาชีพ'}</Title>
        <Crumbs items={[{ label: 'หน้าแรก', to: '/hr' }, { label: 'จัดทำสายงานอาชีพ', to: '/hr/career' }, { label: 'สร้างสายอาชีพ' }]} />
        <Gate allowed={allowed} need="เจ้าหน้าที่สำนักทรัพยากรบุคคล" />
        <fieldset disabled={!allowed} className="flex flex-col gap-[12px]">
          <Section title="ข้อมูลพื้นฐาน">
            <div className="grid grid-cols-2 gap-[12px] max-sm:grid-cols-1">
              <Row label="ปีงบประมาณ" req><Select label="ปีงบประมาณ" value={v.fy} options={['2569', '2568', '2570'].map((y) => ({ value: y, label: y }))} onChange={(y) => set({ fy: y })} /></Row>
              <Row label="รหัสความเสี่ยง" req error={errors.riskCode}><input aria-label="รหัสความเสี่ยง" placeholder="HR-R01" className={`${cls('riskCode')} font-urbanist uppercase`} value={v.riskCode} onChange={(e) => set({ riskCode: e.target.value.toUpperCase() })} /></Row>
            </div>
            <Row label="ชื่อสายอาชีพ" req error={errors.name}><input aria-label="ชื่อสายอาชีพ" className={cls('name')} value={v.name} onChange={(e) => set({ name: e.target.value })} /></Row>
            <Row label="ประเภท"><Radios label="ประเภทสายงาน" value={v.type} options={[{ key: 'บริหาร', label: 'บริหาร' }, { key: 'วิชาการ', label: 'วิชาการ' }]} onChange={(t) => set({ type: t })} /></Row>
            <Row label="คำอธิบาย"><textarea aria-label="คำอธิบาย" className={ta} value={v.desc} onChange={(e) => set({ desc: e.target.value })} /></Row>
          </Section>
          <Section title="ส่วนที่ 2 เงื่อนไขการสำเร็จ">
            <Row label="ระดับตำแหน่งก่อนหน้า" req error={errors.prevLevel}><Select label="ระดับตำแหน่งก่อนหน้า" value={v.prevLevel} placeholder="เลือกระดับ" options={levels.map((l) => ({ value: l, label: l }))} onChange={(l) => set({ prevLevel: l })} /></Row>
            <Row label="คุณสมบัติ" req error={errors.qualification}><textarea aria-label="คุณสมบัติ" placeholder="ประสบการณ์ ทักษะพิเศษ วุฒิการศึกษา" className={`${ta} ${errors.qualification ? err : ''}`} value={v.qualification} onChange={(e) => set({ qualification: e.target.value })} /></Row>
          </Section>
          <Section title="ส่วนที่ 3 เงื่อนไขการอบรม">
            {v.trainings.map((t, i) => (
              <div key={i} className="flex flex-col gap-[10px] rounded-[10px] border border-dashed border-gray-line bg-[#fafbfc] p-[14px]">
                <div className="flex justify-between"><b className="text-[12px]">{`เงื่อนไขที่ ${i + 1}`}</b>{v.trainings.length > 1 && <button type="button" onClick={() => set({ trainings: v.trainings.filter((_, j) => j !== i) })} className="text-[11px] text-[#c13232] hover:underline">ลบ</button>}</div>
                <div className="grid grid-cols-2 gap-[10px] max-sm:grid-cols-1">
                  <Row label="ประเภทเนื้อหา" req><Select label={`ประเภทเนื้อหา ${i + 1}`} value={t.contentType} placeholder="เลือกประเภท" options={contentTypes.map((c) => ({ value: c, label: c }))} onChange={(c) => setT(i, { contentType: c })} /></Row>
                  <Row label="จำนวนหลักสูตร"><Select label={`จำนวนหลักสูตร ${i + 1}`} value={String(t.count)} options={[1, 2, 3, 4, 5].map((n) => ({ value: String(n), label: `${n} หลักสูตร` }))} onChange={(n) => setT(i, { count: Number(n) })} /></Row>
                </div>
                <Row label="รายละเอียดรายการ"><input aria-label={`รายละเอียดเงื่อนไข ${i + 1}`} className={ctl} value={t.detail} onChange={(e) => setT(i, { detail: e.target.value })} /></Row>
                <Row label="หมายเหตุเพิ่มเติม"><input aria-label={`หมายเหตุเงื่อนไข ${i + 1}`} className={ctl} value={t.note} onChange={(e) => setT(i, { note: e.target.value })} /></Row>
              </div>
            ))}
            {errors.trainings && <span role="alert" className="text-[11px] text-red-00">{errors.trainings}</span>}
            <button type="button" onClick={() => set({ trainings: [...v.trainings, blankT()] })} className="h-[32px] w-fit rounded-[8px] border border-blue-00 px-[12px] text-[12px] font-medium text-blue-00 hover:bg-blue-bg">+ เพิ่มรายการ</button>
          </Section>
        </fieldset>
        <div className="flex justify-end gap-[10px]"><Btn kind="ghost" onClick={() => navigate('/hr/career')}>ยกเลิก</Btn><Btn onClick={save}>ถัดไป →</Btn></div>
      </div>
      {toast}
    </div>
  )
}
