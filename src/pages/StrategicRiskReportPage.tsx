import { useMemo, useState } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { useToast } from '../components/leader/Parts'
import Select from '../components/ui/Select'
import { Btn, Crumbs, PersonaSwitch, Radios, Row, Section, Title, ctl, err, page, ta } from '../components/strategic/Parts'
import { levelLabel, levelOf, levelTone, quarters, riskStatuses, type RiskReport } from '../data/strategic'
import { submitReport, usePersona, useReports, useRisks } from '../lib/strategicStore'
import { personas } from '../data/strategic'

/** รายงานความเสี่ยง (book 3 fig 2-11) — 2.1.2.6 ; flow: book 1 §2.2.1.3 / §2.2.1.4 */
export default function StrategicRiskReportPage() {
  const risks = useRisks()
  const reports = useReports()
  const me = usePersona()
  const [sp] = useSearchParams()
  const navigate = useNavigate()
  const [toast, show] = useToast()
  const open = useMemo(() => risks.filter((r) => r.status === 'open'), [risks])
  const [riskId, setRiskId] = useState<number>(Number(sp.get('risk')) || 0)
  const risk = risks.find((r) => r.id === riskId)
  const [f, setF] = useState({ quarter: quarters[0], progress: '', detail: '', problems: '', support: '', evidence: '', state: riskStatuses[0], residual: '' })
  const [tried, setTried] = useState(false)
  const set = (p: Partial<typeof f>) => setF((x) => ({ ...x, ...p }))
  const prevReports = reports.filter((x) => x.riskId === riskId && x.submitted)

  const errors: Record<string, string> = {}
  if (!risk) errors.risk = 'กรุณาเลือกความเสี่ยงที่จะรายงาน'
  const pr = Number(f.progress)
  if (f.progress === '' || Number.isNaN(pr) || pr < 0 || pr > 100) errors.progress = 'ระบุ % ความคืบหน้า 0–100'
  if (!f.detail.trim()) errors.detail = 'กรุณาระบุรายละเอียดความคืบหน้าล่าสุด'
  const rs = f.residual === '' ? NaN : Number(f.residual)
  if (f.residual !== '' && (Number.isNaN(rs) || rs < 1 || rs > 25)) errors.residual = 'Residual Risk ต้องอยู่ระหว่าง 1–25'
  if (prevReports.some((x) => x.quarter === f.quarter)) errors.quarter = `ความเสี่ยงนี้ได้ยื่นรายงาน${f.quarter}แล้ว`
  const e = tried ? errors : {}

  const body = (submitted: boolean): Omit<RiskReport, 'id' | 'at'> => ({ riskId, quarter: f.quarter, progress: f.progress, detail: f.detail, problems: f.problems, support: f.support, evidence: f.evidence, state: f.state, residual: f.residual, submitted, by: personas[me].name })
  const draft = () => {
    if (!risk) return show('กรุณาเลือกความเสี่ยงก่อน')
    submitReport(body(false))
    show('บันทึกร่างรายงานแล้ว')
  }
  const send = () => {
    setTried(true)
    if (Object.keys(errors).length) return show('กรุณากรอกข้อมูลที่จำเป็นให้ครบและถูกต้อง')
    submitReport(body(true))
    const level = f.residual ? rs : risk ? levelOf(risk) : 0
    const msg = f.state === 'ปิดความเสี่ยงแล้ว' ? 'ปิดความเสี่ยงแล้ว ส่งข้อมูลกลับสำนักเจ้าของเรื่อง' : level >= 15 || f.state === 'ยังควบคุมไม่ได้' ? 'ความเสี่ยงยังสูง ระบบแจ้งเตือนสำนักยุทธศาสตร์ฯ และทบไปรอบถัดไป' : 'ยื่นรายงานแล้ว'
    show(`${msg}`)
    setTimeout(() => navigate('/strategic'), 1100)
  }

  return (
    <div className={`${page} items-center`}>
      <div className="flex w-full max-w-[860px] flex-col gap-[12px]">
        <Title back="/strategic" right={<PersonaSwitch />}>รายงานความเสี่ยง</Title>
        <Crumbs items={[{ label: 'หน้าแรก', to: '/strategic' }, { label: 'ความเสี่ยง' }, { label: 'รายงานความเสี่ยง' }]} />

        <Section title="ข้อมูลความเสี่ยง">
          <Row label="เลือกความเสี่ยง" req error={e.risk}>
            <Select label="เลือกความเสี่ยงที่จะรายงาน" value={risk ? String(risk.id) : ''} placeholder="เลือกความเสี่ยงที่จะรายงาน" options={open.map((r) => ({ value: String(r.id), label: `${r.code} · ${r.name}` }))} onChange={(v) => { setRiskId(Number(v)); setTried(false) }} />
          </Row>
          <Row label="รหัสความเสี่ยง"><input aria-label="รหัสความเสี่ยง" readOnly className={`${ctl} bg-gray-bg text-gray-30`} value={risk?.code ?? ''} placeholder="R-32432" /></Row>
          <Row label="ชื่อความเสี่ยง"><input aria-label="ชื่อความเสี่ยง" readOnly className={`${ctl} bg-gray-bg`} value={risk?.name ?? ''} placeholder="ชื่อความเสี่ยง" /></Row>
          <Row label="ประเภทความเสี่ยง"><Radios label="ประเภทความเสี่ยง" value={risk?.type ?? ''} options={['กลยุทธ์', 'การปฏิบัติงาน', 'การเงิน', 'เทคโนโลยีสารสนเทศ', 'กฎหมาย/ข้อบังคับ'].map((t) => ({ key: t, label: t }))} onChange={() => undefined} disabled /></Row>
          <Row label="หน่วยงานเจ้าของความเสี่ยง"><input aria-label="หน่วยงานเจ้าของความเสี่ยง" readOnly className={`${ctl} bg-gray-bg`} value={risk?.owner ?? ''} placeholder="หน่วยงานเจ้าของความเสี่ยง" /></Row>
          <div className="grid grid-cols-2 gap-[14px] max-sm:grid-cols-1">
            <Row label="ความเสี่ยงตั้งต้น"><div className="flex h-[40px] items-center">{risk ? <span className={`rounded-[6px] px-[10px] py-[3px] font-urbanist text-[13px] ${levelTone(levelOf(risk))}`}>{levelOf(risk)} · {levelLabel(levelOf(risk))}</span> : <span className="text-[12px] text-gray-20">-</span>}</div></Row>
            <Row label="Residual Risk (รอบล่าสุดก่อนหน้า)"><input aria-label="Residual Risk รอบก่อน" readOnly className={`${ctl} bg-gray-bg`} value={risk ? String(risk.residual) : ''} placeholder="-" /></Row>
          </div>
          <Row label="แผนจัดการความเสี่ยงที่กำหนดไว้"><textarea aria-label="แผนจัดการความเสี่ยง" readOnly className={`${ta} bg-gray-bg`} value={risk ? `${risk.description}\nมาตรการ: ${risk.causes.gap}` : ''} placeholder="แผนจัดการความเสี่ยงที่กำหนดไว้" /></Row>
          <Row label="เลือกไตรมาสที่ต้องการรายงาน" error={e.quarter}><Radios label="ไตรมาส" value={f.quarter} options={quarters.map((q) => ({ key: q, label: q }))} onChange={(v) => set({ quarter: v })} /></Row>
        </Section>

        <Section title="รายงานสถานะการดำเนินงาน">
          <Row label="% ความคืบหน้า" error={e.progress}><input aria-label="% ความคืบหน้า" inputMode="numeric" placeholder="% ความคืบหน้า" className={`${ctl} ${e.progress ? err : ''}`} value={f.progress} onChange={(x) => set({ progress: x.target.value.replace(/[^\d.]/g, '') })} /></Row>
          <Row label="รายละเอียดความคืบหน้าล่าสุด" error={e.detail}><textarea aria-label="รายละเอียดความคืบหน้าล่าสุด" placeholder="รายละเอียดความคืบหน้าล่าสุด" className={`${ta} min-h-[110px] ${e.detail ? err : ''}`} value={f.detail} onChange={(x) => set({ detail: x.target.value })} /></Row>
          <Row label="ปัญหา/อุปสรรค"><textarea aria-label="ปัญหา/อุปสรรค" placeholder="ปัญหา/อุปสรรค" className={`${ta} min-h-[110px]`} value={f.problems} onChange={(x) => set({ problems: x.target.value })} /></Row>
          <Row label="การสนับสนุนที่ต้องการเพิ่มเติม"><input aria-label="การสนับสนุนที่ต้องการเพิ่มเติม" placeholder="การสนับสนุนที่ต้องการเพิ่มเติม" className={ctl} value={f.support} onChange={(x) => set({ support: x.target.value })} /></Row>
          <Row label="หลักฐานประกอบ (ไฟล์ / รูปภาพ / ลิงก์)">
            <div className="flex items-center gap-[8px]">
              <input aria-label="หลักฐานประกอบ" placeholder="หลักฐานประกอบ (ไฟล์ / รูปภาพ / ลิงก์)" className={ctl} value={f.evidence} onChange={(x) => set({ evidence: x.target.value })} />
              <label className="flex h-[40px] shrink-0 cursor-pointer items-center rounded-[8px] bg-blue-bg px-[12px] text-[12px] font-medium text-blue-00 hover:bg-blue-20" aria-label="แนบไฟล์">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                  <path d="m21 11.5-8.6 8.6a5 5 0 0 1-7.1-7.1l8.6-8.6a3.3 3.3 0 0 1 4.7 4.7l-8.6 8.6a1.7 1.7 0 0 1-2.4-2.4l7.9-7.9" />
                </svg>
                <input type="file" className="sr-only" onChange={(x) => x.target.files?.[0] && set({ evidence: x.target.files[0].name })} />
              </label>
            </div>
          </Row>
          <Row label="Residual Risk รอบนี้ (1–25)" error={e.residual} hint="ระดับความเสี่ยงคงเหลือหลังดำเนินมาตรการ — ใช้ปรับตำแหน่งบน Risk Matrix"><input aria-label="Residual Risk รอบนี้" inputMode="numeric" placeholder="เช่น 8" className={`${ctl} max-w-[200px] ${e.residual ? err : ''}`} value={f.residual} onChange={(x) => set({ residual: x.target.value.replace(/\D/g, '') })} /></Row>
          <Row label="สถานะ"><Radios label="สถานะความเสี่ยง" value={f.state} options={riskStatuses.map((s) => ({ key: s, label: s }))} onChange={(v) => set({ state: v })} /></Row>
        </Section>

        <div className="flex justify-end gap-[8px]">
          <Btn kind="ghost" onClick={() => navigate('/strategic')}>ยกเลิก</Btn>
          <Btn kind="outline" onClick={draft}>บันทึกร่าง</Btn>
          <Btn onClick={send}>ยื่นรายงาน</Btn>
        </div>
      </div>
      {toast}
    </div>
  )
}
