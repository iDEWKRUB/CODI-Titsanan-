import { useSyncExternalStore } from 'react'
import { seedNews, type News } from '../data/codiApp'
import { makeStore } from './localStore'

export const news = makeStore<News>('codi.app.news', seedNews)
export const useNews = news.use

// ---- admin role (the real system reads this from SSO) -------------------------------------------
const RKEY = 'codi.app.role'
let role: 'admin' | 'staff' = localStorage.getItem(RKEY) === 'staff' ? 'staff' : 'admin'
const ls = new Set<() => void>()
export const setAppRole = (r: 'admin' | 'staff') => {
  role = r
  localStorage.setItem(RKEY, r)
  ls.forEach((l) => l())
}
export const useAppRole = () =>
  useSyncExternalStore(
    (cb) => {
      ls.add(cb)
      return () => ls.delete(cb)
    },
    () => role,
  )

// ---- how often each quick link was opened (re-orders "เมนูระบบที่ใช้บ่อย") ------------------------
const QKEY = 'codi.app.quick'
const readQ = (): Record<string, number> => {
  try {
    return JSON.parse(localStorage.getItem(QKEY) || '{}')
  } catch {
    return {}
  }
}
export const bumpQuick = (id: string) => localStorage.setItem(QKEY, JSON.stringify({ ...readQ(), [id]: (readQ()[id] ?? 0) + 1 }))
export const quickCounts = readQ

/** reading a news item counts one view */
export const addView = (id: number) => news.update(id, (n) => ({ ...n, views: n.views + 1 }))

/** a published news item is visible once its publish date has come */
export const isLive = (n: News, today = new Date().toISOString().slice(0, 10)) => n.status === 'published' && n.date <= today
