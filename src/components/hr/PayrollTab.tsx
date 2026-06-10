// src/components/hr/PayrollTab.tsx
import React, { useEffect, useState, useMemo, useRef } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { usePayroll } from "@/hooks/hr/usePayroll";
import { useEmployees } from "@/hooks/hr/useEmployees";
import { useAdvances } from "@/hooks/hr/useAdvances";
// +++ Added CreditCard icon +++
import { CheckCircle, Download, Loader2, Edit, Zap, IndianRupee, PieChart, Banknote, ChevronLeft, ChevronRight, HandCoins, XCircle, CreditCard } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useReactToPrint } from "react-to-print";
import { PayslipTemplate } from "./PayslipTemplate";
import { toast } from "sonner";

export const PayrollTab = () => {
    const { payrolls, loading: payrollLoading, fetchPayrolls, generateBulkPayroll, updatePayroll, approvePayroll, markPayrollPaid } = usePayroll();
    const { employees } = useEmployees();
    const { advances, loading: advLoading, fetchAdvances, requestAdvance, updateStatus } = useAdvances();
    
    const currentDate = new Date();
    const [month, setMonth] = useState<string>(String(currentDate.getMonth() + 1));
    const [year, setYear] = useState<string>(String(currentDate.getFullYear()));
    
    // UI states
    const [activeTab, setActiveTab] = useState("processing");
    const [editModal, setEditModal] = useState(false);
    const [advanceModal, setAdvanceModal] = useState(false);
    
    // +++ NEW: Payment Modal State +++
    const [paymentModal, setPaymentModal] = useState(false);
    const [paymentDetails, setPaymentDetails] = useState({ mode: "Bank Transfer", reference: "", notes: "" });
    // +++ END +++

    const [selectedPayroll, setSelectedPayroll] = useState<any>(null);
    const [adjustments, setAdjustments] = useState({ leave_deduction: 0, net_salary: 0 });

    const [advanceForm, setAdvanceForm] = useState({ 
        employee_id: "", 
        amount: "", 
        reason: "",
        deduction_type: "FULL",
        emi_amount: ""
    });

    const printRef = useRef<HTMLDivElement>(null);
    const [printData, setPrintData] = useState<any>(null);
    const [printTrigger, setPrintTrigger] = useState(0);

    // Fetch data when month/year changes
    useEffect(() => { 
        fetchPayrolls(undefined, Number(month), Number(year)); 
        fetchAdvances(Number(month), Number(year));
    }, [month, year, fetchPayrolls, fetchAdvances]);

    const monthsList = [
        { value: "1", label: "January" }, { value: "2", label: "February" }, { value: "3", label: "March" },
        { value: "4", label: "April" }, { value: "5", label: "May" }, { value: "6", label: "June" },
        { value: "7", label: "July" }, { value: "8", label: "August" }, { value: "9", label: "September" },
        { value: "10", label: "October" }, { value: "11", label: "November" }, { value: "12", label: "December" },
    ];

    const yearsList = useMemo(() => Array.from({ length: 5 }, (_, i) => String(currentDate.getFullYear() - i)), []);

    const handlePrevMonth = () => {
        let m = parseInt(month); let y = parseInt(year);
        if (m === 1) { m = 12; y -= 1; } else { m -= 1; }
        setMonth(String(m)); setYear(String(y));
    };

    const handleNextMonth = () => {
        let m = parseInt(month); let y = parseInt(year);
        if (m === 12) { m = 1; y += 1; } else { m += 1; }
        setMonth(String(m)); setYear(String(y));
    };

    const metrics = useMemo(() => {
        let totalNet = 0; let totalDeduct = 0; let pending = 0;
        payrolls.forEach((p: any) => {
            totalNet += Number(p.net_salary || 0);
            totalDeduct += Number(p.total_deductions || 0);
            if (p.payroll_status === "processed") pending++;
        });
        return { totalNet, totalDeduct, totalCTC: totalNet + totalDeduct, pending, processed: payrolls.length };
    }, [payrolls]);

    const handleBulkRun = async () => {
        const activeEmps = employees.filter((e: any) => e.status === 'active');
        if (window.confirm(`Are you sure you want to run calculations for ${activeEmps.length} active employees for ${monthsList.find(m => m.value === month)?.label} ${year}?`)) {
            await generateBulkPayroll(activeEmps, Number(month), Number(year));
        }
    };

    const openEdit = (payroll: any) => {
        setSelectedPayroll(payroll);
        setAdjustments({ leave_deduction: payroll.leave_deduction, net_salary: payroll.net_salary });
        setEditModal(true);
    };

    const saveAdjustment = async () => {
        const success = await updatePayroll(selectedPayroll.id, { leave_deduction: adjustments.leave_deduction, net_salary: adjustments.net_salary });
        if (success) { setEditModal(false); fetchPayrolls(undefined, Number(month), Number(year)); }
    };

    // +++ NEW: Open Payment Modal +++
    const openPayment = (payroll: any) => {
        setSelectedPayroll(payroll);
        setPaymentDetails({ mode: "Bank Transfer", reference: "", notes: "" });
        setPaymentModal(true);
    };

    // +++ NEW: Process Final Payment +++
    const handleProcessPayment = async () => {
        if (!selectedPayroll) return;
        
        let remarks = `Paid via ${paymentDetails.mode}.`;
        if (paymentDetails.reference) remarks += ` Ref: ${paymentDetails.reference}.`;
        if (paymentDetails.notes) remarks += ` Note: ${paymentDetails.notes}.`;

        // Update the database with payment mode/reference in the remarks column
        await updatePayroll(selectedPayroll.id, { remarks });
        
        // Mark as paid
        const success = await markPayrollPaid(selectedPayroll.id);
        if (success) {
            setPaymentModal(false);
            fetchPayrolls(undefined, Number(month), Number(year));
        }
    };

    const handleAdvanceSubmit = async () => {
        if (!advanceForm.employee_id || !advanceForm.amount) return;

        if (advanceForm.deduction_type === "EMI" && (!advanceForm.emi_amount || Number(advanceForm.emi_amount) <= 0)) {
            toast.error("Please enter a valid EMI amount");
            return;
        }

        const success = await requestAdvance({
            employee_id: advanceForm.employee_id,
            amount: Number(advanceForm.amount),
            target_month: Number(month),
            target_year: Number(year),
            reason: advanceForm.reason,
            deduction_type: advanceForm.deduction_type,
            emi_amount: advanceForm.deduction_type === "EMI" ? Number(advanceForm.emi_amount) : 0,
            remaining_amount: Number(advanceForm.amount)
        } as any);

        if (success) {
            setAdvanceModal(false);
            setAdvanceForm({ employee_id: "", amount: "", reason: "", deduction_type: "FULL", emi_amount: "" });
            toast.success("Advance request submitted!");
        }
    };

    const handlePrintAction = useReactToPrint({
        contentRef: printRef,
        content: () => printRef.current,
        documentTitle: `Payslip_${printData?.employee?.name || 'Employee'}_${month}_${year}`,
    } as any);

    useEffect(() => {
        if (printTrigger > 0) {
            const timer = setTimeout(() => { if (printRef.current) handlePrintAction(); }, 300);
            return () => clearTimeout(timer);
        }
    }, [printTrigger]);

    const handleDownload = (payroll: any) => {
        setPrintData({ ...payroll, employee: payroll.employees });
        setPrintTrigger(prev => prev + 1);
    };

    const canEditPayroll = (createdAt: string) => {
        if (!createdAt) return true;
        const diffInDays = (new Date().getTime() - new Date(createdAt).getTime()) / (1000 * 60 * 60 * 24);
        return diffInDays <= 3;
    };

    return (
        <div className="space-y-6">
            
            {/* Top Period Selector */}
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 bg-white p-4 rounded-xl border shadow-sm">
                <div className="flex items-center gap-4">
                    <div className="p-2 bg-indigo-50 text-indigo-600 rounded-lg"><Banknote className="h-5 w-5" /></div>
                    <div>
                        <h2 className="text-lg font-bold text-slate-800">Payroll Management</h2>
                        <p className="text-sm text-slate-500">Manage monthly salaries and advances</p>
                    </div>
                </div>
                <div className="flex items-center bg-slate-50 p-1.5 rounded-lg border">
                    <Button variant="ghost" size="icon" className="h-8 w-8 text-slate-500" onClick={handlePrevMonth}><ChevronLeft className="h-4 w-4" /></Button>
                    <div className="flex items-center gap-2 px-2">
                        <Select value={month} onValueChange={setMonth}><SelectTrigger className="w-[120px] h-8 border-none bg-transparent shadow-none font-semibold text-slate-700"><SelectValue /></SelectTrigger><SelectContent>{monthsList.map(m => <SelectItem key={m.value} value={m.value}>{m.label}</SelectItem>)}</SelectContent></Select>
                        <Select value={year} onValueChange={setYear}><SelectTrigger className="w-[80px] h-8 border-none bg-transparent shadow-none font-semibold text-slate-700"><SelectValue /></SelectTrigger><SelectContent>{yearsList.map(y => <SelectItem key={y} value={y}>{y}</SelectItem>)}</SelectContent></Select>
                    </div>
                    <Button variant="ghost" size="icon" className="h-8 w-8 text-slate-500" onClick={handleNextMonth}><ChevronRight className="h-4 w-4" /></Button>
                </div>
            </div>

            <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full space-y-6">
                <TabsList className="grid w-[400px] grid-cols-2">
                    <TabsTrigger value="processing" className="font-semibold"><Zap className="h-4 w-4 mr-2" /> Payroll Processing</TabsTrigger>
                    <TabsTrigger value="advances" className="font-semibold"><HandCoins className="h-4 w-4 mr-2" /> Salary Advances</TabsTrigger>
                </TabsList>

                {/* TAB 1: PAYROLL PROCESSING */}
                <TabsContent value="processing" className="space-y-6">
                    {/* Metrics */}
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 w-full">
                        <Card className="border-0 shadow-sm bg-white"><CardContent className="p-5 flex items-center gap-4"><div className="p-3 bg-blue-50 rounded-lg text-blue-600"><Banknote className="h-5 w-5"/></div><div><p className="text-[10px] font-bold text-muted-foreground uppercase">Total Company CTC</p><h3 className="text-xl font-bold">₹{metrics.totalCTC.toLocaleString()}</h3></div></CardContent></Card>
                        <Card className="border-0 shadow-sm bg-white"><CardContent className="p-5 flex items-center gap-4"><div className="p-3 bg-red-50 rounded-lg text-red-600"><PieChart className="h-5 w-5"/></div><div><p className="text-[10px] font-bold text-muted-foreground uppercase">Total Deductions</p><h3 className="text-xl font-bold text-red-600">₹{metrics.totalDeduct.toLocaleString()}</h3></div></CardContent></Card>
                        <Card className="border-0 shadow-sm bg-white"><CardContent className="p-5 flex items-center gap-4"><div className="p-3 bg-emerald-50 rounded-lg text-emerald-600"><IndianRupee className="h-5 w-5"/></div><div><p className="text-[10px] font-bold text-muted-foreground uppercase">Total Net Payout</p><h3 className="text-xl font-bold text-emerald-600">₹{metrics.totalNet.toLocaleString()}</h3></div></CardContent></Card>
                        <Card className="border-0 shadow-sm bg-white"><CardContent className="p-5 flex items-center gap-4"><div className="p-3 bg-amber-50 rounded-lg text-amber-600"><CheckCircle className="h-5 w-5"/></div><div><p className="text-[10px] font-bold text-muted-foreground uppercase">Pending Approvals</p><h3 className="text-xl font-bold">{metrics.pending} / {metrics.processed}</h3></div></CardContent></Card>
                    </div>

                    <div className="flex justify-end">
                        <Button onClick={handleBulkRun} className="bg-indigo-600 hover:bg-indigo-700 text-white shadow-md">
                            <Zap className="h-4 w-4 mr-2" /> Run Calculation for All
                        </Button>
                    </div>

                    <Card className="border-0 shadow-sm rounded-xl overflow-hidden bg-white">
                        <CardContent className="p-0">
                            <Table>
                                <TableHeader className="bg-slate-50">
                                    <TableRow>
                                        <TableHead className="font-semibold text-slate-700">Employee Info</TableHead>
                                        <TableHead className="font-semibold text-slate-700">Gross</TableHead>
                                        <TableHead className="font-semibold text-slate-700 text-rose-600">Leave Penalty</TableHead>
                                        <TableHead className="font-semibold text-slate-700 text-rose-600">Advance Cut</TableHead>
                                        <TableHead className="font-semibold text-slate-700 text-emerald-600">Net Payable</TableHead>
                                        <TableHead className="font-semibold text-slate-700">Status</TableHead>
                                        <TableHead className="text-right font-semibold text-slate-700">Action</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {payrollLoading ? <TableRow><TableCell colSpan={7} className="h-40 text-center"><Loader2 className="h-6 w-6 animate-spin mx-auto text-muted-foreground" /></TableCell></TableRow> :
                                    payrolls.length === 0 ? <TableRow><TableCell colSpan={7} className="h-40 text-center text-muted-foreground">No payroll generated.</TableCell></TableRow> :
                                    payrolls.map((p: any) => (
                                        <TableRow key={p.id} className="hover:bg-slate-50/50">
                                            <TableCell>
                                                <div className="font-bold text-gray-900">{p.employees?.name}</div>
                                                <div className="text-xs font-medium text-slate-500">{p.employees?.employee_code}</div>
                                            </TableCell>
                                            <TableCell className="font-medium text-gray-700">₹{p.gross_salary}</TableCell>
                                            <TableCell className="text-red-500 font-medium">{p.leave_deduction > 0 ? `- ₹${p.leave_deduction}` : "—"}</TableCell>
                                            <TableCell className="text-red-500 font-medium">{p.advance_deduction > 0 ? `- ₹${p.advance_deduction}` : "—"}</TableCell>
                                            <TableCell className="font-bold text-emerald-600 text-base">₹{p.net_salary}</TableCell>
                                            <TableCell>
                                                {/* +++ UPDATED STATUS BADGES +++ */}
                                                {p.payroll_status === 'processed' && <Badge className="bg-amber-100 text-amber-700 border-none">Pending</Badge>}
                                                {p.payroll_status === 'approved' && <Badge className="bg-blue-100 text-blue-700 border-none">Approved</Badge>}
                                                {p.payroll_status === 'paid' && <Badge className="bg-emerald-100 text-emerald-700 border-none">Paid</Badge>}
                                            </TableCell>
                                            <TableCell className="text-right">
                                                <div className="flex justify-end gap-1.5">
                                                    {p.payroll_status === "processed" && (
                                                        <>
                                                            <Button size="icon" variant="ghost" className="h-8 w-8 text-orange-500" onClick={() => openEdit(p)} disabled={!canEditPayroll(p.created_at)}><Edit className="h-4 w-4" /></Button>
                                                            <Button size="sm" variant="outline" className="h-8 border-emerald-200 text-emerald-700" onClick={() => approvePayroll(p.id)}><CheckCircle className="h-4 w-4 mr-1" /> Approve</Button>
                                                        </>
                                                    )}
                                                    
                                                    {/* +++ NEW: 'Pay' Button shows up when approved +++ */}
                                                    {p.payroll_status === "approved" && (
                                                        <Button size="sm" variant="outline" className="h-8 border-blue-200 text-blue-700 hover:bg-blue-50" onClick={() => openPayment(p)}>
                                                            <CreditCard className="h-4 w-4 mr-1" /> Pay
                                                        </Button>
                                                    )}
                                                    
                                                    <Button size="sm" variant="secondary" className="h-8" onClick={() => handleDownload(p)} disabled={p.payroll_status === "processed"}><Download className="h-4 w-4 mr-1" /> Slip</Button>
                                                </div>
                                            </TableCell>
                                        </TableRow>
                                    ))}
                                </TableBody>
                            </Table>
                        </CardContent>
                    </Card>
                </TabsContent>

                {/* TAB 2: SALARY ADVANCES */}
                <TabsContent value="advances" className="space-y-6">
                    <div className="flex justify-between items-center bg-indigo-50 border border-indigo-100 rounded-xl p-4">
                        <div>
                            <h3 className="font-bold text-indigo-900">Manage Salary Advances</h3>
                            <p className="text-sm text-indigo-700">Approved advances will be auto-deducted from the targeted month's payroll.</p>
                        </div>
                        <Button className="bg-indigo-600 hover:bg-indigo-700" onClick={() => setAdvanceModal(true)}>
                            <HandCoins className="h-4 w-4 mr-2" /> Request Advance
                        </Button>
                    </div>

                    <Card className="border-0 shadow-sm rounded-xl overflow-hidden bg-white">
                        <CardContent className="p-0">
                            <Table>
                                <TableHeader className="bg-slate-50">
                                    <TableRow>
                                        <TableHead className="font-semibold text-slate-700">Employee</TableHead>
                                        <TableHead className="font-semibold text-slate-700">Requested Amount</TableHead>
                                        <TableHead className="font-semibold text-slate-700">Reason</TableHead>
                                        <TableHead className="font-semibold text-slate-700">Target Deduction</TableHead>
                                        <TableHead className="font-semibold text-slate-700">Status</TableHead>
                                        <TableHead className="text-right font-semibold text-slate-700">Action</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {advLoading ? <TableRow><TableCell colSpan={6} className="h-40 text-center"><Loader2 className="h-6 w-6 animate-spin mx-auto text-muted-foreground" /></TableCell></TableRow> :
                                    advances.length === 0 ? <TableRow><TableCell colSpan={6} className="h-40 text-center text-muted-foreground">No advance requests found.</TableCell></TableRow> :
                                    advances.map((adv: any) => (
                                        <TableRow key={adv.id}>
                                            <TableCell className="font-bold">{adv.employees?.name} <span className="text-xs text-muted-foreground block">{adv.employees?.employee_code}</span></TableCell>
                                            <TableCell className="font-bold text-orange-600">₹{adv.amount}</TableCell>
                                            <TableCell className="text-sm text-slate-600 max-w-[200px] truncate">{adv.reason || "N/A"}</TableCell>
                                            <TableCell className="font-medium">
                                                <div>{monthsList.find(m => m.value === String(adv.target_month))?.label} {adv.target_year}</div>
                                                <div className="text-xs text-muted-foreground mt-0.5">
                                                    {adv.deduction_type === 'EMI' ? `EMI: ₹${adv.emi_amount}/mo` : 'Full Deduct'}
                                                </div>
                                            </TableCell>
                                            <TableCell>
                                                {adv.status === 'approved' && <Badge className="bg-emerald-100 text-emerald-700 hover:bg-emerald-100 border-none">Approved</Badge>}
                                                {adv.status === 'rejected' && <Badge className="bg-rose-100 text-rose-700 hover:bg-rose-100 border-none">Rejected</Badge>}
                                                {adv.status === 'pending' && <Badge className="bg-amber-100 text-amber-700 hover:bg-amber-100 border-none">Pending</Badge>}
                                            </TableCell>
                                            <TableCell className="text-right">
                                                {adv.status === 'pending' && (
                                                    <div className="flex justify-end gap-2">
                                                        <Button size="sm" variant="outline" className="h-8 border-emerald-200 text-emerald-700 hover:bg-emerald-50" onClick={() => updateStatus(adv.id, "approved", Number(month), Number(year))}>
                                                            <CheckCircle className="h-4 w-4 mr-1" /> Approve
                                                        </Button>
                                                        <Button size="sm" variant="outline" className="h-8 border-rose-200 text-rose-700 hover:bg-rose-50" onClick={() => updateStatus(adv.id, "rejected", Number(month), Number(year))}>
                                                            <XCircle className="h-4 w-4 mr-1" /> Reject
                                                        </Button>
                                                    </div>
                                                )}
                                            </TableCell>
                                        </TableRow>
                                    ))}
                                </TableBody>
                            </Table>
                        </CardContent>
                    </Card>
                </TabsContent>
            </Tabs>

            {/* +++ NEW: Salary Payment processing Modal +++ */}
            <Dialog open={paymentModal} onOpenChange={setPaymentModal}>
                <DialogContent className="sm:max-w-[420px]">
                    <DialogHeader>
                        <DialogTitle>Process Salary Payment</DialogTitle>
                        <p className="text-sm text-muted-foreground">Record payout for {selectedPayroll?.employees?.name}</p>
                    </DialogHeader>
                    
                    <div className="space-y-5 py-4">
                        {/* Highlighted Payable Amount */}
                        <div className="bg-emerald-50 p-4 rounded-lg flex justify-between items-center border border-emerald-100">
                            <span className="text-emerald-800 font-medium">Net Payable</span>
                            <span className="text-2xl font-bold text-emerald-700">₹{selectedPayroll?.net_salary}</span>
                        </div>

                        <div className="space-y-2">
                            <Label>Payment Mode</Label>
                            <Select value={paymentDetails.mode} onValueChange={(v) => setPaymentDetails({...paymentDetails, mode: v})}>
                                <SelectTrigger><SelectValue placeholder="Select Mode" /></SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="Bank Transfer">Bank Transfer (NEFT/RTGS/IMPS)</SelectItem>
                                    <SelectItem value="UPI">UPI / Mobile Wallet</SelectItem>
                                    <SelectItem value="Cheque">Cheque</SelectItem>
                                    <SelectItem value="Cash">Cash</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>

                        {paymentDetails.mode !== "Cash" && (
                            <div className="space-y-2 animate-in fade-in zoom-in duration-200">
                                <Label>Reference / Transaction ID</Label>
                                <Input 
                                    placeholder="e.g. UTR / UPI Ref / Cheque No." 
                                    value={paymentDetails.reference} 
                                    onChange={(e) => setPaymentDetails({...paymentDetails, reference: e.target.value})} 
                                />
                            </div>
                        )}

                        <div className="space-y-2">
                            <Label>Internal Notes (Optional)</Label>
                            <Input 
                                placeholder="Any additional remarks..." 
                                value={paymentDetails.notes} 
                                onChange={(e) => setPaymentDetails({...paymentDetails, notes: e.target.value})} 
                            />
                        </div>
                    </div>
                    
                    <DialogFooter>
                        <Button variant="outline" onClick={() => setPaymentModal(false)}>Cancel</Button>
                        <Button className="bg-emerald-600 hover:bg-emerald-700 text-white" onClick={handleProcessPayment}>
                            Confirm Payment
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
            {/* +++ END +++ */}

            {/* Advance Request Modal */}
            <Dialog open={advanceModal} onOpenChange={setAdvanceModal}>
                <DialogContent className="sm:max-w-[420px]">
                    <DialogHeader>
                        <DialogTitle>Request Salary Advance</DialogTitle>
                    </DialogHeader>
                    <div className="space-y-4 py-4">
                        <div className="space-y-2">
                            <Label>Select Employee</Label>
                            <Select value={advanceForm.employee_id} onValueChange={(v) => setAdvanceForm({...advanceForm, employee_id: v})}>
                                <SelectTrigger><SelectValue placeholder="Choose employee" /></SelectTrigger>
                                <SelectContent>
                                    {employees.filter((e: any) => e.status === 'active').map((e: any) => (
                                        <SelectItem key={e.id} value={e.id}>{e.name} ({e.employee_code})</SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>
                        <div className="space-y-2">
                            <Label>Advance Amount (₹)</Label>
                            <Input type="number" value={advanceForm.amount} onChange={e => setAdvanceForm({...advanceForm, amount: e.target.value})} placeholder="e.g. 5000" />
                        </div>
                        
                        <div className="space-y-2">
                            <Label>Deduction Method</Label>
                            <Select value={advanceForm.deduction_type} onValueChange={(v) => setAdvanceForm({...advanceForm, deduction_type: v})}>
                                <SelectTrigger><SelectValue placeholder="Select Method" /></SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="FULL">Full Auto-Deduct</SelectItem>
                                    <SelectItem value="EMI">Monthly EMI</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>

                        {advanceForm.deduction_type === "EMI" && (
                            <div className="space-y-2 animate-in fade-in zoom-in duration-200">
                                <Label>Monthly EMI Amount (₹)</Label>
                                <Input type="number" value={advanceForm.emi_amount} onChange={e => setAdvanceForm({...advanceForm, emi_amount: e.target.value})} placeholder="e.g. 1000" />
                            </div>
                        )}

                        <div className="space-y-2">
                            <Label>Reason for Advance</Label>
                            <Textarea value={advanceForm.reason} onChange={e => setAdvanceForm({...advanceForm, reason: e.target.value})} placeholder="Briefly state the reason" className="resize-none" />
                        </div>
                        <div className="bg-blue-50 p-3 rounded text-sm text-blue-800 flex gap-2">
                            <Zap className="h-4 w-4 shrink-0 mt-0.5" />
                            <p>
                                {advanceForm.deduction_type === "EMI" 
                                    ? `An EMI of ₹${advanceForm.emi_amount || 0} will be deducted monthly starting from ` 
                                    : `This amount will be deducted automatically from the `}
                                <b>{monthsList.find(m => m.value === month)?.label} {year}</b> payroll.
                            </p>
                        </div>
                    </div>
                    <DialogFooter>
                        <Button variant="outline" onClick={() => setAdvanceModal(false)}>Cancel</Button>
                        <Button className="bg-indigo-600 hover:bg-indigo-700 text-white" onClick={handleAdvanceSubmit}>Submit Request</Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            {/* Existing Edit Modal */}
            <Dialog open={editModal} onOpenChange={setEditModal}>
                <DialogContent className="sm:max-w-[400px] rounded-xl overflow-hidden p-0">
                    <DialogHeader className="bg-slate-50 p-6 border-b">
                        <DialogTitle className="text-lg">Adjust Payroll Calculation</DialogTitle>
                        <p className="text-xs text-muted-foreground mt-1">{selectedPayroll?.employees?.name}</p>
                    </DialogHeader>
                    <div className="space-y-6 p-6">
                        <div className="space-y-2">
                            <Label className="text-slate-700">Leave Penalty Deduction (Waiver)</Label>
                            <Input type="number" className="h-10" value={adjustments.leave_deduction} onChange={e => {
                                const newLeaveDeduct = Number(e.target.value);
                                const diff = selectedPayroll.leave_deduction - newLeaveDeduct; 
                                setAdjustments({ leave_deduction: newLeaveDeduct, net_salary: selectedPayroll.net_salary + diff });
                            }} />
                            <p className="text-xs text-muted-foreground">Reduce this amount to waive off leave penalties.</p>
                        </div>
                        <div className="space-y-2">
                            <Label className="text-slate-700">Final Adjusted Net Payable</Label>
                            <Input type="number" value={adjustments.net_salary} onChange={e => setAdjustments({...adjustments, net_salary: Number(e.target.value)})} className="h-10 bg-emerald-50 border-emerald-200 text-emerald-700 font-bold text-lg" />
                        </div>
                    </div>
                    <DialogFooter className="p-4 border-t bg-slate-50">
                        <Button variant="outline" onClick={() => setEditModal(false)}>Cancel</Button>
                        <Button className="bg-indigo-600 hover:bg-indigo-700 text-white" onClick={saveAdjustment}>Update Payroll</Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            <div className="hidden">
                <div ref={printRef}>
                    {printData && <PayslipTemplate payroll={printData} employee={printData.employee} />}
                </div>
            </div>
        </div>
    );
};