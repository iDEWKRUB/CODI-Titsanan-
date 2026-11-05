import { useMemo, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import iconPlus from '../assets/survey/icon-plus.svg'
import iconTor from '../assets/tor/icon-clipboard-check.svg'
import { fmtBaht, pmPage, RoleSwitch } from '../components/pm/Parts'
import { softBtn } from '../components/leader/Parts'
import Modal from '../components/ui/Modal'
import PageTitle from '../components/ui/PageTitle'
import Pagination from '../components/ui/Pagination'
import { disbStatusLabel } from '../data/projects'
import { createDisbursement, useDisbursements, usePmRole, useProjects } from '../lib/projectStore'

const PAGE_SIZE = 8
const tone = { draft: 'bg-blue-20 text-blue-00', submitted: 'bg-yellow text-gray-bg', reviewed: 'bg-green text-gray-bg' }

/** Menu "เบิกจ่ายงบประมาณโครงการ": every disbursement request, newest first */
export default function DisbursementListPage() {
  const disbs = useDisbursements()
  const projects = useProjects()
  const role = usePmRole()
  const navigate = useNavigate()
  const [pick, setPick] = useState(false)
  const [pg, setPg] = useState(1)

  const rows = useMemo(() => [...disbs].filter((d) => role === 'community' || d.status !== 'draft').sort((a, b) => b.id - a.id), [disbs, role])
  const eligible = projects.filter((p) => p.status === 'approved' || p.status === 'open')
  const pageCount = Math.max(1, Math.ceil(rows.length / PAGE_SIZE))
  const current = Math.min(pg, pageCount)
  const visible = rows.slice((current - 1) * PAGE_SIZE, current * PAGE_SIZE)
  const nameOf = (id: number) => projects.find((p) => p.id === id)

  return (
    <div className={pmPage}>
      <div className="flex flex-wrap items-center gap-[12px]">
        <div className="min-w-0 flex-1">
          <PageTitle icon={iconTor}>เบิกจ่ายงบประมาณโครงการ</PageTitle>
        </div>
        <RoleSwitch />
      </div>
      <div className="flex flex-wrap items-center gap-[12px] pt-[12px]">
        <h2 className="min-w-0 flex-1 text-[20px] leading-[1.2] font-semibold text-blue-00">รายการใบเบิก</h2>
        {role === 'community' && (
          <button type="button" className={softBtn} onClick={() => setPick(true)}>
            <img src={iconPlus} alt="" width={14} height={14} className="[filter:invert(36%)_sepia(98%)_saturate(2879%)_hue-rotate(200deg)]" />
            ขอเบิกจ่าย
          </button>
        )}
      </div>

      <section className="rounded-[12px] border border-gray-line-2 bg-white p-[12px]" aria-label="รายการใบเบิก">
        <div className="overflow-x-auto max-md:hidden">
          <table className="w-full min-w-[760px] text-left text-[12px] font-light">
            <thead>
              <tr className="text-[10px] text-gray-20">
                {['เลขที่ใบเบิก', 'โครงการ', 'งวดที่', 'จำนวนเงิน (บาท)', 'วันที่สร้าง', 'สถานะ'].map((h) => (
                  <th key={h} className="px-[8px] py-[10px] font-light">
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {visible.map((d) => (
                <tr key={d.id} onClick={() => navigate(`/disbursement/${d.id}`)} className="cursor-pointer border-t border-gray-line hover:bg-blue-bg/50">
                  <td className="px-[8px] py-[14px]">
                    <Link to={`/disbursement/${d.id}`} className="font-normal hover:text-blue-00 hover:underline" onClick={(e) => e.stopPropagation()}>
                      DB-{String(d.id).padStart(4, '0')}
                    </Link>
                  </td>
                  <td className="max-w-[320px] truncate px-[8px]">{nameOf(d.projectId)?.name || '–'}</td>
                  <td className="px-[8px]">{d.period}</td>
                  <td className="px-[8px] text-right font-urbanist">{fmtBaht(d.amount)}</td>
                  <td className="px-[8px]">{d.createdAt}</td>
                  <td className="px-[8px]">
                    <span className={`inline-flex min-w-[88px] justify-center rounded-[6px] px-[8px] py-[4px] text-[12px] ${tone[d.status]}`}>{disbStatusLabel[d.status]}</span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <ul className="md:hidden">
          {visible.map((d, i) => (
            <li key={d.id} className={i > 0 ? 'border-t border-gray-line' : ''}>
              <Link to={`/disbursement/${d.id}`} className="flex flex-col gap-[4px] px-[8px] py-[12px]">
                <span className="flex items-center gap-[8px]">
                  <b className="flex-1 text-[13px] font-medium">DB-{String(d.id).padStart(4, '0')} · งวด {d.period}</b>
                  <span className={`rounded-[6px] px-[8px] py-[2px] text-[11px] ${tone[d.status]}`}>{disbStatusLabel[d.status]}</span>
                </span>
                <span className="text-[12px] font-light text-gray-30">{nameOf(d.projectId)?.name}</span>
                <span className="font-urbanist text-[12px]">{fmtBaht(d.amount)} บาท</span>
              </Link>
            </li>
          ))}
        </ul>
        {rows.length === 0 && <p className="py-[40px] text-center text-[13px] text-gray-20">ยังไม่มีใบเบิก{role === 'community' ? ' กด “ขอเบิกจ่าย” เพื่อสร้างใบเบิกของโครงการที่อนุมัติแล้ว' : ''}</p>}
      </section>
      <Pagination page={current} pageCount={pageCount} onChange={setPg} />

      <Modal open={pick} title="เลือกโครงการที่ต้องการเบิกจ่าย" onClose={() => setPick(false)}>
        {eligible.length === 0 ? (
          <p className="text-[13px] font-light text-gray-20">ยังไม่มีโครงการที่ได้รับอนุมัติ ต้องยื่นเสนอโครงการและรอเจ้าหน้าที่อนุมัติก่อน</p>
        ) : (
          <ul className="flex max-h-[360px] flex-col gap-[6px] overflow-y-auto">
            {eligible.map((p) => (
              <li key={p.id}>
                <button type="button" onClick={() => navigate(`/disbursement/${createDisbursement(p)}`)} className="flex w-full flex-col gap-[2px] rounded-[10px] border border-gray-line px-[14px] py-[10px] text-left hover:border-blue-10 hover:bg-blue-bg">
                  <span className="text-[14px] font-medium">{p.name}</span>
                  <span className="text-[12px] font-light text-gray-20">
                    {p.code} · งบ {fmtBaht(p.budget)} บาท
                  </span>
                </button>
              </li>
            ))}
          </ul>
        )}
      </Modal>
    </div>
  )
}
