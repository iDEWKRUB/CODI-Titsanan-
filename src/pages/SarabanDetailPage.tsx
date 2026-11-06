import { useState } from 'react'
import { Link, useLocation, useNavigate, useParams } from 'react-router-dom'
import { useToast } from '../components/leader/Parts'
import { ChainTrack, Crumbs, DocPill, History, Paper, PersonaSwitch, Title, card, ctl, page } from '../components/saraban/Parts'
import { isMyTurn, labelFor, people } from '../data/saraban'
import { approveDoc, copyDoc, returnDoc, sendExternal, submitDoc, useDocs, useMe, wasSent } from '../lib/sarabanStore'

const Row = ({ k, v }: { k: string; v?: string }) => (
  <div className="grid grid-cols-[110px_minmax(0,1fr)] gap-[8px] py-[3px] text-[12px]">
    <dt className="font-light text-gray-20">{k}</dt>
    <dd className="font-medium break-words">{v || '-'}</dd>
  </div>
)

/** รายละเอียดเอกสาร + เลือกลงนาม/ตีกลับ (book 3 fig 2-50, 2-51) — 2.1.7.5 */
export default function SarabanDetailPage() {
  const { id } = useParams()
  const all = useDocs()
  const me = useMe()
  const navigate = useNavigate()
  const loc = useLocation()
  const [toast, show] = useToast()
  const d = all.find((x) => x.id === Number(id))
  const [choice, setChoice] = useState<'sign' | 'return'>('sign')
  const [reason, setReason] = useState('')
  const [directive, setDirective] = useState('')
  const [cc, setCc] = useState('')
  const [tried, setTried] = useState(false)

  if (!d) {
    return (
      <div className={page}>
        <Title back="/saraban/docs">ไม่พบเอกสาร</Title>
        <p className="py-[40px] text-center text-[13px] font-light text-gray-20">ไม่พบเอกสารที่ต้องการ อาจถูกลบแล้ว · <Link to="/saraban/docs" className="text-blue-00 hover:underline">กลับไปเอกสารของฉัน</Link></p>
      </div>
    )
  }

  const turn = isMyTurn(d, me)
  const step = d.chain[d.step]
  const isSign = step?.role === 'sign'
  const needReason = choice === 'return'
  const canResubmit = d.creator === me && d.status === 'returned'
  const canSendOut = d.creator === me && d.status === 'signed' && d.type.includes('ภายนอก (ส่งออก)') && !wasSent(d)
  const created = (loc.state as { created?: boolean } | null)?.created

  const confirm = () => {
    setTried(true)
    if (choice === 'return') {
      if (!reason.trim()) return
      returnDoc(d.id, me, reason.trim())
      show('ตีกลับเอกสารให้ผู้จัดทำแล้ว')
    } else {
      approveDoc(d.id, me, d.kind === 'received' && isSign ? directive.trim() || undefined : undefined)
      show(isSign ? 'ลงนามเรียบร้อย ระบบออกเลขทะเบียนแล้ว' : 'เซ็นผ่านเรียบร้อย ส่งต่อผู้ลงนามลำดับถัดไปแล้ว')
    }
    setReason('')
    setDirective('')
    setTried(false)
  }

  return (
    <div className={page}>
      <Title back="/saraban/docs" right={<PersonaSwitch />}>รายละเอียดเอกสาร</Title>
      <Crumbs items={[{ label: 'หน้าแรก', to: '/saraban' }, { label: 'เอกสารของฉัน', to: '/saraban/docs' }, { label: 'รายละเอียดเอกสาร' }]} />
      {created && <p role="status" className="rounded-[10px] border border-[#9fdcc3] bg-[#ecfaf3] px-[14px] py-[10px] text-[13px] text-[#0f8a63]">บันทึกเรียบร้อย ระบบแจ้งเตือนเอกสารเข้าใหม่ถึงผู้เกี่ยวข้องแล้ว ติดตามสถานะได้ที่หน้านี้</p>}

      <div className="grid grid-cols-[minmax(0,1fr)_340px] items-start gap-[12px] max-lg:grid-cols-1">
        <div className="flex min-w-0 flex-col gap-[12px]">
          <section className={`${card} p-[20px] max-sm:p-[14px]`} aria-label="รายละเอียดเอกสาร">
            <div className="flex items-start gap-[10px]">
              <h2 className="min-w-0 flex-1 text-[15px] font-semibold text-blue-dark">รายละเอียดเอกสาร</h2>
              <DocPill d={d} me={me} />
            </div>
            <dl className="mt-[8px]">
              <Row k="เลขที่เอกสาร" v={d.no} />
              <Row k="ประเภทเอกสาร" v={d.type} />
              <Row k="เรื่อง" v={d.title} />
              <Row k="วันที่สร้าง" v={d.createdAt} />
              <Row k="ผู้จัดทำ" v={people[d.creator].short} />
              <Row k="อ้างอิง" v={d.refNo} />
              {d.issuedNo && <Row k="เลขทะเบียนส่ง" v={d.issuedNo} />}
              {d.kind === 'received' && (
                <>
                  <Row k="ผู้ส่ง" v={d.sender} />
                  <Row k="เลขที่หนังสือ" v={d.extNo} />
                  <Row k="ช่องทางรับ" v={d.channel} />
                  <Row k="ตรารับ" v={d.stampAt} />
                  {d.action && <Row k="การดำเนินการ" v={d.action} />}
                </>
              )}
              <Row k="ชั้นความลับ/ด่วน" v={`${d.secret} / ${d.urgency}`} />
            </dl>
            <div className="mt-[10px] border-t border-gray-line-2 pt-[10px]">
              <p className="mb-[6px] text-[12px] font-semibold">ลำดับผู้ลงนาม</p>
              <ChainTrack d={d} />
            </div>
          </section>
          <Paper d={d} />
        </div>

        <div className="flex flex-col gap-[12px] max-lg:order-first">
          {turn ? (
            <section className={`${card} p-[16px]`} aria-label="เลือกลงนาม/ตีกลับ">
              <h2 className="text-[14px] font-semibold text-blue-dark">เลือกลงนาม/ตีกลับ</h2>
              <p className="mt-[2px] text-[11px] font-light text-gray-20">คุณคือ {step && people[me].short} ({isSign ? 'ผู้ลงนาม' : 'ผู้ที่ต้องผ่านเรื่อง'})</p>
              <div role="radiogroup" aria-label="ผลการพิจารณา" className="mt-[10px] flex gap-[6px]">
                {([['sign', isSign ? 'ลงนาม' : 'เซ็นผ่าน'], ['return', 'ตีกลับ']] as const).map(([k, l]) => (
                  <button key={k} type="button" role="radio" aria-checked={choice === k} onClick={() => setChoice(k)} className={`flex items-center gap-[8px] rounded-[8px] border px-[12px] py-[6px] text-[12px] transition-colors ${choice === k ? 'border-blue-00 bg-blue-bg font-medium text-blue-00' : 'border-gray-line hover:border-gray-10'}`}>
                    <span className={`flex size-[12px] items-center justify-center rounded-full border ${choice === k ? 'border-blue-00' : 'border-gray-10'}`}>{choice === k && <span className="size-[6px] rounded-full bg-blue-00" />}</span>
                    {l}
                  </button>
                ))}
              </div>
              {needReason && (
                <label className="mt-[10px] flex flex-col gap-[4px]">
                  <span className="text-[11px] font-medium text-gray-30">ความคิดเห็น (ระบุเหตุผลหรือสิ่งที่ต้องแก้ไข) *</span>
                  <textarea value={reason} onChange={(e) => setReason(e.target.value)} placeholder="เช่น กรุณาตรวจสอบข้อมูลและแก้ไขเพิ่มเติม" className={`${ctl} h-auto min-h-[90px] py-[8px] leading-[1.6] ${tried && !reason.trim() ? 'border-red-00' : ''}`} />
                  {tried && !reason.trim() && <span role="alert" className="text-[11px] text-red-00">กรุณาระบุเหตุผลการตีกลับ</span>}
                  {d.chain.slice(0, d.step).length > 0 && <span className="text-[10px] font-light text-gray-20">ระบบจะแจ้งเตือนการแก้ไขถึงผู้ลงนามลำดับก่อนหน้า</span>}
                </label>
              )}
              {!needReason && d.kind === 'received' && isSign && (
                <label className="mt-[10px] flex flex-col gap-[4px]">
                  <span className="text-[11px] font-medium text-gray-30">ข้อสั่งการ (ถ้ามี) — เพิ่มเป็นแผ่นสุดท้ายของเอกสาร</span>
                  <textarea value={directive} onChange={(e) => setDirective(e.target.value)} className={`${ctl} h-auto min-h-[72px] py-[8px] leading-[1.6]`} />
                </label>
              )}
              <div className="mt-[12px] flex justify-end gap-[6px]">
                <button type="button" onClick={() => navigate('/saraban/docs')} className="h-[32px] rounded-[6px] border border-gray-line px-[14px] text-[12px] hover:border-gray-10">ยกเลิก</button>
                <button type="button" disabled={choice !== 'sign'} onClick={confirm} className="h-[32px] rounded-[6px] bg-[#52b96b] px-[16px] text-[12px] font-semibold text-white hover:brightness-105 disabled:opacity-35">{isSign ? 'ลงนาม' : 'เซ็นผ่าน'}</button>
                <button type="button" disabled={choice !== 'return'} onClick={confirm} className="h-[32px] rounded-[6px] bg-[#e5484d] px-[16px] text-[12px] font-semibold text-white hover:brightness-105 disabled:opacity-35">ตีกลับ</button>
              </div>
            </section>
          ) : (
            <section className={`${card} p-[16px]`} aria-label="สถานะการดำเนินการ">
              <h2 className="text-[14px] font-semibold text-blue-dark">สถานะ: {labelFor(d, me)}</h2>
              <p className="mt-[4px] text-[12px] leading-[1.7] font-light text-gray-30">
                {d.status === 'review' && <>รอ <b className="font-medium">{people[step.who].short}</b> {step.role === 'sign' ? 'ลงนาม' : 'เซ็นผ่าน'} · เปลี่ยน “ดูในฐานะ” เพื่อทดลองมุมมองผู้ลงนาม</>}
                {d.status === 'signed' && <>ลงนามครบถ้วนแล้ว ระบบออกเลขทะเบียน <b className="font-medium">{d.issuedNo}</b> และส่งกลับเจ้าหน้าที่สารบรรณเจ้าของเรื่อง</>}
                {d.status === 'returned' && <>ถูกตีกลับ: <b className="font-medium text-[#c0262d]">{d.returnReason}</b></>}
                {d.status === 'registered' && <>ลงทะเบียนรับแล้ว เก็บไว้ที่สารบรรณ (ไม่ส่งต่อ)</>}
                {d.status === 'circulated' && <>เวียนแจ้งทุกส่วนงานแล้ว</>}
                {d.status === 'draft' && <>ยังเป็นร่าง ยังไม่ได้ส่งให้ผู้ลงนาม</>}
              </p>
              {canResubmit && (
                <div className="mt-[10px] flex flex-wrap gap-[6px]">
                  <Link to={`/saraban/internal/new?edit=${d.id}`} className="rounded-[6px] border border-blue-00 px-[12px] py-[6px] text-[12px] font-medium text-blue-00 hover:bg-blue-bg">แก้ไขเอกสาร</Link>
                  <button type="button" onClick={() => { submitDoc(d); show('ส่งเอกสารที่แก้ไขแล้วให้ผู้ลงนามอีกครั้ง') }} className="rounded-[6px] bg-blue-00 px-[12px] py-[6px] text-[12px] font-medium text-white hover:brightness-110">ส่งใหม่โดยไม่แก้เนื้อหา</button>
                </div>
              )}
              {d.status === 'draft' && d.creator === me && d.kind === 'internal' && (
                <div className="mt-[10px] flex gap-[6px]">
                  <Link to={`/saraban/internal/new?edit=${d.id}`} className="rounded-[6px] bg-blue-00 px-[12px] py-[6px] text-[12px] font-medium text-white hover:brightness-110">แก้ไขและส่งลงนาม</Link>
                </div>
              )}
              {canSendOut && (
                <div className="mt-[12px] flex flex-col gap-[6px] border-t border-gray-line-2 pt-[10px]">
                  <p className="text-[12px] font-semibold">ส่งหนังสือภายนอก</p>
                  <p className="text-[11px] font-light text-gray-20">ส่งจากอีเมลกลาง saraban@codi.co.th เท่านั้น ตามมาตรฐานองค์กร</p>
                  <input aria-label="สำเนาถึง (CC)" placeholder="CC / BCC (ถ้ามี)" value={cc} onChange={(e) => setCc(e.target.value)} className={ctl} />
                  <button type="button" onClick={() => { sendExternal(d.id, me, cc); show(`ส่งถึง ${d.to} แล้ว`) }} className="h-[34px] rounded-[6px] bg-blue-00 text-[12px] font-medium text-white hover:brightness-110">ส่งอีเมลถึง {d.to}</button>
                </div>
              )}
              {d.status === 'signed' && wasSent(d) && <p className="mt-[8px] text-[11px] text-[#0f8a63]">✓ ส่งหนังสือออกแล้ว (ดูในประวัติ)</p>}
              <button type="button" onClick={() => { const nid = copyDoc(d); show('คัดลอกเป็นร่างแล้ว'); navigate(`/saraban/docs/${nid}`) }} className="mt-[10px] text-[11px] text-blue-00 hover:underline">คัดลอกเป็นร่างใหม่</button>
            </section>
          )}
          <section id="history" className={`${card} scroll-mt-[16px] p-[16px]`} aria-label="ประวัติการส่ง">
            <h2 className="mb-[10px] text-[14px] font-semibold text-blue-dark">ประวัติการส่ง</h2>
            <History d={d} />
          </section>
        </div>
      </div>
      {toast}
    </div>
  )
}
