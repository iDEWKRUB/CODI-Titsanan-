// Mock aggregated results (UI-only) — shaped like Figma OSS-Survey/Result-Responses (123:6106)
import type { Question, SurveyDraft } from './surveyBuilder'
import type { SurveyResponse } from '../lib/surveyStore'

export type ChartKind = 'pie' | 'bar-v' | 'bar-h'
export type ResultSeries = { key: string; title: string; unit: string; defaultKind: ChartKind; items: { label: string; value: number; color: string }[] }

const split = (total: number, weights: number[]) => {
  const sum = weights.reduce((a, b) => a + b, 0)
  const raw = weights.map((w) => Math.floor((w / sum) * total))
  raw[0] += total - raw.reduce((a, b) => a + b, 0)
  return raw
}

/** Deterministic mock breakdowns for a survey with `n` responses. */
export function mockResults(n: number): ResultSeries[] {
  const gender = split(n, [64.54, 34.4, 1.06])
  const region = split(n, [21.04, 18, 9, 27, 7, 18])
  const age = split(n, [27, 34, 27, 34, 38])
  const sat = split(n, [45, 41, 22, 1, 0])
  return [
    {
      key: 'gender',
      title: 'เพศ',
      unit: 'คน',
      defaultKind: 'pie',
      items: [
        { label: 'หญิง', value: gender[0], color: '#0079e6' },
        { label: 'ชาย', value: gender[1], color: '#a7dcff' },
        { label: 'ไม่ระบุ', value: gender[2], color: '#b3b7ba' },
      ],
    },
    {
      key: 'region',
      title: 'ภาค',
      unit: 'คน',
      defaultKind: 'pie',
      items: ['ภาคกลาง', 'ภาคตะวันออก', 'ภาคตะวันตก', 'ภาคตะวันออกเฉียงเหนือ', 'ภาคเหนือ', 'ภาคใต้'].map((label, i) => ({
        label,
        value: region[i],
        color: ['#004380', '#0079e6', '#4dabff', '#b3dbff', '#e5f3ff', '#abacad'][i],
      })),
    },
    {
      key: 'age',
      title: 'ช่วงอายุ',
      unit: 'คน',
      defaultKind: 'bar-v',
      items: ['18-25 ปี', '26-35 ปี', '36-45 ปี', '46-55 ปี', 'มากกว่า 55 ปี'].map((label, i) => ({ label, value: age[i], color: '#c1e7ff' })),
    },
    {
      key: 'satisfaction',
      title: 'ความพึงพอใจ',
      unit: 'คน',
      defaultKind: 'bar-h',
      items: ['มากที่สุด', 'มาก', 'ปานกลาง', 'น้อย', 'น้อยที่สุด'].map((label, i) => ({ label, value: sat[i], color: '#c1e7ff' })),
    },
  ]
}

// ---- Real summaries from stored answer sheets (lib/surveyStore → SurveyResponse) ----

const piePalette = ['#004380', '#0079e6', '#4dabff', '#b3dbff', '#e5f3ff', '#abacad']
const barColor = '#c1e7ff'

type Sheet = { answers: Record<string, unknown> }
export type TextSummary = { key: string; title: string; values: string[] }

const questionsOf = (d: SurveyDraft) => d.sections.flatMap((s) => s.questions).filter((q) => q.type !== 'title' && q.type !== 'image')
const titleOf = (q: Question, i: number) => q.title.trim() || `คำถามที่ ${i + 1}`

/** Chart series for choice / scale / rating questions, plus text answers for short / paragraph ones. */
export function realResults(d: SurveyDraft, sheets: Sheet[]): { charts: ResultSeries[]; texts: TextSummary[] } {
  const charts: ResultSeries[] = []
  const texts: TextSummary[] = []
  questionsOf(d).forEach((q, i) => {
    const title = titleOf(q, i)
    const vals = sheets.map((s) => s.answers[q.id])
    if (q.type === 'short' || q.type === 'paragraph') {
      texts.push({ key: q.id, title, values: vals.filter((v): v is string => typeof v === 'string' && v.trim() !== '') })
      return
    }
    let buckets: { id: string | number; label: string }[]
    if (q.type === 'single' || q.type === 'multi') {
      buckets = [...q.options.map((o, oi) => ({ id: o.id, label: o.label || `ตัวเลือกที่ ${oi + 1}` })), ...(q.hasOther ? [{ id: 'other', label: 'อื่น ๆ' }] : [])]
    } else {
      const from = q.type === 'scale' ? q.scaleMin : 1
      const to = q.type === 'scale' ? q.scaleMax : q.ratingMax
      buckets = Array.from({ length: to - from + 1 }, (_, k) => ({ id: from + k, label: q.type === 'rating' ? `${from + k} ดาว` : String(from + k) }))
    }
    const count = (id: string | number) => vals.filter((v) => (Array.isArray(v) ? v.includes(id) : v === id)).length
    const pie = q.type === 'single' && buckets.length <= piePalette.length
    charts.push({
      key: q.id,
      title,
      unit: 'คน',
      defaultKind: pie ? 'pie' : q.type === 'multi' ? 'bar-h' : 'bar-v',
      items: buckets.map((b, bi) => ({ label: b.label, value: count(b.id), color: pie ? piePalette[bi] : barColor })),
    })
  })
  return { charts, texts }
}

/** One CSV row per sheet: time, respondent, header-card fields, ข้อมูลทั่วไป, then every question. */
export function responseRows(d: SurveyDraft, sheets: SurveyResponse[]): string[][] {
  const qs = questionsOf(d)
  const generalKeys = [...new Set(sheets.flatMap((s) => Object.keys(s.general)))]
  const label = (q: Question, id: unknown) => (id === 'other' ? 'อื่น ๆ' : (q.options.find((o) => o.id === id)?.label ?? String(id)))
  const cell = (q: Question, a: Record<string, unknown>) => {
    const v = a[q.id]
    if (v === undefined || v === null || v === '') return ''
    const other = typeof a[`${q.id}:other`] === 'string' && a[`${q.id}:other`] ? ` (${a[`${q.id}:other`]})` : ''
    if (q.type === 'multi' && Array.isArray(v)) return v.map((x) => label(q, x) + (x === 'other' ? other : '')).join(', ')
    if (q.type === 'single') return label(q, v) + (v === 'other' ? other : '')
    return String(v)
  }
  return [
    ['เวลาที่ส่ง', 'อีเมล', 'รหัสจังหวัด', 'เลขที่ชุมชน', 'ลำดับครัวเรือน', ...generalKeys, ...qs.map(titleOf)],
    ...sheets.map((s) => [
      new Date(s.submittedAt).toLocaleString('th-TH'),
      s.email ?? '',
      s.meta.province,
      s.meta.community,
      s.meta.household ?? '',
      ...generalKeys.map((k) => s.general[k] ?? ''),
      ...qs.map((q) => cell(q, s.answers)),
    ]),
  ]
}
