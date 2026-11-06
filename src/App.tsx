import type { ReactNode } from 'react'
import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom'
import { allNavItems } from './data/navigation'
import AppLayout from './layouts/AppLayout'
import { currentUser } from './lib/auth'
import CommunityMapPage from './pages/CommunityMapPage'
import HouseholdPage from './pages/HouseholdPage'
import ProblemReportPage from './pages/ProblemReportPage'
import StaffAreaPage from './pages/StaffAreaPage'
import SurveyAreaPage from './pages/SurveyAreaPage'
import ComingSoonPage from './pages/ComingSoonPage'
import DashboardPage from './pages/DashboardPage'
import LeaderCertFormPage from './pages/LeaderCertFormPage'
import LeaderCertPage from './pages/LeaderCertPage'
import LeaderCoursePublicPage from './pages/LeaderCoursePublicPage'
import LeaderHistoryPage from './pages/LeaderHistoryPage'
import LeaderPage from './pages/LeaderPage'
import LeaderPlanPage from './pages/LeaderPlanPage'
import LeaderRecordPage from './pages/LeaderRecordPage'
import LoginPage from './pages/LoginPage'
import MeetingAgendaPage from './pages/MeetingAgendaPage'
import MeetingDetailPage from './pages/MeetingDetailPage'
import MeetingExpensePage from './pages/MeetingExpensePage'
import MeetingFormPage from './pages/MeetingFormPage'
import MeetingPage from './pages/MeetingPage'
import DeployPrintPage from './pages/DeployPrintPage'
import DisbursementFormPage from './pages/DisbursementFormPage'
import DisbursementListPage from './pages/DisbursementListPage'
import ProfilePage from './pages/ProfilePage'
import ProjectClosePage from './pages/ProjectClosePage'
import ProjectDetailPage from './pages/ProjectDetailPage'
import ProjectFormPage from './pages/ProjectFormPage'
import ProjectProposePage from './pages/ProjectProposePage'
import ProjectReportPage from './pages/ProjectReportPage'
import ProjectsPage from './pages/ProjectsPage'
import AllMenuPage from './pages/AllMenuPage'
import ProjectHomePage from './pages/ProjectHomePage'
import ProjectRecordsPage from './pages/ProjectRecordsPage'
import ProjectPerfReportPage from './pages/ProjectPerfReportPage'
import ProjectProposalFormPage from './pages/ProjectProposalFormPage'
import ProjectReviewPage from './pages/ProjectReviewPage'
import ProjectSummaryPage from './pages/ProjectSummaryPage'
import FinanceHomePage from './pages/FinanceHomePage'
import FinanceLoanPage from './pages/FinanceLoanPage'
import FinanceApprovePage from './pages/FinanceApprovePage'
import FinanceVerifyPage from './pages/FinanceVerifyPage'
import FinanceClearPage from './pages/FinanceClearPage'
import FundingSearchPage from './pages/FundingSearchPage'
import FundingAddPage from './pages/FundingAddPage'
import FundingSummaryPage from './pages/FundingSummaryPage'
import FundingListPage from './pages/FundingListPage'
import FundingReportPage from './pages/FundingReportPage'
import HrHomePage from './pages/HrHomePage'
import HrCertificatePage from './pages/HrCertificatePage'
import HrOvertimePage from './pages/HrOvertimePage'
import HrWelfarePage from './pages/HrWelfarePage'
import HrLeavePage from './pages/HrLeavePage'
import HrSignPage from './pages/HrSignPage'
import HrEvaluationsPage from './pages/HrEvaluationsPage'
import HrEvaluationNewPage from './pages/HrEvaluationNewPage'
import HrEvaluationDesignPage from './pages/HrEvaluationDesignPage'
import HrPayrollPage from './pages/HrPayrollPage'
import HrPayrollSummaryPage from './pages/HrPayrollSummaryPage'
import HrEmployeeNewPage from './pages/HrEmployeeNewPage'
import HrTrainingNewPage from './pages/HrTrainingNewPage'
import HrCareerPage from './pages/HrCareerPage'
import HrCareerNewPage from './pages/HrCareerNewPage'
import AssetHomePage from './pages/AssetHomePage'
import BookingHomePage from './pages/BookingHomePage'
import AgreementHomePage from './pages/AgreementHomePage'
import NotifyHomePage from './pages/NotifyHomePage'
import NotifyMinePage from './pages/NotifyMinePage'
import NotifySettingsPage from './pages/NotifySettingsPage'
import AgreementTypePage from './pages/AgreementTypePage'
import AgreementPartiesPage from './pages/AgreementPartiesPage'
import AgreementRegistryPage from './pages/AgreementRegistryPage'
import AgreementRegistryNewPage from './pages/AgreementRegistryNewPage'
import AgreementReviewPage from './pages/AgreementReviewPage'
import AgreementReviewDetailPage from './pages/AgreementReviewDetailPage'
import AgreementCheckPage from './pages/AgreementCheckPage'
import AgreementSignPage from './pages/AgreementSignPage'
import BookingFormPage from './pages/BookingFormPage'
import BookingApprovePage from './pages/BookingApprovePage'
import AssetImportPage from './pages/AssetImportPage'
import AssetProcurementPage from './pages/AssetProcurementPage'
import AssetRepairPage from './pages/AssetRepairPage'
import AssetRepairNewPage from './pages/AssetRepairNewPage'
import DocLibraryPage from './pages/DocLibraryPage'
import DocUploadPage from './pages/DocUploadPage'
import DocRecordPage from './pages/DocRecordPage'
import CodiAppHomePage from './pages/CodiAppHomePage'
import AppNewsPage from './pages/AppNewsPage'
import AppContactPage from './pages/AppContactPage'
import NewsManagePage from './pages/NewsManagePage'
import NewsEditPage from './pages/NewsEditPage'
import SarabanDetailPage from './pages/SarabanDetailPage'
import StrategicDefinePage from './pages/StrategicDefinePage'
import StrategicHomePage from './pages/StrategicHomePage'
import StrategicPlanPage from './pages/StrategicPlanPage'
import StrategicReviewPage from './pages/StrategicReviewPage'
import StrategicRiskReportPage from './pages/StrategicRiskReportPage'
import StrategicRiskSetupPage from './pages/StrategicRiskSetupPage'
import SarabanDocsPage from './pages/SarabanDocsPage'
import SarabanHomePage from './pages/SarabanHomePage'
import SarabanInternalPage from './pages/SarabanInternalPage'
import SarabanReceivePage from './pages/SarabanReceivePage'
import AmsOverviewPage from './pages/AmsOverviewPage'
import { AmsResultPage, AmsScanPage } from './pages/AmsAppPage'
import CouncilFormPage from './pages/CouncilFormPage'
import DebtorHistoryPage from './pages/DebtorHistoryPage'
import LibraryPage, { KnowledgePage } from './pages/LibraryPage'
import LoanDisbursementPage from './pages/LoanDisbursementPage'
import NewsPage from './pages/NewsPage'
import NotificationsPage from './pages/NotificationsPage'
import OrgFormPage from './pages/OrgFormPage'
import PersonFormPage from './pages/PersonFormPage'
import ProjectStatusPage from './pages/ProjectStatusPage'
import SurveyAnswerPage from './pages/SurveyAnswerPage'
import SurveyBuilderPage from './pages/SurveyBuilderPage'
import SurveyPage from './pages/SurveyPage'
import TorDeployPage from './pages/TorDeployPage'
import TorDiagramPage from './pages/TorDiagramPage'
import TorPage from './pages/TorPage'

