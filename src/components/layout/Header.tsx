import { 
  Bell, LogOut, User, ChevronDown, Menu, Eye, EyeOff, CalendarDays, Search 
} from "lucide-react";
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

/* ================= HEADER COMPONENT ================= */

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
    <header className="sticky top-0 z-30 border-b border-border/40 bg-background/60 backdrop-blur-xl shadow-sm">
      <div className="flex min-h-16 items-center justify-between gap-4 px-4 py-3 md:px-6">
        
        {/* Left Section */}
        <div className="flex min-w-0 items-center gap-3 md:w-1/3">
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
            <h1 className="truncate text-xl font-bold text-foreground md:text-2xl tracking-tight">
              {title}
            </h1>
            {subtitle && (
              <p className="text-sm text-muted-foreground truncate">
                {subtitle}
              </p>
            )}
          </div>
        </div>

        {/* Middle Section - Search Bar (Hidden on small screens) */}
        <div className="hidden flex-1 items-center justify-center px-4 md:flex max-w-md w-full">
          <div className="relative w-full group">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground transition-colors group-focus-within:text-primary" />
            <Input
              type="search"
              placeholder="Search anything..."
              className="w-full rounded-full bg-muted/40 pl-10 pr-4 transition-all focus-visible:bg-background focus-visible:ring-2 focus-visible:ring-primary/20"
            />
          </div>
        </div>

        {/* Right Section */}
        <div className="flex shrink-0 items-center justify-end gap-2 md:gap-4 md:w-1/3">
          
          <div className="hidden items-center gap-2 rounded-full border border-border/50 bg-card/50 px-4 py-1.5 text-sm font-medium text-muted-foreground shadow-sm md:flex backdrop-blur-sm">
            <CalendarDays className="h-4 w-4" />
            <span>{todayLabel}</span>
          </div>

          {/* Notifications */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" size="icon" className="relative bg-card/50 rounded-full hover:bg-muted transition-colors border-border/50">
                <Bell className="w-5 h-5" />
                <span className="absolute right-1 top-1 flex h-2.5 w-2.5">
                  <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-destructive opacity-75"></span>
                  <span className="relative inline-flex h-2.5 w-2.5 rounded-full bg-destructive"></span>
                </span>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-80 rounded-xl p-2">
              <DropdownMenuLabel className="font-semibold text-base px-2">Notifications</DropdownMenuLabel>
              <DropdownMenuSeparator />
              {["New lead assigned to you", "Site visit scheduled for tomorrow", "Payment follow-up due"].map((item, i) => (
                <DropdownMenuItem key={i} className="rounded-lg p-3 my-1 cursor-pointer hover:bg-muted/50 transition-colors">
                  <div className="flex flex-col gap-1">
                    <p className="text-sm font-medium leading-none">{item}</p>
                    <p className="text-xs text-muted-foreground">Review from your dashboard</p>
                  </div>
                </DropdownMenuItem>
              ))}
            </DropdownMenuContent>
          </DropdownMenu>

          {/* User Profile Menu */}
          {displayUser && (
            <>
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button
                    variant="ghost"
                    className="h-10 rounded-full border border-border/50 bg-card/50 px-1.5 gap-2 shadow-sm transition-all hover:bg-muted data-[state=open]:bg-muted min-w-0 max-w-[280px]"
                  >
                    <Avatar className="h-8 w-8 shrink-0">
                      <AvatarFallback className="bg-primary/10 text-primary text-xs font-bold">
                        {getInitials(displayUser.name ?? "")}
                      </AvatarFallback>
                    </Avatar>

                    <div className="hidden lg:flex items-center gap-2 min-w-0 pr-2">
                      <span className="text-sm font-semibold truncate text-foreground">
                        {displayUser.name}
                      </span>
                      <ChevronDown className="h-4 w-4 opacity-50 shrink-0" />
                    </div>
                  </Button>
                </DropdownMenuTrigger>

                <DropdownMenuContent
                  align="end"
                  className="w-72 p-0 overflow-hidden rounded-xl border-border/50 shadow-lg"
                >
                  <DropdownMenuLabel className="p-0 bg-muted/30">
                    <div className="flex items-center gap-3 p-4">
                      <Avatar className="h-12 w-12 shrink-0 border-2 border-background shadow-sm">
                        <AvatarFallback className="bg-primary text-primary-foreground text-sm font-bold">
                          {getInitials(displayUser.name ?? "")}
                        </AvatarFallback>
                      </Avatar>
                      <div className="min-w-0 flex-1">
                        <p className="text-base font-bold truncate text-foreground">
                          {displayUser.name}
                        </p>
                        {displayUser.employee_code && (
                          <p className="text-xs font-medium text-muted-foreground truncate mb-1">
                            ID: {displayUser.employee_code}
                          </p>
                        )}
                        {displayUser.role && (
                          <Badge variant="secondary" className="h-5 px-2 text-[10px] font-bold shrink-0 tracking-wider">
                            {String(displayUser.role).toUpperCase()}
                          </Badge>
                        )}
                      </div>
                    </div>
                  </DropdownMenuLabel>

                  <DropdownMenuSeparator className="m-0" />

                  <div className="p-2 space-y-1">
                    <DropdownMenuItem className="rounded-lg p-2.5 cursor-pointer" onClick={handleOpenProfile}>
                      <User className="w-4 h-4 mr-3 text-muted-foreground" />
                      <span className="font-medium">View Profile</span>
                    </DropdownMenuItem>
                    <DropdownMenuItem className="rounded-lg p-2.5 cursor-pointer" onClick={() => setPasswordOpen(true)}>
                      <User className="w-4 h-4 mr-3 text-muted-foreground" />
                      <span className="font-medium">Change Password</span>
                    </DropdownMenuItem>
                  </div>

                  <DropdownMenuSeparator className="m-0" />

                  <div className="p-2">
                    <DropdownMenuItem
                      onClick={logout}
                      className="rounded-lg p-2.5 cursor-pointer text-destructive focus:text-destructive focus:bg-destructive/10"
                    >
                      <LogOut className="w-4 h-4 mr-3" />
                      <span className="font-medium">Sign Out</span>
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