import { useMemo, useState, type ReactNode } from 'react'
import iconSearch from '../assets/dashboard/icon-search.svg'
import { BackTitle, primaryBtn, softBtn } from '../components/leader/Parts'
import { field } from '../components/meeting/FormParts'
import { PmSection } from '../components/pm/Parts'
import { DateInput } from '../components/ui/DateTimeInputs'
import Select from '../components/ui/Select'
import { debts, funds, loanOrgs, loanTypes } from '../data/loan'

const opt = (xs: string[]) => xs.map((x) => ({ value: x, label: x }))
const baht = (n: number) => n.toLocaleString('en-US')
const statusCls: Record<string, string> = { ปกติ: 'bg-[#e3f7ef] text-[#0f8a63]', ค้างชำระ: 'bg-[#fde2e2] text-[#c0262d]', ปิดบัญชี: 'bg-gray-bg text-gray-30' }

function Row({ label, children, wide }: { label: string; children: ReactNode; wide?: boolean }) {
  return (
    <div className={`grid items-center gap-x-[12px] ${wide ? 'grid-cols-[130px_minmax(0,1fr)]' : 'grid-cols-[130px_minmax(0,1fr)]'} max-md:grid-cols-1`}>
      <span className="text-[14px] font-semibold text-black">{label}</span>
      <div className="min-w-0">{children}</div>
    </div>
  )
}

