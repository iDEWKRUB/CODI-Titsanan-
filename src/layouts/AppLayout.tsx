import { useEffect, useState } from 'react'
import { Outlet, useNavigate } from 'react-router-dom'
import AppFooter from '../components/dashboard/AppFooter'
import Header from '../components/dashboard/Header'
import Sidebar from '../components/dashboard/Sidebar'
import { currentUser, logout } from '../lib/auth'

const DESKTOP = '(min-width: 1024px)'
const COLLAPSE_KEY = 'codi.sidebarCollapsed'

function useIsDesktop() {
  const [isDesktop, setIsDesktop] = useState(() => window.matchMedia(DESKTOP).matches)
  useEffect(() => {
    const mq = window.matchMedia(DESKTOP)
    const onChange = () => setIsDesktop(mq.matches)
    mq.addEventListener('change', onChange)
    return () => mq.removeEventListener('change', onChange)
  }, [])
  return isDesktop
}

export default function AppLayout() {
  const navigate = useNavigate()
  const user = currentUser()!
  const isDesktop = useIsDesktop()
  const [collapsed, setCollapsed] = useState(() => localStorage.getItem(COLLAPSE_KEY) === '1')
  const [drawerOpen, setDrawerOpen] = useState(false)

  useEffect(() => localStorage.setItem(COLLAPSE_KEY, collapsed ? '1' : '0'), [collapsed])
  useEffect(() => {
    if (isDesktop) setDrawerOpen(false)
  }, [isDesktop])
  useEffect(() => {
    if (!drawerOpen) return
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && setDrawerOpen(false)
    document.addEventListener('keydown', onKey)
    document.body.style.overflow = 'hidden'
    return () => {
      document.removeEventListener('keydown', onKey)
      document.body.style.overflow = ''
    }
  }, [drawerOpen])

  const toggleSidebar = () => (isDesktop ? setCollapsed((v) => !v) : setDrawerOpen((v) => !v))
  const handleLogout = () => {
    logout()
    navigate('/login', { replace: true })
  }

  return (
    <div className="flex min-h-svh bg-shell">
      {/* Desktop sidebar */}
      <aside
        className={`sticky top-0 hidden h-svh shrink-0 transition-[width] duration-300 ease-out lg:block ${
          collapsed ? 'w-[86px] px-[12px]' : 'w-[279px] pr-[12px] pl-[27px]'
        }`}
      >
        <Sidebar collapsed={collapsed} onExpand={() => setCollapsed(false)} />
      </aside>

      {/* Mobile drawer */}
      <div
        className={`fixed inset-0 z-40 bg-black/40 transition-opacity lg:hidden ${drawerOpen ? 'opacity-100' : 'pointer-events-none opacity-0'}`}
        onClick={() => setDrawerOpen(false)}
        aria-hidden="true"
      />
      <aside
        aria-hidden={!drawerOpen}
        inert={!drawerOpen}
        className={`fixed inset-y-0 left-0 z-50 w-[279px] max-w-[85vw] bg-shell px-[12px] shadow-2xl transition-transform duration-300 ease-out lg:hidden ${
          drawerOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        <Sidebar collapsed={false} onNavigate={() => setDrawerOpen(false)} />
      </aside>

      <div className="relative my-[12px] mr-[11px] flex min-w-0 flex-1 flex-col overflow-clip rounded-[24px] bg-white pt-[24px] max-lg:m-[8px] max-lg:pt-[16px]">
        <Header
          user={user}
          railMode={isDesktop && collapsed}
          sidebarExpanded={isDesktop ? !collapsed : drawerOpen}
          onToggleSidebar={toggleSidebar}
          onLogout={handleLogout}
        />
        <main className="relative z-10 flex-1 pt-[24px]">
          <Outlet />
        </main>
        <AppFooter />
      </div>
    </div>
  )
}
