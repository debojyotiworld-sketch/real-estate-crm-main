import {
    useEffect,
    useState,
} from "react";

import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog";

import {
    Tabs,
    TabsContent,
    TabsList,
    TabsTrigger,
} from "@/components/ui/tabs";

import {
    Card,
    CardContent,
} from "@/components/ui/card";

import {
    Avatar,
    AvatarFallback,
    AvatarImage,
} from "@/components/ui/avatar";

import {
    Badge,
} from "@/components/ui/badge";

import {
    Separator,
} from "@/components/ui/separator";

import {
    Button,
} from "@/components/ui/button";

import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table";

import {
    Calendar,
    Mail,
    Phone,
    Building2,
    Wallet,
    Clock3,
    IndianRupee,
} from "lucide-react";

import { Tables } from "@/integrations/supabase/types";

type Employee = Tables<"employees">;
type SalaryStructure = Tables<"employee_salary_structures">;
type Payroll = Tables<"employee_payrolls">;
type LeaveRequest = Tables<"leave_requests">;
type AttendanceLog = Tables<"attendance_logs">;

import { supabase }
from "@/integrations/supabase/client";

interface Props {

    open: boolean;

    onOpenChange: (
        open: boolean
    ) => void;

    employee: Employee | null;
}

export const EmployeeViewModal = ({
    open,
    onOpenChange,
    employee,
}: Props) => {

    const [loading, setLoading] =
        useState(false);

    const [salary, setSalary] =
        useState<
            SalaryStructure | null
        >(null);

    const [payrolls, setPayrolls] =
        useState<Payroll[]>([]);

    const [attendance, setAttendance] =
        useState<AttendanceLog[]>([]);

    const [leaves, setLeaves] =
        useState<LeaveRequest[]>([]);

    // =====================================
    // LOAD
    // =====================================

    useEffect(() => {

        const load =
            async () => {

                if (!employee?.id) {
                    return;
                }

                try {

                    setLoading(true);

                    const [

                        salaryRes,

                        payrollRes,

                        attendanceRes,

                        leaveRes,

                    ] = await Promise.all([

                        (
                            supabase as any
                        )
                            .from(
                                "employee_salary_structures"
                            )
                            .select("*")
                            .eq(
                                "employee_id",
                                employee.id
                            )
                            .eq(
                                "is_current",
                                true
                            )
                            .maybeSingle(),

                        (
                            supabase as any
                        )
                            .from(
                                "employee_payrolls"
                            )
                            .select("*")
                            .eq(
                                "employee_id",
                                employee.id
                            )
                            .order(
                                "created_at",
                                {
                                    ascending: false,
                                }
                            ),

                        (
                            supabase as any
                        )
                            .from(
                                "attendance_logs"
                            )
                            .select("*")
                            .eq(
                                "employee_id",
                                employee.id
                            )
                            .order(
                                "attendance_date",
                                {
                                    ascending: false,
                                }
                            )
                            .limit(10),

                        (
                            supabase as any
                        )
                            .from(
                                "leave_requests"
                            )
                            .select("*")
                            .eq(
                                "employee_id",
                                employee.id
                            )
                            .order(
                                "created_at",
                                {
                                    ascending: false,
                                }
                            ),
                    ]);

                    setSalary(
                        salaryRes.data
                    );

                    setPayrolls(
                        (
                            payrollRes.data || []
                        ) as Payroll[]
                    );

                    setAttendance(
                        (
                            attendanceRes.data || []
                        ) as AttendanceLog[]
                    );

                    setLeaves(
                        (
                            leaveRes.data || []
                        ) as LeaveRequest[]
                    );

                } catch (err) {

                    console.error(err);

                } finally {

                    setLoading(false);

                }
            };

        if (
            open &&
            employee
        ) {

            void load();
        }

    }, [
        open,
        employee,
    ]);

    if (!employee) {
        return null;
    }

    return (

        <Dialog
            open={open}
            onOpenChange={
                onOpenChange
            }
        >

            <DialogContent
                className="
                    max-w-7xl
                    max-h-[95vh]
                    overflow-y-auto
                "
            >

                <DialogHeader>

                    <DialogTitle>

                        Employee Profile

                    </DialogTitle>

                </DialogHeader>

                {/* HEADER */}

                <div
                    className="
                        flex
                        flex-col
                        md:flex-row
                        md:items-center
                        md:justify-between
                        gap-6
                    "
                >

                    <div
                        className="
                            flex
                            items-center
                            gap-5
                        "
                    >

                        <Avatar
                            className="
                                w-24
                                h-24
                            "
                        >

                            <AvatarImage
                                src={
                                    employee.photo_url || ""
                                }
                            />

                            <AvatarFallback>

                                {
                                    employee.name?.charAt(0)
                                }

                            </AvatarFallback>

                        </Avatar>

                        <div>

                            <h2
                                className="
                                    text-2xl
                                    font-bold
                                "
                            >

                                {
                                    employee.name
                                }

                            </h2>

                            <div
                                className="
                                    text-muted-foreground
                                "
                            >

                                {
                                    employee.employee_code
                                }

                            </div>

                            <div
                                className="
                                    flex
                                    items-center
                                    gap-2
                                    mt-2
                                "
                            >

                                <Badge>

                                    {
                                        employee.status || "active"
                                    }

                                </Badge>

                                <Badge
                                    variant="outline"
                                >

                                    {
                                        employee.department || "-"
                                    }

                                </Badge>

                            </div>

                        </div>

                    </div>

                    {/* SALARY */}

                    <Card
                        className="
                            min-w-[250px]
                        "
                    >

                        <CardContent
                            className="
                                pt-6
                            "
                        >

                            <div
                                className="
                                    text-sm
                                    text-muted-foreground
                                "
                            >

                                Current Salary

                            </div>

                            <div
                                className="
                                    text-3xl
                                    font-bold
                                    flex
                                    items-center
                                    gap-1
                                "
                            >

                                <IndianRupee
                                    className="
                                        w-6
                                        h-6
                                    "
                                />

                                {
                                    salary?.net_payable || 0
                                }

                            </div>

                            <div
                                className="
                                    text-sm
                                    mt-2
                                "
                            >

                                CTC:
                                {" "}
                                ₹
                                {
                                    salary?.ctc || 0
                                }

                            </div>

                        </CardContent>

                    </Card>

                </div>

                <Separator />

                {/* DETAILS */}

                <div
                    className="
                        grid
                        md:grid-cols-4
                        gap-4
                    "
                >

                    <Card>

                        <CardContent
                            className="
                                pt-6
                                flex
                                items-center
                                gap-3
                            "
                        >

                            <Mail />

                            <div>

                                <div
                                    className="
                                        text-sm
                                        text-muted-foreground
                                    "
                                >

                                    Email

                                </div>

                                <div>

                                    {
                                        employee.email
                                    }

                                </div>

                            </div>

                        </CardContent>

                    </Card>

                    <Card>

                        <CardContent
                            className="
                                pt-6
                                flex
                                items-center
                                gap-3
                            "
                        >

                            <Phone />

                            <div>

                                <div
                                    className="
                                        text-sm
                                        text-muted-foreground
                                    "
                                >

                                    Phone

                                </div>

                                <div>

                                    {
                                        employee.phone || "-"
                                    }

                                </div>

                            </div>

                        </CardContent>

                    </Card>

                    <Card>

                        <CardContent
                            className="
                                pt-6
                                flex
                                items-center
                                gap-3
                            "
                        >

                            <Building2 />

                            <div>

                                <div
                                    className="
                                        text-sm
                                        text-muted-foreground
                                    "
                                >

                                    Branch

                                </div>

                                <div>

                                    {
                                        employee.branches?.branch_name || "-"
                                    }

                                </div>

                            </div>

                        </CardContent>

                    </Card>

                    <Card>

                        <CardContent
                            className="
                                pt-6
                                flex
                                items-center
                                gap-3
                            "
                        >

                            <Calendar />

                            <div>

                                <div
                                    className="
                                        text-sm
                                        text-muted-foreground
                                    "
                                >

                                    Joining Date

                                </div>

                                <div>

                                    {
                                        employee.joining_date || "-"
                                    }

                                </div>

                            </div>

                        </CardContent>

                    </Card>

                </div>

                {/* TABS */}

                <Tabs
                    defaultValue="payroll"
                    className="
                        mt-6
                    "
                >

                    <TabsList
                        className="
                            grid
                            grid-cols-3
                            w-full
                        "
                    >

                        <TabsTrigger
                            value="payroll"
                        >

                            Payroll

                        </TabsTrigger>

                        <TabsTrigger
                            value="attendance"
                        >

                            Attendance

                        </TabsTrigger>

                        <TabsTrigger
                            value="leave"
                        >

                            Leaves

                        </TabsTrigger>

                    </TabsList>

                    {/* PAYROLL */}

                    <TabsContent
                        value="payroll"
                    >

                        <Card>

                            <CardContent
                                className="
                                    pt-6
                                "
                            >

                                <Table>

                                    <TableHeader>

                                        <TableRow>

                                            <TableHead>
                                                Month
                                            </TableHead>

                                            <TableHead>
                                                Earned
                                            </TableHead>

                                            <TableHead>
                                                Deduction
                                            </TableHead>

                                            <TableHead>
                                                Net
                                            </TableHead>

                                            <TableHead>
                                                Status
                                            </TableHead>

                                        </TableRow>

                                    </TableHeader>

                                    <TableBody>

                                        {
                                            payrolls.map(
                                                payroll => (

                                                    <TableRow
                                                        key={
                                                            payroll.id
                                                        }
                                                    >

                                                        <TableCell>

                                                            {
                                                                payroll.payroll_month
                                                            }
                                                            /
                                                            {
                                                                payroll.payroll_year
                                                            }

                                                        </TableCell>

                                                        <TableCell>

                                                            ₹
                                                            {
                                                                payroll.earned_salary
                                                            }

                                                        </TableCell>

                                                        <TableCell>

                                                            ₹
                                                            {
                                                                payroll.total_deductions
                                                            }

                                                        </TableCell>

                                                        <TableCell>

                                                            ₹
                                                            {
                                                                payroll.net_salary
                                                            }

                                                        </TableCell>

                                                        <TableCell>

                                                            <Badge>

                                                                {
                                                                    payroll.payroll_status
                                                                }

                                                            </Badge>

                                                        </TableCell>

                                                    </TableRow>
                                                )
                                            )
                                        }

                                    </TableBody>

                                </Table>

                            </CardContent>

                        </Card>

                    </TabsContent>

                    {/* ATTENDANCE */}

                    <TabsContent
                        value="attendance"
                    >

                        <Card>

                            <CardContent
                                className="
                                    pt-6
                                "
                            >

                                <Table>

                                    <TableHeader>

                                        <TableRow>

                                            <TableHead>
                                                Date
                                            </TableHead>

                                            <TableHead>
                                                Punch In
                                            </TableHead>

                                            <TableHead>
                                                Punch Out
                                            </TableHead>

                                            <TableHead>
                                                Status
                                            </TableHead>

                                        </TableRow>

                                    </TableHeader>

                                    <TableBody>

                                        {
                                            attendance.map(
                                                item => (

                                                    <TableRow
                                                        key={
                                                            item.id
                                                        }
                                                    >

                                                        <TableCell>

                                                            {
                                                                item.attendance_date
                                                            }

                                                        </TableCell>

                                                        <TableCell>

                                                            {
                                                                item.punch_in
                                                            }

                                                        </TableCell>

                                                        <TableCell>

                                                            {
                                                                item.punch_out || "-"
                                                            }

                                                        </TableCell>

                                                        <TableCell>

                                                            <Badge>

                                                                {
                                                                    item.status
                                                                }

                                                            </Badge>

                                                        </TableCell>

                                                    </TableRow>
                                                )
                                            )
                                        }

                                    </TableBody>

                                </Table>

                            </CardContent>

                        </Card>

                    </TabsContent>

                    {/* LEAVES */}

                    <TabsContent
                        value="leave"
                    >

                        <Card>

                            <CardContent
                                className="
                                    pt-6
                                "
                            >

                                <Table>

                                    <TableHeader>

                                        <TableRow>

                                            <TableHead>
                                                Type
                                            </TableHead>

                                            <TableHead>
                                                From
                                            </TableHead>

                                            <TableHead>
                                                To
                                            </TableHead>

                                            <TableHead>
                                                Days
                                            </TableHead>

                                            <TableHead>
                                                Status
                                            </TableHead>

                                        </TableRow>

                                    </TableHeader>

                                    <TableBody>

                                        {
                                            leaves.map(
                                                leave => (

                                                    <TableRow
                                                        key={
                                                            leave.id
                                                        }
                                                    >

                                                        <TableCell>

                                                            {
                                                                leave.leave_type
                                                            }

                                                        </TableCell>

                                                        <TableCell>

                                                            {
                                                                leave.from_date
                                                            }

                                                        </TableCell>

                                                        <TableCell>

                                                            {
                                                                leave.to_date
                                                            }

                                                        </TableCell>

                                                        <TableCell>

                                                            {
                                                                leave.days
                                                            }

                                                        </TableCell>

                                                        <TableCell>

                                                            <Badge>

                                                                {
                                                                    leave.status
                                                                }

                                                            </Badge>

                                                        </TableCell>

                                                    </TableRow>
                                                )
                                            )
                                        }

                                    </TableBody>

                                </Table>

                            </CardContent>

                        </Card>

                    </TabsContent>

                </Tabs>

                <div
                    className="
                        flex
                        justify-end
                        mt-6
                    "
                >

                    <Button
                        variant="outline"
                        onClick={() =>
                            onOpenChange(
                                false
                            )
                        }
                    >

                        Close

                    </Button>

                </div>

            </DialogContent>

        </Dialog>
    );
};