/** ค้นหาประวัติลูกหนี้ (Figma 550:27181) — 2.3.2.2 */
export default function DebtorHistoryPage() {
  const [asOf, setAsOf] = useState('')
  const [loanType, setLoanType] = useState('')
  const [fund, setFund] = useState('')
  const [orgQ, setOrgQ] = useState('')
  const [orgSel, setOrgSel] = useState('')
  const [project, setProject] = useState('')
  const [apFrom, setApFrom] = useState('')
  const [apTo, setApTo] = useState('')
  const [sgFrom, setSgFrom] = useState('')
  const [sgTo, setSgTo] = useState('')
  const [contractNo, setContractNo] = useState('')
  const [account, setAccount] = useState('')
  const [result, setResult] = useState<typeof debts | null>(null)
  const [err, setErr] = useState('')

  const orgMatches = orgQ.trim() && !orgSel ? loanOrgs.filter((o) => o.name.includes(orgQ.trim())) : []
  const search = () => {
    if (!asOf) return setErr('กรุณาระบุวันที่ของรายงาน (ประจำวันที่)')
    if (apFrom && apTo && apFrom > apTo) return setErr('วันที่อนุมัติ: วันเริ่มต้นต้องไม่เกินวันสิ้นสุด')
    if (sgFrom && sgTo && sgFrom > sgTo) return setErr('วันที่ทำสัญญา: วันเริ่มต้นต้องไม่เกินวันสิ้นสุด')
    setErr('')
    setResult(
      debts.filter(
        (d) =>
          (!loanType || d.loanType === loanType) &&
          (!fund || loanOrgs.find((o) => o.name === d.org)?.fund === fund) &&
          (!orgSel || d.org === orgSel) &&
          (!project.trim() || d.project.includes(project.trim())) &&
          (!contractNo.trim() || d.contractNo.includes(contractNo.trim())) &&
          (!apFrom || d.approved >= apFrom) && (!apTo || d.approved <= apTo) &&
          (!sgFrom || d.signed >= sgFrom) && (!sgTo || d.signed <= sgTo) &&
          (!account.trim() || d.contractNo.replace(/\D/g, '').includes(account.trim())),
      ),
    )
  }
  const reset = () => { setAsOf(''); setLoanType(''); setFund(''); setOrgQ(''); setOrgSel(''); setProject(''); setApFrom(''); setApTo(''); setSgFrom(''); setSgTo(''); setContractNo(''); setAccount(''); setResult(null); setErr('') }
  const totals = useMemo(() => (result ?? []).reduce((a, d) => ({ p: a.p + d.principal, b: a.b + d.balance }), { p: 0, b: 0 }), [result])

  return (
    <div className="flex w-full flex-col gap-[12px] px-[24px] pb-[55px] max-sm:px-[12px]">
      <BackTitle title="ประวัติลูกหนี้" to="/dashboard" />
      <PmSection title="ค้นหาประวัติลูกหนี้">
        <div className="flex flex-col gap-[18px]">
          <Row label="ประจำวันที่"><div className="max-w-[230px]"><DateInput label="ประจำวันที่" value={asOf} onChange={setAsOf} /></div></Row>
          <div className="grid grid-cols-2 gap-x-[48px] gap-y-[18px] max-lg:grid-cols-1">
            <Row label="ประเภทสินเชื่อ"><Select label="ประเภทสินเชื่อ" value={loanType} options={[{ value: '', label: 'ทั้งหมด' }, ...opt(loanTypes)]} onChange={setLoanType} /></Row>
            <Row label="ประเภทกองทุน"><Select label="ประเภทกองทุน" value={fund} options={[{ value: '', label: 'ทั้งหมด' }, ...opt(funds)]} onChange={setFund} /></Row>
          </div>
          <div className="grid grid-cols-2 gap-x-[48px] gap-y-[18px] max-lg:grid-cols-1">
            <Row label="องค์กรชุมชน">
              <div className="relative">
                <input aria-label="องค์กรชุมชน" placeholder="ค้นหาชื่อองค์กรชุมชน" value={orgQ} onChange={(e) => { setOrgQ(e.target.value); setOrgSel('') }} className={`${field} pr-[42px]`} />
                <img src={iconSearch} alt="" width={18} height={18} className="pointer-events-none absolute top-1/2 right-[14px] -translate-y-1/2" />
                {orgMatches.length > 0 && (
                  <ul role="listbox" className="absolute top-[calc(100%+4px)] left-0 z-20 w-full overflow-hidden rounded-[10px] border border-gray-line-2 bg-white p-[4px] shadow-lg">
                    {orgMatches.map((o) => <li key={o.id}><button type="button" role="option" aria-selected="false" onClick={() => { setOrgQ(o.name); setOrgSel(o.name) }} className="w-full rounded-[8px] px-[10px] py-[8px] text-left text-[13px] hover:bg-blue-bg">{o.name}</button></li>)}
                  </ul>
                )}
              </div>
            </Row>
            <input aria-label="ที่ตั้งองค์กร" readOnly value={orgSel ? (() => { const o = loanOrgs.find((x) => x.name === orgSel)!; return `ต.${o.subdistrict} อ.${o.district} จ.${o.province}` })() : ''} className="h-[46px] w-full rounded-[8px] border border-gray-line bg-gray-bg px-[14px] text-[14px] font-light text-gray-30 outline-none" />
          </div>
          <Row label="โครงการ"><input aria-label="โครงการ" value={project} onChange={(e) => setProject(e.target.value)} className={field} /></Row>
          <div className="flex flex-wrap items-center gap-x-[16px] gap-y-[10px]">
            <span className="w-[130px] text-[14px] font-semibold">วันที่อนุมัติ</span>
            <div className="w-[230px]"><DateInput label="วันที่อนุมัติ จาก" value={apFrom} onChange={setApFrom} /></div>
            <span className="text-[14px] font-semibold">ถึง</span>
            <div className="w-[230px]"><DateInput label="วันที่อนุมัติ ถึง" value={apTo} onChange={setApTo} /></div>
          </div>
          <div className="flex flex-wrap items-center gap-x-[16px] gap-y-[10px]">
            <span className="w-[130px] text-[14px] font-semibold">วันที่ทำสัญญา</span>
            <div className="w-[230px]"><DateInput label="วันที่ทำสัญญา จาก" value={sgFrom} onChange={setSgFrom} /></div>
            <span className="text-[14px] font-semibold">ถึง</span>
            <div className="w-[230px]"><DateInput label="วันที่ทำสัญญา ถึง" value={sgTo} onChange={setSgTo} /></div>
          </div>
          <div className="grid grid-cols-2 gap-x-[48px] gap-y-[18px] max-lg:grid-cols-1">
            <Row label="เลขที่สัญญา"><input aria-label="เลขที่สัญญา" value={contractNo} onChange={(e) => setContractNo(e.target.value)} className={field} /></Row>
            <Row label="เลขที่บัญชีเงินกู้"><input aria-label="เลขที่บัญชีเงินกู้" inputMode="numeric" value={account} onChange={(e) => setAccount(e.target.value.replace(/\D/g, ''))} className={field} /></Row>
          </div>
          <div className="text-[11px] leading-[1.7] text-[#ee3b3b]">
            <p className="font-semibold">เงื่อนไขตามหมาย : กรณีบัญชีปกติ</p>
            <ol className="list-decimal pl-[18px] font-light">
              <li>ดอกเบี้ยค้างและค่าปรับค้างคิดจาก ยอดล่าสุดตามการคูณหนี้ + จำนวนเพิ่มตามสูตรจนถึงวันที่ออกรายงาน</li>
              <li>เงินงวดค้างและเงินต้นคงเหลือยึดจากยอดล่าสุดตามการคูณหนี้ (ไม่นำงานเพิ่ม)</li>
              <li>ระบบคำนวณดอกเบี้ย/ค่าปรับเพิ่มเติมถึงวันที่ออกรายงาน</li>
            </ol>
            <p className="mt-[4px] font-semibold">กรณีบัญชีพัก</p>
            <p className="font-light">เนื่องจาก บัญชีพักถูกสร้างขึ้นด้วยไม่มีอัตราการ “ตั้งพัก” ซึ่งกองคำนวณ ให้กำหนดค่าดังนี้ · เงื่อนไขการชำระหนี้เงินกู้ = “ปลอดเงินต้น/ดอกเบี้ย/ค่าปรับ (บัญชีพัก)” · กำหนดชำระระยะ = “ไม่ระบุ” · งวดการชำระระยะ สามารถระบุเข้าได้เองจากขั้นตอนการค้างพัก ซึ่งทั้ง 3 เงื่อนไขนี้ ทำให้บัญชีพักไม่มีการคำนวณ ดอกเบี้ย และ ค่าปรับ เพิ่มเติม ดังนั้น ดอกเบี้ยค้าง ค่าปรับค้าง เงินงวดค้าง และ เงินต้นคงเหลือ จึงเป็นยอดคงเหลือที่เกิดจากเงินที่ชำระแต่ละครั้งเรียบร้อยแล้ว</p>
          </div>
        </div>
      </PmSection>

      {err && <p role="alert" className="rounded-[8px] bg-[#fde2e2] px-[14px] py-[10px] text-[13px] text-[#c0262d]">{err}</p>}
      <div className="flex justify-end gap-[8px]">
        <button type="button" onClick={reset} className={`${softBtn} px-[18px] py-[11px] text-[14px]`}>ล้างค่า</button>
        <button type="button" onClick={search} className={`${primaryBtn} px-[28px] py-[11px] text-[14px]`}>ค้นหา</button>
      </div>

      {result && (
        <section aria-label="ผลการค้นหา" className="overflow-hidden rounded-[12px] border border-gray-line-2 bg-white">
          <div className="flex flex-wrap items-center justify-between gap-[8px] border-b border-gray-line-2 px-[16px] py-[12px]">
            <h2 className="text-[16px] font-semibold text-blue-dark">ผลการค้นหา {result.length} รายการ</h2>
            {result.length > 0 && <p className="text-[12px] font-light text-gray-30">เงินต้นรวม <b className="font-urbanist font-semibold text-black">{baht(totals.p)}</b> · คงเหลือรวม <b className="font-urbanist font-semibold text-black">{baht(totals.b)}</b> บาท</p>}
          </div>
          {result.length === 0 ? (
            <p className="py-[40px] text-center text-[13px] font-light text-gray-20">ไม่พบข้อมูลลูกหนี้ตามเงื่อนไขที่ระบุ</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full min-w-[900px] text-left text-[12px]">
                <thead className="bg-gray-bg text-[11px] text-gray-30">
                  <tr>{['เลขที่สัญญา', 'องค์กรชุมชน', 'โครงการ', 'วันที่อนุมัติ', 'เงินต้น', 'ดอกเบี้ยค้าง', 'ค่าปรับค้าง', 'คงเหลือ', 'สถานะ'].map((h, i) => <th key={h} className={`px-[12px] py-[10px] font-medium ${i >= 4 && i <= 7 ? 'text-right' : ''}`}>{h}</th>)}</tr>
                </thead>
                <tbody>
                  {result.map((d) => (
                    <tr key={d.contractNo} className="border-t border-gray-line-2">
                      <td className="px-[12px] py-[12px] font-urbanist">{d.contractNo}</td>
                      <td className="px-[12px]">{d.org}</td>
                      <td className="px-[12px] font-light">{d.project}</td>
                      <td className="px-[12px] font-light">{d.approved}</td>
                      <td className="px-[12px] text-right font-urbanist">{baht(d.principal)}</td>
                      <td className="px-[12px] text-right font-urbanist">{baht(d.interest)}</td>
                      <td className="px-[12px] text-right font-urbanist">{baht(d.fine)}</td>
                      <td className="px-[12px] text-right font-urbanist font-semibold">{baht(d.balance)}</td>
                      <td className="px-[12px]"><span className={`rounded-full px-[10px] py-[2px] text-[11px] ${statusCls[d.status]}`}>{d.status}</span></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </section>
      )}
    </div>
  )
}
