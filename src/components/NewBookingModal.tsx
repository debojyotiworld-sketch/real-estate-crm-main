import React, { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";
import { 
    Loader2, UserRound, IndianRupee, CheckCircle2, 
    CalendarDays, Handshake, ShieldCheck, Save 
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { cn } from "@/lib/utils";

interface Props {
    open: boolean;
    onOpenChange?: (open: boolean) => void;
    onClose?: () => void; // Added foolproof safety
    onSuccess?: () => void;
}

const money = (amount: number | string | undefined) => {
    if (!amount) return "₹ 0";
    return new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format(Number(amount));
};

export const NewBookingModal = ({ open, onOpenChange, onClose, onSuccess }: Props) => {
    const [saving, setSaving] = useState(false);
    const [loadingData, setLoadingData] = useState(false);

    // Lookup Data
    const [customers, setCustomers] = useState<any[]>([]);
    const [properties, setProperties] = useState<any[]>([]);
    const [employees, setEmployees] = useState<any[]>([]);

    // Unified & Detailed Form State
    const [form, setForm] = useState({
        booking_code: "",
        customer_id: "",
        property_id: "",
        assigned_to: "",
        booking_date: new Date().toISOString().split("T")[0],
        agreement_duration_days: "30",
        
        // Commercials
        listed_price: "",
        negotiable_amount: "",
        token_amount: "",
        brokerage_percent: "2",
        brokerage_given: "no",
        brokerage_received_amount: "", 
        
        // Payment
        payment_mode: "Bank Transfer",
        payment_ref: "",
        notes: ""
    });

    useEffect(() => {
        if (open) {
            fetchLookupData();
            const randomString = Math.random().toString(36).substring(2, 8).toUpperCase();
            setForm(prev => ({
                ...prev, 
                booking_code: `BKG-${randomString}`,
                customer_id: "", property_id: "", assigned_to: "", 
                listed_price: "", negotiable_amount: "", token_amount: "", 
                brokerage_given: "no", brokerage_received_amount: "",
                payment_mode: "Bank Transfer", payment_ref: "", notes: ""
            }));
        }
    }, [open]);

    const fetchLookupData = async () => {
        setLoadingData(true);
        try {
            const [custRes, propRes, empRes] = await Promise.all([
                supabase.from('customers').select('id, full_name, phone').order('full_name'),
                supabase.from('properties').select('id, title, price, property_type').eq('status', 'available').order('title'),
                supabase.from('employees').select('id, name, employee_code').eq('status', 'active').order('name')
            ]);
            
            if (custRes.data) setCustomers(custRes.data);
            if (propRes.data) setProperties(propRes.data);
            if (empRes.data) setEmployees(empRes.data);
        } catch (error) {
            toast.error("Failed to load reference data");
        } finally {
            setLoadingData(false);
        }
    };

    const updateForm = (key: string, value: string) => setForm(prev => ({ ...prev, [key]: value }));

    const handlePropertyChange = (propId: string) => {
        const selectedProp = properties.find(p => p.id === propId);
        updateForm("property_id", propId);
        updateForm("listed_price", selectedProp?.price ? String(selectedProp.price) : "");
    };

    // Safe close handler to prevent crash
    const handleModalClose = () => {
        if (typeof onOpenChange === "function") onOpenChange(false);
        if (typeof onClose === "function") onClose();
    };

    // Math Calculations
    const finalValue = Number(form.negotiable_amount || form.listed_price || 0);
    const tokenPaid = Number(form.token_amount || 0);
    const balanceDue = finalValue - tokenPaid;
    const brokerageAmount = (finalValue * Number(form.brokerage_percent || 0)) / 100;

    const selectedCustomer = customers.find(c => c.id === form.customer_id);
    const selectedProperty = properties.find(p => p.id === form.property_id);
    const selectedExecutive = employees.find(e => e.id === form.assigned_to);

    const validateForm = () => {
        if (!form.customer_id) return "Please select a Customer";
        if (!form.property_id) return "Please select a Property";
        if (!form.assigned_to) return "Please assign a Sales Executive";
        if (finalValue <= 0) return "Valid Final Deal Amount is required";
        if (tokenPaid > finalValue) return "Token paid cannot exceed the final deal value";
        if (tokenPaid > 0 && !form.payment_mode) return "Payment mode is required for token amount";
        if (form.brokerage_given === "yes" && (!form.brokerage_received_amount || Number(form.brokerage_received_amount) <= 0)) {
            return "Please enter the exact Brokerage Received Amount";
        }
        return null;
    };

    const handleSubmit = async () => {
        const errorMsg = validateForm();
        if (errorMsg) { toast.error(errorMsg); return; }

        setSaving(true);
        try {
            // Safe packaging for extra note details
            let finalNotes = form.notes;
            if (form.brokerage_given === "yes") {
                finalNotes = `[Brokerage Recd: ₹${form.brokerage_received_amount}] ${finalNotes}`;
            }

            // 1. Insert Master Booking
            const bookingPayload = {
                booking_code: form.booking_code,
                customer_id: form.customer_id,
                property_id: form.property_id,
                assigned_to: form.assigned_to,
                booking_date: form.booking_date,
                agreement_duration_days: Number(form.agreement_duration_days),
                total_amount: finalValue,
                negotiable_amount: finalValue,
                token_amount: tokenPaid,
                balance_amount: balanceDue,
                brokerage_percent: Number(form.brokerage_percent),
                brokerage_amount: brokerageAmount,
                brokerage_given: form.brokerage_given === "yes", 
                notes: finalNotes,
            };

            const { data: newBooking, error: bookingError } = await supabase
                .from('bookings')
                .insert(bookingPayload as any)
                .select('id')
                .single();
                
            if (bookingError) throw bookingError;

            // 2. Insert Token to Payments Ledger (banking style)
            if (tokenPaid > 0 && newBooking) {
                const paymentPayload = {
                    booking_id: newBooking.id,
                    amount: tokenPaid,
                    payment_date: new Date().toISOString(),
                    payment_mode: form.payment_mode,
                    payment_type: "Token Advance",
                    status: "Completed",
                    notes: `Ref: ${form.payment_ref || 'N/A'} | Invoice: INV-${form.booking_code}-TOKEN`
                };
                const { error: payError } = await supabase.from('payments').insert(paymentPayload as any);
                if (payError) console.error("Payment insert failed:", payError);
            }

            // 3. Mark Property Sold
            await supabase.from('properties').update({ status: 'sold' } as any).eq('id', form.property_id);

            toast.success("Booking generated and Ledger updated successfully!");
            if (onSuccess) onSuccess();
            handleModalClose(); // Fixed closing mechanism
        } catch (err: any) {
            toast.error(err.message || "Failed to create booking");
            updateForm("booking_code", `BKG-${Math.random().toString(36).substring(2, 8).toUpperCase()}`);
        } finally {
            setSaving(false);
        }
    };

    const stepState = [
        { label: "Customer Details", done: !!form.customer_id },
        { label: "Select Property", done: !!form.property_id },
        { label: "Final Deal Value", done: finalValue > 0 },
        { label: "Review & Save", done: false }
    ];

    return (
        <Dialog open={open} onOpenChange={(isOpen) => { if (!isOpen) handleModalClose(); }}>
            <DialogContent className="max-w-[1100px] h-[90vh] flex flex-col p-0 overflow-hidden rounded-2xl bg-white shadow-2xl">
                
                {/* Header (Premium Theme) */}
                <DialogHeader className="px-6 py-5 border-b bg-slate-50/50 flex flex-row items-center justify-between shrink-0 shadow-sm z-10">
                    <div>
                        <DialogTitle className="text-xl font-bold flex items-center gap-3 text-slate-800">
                            <div className="bg-indigo-600 p-2 rounded-lg text-white shadow-md">
                                <Handshake className="h-5 w-5"/>
                            </div> 
                            Create New Booking
                        </DialogTitle>
                        <p className="text-sm text-slate-500 mt-1 ml-11">Convert a qualified customer into a tracked sale with payment milestones.</p>
                    </div>
                    <div className="text-right">
                        <span className="text-[10px] uppercase font-bold text-slate-400 block mb-1">Booking Reference</span>
                        <span className="font-mono bg-white border border-slate-200 px-3 py-1 rounded-md text-slate-800 font-bold shadow-sm">{form.booking_code}</span>
                    </div>
                </DialogHeader>

                {loadingData ? (
                    <div className="flex-1 flex justify-center items-center bg-slate-50/30"><Loader2 className="animate-spin h-8 w-8 text-indigo-600" /></div>
                ) : (
                    <div className="flex-1 grid grid-cols-1 lg:grid-cols-[1fr_360px] overflow-hidden">
                        
                        {/* LEFT COLUMN: FORM */}
                        <div className="overflow-y-auto px-6 py-6 bg-slate-50/30">
                            
                            {/* Step Indicators */}
                            <div className="mb-6 grid grid-cols-2 gap-3 md:grid-cols-4">
                                {stepState.map((step, index) => (
                                    <div key={step.label} className={cn("rounded-xl border px-3 py-2.5 text-xs font-semibold flex items-center gap-2 transition-colors", step.done ? "border-emerald-200 bg-emerald-50 text-emerald-700" : "bg-white border-slate-200 text-slate-400")}>
                                        <span className={cn("flex h-5 w-5 items-center justify-center rounded-full text-[10px]", step.done ? 'bg-emerald-600 text-white' : 'bg-slate-100 text-slate-500')}>
                                            {step.done ? <CheckCircle2 className="h-3 w-3" /> : index + 1}
                                        </span>
                                        {step.label}
                                    </div>
                                ))}
                            </div>

                            <div className="space-y-6">
                                {/* SECTION 1: Customer Details */}
                                <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
                                    <div className="mb-5 flex items-center gap-2 border-b pb-3">
                                        <div className="bg-blue-100 p-1.5 rounded-lg text-blue-700"><UserRound className="h-4 w-4" /></div>
                                        <h3 className="font-bold text-slate-800">Customer & Property</h3>
                                    </div>

                                    <div className="grid gap-5 md:grid-cols-2">
                                        <div className="space-y-1.5">
                                            <Label className="text-xs font-bold text-slate-600 uppercase">Customer <span className="text-rose-500">*</span></Label>
                                            <Select value={form.customer_id} onValueChange={(v) => updateForm("customer_id", v)}>
                                                <SelectTrigger className="h-11 bg-slate-50/50"><SelectValue placeholder="Select customer" /></SelectTrigger>
                                                <SelectContent>
                                                    {customers.map((c) => <SelectItem key={c.id} value={c.id}>{c.full_name} {c.phone ? `- ${c.phone}` : ""}</SelectItem>)}
                                                </SelectContent>
                                            </Select>
                                        </div>

                                        <div className="space-y-1.5">
                                            <Label className="text-xs font-bold text-slate-600 uppercase">Shortlisted Property <span className="text-rose-500">*</span></Label>
                                            <Select value={form.property_id} onValueChange={handlePropertyChange} disabled={!form.customer_id}>
                                                <SelectTrigger className="h-11 bg-slate-50/50"><SelectValue placeholder={!form.customer_id ? "Select customer first" : "Select property"}/></SelectTrigger>
                                                <SelectContent>
                                                    {properties.map((p) => <SelectItem key={p.id} value={p.id}>{p.title} {p.price ? `- ${money(p.price)}` : ""}</SelectItem>)}
                                                </SelectContent>
                                            </Select>
                                        </div>

                                        <div className="space-y-1.5">
                                            <Label className="text-xs font-bold text-slate-600 uppercase">Sales Executive <span className="text-rose-500">*</span></Label>
                                            <Select value={form.assigned_to} onValueChange={(v) => updateForm("assigned_to", v)} disabled={!form.property_id}>
                                                <SelectTrigger className="h-11 bg-slate-50/50"><SelectValue placeholder={!form.property_id ? "Select property first" : "Select executive"}/></SelectTrigger>
                                                <SelectContent>
                                                    {employees.map((e) => <SelectItem key={e.id} value={e.id}>{e.name}</SelectItem>)}
                                                </SelectContent>
                                            </Select>
                                        </div>

                                        <div className="space-y-1.5">
                                            <Label className="text-xs font-bold text-slate-600 uppercase">Booking Date</Label>
                                            <Input type="date" value={form.booking_date} onChange={(e) => updateForm("booking_date", e.target.value)} className="h-11 bg-slate-50/50"/>
                                        </div>
                                    </div>
                                </section>

                                {/* SECTION 2: Commercials */}
                                <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
                                    <div className="mb-5 flex items-center gap-2 border-b pb-3">
                                        <div className="bg-amber-100 p-1.5 rounded-lg text-amber-700"><IndianRupee className="h-4 w-4" /></div>
                                        <h3 className="font-bold text-slate-800">Commercial Terms</h3>
                                    </div>

                                    <div className="grid gap-5 md:grid-cols-2">
                                        <div className="space-y-1.5">
                                            <Label className="text-xs font-bold text-slate-600 uppercase">Listed Property Value (₹)</Label>
                                            <Input type="number" min="0" value={form.listed_price} readOnly className="h-11 bg-slate-100 text-slate-500" placeholder="Auto-filled" />
                                        </div>

                                        <div className="space-y-1.5">
                                            <Label className="text-xs font-bold text-slate-600 uppercase">Final Negotiated Value (₹) <span className="text-rose-500">*</span></Label>
                                            <Input type="number" min="0" value={form.negotiable_amount} onChange={(e) => updateForm("negotiable_amount", e.target.value)} className="h-11 font-bold text-indigo-700 border-indigo-200 bg-indigo-50/30" placeholder="Enter final deal value" />
                                        </div>

                                        <div className="space-y-1.5">
                                            <Label className="text-xs font-bold text-slate-600 uppercase">Token Paid Now (₹)</Label>
                                            <Input type="number" min="0" value={form.token_amount} onChange={(e) => updateForm("token_amount", e.target.value)} className="h-11 font-bold text-emerald-700 border-emerald-200 bg-emerald-50/30" placeholder="0.00" />
                                        </div>

                                        <div className="space-y-1.5">
                                            <Label className="text-xs font-bold text-slate-600 uppercase">Token Payment Mode</Label>
                                            <Select value={form.payment_mode} onValueChange={(v) => updateForm("payment_mode", v)} disabled={!form.token_amount}>
                                                <SelectTrigger className="h-11"><SelectValue/></SelectTrigger>
                                                <SelectContent>
                                                    <SelectItem value="Bank Transfer">NEFT / RTGS / IMPS</SelectItem>
                                                    <SelectItem value="UPI">UPI</SelectItem>
                                                    <SelectItem value="Cheque">Cheque</SelectItem>
                                                    <SelectItem value="Cash">Cash</SelectItem>
                                                </SelectContent>
                                            </Select>
                                        </div>

                                        <div className="space-y-1.5 border-t pt-4 md:col-span-2">
                                            <div className="flex items-center gap-2 mb-2">
                                                <h4 className="text-xs font-bold text-indigo-900 uppercase">Brokerage Structure</h4>
                                            </div>
                                        </div>

                                        <div className="space-y-1.5">
                                            <Label className="text-xs font-bold text-slate-600 uppercase">Brokerage %</Label>
                                            <Input type="number" step="0.1" value={form.brokerage_percent} onChange={(e) => updateForm("brokerage_percent", e.target.value)} className="h-11" />
                                        </div>

                                        <div className="space-y-1.5">
                                            <Label className="text-xs font-bold text-slate-600 uppercase">Agreement Timeline (Days)</Label>
                                            <Input type="number" min="1" value={form.agreement_duration_days} onChange={(e) => updateForm("agreement_duration_days", e.target.value)} className="h-11" />
                                        </div>

                                        <div className="space-y-1.5">
                                            <Label className="text-xs font-bold text-slate-600 uppercase">Brokerage Received?</Label>
                                            <Select value={form.brokerage_given} onValueChange={(v) => {
                                                updateForm("brokerage_given", v);
                                                if(v === "yes" && !form.brokerage_received_amount) {
                                                    updateForm("brokerage_received_amount", String(brokerageAmount));
                                                }
                                            }}>
                                                <SelectTrigger className="h-11"><SelectValue/></SelectTrigger>
                                                <SelectContent>
                                                    <SelectItem value="no">No, Pending / Receivable</SelectItem>
                                                    <SelectItem value="yes">Yes, Received</SelectItem>
                                                </SelectContent>
                                            </Select>
                                        </div>

                                        {form.brokerage_given === "yes" && (
                                            <div className="space-y-1.5 animate-in fade-in zoom-in duration-200">
                                                <Label className="text-xs font-bold text-emerald-600 uppercase">Brokerage Amount Recd. (₹)</Label>
                                                <Input type="number" min="0" value={form.brokerage_received_amount} onChange={(e) => updateForm("brokerage_received_amount", e.target.value)} className="h-11 font-bold text-emerald-700 border-emerald-200 bg-emerald-50/30" />
                                            </div>
                                        )}

                                        <div className="space-y-1.5 border-t pt-4 md:col-span-2">
                                            <Label className="text-xs font-bold text-slate-600 uppercase">Internal Notes / Payment Reference</Label>
                                            <Textarea value={form.notes} onChange={(e) => updateForm("notes", e.target.value)} placeholder="Promised documents, special terms, UTR numbers, etc." className="h-20 resize-none bg-slate-50/50" />
                                        </div>
                                    </div>
                                </section>
                            </div>
                        </div>

                        {/* RIGHT COLUMN: SUMMARY */}
                        <aside className="border-l border-slate-200 bg-slate-50/80 p-6 overflow-y-auto shadow-[-5px_0_15px_-10px_rgba(0,0,0,0.05)] z-0">
                            <div className="space-y-6">
                                <div>
                                    <h3 className="text-lg font-bold text-slate-800 tracking-tight">Booking Summary</h3>
                                    <p className="text-xs font-medium text-slate-500 mt-1">Review the details before confirming.</p>
                                </div>

                                <div className="space-y-3.5 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
                                    <SummaryRow label="Customer" value={selectedCustomer?.full_name} />
                                    <SummaryRow label="Property" value={selectedProperty?.title} />
                                    <SummaryRow label="Executive" value={selectedExecutive?.name} />
                                    <SummaryRow label="Date" value={form.booking_date ? new Date(form.booking_date).toLocaleDateString('en-GB') : "-"} icon={<CalendarDays className="h-4 w-4" />} />
                                </div>

                                <div className="space-y-3.5 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
                                    <SummaryRow label="Final Value" value={money(finalValue)} strong />
                                    <SummaryRow label="Token Paid" value={money(tokenPaid)} textClass="text-emerald-600 font-bold" />
                                    <div className="border-t border-slate-100 my-2 pt-2">
                                        <SummaryRow label="Balance Due" value={money(balanceDue)} textClass="text-rose-600 font-black text-lg" />
                                    </div>
                                </div>

                                <div className="space-y-3.5 rounded-2xl border border-indigo-100 bg-indigo-50/30 p-5 shadow-sm">
                                    <SummaryRow label="Est. Brokerage" value={`${money(brokerageAmount)} (${form.brokerage_percent || 0}%)`} textClass="text-indigo-600 font-bold" />
                                    <SummaryRow label="Brokerage Status" value={form.brokerage_given === 'yes' ? 'Received' : 'Receivable'} textClass={form.brokerage_given === 'yes' ? "text-emerald-600 font-semibold" : "text-amber-600 font-semibold"} />
                                    {form.brokerage_given === 'yes' && (
                                        <SummaryRow label="Amount Received" value={money(form.brokerage_received_amount)} textClass="text-emerald-700 font-black" />
                                    )}
                                </div>

                                <div className="rounded-2xl border border-blue-200 bg-blue-50 p-4 text-xs font-medium text-blue-800 leading-relaxed shadow-sm">
                                    <div className="mb-2.5 flex items-center gap-2 font-bold text-blue-900 text-sm">
                                        <ShieldCheck className="h-4 w-4" /> System Actions
                                    </div>
                                    <ul className="list-disc list-inside space-y-1.5 ml-1">
                                        <li>Booking record is generated.</li>
                                        <li>Property status locked to 'Sold'.</li>
                                        {tokenPaid > 0 && <li>Token amount saved to Payments Ledger.</li>}
                                    </ul>
                                </div>
                            </div>
                        </aside>
                    </div>
                )}

                {/* FOOTER */}
                <DialogFooter className="bg-white border-t px-6 py-4 shrink-0 z-20 shadow-[0_-10px_20px_-10px_rgba(0,0,0,0.05)] flex items-center justify-end gap-3">
                    <Button type="button" variant="outline" onClick={handleModalClose} disabled={saving} className="h-11 px-6 font-semibold">
                        Cancel
                    </Button>
                    <Button type="button" onClick={handleSubmit} disabled={saving || loadingData} className="bg-indigo-600 hover:bg-indigo-700 text-white h-11 px-8 shadow-md font-bold text-sm">
                        {saving ? <><Loader2 className="mr-2 h-4 w-4 animate-spin"/> Processing...</> : <><Save className="mr-2 h-4 w-4"/> Confirm & Create Booking</>}
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
};

// Sub-component for Right Sidebar
function SummaryRow({ label, value, strong, icon, textClass }: { label: string; value: string | number | null | undefined; strong?: boolean; icon?: React.ReactNode; textClass?: string }) {
    return (
        <div className="flex items-center justify-between gap-3 text-sm">
            <span className="flex items-center gap-1.5 text-slate-500 font-medium">
                {icon}
                {label}
            </span>
            <span className={`text-right ${strong ? "font-bold text-slate-800" : "text-slate-700"} ${textClass || ""}`}>
                {value || "-"}
            </span>
        </div>
    );
}

export default NewBookingModal;