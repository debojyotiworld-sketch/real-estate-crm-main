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
import { usePayroll } from "@/hooks/hr/usePayroll";
import {
    Card,
    CardContent,
} from "@/components/ui/card";

import {
    Button,
} from "@/components/ui/button";

import {
    Badge,
} from "@/components/ui/badge";

import {
    Label,
} from "@/components/ui/label";

import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";

import {
    Separator,
} from "@/components/ui/separator";

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
    IndianRupee,
    Wallet,
    CheckCircle2,
} from "lucide-react";
// Bypassing Supabase Types due to permission limits
type Employee = any;
interface Props {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    employee: Employee | null;
}

export const EmployeePayrollModal = ({
    open,
    onOpenChange,
    employee,
}: Props) => {

    const {
        payrolls,
        loading,
        summary,
        fetchPayrolls,
        generatePayroll,
        approvePayroll,
        markPayrollPaid,
    } = usePayroll();

    const [month, setMonth] = useState(String(new Date().getMonth() + 1));
    const [year, setYear] = useState(String(new Date().getFullYear()));

    // =====================================
    // LOAD
    // =====================================

    useEffect(() => {
        if (open && employee?.id) {
            void fetchPayrolls(employee.id);
        }
    }, [open, employee, fetchPayrolls]);

    // =====================================
    // GENERATE
    // =====================================

    const handleGenerate = async () => {
        if (!employee?.id) {
            return;
        }

        await generatePayroll(
            employee.id,
            Number(month),
            Number(year)
        );

        await fetchPayrolls(employee.id);
    };

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="max-w-7xl max-h-[95vh] overflow-y-auto">
                <DialogHeader>
                    <DialogTitle>Payroll Management</DialogTitle>
                </DialogHeader>

                {employee && (
                    <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-6">
                        <div>
                            <h2 className="text-2xl font-bold">
                                {employee.name}
                            </h2>
                            <div className="text-muted-foreground">
                                {employee.employee_code}
                            </div>
                        </div>
                        <Badge className="text-sm px-4 py-2">
                            {employee.department}
                        </Badge>
                    </div>
                )}

                {/* GENERATE */}
                <Card>
                    <CardContent className="pt-6">
                        <div className="grid md:grid-cols-4 gap-4">
                            {/* MONTH */}
                            <div>
                                <Label>Month</Label>
                                <Select value={month} onValueChange={setMonth}>
                                    <SelectTrigger>
                                        <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent>
                                        {Array.from({ length: 12 }).map((_, index) => (
                                            <SelectItem
                                                key={index}
                                                value={String(index + 1)}
                                            >
                                                {index + 1}
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>

                            {/* YEAR */}
                            <div>
                                <Label>Year</Label>
                                <Select value={year} onValueChange={setYear}>
                                    <SelectTrigger>
                                        <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent>
                                        {[2024, 2025, 2026, 2027].map(yr => (
                                            <SelectItem
                                                key={yr}
                                                value={String(yr)}
                                            >
                                                {yr}
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>

                            {/* BUTTON */}
                            <div className="flex items-end">
                                <Button
                                    className="w-full"
                                    disabled={loading}
                                    onClick={handleGenerate}
                                >
                                    {loading ? "Generating..." : "Generate Payroll"}
                                </Button>
                            </div>
                        </div>
                    </CardContent>
                </Card>

                {/* SUMMARY */}
                {summary && (
                    <div className="grid md:grid-cols-4 gap-4">
                        {/* PRESENT */}
                        <Card>
                            <CardContent className="pt-6">
                                <div className="flex items-center justify-between">
                                    <div>
                                        <div className="text-sm text-muted-foreground">
                                            Present Days
                                        </div>
                                        <div className="text-2xl font-bold">
                                            {summary.present_days}
                                        </div>
                                    </div>
                                    <Calendar />
                                </div>
                            </CardContent>
                        </Card>

                        {/* LEAVE */}
                        <Card>
                            <CardContent className="pt-6">
                                <div className="flex items-center justify-between">
                                    <div>
                                        <div className="text-sm text-muted-foreground">
                                            LOP Days
                                        </div>
                                        <div className="text-2xl font-bold">
                                            {summary.lop_days}
                                        </div>
                                    </div>
                                    <Wallet />
                                </div>
                            </CardContent>
                        </Card>

                        {/* DEDUCTION */}
                        <Card>
                            <CardContent className="pt-6">
                                <div className="flex items-center justify-between">
                                    <div>
                                        <div className="text-sm text-muted-foreground">
                                            Deductions
                                        </div>
                                        <div className="text-2xl font-bold">
                                            ₹{summary.total_deductions.toFixed(2)}
                                        </div>
                                    </div>
                                    <IndianRupee />
                                </div>
                            </CardContent>
                        </Card>

                        {/* FINAL */}
                        <Card>
                            <CardContent className="pt-6">
                                <div className="flex items-center justify-between">
                                    <div>
                                        <div className="text-sm text-muted-foreground">
                                            Final Salary
                                        </div>
                                        <div className="text-2xl font-bold">
                                            ₹{summary.final_salary.toFixed(2)}
                                        </div>
                                    </div>
                                    <CheckCircle2 />
                                </div>
                            </CardContent>
                        </Card>
                    </div>
                )}

                <Separator />

                {/* PAYROLL TABLE */}
                <Card>
                    <CardContent className="pt-6">
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead>Month</TableHead>
                                    <TableHead>Present</TableHead>
                                    <TableHead>LOP</TableHead>
                                    <TableHead>Earned</TableHead>
                                    <TableHead>Deduction</TableHead>
                                    <TableHead>Net</TableHead>
                                    <TableHead>Status</TableHead>
                                    <TableHead>Actions</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {/* Fix: Added ?.filter(Boolean) to prevent null mapping errors */}
                                {payrolls?.filter(Boolean).map(payroll => (
                                    <TableRow key={payroll?.id}>
                                        <TableCell>
                                            {payroll.payroll_month}/{payroll.payroll_year}
                                        </TableCell>
                                        <TableCell>{payroll.present_days}</TableCell>
                                        <TableCell>{payroll.lop_days}</TableCell>
                                        <TableCell>₹{payroll.earned_salary}</TableCell>
                                        <TableCell>₹{payroll.total_deductions}</TableCell>
                                        <TableCell>₹{payroll.net_salary}</TableCell>
                                        <TableCell>
                                            <Badge>{payroll.payroll_status}</Badge>
                                        </TableCell>

                                        {/* ACTIONS */}
                                        <TableCell>
                                            <div className="flex gap-2">
                                                {payroll.payroll_status !== "approved" &&
                                                    payroll.payroll_status !== "paid" && (
                                                        <Button
                                                            size="sm"
                                                            onClick={() =>
                                                                // Fix: passed employee?.id to prevent all users' payrolls mixing
                                                                approvePayroll(payroll.id, employee?.id)
                                                            }
                                                        >
                                                            Approve
                                                        </Button>
                                                    )}

                                                {payroll.payroll_status === "approved" && (
                                                    <Button
                                                        size="sm"
                                                        variant="outline"
                                                        onClick={() =>
                                                            // Fix: passed employee?.id
                                                            markPayrollPaid(payroll.id, employee?.id)
                                                        }
                                                    >
                                                        Mark Paid
                                                    </Button>
                                                )}
                                            </div>
                                        </TableCell>
                                    </TableRow>
                                ))}
                            </TableBody>
                        </Table>
                    </CardContent>
                </Card>

                {/* FOOTER */}
                <div className="flex justify-end">
                    <Button variant="outline" onClick={() => onOpenChange(false)}>
                        Close
                    </Button>
                </div>
            </DialogContent>
        </Dialog>
    );
};