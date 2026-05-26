import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { Edit, Settings, ShieldCheck, Trash2 } from "lucide-react";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

import { RoleModuleDialog } from "./RoleModuleDialog";
import PermissionModuleDialog from "./PermissionModuleDialog";

interface Role {
  id: string;
  name: string;
  status: "Active" | "Inactive";
}

export default function RolesTable() {
  const [roles, setRoles] = useState<Role[]>([]);
  const [loading, setLoading] = useState(false);

  const [selectedRole, setSelectedRole] = useState<Role | null>(null);
  const [isModuleDialogOpen, setIsModuleDialogOpen] = useState(false);
  const [isPermissionDialogOpen, setIsPermissionDialogOpen] = useState(false);

  const [isEditOpen, setIsEditOpen] = useState(false);
  const [editingRole, setEditingRole] = useState<Role | null>(null);

  const [roleName, setRoleName] = useState("");
  const [roleStatus, setRoleStatus] = useState<"Active" | "Inactive">("Active");

  const [saving, setSaving] = useState(false);

  const fetchRoles = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from("roles")
      .select("*")
      .order("created_at", { ascending: true });

    if (error) {
      toast.error("Failed to load roles");
    } else {
      setRoles((data ?? []) as Role[]);
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchRoles();
  }, []);

  const addRole = async () => {
    if (!roleName.trim()) {
      toast.error("Role name is required");
      return;
    }

    setSaving(true);

    // duplicate check (same logic, safer)
    const { data: existingRole, error: dupErr } = await supabase
      .from("roles")
      .select("id")
      .eq("name", roleName.trim())
      .maybeSingle();

    // ignore "no rows" kind of errors; but if any real error, show it
    if (dupErr) {
      // don't block add unnecessarily, but log it
      console.error("Duplicate check error:", dupErr);
    }

    if (existingRole) {
      toast.error("Role already exists");
      setSaving(false);
      return;
    }

    // Supabase types missing → insert becomes never; keep logic same, unblock TS
    const { error } = await supabase.from("roles").insert(
      {
        name: roleName.trim(),
        status: roleStatus,
      } as any
    );

    if (error) {
      toast.error(error.message || "Failed to add role");
    } else {
      toast.success("Role added successfully");
      await fetchRoles();
      setRoleName("");
      setRoleStatus("Active");
      setIsEditOpen(false);
      setEditingRole(null);
    }

    setSaving(false);
  };

  const openEditRole = (role: Role) => {
    setEditingRole(role);
    setRoleName(role.name);
    setRoleStatus(role.status);
    setIsEditOpen(true);
  };

  const openModuleDialog = (role: Role) => {
    setSelectedRole(role);
    setIsModuleDialogOpen(true);
  };

  const openPermissionDialog = (role: Role) => {
    setSelectedRole(role);
    setIsPermissionDialogOpen(true);
  };

  const deleteRole = async (roleId: string) => {
    if (!confirm("Are you sure you want to delete this role?")) return;

    const { error } = await supabase.from("roles").delete().eq("id", roleId);

    if (error) {
      // if FK conflict, Supabase often returns 409 / 23503
      toast.error(error.message || "Role delete failed");
    } else {
      toast.success("Role deleted");
      fetchRoles();
    }
  };

  const editRole = async () => {
    if (!editingRole) return;

    if (!roleName.trim()) {
      toast.error("Role name is required");
      return;
    }

    setSaving(true);

    const { error } = await supabase
      .from("roles")
      .update(
        {
          name: roleName.trim(),
          status: roleStatus,
        }
      )
      .eq("id", editingRole.id);

    if (error) {
      toast.error(error.message || "Role update failed");
    } else {
      toast.success("Role updated");
      await fetchRoles();
      setIsEditOpen(false);
      setEditingRole(null);
      setRoleName("");
      setRoleStatus("Active");
    }

    setSaving(false);
  };

  return (
    <>
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0">
          <CardTitle>Roles</CardTitle>

          <Button
            onClick={() => {
              setEditingRole(null);
              setRoleName("");
              setRoleStatus("Active");
              setIsEditOpen(true);
            }}
          >
            + Add Role
          </Button>
        </CardHeader>

        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Sr. No</TableHead>
                <TableHead>Name</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Actions</TableHead>
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
                roles.map((role, i) => (
                  <TableRow key={role.id}>
                    <TableCell>{i + 1}</TableCell>

                    <TableCell className="font-medium">{role.name}</TableCell>

                    <TableCell>
                      <span
                        className={`rounded-full px-3 py-1 text-xs font-semibold ${
                          role.status === "Active"
                            ? "bg-green-100 text-green-700"
                            : "bg-red-100 text-red-600"
                        }`}
                      >
                        {role.status}
                      </span>
                    </TableCell>

                    <TableCell className="text-right">
                      <div className="flex justify-end gap-2">
                        <Button title="Edit Role" size="sm" onClick={() => openEditRole(role)}>
                          <Edit className="h-4 w-4" />
                        </Button>

                        <Button
                          title="Manage Modules"
                          size="sm"
                          variant="secondary"
                          onClick={() => openModuleDialog(role)}
                        >
                          <Settings className="h-4 w-4" />
                        </Button>

                        <Button
                          title="Manage Permissions"
                          size="sm"
                          variant="secondary"
                          onClick={() => openPermissionDialog(role)}
                        >
                          <ShieldCheck className="h-4 w-4" />
                        </Button>

                        <Button
                          title="Delete Role"
                          size="sm"
                          variant="destructive"
                          onClick={() => deleteRole(role.id)}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}

              {!loading && roles.length === 0 && (
                <TableRow>
                  <TableCell colSpan={4} className="text-center text-muted-foreground">
                    No roles found
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {selectedRole && (
        <RoleModuleDialog
          open={isModuleDialogOpen}
          onClose={() => {
            setIsModuleDialogOpen(false);
            setSelectedRole(null);
          }}
          roleId={selectedRole.id}
          roleName={selectedRole.name}
        />
      )}

      {selectedRole && (
        <PermissionModuleDialog
          open={isPermissionDialogOpen}
          onClose={() => {
            setIsPermissionDialogOpen(false);
            setSelectedRole(null);
          }}
          roleId={selectedRole.id}
          roleName={selectedRole.name}
        />
      )}

      {isEditOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
          <div className="w-full max-w-md rounded-xl bg-white p-6">
            <h2 className="mb-4 text-lg font-semibold">
              {editingRole ? "Edit Role" : "Add Role"}
            </h2>

            <div className="space-y-4">
              <input
                className="w-full rounded border px-3 py-2"
                placeholder="Role name"
                value={roleName}
                onChange={(e) => setRoleName(e.target.value)}
              />

              <select
                className="w-full rounded border px-3 py-2"
                value={roleStatus}
                onChange={(e) =>
                  setRoleStatus(e.target.value as "Active" | "Inactive")
                }
              >
                <option value="Active">Active</option>
                <option value="Inactive">Inactive</option>
              </select>
            </div>

            <div className="mt-6 flex justify-end gap-2">
              <Button
                variant="outline"
                onClick={() => {
                  setIsEditOpen(false);
                  setEditingRole(null);
                  // keep current logic; optional: clear inputs
                }}
              >
                Cancel
              </Button>

              <Button
                // correct call
                onClick={editingRole ? editRole : addRole}
                disabled={saving}
              >
                {saving ? "Saving..." : "Save"}
              </Button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
