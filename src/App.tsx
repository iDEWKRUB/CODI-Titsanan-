import type { ReactNode } from 'react'
import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom'
import { allNavItems } from './data/navigation'
import AppLayout from './layouts/AppLayout'
import { currentUser } from './lib/auth'
import ComingSoonPage from './pages/ComingSoonPage'
import DashboardPage from './pages/DashboardPage'
import LoginPage from './pages/LoginPage'
import MeetingAgendaPage from './pages/MeetingAgendaPage'
import MeetingDetailPage from './pages/MeetingDetailPage'
import MeetingExpensePage from './pages/MeetingExpensePage'
import MeetingFormPage from './pages/MeetingFormPage'
import MeetingPage from './pages/MeetingPage'
import ProfilePage from './pages/ProfilePage'
import SurveyAnswerPage from './pages/SurveyAnswerPage'
import SurveyBuilderPage from './pages/SurveyBuilderPage'
import SurveyPage from './pages/SurveyPage'
import TorDiagramPage from './pages/TorDiagramPage'
import TorPage from './pages/TorPage'

// Guards are components so the session is re-checked on every navigation
function RequireAuth({ children }: { children: ReactNode }) {
  return currentUser() ? children : <Navigate to="/login" replace />
}

function GuestOnly({ children }: { children: ReactNode }) {
  return currentUser() ? <Navigate to="/dashboard" replace /> : children
}

const builtPages: Record<string, ReactNode> = {
  '/dashboard': <DashboardPage />,
  '/survey': <SurveyPage />,
  '/meeting': <MeetingPage />,
  '/tor': <Navigate to="/tor/high-level" replace />,
}

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route
          path="/login"
          element={
            <GuestOnly>
              <LoginPage />
            </GuestOnly>
          }
        />
        <Route
          element={
            <RequireAuth>
              <AppLayout />
            </RequireAuth>
          }
        >
          {/* One route per sidebar menu; menus without a design yet show a placeholder */}
          {allNavItems.map((item) => (
            <Route key={item.to} path={item.to} element={builtPages[item.to] ?? <ComingSoonPage />} />
          ))}
          <Route path="/survey/create" element={<SurveyBuilderPage />} />
          <Route path="/survey/:id/edit" element={<SurveyBuilderPage />} />
          <Route path="/survey/:id/report" element={<ComingSoonPage />} />
          <Route path="/meeting/create" element={<MeetingFormPage />} />
          <Route path="/meeting/:id" element={<MeetingDetailPage />} />
          <Route path="/meeting/:id/agenda" element={<MeetingAgendaPage />} />
          <Route path="/meeting/:id/expense" element={<MeetingExpensePage />} />
          <Route path="/meeting/:id/edit" element={<MeetingFormPage />} />
          <Route path="/tor/high-level" element={<TorDiagramPage kind="high-level" />} />
          <Route path="/tor/sitemap" element={<TorDiagramPage kind="sitemap" />} />
          <Route path="/tor/system-map" element={<TorDiagramPage kind="system-map" />} />
          <Route path="/tor/compliance" element={<TorPage />} />
          <Route path="/profile" element={<ProfilePage />} />
        </Route>
        {/* Respondent views are full-page (no sidebar), per Figma OSS-Survey/Answer/* */}
        <Route
          path="/survey/:id/preview"
          element={
            <RequireAuth>
              <SurveyAnswerPage preview />
            </RequireAuth>
          }
        />
        {/* Answer/FirstPage for a not-yet-published survey (opened from the builder's section link) */}
        <Route
          path="/survey/:id/answer"
          element={
            <RequireAuth>
              <SurveyAnswerPage preview previewHeader={false} />
            </RequireAuth>
          }
        />
        <Route path="/s/:slug" element={<SurveyAnswerPage />} />
        <Route path="*" element={<Navigate to="/dashboard" replace />} />
      </Routes>
    </BrowserRouter>
  )
}
