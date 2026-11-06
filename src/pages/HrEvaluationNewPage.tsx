import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useToast } from '../components/leader/Parts'
import Modal from '../components/ui/Modal'
import Select from '../components/ui/Select'
import { Btn, Crumbs, Gate, HPersonaSwitch, Row, Section, Title, ctl, err, page } from '../components/hr/Parts'
import { qKindLabel, templates, type Template } from '../data/erpHr'
import { evals, useHPersona } from '../lib/hrStore'

const PER = 3

/** สร้างแบบประเมิน (book 3 fig 2-37) — 2.1.6.8 : pick a template + conditions, then design the questions (2.1.6.9) */
export default function HrEvaluationNewPage() {
  const me = useHPersona()
  const navigate = useNavigate()
  const [toast, show] = useToast()
  const [q, setQ] = useState('')
  const [pg, setPg] = useState(0)
  const [pick, setPick] = useState<Template>(templates[0])
  const [prev, setPrev] = useState<Template>()
  const [name, setName] = useState('')
  const [fy, setFy] = useState('2569')
  const [publish, setPublish] = useState('')
  const [end, setEnd] = useState('')
  const [errors, setErrors] = useState<Record<string, string>>({})
  const allowed = me === 'hr'
  const list = templates.filter((t) => !q.trim() || t.name.includes(q.trim()))
  const pages = Math.max(1, Math.ceil(list.length / PER))
  const shown = list.slice(Math.min(pg, pages - 1) * PER, Math.min(pg, pages - 1) * PER + PER)
  const save = () => {
    if (!allowed) return show('ต้องเป็นเจ้าหน้าที่สำนักทรัพยากรบุคคล')
    const e: Record<string, string> = {}
    if (!publish) e.publish = 'กรุณาระบุวันที่เผยแพร่'
    if (!end) e.end = 'กรุณาระบุวันที่สิ้นสุด'
    else if (publish && end < publish) e.end = 'วันที่สิ้นสุดต้องไม่ก่อนวันที่เผยแพร่'
    setErrors(e)
    if (Object.keys(e).length) return show('กรุณาตรวจสอบเงื่อนไข')
    const id = evals.next()
    evals.save({ id, name: name.trim() || `${pick.name} ปีงบประมาณ ${fy}`, fy, type: pick.type, status: 'draft', publish, end, responses: 0, sections: structuredClone(pick.sections) })
    show('บันทึกแล้ว · ไปออกแบบคำถาม')
    setTimeout(() => navigate(`/hr/evaluations/design?id=${id}`), 800)
  }
  return (
    <div className={`${page} items-center`}>
      <div className="flex w-full max-w-[900px] flex-col gap-[12px]">
        <Title back="/hr/evaluations" right={<HPersonaSwitch />}>สร้างแบบประเมิน</Title>
        <Crumbs items={[{ label: 'หน้าแรก', to: '/hr' }, { label: 'รายการแบบประเมิน', to: '/hr/evaluations' }, { label: 'สร้างแบบประเมิน' }]} />
        <Gate allowed={allowed} need="เจ้าหน้าที่สำนักทรัพยากรบุคคล" />
        <Section title="เลือกรูปแบบแบบประเมิน">
          <input aria-label="ค้นหารูปแบบ" placeholder="ค้นหารูปแบบจากชื่อหรือคำสำคัญ" className={ctl} value={q} onChange={(e) => { setQ(e.target.value); setPg(0) }} />
          <div role="radiogroup" aria-label="รูปแบบแบบประเมิน" className="grid grid-cols-3 gap-[12px] max-md:grid-cols-1">
            {shown.map((t) => (
              <div key={t.id} role="radio" aria-checked={pick.id === t.id} tabIndex={0} onKeyDown={(e) => e.key === 'Enter' && setPick(t)} onClick={() => setPick(t)} className={`flex min-h-[150px] cursor-pointer flex-col gap-[8px] rounded-[14px] border p-[16px] transition ${pick.id === t.id ? 'border-blue-00 bg-blue-bg shadow-md' : 'border-gray-line-2 bg-white hover:border-blue-00'}`}>
                <span className="flex items-center gap-[8px]"><span className={`size-[14px] rounded-full border-2 ${pick.id === t.id ? 'border-blue-00 bg-blue-00' : 'border-gray-10'}`} />{t.recommended && <span className="rounded-full bg-[#dff5e8] px-[8px] py-[1px] text-[10px] font-medium text-[#0f8a63]">แนะนำ</span>}</span>
                <b className="text-[14px] font-semibold">{t.name}</b>
                <span className="text-[11px] font-light text-gray-20">{`${t.type} · ${t.sections.length} ส่วน · ${t.sections.reduce((a, s) => a + s.questions.length, 0)} คำถาม`}</span>
                <button type="button" onClick={(e) => { e.stopPropagation(); setPrev(t) }} className="mt-auto w-fit text-[12px] font-medium text-blue-00 hover:underline">ดูตัวอย่าง</button>
              </div>
            ))}
            {!shown.length && <p className="col-span-full py-[24px] text-center text-[13px] text-gray-20">ไม่พบรูปแบบ</p>}
          </div>
          <div className="flex items-center justify-center gap-[6px]" aria-label="เลื่อนรูปแบบ">
            {Array.from({ length: pages }, (_, i) => <button key={i} type="button" aria-label={`หน้ารูปแบบ ${i + 1}`} aria-current={i === pg} onClick={() => setPg(i)} className={`h-[6px] rounded-full transition-all ${i === pg ? 'w-[28px] bg-blue-00' : 'w-[10px] bg-gray-line'}`} />)}
          </div>
        </Section>
        <Section title="กำหนดเงื่อนไข">
          <Row label="ชื่อแบบประเมิน"><input aria-label="ชื่อแบบประเมิน" placeholder={`${pick.name} ปีงบประมาณ ${fy}`} className={ctl} value={name} onChange={(e) => setName(e.target.value)} /></Row>
          <Row label="ปีงบประมาณ" req><Select label="ปีงบประมาณ" value={fy} options={['2569', '2568', '2570'].map((v) => ({ value: v, label: v }))} onChange={setFy} /></Row>
          <div className="grid grid-cols-2 gap-[12px] max-sm:grid-cols-1">
            <Row label="วันที่เผยแพร่" req error={errors.publish}><input type="date" aria-label="วันที่เผยแพร่" className={`${ctl} ${errors.publish ? err : ''}`} value={publish} onChange={(e) => setPublish(e.target.value)} /></Row>
            <Row label="วันที่สิ้นสุด" req error={errors.end}><input type="date" aria-label="วันที่สิ้นสุด" className={`${ctl} ${errors.end ? err : ''}`} value={end} onChange={(e) => setEnd(e.target.value)} /></Row>
          </div>
        </Section>
        <div className="flex justify-end gap-[10px]"><Btn kind="ghost" onClick={() => navigate('/hr/evaluations')}>ยกเลิก</Btn><Btn onClick={save}>บันทึก</Btn></div>
      </div>
      <Modal open={!!prev} onClose={() => setPrev(undefined)} title={`ตัวอย่าง · ${prev?.name ?? ''}`} width="max-w-[560px]">
        {prev?.sections.map((s, i) => (
          <div key={i} className="flex flex-col gap-[6px]">
            <p className="rounded-[8px] bg-[#6fc0f2] px-[12px] py-[8px] text-[13px] font-semibold text-white">{`ส่วนที่ ${i + 1} · ${s.title}`}</p>
            {s.questions.map((x, j) => <p key={j} className="text-[12px]">{`${j + 1}. ${x.title}`}<span className="ml-[6px] text-[10px] text-gray-20">{`(${qKindLabel[x.kind]}${x.options.length ? `: ${x.options.join(' / ')}` : ''})`}</span></p>)}
          </div>
        ))}
      </Modal>
      {toast}
    </div>
  )
}
