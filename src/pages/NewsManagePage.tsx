import { useMemo, useState, type ReactNode } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import AppShell from '../components/app/AppShell'
import { useToast } from '../components/leader/Parts'
import Modal from '../components/ui/Modal'
import Pagination from '../components/ui/Pagination'
import Select from '../components/ui/Select'
import { newsCats, newsStatus, type News, type NewsStatus } from '../data/codiApp'
import { thDate } from '../data/erpProject'
import { initialsOf, toneOf } from '../lib/actingUser'
import { isLive, news, setAppRole, useAppRole, useNews } from '../lib/codiAppStore'

const PAGE = 6
const ALL = 'ทั้งหมด'
const SORTS = [{ value: 'new', label: 'ล่าสุดก่อน' }, { value: 'old', label: 'เก่าสุดก่อน' }, { value: 'views', label: 'ผู้ชมมากสุด' }]

const Ic = ({ d, s = 16 }: { d: string; s?: number }) => <svg width={s} height={s} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d={d} /></svg>
const I = {
  all: 'M4 5h16v14H4ZM8 9h8M8 13h8M8 17h5',
  pub: 'M12 21a9 9 0 1 0 0-18 9 9 0 0 0 0 18ZM8 12l3 3 5-6',
  draft: 'M5 20h4L20 9l-4-4L5 16ZM14 7l4 4',
  off: 'M12 21a9 9 0 1 0 0-18 9 9 0 0 0 0 18ZM8 12h8',
  eye: 'M2 12s4-7 10-7 10 7 10 7-4 7-10 7S2 12 2 12ZM12 9a3 3 0 1 0 0 6 3 3 0 0 0 0-6Z',
  edit: 'M5 20h4L20 9l-4-4L5 16Z',
  del: 'M5 7h14M10 7V4h4v3M7 7l1 13h8l1-13',
  up: 'M21 3 10 14M21 3l-7 18-4-8-8-4Z',
  down: 'M3 3l18 18M10.6 5.1A10 10 0 0 1 12 5c6 0 10 7 10 7a17 17 0 0 1-3.2 3.9M6.6 6.6C3.9 8.4 2 12 2 12s4 7 10 7a9.6 9.6 0 0 0 5.4-1.6M9.9 9.9a3 3 0 0 0 4.2 4.2',
  search: 'M11 18a7 7 0 1 0 0-14 7 7 0 0 0 0 14ZM20 20l-4-4',
  plus: 'M12 5v14M5 12h14',
  img: 'M4 5h16v14H4ZM4 15l4-4 4 4 3-3 5 5M15 9h.01',
  cal: 'M4 6h16v14H4ZM4 10h16M9 3v4M15 3v4',
  clock: 'M12 21a9 9 0 1 0 0-18 9 9 0 0 0 0 18ZM12 7v5l3 2',
}
const dot: Record<NewsStatus, string> = { published: 'bg-[#17a673]', draft: 'bg-gray-20', unpublished: 'bg-[#e07a2c]' }
const tiles: { key: string; label: string; icon: string; tone: string; ring: string }[] = [
  { key: ALL, label: 'ข่าวทั้งหมด', icon: I.all, tone: 'bg-blue-bg text-blue-00', ring: 'ring-blue-00' },
  { key: 'published', label: 'เผยแพร่แล้ว', icon: I.pub, tone: 'bg-[#dff5e8] text-[#0f8a63]', ring: 'ring-[#17a673]' },
  { key: 'draft', label: 'แบบร่าง', icon: I.draft, tone: 'bg-gray-bg text-gray-30', ring: 'ring-gray-20' },
  { key: 'unpublished', label: 'ยกเลิกเผยแพร่', icon: I.off, tone: 'bg-[#ffefe2] text-[#b2500d]', ring: 'ring-[#e07a2c]' },
]

function StatusPill({ n }: { n: News }) {
  const scheduled = n.status === 'published' && !isLive(n)
  return (
    <span className={`inline-flex items-center gap-[6px] rounded-full px-[10px] py-[4px] text-[11px] font-medium whitespace-nowrap ${scheduled ? 'bg-[#e8f1ff] text-[#1f5fbf]' : newsStatus[n.status].tone}`}>
      <span aria-hidden="true" className={`size-[6px] rounded-full ${scheduled ? 'bg-[#3b82f6]' : dot[n.status]}`} />
      {scheduled ? 'ตั้งเวลาเผยแพร่' : newsStatus[n.status].label}
    </span>
  )
}

