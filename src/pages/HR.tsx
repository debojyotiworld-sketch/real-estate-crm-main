import { CalendarCheck2, FileText, UserRoundCheck, Users } from "lucide-react";

import EmployeesPage from "@/pages/hr/EmployeesPage";
import { MainLayout } from "@/components/layout/MainLayout";
import { Card, CardContent } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

const hrStats = [
  {
    label: "Employee Directory",
    value: "Live",
    icon: Users,
    className: "bg-primary/10 text-primary",
  },
  {
    label: "Onboarding",
    value: "Offer PDF",
    icon: UserRoundCheck,
    className: "bg-success/10 text-success",
  },
  {
    label: "Attendance",
    value: "Role-aware",
    icon: CalendarCheck2,
    className: "bg-info/10 text-info",
  },
  {
    label: "Documents",
    value: "KYC Ready",
    icon: FileText,
    className: "bg-warning/10 text-warning",
  },
];

const HR = () => {
  return (
    <MainLayout title="HR" subtitle="Manage employees, onboarding, payroll setup, and HR operations">
      <div className="space-y-6">
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-4">
          {hrStats.map((stat) => {
            const Icon = stat.icon;

            return (
              <Card key={stat.label}>
                <CardContent className="p-6">
                  <div className="flex items-center gap-4">
                    <div className={`rounded-xl p-3 ${stat.className}`}>
                      <Icon className="h-6 w-6" />
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">{stat.label}</p>
                      <p className="text-xl font-bold">{stat.value}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>

        <Tabs defaultValue="employees" className="space-y-6">
          <TabsList>
            <TabsTrigger value="employees">Employees</TabsTrigger>
            <TabsTrigger value="payslips">Payslips</TabsTrigger>
          </TabsList>

          <TabsContent value="employees" className="mt-6">
            <EmployeesPage />
          </TabsContent>

          <TabsContent value="payslips" className="mt-6">
            <Card>
              <CardContent className="p-8 text-sm text-muted-foreground">
                Payslip generation will be connected after salary cycles and payroll approvals are finalized.
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>

      </div>
    </MainLayout>
  );
};

export default HR;
