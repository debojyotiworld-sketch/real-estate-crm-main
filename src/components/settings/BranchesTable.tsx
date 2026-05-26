import { useEffect, useMemo, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { z } from "zod";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import {
    Card,
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle,
} from "@/components/ui/card";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from "@/components/ui/dialog";

import { Building2, Edit, Plus, Save, Trash2, Wifi } from "lucide-react";

import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";

// ---------------------------
// Types based on YOUR schema
// ---------------------------
type BranchRow = {
    id: string;
    company_id: string | null;
    branch_name: string;
    branch_code: string | null;
    branch_address: string | null;
    branch_city: string | null;
    branch_state: string | null;
    branch_ip_cidrs: any[] | null; // jsonb[]
    is_active: boolean;
    created_at: string;
};

// ---------------------------
// Branch code generator
// ---------------------------
function nextBranchCode(existingCodes: (string | null | undefined)[]): string {
    const nums = existingCodes
        .map((c) => (c ?? "").trim())
        .map((c) => {
            const m = /^BRC-(\d{3,})$/i.exec(c);
            return m ? parseInt(m[1], 10) : null;
        })
        .filter((n): n is number => n !== null);

    const next = (nums.length ? Math.max(...nums) : 0) + 1;
    return `BRC-${String(next).padStart(3, "0")}`;
}

// ---------------------------
// Form schema (Zod)
// ---------------------------
const branchSchema = z.object({
    branch_name: z.string().min(1, "Branch name is required").max(120),
    branch_code: z
        .string()
        .min(1, "Branch code is required")
        .regex(/^BRC-\d{3,}$/i, "Branch code must be like BRC-001"),
    branch_address: z.string().max(500).optional().or(z.literal("")),
    branch_city: z.string().max(120).optional().or(z.literal("")),
    branch_state: z.string().max(120).optional().or(z.literal("")),
    is_active: z.boolean().default(true),
});

type BranchForm = z.infer<typeof branchSchema>;

// ---------------------------
// Helpers
// ---------------------------
function parseIpJsonbArrayToText(ipJsonb: any[] | null | undefined): string {
    if (!ipJsonb || !Array.isArray(ipJsonb)) return "";
    const ips = ipJsonb
        .map((x) => {
            if (typeof x === "string") return x;
            if (x && typeof x === "object") return x.value ?? x.ip ?? x.cidr ?? "";
            return "";
        })
        .map((s) => String(s).trim())
        .filter(Boolean);

    return ips.join("\n");
}

function normalizeIpTextToJsonbArray(value: string): any[] {
    const parts = value
        .split(/[\n,]/g)
        .map((s) => s.trim())
        .filter(Boolean);

    const deduped = Array.from(new Set(parts));
    return deduped.map((ip) => ({ value: ip }));
}

export default function BranchesTable() {
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
        "West Bengal",
    ];

    const [loading, setLoading] = useState(true);
    const [branches, setBranches] = useState<BranchRow[]>([]);
    const [open, setOpen] = useState(false);
    const [editing, setEditing] = useState<BranchRow | null>(null);
    const [saving, setSaving] = useState(false);
    const [deletingId, setDeletingId] = useState<string | null>(null);
    const [ipText, setIpText] = useState("");

    const {
        register,
        handleSubmit,
        reset,
        setValue,
        watch,
        formState: { errors },
    } = useForm<BranchForm>({
        resolver: zodResolver(branchSchema),
        defaultValues: {
            branch_name: "",
            branch_code: "BRC-001",
            branch_address: "",
            branch_city: "",
            branch_state: "",
            is_active: true,
        },
    });

    const isActive = watch("is_active");
    const branchState = watch("branch_state");

    const dialogTitle = useMemo(
        () => (editing ? "Edit Branch" : "Add Branch"),
        [editing]
    );

    useEffect(() => {
        void loadBranches();
    }, []);

    const loadBranches = async () => {
        setLoading(true);
        try {
            const { data, error } = await supabase
                .from("branches")
                .select("*")
                .order("created_at", { ascending: false });

            if (error) throw error;
            setBranches((data ?? []) as BranchRow[]);
        } catch (e: any) {
            console.error(e);
            toast.error(e?.message ?? "Failed to load branches");
        } finally {
            setLoading(false);
        }
    };

    const startCreate = () => {
        setEditing(null);

        // Auto code based on existing rows in DB (loaded into state)
        const code = nextBranchCode(branches.map((b) => b.branch_code));

        reset({
            branch_name: "",
            branch_code: code,
            branch_address: "",
            branch_city: "",
            branch_state: "",
            is_active: true,
        });

        setIpText("");
        setOpen(true);
    };

    const startEdit = (b: BranchRow) => {
        setEditing(b);

        reset({
            branch_name: b.branch_name ?? "",
            branch_code: b.branch_code ?? "BRC-001",
            branch_address: b.branch_address ?? "",
            branch_city: b.branch_city ?? "",
            branch_state: b.branch_state ?? "",
            is_active: !!b.is_active,
        });

        setIpText(parseIpJsonbArrayToText(b.branch_ip_cidrs));
        setOpen(true);
    };

    const onSubmit = async (values: BranchForm) => {
        setSaving(true);
        try {
            const ipJsonb = normalizeIpTextToJsonbArray(ipText);

            const payload = {
                branch_name: values.branch_name,
                branch_code: values.branch_code?.trim() ? values.branch_code.trim() : null,
                branch_address: values.branch_address?.trim() ? values.branch_address.trim() : null,
                branch_city: values.branch_city?.trim() ? values.branch_city.trim() : null,
                branch_state: values.branch_state?.trim() ? values.branch_state.trim() : null,
                branch_ip_cidrs: ipJsonb.length ? ipJsonb : null,
                is_active: values.is_active,
            };

            if (!editing) {
                const { error } = await supabase.from("branches").insert(payload);
                if (error) throw error;
                toast.success("Branch created");
            } else {
                const { error } = await supabase
                    .from("branches")
                    .update(payload)
                    .eq("id", editing.id);
                if (error) throw error;
                toast.success("Branch updated");
            }

            setOpen(false);
            await loadBranches();
        } catch (e: any) {
            console.error(e);

            const msg =
                String(e?.message ?? "").toLowerCase().includes("branches_branch_code_key") ||
                    String(e?.message ?? "").toLowerCase().includes("duplicate key")
                    ? "Branch code already exists. Please try again."
                    : e?.message ?? "Failed to save branch";

            toast.error(msg);
        } finally {
            setSaving(false);
        }
    };

    const deleteBranch = async (b: BranchRow) => {
        setDeletingId(b.id);
        try {
            const { error } = await supabase.from("branches").delete().eq("id", b.id);
            if (error) throw error;

            toast.success("Branch deleted");
            await loadBranches();
        } catch (e: any) {
            console.error(e);
            toast.error(e?.message ?? "Failed to delete branch");
        } finally {
            setDeletingId(null);
        }
    };

    return ( 
        <div className="space-y-6">
            <Card>
                <CardHeader className="flex flex-row items-start justify-between gap-4">
                    <div>
                        <CardTitle className="flex items-center gap-2">
                            <Building2 className="h-5 w-5" />
                            Branches
                        </CardTitle>
                        <CardDescription>
                            Manage multiple offices/branches. Configure branch-wise Office WiFi/IP rules for attendance punching.
                        </CardDescription>
                    </div>

                    <Dialog open={open} onOpenChange={setOpen}>
                        <DialogTrigger asChild>
                            <Button onClick={startCreate} className="gap-2">
                                <Plus className="h-4 w-4" />
                                Add Branch
                            </Button>
                        </DialogTrigger>

                        <DialogContent className="max-w-2xl p-0 overflow-hidden">
                            <form
                                id="branch-form"
                                onSubmit={handleSubmit(onSubmit)}
                                className="flex max-h-[80vh] flex-col"
                            >
                                {/* Sticky Header */}
                                <DialogHeader className="shrink-0 sticky top-0 z-10 bg-background border-b px-6 py-4">
                                    <DialogTitle>{dialogTitle}</DialogTitle>
                                    <DialogDescription>
                                        Add branch details and allowed office network IPs/CIDRs for WiFi punch-in.
                                    </DialogDescription>
                                </DialogHeader>

                                {/* Scrollable Body */}
                                <div className="flex-1 overflow-y-auto px-6 py-4">
                                    <div className="space-y-5">
                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                            <div className="space-y-2 md:col-span-2">
                                                <Label>Branch Name *</Label>
                                                <Input placeholder="Andheri Office" {...register("branch_name")} />
                                                {errors.branch_name?.message ? (
                                                    <p className="text-sm text-destructive">{errors.branch_name.message}</p>
                                                ) : null}
                                            </div>

                                            <div className="space-y-2">
                                                <Label>Branch Code</Label>
                                                <Input placeholder="BRC-001" {...register("branch_code")} readOnly />
                                                <p className="text-xs text-muted-foreground">
                                                    Auto-generated in format <span className="font-mono">BRC-001</span>
                                                </p>
                                                {errors.branch_code?.message ? (
                                                    <p className="text-sm text-destructive">{errors.branch_code.message}</p>
                                                ) : null}
                                            </div>

                                            <div className="space-y-2">
                                                <Label>Branch State</Label>
                                                <Select
                                                    value={branchState || ""}
                                                    onValueChange={(v) =>
                                                        setValue("branch_state", v, { shouldValidate: true })
                                                    }
                                                >
                                                    <SelectTrigger>
                                                        <SelectValue placeholder="Select state" />
                                                    </SelectTrigger>
                                                    <SelectContent className="max-h-60 overflow-auto">
                                                        {INDIAN_STATES.map((state) => (
                                                            <SelectItem key={state} value={state}>
                                                                {state}
                                                            </SelectItem>
                                                        ))}
                                                    </SelectContent>
                                                </Select>
                                                {errors.branch_state?.message ? (
                                                    <p className="text-sm text-destructive">{errors.branch_state.message}</p>
                                                ) : null}
                                            </div>

                                            <div className="space-y-2 md:col-span-2">
                                                <Label>Branch Address</Label>
                                                <Input placeholder="Office address" {...register("branch_address")} />
                                                {errors.branch_address?.message ? (
                                                    <p className="text-sm text-destructive">{errors.branch_address.message}</p>
                                                ) : null}
                                            </div>

                                            <div className="space-y-2">
                                                <Label>Branch City</Label>
                                                <Input placeholder="Mumbai" {...register("branch_city")} />
                                                {errors.branch_city?.message ? (
                                                    <p className="text-sm text-destructive">{errors.branch_city.message}</p>
                                                ) : null}
                                            </div>

                                            <div className="space-y-2 flex items-center justify-between rounded-md border px-3 py-2 md:col-span-1">
                                                <div>
                                                    <p className="text-sm font-medium">Active</p>
                                                    <p className="text-xs text-muted-foreground">
                                                        Disable to stop using this branch (history stays).
                                                    </p>
                                                </div>
                                                <Switch
                                                    checked={!!isActive}
                                                    onCheckedChange={(v) => setValue("is_active", v)}
                                                />
                                            </div>
                                        </div>

                                        <Separator />

                                        <div className="space-y-3">
                                            <div className="flex items-center gap-2">
                                                <Wifi className="h-4 w-4" />
                                                <h3 className="font-medium">Office WiFi / IP Rules</h3>
                                                <Badge variant="secondary">Attendance</Badge>
                                            </div>

                                            <p className="text-sm text-muted-foreground">
                                                Add allowed IPs or CIDRs for this branch office network. One per line or comma-separated.
                                            </p>

                                            <div className="space-y-2">
                                                <Label>Allowed IPs / CIDRs</Label>
                                                <textarea
                                                    value={ipText}
                                                    onChange={(e) => setIpText(e.target.value)}
                                                    className="min-h-[120px] w-full rounded-md border bg-background px-3 py-2 text-sm outline-none focus-visible:ring-2 focus-visible:ring-ring"
                                                    placeholder={`Examples:\n203.0.113.25\n10.10.0.0/16\n192.168.1.0/24`}
                                                />
                                                <p className="text-xs text-muted-foreground">
                                                    Saved into <span className="font-mono">branches.branch_ip_cidrs</span> (jsonb[]).
                                                </p>
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                {/* Sticky Footer */}
                                <div className="shrink-0 sticky bottom-0 z-10 bg-background border-t px-6 py-4">
                                    <div className="flex justify-end gap-2">
                                        <Button type="submit" disabled={saving} className="gap-2">
                                            <Save className="h-4 w-4" />
                                            {saving ? "Saving..." : "Save"}
                                        </Button>
                                    </div>
                                </div>
                            </form>
                        </DialogContent>
                    </Dialog>
                </CardHeader>

                <CardContent>
                    {loading ? (
                        <p className="text-sm text-muted-foreground">Loading branches...</p>
                    ) : branches.length === 0 ? (
                        <p className="text-sm text-muted-foreground">
                            No branches found. Click <span className="font-medium">Add Branch</span>.
                        </p>
                    ) : (
                        <div className="space-y-3">
                            {branches.map((b) => {
                                return (
                                    <div
                                        key={b.id}
                                        className="flex flex-col md:flex-row md:items-center justify-between gap-3 rounded-lg border p-4"
                                    >
                                        <div className="space-y-1">
                                            <div className="flex flex-wrap items-center gap-2">
                                                <p className="font-medium">{b.branch_name}</p>
                                                {b.branch_code ? <Badge variant="outline">{b.branch_code}</Badge> : null}
                                                <span
                                                    className={`rounded-full px-3 py-1 text-xs font-semibold ${b.is_active ? "bg-green-100 text-green-700" : "bg-red-100 text-red-600"
                                                        }`}
                                                >
                                                    {b.is_active ? "Active" : "Inactive"}
                                                </span>
                                            </div>

                                            <p className="text-sm text-muted-foreground">
                                                {b.branch_address ? b.branch_address : "—"}
                                                {b.branch_city ? ` • ${b.branch_city}` : ""}
                                                {b.branch_state ? ` • ${b.branch_state}` : ""}
                                            </p>
                                        </div>

                                        <div className="flex flex-wrap gap-2">
                                            <Button variant="default" onClick={() => startEdit(b)}>
                                                <Edit className="h-4 w-4" />
                                            </Button>

                                            <Button
                                                variant="destructive"
                                                onClick={() => deleteBranch(b)}
                                                disabled={deletingId === b.id}
                                                className="gap-2"
                                            >
                                                <Trash2 className="h-4 w-4" />
                                            </Button>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    )}
                </CardContent>
            </Card>
        </div>
    );
}
