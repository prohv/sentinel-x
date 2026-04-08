import { Topbar } from '@/components/dashboard/Topbar';
import { DashboardVitals } from '@/components/dashboard/DashboardVitals';
import { RulesDistribution } from '@/components/dashboard/RulesDistribution';
import { FindingsStream } from '@/components/dashboard/FindingsStream';
import { SidebarLog } from '@/components/dashboard/SidebarLog';

export default function Dashboard() {
  return (
    <div className="h-screen bg-zinc-100 font-manrope flex justify-center overflow-hidden">
      <main className="w-full max-w-[1500px] flex flex-col lg:flex-row h-full">
        {/* Left Column */}
        <div className="flex-1 w-full lg:w-[65%] flex flex-col gap-8 min-w-0 px-4 md:px-8 py-8 overflow-hidden">
          {/* Top Navbar ("Command Center") */}
          <Topbar />

          {/* Left Top Section ("The Vitals") */}
          <DashboardVitals />

          {/* Left Bottom Section ("Deep Scan") */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 flex-1 min-h-0">
            <div className="lg:col-span-5 h-full min-h-0">
              <RulesDistribution />
            </div>
            <div className="lg:col-span-7 h-full min-h-0">
              <FindingsStream />
            </div>
          </div>
        </div>

        {/* Right Panel */}
        <aside className="w-full lg:w-80 xl:w-[400px] shrink-0 h-full bg-white border-l border-zinc-200 overflow-y-auto">
          <SidebarLog />
        </aside>
      </main>
    </div>
  );
}
