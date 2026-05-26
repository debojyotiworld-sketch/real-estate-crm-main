import { StatCard } from "@/components/dashboard/StatCard";
import { LeadStatusChart } from "@/components/dashboard/LeadStatusChart";
import { RevenueChart } from "@/components/dashboard/RevenueChart";
import { RecentLeads } from "@/components/dashboard/RecentLeads";
import { UpcomingTasks } from "@/components/dashboard/UpcomingTasks";
import { AttendanceWidget } from "@/components/dashboard/AttendanceWidget";
import { SiteVisitsToday } from "@/components/dashboard/SiteVisitsToday";
import { Users, Building2, Calendar, IndianRupee } from "lucide-react";
import { MainLayout } from "@/components/layout/MainLayout";
import { useAuth } from "@/contexts/AuthContext";

const Index = () => {
  const { user } = useAuth();

  return (
    <MainLayout title={"Dashboard"} subtitle={"Overview of key metrics and activities"}>
      <div className="space-y-6">
        <section className="surface-panel overflow-hidden p-5 md:p-6">
          <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
            <div>
              <p className="text-sm font-semibold uppercase tracking-wide text-accent">
                Sales Command Center
              </p>
              <h2 className="mt-2 text-2xl font-bold tracking-tight md:text-3xl">
                Track leads, visits, and revenue in one place.
              </h2>
              <p className="mt-2 max-w-2xl text-sm text-muted-foreground md:text-base">
                A quick view of the numbers and activities that need attention today.
              </p>
            </div>
            <div className="grid grid-cols-3 gap-3 text-center">
              <div className="rounded-lg bg-muted/70 px-4 py-3">
                <p className="text-xl font-bold">42</p>
                <p className="text-xs text-muted-foreground">Open deals</p>
              </div>
              <div className="rounded-lg bg-muted/70 px-4 py-3">
                <p className="text-xl font-bold">18</p>
                <p className="text-xs text-muted-foreground">Visits</p>
              </div>
              <div className="rounded-lg bg-muted/70 px-4 py-3">
                <p className="text-xl font-bold">91%</p>
                <p className="text-xs text-muted-foreground">Target</p>
              </div>
            </div>
          </div>
        </section>

        {/* Stats Row */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <StatCard
            title="Total Leads"
            value="1,284"
            change={{ value: 12, type: "increase" }}
            icon={Users}
            variant="accent"
          />
          <StatCard
            title="Active Properties"
            value="156"
            change={{ value: 5, type: "increase" }}
            icon={Building2}
          />
          <StatCard
            title="Site Visits Today"
            value="18"
            change={{ value: 8, type: "decrease" }}
            icon={Calendar}
          />
          <StatCard
            title="This Month Revenue"
            value="INR 2.4 Cr"
            change={{ value: 15, type: "increase" }}
            icon={IndianRupee}
            variant="primary"
          />
        </div>

        {/* Charts Row */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2">
            <RevenueChart />
          </div>
          <LeadStatusChart />
        </div>

        {/* Main Content */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 space-y-6">
            <RecentLeads />
          </div>
          <div className="space-y-6">

            {user?.role !== "admin" && <AttendanceWidget />}
            <UpcomingTasks />
            <SiteVisitsToday />
          </div>
        </div>
      </div>
    </MainLayout>
  );
};

export default Index;
