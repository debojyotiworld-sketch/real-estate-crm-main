import React, { useEffect, useState, useMemo } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { ScrollArea } from "@/components/ui/scroll-area";
import { toast } from "sonner";
import { IndianRupee, History, TrendingUp, Loader2, ArrowUpRight, ArrowDownRight, Save, Building, Wallet, Landmark, Info } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";

export const EmployeeSalaryModal = ({ open, onOpenChange, employee }: any) => {
    const [loading, setLoading] = useState(false);
    const [saving, setSaving] = useState(false);
    const [activeTab, setActiveTab] = useState("setup");
    const [salaryHistory, setSalaryHistory] = useState<any[]>([]);

    // Complete Professional Salary State
    const [form, setForm] = useState({
        // 1. Earnings
        basic: "", hra: "", conveyance: "", medical: "", special_allowance: "", other_allowance: "",

        // 2. Employee Deductions (Reduces Net Salary)
        pf_applicable: false, pf_percent: "12", pf_amount: "",
        esi_applicable: false, esi_percent: "0.75", esi_amount: "",
        professional_tax: "", tds: "", other_deductions: "",

        // 3. Employer Contributions (Increases CTC)
        employer_pf_percent: "12", employer_pf: "",
        employer_esi_percent: "3.25", employer_esi: "",
        gratuity_percent: "4.81", gratuity: "", // Gratuity is standard 15/26 days (~4.81% of Basic)

        // 4. Compliance Info
        pf_number: "", esi_number: "", uan_number: ""
    });

    useEffect(() => {
        if (open && employee?.id) {
            fetchSalaryHistory();
        } else {
            setSalaryHistory([]);
        }
    }, [open, employee]);

    const fetchSalaryHistory = async () => {
        setLoading(true);
        try {
            const { data } = await supabase.from("employee_salary_structures").select("*").eq("employee_id", employee.id).order("created_at", { ascending: false });
            const history = (data as any[]) || [];
            setSalaryHistory(history);

            const current = history.find(s => s.is_current);
            if (current) {
                setActiveTab("setup");
                setForm({
                    basic: String(current.basic || ""), hra: String(current.hra || ""), conveyance: String(current.conveyance || ""),
                    medical: String(current.medical || ""), special_allowance: String(current.special_allowance || ""), other_allowance: String(current.other_allowance || ""),

                    pf_applicable: Boolean(current.pf_applicable), esi_applicable: Boolean(current.esi_applicable),
                    pf_percent: "12", esi_percent: "0.75",
                    pf_amount: String(current.pf_employee_contribution || ""), esi_amount: String(current.esi_employee_contribution || ""),
                    professional_tax: String(current.professional_tax || ""), tds: String(current.tds || ""), other_deductions: String(current.other_deductions || ""),

                    employer_pf_percent: "12", employer_pf: String(current.employer_pf || ""),
                    employer_esi_percent: "3.25", employer_esi: String(current.employer_esi || ""),
                    gratuity_percent: "4.81", gratuity: String(current.gratuity || ""),

                    pf_number: current.pf_number || "", esi_number: current.esi_number || "", uan_number: current.uan_number || ""
                });
            } else {
                setActiveTab("setup");
                setForm({
                    basic: "", hra: "", conveyance: "", medical: "", special_allowance: "", other_allowance: "",
                    pf_applicable: false, pf_percent: "12", pf_amount: "", esi_applicable: false, esi_percent: "0.75", esi_amount: "",
                    professional_tax: "", tds: "", other_deductions: "",
                    employer_pf_percent: "12", employer_pf: "", employer_esi_percent: "3.25", employer_esi: "", gratuity_percent: "4.81", gratuity: "",
                    pf_number: "", esi_number: "", uan_number: ""
                });
            }
        } finally {
            setLoading(false);
        }
    };

    // 1. Calculate Gross
    const grossSalary = useMemo(() => Number(form.basic || 0) + Number(form.hra || 0) + Number(form.conveyance || 0) + Number(form.medical || 0) + Number(form.special_allowance || 0) + Number(form.other_allowance || 0), [form]);

    // 2. Auto Calculate Employee Deductions
    useEffect(() => {
        if (form.pf_applicable && form.basic) {
            setForm(f => ({ ...f, pf_amount: ((Number(f.basic) * Number(f.pf_percent || 0)) / 100).toFixed(2) }));
        } else if (!form.pf_applicable) {
            setForm(f => ({ ...f, pf_amount: "" }));
        }
    }, [form.basic, form.pf_percent, form.pf_applicable]);

    useEffect(() => {
        if (form.esi_applicable && grossSalary > 0) {
            setForm(f => ({ ...f, esi_amount: ((grossSalary * Number(f.esi_percent || 0)) / 100).toFixed(2) }));
        } else if (!form.esi_applicable) {
            setForm(f => ({ ...f, esi_amount: "" }));
        }
    }, [grossSalary, form.esi_percent, form.esi_applicable]);

    // 3. Auto Calculate Employer Contributions
    useEffect(() => {
        if (form.pf_applicable && form.basic) {
            setForm(f => ({ ...f, employer_pf: ((Number(f.basic) * Number(f.employer_pf_percent || 0)) / 100).toFixed(2) }));
        } else if (!form.pf_applicable) {
            setForm(f => ({ ...f, employer_pf: "" }));
        }
    }, [form.basic, form.employer_pf_percent, form.pf_applicable]);

    useEffect(() => {
        if (form.esi_applicable && grossSalary > 0) {
            setForm(f => ({ ...f, employer_esi: ((grossSalary * Number(f.employer_esi_percent || 0)) / 100).toFixed(2) }));
        } else if (!form.esi_applicable) {
            setForm(f => ({ ...f, employer_esi: "" }));
        }
    }, [grossSalary, form.employer_esi_percent, form.esi_applicable]);

    // Gratuity is typically provisioned on Basic Pay
    useEffect(() => {
        if (form.basic) {
            setForm(f => ({ ...f, gratuity: ((Number(f.basic) * Number(f.gratuity_percent || 0)) / 100).toFixed(2) }));
        }
    }, [form.basic, form.gratuity_percent]);

    // 4. Final Math
    const totalDeductions = useMemo(() => (form.pf_applicable ? Number(form.pf_amount || 0) : 0) + (form.esi_applicable ? Number(form.esi_amount || 0) : 0) + Number(form.professional_tax || 0) + Number(form.tds || 0) + Number(form.other_deductions || 0), [form]);
    const netPayable = grossSalary - totalDeductions;
    const ctc = grossSalary + Number(form.employer_pf || 0) + Number(form.employer_esi || 0) + Number(form.gratuity || 0);

    const currentStructure = salaryHistory.find(s => s.is_current);
    const previousGross = currentStructure ? Number(currentStructure.gross_salary || 0) : 0;
    const hikePercentage = useMemo(() => {
        if (previousGross === 0) return 0;
        return (((grossSalary - previousGross) / previousGross) * 100).toFixed(2);
    }, [grossSalary, previousGross]);

    const handleSaveSalary = async () => {
        if (!employee) return;
        if (grossSalary === 0) { toast.error("Gross salary cannot be zero"); return; }
        setSaving(true);
        try {
            if (salaryHistory.length > 0) {
                await supabase.from("employee_salary_structures").update({ is_current: false } as any).eq("employee_id", employee.id);
            }
            const payload = {
                employee_id: employee.id, salary_type: "monthly",
                basic: Number(form.basic), hra: Number(form.hra), conveyance: Number(form.conveyance), medical: Number(form.medical), special_allowance: Number(form.special_allowance), other_allowance: Number(form.other_allowance),
                pf_applicable: form.pf_applicable, esi_applicable: form.esi_applicable,
                pf_employee_contribution: form.pf_applicable ? Number(form.pf_amount) : 0, esi_employee_contribution: form.esi_applicable ? Number(form.esi_amount) : 0,
                professional_tax: Number(form.professional_tax), tds: Number(form.tds), other_deductions: Number(form.other_deductions),
                employer_pf: Number(form.employer_pf), employer_esi: Number(form.employer_esi), gratuity: Number(form.gratuity),
                pf_number: form.pf_number, esi_number: form.esi_number, uan_number: form.uan_number,
                gross_salary: grossSalary, total_deductions: totalDeductions, net_payable: netPayable, ctc: ctc, is_current: true
            };
            await supabase.from("employee_salary_structures").insert(payload as any);
            toast.success("Salary Setup Saved Successfully");
            fetchSalaryHistory();
            onOpenChange(false);
        } catch (err: any) { toast.error("Save failed"); } finally { setSaving(false); }
    };

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="max-w-[1100px] h-[95vh] flex flex-col p-0 overflow-hidden rounded-xl bg-slate-50/50">

                {/* 1. STICKY TOP HEADER */}
                <DialogHeader className="px-6 py-4 border-b bg-white flex flex-row items-center justify-between shrink-0 shadow-sm z-20">
                    <DialogTitle className="text-xl font-bold flex items-center gap-2 text-slate-800">
                        <div className="bg-indigo-100 p-2 rounded-lg text-indigo-700"><IndianRupee className="h-5 w-5" /></div>
                        Salary & CTC Planner <span className="text-slate-300 font-normal mx-1">|</span> <span className="text-indigo-900">{employee?.name}</span>
                    </DialogTitle>

                    {activeTab === "setup" && currentStructure && (
                        <div className="flex items-center gap-4 bg-slate-50 border px-4 py-1.5 rounded-lg mr-8">
                            <div className="text-right">
                                <p className="text-[10px] uppercase font-bold text-slate-500">Current Gross</p>
                                <p className="font-bold text-slate-800">₹{previousGross.toLocaleString()}</p>
                            </div>
                            <div className="w-px h-8 bg-slate-200"></div>
                            <div>
                                {Number(hikePercentage) !== 0 ? (
                                    <Badge className={`px-2.5 py-1 flex items-center gap-1 ${Number(hikePercentage) > 0 ? "bg-emerald-500 hover:bg-emerald-600" : "bg-rose-500 hover:bg-rose-600"} text-white border-none shadow-sm`}>
                                        {Number(hikePercentage) > 0 ? <ArrowUpRight className="h-3 w-3" /> : <ArrowDownRight className="h-3 w-3" />}
                                        {Math.abs(Number(hikePercentage))}% {Number(hikePercentage) > 0 ? "Hike" : "Drop"}
                                    </Badge>
                                ) : (
                                    <Badge variant="outline" className="text-slate-500 bg-white">No Change</Badge>
                                )}
                            </div>
                        </div>
                    )}
                </DialogHeader>

                {loading ? (
                    <div className="flex-1 flex justify-center items-center"><Loader2 className="animate-spin h-8 w-8 text-muted-foreground" /></div>
                ) : (
                    <Tabs value={activeTab} onValueChange={setActiveTab} className="flex-1 flex flex-col overflow-hidden">

                        <div className="px-6 py-2 bg-white border-b shrink-0 z-10 shadow-sm">
                            <TabsList className="grid w-[400px] grid-cols-2 bg-slate-100">
                                <TabsTrigger value="setup" className="data-[state=active]:bg-white data-[state=active]:shadow-sm data-[state=active]:text-indigo-700">
                                    <TrendingUp className="h-4 w-4 mr-2" /> Setup / Revise CTC
                                </TabsTrigger>
                                <TabsTrigger value="history" className="data-[state=active]:bg-white data-[state=active]:shadow-sm">
                                    <History className="h-4 w-4 mr-2" /> Increment History
                                </TabsTrigger>
                            </TabsList>
                        </div>

                        {/* 2. SCROLLABLE MIDDLE CONTENT */}
                        <TabsContent value="setup" className="flex-1 flex flex-col overflow-hidden m-0">

                            <ScrollArea className="flex-1 px-6 py-6">
                                <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 max-w-6xl mx-auto pb-4">

                                    {/* LEFT COLUMN: EARNINGS & COMPLIANCE */}
                                    <div className="space-y-6">
                                        <Card className="shadow-sm border-slate-200">
                                            <CardHeader className="py-3 border-b bg-indigo-50/30"><CardTitle className="text-sm flex items-center gap-2 text-indigo-900"><Wallet className="h-4 w-4" /> Fixed Earnings (Credit to Employee)</CardTitle></CardHeader>
                                            <CardContent className="pt-5 grid grid-cols-2 gap-5">
                                                <div className="space-y-1.5"><Label className="text-xs font-semibold text-slate-600">Basic Salary</Label><Input type="number" value={form.basic} onChange={e => setForm({ ...form, basic: e.target.value })} className="h-9 font-medium" /></div>
                                                <div className="space-y-1.5"><Label className="text-xs font-semibold text-slate-600">House Rent Allowance (HRA)</Label><Input type="number" value={form.hra} onChange={e => setForm({ ...form, hra: e.target.value })} className="h-9" /></div>
                                                <div className="space-y-1.5"><Label className="text-xs font-semibold text-slate-600">Conveyance</Label><Input type="number" value={form.conveyance} onChange={e => setForm({ ...form, conveyance: e.target.value })} className="h-9" /></div>
                                                <div className="space-y-1.5"><Label className="text-xs font-semibold text-slate-600">Medical Allowance</Label><Input type="number" value={form.medical} onChange={e => setForm({ ...form, medical: e.target.value })} className="h-9" /></div>
                                                <div className="space-y-1.5"><Label className="text-xs font-semibold text-slate-600">Special Allowance</Label><Input type="number" value={form.special_allowance} onChange={e => setForm({ ...form, special_allowance: e.target.value })} className="h-9" /></div>
                                                <div className="space-y-1.5"><Label className="text-xs font-semibold text-slate-600">Other Allowances</Label><Input type="number" value={form.other_allowance} onChange={e => setForm({ ...form, other_allowance: e.target.value })} className="h-9" /></div>
                                            </CardContent>
                                        </Card>

                                        <Card className="shadow-sm border-slate-200">
                                            <CardHeader className="py-3 border-b bg-slate-50/50"><CardTitle className="text-sm flex items-center gap-2 text-slate-700"><Landmark className="h-4 w-4" /> Statutory Account Numbers</CardTitle></CardHeader>
                                            <CardContent className="pt-5 grid grid-cols-1 md:grid-cols-3 gap-5">
                                                <div className="space-y-1.5"><Label className="text-xs font-semibold text-slate-600">UAN No.</Label><Input value={form.uan_number} onChange={e => setForm({ ...form, uan_number: e.target.value })} className="h-9" /></div>
                                                <div className="space-y-1.5"><Label className="text-xs font-semibold text-slate-600">PF Account No.</Label><Input value={form.pf_number} onChange={e => setForm({ ...form, pf_number: e.target.value })} className="h-9" /></div>
                                                <div className="space-y-1.5"><Label className="text-xs font-semibold text-slate-600">ESI No.</Label><Input value={form.esi_number} onChange={e => setForm({ ...form, esi_number: e.target.value })} className="h-9" /></div>
                                            </CardContent>
                                        </Card>
                                    </div>

                                    {/* RIGHT COLUMN: DEDUCTIONS & EMPLOYER CTC */}
                                    <div className="space-y-6">
                                        <Card className="shadow-sm border-rose-100 overflow-hidden">
                                            <CardHeader className="py-3 border-b bg-rose-50/80 flex flex-row items-center justify-between">
                                                <CardTitle className="text-sm text-rose-800">Employee Deductions (Debit)</CardTitle>
                                                <span className="text-[10px] text-rose-600 bg-rose-100 px-2 py-0.5 rounded-full font-bold">Deducted from Gross</span>
                                            </CardHeader>
                                            <CardContent className="pt-5 space-y-5 bg-white">
                                                <div className="grid grid-cols-1 gap-4">
                                                    <div className={`flex items-center justify-between p-3 rounded-lg border transition-colors ${form.pf_applicable ? 'bg-rose-50/30 border-rose-200' : 'bg-slate-50 border-slate-200'}`}>
                                                        <div className="flex items-center gap-3">
                                                            <Checkbox checked={form.pf_applicable} onCheckedChange={v => setForm({ ...form, pf_applicable: Boolean(v) })} />
                                                            <Label className="font-bold text-slate-700">EPF</Label>
                                                        </div>
                                                        <div className="flex items-center gap-2">
                                                            <Input placeholder="%" value={form.pf_percent} onChange={e => setForm({ ...form, pf_percent: e.target.value })} disabled={!form.pf_applicable} className="h-9 w-16 bg-white text-center" title="% of Basic" />
                                                            <span className="text-xs text-muted-foreground">%</span>
                                                            <Input value={form.pf_amount} readOnly className="h-9 w-24 bg-slate-100 font-mono text-slate-600 text-right" placeholder="₹ Amount" />
                                                        </div>
                                                    </div>

                                                    <div className={`flex items-center justify-between p-3 rounded-lg border transition-colors ${form.esi_applicable ? 'bg-rose-50/30 border-rose-200' : 'bg-slate-50 border-slate-200'}`}>
                                                        <div className="flex items-center gap-3">
                                                            <Checkbox checked={form.esi_applicable} onCheckedChange={v => setForm({ ...form, esi_applicable: Boolean(v) })} />
                                                            <Label className="font-bold text-slate-700">ESI</Label>
                                                        </div>
                                                        <div className="flex items-center gap-2">
                                                            <Input placeholder="%" value={form.esi_percent} onChange={e => setForm({ ...form, esi_percent: e.target.value })} disabled={!form.esi_applicable} className="h-9 w-16 bg-white text-center" title="% of Gross" />
                                                            <span className="text-xs text-muted-foreground">%</span>
                                                            <Input value={form.esi_amount} readOnly className="h-9 w-24 bg-slate-100 font-mono text-slate-600 text-right" placeholder="₹ Amount" />
                                                        </div>
                                                    </div>
                                                </div>
                                                <div className="grid grid-cols-3 gap-5">
                                                    <div className="space-y-1.5"><Label className="text-xs font-semibold text-slate-600">Professional Tax</Label><Input type="number" value={form.professional_tax} onChange={e => setForm({ ...form, professional_tax: e.target.value })} className="h-9" /></div>
                                                    <div className="space-y-1.5"><Label className="text-xs font-semibold text-slate-600">TDS (Income Tax)</Label><Input type="number" value={form.tds} onChange={e => setForm({ ...form, tds: e.target.value })} className="h-9" /></div>
                                                    <div className="space-y-1.5"><Label className="text-xs font-semibold text-slate-600">Other Deductions</Label><Input type="number" value={form.other_deductions} onChange={e => setForm({ ...form, other_deductions: e.target.value })} className="h-9" /></div>
                                                </div>
                                            </CardContent>
                                        </Card>

                                        <Card className="shadow-sm border-blue-100">
                                            <CardHeader className="py-3 border-b bg-blue-50/80 flex flex-row items-center justify-between">
                                                <CardTitle className="text-sm text-blue-900">Employer Contributions</CardTitle>
                                                <span className="text-[10px] text-blue-700 bg-blue-100 px-2 py-0.5 rounded-full font-bold">Added to CTC</span>
                                            </CardHeader>
                                            <CardContent className="pt-5 space-y-4">
                                                <div className="flex items-center gap-4 p-2">
                                                    <Label className="w-24 text-xs font-semibold text-slate-600">Employer EPF</Label>
                                                    <Input type="number" value={form.employer_pf_percent} onChange={e => setForm({ ...form, employer_pf_percent: e.target.value })} disabled={!form.pf_applicable} className="h-9 w-16 text-center" title="% of Basic" />
                                                    <span className="text-xs text-muted-foreground">%</span>
                                                    <Input type="number" value={form.employer_pf} readOnly className="h-9 flex-1 bg-slate-50 font-mono text-right" />
                                                </div>
                                                <div className="flex items-center gap-4 p-2">
                                                    <Label className="w-24 text-xs font-semibold text-slate-600">Employer ESI</Label>
                                                    <Input type="number" value={form.employer_esi_percent} onChange={e => setForm({ ...form, employer_esi_percent: e.target.value })} disabled={!form.esi_applicable} className="h-9 w-16 text-center" title="% of Gross" />
                                                    <span className="text-xs text-muted-foreground">%</span>
                                                    <Input type="number" value={form.employer_esi} readOnly className="h-9 flex-1 bg-slate-50 font-mono text-right" />
                                                </div>
                                                <div className="flex items-center gap-4 p-2">
                                                    <div className="w-24">
                                                        <Label className="text-xs font-semibold text-slate-600 block">Gratuity</Label>
                                                        <span className="text-[9px] text-muted-foreground leading-tight block">15/26 days provisioning</span>
                                                    </div>
                                                    <Input type="number" value={form.gratuity_percent} onChange={e => setForm({ ...form, gratuity_percent: e.target.value })} className="h-9 w-16 text-center" title="% of Basic" />
                                                    <span className="text-xs text-muted-foreground">%</span>
                                                    <Input type="number" value={form.gratuity} readOnly className="h-9 flex-1 bg-slate-50 font-mono text-right" />
                                                </div>
                                            </CardContent>
                                        </Card>
                                    </div>
                                </div>
                            </ScrollArea>

                            {/* 3. STICKY BOTTOM FOOTER (Totals & Save) */}
                            <div className="bg-white border-t px-6 py-5 shrink-0 z-20 shadow-[0_-10px_20px_-10px_rgba(0,0,0,0.1)] flex flex-col md:flex-row items-center justify-between gap-4">
                                <div className="flex items-center gap-6 md:gap-8 divide-x divide-slate-200 w-full md:w-auto">
                                    <div className="pr-2">
                                        <p className="text-[11px] uppercase font-bold text-slate-500 mb-1">Gross Salary</p>
                                        <h3 className="text-2xl font-bold text-slate-800 tracking-tight">₹{grossSalary.toLocaleString()}</h3>
                                    </div>
                                    <div className="px-6 md:px-8">
                                        <p className="text-[11px] uppercase font-bold text-rose-500 mb-1">Total Deductions</p>
                                        <h3 className="text-xl font-bold text-rose-600 tracking-tight">₹{totalDeductions.toLocaleString()}</h3>
                                    </div>
                                    <div className="px-6 md:px-8">
                                        <div className="flex items-center gap-1 mb-1">
                                            <p className="text-[11px] uppercase font-bold text-blue-600">Total CTC</p>
                                            <span title="Gross + Employer Contributions">
                                                <Info className="h-3 w-3 text-blue-400" />
                                            </span>
                                        </div>
                                        <h3 className="text-2xl font-bold text-blue-700 tracking-tight">₹{ctc.toLocaleString()}</h3>
                                    </div>
                                    <div className="pl-6 md:pl-8">
                                        <div className="bg-emerald-50 px-5 py-2 rounded-xl border border-emerald-200">
                                            <p className="text-[11px] uppercase font-bold text-emerald-800 mb-0.5">Net Payable (In-hand)</p>
                                            <h3 className="text-3xl font-black text-emerald-600 tracking-tight">₹{netPayable.toLocaleString()}</h3>
                                        </div>
                                    </div>
                                </div>
                                <Button
                                    onClick={handleSaveSalary}
                                    disabled={saving}
                                    className="h-14 px-10 text-lg font-semibold bg-indigo-600 hover:bg-indigo-700 text-white shadow-lg shadow-indigo-200 rounded-xl transition-all w-full md:w-auto shrink-0"
                                >
                                    {saving ? <Loader2 className="mr-2 h-5 w-5 animate-spin" /> : <Save className="mr-2 h-5 w-5" />}
                                    {currentStructure ? "Confirm Increment" : "Save Salary Setup"}
                                </Button>
                            </div>

                        </TabsContent>

                        {/* TAB 3: HISTORY */}
                        <TabsContent value="history" className="m-0 flex-1 overflow-y-auto bg-slate-50/50 p-6">
                            <div className="border rounded-xl overflow-hidden shadow-sm bg-white max-w-5xl mx-auto">
                                <Table>
                                    <TableHeader className="bg-slate-100">
                                        <TableRow>
                                            <TableHead className="font-semibold text-slate-700 py-4">Effective Date</TableHead>
                                            <TableHead className="font-semibold text-slate-700 py-4">Annual CTC</TableHead>
                                            <TableHead className="font-semibold text-slate-700 py-4">Monthly Gross</TableHead>
                                            <TableHead className="font-semibold text-slate-700 py-4">Monthly Net Payable</TableHead>
                                            <TableHead className="font-semibold text-slate-700 py-4">Status</TableHead>
                                        </TableRow>
                                    </TableHeader>
                                    <TableBody>
                                        {salaryHistory.length === 0 ? <TableRow><TableCell colSpan={5} className="text-center py-12 text-muted-foreground text-lg">No salary history found for this employee.</TableCell></TableRow> :
                                            salaryHistory.map(s => (
                                                <TableRow key={s.id} className="hover:bg-slate-50/80 transition-colors">
                                                    <TableCell className="font-medium text-slate-800 py-4">{new Date(s.created_at).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })}</TableCell>
                                                    <TableCell className="text-slate-600 font-bold py-4">₹{((s.ctc || s.gross_salary) * 12).toLocaleString()}</TableCell>
                                                    <TableCell className="text-slate-600 font-semibold py-4">₹{s.gross_salary?.toLocaleString()}</TableCell>
                                                    <TableCell className="text-emerald-600 font-bold py-4 text-base">₹{s.net_payable?.toLocaleString()}</TableCell>
                                                    <TableCell className="py-4">{s.is_current ? <Badge className="bg-emerald-100 text-emerald-700 border-none rounded-md px-3 py-1 shadow-none font-bold">Active Current</Badge> : <Badge variant="outline" className="rounded-md text-slate-500 bg-slate-50 px-3 py-1 font-semibold">Archived</Badge>}</TableCell>
                                                </TableRow>
                                            ))}
                                    </TableBody>
                                </Table>
                            </div>
                        </TabsContent>
                    </Tabs>
                )}
            </DialogContent>
        </Dialog>
    );
};