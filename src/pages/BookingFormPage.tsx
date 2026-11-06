import { useMemo, useState } from 'react'
import { Link, useLocation, useNavigate, useSearchParams } from 'react-router-dom'
import { BI, BPersonaSwitch, Btn, Crumbs, Ic, Row, Section, Title, ctl, err, page, ta } from '../components/booking/Parts'
import { busyHours, daysBetween, DAY_END, DAY_START, addDays, borrowTypes, borrowedQty, dayMap, hh, hourOf, hours, kindMeta, nextBookingNo, resOf, resources, roomExtras, stamp, vehicleExtras, type BKind, type Booking } from '../data/erpBooking'
import Modal from '../components/ui/Modal'
import { bWho, bookings, useBookings } from '../lib/bookingStore'

const pathKind = (p: string): BKind => (p.endsWith('/zoom') ? 'zoom' : p.endsWith('/vehicle') ? 'vehicle' : p.endsWith('/borrow') ? 'borrow' : 'room')
const timeOpts = Array.from({ length: DAY_END - DAY_START + 1 }, (_, i) => hh(DAY_START + i))

function Stepper({ label, value, min = 1, max = 999, onChange }: { label: string; value: number; min?: number; max?: number; onChange: (n: number) => void }) {
  const b = 'flex size-[40px] items-center justify-center rounded-[8px] border border-gray-line text-[18px] text-blue-00 hover:bg-blue-bg disabled:opacity-30'
  return (
    <div className="flex items-center gap-[6px]" role="group" aria-label={label}>
      <button type="button" aria-label={`ลด${label}`} disabled={value <= min} onClick={() => onChange(value - 1)} className={b}>–</button>
      <input inputMode="numeric" aria-label={label} value={value} onChange={(e) => onChange(Math.min(max, Math.max(min, Number(e.target.value.replace(/\D/g, '')) || min)))} className={`${ctl} w-[84px] text-center font-urbanist`} />
      <button type="button" aria-label={`เพิ่ม${label}`} disabled={value >= max} onClick={() => onChange(value + 1)} className={b}>+</button>
    </div>
  )
}

