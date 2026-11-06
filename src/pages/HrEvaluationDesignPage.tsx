import { useMemo, useState } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { useToast } from '../components/leader/Parts'
import Select from '../components/ui/Select'
import { Btn, Crumbs, Gate, HPersonaSwitch, Pill, Title, page } from '../components/hr/Parts'
import { evalStatus, qKindLabel, type ESection, type Evaluation, type QKind, type Question } from '../data/erpHr'
import { evals, useHPersona } from '../lib/hrStore'

const box = 'rounded-[12px] bg-white p-[16px] shadow-[0_1px_4px_rgba(0,0,0,0.05)]'
const line = 'w-full border-0 border-b border-dashed border-gray-line bg-transparent py-[6px] text-[13px] outline-none focus:border-blue-00'

/** ออกแบบคำถาม (book 3 fig 2-38) — 2.1.6.9 */
export default function HrEvaluationDesignPage() {
  const me = useHPersona()
  const navigate = useNavigate()
  const [sp] = useSearchParams()
  const [toast, show] = useToast()
  const id = Number(sp.get('id')) || 0
  const init = useMemo<Evaluation | undefined>(() => (evals.get(id) ? structuredClone(evals.get(id)!) : undefined), []) // eslint-disable-line react-hooks/exhaustive-deps
  const [v, setV] = useState<Evaluation | undefined>(init)
  const [sec, setSec] = useState(0)
  const [err, setErr] = useState('')
  const allowed = me === 'hr'
  if (!v) return <div className={page}><p className="py-[48px] text-center text-[13px] text-gray-20">ไม่พบแบบประเมิน</p></div>
  const s = v.sections[sec]
  const setS = (patch: Partial<ESection>) => setV({ ...v, sections: v.sections.map((x, i) => (i === sec ? { ...x, ...patch } : x)) })
  const setQ = (qi: number, patch: Partial<Question>) => setS({ questions: s.questions.map((x, i) => (i === qi ? { ...x, ...patch } : x)) })
  const check = () => {
    const bad = v.sections.findIndex((x) => !x.title.trim() || !x.questions.length || x.questions.some((q) => !q.title.trim() || ((q.kind === 'single' || q.kind === 'multi') && q.options.filter((o) => o.trim()).length < 2)))
    if (bad >= 0) { setSec(bad); setErr(`ส่วนที่ ${bad + 1}: ต้องมีชื่อส่วน คำถามอย่างน้อย 1 ข้อ และคำถามแบบตัวเลือกต้องมีอย่างน้อย 2 ตัวเลือก`); return false }
    setErr(''); return true
  }
  const save = (publish: boolean) => {
    if (!allowed) return show('ต้องเป็นเจ้าหน้าที่สำนักทรัพยากรบุคคล')
    if (!check()) return
    const rec = { ...v, status: publish ? ('published' as const) : v.status }
    evals.save(rec); setV(rec)
    show(publish ? 'เผยแพร่แบบประเมินแล้ว' : 'บันทึกความคืบหน้าแล้ว')
    if (publish) setTimeout(() => navigate('/hr/evaluations'), 1000)
  }
  return (
    <div className={`${page} items-center`}>
      <div className="flex w-full max-w-[880px] flex-col gap-[12px]">
        <Title back="/hr/evaluations" right={<HPersonaSwitch />}>สร้างแบบประเมิน</Title>
        <Crumbs items={[{ label: 'หน้าแรก', to: '/hr' }, { label: 'รายการแบบประเมิน', to: '/hr/evaluations' }, { label: 'ออกแบบคำถาม' }]} />
        <Gate allowed={allowed} need="เจ้าหน้าที่สำนักทรัพยากรบุคคล" />
        <div className="flex flex-wrap items-center gap-[8px]"><b className="text-[14px]">{v.name}</b><Pill tone={evalStatus[v.status].tone}>{evalStatus[v.status].label}</Pill></div>
        <fieldset disabled={!allowed} className="flex flex-col gap-[12px] rounded-[14px] bg-[#eef1f5] p-[14px]">
          <p className="text-[13px] font-semibold">{`ส่วนที่ ${sec + 1}`}<span className="ml-[8px] text-[11px] font-light text-gray-20">{`คำถามในส่วนนี้ ${s.questions.length} คำถาม`}</span></p>
          <input aria-label="ชื่อส่วน" value={s.title} onChange={(e) => setS({ title: e.target.value })} className="rounded-[10px] bg-[#6fc0f2] px-[16px] py-[10px] text-[18px] font-semibold text-white outline-none placeholder:text-white/70" placeholder="ชื่อส่วน" />
          <input aria-label="คำชี้แจงส่วนย่อย" value={s.desc} onChange={(e) => setS({ desc: e.target.value })} placeholder="คำชี้แจงส่วนย่อย" className={`${line} px-[4px]`} />
          {s.questions.map((q, qi) => (
            <div key={qi} className={`${box} flex flex-col gap-[10px]`}>
              <div className="flex flex-wrap items-center gap-[8px]">
                <span className="font-urbanist text-[13px] font-semibold">{`${qi + 1}.`}</span>
                <input aria-label={`คำถามที่ ${qi + 1}`} value={q.title} onChange={(e) => setQ(qi, { title: e.target.value })} placeholder="หัวข้อคำถาม" className={`${line} min-w-[220px] flex-1 font-medium`} />
                <div className="w-[160px]"><Select label={`ประเภทคำตอบ ${qi + 1}`} value={q.kind} options={(Object.keys(qKindLabel) as QKind[]).map((k) => ({ value: k, label: qKindLabel[k] }))} onChange={(k) => setQ(qi, { kind: k as QKind, options: (k === 'single' || k === 'multi') && q.options.length < 2 ? ['ตัวเลือก 1', 'ตัวเลือก 2'] : q.options })} /></div>
                <button type="button" aria-label={`ลบคำถาม ${qi + 1}`} onClick={() => setS({ questions: s.questions.filter((_, i) => i !== qi) })} className="text-[11px] text-[#c13232] hover:underline">ลบ</button>
              </div>
              {q.kind === 'text' && <p className={`${line} text-gray-20`}>พิมพ์คำตอบ...</p>}
              {q.kind === 'number' && <div className="flex items-center gap-[10px]"><p className={`${line} max-w-[280px] text-gray-20`}>พิมพ์คำตอบ...</p><input aria-label={`หน่วย ${qi + 1}`} value={q.unit ?? ''} onChange={(e) => setQ(qi, { unit: e.target.value })} placeholder="หน่วย" className={`${line} w-[90px]`} /></div>}
              {(q.kind === 'single' || q.kind === 'multi') && (
                <div className="flex flex-col gap-[6px]">
                  {q.options.map((o, oi) => (
                    <div key={oi} className="flex items-center gap-[10px]">
                      <span className={`size-[16px] shrink-0 border-2 border-gray-10 ${q.kind === 'single' ? 'rounded-full' : 'rounded-[4px]'}`} />
                      <input aria-label={`ตัวเลือก ${qi + 1}.${oi + 1}`} value={o} onChange={(e) => setQ(qi, { options: q.options.map((x, i) => (i === oi ? e.target.value : x)) })} className={`${line} flex-1`} />
                      <button type="button" aria-label={`ลบตัวเลือก ${qi + 1}.${oi + 1}`} onClick={() => setQ(qi, { options: q.options.filter((_, i) => i !== oi) })} className="text-gray-20 hover:text-[#c13232]">×</button>
                    </div>
                  ))}
                  <button type="button" onClick={() => setQ(qi, { options: [...q.options, `ตัวเลือก ${q.options.length + 1}`] })} className="w-fit text-[12px] font-medium text-blue-00 hover:underline">+ เพิ่มตัวเลือก</button>
                </div>
              )}
            </div>
          ))}
        </fieldset>
        {err && <p role="alert" className="text-[12px] text-red-00">{err}</p>}
        <div className="flex flex-wrap gap-[8px]">
          <button type="button" disabled={!allowed} onClick={() => setS({ questions: [...s.questions, { title: '', kind: 'single', options: ['ตัวเลือก 1', 'ตัวเลือก 2'] }] })} className="h-[34px] rounded-[8px] bg-blue-bg px-[14px] text-[12px] font-medium text-blue-00 hover:bg-blue-20 disabled:opacity-40">+ เพิ่มกล่องแบบฟอร์ม</button>
          <button type="button" disabled={!allowed} onClick={() => { setV({ ...v, sections: [...v.sections, { title: `ส่วนที่ ${v.sections.length + 1}`, desc: '', questions: [] }] }); setSec(v.sections.length) }} className="h-[34px] rounded-[8px] border border-blue-00 px-[14px] text-[12px] font-medium text-blue-00 hover:bg-blue-bg disabled:opacity-40">+ เพิ่มส่วน</button>
        </div>
        <div className="flex flex-wrap items-center gap-[10px]">
          <div className="w-[200px]"><Select label="คำถามหน้าที่" value={String(sec)} options={v.sections.map((_, i) => ({ value: String(i), label: `คำถามหน้าที่ ${i + 1}` }))} onChange={(k) => setSec(Number(k))} /></div>
          <button type="button" disabled={sec >= v.sections.length - 1} onClick={() => setSec(sec + 1)} className="h-[38px] rounded-[8px] bg-blue-bg px-[14px] text-[12px] font-medium text-blue-00 disabled:opacity-40">ถัดไป →</button>
          <button type="button" disabled={!allowed} onClick={() => save(false)} className="ml-auto h-[38px] rounded-[8px] border border-gray-line bg-white px-[14px] text-[12px] hover:border-blue-00 disabled:opacity-40">บันทึกคำตอบ</button>
        </div>
        <div className="flex justify-end gap-[10px]"><Btn kind="ghost" onClick={() => navigate('/hr/evaluations')}>ยกเลิก</Btn><Btn onClick={() => save(true)}>ต่อไป · เผยแพร่</Btn></div>
      </div>
      {toast}
    </div>
  )
}
