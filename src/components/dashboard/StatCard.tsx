import { ReactNode } from "react";
import { cn } from "@/lib/utils";
import { LucideIcon, TrendingUp, TrendingDown } from "lucide-react";

interface StatCardProps {
  title: string;
  value: string | number;
  change?: {
    value: number;
    type: "increase" | "decrease";
  };
  icon: LucideIcon;
  variant?: "default" | "accent" | "primary" | "success";
  className?: string;
}

export function StatCard({
  title,
  value,
  change,
  icon: Icon,
  variant = "default",
  className,
}: StatCardProps) {
  const variants = {
    default: "stat-card",
    accent: "stat-card stat-card-accent",
    primary: "stat-card stat-card-primary",
    success: "stat-card stat-card-success",
  };

  const isLight = variant !== "default";

  return (
    <div className={cn(variants[variant], className)}>
      <div className="flex items-start justify-between gap-4">
        <div className="min-w-0 space-y-2">
          <p
            className={cn(
              "text-sm font-semibold",
              isLight ? "text-white/80" : "text-muted-foreground"
            )}
          >
            {title}
          </p>
          <p
            className={cn(
              "truncate text-2xl font-bold tracking-tight md:text-3xl",
              isLight ? "text-white" : "text-foreground"
            )}
          >
            {value}
          </p>
          {change && (
            <div className="flex flex-wrap items-center gap-1">
              {change.type === "increase" ? (
                <TrendingUp
                  className={cn(
                    "w-4 h-4",
                    isLight ? "text-white/80" : "text-success"
                  )}
                />
              ) : (
                <TrendingDown
                  className={cn(
                    "w-4 h-4",
                    isLight ? "text-white/80" : "text-destructive"
                  )}
                />
              )}
              <span
                className={cn(
                  "text-sm font-medium",
                  isLight
                    ? "text-white/80"
                    : change.type === "increase"
                    ? "text-success"
                    : "text-destructive"
                )}
              >
                {change.value}%
              </span>
              <span
                className={cn(
                  "text-sm",
                  isLight ? "text-white/60" : "text-muted-foreground"
                )}
              >
                vs last month
              </span>
            </div>
          )}
        </div>
        <div
          className={cn(
            "rounded-lg p-3 shadow-sm",
            isLight ? "bg-white/20" : "bg-accent/10"
          )}
        >
          <Icon
            className={cn("w-6 h-6", isLight ? "text-white" : "text-accent")}
          />
        </div>
      </div>
    </div>
  );
}
