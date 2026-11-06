import type { ReactNode } from 'react'
import { money, thDate, typeOf, type Contract } from '../../data/erpAgreement'
import Modal from '../ui/Modal'
import { CPill, ContractViewer, DuePill, GI, Ic } from './Parts'

const ib = 'flex size-[30px] items-center justify-center rounded-[8px] border border-gray-line-2 text-gray-30 transition hover:border-blue-20 hover:bg-blue-bg hover:text-blue-00 focus-visible:outline-2 focus-visible:outline-blue-00'
const stampTh = (s: string) => s.slice(0, 10).split('-').reverse().join('/').replace(/\/(\d{4})$/, (_, y) => `/${Number(y) + 543}`) + (s.length > 10 ? ` ${s.slice(11)}` : '')

type Props = {
  rows: Contract[]
  showDue?: boolean
  can: (c: Contract) => { edit: boolean; del: boolean }
  onView: (c: Contract) => void
  onEdit: (c: Contract) => void
  onCopy: (c: Contract) => void
  onDelete: (c: Contract) => void
  extra?: (c: Contract) => ReactNode
  empty?: string
}

/** shared list used by the overview, the registry and the review queue (book figs 2-117, 2-120, 2-123) */
export function ContractTable({ rows, showDue, can, onView, onEdit, onCopy, onDelete, extra, empty = 'ไม่พบรายการสัญญา' }: Props) {
  const Actions = ({ c }: { c: Contract }) => {
    const p = can(c)
    return (
      <div className="flex items-center justify-end gap-[6px]">
        {extra?.(c)}
        <button type="button" aria-label={`ดูรายละเอียด ${c.no}`} title="ดูรายละเอียด" onClick={() => onView(c)} className={ib}><Ic d={GI.eye} s={15} /></button>
        {p.edit && <button type="button" aria-label={`แก้ไข ${c.no}`} title="แก้ไข" onClick={() => onEdit(c)} className={ib}><Ic d={GI.edit} s={15} /></button>}
        <button type="button" aria-label={`คัดลอก ${c.no}`} title="คัดลอกรายการ" onClick={() => onCopy(c)} className={ib}><Ic d={GI.copy} s={15} /></button>
        {p.del && <button type="button" aria-label={`ลบ ${c.no}`} title="ลบรายการ" onClick={() => onDelete(c)} className={`${ib} hover:!border-[#f0b4b4] hover:!bg-[#fff1f1] hover:!text-[#c13232]`}><Ic d={GI.trash} s={15} /></button>}
      </div>
    )
  }
  return (
    <>
      <div className="overflow-x-auto max-md:hidden">
        <table className="w-full min-w-[860px] text-left text-[12px]">
          <thead className="text-[11px] text-gray-20"><tr>{['วันที่สร้าง', 'เรื่อง', 'เลขที่สัญญา', 'แก้ไขล่าสุด', 'สถานะ', ...(showDue ? ['กำหนด'] : []), ''].map((h, i) => <th key={i} className="border-b border-gray-line-2 pb-[8px] pr-[10px] font-medium whitespace-nowrap">{h}</th>)}</tr></thead>
          <tbody>
            {rows.map((c) => (
              <tr key={c.id} className="border-b border-gray-line-2 last:border-0 hover:bg-[#f7faff]">
                <td className="py-[10px] pr-[10px] whitespace-nowrap font-urbanist text-gray-30">{stampTh(c.createdAt)}</td>
                <td className="max-w-[300px] py-[10px] pr-[10px]"><p className="text-[13px] leading-[1.4] font-medium">{c.title}</p><p className="text-[11px] font-light text-gray-20">{`${typeOf(c.type).tag} · ${c.party.name || 'ยังไม่ระบุคู่สัญญา'}`}</p></td>
                <td className="py-[10px] pr-[10px] whitespace-nowrap font-urbanist">{c.no}</td>
                <td className="py-[10px] pr-[10px] whitespace-nowrap font-urbanist text-gray-30">{stampTh(c.updatedAt)}</td>
                <td className="py-[10px] pr-[10px]"><CPill s={c.status} /></td>
                {showDue && <td className="py-[10px] pr-[10px]"><DuePill c={c} /></td>}
                <td className="py-[10px]"><Actions c={c} /></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <ul className="flex flex-col gap-[10px] md:hidden">
        {rows.map((c) => (
          <li key={c.id} className="flex flex-col gap-[10px] rounded-[12px] border border-gray-line-2 p-[12px]">
            <div className="flex items-start gap-[10px]"><div className="min-w-0 flex-1"><p className="text-[13px] leading-[1.4] font-semibold">{c.title}</p><p className="text-[11px] font-light text-gray-20">{`${c.no} · ${c.party.name || 'ยังไม่ระบุคู่สัญญา'}`}</p></div><CPill s={c.status} /></div>
            <p className="text-[11px] font-light text-gray-30">{`สร้าง ${stampTh(c.createdAt)} · แก้ไขล่าสุด ${stampTh(c.updatedAt)}`}{showDue && <> · <DuePill c={c} /></>}</p>
            <Actions c={c} />
          </li>
        ))}
      </ul>
      {!rows.length && <p className="py-[28px] text-center text-[13px] font-light text-gray-20">{empty}</p>}
    </>
  )
}

/** full contract details in a popup: facts, signed-file chip, document preview and history */
export function ContractDetail({ c }: { c: Contract }) {
  const rows: [string, string][] = [
    ['เลขที่สัญญา', c.no],
    ['ประเภท', typeOf(c.type).label],
    ['คู่สัญญา (ผู้รับจ้าง)', c.party.name || '—'],
    ['เลขผู้เสียภาษี', c.party.taxId || '—'],
    ['ผู้มีอำนาจลงนามฝ่ายคู่สัญญา', c.party.signer ? `${c.party.signer}${c.party.position ? ` (${c.party.position})` : ''}` : '—'],
    ['ระยะเวลา', c.start ? `${thDate(c.start)} – ${thDate(c.end)}` : '—'],
    ['มูลค่าสัญญา', c.value ? `${money(c.value)} บาท` : 'ไม่มีวงเงินผูกพัน'],
    ['หน่วยงานเจ้าของสัญญา', c.owner || '—'],
    ['ผู้รับผิดชอบสัญญา', c.resp || '—'],
    ['วันที่ลงนาม', c.signDate ? thDate(c.signDate) : '—'],
  ]
  return (
    <div className="flex flex-col gap-[14px]">
      <div className="flex items-start gap-[12px]"><div className="min-w-0 flex-1"><p className="text-[15px] leading-[1.4] font-semibold">{c.title}</p>{c.purpose && <p className="text-[12px] font-light text-gray-30">{c.purpose}</p>}</div><CPill s={c.status} /></div>
      <dl className="grid grid-cols-2 gap-x-[16px] gap-y-[8px] rounded-[12px] bg-gray-subtle p-[14px] text-[12px] max-sm:grid-cols-1">
        {rows.map(([k, v]) => <div key={k} className="flex flex-col"><dt className="text-[11px] font-light text-gray-20">{k}</dt><dd className="font-medium break-words">{v}</dd></div>)}
      </dl>
      {c.file && <p className="flex w-fit items-center gap-[6px] rounded-full bg-blue-bg px-[10px] py-[4px] text-[11px] text-blue-dark"><Ic d={GI.clip} s={13} />{c.file}</p>}
      {c.notes.length > 0 && (
        <div className="rounded-[12px] border border-[#f0b4b4] bg-[#fff6f6] p-[12px]">
          <p className="mb-[4px] text-[12px] font-semibold text-[#c13232]">ข้อคิดเห็นจากนิติกร</p>
          <ul className="flex flex-col gap-[4px] text-[12px]">{c.notes.map((n, i) => <li key={i}><b className="font-semibold">{n.page === 0 ? "ความเห็นทั่วไป" : `หน้า ${n.page}`}:</b> {n.text}</li>)}</ul>
        </div>
      )}
      <ContractViewer type={c.type} c={c} label="เอกสารสัญญา" />
      <div>
        <p className="mb-[8px] text-[13px] font-semibold">ประวัติการดำเนินการ</p>
        <ol className="relative flex flex-col gap-[10px] border-l-2 border-blue-20 pl-[16px]">
          {c.history.map((h, i) => (
            <li key={i} className="relative">
              <span className={`absolute top-[4px] -left-[22px] size-[10px] rounded-full ring-4 ring-white ${i === c.history.length - 1 ? 'bg-blue-00' : 'bg-blue-20'}`} />
              <p className="text-[12px] font-medium">{h.action} <span className="font-light text-gray-30">· {h.by}</span></p>
              <p className="text-[11px] font-light text-gray-20">{h.at}</p>
              {h.note && <p className="mt-[2px] rounded-[8px] bg-gray-subtle px-[10px] py-[6px] text-[12px] font-light text-gray-30">{h.note}</p>}
            </li>
          ))}
        </ol>
      </div>
    </div>
  )
}

export function DeleteModal({ c, onClose, onConfirm }: { c?: Contract; onClose: () => void; onConfirm: () => void }) {
  return (
    <Modal open={!!c} onClose={onClose} title="ลบรายการสัญญา" width="max-w-[420px]">
      {c && (
        <div className="flex flex-col gap-[16px]">
          <p className="text-[13px] leading-[1.6] font-light text-gray-30">ต้องการลบสัญญา <b className="font-semibold text-black">{c.no}</b> “{c.title}” ใช่หรือไม่ การลบไม่สามารถกู้คืนได้</p>
          <div className="flex justify-end gap-[8px]">
            <button type="button" onClick={onClose} className="h-[38px] rounded-[8px] border border-gray-line px-[16px] text-[13px] hover:border-gray-10">ยกเลิก</button>
            <button type="button" onClick={onConfirm} className="h-[38px] rounded-[8px] bg-[#e5484d] px-[16px] text-[13px] font-medium text-white hover:brightness-110">ลบรายการ</button>
          </div>
        </div>
      )}
    </Modal>
  )
}
