import { useEffect, useState } from "react";
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

/* ================= TYPES ================= */

interface Props {
    open: boolean;
    onClose: () => void;
    roleId: string;
    roleName: string;
}

export interface Permission {
    id: string;
    key: string;
    module_id: string;
    module_name: string;
};


/* ================= COMPONENT ================= */

export default function PermissionModuleDialog({
    open,
    onClose,
    roleId,
    roleName,
}: Props) {
    const [permissions, setPermissions] = useState<Permission[]>([]);
    const [selected, setSelected] = useState<string[]>([]);
    const [loading, setLoading] = useState(false);

    /* ================= FETCH DATA ================= */

    useEffect(() => {
        if (!open || !roleId) return;

        const fetchData = async () => {
            try {
                setLoading(true);

                const { data: roleModules, error: rmError } = await supabase
                    .from("role_modules")
                    .select("module_id")
                    .eq("role_id", roleId);

                if (rmError) throw rmError;

                const moduleIds = roleModules?.map((m) => m.module_id) || [];

                if (moduleIds.length === 0) {
                    setPermissions([]);
                    setSelected([]);
                    setLoading(false);
                    return;
                }

                const { data: perms, error: permError } = await supabase
                    .from("permissions")
                    .select(`id, key, module_id, modules:module_id ( name )`)
                    .in("module_id", moduleIds);

                if (permError) throw permError;

                const { data: assigned } = await supabase
                    .from("role_permissions")
                    .select("permission_id")
                    .eq("role_id", roleId);

                setPermissions(
                    (perms || []).map((p: any) => ({
                        id: p.id,
                        key: p.key,
                        module_id: p.module_id,
                        module_name: p.modules?.name || "Other",
                    }))
                );

                setSelected((assigned || []).map((a) => a.permission_id));
            } catch (err) {
                console.error(err);
                toast.error("Failed to load permissions");
            } finally {
                setLoading(false);
            }
        };

        fetchData();
    }, [open, roleId]);

    /* ================= HANDLERS ================= */

    const togglePermission = (id: string) => {
        setSelected((prev) =>
            prev.includes(id)
                ? prev.filter((p) => p !== id)
                : [...prev, id]
        );
    };

    const savePermissions = async () => {
        try {
            setLoading(true);

            await supabase
                .from("role_permissions")
                .delete()
                .eq("role_id", roleId);

            if (selected.length > 0) {
                await supabase.from("role_permissions").insert(
                    selected.map((pid) => ({
                        role_id: roleId,
                        permission_id: pid,
                    })) as any
                );
            }

            toast.success("Permissions updated");
            onClose();
        } catch (err) {
            console.error(err);
            toast.error("Failed to save permissions");
        } finally {
            setLoading(false);
        }
    };

    /* ================= GROUP BY MODULE ================= */

    const groupedPermissions = permissions.reduce<
        Record<string, Permission[]>
    >((acc, p) => {
        acc[p.module_name] = acc[p.module_name] || [];
        acc[p.module_name].push(p);
        return acc;
    }, {});

    /* ================= UI ================= */

    return (
        <Dialog open={open} onOpenChange={onClose}>
            <DialogContent className="max-w-lg">
                <DialogHeader>
                    <DialogTitle>
                        Assign Permissions – <span className="font-bold">{roleName}</span>
                    </DialogTitle>
                </DialogHeader>

                {loading ? (
                    <p className="text-sm text-center py-6">Loading...</p>
                ) : permissions.length === 0 ? (
                    <p className="text-sm text-center py-6 text-gray-500">
                        No permissions available for assigned modules
                    </p>
                ) : (
                    <div className="max-h-[350px] overflow-y-auto space-y-4">
                        {Object.entries(groupedPermissions).map(
                            ([module, perms]) => (
                                <div key={module}>
                                    <p className="font-semibold mb-2">{module}</p>

                                    {perms.map((p) => (
                                        <label
                                            key={p.id}
                                            className="flex items-center gap-2 text-sm mb-1"
                                        >
                                            <input
                                                type="checkbox"
                                                checked={selected.includes(p.id)}
                                                onChange={() => togglePermission(p.id)}
                                            />
                                            {p.key}
                                        </label>
                                    ))}
                                </div>
                            )
                        )}
                    </div>
                )}

                <DialogFooter>
                    <Button variant="outline" onClick={onClose}>
                        Cancel
                    </Button>
                    <Button onClick={savePermissions} disabled={loading}>
                        {loading ? "Saving..." : "Save"}
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}
