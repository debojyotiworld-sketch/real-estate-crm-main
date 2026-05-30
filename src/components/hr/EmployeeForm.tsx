import React, { useEffect, useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Loader2, UserPlus,Users, UserCircle, Briefcase, MapPin, CreditCard, ShieldCheck, FileText, UploadCloud, AlertCircle } from "lucide-react";
import { useEmployees } from "@/hooks/hr/useEmployees";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";

interface Props {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    employee?: any;
}

const INDIAN_STATES = [
    "Andhra Pradesh", "Arunachal Pradesh", "Assam", "Bihar", "Chhattisgarh", "Goa", "Gujarat", 
    "Haryana", "Himachal Pradesh", "Jharkhand", "Karnataka", "Kerala", "Madhya Pradesh", 
    "Maharashtra", "Manipur", "Meghalaya", "Mizoram", "Nagaland", "Odisha", "Punjab", 
    "Rajasthan", "Sikkim", "Tamil Nadu", "Telangana", "Tripura", "Uttar Pradesh", "Uttarakhand", "West Bengal"
];

export default function EmployeeForm({ open, onOpenChange, employee }: Props) {
    const { createEmployee, updateEmployee, branches, roles, zones, fetchZones, generateEmployeeCode, saving } = useEmployees();
    
    const [empCode, setEmpCode] = useState("");
    const [activeTab, setActiveTab] = useState("personal");
    const [uploading, setUploading] = useState(false);
    
    // File States
    const [files, setFiles] = useState({
        photo: null as File | null,
        aadhar: null as File | null,
        experience: null as File | null
    });

    // Form State
    const [form, setForm] = useState({
        name: "", email: "", phone: "", address: "", city: "", state: "", pincode: "",
        aadhar_number: "", pan_number: "",
        department: "", designation: "", role_id: "", branch_id: "", zone_id: "", 
        status: "active", attendance_type: "office", joining_date: "",
        reporting_manager_name: "", reporting_manager_phone: "", reporting_manager_email: "",
        experience: "no", total_experience: "", previous_company: "", previous_document_type: "",
        photo_url: "", aadhar_photo: "", previous_document_path: ""
    });

    // Validation Errors State
    const [errors, setErrors] = useState<Record<string, string>>({});

    useEffect(() => {
        if (open) {
            setActiveTab("personal");
            setErrors({});
            setFiles({ photo: null, aadhar: null, experience: null });

            if (employee) {
                setEmpCode(employee.employee_code || "");
                if (employee.branch_id) fetchZones(employee.branch_id);
                setForm({
                    name: employee.name || "", email: employee.email || "", phone: employee.phone || "",
                    address: employee.address || "", city: employee.city || "", state: employee.state || "", pincode: employee.pincode || "",
                    aadhar_number: employee.aadhar_number || "", pan_number: employee.pan_number || "",
                    department: employee.department || "", designation: employee.designation || "",
                    role_id: employee.role_id ? String(employee.role_id) : "", branch_id: employee.branch_id ? String(employee.branch_id) : "", zone_id: employee.zone_id ? String(employee.zone_id) : "",
                    status: employee.status || "active", attendance_type: employee.attendance_type || "office", joining_date: employee.joining_date || "",
                    reporting_manager_name: employee.reporting_manager_name || "", reporting_manager_phone: employee.reporting_manager_phone || "", reporting_manager_email: employee.reporting_manager_email || "",
                    experience: employee.experience || "no", total_experience: employee.total_experience || "", previous_company: employee.previous_company || "", previous_document_type: employee.previous_document_type || "",
                    photo_url: employee.photo_url || "", aadhar_photo: employee.aadhar_photo || "", previous_document_path: employee.previous_document_path || ""
                });
            } else {
                setEmpCode("");
                setForm({
                    name: "", email: "", phone: "", address: "", city: "", state: "", pincode: "", aadhar_number: "", pan_number: "",
                    department: "", designation: "", role_id: "", branch_id: "", zone_id: "", status: "active", attendance_type: "office", joining_date: "",
                    reporting_manager_name: "", reporting_manager_phone: "", reporting_manager_email: "",
                    experience: "no", total_experience: "", previous_company: "", previous_document_type: "",
                    photo_url: "", aadhar_photo: "", previous_document_path: ""
                });
            }
        }
    }, [open, employee, fetchZones]);

    useEffect(() => {
        if (!employee && form.department) {
            generateEmployeeCode(form.department).then(code => { if (code) setEmpCode(code); });
        }
    }, [form.department, employee, generateEmployeeCode]);

    // Form Validation Logic
    const validateForm = () => {
        let newErrors: Record<string, string> = {};
        let isValid = true;

        if (!form.name.trim()) newErrors.name = "Full name is required";
        
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!form.email || !emailRegex.test(form.email)) newErrors.email = "Valid email is required";
        
        if (form.phone && form.phone.length !== 10) newErrors.phone = "Phone number must be exactly 10 digits";
        
        if (form.pan_number) {
            const panRegex = /^[A-Z]{5}[0-9]{4}[A-Z]{1}$/;
            if (!panRegex.test(form.pan_number)) newErrors.pan_number = "Invalid PAN format (e.g. ABCDE1234F)";
        }
        
        if (form.aadhar_number && form.aadhar_number.length !== 12) newErrors.aadhar_number = "Aadhar must be exactly 12 digits";
        
        if (!form.branch_id) newErrors.branch_id = "Branch assignment is mandatory";
        if (!form.role_id) newErrors.role_id = "System Role is mandatory";

        if (Object.keys(newErrors).length > 0) {
            setErrors(newErrors);
            isValid = false;
            toast.error("Please fix the validation errors in the form.");
            
            // Switch to Personal Tab if error is there
            if (newErrors.name || newErrors.email || newErrors.phone || newErrors.pan_number || newErrors.aadhar_number) {
                setActiveTab("personal");
            } else if (newErrors.branch_id || newErrors.role_id) {
                setActiveTab("job");
            }
        }
        return isValid;
    };

    // Real Supabase Storage Upload Logic
    const uploadToBucket = async (file: File, folder: string) => {
        const fileExt = file.name.split('.').pop();
        const fileName = `${Date.now()}_${Math.random().toString(36).substring(7)}.${fileExt}`;
        const filePath = `${folder}/${fileName}`;

        const { data, error } = await supabase.storage
            .from('employee_documents') // MUST Create this bucket in Supabase Dashboard
            .upload(filePath, file);

        if (error) throw error;
        
        const { data: publicUrlData } = supabase.storage
            .from('employee_documents')
            .getPublicUrl(filePath);
            
        return publicUrlData.publicUrl;
    };

    const handleBranchChange = (branchId: string) => {
        setForm(prev => ({ ...prev, branch_id: branchId, zone_id: "" }));
        fetchZones(branchId);
    };

    const handleSubmit = async () => {
        if (!validateForm()) return;
        setUploading(true);

        try {
            let finalPayload = { ...form, employee_code: empCode, branch_id: form.branch_id || null, zone_id: form.zone_id || null, role_id: form.role_id || null };

            // Upload files if selected
            if (files.photo) finalPayload.photo_url = await uploadToBucket(files.photo, 'avatars');
            if (files.aadhar) finalPayload.aadhar_photo = await uploadToBucket(files.aadhar, 'kyc');
            if (files.experience) finalPayload.previous_document_path = await uploadToBucket(files.experience, 'experience');

            let success = false;
            if (employee) {
                success = await updateEmployee(employee.id, finalPayload);
            } else {
                const response = await createEmployee(finalPayload as any);
                if (response) success = true;
            }

            if (success) {
                toast.success(employee ? "Profile updated successfully!" : "Employee registered successfully!");
                onOpenChange(false);
            }
        } catch (error: any) {
            console.error("Upload/Save Error:", error);
            toast.error(error.message || "Failed to save employee details");
        } finally {
            setUploading(false);
        }
    };

    const isProcessing = saving || uploading;

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="max-w-[1050px] h-[90vh] flex flex-col p-0 overflow-hidden rounded-xl bg-slate-50/50">
                <DialogHeader className="px-6 py-4 border-b bg-white shrink-0 shadow-sm z-10 flex flex-row items-center justify-between">
                    <DialogTitle className="text-xl font-bold flex items-center gap-3 text-slate-800">
                        <div className="bg-indigo-100 p-2 rounded-lg text-indigo-700">
                            {employee ? <UserCircle className="h-5 w-5"/> : <UserPlus className="h-5 w-5"/>}
                        </div> 
                        {employee ? "Edit Employee Profile" : "Register New Employee"}
                    </DialogTitle>
                    <div className="mr-8">
                        <span className="text-xs uppercase font-bold text-slate-500 mr-2">EMP CODE:</span>
                        <span className="font-mono bg-slate-100 border px-3 py-1 rounded-md text-slate-800 font-bold">{empCode || "PENDING"}</span>
                    </div>
                </DialogHeader>
                
                <Tabs value={activeTab} onValueChange={setActiveTab} className="flex-1 flex flex-col overflow-hidden">
                    <div className="px-6 py-2 bg-white border-b shrink-0 z-10 shadow-sm">
                        <TabsList className="grid w-full md:w-[600px] grid-cols-3 bg-slate-100">
                            <TabsTrigger value="personal" className="data-[state=active]:bg-white data-[state=active]:shadow-sm data-[state=active]:text-indigo-700">
                                <UserCircle className="h-4 w-4 mr-2"/> Personal & KYC
                            </TabsTrigger>
                            <TabsTrigger value="job" className="data-[state=active]:bg-white data-[state=active]:shadow-sm data-[state=active]:text-indigo-700">
                                <Briefcase className="h-4 w-4 mr-2"/> Job & Hierarchy
                            </TabsTrigger>
                            <TabsTrigger value="docs" className="data-[state=active]:bg-white data-[state=active]:shadow-sm data-[state=active]:text-indigo-700">
                                <FileText className="h-4 w-4 mr-2"/> Experience & Docs
                            </TabsTrigger>
                        </TabsList>
                    </div>

                    <ScrollArea className="flex-1 px-6 py-6">
                        {/* TAB 1: PERSONAL & KYC */}
                        <TabsContent value="personal" className="m-0 space-y-6">
                            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 max-w-5xl mx-auto">
                                <Card className="shadow-sm border-slate-200">
                                    <CardHeader className="py-3 border-b bg-slate-50/50"><CardTitle className="text-sm flex items-center gap-2 text-slate-700"><UserCircle className="h-4 w-4"/> Personal Information</CardTitle></CardHeader>
                                    <CardContent className="pt-5 space-y-4">
                                        <div className="space-y-1.5">
                                            <Label className="text-xs font-bold text-slate-600">Full Name <span className="text-rose-500">*</span></Label>
                                            <Input value={form.name} onChange={e=>{setForm({...form, name:e.target.value}); setErrors({...errors, name:""});}} className={`h-9 ${errors.name ? "border-rose-500 bg-rose-50" : ""}`}/>
                                            {errors.name && <p className="text-[10px] text-rose-500 flex items-center mt-1"><AlertCircle className="h-3 w-3 mr-1"/> {errors.name}</p>}
                                        </div>
                                        <div className="grid grid-cols-2 gap-4">
                                            <div className="space-y-1.5">
                                                <Label className="text-xs font-bold text-slate-600">Email Address <span className="text-rose-500">*</span></Label>
                                                <Input type="email" value={form.email} onChange={e=>{setForm({...form, email:e.target.value}); setErrors({...errors, email:""});}} className={`h-9 ${errors.email ? "border-rose-500 bg-rose-50" : ""}`}/>
                                                {errors.email && <p className="text-[10px] text-rose-500 flex items-center mt-1"><AlertCircle className="h-3 w-3 mr-1"/> {errors.email}</p>}
                                            </div>
                                            <div className="space-y-1.5">
                                                <Label className="text-xs font-bold text-slate-600">Phone Number</Label>
                                                <Input type="tel" maxLength={10} value={form.phone} onChange={e=>{setForm({...form, phone:e.target.value.replace(/\D/g, '')}); setErrors({...errors, phone:""});}} className={`h-9 ${errors.phone ? "border-rose-500 bg-rose-50" : ""}`}/>
                                                {errors.phone ? <p className="text-[10px] text-rose-500 flex items-center mt-1"><AlertCircle className="h-3 w-3 mr-1"/> {errors.phone}</p> 
                                                : <p className="text-[10px] text-slate-400 mt-1">Must be 10 digits</p>}
                                            </div>
                                        </div>
                                    </CardContent>
                                </Card>

                                <Card className="shadow-sm border-slate-200">
                                    <CardHeader className="py-3 border-b bg-slate-50/50"><CardTitle className="text-sm flex items-center gap-2 text-slate-700"><MapPin className="h-4 w-4"/> Location & Address</CardTitle></CardHeader>
                                    <CardContent className="pt-5 space-y-4">
                                        <div className="space-y-1.5"><Label className="text-xs font-bold text-slate-600">Full Address</Label><Input value={form.address} onChange={e=>setForm({...form, address:e.target.value})} className="h-9"/></div>
                                        <div className="grid grid-cols-3 gap-4">
                                            <div className="space-y-1.5"><Label className="text-xs font-bold text-slate-600">City</Label><Input value={form.city} onChange={e=>setForm({...form, city:e.target.value})} className="h-9"/></div>
                                            <div className="space-y-1.5"><Label className="text-xs font-bold text-slate-600">State</Label>
                                                <Select value={form.state} onValueChange={v=>setForm({...form, state:v})}>
                                                    <SelectTrigger className="h-9"><SelectValue placeholder="Select" /></SelectTrigger>
                                                    <SelectContent>{INDIAN_STATES.map(s => <SelectItem key={s} value={s}>{s}</SelectItem>)}</SelectContent>
                                                </Select>
                                            </div>
                                            <div className="space-y-1.5"><Label className="text-xs font-bold text-slate-600">Pincode</Label><Input maxLength={6} value={form.pincode} onChange={e=>setForm({...form, pincode:e.target.value.replace(/\D/g, '')})} className="h-9"/></div>
                                        </div>
                                    </CardContent>
                                </Card>
                                
                                <Card className="shadow-sm border-slate-200 lg:col-span-2">
                                    <CardHeader className="py-3 border-b bg-slate-50/50"><CardTitle className="text-sm flex items-center gap-2 text-slate-700"><CreditCard className="h-4 w-4"/> Statutory KYC Details</CardTitle></CardHeader>
                                    <CardContent className="pt-5 grid grid-cols-2 gap-6">
                                        <div className="space-y-1.5">
                                            <Label className="text-xs font-bold text-slate-600">PAN Number</Label>
                                            <Input maxLength={10} value={form.pan_number} onChange={e=>{setForm({...form, pan_number:e.target.value.toUpperCase().replace(/[^A-Z0-9]/g, "")}); setErrors({...errors, pan_number:""});}} className={`h-9 uppercase ${errors.pan_number ? "border-rose-500 bg-rose-50" : ""}`}/>
                                            {errors.pan_number ? <p className="text-[10px] text-rose-500 flex items-center mt-1"><AlertCircle className="h-3 w-3 mr-1"/> {errors.pan_number}</p>
                                            : <p className="text-[10px] text-slate-400 mt-1">Example: ABCDE1234F</p>}
                                        </div>
                                        <div className="space-y-1.5">
                                            <Label className="text-xs font-bold text-slate-600">Aadhar Number</Label>
                                            <Input maxLength={12} value={form.aadhar_number} onChange={e=>{setForm({...form, aadhar_number:e.target.value.replace(/\D/g, '')}); setErrors({...errors, aadhar_number:""});}} className={`h-9 ${errors.aadhar_number ? "border-rose-500 bg-rose-50" : ""}`}/>
                                            {errors.aadhar_number ? <p className="text-[10px] text-rose-500 flex items-center mt-1"><AlertCircle className="h-3 w-3 mr-1"/> {errors.aadhar_number}</p>
                                            : <p className="text-[10px] text-slate-400 mt-1">Must be exactly 12 digits</p>}
                                        </div>
                                    </CardContent>
                                </Card>
                            </div>
                        </TabsContent>

                        {/* TAB 2: JOB & HIERARCHY */}
                        <TabsContent value="job" className="m-0 space-y-6">
                            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 max-w-5xl mx-auto">
                                <Card className="shadow-sm border-slate-200">
                                    <CardHeader className="py-3 border-b bg-indigo-50/30"><CardTitle className="text-sm flex items-center gap-2 text-indigo-900"><Briefcase className="h-4 w-4"/> Job Profile</CardTitle></CardHeader>
                                    <CardContent className="pt-5 space-y-4">
                                        <div className="grid grid-cols-2 gap-4">
                                            <div className="space-y-1.5"><Label className="text-xs font-bold text-slate-600">Department</Label>
                                                <Select value={form.department} onValueChange={v=>setForm({...form, department:v})}>
                                                    <SelectTrigger className="h-9"><SelectValue placeholder="Department" /></SelectTrigger>
                                                    <SelectContent><SelectItem value="HR">HR</SelectItem><SelectItem value="Sales">Sales</SelectItem><SelectItem value="IT">IT</SelectItem><SelectItem value="Accounts">Accounts</SelectItem><SelectItem value="Backoffice">Backoffice</SelectItem></SelectContent>
                                                </Select>
                                            </div>
                                            <div className="space-y-1.5"><Label className="text-xs font-bold text-slate-600">Designation</Label><Input value={form.designation} onChange={e=>setForm({...form, designation:e.target.value})} className="h-9"/></div>
                                        </div>
                                        <div className="grid grid-cols-2 gap-4">
                                            <div className="space-y-1.5">
                                                <Label className="text-xs font-bold text-slate-600">System Role <span className="text-rose-500">*</span></Label>
                                                <Select value={form.role_id} onValueChange={v=>{setForm({...form, role_id:v}); setErrors({...errors, role_id:""});}}>
                                                    <SelectTrigger className={`h-9 ${errors.role_id ? "border-rose-500 bg-rose-50" : ""}`}><SelectValue placeholder="Role" /></SelectTrigger>
                                                    <SelectContent>{roles.map((r: any) => <SelectItem key={r.id} value={String(r.id)}>{r.name}</SelectItem>)}</SelectContent>
                                                </Select>
                                                {errors.role_id && <p className="text-[10px] text-rose-500 mt-1">{errors.role_id}</p>}
                                            </div>
                                            <div className="space-y-1.5"><Label className="text-xs font-bold text-slate-600">Date of Joining</Label><Input type="date" value={form.joining_date} onChange={e=>setForm({...form, joining_date:e.target.value})} className="h-9"/></div>
                                        </div>
                                        <div className="grid grid-cols-2 gap-4 border-t pt-4">
                                            <div className="space-y-1.5">
                                                <Label className="text-xs font-bold text-slate-600">Branch <span className="text-rose-500">*</span></Label>
                                                <Select value={form.branch_id} onValueChange={v=>{handleBranchChange(v); setErrors({...errors, branch_id:""});}}>
                                                    <SelectTrigger className={`h-9 ${errors.branch_id ? "border-rose-500 bg-rose-50" : ""}`}><SelectValue placeholder="Branch" /></SelectTrigger>
                                                    <SelectContent>{branches.map((b: any) => <SelectItem key={b.id} value={String(b.id)}>{b.branch_name}</SelectItem>)}</SelectContent>
                                                </Select>
                                                {errors.branch_id && <p className="text-[10px] text-rose-500 mt-1">{errors.branch_id}</p>}
                                            </div>
                                            <div className="space-y-1.5"><Label className="text-xs font-bold text-slate-600">Sales Zone</Label>
                                                <Select value={form.zone_id} onValueChange={v=>setForm({...form, zone_id:v})} disabled={!form.branch_id}>
                                                    <SelectTrigger className="h-9"><SelectValue placeholder={!form.branch_id ? "Select Branch First" : "Zone"} /></SelectTrigger>
                                                    <SelectContent>{zones.map((z: any) => <SelectItem key={z.id} value={String(z.id)}>{z.zone_name}</SelectItem>)}</SelectContent>
                                                </Select>
                                            </div>
                                        </div>
                                    </CardContent>
                                </Card>

                                <Card className="shadow-sm border-slate-200">
                                    <CardHeader className="py-3 border-b bg-slate-50/50"><CardTitle className="text-sm flex items-center gap-2 text-slate-700"><Users className="h-4 w-4"/> Reporting Manager</CardTitle></CardHeader>
                                    <CardContent className="pt-5 space-y-4">
                                        <div className="space-y-1.5"><Label className="text-xs font-bold text-slate-600">Manager Name</Label><Input value={form.reporting_manager_name} onChange={e=>setForm({...form, reporting_manager_name:e.target.value})} className="h-9"/></div>
                                        <div className="space-y-1.5"><Label className="text-xs font-bold text-slate-600">Manager Email</Label><Input type="email" value={form.reporting_manager_email} onChange={e=>setForm({...form, reporting_manager_email:e.target.value})} className="h-9"/></div>
                                        <div className="space-y-1.5"><Label className="text-xs font-bold text-slate-600">Manager Phone</Label><Input type="tel" maxLength={10} value={form.reporting_manager_phone} onChange={e=>setForm({...form, reporting_manager_phone:e.target.value.replace(/\D/g, '')})} className="h-9"/></div>
                                    </CardContent>
                                </Card>
                            </div>
                        </TabsContent>

                        {/* TAB 3: EXPERIENCE & DOCS */}
                        <TabsContent value="docs" className="m-0 space-y-6">
                            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 max-w-5xl mx-auto">
                                <Card className="shadow-sm border-slate-200">
                                    <CardHeader className="py-3 border-b bg-slate-50/50"><CardTitle className="text-sm flex items-center gap-2 text-slate-700"><ShieldCheck className="h-4 w-4"/> Past Experience</CardTitle></CardHeader>
                                    <CardContent className="pt-5 space-y-4">
                                        <div className="space-y-1.5"><Label className="text-xs font-bold text-slate-600">Work Experience</Label>
                                            <Select value={form.experience} onValueChange={v=>setForm({...form, experience:v, total_experience: v==='no'?'':form.total_experience, previous_company: v==='no'?'':form.previous_company})}>
                                                <SelectTrigger className="h-9"><SelectValue/></SelectTrigger>
                                                <SelectContent><SelectItem value="no">Fresher (No prior experience)</SelectItem><SelectItem value="yes">Experienced Professional</SelectItem></SelectContent>
                                            </Select>
                                        </div>
                                        {form.experience === 'yes' && (
                                            <div className="grid grid-cols-2 gap-4 animate-in fade-in zoom-in duration-200">
                                                <div className="space-y-1.5"><Label className="text-xs font-bold text-slate-600">Total Yrs Exp.</Label><Input type="number" value={form.total_experience} onChange={e=>setForm({...form, total_experience:e.target.value})} className="h-9"/></div>
                                                <div className="space-y-1.5"><Label className="text-xs font-bold text-slate-600">Previous Company</Label><Input value={form.previous_company} onChange={e=>setForm({...form, previous_company:e.target.value})} className="h-9"/></div>
                                            </div>
                                        )}
                                    </CardContent>
                                </Card>

                                <Card className="shadow-sm border-slate-200">
                                    <CardHeader className="py-3 border-b bg-slate-50/50"><CardTitle className="text-sm flex items-center gap-2 text-slate-700"><UploadCloud className="h-4 w-4"/> Secure Document Uploads</CardTitle></CardHeader>
                                    <CardContent className="pt-5 space-y-5">
                                        <div className="bg-blue-50 border border-blue-100 p-3 rounded-lg flex gap-3 text-sm text-blue-800 mb-4">
                                            <AlertCircle className="h-5 w-5 shrink-0" />
                                            <p className="leading-tight">Files will be securely stored in the <b>employee_documents</b> bucket on Supabase.</p>
                                        </div>

                                        <div className="space-y-1.5">
                                            <Label className="text-xs font-bold text-slate-600">Profile Photo (Avatar)</Label>
                                            <Input type="file" accept="image/*" onChange={(e) => setFiles({...files, photo: e.target.files?.[0] || null})} className="h-10 pt-2 text-slate-500 cursor-pointer" />
                                            {form.photo_url && !files.photo && <p className="text-[10px] text-emerald-600 font-medium">✓ File already uploaded</p>}
                                        </div>
                                        <div className="space-y-1.5">
                                            <Label className="text-xs font-bold text-slate-600">Aadhar Card Scan</Label>
                                            <Input type="file" accept="image/*,.pdf" onChange={(e) => setFiles({...files, aadhar: e.target.files?.[0] || null})} className="h-10 pt-2 text-slate-500 cursor-pointer" />
                                            {form.aadhar_photo && !files.aadhar && <p className="text-[10px] text-emerald-600 font-medium">✓ File already uploaded</p>}
                                        </div>
                                        {form.experience === 'yes' && (
                                            <div className="space-y-1.5">
                                                <Label className="text-xs font-bold text-slate-600">Experience / Relieving Document</Label>
                                                <Input type="file" accept="image/*,.pdf" onChange={(e) => setFiles({...files, experience: e.target.files?.[0] || null})} className="h-10 pt-2 text-slate-500 cursor-pointer" />
                                                {form.previous_document_path && !files.experience && <p className="text-[10px] text-emerald-600 font-medium">✓ File already uploaded</p>}
                                            </div>
                                        )}
                                    </CardContent>
                                </Card>
                            </div>
                        </TabsContent>
                    </ScrollArea>
                </Tabs>

                <DialogFooter className="bg-white border-t px-6 py-4 shrink-0 z-10 shadow-[0_-4px_15px_-10px_rgba(0,0,0,0.1)] flex items-center justify-between">
                    <div className="text-xs text-slate-500">
                        Fields marked with <span className="text-rose-500 font-bold">*</span> are mandatory.
                    </div>
                    <div className="flex gap-2">
                        <Button variant="outline" onClick={() => onOpenChange(false)} className="h-10">Cancel</Button>
                        <Button onClick={handleSubmit} disabled={isProcessing} className="bg-indigo-600 hover:bg-indigo-700 text-white px-8 h-10 shadow-md">
                            {isProcessing ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Saving...</> : (employee ? "Update Profile" : "Register Employee")}
                        </Button>
                    </div>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}