function Cover({ n, cls }: { n: News; cls: string }) {
  return n.cover
    ? <img src={n.cover} alt="" className={`${cls} rounded-[10px] object-cover ring-1 ring-black/5`} />
    : <span className={`${cls} flex items-center justify-center rounded-[10px] bg-[linear-gradient(135deg,#eef4ff,#dfe8fb)] text-blue-dark/40`}><Ic d={I.img} s={20} /></span>
}

function Person({ name }: { name: string }) {
  const [bg, fg] = toneOf(name, false)
  return (
    <span className="flex items-center gap-[8px] whitespace-nowrap">
      <span style={{ background: bg, color: fg }} className="flex size-[26px] shrink-0 items-center justify-center rounded-full text-[10px] font-semibold">{initialsOf(name)}</span>
      <span className="text-[12px] font-light text-gray-30">{name}</span>
    </span>
  )
}

/** จัดการข่าวสาร (book 3 fig 2-3) — 2.1.1.3 ; for the system administrator */
export default function NewsManagePage() {
  const all = useNews()
  const role = useAppRole()
  const navigate = useNavigate()
  const [toast, show] = useToast()
  const [q, setQ] = useState('')
  const [st, setSt] = useState(ALL)
  const [cat, setCat] = useState(ALL)
  const [sort, setSort] = useState('new')
  const [pg, setPg] = useState(1)
  const [del, setDel] = useState<News>()
  const admin = role === 'admin'

  const count = (k: string) => (k === ALL ? all.length : all.filter((n) => n.status === k).length)
  const viewsOf = (k: string) => all.filter((n) => k === ALL || n.status === k).reduce((s, n) => s + n.views, 0)
  const rows = useMemo(() => {
    const k = q.trim().toLowerCase()
    const list = all.filter((n) => (st === ALL || n.status === st) && (cat === ALL || n.cat === cat) && (!k || `${n.title} ${n.cat} ${n.creator}`.toLowerCase().includes(k)))
    return list.sort((a, b) => (sort === 'views' ? b.views - a.views : sort === 'old' ? a.date.localeCompare(b.date) || a.id - b.id : b.date.localeCompare(a.date) || b.id - a.id))
  }, [all, q, st, cat, sort])
  const pages = Math.max(1, Math.ceil(rows.length / PAGE))
  const cur = Math.min(pg, pages)
  const view = rows.slice((cur - 1) * PAGE, cur * PAGE)
  const maxViews = Math.max(1, ...all.map((n) => n.views))
  const filtered = !!q || st !== ALL || cat !== ALL

  const remove = () => {
    if (!del) return
    news.remove(del.id)
    show(`ลบข่าว “${del.title}” แล้ว`)
    setDel(undefined)
  }
  const toggle = (n: News) => {
    const on = n.status !== 'published'
    news.update(n.id, (x) => ({ ...x, status: on ? 'published' : 'unpublished' }))
    show(on ? `เผยแพร่ “${n.title}” แล้ว` : `ยกเลิกเผยแพร่ “${n.title}” แล้ว`)
  }
  const reset = () => { setQ(''); setSt(ALL); setCat(ALL); setPg(1) }

  const actions = (n: News, big?: boolean): ReactNode => {
    const b = `inline-flex ${big ? 'size-[36px]' : 'size-[32px]'} items-center justify-center rounded-[9px] text-gray-30 transition-colors disabled:pointer-events-none disabled:opacity-35`
    const on = n.status !== 'published'
    return (
      <div className="flex items-center justify-end gap-[2px]">
        <button type="button" title={on ? 'เผยแพร่' : 'ยกเลิกเผยแพร่'} aria-label={`${on ? 'เผยแพร่' : 'ยกเลิกเผยแพร่'} ${n.title}`} disabled={!admin || !n.title} onClick={() => toggle(n)} className={`${b} ${on ? 'hover:bg-[#dff5e8] hover:text-[#0f8a63]' : 'hover:bg-[#ffefe2] hover:text-[#b2500d]'}`}><Ic d={on ? I.up : I.down} /></button>
        <Link to={`/app/news/edit?id=${n.id}`} title="แก้ไข" aria-label={`แก้ไข ${n.title}`} aria-disabled={!admin} tabIndex={admin ? 0 : -1} onClick={(e) => { if (!admin) e.preventDefault() }} className={`${b} hover:bg-blue-bg hover:text-blue-00 ${admin ? '' : 'pointer-events-none opacity-35'}`}><Ic d={I.edit} /></Link>
        <button type="button" title="ลบ" aria-label={`ลบ ${n.title}`} disabled={!admin} onClick={() => setDel(n)} className={`${b} hover:bg-[#ffe3e3] hover:text-[#c13232]`}><Ic d={I.del} /></button>
      </div>
    )
  }

  return (
    <AppShell>
      <div className="flex flex-col gap-[20px]">
        {/* head */}
        <div className="flex flex-wrap items-end gap-[14px]">
          <div className="min-w-0 flex-1 max-md:basis-full">
            <nav aria-label="breadcrumb" className="mb-[6px] text-[12px] font-light text-gray-20"><Link to="/app" className="hover:text-blue-00">หน้าแรก</Link><span className="mx-[6px] text-gray-line">/</span><span>จัดการข่าวสาร</span></nav>
            <h1 className="text-[24px] leading-[1.3] font-semibold text-blue-dark">จัดการข่าวสาร</h1>
            <p className="mt-[2px] text-[13px] font-light text-gray-30">เพิ่ม แก้ไข และกำหนดการเผยแพร่ข่าวที่แสดงในหน้าแรกและหน้าข่าวสารของ CODI APP</p>
          </div>
          <div role="group" aria-label="ดูในฐานะ" className="flex items-center gap-[4px] rounded-full bg-gray-bg p-[4px] text-[12px]">
            <span className="px-[8px] font-light text-gray-20 max-sm:hidden">ดูในฐานะ</span>
            {(['admin', 'staff'] as const).map((r) => <button key={r} type="button" aria-pressed={role === r} onClick={() => setAppRole(r)} className={`rounded-full px-[12px] py-[6px] transition-colors ${role === r ? 'bg-white font-medium text-blue-dark shadow-[0_1px_4px_rgba(0,40,120,0.12)]' : 'text-gray-30 hover:text-blue-00'}`}>{r === 'admin' ? 'ผู้ดูแลระบบ' : 'เจ้าหน้าที่ทั่วไป'}</button>)}
            <select aria-label="ดูในฐานะผู้ใช้งาน" value={role} onChange={(e) => setAppRole(e.target.value as 'admin' | 'staff')} className="sr-only" tabIndex={-1}>
              <option value="admin">ผู้ดูแลระบบ</option>
              <option value="staff">เจ้าหน้าที่ทั่วไป</option>
            </select>
          </div>
          <button type="button" disabled={!admin} onClick={() => navigate('/app/news/edit')} className="flex h-[44px] items-center gap-[8px] rounded-[12px] bg-blue-00 pr-[20px] max-sm:ml-auto pl-[16px] text-[14px] font-medium text-white shadow-[0_6px_16px_rgba(0,133,249,0.28)] transition hover:brightness-110 disabled:opacity-40 disabled:shadow-none"><Ic d={I.plus} s={18} />เพิ่มข่าวสาร</button>
        </div>

        {!admin && <p role="status" className="flex items-center gap-[10px] rounded-[12px] border border-[#f1d38a] bg-[#fffaeb] px-[16px] py-[12px] text-[12px] text-[#8a6100]"><Ic d="M12 9v4M12 17h.01M10.3 3.9 2.4 18a2 2 0 0 0 1.7 3h15.8a2 2 0 0 0 1.7-3L13.7 3.9a2 2 0 0 0-3.4 0Z" />หน้านี้แก้ไขได้เฉพาะ <b className="font-semibold">ผู้ดูแลระบบ</b> — สลับ “ดูในฐานะ” ด้านบนเพื่อทดลอง (ระบบจริงใช้สิทธิ์จาก SSO)</p>}

        {/* status tiles = quick filter */}
        <div className="grid grid-cols-4 gap-[12px] max-lg:grid-cols-2">
          {tiles.map((t) => {
            const on = st === t.key
            return (
              <button key={t.key} type="button" aria-pressed={on} onClick={() => { setSt(t.key); setPg(1) }} className={`group flex items-center gap-[14px] rounded-[16px] border bg-white p-[16px] text-left transition ${on ? `border-transparent ring-2 ${t.ring} shadow-[0_8px_24px_rgba(0,40,120,0.08)]` : 'border-gray-line-2 hover:border-blue-20 hover:shadow-[0_6px_18px_rgba(0,40,120,0.06)]'}`}>
                <span className={`flex size-[44px] shrink-0 items-center justify-center rounded-[12px] ${t.tone}`}><Ic d={t.icon} s={20} /></span>
                <span className="flex min-w-0 flex-col">
                  <span className="text-[12px] font-light text-gray-30">{t.label}</span>
                  <span className="font-urbanist text-[24px] leading-[1.15] font-semibold text-blue-dark">{count(t.key)}</span>
                  <span className="flex items-center gap-[4px] text-[11px] font-light text-gray-20"><Ic d={I.eye} s={12} />{`ผู้ชม ${viewsOf(t.key).toLocaleString('en-US')}`}</span>
                </span>
              </button>
            )
          })}
        </div>

        {/* list card */}
        <section aria-label="รายการข่าวสาร" className="overflow-hidden rounded-[18px] border border-gray-line-2 bg-white shadow-[0_2px_12px_rgba(0,40,120,0.04)]">
          <div className="flex flex-wrap items-center gap-[10px] border-b border-gray-line-2 p-[16px]">
            <label className="flex h-[44px] min-w-[240px] flex-1 items-center gap-[10px] rounded-[12px] border border-gray-line bg-gray-subtle px-[14px] text-gray-20 transition-colors focus-within:border-blue-00 focus-within:bg-white">
              <Ic d={I.search} />
              <input aria-label="ค้นหาข่าวสาร" placeholder="ค้นหาจากหัวข้อ ประเภท หรือผู้สร้าง" value={q} onChange={(e) => { setQ(e.target.value); setPg(1) }} className="h-full min-w-0 flex-1 bg-transparent text-[13px] font-light text-black outline-none placeholder:text-gray-20" />
            </label>
            <div className="w-[170px] max-sm:w-[calc(50%-5px)]"><Select label="สถานะข่าวสาร" value={st} options={[ALL, 'published', 'draft', 'unpublished'].map((v) => ({ value: v, label: v === ALL ? 'ทุกสถานะ' : newsStatus[v as NewsStatus].label }))} onChange={(v) => { setSt(v); setPg(1) }} /></div>
            <div className="w-[170px] max-sm:w-[calc(50%-5px)]"><Select label="ประเภทข่าว" value={cat} options={[ALL, ...newsCats].map((v) => ({ value: v, label: v === ALL ? 'ทุกประเภท' : v }))} onChange={(v) => { setCat(v); setPg(1) }} /></div>
            <div className="w-[150px] max-sm:w-full"><Select label="เรียงลำดับ" value={sort} options={SORTS} onChange={setSort} /></div>
          </div>
          <div className="flex items-center gap-[8px] px-[16px] pt-[12px] text-[12px] font-light text-gray-30">
            <span>{`พบ ${rows.length} ข่าว`}</span>
            {filtered && <button type="button" onClick={reset} className="rounded-full bg-blue-bg px-[10px] py-[3px] text-[11px] font-medium text-blue-00 hover:brightness-95">ล้างตัวกรอง ×</button>}
          </div>

          {/* desktop table */}
          <div className="overflow-x-auto px-[8px] pb-[8px] max-md:hidden">
            <table className="w-full min-w-[860px] border-separate border-spacing-y-[4px] text-left text-[12px]">
              <thead className="text-[11px] text-gray-20"><tr>{['ข่าวสาร', 'ประเภท', 'ผู้สร้าง', 'สถานะ', 'ผู้ชม', ''].map((h, i) => <th key={h || 'act'} className={`px-[12px] pt-[6px] pb-[4px] font-normal ${i === 5 ? 'w-[120px]' : ''}`}>{h}</th>)}</tr></thead>
              <tbody>
                {view.map((n) => (
                  <tr key={n.id} className="group">
                    <td className="rounded-l-[12px] px-[12px] py-[10px] transition-colors group-hover:bg-[#f5f9ff]">
                      <div className="flex items-center gap-[14px]">
                        <Cover n={n} cls="h-[60px] w-[96px] shrink-0" />
                        <div className="min-w-0">
                          <p className="line-clamp-2 max-w-[380px] text-[13px] leading-[1.45] font-medium text-black">{n.title || <span className="text-gray-20">(ยังไม่มีหัวข้อ)</span>}</p>
                          <p className="mt-[3px] flex items-center gap-[5px] text-[11px] font-light text-gray-20"><Ic d={I.cal} s={12} />{`${n.status === 'published' ? 'เผยแพร่' : 'วันที่'} ${thDate(n.date)}`}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-[12px] transition-colors group-hover:bg-[#f5f9ff]"><span className="rounded-full border border-blue-20 px-[10px] py-[3px] text-[11px] whitespace-nowrap text-blue-dark">{n.cat || '—'}</span></td>
                    <td className="px-[12px] transition-colors group-hover:bg-[#f5f9ff]"><Person name={n.creator} /></td>
                    <td className="px-[12px] transition-colors group-hover:bg-[#f5f9ff]"><StatusPill n={n} /></td>
                    <td className="px-[12px] transition-colors group-hover:bg-[#f5f9ff]">
                      <div className="flex w-[90px] flex-col gap-[5px]">
                        <span className="font-urbanist text-[13px] font-medium text-black">{n.views.toLocaleString('en-US')}</span>
                        <span aria-hidden="true" className="h-[4px] overflow-hidden rounded-full bg-gray-bg"><span className="block h-full rounded-full bg-blue-00/70" style={{ width: `${Math.max(n.views ? 4 : 0, (n.views / maxViews) * 100)}%` }} /></span>
                      </div>
                    </td>
                    <td className="rounded-r-[12px] px-[8px] transition-colors group-hover:bg-[#f5f9ff]">{actions(n)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* mobile cards */}
          <ul className="flex flex-col gap-[10px] p-[12px] md:hidden">
            {view.map((n) => (
              <li key={n.id} className="flex gap-[12px] rounded-[14px] border border-gray-line-2 p-[10px]">
                <Cover n={n} cls="h-[72px] w-[88px] shrink-0" />
                <div className="flex min-w-0 flex-1 flex-col gap-[6px]">
                  <p className="line-clamp-2 text-[13px] leading-[1.45] font-medium">{n.title}</p>
                  <div className="flex flex-wrap items-center gap-[6px] text-[11px] font-light text-gray-20"><StatusPill n={n} /><span>{n.cat}</span><span>·</span><span className="flex items-center gap-[3px]"><Ic d={I.eye} s={12} />{n.views}</span></div>
                  <div className="flex items-center justify-between"><span className="text-[11px] font-light text-gray-20">{thDate(n.date)}</span>{actions(n, true)}</div>
                </div>
              </li>
            ))}
          </ul>

          {!rows.length && (
            <div className="flex flex-col items-center gap-[10px] px-[16px] pt-[24px] pb-[40px] text-center">
              <span className="flex size-[56px] items-center justify-center rounded-full bg-blue-bg text-blue-00"><Ic d={I.search} s={24} /></span>
              <p className="text-[14px] font-medium">ไม่พบข่าวสารที่ตรงกับเงื่อนไข</p>
              <button type="button" onClick={reset} className="text-[12px] font-medium text-blue-00 hover:underline">ล้างตัวกรองทั้งหมด</button>
            </div>
          )}

          {rows.length > 0 && (
            <div className="flex flex-wrap items-center justify-between gap-[10px] border-t border-gray-line-2 px-[16px] py-[12px]">
              <span className="text-[12px] font-light text-gray-30">{`แสดง ${(cur - 1) * PAGE + 1}–${Math.min(cur * PAGE, rows.length)} จาก ${rows.length} รายการ`}</span>
              <Pagination page={cur} pageCount={pages} onChange={setPg} />
            </div>
          )}
        </section>
      </div>

      <Modal open={!!del} onClose={() => setDel(undefined)} title="ลบข่าวสาร" width="max-w-[440px]">
        {del && <div className="flex items-center gap-[12px] rounded-[12px] bg-gray-subtle p-[10px]"><Cover n={del} cls="h-[48px] w-[72px] shrink-0" /><p className="line-clamp-2 text-[13px] font-medium">{del.title}</p></div>}
        <p className="text-[13px] leading-[1.7] font-light text-gray-30">ต้องการลบข่าวนี้ใช่หรือไม่ ข่าวจะหายจากหน้าแรกและหน้าข่าวสารทันที และไม่สามารถกู้คืนได้</p>
        <div className="flex justify-end gap-[8px]">
          <button type="button" onClick={() => setDel(undefined)} className="h-[40px] rounded-[10px] border border-gray-line px-[18px] text-[13px] hover:border-gray-10">ยกเลิก</button>
          <button type="button" onClick={remove} className="h-[40px] rounded-[10px] bg-[#e5484d] px-[18px] text-[13px] font-medium text-white hover:brightness-110">ลบข่าว</button>
        </div>
      </Modal>
      {toast}
    </AppShell>
  )
}
