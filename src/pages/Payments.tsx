import React, { useState, useEffect, useRef, useMemo } from "react";
import { MainLayout } from "@/components/layout/MainLayout";
import { Card, CardContent } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Progress } from "@/components/ui/progress";
import { useReactToPrint } from "react-to-print";
import { InvoiceTemplate } from "@/components/InvoiceTemplate";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Loader2, IndianRupee, History, PlusCircle, Printer, Download, CheckCircle2, Clock, AlertCircle, TrendingUp, Plus } from "lucide-react";

export default function Payments() {
    const [bookings, setBookings] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);

    // Modals
    const [paymentModalOpen, setPaymentModalOpen] = useState(false);
    const [historyModalOpen, setHistoryModalOpen] = useState(false);
    
    // Payment Form
    const [selectedBookingId, setSelectedBookingId] = useState<string>("");
    const [amount, setAmount] = useState("");
    const [mode, setMode] = useState("Bank Transfer");
    const [refNo, setRefNo] = useState("");
    const [processing, setProcessing] = useState(false);

    // Printing
    const invoiceRef = useRef<HTMLDivElement>(null);
    const [printPayment, setPrintPayment] = useState<any>(null); 
    const [selectedBookingForPrint, setSelectedBookingForPrint] = useState<any>(null);

    useEffect(() => {
        fetchBookings();
    }, []);

    const fetchBookings = async () => {
        setLoading(true);
        const { data, error } = await supabase
            .from('bookings')
            .select('*, customers(name, phone, email), properties(title)')
            .order('created_at', { ascending: false });

        if (!error && data) {
            setBookings(data);
        }
        setLoading(false);
    };

    // Dashboard Metrics Calculations
    const metrics = useMemo(() => {
        let totalCollected = 0;
        let totalPending = 0;
        
        bookings.forEach(b => {
            const total = Number(b.total_amount || 0);
            const paid = Number(b.paid_amount || 0);
            totalCollected += paid;
            if (total > paid) {
                totalPending += (total - paid);
            }
        });

        const collectionRate = (totalCollected + totalPending) > 0 
            ? ((totalCollected / (totalCollected + totalPending)) * 100).toFixed(1) 
            : "0.0";

        return { collected: totalCollected, pending: totalPending, overdue: 0, rate: collectionRate };
    }, [bookings]);

    // Monthly Target Calculations (Dummy Target: 5 Crore)
    const TARGET_AMOUNT = 50000000; 
    const targetProgress = Math.min((metrics.collected / TARGET_AMOUNT) * 100, 100);
    const remainingTarget = Math.max(TARGET_AMOUNT - metrics.collected, 0);

    const handlePrint = useReactToPrint({
        content: () => invoiceRef.current,
        documentTitle: "Payment_Receipt",
    } as any);

    const printReceipt = (booking: any, paymentInstance?: any) => {
        setSelectedBookingForPrint(booking);
        setPrintPayment(paymentInstance || null); 
        setTimeout(() => { handlePrint(); }, 100);
    };

    const openPaymentModal = (bookingId?: string) => {
        if (bookingId) {
            setSelectedBookingId(bookingId);
            const booking = bookings.find(b => b.id === bookingId);
            const due = Number(booking?.total_amount || 0) - Number(booking?.paid_amount || 0);
            setAmount(due > 0 ? String(due) : "");
        } else {
            setSelectedBookingId("");
            setAmount("");
        }
        setMode("Bank Transfer");
        setRefNo("");
        setPaymentModalOpen(true);
    };

    useEffect(() => {
        if (selectedBookingId) {
            const booking = bookings.find(b => b.id === selectedBookingId);
            const due = Number(booking?.total_amount || 0) - Number(booking?.paid_amount || 0);
            setAmount(due > 0 ? String(due) : "");
        }
    }, [selectedBookingId, bookings]);

    const submitPayment = async () => {
        if (!selectedBookingId) { toast.error("Please select a booking"); return; }
        if (!amount || Number(amount) <= 0) { toast.error("Please enter a valid amount"); return; }

        const booking = bookings.find(b => b.id === selectedBookingId);
        if (!booking) return;

        setProcessing(true);
        try {
            const existingHistory = booking.payment_history || [];
            const newPayment = {
                id: crypto.randomUUID(),
                amount: Number(amount),
                date: new Date().toISOString(),
                mode: mode,
                ref_no: refNo,
                invoice_no: `INV-${booking.id.substring(0, 4).toUpperCase()}-${existingHistory.length + 1}`
            };

            const updatedHistory = [...existingHistory, newPayment];
            const newTotalPaid = Number(booking.paid_amount || 0) + Number(amount);

            const { error } = await supabase
                .from('bookings')
                .update({ payment_history: updatedHistory, paid_amount: newTotalPaid } as any)
                .eq('id', booking.id);

            if (error) throw error;

            toast.success("Payment recorded successfully!");
            setPaymentModalOpen(false);
            fetchBookings(); 
            
            if (window.confirm("Do you want to print the receipt for this payment?")) {
                const updatedBooking = { ...booking, paid_amount: newTotalPaid, payment_history: updatedHistory };
                printReceipt(updatedBooking, newPayment);
            }
        } catch (err: any) {
            toast.error(err.message || "Failed to record payment");
        } finally {
            setProcessing(false);
        }
    };

    const daysLeftInMonth = () => {
        const today = new Date();
        const lastDay = new Date(today.getFullYear(), today.getMonth() + 1, 0);
        return lastDay.getDate() - today.getDate();
    };

    return (
        <MainLayout title="Payments & Collections" subtitle="Track payment milestones and collections">
            {/* Removed max-w restriction and adjusted padding to seamlessly fit MainLayout */}
            <div className="w-full space-y-6">

                {/* 1. TOP METRIC CARDS - FULL WIDTH */}
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4 w-full">
                    <Card className="shadow-sm border-0"><CardContent className="p-5 flex items-center gap-4">
                        <div className="p-3 bg-emerald-50 rounded-xl text-emerald-600"><CheckCircle2 className="h-6 w-6"/></div>
                        <div><p className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">Collected</p><h3 className="text-2xl font-bold">₹{metrics.collected.toLocaleString('en-IN')}</h3></div>
                    </CardContent></Card>
                    <Card className="shadow-sm border-0"><CardContent className="p-5 flex items-center gap-4">
                        <div className="p-3 bg-amber-50 rounded-xl text-amber-500"><Clock className="h-6 w-6"/></div>
                        <div><p className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">Pending</p><h3 className="text-2xl font-bold">₹{metrics.pending.toLocaleString('en-IN')}</h3></div>
                    </CardContent></Card>
                    <Card className="shadow-sm border-0"><CardContent className="p-5 flex items-center gap-4">
                        <div className="p-3 bg-rose-50 rounded-xl text-rose-500"><AlertCircle className="h-6 w-6"/></div>
                        <div><p className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">Overdue</p><h3 className="text-2xl font-bold">₹{metrics.overdue.toLocaleString('en-IN')}</h3></div>
                    </CardContent></Card>
                    <Card className="shadow-sm border-0"><CardContent className="p-5 flex items-center gap-4">
                        <div className="p-3 bg-blue-50 rounded-xl text-blue-600"><TrendingUp className="h-6 w-6"/></div>
                        <div><p className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">Collection Rate</p><h3 className="text-2xl font-bold">{metrics.rate}%</h3></div>
                    </CardContent></Card>
                </div>

                {/* 2. MONTHLY TARGET SECTION */}
                <Card className="shadow-sm border-0 w-full">
                    <CardContent className="p-6">
                        <h3 className="text-lg font-bold text-slate-800 mb-4">Monthly Collection Target</h3>
                        <div className="flex justify-between text-sm font-semibold mb-2">
                            <span className="text-slate-600">Target: ₹5 Cr</span>
                            <span className="text-slate-600">₹{metrics.collected.toLocaleString('en-IN')} collected ({targetProgress.toFixed(1)}%)</span>
                        </div>
                        <Progress value={targetProgress} className="h-3 bg-slate-100 mb-6" />
                        
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                            <div className="bg-[#Ecfdf5] p-5 rounded-xl text-center border border-emerald-100">
                                <h4 className="text-xl font-bold text-emerald-600 mb-1">₹{metrics.collected.toLocaleString('en-IN')}</h4>
                                <p className="text-xs font-semibold text-emerald-800 uppercase tracking-wider">Collected</p>
                            </div>
                            <div className="bg-[#fef9c3] p-5 rounded-xl text-center border border-yellow-200">
                                <h4 className="text-xl font-bold text-yellow-700 mb-1">₹{remainingTarget.toLocaleString('en-IN')}</h4>
                                <p className="text-xs font-semibold text-yellow-800 uppercase tracking-wider">Remaining</p>
                            </div>
                            <div className="bg-[#eff6ff] p-5 rounded-xl text-center border border-blue-100">
                                <h4 className="text-xl font-bold text-blue-600 mb-1">{daysLeftInMonth()}</h4>
                                <p className="text-xs font-semibold text-blue-800 uppercase tracking-wider">Days Left</p>
                            </div>
                        </div>
                    </CardContent>
                </Card>

                {/* 3. TOOLBAR & TABLE */}
                <div className="bg-white rounded-xl shadow-sm border border-slate-100 w-full">
                    <div className="p-4 border-b flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-white rounded-t-xl">
                        <Button variant="outline" className="text-slate-600 shadow-sm"><Download className="h-4 w-4 mr-2" /> Export Report</Button>
                        <Button className="bg-[#F97316] hover:bg-[#EA580C] text-white shadow-md font-semibold" onClick={() => openPaymentModal()}><Plus className="h-4 w-4 mr-2" /> Record Payment</Button>
                    </div>

                    <div className="overflow-x-auto w-full">
                        <Table className="w-full">
                            <TableHeader className="bg-slate-50 border-b">
                                <TableRow>
                                    <TableHead className="text-xs font-bold text-slate-500 uppercase tracking-wider py-4 whitespace-nowrap">Booking ID</TableHead>
                                    <TableHead className="text-xs font-bold text-slate-500 uppercase tracking-wider py-4 whitespace-nowrap">Customer</TableHead>
                                    <TableHead className="text-xs font-bold text-slate-500 uppercase tracking-wider py-4 min-w-[200px]">Property</TableHead>
                                    <TableHead className="text-xs font-bold text-slate-500 uppercase tracking-wider py-4 whitespace-nowrap">Deal Value</TableHead>
                                    <TableHead className="text-xs font-bold text-slate-500 uppercase tracking-wider py-4 whitespace-nowrap">Balance Due</TableHead>
                                    <TableHead className="text-xs font-bold text-slate-500 uppercase tracking-wider py-4 whitespace-nowrap">Status</TableHead>
                                    <TableHead className="text-xs font-bold text-slate-500 uppercase tracking-wider py-4 text-right whitespace-nowrap">Actions</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {loading ? <TableRow><TableCell colSpan={7} className="text-center py-10"><Loader2 className="h-6 w-6 animate-spin mx-auto text-muted-foreground"/></TableCell></TableRow> :
                                bookings.length === 0 ? <TableRow><TableCell colSpan={7} className="text-center py-10 text-slate-500">No bookings available.</TableCell></TableRow> :
                                bookings.map(b => {
                                    const total = Number(b.total_amount || 0);
                                    const paid = Number(b.paid_amount || 0);
                                    const due = total - paid;
                                    
                                    return (
                                        <TableRow key={b.id} className="hover:bg-slate-50/80 border-b border-slate-100">
                                            <TableCell className="font-mono text-sm font-semibold text-slate-700">{b.booking_code || b.id.substring(0,8).toUpperCase()}</TableCell>
                                            <TableCell>
                                                <p className="font-bold text-slate-800 whitespace-nowrap">{b.customers?.name}</p>
                                                <p className="text-xs text-slate-500">{b.customers?.phone}</p>
                                            </TableCell>
                                            <TableCell className="text-slate-600 font-medium">{b.properties?.title}</TableCell>
                                            <TableCell className="font-semibold text-slate-800 whitespace-nowrap">₹{total.toLocaleString('en-IN')}</TableCell>
                                            <TableCell className="text-rose-600 font-bold whitespace-nowrap">₹{due > 0 ? due.toLocaleString('en-IN') : 0}</TableCell>
                                            <TableCell>
                                                {due <= 0 ? <Badge className="bg-emerald-100 text-emerald-700 hover:bg-emerald-100 border-none">Paid</Badge> 
                                                : paid > 0 ? <Badge className="bg-amber-100 text-amber-700 hover:bg-amber-100 border-none">Partially Paid</Badge>
                                                : <Badge variant="outline" className="text-slate-500 bg-slate-50 border-slate-200">Unpaid</Badge>}
                                            </TableCell>
                                            <TableCell className="text-right">
                                                <div className="flex justify-end gap-2">
                                                    <Button size="sm" variant="ghost" className="text-slate-500 hover:text-indigo-600 hover:bg-indigo-50" onClick={() => { setSelectedBookingForPrint(b); setHistoryModalOpen(true); }}><History className="h-4 w-4 mr-1"/> History</Button>
                                                    {due > 0 && <Button size="sm" variant="ghost" className="text-emerald-600 hover:bg-emerald-50" onClick={() => openPaymentModal(b.id)}><PlusCircle className="h-4 w-4 mr-1"/> Collect</Button>}
                                                </div>
                                            </TableCell>
                                        </TableRow>
                                    );
                                })}
                            </TableBody>
                        </Table>
                    </div>
                </div>

                {/* MODALS remain unchanged */}
                <Dialog open={paymentModalOpen} onOpenChange={setPaymentModalOpen}>
                    <DialogContent className="sm:max-w-[450px] p-0 overflow-hidden rounded-xl">
                        <DialogHeader className="p-6 bg-slate-50 border-b">
                            <DialogTitle className="flex items-center gap-2 text-slate-800"><IndianRupee className="h-5 w-5 text-indigo-600"/> Record Collection</DialogTitle>
                        </DialogHeader>
                        <div className="p-6 space-y-5">
                            <div className="space-y-2">
                                <Label className="text-xs font-bold text-slate-600 uppercase">Select Booking to Collect</Label>
                                <Select value={selectedBookingId} onValueChange={setSelectedBookingId}>
                                    <SelectTrigger className="h-10"><SelectValue placeholder="Select Customer/Booking" /></SelectTrigger>
                                    <SelectContent>
                                        {bookings.filter(b => (Number(b.total_amount||0) - Number(b.paid_amount||0)) > 0).map(b => (
                                            <SelectItem key={b.id} value={b.id}>
                                                {b.customers?.name} — Due: ₹{(Number(b.total_amount||0) - Number(b.paid_amount||0)).toLocaleString('en-IN')}
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>

                            <div className="space-y-2">
                                <Label className="text-xs font-bold text-slate-600 uppercase">Amount Received (₹)</Label>
                                <Input type="number" value={amount} onChange={e => setAmount(e.target.value)} className="font-black text-xl h-12 text-emerald-700 bg-emerald-50 border-emerald-200" placeholder="0.00" />
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-2">
                                    <Label className="text-xs font-bold text-slate-600 uppercase">Payment Mode</Label>
                                    <Select value={mode} onValueChange={setMode}>
                                        <SelectTrigger className="h-10"><SelectValue/></SelectTrigger>
                                        <SelectContent><SelectItem value="Bank Transfer">NEFT / RTGS</SelectItem><SelectItem value="UPI">UPI</SelectItem><SelectItem value="Cheque">Cheque</SelectItem><SelectItem value="Cash">Cash</SelectItem></SelectContent>
                                    </Select>
                                </div>
                                <div className="space-y-2">
                                    <Label className="text-xs font-bold text-slate-600 uppercase">Reference ID</Label>
                                    <Input value={refNo} onChange={e => setRefNo(e.target.value)} className="h-10" placeholder="Txn ID" />
                                </div>
                            </div>
                        </div>
                        <DialogFooter className="p-4 bg-slate-50 border-t">
                            <Button variant="outline" onClick={() => setPaymentModalOpen(false)}>Cancel</Button>
                            <Button onClick={submitPayment} disabled={processing} className="bg-[#F97316] hover:bg-[#EA580C] text-white">
                                {processing ? <Loader2 className="h-4 w-4 mr-2 animate-spin"/> : null} Confirm Receipt
                            </Button>
                        </DialogFooter>
                    </DialogContent>
                </Dialog>

                <Dialog open={historyModalOpen} onOpenChange={setHistoryModalOpen}>
                    <DialogContent className="sm:max-w-[600px] p-0 overflow-hidden rounded-xl">
                        <DialogHeader className="p-6 bg-slate-50 border-b">
                            <DialogTitle className="text-slate-800">Payment Timeline — {selectedBookingForPrint?.customers?.name}</DialogTitle>
                        </DialogHeader>
                        <div className="p-6 max-h-[60vh] overflow-y-auto">
                            {!selectedBookingForPrint?.payment_history || selectedBookingForPrint.payment_history.length === 0 ? (
                                <p className="text-center text-muted-foreground py-10 border border-dashed rounded-lg">No payments recorded yet.</p>
                            ) : (
                                <div className="space-y-3">
                                    {selectedBookingForPrint.payment_history.map((pay: any, idx: number) => (
                                        <div key={idx} className="flex justify-between items-center p-4 border rounded-xl hover:shadow-sm bg-white transition-all">
                                            <div>
                                                <p className="font-bold text-emerald-600 text-lg">₹ {pay.amount.toLocaleString('en-IN')}</p>
                                                <p className="text-xs font-medium text-slate-500 mt-1">{new Date(pay.date).toLocaleDateString('en-IN', {day:'numeric', month:'short', year:'numeric', hour:'2-digit', minute:'2-digit'})} • {pay.mode}</p>
                                                {pay.ref_no && <p className="text-[10px] text-slate-400 font-mono mt-1">Ref: {pay.ref_no}</p>}
                                            </div>
                                            <Button size="sm" variant="outline" onClick={() => printReceipt(selectedBookingForPrint, pay)} className="border-indigo-200 text-indigo-700 hover:bg-indigo-50">
                                                <Printer className="h-4 w-4 mr-2"/> Print Receipt
                                            </Button>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                    </DialogContent>
                </Dialog>

                <div className="hidden">
                    <InvoiceTemplate ref={invoiceRef} booking={selectedBookingForPrint} currentPayment={printPayment} />
                </div>
            </div>
        </MainLayout>
    );
}