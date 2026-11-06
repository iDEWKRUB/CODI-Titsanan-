import { useEffect, useState } from 'react'
import { Link, useNavigate, useSearchParams } from 'react-router-dom'
import { ChartView } from '../components/report/Charts'
import { Btn, Crumbs, Ic, Row, Section, Title, ctl, err, page, ta } from '../components/notify/Parts'
import Modal from '../components/ui/Modal'
import { kindLabel, matchReport, reports, stamp, type ChartKind, type DashChart } from '../data/erpReport'
import { dashboards, dataset, datasetKeys, useDatasetVersion } from '../lib/reportData'

type Card = DashChart & { on: boolean; custom?: boolean }
const fallbackSets = ['contract-status', 'booking-kind', 'asset-state', 'notify-sev']
const kinds = Object.keys(kindLabel) as ChartKind[]
const I = { spark: 'M12 3l1.8 4.7L18.5 9.5l-4.7 1.8L12 16l-1.8-4.7L5.5 9.5l4.7-1.8ZM18 15l.8 2.2L21 18l-2.2.8L18 21l-.8-2.2L15 18l2.2-.8Z', plus: 'M12 5v14M5 12h14', check: 'M5 12l5 5 9-10', reset: 'M4 4v6h6M20 20v-6h-6M20 10a8 8 0 0 0-14-3M4 14a8 8 0 0 0 14 3', x: 'M6 6l12 12M18 6 6 18' }

