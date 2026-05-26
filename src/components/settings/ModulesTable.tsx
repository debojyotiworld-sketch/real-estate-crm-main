import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import type { Database } from "@/integrations/supabase/types";
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
import { CardHeader, CardTitle, CardContent } from "@/components/ui/card";
/* ================= TYPES ================= */

export interface Module {
  id?: string;
  name?: string;
  icon?: string;
  route?: string;
  order_no?: number;
  status?: "Active" | "Inactive";
}

type ModulesRow = Database["public"]["Tables"]["modules"]["Row"];
type ModulesInsert = Database["public"]["Tables"]["modules"]["Insert"];
type ModulesUpdate = Database["public"]["Tables"]["modules"]["Update"];

// UI-only: resolve lucide icon name from DB, fallback safe
import type { LucideIcon } from "lucide-react";
import * as LucideIcons from "lucide-react";

function resolveIcon(iconName?: string): LucideIcon {
  if (!iconName) return LucideIcons.LayoutDashboard;
  const icons = LucideIcons as unknown as Record<string, LucideIcon>;
  return icons[iconName] ?? LucideIcons.LayoutDashboard;
}
/* ================= COMPONENT ================= */

export function ModulesTable() {
  const [modules, setModules] = useState<Module[]>([]);
  const [loading, setLoading] = useState(true);

  const [isAddOpen, setIsAddOpen] = useState(false);
  const [isEditOpen, setIsEditOpen] = useState(false);

  const [editingModule, setEditingModule] = useState<Module | null>(null);

  const [moduleName, setModuleName] = useState("");
  const [moduleIcon, setModuleIcon] = useState("");
  const [moduleRoute, setModuleRoute] = useState("");
  const [moduleOrderNo, setModuleOrderNo] = useState<number | undefined>();
  const [storing, setStoring] = useState(false);

  /* ================= FETCH MODULES ================= */

  const fetchModules = async () => {
    setLoading(true);

    const { data, error } = await supabase
      .from("modules")
      .select("id, name, icon, route, order_no, status")
      .order("order_no");

    if (error) {
      toast.error(error.message);
      setModules([]);
    } else {
      setModules((data as ModulesRow[]) as Module[]);
    }

    setLoading(false);
  };

  useEffect(() => {
    fetchModules();
  }, []);

  /* ================= ADD MODULE ================= */

  const handleAddModule = async () => {
    if (
      !moduleName ||
      !moduleIcon ||
      !moduleRoute ||
      moduleOrderNo === undefined
    ) {
      toast.error("All fields are required");
      return;
    }

    const finalRoute =
      moduleRoute.trim() ||
      `/modules/${moduleName.trim().toLowerCase().replace(/\s+/g, "-")}`;

    const duplicate = modules.find(
      (m) =>
        (m.name ?? "").toLowerCase() === moduleName.trim().toLowerCase() ||
        (m.route ?? "").toLowerCase() === finalRoute.toLowerCase() ||
        m.order_no === moduleOrderNo ||
        m.icon === moduleIcon
    );

    if (duplicate) {
      toast.error(
        "Duplicate found: name / route / order no / icon already exists"
      );
      return;
    }

    setStoring(true);

    const newModule: ModulesInsert = {
      name: moduleName.trim(),
      icon: moduleIcon,
      route: finalRoute,
      order_no: moduleOrderNo,
      status: "Active",
    };

    const { data, error } = await supabase
      .from("modules")
      .insert([newModule] as any)
      .select("id, name, icon, route, order_no, status");

    if (error) {
      toast.error(error.message);
    } else {
      toast.success("Module added successfully");
      setModules((prev) => [...prev, ...((data as Module[]) || [])]);
      setIsAddOpen(false);
      setModuleName("");
      setModuleIcon("");
      setModuleRoute("");
      setModuleOrderNo(undefined);
    }

    setStoring(false);
  };

  /* ================= UPDATE MODULE ================= */

  const handleUpdateModule = async () => {
    if (!editingModule?.id) return;

    // basic validation
    if (
      !editingModule.name?.trim() ||
      !editingModule.icon ||
      !editingModule.route ||
      editingModule.order_no === undefined
    ) {
      toast.error("All fields are required");
      return;
    }

    /* CHECK DUPLICATE (exclude current id) */
    const { data: duplicate, error: checkError } = await supabase
      .from("modules")
      .select("id")
      .neq("id", editingModule.id)
      .or(
        `name.eq.${editingModule.name},route.eq.${editingModule.route},icon.eq.${editingModule.icon},order_no.eq.${editingModule.order_no}`
      )
      .maybeSingle();

    if (checkError) {
      toast.error("Something went wrong while checking duplicates");
      return;
    }

    if (duplicate) {
      toast.error("Data already exists");
      return;
    }

    const updates: ModulesUpdate = {
      name: editingModule.name.trim(),
      icon: editingModule.icon,
      route: editingModule.route,
      order_no: editingModule.order_no,
      status: editingModule.status ?? "Active",
    };

    const { error } = await supabase
      .from("modules")
      .update(updates)
      .eq("id", editingModule.id);

    if (error) {
      toast.error(error.message);
      return;
    }

    toast.success("Module updated successfully");

    // safest: reload from DB (so refresh-like state becomes consistent)
    await fetchModules();

    setIsEditOpen(false);
    setEditingModule(null);
  };

  /* ================= DELETE MODULE ================= */

  const handleDeleteModule = async (module: Module) => {
    const confirmed = confirm(
      `Are you sure you want to delete "${module.name}"?`
    );
    if (!confirmed) return;

    const { error } = await supabase.from("modules").delete().eq("id", module.id);

    if (error) {
      toast.error(error.message);
    } else {
      toast.success("Module deleted");
      setModules((prev) => prev.filter((m) => m.id !== module.id));
    }
  };

  /* ================= UI ================= */

  return (
    <div className="rounded-xl border bg-card">
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle>Modules</CardTitle>
        <Button onClick={() => setIsAddOpen(true)}>+ Add Module</Button>
      </CardHeader>

      <CardContent className="p-0">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>#</TableHead>
              <TableHead>Name</TableHead>
              <TableHead>Icon</TableHead>
              <TableHead>Route</TableHead>
              <TableHead>Order</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Actions</TableHead>
            </TableRow>
          </TableHeader>

          <TableBody>
            {loading && (
              <TableRow>
                <TableCell colSpan={7} className="text-center py-6">
                  Loading...
                </TableCell>
              </TableRow>
            )}

            {!loading && modules.length === 0 && (
              <TableRow>
                <TableCell
                  colSpan={7}
                  className="text-center py-6 text-muted-foreground"
                >
                  No modules found
                </TableCell>
              </TableRow>
            )}

            {!loading &&
              modules.map((module, index) => {
                const Icon = resolveIcon(module.icon);

                return (
                  <TableRow key={module.id}>
                    <TableCell>{index + 1}</TableCell>
                    <TableCell className="font-medium">{module.name}</TableCell>

                    <TableCell>
                      <Icon className="h-4 w-4" />
                    </TableCell>

                    <TableCell>{module.route}</TableCell>
                    <TableCell>{module.order_no}</TableCell>

                    <TableCell>
                      <span
                        className={`rounded-full px-3 py-1 text-xs font-semibold ${module.status === "Active"
                            ? "bg-green-100 text-green-700"
                            : "bg-red-100 text-red-600"
                          }`}
                      >
                        {module.status ?? "Inactive"}
                      </span>
                    </TableCell>

                    <TableCell className="flex gap-2">
                      <Button
                        size="sm"
                        onClick={() => {
                          setEditingModule(module);
                          setIsEditOpen(true);
                        }}
                      >
                        <LucideIcons.Edit className="h-4 w-4" />
                      </Button>

                      <Button
                        size="sm"
                        variant="destructive"
                        onClick={() => handleDeleteModule(module)}
                      >
                        <LucideIcons.Trash2 className="h-4 w-4" />
                      </Button>
                    </TableCell>
                  </TableRow>
                );
              })}
          </TableBody>
        </Table>
      </CardContent>

      {/* ================= ADD MODULE DIALOG ================= */}

      <Dialog open={isAddOpen} onOpenChange={setIsAddOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Add Module</DialogTitle>
          </DialogHeader>

          <div className="space-y-3">
            <input
              value={moduleName}
              onChange={(e) => setModuleName(e.target.value)}
              className="w-full rounded border px-3 py-2"
              placeholder="Module name"
            />

            <input
              value={moduleIcon}
              onChange={(e) => setModuleIcon(e.target.value)}
              className="w-full rounded border px-3 py-2"
              placeholder="Icon"
            />

            <input
              value={moduleRoute}
              onChange={(e) => setModuleRoute(e.target.value)}
              className="w-full rounded border px-3 py-2"
              placeholder="Route"
            />

            <input
              type="number"
              value={moduleOrderNo ?? ""}
              onChange={(e) =>
                setModuleOrderNo(
                  e.target.value === "" ? undefined : Number(e.target.value)
                )
              }
              className="w-full rounded border px-3 py-2"
              placeholder="Order No"
            />
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setIsAddOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleAddModule} disabled={storing}>
              {storing ? "Saving..." : "Save"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ================= EDIT MODULE DIALOG ================= */}

      <Dialog open={isEditOpen} onOpenChange={setIsEditOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit Module</DialogTitle>
          </DialogHeader>

          {editingModule && (
            <div className="space-y-5">
              {/* Name */}
              <div className="space-y-2">
                <label className="text-sm font-medium text-foreground">Module name</label>
                <input
                  value={editingModule.name ?? ""}
                  onChange={(e) =>
                    setEditingModule({
                      ...editingModule,
                      name: e.target.value,
                    })
                  }
                  className="w-full rounded-lg border bg-background px-3 py-2 text-sm outline-none transition focus:ring-2 focus:ring-ring focus:border-ring"
                  placeholder="e.g. Leads"
                />
              </div>

              {/* Icon */}
              <div className="space-y-2">
                <label className="text-sm font-medium text-foreground">Icon</label>
                <input
                  value={editingModule.icon ?? ""}
                  onChange={(e) =>
                    setEditingModule({
                      ...editingModule,
                      icon: e.target.value,
                    })
                  }
                  className="w-full rounded-lg border bg-background px-3 py-2 text-sm outline-none transition focus:ring-2 focus:ring-ring focus:border-ring"
                  placeholder="e.g. home, users, settings"
                />
                <p className="text-xs text-muted-foreground">
                  Use an icon key/name your sidebar understands.
                </p>
              </div>

              {/* Route */}
              <div className="space-y-2">
                <label className="text-sm font-medium text-foreground">Route</label>
                <input
                  value={editingModule.route ?? ""}
                  onChange={(e) =>
                    setEditingModule({
                      ...editingModule,
                      route: e.target.value,
                    })
                  }
                  className="w-full rounded-lg border bg-background px-3 py-2 text-sm outline-none transition focus:ring-2 focus:ring-ring focus:border-ring"
                  placeholder="/modules/leads"
                />
              </div>

              {/* Order + Status (2 columns) */}
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <div className="space-y-2">
                  <label className="text-sm font-medium text-foreground">Order</label>
                  <input
                    type="number"
                    value={editingModule.order_no ?? ""}
                    onChange={(e) =>
                      setEditingModule({
                        ...editingModule,
                        order_no: e.target.value === "" ? undefined : Number(e.target.value),
                      })
                    }
                    className="w-full rounded-lg border bg-background px-3 py-2 text-sm outline-none transition focus:ring-2 focus:ring-ring focus:border-ring"
                    placeholder="1"
                  />
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-medium text-foreground">Status</label>
                  <select
                    value={editingModule.status ?? ""}
                    onChange={(e) =>
                      setEditingModule({
                        ...editingModule,
                        status: e.target.value as "Active" | "Inactive",
                      })
                    }
                    className="w-full rounded-lg border bg-background px-3 py-2 text-sm outline-none transition focus:ring-2 focus:ring-ring focus:border-ring"
                  >
                    <option value="" disabled>
                      Select status
                    </option>
                    <option value="Active">Active</option>
                    <option value="Inactive">Inactive</option>
                  </select>
                  <p className="text-xs text-muted-foreground">
                    Inactive modules can be hidden from navigation.
                  </p>
                </div>
              </div>
            </div>
          )}

          <DialogFooter>
            <Button variant="outline" onClick={() => setIsEditOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleUpdateModule}>Update</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
