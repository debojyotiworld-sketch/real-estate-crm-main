import { useCallback, useEffect, useMemo, useState } from "react";
import { Download, Eye, Filter, MoreHorizontal, Search } from "lucide-react";
import { toast } from "sonner";

import { ProfessionalDialog } from "@/components/common/ProfessionalDialog";
import { Button } from "@/components/ui/button";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Input } from "@/components/ui/input";
import { supabase } from "@/integrations/supabase/client";
import { cn } from "@/lib/utils";

type LeaveStatus = "pending" | "approved" | "rejected" | "cancelled";

type LeaveRow = {
    id: string;
    employee_id: string | null;
    leave_type: string;
    from_date: string;
    to_date: string;
    days: number;
    reason: string | null;
    status: LeaveStatus | string | null;
    applied_on: string | null;
    rejection_reason: string | null;
    employees?: {
        name?: string | null;
        department?: string | null;
    } | null;
};

const statusConfig: Record<LeaveStatus, { label: string; className: string }> = {
    pending: { label: "Pending", className: "bg-yellow-100 text-yellow-700" },
    approved: { label: "Approved", className: "bg-green-100 text-green-700" },
    rejected: { label: "Rejected", className: "bg-red-100 text-red-700" },
    cancelled: { label: "Cancelled", className: "bg-slate-100 text-slate-700" },
};

const leaveTypeClasses: Record<string, string> = {
    "Casual Leave": "bg-blue-100 text-blue-700",
    "Sick Leave": "bg-red-100 text-red-700",
    "Annual Leave": "bg-emerald-100 text-emerald-700",
};

const formatDate = (date?: string | null) => {
    if (!date) return "-";
    return new Date(date).toLocaleDateString("en-IN", {
        day: "2-digit",
        month: "short",
        year: "numeric",
    });
};

const formatDateTime = (date?: string | null) => {
    if (!date) return "-";
    return new Date(date).toLocaleString("en-IN", {
        day: "2-digit",
        month: "short",
        year: "numeric",
        hour: "2-digit",
        minute: "2-digit",
    });
};

const StatusBadge = ({ status }: { status?: string | null }) => {
    const key = (status || "pending").toLowerCase() as LeaveStatus;
    const config = statusConfig[key] ?? statusConfig.pending;

    return (
        <span className={cn("rounded-full px-2.5 py-1 text-xs font-medium", config.className)}>
            {config.label}
        </span>
    );
};

const LeaveTypeBadge = ({ type }: { type: string }) => (
    <span className={cn("rounded-full px-2.5 py-1 text-xs font-medium", leaveTypeClasses[type] ?? "bg-muted text-muted-foreground")}>
        {type}
    </span>
);

const FilterButton = ({
    label,
    active,
    onClick,
}: {
    label: string;
    active: boolean;
    onClick: () => void;
}) => (
    <button
        type="button"
        onClick={onClick}
        className={cn(
            "rounded-full px-3 py-1 text-sm transition-colors",
            active ? "bg-[#0f172a] text-white" : "bg-muted text-muted-foreground hover:bg-muted/80"
        )}
    >
        {label}
    </button>
);

