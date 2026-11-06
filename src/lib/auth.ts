// Demo-only auth (no backend yet). Replace with the real API when it is ready.
export type User = { email: string; name: string; initials: string }

const DEMO_ACCOUNT = {
  email: 'demo@codi.or.th',
  password: '123456',
  user: { email: 'demo@codi.or.th', name: 'ปริยดา เจริญวัฒนกุล', initials: 'PJ' } satisfies User,
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

/** Demo ThaiD sign-in: the real system exchanges the OIDC code from ThaiD (DOPA) for the citizen ID and maps it to a staff account */
export const THAID_DEMO = { pid: '1103700012345', name: 'ปริยดา เจริญวัฒนกุล', nameEn: 'Priyada Charoenwattanakul', birth: '14/02/2535', staffCode: 'E-0412' }
export function loginWithThaiD(): User {
  const user = { ...DEMO_ACCOUNT.user, method: 'thaid' } as User
  localStorage.setItem(KEY, JSON.stringify(user))
  return user
}
