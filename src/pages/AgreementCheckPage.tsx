import { useState } from 'react'
import { Link, useNavigate, useSearchParams } from 'react-router-dom'
import { Btn, ContractViewer, Crumbs, GI, GPersonaSwitch, Gate, Ic, Radios, Row, Section, Title, err, page, ta } from '../components/agreement/Parts'
import Modal from '../components/ui/Modal'
import { typeOf } from '../data/erpAgreement'
import { reviewVerdict, useContracts, useGPersona } from '../lib/agreementStore'

const tips = ['ข้อความชัดเจน ครบถ้วนตามระเบียบ', 'ควรระบุรายละเอียดเพิ่มเติม', 'ค่าปรับต่ำกว่าอัตราตามระเบียบพัสดุ', 'ข้อกำหนดขัดกับกฎหมาย ควรแก้ไข']

/** ตรวจสอบสัญญา — ความเห็นรายหน้า + สรุปมติ ก่อนส่งต่อ (book 3 §2.3.1.9, fig 2-127) */
export default function AgreementCheckPage() {
  const all = useContracts()
  const me = useGPersona()
  const navigate = useNavigate()
  const [sp] = useSearchParams()
  const c = all.find((x) => x.id === Number(sp.get('id')))
  const [page1, setPage1] = useState(c?.notes.find((n) => n.page === 1)?.text ?? '')
  const [page2, setPage2] = useState(c?.notes.find((n) => n.page === 2)?.text ?? '')
  const [cur, setCur] = useState(1)
  const [verdict, setVerdict] = useState<'pass' | 'fix'>('pass')
  const [summary, setSummary] = useState('')
  const [error, setError] = useState('')
  const [done, setDone] = useState<'pass' | 'fix'>()
  const legal = me === 'legal'
  if (!c) return <div className={`${page} items-center`}><p className="text-[13px] text-gray-30">ไม่พบสัญญา <Link to="/agreement/review" className="text-blue-00 underline">กลับไปรายการ</Link></p></div>
  const t = typeOf(c.type)
  const val = cur === 1 ? page1 : page2
  const setVal = (v: string) => (cur === 1 ? setPage1(v) : setPage2(v))

  const save = () => {
    if (verdict === 'fix' && !page1.trim() && !page2.trim() && !summary.trim()) { setError('กรุณาระบุข้อเสนอแนะอย่างน้อย 1 ข้อ ในความเห็นรายหน้าหรือสรุปผล'); return }
    setError('')
    const keep = c.notes.filter((n) => n.page === 0)
    reviewVerdict(c.id, verdict === 'pass', [...keep, ...(page1.trim() ? [{ page: 1, text: page1.trim() }] : []), ...(page2.trim() ? [{ page: 2, text: page2.trim() }] : [])], summary || (verdict === 'pass' ? 'ผ่านการตรวจสอบ' : 'ให้ปรับปรุงสัญญาตามข้อเสนอแนะ'))
    setDone(verdict)
  }

  return (
    <div className={`${page} items-center`}>
      <div className="flex w-full max-w-[1100px] flex-col gap-[12px]">
        <Title back={`/agreement/review/detail?id=${c.id}`} right={<GPersonaSwitch />}>ตรวจสอบสัญญา</Title>
        <Crumbs items={[{ label: 'หน้าแรก', to: '/agreement' }, { label: 'รายการสัญญารอตรวจสอบ', to: '/agreement/review' }, { label: c.no }]} />
        <Gate allowed={legal} need="เจ้าหน้าที่นิติกร" />
        <div className="grid grid-cols-[minmax(0,1fr)_minmax(0,420px)] items-start gap-[16px] max-lg:grid-cols-1">
          <section aria-label="เอกสารสัญญา" className="rounded-[14px] border border-gray-line-2 bg-[#f5f8fd] p-[16px]">
            <ContractViewer key={c.id} type={c.type} c={c} label={`${c.no} · ${t.label}`} onPage={setCur} />
          </section>
          <div className="flex flex-col gap-[12px]">
            <Section title={`ความเห็นประกอบหน้า ${cur} / 2`} tone="blue">
              <p className="-mt-[6px] text-[11px] font-light text-gray-20">{t.pages[cur - 1]}</p>
              <textarea aria-label={`ความเห็นหน้า ${cur}`} disabled={!legal} value={val} onChange={(e) => setVal(e.target.value)} placeholder="ระบุความเห็นที่พบจากการตรวจสอบหน้านี้" className={ta} />
              <div className="flex flex-wrap gap-[6px]">{tips.map((x) => <button key={x} type="button" disabled={!legal} onClick={() => setVal(val ? `${val}\n${x}` : x)} className="rounded-full border border-blue-20 bg-white px-[10px] py-[4px] text-[11px] text-blue-dark hover:bg-blue-bg disabled:opacity-40">{x}</button>)}</div>
              <p className="text-[11px] font-light text-gray-20">ความเห็นที่บันทึกไว้: หน้า 1 {page1.trim() ? '✓' : '—'} · หน้า 2 {page2.trim() ? '✓' : '—'}</p>
            </Section>
            <Section title="สรุปผลการตรวจสอบ">
              <Row label="มติ" req><Radios label="มติการตรวจสอบ" value={verdict} disabled={!legal} options={[{ key: 'pass', label: 'ผ่านการตรวจสอบ' }, { key: 'fix', label: 'ปรับปรุงสัญญาตามข้อเสนอแนะ' }]} onChange={(k) => { setVerdict(k); setError('') }} /></Row>
              <Row label="สรุปความเห็น" error={error}><textarea aria-label="สรุปความเห็น" disabled={!legal} value={summary} onChange={(e) => { setSummary(e.target.value); setError('') }} placeholder={verdict === 'pass' ? 'เช่น เนื้อหาครบถ้วน ไม่มีข้อกฎหมายที่ต้องแก้ไข' : 'ระบุสิ่งที่ต้องปรับปรุง'} className={`${ta} !min-h-[80px] ${error ? err : ''}`} /></Row>
              <div className="flex flex-wrap justify-end gap-[8px]">
                <Btn kind="ghost" onClick={() => navigate('/agreement/review')}>ยกเลิก</Btn>
                <Btn onClick={save} disabled={!legal}>บันทึกและส่งแจ้งเตือน</Btn>
              </div>
            </Section>
          </div>
        </div>
      </div>
      <Modal open={!!done} onClose={() => navigate('/agreement/review')} title={done === 'pass' ? 'ผ่านการตรวจสอบแล้ว' : 'ส่งกลับให้ปรับปรุงแล้ว'} width="max-w-[440px]">
        <div className="flex flex-col items-center gap-[10px] text-center">
          <span className={`flex size-[56px] items-center justify-center rounded-full ${done === 'pass' ? 'bg-[#dff5e8] text-[#0f8a63]' : 'bg-[#fff1d6] text-[#a8650b]'}`}><Ic d={done === 'pass' ? GI.check : GI.alert} s={28} w={2.4} /></span>
          <p className="font-urbanist text-[18px] font-semibold text-blue-dark">{c.no}</p>
          <p className="text-[13px] leading-[1.6] font-light text-gray-30">{done === 'pass' ? 'ระบบส่งสัญญาไปยังผู้มีอำนาจลงนามและแจ้งเตือนผู้เกี่ยวข้องแล้ว สถานะ: รอลงนาม' : `ระบบแจ้งเตือน ${c.resp} ให้แก้ไขสัญญาตามข้อเสนอแนะ สถานะ: ต้องแก้ไข`}</p>
          <Link to="/agreement/review" className="flex h-[38px] items-center rounded-[8px] bg-blue-00 px-[16px] text-[13px] font-medium text-white">กลับไปรายการรอตรวจสอบ</Link>
        </div>
      </Modal>
    </div>
  )
}
