import React, { useState, useEffect, useMemo } from "react";
import { MainLayout } from "@/components/layout/MainLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { 
    Loader2, Users, IndianRupee, Wallet, UserCircle, 
    Building2, Phone, Mail, MapPin, Receipt, ArrowRight
} from "lucide-react";

export default function Customers() {
    const [customers, setCustomers] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    
    // Customer Profile Modal States
    const [selectedCustomer, setSelectedCustomer] = useState<any>(null);
    const [profileOpen, setProfileOpen] = useState(false);

    useEffect(() => {
        fetchCustomers();
    }, []);

    const fetchCustomers = async () => {
        setLoading(true);
        try {
            // FIXED QUERY: Using payment_mode and payment_date according to your types.ts
            const { data, error } = await supabase
                .from('customers')
                .select(`
                    *,
                    bookings (
                        id,
                        booking_code,
                        total_amount,
                        booking_date,
                        properties (title),
                        payments (amount, payment_date, payment_mode, notes)
                    )
                `)
                .order('created_at', { ascending: false });

            if (error) {
                console.error("Supabase Error:", error);
                throw error;
            }
            
            // Calculate Financials for each customer
            const customersWithFinancials = (data || []).map(cust => {
                let totalDealValue = 0;
                let totalPaid = 0;
                
                cust.bookings?.forEach((booking: any) => {
                    totalDealValue += Number(booking.total_amount || 0);
                    booking.payments?.forEach((payment: any) => {
                        totalPaid += Number(payment.amount || 0);
                    });
                });

                return {
                    ...cust,
                    totalDeals: cust.bookings?.length || 0,
                    totalDealValue,
                    totalPaid,
                    balanceDue: totalDealValue - totalPaid
                };
            });

            setCustomers(customersWithFinancials);
        } catch (error: any) {
            toast.error("Failed to fetch customer data. Check console for details.");
        } finally {
            setLoading(false);
        }
    };

    // Dashboard KPIs
    const metrics = useMemo(() => {
        let totalCustomers = customers.length;
        let outstandingCustomers = 0;
        let totalMarketOutstanding = 0;
        let fullyPaidCustomers = 0;

        customers.forEach(c => {
            if (c.balanceDue > 0) {
                outstandingCustomers++;
                totalMarketOutstanding += c.balanceDue;
            } else if (c.totalDeals > 0 && c.balanceDue <= 0) {
                fullyPaidCustomers++;
            }
        });

        return { totalCustomers, outstandingCustomers, totalMarketOutstanding, fullyPaidCustomers };
    }, [customers]);

    const openCustomerProfile = (customer: any) => {
        setSelectedCustomer(customer);
        setProfileOpen(true);
    };

    return (
        <MainLayout title="Customer Directory" subtitle="Manage client relationships, track properties bought, and monitor outstanding dues.">
            <div className="w-full space-y-6 animate-in fade-in duration-500">

                {/* 1. KPIs */}
                <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4 w-full">
                    <Card className="shadow-sm border border-slate-200/60 bg-white"><CardContent className="p-5 flex items-center gap-4">
                        <div className="p-3 bg-blue-50 rounded-xl text-blue-600"><Users className="h-6 w-6"/></div>
                        <div><p className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">Total Clients</p><h3 className="text-2xl font-black text-slate-800">{metrics.totalCustomers}</h3></div>
                    </CardContent></Card>
                    
                    <Card className="shadow-sm border border-slate-200/60 bg-white"><CardContent className="p-5 flex items-center gap-4">
                        <div className="p-3 bg-rose-50 rounded-xl text-rose-600"><Wallet className="h-6 w-6"/></div>
                        <div><p className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">Total Market Dues</p><h3 className="text-2xl font-black text-slate-800">₹{(metrics.totalMarketOutstanding / 100000).toFixed(2)}L</h3></div>
                    </CardContent></Card>
                    
                    <Card className="shadow-sm border border-slate-200/60 bg-white"><CardContent className="p-5 flex items-center gap-4">
                        <div className="p-3 bg-amber-50 rounded-xl text-amber-500"><IndianRupee className="h-6 w-6"/></div>
                        <div><p className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">Clients with Dues</p><h3 className="text-2xl font-black text-slate-800">{metrics.outstandingCustomers}</h3></div>
                    </CardContent></Card>
                    
                    <Card className="shadow-sm border border-slate-200/60 bg-white"><CardContent className="p-5 flex items-center gap-4">
                        <div className="p-3 bg-emerald-50 rounded-xl text-emerald-600"><UserCircle className="h-6 w-6"/></div>
                        <div><p className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">Fully Paid Clients</p><h3 className="text-2xl font-black text-slate-800">{metrics.fullyPaidCustomers}</h3></div>
                    </CardContent></Card>
                </div>

                {/* 2. Customer Table */}
                <Card className="shadow-sm border border-slate-200/60 w-full bg-white overflow-hidden">
                    <div className="p-4 border-b bg-slate-50/50">
                        <h3 className="font-bold text-slate-700 flex items-center gap-2"><UserCircle className="h-5 w-5 text-slate-500" /> Client Directory & Balances</h3>
                    </div>

                    <div className="overflow-x-auto w-full">
                        <Table className="w-full">
                            <TableHeader className="bg-white border-b">
                                <TableRow>
                                    <TableHead className="text-xs font-bold text-slate-500 uppercase tracking-wider py-4">Customer Info</TableHead>
                                    <TableHead className="text-xs font-bold text-slate-500 uppercase tracking-wider py-4 text-center">Bookings</TableHead>
                                    <TableHead className="text-xs font-bold text-slate-500 uppercase tracking-wider py-4 whitespace-nowrap">Total Value</TableHead>
                                    <TableHead className="text-xs font-bold text-slate-500 uppercase tracking-wider py-4 whitespace-nowrap">Balance Due</TableHead>
                                    <TableHead className="text-xs font-bold text-slate-500 uppercase tracking-wider py-4">Financial Status</TableHead>
                                    <TableHead className="text-xs font-bold text-slate-500 uppercase tracking-wider py-4 text-right">Actions</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {loading ? (
                                    <TableRow><TableCell colSpan={6} className="text-center py-12"><Loader2 className="h-8 w-8 animate-spin mx-auto text-indigo-400"/></TableCell></TableRow>
                                ) : customers.length === 0 ? (
                                    <TableRow><TableCell colSpan={6} className="text-center py-12 text-slate-500 font-medium">No customers found.</TableCell></TableRow>
                                ) : (
                                    customers.map(c => (
                                        <TableRow key={c.id} className="hover:bg-slate-50/80 transition-colors border-b border-slate-100">
                                            <TableCell>
                                                <p className="font-bold text-slate-900">{c.full_name}</p>
                                                <p className="text-xs font-medium text-slate-500 flex items-center gap-1 mt-0.5"><Phone className="h-3 w-3"/> {c.phone}</p>
                                            </TableCell>
                                            <TableCell className="text-center">
                                                <Badge variant="outline" className="bg-slate-50 text-slate-600 font-bold px-2 py-0.5">{c.totalDeals}</Badge>
                                            </TableCell>
                                            <TableCell className="font-bold text-slate-700 whitespace-nowrap">₹{c.totalDealValue.toLocaleString('en-IN')}</TableCell>
                                            <TableCell className="text-rose-600 font-black whitespace-nowrap">₹{c.balanceDue > 0 ? c.balanceDue.toLocaleString('en-IN') : 0}</TableCell>
                                            <TableCell>
                                                {c.totalDeals === 0 ? (
                                                    <Badge className="bg-slate-100 text-slate-500 border-none px-2.5 py-0.5 hover:bg-slate-200">Lead / No Booking</Badge>
                                                ) : c.balanceDue <= 0 ? (
                                                    <Badge className="bg-emerald-100 text-emerald-800 border-none px-2.5 py-0.5 hover:bg-emerald-200">Clear (Fully Paid)</Badge>
                                                ) : (
                                                    <Badge className="bg-amber-100 text-amber-800 border-none px-2.5 py-0.5 hover:bg-amber-200">Dues Pending</Badge>
                                                )}
                                            </TableCell>
                                            <TableCell className="text-right">
                                                <Button size="sm" variant="outline" className="text-indigo-600 border-indigo-200 hover:bg-indigo-50 font-semibold" onClick={() => openCustomerProfile(c)}>
                                                    View Profile <ArrowRight className="h-4 w-4 ml-1.5"/>
                                                </Button>
                                            </TableCell>
                                        </TableRow>
                                    ))
                                )}
                            </TableBody>
                        </Table>
                    </div>
                </Card>

                {/* 3. Customer 360 Profile Modal */}
                <Dialog open={profileOpen} onOpenChange={setProfileOpen}>
                    <DialogContent className="sm:max-w-[700px] p-0 overflow-hidden rounded-2xl border-0 shadow-2xl bg-slate-50/50">
                        <DialogHeader className="p-6 bg-white border-b flex flex-row items-center justify-between shadow-sm z-10">
                            <div>
                                <DialogTitle className="text-xl font-bold text-slate-800 flex items-center gap-2">
                                    <div className="bg-indigo-100 p-2 rounded-full text-indigo-700"><UserCircle className="h-5 w-5"/></div>
                                    Client Profile
                                </DialogTitle>
                            </div>
                        </DialogHeader>

                        {selectedCustomer && (
                            <div className="p-6 max-h-[75vh] overflow-y-auto space-y-6 bg-slate-50/50">
                                
                                {/* Info Cards */}
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm space-y-3">
                                        <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider border-b pb-2">Personal Details</h4>
                                        <p className="font-bold text-slate-800 text-lg">{selectedCustomer.full_name}</p>
                                        <p className="text-sm font-medium text-slate-600 flex items-center gap-2"><Phone className="h-4 w-4 text-slate-400"/> {selectedCustomer.phone}</p>
                                        <p className="text-sm font-medium text-slate-600 flex items-center gap-2"><Mail className="h-4 w-4 text-slate-400"/> {selectedCustomer.email || 'N/A'}</p>
                                        <p className="text-sm font-medium text-slate-600 flex items-center gap-2"><MapPin className="h-4 w-4 text-slate-400"/> {selectedCustomer.city ? `${selectedCustomer.address || ''}, ${selectedCustomer.city}` : (selectedCustomer.address || 'Address not provided')}</p>
                                    </div>

                                    <div className="bg-indigo-600 p-4 rounded-xl border border-indigo-700 shadow-sm text-white space-y-3 relative overflow-hidden">
                                        <div className="absolute top-0 right-0 p-4 opacity-10"><Wallet className="h-20 w-20"/></div>
                                        <h4 className="text-xs font-bold text-indigo-200 uppercase tracking-wider border-b border-indigo-500 pb-2">Financial Snapshot</h4>
                                        <div className="flex justify-between items-center text-sm">
                                            <span className="text-indigo-100">Total Deal Value:</span>
                                            <span className="font-bold">₹{selectedCustomer.totalDealValue.toLocaleString('en-IN')}</span>
                                        </div>
                                        <div className="flex justify-between items-center text-sm">
                                            <span className="text-indigo-100">Amount Paid:</span>
                                            <span className="font-bold">₹{selectedCustomer.totalPaid.toLocaleString('en-IN')}</span>
                                        </div>
                                        <div className="flex justify-between items-center pt-2 mt-2 border-t border-indigo-500/50">
                                            <span className="font-semibold text-indigo-50">Total Balance Due:</span>
                                            <span className="font-black text-xl text-yellow-300">₹{selectedCustomer.balanceDue > 0 ? selectedCustomer.balanceDue.toLocaleString('en-IN') : 0}</span>
                                        </div>
                                    </div>
                                </div>

                                {/* Property Bookings Ledger */}
                                <div>
                                    <h4 className="text-sm font-bold text-slate-800 mb-3 flex items-center gap-2"><Building2 className="h-4 w-4 text-indigo-600"/> Purchased Properties & Payments</h4>
                                    
                                    {!selectedCustomer.bookings || selectedCustomer.bookings.length === 0 ? (
                                        <div className="text-center py-10 bg-white rounded-xl border border-dashed border-slate-300">
                                            <p className="text-slate-500 font-medium">This customer hasn't booked any property yet.</p>
                                        </div>
                                    ) : (
                                        <div className="space-y-4">
                                            {selectedCustomer.bookings.map((booking: any) => {
                                                const bookingPaid = booking.payments?.reduce((sum: number, p: any) => sum + Number(p.amount), 0) || 0;
                                                const bookingDue = Number(booking.total_amount) - bookingPaid;

                                                return (
                                                    <Card key={booking.id} className="border border-slate-200 shadow-sm overflow-hidden">
                                                        <CardHeader className="bg-slate-100/50 py-3 px-4 border-b border-slate-200 flex flex-row items-center justify-between">
                                                            <div>
                                                                <CardTitle className="text-sm font-bold text-slate-800">{booking.properties?.title}</CardTitle>
                                                                <p className="text-xs text-slate-500 font-mono mt-0.5">{booking.booking_code} • {booking.booking_date ? new Date(booking.booking_date).toLocaleDateString() : 'N/A'}</p>
                                                            </div>
                                                            <div className="text-right">
                                                                <p className="text-xs font-bold text-slate-500 uppercase">Deal Value</p>
                                                                <p className="font-bold text-slate-800">₹{Number(booking.total_amount).toLocaleString('en-IN')}</p>
                                                            </div>
                                                        </CardHeader>
                                                        <CardContent className="p-0">
                                                            {/* Mini Payment List for this booking */}
                                                            {booking.payments && booking.payments.length > 0 ? (
                                                                <div className="divide-y divide-slate-100 bg-white">
                                                                    {booking.payments.map((pay: any, idx: number) => (
                                                                        <div key={idx} className="flex justify-between items-center py-2 px-4 hover:bg-slate-50">
                                                                            <div className="flex items-center gap-3">
                                                                                <Receipt className="h-4 w-4 text-emerald-600"/>
                                                                                <div>
                                                                                    <p className="text-xs font-semibold text-slate-700">{pay.payment_mode}</p>
                                                                                    <p className="text-[10px] text-slate-500">{new Date(pay.payment_date || new Date()).toLocaleDateString('en-GB')}</p>
                                                                                </div>
                                                                            </div>
                                                                            <p className="text-sm font-bold text-emerald-600">₹{Number(pay.amount).toLocaleString('en-IN')}</p>
                                                                        </div>
                                                                    ))}
                                                                </div>
                                                            ) : (
                                                                <div className="py-3 px-4 text-xs text-slate-500 text-center bg-white">No payments recorded yet.</div>
                                                            )}
                                                            <div className="bg-rose-50/50 py-2 px-4 border-t border-rose-100 flex justify-between items-center">
                                                                <span className="text-xs font-bold text-rose-800">Pending Due for this Property:</span>
                                                                <span className="text-sm font-black text-rose-600">₹{bookingDue > 0 ? bookingDue.toLocaleString('en-IN') : 0}</span>
                                                            </div>
                                                        </CardContent>
                                                    </Card>
                                                )
                                            })}
                                        </div>
                                    )}
                                </div>
                            </div>
                        )}
                    </DialogContent>
                </Dialog>
            </div>
        </MainLayout>
    );
}