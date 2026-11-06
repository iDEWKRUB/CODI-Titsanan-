import { useEffect, useMemo, useState } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { useToast } from '../components/leader/Parts'
import Select from '../components/ui/Select'
import { BasicInfo, Btn, Crumbs, DocViewer, FComment, FPersonaSwitch, FStatus, Gate, Radios, Section, Title, TypeSection, page } from '../components/finance/Parts'
import { fPersonas, loanTotal, money, thDate } from '../data/erpFinance'
import { decideLoan, useFPersona, useLoans } from '../lib/erpFinanceStore'

type D = 'approve' | 'reject' | 'return'
const label: Record<D, string> = { approve: 'อนุมัติ', reject: 'ไม่อนุมัติ', return: 'ส่งกลับแก้ไข' }

/** อนุมัติยืมเงิน (book 3 fig 2-20) — 2.1.4.3 ; the approver reads the loan and its documents and approves, rejects or sends it back */
export default function FinanceApprovePage() {
  const me = useFPersona()
  const all = useLoans()
  const [sp] = useSearchParams()
  const navigate = useNavigate()
  const [toast, show] = useToast()
  const open = useMemo(() => all.filter((l) => l.status === 'submitted'), [all])
  const [id, setId] = useState(Number(sp.get('id')) || 0)
  const cur = all.find((l) => l.id === id)
  const [d, setD] = useState<D>('approve')
  const [reason, setReason] = useState('')
  const [tried, setTried] = useState(false)
  const allowed = me === 'approver'
  const done = !!cur && cur.status !== 'submitted'

  useEffect(() => {
    if (!id && open[0]) setId(open[0].id)
  }, [id, open])
  useEffect(() => {
    setD(cur?.decision?.decision ?? 'approve')
    setReason(cur?.decision?.reason ?? '')
    setTried(false)
  }, [id]) // eslint-disable-line react-hooks/exhaustive-deps

  const need = d !== 'approve' && !reason.trim()
  const save = () => {
    if (!allowed) return show('ต้องเป็นผู้มีอำนาจอนุมัติ')
    if (!cur) return show('ไม่มีรายการที่รออนุมัติ')
    setTried(true)
    if (need) return show('กรุณาระบุเหตุผลประกอบการพิจารณา')
    decideLoan(cur.id, d, reason.trim() || 'เห็นสมควรได้รับการอนุมัติ', fPersonas.approver.name)
    show(`${label[d]} ${cur.no} · ส่งแจ้งเตือนถึง ${cur.requester} แล้ว`)
    setTimeout(() => navigate('/finance'), 1300)
  }

  return (
    <div className={`${page} items-center`}>
      <div className="flex w-full max-w-[860px] flex-col gap-[12px]">
        <Title back="/finance" right={<FPersonaSwitch />}>ยืมเงิน</Title>
        <Crumbs items={[{ label: 'หน้าแรก', to: '/finance' }, { label: 'อนุมัติยืมเงิน' }]} />
        <Gate allowed={allowed} need="ผู้มีอำนาจอนุมัติ" />

        <div className="flex flex-wrap items-center gap-[10px]">
          <span className="text-[12px] font-semibold">เอกสาร</span>
          <div className="w-[420px] max-sm:w-full">
            <Select label="เลือกเอกสารที่รออนุมัติ" value={cur ? String(cur.id) : ''} placeholder={open.length ? 'เลือกเอกสาร' : 'ไม่มีเอกสารที่รออนุมัติ'} options={(cur && done ? [cur, ...open] : open).map((l) => ({ value: String(l.id), label: `${l.no} · ${l.requester} · ${money(loanTotal(l))} บาท` }))} onChange={(v) => setId(Number(v))} />
          </div>
          {cur && <FStatus s={cur.status} />}
          <span className="text-[12px] font-light text-gray-20">รออนุมัติ {open.length} รายการ</span>
        </div>

        {cur ? (
          <>
            <TypeSection v={cur.type} />
            <BasicInfo l={cur} />
            <DocViewer l={cur} />
            <Section title="พิจารณาอนุมัติ/ไม่อนุมัติ" tone="blue">
              {done && cur.decision && <p role="status" className="text-[12px] font-light text-gray-30">พิจารณาแล้วโดย {cur.decision.by} เมื่อ {thDate(cur.decision.at)} {cur.decision.at.slice(11)}</p>}
              <Radios label="ผลการพิจารณา" value={d} options={(Object.keys(label) as D[]).map((k) => ({ key: k, label: label[k] }))} onChange={(k) => setD(k as D)} disabled={!allowed || done} />
              <FComment label="เหตุผลประกอบการอนุมัติ / ไม่อนุมัติ / ส่งกลับแก้ไข" value={reason} onChange={setReason} disabled={!allowed || done} error={tried && need ? 'กรุณาระบุเหตุผล (กรณีไม่อนุมัติหรือส่งกลับแก้ไข)' : undefined} />
            </Section>
            <div className="flex justify-end gap-[10px]">
              <Btn kind="ghost" onClick={() => navigate('/finance')}>ยกเลิก</Btn>
              <Btn onClick={save} disabled={done}>บันทึก</Btn>
            </div>
          </>
        ) : (
          <p className="rounded-[12px] border border-dashed border-gray-line bg-white py-[48px] text-center text-[13px] font-light text-gray-20">ยังไม่มีเอกสารที่รออนุมัติ</p>
        )}
      </div>
      {toast}
    </div>
  )
}
