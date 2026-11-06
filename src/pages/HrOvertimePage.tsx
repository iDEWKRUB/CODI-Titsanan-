import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useToast } from '../components/leader/Parts'
import Modal from '../components/ui/Modal'
import { Btn, Crumbs, EmpInfo, Gate, HPersonaSwitch, Radios, Row, Section, Title, ctl, page, ro, ta } from '../components/hr/Parts'
import { OT_HOURS, mealOf, money, signers, thDate, type OtDay, type OtReport } from '../data/erpHr'
import { submitReq, useHPersona } from '../lib/hrStore'

const iso = (d: Date) => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
/** sample of the time-attendance system: last working days with a late check-out */
const fromTimesheet = (): OtDay[] => {
  const out: OtDay[] = []
  const d = new Date()
  while (out.length < 3) {
    d.setDate(d.getDate() - 1)
    if (d.getDay() % 6 === 0) continue
    out.unshift({ date: iso(d), slots: out.length === 1 ? [16, 17, 18] : [17, 18] })
  }
  return out
}
const blankReport = (date: string, slots: number[]): OtReport => ({ date, start: slots.length ? `${String(Math.min(...slots)).padStart(2, '0')}:00` : '17:00', end: slots.length ? `${String(Math.max(...slots) + 1).padStart(2, '0')}:00` : '19:00', allDay: false, detail: '', hasNote: false, note: '' })

