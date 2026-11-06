import { useState } from 'react'
import { Link, useNavigate, useSearchParams } from 'react-router-dom'
import { useToast } from '../components/leader/Parts'
import { Btn, Crumbs, Gate, HPersonaSwitch, Title, card, downloadCsv, downloadDoc, page } from '../components/hr/Parts'
import { fullName, grossOf, money, netOf, ssoOf, stamp, thDate, whtOf } from '../data/erpHr'
import { runs, useEmps, useHPersona, useRuns } from '../lib/hrStore'

/** สรุปการจ่ายเงินเดือน (book 3 fig 2-40) — 2.1.6.11 */
export default function HrPayrollSummaryPage() {
  const me = useHPersona()
  const all = useRuns()
  const people = useEmps()
  const navigate = useNavigate()
  const [sp] = useSearchParams()
  const [toast, show] = useToast()
  const [menu, setMenu] = useState(false)
  const r = all.find((x) => x.id === Number(sp.get('id'))) ?? [...all].sort((a, b) => b.id - a.id)[0]
  const allowed = me === 'finance'
  if (!r) return <div className={page}><p className="py-[48px] text-center text-[13px] text-gray-20">ยังไม่มีรอบการจ่ายเงินเดือน <Link to="/hr/payroll" className="text-blue-00 underline">ทำจ่ายเงินเดือน</Link></p></div>
  const paid = r.status === 'paid'
  const net = r.rows.reduce((a, x) => a + netOf(x), 0)
  const sso = r.rows.reduce((a, x) => a + ssoOf(x), 0)
  const wht = r.rows.reduce((a, x) => a + whtOf(x), 0)
  const emp = (id: number) => people.find((e) => e.id === id)
  const bank = () => { downloadCsv(`${r.no}-bank.csv`, [['เลขที่บัญชี', 'ชื่อ-นามสกุล', 'จำนวนเงิน', 'วันที่โอน'], ...r.rows.map((x) => [emp(x.empId)?.account ?? '', emp(x.empId) ? fullName(emp(x.empId)!) : '', netOf(x).toFixed(2), r.due])]); show('ดาวน์โหลดไฟล์จ่ายเงินธนาคารแล้ว') }
  const ssoFile = () => { downloadCsv(`${r.no}-sso.csv`, [['รหัสพนักงาน', 'ชื่อ-นามสกุล', 'ค่าจ้าง', 'เงินสมทบลูกจ้าง', 'เงินสมทบนายจ้าง'], ...r.rows.map((x) => [emp(x.empId)?.code ?? '', emp(x.empId) ? fullName(emp(x.empId)!) : '', x.salary, ssoOf(x), ssoOf(x)])]); show('ดาวน์โหลดไฟล์ประกันสังคมแล้ว') }
  const pnd = () => { downloadCsv(`${r.no}-pnd1.csv`, [['ลำดับ', 'ชื่อ-นามสกุล', 'เงินได้', 'ภาษีหัก ณ ที่จ่าย'], ...r.rows.map((x, i) => [i + 1, emp(x.empId) ? fullName(emp(x.empId)!) : '', grossOf(x).toFixed(2), whtOf(x).toFixed(2)])]); show('ดาวน์โหลดไฟล์ยื่นภาษี ภ.ง.ด.1 แล้ว') }
  const slip = () => {
    const x = r.rows.find((y) => y.empId === 1) ?? r.rows[0]
    const e = emp(x.empId)!
    downloadDoc(`slip-${r.no}-${e.code}.doc`, `<h3>สลิปเงินเดือน ${r.no}</h3><p>${fullName(e)} (${e.code}) · ${thDate(r.from)} – ${thDate(r.to)}</p><table border="1" cellpadding="6">${[['เงินได้รวม', grossOf(x)], ['ประกันสังคม', -ssoOf(x)], ['ภาษีหัก ณ ที่จ่าย', -whtOf(x)], ['รับสุทธิ', netOf(x)]].map(([k, v]) => `<tr><td>${k}</td><td align="right">${money(Number(v))}</td></tr>`).join('')}</table>`)
    show('ดาวน์โหลดสลิปเงินเดือนแล้ว')
  }
  const paySso = () => {
    if (!allowed) return show('ต้องเป็นเจ้าหน้าที่สำนักการเงินและบัญชี')
    const no = `EXP-${r.no.slice(4, 10)}${String(r.id).padStart(5, '0')}`
    runs.save({ ...r, ssoPaid: no })
    show(`บันทึกชำระประกันสังคม ${no} แล้ว`)
  }
  const next = () => {
    if (!allowed) return show('ต้องเป็นเจ้าหน้าที่สำนักการเงินและบัญชี')
    if (!paid) { runs.save({ ...r, status: 'paid', paidAt: stamp() }); show(`ยืนยันการจ่ายเงินเดือน ${r.no} แล้ว`); return }
    navigate('/hr')
  }
  const btn = 'flex h-[32px] items-center gap-[6px] rounded-full px-[14px] text-[12px] font-medium text-white'
  const row = (k: string, v: number, bold?: boolean) => <p className={`flex justify-between gap-[12px] text-[12px] ${bold ? 'font-semibold' : 'font-light'}`}><span>{k}</span><span className="font-urbanist">{`${money(v)} บาท`}</span></p>
  return (
    <div className={`${page} items-center`}>
      <div className="flex w-full max-w-[860px] flex-col gap-[12px]">
        <Title back="/hr/payroll" right={<HPersonaSwitch />}>ทำจ่ายเงินเดือน</Title>
        <Crumbs items={[{ label: 'หน้าแรก', to: '/hr' }, { label: 'ทำจ่ายเงินเดือน', to: '/hr/payroll' }, { label: 'สรุปการจ่ายเงินเดือน' }]} />
        <Gate allowed={allowed} need="เจ้าหน้าที่สำนักการเงินและบัญชี" />
        <section className={`${card} relative flex flex-col gap-[16px] p-[24px] max-sm:p-[14px]`}>
          <span className={`absolute top-0 right-[24px] flex h-[52px] w-[60px] flex-col items-center justify-center text-center text-[9px] leading-[1.2] font-semibold text-white [clip-path:polygon(0_0,100%_0,100%_100%,50%_78%,0_100%)] ${paid ? 'bg-[#17c3a1]' : 'bg-[#ffa32b]'}`} aria-label={paid ? 'Payroll ชำระแล้ว' : 'Payroll รอชำระ'}>Payroll<br />{paid ? '(ชำระแล้ว)' : '(รอชำระ)'}</span>
          <div className="flex flex-wrap items-center gap-[10px] pr-[70px]">
            <div className="flex flex-col gap-[2px]"><h2 className="text-[15px] font-semibold">{`การจ่ายเงินเดือน ${r.no}`}</h2><span className={`text-[11px] ${paid ? 'text-[#0f8a63]' : 'text-[#a8650b]'}`}>{paid ? `● ชำระแล้ว ${r.paidAt ? thDate(r.paidAt) : ''}` : '● รอยืนยันการจ่าย'}</span></div>
            <div className="ml-auto flex flex-wrap gap-[8px]">
              <button type="button" onClick={() => show(`ส่งสลิปเงินเดือนทางอีเมลถึงพนักงาน ${r.rows.length} คนแล้ว`)} className={`${btn} bg-[#4a8df0]`}>อีเมล</button>
              <button type="button" onClick={() => window.print()} className={`${btn} bg-[#ff6b5a]`}>พิมพ์</button>
              <div className="relative"><button type="button" aria-expanded={menu} onClick={() => setMenu(!menu)} className={`${btn} bg-[#17c3a1]`}>ตัวเลือก ▾</button>{menu && <div role="menu" className="absolute right-0 z-10 mt-[4px] w-[190px] rounded-[10px] border border-gray-line-2 bg-white p-[4px] shadow-lg"><button role="menuitem" type="button" onClick={() => { setMenu(false); slip() }} className="block w-full rounded-[6px] px-[10px] py-[7px] text-left text-[12px] hover:bg-blue-bg">ดาวน์โหลดสลิปของฉัน</button><button role="menuitem" type="button" onClick={() => { setMenu(false); navigate(`/hr/payroll?id=${r.id}`) }} className="block w-full rounded-[6px] px-[10px] py-[7px] text-left text-[12px] hover:bg-blue-bg">ดูรายการพนักงาน</button></div>}</div>
            </div>
          </div>
          <div className="grid grid-cols-[1.4fr_1fr] gap-[24px] max-md:grid-cols-1">
            <div className="flex flex-col gap-[6px]">
              {row('เงินเดือนสุทธิ', net, true)}
              <p className="text-[12px] font-semibold">ประกันสังคม</p>
              {row('เงินสมทบประกันสังคมรอนำส่ง (ส่วนนายจ้าง)', sso)}
              {row('เงินสมทบประกันสังคมรอนำส่ง (ส่วนลูกจ้าง)', sso)}
              {row('ภาษีหัก ณ ที่จ่ายรอนำส่ง', wht, true)}
            </div>
            <div className="flex flex-col gap-[6px] text-[12px]">
              <p className="font-semibold">ดาวน์โหลด</p>
              <button type="button" onClick={bank} className="w-fit text-[#0b8fa8] hover:underline">ไฟล์จ่ายเงินธนาคาร</button>
              <button type="button" onClick={ssoFile} className="w-fit text-[#0b8fa8] hover:underline">ไฟล์ประกันสังคม</button>
              <button type="button" onClick={pnd} className="w-fit text-[#0b8fa8] hover:underline">ไฟล์ยื่นภาษี ภ.ง.ด.1 RD Prep</button>
            </div>
          </div>
          <div className="flex flex-wrap items-center justify-end gap-[10px] text-[11px]">
            {r.ssoPaid && <span>{'เลขที่บันทึกรายการ '}<b className="font-urbanist text-[#0b8fa8]">{r.ssoPaid}</b></span>}
            <button type="button" disabled={!!r.ssoPaid} onClick={paySso} className="rounded-full bg-[#2bc0c9] px-[14px] py-[5px] text-[12px] font-medium text-white disabled:opacity-50">{r.ssoPaid ? 'ชำระประกันสังคมแล้ว' : 'ชำระประกันสังคม'}</button>
          </div>
        </section>
        <div className="flex justify-end gap-[10px]"><Btn kind="ghost" onClick={() => navigate('/hr/payroll')}>ยกเลิก</Btn><Btn onClick={next}>{paid ? 'ถัดไป →' : 'ยืนยันการจ่าย →'}</Btn></div>
      </div>
      {toast}
    </div>
  )
}
