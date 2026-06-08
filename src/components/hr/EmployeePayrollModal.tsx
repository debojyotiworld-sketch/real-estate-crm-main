/* import React, { useEffect, useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { usePayroll } from "@/hooks/hr/usePayroll";
// Changed icons to very standard ones (Wallet instead of Coins) to prevent compilation errors
import { Loader2, Printer, CheckCircle, CreditCard, Eye, RefreshCw, Wallet } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

interface Props {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    employee: any;
}

export const EmployeePayrollModal = ({ open, onOpenChange, employee }: Props) => {
    const {
        payrolls,
        loading,
        fetchPayrolls,
        generatePayroll,
        approvePayroll,
        markPayrollPaid,
    } = usePayroll();

    const [month, setMonth] = useState<string>(String(new Date().getMonth() + 1));
    const [year, setYear] = useState<string>(String(new Date().getFullYear()));
    const [selectedPayslip, setSelectedPayslip] = useState<any>(null);
    const [viewPayslipOpen, setViewPayslipOpen] = useState(false);

    // Advance States
    const [activeAdvance, setActiveAdvance] = useState<any>(null);
    const [advanceLoading, setAdvanceLoading] = useState(false);
    const [advAmount, setAdvAmount] = useState("");
    const [advType, setAdvType] = useState("FULL");
    const [advEmi, setAdvEmi] = useState("");

    // Fetch Active Advance
    const fetchActiveAdvance = async () => {
        if (!employee?.id) return;
        try {
            const { data, error } = await supabase
                .from("salary_advances" as any)
                .select("*")
                .eq("employee_id", employee.id)
                .eq("status", "ACTIVE")
                .maybeSingle();
            
            if (!error && data) {
                setActiveAdvance(data);
            } else {
                setActiveAdvance(null);
            }
        } catch (err) {
            console.error("Error fetching advance", err);
        }
    };

    useEffect(() => {
        if (open && employee?.id) {
            fetchPayrolls(employee.id);
            fetchActiveAdvance();
        }
    }, [open, employee, fetchPayrolls]);

    // Issue New Advance
    const handleIssueAdvance = async () => {
        if (!advAmount || Number(advAmount) <= 0) {
            return toast.error("Please enter a valid amount");
        }
        if (advType === "EMI" && (!advEmi || Number(advEmi) <= 0)) {
            return toast.error("Please enter a valid EMI amount");
        }

        setAdvanceLoading(true);
        try {
            if (activeAdvance) {
                toast.error("An active advance already exists! Please clear it first.");
                setAdvanceLoading(false);
                return;
            }

            const payload = {
                employee_id: employee.id,
                total_advance: Number(advAmount),
                remaining_amount: Number(advAmount),
                deduction_type: advType,
                emi_amount: advType === "EMI" ? Number(advEmi) : 0,
                status: "ACTIVE"
            };

            const { error } = await supabase.from("salary_advances" as any).insert(payload);
            if (error) throw error;

            toast.success("Advance Issued Successfully!");
            setAdvAmount("");
            setAdvEmi("");
            setAdvType("FULL");
            fetchActiveAdvance();
        } catch (err: any) {
            toast.error(err.message || "Failed to issue advance");
        } finally {
            setAdvanceLoading(false);
        }
    };

    const handleGenerate = async () => {
        if (!employee?.id) return;
        const success = await generatePayroll(employee.id, Number(month), Number(year));
        if (success) {
            fetchPayrolls(employee.id);
            fetchActiveAdvance();
        }
    };

    const handleApprove = async (payrollId: string) => {
        const success = await approvePayroll(payrollId);
        if (success) fetchPayrolls(employee?.id);
    };

    const handleMarkPaid = async (payrollId: string) => {
        const success = await markPayrollPaid(payrollId);
        if (success) fetchPayrolls(employee?.id);
    };

    const openPayslipView = (payroll: any) => {
        setSelectedPayslip(payroll);
        setViewPayslipOpen(true);
    };

    const handlePrint = () => {
        window.print();
    };

    const monthsList = [
        { value: "1", label: "January" }, { value: "2", label: "February" }, { value: "3", label: "March" },
        { value: "4", label: "April" }, { value: "5", label: "May" }, { value: "6", label: "June" },
        { value: "7", label: "July" }, { value: "8", label: "August" }, { value: "9", label: "September" },
        { value: "10", label: "October" }, { value: "11", label: "November" }, { value: "12", label: "December" },
    ];

    const yearsList = ["2024", "2025", "2026", "2027"];

    const getStatusBadge = (status: string) => {
        switch (status) {
            case "processed":
                return <Badge variant="secondary" className="bg-yellow-100 text-yellow-800 border-none">Processed</Badge>;
            case "approved":
                return <Badge variant="default" className="bg-blue-100 text-blue-800 border-none">Approved</Badge>;
            case "paid":
                return <Badge variant="outline" className="bg-green-100 text-green-800 border-none">Paid</Badge>;
            default:
                return <Badge variant="outline">{status}</Badge>;
        }
    };

    return (
        <>
            <Dialog open={open} onOpenChange={onOpenChange}>
                <DialogContent className="sm:max-w-[850px] max-h-[85vh] overflow-y-auto">
                    <DialogHeader>
                        <DialogTitle className="text-xl font-bold">
                            Payroll & Advances — {employee?.name}
                        </DialogTitle>
                    </DialogHeader>

                    <Tabs defaultValue="generate" className="w-full mt-4">
                        <TabsList className="grid w-full grid-cols-3 mb-4">
                            <TabsTrigger value="generate">Generate Manual</TabsTrigger>
                            <TabsTrigger value="history">History & Payslips</TabsTrigger>
                            <TabsTrigger value="advances">Manage Advances</TabsTrigger>
                        </TabsList>

                        <TabsContent value="generate" className="space-y-4">
                            <Card>
                                <CardHeader className="py-4"><CardTitle className="text-base font-semibold">Generate Single Payroll</CardTitle></CardHeader>
                                <CardContent className="flex flex-wrap items-end gap-4 py-4">
                                    <div className="flex-1 min-w-[150px] space-y-2">
                                        <label className="text-xs text-muted-foreground font-medium">Month</label>
                                        <Select value={month} onValueChange={setMonth}>
                                            <SelectTrigger><SelectValue placeholder="Select" /></SelectTrigger>
                                            <SelectContent>{monthsList.map(m => <SelectItem key={m.value} value={m.value}>{m.label}</SelectItem>)}</SelectContent>
                                        </Select>
                                    </div>
                                    <div className="flex-1 min-w-[150px] space-y-2">
                                        <label className="text-xs text-muted-foreground font-medium">Year</label>
                                        <Select value={year} onValueChange={setYear}>
                                            <SelectTrigger><SelectValue placeholder="Select" /></SelectTrigger>
                                            <SelectContent>{yearsList.map(y => <SelectItem key={y} value={y}>{y}</SelectItem>)}</SelectContent>
                                        </Select>
                                    </div>
                                    <Button onClick={handleGenerate} disabled={loading} className="px-6">
                                        {loading ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <RefreshCw className="h-4 w-4 mr-2" />}
                                        Run Calculation
                                    </Button>
                                </CardContent>
                            </Card>
                        </TabsContent>

                        <TabsContent value="history" className="space-y-4">
                            <div className="border rounded-md">
                                <Table>
                                    <TableHeader>
                                        <TableRow className="bg-muted/50">
                                            <TableHead>Period</TableHead>
                                            <TableHead>Gross</TableHead>
                                            <TableHead>Net</TableHead>
                                            <TableHead>Status</TableHead>
                                            <TableHead className="text-right">Actions</TableHead>
                                        </TableRow>
                                    </TableHeader>
                                    <TableBody>
                                        {payrolls.length === 0 ? (
                                            <TableRow><TableCell colSpan={5} className="text-center py-6 text-muted-foreground">No payroll history found.</TableCell></TableRow>
                                        ) : (
                                            payrolls.map((p: any) => (
                                                <TableRow key={p.id}>
                                                    <TableCell className="font-medium">{monthsList.find(m => m.value === String(p.payroll_month))?.label} {p.payroll_year}</TableCell>
                                                    <TableCell>₹{p.gross_salary}</TableCell>
                                                    <TableCell className="font-semibold text-green-600">₹{p.net_salary}</TableCell>
                                                    <TableCell>{getStatusBadge(p.payroll_status)}</TableCell>
                                                    <TableCell className="text-right">
                                                        <div className="flex justify-end gap-1.5">
                                                            {p.payroll_status === "processed" && (
                                                                <Button size="sm" variant="outline" className="h-8 border-green-200 text-green-700" onClick={() => handleApprove(p.id)}>
                                                                    <CheckCircle className="h-3.5 w-3.5 mr-1" /> Approve
                                                                </Button>
                                                            )}
                                                            {p.payroll_status === "approved" && (
                                                                <Button size="sm" variant="outline" className="h-8 border-blue-200 text-blue-700" onClick={() => handleMarkPaid(p.id)}>
                                                                    <CreditCard className="h-3.5 w-3.5 mr-1" /> Pay
                                                                </Button>
                                                            )}
                                                            <Button size="sm" variant="outline" className="h-8" onClick={() => openPayslipView(p)}><Eye className="h-3.5 w-3.5 mr-1" /> Slip</Button>
                                                        </div>
                                                    </TableCell>
                                                </TableRow>
                                            ))
                                        )}
                                    </TableBody>
                                </Table>
                            </div>
                        </TabsContent>

                        <TabsContent value="advances" className="space-y-4">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                {/* Current Status Card 
                                <Card className="bg-slate-50">
                                    <CardHeader className="py-4"><CardTitle className="text-base font-semibold">Active Advance Status</CardTitle></CardHeader>
                                    <CardContent>
                                        {activeAdvance ? (
                                            <div className="space-y-3">
                                                <div className="flex justify-between items-center pb-2 border-b">
                                                    <span className="text-sm text-muted-foreground">Total Taken:</span>
                                                    <span className="font-medium">₹{activeAdvance.total_advance}</span>
                                                </div>
                                                <div className="flex justify-between items-center pb-2 border-b">
                                                    <span className="text-sm text-muted-foreground">Remaining Balance:</span>
                                                    <span className="font-bold text-red-600">₹{activeAdvance.remaining_amount}</span>
                                                </div>
                                                <div className="flex justify-between items-center pb-2 border-b">
                                                    <span className="text-sm text-muted-foreground">Deduction Type:</span>
                                                    <Badge variant={activeAdvance.deduction_type === "EMI" ? "secondary" : "default"}>
                                                        {activeAdvance.deduction_type === "EMI" ? `EMI (₹${activeAdvance.emi_amount}/mo)` : "Full Deduction"}
                                                    </Badge>
                                                </div>
                                                <p className="text-xs text-muted-foreground mt-2">
                                                    * This amount will be automatically adjusted in the next payroll.
                                                </p>
                                            </div>
                                        ) : (
                                            <div className="py-6 text-center text-muted-foreground flex flex-col items-center">
                                                <Wallet className="h-10 w-10 text-slate-300 mb-2" />
                                                <p>No active advance records found.</p>
                                            </div>
                                        )}
                                    </CardContent>
                                </Card>

                                <Card>
                                    <CardHeader className="py-4"><CardTitle className="text-base font-semibold">Issue New Advance</CardTitle></CardHeader>
                                    <CardContent className="space-y-4">
                                        <div className="space-y-2">
                                            <Label className="text-xs">Advance Amount (₹)</Label>
                                            <Input 
                                                type="number" 
                                                placeholder="e.g. 5000" 
                                                value={advAmount} 
                                                onChange={(e) => setAdvAmount(e.target.value)}
                                                disabled={activeAdvance !== null}
                                            />
                                        </div>
                                        
                                        <div className="space-y-2">
                                            <Label className="text-xs">Deduction Method</Label>
                                            <Select value={advType} onValueChange={setAdvType} disabled={activeAdvance !== null}>
                                                <SelectTrigger><SelectValue placeholder="Select Type" /></SelectTrigger>
                                                <SelectContent>
                                                    <SelectItem value="FULL">Full Auto-Deduct (Next Salary)</SelectItem>
                                                    <SelectItem value="EMI">Monthly EMI</SelectItem>
                                                </SelectContent>
                                            </Select>
                                        </div>

                                        {advType === "EMI" && (
                                            <div className="space-y-2 animate-in fade-in zoom-in duration-200">
                                                <Label className="text-xs">Monthly EMI Amount (₹)</Label>
                                                <Input 
                                                    type="number" 
                                                    placeholder="e.g. 1000" 
                                                    value={advEmi} 
                                                    onChange={(e) => setAdvEmi(e.target.value)}
                                                    disabled={activeAdvance !== null}
                                                />
                                            </div>
                                        )}

                                        <Button 
                                            className="w-full mt-2" 
                                            onClick={handleIssueAdvance} 
                                            disabled={advanceLoading || activeAdvance !== null}
                                        >
                                            {advanceLoading ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <Wallet className="h-4 w-4 mr-2" />}
                                            {activeAdvance ? "Clear existing first" : "Issue Advance"}
                                        </Button>
                                    </CardContent>
                                </Card>
                            </div>
                        </TabsContent>
                    </Tabs>
                </DialogContent>
            </Dialog>

            <Dialog open={viewPayslipOpen} onOpenChange={setViewPayslipOpen}>
                <DialogContent className="sm:max-w-[650px] max-h-[85vh] overflow-y-auto">
                    <DialogHeader className="flex flex-row items-center justify-between border-b pb-4">
                        <DialogTitle className="text-lg font-bold">Employee Payslip</DialogTitle>
                        <Button size="sm" variant="outline" onClick={handlePrint} className="mr-6"><Printer className="h-4 w-4 mr-2" /> Print</Button>
                    </DialogHeader>

                    {selectedPayslip && (
                        <div className="p-4 space-y-6">
                            <div className="text-center border-b pb-4">
                                <h2 className="text-lg font-bold">REAL ESTATE CRM</h2>
                                <Badge className="mt-2" variant="secondary">Period: {monthsList.find(m => m.value === String(selectedPayslip.payroll_month))?.label} - {selectedPayslip.payroll_year}</Badge>
                            </div>
                            
                            <div className="space-y-2">
                                <div className="flex justify-between text-sm">
                                    <span>Gross Salary:</span>
                                    <span>₹{selectedPayslip.gross_salary}</span>
                                </div>
                                <div className="flex justify-between text-sm text-red-600">
                                    <span>Total Deductions (Leaves/PF):</span>
                                    <span>- ₹{selectedPayslip.total_deductions - (selectedPayslip.advance_deduction || 0)}</span>
                                </div>
                                
                                {selectedPayslip.advance_deduction > 0 && (
                                    <div className="flex justify-between text-sm text-orange-600 font-medium">
                                        <span>Advance Deduction (Recovered):</span>
                                        <span>- ₹{selectedPayslip.advance_deduction}</span>
                                    </div>
                                )}
                            </div>

                            <div className="bg-green-50 border border-green-200 p-4 rounded-xl flex justify-between items-center mt-4">
                                <div>
                                    <span className="text-xs text-green-800 font-bold">NET PAYABLE AMOUNT</span>
                                    <h2 className="text-xl font-bold text-green-700">₹{selectedPayslip.net_salary}</h2>
                                </div>
                            </div>
                        </div>
                    )}
                </DialogContent>
            </Dialog>
        </>
    );
}; */