/** เบิกค่าอาหารทำการนอกเวลา (book 3 fig 2-30) — 2.1.6.2, with the pop-up "แบบฟอร์มรายงานผลงานปฏิบัติงาน" (fig 2-31) — 2.1.6.3 */
export default function HrOvertimePage() {
  const me = useHPersona()
  const navigate = useNavigate()
  const [toast, show] = useToast()
  const [days, setDays] = useState<OtDay[]>([{ date: iso(new Date()), slots: [] }])
  const [reports, setReports] = useState<Record<string, OtReport>>({})
  const [editing, setEditing] = useState<OtReport>()
  const [rErr, setRErr] = useState('')
  const [drag, setDrag] = useState<{ row: number; on: boolean }>()
  const [err, setErr] = useState('')
  const allowed = me === 'staff'
  const hours = days.reduce((a, d) => a + d.slots.length, 0)
  const meal = days.reduce((a, d) => a + mealOf(d.slots.length), 0)

  const toggle = (row: number, h: number, on?: boolean) => setDays((ds) => ds.map((d, i) => (i !== row ? d : { ...d, slots: (on ?? !d.slots.includes(h)) ? [...new Set([...d.slots, h])].sort((a, b) => a - b) : d.slots.filter((x) => x !== h) })))
  const addDay = () => setDays((ds) => { const last = ds[ds.length - 1]; const n = new Date(last.date + 'T00:00:00'); n.setDate(n.getDate() + 1); return [...ds, { date: iso(n), slots: [] }] })
  const saveReport = () => {
    if (!editing) return
    if (!editing.detail.trim()) return setRErr('กรุณาระบุรายละเอียดการปฏิบัติงาน')
    if (!editing.allDay && editing.end <= editing.start) return setRErr('เวลาสิ้นสุดต้องหลังเวลาเริ่มต้น')
    if (editing.hasNote && !editing.note.trim()) return setRErr('กรุณาระบุหมายเหตุ')
    setReports((r) => ({ ...r, [editing.date]: editing }))
    setEditing(undefined)
    show('บันทึกรายงานผลงานปฏิบัติงานแล้ว')
  }
  const submit = () => {
    if (!allowed) return show('ต้องเป็นเจ้าหน้าที่ พอช.')
    const used = days.filter((d) => d.slots.length)
    if (!used.length) return setErr('กรุณาเลือกช่วงเวลาที่ทำงานนอกเวลาอย่างน้อย 1 วัน')
    if (new Set(days.map((d) => d.date)).size !== days.length) return setErr('มีวันที่ซ้ำกัน')
    const miss = used.find((d) => !reports[d.date])
    if (miss) return setErr(`กรุณากรอกรายงานผลงานปฏิบัติงานของวันที่ ${thDate(miss.date)}`)
    setErr('')
    const r = submitReq({ kind: 'ot', otDays: used, otReports: used.map((d) => reports[d.date]), signer: signers[0] })
    show(`ยื่นเบิก ${r.no} · ${hours} ชั่วโมง · ค่าอาหาร ${money(meal)} บาท`)
    setTimeout(() => navigate('/hr'), 1300)
  }

  return (
    <div className={`${page} items-center`} onMouseUp={() => setDrag(undefined)}>
      <div className="flex w-full max-w-[980px] flex-col gap-[12px]">
        <Title back="/hr" right={<HPersonaSwitch />}>เบิกค่าอาหารทำการนอกเวลา</Title>
        <Crumbs items={[{ label: 'หน้าแรก', to: '/hr' }, { label: 'เบิกค่าอาหารทำการนอกเวลา' }]} />
        <Gate allowed={allowed} need="เจ้าหน้าที่ พอช." />
        <EmpInfo title="เบิกค่าอาหารทำการนอกเวลา" action={<button type="button" disabled={!allowed} onClick={() => { setDays(fromTimesheet()); show('ดึงข้อมูลจากตารางเข้า-ออกงานแล้ว 3 วัน') }} className="h-[32px] rounded-[8px] bg-blue-00 px-[12px] text-[12px] font-medium text-white hover:brightness-110 disabled:opacity-40">ดึงข้อมูลจากตาราง เข้า-ออกงาน</button>}>
          <div className="flex flex-col gap-[8px]">
            <h3 className="text-[14px] font-semibold">วันที่ประสงค์</h3>
            <p className="text-[11px] font-light text-gray-20">คลิกหรือลากบนช่องเวลาเพื่อเลือกชั่วโมงที่ทำงานนอกเวลา · ค่าอาหาร 50 บาท เมื่อครบ 2 ชั่วโมง และ 100 บาท เมื่อครบ 4 ชั่วโมงต่อวัน</p>
            <div className="overflow-x-auto rounded-[10px] border border-gray-line-2">
              <table className="w-full min-w-[860px] border-collapse text-[11px] select-none">
                <thead className="bg-gray-bg text-gray-20"><tr><th className="w-[170px] px-[8px] py-[6px] text-left font-light">วันที่</th>{OT_HOURS.map((h) => <th key={h} className="font-urbanist font-light">{`${h}:00`}</th>)}<th className="w-[110px] font-light">รายงานผล</th></tr></thead>
                <tbody>
                  {days.map((d, row) => (
                    <tr key={row} className="border-t border-gray-line-2">
                      <td className="px-[8px] py-[6px]">
                        <input type="date" aria-label={`วันที่ แถว ${row + 1}`} disabled={!allowed} value={d.date} onChange={(e) => setDays((ds) => ds.map((x, i) => (i === row ? { ...x, date: e.target.value } : x)))} className="w-full bg-transparent font-urbanist text-[12px] font-medium text-blue-00 outline-none" />
                        <span className="text-[10px] font-light text-gray-20">{`เวลารวม ${d.slots.length} ชั่วโมง`}</span>
                      </td>
                      {OT_HOURS.map((h) => {
                        const on = d.slots.includes(h)
                        return <td key={h} className="border-l border-gray-line-2 p-0"><button type="button" aria-label={`${thDate(d.date)} ${h}:00-${h + 1}:00`} aria-pressed={on} disabled={!allowed} onMouseDown={() => { setDrag({ row, on: !on }); toggle(row, h) }} onMouseEnter={() => drag && drag.row === row && toggle(row, h, drag.on)} className={`block h-[38px] w-full ${on ? 'bg-[#bfe3ff]' : 'hover:bg-blue-bg'}`} /></td>
                      })}
                      <td className="border-l border-gray-line-2 px-[6px] text-center">
                        <button type="button" disabled={!allowed || !d.slots.length} onClick={() => { setRErr(''); setEditing(reports[d.date] ?? blankReport(d.date, d.slots)) }} className={`rounded-[6px] px-[8px] py-[4px] text-[10px] font-medium disabled:opacity-30 ${reports[d.date] ? 'bg-[#dff5e8] text-[#0f8a63]' : 'bg-[#fff1d6] text-[#a8650b]'}`}>{reports[d.date] ? 'กรอกแล้ว' : 'กรอกรายงาน'}</button>
                        {days.length > 1 && <button type="button" aria-label={`ลบแถว ${row + 1}`} onClick={() => setDays((ds) => ds.filter((_, i) => i !== row))} className="ml-[4px] text-gray-20 hover:text-[#c13232]">×</button>}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <div className="flex flex-wrap items-center gap-[12px]">
              <button type="button" disabled={!allowed} onClick={addDay} className="h-[34px] rounded-[8px] bg-blue-00 px-[14px] text-[12px] font-medium text-white disabled:opacity-40">เพิ่มวันที่</button>
              <span className="ml-auto text-[12px]">{'รวม '}<b className="font-urbanist">{hours}</b>{' ชั่วโมง · ค่าอาหาร '}<b className="font-urbanist" aria-label="ค่าอาหารรวม">{money(meal)}</b>{' บาท'}</span>
            </div>
            {err && <span role="alert" className="text-[12px] text-red-00">{err}</span>}
          </div>
        </EmpInfo>
        <Section title="ผู้รับรอง"><Row label="ผู้ลงนามรับรอง"><input aria-label="ผู้ลงนามรับรอง" readOnly className={ro} value={signers[0].split(' · ')[0]} /></Row></Section>
        <div className="flex justify-end gap-[10px]"><Btn kind="ghost" onClick={() => navigate('/hr')}>ยกเลิก</Btn><Btn onClick={submit}>ยื่นเบิก</Btn></div>
      </div>

      <Modal open={!!editing} onClose={() => setEditing(undefined)} title="แบบฟอร์มรายงานผลงานปฏิบัติงาน" width="max-w-[560px]">
        {editing && (
          <div className="flex flex-col gap-[12px]">
            <Row label="วันที่ปฏิบัติงาน"><input type="date" aria-label="วันที่ปฏิบัติงาน" readOnly className={ro} value={editing.date} /></Row>
            <Row label="เวลา">
              <div className="flex items-center gap-[8px] max-sm:flex-wrap">
                <input type="time" aria-label="เวลาเริ่มต้น" disabled={editing.allDay} className={ctl} value={editing.start} onChange={(e) => setEditing({ ...editing, start: e.target.value })} />
                <span className="text-[12px] text-gray-20">ถึง</span>
                <input type="time" aria-label="เวลาสิ้นสุด" disabled={editing.allDay} className={ctl} value={editing.end} onChange={(e) => setEditing({ ...editing, end: e.target.value })} />
                <label className="flex shrink-0 items-center gap-[6px] text-[12px]"><button type="button" role="switch" aria-checked={editing.allDay} aria-label="ทั้งวัน" onClick={() => setEditing({ ...editing, allDay: !editing.allDay })} className={`relative h-[22px] w-[40px] rounded-full transition ${editing.allDay ? 'bg-blue-00' : 'bg-gray-line'}`}><span className={`absolute top-[3px] size-[16px] rounded-full bg-white transition-all ${editing.allDay ? 'left-[21px]' : 'left-[3px]'}`} /></button>ทั้งวัน</label>
              </div>
            </Row>
            <Row label="รายละเอียดการปฏิบัติงาน" req><textarea aria-label="รายละเอียดการปฏิบัติงาน" placeholder="งานที่ปฏิบัตินอกเวลา" className={ta} value={editing.detail} onChange={(e) => setEditing({ ...editing, detail: e.target.value })} /></Row>
            <Row label="หมายเหตุ"><Radios label="มีหมายเหตุหรือไม่" value={editing.hasNote ? 'y' : 'n'} options={[{ key: 'n', label: 'ไม่มี' }, { key: 'y', label: 'มี' }]} onChange={(k) => setEditing({ ...editing, hasNote: k === 'y' })} /></Row>
            {editing.hasNote && <Row label="ระบุหมายเหตุ"><input aria-label="ระบุหมายเหตุ" className={ctl} value={editing.note} onChange={(e) => setEditing({ ...editing, note: e.target.value })} /></Row>}
            {rErr && <p role="alert" className="text-[12px] text-red-00">{rErr}</p>}
            <div className="flex justify-end gap-[8px]"><Btn kind="ghost" onClick={() => setEditing(undefined)}>ยกเลิก</Btn><Btn onClick={saveReport}>ยืนยัน</Btn></div>
          </div>
        )}
      </Modal>
      {toast}
    </div>
  )
}
