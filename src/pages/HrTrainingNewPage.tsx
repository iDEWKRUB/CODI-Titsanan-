import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useToast } from '../components/leader/Parts'
import Select from '../components/ui/Select'
import { Btn, Crumbs, DropZone, HPersonaSwitch, Row, Title, card, ctl, page, ta } from '../components/hr/Parts'
import { contentTypes, type Track } from '../data/erpHr'
import { ME, trainings } from '../lib/hrStore'

type Item = { course: string; condition: string; detail: string; cert: 'มี' | 'ไม่มี' | ''; note: string; files: string[] }
const blank = (): Item => ({ course: '', condition: '', detail: '', cert: '', note: '', files: [] })
const trackOf = (c: string): Track => (c === 'พัฒนาศักยภาพผู้นำ' || c === 'การบริหารโครงการ' ? 'บริหาร' : 'วิชาการ')

/** เพิ่มรายการอบรม (book 3 fig 2-43) — 2.1.6.14 */
export default function HrTrainingNewPage() {
  const navigate = useNavigate()
  const [toast, show] = useToast()
  const [items, setItems] = useState<Item[]>([blank()])
  const [err, setErr] = useState('')
  const upd = (i: number, p: Partial<Item>) => setItems((s) => s.map((x, j) => (j === i ? { ...x, ...p } : x)))
  const submit = () => {
    const bad = items.findIndex((x) => !x.course.trim() || !x.condition || !x.cert)
    if (bad >= 0) return setErr(`รายการที่ ${bad + 1}: กรุณาระบุชื่อหลักสูตร เงื่อนไขการอบรม และใบประกาศ`)
    const noFile = items.findIndex((x) => x.cert === 'มี' && !x.files.length)
    if (noFile >= 0) return setErr(`รายการที่ ${noFile + 1}: มีใบประกาศ กรุณาแนบไฟล์หลักฐาน`)
    setErr('')
    const y = String(new Date().getFullYear() + 543)
    items.forEach((x) => trainings.save({ id: trainings.next(), empId: ME, course: x.course.trim(), year: y, cert: x.cert as 'มี' | 'ไม่มี', status: 'รอตรวจสอบ', track: trackOf(x.condition), condition: x.condition, detail: x.detail, note: x.note, file: x.files.join(', ') }))
    show(`นำเข้ารายการอบรม ${items.length} รายการ · รอสำนักทรัพยากรบุคคลตรวจสอบ`)
    setTimeout(() => navigate('/hr'), 1200)
  }
  return (
    <div className={`${page} items-center`}>
      <div className="flex w-full max-w-[860px] flex-col gap-[12px]">
        <Title back="/hr" right={<HPersonaSwitch />}>เพิ่มรายการอบรม</Title>
        <Crumbs items={[{ label: 'หน้าแรก', to: '/hr' }, { label: 'ข้อมูลของฉัน', to: '/hr' }, { label: 'เพิ่มรายการอบรม' }]} />
        {items.map((x, i) => (
          <section key={i} aria-label={`รายการอบรมที่ ${i + 1}`} className={`${card} flex flex-col gap-[12px] p-[20px]`}>
            <div className="flex justify-between"><h2 className="text-[15px] font-semibold">{`รายการที่ ${i + 1}`}</h2>{items.length > 1 && <button type="button" onClick={() => setItems((s) => s.filter((_, j) => j !== i))} className="text-[12px] text-[#c13232] hover:underline">ลบรายการ</button>}</div>
            <Row label="ชื่อหลักสูตร" req><input aria-label={`ชื่อหลักสูตร ${i + 1}`} className={ctl} value={x.course} onChange={(e) => upd(i, { course: e.target.value })} /></Row>
            <Row label="เกี่ยวข้องกับเงื่อนไขการอบรม" req><Select label={`เงื่อนไขการอบรม ${i + 1}`} value={x.condition} placeholder="เลือกเงื่อนไข" options={contentTypes.map((c) => ({ value: c, label: c }))} onChange={(c) => upd(i, { condition: c })} /></Row>
            <Row label="รายละเอียดรายการ"><textarea aria-label={`รายละเอียด ${i + 1}`} placeholder="วัตถุประสงค์ เนื้อหาโดยสรุป หน่วยงานผู้จัด" className={ta} value={x.detail} onChange={(e) => upd(i, { detail: e.target.value })} /></Row>
            <Row label="ใบประกาศ" req><Select label={`ใบประกาศ ${i + 1}`} value={x.cert} placeholder="มี / ไม่มี" options={[{ value: 'มี', label: 'มี' }, { value: 'ไม่มี', label: 'ไม่มี' }]} onChange={(c) => upd(i, { cert: c as 'มี' | 'ไม่มี' })} /></Row>
            <Row label="หมายเหตุเพิ่มเติม"><input aria-label={`หมายเหตุ ${i + 1}`} className={ctl} value={x.note} onChange={(e) => upd(i, { note: e.target.value })} /></Row>
            <DropZone files={x.files} onChange={(f) => upd(i, { files: f })} />
          </section>
        ))}
        {err && <p role="alert" className="text-[12px] text-red-00">{err}</p>}
        <div className="flex flex-wrap justify-between gap-[10px]">
          <button type="button" onClick={() => setItems((s) => [...s, blank()])} className="h-[36px] rounded-[8px] border border-blue-00 px-[14px] text-[12px] font-medium text-blue-00 hover:bg-blue-bg">+ เพิ่มรายการ</button>
          <div className="flex gap-[10px]"><Btn kind="ghost" onClick={() => navigate('/hr')}>ยกเลิก</Btn><Btn onClick={submit}>นำเข้าเอกสาร</Btn></div>
        </div>
      </div>
      {toast}
    </div>
  )
}
