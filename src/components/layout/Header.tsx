import { Bell, LogOut, User, ChevronDown, Menu, Eye, EyeOff, CalendarDays } from "lucide-react";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";
import { EmployeeProfileDialog } from "@/components/EmployeeProfileDialog";

/* ================= TYPES ================= */

interface HeaderProps {
  title: string;
  subtitle?: string;
  isMobile?: boolean;
  onOpenMobileSidebar?: () => void;
}

interface ChangePasswordDialogProps {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  employeeCode: string;
}

type HeaderUser = {
  id: string;
  name?: string | null;
  role?: string | null;
  employee_code?: string | null;
  phone?: string | null;
  email?: string | null;
  department?: string | null;
};

/* ================= CHANGE PASSWORD DIALOG ================= */

export function ChangePasswordDialog({
  open,
  onOpenChange,
  employeeCode,
}: ChangePasswordDialogProps) {
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const handleUpdatePassword = async () => {
    if (!password || !confirmPassword) {
      toast.error("Password required");
      return;
    }

    if (password !== confirmPassword) {
      toast.error("Passwords do not match");
      return;
    }

    if (password.length < 6) {
      toast.error("Password must be at least 6 characters");
      return;
    }

    setLoading(true);

    const { error: authError } = await supabase.auth.updateUser({
      password,
    });

    if (authError) {
      setLoading(false);
      toast.error(authError.message);
      return;
    }

    const { error: profileError } = await supabase
      .from("employees")
      .update({ password: password })
      .eq("employee_code", employeeCode);

    setLoading(false);

    if (profileError) {
      toast.error(profileError.message);
      return;
    }

    toast.success("Password updated successfully");
    setPassword("");
    setConfirmPassword("");
    onOpenChange(false);

  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Change Password</DialogTitle>
        </DialogHeader>

        <div className="space-y-3 py-2">
          {/* New password */}
          <div className="relative">
            <Input
              type={showPassword ? "text" : "password"}
              placeholder="New password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="pr-10"
            />
            <button
              type="button"
              onClick={() => setShowPassword((v) => !v)}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
            >
              {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
            </button>
          </div>

          {/* Confirm password */}
          <div className="relative">
            <Input
              type={showConfirmPassword ? "text" : "password"}
              placeholder="Confirm password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              className="pr-10"
            />
            <button
              type="button"
              onClick={() => setShowConfirmPassword((v) => !v)}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
            >
              {showConfirmPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
            </button>
          </div>
        </div>

        <DialogFooter>
          <Button variant="secondary" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>

          <Button onClick={handleUpdatePassword} disabled={loading}>
            {loading ? "Updating..." : "Update Password"}
          </Button>
        </DialogFooter>
      </DialogContent>

    </Dialog>
  );
}

export function Header({
  title,
  subtitle,
  isMobile,
  onOpenMobileSidebar,
}: HeaderProps) {
  const { user, logout } = useAuth();
  const [passwordOpen, setPasswordOpen] = useState(false);
  const [profileOpen, setProfileOpen] = useState(false);
  const [profileData, setProfileData] = useState<HeaderUser | null>(null);
  const displayUser = user as HeaderUser | null;
  const todayLabel = new Date().toLocaleDateString("en-IN", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });

  const getInitials = (name: string) =>
    name
      .split(" ")
      .filter(Boolean)
      .map((n) => n[0])
      .join("")
      .toUpperCase()
      .slice(0, 2);

  const handleOpenProfile = async () => {
    
    setProfileData(null);
    setProfileOpen(true);

    const { data, error } = await supabase
      .from("employees")
      .select(`
        *,
        branches:branch_id (
          branch_name
        ),
        roles:role_id (
          name
        )
      `)
      .eq("user_id", user?.user_id)
      .maybeSingle();

    if (error) {
      toast.error("Failed to load profile");
      return;
    }

    setProfileData(data);
  };

  return (
    <header className="sticky top-0 z-30 border-b border-border/70 bg-background/85 backdrop-blur-xl">
      <div className="flex min-h-16 items-center justify-between gap-4 px-4 py-3 md:px-6">
        {/* Left */}
        <div className="flex min-w-0 items-center gap-3">
          {isMobile && (
            <Button
              variant="ghost"
              size="icon"
              onClick={onOpenMobileSidebar}
            >
              <Menu className="w-5 h-5" />
            </Button>
          )}

          <div className="min-w-0">
            <h1 className="truncate text-xl font-bold text-foreground md:text-2xl">
              {title}
            </h1>
            {subtitle && (
              <p className="text-sm text-muted-foreground truncate">
                {subtitle}
              </p>
            )}
          </div>
        </div>

        {/* Right */}
        <div className="flex shrink-0 items-center gap-2 md:gap-3">
          <div className="hidden items-center gap-2 rounded-lg border bg-card/80 px-3 py-2 text-sm text-muted-foreground shadow-sm md:flex">
            <CalendarDays className="h-4 w-4" />
            <span>{todayLabel}</span>
          </div>

          {/* Notifications */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" size="icon" className="relative bg-card/80">
                <Bell className="w-5 h-5" />
                <Badge className="absolute -right-1 -top-1 h-5 w-5 justify-center border-background bg-destructive p-0 text-[10px]">
                  5
                </Badge>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-72">
              <DropdownMenuLabel>Notifications</DropdownMenuLabel>
              <DropdownMenuSeparator />
              {["New lead assigned", "Site visit scheduled", "Payment follow-up due"].map((item) => (
                <DropdownMenuItem key={item} className="rounded-md py-3">
                  <div>
                    <p className="text-sm font-medium">{item}</p>
                    <p className="text-xs text-muted-foreground">Review from your dashboard</p>
                  </div>
                </DropdownMenuItem>
              ))}
            </DropdownMenuContent>
          </DropdownMenu>

          {/* User menu */}
          {displayUser && (
            <>
              <DropdownMenu><DropdownMenuTrigger asChild>
                <Button
                  variant="outline"
                  className="
                    h-10 rounded-lg bg-card/80 px-2 gap-2 shadow-sm
                    transition-colors
                    hover:bg-muted
                    data-[state=open]:bg-muted
                    min-w-0 max-w-[280px]
                  "
                >
                  <Avatar className="h-8 w-8 shrink-0">
                    <AvatarFallback className="bg-primary text-primary-foreground text-xs font-semibold">
                      {getInitials(displayUser.name ?? "")}
                    </AvatarFallback>
                  </Avatar>

                  <div className="hidden lg:flex items-center gap-2 min-w-0 max-w-[200px]">
                    <span className="text-sm font-medium truncate text-foreground">
                      {displayUser.name}
                    </span>
                  </div>

                  <ChevronDown className="h-4 w-4 opacity-60 shrink-0" />
                </Button>

              </DropdownMenuTrigger>

                <DropdownMenuContent
                  align="end"
                  className="w-64 p-0 overflow-hidden"
                >
                  <DropdownMenuLabel className="p-0">
                    <div className="flex items-center gap-3 p-4">
                      <Avatar className="h-10 w-10 shrink-0">
                        <AvatarFallback className="bg-primary text-primary-foreground text-sm font-semibold">
                          {getInitials(displayUser.name ?? "")}
                        </AvatarFallback>
                      </Avatar>
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-2">
                          <p className="text-sm font-semibold truncate">
                            {displayUser.name}
                          </p>
                        </div>
                        {displayUser.employee_code && (
                          <p className="text-xs text-muted-foreground truncate">
                            {displayUser.employee_code}
                          </p>
                        )}
                        {displayUser.role && (
                          <Badge className="h-5 px-2 text-[11px] font-medium shrink-0">
                            {String(displayUser.role).toUpperCase()}
                          </Badge>
                        )}
                      </div>
                    </div>
                  </DropdownMenuLabel>

                  <DropdownMenuSeparator />

                  <div className="p-2">
                    <DropdownMenuItem className="rounded-md" onClick={handleOpenProfile}>
                      <User className="w-4 h-4 mr-2 opacity-80" />
                      View Profile
                    </DropdownMenuItem>
                    <DropdownMenuItem className="rounded-md" onClick={() => setPasswordOpen(true)}>
                      <User className="w-4 h-4 mr-2 opacity-80" />
                      Change Password
                    </DropdownMenuItem>
                  </div>

                  <DropdownMenuSeparator />

                  <div className="p-2">
                    <DropdownMenuItem
                      onClick={logout}
                      className="rounded-md text-destructive"
                    >
                      <LogOut className="w-4 h-4 mr-2" />
                      Sign Out
                    </DropdownMenuItem>
                  </div>
                </DropdownMenuContent>
              </DropdownMenu>

              {/* Dialogs */}
              <EmployeeProfileDialog
                open={profileOpen}
                onOpenChange={setProfileOpen}
                employee={profileData}
              />
              <ChangePasswordDialog
                open={passwordOpen}
                onOpenChange={setPasswordOpen}
                employeeCode={displayUser.employee_code ?? ""}
              />
            </>
          )}
        </div>
      </div>
    </header>
  );
}
