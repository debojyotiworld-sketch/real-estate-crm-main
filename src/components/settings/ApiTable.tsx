import { useEffect, useState, useMemo } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/components/ui/sonner";
import { Button } from "@/components/ui/button";
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogFooter,
} from "@/components/ui/dialog";
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Copy, Eye, EyeOff, Plus, Power, CheckCircle2 } from "lucide-react";

type ApiKey = {
    id: string;
    key: string;
    source: string;
    is_active: boolean;
    created_at: string;
};

// 🔐 Generate key (browser-safe)
function generateKey() {
    const bytes = new Uint8Array(32);
    window.crypto.getRandomValues(bytes);
    return Array.from(bytes)
        .map((b) => b.toString(16).padStart(2, "0"))
        .join("");
}

// Mask key
function maskKey(key: string) {
    return key.slice(0, 6) + "••••••••••••••••••••" + key.slice(-6);
}

// Copy
async function copy(text: string) {
    await navigator.clipboard.writeText(text);
    toast.success("Copied to clipboard");
}

export default function ApiTable() {
    const [apiKeys, setApiKeys] = useState<ApiKey[]>([]);
    const [loading, setLoading] = useState(false);
    const [visibleKeys, setVisibleKeys] = useState<Record<string, boolean>>({});

    const [open, setOpen] = useState(false);
    const [creating, setCreating] = useState(false);

    const [key, setKey] = useState(generateKey());
    const [source, setSource] = useState("");
    const [search, setSearch] = useState("");

    // Load
    const load = async () => {
        setLoading(true);
        const { data } = await supabase
            .from("api_keys")
            .select("*")
            .order("created_at", { ascending: false });
        setApiKeys((data as ApiKey[]) || []);
        setLoading(false);
    };

    useEffect(() => {
        load();
    }, []);

    // Search filter
    const filtered = useMemo(() => {
        return apiKeys.filter((k) =>
            (k.source || "").toLowerCase().includes(search.toLowerCase())
        );
    }, [apiKeys, search]);

    // Create
    const create = async () => {
        if (!source.trim()) {
            toast.error("Source is required");
            return;
        }
        setCreating(true);
        await supabase.from("api_keys").insert([{ key, source }]);
        toast.success("API Key created");
        setOpen(false);
        setKey(generateKey());
        setSource("");
        setCreating(false);
        load();
    };

    // Toggle status
    const toggleStatus = async (row: ApiKey) => {
        await supabase
            .from("api_keys")
            .update({ is_active: !row.is_active })
            .eq("id", row.id);
        load();
    };

    // Reveal (auto-hide)
    const toggleVisibility = (id: string) => {
        setVisibleKeys((p) => ({ ...p, [id]: true }));
        setTimeout(() => {
            setVisibleKeys((p) => ({ ...p, [id]: false }));
        }, 5000);
    };

    const stats = {
        total: apiKeys.length,
        active: apiKeys.filter((k) => k.is_active).length,
        inactive: apiKeys.filter((k) => !k.is_active).length,
    };

    return (
        <div className="space-y-6">
            {/* HEADER */}
            <div className="flex items-center justify-between">
                <div>
                    <h2 className="text-2xl font-semibold">API Keys</h2>
                    <p className="text-sm text-muted-foreground">
                        Manage secure access to your platform
                    </p>
                </div>

                <Button onClick={() => setOpen(true)} className="rounded-xl">
                    <Plus className="h-4 w-4 mr-2" />
                    Create Key
                </Button>
            </div>

            {/* STATS */}
            <div className="grid grid-cols-3 gap-4">
                <Stat title="Total" value={stats.total} />
                <Stat title="Active" value={stats.active} color="green" />
                <Stat title="Inactive" value={stats.inactive} color="gray" />
            </div>

            {/* SEARCH */}
            <div className="flex items-center justify-between">
                <Input
                    placeholder="Search by source..."
                    className="max-w-sm"
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                />
            </div>

            {/* TABLE */}
            <div className="rounded-2xl border bg-white shadow-sm overflow-hidden">
                <Table>
                    <TableHeader>
                        <TableRow>
                            <TableHead>Key</TableHead>
                            <TableHead>Status</TableHead>
                            <TableHead>Created</TableHead>
                            <TableHead className="text-right" />
                        </TableRow>
                    </TableHeader>

                    <TableBody>
                        {loading && (
                            <TableRow>
                                <TableCell colSpan={4}>Loading...</TableCell>
                            </TableRow>
                        )}

                        {!loading && filtered.length === 0 && (
                            <TableRow>
                                <TableCell colSpan={4} className="text-center py-10">
                                    No API keys found
                                </TableCell>
                            </TableRow>
                        )}

                        {filtered.map((row) => (
                            <TableRow key={row.id}>
                                <TableCell>
                                    <div className="flex justify-between items-center">
                                        <div>
                                            <p className="font-mono text-sm">
                                                {visibleKeys[row.id]
                                                    ? row.key
                                                    : maskKey(row.key)}
                                            </p>
                                            <p className="text-xs text-muted-foreground">
                                                {row.source || "No source"}
                                            </p>
                                        </div>

                                        <div className="flex gap-2">
                                            <button
                                                onClick={() => toggleVisibility(row.id)}
                                                className="p-1.5 hover:bg-gray-100 rounded-md"
                                            >
                                                {visibleKeys[row.id] ? (
                                                    <EyeOff className="h-4 w-4" />
                                                ) : (
                                                    <Eye className="h-4 w-4" />
                                                )}
                                            </button>

                                            <button
                                                onClick={() => copy(row.key)}
                                                className="p-1.5 hover:bg-gray-100 rounded-md"
                                            >
                                                <Copy className="h-4 w-4" />
                                            </button>
                                        </div>
                                    </div>
                                </TableCell>

                                <TableCell>
                                    <Badge
                                        className={
                                            row.is_active
                                                ? "bg-green-100 text-green-700"
                                                : "bg-gray-200 text-gray-600"
                                        }
                                    >
                                        {row.is_active ? "Active" : "Inactive"}
                                    </Badge>
                                </TableCell>

                                <TableCell>
                                    {new Date(row.created_at).toLocaleString("en-IN", {
                                        timeZone: "Asia/Kolkata",
                                        dateStyle: "medium",
                                        timeStyle: "short",
                                    })}
                                </TableCell>

                                <TableCell className="text-right">
                                    <Button
                                        size="sm"
                                        variant="ghost"
                                        className={`rounded-lg px-3 flex items-center gap-2 transition ${row.is_active
                                                ? "text-red-600 hover:bg-red-50"
                                                : "text-green-600 hover:bg-green-50"
                                            }`}
                                        onClick={() => toggleStatus(row)}
                                    >
                                        {row.is_active ? (
                                            <>
                                                <Power className="h-4 w-4" />
                                                Disable
                                            </>
                                        ) : (
                                            <>
                                                <CheckCircle2 className="h-4 w-4" />
                                                Enable
                                            </>
                                        )}
                                    </Button>
                                </TableCell>
                            </TableRow>
                        ))}
                    </TableBody>
                </Table>
            </div>

            {/* MODAL */}
            <Dialog open={open} onOpenChange={setOpen}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Create API Key</DialogTitle>
                    </DialogHeader>

                    <div className="space-y-4">
                        <div>
                            <Label>API Key</Label>
                            <Input value={key} readOnly />
                            <p className="text-xs text-red-500 mt-1">
                                Copy this key now. You won’t see it again.
                            </p>
                        </div>

                        <div>
                            <Label>Source</Label>
                            <Input
                                placeholder="Enter source (e.g. vendor, internal, partner)"
                                value={source}
                                onChange={(e) => setSource(e.target.value)}
                            />
                        </div>
                    </div>

                    <DialogFooter>
                        <Button variant="outline" onClick={() => setOpen(false)}>
                            Cancel
                        </Button>
                        <Button onClick={create} disabled={creating}>
                            {creating ? "Creating..." : "Create"}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    );
}

// Stat Card
function Stat({
    title,
    value,
    color,
}: {
    title: string;
    value: number;
    color?: string;
}) {
    return (
        <div className="p-4 rounded-2xl border bg-white shadow-sm">
            <p className="text-sm text-muted-foreground">{title}</p>
            <p
                className={`text-2xl font-bold ${color === "green"
                    ? "text-green-600"
                    : color === "gray"
                        ? "text-gray-600"
                        : ""
                    }`}
            >
                {value}
            </p>
        </div>
    );
}
