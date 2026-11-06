import { useState, type ReactNode } from 'react'
import iconSearch from '../assets/dashboard/icon-search.svg'
import { BackTitle, primaryBtn, softBtn, useToast } from '../components/leader/Parts'
import { field } from '../components/meeting/FormParts'
import { PmSection } from '../components/pm/Parts'
import { DateInput } from '../components/ui/DateTimeInputs'
import Modal from '../components/ui/Modal'
import Select from '../components/ui/Select'
import { Upload } from '../components/community/FormKit'
import { accountTypes, banks, contractForms, loanOrgs, loanTypes, payTypes, positions, type LoanOrg } from '../data/loan'

const opt = (xs: string[]) => xs.map((x) => ({ value: x, label: x }))
const ro = 'h-[46px] w-full rounded-[8px] border border-gray-line bg-gray-bg px-[14px] text-[14px] font-light text-gray-30 outline-none'
const ta = `${field} h-auto min-h-[96px] resize-y py-[10px] leading-[1.6]`
const bad = 'border-red-00'

function Band({ children }: { children: ReactNode }) {
  return <h3 className="rounded-[8px] bg-blue-bg px-[14px] py-[8px] text-[14px] font-semibold text-black">{children}</h3>
}
function Row({ label, req, err, children }: { label: string; req?: boolean; err?: string; children: ReactNode }) {
  return (
    <div className="grid grid-cols-[170px_minmax(0,1fr)] items-start gap-x-[12px] max-md:grid-cols-1">
      <span className="pt-[13px] text-[14px] font-medium text-black max-md:pt-0">{label}{req && <span className="text-red-00"> *</span>}</span>
      <div className="flex min-w-0 flex-col gap-[2px]">
        {children}
        {err && <span role="alert" className="text-[12px] text-red-00">{err}</span>}
      </div>
    </div>
  )
}

type Signer = { name: string; pos: string }

