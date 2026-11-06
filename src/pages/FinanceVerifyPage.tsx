import { useEffect, useMemo, useState } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { useToast } from '../components/leader/Parts'
import Select from '../components/ui/Select'
import { BasicInfo, Btn, Crumbs, DocViewer, FComment, FPersonaSwitch, FStatus, Gate, Radios, Section, Title, TypeSection, page } from '../components/finance/Parts'
import { fPersonas, loanTotal, money, thDate } from '../data/erpFinance'
import { useFPersona, useLoans, verifyLoan } from '../lib/erpFinanceStore'

const advice = ['เอกสารครบถ้วน ถูกต้อง', 'กรุณาแก้ไขตามคำแนะนำ']

/** ตรวจสอบเงินยืม (book 3 fig 2-21) — 2.1.4.4 ; the finance office checks an approved loan and passes it or sends it back with advice */
export default function FinanceVerifyPage() {
  const me = useFPersona()
  const all = useLoans()
  const [sp] = useSearchParams()
  const navigate = useNavigate()
  const [toast, show] = useToast()
  const open = useMemo(() => all.filter((l) => l.status === 'approved'), [all])
  const [id, setId] = useState(Number(sp.get('id')) || 0)
  const cur = all.find((l) => l.id === id)
  const [note, setNote] = useState('')
  const [tried, setTried] = useState(false)
  const allowed = me === 'finance'
  const done = !!cur && cur.status !== 'approved'

  useEffect(() => {
    if (!id && open[0]) setId(open[0].id)
  }, [id, open])
  useEffect(() => {
    setNote(cur?.verify?.note ?? '')
    setTried(false)
  }, [id]) // eslint-disable-line react-hooks/exhaustive-deps

  const act = (pass: boolean) => {
    if (!allowed) return show('ต้องเป็นเจ้าหน้าที่สำนักการเงินและบัญชี')
    if (!cur) return show('ไม่มีรายการที่รอตรวจสอบ')
    setTried(true)
    if (!pass && !note.trim()) return show('กรุณาระบุคำแนะนำในการแก้ไข')
    verifyLoan(cur.id, pass, note.trim() || 'เอกสารครบถ้วน ถูกต้อง', fPersonas.finance.name)
    show(pass ? `ผ่านการตรวจสอบ ${cur.no} · แจ้งผู้ยืมแล้ว` : `ส่งกลับแก้ไข ${cur.no} · แจ้งผู้ยืมแล้ว`)
    setTimeout(() => navigate('/finance'), 1300)
  }

  return (
    <div className={`${page} items-center`}>
      <div className="flex w-full max-w-[860px] flex-col gap-[12px]">
        <Title back="/finance" right={<FPersonaSwitch />}>ตรวจสอบเงินยืม</Title>
        <Crumbs items={[{ label: 'หน้าแรก', to: '/finance' }, { label: 'ตรวจสอบเงินยืม' }]} />
        <Gate allowed={allowed} need="เจ้าหน้าที่สำนักการเงินและบัญชี" />

        <div className="flex flex-wrap items-center gap-[10px]">
          <span className="text-[12px] font-semibold">เอกสาร</span>
          <div className="w-[420px] max-sm:w-full">
            <Select label="เลือกเอกสารที่รอตรวจสอบ" value={cur ? String(cur.id) : ''} placeholder={open.length ? 'เลือกเอกสาร' : 'ไม่มีเอกสารที่รอตรวจสอบ'} options={(cur && done ? [cur, ...open] : open).map((l) => ({ value: String(l.id), label: `${l.no} · ${l.requester} · ${money(loanTotal(l))} บาท` }))} onChange={(v) => setId(Number(v))} />
          </div>
          {cur && <FStatus s={cur.status} />}
          <span className="text-[12px] font-light text-gray-20">รอตรวจสอบ {open.length} รายการ</span>
        </div>

        {cur ? (
          <>
            <TypeSection v={cur.type} />
            <BasicInfo l={cur} />
            <DocViewer l={cur} />
            <Section title="พิจารณาอนุมัติ/ไม่อนุมัติ" tone="blue">
              <Radios label="ผลการพิจารณาของผู้มีอำนาจ" value={cur.decision?.decision ?? 'approve'} options={[{ key: 'approve', label: 'อนุมัติ' }, { key: 'reject', label: 'ไม่อนุมัติ' }, { key: 'return', label: 'ส่งกลับแก้ไข' }]} onChange={() => undefined} disabled />
              <p className="rounded-[10px] bg-white px-[14px] py-[10px] text-[12px] font-light text-gray-30">เหตุผล: {cur.decision?.reason || '-'} <span className="text-gray-20">· {cur.decision?.by} {cur.decision ? thDate(cur.decision.at) + " " + cur.decision.at.slice(11) : ""}</span></p>
            </Section>
            <Section title="สำหรับเจ้าหน้าที่">
              <FComment label="กรุณาแก้ไขตามคำแนะนำ" value={note} onChange={setNote} disabled={!allowed || done} chips={advice} error={tried && !note.trim() ? 'ระบุคำแนะนำก่อนส่งกลับแก้ไข' : undefined} />
            </Section>
            <div className="flex justify-end gap-[10px]">
              <Btn kind="ghost" onClick={() => navigate('/finance')}>ยกเลิก</Btn>
              <Btn kind="outline" onClick={() => act(false)} disabled={done}>ส่งกลับแก้ไข</Btn>
              <Btn onClick={() => act(true)} disabled={done}>ผ่านการตรวจสอบ</Btn>
            </div>
          </>
        ) : (
          <p className="rounded-[12px] border border-dashed border-gray-line bg-white py-[48px] text-center text-[13px] font-light text-gray-20">ยังไม่มีเอกสารที่รอตรวจสอบ</p>
        )}
      </div>
      {toast}
    </div>
  )
}