/** สร้าง Dashboard ใหม่ — Prompt → AI proposes charts → pick, edit, add own (book 3 §2.5.1.2, fig 2-144) */
export default function ReportDashboardPage() {
  useDatasetVersion()
  const navigate = useNavigate()
  const [sp] = useSearchParams()
  const [prompt, setPrompt] = useState('')
  const [cards, setCards] = useState<Card[]>([])
  const [name, setName] = useState('')
  const [desc, setDesc] = useState('')
  const [busy, setBusy] = useState(false)
  const [note, setNote] = useState('')
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [adding, setAdding] = useState(false)
  const [custom, setCustom] = useState({ dataset: datasetKeys[0], kind: 'bar' as ChartKind, title: '' })
  const [done, setDone] = useState<string>()

  const propose = (p: string, fromKey?: string) => {
    setBusy(true); setNote('')
    setTimeout(() => {
      const r = fromKey ? reports.find((x) => x.key === fromKey) : matchReport(p)
      const keys = r ? [...r.datasets, ...fallbackSets.filter((k) => !r.datasets.includes(k)).slice(0, 2)] : fallbackSets
      setCards((prev) => [...keys.map((k) => { const d = dataset(k)!; return { dataset: k, kind: d.kind, title: d.title, on: r ? r.datasets.includes(k) : true } }), ...prev.filter((c) => c.custom)])
      if (r && !name.trim()) setName(`Dashboard ${r.title.replace(/^สรุป/, '')}`)
      setNote(r ? `ผู้ช่วยเสนอแผนภูมิจากหัวข้อ “${r.title}” — เลือกหรือเอาออกได้ตามต้องการ` : 'ไม่พบหัวข้อที่ตรงกับ Prompt ผู้ช่วยจึงเสนอภาพรวมจากทุกระบบแทน')
      setBusy(false)
    }, 700)
  }
  useEffect(() => {
    const k = sp.get('from')
    const r = reports.find((x) => x.key === k)
    if (r) { setPrompt(r.prompt); propose(r.prompt, r.key) }
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  const gen = () => {
    if (!prompt.trim()) { setErrors({ prompt: 'กรุณาพิมพ์ Prompt อธิบาย Dashboard ที่ต้องการ' }); return }
    setErrors({}); propose(prompt)
  }
  const picked = cards.filter((c) => c.on)
  const save = () => {
    const e: Record<string, string> = {}
    if (!name.trim()) e.name = 'กรุณาตั้งชื่อ Dashboard'
    if (!picked.length) e.cards = 'กรุณาเลือกแผนภูมิอย่างน้อย 1 รายการ'
    setErrors(e)
    if (Object.keys(e).length) return
    dashboards.save({ id: dashboards.next(), name: name.trim(), desc: desc.trim(), prompt: prompt.trim(), charts: picked.map(({ dataset: d, kind, title }) => ({ dataset: d, kind, title })), createdAt: stamp() })
    setDone(name.trim())
  }
  const reset = () => { setPrompt(''); setCards([]); setName(''); setDesc(''); setNote(''); setErrors({}) }
  const addCustom = () => {
    const d = dataset(custom.dataset)
    if (!d) return
    setCards((p) => [...p, { dataset: d.key, kind: custom.kind, title: custom.title.trim() || d.title, on: true, custom: true }])
    setAdding(false); setCustom({ dataset: datasetKeys[0], kind: 'bar', title: '' })
  }

  return (
    <div className={`${page} items-center`}>
      <div className="flex w-full max-w-[1000px] flex-col gap-[12px]">
        <Title back="/report">สร้าง Dashboard ใหม่</Title>
        <Crumbs items={[{ label: 'หน้าแรก', to: '/report' }, { label: 'Automation Intelligence Report', to: '/report' }, { label: 'Dashboard' }, { label: 'สร้าง Dashboard ใหม่' }]} />

        <Section title="ให้ AI ช่วยออกแบบ" tone="blue">
          <Row label="Prompt" req error={errors.prompt} hint="เช่น วิเคราะห์ข้อมูลองค์กรชุมชน · สรุปสถานะสัญญา · สรุปการจองห้องประชุม">
            <textarea aria-label="Prompt" value={prompt} onChange={(e) => setPrompt(e.target.value)} placeholder="อธิบายประเภทข้อมูลหรือ Dashboard ที่ต้องการ" className={`${ta} !min-h-[80px] ${errors.prompt ? err : ''}`} />
          </Row>
          <div className="flex flex-wrap items-center justify-end gap-[8px]">
            {note && <p role="status" className="mr-auto text-[12px] text-blue-dark">{note}</p>}
            <button type="button" onClick={gen} disabled={busy} className="flex h-[40px] items-center gap-[8px] rounded-[8px] bg-gradient-to-r from-[#6a55e8] to-[#1f5ac8] px-[18px] text-[13px] font-medium text-white hover:brightness-110 disabled:opacity-60"><Ic d={I.spark} s={16} />{busy ? 'กำลังออกแบบ…' : 'สร้าง Dashboard ด้วย AI'}</button>
          </div>
        </Section>

        <Section title="รายละเอียด Dashboard">
          <Row label="ชื่อ Dashboard" req error={errors.name}><input aria-label="ชื่อ Dashboard" value={name} onChange={(e) => setName(e.target.value)} placeholder="เช่น Business Overview Dashboard" className={`${ctl} ${errors.name ? err : ''}`} /></Row>
          <Row label="คำอธิบาย"><textarea aria-label="คำอธิบาย Dashboard" value={desc} onChange={(e) => setDesc(e.target.value)} placeholder="วัตถุประสงค์หรือประเด็นที่ต้องการสรุปผล" className={`${ta} !min-h-[72px]`} /></Row>
        </Section>

        <Section title={`แผนภูมิที่ระบบแนะนำ${cards.length ? ` (เลือกแล้ว ${picked.length}/${cards.length})` : ''}`} action={<button type="button" onClick={() => setAdding(true)} className="flex h-[32px] items-center gap-[6px] rounded-[8px] border border-blue-00 px-[12px] text-[12px] font-medium text-blue-00 hover:bg-blue-bg"><Ic d={I.plus} s={14} w={2.2} />เพิ่ม Chart เอง</button>}>
          {errors.cards && <p role="alert" className="text-[12px] text-red-00">{errors.cards}</p>}
          {!cards.length && <p className="py-[20px] text-center text-[13px] font-light text-gray-20">พิมพ์ Prompt แล้วกด “สร้าง Dashboard ด้วย AI” เพื่อให้ระบบเสนอแผนภูมิ หรือกด “เพิ่ม Chart เอง”</p>}
          <div className="grid grid-cols-2 gap-[12px] max-md:grid-cols-1">
            {cards.map((c, i) => {
              const d = dataset(c.dataset)
              if (!d) return null
              return (
                <article key={`${c.dataset}-${i}`} aria-label={c.title} className={`flex flex-col gap-[8px] rounded-[14px] border p-[12px] transition ${c.on ? 'border-blue-00 bg-white shadow-[0_0_0_1px_var(--color-blue-00)]' : 'border-gray-line-2 bg-gray-subtle opacity-70'}`}>
                  <div className="flex items-start gap-[8px]">
                    <div className="min-w-0 flex-1"><p className="text-[13px] leading-[1.35] font-semibold">{c.title}</p><p className="text-[10px] font-light text-gray-20">{d.source}{c.custom ? ' · เพิ่มเอง' : ''}</p></div>
                    <button type="button" aria-pressed={c.on} onClick={() => setCards((p) => p.map((x, j) => (j === i ? { ...x, on: !x.on } : x)))} className={`flex h-[28px] shrink-0 items-center gap-[4px] rounded-full px-[12px] text-[11px] font-medium ${c.on ? 'bg-blue-00 text-white' : 'border border-gray-line bg-white text-gray-30 hover:border-blue-20'}`}>{c.on ? <><Ic d={I.check} s={12} w={2.6} />เลือกแล้ว</> : 'เลือก'}</button>
                    {c.custom && <button type="button" aria-label={`เอา ${c.title} ออก`} onClick={() => setCards((p) => p.filter((_, j) => j !== i))} className="flex size-[28px] shrink-0 items-center justify-center rounded-full border border-gray-line text-gray-30 hover:text-[#c13232]"><Ic d={I.x} s={12} /></button>}
                  </div>
                  <ChartView data={d} kind={c.kind} />
                  <label className="flex items-center gap-[8px] text-[11px] text-gray-30">ประเภทแผนภูมิ
                    <select aria-label={`ประเภทแผนภูมิ ${c.title}`} value={c.kind} onChange={(e) => setCards((p) => p.map((x, j) => (j === i ? { ...x, kind: e.target.value as ChartKind } : x)))} className="h-[28px] rounded-[6px] border border-gray-line bg-white px-[6px] text-[11px]">{kinds.map((k) => <option key={k} value={k}>{kindLabel[k]}</option>)}</select>
                  </label>
                </article>
              )
            })}
          </div>
        </Section>

        <div className="flex flex-wrap justify-end gap-[8px]">
          <button type="button" onClick={reset} className="flex h-[40px] items-center gap-[6px] rounded-[8px] border border-gray-line bg-white px-[18px] text-[13px] hover:border-gray-10"><Ic d={I.reset} s={14} />สร้างใหม่</button>
          <Btn onClick={save}>สร้าง Dashboard</Btn>
        </div>
      </div>

      <Modal open={adding} onClose={() => setAdding(false)} title="เพิ่ม Chart เอง" width="max-w-[460px]">
        <div className="flex flex-col gap-[12px]">
          <label className="flex flex-col gap-[4px] text-[12px] font-medium">ชุดข้อมูล
            <select aria-label="ชุดข้อมูล" value={custom.dataset} onChange={(e) => setCustom({ ...custom, dataset: e.target.value, kind: dataset(e.target.value)?.kind ?? 'bar' })} className={ctl}>{datasetKeys.map((k) => <option key={k} value={k}>{dataset(k)?.title}</option>)}</select>
          </label>
          <label className="flex flex-col gap-[4px] text-[12px] font-medium">ประเภทแผนภูมิ
            <select aria-label="ประเภทแผนภูมิที่เพิ่ม" value={custom.kind} onChange={(e) => setCustom({ ...custom, kind: e.target.value as ChartKind })} className={ctl}>{kinds.map((k) => <option key={k} value={k}>{kindLabel[k]}</option>)}</select>
          </label>
          <label className="flex flex-col gap-[4px] text-[12px] font-medium">ชื่อแผนภูมิ (ไม่บังคับ)
            <input aria-label="ชื่อแผนภูมิ" value={custom.title} onChange={(e) => setCustom({ ...custom, title: e.target.value })} placeholder={dataset(custom.dataset)?.title} className={ctl} />
          </label>
          <div className="flex justify-end gap-[8px]"><Btn kind="ghost" onClick={() => setAdding(false)}>ยกเลิก</Btn><Btn onClick={addCustom}>เพิ่ม</Btn></div>
        </div>
      </Modal>
      <Modal open={!!done} onClose={() => navigate('/report')} title="สร้าง Dashboard แล้ว" width="max-w-[440px]">
        <div className="flex flex-col items-center gap-[10px] text-center">
          <span className="flex size-[56px] items-center justify-center rounded-full bg-[#dff5e8] text-[#0f8a63]"><Ic d={I.check} s={28} w={2.4} /></span>
          <p className="text-[15px] font-semibold text-blue-dark">{done}</p>
          <p className="text-[13px] font-light text-gray-30">บันทึกแล้ว เปิดดูได้ที่ “Dashboard ของฉัน” บนหน้าแรก</p>
          <Link to="/report" className="flex h-[38px] items-center rounded-[8px] bg-blue-00 px-[16px] text-[13px] font-medium text-white">ไปที่หน้าแรก</Link>
        </div>
      </Modal>
    </div>
  )
}
