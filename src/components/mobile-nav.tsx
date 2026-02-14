"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { LayoutDashboard, Calendar, Users, ArrowLeftRight } from "lucide-react";
import { cn } from "@/lib/utils";

const navItems = [
  { href: "/dashboard", label: "Home", icon: LayoutDashboard },
  { href: "/dashboard/events", label: "Events", icon: Calendar },
  { href: "/dashboard/family", label: "Family", icon: Users },
  { href: "/dashboard/returns", label: "Returns", icon: ArrowLeftRight },
];

export function MobileNav() {
  const pathname = usePathname();

  return (
    <nav className="lg:hidden fixed bottom-0 left-0 right-0 z-50 bg-slate-950/95 backdrop-blur-xl border-t border-slate-800 safe-bottom">
      <div className="flex items-center justify-around px-2 py-1">
        {navItems.map((item) => {
          const isActive =
            item.href === "/dashboard"
              ? pathname === "/dashboard"
              : pathname.startsWith(item.href);
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "flex flex-col items-center gap-1 px-3 py-2 rounded-xl min-w-[60px] transition-all",
                isActive
                  ? "text-indigo-400"
                  : "text-slate-500 active:text-slate-300"
              )}
            >
              <item.icon className="h-6 w-6" />
              <span className="text-[10px] font-medium">{item.label}</span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
