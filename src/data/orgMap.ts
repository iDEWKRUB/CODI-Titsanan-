import { provinceCenters } from './provinceCenters'
import { mapProvinces } from './thaiMap'

// OSS › แผนที่เชิงภูมิศาสตร์ › ข้อมูลองค์กรชุมชน — sample points until the community-organisation API exists.
export type PointKind = 'council' | 'org' | 'leader' | 'project' | 'problem'
export const kindLabel: Record<PointKind, string> = { council: 'สภาองค์กรชุมชน', org: 'องค์กรชุมชน', leader: 'ผู้นำชุมชน', project: 'โครงการ', problem: 'ปัญหาในพื้นที่' }
export const kindColor: Record<PointKind, string> = { council: '#1e90e6', org: '#1aa33a', leader: '#f2b21a', project: '#f26d5b', problem: '#8b5cf6' }
export const orgTypes = ['ชุมชนผู้มีรายได้น้อย', 'บ้านมั่นคง', 'บ้านพอเพียง'] as const
export type OrgType = (typeof orgTypes)[number]
export const localTypes = ['เทศบาล', 'อบต.', 'กรุงเทพมหานคร']

export type MapPoint = {
  id: string
  kind: PointKind
  name: string
  region: string
  province: string
  district: string
  subdistrict: string
  localType: string
  lat: number
  lng: number
  members: number
  households: number
  communities: number
  orgType?: OrgType
  detail?: string
  /** leader profile (hover card) */
  position?: string
  phone?: string
  email?: string
  address?: string
  orgName?: string
  /** problem points */
  problemType?: ProblemKind
  reports?: number
}

// ---- spatial problems (OSS-Area › พื้นที่สำรวจ) -----------------------------------------------
export type ProblemKind = 'flood' | 'fire' | 'risk' | 'house'
export const problemKinds: ProblemKind[] = ['flood', 'fire', 'risk', 'house']
export const problemLabel: Record<ProblemKind, string> = { flood: 'น้ำท่วมซ้ำซาก', fire: 'ไฟไหม้ซ้ำซาก', risk: 'พื้นที่เสี่ยงภัยพิบัติ', house: 'บ้านทรุดโทรม' }
export const problemTitle: Record<ProblemKind, string> = { flood: 'พื้นที่น้ำท่วม', fire: 'พื้นที่ไฟไหม้', risk: 'พื้นที่เสี่ยงภัยพิบัติ', house: 'พื้นที่บ้านทรุดโทรม' }
export const problemColor: Record<ProblemKind, string> = { flood: '#39c5e8', fire: '#f26d5b', risk: '#f6c453', house: '#8fdc4e' }

export type ProblemReport = {
  id: number
  type: ProblemKind
  detail: string
  region: string
  province: string
  district: string
  subdistrict: string
  moo: string
  soi: string
  road: string
  lat: number
  lng: number
  reportedAt: string
  /** report added to an existing point (increments its counter) */
  pointId?: string
  file?: string
  impact: { provinces: string; subdistricts: string; orgs: string; communities: string; cities: string; households: string }
}

