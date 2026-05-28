import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Download, Edit, Trash2, Eye, IndianRupeeIcon } from "lucide-react";
import { cn } from "@/lib/utils";
import React, { useEffect, useRef, useState, useMemo, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { toast } from "sonner";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Input } from "@/components/ui/input";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";

const employeesTable = () => supabase.from("employees");
type Employee = {
    id: string;
    name?: string;
    email?: string;
    phone?: string;
    department?: string;
    designation?: string;
    address?: string;
    city?: string;
    state?: string;
    zone_id?: string | null;
    branch_id?: string | null;
    pincode?: string;
    role_id?: string | null;
    joining_date?: string;
    experience?: string;
    total_experience?: string;
    previous_company?: string;
    previous_document_type?: string;
    previous_document_path?: string;
    aadhar_number?: string;
    pan_number?: string;
    reporting_manager_name?: string;
    reporting_manager_email?: string;
    reporting_manager_phone?: string;
    status?: string;
    photo_path?: string;
    attendance_type?: string;
    employee_code?: string;
    roles?: { name?: string };
    branches?: { branch_name?: string };
};

type Branch = {
    id: string;
    branch_name: string;
    branch_code?: string;
};

type Mode = "amount" | "percent";
type UploadField = "photo" | "previous_document";

const toNum = (val: any) => Number(val || 0);
const round2 = (val: number) => Math.round(val * 100) / 100;
const getErrorMessage = (err: any) => err?.message || "Something went wrong";

const employeeStatus: Record<string, any> = {
    active: { label: "Active", bg: "bg-green-100", text: "text-green-700" },
    probation: { label: "Probation", bg: "bg-yellow-100", text: "text-yellow-700" },
    confirmed: { label: "Confirmed", bg: "bg-blue-100", text: "text-blue-700" },
    notice_period: { label: "Notice Period", bg: "bg-orange-100", text: "text-orange-700" },
    resigned: { label: "Resigned", bg: "bg-red-100", text: "text-red-700" },
};

