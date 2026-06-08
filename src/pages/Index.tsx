import { useEffect, useState } from "react";
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
import { supabase } from "@/integrations/supabase/client";

// Currency format helper (Lakhs and Crores)
const formatCurrency = (amount: number) => {
  if (amount >= 10000000) return `INR ${(amount / 10000000).toFixed(2)} Cr`;
  if (amount >= 100000) return `INR ${(amount / 100000).toFixed(2)} L`;
  return `INR ${amount.toLocaleString('en-IN')}`;
};

const Index = () => {
  const { user } = useAuth();
  
  // Dashboard Data State
  const [stats, setStats] = useState({
    totalLeads: 0,
    openDeals: 0,
    activeProperties: 0,
    siteVisitsToday: 0,
    revenueThisMonth: 0,
    targetAchievement: 0 // Default target percentage
  });

  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        const today = new Date().toISOString().split('T')[0]; // YYYY-MM-DD
        const date = new Date();
        const firstDayOfMonth = new Date(date.getFullYear(), date.getMonth(), 1).toISOString();

        // 1. Fetch Total Leads
        const { count: totalLeads } = await supabase
          .from('leads')
          .select('*', { count: 'exact', head: true });

        // 2. Fetch Open Deals (Assuming status is not Won or Lost)
        const { count: openDeals } = await supabase
          .from('leads')
          .select('*', { count: 'exact', head: true })
          .not('status', 'in', '("Won","Lost","Closed")'); 

        // 3. Fetch Active Properties (Assuming status is Available or Active)
        const { count: activeProperties } = await supabase
          .from('properties')
          .select('*', { count: 'exact', head: true })
          .in('status', ['Available', 'Active']);

        // 4. Fetch Site Visits Today
        const { count: siteVisitsToday } = await supabase
          .from('site_visits')
          .select('*', { count: 'exact', head: true })
          .eq('visit_date', today);

        // 5. Fetch This Month's Revenue (Replace 'bookings' and 'amount' with your actual table/columns)
        const { data: bookingsThisMonth } = await supabase
          .from('bookings')
          .select('amount') // Total booking price ba booking token amount
          .gte('created_at', firstDayOfMonth);

        const revenue = bookingsThisMonth?.reduce((sum, b) => sum + (Number(b.amount) || 0), 0) || 0;
        
        // Dummy target calculation for the UI (can be replaced with real target logic)
        const monthlyTarget = 50000000; // Let's assume 5 Cr is the target
        const targetPercent = revenue > 0 ? Math.min(Math.round((revenue / monthlyTarget) * 100), 100) : 0;

        setStats({
          totalLeads: totalLeads || 0,
          openDeals: openDeals || 0,
          activeProperties: activeProperties || 0,
          siteVisitsToday: siteVisitsToday || 0,
          revenueThisMonth: revenue,
          targetAchievement: targetPercent
        });

      } catch (error) {
        console.error("Error fetching dashboard stats:", error);
      }
    };

    fetchDashboardData();
  }, []);

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
                <p className="text-xl font-bold">{stats.openDeals}</p>
                <p className="text-xs text-muted-foreground">Open deals</p>
              </div>
              <div className="rounded-lg bg-muted/70 px-4 py-3">
                <p className="text-xl font-bold">{stats.siteVisitsToday}</p>
                <p className="text-xs text-muted-foreground">Visits</p>
              </div>
              <div className="rounded-lg bg-muted/70 px-4 py-3">
                <p className="text-xl font-bold">{stats.targetAchievement}%</p>
                <p className="text-xs text-muted-foreground">Target</p>
              </div>
            </div>
          </div>
        </section>

        {/* Stats Row */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <StatCard
            title="Total Leads"
            value={stats.totalLeads.toLocaleString()}
            change={{ value: 0, type: "increase" }} // Optional: Calculate change from last month if needed
            icon={Users}
            variant="accent"
          />
          <StatCard
            title="Active Properties"
            value={stats.activeProperties.toLocaleString()}
            change={{ value: 0, type: "increase" }}
            icon={Building2}
          />
          <StatCard
            title="Site Visits Today"
            value={stats.siteVisitsToday.toLocaleString()}
            change={{ value: 0, type: "decrease" }}
            icon={Calendar}
          />
          <StatCard
            title="This Month Revenue"
            value={formatCurrency(stats.revenueThisMonth)}
            change={{ value: 0, type: "increase" }}
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