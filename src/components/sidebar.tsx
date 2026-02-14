"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { signOut, useSession } from "next-auth/react";
import {
  LayoutDashboard,
  Calendar,
  Users,
  ArrowLeftRight,
  LogOut,
  ChevronLeft,
  ChevronRight,
  Settings,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { useState } from "react";

const navItems = [
  { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { href: "/dashboard/events", label: "Events", icon: Calendar },
  { href: "/dashboard/family", label: "Family", icon: Users },
  { href: "/dashboard/returns", label: "Returns", icon: ArrowLeftRight },
  { href: "/dashboard/settings", label: "Settings", icon: Settings },
];

export function Sidebar() {
  const pathname = usePathname();
  const { data: session } = useSession();
  const [collapsed, setCollapsed] = useState(false);

  return (
    <aside
      className={cn(
        "hidden lg:flex flex-col h-screen bg-slate-950 border-r border-slate-800 transition-all duration-300 sticky top-0",
        collapsed ? "w-[72px]" : "w-64"
      )}
    >
      {/* Logo + Toggle */}
      <div className={cn(
        "flex items-center h-16 border-b border-slate-800",
        collapsed ? "justify-center px-2" : "justify-between px-4"
      )}>
        {collapsed ? (
          <button
            onClick={() => setCollapsed(false)}
            className="w-10 h-10 rounded-xl bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center flex-shrink-0 hover:opacity-90 transition-opacity cursor-pointer"
            title="Expand sidebar"
          >
            <ChevronRight className="h-5 w-5 text-white" />
          </button>
        ) : (
          <>
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center flex-shrink-0">
                <span className="text-lg font-bold text-white">M</span>
              </div>
              <span className="text-lg font-bold text-white tracking-tight">
                Moi Ledger
              </span>
            </div>
            <Button
              variant="ghost"
              size="icon"
              className="text-slate-400 hover:text-white h-8 w-8"
              onClick={() => setCollapsed(true)}
            >
              <ChevronLeft className="h-4 w-4" />
            </Button>
          </>
        )}
      </div>

      {/* Navigation */}
      <nav className="flex-1 py-4 px-3 space-y-1">
        {navItems.map((item) => {
          const isActive =
            item.href === "/dashboard"
              ? pathname === "/dashboard"
              : pathname.startsWith(item.href);
          return (
            <Link
              key={item.href}
              href={item.href}
              title={collapsed ? item.label : undefined}
              className={cn(
                "flex items-center gap-3 px-3 py-3 rounded-xl text-sm font-medium transition-all duration-200",
                collapsed && "justify-center px-0",
                isActive
                  ? "bg-gradient-to-r from-indigo-600/20 to-purple-600/20 text-white border border-indigo-500/30"
                  : "text-slate-400 hover:text-white hover:bg-slate-800/50"
              )}
            >
              <item.icon className={cn("h-5 w-5 flex-shrink-0", isActive && "text-indigo-400")} />
              {!collapsed && <span>{item.label}</span>}
            </Link>
          );
        })}
      </nav>

      {/* User section */}
      <div className="border-t border-slate-800 p-3">
        <div className={cn("flex items-center gap-3 px-3 py-2", collapsed && "justify-center px-0")}>
          <div className="w-8 h-8 rounded-full bg-gradient-to-br from-emerald-500 to-teal-600 flex items-center justify-center flex-shrink-0">
            <span className="text-xs font-bold text-white">
              {session?.user?.name?.charAt(0)?.toUpperCase() || "U"}
            </span>
          </div>
          {!collapsed && (
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-white truncate">
                {session?.user?.name}
              </p>
              <p className="text-xs text-slate-500 truncate">
                {session?.user?.email}
              </p>
            </div>
          )}
        </div>
        <Button
          variant="ghost"
          className={cn(
            "w-full mt-2 text-slate-400 hover:text-red-400 hover:bg-red-500/10",
            collapsed ? "px-0 justify-center" : "justify-start"
          )}
          onClick={() => signOut({ callbackUrl: "/login" })}
        >
          <LogOut className="h-4 w-4" />
          {!collapsed && <span className="ml-2">Sign Out</span>}
        </Button>
      </div>
    </aside>
  );
}
