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

const getErrorMessage = (err: any) => {
    return err?.message || "Something went wrong";
};

const employeeStatus: Record<string, any> = {
    active: {
        label: "Active",
        bg: "bg-green-100",
        text: "text-green-700",
    },
    probation: {
        label: "Probation",
        bg: "bg-yellow-100",
        text: "text-yellow-700",
    },
    confirmed: {
        label: "Confirmed",
        bg: "bg-blue-100",
        text: "text-blue-700",
    },
    resigned: {
        label: "Resigned",
        bg: "bg-red-100",
        text: "text-red-700",
    },
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

        const row = (data ?? null) as ZoneRow | null;
        setZoneInfo(row);
    }, []);

    const INDIAN_STATES = [
        "Andhra Pradesh",
        "Andaman & Nicobar Islands",
        "Arunachal Pradesh",
        "Assam",
        "Bihar",
        "Chhattisgarh",
        "Chandigarh",
        "Goa",
        "Delhi",
        "Dadra & Nagar Haveli and Daman & Diu",
        "Gujarat",
        "Haryana",
        "Himachal Pradesh",
        "Jammu & Kashmir",
        "Jharkhand",
        "Karnataka",
        "Kerala",
        "Ladakh",
        "Lakshadweep",
        "Madhya Pradesh",
        "Maharashtra",
        "Manipur",
        "Meghalaya",
        "Mizoram",
        "Nagaland",
        "Odisha",
        "Punjab",
        "Puducherry",
        "Rajasthan",
        "Sikkim",
        "Tamil Nadu",
        "Telangana",
        "Tripura",
        "Uttar Pradesh",
        "Uttarakhand",
        "West Bengal"
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
    const esiBase = useMemo(() => toNum(grossSalary), [grossSalary]); // ESI base = gross

    const [pfMode, setPfMode] = useState<Mode>("amount");
    const [esiMode, setEsiMode] = useState<Mode>("amount");

    const pfLastEdit = useRef<"amount" | "percent" | null>(null);
    const esiLastEdit = useRef<"amount" | "percent" | null>(null);

    // PF percent <-> amount sync
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
    }, [
        salaryForm.pf_applicable,
        salaryForm.pf_employee_contribution_amount,
        salaryForm.pf_employee_contribution_percent,
        pfBase,
    ]);

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
    }, [
        salaryForm.pf_applicable,
        salaryForm.esi_applicable,
        salaryForm.esi_contribution_amount,
        salaryForm.esi_contribution_percent,
        esiBase,
    ]);

    const totalDeductions = useMemo(() => {
        const pf = salaryForm.pf_applicable ? toNum(salaryForm.pf_employee_contribution_amount) : 0;
        const esi =
            salaryForm.esi_applicable
                ? toNum(salaryForm.esi_contribution_amount)
                : 0;

        return (
            pf +
            esi +
            toNum(salaryForm.professional_tax) +
            toNum(salaryForm.tds) +
            toNum(salaryForm.other_deductions)
        );
    }, [salaryForm]);

    const netPayable = useMemo(() => {
        return grossSalary - totalDeductions;
    }, [grossSalary, totalDeductions]);
    const [employees, setEmployees] = useState<Employee[]>([]);
    const [loadingEmployees, setLoadingEmployees] = useState(true);
    const [roles, setRoles] = useState<
        { id: string; name: string }[]
    >([]);
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


    type AttendanceLocation = {
        id: string;
        lat: number | string;
        long: number | string;
    };
    const [editPhotoFile, setEditPhotoFile] = useState<File | null>(null);
    const [form, setForm] = useState({
        name: "",
        email: "",
        phone: "",
        department: "",
        address: "",
        city: "",
        state: "",
        zone_id: "",
        pincode: "",
        hra: "",
        designation: "",
        aadhar_number: "",
        pan_number: "",
        role_id: "",
        status: "",
        joining_date: "",
        experience: "", // yes | no
        total_experience: "",
        previous_company: "",
        previous_document_type: "", // offer_letter | pay_slip
        previous_document_file: null as File | null,
        reporting_manager_name: "",
        reporting_manager_email: "",
        reporting_manager_phone: "",
        photo_file: null as File | null,
        attendance_type: "",
        branch_id: null as string | null,
    });

    const [zonesOptions, setZonesOptions] = useState<{ value: string; label: string }[]>([]);
    const [loadingZones, setLoadingZones] = useState(false);

    const fetchBranches = useCallback(async () => {
        const { data, error } = await supabase
            .from("branches")
            .select("id, branch_name, branch_code")
            .order("branch_name");

        if (error) {
            console.error(error);
            toast.error("Failed to load branches");
            setBranches([]);
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

        const { data, error } = await supabase
            .from("zones")
            .select("id, zone_name")
            .eq("branch_id", branchId)
            .order("zone_name", { ascending: true });

        setLoadingZones(false);

        if (error) {
            console.error(error);
            toast.error("Failed to load zones");
            setZonesOptions([]);
            return;
        }

        setZonesOptions(
            (data ?? []).map((z) => ({
                value: String(z.id),
                label: z.zone_name ?? "—",
            }))
        );
    }, []);
    useEffect(() => {
        void fetchZonesOptionsByBranch(form.branch_id);
    }, [form.branch_id, fetchZonesOptionsByBranch]);

    // SEARCH + PAGINATION
    const [search, setSearch] = useState("");
    const [debouncedSearch, setDebouncedSearch] = useState("");
    const [page, setPage] = useState(1);
    const [pageSize] = useState(10);
    const [totalCount, setTotalCount] = useState(0);

    useEffect(() => {
        const timer = setTimeout(() => {
            setDebouncedSearch(search);
            setPage(1); // search change হলে page reset
        }, 400);

        return () => clearTimeout(timer);
    }, [search]);


    const fetchEmployees = async () => {
        setLoadingEmployees(true);

        const from = (page - 1) * pageSize;
        const to = from + pageSize - 1;

        let query = employeesTable().select(
            `
        id,
        employee_code,
        name,
        email,
        aadhar_number,
        address,
        state,
        city,
        zone_id,
        branch_id,
        branches ( branch_name ),
        pincode,
        pan_number,
        total_experience,
        joining_date,
        previous_document_path,
        photo_path,
        previous_document_type,
        designation,
        reporting_manager_email,
        reporting_manager_phone,
        phone,
        department,
        status,
        attendance_type,
        roles ( name )
        `,
            { count: "exact" }
        );

        // SEARCH FILTER
        if (debouncedSearch.trim()) {
            query = query.or(`
            name.ilike.%${debouncedSearch}%,
            email.ilike.%${debouncedSearch}%,
            employee_code.ilike.%${debouncedSearch}%,
            phone.ilike.%${debouncedSearch}%
        `);
        }

        const { data, error, count } = await query.range(from, to);

        if (error) {
            console.error(error);
            toast.error("Failed to fetch employees");
        } else {
            setEmployees(data ?? []);
            setTotalCount(count ?? 0);
        }

        setLoadingEmployees(false);
    };

    const [attendanceLocations, setAttendanceLocations] = useState<AttendanceLocation[]>([]);

    const fetchRoles = async () => {
        const { data, error } = await supabase
            .from("roles")
            .select("id, name")
            .order("name");

        if (!error && data) {
            setRoles(data);
        }
    };

    useEffect(() => {
        fetchRoles();
        fetchEmployees();
    }, [page, debouncedSearch]);

    useEffect(() => {
        if (attendanceLocations.length > 0) return;
    }, [form.attendance_type, attendanceLocations.length]);

    /* ================= EMPLOYEE CODE GENERATION ================= */

    const generateEmployeeCode = async (department: string) => {
        if (!department) return;

        const prefix = `PR${new Date().getFullYear().toString().slice(-2)}${department[0].toUpperCase()}`;

        const { count } = await employeesTable()
            .select("employee_code", { count: "exact", head: true });

        const next = String((count ?? 0) + 1).padStart(3, "0");

        setEmployeeCode(`${prefix}-${next}`);
    };

    useEffect(() => {
        if (form.department) {
            generateEmployeeCode(form.department);
        }
    }, [form.department]);

    const uploadFile = async (file: File, field: UploadField): Promise<string> => {
        const formData = new FormData();
        formData.append("file", file);
        formData.append("field", field);

        const session = (await supabase.auth.getSession()).data.session;

        const { data, error } = await supabase.functions.invoke(
            "upload-employee-documents",
            {
                method: "POST",
                body: formData,
                headers: {
                    Authorization: `Bearer ${session?.access_token}`,
                },
            }
        );

        if (error || !data?.url) {
            throw new Error(error?.message || "File upload failed");
        }

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
                employee_code: employeeCode,
                name: form.name,
                email: form.email,
                status: form.status || "active",
                branch_id: form.branch_id ? String(form.branch_id) : null,
                zone_id: form.zone_id ? String(form.zone_id) : null,
                department: form.department || null,
                designation: form.designation || null,
                role_id: form.role_id || null, // 🔥 FIX added
            };

            console.log("CREATE EMPLOYEE PAYLOAD:", payload);

            const { data, error } = await supabase.functions.invoke("create-employee", {
                body: payload,
                headers: { "Content-Type": "application/json" },
            });

            console.log("EDGE RESPONSE:", data, error);

            if (error) throw error;
            if (!data) throw new Error("No response from server");
            if (!data.success) throw new Error(data.message || "Creation failed");

            setTempCreds({ email: form.email, password: data.tempPassword });
            setIsPassOpen(true);

            toast.success("Employee created successfully");

            setIsAddOpen(false);
            await fetchEmployees();

        } catch (err: any) {
            console.error("CREATE ERROR:", err);
            toast.error(err.message || "Something went wrong");
        } finally {
            setSaving(false);
        }
    };

    const openViewModal = async (emp: Employee) => {
        setSelectedEmployee(emp);
        setIsViewOpen(true);
        await loadZoneLocations(emp.zone_id ?? null);

        const { data, error } = await supabase
            .from("employee_salary_structures")
            .select("*")
            .eq("employee_id", emp.id)
            .order("created_at", { ascending: false })
            .maybeSingle();

        if (!error) {
            setSalaryStructure(data ?? null);
        }
    };

    useEffect(() => {
        if (!isViewOpen) {
            setZoneInfo(null);
            setSalaryStructure(null);
        }
    }, [isViewOpen]);

    const openEditModal = (emp: Employee) => {
        setSelectedEmployee(emp);

        setForm({
            name: emp.name ?? "",
            email: emp.email ?? "",
            phone: emp.phone ?? "",
            department: emp.department ?? "",
            designation: emp.designation ?? "",
            address: emp.address ?? "",
            city: emp.city ?? "",
            state: emp.state ?? "",
            zone_id: emp.zone_id ? String(emp.zone_id) : "",
            branch_id: emp.branch_id ? String(emp.branch_id) : "",
            attendance_type: emp.attendance_type ?? "office",
            pincode: emp.pincode ?? "",
            role_id: emp.role_id ? String(emp.role_id) : "",
            joining_date: emp.joining_date ?? "",
            experience: emp.experience ?? "",
            total_experience: emp.total_experience ?? "",
            previous_company: emp.previous_company ?? "",
            previous_document_type: emp.previous_document_type ?? "",
            aadhar_number: emp.aadhar_number ?? "",
            pan_number: emp.pan_number ?? "",
            reporting_manager_name: emp.reporting_manager_name ?? "",
            reporting_manager_email: emp.reporting_manager_email ?? "",
            reporting_manager_phone: emp.reporting_manager_phone ?? "",
            status: emp.status ?? "active",
            photo_file: null,
            previous_document_file: null,
            hra: "",
        });

        // preload zones for existing branch
        if (emp.branch_id) {
            void fetchZonesOptionsByBranch(String(emp.branch_id));
        } else {
            setZonesOptions([]);
        }

        setAvatarPreview(emp.photo_path ?? null);
        setEditPhotoFile(null);
        setIsEditOpen(true);
    };

    const handleUpdateEmployee = async () => {
        if (!selectedEmployee) return;
        setSaving(true);

        try {
            const payload: Record<string, unknown> = {};

            // only update if value changed
            if (form.name !== (selectedEmployee.name ?? "")) payload.name = form.name;
            if (form.email !== (selectedEmployee.email ?? "")) payload.email = form.email;
            if (form.phone !== (selectedEmployee.phone ?? "")) payload.phone = form.phone;

            if (form.department !== (selectedEmployee.department ?? "")) payload.department = form.department;
            if (form.designation !== (selectedEmployee.designation ?? "")) payload.designation = form.designation;

            if ((form.attendance_type ?? "") !== (selectedEmployee.attendance_type ?? "")) {
                payload.attendance_type = form.attendance_type || null;
            }

            if (form.address !== (selectedEmployee.address ?? "")) payload.address = form.address;
            if (form.city !== (selectedEmployee.city ?? "")) payload.city = form.city;
            if (form.state !== (selectedEmployee.state ?? "")) payload.state = form.state;
            if (form.pincode !== (selectedEmployee.pincode ?? "")) payload.pincode = form.pincode;

            const currentRole = selectedEmployee.role_id ? String(selectedEmployee.role_id) : "";
            if (form.role_id !== currentRole) payload.role_id = form.role_id || null;

            if ((form.joining_date ?? "") !== (selectedEmployee.joining_date ?? "")) {
                payload.joining_date = form.joining_date;
            }

            if ((form.experience ?? "") !== (selectedEmployee.experience ?? "")) payload.experience = form.experience;
            if ((form.total_experience ?? "") !== (selectedEmployee.total_experience ?? "")) payload.total_experience = form.total_experience;
            if ((form.previous_company ?? "") !== (selectedEmployee.previous_company ?? "")) payload.previous_company = form.previous_company;

            if ((form.previous_document_type ?? "") !== (selectedEmployee.previous_document_type ?? "")) {
                payload.previous_document_type = form.previous_document_type;
            }

            if ((form.aadhar_number ?? "") !== (selectedEmployee.aadhar_number ?? "")) payload.aadhar_number = form.aadhar_number;
            if ((form.pan_number ?? "") !== (selectedEmployee.pan_number ?? "")) payload.pan_number = form.pan_number;

            if ((form.reporting_manager_name ?? "") !== (selectedEmployee.reporting_manager_name ?? "")) {
                payload.reporting_manager_name = form.reporting_manager_name;
            }
            if ((form.reporting_manager_email ?? "") !== (selectedEmployee.reporting_manager_email ?? "")) {
                payload.reporting_manager_email = form.reporting_manager_email;
            }
            if ((form.reporting_manager_phone ?? "") !== (selectedEmployee.reporting_manager_phone ?? "")) {
                payload.reporting_manager_phone = form.reporting_manager_phone;
            }

            // branch update
            const currentBranch = selectedEmployee.branch_id ? String(selectedEmployee.branch_id) : "";
            if ((form.branch_id ?? "") !== currentBranch) {
                payload.branch_id = form.branch_id || null;

            }

            // zone update
            const currentZone = selectedEmployee.zone_id ? String(selectedEmployee.zone_id) : "";
            if ((form.zone_id ?? "") !== currentZone) {
                payload.zone_id = form.zone_id || null;
            }

            if ((form.status ?? "") !== (selectedEmployee.status ?? "")) payload.status = form.status;


            // photo only if user selected new file
            if (editPhotoFile) {
                const photoPath = await uploadFile(editPhotoFile, "photo");
                payload.photo_path = photoPath;
            }

            // previous doc only if selected
            if (form.previous_document_file) {
                const docPath = await uploadFile(form.previous_document_file, "previous_document");
                payload.previous_document_path = docPath;
            }

            if (Object.keys(payload).length === 0) {
                toast("No changes to update");
                return;
            }

            const { data, error } = await employeesTable()
                .update(payload as never)
                .eq("id", selectedEmployee.id)
                .select("id");

            if (error) throw error;
            if (!data || data.length === 0) throw new Error("Update blocked (RLS / wrong id)");

            toast.success("Employee updated successfully");
            setIsEditOpen(false);
            fetchEmployees();
        } catch (err: unknown) {
            toast.error(getErrorMessage(err) || "Update failed");
        } finally {
            setSaving(false);
        }
    };

    const handleDeleteEmployee = async (emp: Employee) => {
        const confirmed = confirm(
            `Are you sure you want to delete "${emp.employee_code}"?`
        );
        if (!confirmed) return;

        const { error } = await employeesTable()
            .delete()
            .eq("id", emp.id);

        if (error) {
            toast.error(getErrorMessage(error));
        } else {
            toast.success("Employee deleted");
            fetchEmployees();
        }
    };

    const handleSaveSalary = async () => {
        if (!salaryEmployee) return;

        const payload: Record<string, unknown> = {
            employee_id: salaryEmployee.id,
            salary_type: salaryForm.salary_type,

            basic: toNum(salaryForm.basic),
            hra: toNum(salaryForm.hra),
            conveyance: toNum(salaryForm.conveyance),
            medical: toNum(salaryForm.medical),
            special_allowance: toNum(salaryForm.special_allowance),
            other_allowance: toNum(salaryForm.other_allowance),

            pf_applicable: salaryForm.pf_applicable,
            esi_applicable: salaryForm.esi_applicable,

            // DB screenshot: numeric columns
            pf_number: salaryForm.pf_applicable ? toNum(salaryForm.pf_number) : null,
            esi_number: salaryForm.pf_applicable ? toNum(salaryForm.esi_number) : null,
            uan_number: salaryForm.pf_applicable ? toNum(salaryForm.uan_number) : null,

            // DB column exists in screenshot: pf_employee_contribution (single numeric)
            pf_employee_contribution: salaryForm.pf_applicable
                ? toNum(salaryForm.pf_employee_contribution_amount)
                : 0,

            esi_employee_contribution: (salaryForm.pf_applicable && salaryForm.esi_applicable)
                ? toNum(salaryForm.esi_contribution_amount)
                : 0,

            professional_tax: toNum(salaryForm.professional_tax),
            tds: toNum(salaryForm.tds),
            other_deductions: toNum(salaryForm.other_deductions),

            gross_salary: grossSalary,
            total_deductions: totalDeductions,
            net_payable: netPayable,
        };

        const { error } = await supabase.from("employee_salary_structures").insert(payload as never);

        if (error) {
            console.error("FULL SALARY ERROR ", {
                message: getErrorMessage(error),
                details: error.details,
                hint: error.hint,
                code: error.code,
            });
            toast.error(getErrorMessage(error) || "Salary save failed");
            return;
        }

        toast.success("Salary structure saved");
        setIsSalaryOpen(false);
    };

    const openSalaryModal = async (emp: Employee) => {
        setSalaryEmployee(emp);
        setPfMode("amount");
        setEsiMode("amount");
        pfLastEdit.current = null;
        esiLastEdit.current = null;

        const { data, error } = await supabase
            .from("employee_salary_structures")
            .select("*")
            .eq("employee_id", emp.id)
            .order("created_at", { ascending: false })
            .limit(1)
            .maybeSingle();

        if (error) {
            console.error(error);
            toast.error("Failed to load salary structure");
            setIsSalaryOpen(true);
            return;
        }

        if (!data) {
            setIsSalaryOpen(true);
            return;
        }

        setSalaryForm({
            salary_type: data.salary_type === "yearly" ? "yearly" : "monthly",
            basic: String(toNum(data.basic)),
            hra: String(toNum(data.hra)),
            conveyance: String(toNum(data.conveyance)),
            medical: String(toNum(data.medical)),
            special_allowance: String(toNum(data.special_allowance)),
            other_allowance: String(toNum(data.other_allowance)),
            pf_applicable: Boolean(data.pf_applicable),
            esi_applicable: Boolean(data.esi_applicable),
            pf_number: data.pf_number != null ? String(data.pf_number) : "",
            esi_number: data.esi_number != null ? String(data.esi_number) : "",
            uan_number: data.uan_number != null ? String(data.uan_number) : "",
            pf_employee_contribution_percent: 0,
            pf_employee_contribution_amount: toNum(data.pf_employee_contribution),
            esi_contribution_percent: 0,
            esi_contribution_amount: toNum(data.esi_employee_contribution),
            professional_tax: toNum(data.professional_tax),
            tds: toNum(data.tds),
            other_deductions: toNum(data.other_deductions),
        });
        setIsSalaryOpen(true);
    };

    const handlePhotoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        setEditPhotoFile(file);
        setAvatarPreview(URL.createObjectURL(file));
    };

    useEffect(() => {
        if (!isEditOpen) {
            setAvatarPreview(null);
        }
    }, [isEditOpen]);

    const downloadDocument = async (storedPath: string) => {
        try {
            if (!storedPath) {
                toast.error("Invalid document path");
                return;
            }

            let cleanPath = storedPath;

            if (storedPath.startsWith("http")) {
                const marker = "/storage/v1/object/public/employee-documents/";
                const index = storedPath.indexOf(marker);

                if (index === -1) {
                    toast.error("Invalid storage URL");
                    return;
                }

                cleanPath = storedPath.substring(index + marker.length);
            }

            const { data, error } = await supabase.storage
                .from("employee-documents")
                .download(cleanPath);

            if (error || !data) {
                console.error(error);
                throw error;
            }

            const blobUrl = URL.createObjectURL(data);
            const a = document.createElement("a");

            a.href = blobUrl;
            a.download = cleanPath.split("/").pop() || "document.pdf";

            document.body.appendChild(a);
            a.click();

            a.remove();
            URL.revokeObjectURL(blobUrl);
        } catch (err) {
            console.error("Download failed:", err);
            toast.error("Failed to download document");
        }
    };

    const maskAadhar = (aadhar?: string) => {
        if (!aadhar || aadhar.length < 12) return "—";
        return `XXXX-XXXX-${aadhar.slice(-4)}`;
    };

    const getInitials = (name?: string) => {
        if (!name) return "NA";
        return name
            .split(" ")
            .map(word => word[0])
            .join("")
            .slice(0, 2)
            .toUpperCase();
    };

    return (
        <div className="rounded-xl border bg-card">
            <CardHeader className="flex flex-row items-center justify-between">
                <CardTitle>Employee</CardTitle>

                <div className="flex items-center gap-3">
                    <Input
                        placeholder="Search employee..."
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                        className="w-[250px]"
                    />
                    <Button onClick={() => setIsAddOpen(true)}>
                        + Add Employee
                    </Button>
                </div>
            </CardHeader>

            <CardContent className="p-0">
                <Table>
                    <TableHeader>
                        <TableRow className="bg-muted/50">
                            <TableHead>Employee ID</TableHead>
                            <TableHead>Employee Name</TableHead>
                            <TableHead>Branch</TableHead>
                            <TableHead>Designation</TableHead>
                            <TableHead>Status</TableHead>
                            <TableHead>Action</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {loadingEmployees ? (
                            <TableRow>
                                <TableCell colSpan={5} className="text-center py-6">
                                    Loading employees...
                                </TableCell>
                            </TableRow>
                        ) : employees.length === 0 ? (
                            <TableRow>
                                <TableCell colSpan={5} className="text-center py-6">
                                    No employees found
                                </TableCell>
                            </TableRow>
                        ) : (
                            employees.map((emp) => (
                                <TableRow key={emp.id} className="table-row-hover">
                                    <TableCell className="font-medium">
                                        {emp.employee_code}
                                    </TableCell>

                                    <TableCell>{emp.name}</TableCell>

                                    <TableCell>{emp.branches?.branch_name ?? "-"}</TableCell>

                                    <TableCell className="uppercase">{emp.designation ?? "—"}</TableCell>

                                    <TableCell>
                                        {emp.status && employeeStatus[emp.status] && (
                                            <Badge
                                                variant="outline"
                                                className={cn(
                                                    employeeStatus[emp.status].bg,
                                                    employeeStatus[emp.status].text,
                                                    "border-0"
                                                )}
                                            >
                                                {employeeStatus[emp.status].label}
                                            </Badge>
                                        )}
                                        {(!emp.status || !employeeStatus[emp.status]) && (
                                            <Badge
                                                variant="outline"
                                            >
                                                {emp.status || "No Status"}
                                            </Badge>
                                        )}
                                    </TableCell>

                                    <TableCell className="flex items-center gap-2">
                                        <Button size="sm" variant="default" onClick={() => {
                                            void openSalaryModal(emp);
                                        }}
                                        >
                                            <IndianRupeeIcon className="h-4 w-4" />
                                        </Button>
                                        <Button size="sm" variant="secondary" onClick={() => openViewModal(emp)}>
                                            <Eye className="h-4 w-4" />
                                        </Button>
                                        <Button size="sm" variant="outline" onClick={() => openEditModal(emp)}>
                                            <Edit className="h-4 w-4" />
                                        </Button>
                                        <Button size="sm" variant="destructive" onClick={() => handleDeleteEmployee(emp)}>
                                            <Trash2 className="h-4 w-4" />
                                        </Button>
                                    </TableCell>
                                </TableRow>
                            ))
                        )}
                    </TableBody>
                </Table>
            </CardContent>
            <div className="flex items-center justify-between px-4 py-3 border-t">
                <div className="text-sm text-muted-foreground">
                    Showing {totalCount === 0 ? 0 : (page - 1) * pageSize + 1}–
                    {Math.min(page * pageSize, totalCount)} of {totalCount}
                </div>

                <div className="flex items-center gap-2">
                    <Button
                        size="sm"
                        variant="outline"
                        disabled={page === 1}
                        onClick={() => setPage((p) => p - 1)}
                    >
                        Previous
                    </Button>

                    <span className="text-sm font-medium">
                        Page {page} of {Math.ceil(totalCount / pageSize) || 1}
                    </span>

                    <Button
                        size="sm"
                        variant="outline"
                        disabled={page >= Math.ceil(totalCount / pageSize)}
                        onClick={() => setPage((p) => p + 1)}
                    >
                        Next
                    </Button>
                </div>
            </div>

            <Dialog open={isViewOpen} onOpenChange={setIsViewOpen}>
                <DialogContent
                    className="sm:max-w-[900px] w-[95vw] h-[90vh] p-0 flex flex-col overflow-hidden"
                    onOpenAutoFocus={(e) => e.preventDefault()}
                >
                    <div className="sticky top-0 z-10 bg-background border-b px-6 py-4">
                        <DialogHeader className="p-0">
                            <DialogTitle>Employee Details</DialogTitle>
                        </DialogHeader>
                    </div>

                    <div className="flex-1 overflow-y-auto px-6 py-4">
                        {selectedEmployee ? (
                            <div className="space-y-5">
                                {/* Top block: avatar + name */}
                                <div className="flex items-start gap-4">
                                    {selectedEmployee.photo_path ? (
                                        <img
                                            src={selectedEmployee.photo_path}
                                            alt={selectedEmployee.name}
                                            className="h-20 w-20 rounded-full object-cover border"
                                        />
                                    ) : (
                                        <div className="h-20 w-20 rounded-full bg-muted flex items-center justify-center font-semibold border">
                                            {getInitials(selectedEmployee.name)}
                                        </div>
                                    )}

                                    <div className="flex-1">
                                        <div className="text-lg font-semibold leading-tight">
                                            {selectedEmployee.name || "—"}
                                        </div>
                                        <div className="text-sm text-muted-foreground">
                                            {selectedEmployee.designation || "—"}
                                            {selectedEmployee.department ? ` • ${selectedEmployee.department}` : ""}
                                        </div>

                                        <div className="mt-2 flex flex-wrap gap-2">
                                            <span className="text-xs px-2 py-1 rounded-md bg-muted border">
                                                Code: {selectedEmployee.employee_code || "—"}
                                            </span>
                                            <span className="text-xs px-2 py-1 rounded-md bg-muted border">
                                                Status: {selectedEmployee.status || "—"}
                                            </span>
                                            <span className="text-xs px-2 py-1 rounded-md bg-muted border">
                                                Role: {selectedEmployee.roles?.name || "—"}
                                            </span>
                                        </div>
                                    </div>
                                </div>

                                {/* Details grid */}
                                <div className="border rounded-xl p-4">
                                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-x-6 gap-y-4 text-sm">
                                        {/* BASIC INFO */}
                                        <div className="text-muted-foreground">Email</div>
                                        <div className="sm:col-span-2 break-all font-medium text-foreground">
                                            {selectedEmployee.email || "—"}
                                        </div>

                                        <div className="text-muted-foreground">Date Joined</div>
                                        <div className="sm:col-span-2 font-medium text-foreground">
                                            {selectedEmployee.joining_date
                                                ? new Date(selectedEmployee.joining_date).toLocaleDateString()
                                                : "—"}
                                        </div>

                                        {/* ID INFO */}
                                        <div className="text-muted-foreground">Aadhar Number</div>
                                        <div className="sm:col-span-2 font-medium text-foreground">
                                            {maskAadhar(selectedEmployee.aadhar_number)}
                                        </div>

                                        <div className="text-muted-foreground">Select Branch</div>
                                        <div className="sm:col-span-2 font-medium text-foreground">
                                        </div>

                                        <div className="text-muted-foreground">PAN Number</div>
                                        <div className="sm:col-span-2 font-medium text-foreground">
                                            {selectedEmployee.pan_number || "—"}
                                        </div>
                                    </div>
                                </div>

                                {selectedEmployee.department === "Sales" && (
                                    <div className="border rounded-xl p-4">
                                        <div className="flex items-center justify-between mb-3">
                                            <h3 className="font-semibold">
                                                Zone Locations{zoneInfo?.zone_name ? ` — ${zoneInfo.zone_name} - ${zoneInfo.zone_code}` : ""}
                                            </h3>
                                        </div>
                                    </div>
                                )}

                                {Number(selectedEmployee.total_experience) > 0 && (
                                    <div className="border rounded-xl p-4">
                                        <div className="flex items-center justify-between mb-3">
                                            <h3 className="font-semibold">Experience</h3>
                                            <span className="text-xs px-2 py-1 rounded-md bg-muted border">
                                                {selectedEmployee.total_experience} years
                                            </span>
                                        </div>

                                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-x-6 gap-y-4 text-sm">
                                            <div className="text-muted-foreground">Previous Document Type</div>
                                            <div className="sm:col-span-2 font-medium">
                                                {selectedEmployee.previous_document_type || "—"}
                                            </div>

                                            <div className="text-muted-foreground">Reporting Manager Email</div>
                                            <div className="sm:col-span-2 font-medium break-all">
                                                {selectedEmployee.reporting_manager_email || "—"}
                                            </div>

                                            <div className="text-muted-foreground">Reporting Manager Phone</div>
                                            <div className="sm:col-span-2 font-medium">
                                                {selectedEmployee.reporting_manager_phone || "—"}
                                            </div>

                                            <div className="text-muted-foreground">Previous Document</div>
                                            <div className="sm:col-span-2">
                                                {selectedEmployee.previous_document_path ? (
                                                    <Button
                                                        variant="outline"
                                                        size="sm"
                                                        onClick={() =>
                                                            downloadDocument(selectedEmployee.previous_document_path)
                                                        }
                                                        className="flex items-center gap-2"
                                                    >
                                                        <Download className="h-4 w-4" />
                                                        Download PDF
                                                    </Button>
                                                ) : (
                                                    <span className="font-medium">—</span>
                                                )}
                                            </div>
                                        </div>
                                    </div>
                                )}

                                {/* Salary section */}
                                {salaryStructure && (
                                    <div className="border rounded-xl p-4">
                                        <div className="flex items-center justify-between mb-3">
                                            <h3 className="font-semibold">Salary Structure</h3>

                                            {!salaryStructure && (
                                                <span className="
                                                    text-xs
                                                    px-3 py-1
                                                    rounded-full
                                                    bg-yellow-100 text-yellow-800
                                                    dark:bg-yellow-900/30 dark:text-yellow-300
                                                    border
                                                ">
                                                    Not set yet
                                                </span>
                                            )}
                                        </div>



                                        {salaryStructure ? (
                                            <div className="grid grid-cols-1 sm:grid-cols-3 gap-x-6 gap-y-4 text-sm">
                                                <div className="text-muted-foreground">Basic</div>
                                                <div className="sm:col-span-2 font-medium">₹{salaryStructure.basic}</div>

                                                <div className="text-muted-foreground">HRA</div>
                                                <div className="sm:col-span-2 font-medium">₹{salaryStructure.hra}</div>

                                                <div className="text-muted-foreground">Conveyance</div>
                                                <div className="sm:col-span-2 font-medium">₹{salaryStructure.conveyance}</div>

                                                <div className="text-muted-foreground">Medical</div>
                                                <div className="sm:col-span-2 font-medium">₹{salaryStructure.medical}</div>

                                                <div className="text-muted-foreground">Special Allowance</div>
                                                <div className="sm:col-span-2 font-medium">
                                                    ₹{salaryStructure.special_allowance}
                                                </div>

                                                <div className="text-muted-foreground">Other Allowance</div>
                                                <div className="sm:col-span-2 font-medium">
                                                    ₹{salaryStructure.other_allowance}
                                                </div>

                                                <div className="border-t sm:col-span-3 my-1" />

                                                <div className="text-muted-foreground">Gross Salary</div>
                                                <div className="sm:col-span-2 font-semibold">
                                                    ₹{salaryStructure.gross_salary}
                                                </div>

                                                <div className="text-muted-foreground">Total Deductions</div>
                                                <div className="sm:col-span-2 font-medium">
                                                    ₹{salaryStructure.total_deductions}
                                                </div>

                                                <div className="text-muted-foreground">Net Payable</div>
                                                <div className="sm:col-span-2 font-semibold text-green-600">
                                                    ₹{salaryStructure.net_payable}
                                                </div>
                                            </div>
                                        ) : (
                                            <div className="text-sm text-muted-foreground">
                                                Salary structure has not been configured for this employee.
                                            </div>
                                        )}
                                    </div>
                                )}
                            </div>
                        ) : (
                            <p className="text-sm text-muted-foreground">No employee selected.</p>
                        )}
                    </div>

                    <div className="sticky bottom-0 z-10 bg-background border-t px-6 py-4">
                        <DialogFooter className="p-0">
                            <Button variant="outline" onClick={() => setIsViewOpen(false)}>
                                Close
                            </Button>
                        </DialogFooter>
                    </div>
                </DialogContent>
            </Dialog>

            <Dialog open={isPassOpen} onOpenChange={setIsPassOpen}>
                <DialogContent className="sm:max-w-[520px]">
                    <DialogHeader>
                        <DialogTitle>Employee Login Created</DialogTitle>
                        <DialogDescription>
                            Copy and share the credentials. This password is shown only once.
                        </DialogDescription>
                    </DialogHeader>

                    <div className="space-y-4">
                        <div className="space-y-2">
                            <Label>Email</Label>
                            <div className="flex gap-2">
                                <Input value={tempCreds?.email || ""} readOnly />
                                <Button
                                    type="button"
                                    variant="secondary"
                                    onClick={async () => {
                                        if (!tempCreds?.email) return;
                                        await navigator.clipboard.writeText(tempCreds.email);
                                        toast.success("Email copied");
                                    }}
                                >
                                    Copy
                                </Button>
                            </div>
                        </div>

                        <div className="space-y-2">
                            <Label>Temporary Password</Label>
                            <div className="flex gap-2">
                                <Input value={tempCreds?.password || ""} readOnly />
                                <Button
                                    type="button"
                                    variant="secondary"
                                    onClick={async () => {
                                        if (!tempCreds?.password) return;
                                        await navigator.clipboard.writeText(tempCreds.password);
                                        toast.success("Password copied");
                                    }}
                                >
                                    Copy
                                </Button>
                            </div>
                        </div>
                    </div>

                    <DialogFooter className="gap-2">
                        <Button
                            type="button"
                            variant="outline"
                            onClick={async () => {
                                if (!tempCreds) return;
                                const text = `Email: ${tempCreds.email}\nPassword: ${tempCreds.password}`;
                                await navigator.clipboard.writeText(text);
                                toast.success("Credentials copied");
                            }}
                        >
                            Copy All
                        </Button>

                        <Button
                            type="button"
                            onClick={() => {
                                setIsPassOpen(false);
                                setTempCreds(null);
                            }}
                        >
                            Done
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            <Dialog open={isAddOpen} onOpenChange={setIsAddOpen}>
                <DialogContent className="sm:max-w-[720px] h-[85vh] flex flex-col overflow-hidden p-0">
                    {/* ===== Header ===== */}
                    <DialogHeader className="px-6 py-4 border-b bg-card">
                        <div className="flex items-start justify-between gap-4">
                            <div className="space-y-1">
                                <DialogTitle className="text-xl">Add Employee</DialogTitle>
                                <DialogDescription className="text-sm">
                                    Fill in the details below. Fields marked with * are required.
                                </DialogDescription>
                            </div>
                        </div>
                    </DialogHeader>

                    {/* ===== Scrollable Body ===== */}
                    <ScrollArea className="flex-1">
                        <div className="px-6 py-5 space-y-6">
                            {/* BASIC INFO */}
                            <div className="rounded-xl border bg-muted/10 p-4 space-y-4">
                                <div className="flex items-center justify-between">
                                    <p className="text-sm font-medium">Basic information</p>
                                </div>

                                <div className="grid gap-4 md:grid-cols-2">
                                    <div className="space-y-2">
                                        <Label>Employee Code</Label>
                                        <Input value={employeeCode} disabled className="bg-muted font-mono" />
                                    </div>

                                    <div className="space-y-2">
                                        <Label htmlFor="emp-name">Employee Name *</Label>
                                        <Input
                                            id="emp-name"
                                            placeholder="e.g. Phoenix"
                                            value={form.name}
                                            onChange={(e) => setForm({ ...form, name: e.target.value })}
                                        />
                                    </div>

                                    <div className="space-y-2">
                                        <Label htmlFor="emp-email">Email</Label>
                                        <Input
                                            id="emp-email"
                                            type="email"
                                            placeholder="name@company.com"
                                            value={form.email}
                                            onChange={(e) => setForm({ ...form, email: e.target.value })}
                                        />
                                        {form.email && !form.email.includes("@") && (
                                            <p className="text-xs text-destructive">Email must contain @.</p>
                                        )}
                                    </div>

                                    <div className="space-y-2">
                                        <Label htmlFor="emp-phone">Phone</Label>
                                        <Input
                                            id="emp-phone"
                                            placeholder="10 digit mobile number"
                                            inputMode="numeric"
                                            pattern="[0-9]*"
                                            maxLength={10}
                                            value={form.phone}
                                            onChange={(e) => {
                                                const digitsOnly = e.target.value.replace(/\D/g, "");
                                                const tenDigits = digitsOnly.slice(0, 10);
                                                setForm({ ...form, phone: tenDigits });
                                            }}
                                        />
                                        {form.phone && form.phone.length !== 10 && (
                                            <p className="text-xs text-destructive">Phone number must be exactly 10 digits.</p>
                                        )}

                                    </div>
                                </div>
                            </div>

                            {/* WORK & ASSIGNMENT */}
                            <div className="rounded-xl border bg-muted/10 p-4 space-y-4">
                                <div className="flex items-center justify-between">
                                    <p className="text-sm font-medium">Work & Assignment</p>
                                </div>

                                <div className="grid gap-4 md:grid-cols-2">
                                    <div className="space-y-2">
                                        <Label>Department</Label>
                                        <Select
                                            value={form.department}
                                            onValueChange={(v) => setForm((p) => ({ ...p, department: v }))}
                                        >
                                            <SelectTrigger>
                                                <SelectValue placeholder="Select Department" />
                                            </SelectTrigger>
                                            <SelectContent>
                                                <SelectItem value="HR">HR</SelectItem>
                                                <SelectItem value="Sales">Sales</SelectItem>
                                                <SelectItem value="IT">IT</SelectItem>
                                                <SelectItem value="Accounts">Accounts</SelectItem>
                                                <SelectItem value="Backoffice">Backoffice</SelectItem>
                                            </SelectContent>
                                        </Select>
                                    </div>

                                    <div className="space-y-2">
                                        <Label htmlFor="emp-designation">Designation</Label>
                                        <Input
                                            id="emp-designation"
                                            placeholder="e.g. Software Engineer"
                                            value={form.designation}
                                            onChange={(e) => setForm((p) => ({ ...p, designation: e.target.value }))}
                                        />
                                    </div>

                                    <div className="space-y-2">
                                        <Label>Role *</Label>
                                        <Select
                                            value={form.role_id}
                                            onValueChange={(v) => setForm((p) => ({ ...p, role_id: v }))}
                                        >
                                            <SelectTrigger>
                                                <SelectValue placeholder="Select role" />
                                            </SelectTrigger>
                                            <SelectContent>
                                                {roles?.filter((r) => r.name.toLowerCase() !== "admin").map((r) => (
                                                    <SelectItem key={r.id} value={String(r.id)}>
                                                        {r.name}
                                                    </SelectItem>
                                                ))}
                                            </SelectContent>
                                        </Select>
                                    </div>

                                    <div className="space-y-2">
                                        <Label htmlFor="emp-joining">Joining Date</Label>
                                        <Input
                                            id="emp-joining"
                                            type="date"
                                            value={form.joining_date}
                                            onChange={(e) => setForm((p) => ({ ...p, joining_date: e.target.value }))}
                                        />
                                    </div>

                                    <div className="space-y-2">
                                        <Label>Branch *</Label>
                                        <Select
                                            value={form.branch_id ?? ""}
                                            onValueChange={(v) =>
                                                setForm((p) => ({
                                                    ...p,
                                                    branch_id: v,
                                                    zone_id: "", // branch change => reset zone
                                                }))
                                            }
                                        >
                                            <SelectTrigger>
                                                <SelectValue placeholder="Select Branch" />
                                            </SelectTrigger>
                                            <SelectContent className="max-h-60">
                                                {branches.map((b) => (
                                                    <SelectItem key={b.id} value={String(b.id)}>
                                                        {b.branch_name}
                                                    </SelectItem>
                                                ))}
                                            </SelectContent>
                                        </Select>
                                    </div>

                                    {/* Zone (ONLY HERE) */}
                                    <div className="space-y-2">
                                        <Label>Zone *</Label>
                                        <Select
                                            value={form.zone_id}
                                            onValueChange={(v) =>
                                                setForm((p) => ({
                                                    ...p,
                                                    zone_id: v,
                                                }))
                                            }
                                            disabled={!form.branch_id}
                                        >
                                            <SelectTrigger>
                                                <SelectValue
                                                    placeholder={!form.branch_id ? "Select branch first" : "Select Zone"}
                                                />
                                            </SelectTrigger>
                                            <SelectContent className="max-h-60">
                                                {zonesOptions.map((z) => (
                                                    <SelectItem key={z.value} value={z.value}>
                                                        {z.label}
                                                    </SelectItem>
                                                ))}
                                            </SelectContent>
                                        </Select>
                                        {!form.branch_id && (
                                            <p className="text-xs text-muted-foreground">
                                                Select branch before Zone selection.
                                            </p>
                                        )}
                                    </div>

                                </div>
                            </div>

                            {/* ADDRESS */}
                            <div className="rounded-xl border bg-muted/10 p-4 space-y-4">
                                <p className="text-sm font-medium">Address</p>

                                <div className="grid gap-4 md:grid-cols-2">
                                    <div className="space-y-2 md:col-span-2">
                                        <Label htmlFor="emp-address">Address</Label>
                                        <Input
                                            id="emp-address"
                                            placeholder="House no, street, locality"
                                            value={form.address}
                                            onChange={(e) => setForm((p) => ({ ...p, address: e.target.value }))}
                                        />
                                    </div>

                                    <div className="space-y-2">
                                        <Label htmlFor="emp-city">City</Label>
                                        <Input
                                            id="emp-city"
                                            placeholder="City"
                                            value={form.city}
                                            onChange={(e) => setForm((p) => ({ ...p, city: e.target.value }))}
                                        />
                                    </div>

                                    <div className="space-y-2">
                                        <Label htmlFor="emp-state">State *</Label>
                                        <Select value={form.state} onValueChange={(v) => setForm((p) => ({ ...p, state: v }))}>
                                            <SelectTrigger id="emp-state">
                                                <SelectValue placeholder="Select your state" />
                                            </SelectTrigger>
                                            <SelectContent className="max-h-60">
                                                {INDIAN_STATES.map((s) => (
                                                    <SelectItem key={s} value={s}>
                                                        {s}
                                                    </SelectItem>
                                                ))}
                                            </SelectContent>
                                        </Select>
                                    </div>

                                    <div className="space-y-2">
                                        <Label htmlFor="emp-pin">Pin Code</Label>
                                        <Input
                                            id="emp-pin"
                                            placeholder="6 digit PIN"
                                            inputMode="numeric"
                                            maxLength={6}
                                            value={form.pincode}
                                            onChange={(e) => {
                                                const digits = e.target.value.replace(/\D/g, "").slice(0, 6);
                                                setForm((p) => ({ ...p, pincode: digits }));
                                            }}
                                        />
                                        {form.pincode && form.pincode.length !== 6 && (
                                            <p className="text-xs text-destructive">Pin code must be exactly 6 digits</p>
                                        )}
                                    </div>
                                </div>
                            </div>

                            {/* IDENTITY */}
                            <div className="rounded-xl border bg-muted/10 p-4 space-y-4">
                                <p className="text-sm font-medium">Identity</p>

                                <div className="grid gap-4 md:grid-cols-2">
                                    <div className="space-y-2">
                                        <Label htmlFor="emp-aadhar">Aadhar Number</Label>
                                        <Input
                                            id="emp-aadhar"
                                            placeholder="12 digits"
                                            maxLength={12}
                                            inputMode="numeric"
                                            pattern="[0-9]*"
                                            value={form.aadhar_number}
                                            onChange={(e) =>
                                                setForm({
                                                    ...form,
                                                    aadhar_number: e.target.value.replace(/\D/g, ""),
                                                })
                                            }
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <Label>Upload Aadhar Both Side Photo</Label>
                                        <Input
                                            type="file"
                                            accept="image/*"
                                            onChange={(e) => {
                                                const file = e.target.files?.[0];
                                                if (!file) return;
                                                setForm({ ...form, photo_file: file });
                                            }}
                                        />
                                        <Input
                                            type="file"
                                            accept="image/*"
                                            onChange={(e) => {
                                                const file = e.target.files?.[0];
                                                if (!file) return;
                                                setForm({ ...form, photo_file: file });
                                            }}
                                        />
                                        <p className="text-xs text-muted-foreground">
                                            PNG/JPG recommended. This matches the styling used in other dialogs.
                                        </p>
                                    </div>

                                    <div className="space-y-2">
                                        <Label htmlFor="emp-pan">PAN Number</Label>
                                        <Input
                                            id="emp-pan"
                                            placeholder="ABCDE1234F"
                                            value={form.pan_number}
                                            maxLength={10}
                                            onChange={(e) => {
                                                let value = e.target.value.toUpperCase();
                                                value = value.replace(/[^A-Z0-9]/g, "");
                                                setForm({ ...form, pan_number: value });
                                            }}
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <Label>Upload PAN Photo</Label>
                                        <Input
                                            type="file"
                                            accept="image/*"
                                            onChange={(e) => {
                                                const file = e.target.files?.[0];
                                                if (!file) return;
                                                setForm({ ...form, photo_file: file });
                                            }}
                                        />
                                        <p className="text-xs text-muted-foreground">
                                            PNG/JPG recommended. This matches the styling used in other dialogs.
                                        </p>
                                    </div>
                                </div>
                            </div>

                            {/* EXPERIENCE */}
                            <div className="rounded-xl border bg-muted/10 p-4 space-y-4">
                                <p className="text-sm font-medium">Experience</p>

                                <div className="grid gap-4 md:grid-cols-2">
                                    <div className="space-y-2">
                                        <Label>Has experience?</Label>
                                        <Select
                                            value={form.experience}
                                            onValueChange={(value) => setForm({ ...form, experience: value })}
                                        >
                                            <SelectTrigger>
                                                <SelectValue placeholder="Select" />
                                            </SelectTrigger>
                                            <SelectContent>
                                                <SelectItem value="yes">Yes</SelectItem>
                                                <SelectItem value="no">No (Fresher)</SelectItem>
                                            </SelectContent>
                                        </Select>
                                    </div>

                                    {form.experience === "yes" && (
                                        <>
                                            <div className="space-y-2">
                                                <Label htmlFor="emp-exp">Total Experience (years)</Label>
                                                <Input
                                                    id="emp-exp"
                                                    placeholder="e.g. 2"
                                                    value={form.total_experience}
                                                    onChange={(e) =>
                                                        setForm({ ...form, total_experience: e.target.value })
                                                    }
                                                />
                                            </div>

                                            <div className="space-y-2">
                                                <Label htmlFor="emp-prevco">Previous Company</Label>
                                                <Input
                                                    id="emp-prevco"
                                                    placeholder="Company name"
                                                    value={form.previous_company}
                                                    onChange={(e) =>
                                                        setForm({ ...form, previous_company: e.target.value })
                                                    }
                                                />
                                            </div>

                                            <div className="space-y-2 md:col-span-2">
                                                <Label>Previous Company Document</Label>
                                                <Select
                                                    value={form.previous_document_type}
                                                    onValueChange={(value) =>
                                                        setForm({
                                                            ...form,
                                                            previous_document_type: value,
                                                            previous_document_file: null,
                                                        })
                                                    }
                                                >
                                                    <SelectTrigger>
                                                        <SelectValue placeholder="Select document type" />
                                                    </SelectTrigger>
                                                    <SelectContent>
                                                        <SelectItem value="offer_letter">Offer Letter</SelectItem>
                                                        <SelectItem value="pay_slip">Pay Slip</SelectItem>
                                                    </SelectContent>
                                                </Select>

                                                {form.previous_document_type && (
                                                    <div className="mt-3 space-y-2">
                                                        <Label>
                                                            Upload{" "}
                                                            {form.previous_document_type === "offer_letter"
                                                                ? "Offer Letter"
                                                                : "Pay Slip"}
                                                        </Label>

                                                        <Input
                                                            type="file"
                                                            accept=".pdf, .docx"
                                                            onChange={(e) => {
                                                                const file = e.target.files?.[0];
                                                                if (!file) return;

                                                                if (file.size > MAX_FILE_SIZE) {
                                                                    setFileError("File size must be 110KB or less");
                                                                    e.target.value = "";
                                                                    setForm({
                                                                        ...form,
                                                                        previous_document_file: null,
                                                                    });
                                                                    return;
                                                                }

                                                                const allowedTypes = [
                                                                    "application/pdf",
                                                                    "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
                                                                ];

                                                                if (!allowedTypes.includes(file.type)) {
                                                                    setFileError("Only PDF or DOCX files are allowed");
                                                                    e.target.value = "";
                                                                    return;
                                                                }

                                                                setFileError("");
                                                                setForm({
                                                                    ...form,
                                                                    previous_document_file: file,
                                                                });
                                                            }}
                                                        />

                                                        {fileError && (
                                                            <p className="text-sm text-destructive">{fileError}</p>
                                                        )}
                                                    </div>
                                                )}
                                            </div>

                                            <div className="space-y-2">
                                                <Label htmlFor="emp-rm-name">Reporting Manager Name</Label>
                                                <Input
                                                    id="emp-rm-name"
                                                    placeholder="Manager name"
                                                    value={form.reporting_manager_name}
                                                    onChange={(e) =>
                                                        setForm({ ...form, reporting_manager_name: e.target.value })
                                                    }
                                                />
                                            </div>

                                            <div className="space-y-2">
                                                <Label htmlFor="emp-rm-email">Reporting Manager Email</Label>
                                                <Input
                                                    type="email"
                                                    placeholder="manager@company.com"
                                                    value={form.reporting_manager_email}
                                                    onChange={(e) =>
                                                        setForm({ ...form, reporting_manager_email: e.target.value })
                                                    }
                                                />

                                                {form.reporting_manager_email &&
                                                    !form.reporting_manager_email.includes("@") && (
                                                        <p className="text-xs text-destructive">
                                                            Email must contain @
                                                        </p>
                                                    )}
                                            </div>

                                            <div className="space-y-2 md:col-span-2">
                                                <Label htmlFor="emp-rm-phone">Reporting Manager Phone</Label>
                                                <Input
                                                    id="emp-rm-phone"
                                                    placeholder="10 digit mobile number"
                                                    inputMode="numeric"
                                                    pattern="[0-9]*"
                                                    maxLength={10}
                                                    value={form.reporting_manager_phone}
                                                    onChange={(e) => {
                                                        const digits = e.target.value.replace(/\D/g, "").slice(0, 10);
                                                        setForm({ ...form, reporting_manager_phone: digits });
                                                    }}
                                                />

                                                {form.reporting_manager_phone &&
                                                    form.reporting_manager_phone.length !== 10 && (
                                                        <p className="text-xs text-destructive">
                                                            Phone number must be exactly 10 digits
                                                        </p>
                                                    )}

                                            </div>
                                        </>
                                    )}
                                </div>
                            </div>
                        </div>
                    </ScrollArea>

                    {/* ===== Footer ===== */}
                    <DialogFooter className="px-6 py-4 border-t bg-card">
                        <Button onClick={handleAddEmployee} disabled={saving}>
                            {saving ? "Saving..." : "Save"}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            <Dialog open={isEditOpen} onOpenChange={setIsEditOpen}>
                <DialogContent
                    className="sm:max-w-[720px] w-[95vw] h-[90vh] p-0 flex flex-col overflow-hidden"
                    onOpenAutoFocus={(e) => e.preventDefault()}
                >
                    <div className="sticky top-0 z-10 bg-background border-b px-6 py-4">
                        <DialogHeader className="p-0">
                            <DialogTitle>
                                Edit Employee – {selectedEmployee?.name}
                            </DialogTitle>
                        </DialogHeader>
                    </div>

                    <div className="flex-1 overflow-y-auto px-6 py-4 space-y-5">
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <Label>Status</Label>
                                <Select
                                    value={form.status}
                                    onValueChange={(value) => setForm({ ...form, status: value })}
                                >
                                    <SelectTrigger>
                                        <SelectValue placeholder="Select status" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="active">Active</SelectItem>
                                        <SelectItem value="probation">Probation</SelectItem>
                                        <SelectItem value="confirmed">Confirmed</SelectItem>
                                        <SelectItem value="notice_period">Notice Period</SelectItem>
                                        <SelectItem value="resigned">Resigned</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>

                            {/* Branch */}
                            <div className="space-y-2">
                                <Label>Branch</Label>
                                <Select
                                    value={form.branch_id ?? ""}
                                    onValueChange={(v) => {
                                        // branch change => zone reset + zones reload
                                        setForm((p) => ({
                                            ...p,
                                            branch_id: v,
                                            zone_id: "",
                                        }));
                                        void fetchZonesOptionsByBranch(v);
                                    }}
                                >
                                    <SelectTrigger>
                                        <SelectValue placeholder="Select Branch" />
                                    </SelectTrigger>
                                    <SelectContent className="max-h-60">
                                        {branches.map((b) => (
                                            <SelectItem key={b.id} value={String(b.id)}>
                                                {b.branch_name}
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>

                            {/* Zone */}
                            <div className="space-y-2">
                                <Label>Zone</Label>
                                <Select
                                    value={form.zone_id ?? ""}
                                    onValueChange={(v) =>
                                        setForm((p) => ({
                                            ...p,
                                            zone_id: v,
                                        }))
                                    }
                                    disabled={!form.branch_id}
                                >
                                    <SelectTrigger>
                                        <SelectValue placeholder={!form.branch_id ? "Select branch first" : "Select Zone"} />
                                    </SelectTrigger>
                                    <SelectContent className="max-h-60">
                                        {zonesOptions.map((z) => (
                                            <SelectItem key={z.value} value={z.value}>
                                                {z.label}
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>

                                {!form.branch_id && (
                                    <p className="text-xs text-muted-foreground">Select branch before Zone selection.</p>
                                )}
                            </div>

                            <div className="space-y-2">
                                <label className="text-sm font-medium">Attendance Type</label>
                                <Select
                                    value={form.attendance_type}
                                    onValueChange={(value) => setForm({ ...form, attendance_type: value })}
                                >
                                    <SelectTrigger>
                                        <SelectValue placeholder="Select attendance type" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="office">Office</SelectItem>
                                        <SelectItem value="field">Field</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>

                            <div className="space-y-2">
                                <Label>State</Label>
                                <Select
                                    value={form.state}
                                    onValueChange={(value) => setForm({ ...form, state: value })}
                                    required
                                >
                                    <SelectTrigger>
                                        <SelectValue placeholder="Select your state" />
                                    </SelectTrigger>
                                    <SelectContent className="max-h-60">
                                        {INDIAN_STATES.map((state) => (
                                            <SelectItem key={state} value={state}>
                                                {state}
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>

                            <div className="space-y-2 sm:col-span-2">
                                <Label>Role</Label>
                                <Select
                                    value={form.role_id}
                                    onValueChange={(value) => setForm({ ...form, role_id: value })}
                                >
                                    <SelectTrigger>
                                        <SelectValue placeholder="Select role" />
                                    </SelectTrigger>

                                    <SelectContent>
                                        {roles
                                            ?.filter((role) => role.name.toLowerCase() !== "admin")
                                            .map((role) => (
                                                <SelectItem key={role.id} value={String(role.id)}>
                                                    {role.name}
                                                </SelectItem>
                                            ))}
                                    </SelectContent>
                                </Select>
                            </div>
                        </div>

                        {/* Address */}
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                            <div className="space-y-2 sm:col-span-2">
                                <Label>Address</Label>
                                <Input
                                    placeholder="Address"
                                    value={form.address}
                                    onChange={(e) => setForm({ ...form, address: e.target.value })}
                                />
                            </div>

                            <div className="space-y-2">
                                <Label>City</Label>
                                <Input
                                    placeholder="City"
                                    value={form.city}
                                    onChange={(e) => setForm({ ...form, city: e.target.value })}
                                />
                            </div>

                            <div className="space-y-2">
                                <Label>Email</Label>
                                <Input
                                    placeholder="Email"
                                    value={form.email}
                                    onChange={(e) => setForm({ ...form, email: e.target.value })}
                                />
                            </div>

                            <div className="space-y-2 sm:col-span-2">
                                <Label>Phone</Label>
                                <Input
                                    id="emp-phone"
                                    placeholder="10 digit mobile number"
                                    inputMode="numeric"
                                    pattern="[0-9]*"
                                    maxLength={10}
                                    value={form.phone}
                                    onChange={(e) => {
                                        const digits = e.target.value.replace(/\D/g, "").slice(0, 10);
                                        setForm({ ...form, phone: digits });
                                    }}
                                />

                                {form.phone && form.phone.length !== 10 && (
                                    <p className="text-xs text-destructive">
                                        Phone number must be exactly 10 digits
                                    </p>
                                )}
                            </div>
                        </div>
                    </div>

                    <div className="sticky bottom-0 z-10 bg-background border-t px-6 py-4">
                        <DialogFooter className="p-0 gap-2">
                            <Button variant="outline" onClick={() => setIsEditOpen(false)}>
                                Cancel
                            </Button>
                            <Button onClick={handleUpdateEmployee} disabled={saving}>
                                {saving ? "Updating..." : "Update"}
                            </Button>
                        </DialogFooter>
                    </div>
                </DialogContent>
            </Dialog>

            <Dialog open={isSalaryOpen} onOpenChange={setIsSalaryOpen}>
                <DialogContent
                    className="
                    sm:max-w-[900px] w-[95vw]
                    h-[90vh]
                    p-0
                    flex flex-col
                    overflow-hidden
                    "
                    onOpenAutoFocus={(e) => e.preventDefault()}
                >
                    <div className="sticky top-0 z-10 bg-background border-b px-6 py-4">
                        <DialogHeader className="p-0">
                            <DialogTitle>
                                Salary Structure – {salaryEmployee?.name}
                            </DialogTitle>
                        </DialogHeader>
                    </div>

                    <ScrollArea className="flex-1 px-6 py-4">
                        <h3 className="font-semibold mb-3">Earnings</h3>

                        <FormRow label="Basic Salary">
                            <Input
                                type="text"
                                pattern="[0-9]*"
                                inputMode="numeric"
                                value={salaryForm.basic}
                                onChange={(e) =>
                                    setSalaryForm({ ...salaryForm, basic: String(Number(e.target.value)) })
                                }
                            />
                        </FormRow>

                        <FormRow label="HRA">
                            <Input
                                type="text"
                                pattern="[0-9]*"
                                inputMode="numeric"
                                value={salaryForm.hra}
                                onChange={(e) =>
                                    setSalaryForm({ ...salaryForm, hra: String(Number(e.target.value)) })
                                }
                            />
                        </FormRow>

                        <FormRow label="Conveyance Allowance">
                            <Input
                                type="text"
                                pattern="[0-9]*"
                                inputMode="numeric"
                                value={salaryForm.conveyance}
                                onChange={(e) =>
                                    setSalaryForm({ ...salaryForm, conveyance: String(Number(e.target.value)) })
                                }
                            />
                        </FormRow>

                        <FormRow label="Medical Allowance">
                            <Input
                                type="text"
                                pattern="[0-9]*"
                                inputMode="numeric"
                                value={salaryForm.medical}
                                onChange={(e) =>
                                    setSalaryForm({ ...salaryForm, medical: String(Number(e.target.value)) })
                                }
                            />
                        </FormRow>

                        <FormRow label="Special Allowance">
                            <Input
                                type="text"
                                pattern="[0-9]*"
                                inputMode="numeric"
                                value={salaryForm.special_allowance}
                                onChange={(e) =>
                                    setSalaryForm({ ...salaryForm, special_allowance: String(Number(e.target.value)) })
                                }
                            />
                        </FormRow>

                        <FormRow label="Other Allowances">
                            <Input
                                type="text"
                                pattern="[0-9]*"
                                inputMode="numeric"
                                value={salaryForm.other_allowance}
                                onChange={(e) =>
                                    setSalaryForm({ ...salaryForm, other_allowance: String(Number(e.target.value)) })
                                }
                            />
                        </FormRow>

                        <h3 className="font-semibold mt-6 mb-3">Deductions</h3>

                        <FormRow label="PF Applicable">
                            <Checkbox
                                checked={salaryForm.pf_applicable}
                                onCheckedChange={(v) =>
                                    setSalaryForm({ ...salaryForm, pf_applicable: Boolean(v) })
                                }
                            />
                        </FormRow>

                        {salaryForm.pf_applicable && (
                            <>
                                <FormRow label="ESI Applicable">
                                    <Checkbox
                                        checked={salaryForm.esi_applicable}
                                        onCheckedChange={(v) =>
                                            setSalaryForm({ ...salaryForm, esi_applicable: Boolean(v) })
                                        }
                                    />
                                </FormRow>
                                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mb-2">
                                    <div>
                                        <Label className="text-sm">PF Number</Label>
                                        <Input
                                            value={salaryForm.pf_number ?? ""}
                                            onChange={(e) => setSalaryForm({ ...salaryForm, pf_number: e.target.value })}
                                            placeholder="PF Number"
                                        />
                                    </div>
                                    <div>
                                        <Label className="text-sm">ESI Number</Label>
                                        <Input
                                            value={salaryForm.esi_number ?? ""}
                                            onChange={(e) => setSalaryForm({ ...salaryForm, esi_number: e.target.value })}
                                            placeholder="ESI Number"
                                        />
                                    </div>
                                    <div>
                                        <Label className="text-sm">UAN Number</Label>
                                        <Input
                                            value={salaryForm.uan_number ?? ""}
                                            onChange={(e) => setSalaryForm({ ...salaryForm, uan_number: e.target.value })}
                                            placeholder="UAN Number"
                                        />

                                    </div>
                                </div>

                                <div className="border rounded-lg p-3 mb-3">
                                    <div className="flex items-center justify-between gap-3 mb-3">
                                        <div className="font-medium">PF Employee Contribution</div>

                                        <RadioGroup
                                            className="flex items-center gap-4"
                                            value={pfMode}
                                            onValueChange={(v: Mode) => setPfMode(v)}
                                        >
                                            <div className="flex items-center gap-2">
                                                <RadioGroupItem value="amount" id="pf-amount" />
                                                <Label htmlFor="pf-amount">Amount</Label>
                                            </div>
                                            <div className="flex items-center gap-2">
                                                <RadioGroupItem value="percent" id="pf-percent" />
                                                <Label htmlFor="pf-percent">Percentage</Label>
                                            </div>
                                        </RadioGroup>
                                    </div>

                                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                                        <div>
                                            <Label className="text-sm">Percentage (%)</Label>
                                            <Input
                                                type="text"
                                                inputMode="decimal"
                                                disabled={pfMode !== "percent"}
                                                value={salaryForm.pf_employee_contribution_percent ?? 0}
                                                onChange={(e) => {
                                                    pfLastEdit.current = "percent"
                                                    setSalaryForm({
                                                        ...salaryForm,
                                                        pf_employee_contribution_percent: Number(e.target.value),
                                                    })
                                                }}
                                            />
                                            <div className="text-xs text-muted-foreground mt-1">
                                                Base: Basic (₹{pfBase})
                                            </div>
                                        </div>

                                        <div>
                                            <Label className="text-sm">Amount (₹)</Label>
                                            <Input
                                                type="text"
                                                inputMode="decimal"
                                                disabled={pfMode !== "amount"}
                                                value={salaryForm.pf_employee_contribution_amount ?? 0}
                                                onChange={(e) => {
                                                    pfLastEdit.current = "amount"
                                                    setSalaryForm({
                                                        ...salaryForm,
                                                        pf_employee_contribution_amount: Number(e.target.value),
                                                    })
                                                }}
                                            />
                                        </div>
                                    </div>
                                </div>

                                {salaryForm.esi_applicable && (
                                    <div className="border rounded-lg p-3 mb-3">
                                        <div className="flex items-center justify-between gap-3 mb-3">
                                            <div className="font-medium">ESI Contribution</div>

                                            <RadioGroup
                                                className="flex items-center gap-4"
                                                value={esiMode}
                                                onValueChange={(v: Mode) => setEsiMode(v)}
                                            >
                                                <div className="flex items-center gap-2">
                                                    <RadioGroupItem value="amount" id="esi-amount" />
                                                    <Label htmlFor="esi-amount">Amount</Label>
                                                </div>
                                                <div className="flex items-center gap-2">
                                                    <RadioGroupItem value="percent" id="esi-percent" />
                                                    <Label htmlFor="esi-percent">Percentage</Label>
                                                </div>
                                            </RadioGroup>
                                        </div>

                                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                                            <div>
                                                <Label className="text-sm">Percentage (%)</Label>
                                                <Input
                                                    type="text"
                                                    inputMode="decimal"
                                                    disabled={esiMode !== "percent"}
                                                    value={salaryForm.esi_contribution_percent ?? 0}
                                                    onChange={(e) => {
                                                        esiLastEdit.current = "percent"
                                                        setSalaryForm({
                                                            ...salaryForm,
                                                            esi_contribution_percent: Number(e.target.value),
                                                        })
                                                    }}
                                                />
                                                <div className="text-xs text-muted-foreground mt-1">
                                                    Base: Gross (₹{toNum(grossSalary)})
                                                </div>
                                            </div>

                                            <div>
                                                <Label className="text-sm">Amount (₹)</Label>
                                                <Input
                                                    type="text"
                                                    inputMode="decimal"
                                                    disabled={esiMode !== "amount"}
                                                    value={salaryForm.esi_contribution_amount ?? 0}
                                                    onChange={(e) => {
                                                        esiLastEdit.current = "amount"
                                                        setSalaryForm({
                                                            ...salaryForm,
                                                            esi_contribution_amount: Number(e.target.value),
                                                        })
                                                    }}
                                                />
                                            </div>
                                        </div>
                                    </div>
                                )}
                            </>
                        )}

                        <FormRow label="Professional Tax">
                            <Input
                                type="text"
                                pattern="[0-9]*"
                                inputMode="numeric"
                                placeholder="Professional tax"
                                value={salaryForm.professional_tax}
                                onChange={(e) =>
                                    setSalaryForm({ ...salaryForm, professional_tax: Number(e.target.value) })
                                }
                            />
                        </FormRow>

                        <FormRow label="TDS">
                            <Input
                                type="text"
                                pattern="[0-9]*"
                                inputMode="numeric"
                                placeholder="TDS amount"
                                value={salaryForm.tds}
                                onChange={(e) => setSalaryForm({ ...salaryForm, tds: Number(e.target.value) })}
                            />
                        </FormRow>

                        <FormRow label="Other Deductions">
                            <Input
                                type="text"
                                placeholder="Other deductions"
                                value={salaryForm.other_deductions}
                                onChange={(e) =>
                                    setSalaryForm({ ...salaryForm, other_deductions: Number(e.target.value) })
                                }
                            />
                        </FormRow>

                        <div className="border-t mt-6 pt-4 grid gap-2">
                            <div className="grid grid-cols-3">
                                <span>Gross Salary</span>
                                <span className="col-span-2 font-medium">₹{grossSalary}</span>
                            </div>

                            <div className="grid grid-cols-3">
                                <span>Total Deductions</span>
                                <span className="col-span-2 font-medium">₹{totalDeductions}</span>
                            </div>

                            <div className="grid grid-cols-3 text-lg font-semibold">
                                <span>Net Payable</span>
                                <span className="col-span-2">₹{netPayable}</span>
                            </div>
                        </div>
                    </ScrollArea>

                    <div className="sticky bottom-0 z-10 bg-background border-t px-6 py-4">
                        <DialogFooter className="p-0 gap-2 sm:gap-3">
                            <Button variant="outline" onClick={() => setIsSalaryOpen(false)}>
                                Cancel
                            </Button>
                            <Button onClick={handleSaveSalary}>Save Salary Structure</Button>
                        </DialogFooter>
                    </div>
                </DialogContent>
            </Dialog>

        </div>
    );
};

export default Employee;
