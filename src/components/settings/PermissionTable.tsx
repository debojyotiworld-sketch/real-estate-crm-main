import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Card, CardContent, CardHeader, CardTitle } from "../ui/card";
import { Edit, Trash2 } from "lucide-react";

/* ================= TYPES ================= */

interface Permission {
  id: string;
  key: string;
  description: string;
  module_id: string;
}

/* ================= COMPONENT ================= */

export function PermissionsTable() {
  const [permissions, setPermissions] = useState<Permission[]>([]);
  const [loading, setLoading] = useState(true);
  const [isAddOpen, setIsAddOpen] = useState(false);
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [editingPermission, setEditingPermission] = useState<Permission | null>(null);
  const [permKey, setPermKey] = useState("");
  const [permDesc, setPermDesc] = useState("");
  const [saving, setSaving] = useState(false);
  const [modules, setModules] = useState<any[]>([]);
  const [moduleId, setModuleId] = useState("");

  useEffect(() => {
    if (!open) return;

    supabase
      .from("modules")
      .select("id, name")
      .then(({ data }) => setModules(data || []));
  }, [open]);


  const fetchPermissions = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from("permissions")
      .select("*")
      .order("key");

    if (error) {
      toast.error(error.message);
      setPermissions([]);
    } else {
      setPermissions(data ?? []);
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchPermissions();
  }, []);

  const handleAddPermission = async () => {
    if (!permKey.trim()) {
      toast.error("Permission name is required");
      return;
    }

    if (!moduleId) {
      toast.error("Please select a module");
      return;
    }

    setSaving(true);

    const { error } = await supabase.from("permissions").insert({
      key: permKey.trim(),
      description: permDesc.trim(),
      module_id: moduleId,
    } as any);

    if (error) {
      toast.error(error.message || "Permission create failed");
    } else {
      toast.success("Permission added");

    
      fetchPermissions();        // refresh table
      setIsAddOpen(false);       // close dialog
      setPermKey("");
      setPermDesc("");
      setModuleId("");
    }

    setSaving(false);
  };

  const handleUpdatePermission = async () => {
    if (!editingPermission) return;

    if (!permKey.trim()) {
      toast.error("Permission name is required");
      return;
    }

    setSaving(true);

    const { error } = await supabase
      .from("permissions")
      .update({
        key: permKey.trim(),
        description: permDesc.trim(),
        module_id: moduleId ?? editingPermission.module_id, 
      })
      .eq("id", editingPermission.id);

    if (error) {
      toast.error("Already exists, Permission update failed");
    } else {
      toast.success("Permission updated");

      fetchPermissions();      
      setIsEditOpen(false);
      setEditingPermission(null);
      setPermKey("");
      setPermDesc("");
      setModuleId("");
    }

    setSaving(false);
  };

  const handleDeletePermission = async (permission: Permission) => {
    const confirmed = confirm(
      `Are you sure you want to delete "${permission.key}"?`
    );
    if (!confirmed) return;

    const { error } = await supabase
      .from("permissions")
      .delete()
      .eq("id", permission.id);

    if (error) {
      toast.error(error.message);
    } else {
      toast.success("Permission deleted");
      setPermissions((prev) =>
        prev.filter((p) => p.id !== permission.id)
      );
    }
  };

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between space-y-0">
        <CardTitle>Permissions</CardTitle>
        <Button
          onClick={() => {
            setIsAddOpen(true);
            setPermKey("");
            setPermDesc("");
          }}
        >
          + Add Permission
        </Button>
      </CardHeader>

      <CardContent className="p-0">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Sr. No</TableHead>
              <TableHead>Module</TableHead>
              <TableHead>Name</TableHead>
              <TableHead>Description</TableHead>
              <TableHead>Actions</TableHead>
            </TableRow>
          </TableHeader>

          <TableBody>
            {loading && (
              <TableRow>
                <TableCell colSpan={4} className="text-center">
                  Loading...
                </TableCell>
              </TableRow>
            )}

            {!loading &&
              permissions.map((permission, i) => (
                <TableRow key={permission.id}>
                  <TableCell>{i + 1}</TableCell>
                  <TableCell>
                    {
                      modules.find((m) => m.id === permission.module_id)
                        ?.name || "N/A"
                    }
                  </TableCell>
                  <TableCell>{permission.key}</TableCell>
                  <TableCell>{permission.description}</TableCell>
                  <TableCell className="flex items-center gap-2">
                    <Button
                      title="Edit Permission"
                      size="sm"
                      onClick={() => {
                        setEditingPermission(permission);
                        setPermKey(permission.key);
                        setPermDesc(permission.description);
                        setIsEditOpen(true);
                      }}
                    >
                      <Edit className="h-4 w-4" />
                    </Button>
                    <Button
                      title="Delete Permission"
                      size="sm"
                      variant="destructive"
                      onClick={() =>
                        handleDeletePermission(permission)
                      }
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
          </TableBody>
        </Table>
      </CardContent>

      {/* ADD DIALOG */}
      <Dialog open={isAddOpen} onOpenChange={setIsAddOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Add Permission</DialogTitle>
          </DialogHeader>
          <select
            value={moduleId}
            onChange={(e) => setModuleId(e.target.value)}
            className="border rounded px-3 py-2 w-full"
          >
            <option value="">Select Module</option>
            {modules.map((m) => (
              <option key={m.id} value={m.id}>
                {m.name}
              </option>
            ))}
          </select>

          <input
            value={permKey}
            onChange={(e) => setPermKey(e.target.value)}
            className="w-full border rounded px-3 py-2 mb-2"
            placeholder="Permission name"
          />

          <input
            value={permDesc}
            onChange={(e) => setPermDesc(e.target.value)}
            className="w-full border rounded px-3 py-2"
            placeholder="Description"
          />

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setIsAddOpen(false)}
            >
              Cancel
            </Button>
            <Button onClick={handleAddPermission} disabled={saving}>
              {saving ? "Saving..." : "Save"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* EDIT DIALOG */}
      <Dialog
        open={isEditOpen}
        onOpenChange={(open) => {
          setIsEditOpen(open);
          if (!open) setEditingPermission(null);
        }}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit Permission</DialogTitle>
          </DialogHeader>

          <input
            value={permKey}
            onChange={(e) => setPermKey(e.target.value)}
            className="w-full border rounded px-3 py-2 mb-2"
            placeholder="Permission name"
          />

          <input
            value={permDesc}
            onChange={(e) => setPermDesc(e.target.value)}
            className="w-full border rounded px-3 py-2"
            placeholder="Description"
          />

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setIsEditOpen(false);
                setEditingPermission(null);
              }}
            >
              Cancel
            </Button>
            <Button
              onClick={handleUpdatePermission}
              disabled={saving}
            >
              {saving ? "Updating..." : "Update"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </Card>
  );
}
