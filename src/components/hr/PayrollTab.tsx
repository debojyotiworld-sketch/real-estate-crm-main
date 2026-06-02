import React, { useEffect, useState, useMemo, useRef } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { usePayroll } from "@/hooks/hr/usePayroll";
import { useEmployees } from "@/hooks/hr/useEmployees";
import { CheckCircle, Download, Loader2, Edit, Zap, IndianRupee, PieChart, Banknote, ChevronLeft, ChevronRight } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useReactToPrint } from "react-to-print";
import { PayslipTemplate } from "./PayslipTemplate";

export const PayrollTab = () => {
    const { payrolls, loading, fetchPayrolls, generateBulkPayroll, updatePayroll, approvePayroll } = usePayroll();
    const { employees } = useEmployees();
    
    const currentDate = new Date();
    const [month, setMonth] = useState<string>(String(currentDate.getMonth() + 1));
    const [year, setYear] = useState<string>(String(currentDate.getFullYear()));
    
    const [editModal, setEditModal] = useState(false);
    const [selectedPayroll, setSelectedPayroll] = useState<any>(null);
    const [adjustments, setAdjustments] = useState({ leave_deduction: 0, net_salary: 0 });

    const printRef = useRef<HTMLDivElement>(null);
    const [printData, setPrintData] = useState<any>(null);
    const [printTrigger, setPrintTrigger] = useState(0);

    useEffect(() => { 
        fetchPayrolls(undefined, Number(month), Number(year)); 
    }, [month, year, fetchPayrolls]);

    const monthsList = [
        { value: "1", label: "January" }, { value: "2", label: "February" }, { value: "3", label: "March" },
        { value: "4", label: "April" }, { value: "5", label: "May" }, { value: "6", label: "June" },
        { value: "7", label: "July" }, { value: "8", label: "August" }, { value: "9", label: "September" },
        { value: "10", label: "October" }, { value: "11", label: "November" }, { value: "12", label: "December" },
    ];

    const yearsList = useMemo(() => {
        const currentY = new Date().getFullYear();
        return Array.from({ length: 5 }, (_, i) => String(currentY - i));
    }, []);

    const handlePrevMonth = () => {
        let m = parseInt(month);
        let y = parseInt(year);
        if (m === 1) { m = 12; y -= 1; } else { m -= 1; }
        setMonth(String(m));
        setYear(String(y));
    };

    const handleNextMonth = () => {
        let m = parseInt(month);
        let y = parseInt(year);
        if (m === 12) { m = 1; y += 1; } else { m += 1; }
        setMonth(String(m));
        setYear(String(y));
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
        if (success) { 
            setEditModal(false); 
            fetchPayrolls(undefined, Number(month), Number(year)); 
        }
    };

    const handlePrintAction = useReactToPrint({
        contentRef: printRef,
        content: () => printRef.current,
        documentTitle: `Payslip_${printData?.employee?.name || 'Employee'}_${monthsList.find(m => m.value === month)?.label}_${year}`,
        pageStyle: "@page { size: auto; margin: 0mm; } @media print { body { -webkit-print-color-adjust: exact; } }",
    } as any);

    useEffect(() => {
        if (printTrigger > 0) {
            const timer = setTimeout(() => {
                if (printRef.current) {
                    handlePrintAction();
                }
            }, 300);
            return () => clearTimeout(timer);
        }
    }, [printTrigger]);

    const handleDownload = (payroll: any) => {
        const formattedPayroll = {
            ...payroll,
            employee: payroll.employees
        };
        
        setPrintData(formattedPayroll);
        setPrintTrigger(prev => prev + 1);
    };

    // ৩ দিনের এডিট লজিক চেক করার জন্য হেল্পার ফাংশন
    const canEditPayroll = (createdAt: string) => {
        if (!createdAt) return true;
        const generateDate = new Date(createdAt);
        const today = new Date();
        const diffInMs = today.getTime() - generateDate.getTime();
        const diffInDays = diffInMs / (1000 * 60 * 60 * 24);
        return diffInDays <= 3; // ৩ দিন বা তার কম হলে true রিটার্ন করবে
    };

    return (
        <div className="space-y-6">
            
            {/* Dashboard Cards */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 w-full">
                <Card className="border-0 shadow-sm bg-white"><CardContent className="p-5 flex items-center gap-4">
                    <div className="p-3 bg-blue-50 rounded-lg text-blue-600"><Banknote className="h-5 w-5"/></div>
                    <div><p className="text-[10px] font-bold text-muted-foreground uppercase">Total Company CTC</p><h3 className="text-xl font-bold">₹{metrics.totalCTC.toLocaleString()}</h3></div>
                </CardContent></Card>
                <Card className="border-0 shadow-sm bg-white"><CardContent className="p-5 flex items-center gap-4">
                    <div className="p-3 bg-red-50 rounded-lg text-red-600"><PieChart className="h-5 w-5"/></div>
                    <div><p className="text-[10px] font-bold text-muted-foreground uppercase">Total Deductions</p><h3 className="text-xl font-bold text-red-600">₹{metrics.totalDeduct.toLocaleString()}</h3></div>
                </CardContent></Card>
                <Card className="border-0 shadow-sm bg-white"><CardContent className="p-5 flex items-center gap-4">
                    <div className="p-3 bg-emerald-50 rounded-lg text-emerald-600"><IndianRupee className="h-5 w-5"/></div>
                    <div><p className="text-[10px] font-bold text-muted-foreground uppercase">Total Net Payout</p><h3 className="text-xl font-bold text-emerald-600">₹{metrics.totalNet.toLocaleString()}</h3></div>
                </CardContent></Card>
                <Card className="border-0 shadow-sm bg-white"><CardContent className="p-5 flex items-center gap-4">
                    <div className="p-3 bg-amber-50 rounded-lg text-amber-600"><CheckCircle className="h-5 w-5"/></div>
                    <div><p className="text-[10px] font-bold text-muted-foreground uppercase">Pending Approvals</p><h3 className="text-xl font-bold">{metrics.pending} / {metrics.processed}</h3></div>
                </CardContent></Card>
            </div>

            {/* Top Controls */}
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                <div className="flex items-center bg-white p-1.5 rounded-xl border shadow-sm">
                    <Button variant="ghost" size="icon" className="h-8 w-8 text-slate-500 hover:text-slate-900" onClick={handlePrevMonth}><ChevronLeft className="h-4 w-4" /></Button>
                    <div className="flex items-center gap-2 px-2">
                        <Select value={month} onValueChange={setMonth}><SelectTrigger className="w-[130px] h-8 border-none shadow-none font-medium text-slate-700 bg-slate-50/50"><SelectValue /></SelectTrigger><SelectContent>{monthsList.map(m => <SelectItem key={m.value} value={m.value}>{m.label}</SelectItem>)}</SelectContent></Select>
                        <Select value={year} onValueChange={setYear}><SelectTrigger className="w-[85px] h-8 border-none shadow-none font-medium text-slate-700 bg-slate-50/50"><SelectValue /></SelectTrigger><SelectContent>{yearsList.map(y => <SelectItem key={y} value={y}>{y}</SelectItem>)}</SelectContent></Select>
                    </div>
                    <Button variant="ghost" size="icon" className="h-8 w-8 text-slate-500 hover:text-slate-900" onClick={handleNextMonth}><ChevronRight className="h-4 w-4" /></Button>
                </div>
                <Button onClick={handleBulkRun} className="bg-indigo-600 hover:bg-indigo-700 text-white shadow-md">
                    <Zap className="h-4 w-4 mr-2" /> Run Company Payroll
                </Button>
            </div>

            {/* Data Table */}
            <Card className="border-0 shadow-sm rounded-xl overflow-hidden bg-white">
                <CardContent className="p-0">
                    <Table>
                        <TableHeader className="bg-slate-50">
                            <TableRow>
                                <TableHead className="font-semibold text-slate-700">Employee Info</TableHead>
                                <TableHead className="font-semibold text-slate-700">Calculated Gross</TableHead>
                                <TableHead className="font-semibold text-slate-700">Leave Penalty</TableHead>
                                <TableHead className="font-semibold text-slate-700">Net Payable</TableHead>
                                <TableHead className="font-semibold text-slate-700">Status</TableHead>
                                <TableHead className="text-right font-semibold text-slate-700">Action</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {loading ? <TableRow><TableCell colSpan={6} className="h-40 text-center"><Loader2 className="h-6 w-6 animate-spin mx-auto text-muted-foreground" /></TableCell></TableRow> :
                            payrolls.length === 0 ? <TableRow><TableCell colSpan={6} className="h-40 text-center text-muted-foreground">No payroll generated for {monthsList.find(m => m.value === month)?.label} {year}.</TableCell></TableRow> :
                            payrolls.map((p: any) => (
                                <TableRow key={p.id} className="hover:bg-slate-50/50 transition-colors">
                                    <TableCell>
                                        <div className="font-bold text-gray-900">{p.employees?.name}</div>
                                        <div className="text-xs font-medium text-slate-500">{p.employees?.employee_code} • {p.employees?.department}</div>
                                    </TableCell>
                                    <TableCell className="font-medium text-gray-700">₹{p.gross_salary}</TableCell>
                                    <TableCell className="text-red-500 font-medium">{p.leave_deduction > 0 ? `- ₹${p.leave_deduction}` : "—"}</TableCell>
                                    <TableCell className="font-bold text-emerald-600 text-base">₹{p.net_salary}</TableCell>
                                    <TableCell>
                                        {p.payroll_status === 'processed' 
                                            ? <Badge className="bg-amber-100 text-amber-700 border-none px-2.5 py-0.5 shadow-none hover:bg-amber-100">Draft / Pending</Badge> 
                                            : <Badge className="bg-blue-100 text-blue-700 border-none px-2.5 py-0.5 shadow-none hover:bg-blue-100">Approved</Badge>}
                                    </TableCell>
                                    <TableCell className="text-right">
                                        <div className="flex justify-end gap-1.5">
                                            {p.payroll_status === "processed" && (
                                                <>
                                                    {/* এডিট বাটন - ৩ দিনের লজিক অ্যাড করা হলো */}
                                                    <Button 
                                                        size="icon" 
                                                        variant="ghost" 
                                                        className="h-8 w-8 text-orange-500 hover:bg-orange-50 disabled:opacity-30 disabled:hover:bg-transparent" 
                                                        onClick={() => openEdit(p)} 
                                                        title={canEditPayroll(p.created_at) ? "Adjust Leaves" : "Edit time expired (3 days passed)"}
                                                        disabled={!canEditPayroll(p.created_at)}
                                                    >
                                                        <Edit className="h-4 w-4" />
                                                    </Button>
                                                    <Button size="sm" variant="outline" className="h-8 border-emerald-200 text-emerald-700 hover:bg-emerald-50 shadow-sm" onClick={() => approvePayroll(p.id)}>
                                                        <CheckCircle className="h-4 w-4 mr-1" /> Approve
                                                    </Button>
                                                </>
                                            )}
                                            
                                            {/* ডাউনলোড স্লিপ বাটন - Approve না হওয়া পর্যন্ত disabled থাকবে */}
                                            <Button 
                                                size="sm" 
                                                variant="secondary" 
                                                className="h-8 bg-slate-100 hover:bg-slate-200 text-slate-700 shadow-sm disabled:opacity-40 disabled:cursor-not-allowed" 
                                                onClick={() => handleDownload(p)} 
                                                title={p.payroll_status === "processed" ? "Approve the payroll first to download slip" : "Download Payslip PDF"}
                                                disabled={p.payroll_status === "processed"} // 'processed' মানে পেন্ডিং, তাই disabled
                                            >
                                                <Download className="h-4 w-4 mr-1" /> Slip
                                            </Button>
                                        </div>
                                    </TableCell>
                                </TableRow>
                            ))}
                        </TableBody>
                    </Table>
                </CardContent>
            </Card>

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
                    {printData && (
                        <PayslipTemplate 
                            payroll={printData} 
                            employee={printData.employee} 
                        />
                    )}
                </div>
            </div>

        </div>
    );
};