/** จองห้องประชุม / Zoom / ยานพาหนะ / ยืมพัสดุ-ครุภัณฑ์ — 2.1.10.2 – 2.1.10.5 (fig 2-59 – 2-62), one form with a shared "select period" grid */
export default function BookingFormPage() {
  const kind = pathKind(useLocation().pathname)
  const meta = kindMeta[kind]
  const all = useBookings()
  const navigate = useNavigate()
  const [sp] = useSearchParams()
  const editId = Number(sp.get('edit')) || 0
  const src = all.find((b) => b.id === (editId || Number(sp.get('copy')) || 0))
  const tomorrow = addDays(1)
  const list = resources.filter((r) => r.kind === kind)

  const [resId, setResId] = useState(src?.resId ?? '')
  const [date, setDate] = useState(src && src.date >= tomorrow ? src.date : tomorrow)
  const [endDate, setEndDate] = useState(src && src.endDate >= tomorrow ? src.endDate : src && src.date >= tomorrow ? src.date : addDays(kind === 'borrow' ? 3 : 1))
  const [start, setStart] = useState(src?.start ?? '09:00')
  const [end, setEnd] = useState(src?.end ?? '12:00')
  const [allDay, setAllDay] = useState(src?.allDay ?? false)
  const [pax, setPax] = useState(src?.pax ?? (kind === 'borrow' ? 1 : kind === 'vehicle' ? 2 : 10))
  const [title, setTitle] = useState(src ? (editId ? src.title : `${src.title} (สำเนา)`) : '')
  const [detail, setDetail] = useState(src?.detail ?? '')
  const [extras, setExtras] = useState<string[]>(src?.extras ?? [])
  const [from, setFrom] = useState(src?.from ?? '')
  const [to, setTo] = useState(src?.to ?? '')
  const [btype, setBtype] = useState(src?.borrowType ?? '')
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [done, setDone] = useState<string>()
  const res = resOf(resId)
  const multiDay = kind === 'vehicle' && endDate > date
  const sH = allDay ? DAY_START : hourOf(start)
  const eH = allDay ? DAY_END : hourOf(end)

  // availability grid for the chosen day (pending shows amber, approved shows grey = not free)
  const grid = useMemo(() => list.map((r) => ({ r, m: dayMap(all, r.id, date, editId || undefined) })), [all, kind, date, editId]) // eslint-disable-line react-hooks/exhaustive-deps
  const pick = (id: string, h: number) => {
    const same = resId === id && !allDay
    if (same && h >= sH && h < eH) { setEnd(hh(h + 1)); return }
    if (same && h >= eH) {
      const g = grid.find((x) => x.r.id === id)!
      for (let i = eH; i <= h; i++) if (g.m.has(i)) { setStart(hh(h)); setEnd(hh(h + 1)); return }
      setEnd(hh(h + 1)); return
    }
    setResId(id); setAllDay(false); setStart(hh(h)); setEnd(hh(h + 1))
  }
  const avail = kind === 'borrow' && res?.stock != null ? res.stock - borrowedQty(all, res.id, date, endDate, editId || undefined) : undefined
  const toggle = (x: string) => setExtras((p) => (p.includes(x) ? p.filter((y) => y !== x) : [...p, x]))

  const submit = () => {
    const e: Record<string, string> = {}
    const noun = kind === 'zoom' ? 'บัญชี Zoom' : kind === 'vehicle' ? 'ยานพาหนะ' : kind === 'borrow' ? 'พัสดุ/ครุภัณฑ์' : 'ห้องประชุม'
    if (!resId) e.res = `กรุณาเลือก${noun}`
    if (!date) e.date = 'กรุณาเลือกวันที่'
    else if (date < tomorrow) e.date = 'ต้องจองล่วงหน้าอย่างน้อย 1 วันทำการ'
    if ((kind === 'borrow' || kind === 'vehicle') && endDate < date) e.endDate = kind === 'borrow' ? 'วันที่คืนต้องไม่ก่อนวันที่ยืม' : 'วันที่สิ้นสุดต้องไม่ก่อนวันที่เริ่ม'
    if (kind !== 'borrow' && !allDay && !multiDay && eH <= sH) e.time = 'เวลาสิ้นสุดต้องหลังเวลาเริ่มต้น'
    if (!title.trim()) e.title = kind === 'borrow' ? 'กรุณาระบุชื่อกิจกรรม' : 'กรุณากรอกชื่อกิจกรรม'
    if (kind === 'borrow' && !btype) e.btype = 'กรุณาเลือกประเภทการยืม'
    if (kind === 'vehicle' && (!from.trim() || !to.trim())) e.route = 'กรุณาระบุสถานที่ต้นทางและปลายทาง'
    if (res?.cap && kind !== 'borrow' && pax > res.cap) e.pax = `${res.name} รองรับได้ไม่เกิน ${res.cap} ${kind === 'vehicle' ? 'คน' : kind === 'zoom' ? 'ผู้เข้าร่วม' : 'ที่นั่ง'}`
    if (kind === 'borrow' && avail != null && pax > avail) e.pax = avail <= 0 ? 'ไม่มีพัสดุว่างในช่วงวันที่เลือก' : `มีพัสดุว่างในช่วงนี้เพียง ${avail} รายการ`
    if (kind !== 'borrow' && resId && !e.date && !e.time && !e.endDate) {
      const probe: Booking = { id: editId || -1, no: '', kind, resId, title, detail, date, endDate: kind === 'vehicle' ? endDate : date, start: allDay ? '08:00' : start, end: allDay ? '18:00' : end, allDay, pax, extras, from, to, borrowType: '', status: 'รออนุมัติ', by: '', createdAt: '', history: [] }
      let clash: Booking | undefined
      for (let i = 0; i < daysBetween(date, probe.endDate) && !clash; i++) {
        const d = addDays(i, new Date(date + 'T00:00:00'))
        const mine = busyHours(probe, d)
        clash = all.find((x) => x.id !== editId && x.resId === resId && busyHours(x, d).some((h) => mine.includes(h)))
      }
      if (clash) e.time = `ช่วงเวลานี้ซ้ำกับคำขอ ${clash.no} (${clash.status}) กรุณาเลือกช่วงเวลาอื่น`
    }
    setErrors(e)
    if (Object.keys(e).length) return
    const now = stamp()
    const payload = { kind, resId, title: title.trim(), detail: detail.trim(), date, endDate: kind === 'borrow' || kind === 'vehicle' ? endDate : date, start: kind === 'borrow' ? '08:00' : allDay ? '08:00' : start, end: kind === 'borrow' ? '17:00' : allDay ? '18:00' : end, allDay: kind === 'borrow' ? false : allDay, pax, extras, from: from.trim(), to: to.trim(), borrowType: btype }
    if (editId && src) {
      bookings.save({ ...src, ...payload, history: [...src.history, { at: now, by: bWho(), action: 'แก้ไขรายละเอียดคำขอ' }] })
      setDone(src.no)
    } else {
      const no = nextBookingNo(all)
      bookings.save({ id: bookings.next(), no, status: 'รออนุมัติ', by: bWho(), createdAt: now, history: [{ at: now, by: bWho(), action: `ส่งคำขอ${meta.label.replace('จอง', 'จอง')}` }], ...payload })
      setDone(no)
    }
  }

  const cell = (id: string, h: number, m: Map<number, { st: string; title: string }>) => {
    const t = m.get(h)
    const inSel = resId === id && h >= sH && h < eH
    const base = 'h-[34px] min-w-0 border-l border-white text-[10px] transition'
    if (t) return <td key={h} title={`${t.st} · ${t.title}`} className={`${base} ${t.st === 'รออนุมัติ' ? 'bg-[#ffe9b8] ' : 'bg-[#f3c4c4] '}`} />
    return <td key={h} className="p-0"><button type="button" aria-label={`เลือก ${resOf(id)?.name} เวลา ${hh(h)}`} aria-pressed={inSel} onClick={() => pick(id, h)} className={`${base} w-full ${inSel ? 'bg-blue-00' : 'bg-[#e4f6ec] hover:bg-[#bfeacf]'}`} /></td>
  }

  return (
    <div className={`${page} items-center`}>
      <div className="flex w-full max-w-[920px] flex-col gap-[12px]">
        <Title back="/booking" right={<BPersonaSwitch />}>{editId ? `แก้ไขคำขอ · ${meta.label}` : meta.label}</Title>
        <Crumbs items={[{ label: 'หน้าแรก', to: '/booking' }, { label: 'งานจองออนไลน์', to: '/booking' }, { label: meta.label }]} />

        <Section title={kind === 'borrow' ? 'เลือกพัสดุ/ครุภัณฑ์ และวัน/เวลาที่ต้องการยืม' : `เลือก${meta.unit === 'ห้อง' ? 'ห้อง' : meta.short}/วันที่${kind === 'room' ? 'และจำนวนผู้เข้าประชุม' : ''}`}>
          <Row label={kind === 'borrow' ? 'พัสดุ/ครุภัณฑ์' : kind === 'zoom' ? 'บัญชี Zoom' : kind === 'vehicle' ? 'ยานพาหนะ' : 'ห้องประชุม'} req error={errors.res}>
            <select aria-label={kind === 'borrow' ? 'เลือกพัสดุ/ครุภัณฑ์' : kind === 'zoom' ? 'เลือกบัญชี Zoom' : kind === 'vehicle' ? 'เลือกยานพาหนะ' : 'เลือกห้องประชุม'} value={resId} onChange={(e) => setResId(e.target.value)} className={`${ctl} ${errors.res ? err : ''}`}>
              <option value="">{kind === 'borrow' ? 'เลือกจากรายการ' : `เลือก${meta.short}`}</option>
              {list.map((r) => <option key={r.id} value={r.id}>{`${r.name} — ${r.sub}`}</option>)}
            </select>
          </Row>
          {kind === 'borrow' && (
            <Row label="ประเภทการยืม" req error={errors.btype}>
              <select aria-label="ประเภทการยืม" value={btype} onChange={(e) => setBtype(e.target.value)} className={`${ctl} ${errors.btype ? err : ''}`}><option value="">เลือกประเภทการยืม</option>{borrowTypes.map((t) => <option key={t}>{t}</option>)}</select>
            </Row>
          )}
          <Row label={kind === 'borrow' ? 'วันที่ยืม' : kind === 'vehicle' ? 'วันที่เริ่มเดินทาง' : 'วันที่'} req error={errors.date}>
            <input type="date" aria-label={kind === 'borrow' ? 'วันที่ยืม' : 'วันที่'} min={tomorrow} value={date} onChange={(e) => { setDate(e.target.value); if (endDate < e.target.value) setEndDate(e.target.value) }} className={`${ctl} max-w-[240px] ${errors.date ? err : ''}`} />
          </Row>
          {(kind === 'borrow' || kind === 'vehicle') && (
            <Row label={kind === 'borrow' ? 'วันที่คืน' : 'ถึงวันที่'} req error={errors.endDate} hint={kind === 'borrow' ? `ระยะเวลายืม ${daysBetween(date, endDate)} วัน (คำนวณให้อัตโนมัติ)` : undefined}>
              <input type="date" aria-label={kind === 'borrow' ? 'วันที่คืน' : 'วันที่สิ้นสุด'} min={date} value={endDate} onChange={(e) => setEndDate(e.target.value)} className={`${ctl} max-w-[240px] ${errors.endDate ? err : ''}`} />
            </Row>
          )}
          {kind !== 'borrow' && (
            <Row label="เวลา (เริ่มต้น–สิ้นสุด)" req error={errors.time}>
              <div className="flex flex-wrap items-center gap-[10px]">
                <select aria-label="เวลาเริ่มต้น" disabled={allDay} value={start} onChange={(e) => setStart(e.target.value)} className={`${ctl} w-[120px] ${errors.time ? err : ''}`}>{timeOpts.slice(0, -1).map((t) => <option key={t}>{t}</option>)}</select>
                <span className="text-gray-20">–</span>
                <select aria-label="เวลาสิ้นสุด" disabled={allDay} value={end} onChange={(e) => setEnd(e.target.value)} className={`${ctl} w-[120px] ${errors.time ? err : ''}`}>{timeOpts.slice(1).map((t) => <option key={t}>{t}</option>)}</select>
                <button type="button" role="switch" aria-checked={allDay} aria-label="ทั้งวัน" onClick={() => setAllDay(!allDay)} className="flex items-center gap-[8px] text-[12px] text-gray-30">
                  <span className={`relative h-[22px] w-[40px] rounded-full transition ${allDay ? 'bg-blue-00' : 'bg-gray-line'}`}><span className={`absolute top-[2px] size-[18px] rounded-full bg-white shadow transition-all ${allDay ? 'left-[20px]' : 'left-[2px]'}`} /></span>ทั้งวัน
                </button>
              </div>
            </Row>
          )}
          <Row label={kind === 'borrow' ? 'จำนวน' : kind === 'vehicle' ? 'จำนวนผู้โดยสาร' : 'จำนวนผู้เข้าร่วม'} req error={errors.pax} hint={avail != null ? `ว่างในช่วงที่เลือก ${Math.max(0, avail)} รายการ` : res?.cap ? `รองรับสูงสุด ${res.cap} ${kind === 'zoom' ? 'ผู้เข้าร่วม' : 'คน'}` : undefined}>
            <Stepper label={kind === 'borrow' ? 'จำนวนที่ยืม' : 'จำนวนผู้เข้าร่วม'} value={pax} onChange={setPax} />
          </Row>
        </Section>

        {kind !== 'borrow' && (
          <Section title={`เลือกช่วงเวลา — ${meta.short}ที่ว่างวันที่ ${date.split('-').reverse().join('/').replace(/\/(\d{4})$/, (_, y) => `/${Number(y) + 543}`)}`}>
            <p className="-mt-[6px] text-[12px] font-light text-gray-30">แตะช่องสีเขียวเพื่อเลือกห้อง/ช่วงเวลา แตะช่องถัดไปเพื่อขยายเวลา ระบบตรวจสอบการจองซ้ำให้อัตโนมัติ</p>
            <div className="overflow-x-auto">
              <table className="w-full min-w-[620px] table-fixed border-separate border-spacing-y-[6px]" aria-label="ตารางความพร้อมในแต่ละช่วงเวลา">
                <thead><tr><th className="w-[170px] text-left text-[11px] font-medium text-gray-20">{meta.short}</th>{hours.map((h) => <th key={h} className="text-center text-[10px] font-light text-gray-20">{h}</th>)}</tr></thead>
                <tbody>{grid.map(({ r, m }) => <tr key={r.id}><td className="pr-[8px]"><p className="truncate text-[12px] font-medium">{r.name}</p><p className="truncate text-[10px] font-light text-gray-20">{r.sub}</p></td>{hours.map((h) => cell(r.id, h, m))}</tr>)}</tbody>
              </table>
            </div>
            <div className="flex flex-wrap gap-[14px] text-[11px] font-light text-gray-30">
              {[['bg-[#e4f6ec]', 'ว่าง'], ['bg-blue-00', 'ช่วงที่เลือก'], ['bg-[#ffe9b8]', 'รออนุมัติ'], ['bg-[#f3c4c4]', 'ไม่ว่าง (อนุมัติแล้ว)']].map(([c, l]) => <span key={l} className="flex items-center gap-[6px]"><span className={`size-[12px] rounded-[3px] ${c}`} />{l}</span>)}
            </div>
          </Section>
        )}

        <Section title={kind === 'room' || kind === 'vehicle' ? 'รายละเอียดกิจกรรมและอุปกรณ์เสริม' : 'รายละเอียดกิจกรรม'}>
          <Row label="ชื่อกิจกรรม" req error={errors.title}><input aria-label="ชื่อกิจกรรม" placeholder={kind === 'zoom' ? 'เช่น ประชุมทีมประจำสัปดาห์' : 'เช่น ประชุมติดตามผลการดำเนินงาน'} value={title} onChange={(e) => setTitle(e.target.value)} className={`${ctl} ${errors.title ? err : ''}`} /></Row>
          {kind === 'vehicle' && (
            <Row label="ต้นทาง – ปลายทาง" req error={errors.route}>
              <div className="grid grid-cols-2 gap-[10px] max-sm:grid-cols-1">
                <input aria-label="สถานที่ต้นทาง" placeholder="สถานที่ต้นทาง" value={from} onChange={(e) => setFrom(e.target.value)} className={`${ctl} ${errors.route ? err : ''}`} />
                <input aria-label="สถานที่ปลายทาง" placeholder="สถานที่ปลายทาง" value={to} onChange={(e) => setTo(e.target.value)} className={`${ctl} ${errors.route ? err : ''}`} />
              </div>
            </Row>
          )}
          <Row label="รายละเอียดกิจกรรม"><textarea aria-label="รายละเอียดกิจกรรม" placeholder="วัตถุประสงค์ ผู้เข้าร่วม หรือข้อมูลประกอบการพิจารณา" value={detail} onChange={(e) => setDetail(e.target.value)} className={ta} /></Row>
          {(kind === 'room' || kind === 'vehicle') && (
            <Row label="อุปกรณ์เสริม" hint="เลือกได้มากกว่า 1 รายการ">
              <div className="flex flex-col gap-[8px] pt-[6px]">
                {(kind === 'room' ? roomExtras : vehicleExtras).map((x) => (
                  <label key={x} className="flex cursor-pointer items-center gap-[10px] text-[13px]"><input type="checkbox" checked={extras.includes(x)} onChange={() => toggle(x)} className="size-[16px] accent-[#1f5ac8]" />{x}</label>
                ))}
              </div>
            </Row>
          )}
        </Section>

        <div className="flex justify-end gap-[8px]">
          <Btn kind="ghost" onClick={() => navigate('/booking')}>ยกเลิก</Btn>
          <Btn onClick={submit}>{editId ? 'บันทึกการแก้ไข' : 'ขออนุมัติ'}</Btn>
        </div>
      </div>

      <Modal open={!!done} onClose={() => navigate('/booking')} title={editId ? 'บันทึกการแก้ไขแล้ว' : 'ส่งคำขออนุมัติแล้ว'} width="max-w-[440px]">
        <div className="flex flex-col items-center gap-[10px] text-center">
          <span className="flex size-[56px] items-center justify-center rounded-full bg-[#dff5e8] text-[#0f8a63]"><Ic d={BI.check} s={28} w={2.4} /></span>
          <p className="font-urbanist text-[18px] font-semibold text-blue-dark">{done}</p>
          <p className="text-[13px] leading-[1.6] font-light text-gray-30">ระบบแจ้งเตือนผู้มีอำนาจอนุมัติการจองแล้ว เมื่อมีผลการพิจารณาจะแจ้งกลับทางศูนย์แจ้งเตือน ติดตามสถานะได้ที่หน้า “การจองของฉัน”</p>
          <Link to="/booking" className="flex h-[38px] items-center rounded-[8px] bg-blue-00 px-[16px] text-[13px] font-medium text-white">ไปที่การจองของฉัน</Link>
        </div>
      </Modal>
    </div>
  )
}
