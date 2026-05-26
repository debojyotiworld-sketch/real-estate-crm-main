import { Link, useLocation } from "react-router-dom";
import { useEffect, useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import * as LucideIcons from "lucide-react";
import { ChevronLeft, ChevronRight, Loader2, type LucideIcon } from "lucide-react";
import { useIsMobile } from "@/hooks/use-mobile";
import { useSidebar } from "@/hooks/useSidebar";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";

type Module = {
  id: string;
  name: string;
  route: string;
  icon: string;
  order_no: number;
};

type RoleModuleRow = {
  modules: (Module & { status?: string | null }) | null;
};

// UI-only: resolve lucide icon name from DB, fallback safe
function resolveIcon(iconName: string): LucideIcon {
  const Icon = (LucideIcons as unknown as Record<string, LucideIcon>)[iconName];
  return Icon ?? LucideIcons.LayoutDashboard;
}

function normalizeRoute(route: string): string {
  const clean = (route ?? "").trim();
  const stripped = clean.replace(/^\/?dashboards\/?/, "");

  if (stripped === "" || stripped === "/") return "/dashboard";
  return stripped.startsWith("/") ? stripped : `/${stripped}`;
}

export function Sidebar() {
  const location = useLocation();
  const { user } = useAuth();

  const { isOpen, isCollapsed, close, setCollapsed } = useSidebar();
  const isMobile = useIsMobile();

  const [modules, setModules] = useState<Module[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchModules();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user?.id]);

  useEffect(() => {
    if (isMobile) {
      close();
    }
  }, [location.pathname, isMobile, close]);

  useEffect(() => {
    if (isMobile && isOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
    return () => {
      document.body.style.overflow = "";
    };
  }, [isMobile, isOpen]);

  const sidebarWidth = isMobile ? "w-72" : isCollapsed ? "w-20" : "w-64";

  const fetchModules = async () => {
    try {
      if (!user?.id) {
        setModules([]);
        setLoading(false);
        return;
      }

      setLoading(true);

      const { data: profile, error: pErr } = await supabase
        .from("profiles")
        .select("role_id")
        .eq("id", user.id)
        .maybeSingle();

      if (pErr) throw pErr;

      const roleId = profile?.role_id;

      if (!roleId) {
        setModules([]);
        return;
      }

      const { data: roleData, error: rErr } = await supabase
        .from("roles")
        .select("name")
        .eq("id", roleId)
        .maybeSingle();

      if (rErr) throw rErr;

      const roleName = (roleData?.name ?? "").toLowerCase();

      const isPrivileged = ["admin", "hr", "manager"].includes(roleName);

      if (isPrivileged) {
        const { data, error } = await supabase
          .from("modules")
          .select("id, name, icon, route, order_no")
          .eq("status", "Active")
          .order("order_no");

        if (error) throw error;

        setModules(data ?? []);
        return;
      }

      const { data, error } = await supabase
        .from("role_modules")
        .select("module_id, modules:module_id(id, name, icon, route, order_no, status)")
        .eq("role_id", roleId);

      if (error) throw error;

      const allowed = ((data ?? []) as RoleModuleRow[])
        .map((row) => row.modules)
        .filter((module): module is Module & { status?: string | null } => Boolean(module && module.status === "Active"))
        .sort((a, b) => (a.order_no ?? 0) - (b.order_no ?? 0));

      setModules(allowed);
    } catch (err) {
      console.error("Sidebar fetchModules error:", err);
      setModules([]);
    } finally {
      setLoading(false);
    }
  };
  return (
    <>
      {/* Mobile Overlay */}
      {isMobile && isOpen && (
        <div
          className="fixed inset-0 bg-black/50 z-40 lg:hidden animate-fade-in"
          onClick={close}
        />
      )}

      <aside
        className={cn(
          "fixed left-0 top-0 z-50 flex h-screen flex-col border-r border-white/10 bg-sidebar shadow-xl transition-all duration-300",
          sidebarWidth,
          isMobile && !isOpen && "-translate-x-full",
          isMobile && isOpen && "translate-x-0"
        )}
      >
        {/* Logo / Brand header */}
        <div className={cn("flex h-16 items-center gap-3 border-b border-white/10 px-4", isCollapsed && !isMobile && "justify-center px-3")}>
          <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-lg bg-white shadow-sm">
            <img src="/favicon.ico" alt="Logo" className="w-full h-full object-contain" />
          </div>

          <div className={cn("min-w-0 transition-opacity", isCollapsed && !isMobile && "hidden")}>
            <div className="font-semibold leading-tight truncate text-white">Phoenix</div>
            <div className="text-[11px] -mt-0.5 truncate text-slate-400">
              Real Estate CRM
            </div>
          </div>
        </div>

        {/* Nav */}
        <nav className="custom-scrollbar p-3 md:h-[calc(100vh-4rem)] md:overflow-y-auto">
          <div className="space-y-1">
            {loading ? (
              <div className="flex items-center justify-center py-8 text-slate-400">
                <Loader2 className="h-5 w-5 animate-spin" />
              </div>
            ) : modules.length === 0 ? (
              <div className={cn("rounded-lg border border-white/10 bg-white/5 p-3 text-xs text-slate-400", isCollapsed && !isMobile && "hidden")}>
                No modules assigned
              </div>
            ) : modules.map((m) => {
              const route = normalizeRoute(m.route);
              const active = location.pathname.startsWith(route);
              const Icon = resolveIcon(m.icon);

              return (
                <Link
                  key={m.id}
                  to={route}
                  title={m.name}
                  className={[
                    "group relative flex items-center gap-3",
                    "px-3 py-2.5 rounded-lg",
                    "text-sm font-medium transition-all duration-200",
                    isCollapsed && !isMobile ? "justify-center" : "border-l-4",
                    active
                      ? "bg-white/10 text-white border-orange-500 shadow-sm"
                      : "text-slate-300 border-transparent hover:bg-white/5 hover:text-white",
                  ].join(" ")}
                >
                  <Icon
                    className={[
                      "w-5 h-5 flex-shrink-0 transition-colors",
                      active ? "text-orange-400" : "text-slate-400 group-hover:text-slate-200",
                    ].join(" ")}
                  />
                  <span className={cn("truncate", isCollapsed && !isMobile && "hidden")}>{m.name}</span>
                </Link>
              );
            })}
          </div>
        </nav>

        {/* Collapse button - Desktop only */}
        {!isMobile && (
          <Button
            variant="ghost"
            size="icon"
            className="absolute -right-3 top-20 h-7 w-7 rounded-full border border-border bg-card text-foreground shadow-md hover:bg-muted"
            onClick={() => setCollapsed(!isCollapsed)}
          >
            {isCollapsed ? <ChevronRight className="w-4 h-4" /> : <ChevronLeft className="w-4 h-4" />}
          </Button>
        )}
      </aside>
    </>
  );
}
