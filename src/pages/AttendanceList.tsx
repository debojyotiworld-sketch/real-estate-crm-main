import { MainLayout } from "@/components/layout/MainLayout";
import { Card, CardContent } from "@/components/ui/card";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs";

import LeaveRequest from "@/components/attendance/LeaveRequest";
import Attendance from "@/components/attendance/Attendance";
import Resignation from "@/components/attendance/Resignation";

import {
  Clock,
  Users,
  Calendar,
  XCircle,
} from "lucide-react";

import {
  useEffect,
  useMemo,
  useState,
} from "react";

import { supabase } from "@/integrations/supabase/client";

const AttendanceList = () => {
  const [profile, setProfile] =
    useState<Record<string, any> | null>(
      null
    );

  const [employee, setEmployee] =
    useState<Record<string, any> | null>(
      null
    );

  const [leaveRequests, setLeaveRequests] =
    useState<Record<string, any>[]>(
      []
    );

  const [loading, setLoading] =
    useState(true);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      setLoading(true);

      // Logged in user
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) return;

      // =========================
      // PROFILE
      // =========================
      const {
        data: profileData,
        error: profileError,
      } = await supabase
        .from("profiles")
        .select(`
    *,
    roles (
      name
    )
  `)
        .eq("user_id", user.id)
        .single();

      if (profileError) {
        console.error(profileError);
        return;
      }

      setProfile(profileData);

      // =========================
      // CHECK ADMIN
      // =========================
      const isAdmin =
        profileData?.roles?.name
          ?.toLowerCase()
          ?.trim() === "admin";

      // =========================
      // EMPLOYEE
      // =========================
      const {
        data: employeeData,
        error: employeeError,
      } = await supabase
        .from("employees")
        .select(`
    *,
    roles (
      name
    )
  `)
        .eq("user_id", user.id)
        .maybeSingle();

      if (employeeError) {
        console.error(employeeError);
        return;
      }

      setEmployee(employeeData || null);

      // =========================
      // LEAVE QUERY
      // =========================
      let query: any = supabase
        .from("leave_requests")
        .select("*")
        .order("created_at", {
          ascending: false,
        });

      // Employee -> only own leave
      if (!isAdmin) {
        query = query.eq(
          "employee_id",
          employeeData.id
        );
      }

      const {
        data: leaveData,
        error: leaveError,
      } = await query;

      if (leaveError) {
        console.error(leaveError);
        return;
      }

      const employeeIds = [
        ...new Set(
          (leaveData || []).map(
            (x: any) => x.employee_id
          )
        ),
      ];

      const { data: employeeList } =
        await supabase
          .from("employees")
          .select("id, name, department")
          .in("id", employeeIds);

      const mappedLeaves = (
        leaveData || []
      ).map((leave: any) => ({
        ...leave,
        employees: employeeList?.find(
          (emp) =>
            emp.id === leave.employee_id
        ),
      }));

      setLeaveRequests(mappedLeaves);
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  // =========================
  // LEAVE STATS
  // =========================

  const approvedLeaves = useMemo(() => {
    return leaveRequests.filter(
      (x) =>
        x.status?.toLowerCase() ===
        "approved"
    );
  }, [leaveRequests]);

  const pendingLeaves = useMemo(() => {
    return leaveRequests.filter(
      (x) =>
        x.status?.toLowerCase() ===
        "pending"
    );
  }, [leaveRequests]);

  const rejectedLeaves = useMemo(() => {
    return leaveRequests.filter(
      (x) =>
        x.status?.toLowerCase() ===
        "rejected"
    );
  }, [leaveRequests]);

  // =========================
  // USED LEAVES
  // =========================

  const usedCasual = approvedLeaves
    .filter((x) => x.leave_type === "Casual Leave")
    .reduce((sum, x) => sum + (x.days || 0), 0);

  const usedSick = approvedLeaves
    .filter((x) => x.leave_type === "Sick Leave")
    .reduce((sum, x) => sum + (x.days || 0), 0);

  // =========================
  // REMAINING
  // =========================

  const remainingCasual =
    (employee?.total_casual_leave || 0) - usedCasual;

  const remainingSick =
    (employee?.total_sick_leave || 0) - usedSick;


  // =========================
  // CHECK ADMIN
  // =========================
  const isAdminUser =
    profile?.roles?.name
      ?.toLowerCase()
      ?.trim() === "admin";

  return (
    <MainLayout
      title="Attendance"
      subtitle="Manage attendance and leave requests"
    >
      <div className="space-y-6">
        {/* ========================= */}
        {/* TOP STATS */}
        {/* ========================= */}

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {/* Present */}
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center gap-4">
                <div className="p-3 bg-success/10 rounded-xl">
                  <Users className="w-6 h-6 text-success" />
                </div>

                <div>
                  <p className="text-sm text-muted-foreground">
                    Present Today
                  </p>

                  <p className="text-2xl font-bold">
                    28
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Late */}
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center gap-4">
                <div className="p-3 bg-warning/10 rounded-xl">
                  <Clock className="w-6 h-6 text-warning" />
                </div>

                <div>
                  <p className="text-sm text-muted-foreground">
                    Late Arrivals
                  </p>

                  <p className="text-2xl font-bold">
                    3
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Approved */}
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center gap-4">
                <div className="p-3 bg-info/10 rounded-xl">
                  <Calendar className="w-6 h-6 text-info" />
                </div>

                <div>
                  <p className="text-sm text-muted-foreground">
                    On Leave
                  </p>

                  <p className="text-2xl font-bold">
                    {
                      approvedLeaves.length
                    }
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Rejected */}
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center gap-4">
                <div className="p-3 bg-destructive/10 rounded-xl">
                  <XCircle className="w-6 h-6 text-destructive" />
                </div>

                <div>
                  <p className="text-sm text-muted-foreground">
                    Rejected
                  </p>

                  <p className="text-2xl font-bold">
                    {
                      rejectedLeaves.length
                    }
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* ========================= */}
        {/* EMPLOYEE LEAVE CARDS */}
        {/* ========================= */}

        {!isAdminUser && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
            {/* Casual Leave */}
            <Card className="border-0 shadow-md rounded-2xl overflow-hidden">
              <CardContent className="p-6 bg-gradient-to-br from-white to-blue-50">
                <div className="flex items-center justify-between mb-6">
                  <div>
                    <p className="text-xl font-semibold text-gray-800">
                      Casual Leave
                    </p>

                    <p className="text-sm text-gray-500 mt-1">
                      Employee leave summary
                    </p>
                  </div>

                  <div className="h-14 w-14 rounded-2xl bg-blue-100 flex items-center justify-center shadow-sm">
                    <Calendar className="w-7 h-7 text-blue-600" />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4 mt-6">
                  {/* Total */}
                  <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-blue-500 to-blue-600 p-5 text-white shadow-lg">
                    <div className="absolute -top-6 -right-6 h-24 w-24 rounded-full bg-white/10"></div>

                    <p className="text-sm font-medium text-blue-100">
                      Total Leave
                    </p>

                    <div className="mt-4 flex items-end justify-between">
                      <h2 className="text-5xl font-bold tracking-tight">
                        {
                          employee?.total_casual_leave || 0
                        }
                      </h2>

                      <div className="rounded-lg bg-white/15 px-3 py-1 text-xs font-medium backdrop-blur-sm">
                        Annual
                      </div>
                    </div>
                  </div>

                  {/* Remaining */}
                  <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-red-500 to-rose-500 p-5 text-white shadow-lg">
                    <div className="absolute -top-6 -right-6 h-24 w-24 rounded-full bg-white/10"></div>

                    <p className="text-sm font-medium text-red-100">
                      Remaining
                    </p>

                    <div className="mt-4 flex items-end justify-between">
                      <h2 className="text-5xl font-bold tracking-tight">
                        {
                          remainingCasual
                        }
                      </h2>

                      <div className="rounded-lg bg-white/15 px-3 py-1 text-xs font-medium backdrop-blur-sm">
                        Balance
                      </div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Sick Leave */}
            <Card className="border-0 shadow-md rounded-2xl overflow-hidden">
              <CardContent className="p-6 bg-gradient-to-br from-white to-red-50">
                <div className="flex items-center justify-between mb-6">
                  <div>
                    <p className="text-xl font-semibold text-gray-800">
                      Sick Leave
                    </p>

                    <p className="text-sm text-gray-500 mt-1">
                      Employee leave summary
                    </p>
                  </div>

                  <div className="h-14 w-14 rounded-2xl bg-red-100 flex items-center justify-center shadow-sm">
                    <Calendar className="w-7 h-7 text-red-600" />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4 mt-6">
                  {/* Total */}
                  <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-blue-500 to-blue-600 p-5 text-white shadow-lg">
                    <div className="absolute -top-6 -right-6 h-24 w-24 rounded-full bg-white/10"></div>

                    <p className="text-sm font-medium text-blue-100">
                      Total Leave
                    </p>

                    <div className="mt-4 flex items-end justify-between">
                      <h2 className="text-5xl font-bold tracking-tight">
                        {
                          employee?.total_sick_leave || 0
                        }
                      </h2>

                      <div className="rounded-lg bg-white/15 px-3 py-1 text-xs font-medium backdrop-blur-sm">
                        Annual
                      </div>
                    </div>
                  </div>

                  {/* Remaining */}
                  <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-red-500 to-rose-500 p-5 text-white shadow-lg">
                    <div className="absolute -top-6 -right-6 h-24 w-24 rounded-full bg-white/10"></div>

                    <p className="text-sm font-medium text-red-100">
                      Remaining
                    </p>

                    <div className="mt-4 flex items-end justify-between">
                      <h2 className="text-5xl font-bold tracking-tight">
                        {
                          remainingSick
                        }
                      </h2>

                      <div className="rounded-lg bg-white/15 px-3 py-1 text-xs font-medium backdrop-blur-sm">
                        Balance
                      </div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        {/* ========================= */}
        {/* TABS */}
        {/* ========================= */}

        <Tabs
          defaultValue="attendance"
          className="space-y-6"
        >
          <TabsList>
            <TabsTrigger value="attendance">
              Today's Attendance
            </TabsTrigger>

            <TabsTrigger value="leaves">
              Leave Requests
            </TabsTrigger>

            <TabsTrigger value="resignations">
              Resignations
            </TabsTrigger>
          </TabsList>

          {/* Attendance */}
          <TabsContent
            value="attendance"
            className="mt-6"
          >
            <Attendance />
          </TabsContent>

          {/* Leave */}
          <TabsContent
            value="leaves"
            className="mt-6 space-y-4"
          >
            <LeaveRequest
              leaveRequests={
                leaveRequests
              }
              pendingLeaves={
                pendingLeaves
              }
              approvedLeaves={
                approvedLeaves
              }
              rejectedLeaves={
                rejectedLeaves
              }
            />
          </TabsContent>

          {/* Resignation */}
          <TabsContent
            value="resignations"
            className="mt-6"
          >
            <Resignation />
          </TabsContent>
        </Tabs>
      </div>
    </MainLayout>
  );
};

export default AttendanceList;
