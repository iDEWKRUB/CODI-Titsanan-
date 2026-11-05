import { useMemo, useRef, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import iconSearch from '../assets/dashboard/icon-search.svg'
import iconSort from '../assets/dashboard/icon-sort.svg'
import iconCopy from '../assets/survey/icon-copy.svg'
import iconEye from '../assets/survey/icon-eye.svg'
import iconPen from '../assets/survey/icon-pen.svg'
import iconPlus from '../assets/survey/icon-plus.svg'
import iconTrash from '../assets/survey/icon-trash.svg'
import CertTemplate from '../components/leader/CertTemplate'
import { BackTitle, Board, ConfirmDialog, primaryBtn, softBtn, useToast } from '../components/leader/Parts'
import Modal from '../components/ui/Modal'
import Pagination from '../components/ui/Pagination'
import Select from '../components/ui/Select'
import { certTemplates, thaiLong, type Certificate } from '../data/leader'
import { deleteCert, nextCertId, saveCert, useCertLog, useCerts } from '../lib/leaderStore'

const PAGE_SIZE = 5
const grid = 'grid grid-cols-[28px_minmax(0,1.6fr)_minmax(0,1fr)_80px_110px_110px_150px] items-center gap-[12px] px-[10px]'

/** Opens the browser print dialog with only the certificate in it */
export function printCertificate(svg: SVGElement | null) {
  if (!svg) return
  const w = window.open('', '_blank', 'width=900,height=700')
  if (!w) return
  w.document.write(`<html><head><title>ใบรับรอง</title><style>@page{size:A4 landscape;margin:0}body{margin:0}svg{width:100vw;height:auto}</style></head><body>${svg.outerHTML}</body></html>`)
  w.document.close()
  w.focus()
  setTimeout(() => w.print(), 300)
}

export function CertPreview({ cert, onClose }: { cert: Pick<Certificate, 'name' | 'template' | 'issueDate' | 'signerFirst' | 'signerLast'> | null; onClose: () => void }) {
  const box = useRef<HTMLDivElement>(null)
  return (
    <Modal open={!!cert} title="ตัวอย่างใบรับรอง" onClose={onClose} width="max-w-[720px]">
      {cert && (
        <>
          <div ref={box} className="overflow-hidden rounded-[10px] border border-gray-line">
            <CertTemplate index={cert.template} course={cert.name || 'ชื่อหลักสูตร'} date={cert.issueDate ? thaiLong(cert.issueDate) : ''} signer={`${cert.signerFirst} ${cert.signerLast}`.trim()} className="block w-full" />
          </div>
          <div className="flex justify-end gap-[8px]">
            <button type="button" className={softBtn} onClick={onClose}>
              ปิด
            </button>
            <button type="button" className={primaryBtn} onClick={() => printCertificate(box.current?.querySelector('svg') ?? null)}>
              พิมพ์ / บันทึก PDF
            </button>
          </div>
        </>
      )}
    </Modal>
  )
}

export default function LeaderCertPage() {
  const certs = useCerts()
  const log = useCertLog()
  const navigate = useNavigate()
  const [query, setQuery] = useState('')
  const [year, setYear] = useState('all')
  const [tpl, setTpl] = useState('all')
  const [pg, setPg] = useState(1)
  const [sel, setSel] = useState<Set<number>>(new Set())
  const [view, setView] = useState<Certificate | null>(null)
  const [del, setDel] = useState<Certificate | null>(null)
  const [toast, showToast] = useToast()

  const years = [...new Set(certs.map((c) => c.year))].sort().reverse()
  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase()
    return certs.filter((c) => (year === 'all' || c.year === year) && (tpl === 'all' || String(c.template) === tpl) && (!q || c.name.toLowerCase().includes(q)))
  }, [certs, query, year, tpl])
  const pageCount = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE))
  const current = Math.min(pg, pageCount)
  const rows = filtered.slice((current - 1) * PAGE_SIZE, current * PAGE_SIZE)

  const act = 'flex size-[24px] items-center justify-center rounded-[6px] transition-colors hover:bg-blue-bg focus-visible:outline-2 focus-visible:outline-blue-00'
  const badge = (c: Certificate) => <span className={`inline-flex w-[78px] justify-center rounded-[6px] px-[8px] py-[4px] text-[11px] font-medium ${c.status === 'published' ? 'bg-green text-white-soft' : 'bg-blue-20 text-blue-00'}`}>{c.status === 'published' ? 'เผยแพร่' : 'ร่าง'}</span>
  const actions = (c: Certificate) => (
    <div className="flex items-center justify-end gap-[6px]">
      <button type="button" className={act} aria-label={`ดู ${c.name}`} onClick={() => setView(c)}>
        <img src={iconEye} alt="" width={16} height={16} />
      </button>
      <button type="button" className={act} aria-label={`แก้ไข ${c.name}`} onClick={() => navigate(`/leader/certificate/${c.id}/edit`)}>
        <img src={iconPen} alt="" width={16} height={16} />
      </button>
      <button
        type="button"
        className={act}
        aria-label={`ทำสำเนา ${c.name}`}
        onClick={() => {
          saveCert({ ...c, id: nextCertId(), name: `${c.name} (สำเนา)`, status: 'draft', createdAt: new Date().toISOString().slice(0, 10) })
          setPg(1)
          showToast('ทำสำเนาแล้ว')
        }}
      >
        <img src={iconCopy} alt="" width={16} height={16} />
      </button>
      <button type="button" className={act} aria-label={`ลบ ${c.name}`} onClick={() => setDel(c)}>
        <img src={iconTrash} alt="" width={16} height={16} />
      </button>
    </div>
  )

  return (
    <div className="flex w-full flex-col gap-[12px] px-[24px] pb-[55px] max-sm:px-[12px] max-sm:pb-[25px]">
      <BackTitle title="ออกใบรับรอง" to="/leader" />

      <div className="flex flex-wrap items-center gap-[8px]">
        <label className="flex w-[283px] min-w-0 items-center gap-[6px] rounded-[8px] border border-gray-line bg-gray-subtle px-[16px] py-[10px] transition-colors focus-within:border-blue-00 focus-within:bg-white max-sm:w-full">
          <span className="sr-only">ค้นหาใบรับรอง</span>
          <input type="search" value={query} onChange={(e) => (setQuery(e.target.value), setPg(1))} placeholder="ค้นหา" className="min-w-0 flex-1 bg-transparent text-[12px] font-light text-gray-30 outline-none placeholder:text-gray-20 [&::-webkit-search-cancel-button]:hidden" />
          <img src={iconSearch} alt="" width={18} height={18} />
        </label>
        <Select label="ประจำปี" className="w-[150px]" tone="subtle" value={year} options={[{ value: 'all', label: 'ทุกปี' }, ...years.map((y) => ({ value: y, label: `ประจำปี ${y}` }))]} onChange={(v) => (setYear(v), setPg(1))} />
        <Select label="เทมเพลต" className="w-[190px]" tone="subtle" value={tpl} options={[{ value: 'all', label: 'ทุกเทมเพลต' }, ...certTemplates.map((t, i) => ({ value: String(i), label: t }))]} onChange={(v) => (setTpl(v), setPg(1))} />
        <Link to="/leader/certificate/create" className={`${softBtn} ml-auto max-sm:ml-0 max-sm:w-full`}>
          <img src={iconPlus} alt="" width={14} height={14} className="[filter:invert(36%)_sepia(98%)_saturate(2879%)_hue-rotate(200deg)]" />
          สร้างใบรับรอง
        </Link>
      </div>

      <Board title="ใบรับรอง" bare>
        <div className="rounded-[12px] bg-white p-[12px]">
          <div className="overflow-x-auto max-md:hidden">
            <div role="table" aria-label="ใบรับรอง" className="min-w-[800px]">
              <div role="row" className={`${grid} py-[10px] text-[10px] font-light text-gray-20`}>
                <input type="checkbox" aria-label="เลือกทั้งหมดในหน้านี้" checked={rows.length > 0 && rows.every((r) => sel.has(r.id))} onChange={(e) => setSel((s) => { const n = new Set(s); rows.forEach((r) => (e.target.checked ? n.add(r.id) : n.delete(r.id))); return n })} className="size-[14px] accent-blue-00" />
                {['หลักสูตร', 'เทมเพลต', 'ประจำปี', 'วันที่สร้าง'].map((h) => (
                  <span key={h} className="flex items-end">
                    {h}
                    <img src={iconSort} alt="" width={12} height={12} />
                  </span>
                ))}
                <span />
                <span />
              </div>
              {rows.map((c) => (
                <div key={c.id} role="row" className={`${grid} border-t border-gray-line py-[12px] text-[12px] font-light text-black`}>
                  <input type="checkbox" aria-label={`เลือก ${c.name}`} checked={sel.has(c.id)} onChange={(e) => setSel((s) => { const n = new Set(s); if (e.target.checked) n.add(c.id); else n.delete(c.id); return n })} className="size-[14px] accent-blue-00" />
                  <span className="truncate" title={c.name}>
                    {c.name}
                  </span>
                  <span>{certTemplates[c.template]}</span>
                  <span>{c.year}</span>
                  <span>{c.createdAt}</span>
                  <span>{badge(c)}</span>
                  {actions(c)}
                </div>
              ))}
            </div>
          </div>
          <ul className="md:hidden">
            {rows.map((c, i) => (
              <li key={c.id} className={`flex flex-col gap-[8px] py-[12px] ${i > 0 ? 'border-t border-gray-line' : ''}`}>
                <div className="flex items-start gap-[8px]">
                  <p className="min-w-0 flex-1 text-[14px] font-medium">{c.name}</p>
                  {badge(c)}
                </div>
                <p className="text-[11px] text-gray-20">
                  {certTemplates[c.template]} · ปี {c.year} · {c.createdAt}
                </p>
                {actions(c)}
              </li>
            ))}
          </ul>
          {rows.length === 0 && <p className="py-[32px] text-center text-[13px] text-gray-20">ไม่พบใบรับรอง</p>}
        </div>
      </Board>
      <Pagination page={current} pageCount={pageCount} onChange={setPg} />

      <section className="mt-[16px] rounded-[12px] border border-gray-line-2 bg-white p-[16px]">
        <h2 className="mb-[8px] text-[14px] font-semibold text-black">ประวัติการออกใบรับรอง</h2>
        <div className="overflow-x-auto">
          <table className="w-full min-w-[560px] text-left text-[12px] font-light">
            <thead>
              <tr className="text-[10px] text-gray-20">
                <th className="w-[110px] py-[10px] font-light">วันที่</th>
                <th className="font-light">จัดการ</th>
                <th className="w-[200px] font-light">ผู้จัดการ</th>
              </tr>
            </thead>
            <tbody>
              {log.map((l) => (
                <tr key={l.id} className="border-t border-gray-line">
                  <td className="py-[12px]">{l.date}</td>
                  <td className="pr-[12px]">{l.action}</td>
                  <td>{l.by}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      <CertPreview cert={view} onClose={() => setView(null)} />
      <ConfirmDialog open={!!del} danger title="ลบใบรับรอง?" confirm="ลบ" text={del && <>“{del.name}” จะถูกลบออกจากรายการ</>} onClose={() => setDel(null)} onConfirm={() => (del && deleteCert(del.id), setDel(null), showToast('ลบใบรับรองแล้ว'))} />
      {toast}
    </div>
  )
}
