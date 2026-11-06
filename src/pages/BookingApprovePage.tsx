import { useState } from 'react'
import { Link, useNavigate, useSearchParams } from 'react-router-dom'
import { BI, BPersonaSwitch, Btn, Crumbs, Gate, Ic, Radios, Row, Section, Title, err, page, ta } from '../components/booking/Parts'
import { BookingDetail } from '../components/booking/Detail'
import Modal from '../components/ui/Modal'
import { bPersonas, canApprove, kindMeta } from '../data/erpBooking'
import { complete, decide, useBPersona, useBookings } from '../lib/bookingStore'

/** หน้าจออนุมัติการจอง — 2.1.10.7 ห้องประชุม · .8 Zoom · .9 ยานพาหนะ · .10 ยืมพัสดุ/ครุภัณฑ์ (fig 2-65 – 2-68) */
export default function BookingApprovePage() {
  const all = useBookings()
  const me = useBPersona()
  const navigate = useNavigate()
  const [sp] = useSearchParams()
  const b = all.find((x) => x.id === Number(sp.get('id')))
  const [pick, setPick] = useState<'ok' | 'no'>(sp.get('no') ? 'no' : 'ok')
  const [note, setNote] = useState('')
  const [error, setError] = useState('')
  const [done, setDone] = useState<'ok' | 'no' | 'closed'>()
  const allowed = canApprove(me)

  if (!b) {
    return (
      <div className={`${page} items-center`}>
        <div className="flex w-full max-w-[860px] flex-col gap-[12px]">
          <Title back="/booking">อนุมัติการจอง</Title>
          <p className="rounded-[12px] border border-gray-line-2 bg-white p-[28px] text-center text-[13px] font-light text-gray-30">ไม่พบคำขอที่ต้องการ <Link to="/booking" className="text-blue-00 underline">กลับไปการจองของฉัน</Link></p>
        </div>
      </div>
    )
  }
  const meta = kindMeta[b.kind]
  const pending = b.status === 'รออนุมัติ'
  const title = `อนุมัติ${b.kind === 'borrow' ? 'การยืมพัสดุ/ครุภัณฑ์' : meta.label.replace('จอง', 'การจอง')}`

  const save = () => {
    if (pick === 'no' && note.trim().length < 5) { setError('กรุณาระบุเหตุผลที่ไม่อนุมัติ เพื่อให้ผู้ขอทราบและปรับแก้คำขอได้'); return }
    setError('')
    decide(b.id, pick === 'ok', note)
    setDone(pick)
  }

  return (
    <div className={`${page} items-center`}>
      <div className="flex w-full max-w-[860px] flex-col gap-[12px]">
        <Title back="/booking" right={<BPersonaSwitch />}>{title}</Title>
        <Crumbs items={[{ label: 'หน้าแรก', to: '/booking' }, { label: 'งานจองออนไลน์', to: '/booking' }, { label: meta.label.replace('จอง', 'การจอง') }]} />
        <Gate allowed={allowed} need="ผู้มีอำนาจอนุมัติการจอง หรือเจ้าหน้าที่สำนักบริหารงานกลาง" />

        <Section title="ข้อมูลคำขอ"><BookingDetail b={b} /></Section>

        {pending && (
          <Section title="พิจารณาอนุมัติ / ไม่อนุมัติ" tone="blue">
            <Row label="ผลการพิจารณา" req>
              <Radios label="ผลการพิจารณา" value={pick} disabled={!allowed} options={[{ key: 'ok', label: 'อนุมัติ' }, { key: 'no', label: 'ไม่อนุมัติ' }]} onChange={(k) => { setPick(k); setError('') }} />
            </Row>
            <Row label="เหตุผล" req={pick === 'no'} error={error} hint={pick === 'no' ? 'คำแนะนำ: ระบุสาเหตุและแนวทาง เช่น ห้องถูกจัดสรรให้ภารกิจเร่งด่วน กรุณาเลือกช่วงเวลาอื่น' : 'ระบุเงื่อนไขเพิ่มเติม (ถ้ามี) เช่น ให้ติดต่อรับกุญแจที่เจ้าหน้าที่อาคาร'}>
              <textarea aria-label="เหตุผลประกอบการพิจารณา" disabled={!allowed} value={note} onChange={(e) => setNote(e.target.value)} placeholder={pick === 'no' ? 'ระบุเหตุผลที่ไม่อนุมัติ' : 'หมายเหตุประกอบการอนุมัติ (ไม่บังคับ)'} className={`${ta} ${error ? err : ''}`} />
            </Row>
            <div className="flex justify-end gap-[8px]">
              <Btn kind="ghost" onClick={() => navigate('/booking')}>ยกเลิก</Btn>
              <Btn onClick={save} disabled={!allowed}>บันทึกผลเพื่อแจ้งเตือน</Btn>
            </div>
          </Section>
        )}

        {!pending && (
          <div className="flex flex-wrap items-center justify-between gap-[10px] rounded-[12px] border border-gray-line-2 bg-white p-[16px]">
            <p className="text-[13px] font-light text-gray-30">คำขอนี้ดำเนินการแล้ว — สถานะ <b className="font-semibold text-black">{b.status}</b></p>
            <div className="flex gap-[8px]">
              {b.status === 'อนุมัติ' && me === 'central' && <Btn kind="outline" onClick={() => { complete(b.id); setDone('closed') }}>{b.kind === 'borrow' ? 'บันทึกรับคืนพัสดุ' : 'บันทึกใช้งานเสร็จสมบูรณ์'}</Btn>}
              <Btn kind="ghost" onClick={() => navigate('/booking')}>กลับ</Btn>
            </div>
          </div>
        )}
      </div>

      <Modal open={!!done} onClose={() => navigate('/booking')} title={done === 'no' ? 'บันทึกผลไม่อนุมัติแล้ว' : done === 'closed' ? 'ปิดรายการแล้ว' : 'บันทึกผลอนุมัติแล้ว'} width="max-w-[440px]">
        <div className="flex flex-col items-center gap-[10px] text-center">
          <span className={`flex size-[56px] items-center justify-center rounded-full ${done === 'no' ? 'bg-[#ffe3e3] text-[#c13232]' : 'bg-[#dff5e8] text-[#0f8a63]'}`}><Ic d={done === 'no' ? BI.x : BI.check} s={28} w={2.4} /></span>
          <p className="font-urbanist text-[18px] font-semibold text-blue-dark">{b.no}</p>
          <p className="text-[13px] leading-[1.6] font-light text-gray-30">{done === 'closed' ? 'บันทึกสถานะเสร็จสมบูรณ์แล้ว' : `ระบบแจ้งผลการพิจารณาไปยัง ${b.by} แล้ว (ผู้พิจารณา: ${bPersonas[me].name})`}</p>
          <Link to="/booking" className="flex h-[38px] items-center rounded-[8px] bg-blue-00 px-[16px] text-[13px] font-medium text-white">กลับไปการจองของฉัน</Link>
        </div>
      </Modal>
    </div>
  )
}