// ---- deterministic sample generator ---------------------------------------------------------
function rng(seed: number) {
  let a = seed >>> 0
  return () => {
    a = (a + 0x6d2b79f5) >>> 0
    let t = Math.imul(a ^ (a >>> 15), 1 | a)
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
}
const hashOf = (s: string) => [...s].reduce((h, c) => (h * 31 + c.charCodeAt(0)) >>> 0, 7)
/** Split `total` into n integer parts that follow `weights` (sum is exact) */
function split(total: number, weights: number[]) {
  const sum = weights.reduce((a, b) => a + b, 0) || 1
  const raw = weights.map((w) => (w / sum) * total)
  const out = raw.map(Math.floor)
  let left = total - out.reduce((a, b) => a + b, 0)
  raw.map((r, i) => [r - Math.floor(r), i] as const).sort((a, b) => b[0] - a[0]).forEach(([, i]) => left-- > 0 && out[i]++)
  return out
}
const firstNames = ['สมศรี', 'บุญเลิศ', 'ประยูร', 'วันเพ็ญ', 'ชัยรัตน์', 'อรทัย', 'สุพจน์', 'นฤมล', 'ธีรพงษ์', 'จันทร์เพ็ญ', 'ภานุวัฒน์', 'ศิริพร']
const lastNames = ['ใจดี', 'สุขสวัสดิ์', 'พรหมมา', 'แก้วมณี', 'ทองคำ', 'วงศ์ษา', 'ศรีสุข', 'บุญมี']

type Area = { province: string; district: string; subs: string[]; center: [number, number]; spread: number; council: number; org: number; leader: number; project: number; members: number; households: number; types: [number, number, number] | null }

function build(a: Area): MapPoint[] {
  const region = mapProvinces.find((p) => p.name === a.province)?.region ?? ''
  const r = rng(hashOf(a.province + a.district))
  const out: MapPoint[] = []
  const place = () => ({ lat: a.center[0] + (r() - 0.5) * a.spread, lng: a.center[1] + (r() - 0.5) * a.spread * 1.2 })
  const sub = () => a.subs[Math.floor(r() * a.subs.length)]
  const base = (kind: PointKind, n: number, name: string, s: string): MapPoint => ({
    id: `${a.province}-${a.district}-${kind}-${n}`,
    kind,
    name,
    region,
    province: a.province,
    district: a.district,
    subdistrict: s,
    localType: a.province === 'กรุงเทพมหานคร' ? 'กรุงเทพมหานคร' : r() < 0.4 ? 'เทศบาล' : 'อบต.',
    ...place(),
    members: 0,
    households: 0,
    communities: 0,
  })
  const entities: MapPoint[] = []
  for (let i = 0; i < a.council; i++) {
    const s = a.subs[i % a.subs.length]
    entities.push(base('council', i, `สภาองค์กรชุมชนตำบล${s}`, s))
  }
  const orgs: MapPoint[] = []
  for (let i = 0; i < a.org; i++) {
    const s = a.subs[i % a.subs.length]
    orgs.push(base('org', i, `องค์กรชุมชน${s} ${Math.floor(i / a.subs.length) + 1}`, s))
  }
  entities.push(...orgs)
  const memberW = entities.map(() => 0.5 + r())
  split(a.members, memberW).forEach((m, i) => (entities[i].members = m))
  split(a.households, orgs.map(() => 0.5 + r())).forEach((h, i) => (orgs[i].households = h))
  if (a.types && orgs.length) {
    // first group of orgs = low income, then บ้านมั่นคง, last = บ้านพอเพียง; each type's community total is shared inside its group
    const groups = split(orgs.length, a.types.map((t) => t || 0.0001))
    let at = 0
    groups.forEach((g, ti) => {
      const part = orgs.slice(at, at + g)
      split(a.types![ti], part.map(() => 0.5 + r())).forEach((c, i) => {
        part[i].communities = c
        part[i].orgType = orgTypes[ti]
      })
      at += g
    })
  } else {
    orgs.forEach((o) => ((o.orgType = orgTypes[Math.floor(r() * 3)]), (o.communities = 1 + Math.floor(r() * 5))))
  }
  for (let i = 0; i < a.leader; i++) {
    const s = sub()
    const p = base('leader', i, `${firstNames[Math.floor(r() * firstNames.length)]} ${lastNames[Math.floor(r() * lastNames.length)]}`, s)
    const n = Math.floor(r() * 9000) + 1000
    out.push({
      ...p,
      detail: `ผู้นำองค์กรชุมชนตำบล${s}`,
      position: ['ประธาน', 'รองประธาน', 'กรรมการ', 'เหรัญญิก'][Math.floor(r() * 4)],
      phone: `08${Math.floor(r() * 10)}-${Math.floor(r() * 900 + 100)}-${n}`,
      email: `leader${n}@example.com`,
      address: `เลขที่ ${Math.floor(r() * 200) + 1} หมู่ ${Math.floor(r() * 12) + 1} ต.${s} อ.${a.district} จ.${a.province}`,
      orgName: `กลุ่มออมทรัพย์เพื่อการพัฒนา${s}`,
    })
  }
  for (let i = 0; i < a.project; i++) {
    const s = sub()
    const t = orgTypes[Math.floor(r() * 3)]
    out.push({ ...base('project', i, `โครงการ${t === 'บ้านมั่นคง' ? 'บ้านมั่นคง' : t === 'บ้านพอเพียง' ? 'บ้านพอเพียง' : 'แก้ไขปัญหาที่อยู่อาศัย'} ${s}`, s), detail: t })
  }
  return [...entities, ...out]
}

const maeChaem: Area = {
  province: 'เชียงใหม่',
  district: 'แม่แจ่ม',
  subs: ['ช่างเคิ่ง', 'ท่าผา', 'บ้านทับ', 'ปางหินฝน', 'กองแขก', 'แม่นาจร', 'บ้านจันทร์', 'แจ่มหลวง'],
  center: [18.45, 98.37],
  spread: 0.5,
  council: 4,
  org: 56,
  leader: 15,
  project: 36,
  members: 1295,
  households: 945,
  types: [2008, 858, 31],
}

export function seedPoints(): MapPoint[] {
  const out: MapPoint[] = build(maeChaem)
  for (const p of mapProvinces) {
    const c = provinceCenters[p.name]
    if (!c) continue
    const r = rng(hashOf(p.name))
    const n = Math.floor(r() * 4)
    out.push(
      ...build({
        province: p.name,
        district: `เมือง${p.name}`,
        subs: ['ในเมือง', 'บางกลาง', 'หนองใหญ่', 'บ้านใหม่'],
        center: c,
        spread: 0.45,
        council: 1 + (n % 2),
        org: 3 + n,
        leader: 2 + (n % 3),
        project: 2 + n,
        members: 120 + Math.floor(r() * 400),
        households: 60 + Math.floor(r() * 200),
        types: null,
      }),
    )
  }
  return out
}
/** Problem points around Mae Chaem (counts of reports follow the Figma card: 645 for the flood area) */
function seedProblems(): MapPoint[] {
  const r = rng(4242)
  const subs = maeChaem.subs
  const out: MapPoint[] = []
  let n = 0
  for (const kind of problemKinds) {
    const count = kind === 'flood' ? 5 : kind === 'fire' ? 3 : kind === 'risk' ? 3 : 3
    for (let i = 0; i < count; i++) {
      const s = subs[Math.floor(r() * subs.length)]
      out.push({
        id: `problem-seed-${n++}`,
        kind: 'problem',
        problemType: kind,
        name: problemTitle[kind],
        region: 'ภาคเหนือ',
        province: 'เชียงใหม่',
        district: 'แม่แจ่ม',
        subdistrict: s,
        localType: 'อบต.',
        lat: maeChaem.center[0] + (r() - 0.5) * 0.5,
        lng: maeChaem.center[1] + (r() - 0.5) * 0.6,
        members: 0,
        households: 0,
        communities: 0,
        reports: kind === 'flood' && i === 0 ? 645 : 20 + Math.floor(r() * 400),
      })
    }
  }
  return out
}
export const allPoints = [...seedPoints(), ...seedProblems()]

export type AreaStats = { council: number; org: number; members: number; project: number; leader: number; households: number; types: Record<OrgType, number> }
export function statsOf(list: MapPoint[]): AreaStats {
  const s: AreaStats = { council: 0, org: 0, members: 0, project: 0, leader: 0, households: 0, types: { ชุมชนผู้มีรายได้น้อย: 0, บ้านมั่นคง: 0, บ้านพอเพียง: 0 } }
  for (const p of list) {
    if (p.kind === 'council') s.council++
    if (p.kind === 'org') {
      s.org++
      s.households += p.households
      if (p.orgType) s.types[p.orgType] += p.communities
    }
    if (p.kind === 'council' || p.kind === 'org') s.members += p.members
    if (p.kind === 'project') s.project++
    if (p.kind === 'leader') s.leader++
  }
  return s
}

/** Seed points + problems reported through the form (a report on an existing point only raises its counter) */
export function withReports(reports: ProblemReport[], areas: SurveyAreaRecord[] = []): MapPoint[] {
  const extra = new Map<string, number>()
  for (const r of reports) if (r.pointId) extra.set(r.pointId, (extra.get(r.pointId) ?? 0) + 1)
  const base = allPoints.map((p) => (p.kind === 'problem' && extra.has(p.id) ? { ...p, reports: (p.reports ?? 0) + extra.get(p.id)! } : p))
  const mine: MapPoint[] = reports
    .filter((r) => !r.pointId)
    .map((r) => ({
      id: `problem-${r.id}`,
      kind: 'problem' as const,
      problemType: r.type,
      name: problemTitle[r.type],
      region: r.region,
      province: r.province,
      district: r.district,
      subdistrict: r.subdistrict,
      localType: 'อบต.',
      lat: r.lat,
      lng: r.lng,
      members: 0,
      households: Number(r.impact.households) || 0,
      communities: 0,
      detail: r.detail,
      reports: 1,
    }))
  const fromAreas: MapPoint[] = areas.map((a) => ({
    id: 'area-' + a.id,
    kind: 'problem' as const,
    problemType: 'risk' as const,
    name: 'พื้นที่สำรวจ ' + a.code,
    region: a.region,
    province: a.province,
    district: a.district,
    subdistrict: a.subdistrict,
    localType: a.apt === 'อบต.' ? 'อบต.' : a.apt.startsWith('เทศบาล') ? 'เทศบาล' : a.apt === 'กรุงเทพมหานคร' ? a.apt : 'อบต.',
    lat: a.lat,
    lng: a.lng,
    members: 0,
    households: Number(a.households) || 0,
    communities: 0,
    detail: 'พื้นที่สำรวจที่เจ้าหน้าที่เพิ่ม · ผู้เดือดร้อน ' + (a.households || '0') + ' ครัวเรือน',
    reports: 1,
  }))
  return [...base, ...mine, ...fromAreas]
}

// ---- survey areas added by staff (OSS-Area › เพิ่ม/แก้ไขพื้นที่สำรวจ) ----------------------------
export type SurveyAreaRecord = {
  id: number
  code: string
  houseNo: string
  moo: string
  soi: string
  road: string
  region: string
  province: string
  district: string
  subdistrict: string
  apt: string
  zip: string
  lat: number
  lng: number
  households: string
  rai: string
  ngan: string
  wa: string
  people: string
  provinces: string
  subdistricts: string
  orgs: string
  communities: string
  cities: string
  prefix: string
  firstName: string
  lastName: string
  phone: string
  email: string
}
export const areaCode = (id: number) => 'AREA-' + String(id).padStart(5, '0')
export const aptOptions = ['ไม่ระบุ', 'อบต.', 'เทศบาลตำบล', 'เทศบาลเมือง', 'เทศบาลนคร', 'กรุงเทพมหานคร']
export const blankArea = (id: number): SurveyAreaRecord => ({ id, code: areaCode(id), houseNo: '', moo: '', soi: '', road: '', region: 'ภาคเหนือ', province: 'เชียงใหม่', district: 'แม่แจ่ม', subdistrict: 'แม่นาจร', apt: 'ไม่ระบุ', zip: '', lat: 18.45, lng: 98.37, households: '', rai: '', ngan: '', wa: '', people: '', provinces: '', subdistricts: '', orgs: '', communities: '', cities: '', prefix: 'นาย', firstName: '', lastName: '', phone: '', email: '' })
export const seedAreas = (): SurveyAreaRecord[] => [
  { ...blankArea(43), houseNo: '12', moo: '5', subdistrict: 'ท่าผา', zip: '50270', lat: 18.5, lng: 98.31, households: '38', rai: '24', ngan: '2', wa: '40', people: '152', provinces: '1', subdistricts: '1', orgs: '2', communities: '3', cities: '0', prefix: 'นาย', firstName: 'ทรงกิตติ์', lastName: 'วาวาอุทัย', phone: '0854339889' },
  { ...blankArea(44), houseNo: '77', moo: '2', subdistrict: 'บ้านทับ', zip: '50270', lat: 18.38, lng: 98.46, households: '21', rai: '10', ngan: '1', wa: '0', people: '84', provinces: '1', subdistricts: '1', orgs: '1', communities: '2', cities: '0', prefix: 'นาง', firstName: 'สมศรี', lastName: 'ใจดี', phone: '0812345678' },
  { ...blankArea(45), houseNo: '90', moo: '3', subdistrict: 'แม่นาจร', zip: '50270', lat: 18.46, lng: 98.4, households: '64', rai: '40', ngan: '0', wa: '75', people: '230', provinces: '1', subdistricts: '1', orgs: '3', communities: '4', cities: '0', prefix: 'นาย', firstName: 'กรณ์', lastName: 'วาวาอุทัย', phone: '0854339889', email: 'karn.v@gmail.com' },
]
