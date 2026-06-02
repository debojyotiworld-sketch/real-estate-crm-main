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
import { Textarea } from "@/components/ui/textarea";
import { useReactToPrint } from "react-to-print";
import { InvoiceTemplate } from "@/components/InvoiceTemplate";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { 
    Loader2, IndianRupee, History, PlusCircle, Printer, 
    Download, CheckCircle2, Clock, AlertCircle, TrendingUp, Plus, Receipt, Info
} from "lucide-react";

export default function Payments() {
    const [bookings, setBookings] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);

    const [paymentModalOpen, setPaymentModalOpen] = useState(false);
    const [historyModalOpen, setHistoryModalOpen] = useState(false);
    
    const [selectedBookingId, setSelectedBookingId] = useState<string>("");
    const [amount, setAmount] = useState("");
    const [mode, setMode] = useState("Bank Transfer");
    const [refNo, setRefNo] = useState("");
    const [paymentDate, setPaymentDate] = useState(new Date().toISOString().split("T")[0]);
    const [remarks, setRemarks] = useState("");
    const [processing, setProcessing] = useState(false);

    const invoiceRef = useRef<HTMLDivElement>(null);
    const [printPayment, setPrintPayment] = useState<any>(null); 
    const [selectedBookingForPrint, setSelectedBookingForPrint] = useState<any>(null);

    useEffect(() => { fetchBookings(); }, []);

    const fetchBookings = async () => {
        setLoading(true);
        try {
            // Relational Query using correct schema names (full_name, payment_date, payment_mode, notes)
            const { data, error } = await supabase
                .from('bookings')
                .select(`
                    *, 
                    customers(full_name, phone, email), 
                    properties(title),
                    payments(id, amount, payment_date, payment_mode, payment_type, status, notes)
                `)
                .order('created_at', { ascending: false });

            if (error) {
                console.error("Supabase Error:", error);
                throw error;
            }
            if (data) setBookings(data);
        } catch (error: any) {
            toast.error("Failed to fetch payments data");
        } finally {
            setLoading(false);
        }
    };

    // Calculate dynamic dues
    const calculateDue = (booking: any) => {
        const total = Number(booking.total_amount || 0);
        const paid = booking.payments?.reduce((sum: number, p: any) => sum + Number(p.amount), 0) || 0;
        return { total, paid, due: total - paid };
    };

    const metrics = useMemo(() => {
        let totalCollected = 0; let totalPending = 0;
        bookings.forEach(b => {
            const { paid, due } = calculateDue(b);
            totalCollected += paid;
            if (due > 0) totalPending += due;
        });
        const collectionRate = (totalCollected + totalPending) > 0 ? ((totalCollected / (totalCollected + totalPending)) * 100).toFixed(1) : "0.0";
        return { collected: totalCollected, pending: totalPending, overdue: 0, rate: collectionRate };
    }, [bookings]);

    const TARGET_AMOUNT = 50000000; 
    const targetProgress = Math.min((metrics.collected / TARGET_AMOUNT) * 100, 100);
    const remainingTarget = Math.max(TARGET_AMOUNT - metrics.collected, 0);
    const daysLeftInMonth = () => {
        const today = new Date();
        const lastDay = new Date(today.getFullYear(), today.getMonth() + 1, 0);
        return lastDay.getDate() - today.getDate();
    };

    const handlePrint = useReactToPrint({ contentRef: invoiceRef, documentTitle: "Payment_Receipt" });

    const printReceipt = (booking: any, paymentInstance?: any) => {
        const { paid } = calculateDue(booking);
        const bookingWithDerivedPaid = { ...booking, paid_amount: paid };
        setSelectedBookingForPrint(bookingWithDerivedPaid);
        setPrintPayment(paymentInstance || null); 
        setTimeout(() => { handlePrint(); }, 150);
    };

    const openPaymentModal = (bookingId?: string) => {
        if (bookingId) {
            setSelectedBookingId(bookingId);
            const booking = bookings.find(b => b.id === bookingId);
            const { due } = calculateDue(booking);
            setAmount(due > 0 ? String(due) : "");
        } else {
            setSelectedBookingId(""); setAmount("");
        }
        setMode("Bank Transfer"); 
        setRefNo(""); setRemarks("");
        setPaymentDate(new Date().toISOString().split("T")[0]);
        setPaymentModalOpen(true);
    };

    const submitPayment = async () => {
        if (!selectedBookingId) { toast.error("Please select a booking"); return; }
        if (!amount || Number(amount) <= 0) { toast.error("Please enter a valid amount"); return; }

        const booking = bookings.find(b => b.id === selectedBookingId);
        if (!booking) return;

        setProcessing(true);
        try {
            const existingPaymentsCount = booking.payments?.length || 0;
            const receiptNo = `INV-${booking.booking_code || booking.id.substring(0, 6).toUpperCase()}-${existingPaymentsCount + 1}`;
            
            // Insert strictly matching 'types.ts' payments schema
            const newPayment = {
                booking_id: booking.id,
                amount: Number(amount),
                payment_date: paymentDate ? new Date(paymentDate).toISOString() : new Date().toISOString(),
                payment_mode: mode,
                payment_type: "Ledger Entry",
                status: "Completed",
                notes: `Ref: ${refNo || 'N/A'} | Invoice: ${receiptNo} | Remarks: ${remarks}`
            };

            const { error: insertError } = await supabase.from('payments').insert(newPayment as any);
            if (insertError) throw insertError;

            toast.success("Payment recorded successfully!");
            setPaymentModalOpen(false);
            
            fetchBookings(); 
            
            if (window.confirm("Do you want to print the receipt now?")) {
                const { paid } = calculateDue(booking);
                const updatedBookingForPrint = { ...booking, paid_amount: paid + Number(amount) };
                printReceipt(updatedBookingForPrint, newPayment);
            }
        } catch (err: any) {
            toast.error(err.message || "Failed to record payment");
        } finally {
            setProcessing(false);
        }
    };

    const openHistory = (booking: any) => {
        setSelectedBookingForPrint(booking);
        setHistoryModalOpen(true);
    };

    const selectedBooking = useMemo(() => bookings.find(b => b.id === selectedBookingId), [selectedBookingId, bookings]);
    const activeDue = selectedBooking ? calculateDue(selectedBooking) : { total: 0, paid: 0, due: 0 };

    return (
        <MainLayout title="Payments & Collections" subtitle="Manage and track all payment transactions. Dynamic banking-style ledger, target metrics, and real-time tracking.">
            <div className="w-full space-y-6 animate-in fade-in duration-500">

                <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4 w-full">
                    <Card className="shadow-sm border border-slate-200/60 bg-white"><CardContent className="p-5 flex items-center gap-4">
                        <div className="p-3 bg-emerald-50 rounded-xl text-emerald-600"><CheckCircle2 className="h-6 w-6"/></div>
                        <div><p className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">Total Collected</p><h3 className="text-2xl font-black text-slate-800">₹{metrics.collected.toLocaleString('en-IN')}</h3></div>
                    </CardContent></Card>
                    <Card className="shadow-sm border border-slate-200/60 bg-white"><CardContent className="p-5 flex items-center gap-4">
                        <div className="p-3 bg-amber-50 rounded-xl text-amber-500"><Clock className="h-6 w-6"/></div>
                        <div><p className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">Total Pending</p><h3 className="text-2xl font-black text-slate-800">₹{metrics.pending.toLocaleString('en-IN')}</h3></div>
                    </CardContent></Card>
                    <Card className="shadow-sm border border-slate-200/60 bg-white"><CardContent className="p-5 flex items-center gap-4">
                        <div className="p-3 bg-rose-50 rounded-xl text-rose-500"><AlertCircle className="h-6 w-6"/></div>
                        <div><p className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">Overdue Dues</p><h3 className="text-2xl font-black text-slate-800">₹{metrics.overdue.toLocaleString('en-IN')}</h3></div>
                    </CardContent></Card>
                    <Card className="shadow-sm border border-slate-200/60 bg-white"><CardContent className="p-5 flex items-center gap-4">
                        <div className="p-3 bg-indigo-50 rounded-xl text-indigo-600"><TrendingUp className="h-6 w-6"/></div>
                        <div><p className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">Collection Rate</p><h3 className="text-2xl font-black text-slate-800">{metrics.rate}%</h3></div>
                    </CardContent></Card>
                </div>

                <Card className="shadow-sm border border-slate-200/60 w-full bg-white">
                    <CardContent className="p-6">
                        <h3 className="text-lg font-bold text-slate-800 mb-4">Monthly Collection Target</h3>
                        <div className="flex justify-between text-sm font-semibold mb-2">
                            <span className="text-slate-600">Target: ₹5 Cr</span>
                            <span className="text-indigo-700">₹{metrics.collected.toLocaleString('en-IN')} collected ({targetProgress.toFixed(1)}%)</span>
                        </div>
                        <Progress value={targetProgress} className="h-3 bg-indigo-50 [&>div]:bg-indigo-600 mb-6" />
                        
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                            <div className="bg-emerald-50/50 p-5 rounded-xl text-center border border-emerald-100">
                                <h4 className="text-xl font-black text-emerald-600 mb-1">₹{metrics.collected.toLocaleString('en-IN')}</h4>
                                <p className="text-xs font-bold text-emerald-800 uppercase tracking-wider">Collected</p>
                            </div>
                            <div className="bg-amber-50/50 p-5 rounded-xl text-center border border-amber-200">
                                <h4 className="text-xl font-black text-amber-700 mb-1">₹{remainingTarget.toLocaleString('en-IN')}</h4>
                                <p className="text-xs font-bold text-amber-800 uppercase tracking-wider">Remaining</p>
                            </div>
                            <div className="bg-indigo-50/50 p-5 rounded-xl text-center border border-indigo-100">
                                <h4 className="text-xl font-black text-indigo-600 mb-1">{daysLeftInMonth()}</h4>
                                <p className="text-xs font-bold text-indigo-800 uppercase tracking-wider">Days Left</p>
                            </div>
                        </div>
                    </CardContent>
                </Card>

                <Card className="shadow-sm border border-slate-200/60 w-full bg-white overflow-hidden">
                    <div className="p-4 border-b flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-slate-50/50">
                        <div className="flex items-center gap-2">
                            <Receipt className="h-5 w-5 text-slate-500" />
                            <h3 className="font-bold text-slate-700">Accounts Receivables Ledger</h3>
                        </div>
                        <div className="flex items-center gap-3 w-full sm:w-auto">
                            <Button variant="outline" className="w-full sm:w-auto border-slate-200 text-slate-600 hover:bg-slate-100"><Download className="h-4 w-4 mr-2" /> Export</Button>
                            <Button className="w-full sm:w-auto bg-indigo-600 hover:bg-indigo-700 text-white font-semibold shadow-md" onClick={() => openPaymentModal()}>
                                <Plus className="h-4 w-4 mr-2" /> Record Payment
                            </Button>
                        </div>
                    </div>

                    <div className="overflow-x-auto w-full">
                        <Table className="w-full">
                            <TableHeader className="bg-white border-b">
                                <TableRow>
                                    <TableHead className="text-xs font-bold text-slate-500 uppercase tracking-wider py-4 whitespace-nowrap">Booking Code</TableHead>
                                    <TableHead className="text-xs font-bold text-slate-500 uppercase tracking-wider py-4 min-w-[200px]">Client / Property</TableHead>
                                    <TableHead className="text-xs font-bold text-slate-500 uppercase tracking-wider py-4 whitespace-nowrap">Total Deal</TableHead>
                                    <TableHead className="text-xs font-bold text-slate-500 uppercase tracking-wider py-4 whitespace-nowrap">Balance Due</TableHead>
                                    <TableHead className="text-xs font-bold text-slate-500 uppercase tracking-wider py-4 whitespace-nowrap">Status</TableHead>
                                    <TableHead className="text-xs font-bold text-slate-500 uppercase tracking-wider py-4 text-right whitespace-nowrap">Actions</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {loading ? (
                                    <TableRow><TableCell colSpan={6} className="text-center py-12"><Loader2 className="h-8 w-8 animate-spin mx-auto text-indigo-400"/></TableCell></TableRow>
                                ) : bookings.length === 0 ? (
                                    <TableRow><TableCell colSpan={6} className="text-center py-12 text-slate-500 font-medium">No bookings available for collection.</TableCell></TableRow>
                                ) : (
                                    bookings.map(b => {
                                        const { total, paid, due } = calculateDue(b);
                                        
                                        return (
                                            <TableRow key={b.id} className="hover:bg-slate-50/80 transition-colors border-b border-slate-100">
                                                <TableCell className="font-mono text-sm font-bold text-slate-700">{b.booking_code || b.id.substring(0,8).toUpperCase()}</TableCell>
                                                <TableCell><p className="font-bold text-slate-900 whitespace-nowrap">{b.customers?.full_name}</p><p className="text-xs font-medium text-slate-500 line-clamp-1">{b.properties?.title}</p></TableCell>
                                                <TableCell className="font-bold text-slate-700 whitespace-nowrap">₹{total.toLocaleString('en-IN')}</TableCell>
                                                <TableCell className="text-rose-600 font-black whitespace-nowrap">₹{due > 0 ? due.toLocaleString('en-IN') : 0}</TableCell>
                                                <TableCell>
                                                    {due <= 0 
                                                        ? <Badge className="bg-emerald-100 text-emerald-800 hover:bg-emerald-200 border-none px-2.5 py-0.5">Fully Paid (Done)</Badge> 
                                                        : paid > 0 
                                                        ? <Badge className="bg-amber-100 text-amber-800 hover:bg-amber-200 border-none px-2.5 py-0.5">Partially Paid</Badge> 
                                                        : <Badge className="bg-slate-100 text-slate-600 hover:bg-slate-200 border-none px-2.5 py-0.5">Unpaid</Badge>
                                                    }
                                                </TableCell>
                                                <TableCell className="text-right">
                                                    <div className="flex justify-end gap-2">
                                                        <Button size="sm" variant="outline" className="text-slate-600 hover:text-indigo-700 hover:bg-indigo-50 hover:border-indigo-200" onClick={() => openHistory(b)}>
                                                            <History className="h-4 w-4 mr-1.5"/> Ledger
                                                        </Button>
                                                        {due > 0 && <Button size="sm" className="bg-emerald-600 hover:bg-emerald-700 text-white shadow-sm" onClick={() => openPaymentModal(b.id)}><PlusCircle className="h-4 w-4 mr-1.5"/> Collect</Button>}
                                                    </div>
                                                </TableCell>
                                            </TableRow>
                                        );
                                    })
                                )}
                            </TableBody>
                        </Table>
                    </div>
                </Card>

                <Dialog open={paymentModalOpen} onOpenChange={setPaymentModalOpen}>
                    <DialogContent className="sm:max-w-[600px] p-0 overflow-hidden rounded-xl border-0 shadow-2xl">
                        <DialogHeader className="p-6 bg-slate-50 border-b">
                            <DialogTitle className="flex items-center gap-2 text-slate-800 text-xl font-bold">
                                <div className="bg-indigo-100 p-2 rounded-lg text-indigo-700"><IndianRupee className="h-5 w-5"/></div>
                                Record Receipt to Ledger
                            </DialogTitle>
                        </DialogHeader>
                        
                        <div className="p-6 space-y-6 bg-white max-h-[70vh] overflow-y-auto">
                            <div className="space-y-1.5">
                                <Label className="text-xs font-bold text-slate-600 uppercase tracking-wide">Select Deal / Booking</Label>
                                <Select value={selectedBookingId} onValueChange={setSelectedBookingId}>
                                    <SelectTrigger className="h-11 font-medium bg-slate-50"><SelectValue placeholder="Search Customer/Booking" /></SelectTrigger>
                                    <SelectContent>
                                        {bookings.map(b => {
                                            const { due } = calculateDue(b);
                                            if (due <= 0) return null;
                                            return (
                                                <SelectItem key={b.id} value={b.id}>
                                                    {b.booking_code} - {b.customers?.full_name} (Due: ₹{due.toLocaleString('en-IN')})
                                                </SelectItem>
                                            )
                                        })}
                                    </SelectContent>
                                </Select>
                            </div>

                            {selectedBooking && (
                                <div className="bg-indigo-50/50 border border-indigo-100 p-4 rounded-xl space-y-2 text-sm">
                                    <div className="flex items-center gap-2 text-indigo-800 font-bold mb-2 pb-2 border-b border-indigo-100">
                                        <Info className="h-4 w-4" /> Deal Summary (Dynamic Ledger)
                                    </div>
                                    <div className="flex justify-between"><span className="text-slate-500 font-medium">Total Deal Value:</span> <span className="font-bold text-slate-800">₹{activeDue.total.toLocaleString('en-IN')}</span></div>
                                    <div className="flex justify-between"><span className="text-slate-500 font-medium">Previously Paid (Calculated):</span> <span className="font-bold text-emerald-600">₹{activeDue.paid.toLocaleString('en-IN')}</span></div>
                                    <div className="flex justify-between pt-1 mt-1 border-t border-indigo-100/50"><span className="text-slate-600 font-bold">Current Balance Due:</span> <span className="text-rose-600 font-black text-base">₹{activeDue.due.toLocaleString('en-IN')}</span></div>
                                </div>
                            )}

                            <div className="grid grid-cols-2 gap-5">
                                <div className="space-y-1.5">
                                    <Label className="text-xs font-bold text-slate-600 uppercase tracking-wide">Amount Received (₹) *</Label>
                                    <Input type="number" value={amount} onChange={e => setAmount(e.target.value)} className="font-black text-xl h-11 text-indigo-700 bg-white border-slate-300" placeholder="0.00" />
                                </div>
                                <div className="space-y-1.5">
                                    <Label className="text-xs font-bold text-slate-600 uppercase tracking-wide">Payment Date</Label>
                                    <Input type="date" value={paymentDate} onChange={e => setPaymentDate(e.target.value)} className="h-11 font-medium bg-slate-50" />
                                </div>
                            </div>

                            <div className="grid grid-cols-2 gap-5">
                                <div className="space-y-1.5">
                                    <Label className="text-xs font-bold text-slate-600 uppercase tracking-wide">Payment Mode *</Label>
                                    <Select value={mode} onValueChange={setMode}>
                                        <SelectTrigger className="h-11 bg-slate-50"><SelectValue/></SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="Bank Transfer">NEFT / RTGS / IMPS</SelectItem>
                                            <SelectItem value="UPI">UPI</SelectItem>
                                            <SelectItem value="Cheque">Cheque</SelectItem>
                                            <SelectItem value="Cash">Cash</SelectItem>
                                        </SelectContent>
                                    </Select>
                                </div>
                                <div className="space-y-1.5">
                                    <Label className="text-xs font-bold text-slate-600 uppercase tracking-wide">Reference ID</Label>
                                    <Input value={refNo} onChange={e => setRefNo(e.target.value)} className="h-11 bg-slate-50" placeholder="Txn ID / Cheque No" />
                                </div>
                            </div>

                            <div className="space-y-1.5">
                                <Label className="text-xs font-bold text-slate-600 uppercase tracking-wide">Remarks / Notes</Label>
                                <Textarea value={remarks} onChange={e => setRemarks(e.target.value)} placeholder="E.g., 2nd installment for Phase 1 construction" className="resize-none h-20 bg-slate-50" />
                            </div>
                        </div>
                        <DialogFooter className="p-5 bg-slate-50 border-t flex justify-between items-center">
                            <Button variant="ghost" onClick={() => setPaymentModalOpen(false)} className="text-slate-600 hover:text-slate-800">Cancel</Button>
                            <Button onClick={submitPayment} disabled={processing} className="bg-indigo-600 hover:bg-indigo-700 text-white h-11 px-8 shadow-md font-semibold">
                                {processing ? <Loader2 className="h-4 w-4 mr-2 animate-spin"/> : <Plus className="h-4 w-4 mr-2"/>} Save to Payments Table
                            </Button>
                        </DialogFooter>
                    </DialogContent>
                </Dialog>

                <Dialog open={historyModalOpen} onOpenChange={setHistoryModalOpen}>
                    <DialogContent className="sm:max-w-[700px] p-0 overflow-hidden rounded-xl border-0 shadow-2xl bg-slate-50/50">
                        <DialogHeader className="p-6 bg-white border-b flex flex-row items-center justify-between shadow-sm z-10">
                            <div>
                                <DialogTitle className="text-xl font-bold text-slate-800">Ledger Statement</DialogTitle>
                                <p className="text-sm font-medium text-slate-500 mt-1">{selectedBookingForPrint?.customers?.full_name} • {selectedBookingForPrint?.properties?.title}</p>
                            </div>
                            <Badge variant="outline" className="bg-slate-100 text-slate-600 text-xs py-1 px-3 border-slate-200 shadow-sm font-mono">
                                {selectedBookingForPrint?.booking_code}
                            </Badge>
                        </DialogHeader>
                        
                        <div className="p-6 max-h-[65vh] overflow-y-auto">
                            {!selectedBookingForPrint?.payments || selectedBookingForPrint.payments.length === 0 ? (
                                <div className="text-center py-16 bg-white rounded-xl border border-dashed border-slate-300">
                                    <Receipt className="h-12 w-12 text-slate-300 mx-auto mb-3" />
                                    <p className="text-slate-500 font-medium">No ledger entries found in payments table.</p>
                                </div>
                            ) : (
                                <div className="space-y-4">
                                    {[...selectedBookingForPrint.payments].sort((a,b) => new Date(b.payment_date || b.created_at).getTime() - new Date(a.payment_date || a.created_at).getTime()).map((entry: any, idx: number) => (
                                        <div key={idx} className="flex flex-col sm:flex-row justify-between sm:items-center p-5 border border-slate-200 rounded-xl bg-white shadow-sm hover:shadow-md transition-all gap-4">
                                            <div>
                                                <div className="flex items-center gap-2 mb-1">
                                                    <Badge className="bg-emerald-100 text-emerald-800 border-none shadow-none text-[10px] px-2 py-0 uppercase">Credit</Badge>
                                                </div>
                                                <p className="font-black text-slate-800 text-2xl tracking-tight">₹ {Number(entry.amount).toLocaleString('en-IN')}</p>
                                                <div className="flex items-center gap-2 mt-2 text-xs font-medium text-slate-500">
                                                    <span>{new Date(entry.payment_date || entry.created_at).toLocaleDateString('en-IN', {day:'numeric', month:'short', year:'numeric'})}</span>
                                                    <span>•</span>
                                                    <span className="text-indigo-600">{entry.payment_mode}</span>
                                                </div>
                                                {entry.notes && <p className="text-xs text-slate-500 mt-2 italic bg-slate-50 p-2 rounded border border-slate-100 inline-block">{entry.notes}</p>}
                                            </div>
                                            <Button variant="outline" onClick={() => printReceipt(selectedBookingForPrint, entry)} className="w-full sm:w-auto border-indigo-200 text-indigo-700 hover:bg-indigo-50 shadow-sm shrink-0 bg-white">
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