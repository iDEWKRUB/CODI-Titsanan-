import { useEffect, useRef, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { ChartView, downloadCsv } from '../components/report/Charts'
import { Crumbs, Ic, Title, page } from '../components/notify/Parts'
import Modal from '../components/ui/Modal'
import { kindLabel, matchReport, narrate, reports, stamp, type Dataset } from '../data/erpReport'
import { chat, dashboards, dataset, useChat, useDashboards, useDatasetVersion } from '../lib/reportData'
import { useToast } from '../components/leader/Parts'

const I = {
  send: 'M5 12h14M13 6l6 6-6 6',
  spark: 'M12 3l1.8 4.7L18.5 9.5l-4.7 1.8L12 16l-1.8-4.7L5.5 9.5l4.7-1.8ZM18 15l.8 2.2L21 18l-2.2.8L18 21l-.8-2.2L15 18l2.2-.8Z',
  play: 'M7 4l12 8-12 8Z',
  dl: 'M12 4v12M7 11l5 5 5-5M4 20h16',
  grid: 'M4 4h7v7H4ZM13 4h7v7h-7ZM4 13h7v7H4ZM13 13h7v7h-7Z',
  trash: 'M4 7h16M10 11v6M14 11v6M6 7l1 13h10l1-13M9 7V4h6v3',
  org: 'M3 21h18M5 21V8l7-4 7 4v13M9 12h2M13 12h2M9 16h2M13 16h2',
}
const cardIcon: Record<string, string> = { org: I.org, kpi: 'M4 20V10M10 20V4M16 20v-7M22 20H2', booking: 'M4 6h16v13H4ZM4 10h16M9 3v4M15 3v4', contract: 'M7 3h7l4 4v14H7ZM14 3v4h4M10 12h5M10 16h5', asset: 'M3 7l9-4 9 4-9 4ZM3 7v10l9 4 9-4V7M12 11v10', notify: 'M6 9a6 6 0 0 1 12 0c0 6 2 7 2 7H4s2-1 2-7ZM10 20a2 2 0 0 0 4 0' }

/** รายงานที่ AI สร้างให้: คำอธิบายที่คำนวณจากข้อมูล + แผนภูมิ + ปุ่มส่งออก (answers in the chat) */
function ReportCard({ keyName }: { keyName: string }) {
  useDatasetVersion()
  const r = reports.find((x) => x.key === keyName)
  const navigate = useNavigate()
  if (!r) return null
  const sets = r.datasets.map((k) => dataset(k)).filter((d): d is Dataset => !!d)
  return (
    <div className="flex w-full flex-col gap-[12px] rounded-[16px] border border-gray-line-2 bg-white p-[16px] shadow-[0_4px_16px_rgba(20,40,90,0.06)]">
      <div className="flex flex-wrap items-center gap-[8px]">
        <h3 className="min-w-0 flex-1 text-[14px] font-semibold text-blue-dark">{r.title}</h3>
        <span className="rounded-full bg-[#e7f7ef] px-[8px] py-[2px] text-[10px] text-[#0f8a63]">ข้อมูล ณ {stamp().slice(11)} น.</span>
      </div>
      <div className="grid grid-cols-2 gap-[14px] max-md:grid-cols-1">
        {sets.map((d) => (
          <section key={d.key} aria-label={d.title} className="flex flex-col gap-[6px] rounded-[12px] bg-gray-subtle p-[12px]">
            <p className="text-[12px] font-semibold">{d.title}</p>
            <ChartView data={d} />
            <p className="text-[11px] leading-[1.6] font-light text-gray-30">{narrate(d)}</p>
            <p className="text-[10px] font-light text-gray-20">แหล่งข้อมูล: {d.source}{d.live ? '' : ' · ข้อมูลตัวอย่าง'}</p>
          </section>
        ))}
      </div>
      <div className="flex flex-wrap justify-end gap-[8px]">
        <button type="button" onClick={() => downloadCsv(r.title, sets)} className="flex h-[34px] items-center gap-[6px] rounded-[8px] border border-gray-line px-[12px] text-[12px] hover:border-gray-10"><Ic d={I.dl} s={14} />ส่งออก CSV</button>
        <button type="button" onClick={() => navigate(`/report/dashboard/new?from=${r.key}`)} className="flex h-[34px] items-center gap-[6px] rounded-[8px] bg-blue-00 px-[12px] text-[12px] font-medium text-white hover:brightness-110"><Ic d={I.grid} s={14} />สร้าง Dashboard จากรายงานนี้</button>
      </div>
    </div>
  )
}

/** หน้าแรก Automation Intelligence Report — AI chatbot + คำสั่งยอดนิยม (book 3 §2.5.1.1, fig 2-143) */
export default function ReportHomePage() {
  const msgs = useChat()
  const dashs = useDashboards()
  const [text, setText] = useState('')
  const [busy, setBusy] = useState(false)
  const [view, setView] = useState<number>()
  const [toast, show] = useToast()
  const end = useRef<HTMLDivElement>(null)
  useDatasetVersion()
  useEffect(() => { end.current?.scrollIntoView({ block: 'nearest', behavior: 'smooth' }) }, [msgs.length, busy])

  const ask = (q: string) => {
    const t = q.trim()
    if (!t || busy) return
    chat.save({ id: chat.next(), role: 'user', text: t, at: stamp() })
    setText('')
    setBusy(true)
    const r = matchReport(t)
    // the "thinking" pause is only there so the answer reads as a conversation — the report itself is instant
    setTimeout(() => {
      chat.save(r
        ? { id: chat.next(), role: 'bot', text: `จัดทำ “${r.title}” จากข้อมูลล่าสุดในระบบให้แล้วครับ`, report: r.key, at: stamp() }
        : { id: chat.next(), role: 'bot', text: 'ยังไม่เข้าใจคำสั่งนี้ ลองพิมพ์ใหม่ให้เจาะจงขึ้น เช่น “สรุปสถานะสัญญา”, “สรุปการจองห้องประชุม” หรือเลือกจากคำสั่งยอดนิยมด้านล่าง', at: stamp() })
      setBusy(false)
    }, 650)
  }
  const dash = dashs.find((d) => d.id === view)

  return (
    <div className={`${page} items-center`}>
      <div className="flex w-full max-w-[1000px] flex-col gap-[14px]">
        <Title right={<Link to="/report/dashboard/new" className="flex h-[36px] items-center gap-[6px] rounded-[8px] border border-blue-00 px-[14px] text-[12px] font-medium text-blue-00 hover:bg-blue-bg"><Ic d={I.grid} s={15} />สร้าง Dashboard ใหม่</Link>}>Automation Intelligence Report</Title>
        <Crumbs items={[{ label: 'หน้าแรก', to: '/report' }, { label: 'Automation Intelligence Report' }]} />

        <section aria-label="ผู้ช่วยสร้างรายงาน" className="flex flex-col gap-[14px] rounded-[20px] border border-[#cfd8ff] bg-gradient-to-br from-[#eef2ff] via-white to-[#eaf6ff] p-[20px] max-sm:p-[14px]">
          <div className="flex items-center gap-[10px]">
            <span className="flex size-[40px] items-center justify-center rounded-[12px] bg-gradient-to-br from-[#6a55e8] to-[#1f5ac8] text-white"><Ic d={I.spark} s={20} /></span>
            <div className="min-w-0"><h2 className="text-[16px] font-semibold text-blue-dark">ให้ผู้ช่วยจัดทำรายงานให้</h2><p className="text-[12px] font-light text-gray-30">พิมพ์คำสั่งหรือคำถามเกี่ยวกับข้อมูลในระบบ ระบบจะสรุปและทำแผนภูมิให้ทันที</p></div>
          </div>

          {msgs.length > 0 && (
            <div role="log" aria-label="บทสนทนา" className="flex max-h-[560px] flex-col gap-[12px] overflow-y-auto pr-[4px]">
              {[...msgs].sort((a, b) => a.id - b.id).map((m) => (
                <div key={m.id} className={`flex flex-col gap-[8px] ${m.role === 'user' ? 'items-end' : 'items-start'}`}>
                  <p className={`max-w-[86%] rounded-[14px] px-[14px] py-[9px] text-[13px] leading-[1.6] ${m.role === 'user' ? 'bg-blue-00 text-white' : 'bg-white text-black shadow-sm ring-1 ring-black/5'}`}>{m.text}</p>
                  {m.report && <ReportCard keyName={m.report} />}
                </div>
              ))}
              {busy && <p className="flex w-fit items-center gap-[6px] rounded-[14px] bg-white px-[14px] py-[9px] text-[12px] text-gray-30 shadow-sm ring-1 ring-black/5" role="status"><span className="size-[6px] animate-pulse rounded-full bg-[#6a55e8]" />กำลังประมวลผลข้อมูล…</p>}
              <div ref={end} />
            </div>
          )}

          <form onSubmit={(e) => { e.preventDefault(); ask(text) }} className="flex items-center gap-[8px] rounded-full bg-white p-[6px] pl-[16px] shadow-[0_4px_18px_rgba(31,90,200,0.12)] ring-1 ring-blue-20 focus-within:ring-2 focus-within:ring-blue-00">
            <input aria-label="พิมพ์คำสั่งหรือคำถาม" value={text} onChange={(e) => setText(e.target.value)} placeholder="พิมพ์คำสั่งหรือคำถาม เช่น สรุปสถานะสัญญาทั้งหมด" className="min-w-0 flex-1 bg-transparent py-[8px] text-[14px] outline-none" />
            <button type="submit" aria-label="ส่งคำสั่ง" disabled={!text.trim() || busy} className="flex size-[40px] shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-[#1f5ac8] to-[#3b8cff] text-white transition hover:brightness-110 disabled:opacity-40"><Ic d={I.send} s={18} w={2.2} /></button>
          </form>
          <p className="text-[11px] font-light text-gray-20">ผู้ช่วยตอบจากข้อมูลที่มีอยู่ในพอร์ทัล โดยจับคำสำคัญของคำสั่ง (ยังไม่ใช่โมเดล AI จริง) · ตัวเลขที่ระบุว่า “ข้อมูลตัวอย่าง” ยังไม่ได้เชื่อมระบบต้นทาง</p>
          {msgs.length > 0 && <button type="button" onClick={() => { chat.all().forEach((m) => chat.remove(m.id)); show('ล้างบทสนทนาแล้ว') }} className="w-fit text-[12px] text-gray-30 underline hover:text-blue-00">ล้างบทสนทนา</button>}
        </section>

        <section aria-label="คำสั่งยอดนิยม" className="flex flex-col gap-[10px]">
          <h2 className="text-[15px] font-semibold">คำสั่งยอดนิยม</h2>
          <div className="grid grid-cols-3 gap-[12px] max-md:grid-cols-2 max-sm:grid-cols-1">
            {reports.map((r) => (
              <div key={r.key} className="flex flex-col gap-[10px] rounded-[14px] border border-gray-line-2 bg-white p-[14px] transition hover:border-blue-20 hover:shadow-[0_6px_18px_rgba(31,90,200,0.1)]">
                <div className="flex items-start gap-[10px]">
                  <span className="flex size-[38px] shrink-0 items-center justify-center rounded-[11px] bg-blue-bg text-blue-00"><Ic d={cardIcon[r.key]} s={18} /></span>
                  <div className="min-w-0"><p className="text-[13px] leading-[1.35] font-semibold">{r.title}</p><p className="text-[11px] font-light text-gray-30">{r.desc}</p></div>
                </div>
                <button type="button" aria-label={`เริ่มทำ ${r.title}`} onClick={() => ask(r.title)} disabled={busy} className="flex h-[34px] items-center justify-center gap-[6px] self-start rounded-[8px] bg-blue-bg px-[14px] text-[12px] font-medium text-blue-00 hover:bg-blue-20 disabled:opacity-50"><Ic d={I.play} s={12} />เริ่มทำ</button>
              </div>
            ))}
          </div>
        </section>

        {dashs.length > 0 && (
          <section aria-label="Dashboard ของฉัน" className="flex flex-col gap-[10px]">
            <h2 className="text-[15px] font-semibold">Dashboard ของฉัน</h2>
            <ul className="grid grid-cols-3 gap-[12px] max-md:grid-cols-2 max-sm:grid-cols-1">
              {dashs.map((d) => (
                <li key={d.id} className="flex flex-col gap-[6px] rounded-[14px] border border-gray-line-2 bg-white p-[14px]">
                  <p className="text-[13px] font-semibold">{d.name}</p>
                  <p className="line-clamp-2 text-[11px] font-light text-gray-30">{d.desc || d.prompt}</p>
                  <p className="text-[10px] font-light text-gray-20">{d.charts.length} แผนภูมิ · สร้าง {d.createdAt.slice(0, 10)}</p>
                  <div className="flex gap-[6px]">
                    <button type="button" onClick={() => setView(d.id)} className="h-[30px] rounded-[8px] bg-blue-00 px-[12px] text-[12px] font-medium text-white hover:brightness-110">เปิดดู</button>
                    <button type="button" aria-label={`ลบ Dashboard ${d.name}`} onClick={() => { dashboards.remove(d.id); show('ลบ Dashboard แล้ว') }} className="flex size-[30px] items-center justify-center rounded-[8px] border border-gray-line-2 text-gray-30 hover:border-[#f0b4b4] hover:text-[#c13232]"><Ic d={I.trash} s={14} /></button>
                  </div>
                </li>
              ))}
            </ul>
          </section>
        )}
      </div>

      <Modal open={!!dash} onClose={() => setView(undefined)} title={dash?.name ?? ''} width="max-w-[900px]">
        {dash && (
          <div className="flex max-h-[70vh] flex-col gap-[12px] overflow-y-auto pr-[4px]">
            {dash.desc && <p className="text-[12px] font-light text-gray-30">{dash.desc}</p>}
            <div className="grid grid-cols-2 gap-[12px] max-md:grid-cols-1">
              {dash.charts.map((c, i) => { const d = dataset(c.dataset); return d ? <section key={i} aria-label={c.title} className="rounded-[12px] bg-gray-subtle p-[12px]"><p className="mb-[4px] text-[12px] font-semibold">{c.title}</p><ChartView data={d} kind={c.kind} /><p className="text-[10px] font-light text-gray-20">{kindLabel[c.kind]} · {d.source}</p></section> : null })}
            </div>
          </div>
        )}
      </Modal>
      {toast}
    </div>
  )
}
