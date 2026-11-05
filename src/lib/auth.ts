// Demo-only auth (no backend yet). Replace with the real API when it is ready.
export type User = { email: string; name: string; initials: string }

const DEMO_ACCOUNT = {
  email: 'demo@codi.or.th',
  password: '123456',
  user: { email: 'demo@codi.or.th', name: 'ปรียาดา เจริญรัตนะ', initials: 'PJ' } satisfies User,
}

const KEY = 'codi.session'

export function login(email: string, password: string, remember: boolean): User | null {
  if (email.trim().toLowerCase() !== DEMO_ACCOUNT.email || password !== DEMO_ACCOUNT.password) return null
  const store = remember ? localStorage : sessionStorage
  store.setItem(KEY, JSON.stringify(DEMO_ACCOUNT.user))
  return DEMO_ACCOUNT.user
}

export function logout() {
  localStorage.removeItem(KEY)
  sessionStorage.removeItem(KEY)
}

export function currentUser(): User | null {
  const raw = sessionStorage.getItem(KEY) ?? localStorage.getItem(KEY)
  if (!raw) return null
  try {
    return JSON.parse(raw) as User
  } catch {
    return null
  }
}
