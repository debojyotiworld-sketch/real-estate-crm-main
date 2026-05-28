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
import { toast } from "sonner";
import { IndianRupee, History, TrendingUp, Loader2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";

export const EmployeeSalaryModal = ({ open, onOpenChange, employee }: any) => {
    const [loading, setLoading] = useState(false);
    const [saving, setSaving] = useState(false);
    const [activeTab, setActiveTab] = useState("setup");
    const [salaryHistory, setSalaryHistory] = useState<any[]>([]);
    
    const [form, setForm] = useState({
        basic: "", hra: "", conveyance: "", medical: "", special_allowance: "", other_allowance: "",
        pf_applicable: false, pf_percent: "12", pf_amount: "", 
        esi_applicable: false, esi_percent: "0.75", esi_amount: "", 
        professional_tax: "", tds: "", other_deductions: "",
        employer_pf: "", employer_esi: "", gratuity: "",
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
                    employer_pf: String(current.employer_pf || ""), employer_esi: String(current.employer_esi || ""), gratuity: String(current.gratuity || ""),
                    pf_number: current.pf_number || "", esi_number: current.esi_number || "", uan_number: current.uan_number || ""
                });
            } else {
                setActiveTab("setup");
                setForm({
                    basic: "", hra: "", conveyance: "", medical: "", special_allowance: "", other_allowance: "",
                    pf_applicable: false, pf_percent: "12", pf_amount: "", esi_applicable: false, esi_percent: "0.75", esi_amount: "", 
                    professional_tax: "", tds: "", other_deductions: "", employer_pf: "", employer_esi: "", gratuity: "",
                    pf_number: "", esi_number: "", uan_number: ""
                });
            }
        } finally {
            setLoading(false);
        }
    };

    const grossSalary = useMemo(() => Number(form.basic||0) + Number(form.hra||0) + Number(form.conveyance||0) + Number(form.medical||0) + Number(form.special_allowance||0) + Number(form.other_allowance||0), [form]);

    // Auto Calculate PF & ESI Percentages
    useEffect(() => {
        if(form.pf_applicable && form.basic) {
            const pfAmt = (Number(form.basic) * Number(form.pf_percent || 0)) / 100;
            setForm(f => ({ ...f, pf_amount: pfAmt.toFixed(2) }));
        } else if (!form.pf_applicable) {
            setForm(f => ({ ...f, pf_amount: "" }));
        }
    }, [form.basic, form.pf_percent, form.pf_applicable]);

    useEffect(() => {
        if(form.esi_applicable && grossSalary > 0) {
            const esiAmt = (grossSalary * Number(form.esi_percent || 0)) / 100;
            setForm(f => ({ ...f, esi_amount: esiAmt.toFixed(2) }));
        } else if (!form.esi_applicable) {
            setForm(f => ({ ...f, esi_amount: "" }));
        }
    }, [grossSalary, form.esi_percent, form.esi_applicable]);

    const totalDeductions = useMemo(() => (form.pf_applicable ? Number(form.pf_amount||0) : 0) + (form.esi_applicable ? Number(form.esi_amount||0) : 0) + Number(form.professional_tax||0) + Number(form.tds||0) + Number(form.other_deductions||0), [form]);
    const netPayable = grossSalary - totalDeductions;
    const ctc = grossSalary + Number(form.employer_pf||0) + Number(form.employer_esi||0) + Number(form.gratuity||0);

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
            <DialogContent className="max-w-[950px] max-h-[90vh] flex flex-col p-0 overflow-hidden rounded-xl">
                <DialogHeader className="px-6 py-4 border-b bg-muted/20">
                    <DialogTitle className="flex items-center gap-2"><IndianRupee className="h-5 w-5"/> Salary & Allowances Management — {employee?.name}</DialogTitle>
                </DialogHeader>
                
                {loading ? (
                    <div className="flex-1 flex justify-center items-center"><Loader2 className="animate-spin h-8 w-8 text-muted-foreground" /></div>
                ) : (
                    <Tabs value={activeTab} onValueChange={setActiveTab} className="flex-1 flex flex-col overflow-hidden">
                        <div className="px-6 pt-2"><TabsList className="grid w-[400px] grid-cols-2"><TabsTrigger value="setup"><TrendingUp className="h-4 w-4 mr-2"/> Setup / Revise</TabsTrigger><TabsTrigger value="history"><History className="h-4 w-4 mr-2"/> History</TabsTrigger></TabsList></div>
                        <div className="flex-1 overflow-y-auto p-6">
                            <TabsContent value="setup" className="m-0 space-y-6">
                                {currentStructure && (
                                    <div className="bg-blue-50 text-blue-800 p-3 rounded-lg flex items-center justify-between border border-blue-100">
                                        <div className="text-sm"><strong>Current Gross:</strong> ₹{previousGross}</div>
                                        {Number(hikePercentage) !== 0 && (
                                            <Badge className={Number(hikePercentage) > 0 ? "bg-green-600 border-none" : "bg-red-500 border-none text-white"}>
                                                {Number(hikePercentage) > 0 ? "+" : ""}{hikePercentage}% Hike
                                            </Badge>
                                        )}
                                    </div>
                                )}

                                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                                    {/* EARNINGS */}
                                    <div className="space-y-6">
                                        <Card className="shadow-sm">
                                            <CardHeader className="py-3 border-b"><CardTitle className="text-sm flex items-center gap-2">Earnings Setup (Credit)</CardTitle></CardHeader>
                                            <CardContent className="pt-4 grid grid-cols-2 gap-4">
                                                <div><Label className="text-xs">Basic</Label><Input type="number" value={form.basic} onChange={e=>setForm({...form, basic:e.target.value})} className="h-8 mt-1"/></div>
                                                <div><Label className="text-xs">HRA</Label><Input type="number" value={form.hra} onChange={e=>setForm({...form, hra:e.target.value})} className="h-8 mt-1"/></div>
                                                <div><Label className="text-xs">Conveyance</Label><Input type="number" value={form.conveyance} onChange={e=>setForm({...form, conveyance:e.target.value})} className="h-8 mt-1"/></div>
                                                <div><Label className="text-xs">Medical</Label><Input type="number" value={form.medical} onChange={e=>setForm({...form, medical:e.target.value})} className="h-8 mt-1"/></div>
                                                <div><Label className="text-xs">Sp. Allowance</Label><Input type="number" value={form.special_allowance} onChange={e=>setForm({...form, special_allowance:e.target.value})} className="h-8 mt-1"/></div>
                                                <div><Label className="text-xs">Other Allow</Label><Input type="number" value={form.other_allowance} onChange={e=>setForm({...form, other_allowance:e.target.value})} className="h-8 mt-1"/></div>
                                            </CardContent>
                                        </Card>

                                        <Card className="shadow-sm">
                                            <CardHeader className="py-3 border-b"><CardTitle className="text-sm">Account / References</CardTitle></CardHeader>
                                            <CardContent className="pt-4 grid grid-cols-1 md:grid-cols-3 gap-4">
                                                <div><Label className="text-xs">UAN No</Label><Input value={form.uan_number} onChange={e=>setForm({...form, uan_number:e.target.value})} className="h-8 mt-1"/></div>
                                                <div><Label className="text-xs">PF No</Label><Input value={form.pf_number} onChange={e=>setForm({...form, pf_number:e.target.value})} className="h-8 mt-1"/></div>
                                                <div><Label className="text-xs">ESI No</Label><Input value={form.esi_number} onChange={e=>setForm({...form, esi_number:e.target.value})} className="h-8 mt-1"/></div>
                                            </CardContent>
                                        </Card>
                                    </div>

                                    {/* DEDUCTIONS */}
                                    <div className="space-y-6">
                                        <Card className="shadow-sm border-red-100">
                                            <CardHeader className="py-3 border-b bg-red-50/50"><CardTitle className="text-sm text-red-800">Deductions (Debit)</CardTitle></CardHeader>
                                            <CardContent className="pt-4 space-y-4">
                                                <div className="grid grid-cols-1 gap-3">
                                                    <div className="flex items-center gap-3 bg-muted/40 p-3 rounded-lg border">
                                                        <Checkbox checked={form.pf_applicable} onCheckedChange={v=>setForm({...form, pf_applicable:Boolean(v)})} />
                                                        <Label className="font-semibold w-16">PF (%)</Label>
                                                        <Input placeholder="%" value={form.pf_percent} onChange={e=>setForm({...form, pf_percent:e.target.value})} disabled={!form.pf_applicable} className="h-8 w-20" />
                                                        <Input value={form.pf_amount} readOnly className="h-8 bg-muted font-mono" placeholder="₹ Amount" />
                                                    </div>
                                                    <div className="flex items-center gap-3 bg-muted/40 p-3 rounded-lg border">
                                                        <Checkbox checked={form.esi_applicable} onCheckedChange={v=>setForm({...form, esi_applicable:Boolean(v)})} />
                                                        <Label className="font-semibold w-16">ESI (%)</Label>
                                                        <Input placeholder="%" value={form.esi_percent} onChange={e=>setForm({...form, esi_percent:e.target.value})} disabled={!form.esi_applicable} className="h-8 w-20" />
                                                        <Input value={form.esi_amount} readOnly className="h-8 bg-muted font-mono" placeholder="₹ Amount" />
                                                    </div>
                                                </div>
                                                <div className="grid grid-cols-3 gap-4">
                                                    <div><Label className="text-xs">Prof. Tax</Label><Input type="number" value={form.professional_tax} onChange={e=>setForm({...form, professional_tax:e.target.value})} className="h-8 mt-1"/></div>
                                                    <div><Label className="text-xs">TDS</Label><Input type="number" value={form.tds} onChange={e=>setForm({...form, tds:e.target.value})} className="h-8 mt-1"/></div>
                                                    <div><Label className="text-xs">Other Deduct</Label><Input type="number" value={form.other_deductions} onChange={e=>setForm({...form, other_deductions:e.target.value})} className="h-8 mt-1"/></div>
                                                </div>
                                            </CardContent>
                                        </Card>

                                        <Card className="shadow-sm">
                                            <CardHeader className="py-3 border-b"><CardTitle className="text-sm">Employer Contributions</CardTitle></CardHeader>
                                            <CardContent className="pt-4 grid grid-cols-3 gap-4">
                                                <div><Label className="text-xs">PF</Label><Input type="number" value={form.employer_pf} onChange={e=>setForm({...form, employer_pf:e.target.value})} className="h-8 mt-1"/></div>
                                                <div><Label className="text-xs">ESI</Label><Input type="number" value={form.employer_esi} onChange={e=>setForm({...form, employer_esi:e.target.value})} className="h-8 mt-1"/></div>
                                                <div><Label className="text-xs">Gratuity</Label><Input type="number" value={form.gratuity} onChange={e=>setForm({...form, gratuity:e.target.value})} className="h-8 mt-1"/></div>
                                            </CardContent>
                                        </Card>
                                    </div>
                                </div>

                                {/* TOTALS BOARD */}
                                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 bg-muted border p-4 rounded-xl text-center shadow-inner mt-4">
                                    <div><p className="text-[11px] uppercase font-bold text-muted-foreground">Gross</p><h3 className="text-xl font-bold">₹{grossSalary}</h3></div>
                                    <div><p className="text-[11px] uppercase font-bold text-muted-foreground">Deductions</p><h3 className="text-xl font-bold text-red-600">₹{totalDeductions}</h3></div>
                                    <div className="md:border-l border-gray-300"><p className="text-[11px] uppercase font-bold text-muted-foreground">Total CTC</p><h3 className="text-xl font-bold text-blue-600">₹{ctc}</h3></div>
                                    <div className="md:border-l border-gray-300"><p className="text-[11px] uppercase font-bold text-muted-foreground">Net Payable</p><h3 className="text-xl font-bold text-green-600">₹{netPayable}</h3></div>
                                </div>
                                <Button onClick={handleSaveSalary} disabled={saving} className="w-full h-12 text-lg mt-2">{saving ? "Saving..." : "Save Salary Structure"}</Button>
                            </TabsContent>
                            
                            {/* HISTORY */}
                            <TabsContent value="history" className="m-0">
                                <Table>
                                    <TableHeader><TableRow><TableHead>Date</TableHead><TableHead>Gross</TableHead><TableHead>Net</TableHead><TableHead>Status</TableHead></TableRow></TableHeader>
                                    <TableBody>
                                        {salaryHistory.length === 0 ? <TableRow><TableCell colSpan={4} className="text-center py-6 text-muted-foreground">No history found.</TableCell></TableRow> :
                                        salaryHistory.map(s => <TableRow key={s.id}><TableCell>{new Date(s.created_at).toLocaleDateString()}</TableCell><TableCell>₹{s.gross_salary}</TableCell><TableCell>₹{s.net_payable}</TableCell><TableCell>{s.is_current ? <Badge className="bg-green-100 text-green-800 border-none rounded-full">Active</Badge> : <Badge variant="outline" className="rounded-full">Archived</Badge>}</TableCell></TableRow>)}
                                    </TableBody>
                                </Table>
                            </TabsContent>
                        </div>
                    </Tabs>
                )}
            </DialogContent>
        </Dialog>
    );
};