export default function LeaveRequests() {
    const [leaves, setLeaves] = useState<LeaveRow[]>([]);
    const [filter, setFilter] = useState<LeaveStatus | "all">("all");
    const [leaveTypeFilter, setLeaveTypeFilter] = useState<"all" | "Casual Leave" | "Sick Leave">("all");
    const [search, setSearch] = useState("");
    const [loading, setLoading] = useState(true);
    const [savingStatus, setSavingStatus] = useState(false);
    const [selectedLeave, setSelectedLeave] = useState<LeaveRow | null>(null);

    const fetchLeaves = useCallback(async () => {
        setLoading(true);

        const { data, error } = await supabase
            .from("leave_requests")
            .select(`
                id,
                employee_id,
                leave_type,
                from_date,
                to_date,
                days,
                reason,
                status,
                applied_on,
                rejection_reason,
                employees(name, department)
            `)
            .order("applied_on", { ascending: false });

        if (error) {
            console.error(error);
            toast.error("Failed to load leave requests");
            setLeaves([]);
        } else {
            setLeaves((data ?? []) as LeaveRow[]);
        }

        setLoading(false);
    }, []);

    useEffect(() => {
        void fetchLeaves();
    }, [fetchLeaves]);

    const filtered = useMemo(() => {
        const query = search.trim().toLowerCase();

        return leaves.filter((leave) => {
            const status = (leave.status || "pending").toLowerCase();
            const matchesFilter = filter === "all" || status === filter;
            const matchesSearch =
                !query ||
                leave.employees?.name?.toLowerCase().includes(query) ||
                leave.employees?.department?.toLowerCase().includes(query) ||
                leave.leave_type.toLowerCase().includes(query) ||
                leave.reason?.toLowerCase().includes(query);
            const matchesLeaveType =
                leaveTypeFilter === "all" ||
                leave.leave_type === leaveTypeFilter;

            return matchesFilter && matchesSearch && matchesLeaveType;
        });
    }, [filter, leaves, search, leaveTypeFilter]);

    const counts = useMemo(() => {
        return leaves.reduce(
            (acc, leave) => {
                const status = (leave.status || "pending").toLowerCase() as LeaveStatus;
                acc.all += 1;
                if (status in statusConfig) acc[status] += 1;
                return acc;
            },
            { all: 0, pending: 0, approved: 0, rejected: 0, cancelled: 0 }
        );
    }, [leaves]);

    const leaveBalances = useMemo(() => {
        const balances: Record<
            string,
            {
                casual: number;
                sick: number;
            }
        > = {};

        leaves.forEach((leave) => {
            if ((leave.status || "").toLowerCase() !== "approved") return;

            const employeeId = leave.employee_id;
            if (!employeeId) return;

            if (!balances[employeeId]) {
                balances[employeeId] = {
                    casual: 8,
                    sick: 8,
                };
            }

            if (leave.leave_type === "Casual Leave") {
                balances[employeeId].casual -= leave.days;
            }

            if (leave.leave_type === "Sick Leave") {
                balances[employeeId].sick -= leave.days;
            }
        });

        return balances;
    }, [leaves]);

    const updateStatus = async (id: string, status: LeaveStatus) => {
        setSavingStatus(true);

        const { data: auth } = await supabase.auth.getUser();
        const payload = {
            status,
            approved_at: status === "approved" ? new Date().toISOString() : null,
            approved_by: status === "approved" ? auth.user?.id ?? null : null,
        };

        const { error } = await supabase.from("leave_requests").update(payload).eq("id", id);

        if (error) {
            console.error(error);
            toast.error("Failed to update leave status");
        } else {
            toast.success(`Leave ${status}`);
            setSelectedLeave(null);
            await fetchLeaves();
        }

        setSavingStatus(false);
    };

    const exportCsv = () => {
        const rows = filtered.map((leave) => [
            leave.employees?.name ?? "-",
            leave.employees?.department ?? "-",
            leave.leave_type,
            leave.from_date,
            leave.to_date,
            String(leave.days),
            leave.status ?? "pending",
            leave.reason ?? "",
        ]);

        const csv = [
            ["Employee", "Department", "Leave Type", "From", "To", "Days", "Status", "Reason"],
            ...rows,
        ]
            .map((row) => row.map((cell) => `"${String(cell).replace(/"/g, '""')}"`).join(","))
            .join("\n");

        const blob = new Blob([csv], { type: "text/csv;charset=utf-8" });
        const url = URL.createObjectURL(blob);
        const link = document.createElement("a");
        link.href = url;
        link.download = "leave-requests.csv";
        link.click();
        URL.revokeObjectURL(url);
    };

    return (
        <div className="rounded-2xl border bg-card p-6">
            <div className="mb-5 flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
                <div>
                    <h2 className="text-lg font-semibold">Leave Requests</h2>
                    <p className="text-sm text-muted-foreground">
                        Review employee leave, approve eligible requests, and keep records audit-ready.
                    </p>
                </div>

                <div className="flex flex-col gap-2 sm:flex-row">
                    <div className="relative">
                        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                        <Input
                            placeholder="Search employee, department, reason..."
                            value={search}
                            onChange={(event) => setSearch(event.target.value)}
                            className="pl-9 sm:w-72"
                        />
                    </div>

                    <Button variant="outline" className="gap-2" disabled>
                        <Filter className="h-4 w-4" />
                        Smart Filters
                    </Button>

                    <Button className="gap-2" onClick={exportCsv}>
                        <Download className="h-4 w-4" />
                        Export
                    </Button>
                </div>
            </div>

            <div className="mb-4 flex flex-wrap gap-2">
                <FilterButton label={`All (${counts.all})`} active={filter === "all"} onClick={() => setFilter("all")} />
                <FilterButton label={`Pending (${counts.pending})`} active={filter === "pending"} onClick={() => setFilter("pending")} />
                <FilterButton label={`Approved (${counts.approved})`} active={filter === "approved"} onClick={() => setFilter("approved")} />
                <FilterButton label={`Rejected (${counts.rejected})`} active={filter === "rejected"} onClick={() => setFilter("rejected")} />
                <FilterButton label={`Cancelled (${counts.cancelled})`} active={filter === "cancelled"} onClick={() => setFilter("cancelled")} />
            </div>
            <div className="mb-4 flex flex-wrap gap-2">
                <FilterButton
                    label="All Leave Types"
                    active={leaveTypeFilter === "all"}
                    onClick={() => setLeaveTypeFilter("all")}
                />

                <FilterButton
                    label="Casual Leave"
                    active={leaveTypeFilter === "Casual Leave"}
                    onClick={() => setLeaveTypeFilter("Casual Leave")}
                />

                <FilterButton
                    label="Sick Leave"
                    active={leaveTypeFilter === "Sick Leave"}
                    onClick={() => setLeaveTypeFilter("Sick Leave")}
                />
            </div>

            <div className="overflow-x-auto">
                <table className="w-full text-sm">
                    <thead className="border-b text-left text-muted-foreground">
                        <tr>
                            <th className="py-3">Employee</th>
                            <th>Leave Type</th>
                            <th>Duration</th>
                            <th>Days</th>
                            <th>Reason</th>
                            <th>Status</th>
                            <th>Applied On</th>
                            <th className="text-right">Action</th>
                            <th>Remaining Leaves</th>
                        </tr>
                    </thead>

                    <tbody>
                        {loading ? (
                            <tr>
                                <td className="py-6 text-center text-muted-foreground" colSpan={8}>
                                    Loading leave requests...
                                </td>
                            </tr>
                        ) : filtered.length === 0 ? (
                            <tr>
                                <td className="py-6 text-center text-muted-foreground" colSpan={8}>
                                    No leave requests found.
                                </td>
                            </tr>
                        ) : (
                            filtered.map((leave) => (
                                <tr key={leave.id} className="border-b hover:bg-muted/40">
                                    <td className="py-4">
                                        <div className="flex items-center gap-3">
                                            <div className="flex h-9 w-9 items-center justify-center rounded-full bg-muted font-medium">
                                                {leave.employees?.name?.charAt(0) ?? "E"}
                                            </div>
                                            <div>
                                                <p className="font-medium">{leave.employees?.name ?? "-"}</p>
                                                <p className="text-xs text-muted-foreground">{leave.employees?.department ?? "-"}</p>
                                            </div>
                                        </div>
                                    </td>
                                    <td><LeaveTypeBadge type={leave.leave_type} /></td>
                                    <td>
                                        <p>{formatDate(leave.from_date)} - {formatDate(leave.to_date)}</p>
                                    </td>
                                    <td>{leave.days}</td>
                                    <td className="max-w-[260px] truncate">{leave.reason ?? "-"}</td>
                                    <td><StatusBadge status={leave.status} /></td>
                                    <td>
                                        <div className="space-y-1 text-xs">
                                            <div className="rounded-md bg-blue-50 px-2 py-1 text-blue-700">
                                                CL:{" "}
                                                {leaveBalances[leave.employee_id || ""]?.casual ?? 8}
                                            </div>

                                            <div className="rounded-md bg-red-50 px-2 py-1 text-red-700">
                                                SL:{" "}
                                                {leaveBalances[leave.employee_id || ""]?.sick ?? 8}
                                            </div>
                                        </div>
                                    </td>
                                    <td className="text-xs text-muted-foreground">{formatDateTime(leave.applied_on)}</td>
                                    <td className="text-right">
                                        <DropdownMenu>
                                            <DropdownMenuTrigger asChild>
                                                <Button variant="outline" size="icon">
                                                    <MoreHorizontal className="h-4 w-4" />
                                                </Button>
                                            </DropdownMenuTrigger>
                                            <DropdownMenuContent align="end">
                                                <DropdownMenuItem onClick={() => setSelectedLeave(leave)}>
                                                    <Eye className="mr-2 h-4 w-4" />
                                                    View Details
                                                </DropdownMenuItem>
                                            </DropdownMenuContent>
                                        </DropdownMenu>
                                    </td>
                                </tr>
                            ))
                        )}
                    </tbody>
                </table>
            </div>

            <div className="mt-4 text-sm text-muted-foreground">
                Showing {filtered.length} of {leaves.length} requests
            </div>

            <ProfessionalDialog
                open={!!selectedLeave}
                onOpenChange={(open) => !open && setSelectedLeave(null)}
                title="Leave Request Review"
                description="Check the details carefully before changing the leave status."
                className="sm:max-w-[620px]"
                footer={
                    selectedLeave ? (
                        <>
                            <Button variant="outline" onClick={() => setSelectedLeave(null)} disabled={savingStatus}>
                                Close
                            </Button>
                            <Button variant="destructive" onClick={() => void updateStatus(selectedLeave.id, "rejected")} disabled={savingStatus}>
                                Reject
                            </Button>
                            <Button onClick={() => void updateStatus(selectedLeave.id, "approved")} disabled={savingStatus}>
                                Approve
                            </Button>
                        </>
                    ) : null
                }
            >
                {selectedLeave ? (
                    <div className="space-y-5">
                        <div className="rounded-xl border bg-muted/30 p-4">
                            <div className="flex items-start justify-between gap-4">
                                <div>
                                    <p className="font-semibold">{selectedLeave.employees?.name ?? "-"}</p>
                                    <p className="text-sm text-muted-foreground">{selectedLeave.employees?.department ?? "-"}</p>
                                </div>
                                <StatusBadge status={selectedLeave.status} />
                            </div>
                        </div>

                        <div className="grid gap-4 text-sm sm:grid-cols-2">
                            <Info label="Leave Type" value={<LeaveTypeBadge type={selectedLeave.leave_type} />} />
                            <Info label="Applied On" value={formatDateTime(selectedLeave.applied_on)} />
                            <Info label="From Date" value={formatDate(selectedLeave.from_date)} />
                            <Info label="To Date" value={formatDate(selectedLeave.to_date)} />
                            <Info label="Total Days" value={`${selectedLeave.days} day${selectedLeave.days === 1 ? "" : "s"}`} />
                            <Info label="Current Status" value={<StatusBadge status={selectedLeave.status} />} />
                        </div>

                        <div>
                            <p className="mb-1 text-sm text-muted-foreground">Reason</p>
                            <p className="rounded-xl border bg-background p-4 text-sm leading-6">
                                {selectedLeave.reason || "No reason provided."}
                            </p>
                        </div>
                    </div>
                ) : null}
            </ProfessionalDialog>
        </div>
    );
}

function Info({ label, value }: { label: string; value: React.ReactNode }) {
    return (
        <div>
            <p className="text-xs uppercase tracking-wide text-muted-foreground">{label}</p>
            <div className="mt-1 font-medium">{value}</div>
        </div>
    );
}
