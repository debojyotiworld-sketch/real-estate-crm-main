import { useCallback, useEffect, useMemo, useState } from "react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Download } from "lucide-react";
import { cn } from "@/lib/utils";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { useAuth } from "@/contexts/AuthContext";

const pad2 = (n: number) => String(n).padStart(2, "0");

const todayISODate = () => {
    const d = new Date();
    return `${d.getFullYear()}-${pad2(d.getMonth() + 1)}-${pad2(d.getDate())}`;
};

const hhmm = (t: string | null) => (t ? t.slice(0, 5) : "-");

const calcHours = (pIn: string | null, pOut: string | null) => {
    if (!pIn || !pOut) return "-";

    const [h1, m1] = pIn.split(":").map(Number);
    const [h2, m2] = pOut.split(":").map(Number);

    let diff = h2 * 60 + m2 - (h1 * 60 + m1);
    if (diff < 0) diff += 1440;

    return `${Math.floor(diff / 60)}h ${diff % 60}m`;
};

const statusStyles = {
    present: { bg: "bg-success/10", text: "text-success", label: "Present" },
    late: { bg: "bg-warning/10", text: "text-warning", label: "Late" },
    absent: { bg: "bg-destructive/10", text: "text-destructive", label: "Absent" },
    leave: { bg: "bg-info/10", text: "text-info", label: "On Leave" },
    pending: { bg: "bg-warning/10", text: "text-warning", label: "Pending" },
    approved: { bg: "bg-success/10", text: "text-success", label: "Approved" },
    rejected: { bg: "bg-destructive/10", text: "text-destructive", label: "Rejected" },
} as const;

type AttendanceStatus = keyof typeof statusStyles;

type AttendanceEmployee = {
    id: string;
    name: string | null;
    email: string | null;
    department: string | null;
    attendance_type: string | null;
    user_id: string;
};

type AttendanceLog = {
    employee_id: string;
    punch_in: string | null;
    punch_out: string | null;
    status: string | null;
};

type SiteVisitPunch = {
    employee_id: string;
    punch_in: string | null;
    punch_out: string | null;
};

type AttendanceRow = {
    id: string;
    name: string | null;
    email: string | null;
    department: string | null;
    punchIn: string;
    punchOut: string;
    hours: string;
    status: AttendanceStatus;
    location: "Field" | "Office";
};

const getStatus = (log: AttendanceLog | SiteVisitPunch | null): AttendanceStatus => {
    if (!log) return "absent";
    if ("status" in log && log.status && log.status in statusStyles) {
        return log.status as AttendanceStatus;
    }
    if (log.punch_in && log.punch_out) return "present";
    if (log.punch_in) return "pending";
    return "absent";
};