/** เบิกจ่ายสินเชื่อ (Figma 549:27730) — 2.3.2.1 */
export default function LoanDisbursementPage() {
  const [q, setQ] = useState('')
  const [org, setOrg] = useState<LoanOrg | null>(null)
  const [contractNo, setContractNo] = useState('')
  const [loanType, setLoanType] = useState('')
  const [form, setForm] = useState('')
  const [amount, setAmount] = useState('')
  const [approveDate, setApproveDate] = useState('')
  const [purpose, setPurpose] = useState('')
  const [remark, setRemark] = useState('')
  const [payType, setPayType] = useState('')
  const [bank, setBank] = useState('')
  const [branch, setBranch] = useState('')
  const [acctType, setAcctType] = useState('')
  const [acctName, setAcctName] = useState('')
  const [acctNo, setAcctNo] = useState('')
  const [signers, setSigners] = useState<Signer[]>([{ name: '', pos: '' }])
  const [doc, setDoc] = useState('')
  const [tried, setTried] = useState(false)
  const [preview, setPreview] = useState(false)
  const [sent, setSent] = useState<string>()
  const [toast, show] = useToast()

  const matches = q.trim() && !org ? loanOrgs.filter((o) => o.name.includes(q.trim())) : []
  const pick = (o: LoanOrg) => { setOrg(o); setQ(o.name); setContractNo(o.contractNo); setLoanType(o.loanType); setForm(o.form) }

  const err: Record<string, string> = {}
  if (!org) err.org = 'กรุณาเลือกองค์กรชุมชน'
  if (!contractNo.trim()) err.contractNo = 'กรุณาระบุเลขที่สัญญา'
  if (!loanType) err.loanType = 'กรุณาเลือกประเภทสินเชื่อ'
  if (!form) err.form = 'กรุณาเลือกรูปแบบสัญญา'
  if (!(Number(amount.replace(/,/g, '')) > 0)) err.amount = 'กรุณาระบุวงเงินที่มากกว่า 0'
  if (!approveDate) err.approveDate = 'กรุณาระบุวันที่อนุมัติใบเบิก'
  if (!purpose.trim()) err.purpose = 'กรุณาระบุวัตถุประสงค์การเบิก'
  if (!payType) err.payType = 'กรุณาเลือกประเภทการจ่าย'
  if (payType === 'โอนเข้าบัญชีองค์กร') {
    if (!bank) err.bank = 'กรุณาเลือกธนาคาร'
    if (!acctName.trim()) err.acctName = 'กรุณาระบุชื่อบัญชี'
    if (!/^\d{10,12}$/.test(acctNo)) err.acctNo = 'เลขที่บัญชีต้องเป็นตัวเลข 10–12 หลัก'
  }
  if (!signers[0].name.trim() || !signers[0].pos) err.signer = 'กรุณาระบุผู้ลงนามอย่างน้อย 1 คน พร้อมตำแหน่ง'
  const e = tried ? err : {}
  const fmtAmount = (v: string) => { const n = v.replace(/[^\d.]/g, ''); const [a, b] = n.split('.'); return (a ? Number(a).toLocaleString('en-US') : '') + (b !== undefined ? '.' + b.slice(0, 2) : '') }

  const send = () => {
    setTried(true)
    if (Object.keys(err).length) return show('กรุณากรอกข้อมูลที่จำเป็นให้ครบและถูกต้อง')
    setSent(`LN-${new Date().getFullYear() + 543}-${String(Math.floor(Math.random() * 9000) + 1000)}`)
  }
  const setSigner = (i: number, p: Partial<Signer>) => setSigners((s) => s.map((x, j) => (j === i ? { ...x, ...p } : x)))

  return (
    <div className="flex w-full flex-col gap-[12px] px-[24px] pb-[55px] max-sm:px-[12px]">
      <BackTitle title="เบิกจ่ายสินเชื่อ" to="/dashboard" />

      <PmSection title="รายละเอียดองค์กรชุมชน">
        <div className="grid grid-cols-2 gap-x-[48px] gap-y-[18px] max-lg:grid-cols-1">
          <Row label="องค์กรชุมชน" req err={e.org}>
            <div className="relative">
              <input aria-label="องค์กรชุมชน" role="combobox" aria-expanded={matches.length > 0} placeholder="ค้นหาชื่อองค์กรชุมชน" value={q} onChange={(x) => { setQ(x.target.value); setOrg(null) }} className={`${field} pr-[42px] ${e.org ? bad : ''}`} />
              <img src={iconSearch} alt="" width={18} height={18} className="pointer-events-none absolute top-1/2 right-[14px] -translate-y-1/2" />
              {matches.length > 0 && (
                <ul role="listbox" className="absolute top-[calc(100%+4px)] left-0 z-20 w-full overflow-hidden rounded-[10px] border border-gray-line-2 bg-white p-[4px] shadow-lg">
                  {matches.map((o) => (
                    <li key={o.id}><button type="button" role="option" aria-selected="false" onClick={() => pick(o)} className="flex w-full flex-col rounded-[8px] px-[10px] py-[8px] text-left hover:bg-blue-bg"><span className="text-[13px]">{o.name}</span><span className="text-[11px] font-light text-gray-20">{o.contractNo} · {o.province}</span></button></li>
                  ))}
                </ul>
              )}
            </div>
          </Row>
          <Row label="เลขที่สัญญา" req err={e.contractNo}><input aria-label="เลขที่สัญญา" value={contractNo} onChange={(x) => setContractNo(x.target.value)} className={`${field} ${e.contractNo ? bad : ''}`} /></Row>
          <Row label="ประเภทสินเชื่อ" req err={e.loanType}><Select label="ประเภทสินเชื่อ" value={loanType} options={opt(loanTypes)} onChange={setLoanType} tone="subtle" /></Row>
          <Row label="รูปแบบสัญญา" req err={e.form}><Select label="รูปแบบสัญญา" value={form} options={opt(contractForms)} onChange={setForm} tone="subtle" /></Row>
          <div className="col-span-2 grid grid-cols-3 gap-[16px] max-lg:col-span-1 max-md:grid-cols-1">
            {([['ตำบล', org?.subdistrict], ['อำเภอ', org?.district], ['จังหวัด', org?.province]] as const).map(([l, v]) => (
              <div key={l} className="grid grid-cols-[70px_minmax(0,1fr)] items-center gap-[10px]">
                <span className="text-[14px] font-medium">{l}</span>
                <input aria-label={l} readOnly value={v ?? ''} className={ro} />
              </div>
            ))}
          </div>
        </div>
      </PmSection>

      <PmSection title="คำขอเบิกจ่ายสินเชื่อ">
        <div className="flex flex-col gap-[18px]">
          <Band>1. ข้อมูลทั่วไป</Band>
          <div className="grid grid-cols-2 gap-x-[48px] gap-y-[18px] max-lg:grid-cols-1">
            <Row label="วงเงินเบิกจ่ายงวดนี้ (บาท)" req err={e.amount}><input aria-label="วงเงินเบิกจ่ายงวดนี้" inputMode="decimal" value={amount} onChange={(x) => setAmount(fmtAmount(x.target.value))} className={`${field} text-right ${e.amount ? bad : ''}`} /></Row>
            <Row label="วันที่อนุมัติใบเบิก" req err={e.approveDate}><DateInput label="วันที่อนุมัติใบเบิก" value={approveDate} onChange={setApproveDate} /></Row>
          </div>
          <Row label="วัตถุประสงค์การเบิก" req err={e.purpose}><textarea aria-label="วัตถุประสงค์การเบิก" placeholder="ข้อความ..." value={purpose} onChange={(x) => setPurpose(x.target.value)} className={`${ta} ${e.purpose ? bad : ''}`} /></Row>
          <Row label="หมายเหตุ"><textarea aria-label="หมายเหตุ" placeholder="ข้อความ..." value={remark} onChange={(x) => setRemark(x.target.value)} className={ta} /></Row>

          <Band>2. ข้อมูลการจ่ายเงินให้องค์กร</Band>
          <div className="grid grid-cols-2 gap-x-[48px] gap-y-[18px] max-lg:grid-cols-1">
            <Row label="ประเภทการจ่าย" req err={e.payType}><Select label="ประเภทการจ่าย" value={payType} options={opt(payTypes)} onChange={setPayType} /></Row>
            <Row label="ธนาคาร" req={payType === 'โอนเข้าบัญชีองค์กร'} err={e.bank}><Select label="ธนาคาร" value={bank} options={opt(banks)} onChange={setBank} /></Row>
            <Row label="สาขา"><input aria-label="สาขา" value={branch} onChange={(x) => setBranch(x.target.value)} className={field} /></Row>
            <Row label="ประเภทบัญชี"><Select label="ประเภทบัญชี" value={acctType} options={opt(accountTypes)} onChange={setAcctType} /></Row>
            <Row label="ชื่อบัญชี" req={payType === 'โอนเข้าบัญชีองค์กร'} err={e.acctName}><input aria-label="ชื่อบัญชี" value={acctName} onChange={(x) => setAcctName(x.target.value)} className={`${field} ${e.acctName ? bad : ''}`} /></Row>
            <Row label="เลขที่บัญชี" req={payType === 'โอนเข้าบัญชีองค์กร'} err={e.acctNo}><input aria-label="เลขที่บัญชี" inputMode="numeric" maxLength={12} value={acctNo} onChange={(x) => setAcctNo(x.target.value.replace(/\D/g, ''))} className={`${field} ${e.acctNo ? bad : ''}`} /></Row>
          </div>

          <Band>3. ข้อมูลผู้ลงนาม</Band>
          {signers.map((s, i) => (
            <div key={i} className="grid grid-cols-[minmax(0,1fr)_minmax(0,1fr)_auto] items-start gap-x-[24px] gap-y-[8px] max-lg:grid-cols-1">
              <Row label={`ชื่อผู้ลงนาม ลำดับที่ ${i + 1}`} req={i === 0}><input aria-label={`ชื่อผู้ลงนาม ลำดับที่ ${i + 1}`} value={s.name} onChange={(x) => setSigner(i, { name: x.target.value })} className={`${field} ${i === 0 && e.signer ? bad : ''}`} /></Row>
              <Row label="ตำแหน่ง" req={i === 0}><Select label={`ตำแหน่งผู้ลงนาม ${i + 1}`} value={s.pos} options={opt(positions)} onChange={(v) => setSigner(i, { pos: v })} /></Row>
              {i === 0 ? (
                <button type="button" onClick={() => setSigners((x) => [...x, { name: '', pos: '' }])} className={`${primaryBtn} h-[46px] px-[16px] text-[13px]`}>+ เพิ่มผู้ลงนาม</button>
              ) : (
                <button type="button" aria-label={`ลบผู้ลงนามลำดับที่ ${i + 1}`} onClick={() => setSigners((x) => x.filter((_, j) => j !== i))} className="h-[46px] rounded-[8px] border border-gray-line px-[14px] text-[13px] text-gray-30 hover:border-red-00 hover:text-red-00">ลบ</button>
              )}
            </div>
          ))}
          {e.signer && <p role="alert" className="text-[12px] text-red-00">{e.signer}</p>}
          <Row label="แบบเอกสาร">
            <Upload label="นำเข้าเอกสาร" hint="ขนาดไม่เกิน 20 MB" accept=".pdf,.docx,.png,.jpg" value={doc} onChange={setDoc} />
          </Row>
        </div>
      </PmSection>

      <div className="flex justify-end gap-[8px]">
        <button type="button" onClick={() => setPreview(true)} className={`${softBtn} px-[18px] py-[11px] text-[14px]`}>ตัวอย่าง</button>
        <button type="button" onClick={send} className={`${primaryBtn} px-[20px] py-[11px] text-[14px]`}>ส่งเอกสาร</button>
      </div>

      <Modal open={preview} onClose={() => setPreview(false)} title="ตัวอย่างคำขอเบิกจ่ายสินเชื่อ" width="max-w-[640px]">
        <dl className="grid max-h-[60vh] grid-cols-[150px_minmax(0,1fr)] gap-x-[12px] gap-y-[8px] overflow-y-auto text-[13px]">
          {[
            ['องค์กรชุมชน', org?.name], ['เลขที่สัญญา', contractNo], ['ประเภทสินเชื่อ', loanType], ['รูปแบบสัญญา', form],
            ['วงเงินเบิกจ่ายงวดนี้', amount && amount + ' บาท'], ['วันที่อนุมัติใบเบิก', approveDate], ['วัตถุประสงค์', purpose], ['หมายเหตุ', remark],
            ['ประเภทการจ่าย', payType], ['ธนาคาร / สาขา', [bank, branch].filter(Boolean).join(' / ')], ['ชื่อบัญชี', acctName], ['เลขที่บัญชี', acctNo],
            ['ผู้ลงนาม', signers.filter((s) => s.name).map((s) => `${s.name} (${s.pos || '-'})`).join(', ')], ['เอกสารแนบ', doc],
          ].map(([k, v]) => (
            <div key={k} className="contents"><dt className="font-semibold text-gray-30">{k}</dt><dd className="font-light break-words">{v || '-'}</dd></div>
          ))}
        </dl>
      </Modal>
      <Modal open={!!sent} onClose={() => setSent(undefined)} title="ส่งเอกสารเรียบร้อย" width="max-w-[420px]">
        <p className="text-[14px] leading-[1.7] font-light">ส่งคำขอเบิกจ่ายสินเชื่อของ <b className="font-semibold">{org?.name}</b> แล้ว<br />เลขที่คำขอ <b className="font-urbanist font-semibold text-blue-00">{sent}</b></p>
        <button type="button" onClick={() => setSent(undefined)} className={`${primaryBtn} self-end px-[22px] py-[9px] text-[13px]`}>ตกลง</button>
      </Modal>
      {toast}
    </div>
  )
}
