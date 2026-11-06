import { useLocation } from 'react-router-dom'
import { aPersonas } from '../data/erpAsset'
import { fPersonas } from '../data/erpFinance'
import { gPersonas } from '../data/erpFunding'
import { hPersonas } from '../data/erpHr'
import { people } from '../data/saraban'
import { personas } from '../data/strategic'
import { currentUser } from './auth'
import { useAPersona } from './assetStore'
import { useFPersona } from './erpFinanceStore'
import { useGPersona } from './erpFundingStore'
import { ME, useEmps, useHPersona } from './hrStore'
import { useMe as useSarabanMe } from './sarabanStore'
import { usePersona } from './strategicStore'

export type Acting = { name: string; role: string; initials: string; isSelf: boolean; photo?: string }

const SELF = 'ปริยดา เจริญวัฒนกุล'
const LEAD = /^[เแโใไ]/
const TITLES = /^(ผอ\.|รอง|นาย|นางสาว|นาง)$/

/** Thai initials: first consonant of the first name and of the surname ("สุรพล ศิริรัตน์" → "สศ") */
export function initialsOf(name: string) {
  const words = name.replace(/\(.*?\)/g, '').split(/\s+/).filter((w) => w && !TITLES.test(w))
  const pick = (w = '') => (LEAD.test(w) ? w.slice(1, 2) : w.slice(0, 1))
  return (pick(words[0]) + pick(words[1])).toUpperCase() || '?'
}

/** Soft avatar colours, chosen by name so each person keeps the same colour everywhere */
const tones = [['#ffb3b3', '#8a2f2f'], ['#c9e4ff', '#00357d'], ['#cdeedd', '#0f6b4c'], ['#ffe2b8', '#8a5200'], ['#e2d9ff', '#4a33a8'], ['#d6f1f4', '#0b6b78']]
export function toneOf(name: string, isSelf: boolean) {
  if (isSelf) return tones[0]
  let h = 0
  for (const c of name) h = (h * 31 + c.charCodeAt(0)) >>> 0
  return tones[1 + (h % (tones.length - 1))]
}

/**
 * Who the header avatar shows. Inside an ERP system the demo "ดูในฐานะ" persona switch decides
 * (the real system will take this from SSO); everywhere else it is the signed-in user.
 */
export function useActingUser(): Acting {
  const { pathname } = useLocation()
  const fin = useFPersona()
  const fund = useGPersona()
  const hr = useHPersona()
  const sar = useSarabanMe()
  const strat = usePersona()
  const asset = useAPersona()
  const user = currentUser()
  // one person record for everyone: the HR employee list (photo + name edited in ERP HR › ข้อมูลของฉัน)
  const list = useEmps()
  const mine = list.find((e) => e.id === ME)
  const photoOf = (name: string) => list.find((e) => e.firstTh + ' ' + e.lastTh === name)?.photo
  const selfName = mine ? mine.firstTh + ' ' + mine.lastTh : user?.name === 'ปรียาดา เจริญรัตนะ' ? SELF : user?.name ?? SELF
  const self: Acting = { name: selfName, role: 'เจ้าหน้าที่', initials: user?.initials ?? 'PJ', isSelf: true, photo: mine?.photo }

  const at = (p: string) => pathname === p || pathname.startsWith(p + '/')
  let who: { name: string; role: string } | null = null
  if (at('/finance')) who = { name: fPersonas[fin].name, role: fPersonas[fin].short }
  else if (at('/funding')) who = { name: gPersonas[fund].name, role: gPersonas[fund].short }
  else if (at('/hr')) who = { name: hPersonas[hr].name, role: hPersonas[hr].short }
  else if (at('/asset')) who = { name: aPersonas[asset].name, role: aPersonas[asset].short }
  else if (at('/saraban')) who = { name: people[sar].name, role: people[sar].pos }
  else if (at('/strategic') || at('/project')) who = { name: personas[strat].name, role: personas[strat].short }

  if (!who || who.name === self.name || who.name === SELF) return who ? { ...self, role: who.role } : self
  return { name: who.name, role: who.role, initials: initialsOf(who.name), isSelf: false, photo: photoOf(who.name) }
}
