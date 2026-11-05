import CouncilCharts from '../components/dashboard/CouncilCharts'
import InboxLists from '../components/dashboard/InboxLists'
import LatestAlerts from '../components/dashboard/LatestAlerts'
import OverviewStats from '../components/dashboard/OverviewStats'
import ProjectBudgetChart from '../components/dashboard/ProjectBudgetChart'

export default function DashboardPage() {
  return (
    <div className="flex flex-col gap-[12px] px-[24px] pb-[81px] max-sm:px-[12px] max-sm:pb-[25px]">
      <OverviewStats />
      <LatestAlerts />
      <ProjectBudgetChart />
      <CouncilCharts />
      <InboxLists />
    </div>
  )
}
