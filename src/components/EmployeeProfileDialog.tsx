import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";

type EmployeeProfile = {
  id?: string;
  name?: string | null;
  email?: string | null;
  phone?: string | null;
  department?: string | null;
  designation?: string | null;
  branches?: {
    branch_name?: string | null
  } | null;
  status?: string | null;
  joining_date?: string | null;
  employee_code?: string | null;
  roles?: {
    name?: string | null;
  } | null;
};

type Props = {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  employee: EmployeeProfile | null;
};

export const EmployeeProfileDialog = ({ open, onOpenChange, employee }: Props) => {
  if (!open) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[700px]">
        <DialogHeader>
          <DialogTitle>Employee Profile</DialogTitle>
          <DialogDescription className="text-sm text-muted-foreground">
            Review your profile details and employment information.
          </DialogDescription>
        </DialogHeader>
        {!employee ? (
          <div className="py-10 text-center">Loading profile...</div>
        ) : (

          <div className="space-y-6">
            <div className="rounded-3xl border border-border bg-muted p-5">
              <div className="flex flex-col gap-4 rounded-3xl bg-background p-5 shadow-sm sm:flex-row sm:items-center sm:justify-between">
                <div className="flex items-center gap-4">
                  <div className="flex h-16 w-16 items-center justify-center rounded-full bg-primary text-xl font-semibold text-primary-foreground">
                    {employee?.name?.charAt(0) || "?"}
                  </div>
                  <div>
                    <p className="text-lg font-semibold text-foreground">{employee?.name || "Unknown"}</p>
                    <p className="text-sm text-muted-foreground">{employee?.designation || "No designation"}</p>
                  </div>
                </div>

                <div className="grid gap-1 text-right sm:text-left">
                  <span className="text-sm font-medium text-foreground">{employee.employee_code || "—"}</span>
                  <span className="text-xs uppercase tracking-[0.24em] text-muted-foreground">Employee Code</span>
                </div>
              </div>

              <div className="mt-4 grid gap-3 sm:grid-cols-2">
                <div className="rounded-2xl border border-border bg-background p-4">
                  <p className="text-xs uppercase tracking-[0.22em] text-muted-foreground">Contact</p>
                  <div className="mt-3 space-y-3 text-sm text-foreground">
                    <div>
                      <p className="text-muted-foreground">Email</p>
                      <p>{employee?.email || "—"}</p>
                    </div>
                    <div>
                      <p className="text-muted-foreground">Phone</p>
                      <p>{employee?.phone || "—"}</p>
                    </div>
                  </div>
                </div>

                <div className="rounded-2xl border border-border bg-background p-4">
                  <p className="text-xs uppercase tracking-[0.22em] text-muted-foreground">Employment</p>
                  <div className="mt-3 space-y-3 text-sm text-foreground">
                    <div>
                      <p className="text-muted-foreground">Department</p>
                      <p>{employee?.department || "—"}</p>
                    </div>
                    <div>
                      <p className="text-muted-foreground">Role</p>
                      <p>
                        {employee?.roles?.name
                          ? employee.roles.name.replace(/\b\w/g, (c) => c.toUpperCase())
                          : "—"}
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              <div className="mt-4 grid gap-3 sm:grid-cols-3">
                <div className="rounded-2xl border border-border bg-background p-4">
                  <p className="text-muted-foreground">Branch</p>
                  <p className="text-sm text-foreground">{employee?.branches?.branch_name || "—"}</p>
                </div>

                <div className="rounded-2xl border border-border bg-background p-4">
                  <p className="text-muted-foreground">Joining Date</p>
                  <p className="text-sm text-foreground">{employee?.joining_date || "—"}</p>
                </div>

                <div className="rounded-2xl border border-border bg-background p-4">
                  <p className="text-muted-foreground">Status</p>
                  <div className="mt-2">
                    <Badge className="rounded-full px-3 py-1 text-xs font-semibold">
                      {employee?.status ? employee.status.charAt(0).toUpperCase() + employee.status.slice(1) : "Unknown"}
                    </Badge>
                  </div>
                </div>
              </div>
            </div>

            <DialogFooter>
              <Button variant="secondary" onClick={() => onOpenChange(false)}>
                Close
              </Button>
            </DialogFooter>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
};