const Attendance = () => {
    const { user } = useAuth();
    const [rows, setRows] = useState<AttendanceRow[]>([]);
    const [loading, setLoading] = useState(true);
    const [date, setDate] = useState(todayISODate());
    const [searchText, setSearchText] = useState("");

    const normalizedRole = (user?.role ?? "").toLowerCase();
    const canViewEveryone = ["admin", "hr", "manager"].includes(normalizedRole);

    const load = useCallback(async () => {
        if (!user?.user_id) {
            setRows([]);
            setLoading(false);
            return;
        }

        setLoading(true);

        try {
            let employeesQuery = supabase
                .from("employees")
                .select("id, name, email, department, attendance_type, user_id");

            if (!canViewEveryone) {
                employeesQuery = employeesQuery.eq("user_id", user.user_id);
            }

            const { data: employees, error: empErr } = await employeesQuery;
            if (empErr) throw empErr;

            const employeeRows = (employees ?? []) as AttendanceEmployee[];

            if (!employeeRows.length) {
                setRows([]);
                return;
            }

            const employeeIds = employeeRows.map((employee) => employee.id);

            const { data: logs, error: logErr } = await supabase
                .from("attendance_logs")
                .select("employee_id, punch_in, punch_out, status")
                .eq("attendance_date", date)
                .in("employee_id", employeeIds);

            if (logErr) throw logErr;

            const { data: punches, error: punchErr } = await supabase
                .from("site_visit_punches")
                .select("employee_id, punch_in, punch_out")
                .eq("attendance_date", date)
                .in("employee_id", employeeIds)
                .order("punch_in", { ascending: true });

            if (punchErr) throw punchErr;

            const firstPunchMap = new Map<string, SiteVisitPunch>();
            (punches ?? []).forEach((punch) => {
                if (!firstPunchMap.has(punch.employee_id)) {
                    firstPunchMap.set(punch.employee_id, punch);
                }
            });

            const officeLogMap = new Map<string, AttendanceLog>();
            ((logs ?? []) as AttendanceLog[]).forEach((log) => {
                if (!officeLogMap.has(log.employee_id)) {
                    officeLogMap.set(log.employee_id, log);
                }
            });

            const mapped: AttendanceRow[] = employeeRows.map((employee) => {
                const isField = employee.attendance_type === "field";
                const log = isField
                    ? firstPunchMap.get(employee.id) ?? null
                    : officeLogMap.get(employee.id) ?? null;

                return {
                    id: employee.id,
                    name: employee.name,
                    email: employee.email,
                    department: employee.department,
                    punchIn: hhmm(log?.punch_in ?? null),
                    punchOut: hhmm(log?.punch_out ?? null),
                    hours: calcHours(log?.punch_in ?? null, log?.punch_out ?? null),
                    status: getStatus(log),
                    location: isField ? "Field" : "Office",
                };
            });

            setRows(mapped);
        } catch (err) {
            console.error(err);
            toast.error("Failed to load attendance");
        } finally {
            setLoading(false);
        }
    }, [canViewEveryone, date, user?.user_id]);

    useEffect(() => {
        void load();
    }, [load]);

    const filteredRows = useMemo(() => {
        const query = searchText.trim().toLowerCase();
        if (!query) return rows;

        return rows.filter((row) => {
            return (
                row.name?.toLowerCase().includes(query) ||
                row.email?.toLowerCase().includes(query) ||
                row.department?.toLowerCase().includes(query)
            );
        });
    }, [rows, searchText]);

    const handleExport = () => {
        const headers = ["Name", "Department", "Punch In", "Punch Out", "Hours", "Status"];

        const dataRows = filteredRows.map((row) => [
            row.name ?? "-",
            row.department ?? "-",
            row.punchIn,
            row.punchOut,
            row.hours,
            statusStyles[row.status].label,
        ]);

        const csv = [headers, ...dataRows]
            .map((row) => row.map((cell) => `"${cell}"`).join(","))
            .join("\n");

        const blob = new Blob([csv]);
        const url = URL.createObjectURL(blob);

        const a = document.createElement("a");
        a.href = url;
        a.download = canViewEveryone ? "attendance.csv" : "my-attendance.csv";
        a.click();
    };

    const title = `Attendance Log - ${new Date(date).toDateString()}`;

    return (
        <div className="rounded-xl border bg-card">
            <CardHeader className="flex flex-col gap-3 sm:flex-row sm:justify-between">
                <div>
                    <CardTitle>{title}</CardTitle>
                    <p className="text-sm text-muted-foreground">
                        {canViewEveryone ? "Admin / HR / Manager View" : "Your attendance record"}
                    </p>
                </div>

                <div className="flex gap-2 flex-wrap">
                    <input
                        type="date"
                        value={date}
                        onChange={(e) => setDate(e.target.value)}
                        className="h-9 border px-2"
                    />

                    <input
                        placeholder={canViewEveryone ? "Search employee..." : "Search your record..."}
                        value={searchText}
                        onChange={(e) => setSearchText(e.target.value)}
                        className="h-9 border px-2"
                    />

                    <Button onClick={handleExport}>
                        <Download className="w-4 h-4 mr-2" />
                        Export
                    </Button>
                </div>
            </CardHeader>

            <CardContent className="p-0">
                <Table>
                    <TableHeader>
                        <TableRow>
                            <TableHead>Employee</TableHead>
                            <TableHead>Department</TableHead>
                            <TableHead>Punch In</TableHead>
                            <TableHead>Punch Out</TableHead>
                            <TableHead>Hours</TableHead>
                            <TableHead>Status</TableHead>
                        </TableRow>
                    </TableHeader>

                    <TableBody>
                        {loading ? (
                            <TableRow>
                                <TableCell colSpan={6}>Loading...</TableCell>
                            </TableRow>
                        ) : filteredRows.length === 0 ? (
                            <TableRow>
                                <TableCell colSpan={6}>
                                    {canViewEveryone ? "No attendance records found." : "No attendance record found for this date."}
                                </TableCell>
                            </TableRow>
                        ) : (
                            filteredRows.map((employee) => {
                                const status = statusStyles[employee.status];

                                return (
                                    <TableRow key={employee.id}>
                                        <TableCell>
                                            <div className="flex gap-2 items-center">
                                                <Avatar>
                                                    <AvatarFallback>
                                                        {employee.name?.[0] ?? "U"}
                                                    </AvatarFallback>
                                                </Avatar>
                                                <div>
                                                    <p className="font-medium">{employee.name ?? "-"}</p>
                                                    <p className="text-sm text-muted-foreground">
                                                        {employee.location}
                                                    </p>
                                                </div>
                                            </div>
                                        </TableCell>

                                        <TableCell>{employee.department ?? "-"}</TableCell>
                                        <TableCell>{employee.punchIn}</TableCell>
                                        <TableCell>{employee.punchOut}</TableCell>
                                        <TableCell>{employee.hours}</TableCell>

                                        <TableCell>
                                            <Badge className={cn(status.bg, status.text)}>
                                                {status.label}
                                            </Badge>
                                        </TableCell>
                                    </TableRow>
                                );
                            })
                        )}
                    </TableBody>
                </Table>
            </CardContent>
        </div>
    );
};

export default Attendance;