const Employee = () => {
    const FormRow = ({ label, children }: any) => (
        <div className="flex flex-col gap-1">
            <label className="text-sm text-muted-foreground">{label}</label>
            {children}
        </div>
    );
    const [branches, setBranches] = useState<Branch[]>([]);
    const [salaryForm, setSalaryForm] = useState({
        salary_type: "monthly",
        basic: "",
        hra: "",
        conveyance: "",
        medical: "",
        special_allowance: "",
        other_allowance: "",
        pf_applicable: false,
        esi_applicable: false,
        pf_number: "",
        esi_number: "",
        uan_number: "",
        pf_employee_contribution_percent: 0,
        pf_employee_contribution_amount: 0,
        esi_contribution_percent: 0,
        esi_contribution_amount: 0,
        professional_tax: 0,
        tds: 0,
        other_deductions: 0,
    });

    type ZoneRow = {
        id: string;
        zone_name: string | null;
        zone_code: string | null;
        city: string | null;
        state: string | null;
        active_locations: string[] | null;
        locations: string[] | null;
    };

    const [zoneInfo, setZoneInfo] = useState<ZoneRow | null>(null);

    const loadZoneLocations = useCallback(async (zoneId?: string | number | null) => {
        if (!zoneId) {
            setZoneInfo(null);
            return;
        }
        const { data, error } = await supabase
            .from("zones")
            .select("id, zone_name, zone_code, city, state, active_locations, locations")
            .eq("id", String(zoneId))
            .maybeSingle();

        if (error) {
            console.error(error);
            setZoneInfo(null);
            return;
        }
        setZoneInfo(data as ZoneRow | null);
    }, []);

    const INDIAN_STATES = [
        "Andhra Pradesh", "Arunachal Pradesh", "Assam", "Bihar", "Chhattisgarh", "Goa", "Gujarat", 
        "Haryana", "Himachal Pradesh", "Jharkhand", "Karnataka", "Kerala", "Madhya Pradesh", 
        "Maharashtra", "Manipur", "Meghalaya", "Mizoram", "Nagaland", "Odisha", "Punjab", 
        "Rajasthan", "Sikkim", "Tamil Nadu", "Telangana", "Tripura", "Uttar Pradesh", "Uttarakhand", "West Bengal"
    ];

    const grossSalary = useMemo(() => {
        return (
            Number(salaryForm.basic || 0) +
            Number(salaryForm.hra || 0) +
            Number(salaryForm.conveyance || 0) +
            Number(salaryForm.medical || 0) +
            Number(salaryForm.special_allowance || 0) +
            Number(salaryForm.other_allowance || 0)
        );
    }, [salaryForm]);

    const pfBase = useMemo(() => toNum(salaryForm.basic), [salaryForm.basic]);
    const esiBase = useMemo(() => toNum(grossSalary), [grossSalary]);

    const [pfMode, setPfMode] = useState<Mode>("amount");
    const [esiMode, setEsiMode] = useState<Mode>("amount");

    const pfLastEdit = useRef<"amount" | "percent" | null>(null);
    const esiLastEdit = useRef<"amount" | "percent" | null>(null);

    useEffect(() => {
        if (!salaryForm.pf_applicable) return;
        const amt = toNum(salaryForm.pf_employee_contribution_amount);
        const pct = toNum(salaryForm.pf_employee_contribution_percent);

        if (pfLastEdit.current === "percent") {
            const newAmt = round2((pfBase * pct) / 100);
            if (newAmt !== amt) {
                setSalaryForm((prev) => ({ ...prev, pf_employee_contribution_amount: newAmt }));
            }
        } else if (pfLastEdit.current === "amount") {
            const newPct = pfBase > 0 ? round2((amt / pfBase) * 100) : 0;
            if (newPct !== pct) {
                setSalaryForm((prev) => ({ ...prev, pf_employee_contribution_percent: newPct }));
            }
        }
    }, [salaryForm.pf_applicable, salaryForm.pf_employee_contribution_amount, salaryForm.pf_employee_contribution_percent, pfBase]);

    useEffect(() => {
        if (!salaryForm.pf_applicable || !salaryForm.esi_applicable) return;
        const amt = toNum(salaryForm.esi_contribution_amount);
        const pct = toNum(salaryForm.esi_contribution_percent);

        if (esiLastEdit.current === "percent") {
            const newAmt = round2((esiBase * pct) / 100);
            if (newAmt !== amt) {
                setSalaryForm((prev) => ({ ...prev, esi_contribution_amount: newAmt }));
            }
        } else if (esiLastEdit.current === "amount") {
            const newPct = esiBase > 0 ? round2((amt / esiBase) * 100) : 0;
            if (newPct !== pct) {
                setSalaryForm((prev) => ({ ...prev, esi_contribution_percent: newPct }));
            }
        }
    }, [salaryForm.pf_applicable, salaryForm.esi_applicable, salaryForm.esi_contribution_amount, salaryForm.esi_contribution_percent, esiBase]);

    const totalDeductions = useMemo(() => {
        const pf = salaryForm.pf_applicable ? toNum(salaryForm.pf_employee_contribution_amount) : 0;
        const esi = salaryForm.esi_applicable ? toNum(salaryForm.esi_contribution_amount) : 0;
        return pf + esi + toNum(salaryForm.professional_tax) + toNum(salaryForm.tds) + toNum(salaryForm.other_deductions);
    }, [salaryForm]);

    const netPayable = useMemo(() => grossSalary - totalDeductions, [grossSalary, totalDeductions]);

    const [employees, setEmployees] = useState<Employee[]>([]);
    const [loadingEmployees, setLoadingEmployees] = useState(true);
    const [roles, setRoles] = useState<{ id: string; name: string }[]>([]);
    const [avatarPreview, setAvatarPreview] = useState<string | null>(null);
    const [selectedEmployee, setSelectedEmployee] = useState<Employee | null>(null);
    const [isViewOpen, setIsViewOpen] = useState(false);
    const [isEditOpen, setIsEditOpen] = useState(false);

    type SalaryStructureRow = {
        id?: string;
        employee_id?: string;
        basic: number | string;
        hra?: number | string | null;
        conveyance?: number | string | null;
        medical?: number | string | null;
        special_allowance?: number | string | null;
        other_allowance?: number | string | null;
        gross_salary?: number | string | null;
        total_deductions?: number | string | null;
        net_payable?: number | string | null;
        created_at?: string;
    };
    const [salaryStructure, setSalaryStructure] = useState<SalaryStructureRow | null>(null);
    const [isAddOpen, setIsAddOpen] = useState(false);
    const [isPassOpen, setIsPassOpen] = useState(false);
    const [tempCreds, setTempCreds] = useState<{ email: string; password: string } | null>(null);
    const [saving, setSaving] = useState(false);
    const [employeeCode, setEmployeeCode] = useState("");
    const MAX_FILE_SIZE = 110 * 1024;
    const [fileError, setFileError] = useState("");
    const [isSalaryOpen, setIsSalaryOpen] = useState(false);
    const [salaryEmployee, setSalaryEmployee] = useState<Employee | null>(null);

    const [editPhotoFile, setEditPhotoFile] = useState<File | null>(null);
    const [form, setForm] = useState({
        name: "", email: "", phone: "", department: "", address: "", city: "", state: "", zone_id: "", pincode: "", hra: "", designation: "",
        aadhar_number: "", pan_number: "", role_id: "", status: "", joining_date: "", experience: "", total_experience: "", previous_company: "",
        previous_document_type: "", previous_document_file: null as File | null, reporting_manager_name: "", reporting_manager_email: "", reporting_manager_phone: "",
        photo_file: null as File | null, attendance_type: "", branch_id: null as string | null,
    });

    const [zonesOptions, setZonesOptions] = useState<{ value: string; label: string }[]>([]);
    const [loadingZones, setLoadingZones] = useState(false);

    const fetchBranches = useCallback(async () => {
        const { data, error } = await supabase.from("branches").select("id, branch_name, branch_code").order("branch_name");
        if (error) {
            toast.error("Failed to load branches");
            return;
        }
        setBranches((data ?? []) as Branch[]);
    }, []);

    useEffect(() => { void fetchBranches(); }, [fetchBranches]);

    const fetchZonesOptionsByBranch = useCallback(async (branchId?: string | null) => {
        if (!branchId) {
            setZonesOptions([]);
            return;
        }
        setLoadingZones(true);
        const { data, error } = await supabase.from("zones").select("id, zone_name").eq("branch_id", branchId).order("zone_name");
        setLoadingZones(false);
        if (error) {
            setZonesOptions([]);
            return;
        }
        setZonesOptions((data ?? []).map((z) => ({ value: String(z.id), label: z.zone_name ?? "—" })));
    }, []);

    useEffect(() => { void fetchZonesOptionsByBranch(form.branch_id); }, [form.branch_id, fetchZonesOptionsByBranch]);

    const [search, setSearch] = useState("");
    const [debouncedSearch, setDebouncedSearch] = useState("");
    const [page, setPage] = useState(1);
    const [pageSize] = useState(10);
    const [totalCount, setTotalCount] = useState(0);

    useEffect(() => {
        const timer = setTimeout(() => { setDebouncedSearch(search); setPage(1); }, 400);
        return () => clearTimeout(timer);
    }, [search]);

    const fetchEmployees = async () => {
        setLoadingEmployees(true);
        const from = (page - 1) * pageSize;
        const to = from + pageSize - 1;

        let query = employeesTable().select(
            `id, employee_code, name, email, aadhar_number, address, state, city, zone_id, branch_id, branches ( branch_name ), pincode, pan_number, total_experience, joining_date, previous_document_path, photo_url, previous_document_type, designation, reporting_manager_email, reporting_manager_phone, phone, department, status, attendance_type, roles ( name )`,
            { count: "exact" }
        );

        if (debouncedSearch.trim()) {
            query = query.or(`name.ilike.%${debouncedSearch}%, email.ilike.%${debouncedSearch}%, employee_code.ilike.%${debouncedSearch}%, phone.ilike.%${debouncedSearch}%`);
        }

        const { data, error, count } = await query.range(from, to);
        if (!error) {
            setEmployees(data ?? []);
            setTotalCount(count ?? 0);
        }
        setLoadingEmployees(false);
    };

    useEffect(() => {
        const fetchRoles = async () => {
            const { data } = await supabase.from("roles").select("id, name").order("name");
            if (data) setRoles(data);
        };
        fetchRoles();
        fetchEmployees();
    }, [page, debouncedSearch]);

    const generateEmployeeCode = async (department: string) => {
        if (!department) return;
        const prefix = `PR${new Date().getFullYear().toString().slice(-2)}${department[0].toUpperCase()}`;
        const { count } = await employeesTable().select("employee_code", { count: "exact", head: true });
        setEmployeeCode(`${prefix}-${String((count ?? 0) + 1).padStart(3, "0")}`);
    };

    useEffect(() => { if (form.department) generateEmployeeCode(form.department); }, [form.department]);

    const uploadFile = async (file: File, field: UploadField): Promise<string> => {
        const formData = new FormData();
        formData.append("file", file);
        formData.append("field", field);
        const session = (await supabase.auth.getSession()).data.session;
        const { data, error } = await supabase.functions.invoke("upload-employee-documents", {
            method: "POST", body: formData, headers: { Authorization: `Bearer ${session?.access_token}` },
        });
        if (error || !data?.url) throw new Error(error?.message || "File upload failed");
        return data.url;
    };

    const handleAddEmployee = async () => {
        if (!employeeCode || !form.name || !form.email || !form.role_id) {
            toast.error("Please fill required fields");
            return;
        }
        setSaving(true);
        try {
            const payload = {
                employee_code: employeeCode, name: form.name, email: form.email, status: form.status || "active",
                branch_id: form.branch_id ? String(form.branch_id) : null, zone_id: form.zone_id ? String(form.zone_id) : null,
                department: form.department || null, designation: form.designation || null, role_id: form.role_id || null,
            };
            const { data, error } = await supabase.functions.invoke("create-employee", { body: payload });
            if (error || !data?.success) throw new Error(data?.message || "Creation failed");

            setTempCreds({ email: form.email, password: data.tempPassword });
            setIsPassOpen(true);
            toast.success("Employee created successfully");
            setIsAddOpen(false);
            await fetchEmployees();
        } catch (err: any) {
            toast.error(err.message || "Something went wrong");
        } finally {
            setSaving(false);
        }
    };

    const openViewModal = async (emp: Employee) => {
        setSelectedEmployee(emp);
        setIsViewOpen(true);
        await loadZoneLocations(emp.zone_id ?? null);
        const { data } = await supabase.from("employee_salary_structures").select("*").eq("employee_id", emp.id).order("created_at", { ascending: false }).maybeSingle();
        if (data) setSalaryStructure(data);
    };

    const openEditModal = (emp: Employee) => {
        setSelectedEmployee(emp);
        setForm({
            name: emp.name ?? "", email: emp.email ?? "", phone: emp.phone ?? "", department: emp.department ?? "", designation: emp.designation ?? "",
            address: emp.address ?? "", city: emp.city ?? "", state: emp.state ?? "", zone_id: emp.zone_id ? String(emp.zone_id) : "",
            branch_id: emp.branch_id ? String(emp.branch_id) : "", attendance_type: emp.attendance_type ?? "office", pincode: emp.pincode ?? "",
            role_id: emp.role_id ? String(emp.role_id) : "", joining_date: emp.joining_date ?? "", experience: emp.experience ?? "",
            total_experience: emp.total_experience ?? "", previous_company: emp.previous_company ?? "", previous_document_type: emp.previous_document_type ?? "",
            aadhar_number: emp.aadhar_number ?? "", pan_number: emp.pan_number ?? "", reporting_manager_name: emp.reporting_manager_name ?? "",
            reporting_manager_email: emp.reporting_manager_email ?? "", reporting_manager_phone: emp.reporting_manager_phone ?? "", status: emp.status ?? "active",
            photo_file: null, previous_document_file: null, hra: "",
        });
        if (emp.branch_id) void fetchZonesOptionsByBranch(String(emp.branch_id));
        setAvatarPreview(emp.photo_path ?? null);
        setIsEditOpen(true);
    };

    const handleUpdateEmployee = async () => {
        if (!selectedEmployee) return;
        setSaving(true);
        try {
            const payload: Record<string, unknown> = {};
            if (form.name !== selectedEmployee.name) payload.name = form.name;
            if (form.email !== selectedEmployee.email) payload.email = form.email;
            if (form.phone !== selectedEmployee.phone) payload.phone = form.phone;
            if (form.status !== selectedEmployee.status) payload.status = form.status;

            const { error } = await employeesTable().update(payload as never).eq("id", selectedEmployee.id);
            if (error) throw error;
            toast.success("Employee updated successfully");
            setIsEditOpen(false);
            fetchEmployees();
        } catch (err) {
            toast.error("Update failed");
        } finally {
            setSaving(false);
        }
    };

    const handleDeleteEmployee = async (emp: Employee) => {
        if (!confirm(`Are you sure you want to delete "${emp.employee_code}"?`)) return;
        const { error } = await employeesTable().delete().eq("id", emp.id);
        if (error) toast.error(getErrorMessage(error));
        else { toast.success("Employee deleted"); fetchEmployees(); }
    };

    const handleSaveSalary = async () => {
        if (!salaryEmployee) return;
        const payload = {
            employee_id: salaryEmployee.id, salary_type: salaryForm.salary_type, basic: toNum(salaryForm.basic),
            hra: toNum(salaryForm.hra), conveyance: toNum(salaryForm.conveyance), medical: toNum(salaryForm.medical),
            special_allowance: toNum(salaryForm.special_allowance), other_allowance: toNum(salaryForm.other_allowance),
            pf_applicable: salaryForm.pf_applicable, esi_applicable: salaryForm.esi_applicable,
            gross_salary: grossSalary, total_deductions: totalDeductions, net_payable: netPayable, is_current: true
        };
        const { error } = await supabase.from("employee_salary_structures").insert(payload as never);
        if (error) toast.error("Salary save failed");
        else { toast.success("Salary structure saved"); setIsSalaryOpen(false); }
    };

    const openSalaryModal = async (emp: Employee) => {
        setSalaryEmployee(emp);
        const { data } = await supabase.from("employee_salary_structures").select("*").eq("employee_id", emp.id).order("created_at", { ascending: false }).limit(1).maybeSingle();
        if (data) {
            setSalaryForm({
                salary_type: data.salary_type, basic: String(data.basic), hra: String(data.hra), conveyance: String(data.conveyance),
                medical: String(data.medical), special_allowance: String(data.special_allowance), other_allowance: String(data.other_allowance),
                pf_applicable: !!data.pf_applicable, esi_applicable: !!data.esi_applicable, pf_number: "", esi_number: "", uan_number: "",
                pf_employee_contribution_percent: 0, pf_employee_contribution_amount: toNum(data.pf_employee_contribution),
                esi_contribution_percent: 0, esi_contribution_amount: toNum(data.esi_employee_contribution),
                professional_tax: toNum(data.professional_tax), tds: toNum(data.tds), other_deductions: toNum(data.other_deductions)
            });
        }
        setIsSalaryOpen(true);
    };

    return (
        <div className="rounded-xl border bg-card">
            <CardHeader className="flex flex-row items-center justify-between">
                <CardTitle>Employee Directory</CardTitle>
                <div className="flex items-center gap-3">
                    <Input placeholder="Search employee..." value={search} onChange={(e) => setSearch(e.target.value)} className="w-[250px]" />
                    <Button onClick={() => setIsAddOpen(true)}>+ Add Employee</Button>
                </div>
            </CardHeader>

            <CardContent className="p-0">
                <Table>
                    <TableHeader>
                        <TableRow className="bg-muted/50">
                            <TableHead>Employee ID</TableHead>
                            <TableHead>Name</TableHead>
                            <TableHead>Branch</TableHead>
                            <TableHead>Designation</TableHead>
                            <TableHead>Status</TableHead>
                            <TableHead>Action</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {loadingEmployees ? (
                            <TableRow><TableCell colSpan={6} className="text-center py-6">Loading employees...</TableCell></TableRow>
                        ) : employees.length === 0 ? (
                            <TableRow><TableCell colSpan={6} className="text-center py-6">No employees found</TableCell></TableRow>
                        ) : (
                            employees.map((emp) => (
                                <TableRow key={emp.id}>
                                    <TableCell className="font-medium">{emp.employee_code}</TableCell>
                                    <TableCell>{emp.name}</TableCell>
                                    <TableCell>{emp.branches?.branch_name ?? "-"}</TableCell>
                                    <TableCell className="uppercase">{emp.designation ?? "—"}</TableCell>
                                    <TableCell>
                                        <Badge variant="outline" className={cn(employeeStatus[emp.status || "active"].bg, employeeStatus[emp.status || "active"].text, "border-0")}>
                                            {employeeStatus[emp.status || "active"].label}
                                        </Badge>
                                    </TableCell>
                                    <TableCell className="flex items-center gap-2">
                                        <Button size="sm" variant="default" onClick={() => void openSalaryModal(emp)}><IndianRupeeIcon className="h-4 w-4" /></Button>
                                        <Button size="sm" variant="secondary" onClick={() => openViewModal(emp)}><Eye className="h-4 w-4" /></Button>
                                        <Button size="sm" variant="outline" onClick={() => openEditModal(emp)}><Edit className="h-4 w-4" /></Button>
                                        <Button size="sm" variant="destructive" onClick={() => handleDeleteEmployee(emp)}><Trash2 className="h-4 w-4" /></Button>
                                    </TableCell>
                                </TableRow>
                            ))
                        )}
                    </TableBody>
                </Table>
            </CardContent>

            {/* VIEW EMPLOYEE MODAL */}
            <Dialog open={isViewOpen} onOpenChange={setIsViewOpen}>
                <DialogContent className="sm:max-w-[700px]">
                    <DialogHeader><DialogTitle>Employee Profiles</DialogTitle></DialogHeader>
                    {selectedEmployee && (
                        <div className="space-y-4 text-sm pt-4">
                            <div className="grid grid-cols-2 gap-4 border p-4 rounded-xl">
                                <div><strong>Name:</strong> {selectedEmployee.name}</div>
                                <div><strong>Code:</strong> {selectedEmployee.employee_code}</div>
                                <div><strong>Department:</strong> {selectedEmployee.department || "—"}</div>
                                <div><strong>Designation:</strong> {selectedEmployee.designation || "—"}</div>
                                <div><strong>Assigned Branch:</strong> {selectedEmployee.branches?.branch_name || "—"}</div>
                                <div><strong>Joining Date:</strong> {selectedEmployee.joining_date || "—"}</div>
                            </div>
                        </div>
                    )}
                </DialogContent>
            </Dialog>

            {/* ADD EMPLOYEE MODAL */}
            <Dialog open={isAddOpen} onOpenChange={setIsAddOpen}>
                <DialogContent className="sm:max-w-[650px] h-[80vh] flex flex-col p-0">
                    <DialogHeader className="px-6 py-4 border-b"><DialogTitle>Add New Employee</DialogTitle></DialogHeader>
                    <ScrollArea className="flex-1 p-6 space-y-4">
                        <div className="space-y-4">
                            <div className="grid grid-cols-2 gap-4">
                                <FormRow label="Employee Code"><Input value={employeeCode} disabled className="bg-muted font-mono" /></FormRow>
                                <FormRow label="Full Name *"><Input placeholder="John Doe" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} /></FormRow>
                                <FormRow label="Email *"><Input type="email" placeholder="john@company.com" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} /></FormRow>
                                <FormRow label="Department"><Select value={form.department} onValueChange={(v) => setForm({ ...form, department: v })}><SelectTrigger><SelectValue placeholder="Select" /></SelectTrigger><SelectContent><SelectItem value="HR">HR</SelectItem><SelectItem value="Sales">Sales</SelectItem><SelectItem value="IT">IT</SelectItem></SelectContent></Select></FormRow>
                                <FormRow label="Branch *"><Select value={form.branch_id || ""} onValueChange={(v) => setForm({ ...form, branch_id: v })}><SelectTrigger><SelectValue placeholder="Select Branch" /></SelectTrigger><SelectContent>{branches.map(b => <SelectItem key={b.id} value={b.id}>{b.branch_name}</SelectItem>)}</SelectContent></Select></FormRow>
                                <FormRow label="Role *"><Select value={form.role_id} onValueChange={(v) => setForm({ ...form, role_id: v })}><SelectTrigger><SelectValue placeholder="Select" /></SelectTrigger><SelectContent>{roles.map(r => <SelectItem key={r.id} value={r.id}>{r.name}</SelectItem>)}</SelectContent></Select></FormRow>
                            </div>
                            <div className="border p-4 rounded-xl space-y-4 bg-muted/20">
                                <h3 className="font-semibold text-sm">Identity & KYC Verification</h3>
                                <div className="grid grid-cols-2 gap-4">
                                    <FormRow label="Aadhar Number"><Input placeholder="12 Digit Number" value={form.aadhar_number} onChange={(e) => setForm({ ...form, aadhar_number: e.target.value })} /></FormRow>
                                    <FormRow label="Upload Aadhar Photo"><Input type="file" accept="image/*" onChange={(e) => setForm({ ...form, photo_file: e.target.files?.[0] || null })} /></FormRow>
                                </div>
                            </div>
                        </div>
                    </ScrollArea>
                    <DialogFooter className="px-6 py-4 border-t"><Button onClick={handleAddEmployee} disabled={saving}>{saving ? "Saving..." : "Save Employee"}</Button></DialogFooter>
                </DialogContent>
            </Dialog>

            {/* SALARY STRUCTURE CONFIG MODAL */}
            <Dialog open={isSalaryOpen} onOpenChange={setIsSalaryOpen}>
                <DialogContent className="sm:max-w-[500px]">
                    <DialogHeader><DialogTitle>Salary Configuration</DialogTitle></DialogHeader>
                    <div className="space-y-4 pt-4">
                        <FormRow label="Basic Base Salary"><Input type="number" value={salaryForm.basic} onChange={(e) => setSalaryForm({ ...salaryForm, basic: e.target.value })} /></FormRow>
                        <FormRow label="HRA Allowance"><Input type="number" value={salaryForm.hra} onChange={(e) => setSalaryForm({ ...salaryForm, hra: e.target.value })} /></FormRow>
                        <div className="flex justify-between items-center bg-muted p-3 rounded-lg font-bold">
                            <span>Gross Calculated Salary:</span><span>₹{grossSalary}</span>
                        </div>
                        <Button onClick={handleSaveSalary} className="w-full">Save Structure</Button>
                    </div>
                </DialogContent>
            </Dialog>
        </div>
    );
};

export default Employee;