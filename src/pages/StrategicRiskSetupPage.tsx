import { useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useToast } from '../components/leader/Parts'
import Select from '../components/ui/Select'
import { Btn, Crumbs, PersonaSwitch, Radios, Row, Section, Title, ctl, err, page, ta } from '../components/strategic/Parts'
import { alignments, levelLabel, levelTone, offices, riskTypes, stamp, type Risk } from '../data/strategic'
import { nextRiskCode, risks } from '../lib/strategicStore'

const years = ['2568', '2569', '2570']
const blank = (): Risk => ({ id: 0, code: '', fiscalYear: '2568', name: '', type: riskTypes[0], description: '', owner: '', causes: { internal: '', external: '', gap: '', resource: '' }, impacts: { mission: '', clients: '', money: '', image: '', legal: '' }, align: 'related', impact: 3, likelihood: 3, residual: 9, status: 'draft', updatedAt: '' })
const scale = [1, 2, 3, 4, 5].map((n) => ({ value: String(n), label: String(n) }))

/** ตั้งค่าความเสี่ยงตั้งต้น (book 3 fig 2-10) — 2.1.2.5 ; flow: book 1 §2.2.1.4 */
export default function StrategicRiskSetupPage() {
  const navigate = useNavigate()
  const [toast, show] = useToast()
  const [r, setR] = useState<Risk>(blank)
  const [tried, setTried] = useState(false)
  const [step, setStep] = useState<1 | 2>(1)
  const code = useMemo(() => r.code || nextRiskCode(), [r.code])
  const set = (p: Partial<Risk>) => setR((x) => ({ ...x, ...p }))
  const setC = (k: keyof Risk['causes'], v: string) => setR((x) => ({ ...x, causes: { ...x.causes, [k]: v } }))
  const setI = (k: keyof Risk['impacts'], v: string) => setR((x) => ({ ...x, impacts: { ...x.impacts, [k]: v } }))
  const errors: Record<string, string> = {}
  if (!r.name.trim()) errors.name = 'กรุณาระบุชื่อความเสี่ยง'
  if (!r.owner) errors.owner = 'กรุณาระบุหน่วยงานเจ้าของความเสี่ยง'
  if (!r.description.trim()) errors.description = 'กรุณาอธิบายความเสี่ยง'
  const e = tried ? errors : {}
  const level = r.impact * r.likelihood

  const persist = (status: Risk['status']) => {
    const rec: Risk = { ...r, code, id: r.id || risks.next(), status, residual: level, updatedAt: stamp() }
    risks.save(rec)
    setR(rec)
    return rec
  }
  const draft = () => {
    if (!r.name.trim()) return show('กรุณาระบุชื่อความเสี่ยงก่อนบันทึกร่าง')
    persist('draft')
    show('บันทึกร่างแล้ว กลับมาแก้ไขภายหลังได้')
  }
  const next = () => {
    setTried(true)
    if (Object.keys(errors).length) return show('กรุณากรอกข้อมูลที่จำเป็นให้ครบ')
    persist('draft')
    setStep(2)
    setTimeout(() => document.getElementById('assess')?.scrollIntoView({ behavior: 'smooth', block: 'start' }), 80)
  }
  const finish = () => {
    const rec = persist('open')
    show(`บันทึกความเสี่ยง ${rec.code} (ระดับ${levelLabel(level)}) แล้ว`)
    setTimeout(() => navigate('/strategic'), 900)
  }
  const inp = (label: string, v: string, f: (s: string) => void, bad?: boolean) => <input aria-label={label} placeholder={label} className={`${ctl} ${bad ? err : ''}`} value={v} onChange={(x) => f(x.target.value)} />

  return (
    <div className={`${page} items-center`}>
      <div className="flex w-full max-w-[860px] flex-col gap-[12px]">
        <Title back="/strategic" right={<PersonaSwitch />}>ตั้งค่าความเสี่ยงตั้งต้น</Title>
        <Crumbs items={[{ label: 'หน้าแรก', to: '/strategic' }, { label: 'ความเสี่ยง' }, { label: 'ตั้งค่าความเสี่ยงตั้งต้น' }]} />

        <Section title="ข้อมูลพื้นฐาน">
          <div className="grid grid-cols-2 gap-[14px] max-sm:grid-cols-1">
            <Row label="ปีงบประมาณ"><Select label="ปีงบประมาณ" value={r.fiscalYear} options={years.map((y) => ({ value: y, label: y }))} onChange={(v) => set({ fiscalYear: v })} /></Row>
            <Row label="รหัสความเสี่ยง"><input aria-label="รหัสความเสี่ยง" readOnly className={`${ctl} bg-gray-bg text-gray-30`} value={code} /></Row>
          </div>
          <Row label="ชื่อความเสี่ยง" req error={e.name}>{inp('ชื่อความเสี่ยง', r.name, (v) => set({ name: v }), !!e.name)}</Row>
          <Row label="ประเภทความเสี่ยง"><Radios label="ประเภทความเสี่ยง" value={r.type} options={riskTypes.map((t) => ({ key: t, label: t }))} onChange={(v) => set({ type: v })} /></Row>
          <Row label="คำอธิบายความเสี่ยง" req error={e.description}><textarea aria-label="คำอธิบายความเสี่ยง" placeholder="คำอธิบายความเสี่ยง" className={`${ta} ${e.description ? err : ''}`} value={r.description} onChange={(x) => set({ description: x.target.value })} /></Row>
          <Row label="หน่วยงานเจ้าของความเสี่ยง" req error={e.owner}><Select label="หน่วยงานเจ้าของความเสี่ยง" value={r.owner} placeholder="หน่วยงานเจ้าของความเสี่ยง" options={offices.map((o) => ({ value: o, label: o }))} onChange={(v) => set({ owner: v })} /></Row>
        </Section>

        <Section title="สาเหตุและผลกระทบ">
          {([['internal', 'ด้านปัจจัยภายใน'], ['external', 'ด้านปัจจัยภายนอก'], ['gap', 'ช่องว่างกระบวนการ'], ['resource', 'ปัญหาทรัพยากร']] as const).map(([k, l]) => <Row key={k} label={l}>{inp(l, r.causes[k], (v) => setC(k, v))}</Row>)}
          {([['mission', 'ผลกระทบต่อพันธกิจ/ยุทธศาสตร์'], ['clients', 'ผลกระทบต่อผู้รับบริการ'], ['money', 'ผลกระทบทางการเงิน'], ['image', 'ผลกระทบต่อภาพลักษณ์'], ['legal', 'ผลกระทบต่อกฎหมาย']] as const).map(([k, l]) => <Row key={k} label={l}>{inp(l, r.impacts[k], (v) => setI(k, v))}</Row>)}
          <Row label="Risk Alignment"><Radios label="Risk Alignment" value={r.align} options={alignments.map((a) => ({ key: a.key, label: a.label }))} onChange={(v) => set({ align: v })} /></Row>
        </Section>

        {step === 2 && (
          <Section title="ประเมินระดับความเสี่ยงตั้งต้น" tone="blue">
            <div id="assess" className="scroll-mt-[16px]" />
            <div className="grid grid-cols-[1fr_1fr_auto] items-end gap-[14px] max-sm:grid-cols-1">
              <Row label="ผลกระทบ (Impact 1–5)"><Select label="ผลกระทบ" value={String(r.impact)} options={scale} onChange={(v) => set({ impact: Number(v) })} /></Row>
              <Row label="โอกาสเกิด (Likelihood 1–5)"><Select label="โอกาสเกิด" value={String(r.likelihood)} options={scale} onChange={(v) => set({ likelihood: Number(v) })} /></Row>
              <p className="pb-[8px] text-[12px]">ระดับ <b className={`ml-[4px] rounded-[6px] px-[10px] py-[3px] font-urbanist text-[13px] ${levelTone(level)}`} aria-live="polite">{level} · {levelLabel(level)}</b></p>
            </div>
            <p className="text-[11px] font-light text-gray-30">ระดับสูง (≥ 15) ระบบแจ้งเตือนสำนักยุทธศาสตร์ฯ และยกระดับเป็นความเสี่ยงระดับองค์กรเมื่อมีรายงานผลรายไตรมาส</p>
          </Section>
        )}

        <div className="flex justify-end gap-[8px]">
          <Btn kind="ghost" onClick={() => navigate('/strategic')}>ยกเลิก</Btn>
          <Btn kind="outline" onClick={draft}>บันทึกร่าง</Btn>
          {step === 1 ? <Btn onClick={next}>ถัดไป</Btn> : <Btn onClick={finish}>บันทึกความเสี่ยง</Btn>}
        </div>
      </div>
      {toast}
    </div>
  )
}
