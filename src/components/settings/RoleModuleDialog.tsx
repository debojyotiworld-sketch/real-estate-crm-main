import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { supabase } from "@/integrations/supabase/client";
import { useEffect, useState } from "react";
import { toast } from "sonner";

interface Props {
  open: boolean;
  onClose: () => void;
  roleId: string;
  roleName: string;
}

export function RoleModuleDialog({
  open,
  onClose,
  roleId,
  roleName,
}: Props) {
  const [modules, setModules] = useState<any[]>([]);
  const [selectedModules, setSelectedModules] = useState<string[]>([]);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!open) return;

    const loadData = async () => {
      const { data: allModules } = await supabase
        .from("modules")
        .select("id, name")
        .order("order_no");

      const { data: roleModules } = await supabase
        .from("role_modules")
        .select("module_id")
        .eq("role_id", roleId) as any;

      setModules(allModules || []);
      setSelectedModules(
        roleModules?.map((r: any) => r.module_id) || []
      );
    };

    loadData();
  }, [open, roleId]);

  const toggleModule = (id: string) => {
    setSelectedModules((prev) =>
      prev.includes(id)
        ? prev.filter((m) => m !== id)
        : [...prev, id]
    );
  };

  const handleSave = async () => {
    try {
      setSaving(true);

      // De-dupe just in case UI state accidentally contains duplicates
      const uniqueSelected = Array.from(new Set(selectedModules));

      // 1) Fetch existing modules for this role
      const { data: existing, error: fetchErr } = await supabase
        .from("role_modules")
        .select("module_id")
        .eq("role_id", roleId);

      if (fetchErr) throw fetchErr;

      const existingIds: string[] = (existing || []).map((e: any) => e.module_id);
      const selectedSet = new Set(uniqueSelected);

      // Modules that are being removed (for permission cleanup)
      const removedModuleIds = existingIds.filter((id) => !selectedSet.has(id));

      // 2) Delete ALL existing mappings (Option 2)
      const { error: delErr } = await supabase
        .from("role_modules")
        .delete()
        .eq("role_id", roleId);

      if (delErr) throw delErr;

      // 3) Insert new mappings (exact sync)
      if (uniqueSelected.length > 0) {
        const { error: insErr } = await supabase
          .from("role_modules")
          .insert(
            uniqueSelected.map((module_id) => ({
              role_id: roleId,
              module_id,
            }))
          );

        if (insErr) throw insErr;
      }

      // 4) Cleanup role_permissions for permissions under removed modules
      if (removedModuleIds.length > 0) {
        const { data: perms, error: permErr } = await supabase
          .from("permissions")
          .select("id")
          .in("module_id", removedModuleIds);

        if (permErr) throw permErr;

        const permissionIds = (perms || []).map((p: any) => p.id);

        if (permissionIds.length > 0) {
          const { error: rpErr } = await supabase
            .from("role_permissions")
            .delete()
            .eq("role_id", roleId)
            .in("permission_id", permissionIds);

          if (rpErr) throw rpErr;
        }
      }

      toast.success("Modules updated successfully");
      onClose();
    } catch (err) {
      console.error(err);
      toast.error("Failed to update modules");
    } finally {
      setSaving(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>
            Assign Modules – {roleName}
          </DialogTitle>
          <DialogDescription>
            Select which modules this role can access, then click Save.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-3 max-h-64 overflow-y-auto">
          {modules.map((m) => (
            <div key={m.id} className="flex items-center gap-3">
              <Checkbox
                checked={selectedModules.includes(m.id)}
                onCheckedChange={() => toggleModule(m.id)}
              />
              <span>{m.name}</span>
            </div>
          ))}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={onClose}>
            Cancel
          </Button>
          <Button onClick={handleSave} disabled={saving}>
            {saving ? "Saving..." : "Save"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
