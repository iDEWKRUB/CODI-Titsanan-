// AUTOMATION INTELLIGENCE REPORT — AI chatbot report builder + dashboard designer (book 3 §2.5.1)
import { stamp } from './strategic'

export { stamp }

export type ChartKind = 'bar' | 'barh' | 'line' | 'donut'
export const kindLabel: Record<ChartKind, string> = { bar: 'แผนภูมิแท่ง', barh: 'แผนภูมิแท่งแนวนอน', line: 'แผนภูมิเส้น', donut: 'แผนภูมิวงกลม' }
export type Item = { label: string; value: number }
export type Dataset = { key: string; title: string; source: string; unit: string; kind: ChartKind; live: boolean; items: Item[] }

/** palette in fixed order (never cycled) — same blues as the portal plus accents for contrast */
export const palette = ['#1f5ac8', '#17a673', '#e08a00', '#6a55e8', '#dc3b3b', '#4aa3ff', '#8a94a6']

// ---- reports ("คำสั่งยอดนิยม") — each one bundles datasets and matches typed commands by keyword -------------------------
export type ReportDef = { key: string; title: string; desc: string; keywords: string[]; datasets: string[]; prompt: string; dash: string }
export const reports: ReportDef[] = [
  { key: 'org', title: 'สรุปพื้นที่องค์กรชุมชน', desc: 'จำนวนองค์กรชุมชนแยกตามภาค', keywords: ['องค์กรชุมชน', 'พื้นที่', 'ภาค', 'สภา', 'ชุมชน'], datasets: ['org-region', 'org-type'], prompt: 'วิเคราะห์ข้อมูลองค์กรชุมชนแยกตามภาคและประเภท', dash: 'org' },
  { key: 'kpi', title: 'สรุปตัวชี้วัดแผนงานโครงการพื้นที่', desc: 'ความคืบหน้าตัวชี้วัดและงบประมาณรายเดือน', keywords: ['ตัวชี้วัด', 'แผนงาน', 'โครงการ', 'kpi', 'งบ', 'งบประมาณ'], datasets: ['kpi', 'budget-month'], prompt: 'สรุปตัวชี้วัดแผนงานและงบประมาณโครงการ', dash: 'kpi' },
  { key: 'booking', title: 'สรุปการใช้พื้นที่ประชุมและการจอง', desc: 'คำขอจองห้อง รถ Zoom และยืมพัสดุ', keywords: ['ประชุม', 'จอง', 'ห้อง', 'รถ', 'zoom', 'ยืม', 'ยานพาหนะ'], datasets: ['booking-kind', 'booking-status'], prompt: 'สรุปการจองทรัพยากรและห้องประชุม', dash: 'booking' },
  { key: 'contract', title: 'สรุปสถานะสัญญา', desc: 'สัญญาแยกตามสถานะและประเภท', keywords: ['สัญญา', 'mou', 'ลงนาม', 'ทะเบียนสัญญา'], datasets: ['contract-status', 'contract-type'], prompt: 'สรุปสถานะและประเภทสัญญาทั้งหมด', dash: 'contract' },
  { key: 'asset', title: 'สรุปพัสดุและงานซ่อม', desc: 'ทะเบียนพัสดุ-ครุภัณฑ์และสถานะแจ้งซ่อม', keywords: ['พัสดุ', 'ครุภัณฑ์', 'ซ่อม', 'สต็อก', 'คงคลัง'], datasets: ['asset-state', 'repair-status'], prompt: 'สรุปพัสดุ ครุภัณฑ์ และงานแจ้งซ่อม', dash: 'asset' },
  { key: 'notify', title: 'สรุปการแจ้งเตือนตามความเสี่ยง', desc: 'การแจ้งเตือนแยกตามระดับและสถานะ', keywords: ['แจ้งเตือน', 'ความเสี่ยง', 'เตือน'], datasets: ['notify-sev', 'notify-status'], prompt: 'สรุปการแจ้งเตือนตามระดับความเสี่ยง', dash: 'notify' },
]
/** which report does a typed command ask for? keyword hits, longest keyword wins ties; 0 hits → undefined */
export function matchReport(text: string): ReportDef | undefined {
  const t = text.toLowerCase()
  let best: { r: ReportDef; score: number } | undefined
  for (const r of reports) {
    const score = r.keywords.reduce((s, k) => (t.includes(k.toLowerCase()) ? s + 1 + k.length / 100 : s), 0)
    if (score > 0 && (!best || score > best.score)) best = { r, score }
  }
  return best?.r
}

