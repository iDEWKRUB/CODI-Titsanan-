import { useSyncExternalStore } from 'react'
import { newDraft, type SurveyDraft } from '../data/surveyBuilder'
import { surveys as seed, type Survey, type SurveyStatus } from '../data/surveys'

// UI-only persistence (localStorage) until the survey API exists.
const LIST_KEY = 'codi.surveys'
const DRAFT_KEY = (id: number) => `codi.survey.${id}`

let list: Survey[] = load()
const listeners = new Set<() => void>()

function load(): Survey[] {
  try {
    const raw = localStorage.getItem(LIST_KEY)
    return raw ? (JSON.parse(raw) as Survey[]) : seed
  } catch {
    return seed
  }
}
function commit(next: Survey[]) {
  list = next
  localStorage.setItem(LIST_KEY, JSON.stringify(next))
  listeners.forEach((l) => l())
}

export function useSurveys() {
  return useSyncExternalStore(
    (cb) => {
      listeners.add(cb)
      return () => listeners.delete(cb)
    },
    () => list,
  )
}

export const nextSurveyId = () => Math.max(0, ...list.map((s) => s.id)) + 1
export const getSurvey = (id: number) => list.find((s) => s.id === id)

export function loadDraft(id: number): SurveyDraft {
  const raw = localStorage.getItem(DRAFT_KEY(id))
  if (raw) return JSON.parse(raw) as SurveyDraft
  const draft = newDraft(id)
  const row = getSurvey(id)
  if (row) {
    draft.title = row.name
    draft.type = row.type
  }
  return draft
}

const now = () => {
  const d = new Date()
  return { date: d.toISOString().slice(0, 10), time: d.toTimeString().slice(0, 5) }
}

/** Save the builder state and upsert its row in the survey list. */
export function saveDraft(draft: SurveyDraft, status?: SurveyStatus) {
  localStorage.setItem(DRAFT_KEY(draft.id), JSON.stringify(draft))
  const existing = getSurvey(draft.id)
  const { date, time } = now()
  const row: Survey = {
    id: draft.id,
    name: draft.title.trim() || 'แบบสอบถามไม่มีชื่อ',
    type: draft.type,
    createdDate: existing?.createdDate ?? date,
    createdTime: existing?.createdTime ?? time,
    startDate: draft.settings.scheduled ? draft.settings.startDate : (existing?.startDate ?? date),
    endDate: draft.settings.scheduled ? draft.settings.endDate : (existing?.endDate ?? date),
    responses: existing?.responses ?? 0,
    status: status ?? existing?.status ?? 'draft',
  }
  commit(existing ? list.map((s) => (s.id === row.id ? row : s)) : [row, ...list])
  return row
}

export function setSurveys(update: (prev: Survey[]) => Survey[]) {
  commit(update(list))
}

export function deleteSurvey(id: number) {
  localStorage.removeItem(DRAFT_KEY(id))
  localStorage.removeItem(RESPONSES_KEY(id))
  commit(list.filter((s) => s.id !== id))
}

/** Saved draft whose public link slug matches (respondent page /s/:slug). */
export function findDraftBySlug(slug: string): SurveyDraft | null {
  for (const s of list) {
    const raw = localStorage.getItem(DRAFT_KEY(s.id))
    if (!raw) continue
    const d = JSON.parse(raw) as SurveyDraft
    if (d.settings.slug === slug) return d
  }
  return null
}

/** One submitted answer sheet (kept in the browser until the survey API exists). */
export type SurveyResponse = {
  id: string
  submittedAt: string
  email?: string
  /** รหัสจังหวัด / เลขที่ชุมชน / ลำดับครัวเรือน from the header card */
  meta: { province: string; community: string; household: string }
  /** ข้อมูลทั่วไป inputs, keyed by their label */
  general: Record<string, string>
  answers: Record<string, unknown>
}
const RESPONSES_KEY = (id: number) => `codi.responses.${id}`
export const loadResponses = (id: number): SurveyResponse[] => JSON.parse(localStorage.getItem(RESPONSES_KEY(id)) ?? '[]')

/**
 * Store a submitted sheet. The first real response replaces a seeded (mock) count,
 * so ตอบแล้ว always equals the number of sheets that can be summarised.
 */
export function recordResponse(id: number, r: Omit<SurveyResponse, 'id' | 'submittedAt'>) {
  const all = [...loadResponses(id), { ...r, id: Math.random().toString(36).slice(2, 10), submittedAt: new Date().toISOString() }]
  localStorage.setItem(RESPONSES_KEY(id), JSON.stringify(all))
  commit(list.map((s) => (s.id === id ? { ...s, responses: all.length } : s)))
}

const ANSWER_KEY = (id: number) => `codi.answers.${id}`
export const loadAnswers = (id: number): Record<string, unknown> => JSON.parse(localStorage.getItem(ANSWER_KEY(id)) ?? '{}')
export const saveAnswers = (id: number, a: Record<string, unknown>) => localStorage.setItem(ANSWER_KEY(id), JSON.stringify(a))
export const clearAnswers = (id: number) => localStorage.removeItem(ANSWER_KEY(id))
