import { cn } from "@/lib/utils";
import { LucideIcon } from "lucide-react";

interface StatCardProps {
  title: string;
  value: string | number;
  subtitle?: string;
  icon: LucideIcon;
  trend?: "up" | "down" | "neutral";
  className?: string;
  iconClassName?: string;
}

export function StatCard({
  title,
  value,
  subtitle,
  icon: Icon,
  trend,
  className,
  iconClassName,
}: StatCardProps) {
  return (
    <div
      className={cn(
        "rounded-2xl border border-slate-800 bg-slate-900/50 p-5 backdrop-blur-sm",
        className
      )}
    >
      <div className="flex items-start justify-between">
        <div className="space-y-2">
          <p className="text-sm text-slate-400 font-medium">{title}</p>
          <p className="text-2xl font-bold text-white tracking-tight">
            {typeof value === "number" ? `₹${value.toLocaleString("en-IN")}` : value}
          </p>
          {subtitle && (
            <p
              className={cn(
                "text-xs font-medium",
                trend === "up"
                  ? "text-emerald-400"
                  : trend === "down"
                  ? "text-red-400"
                  : "text-slate-500"
              )}
            >
              {subtitle}
            </p>
          )}
        </div>
        <div
          className={cn(
            "w-12 h-12 rounded-xl flex items-center justify-center",
            iconClassName || "bg-indigo-500/10"
          )}
        >
          <Icon
            className={cn(
              "h-6 w-6",
              iconClassName?.includes("emerald")
                ? "text-emerald-400"
                : iconClassName?.includes("orange")
                ? "text-orange-400"
                : iconClassName?.includes("red")
                ? "text-red-400"
                : "text-indigo-400"
            )}
          />
        </div>
      </div>
    </div>
  );
}