// Guards are components so the session is re-checked on every navigation
function RequireAuth({ children }: { children: ReactNode }) {
  return currentUser() ? children : <Navigate to="/login" replace />
}

function GuestOnly({ children }: { children: ReactNode }) {
  return currentUser() ? <Navigate to="/app" replace /> : children
}

const builtPages: Record<string, ReactNode> = {
  '/dashboard': <DashboardPage />,
  '/survey': <SurveyPage />,
  '/meeting': <MeetingPage />,
  '/leader': <LeaderPage />,
  '/community': <Navigate to="/community/map" replace />,
  '/projects': <ProjectsPage />,
  '/disbursement': <DisbursementListPage />,
  '/menu': <AllMenuPage />,
  '/notifications': <NotificationsPage />,
  '/project-status': <ProjectStatusPage />,
  '/news': <NewsPage />,
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
          <Route path="/project" element={<ProjectHomePage />} />
          <Route path="/project/records" element={<ProjectRecordsPage />} />
          <Route path="/project/report" element={<ProjectPerfReportPage />} />
          <Route path="/project/form" element={<ProjectProposalFormPage />} />
          <Route path="/project/review" element={<ProjectReviewPage />} />
          <Route path="/project/summary" element={<ProjectSummaryPage />} />
          <Route path="/finance" element={<FinanceHomePage />} />
          <Route path="/finance/loan" element={<FinanceLoanPage />} />
          <Route path="/finance/approve" element={<FinanceApprovePage />} />
          <Route path="/finance/verify" element={<FinanceVerifyPage />} />
          <Route path="/finance/clear" element={<FinanceClearPage />} />
          <Route path="/funding" element={<FundingSearchPage />} />
          <Route path="/funding/add" element={<FundingAddPage />} />
          <Route path="/funding/summary" element={<FundingSummaryPage />} />
          <Route path="/funding/list" element={<FundingListPage />} />
          <Route path="/funding/report" element={<FundingReportPage />} />
          <Route path="/hr" element={<HrHomePage />} />
          <Route path="/hr/certificate" element={<HrCertificatePage />} />
          <Route path="/hr/overtime" element={<HrOvertimePage />} />
          <Route path="/hr/welfare" element={<HrWelfarePage />} />
          <Route path="/hr/leave" element={<HrLeavePage />} />
          <Route path="/hr/certificate/sign" element={<HrSignPage />} />
          <Route path="/hr/evaluations" element={<HrEvaluationsPage />} />
          <Route path="/hr/evaluations/new" element={<HrEvaluationNewPage />} />
          <Route path="/hr/evaluations/design" element={<HrEvaluationDesignPage />} />
          <Route path="/hr/payroll" element={<HrPayrollPage />} />
          <Route path="/hr/payroll/summary" element={<HrPayrollSummaryPage />} />
          <Route path="/hr/employees/new" element={<HrEmployeeNewPage />} />
          <Route path="/hr/training/new" element={<HrTrainingNewPage />} />
          <Route path="/hr/career" element={<HrCareerPage />} />
          <Route path="/hr/career/new" element={<HrCareerNewPage />} />
          <Route path="/asset" element={<AssetHomePage />} />
          <Route path="/booking" element={<BookingHomePage />} />
          <Route path="/agreement" element={<AgreementHomePage />} />
          <Route path="/notify" element={<NotifyHomePage />} />
          <Route path="/notify/mine" element={<NotifyMinePage />} />
          <Route path="/notify/settings" element={<NotifySettingsPage />} />
          <Route path="/agreement/new" element={<AgreementTypePage />} />
          <Route path="/agreement/new/parties" element={<AgreementPartiesPage />} />
          <Route path="/agreement/registry" element={<AgreementRegistryPage />} />
          <Route path="/agreement/registry/new" element={<AgreementRegistryNewPage />} />
          <Route path="/agreement/review" element={<AgreementReviewPage />} />
          <Route path="/agreement/review/detail" element={<AgreementReviewDetailPage />} />
          <Route path="/agreement/review/check" element={<AgreementCheckPage />} />
          <Route path="/agreement/sign" element={<AgreementSignPage />} />
          <Route path="/booking/room" element={<BookingFormPage />} />
          <Route path="/booking/zoom" element={<BookingFormPage />} />
          <Route path="/booking/vehicle" element={<BookingFormPage />} />
          <Route path="/booking/borrow" element={<BookingFormPage />} />
          <Route path="/booking/approve" element={<BookingApprovePage />} />
          <Route path="/asset/import" element={<AssetImportPage />} />
          <Route path="/asset/procurement" element={<AssetProcurementPage />} />
          <Route path="/asset/repair" element={<AssetRepairPage />} />
          <Route path="/asset/repair/new" element={<AssetRepairNewPage />} />
          <Route path="/edoc" element={<DocLibraryPage />} />
          <Route path="/edoc/upload" element={<DocUploadPage />} />
          <Route path="/edoc/record" element={<DocRecordPage />} />
          <Route path="/strategic" element={<StrategicHomePage />} />
          <Route path="/strategic/strategy" element={<StrategicDefinePage />} />
          <Route path="/strategic/plan" element={<StrategicPlanPage />} />
          <Route path="/strategic/review" element={<StrategicReviewPage />} />
          <Route path="/strategic/risk/setup" element={<StrategicRiskSetupPage />} />
          <Route path="/strategic/risk/report" element={<StrategicRiskReportPage />} />
          <Route path="/saraban" element={<SarabanHomePage />} />
          <Route path="/saraban/receive/new" element={<SarabanReceivePage />} />
          <Route path="/saraban/internal/new" element={<SarabanInternalPage />} />
          <Route path="/saraban/docs" element={<SarabanDocsPage />} />
          <Route path="/saraban/docs/:id" element={<SarabanDetailPage />} />
          <Route path="/community/person" element={<PersonFormPage />} />
          <Route path="/community/org" element={<OrgFormPage />} />
          <Route path="/community/council" element={<CouncilFormPage />} />
          <Route path="/loan" element={<Navigate to="/loan/disbursement" replace />} />
          <Route path="/loan/disbursement" element={<LoanDisbursementPage />} />
          <Route path="/loan/debtors" element={<DebtorHistoryPage />} />
          <Route path="/ams" element={<AmsOverviewPage />} />
          <Route path="/library" element={<LibraryPage />} />
          <Route path="/library/knowledge" element={<KnowledgePage />} />
          <Route path="/community/map" element={<CommunityMapPage />} />
          <Route path="/community/survey-area" element={<SurveyAreaPage />} />
          <Route path="/community/problem/new" element={<ProblemReportPage />} />
          <Route path="/community/household" element={<HouseholdPage />} />
          <Route path="/community/area/new" element={<StaffAreaPage />} />
          <Route path="/community/area/:id" element={<StaffAreaPage />} />
          <Route path="/projects/propose" element={<ProjectProposePage />} />
          <Route path="/projects/:id" element={<ProjectDetailPage />} />
          <Route path="/projects/:id/form" element={<ProjectFormPage />} />
          <Route path="/projects/:id/report" element={<ProjectReportPage />} />
          <Route path="/projects/:id/close" element={<ProjectClosePage />} />
          <Route path="/disbursement/:id" element={<DisbursementFormPage />} />
          <Route path="/leader/history" element={<LeaderHistoryPage />} />
          <Route path="/leader/plan/create" element={<LeaderPlanPage />} />
          <Route path="/leader/plan/:id/edit" element={<LeaderPlanPage />} />
          <Route path="/leader/record" element={<LeaderRecordPage />} />
          <Route path="/leader/record/:id" element={<LeaderRecordPage />} />
          <Route path="/leader/certificate" element={<LeaderCertPage />} />
          <Route path="/leader/certificate/create" element={<LeaderCertFormPage />} />
          <Route path="/leader/certificate/:id/edit" element={<LeaderCertFormPage />} />
          <Route path="/tor/high-level" element={<TorDiagramPage kind="high-level" />} />
          <Route path="/tor/sitemap" element={<TorDiagramPage kind="sitemap" />} />
          <Route path="/tor/system-map" element={<TorDiagramPage kind="system-map" />} />
          <Route path="/tor/compliance" element={<TorPage />} />
          <Route path="/tor/deploy" element={<TorDeployPage />} />
          <Route path="/profile" element={<ProfilePage />} />
        </Route>
        {/* Plain A4 document the deploy PDF is printed from (no app shell) */}
        <Route path="/app" element={<RequireAuth><CodiAppHomePage /></RequireAuth>} />
        <Route path="/app/news" element={<RequireAuth><AppNewsPage /></RequireAuth>} />
        <Route path="/app/contact" element={<RequireAuth><AppContactPage /></RequireAuth>} />
        <Route path="/app/news/manage" element={<RequireAuth><NewsManagePage /></RequireAuth>} />
        <Route path="/app/news/edit" element={<RequireAuth><NewsEditPage /></RequireAuth>} />
        <Route path="/ams/app/:room" element={<RequireAuth><AmsScanPage /></RequireAuth>} />
        <Route path="/ams/app/:room/result" element={<RequireAuth><AmsResultPage /></RequireAuth>} />
        <Route path="/print/deploy" element={<DeployPrintPage />} />
        {/* QR landing page for training attendees (no sign-in) */}
        <Route path="/c/:id" element={<LeaderCoursePublicPage />} />
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
