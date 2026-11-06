import { useMemo, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import DigitBoxes from '../components/community/DigitBoxes'
import { useToast } from '../components/leader/Parts'
import Modal from '../components/ui/Modal'
import Pagination from '../components/ui/Pagination'
import Select from '../components/ui/Select'
import { Btn, Crumbs, HPersonaSwitch, Pill, RStatus, Radios, Title, card, ctl, downloadDoc, page } from '../components/hr/Parts'
import { fullName, hPersonas, prefixes, reqKindLabel, thDate, validThaiId, type HrReq, type Track } from '../data/erpHr'
import { decideReq, emps, trainings, useCareers, useEmps, useHPersona, useMe, useReqs, useTrainings } from '../lib/hrStore'

const PAGE = 5
const quick = [
  { to: '/hr/leave', label: 'แจ้งลา', d: 'M5 20V6a2 2 0 0 1 2-2h8l4 4v12ZM9 13h6M9 16h4' },
  { to: '/hr/certificate', label: 'ขอหนังสือรับรอง', d: 'M7 3h7l4 4v14H7ZM14 3v4h4M10 13l2 2 4-4' },
  { to: '/hr/welfare', label: 'เบิกสวัสดิการ', d: 'M12 21s-7-4.5-7-10a4 4 0 0 1 7-2.6A4 4 0 0 1 19 11c0 5.5-7 10-7 10Z' },
  { to: '/hr/overtime', label: 'ค่าอาหารนอกเวลา', d: 'M12 21a9 9 0 1 0 0-18 9 9 0 0 0 0 18ZM12 7v5l3 2' },
]
const detailOf = (r: HrReq) => r.kind === 'leave' ? `${r.leaveType} ${r.days} วัน (${thDate(r.from ?? '')}–${thDate(r.to ?? '')})` : r.kind === 'cert' ? `${r.certType} · ${r.certPurpose}` : r.kind === 'ot' ? `${(r.otDays ?? []).reduce((a, d) => a + d.slots.length, 0)} ชั่วโมง ${r.otDays?.length} วัน` : `${r.welfareType} ${(r.welfareItems ?? []).reduce((a, i) => a + (Number(i.amount) || 0), 0).toLocaleString('en-US')} บาท`

/** ข้อมูลของฉัน (book 3 fig 2-42) — 2.1.6.13 ; also the home of ERP HR (requests + quick links) */
export default function HrHomePage() {
  const me = useMe()
  const persona = useHPersona()
  const people = useEmps()
  const all = useReqs()
  const mine = useTrainings().filter((t) => t.empId === me.id)
  const careers = useCareers().filter((c) => c.status === 'active')
  const navigate = useNavigate()
  const [toast, show] = useToast()
  const [v, setV] = useState({ prefix: me.prefix, firstTh: me.firstTh, lastTh: me.lastTh, firstEn: me.firstEn, lastEn: me.lastEn, idType: me.idType, idNo: me.idNo })
  const [tab, setTab] = useState<'all' | Track>('all')
  const [pg, setPg] = useState(1)
  const [good, setGood] = useState(false)
  const [g, setG] = useState({ act: '', date: '', hours: '' })
  const [gErr, setGErr] = useState('')
  const goods = JSON.parse(localStorage.getItem('codi.hr.good') || '[]') as { act: string; date: string; hours: number }[]
  const rows = mine.filter((t) => tab === 'all' || t.track === tab)
  const pages = Math.max(1, Math.ceil(rows.length / PAGE))
  const cur = Math.min(pg, pages)
  const myReqs = useMemo(() => all.filter((r) => r.empId === me.id).sort((a, b) => b.id - a.id), [all, me.id])
  const pending = useMemo(() => all.filter((r) => r.status === 'submitted' && r.kind !== 'cert'), [all])

  const saveInfo = () => {
    if (!v.firstTh.trim() || !v.lastTh.trim()) return show('กรุณาระบุชื่อและนามสกุลภาษาไทย')
    if (v.idType === 'id' && v.idNo && !validThaiId(v.idNo)) return show('เลขบัตรประชาชนไม่ถูกต้อง')
    emps.save({ ...me, ...v })
    show('บันทึกข้อมูลทั่วไปแล้ว')
  }
  const cert = (r: HrReq) => {
    downloadDoc(`${r.no}.doc`, `<p style="text-align:center"><b>สถาบันพัฒนาองค์กรชุมชน (องค์การมหาชน)</b></p><p style="text-align:right">ที่ พอช. ${r.no}</p><h3 style="text-align:center">${r.certType}</h3><p>เรียน ${r.certTo}</p><p>หนังสือฉบับนี้ให้ไว้เพื่อรับรองว่า ${fullName(me)} ตำแหน่ง ${me.position} สังกัด ${me.dept} เป็นพนักงานของสถาบัน ทั้งนี้เพื่อ${r.certPurpose}</p><p style="text-align:right">ลงนาม ${r.decision?.by ?? ''}<br/>${thDate(r.decision?.at ?? '')}</p>`)
    show(`ดาวน์โหลด ${r.certType} แล้ว`)
  }
  const addGood = () => {
    if (!g.act.trim() || !g.date || !(Number(g.hours) > 0)) return setGErr('กรุณาระบุกิจกรรม วันที่ และจำนวนชั่วโมง')
    localStorage.setItem('codi.hr.good', JSON.stringify([...goods, { act: g.act.trim(), date: g.date, hours: Number(g.hours) }]))
    setGood(false); setG({ act: '', date: '', hours: '' }); show('ลงทะเบียนความดีแล้ว')
  }
  const field = (k: 'firstTh' | 'lastTh' | 'firstEn' | 'lastEn', label: string) => <label className="flex flex-col gap-[3px] rounded-[8px] border border-gray-line px-[10px] py-[4px] text-[10px] font-semibold">{label}<input aria-label={label} maxLength={70} className="bg-transparent text-[12px] font-light outline-none" value={v[k]} onChange={(e) => setV({ ...v, [k]: e.target.value })} /></label>

  return (
    <div className={`${page} items-center`}>
      <div className="flex w-full max-w-[1000px] flex-col gap-[12px]">
        <Title right={<HPersonaSwitch />}>ข้อมูลของฉัน</Title>
        <Crumbs items={[{ label: 'หน้าแรก', to: '/app' }, { label: 'งานบริหารจัดการทรัพยากรบุคคล' }]} />
        <section aria-label="บริการตนเอง" className="grid grid-cols-4 gap-[10px] max-md:grid-cols-2">
          {quick.map((q) => <Link key={q.to} to={q.to} className={`${card} flex items-center gap-[10px] px-[14px] py-[12px] transition hover:border-blue-00`}><span className="flex size-[36px] items-center justify-center rounded-[10px] bg-blue-bg text-blue-00"><svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d={q.d} /></svg></span><span className="text-[13px] font-medium">{q.label}</span></Link>)}
        </section>

        <div className="grid grid-cols-2 gap-[12px] max-lg:grid-cols-1">
          <section aria-label="ข้อมูลทั่วไป" className={`${card} flex flex-col gap-[10px] p-[18px]`}>
            <h2 className="text-[15px] font-semibold text-blue-dark">ข้อมูลทั่วไป</h2>
            <div className="flex justify-center"><span className="relative flex size-[64px] items-center justify-center rounded-full bg-gray-bg text-gray-30">{me.photo ? <img src={me.photo} alt="" className="size-full rounded-full object-cover" /> : <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" aria-hidden="true"><circle cx="12" cy="8" r="4" /><path d="M4 21c0-4 4-6 8-6s8 2 8 6" /></svg>}<label aria-label="เปลี่ยนรูปโปรไฟล์" className="absolute right-[-2px] bottom-[-2px] flex size-[22px] cursor-pointer items-center justify-center rounded-full bg-[#17c3a1] text-white ring-2 ring-white"><svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true"><path d="M4 8h3l2-3h6l2 3h3v11H4ZM12 16a3 3 0 1 0 0-6 3 3 0 0 0 0 6Z" /></svg><input type="file" accept="image/*" hidden onChange={(e) => { const f = e.target.files?.[0]; if (f) { const r = new FileReader(); r.onload = () => { const img = new Image(); img.onload = () => { const s = Math.min(img.width, img.height), c = document.createElement('canvas'); c.width = c.height = 256; c.getContext('2d')!.drawImage(img, (img.width - s) / 2, (img.height - s) / 2, s, s, 0, 0, 256, 256); emps.save({ ...me, photo: c.toDataURL('image/jpeg', 0.85) }); show('เปลี่ยนรูปโปรไฟล์แล้ว') }; img.src = String(r.result) }; r.readAsDataURL(f) } }} /></label></span></div>
            <div className="w-[130px]"><Select label="คำนำหน้า" value={v.prefix} options={prefixes.map((p) => ({ value: p, label: p }))} onChange={(p) => setV({ ...v, prefix: p })} /></div>
            <div className="grid grid-cols-2 gap-[8px]">{field('firstTh', 'ชื่อจริงภาษาไทย')}{field('lastTh', 'นามสกุลภาษาไทย')}{field('firstEn', 'ชื่อจริงภาษาอังกฤษ')}{field('lastEn', 'นามสกุลภาษาอังกฤษ')}</div>
            <Radios label="ประเภทเอกสาร" value={v.idType} options={[{ key: 'id', label: 'เลขบัตรประชาชน' }, { key: 'passport', label: 'เลขที่หนังสือเดินทาง' }]} onChange={(k) => setV({ ...v, idType: k })} />
            {v.idType === 'id' ? <DigitBoxes value={v.idNo} groups={[1, 4, 5, 2, 1]} onChange={(x) => setV({ ...v, idNo: x })} label="เลขบัตรประชาชน" /> : <input aria-label="เลขที่หนังสือเดินทาง" className={ctl} value={v.idNo} onChange={(e) => setV({ ...v, idNo: e.target.value.toUpperCase() })} />}
            <p className="text-[11px] font-light text-gray-20">{`${me.code} · ${me.position} · ${me.dept} · เริ่มงาน ${thDate(me.start)}`}</p>
            <div className="flex justify-end"><button type="button" onClick={saveInfo} className="h-[34px] rounded-[8px] bg-blue-00 px-[16px] text-[12px] font-medium text-white">บันทึกข้อมูล</button></div>
          </section>

          <section aria-label="เงื่อนไขสายงานอาชีพ" className={`${card} flex flex-col gap-[10px] p-[18px]`}>
            <h2 className="text-[15px] font-semibold text-blue-dark">เงื่อนไขสายงานอาชีพ</h2>
            {careers.flatMap((c) => c.trainings.map((t, ti) => {
              const done = mine.filter((m) => m.status === 'ยืนยันแล้ว' && m.condition === t.contentType)
              return (
                <div key={`${c.id}-${ti}`} className="flex flex-col gap-[6px]">
                  <p className="flex items-center gap-[8px] rounded-[8px] bg-blue-bg px-[12px] py-[8px] text-[12px] text-blue-dark"><span aria-hidden="true">≡</span><span className="flex-1">{`${c.name} · ${t.contentType}`}</span><b className="font-urbanist" aria-label={`ความคืบหน้า ${c.name}`}>{`${Math.min(done.length, t.count)}/${t.count}`}</b></p>
                  {done.slice(0, 2).map((m) => (
                    <div key={m.id} className="flex items-center gap-[10px] border-b border-gray-line-2 px-[6px] py-[6px] text-[12px]">
                      <span className="flex size-[16px] items-center justify-center rounded-[4px] bg-[#17c3a1] text-[10px] text-white">✓</span>
                      <span className="flex-1"><b className="font-medium">{m.course}</b><br /><span className="text-[10px] font-light text-gray-20">{m.detail}</span></span>
                      <span className="text-[10px] font-light text-gray-20">{m.year}</span>
                      <button type="button" aria-label={`ติดดาว ${m.course}`} aria-pressed={!!m.star} onClick={() => trainings.update(m.id, (x) => ({ ...x, star: !x.star }))} className={m.star ? 'text-[#ffa32b]' : 'text-gray-10'}>★</button>
                    </div>
                  ))}
                </div>
              )
            }))}
            <div className="mt-auto flex flex-wrap justify-end gap-[8px] pt-[6px]">
              <button type="button" onClick={() => navigate('/hr/training/new')} className="h-[34px] rounded-[8px] bg-blue-00 px-[14px] text-[12px] font-medium text-white">+ เพิ่มรายการอบรม</button>
              <button type="button" onClick={() => { setGErr(''); setGood(true) }} className="h-[34px] rounded-[8px] bg-blue-bg px-[14px] text-[12px] font-medium text-blue-00">{`ลงทะเบียนความดี (${goods.length})`}</button>
            </div>
          </section>
        </div>

        <section aria-label="รายการอบรมของฉัน" className={`${card} flex flex-col gap-[10px] p-[18px]`}>
          <h2 className="text-[15px] font-semibold text-blue-dark">รายการอบรมของฉัน</h2>
          <div role="tablist" aria-label="สายงาน" className="grid grid-cols-3 gap-[6px] rounded-[8px] bg-blue-bg p-[3px]">
            {([['all', 'ทั้งหมด'], ['บริหาร', 'สายบริหาร'], ['วิชาการ', 'สายวิชาการ']] as const).map(([k, t]) => <button key={k} type="button" role="tab" aria-selected={tab === k} onClick={() => { setTab(k); setPg(1) }} className={`h-[32px] rounded-[6px] text-[12px] font-medium ${tab === k ? 'bg-blue-00 text-white' : 'text-blue-00 hover:bg-white/60'}`}>{t}</button>)}
          </div>
          <div className="overflow-x-auto"><table className="w-full min-w-[620px] text-left text-[12px]">
            <thead className="text-[10px] font-light text-gray-20"><tr>{['ลำดับ', 'หลักสูตร', 'ปีการศึกษา', 'ใบประกาศ', 'สถานะ', ''].map((h, i) => <th key={i} className="py-[6px] pr-[8px] font-light">{h}</th>)}</tr></thead>
            <tbody>{rows.slice((cur - 1) * PAGE, cur * PAGE).map((t, i) => <tr key={t.id} className="border-t border-gray-line-2"><td className="py-[10px] font-urbanist">{(cur - 1) * PAGE + i + 1}</td><td className="pr-[8px] font-medium underline">{t.course}</td><td className="font-urbanist">{t.year}</td><td>{t.cert}</td><td><Pill tone={t.status === 'ยืนยันแล้ว' ? 'bg-[#dff5e8] text-[#0f8a63]' : 'bg-[#fff1d6] text-[#a8650b]'}>{t.status}</Pill></td><td className="text-right">{persona === 'hr' && t.status === 'รอตรวจสอบ' && <button type="button" onClick={() => { trainings.update(t.id, (x) => ({ ...x, status: 'ยืนยันแล้ว' })); show(`ยืนยันรายการอบรม ${t.course} แล้ว`) }} className="rounded-[6px] bg-[#17c3a1] px-[10px] py-[3px] text-[11px] text-white">ยืนยัน</button>}</td></tr>)}
              {!rows.length && <tr><td colSpan={6} className="py-[24px] text-center text-[12px] font-light text-gray-20">ยังไม่มีรายการอบรม</td></tr>}</tbody>
          </table></div>
          <div className="flex justify-end"><Pagination page={cur} pageCount={pages} onChange={setPg} /></div>
        </section>

        <section aria-label="คำขอของฉัน" className={`${card} flex flex-col gap-[8px] p-[18px]`}>
          <h2 className="text-[15px] font-semibold text-blue-dark">คำขอของฉัน</h2>
          <div className="overflow-x-auto"><table className="w-full min-w-[640px] text-left text-[12px]"><tbody>
            {myReqs.slice(0, 8).map((r) => <tr key={r.id} className="border-t border-gray-line-2"><td className="py-[8px] font-urbanist font-medium">{r.no}</td><td>{reqKindLabel[r.kind]}</td><td className="font-light">{detailOf(r)}</td><td><RStatus s={r.status} /></td><td className="text-right">{r.kind === 'cert' && r.status === 'approved' && <button type="button" onClick={() => cert(r)} className="text-[11px] font-medium text-blue-00 hover:underline">ดาวน์โหลดหนังสือ</button>}</td></tr>)}
            {!myReqs.length && <tr><td className="py-[18px] text-center text-[12px] text-gray-20">ยังไม่มีคำขอ</td></tr>}
          </tbody></table></div>
        </section>

        {persona === 'head' && (
          <section aria-label="คำขอรออนุมัติ" className={`${card} flex flex-col gap-[8px] p-[18px]`}>
            <div className="flex items-center gap-[8px]"><h2 className="flex-1 text-[15px] font-semibold text-blue-dark">คำขอรออนุมัติ</h2><Link to="/hr/certificate/sign" className="text-[12px] font-medium text-blue-00 hover:underline">ลงนามหนังสือรับรอง ›</Link></div>
            <div className="overflow-x-auto"><table className="w-full min-w-[640px] text-left text-[12px]"><tbody>
              {pending.map((r) => { const e = people.find((x) => x.id === r.empId); return <tr key={r.id} className="border-t border-gray-line-2"><td className="py-[8px] font-urbanist">{r.no}</td><td>{e ? fullName(e) : ''}</td><td className="font-light">{detailOf(r)}</td><td className="text-right whitespace-nowrap"><button type="button" onClick={() => { decideReq(r.id, true, 'อนุมัติ', hPersonas.head.name); show(`อนุมัติ ${r.no} แล้ว`) }} className="mr-[6px] rounded-[6px] bg-[#17c3a1] px-[10px] py-[3px] text-[11px] text-white">อนุมัติ</button><button type="button" onClick={() => { decideReq(r.id, false, 'ไม่อนุมัติ', hPersonas.head.name); show(`ไม่อนุมัติ ${r.no}`) }} className="rounded-[6px] bg-[#ffe3e3] px-[10px] py-[3px] text-[11px] text-[#c13232]">ไม่อนุมัติ</button></td></tr> })}
              {!pending.length && <tr><td className="py-[18px] text-center text-[12px] text-gray-20">ไม่มีคำขอรออนุมัติ</td></tr>}
            </tbody></table></div>
          </section>
        )}
      </div>

      <Modal open={good} onClose={() => setGood(false)} title="ลงทะเบียนความดี" width="max-w-[440px]">
        <div className="flex flex-col gap-[10px]">
          <input aria-label="กิจกรรมความดี" placeholder="กิจกรรม เช่น จิตอาสาพัฒนาชุมชน" className={ctl} value={g.act} onChange={(e) => setG({ ...g, act: e.target.value })} />
          <div className="grid grid-cols-2 gap-[8px]"><input type="date" aria-label="วันที่ทำความดี" className={ctl} value={g.date} onChange={(e) => setG({ ...g, date: e.target.value })} /><input aria-label="จำนวนชั่วโมง" inputMode="decimal" placeholder="ชั่วโมง" className={ctl} value={g.hours} onChange={(e) => setG({ ...g, hours: e.target.value.replace(/[^\d.]/g, '') })} /></div>
          {gErr && <p role="alert" className="text-[12px] text-red-00">{gErr}</p>}
          <div className="flex justify-end gap-[8px]"><Btn kind="ghost" onClick={() => setGood(false)}>ยกเลิก</Btn><Btn onClick={addGood}>บันทึก</Btn></div>
        </div>
      </Modal>
      {toast}
    </div>
  )
}
