import { useMemo, useState } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { useToast } from '../components/leader/Parts'
import Select from '../components/ui/Select'
import { Btn, Crumbs, Gate, PersonaSwitch, Radios, Row, Section, Title, ctl, err, page, ta } from '../components/strategic/Parts'
import { alignments, offices, personas, planTypes, stamp, type Strategy } from '../data/strategic'
import { nextStrategyCode, strategies, usePersona, useStrategies } from '../lib/strategicStore'

const years = ['2567', '2568', '2569', '2570', '2571']
const blank = (): Strategy => ({ id: 0, code: '', fiscalYear: '2568', name: '', planType: 'corp', vision: '', mission: '', goal: '', description: '', links: { nat: '', gov: '', parent: '', sdg: '', kpi: '' }, align: 'related', createdAt: '', by: '' })

/** กำหนดยุทธศาสตร์องค์กร (book 3 fig 2-6) — 2.1.2.2 ; flow: book 1 §2.2.1.2 */
export default function StrategicDefinePage() {
  const me = usePersona()
  const saved = useStrategies()
  const [sp] = useSearchParams()
  const navigate = useNavigate()
  const [toast, show] = useToast()
  const editing = saved.find((s) => s.id === Number(sp.get('edit')))
  const [s, setS] = useState<Strategy>(() => editing ?? blank())
  const [tried, setTried] = useState(false)
  const set = (p: Partial<Strategy>) => setS((x) => ({ ...x, ...p }))
  const setLink = (k: keyof Strategy['links'], v: string) => setS((x) => ({ ...x, links: { ...x.links, [k]: v } }))
  const code = useMemo(() => s.code || nextStrategyCode(s.fiscalYear), [s.code, s.fiscalYear])
  const allowed = me === 'strat'

  const errors: Record<string, string> = {}
  if (!s.name.trim()) errors.name = 'กรุณาระบุชื่อยุทธศาสตร์'
  if (!s.vision.trim()) errors.vision = 'กรุณาระบุวิสัยทัศน์'
  if (!s.mission.trim()) errors.mission = 'กรุณาระบุพันธกิจ'
  if (!s.goal.trim()) errors.goal = 'กรุณาระบุเป้าประสงค์เชิงยุทธศาสตร์'
  const e = tried ? errors : {}

  const next = () => {
    setTried(true)
    if (!allowed) return show('ต้องเป็นเจ้าหน้าที่สำนักยุทธศาสตร์ฯ')
    if (Object.keys(errors).length) return show('กรุณากรอกข้อมูลที่จำเป็นให้ครบ')
    const rec: Strategy = { ...s, id: s.id || strategies.next(), code, createdAt: s.createdAt || stamp(), by: personas.strat.name }
    strategies.save(rec)
    show(`บันทึกยุทธศาสตร์ ${code} แล้ว · แจ้งเตือนทิศทางแผนถึง ${offices.length} สำนัก`)
    setTimeout(() => navigate('/strategic/plan'), 900)
  }
  const inp = (k: 'name' | 'vision' | 'mission' | 'goal', ph: string) => <input aria-label={ph} placeholder={ph} className={`${ctl} ${e[k] ? err : ''}`} value={s[k]} onChange={(x) => set({ [k]: x.target.value })} />

  return (
    <div className={`${page} items-center`}>
      <div className="flex w-full max-w-[920px] flex-col gap-[12px]">
        <Title back="/strategic" right={<PersonaSwitch />}>กำหนดยุทธศาสตร์องค์กร</Title>
        <Crumbs items={[{ label: 'หน้าแรก', to: '/strategic' }, { label: 'กำหนดยุทธศาสตร์องค์กร' }]} />
        <Gate allowed={allowed} need="เจ้าหน้าที่สำนักยุทธศาสตร์ นโยบายและแผน" />
        {saved.length > 0 && (
          <div className="flex flex-wrap items-center gap-[10px] text-[12px]">
            <span className="font-light text-gray-30">ยุทธศาสตร์ที่บันทึกไว้</span>
            <div className="w-[320px] max-sm:w-full"><Select label="โหลดยุทธศาสตร์ที่บันทึกไว้" value={s.id ? String(s.id) : ''} placeholder="สร้างใหม่" options={[{ value: '', label: 'สร้างใหม่' }, ...saved.map((x) => ({ value: String(x.id), label: `${x.code} · ${x.name}` }))]} onChange={(v) => { setTried(false); setS(v ? saved.find((x) => x.id === Number(v))! : blank()) }} /></div>
          </div>
        )}

        <Section title="ภาพรวมยุทธศาสตร์">
          <div className="grid grid-cols-2 gap-[14px] max-sm:grid-cols-1">
            <Row label="ปีงบประมาณ"><Select label="ปีงบประมาณ" value={s.fiscalYear} options={years.map((y) => ({ value: y, label: y }))} onChange={(v) => set({ fiscalYear: v, code: s.id ? s.code : '' })} /></Row>
            <Row label="รหัสยุทธศาสตร์"><input aria-label="รหัสยุทธศาสตร์" readOnly className={`${ctl} bg-gray-bg`} value={code} /></Row>
          </div>
          <Row label="ชื่อยุทธศาสตร์" req error={e.name}>{inp('name', 'ชื่อยุทธศาสตร์')}</Row>
          <Row label="ประเภทแผน"><Radios label="ประเภทแผน" value={s.planType} options={planTypes.map((p) => ({ key: p.key, label: p.label }))} onChange={(v) => set({ planType: v })} /></Row>
          <Row label="วิสัยทัศน์" req error={e.vision}>{inp('vision', 'วิสัยทัศน์')}</Row>
          <Row label="พันธกิจ" req error={e.mission}>{inp('mission', 'พันธกิจ')}</Row>
          <Row label="เป้าประสงค์เชิงยุทธศาสตร์" req error={e.goal}>{inp('goal', 'เป้าประสงค์เชิงยุทธศาสตร์')}</Row>
          <Row label="คำอธิบายยุทธศาสตร์"><textarea aria-label="คำอธิบายยุทธศาสตร์" placeholder="คำอธิบายยุทธศาสตร์" className={ta} value={s.description} onChange={(x) => set({ description: x.target.value })} /></Row>
        </Section>

        <Section title="การเชื่อมโยงแผน">
          {([['nat', 'เชื่อมโยงกับยุทธศาสตร์ชาติ'], ['gov', 'เชื่อมโยงกับนโยบายรัฐบาล / กระทรวง'], ['parent', 'เชื่อมโยงกับยุทธศาสตร์องค์กรแม่'], ['sdg', 'เชื่อมโยงกับ SDGs (ถ้ามี)'], ['kpi', 'เชื่อมโยงกับ KPI ระดับผู้บริหาร']] as const).map(([k, l]) => (
            <Row key={k} label={l}><input aria-label={l} placeholder={l} className={ctl} value={s.links[k]} onChange={(x) => setLink(k, x.target.value)} /></Row>
          ))}
          <Row label="Risk Alignment"><Radios label="Risk Alignment" value={s.align} options={alignments.map((a) => ({ key: a.key, label: a.label }))} onChange={(v) => set({ align: v })} /></Row>
        </Section>

        <p className="rounded-[8px] bg-gray-bg px-[12px] py-[8px] text-[12px] font-light text-gray-30">เมื่อกด “ถัดไป” ระบบบันทึกยุทธศาสตร์ แจ้งเตือนทิศทางการทำแผนไปยังทุกสำนัก แล้วพาไปหน้าจัดทำแผนประจำปี</p>
        <div className="flex justify-end gap-[8px]">
          <Btn kind="ghost" onClick={() => navigate('/strategic')}>ยกเลิก</Btn>
          <Btn onClick={next}>ถัดไป</Btn>
        </div>
      </div>
      {toast}
    </div>
  )
}
