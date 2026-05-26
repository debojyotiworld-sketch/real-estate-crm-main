import { ReactNode } from "react";
import { Sidebar } from "./Sidebar";
import { Header } from "./Header";
import { useSidebar } from "@/hooks/useSidebar";
import { useIsMobile } from "@/hooks/use-mobile";
import { cn } from "@/lib/utils";

interface MainLayoutProps {
  children: ReactNode;
  title: string;
  subtitle?: string;
}

export function MainLayout({ children, title, subtitle }: MainLayoutProps) {
  const { isCollapsed, open, setOpen } = useSidebar(); // add these
  const isMobile = useIsMobile();

  const openMobileSidebar = () => {
    if (typeof open === "function") return open();
    if (typeof setOpen === "function") return setOpen(true);
  };

  return (
    <div className="min-h-screen bg-background">
      <Sidebar />

      <div
        className={cn(
          "min-h-screen flex-1 transition-all duration-300",
          isMobile ? "pl-0 pb-16" : isCollapsed ? "pl-20" : "pl-64"
        )}
      >
        <Header
          title={title}
          subtitle={subtitle}
          isMobile={isMobile}
          onOpenMobileSidebar={openMobileSidebar}
        />

        <main className="mx-auto w-full max-w-[1560px] p-4 md:p-6 lg:p-8">
          <div className="animate-fade-in">{children}</div>
        </main>
      </div>
    </div>
  );
}