// ---- static sample datasets (no store behind them yet) ---------------------------------------------------------------------
export const staticSets: Record<string, Omit<Dataset, 'key' | 'live'>> = {
  'org-region': { title: 'องค์กรชุมชนแยกตามภาค', source: 'ภาพรวมองค์กร (ข้อมูลตัวอย่าง)', unit: 'องค์กร', kind: 'bar', items: [{ label: 'กทม.&ตอ.', value: 18420 }, { label: 'กลาง&ตอ.', value: 31560 }, { label: 'ตอ.เฉียงเหนือ', value: 52310 }, { label: 'ใต้', value: 21980 }, { label: 'เหนือ', value: 31770 }] },
  'org-type': { title: 'องค์กรชุมชนแยกตามประเภท', source: 'ภาพรวมองค์กร (ข้อมูลตัวอย่าง)', unit: 'องค์กร', kind: 'donut', items: [{ label: 'กลุ่มออมทรัพย์', value: 48200 }, { label: 'สภาองค์กรชุมชน', value: 7749 }, { label: 'วิสาหกิจชุมชน', value: 38400 }, { label: 'กองทุนสวัสดิการ', value: 6080 }, { label: 'อื่น ๆ', value: 55611 }] },
  kpi: { title: 'ความคืบหน้าตัวชี้วัดแผนงาน', source: 'ERP STRATEGIC (ข้อมูลตัวอย่าง)', unit: 'ร้อยละ', kind: 'barh', items: [{ label: 'ชุมชนมีแผนพัฒนา', value: 82 }, { label: 'ผู้นำผ่านการอบรม', value: 67 }, { label: 'โครงการเสร็จตามแผน', value: 74 }, { label: 'เบิกจ่ายงบประมาณ', value: 59 }, { label: 'พื้นที่ได้รับการสำรวจ', value: 91 }] },
  'budget-month': { title: 'การเบิกจ่ายงบประมาณรายเดือน', source: 'ERP FINANCE (ข้อมูลตัวอย่าง)', unit: 'ล้านบาท', kind: 'line', items: [{ label: 'พ.ค.', value: 12.4 }, { label: 'มิ.ย.', value: 15.8 }, { label: 'ก.ค.', value: 14.1 }, { label: 'ส.ค.', value: 19.6 }, { label: 'ก.ย.', value: 23.2 }, { label: 'ต.ค.', value: 17.5 }] },
}

// ---- saved dashboards ----------------------------------------------------------------------------------------------------
export type DashChart = { dataset: string; kind: ChartKind; title: string }
export type Dash = { id: number; name: string; desc: string; prompt: string; charts: DashChart[]; createdAt: string }

/** one human sentence about a dataset — computed from its numbers, so it is never out of step with the chart */
export function narrate(d: Dataset): string {
  const total = d.items.reduce((s, i) => s + i.value, 0)
  if (!d.items.length || total === 0) return `ยังไม่มีข้อมูล${d.title}ในระบบ`
  const top = [...d.items].sort((a, b) => b.value - a.value)[0]
  const fmt = (n: number) => n.toLocaleString('th-TH', { maximumFractionDigits: 1 })
  if (d.unit === 'ร้อยละ') return `ค่าเฉลี่ย ${fmt(total / d.items.length)} ร้อยละ — สูงสุดคือ “${top.label}” ${fmt(top.value)} ร้อยละ`
  if (d.kind === 'line') return `รวม ${fmt(total)} ${d.unit} — เดือนที่สูงสุดคือ ${top.label} (${fmt(top.value)} ${d.unit})`
  return `รวม ${fmt(total)} ${d.unit} — มากที่สุดคือ “${top.label}” ${fmt(top.value)} ${d.unit} (ร้อยละ ${fmt((top.value / total) * 100)})`
}
