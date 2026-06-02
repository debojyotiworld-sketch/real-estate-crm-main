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
          className="fixed inset-0 bg-black/60 backdrop-blur-sm z-40 lg:hidden animate-in fade-in duration-300"
          onClick={close}
        />
      )}

      <aside
        className={cn(
          "fixed left-0 top-0 z-50 flex h-screen flex-col border-r border-white/5 bg-sidebar/95 backdrop-blur-md shadow-2xl transition-all duration-300 ease-in-out",
          sidebarWidth,
          isMobile && !isOpen && "-translate-x-full",
          isMobile && isOpen && "translate-x-0"
        )}
      >
        {/* Logo / Brand header */}
        <div className={cn("flex h-20 items-center gap-4 border-b border-white/5 px-5", isCollapsed && !isMobile && "justify-center px-2")}>
          <div className="flex h-11 w-11 flex-shrink-0 items-center justify-center rounded-xl bg-white/5 p-2 shadow-inner ring-1 ring-white/10 transition-transform duration-300 hover:scale-105">
            <img src="/favicon.ico" alt="Logo" className="w-full h-full object-contain" />
          </div>

          <div className={cn("min-w-0 transition-all duration-300", isCollapsed && !isMobile ? "opacity-0 hidden" : "opacity-100 block")}>
            <div className="font-bold tracking-wide leading-tight truncate text-white">Phoenix</div>
            <div className="text-[12px] font-medium mt-0.5 tracking-wider truncate text-orange-400/80 uppercase">
              Real Estate CRM
            </div>
          </div>
        </div>

        {/* Nav */}
        <nav className="custom-scrollbar px-3 py-6 md:h-[calc(100vh-5rem)] md:overflow-y-auto">
          <div className="space-y-1.5">
            {loading ? (
              <div className="flex flex-col items-center justify-center py-12 gap-3 text-slate-400">
                <Loader2 className="h-6 w-6 animate-spin text-orange-500" />
                {!isCollapsed && <span className="text-sm font-medium animate-pulse">Loading modules...</span>}
              </div>
            ) : modules.length === 0 ? (
              <div className={cn("rounded-xl border border-white/5 bg-white/5 p-4 text-center text-sm font-medium text-slate-400 shadow-inner", isCollapsed && !isMobile && "hidden")}>
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
                  className={cn(
                    "group relative flex items-center gap-3.5 rounded-xl px-3 py-2.5 text-sm font-medium transition-all duration-300 overflow-hidden",
                    isCollapsed && !isMobile && "justify-center",
                    active
                      ? "bg-gradient-to-r from-orange-500/10 to-transparent text-orange-400 border border-orange-500/20 shadow-sm"
                      : "text-slate-400 border border-transparent hover:bg-white/5 hover:text-slate-100 hover:border-white/5"
                  )}
                >
                  {/* Subtle active indicator dot for collapsed view */}
                  {active && isCollapsed && !isMobile && (
                    <span className="absolute left-1 top-1/2 -translate-y-1/2 h-1.5 w-1.5 rounded-full bg-orange-500" />
                  )}
                  
                  <Icon
                    className={cn(
                      "w-5 h-5 flex-shrink-0 transition-all duration-300",
                      active ? "text-orange-400 drop-shadow-sm scale-110" : "text-slate-400 group-hover:scale-110 group-hover:text-slate-200"
                    )}
                  />
                  <span className={cn("truncate tracking-wide", isCollapsed && !isMobile && "hidden")}>
                    {m.name}
                  </span>
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
            className="absolute -right-3.5 top-24 h-7 w-7 rounded-full border border-white/10 bg-sidebar text-slate-300 shadow-xl hover:bg-white/10 hover:text-white transition-all duration-300 z-50 hover:scale-110"
            onClick={() => setCollapsed(!isCollapsed)}
          >
            {isCollapsed ? <ChevronRight className="w-4 h-4" /> : <ChevronLeft className="w-4 h-4" />}
          </Button>
        )}
      </aside>
    </>
  );
}